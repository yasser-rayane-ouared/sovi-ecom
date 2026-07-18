"""Analytics views."""
from datetime import timedelta
from django.utils import timezone
from django.db import models
from django.db.models import Count, Sum, Q, F
from django.db.models.functions import Coalesce
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from apps.stores.models import Store
from apps.stores.utils import get_store_for_user
from apps.orders.models import Order
from .models import PageView, ConversionEvent, SectionInteractionEvent


class DashboardAnalyticsView(APIView):
    """Main analytics dashboard data."""

    def get(self, request, store_id):
        store = get_store_for_user(store_id, request.user, None)
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)

        # Orders stats query (filtered by time)
        orders = Order.objects.filter(store=store, created_at__gte=since, is_abandoned=False)
        total_orders = orders.count()
        total_revenue = orders.filter(status='delivered').aggregate(Sum('total'))['total__sum'] or 0
        confirmed = orders.filter(status='confirmed').count()
        delivered = orders.filter(status='delivered').count()
        returned = orders.filter(status='returned').count()
        cancelled = orders.filter(status='cancelled').count()

        # Views
        views_count = PageView.objects.filter(store=store, created_at__gte=since).count()

        # Conversion rate
        conversion_rate = (total_orders / views_count * 100) if views_count > 0 else 0

        # Top wilayas
        top_wilayas = orders.values('wilaya__name_ar', 'wilaya__name_fr', 'wilaya__name_en').annotate(
            count=Count('id'),
            revenue=Coalesce(Sum('total', filter=Q(status='delivered')), 0.0, output_field=models.FloatField()),
            delivered_count=Count('id', filter=Q(status='delivered')),
            returned_count=Count('id', filter=Q(status='returned')),
        ).order_by('-count')[:10]

        # Top products
        from apps.orders.models import OrderItem
        top_products = OrderItem.objects.filter(
            order__store=store, order__created_at__gte=since, order__is_abandoned=False
        ).values('product_title').annotate(
            count=Sum('quantity'),
            revenue=Sum('total'),
        ).order_by('-count')[:10]

        # Orders by status
        status_breakdown = orders.values('status').annotate(count=Count('id'))

        # Live profit calculation (Python-based for accuracy & DB-agnostic operations)
        total_sourcing_cost = 0.0
        total_ad_spend = 0.0
        total_delivery_loss = 0.0
        total_delivered_subtotal = 0.0

        daily_dict = {}
        for i in range(days):
            d = (timezone.now() - timedelta(days=i)).date()
            daily_dict[d] = {
                'day': d.strftime('%Y-%m-%d'),
                'count': 0,
                'revenue': 0.0,
                'net_profit': 0.0,
            }

        all_orders_data = orders.select_related('wilaya', 'commune').prefetch_related('items__product')
        for order in all_orders_data:
            order_date = order.created_at.date()
            if order_date not in daily_dict:
                daily_dict[order_date] = {
                    'day': order_date.strftime('%Y-%m-%d'),
                    'count': 0,
                    'revenue': 0.0,
                    'net_profit': 0.0,
                }
            
            day_data = daily_dict[order_date]
            day_data['count'] += 1
            
            order_sourcing_cost = 0.0
            order_ad_spend = 0.0
            order_delivery_loss = 0.0
            
            for item in order.items.all():
                qty = item.quantity
                ad_val = float(item.product.ad_cost_per_order or 0)
                order_ad_spend += ad_val * qty
            total_ad_spend += order_ad_spend
            
            if order.status == 'delivered':
                order_revenue = float(order.total)
                delivered_subtotal = float(order.subtotal)
                total_delivered_subtotal += delivered_subtotal
                
                for item in order.items.all():
                    qty = item.quantity
                    cost_val = float(item.product.cost_price or 0)
                    order_sourcing_cost += cost_val * qty
                total_sourcing_cost += order_sourcing_cost
                
                order_profit = delivered_subtotal - order_sourcing_cost - order_ad_spend
                day_data['revenue'] += order_revenue
                day_data['net_profit'] += order_profit
            elif order.status == 'returned':
                order_delivery_loss = float(order.delivery_price)
                total_delivery_loss += order_delivery_loss
                order_profit = - order_ad_spend - order_delivery_loss
                day_data['net_profit'] += order_profit
            elif order.status == 'cancelled':
                order_profit = - order_ad_spend
                day_data['net_profit'] += order_profit
            else:
                # pending status (e.g. new, confirmed, prepared, shipped)
                order_profit = - order_ad_spend
                day_data['net_profit'] += order_profit

        net_profit = total_delivered_subtotal - total_sourcing_cost - total_ad_spend - total_delivery_loss
        daily_orders_list = sorted(list(daily_dict.values()), key=lambda x: x['day'])

        # Recent activities (order creation and status changes)
        from apps.orders.models import OrderStatusHistory
        recent_orders = Order.objects.filter(store=store, is_abandoned=False).select_related('wilaya').order_by('-created_at')[:5]
        recent_history = OrderStatusHistory.objects.filter(order__store=store).select_related('order', 'order__wilaya').order_by('-changed_at')[:5]
        
        recent_activities = []
        for o in recent_orders:
            recent_activities.append({
                'type': 'order_created',
                'order_number': o.order_number,
                'customer_name': o.full_name,
                'wilaya_ar': o.wilaya.name_ar,
                'wilaya_fr': o.wilaya.name_fr,
                'wilaya_en': o.wilaya.name_en,
                'total': float(o.total),
                'timestamp': o.created_at.isoformat(),
            })
        
        for h in recent_history:
            recent_activities.append({
                'type': 'status_changed',
                'order_number': h.order.order_number,
                'customer_name': h.order.full_name,
                'from_status': h.from_status,
                'to_status': h.to_status,
                'note': h.note,
                'timestamp': h.changed_at.isoformat(),
            })
            
        recent_activities = sorted(recent_activities, key=lambda x: x['timestamp'], reverse=True)[:10]

        return Response({
            'overview': {
                'total_orders': total_orders,
                'total_revenue': float(total_revenue),
                'views': views_count,
                'conversion_rate': round(conversion_rate, 2),
                'confirmed': confirmed,
                'delivered': delivered,
                'returned': returned,
                'cancelled': cancelled,
                'net_profit': round(net_profit, 2),
                'total_sourcing_cost': round(total_sourcing_cost, 2),
                'total_ad_spend': round(total_ad_spend, 2),
                'total_delivery_loss': round(total_delivery_loss, 2),
            },
            'top_wilayas': list(top_wilayas),
            'top_products': list(top_products),
            'status_breakdown': list(status_breakdown),
            'daily_orders': daily_orders_list,
            'recent_activities': recent_activities,
        })


class TrackEventView(APIView):
    """Track conversion events from storefront."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        store_subdomain = request.data.get('store')
        if not store_subdomain:
            return Response({'error': 'Store identifier required.'}, status=400)
        clean_subdomain = store_subdomain.lower()
        if clean_subdomain.startswith('www.'):
            clean_subdomain = clean_subdomain[4:]
        try:
            from django.db.models import Q
            store = Store.objects.get(
                Q(subdomain=store_subdomain) |
                Q(custom_domain=store_subdomain) |
                Q(custom_domain=clean_subdomain) |
                Q(custom_domain=f"www.{clean_subdomain}"),
                is_active=True
            )
        except Store.DoesNotExist:
            return Response({'error': 'Store not found.'}, status=404)

        product_id = request.data.get('product_id') or request.data.get('metadata', {}).get('product_id')
        product = None
        if product_id:
            try:
                from apps.products.models import Product
                product = Product.objects.get(id=product_id, store=store)
            except (Product.DoesNotExist, ValueError, TypeError):
                pass

        ConversionEvent.objects.create(
            store=store,
            event_type=request.data.get('event_type', 'page_view'),
            product=product,
            value=request.data.get('value'),
            metadata=request.data.get('metadata', {}),
            session_id=request.data.get('session_id', ''),
            source=request.data.get('source', ''),
        )

        # Also create a PageView record for dashboard store views tracking
        event_type = request.data.get('event_type', 'page_view')
        if event_type in ['page_view', 'view_content']:
            import hashlib
            
            # Get IP and hash it
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR', '')
            
            ip_hash = hashlib.sha256(ip.encode('utf-8')).hexdigest() if ip else ''
            
            # Detect device type from user agent
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            ua_lower = user_agent.lower()
            device = 'desktop'
            if 'mobi' in ua_lower or 'android' in ua_lower or 'iphone' in ua_lower:
                device = 'mobile'
            elif 'tablet' in ua_lower or 'ipad' in ua_lower:
                device = 'tablet'

            # Referrer and page_url
            page_url = request.data.get('metadata', {}).get('page_url') or request.META.get('HTTP_REFERER', '') or '/'
            referrer = request.data.get('metadata', {}).get('referrer') or ''

            PageView.objects.create(
                store=store,
                page_url=page_url[:500],
                referrer=referrer[:500],
                user_agent=user_agent,
                ip_hash=ip_hash,
                country=request.META.get('HTTP_CF_IPCOUNTRY', '')[:2],
                device=device,
                session_id=request.data.get('session_id', '')[:100]
            )

        return Response({'ok': True})


class ProductABTestAnalyticsView(APIView):
    """Analytics for a specific product page A/B test."""

    def get(self, request, store_id, product_id):
        from apps.products.models import Product
        from django.db.models import Sum
        
        store = get_store_for_user(store_id, request.user, None)
        try:
            product = Product.objects.get(id=product_id, store=store)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=404)

        # Base queries
        events_list = list(ConversionEvent.objects.filter(store=store, product=product, event_type__in=['view_content', 'purchase']))

        views_a = 0
        views_b = 0
        purchases_a_events = []
        purchases_b_events = []

        import json
        for e in events_list:
            meta = e.metadata
            if isinstance(meta, str):
                try:
                    meta = json.loads(meta)
                except:
                    meta = {}
            if not isinstance(meta, dict):
                meta = {}

            group = meta.get('ab_test_group')
            if e.event_type == 'view_content':
                if group == 'A':
                    views_a += 1
                elif group == 'B':
                    views_b += 1
            elif e.event_type == 'purchase':
                if group == 'A':
                    purchases_a_events.append(e)
                elif group == 'B':
                    purchases_b_events.append(e)

        purchases_a = len(purchases_a_events)
        purchases_b = len(purchases_b_events)

        revenue_a = sum(e.value or 0 for e in purchases_a_events)
        revenue_b = sum(e.value or 0 for e in purchases_b_events)

        # Calculations
        cr_a = (purchases_a / views_a * 100) if views_a > 0 else 0
        cr_b = (purchases_b / views_b * 100) if views_b > 0 else 0

        improvement = 0
        if cr_a > 0:
            improvement = ((cr_b - cr_a) / cr_a) * 100
        elif cr_b > 0 and cr_a == 0:
            improvement = 100.0

        winner = 'none'
        # Declare a winner if we have a reasonable baseline sample size (min 50 views per variant)
        if views_a >= 50 and views_b >= 50:
            if cr_b > cr_a + 0.1:
                winner = 'B'
            elif cr_a > cr_b + 0.1:
                winner = 'A'

        return Response({
            'product_title': product.title,
            'enable_ab_test': product.enable_ab_test,
            'group_a': {
                'views': views_a,
                'purchases': purchases_a,
                'conversion_rate': round(cr_a, 2),
                'revenue': float(revenue_a)
            },
            'group_b': {
                'views': views_b,
                'purchases': purchases_b,
                'conversion_rate': round(cr_b, 2),
                'revenue': float(revenue_b)
            },
            'improvement': round(improvement, 2),
            'winner': winner
        })


class TrackSectionView(APIView):
    """Track section impressions/clicks from storefront."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        store_subdomain = request.data.get('store')
        if not store_subdomain:
            return Response({'error': 'Store identifier required.'}, status=400)
        clean_subdomain = store_subdomain.lower()
        if clean_subdomain.startswith('www.'):
            clean_subdomain = clean_subdomain[4:]
        try:
            store = Store.objects.get(
                Q(subdomain=store_subdomain) |
                Q(custom_domain=store_subdomain) |
                Q(custom_domain=clean_subdomain) |
                Q(custom_domain=f"www.{clean_subdomain}"),
                is_active=True
            )
        except Store.DoesNotExist:
            return Response({'error': 'Store not found.'}, status=404)

        product_id = request.data.get('product_id')
        product = None
        if product_id:
            try:
                from apps.products.models import Product
                product = Product.objects.get(id=product_id, store=store)
            except (Product.DoesNotExist, ValueError, TypeError):
                pass

        section_type = request.data.get('section_type')
        if not section_type:
            return Response({'error': 'Section type required.'}, status=400)

        event_type = request.data.get('event_type', 'impression')
        if event_type not in ['impression', 'click']:
            event_type = 'impression'

        SectionInteractionEvent.objects.create(
            store=store,
            product=product,
            section_type=section_type,
            event_type=event_type,
            session_id=request.data.get('session_id', ''),
        )
        return Response({'ok': True})


class SectionHeatmapView(APIView):
    """Get section heatmap CTR analytics for a product."""

    def get(self, request, store_id, product_id):
        from apps.products.models import Product
        
        store = get_store_for_user(store_id, request.user, None)
        try:
            product = Product.objects.get(id=product_id, store=store)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=404)

        # Get total product views (view_content event)
        product_views = ConversionEvent.objects.filter(
            store=store, product=product, event_type='view_content'
        ).count()

        # Aggregate impressions and clicks per section_type for this product
        stats = SectionInteractionEvent.objects.filter(
            store=store, product=product
        ).values('section_type').annotate(
            impressions=Count('id', filter=Q(event_type='impression')),
            clicks=Count('id', filter=Q(event_type='click')),
        )

        heatmap_data = {}
        max_ctr = 0
        
        for item in stats:
            sec_type = item['section_type']
            impr = item['impressions']
            clks = item['clicks']
            
            # Scrolled rate relative to page views
            divisor = product_views if product_views > 0 else max(impr, 1)
            ctr = (impr / divisor * 100)
            if ctr > 100:
                ctr = 100.0
                
            ctr_rounded = round(ctr, 1)
            click_thru = round((clks / impr * 100) if impr > 0 else 0, 1)
            
            heatmap_data[sec_type] = {
                'impressions': impr,
                'clicks': clks,
                'ctr': ctr_rounded,
                'click_thru_rate': click_thru,
            }
            if ctr > max_ctr:
                max_ctr = ctr
                
        # Calculate relative score based on max_ctr
        for sec_type, info in heatmap_data.items():
            if max_ctr > 0:
                info['score'] = round((info['ctr'] / max_ctr) * 100, 1)
            else:
                info['score'] = 0.0

        return Response({
            'product_views': product_views,
            'heatmap': heatmap_data
        })


class ProductAnalyticsView(APIView):
    """Detailed analytics for a single product."""

    def get(self, request, store_id, product_id):
        from apps.products.models import Product
        from apps.orders.models import OrderItem

        store = get_store_for_user(store_id, request.user, None)
        try:
            product = Product.objects.get(id=product_id, store=store)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=404)

        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)

        # Page views for this product
        views_count = ConversionEvent.objects.filter(
            store=store, product=product, event_type='view_content', created_at__gte=since
        ).count()

        # Order items for this product (non-abandoned orders)
        order_items = OrderItem.objects.filter(
            order__store=store, product=product,
            order__is_abandoned=False, order__created_at__gte=since
        ).select_related('order')

        total_orders = order_items.count()
        total_qty = order_items.aggregate(s=Sum('quantity'))['s'] or 0

        # Status breakdown via order
        status_counts = {}
        revenue = 0.0
        sourcing_cost = 0.0
        ad_spend = 0.0
        confirmation_spend = 0.0
        packaging_spend = 0.0
        return_spend = 0.0
        other_spend = 0.0
        delivery_loss = 0.0

        cost_price = float(product.cost_price or 0)
        ad_cost = float(product.ad_cost_per_order or 0)
        conf_cost = float(product.confirmation_cost or 0)
        pack_cost = float(product.packaging_cost or 0)
        ret_cost = float(product.return_cost or 0)
        oth_cost = float(product.other_costs or 0)

        confirmed_statuses = {'confirmed', 'pending', 'prepared', 'shipped', 'delivered', 'returned'}
        shipped_statuses = {'shipped', 'delivered', 'returned'}

        for oi in order_items:
            st = oi.order.status
            status_counts[st] = status_counts.get(st, 0) + 1
            qty = oi.quantity

            if st in confirmed_statuses:
                ad_spend += ad_cost * qty
                confirmation_spend += conf_cost * qty
                other_spend += oth_cost * qty

            if st in shipped_statuses:
                packaging_spend += pack_cost * qty

            if st == 'delivered':
                revenue += float(oi.total)
                sourcing_cost += cost_price * qty
            elif st == 'returned':
                return_spend += ret_cost * qty
                delivery_loss += float(oi.order.delivery_price)

        confirmed_count = sum(v for k, v in status_counts.items() if k in confirmed_statuses)
        delivered_count = status_counts.get('delivered', 0)
        returned_count = status_counts.get('returned', 0)

        confirmation_rate = (confirmed_count / total_orders * 100) if total_orders > 0 else 0
        delivery_rate = (delivered_count / (delivered_count + returned_count) * 100) if (delivered_count + returned_count) > 0 else 0
        net_profit = revenue - sourcing_cost - ad_spend - confirmation_spend - packaging_spend - return_spend - other_spend - delivery_loss

        return Response({
            'product_id': str(product.id),
            'product_title': product.title,
            'views': views_count,
            'total_orders': total_orders,
            'total_qty_sold': total_qty,
            'status_breakdown': status_counts,
            'confirmation_rate': round(confirmation_rate, 1),
            'delivery_rate': round(delivery_rate, 1),
            'revenue': round(revenue, 2),
            'ad_spend': round(ad_spend, 2),
            'confirmation_spend': round(confirmation_spend, 2),
            'packaging_spend': round(packaging_spend, 2),
            'return_spend': round(return_spend, 2),
            'other_spend': round(other_spend, 2),
            'sourcing_cost': round(sourcing_cost, 2),
            'delivery_loss': round(delivery_loss, 2),
            'net_profit': round(net_profit, 2),
            'stock': product.stock_quantity,
            'low_stock_threshold': product.low_stock_threshold,
            'track_inventory': product.track_inventory,
            'cost_price': float(product.cost_price or 0),
            'ad_cost_per_order': float(product.ad_cost_per_order or 0),
            'confirmation_cost': float(product.confirmation_cost or 0),
            'packaging_cost': float(product.packaging_cost or 0),
            'return_cost': float(product.return_cost or 0),
            'other_costs': float(product.other_costs or 0),
        })


class ProductsSummaryView(APIView):
    """Analytics summary for all products in a store — powers the enhanced Top Products table."""

    def get(self, request, store_id):
        from apps.products.models import Product
        from apps.orders.models import OrderItem
        from collections import defaultdict

        store = get_store_for_user(store_id, request.user, None)
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)

        # All active products for this store
        products = Product.objects.filter(store=store, status='active')

        # Batch: views per product
        views_qs = ConversionEvent.objects.filter(
            store=store, event_type='view_content', product__isnull=False, created_at__gte=since
        ).values('product_id').annotate(views=Count('id'))
        views_map = {str(row['product_id']): row['views'] for row in views_qs}

        # Batch: order items with order data
        order_items = OrderItem.objects.filter(
            order__store=store, order__is_abandoned=False, order__created_at__gte=since,
            product__in=products
        ).select_related('order', 'product')

        # Aggregate per product
        product_data = defaultdict(lambda: {
            'total_orders': 0,
            'total_qty': 0,
            'confirmed': 0,
            'delivered': 0,
            'returned': 0,
            'cancelled': 0,
            'revenue': 0.0,
            'ad_spend': 0.0,
            'confirmation_spend': 0.0,
            'packaging_spend': 0.0,
            'return_spend': 0.0,
            'other_spend': 0.0,
            'sourcing_cost': 0.0,
            'delivery_loss': 0.0,
        })

        confirmed_statuses = {'confirmed', 'pending', 'prepared', 'shipped', 'delivered', 'returned'}
        shipped_statuses = {'shipped', 'delivered', 'returned'}

        for oi in order_items:
            pid = str(oi.product_id)
            d = product_data[pid]
            st = oi.order.status
            qty = oi.quantity

            d['total_orders'] += 1
            d['total_qty'] += qty

            ad_cost = float(oi.product.ad_cost_per_order or 0)
            conf_cost = float(oi.product.confirmation_cost or 0)
            pack_cost = float(oi.product.packaging_cost or 0)
            ret_cost = float(oi.product.return_cost or 0)
            oth_cost = float(oi.product.other_costs or 0)
            cost_price = float(oi.product.cost_price or 0)

            if st in confirmed_statuses:
                d['confirmed'] += 1
                d['ad_spend'] += ad_cost * qty
                d['confirmation_spend'] += conf_cost * qty
                d['other_spend'] += oth_cost * qty

            if st in shipped_statuses:
                d['packaging_spend'] += pack_cost * qty

            if st == 'delivered':
                d['delivered'] += 1
                d['revenue'] += float(oi.total)
                d['sourcing_cost'] += cost_price * qty
            elif st == 'returned':
                d['returned'] += 1
                d['return_spend'] += ret_cost * qty
                d['delivery_loss'] += float(oi.order.delivery_price)
            elif st == 'cancelled':
                d['cancelled'] += 1

        # Build response list
        result = []
        for product in products:
            pid = str(product.id)
            d = product_data.get(pid, {
                'total_orders': 0, 'total_qty': 0, 'confirmed': 0,
                'delivered': 0, 'returned': 0, 'cancelled': 0,
                'revenue': 0.0, 'ad_spend': 0.0, 'confirmation_spend': 0.0,
                'packaging_spend': 0.0, 'return_spend': 0.0, 'other_spend': 0.0,
                'sourcing_cost': 0.0, 'delivery_loss': 0.0,
            })

            total_orders = d['total_orders']
            delivered = d['delivered']
            returned = d['returned']
            revenue = d['revenue']
            ad_spend = d['ad_spend']
            confirmation_spend = d['confirmation_spend']
            packaging_spend = d['packaging_spend']
            return_spend = d['return_spend']
            other_spend = d['other_spend']
            sourcing_cost = d['sourcing_cost']
            delivery_loss = d['delivery_loss']

            confirmation_rate = (d['confirmed'] / total_orders * 100) if total_orders > 0 else 0
            delivery_rate = (delivered / (delivered + returned) * 100) if (delivered + returned) > 0 else 0
            net_profit = revenue - sourcing_cost - ad_spend - confirmation_spend - packaging_spend - return_spend - other_spend - delivery_loss

            result.append({
                'product_id': pid,
                'title': product.title,
                'primary_image': product.primary_image,
                'views': views_map.get(pid, 0),
                'total_orders': total_orders,
                'total_qty': d['total_qty'],
                'confirmed': d['confirmed'],
                'delivered': delivered,
                'returned': returned,
                'cancelled': d['cancelled'],
                'confirmation_rate': round(confirmation_rate, 1),
                'delivery_rate': round(delivery_rate, 1),
                'revenue': round(revenue, 2),
                'ad_spend': round(ad_spend, 2),
                'confirmation_spend': round(confirmation_spend, 2),
                'packaging_spend': round(packaging_spend, 2),
                'return_spend': round(return_spend, 2),
                'other_spend': round(other_spend, 2),
                'sourcing_cost': round(sourcing_cost, 2),
                'delivery_loss': round(delivery_loss, 2),
                'net_profit': round(net_profit, 2),
                'stock': product.stock_quantity,
                'low_stock_threshold': product.low_stock_threshold,
                'track_inventory': product.track_inventory,
            })

        # Sort by total orders descending
        result.sort(key=lambda x: x['total_orders'], reverse=True)

        return Response(result)

