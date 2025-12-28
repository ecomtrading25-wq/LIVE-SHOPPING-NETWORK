// Advanced Service Worker for Live Shopping Network
// Version: 2.0.0
// Features: Offline support, advanced caching, push notifications, background sync

const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// API endpoints to cache
const CACHEABLE_API_PATTERNS = [
  /\/api\/trpc\/products/,
  /\/api\/trpc\/categories/,
  /\/api\/trpc\/liveStreaming\.listShows/
];

// Maximum cache sizes
const MAX_CACHE_SIZE = {
  [DYNAMIC_CACHE]: 50,
  [IMAGE_CACHE]: 100,
  [API_CACHE]: 30
};

// Cache duration in milliseconds
const CACHE_DURATION = {
  static: 7 * 24 * 60 * 60 * 1000, // 7 days
  dynamic: 24 * 60 * 60 * 1000, // 1 day
  api: 5 * 60 * 1000, // 5 minutes
  images: 30 * 24 * 60 * 60 * 1000 // 30 days
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE && 
                cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Check if request is for an image
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(request.url);
}

// Check if request is for API
function isAPIRequest(request) {
  return request.url.includes('/api/') || 
         CACHEABLE_API_PATTERNS.some(pattern => pattern.test(request.url));
}

// Check if request is for static asset
function isStaticAsset(request) {
  return request.url.includes('/assets/') ||
         /\.(js|css|woff|woff2|ttf|eot)$/i.test(request.url);
}

// Handle image requests - Cache first, then network
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request);
    
    if (cached && !isCacheExpired(cached, CACHE_DURATION.images)) {
      return cached;
    }

    const response = await fetch(request);
    
    if (response.ok) {
      await limitCacheSize(IMAGE_CACHE, MAX_CACHE_SIZE[IMAGE_CACHE]);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Image request failed:', error);
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Return placeholder image
    return new Response(
      '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#1a0b2e"/><text x="50%" y="50%" text-anchor="middle" fill="#9333ea" font-size="20">Image Unavailable</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Handle API requests - Network first, then cache
async function handleAPIRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      await limitCacheSize(API_CACHE, MAX_CACHE_SIZE[API_CACHE]);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] API request failed, trying cache:', error);
    const cached = await caches.match(request);
    
    if (cached && !isCacheExpired(cached, CACHE_DURATION.api)) {
      return cached;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'No internet connection' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static asset requests - Cache first, then network
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached && !isCacheExpired(cached, CACHE_DURATION.static)) {
      return cached;
    }

    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Static request failed:', error);
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Handle dynamic requests - Network first, then cache, then offline
async function handleDynamicRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await limitCacheSize(DYNAMIC_CACHE, MAX_CACHE_SIZE[DYNAMIC_CACHE]);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Dynamic request failed:', error);
    const cached = await caches.match(request);
    
    if (cached && !isCacheExpired(cached, CACHE_DURATION.dynamic)) {
      return cached;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) return offlinePage;
    }
    
    throw error;
  }
}

// Check if cached response is expired
function isCacheExpired(response, maxAge) {
  const cachedDate = response.headers.get('sw-cached-date');
  if (!cachedDate) return false;
  
  const age = Date.now() - parseInt(cachedDate);
  return age > maxAge;
}

// Limit cache size by removing oldest entries
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
    console.log(`[SW] Trimmed ${cacheName} cache from ${keys.length} to ${maxSize} entries`);
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'Live Shopping Network',
    body: 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'default',
    requireInteraction: false
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    requireInteraction: data.requireInteraction,
    data: data.data || {},
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' }
    ],
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  } else if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  } else if (event.tag === 'sync-wishlist') {
    event.waitUntil(syncWishlist());
  }
});

// Sync cart data
async function syncCart() {
  try {
    console.log('[SW] Syncing cart data...');
    // Implementation would sync cart with server
    return true;
  } catch (error) {
    console.error('[SW] Cart sync failed:', error);
    throw error;
  }
}

// Sync orders data
async function syncOrders() {
  try {
    console.log('[SW] Syncing orders data...');
    // Implementation would sync orders with server
    return true;
  } catch (error) {
    console.error('[SW] Orders sync failed:', error);
    throw error;
  }
}

// Sync wishlist data
async function syncWishlist() {
  try {
    console.log('[SW] Syncing wishlist data...');
    // Implementation would sync wishlist with server
    return true;
  } catch (error) {
    console.error('[SW] Wishlist sync failed:', error);
    throw error;
  }
}

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  } else if (event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
      })
    );
  }
});

// Get total cache size
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    totalSize += keys.length;
  }
  
  return totalSize;
}

console.log('[SW] Service worker script loaded');
