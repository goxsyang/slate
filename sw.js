const CACHE_NAME = 'slate-v12';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];
// Google Identity Services script: cached so sign-in still works on a flaky
// connection, but refreshed in the background whenever the network allows.
const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';

// Install: cache all core assets, bypassing the HTTP cache so a new
// service worker always ships the freshest build.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS.map(u => new Request(u, {cache: 'reload'}))))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function cachePut(request, response) {
  // Opaque responses (no-cors script loads) report status 0 but are still usable.
  if (!response || !(response.ok || response.type === 'opaque')) return;
  const clone = response.clone();
  caches.open(CACHE_NAME).then(cache => cache.put(request, clone)).catch(() => {});
}

// Serve from cache immediately, refresh the cache in the background.
function staleWhileRevalidate(request, fallbackUrl) {
  return caches.match(request).then(cached => {
    const network = fetch(request).then(resp => { cachePut(request, resp); return resp; });
    if (cached) { network.catch(() => {}); return cached; }
    return network.catch(() => fallbackUrl ? caches.match(fallbackUrl) : undefined);
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (!sameOrigin) {
    // Google Drive / OAuth API calls must never be served from cache:
    // stale responses would show old backup lists or "valid" expired tokens.
    if (req.url.startsWith(GIS_SCRIPT)) e.respondWith(staleWhileRevalidate(req));
    return;
  }

  // App shell: instant from cache, silently updated for the next launch.
  if (req.mode === 'navigate') {
    e.respondWith(staleWhileRevalidate(req, './index.html'));
    return;
  }

  // Other same-origin assets: cache-first, fallback to network.
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(resp => { cachePut(req, resp); return resp; });
    })
  );
});
