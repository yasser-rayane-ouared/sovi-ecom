"""
Admin configuration for Algeria locations.
"""
from django.contrib import admin
from .models import Wilaya, Commune


@admin.register(Wilaya)
class WilayaAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'commune_count')
    search_fields = ('name', 'code')
    ordering = ('code',)
    list_per_page = 58

    def commune_count(self, obj):
        return obj.communes.count()
    commune_count.short_description = 'Communes'


@admin.register(Commune)
class CommuneAdmin(admin.ModelAdmin):
    list_display = ('name', 'wilaya')
    search_fields = ('name',)
    list_filter = ('wilaya',)
    ordering = ('wilaya__code', 'name')
    list_per_page = 50
    raw_id_fields = ('wilaya',)
