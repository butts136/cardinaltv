(function () {
  "use strict";

  const init = () => {
    const appGlobals = window.CardinalApp || {};
    const { fetchJSON, buildApiUrl } = appGlobals;
    if (typeof fetchJSON !== "function" || typeof buildApiUrl !== "function") {
      return;
    }

    const addButton = document.getElementById("custom-slides-add");
    const grid = document.getElementById("custom-slides-grid");
    if (!addButton) {
      return;
    }

    let isCreating = false;
    addButton.addEventListener("click", async () => {
      if (isCreating) return;
      isCreating = true;
      addButton.disabled = true;
      try {
        const data = await fetchJSON("api/custom-slides", { method: "POST" });
        const newId = data?.id;
        if (!newId) {
          throw new Error("Réponse invalide: id manquant");
        }
        window.location.href = buildApiUrl(
          `diaporama/diapo-personnalisee/${encodeURIComponent(newId)}`,
        );
      } catch (error) {
        console.error("Erreur lors de la création d'une diapo personnalisée:", error);
        alert("Impossible de créer une diapo personnalisée pour le moment.");
      } finally {
        isCreating = false;
        addButton.disabled = false;
      }
    });

    if (grid) {
      grid.addEventListener("click", async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const deleteButton = target.closest(".custom-slide-delete");
        if (!deleteButton) return;

        const slideId =
          deleteButton.dataset.slideId ||
          deleteButton.closest("[data-slide-id]")?.dataset.slideId;
        if (!slideId) return;

        if (!confirm("Supprimer cette diapo personnalisée ?")) {
          return;
        }

        deleteButton.disabled = true;
        try {
          await fetchJSON(
            `api/custom-slides/${encodeURIComponent(slideId)}`,
            { method: "DELETE" },
          );
          const card = deleteButton.closest("[data-slide-id]");
          card?.remove();

          if (!grid.querySelector("[data-slide-id]")) {
            const existingEmpty = document.querySelector(
              ".custom-slides-section .empty-state",
            );
            if (!existingEmpty) {
              const empty = document.createElement("div");
              empty.className = "empty-state";
              empty.textContent = "Aucune diapo personnalisée pour le moment.";
              grid.parentElement?.insertBefore(empty, grid);
            }
          }
        } catch (error) {
          console.error("Erreur lors de la suppression de la diapo personnalisée:", error);
          alert("Impossible de supprimer cette diapo.");
          deleteButton.disabled = false;
        }
      });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

