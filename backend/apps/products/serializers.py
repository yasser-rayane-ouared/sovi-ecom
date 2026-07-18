"""Product serializers."""
from django.utils.text import slugify
from rest_framework import serializers
from .models import (
    Product, ProductImage, ProductVideo, ProductVariant,
    VariantOption, QuantityOffer, BundleOffer, BundleOfferItem,
    ProductSection, Category, ProductReview,
)


class CategorySerializer(serializers.ModelSerializer):
    layout_sections = serializers.CharField(required=False, default='[]')

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image_url', 'is_active', 'layout_sections', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_slug(self, value):
        import re
        if not re.match(r'^[-a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError("الرمز التعريفي (Slug) يمكن أن يحتوي فقط على أحرف، أرقام، شرطة (-)، وشرطة سفلية (_).")
        return value

    def to_internal_value(self, data):
        import json
        if 'layout_sections' in data and isinstance(data['layout_sections'], list):
            data = {**data, 'layout_sections': json.dumps(data['layout_sections'], ensure_ascii=False)}
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        import json
        if isinstance(data.get('layout_sections'), str):
            try:
                data['layout_sections'] = json.loads(data['layout_sections'])
            except (json.JSONDecodeError, TypeError):
                data['layout_sections'] = []
        return data


class CommaSeparatedListField(serializers.ListField):
    """Stores list as comma-separated string in TextField."""

    def to_representation(self, data):
        if isinstance(data, str):
            data = [b.strip() for b in data.split(',') if b.strip()]
        return super().to_representation(data)


class ProductImageSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)

    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'alt_text', 'position', 'is_primary']


class ProductVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVideo
        fields = ['id', 'video_url', 'position']


class VariantOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariantOption
        fields = ['id', 'option_type', 'label', 'value']


class ProductVariantSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    options = VariantOptionSerializer(many=True, required=False)
    image_url = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = ProductVariant
        fields = ['id', 'name', 'sku', 'price', 'stock_quantity', 'low_stock_threshold', 'is_active', 'image', 'image_url', 'options']




class QuantityOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuantityOffer
        fields = ['id', 'quantity', 'price', 'label']


class BundleOfferItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)

    class Meta:
        model = BundleOfferItem
        fields = ['id', 'product', 'product_title', 'quantity']


class BundleOfferSerializer(serializers.ModelSerializer):
    items = BundleOfferItemSerializer(many=True, read_only=True)

    class Meta:
        model = BundleOffer
        fields = ['id', 'name', 'price', 'items']


class ProductSectionSerializer(serializers.ModelSerializer):
    config = serializers.CharField(required=False, default='{}')

    class Meta:
        model = ProductSection
        fields = ['id', 'section_type', 'order', 'config']
        read_only_fields = ['id']

    def validate_section_type(self, value):
        if value == 'security_phone_validation':
            raise serializers.ValidationError("هذا الخيار مفعل تلقائياً ولا يمكن إضافته كقسم مخصص.")
        if value.startswith('security_'):
            request = self.context.get('request')
            if request:
                kwargs = request.parser_context.get('kwargs', {})
                product_id = kwargs.get('product_id')
                if product_id:
                    qs = ProductSection.objects.filter(product_id=product_id, section_type=value)
                    if self.instance:
                        qs = qs.exclude(id=self.instance.id)
                    if qs.exists():
                        raise serializers.ValidationError("لا يمكنك تكرار نفس خيار الأمان.")
        return value

    def to_internal_value(self, data):
        import json
        if 'config' in data and isinstance(data['config'], dict):
            data = {**data, 'config': json.dumps(data['config'], ensure_ascii=False)}
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        import json
        if isinstance(data.get('config'), str):
            try:
                data['config'] = json.loads(data['config'])
            except (json.JSONDecodeError, TypeError):
                data['config'] = {}
        return data


class ProductABVariantSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    videos = ProductVideoSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    quantity_offers = QuantityOfferSerializer(many=True, read_only=True)
    bundle_offers = BundleOfferSerializer(many=True, read_only=True)
    sections = ProductSectionSerializer(many=True, read_only=True)
    primary_image = serializers.CharField(read_only=True)
    stock = serializers.IntegerField(source='stock_quantity', read_only=True)
    discount_percentage = serializers.ReadOnlyField()
    badges = CommaSeparatedListField(child=serializers.CharField(), read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'slug', 'description', 'price', 'compare_price',
            'cost_price', 'ad_cost_per_order', 'confirmation_cost', 'packaging_cost', 'return_cost', 'other_costs',
            'sku', 'category', 'category_name', 'status', 'is_featured', 'track_inventory',
            'stock_quantity', 'low_stock_threshold', 'stock', 'seo_title', 'seo_description',
            'enable_quantity_offers', 'enable_bundle_offers',
            'images', 'videos', 'variants', 'quantity_offers', 'bundle_offers',
            'sections', 'badges', 'theme',
            'primary_image', 'discount_percentage', 'created_at', 'updated_at',
        ]


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, required=False)
    videos = ProductVideoSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, required=False)
    quantity_offers = QuantityOfferSerializer(many=True, required=False)
    bundle_offers = BundleOfferSerializer(many=True, read_only=True)
    sections = ProductSectionSerializer(many=True, read_only=True)
    primary_image = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    stock = serializers.IntegerField(source='stock_quantity', required=False, default=100)
    slug = serializers.CharField(required=False)
    discount_percentage = serializers.ReadOnlyField()
    badges = CommaSeparatedListField(child=serializers.CharField(), required=False, default=list)

    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False, allow_null=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    ab_test_product_b = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), required=False, allow_null=True)
    ab_test_product_b_detail = ProductABVariantSerializer(source='ab_test_product_b', read_only=True)

    def validate_badges(self, value):
        if isinstance(value, list):
            return ','.join(v.strip() for v in value if v.strip())
        return value

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'slug', 'description', 'price', 'compare_price',
            'cost_price', 'ad_cost_per_order', 'confirmation_cost', 'packaging_cost', 'return_cost', 'other_costs',
            'sku', 'category', 'category_name', 'status', 'is_featured', 'track_inventory',
            'stock_quantity', 'low_stock_threshold', 'stock', 'seo_title', 'seo_description',
            'enable_quantity_offers', 'enable_bundle_offers',
            'images', 'videos', 'variants', 'quantity_offers', 'bundle_offers',
            'sections', 'badges', 'theme',
            'primary_image', 'discount_percentage', 'enable_ab_test', 'ab_test_product_b', 'ab_test_product_b_detail', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        primary_image_url = validated_data.pop('primary_image', None)
        quantity_offers_data = validated_data.pop('quantity_offers', [])
        images_data = validated_data.pop('images', [])
        variants_data = validated_data.pop('variants', [])
        validated_data['store'] = self.context['store']
        
        # Auto-generate unique slug if not provided
        if not validated_data.get('slug'):
            title = validated_data.get('title', '')
            slug = slugify(title, allow_unicode=True)
            if not slug:
                import uuid
                slug = str(uuid.uuid4())[:8]
            
            store = validated_data['store']
            original_slug = slug
            counter = 1
            while Product.objects.filter(store=store, slug=slug).exists():
                slug = f"{original_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug

        validated_data.setdefault('status', 'active')
        product = super().create(validated_data)
        if quantity_offers_data:
            for offer_data in quantity_offers_data:
                QuantityOffer.objects.create(product=product, **offer_data)

        # Save images
        saved_images = []
        if images_data:
            for idx, img_data in enumerate(images_data):
                img = ProductImage.objects.create(
                    product=product,
                    image_url=img_data['image_url'],
                    alt_text=img_data.get('alt_text', ''),
                    position=idx,
                    is_primary=(idx == 0)
                )
                saved_images.append(img)
        elif primary_image_url:
            img = ProductImage.objects.create(
                product=product,
                image_url=primary_image_url,
                is_primary=True,
                position=0
            )
            saved_images.append(img)

        # Save variants
        if variants_data:
            for var_data in variants_data:
                options_data = var_data.pop('options', [])
                var_image_url = var_data.pop('image_url', None)

                # Resolve variant linked image URL
                linked_image = None
                if var_image_url:
                    linked_image = next((img for img in saved_images if img.image_url == var_image_url), None)
                    if not linked_image:
                        linked_image = ProductImage.objects.filter(product=product, image_url=var_image_url).first()
                elif var_data.get('image'):
                    linked_image = var_data.get('image')

                variant = ProductVariant.objects.create(
                    product=product,
                    name=var_data.get('name'),
                    sku=var_data.get('sku', ''),
                    price=var_data.get('price'),
                    stock_quantity=var_data.get('stock_quantity', 0),
                    is_active=var_data.get('is_active', True),
                    image=linked_image
                )
                for opt_data in options_data:
                    VariantOption.objects.create(variant=variant, **opt_data)

        return product

    def update(self, instance, validated_data):
        primary_image_url = validated_data.pop('primary_image', None)
        quantity_offers_data = validated_data.pop('quantity_offers', None)
        images_data = validated_data.pop('images', None)
        variants_data = validated_data.pop('variants', None)
        
        # Auto-generate unique slug on update if slug is modified or removed
        if 'slug' in validated_data and not validated_data.get('slug'):
            title = validated_data.get('title', instance.title)
            slug = slugify(title, allow_unicode=True)
            if not slug:
                import uuid
                slug = str(uuid.uuid4())[:8]
            
            store = instance.store
            original_slug = slug
            counter = 1
            while Product.objects.filter(store=store, slug=slug).exclude(id=instance.id).exists():
                slug = f"{original_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug

        product = super().update(instance, validated_data)
        if quantity_offers_data is not None:
            product.quantity_offers.all().delete()
            for offer_data in quantity_offers_data:
                QuantityOffer.objects.create(product=product, **offer_data)

        # Sync images
        saved_images = []
        if images_data is not None:
            keep_ids = []
            for idx, img_data in enumerate(images_data):
                img_id = img_data.get('id')
                if img_id:
                    ProductImage.objects.filter(id=img_id, product=product).update(
                        image_url=img_data['image_url'],
                        alt_text=img_data.get('alt_text', ''),
                        position=idx,
                        is_primary=(idx == 0)
                    )
                    img = ProductImage.objects.get(id=img_id)
                    keep_ids.append(img.id)
                    saved_images.append(img)
                else:
                    new_img = ProductImage.objects.create(
                        product=product,
                        image_url=img_data['image_url'],
                        alt_text=img_data.get('alt_text', ''),
                        position=idx,
                        is_primary=(idx == 0)
                    )
                    keep_ids.append(new_img.id)
                    saved_images.append(new_img)
            # Delete removed images
            product.images.exclude(id__in=keep_ids).delete()
        else:
            saved_images = list(product.images.all())
            if primary_image_url:
                primary_img = product.images.filter(is_primary=True).first()
                if primary_img:
                    primary_img.image_url = primary_image_url
                    primary_img.save()
                else:
                    ProductImage.objects.create(
                        product=product,
                        image_url=primary_image_url,
                        is_primary=True,
                        position=0
                    )

        # Sync variants
        if variants_data is not None:
            keep_var_ids = []
            for var_data in variants_data:
                var_id = var_data.get('id')
                options_data = var_data.pop('options', [])
                var_image_url = var_data.pop('image_url', None)

                # Resolve variant linked image URL
                linked_image = None
                if var_image_url:
                    linked_image = next((img for img in saved_images if img.image_url == var_image_url), None)
                    if not linked_image:
                        linked_image = ProductImage.objects.filter(product=product, image_url=var_image_url).first()
                elif var_data.get('image'):
                    linked_image = var_data.get('image')

                if var_id:
                    ProductVariant.objects.filter(id=var_id, product=product).update(
                        name=var_data.get('name'),
                        sku=var_data.get('sku', ''),
                        price=var_data.get('price'),
                        stock_quantity=var_data.get('stock_quantity', 0),
                        is_active=var_data.get('is_active', True),
                        image=linked_image
                    )
                    variant = ProductVariant.objects.get(id=var_id)
                    keep_var_ids.append(variant.id)
                else:
                    variant = ProductVariant.objects.create(
                        product=product,
                        name=var_data.get('name'),
                        sku=var_data.get('sku', ''),
                        price=var_data.get('price'),
                        stock_quantity=var_data.get('stock_quantity', 0),
                        is_active=var_data.get('is_active', True),
                        image=linked_image
                    )
                    keep_var_ids.append(variant.id)

                # Sync options for this variant (delete all and recreate for simplicity)
                variant.options.all().delete()
                for opt_data in options_data:
                    VariantOption.objects.create(variant=variant, **opt_data)

            # Delete removed variants
            product.variants.exclude(id__in=keep_var_ids).delete()

        return product


class ProductReviewSerializer(serializers.ModelSerializer):
    """Used by the store owner in the dashboard to manage reviews."""
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)

    class Meta:
        model = ProductReview
        fields = [
            'id', 'product', 'product_title', 'product_slug', 'reviewer_name', 'reviewer_city', 'rating',
            'body', 'photo_url', 'is_approved', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ProductReviewCreateSerializer(serializers.ModelSerializer):
    """Used by anyone on the storefront to submit a review (no account needed)."""

    class Meta:
        model = ProductReview
        fields = ['reviewer_name', 'reviewer_city', 'rating', 'body', 'photo_url']

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value

    def validate_reviewer_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('اسم المراجع مطلوب.')
        return value.strip()
