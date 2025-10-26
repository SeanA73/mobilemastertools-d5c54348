const CACHE_NAME = 'mobiletoolsbox-v1.0.0';
const STATIC_CACHE_NAME = 'mobiletoolsbox-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'mobiletoolsbox-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/app',
  '/manifest.json',
  // Add other static assets as needed
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/user',
  '/api/todos',
  '/api/notes',
  '/api/habits',
  '/api/flashcard-decks',
  '/api/voice-recordings'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE_NAME);
        console.log('Service Worker: Caching static assets');
        await cache.addAll(STATIC_ASSETS);
        console.log('Service Worker: Static assets cached');
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('Service Worker: Failed to cache static assets', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames
          .filter(name => 
            name.startsWith('mobiletoolsbox-') && 
            name !== STATIC_CACHE_NAME && 
            name !== DYNAMIC_CACHE_NAME
          )
          .map(name => {
            console.log(`Service Worker: Deleting old cache ${name}`);
            return caches.delete(name);
          });
        
        await Promise.all(deletePromises);
        console.log('Service Worker: Old caches cleaned up');
        
        // Take control of all clients immediately
        self.clients.claim();
      } catch (error) {
        console.error('Service Worker: Failed to clean up old caches', error);
      }
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests
  if (request.url.includes('/api/')) {
    // API requests - Network First strategy
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'document') {
    // HTML requests - Network First with cache fallback
    event.respondWith(handleDocumentRequest(request));
  } else {
    // Static assets - Cache First strategy
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle API requests with Network First strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const shouldCache = CACHEABLE_APIs.some(api => url.pathname.startsWith(api));
  
  try {
    // Always try network first for API requests
    const networkResponse = await fetch(request);
    
    // Cache successful GET responses
    if (shouldCache && networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for API request, trying cache');
    
    // If network fails, try to serve from cache
    if (shouldCache) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        // Add a header to indicate this is from cache
        const response = cachedResponse.clone();
        response.headers.set('X-Served-By', 'sw-cache');
        return response;
      }
    }
    
    // Return a meaningful error response
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable', 
        message: 'Please check your internet connection and try again.' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle document requests with Network First strategy
async function handleDocumentRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for document, trying cache');
    
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, try to serve the main app shell
    const appShell = await caches.match('/app');
    if (appShell) {
      return appShell;
    }
    
    // Last resort - return a basic offline page
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>MobileToolsBox - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0; 
              background: #f8fafc;
              color: #0f172a;
            }
            .container { text-align: center; max-width: 400px; padding: 2rem; }
            .icon { font-size: 4rem; margin-bottom: 1rem; }
            h1 { margin-bottom: 1rem; color: #2563eb; }
            p { margin-bottom: 2rem; line-height: 1.6; }
            button { 
              background: #2563eb; 
              color: white; 
              border: none; 
              padding: 0.75rem 1.5rem; 
              border-radius: 0.5rem; 
              cursor: pointer;
              font-size: 1rem;
            }
            button:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📱</div>
            <h1>You're Offline</h1>
            <p>MobileToolsBox is currently unavailable. Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Handle static requests with Cache First strategy
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset', request.url);
    
    // For images, return a placeholder
    if (request.destination === 'image') {
      return new Response(
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect width="200" height="200" fill="#f1f5f9"/>
          <text x="100" y="100" text-anchor="middle" dy="0.3em" fill="#64748b" font-family="sans-serif" font-size="14">
            Image unavailable
          </text>
        </svg>`,
        { 
          headers: { 'Content-Type': 'image/svg+xml' } 
        }
      );
    }
    
    throw error;
  }
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    // Get pending actions from IndexedDB or localStorage
    // This would typically involve syncing offline changes
    console.log('Service Worker: Processing background sync');
    
    // Example: Sync offline todo changes
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data),
          credentials: 'include'
        });
        
        // Remove successfully synced action
        await removePendingAction(action.id);
      } catch (error) {
        console.error('Service Worker: Failed to sync action', action, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Utility functions for background sync
async function getPendingActions() {
  // In a real implementation, this would read from IndexedDB
  // For now, return empty array
  return [];
}

async function removePendingAction(id) {
  // In a real implementation, this would remove from IndexedDB
  console.log('Service Worker: Removing pending action', id);
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  let notificationData = {
    title: 'MobileToolsBox',
    body: 'You have a new notification',
    icon: '/manifest.json',
    badge: '/manifest.json',
    data: { url: '/app' }
  };
  
  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (error) {
      console.error('Service Worker: Failed to parse push data', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      actions: [
        {
          action: 'open',
          title: 'Open App'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/app';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If app is not open, open it
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle share target
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic background sync (for browsers that support it)
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync triggered', event.tag);
  
  if (event.tag === 'content-sync') {
    event.waitUntil(handlePeriodicSync());
  }
});

async function handlePeriodicSync() {
  try {
    console.log('Service Worker: Processing periodic sync');
    
    // Example: Sync user data periodically
    const response = await fetch('/api/user', { credentials: 'include' });
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put('/api/user', response.clone());
    }
  } catch (error) {
    console.error('Service Worker: Periodic sync failed', error);
  }
}

console.log('Service Worker: Script loaded');
