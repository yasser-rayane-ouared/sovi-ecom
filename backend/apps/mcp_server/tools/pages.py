from django.db import transaction, models
from apps.pages.models import LandingPage, PageSection
from .registry import register_tool, ToolError

SECTION_TYPES_ENUM = [
    'hero', 'product_gallery', 'carousel', 'reviews', 'faq', 'video',
    'comparison', 'benefits', 'before_after', 'countdown', 'sticky_cta',
    'quantity_offers', 'bundle_offers', 'delivery_info', 'text', 'image',
    'floating_order_button'
]

@register_tool(
    name="create_landing_page",
    description="Create a new landing page for the store with sections. Configures page title, slug, and initial layout sections.",
    input_schema={
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "The title of the landing page."
            },
            "slug": {
                "type": "string",
                "description": "The unique URL slug for the page."
            },
            "product_id": {
                "type": "string",
                "description": "Optional UUID of a product to link with direct checkout."
            },
            "sections": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string",
                            "enum": SECTION_TYPES_ENUM,
                            "description": "Type of page section."
                        },
                        "config": {
                            "type": "object",
                            "description": "JSON configuration parameters for this section."
                        }
                    },
                    "required": ["type"]
                },
                "description": "Ordered array of sections to add to the page."
            }
        },
        "required": ["title", "slug"]
    }
)
def create_landing_page(store, arguments):
    title = arguments.get("title")
    slug = arguments.get("slug")
    product_id = arguments.get("product_id")
    sections_data = arguments.get("sections", [])

    if LandingPage.objects.filter(store=store, slug=slug).exists():
        raise ToolError(f"A landing page with slug '{slug}' already exists in this store.")

    with transaction.atomic():
        page = LandingPage.objects.create(
            store=store,
            title=title,
            slug=slug,
            product_id=product_id if product_id else None,
            is_active=True
        )
        
        for idx, sec_data in enumerate(sections_data):
            PageSection.objects.create(
                page=page,
                section_type=sec_data["type"],
                position=idx,
                config=sec_data.get("config", {}),
                is_enabled=True
            )
            
    return {
        "page_id": str(page.id),
        "title": page.title,
        "slug": page.slug,
        "sections_count": len(sections_data)
    }


@register_tool(
    name="add_page_section",
    description="Add a new section to an existing landing page at a given position, shifting subsequent sections.",
    input_schema={
        "type": "object",
        "properties": {
            "page_id": {
                "type": "string",
                "description": "The UUID of the landing page to modify."
            },
            "section_type": {
                "type": "string",
                "enum": SECTION_TYPES_ENUM,
                "description": "Type of section to add."
            },
            "position": {
                "type": "integer",
                "description": "Index position to place the section (0-indexed)."
            },
            "config": {
                "type": "object",
                "description": "JSON config parameters."
            }
        },
        "required": ["page_id", "section_type", "position"]
    }
)
def add_page_section(store, arguments):
    page_id = arguments.get("page_id")
    section_type = arguments.get("section_type")
    position = int(arguments.get("position"))
    config = arguments.get("config", {})

    try:
        page = LandingPage.objects.get(id=page_id, store=store)
    except LandingPage.DoesNotExist:
        raise ToolError(f"Landing page with ID '{page_id}' not found.")

    with transaction.atomic():
        # Shift subsequent sections
        PageSection.objects.filter(page=page, position__gte=position).update(position=models.F('position') + 1)
        
        # Create the new section
        new_section = PageSection.objects.create(
            page=page,
            section_type=section_type,
            position=position,
            config=config,
            is_enabled=True
        )
        
    return {
        "section_id": str(new_section.id),
        "page_id": page_id,
        "section_type": section_type,
        "position": position
    }


@register_tool(
    name="list_landing_pages",
    description="List all landing pages in the store with their section counts.",
    input_schema={
        "type": "object",
        "properties": {}
    }
)
def list_landing_pages(store, arguments):
    pages = LandingPage.objects.filter(store=store).prefetch_related('sections')
    
    pages_data = []
    for page in pages:
        pages_data.append({
            "id": str(page.id),
            "title": page.title,
            "slug": page.slug,
            "is_active": page.is_active,
            "sections_count": page.sections.count(),
            "product_id": str(page.product_id) if page.product_id else None
        })
        
    return {
        "landing_pages": pages_data
    }


@register_tool(
    name="update_page_section",
    description="Update the configuration of an existing landing page section.",
    input_schema={
        "type": "object",
        "properties": {
            "section_id": {
                "type": "string",
                "description": "The exact UUID of the page section to update."
            },
            "config": {
                "type": "object",
                "description": "The JSON configuration parameters for this section."
            },
            "position": {
                "type": "integer",
                "description": "Optional index position to update/move the section."
            },
            "is_enabled": {
                "type": "boolean",
                "description": "Optional toggle to enable/disable the section."
            }
        },
        "required": ["section_id"]
    }
)
def update_page_section(store, arguments):
    section_id = arguments.get("section_id")
    config = arguments.get("config")
    position = arguments.get("position")
    is_enabled = arguments.get("is_enabled")
    
    try:
        section = PageSection.objects.get(id=section_id, page__store=store)
    except PageSection.DoesNotExist:
        raise ToolError(f"Page section with ID '{section_id}' not found.")
        
    if config is not None:
        section.config = config
    if position is not None:
        section.position = int(position)
    if is_enabled is not None:
        section.is_enabled = is_enabled
        
    section.save()
    
    return {
        "message": "Page section updated successfully.",
        "section_id": section_id,
        "section_type": section.section_type,
        "position": section.position,
        "is_enabled": section.is_enabled
    }


@register_tool(
    name="delete_page_section",
    description="Delete a section from a landing page.",
    input_schema={
        "type": "object",
        "properties": {
            "section_id": {
                "type": "string",
                "description": "The exact UUID of the page section to delete."
            }
        },
        "required": ["section_id"]
    }
)
def delete_page_section(store, arguments):
    section_id = arguments.get("section_id")
    try:
        section = PageSection.objects.get(id=section_id, page__store=store)
    except PageSection.DoesNotExist:
        raise ToolError(f"Page section with ID '{section_id}' not found.")
        
    section_type = section.section_type
    section.delete()
    
    return {
        "message": f"Successfully deleted landing page section of type '{section_type}'.",
        "section_id": section_id
    }
