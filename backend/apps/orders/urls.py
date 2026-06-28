"""Order URL routes."""
from django.urls import path
from . import views

urlpatterns = [
    path('<uuid:store_id>/', views.OrderListView.as_view(), name='order-list'),
    path('<uuid:store_id>/<uuid:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('<uuid:store_id>/<uuid:pk>/status/', views.OrderStatusUpdateView.as_view(), name='order-status'),
    path('<uuid:store_id>/<uuid:pk>/export-to-delivery/', views.OrderExportToDeliveryView.as_view(), name='order-export-delivery'),
    path('<uuid:store_id>/bulk/', views.OrderBulkActionView.as_view(), name='order-bulk'),
    path('<uuid:store_id>/export/', views.OrderExportView.as_view(), name='order-export'),
    path('<uuid:store_id>/sync-tracking/', views.OrderSyncTrackingView.as_view(), name='order-sync-tracking'),
]

