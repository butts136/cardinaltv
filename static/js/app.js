const uploadForm = document.querySelector("#upload-form");
const fileInput = document.querySelector("#file-input");
const dropZone = document.querySelector("#drop-zone");
const uploadFeedback = document.querySelector("#upload-feedback");
const mediaList = document.querySelector("#media-list");
const refreshButton = document.querySelector("#refresh-button");
const hideAllButton = document.querySelector("#hide-all-button");
const showAllButton = document.querySelector("#show-all-button");
const slideshowButton = document.querySelector("#slideshow-button");
const quebecTimeDisplay = document.querySelector("#quebec-time");
const settingsButton = document.querySelector("#settings-button");
const settingsModal = document.querySelector("#settings-modal");
const settingsForm = document.querySelector("#overlay-form");
const modalCloseButtons = settingsModal ? settingsModal.querySelectorAll("[data-modal-close]") : [];
const overlayEnabledInput = document.querySelector("#overlay-enabled");
const overlayModeSelect = document.querySelector("#overlay-mode");
const overlayHeightInput = document.querySelector("#overlay-height");
const overlayHeightValue = document.querySelector("#overlay-height-value");
const overlayBgInput = document.querySelector("#overlay-bg");
const overlayTextInput = document.querySelector("#overlay-text");
const overlayLogoInput = document.querySelector("#overlay-logo");
const overlayTickerTextInput = document.querySelector("#overlay-ticker-text");
const tickerSection = document.querySelector(".ticker-only");

let mediaItems = [];
let selectedFiles = [];
let quebecTimeTimer = null;
let overlaySettings = null;

const DEFAULT_OVERLAY_SETTINGS = {
  enabled: true,
  mode: "clock",
  height_vh: 5,
  background_color: "#f0f0f0",
  text_color: "#111111",
  logo_path: "static/img/logo-groupe-cardinal.png",
  ticker_text: "Bienvenue sur Cardinal TV",
};

const quebecDateFormatter = new Intl.DateTimeFormat("fr-CA", {
  timeZone: "America/Toronto",
  dateStyle: "medium",
});

const quebecTimeFormatter = new Intl.DateTimeFormat("fr-CA", {
  timeZone: "America/Toronto",
  timeStyle: "medium",
});

const updateQuebecTime = () => {
  if (!quebecTimeDisplay) {
    return;
  }
  const now = new Date();
  const formattedDate = quebecDateFormatter.format(now);
  const formattedTime = quebecTimeFormatter.format(now);
  quebecTimeDisplay.textContent = `Heure du Québec : ${formattedDate} • ${formattedTime}`;
};

const fetchJSON = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Requête échouée");
  }
  return response.json();
};

const formatFileSize = (size) => {
  if (!Number.isFinite(size)) {
    return "";
  }
  if (size >= 1_000_000) {
    return `${(size / 1_000_000).toFixed(1)} Mo`;
  }
  if (size >= 1_000) {
    return `${(size / 1_000).toFixed(1)} Ko`;
  }
  return `${size} o`;
};

const formatDateForInput = (value) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (num) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDatetimeForServer = (value) => (value ? value : null);

const highlightDropZone = (active) => {
  if (active) {
    dropZone.classList.add("drag-over");
  } else {
    dropZone.classList.remove("drag-over");
  }
};

const setUploadFeedback = (message, status = "info") => {
  uploadFeedback.textContent = message;
  uploadFeedback.dataset.status = status;
};

const renderEmptyState = () => {
  mediaList.innerHTML = "";
  const placeholder = document.createElement("div");
  placeholder.className = "empty-state";
  placeholder.textContent = "Aucun média pour le moment. Téléversez des fichiers pour construire la playlist.";
  mediaList.appendChild(placeholder);
};

const applyModeVisibility = (mode) => {
  if (!tickerSection) {
    return;
  }
  if (mode === "ticker") {
    tickerSection.classList.remove("hidden");
  } else {
    tickerSection.classList.add("hidden");
  }
};

const populateSettingsForm = (settings) => {
  if (!settingsForm) {
    return;
  }
  const overlay = { ...DEFAULT_OVERLAY_SETTINGS, ...settings };
  overlayEnabledInput.checked = Boolean(overlay.enabled);
  overlayModeSelect.value = overlay.mode || "clock";
  overlayHeightInput.value = overlay.height_vh ?? DEFAULT_OVERLAY_SETTINGS.height_vh;
  overlayHeightValue.textContent = overlayHeightInput.value;
  overlayBgInput.value = overlay.background_color || DEFAULT_OVERLAY_SETTINGS.background_color;
  overlayTextInput.value = overlay.text_color || DEFAULT_OVERLAY_SETTINGS.text_color;
  overlayLogoInput.value = overlay.logo_path || DEFAULT_OVERLAY_SETTINGS.logo_path;
  overlayTickerTextInput.value = overlay.ticker_text || "";
  applyModeVisibility(overlayModeSelect.value);
};

const serializeSettingsForm = () => ({
  enabled: overlayEnabledInput.checked,
  mode: overlayModeSelect.value,
  height_vh: parseFloat(overlayHeightInput.value) || DEFAULT_OVERLAY_SETTINGS.height_vh,
  background_color: overlayBgInput.value || DEFAULT_OVERLAY_SETTINGS.background_color,
  text_color: overlayTextInput.value || DEFAULT_OVERLAY_SETTINGS.text_color,
  logo_path: overlayLogoInput.value.trim(),
  ticker_text: overlayTickerTextInput.value.trim(),
});

const openSettingsModal = () => {
  if (!settingsModal) {
    return;
  }
  // Ensure the modal is not forcibly hidden ('.hidden' uses !important in CSS)
  settingsModal.classList.remove("hidden");
  settingsModal.classList.add("open");
  settingsModal.setAttribute("aria-hidden", "false");
  // Move focus into the modal for accessibility
  try {
    const firstFocusable = settingsModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  } catch (e) {
    // ignore
  }
};

const closeSettingsModal = () => {
  if (!settingsModal) {
    return;
  }
  settingsModal.classList.remove("open");
  // Re-hide using the hidden utility so CSS display:none !important takes effect
  settingsModal.classList.add("hidden");
  settingsModal.setAttribute("aria-hidden", "true");
  try {
    // Return focus to the settings button
    settingsButton?.focus();
  } catch (e) {
    // ignore
  }
};

const loadOverlaySettings = async () => {
  try {
    const data = await fetchJSON("api/settings");
    overlaySettings = (data && data.overlay) || { ...DEFAULT_OVERLAY_SETTINGS };
  } catch (error) {
    console.warn("Impossible de récupérer les paramètres de la bande:", error);
    overlaySettings = { ...DEFAULT_OVERLAY_SETTINGS };
  }
  populateSettingsForm(overlaySettings);
};

const detectMediaKind = (item) => {
  if (Array.isArray(item.page_urls) && item.page_urls.length) {
    return "document";
  }
  const type = (item.display_mimetype || item.mimetype || "").toLowerCase();
  if (type.startsWith("video/")) {
    return "video";
  }
  if (type.startsWith("image/")) {
    return "image";
  }
  const extension = (item.original_name || item.filename || "").split(".").pop()?.toLowerCase() || "";
  if (["mp4", "m4v", "mov", "webm", "mkv", "avi", "mpg", "mpeg"].includes(extension)) {
    return "video";
  }
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension)) {
    return "image";
  }
  if (["pdf", "doc", "docx", "txt", "rtf", "md"].includes(extension)) {
    return "document";
  }
  return "other";
};

const sendOrderUpdate = async () => {
  const order = mediaItems.map((item) => item.id);
  await fetchJSON("api/media/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order }),
  });
};

const moveItem = async (id, delta) => {
  const index = mediaItems.findIndex((item) => item.id === id);
  const swapIndex = index + delta;
  if (index === -1 || swapIndex < 0 || swapIndex >= mediaItems.length) {
    return;
  }
  const [removed] = mediaItems.splice(index, 1);
  mediaItems.splice(swapIndex, 0, removed);
  renderMedia();
  try {
    await sendOrderUpdate();
  } catch (error) {
    console.error(error);
  } finally {
    await loadMedia();
  }
};

const saveItem = async (id, payload) => {
  const updated = await fetchJSON(`api/media/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const index = mediaItems.findIndex((item) => item.id === id);
  if (index >= 0) {
    mediaItems[index] = updated;
  }
  renderMedia();
};

const deleteItem = async (id) => {
  await fetchJSON(`api/media/${id}`, { method: "DELETE" });
  mediaItems = mediaItems.filter((item) => item.id !== id);
  renderMedia();
};

const createToggle = (labelText, input) => {
  const wrapper = document.createElement("label");
  wrapper.className = "toggle";
  const text = document.createElement("span");
  text.textContent = labelText;
  wrapper.append(input, text);
  return wrapper;
};

const createInputGroup = (labelText, input) => {
  const group = document.createElement("label");
  group.className = "field-group";
  const span = document.createElement("span");
  span.textContent = labelText;
  group.append(span, input);
  return group;
};

const createMediaCard = (item, index) => {
  const card = document.createElement("article");
  card.className = "media-card";
  card.dataset.id = item.id;

  const header = document.createElement("div");
  header.className = "media-card-header";

  const orderBadge = document.createElement("span");
  orderBadge.className = "order-badge";
  orderBadge.textContent = String(index + 1);

  const orderButtons = document.createElement("div");
  orderButtons.className = "order-buttons";

  const upButton = document.createElement("button");
  upButton.type = "button";
  upButton.className = "secondary-button icon-button";
  upButton.textContent = "▲";
  upButton.disabled = index === 0;
  upButton.addEventListener("click", () => moveItem(item.id, -1));

  const downButton = document.createElement("button");
  downButton.type = "button";
  downButton.className = "secondary-button icon-button";
  downButton.textContent = "▼";
  downButton.disabled = index === mediaItems.length - 1;
  downButton.addEventListener("click", () => moveItem(item.id, 1));

  orderButtons.append(upButton, downButton);
  header.append(orderBadge, orderButtons);

  const body = document.createElement("div");
  body.className = "media-card-body";

  const title = document.createElement("h3");
  title.textContent = item.original_name || item.filename;

  const meta = document.createElement("p");
  meta.className = "media-meta";
  const infoParts = [];
  if (item.mimetype) {
    infoParts.push(item.mimetype);
  }
  if (Number.isFinite(item.size)) {
    infoParts.push(formatFileSize(item.size));
  }
  const pagesCount = Array.isArray(item.page_urls) ? item.page_urls.length : 0;
  if (pagesCount) {
    infoParts.push(`${pagesCount} page${pagesCount > 1 ? "s" : ""}`);
  }
  meta.textContent = infoParts.join(" • ");

  const linkRow = document.createElement("div");
  linkRow.className = "media-links";
  const previewLink = document.createElement("a");
  previewLink.href = item.url;
  previewLink.target = "_blank";
  previewLink.rel = "noopener";
  previewLink.textContent = "Prévisualiser";
  linkRow.appendChild(previewLink);

  body.append(title, meta, linkRow);

  const controls = document.createElement("div");
  controls.className = "media-card-controls";

  const enabledInput = document.createElement("input");
  enabledInput.type = "checkbox";
  // For UX we present a 'Masquer' checkbox: checked means the media is hidden.
  enabledInput.checked = !Boolean(item.enabled);
  enabledInput.dataset.field = "enabled";
  controls.appendChild(createToggle("Masquer", enabledInput));

  const kind = detectMediaKind(item);
  let muteInput = null;
  if (kind === "video") {
    muteInput = document.createElement("input");
    muteInput.type = "checkbox";
    muteInput.checked = Boolean(item.muted);
    muteInput.dataset.field = "muted";
    controls.appendChild(createToggle("Muet", muteInput));
  }

  const grid = document.createElement("div");
  grid.className = "media-card-grid";

  const startInput = document.createElement("input");
  startInput.type = "datetime-local";
  startInput.value = formatDateForInput(item.start_at);
  startInput.dataset.field = "start_at";
  grid.appendChild(createInputGroup("Début", startInput));

  const endInput = document.createElement("input");
  endInput.type = "datetime-local";
  endInput.value = formatDateForInput(item.end_at);
  endInput.dataset.field = "end_at";
  grid.appendChild(createInputGroup("Fin", endInput));

  let durationInput = null;
  if (kind !== "video") {
    durationInput = document.createElement("input");
    durationInput.type = "number";
    durationInput.min = "1";
    durationInput.step = "1";
    durationInput.value = Math.round(Number(item.duration) || 10);
    durationInput.dataset.field = "duration";
    grid.appendChild(createInputGroup("Durée (s)", durationInput));
  }

  const skipInput = document.createElement("input");
  skipInput.type = "number";
  skipInput.min = "0";
  skipInput.step = "1";
  skipInput.value = Math.max(0, Number(item.skip_rounds) || 0);
  skipInput.dataset.field = "skip_rounds";
  grid.appendChild(createInputGroup("Sauts", skipInput));

  const actions = document.createElement("div");
  actions.className = "media-card-actions";

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "primary-button";
  saveButton.textContent = "Enregistrer";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "secondary-button";
  deleteButton.textContent = "Supprimer";

  saveButton.addEventListener("click", async () => {
    const payload = {
      // enabled in server means "visible"; since checkbox is "Masquer" (checked => hidden)
      enabled: !enabledInput.checked,
      start_at: formatDatetimeForServer(startInput.value),
      end_at: formatDatetimeForServer(endInput.value),
      skip_rounds: Math.max(0, Number(skipInput.value) || 0),
    };
    if (durationInput) {
      payload.duration = Number(durationInput.value) || 0;
    }
    if (muteInput) {
      payload.muted = muteInput.checked;
    }
    saveButton.disabled = true;
    saveButton.textContent = "Enregistrement...";
    try {
      await saveItem(item.id, payload);
      saveButton.textContent = "Enregistré";
    } catch (error) {
      console.error(error);
      saveButton.textContent = "Erreur";
    } finally {
      setTimeout(() => {
        saveButton.disabled = false;
        saveButton.textContent = "Enregistrer";
      }, 1400);
    }
  });

  deleteButton.addEventListener("click", async () => {
    if (!window.confirm("Supprimer ce média ?")) {
      return;
    }
    deleteButton.disabled = true;
    deleteButton.textContent = "Suppression...";
    try {
      await deleteItem(item.id);
    } catch (error) {
      console.error(error);
      deleteButton.textContent = "Erreur";
      setTimeout(() => {
        deleteButton.disabled = false;
        deleteButton.textContent = "Supprimer";
      }, 1400);
    }
  });

  actions.append(saveButton, deleteButton);

  card.append(header, body, controls, grid, actions);
  return card;
};

const renderMedia = () => {
  if (!mediaItems.length) {
    renderEmptyState();
    return;
  }

  mediaList.innerHTML = "";
  mediaItems.forEach((item, index) => {
    const card = createMediaCard(item, index);
    mediaList.appendChild(card);
  });
};

const loadMedia = async () => {
  try {
    const data = await fetchJSON("api/media");
    mediaItems = Array.isArray(data) ? data : [];
    renderMedia();
  } catch (error) {
    console.error("Impossible de charger les médias:", error);
    mediaList.innerHTML = "";
    const message = document.createElement("div");
    message.className = "empty-state error";
    message.textContent = "Erreur lors du chargement des médias.";
    mediaList.appendChild(message);
  }
};

const setSelectedFiles = (files) => {
  selectedFiles = Array.from(files || []);
  if (!selectedFiles.length) {
    setUploadFeedback("Aucun fichier sélectionné.");
    return;
  }
  if (selectedFiles.length === 1) {
    setUploadFeedback(`Fichier prêt: ${selectedFiles[0].name}`);
  } else {
    setUploadFeedback(`${selectedFiles.length} fichiers prêts à être téléversés.`);
  }
};

const performUpload = async () => {
  if (!selectedFiles.length) {
    setUploadFeedback("Aucun fichier sélectionné.", "error");
    return;
  }
  const formData = new FormData();
  selectedFiles.forEach((file) => formData.append("files", file));
  setUploadFeedback("Téléversement en cours...");
  try {
    await fetchJSON("api/upload", {
      method: "POST",
      body: formData,
    });
    setUploadFeedback("Téléversement réussi !");
    fileInput.value = "";
    selectedFiles = [];
    await loadMedia();
  } catch (error) {
    console.error(error);
    setUploadFeedback("Erreur lors du téléversement.", "error");
  }
};

uploadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  performUpload();
});

fileInput.addEventListener("change", (event) => {
  setSelectedFiles(event.target.files);
});

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    highlightDropZone(true);
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    highlightDropZone(false);
  });
});

dropZone.addEventListener("drop", (event) => {
  const { files } = event.dataTransfer || {};
  if (files && files.length) {
    setSelectedFiles(files);
  }
});

refreshButton.addEventListener("click", () => {
  loadMedia();
});

hideAllButton?.addEventListener("click", async () => {
  if (!mediaItems.length) return;
  const confirmAction = window.confirm('Masquer tous les médias ?');
  if (!confirmAction) return;
  try {
    for (const item of mediaItems) {
      await saveItem(item.id, { enabled: false });
    }
    await loadMedia();
  } catch (error) {
    console.error(error);
    alert('Erreur lors du masquage global.');
  }
});

showAllButton?.addEventListener("click", async () => {
  if (!mediaItems.length) return;
  const confirmAction = window.confirm('Démasquer tous les médias ?');
  if (!confirmAction) return;
  try {
    for (const item of mediaItems) {
      await saveItem(item.id, { enabled: true });
    }
    await loadMedia();
  } catch (error) {
    console.error(error);
    alert('Erreur lors du démasquage global.');
  }
});

slideshowButton.addEventListener("click", () => {
  try {
    sessionStorage.setItem("cardinal_auto_slideshow", "1");
  } catch (error) {
    console.warn("Impossible d'accéder au stockage de session:", error);
  }
  window.location.href = "slideshow";
});

overlayHeightInput?.addEventListener("input", () => {
  overlayHeightValue.textContent = overlayHeightInput.value;
});

overlayModeSelect?.addEventListener("change", () => {
  applyModeVisibility(overlayModeSelect.value);
});

settingsButton?.addEventListener("click", async () => {
  if (!overlaySettings) {
    await loadOverlaySettings();
  } else {
    populateSettingsForm(overlaySettings);
  }
  openSettingsModal();
});

modalCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeSettingsModal();
  });
});

settingsModal?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.modalClose !== undefined) {
    closeSettingsModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settingsModal?.classList.contains("open")) {
    closeSettingsModal();
  }
});

settingsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const overlayPayload = serializeSettingsForm();
  try {
    const response = await fetchJSON("api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overlay: overlayPayload }),
    });
    overlaySettings = (response && response.overlay) || overlayPayload;
    closeSettingsModal();
  } catch (error) {
    console.error("Impossible d'enregistrer les paramètres de la bande:", error);
  }
});

window.addEventListener("load", async () => {
  await loadOverlaySettings();
  loadMedia();
  updateQuebecTime();
  if (!quebecTimeTimer) {
    quebecTimeTimer = setInterval(updateQuebecTime, 1000);
  }
});
