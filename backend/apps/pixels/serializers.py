"""Pixels serializers."""
from rest_framework import serializers
from .models import PixelConfig

class PixelConfigSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)

    class Meta:
        model = PixelConfig
        fields = ['id', 'name', 'platform', 'pixel_id', 'access_token', 'test_event_code', 'product', 'product_title', 'is_active']
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data['store'] = self.context['store']
        return super().create(validated_data)
