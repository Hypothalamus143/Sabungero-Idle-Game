// sw.js - Simple cache-first strategy
const CACHE_NAME = 'sabungero-idle-game';

self.addEventListener('install', event => {
    self.skipWaiting();
    console.log('✅ SW installed');
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
    console.log('✅ SW activated');
});

// In sw.js - replace your fetch event with this
self.addEventListener('fetch', event => {
    const url = event.request.url;
    
    // Log EVERY request
    console.log('🔍 SW intercepting:', url);
    
    // Don't handle non-GET requests
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        (async () => {
            // Try cache first
            const cachedResponse = await caches.match(event.request);
            
            if (cachedResponse) {
                console.log('✅ SW serving from cache:', url);
                return cachedResponse;
            }
            
            console.log('❌ SW cache miss:', url);
            
            // Try network as fallback
            try {
                const networkResponse = await fetch(event.request);
                console.log('🌐 SW serving from network:', url);
                return networkResponse;
            } catch (error) {
                console.log('💥 SW offline, no cache for:', url);
                // Return a better error response
                if (url.endsWith('.js')) {
                    return new Response('console.log("Script offline: ' + url + '")', {
                        headers: { 'Content-Type': 'application/javascript' }
                    });
                }
                return new Response('Offline - ' + url, { status: 408 });
            }
        })()
    );
});