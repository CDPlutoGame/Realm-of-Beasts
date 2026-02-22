const CACHE = "mbr-v3"; // <-- bei Änderungen immer hochzählen!
const BASE = "/Realm-of-Beasts/";

const ASSETS = [
  BASE,
  BASE + "index.html",
  BASE + "style.css",
  BASE + "game.js",
  BASE + "auth-overlay.js",
  BASE + "ranking-online.js",
  BASE + "manifest.webmanifest",
  BASE + "icons/icon-192.png",
  BASE + "icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request))
  );
});
