"""
URL Configuration for S Platform.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.superadmin.views import MarketingAdviceMerchantListView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/stores/', include('apps.stores.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/delivery/', include('apps.delivery.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/themes/', include('apps.themes.urls')),
    path('api/pages/', include('apps.pages.urls')),
    path('api/pixels/', include('apps.pixels.urls')),
    path('api/integrations/', include('apps.integrations.urls')),
    path('api/admin-panel/', include('apps.superadmin.urls')),
    path('api/subscriptions/', include('apps.subscriptions.urls')),
    path('api/marketing-advices/', MarketingAdviceMerchantListView.as_view(), name='marketing-advices-merchant-list'),
    path('api/', include('apps.locations.urls')),
    path('api/storefront/', include('apps.stores.storefront_urls')),
    path('api/mcp/', include('apps.mcp_server.urls')),
    path('api/support/', include('apps.support.urls')),
]
from django.views.static import serve

urlpatterns += [
    path('media/<path:path>', serve, {'document_root': settings.MEDIA_ROOT}),
]

