import csv
import io
import base64
from django.utils.dateparse import parse_date
from apps.orders.models import Order, OrderStatusHistory
from .registry import register_tool, ToolError

@register_tool(
    name="list_orders",
    description="List orders in the store, with optional filtering by status, wilaya name, and date range.",
    input_schema={
        "type": "object",
        "properties": {
            "status": {
                "type": "string",
                "description": "Filter by order status (e.g. new, confirmed, delivered, returned)."
            },
            "wilaya_name": {
                "type": "string",
                "description": "Filter by destination Wilaya name (e.g. Alger, Oran)."
            },
            "start_date": {
                "type": "string",
                "description": "Filter orders created on or after this date (YYYY-MM-DD)."
            },
            "end_date": {
                "type": "string",
                "description": "Filter orders created on or before this date (YYYY-MM-DD)."
            },
            "limit": {
                "type": "integer",
                "default": 20,
                "description": "Maximum number of orders to return."
            },
            "offset": {
                "type": "integer",
                "default": 0,
                "description": "Number of orders to skip."
            }
        }
    }
)
def list_orders(store, arguments):
    status_filter = arguments.get("status")
    wilaya_name = arguments.get("wilaya_name")
    start_date_str = arguments.get("start_date")
    end_date_str = arguments.get("end_date")
    limit = min(int(arguments.get("limit", 20)), 100)
    offset = max(int(arguments.get("offset", 0)), 0)

    qs = Order.objects.filter(store=store).select_related('wilaya', 'commune').prefetch_related('items')
    
    if status_filter:
        qs = qs.filter(status=status_filter)
        
    if wilaya_name:
        qs = qs.filter(wilaya__name_fr__iexact=wilaya_name) | qs.filter(wilaya__name_ar__contains=wilaya_name)
        
    if start_date_str:
        dt = parse_date(start_date_str)
        if dt:
            qs = qs.filter(created_at__date__gte=dt)
            
    if end_date_str:
        dt = parse_date(end_date_str)
        if dt:
            qs = qs.filter(created_at__date__lte=dt)

    total_count = qs.count()
    orders_page = qs[offset:offset+limit]
    
    orders_data = []
    for order in orders_page:
        items_list = []
        for item in order.items.all():
            items_list.append({
                "product_title": item.product_title,
                "variant_name": item.variant_name,
                "quantity": item.quantity,
                "price": float(item.price),
                "total": float(item.total)
            })
            
        orders_data.append({
            "id": str(order.id),
            "order_number": order.order_number,
            "full_name": order.full_name,
            "phone": order.phone,
            "phone2": order.phone2,
            "wilaya": order.wilaya.name_fr if order.wilaya else None,
            "commune": order.commune.name_fr if order.commune else None,
            "address": order.address,
            "subtotal": float(order.subtotal),
            "delivery_price": float(order.delivery_price),
            "total": float(order.total),
            "status": order.status,
            "created_at": order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            "items": items_list
        })
        
    return {
        "orders": orders_data,
        "total_count": total_count,
        "limit": limit,
        "offset": offset
    }


@register_tool(
    name="export_orders",
    description="Export orders to a CSV file. Filters by status, wilaya name, and date range, returning a base64-encoded file payload.",
    input_schema={
        "type": "object",
        "properties": {
            "status": {
                "type": "string",
                "description": "Filter by order status."
            },
            "wilaya_name": {
                "type": "string",
                "description": "Filter by destination Wilaya name."
            },
            "start_date": {
                "type": "string",
                "description": "Filter starting date (YYYY-MM-DD)."
            },
            "end_date": {
                "type": "string",
                "description": "Filter ending date (YYYY-MM-DD)."
            }
        }
    }
)
def export_orders(store, arguments):
    status_filter = arguments.get("status")
    wilaya_name = arguments.get("wilaya_name")
    start_date_str = arguments.get("start_date")
    end_date_str = arguments.get("end_date")

    qs = Order.objects.filter(store=store).select_related('wilaya', 'commune').prefetch_related('items')
    
    if status_filter:
        qs = qs.filter(status=status_filter)
    if wilaya_name:
        qs = qs.filter(wilaya__name_fr__iexact=wilaya_name) | qs.filter(wilaya__name_ar__contains=wilaya_name)
    if start_date_str:
        dt = parse_date(start_date_str)
        if dt:
            qs = qs.filter(created_at__date__gte=dt)
    if end_date_str:
        dt = parse_date(end_date_str)
        if dt:
            qs = qs.filter(created_at__date__lte=dt)

    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Order Number", "Date", "Status", "Customer Name", "Phone", "Phone 2",
        "Wilaya", "Commune", "Address", "Subtotal", "Delivery Price", "Total", "Items"
    ])
    
    for order in qs:
        items_str = "; ".join([
            f"{item.product_title} ({item.variant_name}) x{item.quantity}" if item.variant_name
            else f"{item.product_title} x{item.quantity}"
            for item in order.items.all()
        ])
        writer.writerow([
            order.order_number,
            order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            order.status,
            order.full_name,
            order.phone,
            order.phone2,
            order.wilaya.name_fr if order.wilaya else "",
            order.commune.name_fr if order.commune else "",
            order.address,
            float(order.subtotal),
            float(order.delivery_price),
            float(order.total),
            items_str
        ])
        
    csv_data = output.getvalue()
    encoded = base64.b64encode(csv_data.encode('utf-8')).decode('utf-8')
    
    import datetime
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"orders_export_{timestamp}.csv"
    
    return {
        "filename": filename,
        "mime_type": "text/csv",
        "content": encoded,
        "total_exported": qs.count()
    }


@register_tool(
    name="update_order_status",
    description="Update the status of an existing order (e.g. new, confirmed, shipped, delivered, cancelled, returned).",
    input_schema={
        "type": "object",
        "properties": {
            "order_id": {
                "type": "string",
                "description": "The exact UUID of the order to update."
            },
            "status": {
                "type": "string",
                "enum": ["new", "confirmed", "shipped", "delivered", "cancelled", "returned"],
                "description": "The new status to set for the order."
            }
        },
        "required": ["order_id", "status"]
    }
)
def update_order_status(store, arguments):
    order_id = arguments.get("order_id")
    status = arguments.get("status")
    
    try:
        order = Order.objects.get(id=order_id, store=store)
    except Order.DoesNotExist:
        raise ToolError(f"Order with ID '{order_id}' not found.")
        
    old_status = order.status
    order.status = status
    order.save()
    
    return {
        "message": f"Successfully updated order {order.order_number} status from '{old_status}' to '{status}'.",
        "order_number": order.order_number,
        "status": order.status
    }


@register_tool(
    name="get_order_details",
    description="Retrieve full details for a specific order by its UUID, including items, customer info, address, and pricing.",
    input_schema={
        "type": "object",
        "properties": {
            "order_id": {
                "type": "string",
                "description": "The exact UUID of the order to retrieve."
            }
        },
        "required": ["order_id"]
    }
)
def get_order_details(store, arguments):
    order_id = arguments.get("order_id")
    
    try:
        order = Order.objects.select_related('wilaya', 'commune').prefetch_related('items').get(id=order_id, store=store)
    except Order.DoesNotExist:
        raise ToolError(f"Order with ID '{order_id}' not found.")
        
    items_list = []
    for item in order.items.all():
        items_list.append({
            "product_title": item.product_title,
            "variant_name": item.variant_name,
            "quantity": item.quantity,
            "price": float(item.price),
            "total": float(item.total)
        })
        
    return {
        "id": str(order.id),
        "order_number": order.order_number,
        "full_name": order.full_name,
        "phone": order.phone,
        "phone2": order.phone2,
        "wilaya": order.wilaya.name_fr if order.wilaya else None,
        "commune": order.commune.name_fr if order.commune else None,
        "address": order.address,
        "subtotal": float(order.subtotal),
        "delivery_price": float(order.delivery_price),
        "total": float(order.total),
        "status": order.status,
        "created_at": order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        "items": items_list
    }


@register_tool(
    name="ship_order",
    description="Export a confirmed order to the shipping company (e.g. Yalidine) and generate tracking details.",
    input_schema={
        "type": "object",
        "properties": {
            "order_id": {
                "type": "string",
                "description": "The exact UUID of the order to ship."
            },
            "config_id": {
                "type": "string",
                "description": "Optional UUID of a specific active delivery config to use. If omitted, uses default active config."
            }
        },
        "required": ["order_id"]
    }
)
def ship_order(store, arguments):
    import requests
    from apps.delivery.models import StoreDeliveryConfig, Shipment
    from apps.orders.models import OrderStatusHistory

    order_id = arguments.get("order_id")
    config_id = arguments.get("config_id")

    try:
        order = Order.objects.select_related('wilaya', 'commune').get(id=order_id, store=store)
    except Order.DoesNotExist:
        raise ToolError(f"Order with ID '{order_id}' not found.")

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
        raise ToolError("لا توجد شركة توصيل مُفعّلة لهذا المتجر. يرجى إضافة إعدادات شركة التوصيل أولاً.")

    company = config.company
    tracking_number = ''
    external_id = ''
    label_url = ''
    status_message = ''

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
            if resp.status_code in (200, 201):
                data = resp.json()
                # Yalidine returns dictionary keyed by order_id, e.g. {"ORDER-123": {"success": true, "tracking": "YLD-...", ...}}
                parcel_info = None
                if isinstance(data, dict):
                    parcel_info = data.get(order.order_number)
                    if not parcel_info:
                        # Fallback: check if any other key is a dict with parcel info
                        for k, v in data.items():
                            if isinstance(v, dict) and ('tracking' in v or 'parcel_id' in v or 'success' in v):
                                    parcel_info = v
                                    break
                
                if parcel_info:
                    if parcel_info.get('success') is False:
                        err_msg = parcel_info.get('message') or 'Validation error'
                        raise ToolError(f"خطأ من Yalidine: {err_msg}")
                    external_id = str(parcel_info.get('parcel_id', parcel_info.get('id', '')))
                    tracking_number = str(parcel_info.get('tracking', external_id))
                    label_url = parcel_info.get('label', '')
                else:
                    external_id = ''
                    tracking_number = ''
                    label_url = ''
                
                status_message = 'تم الإرسال بنجاح إلى Yalidine'
            else:
                err_text = resp.text[:500]
                raise ToolError(f"خطأ من Yalidine: {err_text}")
        except requests.RequestException as e:
            raise ToolError(f"فشل الاتصال بـ Yalidine: {str(e)}")

    # --- EcoTrack-based integrations (Noest, ZR Express, Ecolog, Guepex, DHD, Yaliteck, Flash, etc.) ---
    elif (company.name in ('noest', 'zr_express', 'ecolog', 'guepex', 'dhd', 'yaliteck', 'flash_delivery') or 'ecotrack' in (company.api_base_url or '').lower()) and config.api_key:
        try:
            if company.name == 'noest':
                # Noest Public API (version 2.3) payload
                payload = {
                    'user_guid': config.api_id or '',
                    'reference': order.order_number,
                    'client': order.full_name or 'Client',
                    'phone': order.phone or '',
                    'phone_2': order.phone2 or '',
                    'adresse': order.address or 'Address not specified',
                    'wilaya_id': int(order.wilaya.code) if (order.wilaya and str(order.wilaya.code).isdigit()) else 16,
                    'commune': order.commune.name_fr if (order.commune and order.commune.name_fr) else '',
                    'montant': float(order.total),
                    'produit': ', '.join(
                        [f"{i.product_title} x{i.quantity}" for i in order.items.all()]
                    ) or order.order_number,
                    'type_id': 1, # 1 = Delivery
                    'stop_desk': 0,
                    'can_open': 1,
                }
            else:
                # Ecotrack API Payload validation structure
                payload = {
                    'reference': order.order_number,
                    'nom_client': order.full_name or 'Client',
                    'telephone': order.phone or '',
                    'adresse': order.address or 'Address not specified',
                    'commune': order.commune.name_fr if order.commune else '',
                    'code_wilaya': order.wilaya.code if order.wilaya else 16,
                    'montant': float(order.total),
                    'produit': ', '.join(
                        [f"{i.product_title} x{i.quantity}" for i in order.items.all()]
                    ) or order.order_number,
                    'type': 1, # 1 = Livraison
                    'stop_desk': 0,
                    'user_guid': config.api_id or '',
                    'api_id': config.api_id or '',
                    'api_token': config.api_key,
                }

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

            # For Noest specifically, we add the default fallbacks
            if company.name == 'noest':
                if 'https://noest.ecotrack.dz' not in domains:
                    domains.append('https://noest.ecotrack.dz')
                if 'https://app.noest-dz.com' not in domains:
                    domains.append('https://app.noest-dz.com')
            # For ZR Express specifically, we add its fallbacks if not configured properly
            elif company.name == 'zr_express':
                if 'https://zr.ecotrack.dz' not in domains:
                    domains.append('https://zr.ecotrack.dz')
                if 'https://app.zrexpress.com' not in domains:
                    domains.append('https://app.zrexpress.com')
                if 'https://zrexpress.com' not in domains:
                    domains.append('https://zrexpress.com')

            resp = None
            last_err = None

            for domain in domains:
                if company.name == 'noest':
                    ecotrack_url = f"{domain}/api/public/create/order"
                else:
                    ecotrack_url = f"{domain}/api/v1/create/order"
                try:
                    resp = requests.post(
                        ecotrack_url,
                        json=payload,
                        headers=headers,
                        timeout=15,
                    )
                    if resp.status_code != 404:
                        break
                except requests.RequestException as e:
                    last_err = e

            if resp is None:
                raise ToolError(f"Failed to connect to {company.display_name}: {str(last_err or 'All domains failed to connect')}")

            if resp.status_code in (200, 201):
                try:
                    data = resp.json()
                except ValueError:
                    raise ToolError(f"{company.display_name} returned HTML/invalid JSON: {resp.text[:300]}")
                if isinstance(data, dict):
                    # Check for error inside 200 response
                    if data.get('success') is False or data.get('error'):
                        err_msg = data.get('message', data.get('error', 'Validation error'))
                        raise ToolError(f"{company.display_name} error: {err_msg}")

                    tracking_number = str(data.get('tracking', data.get('tracking_number', data.get('code', ''))))
                    external_id = str(data.get('id', data.get('order_id', '')))
                    label_url = data.get('label', data.get('label_url', data.get('bordereau', ''))) or ''

                status_message = f'Order sent to {company.display_name} successfully'
            else:
                try:
                    err_data = resp.json()
                    err_msg = err_data.get('error', err_data.get('message', resp.text[:500]))
                except (ValueError, AttributeError):
                    err_msg = resp.text[:500]
                raise ToolError(f"{company.display_name} error (HTTP {resp.status_code}): {err_msg}")
        except Exception as e:
            if isinstance(e, ToolError):
                raise
            raise ToolError(f"Failed to process {company.display_name}: {str(e)}")
    else:
        status_message = f'تم تسجيل الشحنة مع {company.display_name}'

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
        shipment.tracking_number = tracking_number or shipment.tracking_number
        shipment.external_id = external_id or shipment.external_id
        shipment.label_url = label_url or shipment.label_url
        shipment.status_message = status_message
        shipment.save()

    if tracking_number and order.status in ('new', 'confirmed', 'prepared'):
        OrderStatusHistory.objects.create(
            order=order,
            from_status=order.status,
            to_status='shipped',
            note=f'تم الإرسال تلقائياً عبر {company.display_name}',
        )
        order.status = 'shipped'
        order.save()

    return {
        "message": status_message,
        "tracking_number": tracking_number,
        "external_id": external_id,
        "label_url": label_url,
        "company": company.display_name,
        "order_status": order.status
    }


@register_tool(
    name="sync_order_tracking",
    description="Sync tracking status from delivery company API for active shipments in the store.",
    input_schema={
        "type": "object",
        "properties": {}
    }
)
def sync_order_tracking(store, arguments):
    import requests
    from apps.delivery.models import StoreDeliveryConfig, Shipment
    from apps.orders.models import OrderStatusHistory

    active_shipments = Shipment.objects.filter(
        store=store,
        status__in=['created', 'picked_up', 'in_transit', 'out_for_delivery']
    ).select_related('order', 'company')
    
    if not active_shipments.exists():
        return {
            "message": "لا توجد شحنات نشطة حالياً لمزامنتها.",
            "synced_count": 0,
            "updated_count": 0
        }

    configs = StoreDeliveryConfig.objects.filter(store=store, is_active=True).select_related('company')
    config_map = {cfg.company.name: cfg for cfg in configs}
    
    synced_count = 0
    updated_count = 0
    updates_summary = []

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
                    data = tracking_data.get('data', {})
                    
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
                                note=f'تحديث تلقائي من Yalidine: {ext_status}'
                            )
                            updated_count += 1
                            updates_summary.append(f'{shipment.order.order_number}: {old_ord_status} -> {new_order_status} ({ext_status})')
            except Exception as e:
                raise ToolError(f"خطأ أثناء الاتصال بـ Yalidine: {str(e)}")

    message = f"تمت مزامنة {synced_count} شحنة بنجاح."
    if updated_count > 0:
        message += f" تم تحديث حالة {updated_count} طلبية."
    else:
        message += " كل الحالات محدثة بالفعل."

    return {
        "message": message,
        "synced_count": synced_count,
        "updated_count": updated_count,
        "updates": updates_summary
    }

