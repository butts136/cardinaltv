/**
 * Cardinal TV Performance Manager
 * Gestionnaire centralisé pour optimiser les performances sur machines faibles
 */

(() => {
  // Détection des capacités matérielles
  const detectHardwareCapabilities = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const perfParam = (urlParams.get("perf") || urlParams.get("performance") || "").trim().toLowerCase();
    
    const perfForceLow = perfParam === "low" || perfParam === "lite" || urlParams.has("lite");
    const perfForceHigh = perfParam === "high" || perfParam === "full";
    
    const prefersReducedMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
    const perfConnection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
    const perfSaveData = Boolean(perfConnection?.saveData);
    const perfEffectiveType = String(perfConnection?.effectiveType || "").toLowerCase();
    const perfSlowNetwork = ["slow-2g", "2g", "3g"].includes(perfEffectiveType);
    const perfLowMemory = Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= 2;
    const perfLowCores = Number.isFinite(navigator.hardwareConcurrency) && navigator.hardwareConcurrency <= 2;
    
    const lowPowerDetected = !perfForceHigh && (
      perfForceLow || 
      prefersReducedMotion || 
      perfSaveData || 
      perfSlowNetwork || 
      perfLowMemory || 
      perfLowCores
    );
    
    return {
      lowPower: lowPowerDetected,
      cores: navigator.hardwareConcurrency || 2,
      memory: navigator.deviceMemory || 2,
      networkSpeed: perfEffectiveType || "4g",
      prefersReducedMotion,
      forcedMode: perfForceLow ? "low" : perfForceHigh ? "high" : null,
    };
  };

  const hardware = detectHardwareCapabilities();

  // Configuration adaptative
  const performanceProfile = {
    lowPower: hardware.lowPower,
    
    // FPS cible adaptatif
    maxAnimationFps: hardware.lowPower ? 30 : 60,
    minAnimationFps: hardware.lowPower ? 15 : 30,
    
    // Throttling des updates
    uiUpdateThrottle: hardware.lowPower ? 200 : 100,
    clockUpdateThrottle: hardware.lowPower ? 1000 : 500,
    
    // Optimisations vidéo
    disableVideoCrossfade: hardware.lowPower,
    videoPreload: hardware.lowPower ? "metadata" : "auto",
    maxConcurrentVideos: hardware.lowPower ? 1 : 2,
    
    // Optimisations d'effets
    reduceEffects: hardware.lowPower,
    disableBackgroundBlur: hardware.lowPower,
    simplifyTransitions: hardware.lowPower,
    
    // Cache et préchargement
    enableAggressiveCache: !hardware.lowPower,
    maxCacheSize: hardware.lowPower ? 50 : 100,
    preloadDistance: hardware.lowPower ? 1 : 2,
    
    // Optimisations de rendu
    useWillChange: !hardware.lowPower,
    enableGPUAcceleration: !hardware.lowPower,
    batchDOMUpdates: true,
    
    // Résolution adaptative
    maxImageWidth: hardware.lowPower ? 1920 : 3840,
    maxImageHeight: hardware.lowPower ? 1080 : 2160,
    
    // Debug
    hardware,
  };

  // Gestionnaire de timers centralisé pour éviter les fuites
  class TimerManager {
    constructor() {
      this.timers = new Map();
      this.intervals = new Map();
      this.frames = new Map();
    }

    setTimeout(key, callback, delay) {
      this.clearTimeout(key);
      const id = setTimeout(() => {
        this.timers.delete(key);
        callback();
      }, delay);
      this.timers.set(key, id);
      return id;
    }

    clearTimeout(key) {
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }
    }

    setInterval(key, callback, delay) {
      this.clearInterval(key);
      const id = setInterval(callback, delay);
      this.intervals.set(key, id);
      return id;
    }

    clearInterval(key) {
      if (this.intervals.has(key)) {
        clearInterval(this.intervals.get(key));
        this.intervals.delete(key);
      }
    }

    requestAnimationFrame(key, callback) {
      this.cancelAnimationFrame(key);
      const id = requestAnimationFrame(callback);
      this.frames.set(key, id);
      return id;
    }

    cancelAnimationFrame(key) {
      if (this.frames.has(key)) {
        cancelAnimationFrame(this.frames.get(key));
        this.frames.delete(key);
      }
    }

    clearAll() {
      this.timers.forEach(id => clearTimeout(id));
      this.intervals.forEach(id => clearInterval(id));
      this.frames.forEach(id => cancelAnimationFrame(id));
      this.timers.clear();
      this.intervals.clear();
      this.frames.clear();
    }

    getActiveCount() {
      return {
        timers: this.timers.size,
        intervals: this.intervals.size,
        frames: this.frames.size,
        total: this.timers.size + this.intervals.size + this.frames.size,
      };
    }
  }

  // Throttle/Debounce optimisés
  const createThrottle = (func, wait) => {
    let timeout = null;
    let lastRun = 0;

    return function throttled(...args) {
      const now = Date.now();
      const remaining = wait - (now - lastRun);

      if (remaining <= 0) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        lastRun = now;
        func.apply(this, args);
      } else if (!timeout) {
        timeout = setTimeout(() => {
          lastRun = Date.now();
          timeout = null;
          func.apply(this, args);
        }, remaining);
      }
    };
  };

  const createDebounce = (func, wait) => {
    let timeout = null;

    return function debounced(...args) {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        timeout = null;
        func.apply(this, args);
      }, wait);
    };
  };

  // Gestionnaire de batch pour DOM updates
  class DOMBatchManager {
    constructor() {
      this.pending = [];
      this.scheduled = false;
    }

    schedule(callback) {
      this.pending.push(callback);
      if (!this.scheduled) {
        this.scheduled = true;
        requestAnimationFrame(() => this.flush());
      }
    }

    flush() {
      const callbacks = this.pending.slice();
      this.pending.length = 0;
      this.scheduled = false;
      
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.warn("DOM batch callback error:", error);
        }
      });
    }
  }

  // Gestionnaire de ressources médias
  class MediaResourceManager {
    constructor() {
      this.activeVideos = new Set();
      this.objectUrls = new Set();
      this.maxConcurrentVideos = performanceProfile.maxConcurrentVideos;
    }

    registerVideo(video) {
      if (this.activeVideos.size >= this.maxConcurrentVideos) {
        const oldest = this.activeVideos.values().next().value;
        this.releaseVideo(oldest);
      }
      this.activeVideos.add(video);
    }

    releaseVideo(video) {
      if (!video) return;
      
      try {
        video.pause();
        video.src = "";
        video.load();
      } catch (error) {
        // ignore
      }
      
      this.activeVideos.delete(video);
    }

    registerObjectUrl(url) {
      this.objectUrls.add(url);
    }

    revokeObjectUrl(url) {
      if (this.objectUrls.has(url)) {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          // ignore
        }
        this.objectUrls.delete(url);
      }
    }

    cleanup() {
      this.activeVideos.forEach(video => this.releaseVideo(video));
      this.activeVideos.clear();
      
      this.objectUrls.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          // ignore
        }
      });
      this.objectUrls.clear();
    }
  }

  // FPS Monitor pour ajustements dynamiques
  class FPSMonitor {
    constructor() {
      this.frames = [];
      this.lastTime = performance.now();
      this.currentFPS = 60;
      this.enabled = !performanceProfile.lowPower;
    }

    tick() {
      if (!this.enabled) return;

      const now = performance.now();
      const delta = now - this.lastTime;
      this.lastTime = now;

      this.frames.push(delta);
      if (this.frames.length > 60) {
        this.frames.shift();
      }

      if (this.frames.length >= 10) {
        const avg = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
        this.currentFPS = Math.round(1000 / avg);
      }
    }

    getFPS() {
      return this.currentFPS;
    }

    isPerformingWell() {
      return this.currentFPS >= performanceProfile.minAnimationFps;
    }
  }

  // Instances globales
  const timerManager = new TimerManager();
  const domBatchManager = new DOMBatchManager();
  const mediaResourceManager = new MediaResourceManager();
  const fpsMonitor = new FPSMonitor();

  // Appliquer les optimisations CSS selon le profil
  const applyCSSOptimizations = () => {
    if (document.body) {
      document.body.classList.toggle("perf-low-power", performanceProfile.lowPower);
      document.body.classList.toggle("perf-high-power", !performanceProfile.lowPower);
      document.body.dataset.performance = performanceProfile.lowPower ? "low" : "high";
      document.body.dataset.cores = String(hardware.cores);
      document.body.dataset.memory = String(hardware.memory);
    }
  };

  // Appliquer au chargement
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyCSSOptimizations);
  } else {
    applyCSSOptimizations();
  }

  // Cleanup global
  window.addEventListener("beforeunload", () => {
    timerManager.clearAll();
    mediaResourceManager.cleanup();
  });

  // Export global
  window.CardinalPerformanceManager = {
    profile: performanceProfile,
    hardware,
    timers: timerManager,
    domBatch: domBatchManager,
    media: mediaResourceManager,
    fps: fpsMonitor,
    utils: {
      throttle: createThrottle,
      debounce: createDebounce,
    },
  };

  // Log des capacités détectées
  console.log("🎯 Cardinal Performance Manager initialized", {
    mode: performanceProfile.lowPower ? "LOW_POWER" : "HIGH_PERFORMANCE",
    hardware: {
      cores: hardware.cores,
      memory: `${hardware.memory}GB`,
      network: hardware.networkSpeed,
    },
    limits: {
      maxFPS: performanceProfile.maxAnimationFps,
      cacheSize: performanceProfile.maxCacheSize,
      concurrentVideos: performanceProfile.maxConcurrentVideos,
    },
  });
})();
