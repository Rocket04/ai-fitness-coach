// sw.js
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');

if (workbox) {
  console.log('Workbox загрузился, чувак 🚀');

  // Предварительное кэширование критически важных ресурсов
  workbox.precaching.precacheAndRoute([
    { url: '/', revision: null },
    { url: '/index.html', revision: null },
    { url: '/css/styles.css', revision: null },
    { url: '/js/app.js', revision: null }
  ]);

  // Стратегия NetworkFirst для наших файлов (HTML, CSS, JS)
  workbox.routing.registerRoute(
    ({ url }) => url.origin === self.location.origin &&
                 (url.pathname.endsWith('.html') ||
                  url.pathname.endsWith('.css') ||
                  url.pathname.endsWith('.js')),
    new workbox.strategies.NetworkFirst({
      cacheName: 'local-resources',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
        })
      ]
    })
  );

  // Стратегия CacheFirst для CDN‑библиотек (React, Dexie, Babel и т.д.)
  workbox.routing.registerRoute(
    ({ url }) => url.hostname.includes('cdn') ||
                 url.hostname.includes('unpkg.com') ||
                 url.hostname.includes('cdnjs.cloudflare.com'),
    new workbox.strategies.CacheFirst({
      cacheName: 'cdn-resources',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 60 * 24 * 60 * 60, // 60 дней
        })
      ]
    })
  );

  // Стратегия StaleWhileRevalidate для манифеста и иконок
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.endsWith('.json') ||
                 url.pathname.endsWith('.png') ||
                 url.pathname.endsWith('.ico') ||
                 url.pathname.endsWith('.svg'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'assets-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
        })
      ]
    })
  );

  // Обработчик установки Service Worker
  self.addEventListener('install', (event) => {
    self.skipWaiting(); // активировать новый SW сразу
    console.log('СВ установлен, бро 💪');
  });

  // Обработчик активации
  self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
    console.log('СВ активирован, lets go!');
  });
} else {
  console.error('Ой, Workbox не загрузился 😢');
}
