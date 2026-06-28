from rest_framework import serializers
from .models import MarketingAdvice, SystemSetting

class MarketingAdviceSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.full_name', default='System')

    class Meta:
        model = MarketingAdvice
        fields = ['id', 'title', 'content', 'category', 'author', 'author_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']


class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = ['id', 'key', 'value', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

