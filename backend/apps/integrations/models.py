"""Integration configuration models."""
import uuid
from django.db import models
from apps.common.models import TenantModel

class GoogleSheetsConfig(TenantModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    spreadsheet_id = models.CharField(max_length=255, blank=True)
    sheet_name = models.CharField(max_length=100, default='Orders')
    credentials_json = models.TextField(blank=True, help_text='Service account credentials JSON')
    is_active = models.BooleanField(default=False)
    sync_on_create = models.BooleanField(default=True)

    class Meta:
        db_table = 'google_sheets_configs'
        verbose_name = 'Google Sheets Config'

    def __str__(self):
        return f'Sheets Config - {self.store.name}'


class ClaudeConfig(TenantModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    api_key = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=False)
    auto_fraud_check = models.BooleanField(default=False)
    auto_draft_replies = models.BooleanField(default=False)
    auto_product_copy = models.BooleanField(default=False)
    system_prompt = models.TextField(blank=True, default='You are Claude, a helpful AI assistant integrated into Sovi - a SaaS Algerian E-Commerce Platform.')

    class Meta:
        db_table = 'claude_configs'
        verbose_name = 'Claude Config'

    def __str__(self):
        return f'Claude Config - {self.store.name}'


class TelegramConfig(TenantModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bot_token = models.CharField(max_length=255, blank=True)
    chat_id = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=False)
    send_on_create = models.BooleanField(default=True)
    send_on_status_change = models.BooleanField(default=False)

    class Meta:
        db_table = 'telegram_configs'
        verbose_name = 'Telegram Config'

    def __str__(self):
        return f'Telegram Config - {self.store.name}'


