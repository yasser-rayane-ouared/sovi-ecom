from django.contrib import admin
from .models import Plan, PaymentReceipt, StoreSubscription

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'display_name_ar', 'price_da', 'trial_days', 'is_active')
    search_fields = ('name', 'display_name_ar')


@admin.register(PaymentReceipt)
class PaymentReceiptAdmin(admin.ModelAdmin):
    list_display = ('id', 'store', 'plan', 'payment_method', 'amount_da', 'status', 'submitted_at')
    list_filter = ('status', 'payment_method', 'submitted_at')
    search_fields = ('store__name', 'id')
    readonly_fields = ('submitted_at',)


@admin.register(StoreSubscription)
class StoreSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('store', 'plan', 'is_trial', 'status', 'start_date', 'end_date', 'created_at')
    list_filter = ('status', 'is_trial', 'start_date', 'end_date')
    search_fields = ('store__name', 'plan__name')
    readonly_fields = ('created_at',)
