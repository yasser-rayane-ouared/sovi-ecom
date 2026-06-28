from django.contrib import admin
from .models import PixelConfig

@admin.register(PixelConfig)
class PixelConfigAdmin(admin.ModelAdmin):
    list_display = ['platform', 'pixel_id', 'store', 'is_active']
    list_filter = ['platform', 'is_active']
