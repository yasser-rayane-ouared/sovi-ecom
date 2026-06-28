from django.contrib import admin
from .models import Store, StoreSettings


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ['name', 'subdomain', 'owner', 'language', 'is_active', 'is_suspended', 'created_at']
    list_filter = ['is_active', 'is_suspended', 'language']
    search_fields = ['name', 'subdomain', 'owner__email']


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    list_display = ['store', 'primary_color', 'free_delivery_threshold']
