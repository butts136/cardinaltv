// Cardinal TV front-end (éditeur & accueil)
// Version remaniée pour:
// - Rétablir la playlist et le diaporama
// - Gérer les employés (CRUD basique)
// - Gérer la diapositive "Notre Équipe" (fond + titre)

// Sélecteurs communs (accueil + éditeur)
const uploadForm = document.querySelector("#upload-form");
const fileInput = document.querySelector("#file-input");
const dropZone = document.querySelector("#drop-zone");
const uploadFeedback = document.querySelector("#upload-feedback");
const mediaList = document.querySelector("#media-list");
const refreshButton = document.querySelector("#refresh-button");
const hideAllButton = document.querySelector("#hide-all-button");
const showAllButton = document.querySelector("#show-all-button");
const slideshowButton = document.querySelector("#slideshow-button");
const mediaModal = document.querySelector("#media-modal");
const mediaModalInner = mediaModal ? mediaModal.querySelector(".media-modal-inner") : null;
const quebecTimeDisplay = document.querySelector("#quebec-time");

// Overlay (bande supérieure dans le diaporama)
const settingsButton = document.querySelector("#settings-button");
const settingsModal = document.querySelector("#settings-modal");
const settingsForm = document.querySelector("#overlay-form");
const modalCloseButtons = settingsModal ? settingsModal.querySelectorAll("[data-modal-close]") : [];
const overlayEnabledInput = document.querySelector("#overlay-enabled");
const overlayModeSelect = document.querySelector("#overlay-mode");
const overlayHeightInput = document.querySelector("#overlay-height");
const overlayHeightValue = document.querySelector("#overlay-height-value");
const overlayBgInput = document.querySelector("#overlay-bg");
const overlayTextInput = document.querySelector("#overlay-text");
const overlayLogoInput = document.querySelector("#overlay-logo");
const overlayTickerTextInput = document.querySelector("#overlay-ticker-text");
const tickerSection = document.querySelector(".ticker-only");

// Section employés (éditeur)
const employeesSection = document.querySelector("#employees-section");
const employeesList = document.querySelector("#employees-list");
const employeesAddButton = document.querySelector("#employees-add-button");

// Modal employé
const employeeModal = document.querySelector("#employee-modal");
const employeeForm = document.querySelector("#employee-form");
const employeeIdInput = document.querySelector("#employee-id");
const employeeNameInput = document.querySelector("#employee-name");
const employeeBirthdayDay = document.querySelector("#employee-birthday-day");
const employeeBirthdayMonth = document.querySelector("#employee-birthday-month");
const employeeBirthdayYear = document.querySelector("#employee-birthday-year");
const employeeRoleInput = document.querySelector("#employee-role");
const employeeHireYear = document.querySelector("#employee-hire-year");
const employeeHireMonth = document.querySelector("#employee-hire-month");
const employeeHireDay = document.querySelector("#employee-hire-day");
const employeeDescriptionInput = document.querySelector("#employee-description");
const employeeAvatarInput = document.querySelector("#employee-avatar");
const employeeAvatarPreview = document.querySelector("#employee-avatar-preview");
const employeeAvatarRemoveButton = document.querySelector("#employee-avatar-remove");
const employeeCancelButton = document.querySelector("#employee-cancel");
const employeeModalTitle = document.querySelector("#employee-modal-title");

// Section "Anniversaire" (éditeur)
const birthdayEnabledInput = document.querySelector("#birthday-enabled");
const birthdayBackgroundInput = document.querySelector("#birthday-background-input");
const birthdayBackgroundUploadButton = document.querySelector("#birthday-background-upload-button");
const birthdayBackgroundStatus = document.querySelector("#birthday-background-status");
const birthdayBackgroundList = document.querySelector("#birthday-background-list");
const birthdayPreviewStage = document.querySelector("#birthday-preview-stage");
const birthdayPreviewRefreshButton = document.querySelector("#birthday-preview-refresh");
const birthdayBackgroundToggleButton = document.querySelector("#birthday-background-toggle");
const birthdayBackgroundBody = document.querySelector(".birthday-background-body");
const birthdayDropZone = document.querySelector("#birthday-drop-zone");
const birthdayUploadProgress = document.querySelector("#birthday-upload-progress");
const birthdayUploadProgressBar = document.querySelector("#birthday-upload-progress-bar");
const birthdayUploadProgressText = document.querySelector("#birthday-upload-progress-text");
const birthdayVariantPills = document.querySelectorAll(".birthday-variant-pill");
const birthdayOpeningBlock = document.querySelector(".birthday-opening");
const birthdayOpeningBody = document.querySelector(".birthday-opening-body");
const birthdayOpeningToggle = document.querySelector("#birthday-opening-toggle");
const birthdayText1Input = document.querySelector("#birthday-variant-text1");
const birthdayText2Input = document.querySelector("#birthday-variant-text2");
const birthdayText3Input = document.querySelector("#birthday-variant-text3");
const birthdayTextOptionToggles = document.querySelectorAll(".text-options-toggle");
const birthdayTextOptionsPanels = document.querySelectorAll(".birthday-text-options");
const birthdayTitleTextInput = document.querySelector("#birthday-title-text");
const birthdayTitleSizeInput = document.querySelector("#birthday-title-size");
const birthdayTitleColorInput = document.querySelector("#birthday-title-color");
const birthdayTitleYInput = document.querySelector("#birthday-title-y");
const birthdayVariantSaveButton = document.querySelector("#birthday-variant-save");
const birthdayOpenDayButtons = document.querySelectorAll("[data-open-day]");

// Section "Notre Équipe" (éditeur)
const teamEnabledInput = document.querySelector("#team-enabled");
const teamBackgroundInput = document.querySelector("#team-background-input");
const teamBackgroundUploadButton = document.querySelector("#team-background-upload-button");
const teamBackgroundStatus = document.querySelector("#team-background-status");
// Liste des arrière-plans disponibles (ajoutée dans le template)
const teamBackgroundList = document.querySelector("#team-background-list");
const teamCardDurationInput = document.querySelector("#team-card-duration");
const teamTitleEnabledInput = document.querySelector("#team-title-enabled");
const teamTitleOptions = document.querySelector("#team-title-options");
const teamTitleOptionsToggle = document.querySelector("#team-title-options-toggle");
const teamTitleTextInput = document.querySelector("#team-title-text");
const teamTitlePositionSelect = document.querySelector("#team-title-position");
const teamTitleFontSizeInput = document.querySelector("#team-title-font-size");
const teamTitleColorInput = document.querySelector("#team-title-color");
const teamTitleBackgroundColorInput = document.querySelector("#team-title-background-color");
const teamTitleUnderlineInput = document.querySelector("#team-title-underline");
const teamTitleAngleInput = document.querySelector("#team-title-angle");
const teamTitleWidthInput = document.querySelector("#team-title-width");
const teamTitleHeightInput = document.querySelector("#team-title-height");
const teamTitleOffsetXInput = document.querySelector("#team-title-offset-x");
const teamTitleOffsetYInput = document.querySelector("#team-title-offset-y");
const teamPreviewStage = document.querySelector("#team-preview-stage");
const teamPreviewRefreshButton = document.querySelector("#team-preview-refresh");
const teamSaveButton = document.querySelector("#team-save-button");
const teamSaveStatus = document.querySelector("#team-save-status");

// PowerPoint (accueil) – basique
const pptUploadButton = document.querySelector("#ppt-upload-button");
const pptModal = document.querySelector("#ppt-modal");
const pptUploadForm = document.querySelector("#ppt-upload-form");
const pptFileInput = document.querySelector("#ppt-file-input");
const pptUploadFeedback = document.querySelector("#ppt-upload-feedback");
const pptList = document.querySelector("#ppt-list");

let mediaItems = [];
let selectedFiles = [];
let quebecTimeTimer = null;
let overlaySettings = null;
let birthdaySlideSettings = null;
let teamSlideSettings = null;
let employees = [];
let teamPreviewTimer = null;
let teamPreviewFrame = null;
let teamPreviewStartTimer = null;
let teamPreviewCanvas = null;
let teamPreviewResizeObserver = null;
let teamPreviewResizeListenerAttached = false;
let birthdayPreviewCanvas = null;
let birthdayPreviewResizeObserver = null;
let birthdayPreviewRenderedSource = null;
let birthdayCurrentVariant = "before";
const birthdayVariantConfigs = {};
let birthdayBackgroundOptions = [];
let birthdayBackgroundCurrent = {};
const birthdayTextOptionsInputs = {
  1: {
    size: document.querySelector("#text1-size"),
    color: document.querySelector("#text1-color"),
    font: document.querySelector("#text1-font"),
    underline: document.querySelector("#text1-underline"),
    width: document.querySelector("#text1-width"),
    height: document.querySelector("#text1-height"),
    offsetX: document.querySelector("#text1-offset-x"),
    offsetY: document.querySelector("#text1-offset-y"),
    curve: document.querySelector("#text1-curve"),
    angle: document.querySelector("#text1-angle"),
  },
  2: {
    size: document.querySelector("#text2-size"),
    color: document.querySelector("#text2-color"),
    font: document.querySelector("#text2-font"),
    underline: document.querySelector("#text2-underline"),
    width: document.querySelector("#text2-width"),
    height: document.querySelector("#text2-height"),
    offsetX: document.querySelector("#text2-offset-x"),
    offsetY: document.querySelector("#text2-offset-y"),
    curve: document.querySelector("#text2-curve"),
    angle: document.querySelector("#text2-angle"),
  },
  3: {
    size: document.querySelector("#text3-size"),
    color: document.querySelector("#text3-color"),
    font: document.querySelector("#text3-font"),
    underline: document.querySelector("#text3-underline"),
    width: document.querySelector("#text3-width"),
    height: document.querySelector("#text3-height"),
    offsetX: document.querySelector("#text3-offset-x"),
    offsetY: document.querySelector("#text3-offset-y"),
    curve: document.querySelector("#text3-curve"),
    angle: document.querySelector("#text3-angle"),
  },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const DEFAULT_OVERLAY_SETTINGS = {
  enabled: true,
  mode: "clock",
  height_vh: 5,
  background_color: "#f0f0f0",
  text_color: "#111111",
  logo_path: "static/img/logo-groupe-cardinal.png",
  ticker_text: "Bienvenue sur Cardinal TV",
};

const DEFAULT_TEAM_SLIDE_SETTINGS = {
  enabled: false,
  order_index: 0,
  duration: 10,
  card_min_duration: 6,
  background_path: null,
  background_url: null,
  background_mimetype: null,
  title_enabled: false,
  title_text: "",
  title_position: "center",
  title_font_size: 48,
  title_color: "#111111",
  title_background_color: null,
  title_underline: false,
  title_angle: 0,
  title_width_percent: 80,
  title_height_percent: 20,
  title_offset_x_percent: 0,
  title_offset_y_percent: 0,
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

const DEFAULT_BIRTHDAY_SLIDE_SETTINGS = {
  enabled: false,
  order_index: 0,
  duration: 12,
  background_path: null,
  background_mimetype: null,
  background_media_id: null,
  background_url: null,
  background_source: null,
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

const BIRTHDAY_CONFIG_DEFAULT = {
  title: "Anniversaire à venir",
  subtitle: "Dans [days] jours, ce sera la fête",
  body: "Saurez vous deviner qui est-ce ?",
  text1: "(Texte 1)",
  text2: "(Texte 2)",
  text3: "(Texte 3)",
  text1_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
  text2_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
  text3_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
  background_path: null,
  background_mimetype: null,
  background_url: null,
};

const BIRTHDAY_FIXED_COPY = {
  before: {
    text1: "(Texte 1)",
    text2: "(Texte 2)",
    text3: "(Texte 3)",
    text1_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    text2_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    text3_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    background_path: null,
  },
  day: {
    text1: "(Texte 1)",
    text2: "(Texte 2)",
    text3: "(Texte 3)",
    text1_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    text2_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    text3_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    background_path: null,
  },
  weekend: {
    text1: "(Texte 1)",
    text2: "(Texte 2)",
    text3: "(Texte 3)",
    text1_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    text2_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    text3_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    background_path: null,
  },
};

const TEAM_SLIDE_SCALE = 1.25;
const TEAM_TITLE_HOLD_MS = 3000;

const TEAM_CARDS_PER_PAGE = 4;
const TEAM_SLIDE_CARD_ID = "__team_slide__";
const BIRTHDAY_SLIDE_CARD_ID = "__birthday_slide__";
const TEAM_PREVIEW_BASE_WIDTH = 1920;
const TEAM_PREVIEW_BASE_HEIGHT = 1080;
const BIRTHDAY_PREVIEW_BASE_WIDTH = 1920;
const BIRTHDAY_PREVIEW_BASE_HEIGHT = 1080;

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

const quebecDateFormatter = new Intl.DateTimeFormat("fr-CA", {
  timeZone: "America/Toronto",
  dateStyle: "medium",
});

const quebecTimeFormatter = new Intl.DateTimeFormat("fr-CA", {
  timeZone: "America/Toronto",
  timeStyle: "medium",
});

const updateQuebecTime = () => {
  if (!quebecTimeDisplay) {
    return;
  }
  const now = new Date();
  const formattedDate = quebecDateFormatter.format(now);
  const formattedTime = quebecTimeFormatter.format(now);
  quebecTimeDisplay.textContent = `Heure du Québec : ${formattedDate} • ${formattedTime}`;
};

const fetchJSON = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Requête échouée");
  }
  return response.json();
};

const formatFileSize = (size) => {
  if (!Number.isFinite(size)) {
    return "";
  }
  if (size >= 1_000_000) {
    return `${(size / 1_000_000).toFixed(1)} Mo`;
  }
  if (size >= 1_000) {
    return `${(size / 1_000).toFixed(1)} Ko`;
  }
  return `${size} o`;
};

const formatDateForInput = (value) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (num) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDatetimeForServer = (value) => (value ? value : null);

const highlightDropZone = (active) => {
  if (!dropZone) return;
  if (active) {
    dropZone.classList.add("drag-over");
  } else {
    dropZone.classList.remove("drag-over");
  }
};

const setUploadFeedback = (message, status = "info") => {
  if (!uploadFeedback) return;
  uploadFeedback.textContent = message;
  uploadFeedback.dataset.status = status;
};

const renderEmptyState = () => {
  if (!mediaList) return;
  mediaList.innerHTML = "";
  const placeholder = document.createElement("div");
  placeholder.className = "empty-state";
  placeholder.textContent =
    "Aucun média pour le moment. Téléversez des fichiers pour construire la playlist.";
  mediaList.appendChild(placeholder);
};

const applyModeVisibility = (mode) => {
  if (!tickerSection) {
    return;
  }
  if (mode === "ticker") {
    tickerSection.classList.remove("hidden");
  } else {
    tickerSection.classList.add("hidden");
  }
};

const normalizeTeamSlideSettings = (raw) => {
  const base = { ...DEFAULT_TEAM_SLIDE_SETTINGS };
  if (!raw || typeof raw !== "object") {
    return base;
  }
  const result = { ...base };
  if ("enabled" in raw) {
    result.enabled = Boolean(raw.enabled);
  }
  if ("order_index" in raw) {
    const idx = Number.parseInt(raw.order_index, 10);
    if (Number.isFinite(idx) && idx >= 0) {
      result.order_index = idx;
    }
  }
  if ("duration" in raw) {
    const d = Number(raw.duration);
    if (Number.isFinite(d) && d >= 1 && d <= 600) {
      result.duration = d;
    }
  }
  if ("card_min_duration" in raw) {
    const cd = Number(raw.card_min_duration);
    if (Number.isFinite(cd) && cd >= 0.5 && cd <= 600) {
      result.card_min_duration = cd;
    }
  }
  if (typeof raw.background_path === "string") {
    result.background_path = raw.background_path || null;
  }
  if (typeof raw.background_url === "string") {
    result.background_url = raw.background_url || null;
  }
  if (typeof raw.background_mimetype === "string") {
    result.background_mimetype = raw.background_mimetype || null;
  }
  if ("title_enabled" in raw) {
    result.title_enabled = Boolean(raw.title_enabled);
  }
  if (typeof raw.title_text === "string") {
    result.title_text = raw.title_text;
  }
  if (typeof raw.title_position === "string" && raw.title_position) {
    result.title_position = raw.title_position;
  }
  if ("title_font_size" in raw) {
    const val = Number(raw.title_font_size);
    if (Number.isFinite(val) && val >= 8 && val <= 200) {
      result.title_font_size = val;
    }
  }
  if (typeof raw.title_color === "string" && raw.title_color) {
    result.title_color = raw.title_color;
  }
  if (raw.title_background_color === null || typeof raw.title_background_color === "string") {
    result.title_background_color = raw.title_background_color;
  }
  if ("title_underline" in raw) {
    result.title_underline = Boolean(raw.title_underline);
  }
  if ("title_angle" in raw) {
    const val = Number(raw.title_angle);
    if (Number.isFinite(val) && val >= -360 && val <= 360) {
      result.title_angle = val;
    }
  }
  if ("title_width_percent" in raw) {
    const val = Number(raw.title_width_percent);
    if (Number.isFinite(val) && val >= 10 && val <= 100) {
      result.title_width_percent = val;
    }
  }
  if ("title_height_percent" in raw) {
    const val = Number(raw.title_height_percent);
    if (Number.isFinite(val) && val >= 5 && val <= 100) {
      result.title_height_percent = val;
    }
  }
  if ("title_offset_x_percent" in raw) {
    const val = Number(raw.title_offset_x_percent);
    if (Number.isFinite(val) && val >= -50 && val <= 50) {
      result.title_offset_x_percent = val;
    }
  }
  if ("title_offset_y_percent" in raw) {
    const val = Number(raw.title_offset_y_percent);
    if (Number.isFinite(val) && val >= -50 && val <= 50) {
      result.title_offset_y_percent = val;
    }
  }
  return result;
};

const normalizeOpenDays = (raw = {}) => {
  const base = { ...DEFAULT_OPEN_DAYS };
  if (!raw || typeof raw !== "object") {
    return base;
  }
  return Object.keys(base).reduce((acc, day) => {
    acc[day] = raw[day] === undefined ? base[day] : Boolean(raw[day]);
    return acc;
  }, {});
};

const normalizeBirthdaySlideSettings = (raw) => {
  const base = { ...DEFAULT_BIRTHDAY_SLIDE_SETTINGS };
  if (!raw || typeof raw !== "object") {
    return base;
  }
  const result = { ...base };
  if ("enabled" in raw) {
    result.enabled = Boolean(raw.enabled);
  }
  if ("order_index" in raw) {
    const idx = Number.parseInt(raw.order_index, 10);
    if (Number.isFinite(idx) && idx >= 0) {
      result.order_index = idx;
    }
  }
  if ("duration" in raw) {
    const d = Number(raw.duration);
    if (Number.isFinite(d) && d >= 1 && d <= 600) {
      result.duration = d;
    }
  }
  if (typeof raw.background_path === "string") {
    result.background_path = raw.background_path || null;
  }
  if (typeof raw.background_media_id === "string") {
    result.background_media_id = raw.background_media_id || null;
  }
  if (typeof raw.background_mimetype === "string") {
    result.background_mimetype = raw.background_mimetype || null;
  }
  if (typeof raw.background_url === "string") {
    result.background_url = raw.background_url;
  }
  if (typeof raw.background_source === "string") {
    result.background_source = raw.background_source;
  }
  if (typeof raw.background_label === "string") {
    result.background_label = raw.background_label;
  }
  if (typeof raw.title_text === "string") {
    result.title_text = raw.title_text;
  }
  if ("title_font_size" in raw) {
    const size = Number(raw.title_font_size);
    if (Number.isFinite(size) && size >= 8 && size <= 200) {
      result.title_font_size = size;
    }
  }
  if (typeof raw.title_color === "string" && raw.title_color) {
    result.title_color = raw.title_color;
  }
  if ("title_y_percent" in raw) {
    const val = Number(raw.title_y_percent);
    if (Number.isFinite(val) && val >= 0 && val <= 100) {
      result.title_y_percent = val;
    }
  }
  result.open_days = normalizeOpenDays(raw.open_days);
  return result;
};

// ---------------------------------------------------------------------------
// Overlay (bande) – chargement / sauvegarde
// ---------------------------------------------------------------------------

const populateSettingsForm = (settings) => {
  if (!settingsForm) {
    return;
  }
  const overlay = { ...DEFAULT_OVERLAY_SETTINGS, ...settings };
  overlayEnabledInput.checked = Boolean(overlay.enabled);
  overlayModeSelect.value = overlay.mode || "clock";
  overlayHeightInput.value = overlay.height_vh ?? DEFAULT_OVERLAY_SETTINGS.height_vh;
  overlayHeightValue.textContent = overlayHeightInput.value;
  overlayBgInput.value = overlay.background_color || DEFAULT_OVERLAY_SETTINGS.background_color;
  overlayTextInput.value = overlay.text_color || DEFAULT_OVERLAY_SETTINGS.text_color;
  overlayLogoInput.value = overlay.logo_path || DEFAULT_OVERLAY_SETTINGS.logo_path;
  overlayTickerTextInput.value = overlay.ticker_text || "";
  applyModeVisibility(overlayModeSelect.value);
};

const serializeSettingsForm = () => ({
  enabled: overlayEnabledInput.checked,
  mode: overlayModeSelect.value,
  height_vh:
    parseFloat(overlayHeightInput.value) || DEFAULT_OVERLAY_SETTINGS.height_vh,
  background_color: overlayBgInput.value || DEFAULT_OVERLAY_SETTINGS.background_color,
  text_color: overlayTextInput.value || DEFAULT_OVERLAY_SETTINGS.text_color,
  logo_path: overlayLogoInput.value.trim(),
  ticker_text: overlayTickerTextInput.value.trim(),
});

const openSettingsModal = () => {
  if (!settingsModal) {
    return;
  }
  settingsModal.classList.remove("hidden");
  settingsModal.classList.add("open");
  settingsModal.setAttribute("aria-hidden", "false");
  try {
    const firstFocusable = settingsModal.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (firstFocusable) {
      firstFocusable.focus();
    }
  } catch (e) {
    // ignore
  }
};

const closeSettingsModal = () => {
  if (!settingsModal) {
    return;
  }
  settingsModal.classList.remove("open");
  settingsModal.classList.add("hidden");
  settingsModal.setAttribute("aria-hidden", "true");
  try {
    settingsButton?.focus();
  } catch (e) {
    // ignore
  }
};

const loadOverlayAndSlideSettings = async () => {
  let data = null;
  try {
    data = await fetchJSON("api/settings");
  } catch (error) {
    console.warn("Impossible de récupérer les paramètres:", error);
  }

  // Overlay
  if (data && data.overlay) {
    overlaySettings = data.overlay;
  } else {
    overlaySettings = { ...DEFAULT_OVERLAY_SETTINGS };
  }
  populateSettingsForm(overlaySettings);

  // Birthday slide
  const rawBirthday = data && data.birthday_slide ? data.birthday_slide : {};
  birthdaySlideSettings = normalizeBirthdaySlideSettings(rawBirthday);
  populateBirthdayForm(birthdaySlideSettings);
  renderBirthdayPreview();
  void loadBirthdayVariantConfig(birthdayCurrentVariant);

  // Team slide
  const rawTeam = data && data.team_slide ? data.team_slide : {};
  teamSlideSettings = normalizeTeamSlideSettings(rawTeam);
  populateTeamForm(teamSlideSettings);
  renderTeamPreview();
  void loadTeamBackgroundList();
  void loadBirthdayBackgroundList();
};

// ---------------------------------------------------------------------------
// Gestion des médias (playlist)
// ---------------------------------------------------------------------------

const detectMediaKind = (item) => {
  if (Array.isArray(item.page_urls) && item.page_urls.length) {
    return "document";
  }
  const type = (item.display_mimetype || item.mimetype || "").toLowerCase();
  if (type.startsWith("video/")) {
    return "video";
  }
  if (type.startsWith("image/")) {
    return "image";
  }
  const extension =
    (item.original_name || item.filename || "").split(".").pop()?.toLowerCase() || "";
  if (
    ["mp4", "m4v", "mov", "webm", "mkv", "avi", "mpg", "mpeg"].includes(extension)
  ) {
    return "video";
  }
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension)) {
    return "image";
  }
  if (["pdf", "doc", "docx", "txt", "rtf", "md"].includes(extension)) {
    return "document";
  }
  return "other";
};

const sendOrderUpdate = async () => {
  const order = mediaItems.map((item) => item.id);
  await fetchJSON("api/media/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order }),
  });
};

const saveItem = async (id, payload) => {
  const updated = await fetchJSON(`api/media/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const index = mediaItems.findIndex((item) => item.id === id);
  if (index >= 0) {
    mediaItems[index] = updated;
  }
  renderMedia();
};

const deleteItem = async (id) => {
  await fetchJSON(`api/media/${id}`, { method: "DELETE" });
  mediaItems = mediaItems.filter((item) => item.id !== id);
  renderMedia();
};

const createToggle = (labelText, input) => {
  const wrapper = document.createElement("label");
  wrapper.className = "toggle";
  const text = document.createElement("span");
  text.textContent = labelText;
  wrapper.append(input, text);
  return wrapper;
};

const createVisibilitySwitch = (input) => {
  input.classList.add("visibility-toggle-checkbox");
  const wrapper = document.createElement("label");
  wrapper.className = "visibility-toggle";

  const onLabel = document.createElement("span");
  onLabel.className = "visibility-toggle-label visibility-toggle-label-on";
  onLabel.textContent = "Affiché";

  const offLabel = document.createElement("span");
  offLabel.className = "visibility-toggle-label visibility-toggle-label-off";
  offLabel.textContent = "Caché";

  const sliderWrap = document.createElement("div");
  sliderWrap.className = "visibility-toggle-switch";
  const slider = document.createElement("span");
  slider.className = "visibility-toggle-slider";
  sliderWrap.append(input, slider);

  const updateState = () => {
    wrapper.dataset.state = input.checked ? "visible" : "hidden";
  };
  input.addEventListener("change", updateState);
  updateState();

  wrapper.append(onLabel, sliderWrap, offLabel);
  return wrapper;
};

const openMediaModal = (item) => {
  if (!mediaModal || !mediaModalInner) return;
  const kind = detectMediaKind(item);
  const displayUrl = item.display_url || item.url || item.thumbnail_url;
  mediaModalInner.innerHTML = "";

  let node = null;
  if (kind === "image") {
    node = document.createElement("img");
    node.className = "media-modal-image";
    node.src = item.display_url || item.thumbnail_url || item.url;
    node.alt = item.original_name || item.filename;
  } else if (kind === "video") {
    node = document.createElement("video");
    node.className = "media-modal-video";
    node.src = displayUrl;
    node.controls = true;
    node.autoplay = true;
    node.loop = false;
    node.muted = Boolean(item.muted);
    node.playsInline = true;
    node.setAttribute("playsinline", "");
  } else if (kind === "document") {
    node = document.createElement("iframe");
    node.className = "media-modal-iframe";
    node.src = displayUrl;
    node.loading = "lazy";
    node.title = item.original_name || item.filename;
  } else {
    node = document.createElement("div");
    node.textContent = "Aperçu non disponible pour ce média.";
    node.style.padding = "1rem";
  }

  mediaModalInner.appendChild(node);
  mediaModal.classList.remove("hidden");
  mediaModal.setAttribute("aria-hidden", "false");
};

const closeMediaModal = () => {
  if (!mediaModal || !mediaModalInner) return;
  mediaModal.classList.add("hidden");
  mediaModal.setAttribute("aria-hidden", "true");
  mediaModalInner.innerHTML = "";
};

const createThumbnail = (item) => {
  const kind = detectMediaKind(item);
  const wrapper = document.createElement("button");
  wrapper.type = "button";
  wrapper.className = "thumb-wrapper compact-thumb";
  wrapper.title = "Agrandir";

  let mediaNode = null;
  if (kind === "video") {
    const video = document.createElement("video");
    video.className = "media-thumb";
    video.src = item.thumbnail_url || item.display_url || item.url;
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.preload = "metadata";
    mediaNode = video;

    const play = document.createElement("span");
    play.className = "thumb-play";
    wrapper.append(video, play);
  } else {
    const img = document.createElement("img");
    img.className = "media-thumb";
    img.src = item.thumbnail_url || item.display_url || item.url;
    img.alt = item.original_name || item.filename || "Média";
    mediaNode = img;
    wrapper.appendChild(img);
  }

  wrapper.addEventListener("click", () => openMediaModal(item));
  return { wrapper, mediaNode };
};

const renameMedia = async (item) => {
  const currentName = item.original_name || item.filename;
  const next = window.prompt("Nouveau nom du média :", currentName);
  if (next == null) return;
  const trimmed = next.trim();
  if (!trimmed) {
    alert("Le nom ne peut pas être vide.");
    return;
  }
  try {
    const updated = await fetchJSON(`api/media/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ original_name: trimmed }),
    });
    const index = mediaItems.findIndex((m) => m.id === item.id);
    if (index >= 0) {
      mediaItems[index] = updated;
    }
    renderMedia();
  } catch (error) {
    console.error("Impossible de renommer le média:", error);
    alert("Erreur lors du renommage.");
  }
};

const createInputGroup = (labelText, input) => {
  const group = document.createElement("label");
  group.className = "field-group";
  const span = document.createElement("span");
  span.textContent = labelText;
  group.append(span, input);
  return group;
};

const createMediaCard = (item, displayIndex, totalCount) => {
  const card = document.createElement("article");
  card.className = "media-card";
  card.dataset.id = item.id;

  const header = document.createElement("div");
  header.className = "media-card-header";

  const orderBadge = document.createElement("span");
  orderBadge.className = "order-badge";
  orderBadge.textContent = String(displayIndex + 1);

  const orderButtons = document.createElement("div");
  orderButtons.className = "order-buttons";

  const upButton = document.createElement("button");
  upButton.type = "button";
  upButton.className = "secondary-button icon-button";
  upButton.textContent = "▲";
  upButton.disabled = displayIndex === 0;
  upButton.addEventListener("click", () => moveCombinedEntry(item.id, -1));

  const downButton = document.createElement("button");
  downButton.type = "button";
  downButton.className = "secondary-button icon-button";
  downButton.textContent = "▼";
  downButton.disabled = displayIndex === totalCount - 1;
  downButton.addEventListener("click", () => moveCombinedEntry(item.id, 1));

  orderButtons.append(upButton, downButton);
  header.append(orderBadge, orderButtons);

  const body = document.createElement("div");
  body.className = "media-card-body";

  const titleRow = document.createElement("div");
  titleRow.className = "title-thumb-row";

  const { wrapper: thumbWrapper } = createThumbnail(item);
  titleRow.appendChild(thumbWrapper);

  const titleContainer = document.createElement("div");
  titleContainer.className = "title-container";

  const title = document.createElement("h3");
  title.textContent = item.original_name || item.filename;

  const meta = document.createElement("p");
  meta.className = "media-meta";
  const infoParts = [];
  if (item.mimetype) {
    infoParts.push(item.mimetype);
  }
  if (Number.isFinite(item.size)) {
    infoParts.push(formatFileSize(item.size));
  }
  const pagesCount = Array.isArray(item.page_urls) ? item.page_urls.length : 0;
  if (pagesCount) {
    infoParts.push(`${pagesCount} page${pagesCount > 1 ? "s" : ""}`);
  }
  meta.textContent = infoParts.join(" • ");

  const renameButton = document.createElement("button");
  renameButton.type = "button";
  renameButton.className = "secondary-button";
  renameButton.textContent = "Renommer";
  renameButton.addEventListener("click", () => renameMedia(item));

  titleContainer.append(title, meta, renameButton);
  titleRow.appendChild(titleContainer);

  body.append(titleRow);

  const controls = document.createElement("div");
  controls.className = "media-card-controls";

  const enabledInput = document.createElement("input");
  enabledInput.type = "checkbox";
  enabledInput.checked = Boolean(item.enabled);
  enabledInput.dataset.field = "enabled";
  controls.appendChild(createVisibilitySwitch(enabledInput));

  const kind = detectMediaKind(item);
  let muteInput = null;
  if (kind === "video") {
    muteInput = document.createElement("input");
    muteInput.type = "checkbox";
    muteInput.checked = Boolean(item.muted);
    muteInput.dataset.field = "muted";
    controls.appendChild(createToggle("Muet", muteInput));
  }

  const grid = document.createElement("div");
  grid.className = "media-card-grid";

  const startInput = document.createElement("input");
  startInput.type = "datetime-local";
  startInput.value = formatDateForInput(item.start_at);
  startInput.dataset.field = "start_at";
  grid.appendChild(createInputGroup("Début", startInput));

  const endInput = document.createElement("input");
  endInput.type = "datetime-local";
  endInput.value = formatDateForInput(item.end_at);
  endInput.dataset.field = "end_at";
  grid.appendChild(createInputGroup("Fin", endInput));

  let durationInput = null;
  if (kind !== "video") {
    durationInput = document.createElement("input");
    durationInput.type = "number";
    durationInput.min = "1";
    durationInput.step = "1";
    durationInput.value = Math.round(Number(item.duration) || 10);
    durationInput.dataset.field = "duration";
    grid.appendChild(createInputGroup("Durée (s)", durationInput));
  }

  const skipInput = document.createElement("input");
  skipInput.type = "number";
  skipInput.min = "0";
  skipInput.step = "1";
  skipInput.value = Math.max(0, Number(item.skip_rounds) || 0);
  skipInput.dataset.field = "skip_rounds";
  grid.appendChild(createInputGroup("Sauts", skipInput));

  const actions = document.createElement("div");
  actions.className = "media-card-actions";

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "primary-button";
  saveButton.textContent = "Enregistrer";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "secondary-button";
  deleteButton.textContent = "Supprimer";

  saveButton.addEventListener("click", async () => {
    const payload = {
      enabled: enabledInput.checked,
      start_at: formatDatetimeForServer(startInput.value),
      end_at: formatDatetimeForServer(endInput.value),
      skip_rounds: Math.max(0, Number(skipInput.value) || 0),
    };
    if (durationInput) {
      payload.duration = Number(durationInput.value) || 0;
    }
    if (muteInput) {
      payload.muted = muteInput.checked;
    }
    saveButton.disabled = true;
    saveButton.textContent = "Enregistrement...";
    try {
      await saveItem(item.id, payload);
      saveButton.textContent = "Enregistré";
    } catch (error) {
      console.error(error);
      saveButton.textContent = "Erreur";
    } finally {
      setTimeout(() => {
        saveButton.disabled = false;
        saveButton.textContent = "Enregistrer";
      }, 1400);
    }
  });

  deleteButton.addEventListener("click", async () => {
    if (!window.confirm("Supprimer ce média ?")) {
      return;
    }
    deleteButton.disabled = true;
    deleteButton.textContent = "Suppression...";
    try {
      await deleteItem(item.id);
    } catch (error) {
      console.error(error);
      deleteButton.textContent = "Erreur";
      setTimeout(() => {
        deleteButton.disabled = false;
        deleteButton.textContent = "Supprimer";
      }, 1400);
    }
  });

  actions.append(saveButton, deleteButton);

  card.append(header, body, controls, grid, actions);
  return card;
};

const createOrderHeader = (displayIndex, totalCount, id) => {
  const header = document.createElement("div");
  header.className = "media-card-header";

  const badge = document.createElement("span");
  badge.className = "order-badge";
  badge.textContent = String(displayIndex + 1);

  const orderButtons = document.createElement("div");
  orderButtons.className = "order-buttons";

  const upButton = document.createElement("button");
  upButton.type = "button";
  upButton.className = "secondary-button icon-button";
  upButton.textContent = "▲";
  upButton.disabled = displayIndex === 0;
  upButton.addEventListener("click", () => moveCombinedEntry(id, -1));

  const downButton = document.createElement("button");
  downButton.type = "button";
  downButton.className = "secondary-button icon-button";
  downButton.textContent = "▼";
  downButton.disabled = displayIndex === totalCount - 1;
  downButton.addEventListener("click", () => moveCombinedEntry(id, 1));

  orderButtons.append(upButton, downButton);
  header.append(badge, orderButtons);
  return header;
};

const createTeamSlideCard = (displayIndex, totalCount) => {
  const card = document.createElement("article");
  card.className = "media-card team-slide-card-special";
  card.dataset.id = TEAM_SLIDE_CARD_ID;

  const header = createOrderHeader(displayIndex, totalCount, TEAM_SLIDE_CARD_ID);

  const body = document.createElement("div");
  body.className = "media-card-body";
  const title = document.createElement("h3");
  title.textContent = "Diapositive « Notre Équipe »";
  body.append(title);

  card.append(header, body);
  return card;
};

const createBirthdaySlideCard = (displayIndex, totalCount) => {
  const card = document.createElement("article");
  card.className = "media-card birthday-slide-card";
  card.dataset.id = BIRTHDAY_SLIDE_CARD_ID;

  const header = createOrderHeader(displayIndex, totalCount, BIRTHDAY_SLIDE_CARD_ID);

  const body = document.createElement("div");
  body.className = "media-card-body";
  const title = document.createElement("h3");
  title.textContent = "Diapositive « Anniversaire »";
  const status = document.createElement("p");
  status.className = "field-hint";
  status.textContent = birthdaySlideSettings && birthdaySlideSettings.enabled ? "Activée" : "Désactivée";
  body.append(title, status);

  card.append(header, body);
  return card;
};

const getTeamSlideInsertIndex = (mediaCount) => {
  if (!teamSlideSettings) return null;
  const rawIndex = Number.parseInt(teamSlideSettings.order_index, 10);
  const parsed = Number.isFinite(rawIndex) && rawIndex >= 0 ? rawIndex : 0;
  return clamp(parsed, 0, mediaCount);
};

const getBirthdaySlideInsertIndex = (mediaCount) => {
  if (!birthdaySlideSettings) return null;
  const rawIndex = Number.parseInt(birthdaySlideSettings.order_index, 10);
  const parsed = Number.isFinite(rawIndex) && rawIndex >= 0 ? rawIndex : 0;
  return clamp(parsed, 0, mediaCount);
};

const buildMediaRenderList = () => {
  const list = mediaItems.map((item) => ({
    type: "media",
    id: item.id,
    item,
  }));
  const autoSlides = [];
  const birthdayInsert = getBirthdaySlideInsertIndex(list.length);
  if (birthdayInsert !== null) {
    autoSlides.push({ type: "birthday", id: BIRTHDAY_SLIDE_CARD_ID, index: birthdayInsert });
  }
  const teamInsert = getTeamSlideInsertIndex(list.length);
  if (teamInsert !== null) {
    autoSlides.push({ type: "team", id: TEAM_SLIDE_CARD_ID, index: teamInsert });
  }

  autoSlides
    .sort((a, b) => {
      if (a.index === b.index) {
        return a.type.localeCompare(b.type);
      }
      return a.index - b.index;
    })
    .forEach((entry) => {
      list.splice(entry.index, 0, { type: entry.type, id: entry.id });
    });
  return list;
};

const renderMedia = () => {
  if (!mediaList) return;
  mediaList.innerHTML = "";
  const renderList = buildMediaRenderList();
  if (!renderList.length) {
    renderEmptyState();
    return;
  }
  renderList.forEach((entry, index) => {
    if (entry.type === "team") {
      mediaList.appendChild(createTeamSlideCard(index, renderList.length));
    } else if (entry.type === "birthday") {
      mediaList.appendChild(createBirthdaySlideCard(index, renderList.length));
    } else {
      const card = createMediaCard(entry.item, index, renderList.length);
      mediaList.appendChild(card);
    }
  });
};

const persistBirthdayOrderIndex = async (orderIndex) => {
  const patch = { birthday_slide: { order_index: orderIndex } };
  const data = await fetchJSON("api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const normalized = normalizeBirthdaySlideSettings(data.birthday_slide || patch.birthday_slide);
  birthdaySlideSettings = normalized;
};

const persistTeamOrderIndex = async (orderIndex) => {
  const patch = { team_slide: { order_index: orderIndex } };
  const data = await fetchJSON("api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const normalized = normalizeTeamSlideSettings(data.team_slide || patch.team_slide);
  teamSlideSettings = normalized;
};

const moveCombinedEntry = async (id, delta) => {
  const renderList = buildMediaRenderList();
  const index = renderList.findIndex((entry) => entry.id === id);
  const target = index + delta;
  if (index === -1 || target < 0 || target >= renderList.length) {
    return;
  }

  const [removed] = renderList.splice(index, 1);
  renderList.splice(target, 0, removed);

  const previousOrder = mediaItems.map((m) => m.id).join("|");
  const newMediaOrder = renderList.filter((entry) => entry.type === "media").map((entry) => entry.item);
  const newOrderSignature = newMediaOrder.map((m) => m.id).join("|");
  mediaItems = newMediaOrder;

  const teamIndex = renderList.findIndex((entry) => entry.type === "team");
  const desiredTeamIndex = teamIndex === -1 ? null : clamp(teamIndex, 0, mediaItems.length);
  const currentTeamIndex = getTeamSlideInsertIndex(mediaItems.length);
  const teamOrderChanged = desiredTeamIndex !== null && desiredTeamIndex !== currentTeamIndex;

  const birthdayIndex = renderList.findIndex((entry) => entry.type === "birthday");
  const desiredBirthdayIndex =
    birthdayIndex === -1 ? null : clamp(birthdayIndex, 0, mediaItems.length);
  const currentBirthdayIndex = getBirthdaySlideInsertIndex(mediaItems.length);
  const birthdayOrderChanged =
    desiredBirthdayIndex !== null && desiredBirthdayIndex !== currentBirthdayIndex;

  if (teamOrderChanged && desiredTeamIndex !== null) {
    teamSlideSettings = {
      ...(teamSlideSettings || DEFAULT_TEAM_SLIDE_SETTINGS),
      order_index: desiredTeamIndex,
    };
  }
  if (birthdayOrderChanged && desiredBirthdayIndex !== null) {
    birthdaySlideSettings = {
      ...(birthdaySlideSettings || DEFAULT_BIRTHDAY_SLIDE_SETTINGS),
      order_index: desiredBirthdayIndex,
    };
  }

  renderMedia();

  try {
    if (previousOrder !== newOrderSignature) {
      await sendOrderUpdate();
    }
    if (teamOrderChanged && desiredTeamIndex !== null) {
      await persistTeamOrderIndex(desiredTeamIndex);
    }
    if (birthdayOrderChanged && desiredBirthdayIndex !== null) {
      await persistBirthdayOrderIndex(desiredBirthdayIndex);
    }
  } catch (error) {
    console.error("Erreur lors du réordonnancement:", error);
  } finally {
    await loadMedia();
  }
};

const loadMedia = async () => {
  if (!mediaList) return;
  try {
    const data = await fetchJSON("api/media");
    mediaItems = Array.isArray(data) ? data : [];
    renderMedia();
  } catch (error) {
    console.error("Impossible de charger les médias:", error);
    mediaList.innerHTML = "";
    const message = document.createElement("div");
    message.className = "empty-state error";
    message.textContent = "Erreur lors du chargement des médias.";
    mediaList.appendChild(message);
  }
};

const setSelectedFiles = (files) => {
  selectedFiles = Array.from(files || []);
  if (!selectedFiles.length) {
    setUploadFeedback("Aucun fichier sélectionné.");
    return;
  }
  if (selectedFiles.length === 1) {
    setUploadFeedback(`Fichier prêt: ${selectedFiles[0].name}`);
  } else {
    setUploadFeedback(`${selectedFiles.length} fichiers prêts à être téléversés.`);
  }
};

const performUpload = async () => {
  if (!selectedFiles.length) {
    setUploadFeedback("Aucun fichier sélectionné.", "error");
    return;
  }
  const formData = new FormData();
  selectedFiles.forEach((file) => formData.append("files", file));
  setUploadFeedback("Téléversement en cours...");
  try {
    await fetchJSON("api/upload", {
      method: "POST",
      body: formData,
    });
    setUploadFeedback("Téléversement réussi !");
    if (fileInput) {
      fileInput.value = "";
    }
    selectedFiles = [];
    await loadMedia();
  } catch (error) {
    console.error(error);
    setUploadFeedback("Erreur lors du téléversement.", "error");
  }
};

// ---------------------------------------------------------------------------
// Section "Anniversaire" – formulaire & arrière-plans
// ---------------------------------------------------------------------------

const setBirthdayVariantUI = (variant) => {
  birthdayCurrentVariant = variant;
  birthdayVariantPills.forEach((pill) => {
    const isActive = pill.dataset.variant === variant;
    pill.classList.toggle("is-active", isActive);
    pill.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
  if (birthdayOpeningBlock) {
    const visible = variant === "weekend";
    birthdayOpeningBlock.hidden = !visible;
    birthdayOpeningBlock.setAttribute("aria-hidden", visible ? "false" : "true");
    if (birthdayOpeningBody && birthdayOpeningToggle) {
      const isCollapsed = birthdayOpeningBody.classList.contains("collapsed");
      birthdayOpeningToggle.setAttribute("aria-expanded", (!visible || isCollapsed) ? "false" : "true");
    }
  }
};

const setBirthdayBackgroundStatus = (message, status = "info") => {
  if (!birthdayBackgroundStatus) return;
  birthdayBackgroundStatus.textContent = message;
  birthdayBackgroundStatus.dataset.status = status;
};

const getCurrentVariantBackgroundPath = () => {
  const cfg = birthdayVariantConfigs[birthdayCurrentVariant];
  return cfg && cfg.background_path ? cfg.background_path : null;
};

const setBirthdayUploadProgress = (percent, { active = true } = {}) => {
  if (!birthdayUploadProgress || !birthdayUploadProgressBar || !birthdayUploadProgressText) {
    return;
  }
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  birthdayUploadProgressBar.style.width = `${clamped}%`;
  birthdayUploadProgressText.textContent = `${clamped}%`;
  birthdayUploadProgress.setAttribute("aria-hidden", active ? "false" : "true");
  birthdayUploadProgress.classList.toggle("visible", active);
};

const applyOpenDaysToUI = (openDays) => {
  const normalized = normalizeOpenDays(openDays);
  birthdayOpenDayButtons.forEach((button) => {
    const day = button.dataset.openDay;
    if (!day) return;
    const isOpen = normalized[day];
    button.dataset.state = isOpen ? "open" : "closed";
    button.setAttribute("aria-pressed", isOpen ? "true" : "false");
    button.setAttribute("aria-checked", isOpen ? "true" : "false");
    const label = button.querySelector(".opening-state-text");
    if (label) {
      label.textContent = isOpen ? "Ouvert" : "Fermé";
    }
  });
};

const populateBirthdayVariantForm = (config) => {
  const hasKey = (obj, key) => obj && Object.prototype.hasOwnProperty.call(obj, key);
  const normalizeOptions = (raw = {}) => ({
    ...BIRTHDAY_TEXT_OPTIONS_DEFAULT,
    ...(typeof raw === "object" && raw ? raw : {}),
  });
  const opts1 = normalizeOptions(config?.text1_options);
  const opts2 = normalizeOptions(config?.text2_options);
  const opts3 = normalizeOptions(config?.text3_options);
  if (birthdayText1Input) {
    birthdayText1Input.value = hasKey(config, "text1") ? config.text1 ?? "" : "(Texte 1)";
    birthdayText1Input.disabled = false;
  }
  if (birthdayText2Input) {
    birthdayText2Input.value = hasKey(config, "text2") ? config.text2 ?? "" : "(Texte 2)";
    birthdayText2Input.disabled = false;
  }
  if (birthdayText3Input) {
    birthdayText3Input.value = hasKey(config, "text3") ? config.text3 ?? "" : "(Texte 3)";
    birthdayText3Input.disabled = false;
  }
  const applyOpts = (line, opts) => {
    const inputs = birthdayTextOptionsInputs[line];
    if (!inputs) return;
    inputs.size && (inputs.size.value = opts.font_size ?? BIRTHDAY_TEXT_OPTIONS_DEFAULT.font_size);
    inputs.color && (inputs.color.value = opts.color ?? BIRTHDAY_TEXT_OPTIONS_DEFAULT.color);
    inputs.font && (inputs.font.value = opts.font_family ?? "");
    inputs.underline && (inputs.underline.checked = Boolean(opts.underline));
    inputs.width && (inputs.width.value = opts.width_percent ?? BIRTHDAY_TEXT_OPTIONS_DEFAULT.width_percent);
    inputs.height &&
      (inputs.height.value = opts.height_percent ?? BIRTHDAY_TEXT_OPTIONS_DEFAULT.height_percent);
    inputs.offsetX &&
      (inputs.offsetX.value = opts.offset_x_percent ?? BIRTHDAY_TEXT_OPTIONS_DEFAULT.offset_x_percent);
    inputs.offsetY &&
      (inputs.offsetY.value = opts.offset_y_percent ?? BIRTHDAY_TEXT_OPTIONS_DEFAULT.offset_y_percent);
    inputs.curve && (inputs.curve.value = opts.curve ?? BIRTHDAY_TEXT_OPTIONS_DEFAULT.curve);
    inputs.angle && (inputs.angle.value = opts.angle ?? BIRTHDAY_TEXT_OPTIONS_DEFAULT.angle);
  };
  applyOpts(1, opts1);
  applyOpts(2, opts2);
  applyOpts(3, opts3);
  if (birthdayVariantSaveButton) {
    birthdayVariantSaveButton.disabled = false;
  }
  setBirthdayVariantUI(birthdayCurrentVariant || "before");
};

const loadBirthdayVariantConfig = async (variant) => {
  setBirthdayVariantUI(variant);
  try {
    const data = await fetchJSON(`api/birthday-slide/config/${variant}`);
    const cfg = (data && data.config) || {};
    const normalized = { ...BIRTHDAY_FIXED_COPY[variant], ...cfg };
    if (!cfg.text1 && cfg.title) normalized.text1 = cfg.title;
    if (!cfg.text2 && cfg.subtitle) normalized.text2 = cfg.subtitle;
    if (!cfg.text3 && cfg.body) normalized.text3 = cfg.body;
    normalized.text1_options = { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, ...cfg.text1_options };
    normalized.text2_options = { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, ...cfg.text2_options };
    normalized.text3_options = { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, ...cfg.text3_options };
    birthdayVariantConfigs[variant] = normalized;
    populateBirthdayVariantForm(birthdayVariantConfigs[variant]);
  } catch (error) {
    console.error("Erreur lors du chargement de la config anniversaire:", error);
    birthdayVariantConfigs[variant] = { ...BIRTHDAY_FIXED_COPY[variant] };
    populateBirthdayVariantForm(birthdayVariantConfigs[variant]);
  }
  renderBirthdayPreview();
  renderBirthdayBackgroundOptions();
};

const saveBirthdayVariantConfig = async ({ successMessage = "Textes enregistrés.", overrides = {} } = {}) => {
  const variant = birthdayCurrentVariant || "before";
  const existing = birthdayVariantConfigs[variant] || { ...BIRTHDAY_FIXED_COPY[variant] };
  const chosenPath =
    overrides.background_path !== undefined
      ? overrides.background_path
      : existing.background_path || null;
  const chosenMime =
    overrides.background_mimetype !== undefined
      ? overrides.background_mimetype
      : birthdayBackgroundOptions.find((opt) => opt.filename === chosenPath)?.mimetype ||
        existing.background_mimetype ||
        null;
  const buildTextOptionsPayload = (line) => {
    const inputs = birthdayTextOptionsInputs[line];
    const base = BIRTHDAY_TEXT_OPTIONS_DEFAULT;
    if (!inputs) return { ...base };
    return {
      font_size: Number(inputs.size?.value) || base.font_size,
      font_family: inputs.font?.value || "",
      width_percent: Number(inputs.width?.value) || base.width_percent,
      height_percent: Number(inputs.height?.value) || base.height_percent,
      color: inputs.color?.value || base.color,
      underline: Boolean(inputs.underline?.checked),
      offset_x_percent: Number(inputs.offsetX?.value) || base.offset_x_percent,
      offset_y_percent: Number(inputs.offsetY?.value) || base.offset_y_percent,
      curve: Number(inputs.curve?.value) || base.curve,
      angle: Number(inputs.angle?.value) || base.angle,
    };
  };
  const payload = {
    text1: birthdayText1Input?.value ?? "",
    text2: birthdayText2Input?.value ?? "",
    text3: birthdayText3Input?.value ?? "",
    text1_options: buildTextOptionsPayload(1),
    text2_options: buildTextOptionsPayload(2),
    text3_options: buildTextOptionsPayload(3),
    background_path: chosenPath,
    background_mimetype: chosenMime,
  };
  try {
    const data = await fetchJSON(`api/birthday-slide/config/${variant}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const cfg = (data && data.config) || payload;
    const merged = { ...BIRTHDAY_FIXED_COPY[variant], ...cfg };
    const selected = birthdayBackgroundOptions.find((opt) => opt.filename === merged.background_path);
    if (selected || overrides.background_url) {
      merged.background_url = overrides.background_url || selected?.url || merged.background_url || null;
      merged.background_mimetype = overrides.background_mimetype || selected?.mimetype || merged.background_mimetype || null;
    } else if (
      birthdayVariantConfigs[variant]?.background_url &&
      merged.background_path === birthdayVariantConfigs[variant].background_path
    ) {
      merged.background_url = birthdayVariantConfigs[variant].background_url;
    }
    birthdayVariantConfigs[variant] = merged;
    setBirthdayBackgroundStatus(successMessage, "success");
    renderBirthdayPreview();
    renderBirthdayBackgroundOptions();
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de la variante anniversaire:", error);
    setBirthdayBackgroundStatus("Impossible d'enregistrer les textes.", "error");
  }
};

const populateBirthdayForm = (settings) => {
  if (!birthdayEnabledInput) return;
  const normalized = settings || DEFAULT_BIRTHDAY_SLIDE_SETTINGS;
  birthdayEnabledInput.checked = Boolean(normalized.enabled);
  if (birthdayTitleTextInput) {
    birthdayTitleTextInput.value = normalized.title_text || "";
  }
  if (birthdayTitleSizeInput) {
    birthdayTitleSizeInput.value = String(normalized.title_font_size || DEFAULT_BIRTHDAY_SLIDE_SETTINGS.title_font_size);
  }
  if (birthdayTitleColorInput) {
    birthdayTitleColorInput.value = normalized.title_color || DEFAULT_BIRTHDAY_SLIDE_SETTINGS.title_color;
  }
  if (birthdayTitleYInput) {
    birthdayTitleYInput.value = String(
      Number.isFinite(Number(normalized.title_y_percent))
        ? normalized.title_y_percent
        : DEFAULT_BIRTHDAY_SLIDE_SETTINGS.title_y_percent,
    );
  }
  applyOpenDaysToUI(normalized.open_days);
};

const buildBirthdaySettingsPayload = (overrides = {}) => {
  const base = birthdaySlideSettings || DEFAULT_BIRTHDAY_SLIDE_SETTINGS;
  const merged = {
    ...base,
    enabled: birthdayEnabledInput ? birthdayEnabledInput.checked : false,
    ...overrides,
  };
  merged.open_days = normalizeOpenDays(overrides.open_days || base.open_days);
  return merged;
};

const saveBirthdaySettings = async (overrides = {}, { localLabel = null } = {}) => {
  const prevSettings = birthdaySlideSettings || {};
  const payload = buildBirthdaySettingsPayload({
    title_text: birthdayTitleTextInput?.value || DEFAULT_BIRTHDAY_SLIDE_SETTINGS.title_text,
    title_font_size:
      Number(birthdayTitleSizeInput?.value) || DEFAULT_BIRTHDAY_SLIDE_SETTINGS.title_font_size,
    title_color: birthdayTitleColorInput?.value || DEFAULT_BIRTHDAY_SLIDE_SETTINGS.title_color,
    title_y_percent:
      Number(birthdayTitleYInput?.value) ?? DEFAULT_BIRTHDAY_SLIDE_SETTINGS.title_y_percent,
    ...overrides,
  });
  try {
    const response = await fetchJSON("api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthday_slide: payload }),
    });
    const raw = response && response.birthday_slide ? response.birthday_slide : payload;
    birthdaySlideSettings = normalizeBirthdaySlideSettings(raw);
    if (!birthdaySlideSettings.background_url && prevSettings.background_url) {
      birthdaySlideSettings.background_url = prevSettings.background_url;
    }
    if (!birthdaySlideSettings.background_mimetype && prevSettings.background_mimetype) {
      birthdaySlideSettings.background_mimetype = prevSettings.background_mimetype;
    }
    if (!birthdaySlideSettings.background_path && prevSettings.background_path) {
      birthdaySlideSettings.background_path = prevSettings.background_path;
    }
    renderMedia();
    return birthdaySlideSettings;
  } catch (error) {
    console.error("Impossible d'enregistrer les paramètres Anniversaire:", error);
    throw error;
  }
};

const toggleOpenDay = async (day) => {
  const previous = normalizeOpenDays(birthdaySlideSettings?.open_days);
  const next = { ...previous, [day]: !previous[day] };
  applyOpenDaysToUI(next);
  birthdaySlideSettings = {
    ...(birthdaySlideSettings || DEFAULT_BIRTHDAY_SLIDE_SETTINGS),
    open_days: next,
  };
  try {
    const updated = await saveBirthdaySettings({ open_days: next });
    applyOpenDaysToUI(updated.open_days);
  } catch (error) {
    console.error("Impossible de mettre à jour le jour d'ouverture:", error);
    birthdaySlideSettings = {
      ...(birthdaySlideSettings || DEFAULT_BIRTHDAY_SLIDE_SETTINGS),
      open_days: previous,
    };
    applyOpenDaysToUI(previous);
  }
};

const isBirthdayBackgroundActive = (item, current) => {
  if (!current) return false;
  if (typeof current === "string") {
    return item.filename === current;
  }
  if (typeof current !== "object") return false;
  if (item.type === "upload" && current.type === "upload") {
    return current.filename === item.filename;
  }
  if (item.type === "library" && current.type === "library") {
    return current.media_id === item.media_id;
  }
  return false;
};

const renderBirthdayBackgroundItem = (item, active = {}) => {
  const wrapper = document.createElement("div");
  wrapper.className = "team-background-item birthday-background-item";
  const isGlobalActive = isBirthdayBackgroundActive(item, active.global);
  const isVariantActive = isBirthdayBackgroundActive(item, active.variant);
  if (isGlobalActive) {
    wrapper.classList.add("team-background-item--active");
  }
  if (isVariantActive) {
    wrapper.classList.add("birthday-background-item--variant");
  }
  wrapper.tabIndex = 0;
  wrapper.setAttribute("role", "button");

  const chipRow = document.createElement("div");
  chipRow.className = "background-chip-row";

  const chip = document.createElement("div");
  chip.className = "background-chip";
  chip.textContent = "Fond importé";
  chipRow.appendChild(chip);

  if (isGlobalActive) {
    const globalChip = document.createElement("div");
    globalChip.className = "background-chip background-chip--global";
    globalChip.textContent = "Fond global";
    chipRow.appendChild(globalChip);
  }

  if (isVariantActive) {
    const variantChip = document.createElement("div");
    variantChip.className = "background-chip background-chip--variant";
    variantChip.textContent = "Fond du modèle sélectionné";
    chipRow.appendChild(variantChip);
  }

  const mediaWrapper = document.createElement("div");
  mediaWrapper.className = "team-background-item-media";
  const mime = (item.mimetype || "").toLowerCase();
  if (mime.startsWith("image/")) {
    const img = document.createElement("img");
    img.src = item.url;
    img.alt = item.label || item.filename || "Arrière-plan";
    mediaWrapper.appendChild(img);
  } else {
    const video = document.createElement("video");
    video.src = item.url;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    mediaWrapper.appendChild(video);
  }

  const label = document.createElement("div");
  label.className = "team-background-item-label";
  label.textContent = item.label || item.filename || "Média";

  const selectButton = document.createElement("button");
  selectButton.type = "button";
  selectButton.className = "secondary-button";
  selectButton.textContent = isGlobalActive ? "Fond global actif" : "Définir comme fond global";
  selectButton.disabled = isGlobalActive;

  const selectBackground = async () => {
    if (isGlobalActive) return;
    setBirthdayBackgroundStatus("Mise à jour...", "info");
    const patch = {
      background_path: item.filename,
      background_mimetype: item.mimetype || null,
      background_media_id: null,
    };
    try {
      await saveBirthdaySettings(patch);
      birthdaySlideSettings = {
        ...(birthdaySlideSettings || DEFAULT_BIRTHDAY_SLIDE_SETTINGS),
        background_url: item.url || null,
      };
      renderBirthdayPreview();
      setBirthdayBackgroundStatus("Arrière-plan sélectionné.", "success");
      await loadBirthdayBackgroundList();
    } catch (error) {
      console.error("Erreur lors de la sélection du fond Anniversaire:", error);
      setBirthdayBackgroundStatus("Impossible de sélectionner cet arrière-plan.", "error");
    }
  };

  const assignVariantBackground = async () => {
    const variant = birthdayCurrentVariant || "before";
    if (!birthdayVariantConfigs[variant]) {
      birthdayVariantConfigs[variant] = { ...BIRTHDAY_FIXED_COPY[variant] };
    }
    birthdayVariantConfigs[variant].background_path = item.filename;
    birthdayVariantConfigs[variant].background_mimetype = item.mimetype || null;
    birthdayVariantConfigs[variant].background_url = item.url || null;
    renderBirthdayPreview();
    try {
      await saveBirthdayVariantConfig({
        successMessage: "Fond appliqué à ce modèle.",
        overrides: {
          background_path: item.filename,
          background_mimetype: item.mimetype || null,
          background_url: item.url || null,
        },
      });
      renderBirthdayBackgroundOptions();
    } catch (error) {
      console.error("Erreur lors de l'application du fond à la variante Anniversaire:", error);
      setBirthdayBackgroundStatus("Impossible d'appliquer ce fond à ce modèle.", "error");
    }
  };

  const actionBar = document.createElement("div");
  actionBar.className = "birthday-background-actions";

  const variantButton = document.createElement("button");
  variantButton.type = "button";
  variantButton.className = "secondary-button";
  variantButton.textContent = isVariantActive ? "Fond du modèle actif" : "Appliquer au modèle sélectionné";
  variantButton.disabled = isVariantActive;

  wrapper.addEventListener("click", selectBackground);
  wrapper.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void selectBackground();
    }
  });
  selectButton.addEventListener("click", (event) => {
    event.stopPropagation();
    void selectBackground();
  });

  variantButton.addEventListener("click", (event) => {
    event.stopPropagation();
    void assignVariantBackground();
  });

  actionBar.append(selectButton, variantButton);

  wrapper.append(chipRow, mediaWrapper, label, actionBar);
  return wrapper;
};

const renderBirthdayBackgroundOptions = () => {
  if (!birthdayBackgroundList) return;
  birthdayBackgroundList.innerHTML = "";
  if (!birthdayBackgroundOptions.length) {
    const empty = document.createElement("p");
    empty.className = "field-hint";
    empty.textContent = "Aucun arrière-plan disponible pour le moment.";
    birthdayBackgroundList.appendChild(empty);
    return;
  }

  const activeVariantPath = getCurrentVariantBackgroundPath();
  const active = {
    global: birthdayBackgroundCurrent,
    variant: activeVariantPath,
  };

  birthdayBackgroundOptions.forEach((item) => {
    const enriched = { ...item, type: "upload", label: item.label || item.filename };
    birthdayBackgroundList.appendChild(renderBirthdayBackgroundItem(enriched, active));
  });
};

const loadBirthdayBackgroundList = async () => {
  if (!birthdayBackgroundList) return;
  try {
    const data = await fetchJSON("api/birthday-slide/backgrounds");
    const items = Array.isArray(data.items) ? data.items : [];
    birthdayBackgroundOptions = items;
    birthdayBackgroundCurrent = data.current || {};
    renderBirthdayBackgroundOptions();
    renderBirthdayPreview();
  } catch (error) {
    console.error("Erreur lors du chargement des fonds Anniversaire:", error);
    birthdayBackgroundOptions = [];
    birthdayBackgroundCurrent = {};
    birthdayBackgroundList.innerHTML = "";
    const message = document.createElement("p");
    message.className = "field-hint error";
    message.textContent = "Impossible de charger les arrière-plans.";
    birthdayBackgroundList.appendChild(message);
  }
};

const uploadBirthdayBackground = async (file = null) => {
  if (!file) {
    if (!birthdayBackgroundInput) return;
    if (!birthdayBackgroundInput.files || !birthdayBackgroundInput.files.length) {
      birthdayBackgroundInput.click();
      return;
    }
    file = birthdayBackgroundInput.files[0];
  }
  const formData = new FormData();
  formData.append("file", file);
  setBirthdayBackgroundStatus("Téléversement en cours...", "info");
  setBirthdayUploadProgress(0, { active: true });

  // Use XMLHttpRequest to get progress events.
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "api/birthday-slide/background");

  const resetProgress = () => setBirthdayUploadProgress(0, { active: false });

  xhr.upload.addEventListener("progress", (event) => {
    if (event.lengthComputable) {
      const percent = (event.loaded / event.total) * 100;
      setBirthdayUploadProgress(percent, { active: true });
    }
  });

  const finishSuccess = async (responseJson) => {
    const rawSettings =
      responseJson && responseJson.settings && responseJson.settings.birthday_slide
        ? responseJson.settings.birthday_slide
        : birthdaySlideSettings;
    birthdaySlideSettings = normalizeBirthdaySlideSettings(rawSettings || {});
    if (responseJson && responseJson.background_url) {
      birthdaySlideSettings.background_url = responseJson.background_url;
    }
    setBirthdayBackgroundStatus("Arrière-plan mis à jour.", "success");
    renderMedia();
    renderBirthdayPreview();
    await loadBirthdayBackgroundList();
  };

  xhr.onload = async () => {
    resetProgress();
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const json = JSON.parse(xhr.responseText || "{}");
        await finishSuccess(json);
      } catch (error) {
        console.error("Réponse invalide de l'upload:", error);
        setBirthdayBackgroundStatus("Réponse serveur invalide.", "error");
      }
    } else {
      console.error("Échec upload arrière-plan:", xhr.status, xhr.responseText);
      setBirthdayBackgroundStatus("Téléversement impossible.", "error");
    }
  };

  xhr.onerror = () => {
    resetProgress();
    setBirthdayBackgroundStatus("Téléversement impossible (réseau).", "error");
  };

  xhr.send(formData);
  if (birthdayBackgroundInput) {
    birthdayBackgroundInput.value = "";
  }
};

// Aperçu "Anniversaire"

const getExtensionLower = (name) => {
  if (!name) return "";
  const dot = name.lastIndexOf(".");
  if (dot === -1) return "";
  return name.slice(dot + 1).toLowerCase();
};

const updateBirthdayOverlayText = (root, settings) => {
  if (!root) return;
  const overlay =
    root.classList?.contains("birthday-slide-overlay") && !root.querySelector
      ? root
      : root.querySelector?.(".birthday-slide-overlay") || root;
  if (!overlay) return;
  const lines = overlay.querySelectorAll(".birthday-slide-line");
  const texts = [settings.text1 ?? "", settings.text2 ?? "", settings.text3 ?? ""];
  const optionsList = [
    settings.text1_options || BIRTHDAY_TEXT_OPTIONS_DEFAULT,
    settings.text2_options || BIRTHDAY_TEXT_OPTIONS_DEFAULT,
    settings.text3_options || BIRTHDAY_TEXT_OPTIONS_DEFAULT,
  ];
  lines.forEach((line, idx) => {
    if (!line) return;
    const text = texts[idx] || "";
    line.textContent = text;
    const opts = optionsList[idx] || BIRTHDAY_TEXT_OPTIONS_DEFAULT;
    const color = opts.color || settings.title_color;
    if (color) {
      line.style.color = color;
    }
    if (opts.font_size) {
      line.style.fontSize = `${opts.font_size}px`;
    } else if (idx === 0 && settings.title_font_size) {
      line.style.fontSize = `${settings.title_font_size}px`;
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
    const left = Math.min(100, Math.max(0, 50 + offsetX));
    const top = Math.min(100, Math.max(0, 50 + offsetY));
    line.style.left = `${left}%`;
    line.style.top = `${top}%`;
    const rotation = `rotate(${opts.angle || 0}deg)`;
    line.style.transform = `translate(-50%, -50%) ${rotation}`;
  });
};

const updateBirthdayOverlayLayout = (root, settings) => {
  if (!root) return;
  const overlay =
    root.classList?.contains("birthday-slide-overlay") && !root.querySelector
      ? root
      : root.querySelector?.(".birthday-slide-overlay") || root;
  if (!overlay) return;
  const pos = Number.isFinite(Number(settings.title_y_percent))
    ? Math.min(100, Math.max(0, Number(settings.title_y_percent)))
    : DEFAULT_BIRTHDAY_SLIDE_SETTINGS.title_y_percent;
  overlay.style.justifyContent = "center";
  overlay.style.paddingTop = "0";
  overlay.style.alignItems = "center";
};

const applyBirthdayPreviewScale = () => {
  if (!birthdayPreviewStage || !birthdayPreviewCanvas) return;
  const rect = birthdayPreviewStage.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const baseW = BIRTHDAY_PREVIEW_BASE_WIDTH;
  const baseH = BIRTHDAY_PREVIEW_BASE_HEIGHT;
  const scale = Math.min(rect.width / baseW, rect.height / baseH);
  birthdayPreviewCanvas.style.setProperty("--birthday-preview-scale", `${scale}`);
};

const renderBirthdayPreview = () => {
  if (!birthdayPreviewStage) return;
  const settings = birthdaySlideSettings || DEFAULT_BIRTHDAY_SLIDE_SETTINGS;
  const variantCfg = birthdayVariantConfigs[birthdayCurrentVariant] || BIRTHDAY_CONFIG_DEFAULT;
  const effective = {
    ...settings,
    text1: variantCfg.text1 ?? settings.title_text ?? "",
    text2: variantCfg.text2 ?? variantCfg.subtitle ?? "",
    text3: variantCfg.text3 ?? variantCfg.body ?? "",
    text1_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, ...variantCfg.text1_options },
    text2_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, ...variantCfg.text2_options },
    text3_options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, ...variantCfg.text3_options },
    background_path: variantCfg.background_path || settings.background_path,
    background_mimetype: variantCfg.background_mimetype || settings.background_mimetype,
    background_url: variantCfg.background_url || settings.background_url,
  };
  const bgUrl = effective.background_url;
  const mime = (effective.background_mimetype || "").toLowerCase();
  const extHint = getExtensionLower(effective.background_path || bgUrl || "");
  const bgKey = `${bgUrl || "none"}|${mime}|${extHint}`;

  // If same source is already rendered, just refresh text/scale to avoid reloading the video.
  if (birthdayPreviewRenderedSource === bgKey && birthdayPreviewStage.firstChild) {
    updateBirthdayOverlayText(birthdayPreviewStage, effective);
    updateBirthdayOverlayLayout(birthdayPreviewStage, effective);
    applyBirthdayPreviewScale();
    return;
  }

  birthdayPreviewStage.innerHTML = "";

  const canvas = document.createElement("div");
  canvas.className = "birthday-preview-canvas";
  canvas.style.setProperty("--birthday-preview-base-width", `${BIRTHDAY_PREVIEW_BASE_WIDTH}px`);
  canvas.style.setProperty("--birthday-preview-base-height", `${BIRTHDAY_PREVIEW_BASE_HEIGHT}px`);

  const frame = document.createElement("div");
  frame.className = "birthday-slide-frame";

  const backdrop = document.createElement("div");
  backdrop.className = "birthday-slide-backdrop";
  const ext = extHint;
  const isVideo = mime.startsWith("video/") || ["mp4", "m4v", "mov", "webm", "mkv"].includes(ext);

  if (bgUrl && isVideo) {
    const video = document.createElement("video");
    video.className = "birthday-slide-media birthday-slide-video";
    video.src = bgUrl;
    video.preload = "auto";
    video.loop = true;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    void video.play().catch(() => {});
    video.addEventListener("loadedmetadata", applyBirthdayPreviewScale);
    video.addEventListener("canplay", applyBirthdayPreviewScale);
    backdrop.appendChild(video);
  } else if (bgUrl) {
    const img = document.createElement("img");
    img.className = "birthday-slide-media birthday-slide-image";
    img.src = bgUrl;
    img.alt = "Arrière-plan Anniversaire";
    img.addEventListener("load", applyBirthdayPreviewScale);
    backdrop.appendChild(img);
  } else {
    backdrop.classList.add("birthday-slide-backdrop--fallback");
  }

  const overlay = document.createElement("div");
  overlay.className = "birthday-slide-overlay";
  const linesWrapper = document.createElement("div");
  linesWrapper.className = "birthday-slide-lines";
  const line1 = document.createElement("div");
  line1.className = "birthday-slide-line birthday-slide-line--primary";
  const line2 = document.createElement("div");
  line2.className = "birthday-slide-line";
  const line3 = document.createElement("div");
  line3.className = "birthday-slide-line";
  linesWrapper.append(line1, line2, line3);
  overlay.append(linesWrapper);
  updateBirthdayOverlayText(overlay, effective);
  updateBirthdayOverlayLayout(canvas, effective);

  frame.append(backdrop, overlay);
  canvas.appendChild(frame);
  birthdayPreviewStage.appendChild(canvas);
  birthdayPreviewCanvas = canvas;
  applyBirthdayPreviewScale();
  birthdayPreviewRenderedSource = bgKey;

  if (!birthdayPreviewResizeObserver && "ResizeObserver" in window) {
    birthdayPreviewResizeObserver = new ResizeObserver(applyBirthdayPreviewScale);
  }
  if (birthdayPreviewResizeObserver) {
    birthdayPreviewResizeObserver.observe(birthdayPreviewStage);
  }
};

// ---------------------------------------------------------------------------
// Section "Notre Équipe" – formulaire & aperçu
// ---------------------------------------------------------------------------

const setTeamBackgroundStatus = (message, status = "info") => {
  if (!teamBackgroundStatus) return;
  teamBackgroundStatus.textContent = message;
  teamBackgroundStatus.dataset.status = status;
};

const populateTeamForm = (settings) => {
  if (!settings || !teamCardDurationInput) return;

  teamEnabledInput && (teamEnabledInput.checked = Boolean(settings.enabled));
  const durationVal =
    Number(settings.card_min_duration) || DEFAULT_TEAM_SLIDE_SETTINGS.card_min_duration;
  teamCardDurationInput.value = String(durationVal);

  if (teamTitleEnabledInput) {
    teamTitleEnabledInput.checked = Boolean(settings.title_enabled);
  }
  if (teamTitleTextInput) {
    teamTitleTextInput.value = settings.title_text || "";
  }
  if (teamTitlePositionSelect && settings.title_position) {
    teamTitlePositionSelect.value = settings.title_position;
  }
  if (teamTitleFontSizeInput) {
    teamTitleFontSizeInput.value = String(
      settings.title_font_size || DEFAULT_TEAM_SLIDE_SETTINGS.title_font_size,
    );
  }
  if (teamTitleColorInput) {
    teamTitleColorInput.value =
      settings.title_color || DEFAULT_TEAM_SLIDE_SETTINGS.title_color;
  }
  if (teamTitleBackgroundColorInput) {
    teamTitleBackgroundColorInput.value =
      settings.title_background_color || "#ffffff";
  }
  if (teamTitleUnderlineInput) {
    teamTitleUnderlineInput.checked = Boolean(settings.title_underline);
  }
  if (teamTitleAngleInput) {
    teamTitleAngleInput.value = String(settings.title_angle || 0);
  }
  if (teamTitleWidthInput) {
    teamTitleWidthInput.value = String(
      settings.title_width_percent || DEFAULT_TEAM_SLIDE_SETTINGS.title_width_percent,
    );
  }
  if (teamTitleHeightInput) {
    teamTitleHeightInput.value = String(
      settings.title_height_percent || DEFAULT_TEAM_SLIDE_SETTINGS.title_height_percent,
    );
  }
  if (teamTitleOffsetXInput) {
    teamTitleOffsetXInput.value = String(
      settings.title_offset_x_percent || DEFAULT_TEAM_SLIDE_SETTINGS.title_offset_x_percent,
    );
  }
  if (teamTitleOffsetYInput) {
    teamTitleOffsetYInput.value = String(
      settings.title_offset_y_percent || DEFAULT_TEAM_SLIDE_SETTINGS.title_offset_y_percent,
    );
  }
};

const serializeTeamForm = () => {
  const settings = teamSlideSettings ? { ...teamSlideSettings } : { ...DEFAULT_TEAM_SLIDE_SETTINGS };
  if (teamEnabledInput) {
    settings.enabled = teamEnabledInput.checked;
  }
  if (teamCardDurationInput) {
    const d = Number(teamCardDurationInput.value);
    if (Number.isFinite(d) && d >= 0.5 && d <= 120) {
      settings.card_min_duration = d;
    }
  }
  if (teamTitleEnabledInput) {
    settings.title_enabled = teamTitleEnabledInput.checked;
  }
  if (teamTitleTextInput) {
    settings.title_text = teamTitleTextInput.value || "";
  }
  if (teamTitlePositionSelect) {
    settings.title_position = teamTitlePositionSelect.value || "center";
  }
  if (teamTitleFontSizeInput) {
    const val = Number(teamTitleFontSizeInput.value);
    if (Number.isFinite(val) && val >= 8 && val <= 200) {
      settings.title_font_size = val;
    }
  }
  if (teamTitleColorInput && teamTitleColorInput.value) {
    settings.title_color = teamTitleColorInput.value;
  }
  if (teamTitleBackgroundColorInput && teamTitleBackgroundColorInput.value) {
    settings.title_background_color = teamTitleBackgroundColorInput.value;
  }
  if (teamTitleUnderlineInput) {
    settings.title_underline = teamTitleUnderlineInput.checked;
  }
  if (teamTitleAngleInput) {
    const val = Number(teamTitleAngleInput.value);
    if (Number.isFinite(val) && val >= -360 && val <= 360) {
      settings.title_angle = val;
    }
  }
  if (teamTitleWidthInput) {
    const val = Number(teamTitleWidthInput.value);
    if (Number.isFinite(val) && val >= 10 && val <= 100) {
      settings.title_width_percent = val;
    }
  }
  if (teamTitleHeightInput) {
    const val = Number(teamTitleHeightInput.value);
    if (Number.isFinite(val) && val >= 5 && val <= 100) {
      settings.title_height_percent = val;
    }
  }
  if (teamTitleOffsetXInput) {
    const val = Number(teamTitleOffsetXInput.value);
    if (Number.isFinite(val) && val >= -50 && val <= 50) {
      settings.title_offset_x_percent = val;
    }
  }
  if (teamTitleOffsetYInput) {
    const val = Number(teamTitleOffsetYInput.value);
    if (Number.isFinite(val) && val >= -50 && val <= 50) {
      settings.title_offset_y_percent = val;
    }
  }
  return settings;
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

const renderTeamPreviewCard = (employee) => {
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

  const serviceLabel = formatServiceLabel(employee);
  card.append(header, description);

  if (serviceLabel) {
    const service = document.createElement("div");
    service.className = "team-slide-card-service";
    service.textContent = serviceLabel;
    card.append(service);
  }

  return card;
};

const getTeamCardDurationSeconds = () => {
  const fallback = DEFAULT_TEAM_SLIDE_SETTINGS.card_min_duration;
  const raw = teamSlideSettings ? Number(teamSlideSettings.card_min_duration) : fallback;
  return Math.max(0.5, Number.isFinite(raw) ? raw : fallback);
};

const stopTeamPreviewRotation = () => {
  if (teamPreviewTimer) {
    clearTimeout(teamPreviewTimer);
    teamPreviewTimer = null;
  }
  if (teamPreviewFrame) {
    cancelAnimationFrame(teamPreviewFrame);
    teamPreviewFrame = null;
  }
  if (teamPreviewStartTimer) {
    clearTimeout(teamPreviewStartTimer);
    teamPreviewStartTimer = null;
  }
};

const applyTeamPreviewScale = () => {
  if (!teamPreviewStage || !teamPreviewCanvas) return;
  const baseW = TEAM_PREVIEW_BASE_WIDTH;
  const baseH = TEAM_PREVIEW_BASE_HEIGHT;
  const rect = teamPreviewStage.getBoundingClientRect();
  const scale = Math.min(
    (rect.width || baseW) / baseW,
    (rect.height || baseH) / baseH
  );
  teamPreviewCanvas.style.setProperty("--team-preview-base-width", `${baseW}px`);
  teamPreviewCanvas.style.setProperty("--team-preview-base-height", `${baseH}px`);
  teamPreviewCanvas.style.setProperty("--team-preview-scale", `${scale}`);
};

const renderTeamPreview = () => {
  stopTeamPreviewRotation();
  if (!teamPreviewStage) return;
  const settings = teamSlideSettings || DEFAULT_TEAM_SLIDE_SETTINGS;
  teamPreviewStage.innerHTML = "";

  const canvas = document.createElement("div");
  canvas.className = "team-preview-canvas";

  const root = document.createElement("div");
  root.className = "team-slide-frame";

  const bgUrl = settings.background_url || null;
  const bgMime = (settings.background_mimetype || "").toLowerCase();

  if (bgUrl) {
    if (bgMime.startsWith("video/")) {
      const video = document.createElement("video");
      video.className = "team-slide-video";
      video.src = bgUrl;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      root.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.className = "team-slide-image";
      img.src = bgUrl;
      img.alt = "Aperçu arrière-plan Notre Équipe";
      root.appendChild(img);
    }
  } else {
    const blank = document.createElement("div");
    blank.className = "team-slide-blank team-preview-blank";
    root.appendChild(blank);
  }

  const overlay = document.createElement("div");
  overlay.className = "team-slide-overlay";
  const overlayInner = document.createElement("div");
  overlayInner.className = "team-slide-overlay-inner";

  const hasTitle = settings.title_enabled && settings.title_text;
  const titlePlaceholder = hasTitle ? document.createElement("div") : null;
  const title = hasTitle ? document.createElement("div") : null;
  if (title) {
    title.className = "team-slide-title";
    title.textContent = settings.title_text;
    title.style.color = settings.title_color || "#111";
    title.style.width = `${Math.max(10, settings.title_width_percent || 80)}%`;
    if (settings.title_background_color) {
      title.style.background = settings.title_background_color;
    }
    if (settings.title_font_size) {
      title.style.fontSize = `${settings.title_font_size * TEAM_SLIDE_SCALE}px`;
    }
    if (settings.title_underline) {
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
  canvas.appendChild(root);
  teamPreviewStage.appendChild(canvas);
  teamPreviewCanvas = canvas;
  applyTeamPreviewScale();
  if (!teamPreviewResizeListenerAttached) {
    if ("ResizeObserver" in window) {
      teamPreviewResizeObserver = new ResizeObserver(applyTeamPreviewScale);
      teamPreviewResizeObserver.observe(teamPreviewStage);
    } else {
      window.addEventListener("resize", applyTeamPreviewScale);
    }
    teamPreviewResizeListenerAttached = true;
  }

  const employeeList = Array.isArray(employees) ? employees.slice() : [];
  if (!employeeList.length) {
    const empty = document.createElement("div");
    empty.className = "team-preview-empty";
    empty.textContent = "Ajoutez des employés pour visualiser la diapositive.";
    cardsContainer.appendChild(empty);
    return;
  }

  cardsContainer.innerHTML = "";
  employeeList.forEach((emp) => cardsContainer.appendChild(renderTeamPreviewCard(emp)));
  cardsContainer.style.transform = "translateY(0)";
  cardsContainer.style.willChange = "transform";

  const overlayStyles = window.getComputedStyle(overlayInner);
  const overlayPaddingTop = Number.parseFloat(overlayStyles.paddingTop) || 0;

  const viewportHeight = Math.max(1, cardsViewport.clientHeight || 0);
  const contentHeight = cardsContainer.scrollHeight;
  const minDurationSec = getTeamCardDurationSeconds();

  let minCardHeight = Infinity;
  cardsContainer.querySelectorAll(".team-slide-card").forEach((node) => {
    const h = node.getBoundingClientRect().height;
    if (Number.isFinite(h) && h > 0) {
      minCardHeight = Math.min(minCardHeight, h);
    }
  });
  if (!Number.isFinite(minCardHeight) || minCardHeight <= 0) {
    minCardHeight = 180;
  }
  const overrun = Math.max(48, minCardHeight / 2);

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
    contentHeight > 0 ? (viewportHeight + minCardHeight) / minDurationSec : 0;
  cardsContainer.style.transform = `translateY(${startOffset}px)`;

  if (pixelsPerSecond <= 0) {
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
      teamPreviewFrame = null;
      teamPreviewTimer = null;
      renderTeamPreview();
      return;
    }
    teamPreviewFrame = requestAnimationFrame(animateScroll);
  };

  const holdMs = title ? TEAM_TITLE_HOLD_MS : 0;
  teamPreviewStartTimer = setTimeout(() => {
    teamPreviewFrame = requestAnimationFrame(animateScroll);
  }, holdMs);
};

const loadTeamBackgroundList = async () => {
  if (!teamBackgroundList) return;
  try {
    const data = await fetchJSON("api/team-slide/backgrounds");
    const items = Array.isArray(data.items) ? data.items : [];
    const current = data.current || (teamSlideSettings && teamSlideSettings.background_path);

    teamBackgroundList.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "field-hint";
      empty.textContent = "Aucun arrière-plan enregistré pour l'instant.";
      teamBackgroundList.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const wrapper = document.createElement("div");
      wrapper.className = "team-background-item";
      if (item.filename === current) {
        wrapper.classList.add("team-background-item--active");
      }
      wrapper.dataset.filename = item.filename;
      wrapper.tabIndex = 0;
      wrapper.setAttribute("role", "button");

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "team-background-remove";
      removeButton.setAttribute("aria-label", `Supprimer ${item.filename}`);
      removeButton.textContent = "X";

      const mediaWrapper = document.createElement("div");
      mediaWrapper.className = "team-background-item-media";

      const mime = (item.mimetype || "").toLowerCase();
      if (mime.startsWith("video/")) {
        const video = document.createElement("video");
        video.src = item.url;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute("playsinline", "");
        mediaWrapper.appendChild(video);
      } else {
        const img = document.createElement("img");
        img.src = item.url;
        img.alt = item.filename;
        mediaWrapper.appendChild(img);
      }

      const label = document.createElement("div");
      label.className = "team-background-item-label";
      label.textContent = item.filename;
      const selectBackground = async () => {
        try {
          await fetchJSON("api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              team_slide: {
                background_path: item.filename,
                background_mimetype: item.mimetype || null,
              },
            }),
          });
          teamSlideSettings = {
            ...(teamSlideSettings || DEFAULT_TEAM_SLIDE_SETTINGS),
            background_path: item.filename,
            background_url: item.url,
            background_mimetype: item.mimetype || null,
          };
          renderTeamPreview();
          void loadTeamBackgroundList();
          setTeamBackgroundStatus("Arrière-plan sélectionné.", "success");
        } catch (error) {
          console.error("Erreur lors de la sélection du fond:", error);
          setTeamBackgroundStatus("Erreur lors de la sélection.", "error");
        }
      };

      wrapper.append(removeButton, mediaWrapper, label);

      wrapper.addEventListener("click", selectBackground);
      wrapper.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          void selectBackground();
        }
      });

      removeButton.addEventListener("click", async (event) => {
        event.stopPropagation();
        event.preventDefault();
        try {
          const response = await fetchJSON(
            `api/team-slide/background/${encodeURIComponent(item.filename)}`,
            { method: "DELETE" }
          );
          if (response && response.settings && response.settings.team_slide) {
            teamSlideSettings = normalizeTeamSlideSettings(response.settings.team_slide);
            renderTeamPreview();
          } else if (teamSlideSettings && teamSlideSettings.background_path === item.filename) {
            teamSlideSettings = {
              ...teamSlideSettings,
              background_path: null,
              background_url: null,
              background_mimetype: null,
            };
            renderTeamPreview();
          }
          setTeamBackgroundStatus("Arrière-plan supprimé.", "success");
          void loadTeamBackgroundList();
        } catch (error) {
          console.error("Erreur lors de la suppression du fond:", error);
          setTeamBackgroundStatus("Suppression impossible.", "error");
        }
      });

      teamBackgroundList.appendChild(wrapper);
    });
  } catch (error) {
    console.error("Erreur lors du chargement des fonds:", error);
  }
};

const uploadTeamBackground = async () => {
  if (!teamBackgroundInput || !teamBackgroundInput.files || !teamBackgroundInput.files.length) {
    setTeamBackgroundStatus("Aucun fichier sélectionné.", "error");
    return;
  }
  const file = teamBackgroundInput.files[0];
  const formData = new FormData();
  formData.append("file", file);

  setTeamBackgroundStatus("Téléversement en cours...");
  try {
    const response = await fetchJSON("api/team-slide/background", {
      method: "POST",
      body: formData,
    });
    const settings = response.settings || null;
    if (settings && settings.team_slide) {
      const rawTeam = settings.team_slide || {};
      const normalized = normalizeTeamSlideSettings(rawTeam);
      teamSlideSettings = {
        ...normalized,
        background_url: response.background_url || rawTeam.background_url || null,
        background_mimetype: response.background_mimetype || rawTeam.background_mimetype || null,
      };
    } else {
      teamSlideSettings = {
        ...(teamSlideSettings || DEFAULT_TEAM_SLIDE_SETTINGS),
        background_url: response.background_url || null,
        background_mimetype: response.background_mimetype || null,
      };
    }
    renderTeamPreview();
    void loadTeamBackgroundList();
    setTeamBackgroundStatus("Arrière-plan mis à jour.", "success");
  } catch (error) {
    console.error("Erreur lors du téléversement de l'arrière-plan.", error);
    setTeamBackgroundStatus("Erreur lors du téléversement.", "error");
  } finally {
    if (teamBackgroundInput) {
      teamBackgroundInput.value = "";
    }
  }
};

const saveTeamSettings = async () => {
  if (!teamSaveStatus) return;
  const settings = serializeTeamForm();
  teamSaveStatus.textContent = "Enregistrement...";
  teamSaveStatus.dataset.status = "info";
  try {
    const response = await fetchJSON("api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_slide: settings }),
    });
    const raw = response && response.team_slide ? response.team_slide : settings;
    teamSlideSettings = normalizeTeamSlideSettings(raw);
    renderTeamPreview();
    teamSaveStatus.textContent = "Paramètres enregistrés.";
    teamSaveStatus.dataset.status = "success";
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'option Notre Équipe:", error);
    teamSaveStatus.textContent = "Erreur lors de l'enregistrement.";
    teamSaveStatus.dataset.status = "error";
  }
};

// ---------------------------------------------------------------------------
// Gestion des employés
// ---------------------------------------------------------------------------

const pad2 = (n) => String(n).padStart(2, "0");

const buildBirthdayString = () => {
  if (!employeeBirthdayDay || !employeeBirthdayMonth || !employeeBirthdayYear) {
    return "";
  }
  const day = employeeBirthdayDay.value;
  const month = employeeBirthdayMonth.value;
  const year = employeeBirthdayYear.value;
  if (!day || !month || !year) return "";
  return `${year}-${pad2(month)}-${pad2(day)}`;
};

const buildHireDateString = () => {
  if (!employeeHireYear || !employeeHireMonth) return "";
  const year = employeeHireYear.value;
  const month = employeeHireMonth.value || "01";
  const day = employeeHireDay && employeeHireDay.value ? employeeHireDay.value : "";
  if (!year) return "";
  if (!day) {
    return `${year}-${pad2(month)}-01`;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
};

const parseBirthdayIntoFields = (value) => {
  if (!value || !employeeBirthdayDay || !employeeBirthdayMonth || !employeeBirthdayYear) {
    return;
  }
  const parts = value.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    employeeBirthdayYear.value = y || "";
    employeeBirthdayMonth.value = String(Number(m) || "");
    employeeBirthdayDay.value = String(Number(d) || "");
  }
};

const parseHireDateIntoFields = (value) => {
  if (!value || !employeeHireYear || !employeeHireMonth || !employeeHireDay) return;
  const parts = value.split("-");
  if (parts.length >= 2) {
    const [y, m, d] = parts;
    employeeHireYear.value = y || "";
    employeeHireMonth.value = String(Number(m) || "");
    employeeHireDay.value = d ? String(Number(d)) : "";
  }
};

const openEmployeeModal = (employee = null) => {
  if (!employeeModal || !employeeForm || !employeeNameInput) return;

  employeeForm.reset();
  if (employeeAvatarPreview) {
    employeeAvatarPreview.src = "";
    employeeAvatarPreview.classList.add("hidden");
  }
  if (employeeAvatarInput) {
    employeeAvatarInput.value = "";
  }
  if (employeeAvatarRemoveButton) {
    employeeAvatarRemoveButton.disabled = true;
  }

  if (employee) {
    employeeModalTitle && (employeeModalTitle.textContent = "Modifier l'employé");
    employeeIdInput && (employeeIdInput.value = employee.id);
    employeeNameInput.value = employee.name || "";
    employeeRoleInput && (employeeRoleInput.value = employee.role || "");
    employeeDescriptionInput && (employeeDescriptionInput.value = employee.description || "");
    parseBirthdayIntoFields(employee.birthday || "");
    parseHireDateIntoFields(employee.hire_date || "");
    if (employee.avatar_base64 && employeeAvatarPreview) {
      employeeAvatarPreview.src = `data:image/*;base64,${employee.avatar_base64}`;
      employeeAvatarPreview.classList.remove("hidden");
    }
    if (employeeAvatarRemoveButton) {
      employeeAvatarRemoveButton.disabled = !employee.avatar_base64;
    }
  } else {
    employeeModalTitle && (employeeModalTitle.textContent = "Nouvel employé");
    employeeIdInput && (employeeIdInput.value = "");
  }

  employeeModal.classList.remove("hidden");
  employeeModal.classList.add("open");
  employeeModal.setAttribute("aria-hidden", "false");
};

const closeEmployeeModal = () => {
  if (!employeeModal) return;
  employeeModal.classList.remove("open");
  employeeModal.classList.add("hidden");
  employeeModal.setAttribute("aria-hidden", "true");
};

const renderEmployeesList = () => {
  if (!employeesList) return;
  employeesList.innerHTML = "";
  if (!employees.length) {
    const empty = document.createElement("li");
    empty.className = "employees-row employees-empty";
    empty.textContent = "Aucun employé enregistré.";
    employeesList.appendChild(empty);
    return;
  }

  employees.forEach((emp, index) => {
    const li = document.createElement("li");
    li.className = "employees-row";
    li.dataset.id = emp.id;

    const main = document.createElement("div");
    main.className = "employee-main";

    const avatar = document.createElement("div");
    avatar.className = "employee-avatar";
    if (emp.avatar_base64) {
      const img = document.createElement("img");
      img.src = `data:image/*;base64,${emp.avatar_base64}`;
      img.alt = `Avatar de ${emp.name || "Employé"}`;
      avatar.appendChild(img);
    } else {
      avatar.textContent = initialsFromName(emp.name || "");
    }

    const info = document.createElement("div");
    info.className = "info";
    const name = document.createElement("strong");
    name.textContent = emp.name || "Employé";
    const meta = document.createElement("span");
    meta.className = "meta";
    const metaBits = [];
    if (emp.role) metaBits.push(emp.role);
    const serviceLabel = formatServiceLabel(emp);
    if (serviceLabel) {
      metaBits.push(serviceLabel);
    }
    meta.textContent = metaBits.join(" • ");
    info.append(name, meta);

    main.append(avatar, info);

    const actions = document.createElement("div");
    actions.className = "employees-item-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "secondary-button";
    editBtn.textContent = "Modifier";
    editBtn.addEventListener("click", () => openEmployeeModal(emp));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "secondary-button danger";
    delBtn.textContent = "Supprimer";
    delBtn.addEventListener("click", async () => {
      if (!window.confirm("Supprimer cet employé ?")) return;
      try {
        await fetchJSON(`api/employees/${emp.id}`, { method: "DELETE" });
        await loadEmployees();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression.");
      }
    });

    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "secondary-button icon-button";
    upBtn.textContent = "▲";
    upBtn.disabled = index === 0;
    upBtn.addEventListener("click", () => moveEmployee(emp.id, -1));

    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "secondary-button icon-button";
    downBtn.textContent = "▼";
    downBtn.disabled = index === employees.length - 1;
    downBtn.addEventListener("click", () => moveEmployee(emp.id, 1));

    actions.append(editBtn, delBtn, upBtn, downBtn);
    li.append(main, actions);
    employeesList.appendChild(li);
  });
};

const loadEmployees = async () => {
  if (!employeesList) return;
  try {
    const data = await fetchJSON("api/employees");
    employees = Array.isArray(data.employees) ? data.employees : [];
    renderEmployeesList();
    renderTeamPreview();
  } catch (error) {
    console.error("Erreur lors du chargement des employés:", error);
    employees = [];
    renderEmployeesList();
    renderTeamPreview();
  }
};

const uploadEmployeeAvatarIfNeeded = async (employeeId) => {
  if (!employeeAvatarInput || !employeeAvatarInput.files || !employeeAvatarInput.files.length) {
    return;
  }
  const file = employeeAvatarInput.files[0];
  const formData = new FormData();
  formData.append("file", file);
  try {
    await fetchJSON(`api/employees/${employeeId}/avatar`, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    console.error("Erreur lors du téléversement de l'avatar:", error);
  }
};

const removeEmployeeAvatar = async () => {
  if (!employeeAvatarRemoveButton) return;
  const employeeId = employeeIdInput?.value || "";
  const resetPreview = () => {
    if (employeeAvatarPreview) {
      employeeAvatarPreview.src = "";
      employeeAvatarPreview.classList.add("hidden");
    }
    if (employeeAvatarInput) {
      employeeAvatarInput.value = "";
    }
  };

  // If the employee isn't saved yet, just clear the local selection.
  if (!employeeId) {
    resetPreview();
    employeeAvatarRemoveButton.disabled = true;
    return;
  }

  employeeAvatarRemoveButton.disabled = true;
  employeeAvatarRemoveButton.textContent = "Suppression...";
  try {
    const response = await fetchJSON(`api/employees/${employeeId}/avatar`, { method: "DELETE" });
    const updated = response && response.employee ? response.employee : null;
    resetPreview();
    if (updated) {
      employees = employees.map((emp) => (emp.id === employeeId ? updated : emp));
      renderEmployeesList();
      renderTeamPreview();
    } else {
      await loadEmployees();
    }
  } catch (error) {
    console.error("Erreur lors de la suppression de l'avatar:", error);
    alert("Impossible de supprimer l'avatar.");
  } finally {
    employeeAvatarRemoveButton.textContent = "Supprimer l'avatar";
    const hasPreview =
      employeeAvatarPreview && !employeeAvatarPreview.classList.contains("hidden");
    employeeAvatarRemoveButton.disabled = !hasPreview;
  }
};

const moveEmployee = async (id, delta) => {
  const index = employees.findIndex((e) => e.id === id);
  const swapIndex = index + delta;
  if (index === -1 || swapIndex < 0 || swapIndex >= employees.length) return;
  const copy = employees.slice();
  const [removed] = copy.splice(index, 1);
  copy.splice(swapIndex, 0, removed);
  try {
    await fetchJSON("api/employees/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: copy.map((e) => e.id) }),
    });
    employees = copy;
    renderEmployeesList();
    renderTeamPreview();
  } catch (error) {
    console.error("Erreur lors du réordonnancement des employés:", error);
  }
};

const submitEmployeeForm = async (event) => {
  event.preventDefault();
  if (!employeeNameInput) return;

  const name = employeeNameInput.value.trim();
  if (!name) {
    alert("Le nom est requis.");
    return;
  }
  const birthday = buildBirthdayString();
  const hireDate = buildHireDateString();

  const payload = {
    name,
    birthday,
    role: employeeRoleInput ? employeeRoleInput.value.trim() : "",
    description: employeeDescriptionInput ? employeeDescriptionInput.value.trim() : "",
    hire_date: hireDate,
  };

  const id = employeeIdInput ? employeeIdInput.value : "";
  let employee = null;
  try {
    if (id) {
      const data = await fetchJSON(`api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      employee = data.employee;
    } else {
      const data = await fetchJSON("api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      employee = data.employee;
    }
    if (employee && employee.id) {
      await uploadEmployeeAvatarIfNeeded(employee.id);
    }
    await loadEmployees();
    closeEmployeeModal();
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'employé:", error);
    alert("Erreur lors de l'enregistrement de l'employé.");
  }
};

const initEmployeeFormChoices = () => {
  // Jours 1-31
  if (employeeBirthdayDay) {
    for (let d = 1; d <= 31; d += 1) {
      const opt = document.createElement("option");
      opt.value = String(d);
      opt.textContent = String(d);
      employeeBirthdayDay.appendChild(opt);
    }
  }
  if (employeeHireDay) {
    const days = [{ value: "", label: "Jour" }];
    for (let d = 1; d <= 31; d += 1) {
      days.push({ value: String(d), label: String(d) });
    }
    days.forEach(({ value, label }) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      employeeHireDay.appendChild(opt);
    });
  }
  // Mois 1-12
  if (employeeBirthdayMonth || employeeHireMonth) {
    const monthLabels = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    monthLabels.forEach((label, index) => {
      const value = String(index + 1);
      if (employeeBirthdayMonth) {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        employeeBirthdayMonth.appendChild(opt);
      }
      if (employeeHireMonth) {
        const opt2 = document.createElement("option");
        opt2.value = value;
        opt2.textContent = label;
        employeeHireMonth.appendChild(opt2);
      }
    });
  }
  // Années
  const now = new Date();
  const currentYear = now.getFullYear();
  if (employeeBirthdayYear) {
    for (let y = currentYear; y >= currentYear - 70; y -= 1) {
      const opt = document.createElement("option");
      opt.value = String(y);
      opt.textContent = String(y);
      employeeBirthdayYear.appendChild(opt);
    }
  }
  if (employeeHireYear) {
    for (let y = currentYear; y >= currentYear - 50; y -= 1) {
      const opt = document.createElement("option");
      opt.value = String(y);
      opt.textContent = String(y);
      employeeHireYear.appendChild(opt);
    }
  }
};

// ---------------------------------------------------------------------------
// PowerPoint (accueil) – téléversement simple
// ---------------------------------------------------------------------------

const setPptUploadFeedback = (message) => {
  if (!pptUploadFeedback) return;
  pptUploadFeedback.textContent = message;
};

const loadPowerpointList = async () => {
  if (!pptList) return;
  pptList.innerHTML = "";
  try {
    const items = await fetchJSON("api/powerpoint");
    if (!Array.isArray(items) || !items.length) {
      const empty = document.createElement("p");
      empty.className = "field-hint";
      empty.textContent = "Aucune présentation téléversée.";
      pptList.appendChild(empty);
      return;
    }
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "media-card";
      const title = document.createElement("h3");
      title.textContent = item.original_name || item.filename;
      const link = document.createElement("a");
      link.href = item.player_url || "#";
      link.textContent = "Lire";
      link.className = "primary-button";
      link.target = "_blank";
      link.rel = "noopener";
      card.append(title, link);
      pptList.appendChild(card);
    });
  } catch (error) {
    console.error("Erreur lors du chargement des présentations:", error);
  }
};

const openPptModal = () => {
  if (!pptModal) return;
  pptModal.classList.remove("hidden");
  pptModal.setAttribute("aria-hidden", "false");
};

const closePptModal = () => {
  if (!pptModal) return;
  pptModal.classList.add("hidden");
  pptModal.setAttribute("aria-hidden", "true");
};

const submitPptUploadForm = async (event) => {
  event.preventDefault();
  if (!pptFileInput || !pptFileInput.files || !pptFileInput.files.length) {
    setPptUploadFeedback("Aucun fichier sélectionné.");
    return;
  }
  const formData = new FormData();
  Array.from(pptFileInput.files).forEach((file) => formData.append("files", file));
  setPptUploadFeedback("Téléversement en cours...");
  try {
    await fetchJSON("api/powerpoint/upload", {
      method: "POST",
      body: formData,
    });
    setPptUploadFeedback("Téléversement terminé.");
    pptFileInput.value = "";
    await loadPowerpointList();
    closePptModal();
  } catch (error) {
    console.error("Erreur lors du téléversement PowerPoint:", error);
    setPptUploadFeedback("Erreur lors du téléversement.");
  }
};

// ---------------------------------------------------------------------------
// Événements & initialisation
// ---------------------------------------------------------------------------

if (uploadForm && fileInput && dropZone) {
  uploadForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void performUpload();
  });

  fileInput.addEventListener("change", (event) => {
    setSelectedFiles(event.target.files);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      highlightDropZone(true);
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      highlightDropZone(false);
    });
  });

  dropZone.addEventListener("drop", (event) => {
    const { files } = event.dataTransfer || {};
    if (files && files.length) {
      setSelectedFiles(files);
    }
  });
}

refreshButton?.addEventListener("click", () => {
  void loadMedia();
});

hideAllButton?.addEventListener("click", async () => {
  if (!mediaItems.length) return;
  const confirmAction = window.confirm("Masquer tous les médias ?");
  if (!confirmAction) return;
  try {
    for (const item of mediaItems) {
      // eslint-disable-next-line no-await-in-loop
      await saveItem(item.id, { enabled: false });
    }
    await loadMedia();
  } catch (error) {
    console.error(error);
    alert("Erreur lors du masquage global.");
  }
});

showAllButton?.addEventListener("click", async () => {
  if (!mediaItems.length) return;
  const confirmAction = window.confirm("Démasquer tous les médias ?");
  if (!confirmAction) return;
  try {
    for (const item of mediaItems) {
      // eslint-disable-next-line no-await-in-loop
      await saveItem(item.id, { enabled: true });
    }
    await loadMedia();
  } catch (error) {
    console.error(error);
    alert("Erreur lors du démasquage global.");
  }
});

slideshowButton?.addEventListener("click", () => {
  try {
    sessionStorage.setItem("cardinal_auto_slideshow", "1");
  } catch (error) {
    console.warn("Impossible d'accéder au stockage de session:", error);
  }
  window.location.href = "slideshow";
});

overlayHeightInput?.addEventListener("input", () => {
  overlayHeightValue.textContent = overlayHeightInput.value;
});

overlayModeSelect?.addEventListener("change", () => {
  applyModeVisibility(overlayModeSelect.value);
});

settingsButton?.addEventListener("click", async () => {
  if (!overlaySettings || !teamSlideSettings || !birthdaySlideSettings) {
    await loadOverlayAndSlideSettings();
  } else {
    populateSettingsForm(overlaySettings);
  }
  openSettingsModal();
});

modalCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeSettingsModal();
  });
});

settingsModal?.addEventListener("click", (event) => {
  if (
    event.target instanceof HTMLElement &&
    event.target.dataset.modalClose !== undefined
  ) {
    closeSettingsModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settingsModal?.classList.contains("open")) {
    closeSettingsModal();
    closeEmployeeModal();
    closePptModal();
  }
});

settingsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const overlayPayload = serializeSettingsForm();
  try {
    const response = await fetchJSON("api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overlay: overlayPayload }),
    });
    overlaySettings = (response && response.overlay) || overlayPayload;
    closeSettingsModal();
  } catch (error) {
    console.error("Impossible d'enregistrer les paramètres de la bande:", error);
  }
});

// Anniversaire : interactions
birthdayBackgroundUploadButton?.addEventListener("click", () => {
  void uploadBirthdayBackground();
});

birthdayBackgroundInput?.addEventListener("change", () => {
  void uploadBirthdayBackground();
});

birthdayDropZone?.addEventListener("click", (event) => {
  event.preventDefault();
  birthdayBackgroundInput?.click();
});

const birthdayDragEvents = ["dragenter", "dragover", "dragleave", "drop"];
birthdayDragEvents.forEach((eventName) => {
  birthdayDropZone?.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
});

birthdayDropZone?.addEventListener("dragenter", () => {
  birthdayDropZone.classList.add("drag-over");
});
birthdayDropZone?.addEventListener("dragover", () => {
  birthdayDropZone.classList.add("drag-over");
});
birthdayDropZone?.addEventListener("dragleave", () => {
  birthdayDropZone.classList.remove("drag-over");
});
birthdayDropZone?.addEventListener("drop", (event) => {
  const { files } = event.dataTransfer || {};
  birthdayDropZone.classList.remove("drag-over");
  if (files && files.length) {
    void uploadBirthdayBackground(files[0]);
  }
});

birthdayEnabledInput?.addEventListener("change", () => {
  void saveBirthdaySettings();
  renderBirthdayPreview();
});

birthdayPreviewRefreshButton?.addEventListener("click", () => {
  renderBirthdayPreview();
});

birthdayBackgroundToggleButton?.addEventListener("click", () => {
  if (!birthdayBackgroundBody) return;
  const collapsed = birthdayBackgroundBody.classList.toggle("collapsed");
  birthdayBackgroundToggleButton.classList.toggle("expanded", !collapsed);
  birthdayBackgroundToggleButton.setAttribute("aria-expanded", collapsed ? "false" : "true");
});

birthdayOpenDayButtons.forEach((button) => {
  button?.addEventListener("click", () => {
    const day = button.dataset.openDay;
    if (!day) return;
    void toggleOpenDay(day);
  });
});

birthdayOpeningToggle?.addEventListener("click", () => {
  if (!birthdayOpeningBody) return;
  const collapsed = birthdayOpeningBody.classList.toggle("collapsed");
  birthdayOpeningToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
});

// Mise à jour en direct des réglages de titre
[birthdayTitleTextInput, birthdayTitleSizeInput, birthdayTitleColorInput, birthdayTitleYInput].forEach(
  (input) => {
    input?.addEventListener("input", () => {
      void saveBirthdaySettings();
      renderBirthdayPreview();
    });
  }
);

// Textes des variantes (3 lignes)
[birthdayText1Input, birthdayText2Input, birthdayText3Input].forEach((input, idx) => {
  input?.addEventListener("input", () => {
    const variant = birthdayCurrentVariant || "before";
    if (!birthdayVariantConfigs[variant]) {
      birthdayVariantConfigs[variant] = { ...BIRTHDAY_FIXED_COPY[variant] };
    }
    birthdayVariantConfigs[variant][`text${idx + 1}`] = input.value;
    renderBirthdayPreview();
  });
});

birthdayTextOptionToggles.forEach((toggle) => {
  toggle?.addEventListener("click", () => {
    const line = toggle.dataset.line;
    if (!line) return;
    const panel = document.querySelector(`.birthday-text-options[data-line="${line}"]`);
    if (!panel) return;
    const isHidden = panel.hasAttribute("hidden") || panel.getAttribute("aria-hidden") === "true";
    panel.toggleAttribute("hidden", !isHidden);
    panel.setAttribute("aria-hidden", isHidden ? "false" : "true");
    toggle.setAttribute("aria-expanded", isHidden ? "true" : "false");
  });
});

birthdayTextOptionsPanels.forEach((panel) => panel.setAttribute("aria-hidden", "true"));

birthdayTextOptionsPanels.forEach((panel) => {
  const line = panel.dataset.line;
  if (!line || !birthdayTextOptionsInputs[line]) return;
  const inputs = birthdayTextOptionsInputs[line];
  Object.entries(inputs).forEach(([key, element]) => {
    element?.addEventListener("input", () => {
      const variant = birthdayCurrentVariant || "before";
      if (!birthdayVariantConfigs[variant]) {
        birthdayVariantConfigs[variant] = { ...BIRTHDAY_FIXED_COPY[variant] };
      }
      const optsKey = `text${line}_options`;
      birthdayVariantConfigs[variant][optsKey] = {
        ...BIRTHDAY_TEXT_OPTIONS_DEFAULT,
        ...(birthdayVariantConfigs[variant][optsKey] || {}),
        font_size: Number(inputs.size?.value) || BIRTHDAY_TEXT_OPTIONS_DEFAULT.font_size,
        color: inputs.color?.value || BIRTHDAY_TEXT_OPTIONS_DEFAULT.color,
        font_family: inputs.font?.value || "",
        underline: Boolean(inputs.underline?.checked),
        width_percent: Number(inputs.width?.value) || BIRTHDAY_TEXT_OPTIONS_DEFAULT.width_percent,
        height_percent: Number(inputs.height?.value) || BIRTHDAY_TEXT_OPTIONS_DEFAULT.height_percent,
        offset_x_percent:
          Number(inputs.offsetX?.value) || BIRTHDAY_TEXT_OPTIONS_DEFAULT.offset_x_percent,
        offset_y_percent:
          Number(inputs.offsetY?.value) || BIRTHDAY_TEXT_OPTIONS_DEFAULT.offset_y_percent,
        curve: Number(inputs.curve?.value) || BIRTHDAY_TEXT_OPTIONS_DEFAULT.curve,
        angle: Number(inputs.angle?.value) || BIRTHDAY_TEXT_OPTIONS_DEFAULT.angle,
      };
      renderBirthdayPreview();
    });
  });
});

// Variantes d'anniversaire
birthdayVariantPills.forEach((pill) => {
  pill?.addEventListener("click", () => {
    const variant = pill.dataset.variant || "before";
    if (variant === birthdayCurrentVariant) return;
    void loadBirthdayVariantConfig(variant);
  });
});

birthdayVariantSaveButton?.addEventListener("click", () => {
  void saveBirthdayVariantConfig({ successMessage: "Textes enregistrés pour ce modèle." });
});

// Notre Équipe: interactions
teamBackgroundUploadButton?.addEventListener("click", () => {
  void uploadTeamBackground();
});

teamPreviewRefreshButton?.addEventListener("click", () => {
  renderTeamPreview();
  void loadEmployees();
});

teamSaveButton?.addEventListener("click", () => {
  void saveTeamSettings();
});

if (teamTitleOptions && teamTitleOptionsToggle) {
  teamTitleOptionsToggle.addEventListener("click", () => {
    const expanded = teamTitleOptions.classList.toggle("expanded");
    teamTitleOptions.classList.toggle("collapsed", !expanded);
    teamTitleOptionsToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
  });
}

// Employés
employeesAddButton?.addEventListener("click", () => {
  openEmployeeModal(null);
});

employeeCancelButton?.addEventListener("click", () => {
  closeEmployeeModal();
});

employeeForm?.addEventListener("submit", submitEmployeeForm);

employeeModal?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.employeeModalClose !== undefined) {
    closeEmployeeModal();
  }
});

mediaModal?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (
    target.dataset.modalClose !== undefined ||
    target.classList.contains("media-modal-backdrop") ||
    target.classList.contains("media-modal-close") ||
    target.closest(".media-modal-close")
  ) {
    closeMediaModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mediaModal && !mediaModal.classList.contains("hidden")) {
    closeMediaModal();
  }
});

employeeAvatarInput?.addEventListener("change", () => {
  if (!employeeAvatarInput.files || !employeeAvatarInput.files.length || !employeeAvatarPreview) {
    return;
  }
  const file = employeeAvatarInput.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    employeeAvatarPreview.src = reader.result;
    employeeAvatarPreview.classList.remove("hidden");
    if (employeeAvatarRemoveButton) {
      employeeAvatarRemoveButton.disabled = false;
    }
  };
  reader.readAsDataURL(file);
});

employeeAvatarRemoveButton?.addEventListener("click", () => {
  void removeEmployeeAvatar();
});

// PowerPoint (accueil)
pptUploadButton?.addEventListener("click", () => {
  openPptModal();
});

pptModal?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.modalClose !== undefined) {
    closePptModal();
  }
});

pptUploadForm?.addEventListener("submit", submitPptUploadForm);

// Initialisation globale
window.addEventListener("load", async () => {
  // Accueil : pas de formulaire de médias -> seulement overlay + PPT
  if (!uploadForm) {
    await loadOverlayAndSlideSettings();
    await loadPowerpointList();
  } else {
    await loadOverlayAndSlideSettings();
    await loadMedia();
    await loadEmployees();
    initEmployeeFormChoices();
  }
  updateQuebecTime();
  if (!quebecTimeTimer) {
    quebecTimeTimer = setInterval(updateQuebecTime, 1000);
  }
});
