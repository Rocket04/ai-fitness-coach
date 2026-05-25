// public/sw.js — Service Worker for Smart Fitness Coach PWA
// Precaches all critical assets, handles updates, provides offline fallback

const CACHE_VERSION = 'v2';
const CACHE_NAME = `fitcoach-${CACHE_VERSION}`;
const FALLBACK_HTML = '/index.html';

// ── Message handling ────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim();
  }
});

// ── Install: skip waiting to activate immediately ───────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  // Note: We don't pre-cache here because the build output has hashed filenames.
  // Instead, we use runtime caching on first fetch.
  // The / and /index.html are cached by the browser's normal SW interception.
});

// ── Activate: clean old caches and claim clients ────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key.startsWith('fitcoach-'))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for same-origin, stale-while-revalidate for CDN ─
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip non-essential requests (source maps, dev-only)
  if (url.pathname.endsWith('.map')) return;

  // Same-origin: cache-first with background update
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // External (CDN / unpkg / fonts.gstatic) — stale-while-revalidate
  if (
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com')
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // All other cross-origin: network-only (analytics, etc.)
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Update cache in background for next time
    fetchAndCache(request).catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    await putInCache(request, response);
    return response;
  } catch (err) {
    // Offline fallback for navigation requests
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
      const fallback = await caches.match(FALLBACK_HTML);
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetchAndCache(request).catch(() => cached);

  return cached || fetchPromise;
}

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response.ok && response.status === 200) {
    await putInCache(request, response);
  }
  return response;
}

async function putInCache(request, response) {
  // Only cache GET responses with ok status
  if (request.method !== 'GET' || !response.ok) return;

  // Don't cache opaque responses (CORS without headers)
  if (response.type === 'opaque') return;

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}
