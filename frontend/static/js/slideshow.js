const stage = document.querySelector("#slideshow-stage");
const frame = document.querySelector(".slideshow-frame");
const canvas = document.querySelector(".slideshow-canvas");
const mediaWrapper = document.querySelector("#media-wrapper");
const statusOverlay = document.querySelector("#slideshow-overlay");
const statusLabel = document.querySelector("#slideshow-status");
const overlayContainer = document.querySelector("#slideshow-brand");
const overlayLogo = document.querySelector("#overlay-logo");
const overlayContent = document.querySelector("#overlay-content");

// Info bands elements
const slideshowContainer = document.querySelector("#slideshow-container");
const infoBandHorizontal = document.querySelector("#info-band-horizontal");
const infoBandVertical = document.querySelector("#info-band-vertical");
const infoBandWidgetsLayer = document.querySelector("#info-bands-widgets");

if (overlayLogo) {
  overlayLogo.addEventListener("error", () => {
    overlayLogo.removeAttribute("src");
    overlayLogo.style.display = "none";
  });
}

const rootElement = document.documentElement;
const urlParams = new URLSearchParams(window.location.search);
const isPreviewMode = urlParams.has("preview");
const previewSlideType = (urlParams.get("slide") || "").trim().toLowerCase();
const isSingleSlideMode = previewSlideType === "news" || previewSlideType === "weather";
const sharedRenderers = window.CardinalSlideRenderers || null;
const slideshowCache = window.CardinalSlideshowCache || null;
let weatherBackgroundUrls = [];

const defaults = window.CardinalSlideshowDefaults || {};
const birthdayConfig = window.CardinalBirthdayConfig || null;
const {
  BIRTHDAY_DEFAULT_DAYS_BEFORE,
  BIRTHDAY_FIXED_COPY,
  BIRTHDAY_MAX_LINES,
  BIRTHDAY_SLIDE_ID,
  BIRTHDAY_TEXT_OPTIONS_DEFAULT,
  BIRTHDAY_VARIANTS,
  CHRISTMAS_SLIDE_ID,
  CHRISTMAS_TEXT_OPTIONS_DEFAULT,
  CUSTOM_DATE_FORMAT,
  CUSTOM_MONTH_FORMAT,
  CUSTOM_SLIDE_ID,
  CUSTOM_TIME_FORMAT,
  CUSTOM_WEEKDAY_FORMAT,
  DAY_LABEL_PLURAL,
  DEFAULT_BIRTHDAY_SLIDE,
  DEFAULT_CHRISTMAS_SLIDE,
  DEFAULT_CUSTOM_SLIDE,
  DEFAULT_CUSTOM_TEXT_BACKGROUND,
  DEFAULT_CUSTOM_TEXT_COLOR,
  DEFAULT_CUSTOM_TEXT_POSITION,
  DEFAULT_CUSTOM_TEXT_SIZE,
  DEFAULT_CUSTOM_TEXT_STYLE,
  DEFAULT_NEWS_SLIDE,
  DEFAULT_OPEN_DAYS,
  DEFAULT_OVERLAY,
  DEFAULT_TEAM_SLIDE,
  DEFAULT_TIME_CHANGE_SLIDE,
  DEFAULT_WEATHER_SLIDE,
  NEWS_SLIDE_ID,
  TEAM_CARDS_PER_PAGE,
  TEAM_EMPLOYEES_REFRESH_MS,
  TEAM_SCROLL_OVERRUN_PX,
  TEAM_SLIDE_ID,
  TEAM_SLIDE_SCALE,
  TEAM_TITLE_HOLD_MS,
  TIME_CHANGE_SLIDE_ID,
  TIME_CHANGE_TEXT_OPTIONS_DEFAULT,
  WEATHER_SLIDE_ID,
  WEEKDAY_KEYS,
  WEEKDAY_LABELS_FR,
} = defaults;
const clampPercent = (value) => Math.min(100, Math.max(0, value));
const clamp01 = (value) => Math.min(1, Math.max(0, Number(value) || 0));
const hexToRgb = (value) => {
  if (typeof value !== "string") return { r: 0, g: 0, b: 0 };
  const hex = value.trim().replace("#", "");
  const normalized = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.padEnd(6, "0").slice(0, 6);
  const num = parseInt(normalized, 16);
  if (Number.isNaN(num)) return { r: 0, g: 0, b: 0 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};
const applyLineBackground = (element, opts) => {
  if (!element || !opts) return;
  const opacity = clamp01(opts.background_opacity);
  if (!opts.background_color || opacity <= 0) {
    element.style.backgroundColor = "transparent";
    return;
  }
  const { r, g, b } = hexToRgb(opts.background_color);
  element.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
const BASE_CANVAS_WIDTH = Number(canvas?.dataset.baseWidth) || 1920;
const BASE_CANVAS_HEIGHT = Number(canvas?.dataset.baseHeight) || 1080;

// Info bands configuration
let infoBandsConfig = null;
let lastInfoBandsFetch = 0;
const INFO_BANDS_REFRESH_MS = 30 * 1000; // 30 seconds
const DEFAULT_INFO_BANDS_TICKER = DEFAULT_OVERLAY?.ticker_text || "Bienvenue sur Cardinal TV";
const INFO_BANDS_PROGRESS_STYLES = ["numeric", "dots", "bars", "steps", "bar"];
const normalizeInfoBandProgressStyle = (value) =>
  INFO_BANDS_PROGRESS_STYLES.includes(value) ? value : "numeric";
let infoBandsSignature = "";
let infoBandWidgetTokenEntries = [];
let infoBandWidgetProgressNodes = [];
let infoBandWidgetTimer = null;
let infoBandWidgetAutoFitEntries = [];
let infoBandWidgetResizeObserver = null;
let infoBandWeatherEntries = [];
let infoBandWeatherTimer = null;
let infoBandClockEntries = [];
const INFO_BANDS_WEATHER_REFRESH_MS = 10 * 60 * 1000;

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
let currentItem = null;
let overlaySettings = { ...DEFAULT_OVERLAY };
let overlaySignature = "";
let teamSlideSettings = { ...DEFAULT_TEAM_SLIDE };
let birthdaySlideSettings = { ...DEFAULT_BIRTHDAY_SLIDE };
let timeChangeSlideSettings = { ...DEFAULT_TIME_CHANGE_SLIDE };
let timeChangeInfo = null;
let lastTimeChangeFetch = 0;
const TIME_CHANGE_REFRESH_MS = 60 * 60 * 1000;
let christmasSlideSettings = { ...DEFAULT_CHRISTMAS_SLIDE };
let christmasInfo = null;
let lastChristmasFetch = 0;
const CHRISTMAS_REFRESH_MS = 60 * 60 * 1000; // 1 hour in milliseconds
let newsSlideSettings = { ...DEFAULT_NEWS_SLIDE };
let newsItems = [];
let lastNewsFetch = 0;
const NEWS_REFRESH_MS = 60 * 1000; // 1 minute
let weatherSlideSettings = { ...DEFAULT_WEATHER_SLIDE };
let weatherData = null;
let lastWeatherFetch = 0;
const WEATHER_REFRESH_MS = 60 * 1000; // 1 minute
let testSlideSettings = { ...DEFAULT_CUSTOM_SLIDE };
let testSlidePayload = null;
let lastTestSlideFetch = 0;
const TEST_SLIDE_REFRESH_MS = 15 * 1000;
let customSlidesPayload = null;
let lastCustomSlidesFetch = 0;
const CUSTOM_SLIDE_REFRESH_MS = 15 * 1000;
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
const loadBirthdayCustomFonts = async () => birthdayConfig?.loadCustomFonts?.(fetchJSON);

const normalizeBirthdayLines = (config = {}) =>
  birthdayConfig?.normalizeLines?.(config) || [];

const normalizeBirthdayVariantConfig = (rawConfig = {}, variant = "before") =>
  birthdayConfig?.normalizeVariantConfig?.(rawConfig, variant) || normalizeBirthdayLines(rawConfig);

const birthdayVariantConfigIsStale = (variant, now = Date.now()) =>
  birthdayConfig?.isVariantStale?.(variant, now) ?? true;

const loadBirthdayVariantConfig = (variant, { force = false } = {}) =>
  birthdayConfig?.loadVariantConfig?.(variant, fetchJSON, { force }) || normalizeBirthdayVariantConfig({}, variant);
let lastBirthdayFetch = 0;
const BIRTHDAY_REFRESH_MS = 60_000;

const BIRTHDAY_MIN_TEXT_SIZE = 5;
const BIRTHDAY_MAX_TEXT_SIZE = 100;
const BIRTHDAY_DEFAULT_HEIGHT_PERCENT = 12;
const BIRTHDAY_MIN_FONT_SIZE = 8;
const BIRTHDAY_TEXT_LINE_HEIGHT = 1.2;
const BIRTHDAY_CARD_VERTICAL_PADDING_RATIO = 0.08;
const BIRTHDAY_CARD_HORIZONTAL_PADDING_RATIO = 0.06;
const BIRTHDAY_CARD_MAX_PADDING_RATIO = 0.25;
const BIRTHDAY_MIN_VERTICAL_PADDING_PX = 8;
const BIRTHDAY_MIN_HORIZONTAL_PADDING_PX = 12;
const birthdayMeasureCanvas = document.createElement("canvas");
const birthdayMeasureCtx = birthdayMeasureCanvas.getContext("2d");
const getBirthdayFontStack = (fontFamily) => {
  const primary = (fontFamily || "").trim();
  return `"${primary || "Poppins"}", "Poppins", "Helvetica Neue", Arial, sans-serif`;
};
const clampBirthdayPercent = (value, fallback) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.max(1, Math.min(100, num));
};
const resolveLineHeightRatio = (options) => {
  const ratio = Number(options?.line_height);
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return BIRTHDAY_TEXT_LINE_HEIGHT;
  }
  return Math.min(3, Math.max(0.6, ratio));
};
const resolveLetterSpacing = (options) => {
  const value = Number(options?.letter_spacing);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(30, Math.max(-10, value));
};
const birthdayComputeFontSizeForHeight = (availableHeightPx, text, lineHeightRatio = BIRTHDAY_TEXT_LINE_HEIGHT) => {
  const lines = (text || "").split(/\r?\n/);
  if (!availableHeightPx || !lines.length) return BIRTHDAY_MIN_FONT_SIZE;
  const fontSizeByHeight = availableHeightPx / (lines.length * lineHeightRatio);
  return Math.max(BIRTHDAY_MIN_FONT_SIZE, Math.min(220, Math.floor(fontSizeByHeight)));
};
const birthdayMeasureTextBlock = (text, fontSize, fontFamily, letterSpacing = 0, lineHeightRatio = BIRTHDAY_TEXT_LINE_HEIGHT) => {
  const lines = (text || "").split(/\r?\n/);
  if (!birthdayMeasureCtx) {
    const fallbackWidth = Math.max(
      1,
      ...lines.map((l) => (l || "").length * fontSize * 0.6 + Math.max(0, (l || "").length - 1) * letterSpacing),
    );
    return {
      width: fallbackWidth,
      height: Math.max(1, lines.length * fontSize * lineHeightRatio),
    };
  }
  birthdayMeasureCtx.font = `${fontSize}px ${fontFamily}`;
  let maxWidth = 1;
  lines.forEach((line) => {
    const metrics = birthdayMeasureCtx.measureText(line || " ");
    const baseWidth = metrics.width || 1;
    const spacedWidth = baseWidth + Math.max(0, (line || "").length - 1) * letterSpacing;
    maxWidth = Math.max(maxWidth, spacedWidth);
  });
  return {
    width: Math.max(1, maxWidth),
    height: Math.max(1, lines.length * fontSize * lineHeightRatio),
  };
};
const layoutOverlayLine = (lineEl, contentEl, text, opts, overlayWidth, overlayHeight) => {
  if (!lineEl || !contentEl) return;
  const widthPercent = clampBirthdayPercent(opts.width_percent, 100);
  const heightPercent = clampBirthdayPercent(
    opts.height_percent > 0 ? opts.height_percent : BIRTHDAY_DEFAULT_HEIGHT_PERCENT,
    BIRTHDAY_DEFAULT_HEIGHT_PERCENT,
  );
  const angle = Number(opts.angle) || 0;
  const fontFamily = getBirthdayFontStack(opts.font_family);
  const lineHeightRatio = resolveLineHeightRatio(opts);
  const letterSpacing = resolveLetterSpacing(opts);
  const cardWidthPx = (overlayWidth * widthPercent) / 100;
  const cardHeightPx = (overlayHeight * heightPercent) / 100;

  const horizontalPaddingPx = Math.min(
    Math.max(cardWidthPx * BIRTHDAY_CARD_HORIZONTAL_PADDING_RATIO, BIRTHDAY_MIN_HORIZONTAL_PADDING_PX),
    cardWidthPx * BIRTHDAY_CARD_MAX_PADDING_RATIO,
  );
  const verticalPaddingPx = Math.min(
    Math.max(cardHeightPx * BIRTHDAY_CARD_VERTICAL_PADDING_RATIO, BIRTHDAY_MIN_VERTICAL_PADDING_PX),
    cardHeightPx * BIRTHDAY_CARD_MAX_PADDING_RATIO,
  );

  lineEl.style.width = `${widthPercent}%`;
  lineEl.style.maxWidth = `${widthPercent}%`;
  lineEl.style.height = `${heightPercent}%`;
  lineEl.style.minHeight = `${heightPercent}%`;
  lineEl.dataset.widthPercent = String(widthPercent);
  lineEl.dataset.heightPercent = String(heightPercent);
  lineEl.style.padding = `${verticalPaddingPx}px ${horizontalPaddingPx}px`;
  lineEl.style.boxSizing = "border-box";
  lineEl.style.display = "flex";
  lineEl.style.justifyContent = "center";
  lineEl.style.alignItems = "center";
  lineEl.style.textAlign = "center";
  lineEl.style.whiteSpace = "pre";
  lineEl.style.wordBreak = "normal";
  lineEl.style.overflow = "visible";

  const availableHeightPx = Math.max(4, cardHeightPx - verticalPaddingPx * 2);
  const availableWidthPx = Math.max(4, cardWidthPx - horizontalPaddingPx * 2);
  let fontSize = birthdayComputeFontSizeForHeight(availableHeightPx, text, lineHeightRatio);
  const metrics = birthdayMeasureTextBlock(text, fontSize, fontFamily, letterSpacing, lineHeightRatio);
  if (metrics.height > availableHeightPx) {
    const ratio = availableHeightPx / metrics.height;
    const adjusted = Math.max(BIRTHDAY_MIN_FONT_SIZE, Math.floor(fontSize * ratio));
    if (adjusted !== fontSize) {
      fontSize = adjusted;
    }
  }
  const measured = birthdayMeasureTextBlock(text, fontSize, fontFamily, letterSpacing, lineHeightRatio);
  const widthScale = Math.min(4, Math.max(0.25, availableWidthPx / Math.max(1, measured.width)));

  lineEl.style.fontFamily = fontFamily;
  lineEl.style.fontSize = `${fontSize}px`;
  lineEl.style.lineHeight = lineHeightRatio.toString();
  lineEl.style.transformOrigin = "50% 50%";
  lineEl.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

  contentEl.style.display = "inline-flex";
  contentEl.style.alignItems = "center";
  contentEl.style.justifyContent = "center";
  contentEl.style.transformOrigin = "center";
  contentEl.style.transform = `scale(${widthScale}, 1)`;
  contentEl.style.letterSpacing = `${letterSpacing}px`;
};

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
const infoBandTimeFormatter = new Intl.DateTimeFormat("fr-CA", {
  timeZone: TIMEZONE,
  timeStyle: "short",
});
const infoBandTimeWithSecondsFormatter = new Intl.DateTimeFormat("fr-CA", {
  timeZone: TIMEZONE,
  timeStyle: "medium",
});

const isClockModeActive = () =>
  overlaySettings.enabled && overlaySettings.mode === "clock" && overlayContent && overlayContainer;

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
  overlaySettings = {
    ...DEFAULT_OVERLAY,
    ...input,
  };

  if (!overlayContainer || !overlayContent) {
    overlaySettings.enabled = false;
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
    if (logoPath) {
      overlayLogo.src = resolveAssetUrl(logoPath);
      overlayLogo.style.display = "";
    } else {
      overlayLogo.removeAttribute("src");
      overlayLogo.style.display = "none";
    }
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

const normalizeBaseUrl = (value) => {
  if (!value) return "/";
  return value.endsWith("/") ? value : `${value}/`;
};

const APP_BASE_URL = normalizeBaseUrl(document.body?.dataset?.baseUrl || "/");

const buildApiUrl = (path) => {
  if (!path) return APP_BASE_URL;
  if (typeof path !== "string") return APP_BASE_URL;
  const lowered = path.toLowerCase();
  if (lowered.startsWith("http://") || lowered.startsWith("https://") || path.startsWith("//")) {
    return path;
  }
  if (path.startsWith("/")) return path;
  return `${APP_BASE_URL}${path}`;
};

const resolveAssetUrl = (path) => {
  if (!path) return "";
  const lowered = path.toLowerCase();
  if (lowered.startsWith("http://") || lowered.startsWith("https://") || path.startsWith("//")) {
    return path;
  }
  if (path.startsWith("/")) return path;
  return buildApiUrl(path);
};

const fetchJSON = async (url, options = {}) => {
  const response = await fetch(buildApiUrl(url), {
    cache: "no-store",
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Requête échouée (${response.status})`);
  }
  return response.json();
};

// ─────────────────────────────────────────────────────────────────────────────
// Info Bands Layout System
// ─────────────────────────────────────────────────────────────────────────────

const fetchInfoBandsConfig = async (force = false) => {
  const now = Date.now();
  if (!force && infoBandsConfig && now - lastInfoBandsFetch < INFO_BANDS_REFRESH_MS) {
    return infoBandsConfig;
  }
  try {
    const data = await fetchJSON("api/info-bands");
    infoBandsConfig = data;
    lastInfoBandsFetch = Date.now();
  } catch (error) {
    console.warn("Failed to load info bands config:", error);
    infoBandsConfig = { enabled: false };
    lastInfoBandsFetch = Date.now();
  }
  return infoBandsConfig;
};

const getInfoBandsSignature = (config) => {
  try {
    return JSON.stringify(config || {});
  } catch (error) {
    return "";
  }
};

const applyInfoBandsLayout = (config) => {
  if (!slideshowContainer || !stage || !infoBandHorizontal || !infoBandVertical) {
    return;
  }

  // Reset to default state
  slideshowContainer.classList.remove("bands-active");
  infoBandHorizontal.hidden = true;
  infoBandVertical.hidden = true;
  stage.style.cssText = "";

  if (!config || !config.enabled || config.frame?.size >= 100) {
    // Full screen mode - no bands
    return;
  }

  const size = Math.min(100, Math.max(50, config.frame?.size || 100));
  const position = config.frame?.position || "bottom-right";
  const bandSize = 100 - size;
  const hBg = config.bands?.horizontal?.background || "#ffffff";
  const vBg = config.bands?.vertical?.background || "#a3a3a3";
  const primary = config.bands?.primary === "vertical" ? "vertical" : "horizontal";
  const isHorizontalPrimary = primary !== "vertical";

  // Activate bands mode
  slideshowContainer.classList.add("bands-active");

  // Configure bands based on frame position
  switch (position) {
    case "top-left": {
      // Frame in top-left, bands on right and bottom
      stage.style.width = `${size}%`;
      stage.style.height = `${size}%`;
      stage.style.top = "0";
      stage.style.left = "0";
      stage.style.right = "auto";
      stage.style.bottom = "auto";

      const horizontalWidth = isHorizontalPrimary ? "100%" : `${size}%`;
      const verticalHeight = isHorizontalPrimary ? `${size}%` : "100%";

      infoBandHorizontal.hidden = false;
      infoBandHorizontal.style.cssText = `
        bottom: 0; top: auto; left: 0; right: auto;
        width: ${horizontalWidth}; height: ${bandSize}%;
        background: ${hBg};
      `;

      infoBandVertical.hidden = false;
      infoBandVertical.style.cssText = `
        right: 0; left: auto; top: 0; bottom: auto;
        width: ${bandSize}%; height: ${verticalHeight};
        background: ${vBg};
      `;
      break;
    }

    case "top-right": {
      // Frame in top-right, bands on left and bottom
      stage.style.width = `${size}%`;
      stage.style.height = `${size}%`;
      stage.style.top = "0";
      stage.style.right = "0";
      stage.style.left = "auto";
      stage.style.bottom = "auto";

      const horizontalWidth = isHorizontalPrimary ? "100%" : `${size}%`;
      const verticalHeight = isHorizontalPrimary ? `${size}%` : "100%";

      infoBandHorizontal.hidden = false;
      infoBandHorizontal.style.cssText = `
        bottom: 0; top: auto; left: ${isHorizontalPrimary ? "0" : "auto"}; right: ${
          isHorizontalPrimary ? "auto" : "0"
        };
        width: ${horizontalWidth}; height: ${bandSize}%;
        background: ${hBg};
      `;

      infoBandVertical.hidden = false;
      infoBandVertical.style.cssText = `
        left: 0; right: auto; top: 0; bottom: auto;
        width: ${bandSize}%; height: ${verticalHeight};
        background: ${vBg};
      `;
      break;
    }

    case "bottom-left": {
      // Frame in bottom-left, bands on top and right
      stage.style.width = `${size}%`;
      stage.style.height = `${size}%`;
      stage.style.bottom = "0";
      stage.style.left = "0";
      stage.style.top = "auto";
      stage.style.right = "auto";

      const horizontalWidth = isHorizontalPrimary ? "100%" : `${size}%`;
      const verticalHeight = isHorizontalPrimary ? `${size}%` : "100%";

      infoBandHorizontal.hidden = false;
      infoBandHorizontal.style.cssText = `
        top: 0; bottom: auto; left: 0; right: auto;
        width: ${horizontalWidth}; height: ${bandSize}%;
        background: ${hBg};
      `;

      infoBandVertical.hidden = false;
      infoBandVertical.style.cssText = `
        right: 0; left: auto; bottom: 0; top: auto;
        width: ${bandSize}%; height: ${verticalHeight};
        background: ${vBg};
      `;
      break;
    }

    case "bottom-right": {
      // Frame in bottom-right, bands on top and left
      stage.style.width = `${size}%`;
      stage.style.height = `${size}%`;
      stage.style.bottom = "0";
      stage.style.right = "0";
      stage.style.top = "auto";
      stage.style.left = "auto";

      const horizontalWidth = isHorizontalPrimary ? "100%" : `${size}%`;
      const verticalHeight = isHorizontalPrimary ? `${size}%` : "100%";

      infoBandHorizontal.hidden = false;
      infoBandHorizontal.style.cssText = `
        top: 0; bottom: auto; left: ${isHorizontalPrimary ? "0" : "auto"}; right: ${
          isHorizontalPrimary ? "auto" : "0"
        };
        width: ${horizontalWidth}; height: ${bandSize}%;
        background: ${hBg};
      `;

      infoBandVertical.hidden = false;
      infoBandVertical.style.cssText = `
        left: 0; right: auto; bottom: 0; top: auto;
        width: ${bandSize}%; height: ${verticalHeight};
        background: ${vBg};
      `;
      break;
    }

    case "center": {
      // Frame centered, bands around all sides
      const halfBand = bandSize / 2;
      stage.style.width = `${size}%`;
      stage.style.height = `${size}%`;
      stage.style.top = `${halfBand}%`;
      stage.style.left = `${halfBand}%`;
      stage.style.right = "auto";
      stage.style.bottom = "auto";

      const horizontalWidth = isHorizontalPrimary ? "100%" : `${size}%`;
      const verticalHeight = isHorizontalPrimary ? `${size}%` : "100%";

      infoBandHorizontal.hidden = false;
      infoBandHorizontal.style.cssText = `
        top: 0; bottom: auto; left: ${isHorizontalPrimary ? "0" : `${halfBand}%`}; right: auto;
        width: ${horizontalWidth}; height: ${halfBand}%;
        background: ${hBg};
      `;

      infoBandVertical.hidden = false;
      infoBandVertical.style.cssText = `
        left: 0; right: auto; top: ${isHorizontalPrimary ? `${halfBand}%` : "0"}; bottom: auto;
        width: ${halfBand}%; height: ${verticalHeight};
        background: ${vBg};
      `;
      break;
    }
  }

  infoBandHorizontal.style.zIndex = isHorizontalPrimary ? "12" : "11";
  infoBandVertical.style.zIndex = isHorizontalPrimary ? "11" : "12";
  if (infoBandWidgetsLayer) {
    infoBandWidgetsLayer.style.zIndex = "20";
  }
};

const updateInfoBandWidgetTime = () => {
  if (!infoBandWidgetTokenEntries.length && !infoBandClockEntries.length) return;
  const now = new Date();
  const dayLabel = now.toLocaleDateString("fr-FR", { weekday: "long" });
  const monthLower = now.toLocaleDateString("fr-FR", { month: "long" });
  const monthCap = monthLower.charAt(0).toUpperCase() + monthLower.slice(1);
  const monthDigit = String(now.getMonth() + 1).padStart(2, "0");
  const seconds = now.getSeconds();
  const parts = {
    days: String(now.getDate()).padStart(2, "0"),
    month: monthLower,
    Month: monthCap,
    monthdigit: monthDigit,
    days_week: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
    year: String(now.getFullYear()),
    hour: String(now.getHours()).padStart(2, "0"),
    minutes: String(now.getMinutes()).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
    secondscomablink: seconds % 2 === 0 ? ":" : " ",
  };
  infoBandWidgetTokenEntries.forEach((entry) => {
    const template = entry.template || "";
    const replaced = template.replace(/\[([^\]]+)\]/g, (m, p1) => {
      if (!p1) return m;
      if (p1 === "Month") return parts.Month;
      const key = p1.toLowerCase();
      return parts[key] ?? m;
    });
    if (entry.isTicker && entry.track) {
      setInfoBandTickerText(entry.track, replaced);
      updateInfoBandTickerGap(entry.track);
    } else if (entry.el) {
      entry.el.textContent = replaced;
    }
  });
  if (infoBandClockEntries.length) {
    infoBandClockEntries.forEach((entry) => {
      if (entry.hourEl) entry.hourEl.textContent = parts.hour;
      if (entry.minuteEl) entry.minuteEl.textContent = parts.minutes;
      if (entry.secondEl) entry.secondEl.textContent = parts.seconds;
    });
  }
  applyInfoBandWidgetTextFitAll();
};

const stopInfoBandWidgetClock = () => {
  if (infoBandWidgetTimer) {
    clearInterval(infoBandWidgetTimer);
    infoBandWidgetTimer = null;
  }
};

const startInfoBandWidgetClock = () => {
  stopInfoBandWidgetClock();
  if (!infoBandWidgetTokenEntries.length) return;
  updateInfoBandWidgetTime();
  infoBandWidgetTimer = setInterval(updateInfoBandWidgetTime, 1000);
};

const DEFAULT_INFO_BAND_WIDGET_STYLE = {
  background_color: "#000000",
  border_color: "#ffffff",
  text_color: "#111111",
};

const isValidWidgetHex = (value) =>
  typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value.trim());

const normalizeWidgetHex = (value, fallback) => (isValidWidgetHex(value) ? value.trim() : fallback);

const normalizeWidgetNumber = (value, fallback, min, max = null) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const clampedMin = Math.max(min, num);
  if (max === null || max === undefined) return clampedMin;
  return Math.min(max, clampedMin);
};

const widgetHexToRgba = (hex, opacity) => {
  if (!isValidWidgetHex(hex)) {
    return `rgba(0, 0, 0, ${opacity})`;
  }
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const resolveWidgetImageSrc = (value) => {
  if (!value) return "";
  if (value.startsWith("data:")) {
    return value;
  }
  return resolveAssetUrl(value);
};

const formatInfoBandWeatherLabel = (temp) => {
  if (!Number.isFinite(temp)) return "Température";
  return `${Math.round(temp)}°C`;
};

const fetchInfoBandWeatherForWidget = async (widget) => {
  if (!widget) return null;
  let lat = Number.isFinite(Number(widget.weather_lat)) ? Number(widget.weather_lat) : null;
  let lon = Number.isFinite(Number(widget.weather_lon)) ? Number(widget.weather_lon) : null;
  const city = typeof widget.weather_city === "string" ? widget.weather_city.trim() : "";
  if ((!lat || !lon) && city) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      city,
    )}&count=1&language=fr&format=json`;
    const data = await fetchJSON(geoUrl);
    const result = data?.results?.[0];
    if (result && Number.isFinite(result.latitude) && Number.isFinite(result.longitude)) {
      lat = result.latitude;
      lon = result.longitude;
      widget.weather_lat = lat;
      widget.weather_lon = lon;
    }
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&temperature_unit=celsius`;
  const weatherData = await fetchJSON(weatherUrl);
  return weatherData?.current?.temperature_2m ?? null;
};

const setWidgetVar = (node, name, value) => {
  if (!node) return;
  if (value === null || value === undefined || value === "") {
    node.style.removeProperty(name);
  } else {
    node.style.setProperty(name, value);
  }
};

const buildInfoBandTickerTrack = (track, text) => {
  if (!track) return;
  track.innerHTML = "";
  for (let i = 0; i < 2; i += 1) {
    const item = document.createElement("span");
    item.className = "info-band-widget-ticker-item";
    item.textContent = text;
    track.appendChild(item);
  }
};

const updateInfoBandTickerGap = (track) => {
  if (!track) return;
  const ticker = track.parentElement;
  if (!ticker) return;
  const gap = ticker.clientWidth;
  if (gap > 0) {
    track.style.setProperty("--ticker-gap", `${gap}px`);
  } else {
    track.style.removeProperty("--ticker-gap");
  }
};

const setInfoBandTickerText = (track, text) => {
  if (!track) return;
  const items = track.querySelectorAll(".info-band-widget-ticker-item");
  if (!items.length) {
    track.textContent = text;
    return;
  }
  items.forEach((item) => {
    item.textContent = text;
  });
};

const updateInfoBandTickerGaps = () => {
  infoBandWidgetAutoFitEntries.forEach((entry) => {
    if (entry.tickerTrack) {
      updateInfoBandTickerGap(entry.tickerTrack);
    }
  });
};

const getWidgetContentBox = (node) => {
  const styles = window.getComputedStyle(node);
  const paddingX = parseFloat(styles.paddingLeft || "0") + parseFloat(styles.paddingRight || "0");
  const paddingY = parseFloat(styles.paddingTop || "0") + parseFloat(styles.paddingBottom || "0");
  const width = Math.max(0, node.clientWidth - paddingX);
  const height = Math.max(0, node.clientHeight - paddingY);
  return { width, height };
};

const fitWidgetStretchToBox = (element, boxWidth, boxHeight, baseFontSize) => {
  if (!element || boxWidth <= 0 || boxHeight <= 0) return;
  const initialFont = 200;
  element.style.fontSize = `${initialFont}px`;
  element.style.lineHeight = "1";
  element.style.transform = "none";
  element.style.whiteSpace = "pre";
  element.style.width = "max-content";
  element.style.height = "max-content";
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const scaleX = boxWidth / rect.width;
  const scaleY = boxHeight / rect.height;
  element.style.transformOrigin = "center";
  element.style.transform = `scale(${scaleX}, ${scaleY})`;
};

const applyInfoBandWidgetTextFit = (entry) => {
  if (!entry || !entry.node || !entry.widget) return;
  if (entry.widget.font_size && Number(entry.widget.font_size) > 0) return;
  if ((entry.widget.width || 0) <= 0 && (entry.widget.height || 0) <= 0) return;
  const { width, height } = getWidgetContentBox(entry.node);
  if (width <= 0 || height <= 0) return;
  const widgetScale = normalizeWidgetNumber(entry.widget.scale, 1, 0.1, 10);
  const scaledWidth = width * widgetScale;
  const scaledHeight = height * widgetScale;
  if (entry.type === "clock" && entry.timeEl) {
    fitWidgetStretchToBox(entry.timeEl, scaledWidth, scaledHeight, height);
    return;
  }
  if (entry.type === "date" && entry.dateEl) {
    fitWidgetStretchToBox(entry.dateEl, scaledWidth, scaledHeight, height);
    return;
  }
  if (entry.type === "ticker" && entry.tickerTrack) {
    entry.tickerTrack.style.lineHeight = "1";
    entry.tickerTrack.style.fontSize = `${Math.max(1, height)}px`;
    entry.tickerTrack.style.transform = "none";
    return;
  }
  if (entry.type === "progress" && entry.progressTrack) {
    const style = normalizeInfoBandProgressStyle(entry.widget.progress_style);
    if (style === "bar") {
      entry.progressTrack.style.transform = "none";
      entry.progressTrack.style.fontSize = "";
      entry.progressTrack.style.lineHeight = "1";
      entry.progressTrack.style.width = "100%";
      entry.progressTrack.style.height = "100%";
      return;
    }
    fitWidgetStretchToBox(entry.progressTrack, scaledWidth, scaledHeight, height);
    return;
  }
  if (entry.labelEl) {
    fitWidgetStretchToBox(entry.labelEl, scaledWidth, scaledHeight, height);
  }
};

const renderInfoBandProgressTrack = (track, widget, current, total) => {
  if (!track || !widget) return;
  const style = normalizeInfoBandProgressStyle(widget.progress_style);
  const direction = widget.progress_direction === "vertical" ? "vertical" : "horizontal";
  track.classList.toggle("is-vertical", direction === "vertical");
  track.classList.toggle("is-horizontal", direction !== "vertical");
  track.dataset.style = style;
  track.style.removeProperty("--progress-ratio");
  if (style === "bar") {
    track.textContent = "";
    const bar = document.createElement("div");
    bar.className = "info-band-progress-bar";
    const fill = document.createElement("div");
    fill.className = "info-band-progress-bar-fill";
    bar.appendChild(fill);
    track.appendChild(bar);
    track.style.setProperty(
      "--progress-ratio",
      total > 0 ? Math.min(Math.max(1, current), total) / total : 0,
    );
    return;
  }
  if (total <= 0) {
    track.textContent = style === "numeric" ? "0/0" : "";
    return;
  }
  const clampedCurrent = Math.min(Math.max(1, current), total);
  if (style === "numeric") {
    track.textContent = `${clampedCurrent}/${total}`;
    return;
  }
  track.textContent = "";
  const count = Math.max(1, total);
  for (let i = 1; i <= count; i += 1) {
    const dot = document.createElement("span");
    dot.className = `info-band-progress-dot${i === clampedCurrent ? " is-active" : ""}`;
    dot.setAttribute("aria-hidden", "true");
    track.appendChild(dot);
  }
};

const applyInfoBandWidgetTextFitAll = () => {
  infoBandWidgetAutoFitEntries.forEach((entry) => applyInfoBandWidgetTextFit(entry));
};

const updateInfoBandWidgetProgress = () => {
  if (!infoBandWidgetProgressNodes.length) return;
  const total = Array.isArray(playlist) ? playlist.length : 0;
  const current = currentIndex >= 0 ? currentIndex + 1 : 0;
  infoBandWidgetProgressNodes.forEach(({ track, widget }) => {
    renderInfoBandProgressTrack(track, widget, current, total);
  });
  applyInfoBandWidgetTextFitAll();
};

const updateInfoBandWeather = () => {
  if (!infoBandWeatherEntries.length) return;
  infoBandWeatherEntries.forEach((entry) => {
    const widget = entry.widget;
    if (!widget || widget.enabled === false) return;
    const city = typeof widget.weather_city === "string" ? widget.weather_city.trim() : "";
    if (!city) {
      entry.labelEl.textContent = "Température";
      return;
    }
    fetchInfoBandWeatherForWidget(widget)
      .then((temp) => {
        entry.labelEl.textContent = formatInfoBandWeatherLabel(temp);
        applyInfoBandWidgetTextFitAll();
      })
      .catch(() => {
        entry.labelEl.textContent = "Température";
      });
  });
};

const syncInfoBandWeatherTimer = () => {
  if (infoBandWeatherTimer) {
    clearInterval(infoBandWeatherTimer);
    infoBandWeatherTimer = null;
  }
  if (!infoBandWeatherEntries.length) return;
  updateInfoBandWeather();
  infoBandWeatherTimer = setInterval(updateInfoBandWeather, INFO_BANDS_WEATHER_REFRESH_MS);
};

const applyInfoBandWidgetStyles = (node, widget) => {
  if (!node || !widget || typeof widget !== "object") {
    return;
  }
  const scale = normalizeWidgetNumber(widget.scale, 1, 0.1, 10);
  node.style.setProperty("--widget-scale", scale);

  const width = normalizeWidgetNumber(widget.width, 0, 0);
  const widthPercent = width > 0 ? (width / BASE_CANVAS_WIDTH) * 100 : 0;
  setWidgetVar(node, "--widget-width", widthPercent > 0 ? `${widthPercent}%` : null);

  const height = normalizeWidgetNumber(widget.height, 0, 0);
  const heightPercent = height > 0 ? (height / BASE_CANVAS_HEIGHT) * 100 : 0;
  setWidgetVar(node, "--widget-height", heightPercent > 0 ? `${heightPercent}%` : null);

  const padding = normalizeWidgetNumber(widget.padding, 0, 0);
  node.style.setProperty("--widget-padding", `${padding}px`);

  const radius = normalizeWidgetNumber(widget.radius, 0, 0);
  node.style.setProperty("--widget-radius", `${radius}px`);

  const backgroundColor = normalizeWidgetHex(
    widget.background_color,
    DEFAULT_INFO_BAND_WIDGET_STYLE.background_color,
  );
  const backgroundOpacity = normalizeWidgetNumber(widget.background_opacity, 0, 0, 1);
  node.style.setProperty(
    "--widget-bg",
    backgroundOpacity > 0 ? widgetHexToRgba(backgroundColor, backgroundOpacity) : "transparent",
  );

  const borderColor = normalizeWidgetHex(
    widget.border_color,
    DEFAULT_INFO_BAND_WIDGET_STYLE.border_color,
  );
  const borderWidth = normalizeWidgetNumber(widget.border_width, 0, 0);
  node.style.setProperty(
    "--widget-border",
    borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : "none",
  );

  const textColor = normalizeWidgetHex(widget.text_color, DEFAULT_INFO_BAND_WIDGET_STYLE.text_color);
  node.style.setProperty("--widget-text-color", textColor);

  const fontSize = normalizeWidgetNumber(widget.font_size, 0, 0);
  setWidgetVar(node, "--widget-font-size", fontSize > 0 ? `${fontSize}px` : null);
};

const renderInfoBandWidgets = (config) => {
  if (!infoBandWidgetsLayer) {
    return;
  }
  infoBandsSignature = getInfoBandsSignature(config);
  infoBandWidgetsLayer.innerHTML = "";
  infoBandWidgetTokenEntries = [];
  infoBandWidgetProgressNodes = [];
  infoBandWidgetAutoFitEntries = [];
  infoBandWeatherEntries = [];
  infoBandClockEntries = [];
  const enabled = Boolean(config?.enabled);
  const frameSize = Number(config?.frame?.size ?? 100);
  const widgets = Array.isArray(config?.widgets) ? config.widgets : [];
  const activeWidgets = widgets.filter((widget) => widget && widget.enabled !== false);
  if (!enabled || frameSize >= 100 || !activeWidgets.length) {
    infoBandWidgetsLayer.hidden = true;
    infoBandWidgetsLayer.style.display = "none";
    stopInfoBandWidgetClock();
    if (infoBandWeatherTimer) {
      clearInterval(infoBandWeatherTimer);
      infoBandWeatherTimer = null;
    }
    return;
  }
  infoBandWidgetsLayer.hidden = false;
  infoBandWidgetsLayer.style.display = "block";
  activeWidgets.forEach((widget) => {
    if (!widget || typeof widget !== "object") {
      return;
    }
    const rawType = String(widget.type || "").trim().toLowerCase();
    if (!rawType) return;

    // Legacy support: older configs used `date` widget types.
    let type = rawType === "logo" ? "image" : rawType;
    let normalizedText = null;
    if (type === "date") {
      type = "text";
      normalizedText =
        typeof widget.text === "string" && widget.text.length
          ? widget.text
          : "[days]/[month]/[year]";
    }

    const node = document.createElement("div");
    node.className = `info-band-widget info-band-widget--${type || "default"}`;
    const xRaw = Number(widget.x);
    const yRaw = Number(widget.y);
    const x = Number.isFinite(xRaw) ? clampPercent(xRaw) : 50;
    const y = Number.isFinite(yRaw) ? clampPercent(yRaw) : 50;
    node.style.left = `${x}%`;
    node.style.top = `${y}%`;
    applyInfoBandWidgetStyles(node, widget);

    if (type === "image") {
      const img = document.createElement("img");
      img.className = "info-band-widget-logo";
      const src = resolveWidgetImageSrc(widget.image_src || "");
      img.alt = "Image";
      if (src) {
        img.src = src;
        node.appendChild(img);
      }
    } else if (type === "clock") {
      const clock = document.createElement("div");
      clock.className = "info-band-widget-clock";
      const hour = document.createElement("span");
      hour.className = "info-band-clock-hour";
      const sep1 = document.createElement("span");
      sep1.className = "info-band-clock-sep";
      sep1.textContent = " : ";
      const minute = document.createElement("span");
      minute.className = "info-band-clock-minute";
      const sep2 = document.createElement("span");
      sep2.className = "info-band-clock-sep info-band-clock-sep--blink";
      sep2.textContent = " : ";
      const second = document.createElement("span");
      second.className = "info-band-clock-second";
      clock.appendChild(hour);
      clock.appendChild(sep1);
      clock.appendChild(minute);
      clock.appendChild(sep2);
      clock.appendChild(second);
      node.appendChild(clock);
      infoBandWidgetAutoFitEntries.push({ node, widget, type, labelEl: clock });
      node.classList.add("info-band-widget--clock");
      infoBandClockEntries.push({ widget, hourEl: hour, minuteEl: minute, secondEl: second });
    } else if (type === "text") {
      const label = document.createElement("span");
      label.className = "info-band-widget-label";
      const initial =
        normalizedText ??
        (typeof widget.text === "string" && widget.text.length ? widget.text : "Votre texte");
      label.textContent = initial;
      node.appendChild(label);
      infoBandWidgetAutoFitEntries.push({ node, widget, type, labelEl: label });
      if (/\[(days|days_week|month|Month|monthdigit|year|hour|minutes|seconds|secondscomablink)\]/i.test(initial)) {
        infoBandWidgetTokenEntries.push({ widget, el: label, template: initial, isTicker: false });
      }
    } else if (type === "ticker") {
      const ticker = document.createElement("div");
      ticker.className = "info-band-widget-ticker";
      const track = document.createElement("div");
      track.className = "info-band-widget-ticker-track";
      const fallbackText = overlaySettings?.ticker_text || DEFAULT_INFO_BANDS_TICKER;
      const textValue = typeof widget.text === "string" && widget.text.length ? widget.text : fallbackText;
      buildInfoBandTickerTrack(track, textValue);
      ticker.appendChild(track);
      node.appendChild(ticker);
      updateInfoBandTickerGap(track);
      infoBandWidgetAutoFitEntries.push({ node, widget, type, tickerTrack: track });
      if (/\[(days|days_week|month|Month|monthdigit|year|hour|minutes|seconds|secondscomablink)\]/i.test(textValue)) {
        infoBandWidgetTokenEntries.push({ widget, track, template: textValue, isTicker: true });
      }
    } else if (type === "weather") {
      const label = document.createElement("span");
      label.className = "info-band-widget-label";
      label.textContent = "Température";
      node.appendChild(label);
      infoBandWidgetAutoFitEntries.push({ node, widget, type, labelEl: label });
      infoBandWeatherEntries.push({ widget, labelEl: label });
    } else if (type === "progress") {
      const progress = document.createElement("div");
      progress.className = "info-band-widget-progress";
      const track = document.createElement("div");
      track.className = "info-band-widget-progress-track";
      progress.appendChild(track);
      node.appendChild(progress);
      infoBandWidgetProgressNodes.push({ track, widget });
      infoBandWidgetAutoFitEntries.push({ node, widget, type, progressTrack: track });
    } else {
      const label = document.createElement("span");
      label.className = "info-band-widget-label";
      label.textContent = type;
      node.appendChild(label);
      infoBandWidgetAutoFitEntries.push({ node, widget, type: "label", labelEl: label });
    }

    infoBandWidgetsLayer.appendChild(node);
  });
  applyInfoBandWidgetTextFitAll();
  updateInfoBandTickerGaps();
  updateInfoBandWidgetProgress();
  updateInfoBandWeather();
  if (!infoBandWidgetResizeObserver && "ResizeObserver" in window) {
    infoBandWidgetResizeObserver = new ResizeObserver(() => {
      applyInfoBandWidgetTextFitAll();
      updateInfoBandTickerGaps();
    });
    infoBandWidgetResizeObserver.observe(infoBandWidgetsLayer);
  }
  startInfoBandWidgetClock();
  syncInfoBandWeatherTimer();
};

const refreshInfoBandsLayout = async () => {
  const config = await fetchInfoBandsConfig(true);
  applyInfoBandsLayout(config);
  const signature = getInfoBandsSignature(config);
  if (signature === infoBandsSignature) {
    return;
  }
  infoBandsSignature = signature;
  renderInfoBandWidgets(config);
};

const initInfoBands = async () => {
  if (isPreviewMode) {
    applyInfoBandsLayout({ enabled: false, frame: { size: 100 } });
    renderInfoBandWidgets({ enabled: false, widgets: [] });
    return;
  }
  await refreshInfoBandsLayout();
};

const preloadBirthdayVariants = async ({ force = false } = {}) => {
  await Promise.all(BIRTHDAY_VARIANTS.map((variant) => loadBirthdayVariantConfig(variant, { force })));
};

const fetchTimeChangeInfo = async (force = false) => {
  const now = Date.now();
  if (!force && timeChangeInfo && now - lastTimeChangeFetch < TIME_CHANGE_REFRESH_MS) {
    return timeChangeInfo;
  }
  try {
    const query =
      timeChangeSlideSettings && Number.isFinite(Number(timeChangeSlideSettings.days_before))
        ? `?days_before=${timeChangeSlideSettings.days_before}`
        : "";
    const data = await fetchJSON(`api/time-change-slide/next${query}`);
    timeChangeInfo = data && data.change ? data.change : null;
    lastTimeChangeFetch = Date.now();
  } catch (error) {
    console.warn("Impossible de charger les données du changement d'heure:", error);
    timeChangeInfo = null;
    lastTimeChangeFetch = Date.now();
  }
  return timeChangeInfo;
};

const formatTimeChangeMessage = (template, info) => {
  const base = template || DEFAULT_TIME_CHANGE_SLIDE.message_template;
  const change = info || {};
  const days = Number.isFinite(Number(change.days_until)) ? Number(change.days_until) : null;
  const replacements = {
    change_weekday: change.weekday_label || "",
    change_date: change.date_label || "",
    change_time: change.time_label || "",
    direction_verb:
      change.direction_label || (change.direction === "backward" ? "reculer" : "avancer"),
    offset_hours: change.offset_hours != null ? change.offset_hours : 1,
    offset_from: change.offset_from || "",
    offset_to: change.offset_to || "",
    days_until: days != null ? days : "",
    days_left: days != null ? days : "",
    days_label: days === 1 ? DAY_LABEL_PLURAL.singular : DAY_LABEL_PLURAL.plural,
    season_label: change.season_label || "",
    seasons:
      change.season === "winter"
        ? "hiver"
        : change.season === "summer"
          ? "été"
          : (change.season_label || "").replace("d'", "").replace("de ", "") || "",
  };
  return base.replace(/\[([^\]]+)\]/g, (match, key) =>
    replacements[key] !== undefined && replacements[key] !== null ? String(replacements[key]) : "",
  );
};

const describeTimeChange = (info) => {
  if (!info) return "En attente des données officielles…";
  const direction = info.direction_label || (info.direction === "backward" ? "reculer" : "avancer");
  const days = Number.isFinite(Number(info.days_until)) ? Number(info.days_until) : null;
  const daysLabel = days === 1 ? DAY_LABEL_PLURAL.singular : DAY_LABEL_PLURAL.plural;
  const countdown =
    days != null ? `Dans ${Math.max(0, days)} ${daysLabel}` : "Compte à rebours indisponible";
  return `${info.weekday_label || ""} ${info.date_label || ""} • ${info.time_label || ""} • ${direction} d'une heure • ${countdown}`;
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

const getBirthdayDaysBefore = () => {
  const val = Number(birthdaySlideSettings?.days_before);
  if (Number.isFinite(val) && val >= 0 && val <= 365) return val;
  const fallback = Number(DEFAULT_BIRTHDAY_SLIDE.days_before ?? BIRTHDAY_DEFAULT_DAYS_BEFORE);
  if (Number.isFinite(fallback) && fallback >= 0 && fallback <= 365) return fallback;
  return BIRTHDAY_DEFAULT_DAYS_BEFORE;
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
    const settingsChanged = signature !== overlaySignature;
    if (settingsChanged) {
      overlaySignature = signature;
      const overlay = (data && data.overlay) || {};
      applyOverlaySettings(overlay);
      const rawBirthday = data && data.birthday_slide ? data.birthday_slide : {};
      const rawDays = Number(rawBirthday?.days_before);
      const parsedDays =
        Number.isFinite(rawDays) && rawDays >= 0 && rawDays <= 365
          ? rawDays
          : DEFAULT_BIRTHDAY_SLIDE.days_before;
      birthdaySlideSettings = {
        ...DEFAULT_BIRTHDAY_SLIDE,
        ...rawBirthday,
        days_before: parsedDays,
        open_days: normalizeOpenDays(rawBirthday?.open_days),
      };
      birthdayEmployeesData = null;
      lastBirthdayFetch = 0;
      teamSlideSettings = {
        ...DEFAULT_TEAM_SLIDE,
        ...(data && data.team_slide ? data.team_slide : {}),
      };
      timeChangeSlideSettings = {
        ...DEFAULT_TIME_CHANGE_SLIDE,
        ...(data && data.time_change_slide ? data.time_change_slide : {}),
      };
      christmasSlideSettings = {
        ...DEFAULT_CHRISTMAS_SLIDE,
        ...(data && data.christmas_slide ? data.christmas_slide : {}),
      };
      testSlideSettings = {
        ...DEFAULT_CUSTOM_SLIDE,
        ...(data && data.test_slide ? data.test_slide : {}),
      };
      testSlidePayload = null;
      lastTestSlideFetch = 0;
      newsSlideSettings = {
        ...DEFAULT_NEWS_SLIDE,
        ...(data && data.news_slide ? data.news_slide : {}),
      };
      newsItems = [];
      lastNewsFetch = 0;
      weatherSlideSettings = {
        ...DEFAULT_WEATHER_SLIDE,
        ...(data && data.weather_slide ? data.weather_slide : {}),
      };
      weatherData = null;
      lastWeatherFetch = 0;
      await fetchTimeChangeInfo(true);
      await fetchChristmasInfo(true);
    }
    void refreshWeatherBackgroundUrls();
    await preloadBirthdayVariants({ force: settingsChanged });
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
  if (item.time_change_slide) {
    return "time-change";
  }
  if (item.christmas_slide) {
    return "christmas";
  }
  if (item.custom_slide) {
    return "custom";
  }
  if (item.news_slide) {
    return "news";
  }
  if (item.weather_slide) {
    return "weather";
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

const buildSingleSlideItem = (type) => {
  if (type === "news") {
    return {
      id: NEWS_SLIDE_ID,
      news_slide: true,
      duration: newsSlideSettings.duration || DEFAULT_NEWS_SLIDE.duration,
      filename: "news_slide",
      mimetype: "application/x-news-slide",
    };
  }
  if (type === "weather") {
    return {
      id: WEATHER_SLIDE_ID,
      weather_slide: true,
      duration: weatherSlideSettings.duration || DEFAULT_WEATHER_SLIDE.duration,
      filename: "weather_slide",
      mimetype: "application/x-weather-slide",
    };
  }
  return null;
};

const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);
const customMeasureCanvas = document.createElement("canvas");
const customMeasureCtx = customMeasureCanvas.getContext("2d");
const CUSTOM_MEASUREMENT_FALLBACK_CHAR_WIDTH = 0.6;
const CUSTOM_MEASUREMENT_SAFETY_RATIO = 0.1;
const CUSTOM_TEXT_LINE_HEIGHT = 1.2;
const CUSTOM_CARD_VERTICAL_PADDING_RATIO = 0.08;
const CUSTOM_CARD_HORIZONTAL_PADDING_RATIO = 0.06;
const CUSTOM_CARD_MAX_PADDING_RATIO = 0.25;
const CUSTOM_CARD_MIN_VERTICAL_PADDING = 8;
const CUSTOM_CARD_MIN_HORIZONTAL_PADDING = 12;
const CUSTOM_FONT_FALLBACK = '"Poppins", "Helvetica Neue", Arial, sans-serif';

const getCustomFontStack = (fontFamily) => {
  if (!fontFamily) {
    return CUSTOM_FONT_FALLBACK;
  }
  return `"${fontFamily}", ${CUSTOM_FONT_FALLBACK}`;
};

const buildRgbaColor = (hex, opacity) => {
  const { r, g, b } = hexToRgb(hex);
  const alpha = clampValue(Number(opacity) || 0, 0, 1);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const splitTextLines = (value) => {
  if (!value && value !== 0) {
    return [""];
  }
  return String(value).split(/\r?\n/);
};

const computeCustomFontSize = (availableHeightPx, lineCount) => {
  if (!availableHeightPx || !lineCount) {
    return 8;
  }
  const size = availableHeightPx / (lineCount * CUSTOM_TEXT_LINE_HEIGHT);
  return clampValue(Math.floor(size), 8, 220);
};

const measureCustomTextBlock = (lines, fontSize, fontStack) => {
  const normalizedLines = lines && lines.length ? lines : [""];
  if (!customMeasureCtx) {
    const fallbackWidth =
      Math.max(1, Math.max(...normalizedLines.map((line) => (line || "").length)) * fontSize * CUSTOM_MEASUREMENT_FALLBACK_CHAR_WIDTH);
    const fallbackLineHeight = fontSize * CUSTOM_TEXT_LINE_HEIGHT;
    return { width: fallbackWidth, height: fallbackLineHeight * normalizedLines.length };
  }
  customMeasureCtx.font = `${fontSize}px ${fontStack}`;
  let maxWidth = 1;
  let maxAscent = 0;
  let maxDescent = 0;
  normalizedLines.forEach((line) => {
    const metrics = customMeasureCtx.measureText(line || " ");
    const left = Math.abs(metrics.actualBoundingBoxLeft ?? 0);
    const right = Math.abs(metrics.actualBoundingBoxRight ?? 0);
    const boundingWidth = Math.max(metrics.width || 0, left + right);
    maxWidth = Math.max(maxWidth, boundingWidth);
    maxAscent = Math.max(maxAscent, metrics.actualBoundingBoxAscent ?? 0);
    maxDescent = Math.max(maxDescent, metrics.actualBoundingBoxDescent ?? 0);
  });
  const safety = fontSize * CUSTOM_MEASUREMENT_SAFETY_RATIO;
  const lineHeight = Math.max(fontSize * CUSTOM_TEXT_LINE_HEIGHT, maxAscent + maxDescent + safety * 2);
  const blockHeight = lineHeight * normalizedLines.length;
  return {
    width: Math.max(1, maxWidth),
    height: Math.max(1, blockHeight),
  };
};

const startOfDayUTC = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const parseIsoDate = (value) => {
  if (!value) return null;
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map((v) => Number.parseInt(v, 10));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const getDaysUntil = (eventDate) => {
  if (!eventDate) return 0;
  const now = startOfDayUTC(new Date());
  const target = startOfDayUTC(eventDate);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.round(diff / 86400000));
};
const formatWeekdayLabel = (date, { capitalize = false } = {}) => {
  const label = CUSTOM_WEEKDAY_FORMAT.format(date);
  if (capitalize) {
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return label.toLowerCase();
};
const formatMonthLabel = (date, { capitalize = false } = {}) => {
  const label = CUSTOM_MONTH_FORMAT.format(date);
  if (capitalize) {
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return label.toLowerCase();
};
const getSeasonForDate = (date, { capitalize = false } = {}) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  let label = "hiver";
  if ((month === 3 && day >= 20) || month === 4 || month === 5 || (month === 6 && day < 21)) {
    label = "printemps";
  } else if ((month === 6 && day >= 21) || month === 7 || month === 8 || (month === 9 && day < 22)) {
    label = "été";
  } else if ((month === 9 && day >= 22) || month === 10 || month === 11 || (month === 12 && day < 21)) {
    label = "automne";
  }
  if (!capitalize) {
    return label;
  }
  if (label === "été") {
    return "Été";
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
};
const getDayLabel = (count, { capitalize = false } = {}) => {
  const base = count === 1 ? "jour" : "jours";
  if (!capitalize) return base;
  return base.charAt(0).toUpperCase() + base.slice(1);
};
const buildCustomTokenMap = (meta = {}) => {
  const now = new Date();
  const eventDate = parseIsoDate(meta.event_date);
  const daysLeft = getDaysUntil(eventDate);
  const countdown = `${daysLeft} ${getDayLabel(daysLeft)}`;
  return {
    "[slide_name]": meta.name || "",
    "[date]": CUSTOM_DATE_FORMAT.format(now),
    "[time]": CUSTOM_TIME_FORMAT.format(now),
    "[weekday]": formatWeekdayLabel(now, { capitalize: false }),
    "[Weekday]": formatWeekdayLabel(now, { capitalize: true }),
    "[month]": formatMonthLabel(now, { capitalize: false }),
    "[Month]": formatMonthLabel(now, { capitalize: true }),
    "[year]": String(now.getFullYear()),
    "[season]": getSeasonForDate(now, { capitalize: false }),
    "[seasons]": getSeasonForDate(now, { capitalize: true }),
    "[Season]": getSeasonForDate(now, { capitalize: true }),
    "[days_left]": String(daysLeft),
    "[event_countdown]": countdown,
    "[day_days]": getDayLabel(daysLeft),
    "[Day_Days]": getDayLabel(daysLeft, { capitalize: true }),
    "[event_date]": eventDate ? CUSTOM_DATE_FORMAT.format(eventDate) : "",
    "[event_weekday]": eventDate ? formatWeekdayLabel(eventDate, { capitalize: true }) : "",
    "[event_month]": eventDate ? formatMonthLabel(eventDate, { capitalize: true }) : "",
    "[event_year]": eventDate ? String(eventDate.getFullYear()) : "",
  };
};
const resolveCustomTokens = (value, tokenMap) => {
  if (!value && value !== 0) return "";
  const source = typeof value === "string" ? value : String(value);
  let resolved = source;
  Object.entries(tokenMap).forEach(([token, replacement]) => {
    if (!token) return;
    const safeReplacement = replacement ?? "";
    resolved = resolved.split(token).join(safeReplacement);
  });
  return resolved;
};

const createCustomTextCard = (entry, overlayWidth, overlayHeight, tokenMap) => {
  const normalizedPosition = entry.position || DEFAULT_CUSTOM_TEXT_POSITION;
  const normalizedSize = entry.size || DEFAULT_CUSTOM_TEXT_SIZE;
  const normalizedBackground = entry.background || DEFAULT_CUSTOM_TEXT_BACKGROUND;
  const normalizedStyle = entry.style || DEFAULT_CUSTOM_TEXT_STYLE;
  const color = entry.color || DEFAULT_CUSTOM_TEXT_COLOR;
  const rawValue = entry.value || "";
  const displayValue = resolveCustomTokens(rawValue, tokenMap || {});

  const card = document.createElement("div");
  card.className = "custom-slide-text-card";
  card.style.left = `${clampPercent(normalizedPosition.x)}%`;
  card.style.top = `${clampPercent(normalizedPosition.y)}%`;
  card.style.transform = "translate(-50%, -50%)";
  card.style.position = "absolute";
  card.style.display = "flex";
  card.style.alignItems = "center";
  card.style.justifyContent = "center";
  card.style.textAlign = "center";
  card.style.pointerEvents = "none";
  card.style.boxSizing = "border-box";
  card.style.borderRadius = "18px";
  card.style.color = color;
  card.style.fontFamily = getCustomFontStack(normalizedStyle.font_family);
  card.style.fontWeight = normalizedStyle.bold ? "700" : "400";
  card.style.fontStyle = normalizedStyle.italic ? "italic" : "normal";
  card.style.textDecoration = normalizedStyle.underline ? "underline" : "none";
  card.style.whiteSpace = "pre";
  card.style.wordBreak = "normal";

  const content = document.createElement("span");
  content.className = "custom-slide-text-content";
  content.textContent = displayValue;
  card.dataset.rawValue = rawValue;
  card.dataset.renderedValue = displayValue;
  card.dataset.width = normalizedSize.width ?? DEFAULT_CUSTOM_TEXT_SIZE.width;
  card.dataset.height = normalizedSize.height ?? DEFAULT_CUSTOM_TEXT_SIZE.height;
  card.dataset.fontFamily = normalizedStyle.font_family || DEFAULT_CUSTOM_TEXT_STYLE.font_family;
  card.dataset.backgroundColor = normalizedBackground.color || DEFAULT_CUSTOM_TEXT_BACKGROUND.color;
  card.dataset.backgroundOpacity =
    normalizedBackground.opacity ?? DEFAULT_CUSTOM_TEXT_BACKGROUND.opacity;
  card.appendChild(content);

  if (sharedRenderers?.layoutCustomTextCard) {
    sharedRenderers.layoutCustomTextCard(card, overlayWidth, overlayHeight);
    return card;
  }

  const widthPercent = clampValue(Number(normalizedSize.width) || DEFAULT_CUSTOM_TEXT_SIZE.width, 5, 90);
  const heightPercent = clampValue(Number(normalizedSize.height) || DEFAULT_CUSTOM_TEXT_SIZE.height, 5, 90);
  const cardWidthPx = overlayWidth * (widthPercent / 100);
  const cardHeightPx = overlayHeight * (heightPercent / 100);
  const horizontalPaddingPx = Math.min(
    Math.max(cardWidthPx * CUSTOM_CARD_HORIZONTAL_PADDING_RATIO, CUSTOM_CARD_MIN_HORIZONTAL_PADDING),
    cardWidthPx * CUSTOM_CARD_MAX_PADDING_RATIO,
  );
  const verticalPaddingPx = Math.min(
    Math.max(cardHeightPx * CUSTOM_CARD_VERTICAL_PADDING_RATIO, CUSTOM_CARD_MIN_VERTICAL_PADDING),
    cardHeightPx * CUSTOM_CARD_MAX_PADDING_RATIO,
  );

  card.style.width = `${widthPercent}%`;
  card.style.height = `${heightPercent}%`;
  card.style.padding = `${verticalPaddingPx}px ${horizontalPaddingPx}px`;

  const lines = splitTextLines(displayValue);
  const lineCount = Math.max(1, lines.length);
  const availableHeightPx = Math.max(4, cardHeightPx - verticalPaddingPx * 2);
  let fontSize = computeCustomFontSize(availableHeightPx, lineCount);
  const fontStack = getCustomFontStack(normalizedStyle.font_family);
  let blockMetrics = measureCustomTextBlock(lines, fontSize, fontStack);
  if (blockMetrics.height > availableHeightPx) {
    const ratio = clampValue(availableHeightPx / blockMetrics.height, 0.1, 1);
    const adjusted = Math.max(8, Math.floor(fontSize * ratio));
    if (adjusted !== fontSize) {
      fontSize = adjusted;
      blockMetrics = measureCustomTextBlock(lines, fontSize, fontStack);
    }
  }
  const availableWidthPx = Math.max(4, cardWidthPx - horizontalPaddingPx * 2);
  const widthScale = clampValue(availableWidthPx / blockMetrics.width, 0.25, 4);

  card.style.fontSize = `${fontSize}px`;
  card.style.lineHeight = CUSTOM_TEXT_LINE_HEIGHT;

  content.style.transformOrigin = "center";
  content.style.transform = `scale(${widthScale}, 1)`;
  content.style.lineHeight = CUSTOM_TEXT_LINE_HEIGHT;

  const backgroundColor = buildRgbaColor(
    normalizedBackground.color || DEFAULT_CUSTOM_TEXT_BACKGROUND.color,
    normalizedBackground.opacity ?? DEFAULT_CUSTOM_TEXT_BACKGROUND.opacity,
  );
  card.style.backgroundColor = backgroundColor;

  return card;
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
      time_change_at: item.time_change_at || (item.time_change && item.time_change.change_at),
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
  const years = Math.floor(info.months / 12);
  const months = info.months % 12;
  const parts = [];
  if (years > 0) {
    parts.push(`${years} an${years > 1 ? "s" : ""}`);
  }
  if (months > 0) {
    parts.push(`${months} mois`);
  }
  if (!parts.length) {
    return "0 mois de service";
  }
  return `${parts.join(" et ")} de service`;
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
  description.textContent = employee.description || "";

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

  const tryBuild = (m, d) => {
    if (!Number.isFinite(m) || !Number.isFinite(d) || m < 1 || m > 12 || d < 1 || d > 31) {
      return null;
    }
    const now = new Date();
    const thisYear = now.getFullYear();
    const candidate = new Date(Date.UTC(thisYear, m - 1, d));
    const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    if (candidate < todayUtc) {
      candidate.setUTCFullYear(thisYear + 1);
    }
    return candidate;
  };

  // Formats pris en charge : YYYY-MM-DD, MM-DD, DD-MM.
  if (parts.length === 3) {
    return tryBuild(Number(parts[1]), Number(parts[2]));
  }

  // Préférer MM-DD (classique) puis essayer l'inversion DD-MM.
  return (
    tryBuild(Number(parts[0]), Number(parts[1])) ||
    tryBuild(Number(parts[1]), Number(parts[0]))
  );
};

const ensureBirthdayEmployeesData = async () => {
  const now = Date.now();
  const configsFresh = BIRTHDAY_VARIANTS.every((variant) => !birthdayVariantConfigIsStale(variant, now));
  if (birthdayEmployeesData && now - lastBirthdayFetch < BIRTHDAY_REFRESH_MS && configsFresh) {
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
      (variant === "before" && daysToBirthday <= getBirthdayDaysBefore()) ||
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
      configCache[entry.variant] = await loadBirthdayVariantConfig(entry.variant, { force: !configsFresh });
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

const renderBirthdaySlide = (item, variantConfig = null) => {
  mediaWrapper.innerHTML = "";
  const settings = birthdaySlideSettings || DEFAULT_BIRTHDAY_SLIDE;
  const variant = item.birthday_variant || "before";
  const rawVariant =
    variantConfig ||
    item.birthday_variant_config ||
    birthdayVariantConfigs[variant] ||
    BIRTHDAY_FIXED_COPY[variant] ||
    {};
  const variantCfg = normalizeBirthdayVariantConfig(rawVariant, variant);
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
    video.setAttribute("muted", "");
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    void video.play().catch(() => {});
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
  const lines = normalizeBirthdayLines(variantCfg);
  const overlayWidth = BASE_CANVAS_WIDTH;
  const overlayHeight = BASE_CANVAS_HEIGHT;
  lines.forEach((entry, idx) => {
    const line = document.createElement("div");
    line.className = "birthday-slide-line" + (idx === 0 ? " birthday-slide-line--primary" : "");
    const opts = entry.options || BIRTHDAY_TEXT_OPTIONS_DEFAULT;
    const text = replaceTokens(entry.text ?? "");
    const content = document.createElement("span");
    content.className = "birthday-line-content";
    content.textContent = text;
    const color = opts.color || settings.title_color;
    if (color) {
      line.style.color = color;
    }
    line.style.fontWeight = opts.bold ? "700" : "400";
    line.style.fontStyle = opts.italic ? "italic" : "normal";
    line.style.textDecoration = opts.underline ? "underline" : "none";
    const baseFontSize =
      (idx === 0 && settings.title_font_size) || opts.font_size || BIRTHDAY_TEXT_OPTIONS_DEFAULT.font_size;
    line.style.fontSize = `${baseFontSize}px`;
    applyLineBackground(line, opts);
    const rawX = Number.isFinite(Number(opts.offset_x_percent)) ? Number(opts.offset_x_percent) : 0;
    const rawY = Number.isFinite(Number(opts.offset_y_percent)) ? Number(opts.offset_y_percent) : 0;
    const left = clampPercent(50 + rawX);
    const top = clampPercent(50 - rawY);
    line.style.left = `${left}%`;
    line.style.top = `${top}%`;
    const rawTemplateText = entry.text ?? "";
    if (sharedRenderers?.layoutOverlayTextLine) {
      sharedRenderers.layoutOverlayTextLine(
        line,
        content,
        text,
        rawTemplateText,
        opts,
        overlayWidth,
        overlayHeight,
      );
    } else {
      layoutOverlayLine(line, content, text, opts, overlayWidth, overlayHeight);
    }
    line.appendChild(content);
    linesWrapper.appendChild(line);
  });
  const pos = Number.isFinite(Number(settings.title_y_percent))
    ? Math.min(100, Math.max(0, Number(settings.title_y_percent)))
    : DEFAULT_BIRTHDAY_SLIDE.title_y_percent;
  overlay.style.justifyContent = "center";
  overlay.style.paddingTop = "0";
  overlay.style.alignItems = "center";
  overlay.append(linesWrapper);
  frameEl.appendChild(overlay);

  mediaWrapper.appendChild(frameEl);

  playbackTimer = setTimeout(() => {
    void advanceSlide().catch((error) => console.error(error));
  }, durationSeconds * 1000);
};

const normalizeTimeChangeLines = (settings) => {
  const base = Array.isArray(settings.lines) ? settings.lines : [];
  const normalized = base
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      text: typeof entry.text === "string" ? entry.text : "",
      options: { ...TIME_CHANGE_TEXT_OPTIONS_DEFAULT, ...(entry.options || {}) },
    }))
    .filter((entry) => (entry.text || "").trim().length);
  if (normalized.length) return normalized;
  // Fallback to legacy text1/text2/text3 format
  const legacy = [
    { text: settings.text1 || "", options: settings.text1_options || {} },
    { text: settings.text2 || "", options: settings.text2_options || {} },
    { text: settings.text3 || "", options: settings.text3_options || {} },
  ];
  return legacy
    .filter((entry) => (entry.text || "").trim().length)
    .map((entry) => ({
      text: entry.text,
      options: { ...TIME_CHANGE_TEXT_OPTIONS_DEFAULT, ...(entry.options || {}) },
    }));
};

const normalizeChristmasLines = (settings) => {
  const base = Array.isArray(settings.lines) ? settings.lines : [];
  const normalized = base
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      text: typeof entry.text === "string" ? entry.text : "",
      options: { ...CHRISTMAS_TEXT_OPTIONS_DEFAULT, ...(entry.options || {}) },
    }))
    .filter((entry) => (entry.text || "").trim().length);
  if (normalized.length) return normalized;
  // Fallback to legacy text1/text2/text3 format
  const legacy = [
    { text: settings.text1 || DEFAULT_CHRISTMAS_SLIDE.text1, options: settings.text1_options || {} },
    { text: settings.text2 || DEFAULT_CHRISTMAS_SLIDE.text2, options: settings.text2_options || {} },
    { text: settings.text3 || DEFAULT_CHRISTMAS_SLIDE.text3, options: settings.text3_options || {} },
  ];
  return legacy
    .filter((entry) => (entry.text || "").trim().length)
    .map((entry) => ({
      text: entry.text,
      options: { ...CHRISTMAS_TEXT_OPTIONS_DEFAULT, ...(entry.options || {}) },
    }));
};

const fetchChristmasInfo = async (force = false) => {
  const now = Date.now();
  if (!force && christmasInfo && now - lastChristmasFetch < CHRISTMAS_REFRESH_MS) {
    return christmasInfo;
  }
  try {
    const query =
      christmasSlideSettings && Number.isFinite(Number(christmasSlideSettings.days_before))
        ? `?days_before=${christmasSlideSettings.days_before}`
        : "";
    const data = await fetchJSON(`api/christmas-slide/next${query}`);
    christmasInfo = data && data.christmas ? data.christmas : null;
    lastChristmasFetch = Date.now();
  } catch (error) {
    console.warn("Impossible de charger les données de Noël:", error);
    christmasInfo = null;
    lastChristmasFetch = Date.now();
  }
  return christmasInfo;
};

const formatChristmasMessage = (template, info) => {
  const change = info || {};
  const days = Number.isFinite(Number(change.days_until)) ? Number(change.days_until) : null;
  const replacements = {
    days_until: days != null ? days : "",
    days_left: days != null ? days : "",
    days_label: days === 1 ? DAY_LABEL_PLURAL.singular : DAY_LABEL_PLURAL.plural,
    christmas_date: change.date_label || "25 décembre",
    christmas_weekday: change.weekday_label || "",
    year: change.year || new Date().getFullYear(),
  };
  return template.replace(/\[([^\]]+)\]/g, (match, key) =>
    replacements[key] !== undefined && replacements[key] !== null ? String(replacements[key]) : "",
  );
};

const renderChristmasSlide = (item) => {
  clearPlaybackTimer();
  mediaWrapper.innerHTML = "";
  const settings = christmasSlideSettings || DEFAULT_CHRISTMAS_SLIDE;
  const info = item.christmas || christmasInfo;
  const durationSeconds = Math.max(
    1,
    Math.round(Number(item.duration) || settings.duration || DEFAULT_CHRISTMAS_SLIDE.duration)
  );

  const viewport = document.createElement("div");
  viewport.className = "christmas-slide-viewport";

  const frame = document.createElement("div");
  frame.className = "christmas-slide-frame";

  const backdrop = document.createElement("div");
  backdrop.className = "christmas-slide-backdrop";
  const bgUrl = item.background_url || settings.background_url;
  const mime = (item.background_mimetype || settings.background_mimetype || "").toLowerCase();
  const ext = getExtension(bgUrl || "");
  const isVideo = mime.startsWith("video/") || ["mp4", "m4v", "mov", "webm", "mkv"].includes(ext);
  if (bgUrl && isVideo) {
    const video = document.createElement("video");
    video.className = "christmas-slide-media christmas-slide-video";
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
    img.className = "christmas-slide-media christmas-slide-image";
    img.src = bgUrl;
    img.alt = "Arrière-plan Noël";
    backdrop.appendChild(img);
  } else {
    backdrop.classList.add("christmas-slide-backdrop--fallback");
  }

  const overlay = document.createElement("div");
  overlay.className = "christmas-slide-overlay";

  const replaceTokens = (text) => formatChristmasMessage(text, info);
  const overlayWidth = BASE_CANVAS_WIDTH;
  const overlayHeight = BASE_CANVAS_HEIGHT;
  const makeLine = (text, options, extraClasses = "") => {
    const line = document.createElement("div");
    line.className = `christmas-line ${extraClasses}`.trim();
    const opts = options || CHRISTMAS_TEXT_OPTIONS_DEFAULT;
    const content = document.createElement("span");
    content.className = "christmas-line-content";
    content.textContent = replaceTokens(text || "");
    const color = opts.color || settings.text_color || "#f8fafc";
    line.style.color = color;
    line.style.fontWeight = opts.bold ? "700" : "400";
    line.style.fontStyle = opts.italic ? "italic" : "normal";
    line.style.textDecoration = opts.underline ? "underline" : "none";
    line.style.fontSize = `${opts.font_size || CHRISTMAS_TEXT_OPTIONS_DEFAULT.font_size}px`;
    applyLineBackground(line, opts);
    const offsetX = Number.isFinite(Number(opts.offset_x_percent)) ? Number(opts.offset_x_percent) : 0;
    const offsetY = Number.isFinite(Number(opts.offset_y_percent)) ? Number(opts.offset_y_percent) : 0;
    const left = Math.min(100, Math.max(0, 50 + offsetX));
    const top = Math.min(100, Math.max(0, 50 - offsetY));
    line.style.left = `${left}%`;
    line.style.top = `${top}%`;
    const renderedText = content.textContent || "";
    if (sharedRenderers?.layoutOverlayTextLine) {
      sharedRenderers.layoutOverlayTextLine(
        line,
        content,
        renderedText,
        text || "",
        opts,
        overlayWidth,
        overlayHeight,
      );
    } else {
      layoutOverlayLine(line, content, renderedText, opts, overlayWidth, overlayHeight);
    }
    line.appendChild(content);
    return line;
  };

  const linesWrapper = document.createElement("div");
  linesWrapper.className = "christmas-lines";
  const lines = normalizeChristmasLines(settings);
  lines.forEach((line, idx) => {
    linesWrapper.append(
      makeLine(line.text, line.options, idx === 0 ? "christmas-line--primary" : ""),
    );
  });

  overlay.append(linesWrapper);
  frame.append(backdrop, overlay);
  viewport.appendChild(frame);
  mediaWrapper.appendChild(viewport);

  playbackTimer = setTimeout(() => {
    void advanceSlide().catch((error) => console.error(error));
  }, durationSeconds * 1000);
};

const renderCustomSlide = (item) => {
  clearPlaybackTimer();
  mediaWrapper.innerHTML = "";
  currentVideo = null;
  const payload = item.custom_payload || {};
  const background = payload.background || null;
  const texts = Array.isArray(payload.texts)
    ? payload.texts.filter((entry) => typeof entry.value === "string" && entry.value.trim())
    : [];
  const tokenMap = buildCustomTokenMap(payload.meta || {});
  const durationSeconds = Math.max(
    1,
    Math.round(Number(item.duration) || DEFAULT_CUSTOM_SLIDE.duration),
  );

  const stageEl = document.createElement("div");
  stageEl.className = "custom-slide-stage";

  const backgroundLayer = document.createElement("div");
  backgroundLayer.className = "custom-slide-background";
  if (background && background.url) {
    const mime = (background.mimetype || "").toLowerCase();
    const isVideo = Boolean(background.is_video) || mime.startsWith("video/");
    if (isVideo) {
      const video = document.createElement("video");
      video.src = background.url;
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.className = "custom-slide-media custom-slide-video";
      backgroundLayer.appendChild(video);
      currentVideo = video;
    } else {
      const img = document.createElement("img");
      img.src = background.url;
      img.alt = "Fond Custom";
      img.className = "custom-slide-media custom-slide-image";
      backgroundLayer.appendChild(img);
    }
  } else {
    backgroundLayer.classList.add("custom-slide-background--fallback");
  }

  const overlay = document.createElement("div");
  overlay.className = "custom-slide-overlay";

  stageEl.append(backgroundLayer, overlay);
  mediaWrapper.appendChild(stageEl);

  const layoutTexts = () => {
    overlay.innerHTML = "";
    const overlayWidth = BASE_CANVAS_WIDTH;
    const overlayHeight = BASE_CANVAS_HEIGHT;
    if (!texts.length) {
      const placeholder = document.createElement("p");
      placeholder.className = "custom-slide-placeholder";
      placeholder.textContent = "Aucun texte configuré.";
      overlay.appendChild(placeholder);
      return;
    }
    texts.forEach((entry) => {
      overlay.appendChild(createCustomTextCard(entry, overlayWidth, overlayHeight, tokenMap));
    });
  };

  requestAnimationFrame(layoutTexts);
  playbackTimer = setTimeout(() => {
    void advanceSlide().catch((error) => console.error(error));
  }, durationSeconds * 1000);
};

// Weather icons map for slideshow display
const WEATHER_ICONS = {
  sunny: "☀️",
  cloudy: "☁️",
  rainy: "🌧️",
  snowy: "❄️",
  stormy: "⛈️",
  foggy: "🌫️",
  windy: "💨",
  default: "🌤️",
};

const fetchNewsData = async (force = false) => {
  const now = Date.now();
  if (!force && newsItems.length && now - lastNewsFetch < NEWS_REFRESH_MS) {
    return { settings: newsSlideSettings, items: newsItems };
  }
  try {
    const data = await fetchJSON("api/news-slide/items");
    newsItems = data.items || [];
    newsSlideSettings = { ...DEFAULT_NEWS_SLIDE, ...data.settings };
    lastNewsFetch = now;
    return { settings: newsSlideSettings, items: newsItems };
  } catch (err) {
    console.error("Error fetching news data:", err);
    return { settings: newsSlideSettings, items: newsItems };
  }
};

const fetchWeatherData = async (force = false) => {
  const now = Date.now();
  if (!force && weatherData && now - lastWeatherFetch < WEATHER_REFRESH_MS) {
    return { settings: weatherSlideSettings, data: weatherData };
  }
  try {
    const result = await fetchJSON("api/weather-slide/data");
    weatherData = result.weather || null;
    weatherSlideSettings = { ...DEFAULT_WEATHER_SLIDE, ...result.settings };
    lastWeatherFetch = now;
    return { settings: weatherSlideSettings, data: weatherData };
  } catch (err) {
    console.error("Error fetching weather data:", err);
    return { settings: weatherSlideSettings, data: weatherData };
  }
};

const refreshWeatherBackgroundUrls = async () => {
  if (!weatherSlideSettings?.enabled) {
    weatherBackgroundUrls = [];
    return;
  }
  try {
    const data = await fetchJSON("api/weather-slide/backgrounds");
    const backgrounds = data?.backgrounds || {};
    const seasonal = data?.seasonal_backgrounds || {};
    const filenames = new Set(
      [...Object.values(backgrounds), ...Object.values(seasonal)].filter((name) => typeof name === "string" && name)
    );
    if (!filenames.size) {
      weatherBackgroundUrls = [];
      return;
    }
    const items = Array.isArray(data?.items) ? data.items : [];
    const urls = items
      .filter((entry) => entry && filenames.has(entry.filename) && entry.url)
      .map((entry) => entry.url);
    if (!urls.length) {
      weatherBackgroundUrls = Array.from(filenames).map((name) =>
        buildApiUrl(`weather-slide/asset/${encodeURIComponent(name)}`)
      );
      return;
    }
    weatherBackgroundUrls = urls;
  } catch (error) {
    weatherBackgroundUrls = [];
  }
};

const renderNewsSlide = async (item) => {
  clearPlaybackTimer();
  mediaWrapper.innerHTML = "";
  currentVideo = null;

  const { settings, items } = await fetchNewsData();
  const durationSeconds = Math.max(1, Math.round(Number(item.duration) || settings.duration || 20));
  const backgroundColor = settings.card_background_color || settings.card_background || "#1a1a2e";
  const backgroundOpacity = clamp01(settings.card_background_opacity ?? 0.9);
  const titleColor = settings.card_title_color || settings.card_text_color || "#f8fafc";
  const timeColor = settings.card_time_color || "#94a3b8";
  const borderRadius = Number(settings.card_border_radius) || 12;
  const cardPadding = Number(settings.card_padding) || 20;
  const cardGap = Number(settings.card_gap) || 20;
  const cardsPerRow = Math.max(1, Math.min(4, parseInt(settings.cards_per_row, 10) || 1));
  const cardWidthPercent = Math.max(50, Math.min(100, Number(settings.card_width_percent) || 100));
  const cardHeightPercent = Math.max(0, Math.min(100, Number(settings.card_height_percent) || 0));
  const showImage = settings.show_image !== false;
  const showTime = settings.show_time !== false;
  const titleSize = Math.max(10, Number(settings.card_title_size) || 28);
  const timeSize = Math.max(10, Number(settings.card_time_size) || 18);
  const sourceSize = Math.max(10, Number(settings.card_source_size) || 16);
  const descriptionSize = Math.max(10, Number(settings.card_description_size) || 16);
  const imageWidth = Math.max(0, Number(settings.image_width) || 0);
  const imageHeight = Math.max(0, Number(settings.image_height) || 0);
  const { r, g, b } = hexToRgb(backgroundColor);
  const backgroundRgba = `rgba(${r}, ${g}, ${b}, ${backgroundOpacity})`;

  const viewport = document.createElement("div");
  viewport.className = "news-slide-viewport";

  const frame = document.createElement("div");
  frame.className = "news-slide-frame";
  frame.style.setProperty("--card-bg", backgroundRgba);
  frame.style.setProperty("--card-text", titleColor);
  frame.style.setProperty("--card-time", timeColor);
  frame.style.setProperty("--news-card-radius", `${borderRadius}px`);
  frame.style.setProperty("--news-card-padding", `${cardPadding}px`);
  frame.style.setProperty("--news-card-gap", `${cardGap}px`);
  frame.style.setProperty("--news-cards-per-row", `${cardsPerRow}`);
  frame.style.setProperty("--news-card-width", cardsPerRow > 1 ? "100%" : `${cardWidthPercent}%`);
  frame.style.setProperty("--news-title-size", `${titleSize}px`);
  frame.style.setProperty("--news-time-size", `${timeSize}px`);
  frame.style.setProperty("--news-source-size", `${sourceSize}px`);
  frame.style.setProperty("--news-description-size", `${descriptionSize}px`);
  if (imageWidth > 0) {
    frame.style.setProperty("--news-image-width", `${imageWidth}px`);
  } else {
    frame.style.removeProperty("--news-image-width");
  }
  if (imageHeight > 0) {
    frame.style.setProperty("--news-image-height", `${imageHeight}px`);
  } else {
    frame.style.removeProperty("--news-image-height");
  }
  frame.style.removeProperty("--news-card-min-height");

  const cardsContainer = document.createElement("div");
  cardsContainer.className = "news-slide-cards";

  if (!items.length) {
    const noItems = document.createElement("div");
    noItems.className = "news-slide-empty";
    noItems.textContent = "Aucune nouvelle disponible";
    cardsContainer.appendChild(noItems);
  } else {
    items.slice(0, settings.max_items || 10).forEach((newsItem) => {
      const card = document.createElement("div");
      card.className = "news-slide-card";

      if (showImage && newsItem.image) {
        const imgWrap = document.createElement("div");
        imgWrap.className = "news-card-image";
        const img = document.createElement("img");
        img.src = newsItem.image;
        img.alt = "";
        img.loading = "eager";
        imgWrap.appendChild(img);
        card.appendChild(imgWrap);
      }

      const content = document.createElement("div");
      content.className = "news-card-content";

      const title = document.createElement("h3");
      title.className = "news-card-title";
      title.textContent = newsItem.title || "";
      content.appendChild(title);

      if (newsItem.description) {
        const description = document.createElement("p");
        description.className = "news-card-description";
        description.textContent = newsItem.description;
        content.appendChild(description);
      }

      if (showTime) {
        const time = document.createElement("span");
        time.className = "news-card-time";
        const rawDate = newsItem.pubdate || newsItem.pubDate || "";
        if (rawDate) {
          const date = new Date(rawDate);
          if (!Number.isNaN(date.getTime())) {
            time.textContent = date.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
          }
        }
        if (!time.textContent && newsItem.time) {
          time.textContent = newsItem.time;
        }
        content.appendChild(time);
      }

      if (newsItem.source) {
        const source = document.createElement("span");
        source.className = "news-card-source";
        source.textContent = newsItem.source;
        content.appendChild(source);
      }

      card.appendChild(content);
      cardsContainer.appendChild(card);
    });
  }

  frame.appendChild(cardsContainer);
  viewport.appendChild(frame);
  mediaWrapper.appendChild(viewport);

  if (cardHeightPercent > 0) {
    requestAnimationFrame(() => {
      const frameHeight = frame.clientHeight;
      if (!frameHeight) return;
      const cardHeightPx = Math.max(60, Math.round((frameHeight * cardHeightPercent) / 100));
      frame.style.setProperty("--news-card-min-height", `${cardHeightPx}px`);
    });
  }

  // Setup scrolling animation
  const scrollDelay = (settings.scroll_delay || 3) * 1000;
  const scrollSpeed = settings.scroll_speed || 50;
  let scrollFrame = null;
  let scrollY = 0;

  const startScroll = () => {
    const containerHeight = cardsContainer.scrollHeight;
    const viewportHeight = frame.clientHeight;
    if (containerHeight <= viewportHeight) {
      playbackTimer = setTimeout(() => {
        void advanceSlide().catch((error) => console.error(error));
      }, (durationSeconds - scrollDelay / 1000) * 1000);
      return;
    }

    const scrollDistance = containerHeight;
    const scrollDuration = (scrollDistance / scrollSpeed) * 1000;

    const animateScroll = () => {
      scrollY += scrollSpeed / 60;
      cardsContainer.style.transform = `translateY(-${scrollY}px)`;
      if (scrollY >= scrollDistance) {
        cancelAnimationFrame(scrollFrame);
        void advanceSlide().catch((error) => console.error(error));
        return;
      }
      scrollFrame = requestAnimationFrame(animateScroll);
    };

    scrollFrame = requestAnimationFrame(animateScroll);
  };

  setTimeout(startScroll, scrollDelay);
};

const renderWeatherSlide = async (item) => {
  clearPlaybackTimer();
  mediaWrapper.innerHTML = "";
  currentVideo = null;

  const { settings, data } = await fetchWeatherData(previewSlideType === "weather");
  const durationSeconds = Math.max(1, Math.round(Number(item.duration) || settings.duration || 15));

  const viewport = document.createElement("div");
  viewport.className = "weather-slide-viewport";

  const frame = document.createElement("div");
  frame.className = "weather-slide-frame";

  // Background based on condition
  const condition = data?.condition || data?.current?.condition || "default";
  const bgUrl = settings.backgrounds?.[condition] || settings.backgrounds?.default;
  const seasonBgUrl = settings.seasonal_backgrounds?.[data?.season];

  const backdrop = document.createElement("div");
  backdrop.className = "weather-slide-backdrop";
  
  if (bgUrl || seasonBgUrl) {
    const url = bgUrl || seasonBgUrl;
    const ext = getExtension(url || "");
    const isVideo = ["mp4", "m4v", "mov", "webm", "mkv"].includes(ext);
    if (isVideo) {
      const video = document.createElement("video");
      video.className = "weather-slide-media weather-slide-video";
      video.src = url;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      backdrop.appendChild(video);
      currentVideo = video;
    } else {
      const img = document.createElement("img");
      img.className = "weather-slide-media weather-slide-image";
      img.src = url;
      img.alt = "Arrière-plan météo";
      backdrop.appendChild(img);
    }
  } else {
    backdrop.classList.add("weather-slide-backdrop--fallback");
    backdrop.style.background = "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)";
  }

  const overlay = document.createElement("div");
  overlay.className = "weather-slide-overlay";
  overlay.style.setProperty("--weather-slide-icon-size", `${Number(settings.icon_size) || 120}px`);
  overlay.style.setProperty("--weather-slide-temp-size", `${Number(settings.temp_size) || 80}px`);
  overlay.style.setProperty("--weather-slide-condition-size", `${Number(settings.condition_size) || 32}px`);
  overlay.style.setProperty("--weather-slide-detail-label-size", `${Number(settings.detail_label_size) || 17}px`);
  overlay.style.setProperty("--weather-slide-detail-value-size", `${Number(settings.detail_value_size) || 25}px`);
  overlay.style.setProperty("--weather-slide-forecast-text-size", `${Number(settings.forecast_temp_size) || 17}px`);
  overlay.style.setProperty("--weather-slide-forecast-icon-size", `${Number(settings.forecast_icon_size) || 35}px`);
  overlay.style.setProperty("--weather-slide-forecast-min-width", `${Number(settings.forecast_min_width) || 110}px`);
  overlay.style.setProperty("--weather-card-opacity", `${Number(settings.card_opacity) || 1}`);

  if (!data) {
    const noData = document.createElement("div");
    noData.className = "weather-slide-empty";
    noData.textContent = "Données météo non disponibles";
    overlay.appendChild(noData);
  } else {
    const current = data?.current || data || {};

    const preview = document.createElement("div");
    preview.className = "weather-layout";

    const currentCard = document.createElement("div");
    currentCard.className = "weather-card weather-card-combined";

    const locationLabel = document.createElement("div");
    locationLabel.className = "weather-location";
    locationLabel.textContent = data.location || current.location || settings.location || "";
    currentCard.appendChild(locationLabel);

    const currentBlock = document.createElement("div");
    currentBlock.className = "weather-current";

    const icon = document.createElement("div");
    icon.className = "weather-icon";
    icon.textContent = current.icon || WEATHER_ICONS[condition] || WEATHER_ICONS.default;
    currentBlock.appendChild(icon);

    if (settings.show_current && current.temperature !== undefined) {
      const temp = document.createElement("div");
      temp.className = "weather-temp";
      temp.textContent = `${Math.round(current.temperature)}°C`;
      currentBlock.appendChild(temp);
    }

    const conditionLabel = document.createElement("div");
    conditionLabel.className = "weather-condition";
    conditionLabel.textContent = current.condition_label || data.condition_label || "";
    currentBlock.appendChild(conditionLabel);

    currentCard.appendChild(currentBlock);

    const details = document.createElement("div");
    details.className = "weather-details";
    const todayForecast = Array.isArray(data.forecast) ? data.forecast[0] : null;

    const formatTemp = (value, feels) => {
      const tempLabel = value != null ? Math.round(value) : "--";
      const feelsLabel = feels != null ? Math.round(feels) : "--";
      return `
        <span class="temp-split">
          <span class="temp-value">${tempLabel}°C</span>
          <span class="temp-feels">(${feelsLabel})</span>
        </span>
      `;
    };

    if (todayForecast?.temp_day !== undefined) {
      const tempDay = document.createElement("div");
      tempDay.className = "weather-detail";
      tempDay.innerHTML = `<span class="detail-label">Jour</span><span class="detail-value">${formatTemp(todayForecast.temp_day, todayForecast.feels_day)}</span>`;
      details.appendChild(tempDay);
    }

    if (todayForecast?.temp_evening !== undefined) {
      const tempEvening = document.createElement("div");
      tempEvening.className = "weather-detail";
      tempEvening.innerHTML = `<span class="detail-label">Soir</span><span class="detail-value">${formatTemp(todayForecast.temp_evening, todayForecast.feels_evening)}</span>`;
      details.appendChild(tempEvening);
    }

    if (todayForecast?.temp_night !== undefined) {
      const tempNight = document.createElement("div");
      tempNight.className = "weather-detail";
      tempNight.innerHTML = `<span class="detail-label">Nuit</span><span class="detail-value">${formatTemp(todayForecast.temp_night, todayForecast.feels_night)}</span>`;
      details.appendChild(tempNight);
    }

    if (current.temp_max !== undefined || current.temp_min !== undefined) {
      const range = document.createElement("div");
      range.className = "weather-detail";
      const maxLabel = current.temp_max != null ? Math.round(current.temp_max) : "--";
      const minLabel = current.temp_min != null ? Math.round(current.temp_min) : "--";
      range.innerHTML = `<span class="detail-label">Max</span><span class="detail-value">${maxLabel}°C</span>`;
      details.appendChild(range);

      const min = document.createElement("div");
      min.className = "weather-detail";
      min.innerHTML = `<span class="detail-label">Min</span><span class="detail-value">${minLabel}°C</span>`;
      details.appendChild(min);
    }

    if (settings.show_humidity && current.humidity !== undefined) {
      const humidity = document.createElement("div");
      humidity.className = "weather-detail";
      humidity.innerHTML = `<span class="detail-label">Humidité</span><span class="detail-value">${current.humidity}%</span>`;
      details.appendChild(humidity);
    }

    if (settings.show_wind && current.wind_speed !== undefined) {
      const wind = document.createElement("div");
      wind.className = "weather-detail";
      wind.innerHTML = `<span class="detail-label">Vent</span><span class="detail-value">${Math.round(current.wind_speed)} km/h</span>`;
      details.appendChild(wind);
    }

    currentCard.appendChild(details);

    if (settings.show_forecast && Array.isArray(data.forecast) && data.forecast.length) {
      const forecastWrap = document.createElement("div");
      forecastWrap.className = "weather-forecast-row";

      const rows = data.forecast.slice(1, (settings.forecast_days || 5) + 1).map((day) => `
        <tr>
          <td class="forecast-cell weekday">${day.weekday || "--"}</td>
          <td class="forecast-cell icon">${day.icon || WEATHER_ICONS[day.condition] || WEATHER_ICONS.default}</td>
          <td class="forecast-cell number">${formatTemp(day.temp_day, day.feels_day)}</td>
          <td class="forecast-cell number">${formatTemp(day.temp_evening, day.feels_evening)}</td>
          <td class="forecast-cell number">${formatTemp(day.temp_night, day.feels_night)}</td>
          <td class="forecast-cell number">${day.temp_max != null ? Math.round(day.temp_max) : "--"}°</td>
          <td class="forecast-cell number">${day.temp_min != null ? Math.round(day.temp_min) : "--"}°</td>
          <td class="forecast-cell number">${day.wind_max != null ? `${Math.round(day.wind_max)} km/h${day.wind_peak ? ` (${day.wind_peak})` : ""}` : "-- km/h"}</td>
        </tr>
      `).join("");

      const forecastCard = document.createElement("div");
      forecastCard.className = "forecast-day forecast-day-table";
      forecastCard.innerHTML = `
        <div class="forecast-legend">Ressenti entre ()</div>
        <table class="forecast-table">
          <colgroup>
            <col class="col-day" />
            <col class="col-icon" />
            <col class="col-temp" />
            <col class="col-temp" />
            <col class="col-temp" />
            <col class="col-max" />
            <col class="col-min" />
            <col class="col-wind" />
          </colgroup>
          <thead>
            <tr>
              <th>Jour</th>
              <th></th>
              <th>Jour</th>
              <th>Soir</th>
              <th>Nuit</th>
              <th>Max</th>
              <th>Min</th>
              <th>Vent</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
      forecastWrap.appendChild(forecastCard);
      currentCard.appendChild(forecastWrap);
    }

    preview.appendChild(currentCard);
    overlay.appendChild(preview);
  }

  frame.append(backdrop, overlay);
  viewport.appendChild(frame);
  mediaWrapper.appendChild(viewport);

  playbackTimer = setTimeout(() => {
    void advanceSlide().catch((error) => console.error(error));
  }, durationSeconds * 1000);
};

const renderTimeChangeSlide = (item) => {
  clearPlaybackTimer();
  mediaWrapper.innerHTML = "";
  const settings = timeChangeSlideSettings || DEFAULT_TIME_CHANGE_SLIDE;
  const info = item.time_change || timeChangeInfo;
  const durationSeconds = Math.max(
    1,
    Math.round(Number(item.duration) || settings.duration || DEFAULT_TIME_CHANGE_SLIDE.duration)
  );

  const viewport = document.createElement("div");
  viewport.className = "time-change-slide-viewport";

  const frame = document.createElement("div");
  frame.className = "time-change-slide-frame";

  const backdrop = document.createElement("div");
  backdrop.className = "time-change-slide-backdrop";
  const bgUrl = item.background_url || settings.background_url;
  const mime = (item.background_mimetype || settings.background_mimetype || "").toLowerCase();
  const ext = getExtension(bgUrl || "");
  const isVideo = mime.startsWith("video/") || ["mp4", "m4v", "mov", "webm", "mkv"].includes(ext);
  if (bgUrl && isVideo) {
    const video = document.createElement("video");
    video.className = "time-change-slide-media time-change-slide-video";
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
    img.className = "time-change-slide-media time-change-slide-image";
    img.src = bgUrl;
    img.alt = "Arrière-plan changement d'heure";
    backdrop.appendChild(img);
  } else {
    backdrop.classList.add("time-change-slide-backdrop--fallback");
  }

  const overlay = document.createElement("div");
  overlay.className = "time-change-slide-overlay";

  const replaceTokens = (text) => formatTimeChangeMessage(text, info);
  const overlayWidth = BASE_CANVAS_WIDTH;
  const overlayHeight = BASE_CANVAS_HEIGHT;
  const makeLine = (text, options, extraClasses = "") => {
    const line = document.createElement("div");
    line.className = `time-change-line ${extraClasses}`.trim();
    const opts = options || TIME_CHANGE_TEXT_OPTIONS_DEFAULT;
    const content = document.createElement("span");
    content.className = "time-change-line-content";
    content.textContent = replaceTokens(text || "");
    const color = opts.color || settings.text_color || "#f8fafc";
    line.style.color = color;
    line.style.fontWeight = opts.bold ? "700" : "400";
    line.style.fontStyle = opts.italic ? "italic" : "normal";
    line.style.textDecoration = opts.underline ? "underline" : "none";
    line.style.fontSize = `${opts.font_size || TIME_CHANGE_TEXT_OPTIONS_DEFAULT.font_size}px`;
    applyLineBackground(line, opts);
    const offsetX = Number.isFinite(Number(opts.offset_x_percent)) ? Number(opts.offset_x_percent) : 0;
    const offsetY = Number.isFinite(Number(opts.offset_y_percent)) ? Number(opts.offset_y_percent) : 0;
    const left = Math.min(100, Math.max(0, 50 + offsetX));
    const top = Math.min(100, Math.max(0, 50 - offsetY));
    line.style.left = `${left}%`;
    line.style.top = `${top}%`;
    const renderedText = content.textContent || "";
    if (sharedRenderers?.layoutOverlayTextLine) {
      sharedRenderers.layoutOverlayTextLine(
        line,
        content,
        renderedText,
        text || "",
        opts,
        overlayWidth,
        overlayHeight,
      );
    } else {
      layoutOverlayLine(line, content, renderedText, opts, overlayWidth, overlayHeight);
    }
    line.appendChild(content);
    return line;
  };

  const linesWrapper = document.createElement("div");
  linesWrapper.className = "time-change-lines";
  const lines = normalizeTimeChangeLines(settings);
  lines.forEach((line, idx) => {
    linesWrapper.append(
      makeLine(line.text, line.options, idx === 0 ? "time-change-line--primary" : ""),
    );
  });

  overlay.append(linesWrapper);
  frame.append(backdrop, overlay);
  viewport.appendChild(frame);
  mediaWrapper.appendChild(viewport);

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
  background_url: teamSlideSettings.background_url || null,
  background_mimetype: teamSlideSettings.background_mimetype || null,
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

const buildTimeChangeSlideItem = (changeInfo) => {
  const filename = timeChangeSlideSettings.background_path || TIME_CHANGE_SLIDE_ID;
  const mimetype =
    timeChangeSlideSettings.background_mimetype || "application/x-time-change-slide";
  const duration = Math.max(
    1,
    Number(timeChangeSlideSettings.duration) || DEFAULT_TIME_CHANGE_SLIDE.duration,
  );
  const changeAt = changeInfo?.change_at || changeInfo?.change_at_local || null;
  return {
    id: TIME_CHANGE_SLIDE_ID,
    time_change_slide: true,
    original_name: "Changement d'heure",
    filename,
    duration,
    enabled: true,
    skip_rounds: 0,
    mimetype,
    display_mimetype: mimetype,
    background_url: timeChangeSlideSettings.background_url,
    background_mimetype: timeChangeSlideSettings.background_mimetype,
    order: Number(timeChangeSlideSettings.order_index) || 0,
    time_change: changeInfo || null,
    time_change_at: changeAt,
  };
};

const buildChristmasSlideItem = (christmasData) => {
  const filename = christmasSlideSettings.background_path || CHRISTMAS_SLIDE_ID;
  const mimetype =
    christmasSlideSettings.background_mimetype || "application/x-christmas-slide";
  const duration = Math.max(
    1,
    Number(christmasSlideSettings.duration) || DEFAULT_CHRISTMAS_SLIDE.duration,
  );
  return {
    id: CHRISTMAS_SLIDE_ID,
    christmas_slide: true,
    original_name: "Noël",
    filename,
    duration,
    enabled: true,
    skip_rounds: 0,
    mimetype,
    display_mimetype: mimetype,
    background_url: christmasSlideSettings.background_url,
    background_mimetype: christmasSlideSettings.background_mimetype,
    order: Number(christmasSlideSettings.order_index) || 0,
    christmas: christmasData || null,
  };
};

const fetchTestSlide = async (force = false) => {
  const now = Date.now();
  if (!force && testSlidePayload && now - lastTestSlideFetch < TEST_SLIDE_REFRESH_MS) {
    return testSlidePayload;
  }
  try {
    const data = await fetchJSON("api/test/slide");
    testSlidePayload = data || null;
    lastTestSlideFetch = now;
    return testSlidePayload;
  } catch (error) {
    console.warn("Impossible de récupérer la diapo personnalisée:", error);
    testSlidePayload = null;
    lastTestSlideFetch = now;
    return null;
  }
};

const buildTestSlideItem = (testData) => {
  const background = testData?.background || null;
  const mimetype = (background && background.mimetype) || "application/x-custom-slide";
  const duration = Math.max(
    1,
    Number(testData?.duration) || DEFAULT_CUSTOM_SLIDE.duration,
  );
  const orderIndex = Number.isFinite(Number(testData?.order_index))
    ? Number(testData.order_index)
    : 0;
  const slideName = testData?.meta?.name || "Diapo personnalisée";
  const itemId = `${CUSTOM_SLIDE_ID}test`;
  return {
    id: itemId,
    custom_slide: true,
    custom_slide_id: null,
    original_name: slideName,
    filename: background?.name || itemId,
    duration,
    enabled: true,
    skip_rounds: 0,
    mimetype,
    display_mimetype: mimetype,
    background,
    order: orderIndex,
    custom_payload: {
      background,
      texts: Array.isArray(testData?.texts) ? testData.texts : [],
      meta: testData?.meta || null,
      signature: testData?.signature || null,
    },
  };
};

const fetchCustomSlidesList = async (force = false) => {
  const now = Date.now();
  if (
    !force &&
    Array.isArray(customSlidesPayload) &&
    now - lastCustomSlidesFetch < CUSTOM_SLIDE_REFRESH_MS
  ) {
    return customSlidesPayload;
  }
  try {
    const data = await fetchJSON("api/custom-slides");
    const items = Array.isArray(data?.items) ? data.items : [];
    customSlidesPayload = items;
    lastCustomSlidesFetch = now;
    return items;
  } catch (error) {
    console.warn("Impossible de récupérer les diapos personnalisées:", error);
    customSlidesPayload = [];
    lastCustomSlidesFetch = now;
    return [];
  }
};

const buildCustomSlideItem = (customData) => {
  const background = customData?.background || null;
  const mimetype = (background && background.mimetype) || "application/x-custom-slide";
  const duration = Math.max(
    1,
    Number(customData?.duration) || DEFAULT_CUSTOM_SLIDE.duration,
  );
  const slideName =
    (customData?.meta && customData.meta.name) || customData?.name || "Diapo personnalisée";
  const slideId = customData?.id || "";
  const itemId = slideId ? `${CUSTOM_SLIDE_ID}${slideId}` : CUSTOM_SLIDE_ID;
  const orderIndex = Number.isFinite(Number(customData?.order_index))
    ? Number(customData.order_index)
    : 0;
  return {
    id: itemId,
    custom_slide: true,
    custom_slide_id: slideId || null,
    original_name: slideName,
    filename: background?.name || itemId,
    duration,
    enabled: true,
    skip_rounds: 0,
    mimetype,
    display_mimetype: mimetype,
    background,
    order: orderIndex,
    custom_payload: {
      background,
      texts: Array.isArray(customData?.texts) ? customData.texts : [],
      meta: customData?.meta || null,
      signature: customData?.signature || null,
    },
  };
};

const injectAutoSlidesIntoPlaylist = async (items) => {
  const base = Array.isArray(items) ? [...items] : [];
  const enhancedBase = base
    .map((item, idx) => {
      const orderVal = Number.isFinite(Number(item.order)) ? Number(item.order) : idx;
      return { ...item, order: orderVal, _baseIndex: idx };
    })
    .sort((a, b) => {
      const oa = Number.isFinite(Number(a.order)) ? Number(a.order) : 0;
      const ob = Number.isFinite(Number(b.order)) ? Number(b.order) : 0;
      if (oa !== ob) return oa - ob;
      return (a._baseIndex || 0) - (b._baseIndex || 0);
    })
    .map((item) => {
      const cloned = { ...item };
      delete cloned._baseIndex;
      return cloned;
    });
  const autoEntries = [];

  // Les diapos "auto" sont affichées en premier, puis la playlist des médias dans son ordre.
  // On conserve `order_index` uniquement pour ordonner les diapos auto entre elles.
  const normalizedOrderIndex = (value, fallbackIndex = 1_000_000) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    return fallbackIndex;
  };

  if (timeChangeSlideSettings.enabled) {
    const change = await fetchTimeChangeInfo();
    const daysLimit = Number.isFinite(Number(timeChangeSlideSettings.days_before))
      ? Number(timeChangeSlideSettings.days_before)
      : DEFAULT_TIME_CHANGE_SLIDE.days_before;
    if (change && (change.days_until == null || change.days_until <= daysLimit)) {
      const timeChangeItem = buildTimeChangeSlideItem(change);
      autoEntries.push({
        ...timeChangeItem,
        order: normalizedOrderIndex(timeChangeSlideSettings.order_index),
      });
    }
  }

  if (christmasSlideSettings.enabled) {
    const christmas = await fetchChristmasInfo();
    const daysLimit = Number.isFinite(Number(christmasSlideSettings.days_before))
      ? Number(christmasSlideSettings.days_before)
      : DEFAULT_CHRISTMAS_SLIDE.days_before;
    if (christmas && (christmas.days_until == null || christmas.days_until <= daysLimit)) {
      const christmasItem = buildChristmasSlideItem(christmas);
      autoEntries.push({
        ...christmasItem,
        order: normalizedOrderIndex(christmasSlideSettings.order_index),
      });
    }
  }

  if (birthdaySlideSettings.enabled) {
    const birthdayList = await ensureBirthdayEmployeesData();
    if (Array.isArray(birthdayList) && birthdayList.length) {
      const startOrder = normalizedOrderIndex(birthdaySlideSettings.order_index);
      birthdayList.forEach((data, idx) => {
        const birthdayItem = buildBirthdaySlideItem(data);
        // Décale légèrement pour préserver l'ordre absolu et stable des multiples anniversaires.
        const order = startOrder + idx * 0.001;
        autoEntries.push({ ...birthdayItem, order });
      });
    }
  }

  if (teamSlideSettings.enabled) {
    await ensureTeamEmployeesData();
    if (teamEmployeesData.length) {
      const teamItem = buildTeamSlideItem();
      autoEntries.push({
        ...teamItem,
        order: normalizedOrderIndex(teamSlideSettings.order_index),
      });
    }
  }

  if (testSlideSettings.enabled) {
    const testData = await fetchTestSlide();
    if (testData?.enabled && testData?.has_background && testData?.has_texts) {
      const testItem = buildTestSlideItem(testData);
      autoEntries.push({
        ...testItem,
        order: normalizedOrderIndex(testData.order_index),
      });
    }
  }

  const customSlides = await fetchCustomSlidesList();
  if (Array.isArray(customSlides) && customSlides.length) {
    customSlides.forEach((customData) => {
      if (!customData?.enabled) return;
      if (!(customData.has_background && customData.has_texts)) return;
      const customItem = buildCustomSlideItem(customData);
      autoEntries.push({
        ...customItem,
        order: normalizedOrderIndex(customData.order_index),
      });
    });
  }

  // News slide injection
  if (newsSlideSettings.enabled) {
    const newsItem = {
      id: NEWS_SLIDE_ID,
      news_slide: true,
      duration: newsSlideSettings.duration || DEFAULT_NEWS_SLIDE.duration,
      filename: "news_slide",
      mimetype: "application/x-news-slide",
    };
    autoEntries.push({
      ...newsItem,
      order: normalizedOrderIndex(newsSlideSettings.order_index),
    });
  }

  // Weather slide injection
  if (weatherSlideSettings.enabled) {
    const weatherItem = {
      id: WEATHER_SLIDE_ID,
      weather_slide: true,
      duration: weatherSlideSettings.duration || DEFAULT_WEATHER_SLIDE.duration,
      filename: "weather_slide",
      mimetype: "application/x-weather-slide",
    };
    autoEntries.push({
      ...weatherItem,
      order: normalizedOrderIndex(weatherSlideSettings.order_index),
    });
  }

  autoEntries.sort((a, b) => {
    const oa = Number.isFinite(Number(a.order)) ? Number(a.order) : 0;
    const ob = Number.isFinite(Number(b.order)) ? Number(b.order) : 0;
    if (oa === ob) return String(a.id || "").localeCompare(String(b.id || ""));
    return oa - ob;
  });
  return [...autoEntries, ...enhancedBase];
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

  if (slideshowCache?.updateCacheForPlaylist) {
    void slideshowCache.updateCacheForPlaylist(playlist, weatherBackgroundUrls);
  }

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
    updateInfoBandWidgetProgress();
    return { empty: true, restart: false, changed };
  }

  if (currentId == null) {
    currentIndex = 0;
    currentId = playlist[0].id;
    updateInfoBandWidgetProgress();
    return { empty: false, restart: true, changed };
  }

  const newIndex = playlist.findIndex((item) => item.id === currentId);
  if (newIndex === -1) {
    currentIndex = 0;
    currentId = playlist[0].id;
    updateInfoBandWidgetProgress();
    return { empty: false, restart: true, changed };
  }

  currentIndex = newIndex;
  updateInfoBandWidgetProgress();
  return { empty: false, restart: false, changed };
};

const showMedia = async (item, { maintainSkip = false } = {}) => {
  clearPlaybackTimer();
  setStatus("");

  currentItem = item;
  currentId = item.id;
  const index = playlist.findIndex((candidate) => candidate.id === item.id);
  if (index >= 0) {
    currentIndex = index;
  }

  updateInfoBandWidgetProgress();

  noteItemDisplayed(item, { maintainSkip });

  const durationSeconds = Math.max(1, Math.round(Number(item.duration) || 10));
  const kind = detectMediaKind(item);

  if (kind === "team") {
    const employeesForSlide = await ensureTeamEmployeesData();
    renderTeamSlide(item, employeesForSlide);
    return;
  }
  if (kind === "birthday") {
    const variant = item.birthday_variant || "before";
    const variantCfg = await loadBirthdayVariantConfig(variant);
    renderBirthdaySlide(item, variantCfg);
    return;
  }
  if (kind === "time-change") {
    renderTimeChangeSlide(item);
    return;
  }
  if (kind === "christmas") {
    renderChristmasSlide(item);
    return;
  }
  if (kind === "custom") {
    renderCustomSlide(item);
    return;
  }
  if (kind === "news") {
    await renderNewsSlide(item);
    return;
  }
  if (kind === "weather") {
    await renderWeatherSlide(item);
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

window.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  if (data.type === "news:preview") {
    if (data.settings && typeof data.settings === "object") {
      newsSlideSettings = { ...newsSlideSettings, ...data.settings };
    }
    if (Array.isArray(data.items)) {
      newsItems = data.items;
      lastNewsFetch = Date.now();
    }
    if (previewSlideType === "news") {
      const previewItem = currentItem && detectMediaKind(currentItem) === "news"
        ? currentItem
        : {
            news_slide: true,
            duration: newsSlideSettings.duration || DEFAULT_NEWS_SLIDE.duration || 20,
            filename: "news_slide",
            mimetype: "application/x-news-slide",
          };
      void renderNewsSlide(previewItem);
    }
    return;
  }
  if (data.type === "weather:refresh") {
    if (previewSlideType === "weather") {
      void renderWeatherSlide({
        weather_slide: true,
        duration: weatherSlideSettings.duration || DEFAULT_WEATHER_SLIDE.duration || 15,
        filename: "weather_slide",
        mimetype: "application/x-weather-slide",
      });
    }
  }
});

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
    if (!isPreviewMode) {
      void refreshOverlaySettings();
      void refreshInfoBandsLayout();
    }
  }, 30000);
};

const startSlideshow = async () => {
  if (slideshowCache?.ensureServiceWorker) {
    void slideshowCache.ensureServiceWorker();
  }

  // Initialize info bands layout before showing content
  await initInfoBands();

  await loadBirthdayCustomFonts();
  if (!isPreviewMode || isSingleSlideMode) {
    await refreshOverlaySettings();
    await refreshWeatherBackgroundUrls();
    if (infoBandsConfig) {
      renderInfoBandWidgets(infoBandsConfig);
    }
  } else {
    applyOverlaySettings({ enabled: false, logo_path: "", ticker_text: "" });
  }

  if (isSingleSlideMode) {
    const item = buildSingleSlideItem(previewSlideType);
    if (!item) {
      handleEmptyPlaylist();
      return false;
    }
    playlist = [item];
    playlistSignature = computeSignature(playlist);
    currentIndex = 0;
    currentId = item.id;
    if (stage) {
      stage.hidden = false;
    }
    await showMedia(item);
    return true;
  }
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
