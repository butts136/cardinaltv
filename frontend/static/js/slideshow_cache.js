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
    pushUrl(urls, item.background_path);

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

  let registration = null;
  let cachedUrls = new Set();

  const getActiveWorker = (reg) => reg?.active || reg?.waiting || reg?.installing || navigator.serviceWorker.controller;

  const ensureServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) return null;
    if (registration) return registration;
    try {
      await navigator.serviceWorker.register("/service-worker.js");
      registration = await navigator.serviceWorker.ready;
    } catch (error) {
      console.warn("Impossible d'enregistrer le service worker du diaporama:", error);
      registration = null;
    }
    return registration;
  };

  const updateCacheForPlaylist = async (items, extraUrls = []) => {
    const reg = await ensureServiceWorker();
    const worker = getActiveWorker(reg);
    if (!worker) return;

    const nextUrls = new Set();
    (Array.isArray(items) ? items : []).forEach((entry) => {
      collectMediaFromItem(entry).forEach((url) => nextUrls.add(url));
    });
    (Array.isArray(extraUrls) ? extraUrls : []).forEach((url) => pushUrl(nextUrls, url));

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
  };
})();
