/* Cardinal TV Service Worker
 * Met en cache les assets statiques et les médias pour un diaporama offline-first,
 * tout en laissant les appels API se rafraîchir depuis le réseau.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `cardinal-static-${CACHE_VERSION}`;
const MEDIA_CACHE = `cardinal-media-${CACHE_VERSION}`;

const CORE_ASSETS = [
  "/",
  "/slideshow",
  "/static/css/styles.css",
  "/static/js/slideshow.js",
  "/static/img/favicon.png",
];

const MEDIA_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".bmp",
  ".svg",
  ".mp4",
  ".m4v",
  ".mov",
  ".webm",
  ".mkv",
  ".avi",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("cardinal-") && key !== STATIC_CACHE && key !== MEDIA_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

const isSameOrigin = (url) => {
  try {
    const u = new URL(url);
    return u.origin === self.location.origin;
  } catch (e) {
    return false;
  }
};

const isMediaRequest = (url) => {
  const lower = url.split("?")[0].toLowerCase();
  return MEDIA_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !isSameOrigin(request.url)) {
    return;
  }

  // Ne pas mettre en cache les API pour toujours récupérer l'état (enabled/disabled).
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first pour les médias pour éviter plusieurs téléchargements.
  if (isMediaRequest(request.url)) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Stale-while-revalidate pour les assets statiques.
  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const networkPromise = fetch(request)
        .then((response) => {
          cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || networkPromise;
    })
  );
});
