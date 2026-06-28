import uuid
from django.db import models
from django.conf import settings
from apps.common.models import TenantModel

class SupportMessage(TenantModel):
    SENDER_ROLE_CHOICES = [
        ('store_owner', 'Store Owner'),
        ('website_admin', 'Website Admin'),
    ]

    MESSAGE_TYPE_CHOICES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('audio', 'Audio/Voice'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_support_messages',
    )
    sender_role = models.CharField(max_length=20, choices=SENDER_ROLE_CHOICES)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES, default='text')
    text = models.TextField(blank=True)
    file_attachment = models.FileField(upload_to='support_attachments/', null=True, blank=True)
    is_read_by_admin = models.BooleanField(default=False)
    is_read_by_owner = models.BooleanField(default=False)

    class Meta:
        db_table = 'support_messages'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender_role}: {self.message_type} (Store: {self.store.name})'
