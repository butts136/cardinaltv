/**
 * weather_editor.js - Éditeur de la diapositive Météo
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

  const API_BASE = buildApiUrl('api/weather-slide');
  let config = {};
  let weatherData = null;

  // Main elements
  const enabledToggle = document.getElementById('weather-enabled');
  const durationInput = document.getElementById('weather-duration');
  const locationName = document.getElementById('weather-location-name');
  const latitudeInput = document.getElementById('weather-latitude');
  const longitudeInput = document.getElementById('weather-longitude');
  const weatherCitySuggestions = document.getElementById('weather-city-suggestions');
  const saveBtn = document.getElementById('weather-save');
  const statusEl = document.getElementById('weather-status');
  const refreshWeatherBtn = document.getElementById('refresh-weather-btn');

  // Display options
  const showCurrent = document.getElementById('show-current');
  const showFeelsLike = document.getElementById('show-feels-like');
  const showHumidity = document.getElementById('show-humidity');
  const showWind = document.getElementById('show-wind');
  const showForecast = document.getElementById('show-forecast');
  const forecastDays = document.getElementById('forecast-days');
  const iconSizeInput = document.getElementById('weather-icon-size');
  const tempSizeInput = document.getElementById('weather-temp-size');
  const conditionSizeInput = document.getElementById('weather-condition-size');
  const detailLabelSizeInput = document.getElementById('weather-detail-label-size');
  const detailValueSizeInput = document.getElementById('weather-detail-value-size');
  const forecastIconSizeInput = document.getElementById('weather-forecast-icon-size');
  const forecastTextSizeInput = document.getElementById('weather-forecast-text-size');
  const forecastMinWidthInput = document.getElementById('weather-forecast-min-width');
  const cardOpacityInput = document.getElementById('weather-card-opacity');
  const cardOpacityValue = document.getElementById('weather-card-opacity-value');

  // Preview elements
  const weatherIcon = document.getElementById('weather-icon');
  const weatherTemp = document.getElementById('weather-temp');
  const weatherCondition = document.getElementById('weather-condition');
  const weatherTempDay = document.getElementById('weather-temp-day');
  const weatherTempEvening = document.getElementById('weather-temp-evening');
  const weatherTempNight = document.getElementById('weather-temp-night');
  const weatherTempMax = document.getElementById('weather-temp-max');
  const weatherTempMin = document.getElementById('weather-temp-min');
  const weatherHumidity = document.getElementById('weather-humidity');
  const weatherWind = document.getElementById('weather-wind');
  const weatherForecast = document.getElementById('weather-forecast');
  const weatherPreview = document.getElementById('weather-preview');
  const weatherLocationLabel = document.getElementById('weather-location');
  const slidePreviewFrame = document.getElementById('weather-slide-preview');

  // Seasonal backgrounds toggle
  const useSeasonalBg = document.getElementById('use-seasonal-bg');

  let citySearchTimer = null;

  function postSlidePreviewRefresh() {
    if (!slidePreviewFrame?.contentWindow) return false;
    slidePreviewFrame.contentWindow.postMessage({ type: 'weather:refresh' }, '*');
    return true;
  }

  function showStatus(message, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle('error', isError);
    statusEl.classList.add('visible');
    setTimeout(() => statusEl.classList.remove('visible'), 3000);
  }

  async function fetchConfig() {
    try {
      const response = await fetch(API_BASE);
      const data = await response.json();
      config = data.config || {};
      weatherData = data.weather || null;
      updateUI();
      updateWeatherPreview();
      postSlidePreviewRefresh();
    } catch (error) {
      console.error('Erreur lors du chargement de la config:', error);
      showStatus('Erreur de chargement', true);
    }
  }

  function updateUI() {
    if (enabledToggle) enabledToggle.checked = config.enabled || false;
    if (durationInput) durationInput.value = config.duration || 15;

    const location = config.location || {};
    if (locationName) locationName.value = location.name || 'Québec';
    if (latitudeInput) latitudeInput.value = location.latitude || 46.8139;
    if (longitudeInput) longitudeInput.value = location.longitude || -71.2080;

    const display = config.display || {};
    if (showCurrent) showCurrent.checked = display.show_current !== false;
    if (showFeelsLike) showFeelsLike.checked = display.show_feels_like !== false;
    if (showHumidity) showHumidity.checked = display.show_humidity !== false;
    if (showWind) showWind.checked = display.show_wind !== false;
    if (showForecast) showForecast.checked = display.show_forecast !== false;
    if (forecastDays) forecastDays.value = display.forecast_days || 5;
    if (iconSizeInput) iconSizeInput.value = display.icon_size || 210;
    if (tempSizeInput) tempSizeInput.value = display.temp_size || 150;
    if (conditionSizeInput) conditionSizeInput.value = display.condition_size || 58;
    if (detailLabelSizeInput) detailLabelSizeInput.value = display.detail_label_size || 30;
    if (detailValueSizeInput) detailValueSizeInput.value = display.detail_value_size || 44;
    if (forecastIconSizeInput) forecastIconSizeInput.value = display.forecast_icon_size || 70;
    if (forecastTextSizeInput) forecastTextSizeInput.value = display.forecast_temp_size || 34;
    if (forecastMinWidthInput) forecastMinWidthInput.value = display.forecast_min_width || 200;
    if (cardOpacityInput) {
      const opacity = Number.isFinite(Number(display.card_opacity))
        ? Number(display.card_opacity)
        : 1;
      const percent = Math.round(opacity * 100);
      cardOpacityInput.value = String(percent);
      if (cardOpacityValue) cardOpacityValue.textContent = `${percent}%`;
    }

    if (useSeasonalBg) useSeasonalBg.checked = config.use_seasonal_backgrounds || false;
  }

  function updateWeatherPreview() {
    if (!weatherData || !weatherData.current) {
      if (weatherCondition) weatherCondition.textContent = 'Données non disponibles';
      return;
    }

    const current = weatherData.current;
    const showCurrentValue = showCurrent?.checked !== false;
    const showHumidityValue = showHumidity?.checked !== false;
    const showWindValue = showWind?.checked !== false;
    const showForecastValue = showForecast?.checked !== false;

    if (weatherIcon) weatherIcon.textContent = current.icon || '🌤️';
    if (weatherTemp) weatherTemp.textContent = current.temperature != null ? `${Math.round(current.temperature)}°C` : '--°C';
    if (weatherCondition) weatherCondition.textContent = current.condition_label || 'Variable';
    if (weatherLocationLabel) weatherLocationLabel.textContent = weatherData.location || locationName?.value || '—';
    const todayForecast = Array.isArray(weatherData.forecast) ? weatherData.forecast[0] : null;

    const formatTemp = (value, feels) => {
      const tempLabel = value != null ? Math.round(value) : '--';
      const feelsLabel = feels != null ? Math.round(feels) : '--';
      return `
        <span class="temp-split">
          <span class="temp-value">${tempLabel}°C</span>
          <span class="temp-feels">(${feelsLabel})</span>
        </span>
      `;
    };

    if (weatherTempDay) {
      weatherTempDay.innerHTML = todayForecast ? formatTemp(todayForecast.temp_day, todayForecast.feels_day) : '--°C';
    }
    if (weatherTempEvening) {
      weatherTempEvening.innerHTML = todayForecast ? formatTemp(todayForecast.temp_evening, todayForecast.feels_evening) : '--°C';
    }
    if (weatherTempNight) {
      weatherTempNight.innerHTML = todayForecast ? formatTemp(todayForecast.temp_night, todayForecast.feels_night) : '--°C';
    }
    if (weatherTempMax) weatherTempMax.textContent = current.temp_max != null ? `${Math.round(current.temp_max)}°C` : '--°C';
    if (weatherTempMin) weatherTempMin.textContent = current.temp_min != null ? `${Math.round(current.temp_min)}°C` : '--°C';
    if (weatherHumidity) weatherHumidity.textContent = current.humidity != null ? `${current.humidity}%` : '--%';
    if (weatherWind) weatherWind.textContent = current.wind_speed != null ? `${Math.round(current.wind_speed)} km/h` : '-- km/h';

    if (weatherPreview) {
      weatherPreview.style.setProperty('--weather-preview-icon-size', `${parseInt(iconSizeInput?.value, 10) || 210}px`);
      weatherPreview.style.setProperty('--weather-preview-temp-size', `${parseInt(tempSizeInput?.value, 10) || 150}px`);
      weatherPreview.style.setProperty('--weather-preview-condition-size', `${parseInt(conditionSizeInput?.value, 10) || 58}px`);
      weatherPreview.style.setProperty('--weather-preview-detail-label-size', `${parseInt(detailLabelSizeInput?.value, 10) || 30}px`);
      weatherPreview.style.setProperty('--weather-preview-detail-value-size', `${parseInt(detailValueSizeInput?.value, 10) || 44}px`);
      weatherPreview.style.setProperty('--weather-preview-forecast-icon-size', `${parseInt(forecastIconSizeInput?.value, 10) || 70}px`);
      weatherPreview.style.setProperty('--weather-preview-forecast-text-size', `${parseInt(forecastTextSizeInput?.value, 10) || 34}px`);
      weatherPreview.style.setProperty('--weather-preview-forecast-min-width', `${parseInt(forecastMinWidthInput?.value, 10) || 200}px`);
      const percent = Number.parseFloat(cardOpacityInput?.value);
      if (Number.isFinite(percent)) {
        const opacity = Math.min(100, Math.max(20, percent)) / 100;
        weatherPreview.style.setProperty('--weather-card-opacity', String(opacity));
        if (cardOpacityValue) cardOpacityValue.textContent = `${Math.round(percent)}%`;
      }
    }

    if (weatherTemp) weatherTemp.style.display = showCurrentValue ? '' : 'none';
    if (weatherHumidity?.parentElement) weatherHumidity.parentElement.style.display = showHumidityValue ? '' : 'none';
    if (weatherWind?.parentElement) weatherWind.parentElement.style.display = showWindValue ? '' : 'none';
    if (weatherForecast) weatherForecast.style.display = showForecastValue ? '' : 'none';

    // Render forecast
    if (showForecastValue) {
      renderForecast();
    }
  }

  function renderForecast() {
    if (!weatherForecast || !weatherData?.forecast) return;

    const days = parseInt(forecastDays?.value) || 5;
    const forecast = weatherData.forecast.slice(1, days + 1);

    if (forecast.length === 0) {
      weatherForecast.innerHTML = '<p class="playlist-subtitle">Aucune prévision disponible.</p>';
      return;
    }

    const formatTemp = (value, feels) => {
      const tempLabel = value != null ? Math.round(value) : '--';
      const feelsLabel = feels != null ? Math.round(feels) : '--';
      return `${tempLabel} <span class="temp-feels">(${feelsLabel})</span>`;
    };

    const rows = forecast.map(day => `
      <tr>
        <td class="forecast-cell weekday">${day.weekday || '--'}</td>
        <td class="forecast-cell icon">${day.icon || '🌤️'}</td>
        <td class="forecast-cell number">${formatTemp(day.temp_day, day.feels_day)}</td>
        <td class="forecast-cell number">${formatTemp(day.temp_evening, day.feels_evening)}</td>
        <td class="forecast-cell number">${formatTemp(day.temp_night, day.feels_night)}</td>
        <td class="forecast-cell number">${day.temp_max != null ? Math.round(day.temp_max) : '--'}°</td>
        <td class="forecast-cell number">${day.temp_min != null ? Math.round(day.temp_min) : '--'}°</td>
        <td class="forecast-cell number">${day.wind_max != null ? `${Math.round(day.wind_max)} km/h${day.wind_peak ? ` (${day.wind_peak})` : ''}` : '-- km/h'}</td>
      </tr>
    `).join('');

    weatherForecast.innerHTML = `
      <div class="forecast-day forecast-day-table">
        <div class="forecast-legend">Ressenti entre ()</div>
        <table class="forecast-table">
          <colgroup>
            <col class="col-day" />
            <col class="col-icon" />
            <col class="col-temp" />
            <col class="col-temp" />
            <col class="col-temp" />
            <col class="col-max" />
            <col class="col-min" />
            <col class="col-wind" />
          </colgroup>
          <thead>
            <tr>
              <th>Jour</th>
              <th></th>
              <th>Jour</th>
              <th>Soir</th>
              <th>Nuit</th>
              <th>Max</th>
              <th>Min</th>
              <th>Vent</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;

  }

  async function resolveLocationForSave() {
    const name = locationName?.value.trim() || 'Québec';
    let lat = parseFloat(latitudeInput?.value || '');
    let lon = parseFloat(longitudeInput?.value || '');
    const prevLocation = config.location || {};
    const prevName = prevLocation.name || '';
    const prevLat = Number(prevLocation.latitude);
    const prevLon = Number(prevLocation.longitude);
    const nameChanged = name && name !== prevName;
    const hasValidLat = Number.isFinite(lat);
    const hasValidLon = Number.isFinite(lon);
    const coordsUnchanged =
      hasValidLat &&
      hasValidLon &&
      Number.isFinite(prevLat) &&
      Number.isFinite(prevLon) &&
      Math.abs(lat - prevLat) < 0.0001 &&
      Math.abs(lon - prevLon) < 0.0001;

    if (nameChanged && (!hasValidLat || !hasValidLon || coordsUnchanged)) {
      try {
        const results = await fetchWeatherSuggestions(name);
        if (results.length) {
          const best = results[0];
          lat = best.latitude;
          lon = best.longitude;
          if (locationName) locationName.value = best.label;
          if (latitudeInput) latitudeInput.value = best.latitude;
          if (longitudeInput) longitudeInput.value = best.longitude;
        }
      } catch (error) {
        // Keep user-provided values if geocoding fails.
      }
    }

    return {
      name,
      latitude: Number.isFinite(lat) ? lat : 46.8139,
      longitude: Number.isFinite(lon) ? lon : -71.2080,
    };
  }

  async function saveConfig() {
    const location = await resolveLocationForSave();
    const payload = {
      enabled: enabledToggle?.checked || false,
      duration: parseFloat(durationInput?.value) || 15,
      location,
      display: {
        show_current: showCurrent?.checked !== false,
        show_feels_like: showFeelsLike?.checked !== false,
        show_humidity: showHumidity?.checked !== false,
        show_wind: showWind?.checked !== false,
        show_forecast: showForecast?.checked !== false,
        forecast_days: parseInt(forecastDays?.value) || 5,
        icon_size: parseInt(iconSizeInput?.value) || 210,
        temp_size: parseInt(tempSizeInput?.value) || 150,
        condition_size: parseInt(conditionSizeInput?.value) || 58,
        detail_label_size: parseInt(detailLabelSizeInput?.value) || 30,
        detail_value_size: parseInt(detailValueSizeInput?.value) || 44,
        forecast_weekday_size: parseInt(forecastTextSizeInput?.value) || 34,
        forecast_icon_size: parseInt(forecastIconSizeInput?.value) || 70,
        forecast_temp_size: parseInt(forecastTextSizeInput?.value) || 34,
        forecast_min_width: parseInt(forecastMinWidthInput?.value) || 200,
        card_opacity: Math.min(100, Math.max(20, Number.parseFloat(cardOpacityInput?.value) || 100)) / 100,
      },
      use_seasonal_backgrounds: useSeasonalBg?.checked || false,
    };

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
      await refreshWeather();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showStatus('Erreur de sauvegarde', true);
    }
  }

  async function refreshWeather() {
    try {
      const response = await fetch(buildApiUrl('api/weather-slide/data?force=true'));
      const data = await response.json();
      weatherData = data.weather || null;
      updateWeatherPreview();
      await loadBackgrounds();
      showStatus('Météo actualisée');
      postSlidePreviewRefresh();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      showStatus('Erreur de rafraîchissement', true);
    }
  }

  // Background upload handlers
  function setupBackgroundUploads() {
    const conditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'stormy', 'foggy', 'windy', 'default', 'spring', 'summer', 'autumn', 'winter'];
    
    conditions.forEach(condition => {
      const input = document.getElementById(`bg-${condition}-input`);
      if (!input) return;

      input.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await fetch(buildApiUrl(`api/weather-slide/background/${condition}`), {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error('Erreur serveur');

          const data = await response.json();
          updateBackgroundPreview(condition, data.url);
          showStatus(`Arrière-plan "${condition}" enregistré`);
        } catch (error) {
          console.error('Erreur lors de l\'upload:', error);
          showStatus('Erreur d\'upload', true);
        }
      });
    });
  }

  function updateBackgroundPreview(condition, url) {
    const preview = document.getElementById(`bg-${condition}-preview`);
    if (!preview) return;

    if (url) {
      preview.style.backgroundImage = `url(${url})`;
      preview.style.backgroundSize = 'cover';
      preview.style.backgroundPosition = 'center';
      preview.classList.add('has-background');
    }
  }

  async function loadBackgrounds() {
    try {
      const response = await fetch(buildApiUrl('api/weather-slide/backgrounds'));
      const data = await response.json();

      // Update condition backgrounds
      const backgrounds = data.backgrounds || {};
      Object.entries(backgrounds).forEach(([condition, filename]) => {
        if (filename) {
          updateBackgroundPreview(condition, buildApiUrl(`weather-slide/asset/${filename}`));
        }
      });

      // Update seasonal backgrounds
      const seasonal = data.seasonal_backgrounds || {};
      Object.entries(seasonal).forEach(([season, filename]) => {
        if (filename) {
          updateBackgroundPreview(season, buildApiUrl(`weather-slide/asset/${filename}`));
        }
      });
    } catch (error) {
      console.error('Erreur lors du chargement des arrière-plans:', error);
    }
  }


  const clearWeatherSuggestions = () => {
    if (!weatherCitySuggestions) return;
    weatherCitySuggestions.innerHTML = '';
    weatherCitySuggestions.classList.remove('is-visible');
  };

  const renderWeatherSuggestions = (results) => {
    if (!weatherCitySuggestions) return;
    weatherCitySuggestions.innerHTML = '';
    if (!Array.isArray(results) || !results.length) {
      weatherCitySuggestions.classList.remove('is-visible');
      return;
    }
    results.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'widget-weather-suggestion';
      button.textContent = item.label;
      button.dataset.lat = String(item.latitude);
      button.dataset.lon = String(item.longitude);
      button.dataset.name = item.name;
      button.addEventListener('click', async () => {
        if (locationName) locationName.value = item.label;
        if (latitudeInput) latitudeInput.value = item.latitude;
        if (longitudeInput) longitudeInput.value = item.longitude;
        clearWeatherSuggestions();
        await saveConfig();
      });
      weatherCitySuggestions.appendChild(button);
    });
    weatherCitySuggestions.classList.add('is-visible');
  };

  const fetchWeatherSuggestions = async (query) => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query
    )}&count=6&language=fr&format=json`;
    const data = await fetch(url);
    const payload = await data.json();
    const results = Array.isArray(payload?.results) ? payload.results : [];
    return results.map((item) => {
      const name = item.name || '';
      const country = item.country || '';
      const admin = item.admin1 || '';
      const postcodes = Array.isArray(item.postcodes) ? item.postcodes : [];
      const postcode = item.postcode || postcodes[0] || '';
      const parts = [name, admin, country].filter(Boolean);
      if (postcode) {
        parts.push(postcode);
      }
      return {
        label: parts.join(', '),
        name,
        latitude: item.latitude,
        longitude: item.longitude,
      };
    });
  };

  const scheduleCitySearch = () => {
    if (citySearchTimer) clearTimeout(citySearchTimer);
    const query = locationName?.value.trim() || '';
    const hasDigit = /\d/.test(query);
    if ((!hasDigit && query.length < 2) || (hasDigit && query.length < 1)) {
      clearWeatherSuggestions();
      return;
    }
    citySearchTimer = setTimeout(async () => {
      try {
        const results = await fetchWeatherSuggestions(query);
        renderWeatherSuggestions(results);
      } catch (error) {
        clearWeatherSuggestions();
      }
    }, 300);
  };

  // Event listeners
  saveBtn?.addEventListener('click', saveConfig);
  refreshWeatherBtn?.addEventListener('click', refreshWeather);
  forecastDays?.addEventListener('change', updateWeatherPreview);
  showCurrent?.addEventListener('change', updateWeatherPreview);
  showFeelsLike?.addEventListener('change', updateWeatherPreview);
  showHumidity?.addEventListener('change', updateWeatherPreview);
  showWind?.addEventListener('change', updateWeatherPreview);
  showForecast?.addEventListener('change', updateWeatherPreview);
  iconSizeInput?.addEventListener('input', updateWeatherPreview);
  tempSizeInput?.addEventListener('input', updateWeatherPreview);
  conditionSizeInput?.addEventListener('input', updateWeatherPreview);
  detailLabelSizeInput?.addEventListener('input', updateWeatherPreview);
  detailValueSizeInput?.addEventListener('input', updateWeatherPreview);
  forecastIconSizeInput?.addEventListener('input', updateWeatherPreview);
  forecastTextSizeInput?.addEventListener('input', updateWeatherPreview);
  forecastMinWidthInput?.addEventListener('input', updateWeatherPreview);
  cardOpacityInput?.addEventListener('input', updateWeatherPreview);
  locationName?.addEventListener('input', scheduleCitySearch);
  locationName?.addEventListener('focus', scheduleCitySearch);
  document.addEventListener('click', (event) => {
    if (!weatherCitySuggestions) return;
    if (event.target === weatherCitySuggestions || weatherCitySuggestions.contains(event.target)) {
      return;
    }
    if (event.target === locationName) return;
    clearWeatherSuggestions();
  });

  // Initialize
  fetchConfig().then(() => {
    setupBackgroundUploads();
    loadBackgrounds();
  });
})();
