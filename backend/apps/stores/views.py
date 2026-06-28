"""Store views."""
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Store, StoreSettings, StoreWorker
from .serializers import (
    StoreSerializer, StoreCreateSerializer, StoreSettingsSerializer,
    StoreWorkerSerializer
)
from .utils import get_store_for_user


class StoreListCreateView(generics.ListCreateAPIView):
    """List user's stores or create a new one."""
    pagination_class = None

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StoreCreateSerializer
        return StoreSerializer

    def get_queryset(self):
        user = self.request.user
        return Store.objects.filter(
            Q(owner=user) | Q(workers__user=user)
        ).select_related('settings', 'active_theme', 'owner').prefetch_related('workers', 'workers__user').distinct()

    def create(self, request, *args, **kwargs):
        """Override create to return full store data after creation."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        store = serializer.save()
        # Return full store data using StoreSerializer
        response_serializer = StoreSerializer(store, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class StoreDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a store."""
    serializer_class = StoreSerializer

    def get_queryset(self):
        user = self.request.user
        return Store.objects.filter(
            Q(owner=user) | Q(workers__user=user)
        ).distinct()


class StoreSettingsView(generics.RetrieveUpdateAPIView):
    """Get or update store settings."""
    serializer_class = StoreSettingsSerializer

    def get_object(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'settings')
        settings, _ = StoreSettings.objects.get_or_create(store=store)
        return settings


class SetupWizardView(APIView):
    """Complete store setup wizard."""

    def post(self, request, store_id):
        try:
            store = get_store_for_user(store_id, request.user, 'settings')
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        # Step 1: Store info
        if 'name' in data:
            store.name = data['name']
        if 'description' in data:
            store.description = data['description']
        if 'language' in data:
            store.language = data['language']
        if 'logo' in data:
            store.logo = data['logo']
        store.save()

        # Step 2: Settings
        settings, _ = StoreSettings.objects.get_or_create(store=store)
        settings_fields = ['primary_color', 'secondary_color', 'contact_phone',
                          'contact_email', 'whatsapp_number', 'seo_title', 'seo_description',
                          'free_delivery_threshold', 'default_delivery_price',
                          'thank_you_message', 'confirmation_message',
                          'security_enable_phone_validation', 'security_enable_captcha',
                          'security_captcha_site_key', 'security_captcha_secret_key',
                          'security_enable_firebase_otp', 'security_firebase_config_json',
                          'security_max_orders_per_day', 'security_block_non_algerian_ips',
                          'announcement_text', 'announcement_bg_color', 'whatsapp_floating_button',
                          'badge_1_title', 'badge_1_desc', 'badge_2_title', 'badge_2_desc',
                          'badge_3_title', 'badge_3_desc']
        for field in settings_fields:
            if field in data:
                setattr(settings, field, data[field])
        settings.save()

        return Response(StoreSerializer(store, context={'request': request}).data)


class IsStoreOwnerPermission(permissions.BasePermission):
    """Custom permission to check if the user is the owner of the store."""
    def has_permission(self, request, view):
        store_id = view.kwargs.get('store_id')
        try:
            store = Store.objects.get(id=store_id)
            return store.owner == request.user
        except Store.DoesNotExist:
            return False


class StoreWorkerListCreateView(generics.ListCreateAPIView):
    """List or create workers for a store. Owner only."""
    serializer_class = StoreWorkerSerializer
    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerPermission]
    pagination_class = None

    def get_queryset(self):
        return StoreWorker.objects.filter(store_id=self.kwargs['store_id']).select_related('user')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['store'] = Store.objects.get(id=self.kwargs['store_id'])
        return ctx

    def perform_create(self, serializer):
        store_id = self.kwargs['store_id']
        store = Store.objects.get(id=store_id)
        from apps.subscriptions.models import get_active_limits
        from rest_framework.exceptions import PermissionDenied
        
        limits = get_active_limits(store)
        max_workers = limits.get('max_workers', 0)
        
        current_count = StoreWorker.objects.filter(store=store).count()
        if max_workers != -1 and current_count >= max_workers:
            raise PermissionDenied(
                detail=f'لقد وصلت إلى الحد الأقصى للمساعدين المسموح بهم في خطتك الحالية ({max_workers} مساعدين). يرجى ترقية اشتراكك لإضافة المزيد من المساعدين.'
            )
        serializer.save()


class StoreWorkerDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a worker. Owner only."""
    serializer_class = StoreWorkerSerializer
    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerPermission]
    lookup_field = 'id'
    lookup_url_kwarg = 'worker_id'

    def get_queryset(self):
        return StoreWorker.objects.filter(store_id=self.kwargs['store_id']).select_related('user')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['store'] = Store.objects.get(id=self.kwargs['store_id'])
        return ctx
