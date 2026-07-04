from apps.themes.models import Theme
from .registry import register_tool, ToolError
import json

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
    description="Retrieve the store's profile settings (name, description, logo, favicon, custom domain, colors, custom CSS, delivery prices, WhatsApp integration, trust badges, announcement bar, thank you messages, and social links).",
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
        "tiktok_url": settings.tiktok_url if settings else "",
        
        # Branding
        "primary_color": settings.primary_color if settings else "#6366f1",
        "secondary_color": settings.secondary_color if settings else "#8b5cf6",
        "custom_css": settings.custom_css if settings else "",
        
        # Delivery settings
        "free_delivery_threshold": float(settings.free_delivery_threshold) if settings and settings.free_delivery_threshold is not None else None,
        "default_delivery_price": float(settings.default_delivery_price) if settings else 0.0,
        
        # Messaging
        "thank_you_message": settings.thank_you_message if settings else "",
        "confirmation_message": settings.confirmation_message if settings else "",
        
        # SEO
        "seo_title": settings.seo_title if settings else "",
        "seo_description": settings.seo_description if settings else "",
        
        # Announcement bar
        "announcement_text": settings.announcement_text if settings else "",
        "announcement_bg_color": settings.announcement_bg_color if settings else "",
        
        # WhatsApp button
        "whatsapp_floating_button": settings.whatsapp_floating_button if settings else True,
        
        # Trust badges
        "badge_1_title": settings.badge_1_title if settings else "",
        "badge_1_desc": settings.badge_1_desc if settings else "",
        "badge_2_title": settings.badge_2_title if settings else "",
        "badge_2_desc": settings.badge_2_desc if settings else "",
        "badge_3_title": settings.badge_3_title if settings else "",
        "badge_3_desc": settings.badge_3_desc if settings else ""
    }


@register_tool(
    name="update_store_settings",
    description="Update the store's profile details, branding colors, custom CSS, SEO configs, delivery prices, announcement bar, trust badges, thank you messages, social page URLs, and other layout configurations.",
    input_schema={
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "The name of the store."},
            "description": {"type": "string", "description": "General description of the store."},
            "logo": {"type": "string", "description": "URL of the store's logo."},
            "favicon": {"type": "string", "description": "URL of the store's favicon."},
            "custom_domain": {"type": "string", "description": "Custom domain name. Can be blank to remove."},
            "contact_phone": {"type": "string", "description": "Support contact phone number."},
            "contact_email": {"type": "string", "description": "Support contact email address."},
            "whatsapp_number": {"type": "string", "description": "WhatsApp contact number."},
            "facebook_url": {"type": "string", "description": "Facebook page URL."},
            "instagram_url": {"type": "string", "description": "Instagram profile URL."},
            "tiktok_url": {"type": "string", "description": "TikTok profile URL."},
            
            # Branding
            "primary_color": {"type": "string", "description": "Hex color code for primary color (e.g. #4f46e5)."},
            "secondary_color": {"type": "string", "description": "Hex color code for secondary color."},
            "custom_css": {"type": "string", "description": "Custom CSS override rules for the storefront."},
            
            # Delivery
            "free_delivery_threshold": {"type": "number", "description": "Subtotal above which delivery is free."},
            "default_delivery_price": {"type": "number", "description": "Default delivery fee rate."},
            
            # Messaging
            "thank_you_message": {"type": "string", "description": "Text displayed to customer after order completion."},
            "confirmation_message": {"type": "string", "description": "Text shown to customer confirming the order status."},
            
            # SEO
            "seo_title": {"type": "string", "description": "Meta SEO title for the storefront tab."},
            "seo_description": {"type": "string", "description": "Meta description text for search engine results page."},
            
            # Customization & Announcements
            "announcement_text": {"type": "string", "description": "Announcement banner text displayed at top of storefront."},
            "announcement_bg_color": {"type": "string", "description": "Hex code color background for announcement bar (e.g. #4f46e5)."},
            "whatsapp_floating_button": {"type": "boolean", "description": "Toggle visibility of floating WhatsApp button on storefront pages."},
            
            # Trust badges
            "badge_1_title": {"type": "string", "description": "Title of the first trust badge (e.g. Fast Shipping)."},
            "badge_1_desc": {"type": "string", "description": "Description of the first trust badge."},
            "badge_2_title": {"type": "string", "description": "Title of the second trust badge (e.g. COD)."},
            "badge_2_desc": {"type": "string", "description": "Description of the second trust badge."},
            "badge_3_title": {"type": "string", "description": "Title of the third trust badge (e.g. Customer Support)."},
            "badge_3_desc": {"type": "string", "description": "Description of the third trust badge."}
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
            
        # Branding
        if "primary_color" in arguments:
            settings.primary_color = arguments["primary_color"]
        if "secondary_color" in arguments:
            settings.secondary_color = arguments["secondary_color"]
        if "custom_css" in arguments:
            settings.custom_css = arguments["custom_css"]
            
        # Delivery
        if "free_delivery_threshold" in arguments:
            settings.free_delivery_threshold = arguments["free_delivery_threshold"]
        if "default_delivery_price" in arguments:
            settings.default_delivery_price = arguments["default_delivery_price"]
            
        # Messaging
        if "thank_you_message" in arguments:
            settings.thank_you_message = arguments["thank_you_message"]
        if "confirmation_message" in arguments:
            settings.confirmation_message = arguments["confirmation_message"]
            
        # SEO
        if "seo_title" in arguments:
            settings.seo_title = arguments["seo_title"]
        if "seo_description" in arguments:
            settings.seo_description = arguments["seo_description"]
            
        # Announcement & Customization
        if "announcement_text" in arguments:
            settings.announcement_text = arguments["announcement_text"]
        if "announcement_bg_color" in arguments:
            settings.announcement_bg_color = arguments["announcement_bg_color"]
        if "whatsapp_floating_button" in arguments:
            settings.whatsapp_floating_button = arguments["whatsapp_floating_button"]
            
        # Trust badges
        if "badge_1_title" in arguments:
            settings.badge_1_title = arguments["badge_1_title"]
        if "badge_1_desc" in arguments:
            settings.badge_1_desc = arguments["badge_1_desc"]
        if "badge_2_title" in arguments:
            settings.badge_2_title = arguments["badge_2_title"]
        if "badge_2_desc" in arguments:
            settings.badge_2_desc = arguments["badge_2_desc"]
        if "badge_3_title" in arguments:
            settings.badge_3_title = arguments["badge_3_title"]
        if "badge_3_desc" in arguments:
            settings.badge_3_desc = arguments["badge_3_desc"]
            
        settings.save()
        
    return {
        "message": "Store settings updated successfully.",
        "name": store.name,
        "description": store.description,
        "custom_domain": store.custom_domain,
        "primary_color": settings.primary_color if settings else "#6366f1",
        "announcement_text": settings.announcement_text if settings else ""
    }


@register_tool(
    name="get_homepage_sections",
    description="Retrieve all configured homepage builder sections (JSON layout list).",
    input_schema={
        "type": "object",
        "properties": {}
    }
)
def get_homepage_sections(store, arguments):
    settings = getattr(store, 'settings', None)
    if not settings:
        return {"sections": []}
        
    try:
        sections_list = json.loads(settings.homepage_sections) if settings.homepage_sections else []
    except Exception:
        sections_list = []
        
    return {"sections": sections_list}


@register_tool(
    name="update_homepage_sections",
    description="Set or completely update the homepage layout builder sections.",
    input_schema={
        "type": "object",
        "properties": {
            "sections": {
                "type": "array",
                "description": "An array of homepage section configuration objects (e.g. slider, features, categories, products, banner)."
            }
        },
        "required": ["sections"]
    }
)
def update_homepage_sections(store, arguments):
    sections = arguments.get("sections")
    
    settings = getattr(store, 'settings', None)
    if not settings:
        raise ToolError("Store settings configuration object not found.")
        
    settings.homepage_sections = json.dumps(sections)
    settings.save()
    
    return {
        "message": "Homepage sections updated successfully.",
        "sections": sections
    }
