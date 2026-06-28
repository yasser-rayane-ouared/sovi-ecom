"""Analytics models."""
import uuid
from django.db import models
from apps.common.models import TenantModel
from apps.common.fields import JSONField



class PageView(TenantModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    page_url = models.CharField(max_length=500)
    referrer = models.CharField(max_length=500, blank=True)
    user_agent = models.TextField(blank=True)
    ip_hash = models.CharField(max_length=64, blank=True)
    country = models.CharField(max_length=2, blank=True)
    device = models.CharField(max_length=20, blank=True)
    session_id = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'page_views'
        ordering = ['-created_at']


class ConversionEvent(TenantModel):
    EVENT_TYPES = [
        ('page_view', 'Page View'),
        ('view_content', 'View Content'),
        ('add_to_cart', 'Add to Cart'),
        ('initiate_checkout', 'Initiate Checkout'),
        ('purchase', 'Purchase'),
        ('lead', 'Lead'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True, blank=True)
    value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    metadata = JSONField(default=dict, blank=True)
    session_id = models.CharField(max_length=100, blank=True)
    source = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'conversion_events'
        ordering = ['-created_at']


class SectionInteractionEvent(TenantModel):
    """Records when a visitor's browser reports a section impression on a storefront page."""
    EVENT_TYPES = [
        ('impression', 'Section Impression'),
        ('click', 'Section Click'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        'products.Product', on_delete=models.CASCADE,
        related_name='section_interactions', null=True, blank=True
    )
    section_type = models.CharField(max_length=50)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default='impression')
    session_id = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'section_interaction_events'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['store', 'product', 'section_type']),
        ]

