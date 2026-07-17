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


ECOTRACK_COMPANIES = {
    # Legacy/aliases
    'noest', 'ecolog', 'guepex', 'gupex', 'dhd', 'yaliteck',
    # 41 EcoTrack Partners
    '48hr_livraison', 'allo_livraison', 'anderson_delivery', 'areex', 'assil_delivery', 'baconsult',
    'colireli', 'colivraison_express', 'coyote_express', 'delivromail', 'dhd_express', 'distazero',
    'expedia_chrono', 'fretdirect', 'fz_delivery', 'golivri', 'hhd_express', 'imir', 'medexpress',
    'monohub', 'msm_go', 'navex_delivery', 'negmar_express', 'noest_express', 'om_express',
    'ontime_ecotrack', 'packers', 'pdex', 'prest', 'rb_livraison', 'rex_livraison', 'rocket_delivery',
    'salva_delivery', 'samex_delivery', 'speed_delivery', 'swift_express', 'tsl_express',
    'ultra_express', 'univer_delivery', 'worldexpress', 'zvit_express'
}



class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    filterset_fields = ['is_abandoned']
    search_fields = ['order_number', 'full_name', 'phone']
    ordering_fields = ['created_at', 'total', 'status']
    pagination_class = None

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'orders')
        queryset = Order.objects.filter(store=store).select_related(
            'wilaya', 'commune'
        ).prefetch_related('items__product', 'status_history', 'shipments__company')
        
        status_param = self.request.query_params.get('status')
        if status_param:
            if status_param == 'no_answer':
                queryset = queryset.filter(status__in=['no_answer', 'no_answer_1', 'no_answer_2', 'no_answer_3'])
            else:
                queryset = queryset.filter(status=status_param)
                
        return queryset


class OrderDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'orders')
        return Order.objects.filter(store=store).select_related(
            'wilaya', 'commune'
        ).prefetch_related('items__product', 'status_history', 'shipments__company')


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
        elif template in ('ecotrack', 'noest'):
            import re
            for order in orders:
                items_summary = ', '.join([f"{i.product_title} x{i.quantity}" for i in order.items.all()]) or order.order_number
                search_text = f"{order.notes} {order.address}".lower()
                is_stop_desk = any(keyword in search_text for keyword in ['stopdesk', 'stop desk', 'stop-desk', 'bureau', 'desk'])
                stop_desk_val = "OUI" if is_stop_desk else ""
                
                station_code = ""
                if is_stop_desk:
                    match = re.search(r'\b[0-9]{1,2}-[A-Za-z]\b|\b[0-9]{1,2}[A-Za-z]\b', search_text)
                    if match:
                        station_code = match.group(0).upper()

                data.append({
                    'reference commande': order.order_number,
                    'nom et prenom du client (obligatoire)': order.full_name,
                    'telephone (obligatoire)': order.phone,
                    'telephone 2': order.phone2 or '',
                    'adresse de livraison (obligatoire)': order.address or '',
                    'commune de livraison': order.commune.name_fr if order.commune else '',
                    'montant du colis (obligatoire)': float(order.total),
                    'code wilaya (obligatoire)': order.wilaya.code if order.wilaya else '',
                    'produit': items_summary,
                    'remarque': order.notes or '',
                    'poids (en kg)': 1,
                    'PICK UP ( si oui mettez OUI sinon laissez vide )': '',
                    'ECHANGE ( si oui mettez OUI sinon laissez vide )': '',
                    'STOP DESK ( si oui mettez OUI sinon laissez vide )': stop_desk_val,
                    'Ouvrir le colis ( si oui mettez OUI sinon laissez vide )': 'OUI',
                    'Code de station ( obligatoire si stopdesk = OUI )': station_code,
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

        # Check if stopdesk/desk is requested by parsing notes
        is_stopdesk = False
        stopdesk_id = None
        
        notes_str = order.notes or ''
        import re
        match = re.search(r'\[StopDesk:\s*([^\]]*)\s*-\s*([^\]]*)\]', notes_str)
        if match:
            is_stopdesk = True
            stopdesk_id = match.group(1).strip()
            stopdesk_name = match.group(2).strip()
        else:
            match_simple = re.search(r'\[StopDesk:\s*([^\]]*)\]', notes_str)
            if match_simple:
                is_stopdesk = True
                stopdesk_name = match_simple.group(1).strip()
                if ' - ' in stopdesk_name:
                    parts = stopdesk_name.split(' - ', 1)
                    stopdesk_id = parts[0].strip()
                    stopdesk_name = parts[1].strip()

        logger.info("[EXPORT] Exporting order %s to company=%s (config=%s) is_stopdesk=%s stopdesk_id=%s", order.order_number, company.name, config.id, is_stopdesk, stopdesk_id)

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
                    'is_stopdesk': is_stopdesk,
                    'stopdesk_id': int(stopdesk_id) if (is_stopdesk and stopdesk_id and str(stopdesk_id).isdigit()) else None,
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

        # --- EcoTrack-based integrations (41 Ecotrack partners + legacy aliases) ---
        elif (company.name in ECOTRACK_COMPANIES or 'ecotrack' in (company.api_base_url or '').lower()) and config.api_key:
            try:
                # Unified EcoTrack API Payload
                payload = {
                    'user_guid': config.api_id or '',
                    'api_id': config.api_id or '',
                    'api_token': config.api_key,
                    'reference': order.order_number,
                    
                    # Name variations for backward/forward compatibility
                    'client': order.full_name or 'Client',
                    'nom_client': order.full_name or 'Client',
                    
                    # Phone variations
                    'phone': order.phone or '',
                    'telephone': order.phone or '',
                    'phone_2': order.phone2 or '',
                    
                    # Address / location
                    'adresse': order.address or 'Address not specified',
                    'wilaya_id': int(order.wilaya.code) if (order.wilaya and str(order.wilaya.code).isdigit()) else 16,
                    'code_wilaya': order.wilaya.code if order.wilaya else 16,
                    'commune': order.commune.name_fr if (order.commune and order.commune.name_fr) else '',
                    
                    # Pricing & Products
                    'montant': float(order.total),
                    'produit': ', '.join(
                        [f"{i.product_title} x{i.quantity}" for i in order.items.all()]
                    ) or order.order_number,
                    
                    # Type variations
                    'type_id': 1, # 1 = Delivery
                    'type': 1,
                    
                    # Delivery options
                    'stop_desk': 1 if is_stopdesk else 0,
                    'centre_id': int(stopdesk_id) if (is_stopdesk and stopdesk_id and str(stopdesk_id).isdigit()) else None,
                    'center_id': int(stopdesk_id) if (is_stopdesk and stopdesk_id and str(stopdesk_id).isdigit()) else None,
                    'can_open': 1,
                }

                logger.info("[EXPORT] %s payload: %s", company.display_name, {k: v for k, v in payload.items() if k != 'api_token'})

                headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': f'Bearer {config.api_key}',
                }

                # Resolve base URL from company settings
                base_url = (company.api_base_url or '').strip()
                if base_url.endswith('/'):
                    base_url = base_url[:-1]
                if base_url.endswith('/api/v1'):
                    base_url = base_url[:-7]
                elif base_url.endswith('/api'):
                    base_url = base_url[:-4]

                domains = []
                if base_url:
                    domains.append(base_url)

                slug = company.name
                dash_subdomain = slug.replace('_', '-')
                flat_subdomain = slug.replace('_', '')
                domains.extend([
                    f"https://{dash_subdomain}.ecotrack.dz",
                    f"https://{flat_subdomain}.ecotrack.dz"
                ])

                # Clean suffix to generate stripped subdomains
                clean_slug = slug
                for suffix in ['_livraison', '_delivery', '_express', '_chrono', '_ecotrack']:
                    if clean_slug.endswith(suffix):
                        clean_slug = clean_slug[:-len(suffix)]
                
                clean_dash = clean_slug.replace('_', '-')
                clean_flat = clean_slug.replace('_', '')
                domains.extend([
                    f"https://{clean_dash}.ecotrack.dz",
                    f"https://{clean_flat}.ecotrack.dz"
                ])

                if company.name in ('noest', 'noest_express'):
                    domains.extend(['https://noest.ecotrack.dz', 'https://app.noest-dz.com'])
                elif company.name in ('dhd', 'dhd_express'):
                    domains.append('https://dhd.ecotrack.dz')
                elif company.name == 'msm_go':
                    domains.append('https://msmgo.ecotrack.dz')
                elif company.name == 'ontime_ecotrack':
                    domains.append('https://ontime.ecotrack.dz')

                # De-duplicate domains while keeping order
                unique_domains = []
                for d in domains:
                    if d not in unique_domains:
                        unique_domains.append(d)

                resp = None
                last_err = None

                # Generate combinations of domains and endpoints to try
                endpoints = ['/api/public/create/order', '/api/v1/create/order']
                
                for domain in unique_domains:
                    for endpoint in endpoints:
                        ecotrack_url = f"{domain}{endpoint}"
                        logger.info("[EXPORT] Trying %s URL: %s", company.display_name, ecotrack_url)
                        try:
                            resp = requests.post(
                                ecotrack_url,
                                json=payload,
                                headers=headers,
                                timeout=15,
                            )
                            logger.info("[EXPORT] %s response status=%s body=%s", company.display_name, resp.status_code, resp.text[:1000])
                            if resp.status_code != 404:
                                break
                        except requests.RequestException as e:
                            last_err = e
                            logger.warning("[EXPORT] Failed to connect to %s: %s", ecotrack_url, str(e))
                    if resp and resp.status_code != 404:
                        break

                if resp is None:
                    return Response(
                        {'detail': f'Failed to connect to {company.display_name}: {str(last_err or "All domains failed to connect")}'},
                        status=status.HTTP_502_BAD_GATEWAY,
                    )

                if resp.status_code in (200, 201):
                    try:
                        data = resp.json()
                    except ValueError:
                        logger.error("[EXPORT] %s returned non-JSON body: %s", company.display_name, resp.text[:1000])
                        return Response(
                            {'detail': f'{company.display_name} returned HTML/invalid JSON: {resp.text[:300]}'},
                            status=status.HTTP_502_BAD_GATEWAY,
                        )
                    if isinstance(data, dict):
                        # Check for error inside 200 response
                        if data.get('success') is False or data.get('error'):
                            err_msg = data.get('message', data.get('error', 'Validation error'))
                            logger.error("[EXPORT] %s returned error: %s", company.display_name, err_msg)
                            return Response(
                                {'detail': f'{company.display_name} error: {err_msg}'},
                                status=status.HTTP_400_BAD_REQUEST,
                            )

                        tracking_number = str(data.get('tracking', data.get('tracking_number', data.get('code', ''))))
                        external_id = str(data.get('id', data.get('order_id', '')))
                        label_url = data.get('label', data.get('label_url', data.get('bordereau', '')))
                        if not label_url:
                            label_url = ''

                        logger.info("[EXPORT] %s success: tracking=%s external_id=%s", company.display_name, tracking_number, external_id)

                    status_message = f'Order sent to {company.display_name} successfully'
                else:
                    err_text = resp.text[:500]
                    logger.error("[EXPORT] %s HTTP %s: %s", company.display_name, resp.status_code, err_text)
                    return Response(
                        {'detail': f'{company.display_name} error (HTTP {resp.status_code}): {err_text}'},
                        status=status.HTTP_502_BAD_GATEWAY,
                    )
            except Exception as e:
                logger.exception("[EXPORT] %s processing error", company.display_name)
                return Response(
                    {'detail': f'Failed to process {company.display_name}: {str(e)}'},
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
        # Process EcoTrack-based shipments (41 Ecotrack partners + legacy aliases)
        ecotrack_shipments = [s for s in active_shipments if s.company.name in ECOTRACK_COMPANIES or 'ecotrack' in (s.company.api_base_url or '').lower()]

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

            slug = c_name
            dash_subdomain = slug.replace('_', '-')
            flat_subdomain = slug.replace('_', '')
            domains.extend([
                f"https://{dash_subdomain}.ecotrack.dz",
                f"https://{flat_subdomain}.ecotrack.dz"
            ])

            # Clean suffix to generate stripped subdomains
            clean_slug = slug
            for suffix in ['_livraison', '_delivery', '_express', '_chrono', '_ecotrack']:
                if clean_slug.endswith(suffix):
                    clean_slug = clean_slug[:-len(suffix)]
            
            clean_dash = clean_slug.replace('_', '-')
            clean_flat = clean_slug.replace('_', '')
            domains.extend([
                f"https://{clean_dash}.ecotrack.dz",
                f"https://{clean_flat}.ecotrack.dz"
            ])

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
                        logger.info("[SYNC TRACKING] Fetching %s tracking from: %s", cfg.company.display_name, url)
                        resp = requests.post(
                            url,
                            json={'trackings': tracking_numbers},
                            headers=headers,
                            timeout=15
                        )
                        logger.info("[SYNC TRACKING] %s response status=%s body=%s", cfg.company.display_name, resp.status_code, resp.text[:200])
                        if resp.status_code != 404:
                            break
                    except requests.RequestException as e:
                        last_err = e
                        logger.warning("[SYNC TRACKING] Failed to connect to %s: %s", url, str(e))
                if resp and resp.status_code != 404:
                    break

            if resp and resp.status_code == 200:
                try:
                    tracking_data = resp.json()
                    # Response maps tracking -> order details
                    for shipment in c_shipments:
                        t_num = shipment.tracking_number
                        shipment_info = tracking_data.get(t_num)
                        if not shipment_info:
                            continue

                        synced_count += 1
                        
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
                                note=f'تحديث تلقائي من {cfg.company.display_name}: {ext_status}'
                            )
                            updated_count += 1
                            updates_summary.append(f'{shipment.order.order_number}: {old_ord_status} -> {new_order_status} ({ext_status})')

                except Exception as e:
                    logger.exception("[SYNC TRACKING] Processing error for %s", cfg.company.display_name)
                    updates_summary.append(f'خطأ أثناء معالجة بيانات {cfg.company.display_name}: {str(e)}')
            else:
                err_text = resp.text[:200] if resp else str(last_err or "All domains failed")
                updates_summary.append(f'فشل الاتصال بـ {cfg.company.display_name}: {err_text}')

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


class OrderPrintLabelView(APIView):
    """Generate a signed printable label PDF download URL for an order."""
    def get(self, request, store_id, pk):
        store = get_store_for_user(store_id, request.user, 'orders')
        try:
            order = Order.objects.get(id=pk, store=store)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        shipment = order.shipments.order_by('-id').first()
        if not shipment:
            return Response(
                {'detail': 'No shipment found for this order. Export to delivery first.'},
                status=status.HTTP_404_NOT_FOUND
            )

        from django.core import signing
        from django.urls import reverse

        token = signing.dumps({'order_id': str(order.id)}, salt='print-label')
        
        # Build signed absolute URL
        download_path = reverse('order-download-pdf', kwargs={'store_id': store_id, 'pk': pk})
        download_url = request.build_absolute_uri(download_path) + f"?token={token}"

        return Response({'label_url': download_url})


class OrderDownloadPDFView(APIView):
    """Securely stream or redirect to the PDF shipping label of an order using a signed token."""
    from rest_framework.permissions import AllowAny
    permission_classes = [AllowAny] # Authenticated via cryptographic token signature

    def get(self, request, store_id, pk):
        from django.http import HttpResponse, HttpResponseRedirect
        from django.core import signing
        import requests

        token = request.GET.get('token')
        if not token:
            return HttpResponse('Missing signature token.', status=401)

        try:
            signed_data = signing.loads(token, salt='print-label', max_age=3600)
            if str(signed_data.get('order_id')) != str(pk):
                return HttpResponse('Invalid order signature.', status=401)
        except signing.BadSignature:
            return HttpResponse('Invalid or expired signature token.', status=401)

        # Get Order & Shipment
        try:
            order = Order.objects.get(id=pk, store_id=store_id)
        except Order.DoesNotExist:
            return HttpResponse('Order not found.', status=404)

        shipment = order.shipments.order_by('-id').first()
        if not shipment:
            return HttpResponse('No shipment found for this order.', status=404)

        company = shipment.company
        config = StoreDeliveryConfig.objects.filter(store_id=store_id, company=company).order_by('-is_active').first()
        if not config:
            return HttpResponse('Delivery credentials config not found.', status=400)

        tracking_number = shipment.tracking_number
        if not tracking_number:
            return HttpResponse('Tracking number is missing.', status=400)

        # Yalidine Handling
        if company.name == 'yalidine':
            # Check if we already have a valid cached PDF label URL
            if shipment.label_url and 'yalidine.app/print' not in shipment.label_url:
                try:
                    resp = requests.get(shipment.label_url, timeout=15)
                    if resp.status_code == 200:
                        return HttpResponse(resp.content, content_type='application/pdf')
                except Exception:
                    pass

            # Fetch details dynamically
            label_url = None
            if config.api_id and config.api_key:
                try:
                    headers = {
                        'X-API-ID': config.api_id,
                        'X-API-Token': config.api_key,
                    }
                    resp = requests.get(
                        f'https://api.yalidine.app/v1/parcels/{tracking_number}',
                        headers=headers,
                        timeout=10
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        parcel_info = data.get('data', [])
                        if parcel_info and isinstance(parcel_info, list):
                            label_url = parcel_info[0].get('label')
                except Exception as e:
                    logger.warning("[DOWNLOAD PDF] Yalidine fetch failed: %s", str(e))

            if label_url:
                try:
                    resp = requests.get(label_url, timeout=15)
                    if resp.status_code == 200:
                        shipment.label_url = label_url
                        shipment.save(update_fields=['label_url'])
                        return HttpResponse(resp.content, content_type='application/pdf')
                except Exception:
                    pass

            # Fallback direct print link redirection
            fallback_url = f"https://yalidine.app/print/parcels?tracking={tracking_number}"
            return HttpResponseRedirect(fallback_url)

        # EcoTrack Partners Handling
        elif company.name in ECOTRACK_COMPANIES or 'ecotrack' in (company.api_base_url or '').lower():
            base_url = (company.api_base_url or '').strip()
            if base_url.endswith('/'):
                base_url = base_url[:-1]
            if base_url.endswith('/api/v1'):
                base_url = base_url[:-7]
            elif base_url.endswith('/api'):
                base_url = base_url[:-4]

            domains = []
            
            # Prioritize custom overrides / known active merchant dashboard domains first!
            if company.name in ('noest', 'noest_express'):
                domains.extend(['https://app.noest-dz.com', 'https://noest.ecotrack.dz'])
            elif company.name in ('dhd', 'dhd_express'):
                domains.extend(['https://dhd.ecotrack.dz', 'https://app.dhd-dz.com'])
            elif company.name == 'msm_go':
                domains.append('https://msmgo.ecotrack.dz')
            elif company.name == 'ontime_ecotrack':
                domains.append('https://ontime.ecotrack.dz')

            if base_url:
                domains.append(base_url)

            slug = company.name
            dash_subdomain = slug.replace('_', '-')
            flat_subdomain = slug.replace('_', '')
            domains.extend([
                f"https://{dash_subdomain}.ecotrack.dz",
                f"https://{flat_subdomain}.ecotrack.dz"
            ])

            # Clean suffix to generate stripped subdomains
            clean_slug = slug
            for suffix in ['_livraison', '_delivery', '_express', '_chrono', '_ecotrack']:
                if clean_slug.endswith(suffix):
                    clean_slug = clean_slug[:-len(suffix)]
            
            clean_dash = clean_slug.replace('_', '-')
            clean_flat = clean_slug.replace('_', '')
            domains.extend([
                f"https://{clean_dash}.ecotrack.dz",
                f"https://{clean_flat}.ecotrack.dz"
            ])

            # De-duplicate domains while keeping order
            unique_domains = []
            for d in domains:
                if d not in unique_domains:
                    unique_domains.append(d)

            # Construct the direct authenticated print URL on Ecotrack.
            # We prefer the first resolved domain (which is either their custom base_url or the stripped partner domain).
            target_domain = unique_domains[0] if unique_domains else f"https://{clean_flat}.ecotrack.dz"
            
            # Construct standard Ecotrack expéditeur GET print URL
            authenticated_print_url = f"{target_domain}/expediteur/print/parcels?trackings[]={tracking_number}"
            
            # Cache the URL
            shipment.label_url = authenticated_print_url
            shipment.save(update_fields=['label_url'])
            
            return HttpResponseRedirect(authenticated_print_url)

        return HttpResponse('Could not retrieve shipment label PDF from the courier API.', status=404)
