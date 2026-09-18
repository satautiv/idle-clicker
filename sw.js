// Cache-first service worker for this fully static site. CACHE_VERSION is a
// placeholder swapped for the deploy commit SHA by the CI `deploy` job (see
// .github/workflows/ci.yml) so every deploy gets its own cache name; the
// `activate` handler deletes any cache that doesn't match the current
// version, so returning visitors pick up new JS/CSS instead of being stuck
// on a stale cache indefinitely.
const CACHE_VERSION = 'dev';
const CACHE_NAME = `idle-clicker-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  'index.html',
  'manifest.json',
  'css/style.css',
  'js/game-lib.js',
  'js/game.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-512-maskable.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      });
    }).catch(() => caches.match('index.html'))
  );
});
