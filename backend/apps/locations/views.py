"""
API views for Algeria locations.
Public endpoints (AllowAny) - these are needed by storefront checkout.
"""
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from .models import Wilaya, Commune
from .serializers import WilayaSerializer, CommuneSerializer


class WilayaListView(generics.ListAPIView):
    """
    GET /api/wilayas/
    Returns all 58 Algerian wilayas ordered by code.
    Cached for 24 hours since this data rarely changes.
    """
    queryset = Wilaya.objects.all().order_by('code')
    serializer_class = WilayaSerializer
    permission_classes = [AllowAny]
    pagination_class = None  # Return all wilayas without pagination

    @method_decorator(cache_page(60 * 60 * 24))  # Cache 24 hours
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class CommuneListView(generics.ListAPIView):
    """
    GET /api/communes/?wilaya=<id>
    Returns communes filtered by wilaya ID.
    Cached for 24 hours.
    """
    serializer_class = CommuneSerializer
    permission_classes = [AllowAny]
    pagination_class = None  # Return all communes for the wilaya

    def get_queryset(self):
        queryset = Commune.objects.select_related('wilaya').order_by('name')
        wilaya_id = self.request.query_params.get('wilaya')
        if wilaya_id:
            queryset = queryset.filter(wilaya_id=wilaya_id)
        return queryset

    @method_decorator(cache_page(60 * 60 * 24))  # Cache 24 hours
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
