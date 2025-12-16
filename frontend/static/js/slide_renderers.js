(() => {
  const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);
  const clamp01 = (value) => Math.min(1, Math.max(0, Number(value) || 0));

  const MEASUREMENT_FALLBACK_CHAR_WIDTH = 0.6;
  const MEASUREMENT_SAFETY_RATIO = 0.1;
  const TEXT_LINE_HEIGHT = 1.2;
  const MIN_FONT_SIZE = 6;
  const MAX_FONT_SIZE = 220;

  const BOX_PADDING_RATIO = 0.04;
  const BOX_PADDING_MIN_PX = 4;
  const BOX_PADDING_MAX_PX = 32;

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 4;

  const splitLines = (value) => {
    if (!value && value !== 0) {
      return [""];
    }
    const lines = String(value).split(/\r?\n/);
    return lines.length ? lines : [""];
  };

  const measureTextBlock = (lines, fontSize, fontStack, ctx) => {
    const normalizedLines = lines && lines.length ? lines : [""];
    const safeFontSize = Number.isFinite(Number(fontSize)) ? Number(fontSize) : MIN_FONT_SIZE;
    if (!ctx) {
      const fallbackWidth =
        Math.max(1, Math.max(...normalizedLines.map((line) => (line || "").length)) *
          safeFontSize * MEASUREMENT_FALLBACK_CHAR_WIDTH);
      const fallbackLineHeight = safeFontSize * TEXT_LINE_HEIGHT;
      return { width: fallbackWidth, height: fallbackLineHeight * normalizedLines.length };
    }
    ctx.font = `${safeFontSize}px ${fontStack}`;
    let maxWidth = 1;
    let maxAscent = 0;
    let maxDescent = 0;
    normalizedLines.forEach((line) => {
      const metrics = ctx.measureText(line || " ");
      const left = Math.abs(metrics.actualBoundingBoxLeft ?? 0);
      const right = Math.abs(metrics.actualBoundingBoxRight ?? 0);
      const boundingWidth = Math.max(metrics.width || 0, left + right);
      maxWidth = Math.max(maxWidth, boundingWidth);
      maxAscent = Math.max(maxAscent, metrics.actualBoundingBoxAscent ?? 0);
      maxDescent = Math.max(maxDescent, metrics.actualBoundingBoxDescent ?? 0);
    });
    const safety = safeFontSize * MEASUREMENT_SAFETY_RATIO;
    const lineHeight = Math.max(
      safeFontSize * TEXT_LINE_HEIGHT,
      maxAscent + maxDescent + safety * 2,
    );
    const blockHeight = lineHeight * normalizedLines.length;
    return {
      width: Math.max(1, maxWidth),
      height: Math.max(1, blockHeight),
    };
  };

  const computeBoxPaddingPx = (cardWidthPx, cardHeightPx) => {
    const base = Math.max(0, Math.min(Number(cardWidthPx) || 0, Number(cardHeightPx) || 0));
    if (base <= 0) {
      return 0;
    }
    const maxPx = Math.min(BOX_PADDING_MAX_PX, Math.max(0, base / 2 - 1));
    if (maxPx <= 0) {
      return 0;
    }
    const minPx = Math.min(BOX_PADDING_MIN_PX, maxPx);
    return clampValue(base * BOX_PADDING_RATIO, minPx, maxPx);
  };

  const normalizeFontSize = (value, fallback) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      return clampValue(Number(fallback) || MIN_FONT_SIZE, MIN_FONT_SIZE, MAX_FONT_SIZE);
    }
    return clampValue(num, MIN_FONT_SIZE, MAX_FONT_SIZE);
  };

  const normalizeScale = (value, fallback = 1) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      return clampValue(Number(fallback) || 1, MIN_SCALE, MAX_SCALE);
    }
    return clampValue(num, MIN_SCALE, MAX_SCALE);
  };

  const fitTextToBox = (
    text,
    fontStack,
    innerWidthPx,
    innerHeightPx,
    ctx,
    { fontSize: preferredFontSize, scaleX: preferredScaleX, scaleY: preferredScaleY } = {},
  ) => {
    const lines = splitLines(text);
    const lineCount = Math.max(1, lines.length);
    const availableWidth = Math.max(1, Number(innerWidthPx) || 0);
    const availableHeight = Math.max(1, Number(innerHeightPx) || 0);

    const baseFontSize = normalizeFontSize(
      preferredFontSize,
      Math.floor(availableHeight / (lineCount * TEXT_LINE_HEIGHT)),
    );
    const desiredScaleX = normalizeScale(preferredScaleX, 1);
    const desiredScaleY = normalizeScale(preferredScaleY, 1);

    let fontSize = baseFontSize;

    const measure = (size) => measureTextBlock(lines, size, fontStack, ctx);
    let metrics = measure(fontSize);

    let safety = 0;
    while (
      safety < 14 &&
      fontSize > MIN_FONT_SIZE &&
      (metrics.height * desiredScaleY > availableHeight || metrics.width * desiredScaleX > availableWidth)
    ) {
      const ratioH = metrics.height > 0 ? availableHeight / (metrics.height * desiredScaleY) : 1;
      const ratioW = metrics.width > 0 ? availableWidth / (metrics.width * desiredScaleX) : 1;
      const ratio = clampValue(Math.min(ratioH, ratioW), 0.05, 1);
      let next = Math.max(MIN_FONT_SIZE, Math.floor(fontSize * ratio));
      if (next >= fontSize) {
        next = fontSize - 1;
      }
      fontSize = Math.max(MIN_FONT_SIZE, next);
      metrics = measure(fontSize);
      safety += 1;
    }

    const maxScaleX = metrics.width > 0 ? availableWidth / metrics.width : 1;
    const maxScaleY = metrics.height > 0 ? availableHeight / metrics.height : 1;
    const scaleX = clampValue(Math.min(desiredScaleX, maxScaleX), MIN_SCALE, MAX_SCALE);
    const scaleY = clampValue(Math.min(desiredScaleY, maxScaleY), MIN_SCALE, MAX_SCALE);

    return { fontSize, scaleX, scaleY };
  };

  const hexToRgb = (value) => {
    if (typeof value !== "string") return { r: 0, g: 0, b: 0 };
    const hex = value.trim().replace("#", "");
    const normalized =
      hex.length === 3
        ? hex.split("").map((c) => c + c).join("")
        : hex.padEnd(6, "0").slice(0, 6);
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

  // ---------------------------------------------------------------------------
  // Birthday-style overlay sizing (used by birthday, time-change, christmas)
  // ---------------------------------------------------------------------------

  const BIRTHDAY_DEFAULT_HEIGHT_PERCENT = 12;
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

  const layoutOverlayTextLine = (
    lineEl,
    contentEl,
    displayText,
    rawText,
    opts,
    overlayWidth,
    overlayHeight,
  ) => {
    if (!lineEl || !contentEl) return;

    const widthPercent = clampBirthdayPercent(opts.width_percent, 100);
    const heightPercent = clampBirthdayPercent(
      opts.height_percent > 0 ? opts.height_percent : BIRTHDAY_DEFAULT_HEIGHT_PERCENT,
      BIRTHDAY_DEFAULT_HEIGHT_PERCENT,
    );
    const angle = Number(opts.angle) || 0;
    const fontFamily = getBirthdayFontStack(opts.font_family);
    const cardWidthPx = (overlayWidth * widthPercent) / 100;
    const cardHeightPx = (overlayHeight * heightPercent) / 100;
    const paddingPx = computeBoxPaddingPx(cardWidthPx, cardHeightPx);

    lineEl.style.width = `${widthPercent}%`;
    lineEl.style.maxWidth = `${widthPercent}%`;
    lineEl.style.height = `${heightPercent}%`;
    lineEl.style.minHeight = `${heightPercent}%`;
    lineEl.dataset.widthPercent = String(widthPercent);
    lineEl.dataset.heightPercent = String(heightPercent);
    lineEl.style.padding = `${paddingPx}px`;
    lineEl.style.boxSizing = "border-box";
    lineEl.style.display = "flex";
    lineEl.style.justifyContent = "center";
    lineEl.style.alignItems = "center";
    lineEl.style.textAlign = "center";
    lineEl.style.whiteSpace = "pre";
    lineEl.style.wordBreak = "normal";
    lineEl.style.overflow = "visible";
    lineEl.style.letterSpacing = "0px";

    const availableHeightPx = Math.max(1, cardHeightPx - paddingPx * 2);
    const availableWidthPx = Math.max(1, cardWidthPx - paddingPx * 2);
    const fontSizeAuto =
      typeof opts?.font_size_auto === "boolean" ? opts.font_size_auto : true;
    const preferredFontSize = fontSizeAuto ? null : Number(opts?.font_size);
    const { fontSize, scaleX, scaleY } = fitTextToBox(
      displayText,
      fontFamily,
      availableWidthPx,
      availableHeightPx,
      birthdayMeasureCtx,
      {
        fontSize: preferredFontSize,
        scaleX: opts?.scale_x,
        scaleY: opts?.scale_y,
      },
    );

    lineEl.style.fontFamily = fontFamily;
    lineEl.style.fontSize = `${fontSize}px`;
    lineEl.style.lineHeight = TEXT_LINE_HEIGHT.toString();
    lineEl.style.transformOrigin = "50% 50%";
    lineEl.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

    contentEl.style.display = "inline-flex";
    contentEl.style.alignItems = "center";
    contentEl.style.justifyContent = "center";
    contentEl.style.transformOrigin = "center";
    contentEl.style.transform =
      scaleX === 1 && scaleY === 1 ? "none" : `scale(${scaleX}, ${scaleY})`;
  };

  // ---------------------------------------------------------------------------
  // Custom/test slide sizing
  // ---------------------------------------------------------------------------

  const DEFAULT_CUSTOM_TEXT_SIZE = { width: 30, height: 12 };
  const DEFAULT_CUSTOM_TEXT_BACKGROUND = { color: "#000000", opacity: 0 };
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
    const alpha = clamp01(opacity);
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
        Math.max(1, Math.max(...normalizedLines.map((line) => (line || "").length)) *
          fontSize * CUSTOM_MEASUREMENT_FALLBACK_CHAR_WIDTH);
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
    const lineHeight = Math.max(
      fontSize * CUSTOM_TEXT_LINE_HEIGHT,
      maxAscent + maxDescent + safety * 2,
    );
    const blockHeight = lineHeight * normalizedLines.length;
    return {
      width: Math.max(1, maxWidth),
      height: Math.max(1, blockHeight),
    };
  };

  const layoutCustomTextCard = (card, overlayWidth, overlayHeight) => {
    if (!card) return;
    const rawValue = card.dataset.rawValue || "";
    const displayValue = card.dataset.renderedValue || rawValue;

    const content = card.querySelector(".custom-slide-text-content, .preview-text-content");
    const widthPercent = clampValue(
      Number(card.dataset.width) || DEFAULT_CUSTOM_TEXT_SIZE.width,
      5,
      90,
    );
    const heightPercent = clampValue(
      Number(card.dataset.height) || DEFAULT_CUSTOM_TEXT_SIZE.height,
      5,
      90,
    );
    const cardWidthPx = overlayWidth * (widthPercent / 100);
    const cardHeightPx = overlayHeight * (heightPercent / 100);
    const paddingPx = computeBoxPaddingPx(cardWidthPx, cardHeightPx);

    card.style.width = `${widthPercent}%`;
    card.style.height = `${heightPercent}%`;
    card.style.padding = `${paddingPx}px`;
    card.style.boxSizing = "border-box";
    card.style.display = "flex";
    card.style.justifyContent = "center";
    card.style.alignItems = "center";
    card.style.textAlign = "center";
    card.style.whiteSpace = "pre";
    card.style.wordBreak = "normal";
    card.style.overflow = "visible";
    card.style.letterSpacing = "0px";

    const fontStack = getCustomFontStack(card.dataset.fontFamily || "");
    const availableHeightPx = Math.max(1, cardHeightPx - paddingPx * 2);
    const availableWidthPx = Math.max(1, cardWidthPx - paddingPx * 2);
    const fontSizeAutoRaw = card.dataset.fontSizeAuto;
    const fontSizeAuto =
      fontSizeAutoRaw == null ? true : fontSizeAutoRaw === "1" || fontSizeAutoRaw === "true";
    const preferredFontSize = fontSizeAuto ? null : Number(card.dataset.fontSize);
    const { fontSize, scaleX, scaleY } = fitTextToBox(
      displayValue,
      fontStack,
      availableWidthPx,
      availableHeightPx,
      customMeasureCtx,
      {
        fontSize: preferredFontSize,
        scaleX: card.dataset.scaleX,
        scaleY: card.dataset.scaleY,
      },
    );

    card.style.fontSize = `${fontSize}px`;
    card.style.lineHeight = TEXT_LINE_HEIGHT.toString();
    card.style.fontFamily = fontStack;

    if (content) {
      content.style.transformOrigin = "center";
      content.style.transform =
        scaleX === 1 && scaleY === 1 ? "none" : `scale(${scaleX}, ${scaleY})`;
      content.style.lineHeight = TEXT_LINE_HEIGHT.toString();
      content.style.fontSize = `${fontSize}px`;
    }

    const bgColor = card.dataset.backgroundColor || DEFAULT_CUSTOM_TEXT_BACKGROUND.color;
    const bgOpacity =
      card.dataset.backgroundOpacity != null
        ? Number(card.dataset.backgroundOpacity)
        : DEFAULT_CUSTOM_TEXT_BACKGROUND.opacity;
    card.style.backgroundColor = buildRgbaColor(bgColor, bgOpacity);
  };

  window.CardinalSlideRenderers = {
    hexToRgb,
    clampValue,
    applyLineBackground,
    buildRgbaColor,
    getBirthdayFontStack,
    getCustomFontStack,
    layoutOverlayTextLine,
    layoutCustomTextCard,
  };
})();
