import importlib

class ToolError(Exception):
    """Custom exception for user-facing tool errors."""
    pass

# Module-level registry
_tools_registry = {}

def register_tool(name, description, input_schema=None):
    """Decorator to register a tool handler."""
    if input_schema is None:
        input_schema = {
            "type": "object",
            "properties": {}
        }
    
    def decorator(func):
        _tools_registry[name] = {
            "name": name,
            "description": description,
            "inputSchema": input_schema,
            "handler": func
        }
        return func
    return decorator

def list_tools():
    """Returns the list of tools in MCP-compliant shape."""
    return [
        {
            "name": tool["name"],
            "description": tool["description"],
            "inputSchema": tool["inputSchema"]
        }
        for tool in _tools_registry.values()
    ]

def get_tool(name):
    """Looks up a tool by name."""
    return _tools_registry.get(name)

def load_all_tools():
    """Dynamically imports all tool submodules to trigger decorators."""
    submodules = [
        "apps.mcp_server.tools.products",
        "apps.mcp_server.tools.orders",
        "apps.mcp_server.tools.pages",
        "apps.mcp_server.tools.storefront"
    ]
    for submodule in submodules:
        try:
            importlib.import_module(submodule)
        except ModuleNotFoundError:
            # Safe catch during init
            pass
