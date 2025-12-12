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
const birthdayCountdownBlock = document.querySelector(".birthday-countdown");
const birthdayDaysBeforeInput = document.querySelector("#birthday-days-before");
const birthdaySectionRoot = document.querySelector("#birthday-section");
const birthdayTextList = document.querySelector("#birthday-text-list");
const birthdayTextTemplate = document.querySelector("#birthday-text-template");
const birthdayTextAddButton = document.querySelector("#birthday-text-add");
let birthdayCustomFonts = [];
const birthdayTitleTextInput = document.querySelector("#birthday-title-text");
const birthdayTitleSizeInput = document.querySelector("#birthday-title-size");
const birthdayTitleColorInput = document.querySelector("#birthday-title-color");
const birthdayTitleYInput = document.querySelector("#birthday-title-y");
const birthdayVariantSaveButton = document.querySelector("#birthday-variant-save");
const birthdayOpenDayButtons = document.querySelectorAll("[data-open-day]");

// Section "Changement d'heure" (éditeur)
const timeChangeEnabledInput = document.querySelector("#time-change-enabled");
const timeChangeDaysBeforeInput = document.querySelector("#time-change-days-before");
const timeChangeDurationInput = document.querySelector("#time-change-duration");
const timeChangeLinesList = document.querySelector("#time-change-lines-list");
const timeChangeTextAddButton = document.querySelector("#time-change-text-add");
const timeChangeTextList = document.querySelector("#time-change-text-list");
const timeChangeTextTemplate = document.querySelector("#time-change-text-template");
const timeChangeSaveButton = document.querySelector("#time-change-save");
const timeChangeStatus = document.querySelector("#time-change-status");
const timeChangeNextSubtitle = document.querySelector("#time-change-next-subtitle");
const timeChangePreviewStage = document.querySelector("#time-change-preview-stage");
const timeChangeRefreshButton = document.querySelector("#time-change-refresh");
const timeChangePreviewRefreshButton = document.querySelector("#time-change-preview-refresh");
const timeChangeBackgroundInput = document.querySelector("#time-change-background-input");
const timeChangeBackgroundUploadButton = document.querySelector("#time-change-background-upload-button");
const timeChangeBackgroundStatus = document.querySelector("#time-change-background-status");
const timeChangeBackgroundList = document.querySelector("#time-change-background-list");
const timeChangeBackgroundToggleButton = document.querySelector("#time-change-background-toggle");
const timeChangeBackgroundBody = document.querySelector(".time-change-background-body");
const timeChangeDropZone = document.querySelector("#time-change-drop-zone");
const timeChangeShowUpcomingButton = document.querySelector("#time-change-show-upcoming");
const timeChangeUpcomingList = document.querySelector("#time-change-upcoming-list");

// Section "Noël" (éditeur)
const christmasEnabledInput = document.querySelector("#christmas-enabled");
const christmasDaysBeforeInput = document.querySelector("#christmas-days-before");
const christmasDurationInput = document.querySelector("#christmas-duration");
const christmasTextList = document.querySelector("#christmas-text-list");
const christmasTextAddButton = document.querySelector("#christmas-text-add");
const christmasTextTemplate = document.querySelector("#christmas-text-template");
const christmasSaveButton = document.querySelector("#christmas-save");
const christmasStatus = document.querySelector("#christmas-status");
const christmasNextSubtitle = document.querySelector("#christmas-next-subtitle");
const christmasPreviewStage = document.querySelector("#christmas-preview-stage");
const christmasPreviewRefreshButton = document.querySelector("#christmas-preview-refresh");
const christmasBackgroundInput = document.querySelector("#christmas-background-input");
const christmasBackgroundUploadButton = document.querySelector("#christmas-background-upload-button");
const christmasBackgroundStatus = document.querySelector("#christmas-background-status");
const christmasBackgroundList = document.querySelector("#christmas-background-list");
const christmasBackgroundToggleButton = document.querySelector("#christmas-background-toggle");
const christmasBackgroundBody = document.querySelector(".christmas-background-body");
const christmasDropZone = document.querySelector("#christmas-drop-zone");

const requestFullscreenFor = async (element) => {
  if (!element || !element.requestFullscreen) return;
  if (document.fullscreenElement && document.fullscreenElement === element) {
    await document.exitFullscreen().catch(() => {});
    return;
  }
  try {
    await element.requestFullscreen();
  } catch (error) {
    console.warn("Impossible d'entrer en plein écran:", error);
  }
};

const bindPreviewFullscreen = (element) => {
  if (!element || element.dataset.fullscreenBound === "1") return;
  element.dataset.fullscreenBound = "1";
  element.addEventListener("click", () => {
    void requestFullscreenFor(element);
  });
};

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
const teamTitleWidthInput = document.querySelector("#team-title-width");
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
let timeChangeSlideSettings = null;
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
let timeChangeBackgroundOptions = [];
let timeChangeInfo = null;
let timeChangePreviewCanvas = null;
let timeChangePreviewResizeObserver = null;
let timeChangePreviewRenderedSource = null;
let timeChangeLines = [];
let timeChangeInfoRefreshTimer = null;
let christmasBackgroundOptions = [];
let christmasInfo = null;
let christmasPreviewCanvas = null;
let christmasPreviewResizeObserver = null;
let christmasPreviewRenderedSource = null;
let christmasLines = [];
let christmasSlideSettings = null;
let customSlideSettings = null;
let customSlides = [];
let autoSlideDisplayableMap = null;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const buildArray = (value) => (Array.isArray(value) ? value.slice() : []);

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
  title_width_percent: 80,
  title_height_percent: 20,
  title_offset_x_percent: 0,
  title_offset_y_percent: 0,
};

const DEFAULT_CUSTOM_SLIDE_SETTINGS = {
  enabled: false,
  order_index: 0,
  duration: 12,
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
  days_before: 3,
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
  bold: false,
  italic: false,
  background_color: null,
  background_opacity: 0,
  offset_x_percent: 0,
  offset_y_percent: 0,
  curve: 0,
  angle: 0,
};
const BIRTHDAY_MAX_LINES = 50;
const BIRTHDAY_FONT_CHOICES = [
  { label: "Par défaut", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Poppins", value: "Poppins, sans-serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Open Sans", value: "\"Open Sans\", sans-serif" },
  { label: "Lato", value: "Lato, sans-serif" },
  { label: "Oswald", value: "Oswald, sans-serif" },
  { label: "Raleway", value: "Raleway, sans-serif" },
  { label: "Merriweather", value: "Merriweather, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "\"Times New Roman\", serif" },
  { label: "Playfair Display", value: "\"Playfair Display\", serif" },
  { label: "Courier New", value: "\"Courier New\", monospace" },
  { label: "Fira Code", value: "\"Fira Code\", monospace" },
  { label: "Comic Sans MS", value: "\"Comic Sans MS\", cursive" },
  { label: "Impact", value: "Impact, sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Nunito", value: "Nunito, sans-serif" },
  { label: "Quicksand", value: "Quicksand, sans-serif" },
  { label: "Source Sans Pro", value: "\"Source Sans Pro\", sans-serif" },
  { label: "Source Serif Pro", value: "\"Source Serif Pro\", serif" },
  { label: "Source Code Pro", value: "\"Source Code Pro\", monospace" },
  { label: "Work Sans", value: "\"Work Sans\", sans-serif" },
  { label: "Karla", value: "Karla, sans-serif" },
  { label: "DM Sans", value: "\"DM Sans\", sans-serif" },
  { label: "DM Serif Display", value: "\"DM Serif Display\", serif" },
  { label: "Manrope", value: "Manrope, sans-serif" },
  { label: "Mulish", value: "Mulish, sans-serif" },
  { label: "Josefin Sans", value: "\"Josefin Sans\", sans-serif" },
  { label: "Bebas Neue", value: "\"Bebas Neue\", sans-serif" },
  { label: "Great Vibes", value: "\"Great Vibes\", cursive" },
  { label: "Pacifico", value: "Pacifico, cursive" },
  { label: "Lobster", value: "Lobster, cursive" },
  { label: "Play", value: "Play, sans-serif" },
  { label: "Exo 2", value: "\"Exo 2\", sans-serif" },
  { label: "Titillium Web", value: "\"Titillium Web\", sans-serif" },
  { label: "Barlow", value: "Barlow, sans-serif" },
  { label: "Cabin", value: "Cabin, sans-serif" },
  { label: "Rubik", value: "Rubik, sans-serif" },
  { label: "Hind", value: "Hind, sans-serif" },
  { label: "PT Sans", value: "\"PT Sans\", sans-serif" },
  { label: "PT Serif", value: "\"PT Serif\", serif" },
  { label: "IBM Plex Sans", value: "\"IBM Plex Sans\", sans-serif" },
  { label: "IBM Plex Serif", value: "\"IBM Plex Serif\", serif" },
  { label: "IBM Plex Mono", value: "\"IBM Plex Mono\", monospace" },
  { label: "Space Grotesk", value: "\"Space Grotesk\", sans-serif" },
  { label: "Space Mono", value: "\"Space Mono\", monospace" },
  { label: "Sora", value: "Sora, sans-serif" },
  { label: "Urbanist", value: "Urbanist, sans-serif" },
  { label: "Asap", value: "Asap, sans-serif" },
  { label: "Catamaran", value: "Catamaran, sans-serif" },
  { label: "Caveat", value: "Caveat, cursive" },
  { label: "Dancing Script", value: "\"Dancing Script\", cursive" },
  { label: "Playpen Sans", value: "\"Playpen Sans\", cursive" },
  { label: "Satisfy", value: "Satisfy, cursive" },
  { label: "Quattrocento", value: "Quattrocento, serif" },
  { label: "Cormorant Garamond", value: "\"Cormorant Garamond\", serif" },
  { label: "Arvo", value: "Arvo, serif" },
  { label: "Cinzel", value: "Cinzel, serif" },
  { label: "Crimson Pro", value: "\"Crimson Pro\", serif" },
  { label: "Bitter", value: "Bitter, serif" },
  { label: "Archivo", value: "Archivo, sans-serif" },
  { label: "Assistant", value: "Assistant, sans-serif" },
];

const TIME_CHANGE_TEXT_OPTIONS_DEFAULT = { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, color: "#f8fafc" };
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

const DEFAULT_TIME_CHANGE_SETTINGS = {
  enabled: false,
  order_index: 0,
  duration: 12,
  background_path: null,
  background_url: null,
  background_mimetype: null,
  days_before: 7,
  use_custom_date: false,
  custom_date: "",
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

const DEFAULT_CHRISTMAS_SETTINGS = {
  enabled: false,
  order_index: 0,
  duration: 12,
  background_path: null,
  background_url: null,
  background_mimetype: null,
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

const CHRISTMAS_TEXT_OPTIONS_DEFAULT = { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, color: "#f8fafc" };
const CHRISTMAS_MAX_LINES = BIRTHDAY_MAX_LINES;
const CHRISTMAS_PREVIEW_BASE_WIDTH = 1920;
const CHRISTMAS_PREVIEW_BASE_HEIGHT = 1080;

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
  lines: [
    { text: "(Texte 1)", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT } },
    { text: "(Texte 2)", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT } },
    { text: "(Texte 3)", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT } },
  ],
  background_path: null,
  background_mimetype: null,
  background_url: null,
};

const TIME_CHANGE_WEEKDAYS_FR = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

const TIME_CHANGE_MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

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
    background_path: null,
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
    background_path: null,
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
    background_path: null,
  },
};

const TEAM_SLIDE_SCALE = 1.25;
const TEAM_TITLE_HOLD_MS = 3000;

const TEAM_CARDS_PER_PAGE = 4;
const TEAM_SLIDE_CARD_ID = "__team_slide__";
const CUSTOM_SLIDE_CARD_ID = "__custom_slide__";
const BIRTHDAY_SLIDE_CARD_ID = "__birthday_slide__";
const TIME_CHANGE_SLIDE_CARD_ID = "__time_change_slide__";
const CHRISTMAS_SLIDE_CARD_ID = "__christmas_slide__";
const CUSTOM_AVAILABILITY_PREFIX = "custom:";
const buildCustomAvailabilityKey = (slideId) => `${CUSTOM_AVAILABILITY_PREFIX}${slideId}`;
const buildCustomCardId = (slideId) => `${CUSTOM_SLIDE_CARD_ID}-${slideId}`;
const TEAM_PREVIEW_BASE_WIDTH = 1920;
const TEAM_PREVIEW_BASE_HEIGHT = 1080;
const BIRTHDAY_PREVIEW_BASE_WIDTH = 1920;
const BIRTHDAY_PREVIEW_BASE_HEIGHT = 1080;
const TIME_CHANGE_PREVIEW_BASE_WIDTH = 1920;
const TIME_CHANGE_PREVIEW_BASE_HEIGHT = 1080;
const TIME_CHANGE_INFO_REFRESH_INTERVAL_MS = 60000;

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

const quebecDateFormatter = new Intl.DateTimeFormat("fr-CA", {
  timeZone: "America/Toronto",
  dateStyle: "short",
});

const quebecTimeFormatter = new Intl.DateTimeFormat("fr-CA", {
  timeZone: "America/Toronto",
  timeStyle: "short",
});

const updateQuebecTime = () => {
  if (!quebecTimeDisplay) {
    return;
  }
  const now = new Date();
  const formattedDate = quebecDateFormatter.format(now);
  const formattedTime = quebecTimeFormatter.format(now);
  quebecTimeDisplay.textContent = `${formattedDate} • ${formattedTime}`;
};

const normalizeBaseUrl = (value) => {
  if (!value) return "/";
  return value.endsWith("/") ? value : `${value}/`;
};

const APP_BASE_URL = normalizeBaseUrl(document.body?.dataset.baseUrl || "/");

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

const fetchJSON = async (url, options) => {
  const response = await fetch(buildApiUrl(url), options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Requête échouée");
  }
  return response.json();
};

const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

window.CardinalApp = {
  buildApiUrl,
  fetchJSON,
  clampValue,
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
  } else if (result.background_path) {
    result.background_url = buildApiUrl(`christmas-slide/asset/${result.background_path}`);
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
  if ("title_width_percent" in raw) {
    const val = Number(raw.title_width_percent);
    if (Number.isFinite(val) && val >= 10 && val <= 100) {
      result.title_width_percent = val;
    }
  }
  return result;
};

const normalizeCustomSlideSettings = (raw) => {
  const base = { ...DEFAULT_CUSTOM_SLIDE_SETTINGS };
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
    const val = Number(raw.duration);
    if (Number.isFinite(val) && val >= 1 && val <= 600) {
      result.duration = val;
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
  if ("days_before" in raw) {
    const val = Number.parseInt(raw.days_before, 10);
    if (Number.isFinite(val) && val >= 0 && val <= 365) {
      result.days_before = val;
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

const normalizeTimeChangeSettings = (raw) => {
  const base = { ...DEFAULT_TIME_CHANGE_SETTINGS };
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
  if ("days_before" in raw) {
    const days = Number.parseInt(raw.days_before, 10);
    if (Number.isFinite(days) && days >= 0 && days <= 365) {
      result.days_before = days;
    }
  }
  if ("use_custom_date" in raw) {
    result.use_custom_date = Boolean(raw.use_custom_date);
  }
  if (typeof raw.custom_date === "string") {
    result.custom_date = raw.custom_date.trim();
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
  if ("offset_hours" in raw) {
    const hours = Number(raw.offset_hours);
    if (Number.isFinite(hours) && hours >= 0 && hours <= 5) {
      result.offset_hours = hours;
    }
  }
  if (typeof raw.title_text === "string") {
    result.title_text = raw.title_text;
  }
  if (typeof raw.message_template === "string") {
    result.message_template = raw.message_template;
  }
  if (typeof raw.text1 === "string") {
    result.text1 = raw.text1;
  }
  if (typeof raw.text2 === "string") {
    result.text2 = raw.text2;
  }
  if (typeof raw.text3 === "string") {
    result.text3 = raw.text3;
  }
  const normalizeTextOptions = (value) => {
    const opts = { ...TIME_CHANGE_TEXT_OPTIONS_DEFAULT };
    if (value && typeof value === "object") {
      if (Number.isFinite(Number(value.font_size))) opts.font_size = Number(value.font_size);
      if (typeof value.font_family === "string") opts.font_family = value.font_family;
      if (Number.isFinite(Number(value.width_percent))) opts.width_percent = Number(value.width_percent);
      if (Number.isFinite(Number(value.height_percent))) opts.height_percent = Number(value.height_percent);
      if (typeof value.color === "string") opts.color = value.color;
      if (typeof value.underline === "boolean") opts.underline = value.underline;
      if (Number.isFinite(Number(value.offset_x_percent))) opts.offset_x_percent = Number(value.offset_x_percent);
      if (Number.isFinite(Number(value.offset_y_percent))) opts.offset_y_percent = Number(value.offset_y_percent);
      if (Number.isFinite(Number(value.curve))) opts.curve = Number(value.curve);
      if (Number.isFinite(Number(value.angle))) opts.angle = Number(value.angle);
    }
    return opts;
  };
  result.text1_options = normalizeTextOptions(raw.text1_options);
  result.text2_options = normalizeTextOptions(raw.text2_options);
  result.text3_options = normalizeTextOptions(raw.text3_options);
  if ("title_font_size" in raw) {
    const size = Number(raw.title_font_size);
    if (Number.isFinite(size) && size >= 8 && size <= 120) {
      result.title_font_size = size;
    }
  }
  if ("message_font_size" in raw) {
    const size = Number(raw.message_font_size);
    if (Number.isFinite(size) && size >= 8 && size <= 120) {
      result.message_font_size = size;
    }
  }
  if ("meta_font_size" in raw) {
    const size = Number(raw.meta_font_size);
    if (Number.isFinite(size) && size >= 8 && size <= 120) {
      result.meta_font_size = size;
    }
  }
  if (typeof raw.text_color === "string" && raw.text_color) {
    result.text_color = raw.text_color;
  }
  if (Array.isArray(raw.lines)) {
    result.lines = raw.lines;
  }
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
  await loadBirthdayCustomFonts();
  void loadBirthdayVariantConfig(birthdayCurrentVariant);
  bindPreviewFullscreen(birthdayPreviewStage);

  // Time change slide
  const rawTimeChange = data && data.time_change_slide ? data.time_change_slide : {};
  timeChangeSlideSettings = normalizeTimeChangeSettings(rawTimeChange);
  populateTimeChangeForm(timeChangeSlideSettings);
  renderTimeChangePreview();
  bindPreviewFullscreen(timeChangePreviewStage);
  void loadTimeChangeInfo();
  startTimeChangeAutoRefresh();
  void loadTimeChangeBackgroundList();

  // Team slide
  const rawTeam = data && data.team_slide ? data.team_slide : {};
  teamSlideSettings = normalizeTeamSlideSettings(rawTeam);
  populateTeamForm(teamSlideSettings);
  renderTeamPreview();
  bindPreviewFullscreen(teamPreviewStage);
  void loadTeamBackgroundList();
  void loadBirthdayBackgroundList();

  // Christmas slide
  const rawChristmas = data && data.christmas_slide ? data.christmas_slide : {};
  christmasSlideSettings = normalizeChristmasSettings(rawChristmas);
  populateChristmasForm(christmasSlideSettings);
  renderChristmasPreview();
  bindPreviewFullscreen(christmasPreviewStage);
  void loadChristmasInfo();
  void loadChristmasBackgroundList();

  const rawCustom = data && data.test_slide ? data.test_slide : {};
  customSlideSettings = normalizeCustomSlideSettings(rawCustom);
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

const createMediaCard = (item, globalIndex, displayNumber, mediaCount, autoCount = 0) => {
  const card = document.createElement("article");
  card.className = "media-card";
  card.dataset.id = item.id;

  const header = document.createElement("div");
  header.className = "media-card-header media-card-header--with-thumb";

  const orderColumn = document.createElement("div");
  orderColumn.className = "order-column";

  const orderButtons = document.createElement("div");
  orderButtons.className = "order-buttons";

  const upButton = document.createElement("button");
  upButton.type = "button";
  upButton.className = "secondary-button icon-button";
  upButton.textContent = "▲";
  upButton.disabled = displayNumber <= 1;
  upButton.addEventListener("click", () => moveEntryByDelta(item.id, -1));

  const downButton = document.createElement("button");
  downButton.type = "button";
  downButton.className = "secondary-button icon-button";
  downButton.textContent = "▼";
  downButton.disabled = displayNumber === mediaCount;
  downButton.addEventListener("click", () => moveEntryByDelta(item.id, 1));

  const orderInput = buildOrderPicker(displayNumber, mediaCount, (desiredDisplay) => {
    if (!Number.isFinite(desiredDisplay)) return;
    const targetIndex = autoCount + (desiredDisplay - 1);
    void moveEntryToPosition(item.id, targetIndex);
  });

  orderButtons.append(upButton, orderInput, downButton);
  orderColumn.append(orderButtons);

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

  const enabledInput = document.createElement("input");
  enabledInput.type = "checkbox";
  enabledInput.checked = Boolean(item.enabled);
  enabledInput.dataset.field = "enabled";
  const visibilitySwitch = createVisibilitySwitch(enabledInput);

  const headerActions = document.createElement("div");
  headerActions.className = "media-card-header-actions";
  headerActions.appendChild(visibilitySwitch);

  header.append(orderColumn, titleRow, headerActions);

  const kind = detectMediaKind(item);
  const controls = document.createElement("div");
  controls.className = "media-card-controls";

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

  if (controls.childElementCount > 0) {
    card.append(header, controls, grid, actions);
  } else {
    card.append(header, grid, actions);
  }
  return card;
};

const buildOrderPicker = (currentDisplayNumber, totalInGroup, onSelect) => {
  const wrapper = document.createElement("div");
  wrapper.className = "order-picker";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "secondary-button order-picker-trigger";
  trigger.textContent = String(currentDisplayNumber);
  trigger.setAttribute("aria-label", "Choisir la position");

  const label = document.createElement("span");
  label.className = "order-picker-label";
  label.textContent = "";

  let backdrop = null;

  const close = () => {
    if (backdrop && backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }
    backdrop = null;
  };

  const open = () => {
    close();
    backdrop = document.createElement("div");
    backdrop.className = "order-picker-backdrop";
    const panel = document.createElement("div");
    panel.className = "order-picker-panel";

    for (let i = 1; i <= totalInGroup; i += 1) {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "order-picker-option";
      option.textContent = String(i);
      if (i === currentDisplayNumber) option.classList.add("is-active");
      option.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelect?.(i);
        close();
      });
      panel.appendChild(option);
    }

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        close();
      }
    });
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);
  };

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    if (backdrop) {
      close();
    } else {
      open();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  wrapper.append(trigger, label);
  return wrapper;
};

const createOrderHeader = (
  entryId,
  globalIndex,
  displayNumber,
  totalCountInGroup,
  autoCount = 0,
  entryType = "auto",
) => {
  const header = document.createElement("div");
  header.className = "media-card-header";

  const orderButtons = document.createElement("div");
  orderButtons.className = "order-buttons";

  const upButton = document.createElement("button");
  upButton.type = "button";
  upButton.className = "secondary-button icon-button";
  upButton.textContent = "▲";
  upButton.disabled = displayNumber <= 1;
  upButton.addEventListener("click", () => moveEntryByDelta(entryId, -1));

  const downButton = document.createElement("button");
  downButton.type = "button";
  downButton.className = "secondary-button icon-button";
  downButton.textContent = "▼";
  downButton.disabled = displayNumber >= totalCountInGroup;
  downButton.addEventListener("click", () => moveEntryByDelta(entryId, 1));

  const orderInput = buildOrderPicker(displayNumber, totalCountInGroup, (desiredDisplay) => {
    if (!Number.isFinite(desiredDisplay)) return;
    const targetIndex =
      entryType === "media" ? autoCount + (desiredDisplay - 1) : desiredDisplay - 1;
    void moveEntryToPosition(entryId, targetIndex);
  });

  orderButtons.append(upButton, orderInput, downButton);
  header.append(orderButtons);
  return header;
};

const getAutoAvailability = (type) => {
  const raw = autoSlideDisplayableMap?.[type];
  if (raw && typeof raw === "object") {
    const displayable =
      typeof raw.displayable === "boolean" ? raw.displayable : undefined;
    const nextDateLabel =
      typeof raw.nextDateLabel === "string" && raw.nextDateLabel.trim()
        ? raw.nextDateLabel.trim()
        : null;
    return { displayable, nextDateLabel };
  }
  if (typeof raw === "boolean") {
    return { displayable: raw, nextDateLabel: null };
  }
  return { displayable: undefined, nextDateLabel: null };
};

const applyAutoAvailability = (card, type) => {
  if (!card) return;
  const { displayable } = getAutoAvailability(type);
  if (displayable === false) {
    card.classList.add("is-unavailable");
  }
};

const createTeamSlideCard = (globalIndex, displayNumber, autoCount, totalAuto) => {
  const card = document.createElement("article");
  card.className = "media-card team-slide-card-special auto-slide-card";
  card.dataset.id = TEAM_SLIDE_CARD_ID;
  applyAutoAvailability(card, "team");

  const header = createOrderHeader(TEAM_SLIDE_CARD_ID, globalIndex, displayNumber, totalAuto, autoCount, "auto");

  const body = document.createElement("div");
  body.className = "media-card-body";
  const title = document.createElement("h3");
  title.textContent = "Diapositive « Notre Équipe »";
  const status = document.createElement("p");
  status.className = "field-hint";
  const { displayable, nextDateLabel } = getAutoAvailability("team");
  status.textContent =
    displayable === false
      ? nextDateLabel
        ? `Activée (Prochain affichage dès le ${nextDateLabel})`
        : "Activée (pas encore affichable)"
      : "Activée";
  body.append(title, status);

  card.append(header, body);
  return card;
};

const createBirthdaySlideCard = (globalIndex, displayNumber, autoCount, totalAuto) => {
  const card = document.createElement("article");
  card.className = "media-card birthday-slide-card auto-slide-card";
  card.dataset.id = BIRTHDAY_SLIDE_CARD_ID;
  applyAutoAvailability(card, "birthday");

  const header = createOrderHeader(BIRTHDAY_SLIDE_CARD_ID, globalIndex, displayNumber, totalAuto, autoCount, "auto");

  const body = document.createElement("div");
  body.className = "media-card-body";
  const title = document.createElement("h3");
  title.textContent = "Diapositive « Anniversaire »";
  const status = document.createElement("p");
  status.className = "field-hint";
  const { displayable, nextDateLabel } = getAutoAvailability("birthday");
  status.textContent =
    birthdaySlideSettings && birthdaySlideSettings.enabled
      ? displayable === false
        ? nextDateLabel
          ? `Activée (Prochain affichage dès le ${nextDateLabel})`
          : "Activée (pas encore affichable)"
        : "Activée"
      : "Désactivée";
  body.append(title, status);

  card.append(header, body);
  return card;
};

const createTimeChangeSlideCard = (globalIndex, displayNumber, autoCount, totalAuto) => {
  const card = document.createElement("article");
  card.className = "media-card time-change-slide-card auto-slide-card";
  card.dataset.id = TIME_CHANGE_SLIDE_CARD_ID;
  applyAutoAvailability(card, "time-change");

  const header = createOrderHeader(TIME_CHANGE_SLIDE_CARD_ID, globalIndex, displayNumber, totalAuto, autoCount, "auto");

  const body = document.createElement("div");
  body.className = "media-card-body";
  const title = document.createElement("h3");
  title.textContent = "Diapositive « Changement d'heure »";
  const status = document.createElement("p");
  status.className = "field-hint";
  status.textContent =
    timeChangeSlideSettings && timeChangeSlideSettings.enabled
      ? (() => {
          const { displayable, nextDateLabel } = getAutoAvailability("time-change");
          if (displayable === false) {
            return nextDateLabel
              ? `Activée (Prochain affichage dès le ${nextDateLabel})`
              : "Activée (pas encore affichable)";
          }
          return "Activée";
        })()
      : "Désactivée";
  body.append(title, status);

  card.append(header, body);
  return card;
};

const createChristmasSlideCard = (globalIndex, displayNumber, autoCount, totalAuto) => {
  const card = document.createElement("article");
  card.className = "media-card christmas-slide-card auto-slide-card";
  card.dataset.id = CHRISTMAS_SLIDE_CARD_ID;
  applyAutoAvailability(card, "christmas");

  const header = createOrderHeader(CHRISTMAS_SLIDE_CARD_ID, globalIndex, displayNumber, totalAuto, autoCount, "auto");

  const body = document.createElement("div");
  body.className = "media-card-body";
  const title = document.createElement("h3");
  title.textContent = "Diapositive « Noël »";
  const status = document.createElement("p");
  status.className = "field-hint";
  status.textContent =
    christmasSlideSettings && christmasSlideSettings.enabled
      ? (() => {
          const { displayable, nextDateLabel } = getAutoAvailability("christmas");
          if (displayable === false) {
            return nextDateLabel
              ? `Activée (Prochain affichage dès le ${nextDateLabel})`
              : "Activée (pas encore affichable)";
          }
          return "Activée";
        })()
      : "Désactivée";
  body.append(title, status);

  card.append(header, body);
  return card;
};

const createCustomSlideCard = (slide, entryId, globalIndex, displayNumber, autoCount, totalAuto) => {
  const card = document.createElement("article");
  card.className = "media-card custom-slide-card auto-slide-card";
  card.dataset.id = entryId;

  const availabilityKey = slide?.id ? buildCustomAvailabilityKey(slide.id) : "custom";
  applyAutoAvailability(card, availabilityKey);

  const header = createOrderHeader(entryId, globalIndex, displayNumber, totalAuto, autoCount, "auto");

  const body = document.createElement("div");
  body.className = "media-card-body";
  const title = document.createElement("h3");
  const slideName =
    (slide?.meta && slide.meta.name) || slide?.name || "Diapo personnalisée";
  title.textContent = `Diapositive « ${slideName} »`;
  const status = document.createElement("p");
  status.className = "field-hint";
  const { displayable } = getAutoAvailability(availabilityKey);
  status.textContent =
    slide && slide.enabled
      ? displayable === false
        ? "Activée (pas encore affichable)"
        : "Activée"
      : "Désactivée";
  body.append(title, status);

  card.append(header, body);
  return card;
};

const AUTO_ENTRY_PRIORITY = ["team", "birthday", "time-change", "christmas", "custom"];

const getAutoEntries = () => {
  const sources = [
    { type: "team", id: TEAM_SLIDE_CARD_ID, settings: teamSlideSettings },
    { type: "birthday", id: BIRTHDAY_SLIDE_CARD_ID, settings: birthdaySlideSettings },
    { type: "time-change", id: TIME_CHANGE_SLIDE_CARD_ID, settings: timeChangeSlideSettings },
    { type: "christmas", id: CHRISTMAS_SLIDE_CARD_ID, settings: christmasSlideSettings },
  ];

  const customSources = buildArray(customSlides).map((slide) => ({
    type: "custom",
    id: buildCustomCardId(slide.id),
    slideId: slide.id,
    settings: slide,
  }));

  return [...sources, ...customSources]
    .filter((src) => src.settings?.enabled)
    .map((src) => {
      const rawIndex = Number.parseInt(src.settings.order_index, 10);
      const orderIndex =
        Number.isFinite(rawIndex) && rawIndex >= 0 ? rawIndex : Number.POSITIVE_INFINITY;
      const rawPriority = AUTO_ENTRY_PRIORITY.indexOf(src.type);
      const priority = rawPriority === -1 ? AUTO_ENTRY_PRIORITY.length : rawPriority;
      return { type: src.type, id: src.id, slideId: src.slideId || null, orderIndex, priority };
    })
    .sort((a, b) => {
      if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.type === "custom" && b.type === "custom") {
        return String(a.slideId || "").localeCompare(String(b.slideId || ""));
      }
      return 0;
    })
    .map(({ type, id, slideId }) => ({ type, id, slideId }));
};

const buildMediaRenderList = () => {
  const auto = getAutoEntries();
  const media = mediaItems.map((item) => ({ type: "media", id: item.id, item }));
  return [...auto, ...media];
};

const renderMedia = () => {
  if (!mediaList) return;
  mediaList.innerHTML = "";
  const renderList = buildMediaRenderList();
  const autoEntries = getAutoEntries();
  const autoCount = autoEntries.length;
  const mediaCount = mediaItems.length;
  let autoDisplay = 0;
  let mediaDisplay = 0;
  if (!renderList.length) {
    renderEmptyState();
    return;
  }
  const autoContainer = document.createElement("div");
  autoContainer.className = "media-auto-group";
  if (autoCount > 0) {
    const autoTitle = document.createElement("p");
    autoTitle.className = "media-auto-group-title";
    autoTitle.textContent = "Diapositives automatiques";
    autoContainer.append(autoTitle);
  }

  renderList.forEach((entry, index) => {
    if (entry.type === "team") {
      autoDisplay += 1;
      autoContainer.appendChild(
        createTeamSlideCard(index, autoDisplay, autoCount, autoCount),
      );
    } else if (entry.type === "birthday") {
      autoDisplay += 1;
      autoContainer.appendChild(
        createBirthdaySlideCard(index, autoDisplay, autoCount, autoCount),
      );
    } else if (entry.type === "time-change") {
      autoDisplay += 1;
      autoContainer.appendChild(
        createTimeChangeSlideCard(index, autoDisplay, autoCount, autoCount),
      );
    } else if (entry.type === "christmas") {
      autoDisplay += 1;
      autoContainer.appendChild(
        createChristmasSlideCard(index, autoDisplay, autoCount, autoCount),
      );
    } else if (entry.type === "custom") {
      autoDisplay += 1;
      autoContainer.appendChild(
        createCustomSlideCard(
          (Array.isArray(customSlides)
            ? customSlides.find((slide) => slide && buildCustomCardId(slide.id) === entry.id) ||
              customSlides.find((slide) => slide && slide.id === entry.slideId)
            : null) || null,
          entry.id,
          index,
          autoDisplay,
          autoCount,
          autoCount,
        ),
      );
    } else {
      mediaDisplay += 1;
      const card = createMediaCard(entry.item, index, mediaDisplay, mediaCount, autoCount);
      mediaList.appendChild(card);
    }
  });

  if (autoCount) {
    mediaList.prepend(autoContainer);
  }
};

const BIRTHDAY_WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const computeNextBirthdayDate = (birthdayStr) => {
  if (!birthdayStr) return null;
  const parts = String(birthdayStr).split("-");
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

  if (parts.length === 3) {
    return tryBuild(Number(parts[1]), Number(parts[2]));
  }

  return tryBuild(Number(parts[0]), Number(parts[1])) || tryBuild(Number(parts[1]), Number(parts[0]));
};

const computeBirthdayAnnounceDate = (targetDate, openDays) => {
  const normalized = normalizeOpenDays(openDays);
  if (!(targetDate instanceof Date) || Number.isNaN(targetDate)) {
    return targetDate;
  }
  const candidate = new Date(targetDate.getTime());
  for (let i = 0; i < 7; i += 1) {
    const key = BIRTHDAY_WEEKDAY_KEYS[candidate.getUTCDay()];
    if (normalized[key]) {
      return candidate;
    }
    candidate.setUTCDate(candidate.getUTCDate() - 1);
  }
  return targetDate;
};

const formatBirthdayDateLabelUtc = (birthdayDate) => {
  if (!(birthdayDate instanceof Date) || Number.isNaN(birthdayDate)) return "";
  try {
    return new Intl.DateTimeFormat("fr-CA", {
      timeZone: "UTC",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(birthdayDate);
  } catch (error) {
    return birthdayDate.toISOString().slice(0, 10);
  }
};

const computeBirthdayAvailabilityFromEmployees = (employeesList, settings) => {
  const daysBeforeRaw = Number(settings?.days_before);
  const daysBefore = Number.isFinite(daysBeforeRaw)
    ? clamp(daysBeforeRaw, 0, 365)
    : DEFAULT_BIRTHDAY_SLIDE_SETTINGS.days_before;

  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayMs = 24 * 60 * 60 * 1000;

  let anyDisplayable = false;
  let earliestDisplay = null;

  const employees = Array.isArray(employeesList) ? employeesList : [];
  employees.forEach((emp) => {
    const next = computeNextBirthdayDate(emp?.birthday);
    if (!next) return;
    const announce = computeBirthdayAnnounceDate(next, settings?.open_days);
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
      (variant === "before" && daysToBirthday <= daysBefore) ||
      (variant === "weekend" && daysToAnnounce === 0);

    if (displayAllowed) {
      anyDisplayable = true;
    }

    const beforeStart = new Date(next.getTime());
    beforeStart.setUTCDate(beforeStart.getUTCDate() - daysBefore);
    let candidateDisplay = null;
    if (daysBefore <= 0) {
      candidateDisplay = shiftedForClosure ? announce : next;
    } else if (shiftedForClosure) {
      candidateDisplay = announce < beforeStart ? announce : beforeStart;
    } else {
      candidateDisplay = beforeStart;
    }

    if (
      candidateDisplay &&
      (earliestDisplay == null || candidateDisplay.getTime() < earliestDisplay.getTime())
    ) {
      earliestDisplay = candidateDisplay;
    }
  });

  return {
    displayable: anyDisplayable,
    nextDateLabel: earliestDisplay ? formatBirthdayDateLabelUtc(earliestDisplay) : null,
  };
};

const loadAutoSlideAvailability = async () => {
  if (!mediaList) return;

  const displayable = {
    team: { displayable: true, nextDateLabel: null },
    birthday: { displayable: true, nextDateLabel: null },
    "time-change": { displayable: true, nextDateLabel: null },
    christmas: { displayable: true, nextDateLabel: null },
  };

  const tasks = [];
  let fetchedCustomSlides = [];
  tasks.push(
    fetchJSON("api/custom-slides")
      .then((data) => {
        fetchedCustomSlides = Array.isArray(data?.items) ? data.items : [];
      })
      .catch(() => {
        fetchedCustomSlides = [];
      }),
  );

  if (birthdaySlideSettings?.enabled || teamSlideSettings?.enabled) {
    tasks.push(
      fetchJSON("api/employees")
        .then((data) => {
          const employees = data && Array.isArray(data.employees) ? data.employees : [];
          if (teamSlideSettings?.enabled) {
            displayable.team.displayable = employees.length > 0;
          }
          if (birthdaySlideSettings?.enabled) {
            const availability = computeBirthdayAvailabilityFromEmployees(employees, birthdaySlideSettings);
            displayable.birthday.displayable = availability.displayable;
            displayable.birthday.nextDateLabel = availability.nextDateLabel;
          }
        })
        .catch(() => {
          if (teamSlideSettings?.enabled) {
            displayable.team.displayable = false;
          }
          if (birthdaySlideSettings?.enabled) {
            displayable.birthday.displayable = false;
            displayable.birthday.nextDateLabel = null;
          }
        }),
    );
  }

  if (timeChangeSlideSettings?.enabled) {
    const params = new URLSearchParams();
    if (Number.isFinite(Number(timeChangeSlideSettings.days_before))) {
      params.set("days_before", timeChangeSlideSettings.days_before);
    }
    const suffix = params.toString();
    tasks.push(
      fetchJSON(`api/time-change-slide/next${suffix ? `?${suffix}` : ""}`)
        .then((data) => {
          if (data && data.change) {
            if (typeof data.within_window === "boolean") {
              displayable["time-change"].displayable = data.within_window;
            }
            if (typeof data.change.date_label === "string") {
              displayable["time-change"].nextDateLabel = data.change.date_label;
            }
          }
        })
        .catch(() => {}),
    );
  }

  if (christmasSlideSettings?.enabled) {
    const params = new URLSearchParams();
    if (Number.isFinite(Number(christmasSlideSettings.days_before))) {
      params.set("days_before", christmasSlideSettings.days_before);
    }
    const suffix = params.toString();
    tasks.push(
      fetchJSON(`api/christmas-slide/next${suffix ? `?${suffix}` : ""}`)
        .then((data) => {
          if (data && data.christmas) {
            if (typeof data.within_window === "boolean") {
              displayable["christmas"].displayable = data.within_window;
            }
            if (typeof data.christmas.date_label === "string") {
              displayable["christmas"].nextDateLabel = data.christmas.date_label;
            }
          }
        })
        .catch(() => {}),
    );
  }

  if (tasks.length) {
    await Promise.all(tasks);
  }

  customSlides = fetchedCustomSlides;
  fetchedCustomSlides.forEach((slide) => {
    if (!slide?.enabled || !slide.id) {
      return;
    }
    const key = buildCustomAvailabilityKey(slide.id);
    displayable[key] = {
      displayable: Boolean(slide.has_background && slide.has_texts),
      nextDateLabel: null,
    };
  });

  autoSlideDisplayableMap = displayable;
  renderMedia();
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

const persistTimeChangeOrderIndex = async (orderIndex) => {
  const patch = { time_change_slide: { order_index: orderIndex } };
  const data = await fetchJSON("api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  timeChangeSlideSettings = normalizeTimeChangeSettings(
    data.time_change_slide || patch.time_change_slide,
  );
};

const persistChristmasOrderIndex = async (orderIndex) => {
  const patch = { christmas_slide: { order_index: orderIndex } };
  const data = await fetchJSON("api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  christmasSlideSettings = normalizeChristmasSettings(
    data.christmas_slide || patch.christmas_slide,
  );
};

const persistCustomSlideOrderIndex = async (slideId, orderIndex) => {
  if (!slideId) return;
  const data = await fetchJSON(
    `api/custom-slides/${encodeURIComponent(slideId)}/settings`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_index: orderIndex }),
    },
  );

  if (Array.isArray(customSlides)) {
    const idx = customSlides.findIndex((slide) => slide && slide.id === slideId);
    if (idx !== -1) {
      const existing = customSlides[idx] || {};
      customSlides[idx] = {
        ...existing,
        ...(data || {}),
        order_index: data?.order_index ?? orderIndex,
      };
    }
  }
};

const moveEntryToPosition = async (id, targetGlobalIndex) => {
  const autoEntries = getAutoEntries();
  const autoCount = autoEntries.length;
  const mediaEntries = buildArray(mediaItems);
  const totalCount = autoCount + mediaEntries.length;
  if (totalCount === 0) return;

  // Déplacement des auto-slides uniquement entre elles
  const autoIndex = autoEntries.findIndex((entry) => entry.id === id);
  if (autoIndex !== -1) {
    const targetAutoIndex = clamp(targetGlobalIndex, 0, Math.max(autoCount - 1, 0));
    if (targetAutoIndex === autoIndex) return;
    const [entry] = autoEntries.splice(autoIndex, 1);
    autoEntries.splice(targetAutoIndex, 0, entry);

    // Mettre à jour les order_index et persister
    const customOrderTasks = [];
    autoEntries.forEach((entry, position) => {
      if (entry.type === "team" && teamSlideSettings) {
        teamSlideSettings = { ...(teamSlideSettings || DEFAULT_TEAM_SLIDE_SETTINGS), order_index: position };
      }
      if (entry.type === "birthday" && birthdaySlideSettings) {
        birthdaySlideSettings = { ...(birthdaySlideSettings || DEFAULT_BIRTHDAY_SLIDE_SETTINGS), order_index: position };
      }
      if (entry.type === "time-change" && timeChangeSlideSettings) {
        timeChangeSlideSettings = { ...(timeChangeSlideSettings || DEFAULT_TIME_CHANGE_SETTINGS), order_index: position };
      }
      if (entry.type === "christmas" && christmasSlideSettings) {
        christmasSlideSettings = { ...(christmasSlideSettings || DEFAULT_CHRISTMAS_SETTINGS), order_index: position };
      }
      if (entry.type === "custom") {
        const slideId = entry.slideId;
        if (slideId && Array.isArray(customSlides)) {
          const idx = customSlides.findIndex((slide) => slide && slide.id === slideId);
          if (idx !== -1) {
            customSlides[idx] = { ...customSlides[idx], order_index: position };
          }
          customOrderTasks.push(persistCustomSlideOrderIndex(slideId, position));
        }
      }
    });

    renderMedia();

    try {
      const tasks = [...customOrderTasks];
      if (teamSlideSettings) tasks.push(persistTeamOrderIndex(teamSlideSettings.order_index));
      if (birthdaySlideSettings) tasks.push(persistBirthdayOrderIndex(birthdaySlideSettings.order_index));
      if (timeChangeSlideSettings) tasks.push(persistTimeChangeOrderIndex(timeChangeSlideSettings.order_index));
      if (christmasSlideSettings) tasks.push(persistChristmasOrderIndex(christmasSlideSettings.order_index));
      if (tasks.length) {
        await Promise.all(tasks);
      }
    } catch (error) {
      console.error("Erreur lors du réordonnancement des diapositives automatiques:", error);
    } finally {
      await loadMedia();
    }
    return;
  }

  // Déplacement des médias standards
  const mediaIndex = mediaEntries.findIndex((entry) => entry.id === id);
  if (mediaIndex !== -1) {
    const targetMediaIndex = clamp(targetGlobalIndex - autoCount, 0, Math.max(mediaEntries.length - 1, 0));
    if (targetMediaIndex === mediaIndex) return;
    const previousOrder = mediaItems.map((m) => m.id).join("|");

    const entries = mediaEntries.slice();
    const [entry] = entries.splice(mediaIndex, 1);
    entries.splice(targetMediaIndex, 0, entry);
    mediaItems = entries;

    renderMedia();
    try {
      const newOrderSignature = mediaItems.map((m) => m.id).join("|");
      if (previousOrder !== newOrderSignature) {
        await sendOrderUpdate();
      }
    } catch (error) {
      console.error("Erreur lors du réordonnancement des médias:", error);
    } finally {
      await loadMedia();
    }
  }
};

const moveEntryByDelta = (id, delta) => {
  const autoEntries = getAutoEntries();
  const autoIndex = autoEntries.findIndex((entry) => entry.id === id);
  if (autoIndex !== -1) {
    const newPos = clamp(autoIndex + delta, 0, Math.max(0, autoEntries.length - 1));
    void moveEntryToPosition(id, newPos);
    return;
  }

  const mediaIndex = mediaItems.findIndex((entry) => entry.id === id);
  if (mediaIndex !== -1) {
    const newPos = clamp(mediaIndex + delta, 0, Math.max(0, mediaItems.length - 1));
    const targetIndex = getAutoEntries().length + newPos;
    void moveEntryToPosition(id, targetIndex);
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
  if (birthdaySectionRoot) {
    birthdaySectionRoot.dataset.variant = variant;
  }
  if (birthdayOpeningBlock) {
    const visible = variant === "weekend";
    birthdayOpeningBlock.hidden = !visible;
    birthdayOpeningBlock.setAttribute("aria-hidden", visible ? "false" : "true");
    if (birthdayOpeningBody && birthdayOpeningToggle) {
      const isCollapsed = birthdayOpeningBody.classList.contains("collapsed");
      birthdayOpeningToggle.setAttribute("aria-expanded", (!visible || isCollapsed) ? "false" : "true");
    }
  }
  if (birthdayCountdownBlock) {
    const visible = variant === "before";
    birthdayCountdownBlock.hidden = !visible;
    birthdayCountdownBlock.setAttribute("aria-hidden", visible ? "false" : "true");
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

const getBirthdayTextBlocks = () =>
  Array.from(birthdayTextList?.querySelectorAll(".birthday-text-block") || []);

const getVisibleBirthdayTextBlocks = () => getBirthdayTextBlocks();

const getBirthdayTextInputs = (block) => {
  if (!block) return {};
  return {
    textarea: block.querySelector('[data-role="text"]'),
    size: block.querySelector('[data-role="size"]'),
    color: block.querySelector('[data-role="color"]'),
    colorChip: block.querySelector('[data-role="color-chip"]'),
    colorSwatch: block.querySelector('[data-role="color-swatch"]'),
    colorValue: block.querySelector('[data-role="color-value"]'),
    font: block.querySelector('[data-role="font"]'),
    fontSelect: block.querySelector('[data-role="font-select"]'),
    underline: block.querySelector('[data-role="underline"]'),
    width: block.querySelector('[data-role="width"]'),
    height: block.querySelector('[data-role="height"]'),
    offsetX: block.querySelector('[data-role="offset-x"]'),
    offsetY: block.querySelector('[data-role="offset-y"]'),
    curve: block.querySelector('[data-role="curve"]'),
    angle: block.querySelector('[data-role="angle"]'),
    optionsPanel: block.querySelector('[data-role="options-panel"]'),
    toggle: block.querySelector(".text-options-toggle"),
    remove: block.querySelector(".birthday-text-remove"),
    label: block.querySelector(".birthday-text-label"),
    labelSize: block.querySelector('[data-role="label-size"]'),
    labelColor: block.querySelector('[data-role="label-color"]'),
    labelFont: block.querySelector('[data-role="label-font"]'),
    labelUnderline: block.querySelector('[data-role="label-underline"]'),
    labelWidth: block.querySelector('[data-role="label-width"]'),
    labelHeight: block.querySelector('[data-role="label-height"]'),
    labelOffsetX: block.querySelector('[data-role="label-offset-x"]'),
    labelOffsetY: block.querySelector('[data-role="label-offset-y"]'),
    labelCurve: block.querySelector('[data-role="label-curve"]'),
    labelAngle: block.querySelector('[data-role="label-angle"]'),
  };
};

const setBirthdayTextBlockIds = (block, lineNumber) => {
  const inputs = getBirthdayTextInputs(block);
  const textId = `birthday-variant-text${lineNumber}`;
  if (inputs.textarea) {
    inputs.textarea.id = textId;
    inputs.textarea.placeholder = `(Texte ${lineNumber})`;
  }
  if (inputs.label) {
    inputs.label.textContent = `Texte ${lineNumber}`;
    inputs.label.htmlFor = textId;
  }
  if (inputs.optionsPanel) {
    const panelId = `birthday-text-options-${lineNumber}`;
    inputs.optionsPanel.id = panelId;
    inputs.optionsPanel.dataset.line = String(lineNumber);
    inputs.optionsPanel.setAttribute(
      "aria-hidden",
      inputs.optionsPanel.hasAttribute("hidden") ? "true" : "false",
    );
  }
  if (inputs.toggle) {
    inputs.toggle.dataset.line = String(lineNumber);
    inputs.toggle.setAttribute("aria-controls", inputs.optionsPanel?.id || "");
    const expanded =
      inputs.optionsPanel && !inputs.optionsPanel.hasAttribute("hidden") ? "true" : "false";
    inputs.toggle.setAttribute("aria-expanded", expanded);
  }

  const map = [
    ["size", inputs.labelSize, `text${lineNumber}-size`],
    ["color", inputs.labelColor, `text${lineNumber}-color`],
    ["font", inputs.labelFont, `text${lineNumber}-font`],
    ["underline", inputs.labelUnderline, `text${lineNumber}-underline`],
    ["width", inputs.labelWidth, `text${lineNumber}-width`],
    ["height", inputs.labelHeight, `text${lineNumber}-height`],
    ["offsetX", inputs.labelOffsetX, `text${lineNumber}-offset-x`],
    ["offsetY", inputs.labelOffsetY, `text${lineNumber}-offset-y`],
    ["curve", inputs.labelCurve, `text${lineNumber}-curve`],
    ["angle", inputs.labelAngle, `text${lineNumber}-angle`],
  ];
  map.forEach(([key, label, id]) => {
    const input = inputs[key];
    if (input) {
      input.id = id;
    }
    if (label) {
      label.htmlFor = id;
    }
  });
};

const resetBirthdayTextBlock = (block) => {
  const inputs = getBirthdayTextInputs(block);
  if (inputs.textarea) inputs.textarea.value = "";
  const base = BIRTHDAY_TEXT_OPTIONS_DEFAULT;
  if (inputs.size) inputs.size.value = base.font_size;
  if (inputs.color) inputs.color.value = base.color;
  if (inputs.font) inputs.font.value = "";
  if (inputs.underline) inputs.underline.checked = false;
  if (inputs.width) inputs.width.value = base.width_percent;
  if (inputs.height) inputs.height.value = base.height_percent;
  if (inputs.offsetX) inputs.offsetX.value = base.offset_x_percent;
  if (inputs.offsetY) inputs.offsetY.value = base.offset_y_percent;
  if (inputs.curve) inputs.curve.value = base.curve;
  if (inputs.angle) inputs.angle.value = base.angle;
  if (inputs.optionsPanel) {
    inputs.optionsPanel.setAttribute("hidden", "true");
    inputs.optionsPanel.setAttribute("aria-hidden", "true");
  }
  if (inputs.toggle) {
    inputs.toggle.setAttribute("aria-expanded", "false");
  }
};

const updateBirthdayTextButtons = () => {
  const blocks = getBirthdayTextBlocks();
  const count = blocks.length;
  if (birthdayTextAddButton) {
    birthdayTextAddButton.disabled = count >= BIRTHDAY_MAX_LINES;
  }
  blocks.forEach((block) => {
    const inputs = getBirthdayTextInputs(block);
    if (!inputs.remove) return;
    inputs.remove.disabled = count <= 1;
  });
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

  const filtered = lines.filter((entry) => (entry.text || "").trim().length);

  if (!filtered.length) {
    const legacy = [
      {
        text: config.text1 ?? config.title ?? "",
        options: config.text1_options,
      },
      {
        text: config.text2 ?? config.subtitle ?? "",
        options: config.text2_options,
      },
      {
        text: config.text3 ?? config.body ?? "",
        options: config.text3_options,
      },
    ]
      .map((entry) => normalizeLine(entry))
      .filter((entry) => (entry.text || "").trim().length);
    if (legacy.length) {
      return legacy.slice(0, BIRTHDAY_MAX_LINES);
    }
  }

  if (!filtered.length) {
    return [];
  }

  return filtered.slice(0, BIRTHDAY_MAX_LINES);
};

const getMergedFontChoices = () => [...BIRTHDAY_FONT_CHOICES, ...birthdayCustomFonts];

const loadBirthdayCustomFonts = async () => {
  try {
    const data = await fetchJSON("api/birthday-slide/fonts");
    const items = Array.isArray(data?.items) ? data.items : [];
    birthdayCustomFonts = items.map((item, idx) => {
      const safeName = item?.family || item?.filename || `Police ${idx + 1}`;
      const family = `CustomFont_${safeName.replace(/\s+/g, "_")}`;
      const url = item?.url;
      if (url) {
        const styleId = `custom-font-${family}`;
        if (!document.getElementById(styleId)) {
          const style = document.createElement("style");
          style.id = styleId;
          style.textContent = `
@font-face {
  font-family: "${family}";
  src: url("${url}");
  font-display: swap;
}
`;
          document.head.appendChild(style);
        }
      }
      return {
        label: safeName,
        value: `"${family}", sans-serif`,
        previewFamily: family,
      };
    });
  } catch (error) {
    console.warn("Impossible de charger les polices personnalisées Anniversaire:", error);
    birthdayCustomFonts = [];
  }
};

const normalizeBirthdayVariantConfig = (rawConfig = {}, variant = "before") => {
  const base = { ...(BIRTHDAY_FIXED_COPY[variant] || BIRTHDAY_CONFIG_DEFAULT) };
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

const renumberBirthdayTextBlocks = () => {
  getBirthdayTextBlocks().forEach((block, idx) => {
    const lineNumber = idx + 1;
    block.dataset.line = String(lineNumber);
    setBirthdayTextBlockIds(block, lineNumber);
  });
};

const syncBirthdayVariantConfigFromUI = () => {
  const variant = birthdayCurrentVariant || "before";
  if (!birthdayVariantConfigs[variant]) {
    birthdayVariantConfigs[variant] = { ...BIRTHDAY_FIXED_COPY[variant] };
  }
  const baseOpts = BIRTHDAY_TEXT_OPTIONS_DEFAULT;
  const collected = getBirthdayTextBlocks()
    .map((block) => {
      const inputs = getBirthdayTextInputs(block);
      return {
        text: inputs.textarea?.value ?? "",
        options: {
          ...baseOpts,
          font_size: Number(inputs.size?.value) || baseOpts.font_size,
          font_family: inputs.font?.value || "",
          width_percent: Number(inputs.width?.value) || baseOpts.width_percent,
          height_percent: Number(inputs.height?.value) || baseOpts.height_percent,
          color: inputs.color?.value || baseOpts.color,
          underline: Boolean(inputs.underline?.checked),
          offset_x_percent: Number(inputs.offsetX?.value) || baseOpts.offset_x_percent,
          offset_y_percent: Number(inputs.offsetY?.value) || baseOpts.offset_y_percent,
          curve: Number(inputs.curve?.value) || baseOpts.curve,
          angle: Number(inputs.angle?.value) || baseOpts.angle,
        },
      };
    })
    .filter((entry) => (entry.text || "").trim().length);
  const limited = collected.slice(0, BIRTHDAY_MAX_LINES);
  const padded = limited.concat(
    { text: "", options: baseOpts },
    { text: "", options: baseOpts },
    { text: "", options: baseOpts },
  );
  const [t1, t2, t3] = padded;
  birthdayVariantConfigs[variant] = {
    ...(birthdayVariantConfigs[variant] || {}),
    lines: limited,
    text1: t1?.text ?? "",
    text2: t2?.text ?? "",
    text3: t3?.text ?? "",
    text1_options: t1?.options || { ...baseOpts },
    text2_options: t2?.options || { ...baseOpts },
    text3_options: t3?.options || { ...baseOpts },
  };
};

const bindBirthdayTextBlock = (block) => {
  if (!block || block.dataset.bound === "1") return;
  block.dataset.bound = "1";
  const inputs = getBirthdayTextInputs(block);
  inputs.textarea?.addEventListener("input", () => {
    syncBirthdayVariantConfigFromUI();
    renderBirthdayPreview();
  });
  const optionInputs = block.querySelectorAll(".birthday-text-options input, .birthday-text-options select");
  optionInputs.forEach((input) => {
    input?.addEventListener("input", () => {
      syncBirthdayVariantConfigFromUI();
      renderBirthdayPreview();
    });
  });
  if (inputs.fontSelect) {
    inputs.fontSelect.addEventListener("change", () => {
      if (inputs.font) {
        inputs.font.value = inputs.fontSelect.value;
      }
      syncBirthdayVariantConfigFromUI();
      renderBirthdayPreview();
    });
  }
  if (inputs.colorChip && inputs.color) {
    inputs.colorChip.addEventListener("click", () => {
      inputs.color?.click();
    });
  }
  if (inputs.color) {
    inputs.color.addEventListener("input", () => {
      const val = inputs.color.value || "#ffffff";
      if (inputs.colorSwatch) inputs.colorSwatch.style.backgroundColor = val;
      if (inputs.colorValue) inputs.colorValue.textContent = val;
      syncBirthdayVariantConfigFromUI();
      renderBirthdayPreview();
    });
  }
  inputs.toggle?.addEventListener("click", () => {
    const panel = inputs.optionsPanel;
    if (!panel) return;
    const isHidden = panel.hasAttribute("hidden") || panel.getAttribute("aria-hidden") === "true";
    panel.toggleAttribute("hidden", !isHidden);
    panel.setAttribute("aria-hidden", isHidden ? "false" : "true");
    inputs.toggle.setAttribute("aria-expanded", isHidden ? "true" : "false");
  });
  inputs.remove?.addEventListener("click", () => {
    const blocks = getBirthdayTextBlocks();
    if (blocks.length <= 1) return;
    block.remove();
    renumberBirthdayTextBlocks();
    updateBirthdayTextButtons();
    syncBirthdayVariantConfigFromUI();
    renderBirthdayPreview();
  });
};

const createBirthdayTextBlock = (lineNumber, data = {}) => {
  if (!birthdayTextTemplate || !birthdayTextTemplate.content) return null;
  const clone = birthdayTextTemplate.content.firstElementChild.cloneNode(true);
  if (!clone) return null;
  clone.dataset.line = String(lineNumber);
  const inputs = getBirthdayTextInputs(clone);
  const applyFontSelectOptions = (selectedValue) => {
    if (!inputs.fontSelect) return;
    inputs.fontSelect.innerHTML = "";
    getMergedFontChoices().forEach((choice) => {
      const option = document.createElement("option");
      option.value = choice.value;
      option.textContent = choice.label;
      const familyPreview = choice.previewFamily || choice.value;
      if (familyPreview) {
        option.style.fontFamily = familyPreview;
      }
      if (choice.value === selectedValue) {
        option.selected = true;
      }
      inputs.fontSelect.appendChild(option);
    });
  };
  const normalizedOptions = {
    ...BIRTHDAY_TEXT_OPTIONS_DEFAULT,
    ...(data.options && typeof data.options === "object" ? data.options : {}),
  };
  if (inputs.textarea) inputs.textarea.value = typeof data.text === "string" ? data.text : "";
  if (inputs.size) inputs.size.value = normalizedOptions.font_size;
  if (inputs.color) inputs.color.value = normalizedOptions.color;
  if (inputs.colorSwatch) inputs.colorSwatch.style.backgroundColor = normalizedOptions.color;
  if (inputs.colorValue) inputs.colorValue.textContent = normalizedOptions.color || "#ffffff";
  if (inputs.font) inputs.font.value = normalizedOptions.font_family ?? "";
  applyFontSelectOptions(normalizedOptions.font_family ?? "");
  if (inputs.underline) inputs.underline.checked = Boolean(normalizedOptions.underline);
  if (inputs.width) inputs.width.value = normalizedOptions.width_percent;
  if (inputs.height) inputs.height.value = normalizedOptions.height_percent;
  if (inputs.offsetX) inputs.offsetX.value = normalizedOptions.offset_x_percent;
  if (inputs.offsetY) inputs.offsetY.value = normalizedOptions.offset_y_percent;
  if (inputs.curve) inputs.curve.value = normalizedOptions.curve;
  if (inputs.angle) inputs.angle.value = normalizedOptions.angle;
  setBirthdayTextBlockIds(clone, lineNumber);
  bindBirthdayTextBlock(clone);
  return clone;
};

const hydrateBirthdayTextBlocks = (config) => {
  if (!birthdayTextList) return;
  birthdayTextList.innerHTML = "";
  const lines = normalizeBirthdayLines(config);
  lines.forEach((entry, idx) => {
    const block = createBirthdayTextBlock(idx + 1, entry);
    if (block) {
      birthdayTextList.appendChild(block);
    }
  });
  renumberBirthdayTextBlocks();
  updateBirthdayTextButtons();
  syncBirthdayVariantConfigFromUI();
};

const populateBirthdayVariantForm = (config) => {
  hydrateBirthdayTextBlocks(config || {});
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
    birthdayVariantConfigs[variant] = normalizeBirthdayVariantConfig(cfg, variant);
    populateBirthdayVariantForm(birthdayVariantConfigs[variant]);
  } catch (error) {
    console.error("Erreur lors du chargement de la config anniversaire:", error);
    birthdayVariantConfigs[variant] = normalizeBirthdayVariantConfig(
      { ...(BIRTHDAY_FIXED_COPY[variant] || {}) },
      variant,
    );
    populateBirthdayVariantForm(birthdayVariantConfigs[variant]);
  }
  renderBirthdayPreview();
  renderBirthdayBackgroundOptions();
};

const saveBirthdayVariantConfig = async ({ successMessage = "Textes enregistrés.", overrides = {} } = {}) => {
  syncBirthdayVariantConfigFromUI();
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
  const textsSource = normalizeBirthdayVariantConfig(birthdayVariantConfigs[variant] || existing, variant);
  const linesPayload = normalizeBirthdayLines(textsSource);
  const payload = {
    lines: linesPayload,
    text1: linesPayload[0]?.text ?? textsSource.text1 ?? "",
    text2: linesPayload[1]?.text ?? textsSource.text2 ?? "",
    text3: linesPayload[2]?.text ?? textsSource.text3 ?? "",
    text1_options: linesPayload[0]?.options || textsSource.text1_options || { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    text2_options: linesPayload[1]?.options || textsSource.text2_options || { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
    text3_options: linesPayload[2]?.options || textsSource.text3_options || { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
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
    const merged = normalizeBirthdayVariantConfig({ ...cfg }, variant);
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
  if (birthdayDaysBeforeInput) {
    const val = Number.isFinite(Number(normalized.days_before))
      ? normalized.days_before
      : DEFAULT_BIRTHDAY_SLIDE_SETTINGS.days_before;
    birthdayDaysBeforeInput.value = String(val);
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
  if ("days_before" in overrides) {
    merged.days_before = overrides.days_before;
  } else {
    const rawVal = Number.parseInt(birthdayDaysBeforeInput?.value ?? "", 10);
    const clamped = Number.isFinite(rawVal) ? clamp(rawVal, 0, 365) : base.days_before;
    merged.days_before = clamped;
  }
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
  const isSelected = isGlobalActive || isVariantActive;
  if (isSelected) {
    wrapper.classList.add("team-background-item--active");
  }
  wrapper.tabIndex = 0;
  wrapper.setAttribute("role", "button");

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

  const selectBackground = async () => {
    setBirthdayBackgroundStatus("Mise à jour...", "info");
    const variant = birthdayCurrentVariant || "before";
    if (!birthdayVariantConfigs[variant]) {
      birthdayVariantConfigs[variant] = { ...BIRTHDAY_FIXED_COPY[variant] };
    }
    birthdayVariantConfigs[variant].background_path = item.filename;
    birthdayVariantConfigs[variant].background_mimetype = item.mimetype || null;
    birthdayVariantConfigs[variant].background_url = item.url || null;

    const patch = {
      background_path: item.filename,
      background_mimetype: item.mimetype || null,
      background_media_id: null,
    };
    try {
      await saveBirthdaySettings(patch);
      await saveBirthdayVariantConfig({
        successMessage: "Arrière-plan sélectionné.",
        overrides: {
          background_path: item.filename,
          background_mimetype: item.mimetype || null,
          background_url: item.url || null,
        },
      });
      birthdaySlideSettings = {
        ...(birthdaySlideSettings || DEFAULT_BIRTHDAY_SLIDE_SETTINGS),
        background_path: item.filename,
        background_mimetype: item.mimetype || null,
        background_url: item.url || birthdaySlideSettings?.background_url || null,
      };
      birthdayBackgroundCurrent = { type: "upload", filename: item.filename };
      renderBirthdayPreview();
      renderBirthdayBackgroundOptions();
    } catch (error) {
      console.error("Erreur lors de la sélection du fond Anniversaire:", error);
      setBirthdayBackgroundStatus("Impossible de sélectionner cet arrière-plan.", "error");
    }
  };

  const actionBar = document.createElement("div");
  actionBar.className = "birthday-background-actions";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "secondary-button danger birthday-background-delete";
  deleteButton.textContent = "Supprimer";

  wrapper.addEventListener("click", selectBackground);
  wrapper.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void selectBackground();
    }
  });
  deleteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    void deleteBirthdayBackground(item.filename);
  });

  if (isSelected) {
    const badge = document.createElement("div");
    badge.className = "background-chip birthday-background-selected";
    badge.textContent = "Arrière-plan sélectionné";
    wrapper.appendChild(badge);
  }

  actionBar.append(deleteButton);

  wrapper.append(mediaWrapper, label, actionBar);
  return wrapper;
};

const deleteBirthdayBackground = async (filename) => {
  if (!filename) return;
  const confirmed = window.confirm("Supprimer cet arrière-plan ?");
  if (!confirmed) return;
  setBirthdayBackgroundStatus("Suppression...", "info");
  try {
    const data = await fetchJSON(`api/birthday-slide/background/${encodeURIComponent(filename)}`, {
      method: "DELETE",
    });
    birthdayBackgroundOptions = birthdayBackgroundOptions.filter((opt) => opt.filename !== filename);
    const cleared = Array.isArray(data?.cleared_variants) ? data.cleared_variants : [];
    cleared.forEach((variant) => {
      if (birthdayVariantConfigs[variant]) {
        birthdayVariantConfigs[variant] = {
          ...birthdayVariantConfigs[variant],
          background_path: null,
          background_url: null,
          background_mimetype: null,
        };
      }
    });
    if (birthdayVariantConfigs[birthdayCurrentVariant]) {
      const cfg = birthdayVariantConfigs[birthdayCurrentVariant];
      if (cfg.background_path === filename) {
        birthdayVariantConfigs[birthdayCurrentVariant] = {
          ...cfg,
          background_path: null,
          background_url: null,
          background_mimetype: null,
        };
      }
    }
    if (data?.settings?.birthday_slide) {
      birthdaySlideSettings = normalizeBirthdaySlideSettings(data.settings.birthday_slide);
    }
    birthdayBackgroundCurrent = data?.current || {};
    renderBirthdayBackgroundOptions();
    renderBirthdayPreview();
    setBirthdayBackgroundStatus("Arrière-plan supprimé.", "success");
  } catch (error) {
    console.error("Erreur lors de la suppression d'un fond Anniversaire:", error);
    setBirthdayBackgroundStatus("Impossible de supprimer cet arrière-plan.", "error");
  }
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
  let linesWrapper = overlay.querySelector(".birthday-slide-lines");
  if (!linesWrapper) {
    linesWrapper = document.createElement("div");
    linesWrapper.className = "birthday-slide-lines";
    overlay.appendChild(linesWrapper);
  }

  const linesData = normalizeBirthdayLines(settings).filter((entry) => (entry.text || "").trim().length);
  const existing = Array.from(linesWrapper.children || []);
  // Ajuster le nombre de lignes affichées.
  while (linesWrapper.children.length > linesData.length) {
    linesWrapper.removeChild(linesWrapper.lastChild);
  }
  while (linesWrapper.children.length < linesData.length) {
    const idx = linesWrapper.children.length;
    const div = document.createElement("div");
    div.className = "birthday-slide-line" + (idx === 0 ? " birthday-slide-line--primary" : "");
    linesWrapper.appendChild(div);
  }

  Array.from(linesWrapper.children).forEach((line, idx) => {
    const data = linesData[idx] || { text: "", options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT } };
    const opts = data.options || BIRTHDAY_TEXT_OPTIONS_DEFAULT;
    line.className = "birthday-slide-line" + (idx === 0 ? " birthday-slide-line--primary" : "");
    line.textContent = data.text || "";
    const color = opts.color || settings.title_color;
    if (color) {
      line.style.color = color;
    }
    line.style.textAlign = "center";
    line.style.fontWeight = opts.bold ? "700" : "400";
    line.style.fontStyle = opts.italic ? "italic" : "normal";
    if (opts.font_size) {
      line.style.fontSize = `${opts.font_size}px`;
    } else if (idx === 0 && settings.title_font_size) {
      line.style.fontSize = `${settings.title_font_size}px`;
    }
    line.style.fontFamily = opts.font_family || "";
    line.style.textDecoration = opts.underline ? "underline" : "none";
    if (opts.width_percent) {
      line.style.width = `${opts.width_percent}%`;
      line.style.maxWidth = `${opts.width_percent}%`;
    } else {
      line.style.width = "auto";
      line.style.maxWidth = "none";
    }
    if (opts.height_percent) {
      line.style.height = `${opts.height_percent}%`;
      line.style.minHeight = `${opts.height_percent}%`;
    } else {
      line.style.height = "auto";
    }
    applyLineBackground(line, opts);
    line.style.whiteSpace = "pre";
    const rawX = Number.isFinite(Number(opts.offset_x_percent)) ? Number(opts.offset_x_percent) : 0;
    const rawY = Number.isFinite(Number(opts.offset_y_percent)) ? Number(opts.offset_y_percent) : 0;
    const left = clamp(50 + rawX, 0, 100);
    const top = clamp(50 - rawY, 0, 100);
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
  const variantCfg = normalizeBirthdayVariantConfig(
    birthdayVariantConfigs[birthdayCurrentVariant] || BIRTHDAY_CONFIG_DEFAULT,
    birthdayCurrentVariant || "before",
  );
  const effective = {
    ...settings,
    ...variantCfg,
    lines: normalizeBirthdayLines(variantCfg),
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

const applyTimeChangePreviewScale = () => {
  if (!timeChangePreviewStage || !timeChangePreviewCanvas) return;
  const rect = timeChangePreviewStage.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const baseW = TIME_CHANGE_PREVIEW_BASE_WIDTH;
  const baseH = TIME_CHANGE_PREVIEW_BASE_HEIGHT;
  const scale = Math.min(rect.width / baseW, rect.height / baseH);
  timeChangePreviewCanvas.style.setProperty("--time-change-preview-scale", `${scale}`);
};

// ---------------------------------------------------------------------------
// Section "Changement d'heure" – formulaire & aperçu
// ---------------------------------------------------------------------------

const setTimeChangeStatus = (message, status = "info") => {
  if (!timeChangeStatus) return;
  timeChangeStatus.textContent = message;
  timeChangeStatus.dataset.status = status;
};

const setTimeChangeBackgroundStatus = (message, status = "info") => {
  if (!timeChangeBackgroundStatus) return;
  timeChangeBackgroundStatus.textContent = message;
  timeChangeBackgroundStatus.dataset.status = status;
};

const populateTimeChangeForm = (settings) => {
  const normalized = normalizeTimeChangeSettings(settings);
  if (timeChangeEnabledInput) {
    timeChangeEnabledInput.checked = Boolean(normalized.enabled);
  }
  if (timeChangeDaysBeforeInput) {
    timeChangeDaysBeforeInput.value = String(normalized.days_before);
  }
  if (timeChangeDurationInput) {
    timeChangeDurationInput.value = String(normalized.duration);
  }
  timeChangeLines = normalizeTimeChangeLines(normalized);
  hydrateTimeChangeTextBlocks(normalized);
};

const buildTimeChangePayloadFromForm = () => {
  const payload = { ...(timeChangeSlideSettings || DEFAULT_TIME_CHANGE_SETTINGS) };
  payload.enabled = Boolean(timeChangeEnabledInput?.checked);
  const daysVal =
    Number.parseInt(timeChangeDaysBeforeInput?.value, 10) ||
    DEFAULT_TIME_CHANGE_SETTINGS.days_before;
  payload.days_before = clamp(daysVal, 0, 365);
  const durationVal =
    Number.parseFloat(timeChangeDurationInput?.value) || DEFAULT_TIME_CHANGE_SETTINGS.duration;
  payload.duration = clamp(durationVal, 1, 600);

  const lines = timeChangeLines && timeChangeLines.length ? timeChangeLines : [];
  payload.lines = lines.map((line) => ({
    text: line.text || "",
    options: { ...TIME_CHANGE_TEXT_OPTIONS_DEFAULT, ...(line.options || {}) },
  }));
  // Compatibilité : renseigner les 3 premiers pour d'anciens champs, sinon vide
  const l1 = payload.lines[0] || {};
  const l2 = payload.lines[1] || {};
  const l3 = payload.lines[2] || {};
  payload.text1 = l1.text || "";
  payload.text2 = l2.text || "";
  payload.text3 = l3.text || "";
  payload.text1_options = { ...TIME_CHANGE_TEXT_OPTIONS_DEFAULT, ...(l1.options || {}) };
  payload.text2_options = { ...TIME_CHANGE_TEXT_OPTIONS_DEFAULT, ...(l2.options || {}) };
  payload.text3_options = { ...TIME_CHANGE_TEXT_OPTIONS_DEFAULT, ...(l3.options || {}) };
  payload.title_text = "";
  payload.message_template = "";
  return payload;
};

const formatTimeChangeMessage = (template, info) => {
  const messageTemplate = template || DEFAULT_TIME_CHANGE_SETTINGS.message_template;
  const change = info || {};
  const days = Number.isFinite(Number(change.days_until))
    ? Number(change.days_until)
    : null;
  const map = {
    change_weekday: change.weekday_label || "",
    change_date: change.date_label || "",
    change_time: change.time_label || "",
    direction_verb:
      change.direction_label || (change.direction === "backward" ? "reculer" : "avancer"),
    offset_hours:
      change.offset_hours != null ? change.offset_hours : DEFAULT_TIME_CHANGE_SETTINGS.offset_hours,
    offset_from: change.offset_from || "",
    offset_to: change.offset_to || "",
    days_until: days != null ? days : "",
    days_left: days != null ? days : "",
    days_label: days === 1 ? "jour" : "jours",
    season_label: change.season_label || "",
    seasons:
      change.season === "winter"
        ? "hiver"
        : change.season === "summer"
          ? "été"
          : (change.season_label || "").replace("d'", "").replace("de ", "") || "",
  };
  let output = messageTemplate;
  Object.entries(map).forEach(([key, value]) => {
    output = output.replaceAll(`[${key}]`, value == null ? "" : String(value));
  });
  return output;
};

const describeTimeChange = (info) => {
  if (!info) return "En attente des données officielles…";
  const direction = info.direction_label || (info.direction === "backward" ? "reculer" : "avancer");
  const days = Number.isFinite(Number(info.days_until)) ? Number(info.days_until) : null;
  const daysLabel = days === 1 ? "jour" : "jours";
  const countdown =
    days != null ? `Dans ${Math.max(0, days)} ${daysLabel}` : "Compte à rebours indisponible";
  return `${info.weekday_label || ""} ${info.date_label || ""} à ${info.time_label || ""} • ${direction} d'une heure • ${countdown}`;
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
  return normalized;
};

// --- Textes Changement d'heure (UI identique à Anniversaire sans variantes)
const getTimeChangeTextBlocks = () =>
  Array.from(timeChangeTextList?.querySelectorAll(".birthday-text-block") || []);

const getTimeChangeTextInputs = (block) => {
  if (!block) return {};
  return {
    textarea: block.querySelector('[data-role="text"]'),
    size: block.querySelector('[data-role="size"]'),
    color: block.querySelector('[data-role="color"]'),
    colorChip: block.querySelector('[data-role="color-chip"]'),
    colorSwatch: block.querySelector('[data-role="color-swatch"]'),
    colorValue: block.querySelector('[data-role="color-value"]'),
    font: block.querySelector('[data-role="font"]'),
    fontSelect: block.querySelector('[data-role="font-select"]'),
    underline: block.querySelector('[data-role="underline"]'),
    width: block.querySelector('[data-role="width"]'),
    height: block.querySelector('[data-role="height"]'),
    offsetX: block.querySelector('[data-role="offset-x"]'),
    offsetY: block.querySelector('[data-role="offset-y"]'),
    curve: block.querySelector('[data-role="curve"]'),
    angle: block.querySelector('[data-role="angle"]'),
    optionsPanel: block.querySelector('[data-role="options-panel"]'),
    toggle: block.querySelector(".text-options-toggle"),
    remove: block.querySelector(".birthday-text-remove"),
    label: block.querySelector(".birthday-text-label"),
    labelSize: block.querySelector('[data-role="label-size"]'),
    labelColor: block.querySelector('[data-role="label-color"]'),
    labelFont: block.querySelector('[data-role="label-font"]'),
    labelUnderline: block.querySelector('[data-role="label-underline"]'),
    labelWidth: block.querySelector('[data-role="label-width"]'),
    labelHeight: block.querySelector('[data-role="label-height"]'),
    labelOffsetX: block.querySelector('[data-role="label-offset-x"]'),
    labelOffsetY: block.querySelector('[data-role="label-offset-y"]'),
    labelCurve: block.querySelector('[data-role="label-curve"]'),
    labelAngle: block.querySelector('[data-role="label-angle"]'),
  };
};

const setTimeChangeBlockIds = (block, lineNumber) => {
  const inputs = getTimeChangeTextInputs(block);
  const textId = `time-change-text${lineNumber}`;
  if (inputs.textarea) {
    inputs.textarea.id = textId;
    inputs.textarea.placeholder = `(Texte ${lineNumber})`;
  }
  if (inputs.label) {
    inputs.label.textContent = `Texte ${lineNumber}`;
    inputs.label.htmlFor = textId;
  }
  if (inputs.optionsPanel) {
    const panelId = `time-change-text-options-${lineNumber}`;
    inputs.optionsPanel.id = panelId;
    inputs.optionsPanel.dataset.line = String(lineNumber);
    inputs.optionsPanel.setAttribute(
      "aria-hidden",
      inputs.optionsPanel.hasAttribute("hidden") ? "true" : "false",
    );
  }
  if (inputs.toggle) {
    inputs.toggle.dataset.line = String(lineNumber);
    inputs.toggle.setAttribute("aria-controls", inputs.optionsPanel?.id || "");
    const expanded =
      inputs.optionsPanel && !inputs.optionsPanel.hasAttribute("hidden") ? "true" : "false";
    inputs.toggle.setAttribute("aria-expanded", expanded);
  }
  const map = [
    ["size", inputs.labelSize, `time-change-text${lineNumber}-size`],
    ["color", inputs.labelColor, `time-change-text${lineNumber}-color`],
    ["font", inputs.labelFont, `time-change-text${lineNumber}-font`],
    ["underline", inputs.labelUnderline, `time-change-text${lineNumber}-underline`],
    ["width", inputs.labelWidth, `time-change-text${lineNumber}-width`],
    ["height", inputs.labelHeight, `time-change-text${lineNumber}-height`],
    ["offsetX", inputs.labelOffsetX, `time-change-text${lineNumber}-offset-x`],
    ["offsetY", inputs.labelOffsetY, `time-change-text${lineNumber}-offset-y`],
    ["curve", inputs.labelCurve, `time-change-text${lineNumber}-curve`],
    ["angle", inputs.labelAngle, `time-change-text${lineNumber}-angle`],
  ];
  map.forEach(([key, label, id]) => {
    const input = inputs[key];
    if (input) input.id = id;
    if (label) label.htmlFor = id;
  });
};

const bindTimeChangeTextBlock = (block) => {
  if (!block || block.dataset.bound === "1") return;
  block.dataset.bound = "1";
  const inputs = getTimeChangeTextInputs(block);
  const sync = () => {
    syncTimeChangeLinesFromUI();
    renderTimeChangePreview();
  };
  inputs.textarea?.addEventListener("input", sync);
  block.querySelectorAll(".birthday-text-options input, .birthday-text-options select").forEach((input) => {
    input?.addEventListener("input", sync);
  });
  if (inputs.fontSelect) {
    inputs.fontSelect.addEventListener("change", () => {
      if (inputs.font) inputs.font.value = inputs.fontSelect.value;
      sync();
    });
  }
  if (inputs.colorChip && inputs.color) {
    inputs.colorChip.addEventListener("click", () => inputs.color?.click());
  }
  if (inputs.color) {
    inputs.color.addEventListener("input", () => {
      const val = inputs.color.value || "#ffffff";
      if (inputs.colorSwatch) inputs.colorSwatch.style.backgroundColor = val;
      if (inputs.colorValue) inputs.colorValue.textContent = val;
      sync();
    });
  }
  inputs.remove?.addEventListener("click", () => {
    const blocks = getTimeChangeTextBlocks();
    if (blocks.length <= 1) return;
    block.remove();
    renumberTimeChangeTextBlocks();
    syncTimeChangeLinesFromUI();
    renderTimeChangePreview();
  });
  inputs.toggle?.addEventListener("click", () => {
    const panel = inputs.optionsPanel;
    if (!panel) return;
    const isHidden = panel.hasAttribute("hidden") || panel.getAttribute("aria-hidden") === "true";
    panel.toggleAttribute("hidden", !isHidden);
    panel.setAttribute("aria-hidden", isHidden ? "false" : "true");
    inputs.toggle.setAttribute("aria-expanded", isHidden ? "true" : "false");
  });
};

const createTimeChangeTextBlock = (lineNumber, data = {}) => {
  if (!timeChangeTextTemplate || !timeChangeTextTemplate.content) return null;
  const templateRoot = timeChangeTextTemplate.content.firstElementChild;
  if (!templateRoot) return null;
  const clone = templateRoot.cloneNode(true);
  if (!clone) return null;
  clone.dataset.line = String(lineNumber);
  const inputs = getTimeChangeTextInputs(clone);
  const applyFontSelectOptions = (selectedValue) => {
    if (!inputs.fontSelect) return;
    inputs.fontSelect.innerHTML = "";
    getMergedFontChoices().forEach((choice) => {
      const option = document.createElement("option");
      option.value = choice.value;
      option.textContent = choice.label;
      const familyPreview = choice.previewFamily || choice.value;
      if (familyPreview) option.style.fontFamily = familyPreview;
      if (choice.value === selectedValue) option.selected = true;
      inputs.fontSelect.appendChild(option);
    });
  };

  const normalizedOptions = {
    ...TIME_CHANGE_TEXT_OPTIONS_DEFAULT,
    ...(data.options && typeof data.options === "object" ? data.options : {}),
  };
  if (inputs.textarea) inputs.textarea.value = typeof data.text === "string" ? data.text : "";
  if (inputs.size) inputs.size.value = normalizedOptions.font_size;
  if (inputs.color) inputs.color.value = normalizedOptions.color;
  if (inputs.colorSwatch) inputs.colorSwatch.style.backgroundColor = normalizedOptions.color;
  if (inputs.colorValue) inputs.colorValue.textContent = normalizedOptions.color || "#ffffff";
  if (inputs.font) inputs.font.value = normalizedOptions.font_family ?? "";
  applyFontSelectOptions(normalizedOptions.font_family ?? "");
  if (inputs.underline) inputs.underline.checked = Boolean(normalizedOptions.underline);
  if (inputs.width) inputs.width.value = normalizedOptions.width_percent;
  if (inputs.height) inputs.height.value = normalizedOptions.height_percent;
  if (inputs.offsetX) inputs.offsetX.value = normalizedOptions.offset_x_percent;
  if (inputs.offsetY) inputs.offsetY.value = normalizedOptions.offset_y_percent;
  if (inputs.curve) inputs.curve.value = normalizedOptions.curve;
  if (inputs.angle) inputs.angle.value = normalizedOptions.angle;
  setTimeChangeBlockIds(clone, lineNumber);
  bindTimeChangeTextBlock(clone);
  return clone;
};

const renumberTimeChangeTextBlocks = () => {
  getTimeChangeTextBlocks().forEach((block, idx) => {
    setTimeChangeBlockIds(block, idx + 1);
  });
};

const syncTimeChangeLinesFromUI = () => {
  const baseOpts = TIME_CHANGE_TEXT_OPTIONS_DEFAULT;
  const collected = getTimeChangeTextBlocks()
    .map((block) => {
      const inputs = getTimeChangeTextInputs(block);
      return {
        text: inputs.textarea?.value ?? "",
        options: {
          ...baseOpts,
          font_size: Number(inputs.size?.value) || baseOpts.font_size,
          font_family: inputs.font?.value || "",
          width_percent: Number(inputs.width?.value) || baseOpts.width_percent,
          height_percent: Number(inputs.height?.value) || baseOpts.height_percent,
          color: inputs.color?.value || baseOpts.color,
          underline: Boolean(inputs.underline?.checked),
          offset_x_percent: Number(inputs.offsetX?.value) || baseOpts.offset_x_percent,
          offset_y_percent: Number(inputs.offsetY?.value) || baseOpts.offset_y_percent,
          curve: Number(inputs.curve?.value) || baseOpts.curve,
          angle: Number(inputs.angle?.value) || baseOpts.angle,
        },
      };
    })
    .filter((entry) => (entry.text || "").trim().length);
  timeChangeLines = collected.length ? collected : [];
};

const hydrateTimeChangeTextBlocks = (config) => {
  if (!timeChangeTextList) return;
  timeChangeTextList.innerHTML = "";
  const lines = normalizeTimeChangeLines(config);
  lines.forEach((entry, idx) => {
    const block = createTimeChangeTextBlock(idx + 1, entry);
    if (block) timeChangeTextList.appendChild(block);
  });
  renumberTimeChangeTextBlocks();
  syncTimeChangeLinesFromUI();
};
const renderTimeChangePreview = () => {
  if (!timeChangePreviewStage) return;
  const settings = timeChangeSlideSettings || DEFAULT_TIME_CHANGE_SETTINGS;
  const info = timeChangeInfo;
  const bgUrl = settings.background_url;
  const mime = (settings.background_mimetype || "").toLowerCase();
  const ext = getExtensionLower(settings.background_path || bgUrl || "");
  const isVideo = mime.startsWith("video/") || ["mp4", "m4v", "mov", "webm", "mkv"].includes(ext);
  const lines = (timeChangeLines && timeChangeLines.length ? timeChangeLines : normalizeTimeChangeLines(settings)).filter(
    (entry) => (entry.text || "").trim().length,
  );

  const bgKey = `${bgUrl || "none"}|${mime}|${ext}`;

  timeChangePreviewStage.innerHTML = "";

  const canvas = document.createElement("div");
  canvas.className = "time-change-preview-canvas";
  canvas.style.setProperty("--time-change-preview-base-width", `${TIME_CHANGE_PREVIEW_BASE_WIDTH}px`);
  canvas.style.setProperty("--time-change-preview-base-height", `${TIME_CHANGE_PREVIEW_BASE_HEIGHT}px`);

  const viewport = document.createElement("div");
  viewport.className = "time-change-slide-viewport";

  const frame = document.createElement("div");
  frame.className = "time-change-slide-frame";

  const backdrop = document.createElement("div");
  backdrop.className = "time-change-slide-backdrop";
  if (bgUrl && isVideo) {
    const video = document.createElement("video");
    video.className = "time-change-slide-media time-change-slide-video";
    video.src = bgUrl;
    video.loop = true;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    void video.play().catch(() => {});
    video.addEventListener("loadedmetadata", applyTimeChangePreviewScale);
    video.addEventListener("canplay", applyTimeChangePreviewScale);
    backdrop.appendChild(video);
  } else if (bgUrl) {
    const img = document.createElement("img");
    img.className = "time-change-slide-media time-change-slide-image";
    img.src = bgUrl;
    img.alt = "Arrière-plan Changement d'heure";
    img.addEventListener("load", applyTimeChangePreviewScale);
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
  lines.forEach((line, idx) => {
    linesWrapper.appendChild(
      makeLine(line.text, line.options, idx === 0 ? "time-change-line--primary" : ""),
    );
  });

  overlay.append(linesWrapper);
  frame.append(backdrop, overlay);
  viewport.appendChild(frame);
  canvas.appendChild(viewport);
  timeChangePreviewStage.appendChild(canvas);
  timeChangePreviewCanvas = canvas;
  applyTimeChangePreviewScale();
  timeChangePreviewRenderedSource = bgKey;

  if (!timeChangePreviewResizeObserver && "ResizeObserver" in window) {
    timeChangePreviewResizeObserver = new ResizeObserver(applyTimeChangePreviewScale);
  }
  if (timeChangePreviewResizeObserver) {
    timeChangePreviewResizeObserver.observe(timeChangePreviewStage);
  }
};

const updateTimeChangeNextSubtitle = () => {
  if (!timeChangeNextSubtitle) return;
  timeChangeNextSubtitle.textContent = describeTimeChange(timeChangeInfo);
};

const loadTimeChangeInfo = async () => {
  try {
    const params = new URLSearchParams();
    if (timeChangeSlideSettings && Number.isFinite(Number(timeChangeSlideSettings.days_before))) {
      params.set("days_before", timeChangeSlideSettings.days_before);
    }
    const suffix = params.toString();
    const data = await fetchJSON(`api/time-change-slide/next${suffix ? `?${suffix}` : ""}`);
    timeChangeInfo = data && data.change ? data.change : null;
  } catch (error) {
    console.warn("Impossible de récupérer les dates officielles du changement d'heure:", error);
    timeChangeInfo = null;
  }
  updateTimeChangeNextSubtitle();
  renderTimeChangePreview();
};

const startTimeChangeAutoRefresh = () => {
  if (timeChangeInfoRefreshTimer) {
    clearInterval(timeChangeInfoRefreshTimer);
  }
  if (!timeChangeNextSubtitle) return;
  timeChangeInfoRefreshTimer = window.setInterval(() => {
    void loadTimeChangeInfo();
  }, TIME_CHANGE_INFO_REFRESH_INTERVAL_MS);
};

const loadTimeChangeUpcoming = async () => {
  if (!timeChangeUpcomingList) return;
  try {
    const data = await fetchJSON("api/time-change-slide/upcoming");
    const upcoming = Array.isArray(data.upcoming) ? data.upcoming : [];
    renderTimeChangeUpcomingList(upcoming);
  } catch (error) {
    console.warn("Impossible de récupérer les prochaines dates de changement d'heure:", error);
    timeChangeUpcomingList.innerHTML =
      '<p class="field-hint">Impossible de charger les dates.</p>';
  }
};

const renderTimeChangeUpcomingList = (upcoming) => {
  if (!timeChangeUpcomingList) return;
  timeChangeUpcomingList.innerHTML = "";
  if (!upcoming.length) {
    const empty = document.createElement("p");
    empty.className = "field-hint";
    empty.textContent = "Aucune date de changement d'heure trouvée.";
    timeChangeUpcomingList.appendChild(empty);
    return;
  }
  const table = document.createElement("table");
  table.className = "time-change-upcoming-table";
  const thead = document.createElement("thead");
  thead.innerHTML = `<tr>
    <th>Date</th>
    <th>Type</th>
    <th>Direction</th>
    <th>Dans</th>
  </tr>`;
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  upcoming.forEach((info) => {
    const row = document.createElement("tr");
    const seasonIcon = info.season === "summer" ? "☀️" : "❄️";
    const seasonText = info.season === "summer" ? "Heure d'été" : "Heure d'hiver";
    const directionText = info.direction === "forward" ? "+1h (avancer)" : "−1h (reculer)";
    const daysText =
      info.days_until === 0
        ? "Aujourd'hui"
        : info.days_until === 1
          ? "Demain"
          : `${info.days_until} jours`;
    row.innerHTML = `
      <td><strong>${info.weekday_label} ${info.date_label}</strong> à ${info.time_label}</td>
      <td>${seasonIcon} ${seasonText}</td>
      <td>${directionText}</td>
      <td>${daysText}</td>
    `;
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  timeChangeUpcomingList.appendChild(table);
};

const toggleTimeChangeUpcomingList = async () => {
  if (!timeChangeUpcomingList || !timeChangeShowUpcomingButton) return;
  const isHidden = timeChangeUpcomingList.hidden;
  if (isHidden) {
    timeChangeShowUpcomingButton.textContent = "Chargement...";
    await loadTimeChangeUpcoming();
    timeChangeUpcomingList.hidden = false;
    timeChangeShowUpcomingButton.textContent = "Masquer";
  } else {
    timeChangeUpcomingList.hidden = true;
    timeChangeShowUpcomingButton.textContent = "Voir les 4 prochaines";
  }
};

const saveTimeChangeSettings = async (patch = {}) => {
  const payload = { ...buildTimeChangePayloadFromForm(), ...patch };
  setTimeChangeStatus("Enregistrement...", "info");
  try {
    const response = await fetchJSON("api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time_change_slide: payload }),
    });
    const raw =
      response && response.time_change_slide ? response.time_change_slide : payload;
    const previous = timeChangeSlideSettings || {};
    timeChangeSlideSettings = normalizeTimeChangeSettings(raw);
    if (!timeChangeSlideSettings.background_url && previous.background_url) {
      timeChangeSlideSettings.background_url = previous.background_url;
    }
    setTimeChangeStatus("Paramètres enregistrés.", "success");
    populateTimeChangeForm(timeChangeSlideSettings);
    await loadTimeChangeInfo();
    startTimeChangeAutoRefresh();
    renderTimeChangePreview();
    renderMedia();
    return timeChangeSlideSettings;
  } catch (error) {
    console.error("Impossible d'enregistrer la diapositive Changement d'heure:", error);
    setTimeChangeStatus("Enregistrement impossible.", "error");
    throw error;
  }
};

const renderTimeChangeBackgroundItem = (item, current) => {
  const wrapper = document.createElement("div");
  wrapper.className = "team-background-item birthday-background-item";
  if (current && item.filename === current) {
    wrapper.classList.add("team-background-item--active");
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
    video.preload = "metadata";
    video.loop = true;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    mediaWrapper.appendChild(video);
  }

  const label = document.createElement("div");
  label.className = "team-background-item-label";
  label.textContent = item.label || item.filename || "Média";

  const actions = document.createElement("div");
  actions.className = "birthday-background-actions";

  const selectButton = document.createElement("button");
  selectButton.type = "button";
  selectButton.className = "secondary-button";
  selectButton.textContent = current && item.filename === current ? "Fond actif" : "Utiliser ce fond";
  selectButton.disabled = current && item.filename === current;
  selectButton.addEventListener("click", async () => {
    setTimeChangeBackgroundStatus("Mise à jour...", "info");
    try {
      await saveTimeChangeSettings({
        background_path: item.filename,
        background_mimetype: item.mimetype || null,
      });
      timeChangeSlideSettings = {
        ...(timeChangeSlideSettings || DEFAULT_TIME_CHANGE_SETTINGS),
        background_url: item.url || null,
      };
      renderTimeChangePreview();
      await loadTimeChangeBackgroundList();
      setTimeChangeBackgroundStatus("Arrière-plan sélectionné.", "success");
    } catch (error) {
      console.error("Impossible de sélectionner le fond Changement d'heure:", error);
      setTimeChangeBackgroundStatus("Échec de la sélection du fond.", "error");
    }
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "secondary-button danger";
  deleteButton.textContent = "Supprimer";
  deleteButton.addEventListener("click", async () => {
    const confirmed = window.confirm("Supprimer cet arrière-plan ?");
    if (!confirmed) return;
    try {
      await deleteTimeChangeBackground(item.filename);
      setTimeChangeBackgroundStatus("Fond supprimé.", "success");
    } catch (error) {
      console.error("Suppression du fond Changement d'heure impossible:", error);
      setTimeChangeBackgroundStatus("Échec de la suppression.", "error");
    }
  });

  actions.append(selectButton, deleteButton);
  wrapper.append(mediaWrapper, label, actions);
  return wrapper;
};

const renderTimeChangeBackgroundList = (current) => {
  if (!timeChangeBackgroundList) return;
  timeChangeBackgroundList.innerHTML = "";
  if (!timeChangeBackgroundOptions.length) {
    const empty = document.createElement("p");
    empty.className = "field-hint";
    empty.textContent = "Aucun arrière-plan disponible pour le moment.";
    timeChangeBackgroundList.appendChild(empty);
    return;
  }
  timeChangeBackgroundOptions.forEach((item) => {
    timeChangeBackgroundList.appendChild(renderTimeChangeBackgroundItem(item, current));
  });
};

const loadTimeChangeBackgroundList = async () => {
  if (!timeChangeBackgroundList) return;
  try {
    const data = await fetchJSON("api/time-change-slide/backgrounds");
    timeChangeBackgroundOptions = Array.isArray(data.items) ? data.items : [];
    renderTimeChangeBackgroundList(data.current || null);
  } catch (error) {
    console.error("Erreur lors du chargement des fonds Changement d'heure:", error);
    timeChangeBackgroundOptions = [];
    timeChangeBackgroundList.innerHTML = "";
    const message = document.createElement("p");
    message.className = "field-hint error";
    message.textContent = "Impossible de charger les arrière-plans.";
    timeChangeBackgroundList.appendChild(message);
  }
};

const uploadTimeChangeBackground = async (file = null) => {
  if (!file) {
    if (!timeChangeBackgroundInput) return;
    if (!timeChangeBackgroundInput.files || !timeChangeBackgroundInput.files.length) {
      timeChangeBackgroundInput.click();
      return;
    }
    file = timeChangeBackgroundInput.files[0];
  }
  const formData = new FormData();
  formData.append("file", file);
  setTimeChangeBackgroundStatus("Téléversement en cours...", "info");
  try {
    const response = await fetch(buildApiUrl("api/time-change-slide/background"), {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Échec du téléversement.");
    }
    const data = await response.json();
    const raw =
      data && data.settings && data.settings.time_change_slide
        ? data.settings.time_change_slide
        : timeChangeSlideSettings;
    timeChangeSlideSettings = normalizeTimeChangeSettings(raw || {});
    if (data && data.background_url) {
      timeChangeSlideSettings.background_url = data.background_url;
    }
    setTimeChangeBackgroundStatus("Arrière-plan mis à jour.", "success");
    renderTimeChangePreview();
    await loadTimeChangeBackgroundList();
  } catch (error) {
    console.error("Erreur lors de l'upload du fond Changement d'heure:", error);
    setTimeChangeBackgroundStatus("Téléversement impossible.", "error");
  }
  if (timeChangeBackgroundInput) {
    timeChangeBackgroundInput.value = "";
  }
};

const deleteTimeChangeBackground = async (filename) => {
  await fetchJSON(`api/time-change-slide/background/${filename}`, { method: "DELETE" });
  await loadTimeChangeBackgroundList();
  const currentPath = timeChangeSlideSettings?.background_path;
  if (currentPath === filename) {
    timeChangeSlideSettings = {
      ...(timeChangeSlideSettings || DEFAULT_TIME_CHANGE_SETTINGS),
      background_path: null,
      background_mimetype: null,
      background_url: null,
    };
    renderTimeChangePreview();
  }
};

// ---------------------------------------------------------------------------
// Section Noël – formulaire, textes, fonds, aperçu
// ---------------------------------------------------------------------------

const setChristmasStatus = (message, status = "info") => {
  if (!christmasStatus) return;
  christmasStatus.textContent = message;
  christmasStatus.dataset.status = status;
};

const setChristmasBackgroundStatus = (message, status = "info") => {
  if (!christmasBackgroundStatus) return;
  christmasBackgroundStatus.textContent = message;
  christmasBackgroundStatus.dataset.status = status;
};

const normalizeChristmasSettings = (raw) => {
  const base = { ...DEFAULT_CHRISTMAS_SETTINGS };
  if (!raw || typeof raw !== "object") return base;
  const result = { ...base };

  if ("enabled" in raw) result.enabled = Boolean(raw.enabled);
  if ("order_index" in raw) {
    const idx = Number.parseInt(raw.order_index, 10);
    if (Number.isFinite(idx) && idx >= 0) result.order_index = idx;
  }
  if ("duration" in raw) {
    const d = Number(raw.duration);
    if (Number.isFinite(d) && d >= 1 && d <= 600) result.duration = d;
  }
  if ("days_before" in raw) {
    const days = Number.parseInt(raw.days_before, 10);
    if (Number.isFinite(days) && days >= 0 && days <= 365) result.days_before = days;
  }
  if (typeof raw.background_path === "string") result.background_path = raw.background_path || null;
  if (typeof raw.background_url === "string" && raw.background_url) {
    result.background_url = raw.background_url;
  } else if (result.background_path) {
    result.background_url = buildApiUrl(`christmas-slide/asset/${result.background_path}`);
  }
  if (typeof raw.background_mimetype === "string") {
    result.background_mimetype = raw.background_mimetype || null;
  }
  if (typeof raw.title_text === "string" && raw.title_text.trim()) result.title_text = raw.title_text;
  if (typeof raw.text1 === "string" && raw.text1.trim()) result.text1 = raw.text1;
  if (typeof raw.text2 === "string" && raw.text2.trim()) result.text2 = raw.text2;
  if (typeof raw.text3 === "string" && raw.text3.trim()) result.text3 = raw.text3;
  const normalizeTextOptions = (value) => {
    const opts = { ...CHRISTMAS_TEXT_OPTIONS_DEFAULT };
    if (value && typeof value === "object") {
      if (Number.isFinite(Number(value.font_size))) opts.font_size = Number(value.font_size);
      if (typeof value.font_family === "string") opts.font_family = value.font_family;
      if (Number.isFinite(Number(value.width_percent))) opts.width_percent = Number(value.width_percent);
      if (Number.isFinite(Number(value.height_percent))) opts.height_percent = Number(value.height_percent);
      if (typeof value.color === "string") opts.color = value.color;
      if (typeof value.underline === "boolean") opts.underline = value.underline;
      if (Number.isFinite(Number(value.offset_x_percent))) opts.offset_x_percent = Number(value.offset_x_percent);
      if (Number.isFinite(Number(value.offset_y_percent))) opts.offset_y_percent = Number(value.offset_y_percent);
      if (Number.isFinite(Number(value.curve))) opts.curve = Number(value.curve);
      if (Number.isFinite(Number(value.angle))) opts.angle = Number(value.angle);
    }
    return opts;
  };
  result.text1_options = normalizeTextOptions(raw.text1_options);
  result.text2_options = normalizeTextOptions(raw.text2_options);
  result.text3_options = normalizeTextOptions(raw.text3_options);
  if ("title_font_size" in raw) {
    const size = Number(raw.title_font_size);
    if (Number.isFinite(size) && size >= 8 && size <= 120) result.title_font_size = size;
  }
  if (typeof raw.text_color === "string" && raw.text_color) result.text_color = raw.text_color;
  if (Array.isArray(raw.lines)) result.lines = raw.lines;
  return result;
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

  const fallbackCandidates = [
    { text: settings.text1 || DEFAULT_CHRISTMAS_SETTINGS.text1, options: settings.text1_options },
    { text: settings.text2 || DEFAULT_CHRISTMAS_SETTINGS.text2, options: settings.text2_options },
    { text: settings.text3 || DEFAULT_CHRISTMAS_SETTINGS.text3, options: settings.text3_options },
  ];
  return fallbackCandidates
    .map((entry) => ({
      text: typeof entry.text === "string" ? entry.text : "",
      options: { ...CHRISTMAS_TEXT_OPTIONS_DEFAULT, ...(entry.options || {}) },
    }))
    .filter((entry) => (entry.text || "").trim().length);
};

const populateChristmasForm = (settings) => {
  const normalized = normalizeChristmasSettings(settings);
  if (christmasEnabledInput) christmasEnabledInput.checked = Boolean(normalized.enabled);
  if (christmasDaysBeforeInput) christmasDaysBeforeInput.value = String(normalized.days_before);
  if (christmasDurationInput) christmasDurationInput.value = String(normalized.duration);
  christmasLines = normalizeChristmasLines(normalized);
  hydrateChristmasTextBlocks(normalized);
};

const buildChristmasPayloadFromForm = () => {
  const base = normalizeChristmasSettings(christmasSlideSettings || DEFAULT_CHRISTMAS_SETTINGS);
  const payload = { ...base };
  payload.enabled = Boolean(christmasEnabledInput?.checked);
  const daysVal = Number.parseInt(christmasDaysBeforeInput?.value, 10);
  payload.days_before = clamp(
    Number.isFinite(daysVal) ? daysVal : DEFAULT_CHRISTMAS_SETTINGS.days_before,
    0,
    365,
  );
  const durationVal = Number.parseFloat(christmasDurationInput?.value);
  payload.duration = clamp(
    Number.isFinite(durationVal) ? durationVal : DEFAULT_CHRISTMAS_SETTINGS.duration,
    1,
    600,
  );

  const lines = (christmasLines && christmasLines.length
    ? christmasLines
    : normalizeChristmasLines(base)
  ).map((line) => ({
    text: line.text || "",
    options: { ...CHRISTMAS_TEXT_OPTIONS_DEFAULT, ...(line.options || {}) },
  }));
  payload.lines = lines;
  const [l1 = {}, l2 = {}, l3 = {}] = lines;
  payload.text1 = l1.text || "";
  payload.text2 = l2.text || "";
  payload.text3 = l3.text || "";
  payload.text1_options = { ...CHRISTMAS_TEXT_OPTIONS_DEFAULT, ...(l1.options || {}) };
  payload.text2_options = { ...CHRISTMAS_TEXT_OPTIONS_DEFAULT, ...(l2.options || {}) };
  payload.text3_options = { ...CHRISTMAS_TEXT_OPTIONS_DEFAULT, ...(l3.options || {}) };
  payload.title_text = payload.title_text || DEFAULT_CHRISTMAS_SETTINGS.title_text;
  return payload;
};

const formatChristmasMessage = (template, info) => {
  const change = info || {};
  const days = Number.isFinite(Number(change.days_until)) ? Number(change.days_until) : null;
  const map = {
    christmas_date: change.date_label || "25 décembre",
    christmas_weekday: change.weekday_label || "",
    days_until: days != null ? days : "",
    days_left: days != null ? days : "",
    days_label: days === 1 ? "jour" : "jours",
    year: change.year || new Date().getFullYear(),
  };
  let output = template;
  Object.entries(map).forEach(([key, value]) => {
    output = output.replaceAll(`[${key}]`, value == null ? "" : String(value));
  });
  return output;
};

const describeChristmas = (info) => {
  if (!info) return "En attente des données…";
  const days = Number.isFinite(Number(info.days_until)) ? Number(info.days_until) : null;
  const daysLabel = days === 1 ? "jour" : "jours";
  if (days === 0) return `C'est Noël aujourd'hui ! 🎄`;
  if (days === 1) return `C'est demain Noël ! 🎄`;
  if (days != null && days <= 0) return `Noël est passé. Rendez-vous l'année prochaine ! 🎄`;
  const countdown = days != null ? `Dans ${days} ${daysLabel}` : "Compte à rebours indisponible";
  return `${info.date_label || "25 décembre"} • ${countdown}`;
};

const getChristmasTextBlocks = () =>
  Array.from(christmasTextList?.querySelectorAll(".birthday-text-block") || []);

const getChristmasTextInputs = (block) => {
  if (!block) return {};
  return {
    textarea: block.querySelector('[data-role="text"]'),
    size: block.querySelector('[data-role="size"]'),
    color: block.querySelector('[data-role="color"]'),
    colorChip: block.querySelector('[data-role="color-chip"]'),
    colorSwatch: block.querySelector('[data-role="color-swatch"]'),
    colorValue: block.querySelector('[data-role="color-value"]'),
    font: block.querySelector('[data-role="font"]'),
    fontSelect: block.querySelector('[data-role="font-select"]'),
    underline: block.querySelector('[data-role="underline"]'),
    width: block.querySelector('[data-role="width"]'),
    height: block.querySelector('[data-role="height"]'),
    offsetX: block.querySelector('[data-role="offset-x"]'),
    offsetY: block.querySelector('[data-role="offset-y"]'),
    curve: block.querySelector('[data-role="curve"]'),
    angle: block.querySelector('[data-role="angle"]'),
    optionsPanel: block.querySelector('[data-role="options-panel"]'),
    toggle: block.querySelector(".text-options-toggle"),
    remove: block.querySelector(".birthday-text-remove"),
    label: block.querySelector(".birthday-text-label"),
    labelSize: block.querySelector('[data-role="label-size"]'),
    labelColor: block.querySelector('[data-role="label-color"]'),
    labelFont: block.querySelector('[data-role="label-font"]'),
    labelUnderline: block.querySelector('[data-role="label-underline"]'),
    labelWidth: block.querySelector('[data-role="label-width"]'),
    labelHeight: block.querySelector('[data-role="label-height"]'),
    labelOffsetX: block.querySelector('[data-role="label-offset-x"]'),
    labelOffsetY: block.querySelector('[data-role="label-offset-y"]'),
    labelCurve: block.querySelector('[data-role="label-curve"]'),
    labelAngle: block.querySelector('[data-role="label-angle"]'),
  };
};

const setChristmasBlockIds = (block, lineNumber) => {
  const inputs = getChristmasTextInputs(block);
  const textId = `christmas-text${lineNumber}`;
  if (inputs.textarea) {
    inputs.textarea.id = textId;
    inputs.textarea.placeholder = `(Texte ${lineNumber})`;
  }
  if (inputs.label) {
    inputs.label.textContent = `Texte ${lineNumber}`;
    inputs.label.htmlFor = textId;
  }
  if (inputs.optionsPanel) {
    const panelId = `christmas-text-options-${lineNumber}`;
    inputs.optionsPanel.id = panelId;
    inputs.optionsPanel.dataset.line = String(lineNumber);
    inputs.optionsPanel.setAttribute(
      "aria-hidden",
      inputs.optionsPanel.hasAttribute("hidden") ? "true" : "false",
    );
  }
  if (inputs.toggle) {
    inputs.toggle.dataset.line = String(lineNumber);
    inputs.toggle.setAttribute("aria-controls", inputs.optionsPanel?.id || "");
    const expanded =
      inputs.optionsPanel && !inputs.optionsPanel.hasAttribute("hidden") ? "true" : "false";
    inputs.toggle.setAttribute("aria-expanded", expanded);
  }
  const map = [
    ["size", inputs.labelSize, `christmas-text${lineNumber}-size`],
    ["color", inputs.labelColor, `christmas-text${lineNumber}-color`],
    ["font", inputs.labelFont, `christmas-text${lineNumber}-font`],
    ["underline", inputs.labelUnderline, `christmas-text${lineNumber}-underline`],
    ["width", inputs.labelWidth, `christmas-text${lineNumber}-width`],
    ["height", inputs.labelHeight, `christmas-text${lineNumber}-height`],
    ["offsetX", inputs.labelOffsetX, `christmas-text${lineNumber}-offset-x`],
    ["offsetY", inputs.labelOffsetY, `christmas-text${lineNumber}-offset-y`],
    ["curve", inputs.labelCurve, `christmas-text${lineNumber}-curve`],
    ["angle", inputs.labelAngle, `christmas-text${lineNumber}-angle`],
  ];
  map.forEach(([key, label, id]) => {
    const input = inputs[key];
    if (input) input.id = id;
    if (label) label.htmlFor = id;
  });
};

const bindChristmasTextBlock = (block) => {
  if (!block || block.dataset.bound === "1") return;
  block.dataset.bound = "1";
  const inputs = getChristmasTextInputs(block);
  const sync = () => {
    syncChristmasLinesFromUI();
    renderChristmasPreview();
  };
  inputs.textarea?.addEventListener("input", sync);
  block.querySelectorAll(".birthday-text-options input, .birthday-text-options select").forEach((input) => {
    input?.addEventListener("input", sync);
  });
  if (inputs.fontSelect) {
    inputs.fontSelect.addEventListener("change", () => {
      if (inputs.font) inputs.font.value = inputs.fontSelect.value;
      sync();
    });
  }
  if (inputs.colorChip && inputs.color) {
    inputs.colorChip.addEventListener("click", () => inputs.color?.click());
  }
  if (inputs.color) {
    inputs.color.addEventListener("input", () => {
      const val = inputs.color.value || "#ffffff";
      if (inputs.colorSwatch) inputs.colorSwatch.style.backgroundColor = val;
      if (inputs.colorValue) inputs.colorValue.textContent = val;
      sync();
    });
  }
  inputs.remove?.addEventListener("click", () => {
    const blocks = getChristmasTextBlocks();
    if (blocks.length <= 1) return;
    block.remove();
    renumberChristmasTextBlocks();
    syncChristmasLinesFromUI();
    renderChristmasPreview();
  });
  inputs.toggle?.addEventListener("click", () => {
    const panel = inputs.optionsPanel;
    if (!panel) return;
    const isHidden = panel.hasAttribute("hidden") || panel.getAttribute("aria-hidden") === "true";
    panel.toggleAttribute("hidden", !isHidden);
    panel.setAttribute("aria-hidden", isHidden ? "false" : "true");
    inputs.toggle.setAttribute("aria-expanded", isHidden ? "true" : "false");
  });
};

const createChristmasTextBlock = (lineNumber, data = {}) => {
  if (!christmasTextTemplate || !christmasTextTemplate.content) return null;
  const content = christmasTextTemplate.content;
  const root = content.querySelector(".birthday-text-block") || content.firstElementChild;
  if (!root) return null;
  const clone = root.cloneNode(true);
  if (!clone) return null;
  clone.dataset.line = String(lineNumber);
  const inputs = getChristmasTextInputs(clone);
  const applyFontSelectOptions = (selectedValue) => {
    if (!inputs.fontSelect) return;
    inputs.fontSelect.innerHTML = "";
    getMergedFontChoices().forEach((choice) => {
      const option = document.createElement("option");
      option.value = choice.value;
      option.textContent = choice.label;
      const familyPreview = choice.previewFamily || choice.value;
      if (familyPreview) option.style.fontFamily = familyPreview;
      if (choice.value === selectedValue) option.selected = true;
      inputs.fontSelect.appendChild(option);
    });
  };

  const normalizedOptions = {
    ...CHRISTMAS_TEXT_OPTIONS_DEFAULT,
    ...(data.options && typeof data.options === "object" ? data.options : {}),
  };
  if (inputs.textarea) inputs.textarea.value = typeof data.text === "string" ? data.text : "";
  if (inputs.size) inputs.size.value = normalizedOptions.font_size;
  if (inputs.color) inputs.color.value = normalizedOptions.color;
  if (inputs.colorSwatch) inputs.colorSwatch.style.backgroundColor = normalizedOptions.color;
  if (inputs.colorValue) inputs.colorValue.textContent = normalizedOptions.color || "#ffffff";
  if (inputs.font) inputs.font.value = normalizedOptions.font_family ?? "";
  applyFontSelectOptions(normalizedOptions.font_family ?? "");
  if (inputs.underline) inputs.underline.checked = Boolean(normalizedOptions.underline);
  if (inputs.width) inputs.width.value = normalizedOptions.width_percent;
  if (inputs.height) inputs.height.value = normalizedOptions.height_percent;
  if (inputs.offsetX) inputs.offsetX.value = normalizedOptions.offset_x_percent;
  if (inputs.offsetY) inputs.offsetY.value = normalizedOptions.offset_y_percent;
  if (inputs.curve) inputs.curve.value = normalizedOptions.curve;
  if (inputs.angle) inputs.angle.value = normalizedOptions.angle;
  setChristmasBlockIds(clone, lineNumber);
  bindChristmasTextBlock(clone);
  return clone;
};

const renumberChristmasTextBlocks = () => {
  getChristmasTextBlocks().forEach((block, idx) => setChristmasBlockIds(block, idx + 1));
};

const syncChristmasLinesFromUI = () => {
  const baseOpts = CHRISTMAS_TEXT_OPTIONS_DEFAULT;
  const collected = getChristmasTextBlocks()
    .map((block) => {
      const inputs = getChristmasTextInputs(block);
      return {
        text: inputs.textarea?.value ?? "",
        options: {
          ...baseOpts,
          font_size: Number(inputs.size?.value) || baseOpts.font_size,
          font_family: inputs.font?.value || "",
          width_percent: Number(inputs.width?.value) || baseOpts.width_percent,
          height_percent: Number(inputs.height?.value) || baseOpts.height_percent,
          color: inputs.color?.value || baseOpts.color,
          underline: Boolean(inputs.underline?.checked),
          offset_x_percent: Number(inputs.offsetX?.value) || baseOpts.offset_x_percent,
          offset_y_percent: Number(inputs.offsetY?.value) || baseOpts.offset_y_percent,
          curve: Number(inputs.curve?.value) || baseOpts.curve,
          angle: Number(inputs.angle?.value) || baseOpts.angle,
        },
      };
    })
    .filter((entry) => (entry.text || "").trim().length);
  christmasLines = collected.length ? collected : [];
};

const hydrateChristmasTextBlocks = (config) => {
  if (!christmasTextList) return;
  christmasTextList.innerHTML = "";
  const lines = normalizeChristmasLines(config);
  lines.forEach((entry, idx) => {
    const block = createChristmasTextBlock(idx + 1, entry);
    if (block) christmasTextList.appendChild(block);
  });
  renumberChristmasTextBlocks();
  syncChristmasLinesFromUI();
};

const applyChristmasPreviewScale = () => {
  if (!christmasPreviewCanvas || !christmasPreviewStage) return;
  const stageRect = christmasPreviewStage.getBoundingClientRect();
  if (!stageRect.width || !stageRect.height) {
    window.requestAnimationFrame(() => applyChristmasPreviewScale());
    return;
  }
  const baseWidth = CHRISTMAS_PREVIEW_BASE_WIDTH;
  const baseHeight = CHRISTMAS_PREVIEW_BASE_HEIGHT;
  const scaleX = stageRect.width / baseWidth;
  const scaleY = stageRect.height / baseHeight;
  const scale = Math.min(scaleX, scaleY);
  christmasPreviewCanvas.style.removeProperty("transform");
  christmasPreviewCanvas.style.removeProperty("transform-origin");
  christmasPreviewCanvas.style.setProperty("--time-change-preview-scale", `${scale}`);
};

const renderChristmasPreview = () => {
  if (!christmasPreviewStage) return;
  const settings = normalizeChristmasSettings(christmasSlideSettings || DEFAULT_CHRISTMAS_SETTINGS);
  const info = christmasInfo;
  const bgUrl =
    settings.background_url ||
    (settings.background_path ? buildApiUrl(`christmas-slide/asset/${settings.background_path}`) : null);
  const mime = (settings.background_mimetype || "").toLowerCase();
  const ext = getExtensionLower(settings.background_path || bgUrl || "");
  const isVideo = mime.startsWith("video/") || ["mp4", "m4v", "mov", "webm", "mkv"].includes(ext);
  const lines = (christmasLines && christmasLines.length ? christmasLines : normalizeChristmasLines(settings)).filter(
    (entry) => (entry.text || "").trim().length,
  );

  const bgKey = `${bgUrl || "none"}|${mime}|${ext}`;
  christmasPreviewStage.innerHTML = "";

  const canvas = document.createElement("div");
  canvas.className = "time-change-preview-canvas";
  canvas.style.setProperty("--time-change-preview-base-width", `${CHRISTMAS_PREVIEW_BASE_WIDTH}px`);
  canvas.style.setProperty("--time-change-preview-base-height", `${CHRISTMAS_PREVIEW_BASE_HEIGHT}px`);

  const viewport = document.createElement("div");
  viewport.className = "time-change-slide-viewport";

  const frame = document.createElement("div");
  frame.className = "time-change-slide-frame";

  const backdrop = document.createElement("div");
  backdrop.className = "time-change-slide-backdrop";
  if (bgUrl && isVideo) {
    const video = document.createElement("video");
    video.className = "time-change-slide-media time-change-slide-video";
    video.src = bgUrl;
    video.preload = "metadata";
    video.loop = true;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    void video.play().catch(() => {});
    video.addEventListener("loadedmetadata", applyChristmasPreviewScale);
    video.addEventListener("canplay", applyChristmasPreviewScale);
    backdrop.appendChild(video);
  } else if (bgUrl) {
    const img = document.createElement("img");
    img.className = "time-change-slide-media time-change-slide-image";
    img.src = bgUrl;
    img.alt = "Arrière-plan Noël";
    img.addEventListener("load", applyChristmasPreviewScale);
    backdrop.appendChild(img);
  } else {
    backdrop.classList.add("time-change-slide-backdrop--fallback");
  }

  const overlay = document.createElement("div");
  overlay.className = "time-change-slide-overlay";

  const replaceTokens = (text) => formatChristmasMessage(text, info);

  const makeLine = (text, options, extraClasses = "") => {
    const line = document.createElement("div");
    line.className = `time-change-line ${extraClasses}`.trim();
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
  linesWrapper.className = "time-change-lines";
  lines.forEach((line, idx) => {
    linesWrapper.appendChild(
      makeLine(line.text, line.options, idx === 0 ? "time-change-line--primary" : ""),
    );
  });

  overlay.append(linesWrapper);
  frame.append(backdrop, overlay);
  viewport.appendChild(frame);
  canvas.appendChild(viewport);
  christmasPreviewStage.appendChild(canvas);
  christmasPreviewCanvas = canvas;
  applyChristmasPreviewScale();
  christmasPreviewRenderedSource = bgKey;

  if (!christmasPreviewResizeObserver && "ResizeObserver" in window) {
    christmasPreviewResizeObserver = new ResizeObserver(applyChristmasPreviewScale);
  }
  if (christmasPreviewResizeObserver) {
    christmasPreviewResizeObserver.observe(christmasPreviewStage);
  }
};

const updateChristmasNextSubtitle = () => {
  if (!christmasNextSubtitle) return;
  christmasNextSubtitle.textContent = describeChristmas(christmasInfo);
};

const loadChristmasInfo = async () => {
  try {
    const params = new URLSearchParams();
    if (christmasSlideSettings && Number.isFinite(Number(christmasSlideSettings.days_before))) {
      params.set("days_before", christmasSlideSettings.days_before);
    }
    const suffix = params.toString();
    const data = await fetchJSON(`api/christmas-slide/next${suffix ? `?${suffix}` : ""}`);
    christmasInfo = data && data.christmas ? data.christmas : null;
  } catch (error) {
    console.warn("Impossible de récupérer les informations de Noël:", error);
    christmasInfo = null;
  }
  updateChristmasNextSubtitle();
  renderChristmasPreview();
};

const saveChristmasSettings = async (patch = {}) => {
  const payload = { ...buildChristmasPayloadFromForm(), ...patch };
  setChristmasStatus("Enregistrement...", "info");
  try {
    const response = await fetchJSON("api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ christmas_slide: payload }),
    });
    const raw = response && response.christmas_slide ? response.christmas_slide : payload;
    const previous = christmasSlideSettings || {};
    christmasSlideSettings = normalizeChristmasSettings(raw);
    if (!christmasSlideSettings.background_url && previous.background_url) {
      christmasSlideSettings.background_url = previous.background_url;
    }
    setChristmasStatus("Paramètres enregistrés.", "success");
    populateChristmasForm(christmasSlideSettings);
    await loadChristmasInfo();
    renderChristmasPreview();
    renderMedia();
    return christmasSlideSettings;
  } catch (error) {
    console.error("Impossible d'enregistrer la diapositive Noël:", error);
    setChristmasStatus("Enregistrement impossible.", "error");
    throw error;
  }
};

const renderChristmasBackgroundItem = (item, current) => {
  const wrapper = document.createElement("div");
  wrapper.className = "team-background-item birthday-background-item";
  if (current && item.filename === current) {
    wrapper.classList.add("team-background-item--active");
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
    video.preload = "metadata";
    video.loop = true;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    mediaWrapper.appendChild(video);
  }

  const label = document.createElement("div");
  label.className = "team-background-item-label";
  label.textContent = item.label || item.filename || "Média";

  const actions = document.createElement("div");
  actions.className = "birthday-background-actions";

  const selectButton = document.createElement("button");
  selectButton.type = "button";
  selectButton.className = "secondary-button";
  selectButton.textContent = current && item.filename === current ? "Fond actif" : "Utiliser ce fond";
  selectButton.disabled = current && item.filename === current;
  selectButton.addEventListener("click", async () => {
    setChristmasBackgroundStatus("Mise à jour...", "info");
    try {
      await saveChristmasSettings({
        background_path: item.filename,
        background_mimetype: item.mimetype || null,
      });
      christmasSlideSettings = {
        ...(christmasSlideSettings || DEFAULT_CHRISTMAS_SETTINGS),
        background_path: item.filename,
        background_mimetype: item.mimetype || null,
        background_url:
          item.url ||
          buildApiUrl(item.filename ? `christmas-slide/asset/${item.filename}` : ""),
      };
      renderChristmasPreview();
      await loadChristmasBackgroundList();
      setChristmasBackgroundStatus("Arrière-plan sélectionné.", "success");
    } catch (error) {
      console.error("Impossible de sélectionner le fond Noël:", error);
      setChristmasBackgroundStatus("Échec de la sélection du fond.", "error");
    }
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "secondary-button danger";
  deleteButton.textContent = "Supprimer";
  deleteButton.addEventListener("click", async () => {
    const confirmed = window.confirm("Supprimer cet arrière-plan ?");
    if (!confirmed) return;
    try {
      await deleteChristmasBackground(item.filename);
      setChristmasBackgroundStatus("Fond supprimé.", "success");
    } catch (error) {
      console.error("Suppression du fond Noël impossible:", error);
      setChristmasBackgroundStatus("Échec de la suppression.", "error");
    }
  });

  actions.append(selectButton, deleteButton);
  wrapper.append(mediaWrapper, label, actions);
  return wrapper;
};

const renderChristmasBackgroundList = (current) => {
  if (!christmasBackgroundList) return;
  christmasBackgroundList.innerHTML = "";
  if (!christmasBackgroundOptions.length) {
    const empty = document.createElement("p");
    empty.className = "field-hint";
    empty.textContent = "Aucun arrière-plan disponible pour le moment.";
    christmasBackgroundList.appendChild(empty);
    return;
  }
  christmasBackgroundOptions.forEach((item) => {
    christmasBackgroundList.appendChild(renderChristmasBackgroundItem(item, current));
  });
};

const loadChristmasBackgroundList = async () => {
  if (!christmasBackgroundList) return;
  try {
    const data = await fetchJSON("api/christmas-slide/backgrounds");
    christmasBackgroundOptions = Array.isArray(data.items) ? data.items : [];
    if (data.current) {
      const currentItem = christmasBackgroundOptions.find((item) => item.filename === data.current);
      if (currentItem) {
        christmasSlideSettings = {
          ...(christmasSlideSettings || DEFAULT_CHRISTMAS_SETTINGS),
          background_path: currentItem.filename,
          background_mimetype: currentItem.mimetype || null,
          background_url: currentItem.url || buildApiUrl(`christmas-slide/asset/${currentItem.filename}`),
        };
      }
    }
    renderChristmasBackgroundList(data.current || null);
    renderChristmasPreview();
  } catch (error) {
    console.error("Erreur lors du chargement des fonds Noël:", error);
    christmasBackgroundOptions = [];
    christmasBackgroundList.innerHTML = "";
    const message = document.createElement("p");
    message.className = "field-hint error";
    message.textContent = "Impossible de charger les arrière-plans.";
    christmasBackgroundList.appendChild(message);
  }
};

const uploadChristmasBackground = async (file = null) => {
  if (!file) {
    if (!christmasBackgroundInput) return;
    if (!christmasBackgroundInput.files || !christmasBackgroundInput.files.length) {
      christmasBackgroundInput.click();
      return;
    }
    file = christmasBackgroundInput.files[0];
  }
  const formData = new FormData();
  formData.append("file", file);
  setChristmasBackgroundStatus("Téléversement en cours...", "info");
  try {
    const response = await fetch(buildApiUrl("api/christmas-slide/background"), {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Échec du téléversement.");
    }
    const data = await response.json();
    const raw =
      data && data.settings && data.settings.christmas_slide
        ? data.settings.christmas_slide
        : christmasSlideSettings;
    christmasSlideSettings = normalizeChristmasSettings(raw || {});
    if (data && data.background_url) {
      christmasSlideSettings.background_url = data.background_url;
    }
    setChristmasBackgroundStatus("Arrière-plan mis à jour.", "success");
    renderChristmasPreview();
    await loadChristmasBackgroundList();
  } catch (error) {
    console.error("Erreur lors de l'upload du fond Noël:", error);
    setChristmasBackgroundStatus("Téléversement impossible.", "error");
  }
  if (christmasBackgroundInput) {
    christmasBackgroundInput.value = "";
  }
};

const deleteChristmasBackground = async (filename) => {
  await fetchJSON(`api/christmas-slide/background/${filename}`, { method: "DELETE" });
  await loadChristmasBackgroundList();
  const currentPath = christmasSlideSettings?.background_path;
  if (currentPath === filename) {
    christmasSlideSettings = {
      ...(christmasSlideSettings || DEFAULT_CHRISTMAS_SETTINGS),
      background_path: null,
      background_mimetype: null,
      background_url: null,
    };
    renderChristmasPreview();
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
  if (teamTitleWidthInput) {
    teamTitleWidthInput.value = String(
      settings.title_width_percent || DEFAULT_TEAM_SLIDE_SETTINGS.title_width_percent,
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
  if (teamTitleWidthInput) {
    const val = Number(teamTitleWidthInput.value);
    if (Number.isFinite(val) && val >= 10 && val <= 100) {
      settings.title_width_percent = val;
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
  description.textContent = employee.description || "";

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
  if (!day || !month) return "";
  if (year) {
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }
  return `${pad2(month)}-${pad2(day)}`;
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
    ensureSelectHasValue(employeeBirthdayYear, y, y);
    employeeBirthdayYear.value = y || "";
    employeeBirthdayMonth.value = String(Number(m) || "");
    employeeBirthdayDay.value = String(Number(d) || "");
  } else if (parts.length === 2) {
    const [m, d] = parts;
    employeeBirthdayYear.value = "";
    employeeBirthdayMonth.value = String(Number(m) || "");
    employeeBirthdayDay.value = String(Number(d) || "");
  }
};

const parseHireDateIntoFields = (value) => {
  if (!value || !employeeHireYear || !employeeHireMonth || !employeeHireDay) return;
  const parts = value.split("-");
  if (parts.length >= 2) {
    const [y, m, d] = parts;
    ensureSelectHasValue(employeeHireYear, y, y);
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

const buildDateStringFromFields = (daySelect, monthSelect, yearSelect) => {
  const day = Number(daySelect?.value) || 0;
  const month = Number(monthSelect?.value) || 0;
  const year = Number(yearSelect?.value) || 0;
  if (!month || !day) return "";
  if (year) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const createRangeSelect = (start, end, placeholder) => {
  const select = document.createElement("select");
  if (placeholder) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = placeholder;
    select.appendChild(opt);
  }
  for (let value = start; value <= end; value += 1) {
    const opt = document.createElement("option");
    opt.value = String(value);
    opt.textContent = String(value);
    select.appendChild(opt);
  }
  return select;
};

const ensureSelectHasValue = (select, value, label) => {
  if (!select || !value) return;
  const exists = Array.from(select.options).some((opt) => opt.value === String(value));
  if (!exists) {
    const opt = document.createElement("option");
    opt.value = String(value);
    opt.textContent = label || String(value);
    select.appendChild(opt);
  }
};

const createMonthSelect = (placeholder) => {
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
  const select = document.createElement("select");
  if (placeholder) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = placeholder;
    select.appendChild(opt);
  }
  monthLabels.forEach((label, index) => {
    const opt = document.createElement("option");
    const value = index + 1;
    opt.value = String(value);
    opt.textContent = `${value} - ${label}`;
    select.appendChild(opt);
  });
  return select;
};

const formatEmployeeDateLabel = (value) => {
  if (!value || typeof value !== "string") return "";
  const parts = value.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    if (m && d) {
      const monthIndex = Number(m) - 1;
      const months = [
        "janv.",
        "févr.",
        "mars",
        "avr.",
        "mai",
        "juin",
        "juil.",
        "août",
        "sept.",
        "oct.",
        "nov.",
        "déc.",
      ];
      const monthLabel = months[monthIndex] || m;
      return `${Number(d)} ${monthLabel} ${y || ""}`.trim();
    }
  }
  if (parts.length === 2) {
    const [m, d] = parts;
    const monthIndex = Number(m) - 1;
    const months = [
      "janv.",
      "févr.",
      "mars",
      "avr.",
      "mai",
      "juin",
      "juil.",
      "août",
      "sept.",
      "oct.",
      "nov.",
      "déc.",
    ];
    const monthLabel = months[monthIndex] || m;
    return `${Number(d)} ${monthLabel}`;
  }
  return value;
};

const uploadEmployeeAvatarInline = async (employeeId, file) => {
  if (!file) return;
  const formData = new FormData();
  formData.append("file", file);
  await fetchJSON(`api/employees/${employeeId}/avatar`, {
    method: "POST",
    body: formData,
  });
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
    const birthdayLabel = formatEmployeeDateLabel(emp.birthday);
    if (birthdayLabel) {
      metaBits.push(`Anniversaire: ${birthdayLabel}`);
    }
    const hireLabel = formatEmployeeDateLabel(emp.hire_date);
    if (hireLabel) {
      metaBits.push(`Embauche: ${hireLabel}`);
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
    const editPanel = document.createElement("div");
    editPanel.className = "employee-edit-panel";
    editPanel.style.maxHeight = "0px";

    const togglePanel = (open) => {
      const willOpen = typeof open === "boolean" ? open : !editPanel.classList.contains("open");
      editPanel.classList.toggle("open", willOpen);
      editPanel.style.maxHeight = willOpen ? `${editPanel.scrollHeight}px` : "0px";
    };

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = emp.name || "";

    const roleInput = document.createElement("input");
    roleInput.type = "text";
    roleInput.value = emp.role || "";

    const descInput = document.createElement("textarea");
    descInput.rows = 3;
    descInput.value = emp.description || "";

    const bYear = createRangeSelect(1950, new Date().getFullYear(), "Année (optionnel)");
    const bMonth = createMonthSelect("Mois");
    const bDay = createRangeSelect(1, 31, "Jour");
    if (emp.birthday) {
      const parts = emp.birthday.split("-");
      if (parts.length === 3) {
        bYear.value = parts[0] || "";
        bMonth.value = String(Number(parts[1]) || "");
        bDay.value = String(Number(parts[2]) || "");
      }
      if (parts.length === 2) {
        bMonth.value = String(Number(parts[0]) || "");
        bDay.value = String(Number(parts[1]) || "");
      }
      ensureSelectHasValue(bYear, bYear.value, bYear.value);
    }

    const hYear = createRangeSelect(1950, new Date().getFullYear(), "Année");
    const hMonth = createMonthSelect("Mois");
    const hDay = createRangeSelect(1, 31, "Jour");
    if (emp.hire_date) {
      const parts = emp.hire_date.split("-");
      if (parts.length >= 2) {
        hYear.value = parts[0] || "";
        hMonth.value = String(Number(parts[1]) || "");
        if (parts[2]) hDay.value = String(Number(parts[2]) || "");
      }
      ensureSelectHasValue(hYear, hYear.value, hYear.value);
    }

    const avatarInput = document.createElement("input");
    avatarInput.type = "file";
    avatarInput.accept = "image/*";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "primary-button";
    saveBtn.textContent = "Enregistrer";

    saveBtn.addEventListener("click", async () => {
      const payload = {
        name: nameInput.value.trim(),
        role: roleInput.value.trim(),
        description: descInput.value.trim(),
        birthday: buildDateStringFromFields(bDay, bMonth, bYear),
        hire_date: buildDateStringFromFields(hDay, hMonth, hYear),
      };
      if (!payload.name) {
        alert("Le nom est requis.");
        return;
      }
      saveBtn.disabled = true;
      saveBtn.textContent = "Enregistrement...";
      try {
        const data = await fetchJSON(`api/employees/${emp.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated = data.employee;
        const avatarFile = avatarInput.files?.[0];
        if (avatarFile) {
          await uploadEmployeeAvatarInline(emp.id, avatarFile);
        }
        if (updated) {
          employees = employees.map((e) => (e.id === emp.id ? updated : e));
        }
        renderEmployeesList();
        renderTeamPreview();
      } catch (error) {
        console.error("Erreur lors de la mise à jour de l'employé:", error);
        alert("Erreur lors de la mise à jour de l'employé.");
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Enregistrer";
      }
    });

    const form = document.createElement("div");
    form.className = "employee-edit-form";
    form.append(
      createInputGroup("Nom complet", nameInput),
      createInputGroup("Poste", roleInput),
      createInputGroup("Description", descInput),
    );

    const birthdayGroup = document.createElement("div");
    birthdayGroup.className = "employee-inline-row";
    birthdayGroup.append(
      createInputGroup("Année", bYear),
      createInputGroup("Mois", bMonth),
      createInputGroup("Jour", bDay),
    );

    const hireGroup = document.createElement("div");
    hireGroup.className = "employee-inline-row";
    hireGroup.append(
      createInputGroup("Année embauche", hYear),
      createInputGroup("Mois", hMonth),
      createInputGroup("Jour", hDay),
    );

    const avatarGroup = document.createElement("div");
    avatarGroup.className = "employee-inline-row";
    avatarGroup.append(createInputGroup("Avatar", avatarInput));

    form.append(birthdayGroup, hireGroup, avatarGroup, saveBtn);
    editPanel.append(form);

    editBtn.addEventListener("click", () => togglePanel());

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

    const topRow = document.createElement("div");
    topRow.className = "employee-top";
    topRow.append(main, actions);

    li.append(topRow, editPanel);
    employeesList.appendChild(li);
  });
};

const loadEmployees = async () => {
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
      const text = `${index + 1} - ${label}`;
      if (employeeBirthdayMonth) {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = text;
        employeeBirthdayMonth.appendChild(opt);
      }
      if (employeeHireMonth) {
        const opt2 = document.createElement("option");
        opt2.value = value;
        opt2.textContent = text;
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
  const target = `${APP_BASE_URL}slideshow`;
  window.location.href = target;
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

birthdayDaysBeforeInput?.addEventListener("input", () => {
  void saveBirthdaySettings();
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

// Textes des variantes (ajout/suppression)
getBirthdayTextBlocks().forEach((block, idx) => {
  setBirthdayTextBlockIds(block, idx + 1);
  bindBirthdayTextBlock(block);
});
renumberBirthdayTextBlocks();
updateBirthdayTextButtons();

birthdayTextAddButton?.addEventListener("click", () => {
  if (!birthdayTextList) return;
  const blocks = getBirthdayTextBlocks();
  if (blocks.length >= BIRTHDAY_MAX_LINES) return;
  const nextIndex = blocks.length + 1;
  const block = createBirthdayTextBlock(nextIndex, {
    text: `(Texte ${nextIndex})`,
    options: { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT },
  });
  if (!block) return;
  birthdayTextList.appendChild(block);
  renumberBirthdayTextBlocks();
  updateBirthdayTextButtons();
  syncBirthdayVariantConfigFromUI();
  renderBirthdayPreview();
  getBirthdayTextInputs(block).textarea?.focus();
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

// Changement d'heure : interactions
timeChangeSaveButton?.addEventListener("click", () => {
  void saveTimeChangeSettings();
});

[timeChangeEnabledInput, timeChangeDaysBeforeInput, timeChangeDurationInput].forEach((input) => {
  input?.addEventListener("change", () => {
    void saveTimeChangeSettings();
  });
});

timeChangeRefreshButton?.addEventListener("click", () => {
  void loadTimeChangeInfo();
  startTimeChangeAutoRefresh();
});

timeChangeShowUpcomingButton?.addEventListener("click", () => {
  void toggleTimeChangeUpcomingList();
});

timeChangePreviewRefreshButton?.addEventListener("click", () => {
  renderTimeChangePreview();
});

timeChangeTextAddButton?.addEventListener("click", () => {
  if (!timeChangeTextList) return;
  const blocks = getTimeChangeTextBlocks();
  const nextIndex = blocks.length + 1;
  const block = createTimeChangeTextBlock(nextIndex, {
    text: `(Texte ${nextIndex})`,
    options: { ...TIME_CHANGE_TEXT_OPTIONS_DEFAULT },
  });
  if (!block) return;
  timeChangeTextList.appendChild(block);
  renumberTimeChangeTextBlocks();
  syncTimeChangeLinesFromUI();
  renderTimeChangePreview();
  getTimeChangeTextInputs(block).textarea?.focus();
});

timeChangeBackgroundUploadButton?.addEventListener("click", () => {
  void uploadTimeChangeBackground();
});

timeChangeBackgroundInput?.addEventListener("change", () => {
  void uploadTimeChangeBackground();
});

timeChangeDropZone?.addEventListener("click", (event) => {
  event.preventDefault();
  timeChangeBackgroundInput?.click();
});

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  timeChangeDropZone?.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
});

timeChangeDropZone?.addEventListener("dragenter", () => {
  timeChangeDropZone.classList.add("drag-over");
});
timeChangeDropZone?.addEventListener("dragover", () => {
  timeChangeDropZone.classList.add("drag-over");
});
timeChangeDropZone?.addEventListener("dragleave", () => {
  timeChangeDropZone.classList.remove("drag-over");
});
timeChangeDropZone?.addEventListener("drop", (event) => {
  const { files } = event.dataTransfer || {};
  timeChangeDropZone.classList.remove("drag-over");
  if (files && files.length) {
    void uploadTimeChangeBackground(files[0]);
  }
});

timeChangeBackgroundToggleButton?.addEventListener("click", () => {
  if (!timeChangeBackgroundBody) return;
  const collapsed = timeChangeBackgroundBody.classList.toggle("collapsed");
  timeChangeBackgroundToggleButton.classList.toggle("expanded", !collapsed);
  timeChangeBackgroundToggleButton.setAttribute("aria-expanded", collapsed ? "false" : "true");
});

bindPreviewFullscreen(timeChangePreviewStage);

// Noël: interactions
christmasSaveButton?.addEventListener("click", () => {
  void saveChristmasSettings();
});

[christmasEnabledInput, christmasDaysBeforeInput, christmasDurationInput].forEach((input) => {
  input?.addEventListener("change", () => {
    void saveChristmasSettings();
  });
});

christmasPreviewRefreshButton?.addEventListener("click", () => {
  renderChristmasPreview();
});

christmasTextAddButton?.addEventListener("click", () => {
  if (!christmasTextList) return;
  const blocks = getChristmasTextBlocks();
  const nextIndex = blocks.length + 1;
  const block = createChristmasTextBlock(nextIndex, {
    text: `(Texte ${nextIndex})`,
    options: { ...CHRISTMAS_TEXT_OPTIONS_DEFAULT },
  });
  if (!block) return;
  christmasTextList.appendChild(block);
  renumberChristmasTextBlocks();
  syncChristmasLinesFromUI();
  renderChristmasPreview();
  getChristmasTextInputs(block).textarea?.focus();
});

christmasBackgroundUploadButton?.addEventListener("click", () => {
  void uploadChristmasBackground();
});

christmasBackgroundInput?.addEventListener("change", () => {
  void uploadChristmasBackground();
});

christmasDropZone?.addEventListener("click", (event) => {
  event.preventDefault();
  christmasBackgroundInput?.click();
});

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  christmasDropZone?.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
});

christmasDropZone?.addEventListener("dragenter", () => {
  christmasDropZone.classList.add("drag-over");
});
christmasDropZone?.addEventListener("dragover", () => {
  christmasDropZone.classList.add("drag-over");
});
christmasDropZone?.addEventListener("dragleave", () => {
  christmasDropZone.classList.remove("drag-over");
});
christmasDropZone?.addEventListener("drop", (event) => {
  const { files } = event.dataTransfer || {};
  christmasDropZone.classList.remove("drag-over");
  if (files && files.length) {
    void uploadChristmasBackground(files[0]);
  }
});

christmasBackgroundToggleButton?.addEventListener("click", () => {
  if (!christmasBackgroundBody) return;
  const collapsed = christmasBackgroundBody.classList.toggle("collapsed");
  christmasBackgroundToggleButton.classList.toggle("expanded", !collapsed);
  christmasBackgroundToggleButton.setAttribute("aria-expanded", collapsed ? "false" : "true");
});

bindPreviewFullscreen(christmasPreviewStage);

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
  const needsOverlaySettings =
    Boolean(settingsForm) ||
    Boolean(birthdayEnabledInput) ||
    Boolean(timeChangeEnabledInput) ||
    Boolean(christmasEnabledInput) ||
    Boolean(teamEnabledInput) ||
    Boolean(teamPreviewStage) ||
    Boolean(birthdayPreviewStage) ||
    Boolean(christmasPreviewStage) ||
    Boolean(timeChangePreviewStage) ||
    Boolean(mediaList);

  const needsMedia = Boolean(mediaList);
  const needsEmployees = Boolean(employeesList || teamPreviewStage);
  const needsPowerpoint = Boolean(pptList || pptUploadForm || pptUploadButton);

  if (needsOverlaySettings) {
    await loadOverlayAndSlideSettings();
  }
  if (needsMedia) {
    await loadMedia();
    void loadAutoSlideAvailability();
  }
  if (needsEmployees) {
    await loadEmployees();
    if (employeeForm) {
      initEmployeeFormChoices();
    }
  }
  if (needsPowerpoint) {
    await loadPowerpointList();
  }
  updateQuebecTime();
  if (!quebecTimeTimer) {
    quebecTimeTimer = setInterval(updateQuebecTime, 1000);
  }
});
