"""Store URL routes."""
from django.urls import path
from . import views

urlpatterns = [
    path('check-domain/', views.CaddyAskDomainView.as_view(), name='store-check-domain'),
    path('', views.StoreListCreateView.as_view(), name='store-list-create'),
    path('<uuid:pk>/', views.StoreDetailView.as_view(), name='store-detail'),
    path('<uuid:store_id>/settings/', views.StoreSettingsView.as_view(), name='store-settings'),
    path('<uuid:store_id>/setup/', views.SetupWizardView.as_view(), name='store-setup'),
    path('<uuid:store_id>/workers/', views.StoreWorkerListCreateView.as_view(), name='store-worker-list-create'),
    path('<uuid:store_id>/workers/<uuid:worker_id>/', views.StoreWorkerDetailView.as_view(), name='store-worker-detail'),
]
