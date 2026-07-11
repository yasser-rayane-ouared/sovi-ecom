"""Storefront public API URLs."""
from django.urls import path
from . import storefront_views
from apps.products.views import StorefrontReviewImageUploadView

urlpatterns = [
    path('<str:subdomain>/', storefront_views.StorefrontInfoView.as_view(), name='storefront-info'),
    path('<str:subdomain>/products/', storefront_views.StorefrontProductsView.as_view(), name='storefront-products'),
    path('<str:subdomain>/categories/', storefront_views.StorefrontCategoriesView.as_view(), name='storefront-categories'),
    path('<str:subdomain>/categories/<slug:slug>/', storefront_views.StorefrontCategoryDetailView.as_view(), name='storefront-category-detail'),
    path('<str:subdomain>/products/<slug:slug>/', storefront_views.StorefrontProductDetailView.as_view(), name='storefront-product-detail'),
    path('<str:subdomain>/products/<slug:slug>/reviews/', storefront_views.StorefrontProductReviewsView.as_view(), name='storefront-product-reviews'),
    path('<str:subdomain>/checkout/', storefront_views.StorefrontCheckoutView.as_view(), name='storefront-checkout'),
    path('<str:subdomain>/leads/', storefront_views.StorefrontLeadCreateView.as_view(), name='storefront-leads'),
    path('<str:subdomain>/wilayas/', storefront_views.StorefrontWilayasView.as_view(), name='storefront-wilayas'),
    path('<str:subdomain>/wilayas/<int:wilaya_id>/communes/', storefront_views.StorefrontCommunesView.as_view(), name='storefront-communes'),
    path('<str:subdomain>/wilayas/<int:wilaya_id>/stopdesks/', storefront_views.StorefrontStopdesksView.as_view(), name='storefront-stopdesks'),
    path('<str:subdomain>/pages/<slug:slug>/', storefront_views.StorefrontLandingPageView.as_view(), name='storefront-landing-page'),
    path('<str:subdomain>/upload-review-photo/', StorefrontReviewImageUploadView.as_view(), name='storefront-review-photo-upload'),
]
