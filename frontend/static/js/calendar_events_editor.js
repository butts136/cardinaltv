(() => {
  const boot = () => {
    const appGlobals = window.CardinalApp || {};
    const { fetchJSON } = appGlobals;

    if (!fetchJSON) {
      setTimeout(boot, 50);
      return;
    }

    const root = document.getElementById("calendar-events-admin-page");
    if (!root) {
      return;
    }

    const previewFrame = document.getElementById("calendar-events-slideshow-preview");
    const previewFrameShell = document.getElementById("calendar-events-preview-frame");
    const previewStatus = document.getElementById("calendar-events-preview-status");
    const enabledToggle = document.getElementById("calendar-events-live-enabled");
    const holidaysList = document.getElementById("calendar-holidays-list");
    const closuresList = document.getElementById("calendar-closures-list");
    const addClosureButton = document.getElementById("calendar-closures-add");
    const reloadButton = document.getElementById("calendar-events-reload");
    const saveButton = document.getElementById("calendar-events-save");
    const globalStatus = document.getElementById("calendar-events-status");

    const PREVIEW_WIDTH = 1920;
    const PREVIEW_HEIGHT = 1080;
    const SVG_NS = "http://www.w3.org/2000/svg";
    const ICON_PATHS = {
      trash: "M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13",
    };

    let events = [];
    let previewHasLoaded = false;
    let previewRefreshPending = false;
    let previewRefreshTimer = null;
    let previewDispatchTimers = [];
    let isSaving = false;
    let hasUnsavedChanges = false;

    const stripHtml = (value) => String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    const extractErrorMessage = (error) => {
      const message = error instanceof Error ? error.message : String(error || "");
      return stripHtml(message) || "Erreur inattendue.";
    };

    const setStatus = (node, message, state = "info") => {
      if (!node) return;
      node.textContent = message || "";
      if (message) {
        node.dataset.state = state;
      } else {
        delete node.dataset.state;
      }
    };

    const makeId = () => {
      if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID().replace(/-/g, "");
      }
      return `calendar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    };

    const todayIso = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());

    const normalizeEvent = (raw = {}, index = 0) => {
      const type = String(raw?.type || "").trim().toLowerCase() === "closed" ? "closed" : "holiday";
      const fallbackLabel = type === "closed" ? "Entreprise fermée" : `Férié ${index + 1}`;
      return {
        id: String(raw?.id || makeId()),
        type,
        date: String(raw?.date || "").trim(),
        label: String(raw?.label || fallbackLabel).trim() || fallbackLabel,
        notes: String(raw?.notes || "").trim(),
        is_mandatory: Boolean(raw?.is_mandatory) && type === "holiday",
      };
    };

    const sortEvents = (list) => [...list].sort((left, right) => {
      const leftDate = String(left?.date || "");
      const rightDate = String(right?.date || "");
      if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
      if (left.type !== right.type) return left.type.localeCompare(right.type);
      return String(left.label || "").localeCompare(String(right.label || ""), "fr", { sensitivity: "base" });
    });

    const updateEvent = (eventId, updates) => {
      events = events.map((entry) => (entry.id === eventId ? { ...entry, ...updates } : entry));
      hasUnsavedChanges = true;
      if (globalStatus?.dataset.state !== "error") {
        setStatus(globalStatus, "Modifications non enregistrées.", "info");
      }
    };

    const setBusyState = (busy) => {
      isSaving = busy;
      if (saveButton) saveButton.disabled = busy;
      if (reloadButton) reloadButton.disabled = busy;
      if (addClosureButton) addClosureButton.disabled = busy;
      if (enabledToggle) enabledToggle.disabled = busy;
    };

    const syncPreviewScale = () => {
      if (!previewFrameShell) return;
      const rect = previewFrameShell.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const scale = Math.min(rect.width / PREVIEW_WIDTH, rect.height / PREVIEW_HEIGHT);
      previewFrameShell.style.setProperty("--calendar-events-preview-scale", String(scale));
    };

    const observePreviewScale = () => {
      syncPreviewScale();
      if (window.ResizeObserver && previewFrameShell) {
        const resizeObserver = new ResizeObserver(syncPreviewScale);
        resizeObserver.observe(previewFrameShell);
      }
      window.addEventListener("resize", syncPreviewScale, { passive: true });
    };

    const postPreviewRefresh = () => {
      if (!previewFrame) return false;
      const target = previewFrame.contentWindow;
      if (!target) return false;
      target.postMessage({ type: "editor:refresh" }, "*");
      return true;
    };

    const clearPreviewDispatchTimers = () => {
      previewDispatchTimers.forEach((timer) => clearTimeout(timer));
      previewDispatchTimers = [];
    };

    const dispatchPreviewRefreshBurst = () => {
      clearPreviewDispatchTimers();
      [0, 180, 520, 1100].forEach((delay, index, delays) => {
        const timer = setTimeout(() => {
          if (!previewFrame) return;
          postPreviewRefresh();
          if (index === delays.length - 1) {
            previewRefreshPending = false;
          }
        }, delay);
        previewDispatchTimers.push(timer);
      });
    };

    const refreshPreview = ({ immediate = false } = {}) => {
      if (!previewFrame) return;
      previewRefreshPending = true;
      if (previewRefreshTimer) {
        clearTimeout(previewRefreshTimer);
        previewRefreshTimer = null;
      }

      const flush = () => {
        previewRefreshTimer = null;
        if (!previewFrame || !previewRefreshPending) return;
        if (!previewHasLoaded && !immediate) {
          previewRefreshTimer = setTimeout(flush, 120);
          return;
        }
        if (postPreviewRefresh()) {
          dispatchPreviewRefreshBurst();
          return;
        }
        previewRefreshTimer = setTimeout(flush, 160);
      };

      if (immediate) {
        flush();
        return;
      }
      previewRefreshTimer = setTimeout(flush, 120);
    };

    const ensurePreviewVisible = () => {
      if (!previewFrame) return;
      syncPreviewScale();
      previewFrame.setAttribute("loading", "eager");
      const markReady = () => {
        previewHasLoaded = true;
        if (previewRefreshPending) {
          refreshPreview({ immediate: true });
        }
      };
      previewFrame.addEventListener("load", markReady);
      setTimeout(() => {
        try {
          if (previewFrame.contentDocument?.readyState === "complete") {
            markReady();
          }
        } catch (error) {
          // Ignore same-origin edge cases.
        }
        refreshPreview({ immediate: true });
      }, 120);
      setTimeout(() => {
        try {
          if (previewFrame.contentDocument?.readyState === "complete") {
            markReady();
            return;
          }
        } catch (error) {
          // Ignore same-origin edge cases.
        }
        refreshPreview();
      }, 900);
    };

    const loadSlideSettings = async () => {
      if (!enabledToggle) return;
      try {
        const data = await fetchJSON("api/settings");
        enabledToggle.checked = Boolean(data?.vacations_slide?.show_calendar_events);
        setStatus(previewStatus, "", "info");
      } catch (error) {
        setStatus(previewStatus, extractErrorMessage(error), "error");
      }
    };

    const saveSlideEnabled = async (enabled) => {
      if (!enabledToggle) return;
      enabledToggle.disabled = true;
      setStatus(previewStatus, "Enregistrement...", "info");
      try {
        const data = await fetchJSON("api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vacations_slide: { show_calendar_events: enabled } }),
        });
        enabledToggle.checked = Boolean(data?.vacations_slide?.show_calendar_events);
        setStatus(previewStatus, "Statut enregistré.", "success");
        refreshPreview({ immediate: true });
      } catch (error) {
        enabledToggle.checked = !enabled;
        setStatus(previewStatus, extractErrorMessage(error), "error");
      } finally {
        enabledToggle.disabled = false;
      }
    };

    const makeField = (labelText, input) => {
      const field = document.createElement("div");
      field.className = "calendar-event-field";
      const label = document.createElement("label");
      label.textContent = labelText;
      field.append(label, input);
      return field;
    };

    const makeDeleteButton = (eventId) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "calendar-event-delete";
      button.setAttribute("aria-label", "Supprimer la fermeture");
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", ICON_PATHS.trash);
      svg.appendChild(path);
      button.appendChild(svg);
      button.addEventListener("click", () => {
        events = events.filter((entry) => entry.id !== eventId);
        hasUnsavedChanges = true;
        renderAll();
        setStatus(globalStatus, "Modifications non enregistrées.", "info");
      });
      return button;
    };

    const buildEventRow = (event, { allowDelete = false } = {}) => {
      const row = document.createElement("div");
      row.className = "calendar-event-row";
      row.dataset.eventId = event.id;

      const pill = document.createElement("div");
      pill.className = `calendar-event-pill is-${event.type}`;
      pill.textContent = event.type === "closed" ? "Fermé" : "Férié";

      const labelInput = document.createElement("input");
      labelInput.type = "text";
      labelInput.value = event.label;
      labelInput.placeholder = event.type === "closed" ? "Entreprise fermée" : "Nom du férié";
      labelInput.addEventListener("input", () => updateEvent(event.id, { label: labelInput.value }));

      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.value = event.date;
      dateInput.addEventListener("input", () => {
        updateEvent(event.id, { date: dateInput.value });
        yearChip.textContent = dateInput.value ? dateInput.value.slice(0, 4) : "Sans date";
      });

      const noteInput = document.createElement("input");
      noteInput.type = "text";
      noteInput.value = event.notes;
      noteInput.placeholder = event.type === "closed" ? "Ex.: fermeture estivale" : "Note optionnelle";
      noteInput.addEventListener("input", () => updateEvent(event.id, { notes: noteInput.value }));

      const side = document.createElement("div");
      side.className = "calendar-event-side";

      const typeChip = document.createElement("span");
      typeChip.className = `calendar-event-chip is-${event.type}`;
      typeChip.textContent = event.is_mandatory ? "Obligatoire" : "Modifiable";

      const yearChip = document.createElement("span");
      yearChip.className = "calendar-event-chip";
      yearChip.textContent = event.date ? event.date.slice(0, 4) : "Sans date";

      side.append(typeChip, yearChip);
      if (allowDelete) {
        side.appendChild(makeDeleteButton(event.id));
      }

      row.append(
        pill,
        makeField("Libellé", labelInput),
        makeField("Date", dateInput),
        makeField("Note", noteInput),
        side,
      );

      return row;
    };

    const renderHolidayList = () => {
      if (!holidaysList) return;
      holidaysList.innerHTML = "";
      const holidayEvents = sortEvents(events.filter((entry) => entry.type === "holiday"));
      if (!holidayEvents.length) {
        const empty = document.createElement("p");
        empty.className = "calendar-events-empty";
        empty.textContent = "Aucun férié n'est disponible pour le moment.";
        holidaysList.appendChild(empty);
        return;
      }
      holidayEvents.forEach((event) => {
        holidaysList.appendChild(buildEventRow(event, { allowDelete: false }));
      });
    };

    const renderClosureList = () => {
      if (!closuresList) return;
      closuresList.innerHTML = "";
      const closureEvents = sortEvents(events.filter((entry) => entry.type === "closed"));
      if (!closureEvents.length) {
        const empty = document.createElement("p");
        empty.className = "calendar-events-empty";
        empty.textContent = "Aucune fermeture configurée. Ajoutez une journée pour afficher le badge Fermé dans le Calendrier.";
        closuresList.appendChild(empty);
        return;
      }
      closureEvents.forEach((event) => {
        closuresList.appendChild(buildEventRow(event, { allowDelete: true }));
      });
    };

    const renderAll = () => {
      renderHolidayList();
      renderClosureList();
    };

    const loadEvents = async () => {
      setBusyState(true);
      setStatus(globalStatus, "Chargement des événements...", "info");
      try {
        const data = await fetchJSON("api/calendar-events");
        const nextEvents = Array.isArray(data?.events) ? data.events : [];
        events = sortEvents(nextEvents.map((entry, index) => normalizeEvent(entry, index)));
        hasUnsavedChanges = false;
        renderAll();
        setStatus(globalStatus, `${events.length} événement(s) chargé(s).`, "success");
      } catch (error) {
        renderAll();
        setStatus(globalStatus, extractErrorMessage(error), "error");
      } finally {
        setBusyState(false);
      }
    };

    const validateEvents = () => {
      for (const event of events) {
        if (!isIsoDate(event.date)) {
          return {
            eventId: event.id,
            field: "date",
            message: `La date est invalide pour « ${event.label || "cet événement"} ».`,
          };
        }
        if (!String(event.label || "").trim()) {
          return {
            eventId: event.id,
            field: "label",
            message: `Le libellé est obligatoire pour la date ${event.date}.`,
          };
        }
      }
      return null;
    };

    const focusInvalidField = (validation) => {
      if (!validation?.eventId || !validation?.field) return;
      const selector = `.calendar-event-row[data-event-id="${validation.eventId}"] input[type="${validation.field === "date" ? "date" : "text"}"]`;
      const candidate = root.querySelector(selector);
      if (candidate instanceof HTMLElement) {
        candidate.focus();
      }
    };

    const saveEvents = async () => {
      const validation = validateEvents();
      if (validation) {
        setStatus(globalStatus, validation.message, "error");
        focusInvalidField(validation);
        return;
      }

      setBusyState(true);
      setStatus(globalStatus, "Enregistrement des événements...", "info");
      try {
        const payload = {
          events: sortEvents(events).map((event) => ({
            id: event.id,
            type: event.type,
            date: event.date,
            label: event.label.trim(),
            notes: event.notes.trim(),
            is_mandatory: Boolean(event.is_mandatory),
          })),
        };
        const data = await fetchJSON("api/calendar-events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const savedEvents = Array.isArray(data?.events) ? data.events : [];
        events = sortEvents(savedEvents.map((entry, index) => normalizeEvent(entry, index)));
        hasUnsavedChanges = false;
        renderAll();
        setStatus(globalStatus, "Événements enregistrés.", "success");
        refreshPreview({ immediate: true });
      } catch (error) {
        setStatus(globalStatus, extractErrorMessage(error), "error");
      } finally {
        setBusyState(false);
      }
    };

    if (enabledToggle) {
      enabledToggle.addEventListener("change", () => {
        saveSlideEnabled(enabledToggle.checked);
      });
    }

    if (addClosureButton) {
      addClosureButton.addEventListener("click", () => {
        events = sortEvents([
          ...events,
          normalizeEvent(
            {
              id: makeId(),
              type: "closed",
              date: todayIso(),
              label: "Entreprise fermée",
              notes: "",
              is_mandatory: false,
            },
            events.length,
          ),
        ]);
        hasUnsavedChanges = true;
        renderAll();
        setStatus(globalStatus, "Modifications non enregistrées.", "info");
      });
    }

    if (reloadButton) {
      reloadButton.addEventListener("click", () => {
        loadEvents();
      });
    }

    if (saveButton) {
      saveButton.addEventListener("click", () => {
        saveEvents();
      });
    }

    loadSlideSettings();
    loadEvents();
    observePreviewScale();
    ensurePreviewVisible();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
