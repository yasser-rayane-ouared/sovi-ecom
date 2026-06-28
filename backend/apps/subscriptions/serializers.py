from rest_framework import serializers
from .models import Plan, PaymentReceipt, StoreSubscription

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'


class PaymentReceiptSerializer(serializers.ModelSerializer):
    plan_name = serializers.ReadOnlyField(source='plan.name')
    plan_display_name_ar = serializers.ReadOnlyField(source='plan.display_name_ar')
    store_name = serializers.ReadOnlyField(source='store.name')
    
    class Meta:
        model = PaymentReceipt
        fields = [
            'id', 'store', 'store_name', 'plan', 'plan_name', 'plan_display_name_ar',
            'payment_method', 'receipt_image', 'amount_da', 'amount_usdt', 'note', 'status',
            'admin_note', 'submitted_at', 'reviewed_at'
        ]
        read_only_fields = ['id', 'store', 'status', 'admin_note', 'submitted_at', 'reviewed_at']


class PaymentReceiptCreateSerializer(serializers.ModelSerializer):
    amount_da = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    class Meta:
        model = PaymentReceipt
        fields = ['plan', 'payment_method', 'receipt_image', 'amount_da', 'amount_usdt', 'note']

    def validate(self, attrs):
        payment_method = attrs.get('payment_method')
        amount_da = attrs.get('amount_da')
        amount_usdt = attrs.get('amount_usdt')

        if payment_method == 'redotpay':
            if not amount_usdt and not amount_da:
                raise serializers.ValidationError("Either amount_da or amount_usdt must be provided.")
        else:
            if not amount_da:
                raise serializers.ValidationError({"amount_da": "This field is required."})

        if amount_da is not None and amount_da <= 0:
            raise serializers.ValidationError({"amount_da": "Amount must be greater than 0."})
        if amount_usdt is not None and amount_usdt <= 0:
            raise serializers.ValidationError({"amount_usdt": "Amount must be greater than 0."})

        return attrs



class StoreSubscriptionSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)
    
    class Meta:
        model = StoreSubscription
        fields = [
            'id', 'store', 'plan', 'is_trial', 'status', 'start_date', 'end_date', 'created_at'
        ]
        read_only_fields = ['id', 'store', 'plan', 'is_trial', 'status', 'start_date', 'end_date', 'created_at']
