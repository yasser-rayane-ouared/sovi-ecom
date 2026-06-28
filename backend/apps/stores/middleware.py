"""
Tenant middleware — resolves subdomain to store on every request.
"""
from django.http import JsonResponse
from .models import Store


class TenantMiddleware:
    """Extract subdomain from Host header and attach store to request."""

    EXEMPT_PATHS = ['/api/auth/', '/api/admin-panel/', '/api/themes/', '/admin/']

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.store = None
        host = request.get_host().split(':')[0].lower()
        clean_host = host
        if clean_host.startswith('www.'):
            clean_host = clean_host[4:]

        store = None
        # Try to resolve by custom domain first
        if host != 'localhost' and '.' in host:
            try:
                from django.db.models import Q
                store = Store.objects.select_related('owner', 'settings', 'active_theme').get(
                    Q(custom_domain=host) | Q(custom_domain=clean_host) | Q(custom_domain=f"www.{clean_host}"),
                    is_active=True,
                    is_suspended=False,
                )
            except Store.DoesNotExist:
                store = None

        # Fall back to subdomain resolution if not resolved by custom domain
        if not store:
            parts = host.split('.')
            subdomain = None

            if len(parts) > 1 and parts[0] not in ('www', 'api'):
                subdomain = parts[0]

            if subdomain and subdomain != 'localhost':
                try:
                    store = Store.objects.select_related('owner', 'settings', 'active_theme').get(
                        subdomain=subdomain,
                        is_active=True,
                        is_suspended=False,
                    )
                except Store.DoesNotExist:
                    store = None

        if store:
            request.store = store
        else:
            # Check if this is a storefront request
            if request.path.startswith('/api/storefront/'):
                pass  # Will be resolved by view
            elif not any(request.path.startswith(p) for p in self.EXEMPT_PATHS):
                pass  # Allow request to continue

        response = self.get_response(request)
        return response
