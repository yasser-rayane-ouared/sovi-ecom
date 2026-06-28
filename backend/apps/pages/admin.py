from django.contrib import admin
from .models import LandingPage, PageSection

class PageSectionInline(admin.TabularInline):
    model = PageSection
    extra = 0

@admin.register(LandingPage)
class LandingPageAdmin(admin.ModelAdmin):
    list_display = ['title', 'slug', 'store', 'is_active']
    list_filter = ['is_active', 'store']
    search_fields = ['title', 'slug']
    inlines = [PageSectionInline]
