"""Pixel URL routes."""
from django.urls import path
from . import views

urlpatterns = [
    path('<uuid:store_id>/', views.PixelConfigListCreateView.as_view(), name='pixel-list'),
    path('<uuid:store_id>/<uuid:pk>/', views.PixelConfigDetailView.as_view(), name='pixel-detail'),
]
