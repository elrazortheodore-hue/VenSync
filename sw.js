const CACHE_NAME = 'vensync-v5';
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/favicon.svg',
  '/css/style.css',
  'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  
  // NEVER cache API requests, Firebase sockets, or Google Fonts services
  if (
    url.includes('/api/') || 
    url.includes('firebaseio.com') || 
    url.includes('googleapis.com') || 
    url.includes('firebasedatabase.app')
  ) {
    return;
  }

  // Network-First strategy for HTML document loads.
  // This ensures serverless redirects (e.g. Master Switch check on '/' or '/public') are evaluated natively.
  const isHtml = event.request.headers.get('accept')?.includes('text/html') || 
                 url.endsWith('/private') || 
                 url.endsWith('/public') ||
                 new URL(url).pathname === '/';

  if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-First strategy for static styling assets, favicon, and unpkg scripts
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    }).catch(() => {
      return new Response('Offline static asset not found.', { status: 503 });
    })
  );
});
