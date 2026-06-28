from django.apps import AppConfig

class McpServerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.mcp_server'
    verbose_name = 'MCP Server'

    def ready(self):
        # Import all tools to trigger registration decorators
        from .tools.registry import load_all_tools
        load_all_tools()
