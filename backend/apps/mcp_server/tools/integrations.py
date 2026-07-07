from apps.pixels.models import PixelConfig
from apps.integrations.models import GoogleSheetsConfig, TelegramConfig
from apps.products.models import Product
from apps.delivery.models import StoreDeliveryConfig, DeliveryCompany
from .registry import register_tool, ToolError
import json


@register_tool(
    name="list_pixels",
    description="List all tracking pixels (Meta Pixel, TikTok Pixel, Snapchat Pixel) configured in the store.",
    input_schema={
        "type": "object",
        "properties": {}
    }
)
def list_pixels(store, arguments):
    pixels = PixelConfig.objects.filter(store=store).select_related('product')
    pixels_list = []
    for pixel in pixels:
        pixels_list.append({
            "id": str(pixel.id),
            "name": pixel.name,
            "platform": pixel.platform,
            "pixel_id": pixel.pixel_id,
            "access_token_configured": bool(pixel.access_token),
            "product_id": str(pixel.product.id) if pixel.product else None,
            "product_title": pixel.product.title if pixel.product else None,
            "is_active": pixel.is_active
        })
    return {"pixels": pixels_list}


@register_tool(
    name="create_pixel",
    description="Create a new tracking pixel for the store, optionally targeting a specific product.",
    input_schema={
        "type": "object",
        "properties": {
            "platform": {
                "type": "string",
                "enum": ["meta", "tiktok", "snapchat"],
                "description": "The target advertising platform."
            },
            "pixel_id": {
                "type": "string",
                "description": "The pixel code or ID value."
            },
            "name": {
                "type": "string",
                "description": "Friendly name for this pixel configuration."
            },
            "access_token": {
                "type": "string",
                "description": "Optional Conversions API access token."
            },
            "product_id": {
                "type": "string",
                "description": "Optional product UUID to target. If null, tracking is global."
            }
        },
        "required": ["platform", "pixel_id"]
    }
)
def create_pixel(store, arguments):
    platform = arguments.get("platform")
    pixel_id = arguments.get("pixel_id")
    name = arguments.get("name", "")
    access_token = arguments.get("access_token", "")
    product_id = arguments.get("product_id")
    
    product = None
    if product_id:
        try:
            product = Product.objects.get(id=product_id, store=store)
        except Product.DoesNotExist:
            raise ToolError(f"Product with ID '{product_id}' not found.")
            
    pixel = PixelConfig.objects.create(
        store=store,
        platform=platform,
        pixel_id=pixel_id,
        name=name,
        access_token=access_token,
        product=product,
        is_active=True
    )
    
    return {
        "message": "Tracking pixel created successfully.",
        "id": str(pixel.id),
        "name": pixel.name,
        "platform": pixel.platform,
        "pixel_id": pixel.pixel_id
    }


@register_tool(
    name="update_pixel",
    description="Update an existing tracking pixel's configuration, code, token, or active status.",
    input_schema={
        "type": "object",
        "properties": {
            "pixel_config_id": {
                "type": "string",
                "description": "The exact UUID of the pixel configuration to update."
            },
            "pixel_id": {
                "type": "string",
                "description": "Updated pixel code or ID value."
            },
            "name": {
                "type": "string",
                "description": "Updated friendly name."
            },
            "access_token": {
                "type": "string",
                "description": "Updated Conversions API access token."
            },
            "is_active": {
                "type": "boolean",
                "description": "Toggle active state."
            }
        },
        "required": ["pixel_config_id"]
    }
)
def update_pixel(store, arguments):
    pixel_config_id = arguments.get("pixel_config_id")
    try:
        pixel = PixelConfig.objects.get(id=pixel_config_id, store=store)
    except PixelConfig.DoesNotExist:
        raise ToolError(f"Pixel configuration with ID '{pixel_config_id}' not found.")
        
    if "pixel_id" in arguments:
        pixel.pixel_id = arguments["pixel_id"]
    if "name" in arguments:
        pixel.name = arguments["name"]
    if "access_token" in arguments:
        pixel.access_token = arguments["access_token"]
    if "is_active" in arguments:
        pixel.is_active = arguments["is_active"]
        
    pixel.save()
    
    return {
        "message": "Tracking pixel updated successfully.",
        "id": str(pixel.id),
        "platform": pixel.platform,
        "pixel_id": pixel.pixel_id,
        "is_active": pixel.is_active
    }


@register_tool(
    name="delete_pixel",
    description="Delete a tracking pixel configuration from the store.",
    input_schema={
        "type": "object",
        "properties": {
            "pixel_config_id": {
                "type": "string",
                "description": "The exact UUID of the pixel configuration to delete."
            }
        },
        "required": ["pixel_config_id"]
    }
)
def delete_pixel(store, arguments):
    pixel_config_id = arguments.get("pixel_config_id")
    try:
        pixel = PixelConfig.objects.get(id=pixel_config_id, store=store)
    except PixelConfig.DoesNotExist:
        raise ToolError(f"Pixel configuration with ID '{pixel_config_id}' not found.")
        
    platform = pixel.platform
    pixel.delete()
    
    return {
        "message": f"Successfully deleted {platform} pixel configuration.",
        "pixel_config_id": pixel_config_id
    }


@register_tool(
    name="get_integrations_config",
    description="Retrieve configuration details for third-party integrations (Google Sheets, Telegram notifications).",
    input_schema={
        "type": "object",
        "properties": {}
    }
)
def get_integrations_config(store, arguments):
    sheets, _ = GoogleSheetsConfig.objects.get_or_create(store=store)
    telegram, _ = TelegramConfig.objects.get_or_create(store=store)
    
    return {
        "google_sheets": {
            "spreadsheet_id": sheets.spreadsheet_id,
            "sheet_name": sheets.sheet_name,
            "is_active": sheets.is_active,
            "sync_on_create": sheets.sync_on_create,
            "credentials_configured": bool(sheets.credentials_json)
        },
        "telegram": {
            "bot_token": telegram.bot_token,
            "chat_id": telegram.chat_id,
            "is_active": telegram.is_active,
            "send_on_create": telegram.send_on_create,
            "send_on_status_change": telegram.send_on_status_change
        }
    }


@register_tool(
    name="update_telegram_integration",
    description="Configure and toggle the Telegram notification bot settings.",
    input_schema={
        "type": "object",
        "properties": {
            "bot_token": {
                "type": "string",
                "description": "The HTTP API bot token obtained from BotFather."
            },
            "chat_id": {
                "type": "string",
                "description": "The chat or group ID to send messages to."
            },
            "is_active": {
                "type": "boolean",
                "description": "Toggle active state for Telegram notifications."
            }
        }
    }
)
def update_telegram_integration(store, arguments):
    telegram, _ = TelegramConfig.objects.get_or_create(store=store)
    
    if "bot_token" in arguments:
        telegram.bot_token = arguments["bot_token"]
    if "chat_id" in arguments:
        telegram.chat_id = arguments["chat_id"]
    if "is_active" in arguments:
        telegram.is_active = arguments["is_active"]
        
    telegram.save()
    
    return {
        "message": "Telegram integration updated successfully.",
        "bot_token": telegram.bot_token,
        "chat_id": telegram.chat_id,
        "is_active": telegram.is_active
    }


@register_tool(
    name="update_google_sheets_integration",
    description="Configure and toggle Google Sheets order syncing.",
    input_schema={
        "type": "object",
        "properties": {
            "spreadsheet_id": {
                "type": "string",
                "description": "The long ID string of the target Google Sheet."
            },
            "sheet_name": {
                "type": "string",
                "description": "The specific sheet tab name (defaults to 'Orders')."
            },
            "credentials_json": {
                "type": "string",
                "description": "Service Account credentials JSON contents."
            },
            "is_active": {
                "type": "boolean",
                "description": "Toggle active state for Google Sheets sync."
            }
        }
    }
)
def update_google_sheets_integration(store, arguments):
    sheets, _ = GoogleSheetsConfig.objects.get_or_create(store=store)
    
    if "spreadsheet_id" in arguments:
        sheets.spreadsheet_id = arguments["spreadsheet_id"]
    if "sheet_name" in arguments:
        sheets.sheet_name = arguments["sheet_name"]
    if "credentials_json" in arguments:
        sheets.credentials_json = arguments["credentials_json"]
    if "is_active" in arguments:
        sheets.is_active = arguments["is_active"]
        
    sheets.save()
    
    return {
        "message": "Google Sheets integration updated successfully.",
        "spreadsheet_id": sheets.spreadsheet_id,
        "sheet_name": sheets.sheet_name,
        "is_active": sheets.is_active
    }


@register_tool(
    name="list_delivery_configs",
    description="List all shipping/delivery integrations (Yalidine, ZR Express, etc.) and their configuration status.",
    input_schema={
        "type": "object",
        "properties": {}
    }
)
def list_delivery_configs(store, arguments):
    companies = DeliveryCompany.objects.filter(is_active=True)
    configs_list = []
    
    for company in companies:
        config, _ = StoreDeliveryConfig.objects.get_or_create(store=store, company=company)
        configs_list.append({
            "company_name": company.name,
            "display_name": company.display_name,
            "api_id": config.api_id,
            "api_key_configured": bool(config.api_key),
            "api_secret_configured": bool(config.api_secret),
            "is_active": config.is_active,
            "is_default": config.is_default,
            "webhook_url": config.webhook_url
        })
        
    return {"delivery_configs": configs_list}


@register_tool(
    name="update_delivery_config",
    description="Configure and toggle a specific shipping/delivery integration (e.g. Yalidine or ZR Express).",
    input_schema={
        "type": "object",
        "properties": {
            "company_name": {
                "type": "string",
                "enum": ["yalidine", "zr_express", "noest", "ems", "ecolog", "guepex", "gupex", "maystro_delivery", "dhd", "yaliteck", "flash_delivery", "manual", "ecom_delivery"],
                "description": "The exact identifier name of the delivery company."
            },
            "api_id": {
                "type": "string",
                "description": "Optional API ID (e.g., Yalidine API ID)."
            },
            "api_key": {
                "type": "string",
                "description": "Optional API Key provided by the company."
            },
            "api_secret": {
                "type": "string",
                "description": "Optional API Secret or API token."
            },
            "is_active": {
                "type": "boolean",
                "description": "Toggle active state for this carrier integration."
            },
            "is_default": {
                "type": "boolean",
                "description": "Mark this carrier as the default choice for shipments."
            }
        },
        "required": ["company_name"]
    }
)
def update_delivery_config(store, arguments):
    company_name = arguments.pop("company_name")
    
    try:
        company = DeliveryCompany.objects.get(name=company_name)
    except DeliveryCompany.DoesNotExist:
        raise ToolError(f"Delivery company '{company_name}' not found.")
        
    config, _ = StoreDeliveryConfig.objects.get_or_create(store=store, company=company)
    
    if "api_id" in arguments:
        config.api_id = arguments["api_id"]
    if "api_key" in arguments:
        config.api_key = arguments["api_key"]
    if "api_secret" in arguments:
        config.api_secret = arguments["api_secret"]
    if "is_active" in arguments:
        config.is_active = arguments["is_active"]
    if "is_default" in arguments:
        config.is_default = arguments["is_default"]
        if arguments["is_default"]:
            StoreDeliveryConfig.objects.filter(store=store).exclude(id=config.id).update(is_default=False)
            
    config.save()
    
    return {
        "message": f"Delivery configuration for {company.display_name} updated successfully.",
        "company_name": company.name,
        "is_active": config.is_active,
        "is_default": config.is_default
    }

