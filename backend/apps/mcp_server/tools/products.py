from apps.products.models import Product, Category
from apps.products.serializers import ProductSerializer
from .registry import register_tool, ToolError
from django.utils.text import slugify
import uuid

@register_tool(
    name="list_products",
    description="List active or draft products in the store, optionally filtered by category name or status.",
    input_schema={
        "type": "object",
        "properties": {
            "category_name": {
                "type": "string",
                "description": "Optional category name to filter products."
            },
            "status": {
                "type": "string",
                "enum": ["draft", "active", "archived"],
                "description": "Optional product status filter."
            },
            "limit": {
                "type": "integer",
                "default": 20,
                "description": "Maximum number of products to return."
            },
            "offset": {
                "type": "integer",
                "default": 0,
                "description": "Number of products to skip."
            }
        }
    }
)
def list_products(store, arguments):
    category_name = arguments.get("category_name")
    status_filter = arguments.get("status")
    limit = min(int(arguments.get("limit", 20)), 100)
    offset = max(int(arguments.get("offset", 0)), 0)

    qs = Product.objects.filter(store=store)
    
    if category_name:
        qs = qs.filter(category__name__iexact=category_name)
    
    if status_filter:
        qs = qs.filter(status=status_filter)
    
    total_count = qs.count()
    products_page = qs[offset:offset+limit]
    
    serializer = ProductSerializer(products_page, many=True, context={"store": store})
    
    return {
        "products": serializer.data,
        "total_count": total_count,
        "limit": limit,
        "offset": offset
    }


@register_tool(
    name="create_product",
    description="Create a new product in the store with name, description, price, stock, category and status.",
    input_schema={
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "The title/name of the product."
            },
            "description": {
                "type": "string",
                "description": "The detailed description of the product."
            },
            "price": {
                "type": "number",
                "description": "The sale price of the product in DZD."
            },
            "compare_price": {
                "type": "number",
                "description": "Optional original/comparison price of the product."
            },
            "cost_price": {
                "type": "number",
                "description": "Optional cost price of the product."
            },
            "stock_quantity": {
                "type": "integer",
                "description": "The initial inventory stock quantity of the product."
            },
            "category_name": {
                "type": "string",
                "description": "Category name for the product. Created if it doesn't exist."
            },
            "status": {
                "type": "string",
                "enum": ["draft", "active"],
                "default": "active",
                "description": "Initial status of the product."
            }
        },
        "required": ["title", "price"]
    }
)
def create_product(store, arguments):
    category_name = arguments.pop("category_name", None)
    
    if category_name:
        category, created = Category.objects.get_or_create(store=store, name=category_name)
        if created:
            slug = slugify(category_name, allow_unicode=True) or str(uuid.uuid4())[:8]
            orig_slug = slug
            counter = 1
            while Category.objects.filter(store=store, slug=slug).exists():
                slug = f"{orig_slug}-{counter}"
                counter += 1
            category.slug = slug
            category.save()
        arguments["category"] = category.id

    serializer = ProductSerializer(data=arguments, context={"store": store})
    if not serializer.is_valid():
        raise ToolError(f"Validation failed: {serializer.errors}")
        
    product = serializer.save()
    return ProductSerializer(product, context={"store": store}).data


@register_tool(
    name="update_product",
    description="Partially update an existing product in the store by its product_id.",
    input_schema={
        "type": "object",
        "properties": {
            "product_id": {
                "type": "string",
                "description": "The UUID of the product to update."
            },
            "title": {
                "type": "string",
                "description": "Updated title/name of the product."
            },
            "description": {
                "type": "string",
                "description": "Updated description."
            },
            "price": {
                "type": "number",
                "description": "Updated sale price."
            },
            "compare_price": {
                "type": "number",
                "description": "Updated comparison price."
            },
            "cost_price": {
                "type": "number",
                "description": "Updated cost price."
            },
            "stock_quantity": {
                "type": "integer",
                "description": "Updated stock quantity."
            },
            "status": {
                "type": "string",
                "enum": ["draft", "active", "archived"],
                "description": "Updated status."
            }
        },
        "required": ["product_id"]
    }
)
def update_product(store, arguments):
    product_id = arguments.pop("product_id")
    try:
        product = Product.objects.get(id=product_id, store=store)
    except Product.DoesNotExist:
        raise ToolError(f"Product with ID '{product_id}' not found.")

    serializer = ProductSerializer(product, data=arguments, partial=True, context={"store": store})
    if not serializer.is_valid():
        raise ToolError(f"Validation failed: {serializer.errors}")
        
    updated_product = serializer.save()
    return ProductSerializer(updated_product, context={"store": store}).data
