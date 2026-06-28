"""Pages views."""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.stores.models import Store
from apps.stores.utils import get_store_for_user
from .models import LandingPage, PageSection
from .serializers import LandingPageSerializer, PageSectionSerializer

class LandingPageListCreateView(generics.ListCreateAPIView):
    serializer_class = LandingPageSerializer
    search_fields = ['title', 'slug']

    def get_store(self):
        return get_store_for_user(self.kwargs['store_id'], self.request.user, 'pages')

    def get_queryset(self):
        return LandingPage.objects.filter(store=self.get_store()).prefetch_related('sections')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['store'] = self.get_store()
        return ctx


class LandingPageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LandingPageSerializer

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'pages')
        return LandingPage.objects.filter(store=store).prefetch_related('sections')


class PageSectionUpdateOrderView(APIView):
    """Update section layout positions."""
    def post(self, request, store_id, page_id):
        store = get_store_for_user(store_id, request.user, 'pages')
        page = LandingPage.objects.get(id=page_id, store=store)
        orders = request.data.get('orders', []) # list of {'id': uuid, 'position': int}

        for item in orders:
            PageSection.objects.filter(id=item['id'], page=page).update(position=item['position'])

        return Response({'message': 'Order updated successfully'})


class PageSectionListCreateView(generics.ListCreateAPIView):
    serializer_class = PageSectionSerializer

    def get_page(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'pages')
        return LandingPage.objects.get(id=self.kwargs['page_id'], store=store)

    def get_queryset(self):
        return PageSection.objects.filter(page=self.get_page())

    def perform_create(self, serializer):
        page = self.get_page()
        # Use provided position if available, otherwise auto-increment
        position = serializer.validated_data.get('position', page.sections.count())
        serializer.save(page=page, position=position)


class PageSectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PageSectionSerializer

    def get_queryset(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'pages')
        page = LandingPage.objects.get(id=self.kwargs['page_id'], store=store)
        return PageSection.objects.filter(page=page)
