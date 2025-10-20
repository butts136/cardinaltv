(function () {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  var config = window.__browserCssConfig || {};
  var ua = navigator.userAgent || "";
  var browserKey = null;

  if (/Silk/i.test(ua)) {
    browserKey = "silk";
  }

  if (!browserKey) {
    return;
  }

  var className = "browser-" + browserKey;
  document.documentElement.classList.add(className);

  var cssUrl = config[browserKey];
  if (!cssUrl) {
    return;
  }

  var existing = document.querySelector('link[data-browser-override="' + browserKey + '"]');
  if (existing) {
    return;
  }

  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = cssUrl;
  link.setAttribute("data-browser-override", browserKey);
  document.head.appendChild(link);
})();
