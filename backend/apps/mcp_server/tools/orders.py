import csv
import io
import base64
from django.utils.dateparse import parse_date
from apps.orders.models import Order
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
