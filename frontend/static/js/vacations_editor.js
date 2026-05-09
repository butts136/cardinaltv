(() => {
  const boot = () => {
    const appGlobals = window.CardinalApp || {};
    const { fetchJSON } = appGlobals;

    if (!fetchJSON) {
      setTimeout(boot, 50);
      return;
    }

    const root = document.getElementById("vacations-admin-page");
    if (!root) {
      return;
    }

    const previewFrame = document.getElementById("vacations-editor-slideshow-preview");
    const previewFrameShell = document.getElementById("vacations-preview-frame");
    const previewViewport = document.getElementById("vacations-preview-viewport");
    const previewStatus = document.getElementById("vacations-preview-status");
    const enabledToggle = document.getElementById("vacations-editor-live-enabled");
    const employeesList = document.getElementById("vacations-employees-list");
    const employeesStatus = document.getElementById("vacations-employees-status");
    const refreshEmployeesButton = document.getElementById("vacations-employees-refresh");

    const modal = document.getElementById("vacations-period-modal");
    const modalTitle = document.getElementById("vacations-period-modal-title");
    const modalInstruction = document.getElementById("vacations-period-modal-instruction");
    const modalRangeSummary = document.getElementById("vacations-period-range-summary");
    const modalStartValue = document.getElementById("vacations-period-start-value");
    const modalEndValue = document.getElementById("vacations-period-end-value");
    const modalCalendar = document.getElementById("vacations-period-calendar");
    const modalStatus = document.getElementById("vacations-period-modal-status");
    const modalSave = document.getElementById("vacations-period-modal-save");
    const modalClear = document.getElementById("vacations-period-modal-clear");
    const modalToday = document.getElementById("vacations-period-modal-today");
    const modalClose = document.getElementById("vacations-period-modal-close");

    const SVG_NS = "http://www.w3.org/2000/svg";
    const ICON_PATHS = {
      plus: "M12 5v14M5 12h14",
      pencil: "M12.5 6.5l5 5L8 21H3v-5l9.5-9.5ZM15.5 3.5l5 5",
      trash: "M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13",
      chevronLeft: "M15 18l-6-6 6-6",
      chevronRight: "M9 18l6-6-6-6",
    };

    let employees = [];
    let activeEdit = null;
    let visibleCalendarMonth = null;
    let previewRefreshTimer = null;
    let previewRefreshPending = false;
    let previewHasLoaded = false;
    let previewDispatchTimers = [];

    const PREVIEW_WIDTH = 1920;
    const PREVIEW_HEIGHT = 1080;

    const makeId = () => {
      if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID().replace(/-/g, "");
      }
      return `vac_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    };

    const escapeHTML = (value) =>
      String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]);

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

    const loadSlideSettings = async () => {
      if (!enabledToggle) return;
      try {
        const data = await fetchJSON("api/settings");
        enabledToggle.checked = Boolean(data?.vacations_slide?.enabled);
        setStatus(previewStatus, "");
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
          body: JSON.stringify({ vacations_slide: { enabled } }),
        });
        enabledToggle.checked = Boolean(data?.vacations_slide?.enabled);
        setStatus(previewStatus, "Statut enregistré.", "success");
        refreshPreview({ immediate: true });
      } catch (error) {
        enabledToggle.checked = !enabled;
        setStatus(previewStatus, extractErrorMessage(error), "error");
      } finally {
        enabledToggle.disabled = false;
      }
    };

    const syncPreviewScale = () => {
      if (!previewFrameShell || !previewViewport) return;
      const rect = previewFrameShell.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const scale = Math.min(rect.width / PREVIEW_WIDTH, rect.height / PREVIEW_HEIGHT);
      previewFrameShell.style.setProperty("--vacations-preview-scale", String(scale));
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
      const delays = [0, 180, 520, 1100];
      delays.forEach((delay, index) => {
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
      const previewShell = previewFrame.closest(".preview-frame");
      const markReady = () => {
        previewHasLoaded = true;
        previewShell?.classList.add("slideshow-preview-ready");
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
          // ignore same-origin edge cases
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
          // ignore same-origin edge cases
        }
        refreshPreview();
      }, 900);
    };

    const todayIso = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const isoFromDate = (date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const parseIsoDate = (value) => {
      const text = String(value || "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
      const date = new Date(`${text}T00:00:00Z`);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const startOfMonth = (value) => {
      const source = parseIsoDate(value) || new Date();
      return new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth(), 1));
    };

    const addMonths = (date, months) =>
      new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + Number(months || 0), 1));

    const addDays = (date, days) => {
      const next = new Date(date);
      next.setUTCDate(next.getUTCDate() + Number(days || 0));
      return next;
    };

    const monthLabel = (date) =>
      new Intl.DateTimeFormat("fr-CA", {
        timeZone: "UTC",
        month: "long",
        year: "numeric",
      }).format(date);

    const formatDate = (value) => {
      const parsed = parseIsoDate(value);
      if (!parsed) return "";
      return new Intl.DateTimeFormat("fr-CA", {
        timeZone: "UTC",
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(parsed);
    };

    const formatShortDate = (value) => {
      const parsed = parseIsoDate(value);
      if (!parsed) return "";
      return new Intl.DateTimeFormat("fr-CA", {
        timeZone: "UTC",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(parsed);
    };

    const formatPeriodLabel = (period) => {
      const start = formatDate(period.start_date);
      const end = formatDate(period.end_date);
      if (!start && !end) {
        return "Période de vacances";
      }
      if (start === end) {
        return `Du ${start}`;
      }
      return `Du ${start} au ${end}`;
    };

    const normalizePeriod = (period = {}) => {
      const start_date = String(period.start_date || period.start || "").trim();
      const end_date = String(period.end_date || period.end || "").trim();
      if (!start_date || !end_date) {
        return null;
      }
      return {
        id: String(period.id || makeId()),
        start_date,
        end_date,
        label: String(period.label || "").trim(),
        notes: String(period.notes || "").trim(),
      };
    };

    const normalizeEmployee = (employee) => {
      const vacations = Array.isArray(employee?.vacations)
        ? employee.vacations.map((period) => normalizePeriod(period)).filter(Boolean)
        : [];
      return {
        ...employee,
        vacations,
      };
    };

    const sortedEmployees = () =>
      [...employees].sort((left, right) => {
        const leftHire = parseIsoDate(left?.hire_date || "")?.getTime() || Number.MAX_SAFE_INTEGER;
        const rightHire = parseIsoDate(right?.hire_date || "")?.getTime() || Number.MAX_SAFE_INTEGER;
        if (leftHire === rightHire) {
          return String(left?.name || "").localeCompare(String(right?.name || ""), "fr-CA");
        }
        return leftHire - rightHire;
      });

    const icon = (name) => {
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", ICON_PATHS[name] || ICON_PATHS.plus);
      svg.appendChild(path);
      return svg;
    };

    const iconButton = (name, label, extraClass = "") => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `icon-button vacations-mini-button ${extraClass}`.trim();
      button.setAttribute("aria-label", label);
      button.appendChild(icon(name));
      return button;
    };

    const escapeSelector = (value) =>
      String(value ?? "").replace(/["\\]/g, "\\$&");

    const sortPeriods = (periods) =>
      [...periods].sort((left, right) => {
        const leftStart = left.start_date || "";
        const rightStart = right.start_date || "";
        if (leftStart === rightStart) {
          return (left.end_date || "").localeCompare(right.end_date || "");
        }
        return leftStart.localeCompare(rightStart);
      });

    const findEmployee = (employeeId) => employees.find((employee) => String(employee.id) === String(employeeId));

    const findPeriod = (employee, periodId) => {
      if (!employee || !Array.isArray(employee.vacations)) return null;
      return employee.vacations.find((period) => String(period.id) === String(periodId)) || null;
    };

    const getRangeBounds = () => {
      const start = activeEdit?.startDate || "";
      const end = activeEdit?.endDate || "";
      return {
        start,
        end,
        hasStart: /^\d{4}-\d{2}-\d{2}$/.test(start),
        hasEnd: /^\d{4}-\d{2}-\d{2}$/.test(end),
      };
    };

    const updateRangeSummary = () => {
      if (!modalRangeSummary) return;
      const { start, end, hasStart, hasEnd } = getRangeBounds();
      if (modalStartValue) modalStartValue.textContent = hasStart ? formatDate(start) : "—";
      if (modalEndValue) modalEndValue.textContent = hasEnd ? formatDate(end) : "—";
      if (modalSave) modalSave.disabled = !(hasStart && hasEnd);
      if (modalInstruction) {
        if (!hasStart) {
          modalInstruction.textContent = "Cliquez une date de début, puis une date de fin.";
        } else if (!hasEnd) {
          modalInstruction.textContent = "Cliquez maintenant la date de fin.";
        } else {
          modalInstruction.textContent = "Sélection complète. Enregistrez la période.";
        }
      }
      if (!hasStart) {
        modalRangeSummary.textContent = "Sélectionnez une date de début.";
      } else if (!hasEnd) {
        modalRangeSummary.textContent = `Début: ${formatDate(start)}. Sélectionnez une date de fin.`;
      } else {
        modalRangeSummary.textContent = `Du ${formatDate(start)} au ${formatDate(end)}`;
      }
    };

    const renderCalendar = () => {
      if (!modalCalendar) return;
      const baseMonth = visibleCalendarMonth || startOfMonth(todayIso());
      const { start, end, hasStart, hasEnd } = getRangeBounds();
      const selectedStart = hasStart ? parseIsoDate(start) : null;
      const selectedEnd = hasEnd ? parseIsoDate(end) : null;
      const monthStart = new Date(Date.UTC(baseMonth.getUTCFullYear(), baseMonth.getUTCMonth(), 1));
      const gridStart = addDays(monthStart, -monthStart.getUTCDay());
      const monthEnd = new Date(Date.UTC(baseMonth.getUTCFullYear(), baseMonth.getUTCMonth() + 1, 0));
      const gridEnd = addDays(monthEnd, 6 - monthEnd.getUTCDay());
      const weekdays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

      const header = document.createElement("div");
      header.className = "vacations-calendar-header";
      const prev = iconButton("chevronLeft", "Mois précédent", "vacations-calendar-nav");
      prev.dataset.action = "calendar-prev";
      const title = document.createElement("h4");
      title.className = "vacations-calendar-title";
      title.textContent = monthLabel(baseMonth);
      const next = iconButton("chevronRight", "Mois suivant", "vacations-calendar-nav");
      next.dataset.action = "calendar-next";
      header.append(prev, title, next);

      const weekdayRow = document.createElement("div");
      weekdayRow.className = "vacations-calendar-weekdays";
      weekdays.forEach((label) => {
        const cell = document.createElement("span");
        cell.textContent = label;
        weekdayRow.appendChild(cell);
      });

      const grid = document.createElement("div");
      grid.className = "vacations-calendar-grid";
      for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 1)) {
        const iso = isoFromDate(cursor);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "vacations-calendar-day";
        button.dataset.action = "calendar-day";
        button.dataset.date = iso;
        const number = document.createElement("span");
        number.className = "vacations-calendar-day-number";
        number.textContent = String(cursor.getUTCDate());
        button.appendChild(number);
        if (cursor.getUTCMonth() !== baseMonth.getUTCMonth()) {
          button.classList.add("is-outside-month");
        }
        if (iso === todayIso()) {
          button.classList.add("is-today");
        }
        if (iso === start) {
          button.classList.add("is-selected", "is-range-start");
        }
        if (iso === end) {
          button.classList.add("is-selected", "is-range-end");
        }
        if (iso === start || iso === end) {
          button.classList.add("is-selected");
        } else if (selectedStart && selectedEnd && cursor > selectedStart && cursor < selectedEnd) {
          button.classList.add("is-in-range");
        }
        grid.appendChild(button);
      }

      modalCalendar.replaceChildren(header, weekdayRow, grid);
      updateRangeSummary();
    };

    const selectCalendarDate = (iso) => {
      if (!activeEdit || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return;
      const { start, end, hasStart, hasEnd } = getRangeBounds();
      if (!hasStart || hasEnd || iso < start) {
        activeEdit.startDate = iso;
        activeEdit.endDate = "";
      } else {
        activeEdit.endDate = iso;
      }
      setStatus(modalStatus, "");
      renderCalendar();
    };

    const applyModalState = () => {
      if (!modal) return;
      modal.hidden = !activeEdit;
      modal.setAttribute("aria-hidden", activeEdit ? "false" : "true");
      document.body.classList.toggle("modal-open", Boolean(activeEdit));
    };

    const closeModal = () => {
      activeEdit = null;
      setStatus(modalStatus, "");
      if (modalTitle) modalTitle.textContent = "Période de vacances";
      if (modalInstruction) modalInstruction.textContent = "Cliquez une date de début, puis une date de fin.";
      if (modalCalendar) modalCalendar.replaceChildren();
      if (modalRangeSummary) modalRangeSummary.textContent = "Sélectionnez une date de début.";
      applyModalState();
    };

    const openModal = ({ employeeId, periodId = null } = {}) => {
      const employee = findEmployee(employeeId);
      if (!employee) return;
      const period = periodId ? findPeriod(employee, periodId) : null;
      activeEdit = {
        employeeId: String(employee.id),
        periodId: period ? String(period.id) : "",
        startDate: period?.start_date || "",
        endDate: period?.end_date || "",
      };
      visibleCalendarMonth = startOfMonth(period?.start_date || todayIso());
      if (modalTitle) {
        modalTitle.textContent = `${period ? "Modifier" : "Ajouter"} — ${employee.name || "Employé"}`;
      }
      setStatus(modalStatus, "");
      applyModalState();
      renderCalendar();
      setTimeout(() => modalCalendar?.querySelector(".vacations-calendar-day.is-selected, .vacations-calendar-day")?.focus(), 0);
    };

    const buildEmployeeCard = (employee) => {
      const card = document.createElement("article");
      card.className = "vacations-employee-card";
      card.dataset.employeeId = String(employee.id || "");

      const content = document.createElement("div");
      content.className = "vacations-card-content";

      const header = document.createElement("div");
      header.className = "vacations-employee-header";
      const identity = document.createElement("div");
      const name = document.createElement("h3");
      name.textContent = employee.name || "Employé";
      const meta = document.createElement("p");
      const hireDate = formatDate(employee.hire_date || "");
      meta.className = "vacations-employee-meta";
      meta.textContent = hireDate ? `Date d'embauche : ${hireDate}` : "Date d'embauche inconnue";
      identity.append(name, meta);
      header.appendChild(identity);

      const blockTitle = document.createElement("p");
      blockTitle.className = "vacations-block-title";
      blockTitle.textContent = "Vacances enregistrées";

      const addButton = iconButton("plus", "Ajouter une période");
      addButton.dataset.action = "add-period";
      addButton.classList.add("vacations-add-button");

      const list = document.createElement("div");
      list.className = "vacations-period-list";
      const vacations = sortPeriods(employee.vacations || []);
      if (!vacations.length) {
        const empty = document.createElement("p");
        empty.className = "vacations-empty-periods";
        empty.textContent = "Aucune période enregistrée.";
        list.appendChild(empty);
      } else {
        vacations.forEach((period) => {
          const row = document.createElement("div");
          row.className = "vacations-period-row";
          row.dataset.periodId = String(period.id || "");

          const main = document.createElement("div");
          main.className = "vacations-period-main";
          const range = document.createElement("strong");
          range.textContent = formatPeriodLabel(period);
          main.appendChild(range);

          const details = document.createElement("span");
          details.textContent = `${formatShortDate(period.start_date)} au ${formatShortDate(period.end_date)}`;
          main.appendChild(details);

          const actions = document.createElement("div");
          actions.className = "vacations-period-actions";
          const editButton = iconButton("pencil", "Éditer la période", "vacations-period-edit");
          editButton.dataset.action = "edit-period";
          const deleteButton = iconButton("trash", "Supprimer la période", "vacations-period-delete");
          deleteButton.dataset.action = "delete-period";
          actions.append(editButton, deleteButton);

          row.append(main, actions);
          list.appendChild(row);
        });
      }

      const status = document.createElement("div");
      status.className = "vacations-status";
      status.dataset.role = "card-status";
      status.setAttribute("aria-live", "polite");

      content.append(header, blockTitle, list, status);
      card.append(content, addButton);
      return card;
    };

    const renderEmployees = () => {
      if (!employeesList) return;
      if (!Array.isArray(employees) || !employees.length) {
        employeesList.replaceChildren();
        const empty = document.createElement("p");
        empty.className = "vacations-empty-periods";
        empty.textContent = "Aucun employé disponible.";
        employeesList.appendChild(empty);
        return;
      }

      employeesList.replaceChildren(...sortedEmployees().map((employee) => buildEmployeeCard(employee)));
    };

    const loadEmployees = async ({ silent = false } = {}) => {
      if (!silent) setStatus(employeesStatus, "Chargement des employés...", "info");
      const data = await fetchJSON("api/employees");
      employees = Array.isArray(data?.employees) ? data.employees.map((employee) => normalizeEmployee(employee)) : [];
      renderEmployees();
      refreshPreview();
      if (!silent) setStatus(employeesStatus, "", "info");
    };

    const persistEmployeeVacations = async (employeeId, vacations) => {
      const response = await fetchJSON(`api/employees/${encodeURIComponent(employeeId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vacations }),
      });
      const updated = normalizeEmployee(response?.employee || { id: employeeId, vacations });
      employees = employees.map((employee) => (String(employee.id) === String(employeeId) ? updated : employee));
      renderEmployees();
      refreshPreview();
      return updated;
    };

    const saveModal = async () => {
      if (!activeEdit) return;
      const employee = findEmployee(activeEdit.employeeId);
      if (!employee) return;

      const startDate = String(activeEdit.startDate || "").trim();
      const endDate = String(activeEdit.endDate || "").trim();
      if (!startDate || !endDate) {
        setStatus(modalStatus, "Choisissez deux dates.", "error");
        return;
      }
      if (endDate < startDate) {
        setStatus(modalStatus, "La date de fin doit être postérieure ou égale à la date de début.", "error");
        return;
      }

      const vacations = sortPeriods(Array.isArray(employee.vacations) ? employee.vacations : []);
      const nextPeriods = [];
      let replaced = false;
      vacations.forEach((period) => {
        if (activeEdit.periodId && String(period.id) === String(activeEdit.periodId)) {
          nextPeriods.push({
            ...period,
            start_date: startDate,
            end_date: endDate,
          });
          replaced = true;
          return;
        }
        nextPeriods.push(period);
      });

      if (!replaced) {
        nextPeriods.push({
          id: makeId(),
          start_date: startDate,
          end_date: endDate,
          label: "",
          notes: "",
        });
      }

      const card = employeesList?.querySelector?.(`[data-employee-id="${escapeSelector(String(employee.id))}"]`);
      const cardStatus = card?.querySelector('[data-role="card-status"]') || modalStatus;
      setStatus(cardStatus, "Enregistrement...", "info");
      try {
        await persistEmployeeVacations(employee.id, nextPeriods);
        setStatus(employeesStatus, "Période enregistrée.", "success");
        setStatus(cardStatus, "Période enregistrée.", "success");
        closeModal();
      } catch (error) {
        const message = extractErrorMessage(error);
        setStatus(cardStatus, message, "error");
        setStatus(modalStatus, message, "error");
      }
    };

    employeesList?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const card = button.closest(".vacations-employee-card");
      if (!card) return;
      const employeeId = String(card.dataset.employeeId || "");
      const periodRow = button.closest(".vacations-period-row");

      switch (button.dataset.action) {
        case "add-period":
          openModal({ employeeId });
          break;
        case "edit-period":
          openModal({ employeeId, periodId: periodRow?.dataset?.periodId || "" });
          break;
        case "delete-period": {
          const employee = findEmployee(employeeId);
          const periodId = String(periodRow?.dataset?.periodId || "");
          if (!employee || !periodId) return;
          const confirmed = window.confirm("Supprimer cette période de vacances ?");
          if (!confirmed) return;
          const nextPeriods = sortPeriods(employee.vacations || []).filter((period) => String(period.id) !== periodId);
          setStatus(card.querySelector('[data-role="card-status"]'), "Suppression...", "info");
          void persistEmployeeVacations(employee.id, nextPeriods)
            .then(() => {
              setStatus(employeesStatus, "Période supprimée.", "success");
            })
            .catch((error) => {
              const message = extractErrorMessage(error);
              setStatus(card.querySelector('[data-role="card-status"]'), message, "error");
              setStatus(employeesStatus, message, "error");
            });
          break;
        }
        default:
          break;
      }
    });

    refreshEmployeesButton?.addEventListener("click", () => {
      void loadEmployees();
    });
    enabledToggle?.addEventListener("change", (event) => {
      void saveSlideEnabled(Boolean(event.target.checked));
    });

    modalClear?.addEventListener("click", () => {
      if (!activeEdit) return;
      activeEdit.startDate = "";
      activeEdit.endDate = "";
      setStatus(modalStatus, "");
      renderCalendar();
    });
    modalToday?.addEventListener("click", () => {
      visibleCalendarMonth = startOfMonth(todayIso());
      renderCalendar();
    });
    modalClose?.addEventListener("click", closeModal);
    modal?.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
    modalCalendar?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      if (button.dataset.action === "calendar-prev") {
        visibleCalendarMonth = addMonths(visibleCalendarMonth || startOfMonth(todayIso()), -1);
        renderCalendar();
        return;
      }
      if (button.dataset.action === "calendar-next") {
        visibleCalendarMonth = addMonths(visibleCalendarMonth || startOfMonth(todayIso()), 1);
        renderCalendar();
        return;
      }
      if (button.dataset.action === "calendar-day") {
        selectCalendarDate(button.dataset.date || "");
      }
    });
    modalSave?.addEventListener("click", () => {
      void saveModal();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && activeEdit) {
        closeModal();
      }
    });

    observePreviewScale();
    ensurePreviewVisible();
    void loadSlideSettings();

    void loadEmployees().catch((error) => {
      const message = extractErrorMessage(error);
      setStatus(employeesStatus, message, "error");
    });
  };

  boot();
})();
