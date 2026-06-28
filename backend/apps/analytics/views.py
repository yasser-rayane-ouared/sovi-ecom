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
        # Declare a winner if we have a reasonable baseline sample size
        if views_a >= 5 and views_b >= 5:
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
