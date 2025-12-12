(() => {
  const VARIABLE_TOKEN_PATTERN = /\[[^\]]+\]/;

  const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);
  const clamp01 = (value) => Math.min(1, Math.max(0, Number(value) || 0));

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

  const birthdayComputeFontSizeForHeight = (availableHeightPx, text) => {
    const lines = (text || "").split(/\r?\n/);
    if (!availableHeightPx || !lines.length) return BIRTHDAY_MIN_FONT_SIZE;
    const fontSizeByHeight = availableHeightPx / (lines.length * BIRTHDAY_TEXT_LINE_HEIGHT);
    return Math.max(BIRTHDAY_MIN_FONT_SIZE, Math.min(220, Math.floor(fontSizeByHeight)));
  };

  const birthdayMeasureTextBlock = (text, fontSize, fontFamily) => {
    const lines = (text || "").split(/\r?\n/);
    if (!birthdayMeasureCtx) {
      const fallbackWidth = Math.max(
        1,
        ...lines.map((l) => (l || "").length * fontSize * 0.6),
      );
      return {
        width: fallbackWidth,
        height: Math.max(1, lines.length * fontSize * BIRTHDAY_TEXT_LINE_HEIGHT),
      };
    }
    birthdayMeasureCtx.font = `${fontSize}px ${fontFamily}`;
    let maxWidth = 1;
    lines.forEach((line) => {
      const metrics = birthdayMeasureCtx.measureText(line || " ");
      maxWidth = Math.max(maxWidth, metrics.width || 1);
    });
    return {
      width: Math.max(1, maxWidth),
      height: Math.max(1, lines.length * fontSize * BIRTHDAY_TEXT_LINE_HEIGHT),
    };
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
    let fontSize = birthdayComputeFontSizeForHeight(availableHeightPx, displayText);
    const metrics = birthdayMeasureTextBlock(displayText, fontSize, fontFamily);
    if (metrics.height > availableHeightPx) {
      const ratio = availableHeightPx / metrics.height;
      const adjusted = Math.max(BIRTHDAY_MIN_FONT_SIZE, Math.floor(fontSize * ratio));
      if (adjusted !== fontSize) {
        fontSize = adjusted;
      }
    }
    const measured = birthdayMeasureTextBlock(displayText, fontSize, fontFamily);

    const hasVariables = VARIABLE_TOKEN_PATTERN.test(rawText || "");
    const widthScale = hasVariables
      ? 1
      : Math.min(4, Math.max(0.25, availableWidthPx / Math.max(1, measured.width)));

    lineEl.style.fontFamily = fontFamily;
    lineEl.style.fontSize = `${fontSize}px`;
    lineEl.style.lineHeight = BIRTHDAY_TEXT_LINE_HEIGHT.toString();
    lineEl.style.transformOrigin = "50% 50%";
    lineEl.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

    contentEl.style.display = "inline-flex";
    contentEl.style.alignItems = "center";
    contentEl.style.justifyContent = "center";
    contentEl.style.transformOrigin = "center";
    contentEl.style.transform = hasVariables ? "none" : `scale(${widthScale}, 1)`;
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
    card.style.boxSizing = "border-box";
    card.style.display = "flex";
    card.style.justifyContent = "center";
    card.style.alignItems = "center";
    card.style.textAlign = "center";
    card.style.whiteSpace = "pre";
    card.style.wordBreak = "normal";
    card.style.overflow = "visible";

    const lines = splitTextLines(displayValue);
    const lineCount = Math.max(1, lines.length);
    const availableHeightPx = Math.max(4, cardHeightPx - verticalPaddingPx * 2);
    let fontSize = computeCustomFontSize(availableHeightPx, lineCount);
    const fontStack = getCustomFontStack(card.dataset.fontFamily || "");
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

    const hasVariables = VARIABLE_TOKEN_PATTERN.test(rawValue);
    const widthScale = hasVariables ? 1 : clampValue(availableWidthPx / blockMetrics.width, 0.25, 4);

    card.style.fontSize = `${fontSize}px`;
    card.style.lineHeight = CUSTOM_TEXT_LINE_HEIGHT.toString();
    card.style.fontFamily = fontStack;

    if (content) {
      content.style.transformOrigin = "center";
      content.style.transform = hasVariables ? "none" : `scale(${widthScale}, 1)`;
      content.style.lineHeight = CUSTOM_TEXT_LINE_HEIGHT.toString();
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

