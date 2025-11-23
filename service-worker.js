const CACHE_NAME = 'univer-kstu-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './assets/bootstrap/css/bootstrap.min.css',
  './assets/css/Navbar-Centered-Links-icons.css',
  './assets/css/themes.css',
  './assets/bootstrap/js/bootstrap.min.js',
  './assets/js/schedule.js',
  './images/favicon_io/favicon.ico',
  './images/favicon_io/apple-touch-icon.png',
  './images/favicon_io/android-chrome-192x192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
