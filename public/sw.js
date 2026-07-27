// Service Worker for caching assets

const CACHE_NAME = "eu-roteirizo-cache-v1"; // Versioned cache name
// Install event to cache essential assets
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Activate worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache essential assets if needed
      return cache.addAll(["/", "/vite.svg", "/index.html"]);
    })
  );
});
// Activate event to clean up old caches
self.addEventListener("activate", (event) => {
  self.clients.claim(); // Become available to all pages
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // Delete old caches
          }
        })
      )
    )
  );
});
// Fetch event to serve cached assets
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request)
          .then((networkResponse) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          })
          .catch(() => {
            // Fallback for offline scenarios (e.g., return a default page or asset)
          })
      );
    })
  );
});
