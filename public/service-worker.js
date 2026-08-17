// Minimal service worker - just enough to make the app installable
// as a PWA. Data always comes fresh from the network (no offline
// caching of inventory data, since stock counts must stay accurate).

// Bump this version whenever any file in SHELL_FILES changes - it's what
// forces phones/tablets with the app "installed" to drop old cached JS
// (e.g. the pre-token-auth api.js) instead of silently keeping it forever.
const CACHE_NAME = "dc-stock-shell-v2";
const SHELL_FILES = ["css/style.css", "js/api.js", "logo.jpeg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Never cache API calls - inventory data must always be live
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
