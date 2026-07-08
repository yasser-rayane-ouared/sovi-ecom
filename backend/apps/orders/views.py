"""Order views."""
import io
import logging
import requests
import pandas as pd
from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.stores.models import Store
from apps.stores.utils import get_store_for_user
from apps.delivery.models import Shipment, StoreDeliveryConfig
from .models import Order, OrderStatusHistory
from .serializers import OrderSerializer, OrderStatusUpdateSerializer

logger = logging.getLogger(__name__)


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    filterset_fields = ['status', 'is_abandoned']
    search_fields = ['order_number', 'full_name', 'phone']
    ordering_fields = ['created_at', 'total', 'status']

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'orders')
        return Order.objects.filter(store=store).select_related(
            'wilaya', 'commune'
        ).prefetch_related('items__product', 'status_history')


class OrderDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'orders')
        return Order.objects.filter(store=store).select_related(
            'wilaya', 'commune'
        ).prefetch_related('items__product', 'status_history')


class OrderStatusUpdateView(APIView):
    def post(self, request, store_id, pk):
        store = get_store_for_user(store_id, request.user, 'orders')
        order = Order.objects.get(id=pk, store=store)
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = order.status
        new_status = serializer.validated_data['status']

        OrderStatusHistory.objects.create(
            order=order,
            from_status=old_status,
            to_status=new_status,
            note=serializer.validated_data.get('note', ''),
        )
        order.status = new_status
        order.save()

        return Response(OrderSerializer(order).data)


class OrderBulkActionView(APIView):
    def post(self, request, store_id):
        store = get_store_for_user(store_id, request.user, 'orders')
        order_ids = request.data.get('order_ids', [])
        action = request.data.get('action', '')
        new_status = request.data.get('status', '')

        if action == 'update_status' and new_status:
            orders = Order.objects.filter(id__in=order_ids, store=store)
            for order in orders:
                old = order.status
                order.status = new_status
                order.save()
                OrderStatusHistory.objects.create(
                    order=order, from_status=old, to_status=new_status, note='Bulk action'
                )
            return Response({'message': f'{orders.count()} orders updated.'})

        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)


class OrderExportView(APIView):
    def get(self, request, store_id):
        store = get_store_for_user(store_id, request.user, 'orders')
        orders = Order.objects.filter(store=store).select_related('wilaya', 'commune').prefetch_related('items')

        ids_filter = request.query_params.get('ids')
        if ids_filter:
            order_ids = ids_filter.split(',')
            orders = orders.filter(id__in=order_ids)

        status_filter = request.query_params.get('status')
        if status_filter:
            orders = orders.filter(status=status_filter)

        template = request.query_params.get('template')
        data = []

        if template == 'yalidine':
            for order in orders:
                items_summary = ', '.join([f"{i.product_title} x{i.quantity}" for i in order.items.all()]) or order.order_number
                data.append({
                    'nom_client': order.full_name,
                    'telephone': order.phone,
                    'telephone_2': order.phone2,
                    'adresse': order.address,
                    'wilaya': order.wilaya.name_fr if order.wilaya else '',
                    'commune': order.commune.name_fr if order.commune else '',
                    'produit': items_summary,
                    'prix': float(order.total),
                    'stopdesk': 0,
                    'freeshipping': 0,
                    'has_exchange': 0,
                    'reference': order.order_number,
                })
        elif template == 'zr_express':
            for order in orders:
                items_summary = ', '.join([f"{i.product_title} x{i.quantity}" for i in order.items.all()]) or order.order_number
                data.append({
                    'Nom complet': order.full_name,
                    'Téléphone': order.phone,
                    'Téléphone 2': order.phone2,
                    'Adresse': order.address,
                    'Wilaya': order.wilaya.name_ar if order.wilaya else '',
                    'Commune': order.commune.name_ar if order.commune else '',
                    'Désignation': items_summary,
                    'Montant': float(order.total),
                    'Remarque': order.notes,
                    'Type d\'envoi': 'A domicile',
                })
        else:
            for order in orders:
                data.append({
                    'Order Number': order.order_number,
                    'Full Name': order.full_name,
                    'Phone': order.phone,
                    'Wilaya': order.wilaya.name_ar if order.wilaya else '',
                    'Commune': order.commune.name_ar if order.commune else '',
                    'Address': order.address,
                    'Notes': order.notes,
                    'Subtotal': float(order.subtotal),
                    'Delivery': float(order.delivery_price),
                    'Total': float(order.total),
                    'Status': order.status,
                    'Source': order.source,
                    'Date': order.created_at.strftime('%Y-%m-%d %H:%M'),
                })

        df = pd.DataFrame(data)
        buffer = io.BytesIO()
        df.to_csv(buffer, index=False, encoding='utf-8-sig')
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type='text/csv')
        filename = f"orders_{store.subdomain}"
        if template:
            filename += f"_{template}"
        response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
        return response


class OrderExportToDeliveryView(APIView):
    """
    POST /orders/<store_id>/<order_id>/export-to-delivery/
    Body: { "config_id": "<uuid>" }  # optional – uses default if omitted

    Creates a Shipment record and (for Yalidine) calls the external API.
    """

    def post(self, request, store_id, pk):
        store = get_store_for_user(store_id, request.user, 'orders')
        try:
            order = Order.objects.select_related('wilaya', 'commune').get(id=pk, store=store)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Resolve delivery config
        config_id = request.data.get('config_id')
        try:
            if config_id:
                config = StoreDeliveryConfig.objects.select_related('company').get(
                    id=config_id, store=store, is_active=True
                )
            else:
                config = StoreDeliveryConfig.objects.select_related('company').filter(
                    store=store, is_active=True, is_default=True
                ).first()
                if not config:
                    config = StoreDeliveryConfig.objects.select_related('company').filter(
                        store=store, is_active=True
                    ).first()
        except StoreDeliveryConfig.DoesNotExist:
            config = None

        if not config:
            logger.warning("[EXPORT] No active delivery config for store %s", store_id)
            return Response(
                {'detail': 'No active delivery company for this store. Please configure one in Integrations first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        company = config.company
        tracking_number = ''
        external_id = ''
        label_url = ''
        status_message = ''

        logger.info("[EXPORT] Exporting order %s to company=%s (config=%s)", order.order_number, company.name, config.id)

        # --- Yalidine integration ---
        if company.name == 'yalidine' and config.api_id and config.api_key:
            try:
                name_parts = (order.full_name or "").strip().split(' ', 1)
                firstname = name_parts[0] or "Client"
                familyname = name_parts[1] if len(name_parts) > 1 else "Client"

                payload = [{
                    'order_id': order.order_number,
                    'from_wilaya_name': 'Alger',
                    'to_wilaya_name': order.wilaya.name_fr if order.wilaya else '',
                    'from_commune_name': 'Alger Centre',
                    'to_commune_name': order.commune.name_fr if order.commune else '',
                    'firstname': firstname,
                    'familyname': familyname,
                    'contact_phone': order.phone,
                    'address': order.address or 'Address not specified',
                    'product_list': ', '.join(
                        [f"{i.product_title} x{i.quantity}" for i in order.items.all()]
                    ) or order.order_number,
                    'price': float(order.total),
                    'do_insurance': False,
                    'declared_value': 0,
                    'height': 5,
                    'width': 20,
                    'length': 30,
                    'weight': 1,
                    'freeshipping': False,
                    'is_stopdesk': False,
                    'has_exchange': False,
                }]

                logger.info("[EXPORT] Yalidine payload: %s", payload)

                headers = {
                    'X-API-ID': config.api_id,
                    'X-API-Token': config.api_key,
                    'Content-Type': 'application/json',
                }
                resp = requests.post(
                    'https://api.yalidine.app/v1/parcels/',
                    json=payload,
                    headers=headers,
                    timeout=15,
                )
                logger.info("[EXPORT] Yalidine response status=%s body=%s", resp.status_code, resp.text[:1000])

                if resp.status_code in (200, 201):
                    data = resp.json()
                    parcel_info = None
                    if isinstance(data, dict):
                        parcel_info = data.get(order.order_number)
                        if not parcel_info:
                            for k, v in data.items():
                                if isinstance(v, dict) and ('tracking' in v or 'parcel_id' in v or 'success' in v):
                                    parcel_info = v
                                    break
                    
                    if parcel_info:
                        if parcel_info.get('success') is False:
                            err_msg = parcel_info.get('message') or 'Validation error'
                            logger.error("[EXPORT] Yalidine returned success=false: %s", err_msg)
                            return Response(
                                {'detail': f'Yalidine error: {err_msg}'},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        external_id = str(parcel_info.get('parcel_id', parcel_info.get('id', '')))
                        tracking_number = str(parcel_info.get('tracking', external_id))
                        label_url = parcel_info.get('label', '')
                        logger.info("[EXPORT] Yalidine success: tracking=%s external_id=%s", tracking_number, external_id)
                    else:
                        logger.warning("[EXPORT] Yalidine 200 but could not parse parcel_info from: %s", data)
                        external_id = ''
                        tracking_number = ''
                        label_url = ''
                    
                    status_message = 'Order sent to Yalidine successfully'
                else:
                    err_text = resp.text[:500]
                    logger.error("[EXPORT] Yalidine HTTP %s: %s", resp.status_code, err_text)
                    return Response(
                        {'detail': f'Yalidine error (HTTP {resp.status_code}): {err_text}'},
                        status=status.HTTP_502_BAD_GATEWAY,
                    )
            except requests.RequestException as e:
                logger.exception("[EXPORT] Yalidine connection error")
                return Response(
                    {'detail': f'Failed to connect to Yalidine: {str(e)}'},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

        # --- Noest / Ecotrack integration ---
        elif company.name == 'noest' and config.api_key:
            try:
                # Ecotrack uses api_token (config.api_key) and user_guid (config.api_id)
                ecotrack_base = (config.company.api_base_url or '').rstrip('/')
                if not ecotrack_base or 'api/v1' not in ecotrack_base:
                    ecotrack_base = 'https://noest-dz.com/api/v1'

                ecotrack_url = f'{ecotrack_base}/orders'

                payload = {
                    'api_token': config.api_key,
                    'client': order.full_name or 'Client',
                    'phone': order.phone or '',
                    'adresse': order.address or 'Address not specified',
                    'wilaya_id': order.wilaya.code if order.wilaya else 16,
                    'commune': order.commune.name_fr if order.commune else '',
                    'montant': float(order.total),
                    'produit': ', '.join(
                        [f"{i.product_title} x{i.quantity}" for i in order.items.all()]
                    ) or order.order_number,
                    'type_id': 1,
                    'poids': 1,
                    'stop_desk': 0,
                    'reference': order.order_number,
                }

                # Add user_guid if available (stored in api_id)
                if config.api_id:
                    payload['user_guid'] = config.api_id

                logger.info("[EXPORT] Noest/Ecotrack URL: %s", ecotrack_url)
                logger.info("[EXPORT] Noest/Ecotrack payload: %s", {k: v for k, v in payload.items() if k != 'api_token'})

                headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'api_token': config.api_key,
                }
                if config.api_id:
                    headers['user_guid'] = config.api_id

                resp = requests.post(
                    ecotrack_url,
                    json=payload,
                    headers=headers,
                    timeout=15,
                )
                logger.info("[EXPORT] Noest response status=%s body=%s", resp.status_code, resp.text[:1000])

                if resp.status_code in (200, 201):
                    try:
                        data = resp.json()
                    except ValueError:
                        logger.error("[EXPORT] Noest returned non-JSON body: %s", resp.text[:1000])
                        return Response(
                            {'detail': f'Noest returned HTML/invalid JSON: {resp.text[:300]}'},
                            status=status.HTTP_502_BAD_GATEWAY,
                        )
                    if isinstance(data, dict):
                        # Ecotrack may return tracking in various formats
                        tracking_number = str(data.get('tracking', data.get('tracking_number', data.get('code', ''))))
                        external_id = str(data.get('id', data.get('order_id', '')))
                        label_url = data.get('label', data.get('label_url', data.get('bordereau', '')))
                        if not label_url:
                            label_url = ''

                        # Check for error inside 200 response
                        if data.get('success') is False or data.get('error'):
                            err_msg = data.get('message', data.get('error', 'Validation error'))
                            logger.error("[EXPORT] Noest returned error: %s", err_msg)
                            return Response(
                                {'detail': f'Noest error: {err_msg}'},
                                status=status.HTTP_400_BAD_REQUEST,
                            )

                        logger.info("[EXPORT] Noest success: tracking=%s external_id=%s", tracking_number, external_id)

                    status_message = 'Order sent to Noest successfully'
                else:
                    err_text = resp.text[:500]
                    logger.error("[EXPORT] Noest HTTP %s: %s", resp.status_code, err_text)
                    return Response(
                        {'detail': f'Noest error (HTTP {resp.status_code}): {err_text}'},
                        status=status.HTTP_502_BAD_GATEWAY,
                    )
            except requests.RequestException as e:
                logger.exception("[EXPORT] Noest connection error")
                return Response(
                    {'detail': f'Failed to connect to Noest: {str(e)}'},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

        # --- ZR Express integration (placeholder) ---
        elif company.name == 'zr_express':
            status_message = 'تم تسجيل الشحنة يدوياً (ZR Express)'

        # --- Manual / other ---
        else:
            status_message = f'تم تسجيل الشحنة مع {company.display_name}'

        # Create or update Shipment record
        shipment, created = Shipment.objects.get_or_create(
            order=order,
            company=company,
            store=store,
            defaults={
                'tracking_number': tracking_number,
                'external_id': external_id,
                'label_url': label_url,
                'status': 'created',
                'status_message': status_message,
            },
        )
        if not created:
            # update existing
            shipment.tracking_number = tracking_number or shipment.tracking_number
            shipment.external_id = external_id or shipment.external_id
            shipment.label_url = label_url or shipment.label_url
            shipment.status_message = status_message
            shipment.save()

        # Update order status to shipped if we got a tracking number
        if tracking_number and order.status in ('new', 'confirmed', 'prepared'):
            OrderStatusHistory.objects.create(
                order=order,
                from_status=order.status,
                to_status='shipped',
                note=f'تم الإرسال تلقائياً عبر {company.display_name}',
            )
            order.status = 'shipped'
            order.save()

        return Response({
            'message': status_message,
            'tracking_number': tracking_number,
            'external_id': external_id,
            'label_url': label_url,
            'company': company.display_name,
            'order_status': order.status,
        }, status=status.HTTP_200_OK)


class OrderSyncTrackingView(APIView):
    """
    POST /orders/<store_id>/sync-tracking/
    Syncs the tracking status of all active shipments of the store from the delivery company's external API.
    """
    def post(self, request, store_id):
        store = get_store_for_user(store_id, request.user, 'orders')
        
        # Get active shipments (not delivered, returned, or failed)
        active_shipments = Shipment.objects.filter(
            store=store,
            status__in=['created', 'picked_up', 'in_transit', 'out_for_delivery']
        ).select_related('order', 'company')
        
        if not active_shipments.exists():
            return Response({
                'detail': 'لا توجد شحنات نشطة حالياً لمزامنتها.',
                'synced_count': 0,
                'updated_count': 0,
                'updates': []
            })

        # Group shipments by delivery company configs to minimize API calls
        configs = StoreDeliveryConfig.objects.filter(store=store, is_active=True).select_related('company')
        config_map = {cfg.company.name: cfg for cfg in configs}
        
        synced_count = 0
        updated_count = 0
        updates_summary = []

        # Process Yalidine shipments
        yalidine_config = config_map.get('yalidine')
        yalidine_shipments = [s for s in active_shipments if s.company.name == 'yalidine']

        if yalidine_shipments and yalidine_config and yalidine_config.api_id and yalidine_config.api_key:
            tracking_numbers = [s.tracking_number for s in yalidine_shipments if s.tracking_number]
            if tracking_numbers:
                try:
                    headers = {
                        'X-API-ID': yalidine_config.api_id,
                        'X-API-Token': yalidine_config.api_key,
                        'Content-Type': 'application/json',
                    }
                    tracking_str = ','.join(tracking_numbers)
                    resp = requests.get(
                        f'https://api.yalidine.app/v1/tracking/{tracking_str}',
                        headers=headers,
                        timeout=15
                    )
                    
                    if resp.status_code == 200:
                        tracking_data = resp.json()
                        # Format is typically {"success": true, "data": {"tracking_number": {"status": "...", ...}}}
                        # or {"success": true, "data": [{"tracking": "...", "status": "..."}]}
                        data = tracking_data.get('data', {})
                        
                        # Normalize data into dict mapping tracking -> info
                        info_map = {}
                        if isinstance(data, dict):
                            info_map = data
                        elif isinstance(data, list):
                            for item in data:
                                if isinstance(item, dict) and item.get('tracking'):
                                    info_map[str(item['tracking'])] = item

                        for shipment in yalidine_shipments:
                            t_num = shipment.tracking_number
                            shipment_info = info_map.get(t_num)
                            if not shipment_info:
                                continue
                            
                            synced_count += 1
                            ext_status = shipment_info.get('status', '').strip()
                            
                            new_shipment_status = shipment.status
                            new_order_status = shipment.order.status
                            
                            ext_status_lower = ext_status.lower()
                            if 'livr' in ext_status_lower:  # Livré
                                new_shipment_status = 'delivered'
                                new_order_status = 'delivered'
                            elif any(x in ext_status_lower for x in ['retour', 'echou', 'refus']):  # Retourné / Echoué / Refusé
                                new_shipment_status = 'returned'
                                new_order_status = 'returned'
                            elif 'livraison' in ext_status_lower:  # Sorti en livraison
                                new_shipment_status = 'out_for_delivery'
                                new_order_status = 'shipped'
                            elif any(x in ext_status_lower for x in ['expédi', 'reçu', 'centre', 'transfert', 'en voyage']):  # Expédié/Transit
                                new_shipment_status = 'in_transit'
                                new_order_status = 'shipped'
                            elif 'annul' in ext_status_lower:  # Annulé
                                new_shipment_status = 'failed'
                                new_order_status = 'cancelled'

                            # Update if changed
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
                                    note=f'تحديث تلقائي من Yalidine: {ext_status}'
                                )
                                updated_count += 1
                                updates_summary.append(f'{shipment.order.order_number}: {old_ord_status} -> {new_order_status} ({ext_status})')
                except Exception as e:
                    updates_summary.append(f'خطأ أثناء الاتصال بـ Yalidine: {str(e)}')

        detail_msg = f'تمت مزامنة {synced_count} شحنة بنجاح.'
        if updated_count > 0:
            detail_msg += f' تم تحديث حالة {updated_count} طلبية.'
        else:
            detail_msg += ' كل الحالات محدثة بالفعل.'

        return Response({
            'detail': detail_msg,
            'synced_count': synced_count,
            'updated_count': updated_count,
            'updates': updates_summary
        }, status=status.HTTP_200_OK)
