/**
 * news_editor.js - Éditeur de la diapositive Nouvelles (RSS)
 * Cardinal TV
 */
(() => {
  'use strict';

  const normalizeBaseUrl = (value) => {
    if (!value) return '/';
    return value.endsWith('/') ? value : `${value}/`;
  };

  const baseUrl = normalizeBaseUrl(document.body?.dataset?.baseUrl || '/');

  const buildApiUrl = (path) => {
    if (!path) return baseUrl;
    if (typeof path !== 'string') return baseUrl;
    const lowered = path.toLowerCase();
    if (lowered.startsWith('http://') || lowered.startsWith('https://') || path.startsWith('//')) {
      return path;
    }
    if (path.startsWith('/')) return path;
    return `${baseUrl}${path.replace(/^\//, '')}`;
  };

  const API_BASE = buildApiUrl('api/news-slide');
  let config = {};
  let newsItems = [];

  // Elements
  const enabledToggle = document.getElementById('news-enabled');
  const scrollDelayInput = document.getElementById('news-scroll-delay');
  const scrollSpeedInput = document.getElementById('news-scroll-speed');
  const scrollSpeedValue = document.getElementById('news-scroll-speed-value');
  const maxItemsInput = document.getElementById('news-max-items');
  const saveBtn = document.getElementById('news-save');
  const statusEl = document.getElementById('news-status');
  const feedsList = document.getElementById('feeds-list');
  const newsPreview = document.getElementById('news-preview');
  const addFeedBtn = document.getElementById('add-feed-btn');
  const refreshNewsBtn = document.getElementById('refresh-news-btn');

  // Card style elements
  const cardBgColor = document.getElementById('card-bg-color');
  const cardBgOpacity = document.getElementById('card-bg-opacity');
  const cardBgOpacityValue = document.getElementById('card-bg-opacity-value');
  const cardTitleColor = document.getElementById('card-title-color');
  const cardTimeColor = document.getElementById('card-time-color');
  const cardTitleSize = document.getElementById('card-title-size');
  const cardTimeSize = document.getElementById('card-time-size');
  const cardSourceSize = document.getElementById('card-source-size');
  const cardDescriptionSize = document.getElementById('card-description-size');
  const cardWidth = document.getElementById('card-width');
  const cardHeight = document.getElementById('card-height');
  const cardsPerRow = document.getElementById('cards-per-row');
  const showImage = document.getElementById('show-image');
  const showTime = document.getElementById('show-time');
  const imageWidth = document.getElementById('news-image-width');
  const imageHeight = document.getElementById('news-image-height');
  const slidePreviewFrame = document.querySelector('.news-slide-preview-iframe');
  let autoSaveTimer = null;

  // Modal elements
  const modal = document.getElementById('add-feed-modal');
  const modalClose = modal?.querySelector('.modal-close');
  const modalOverlay = modal?.querySelector('.modal-overlay');
  const cancelFeedBtn = document.getElementById('cancel-feed-btn');
  const confirmFeedBtn = document.getElementById('confirm-feed-btn');
  const newFeedName = document.getElementById('new-feed-name');
  const newFeedUrl = document.getElementById('new-feed-url');

  function showStatus(message, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle('error', isError);
    statusEl.classList.add('visible');
    setTimeout(() => statusEl.classList.remove('visible'), 3000);
  }

  function buildPreviewSettings(cfg) {
    const style = cfg.card_style || {};
    const layout = cfg.layout || {};
    return {
      enabled: cfg.enabled || false,
      order_index: cfg.order_index || 0,
      duration: cfg.duration || 20,
      scroll_delay: cfg.scroll_delay || 3,
      scroll_speed: cfg.scroll_speed || 50,
      max_items: cfg.max_items || 10,
      card_background_color: style.background_color || '#1a1a2e',
      card_background_opacity: style.background_opacity ?? 0.9,
      card_title_color: style.title_color || '#f8fafc',
      card_time_color: style.time_color || '#94a3b8',
      card_title_size: style.title_size || 28,
      card_time_size: style.time_size || 18,
      card_source_size: style.source_size || 16,
      card_description_size: style.description_size || 16,
      card_border_radius: style.border_radius || 12,
      card_padding: style.padding || 20,
      card_width_percent: layout.card_width_percent || 90,
      card_height_percent: layout.card_height_percent || 25,
      card_gap: layout.card_gap || 20,
      cards_per_row: layout.cards_per_row || 1,
      show_image: layout.show_image !== false,
      show_time: layout.show_time !== false,
      image_width: layout.image_width || 0,
      image_height: layout.image_height || 0,
    };
  }

  function postSlidePreviewUpdate() {
    if (!slidePreviewFrame?.contentWindow) return false;
    slidePreviewFrame.contentWindow.postMessage({
      type: 'news:preview',
      settings: buildPreviewSettings(config),
      items: newsItems,
    }, '*');
    return true;
  }

  function scheduleAutoSave() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    autoSaveTimer = setTimeout(async () => {
      await saveConfig();
    }, 400);
  }

  async function fetchConfig() {
    try {
      const response = await fetch(API_BASE);
      const data = await response.json();
      config = data.config || {};
      newsItems = data.items || [];
      updateUI();
      renderFeeds();
      renderNewsPreview();
      postSlidePreviewUpdate();
    } catch (error) {
      console.error('Erreur lors du chargement de la config:', error);
      showStatus('Erreur de chargement', true);
    }
  }

  function updateUI() {
    if (enabledToggle) enabledToggle.checked = config.enabled || false;
    if (scrollDelayInput) scrollDelayInput.value = config.scroll_delay || 3;
    if (scrollSpeedInput) {
      scrollSpeedInput.value = config.scroll_speed || 50;
      if (scrollSpeedValue) scrollSpeedValue.textContent = scrollSpeedInput.value;
    }
    if (maxItemsInput) maxItemsInput.value = config.max_items || 10;

    // Card style
    const style = config.card_style || {};
    if (cardBgColor) cardBgColor.value = style.background_color || '#1a1a2e';
    if (cardBgOpacity) {
      cardBgOpacity.value = style.background_opacity ?? 0.9;
      if (cardBgOpacityValue) cardBgOpacityValue.textContent = `${Math.round(cardBgOpacity.value * 100)}%`;
    }
    if (cardTitleColor) cardTitleColor.value = style.title_color || '#ffffff';
    if (cardTimeColor) cardTimeColor.value = style.time_color || '#a3a3a3';
    if (cardTitleSize) cardTitleSize.value = style.title_size || 28;
    if (cardTimeSize) cardTimeSize.value = style.time_size || 18;
    if (cardSourceSize) cardSourceSize.value = style.source_size || 16;
    if (cardDescriptionSize) cardDescriptionSize.value = style.description_size || 16;

    // Layout
    const layout = config.layout || {};
    if (cardWidth) cardWidth.value = layout.card_width_percent || 90;
    if (cardHeight) cardHeight.value = layout.card_height_percent || 25;
    if (cardsPerRow) cardsPerRow.value = layout.cards_per_row || 1;
    if (showImage) showImage.checked = layout.show_image !== false;
    if (showTime) showTime.checked = layout.show_time !== false;
    if (imageWidth) imageWidth.value = layout.image_width || 0;
    if (imageHeight) imageHeight.value = layout.image_height || 0;
  }

  function renderFeeds() {
    if (!feedsList) return;
    const feeds = config.rss_feeds || [];

    if (feeds.length === 0) {
      feedsList.innerHTML = '<p class="playlist-subtitle">Aucun flux RSS configuré.</p>';
      return;
    }

    feedsList.innerHTML = feeds.map(feed => `
      <div class="feed-item" data-feed-id="${feed.id}">
        <div class="feed-info">
          <label class="visibility-toggle feed-toggle">
            <span class="visibility-toggle-label visibility-toggle-label-on">Actif</span>
            <div class="visibility-toggle-switch">
              <input type="checkbox" class="feed-enabled" ${feed.enabled !== false ? 'checked' : ''} />
              <span class="visibility-toggle-slider"></span>
            </div>
            <span class="visibility-toggle-label visibility-toggle-label-off">Inactif</span>
          </label>
          <div class="feed-details">
            <strong class="feed-name">${escapeHtml(feed.name)}</strong>
            <span class="feed-url">${escapeHtml(feed.url)}</span>
          </div>
        </div>
        <button type="button" class="secondary-button delete-feed-btn" data-feed-id="${feed.id}">Supprimer</button>
      </div>
    `).join('');

    // Attach event listeners
    feedsList.querySelectorAll('.feed-enabled').forEach(checkbox => {
      checkbox.addEventListener('change', handleFeedToggle);
    });
    feedsList.querySelectorAll('.delete-feed-btn').forEach(btn => {
      btn.addEventListener('click', handleDeleteFeed);
    });
  }

  function renderNewsPreview() {
    if (!newsPreview) return;

    if (newsItems.length === 0) {
      newsPreview.innerHTML = '<p class="playlist-subtitle">Aucune nouvelle à afficher. Ajoutez des flux RSS.</p>';
      return;
    }

    newsPreview.style.gridTemplateColumns = `repeat(auto-fit, minmax(280px, 1fr))`;

    newsPreview.innerHTML = newsItems.map(item => `
      <div class="news-card">
        ${item.image ? `
          <div class="news-card-image">
            <img src="${escapeHtml(item.image)}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'" />
          </div>
        ` : ''}
        <div class="news-card-content">
          <h3 class="news-card-title">${escapeHtml(item.title)}</h3>
          ${item.description ? `<p class="news-card-description">${escapeHtml(item.description)}</p>` : ''}
          ${item.time ? `
            <span class="news-card-time">${escapeHtml(item.time)}</span>
          ` : ''}
          ${item.source ? `<span class="news-card-source">${escapeHtml(item.source)}</span>` : ''}
        </div>
      </div>
    `).join('');
  }

  async function saveConfig(options = {}) {
    const includeFeeds = options.includeFeeds === true;
    const payload = {
      enabled: enabledToggle?.checked || false,
      scroll_delay: parseFloat(scrollDelayInput?.value) || 3,
      scroll_speed: parseInt(scrollSpeedInput?.value) || 50,
      max_items: parseInt(maxItemsInput?.value) || 10,
      card_style: {
        background_color: cardBgColor?.value || '#1a1a2e',
        background_opacity: parseFloat(cardBgOpacity?.value) || 0.9,
        title_color: cardTitleColor?.value || '#ffffff',
        time_color: cardTimeColor?.value || '#a3a3a3',
        title_size: parseInt(cardTitleSize?.value) || 28,
        time_size: parseInt(cardTimeSize?.value) || 18,
        source_size: parseInt(cardSourceSize?.value) || 16,
        description_size: parseInt(cardDescriptionSize?.value) || 16,
        border_radius: config.card_style?.border_radius || 12,
        padding: config.card_style?.padding || 20,
      },
      layout: {
        card_width_percent: parseInt(cardWidth?.value) || 90,
        card_height_percent: parseInt(cardHeight?.value) || 25,
        card_gap: config.layout?.card_gap || 20,
        cards_per_row: Math.max(1, Math.min(4, parseInt(cardsPerRow?.value) || 1)),
        show_image: showImage?.checked !== false,
        show_time: showTime?.checked !== false,
        image_width: parseInt(imageWidth?.value) || 0,
        image_height: parseInt(imageHeight?.value) || 0,
      },
    };
    if (includeFeeds) {
      payload.rss_feeds = config.rss_feeds || [];
    }

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Erreur serveur');

      const data = await response.json();
      config = data.config || config;
      showStatus('Configuration enregistrée');
      renderNewsPreview();
      postSlidePreviewUpdate();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showStatus('Erreur de sauvegarde', true);
    }
  }

  async function handleFeedToggle(event) {
    const feedItem = event.target.closest('.feed-item');
    const feedId = feedItem?.dataset.feedId;
    if (!feedId) return;

    const feeds = config.rss_feeds || [];
    const feed = feeds.find(f => f.id === feedId);
    if (feed) {
      feed.enabled = event.target.checked;
      await saveConfig({ includeFeeds: true });
    }
  }

  async function handleDeleteFeed(event) {
    const feedId = event.target.dataset.feedId;
    if (!feedId) return;

    if (!confirm('Supprimer ce flux RSS ?')) return;

    try {
      const response = await fetch(`${API_BASE}/feeds/${feedId}`, { method: 'DELETE' });
      const data = await response.json();
      config = data.config || config;
      renderFeeds();
      showStatus('Flux supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showStatus('Erreur de suppression', true);
    }
  }

  async function handleAddFeed() {
    const name = newFeedName?.value?.trim();
    const url = newFeedUrl?.value?.trim();

    if (!name || !url) {
      showStatus('Nom et URL requis', true);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/feeds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url }),
      });

      const data = await response.json();
      config = data.config || config;
      renderFeeds();
      closeModal();
      showStatus('Flux ajouté');

      // Clear inputs
      if (newFeedName) newFeedName.value = '';
      if (newFeedUrl) newFeedUrl.value = '';
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      showStatus('Erreur d\'ajout', true);
    }
  }

  async function refreshNews() {
    try {
      const response = await fetch(`${API_BASE}/items?force=true`);
      const data = await response.json();
      newsItems = data.items || [];
      renderNewsPreview();
      showStatus('Nouvelles actualisées');
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      showStatus('Erreur de rafraîchissement', true);
    }
  }

  function openModal() {
    if (modal) modal.hidden = false;
  }

  function closeModal() {
    if (modal) modal.hidden = true;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  function hexToRgba(hex, alpha) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
  }

  // Event listeners
  saveBtn?.addEventListener('click', saveConfig);
  refreshNewsBtn?.addEventListener('click', refreshNews);
  addFeedBtn?.addEventListener('click', openModal);
  modalClose?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', closeModal);
  cancelFeedBtn?.addEventListener('click', closeModal);
  confirmFeedBtn?.addEventListener('click', handleAddFeed);

  scrollSpeedInput?.addEventListener('input', () => {
    if (scrollSpeedValue) scrollSpeedValue.textContent = scrollSpeedInput.value;
    scheduleAutoSave();
  });

  cardBgOpacity?.addEventListener('input', () => {
    if (cardBgOpacityValue) cardBgOpacityValue.textContent = `${Math.round(cardBgOpacity.value * 100)}%`;
    scheduleAutoSave();
  });

  [
    enabledToggle,
    scrollDelayInput,
    scrollSpeedInput,
    maxItemsInput,
    cardBgColor,
    cardBgOpacity,
    cardTitleColor,
    cardTimeColor,
    cardTitleSize,
    cardTimeSize,
    cardSourceSize,
    cardDescriptionSize,
    cardWidth,
    cardHeight,
    cardsPerRow,
    showImage,
    showTime,
    imageWidth,
    imageHeight,
  ]
    .filter(Boolean)
    .forEach((input) => {
      input.addEventListener('change', scheduleAutoSave);
      input.addEventListener('input', scheduleAutoSave);
    });

  // Initialize
  fetchConfig();
})();
