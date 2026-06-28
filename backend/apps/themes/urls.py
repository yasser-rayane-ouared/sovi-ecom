"""Theme URL routes."""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.ThemeListView.as_view(), name='theme-list'),
    path('<slug:slug>/', views.ThemeDetailView.as_view(), name='theme-detail'),
]
