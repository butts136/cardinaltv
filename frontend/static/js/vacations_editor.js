(() => {
  const boot = () => {
    const appGlobals = window.CardinalApp || {};
    const defaults = window.CardinalSlideshowDefaults || {};
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
    const settingsSaveButton = document.getElementById("vacations-settings-save");
    const settingsStatus = document.getElementById("vacations-settings-status");
    const employeesStatus = document.getElementById("vacations-employees-status");
    const refreshEmployeesButton = document.getElementById("vacations-employees-refresh");
    const employeesList = document.getElementById("vacations-employees-list");

    const enabledInput = document.getElementById("vacations-enabled");
    const orderIndexInput = document.getElementById("vacations-order-index");
    const durationInput = document.getElementById("vacations-duration");
    const monthsToShowInput = document.getElementById("vacations-months-to-show");
    const initialWeeksInput = document.getElementById("vacations-initial-full-weeks");
    const scrollDelayInput = document.getElementById("vacations-scroll-delay");
    const scrollSpeedInput = document.getElementById("vacations-scroll-speed");
    const pauseBottomInput = document.getElementById("vacations-pause-bottom");
    const pauseTopInput = document.getElementById("vacations-pause-top");

    const DEFAULT_SETTINGS = {
      enabled: false,
      order_index: 0,
      duration: 20,
      months_to_show: 12,
      initial_full_weeks: 8,
      scroll_start_delay_ms: 4500,
      scroll_speed_px_per_second: 26,
      pause_at_bottom_ms: 5000,
      pause_at_top_ms: 3000,
      ...(defaults.DEFAULT_VACATIONS_SLIDE || {}),
    };

    let employees = [];
    let settings = { ...DEFAULT_SETTINGS };

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
      if (!message) {
        return "Erreur inattendue.";
      }
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

    const normalizeSettings = (raw = {}) => ({
      ...DEFAULT_SETTINGS,
      ...raw,
      enabled: Boolean(raw?.enabled),
      order_index: Number.isFinite(Number(raw?.order_index)) ? Number(raw.order_index) : DEFAULT_SETTINGS.order_index,
      duration: Number.isFinite(Number(raw?.duration)) ? Number(raw.duration) : DEFAULT_SETTINGS.duration,
      months_to_show: Number.isFinite(Number(raw?.months_to_show)) ? Number(raw.months_to_show) : DEFAULT_SETTINGS.months_to_show,
      initial_full_weeks: Number.isFinite(Number(raw?.initial_full_weeks))
        ? Number(raw.initial_full_weeks)
        : DEFAULT_SETTINGS.initial_full_weeks,
      scroll_start_delay_ms: Number.isFinite(Number(raw?.scroll_start_delay_ms))
        ? Number(raw.scroll_start_delay_ms)
        : DEFAULT_SETTINGS.scroll_start_delay_ms,
      scroll_speed_px_per_second: Number.isFinite(Number(raw?.scroll_speed_px_per_second))
        ? Number(raw.scroll_speed_px_per_second)
        : DEFAULT_SETTINGS.scroll_speed_px_per_second,
      pause_at_bottom_ms: Number.isFinite(Number(raw?.pause_at_bottom_ms))
        ? Number(raw.pause_at_bottom_ms)
        : DEFAULT_SETTINGS.pause_at_bottom_ms,
      pause_at_top_ms: Number.isFinite(Number(raw?.pause_at_top_ms))
        ? Number(raw.pause_at_top_ms)
        : DEFAULT_SETTINGS.pause_at_top_ms,
    });

    const formatDate = (value) => {
      const text = String(value || "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return "";
      }
      const parsed = new Date(`${text}T00:00:00Z`);
      if (Number.isNaN(parsed.getTime())) {
        return text;
      }
      return new Intl.DateTimeFormat("fr-CA", {
        timeZone: "UTC",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(parsed);
    };

    const fillSettingsForm = () => {
      if (enabledInput) enabledInput.checked = Boolean(settings.enabled);
      if (orderIndexInput) orderIndexInput.value = `${Math.round(Number(settings.order_index) || 0)}`;
      if (durationInput) durationInput.value = `${Math.round(Number(settings.duration) || DEFAULT_SETTINGS.duration)}`;
      if (monthsToShowInput) monthsToShowInput.value = `${Math.round(Number(settings.months_to_show) || DEFAULT_SETTINGS.months_to_show)}`;
      if (initialWeeksInput) initialWeeksInput.value = `${Math.round(Number(settings.initial_full_weeks) || DEFAULT_SETTINGS.initial_full_weeks)}`;
      if (scrollDelayInput) scrollDelayInput.value = `${Math.round(Number(settings.scroll_start_delay_ms) || DEFAULT_SETTINGS.scroll_start_delay_ms)}`;
      if (scrollSpeedInput) scrollSpeedInput.value = `${Number(settings.scroll_speed_px_per_second) || DEFAULT_SETTINGS.scroll_speed_px_per_second}`;
      if (pauseBottomInput) pauseBottomInput.value = `${Math.round(Number(settings.pause_at_bottom_ms) || DEFAULT_SETTINGS.pause_at_bottom_ms)}`;
      if (pauseTopInput) pauseTopInput.value = `${Math.round(Number(settings.pause_at_top_ms) || DEFAULT_SETTINGS.pause_at_top_ms)}`;
    };

    const readSettingsPatch = () => ({
      enabled: Boolean(enabledInput?.checked),
      order_index: Number(orderIndexInput?.value || 0),
      duration: Number(durationInput?.value || DEFAULT_SETTINGS.duration),
      months_to_show: Number(monthsToShowInput?.value || DEFAULT_SETTINGS.months_to_show),
      initial_full_weeks: Number(initialWeeksInput?.value || DEFAULT_SETTINGS.initial_full_weeks),
      scroll_start_delay_ms: Number(scrollDelayInput?.value || DEFAULT_SETTINGS.scroll_start_delay_ms),
      scroll_speed_px_per_second: Number(scrollSpeedInput?.value || DEFAULT_SETTINGS.scroll_speed_px_per_second),
      pause_at_bottom_ms: Number(pauseBottomInput?.value || DEFAULT_SETTINGS.pause_at_bottom_ms),
      pause_at_top_ms: Number(pauseTopInput?.value || DEFAULT_SETTINGS.pause_at_top_ms),
    });

    const refreshPreview = () => {
      if (!previewFrame) return;
      try {
        const current = new URL(previewFrame.getAttribute("src") || previewFrame.src, window.location.origin);
        current.searchParams.set("_ts", String(Date.now()));
        previewFrame.src = current.toString();
      } catch (error) {
        previewFrame.contentWindow?.postMessage?.({ type: "editor:refresh" }, "*");
      }
    };

    const createPeriodRow = (vacation = {}) => {
      const row = document.createElement("div");
      row.className = "vacations-period-row";
      row.dataset.periodId = String(vacation.id || makeId());
      row.innerHTML = `
        <div class="vacations-period-grid">
          <label>
            Début
            <input type="date" data-field="start_date" value="${escapeHTML(vacation.start_date || "")}" />
          </label>
          <label>
            Fin
            <input type="date" data-field="end_date" value="${escapeHTML(vacation.end_date || "")}" />
          </label>
          <label>
            Libellé
            <input type="text" data-field="label" maxlength="120" placeholder="Vacances, relâche, congé..." value="${escapeHTML(vacation.label || "")}" />
          </label>
          <label>
            Notes
            <textarea data-field="notes" placeholder="Détail optionnel visible uniquement dans l'admin.">${escapeHTML(vacation.notes || "")}</textarea>
          </label>
        </div>
        <div class="vacations-period-actions">
          <div class="vacations-period-buttons">
            <button type="button" class="primary-button" data-action="save-period">Enregistrer la période</button>
            <button type="button" class="secondary-button" data-action="delete-period">Supprimer la période</button>
          </div>
          <span class="vacations-status" data-role="row-status" aria-live="polite"></span>
        </div>
      `;
      return row;
    };

    const serializePeriodsForCard = (card) =>
      Array.from(card.querySelectorAll(".vacations-period-row")).reduce((result, row) => {
        const startDate = String(row.querySelector('[data-field="start_date"]')?.value || "").trim();
        const endDate = String(row.querySelector('[data-field="end_date"]')?.value || "").trim();
        const label = String(row.querySelector('[data-field="label"]')?.value || "").trim();
        const notes = String(row.querySelector('[data-field="notes"]')?.value || "").trim();
        if (!startDate || !endDate) {
          return result;
        }
        result.push({
          id: row.dataset.periodId || makeId(),
          start_date: startDate,
          end_date: endDate,
          label,
          notes,
        });
        return result;
      }, []);

    const renderEmployees = () => {
      if (!employeesList) return;
      if (!Array.isArray(employees) || !employees.length) {
        employeesList.innerHTML = '<p class="vacations-empty-periods">Aucun employé disponible.</p>';
        return;
      }

      employeesList.replaceChildren(
        ...employees.map((employee) => {
          const card = document.createElement("article");
          card.className = "vacations-employee-card";
          card.dataset.employeeId = String(employee.id || "");

          const periods = Array.isArray(employee.vacations) ? employee.vacations : [];
          const metaBits = [];
          if (employee.role) metaBits.push(employee.role);
          if (employee.hire_date) metaBits.push(`Embauche: ${formatDate(employee.hire_date)}`);

          card.innerHTML = `
            <div class="vacations-employee-header">
              <div>
                <h3>${escapeHTML(employee.name || "Employé")}</h3>
                <p class="vacations-employee-meta">${escapeHTML(metaBits.join(" • ") || "Aucune information complémentaire")}</p>
              </div>
              <button type="button" class="secondary-button" data-action="add-period">Ajouter une période</button>
            </div>
            <div class="vacations-periods"></div>
            <div class="vacations-status" data-role="card-status" aria-live="polite"></div>
          `;

          const periodsHost = card.querySelector(".vacations-periods");
          if (periods.length) {
            periods.forEach((vacation) => periodsHost?.appendChild(createPeriodRow(vacation)));
          } else if (periodsHost) {
            const empty = document.createElement("p");
            empty.className = "vacations-empty-periods";
            empty.textContent = "Aucune période de vacances enregistrée pour cet employé.";
            periodsHost.appendChild(empty);
          }
          return card;
        }),
      );
    };

    const loadSettings = async ({ silent = false } = {}) => {
      if (!silent) setStatus(settingsStatus, "Chargement des paramètres...", "info");
      const data = await fetchJSON("api/settings");
      settings = normalizeSettings(data?.vacations_slide || {});
      fillSettingsForm();
      if (!silent) setStatus(settingsStatus, "", "info");
    };

    const loadEmployees = async ({ silent = false } = {}) => {
      if (!silent) setStatus(employeesStatus, "Chargement des employés...", "info");
      const data = await fetchJSON("api/employees");
      employees = Array.isArray(data?.employees) ? data.employees : [];
      renderEmployees();
      if (!silent) setStatus(employeesStatus, "", "info");
    };

    const saveSettings = async () => {
      setStatus(settingsStatus, "Enregistrement...", "info");
      settingsSaveButton?.setAttribute("disabled", "disabled");
      try {
        const response = await fetchJSON("api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vacations_slide: readSettingsPatch() }),
        });
        settings = normalizeSettings(response?.vacations_slide || readSettingsPatch());
        fillSettingsForm();
        setStatus(settingsStatus, "Paramètres enregistrés.", "success");
        refreshPreview();
      } catch (error) {
        setStatus(settingsStatus, extractErrorMessage(error), "error");
      } finally {
        settingsSaveButton?.removeAttribute("disabled");
      }
    };

    const persistEmployeeCard = async (card, successMessage) => {
      const employeeId = String(card?.dataset?.employeeId || "").trim();
      if (!employeeId) return;
      const cardStatus = card.querySelector('[data-role="card-status"]');
      const vacations = serializePeriodsForCard(card);
      setStatus(cardStatus, "Enregistrement des périodes...", "info");
      setStatus(employeesStatus, "", "info");
      try {
        await fetchJSON(`api/employees/${encodeURIComponent(employeeId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vacations }),
        });
        setStatus(cardStatus, successMessage, "success");
        await loadEmployees({ silent: true });
        setStatus(employeesStatus, successMessage, "success");
        refreshPreview();
      } catch (error) {
        setStatus(cardStatus, extractErrorMessage(error), "error");
        setStatus(employeesStatus, extractErrorMessage(error), "error");
      }
    };

    settingsSaveButton?.addEventListener("click", () => {
      void saveSettings();
    });

    refreshEmployeesButton?.addEventListener("click", () => {
      void loadEmployees();
    });

    employeesList?.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-action]");
      if (!actionButton) return;
      const card = actionButton.closest(".vacations-employee-card");
      const periodsHost = card?.querySelector(".vacations-periods");
      if (!card || !periodsHost) return;

      if (actionButton.dataset.action === "add-period") {
        const emptyState = periodsHost.querySelector(".vacations-empty-periods");
        if (emptyState) emptyState.remove();
        const today = new Date();
        const isoToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
          .toISOString()
          .slice(0, 10);
        const row = createPeriodRow({ start_date: isoToday, end_date: isoToday });
        periodsHost.appendChild(row);
        row.querySelector('[data-field="start_date"]')?.focus();
        return;
      }

      const row = actionButton.closest(".vacations-period-row");
      if (!row) return;

      if (actionButton.dataset.action === "save-period") {
        const rowStatus = row.querySelector('[data-role="row-status"]');
        const startDate = String(row.querySelector('[data-field="start_date"]')?.value || "").trim();
        const endDate = String(row.querySelector('[data-field="end_date"]')?.value || "").trim();
        if (!startDate || !endDate) {
          setStatus(rowStatus, "Renseignez une date de début et de fin.", "error");
          return;
        }
        if (endDate < startDate) {
          setStatus(rowStatus, "La fin doit être postérieure ou égale au début.", "error");
          return;
        }
        setStatus(rowStatus, "", "info");
        void persistEmployeeCard(card, "Périodes enregistrées.");
        return;
      }

      if (actionButton.dataset.action === "delete-period") {
        row.remove();
        if (!periodsHost.querySelector(".vacations-period-row")) {
          const empty = document.createElement("p");
          empty.className = "vacations-empty-periods";
          empty.textContent = "Aucune période de vacances enregistrée pour cet employé.";
          periodsHost.appendChild(empty);
        }
        void persistEmployeeCard(card, "Période supprimée.");
      }
    });

    void Promise.all([loadSettings(), loadEmployees()]).catch((error) => {
      const message = extractErrorMessage(error);
      setStatus(settingsStatus, message, "error");
      setStatus(employeesStatus, message, "error");
    });
  };

  boot();
})();