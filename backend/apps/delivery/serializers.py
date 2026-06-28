"""Delivery serializers."""
from rest_framework import serializers
from .models import Wilaya, Commune, DeliveryCompany, StoreDeliveryConfig, DeliveryPricing, Shipment


class CommuneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commune
        fields = ['id', 'name_ar', 'name_fr', 'name_en', 'postal_code']


class WilayaSerializer(serializers.ModelSerializer):
    communes = CommuneSerializer(many=True, read_only=True)

    class Meta:
        model = Wilaya
        fields = ['id', 'code', 'name_ar', 'name_fr', 'name_en', 'communes']


class WilayaListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wilaya
        fields = ['id', 'code', 'name_ar', 'name_fr', 'name_en']


class DeliveryCompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryCompany
        fields = ['id', 'name', 'display_name', 'logo', 'is_active', 'supports_tracking']


class StoreDeliveryConfigSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.display_name', read_only=True)
    company_logo = serializers.URLField(source='company.logo', read_only=True)

    class Meta:
        model = StoreDeliveryConfig
        fields = ['id', 'company', 'company_name', 'company_logo',
                  'api_key', 'api_secret', 'api_id', 'is_active', 'is_default', 'webhook_url']

    def create(self, validated_data):
        validated_data['store'] = self.context['store']
        return super().create(validated_data)


class DeliveryPricingSerializer(serializers.ModelSerializer):
    wilaya_name = serializers.CharField(source='wilaya.name_ar', read_only=True)
    wilaya_name_fr = serializers.CharField(source='wilaya.name_fr', read_only=True)
    wilaya_code = serializers.IntegerField(source='wilaya.code', read_only=True)
    commune_name = serializers.CharField(source='commune.name_ar', read_only=True, default='')

    class Meta:
        model = DeliveryPricing
        fields = ['id', 'wilaya', 'wilaya_name', 'wilaya_name_fr', 'wilaya_code',
                  'commune', 'commune_name', 'home_price', 'desk_price', 'is_active']

    def create(self, validated_data):
        validated_data['store'] = self.context['store']
        return super().create(validated_data)


class ShipmentSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.display_name', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = Shipment
        fields = ['id', 'order', 'order_number', 'company', 'company_name',
                  'tracking_number', 'external_id', 'status', 'status_message',
                  'label_url', 'created_at']
