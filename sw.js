const CACHE_NAME = "realm-of-beasts-s1";

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./auth.js",
  "./ranking.js",
  "./game.js",
  "./admin.js",
  "./manifest.json"
];

// Installieren → Dateien cachen
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// Aktivieren
self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

// Fetch → Offline Support
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});