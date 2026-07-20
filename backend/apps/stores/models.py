"""
Store models — the core of multi-tenancy.
"""
import uuid
from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel


class Store(TimeStampedModel):
    """Represents a tenant store on the platform."""

    LANGUAGE_CHOICES = [
        ('ar', 'Arabic'),
        ('fr', 'French'),
        ('en', 'English'),
    ]

    CURRENCY_CHOICES = [
        ('DZD', 'Algerian Dinar'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='stores',
    )
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    subdomain = models.CharField(max_length=63, unique=True, db_index=True)
    description = models.TextField(blank=True)
    logo = models.URLField(blank=True)
    favicon = models.URLField(blank=True)
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='ar')
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='DZD')
    is_active = models.BooleanField(default=True)
    is_suspended = models.BooleanField(default=False)
    custom_domain = models.CharField(max_length=255, blank=True, null=True, unique=True)
    category = models.CharField(max_length=100, blank=True)

    # Theme
    active_theme = models.ForeignKey(
        'themes.Theme',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='active_stores',
    )

    class Meta:
        db_table = 'stores'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        """Invalidate storefront cache on store update."""
        super().save(*args, **kwargs)
        try:
            from django.core.cache import cache
            cache.delete(f"storefront_store_{self.subdomain.lower()}")
            if self.custom_domain:
                cache.delete(f"storefront_store_{self.custom_domain.lower()}")
        except Exception:
            pass


class StoreSettings(TimeStampedModel):
    """Store-level settings and configuration."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.OneToOneField(Store, on_delete=models.CASCADE, related_name='settings')

    # Branding
    primary_color = models.CharField(max_length=7, default='#6366f1')
    secondary_color = models.CharField(max_length=7, default='#8b5cf6')
    custom_css = models.TextField(blank=True)

    # Messaging
    thank_you_message = models.TextField(default='Thank you for your order! We will contact you shortly.')
    confirmation_message = models.TextField(default='Your order has been confirmed.')

    # Delivery
    free_delivery_threshold = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    default_delivery_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Contact
    contact_phone = models.CharField(max_length=20, blank=True)
    contact_email = models.EmailField(blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)

    # Social
    facebook_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    tiktok_url = models.URLField(blank=True)

    # SEO
    seo_title = models.CharField(max_length=70, blank=True)
    seo_description = models.CharField(max_length=160, blank=True)

    # Security
    security_enable_phone_validation = models.BooleanField(default=False)
    security_enable_captcha = models.BooleanField(default=False)
    security_captcha_site_key = models.CharField(max_length=255, blank=True, default='')
    security_captcha_secret_key = models.CharField(max_length=255, blank=True, default='')
    security_enable_firebase_otp = models.BooleanField(default=False)
    security_firebase_config_json = models.TextField(blank=True, default='')
    security_max_orders_per_day = models.IntegerField(default=5)
    security_block_non_algerian_ips = models.BooleanField(default=False)

    # Storefront Customization
    announcement_text = models.CharField(max_length=255, default='الدفع عند الاستلام في 58 ولاية!')
    announcement_bg_color = models.CharField(max_length=7, default='#4f46e5')
    whatsapp_floating_button = models.BooleanField(default=True)
    badge_1_title = models.CharField(max_length=100, default='توصيل سريع')
    badge_1_desc = models.CharField(max_length=255, default='التوصيل لجميع الولايات بأسعار مدروسة.')
    badge_2_title = models.CharField(max_length=100, default='الدفع عند الاستلام')
    badge_2_desc = models.CharField(max_length=255, default='لا تدفع أي شيء حتى تستلم منتجك بين يديك.')
    badge_3_title = models.CharField(max_length=100, default='دعم العملاء')
    badge_3_desc = models.CharField(max_length=255, default='فريق عملنا متواجد للرد على اتصالاتكم وتأكيد الطلبيات.')

    homepage_sections = models.TextField(default='[]', blank=True)

    class Meta:
        db_table = 'store_settings'

    def __str__(self):
        return f'Settings for {self.store.name}'

    def save(self, *args, **kwargs):
        """Invalidate storefront store cache when settings change."""
        super().save(*args, **kwargs)
        try:
            from django.core.cache import cache
            store = self.store
            cache.delete(f"storefront_store_{store.subdomain.lower()}")
            if store.custom_domain:
                cache.delete(f"storefront_store_{store.custom_domain.lower()}")
        except Exception:
            pass


class StoreWorker(TimeStampedModel):
    """Represents a worker associated with a store and their permissions."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='workers',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='worker_stores',
    )

    # Granular Permissions
    can_manage_products = models.BooleanField(default=False)
    can_manage_orders = models.BooleanField(default=False)
    can_manage_delivery = models.BooleanField(default=False)
    can_manage_pages = models.BooleanField(default=False)
    can_manage_themes = models.BooleanField(default=False)
    can_manage_pixels = models.BooleanField(default=False)
    can_manage_integrations = models.BooleanField(default=False)
    can_manage_settings = models.BooleanField(default=False)
    can_manage_workers = models.BooleanField(default=False)

    class Meta:
        db_table = 'store_workers'
        unique_together = ('store', 'user')

    def __str__(self):
        return f'{self.user.username or self.user.email} - worker at {self.store.name}'
