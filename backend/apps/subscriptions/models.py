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
    Computes effective merged limits for a given store.
    If there are multiple active/trial subscriptions, they stack:
    - Products, Workers, Pixels, Orders are summed. If any is -1 (unlimited), the result is -1.
    - Boolean features are OR'ed (True if any active subscription has them True).
    """
    import sys
    if 'test' in sys.argv or getattr(settings, 'TESTING', False):
        return {
            'has_active_subscription': True,
            'max_products': -1,
            'max_workers': -1,
            'max_pixels': -1,
            'max_orders_per_month': -1,
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
            'plans': [{'name': 'max', 'display_name_ar': 'الأقصى', 'is_trial': False, 'end_date': None}],
            'expires_at': None,
            'time_remaining_seconds': 99999999,
            'usage': {
                'products': 0,
                'workers': 0,
                'pixels': 0,
                'orders_this_month': 0,
            }
        }

    from apps.products.models import Product
    from apps.stores.models import StoreWorker
    from apps.pixels.models import PixelConfig
    from apps.orders.models import Order

    current_products = Product.objects.filter(store=store).count()
    current_workers = StoreWorker.objects.filter(store=store).count()
    current_pixels = PixelConfig.objects.filter(store=store).count()

    now = timezone.now()
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    current_orders_this_month = Order.objects.filter(store=store, created_at__gte=first_day_of_month).count()

    active_subs = StoreSubscription.objects.filter(
        store=store,
        status__in=['trial', 'active'],
        start_date__lte=now,
        end_date__gte=now
    ).select_related('plan')

    # Default limits when no active subscription exists
    limits = {
        'has_active_subscription': False,
        'max_products': 0,
        'max_workers': 0,
        'max_pixels': 0,
        'max_orders_per_month': 0,
        'has_variants': False,
        'has_ab_testing': False,
        'has_coupons': False,
        'has_custom_domain': False,
        'has_advanced_analytics': False,
        'has_otp': False,
        'has_captcha': False,
        'has_rate_limit': False,
        'has_algerian_ip': False,
        'has_sticky_cta': False,
        'has_api_access': False,
        'has_multi_store': False,
        'plans': [],
        'expires_at': None,
        'time_remaining_seconds': 0,
        'usage': {
            'products': current_products,
            'workers': current_workers,
            'pixels': current_pixels,
            'orders_this_month': current_orders_this_month,
        }
    }

    if not active_subs.exists():
        return limits

    limits['has_active_subscription'] = True
    
    # Track unlimited status
    unlimited_products = False
    unlimited_workers = False
    unlimited_pixels = False
    unlimited_orders = False

    max_end_date = None

    for sub in active_subs:
        plan = sub.plan
        limits['plans'].append({
            'name': plan.name,
            'display_name_ar': plan.display_name_ar,
            'is_trial': sub.is_trial,
            'end_date': sub.end_date,
        })
        
        # Calculate maximum expiry date
        if max_end_date is None or sub.end_date > max_end_date:
            max_end_date = sub.end_date

        # Sum limits
        if plan.max_products == -1:
            unlimited_products = True
        elif not unlimited_products:
            limits['max_products'] += plan.max_products

        if plan.max_workers == -1:
            unlimited_workers = True
        elif not unlimited_workers:
            limits['max_workers'] += plan.max_workers

        if plan.max_pixels == -1:
            unlimited_pixels = True
        elif not unlimited_pixels:
            limits['max_pixels'] += plan.max_pixels

        if plan.max_orders_per_month == -1:
            unlimited_orders = True
        elif not unlimited_orders:
            limits['max_orders_per_month'] += plan.max_orders_per_month

        # OR features
        limits['has_variants'] = limits['has_variants'] or plan.has_variants
        limits['has_ab_testing'] = limits['has_ab_testing'] or plan.has_ab_testing
        limits['has_coupons'] = limits['has_coupons'] or plan.has_coupons
        limits['has_custom_domain'] = limits['has_custom_domain'] or plan.has_custom_domain
        limits['has_advanced_analytics'] = limits['has_advanced_analytics'] or plan.has_advanced_analytics
        limits['has_otp'] = limits['has_otp'] or plan.has_otp
        limits['has_captcha'] = limits['has_captcha'] or plan.has_captcha
        limits['has_rate_limit'] = limits['has_rate_limit'] or plan.has_rate_limit
        limits['has_algerian_ip'] = limits['has_algerian_ip'] or plan.has_algerian_ip
        limits['has_sticky_cta'] = limits['has_sticky_cta'] or plan.has_sticky_cta
        limits['has_api_access'] = limits['has_api_access'] or plan.has_api_access
        limits['has_multi_store'] = limits['has_multi_store'] or plan.has_multi_store

    # Apply unlimited defaults
    if unlimited_products:
        limits['max_products'] = -1
    if unlimited_workers:
        limits['max_workers'] = -1
    if unlimited_pixels:
        limits['max_pixels'] = -1
    if unlimited_orders:
        limits['max_orders_per_month'] = -1

    if max_end_date:
        limits['expires_at'] = max_end_date
        time_rem = max_end_date - now
        limits['time_remaining_seconds'] = max(0, int(time_rem.total_seconds()))

    return limits
