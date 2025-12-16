(() => {
  const defaults = window.CardinalSlideshowDefaults || {};
  const {
    BIRTHDAY_MAX_LINES,
    BIRTHDAY_TEXT_OPTIONS_DEFAULT,
    BIRTHDAY_FIXED_COPY,
    BIRTHDAY_VARIANTS = [],
  } = defaults;

  const CONFIG_REFRESH_MS = 15_000;
  const fontRegistry = new Map();
  const variantConfigs = {};
  const variantFetchedAt = {};

  const normalizeLine = (entry = {}) => ({
    text: typeof entry.text === "string" ? entry.text : "",
    options: {
      ...BIRTHDAY_TEXT_OPTIONS_DEFAULT,
      ...(entry.options && typeof entry.options === "object" ? entry.options : {}),
    },
  });

  const normalizeLines = (config = {}) => {
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

  const normalizeVariantConfig = (rawConfig = {}, variant = "before") => {
    const base = { ...(BIRTHDAY_FIXED_COPY[variant] || BIRTHDAY_FIXED_COPY.before) };
    const merged = { ...base, ...(rawConfig || {}) };
    const lines = normalizeLines(merged);
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

  const isVariantStale = (variant, now = Date.now()) => {
    const cached = variantConfigs[variant];
    if (!cached) return true;
    const fetchedAt = variantFetchedAt[variant] || 0;
    return now - fetchedAt > CONFIG_REFRESH_MS;
  };

  const loadCustomFonts = async (fetchJSON) => {
    if (typeof fetchJSON !== "function") return;
    try {
      const data = await fetchJSON("api/birthday-slide/fonts");
      const items = Array.isArray(data?.items) ? data.items : [];
      items.forEach((item, idx) => {
        const safeName = item?.family || item?.filename || `Police ${idx + 1}`;
        const family = `CustomFont_${safeName.replace(/\s+/g, "_")}`;
        const url = item?.url;
        if (!url) return;
        if (fontRegistry.has(family)) return;
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
        fontRegistry.set(family, url);
      });
    } catch (error) {
      console.warn("Impossible de charger les polices Anniversaire:", error);
    }
  };

  const loadVariantConfig = async (variant, fetchJSON, { force = false } = {}) => {
    const normalizedVariant = BIRTHDAY_VARIANTS.includes(variant) ? variant : "before";
    const now = Date.now();
    if (!force && !isVariantStale(normalizedVariant, now)) {
      return variantConfigs[normalizedVariant];
    }
    try {
      const data = await fetchJSON?.(`api/birthday-slide/config/${normalizedVariant}`);
      const cfg = (data && data.config) || {};
      variantConfigs[normalizedVariant] = normalizeVariantConfig(cfg, normalizedVariant);
    } catch (error) {
      console.warn("Impossible de charger le modèle Anniversaire:", error);
      variantConfigs[normalizedVariant] = normalizeVariantConfig(
        { ...(BIRTHDAY_FIXED_COPY[normalizedVariant] || {}) },
        normalizedVariant,
      );
    }
    variantFetchedAt[normalizedVariant] = now;
    return variantConfigs[normalizedVariant];
  };

  window.CardinalBirthdayConfig = {
    CONFIG_REFRESH_MS,
    fontRegistry,
    isVariantStale,
    loadCustomFonts,
    loadVariantConfig,
    normalizeLines,
    normalizeVariantConfig,
    variantConfigs,
    variantFetchedAt,
  };
})();
