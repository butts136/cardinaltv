// Gestion des sections repliables dans l'éditeur
(function () {
  "use strict";

  function init() {
    const toggles = Array.from(document.querySelectorAll(".section-toggle"));
    if (!toggles.length) return;

    const showAllButton = document.querySelector("#show-all-button");
    const hideAllButton = document.querySelector("#hide-all-button");

    const toggleCard = (button) => {
      const card = button.closest(".card");
      if (!card) return;
      const expanded = card.classList.toggle("collapsed") ? false : true;
      try {
        button.setAttribute("aria-expanded", expanded ? "true" : "false");
      } catch (e) {}
      button.classList.toggle("expanded", expanded);
    };

    toggles.forEach((btn) => {
      const card = btn.closest(".card");
      if (card) {
        const expanded = !card.classList.contains("collapsed");
        try {
          btn.setAttribute("aria-expanded", expanded ? "true" : "false");
        } catch (e) {}
        btn.classList.toggle("expanded", expanded);
      }

      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        toggleCard(btn);
      });

      btn.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          toggleCard(btn);
        }
      });
    });

    if (showAllButton) {
      showAllButton.addEventListener("click", () => {
        document.querySelectorAll(".card.collapsed").forEach((c) => c.classList.remove("collapsed"));
        toggles.forEach((b) => {
          try {
            b.setAttribute("aria-expanded", "true");
          } catch (e) {}
          b.classList.add("expanded");
        });
      });
    }

    if (hideAllButton) {
      hideAllButton.addEventListener("click", () => {
        document.querySelectorAll(".card").forEach((c) => c.classList.add("collapsed"));
        toggles.forEach((b) => {
          try {
            b.setAttribute("aria-expanded", "false");
          } catch (e) {}
          b.classList.remove("expanded");
        });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
