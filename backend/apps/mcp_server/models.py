import hashlib
import secrets
from django.db import models
from apps.stores.models import Store
from apps.common.fields import JSONField

class McpApiKey(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='mcp_api_keys')
    name = models.CharField(max_length=255)
    key_hash = models.CharField(max_length=64, unique=True, db_index=True)
    key_prefix = models.CharField(max_length=16)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'mcp_api_keys'

    def __str__(self):
        return f"{self.name} ({self.key_prefix}...)"

    @classmethod
    def create_for_store(cls, store, name):
        # Generate 32 url-safe random bytes (approx 43 chars)
        raw_token = secrets.token_urlsafe(32)
        raw_key = f"mcp_live_{raw_token}"
        
        # Hash the raw key using SHA-256
        key_hash = hashlib.sha256(raw_key.encode('utf-8')).hexdigest()
        
        # The key prefix is first 16 chars of the raw key (i.e. 'mcp_live_xxxxxx')
        key_prefix = raw_key[:16]
        
        instance = cls.objects.create(
            store=store,
            name=name,
            key_hash=key_hash,
            key_prefix=key_prefix,
            is_active=True
        )
        return instance, raw_key


class McpToolCallLog(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='mcp_tool_calls')
    api_key = models.ForeignKey(McpApiKey, on_delete=models.SET_NULL, null=True, blank=True, related_name='tool_calls')
    tool_name = models.CharField(max_length=255)
    arguments = JSONField(default=dict, blank=True)
    result_summary = models.TextField(blank=True)
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mcp_tool_call_logs'
        ordering = ['-created_at']

    def __str__(self):
        status = "Success" if self.success else "Failed"
        return f"{self.tool_name} on {self.store.name} - {status}"
