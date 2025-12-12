(() => {
  const boot = () => {
    const appGlobals = window.CardinalApp || {};
    const { buildApiUrl, fetchJSON } = appGlobals;
    const clamp = appGlobals.clampValue || ((value, min, max) => Math.min(Math.max(value, min), max));

    if (!buildApiUrl || !fetchJSON) {
      setTimeout(boot, 50);
      return;
    }

    const editorRoot = document.querySelector("[data-editor-kind]") || document.querySelector("#custom-section");
    const editorKind = editorRoot?.dataset?.editorKind || "test";
    let editorVariant = editorRoot?.dataset?.editorVariant || "";
    if (!editorRoot) {
      return;
    }

    const editorPrefix = editorRoot?.dataset?.editorPrefix || "test-editor";
    const sharedRenderers = window.CardinalSlideRenderers || null;
    const q = (selector) => editorRoot.querySelector(selector);
    const byId = (suffix) =>
      q(`#${editorPrefix}-${suffix}`) || document.getElementById(`${editorPrefix}-${suffix}`);

    const testBackgroundDropZone = byId("background-drop-zone");
    const testBackgroundInput = byId("background-input");
    const testBackgroundFeedback = byId("background-feedback");
    const testBackgroundProgress = byId("background-progress");
    const testBackgroundProgressBar = byId("background-progress-bar");
    const testBackgroundProgressText = byId("background-progress-text");
    const testBackgroundList = byId("background-list");
    const previewFrame = q(".preview-frame");
    const previewStage = byId("preview-stage");
    const testPreviewMedia = byId("preview-media");
    const testPreviewTextOverlay = byId("preview-texts");
    const testTextAddButton = byId("text-add");
    const useCustomDateToggle = byId("use-custom-date");
    const customDateInput = byId("custom-date");
    const variablesModal = byId("variables-modal");
    const variablesOpenButton = byId("variables-open");
    const variablesCloseButton = byId("variables-close");
    const variableButtons = variablesModal
      ? variablesModal.querySelectorAll(".editor-variable-button")
      : [];
    const selectedTextPanel = q("#selected-text-panel");
    const selectedTextTitle = q("#selected-text-title");
    const selectedTextTextarea = q("#selected-text-input");
    const selectedTextPlaceholder = q("#selected-text-placeholder");
    const selectedTextFontSelect = q("#selected-text-font");
    const textStyleToggleButtons = editorRoot.querySelectorAll(".text-style-toggle");
    const selectedTextColorInput = q("#selected-text-color");
    const selectedTextColorValue = q("#selected-text-color-value");
    const selectedTextBackgroundColorInput = q("#selected-text-background-color");
    const selectedTextBackgroundColorValue = q("#selected-text-background-color-value");
    const selectedTextBackgroundOpacityInput = q("#selected-text-background-opacity");
    const selectedTextBackgroundOpacityValue = q("#selected-text-background-opacity-value");
    const selectedTextDeleteButton = q("#selected-text-delete");
    const testSlideToggle = byId("live-enabled");
    const testTextFeedback = byId("text-feedback");
    const testMetaFeedback = byId("meta-feedback");
    const testMetaNameInput = byId("meta-name");
    const testMetaEventDateInput = byId("meta-event-date");
    const birthdayVariantButtons = document.querySelectorAll(".birthday-variant-pill");

    const DEFAULT_TEXT_SIZE = { width: 30, height: 12 };
    const DEFAULT_TEXT_COLOR = "#E10505";
    const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
    const DEFAULT_OPTIONS_BY_KIND = {
      test: { color: DEFAULT_TEXT_COLOR },
      custom: { color: DEFAULT_TEXT_COLOR },
      birthday: { color: "#ffffff" },
      time_change: { color: "#f8fafc" },
      christmas: { color: "#f8fafc" },
    };
    const DEFAULT_LINE_OPTIONS = {
      font_size: 48,
      font_family: "",
      width_percent: DEFAULT_TEXT_SIZE.width,
      height_percent: DEFAULT_TEXT_SIZE.height,
      color: DEFAULT_TEXT_COLOR,
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
    const clampPercent = (value) => clamp(Number(value) || 0, 0, 100);
    const clampOffset = (value) => clamp(Number(value) || 0, -100, 100);
    const normalizeLineOptions = (options, defaults) => ({
      ...defaults,
      ...(options || {}),
    });
    const offsetsFromPosition = (position) => {
      const x = clampPercent(position?.x ?? 50);
      const y = clampPercent(position?.y ?? 50);
      return {
        offset_x_percent: clampOffset(x - 50),
        offset_y_percent: clampOffset(50 - y),
      };
    };
    const positionFromOffsets = (offsetX, offsetY) => ({
      x: clampPercent(50 + (Number(offsetX) || 0)),
      y: clampPercent(50 - (Number(offsetY) || 0)),
    });
    const lineToEntry = (line, index, defaults) => {
      const opts = normalizeLineOptions(line?.options, defaults);
      const name = line?.name || `text${index + 1}`;
      const position = positionFromOffsets(opts.offset_x_percent, opts.offset_y_percent);
      const width = Number.isFinite(Number(opts.width_percent))
        ? Number(opts.width_percent)
        : DEFAULT_TEXT_SIZE.width;
      const height = Number.isFinite(Number(opts.height_percent))
        ? Number(opts.height_percent)
        : DEFAULT_TEXT_SIZE.height;
      const angle = Number.isFinite(Number(opts.angle)) ? Number(opts.angle) : defaults.angle || 0;
      return {
        name,
        value: line?.text || "",
        resolved_value: line?.text || "",
        position,
        size: {
          width,
          height,
        },
        angle,
        color: opts.color || defaults.color || DEFAULT_TEXT_COLOR,
        style: {
          font_family: opts.font_family || DEFAULT_TEXT_STYLE.font_family,
          font_size: Number.isFinite(Number(opts.font_size)) ? Number(opts.font_size) : defaults.font_size,
          bold: Boolean(opts.bold),
          italic: Boolean(opts.italic),
          underline: Boolean(opts.underline),
        },
        background: {
          color: opts.background_color || DEFAULT_TEXT_BACKGROUND.color,
          opacity: clamp(Number(opts.background_opacity) || 0, 0, 1),
        },
      };
    };
    const entryToLine = (entry, existing, defaults) => {
      const base = normalizeLineOptions(existing, defaults);
      const offsets = offsetsFromPosition(entry?.position);
      return {
        text: entry?.value || "",
        options: {
          ...base,
          width_percent: Number.isFinite(Number(entry?.size?.width))
            ? Number(entry?.size?.width)
            : base.width_percent,
          height_percent: Number.isFinite(Number(entry?.size?.height))
            ? Number(entry?.size?.height)
            : base.height_percent,
          color: entry?.color || base.color,
          font_size: Number.isFinite(Number(entry?.style?.font_size))
            ? Number(entry.style.font_size)
            : base.font_size,
          font_family: entry?.style?.font_family || base.font_family,
          underline:
            typeof entry?.style?.underline === "boolean" ? entry.style.underline : base.underline,
          bold: typeof entry?.style?.bold === "boolean" ? entry.style.bold : base.bold,
          italic: typeof entry?.style?.italic === "boolean" ? entry.style.italic : base.italic,
          background_color: entry?.background?.color || base.background_color,
          background_opacity:
            entry?.background?.opacity !== undefined
              ? clamp(Number(entry.background.opacity) || 0, 0, 1)
              : base.background_opacity,
          offset_x_percent: offsets.offset_x_percent,
          offset_y_percent: offsets.offset_y_percent,
          angle: Number.isFinite(Number(entry?.angle)) ? Number(entry.angle) : base.angle,
        },
      };
    };
    const SETTINGS_KEY_BY_KIND = {
      test: "test_slide",
      birthday: "birthday_slide",
      time_change: "time_change_slide",
      christmas: "christmas_slide",
    };
    const createEditorAdapter = (kind, variant) => {
      if (kind === "custom") {
        const slideId = editorRoot?.dataset?.editorSlideId || "";
        const safeSlideId = slideId ? encodeURIComponent(slideId) : "";
        const endpointPrefix = safeSlideId
          ? `api/custom-slides/${safeSlideId}`
          : "api/custom-slides";

        const lineDefaults = {
          ...DEFAULT_LINE_OPTIONS,
          color: DEFAULT_TEXT_COLOR,
        };

        const fetchSettings = async () => {
          if (!safeSlideId) return {};
          const data = await fetchJSON(`${endpointPrefix}/settings`);
          return data || {};
        };

        const updateSettings = async (patch) => {
          if (!safeSlideId) return patch || {};
          const response = await fetchJSON(`${endpointPrefix}/settings`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch || {}),
          });
          return response || patch || {};
        };

        const metaApi = {
          async fetchMeta() {
            if (!safeSlideId) return {};
            const meta = await fetchJSON(`${endpointPrefix}/meta`);
            return meta || {};
          },
          async updateMeta(patch) {
            if (!safeSlideId) return patch || {};
            const response = await fetchJSON(`${endpointPrefix}/meta`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(patch || {}),
            });
            return response || patch || {};
          },
        };

        const backgroundApi = {
          uploadUrl: `${endpointPrefix}/background`,
          async list() {
            if (!safeSlideId) return [];
            const data = await fetchJSON(`${endpointPrefix}/backgrounds`);
            const items = Array.isArray(data?.items) ? data.items : [];
            return items.map((item) => ({
              name: item.filename,
              url: item.url,
              mimetype: item.mimetype,
              is_active: Boolean(item.is_active),
              is_video: Boolean(item.is_video),
              size: item.size,
            }));
          },
          async setActive(filename) {
            if (!safeSlideId) return { filename };
            return fetchJSON(`${endpointPrefix}/background/active`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ filename }),
            });
          },
          async remove(filename) {
            if (!safeSlideId) return { filename };
            return fetchJSON(
              `${endpointPrefix}/background/${encodeURIComponent(filename)}`,
              { method: "DELETE" },
            );
          },
        };

        const linesApi = {
          async list() {
            if (!safeSlideId) return [];
            const data = await fetchJSON(`${endpointPrefix}/texts`);
            const items = Array.isArray(data?.items) ? data.items : [];
            return items;
          },
          async add() {
            if (!safeSlideId) throw new Error("Slide id manquant");
            return fetchJSON(`${endpointPrefix}/texts`, { method: "POST" });
          },
          async update(name, payload) {
            if (!safeSlideId) throw new Error("Slide id manquant");
            return fetchJSON(`${endpointPrefix}/texts/${encodeURIComponent(name)}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload || {}),
            });
          },
          async remove(name) {
            if (!safeSlideId) throw new Error("Slide id manquant");
            return fetchJSON(`${endpointPrefix}/texts/${encodeURIComponent(name)}`, {
              method: "DELETE",
            });
          },
        };

        return {
          kind,
          settingsKey: null,
          supportsMeta: true,
          lineDefaults,
          fetchSettings,
          updateSettings,
          fetchMeta: metaApi.fetchMeta,
          updateMeta: metaApi.updateMeta,
          backgroundApi,
          linesApi,
        };
      }

      const settingsKey = SETTINGS_KEY_BY_KIND[kind] || "test_slide";
      const lineDefaults = {
        ...DEFAULT_LINE_OPTIONS,
        color: DEFAULT_OPTIONS_BY_KIND[kind]?.color || DEFAULT_TEXT_COLOR,
      };

      const fetchSettings = async () => {
        const data = await fetchJSON("api/settings");
        return (data && data[settingsKey]) || {};
      };

      const updateSettings = async (patch) => {
        const payload = { [settingsKey]: patch };
        const response = await fetchJSON("api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return (response && response[settingsKey]) || patch;
      };

      const metaApi =
        kind === "test"
          ? {
              async fetchMeta() {
                const meta = await fetchJSON("api/test/meta");
                return meta || {};
              },
              async updateMeta(patch) {
                const response = await fetchJSON("api/test/meta", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(patch),
                });
                return response || patch;
              },
            }
          : {
              async fetchMeta() {
                return {};
              },
              async updateMeta(patch) {
                return patch || {};
              },
            };

      const backgroundApi = (() => {
        if (kind === "test") {
          return {
            uploadUrl: "api/test/background",
            async list() {
              return fetchJSON("api/test/backgrounds");
            },
            async setActive(filename) {
              return fetchJSON("api/test/background/active", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename }),
              });
            },
            async remove(filename) {
              return fetchJSON(`api/test/background/${encodeURIComponent(filename)}`, {
                method: "DELETE",
              });
            },
            async currentSettings() {
              return fetchSettings();
            },
          };
        }

        const endpointPrefix =
          kind === "birthday"
            ? "api/birthday-slide"
            : kind === "time_change"
            ? "api/time-change-slide"
            : "api/christmas-slide";

        const listEndpoint = `${endpointPrefix}/backgrounds`;
        const uploadUrl = `${endpointPrefix}/background`;
        const deletePrefix = `${endpointPrefix}/background/`;

        const list = async () => {
          const [data, settings] = await Promise.all([fetchJSON(listEndpoint), fetchSettings()]);
          const items = Array.isArray(data?.items) ? data.items : [];
          const active = (settings && settings.background_path) || data?.current?.filename || null;
          return items.map((item) => ({
            name: item.filename,
            url: item.url,
            mimetype: item.mimetype,
            is_active: active ? item.filename === active : false,
          }));
        };

        const setActive = async (filename, mimetype) => {
          const patch = {
            background_path: filename,
            background_mimetype: mimetype || null,
          };
          return updateSettings(patch);
        };

        const remove = async (filename) =>
          fetchJSON(`${deletePrefix}${encodeURIComponent(filename)}`, { method: "DELETE" });

        return {
          uploadUrl,
          list,
          setActive,
          remove,
          currentSettings: fetchSettings,
        };
      })();

      const birthdayConfigApi = {
        async fetchConfig() {
          const v = variant || "before";
          const data = await fetchJSON(`api/birthday-slide/config/${encodeURIComponent(v)}`);
          return (data && data.config) || {};
        },
        async updateConfig(patch) {
          const v = variant || "before";
          const response = await fetchJSON(`api/birthday-slide/config/${encodeURIComponent(v)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          });
          return (response && response.config) || patch;
        },
      };

      const deriveLinesFromSettings = (settings) => {
        const base = settings || {};
        if (Array.isArray(base.lines) && base.lines.length) {
          return base.lines;
        }
        const fallback = [];
        ["text1", "text2", "text3"].forEach((key, idx) => {
          if (typeof base[key] === "string" && base[key].trim()) {
            fallback.push({
              text: base[key],
              options: base[`${key}_options`] || { ...lineDefaults },
              name: `text${idx + 1}`,
            });
          }
        });
        return fallback;
      };

      const linesApi = (() => {
        if (kind === "test") {
          return {
            async list() {
              return fetchJSON("api/test/texts");
            },
            async add() {
              return fetchJSON("api/test/texts", { method: "POST" });
            },
            async update(name, payload) {
              return fetchJSON(`api/test/texts/${encodeURIComponent(name)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
            },
            async remove(name) {
              return fetchJSON(`api/test/texts/${encodeURIComponent(name)}`, { method: "DELETE" });
            },
          };
        }

        if (kind === "birthday") {
          return {
            async list() {
              const config = await birthdayConfigApi.fetchConfig();
              const lines = deriveLinesFromSettings(config);
              return lines.map((line, idx) => lineToEntry(line, idx, lineDefaults));
            },
            async add() {
              const config = await birthdayConfigApi.fetchConfig();
              const lines = [...deriveLinesFromSettings(config)];
              const newEntry = lineToEntry({ text: "[texte]", options: { ...lineDefaults } }, lines.length, lineDefaults);
              lines.push(entryToLine(newEntry, lineDefaults, lineDefaults));
              const updated = await birthdayConfigApi.updateConfig({ lines });
              const normalizedLines = Array.isArray(updated?.lines) ? updated.lines : lines;
              return lineToEntry(normalizedLines[normalizedLines.length - 1], normalizedLines.length - 1, lineDefaults);
            },
            async update(name, payload) {
              const config = await birthdayConfigApi.fetchConfig();
              const lines = [...deriveLinesFromSettings(config)];
              const index = lines.findIndex((_, idx) => `text${idx + 1}` === name || `line${idx + 1}` === name || idx === name);
              if (index < 0) {
                const baseEntry = {
                  text: typeof payload?.value === "string" ? payload.value : "[texte]",
                  options: { ...lineDefaults },
                };
                const newLine = entryToLine(lineToEntry(baseEntry, lines.length, lineDefaults), lineDefaults, lineDefaults);
                lines.push(newLine);
                const created = await birthdayConfigApi.updateConfig({ lines });
                const normalizedLines = Array.isArray(created?.lines) ? created.lines : lines;
                return lineToEntry(normalizedLines[normalizedLines.length - 1], normalizedLines.length - 1, lineDefaults);
              }
              const existing = lines[index];
              const merged = {
                ...existing,
                text: payload.value !== undefined ? payload.value : existing?.text,
              options: normalizeLineOptions(existing?.options, lineDefaults),
              };
              const entry = lineToEntry({ ...merged, name }, index, lineDefaults);
              const updatedLine = entryToLine(
                {
                  ...entry,
                  ...payload,
                  name,
                },
                merged.options,
                lineDefaults
              );
              lines[index] = updatedLine;
              if (payload.value !== undefined && !String(payload.value || "").trim()) {
                lines.splice(index, 1);
              }
              const removed = payload.value !== undefined && !String(payload.value || "").trim();
              const nextConfig = await birthdayConfigApi.updateConfig({ lines });
              if (removed) {
                return { deleted: name };
              }
              const normalizedLines = Array.isArray(nextConfig?.lines) ? nextConfig.lines : lines;
              const currentLine = normalizedLines[Math.min(index, normalizedLines.length - 1)];
              return lineToEntry(currentLine || updatedLine, Math.min(index, normalizedLines.length - 1), lineDefaults);
            },
            async remove(name) {
              const config = await birthdayConfigApi.fetchConfig();
              const lines = Array.isArray(config?.lines) ? [...config.lines] : [];
              const index = lines.findIndex((_, idx) => `text${idx + 1}` === name || `line${idx + 1}` === name || idx === name);
              if (index < 0) {
                throw new Error("Texte introuvable");
              }
              lines.splice(index, 1);
              await birthdayConfigApi.updateConfig({ lines });
              return { deleted: name };
            },
          };
        }

        const linesDefaults = lineDefaults;

        return {
          async list() {
            const settings = await fetchSettings();
            const lines = deriveLinesFromSettings(settings);
            return lines.map((line, idx) => lineToEntry(line, idx, linesDefaults));
          },
          async add() {
            const settings = await fetchSettings();
            const lines = [...deriveLinesFromSettings(settings)];
            const newEntry = lineToEntry({ text: "[texte]", options: { ...linesDefaults } }, lines.length, linesDefaults);
            lines.push(entryToLine(newEntry, linesDefaults, linesDefaults));
            const updated = await updateSettings({ lines });
            const normalizedLines = Array.isArray(updated?.lines) ? updated.lines : lines;
            return lineToEntry(normalizedLines[normalizedLines.length - 1], normalizedLines.length - 1, linesDefaults);
          },
          async update(name, payload) {
            const settings = await fetchSettings();
            const lines = [...deriveLinesFromSettings(settings)];
            const index = lines.findIndex((_, idx) => `text${idx + 1}` === name || `line${idx + 1}` === name || idx === name);
            if (index < 0) {
              const baseEntry = {
                text: typeof payload?.value === "string" ? payload.value : "[texte]",
                options: { ...linesDefaults },
              };
              const newLine = entryToLine(lineToEntry(baseEntry, lines.length, linesDefaults), linesDefaults, linesDefaults);
              lines.push(newLine);
              const created = await updateSettings({ lines });
              const normalizedLines = Array.isArray(created?.lines) ? created.lines : lines;
              return lineToEntry(normalizedLines[normalizedLines.length - 1], normalizedLines.length - 1, linesDefaults);
            }
            const existing = lines[index] || {};
            const mergedOptions = normalizeLineOptions(existing.options, linesDefaults);
            const entry = lineToEntry({ ...existing, name }, index, linesDefaults);
            const updatedLine = entryToLine({ ...entry, ...payload, name }, mergedOptions, linesDefaults);
            lines[index] = updatedLine;
            if (payload.value !== undefined && !String(payload.value || "").trim()) {
              lines.splice(index, 1);
            }
            const updatedSettings = await updateSettings({ lines });
            const removed = payload.value !== undefined && !String(payload.value || "").trim();
            if (removed) {
              return { deleted: name };
            }
            const normalizedLines = Array.isArray(updatedSettings?.lines) ? updatedSettings.lines : lines;
            const currentLine = normalizedLines[Math.min(index, normalizedLines.length - 1)];
            return lineToEntry(currentLine || updatedLine, Math.min(index, normalizedLines.length - 1), linesDefaults);
          },
          async remove(name) {
            const settings = await fetchSettings();
            const lines = Array.isArray(settings?.lines) ? [...settings.lines] : [];
            const index = lines.findIndex((_, idx) => `text${idx + 1}` === name || `line${idx + 1}` === name || idx === name);
            if (index < 0) {
              throw new Error("Texte introuvable");
            }
            lines.splice(index, 1);
            await updateSettings({ lines });
            return { deleted: name };
          },
        };
      })();

      return {
        kind,
        settingsKey,
        supportsMeta: kind === "test",
        lineDefaults,
        fetchSettings,
        updateSettings,
        fetchMeta: metaApi.fetchMeta,
        updateMeta: metaApi.updateMeta,
        backgroundApi,
        linesApi,
      };
    };
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
    const DEFAULT_TEST_SLIDE_SETTINGS = {
      enabled: false,
      order_index: 0,
      duration: 12,
      use_custom_date: false,
      custom_date: "",
    };
    let currentTestSlideSettings = { ...DEFAULT_TEST_SLIDE_SETTINGS };
    const DEFAULT_TEST_META = {
      name: "Diapo personnalisée",
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
    const MIN_TEXT_SIZE = 5;
    const MAX_TEXT_SIZE = 90;
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

    const CENTER_GUIDE_TOLERANCE_PERCENT = 1.5;
    let verticalCenterGuide = null;
    let horizontalCenterGuide = null;

    const ensureCenterGuides = () => {
      if (!testPreviewTextOverlay) return;
      verticalCenterGuide =
        testPreviewTextOverlay.querySelector(".preview-center-line--vertical") || null;
      horizontalCenterGuide =
        testPreviewTextOverlay.querySelector(".preview-center-line--horizontal") || null;

      if (!verticalCenterGuide) {
        verticalCenterGuide = document.createElement("div");
        verticalCenterGuide.className = "preview-center-line preview-center-line--vertical";
        testPreviewTextOverlay.prepend(verticalCenterGuide);
      }
      if (!horizontalCenterGuide) {
        horizontalCenterGuide = document.createElement("div");
        horizontalCenterGuide.className = "preview-center-line preview-center-line--horizontal";
        testPreviewTextOverlay.prepend(horizontalCenterGuide);
      }
    };

    const setCenterGuideVisibility = (showVertical, showHorizontal) => {
      if (verticalCenterGuide) {
        verticalCenterGuide.classList.toggle("is-visible", Boolean(showVertical));
      }
      if (horizontalCenterGuide) {
        horizontalCenterGuide.classList.toggle("is-visible", Boolean(showHorizontal));
      }
    };

    const hideCenterGuides = () => setCenterGuideVisibility(false, false);

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
  let editorAdapter = createEditorAdapter(editorKind, editorVariant);

  const highlightTestBackgroundDropZone = (active) => {
    if (!testBackgroundDropZone) return;
    testBackgroundDropZone.classList.toggle("drag-over", Boolean(active));
  };

  const setActiveVariantUI = (variant) => {
    if (!birthdayVariantButtons || !birthdayVariantButtons.length) return;
    birthdayVariantButtons.forEach((btn) => {
      const isActive = btn.dataset.variant === variant;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  const switchEditorVariant = (variant) => {
    if (editorKind !== "birthday") return;
    if (!variant || variant === editorVariant) return;
    editorVariant = variant;
    if (editorRoot) {
      editorRoot.dataset.editorVariant = variant;
    }
    editorAdapter = createEditorAdapter(editorKind, editorVariant);
    currentSelectedTextName = null;
    hideSelectedTextPanel();
    setActiveVariantUI(variant);
	    void refreshTestSlideSettings();
	    void refreshTestMeta();
	    void refreshTestBackgroundList();
	    void refreshTestTextsList();
	    void refreshTokenInfo({ force: true });
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
    const uploadUrl = editorAdapter.backgroundApi.uploadUrl || "api/test/background";
    const endpoint = buildApiUrl(uploadUrl);
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
  const VARIABLE_TOKEN_PATTERN = /\[[^\]]+\]/;

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
    previewStage.style.setProperty("--slideshow-scale", scale.toString());
  };

  const setupPreviewStageScaling = () => {
    if (!previewFrame || !previewStage) {
      return;
    }
    previewStage.style.setProperty("--preview-base-width", `${previewBaseWidth}px`);
    previewStage.style.setProperty("--preview-base-height", `${previewBaseHeight}px`);
    previewStage.style.setProperty("--slideshow-base-width", `${previewBaseWidth}px`);
    previewStage.style.setProperty("--slideshow-base-height", `${previewBaseHeight}px`);
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
        font_size: Number.isFinite(Number(source.font_size))
          ? Number(source.font_size)
          : DEFAULT_LINE_OPTIONS.font_size,
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
	    if ("use_custom_date" in raw) {
	      result.use_custom_date = Boolean(raw.use_custom_date);
	    }
	    if ("custom_date" in raw) {
	      result.custom_date = typeof raw.custom_date === "string" ? raw.custom_date : "";
	    }
	    return result;
	  };

  const updateTestSlideToggleUI = () => {
    if (testSlideToggle) {
      testSlideToggle.checked = Boolean(currentTestSlideSettings.enabled);
    }
  };

  const updateDateControlUI = (settings = currentTestSlideSettings) => {
    if (!useCustomDateToggle && !customDateInput) {
      return;
    }
    const enabled = Boolean(settings?.use_custom_date);
    if (useCustomDateToggle) {
      useCustomDateToggle.checked = enabled;
    }
    if (customDateInput) {
      customDateInput.disabled = !enabled;
      customDateInput.value = (settings?.custom_date || "").slice(0, 10);
    }
  };

  const refreshTestSlideSettings = async () => {
    try {
      const raw = (await editorAdapter.fetchSettings()) || DEFAULT_TEST_SLIDE_SETTINGS;
      currentTestSlideSettings = normalizeTestSlideSettings(raw);
      updateTestSlideToggleUI();
      updateDateControlUI(currentTestSlideSettings);
    } catch (error) {
      console.warn("Impossible de charger les paramètres de la diapo personnalisée:", error);
    }
  };

	  const persistTestSlideSettings = async (patch) => {
	    try {
	      const raw = (await editorAdapter.updateSettings(patch)) || patch;
	      currentTestSlideSettings = normalizeTestSlideSettings({
	        ...currentTestSlideSettings,
	        ...raw,
	      });
	      updateTestSlideToggleUI();
	      updateDateControlUI(currentTestSlideSettings);
	      void refreshTokenInfo({ force: true });
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
      font_size: Number(card?.dataset?.fontSize),
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
    if (resolved.font_size) {
      card.dataset.fontSize = resolved.font_size;
      card.style.fontSize = `${resolved.font_size}px`;
    }
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

	    const widthPercent = clamp(parseFloat(card.dataset.width) || DEFAULT_TEXT_SIZE.width, MIN_TEXT_SIZE, MAX_TEXT_SIZE);
	    const heightPercent = clamp(parseFloat(card.dataset.height) || DEFAULT_TEXT_SIZE.height, MIN_TEXT_SIZE, MAX_TEXT_SIZE);
	    card.dataset.width = widthPercent;
	    card.dataset.height = heightPercent;

	    const { width: overlayWidth, height: overlayHeight } = getOverlayDimensions();
	    const contentEl = card.querySelector(".preview-text-content");
	    if (editorKind === "test") {
	      if (sharedRenderers?.layoutCustomTextCard) {
	        sharedRenderers.layoutCustomTextCard(card, overlayWidth, overlayHeight);
	        return;
	      }
	    } else if (sharedRenderers?.layoutOverlayTextLine && contentEl) {
	      const opts = {
	        ...DEFAULT_LINE_OPTIONS,
	        width_percent: widthPercent,
	        height_percent: heightPercent,
	        font_family: cardStyle.font_family,
	        angle: Number(card.dataset.angle) || 0,
	      };
	      sharedRenderers.layoutOverlayTextLine(
	        card,
	        contentEl,
	        displayValue,
	        rawValue,
	        opts,
	        overlayWidth,
	        overlayHeight,
	      );
	      return;
	    }
	    const cardWidthPx = overlayWidth * (widthPercent / 100);
	    const cardHeightPx = overlayHeight * (heightPercent / 100);
	    const horizontalPaddingPx = Math.min(
	      Math.max(cardWidthPx * CARD_HORIZONTAL_PADDING_RATIO, MIN_HORIZONTAL_PADDING_PX),
	      cardWidthPx * CARD_MAX_PADDING_RATIO,
    );
    const verticalPaddingPx = Math.min(
      Math.max(cardHeightPx * CARD_VERTICAL_PADDING_RATIO, MIN_VERTICAL_PADDING_PX),
      cardHeightPx * CARD_MAX_PADDING_RATIO,
    );

    card.style.width = `${widthPercent}%`;
    card.style.height = `${heightPercent}%`;
    card.style.display = "flex";
    card.style.justifyContent = "center";
    card.style.alignItems = "center";
    card.style.padding = `${verticalPaddingPx}px ${horizontalPaddingPx}px`;
    card.style.textAlign = "center";
    card.style.whiteSpace = "pre";
    card.style.wordBreak = "normal";
    card.style.overflow = "visible";
    card.style.boxSizing = "border-box";

    const lines = displayValue.split(/\r?\n/);
    const availableHeightPx = Math.max(4, cardHeightPx - verticalPaddingPx * 2);
    let fontSize = computeFontSizeForCard(availableHeightPx, displayValue);
    const fontStack = getFontStack(cardStyle.font_family);
    let blockMetrics = measureTextBlock(lines, fontSize, fontStack);
    if (blockMetrics.height > availableHeightPx) {
      const ratio = clamp(availableHeightPx / blockMetrics.height, 0.1, 1);
      const adjusted = Math.max(MIN_FONT_SIZE, Math.floor(fontSize * ratio));
      if (adjusted !== fontSize) {
        fontSize = adjusted;
        blockMetrics = measureTextBlock(lines, fontSize, fontStack);
      }
    }
    const availableWidthPx = Math.max(4, cardWidthPx - horizontalPaddingPx * 2);
    const hasVariables = VARIABLE_TOKEN_PATTERN.test(rawValue);
    const widthScale = hasVariables ? 1 : clamp(availableWidthPx / blockMetrics.width, 0.25, 4);

	    card.dataset.fontSize = fontSize;
	    card.style.fontSize = `${fontSize}px`;
	    card.style.lineHeight = TEXT_LINE_HEIGHT.toString();
	    if (contentEl) {
	      contentEl.style.transformOrigin = "center";
	      contentEl.style.transform = hasVariables ? "none" : `scale(${widthScale}, 1)`;
	      contentEl.style.lineHeight = TEXT_LINE_HEIGHT.toString();
	      contentEl.style.alignItems = "center";
	      contentEl.style.justifyContent = "center";
	      contentEl.style.textAlign = "center";
	      contentEl.style.fontSize = `${fontSize}px`;
	    }
	  };

  const createPreviewTextCard = (entry) => {
    if (!entry) return null;
    const rawValue = entry.value || "";
    if (!rawValue.trim()) return null;
	    const card = document.createElement("div");
	    const extraClasses =
	      editorKind === "test"
	        ? " custom-slide-text-card"
	        : editorKind === "time_change"
	        ? " time-change-line"
	        : editorKind === "christmas"
	        ? " christmas-line"
	        : "";
	    card.className = `preview-text-card${extraClasses}`;
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
	    card.dataset.angle = Number.isFinite(Number(entry.angle)) ? String(entry.angle) : "0";
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
    ensureCenterGuides();
    hideCenterGuides();
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
      selectedTextBackgroundOpacityInput.style.setProperty("--opacity-percent", "0%");
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

  const updateOpacitySliderFill = (percent) => {
    if (!selectedTextBackgroundOpacityInput) return;
    const clamped = clamp(Number(percent) || 0, 0, 100);
    selectedTextBackgroundOpacityInput.style.setProperty("--opacity-percent", `${clamped}%`);
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
      const percent = Math.round(background.opacity * 100);
      selectedTextBackgroundOpacityInput.value = `${percent}`;
      updateOpacitySliderFill(percent);
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

  const getPreviewCardByName = (name) => {
    if (!name || !testPreviewTextOverlay) return null;
    const selector = `.preview-text-card[data-name="${escapeSelectorValue(name)}"]`;
    return testPreviewTextOverlay.querySelector(selector);
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
      currentSelectedTextName = card.dataset.name || null;
      updateSelectedTextPanel(card.dataset.name);
    } else {
      currentSelectedTextName = null;
      hideSelectedTextPanel();
    }
  };
  const clearSelection = () => {
    const current = testPreviewTextOverlay?.querySelector(".preview-text-card.is-selected");
    if (current) {
      current.classList.remove("is-selected");
    }
    currentSelectedTextName = null;
    hideSelectedTextPanel();
  };

  const handleTextPointerDown = (event) => {
    const card = event.currentTarget;
    if (!card) return;
    ensureCenterGuides();
    hideCenterGuides();
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
    // Ne pas stopPropagation pour autoriser les clics à remonter sur l'overlay si nécessaire.
    if (card.setPointerCapture) {
      card.setPointerCapture(event.pointerId);
    }
  };

  const handleResizePointerDown = (event) => {
    event.stopPropagation();
    event.preventDefault();
    ensureCenterGuides();
    hideCenterGuides();
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
	      hideCenterGuides();
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
	    ensureCenterGuides();
	    const nearCenterX = Math.abs(x - 50) <= CENTER_GUIDE_TOLERANCE_PERCENT;
	    const nearCenterY = Math.abs(y - 50) <= CENTER_GUIDE_TOLERANCE_PERCENT;
	    setCenterGuideVisibility(nearCenterX, nearCenterY);
	  };

	  const handleTextPointerUp = (event) => {
	    if (!dragState.card) return;
	    hideCenterGuides();
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
    if (testMetaNameInput) {
      testMetaNameInput.value = currentTestMeta.name || "";
    }
    if (testMetaEventDateInput) {
      testMetaEventDateInput.value = (currentTestMeta.event_date || "").slice(0, 10);
    }
    updateTestPreviewTexts(currentTestTexts);
  };

  const refreshTestMeta = async () => {
    if (!editorAdapter.supportsMeta) {
      applyMetaToInputs();
      return;
    }
    try {
      const meta = await editorAdapter.fetchMeta();
      currentTestMeta = { ...DEFAULT_TEST_META, ...(meta || {}) };
      applyMetaToInputs();
    } catch (error) {
      console.warn("Impossible de charger les métadonnées de la diapo personnalisée:", error);
    }
  };

  const persistTestMeta = async (patch) => {
    if (!patch || !Object.keys(patch).length || !editorAdapter.supportsMeta) {
      return;
    }
    try {
      const response = await editorAdapter.updateMeta(patch);
      currentTestMeta = { ...DEFAULT_TEST_META, ...(response || {}) };
      applyMetaToInputs();
      setTestMetaFeedback("Informations enregistrées.", "success");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des métadonnées Test:", error);
      setTestMetaFeedback("Erreur lors de l'enregistrement.", "error");
    }
  };

  const queueMetaUpdate = (patch) => {
    if (!editorAdapter.supportsMeta) {
      return;
    }
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

  if (testMetaNameInput) {
    testMetaNameInput.addEventListener("input", () => {
      const value = testMetaNameInput.value || "";
      currentTestMeta = { ...currentTestMeta, name: value };
      applyMetaToInputs();
      queueMetaUpdate({ name: value });
    });
  }

  if (testMetaEventDateInput) {
    testMetaEventDateInput.addEventListener("input", () => {
      const value = testMetaEventDateInput.value || "";
      currentTestMeta = { ...currentTestMeta, event_date: value };
      applyMetaToInputs();
      queueMetaUpdate({ event_date: value });
    });
  }

  const openVariablesModal = () => {
    if (!variablesModal) return;
    variablesModal.classList.add("is-visible");
    variablesModal.setAttribute("aria-hidden", "false");
    lastFocusedModalTrigger = document.activeElement;
    const firstButton = variablesModal.querySelector(".editor-variable-button");
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

	  const BIRTHDAY_WEEKDAY_KEYS = [
	    "sunday",
	    "monday",
	    "tuesday",
	    "wednesday",
	    "thursday",
	    "friday",
	    "saturday",
	  ];

	  const DEFAULT_OPEN_DAYS = {
	    monday: true,
	    tuesday: true,
	    wednesday: true,
	    thursday: true,
	    friday: true,
	    saturday: false,
	    sunday: false,
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

	  const formatBirthdayMeta = (birthdayDate) => {
	    if (!(birthdayDate instanceof Date) || Number.isNaN(birthdayDate)) {
	      return { weekday: "", fullDate: "" };
	    }
	    let weekday = "";
	    try {
	      weekday = new Intl.DateTimeFormat("fr-CA", { timeZone: "UTC", weekday: "long" }).format(
	        birthdayDate,
	      );
	      weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
	    } catch (error) {
	      weekday = "";
	    }
	    let fullDate = "";
	    try {
	      fullDate = new Intl.DateTimeFormat("fr-CA", {
	        timeZone: "UTC",
	        day: "numeric",
	        month: "long",
	        year: "numeric",
	      }).format(birthdayDate);
	    } catch (error) {
	      fullDate = birthdayDate.toISOString().slice(0, 10);
	    }
	    return { weekday, fullDate };
	  };

	  let timeChangeTokenInfo = null;
	  let christmasTokenInfo = null;
	  let birthdayTokenInfo = null;
	  let tokenInfoFetchedAt = 0;
	  let tokenInfoFetchPromise = null;
	  const TOKEN_INFO_TTL_MS = 30_000;

	  const computeBirthdayTokenInfo = (employeesList, settings) => {
	    const openDays = normalizeOpenDays(settings?.open_days);
	    const daysBeforeRaw = Number(settings?.days_before);
	    const daysBefore =
	      Number.isFinite(daysBeforeRaw) && daysBeforeRaw >= 0 && daysBeforeRaw <= 365
	        ? daysBeforeRaw
	        : 3;

	    const now = new Date();
	    const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
	    const dayMs = 24 * 60 * 60 * 1000;

	    const displayableGroups = new Map();
	    const upcomingGroups = new Map();

	    const addToGroup = (map, key, payload) => {
	      if (!map.has(key)) {
	        map.set(key, payload);
	      } else {
	        const existing = map.get(key);
	        existing.employees.push(...payload.employees);
	      }
	    };

	    const employees = Array.isArray(employeesList) ? employeesList : [];
	    employees.forEach((emp) => {
	      const next = computeNextBirthdayDate(emp?.birthday);
	      if (!next) return;
	      const announce = computeBirthdayAnnounceDate(next, openDays);
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

	      const groupKey = next.getTime();
	      const targetMap = displayAllowed ? displayableGroups : upcomingGroups;
	      addToGroup(targetMap, groupKey, {
	        birthday: next,
	        daysUntilBirthday: daysToBirthday,
	        employees: [emp],
	      });
	    });

	    const pickEarliest = (map) => {
	      const values = Array.from(map.values());
	      if (!values.length) return null;
	      values.sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
	      return values[0];
	    };

	    const chosen = pickEarliest(displayableGroups) || pickEarliest(upcomingGroups);
	    if (!chosen) return null;

	    const names = chosen.employees
	      .map((e) => (e && typeof e.name === "string" ? e.name.trim() : ""))
	      .filter(Boolean);
	    const namesText =
	      names.length === 0
	        ? ""
	        : names.length === 1
	          ? names[0]
	          : `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
	    const { weekday, fullDate } = formatBirthdayMeta(chosen.birthday);

	    return {
	      namesText,
	      days: chosen.daysUntilBirthday,
	      weekday,
	      fullDate,
	    };
	  };

	  const refreshTokenInfo = async ({ force = false } = {}) => {
	    if (editorKind === "test") {
	      tokenInfoFetchedAt = Date.now();
	      updateTestPreviewTexts(currentTestTexts);
	      if (currentSelectedTextName) {
	        reselectCurrentText();
	      }
	      return;
	    }

	    const nowMs = Date.now();
	    if (!force && nowMs - tokenInfoFetchedAt < TOKEN_INFO_TTL_MS) {
	      return;
	    }
	    if (tokenInfoFetchPromise) {
	      return tokenInfoFetchPromise;
	    }

	    tokenInfoFetchPromise = (async () => {
	      try {
	        if (editorKind === "time_change") {
	          const data = await fetchJSON("api/time-change-slide/next");
	          timeChangeTokenInfo = data && data.change ? data.change : null;
	        } else if (editorKind === "christmas") {
	          const data = await fetchJSON("api/christmas-slide/next");
	          christmasTokenInfo = data && data.christmas ? data.christmas : null;
	        } else if (editorKind === "birthday") {
	          const [employeesData, settings] = await Promise.all([
	            fetchJSON("api/employees").catch(() => ({ employees: [] })),
	            editorAdapter.fetchSettings().catch(() => ({})),
	          ]);
	          const employees = Array.isArray(employeesData?.employees) ? employeesData.employees : [];
	          birthdayTokenInfo = computeBirthdayTokenInfo(employees, settings);
	        }
	      } catch (error) {
	        console.warn("Impossible de rafraîchir les variables d'aperçu:", error);
	      } finally {
	        tokenInfoFetchedAt = Date.now();
	        tokenInfoFetchPromise = null;
	        updateTestPreviewTexts(currentTestTexts);
	        if (currentSelectedTextName) {
	          reselectCurrentText();
	        }
	      }
	    })();

	    return tokenInfoFetchPromise;
	  };

	  const buildTestTokenMap = () => {
	    const now = new Date();
	    const eventDate = parseEventDateString(currentTestMeta.event_date);
	    const daysLeft = getDaysUntilEvent(eventDate);
	    const countdown = `${daysLeft} ${getDayLabel(daysLeft)}`;
	    const weekdayLower = formatWeekday(now, { capitalize: false });
	    const weekdayUpper = formatWeekday(now, { capitalize: true });
	    const monthLower = formatMonth(now, { capitalize: false });
	    const monthUpper = formatMonth(now, { capitalize: true });
	    return {
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
	  };

	  const buildTimeChangeTokenMap = () => {
	    const change = timeChangeTokenInfo || {};
	    const days = Number.isFinite(Number(change.days_until)) ? Number(change.days_until) : null;
	    const seasonWord =
	      change.season === "winter"
	        ? "hiver"
	        : change.season === "summer"
	          ? "été"
	          : (change.season_label || "").replace("d'", "").replace("de ", "") || "";
	    return {
	      "[change_weekday]": change.weekday_label || "",
	      "[change_date]": change.date_label || "",
	      "[change_time]": change.time_label || "",
	      "[direction_verb]":
	        change.direction_label || (change.direction === "backward" ? "reculer" : "avancer"),
	      "[offset_hours]": change.offset_hours != null ? String(change.offset_hours) : "1",
	      "[offset_from]": change.offset_from || "",
	      "[offset_to]": change.offset_to || "",
	      "[days_until]": days != null ? String(days) : "",
	      "[days_left]": days != null ? String(days) : "",
	      "[days_label]": getDayLabel(days != null ? days : 0),
	      "[season_label]": change.season_label || "",
	      "[seasons]": seasonWord,
	    };
	  };

	  const buildChristmasTokenMap = () => {
	    const info = christmasTokenInfo || {};
	    const days = Number.isFinite(Number(info.days_until)) ? Number(info.days_until) : null;
	    return {
	      "[days_until]": days != null ? String(days) : "",
	      "[days_left]": days != null ? String(days) : "",
	      "[days_label]": getDayLabel(days != null ? days : 0),
	      "[christmas_date]": info.date_label || "25 décembre",
	      "[christmas_weekday]": info.weekday_label || "",
	      "[year]": info.year != null ? String(info.year) : String(new Date().getFullYear()),
	    };
	  };

	  const buildBirthdayTokenMap = () => {
	    const data = birthdayTokenInfo || {};
	    const days = Number.isFinite(Number(data.days)) ? Number(data.days) : null;
	    return {
	      "[name]": data.namesText || "",
	      "[days]": days != null ? String(days) : "",
	      "[day_label]": getDayLabel(days != null ? days : 0),
	      "[birthday_weekday]": data.weekday || "",
	      "[date]": data.fullDate || "",
	    };
	  };

	  const buildTokenMap = () => {
	    if (editorKind === "test") return buildTestTokenMap();
	    if (editorKind === "time_change") return buildTimeChangeTokenMap();
	    if (editorKind === "christmas") return buildChristmasTokenMap();
	    if (editorKind === "birthday") return buildBirthdayTokenMap();
	    return {};
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
      const items = await editorAdapter.linesApi.list();
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

  const updateTestText = async (name, patch) => {
    if (!name) return;
    const payload =
      patch && typeof patch === "object" && !Array.isArray(patch) ? patch : { value: patch };
    try {
      const response = await editorAdapter.linesApi.update(name, payload);
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
      mergeUpdatedTextEntry(name, response);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du texte :", error);
      setTestTextFeedback("Erreur lors de l'enregistrement du texte.", "error");
    }
  };

	  const mergeUpdatedTextEntry = (name, response) => {
	    if (!response) return;
	    if (response.deleted) {
      currentTestTexts = currentTestTexts.filter((entry) => entry.name !== name);
      updateTestPreviewTexts(currentTestTexts);
      if (currentSelectedTextName === name) {
        hideSelectedTextPanel();
      }
      return;
    }
	    const normalizedPosition = response.position || { x: 50, y: 50 };
	    const normalizedSize = response.size || { ...DEFAULT_TEXT_SIZE };
	    const existingAngle = currentTestTexts.find((entry) => entry.name === name)?.angle;
	    const normalizedAngle = Number.isFinite(Number(response.angle))
	      ? Number(response.angle)
	      : Number.isFinite(Number(existingAngle))
	      ? Number(existingAngle)
	      : 0;
	    const normalized = {
	      name,
	      value: response.value || "",
	      resolved_value: response.resolved_value || resolveTokens(response.value || ""),
	      position: normalizedPosition,
	      size: normalizedSize,
	      angle: normalizedAngle,
	      color: response.color || DEFAULT_TEXT_COLOR,
	      style: getEntryStyle(response),
	      background: getEntryBackground(response),
	    };
    const index = currentTestTexts.findIndex((entry) => entry.name === name);
    if (index >= 0) {
      currentTestTexts[index] = { ...currentTestTexts[index], ...normalized };
    } else {
      currentTestTexts.push(normalized);
    }
    updateTestPreviewTexts(currentTestTexts);
    if (currentSelectedTextName === name) {
      updateSelectedTextPanel(name);
      reselectCurrentText();
    }
  };

  const updateTestTextPosition = async (name, position) => {
    if (!name || !position) return;
    try {
      const response = await editorAdapter.linesApi.update(name, { position });
      setTestTextFeedback(`Position de ${name} enregistrée.`, "success");
      mergeUpdatedTextEntry(name, response);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la position :", error);
      setTestTextFeedback("Erreur lors de la mise à jour de la position.", "error");
    }
  };

  const updateTestTextSize = async (name, size) => {
    if (!name || !size) return;
    try {
      const response = await editorAdapter.linesApi.update(name, { size });
      setTestTextFeedback(`Taille de ${name} enregistrée.`, "success");
      const returnedSize = response?.size || size;
      mergeUpdatedTextEntry(name, { ...response, size: returnedSize });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la taille :", error);
      setTestTextFeedback("Erreur lors de la mise à jour de la taille.", "error");
    }
  };

  const updateTestTextColor = async (name, color) => {
    if (!name || !isValidHexColor(color)) return;
    const normalizedColor = normalizeColorValue(color);
    try {
      const response = await editorAdapter.linesApi.update(name, { color: normalizedColor });
      setTestTextFeedback(`Couleur de ${name} enregistrée.`, "success");
      const returnedColor = response?.color || normalizedColor;
      mergeUpdatedTextEntry(name, { ...response, color: returnedColor });
      if (currentSelectedTextName === name) {
        if (selectedTextColorInput) {
          selectedTextColorInput.value = returnedColor;
        }
        if (selectedTextColorValue) {
          selectedTextColorValue.textContent = formatColorLabel(returnedColor);
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
      const response = await editorAdapter.linesApi.update(name, { style: normalizedStyle });
      setTestTextFeedback(`Style de ${name} enregistré.`, "success");
      const returnedStyle = normalizeStylePayload(response?.style || normalizedStyle);
      mergeUpdatedTextEntry(name, { ...response, style: returnedStyle });
      if (currentSelectedTextName === name) {
        if (selectedTextFontSelect) {
          selectedTextFontSelect.value = returnedStyle.font_family;
        }
        updateStyleToggleUI(returnedStyle, true);
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
      const response = await editorAdapter.linesApi.update(name, { background: normalizedBackground });
      setTestTextFeedback(`Fond de ${name} enregistré.`, "success");
      const returnedBackground = normalizeBackgroundOptions(response?.background || normalizedBackground);
      mergeUpdatedTextEntry(name, { ...response, background: returnedBackground });
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
    } catch (error) {
      console.error("Erreur lors de la mise à jour du fond :", error);
      setTestTextFeedback("Erreur lors de la mise à jour du fond.", "error");
    }
  };

  const addTestText = async () => {
    if (!testTextAddButton) return;
    setTestTextFeedback("Création d'un nouveau texte...");
    try {
      const response = await editorAdapter.linesApi.add();
      const newName = response?.name;
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
      await editorAdapter.linesApi.remove(name);
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

  const applyColorChanges = (name, color, persist = false) => {
    if (!name || !isValidHexColor(color)) return;
    const nextColor = normalizeColorValue(color);
    const index = currentTestTexts.findIndex((item) => item.name === name);
    if (index >= 0) {
      currentTestTexts[index] = { ...currentTestTexts[index], color: nextColor };
    }
    const card = getPreviewCardByName(name);
    if (card) {
      card.dataset.color = nextColor;
      card.style.color = nextColor;
    }
    if (currentSelectedTextName === name && selectedTextColorValue) {
      selectedTextColorValue.textContent = formatColorLabel(nextColor);
    }
    if (persist) {
      void updateTestTextColor(name, nextColor);
    }
  };

  const applyBackgroundChanges = (name, changes, persist = false) => {
    if (!name) return;
    const entry = currentTestTexts.find((item) => item.name === name);
    const baseBackground = getEntryBackground(entry || {});
    const nextBackground = normalizeBackgroundOptions({ ...baseBackground, ...changes });
    const index = currentTestTexts.findIndex((item) => item.name === name);
    if (index >= 0) {
      currentTestTexts[index] = { ...currentTestTexts[index], background: nextBackground };
    }
    const card = getPreviewCardByName(name);
    if (card) {
      applyCardBackground(card, nextBackground);
    }
    if (currentSelectedTextName === name) {
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
    if (persist) {
      void updateTestTextBackground(name, nextBackground);
    }
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
      void setTestBackgroundActive(entry.name, entry.mimetype);
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
      const items = await editorAdapter.backgroundApi.list();
      renderTestBackgroundList(items);
    } catch (error) {
      console.error("Erreur lors du chargement des fonds de test :", error);
    }
  };

  async function setTestBackgroundActive(filename, mimetype) {
    if (!filename) return;
    setTestBackgroundFeedback(`Utilisation de ${filename}…`);
    try {
      if (editorAdapter.backgroundApi.setActive) {
        await editorAdapter.backgroundApi.setActive(filename, mimetype);
      }
      setTestBackgroundFeedback(`Fond ${filename} actif.`, "success");
      await refreshTestBackgroundList();
    } catch (error) {
      console.error("Erreur lors de la sélection du fond :", error);
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
      if (editorAdapter.backgroundApi.remove) {
        await editorAdapter.backgroundApi.remove(filename);
      }
      setTestBackgroundFeedback(`Fond ${filename} supprimé.`, "success");
      await refreshTestBackgroundList();
    } catch (error) {
      console.error("Erreur lors de la suppression du fond :", error);
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
    if (editorKind === "birthday" && birthdayVariantButtons?.length) {
      birthdayVariantButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const variant = btn.dataset.variant || "";
          switchEditorVariant(variant);
        });
      });
      setActiveVariantUI(editorVariant || "before");
    }
    if (useCustomDateToggle || customDateInput) {
      updateDateControlUI(currentTestSlideSettings);

      useCustomDateToggle?.addEventListener("change", (event) => {
        const enabled = Boolean(event.target.checked);
        if (customDateInput) {
          customDateInput.disabled = !enabled;
        }
        void persistTestSlideSettings({
          use_custom_date: enabled,
          custom_date: customDateInput?.value || "",
        });
      });

      customDateInput?.addEventListener("input", (event) => {
        const value = event.target.value || "";
        if (useCustomDateToggle) {
          useCustomDateToggle.checked = Boolean(value);
        }
        if (customDateInput) {
          customDateInput.disabled = !value;
        }
        void persistTestSlideSettings({
          use_custom_date: Boolean(value),
          custom_date: value,
        });
      });
    }
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
      applyColorChanges(currentSelectedTextName, value, false);
    });
    selectedTextColorInput?.addEventListener("change", (event) => {
      if (!currentSelectedTextName) return;
      const value = event.target.value;
      if (!isValidHexColor(value)) return;
      applyColorChanges(currentSelectedTextName, value, true);
    });
    selectedTextBackgroundColorInput?.addEventListener("input", (event) => {
      if (!currentSelectedTextName) return;
      const value = normalizeColorValue(event.target.value);
      applyBackgroundChanges(currentSelectedTextName, { color: value }, false);
    });
    selectedTextBackgroundColorInput?.addEventListener("change", (event) => {
      if (!currentSelectedTextName) return;
      const value = normalizeColorValue(event.target.value);
      applyBackgroundChanges(currentSelectedTextName, { color: value }, true);
    });
    selectedTextBackgroundOpacityInput?.addEventListener("input", (event) => {
      if (!currentSelectedTextName) return;
      const percent = clamp(Number(event.target.value) || 0, 0, 100);
      event.target.value = `${percent}`;
      if (selectedTextBackgroundOpacityValue) {
        selectedTextBackgroundOpacityValue.textContent = `${percent}%`;
      }
      updateOpacitySliderFill(percent);
      applyBackgroundChanges(currentSelectedTextName, { opacity: percent / 100 }, false);
    });
    selectedTextBackgroundOpacityInput?.addEventListener("change", (event) => {
      if (!currentSelectedTextName) return;
      const percent = clamp(Number(event.target.value) || 0, 0, 100);
      updateOpacitySliderFill(percent);
      applyBackgroundChanges(currentSelectedTextName, { opacity: percent / 100 }, true);
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
	    testPreviewTextOverlay?.addEventListener("pointerdown", (event) => {
	      const targetCard = event.target?.closest?.(".preview-text-card");
	      if (!targetCard) {
	        clearSelection();
	      }
	    });
	    void refreshTestBackgroundList();
	    void refreshTestTextsList();
	    void refreshTokenInfo({ force: true });
	  };

    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  };

  boot();
})();
