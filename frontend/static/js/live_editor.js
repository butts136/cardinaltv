(() => {
  const boot = () => {
    const appGlobals = window.CardinalApp || {};
    const { buildApiUrl, fetchJSON } = appGlobals;
    const clamp = appGlobals.clampValue || ((value, min, max) => Math.min(Math.max(value, min), max));

    if (!buildApiUrl || !fetchJSON) {
      setTimeout(boot, 50);
      return;
    }

    const testBackgroundDropZone = document.querySelector("#test-background-drop-zone");
    const testBackgroundInput = document.querySelector("#test-background-input");
    const testBackgroundFeedback = document.querySelector("#test-background-feedback");
    const testBackgroundProgress = document.querySelector("#test-background-progress");
    const testBackgroundProgressBar = document.querySelector("#test-background-progress-bar");
    const testBackgroundProgressText = document.querySelector("#test-background-progress-text");
    const testBackgroundList = document.querySelector("#test-background-list");
    const previewFrame = document.querySelector(".preview-frame");
    const previewStage = document.querySelector("#test-preview-stage");
    const testPreviewMedia = document.querySelector("#test-preview-media");
    const testPreviewTextOverlay = document.querySelector("#test-preview-texts");
    const testTextAddButton = document.querySelector("#test-text-add");
    const slideNameInput = document.querySelector("#test-slide-name");
    const slideDateInput = document.querySelector("#test-slide-date");
    const variablesModal = document.querySelector("#test-variables-modal");
    const variablesOpenButton = document.querySelector("#test-variables-open");
    const variablesCloseButton = document.querySelector("#test-variables-close");
    const variableButtons = document.querySelectorAll(".test-variable-button");
    const selectedTextPanel = document.querySelector("#selected-text-panel");
    const selectedTextTitle = document.querySelector("#selected-text-title");
    const selectedTextTextarea = document.querySelector("#selected-text-input");
    const selectedTextPlaceholder = document.querySelector("#selected-text-placeholder");
    const selectedTextFontSelect = document.querySelector("#selected-text-font");
    const textStyleToggleButtons = document.querySelectorAll(".text-style-toggle");
    const selectedTextColorInput = document.querySelector("#selected-text-color");
    const selectedTextColorValue = document.querySelector("#selected-text-color-value");
    const selectedTextBackgroundColorInput = document.querySelector("#selected-text-background-color");
    const selectedTextBackgroundColorValue = document.querySelector("#selected-text-background-color-value");
    const selectedTextBackgroundOpacityInput = document.querySelector("#selected-text-background-opacity");
    const selectedTextBackgroundOpacityValue = document.querySelector("#selected-text-background-opacity-value");
    const selectedTextDeleteButton = document.querySelector("#selected-text-delete");
    const testSlideToggle = document.querySelector("#halloween-enabled");
    const testTextFeedback = document.querySelector("#test-text-feedback");
    const testMetaFeedback = document.querySelector("#test-meta-feedback");

    const DEFAULT_TEXT_SIZE = { width: 30, height: 12 };
    const DEFAULT_TEXT_COLOR = "#E10505";
    const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
    const AVAILABLE_FONTS = [
      "Poppins",
      "Roboto",
      "Montserrat",
      "Playfair Display",
      "Space Mono",
      "Open Sans",
      "Lato",
      "Raleway",
      "Merriweather",
      "Source Sans Pro",
      "Oswald",
      "Nunito",
      "Ubuntu",
      "Fira Sans",
      "IBM Plex Sans",
      "Pacifico",
      "Bebas Neue",
      "Caveat",
      "Inconsolata",
      "PT Serif",
    ];
<<<<<<< ours
    const DEFAULT_TEST_SLIDE_SETTINGS = { enabled: false, order_index: 0, duration: 12 };
    let currentTestSlideSettings = { ...DEFAULT_TEST_SLIDE_SETTINGS };
    const DEFAULT_TEST_META = {
<<<<<<< ours
=======
<<<<<<< ours
    const DEFAULT_CUSTOM_SLIDE_SETTINGS = { enabled: false, order_index: 0, duration: 12 };
    let currentCustomSlideSettings = { ...DEFAULT_CUSTOM_SLIDE_SETTINGS };
    const DEFAULT_CUSTOM_META = {
>>>>>>> theirs
      name: "Custom 1",
=======
    const DEFAULT_TEST_SLIDE_SETTINGS = { enabled: false, order_index: 0, duration: 12 };
    let currentTestSlideSettings = { ...DEFAULT_TEST_SLIDE_SETTINGS };
    const DEFAULT_TEST_META = {
      name: "Diapo personnalisée",
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
      name: "Diapo personnalisée",
>>>>>>> theirs
      event_date: "",
    };
    const DEFAULT_TEXT_STYLE = {
      font_family: AVAILABLE_FONTS[0],
      bold: false,
      italic: false,
      underline: false,
    };
    const DEFAULT_TEXT_BACKGROUND = {
      color: "#000000",
      opacity: 0,
    };
    const MIN_TEXT_SIZE = 1;
    const MAX_TEXT_SIZE = 200;
    const resizeHandles = {
      "top-middle": { axis: "vertical", directionY: -1 },
      "bottom-middle": { axis: "vertical", directionY: 1 },
      "left-middle": { axis: "horizontal", directionX: -1 },
      "right-middle": { axis: "horizontal", directionX: 1 },
      "top-left": { axis: "both", directionX: -1, directionY: -1 },
      "top-right": { axis: "both", directionX: 1, directionY: -1 },
      "bottom-left": { axis: "both", directionX: -1, directionY: 1 },
      "bottom-right": { axis: "both", directionX: 1, directionY: 1, keepRatio: true },
    };

  const dragState = {
    card: null,
    name: null,
    pointerId: null,
    position: null,
    startX: null,
    startY: null,
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    startWidth: null,
    startHeight: null,
    aspectRatio: 1,
    resizeSize: null,
  };

  let currentTestTexts = [];
  let currentSelectedTextName = null;
  const textUpdateTimers = new Map();
  let currentTestMeta = { ...DEFAULT_TEST_META };
  let metaUpdateTimer = null;
  let pendingMetaChanges = {};
  let lastFocusedModalTrigger = null;

  const highlightTestBackgroundDropZone = (active) => {
    if (!testBackgroundDropZone) return;
    testBackgroundDropZone.classList.toggle("drag-over", Boolean(active));
  };

  const setTestBackgroundFeedback = (message, status = "info") => {
    if (!testBackgroundFeedback) return;
    testBackgroundFeedback.textContent = message;
    testBackgroundFeedback.dataset.status = status;
  };

  const setTestBackgroundProgress = (percent, label) => {
    if (!testBackgroundProgress || !testBackgroundProgressBar || !testBackgroundProgressText) return;
    if (percent === null) {
      testBackgroundProgress.classList.remove("visible");
      return;
    }
    testBackgroundProgress.classList.add("visible");
    testBackgroundProgressBar.style.width = `${percent}%`;
    testBackgroundProgressText.textContent = label || `${percent}%`;
  };

  const uploadTestBackgroundFile = (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setTestBackgroundFeedback(`Téléversement de ${file.name}…`);
    setTestBackgroundProgress(0, "0%");
    const xhr = new XMLHttpRequest();
    const endpoint = buildApiUrl("api/test/background");
    xhr.open("POST", endpoint);
    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
      setTestBackgroundProgress(percent, `${percent}%`);
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setTestBackgroundProgress(100, "100%");
        setTestBackgroundFeedback(`Fichier ${file.name} téléversé.`, "success");
        setTimeout(() => setTestBackgroundProgress(null), 800);
        void refreshTestBackgroundList();
      } else {
        console.error("Erreur lors du téléversement de l'arrière-plan test :", xhr.responseText);
        setTestBackgroundProgress(null);
        setTestBackgroundFeedback("Erreur lors du téléversement.", "error");
      }
    });
    xhr.addEventListener("error", () => {
      setTestBackgroundProgress(null);
      setTestBackgroundFeedback("Erreur lors du téléversement.", "error");
    });
    xhr.send(formData);
  };

  const handleTestBackgroundFiles = (files) => {
    if (!files || !files.length) return;
    uploadTestBackgroundFile(files[0]);
  };

  const clearTestPreview = () => {
    if (!testPreviewMedia) return;
    testPreviewMedia.innerHTML = "";
  };

  const updateTestPreview = (entry) => {
    if (!testPreviewMedia) return;
    clearTestPreview();
    if (!entry) {
      const placeholder = document.createElement("p");
      placeholder.className = "preview-placeholder";
      placeholder.textContent = "Aucun fond actif pour le moment.";
      testPreviewMedia.appendChild(placeholder);
      return;
    }
    let mediaElement;
    if (entry.mimetype && entry.mimetype.startsWith("image")) {
      mediaElement = document.createElement("img");
      mediaElement.alt = entry.name || "Fond actif";
    } else {
      mediaElement = document.createElement("video");
      mediaElement.muted = true;
      mediaElement.loop = true;
      mediaElement.autoplay = true;
      mediaElement.playsInline = true;
      mediaElement.preload = "metadata";
    }
    mediaElement.src = entry.url;
    testPreviewMedia.appendChild(mediaElement);
  };

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");

  const previewBaseWidth = Number(previewStage?.dataset?.baseWidth) || 1920;
  const previewBaseHeight = Number(previewStage?.dataset?.baseHeight) || 1080;

  const MEASUREMENT_FALLBACK_CHAR_WIDTH = 0.6;
  const MEASUREMENT_SAFETY_RATIO = 0.1;

  const getOverlayDimensions = () => ({
    width: previewBaseWidth,
    height: previewBaseHeight,
  });

  const getTextLinesInfo = (rawValue) => {
    const lines = rawValue.split(/\r?\n/);
    const normalizedLines = lines.length ? lines : [""];
    const longest = Math.max(1, ...normalizedLines.map((line) => line.length));
    return {
      lineCount: Math.max(1, normalizedLines.length),
      longestLineLength: longest,
    };
  };

  const updatePreviewStageScale = () => {
    if (!previewFrame || !previewStage) {
      return;
    }
    const rect = previewFrame.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }
    const scale = Math.min(rect.width / previewBaseWidth, rect.height / previewBaseHeight);
    previewStage.style.setProperty("--preview-scale", scale.toString());
  };

  const setupPreviewStageScaling = () => {
    if (!previewFrame || !previewStage) {
      return;
    }
    previewStage.style.setProperty("--preview-base-width", `${previewBaseWidth}px`);
    previewStage.style.setProperty("--preview-base-height", `${previewBaseHeight}px`);
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(updatePreviewStageScale);
      observer.observe(previewFrame);
    } else {
      window.addEventListener("resize", updatePreviewStageScale);
    }
    updatePreviewStageScale();
  };

  const isValidHexColor = (value) => HEX_COLOR_PATTERN.test((value || "").trim());
  const normalizeColorValue = (value) => {
    if (!value) return DEFAULT_TEXT_COLOR;
    const normalized = value.trim();
    if (!normalized) return DEFAULT_TEXT_COLOR;
    if (HEX_COLOR_PATTERN.test(normalized)) {
      return normalized.length === 4
        ? `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`.toLowerCase()
        : normalized.toLowerCase();
    }
    return DEFAULT_TEXT_COLOR;
  };

  const formatColorLabel = (value) => normalizeColorValue(value).toUpperCase();
  const getFontStack = (fontFamily) => {
    const primary = fontFamily || DEFAULT_TEXT_STYLE.font_family;
    return `"${primary}", "Poppins", "Helvetica Neue", Arial, sans-serif`;
  };
  const getEntryStyle = (entry) => normalizeStylePayload(entry?.style);
  const updateStyleToggleUI = (style, enabled) => {
    if (!textStyleToggleButtons || !textStyleToggleButtons.length) return;
    textStyleToggleButtons.forEach((button) => {
      const key = button.dataset.style;
      const isActive = enabled && Boolean(style?.[key]);
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
      button.disabled = !enabled;
    });
  };
  const toBoolean = (value, fallback = false) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const lower = value.trim().toLowerCase();
      if (["1", "true", "yes", "on"].includes(lower)) return true;
      if (["0", "false", "no", "off"].includes(lower)) return false;
    }
    return fallback;
  };
  const normalizeFontFamily = (value) => (AVAILABLE_FONTS.includes(value) ? value : DEFAULT_TEXT_STYLE.font_family);
  const normalizeStylePayload = (raw) => {
    const source = typeof raw === "object" && raw ? raw : {};
    return {
      font_family: normalizeFontFamily(source.font_family),
      bold: toBoolean(source.bold, DEFAULT_TEXT_STYLE.bold),
      italic: toBoolean(source.italic, DEFAULT_TEXT_STYLE.italic),
      underline: toBoolean(source.underline, DEFAULT_TEXT_STYLE.underline),
    };
  };
  const normalizeTestSlideSettings = (raw) => {
    const base = { ...DEFAULT_TEST_SLIDE_SETTINGS };
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

  const updateTestSlideToggleUI = () => {
    if (testSlideToggle) {
      testSlideToggle.checked = Boolean(currentTestSlideSettings.enabled);
    }
  };

  const refreshTestSlideSettings = async () => {
    try {
      const data = await fetchJSON("api/settings");
      const raw = (data && data.test_slide) || DEFAULT_TEST_SLIDE_SETTINGS;
      currentTestSlideSettings = normalizeTestSlideSettings(raw);
      updateTestSlideToggleUI();
    } catch (error) {
      console.warn("Impossible de charger les paramètres de la diapo personnalisée:", error);
    }
  };

  const persistTestSlideSettings = async (patch) => {
    const payload = { test_slide: patch };
    try {
      const response = await fetchJSON("api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const raw = (response && response.test_slide) || patch;
      currentTestSlideSettings = normalizeTestSlideSettings({
        ...currentTestSlideSettings,
        ...raw,
      });
      updateTestSlideToggleUI();
      return currentTestSlideSettings;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la diapo personnalisée:", error);
      throw error;
    }
  };
  const normalizeBackgroundOptions = (raw) => {
    if (!raw || typeof raw !== "object") {
      return { ...DEFAULT_TEXT_BACKGROUND };
    }
    let opacity = Number(raw.opacity);
    if (Number.isNaN(opacity)) {
      opacity = DEFAULT_TEXT_BACKGROUND.opacity;
    }
    opacity = clamp(opacity, 0, 1);
    return {
      color: normalizeColorValue(raw.color || DEFAULT_TEXT_BACKGROUND.color),
      opacity,
    };
  };
  const hexToRgb = (value) => {
    const normalized = normalizeColorValue(value);
    const hex = normalized.replace("#", "");
    const chunk = hex.length === 3 ? hex.split("").map((ch) => ch + ch).join("") : hex;
    const num = parseInt(chunk, 16);
    if (Number.isNaN(num)) return { r: 0, g: 0, b: 0 };
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };

  const getCardStyleFromDataset = (card) =>
    normalizeStylePayload({
      font_family: card?.dataset?.fontFamily,
      bold: card?.dataset?.bold === "true" || card?.dataset?.bold === "1",
      italic: card?.dataset?.italic === "true" || card?.dataset?.italic === "1",
      underline: card?.dataset?.underline === "true" || card?.dataset?.underline === "1",
    });
  const getCardBackgroundFromDataset = (card) =>
    normalizeBackgroundOptions({
      color: card?.dataset?.backgroundColor,
      opacity: Number(card?.dataset?.backgroundOpacity),
    });
  const getEntryBackground = (entry) => normalizeBackgroundOptions(entry?.background);

  const applyCardTypography = (card, style) => {
    if (!card) return;
    const resolved = normalizeStylePayload(style);
    card.dataset.fontFamily = resolved.font_family;
    card.dataset.bold = resolved.bold ? "1" : "0";
    card.dataset.italic = resolved.italic ? "1" : "0";
    card.dataset.underline = resolved.underline ? "1" : "0";
    card.style.fontFamily = getFontStack(resolved.font_family);
    card.style.fontWeight = resolved.bold ? "700" : "400";
    card.style.fontStyle = resolved.italic ? "italic" : "normal";
    card.style.textDecoration = resolved.underline ? "underline" : "none";
  };

  const applyCardBackground = (card, background) => {
    if (!card) return;
    const resolved = normalizeBackgroundOptions(background);
    card.dataset.backgroundColor = resolved.color;
    card.dataset.backgroundOpacity = resolved.opacity;
    const { r, g, b } = hexToRgb(resolved.color);
    card.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${resolved.opacity})`;
  };

  const MIN_FONT_SIZE = 8;
  const TEXT_LINE_HEIGHT = 1.2;
  const CARD_VERTICAL_PADDING_RATIO = 0.08;
  const CARD_HORIZONTAL_PADDING_RATIO = 0.06;
  const CARD_MAX_PADDING_RATIO = 0.25;
  const MIN_VERTICAL_PADDING_PX = 8;
  const MIN_HORIZONTAL_PADDING_PX = 12;
  const computeFontSizeForCard = (availableHeightPx, rawValue) => {
    const { lineCount } = getTextLinesInfo(rawValue);
    if (!availableHeightPx || !lineCount) {
      return MIN_FONT_SIZE;
    }
    const fontSizeByHeight = availableHeightPx / (lineCount * TEXT_LINE_HEIGHT);
    return Math.max(MIN_FONT_SIZE, Math.min(220, Math.floor(fontSizeByHeight)));
  };

  const measureTextBlock = (lines, fontSize, fontStack) => {
    const normalizedLines = lines && lines.length ? lines : [""];
    if (!measureCtx) {
      const fallbackWidth =
        Math.max(1, Math.max(...normalizedLines.map((line) => (line || "").length)) * fontSize * MEASUREMENT_FALLBACK_CHAR_WIDTH);
      const fallbackLineHeight = fontSize * TEXT_LINE_HEIGHT;
      return { width: fallbackWidth, height: fallbackLineHeight * normalizedLines.length };
    }
    measureCtx.font = `${fontSize}px ${fontStack}`;
    let maxWidth = 1;
    let maxAscent = 0;
    let maxDescent = 0;
    normalizedLines.forEach((line) => {
      const metrics = measureCtx.measureText(line || " ");
      const left = Math.abs(metrics.actualBoundingBoxLeft ?? 0);
      const right = Math.abs(metrics.actualBoundingBoxRight ?? 0);
      const boundingWidth = Math.max(metrics.width || 0, left + right);
      maxWidth = Math.max(maxWidth, boundingWidth);
      maxAscent = Math.max(maxAscent, metrics.actualBoundingBoxAscent ?? 0);
      maxDescent = Math.max(maxDescent, metrics.actualBoundingBoxDescent ?? 0);
    });
    const safety = fontSize * MEASUREMENT_SAFETY_RATIO;
    const lineHeight = Math.max(fontSize * TEXT_LINE_HEIGHT, maxAscent + maxDescent + safety * 2);
    const blockHeight = lineHeight * normalizedLines.length;
    return {
      width: Math.max(1, maxWidth),
      height: Math.max(1, blockHeight),
    };
  };

  const applyTextCardFontSizing = (card) => {
    if (!card) return;
    const rawValue = card.dataset.rawValue || "";
    const displayValue = card.dataset.renderedValue || rawValue;
    const cardColor = normalizeColorValue(card.dataset.color);
    card.dataset.color = cardColor;
    card.style.color = cardColor;
    const cardStyle = getCardStyleFromDataset(card);
    applyCardTypography(card, cardStyle);
    applyCardBackground(card, getCardBackgroundFromDataset(card));
    const width = clamp(parseFloat(card.dataset.width) || DEFAULT_TEXT_SIZE.width, MIN_TEXT_SIZE, MAX_TEXT_SIZE);
    const height = clamp(parseFloat(card.dataset.height) || DEFAULT_TEXT_SIZE.height, MIN_TEXT_SIZE, MAX_TEXT_SIZE);
    const overlayRect = getOverlayDimensions();
    const overlayWidth = Math.max(overlayRect.width, 1);
    const overlayHeight = Math.max(overlayRect.height, 1);
    const cardWidthPx = overlayWidth * (width / 100);
    const cardHeightPx = overlayHeight * (height / 100);
    const horizontalPaddingPx = Math.min(
      Math.max(cardWidthPx * CARD_HORIZONTAL_PADDING_RATIO, MIN_HORIZONTAL_PADDING_PX),
      cardWidthPx * CARD_MAX_PADDING_RATIO
    );
    const verticalPaddingPx = Math.min(
      Math.max(cardHeightPx * CARD_VERTICAL_PADDING_RATIO, MIN_VERTICAL_PADDING_PX),
      cardHeightPx * CARD_MAX_PADDING_RATIO
    );
    const availableHeightPx = Math.max(4, cardHeightPx - verticalPaddingPx * 2);
    let computedFontSize = computeFontSizeForCard(availableHeightPx, displayValue);
    card.style.width = `${width}%`;
    card.style.height = `${height}%`;
    card.style.lineHeight = TEXT_LINE_HEIGHT.toString();
    card.style.display = "flex";
    card.style.justifyContent = "center";
    card.style.alignItems = "center";
    card.style.padding = `${verticalPaddingPx}px ${horizontalPaddingPx}px`;
    card.style.textAlign = "center";
    card.style.whiteSpace = "pre";
    card.style.wordBreak = "normal";
    card.style.overflow = "hidden";
    card.style.boxSizing = "border-box";
    const content = card.querySelector(".preview-text-content");
    if (!content) return;
    const availableWidthPx = Math.max(4, cardWidthPx - horizontalPaddingPx * 2);
    const lines = displayValue.split(/\r?\n/);
    const fontStack = getFontStack(cardStyle.font_family);
    let blockMetrics = measureTextBlock(lines, computedFontSize, fontStack);
    if (blockMetrics.height > availableHeightPx) {
      const ratio = clamp(availableHeightPx / blockMetrics.height, 0.1, 1);
      const adjustedFontSize = Math.max(MIN_FONT_SIZE, Math.floor(computedFontSize * ratio));
      if (adjustedFontSize !== computedFontSize) {
        computedFontSize = adjustedFontSize;
        blockMetrics = measureTextBlock(lines, computedFontSize, fontStack);
      }
    }
    card.style.fontSize = `${computedFontSize}px`;
    const widthScale = clamp(availableWidthPx / blockMetrics.width, 0.25, 4);
    content.style.transform = `scale(${widthScale}, 1)`;
    content.style.lineHeight = TEXT_LINE_HEIGHT.toString();
    content.style.transformOrigin = "center";
    content.style.alignItems = "center";
    content.style.justifyContent = "center";
    content.style.textAlign = "center";
  };

  const createPreviewTextCard = (entry) => {
    if (!entry) return null;
    const rawValue = entry.value || "";
    if (!rawValue.trim()) return null;
    const card = document.createElement("div");
    card.className = "preview-text-card";
    card.innerHTML = "";
    const content = document.createElement("span");
    content.className = "preview-text-content";
    const resolvedValue = entry.resolved_value || resolveTokens(rawValue);
    content.textContent = resolvedValue;
    card.appendChild(content);
    card.dataset.name = entry.name;
    card.dataset.rawValue = rawValue;
    card.dataset.renderedValue = resolvedValue;
    const color = normalizeColorValue(entry.color);
    card.dataset.color = color;
    const background = getEntryBackground(entry);
    card.dataset.backgroundColor = background.color;
    card.dataset.backgroundOpacity = background.opacity;
    const size = entry.size || DEFAULT_TEXT_SIZE;
    card.dataset.width = size.width;
    card.dataset.height = size.height;
    applyCardTypography(card, getEntryStyle(entry));
    card.style.left = `${entry.position?.x ?? 50}%`;
    card.style.top = `${entry.position?.y ?? 50}%`;
    card.style.transform = "translate(-50%, -50%)";
    applyTextCardFontSizing(card);
    card.addEventListener("pointerdown", handleTextPointerDown);
    card.addEventListener("pointerup", handleTextPointerUp);
    card.addEventListener("pointerleave", handleTextPointerUp);
    Object.keys(resizeHandles).forEach((direction) => {
      const handle = document.createElement("span");
      handle.className = `resize-handle resize-handle--${direction}`;
      handle.dataset.direction = direction;
      handle.addEventListener("pointerdown", handleResizePointerDown);
      card.append(handle);
    });
    return card;
  };

  const updateTestPreviewTexts = (items) => {
    if (!testPreviewTextOverlay) return;
    testPreviewTextOverlay.innerHTML = "";
    const texts = (Array.isArray(items) ? items : []).filter((entry) => entry.value && entry.value.trim());
    if (!texts.length) {
      const placeholder = document.createElement("p");
      placeholder.className = "preview-text-card preview-placeholder";
      placeholder.textContent = "Les textes ajoutés apparaissent ici.";
      testPreviewTextOverlay.appendChild(placeholder);
      return;
    }
    texts.forEach((entry) => {
      const previewEntry = {
        ...entry,
        resolved_value: resolveTokens(entry.value || ""),
      };
      const card = createPreviewTextCard(previewEntry);
      if (card) {
        testPreviewTextOverlay.appendChild(card);
      }
    });
    if (!currentSelectedTextName) {
      if (selectedTextPanel) {
        selectedTextPanel.classList.remove("is-active");
      }
      if (selectedTextPlaceholder) {
        selectedTextPlaceholder.style.display = "";
      }
    }
  };

  const hideSelectedTextPanel = () => {
    currentSelectedTextName = null;
    if (!selectedTextPanel) return;
    selectedTextPanel.classList.remove("is-active");
    if (selectedTextPlaceholder) {
      selectedTextPlaceholder.style.display = "";
    }
    if (selectedTextTitle) {
      selectedTextTitle.textContent = "";
    }
    if (selectedTextTextarea) {
      selectedTextTextarea.value = "";
      selectedTextTextarea.disabled = true;
    }
    if (selectedTextFontSelect) {
      selectedTextFontSelect.value = DEFAULT_TEXT_STYLE.font_family;
      selectedTextFontSelect.disabled = true;
    }
    updateStyleToggleUI(DEFAULT_TEXT_STYLE, false);
    if (selectedTextColorInput) {
      selectedTextColorInput.value = DEFAULT_TEXT_COLOR;
      selectedTextColorInput.disabled = true;
    }
    if (selectedTextColorValue) {
      selectedTextColorValue.textContent = formatColorLabel(DEFAULT_TEXT_COLOR);
    }
    if (selectedTextBackgroundColorInput) {
      selectedTextBackgroundColorInput.value = DEFAULT_TEXT_BACKGROUND.color;
      selectedTextBackgroundColorInput.disabled = true;
    }
    if (selectedTextBackgroundColorValue) {
      selectedTextBackgroundColorValue.textContent = formatColorLabel(DEFAULT_TEXT_BACKGROUND.color);
    }
    if (selectedTextBackgroundOpacityInput) {
      selectedTextBackgroundOpacityInput.value = `${DEFAULT_TEXT_BACKGROUND.opacity * 100}`;
      selectedTextBackgroundOpacityInput.disabled = true;
    }
    if (selectedTextBackgroundOpacityValue) {
      selectedTextBackgroundOpacityValue.textContent = `${Math.round(DEFAULT_TEXT_BACKGROUND.opacity * 100)}%`;
    }
    if (selectedTextDeleteButton) {
      selectedTextDeleteButton.disabled = true;
    }
    if (variablesOpenButton) {
      variablesOpenButton.disabled = true;
    }
    if (variablesModal && variablesModal.classList.contains("is-visible")) {
      closeVariablesModal();
    }
  };

  const updateSelectedTextPanel = (name) => {
    if (!name || !selectedTextPanel) {
      hideSelectedTextPanel();
      return;
    }
    const entry = currentTestTexts.find((item) => item.name === name);
    if (!entry) {
      hideSelectedTextPanel();
      return;
    }
    currentSelectedTextName = name;
    selectedTextPanel.classList.add("is-active");
    if (selectedTextPlaceholder) {
      selectedTextPlaceholder.style.display = "none";
    }
    if (selectedTextTitle) {
      selectedTextTitle.textContent = entry.name;
    }
    if (selectedTextTextarea) {
      selectedTextTextarea.disabled = false;
      selectedTextTextarea.value = entry.value || "";
    }
    const style = getEntryStyle(entry);
    if (selectedTextFontSelect) {
      selectedTextFontSelect.disabled = false;
      selectedTextFontSelect.value = style.font_family;
    }
    updateStyleToggleUI(style, true);
    const resolvedColor = normalizeColorValue(entry.color);
    if (selectedTextColorInput) {
      selectedTextColorInput.disabled = false;
      selectedTextColorInput.value = resolvedColor;
    }
    if (selectedTextColorValue) {
      selectedTextColorValue.textContent = formatColorLabel(resolvedColor);
    }
    const background = getEntryBackground(entry);
    if (selectedTextBackgroundColorInput) {
      selectedTextBackgroundColorInput.disabled = false;
      selectedTextBackgroundColorInput.value = background.color;
    }
    if (selectedTextBackgroundColorValue) {
      selectedTextBackgroundColorValue.textContent = formatColorLabel(background.color);
    }
    if (selectedTextBackgroundOpacityInput) {
      selectedTextBackgroundOpacityInput.disabled = false;
      selectedTextBackgroundOpacityInput.value = `${Math.round(background.opacity * 100)}`;
    }
    if (selectedTextBackgroundOpacityValue) {
      selectedTextBackgroundOpacityValue.textContent = `${Math.round(background.opacity * 100)}%`;
    }
    if (selectedTextDeleteButton) {
      selectedTextDeleteButton.disabled = false;
    }
    if (variablesOpenButton) {
      variablesOpenButton.disabled = false;
    }
  };

  const escapeSelectorValue = (value) => {
    if (!value) return "";
    if (typeof CSS !== "undefined" && CSS.escape) {
      return CSS.escape(value);
    }
    return value.replace(/([\\.\[\]:"'=<>!#$&*+~^`|])/g, "\\$1");
  };

  const reselectCurrentText = () => {
    if (!currentSelectedTextName || !testPreviewTextOverlay) return;
    const selector = `.preview-text-card[data-name="${escapeSelectorValue(currentSelectedTextName)}"]`;
    const card = testPreviewTextOverlay.querySelector(selector);
    if (card) {
      selectPreviewTextCard(card);
    }
  };

  const selectPreviewTextCard = (card) => {
    if (!testPreviewTextOverlay) return;
    const current = testPreviewTextOverlay.querySelector(".preview-text-card.is-selected");
    if (current && current !== card) {
      current.classList.remove("is-selected");
    }
    if (card) {
      card.classList.add("is-selected");
      updateSelectedTextPanel(card.dataset.name);
    } else {
      hideSelectedTextPanel();
    }
  };

  const handleTextPointerDown = (event) => {
    const card = event.currentTarget;
    if (!card) return;
    selectPreviewTextCard(card);
    dragState.card = card;
    dragState.name = card.dataset.name;
    dragState.pointerId = event.pointerId;
    dragState.position = null;
    dragState.startX = event.clientX;
    dragState.startY = event.clientY;
    dragState.isDragging = false;
    dragState.isResizing = false;
    dragState.resizeHandle = null;
    dragState.resizeSize = null;
    event.preventDefault();
    event.stopPropagation();
    if (card.setPointerCapture) {
      card.setPointerCapture(event.pointerId);
    }
  };

  const handleResizePointerDown = (event) => {
    event.stopPropagation();
    event.preventDefault();
    const direction = event.currentTarget.dataset.direction;
    if (!direction) return;
    const card = event.currentTarget.closest(".preview-text-card");
    if (!card) return;
    const width = parseFloat(card.dataset.width) || DEFAULT_TEXT_SIZE.width;
    const height = parseFloat(card.dataset.height) || DEFAULT_TEXT_SIZE.height;
    dragState.card = card;
    dragState.name = card.dataset.name;
    dragState.pointerId = event.pointerId;
    dragState.isResizing = true;
    dragState.resizeHandle = direction;
    dragState.position = null;
    dragState.startWidth = width;
    dragState.startHeight = height;
    dragState.aspectRatio = width / (height || 1);
    dragState.resizeSize = { width, height };
    dragState.startX = event.clientX;
    dragState.startY = event.clientY;
    selectPreviewTextCard(card);
    if (card.setPointerCapture) {
      card.setPointerCapture(event.pointerId);
    }
  };

  const updateCardSize = (card, width, height) => {
    const resolvedWidth = clamp(width, MIN_TEXT_SIZE, MAX_TEXT_SIZE);
    const resolvedHeight = clamp(height, MIN_TEXT_SIZE, MAX_TEXT_SIZE);
    card.dataset.width = resolvedWidth;
    card.dataset.height = resolvedHeight;
    applyTextCardFontSizing(card);
    dragState.resizeSize = { width: resolvedWidth, height: resolvedHeight };
  };

  const handleTextPointerMove = (event) => {
    if (!dragState.card || !testPreviewTextOverlay) return;
    if (dragState.pointerId && event.pointerId !== dragState.pointerId) return;
    const rect = testPreviewTextOverlay.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    if (dragState.isResizing) {
      const handleConfig = resizeHandles[dragState.resizeHandle];
      if (!handleConfig) return;
      const rawDeltaX = ((event.clientX - (dragState.startX || 0)) / rect.width) * 100;
      const rawDeltaY = ((event.clientY - (dragState.startY || 0)) / rect.height) * 100;
      const horizontalDirection = handleConfig.directionX ?? handleConfig.direction ?? 1;
      const verticalDirection = handleConfig.directionY ?? handleConfig.direction ?? 1;
      let newWidth = dragState.startWidth;
      let newHeight = dragState.startHeight;
      if (handleConfig.axis === "horizontal" || handleConfig.axis === "both") {
        newWidth = clamp(dragState.startWidth + rawDeltaX * horizontalDirection, MIN_TEXT_SIZE, MAX_TEXT_SIZE);
      }
      if (handleConfig.axis === "vertical" || handleConfig.axis === "both") {
        newHeight = clamp(dragState.startHeight + rawDeltaY * verticalDirection, MIN_TEXT_SIZE, MAX_TEXT_SIZE);
      }
      if (handleConfig.keepRatio) {
        const ratio = dragState.aspectRatio || 1;
        const change =
          Math.abs(newWidth - dragState.startWidth) > Math.abs(newHeight - dragState.startHeight)
            ? newWidth - dragState.startWidth
            : newHeight - dragState.startHeight;
        newWidth = clamp(dragState.startWidth + change, MIN_TEXT_SIZE, MAX_TEXT_SIZE);
        newHeight = clamp(newWidth / ratio, MIN_TEXT_SIZE, MAX_TEXT_SIZE);
      }
      updateCardSize(dragState.card, newWidth, newHeight);
      return;
    }
    const deltaX = Math.abs(event.clientX - (dragState.startX || 0));
    const deltaY = Math.abs(event.clientY - (dragState.startY || 0));
    if (!dragState.isDragging && Math.hypot(deltaX, deltaY) < 4) {
      return;
    }
    if (!dragState.isDragging) {
      dragState.isDragging = true;
    }
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    dragState.card.style.left = `${x}%`;
    dragState.card.style.top = `${y}%`;
    dragState.position = { x, y };
  };

  const handleTextPointerUp = (event) => {
    if (!dragState.card) return;
    if (dragState.card.hasPointerCapture && event.pointerId === dragState.pointerId) {
      dragState.card.releasePointerCapture(event.pointerId);
    }
    if (dragState.position) {
      void updateTestTextPosition(dragState.name, dragState.position);
    }
    if (dragState.isResizing && dragState.resizeSize) {
      void updateTestTextSize(dragState.name, dragState.resizeSize);
    }
    dragState.card = null;
    dragState.name = null;
    dragState.pointerId = null;
    dragState.position = null;
    dragState.isDragging = false;
    dragState.isResizing = false;
    dragState.resizeHandle = null;
    dragState.resizeSize = null;
  };

  const setTestTextFeedback = (message, status = "info") => {
    if (!testTextFeedback) return;
    testTextFeedback.textContent = message;
    testTextFeedback.dataset.status = status;
  };

  const setTestMetaFeedback = (message, status = "info") => {
    if (!testMetaFeedback) return;
    testMetaFeedback.textContent = message;
    testMetaFeedback.dataset.status = status;
  };

  const applyMetaToInputs = () => {
    if (slideNameInput) {
      slideNameInput.value = currentTestMeta.name || "";
    }
    if (slideDateInput) {
      slideDateInput.value = currentTestMeta.event_date || "";
    }
    updateTestPreviewTexts(currentTestTexts);
  };

  const refreshTestMeta = async () => {
    try {
      const meta = await fetchJSON("api/test/meta");
      currentTestMeta = { ...DEFAULT_TEST_META, ...(meta || {}) };
      applyMetaToInputs();
    } catch (error) {
      console.warn("Impossible de charger les métadonnées de la diapo personnalisée:", error);
    }
  };

  const persistTestMeta = async (patch) => {
    if (!patch || !Object.keys(patch).length) {
      return;
    }
    try {
      const response = await fetchJSON("api/test/meta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      currentTestMeta = { ...DEFAULT_TEST_META, ...(response || {}) };
      applyMetaToInputs();
      setTestMetaFeedback("Informations enregistrées.", "success");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des métadonnées Test:", error);
      setTestMetaFeedback("Erreur lors de l'enregistrement.", "error");
    }
  };

  const queueMetaUpdate = (patch) => {
    pendingMetaChanges = { ...pendingMetaChanges, ...patch };
    if (metaUpdateTimer) {
      clearTimeout(metaUpdateTimer);
    }
    metaUpdateTimer = setTimeout(() => {
      const payload = { ...pendingMetaChanges };
      pendingMetaChanges = {};
      metaUpdateTimer = null;
      void persistTestMeta(payload);
    }, 500);
  };

  const openVariablesModal = () => {
    if (!variablesModal) return;
    variablesModal.classList.add("is-visible");
    variablesModal.setAttribute("aria-hidden", "false");
    lastFocusedModalTrigger = document.activeElement;
    const firstButton = variablesModal.querySelector(".test-variable-button");
    firstButton?.focus();
    window.addEventListener("keydown", handleVariableModalKeydown);
  };

  const closeVariablesModal = (focusTarget = null) => {
    if (!variablesModal) return;
    variablesModal.classList.remove("is-visible");
    variablesModal.setAttribute("aria-hidden", "true");
    window.removeEventListener("keydown", handleVariableModalKeydown);
    const target = focusTarget || lastFocusedModalTrigger;
    if (target && typeof target.focus === "function") {
      target.focus();
    }
    lastFocusedModalTrigger = null;
  };

  const handleVariableModalKeydown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeVariablesModal();
    }
  };

  const insertVariableToken = (token) => {
    if (!token || !selectedTextTextarea || !currentSelectedTextName) return;
    selectedTextTextarea.focus();
    const start = selectedTextTextarea.selectionStart ?? selectedTextTextarea.value.length;
    const end = selectedTextTextarea.selectionEnd ?? selectedTextTextarea.value.length;
    const before = selectedTextTextarea.value.slice(0, start);
    const after = selectedTextTextarea.value.slice(end);
    const nextValue = before + token + after;
    selectedTextTextarea.value = nextValue;
    const cursor = start + token.length;
    if (selectedTextTextarea.setSelectionRange) {
      selectedTextTextarea.setSelectionRange(cursor, cursor);
    }
    queueTextUpdate(currentSelectedTextName, nextValue);
    closeVariablesModal(selectedTextTextarea);
  };

  const FRENCH_DATE_FORMAT = new Intl.DateTimeFormat("fr-CA", { dateStyle: "long" });
  const FRENCH_TIME_FORMAT = new Intl.DateTimeFormat("fr-CA", { timeStyle: "short" });
  const FRENCH_WEEKDAY_FORMAT = new Intl.DateTimeFormat("fr-CA", { weekday: "long" });
  const FRENCH_MONTH_FORMAT = new Intl.DateTimeFormat("fr-CA", { month: "long" });

  const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const parseEventDateString = (value) => {
    if (!value) return null;
    const parts = value.split("-");
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map((part) => Number.parseInt(part, 10));
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return null;
    }
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  };
  const clampNonNegative = (value) => (value < 0 ? 0 : value);
  const getDaysUntilEvent = (eventDate) => {
    if (!eventDate) return 0;
    const now = startOfDay(new Date());
    const target = startOfDay(eventDate);
    const diff = target.getTime() - now.getTime();
    return clampNonNegative(Math.round(diff / 86400000));
  };
  const formatWeekday = (date, options = { capitalize: false }) => {
    const label = FRENCH_WEEKDAY_FORMAT.format(date);
    return options.capitalize ? label.charAt(0).toUpperCase() + label.slice(1) : label.toLowerCase();
  };
  const formatMonth = (date, options = { capitalize: false }) => {
    const label = FRENCH_MONTH_FORMAT.format(date);
    return options.capitalize ? label.charAt(0).toUpperCase() + label.slice(1) : label.toLowerCase();
  };
  const getSeasonLabel = (date, { capitalize = false } = {}) => {
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
  const buildTokenMap = () => {
    const now = new Date();
    const eventDate = parseEventDateString(currentTestMeta.event_date);
    const daysLeft = getDaysUntilEvent(eventDate);
    const countdown = `${daysLeft} ${getDayLabel(daysLeft)}`;
    const weekdayLower = formatWeekday(now, { capitalize: false });
    const weekdayUpper = formatWeekday(now, { capitalize: true });
    const monthLower = formatMonth(now, { capitalize: false });
    const monthUpper = formatMonth(now, { capitalize: true });
    const tokens = {
      "[slide_name]": currentTestMeta.name || "",
      "[date]": FRENCH_DATE_FORMAT.format(now),
      "[time]": FRENCH_TIME_FORMAT.format(now),
      "[weekday]": weekdayLower,
      "[Weekday]": weekdayUpper,
      "[month]": monthLower,
      "[Month]": monthUpper,
      "[year]": String(now.getFullYear()),
      "[season]": getSeasonLabel(now, { capitalize: false }),
      "[seasons]": getSeasonLabel(now, { capitalize: true }),
      "[Season]": getSeasonLabel(now, { capitalize: true }),
      "[days_left]": String(daysLeft),
      "[event_countdown]": countdown,
      "[day_days]": getDayLabel(daysLeft),
      "[Day_Days]": getDayLabel(daysLeft, { capitalize: true }),
      "[event_date]": eventDate ? FRENCH_DATE_FORMAT.format(eventDate) : "",
      "[event_weekday]": eventDate ? formatWeekday(eventDate, { capitalize: true }) : "",
      "[event_month]": eventDate ? formatMonth(eventDate, { capitalize: true }) : "",
      "[event_year]": eventDate ? String(eventDate.getFullYear()) : "",
    };
    return tokens;
  };
  const resolveTokens = (value) => {
    if (!value && value !== 0) return "";
    const source = typeof value === "string" ? value : String(value);
    const tokens = buildTokenMap();
    let resolved = source;
    Object.entries(tokens).forEach(([token, replacement]) => {
      if (!token) return;
      const safeReplacement = replacement ?? "";
      resolved = resolved.split(token).join(safeReplacement);
    });
    return resolved;
  };

  const renderTestTextsList = (items) => {
    const normalized = (Array.isArray(items) ? items : []).map((entry) => ({
      ...entry,
      resolved_value: entry.resolved_value || resolveTokens(entry.value || ""),
      style: getEntryStyle(entry),
      background: getEntryBackground(entry),
    }));
    currentTestTexts = normalized;
    updateTestPreviewTexts(normalized);
    if (currentSelectedTextName) {
      updateSelectedTextPanel(currentSelectedTextName);
      reselectCurrentText();
    }
  };

  const refreshTestTextsList = async () => {
    try {
      const items = await fetchJSON("api/test/texts");
      renderTestTextsList(items);
    } catch (error) {
      console.error("Erreur lors du chargement des textes de test :", error);
    }
  };

  const queueTextUpdate = (name, value) => {
    if (!name) return;
    const existing = textUpdateTimers.get(name);
    if (existing) {
      clearTimeout(existing);
    }
    const timer = setTimeout(() => {
      void updateTestText(name, value);
      textUpdateTimers.delete(name);
    }, 500);
    textUpdateTimers.set(name, timer);
  };

  const updateTestText = async (name, value) => {
    if (!name) return;
    try {
      const response = await fetchJSON(`api/test/texts/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (response?.deleted) {
        currentTestTexts = currentTestTexts.filter((entry) => entry.name !== name);
        updateTestPreviewTexts(currentTestTexts);
        if (currentSelectedTextName === name) {
          hideSelectedTextPanel();
        }
        setTestTextFeedback(`Texte ${name} supprimé.`, "success");
        return;
      }
      setTestTextFeedback(`Texte ${name} enregistré.`, "success");
      const index = currentTestTexts.findIndex((entry) => entry.name === name);
      if (index >= 0) {
        currentTestTexts[index] = {
          ...currentTestTexts[index],
          value: response.value,
          resolved_value: response.resolved_value || resolveTokens(response.value || ""),
          position: response.position,
          size: response.size,
          color: response.color,
          style: response.style,
          background: response.background,
        };
      } else {
        currentTestTexts.push({
          name,
          value: response.value,
          resolved_value: response.resolved_value || resolveTokens(response.value || ""),
          position: response.position,
          size: response.size,
          color: response.color,
          style: response.style,
          background: response.background,
        });
      }
      updateTestPreviewTexts(currentTestTexts);
      if (currentSelectedTextName === name) {
        updateSelectedTextPanel(name);
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du texte :", error);
      setTestTextFeedback("Erreur lors de l'enregistrement du texte.", "error");
    }
  };

  const updateTestTextPosition = async (name, position) => {
    if (!name || !position) return;
    try {
      await fetchJSON(`api/test/texts/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      });
      setTestTextFeedback(`Position de ${name} enregistrée.`, "success");
      const index = currentTestTexts.findIndex((entry) => entry.name === name);
      if (index >= 0) {
        currentTestTexts[index] = { ...currentTestTexts[index], position };
        updateTestPreviewTexts(currentTestTexts);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la position :", error);
      setTestTextFeedback("Erreur lors de la mise à jour de la position.", "error");
    }
  };

  const updateTestTextSize = async (name, size) => {
    if (!name || !size) return;
    try {
      const response = await fetchJSON(`api/test/texts/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size }),
      });
      setTestTextFeedback(`Taille de ${name} enregistrée.`, "success");
      const index = currentTestTexts.findIndex((entry) => entry.name === name);
      if (index >= 0) {
        const returnedSize = response.size || size;
        currentTestTexts[index] = { ...currentTestTexts[index], size: returnedSize };
        updateTestPreviewTexts(currentTestTexts);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la taille :", error);
      setTestTextFeedback("Erreur lors de la mise à jour de la taille.", "error");
    }
  };

  const updateTestTextColor = async (name, color) => {
    if (!name || !isValidHexColor(color)) return;
    const normalizedColor = normalizeColorValue(color);
    try {
      const response = await fetchJSON(`api/test/texts/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color: normalizedColor }),
      });
      setTestTextFeedback(`Couleur de ${name} enregistrée.`, "success");
      const index = currentTestTexts.findIndex((entry) => entry.name === name);
      if (index >= 0) {
        const returnedColor = response.color || normalizedColor;
        currentTestTexts[index] = { ...currentTestTexts[index], color: returnedColor };
        updateTestPreviewTexts(currentTestTexts);
        if (currentSelectedTextName === name) {
          if (selectedTextColorInput) {
            selectedTextColorInput.value = returnedColor;
          }
          if (selectedTextColorValue) {
            selectedTextColorValue.textContent = formatColorLabel(returnedColor);
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la couleur :", error);
      setTestTextFeedback("Erreur lors de la mise à jour de la couleur.", "error");
    }
  };

  const updateTestTextStyle = async (name, style) => {
    if (!name) return;
    const normalizedStyle = normalizeStylePayload(style);
    try {
      const response = await fetchJSON(`api/test/texts/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: normalizedStyle }),
      });
      setTestTextFeedback(`Style de ${name} enregistré.`, "success");
      const index = currentTestTexts.findIndex((entry) => entry.name === name);
      if (index >= 0) {
        const returnedStyle = normalizeStylePayload(response.style || normalizedStyle);
        currentTestTexts[index] = { ...currentTestTexts[index], style: returnedStyle };
        updateTestPreviewTexts(currentTestTexts);
        if (currentSelectedTextName === name) {
          if (selectedTextFontSelect) {
            selectedTextFontSelect.value = returnedStyle.font_family;
          }
          updateStyleToggleUI(returnedStyle, true);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du style :", error);
      setTestTextFeedback("Erreur lors de la mise à jour du style.", "error");
    }
  };

  const updateTestTextBackground = async (name, background) => {
    if (!name) return;
    const normalizedBackground = normalizeBackgroundOptions(background);
    try {
      const response = await fetchJSON(`api/test/texts/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ background: normalizedBackground }),
      });
      setTestTextFeedback(`Fond de ${name} enregistré.`, "success");
      const index = currentTestTexts.findIndex((entry) => entry.name === name);
      if (index >= 0) {
        const returnedBackground = normalizeBackgroundOptions(response.background || normalizedBackground);
        currentTestTexts[index] = { ...currentTestTexts[index], background: returnedBackground };
        updateTestPreviewTexts(currentTestTexts);
        if (currentSelectedTextName === name) {
          if (selectedTextBackgroundColorInput) {
            selectedTextBackgroundColorInput.value = returnedBackground.color;
          }
          if (selectedTextBackgroundColorValue) {
            selectedTextBackgroundColorValue.textContent = formatColorLabel(returnedBackground.color);
          }
          if (selectedTextBackgroundOpacityInput) {
            selectedTextBackgroundOpacityInput.value = `${Math.round(returnedBackground.opacity * 100)}`;
          }
          if (selectedTextBackgroundOpacityValue) {
            selectedTextBackgroundOpacityValue.textContent = `${Math.round(returnedBackground.opacity * 100)}%`;
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du fond :", error);
      setTestTextFeedback("Erreur lors de la mise à jour du fond.", "error");
    }
  };

  const addTestText = async () => {
    if (!testTextAddButton) return;
    setTestTextFeedback("Création d'un nouveau texte...");
    try {
      const response = await fetchJSON("api/test/texts", {
        method: "POST",
      });
      const newName = response.name;
      setTestTextFeedback("Nouveau texte ajouté.", "success");
      await refreshTestTextsList();
      if (newName) {
        currentSelectedTextName = newName;
        updateSelectedTextPanel(newName);
        reselectCurrentText();
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout d'un texte :", error);
      setTestTextFeedback("Impossible d'ajouter un texte.", "error");
    }
  };

  const deleteTestText = async (name) => {
    if (!name) return;
    try {
      await fetchJSON(`api/test/texts/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      setTestTextFeedback(`Texte ${name} supprimé.`, "success");
      currentTestTexts = currentTestTexts.filter((entry) => entry.name !== name);
      updateTestPreviewTexts(currentTestTexts);
      if (currentSelectedTextName === name) {
        hideSelectedTextPanel();
        currentSelectedTextName = null;
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du texte :", error);
      setTestTextFeedback("Erreur lors de la suppression du texte.", "error");
    }
  };

  const applyStyleChanges = (name, changes) => {
    if (!name) return;
    const entry = currentTestTexts.find((item) => item.name === name);
    const baseStyle = getEntryStyle(entry || {});
    const nextStyle = normalizeStylePayload({ ...baseStyle, ...changes });
    if (currentSelectedTextName === name) {
      if (selectedTextFontSelect && Object.prototype.hasOwnProperty.call(changes, "font_family")) {
        selectedTextFontSelect.value = nextStyle.font_family;
      }
      updateStyleToggleUI(nextStyle, true);
    }
    void updateTestTextStyle(name, nextStyle);
  };

  const applyBackgroundChanges = (name, changes) => {
    if (!name) return;
    const entry = currentTestTexts.find((item) => item.name === name);
    const baseBackground = getEntryBackground(entry || {});
    const nextBackground = normalizeBackgroundOptions({ ...baseBackground, ...changes });
    if (currentSelectedTextName === name) {
      if (selectedTextBackgroundColorInput && Object.prototype.hasOwnProperty.call(changes, "color")) {
        selectedTextBackgroundColorInput.value = nextBackground.color;
      }
      if (selectedTextBackgroundColorValue && Object.prototype.hasOwnProperty.call(changes, "color")) {
        selectedTextBackgroundColorValue.textContent = formatColorLabel(nextBackground.color);
      }
      if (
        selectedTextBackgroundOpacityInput &&
        Object.prototype.hasOwnProperty.call(changes, "opacity")
      ) {
        selectedTextBackgroundOpacityInput.value = `${Math.round(nextBackground.opacity * 100)}`;
      }
      if (
        selectedTextBackgroundOpacityValue &&
        Object.prototype.hasOwnProperty.call(changes, "opacity")
      ) {
        selectedTextBackgroundOpacityValue.textContent = `${Math.round(nextBackground.opacity * 100)}%`;
      }
    }
    void updateTestTextBackground(name, nextBackground);
  };

  const createTestBackgroundThumb = (entry) => {
    const card = document.createElement("article");
    card.className = "background-thumb";
    if (entry.is_active) {
      card.classList.add("is-active");
    }
    const mediaWrapper = document.createElement("div");
    mediaWrapper.className = "background-thumb-media";
    if (entry.mimetype && entry.mimetype.startsWith("image")) {
      const img = document.createElement("img");
      img.src = entry.url || "";
      img.alt = entry.name || "Fond";
      mediaWrapper.appendChild(img);
    } else {
      const video = document.createElement("video");
      video.src = entry.url || "";
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;
      video.preload = "metadata";
      mediaWrapper.appendChild(video);
    }
    const label = document.createElement("p");
    label.className = "background-thumb-name";
    label.textContent = entry.name || "Fond";
    card.append(mediaWrapper, label);
    const actions = document.createElement("div");
    actions.className = "background-thumb-actions";

    const useButton = document.createElement("button");
    useButton.type = "button";
    useButton.className = "secondary-button";
    useButton.textContent = entry.is_active ? "Utilisé" : "Utiliser ce fond";
    useButton.disabled = Boolean(entry.is_active);
    useButton.addEventListener("click", () => {
      void setTestBackgroundActive(entry.name);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "secondary-button secondary-button--ghost";
    deleteButton.textContent = "Supprimer";
    deleteButton.addEventListener("click", () => {
      void deleteTestBackground(entry.name);
    });

    actions.append(useButton, deleteButton);
    card.append(actions);
    return card;
  };

  const renderTestBackgroundList = (items) => {
    if (!testBackgroundList) return;
    testBackgroundList.innerHTML = "";
    if (!Array.isArray(items) || !items.length) {
      testBackgroundList.classList.add("empty");
      const empty = document.createElement("p");
      empty.className = "playlist-subtitle small";
      empty.textContent = "Aucun fond enregistré pour le moment.";
      testBackgroundList.appendChild(empty);
      updateTestPreview(null);
      return;
    }
    testBackgroundList.classList.remove("empty");
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      fragment.appendChild(createTestBackgroundThumb(item));
    });
    testBackgroundList.appendChild(fragment);
    const activeEntry = items.find((item) => item.is_active);
    updateTestPreview(activeEntry);
  };

  const refreshTestBackgroundList = async () => {
    if (!testBackgroundList) return;
    try {
      const items = await fetchJSON("api/test/backgrounds");
      renderTestBackgroundList(items);
    } catch (error) {
      console.error("Erreur lors du chargement des fonds de test :", error);
    }
  };

  async function setTestBackgroundActive(filename) {
    if (!filename) return;
    setTestBackgroundFeedback(`Utilisation de ${filename}…`);
    try {
      await fetchJSON("api/test/background/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      setTestBackgroundFeedback(`Fond ${filename} actif.`, "success");
      await refreshTestBackgroundList();
    } catch (error) {
      console.error("Erreur lors de la sélection du fond test :", error);
      setTestBackgroundFeedback("Erreur lors de l'activation du fond.", "error");
    }
  }

  async function deleteTestBackground(filename) {
    if (!filename) return;
    const confirmDelete = window.confirm(`Supprimer le fond « ${filename} » ?`);
    if (!confirmDelete) {
      return;
    }
    setTestBackgroundFeedback(`Suppression de ${filename}…`);
    try {
      await fetchJSON(`api/test/background/${encodeURIComponent(filename)}`, {
        method: "DELETE",
      });
      setTestBackgroundFeedback(`Fond ${filename} supprimé.`, "success");
      await refreshTestBackgroundList();
    } catch (error) {
      console.error("Erreur lors de la suppression du fond test :", error);
      setTestBackgroundFeedback("Erreur lors de la suppression.", "error");
    }
  }

  const bindDropZoneEvents = () => {
    if (!testBackgroundDropZone) return;
    ["dragenter", "dragover"].forEach((eventName) => {
      testBackgroundDropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        highlightTestBackgroundDropZone(true);
      });
    });
    ["dragleave", "drop"].forEach((eventName) => {
      testBackgroundDropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        highlightTestBackgroundDropZone(false);
      });
    });
    testBackgroundDropZone.addEventListener("drop", (event) => {
      const { files } = event.dataTransfer || {};
      handleTestBackgroundFiles(files);
    });
  };

  const init = () => {
    setupPreviewStageScaling();
    hideSelectedTextPanel();
    bindDropZoneEvents();
    void refreshTestSlideSettings();
    void refreshTestMeta();
    testBackgroundInput?.addEventListener("change", (event) => {
      handleTestBackgroundFiles(event.target.files);
    });
    testTextAddButton?.addEventListener("click", () => {
      void addTestText();
    });
    slideNameInput?.addEventListener("input", (event) => {
      const value = (event.target.value || "").slice(0, 120);
      currentTestMeta = { ...currentTestMeta, name: value };
      queueMetaUpdate({ name: value });
      updateTestPreviewTexts(currentTestTexts);
    });
    slideDateInput?.addEventListener("input", (event) => {
      const value = event.target.value || "";
      currentTestMeta = { ...currentTestMeta, event_date: value };
      queueMetaUpdate({ event_date: value });
      updateTestPreviewTexts(currentTestTexts);
    });
    variablesOpenButton?.addEventListener("click", () => {
      if (variablesOpenButton.disabled) {
        return;
      }
      openVariablesModal();
    });
    variablesCloseButton?.addEventListener("click", () => {
      closeVariablesModal();
    });
    variablesModal?.querySelector("[data-close-modal=\"variables\"]")?.addEventListener("click", () => {
      closeVariablesModal();
    });
    variableButtons?.forEach((button) => {
      button.addEventListener("click", () => {
        const token = button.dataset.variableToken;
        insertVariableToken(token);
      });
    });
    selectedTextTextarea?.addEventListener("input", (event) => {
      if (!currentSelectedTextName) return;
      queueTextUpdate(currentSelectedTextName, event.target.value);
    });
    selectedTextColorInput?.addEventListener("input", (event) => {
      if (!currentSelectedTextName) return;
      const value = event.target.value;
      if (!isValidHexColor(value)) return;
      if (selectedTextColorValue) {
        selectedTextColorValue.textContent = formatColorLabel(value);
      }
      void updateTestTextColor(currentSelectedTextName, value);
    });
    selectedTextBackgroundColorInput?.addEventListener("input", (event) => {
      if (!currentSelectedTextName) return;
      const value = normalizeColorValue(event.target.value);
      event.target.value = value;
      applyBackgroundChanges(currentSelectedTextName, { color: value });
    });
    selectedTextBackgroundOpacityInput?.addEventListener("input", (event) => {
      if (!currentSelectedTextName) return;
      const percent = clamp(Number(event.target.value) || 0, 0, 100);
      event.target.value = `${percent}`;
      if (selectedTextBackgroundOpacityValue) {
        selectedTextBackgroundOpacityValue.textContent = `${percent}%`;
      }
      applyBackgroundChanges(currentSelectedTextName, { opacity: percent / 100 });
    });
    selectedTextFontSelect?.addEventListener("change", (event) => {
      if (!currentSelectedTextName) return;
      const value = normalizeFontFamily(event.target.value);
      event.target.value = value;
      applyStyleChanges(currentSelectedTextName, { font_family: value });
    });
    textStyleToggleButtons?.forEach((button) => {
      button.addEventListener("click", () => {
        if (!currentSelectedTextName) return;
        const key = button.dataset.style;
        if (!key) return;
        const entry = currentTestTexts.find((item) => item.name === currentSelectedTextName);
        const baseStyle = getEntryStyle(entry || {});
        const nextValue = !baseStyle[key];
        applyStyleChanges(currentSelectedTextName, { [key]: nextValue });
      });
    });
    selectedTextDeleteButton?.addEventListener("click", () => {
      if (!currentSelectedTextName) return;
      const confirmed = window.confirm("Supprimer ce texte ? Cette action est irréversible.");
      if (!confirmed) return;
      void deleteTestText(currentSelectedTextName);
    });
    testSlideToggle?.addEventListener("change", (event) => {
      const enabled = Boolean(event.target.checked);
      event.target.disabled = true;
      persistTestSlideSettings({ enabled })
        .catch(() => {
          event.target.checked = !enabled;
        })
        .finally(() => {
          event.target.disabled = false;
        });
    });

    window.addEventListener("pointermove", handleTextPointerMove);
    window.addEventListener("pointerup", handleTextPointerUp);
    window.addEventListener("pointercancel", handleTextPointerUp);
    void refreshTestBackgroundList();
    void refreshTestTextsList();
  };

    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  };

  boot();
})();
