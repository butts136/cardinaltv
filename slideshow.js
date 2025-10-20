;(function () {
  "use strict";

  var doc = document;
  var startButton = doc.getElementById("start-slideshow");
  var placeholder = doc.getElementById("slideshow-placeholder");
  var stage = doc.getElementById("slideshow-stage");
  var mediaWrapper = doc.getElementById("media-wrapper");
  var statusOverlay = doc.getElementById("slideshow-overlay");
  var statusLabel = doc.getElementById("slideshow-status");
  var rootElement = doc.documentElement;
  var slideshowClock = doc.getElementById("slideshow-clock");

  if (typeof window.Promise !== "function") {
    if (statusOverlay && statusLabel) {
      statusOverlay.hidden = false;
      statusLabel.textContent = "Navigateur non supporte pour le diaporama.";
    }
    console.error("Le navigateur ne supporte pas Promise; le diaporama ne peut pas demarrer.");
    return;
  }

  var playlistEndpoint = "api/media?active=1";
  var playlistRefreshMs = 45000;
  var defaultImageDuration = 10;
  var minSlideDuration = 3;

  var videoExtensions = ["mp4", "m4v", "mov", "webm", "mkv", "avi"];
  var imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "avif"];

  var viewportResizeTimer = null;

  var state = {
    playlist: [],
    playlistSignature: "",
    index: -1,
    timer: null,
    currentElement: null,
    currentVideo: null,
    playlistPoller: null,
    starting: false,
    running: false,
    lastPlaylistFetchOk: false,
    wakeLock: null
  };

  // Clock management (integrated from slideshow-overlay.js)
  var TIMEZONE = "America/Toronto";
  var clockTimer = null;

  // User-Agent Detection
  var userAgent = navigator.userAgent;
  var isAmazonSilk = /Silk/.test(userAgent);
  var isFireTV = /AFT/.test(userAgent);
  
  // Log user-agent for debugging
  console.log("User-Agent:", userAgent);
  console.log("Amazon Silk detected:", isAmazonSilk);
  console.log("Fire TV detected:", isFireTV);
  
  // Send user-agent to server for logging
  function logUserAgent() {
    try {
      fetch("/cardinaltv/api/log-useragent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userAgent: userAgent,
          isAmazonSilk: isAmazonSilk,
          isFireTV: isFireTV,
          timestamp: new Date().toISOString(),
          url: window.location.href
        })
      }).catch(function(err) {
        console.warn("Failed to log user-agent:", err);
      });
    } catch (e) {
      console.warn("Error logging user-agent:", e);
    }
  }
  
  // Log on page load
  logUserAgent();
  
  // Apply CSS classes based on user-agent
  if (isAmazonSilk) {
    rootElement.classList.add("amazon-silk");
  }
  if (isFireTV) {
    rootElement.classList.add("fire-tv");
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
      console.warn("Error formatting date:", intlError);
    }

    var basicDate = date.toLocaleDateString("fr-CA");
    return basicDate + " - " + pad2(date.getHours()) + ":" + pad2(date.getMinutes()) + ":" + pad2(date.getSeconds());
  }

  function updateClock() {
    if (!slideshowClock) {
      return;
    }
    slideshowClock.textContent = formatDateTimeForOverlay(new Date());
  }

  function stopClock() {
    if (clockTimer) {
      window.clearInterval(clockTimer);
      clockTimer = null;
    }
  }

  function startClock() {
    stopClock();
    if (!slideshowClock) {
      slideshowClock = doc.getElementById("slideshow-clock");
    }
    if (!slideshowClock) {
      console.warn("Clock element not found");
      return;
    }
    updateClock();
    clockTimer = window.setInterval(updateClock, 1000);
    console.log("Clock started");
  }

  function parseAutoStart() {
    var flag = false;
    try {
      if (window.sessionStorage && window.sessionStorage.getItem("cardinal_auto_slideshow") === "1") {
        flag = true;
      }
    } catch (storageError) {
      // ignore storage errors (private mode, etc.)
    }
    if (!flag) {
      var search = window.location.search || "";
      flag = /(?:^|[?&])auto=1(?:&|$)/.test(search);
    }
    return flag;
  }

  var autoStart = parseAutoStart();

  function isArray(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
  }

  function safeJSONParse(text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  }

  function fetchJSONMain(endpoint) {
    if (typeof window.fetch === "function") {
      return window.fetch(endpoint, { cache: "no-store" }).then(function (response) {
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
        xhr.open("GET", endpoint, true);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              var payload = safeJSONParse(xhr.responseText || "[]");
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

  function getContainerRect() {
    if (!mediaWrapper) {
      return { width: 0, height: 0 };
    }
    var rect = mediaWrapper.getBoundingClientRect ? mediaWrapper.getBoundingClientRect() : null;
    if (rect && rect.width && rect.height) {
      return { width: rect.width, height: rect.height };
    }
    return {
      width: mediaWrapper.clientWidth || 0,
      height: mediaWrapper.clientHeight || 0,
    };
  }

  function isAmazonSilk() {
    var ua = navigator.userAgent || "";
    return ua.indexOf("Silk") !== -1;
  }

  function fitMediaElement(element) {
    if (!element || !element.style) {
      return;
    }
    var isVideo = element.tagName === 'VIDEO';
    var isAmazon = isAmazonSilk();
    
    // Full screen mode - stretch to fill while maintaining aspect ratio
    element.style.position = "absolute";
    element.style.top = "50%";
    element.style.left = "50%";
    element.style.transform = isAmazon ? "translate(-50%, -50%)" : "translate(-50%, -50%) translateZ(0)";
    element.style.webkitTransform = isAmazon ? "translate(-50%, -50%)" : "translate(-50%, -50%) translateZ(0)";
    element.style.width = "100%";
    element.style.height = "100%";
    element.style.maxWidth = "none";
    element.style.maxHeight = "none";
    element.style.margin = "0";
    element.style.zIndex = "1";
    element.style.objectFit = "contain";
    element.style.objectPosition = "center";
  }

  function fitCurrentMedia() {
    if (state.currentElement) {
      fitMediaElement(state.currentElement);
    }
  }

  function getViewportHeight() {
    var height = 0;
    
    // Use Visual Viewport API if available (modern browsers, especially mobile)
    // This gives us the ACTUAL visible area excluding browser UI
    if (window.visualViewport && window.visualViewport.height > 0) {
      height = window.visualViewport.height;
      console.log("Using visualViewport.height:", height);
    } 
    // Fallback to window.innerHeight
    else if (typeof window.innerHeight === "number" && window.innerHeight > 0) {
      height = window.innerHeight;
      console.log("Using window.innerHeight:", height);
    } 
    // Fallback to documentElement.clientHeight
    else if (doc && doc.documentElement && doc.documentElement.clientHeight) {
      height = doc.documentElement.clientHeight;
      console.log("Using documentElement.clientHeight:", height);
    } 
    // Last resort: screen.height
    else if (window.screen && window.screen.height) {
      height = window.screen.height;
      console.log("Using screen.height:", height);
    }
    
    return height;
  }

  function syncViewportHeight() {
    if (!rootElement) {
      return;
    }
    var viewportHeight = getViewportHeight();
    if (viewportHeight && viewportHeight > 0) {
      rootElement.style.setProperty("--slideshow-viewport-height", viewportHeight + "px");
      console.log("Viewport height set to:", viewportHeight + "px");
      
      // Calculate overlay band height in pixels for padding
      var overlayBrand = doc.getElementById("slideshow-brand");
      if (overlayBrand) {
        var overlayHeight = overlayBrand.offsetHeight || 0;
        if (overlayHeight > 0) {
          rootElement.style.setProperty("--overlay-height-px", overlayHeight + "px");
          console.log("Overlay band height set to:", overlayHeight + "px");
        }
      }
    }
    fitCurrentMedia();
  }

  function setStatus(message) {
    if (!statusOverlay || !statusLabel) {
      return;
    }
    if (!message) {
      statusOverlay.hidden = true;
      statusLabel.textContent = "";
    } else {
      statusOverlay.hidden = false;
      statusLabel.textContent = message;
    }
  }

  function clearTimer() {
    if (state.timer) {
      window.clearTimeout(state.timer);
      state.timer = null;
    }
  }

  function stopCurrentMedia() {
    clearTimer();
    if (state.currentVideo) {
      try {
        state.currentVideo.pause();
        state.currentVideo.removeAttribute("src");
        var sources = state.currentVideo.getElementsByTagName("source");
        while (sources.length) {
          state.currentVideo.removeChild(sources[0]);
        }
        if (typeof state.currentVideo.load === "function") {
          state.currentVideo.load();
        }
      } catch (error) {
        console.warn("Impossible d'arreter la video:", error);
      }
    }
    state.currentVideo = null;
    state.currentElement = null;
    if (mediaWrapper) {
      mediaWrapper.innerHTML = "";
    }
  }

  function valueOrEmpty(value) {
    return (value || "").toString();
  }

  function stringStartsWith(value, search) {
    return value.indexOf(search) === 0;
  }

  function arrayIncludes(list, candidate) {
    if (!list || !list.length) {
      return false;
    }
    for (var i = 0; i < list.length; i += 1) {
      if (list[i] === candidate) {
        return true;
      }
    }
    return false;
  }

  function detectKind(item) {
    if (!item) {
      return "other";
    }
    var type = valueOrEmpty(item.display_mimetype || item.mimetype).toLowerCase();
    if (stringStartsWith(type, "video/")) {
      return "video";
    }
    if (stringStartsWith(type, "image/")) {
      return "image";
    }
    if (type === "application/pdf") {
      return "pdf";
    }

    var filename = valueOrEmpty(item.display_filename || item.filename);
    var lastDot = filename.lastIndexOf(".");
    var extension = lastDot >= 0 ? filename.slice(lastDot + 1).toLowerCase() : "";

    if (arrayIncludes(videoExtensions, extension)) {
      return "video";
    }
    if (arrayIncludes(imageExtensions, extension)) {
      return "image";
    }
    if (extension === "pdf") {
      return "pdf";
    }
    return "other";
  }

  function buildImage(item) {
    var img = doc.createElement("img");
    img.alt = item.original_name || item.filename || "Image";
    img.decoding = "async";
    img.loading = "lazy";
    img.src = item.display_url || item.url;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.style.objectPosition = "center";
    return img;
  }

  function attemptVideoPlay(video, allowMuteToggle) {
    var toggle = allowMuteToggle !== false;
    if (!video) {
      return;
    }
    try {
      var playResult = video.play();
      if (playResult && typeof playResult.catch === "function") {
        playResult.catch(function (error) {
          if (toggle && !video.muted) {
            console.warn("Lecture video bloquee, activation du mode muet.");
            video.muted = true;
            video.volume = 0;
            attemptVideoPlay(video, false);
          } else {
            console.warn("Lecture video impossible:", error);
            setStatus("Lecture video impossible.");
          }
        });
      }
    } catch (error) {
      if (toggle && !video.muted) {
        video.muted = true;
        video.volume = 0;
        attemptVideoPlay(video, false);
      } else {
        console.warn("Lecture video impossible:", error);
        setStatus("Lecture video impossible.");
      }
    }
  }

  function buildVideo(item) {
    console.log("[buildVideo] Creating video element for:", item.filename);
    var video = doc.createElement("video");
    var src = item.display_url || item.url;
    console.log("[buildVideo] Video source:", src);
    var mimetype = valueOrEmpty(item.display_mimetype || item.mimetype);
    if (!mimetype && src) {
      var lastDot = src.lastIndexOf(".");
      var ext = lastDot >= 0 ? src.slice(lastDot + 1).toLowerCase() : "";
      if (ext === "mp4") {
        mimetype = "video/mp4";
      } else if (ext === "webm") {
        mimetype = "video/webm";
      } else if (ext === "mkv") {
        mimetype = "video/x-matroska";
      }
    }
    console.log("[buildVideo] MIME type:", mimetype);
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("x5-playsinline", "");
    video.controls = false;
    video.autoplay = true;
    video.setAttribute("autoplay", "");
    video.loop = false;
    video.preload = "metadata";
    video.setAttribute("preload", "metadata");

    if (src) {
      var source = doc.createElement("source");
      source.src = src;
      if (mimetype) {
        source.type = mimetype;
      }
      video.appendChild(source);
      video.src = src;
    }

    video.style.display = "block";
    video.style.position = "relative";
    video.style.zIndex = "1";
    video.style.maxWidth = "100%";
    video.style.maxHeight = "100%";
    video.style.width = "auto";
    video.style.height = "auto";
    video.style.objectFit = "contain";
    video.style.objectPosition = "top center";
    video.style.backgroundColor = "black";
    var isAmazonSilkBuild = navigator.userAgent.indexOf("Silk") !== -1;
    video.style.transform = isAmazonSilkBuild ? "none" : "translateZ(0)";
    video.style.webkitTransform = isAmazonSilkBuild ? "none" : "translateZ(0)";
    video.style.visibility = "visible";
    video.style.opacity = "1";
    video.style.willChange = isAmazonSilkBuild ? "auto" : "auto";

    var shouldMute = item.muted;
    if (shouldMute === undefined || shouldMute === null) {
      shouldMute = true;
    }
    video.muted = shouldMute ? true : false;
    video.volume = video.muted ? 0 : 1;
    video.defaultMuted = video.muted;
    if (video.muted) {
      video.setAttribute("muted", "");
    } else {
      video.removeAttribute("muted");
    }

    video.addEventListener("loadedmetadata", function () {
      console.log("[Video] loadedmetadata event fired, videoWidth:", video.videoWidth, "duration:", video.duration);
      try {
        video.currentTime = 0;
      } catch (metadataError) {
        // ignore errors when resetting currentTime
      }
      if (!video.videoWidth || video.videoWidth === 0) {
        console.warn("Video metadata invalide, passage au suivant");
        setStatus("Video non supportee");
        advanceSlide();
        return;
      }
      fitMediaElement(video);
      var durationMs = video.duration > 0 ? video.duration * 1000 : (item.duration || 30) * 1000;
      console.log("[Video] Setting timer for", durationMs, "ms");
      state.timer = setTimeout(advanceSlide, durationMs);
    });

    video.addEventListener("ended", function () {
      if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
      }
      advanceSlide();
    });

    video.addEventListener("error", function (e) {
      console.error("[Video] Error event:", e, "Error code:", video.error ? video.error.code : "unknown");
      console.warn("Erreur de lecture video");
      setStatus("Erreur de lecture video");
      if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
      }
      advanceSlide();
    });

    video.addEventListener("stalled", function () {
      setStatus("Mise en cache de la video...");
    });

    var playbackAttempted = false;
    function tryStartPlayback() {
      if (playbackAttempted) {
        console.log("[Video] Playback already attempted, skipping");
        return;
      }
      console.log("[Video] Attempting playback...");
      playbackAttempted = true;
      fitMediaElement(video);
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(function () {
          attemptVideoPlay(video, true);
        });
      } else {
        attemptVideoPlay(video, true);
      }
    }

    video.addEventListener("loadeddata", function() {
      console.log("[Video] loadeddata event");
      tryStartPlayback();
    }, false);
    video.addEventListener("canplay", function() {
      console.log("[Video] canplay event");
      tryStartPlayback();
    }, false);
    video.addEventListener("canplaythrough", function() {
      console.log("[Video] canplaythrough event");
      tryStartPlayback();
    }, false);

    video.addEventListener("playing", function () {
      console.log("[Video] Playing started!");
      setStatus("");
      fitMediaElement(video);
    });

    return video;
  }

  function showPlaceholderForDocument(item) {
    var frame = doc.createElement("iframe");
    frame.src = item.display_url || item.url;
    frame.title = item.original_name || item.filename || "Document";
    frame.loading = "lazy";
    frame.className = "document-frame";
    frame.onerror = function () {
      console.warn("Impossible d'afficher le document", frame.src);
    };
    return frame;
  }

  function scheduleAdvance(durationSeconds) {
    var delay = Math.max(minSlideDuration, Math.round(durationSeconds || defaultImageDuration));
    clearTimer();
    state.timer = window.setTimeout(function () {
      advanceSlide();
    }, delay * 1000);
  }

  function showMedia(item) {
    if (!stage || !mediaWrapper) {
      return;
    }

    stopCurrentMedia();

    var kind = detectKind(item);
    var element = null;

    if (kind === "video") {
      element = buildVideo(item);
      state.currentVideo = element;
      setStatus("");
    } else if (kind === "image") {
      element = buildImage(item);
      setStatus("");
      scheduleAdvance(item.duration);
    } else if (kind === "pdf") {
      element = showPlaceholderForDocument(item);
      setStatus("Document affiche");
      scheduleAdvance(item.duration);
    } else {
      element = doc.createElement("div");
      element.className = "document-text-page";
      element.textContent = "Type de media non pris en charge.";
      setStatus("Type de media non pris en charge");
      scheduleAdvance(minSlideDuration);
    }

    if (element) {
      mediaWrapper.appendChild(element);
      state.currentElement = element;
      if (kind === "video") {
        try {
          fitMediaElement(element);
          element.load();
          attemptVideoPlay(element, true);
        } catch (loadError) {
          // ignore load errors, playback attempt will handle fallback
        }
      } else if (kind === "image") {
        var applyFit = function () {
          fitMediaElement(element);
        };
        if (element.complete) {
          applyFit();
        } else {
          element.addEventListener("load", applyFit, { once: true });
          element.addEventListener("error", applyFit, { once: true });
        }
      } else {
        fitMediaElement(element);
      }
    }
  }

  function advanceIndex() {
    if (!state.playlist.length) {
      state.index = -1;
      return null;
    }
    state.index = (state.index + 1) % state.playlist.length;
    return state.playlist[state.index];
  }

  function advanceSlide() {
    clearTimer();
    var next = advanceIndex();
    if (!next) {
      if (state.lastPlaylistFetchOk) {
        setStatus("Aucun media actif.");
      }
      return;
    }
    showMedia(next);
  }

  function showInitialSlide() {
    if (!state.playlist.length) {
      if (state.lastPlaylistFetchOk) {
        setStatus("Aucun media actif.");
      }
      return;
    }
    state.index = 0;
    showMedia(state.playlist[state.index]);
  }

  function computeSignature(items) {
    var summary = [];
    for (var i = 0; i < items.length; i += 1) {
      var item = items[i] || {};
      summary.push({
        id: item.id,
        order: item.order,
        updated_at: item.updated_at || item.uploaded_at,
        duration: item.duration,
        enabled: item.enabled
      });
    }
    return JSON.stringify(summary);
  }

  function refreshPlaylist() {
    return fetchJSONMain(playlistEndpoint).then(function (raw) {
      state.lastPlaylistFetchOk = true;
      var items = isArray(raw) ? raw : [];
      var signature = computeSignature(items);
      var changed = signature !== state.playlistSignature;
      if (changed) {
        state.playlistSignature = signature;
        var sorted = items.slice ? items.slice() : items.concat();
        sorted.sort(function (a, b) {
          var ao = (a && a.order !== undefined && a.order !== null) ? Number(a.order) : 0;
          var bo = (b && b.order !== undefined && b.order !== null) ? Number(b.order) : 0;
          return ao - bo;
        });
        state.playlist = sorted;
        if (state.running) {
          state.index = -1;
          advanceSlide();
        }
      }
      return changed;
    }).catch(function (error) {
      state.lastPlaylistFetchOk = false;
      console.warn("Impossible de recuperer la playlist:", error);
      setStatus("Impossible de recuperer la playlist");
      return false;
    });
  }

  function startPlaylistPolling() {
    if (state.playlistPoller) {
      window.clearInterval(state.playlistPoller);
    }
    state.playlistPoller = window.setInterval(function () {
      refreshPlaylist();
    }, playlistRefreshMs);
  }

  function stopPlaylistPolling() {
    if (state.playlistPoller) {
      window.clearInterval(state.playlistPoller);
      state.playlistPoller = null;
    }
  }

  function prepareLayout() {
    syncViewportHeight();
    if (placeholder) {
      placeholder.hidden = true;
    }
    if (stage) {
      stage.hidden = false;
    }
    doc.documentElement.classList.add("slideshow-active");
    if (doc.body) {
      doc.body.classList.add("slideshow-active");
    }
  }

  function resetLayout() {
    doc.documentElement.classList.remove("slideshow-active");
    if (doc.body) {
      doc.body.classList.remove("slideshow-active");
    }
    if (placeholder) {
      placeholder.hidden = false;
    }
    if (stage) {
      stage.hidden = true;
    }
  }

  function tryEnterFullscreen(container) {
    return new Promise(function (resolve) {
      if (!container) {
        resolve();
        return;
      }
      var request = container.requestFullscreen ||
        container.webkitRequestFullscreen ||
        container.mozRequestFullScreen ||
        container.msRequestFullscreen;
      if (!request) {
        resolve();
        return;
      }
      try {
        var result = request.call(container);
        if (result && typeof result.then === "function") {
          result.then(function () {
            resolve();
          }).catch(function () {
            resolve();
          });
        } else {
          resolve();
        }
      } catch (error) {
        console.warn("Plein ecran non disponible:", error);
        resolve();
      }
    });
  }

  function startSlideshow() {
    if (state.running || state.starting) {
      return;
    }
    state.starting = true;
    setStatus("Chargement du diaporama...");

    var container = doc.getElementById("slideshow-container");

    var startPromise = tryEnterFullscreen(container)
      .then(function () {
        prepareLayout();
        return refreshPlaylist();
      })
      .then(function () {
        if (!state.playlist.length) {
          if (state.lastPlaylistFetchOk) {
            setStatus("Aucun media actif");
          }
          resetLayout();
          state.running = false;
          return;
        }
        state.running = true;
        if ('wakeLock' in navigator) {
          navigator.wakeLock.request('screen').then(function (lock) {
            state.wakeLock = lock;
          }).catch(function (err) {
            console.warn('Wake lock failed:', err);
          });
        }
        startClock();
        startPlaylistPolling();
        showInitialSlide();
        setStatus("");
      });

    startPromise.catch(function (error) {
      console.error("Impossible de demarrer le diaporama:", error);
      setStatus("Impossible de demarrer le diaporama");
      try {
        resetLayout();
      } catch (resetError) {
        console.warn("Erreur lors du reset du layout:", resetError);
      }
    }).then(function () {
      state.starting = false;
    });
  }

  function stopSlideshow() {
    stopPlaylistPolling();
    stopCurrentMedia();
    stopClock();
    resetLayout();
    state.running = false;
    state.starting = false;
    if (state.wakeLock) {
      state.wakeLock.release();
      state.wakeLock = null;
    }
  }

  function handleVisibilityChange() {
    if (doc.hidden) {
      clearTimer();
    } else if (state.running && !state.currentVideo && state.playlist.length) {
      state.timer = window.setTimeout(function () {
        advanceSlide();
      }, minSlideDuration * 1000);
    }
    if (!doc.hidden) {
      syncViewportHeight();
      fitCurrentMedia();
    }
  }

  function handleFullscreenChange() {
    var brand = doc.getElementById("slideshow-brand");
    if (brand) {
      brand.style.zIndex = "10000";
    }
    if (state.currentVideo) {
      attemptVideoPlay(state.currentVideo, false);
    }
    syncViewportHeight();
  }

  function setupFullscreenListeners() {
    var eventNames = [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange"
    ];
    for (var i = 0; i < eventNames.length; i += 1) {
      doc.addEventListener(eventNames[i], handleFullscreenChange);
    }
  }

  function setup() {
    syncViewportHeight();
    
    // Start the clock immediately
    startClock();
    
    if (startButton) {
      startButton.addEventListener("click", function (event) {
        if (event && typeof event.preventDefault === "function") {
          event.preventDefault();
        }
        startSlideshow();
      });
    }

    doc.addEventListener("visibilitychange", handleVisibilityChange);
    setupFullscreenListeners();

    window.addEventListener("beforeunload", function () {
      stopSlideshow();
    });

    window.addEventListener("resize", function () {
      if (viewportResizeTimer) {
        window.clearTimeout(viewportResizeTimer);
      }
      viewportResizeTimer = window.setTimeout(function () {
        viewportResizeTimer = null;
        syncViewportHeight();
        fitCurrentMedia();
      }, 150);
    });

    // Visual Viewport API listener - critical for detecting menu bar show/hide on mobile browsers
    if (window.visualViewport && typeof window.visualViewport.addEventListener === "function") {
      console.log("Installing visualViewport listeners for menu bar detection");
      
      window.visualViewport.addEventListener("resize", function () {
        if (viewportResizeTimer) {
          window.clearTimeout(viewportResizeTimer);
        }
        viewportResizeTimer = window.setTimeout(function () {
          viewportResizeTimer = null;
          console.log("visualViewport resize detected");
          syncViewportHeight();
          fitCurrentMedia();
        }, 100);
      });
      
      window.visualViewport.addEventListener("scroll", function () {
        // Scroll can trigger menu bar appearance on some browsers
        if (viewportResizeTimer) {
          window.clearTimeout(viewportResizeTimer);
        }
        viewportResizeTimer = window.setTimeout(function () {
          viewportResizeTimer = null;
          syncViewportHeight();
          fitCurrentMedia();
        }, 100);
      });
    }

    if (window.screen && window.screen.orientation && typeof window.screen.orientation.addEventListener === "function") {
      window.screen.orientation.addEventListener("change", function () {
        syncViewportHeight();
        fitCurrentMedia();
      });
    } else if (typeof window.addEventListener === "function") {
      window.addEventListener("orientationchange", function () {
        if (viewportResizeTimer) {
          window.clearTimeout(viewportResizeTimer);
        }
        viewportResizeTimer = window.setTimeout(function () {
          viewportResizeTimer = null;
          syncViewportHeight();
          fitCurrentMedia();
        }, 100);
      });
    }

    if (autoStart) {
      startSlideshow();
    }
  }

  setup();
})();
