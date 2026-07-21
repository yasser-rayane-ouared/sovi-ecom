"""Store serializers."""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Store, StoreSettings, StoreWorker

User = get_user_model()


class WorkerUserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='username')

    class Meta:
        model = User
        fields = ['id', 'name', 'first_name', 'last_name', 'phone']


class StoreWorkerSerializer(serializers.ModelSerializer):
    user = WorkerUserSerializer(read_only=True)
    name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, required=False)
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = StoreWorker
        fields = [
            'id', 'user', 'name', 'password', 'first_name', 'last_name', 'phone',
            'can_manage_products', 'can_manage_orders', 'can_manage_delivery',
            'can_manage_pages', 'can_manage_themes', 'can_manage_pixels',
            'can_manage_integrations', 'can_manage_settings', 'can_manage_workers',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        if not self.instance:
            if User.objects.filter(username=value).exists():
                raise serializers.ValidationError('اسم المستخدم هذا مستخدم بالفعل. يرجى اختيار اسم آخر.')
        else:
            if self.instance.user.username != value:
                if User.objects.filter(username=value).exists():
                    raise serializers.ValidationError('اسم المستخدم هذا مستخدم بالفعل. يرجى اختيار اسم آخر.')
        return value

    def create(self, validated_data):
        name = validated_data.pop('name')
        password = validated_data.get('password')
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        phone = validated_data.get('phone', '')
        
        store = self.context['store']
        
        if not password:
            raise serializers.ValidationError({'password': 'كلمة المرور مطلوبة لإنشاء موظف جديد.'})
            
        user = User.objects.create_user(
            username=name,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=phone
        )
        
        # Clean validated_data from user fields
        validated_data.pop('password', None)
        validated_data.pop('first_name', None)
        validated_data.pop('last_name', None)
        validated_data.pop('phone', None)
        
        worker = StoreWorker.objects.create(store=store, user=user, **validated_data)
        return worker

    def update(self, instance, validated_data):
        request = self.context.get('request')
        store = instance.store
        
        name = validated_data.pop('name', None)
        password = validated_data.pop('password', None)
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        phone = validated_data.pop('phone', None)

        if request and request.user == store.owner:
            if name:
                instance.user.username = name
            if password:
                instance.user.set_password(password)
            if first_name is not None:
                instance.user.first_name = first_name
            if last_name is not None:
                instance.user.last_name = last_name
            if phone is not None:
                instance.user.phone = phone
            instance.user.save()

        # Update permissions
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class StoreSettingsSerializer(serializers.ModelSerializer):
    has_captcha_secret_key = serializers.SerializerMethodField()

    class Meta:
        model = StoreSettings
        exclude = ['id', 'store', 'created_at', 'updated_at']
        extra_kwargs = {
            'security_captcha_secret_key': {'write_only': True}
        }

    def get_has_captcha_secret_key(self, obj):
        return bool(obj.security_captcha_secret_key)


class StoreSerializer(serializers.ModelSerializer):
    settings = StoreSettingsSerializer(read_only=True)
    owner_name = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    user_permissions = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = ['id', 'name', 'category', 'slug', 'subdomain', 'custom_domain', 'description', 'logo', 'favicon',
                  'language', 'currency', 'is_active', 'active_theme', 'owner_name',
                  'settings', 'user_role', 'user_permissions', 'created_at', 'updated_at']
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_owner_name(self, obj):
        try:
            if obj.owner:
                return getattr(obj.owner, 'full_name', None) or getattr(obj.owner, 'username', '') or ''
        except Exception:
            pass
        return ''

    def get_user_role(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return None
        if obj.owner == request.user:
            return 'owner'
        return 'worker'

    def get_user_permissions(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return None
        if obj.owner_id == request.user.pk:
            return {
                'can_manage_products': True,
                'can_manage_orders': True,
                'can_manage_delivery': True,
                'can_manage_pages': True,
                'can_manage_themes': True,
                'can_manage_pixels': True,
                'can_manage_integrations': True,
                'can_manage_settings': True,
                'can_manage_workers': True,
            }

        # Use prefetched workers cache — no extra DB query
        worker = next((w for w in obj.workers.all() if w.user_id == request.user.pk), None)
        if not worker:
            return None
        return {
            'can_manage_products': worker.can_manage_products,
            'can_manage_orders': worker.can_manage_orders,
            'can_manage_delivery': worker.can_manage_delivery,
            'can_manage_pages': worker.can_manage_pages,
            'can_manage_themes': worker.can_manage_themes,
            'can_manage_pixels': worker.can_manage_pixels,
            'can_manage_integrations': worker.can_manage_integrations,
            'can_manage_settings': worker.can_manage_settings,
            'can_manage_workers': worker.can_manage_workers,
        }


class StoreCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['name', 'category']

    def create(self, validated_data):
        import re
        from django.utils.text import slugify
        from apps.delivery.models import Wilaya, DeliveryPricing

        # Transliteration dictionary for Arabic to Latin characters
        ARABIC_CHAR_MAP = {
            'أ': 'a', 'إ': 'i', 'آ': 'a', 'ا': 'a',
            'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
            'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
            'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
            'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
            'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
            'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
            'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
            'ة': 't', 'ئ': 'y', 'ؤ': 'w', 'ء': 'a',
        }

        def transliterate_arabic(text):
            result = []
            for char in text:
                result.append(ARABIC_CHAR_MAP.get(char, char))
            return "".join(result)

        # Generate subdomain from store name
        name = validated_data['name']
        name_trans = transliterate_arabic(name.lower())
        slug = slugify(name_trans)
        if not slug or not re.match(r'^[a-z0-9-]+$', slug):
            slug = 'store'

        # Avoid reserved names
        reserved = ['www', 'api', 'admin', 'app', 'dashboard', 'mail', 'ftp', 'localhost']
        base_subdomain = slug[:50]
        subdomain = base_subdomain
        if subdomain in reserved:
            subdomain = f"{subdomain}-shop"
            base_subdomain = subdomain

        # Ensure unique subdomain
        counter = 1
        while Store.objects.filter(subdomain=subdomain).exists():
            suffix = f"-{counter}"
            if len(base_subdomain) + len(suffix) > 63:
                subdomain = f"{base_subdomain[:63-len(suffix)]}{suffix}"
            else:
                subdomain = f"{base_subdomain}{suffix}"
            counter += 1

        validated_data['subdomain'] = subdomain
        validated_data['slug'] = subdomain
        validated_data['owner'] = self.context['request'].user
        
        # Add default language and description
        validated_data['language'] = 'ar'
        validated_data['description'] = f"متجر {name} لبيع أجود المنتجات بالدفع عند الاستلام."

        store = Store.objects.create(**validated_data)
        
        # Create default store settings
        StoreSettings.objects.create(store=store)

        # Seed all 58 wilayas with default pricing
        from apps.delivery.wilaya_data import seed_delivery_wilayas
        if not Wilaya.objects.exists():
            seed_delivery_wilayas()
        wilayas = Wilaya.objects.all()
        pricing_objects = [
            DeliveryPricing(
                store=store,
                wilaya=wilaya,
                home_price=600,
                desk_price=400
            )
            for wilaya in wilayas
        ]
        DeliveryPricing.objects.bulk_create(pricing_objects)

        # Create default 7 days Starter trial subscription
        from django.utils import timezone
        from datetime import timedelta
        from apps.subscriptions.models import Plan, StoreSubscription, seed_default_plans_if_empty
        
        # Ensure default plans exist
        seed_default_plans_if_empty()
        
        try:
            starter_plan = Plan.objects.get(name='starter')
            StoreSubscription.objects.create(
                store=store,
                plan=starter_plan,
                is_trial=True,
                status='trial',
                start_date=timezone.now(),
                end_date=timezone.now() + timedelta(days=7)
            )
        except Plan.DoesNotExist:
            pass

        return store
