self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('gsc-exporter').then((cache) => cache.addAll([
      '/',
      '/index.html',
      // Add other assets if needed
    ]))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
