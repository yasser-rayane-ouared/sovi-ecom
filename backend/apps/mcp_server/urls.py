from django.urls import path
from . import views, key_management

urlpatterns = [
    # JSON-RPC 2.0 endpoint for Claude
    path('', views.McpJsonRpcView.as_view(), name='mcp-endpoint'),
    
    # Merchant Dashboard key management
    path('keys/', key_management.McpApiKeyListCreateView.as_view(), name='mcp-keys-list-create'),
    path('keys/<uuid:key_id>/revoke/', key_management.McpApiKeyRevokeView.as_view(), name='mcp-key-revoke'),
]
