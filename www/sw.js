const CACHE_NAME = 'bce-ccna-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/chatbot.js',
  '/assets/logo.jpg',
  '/assets/poster.jpg',
  '/assets/coordinator.jpg',
  '/assets/ccna_lab.png',
  '/assets/phonepe_qr.png',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
