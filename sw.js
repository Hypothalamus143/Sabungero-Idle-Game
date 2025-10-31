const CACHE_NAME = 'sabungero-idle-game';
const BOOTSTRAP_FILES = [
  '/',
  '/index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(BOOTSTRAP_FILES))
  );
});

// sw.js - Update your fetch event
self.addEventListener('fetch', event => {
  const cacheName = 'sabungero-idle-game';
  
  // For critical files: always try network first, then cache
  if (event.request.url.includes('/index.html') || 
      event.request.url === self.location.origin + '/') {
    
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Update cache with fresh version
          caches.open(cacheName).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() => {
          // If network fails, use cached version
          return caches.match(event.request);
        })
    );
    return;
  }

  // For everything else: cache first
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});