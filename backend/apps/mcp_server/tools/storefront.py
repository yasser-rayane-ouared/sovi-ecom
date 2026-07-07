from apps.themes.models import Theme
from .registry import register_tool, ToolError
import json
import uuid

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
        # Self-healing: assign first active theme if none is set on the store
        try:
            theme = Theme.objects.filter(is_active=True).first()
            if theme:
                store.active_theme = theme
                store.save()
        except Exception:
            pass
            
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

    theme = store.active_theme
    if not theme:
        # Self-healing: assign first active theme if none is set on the store
        try:
            theme = Theme.objects.filter(is_active=True).first()
            if theme:
                store.active_theme = theme
                store.save()
        except Exception:
            pass

    if not theme:
        raise ToolError("Cannot update settings: No active theme is set and no themes exist in the platform.")
        
    if template_config is not None:
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


@register_tool(
    name="list_themes",
    description="List all available themes in the platform that the store can switch to.",
    input_schema={
        "type": "object",
        "properties": {}
    }
)
def list_themes(store, arguments):
    themes = Theme.objects.filter(is_active=True)
    themes_list = []
    for t in themes:
        themes_list.append({
            "name": t.name,
            "slug": t.slug,
            "description": t.description,
            "creator": t.creator,
            "version": t.version,
            "is_free": t.is_free,
            "supports_rtl": t.supports_rtl
        })
    return {"themes": themes_list}


@register_tool(
    name="add_homepage_section",
    description="Add a new section (e.g. hero, announcement, featured_products, trust_badges, text, image, banner, categories) to the storefront homepage builder layout.",
    input_schema={
        "type": "object",
        "properties": {
            "section_type": {
                "type": "string",
                "enum": ["announcement", "header", "hero", "featured_products", "trust_badges", "footer", "text", "image", "banner", "categories"],
                "description": "The layout section type to add."
            },
            "config": {
                "type": "object",
                "description": "JSON configuration object containing text content, styling, colors, and links for the section."
            },
            "position": {
                "type": "integer",
                "description": "Optional order index position to insert the section. If omitted, appends to the end."
            }
        },
        "required": ["section_type", "config"]
    }
)
def add_homepage_section(store, arguments):
    section_type = arguments.get("section_type")
    config = arguments.get("config")
    position = arguments.get("position")
    
    settings = getattr(store, 'settings', None)
    if not settings:
        raise ToolError("Store settings configuration object not found.")
        
    try:
        sections = json.loads(settings.homepage_sections) if settings.homepage_sections else []
    except Exception:
        sections = []
        
    # Generate a unique section ID
    section_id = f"custom-{section_type}-{uuid.uuid4().hex[:8]}"
    
    new_section = {
        "id": section_id,
        "section_type": section_type,
        "config": config,
        "order": len(sections)
    }
    
    if position is not None:
        pos = max(0, min(int(position), len(sections)))
        sections.insert(pos, new_section)
    else:
        sections.append(new_section)
        
    # Re-normalize orders
    for idx, sec in enumerate(sections):
        sec["order"] = idx
        
    settings.homepage_sections = json.dumps(sections)
    settings.save()
    
    return {
        "message": f"Successfully added '{section_type}' section.",
        "section_id": section_id,
        "position": position if position is not None else len(sections) - 1,
        "sections": sections
    }


@register_tool(
    name="update_homepage_section",
    description="Update the configuration parameters or reorder position of an existing homepage builder section.",
    input_schema={
        "type": "object",
        "properties": {
            "section_id": {
                "type": "string",
                "description": "The exact ID of the homepage section to edit (e.g. 'default-hero' or custom ID)."
            },
            "config": {
                "type": "object",
                "description": "JSON configuration object containing text fields, colors, font sizes, alignments, or links to merge/update."
            },
            "position": {
                "type": "integer",
                "description": "Optional new index position order to move the section to."
            }
        },
        "required": ["section_id"]
    }
)
def update_homepage_section(store, arguments):
    section_id = arguments.get("section_id")
    config = arguments.get("config")
    position = arguments.get("position")
    
    settings = getattr(store, 'settings', None)
    if not settings:
        raise ToolError("Store settings configuration object not found.")
        
    try:
        sections = json.loads(settings.homepage_sections) if settings.homepage_sections else []
    except Exception:
        sections = []
        
    found_sec = None
    for sec in sections:
        if sec.get("id") == section_id:
            found_sec = sec
            break
            
    if not found_sec:
        raise ToolError(f"Homepage section with ID '{section_id}' not found.")
        
    # Merge config if provided
    if config is not None:
        if "config" not in found_sec or not isinstance(found_sec["config"], dict):
            found_sec["config"] = {}
        found_sec["config"].update(config)
        
    # Handle reordering if position is provided
    if position is not None:
        sections.remove(found_sec)
        pos = max(0, min(int(position), len(sections)))
        sections.insert(pos, found_sec)
        
    # Re-normalize orders
    for idx, sec in enumerate(sections):
        sec["order"] = idx
        
    settings.homepage_sections = json.dumps(sections)
    settings.save()
    
    return {
        "message": f"Successfully updated homepage section '{section_id}'.",
        "section_id": section_id,
        "config": found_sec.get("config", {}),
        "order": found_sec.get("order", 0)
    }


@register_tool(
    name="delete_homepage_section",
    description="Remove/delete an existing section from the storefront homepage builder layout.",
    input_schema={
        "type": "object",
        "properties": {
            "section_id": {
                "type": "string",
                "description": "The exact ID of the homepage section to delete."
            }
        },
        "required": ["section_id"]
    }
)
def delete_homepage_section(store, arguments):
    section_id = arguments.get("section_id")
    
    settings = getattr(store, 'settings', None)
    if not settings:
        raise ToolError("Store settings configuration object not found.")
        
    try:
        sections = json.loads(settings.homepage_sections) if settings.homepage_sections else []
    except Exception:
        sections = []
        
    initial_len = len(sections)
    sections = [s for s in sections if s.get("id") != section_id]
    
    if len(sections) == initial_len:
        raise ToolError(f"Homepage section with ID '{section_id}' not found.")
        
    # Re-normalize orders
    for idx, sec in enumerate(sections):
        sec["order"] = idx
        
    settings.homepage_sections = json.dumps(sections)
    settings.save()
    
    return {
        "message": f"Successfully deleted homepage section '{section_id}'.",
        "section_id": section_id
    }


def get_absolute_storefront_link(subdomain, path, custom_domain=None):
    import os
    root_domain = os.environ.get('NEXT_PUBLIC_ROOT_DOMAIN', 'localhost:3000')
    
    if custom_domain:
        protocol = 'http' if 'localhost' in root_domain or '127.0.0.1' in root_domain else 'https'
        return f"{protocol}://{custom_domain}{path}"
        
    if 'localhost' in root_domain or '127.0.0.1' in root_domain:
        port_suffix = ''
        if ':' in root_domain:
            port_suffix = ':' + root_domain.split(':')[1]
        return f"http://{subdomain}.localhost{port_suffix}{path}"
        
    if 'railway.app' in root_domain:
        return f"https://{root_domain}/{subdomain}{path}"
        
    clean_root = root_domain.split(':')[0]
    return f"https://{subdomain}.{clean_root}{path}"


@register_tool(
    name="get_storefront_links",
    description="Retrieve live storefront links (home, products, categories, pages) for previewing and testing.",
    input_schema={
        "type": "object",
        "properties": {}
    }
)
def get_storefront_links(store, arguments):
    from apps.products.models import Product, Category
    from apps.pages.models import LandingPage

    subdomain = store.subdomain
    custom_domain = store.custom_domain

    links = {
        "home": get_absolute_storefront_link(subdomain, "/", custom_domain),
        "products": [],
        "categories": [],
        "pages": []
    }

    active_products = Product.objects.filter(store=store, status='active')
    for p in active_products:
        links["products"].append({
            "title": p.title,
            "url": get_absolute_storefront_link(subdomain, f"/products/{p.slug}", custom_domain)
        })

    categories = Category.objects.filter(store=store, is_active=True)
    for c in categories:
        links["categories"].append({
            "name": c.name,
            "url": get_absolute_storefront_link(subdomain, f"/categories/{c.slug}", custom_domain)
        })

    landing_pages = LandingPage.objects.filter(store=store, is_active=True)
    for lp in landing_pages:
        links["pages"].append({
            "title": lp.title,
            "url": get_absolute_storefront_link(subdomain, f"/pages/{lp.slug}", custom_domain)
        })

    return links


@register_tool(
    name="get_section_schemas",
    description="Retrieve the exact JSON configuration schemas (fields, types, defaults, and requirements) for all homepage and product page section types.",
    input_schema={
        "type": "object",
        "properties": {}
    }
)
def get_section_schemas(store, arguments):
    return {
        "homepage_and_product_sections": {
            "hero": {
                "description": "Main title banner with subtitle, badge, pricing toggle, and call-to-action button.",
                "fields": {
                    "title": { "type": "string", "default": "عنوان المنتج الرئيسي" },
                    "subtitle": { "type": "string", "default": "وصف مختصر وجذاب للمنتج" },
                    "badge_text": { "type": "string", "default": "" },
                    "show_price": { "type": "boolean", "default": True },
                    "show_discount": { "type": "boolean", "default": True },
                    "bg_style": { "type": "string", "enum": ["gradient", "dark", "white"], "default": "gradient" },
                    "cta_text": { "type": "string", "default": "أطلب الآن!" }
                }
            },
            "video": {
                "description": "Video player for advertising or product walkthrough. Accepts YouTube or raw video links.",
                "fields": {
                    "title": { "type": "string", "default": "" },
                    "video_url": { "type": "string", "default": "" },
                    "autoplay": { "type": "boolean", "default": False },
                    "muted": { "type": "boolean", "default": True },
                    "aspect_ratio": { "type": "string", "default": "16/9" }
                }
            },
            "reviews": {
                "description": "Customer reviews section with ratings and review descriptions.",
                "fields": {
                    "title": { "type": "string", "default": "آراء زبائننا" },
                    "reviews": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": { "type": "string", "description": "Reviewer name and city (e.g. 'أحمد - وهران')" },
                                "text": { "type": "string", "description": "Review content text" },
                                "rating": { "type": "integer", "enum": [1, 2, 3, 4, 5], "default": 5 },
                                "date": { "type": "string", "default": "منذ يوم" }
                            },
                            "required": ["name", "text"]
                        }
                    }
                }
            },
            "faq": {
                "description": "Frequently asked questions accordion.",
                "fields": {
                    "title": { "type": "string", "default": "أسئلة شائعة" },
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "q": { "type": "string", "description": "Question text" },
                                "a": { "type": "string", "description": "Answer text" }
                            },
                            "required": ["q", "a"]
                        }
                    }
                }
            },
            "benefits": {
                "description": "Key selling points or product benefits with icons.",
                "fields": {
                    "title": { "type": "string", "default": "لماذا تختارنا؟" },
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "icon": { "type": "string", "description": "Emoji icon (e.g. '✅', '🚚')" },
                                "title": { "type": "string", "description": "Benefit title" },
                                "desc": { "type": "string", "description": "Benefit description" }
                            },
                            "required": ["icon", "title", "desc"]
                        }
                    }
                }
            },
            "before_after": {
                "description": "Side-by-side or slider comparison of before/after photos.",
                "fields": {
                    "title": { "type": "string", "default": "قبل وبعد" },
                    "before_label": { "type": "string", "default": "قبل" },
                    "after_label": { "type": "string", "default": "بعد" },
                    "before_image": { "type": "string", "description": "Before image URL" },
                    "after_image": { "type": "string", "description": "After image URL" }
                }
            },
            "countdown": {
                "description": "Urgency countdown timer section.",
                "fields": {
                    "title": { "type": "string", "default": "العرض ينتهي خلال:" },
                    "hours": { "type": "integer", "default": 2 },
                    "minutes": { "type": "integer", "default": 0 },
                    "seconds": { "type": "integer", "default": 0 },
                    "bg_color": { "type": "string", "default": "#dc2626" },
                    "text_color": { "type": "string", "default": "#ffffff" },
                    "urgency_text": { "type": "string", "default": "الكمية محدودة!" }
                }
            },
            "quantity_offers": {
                "description": "Styling configurations for quantity discounts display. NOTE: Actual quantity tiers must be added via get_product / update_product under the product's 'quantity_offers' field (not in this config).",
                "fields": {
                    "title": { "type": "string", "default": "عروض الكمية" },
                    "subtitle": { "type": "string", "default": "" },
                    "highlight_index": { "type": "integer", "default": 0, "description": "Zero-based index of the offer to highlight as best seller" },
                    "highlight_badge": { "type": "string", "default": "الأفضل" }
                }
            },
            "bundle_offers": {
                "description": "Styling configurations for product bundles display. NOTE: Actual bundle structures must be added via the backend (not in this config).",
                "fields": {
                    "title": { "type": "string", "default": "عروض الباقات" },
                    "subtitle": { "type": "string", "default": "" },
                    "highlight_text": { "type": "string", "default": "الأكثر طلباً" }
                }
            },
            "delivery_info": {
                "description": "Shipping and payment methods delivery information list.",
                "fields": {
                    "title": { "type": "string", "default": "معلومات التوصيل" },
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "icon": { "type": "string", "description": "Emoji icon" },
                                "text": { "type": "string", "description": "Delivery terms explanation" }
                            },
                            "required": ["icon", "text"]
                        }
                    }
                }
            },
            "comparison": {
                "description": "A comparative table showing why your product is better than competitors.",
                "fields": {
                    "title": { "type": "string", "default": "جدول المقارنة" },
                    "columns": { "type": "array", "items": { "type": "string" }, "default": ["المميزات", "منتجنا", "المنافس"] },
                    "rows": {
                        "type": "array",
                        "items": {
                            "type": "array",
                            "items": { "type": "string" }
                        },
                        "default": [["الجودة", "ممتازة ✅", "عادية ❌"]]
                    }
                }
            },
            "text": {
                "description": "Free text section with custom alignment and size.",
                "fields": {
                    "title": { "type": "string", "default": "" },
                    "content": { "type": "string", "default": "اكتب النص هنا..." },
                    "align": { "type": "string", "enum": ["right", "center", "left"], "default": "right" },
                    "size": { "type": "string", "enum": ["sm", "base", "lg", "xl"], "default": "base" }
                }
            },
            "image": {
                "description": "Full-width or restricted-width image block.",
                "fields": {
                    "image_url": { "type": "string", "default": "" },
                    "alt_text": { "type": "string", "default": "" },
                    "caption": { "type": "string", "default": "" },
                    "full_width": { "type": "boolean", "default": True }
                }
            },
            "product_gallery": {
                "description": "Interactive product photos swipe gallery.",
                "fields": {
                    "title": { "type": "string", "default": "صور المنتج" },
                    "show_zoom": { "type": "boolean", "default": True },
                    "layout": { "type": "string", "enum": ["swipe", "grid"], "default": "swipe" }
                }
            },
            "sticky_cta": {
                "description": "A call-to-action bar pinned at the bottom of the screen.",
                "fields": {
                    "text": { "type": "string", "default": "أطلب الآن!" },
                    "bg_color": { "type": "string", "default": "#6366f1" },
                    "show_price": { "type": "boolean", "default": True },
                    "scroll_to": { "type": "string", "default": "#checkout", "description": "Element ID to scroll to (default is #checkout)" }
                }
            },
            "floating_order_button": {
                "description": "A shopping cart call-to-action button that appears on scroll.",
                "fields": {
                    "text": { "type": "string", "default": "🛒 أطلب الآن!" },
                    "scroll_to": { "type": "string", "default": "#checkout" }
                }
            }
        }
    }


