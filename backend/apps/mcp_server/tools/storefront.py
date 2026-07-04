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


@register_tool(
    name="get_store_settings",
    description="Retrieve the store's profile settings (name, description, logo, favicon, custom domain, contact phone, contact email, whatsapp number, and social links).",
    input_schema={
        "type": "object",
        "properties": {}
    }
)
def get_store_settings(store, arguments):
    settings = getattr(store, 'settings', None)
    return {
        "id": str(store.id),
        "name": store.name,
        "description": store.description,
        "subdomain": store.subdomain,
        "custom_domain": store.custom_domain,
        "logo": store.logo,
        "favicon": store.favicon,
        "currency": store.currency,
        "language": store.language,
        "contact_phone": settings.contact_phone if settings else "",
        "contact_email": settings.contact_email if settings else "",
        "whatsapp_number": settings.whatsapp_number if settings else "",
        "facebook_url": settings.facebook_url if settings else "",
        "instagram_url": settings.instagram_url if settings else "",
        "tiktok_url": settings.tiktok_url if settings else ""
    }


@register_tool(
    name="update_store_settings",
    description="Update the store's name, description, logo, custom domain, contact phone, contact email, whatsapp number, or social links.",
    input_schema={
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "The name of the store."
            },
            "description": {
                "type": "string",
                "description": "General description of the store."
            },
            "logo": {
                "type": "string",
                "description": "URL of the store's logo."
            },
            "favicon": {
                "type": "string",
                "description": "URL of the store's favicon."
            },
            "custom_domain": {
                "type": "string",
                "description": "Custom domain name (e.g. www.mystore.com). Can be blank to remove."
            },
            "contact_phone": {
                "type": "string",
                "description": "Support contact phone number."
            },
            "contact_email": {
                "type": "string",
                "description": "Support contact email address."
            },
            "whatsapp_number": {
                "type": "string",
                "description": "WhatsApp contact number."
            },
            "facebook_url": {
                "type": "string",
                "description": "Facebook page URL."
            },
            "instagram_url": {
                "type": "string",
                "description": "Instagram profile URL."
            },
            "tiktok_url": {
                "type": "string",
                "description": "TikTok profile URL."
            }
        }
    }
)
def update_store_settings(store, arguments):
    # Update Store fields
    if "name" in arguments:
        store.name = arguments["name"]
    if "description" in arguments:
        store.description = arguments["description"]
    if "logo" in arguments:
        store.logo = arguments["logo"]
    if "favicon" in arguments:
        store.favicon = arguments["favicon"]
    if "custom_domain" in arguments:
        cd = arguments["custom_domain"]
        store.custom_domain = cd.strip() if cd and cd.strip() else None
    store.save()
    
    # Update StoreSettings fields
    settings = getattr(store, 'settings', None)
    if settings:
        if "contact_phone" in arguments:
            settings.contact_phone = arguments["contact_phone"]
        if "contact_email" in arguments:
            settings.contact_email = arguments["contact_email"]
        if "whatsapp_number" in arguments:
            settings.whatsapp_number = arguments["whatsapp_number"]
        if "facebook_url" in arguments:
            settings.facebook_url = arguments["facebook_url"]
        if "instagram_url" in arguments:
            settings.instagram_url = arguments["instagram_url"]
        if "tiktok_url" in arguments:
            settings.tiktok_url = arguments["tiktok_url"]
        settings.save()
        
    return {
        "message": "Store settings updated successfully.",
        "name": store.name,
        "description": store.description,
        "custom_domain": store.custom_domain,
        "contact_phone": settings.contact_phone if settings else "",
        "contact_email": settings.contact_email if settings else "",
        "whatsapp_number": settings.whatsapp_number if settings else ""
    }
