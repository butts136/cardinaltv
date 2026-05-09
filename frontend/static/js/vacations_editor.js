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
    const employeesList = document.getElementById("vacations-employees-list");
    const employeesStatus = document.getElementById("vacations-employees-status");
    const refreshEmployeesButton = document.getElementById("vacations-employees-refresh");

    const modal = document.getElementById("vacations-period-modal");
    const modalTitle = document.getElementById("vacations-period-modal-title");
    const modalEmployee = document.getElementById("vacations-period-modal-employee");
    const modalStart = document.getElementById("vacations-period-start");
    const modalEnd = document.getElementById("vacations-period-end");
    const modalStatus = document.getElementById("vacations-period-modal-status");
    const modalSave = document.getElementById("vacations-period-modal-save");
    const modalCancel = document.getElementById("vacations-period-modal-cancel");
    const modalClose = document.getElementById("vacations-period-modal-close");

    const SVG_NS = "http://www.w3.org/2000/svg";
    const ICON_PATHS = {
      plus: "M12 5v14M5 12h14",
      pencil: "M12.5 6.5l5 5L8 21H3v-5l9.5-9.5ZM15.5 3.5l5 5",
      trash: "M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13",
    };

    let employees = [];
    let activeEdit = null;

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

    const todayIso = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const parseIsoDate = (value) => {
      const text = String(value || "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
      const date = new Date(`${text}T00:00:00Z`);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const formatDate = (value) => {
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

    const applyModalState = () => {
      if (!modal) return;
      modal.hidden = !activeEdit;
      modal.setAttribute("aria-hidden", activeEdit ? "false" : "true");
      document.body.classList.toggle("modal-open", Boolean(activeEdit));
    };

    const closeModal = () => {
      activeEdit = null;
      setStatus(modalStatus, "");
      if (modalStart) modalStart.value = "";
      if (modalEnd) modalEnd.value = "";
      if (modalEmployee) modalEmployee.textContent = "";
      if (modalTitle) modalTitle.textContent = "Période de vacances";
      applyModalState();
    };

    const openModal = ({ employeeId, periodId = null } = {}) => {
      const employee = findEmployee(employeeId);
      if (!employee) return;
      const period = periodId ? findPeriod(employee, periodId) : null;
      activeEdit = {
        employeeId: String(employee.id),
        periodId: period ? String(period.id) : "",
      };
      if (modalTitle) {
        modalTitle.textContent = period ? "Modifier la période" : "Ajouter une période";
      }
      if (modalEmployee) {
        modalEmployee.textContent = employee.name || "Employé";
      }
      if (modalStart) {
        modalStart.value = period?.start_date || todayIso();
      }
      if (modalEnd) {
        modalEnd.value = period?.end_date || todayIso();
      }
      setStatus(modalStatus, "");
      applyModalState();
      setTimeout(() => modalStart?.focus(), 0);
    };

    const buildEmployeeCard = (employee) => {
      const card = document.createElement("article");
      card.className = "vacations-employee-card";
      card.dataset.employeeId = String(employee.id || "");

      const header = document.createElement("div");
      header.className = "vacations-employee-header";

      const identity = document.createElement("div");
      const name = document.createElement("h3");
      name.textContent = employee.name || "Employé";
      const meta = document.createElement("p");
      const metaBits = [];
      if (employee.role) metaBits.push(employee.role);
      if (employee.position) metaBits.push(employee.position);
      if (employee.hire_date) metaBits.push(`Embauche: ${formatDate(employee.hire_date)}`);
      meta.className = "vacations-employee-meta";
      meta.textContent = metaBits.length ? metaBits.join(" • ") : "Carte vacances";
      identity.append(name, meta);

      const addButton = iconButton("plus", "Ajouter une période");
      addButton.dataset.action = "add-period";
      addButton.classList.add("vacations-add-button");

      header.append(identity, addButton);

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
          const label = period.label ? period.label : "Vacances";
          details.textContent = period.notes ? `${label} • ${period.notes}` : label;
          main.appendChild(details);

          const actions = document.createElement("div");
          actions.className = "vacations-period-actions";
          const editButton = iconButton("pencil", "Éditer la période");
          editButton.dataset.action = "edit-period";
          const deleteButton = iconButton("trash", "Supprimer la période");
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

      card.append(header, list, status);
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

      employeesList.replaceChildren(...employees.map((employee) => buildEmployeeCard(employee)));
    };

    const loadEmployees = async ({ silent = false } = {}) => {
      if (!silent) setStatus(employeesStatus, "Chargement des employés...", "info");
      const data = await fetchJSON("api/employees");
      employees = Array.isArray(data?.employees) ? data.employees.map((employee) => normalizeEmployee(employee)) : [];
      renderEmployees();
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

      const startDate = String(modalStart?.value || "").trim();
      const endDate = String(modalEnd?.value || "").trim();
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

    modalCancel?.addEventListener("click", closeModal);
    modalClose?.addEventListener("click", closeModal);
    modal?.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
    modalSave?.addEventListener("click", () => {
      void saveModal();
    });
    modalStart?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void saveModal();
      }
    });
    modalEnd?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void saveModal();
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && activeEdit) {
        closeModal();
      }
    });

    void loadEmployees().catch((error) => {
      const message = extractErrorMessage(error);
      setStatus(employeesStatus, message, "error");
    });
  };

  boot();
})();
