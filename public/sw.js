const CACHE_VERSION = 'rc-webapp-v2026-09-21-pwa2';

// On localhost/development, immediately unregister service worker and purge all cache
if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.claim())
    );
  });
}

const PRECACHE_URLS = [
  '/manifest.json',
  '/favicon.svg',
  '/offline.html',
];
const STATIC_ASSET_RE = /\.(?:js|css|png|svg|ico|webp|avif|woff2?|wasm)$/i;

async function addUrls(cache, urls) {
  await Promise.allSettled(urls.map((url) => cache.add(url)));
}

self.addEventListener('install', (event) => {
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') return;
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => addUrls(cache, PRECACHE_URLS)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          return (
            await caches.match(request)
          ) || (
            await caches.match('/offline.html')
          ) || new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        if (url.pathname.startsWith('/_next/static/') || STATIC_ASSET_RE.test(url.pathname)) {
          fetch(request)
            .then((response) => {
              if (response.ok) {
                caches.open(CACHE_VERSION).then((cache) => cache.put(request, response));
              }
            })
            .catch(() => {});
        }
        return cached;
      }
      return fetch(request).then((response) => {
        if (response.ok && (url.pathname.startsWith('/_next/static/') || STATIC_ASSET_RE.test(url.pathname))) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
