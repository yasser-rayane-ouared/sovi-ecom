"""Theme views."""
from rest_framework import generics, permissions
from .models import Theme
from .serializers import ThemeSerializer


class ThemeListView(generics.ListAPIView):
    serializer_class = ThemeSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Theme.objects.filter(is_active=True)
    filterset_fields = ['is_free', 'category', 'supports_rtl']
    search_fields = ['name', 'description']
    pagination_class = None


class ThemeDetailView(generics.RetrieveAPIView):
    serializer_class = ThemeSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Theme.objects.filter(is_active=True)
    lookup_field = 'slug'
