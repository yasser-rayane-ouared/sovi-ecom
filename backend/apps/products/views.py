"""Product views."""
from django.core.files.storage import default_storage
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny
from apps.stores.models import Store
from apps.stores.utils import get_store_for_user
from .models import Product, ProductImage, ProductVideo, ProductVariant, VariantOption, ProductSection, Category, ProductReview
from .serializers import ProductSerializer, ProductImageSerializer, ProductSectionSerializer, CategorySerializer, ProductReviewSerializer


class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    filterset_fields = ['status', 'is_featured']
    search_fields = ['title', 'sku']
    ordering_fields = ['created_at', 'price', 'title']

    def get_store(self):
        return get_store_for_user(self.kwargs['store_id'], self.request.user, 'products')

    def get_queryset(self):
        store = self.get_store()
        
        # Hide B variant products from dashboard product listings
        active_variant_ids = Product.objects.filter(
            store=store,
            ab_test_product_b__isnull=False
        ).values_list('ab_test_product_b_id', flat=True)

        return Product.objects.filter(store=store).exclude(
            id__in=active_variant_ids
        ).prefetch_related(
            'images', 'videos', 'variants__options', 'quantity_offers', 'bundle_offers__items'
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['store'] = self.get_store()
        return ctx

    def perform_create(self, serializer):
        store = self.get_store()
        from apps.subscriptions.models import get_active_limits
        from rest_framework.exceptions import PermissionDenied
        
        limits = get_active_limits(store)
        max_products = limits.get('max_products', 0)
        
        current_count = Product.objects.filter(store=store).count()
        if max_products != -1 and current_count >= max_products:
            raise PermissionDenied(
                detail=f'لقد وصلت إلى الحد الأقصى للمنتجات المسموح بها في خطتك الحالية ({max_products} منتجات). يرجى ترقية اشتراكك لإنشاء المزيد من المنتجات.'
            )
        serializer.save()


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'products')
        return Product.objects.filter(store=store).prefetch_related(
            'images', 'videos', 'variants__options', 'quantity_offers', 'bundle_offers__items'
        )


class ProductImageUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, store_id, product_id):
        store = get_store_for_user(store_id, request.user, 'products')
        product = Product.objects.get(id=product_id, store=store)

        image_url = request.data.get('image_url', '')
        is_primary = request.data.get('is_primary', False)
        position = product.images.count()

        img = ProductImage.objects.create(
            product=product,
            image_url=image_url,
            is_primary=is_primary,
            position=position,
        )
        return Response(ProductImageSerializer(img).data, status=status.HTTP_201_CREATED)


class ProductImageUploadGeneralView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, store_id):
        store = get_store_for_user(store_id, request.user, 'products')
        uploaded_file = request.FILES.get('file') or request.FILES.get('image')
        if not uploaded_file:
            return Response({'detail': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        # Save file to default storage
        file_name = default_storage.save(f'products/{uploaded_file.name}', uploaded_file)
        image_url = default_storage.url(file_name)
        # Make URL absolute
        image_url = request.build_absolute_uri(image_url)

        return Response({'image_url': image_url}, status=status.HTTP_201_CREATED)


class ProductSectionListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSectionSerializer
    pagination_class = None

    def get_store(self):
        return Store.objects.get(id=self.kwargs['store_id'], owner=self.request.user)

    def get_queryset(self):
        store = self.get_store()
        return ProductSection.objects.filter(product_id=self.kwargs['product_id'], product__store=store)

    def perform_create(self, serializer):
        store = self.get_store()
        product = Product.objects.get(id=self.kwargs['product_id'], store=store)
        max_order = ProductSection.objects.filter(product=product).count()
        serializer.save(product=product, order=max_order)


class ProductSectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSectionSerializer

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'products')
        return ProductSection.objects.filter(
            product_id=self.kwargs['product_id'],
            product__store=store
        )


class ProductSectionReorderView(APIView):
    def post(self, request, store_id, product_id):
        store = get_store_for_user(store_id, request.user, 'products')
        product = Product.objects.get(id=product_id, store=store)
        section_ids = request.data.get('section_ids', [])
        for idx, sid in enumerate(section_ids):
            ProductSection.objects.filter(id=sid, product=product).update(order=idx)
        return Response({'status': 'ok'})


class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer

    def get_store(self):
        return get_store_for_user(self.kwargs['store_id'], self.request.user, 'products')

    def get_queryset(self):
        store = self.get_store()
        return Category.objects.filter(store=store)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['store'] = self.get_store()
        return ctx

    def perform_create(self, serializer):
        store = self.get_store()
        
        # Auto-generate unique slug if not provided
        slug = serializer.validated_data.get('slug')
        if not slug:
            from django.utils.text import slugify
            name = serializer.validated_data.get('name', '')
            slug = slugify(name, allow_unicode=True)
            if not slug:
                import uuid
                slug = str(uuid.uuid4())[:8]
            
            original_slug = slug
            counter = 1
            while Category.objects.filter(store=store, slug=slug).exists():
                slug = f"{original_slug}-{counter}"
                counter += 1
            serializer.validated_data['slug'] = slug

        serializer.save(store=store)


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'products')
        return Category.objects.filter(store=store)


class ProductDuplicateView(APIView):
    """Duplication/Cloning helper for A/B Testing."""

    def post(self, request, store_id, product_id):
        from .models import QuantityOffer
        store = get_store_for_user(store_id, request.user, 'products')
        try:
            old_product = Product.objects.get(id=product_id, store=store)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=404)

        # Clone the basic fields
        import uuid
        from django.utils.text import slugify

        new_title = f"{old_product.title} - النسخة B"
        original_slug = slugify(new_title, allow_unicode=True) or str(uuid.uuid4())[:8]
        slug = original_slug
        counter = 1
        while Product.objects.filter(store=store, slug=slug).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1

        new_product = Product.objects.create(
            store=store,
            title=new_title,
            slug=slug,
            description=old_product.description,
            price=old_product.price,
            compare_price=old_product.compare_price,
            cost_price=old_product.cost_price,
            ad_cost_per_order=old_product.ad_cost_per_order,
            sku=f"{old_product.sku}-B" if old_product.sku else "",
            category=old_product.category,
            status='active',
            is_featured=False,
            track_inventory=old_product.track_inventory,
            stock_quantity=old_product.stock_quantity,
            seo_title=old_product.seo_title,
            seo_description=old_product.seo_description,
            enable_quantity_offers=old_product.enable_quantity_offers,
            enable_bundle_offers=old_product.enable_bundle_offers,
            badges=old_product.badges,
            theme=old_product.theme,
            enable_ab_test=False,
        )

        # Clone images
        for img in old_product.images.all():
            ProductImage.objects.create(
                product=new_product,
                image_url=img.image_url,
                alt_text=img.alt_text,
                position=img.position,
                is_primary=img.is_primary,
            )

        # Clone sections
        for sec in old_product.sections.all():
            ProductSection.objects.create(
                product=new_product,
                section_type=sec.section_type,
                order=sec.order,
                config=sec.config,
            )

        # Clone variants and variant options
        for var in old_product.variants.all():
            # Resolve image if any
            new_img = None
            if var.image:
                new_img = new_product.images.filter(image_url=var.image.image_url).first()

            new_var = ProductVariant.objects.create(
                product=new_product,
                image=new_img,
                name=var.name,
                sku=var.sku,
                price=var.price,
                stock_quantity=var.stock_quantity,
                is_active=var.is_active,
            )
            for opt in var.options.all():
                VariantOption.objects.create(
                    variant=new_var,
                    option_type=opt.option_type,
                    label=opt.label,
                    value=opt.value,
                )

        # Clone quantity offers
        for offer in old_product.quantity_offers.all():
            QuantityOffer.objects.create(
                product=new_product,
                quantity=offer.quantity,
                price=offer.price,
                label=offer.label,
            )

        return Response(ProductSerializer(new_product).data, status=status.HTTP_201_CREATED)


# ─── Product Review Views (Owner Dashboard) ────────────────────────────────

class ProductReviewListView(generics.ListAPIView):
    """Owner: list all reviews (approved + pending) for a product."""
    serializer_class = ProductReviewSerializer

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'products')
        return ProductReview.objects.filter(
            product_id=self.kwargs['product_id'],
            product__store=store,
        )


class ProductReviewDetailView(generics.UpdateAPIView, generics.DestroyAPIView):
    """Owner: approve/reject or delete a review."""
    serializer_class = ProductReviewSerializer

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'products')
        return ProductReview.objects.filter(
            product_id=self.kwargs['product_id'],
            product__store=store,
        )

    def patch(self, request, *args, **kwargs):
        review = self.get_object()
        is_approved = request.data.get('is_approved')
        if is_approved is not None:
            review.is_approved = bool(is_approved)
            review.save(update_fields=['is_approved'])
        return Response(ProductReviewSerializer(review).data)


class StorefrontReviewImageUploadView(APIView):
    """Public: upload a review photo (no auth required)."""
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser]

    def post(self, request, subdomain):
        from apps.stores.storefront_views import get_store_or_404
        store = get_store_or_404(subdomain)
        if not store:
            return Response({'error': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)

        uploaded_file = request.FILES.get('file') or request.FILES.get('image')
        if not uploaded_file:
            return Response({'detail': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if uploaded_file.content_type not in allowed_types:
            return Response({'detail': 'Only image files are allowed.'}, status=status.HTTP_400_BAD_REQUEST)

        # Limit file size to 5MB
        if uploaded_file.size > 5 * 1024 * 1024:
            return Response({'detail': 'File size must be under 5MB.'}, status=status.HTTP_400_BAD_REQUEST)

        file_name = default_storage.save(f'reviews/{uploaded_file.name}', uploaded_file)
        image_url = default_storage.url(file_name)
        image_url = request.build_absolute_uri(image_url)
        return Response({'image_url': image_url}, status=status.HTTP_201_CREATED)


class GlobalStoreReviewListView(generics.ListAPIView):
    """Owner: list all reviews across all products for a store."""
    serializer_class = ProductReviewSerializer

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'products')
        return ProductReview.objects.filter(store=store).select_related('product').order_by('-created_at')


class GlobalStoreReviewDetailView(generics.UpdateAPIView, generics.DestroyAPIView):
    """Owner: update (approve/reject) or delete a review directly without product context."""
    serializer_class = ProductReviewSerializer

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'products')
        return ProductReview.objects.filter(store=store)

