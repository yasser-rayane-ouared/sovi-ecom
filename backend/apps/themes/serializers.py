"""Theme serializers."""
from rest_framework import serializers
from .models import Theme


class ThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Theme
        fields = ['id', 'name', 'slug', 'description', 'preview_image', 'preview_url',
                  'is_free', 'is_active', 'creator', 'version', 'template_config',
                  'supports_rtl', 'category', 'created_at']
