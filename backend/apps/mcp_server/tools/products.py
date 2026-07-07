from apps.products.models import Product, Category, ProductReview, ProductSection, ProductImage, ProductVariant, VariantOption
from apps.products.serializers import ProductSerializer, CategorySerializer, ProductImageSerializer, ProductVariantSerializer
from .registry import register_tool, ToolError
from django.utils.text import slugify
import uuid
import json

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
            },
            "enable_quantity_offers": {
                "type": "boolean",
                "description": "Whether quantity offers (discount tiers) are active for this product."
            },
            "quantity_offers": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "quantity": { "type": "integer", "description": "The threshold quantity." },
                        "price": { "type": "number", "description": "The discounted price per unit in DZD." },
                        "label": { "type": "string", "description": "Optional display label (e.g. 'Recommended')." }
                    },
                    "required": ["quantity", "price"]
                },
                "description": "List of quantity discount tiers."
            },
            "enable_bundle_offers": {
                "type": "boolean",
                "description": "Whether product bundle offers are active."
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
            },
            "enable_quantity_offers": {
                "type": "boolean",
                "description": "Whether quantity offers (discount tiers) are active for this product."
            },
            "quantity_offers": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "quantity": { "type": "integer", "description": "The threshold quantity." },
                        "price": { "type": "number", "description": "The discounted price per unit in DZD." },
                        "label": { "type": "string", "description": "Optional display label (e.g. 'Recommended')." }
                    },
                    "required": ["quantity", "price"]
                },
                "description": "List of quantity discount tiers."
            },
            "enable_bundle_offers": {
                "type": "boolean",
                "description": "Whether product bundle offers are active."
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


@register_tool(
    name="delete_product",
    description="Delete an existing product from the store by its UUID.",
    input_schema={
        "type": "object",
        "properties": {
            "product_id": {
                "type": "string",
                "description": "The exact UUID of the product to delete."
            }
        },
        "required": ["product_id"]
    }
)
def delete_product(store, arguments):
    product_id = arguments.get("product_id")
    try:
        product = Product.objects.get(id=product_id, store=store)
    except Product.DoesNotExist:
        raise ToolError(f"Product with ID '{product_id}' not found.")
        
    title = product.title
    product.delete()
    
    return {
        "message": f"Successfully deleted product '{title}' (ID: {product_id}).",
        "product_id": product_id,
        "title": title
    }


@register_tool(
    name="list_reviews",
    description="List product reviews for the store, optionally filtered by product_id and approval status.",
    input_schema={
        "type": "object",
        "properties": {
            "product_id": {
                "type": "string",
                "description": "Optional UUID of the product to filter reviews."
            },
            "is_approved": {
                "type": "boolean",
                "description": "Optional approval status filter."
            },
            "limit": {
                "type": "integer",
                "default": 20,
                "description": "Maximum number of reviews to return."
            },
            "offset": {
                "type": "integer",
                "default": 0,
                "description": "Number of reviews to skip."
            }
        }
    }
)
def list_reviews(store, arguments):
    product_id = arguments.get("product_id")
    is_approved = arguments.get("is_approved")
    limit = min(int(arguments.get("limit", 20)), 100)
    offset = max(int(arguments.get("offset", 0)), 0)
    
    qs = ProductReview.objects.filter(store=store).select_related('product')
    
    if product_id:
        qs = qs.filter(product_id=product_id)
        
    if is_approved is not None:
        qs = qs.filter(is_approved=is_approved)
        
    total_count = qs.count()
    reviews_page = qs[offset:offset+limit]
    
    reviews_data = []
    for r in reviews_page:
        reviews_data.append({
            "id": str(r.id),
            "product_id": str(r.product.id),
            "product_title": r.product.title,
            "reviewer_name": r.reviewer_name,
            "reviewer_city": r.reviewer_city,
            "rating": r.rating,
            "body": r.body,
            "photo_url": r.photo_url,
            "is_approved": r.is_approved,
            "created_at": r.created_at.strftime('%Y-%m-%d %H:%M:%S') if hasattr(r, 'created_at') and r.created_at else None
        })
        
    return {
        "reviews": reviews_data,
        "total_count": total_count,
        "limit": limit,
        "offset": offset
    }


@register_tool(
    name="approve_review",
    description="Approve or disapprove a customer review so it displays or hides on the storefront.",
    input_schema={
        "type": "object",
        "properties": {
            "review_id": {
                "type": "string",
                "description": "The exact UUID of the review to approve/disapprove."
            },
            "is_approved": {
                "type": "boolean",
                "description": "True to approve and show the review, False to reject/hide it."
            }
        },
        "required": ["review_id", "is_approved"]
    }
)
def approve_review(store, arguments):
    review_id = arguments.get("review_id")
    is_approved = arguments.get("is_approved")
    
    try:
        review = ProductReview.objects.get(id=review_id, store=store)
    except ProductReview.DoesNotExist:
        raise ToolError(f"Review with ID '{review_id}' not found.")
        
    review.is_approved = is_approved
    review.save()
    
    status_str = "approved" if is_approved else "disapproved"
    return {
        "message": f"Successfully {status_str} review by {review.reviewer_name} for product '{review.product.title}'.",
        "review_id": review_id,
        "is_approved": review.is_approved
    }


@register_tool(
    name="delete_review",
    description="Delete a customer product review from the database.",
    input_schema={
        "type": "object",
        "properties": {
            "review_id": {
                "type": "string",
                "description": "The exact UUID of the review to delete."
            }
        },
        "required": ["review_id"]
    }
)
def delete_review(store, arguments):
    review_id = arguments.get("review_id")
    
    try:
        review = ProductReview.objects.get(id=review_id, store=store)
    except ProductReview.DoesNotExist:
        raise ToolError(f"Review with ID '{review_id}' not found.")
        
    reviewer_name = review.reviewer_name
    product_title = review.product.title
    review.delete()
    
    return {
        "message": f"Successfully deleted review by {reviewer_name} for product '{product_title}'.",
        "review_id": review_id
    }


@register_tool(
    name="list_product_sections",
    description="List all layout/content sections configured for a specific product page.",
    input_schema={
        "type": "object",
        "properties": {
            "product_id": {
                "type": "string",
                "description": "The exact UUID of the product."
            }
        },
        "required": ["product_id"]
    }
)
def list_product_sections(store, arguments):
    product_id = arguments.get("product_id")
    try:
        product = Product.objects.get(id=product_id, store=store)
    except Product.DoesNotExist:
        raise ToolError(f"Product with ID '{product_id}' not found.")
        
    sections = ProductSection.objects.filter(product=product).order_by('order')
    
    sections_list = []
    for sec in sections:
        try:
            config_dict = json.loads(sec.config) if sec.config else {}
        except Exception:
            config_dict = {}
        sections_list.append({
            "id": str(sec.id),
            "section_type": sec.section_type,
            "order": sec.order,
            "config": config_dict
        })
        
    return {
        "product_id": product_id,
        "product_title": product.title,
        "sections": sections_list
    }


@register_tool(
    name="add_product_section",
    description="Add a new layout/content section to a product page.",
    input_schema={
        "type": "object",
        "properties": {
            "product_id": {
                "type": "string",
                "description": "The exact UUID of the product."
            },
            "section_type": {
                "type": "string",
                "description": "The type of the section (e.g. details, gallery, reviews, features, banner, accordion)."
            },
            "config": {
                "type": "object",
                "description": "JSON configuration object for this section."
            },
            "order": {
                "type": "integer",
                "default": 0,
                "description": "The display order position of this section."
            }
        },
        "required": ["product_id", "section_type", "config"]
    }
)
def add_product_section(store, arguments):
    product_id = arguments.get("product_id")
    section_type = arguments.get("section_type")
    config = arguments.get("config")
    order = int(arguments.get("order", 0))
    
    try:
        product = Product.objects.get(id=product_id, store=store)
    except Product.DoesNotExist:
        raise ToolError(f"Product with ID '{product_id}' not found.")
        
    config_json = json.dumps(config)
    sec = ProductSection.objects.create(
        product=product,
        section_type=section_type,
        config=config_json,
        order=order
    )
    
    return {
        "message": "Product section added successfully.",
        "id": str(sec.id),
        "section_type": sec.section_type,
        "order": sec.order,
        "config": config
    }


@register_tool(
    name="update_product_section",
    description="Update the configuration or order position of an existing product page section.",
    input_schema={
        "type": "object",
        "properties": {
            "section_id": {
                "type": "string",
                "description": "The exact UUID of the product section to update."
            },
            "config": {
                "type": "object",
                "description": "Updated configuration parameters."
            },
            "order": {
                "type": "integer",
                "description": "Updated display order position."
            }
        },
        "required": ["section_id"]
    }
)
def update_product_section(store, arguments):
    section_id = arguments.get("section_id")
    config = arguments.get("config")
    order = arguments.get("order")
    
    try:
        sec = ProductSection.objects.get(id=section_id, product__store=store)
    except ProductSection.DoesNotExist:
        raise ToolError(f"Product section with ID '{section_id}' not found.")
        
    if config is not None:
        sec.config = json.dumps(config)
    if order is not None:
        sec.order = int(order)
        
    sec.save()
    
    try:
        config_dict = json.loads(sec.config) if sec.config else {}
    except Exception:
        config_dict = {}
        
    return {
        "message": "Product section updated successfully.",
        "id": str(sec.id),
        "section_type": sec.section_type,
        "order": sec.order,
        "config": config_dict
    }


@register_tool(
    name="delete_product_section",
    description="Delete a layout/content section from a product page.",
    input_schema={
        "type": "object",
        "properties": {
            "section_id": {
                "type": "string",
                "description": "The exact UUID of the product section to delete."
            }
        },
        "required": ["section_id"]
    }
)
def delete_product_section(store, arguments):
    section_id = arguments.get("section_id")
    
    try:
        sec = ProductSection.objects.get(id=section_id, product__store=store)
    except ProductSection.DoesNotExist:
        raise ToolError(f"Product section with ID '{section_id}' not found.")
        
    section_type = sec.section_type
    sec.delete()
    
    return {
        "message": f"Successfully deleted product section of type '{section_type}'.",
        "section_id": section_id
    }


@register_tool(
    name="get_product",
    description="Retrieve details of a single product using either its product_id (UUID) or slug.",
    input_schema={
        "type": "object",
        "properties": {
            "product_id": {
                "type": "string",
                "description": "Optional UUID of the product."
            },
            "slug": {
                "type": "string",
                "description": "Optional URL slug of the product."
            }
        }
    }
)
def get_product(store, arguments):
    product_id = arguments.get("product_id")
    slug = arguments.get("slug")

    if not product_id and not slug:
        raise ToolError("You must provide either product_id or slug to retrieve a product.")

    try:
        if product_id:
            product = Product.objects.get(id=product_id, store=store)
        else:
            product = Product.objects.get(slug=slug, store=store)
    except Product.DoesNotExist:
        id_or_slug = product_id or slug
        raise ToolError(f"Product with identifier '{id_or_slug}' not found.")

    return ProductSerializer(product, context={"store": store}).data


@register_tool(
    name="list_categories",
    description="List all product categories in the store.",
    input_schema={
        "type": "object",
        "properties": {}
    }
)
def list_categories(store, arguments):
    categories = Category.objects.filter(store=store)
    return {
        "categories": CategorySerializer(categories, many=True).data
    }


@register_tool(
    name="create_category",
    description="Create a new product category in the store.",
    input_schema={
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "The name of the category."
            },
            "slug": {
                "type": "string",
                "description": "Optional unique slug. Generated from name if not provided."
            },
            "description": {
                "type": "string",
                "description": "Optional description of the category."
            },
            "image_url": {
                "type": "string",
                "description": "Optional image URL of the category."
            }
        },
        "required": ["name"]
    }
)
def create_category(store, arguments):
    name = arguments.get("name")
    slug = arguments.get("slug")
    description = arguments.get("description", "")
    image_url = arguments.get("image_url", "")

    if not slug:
        slug = slugify(name, allow_unicode=True) or str(uuid.uuid4())[:8]

    orig_slug = slug
    counter = 1
    while Category.objects.filter(store=store, slug=slug).exists():
        slug = f"{orig_slug}-{counter}"
        counter += 1

    category = Category.objects.create(
        store=store,
        name=name,
        slug=slug,
        description=description,
        image_url=image_url
    )
    return CategorySerializer(category).data


@register_tool(
    name="update_category",
    description="Update an existing category's details.",
    input_schema={
        "type": "object",
        "properties": {
            "category_id": {
                "type": "string",
                "description": "The exact UUID of the category to update."
            },
            "name": {
                "type": "string",
                "description": "Updated category name."
            },
            "slug": {
                "type": "string",
                "description": "Updated unique slug."
            },
            "description": {
                "type": "string",
                "description": "Updated description."
            },
            "image_url": {
                "type": "string",
                "description": "Updated image URL."
            },
            "is_active": {
                "type": "boolean",
                "description": "Whether the category is active."
            }
        },
        "required": ["category_id"]
    }
)
def update_category(store, arguments):
    category_id = arguments.pop("category_id")
    try:
        category = Category.objects.get(id=category_id, store=store)
    except Category.DoesNotExist:
        raise ToolError(f"Category with ID '{category_id}' not found.")

    for k, v in arguments.items():
        if k == 'slug' and v:
            orig_slug = v
            slug = v
            counter = 1
            while Category.objects.filter(store=store, slug=slug).exclude(id=category.id).exists():
                slug = f"{orig_slug}-{counter}"
                counter += 1
            category.slug = slug
        elif hasattr(category, k) and v is not None:
            setattr(category, k, v)

    category.save()
    return CategorySerializer(category).data


@register_tool(
    name="delete_category",
    description="Delete a product category from the database.",
    input_schema={
        "type": "object",
        "properties": {
            "category_id": {
                "type": "string",
                "description": "The exact UUID of the category to delete."
            }
        },
        "required": ["category_id"]
    }
)
def delete_category(store, arguments):
    category_id = arguments.get("category_id")
    try:
        category = Category.objects.get(id=category_id, store=store)
    except Category.DoesNotExist:
        raise ToolError(f"Category with ID '{category_id}' not found.")

    category_name = category.name
    category.delete()
    return {
        "message": f"Successfully deleted category '{category_name}'.",
        "category_id": category_id
    }


@register_tool(
    name="add_product_image",
    description="Add a new image to a product.",
    input_schema={
        "type": "object",
        "properties": {
            "product_id": {
                "type": "string",
                "description": "The UUID of the product."
            },
            "image_url": {
                "type": "string",
                "description": "The URL of the image."
            },
            "alt_text": {
                "type": "string",
                "default": "",
                "description": "Optional alternative text for SEO."
            },
            "is_primary": {
                "type": "boolean",
                "default": False,
                "description": "Whether this should be the main primary image of the product."
            }
        },
        "required": ["product_id", "image_url"]
    }
)
def add_product_image(store, arguments):
    product_id = arguments.get("product_id")
    image_url = arguments.get("image_url")
    alt_text = arguments.get("alt_text", "")
    is_primary = arguments.get("is_primary", False)

    try:
        product = Product.objects.get(id=product_id, store=store)
    except Product.DoesNotExist:
        raise ToolError(f"Product with ID '{product_id}' not found.")

    position = product.images.count()

    if is_primary:
        product.images.all().update(is_primary=False)

    img = ProductImage.objects.create(
        product=product,
        image_url=image_url,
        alt_text=alt_text,
        position=position,
        is_primary=is_primary
    )
    return ProductImageSerializer(img).data


@register_tool(
    name="add_product_variant",
    description="Create a new variant/SKU option for a product.",
    input_schema={
        "type": "object",
        "properties": {
            "product_id": {
                "type": "string",
                "description": "The UUID of the product."
            },
            "name": {
                "type": "string",
                "description": "The name/label of the variant (e.g. 'Large / Blue')."
            },
            "price": {
                "type": "number",
                "description": "The variant price."
            },
            "sku": {
                "type": "string",
                "description": "Optional SKU code."
            },
            "stock_quantity": {
                "type": "integer",
                "default": 100,
                "description": "The variant stock quantity."
            },
            "is_active": {
                "type": "boolean",
                "default": True,
                "description": "Whether this variant is active."
            }
        },
        "required": ["product_id", "name", "price"]
    }
)
def add_product_variant(store, arguments):
    product_id = arguments.get("product_id")
    name = arguments.get("name")
    price = arguments.get("price")
    sku = arguments.get("sku", "")
    stock_quantity = int(arguments.get("stock_quantity", 100))
    is_active = arguments.get("is_active", True)

    try:
        product = Product.objects.get(id=product_id, store=store)
    except Product.DoesNotExist:
        raise ToolError(f"Product with ID '{product_id}' not found.")

    variant = ProductVariant.objects.create(
        product=product,
        name=name,
        price=price,
        sku=sku,
        stock_quantity=stock_quantity,
        is_active=is_active
    )
    return ProductVariantSerializer(variant).data


@register_tool(
    name="update_product_variant",
    description="Update details of an existing product variant.",
    input_schema={
        "type": "object",
        "properties": {
            "variant_id": {
                "type": "string",
                "description": "The exact UUID of the product variant to update."
            },
            "name": {
                "type": "string",
                "description": "Updated variant name/label."
            },
            "price": {
                "type": "number",
                "description": "Updated price."
            },
            "sku": {
                "type": "string",
                "description": "Updated SKU."
            },
            "stock_quantity": {
                "type": "integer",
                "description": "Updated stock quantity."
            },
            "is_active": {
                "type": "boolean",
                "description": "Updated status."
            }
        },
        "required": ["variant_id"]
    }
)
def update_product_variant(store, arguments):
    variant_id = arguments.pop("variant_id")
    try:
        variant = ProductVariant.objects.get(id=variant_id, product__store=store)
    except ProductVariant.DoesNotExist:
        raise ToolError(f"Product variant with ID '{variant_id}' not found.")

    for k, v in arguments.items():
        if hasattr(variant, k) and v is not None:
            if k == 'stock_quantity':
                setattr(variant, k, int(v))
            else:
                setattr(variant, k, v)

    variant.save()
    return ProductVariantSerializer(variant).data


@register_tool(
    name="bulk_create_products",
    description="Create multiple products in batch for store setup.",
    input_schema={
        "type": "object",
        "properties": {
            "products": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "title": { "type": "string" },
                    "description": { "type": "string" },
                    "price": { "type": "number" },
                    "compare_price": { "type": "number" },
                    "cost_price": { "type": "number" },
                    "stock_quantity": { "type": "integer" },
                    "category_name": { "type": "string" },
                    "status": { "type": "string", "enum": ["draft", "active"] }
                  },
                  "required": ["title", "price"]
                }
            }
        },
        "required": ["products"]
    }
)
def bulk_create_products(store, arguments):
    products_data = arguments.get("products", [])
    created_products = []

    for product_args in products_data:
        category_name = product_args.pop("category_name", None)

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
            product_args["category"] = category.id

        # Make sure context has store
        serializer = ProductSerializer(data=product_args, context={"store": store})
        if serializer.is_valid():
            product = serializer.save()
            created_products.append(ProductSerializer(product, context={"store": store}).data)
        else:
            raise ToolError(f"Validation failed for product '{product_args.get('title')}': {serializer.errors}")

    return {
        "message": f"Successfully created {len(created_products)} products.",
        "products": created_products
    }

