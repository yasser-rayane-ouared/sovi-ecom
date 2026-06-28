"""Pages URL routes."""
from django.urls import path
from . import views

urlpatterns = [
    path('<uuid:store_id>/', views.LandingPageListCreateView.as_view(), name='page-list'),
    path('<uuid:store_id>/<uuid:pk>/', views.LandingPageDetailView.as_view(), name='page-detail'),
    path('<uuid:store_id>/<uuid:page_id>/sections/', views.PageSectionListCreateView.as_view(), name='section-list'),
    path('<uuid:store_id>/<uuid:page_id>/sections/reorder/', views.PageSectionUpdateOrderView.as_view(), name='section-reorder'),
    path('<uuid:store_id>/<uuid:page_id>/sections/<uuid:pk>/', views.PageSectionDetailView.as_view(), name='section-detail'),
]
