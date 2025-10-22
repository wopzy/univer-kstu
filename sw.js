const CACHE_NAME = 'univer-app-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/schedule.json',
  '/schedule2.json', 
  '/schedule3.json',
  '/schedule4.json',
  '/public/umkd.json',
  '/images/favicon_io/android-chrome-192x192.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});