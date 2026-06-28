import uuid
from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel, UUIDModel

class MarketingAdvice(UUIDModel, TimeStampedModel):
    CATEGORY_CHOICES = [
        ('marketing', 'Marketing Advice'),
        ('business', 'Business Advice'),
        ('general', 'General Announcement'),
    ]

    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='marketing')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='marketing_advices'
    )

    class Meta:
        db_table = 'marketing_advices'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class SystemSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'system_settings'

    def __str__(self):
        return f"{self.key}: {self.value}"
