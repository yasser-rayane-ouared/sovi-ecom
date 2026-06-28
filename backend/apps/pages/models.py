"""
Landing Page and builder models.
"""
import uuid
from django.db import models
from apps.common.models import TenantModel
from apps.common.fields import JSONField

class LandingPage(TenantModel):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='landing_pages',
        help_text='Associate this landing page with a direct product checkout'
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    is_active = models.BooleanField(default=True)
    seo_title = models.CharField(max_length=70, blank=True)
    seo_description = models.CharField(max_length=160, blank=True)

    class Meta:
        db_table = 'landing_pages'
        unique_together = ['store', 'slug']

    def __str__(self):
        return f'{self.title} ({self.store.name})'


class PageSection(models.Model):
    SECTION_TYPES = [
        ('hero', 'Hero Banner'),
        ('product_gallery', 'Product Gallery'),
        ('carousel', 'Carousel'),
        ('reviews', 'Reviews'),
        ('faq', 'FAQ'),
        ('video', 'Video Section'),
        ('comparison', 'Comparison Section'),
        ('benefits', 'Benefits Section'),
        ('before_after', 'Before/After Section'),
        ('countdown', 'Countdown Timer'),
        ('sticky_cta', 'Sticky CTA'),
        ('quantity_offers', 'Quantity Offers'),
        ('bundle_offers', 'Bundle Offers'),
        ('delivery_info', 'Delivery Information'),
        ('text', 'Text Section'),
        ('image', 'Image Section'),
        ('floating_order_button', 'Floating Order Button'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    page = models.ForeignKey(LandingPage, on_delete=models.CASCADE, related_name='sections')
    section_type = models.CharField(max_length=30, choices=SECTION_TYPES)
    position = models.PositiveIntegerField(default=0)
    config = JSONField(default=dict, blank=True, help_text='JSON configuration for this section style and text contents')
    is_enabled = models.BooleanField(default=True)

    class Meta:
        db_table = 'page_sections'
        ordering = ['position']

    def __str__(self):
        return f'{self.get_section_type_display()} on {self.page.title} (Pos: {self.position})'
