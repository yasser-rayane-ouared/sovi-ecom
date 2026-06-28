from django.contrib import admin
from .models import GoogleSheetsConfig, ClaudeConfig, TelegramConfig

@admin.register(GoogleSheetsConfig)
class GoogleSheetsConfigAdmin(admin.ModelAdmin):
    list_display = ['store', 'spreadsheet_id', 'sheet_name', 'is_active']

@admin.register(ClaudeConfig)
class ClaudeConfigAdmin(admin.ModelAdmin):
    list_display = ['store', 'is_active', 'auto_fraud_check']

@admin.register(TelegramConfig)
class TelegramConfigAdmin(admin.ModelAdmin):
    list_display = ['store', 'bot_token', 'chat_id', 'is_active']
