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
const BIRTHDAY_MAX_LINES = 50;
const birthdayCustomFonts = [];

const TIME_CHANGE_TEXT_OPTIONS_DEFAULT = { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, color: "#f8fafc" };
const clampPercent = (value) => Math.min(100, Math.max(0, value));

const DEFAULT_TIME_CHANGE_SLIDE = {
  enabled: false,
  order_index: 0,
  duration: 12,
  background_url: null,
  background_mimetype: null,
  background_path: null,
  days_before: 7,
  offset_hours: 1,
  title_text: "Annonce Changement d'heure (Été / Hiver)",
  message_template:
    "Le [change_weekday] [change_date] à [change_time], on va [direction_verb] l'heure de [offset_hours]h " +
    "(de [offset_from] à [offset_to]). Il reste [days_until] [days_label] avant l'heure [season_label].",
  title_font_size: 42,
  message_font_size: 24,
  meta_font_size: 18,
  text_color: "#f8fafc",
  text1: "Annonce Changement d'heure (Été / Hiver)",
  text2:
    "Le [change_weekday] [change_date] à [change_time], on va [direction_verb] l'heure de [offset_hours]h (de [offset_from] à [offset_to]).",
  text3: "Il reste [days_until] [days_label] avant l'heure [season_label].",
  text1_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
  text2_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
  text3_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
};

const CHRISTMAS_TEXT_OPTIONS_DEFAULT = { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, color: "#f8fafc" };

const DEFAULT_CHRISTMAS_SLIDE = {
  enabled: false,
  order_index: 0,
  duration: 12,
  background_url: null,
  background_mimetype: null,
  background_path: null,
  days_before: 25,
  title_text: "🎄 Joyeux Noël ! 🎄",
  title_font_size: 64,
  text_color: "#f8fafc",
  text1: "🎄 Joyeux Noël ! 🎄",
  text2: "Plus que [days_until] [days_label] avant Noël !",
  text3: "Toute l'équipe vous souhaite de joyeuses fêtes !",
  text1_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, color: "#f8fafc" },
  text2_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, color: "#fbbf24" },
  text3_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, color: "#f8fafc" },
  lines: [
    { text: "🎄 Joyeux Noël ! 🎄", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, font_size: 64, color: "#f8fafc", offset_y_percent: -15 } },
    { text: "Plus que [days_until] [days_label] avant Noël !", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, font_size: 36, color: "#fbbf24" } },
    { text: "Toute l'équipe vous souhaite de joyeuses fêtes !", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, font_size: 28, color: "#f8fafc", offset_y_percent: 15 } },
  ],
};

const DEFAULT_CUSTOM_SLIDE = {
  enabled: false,
  order_index: 0,
  duration: 12,
};
const DEFAULT_CUSTOM_TEXT_POSITION = { x: 50, y: 80 };
const DEFAULT_CUSTOM_TEXT_SIZE = { width: 30, height: 12 };
const DEFAULT_CUSTOM_TEXT_COLOR = "#e10505";
const DEFAULT_CUSTOM_TEXT_STYLE = {
  font_family: "Poppins",
  bold: false,
  italic: false,
  underline: false,
};
const DEFAULT_CUSTOM_TEXT_BACKGROUND = { color: "#000000", opacity: 0 };
const CUSTOM_DATE_FORMAT = new Intl.DateTimeFormat("fr-CA", { dateStyle: "long" });
const CUSTOM_TIME_FORMAT = new Intl.DateTimeFormat("fr-CA", { timeStyle: "short" });
const CUSTOM_WEEKDAY_FORMAT = new Intl.DateTimeFormat("fr-CA", { weekday: "long" });
const CUSTOM_MONTH_FORMAT = new Intl.DateTimeFormat("fr-CA", { month: "long" });

const BIRTHDAY_FIXED_COPY = {
  before: {
    text1: "(Texte 1)",
    text2: "(Texte 2)",
    text3: "(Texte 3)",
    text1_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    text2_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    text3_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    lines: [
      { text: "(Texte 1)", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT } },
      { text: "(Texte 2)", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT } },
      { text: "(Texte 3)", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT } },
    ],
  },
  day: {
    text1: "(Texte 1)",
    text2: "(Texte 2)",
    text3: "(Texte 3)",
    text1_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    text2_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    text3_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    lines: [
      { text: "(Texte 1)", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT } },
      { text: "(Texte 2)", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT } },
      { text: "(Texte 3)", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT } },
    ],
  },
  weekend: {
    text1: "(Texte 1)",
    text2: "(Texte 2)",
    text3: "(Texte 3)",
    text1_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    text2_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    text3_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    lines: [
      { text: "(Texte 1)", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT } },
      { text: "(Texte 2)", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT } },
      { text: "(Texte 3)", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT } },
    ],
  },
};

const TEAM_SLIDE_SCALE = 1.25;

const TEAM_CARDS_PER_PAGE = 4;
const TEAM_EMPLOYEES_REFRESH_MS = 15_000;
const TEAM_TITLE_HOLD_MS = 3000;

const TEAM_SLIDE_ID = "__team_slide_auto__";
const BIRTHDAY_SLIDE_ID = "__birthday_slide_auto__";
const TIME_CHANGE_SLIDE_ID = "__time_change_slide_auto__";
const CHRISTMAS_SLIDE_ID = "__christmas_slide_auto__";
const CUSTOM_SLIDE_ID = "__custom_slide_auto__";
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
let timeChangeSlideSettings = { ...DEFAULT_TIME_CHANGE_SLIDE };
let timeChangeInfo = null;
let lastTimeChangeFetch = 0;
const TIME_CHANGE_REFRESH_MS = 60 * 60 * 1000;
let christmasSlideSettings = { ...DEFAULT_CHRISTMAS_SLIDE };
let christmasInfo = null;
let lastChristmasFetch = 0;
const CHRISTMAS_REFRESH_MS = 60 * 60 * 1000; // 1 hour in milliseconds
let customSlideSettings = { ...DEFAULT_CUSTOM_SLIDE };
let customSlidePayload = null;
let lastCustomSlideFetch = 0;
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
const birthdayVariantConfigs = {};
const birthdayFontRegistry = new Map();

const loadBirthdayCustomFonts = async () => {
  try {
    const data = await fetchJSON("api/birthday-slide/fonts");
    const items = Array.isArray(data?.items) ? data.items : [];
    items.forEach((item, idx) => {
      const safeName = item?.family || item?.filename || `Police ${idx + 1}`;
      const family = `CustomFont_${safeName.replace(/\s+/g, "_")}`;
      const url = item?.url;
      if (!url) return;
      if (birthdayFontRegistry.has(family)) return;
      const style = document.createElement("style");
      style.id = `custom-font-${family}`;
      style.textContent = `
@font-face {
  font-family: "${family}";
  src: url("${url}");
  font-display: swap;
}
`;
      document.head.appendChild(style);
      birthdayFontRegistry.set(family, url);
    });
  } catch (error) {
    console.warn("Impossible de charger les polices Anniversaire:", error);
  }
};

const normalizeBirthdayLines = (config = {}) => {
  const normalizeLine = (entry = {}) => ({
    text: typeof entry.text === "string" ? entry.text : "",
    options: {
      ...BIRTHDAY_TEXT_OPTIONS_DEFAULT,
      ...(entry.options && typeof entry.options === "object" ? entry.options : {}),
    },
  });

  let lines = [];
  if (Array.isArray(config.lines)) {
    lines = config.lines
      .filter((entry) => entry && typeof entry === "object")
      .slice(0, BIRTHDAY_MAX_LINES)
      .map((entry) => normalizeLine(entry));
  }

  if (!lines.length) {
    const legacy = [
      { text: config.text1 ?? "", options: config.text1_options },
      { text: config.text2 ?? "", options: config.text2_options },
      { text: config.text3 ?? "", options: config.text3_options },
    ];
    legacy.forEach((entry) => lines.push(normalizeLine(entry)));
  }

  if (!lines.length) {
    lines = (BIRTHDAY_FIXED_COPY.before.lines || []).map((entry) => normalizeLine(entry));
  }

  return lines.slice(0, BIRTHDAY_MAX_LINES);
};

const normalizeBirthdayVariantConfig = (rawConfig = {}, variant = "before") => {
  const base = { ...(BIRTHDAY_FIXED_COPY[variant] || BIRTHDAY_FIXED_COPY.before) };
  const merged = { ...base, ...(rawConfig || {}) };
  const lines = normalizeBirthdayLines(merged);
  const [l1, l2, l3] = lines.concat(
    { text: "", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT } },
    { text: "", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT } },
    { text: "", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT } },
  );
  return {
    ...merged,
    lines,
    text1: l1?.text ?? "",
    text2: l2?.text ?? "",
    text3: l3?.text ?? "",
    text1_options: l1?.options || { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    text2_options: l2?.options || { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    text3_options: l3?.options || { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
  };
};

const loadBirthdayVariantConfig = async (variant) => {
  if (birthdayVariantConfigs[variant]) return birthdayVariantConfigs[variant];
  try {
    const data = await fetchJSON(`api/birthday-slide/config/${variant}`);
    const cfg = (data && data.config) || {};
    birthdayVariantConfigs[variant] = normalizeBirthdayVariantConfig(cfg, variant);
  } catch (error) {
    console.warn("Impossible de charger le modèle Anniversaire:", error);
    birthdayVariantConfigs[variant] = normalizeBirthdayVariantConfig(
      { ...(BIRTHDAY_FIXED_COPY[variant] || {}) },
      variant,
    );
  }
  return birthdayVariantConfigs[variant];
};
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
    overlayLogo.src = resolveAssetUrl(logoPath);
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

const preloadBirthdayVariants = async () => {
  await Promise.all(BIRTHDAY_VARIANTS.map((variant) => loadBirthdayVariantConfig(variant)));
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
    timeChangeSlideSettings = {
      ...DEFAULT_TIME_CHANGE_SLIDE,
      ...(data && data.time_change_slide ? data.time_change_slide : {}),
    };
    christmasSlideSettings = {
      ...DEFAULT_CHRISTMAS_SLIDE,
      ...(data && data.christmas_slide ? data.christmas_slide : {}),
    };
    customSlideSettings = {
      ...DEFAULT_CUSTOM_SLIDE,
      ...(data && data.custom_slide ? data.custom_slide : {}),
    };
    await preloadBirthdayVariants();
    await fetchTimeChangeInfo(true);
    await fetchChristmasInfo(true);
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

const hexToRgb = (value) => {
  if (typeof value !== "string") {
    return { r: 0, g: 0, b: 0 };
  }
  const hex = value.trim().replace("#", "");
  if (!hex) {
    return { r: 0, g: 0, b: 0 };
  }
  const normalized = hex.length === 3 ? hex.split("").map((ch) => ch + ch).join("") : hex;
  const int = Number.parseInt(normalized, 16);
  if (Number.isNaN(int)) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
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
  card.appendChild(content);

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
  lines.forEach((entry, idx) => {
    const line = document.createElement("div");
    line.className = "birthday-slide-line" + (idx === 0 ? " birthday-slide-line--primary" : "");
    const opts = entry.options || BIRTHDAY_TEXT_OPTIONS_DEFAULT;
    const text = replaceTokens(entry.text ?? "");
    line.textContent = text;
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
    const rawX = Number.isFinite(Number(opts.offset_x_percent)) ? Number(opts.offset_x_percent) : 0;
    const rawY = Number.isFinite(Number(opts.offset_y_percent)) ? Number(opts.offset_y_percent) : 0;
    const left = clampPercent(50 + rawX);
    const top = clampPercent(50 - rawY);
    line.style.left = `${left}%`;
    line.style.top = `${top}%`;
    const rotation = `rotate(${opts.angle || 0}deg)`;
    line.style.transform = `translate(-50%, -50%) ${rotation}`;
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
  const makeLine = (text, options, extraClasses = "") => {
    const line = document.createElement("div");
    line.className = `christmas-line ${extraClasses}`.trim();
    line.textContent = replaceTokens(text || "");
    const opts = options || CHRISTMAS_TEXT_OPTIONS_DEFAULT;
    line.style.color = opts.color || settings.text_color || "#f8fafc";
    if (opts.font_size) line.style.fontSize = `${opts.font_size}px`;
    if (opts.font_family) line.style.fontFamily = opts.font_family;
    line.style.textDecoration = opts.underline ? "underline" : "none";
    if (opts.width_percent) line.style.maxWidth = `${opts.width_percent}%`;
    if (opts.height_percent) line.style.minHeight = `${opts.height_percent}%`;
    const offsetX = Number.isFinite(Number(opts.offset_x_percent)) ? Number(opts.offset_x_percent) : 0;
    const offsetY = Number.isFinite(Number(opts.offset_y_percent)) ? Number(opts.offset_y_percent) : 0;
    const left = Math.min(100, Math.max(0, 50 + offsetX));
    const top = Math.min(100, Math.max(0, 50 - offsetY));
    line.style.left = `${left}%`;
    line.style.top = `${top}%`;
    const rotation = `rotate(${opts.angle || 0}deg)`;
    line.style.transform = `translate(-50%, -50%) ${rotation}`;
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
    Math.round(Number(item.duration) || customSlideSettings.duration || DEFAULT_CUSTOM_SLIDE.duration),
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
  const makeLine = (text, options, extraClasses = "") => {
    const line = document.createElement("div");
    line.className = `time-change-line ${extraClasses}`.trim();
    line.textContent = replaceTokens(text || "");
    const opts = options || TIME_CHANGE_TEXT_OPTIONS_DEFAULT;
    line.style.color = opts.color || settings.text_color || "#f8fafc";
    if (opts.font_size) line.style.fontSize = `${opts.font_size}px`;
    if (opts.font_family) line.style.fontFamily = opts.font_family;
    line.style.textDecoration = opts.underline ? "underline" : "none";
    if (opts.width_percent) line.style.maxWidth = `${opts.width_percent}%`;
    if (opts.height_percent) line.style.minHeight = `${opts.height_percent}%`;
    const offsetX = Number.isFinite(Number(opts.offset_x_percent)) ? Number(opts.offset_x_percent) : 0;
    const offsetY = Number.isFinite(Number(opts.offset_y_percent)) ? Number(opts.offset_y_percent) : 0;
    const left = Math.min(100, Math.max(0, 50 + offsetX));
    const top = Math.min(100, Math.max(0, 50 - offsetY));
    line.style.left = `${left}%`;
    line.style.top = `${top}%`;
    const rotation = `rotate(${opts.angle || 0}deg)`;
    line.style.transform = `translate(-50%, -50%) ${rotation}`;
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

const fetchCustomSlideData = async (force = false) => {
  const now = Date.now();
  if (!force && customSlidePayload && now - lastCustomSlideFetch < CUSTOM_SLIDE_REFRESH_MS) {
    return customSlidePayload;
  }
  try {
    const data = await fetchJSON("api/custom/slide");
    customSlidePayload = data;
    lastCustomSlideFetch = now;
    return data;
  } catch (error) {
    console.warn("Impossible de récupérer la diapo personnalisée:", error);
    return null;
  }
};

<<<<<<< ours
const buildCustomSlideItem = (customData) => {
  const background = customData?.background || null;
  const mimetype = (background && background.mimetype) || "application/x-custom-slide";
  const duration = Math.max(1, Number(customSlideSettings.duration) || DEFAULT_CUSTOM_SLIDE.duration);
  const slideName = (customData?.meta && customData.meta.name) || "Custom 1";
  return {
    id: CUSTOM_SLIDE_ID,
    custom_slide: true,
    original_name: slideName,
    filename: background?.name || CUSTOM_SLIDE_ID,
=======
const buildTestSlideItem = (testData) => {
  const background = testData?.background || null;
  const mimetype = (background && background.mimetype) || "application/x-test-slide";
  const duration = Math.max(1, Number(testSlideSettings.duration) || DEFAULT_TEST_SLIDE.duration);
  return {
    id: TEST_SLIDE_ID,
    test_slide: true,
    original_name: "Diapo personnalisée",
    filename: background?.name || TEST_SLIDE_ID,
>>>>>>> theirs
    duration,
    enabled: true,
    skip_rounds: 0,
    mimetype,
    display_mimetype: mimetype,
    background,
    order: Number(customSlideSettings.order_index) || 0,
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
  const autoEntries = [];

  if (timeChangeSlideSettings.enabled) {
    const change = await fetchTimeChangeInfo();
    const daysLimit = Number.isFinite(Number(timeChangeSlideSettings.days_before))
      ? Number(timeChangeSlideSettings.days_before)
      : DEFAULT_TIME_CHANGE_SLIDE.days_before;
    if (change && (change.days_until == null || change.days_until <= daysLimit)) {
      const timeChangeItem = buildTimeChangeSlideItem(change);
      const idx = Math.min(
        Math.max(0, Number.parseInt(timeChangeSlideSettings.order_index, 10) || 0),
        base.length,
      );
      autoEntries.push({
        id: timeChangeItem.id,
        index: Math.min(idx, base.length + autoEntries.length),
        item: timeChangeItem,
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
      const idx = Math.min(
        Math.max(0, Number.parseInt(christmasSlideSettings.order_index, 10) || 0),
        base.length,
      );
      autoEntries.push({
        id: christmasItem.id,
        index: Math.min(idx, base.length + autoEntries.length),
        item: christmasItem,
      });
    }
  }

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

  if (customSlideSettings.enabled) {
    const customData = await fetchCustomSlideData();
    if (customData && customData.has_background && customData.has_texts) {
      const customItem = buildCustomSlideItem(customData);
      const customBaseIndex = Math.min(
        Math.max(0, Number.parseInt(customSlideSettings.order_index, 10) || 0),
        base.length
      );
      autoEntries.push({
        id: customItem.id,
        index: Math.min(customBaseIndex, base.length + autoEntries.length),
        item: customItem,
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
  await loadBirthdayCustomFonts();
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
