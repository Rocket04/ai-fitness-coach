# PWA Manifest + Service Worker Setup

## When to Create
If `manifest.json` and/or `sw.js` are missing from the project root (or `public/`), the app cannot function as a PWA. The `index.html` typically references them directly.

## manifest.json
Place at `public/manifest.json` (or project root). Required fields:
- `name`, `short_name`
- `start_url`: `"/"`
- `display`: `"standalone"` (required for PWA installability)
- `background_color`, `theme_color`
- `icons`: at least 192x192 and 512x512 (PNG)

Use `templates/pwa-manifest.json` from this skill as a starter.

## sw.js
Place at `public/sw.js` (or project root). Must be at the root scope to control all pages.

### Recommended Strategy
1. **Install**: Pre-cache core shell assets (`index.html`, `css/styles.css`, `manifest.json`)
2. **Activate**: Delete old caches, claim clients immediately
3. **Fetch**:
   - Same-origin: cache-first, then network, cache successful responses
   - External (CDN/unpkg): stale-while-revalidate
   - Navigation requests: fallback to cached `index.html` when offline

### Service Worker Scope
`sw.js` at root controls all pages. If placed in a subdirectory, it only controls that subdirectory. The `index.html` registration path (`/sw.js` vs `sw.js`) matters — use absolute path.

## Pitfalls
- **sw.js 404 on CDN imports**: `sw.js` only caches what's in its scope. CDN resources (unpkg, esm.sh) need explicit handling in the fetch handler with the stale-while-revalidate branch.
- **Stale cache after updates**: Include a `CACHE_NAME` version string and increment it on every deploy. The activate handler deletes old caches.
- **importmap projects**: The app loads modules from CDN via `<script type="importmap">`. These are JS modules, not SW-pre-cacheable. They're handled by the fetch handler's CDN branch at runtime.
