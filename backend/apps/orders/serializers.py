"""Order serializers."""
from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory
from apps.delivery.models import Wilaya, Commune, DeliveryPricing


class OrderItemSerializer(serializers.ModelSerializer):
    cost_price = serializers.DecimalField(source='product.cost_price', max_digits=10, decimal_places=2, read_only=True, required=False, allow_null=True)
    ad_cost_per_order = serializers.DecimalField(source='product.ad_cost_per_order', max_digits=10, decimal_places=2, read_only=True, required=False, allow_null=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'variant', 'product_title', 'variant_name', 'quantity', 'price', 'total', 'cost_price', 'ad_cost_per_order']
        read_only_fields = ['id', 'total']


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = ['from_status', 'to_status', 'note', 'changed_at']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    wilaya_name = serializers.CharField(source='wilaya.name_ar', read_only=True)
    commune_name = serializers.SerializerMethodField(read_only=True)
    is_duplicate = serializers.SerializerMethodField(read_only=True)
    duplicate_count = serializers.SerializerMethodField(read_only=True)
    risk_score = serializers.SerializerMethodField(read_only=True)
    delivery_company_name = serializers.SerializerMethodField(read_only=True)

    def get_commune_name(self, obj):
        return obj.commune.name_ar if obj.commune else ''

    def get_is_duplicate(self, obj):
        return Order.objects.filter(store=obj.store, phone=obj.phone).exclude(id=obj.id).exists()

    def get_duplicate_count(self, obj):
        return Order.objects.filter(store=obj.store, phone=obj.phone).exclude(id=obj.id).count()

    def get_risk_score(self, obj):
        other_orders = Order.objects.filter(store=obj.store, phone=obj.phone).exclude(id=obj.id)
        if not other_orders.exists():
            return 0
        total_others = other_orders.count()
        returned_or_cancelled = other_orders.filter(status__in=['returned', 'cancelled']).count()
        if total_others > 0:
            return int((returned_or_cancelled / total_others) * 100)
        return 0

    def get_delivery_company_name(self, obj):
        """Return the display name of the delivery company if the order has been exported."""
        shipment = obj.shipments.select_related('company').order_by('-id').first()
        if shipment:
            return shipment.company.display_name
        return None

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'full_name', 'phone', 'phone2',
            'wilaya', 'wilaya_name', 'commune', 'commune_name',
            'address', 'notes', 'subtotal', 'delivery_price', 'total',
            'status', 'source', 'utm_source', 'utm_medium', 'utm_campaign',
            'is_abandoned', 'items', 'status_history', 'created_at', 'updated_at',
            'is_duplicate', 'duplicate_count', 'risk_score',
            'coupon_code', 'coupon_discount', 'delivery_company_name',
        ]
        read_only_fields = ['id', 'order_number', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.Serializer):
    """Public checkout serializer for COD orders."""
    full_name = serializers.CharField(max_length=200)
    phone = serializers.CharField(max_length=20)
    phone2 = serializers.CharField(max_length=20, required=False, allow_blank=True)
    wilaya = serializers.IntegerField()
    commune = serializers.IntegerField(required=False, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, default='')
    notes = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(child=serializers.DictField())
    source = serializers.CharField(required=False, allow_blank=True)
    utm_source = serializers.CharField(required=False, allow_blank=True)
    utm_medium = serializers.CharField(required=False, allow_blank=True)
    utm_campaign = serializers.CharField(required=False, allow_blank=True)
    recaptcha_token = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    firebase_token = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True, default='', max_length=50)
    commitment_checked = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        store = self.context['store']
        
        # Get items product ids to check if security sections are enabled on any product
        items = attrs.get('items', [])
        product_ids = [item.get('product_id') for item in items if item.get('product_id')]
        
        from apps.products.models import ProductSection
        # Query active security sections for the ordered products
        active_security_sections = set(ProductSection.objects.filter(
            product_id__in=product_ids, 
            section_type__startswith='security_'
        ).values_list('section_type', flat=True))
        
        # 1. Phone number format validation (applied by default)
        import re
        phone = attrs.get('phone', '')
        clean_phone = re.sub(r'\s+', '', phone)
        # Match Algerian phone formats: 05, 06, 07 followed by 8 digits,
        # or international format starting with +213 or 00213 or 213 followed by 5/6/7 and 8 digits.
        pattern = r'^(0|\+213|00213|213)?(5|6|7)[0-9]{8}$'
        if not re.match(pattern, clean_phone):
            raise serializers.ValidationError({'phone': 'الرجاء إدخال رقم هاتف جزائري صالح (مثال: 0661234567)'})
        
        phone2 = attrs.get('phone2', '')
        if phone2:
            clean_phone2 = re.sub(r'\s+', '', phone2)
            if not re.match(pattern, clean_phone2):
                raise serializers.ValidationError({'phone2': 'الرجاء إدخال رقم هاتف ثاني صالح'})


        # 2. Google reCAPTCHA v3 verification
        if 'security_captcha' in active_security_sections and getattr(store, 'settings', None):
            token = attrs.get('recaptcha_token')
            secret_key = store.settings.security_captcha_secret_key
            
            if not token:
                raise serializers.ValidationError({'non_field_errors': 'رمز الكابتشا مطلوب لإتمام الطلب.'})
            
            if secret_key:
                import requests
                try:
                    resp = requests.post(
                        'https://www.google.com/recaptcha/api/siteverify',
                        data={'secret': secret_key, 'response': token},
                        timeout=5
                    )
                    res_data = resp.json()
                    if not res_data.get('success'):
                        raise serializers.ValidationError({'non_field_errors': 'فشل التحقق من الكابتشا. يرجى المحاولة لاحقاً.'})
                    
                    # Verify score for v3 (default threshold 0.5)
                    score = res_data.get('score', 1.0)
                    if score < 0.5:
                        raise serializers.ValidationError({'non_field_errors': 'تم الكشف عن نشاط مشبوه. يرجى إعادة المحاولة.'})
                except requests.RequestException:
                    pass

        # 3. Firebase Phone OTP verification
        if 'security_otp' in active_security_sections and getattr(store, 'settings', None):
            token = attrs.get('firebase_token')
            if not token:
                raise serializers.ValidationError({'non_field_errors': 'رمز تأكيد الهاتف (OTP) مطلوب لإتمام الطلب.'})
            
            import json
            import requests
            
            # Extract Firebase API Key from the config
            config_json = store.settings.security_firebase_config_json
            api_key = None
            if config_json:
                try:
                    config_data = json.loads(config_json)
                    api_key = config_data.get('apiKey')
                except Exception:
                    import re
                    match = re.search(r'apiKey\s*:\s*["\']([^"\']+)["\']', config_json)
                    if not match:
                        match = re.search(r'"apiKey"\s*:\s*["\']([^"\']+)["\']', config_json)
                    if match:
                        api_key = match.group(1)
            
            if not api_key:
                raise serializers.ValidationError({'non_field_errors': 'فشل التحقق بسبب عدم تهيئة إعدادات Firebase بشكل صحيح.'})
            
            # Verify Firebase ID Token via Google Identity Toolkit REST API
            try:
                verify_url = f'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={api_key}'
                verify_resp = requests.post(
                    verify_url,
                    json={'idToken': token},
                    headers={'Content-Type': 'application/json'},
                    timeout=8
                )
                if verify_resp.status_code != 200:
                    raise serializers.ValidationError({'non_field_errors': 'فشل التحقق من رمز الهاتف. الرمز قد يكون منتهياً أو غير صالح.'})
                
                user_info = verify_resp.json()
                users = user_info.get('users', [])
                if not users:
                    raise serializers.ValidationError({'non_field_errors': 'فشل العثور على حساب مستخدم مطابق للرمز.'})
                
                # Extract phone number from Firebase verification payload
                firebase_phone = users[0].get('phoneNumber', '')
                if not firebase_phone:
                    raise serializers.ValidationError({'non_field_errors': 'لم يتم العثور على رقم هاتف موثق في الرمز.'})
                
                # Normalize both phone numbers to compare (remove spaces, symbols, leading zeros, and +213/00213 prefix)
                import re
                def normalize(ph):
                    ph = re.sub(r'\D', '', ph) # Keep digits only
                    if ph.startswith('213'):
                        ph = ph[3:]
                    elif ph.startswith('00213'):
                        ph = ph[5:]
                    elif ph.startswith('0'):
                        ph = ph[1:]
                    return ph
                
                normalized_payload = normalize(attrs.get('phone', ''))
                normalized_firebase = normalize(firebase_phone)
                
                if normalized_payload != normalized_firebase:
                    raise serializers.ValidationError({'phone': f'رقم الهاتف المدخل ({attrs.get("phone")}) لا يطابق الرقم الموثق في رمز التحقق.'})
                    
            except requests.RequestException:
                pass

        # 4. Limit orders per day per IP
        request = self.context.get('request')
        ip = None
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR')

        if 'security_rate_limit' in active_security_sections and getattr(store, 'settings', None):
            max_orders = store.settings.security_max_orders_per_day
            if max_orders <= 0:
                max_orders = 5
            if ip and ip not in ['127.0.0.1', '::1', 'localhost'] and not ip.startswith('192.168.') and not ip.startswith('10.'):
                from django.utils import timezone
                from datetime import timedelta
                from apps.orders.models import Order
                
                time_threshold = timezone.now() - timedelta(days=1)
                order_count = Order.objects.filter(
                    store=store,
                    ip_address=ip,
                    created_at__gte=time_threshold
                ).count()
                
                if order_count >= max_orders:
                    raise serializers.ValidationError({'non_field_errors': 'لقد تجاوزت الحد الأقصى للطلبات المسموح بها يومياً من نفس الجهاز.'})

        # 6. Coupon code validation (optional)
        coupon_code = attrs.get('coupon_code', '')
        if coupon_code:
            from apps.products.models import ProductSection
            matched = False
            for pid in product_ids:
                coupon_section = ProductSection.objects.filter(
                    product_id=pid,
                    section_type='coupon'
                ).first()
                if coupon_section:
                    import json as _json
                    raw_config = coupon_section.config
                    try:
                        config = _json.loads(raw_config) if isinstance(raw_config, str) else raw_config
                    except (ValueError, TypeError):
                        config = {}
                    if config.get('code') and config['code'].strip().lower() == coupon_code.strip().lower():
                        matched = True
                        discount_pct = float(config.get('discount_percent', 0))
                        attrs['_coupon_discount_pct'] = discount_pct
                        attrs['_coupon_product_id'] = pid
                        break
            if not matched:
                raise serializers.ValidationError({'coupon_code': 'رمز الخصم غير صالح'})

        # 5. Block non-Algerian IPs (Except local testing)
        if 'security_algerian_ip' in active_security_sections and getattr(store, 'settings', None):
            if ip and ip not in ['127.0.0.1', '::1', 'localhost'] and not ip.startswith('192.168.') and not ip.startswith('10.'):
                import requests
                country = request.META.get('HTTP_CF_IPCOUNTRY') if request else None
                if not country:
                    try:
                        resp = requests.get(f'http://ip-api.com/json/{ip}', timeout=2)
                        if resp.status_code == 200:
                            country = resp.json().get('countryCode')
                    except Exception:
                        pass
                
                if country and country not in ['DZ', 'XX']:
                    raise serializers.ValidationError({'non_field_errors': 'عذراً، لا يمكنك إتمام الطلب من خارج الجزائر.'})

        # 6. Customer Commitment check
        if 'security_commitment' in active_security_sections:
            if not attrs.get('commitment_checked', False):
                raise serializers.ValidationError({'commitment_checked': 'الرجاء تحديد مربع الالتزام للمتابعة وإتمام الطلب.'})

        return attrs

    def validate_wilaya(self, value):
        try:
            return Wilaya.objects.get(code=value)
        except Wilaya.DoesNotExist:
            raise serializers.ValidationError('Invalid wilaya.')

    def validate_commune(self, value):
        if value is None:
            return None
        try:
            return Commune.objects.get(id=value)
        except Commune.DoesNotExist:
            raise serializers.ValidationError('Invalid commune.')

    def create(self, validated_data):
        from apps.products.models import Product, ProductVariant

        store = self.context['store']
        items_data = validated_data.pop('items')
        wilaya = validated_data.pop('wilaya')
        commune = validated_data.pop('commune')

        # Calculate delivery price
        delivery_price = 0
        try:
            pricing = DeliveryPricing.objects.get(store=store, wilaya=wilaya)
            delivery_price = pricing.home_price
        except DeliveryPricing.DoesNotExist:
            if hasattr(store, 'settings'):
                delivery_price = store.settings.default_delivery_price

        # Calculate subtotal
        subtotal = 0
        order_items = []
        for item in items_data:
            product = Product.objects.get(id=item['product_id'], store=store)
            variant = None
            if item.get('variant_id'):
                variant = ProductVariant.objects.get(id=item['variant_id'])
            price = variant.price if variant and variant.price else product.price
            qty = item.get('quantity', 1)
            subtotal += price * qty
            order_items.append({
                'product': product,
                'variant': variant,
                'product_title': product.title,
                'variant_name': variant.name if variant else '',
                'quantity': qty,
                'price': price,
            })

        # Coupon discount
        coupon_code = validated_data.get('coupon_code', '')
        coupon_discount_pct = validated_data.pop('_coupon_discount_pct', 0)
        coupon_discount = 0
        if coupon_code and coupon_discount_pct > 0:
            coupon_discount = subtotal * (coupon_discount_pct / 100)

        # Free delivery check
        if hasattr(store, 'settings') and store.settings.free_delivery_threshold:
            if subtotal >= store.settings.free_delivery_threshold:
                delivery_price = 0

        total = subtotal - coupon_discount + delivery_price

        order = Order.objects.create(
            store=store,
            full_name=validated_data.get('full_name'),
            phone=validated_data.get('phone'),
            phone2=validated_data.get('phone2', ''),
            wilaya=wilaya,
            commune=commune,
            address=validated_data.get('address'),
            notes=validated_data.get('notes', ''),
            subtotal=subtotal,
            delivery_price=delivery_price,
            total=total,
            source=validated_data.get('source', ''),
            utm_source=validated_data.get('utm_source', ''),
            utm_medium=validated_data.get('utm_medium', ''),
            utm_campaign=validated_data.get('utm_campaign', ''),
            coupon_code=coupon_code,
            coupon_discount=coupon_discount,
        )

        for item in order_items:
            OrderItem.objects.create(order=order, **item)

        order.deduct_inventory()

        # Fire integrations in background threads (no Celery needed in dev)
        try:
            import threading
            from django.db import transaction
            from apps.integrations.tasks import _send_telegram_for_order, sync_order_to_google_sheet

            order_id = order.id  # capture before closure

            def _run_integrations():
                try:
                    _send_telegram_for_order(order_id, is_new=True)
                except Exception as te:
                    import logging
                    logging.getLogger(__name__).error(f"Telegram notification failed: {te}", exc_info=True)
                try:
                    sync_order_to_google_sheet(order_id)
                except Exception as ge:
                    import logging
                    logging.getLogger(__name__).error(f"Google Sheets sync failed: {ge}", exc_info=True)

            def _after_commit():
                t = threading.Thread(target=_run_integrations, daemon=True)
                t.start()

            transaction.on_commit(_after_commit)
        except Exception:
            pass

        return order


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
    note = serializers.CharField(required=False, allow_blank=True)
