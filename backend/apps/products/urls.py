"""Product URL routes."""
from django.urls import path
from . import views

urlpatterns = [
    path('<uuid:store_id>/', views.ProductListCreateView.as_view(), name='product-list'),
    path('<uuid:store_id>/categories/', views.CategoryListCreateView.as_view(), name='category-list'),
    path('<uuid:store_id>/categories/<uuid:pk>/', views.CategoryDetailView.as_view(), name='category-detail'),
    path('<uuid:store_id>/<uuid:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('<uuid:store_id>/upload/', views.ProductImageUploadGeneralView.as_view(), name='product-image-upload'),
    path('<uuid:store_id>/<uuid:product_id>/images/', views.ProductImageUploadView.as_view(), name='product-images'),
    path('<uuid:store_id>/<uuid:product_id>/sections/', views.ProductSectionListCreateView.as_view(), name='product-section-list'),
    path('<uuid:store_id>/<uuid:product_id>/sections/<uuid:pk>/', views.ProductSectionDetailView.as_view(), name='product-section-detail'),
    path('<uuid:store_id>/<uuid:product_id>/sections/reorder/', views.ProductSectionReorderView.as_view(), name='product-section-reorder'),
    path('<uuid:store_id>/<uuid:product_id>/duplicate/', views.ProductDuplicateView.as_view(), name='product-duplicate'),
    # Reviews (owner only)
    path('<uuid:store_id>/reviews/', views.GlobalStoreReviewListView.as_view(), name='global-store-review-list'),
    path('<uuid:store_id>/reviews/<uuid:pk>/', views.GlobalStoreReviewDetailView.as_view(), name='global-store-review-detail'),
    path('<uuid:store_id>/<uuid:product_id>/reviews/', views.ProductReviewListView.as_view(), name='product-review-list'),
    path('<uuid:store_id>/<uuid:product_id>/reviews/<uuid:pk>/', views.ProductReviewDetailView.as_view(), name='product-review-detail'),
]
