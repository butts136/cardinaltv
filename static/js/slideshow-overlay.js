;(function () {
  "use strict";

  if (typeof window.Promise !== "function") {
    console.warn("Overlay desactive: Promise non supporte par ce navigateur.");
    return;
  }

  var DEFAULT_OVERLAY = {
    enabled: true,
    mode: "clock",
    height_vh: 5,
    background_color: "#f0f0f0",
    text_color: "#111111",
    logo_path: "static/img/logo-groupe-cardinal.png",
    ticker_text: "Bienvenue sur Cardinal TV"
  };

  var TIMEZONE = "America/Toronto";
  var OVERLAY_REFRESH_INTERVAL_MS = 60000;

  var overlaySettings = clone(DEFAULT_OVERLAY);
  var overlaySignature = "";
  var clockTimer = null;
  var overlayRefreshTimer = null;
  var overlayContainer = null;
  var overlayLogo = null;
  var overlayContent = null;
  var slideshowClock = null;
  var rootElement = null;
  var resizeTimer = null;

  function clone(source) {
    var copy = {};
    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        copy[key] = source[key];
      }
    }
    return copy;
  }

  function mergeOverlay(base, override) {
    var result = clone(base || {});
    if (!override) {
      return result;
    }
    for (var key in override) {
      if (Object.prototype.hasOwnProperty.call(override, key)) {
        result[key] = override[key];
      }
    }
    return result;
  }

  function resolveOverlayHeight(heightValue) {
    var base = Number(heightValue);
    if (!base || base < 3) {
      base = DEFAULT_OVERLAY.height_vh;
    }
    if (base < 3) {
      base = 3;
    }
    var viewportWidth = window.innerWidth || (document.documentElement && document.documentElement.clientWidth) || 0;
    if (viewportWidth) {
      if (viewportWidth <= 420 && base > 6) {
        base = 6;
      } else if (viewportWidth <= 700 && base > 7.5) {
        base = 7.5;
      } else if (viewportWidth <= 1024 && base > 9) {
        base = 9;
      }
    }
    return base;
  }

  function updateOverlayHeightPx() {
    if (!rootElement) {
      return;
    }
    var heightPx = 0;
    try {
      if (overlayContainer && !overlayContainer.hidden) {
        var rect = overlayContainer.getBoundingClientRect();
        heightPx = rect && rect.height ? rect.height : 0;
      }
    } catch (measurementError) {
      heightPx = 0;
    }
    if (!heightPx && overlayContainer) {
      try {
        var computed = window.getComputedStyle ? window.getComputedStyle(overlayContainer) : null;
        if (computed) {
          var parsed = parseFloat(computed.height || "0");
          if (!isNaN(parsed) && parsed > 0) {
            heightPx = parsed;
          }
        }
      } catch (computedError) {
        heightPx = 0;
      }
    }
    if (!heightPx) {
      heightPx = (DEFAULT_OVERLAY.height_vh || 6) * Math.max(window.innerHeight || 0, 600) / 100;
    }
    rootElement.style.setProperty("--overlay-height-px", heightPx + "px");
  }

  function capitalizeFirst(value) {
    if (!value) {
      return value;
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function pad2(value) {
    var text = String(value);
    return text.length < 2 ? "0" + text : text;
  }

  function formatDateTimeForOverlay(date) {
    try {
      if (typeof Intl === "object" && Intl && typeof Intl.DateTimeFormat === "function") {
        var weekday = "";
        var day = "";
        var month = "";
        var year = "";
        var dateFormatter = new Intl.DateTimeFormat("fr-CA", {
          timeZone: TIMEZONE,
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        });

        if (typeof dateFormatter.formatToParts === "function") {
          var dateParts = dateFormatter.formatToParts(date);
          for (var i = 0; i < dateParts.length; i += 1) {
            var part = dateParts[i];
            if (!part || part.type === "literal") {
              continue;
            }
            if (part.type === "weekday") {
              weekday = capitalizeFirst(part.value || "");
            } else if (part.type === "day") {
              day = part.value || "";
            } else if (part.type === "month") {
              month = capitalizeFirst(part.value || "");
            } else if (part.type === "year") {
              year = part.value || "";
            }
          }
        } else {
          var formattedDate = capitalizeFirst(dateFormatter.format(date));
          var parts = formattedDate.split(" ");
          if (parts.length >= 4) {
            weekday = capitalizeFirst(parts[0] || "");
            day = parts[1] || "";
            month = capitalizeFirst(parts[2] || "");
            year = parts[3] || "";
          } else {
            weekday = formattedDate;
          }
        }

        var timeFormatter = new Intl.DateTimeFormat("fr-CA", {
          timeZone: TIMEZONE,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        });

        var hh = "";
        var mm = "";
        var ss = "";
        if (typeof timeFormatter.formatToParts === "function") {
          var timeParts = timeFormatter.formatToParts(date);
          for (var j = 0; j < timeParts.length; j += 1) {
            var timePart = timeParts[j];
            if (!timePart || timePart.type === "literal") {
              continue;
            }
            if (timePart.type === "hour") {
              hh = pad2(timePart.value || "0");
            } else if (timePart.type === "minute") {
              mm = pad2(timePart.value || "0");
            } else if (timePart.type === "second") {
              ss = pad2(timePart.value || "0");
            }
          }
        } else {
          var rawTime = timeFormatter.format(date);
          var segments = rawTime.split(":");
          if (segments.length === 3) {
            hh = pad2(segments[0]);
            mm = pad2(segments[1]);
            ss = pad2(segments[2]);
          } else {
            hh = pad2(date.getHours());
            mm = pad2(date.getMinutes());
            ss = pad2(date.getSeconds());
          }
        }

        var dateLabel = (weekday + " " + day + " " + month + " " + year).trim();
        if (!dateLabel) {
          dateLabel = dateFormatter.format(date);
        }
        return dateLabel + " - " + pad2(hh) + ":" + pad2(mm) + ":" + pad2(ss);
      }
    } catch (intlError) {
      // fall through to basic formatting below
    }

    var basicDate = date.toLocaleDateString("fr-CA");
    return basicDate + " - " + pad2(date.getHours()) + ":" + pad2(date.getMinutes()) + ":" + pad2(date.getSeconds());
  }

  function safeJSONParse(text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  }

  function fetchJSON(url) {
    if (typeof window.fetch === "function") {
      return window.fetch(url, { cache: "no-store" }).then(function (response) {
        if (!response.ok) {
          return response.text().then(function (message) {
            throw new Error(message || "Requete echouee");
          });
        }
        return response.json();
      });
    }

    return new Promise(function (resolve, reject) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              var payload = safeJSONParse(xhr.responseText || "{}");
              if (payload === null) {
                reject(new Error("Reponse JSON invalide"));
              } else {
                resolve(payload);
              }
            } else {
              reject(new Error(xhr.responseText || "Requete echouee"));
            }
          }
        };
        xhr.onerror = function () {
          reject(new Error("Requete echouee"));
        };
        xhr.send();
      } catch (networkError) {
        reject(networkError);
      }
    });
  }

  function isClockModeActive() {
    return Boolean(overlaySettings.enabled) && overlaySettings.mode === "clock";
  }

  function updateClock() {
    if (!isClockModeActive() || !slideshowClock) {
      return;
    }
    slideshowClock.textContent = formatDateTimeForOverlay(new Date());
  }

  function stopClock() {
    if (clockTimer) {
      window.clearInterval(clockTimer);
      clockTimer = null;
    }
    if (typeof window !== "undefined" && window.__slideshow_clock_owner === "overlay") {
      try {
        delete window.__slideshow_clock_owner;
      } catch (error) {
        window.__slideshow_clock_owner = undefined;
      }
    }
  }

  function startClock() {
    stopClock();
    if (!isClockModeActive()) {
      if (slideshowClock) {
        slideshowClock.textContent = "";
      }
      return;
    }
    updateClock();
    clockTimer = window.setInterval(updateClock, 1000);
    if (typeof window !== "undefined") {
      window.__slideshow_clock_owner = "overlay";
    }
  }

  function ensureLogoOutsideContent() {
    if (!overlayLogo || !overlayContent || !overlayContainer) {
      return;
    }
    if (overlayContent.contains(overlayLogo)) {
      overlayContainer.insertBefore(overlayLogo, overlayContent);
    }
  }

  function ensureClockElement() {
    if (!overlayContent) {
      return null;
    }

    if (!slideshowClock || !slideshowClock.isConnected) {
      var existing = document.getElementById("slideshow-clock");
      if (existing) {
        slideshowClock = existing;
      } else {
        slideshowClock = document.createElement("span");
        slideshowClock.id = "slideshow-clock";
      }
      if (slideshowClock.classList) {
        slideshowClock.classList.add("clock-text");
      } else {
        slideshowClock.className = (slideshowClock.className || "") + " clock-text";
      }
    }

    if (slideshowClock.parentNode !== overlayContent) {
      overlayContent.appendChild(slideshowClock);
    }

    return slideshowClock;
  }

  function clearElement(element) {
    if (!element) {
      return;
    }
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function applyOverlaySettings(overlayInput) {
    overlaySettings = mergeOverlay(DEFAULT_OVERLAY, overlayInput || {});

    if (!overlayContainer || !overlayContent || !rootElement) {
      return;
    }

    ensureLogoOutsideContent();

    var enabled = Boolean(overlaySettings.enabled);
    var height = Number(overlaySettings.height_vh);
    if (!height || height < 3) {
      height = DEFAULT_OVERLAY.height_vh;
    }
    var effectiveHeight = resolveOverlayHeight(height);
    var background = overlaySettings.background_color || DEFAULT_OVERLAY.background_color;
    var textColor = overlaySettings.text_color || DEFAULT_OVERLAY.text_color;
    var logoPath = overlaySettings.logo_path || DEFAULT_OVERLAY.logo_path;
    var mode = overlaySettings.mode === "ticker" ? "ticker" : "clock";

    if (enabled) {
      overlayContainer.hidden = false;
      rootElement.style.setProperty("--overlay-height", effectiveHeight + "vh");
      rootElement.style.setProperty("--overlay-padding", Math.max(effectiveHeight, 3) + "vh");
      rootElement.style.setProperty("--overlay-bg", background);
      rootElement.style.setProperty("--overlay-fg", textColor);
      overlayContent.style.fontSize = Math.max(2.6, effectiveHeight * 0.62) + "vh";
      overlayContent.style.color = textColor;

      if (overlayLogo) {
        overlayLogo.src = logoPath;
        overlayLogo.style.display = logoPath ? "" : "none";
        if (overlayLogo.parentNode !== overlayContainer) {
          overlayContainer.insertBefore(overlayLogo, overlayContent);
        }
      }

      clearElement(overlayContent);
      if (overlayContent.classList) {
        overlayContent.classList.toggle("ticker-active", mode === "ticker");
      }

      if (mode === "ticker") {
        stopClock();
        var wrapper = document.createElement("div");
        wrapper.className = "ticker-wrapper";
        var track = document.createElement("div");
        track.className = "ticker-track";
        track.textContent = overlaySettings.ticker_text || "";
        wrapper.appendChild(track);
        overlayContent.appendChild(wrapper);
      } else {
        var clockElement = ensureClockElement();
        if (clockElement) {
          clockElement.textContent = "";
          clockElement.style.color = textColor;
        }
        startClock();
      }

      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(function () {
          updateOverlayHeightPx();
        });
      } else {
        updateOverlayHeightPx();
      }
    } else {
      overlayContainer.hidden = true;
      rootElement.style.setProperty("--overlay-height", "0vh");
      rootElement.style.setProperty("--overlay-padding", "0px");
      if (overlayLogo) {
        overlayLogo.style.display = "none";
      }
      clearElement(overlayContent);
      if (overlayContent && overlayContent.classList) {
        overlayContent.classList.remove("ticker-active");
      }
      stopClock();
      rootElement.style.setProperty("--overlay-height-px", "0px");
    }
  }

  function refreshOverlaySettings() {
    return fetchJSON("api/settings").then(function (data) {
      var signature = JSON.stringify(data || {});
      if (signature === overlaySignature) {
        return;
      }
      overlaySignature = signature;
      var overlay = data && data.overlay ? data.overlay : {};
      applyOverlaySettings(overlay);
    }).catch(function (error) {
      console.warn("Impossible de recuperer les parametres d'overlay:", error);
    });
  }

  function cleanupOverlay() {
    stopClock();
    if (overlayRefreshTimer) {
      window.clearInterval(overlayRefreshTimer);
      overlayRefreshTimer = null;
    }
    if (resizeTimer) {
      window.clearTimeout(resizeTimer);
      resizeTimer = null;
    }
    window.removeEventListener("resize", handleResize);
    if (rootElement) {
      rootElement.style.setProperty("--overlay-height-px", "0px");
    }
  }

  function handleResize() {
    if (resizeTimer) {
      window.clearTimeout(resizeTimer);
    }
    resizeTimer = window.setTimeout(function () {
      resizeTimer = null;
      applyOverlaySettings(overlaySettings);
      updateOverlayHeightPx();
    }, 150);
  }

  function initOverlay() {
    rootElement = document.documentElement;
    overlayContainer = document.getElementById("slideshow-brand");
    overlayLogo = document.getElementById("overlay-logo");
    overlayContent = document.getElementById("overlay-content");
    slideshowClock = document.getElementById("slideshow-clock");

    if (!overlayContainer || !overlayContent) {
      console.warn("Aucun conteneur de bande de diaporama trouve.");
      return;
    }

    applyOverlaySettings(DEFAULT_OVERLAY);
    refreshOverlaySettings();

    overlayRefreshTimer = window.setInterval(function () {
      refreshOverlaySettings();
    }, OVERLAY_REFRESH_INTERVAL_MS);

    window.addEventListener("resize", handleResize);

    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(function () {
        updateOverlayHeightPx();
      });
    } else {
      updateOverlayHeightPx();
    }

    window.addEventListener("beforeunload", function () {
      cleanupOverlay();
    }, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initOverlay();
    }, { once: true });
  } else {
    initOverlay();
  }
})();
