"""Storefront public views — no auth required."""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Store
from apps.products.models import Product, Category
from apps.products.serializers import ProductSerializer, CategorySerializer
from apps.orders.models import Order
from apps.orders.serializers import OrderCreateSerializer
from apps.delivery.models import Wilaya, Commune
from apps.delivery.serializers import WilayaSerializer, CommuneSerializer
from apps.pages.models import LandingPage
from apps.pages.serializers import LandingPagePublicSerializer


def get_store_or_404(subdomain):
    from django.db.models import Q

    if not subdomain:
        return None

    clean_subdomain = str(subdomain).lower().strip()
    if clean_subdomain.startswith('www.'):
        clean_subdomain = clean_subdomain[4:]

    raw_subdomain = clean_subdomain.split('.')[0] if '.' in clean_subdomain else clean_subdomain

    try:
        store = Store.objects.filter(
            Q(subdomain=subdomain) |
            Q(subdomain=clean_subdomain) |
            Q(subdomain=raw_subdomain) |
            Q(custom_domain=subdomain) |
            Q(custom_domain=clean_subdomain) |
            Q(custom_domain=f"www.{clean_subdomain}"),
            is_active=True,
            is_suspended=False
        ).first()

        return store
    except Exception:
        return None


import hashlib
import time
import requests
import threading

def hash_data(val):
    if not val:
        return None
    val = val.strip().lower()
    return hashlib.sha256(val.encode('utf-8')).hexdigest()

def normalize_phone(phone):
    if not phone:
        return None
    clean = ''.join(c for c in phone if c.isdigit())
    if clean.startswith('0'):
        clean = '213' + clean[1:]
    elif not clean.startswith('213'):
        clean = '213' + clean
    return clean

def send_capi_event_thread(pixel_id, access_token, event_name, event_id, user_data, custom_data, source_url, test_event_code=None):
    url = f"https://graph.facebook.com/v19.0/{pixel_id}/events"
    payload = {
        "data": [
            {
                "event_name": event_name,
                "event_time": int(time.time()),
                "event_id": event_id,
                "user_data": user_data,
                "custom_data": custom_data,
                "event_source_url": source_url,
                "action_source": "website"
            }
        ],
        "access_token": access_token
    }
    if test_event_code and str(test_event_code).strip():
        payload["test_event_code"] = str(test_event_code).strip()
    try:
        res = requests.post(url, json=payload, timeout=8)
        import logging
        logging.getLogger(__name__).info(f"[Meta CAPI] Sent {event_name} -> {res.status_code}: {res.text}")
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"[Meta CAPI] Error sending {event_name}: {e}")

def trigger_capi_events(pixels, event_name, event_id, user_data, custom_data, source_url, request_test_code=None):
    for pixel in pixels:
        if getattr(pixel, 'access_token', None):
            test_code = request_test_code
            if not test_code:
                try:
                    test_code = getattr(pixel, 'test_event_code', None)
                except Exception:
                    test_code = None
            threading.Thread(
                target=send_capi_event_thread,
                args=(
                    pixel.pixel_id,
                    pixel.access_token,
                    event_name,
                    event_id,
                    user_data,
                    custom_data,
                    source_url,
                    test_code
                ),
                daemon=True
            ).start()


class StorefrontInfoView(APIView):
    """Public store info."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, subdomain):
        try:
            store = get_store_or_404(subdomain)
            if not store:
                return Response({'error': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            try:
                from .serializers import StoreSerializer
                data = StoreSerializer(store, context={'request': request}).data
            except Exception:
                data = {
                    'id': str(store.id),
                    'name': store.name,
                    'category': store.category,
                    'slug': store.slug,
                    'subdomain': store.subdomain,
                    'custom_domain': store.custom_domain,
                    'description': store.description or '',
                    'logo': store.logo or '',
                    'favicon': store.favicon or '',
                    'language': store.language or 'ar',
                    'currency': store.currency or 'DZD',
                    'is_active': store.is_active,
                }
            
            # Include active global pixels safely
            try:
                from apps.pixels.serializers import ensure_pixel_config_table_schema, PixelConfigSerializer
                ensure_pixel_config_table_schema()
                from apps.pixels.models import PixelConfig
                pixels = PixelConfig.objects.filter(store=store, is_active=True, product__isnull=True)
                data['pixels'] = PixelConfigSerializer(pixels, many=True).data
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"[StorefrontInfoView] Pixel fetch error: {e}")
                data['pixels'] = []
            return Response(data)
        except Exception as e:
            return Response({'error': 'Error loading store info.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StorefrontProductsView(APIView):
    """Public product listing."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, subdomain):
        try:
            store = get_store_or_404(subdomain)
            if not store:
                return Response([], status=status.HTTP_200_OK)
            
            from apps.products.models import Product
            from apps.products.serializers import ProductSerializer
            
            products = Product.objects.filter(store=store, status='active').prefetch_related(
                'images', 'videos', 'variants__options', 'quantity_offers', 'bundle_offers__items', 'sections'
            )
            return Response(ProductSerializer(products, many=True).data)
        except Exception:
            return Response([], status=status.HTTP_200_OK)


class StorefrontCategoriesView(APIView):
    """Public categories listing."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, subdomain):
        try:
            store = get_store_or_404(subdomain)
            if not store:
                return Response([], status=status.HTTP_200_OK)
            
            from apps.products.models import Category
            from apps.products.serializers import CategorySerializer
            
            categories = Category.objects.filter(store=store, is_active=True)
            return Response(CategorySerializer(categories, many=True).data)
        except Exception:
            return Response([], status=status.HTTP_200_OK)


class StorefrontCategoryDetailView(APIView):
    """Public category detail with products in it."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, subdomain, slug):
        store = get_store_or_404(subdomain)
        if not store:
            return Response({'error': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            category = Category.objects.get(store=store, slug=slug, is_active=True)
            
            # Exclude A/B testing B variants from public listings
            active_variant_ids = Product.objects.filter(
                store=store, 
                enable_ab_test=True, 
                ab_test_product_b__isnull=False
            ).values_list('ab_test_product_b_id', flat=True)

            products = Product.objects.filter(store=store, category=category, status='active').exclude(
                id__in=active_variant_ids
            ).prefetch_related(
                'images', 'videos', 'variants__options', 'quantity_offers', 'bundle_offers__items', 'sections'
            )
            
            # Serialize category and its products
            category_data = CategorySerializer(category).data
            products_data = ProductSerializer(products, many=True).data
            
            return Response({
                'category': category_data,
                'products': products_data
            })
        except Category.DoesNotExist:
            return Response({'error': 'Category not found.'}, status=status.HTTP_404_NOT_FOUND)


class StorefrontProductDetailView(APIView):
    """Public product detail."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, subdomain, slug):
        import uuid
        store = get_store_or_404(subdomain)
        if not store:
            return Response({'error': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            product = Product.objects.prefetch_related(
                'images', 'videos', 'variants__options', 'sections', 'quantity_offers', 'bundle_offers__items'
            ).get(
                store=store, slug=slug, status='active'
            )
            data = ProductSerializer(product).data
            
            # Include active pixels (both product-specific and global) safely
            try:
                from apps.pixels.serializers import ensure_pixel_config_table_schema, PixelConfigSerializer
                ensure_pixel_config_table_schema()
                from apps.pixels.models import PixelConfig
                from django.db.models import Q
                pixels = PixelConfig.objects.filter(
                    Q(product=product) | Q(product__isnull=True),
                    store=store,
                    is_active=True
                )
                data['pixels'] = PixelConfigSerializer(pixels, many=True).data

                # Generate deduplication event ID for ViewContent
                view_content_event_id = f"vc-{uuid.uuid4()}"
                data['view_content_event_id'] = view_content_event_id

                # Trigger Conversions API (CAPI) ViewContent event
                capi_pixels = pixels.filter(platform='meta', access_token__isnull=False).exclude(access_token='')
                if capi_pixels.exists():
                    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                    ip = x_forwarded_for.split(',')[0].strip() if x_forwarded_for else request.META.get('REMOTE_ADDR')
                    user_agent = request.META.get('HTTP_USER_AGENT', '')
                    fbp = request.COOKIES.get('_fbp')
                    fbc = request.COOKIES.get('_fbc')

                    user_data = {
                        "client_ip_address": ip,
                        "client_user_agent": user_agent,
                    }
                    if fbp:
                        user_data["fbp"] = fbp
                    if fbc:
                        user_data["fbc"] = fbc

                    custom_data = {
                        "content_name": product.title,
                        "content_ids": [str(product.id)],
                        "content_type": "product",
                        "value": float(product.price or 0.0),
                        "currency": "DZD"
                    }

                    scheme = 'https' if request.is_secure() else 'http'
                    source_url = f"{scheme}://{request.get_host()}"

                    trigger_capi_events(
                        pixels=capi_pixels,
                        event_name="ViewContent",
                        event_id=view_content_event_id,
                        user_data=user_data,
                        custom_data=custom_data,
                        source_url=source_url
                    )
            except Exception:
                data['pixels'] = []

            return Response(data)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)


class StorefrontLeadCreateView(APIView):
    """
    Creates or updates an abandoned lead (Order with is_abandoned=True)
    when the customer inputs their phone number in the checkout form.
    """
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request, subdomain):
        store = get_store_or_404(subdomain)
        if not store:
            return Response({'error': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)

        phone = request.data.get('phone', '').strip()
        full_name = request.data.get('full_name', '').strip() or 'Lead Client'
        items_data = request.data.get('items', [])
        
        if not phone:
            return Response({'error': 'Phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Basic phone normalization to match Algerian digits
        import re
        clean_phone = re.sub(r'\s+', '', phone)
        alg_pattern = r'^(0|\+213|00213|213)?(5|6|7)[0-9]{8}$'
        if not re.match(alg_pattern, clean_phone):
            return Response({'error': 'Invalid phone number.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get default wilaya (e.g. Algiers or first available)
        from apps.delivery.models import Wilaya
        wilaya = None
        wilaya_code = request.data.get('wilaya')
        if wilaya_code:
            try:
                wilaya = Wilaya.objects.filter(code=int(wilaya_code)).first()
            except (ValueError, TypeError):
                pass
        if not wilaya:
            wilaya = Wilaya.objects.filter(code=16).first() or Wilaya.objects.first()

        # Calculate subtotal based on items
        from apps.products.models import Product, ProductVariant
        subtotal = 0
        for item in items_data:
            try:
                product = Product.objects.get(id=item['product_id'], store=store)
                variant = None
                if item.get('variant_id'):
                    variant = ProductVariant.objects.get(id=item['variant_id'])
                price = variant.price if variant and variant.price else product.price
                qty = item.get('quantity', 1)
                subtotal += price * qty
            except Exception:
                pass

        # Check if an abandoned lead with this phone number already exists for this store in the last 2 hours
        from datetime import timedelta
        from django.utils import timezone
        two_hours_ago = timezone.now() - timedelta(hours=2)
        
        lead_order = Order.objects.filter(
            store=store,
            phone=phone,
            is_abandoned=True,
            created_at__gte=two_hours_ago
        ).first()

        if lead_order:
            # Update existing lead order
            lead_order.full_name = full_name
            if wilaya:
                lead_order.wilaya = wilaya
            lead_order.subtotal = subtotal
            lead_order.total = subtotal
            lead_order.save()
        else:
            # Generate a temporary order number for lead
            import random
            order_number = f"LD-{timezone.now().strftime('%y%m%d')}-{random.randint(1000, 9999)}"
            
            lead_order = Order.objects.create(
                store=store,
                order_number=order_number,
                full_name=full_name,
                phone=phone,
                wilaya=wilaya,
                subtotal=subtotal,
                delivery_price=0,
                total=subtotal,
                is_abandoned=True,
                source=request.data.get('source', ''),
                utm_source=request.data.get('utm_source', ''),
                utm_medium=request.data.get('utm_medium', ''),
                utm_campaign=request.data.get('utm_campaign', ''),
            )
            
            # Create OrderItems
            from apps.orders.models import OrderItem
            for item in items_data:
                try:
                    product = Product.objects.get(id=item['product_id'], store=store)
                    variant = None
                    if item.get('variant_id'):
                        variant = ProductVariant.objects.get(id=item['variant_id'])
                    price = variant.price if variant and variant.price else product.price
                    OrderItem.objects.create(
                        order=lead_order,
                        product=product,
                        variant=variant,
                        product_title=product.title,
                        variant_name=variant.name if variant else '',
                        quantity=item.get('quantity', 1),
                        price=price,
                        total=price * item.get('quantity', 1)
                    )
                except Exception:
                    pass

        # Trigger InitiateCheckout Meta CAPI event for Lead
        try:
            from django.db.models import Q
            from apps.pixels.models import PixelConfig
            product_ids = [item['product_id'] for item in items_data]
            capi_pixels = PixelConfig.objects.filter(
                store=store,
                platform='meta',
                is_active=True,
                access_token__isnull=False
            ).exclude(access_token='').filter(
                Q(product__isnull=True) | Q(product__id__in=product_ids)
            )

            if capi_pixels.exists():
                names = full_name.strip().split(' ', 1)
                first_name = names[0] if names else ''
                last_name = names[1] if len(names) > 1 else ''

                h_fn = hash_data(first_name)
                h_ln = hash_data(last_name)
                h_ph = hash_data(normalize_phone(phone))
                h_ct = hash_data(wilaya.name_ar)
                h_st = hash_data(wilaya.name_ar)
                h_country = hash_data("dz")

                # Extract client IP and user agent
                x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                if x_forwarded_for:
                    ip = x_forwarded_for.split(',')[0].strip()
                else:
                    ip = request.META.get('REMOTE_ADDR')
                user_agent = request.META.get('HTTP_USER_AGENT', '')

                user_data = {
                    "ph": [h_ph] if h_ph else [],
                    "fn": [h_fn] if h_fn else [],
                    "ln": [h_ln] if h_ln else [],
                    "ct": [h_ct] if h_ct else [],
                    "st": [h_st] if h_st else [],
                    "country": [h_country],
                    "client_ip_address": ip,
                    "client_user_agent": user_agent
                }

                contents = [{
                    'id': str(item['product_id']),
                    'quantity': item.get('quantity', 1)
                } for item in items_data]

                custom_data = {
                    "currency": "DZD",
                    "value": float(subtotal),
                    "content_type": "product",
                    "contents": contents,
                    "num_items": len(contents),
                }

                scheme = 'https' if request.is_secure() else 'http'
                source_url = f"{scheme}://{request.get_host()}"
                
                event_id = f"lead-{lead_order.id}"

                trigger_capi_events(
                    pixels=capi_pixels,
                    event_name="InitiateCheckout",
                    event_id=event_id,
                    user_data=user_data,
                    custom_data=custom_data,
                    source_url=source_url
                )
        except Exception:
            pass

        return Response({
            'lead_id': str(lead_order.id),
            'order_number': lead_order.order_number
        }, status=status.HTTP_201_CREATED)


class StorefrontCheckoutView(APIView):
    """Public COD checkout — place an order."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request, subdomain):
        store = get_store_or_404(subdomain)
        if not store:
            return Response({'error': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        # Check idempotency key to prevent double checkout
        idempotency_key = request.headers.get('X-Idempotency-Key') or request.headers.get('Idempotency-Key')
        if idempotency_key:
            from django.core.cache import cache
            cache_key = f"checkout_idempotency_{idempotency_key}"
            cached_response = cache.get(cache_key)
            if cached_response:
                return Response(cached_response, status=status.HTTP_201_CREATED)
            
        # Verify store monthly order limit
        from apps.subscriptions.models import get_active_limits
        from django.utils import timezone
        limits = get_active_limits(store)
        max_orders = limits.get('max_orders_per_month', 0)
        if max_orders != -1:
            now = timezone.now()
            first_day = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            order_count = Order.objects.filter(store=store, created_at__gte=first_day).count()
            if order_count >= max_orders:
                return Response(
                    {'error': f'عذراً، لقد استنفذ هذا المتجر الحد الأقصى المسموح به من الطلبات لهذا الشهر ({max_orders} طلب).'},
                    status=status.HTTP_403_FORBIDDEN
                )
                
        serializer = OrderCreateSerializer(data=request.data, context={'store': store, 'request': request})
        serializer.is_valid(raise_exception=True)

        lead_id = request.data.get('lead_id')
        order = None
        if lead_id:
            order = Order.objects.filter(id=lead_id, store=store, is_abandoned=True).first()

        if order:
            # Promote existing lead order to real order
            validated_data = serializer.validated_data
            db_wilaya = validated_data.get('wilaya')
            db_commune = validated_data.get('commune')

            # Calculate delivery price
            delivery_price = 0
            delivery_method = request.data.get('delivery_method', 'home')
            from apps.delivery.models import DeliveryPricing
            try:
                pricing = DeliveryPricing.objects.get(store=store, wilaya=db_wilaya)
                delivery_price = pricing.desk_price if delivery_method == 'desk' else pricing.home_price
            except DeliveryPricing.DoesNotExist:
                if hasattr(store, 'settings'):
                    delivery_price = store.settings.default_delivery_price

            # Calculate subtotal
            from apps.products.models import Product, ProductVariant
            subtotal = 0
            order_items = []
            for item in validated_data.get('items', []):
                product = Product.objects.get(id=item['product_id'], store=store)
                variant = None
                if item.get('variant_id'):
                    variant = ProductVariant.objects.get(id=item['variant_id'])
                price = variant.price if variant and variant.price else product.price
                qty = item.get('quantity', 1)
                subtotal += price * qty
                order_items.append({
                    'product': product,
                    'variant': variant,
                    'product_title': product.title,
                    'variant_name': variant.name if variant else '',
                    'quantity': qty,
                    'price': price,
                })

            # Coupon discount
            coupon_code = validated_data.get('coupon_code', '')
            coupon_discount_pct = validated_data.get('_coupon_discount_pct', 0)
            coupon_discount = 0
            if coupon_code and coupon_discount_pct > 0:
                coupon_discount = subtotal * (coupon_discount_pct / 100)

            # Free delivery check
            if hasattr(store, 'settings') and store.settings.free_delivery_threshold:
                if subtotal >= store.settings.free_delivery_threshold:
                    delivery_price = 0

            total = subtotal - coupon_discount + delivery_price

            # Clear existing items
            order.items.all().delete()

            # Format stopdesk notes if applicable
            order_notes = validated_data.get('notes', '')
            stopdesk_name = request.data.get('stopdesk_name')
            if delivery_method == 'desk' and stopdesk_name:
                desk_str = f"[StopDesk: {request.data.get('stopdesk_id') or ''} - {stopdesk_name}]"
                order_notes = f"{order_notes}\n{desk_str}" if order_notes else desk_str

            # Update order fields
            order.full_name = validated_data.get('full_name')
            order.phone = validated_data.get('phone')
            order.phone2 = validated_data.get('phone2', '')
            order.wilaya = db_wilaya
            order.commune = db_commune
            order.address = validated_data.get('address')
            order.notes = order_notes
            order.subtotal = subtotal
            order.delivery_price = delivery_price
            order.total = total
            order.source = validated_data.get('source', '')
            order.utm_source = validated_data.get('utm_source', '')
            order.utm_medium = validated_data.get('utm_medium', '')
            order.utm_campaign = validated_data.get('utm_campaign', '')
            order.coupon_code = coupon_code
            order.coupon_discount = coupon_discount
            order.is_abandoned = False
            order.order_number = None  # Triggers normal sequential order number ORD-xxxxx generation on save
            order.save()

            # Re-create items
            from apps.orders.models import OrderItem
            for item in order_items:
                OrderItem.objects.create(
                    order=order,
                    product=item['product'],
                    variant=item['variant'],
                    product_title=item['product_title'],
                    variant_name=item['variant_name'],
                    quantity=item['quantity'],
                    price=item['price'],
                    total=item['price'] * item['quantity']
                )
        else:
            order = serializer.save()

        # Extract client IP and user agent
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        # Save IP and UA details
        order.ip_address = ip
        order.user_agent = user_agent
        order.save()

        # Trigger Meta Conversions API (CAPI) in background
        try:
            from django.db.models import Q
            from apps.pixels.models import PixelConfig
            product_ids = [item.product.id for item in order.items.all()]
            capi_pixels = PixelConfig.objects.filter(
                store=store,
                platform='meta',
                is_active=True,
                access_token__isnull=False
            ).exclude(access_token='').filter(
                Q(product__isnull=True) | Q(product__id__in=product_ids)
            )

            if capi_pixels.exists():
                names = order.full_name.strip().split(' ', 1)
                first_name = names[0] if names else ''
                last_name = names[1] if len(names) > 1 else ''

                h_fn = hash_data(first_name)
                h_ln = hash_data(last_name)
                h_ph = hash_data(normalize_phone(order.phone))
                h_ct = hash_data(order.wilaya.name_ar)
                h_st = hash_data(order.wilaya.name_ar)
                h_country = hash_data("dz")

                frontend_event_id = request.data.get('event_id', str(order.id))

                fbp = request.COOKIES.get('_fbp')
                fbc = request.COOKIES.get('_fbc')

                user_data = {
                    "client_ip_address": ip,
                    "client_user_agent": user_agent
                }
                if h_ph: user_data["ph"] = [h_ph]
                if h_fn: user_data["fn"] = [h_fn]
                if h_ln: user_data["ln"] = [h_ln]
                if h_ct: user_data["ct"] = [h_ct]
                if h_st: user_data["st"] = [h_st]
                if h_country: user_data["country"] = [h_country]
                if fbp: user_data["fbp"] = fbp
                if fbc: user_data["fbc"] = fbc

                contents = []
                for item in order.items.all():
                    contents.append({
                        'id': str(item.product.id),
                        'quantity': item.quantity,
                        'item_price': float(item.price)
                    })

                ab_test_group = request.data.get('ab_test_group')
                custom_data = {
                    "currency": "DZD",
                    "value": float(order.total),
                    "content_type": "product",
                    "contents": contents,
                    "num_items": sum(c['quantity'] for c in contents),
                }
                if ab_test_group:
                    custom_data["ab_test_group"] = ab_test_group

                scheme = 'https' if request.is_secure() else 'http'
                source_url = f"{scheme}://{request.get_host()}"

                trigger_capi_events(
                    pixels=capi_pixels,
                    event_name="Purchase",
                    event_id=frontend_event_id,
                    user_data=user_data,
                    custom_data=custom_data,
                    source_url=source_url
                )

            # Create local ConversionEvent records for internal analytics
            try:
                from apps.analytics.models import ConversionEvent
                meta_data = request.data.get('metadata', {})
                if not isinstance(meta_data, dict):
                    meta_data = {}
                ab_test_group = request.data.get('ab_test_group')
                if ab_test_group:
                    meta_data['ab_test_group'] = ab_test_group

                session_id = request.data.get('session_id', '')

                for item in order.items.all():
                    conversion_product = item.product
                    if ab_test_group == 'B':
                        from apps.products.models import Product
                        master_product = Product.objects.filter(ab_test_product_b=item.product, enable_ab_test=True).first()
                        if master_product:
                            conversion_product = master_product

                    ConversionEvent.objects.create(
                        store=store,
                        event_type='purchase',
                        order=order,
                        product=conversion_product,
                        value=item.price * item.quantity,
                        metadata=meta_data,
                        session_id=session_id,
                        source='checkout',
                    )
            except Exception:
                pass
        except Exception:
            pass

        # Generate hashed user data for the frontend pixel initialization
        names = order.full_name.strip().split(' ', 1)
        first_name = names[0] if names else ''
        last_name = names[1] if len(names) > 1 else ''

        h_fn = hash_data(first_name)
        h_ln = hash_data(last_name)
        h_ph = hash_data(normalize_phone(order.phone))
        h_ct = hash_data(order.wilaya.name_ar)
        h_st = hash_data(order.wilaya.name_ar)
        h_country = hash_data("dz")

        response_data = {
            'message': 'Order placed successfully!',
            'order_number': order.order_number,
            'hashed_user_data': {
                'fn': h_fn,
                'ln': h_ln,
                'ph': h_ph,
                'ct': h_ct,
                'st': h_st,
                'country': h_country
            }
        }

        if idempotency_key:
            from django.core.cache import cache
            cache.set(f"checkout_idempotency_{idempotency_key}", response_data, 300)

        return Response(response_data, status=status.HTTP_201_CREATED)


class StorefrontWilayasView(APIView):
    """List all wilayas with store delivery prices."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, subdomain):
        from django.core.cache import cache
        clean_subdomain = subdomain.lower() if subdomain else ""
        if clean_subdomain.startswith('www.'):
            clean_subdomain = clean_subdomain[4:]

        cache_key = f"storefront_wilayas_{clean_subdomain}"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        store = get_store_or_404(subdomain)
        if not store:
            return Response({'error': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        from apps.delivery.models import DeliveryPricing, Wilaya
        pricing = DeliveryPricing.objects.filter(store=store).select_related('wilaya')
        
        # Initialize pricing if empty
        if not pricing.exists():
            wilayas = Wilaya.objects.all()
            default_price = float(store.settings.default_delivery_price)
            pricing_objects = [
                DeliveryPricing(
                    store=store,
                    wilaya=wilaya,
                    home_price=default_price,
                    desk_price=max(default_price - 200, 400) if default_price > 200 else 400
                )
                for wilaya in wilayas
            ]
            DeliveryPricing.objects.bulk_create(pricing_objects)
            pricing = DeliveryPricing.objects.filter(store=store).select_related('wilaya')
            
        data = []
        for p in pricing:
            data.append({
                'id': p.wilaya.id,
                'code': p.wilaya.code,
                'name_ar': p.wilaya.name_ar,
                'name_fr': p.wilaya.name_fr,
                'name_en': p.wilaya.name_en,
                'home_price': float(p.home_price),
                'desk_price': float(p.desk_price),
                'is_active': p.is_active
            })
            
        cache.set(cache_key, data, 86400)  # Cache for 24 hours
        return Response(data)


class StorefrontCommunesView(generics.ListAPIView):
    """List communes for a wilaya (lookup by wilaya code)."""
    serializer_class = CommuneSerializer
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        wilaya_id = self.kwargs['wilaya_id']
        wilaya = Wilaya.objects.filter(code=wilaya_id).first()
        if not wilaya:
            wilaya = Wilaya.objects.filter(id=wilaya_id).first()
            
        if not wilaya:
            return Commune.objects.none()
        
        # Auto-seed from JSON if empty or has only 1 fallback commune
        communes = Commune.objects.filter(wilaya=wilaya)
        if communes.count() <= 1:
            import json
            from pathlib import Path
            base_dir = Path(__file__).resolve().parent.parent.parent
            data_file = base_dir / 'apps' / 'locations' / 'data' / 'algeria_locations.json'
            if data_file.exists():
                try:
                    with open(data_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    wilaya_data = None
                    for w_data in data.get('wilayas', []):
                        if w_data.get('code') == wilaya.code:
                            wilaya_data = w_data
                            break
                    if wilaya_data and wilaya_data.get('communes'):
                        # Build a set of existing names (in lowercase) to avoid duplicates
                        existing_names = set()
                        for c in communes:
                            if c.name_ar:
                                existing_names.add(c.name_ar.strip().lower())
                            if c.name_fr:
                                existing_names.add(c.name_fr.strip().lower())
                            if c.name_en:
                                existing_names.add(c.name_en.strip().lower())
                        
                        communes_to_create = []
                        for commune_name in wilaya_data['communes']:
                            cleaned_name = commune_name.strip().lower()
                            if cleaned_name not in existing_names:
                                communes_to_create.append(
                                    Commune(
                                        wilaya=wilaya,
                                        name_ar=commune_name,
                                        name_fr=commune_name,
                                        name_en=commune_name,
                                        postal_code=f"{wilaya.code:02d}000"
                                    )
                                )
                                existing_names.add(cleaned_name)
                                
                        if communes_to_create:
                            Commune.objects.bulk_create(communes_to_create)
                        communes = Commune.objects.filter(wilaya=wilaya)
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Failed to auto-seed delivery communes from JSON: {e}")

        # Auto-seed default commune if still empty
        if not communes.exists():
            Commune.objects.get_or_create(
                wilaya=wilaya,
                name_ar=wilaya.name_ar,
                name_fr=wilaya.name_fr,
                defaults={
                    'name_en': wilaya.name_fr,
                    'postal_code': f"{wilaya.code:02d}000"
                }
            )
            communes = Commune.objects.filter(wilaya=wilaya)
            
        return communes


class StorefrontLandingPageView(APIView):
    """Public landing page."""
    """Public custom landing page by slug."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, subdomain, slug):
        store = get_store_or_404(subdomain)
        if not store:
            return Response({'error': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
        from apps.pages.models import LandingPage
        from apps.pages.serializers import LandingPagePublicSerializer
        try:
            page = LandingPage.objects.prefetch_related('sections').get(
                store=store, slug=slug, is_active=True
            )
            return Response(LandingPagePublicSerializer(page).data)
        except LandingPage.DoesNotExist:
            return Response({'error': 'Page not found.'}, status=status.HTTP_404_NOT_FOUND)


class StorefrontProductReviewsView(APIView):
    """Public product reviews — GET approved reviews, POST submit a new review."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, subdomain, slug):
        store = get_store_or_404(subdomain)
        if not store:
            return Response({'error': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            product = Product.objects.get(store=store, slug=slug, status='active')
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        from apps.products.models import ProductReview
        from apps.products.serializers import ProductReviewSerializer
        reviews = ProductReview.objects.filter(product=product, store=store, is_approved=True)
        return Response(ProductReviewSerializer(reviews, many=True).data)

    def post(self, request, subdomain, slug):
        store = get_store_or_404(subdomain)
        if not store:
            return Response({'error': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            product = Product.objects.get(store=store, slug=slug, status='active')
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        from apps.products.models import ProductReview
        from apps.products.serializers import ProductReviewCreateSerializer

        serializer = ProductReviewCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        review = serializer.save(
            store=store,
            product=product,
            is_approved=False,  # Requires owner approval
        )
        return Response(
            {'message': 'شكراً على تقييمك! سيتم نشره بعد المراجعة.', 'id': str(review.id)},
            status=status.HTTP_201_CREATED
        )


class StorefrontStopdesksView(APIView):
    """List stopdesk centers/agencies for a wilaya from the store's active courier API."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, subdomain, wilaya_id):
        import requests
        import logging
        logger = logging.getLogger(__name__)

        store = get_store_or_404(subdomain)
        if not store:
            return Response({'error': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        from apps.delivery.models import StoreDeliveryConfig, ECOTRACK_COMPANIES
        config = StoreDeliveryConfig.objects.filter(store=store, is_active=True).first()
        if not config or not getattr(config, 'company', None):
            return Response({'stopdesks': []})

        company = config.company
        
        # 1. Yalidine Stopdesks
        if company.name == 'yalidine' and config.api_id and config.api_key:
            headers = {
                'X-API-ID': config.api_id,
                'X-API-Token': config.api_key,
                'Content-Type': 'application/json',
            }
            try:
                resp = requests.get(
                    f'https://api.yalidine.app/v1/centers/?wilaya_id={wilaya_id}',
                    headers=headers,
                    timeout=10
                )
                if resp.status_code == 200:
                    raw_data = resp.json().get('data') or []
                    if not isinstance(raw_data, list):
                        raw_data = []
                    stopdesks = []
                    for item in raw_data:
                        if isinstance(item, dict):
                            stopdesks.append({
                                'id': str(item.get('center_id') or item.get('id') or ''),
                                'name': item.get('name') or '',
                                'address': item.get('address') or ''
                            })
                    return Response({'stopdesks': stopdesks})
            except Exception as e:
                logger.warning("[STOPDESK] Yalidine centers fetch failed: %s", str(e))

        # 2. EcoTrack Stopdesks
        elif company.name in ECOTRACK_COMPANIES or 'ecotrack' in (company.api_base_url or '').lower():
            if config.api_key:
                headers = {
                    'Authorization': f'Bearer {config.api_key}',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
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
                endpoints = ['/api/v1/get/centers', '/api/public/get/centers']

                for domain in unique_domains:
                    for endpoint in endpoints:
                        url = f"{domain}{endpoint}"
                        try:
                            resp = requests.get(url, headers=headers, timeout=10)
                            if resp.status_code == 200:
                                break
                        except Exception:
                            pass
                    if resp and resp.status_code == 200:
                        break

                if resp and resp.status_code == 200:
                    try:
                        data = resp.json()
                        stopdesks = []
                        centers_list = data if isinstance(data, list) else (data.get('data') if isinstance(data, dict) else [])
                        if not isinstance(centers_list, list):
                            centers_list = []
                            
                        for item in centers_list:
                            if not isinstance(item, dict):
                                continue
                            # Filter by wilaya
                            item_wilaya_raw = item.get('wilaya_id') or item.get('wilaya_code') or item.get('wilaya')
                            if item_wilaya_raw is not None:
                                try:
                                    item_wilaya = int(item_wilaya_raw)
                                except (ValueError, TypeError):
                                    item_wilaya = 0
                                
                                if item_wilaya == int(wilaya_id):
                                    stopdesks.append({
                                        'id': str(item.get('id') or item.get('centre_id') or ''),
                                        'name': item.get('name') or item.get('name_ar') or item.get('name_fr') or '',
                                        'address': item.get('address') or item.get('adresse') or ''
                                    })
                        return Response({'stopdesks': stopdesks})
                    except Exception as e:
                        logger.warning("[STOPDESK] Ecotrack parse failed: %s", str(e))

        return Response({'stopdesks': []})
