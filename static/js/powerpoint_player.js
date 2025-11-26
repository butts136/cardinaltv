const player = document.querySelector("#ppt-player");

if (player) {
  const detailsUrl = player.dataset.detailsUrl || "";
  const returnUrl = player.dataset.returnUrl || "/cardinaltv/";

  const stage = document.querySelector("#ppt-stage");
  const wrapper = document.querySelector("#ppt-slide-wrapper");
  const imageEl = document.querySelector("#ppt-slide-image");
  const emptyState = document.querySelector("#ppt-empty-state");
  const statusEl = document.querySelector("#ppt-status");
  const backBtn = player.querySelector('[data-action="back"]');
  const prevBtn = player.querySelector('[data-action="prev"]');
  const nextBtn = player.querySelector('[data-action="next"]');

  let slides = [];
  let currentIndex = 0;
  let renderToken = 0;

  const hasSlides = () => Array.isArray(slides) && slides.length > 0;
  const slideCount = () => (hasSlides() ? slides.length : 0);

  const updateStatus = () => {
    if (!statusEl) return;
    (() => {
      const player = document.querySelector("#ppt-player");
      if (!player) return;

      const detailsUrl = player.dataset.detailsUrl || "";
      const returnUrl = player.dataset.returnUrl || "/cardinaltv/";

      const imageEl = document.querySelector("#ppt-slide-image");
      const emptyState = document.querySelector("#ppt-empty-state");
      const statusEl = document.querySelector("#ppt-status");
      const backBtn = player.querySelector('[data-action="back"]');
      const prevBtn = player.querySelector('[data-action="prev"]');
      const nextBtn = player.querySelector('[data-action="next"]');

      let slides = [];
      let currentIndex = 0;
      let renderToken = 0;

      const hasSlides = () => Array.isArray(slides) && slides.length > 0;
      const slideCount = () => (hasSlides() ? slides.length : 0);

      const updateStatus = () => {
        if (!statusEl) return;
        if (!hasSlides()) {
          statusEl.textContent = "";
          return;
        }
        statusEl.textContent = `${currentIndex + 1} / ${slideCount()}`;
      };

      const updateControls = () => {
        if (prevBtn) prevBtn.disabled = !hasSlides() || currentIndex <= 0;
        if (nextBtn) nextBtn.disabled = !hasSlides() || currentIndex >= slideCount() - 1;
      };

      const showMessage = (message, isError = false) => {
        if (emptyState) {
          emptyState.textContent = message;
          emptyState.classList.toggle("error", Boolean(isError));
          emptyState.hidden = false;
        }
        if (imageEl) {
          imageEl.hidden = true;
        }
      };

      const hideMessage = () => {
        if (emptyState) emptyState.hidden = true;
      };

      const clampIndex = (value) => {
        if (!hasSlides()) return 0;
        return Math.max(0, Math.min(value, slideCount() - 1));
      };

      const renderSlide = (targetIndex) => {
        if (!hasSlides() || !imageEl) return;

        const clamped = clampIndex(targetIndex);
        renderToken += 1;
        const token = renderToken;

        showMessage("Chargement de la diapositive...");
        const buffer = new Image();
        buffer.decoding = "async";

        buffer.onload = () => {
          if (token !== renderToken) return;
          imageEl.src = buffer.src;
          imageEl.alt = `Diapositive ${clamped + 1}`;
          imageEl.hidden = false;
          hideMessage();
          currentIndex = clamped;
          updateStatus();
          updateControls();
        };

        buffer.onerror = () => {
          if (token !== renderToken) return;
          showMessage("Impossible de charger la diapositive.", true);
          updateControls();
        };

        buffer.src = slides[clamped];
      };

      const goPrev = () => {
        if (!hasSlides() || currentIndex <= 0) return;
        renderSlide(currentIndex - 1);
      };

      const goNext = () => {
        if (!hasSlides() || currentIndex >= slideCount() - 1) return;
        renderSlide(currentIndex + 1);
      };

      const goFirst = () => {
        if (!hasSlides()) return;
        renderSlide(0);
      };

      const goLast = () => {
        if (!hasSlides()) return;
        renderSlide(slideCount() - 1);
      };

      const hydrate = async () => {
        if (!detailsUrl) {
          showMessage("URL des détails introuvable.", true);
          updateControls();
          return;
        }

        showMessage("Chargement de la présentation...");
        updateControls();

        try {
          const response = await fetch(detailsUrl, { headers: { Accept: "application/json" } });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const data = await response.json();
          const fetchedSlides = Array.isArray(data.slide_urls) ? data.slide_urls.filter(Boolean) : [];
          slides = fetchedSlides;
          currentIndex = 0;
          renderToken = 0;
          updateStatus();
          updateControls();

          if (!hasSlides()) {
            const fallbackPdf = typeof data.pdf_url === "string" && data.pdf_url;
            const message = fallbackPdf
              ? "Cette présentation doit être re-téléversée pour la nouvelle visionneuse."
              : "Aucune diapositive disponible pour cette présentation.";
            showMessage(message, true);
            return;
          }

          renderSlide(0);
        } catch (error) {
          console.error("Failed to load presentation details:", error);
          showMessage("Impossible de charger la présentation.", true);
          updateControls();
        }
      };

      backBtn?.addEventListener("click", () => {
        window.location.href = returnUrl;
      });

      prevBtn?.addEventListener("click", () => {
        goPrev();
      });

      nextBtn?.addEventListener("click", () => {
        goNext();
      });

      document.addEventListener("keydown", (event) => {
        const active = document.activeElement;
        if (active && (active !== document.body) && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(active.tagName)) {
          return;
        }

        const key = event.key;

        if (key === "ArrowLeft" || key === "ArrowUp" || key === "PageUp") {
          event.preventDefault();
          goPrev();
          return;
        }

        if (key === "ArrowRight" || key === "ArrowDown" || key === "PageDown" || key === " ") {
          event.preventDefault();
          goNext();
          return;
        }

        if (key === "Home") {
          event.preventDefault();
          goFirst();
          return;
        }

        if (key === "End") {
          event.preventDefault();
          goLast();
          return;
        }

        if (key === "Escape" || key === "Esc") {
          event.preventDefault();
          window.location.href = returnUrl;
        }
      });

      hydrate();
    })();
    if (emptyState) {
      emptyState.hidden = true;
    }
    if (imageEl) {
      imageEl.hidden = false;
    }
  };

  const exitPresentation = () => {
    if (document.fullscreenElement) {
      try {
        document.exitFullscreen();
      } catch (error) {
        console.warn("Unable to exit fullscreen", error);
      }
    }
    window.location.href = returnUrl;
  };

  const requestFullscreen = async () => {
    if (!player || document.fullscreenElement) {
      return;
    }
    try {
      if (player.requestFullscreen) {
        await player.requestFullscreen();
        isFullscreen = true;
      }
    } catch (error) {
      console.warn("Fullscreen request failed:", error);
    }
  };

  document.addEventListener("fullscreenchange", () => {
    isFullscreen = Boolean(document.fullscreenElement);
    if (!isFullscreen && hasSlides()) {
      setTimeout(() => {
        requestFullscreen().catch(() => {});
      }, 150);
    }
  });

  const clampIndex = (index) => {
    if (!hasSlides()) return 0;
    return Math.max(0, Math.min(index, slideCount() - 1));
  };

  const loadSlideAsset = (index) => {
    if (!hasSlides() || index < 0 || index >= slideCount()) {
      return Promise.resolve(null);
    }

    const cached = slideCache.get(index);
    if (cached) {
      if (cached.image && cached.image.complete) {
        return Promise.resolve(cached);
      }
      if (cached.ready) {
        return cached.ready;
      }
    }

    const url = slides[index];
    const image = new Image();
    image.decoding = "async";

    const ready = new Promise((resolve) => {
      image.onload = () => {
        const entry = { image, url };
        slideCache.set(index, entry);
        resolve(entry);
      };
      image.onerror = () => {
        slideCache.delete(index);
        resolve(null);
      };
    });

    slideCache.set(index, { image, url, ready });
    image.src = url;

    return ready;
  };

  const preloadNeighbors = (index) => {
    if (!hasSlides()) return;
    const candidates = [index + 1, index + 2, index - 1];
    for (const candidate of candidates) {
      if (candidate >= 0 && candidate < slideCount()) {
        loadSlideAsset(candidate);
      }
    }
  };

  const displaySlide = (index, asset) => {
    if (!asset || !imageEl) {
      return;
    }
    imageEl.src = asset.image.src;
    imageEl.alt = `Diapositive ${index + 1}`;
    hideMessage();
    currentIndex = index;
    updateStatus();
    preloadNeighbors(index);
  };

  const showSlide = async (index) => {
    if (!hasSlides()) {
      return;
    }
    const target = clampIndex(index);
    renderToken += 1;
    const token = renderToken;

    const cached = slideCache.get(target);
    if (cached && cached.image && cached.image.complete) {
      displaySlide(target, cached);
    } else {
  showMessage("Chargement de la diapositive...");
      const asset = await loadSlideAsset(target);
      if (!asset) {
        showMessage("Impossible de charger la diapositive.", true);
        return;
      }
      if (token !== renderToken) {
        return;
      }
      displaySlide(target, asset);
    }

    if (!isFullscreen) {
      setTimeout(() => {
        requestFullscreen().catch(() => {});
      }, 120);
    }
  };

  const goNext = () => {
    if (!hasSlides() || currentIndex >= slideCount() - 1) {
      return;
    }
    showSlide(currentIndex + 1);
  };

  const goPrev = () => {
    if (!hasSlides() || currentIndex <= 0) {
      return;
    }
    showSlide(currentIndex - 1);
  };

  const goFirst = () => {
    if (!hasSlides()) return;
    showSlide(0);
  };

  const goLast = () => {
    if (!hasSlides()) return;
    showSlide(slideCount() - 1);
  };

  const hydrate = async () => {
    if (!detailsUrl) {
      showMessage("URL des détails introuvable.", true);
      return;
    }

    try {
      const response = await fetch(detailsUrl, { headers: { Accept: "application/json" } });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const rawSlides = Array.isArray(data.slide_urls) ? data.slide_urls.filter(Boolean) : [];
      slides = rawSlides;
      slideCache.clear();

      if (!hasSlides()) {
        const fallbackPdf = typeof data.pdf_url === "string" && data.pdf_url;
        const message = fallbackPdf
          ? "Cette présentation doit être re-téléversée pour la nouvelle visionneuse."
          : "Aucune diapositive disponible pour cette présentation.";
        showMessage(message, true);
        updateStatus();
        return;
      }

      updateStatus();
      await showSlide(0);
    } catch (error) {
      console.error("Failed to load presentation details:", error);
      showMessage("Impossible de charger la présentation.", true);
    }
  };

  backBtn?.addEventListener("click", () => {
    exitPresentation();
  });

  prevBtn?.addEventListener("click", () => {
    goPrev();
  });

  nextBtn?.addEventListener("click", () => {
    goNext();
  });

  navLeft?.addEventListener("click", () => {
    goPrev();
  });

  navRight?.addEventListener("click", () => {
    goNext();
  });

  let wheelThrottle = null;
  wrapper?.addEventListener("wheel", (event) => {
    if (!hasSlides()) return;
    event.preventDefault();

    if (wheelThrottle) return;

    wheelThrottle = setTimeout(() => {
      wheelThrottle = null;
    }, 150);

    if (event.deltaY < 0) {
      goPrev();
    } else if (event.deltaY > 0) {
      goNext();
    }
  }, { passive: false });

  window.addEventListener("scroll", (event) => {
    event.preventDefault();
    window.scrollTo(0, 0);
  }, { passive: false });

  document.addEventListener("keydown", (event) => {
    if (document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      return;
    }

    const key = event.key;
    const keyCode = event.keyCode;

    const nextKeys = ["ArrowRight", "ArrowDown", "PageDown", " ", "MediaTrackNext", "FastForward", "Right", "Down"];
    if (nextKeys.includes(key)) {
      if (event.repeat) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      goNext();
      return;
    }

    const prevKeys = ["ArrowLeft", "ArrowUp", "PageUp", "MediaTrackPrevious", "Rewind", "Left", "Up"];
    if (prevKeys.includes(key)) {
      if (event.repeat) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      goPrev();
      return;
    }

    if (key === "Escape" || key === "Esc") {
      event.preventDefault();
      exitPresentation();
      return;
    }

    if (key === "Home") {
      event.preventDefault();
      goFirst();
      return;
    }

    if (key === "End") {
      event.preventDefault();
      goLast();
      return;
    }

    switch (keyCode) {
      case 39:
      case 40:
      case 34:
      case 32:
      case 417:
      case 228:
      case 87:
      case 90:
        if (event.repeat) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        goNext();
        break;
      case 37:
      case 38:
      case 33:
      case 412:
      case 227:
      case 88:
      case 89:
        if (event.repeat) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        goPrev();
        break;
      case 27:
      case 4:
        event.preventDefault();
        exitPresentation();
        break;
      case 179:
      case 415:
      case 19:
      case 85:
      case 463:
      case 464:
        event.preventDefault();
        break;
      default:
        break;
    }
  });

  document.addEventListener("keyup", (event) => {
    const keyCode = event.keyCode;
    switch (keyCode) {
      case 87:
        event.preventDefault();
        goNext();
        break;
      case 88:
      case 89:
        event.preventDefault();
        goPrev();
        break;
      case 90:
        event.preventDefault();
        goNext();
        break;
      default:
        break;
    }
  });

  hydrate();
}
