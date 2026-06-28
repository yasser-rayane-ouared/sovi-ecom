"""Theme models."""
import uuid
from django.db import models
from apps.common.models import TimeStampedModel
from apps.common.fields import JSONField


class Theme(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    preview_image = models.URLField(blank=True)
    preview_url = models.URLField(blank=True)
    is_free = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    creator = models.CharField(max_length=100, default='S Platform')
    version = models.CharField(max_length=20, default='1.0.0')
    template_config = JSONField(default=dict, blank=True, help_text='Theme color and layout config')

    supports_rtl = models.BooleanField(default=True)
    category = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'themes'
        ordering = ['-created_at']

    def __str__(self):
        return self.name
