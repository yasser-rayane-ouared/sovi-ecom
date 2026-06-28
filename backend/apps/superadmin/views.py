"""Super admin views for S Platform owner."""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status, viewsets
from apps.common.permissions import IsSuperAdmin
from apps.stores.models import Store
from apps.stores.serializers import StoreSerializer
from django.contrib.auth import get_user_model
from .models import MarketingAdvice, SystemSetting
from .serializers import MarketingAdviceSerializer, SystemSettingSerializer


User = get_user_model()

class SuperAdminDashboardStatsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        total_stores = Store.objects.count()
        active_stores = Store.objects.filter(is_active=True, is_suspended=False).count()
        suspended_stores = Store.objects.filter(is_suspended=True).count()
        total_users = User.objects.count()

        # Let's count some orders too
        from apps.orders.models import Order
        total_orders = Order.objects.count()

        return Response({
            'total_stores': total_stores,
            'active_stores': active_stores,
            'suspended_stores': suspended_stores,
            'total_users': total_users,
            'total_orders': total_orders,
        })


class SuperAdminStoreListView(generics.ListAPIView):
    permission_classes = [IsSuperAdmin]
    serializer_class = StoreSerializer
    queryset = Store.objects.all().select_related('owner', 'active_theme')
    search_fields = ['name', 'subdomain', 'owner__email']
    ordering_fields = ['created_at', 'name']


class SuperAdminStoreToggleSuspendView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        try:
            store = Store.objects.get(pk=pk)
            store.is_suspended = not store.is_suspended
            store.save()
            return Response({
                'id': store.id,
                'name': store.name,
                'is_suspended': store.is_suspended,
                'message': 'Store suspension toggled successfully.'
            })
        except Store.DoesNotExist:
            return Response({'error': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)


class MarketingAdviceAdminViewSet(viewsets.ModelViewSet):
    """
    ViewSet for superadmins to manage marketing and business advices.
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = MarketingAdviceSerializer
    queryset = MarketingAdvice.objects.all().select_related('author')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class MarketingAdviceMerchantListView(generics.ListAPIView):
    """
    View for store owners / workers to see the advice feed.
    Permissions default to IsAuthenticated (checked in base settings).
    """
    serializer_class = MarketingAdviceSerializer
    queryset = MarketingAdvice.objects.all().select_related('author')


class SystemSettingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for superadmins to manage system settings.
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = SystemSettingSerializer
    queryset = SystemSetting.objects.all()
    lookup_field = 'key'

    def get_queryset(self):
        # Seed default usdt_exchange_rate if it does not exist
        SystemSetting.objects.get_or_create(
            key='usdt_exchange_rate',
            defaults={
                'value': '260',
                'description': 'USDT exchange rate for RedotPay payments (DZD to USDT)'
            }
        )
        return super().get_queryset()


