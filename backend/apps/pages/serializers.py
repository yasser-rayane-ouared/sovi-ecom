"""Pages serializers."""
from rest_framework import serializers
from .models import LandingPage, PageSection

class PageSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageSection
        fields = ['id', 'section_type', 'position', 'config', 'is_enabled']


class LandingPageSerializer(serializers.ModelSerializer):
    sections = PageSectionSerializer(many=True, read_only=True)
    product_title = serializers.CharField(source='product.title', read_only=True, allow_null=True, default=None)

    class Meta:
        model = LandingPage
        fields = ['id', 'product', 'product_title', 'title', 'slug', 'is_active', 'seo_title', 'seo_description', 'sections', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['store'] = self.context['store']
        return super().create(validated_data)


class LandingPagePublicSerializer(serializers.ModelSerializer):
    sections = serializers.SerializerMethodField()
    product_data = serializers.SerializerMethodField()

    class Meta:
        model = LandingPage
        fields = ['id', 'title', 'slug', 'seo_title', 'seo_description', 'sections', 'product_data']

    def get_sections(self, obj):
        active_sections = obj.sections.filter(is_enabled=True).order_by('position')
        return PageSectionSerializer(active_sections, many=True).data

    def get_product_data(self, obj):
        if obj.product:
            from apps.products.serializers import ProductSerializer
            return ProductSerializer(obj.product).data
        return None
