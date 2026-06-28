"""Integrations serializers."""
from rest_framework import serializers
from .models import GoogleSheetsConfig

class GoogleSheetsConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoogleSheetsConfig
        fields = ['id', 'spreadsheet_id', 'sheet_name', 'credentials_json', 'is_active', 'sync_on_create']
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data['store'] = self.context['store']
        return super().create(validated_data)


from .models import ClaudeConfig

class ClaudeConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClaudeConfig
        fields = ['id', 'api_key', 'is_active', 'auto_fraud_check', 'auto_draft_replies', 'auto_product_copy', 'system_prompt']
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data['store'] = self.context['store']
        return super().create(validated_data)


from .models import TelegramConfig

class TelegramConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelegramConfig
        fields = ['id', 'bot_token', 'chat_id', 'is_active', 'send_on_create', 'send_on_status_change']
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data['store'] = self.context['store']
        return super().create(validated_data)


