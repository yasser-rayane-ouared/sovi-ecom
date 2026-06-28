import hashlib
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import McpApiKey

class McpApiKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None
        
        raw_key = parts[1]
        if not raw_key.startswith('mcp_live_'):
            return None
        
        # Hash the provided key
        key_hash = hashlib.sha256(raw_key.encode('utf-8')).hexdigest()
        
        try:
            api_key = McpApiKey.objects.select_related('store').get(
                key_hash=key_hash,
                is_active=True,
                revoked_at__isnull=True
            )
        except McpApiKey.DoesNotExist:
            raise AuthenticationFailed("Invalid or inactive MCP API key.")
        
        store = api_key.store
        if not store.is_active:
            raise AuthenticationFailed("Store is suspended or inactive.")
        
        # Set attributes on request
        request.store = store
        request.mcp_api_key = api_key
        
        # Update last_used_at
        api_key.last_used_at = timezone.now()
        api_key.save(update_fields=['last_used_at'])
        
        # Return (user, auth). Set user to the store's owner.
        return (store.owner, api_key)
