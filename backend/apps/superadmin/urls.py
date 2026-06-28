"""Superadmin URL routes."""
from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.SuperAdminDashboardStatsView.as_view(), name='superadmin-stats'),
    path('stores/', views.SuperAdminStoreListView.as_view(), name='superadmin-stores'),
    path('stores/<uuid:pk>/suspend/', views.SuperAdminStoreToggleSuspendView.as_view(), name='superadmin-store-suspend'),
    
    # Marketing advice CRUD
    path('advices/', views.MarketingAdviceAdminViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-advices-list-create'),
    path('advices/<uuid:pk>/', views.MarketingAdviceAdminViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='admin-advices-detail'),
    
    # System settings CRUD
    path('settings/', views.SystemSettingViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-settings-list-create'),
    path('settings/<str:key>/', views.SystemSettingViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='admin-settings-detail'),
]

