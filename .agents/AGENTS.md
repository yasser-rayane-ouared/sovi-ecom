# Repository Guidelines & Rules

This project-scoped rules document outlines the core patterns and architectural constraints implemented to solve store logo, favicon, storefront routing, image loading, and subscription seeding issues. All future modifications must adhere to these rules.

## Frontend Development Rules

### 1. Dynamic Favicon Updates
- Do NOT omit `pathname` from the dependency array of any layout `useEffect` that updates the HTML tab favicon/icons links. Next.js resets head metadata on page navigation, so the favicon update must run on every route transition.

### 2. Logo and Image Error Handling
- Never use fragile DOM sibling traversal (like `e.currentTarget.nextSibling`) in `onError` handlers to toggle fallbacks. Indentation and whitespace in React's JSX render as `#text` nodes in the DOM, causing crashes.
- Always use standard state-based React variables (e.g. `logoError` state) to toggle image visibility and text fallbacks.

### 3. Storefront Image Rendering
- All storefront images (primary images, thumbnails, banners, review photos) must have their `src` and `href` properties wrapped in `getFullImageUrl()` to ensure correct path resolution across local development, custom domains, and production subdomains on Railway.

### 4. Storefront Preview Link Generation
- Always use `getAbsoluteStorefrontLink(subdomain, path, customDomain)` for dashboard storefront preview buttons (e.g., viewing live products, categories, or landing pages).
- Ensure `getAbsoluteStorefrontLink` routes Railway app domains (`railway.app`) via path-based routing (e.g., `https://maindomain.railway.app/store-subdomain/path`) to avoid SSL certificate errors caused by nested wildcards.

## Backend Development Rules

### 1. Auto-seeding of Subscription Plans
- All store validation, subscription limits, and storefront retrievals depend on an active subscription.
- Ensure that the subscription plans (`starter`, `pro`, `max`) are auto-seeded dynamically via `seed_default_plans_if_empty()` on store creation or limit check. This prevents storefronts from returning 404/unreachable errors due to missing plans in a fresh database.

### 2. Cities and Communes Fallbacks
- In `StorefrontCommunesView`, if no communes are found in the database for a selected wilaya (province), always auto-seed or generate a fallback default commune on-the-fly to prevent empty dropdowns on the storefront checkout form.

## Performance Rules

### 1. Parallel Storefront API Fetching (Frontend)
- **NEVER** use sequential `.then()` chaining for independent data fetches (store info, product, wilayas) on storefront pages. This creates a "waterfall" that multiplies load latency.
- **ALWAYS** use `Promise.all([...])` to fetch independent API resources simultaneously on the following pages:
  - `frontend/src/app/[store]/products/[slug]/page.tsx` — store, product, and wilayas must be fetched in parallel.
  - `frontend/src/app/[store]/checkout/page.tsx` — store and wilayas must be fetched in parallel.
  - `frontend/src/app/[store]/pages/[slug]/page.tsx` — store, pageData, and wilayas must be fetched in parallel.
- Any new storefront page that requires multiple independent API calls must also use `Promise.all`.

### 2. Backend Store Metadata Caching (Backend)
- `get_store_or_404(subdomain)` in `storefront_views.py` MUST check the Django cache before querying the database.
  - Cache key format: `storefront_store_<subdomain>` (lowercased).
  - Positive results (valid store) must be cached for **300 seconds** (5 minutes).
  - Negative results (no store, inactive, no subscription) must be cached for **60 seconds** (1 minute) using `False` as the sentinel value.
- `Store.save()` and `StoreSettings.save()` MUST delete the cache keys for their subdomain and custom_domain on every save, so merchant changes take effect immediately.
- Do NOT remove the `cache.get()` / `cache.set()` / `cache.delete()` calls from these methods.
