// sw.js
const CACHE_NAME = 'sabungero-idle-game';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Just open cache, don't pre-cache specific files
      console.log('Cache ready');
      return;
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If found in cache, return it
        if (response) {
          return response;
        }

        // Otherwise fetch from network, then cache it
        return fetch(event.request).then(response => {
          // Don't cache non-successful responses or non-HTTP/HTTPS
          if (!response || response.status !== 200 || !response.url.startsWith('http')) {
            return response;
          }

          // Cache the new response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});