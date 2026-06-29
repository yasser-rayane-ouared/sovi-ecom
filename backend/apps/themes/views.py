"""Theme views."""
from rest_framework import generics, permissions
from .models import Theme
from .serializers import ThemeSerializer


class ThemeListView(generics.ListAPIView):
    serializer_class = ThemeSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['is_free', 'category', 'supports_rtl']
    search_fields = ['name', 'description']
    pagination_class = None

    def get_queryset(self):
        if not Theme.objects.exists():
            from django.core.management import call_command
            try:
                call_command('seed_themes')
            except Exception:
                pass
        return Theme.objects.filter(is_active=True)


class ThemeDetailView(generics.RetrieveAPIView):
    serializer_class = ThemeSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Theme.objects.filter(is_active=True)
    lookup_field = 'slug'
