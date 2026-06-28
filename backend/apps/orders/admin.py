from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'store', 'full_name', 'phone', 'total', 'status', 'created_at']
    list_filter = ['status', 'store']
    search_fields = ['order_number', 'full_name', 'phone']
    inlines = [OrderItemInline]
