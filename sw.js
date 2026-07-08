// Malaysia 2026 dashboard — service worker
// Own files: network-first (updates arrive promptly), cached copy as offline fallback.
// CDN assets (Leaflet, fonts): cache-first (they're versioned and never change).
// API calls (script.google.com, tiles, nominatim, fx rates) are NOT intercepted.
const CACHE = 'my2026-v1';

self.addEventListener('install', e => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if (url.origin === location.origin) {
    // network-first for our own files
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request))
    );
  } else if (url.hostname === 'unpkg.com' || url.hostname.startsWith('fonts.g')) {
    // cache-first for immutable CDN assets
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }))
    );
  }
  // everything else (Apps Script API, OSM tiles, nominatim, fx rates): default network
});
