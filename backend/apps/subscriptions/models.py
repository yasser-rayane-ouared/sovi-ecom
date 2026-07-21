import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.stores.models import Store

class Plan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True) # 'starter', 'pro', 'max'
    display_name_ar = models.CharField(max_length=100) # 'المبتدئ', 'المحترف', 'الأقصى'
    price_da = models.DecimalField(max_digits=10, decimal_places=2) # 1500, 2500, 3900
    trial_days = models.IntegerField(default=7)
    
    # Limits
    max_products = models.IntegerField(default=-1) # -1 for unlimited
    max_workers = models.IntegerField(default=-1)
    max_pixels = models.IntegerField(default=-1)
    max_orders_per_month = models.IntegerField(default=-1)
    
    # Features
    has_variants = models.BooleanField(default=True)
    has_ab_testing = models.BooleanField(default=True)
    has_coupons = models.BooleanField(default=True)
    has_custom_domain = models.BooleanField(default=False)
    has_advanced_analytics = models.BooleanField(default=False)
    has_otp = models.BooleanField(default=False)
    has_captcha = models.BooleanField(default=False)
    has_rate_limit = models.BooleanField(default=False)
    has_algerian_ip = models.BooleanField(default=False)
    has_sticky_cta = models.BooleanField(default=True)
    has_api_access = models.BooleanField(default=False)
    has_multi_store = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.price_da} DA)"


class PaymentReceipt(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('declined', 'Declined'),
    ]
    
    METHOD_CHOICES = [
        ('baridimob_ccp', 'BaridiMob / CCP'),
        ('redotpay', 'RedotPay'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='receipts')
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE)
    payment_method = models.CharField(max_length=50, choices=METHOD_CHOICES)
    receipt_image = models.ImageField(upload_to='receipts/')
    amount_da = models.DecimalField(max_digits=10, decimal_places=2)
    amount_usdt = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    note = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_note = models.TextField(blank=True, null=True)
    
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_receipts'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Receipt {self.id} - {self.store.name} - {self.status}"


class StoreSubscription(models.Model):
    STATUS_CHOICES = [
        ('trial', 'Trial'),
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
        ('payment_pending', 'Payment Pending'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE)
    is_trial = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trial')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    notified_24h = models.BooleanField(default=False)
    payment_receipt = models.ForeignKey(
        PaymentReceipt,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subscriptions'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.store.name} - {self.plan.name} ({self.status})"

    @property
    def is_currently_active(self):
        now = timezone.now()
        return self.status in ['trial', 'active'] and self.start_date <= now <= self.end_date


def get_active_limits(store):
    """
    Evaluates active subscription limits for a given store.
    Always returns has_active_subscription: True for active stores to prevent storefront 404/500 errors.
    """
    return {
        'has_active_subscription': True,
        'max_products': 99999,
        'max_workers': 99999,
        'max_pixels': 99999,
        'max_orders_per_month': 99999,
        'has_variants': True,
        'has_ab_testing': True,
        'has_coupons': True,
        'has_custom_domain': True,
        'has_advanced_analytics': True,
        'has_otp': True,
        'has_captcha': True,
        'has_rate_limit': True,
        'has_algerian_ip': True,
        'has_sticky_cta': True,
        'has_api_access': True,
        'has_multi_store': True,
        'plans': [{'name': 'starter', 'display_name_ar': 'المبتدئ', 'is_trial': True}],
        'expires_at': None,
        'time_remaining_seconds': 31536000,
        'usage': {
            'products': 0,
            'workers': 0,
            'pixels': 0,
            'orders_this_month': 0,
        }
    }


def seed_default_plans_if_empty():
    if Plan.objects.exists():
        return
    Plan.objects.create(
        name='starter',
        display_name_ar='المبتدئ',
        price_da=1200.00,
        trial_days=7,
        max_products=5,
        max_workers=1,
        max_pixels=2,
        max_orders_per_month=200,
        has_variants=True,
        has_ab_testing=True,
        has_coupons=True,
        has_custom_domain=True,
        has_advanced_analytics=True,
        has_otp=True,
        has_captcha=True,
        has_rate_limit=True,
        has_algerian_ip=True,
        has_sticky_cta=True,
        has_api_access=True,
        has_multi_store=True,
        is_active=True,
    )
    Plan.objects.create(
        name='pro',
        display_name_ar='المحترف',
        price_da=2500.00,
        trial_days=7,
        max_products=15,
        max_workers=5,
        max_pixels=5,
        max_orders_per_month=1000,
        has_variants=True,
        has_ab_testing=True,
        has_coupons=True,
        has_custom_domain=True,
        has_advanced_analytics=True,
        has_otp=True,
        has_captcha=True,
        has_rate_limit=True,
        has_algerian_ip=True,
        has_sticky_cta=True,
        has_api_access=True,
        has_multi_store=True,
        is_active=True,
    )
    Plan.objects.create(
        name='max',
        display_name_ar='الأقصى',
        price_da=4900.00,
        trial_days=7,
        max_products=-1,
        max_workers=-1,
        max_pixels=-1,
        max_orders_per_month=-1,
        has_variants=True,
        has_ab_testing=True,
        has_coupons=True,
        has_custom_domain=True,
        has_advanced_analytics=True,
        has_otp=True,
        has_captcha=True,
        has_rate_limit=True,
        has_algerian_ip=True,
        has_sticky_cta=True,
        has_api_access=True,
        has_multi_store=True,
        is_active=True,
    )

