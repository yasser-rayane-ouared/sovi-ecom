"""Integrations URL routes."""
from django.urls import path
from . import views

urlpatterns = [
    path('<uuid:store_id>/google-sheets/', views.GoogleSheetsConfigView.as_view(), name='google-sheets-config'),
    path('<uuid:store_id>/google-sheets/test/', views.TestSheetsConnectionView.as_view(), name='google-sheets-test'),
    path('<uuid:store_id>/claude/', views.ClaudeConfigView.as_view(), name='claude-config'),
    path('<uuid:store_id>/claude/chat/', views.ClaudeChatView.as_view(), name='claude-chat'),
    path('<uuid:store_id>/mcp/sse/', views.McpSseView.as_view(), name='mcp-sse'),
    path('<uuid:store_id>/mcp/sse/<uuid:token>/', views.McpSseView.as_view(), name='mcp-sse-token'),
    path('<uuid:store_id>/mcp/message/', views.McpMessageView.as_view(), name='mcp-message'),
    path('<uuid:store_id>/mcp/message/<uuid:token>/', views.McpMessageView.as_view(), name='mcp-message-token'),
    path('<uuid:store_id>/telegram/', views.TelegramConfigView.as_view(), name='telegram-config'),
    path('<uuid:store_id>/telegram/test/', views.TestTelegramConnectionView.as_view(), name='telegram-test'),

]
