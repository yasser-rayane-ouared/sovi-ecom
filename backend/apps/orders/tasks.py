"""Celery tasks for order and shipping synchronization."""
from celery import shared_task
import requests
import logging
from django.utils import timezone
from apps.delivery.models import Shipment
from apps.orders.models import Order, OrderStatusHistory
from apps.stores.models import StoreDeliveryConfig
from apps.integrations.tasks import sync_order_to_google_sheet

logger = logging.getLogger(__name__)

@shared_task
def sync_all_stores_tracking():
    """
    Periodic task running every 2 hours to fetch tracking status
    updates from Yalidine API for all active shipments.
    """
    logger.info("Starting background Yalidine shipping status sync for all stores.")
    active_shipments = Shipment.objects.filter(
        status__in=['created', 'picked_up', 'in_transit', 'out_for_delivery']
    ).select_related('order', 'company', 'store')
    
    if not active_shipments.exists():
        logger.info("No active shipments to sync.")
        return "No active shipments found."

    # Group shipments by store
    store_shipments_map = {}
    for shipment in active_shipments:
        if shipment.company.name != 'yalidine':
            continue
        store_id = shipment.store.id
        if store_id not in store_shipments_map:
            store_shipments_map[store_id] = []
        store_shipments_map[store_id].append(shipment)

    total_synced = 0
    total_updated = 0

    for store_id, shipments in store_shipments_map.items():
        # Get Yalidine config for this store
        yalidine_config = StoreDeliveryConfig.objects.filter(
            store_id=store_id,
            company__name='yalidine',
            is_active=True
        ).first()

        if not yalidine_config or not yalidine_config.api_id or not yalidine_config.api_key:
            logger.info(f"Skipping store {store_id} - Yalidine config missing or inactive.")
            continue

        tracking_numbers = [s.tracking_number for s in shipments if s.tracking_number]
        if not tracking_numbers:
            continue

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

                    for shipment in shipments:
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
                        if 'livr' in ext_status_lower:  # Livré
                            new_shipment_status = 'delivered'
                            new_order_status = 'delivered'
                        elif any(x in ext_status_lower for x in ['retour', 'echou', 'refus']):
                            new_shipment_status = 'returned'
                            new_order_status = 'returned'
                        elif 'livraison' in ext_status_lower:  # Sorti en livraison
                            new_shipment_status = 'out_for_delivery'
                            new_order_status = 'shipped'
                        elif any(x in ext_status_lower for x in ['expédi', 'reçu', 'centre', 'transfert', 'en voyage']):
                            new_shipment_status = 'in_transit'
                            new_order_status = 'shipped'
                        elif 'annul' in ext_status_lower:  # Annulé
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

    logger.info(f"Yalidine background sync finished. Synced: {total_synced}, Updated: {total_updated}")
    return f"Synced {total_synced} shipments, updated {total_updated} orders."
