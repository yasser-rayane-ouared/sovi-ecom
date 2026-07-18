"""
Product models for S Platform.
"""
import uuid
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from apps.common.models import TenantModel


class Category(TenantModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    image_url = models.URLField(max_length=1000, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    layout_sections = models.TextField(default='[]', blank=True, help_text='JSON string of custom sections layout')

    class Meta:
        db_table = 'product_categories'
        ordering = ['name']
        unique_together = ['store', 'slug']

    def __str__(self):
        return self.name


class Product(TenantModel):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    compare_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    ad_cost_per_order = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True)
    confirmation_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True)
    packaging_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True)
    return_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True)
    other_costs = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True)
    sku = models.CharField(max_length=100, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    is_featured = models.BooleanField(default=False)
    track_inventory = models.BooleanField(default=False)
    stock_quantity = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=10)

    # SEO
    seo_title = models.CharField(max_length=70, blank=True)
    seo_description = models.CharField(max_length=160, blank=True)

    # Offers
    enable_quantity_offers = models.BooleanField(default=False)
    enable_bundle_offers = models.BooleanField(default=False)

    # Badges
    badges = models.TextField(default='', blank=True, help_text='Comma-separated: best_seller,new_arrival,limited_edition,...')

    # Theme
    theme = models.CharField(max_length=50, blank=True, default='', help_text='Product page theme class name')

    # A/B Testing
    enable_ab_test = models.BooleanField(default=False, help_text='Enable A/B split-testing for this product')
    ab_test_product_b = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='+', help_text='Alternative product layout for Group B')

    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
        unique_together = ['store', 'slug']

    def __str__(self):
        return self.title

    @property
    def primary_image(self):
        img = self.images.filter(is_primary=True).first()
        return img.image_url if img else None

    @property
    def discount_percentage(self):
        if self.compare_price and self.compare_price > self.price:
            return int(((self.compare_price - self.price) / self.compare_price) * 100)
        return 0


class ProductImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField()
    alt_text = models.CharField(max_length=255, blank=True)
    position = models.IntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        db_table = 'product_images'
        ordering = ['position']


class ProductVideo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='videos')
    video_url = models.URLField()
    position = models.IntegerField(default=0)

    class Meta:
        db_table = 'product_videos'
        ordering = ['position']


class ProductVariant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    image = models.ForeignKey(ProductImage, on_delete=models.SET_NULL, null=True, blank=True, related_name='variants')
    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock_quantity = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=10)
    is_active = models.BooleanField(default=True)


    class Meta:
        db_table = 'product_variants'

    def __str__(self):
        return f'{self.product.title} - {self.name}'


class VariantOption(models.Model):
    OPTION_TYPES = [
        ('size', 'Size'),
        ('color', 'Color'),
        ('custom', 'Custom'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name='options')
    option_type = models.CharField(max_length=10, choices=OPTION_TYPES)
    label = models.CharField(max_length=50)
    value = models.CharField(max_length=100)

    class Meta:
        db_table = 'variant_options'


class QuantityOffer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='quantity_offers')
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    label = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'quantity_offers'
        ordering = ['quantity']


class BundleOffer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='bundle_offers')
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'bundle_offers'


class BundleOfferItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bundle = models.ForeignKey(BundleOffer, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)

    class Meta:
        db_table = 'bundle_offer_items'


class ProductSection(models.Model):
    SECTION_TYPES = [
        ('text', 'Text'),
        ('image', 'Image / Carousel'),
        ('reviews', 'Reviews'),
        ('before_after', 'Before / After Slider'),
        ('bundles', 'Bundle Creator'),
        ('features', 'Product Features'),
        ('product_info', 'Product Info'),
        ('quantity_offers', 'Quantity Offers'),
        ('checkout', 'Order Form'),
        ('security_captcha', 'Security: reCAPTCHA v3'),
        ('security_phone_validation', 'Security: Phone Format Validation'),
        ('security_otp', 'Security: Firebase SMS OTP'),
        ('security_rate_limit', 'Security: Rate Limit (Orders/IP)'),
        ('security_algerian_ip', 'Security: Algerian IPs Only'),
        ('security_commitment', 'Security: Customer Commitment Checkbox'),
        ('footer', 'Footer'),
        ('header', 'Header'),
        ('coupon', 'Coupon / Discount Code'),
        ('custom_html', 'Custom HTML Code'),
    ]


    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sections')
    section_type = models.CharField(max_length=50, choices=SECTION_TYPES)
    order = models.IntegerField(default=0)
    config = models.TextField(default='{}', blank=True)

    class Meta:
        db_table = 'product_sections'
        ordering = ['order']

    def __str__(self):
        return f'{self.product.title} - {self.section_type}'


class ProductReview(TenantModel):
    """Customer review for a product. No account required — anyone can submit."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='reviews'
    )
    reviewer_name = models.CharField(max_length=100)
    reviewer_city = models.CharField(max_length=100, blank=True)
    rating = models.IntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    body = models.TextField(blank=True)
    photo_url = models.URLField(max_length=1000, blank=True, null=True)
    is_approved = models.BooleanField(
        default=False,
        help_text='Only approved reviews appear on the storefront'
    )

    class Meta:
        db_table = 'product_reviews'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reviewer_name} - {self.product.title} ({self.rating}★)'
