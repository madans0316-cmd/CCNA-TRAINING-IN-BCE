/* ==========================================================================
   CCNA PROGRAM BCE - SERVICE WORKER
   Enables offline capabilities, resource caching, and premium PWA experience.
   ========================================================================== */

const CACHE_NAME = 'ccna-program-bce-cache-v1';

// Static resources to cache immediately on installation
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/assets/logo.png',
  '/assets/college_logo.png',
  '/assets/hero.png',
  '/assets/coordinator.png',
  '/assets/badge.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  // Third-party CDN scripts & fonts
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap'
];

// Installation event: cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching application shell...');
        return cache.addAll(PRECACHE_RESOURCES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation event: clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: intercept requests and serve from cache or network
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass caching for backend API requests to ensure real-time submissions
  if (requestUrl.pathname.startsWith('/api/')) {
    // API calls should always go to the network
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If offline, return a structured JSON response indicating offline status
          return new Response(
            JSON.stringify({
              success: false,
              error: 'You are currently offline. Please connect to the internet to submit details.',
              code: 'OFFLINE'
            }),
            {
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Caching strategy: Cache First, falling back to Network for static shell assets
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached resource immediately
          return cachedResponse;
        }

        // Otherwise, fetch from the network
        return fetch(event.request)
          .then((networkResponse) => {
            // Check if response is valid
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone and cache newly fetched static resources (e.g. dynamic images/assets)
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // Only cache static resources (HTTP/HTTPS protocols, no local file:// or chrome extensions)
              if (event.request.url.startsWith('http')) {
                cache.put(event.request, responseToCache);
              }
            });

            return networkResponse;
          })
          .catch((err) => {
            // Handle offline page fallback if network fails and resource is index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html') || caches.match('/');
            }
            throw err;
          });
      })
  );
});
