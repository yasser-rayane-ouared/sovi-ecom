"""
Serializers for Algeria location models.
"""
from rest_framework import serializers
from .models import Wilaya, Commune


class WilayaSerializer(serializers.ModelSerializer):
    """Serializer for Wilaya - returns id, code, name."""
    class Meta:
        model = Wilaya
        fields = ['id', 'code', 'name']
        read_only_fields = fields


class CommuneSerializer(serializers.ModelSerializer):
    """Serializer for Commune - returns id, name (wilaya filtered via query param)."""
    class Meta:
        model = Commune
        fields = ['id', 'name']
        read_only_fields = fields


class CommuneDetailSerializer(serializers.ModelSerializer):
    """Detailed commune serializer including wilaya info."""
    wilaya_code = serializers.IntegerField(source='wilaya.code', read_only=True)
    wilaya_name = serializers.CharField(source='wilaya.name', read_only=True)

    class Meta:
        model = Commune
        fields = ['id', 'name', 'wilaya_code', 'wilaya_name']
        read_only_fields = fields
