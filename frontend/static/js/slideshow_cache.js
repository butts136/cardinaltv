(() => {
  const NORMALIZE_OPTIONS = { keepTrailingSlash: false };

  const normalizeUrl = (value) => {
    if (!value || typeof value !== "string") return null;
    try {
      const url = new URL(value, window.location.href);
      if (!NORMALIZE_OPTIONS.keepTrailingSlash && url.pathname !== "/") {
        url.pathname = url.pathname.replace(/\/+$/, "");
      }
      return url.toString();
    } catch (error) {
      return null;
    }
  };

  const pushUrl = (set, value) => {
    const normalized = normalizeUrl(value);
    if (normalized) {
      set.add(normalized);
    }
  };

  const collectMediaFromItem = (item) => {
    const urls = new Set();
    if (!item || typeof item !== "object") return urls;

    pushUrl(urls, item.url || item.display_url || item.preview_url);
    pushUrl(urls, item.background_url);
    const birthdayVariant = item.birthday_variant_config;
    if (birthdayVariant && typeof birthdayVariant === "object") {
      pushUrl(urls, birthdayVariant.background_url);
    }

    if (Array.isArray(item.page_urls)) {
      item.page_urls.forEach((url) => pushUrl(urls, url));
    }
    if (Array.isArray(item.text_pages)) {
      item.text_pages.forEach((url) => pushUrl(urls, url));
    }

    const background = item.background || item?.custom_payload?.background;
    if (background && typeof background === "object") {
      pushUrl(urls, background.url || background.path);
    }

    const nestedBackground = item?.custom_payload?.meta?.background;
    if (nestedBackground && typeof nestedBackground === "object") {
      pushUrl(urls, nestedBackground.url || nestedBackground.path);
    }

    return urls;
  };

  const collectMediaUrls = (items, extraUrls = []) => {
    const urls = new Set();
    (Array.isArray(items) ? items : []).forEach((entry) => {
      collectMediaFromItem(entry).forEach((url) => urls.add(url));
    });
    (Array.isArray(extraUrls) ? extraUrls : []).forEach((url) => pushUrl(urls, url));
    return urls;
  };

  const normalizeBaseUrl = (value) => {
    if (!value) return "/";
    return value.endsWith("/") ? value : `${value}/`;
  };

  const APP_BASE_URL = normalizeBaseUrl(document.body?.dataset?.baseUrl || "/");

  const buildServiceWorkerUrl = () => {
    try {
      return new URL(`${APP_BASE_URL}service-worker.js`, window.location.href).toString();
    } catch (error) {
      return "/service-worker.js";
    }
  };

  let registration = null;
  let cachedUrls = new Set();
  let precacheSignature = "";
  let precachePromise = null;
  let serviceWorkerDisabled = false;

  const getActiveWorker = (reg) => reg?.active || reg?.waiting || reg?.installing || navigator.serviceWorker.controller;

  const ensureServiceWorker = async () => {
    if (!("serviceWorker" in navigator) || serviceWorkerDisabled) return null;
    if (registration) return registration;
    try {
      const swUrl = buildServiceWorkerUrl();
      await navigator.serviceWorker.register(swUrl, { scope: APP_BASE_URL });
      registration = await navigator.serviceWorker.ready;
    } catch (error) {
      console.warn("Impossible d'enregistrer le service worker du diaporama:", error);
      registration = null;
      serviceWorkerDisabled = true;
    }
    return registration;
  };

  const postWorkerMessage = (worker, payload, { timeoutMs = 20000 } = {}) =>
    new Promise((resolve) => {
      if (!worker) {
        resolve({ type: "precache-error", error: "no-worker" });
        return;
      }
      const channel = new MessageChannel();
      let settled = false;
      let timeout = null;
      const finalize = (data) => {
        if (settled) return;
        settled = true;
        if (timeout) clearTimeout(timeout);
        resolve(data);
      };
      if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
        timeout = setTimeout(() => finalize({ type: "precache-timeout" }), timeoutMs);
      }
      channel.port1.onmessage = (event) => finalize(event.data || {});
      try {
        worker.postMessage(payload, [channel.port2]);
      } catch (error) {
        finalize({ type: "precache-error", error: "post-failed" });
      }
    });

  const precacheUrls = async (urls, { timeoutMs = 20000, concurrency = 2 } = {}) => {
    const urlSet = new Set();
    (Array.isArray(urls) ? urls : []).forEach((url) => pushUrl(urlSet, url));
    const list = Array.from(urlSet);
    if (!list.length) {
      return { ok: true, total: 0, cached: 0, failed: 0 };
    }
    const reg = await ensureServiceWorker();
    const worker = getActiveWorker(reg);
    if (!worker) {
      return { ok: false, total: list.length, cached: 0, failed: list.length, error: "no-worker" };
    }
    const result = await postWorkerMessage(
      worker,
      { type: "precache-media", urls: list, concurrency },
      { timeoutMs },
    );
    if (result && result.type === "precache-complete") {
      return { ok: true, ...result };
    }
    if (result && result.type === "precache-timeout") {
      return { ok: false, total: list.length, cached: 0, failed: list.length, error: "timeout" };
    }
    return { ok: false, total: list.length, cached: 0, failed: list.length, error: "unknown" };
  };

  const precachePlaylistMedia = async (items, extraUrls = [], options = {}) => {
    const urlSet = collectMediaUrls(items, extraUrls);
    const signature = Array.from(urlSet).sort().join("|");
    if (!options.force && signature && signature === precacheSignature && precachePromise) {
      return precachePromise;
    }
    precacheSignature = signature;
    precachePromise = precacheUrls(Array.from(urlSet), options);
    return precachePromise;
  };

  const updateCacheForPlaylist = async (items, extraUrls = []) => {
    const reg = await ensureServiceWorker();
    const worker = getActiveWorker(reg);
    if (!worker) return;

    const nextUrls = collectMediaUrls(items, extraUrls);

    const toAdd = Array.from(nextUrls).filter((url) => !cachedUrls.has(url));
    const toRemove = Array.from(cachedUrls).filter((url) => !nextUrls.has(url));

    if (!toAdd.length && !toRemove.length) {
      cachedUrls = nextUrls;
      return;
    }

    try {
      worker.postMessage({ type: "update-cache", add: toAdd, remove: toRemove });
      cachedUrls = nextUrls;
    } catch (error) {
      console.warn("Impossible de synchroniser le cache du service worker:", error);
    }
  };

  window.CardinalSlideshowCache = {
    ensureServiceWorker,
    updateCacheForPlaylist,
    precacheUrls,
    precachePlaylistMedia,
    isEnabled: () => !serviceWorkerDisabled,
  };
})();
