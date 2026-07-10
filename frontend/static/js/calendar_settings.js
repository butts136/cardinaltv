(() => {
  const boot = () => {
    const appGlobals = window.CardinalApp || {};
    const { fetchJSON } = appGlobals;

    if (!fetchJSON) {
      setTimeout(boot, 50);
      return;
    }

    const root = document.getElementById("calendar-settings-page");
    if (!root) return;

    const settingsUrl = root.dataset.settingsUrl || "api/settings";
    const previewUrl = root.dataset.previewUrl || "slideshow?preview=1&slide=vacations&hide_bands=1";
    const previewShell = document.getElementById("calendar-settings-preview-frame");
    const previewFrame = document.getElementById("calendar-settings-preview");
    const saveButton = document.getElementById("calendar-settings-save");
    const reloadButton = document.getElementById("calendar-settings-reload");
    const statusNode = document.getElementById("calendar-settings-status");

    const PREVIEW_WIDTH = 1920;
    const PREVIEW_HEIGHT = 1080;
    const DEFAULTS = {
      months_to_show: 12,
      layout_mode: "two_columns",
      title_font_size: 62,
      month_font_size: 36,
      weekday_font_size: 20,
      day_font_size: 24,
      badge_font_size: 22,
      legend_font_size: 22,
      scroll_start_delay_ms: 5000,
      pause_at_bottom_ms: 5000,
      scroll_speed_px_per_second: 18,
      duration: 20,
    };

    const fields = {
      layout_mode: document.getElementById("calendar-layout-mode"),
      months_to_show: document.getElementById("calendar-months-to-show"),
      title_font_size: document.getElementById("calendar-title-font-size"),
      month_font_size: document.getElementById("calendar-month-font-size"),
      weekday_font_size: document.getElementById("calendar-weekday-font-size"),
      day_font_size: document.getElementById("calendar-day-font-size"),
      badge_font_size: document.getElementById("calendar-badge-font-size"),
      legend_font_size: document.getElementById("calendar-legend-font-size"),
      scroll_start_delay_seconds: document.getElementById("calendar-scroll-start-delay"),
      pause_at_bottom_seconds: document.getElementById("calendar-pause-bottom"),
      scroll_speed_px_per_second: document.getElementById("calendar-scroll-speed"),
      duration: document.getElementById("calendar-duration"),
    };

    let isSaving = false;
    let hasUnsavedChanges = false;
    let previewRefreshTimer = null;

    const stripHtml = (value) => String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    const errorMessage = (error) => {
      const message = error instanceof Error ? error.message : String(error || "");
      return stripHtml(message) || "Erreur inattendue.";
    };

    const setStatus = (message, state = "info") => {
      if (!statusNode) return;
      statusNode.textContent = message || "";
      if (message) {
        statusNode.dataset.state = state;
      } else {
        delete statusNode.dataset.state;
      }
    };

    const setBusy = (busy) => {
      isSaving = busy;
      if (saveButton) saveButton.disabled = busy;
      if (reloadButton) reloadButton.disabled = busy;
      Object.values(fields).forEach((field) => {
        if (field) field.disabled = busy;
      });
    };

    const toNumber = (value, fallback, { min = -Infinity, max = Infinity, integer = false } = {}) => {
      const parsed = Number(value);
      const normalized = Number.isFinite(parsed) ? parsed : fallback;
      const clamped = Math.max(min, Math.min(max, normalized));
      return integer ? Math.round(clamped) : clamped;
    };

    const formatSeconds = (milliseconds, fallbackMs) => {
      const value = toNumber(milliseconds, fallbackMs, { min: 0, max: 60000 }) / 1000;
      return Number.isInteger(value) ? String(value) : value.toFixed(1);
    };

    const setFieldValue = (key, value) => {
      if (fields[key]) fields[key].value = String(value);
    };

    const populate = (settings = {}) => {
      const layoutMode = ["two_columns", "one_column", "continuous"].includes(settings.layout_mode)
        ? settings.layout_mode
        : DEFAULTS.layout_mode;
      setFieldValue("layout_mode", layoutMode);
      setFieldValue("months_to_show", toNumber(settings.months_to_show, DEFAULTS.months_to_show, {
        min: 1,
        max: 24,
        integer: true,
      }));
      [
        "title_font_size",
        "month_font_size",
        "weekday_font_size",
        "day_font_size",
        "badge_font_size",
        "legend_font_size",
        "scroll_speed_px_per_second",
        "duration",
      ].forEach((key) => {
        setFieldValue(key, toNumber(settings[key], DEFAULTS[key], { min: 1, max: key === "duration" ? 600 : 300 }));
      });
      setFieldValue("scroll_start_delay_seconds", formatSeconds(settings.scroll_start_delay_ms, DEFAULTS.scroll_start_delay_ms));
      setFieldValue("pause_at_bottom_seconds", formatSeconds(settings.pause_at_bottom_ms, DEFAULTS.pause_at_bottom_ms));
      hasUnsavedChanges = false;
    };

    const collect = () => ({
      layout_mode: ["two_columns", "one_column", "continuous"].includes(fields.layout_mode?.value)
        ? fields.layout_mode.value
        : DEFAULTS.layout_mode,
      months_to_show: toNumber(fields.months_to_show?.value, DEFAULTS.months_to_show, {
        min: 1,
        max: 24,
        integer: true,
      }),
      title_font_size: toNumber(fields.title_font_size?.value, DEFAULTS.title_font_size, { min: 8, max: 120 }),
      month_font_size: toNumber(fields.month_font_size?.value, DEFAULTS.month_font_size, { min: 8, max: 120 }),
      weekday_font_size: toNumber(fields.weekday_font_size?.value, DEFAULTS.weekday_font_size, { min: 8, max: 120 }),
      day_font_size: toNumber(fields.day_font_size?.value, DEFAULTS.day_font_size, { min: 8, max: 120 }),
      badge_font_size: toNumber(fields.badge_font_size?.value, DEFAULTS.badge_font_size, { min: 8, max: 120 }),
      legend_font_size: toNumber(fields.legend_font_size?.value, DEFAULTS.legend_font_size, { min: 8, max: 120 }),
      scroll_start_delay_ms: Math.round(toNumber(fields.scroll_start_delay_seconds?.value, 5, {
        min: 0,
        max: 60,
      }) * 1000),
      pause_at_bottom_ms: Math.round(toNumber(fields.pause_at_bottom_seconds?.value, 5, {
        min: 0,
        max: 60,
      }) * 1000),
      scroll_speed_px_per_second: toNumber(fields.scroll_speed_px_per_second?.value, DEFAULTS.scroll_speed_px_per_second, {
        min: 1,
        max: 300,
      }),
      duration: toNumber(fields.duration?.value, DEFAULTS.duration, { min: 1, max: 600 }),
    });

    const syncPreviewScale = () => {
      if (!previewShell) return;
      const rect = previewShell.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const scale = Math.min(rect.width / PREVIEW_WIDTH, rect.height / PREVIEW_HEIGHT);
      previewShell.style.setProperty("--calendar-settings-preview-scale", String(scale));
    };

    const refreshPreview = () => {
      if (!previewFrame) return;
      if (previewRefreshTimer) clearTimeout(previewRefreshTimer);
      previewRefreshTimer = setTimeout(() => {
        previewRefreshTimer = null;
        const separator = previewUrl.includes("?") ? "&" : "?";
        previewFrame.src = `${previewUrl}${separator}settings_refresh=${Date.now()}`;
      }, 120);
    };

    const load = async () => {
      setBusy(true);
      setStatus("Chargement...", "info");
      try {
        const data = await fetchJSON(settingsUrl);
        populate(data?.vacations_slide || DEFAULTS);
        setStatus("", "info");
        refreshPreview();
      } catch (error) {
        setStatus(errorMessage(error), "error");
      } finally {
        setBusy(false);
      }
    };

    const save = async () => {
      if (isSaving) return;
      setBusy(true);
      setStatus("Enregistrement...", "info");
      try {
        const data = await fetchJSON(settingsUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vacations_slide: collect() }),
        });
        populate(data?.vacations_slide || DEFAULTS);
        setStatus("Paramètres enregistrés.", "success");
        refreshPreview();
      } catch (error) {
        setStatus(errorMessage(error), "error");
      } finally {
        setBusy(false);
      }
    };

    Object.values(fields).forEach((field) => {
      if (!field) return;
      field.addEventListener("input", () => {
        hasUnsavedChanges = true;
        if (statusNode?.dataset.state !== "error") {
          setStatus("Modifications non enregistrées.", "info");
        }
      });
    });

    saveButton?.addEventListener("click", save);
    reloadButton?.addEventListener("click", load);

    if (window.ResizeObserver && previewShell) {
      const observer = new ResizeObserver(syncPreviewScale);
      observer.observe(previewShell);
    }
    window.addEventListener("resize", syncPreviewScale, { passive: true });
    window.addEventListener("beforeunload", (event) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    });

    syncPreviewScale();
    load();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
