from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta
from django.db import models
from django.shortcuts import get_object_or_404

from apps.stores.utils import get_store_for_user
from apps.stores.models import Store
from apps.common.permissions import IsSuperAdmin
from .models import Plan, StoreSubscription, PaymentReceipt, get_active_limits
from .serializers import (
    PlanSerializer, StoreSubscriptionSerializer,
    PaymentReceiptSerializer, PaymentReceiptCreateSerializer
)

class PlanListView(generics.ListAPIView):
    """List all active subscription plans."""
    serializer_class = PlanSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Plan.objects.filter(is_active=True).order_by('price_da')
    pagination_class = None


class StartTrialView(APIView):
    """Start 7-day free trial on a selected plan for a store."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        store_id = request.data.get('store_id')
        plan_id = request.data.get('plan_id')
        
        if not store_id or not plan_id:
            return Response(
                {'error': 'Both store_id and plan_id are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        store = get_store_for_user(store_id, request.user)
        plan = get_object_or_404(Plan, id=plan_id, is_active=True)
        
        # Check if the store already has any trial or active subscription
        if StoreSubscription.objects.filter(store=store).exists():
            return Response(
                {'error': 'هذا المتجر قد استخدم الفترة التجريبية بالفعل أو لديه اشتراك نشط.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        now = timezone.now()
        subscription = StoreSubscription.objects.create(
            store=store,
            plan=plan,
            is_trial=True,
            status='trial',
            start_date=now,
            end_date=now + timedelta(days=plan.trial_days)
        )
        
        serializer = StoreSubscriptionSerializer(subscription)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MySubscriptionsView(generics.ListAPIView):
    """List all subscriptions for a specific store."""
    serializer_class = StoreSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        store_id = self.request.query_params.get('store_id')
        if not store_id:
            return StoreSubscription.objects.none()
        store = get_store_for_user(store_id, self.request.user)
        return StoreSubscription.objects.filter(store=store).order_by('-created_at')


class SubscriptionStatusView(APIView):
    """Get effective limits and remaining time for a store."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        store_id = request.query_params.get('store_id')
        if not store_id:
            return Response(
                {'error': 'store_id query parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        store = get_store_for_user(store_id, request.user)
        limits = get_active_limits(store)
        return Response(limits)


class PaymentReceiptView(APIView):
    """Upload or list receipts for a specific store."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        store_id = request.query_params.get('store_id')
        if not store_id:
            return Response(
                {'error': 'store_id query parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        store = get_store_for_user(store_id, request.user)
        receipts = PaymentReceipt.objects.filter(store=store).order_by('-submitted_at')
        serializer = PaymentReceiptSerializer(receipts, many=True)
        return Response(serializer.data)

    def post(self, request):
        store_id = request.data.get('store_id') or request.query_params.get('store_id')
        print(f"DEBUG: PaymentReceiptView.post: store_id={store_id}, user={request.user}, type_store_id={type(store_id)}")
        if not store_id:
            return Response(
                {'error': 'store_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        store = get_store_for_user(store_id, request.user)
        
        serializer = PaymentReceiptCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        payment_method = serializer.validated_data.get('payment_method')
        amount_da = serializer.validated_data.get('amount_da')
        amount_usdt = serializer.validated_data.get('amount_usdt')
        
        if payment_method == 'redotpay':
            from apps.superadmin.models import SystemSetting
            from decimal import Decimal
            setting, _ = SystemSetting.objects.get_or_create(
                key='usdt_exchange_rate',
                defaults={
                    'value': '260',
                    'description': 'USDT exchange rate for RedotPay payments (DZD to USDT)'
                }
            )
            try:
                rate = Decimal(setting.value)
            except Exception:
                rate = Decimal('260.0')
            
            if not amount_usdt and amount_da:
                amount_usdt = (Decimal(str(amount_da)) / rate).quantize(Decimal('0.01'))
            elif not amount_da and amount_usdt:
                amount_da = (Decimal(str(amount_usdt)) * rate).quantize(Decimal('0.01'))
            
            receipt = serializer.save(store=store, status='pending', amount_da=amount_da, amount_usdt=amount_usdt)
        else:
            receipt = serializer.save(store=store, status='pending', amount_usdt=None)
        
        # Mark store subscription as payment pending (optional indicator)
        # If there's an expired subscription, we can keep it, but we log the pending receipt
        
        response_serializer = PaymentReceiptSerializer(receipt)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


# =============================================================================
# Admin-only endpoints for platform owner (is_superadmin)
# =============================================================================

class AdminReceiptListView(generics.ListAPIView):
    """List all receipts submitted by merchants."""
    serializer_class = PaymentReceiptSerializer
    permission_classes = [IsSuperAdmin]
    pagination_class = None

    def get_queryset(self):
        queryset = PaymentReceipt.objects.all().order_by('-submitted_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class AdminReceiptApproveView(APIView):
    """Approve payment receipt and activate subscription."""
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        receipt = get_object_or_404(PaymentReceipt, id=pk)
        
        if receipt.status != 'pending':
            return Response(
                {'error': 'يمكن الموافقة على الإيصالات المعلقة فقط.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        admin_note = request.data.get('admin_note', '')
        
        # Update receipt
        receipt.status = 'approved'
        receipt.admin_note = admin_note
        receipt.reviewed_by = request.user
        receipt.reviewed_at = timezone.now()
        receipt.save()
        
        # Calculate start date (stack subscriptions if active subscription exists)
        now = timezone.now()
        
        # Terminate any active trial subscriptions for this store immediately
        StoreSubscription.objects.filter(
            store=receipt.store,
            is_trial=True,
            status='trial',
            end_date__gt=now
        ).update(status='expired', end_date=now)
        
        existing_active = StoreSubscription.objects.filter(
            store=receipt.store,
            plan=receipt.plan,
            status__in=['trial', 'active'],
            end_date__gt=now
        ).order_by('-end_date').first()
        
        start_date = existing_active.end_date if existing_active else now
        duration_days = 365 if 'yearly' in receipt.plan.name else 30
        end_date = start_date + timedelta(days=duration_days)
        
        # Create StoreSubscription
        subscription = StoreSubscription.objects.create(
            store=receipt.store,
            plan=receipt.plan,
            is_trial=False,
            status='active',
            start_date=start_date,
            end_date=end_date,
            payment_receipt=receipt
        )
        
        # If any pending/expired subscriptions exist, make sure status is aligned
        # (expired subscriptions are automatically updated by check_expiry, but we activate this one)
        
        return Response({
            'message': 'تمت الموافقة على الدفع وتفعيل الاشتراك بنجاح.',
            'receipt': PaymentReceiptSerializer(receipt).data,
            'subscription': StoreSubscriptionSerializer(subscription).data
        })


class AdminReceiptDeclineView(APIView):
    """Decline payment receipt."""
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        receipt = get_object_or_404(PaymentReceipt, id=pk)
        
        if receipt.status != 'pending':
            return Response(
                {'error': 'يمكن رفض الإيصالات المعلقة فقط.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        admin_note = request.data.get('admin_note')
        if not admin_note:
            return Response(
                {'error': 'يرجى كتابة سبب الرفض (admin_note).'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Update receipt
        receipt.status = 'declined'
        receipt.admin_note = admin_note
        receipt.reviewed_by = request.user
        receipt.reviewed_at = timezone.now()
        receipt.save()
        
        return Response({
            'message': 'تم رفض إيصال الدفع بنجاح.',
            'receipt': PaymentReceiptSerializer(receipt).data
        })


class AdminAccountListView(APIView):
    """List stores along with their owners and subscription statuses."""
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        stores = Store.objects.all().select_related('owner').order_by('-created_at')
        
        # Simple manual pagination or search
        search_query = request.query_params.get('search')
        if search_query:
            stores = stores.filter(
                models.Q(name__icontains=search_query) |
                models.Q(subdomain__icontains=search_query) |
                models.Q(owner__email__icontains=search_query)
            )

        data = []
        for store in stores:
            active_limits = get_active_limits(store)
            
            # Get latest subscriptions
            subs = StoreSubscription.objects.filter(store=store).select_related('plan').order_by('-created_at')[:3]
            serialized_subs = []
            for sub in subs:
                serialized_subs.append({
                    'id': sub.id,
                    'plan_name': sub.plan.name,
                    'display_name_ar': sub.plan.display_name_ar,
                    'status': sub.status,
                    'is_trial': sub.is_trial,
                    'end_date': sub.end_date
                })

            data.append({
                'store_id': store.id,
                'name': store.name,
                'subdomain': store.subdomain,
                'custom_domain': store.custom_domain,
                'owner_name': store.owner.full_name,
                'owner_email': store.owner.email,
                'is_active': store.is_active,
                'is_suspended': store.is_suspended,
                'created_at': store.created_at,
                'active_limits': active_limits,
                'latest_subscriptions': serialized_subs
            })

        return Response(data)


class AdminStatsView(APIView):
    """Get general dashboard stats for platform owner."""
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        total_revenue = PaymentReceipt.objects.filter(status='approved').aggregate(
            total=models.Sum('amount_da')
        )['total'] or 0
        
        total_stores = Store.objects.count()
        
        now = timezone.now()
        active_subs_count = StoreSubscription.objects.filter(
            status__in=['trial', 'active'],
            end_date__gt=now
        ).count()
        
        pending_receipts_count = PaymentReceipt.objects.filter(status='pending').count()
        
        return Response({
            'total_revenue': float(total_revenue),
            'total_stores': total_stores,
            'active_subscriptions': active_subs_count,
            'pending_receipts': pending_receipts_count
        })


class USDTExchangeRateView(APIView):
    """Retrieve the platform's USDT exchange rate."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.superadmin.models import SystemSetting
        setting, _ = SystemSetting.objects.get_or_create(
            key='usdt_exchange_rate',
            defaults={
                'value': '260',
                'description': 'USDT exchange rate for RedotPay payments (DZD to USDT)'
            }
        )
        try:
            rate = float(setting.value)
        except ValueError:
            rate = 260.0
        return Response({"usdt_rate": rate})

