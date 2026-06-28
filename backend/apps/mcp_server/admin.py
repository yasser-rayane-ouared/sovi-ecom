from django.contrib import admin
from .models import McpApiKey, McpToolCallLog

@admin.register(McpApiKey)
class McpApiKeyAdmin(admin.ModelAdmin):
    list_display = ('name', 'store', 'key_prefix', 'is_active', 'created_at', 'last_used_at', 'revoked_at')
    list_filter = ('is_active', 'store')
    search_fields = ('name', 'key_prefix', 'store__name')
    readonly_fields = ('key_hash', 'key_prefix', 'created_at', 'last_used_at', 'revoked_at')

    def has_add_permission(self, request):
        return False


@admin.register(McpToolCallLog)
class McpToolCallLogAdmin(admin.ModelAdmin):
    list_display = ('tool_name', 'store', 'success', 'created_at')
    list_filter = ('success', 'tool_name', 'store')
    search_fields = ('tool_name', 'store__name', 'error_message')
    readonly_fields = ('store', 'api_key', 'tool_name', 'arguments', 'result_summary', 'success', 'error_message', 'created_at')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
