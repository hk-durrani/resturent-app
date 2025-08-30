// Service Worker for Bella Vista Restaurant PWA
const CACHE_NAME = 'bella-vista-v1.0.0';
const STATIC_CACHE = 'bella-vista-static-v1.0.0';
const DYNAMIC_CACHE = 'bella-vista-dynamic-v1.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/menu.html',
  '/cart.html',
  '/order.html',
  '/contact.html',
  '/confirmation.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/app.js',
  '/js/cart.js',
  '/js/menu.js',
  '/js/order.js',
  '/js/contact.js',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  // External CDN assets
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/feather-icons/4.29.0/feather.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/feather-icons/4.29.0/feather.min.js'
];

// Dynamic assets to cache on demand (images, etc.)
const DYNAMIC_ASSETS = [
  // Menu item images will be cached dynamically
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (request.method === 'GET') {
    // Check if it's a navigation request
    if (request.mode === 'navigate') {
      event.respondWith(handleNavigationRequest(request));
    }
    // Handle static assets
    else if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
      event.respondWith(handleStaticAssetRequest(request));
    }
    // Handle dynamic content (images, etc.)
    else if (request.url.includes('pixabay.com') || request.url.includes('images')) {
      event.respondWith(handleDynamicAssetRequest(request));
    }
    // Handle API requests
    else if (request.url.includes('/api/')) {
      event.respondWith(handleApiRequest(request));
    }
    // Default handling for other requests
    else {
      event.respondWith(handleDefaultRequest(request));
    }
  }
});

// Handle navigation requests (HTML pages)
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // If network fails, serve from cache
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If specific page not cached, serve index.html
    return cache.match('/index.html') || cache.match('/');
  }
}

// Handle static assets (CSS, JS, fonts)
async function handleStaticAssetRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Handle dynamic assets (images)
async function handleDynamicAssetRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful responses
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch dynamic asset:', request.url);
    
    // Return a fallback image or error response
    return new Response('Image not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle API requests
async function handleApiRequest(request) {
  try {
    // Always try network first for API requests
    const networkResponse = await fetch(request);
    
    // Cache successful GET requests
    if (request.method === 'GET' && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // For GET requests, try to serve from cache
    if (request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline response for failed API requests
    return new Response(JSON.stringify({
      error: 'Service unavailable offline',
      offline: true
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Default request handling
async function handleDefaultRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background sync for offline orders (if supported)
self.addEventListener('sync', event => {
  if (event.tag === 'offline-order') {
    event.waitUntil(syncOfflineOrders());
  }
});

async function syncOfflineOrders() {
  try {
    // Get offline orders from IndexedDB or localStorage
    const offlineOrders = await getOfflineOrders();
    
    for (const order of offlineOrders) {
      try {
        // Try to submit the order
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(order)
        });
        
        if (response.ok) {
          // Remove successfully submitted order
          await removeOfflineOrder(order.id);
          console.log('Offline order submitted successfully:', order.id);
        }
      } catch (error) {
        console.error('Failed to submit offline order:', order.id, error);
      }
    }
  } catch (error) {
    console.error('Error syncing offline orders:', error);
  }
}

// Helper functions for offline order management
async function getOfflineOrders() {
  // In a real app, this would use IndexedDB
  // For now, return empty array
  return [];
}

async function removeOfflineOrder(orderId) {
  // Remove order from offline storage
  console.log('Removing offline order:', orderId);
}

// Push notification handling
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Your order status has been updated!',
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Order',
        icon: '/icons/icon-192.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192.svg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Bella Vista Restaurant', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app to view order
    event.waitUntil(
      clients.openWindow('/cart.html')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'menu-update') {
    event.waitUntil(updateMenuCache());
  }
});

async function updateMenuCache() {
  try {
    // Update menu data in cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const menuResponse = await fetch('/api/menu');
    
    if (menuResponse.ok) {
      await cache.put('/api/menu', menuResponse);
      console.log('Menu cache updated');
    }
  } catch (error) {
    console.error('Failed to update menu cache:', error);
  }
}
