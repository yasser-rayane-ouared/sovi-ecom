from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from apps.stores.utils import get_store_for_user
from .models import McpApiKey

class McpApiKeyListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        store_id = request.query_params.get('store_id')
        if not store_id:
            return Response({'error': 'store_id parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        store = get_store_for_user(store_id, request.user, 'integrations')
        keys = McpApiKey.objects.filter(store=store, revoked_at__isnull=True)
        
        data = [
            {
                "id": str(key.id),
                "name": key.name,
                "key_prefix": key.key_prefix,
                "is_active": key.is_active,
                "created_at": key.created_at,
                "last_used_at": key.last_used_at
            }
            for key in keys
        ]
        return Response(data)

    def post(self, request):
        store_id = request.data.get('store_id')
        name = request.data.get('name')
        
        if not store_id or not name:
            return Response({'error': 'store_id and name parameters are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        store = get_store_for_user(store_id, request.user, 'integrations')
        
        instance, raw_key = McpApiKey.create_for_store(store, name)
        
        return Response({
            "message": "API key generated successfully. Save it now; it will never be displayed again.",
            "id": str(instance.id),
            "name": instance.name,
            "key_prefix": instance.key_prefix,
            "raw_key": raw_key,
            "is_active": instance.is_active,
            "created_at": instance.created_at
        }, status=status.HTTP_201_CREATED)


class McpApiKeyRevokeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, key_id):
        store_id = request.data.get('store_id')
        if not store_id:
            return Response({'error': 'store_id parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        store = get_store_for_user(store_id, request.user, 'integrations')
        
        try:
            key = McpApiKey.objects.get(id=key_id, store=store)
        except McpApiKey.DoesNotExist:
            return Response({'error': 'API key not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        key.is_active = False
        key.revoked_at = timezone.now()
        key.save()
        
        return Response({"message": "API key revoked successfully."})
