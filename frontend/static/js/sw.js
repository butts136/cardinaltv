// Service Worker for Cardinal TV slideshow - caches media files and accepts update messages
"use strict";

var CACHE_NAME = 'cardinaltv-media-v1';
// No automatic trimming: keep all cached media until explicitly removed

self.addEventListener('install', function (event) {
  // Activate as soon as possible
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

function isMediaRequest(url) {
  try {
    var u = new URL(url, self.location.href);
    // Adjust this path if your media is stored elsewhere
    return u.pathname.indexOf('/cardinaltv/media/') !== -1 || /\.(?:mp4|m4v|mov|webm|mkv|avi|jpg|jpeg|png|gif|bmp|webp|avif)$/i.test(u.pathname);
  } catch (e) {
    return false;
  }
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') {
    return; // only handle GET
  }
  if (!isMediaRequest(req.url)) {
    return; // let the browser handle non-media requests
  }
  event.respondWith((async function () {
    var cache = await caches.open(CACHE_NAME);
    var cached = await cache.match(req);

    // Handle Range requests for video players: serve partial content from cached full response
    var rangeHeader = req.headers.get('range');
    if (rangeHeader && cached) {
      try {
        var full = await cached.arrayBuffer();
        var size = full.byteLength;
        var matches = /bytes=(\d+)-(\d+)?/.exec(rangeHeader);
        if (matches) {
          var start = Number(matches[1]);
          var end = matches[2] ? Number(matches[2]) : size - 1;
          if (isNaN(start) || isNaN(end) || start >= size) {
            return new Response(null, { status: 416, statusText: 'Requested Range Not Satisfiable' });
          }
          end = Math.min(end, size - 1);
          var chunk = full.slice(start, end + 1);
          var headers = new Headers(cached.headers || {});
          headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + size);
          headers.set('Accept-Ranges', 'bytes');
          headers.set('Content-Length', String(chunk.byteLength));
          return new Response(chunk, { status: 206, statusText: 'Partial Content', headers: headers });
        }
      } catch (e) {
        // fallback to network
      }
    }

    if (cached && !rangeHeader) {
      return cached; // serve from cache
    }

    try {
      var response = await fetch(req);
      if (response) {
        // Cache only full successful responses (200) or opaque responses (cross-origin fetches
        // that returned an opaque Response). Avoid caching 206 Partial Content responses which
        // would store only a fragment and later break Range-serving from cache.
        var isOpaque = (response.type && response.type === 'opaque');
        if (response.status === 200 || isOpaque) {
          try { await cache.put(req, response.clone()); } catch (e) { /* ignore cache put errors */ }
        }
      }
      return response;
    } catch (err) {
      // network failure, try to return cached even if previously null
      return cached || new Response(null, { status: 503, statusText: 'Service Unavailable' });
    }
  })());
});

self.addEventListener('message', function (event) {
  var data = event.data || {};
  if (!data || !data.type) return;

  if (data.type === 'init-cache') {
    // data.urls: array of URLs to ensure cached
    var urls = Array.isArray(data.urls) ? data.urls : [];
    event.waitUntil((async function () {
      var cache = await caches.open(CACHE_NAME);
      var toCache = [];
      for (var i = 0; i < urls.length; i++) {
        try {
          var req = new Request(urls[i], { method: 'GET', mode: 'no-cors' });
          toCache.push(req);
        } catch (e) { }
      }
      try {
        await cache.addAll(toCache);
      } catch (e) {
        // some requests may fail (CORS/no-cors), try individual fetch+put
        for (var j = 0; j < toCache.length; j++) {
          try {
            var r = toCache[j];
            var res = await fetch(r);
            if (res && res.status === 200) await cache.put(r, res.clone());
          } catch (ee) { }
        }
      }
    })());
  } else if (data.type === 'update-cache') {
    var add = Array.isArray(data.add) ? data.add : [];
    var remove = Array.isArray(data.remove) ? data.remove : [];
    event.waitUntil((async function () {
      var cache = await caches.open(CACHE_NAME);
      // add new
      for (var i = 0; i < add.length; i++) {
        try {
          var req = new Request(add[i], { method: 'GET', mode: 'no-cors' });
          try { await cache.add(req); } catch (e) {
            try { var r = await fetch(req); if (r && r.status === 200) await cache.put(req, r.clone()); } catch (ee) { }
          }
        } catch (e) { }
      }
      // remove obsolete
      for (var j = 0; j < remove.length; j++) {
        try { await cache.delete(remove[j]); } catch (e) { }
      }
    })());
  }
  // no trim-cache handling — we only remove explicitly requested URLs
});
