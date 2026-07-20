"""Pixel configuration models."""
import uuid
from django.db import models
from apps.common.models import TenantModel

class PixelConfig(TenantModel):
    PLATFORM_CHOICES = [
        ('meta', 'Meta Pixel'),
        ('tiktok', 'TikTok Pixel'),
        ('snapchat', 'Snapchat Pixel'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, blank=True)
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    pixel_id = models.CharField(max_length=255)
    access_token = models.TextField(blank=True, help_text='Required for Conversions API integrations (optional)')
    test_event_code = models.CharField(max_length=100, blank=True, null=True, help_text='Optional Meta Test Event Code (e.g. TEST12345)')
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pixels'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'pixel_configs'

    def __str__(self):
        product_str = f" - Product: {self.product.title}" if self.product else " - Global"
        return f'{self.name or self.get_platform_display()} ({self.pixel_id}){product_str} - {self.store.name}'
