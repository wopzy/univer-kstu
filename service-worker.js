const CACHE_NAME = 'univer-kstu-v3';
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
  // Немедленно активировать новый SW
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const requestURL = new URL(event.request.url);

  if (event.request.mode === 'navigate' || requestURL.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return resp;
        })
        .catch(() => caches.match(event.request).then((r) => r))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((resp) => {
        if (!/^(GET|HEAD)$/.test(event.request.method)) return resp;
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, respClone).catch(()=>{/*ignore*/});
        });
        return resp;
      });
    })
  );
});
