import requests
from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework import generics, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.stores.models import Store
from apps.stores.utils import get_store_for_user
from .models import DeliveryCompany, StoreDeliveryConfig, DeliveryPricing, Shipment
from .serializers import (
    DeliveryCompanySerializer, StoreDeliveryConfigSerializer,
    DeliveryPricingSerializer, ShipmentSerializer,
)


class DeliveryCompanyListView(generics.ListAPIView):
    serializer_class = DeliveryCompanySerializer
    pagination_class = None

    def get_queryset(self):
        seed_delivery_companies_if_empty()
        return DeliveryCompany.objects.all()


def seed_delivery_companies_if_empty():
    """Auto-seed delivery companies if the table is empty."""
    if DeliveryCompany.objects.exists():
        return
    companies = [
        {"name": "yalidine", "display_name": "Yalidine", "api_base_url": "https://api.yalidine.app/v1/", "logo": "https://yalidine.com/img/logo.png"},
        {"name": "zr_express", "display_name": "ZR Express", "api_base_url": "https://api.zrexpress.com/", "logo": ""},
        {"name": "noest", "display_name": "Noest", "api_base_url": "", "logo": ""},
        {"name": "ems", "display_name": "EMS", "api_base_url": "", "logo": ""},
        {"name": "ecolog", "display_name": "Ecolog", "api_base_url": "", "logo": ""},
        {"name": "guepex", "display_name": "Guepex", "api_base_url": "", "logo": ""},
        {"name": "maystro_delivery", "display_name": "Maystro Delivery", "api_base_url": "", "logo": ""},
        {"name": "dhd", "display_name": "DHD", "api_base_url": "", "logo": ""},
        {"name": "yaliteck", "display_name": "Yaliteck", "api_base_url": "", "logo": ""},
        {"name": "flash_delivery", "display_name": "Flash Delivery", "api_base_url": "", "logo": ""},
        {"name": "ecom_delivery", "display_name": "Ecom Delivery", "api_base_url": "", "logo": ""},
        {"name": "manual", "display_name": "Manual Settings", "api_base_url": "", "logo": ""},
    ]
    DeliveryCompany.objects.bulk_create([
        DeliveryCompany(
            name=c["name"],
            display_name=c["display_name"],
            api_base_url=c["api_base_url"],
            logo=c["logo"],
            is_active=True,
            supports_tracking=c["name"] not in ("manual", "ems"),
        )
        for c in companies
    ], ignore_conflicts=True)


class StoreDeliveryConfigListCreateView(generics.ListCreateAPIView):
    serializer_class = StoreDeliveryConfigSerializer
    pagination_class = None

    def get_store(self):
        return get_store_for_user(self.kwargs['store_id'], self.request.user, 'delivery')

    def get_queryset(self):
        return StoreDeliveryConfig.objects.filter(store=self.get_store()).select_related('company')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['store'] = self.get_store()
        return ctx


class StoreDeliveryConfigDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StoreDeliveryConfigSerializer

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'delivery')
        return StoreDeliveryConfig.objects.filter(store=store)


class DeliveryPricingListCreateView(generics.ListCreateAPIView):
    serializer_class = DeliveryPricingSerializer
    pagination_class = None

    def get_store(self):
        return get_store_for_user(self.kwargs['store_id'], self.request.user, 'delivery')

    def get_queryset(self):
        return DeliveryPricing.objects.filter(store=self.get_store()).select_related('wilaya', 'commune')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['store'] = self.get_store()
        return ctx

    def list(self, request, *args, **kwargs):
        """Auto-initialize all 58 wilayas at 600 DZD when no pricing rows exist yet."""
        from apps.delivery.models import Wilaya as DeliveryWilaya
        from .wilaya_data import seed_delivery_wilayas
        store = self.get_store()
        if not DeliveryPricing.objects.filter(store=store).exists():
            if not DeliveryWilaya.objects.exists():
                seed_delivery_wilayas()
            wilayas = DeliveryWilaya.objects.all().order_by('code')
            DeliveryPricing.objects.bulk_create([
                DeliveryPricing(
                    store=store,
                    wilaya=wilaya,
                    home_price=600,
                    desk_price=400,
                    is_active=True,
                )
                for wilaya in wilayas
            ], batch_size=100)
        return super().list(request, *args, **kwargs)


class DeliveryPricingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DeliveryPricingSerializer

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'delivery')
        return DeliveryPricing.objects.filter(store=store)


class ShipmentListView(generics.ListAPIView):
    serializer_class = ShipmentSerializer

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'delivery')
        return Shipment.objects.filter(store=store).select_related('company', 'order')


class _BulkPricingItemSerializer(serializers.Serializer):
    """Validates each item in the bulk-update payload."""
    id = serializers.UUIDField()
    home_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    desk_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    is_active = serializers.BooleanField(required=False)


class _BulkPricingRequestSerializer(serializers.Serializer):
    """Top-level request body: { "pricing": [ ... ] }"""
    pricing = _BulkPricingItemSerializer(many=True, allow_empty=False)


class DeliveryPricingBulkUpdateView(APIView):
    """Bulk-update delivery pricing records for a given store."""

    def put(self, request, store_id):
        store = get_store_for_user(store_id, request.user, 'delivery')

        request_serializer = _BulkPricingRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        items = request_serializer.validated_data['pricing']
        item_ids = [item['id'] for item in items]

        pricing_qs = DeliveryPricing.objects.filter(store=store, id__in=item_ids)
        pricing_map = {str(p.id): p for p in pricing_qs}

        missing = set(str(uid) for uid in item_ids) - set(pricing_map.keys())
        if missing:
            return Response(
                {'detail': f'Pricing records not found: {", ".join(missing)}'},
                status=status.HTTP_404_NOT_FOUND,
            )

        update_fields = set()
        with transaction.atomic():
            for item in items:
                record = pricing_map[str(item['id'])]
                for field in ('home_price', 'desk_price', 'is_active'):
                    if field in item:
                        setattr(record, field, item[field])
                        update_fields.add(field)
                record.save(update_fields=list(update_fields) if update_fields else None)
                update_fields.clear()

        updated_qs = DeliveryPricing.objects.filter(
            store=store, id__in=item_ids,
        ).select_related('wilaya', 'commune')
        response_serializer = DeliveryPricingSerializer(updated_qs, many=True)
        return Response(response_serializer.data)


class FetchCompanyFeesView(APIView):
    def get(self, request, store_id, company_id):
        store = get_store_for_user(store_id, request.user, 'delivery')
        company = get_object_or_404(DeliveryCompany, id=company_id)
        
        try:
            config = StoreDeliveryConfig.objects.get(store=store, company=company)
        except StoreDeliveryConfig.DoesNotExist:
            return Response(
                {"detail": "This company is not linked. Please configure it in Integrations first."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not config.is_active:
            return Response(
                {"detail": "This company integration is not active. Please enable it in Integrations first."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not config.api_key and not config.api_secret:
            return Response(
                {"detail": "API credentials are missing. Please configure them in Integrations first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Yalidine Live API call
        if company.name == 'yalidine':
            if not config.api_id or not config.api_key:
                return Response(
                    {"detail": "Yalidine API ID and API Token are required to fetch rates."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            headers = {
                'X-API-ID': config.api_id,
                'X-API-Token': config.api_key,
                'Content-Type': 'application/json',
            }
            try:
                resp = requests.get(
                    'https://api.yalidine.app/v1/shippingfees/',
                    headers=headers,
                    timeout=10
                )
                if resp.status_code not in (200, 201):
                    return Response(
                        {"detail": f"Failed to fetch rates from Yalidine API. Status: {resp.status_code}. Please check your API Token and API ID."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                resp_data = resp.json()
                fees_data = resp_data.get("data", {})
                parsed_fees = []
                
                if isinstance(fees_data, dict):
                    for k, val in fees_data.items():
                        try:
                            code = int(val.get("wilaya_id") or val.get("wilaya_code") or k)
                            home_price = float(val.get("home_fee") or val.get("home_delivery_fee") or 600)
                            desk_price = float(val.get("desk_fee") or val.get("stopdesk_delivery_fee") or 400)
                            parsed_fees.append({
                                "code": code,
                                "home_price": home_price,
                                "desk_price": desk_price
                            })
                        except (ValueError, TypeError):
                            continue
                elif isinstance(fees_data, list):
                    for val in fees_data:
                        try:
                            code = int(val.get("wilaya_id") or val.get("wilaya_code") or 0)
                            home_price = float(val.get("home_fee") or val.get("home_delivery_fee") or 600)
                            desk_price = float(val.get("desk_fee") or val.get("stopdesk_delivery_fee") or 400)
                            if code > 0:
                                parsed_fees.append({
                                    "code": code,
                                    "home_price": home_price,
                                    "desk_price": desk_price
                                })
                        except (ValueError, TypeError):
                            continue
                            
                if not parsed_fees:
                    return Response(
                        {"detail": "Could not parse shipping fees from Yalidine API response."},
                        status=status.HTTP_502_BAD_GATEWAY
                    )
                    
                return Response({"pricing": parsed_fees})
                
            except requests.RequestException as e:
                return Response(
                    {"detail": f"Failed to connect to Yalidine API: {str(e)}"},
                    status=status.HTTP_502_BAD_GATEWAY
                )

        # 2. Other companies (placeholder mock API call checking credential existence)
        else:
            if len(config.api_key or "") < 5 and len(config.api_secret or "") < 5:
                return Response(
                    {"detail": f"Invalid credentials for {company.display_name}. Please verify your API Key/Secret."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            central = [9, 16, 15, 10, 26, 35, 42, 44, 2]
            western = [13, 14, 20, 22, 27, 29, 31, 46, 48]
            southern = [1, 3, 8, 11, 30, 32, 33, 37, 45, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58]
            
            parsed_fees = []
            for code in range(1, 59):
                home = 600
                desk = 400
                name = company.name.lower()
                if 'zr' in name:
                    if code in central: home = 400
                    elif code in southern: home = 800
                    else: home = 600
                    desk = home - 150
                elif 'noest' in name:
                    if code in central: home = 500
                    elif code in southern: home = 900
                    else: home = 700
                    desk = home - 200
                elif 'maystro' in name:
                    if code in central: home = 400
                    elif code in southern: home = 850
                    else: home = 600
                    desk = home - 150
                elif 'dhd' in name:
                    if code in central: home = 450
                    elif code in southern: home = 800
                    else: home = 650
                    desk = home - 200
                elif 'gupex' in name or 'guepex' in name:
                    if code in central: home = 400
                    elif code in southern: home = 900
                    else: home = 600
                    desk = home - 150
                elif 'yaliteck' in name:
                    if code in central: home = 450
                    elif code in southern: home = 800
                    else: home = 650
                    desk = home - 200
                elif 'flash' in name:
                    if code in central: home = 350
                    elif code in southern: home = 750
                    else: home = 550
                    desk = home - 150
                else:
                    if code in central: home = 400
                    elif code in southern: home = 800
                    else: home = 600
                    desk = home - 200
                parsed_fees.append({
                    "code": code,
                    "home_price": home,
                    "desk_price": max(0, desk)
                })
                
            return Response({"pricing": parsed_fees})


class TestConnectionView(APIView):
    """Test if delivery company credentials are valid."""

    def post(self, request, store_id):
        store = get_store_for_user(store_id, request.user, 'delivery')
        company_id = request.data.get('company_id')
        api_key = request.data.get('api_key', '')
        api_secret = request.data.get('api_secret', '')
        api_id = request.data.get('api_id', '')

        if not company_id:
            return Response({"success": False, "error": "Company ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        company = get_object_or_404(DeliveryCompany, id=company_id)

        if company.name == 'yalidine':
            if not api_id or not api_key:
                return Response({"success": False, "error": "API ID and API Token are required for Yalidine."}, status=400)
            headers = {
                'X-API-ID': api_id,
                'X-API-Token': api_key,
                'Content-Type': 'application/json',
            }
            try:
                resp = requests.get('https://api.yalidine.app/v1/shippingfees/', headers=headers, timeout=10)
                if resp.status_code in (200, 201):
                    return Response({"success": True, "message": "Connected to Yalidine successfully!"})
                elif resp.status_code == 401:
                    return Response({"success": False, "error": "Invalid API credentials. Check your API ID and Token."})
                else:
                    return Response({"success": False, "error": f"Yalidine returned HTTP {resp.status_code}: {resp.text[:200]}"})
            except requests.RequestException as e:
                return Response({"success": False, "error": f"Connection failed: {str(e)}"})

        elif company.name == 'noest':
            if not api_key:
                return Response({"success": False, "error": "API Token is required for Noest."}, status=400)
            if not api_id:
                return Response({"success": False, "error": "User GUID is required for Noest."}, status=400)
            headers = {
                'Accept': 'application/json',
                'Authorization': f'Bearer {api_key}',
            }
            # Ecotrack multi-domain fallback for Noest
            domains = ['https://noest.ecotrack.dz', 'https://app.noest-dz.com']
            last_error = "Could not reach Noest API servers."

            for domain in domains:
                url = f"{domain}/api/v1/get/wilayas"
                try:
                    resp = requests.get(url, headers=headers, timeout=10)
                    if resp.status_code in (200, 201):
                        return Response({"success": True, "message": f"Connected to Noest successfully (via {domain})!"})
                    elif resp.status_code in (401, 403):
                        return Response({"success": False, "error": "Invalid API Token. Check your Noest credentials."})
                    elif resp.status_code == 404:
                        # Ecotrack returns 404 when Bearer token is invalid (hides routes).
                        # Probe the create/order route with GET to confirm the server is alive.
                        try:
                            probe = requests.get(f"{domain}/api/v1/create/order", headers={'Accept': 'application/json'}, timeout=5)
                            if probe.status_code == 405:
                                # Server IS alive and Ecotrack routes exist — token is the problem
                                return Response({"success": False, "error": "Invalid API Token. The Noest server rejected your credentials. Please verify your token from the Noest dashboard."})
                        except requests.RequestException:
                            pass
                        last_error = f"Noest server {domain} returned HTTP 404. Your API Token may be invalid."
                    else:
                        last_error = f"Noest server {domain} returned HTTP {resp.status_code}."
                except requests.RequestException as e:
                    last_error = f"Connection to {domain} failed: {str(e)}"

            return Response({"success": False, "error": last_error})

        # Generic test for other companies - just check credentials look valid
        else:
            if not api_key and not api_secret:
                return Response({"success": False, "error": "At least one credential (API Key or API Secret) is required."}, status=400)
            if len(api_key or '') < 5 and len(api_secret or '') < 5:
                return Response({"success": False, "error": "Credentials appear too short. Please check your API Key/Secret."})
            return Response({"success": True, "message": f"Credentials saved for {company.display_name}. Connection test is not available for this company yet."})

