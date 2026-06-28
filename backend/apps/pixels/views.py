"""Pixels views."""
from rest_framework import generics
from apps.stores.models import Store
from apps.stores.utils import get_store_for_user
from .models import PixelConfig
from .serializers import PixelConfigSerializer

class PixelConfigListCreateView(generics.ListCreateAPIView):
    serializer_class = PixelConfigSerializer
    pagination_class = None

    def get_store(self):
        return get_store_for_user(self.kwargs['store_id'], self.request.user, 'pixels')

    def get_queryset(self):
        return PixelConfig.objects.filter(store=self.get_store())

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['store'] = self.get_store()
        return ctx

    def perform_create(self, serializer):
        store = self.get_store()
        from apps.subscriptions.models import get_active_limits
        from rest_framework.exceptions import PermissionDenied
        
        limits = get_active_limits(store)
        max_pixels = limits.get('max_pixels', 0)
        
        current_count = PixelConfig.objects.filter(store=store).count()
        if max_pixels != -1 and current_count >= max_pixels:
            raise PermissionDenied(
                detail=f'لقد وصلت إلى الحد الأقصى للبكسلات المسموح بها في خطتك الحالية ({max_pixels} بكسل). يرجى ترقية اشتراكك لإضافة المزيد من البكسلات.'
            )
        serializer.save()


class PixelConfigDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PixelConfigSerializer

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'pixels')
        return PixelConfig.objects.filter(store=store)
