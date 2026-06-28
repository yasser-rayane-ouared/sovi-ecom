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
    clean_subdomain = subdomain.lower() if subdomain else ""
    if clean_subdomain.startswith('www.'):
        clean_subdomain = clean_subdomain[4:]
    try:
        store = Store.objects.select_related('settings', 'active_theme').get(
            Q(subdomain=subdomain) |
            Q(custom_domain=subdomain) |
            Q(custom_domain=clean_subdomain) |
            Q(custom_domain=f"www.{clean_subdomain}"),
            is_active=True,
            is_suspended=False
        )
        
        # Verify active subscription
        from apps.subscriptions.models import get_active_limits
        limits = get_active_limits(store)
        if not limits['has_active_subscription']:
            return None
            
        # Verify custom domain limits
        is_subdomain_match = (subdomain.lower() == store.subdomain.lower()) or (clean_subdomain == store.subdomain.lower())
        if not is_subdomain_match and not limits.get('has_custom_domain', False):
            return None
            
        return store
    except Store.DoesNotExist:
        return None


class StorefrontInfoView(APIView):
    """Public store info."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, subdomain):
        store = get_store_or_404(subdomain)
        if not store:
            return Response({'error': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
        from .serializers import StoreSerializer
        data = StoreSerializer(store).data
        
        # Include active global pixels
        from apps.pixels.models import PixelConfig
        from apps.pixels.serializers import PixelConfigSerializer
        pixels = PixelConfig.objects.filter(store=store, is_active=True, product__isnull=True)
        data['pixels'] = PixelConfigSerializer(pixels, many=True).data
        return Response(data)


class StorefrontProductsView(generics.ListAPIView):
    """Public product listing."""
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        store = get_store_or_404(self.kwargs['subdomain'])
        if not store:
            return Product.objects.none()
        return Product.objects.filter(store=store, status='active').select_related('store').prefetch_related(
            'images', 'videos', 'variants__options', 'quantity_offers', 'bundle_offers__items', 'sections'
        )


class StorefrontCategoriesView(generics.ListAPIView):
    """Public categories listing."""
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        store = get_store_or_404(self.kwargs['subdomain'])
        if not store:
            return Category.objects.none()
        return Category.objects.filter(store=store, is_active=True)


class StorefrontCategoryDetailView(APIView):
    """Public category detail with products in it."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, subdomain, slug):
        store = get_store_or_404(subdomain)
        if not store:
            return Response({'error': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            category = Category.objects.get(store=store, slug=slug, is_active=True)
            products = Product.objects.filter(store=store, category=category, status='active').prefetch_related(
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
            
            # Include product-specific active pixels
            from apps.pixels.models import PixelConfig
            from apps.pixels.serializers import PixelConfigSerializer
            pixels = PixelConfig.objects.filter(store=store, is_active=True, product=product)
            data['pixels'] = PixelConfigSerializer(pixels, many=True).data
            return Response(data)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)


class StorefrontCheckoutView(APIView):
    """Public COD checkout — place an order."""
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
            pixels = PixelConfig.objects.filter(
                store=store,
                platform='meta',
                is_active=True
            ).filter(
                Q(product__isnull=True) | Q(product__id__in=product_ids)
            )

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

            names = order.full_name.strip().split(' ', 1)
            first_name = names[0] if names else ''
            last_name = names[1] if len(names) > 1 else ''

            h_fn = hash_data(first_name)
            h_ln = hash_data(last_name)
            h_ph = hash_data(normalize_phone(order.phone))

            # Get event_id from browser pixel for deduplication (#4)
            frontend_event_id = request.data.get('event_id', str(order.id))

            def send_capi_event(pixel_id, access_token, o, client_ip, client_ua, fn, ln, ph, event_id):
                url = f"https://graph.facebook.com/v19.0/{pixel_id}/events"
                contents = []
                for item in o.items.all():
                    contents.append({
                        'id': str(item.product.id),
                        'quantity': item.quantity,
                        'item_price': float(item.price)
                    })

                # Build proper event source URL using store subdomain or custom domain
                source_url = f"https://{store.custom_domain}" if store.custom_domain else f"http://{store.subdomain}.localhost:3000"

                payload = {
                    "data": [
                        {
                            "event_name": "Purchase",
                            "event_time": int(time.time()),
                            "event_id": event_id,  # Matches browser pixel event_id for deduplication
                            "user_data": {
                                "ph": [ph] if ph else [],
                                "fn": [fn] if fn else [],
                                "ln": [ln] if ln else [],
                                "client_ip_address": client_ip,
                                "client_user_agent": client_ua
                            },
                            "custom_data": {
                                "currency": "DZD",
                                "value": float(o.total),
                                "content_type": "product",
                                "contents": contents,
                                "num_items": sum(c['quantity'] for c in contents),
                            },
                            "event_source_url": source_url,
                            "action_source": "website"
                        }
                    ],
                    "access_token": access_token
                }
                try:
                    requests.post(url, json=payload, timeout=8)
                except Exception:
                    pass

            for pixel in pixels:
                if pixel.access_token:
                    threading.Thread(
                        target=send_capi_event,
                        args=(
                            pixel.pixel_id,
                            pixel.access_token,
                            order,
                            ip,
                            user_agent,
                            h_fn,
                            h_ln,
                            h_ph,
                            frontend_event_id,
                        ),
                        daemon=True
                    ).start()

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

        response_data = {
            'message': 'Order placed successfully!',
            'order_number': order.order_number,
        }

        if idempotency_key:
            from django.core.cache import cache
            cache.set(f"checkout_idempotency_{idempotency_key}", response_data, 300)

        return Response(response_data, status=status.HTTP_201_CREATED)


class StorefrontWilayasView(APIView):
    """List all wilayas with store delivery prices."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, subdomain):
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
        return Response(data)


class StorefrontCommunesView(generics.ListAPIView):
    """List communes for a wilaya (lookup by wilaya code)."""
    serializer_class = CommuneSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        wilaya = Wilaya.objects.filter(code=self.kwargs['wilaya_id']).first()
        if not wilaya:
            return Commune.objects.none()
        return Commune.objects.filter(wilaya=wilaya)


class StorefrontLandingPageView(APIView):
    """Public landing page."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, subdomain, slug):
        store = get_store_or_404(subdomain)
        if not store:
            return Response({'error': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            page = LandingPage.objects.prefetch_related('sections').get(
                store=store, slug=slug, is_active=True
            )
            return Response(LandingPagePublicSerializer(page).data)
        except LandingPage.DoesNotExist:
            return Response({'error': 'Page not found.'}, status=status.HTTP_404_NOT_FOUND)


class StorefrontProductReviewsView(APIView):
    """Public product reviews — GET approved reviews, POST submit a new review."""
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
