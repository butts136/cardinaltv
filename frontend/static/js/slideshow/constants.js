(() => {
  const DEFAULT_OVERLAY = {
    enabled: false,
    mode: "clock",
    height_vh: 5,
    background_color: "#f0f0f0",
    text_color: "#111111",
    logo_path: "",
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
    days_before: 3,
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
    bold: false,
    italic: false,
    letter_spacing: 0,
    line_height: 1.2,
    background_color: null,
    background_opacity: 0,
    offset_x_percent: 0,
    offset_y_percent: 0,
    curve: 0,
    angle: 0,
  };

  const BIRTHDAY_MAX_LINES = 50;
  const BIRTHDAY_DEFAULT_DAYS_BEFORE = 3;

  const TIME_CHANGE_TEXT_OPTIONS_DEFAULT = { ...BIRTHDAY_TEXT_OPTIONS_DEFAULT, color: "#f8fafc" };

  const DEFAULT_TIME_CHANGE_SLIDE = {
    enabled: false,
    order_index: 0,
    duration: 12,
    background_url: null,
    background_mimetype: null,
    background_path: null,
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
  const NEWS_SLIDE_ID = "__news_slide_auto__";
  const WEATHER_SLIDE_ID = "__weather_slide_auto__";

  const DEFAULT_NEWS_SLIDE = {
    enabled: false,
    order_index: 0,
    duration: 20,
    scroll_delay: 3,
    scroll_speed: 50,
    max_items: 10,
    card_background: "#1a1a2e",
    card_text_color: "#f8fafc",
    card_time_color: "#94a3b8",
  };

  const DEFAULT_WEATHER_SLIDE = {
    enabled: false,
    order_index: 0,
    duration: 15,
    location: "Québec",
    latitude: 46.8139,
    longitude: -71.2080,
    show_temperature: true,
    show_feels_like: true,
    show_humidity: true,
    show_wind: true,
    show_forecast: true,
    forecast_days: 5,
  };

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

  window.CardinalSlideshowDefaults = {
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
  };
})();
