"""Analytics URL routes."""
from django.urls import path
from . import views

urlpatterns = [
    path('<uuid:store_id>/dashboard/', views.DashboardAnalyticsView.as_view(), name='analytics-dashboard'),
    path('<uuid:store_id>/product/<uuid:product_id>/ab-test/', views.ProductABTestAnalyticsView.as_view(), name='product-ab-test-analytics'),
    path('<uuid:store_id>/product/<uuid:product_id>/heatmap/', views.SectionHeatmapView.as_view(), name='product-section-heatmap'),
    path('<uuid:store_id>/product/<uuid:product_id>/stats/', views.ProductAnalyticsView.as_view(), name='product-analytics'),
    path('<uuid:store_id>/products-summary/', views.ProductsSummaryView.as_view(), name='products-summary'),
    path('track/', views.TrackEventView.as_view(), name='track-event'),
    path('track-section/', views.TrackSectionView.as_view(), name='track-section-event'),
]

