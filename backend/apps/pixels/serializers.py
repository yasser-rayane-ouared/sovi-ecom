"""Pixels serializers."""
from rest_framework import serializers
from .models import PixelConfig

class PixelConfigSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)
    test_event_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = PixelConfig
        fields = ['id', 'name', 'platform', 'pixel_id', 'access_token', 'test_event_code', 'product', 'product_title', 'is_active']
        read_only_fields = ['id']

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = data.copy()
            if data.get('product') == '' or data.get('product') == 'null':
                data['product'] = None
            if data.get('test_event_code') is None:
                data['test_event_code'] = ''
        return super().to_internal_value(data)

    def create(self, validated_data):
        validated_data['store'] = self.context['store']
        return super().create(validated_data)
