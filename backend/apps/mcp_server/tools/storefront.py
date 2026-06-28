from apps.themes.models import Theme
from .registry import register_tool, ToolError

@register_tool(
    name="get_theme_settings",
    description="Retrieve the store's currently active theme and its layout/color configuration settings.",
    input_schema={
        "type": "object",
        "properties": {}
    }
)
def get_theme_settings(store, arguments):
    theme = store.active_theme
    if not theme:
        return {
            "active_theme": None,
            "template_config": {}
        }
        
    return {
        "active_theme": {
            "id": str(theme.id),
            "name": theme.name,
            "slug": theme.slug,
            "version": theme.version,
            "creator": theme.creator,
            "supports_rtl": theme.supports_rtl,
        },
        "template_config": theme.template_config
    }


@register_tool(
    name="update_theme_settings",
    description="Update the store's storefront active theme or configure the theme layout/color settings.",
    input_schema={
        "type": "object",
        "properties": {
            "theme_slug": {
                "type": "string",
                "description": "Optional theme slug to switch the store's active theme."
            },
            "template_config": {
                "type": "object",
                "description": "Optional JSON configuration to update the theme's colors, typography, or styling configurations."
            }
        }
    }
)
def update_theme_settings(store, arguments):
    theme_slug = arguments.get("theme_slug")
    template_config = arguments.get("template_config")

    if not theme_slug and template_config is None:
        raise ToolError("You must provide either theme_slug or template_config to perform an update.")

    if theme_slug:
        try:
            theme = Theme.objects.get(slug=theme_slug, is_active=True)
            store.active_theme = theme
            store.save()
        except Theme.DoesNotExist:
            raise ToolError(f"Active theme with slug '{theme_slug}' not found.")

    if template_config is not None:
        theme = store.active_theme
        if not theme:
            raise ToolError("Cannot update settings: No active theme is currently set for this store.")
        
        if isinstance(theme.template_config, dict):
            theme.template_config.update(template_config)
        else:
            theme.template_config = template_config
            
        theme.save()

    return {
        "message": "Theme settings updated successfully.",
        "active_theme_slug": store.active_theme.slug if store.active_theme else None,
        "template_config": store.active_theme.template_config if store.active_theme else {}
    }
