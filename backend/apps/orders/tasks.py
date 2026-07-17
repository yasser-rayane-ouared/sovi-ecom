"""Celery tasks for order and shipping synchronization."""
from celery import shared_task
import requests
import logging
from django.utils import timezone
from apps.delivery.models import Shipment, StoreDeliveryConfig
from apps.orders.models import Order, OrderStatusHistory
from apps.integrations.tasks import sync_order_to_google_sheet
from apps.orders.views import ECOTRACK_COMPANIES

logger = logging.getLogger(__name__)

@shared_task
def sync_all_stores_tracking():
    """
    Periodic task running every 2 hours to fetch tracking status
    updates from Yalidine and Ecotrack APIs for all active shipments.
    """
    logger.info("Starting background shipping status sync for all stores.")
    active_shipments = Shipment.objects.filter(
        status__in=['created', 'picked_up', 'in_transit', 'out_for_delivery']
    ).select_related('order', 'company', 'store')
    
    if not active_shipments.exists():
        logger.info("No active shipments to sync.")
        return "No active shipments found."

    # Group shipments by store
    store_shipments_map = {}
    for shipment in active_shipments:
        store_id = shipment.store.id
        if store_id not in store_shipments_map:
            store_shipments_map[store_id] = []
        store_shipments_map[store_id].append(shipment)

    total_synced = 0
    total_updated = 0

    for store_id, shipments in store_shipments_map.items():
        # Get active configs for this store
        configs = StoreDeliveryConfig.objects.filter(store_id=store_id, is_active=True).select_related('company')
        config_map = {cfg.company.name: cfg for cfg in configs}

        # Process Yalidine shipments
        yalidine_config = config_map.get('yalidine')
        yalidine_shipments = [s for s in shipments if s.company.name == 'yalidine']

        if yalidine_shipments and yalidine_config and yalidine_config.api_id and yalidine_config.api_key:
            tracking_numbers = [s.tracking_number for s in yalidine_shipments if s.tracking_number]
            if tracking_numbers:
                # Fetch in batches of 20 tracking numbers
                batch_size = 20
                for i in range(0, len(tracking_numbers), batch_size):
                    batch_numbers = tracking_numbers[i:i+batch_size]
                    tracking_str = ','.join(batch_numbers)
                    
                    try:
                        headers = {
                            'X-API-ID': yalidine_config.api_id,
                            'X-API-Token': yalidine_config.api_key,
                            'Content-Type': 'application/json',
                        }
                        resp = requests.get(
                            f'https://api.yalidine.app/v1/tracking/{tracking_str}',
                            headers=headers,
                            timeout=15
                        )
                        
                        if resp.status_code == 200:
                            tracking_data = resp.json()
                            data = tracking_data.get('data', {})
                            
                            info_map = {}
                            if isinstance(data, dict):
                                info_map = data
                            elif isinstance(data, list):
                                for item in data:
                                    if isinstance(item, dict) and item.get('tracking'):
                                        info_map[str(item['tracking'])] = item

                            for shipment in yalidine_shipments:
                                if shipment.tracking_number not in batch_numbers:
                                    continue
                                
                                t_num = shipment.tracking_number
                                shipment_info = info_map.get(t_num)
                                if not shipment_info:
                                    continue
                                
                                total_synced += 1
                                ext_status = shipment_info.get('status', '').strip()
                                
                                new_shipment_status = shipment.status
                                new_order_status = shipment.order.status
                                
                                ext_status_lower = ext_status.lower()
                                if 'livr' in ext_status_lower:
                                    new_shipment_status = 'delivered'
                                    new_order_status = 'delivered'
                                elif any(x in ext_status_lower for x in ['retour', 'echou', 'refus']):
                                    new_shipment_status = 'returned'
                                    new_order_status = 'returned'
                                elif 'livraison' in ext_status_lower:
                                    new_shipment_status = 'out_for_delivery'
                                    new_order_status = 'shipped'
                                elif any(x in ext_status_lower for x in ['expédi', 'reçu', 'centre', 'transfert', 'en voyage']):
                                    new_shipment_status = 'in_transit'
                                    new_order_status = 'shipped'
                                elif 'annul' in ext_status_lower:
                                    new_shipment_status = 'failed'
                                    new_order_status = 'cancelled'

                                changed = False
                                if shipment.status != new_shipment_status:
                                    shipment.status = new_shipment_status
                                    changed = True
                                
                                if ext_status and shipment.status_message != ext_status:
                                    shipment.status_message = ext_status
                                    changed = True
                                    
                                if changed:
                                    shipment.save()
                                    
                                if shipment.order.status != new_order_status:
                                    old_ord_status = shipment.order.status
                                    shipment.order.status = new_order_status
                                    shipment.order.save()
                                    
                                    OrderStatusHistory.objects.create(
                                        order=shipment.order,
                                        from_status=old_ord_status,
                                        to_status=new_order_status,
                                        note=f'تحديث تلقائي من Yalidine (الخلفية): {ext_status}'
                                    )
                                    
                                    total_updated += 1
                                    try:
                                        sync_order_to_google_sheet.delay(shipment.order.id)
                                    except Exception as sheets_err:
                                        logger.error(f"Failed to queue Google Sheets sync for order {shipment.order.id}: {sheets_err}")
                                        
                    except Exception as e:
                        logger.error(f"Error fetching Yalidine batch tracking details: {e}")

        # Process Ecotrack shipments
        ecotrack_shipments = [s for s in shipments if s.company.name in ECOTRACK_COMPANIES or 'ecotrack' in (s.company.api_base_url or '').lower()]

        # Group ecotrack shipments by company to handle their API configs
        ecotrack_shipments_by_company = {}
        for s in ecotrack_shipments:
            c_name = s.company.name
            if c_name not in ecotrack_shipments_by_company:
                ecotrack_shipments_by_company[c_name] = []
            ecotrack_shipments_by_company[c_name].append(s)

        for c_name, c_shipments in ecotrack_shipments_by_company.items():
            cfg = config_map.get(c_name)
            if not cfg or not cfg.api_key:
                continue

            tracking_numbers = [s.tracking_number for s in c_shipments if s.tracking_number]
            if not tracking_numbers:
                continue

            headers = {
                'Authorization': f'Bearer {cfg.api_key}',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }

            # Resolve base URL from company settings
            base_url = (cfg.company.api_base_url or '').strip()
            if base_url.endswith('/'):
                base_url = base_url[:-1]
            if base_url.endswith('/api/v1'):
                base_url = base_url[:-7]
            elif base_url.endswith('/api'):
                base_url = base_url[:-4]

            domains = []
            if base_url:
                domains.append(base_url)

            # Generate dynamic Ecotrack domains
            slug = c_name
            dash_subdomain = slug.replace('_', '-')
            flat_subdomain = slug.replace('_', '')
            
            domains.append(f"https://{dash_subdomain}.ecotrack.dz")
            domains.append(f"https://{flat_subdomain}.ecotrack.dz")

            # Add known fallbacks for specific companies
            if c_name in ('noest', 'noest_express'):
                domains.extend(['https://noest.ecotrack.dz', 'https://app.noest-dz.com'])
            elif c_name in ('dhd', 'dhd_express'):
                domains.append('https://dhd.ecotrack.dz')
            elif c_name == 'msm_go':
                domains.append('https://msmgo.ecotrack.dz')
            elif c_name == 'ontime_ecotrack':
                domains.append('https://ontime.ecotrack.dz')

            # De-duplicate domains while keeping order
            unique_domains = []
            for d in domains:
                if d not in unique_domains:
                    unique_domains.append(d)

            resp = None
            last_err = None
            endpoints = ['/api/public/get/trackings/info', '/api/v1/get/trackings/info']

            for domain in unique_domains:
                for endpoint in endpoints:
                    url = f"{domain}{endpoint}"
                    try:
                        logger.info("[BACKGROUND SYNC] Fetching %s tracking from: %s", cfg.company.display_name, url)
                        resp = requests.post(
                            url,
                            json={'trackings': tracking_numbers},
                            headers=headers,
                            timeout=15
                        )
                        if resp.status_code != 404:
                            break
                    except requests.RequestException as e:
                        last_err = e
                        logger.warning("[BACKGROUND SYNC] Failed to connect to %s: %s", url, str(e))
                if resp and resp.status_code != 404:
                    break

            if resp and resp.status_code == 200:
                try:
                    tracking_data = resp.json()
                    for shipment in c_shipments:
                        t_num = shipment.tracking_number
                        shipment_info = tracking_data.get(t_num)
                        if not shipment_info:
                            continue

                        total_synced += 1
                        
                        # Resolve the event status
                        ext_status = ""
                        activity = shipment_info.get('activity', [])
                        if activity and isinstance(activity, list):
                            last_event = activity[-1]
                            if isinstance(last_event, dict):
                                ext_status = (
                                    last_event.get('event') or
                                    last_event.get('event_key') or
                                    last_event.get('status') or
                                    last_event.get('status_ar') or
                                    last_event.get('status_fr') or
                                    last_event.get('event_name') or
                                    last_event.get('event_translated') or
                                    last_event.get('description') or
                                    ''
                                )

                        if not ext_status:
                            order_info = shipment_info.get('OrderInfo', {})
                            if isinstance(order_info, dict):
                                ext_status = (
                                    order_info.get('status') or
                                    order_info.get('status_message') or
                                    order_info.get('event') or
                                    order_info.get('last_status') or
                                    ''
                                )

                        if not ext_status:
                            continue

                        ext_status = str(ext_status).strip()
                        ext_status_lower = ext_status.lower()

                        new_shipment_status = shipment.status
                        new_order_status = shipment.order.status

                        # Check Delivered
                        if any(x in ext_status_lower for x in ['livre', 'livred', 'delivered', 'validation_reception_cash', 'encaiss', 'paye', 'تم التسليم', 'مستلم', 'مسلم', 'موزع', 'livré', 'encaissé', 'payé']):
                            new_shipment_status = 'delivered'
                            new_order_status = 'delivered'
                        # Check Returned
                        elif any(x in ext_status_lower for x in ['retour', 'echou', 'refus', 'retour_dispatched', 'colis_retour', 'livraison_echoue', 'failed_attempt', 'تم الإرجاع', 'مرفوض', 'راجع', 'قيد الإرجاع', 'مسترجع', 'ارجاع', 'رجوع', 'رفض', 'echoué', 'echoue', 'refusé', 'refuse', 'retourné', 'retourne', 'echec', 'échec', 'echecs', 'échecs', 'فشل']):
                            new_shipment_status = 'returned'
                            new_order_status = 'returned'
                        # Check Out For Delivery
                        elif any(x in ext_status_lower for x in ['livraison', 'fdr_activated', 'out for delivery', 'قيد التوزيع', 'توزيع', 'مع الموزع', 'خارج للتوصيل']):
                            new_shipment_status = 'out_for_delivery'
                            new_order_status = 'shipped'
                        # Check In Transit
                        elif any(x in ext_status_lower for x in ['expédi', 'reçu', 'centre', 'transfert', 'voyage', 'transit', 'collect', 'picked', 'reception', 'upload', 'validation', 'تم الشحن', 'قيد الشحن', 'شحن', 'في الطريق', 'في المركز', 'مستقبل', 'expedie', 'recu', 'collecté', 'collecte']):
                            new_shipment_status = 'in_transit'
                            new_order_status = 'shipped'
                        # Check Cancelled
                        elif any(x in ext_status_lower for x in ['annul', 'cancel', 'delete', 'ملغي', 'ملغى', 'annulé', 'annule']):
                            new_shipment_status = 'failed'
                            new_order_status = 'cancelled'

                        changed = False
                        if shipment.status != new_shipment_status:
                            shipment.status = new_shipment_status
                            changed = True

                        if ext_status and shipment.status_message != ext_status:
                            shipment.status_message = ext_status
                            changed = True

                        if changed:
                            shipment.save()

                        if shipment.order.status != new_order_status:
                            old_ord_status = shipment.order.status
                            shipment.order.status = new_order_status
                            shipment.order.save()
                            OrderStatusHistory.objects.create(
                                order=shipment.order,
                                from_status=old_ord_status,
                                to_status=new_order_status,
                                note=f'تحديث تلقائي من {cfg.company.display_name} (الخلفية): {ext_status}'
                            )
                            total_updated += 1
                            try:
                                sync_order_to_google_sheet.delay(shipment.order.id)
                            except Exception as sheets_err:
                                logger.error(f"Failed to queue Google Sheets sync for order {shipment.order.id}: {sheets_err}")

                except Exception as e:
                    logger.error(f"Error processing {c_name} tracking details: {e}")
            else:
                logger.error(f"Failed to fetch {c_name} tracking info: {resp.text[:200] if resp else last_err}")

    logger.info(f"Background sync finished. Synced: {total_synced}, Updated: {total_updated}")
    return f"Synced {total_synced} shipments, updated {total_updated} orders."
