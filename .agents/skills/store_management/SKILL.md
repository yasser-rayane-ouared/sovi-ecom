---
name: Store Customization & Setup
description: Assists in modifying store details, creating and editing products, setting up landing pages and page sections, and adjusting theme settings.
---

# Store Customization & Setup Skill Guide

This skill guide provides the necessary knowledge and tools reference to perform store customizations, design optimization, and catalog management for the Sovi e-commerce platform.

---

## 1. Product Catalog Management

### Product Creation and Editing
*   **Listing Products:** Use `list_products` to review current items. Always double-check existing SKUs and titles to avoid duplicate creations.
*   **Creating Products:** Use `create_product`. Ensure:
    *   `title` is descriptive (under 80 characters for optimal rendering).
    *   `price` is defined correctly. For discount structures, set `compare_price` higher than `price`.
    *   `status` defaults to `draft` so the merchant can review details before publishing.
    *   `track_inventory`: If set to `true`, ensure a valid `stock_quantity` is defined.

### Optimized Layout Structures
*   Sovi landing pages are built using modular section blocks (configured in `ProductSection`).
*   **Conversion-Optimized Layout Flow:**
    1.  **Header:** Clean, lightweight navigation.
    2.  **Hero Block:** Rich graphic header with a bold visual headline and sub-headline.
    3.  **Features Block:** Illustrates primary product benefits.
    4.  **Before/After Slider:** Crucial for cosmetic, skin care, or home cleaning products.
    5.  **Quantity Offers / Bundles:** Incentivizes higher average order value (e.g., *"Buy 2, Get 1 Free"*).
    6.  **Checkout Form:** Embedded order form at the bottom to maximize convenience.

---

## 2. Store Theme & Layout Customization

### Editing Themes
*   Use `get_theme_settings` to retrieve the current visual configurations.
*   Use `update_theme_settings` to adjust styling properties.
*   **Branding Guidelines:**
    *   **Cairo Font:** Used by default for Arabic elements. Make sure typography aligns correctly (Arabic reads RTL; French/English read LTR).
    *   Avoid plain/generic HTML colors. Use luxury palettes (e.g., deep amber `#d97706`, elegant green `#047857`, and modern slate accents).
    *   Keep mobile grids responsive. Always favor stacked grids (`grid-cols-1 sm:grid-cols-2`) on mobile layout settings.
