from django.contrib import admin
from .models import Wilaya, Commune, DeliveryCompany


@admin.register(Wilaya)
class WilayaAdmin(admin.ModelAdmin):
    list_display = ['code', 'name_ar', 'name_fr']
    search_fields = ['name_ar', 'name_fr']


@admin.register(Commune)
class CommuneAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'name_fr', 'wilaya', 'postal_code']
    list_filter = ['wilaya']
    search_fields = ['name_ar', 'name_fr']


@admin.register(DeliveryCompany)
class DeliveryCompanyAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'name', 'is_active']
