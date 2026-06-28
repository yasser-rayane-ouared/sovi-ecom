from django.contrib import admin
from .models import Product, ProductImage, ProductVariant, Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'slug', 'is_active', 'created_at']
    list_filter = ['is_active', 'store']
    search_fields = ['name', 'slug']


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['title', 'store', 'price', 'status', 'created_at']
    list_filter = ['status', 'store']
    search_fields = ['title', 'sku']
    inlines = [ProductImageInline, ProductVariantInline]
