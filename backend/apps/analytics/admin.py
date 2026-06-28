from django.contrib import admin
from .models import PageView, ConversionEvent

admin.site.register(PageView)
admin.site.register(ConversionEvent)
