# Service Worker Update Pattern

## Update Detection
The `useServiceWorkerUpdate` hook must:
1. Check `reg.waiting` on mount (for SWs already waiting)
2. Listen for `updatefound` → `statechange` events (for SWs that arrive later)
3. Post `SKIP_WAITING` message to activate the new SW
4. Reload page after new SW activates

## Update Banner
- Fixed position, top: 0, z-index: 3000
- Gradient background (accent color)
- "Update" button posts SKIP_WAITING → reload
- "Dismiss" button hides banner (reappears on next check)
- `slideDown` CSS animation on appear

## Message Handler in sw.js
```js
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

## Cache Strategy
- Same-origin: cache-first with background update
- CDN/external: stale-while-revalidate
- Skip source maps and opaque responses
- Versioned cache name: `fitcoach-v2`

## Vite Manifest Caching Quirk
After updating `public/manifest.json`, the hashed copy in `dist/assets/` may retain old content.
Fix: `rm -rf dist node_modules/.vite && npx vite build`
Always verify the hashed copy content, not just `dist/manifest.json`.
