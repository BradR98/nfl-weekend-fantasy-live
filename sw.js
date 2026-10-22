const CACHE_NAME = 'weekend-warrior-pwa-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './pwa-192x192.png',
  './pwa-512x512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only handle same-origin requests; let browser handle cross-origin APIs/fonts directly
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-first with offline cache fallback for app shell & static assets
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const fallbackNav = await caches.match('./index.html') || await caches.match('./');
          if (fallbackNav) return fallbackNav;
        }
        return Response.error();
      })
  );
});
