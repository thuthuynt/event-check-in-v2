// Service Worker for cache management and app updates
const CACHE_NAME = 'event-checkin-v1.0.0';
const API_CACHE_NAME = 'event-checkin-api-v1.0.0';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        // Cache each URL individually to handle failures gracefully
        return Promise.allSettled(
          STATIC_CACHE_URLS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return null; // Continue with other URLs even if one fails
            })
          )
        );
      })
      .then((results) => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`Caching complete: ${successful} successful, ${failed} failed`);
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker installation failed:', error);
        // Still skip waiting even if caching fails
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests with cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  try {
    const url = new URL(request.url);

    // Handle API requests with network-first strategy
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            // Only cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(API_CACHE_NAME).then((cache) => {
                cache.put(request, responseClone).catch(err => {
                  console.warn('Failed to cache API response:', err);
                });
              });
            }
            return response;
          })
          .catch((error) => {
            console.warn('Network request failed, trying cache:', error);
            // If network fails, try to serve from cache
            return caches.match(request).then((response) => {
              if (response) {
                return response;
              }
              // Return a fallback response for API failures
              return new Response(
                JSON.stringify({ error: 'Network unavailable' }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
              );
            });
          })
      );
      return;
    }

    // Handle static assets with cache-first strategy
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          // If not in cache, fetch from network
          return fetch(request).then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache).catch(err => {
                console.warn('Failed to cache static asset:', err);
              });
            });

            return response;
          }).catch((error) => {
            console.warn('Failed to fetch static asset:', error);
            // Return a basic fallback for static assets
            return new Response('Asset not available', { status: 404 });
          });
        })
        .catch((error) => {
          console.warn('Cache match failed:', error);
          // Fallback to network request
          return fetch(request).catch(() => {
            return new Response('Resource not available', { status: 404 });
          });
        })
    );
  } catch (error) {
    console.error('Service Worker fetch error:', error);
    // Let the browser handle the request normally
    return;
  }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any pending offline actions
  console.log('Performing background sync...');
}