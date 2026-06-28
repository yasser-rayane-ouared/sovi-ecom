"""Delivery URL routes."""
from django.urls import path
from . import views

urlpatterns = [
    path('companies/', views.DeliveryCompanyListView.as_view(), name='delivery-companies'),
    path('<uuid:store_id>/configs/', views.StoreDeliveryConfigListCreateView.as_view(), name='delivery-configs'),
    path('<uuid:store_id>/configs/<uuid:pk>/', views.StoreDeliveryConfigDetailView.as_view(), name='delivery-config-detail'),
    path('<uuid:store_id>/configs/<uuid:company_id>/fees/', views.FetchCompanyFeesView.as_view(), name='fetch-company-fees'),
    path('<uuid:store_id>/pricing/', views.DeliveryPricingListCreateView.as_view(), name='delivery-pricing'),
    path('<uuid:store_id>/pricing/<uuid:pk>/', views.DeliveryPricingDetailView.as_view(), name='delivery-pricing-detail'),
    path('<uuid:store_id>/pricing/bulk/', views.DeliveryPricingBulkUpdateView.as_view(), name='delivery-pricing-bulk-update'),
    path('<uuid:store_id>/shipments/', views.ShipmentListView.as_view(), name='shipments'),
]
