const CACHE_NAME = 'vendra-cache-v1';

// Install event - fires when the service worker is registered
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  self.skipWaiting();
});

// Activate event - fires when the service worker takes control
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(clients.claim());
});

// Fetch event - intercepts all network requests
self.addEventListener('fetch', (event) => {
  // Pass-through fetch to satisfy PWA requirements.
  // If the network fails, we gracefully return a 503 response 
  // instead of the browser's default "offline dinosaur" page.
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response(
        'You are currently offline. Please check your network connection and try again.', 
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain',
          }),
        }
      );
    })
  );
});
