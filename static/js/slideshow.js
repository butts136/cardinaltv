const stage = document.querySelector("#slideshow-stage");
const frame = document.querySelector(".slideshow-frame");
const canvas = document.querySelector(".slideshow-canvas");
const mediaWrapper = document.querySelector("#media-wrapper");
const statusOverlay = document.querySelector("#slideshow-overlay");
const statusLabel = document.querySelector("#slideshow-status");
const overlayContainer = document.querySelector("#slideshow-brand");
const overlayLogo = document.querySelector("#overlay-logo");
const overlayContent = document.querySelector("#overlay-content");

const rootElement = document.documentElement;
const urlParams = new URLSearchParams(window.location.search);

const DEFAULT_OVERLAY = {
  enabled: true,
  mode: "clock",
  height_vh: 5,
  background_color: "#f0f0f0",
  text_color: "#111111",
  logo_path: "static/img/logo-groupe-cardinal.png",
  ticker_text: "Bienvenue sur Cardinal TV",
};

const DEFAULT_TEAM_SLIDE = {
  enabled: false,
  order_index: 0,
  duration: 10,
  card_min_duration: 6,
};

const DEFAULT_OPEN_DAYS = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false,
};

const DEFAULT_BIRTHDAY_SLIDE = {
  enabled: false,
  order_index: 0,
  duration: 12,
  background_url: null,
  background_mimetype: null,
  background_label: null,
  title_text: "Anniversaire à venir",
  title_font_size: 64,
  title_color: "#ffffff",
  title_y_percent: 50,
  open_days: { ...DEFAULT_OPEN_DAYS },
};

const BIRTHDAY_TEXT_OPTIONS_DEFAULT = {
  font_size: 48,
  font_family: "",
  width_percent: 100,
  height_percent: 0,
  color: "#ffffff",
  underline: false,
  offset_x_percent: 0,
  offset_y_percent: 0,
  curve: 0,
  angle: 0,
};

const BIRTHDAY_FIXED_COPY = {
  before: {
    text1: "(Texte 1)",
    text2: "(Texte 2)",
    text3: "(Texte 3)",
  },
  day: {
    text1: "(Texte 1)",
    text2: "(Texte 2)",
    text3: "(Texte 3)",
  },
  weekend: {
    text1: "(Texte 1)",
    text2: "(Texte 2)",
    text3: "(Texte 3)",
  },
};

const TEAM_SLIDE_SCALE = 1.25;

const TEAM_CARDS_PER_PAGE = 4;
const TEAM_EMPLOYEES_REFRESH_MS = 15_000;
const TEAM_TITLE_HOLD_MS = 3000;

const TEAM_SLIDE_ID = "__team_slide_auto__";
const BIRTHDAY_SLIDE_ID = "__birthday_slide_auto__";
const BASE_CANVAS_WIDTH = Number(canvas?.dataset.baseWidth) || 1920;
const BASE_CANVAS_HEIGHT = Number(canvas?.dataset.baseHeight) || 1080;
const OVERLAY_DISABLED = true;
const TEAM_SCROLL_OVERRUN_PX = 48;
const BIRTHDAY_VARIANTS = ["before", "day", "weekend"];
const WEEKDAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WEEKDAY_LABELS_FR = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];
const DAY_LABEL_PLURAL = { singular: "jour", plural: "jours" };

const skipState = new Map();
let playlist = [];
let playlistSignature = "";
let currentIndex = -1;
let currentId = null;
let playbackTimer = null;
let documentTimer = null;
let documentPlayback = null;
let playlistRefreshTimer = null;
let wakeLock = null;
let slideshowRunning = false;
let isStarting = false;
let clockTimer = null;
let currentVideo = null;
let overlaySettings = { ...DEFAULT_OVERLAY };
let overlaySignature = "";
let teamSlideSettings = { ...DEFAULT_TEAM_SLIDE };
let birthdaySlideSettings = { ...DEFAULT_BIRTHDAY_SLIDE };
let teamEmployeesData = [];
let teamEmployeesPromise = null;
let teamRotationTimer = null;
let lastTeamEmployeesFetch = 0;
let autoStartRequested = false;
let keepAwakeVideo = null;
let keepAwakeCanvas = null;
let keepAwakeAnimationFrame = null;
let teamScrollFrame = null;
let teamScrollEndTimer = null;
let teamScrollStartTimer = null;
let birthdayEmployeesData = null;
const birthdayVariantConfigs = {};
let lastBirthdayFetch = 0;
const BIRTHDAY_REFRESH_MS = 60_000;
const BIRTHDAY_COUNTDOWN_DAYS = 3;

try {
  if (sessionStorage.getItem("cardinal_auto_slideshow") === "1") {
    autoStartRequested = true;
    sessionStorage.removeItem("cardinal_auto_slideshow");
  }
} catch (error) {
  // ignore storage errors
}

if (urlParams.get("auto") === "1") {
  autoStartRequested = true;
}

if (autoStartRequested) {
  rootElement.classList.add("auto-slideshow");
}

const updateCanvasScale = () => {
  if (!frame || !canvas) {
    return;
  }
  const rect = frame.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return;
  }
  const scale = Math.min(rect.width / BASE_CANVAS_WIDTH, rect.height / BASE_CANVAS_HEIGHT);
  canvas.style.setProperty("--slideshow-scale", scale.toString());
};

if (frame && "ResizeObserver" in window) {
  const ro = new ResizeObserver(updateCanvasScale);
  ro.observe(frame);
} else {
  window.addEventListener("resize", updateCanvasScale);
}

const TIMEZONE = "America/Toronto";
const clockDateFormatter = new Intl.DateTimeFormat("fr-CA", {
  timeZone: TIMEZONE,
  dateStyle: "long",
});
const clockTimeFormatter = new Intl.DateTimeFormat("fr-CA", {
  timeZone: TIMEZONE,
  timeStyle: "medium",
});

const isClockModeActive = () => overlaySettings.enabled && overlaySettings.mode === "clock";

const updateClock = () => {
  if (!isClockModeActive()) {
    return;
  }
  const now = new Date();
  const dateText = clockDateFormatter.format(now);
  const timeText = clockTimeFormatter.format(now);
  overlayContent.querySelector(".clock-text")?.remove();
  const clockEl = document.createElement("div");
  clockEl.className = "clock-text";
  clockEl.textContent = `${dateText} • ${timeText}`;
  overlayContent.appendChild(clockEl);
};

const startClock = () => {
  stopClock();
  if (!isClockModeActive()) {
    return;
  }
  updateClock();
  clockTimer = setInterval(updateClock, 1000);
};

const stopClock = () => {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
};

const applyOverlaySettings = (input = {}) => {
  if (OVERLAY_DISABLED) {
    overlaySettings = { ...DEFAULT_OVERLAY, enabled: false };
    if (overlayContent) {
      overlayContent.innerHTML = "";
    }
    if (overlayLogo) {
      overlayLogo.style.display = "none";
    }
    if (overlayContainer) {
      overlayContainer.hidden = true;
      overlayContainer.style.display = "none";
    }
    stopClock();
    return;
  }

  overlaySettings = {
    ...DEFAULT_OVERLAY,
    ...input,
  };

  if (!overlayContainer) {
    return;
  }

  if (!overlaySettings.enabled) {
    overlayContainer.hidden = true;
    overlayContent.innerHTML = "";
    stopClock();
    return;
  }

  const mode = overlaySettings.mode === "ticker" ? "ticker" : "clock";
  const heightPercent = Math.max(1, Number(overlaySettings.height_vh) || DEFAULT_OVERLAY.height_vh);
  const overlayPixels = Math.round((heightPercent / 100) * BASE_CANVAS_HEIGHT);
  const textColor = overlaySettings.text_color || DEFAULT_OVERLAY.text_color;
  const background = overlaySettings.background_color || DEFAULT_OVERLAY.background_color;
  const logoPath = overlaySettings.logo_path || DEFAULT_OVERLAY.logo_path;

  rootElement.style.setProperty("--overlay-height", `${overlayPixels}px`);
  rootElement.style.setProperty("--overlay-bg", background);
  rootElement.style.setProperty("--overlay-fg", textColor);

  if (overlayLogo) {
    overlayLogo.src = logoPath;
    overlayLogo.style.display = logoPath ? "" : "none";
  }

  overlayContainer.hidden = false;
  overlayContent.innerHTML = "";
  stopClock();

  if (mode === "ticker") {
    const wrapper = document.createElement("div");
    wrapper.className = "ticker-wrapper";
    const track = document.createElement("div");
    track.className = "ticker-track";
    track.textContent = overlaySettings.ticker_text || "";
    wrapper.appendChild(track);
    overlayContent.appendChild(wrapper);
  } else {
    const clockEl = document.createElement("div");
    clockEl.className = "clock-text";
    overlayContent.appendChild(clockEl);
    startClock();
  }
};

const fetchJSON = async (url, options = {}) => {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Requête échouée (${response.status})`);
  }
  return response.json();
};

const loadBirthdayVariantConfig = async (variant) => {
  if (!variant) return null;
  if (birthdayVariantConfigs[variant]) {
    return birthdayVariantConfigs[variant];
  }
  try {
    const data = await fetchJSON(`api/birthday-slide/config/${variant}`);
    const cfg = (data && data.config) || {};
    birthdayVariantConfigs[variant] = cfg;
    return cfg;
  } catch (error) {
    console.error("Impossible de charger la configuration Anniversaire", variant, error);
    birthdayVariantConfigs[variant] = null;
    return null;
  }
};

const preloadBirthdayVariants = async () => {
  await Promise.all(BIRTHDAY_VARIANTS.map((variant) => loadBirthdayVariantConfig(variant)));
};

const normalizeOpenDays = (raw = {}) => {
  const base = { ...DEFAULT_OPEN_DAYS };
  if (!raw || typeof raw !== "object") {
    return base;
  }
  return WEEKDAY_KEYS.reduce((acc, day) => {
    acc[day] = raw[day] === undefined ? base[day] : Boolean(raw[day]);
    return acc;
  }, {});
};

const computeAnnounceDate = (targetDate, openDays) => {
  const normalized = normalizeOpenDays(openDays);
  if (!(targetDate instanceof Date) || Number.isNaN(targetDate)) {
    return targetDate;
  }
  const candidate = new Date(targetDate.getTime());
  for (let i = 0; i < 7; i += 1) {
    const key = WEEKDAY_KEYS[candidate.getUTCDay()];
    if (normalized[key]) {
      return candidate;
    }
    candidate.setUTCDate(candidate.getUTCDate() - 1);
  }
  return targetDate;
};

const formatBirthdayMeta = (birthdayDate) => {
  if (!(birthdayDate instanceof Date) || Number.isNaN(birthdayDate)) {
    return { weekday: "", fullDate: "" };
  }
  const weekday = WEEKDAY_LABELS_FR[birthdayDate.getUTCDay()] || "";
  const dateText = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(birthdayDate);
  return { weekday, fullDate: dateText };
};

const refreshOverlaySettings = async () => {
  try {
    const data = await fetchJSON("api/settings");
    const signature = JSON.stringify(data || {});
    if (signature === overlaySignature) {
      return;
    }
    overlaySignature = signature;
    const overlay = (data && data.overlay) || {};
    applyOverlaySettings(overlay);
    birthdaySlideSettings = {
      ...DEFAULT_BIRTHDAY_SLIDE,
      ...(data && data.birthday_slide ? data.birthday_slide : {}),
      open_days: normalizeOpenDays(data?.birthday_slide?.open_days),
    };
    teamSlideSettings = {
      ...DEFAULT_TEAM_SLIDE,
      ...(data && data.team_slide ? data.team_slide : {}),
    };
    await preloadBirthdayVariants();
  } catch (error) {
    console.warn("Impossible de charger les paramètres:", error);
  }
};

const setStatus = (message) => {
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
};

const getExtension = (name) => {
  if (!name) {
    return "";
  }
  const lower = name.toLowerCase();
  const index = lower.lastIndexOf(".");
  if (index === -1) {
    return "";
  }
  return lower.slice(index + 1);
};

const detectMediaKind = (item) => {
  if (item.team_slide) {
    return "team";
  }
  if (item.birthday_slide) {
    return "birthday";
  }
  if (Array.isArray(item.page_urls) && item.page_urls.length) {
    return "document";
  }
  if (Array.isArray(item.text_pages) && item.text_pages.length) {
    return "document";
  }
  const type = (item.display_mimetype || item.mimetype || "").toLowerCase();
  if (type.startsWith("image/")) {
    return "image";
  }
  if (type.startsWith("video/")) {
    return "video";
  }
  if (type === "application/pdf") {
    return "pdf";
  }
  const extension = getExtension(item.display_filename || item.filename);
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "avif", "heic", "heif"].includes(extension)) {
    return "image";
  }
  if (["mp4", "m4v", "mov", "webm", "mkv", "avi", "mpg", "mpeg"].includes(extension)) {
    return "video";
  }
  if (extension === "pdf") {
    return "pdf";
  }
  if (["doc", "docx", "txt", "rtf", "md"].includes(extension)) {
    return "document";
  }
  return "other";
};

const computeSignature = (items) =>
  JSON.stringify(
    items.map((item) => ({
      id: item.id,
      order: item.order,
      duration: item.duration,
      enabled: item.enabled,
      start_at: item.start_at,
      end_at: item.end_at,
      filename: item.filename,
      skip_rounds: item.skip_rounds || 0,
      page_count: Array.isArray(item.page_urls) ? item.page_urls.length : 0,
      text_count: Array.isArray(item.text_pages) ? item.text_pages.length : 0,
      mimetype: item.display_mimetype || item.mimetype,
    }))
  );

const noteItemDisplayed = (item, { maintainSkip = false } = {}) => {
  const configured = Math.max(0, Number(item.skip_rounds) || 0);
  let entry = skipState.get(item.id);
  if (!entry) {
    entry = { remaining: 0, configured };
    skipState.set(item.id, entry);
  }
  entry.configured = configured;
  if (!maintainSkip) {
    entry.remaining = configured;
  }
};

const shouldSkipItem = (item) => {
  const entry = skipState.get(item.id);
  if (!entry) {
    return false;
  }
  if (entry.remaining > 0) {
    entry.remaining -= 1;
    return true;
  }
  return false;
};

const clearTeamSlideTimers = () => {
  if (teamRotationTimer) {
    clearTimeout(teamRotationTimer);
    teamRotationTimer = null;
  }
  if (teamScrollFrame) {
    cancelAnimationFrame(teamScrollFrame);
    teamScrollFrame = null;
  }
  if (teamScrollEndTimer) {
    clearTimeout(teamScrollEndTimer);
    teamScrollEndTimer = null;
  }
  if (teamScrollStartTimer) {
    clearTimeout(teamScrollStartTimer);
    teamScrollStartTimer = null;
  }
};

const clearDocumentPlayback = () => {
  if (documentTimer) {
    clearTimeout(documentTimer);
    documentTimer = null;
  }
  if (documentPlayback && typeof documentPlayback.cancel === "function") {
    try {
      documentPlayback.cancel();
    } catch (error) {
      // ignore
    }
  }
  documentPlayback = null;
};

const stopCurrentVideo = () => {
  if (!currentVideo) {
    return;
  }
  try {
    currentVideo.pause();
  } catch (error) {
    // ignore
  }
  currentVideo.removeAttribute("src");
  currentVideo.load?.();
  currentVideo = null;
};

const clearPlaybackTimer = () => {
  if (playbackTimer) {
    clearTimeout(playbackTimer);
    playbackTimer = null;
  }
  clearDocumentPlayback();
  clearTeamSlideTimers();
  stopCurrentVideo();
};

const startImageSequence = (item, pageUrls, durationSeconds) => {
  let cancelled = false;
  let pageIndex = 0;
  const total = pageUrls.length || 1;

  const scheduleNext = (advance) => {
    if (cancelled) {
      return;
    }
    if (documentTimer) {
      clearTimeout(documentTimer);
    }
    documentTimer = setTimeout(() => {
      if (cancelled) {
        return;
      }
      if (advance) {
        void advanceSlide().catch((error) => console.error(error));
      } else {
        pageIndex = Math.min(pageIndex + 1, total - 1);
        render();
      }
    }, durationSeconds * 1000);
  };

  const render = () => {
    if (cancelled) {
      return;
    }
    const src = pageUrls[pageIndex];
    const img = document.createElement("img");
    img.src = src;
    img.alt = `${item.original_name || item.filename} — Page ${pageIndex + 1}`;

    mediaWrapper.innerHTML = "";
    mediaWrapper.appendChild(img);

    if (img.complete) {
      scheduleNext(pageIndex + 1 >= total);
    } else {
      const done = () => scheduleNext(pageIndex + 1 >= total);
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    }
  };

  render();

  return {
    cancel: () => {
      cancelled = true;
      if (documentTimer) {
        clearTimeout(documentTimer);
        documentTimer = null;
      }
    },
  };
};

const startTextSequence = (item, pages, durationSeconds) => {
  let cancelled = false;
  let pageIndex = 0;
  const total = pages.length || 1;

  const scheduleNext = (advance) => {
    if (cancelled) {
      return;
    }
    if (documentTimer) {
      clearTimeout(documentTimer);
    }
    documentTimer = setTimeout(() => {
      if (cancelled) {
        return;
      }
      if (advance) {
        void advanceSlide().catch((error) => console.error(error));
      } else {
        pageIndex = Math.min(pageIndex + 1, total - 1);
        render();
      }
    }, durationSeconds * 1000);
  };

  const render = () => {
    if (cancelled) {
      return;
    }
    const container = document.createElement("pre");
    container.className = "document-text-page";
    container.textContent = pages[pageIndex] || "";

    mediaWrapper.innerHTML = "";
    mediaWrapper.appendChild(container);

    scheduleNext(pageIndex + 1 >= total);
  };

  render();

  return {
    cancel: () => {
      cancelled = true;
      if (documentTimer) {
        clearTimeout(documentTimer);
        documentTimer = null;
      }
    },
  };
};

const startPdfDocument = async (item, durationSeconds, urlOverride) => {
  const url = urlOverride || item.display_url || item.url;
  if (!window.pdfjsLib) {
    setStatus("Affichage PDF indisponible sur ce navigateur.");
    documentTimer = setTimeout(() => {
      void advanceSlide().catch((error) => console.error(error));
    }, durationSeconds * 1000);
    return {
      cancel: () => {
        if (documentTimer) {
          clearTimeout(documentTimer);
          documentTimer = null;
        }
      },
    };
  }

  const loadingTask = window.pdfjsLib.getDocument({ url });
  let cancelled = false;
  let pdfDoc = null;

  const cleanup = () => {
    cancelled = true;
    if (documentTimer) {
      clearTimeout(documentTimer);
      documentTimer = null;
    }
    try {
      loadingTask.destroy();
    } catch (error) {
      // ignore
    }
    if (pdfDoc) {
      try {
        pdfDoc.cleanup();
      } catch (error) {
        // ignore
      }
      pdfDoc = null;
    }
  };

  try {
    pdfDoc = await loadingTask.promise;
  } catch (error) {
    console.warn("Impossible de charger le PDF:", error);
    setStatus("Impossible de charger le document PDF.");
    documentTimer = setTimeout(() => {
      void advanceSlide().catch((err) => console.error(err));
    }, durationSeconds * 1000);
    return {
      cancel: cleanup,
    };
  }

  const total = pdfDoc.numPages || 1;

  const scheduleNext = (shouldAdvance, currentPageNumber = 1) => {
    if (cancelled) {
      return;
    }
    if (documentTimer) {
      clearTimeout(documentTimer);
    }
    documentTimer = setTimeout(() => {
      if (cancelled) {
        return;
      }
      if (shouldAdvance) {
        void advanceSlide().catch((error) => console.error(error));
      } else {
        void renderPage(currentPageNumber + 1);
      }
    }, durationSeconds * 1000);
  };

  const renderPage = async (pageNumber) => {
    if (cancelled) {
      return;
    }
    let page;
    try {
      page = await pdfDoc.getPage(pageNumber);
    } catch (error) {
      console.warn("Impossible de lire la page PDF:", error);
      scheduleNext(pageNumber >= total);
      return;
    }

    const containerWidth = mediaWrapper.clientWidth || BASE_CANVAS_WIDTH;
    const containerHeight = mediaWrapper.clientHeight || BASE_CANVAS_HEIGHT;
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(containerWidth / viewport.width, containerHeight / viewport.height) || 1.25;
    const scaledViewport = page.getViewport({ scale });

    const canvasElement = document.createElement("canvas");
    canvasElement.width = scaledViewport.width;
    canvasElement.height = scaledViewport.height;
    const context = canvasElement.getContext("2d");

    try {
      await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
    } catch (error) {
      console.warn("Rendu PDF échoué:", error);
    }

    if (cancelled) {
      return;
    }

    mediaWrapper.innerHTML = "";
    mediaWrapper.appendChild(canvasElement);

    scheduleNext(pageNumber >= total, pageNumber);
  };

  void renderPage(1);

  return {
    cancel: cleanup,
  };
};

const createMediaElement = (item, kind) => {
  if (kind === "image") {
    const img = document.createElement("img");
    img.src = item.display_url || item.url;
    img.alt = item.original_name || item.filename;
    return img;
  }

  if (kind === "video") {
    const video = document.createElement("video");
    video.src = item.display_url || item.url;
    video.autoplay = true;
    video.loop = false;
    video.controls = false;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    let playbackMuted = Boolean(item.muted);
    video.muted = playbackMuted;
    video.volume = playbackMuted ? 0 : 1;
    video.preload = "auto";

    video.addEventListener("ended", () => {
      void advanceSlide().catch((error) => console.error(error));
    });

    video.addEventListener("error", () => {
      setStatus("Erreur de lecture vidéo.");
      void advanceSlide().catch((error) => console.error(error));
    });

    const attemptPlay = () => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((error) => {
          if (!playbackMuted) {
            playbackMuted = true;
            video.muted = true;
            video.volume = 0;
            video.play().catch((err) => console.warn("La lecture vidéo a échoué:", err));
          } else {
            console.warn("Lecture vidéo impossible:", error);
          }
        });
      }
    };

    attemptPlay();
    currentVideo = video;
    return video;
  }

  const frameElement = document.createElement("iframe");
  frameElement.src = item.display_url || item.url;
  frameElement.title = item.original_name || "Document";
  frameElement.loading = "lazy";
  frameElement.className = "document-frame";
  return frameElement;
};

const initialsFromName = (name = "") => {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const computeServiceDuration = (hireDate) => {
  if (!hireDate) return null;
  const start = new Date(hireDate);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  if (diffMs < 0) return null;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  let months =
    now.getFullYear() * 12 +
    now.getMonth() -
    (start.getFullYear() * 12 + start.getMonth());
  if (now.getDate() < start.getDate()) {
    months -= 1;
  }
  if (months < 0) months = 0;
  return { days, months };
};

const formatServiceLabel = (employee) => {
  const info = computeServiceDuration(employee?.hire_date);
  if (!info) return "";
  if (info.months < 1) {
    const value = Math.max(0, info.days);
    return `${value} jour${value > 1 ? "s" : ""} de service`;
  }
  return `${info.months} mois de service`;
};

const renderTeamCard = (employee) => {
  const card = document.createElement("article");
  card.className = "team-slide-card";

  const header = document.createElement("div");
  header.className = "team-slide-card-header";

  const avatar = document.createElement("div");
  avatar.className = "team-slide-card-avatar";
  if (employee.avatar_base64) {
    const img = document.createElement("img");
    img.src = `data:image/*;base64,${employee.avatar_base64}`;
    img.alt = `Avatar de ${employee.name || "Employé"}`;
    avatar.appendChild(img);
  } else {
    avatar.textContent = initialsFromName(employee.name || "");
  }

  const info = document.createElement("div");
  const nameEl = document.createElement("strong");
  nameEl.textContent = employee.name || "Employé";
  const roleEl = document.createElement("div");
  roleEl.className = "team-slide-card-role";
  roleEl.textContent = employee.role || "Poste non précisé";
  info.append(nameEl, roleEl);

  header.append(avatar, info);

  const description = document.createElement("p");
  description.className = "team-slide-card-description";
  description.textContent = employee.description || "Aucune description disponible.";

  card.append(header, description);

  const serviceLabel = formatServiceLabel(employee);
  if (serviceLabel) {
    const service = document.createElement("div");
    service.className = "team-slide-card-service";
    service.textContent = serviceLabel;
    card.append(service);
  }

  return card;
};

const ensureTeamEmployeesData = async (force = false) => {
  const now = Date.now();
  const shouldRefresh =
    force || !teamEmployeesData.length || now - lastTeamEmployeesFetch > TEAM_EMPLOYEES_REFRESH_MS;

  if (!shouldRefresh && !teamEmployeesPromise) {
    return teamEmployeesData;
  }

  if (!teamEmployeesPromise) {
    teamEmployeesPromise = fetchJSON("api/employees")
      .then((data) => {
        teamEmployeesData = Array.isArray(data.employees) ? data.employees : [];
        lastTeamEmployeesFetch = Date.now();
        return teamEmployeesData;
      })
      .catch((error) => {
        console.warn("Impossible de charger les employés pour Notre Équipe:", error);
        lastTeamEmployeesFetch = Date.now();
        teamEmployeesData = [];
        return teamEmployeesData;
      })
      .finally(() => {
        teamEmployeesPromise = null;
      });
  }
  return teamEmployeesPromise;
};

const computeNextBirthday = (birthdayStr) => {
  if (!birthdayStr) return null;
  const parts = birthdayStr.split("-");
  if (parts.length < 2) return null;
  const month = Number(parts[1] || parts[0]);
  const day = Number(parts[2] || parts[1] || 1);
  if (!Number.isFinite(month) || !Number.isFinite(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const now = new Date();
  const thisYear = now.getFullYear();
  const candidate = new Date(Date.UTC(thisYear, month - 1, day));
  const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  if (candidate < todayUtc) {
    candidate.setUTCFullYear(thisYear + 1);
  }
  return candidate;
};

const ensureBirthdayEmployeesData = async () => {
  const now = Date.now();
  if (birthdayEmployeesData && now - lastBirthdayFetch < BIRTHDAY_REFRESH_MS) {
    return birthdayEmployeesData;
  }

  const employees = await ensureTeamEmployeesData();
  const todayUtc = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  const dayMs = 24 * 60 * 60 * 1000;
  const groups = new Map();

  employees.forEach((emp) => {
    const next = computeNextBirthday(emp.birthday);
    if (!next) return;
    const announce = computeAnnounceDate(next, birthdaySlideSettings?.open_days);
    const daysToBirthday = Math.round((next - todayUtc) / dayMs);
    const daysToAnnounce = Math.round((announce - todayUtc) / dayMs);
    if (!Number.isFinite(daysToBirthday) || daysToBirthday < 0) return;
    const shiftedForClosure = announce.getTime() !== next.getTime();
    let variant = "before";
    if (daysToBirthday === 0) {
      variant = "day";
    } else if (shiftedForClosure && daysToAnnounce === 0) {
      variant = "weekend";
    }
    const displayAllowed =
      variant === "day" ||
      (variant === "before" && daysToBirthday <= BIRTHDAY_COUNTDOWN_DAYS) ||
      (variant === "weekend" && daysToAnnounce === 0);
    if (!displayAllowed) return;
    const key = next.getTime();
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push({
      birthday: next,
      announce,
      variant,
      daysUntilBirthday: daysToBirthday,
      daysUntilAnnounce: Math.max(0, daysToAnnounce),
      employees: [emp],
    });
  });

  const entries = Array.from(groups.values()).flat();
  if (!entries.length) {
    birthdayEmployeesData = null;
    lastBirthdayFetch = now;
    return null;
  }

  const configCache = {};
  for (const entry of entries) {
    if (!configCache[entry.variant]) {
      configCache[entry.variant] = await loadBirthdayVariantConfig(entry.variant);
    }
    const { weekday, fullDate } = formatBirthdayMeta(entry.birthday);
    entry.config = configCache[entry.variant];
    entry.birthday_weekday = weekday;
    entry.birthday_date = fullDate;
  }

  entries.sort((a, b) => {
    if (a.daysUntilBirthday === b.daysUntilBirthday) {
      const nameA = (a.employees[0]?.name || "").toLowerCase();
      const nameB = (b.employees[0]?.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    }
    return a.daysUntilBirthday - b.daysUntilBirthday;
  });
  entries.forEach((entry, idx) => {
    entry.idSuffix = idx;
  });

  birthdayEmployeesData = entries;
  lastBirthdayFetch = now;
  return birthdayEmployeesData;
};

const renderTeamSlide = (item, employeesList = []) => {
  clearPlaybackTimer();
  mediaWrapper.innerHTML = "";

  const employees = Array.isArray(employeesList) ? employeesList.slice() : [];
  if (!employees.length) {
    const empty = document.createElement("div");
    empty.className = "team-slide-blank";
    empty.textContent = "Aucun employé configuré.";
    mediaWrapper.appendChild(empty);
    playbackTimer = setTimeout(() => {
      void advanceSlide().catch((error) => console.error(error));
    }, Math.max(5, Number(item.duration) || 10) * 1000);
    return;
  }

  const root = document.createElement("div");
  root.className = "team-slide-frame";

  const backgroundUrl = teamSlideSettings.background_url;
  const backgroundMime = (teamSlideSettings.background_mimetype || "").toLowerCase();
  if (backgroundUrl) {
    const ext = getExtension(backgroundUrl);
    const isVideo = backgroundMime.startsWith("video/") || ["mp4", "mov", "m4v", "webm"].includes(ext);
    if (isVideo) {
      const video = document.createElement("video");
      video.className = "team-slide-video";
      video.src = backgroundUrl;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      root.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.className = "team-slide-image";
      img.src = backgroundUrl;
      img.alt = "Arrière-plan Notre Équipe";
      root.appendChild(img);
    }
  } else {
    const blankBg = document.createElement("div");
    blankBg.className = "team-slide-blank";
    root.appendChild(blankBg);
  }

  const overlay = document.createElement("div");
  overlay.className = "team-slide-overlay";
  const overlayInner = document.createElement("div");
  overlayInner.className = "team-slide-overlay-inner";

  const hasTitle = teamSlideSettings.title_enabled && teamSlideSettings.title_text;
  const titlePlaceholder = hasTitle ? document.createElement("div") : null;
  const title = hasTitle ? document.createElement("div") : null;
  if (title) {
    title.className = "team-slide-title";
    title.textContent = teamSlideSettings.title_text;
    title.style.color = teamSlideSettings.title_color || "#111";
    title.style.width = `${Math.max(10, teamSlideSettings.title_width_percent || 80)}%`;
    if (teamSlideSettings.title_background_color) {
      title.style.background = teamSlideSettings.title_background_color;
    }
    if (teamSlideSettings.title_font_size) {
      title.style.fontSize = `${teamSlideSettings.title_font_size * TEAM_SLIDE_SCALE}px`;
    }
    if (teamSlideSettings.title_underline) {
      title.style.textDecoration = "underline";
    }
  }
  if (titlePlaceholder) {
    titlePlaceholder.className = "team-slide-title-placeholder";
    overlayInner.appendChild(titlePlaceholder);
  }

  const cardsViewport = document.createElement("div");
  cardsViewport.className = "team-slide-cards-viewport team-slide-cards-viewport--masked";
  const cardsContainer = document.createElement("div");
  cardsContainer.className = "team-slide-cards";
  cardsViewport.appendChild(cardsContainer);

  overlayInner.appendChild(cardsViewport);
  if (title) {
    overlayInner.appendChild(title);
  }
  overlay.appendChild(overlayInner);
  root.appendChild(overlay);
  mediaWrapper.appendChild(root);

  cardsContainer.innerHTML = "";
  employees.forEach((emp) => cardsContainer.appendChild(renderTeamCard(emp)));
  cardsContainer.style.willChange = "transform";
  cardsContainer.style.transform = "translateY(0)";

  const cardDisplaySeconds = Math.max(
    0.5,
    Number.isFinite(Number(teamSlideSettings.card_min_duration))
      ? Number(teamSlideSettings.card_min_duration)
      : Number(item.duration) || DEFAULT_TEAM_SLIDE.card_min_duration
  );

  const viewportHeight = Math.max(1, cardsViewport.clientHeight || 0);
  const contentHeight = cardsContainer.scrollHeight;
  const overlayStyles = window.getComputedStyle(overlayInner);
  const overlayPaddingTop = Number.parseFloat(overlayStyles.paddingTop) || 0;

  let minCardHeight = Infinity;
  const cardNodes = cardsContainer.querySelectorAll(".team-slide-card");
  cardNodes.forEach((node) => {
    const h = node.getBoundingClientRect().height;
    if (Number.isFinite(h) && h > 0) {
      minCardHeight = Math.min(minCardHeight, h);
    }
  });
  if (!Number.isFinite(minCardHeight) || minCardHeight <= 0) {
    minCardHeight = 180;
  }
  const overrun = Math.max(TEAM_SCROLL_OVERRUN_PX, minCardHeight / 2);

  if (title) {
    const titleHeight = title.getBoundingClientRect().height || 0;
    if (titlePlaceholder) {
      titlePlaceholder.style.height = `${titleHeight}px`;
    }
    const overlayRect = overlayInner.getBoundingClientRect();
    const titleStartCenter = (overlayRect.height || 0) / 2;
    const titleEndCenter = overlayPaddingTop + titleHeight / 2;
    title.dataset.startCenter = String(titleStartCenter);
    title.dataset.endCenter = String(titleEndCenter);
    title.style.position = "absolute";
    title.style.left = "50%";
    title.style.top = `${titleStartCenter}px`;
    title.style.transform = "translate(-50%, -50%)";
    title.style.willChange = "transform, top";
  }

  const startOffset = viewportHeight;
  const exitOffset = -(contentHeight + overrun);
  const pixelsPerSecond =
    contentHeight > 0 ? (viewportHeight + minCardHeight) / cardDisplaySeconds : 0;
  cardsContainer.style.transform = `translateY(${startOffset}px)`;

  if (pixelsPerSecond <= 0) {
    const fallbackSeconds = Math.max(cardDisplaySeconds, Number(item.duration) || 5);
    playbackTimer = setTimeout(() => {
      void advanceSlide().catch((error) => console.error(error));
    }, fallbackSeconds * 1000);
    return;
  }

  let startTime = null;
  const titleStartCenter = title ? Number(title.dataset.startCenter) || 0 : 0;
  const titleEndCenter = title ? Number(title.dataset.endCenter) || 0 : 0;
  const titleDistance = title ? Math.max(0, titleStartCenter - titleEndCenter) : 0;

  const animateScroll = (timestamp) => {
    if (startTime == null) {
      startTime = timestamp;
    }
    const elapsedSeconds = (timestamp - startTime) / 1000;
    const traveled = elapsedSeconds * pixelsPerSecond;
    const currentOffset = startOffset - traveled;
    const clampedOffset = Math.max(currentOffset, exitOffset);
    cardsContainer.style.transform = `translateY(${clampedOffset}px)`;

    if (title && titleDistance > 0) {
      const titleTraveled = Math.min(titleDistance, elapsedSeconds * pixelsPerSecond);
      const currentCenter = titleStartCenter - titleTraveled;
      title.style.top = `${currentCenter}px`;
      title.style.transform = "translate(-50%, -50%)";
    }

    if (clampedOffset <= exitOffset) {
      teamScrollFrame = null;
      teamScrollEndTimer = null;
      void advanceSlide().catch((error) => console.error(error));
      return;
    }

    teamScrollFrame = requestAnimationFrame(animateScroll);
  };

  const holdMs = title ? TEAM_TITLE_HOLD_MS : 0;
  teamScrollStartTimer = setTimeout(() => {
    teamScrollFrame = requestAnimationFrame(animateScroll);
  }, holdMs);
};

const renderBirthdaySlide = (item) => {
  mediaWrapper.innerHTML = "";
  const settings = birthdaySlideSettings || DEFAULT_BIRTHDAY_SLIDE;
  const variant = item.birthday_variant || "before";
  const variantCfg =
    item.birthday_variant_config ||
    birthdayVariantConfigs[variant] ||
    BIRTHDAY_FIXED_COPY[variant] ||
    {};
  const daysUntilBirthday = Number.isFinite(Number(item.birthday_days_until))
    ? Number(item.birthday_days_until)
    : null;
  const birthdayWeekday = typeof item.birthday_weekday === "string" ? item.birthday_weekday : "";
  const birthdayDateText = typeof item.birthday_date === "string" ? item.birthday_date : "";
  const employees = Array.isArray(item.birthday_employees) ? item.birthday_employees : [];
  const names = employees
    .map((e) => (e && typeof e.name === "string" ? e.name.trim() : ""))
    .filter(Boolean);
  const namesText =
    names.length === 0
      ? ""
      : names.length === 1
        ? names[0]
        : `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
  const replaceTokens = (text) => {
    if (!text) return "";
    const dayLabel =
      daysUntilBirthday === 1 ? DAY_LABEL_PLURAL.singular : DAY_LABEL_PLURAL.plural;
    return text
      .replace("[days]", daysUntilBirthday != null ? String(daysUntilBirthday) : "")
      .replace("[day_label]", dayLabel)
      .replace("[birthday_weekday]", birthdayWeekday)
      .replace("[date]", birthdayDateText)
      .replace("[name]", namesText);
  };

  const durationSeconds = Math.max(
    1,
    Math.round(Number(item.duration) || settings.duration || DEFAULT_BIRTHDAY_SLIDE.duration)
  );
  const frameEl = document.createElement("div");
  frameEl.className = "birthday-slide-frame";

  const backdrop = document.createElement("div");
  backdrop.className = "birthday-slide-backdrop";
  const bgUrl = variantCfg.background_url || item.background_url || settings.background_url;
  const bgMime = (
    variantCfg.background_mimetype ||
    item.background_mimetype ||
    settings.background_mimetype ||
    ""
  ).toLowerCase();
  const bgExt = getExtension(bgUrl || "");
  const isVideo =
    bgMime.startsWith("video/") || ["mp4", "m4v", "mov", "webm", "mkv"].includes(bgExt);
  if (bgUrl && isVideo) {
    const video = document.createElement("video");
    video.className = "birthday-slide-media birthday-slide-video";
    video.src = bgUrl;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    backdrop.appendChild(video);
    currentVideo = video;
  } else if (bgUrl) {
    const img = document.createElement("img");
    img.className = "birthday-slide-media birthday-slide-image";
    img.src = bgUrl;
    img.alt = "Arrière-plan anniversaire";
    backdrop.appendChild(img);
  } else {
    backdrop.classList.add("birthday-slide-backdrop--fallback");
  }
  frameEl.appendChild(backdrop);

  const overlay = document.createElement("div");
  overlay.className = "birthday-slide-overlay";
  const linesWrapper = document.createElement("div");
  linesWrapper.className = "birthday-slide-lines";
  const lines = [
    replaceTokens(variantCfg.text1 ?? settings.title_text ?? ""),
    replaceTokens(variantCfg.text2 ?? ""),
    replaceTokens(variantCfg.text3 ?? ""),
  ];
  const optsList = [
    variantCfg.text1_options || BIRTHDAY_TEXT_OPTIONS_DEFAULT,
    variantCfg.text2_options || BIRTHDAY_TEXT_OPTIONS_DEFAULT,
    variantCfg.text3_options || BIRTHDAY_TEXT_OPTIONS_DEFAULT,
  ];
  lines.forEach((text, idx) => {
    const line = document.createElement("div");
    line.className = "birthday-slide-line" + (idx === 0 ? " birthday-slide-line--primary" : "");
    line.textContent = text;
    const opts = optsList[idx] || BIRTHDAY_TEXT_OPTIONS_DEFAULT;
    const color = opts.color || settings.title_color;
    if (idx === 0 && settings.title_font_size) {
      line.style.fontSize = `${settings.title_font_size}px`;
    }
    if (opts.font_size) {
      line.style.fontSize = `${opts.font_size}px`;
    }
    if (color) {
      line.style.color = color;
    }
    line.style.fontFamily = opts.font_family || "";
    line.style.textDecoration = opts.underline ? "underline" : "none";
    line.style.maxWidth = opts.width_percent ? `${opts.width_percent}%` : "none";
    if (opts.height_percent) {
      line.style.minHeight = `${opts.height_percent}%`;
    }
    line.style.whiteSpace = "pre";
    const offsetX = Number.isFinite(Number(opts.offset_x_percent)) ? Number(opts.offset_x_percent) : 0;
    const offsetY = Number.isFinite(Number(opts.offset_y_percent)) ? Number(opts.offset_y_percent) : 0;
    const left = Math.min(100, Math.max(0, 50 + offsetX / 2));
    const top = Math.min(100, Math.max(0, 50 - offsetY / 2));
    line.style.left = `${left}%`;
    line.style.top = `${top}%`;
    const rotation = `rotate(${opts.angle || 0}deg)`;
    line.style.transform = `translate(-50%, -50%) ${rotation}`;
    linesWrapper.appendChild(line);
  });
  const pos = Number.isFinite(Number(settings.title_y_percent))
    ? Math.min(100, Math.max(0, Number(settings.title_y_percent)))
    : DEFAULT_BIRTHDAY_SLIDE.title_y_percent;
  overlay.style.justifyContent = "flex-start";
  overlay.style.paddingTop = `${pos}%`;
  overlay.style.alignItems = "center";
  overlay.append(linesWrapper);
  frameEl.appendChild(overlay);

  mediaWrapper.appendChild(frameEl);

  playbackTimer = setTimeout(() => {
    void advanceSlide().catch((error) => console.error(error));
  }, durationSeconds * 1000);
};

const buildTeamSlideItem = () => ({
  id: TEAM_SLIDE_ID,
  team_slide: true,
  original_name: "Notre Équipe",
  filename: TEAM_SLIDE_ID,
  duration: teamSlideSettings.duration || 10,
  enabled: true,
  skip_rounds: 0,
  mimetype: "application/x-team-slide",
  display_mimetype: "application/x-team-slide",
  page_urls: [],
  text_pages: [],
  order: Number(teamSlideSettings.order_index) || 0,
});

const buildBirthdaySlideItem = (birthdayData) => {
  const filename = birthdaySlideSettings.background_path || BIRTHDAY_SLIDE_ID;
  const mimetype =
    birthdaySlideSettings.background_mimetype || "application/x-birthday-slide";
  const duration =
    Math.max(1, Number(birthdaySlideSettings.duration) || DEFAULT_BIRTHDAY_SLIDE.duration);
  const itemId =
    birthdayData && birthdayData.idSuffix != null
      ? `${BIRTHDAY_SLIDE_ID}_${birthdayData.idSuffix}`
      : BIRTHDAY_SLIDE_ID;
  return {
    id: itemId,
    birthday_slide: true,
    original_name: "Anniversaire",
    filename,
    duration,
    enabled: true,
    skip_rounds: 0,
    mimetype,
    display_mimetype: mimetype,
    background_url: birthdaySlideSettings.background_url,
    background_mimetype: birthdaySlideSettings.background_mimetype,
    background_label: birthdaySlideSettings.background_label,
    order: Number(birthdaySlideSettings.order_index) || 0,
    birthday_variant: birthdayData?.variant || "before",
    birthday_days_until: birthdayData?.daysUntilBirthday,
    birthday_days_until_announce: birthdayData?.daysUntilAnnounce,
    birthday_weekday: birthdayData?.birthday_weekday,
    birthday_date: birthdayData?.birthday_date,
    birthday_employees: Array.isArray(birthdayData?.employees)
      ? birthdayData.employees.map((e) => ({ id: e.id, name: e.name }))
      : [],
    birthday_variant_config: birthdayData?.config || null,
  };
};

const injectAutoSlidesIntoPlaylist = async (items) => {
  const base = Array.isArray(items) ? [...items] : [];
  const autoEntries = [];

  if (birthdaySlideSettings.enabled) {
    const birthdayList = await ensureBirthdayEmployeesData();
    if (Array.isArray(birthdayList) && birthdayList.length) {
      const baseIndex = Math.min(
        Math.max(0, Number.parseInt(birthdaySlideSettings.order_index, 10) || 0),
        base.length
      );
      const birthdayStart = baseIndex;
      birthdayList.forEach((data, idx) => {
        const birthdayItem = buildBirthdaySlideItem(data);
        autoEntries.push({
          id: birthdayItem.id,
          index: Math.min(birthdayStart + idx, base.length + autoEntries.length),
          item: birthdayItem,
        });
      });
    }
  }

  if (teamSlideSettings.enabled) {
    await ensureTeamEmployeesData();
    if (teamEmployeesData.length) {
      const teamItem = buildTeamSlideItem();
      const teamBaseIndex = Math.min(
        Math.max(0, Number.parseInt(teamSlideSettings.order_index, 10) || 0),
        base.length
      );
      autoEntries.push({
        id: teamItem.id,
        index: Math.min(teamBaseIndex, base.length + autoEntries.length),
        item: teamItem,
      });
    }
  }

  const playlistWithAuto = [...base];
  autoEntries
    .sort((a, b) => (a.index === b.index ? a.id.localeCompare(b.id) : a.index - b.index))
    .forEach(({ index, item }) => {
      const insertionIndex = Math.min(Math.max(0, index), playlistWithAuto.length);
      playlistWithAuto.splice(insertionIndex, 0, item);
    });
  return playlistWithAuto;
};

const handleEmptyPlaylist = () => {
  clearPlaybackTimer();
  mediaWrapper.innerHTML = "";
  if (stage) {
    stage.hidden = false;
  }
  setStatus("Aucun média actif. Activez des fichiers dans l'interface principale.");
};

const refreshPlaylist = async () => {
  let data = [];
  try {
    data = await fetchJSON("api/media?active=1");
  } catch (error) {
    console.warn("Impossible de rafraîchir la playlist:", error);
    return { empty: !playlist.length, restart: false, changed: false };
  }

  if (!Array.isArray(data)) {
    data = [];
  }

  const enhanced = await injectAutoSlidesIntoPlaylist(data);
  const signature = computeSignature(enhanced);
  const changed = signature !== playlistSignature;
  playlistSignature = signature;
  playlist = enhanced;

  const idSet = new Set(playlist.map((item) => item.id));
  for (const key of Array.from(skipState.keys())) {
    if (!idSet.has(key)) {
      skipState.delete(key);
    }
  }

  playlist.forEach((item) => {
    const configured = Math.max(0, Number(item.skip_rounds) || 0);
    const entry = skipState.get(item.id);
    if (!entry) {
      skipState.set(item.id, { remaining: 0, configured });
    } else {
      entry.configured = configured;
      entry.remaining = Math.min(entry.remaining, configured);
    }
  });

  if (!playlist.length) {
    currentIndex = -1;
    currentId = null;
    return { empty: true, restart: false, changed };
  }

  if (currentId == null) {
    currentIndex = 0;
    currentId = playlist[0].id;
    return { empty: false, restart: true, changed };
  }

  const newIndex = playlist.findIndex((item) => item.id === currentId);
  if (newIndex === -1) {
    currentIndex = 0;
    currentId = playlist[0].id;
    return { empty: false, restart: true, changed };
  }

  currentIndex = newIndex;
  return { empty: false, restart: false, changed };
};

const showMedia = async (item, { maintainSkip = false } = {}) => {
  clearPlaybackTimer();
  setStatus("");

  currentId = item.id;
  const index = playlist.findIndex((candidate) => candidate.id === item.id);
  if (index >= 0) {
    currentIndex = index;
  }

  noteItemDisplayed(item, { maintainSkip });

  const durationSeconds = Math.max(1, Math.round(Number(item.duration) || 10));
  const kind = detectMediaKind(item);

  if (kind === "team") {
    const employeesForSlide = await ensureTeamEmployeesData();
    renderTeamSlide(item, employeesForSlide);
    return;
  }
  if (kind === "birthday") {
    renderBirthdaySlide(item);
    return;
  }

  const pageUrls = Array.isArray(item.page_urls) ? item.page_urls : [];
  const textPages = Array.isArray(item.text_pages) ? item.text_pages : [];
  const originalMimetype = (item.mimetype || "").toLowerCase();
  const originalExt = getExtension(item.filename || "").toLowerCase();

  if (originalMimetype.includes("pdf") || originalExt === "pdf") {
    documentPlayback = await startPdfDocument(item, durationSeconds, item.url);
    return;
  }

  if (["doc", "docx"].includes(originalExt) || originalMimetype.includes("word")) {
    if (textPages.length) {
      documentPlayback = startTextSequence(item, textPages, durationSeconds);
      return;
    }
  }

  if (pageUrls.length) {
    documentPlayback = startImageSequence(item, pageUrls, durationSeconds);
    return;
  }

  if (textPages.length) {
    documentPlayback = startTextSequence(item, textPages, durationSeconds);
    return;
  }

  mediaWrapper.innerHTML = "";
  const element = createMediaElement(item, kind);
  mediaWrapper.appendChild(element);

  if (kind !== "video") {
    playbackTimer = setTimeout(() => {
      void advanceSlide().catch((error) => console.error(error));
    }, durationSeconds * 1000);
  }
};

const advanceSlide = async () => {
  const result = await refreshPlaylist();
  if (result.empty) {
    handleEmptyPlaylist();
    return;
  }

  if (result.restart) {
    const item = playlist[currentIndex] || playlist[0];
    if (item) {
      await showMedia(item);
    }
    return;
  }

  if (!playlist.length) {
    handleEmptyPlaylist();
    return;
  }

  const attempts = playlist.length;
  let tries = 0;
  let nextIndex = playlist.length === 1 ? currentIndex : (currentIndex + 1) % playlist.length;

  while (tries < attempts) {
    const candidate = playlist[nextIndex];
    if (!candidate) {
      break;
    }
    if (!shouldSkipItem(candidate)) {
      currentIndex = nextIndex;
      await showMedia(candidate);
      return;
    }
    tries += 1;
    nextIndex = (nextIndex + 1) % playlist.length;
  }

  skipState.forEach((entry) => {
    entry.remaining = 0;
  });

  const fallback = playlist[nextIndex] || playlist[0];
  if (fallback) {
    currentIndex = playlist.findIndex((entry) => entry.id === fallback.id);
    await showMedia(fallback);
  }
};

const handlePlaylistRefresh = async () => {
  const result = await refreshPlaylist();
  if (result.empty) {
    handleEmptyPlaylist();
    return;
  }
  if (result.restart) {
    const current = playlist[currentIndex] || playlist[0];
    if (current) {
      await showMedia(current);
    }
    return;
  }
  if (result.changed) {
    const current = playlist[currentIndex];
    if (current && detectMediaKind(current) !== "video") {
      await showMedia(current, { maintainSkip: true });
    }
  }
};

const startPlaylistRefresh = () => {
  if (playlistRefreshTimer) {
    clearInterval(playlistRefreshTimer);
  }
  playlistRefreshTimer = setInterval(() => {
    void handlePlaylistRefresh().catch((error) => console.warn("Rafraîchissement échoué:", error));
    void refreshOverlaySettings();
  }, 30000);
};

const startSlideshow = async () => {
  await refreshOverlaySettings();
  await ensureTeamEmployeesData();
  const result = await refreshPlaylist();
  if (result.empty) {
    handleEmptyPlaylist();
    startPlaylistRefresh();
    return false;
  }

  if (stage) {
    stage.hidden = false;
    updateCanvasScale();
  }
  startClock();

  const current = playlist[currentIndex] || playlist[0];
  if (current) {
    await showMedia(current);
  }

  startPlaylistRefresh();
  return true;
};

const stopKeepAwakePlayback = () => {
  if (keepAwakeAnimationFrame) {
    cancelAnimationFrame(keepAwakeAnimationFrame);
    keepAwakeAnimationFrame = null;
  }
  if (keepAwakeVideo) {
    try {
      keepAwakeVideo.pause();
    } catch (error) {
      // ignore
    }
    const stream = keepAwakeVideo.srcObject;
    if (stream && typeof stream.getTracks === "function") {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (error) {
          // ignore
        }
      });
    }
    keepAwakeVideo.remove();
    keepAwakeVideo = null;
  }
  keepAwakeCanvas = null;
};

const startKeepAwakePlayback = () => {
  if (keepAwakeVideo) {
    const attempt = keepAwakeVideo.play?.();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {});
    }
    return;
  }
  const canvasElement = document.createElement("canvas");
  if (!canvasElement || typeof canvasElement.captureStream !== "function") {
    return;
  }
  canvasElement.width = 1;
  canvasElement.height = 1;
  const context = canvasElement.getContext("2d");
  if (!context) {
    return;
  }
  const paint = () => {
    context.fillStyle = "#000000";
    context.fillRect(0, 0, 1, 1);
    keepAwakeAnimationFrame = requestAnimationFrame(paint);
  };
  paint();

  const stream = canvasElement.captureStream(1);
  const videoElement = document.createElement("video");
  videoElement.srcObject = stream;
  videoElement.muted = true;
  videoElement.loop = true;
  videoElement.playsInline = true;
  videoElement.setAttribute("playsinline", "");
  videoElement.hidden = true;
  videoElement.style.position = "fixed";
  videoElement.style.opacity = "0";
  videoElement.style.pointerEvents = "none";
  videoElement.tabIndex = -1;
  const parent = document.body || document.documentElement;
  if (parent) {
    parent.appendChild(videoElement);
  }

  const playPromise = videoElement.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch((error) => {
      console.warn("Lecture keep-awake refusée:", error);
    });
  }

  keepAwakeCanvas = canvasElement;
  keepAwakeVideo = videoElement;
};

const requestWakeLock = async () => {
  if (!("wakeLock" in navigator)) {
    startKeepAwakePlayback();
    return;
  }
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    stopKeepAwakePlayback();
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
      if (document.visibilityState === "visible") {
        void requestWakeLock();
      } else {
        startKeepAwakePlayback();
      }
    });
  } catch (error) {
    console.warn("Impossible d'activer le Wake Lock:", error);
    startKeepAwakePlayback();
  }
};

const enterFullscreen = async ({ silent = false } = {}) => {
  const element = document.documentElement;
  if (!element || typeof element.requestFullscreen !== "function") {
    return true;
  }
  try {
    await element.requestFullscreen();
    return true;
  } catch (error) {
    if (!silent) {
      console.warn("Plein écran refusé:", error);
    }
    return false;
  }
};

const beginPlayback = async ({ fromAuto = false } = {}) => {
  if (slideshowRunning || isStarting) {
    return;
  }

  isStarting = true;

  await enterFullscreen({ silent: fromAuto });
  await requestWakeLock();

  try {
    const started = await startSlideshow();
    if (started) {
      slideshowRunning = true;
    }
  } catch (error) {
    console.error("Impossible de démarrer le diaporama:", error);
    if (!fromAuto) {
      setStatus("Erreur lors du démarrage du diaporama.");
    }
  } finally {
    isStarting = false;
  }
};

window.addEventListener("load", async () => {
  await refreshOverlaySettings();
  void beginPlayback({ fromAuto: true });
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && wakeLock == null) {
    void requestWakeLock();
  }
});

window.addEventListener("beforeunload", () => {
  stopClock();
  if (wakeLock) {
    wakeLock.release().catch(() => {});
  }
  stopKeepAwakePlayback();
  if (playlistRefreshTimer) {
    clearInterval(playlistRefreshTimer);
    playlistRefreshTimer = null;
  }
  clearPlaybackTimer();
});
