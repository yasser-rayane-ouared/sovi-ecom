---
name: Storefront Conversion & Analytics Integration
description: Guides integrating tracking pixels (Facebook/TikTok/Snapchat), managing Conversions API (CAPI) events, configuring Google Sheets sync, setting up high-converting product copies, and providing analytics.
---

# Storefront Conversion & Analytics Integration Guide

This guide details how to help merchants maximize their sales conversion rates, set up ad tracking (Pixels/CAPI), and generate/analyze store performance stats.

---

## 1. Pixel and Conversions API (CAPI) Tracking

### Meta CAPI Payload Matching
To maximize the Meta Event Match Quality Score (aiming for 8.5+ out of 10), CAPI events must send enriched, hashed user details.
*   **Browser/Server Deduplication:** Always ensure the browser pixel event and the server-side Conversions API event carry the exact same `event_id` payload.
*   **Hashed Parameters Checklist:**
    *   `ph`: Hashed Phone Number (always normalized to standard Algerian format: prepend country code `213` and drop leading `0`).
    *   `fn`: Hashed First Name.
    *   `ln`: Hashed Last Name.
    *   `ct`: Hashed City (Wilaya name in Arabic or French).
    *   `st`: Hashed State/Province (Wilaya name).
    *   `country`: Hashed country (always `dz` for Algerian stores).

### Pixel Management
*   Pixels can be set globally (whole storefront) or customized to trigger only on specific product pages.
*   Support Platforms: `meta` (Meta/Facebook), `tiktok` (TikTok Pixel), `snapchat` (Snapchat Pixel).

---

## 2. Marketing & Sales Conversion Copywriting

### Copywriting Hooks & Branding
*   **The Hook:** Start landing pages with a clear pain-point resolution (e.g., *"Say goodbye to back pain while sleeping"*).
*   **Urgency & Trust Elements:**
    *   Incorporate trust badges (e.g., *Free delivery in Algiers*, *Cash on delivery in 58 Wilayas*, *100% money back guarantee*).
    *   Include bundle offers with automatic pricing calculations.
*   **Pre-Submit Lead Capture:**
    *   Explain to merchants how Sovi automatically captures customer phone numbers the moment they enter them in the form—even if they abandon checkout. This data is stored as an **Abandoned Lead** to allow immediate follow-ups.

---

## 3. Analytics & Statistics
*   Explain the order conversion funnel to merchants:
    `Landings -> ViewContent -> InitiateCheckout (Lead) -> Purchase (COD Order) -> Delivered`
*   Assess Wilaya-specific performance. Help merchants determine which Algerian Wilayas yield the highest delivery ratios so they can optimize ad target locations.
