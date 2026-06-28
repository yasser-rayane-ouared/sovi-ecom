from django.urls import path
from . import views

urlpatterns = [
    # Merchant endpoints
    path('plans/', views.PlanListView.as_view(), name='sub-plans'),
    path('start-trial/', views.StartTrialView.as_view(), name='sub-start-trial'),
    path('my/', views.MySubscriptionsView.as_view(), name='sub-my'),
    path('status/', views.SubscriptionStatusView.as_view(), name='sub-status'),
    path('receipts/', views.PaymentReceiptView.as_view(), name='sub-receipts'),
    path('usdt-rate/', views.USDTExchangeRateView.as_view(), name='sub-usdt-rate'),

    # Admin endpoints
    path('admin/receipts/', views.AdminReceiptListView.as_view(), name='sub-admin-receipts'),
    path('admin/receipts/<uuid:pk>/approve/', views.AdminReceiptApproveView.as_view(), name='sub-admin-approve'),
    path('admin/receipts/<uuid:pk>/decline/', views.AdminReceiptDeclineView.as_view(), name='sub-admin-decline'),
    path('admin/accounts/', views.AdminAccountListView.as_view(), name='sub-admin-accounts'),
    path('admin/stats/', views.AdminStatsView.as_view(), name='sub-admin-stats'),
]
