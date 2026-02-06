/* Cardinal TV Service Worker
 * Met en cache les assets statiques et les médias pour un diaporama offline-first,
 * tout en laissant les appels API se rafraîchir depuis le réseau.
 */

const CACHE_VERSION = "v19";
const STATIC_CACHE = `cardinal-static-${CACHE_VERSION}`;
const MEDIA_CACHE = `cardinal-media-${CACHE_VERSION}`;

const BASE_PATH = (() => {
  try {
    const scope = self.registration?.scope || self.location.origin + "/";
    const path = new URL(scope).pathname.replace(/\/$/, "");
    return path === "/" ? "" : path;
  } catch (e) {
    return "";
  }
})();

const CORE_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/slideshow`,
  `${BASE_PATH}/static/css/styles.css`,
  `${BASE_PATH}/static/css/performance.css`,
  `${BASE_PATH}/static/js/performance_manager.js`,
  `${BASE_PATH}/static/js/slide_renderers.js`,
  `${BASE_PATH}/static/js/slideshow/constants.js`,
  `${BASE_PATH}/static/js/slideshow/birthday_config.js`,
  `${BASE_PATH}/static/js/slideshow_cache.js`,
  `${BASE_PATH}/static/js/slideshow.js`,
  `${BASE_PATH}/static/img/favicon.png`,
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

const BYTE_RANGE_REGEX = /bytes=(\d*)-(\d*)/;

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

const isMediaRequest = (url, request) => {
  if (request && (request.destination === "image" || request.destination === "video" || request.destination === "audio")) {
    return true;
  }
  const lower = url.split("?")[0].toLowerCase();
  return MEDIA_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

const parseRangeHeader = (value, size) => {
  if (!value || !size) return null;
  const match = BYTE_RANGE_REGEX.exec(value);
  if (!match) return null;
  let start = match[1] ? Number.parseInt(match[1], 10) : null;
  let end = match[2] ? Number.parseInt(match[2], 10) : null;
  if (start == null && end == null) return null;
  if (start == null) {
    start = Math.max(0, size - end);
    end = size - 1;
  } else {
    if (end == null || end >= size) {
      end = size - 1;
    }
  }
  if (start < 0 || end < start || start >= size) return null;
  return { start, end };
};

const buildRangeResponse = async (cachedResponse, rangeHeader) => {
  if (!cachedResponse || cachedResponse.type === "opaque") return null;
  const blob = await cachedResponse.blob();
  const size = blob.size;
  if (!size) return cachedResponse;
  const range = parseRangeHeader(rangeHeader, size);
  if (!range) {
    return new Response(null, {
      status: 416,
      headers: {
        "Content-Range": `bytes */${size}`,
      },
    });
  }
  const chunk = blob.slice(range.start, range.end + 1);
  const headers = new Headers(cachedResponse.headers);
  headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
  headers.set("Content-Length", String(range.end - range.start + 1));
  headers.set("Accept-Ranges", "bytes");
  return new Response(chunk, {
    status: 206,
    statusText: "Partial Content",
    headers,
  });
};

const cacheMediaResponse = async (cache, requestUrl, response, { allowPartial = false } = {}) => {
  if (!response) return false;
  if (!response.ok) return false;
  if (!allowPartial && response.status !== 200) return false;
  try {
    await cache.put(requestUrl, response.clone());
    return true;
  } catch (error) {
    return false;
  }
};

const fetchAndCacheMedia = async (cache, url) => {
  const cached = await cache.match(url);
  if (cached) return true;
  try {
    const response = await fetch(url);
    return await cacheMediaResponse(cache, url, response);
  } catch (error) {
    return false;
  }
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
  if (isMediaRequest(request.url, request)) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(async (cache) => {
        const rangeHeader = request.headers.get("range");
        if (rangeHeader) {
          const cached = await cache.match(request.url);
          if (cached) {
            try {
              const ranged = await buildRangeResponse(cached, rangeHeader);
              if (ranged) {
                return ranged;
              }
            } catch (error) {
              // fallthrough to network
            }
          }
        }

        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (!rangeHeader) {
          await cacheMediaResponse(cache, request, response);
        }
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

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (!data) return;

  if (data.type === "update-cache") {
    const additions = Array.isArray(data.add) ? data.add : [];
    const removals = Array.isArray(data.remove) ? data.remove : [];

    event.waitUntil(
      (async () => {
        const cache = await caches.open(MEDIA_CACHE);

        for (const url of additions) {
          try {
            await fetchAndCacheMedia(cache, url);
          } catch (error) {
            // Ignore fetch errors; asset will be retried on next refresh.
          }
        }

        for (const url of removals) {
          try {
            await cache.delete(url);
          } catch (error) {
            // Ignore deletion errors.
          }
        }
      })()
    );
    return;
  }

  if (data.type === "precache-media") {
    const urls = Array.isArray(data.urls) ? data.urls : [];
    const concurrency = Math.max(1, Math.min(6, Number(data.concurrency) || 2));
    const replyPort = event.ports && event.ports[0] ? event.ports[0] : null;

    event.waitUntil(
      (async () => {
        const cache = await caches.open(MEDIA_CACHE);
        const queue = urls.filter(Boolean);
        let cached = 0;
        let failed = 0;

        const runWorker = async () => {
          while (queue.length) {
            const url = queue.shift();
            if (!url) continue;
            const ok = await fetchAndCacheMedia(cache, url);
            if (ok) {
              cached += 1;
            } else {
              failed += 1;
            }
          }
        };

        const workers = Array.from(
          { length: Math.min(concurrency, queue.length || 1) },
          () => runWorker()
        );
        await Promise.all(workers);

        if (replyPort) {
          replyPort.postMessage({
            type: "precache-complete",
            total: urls.length,
            cached,
            failed,
          });
        }
      })()
    );
  }
});
