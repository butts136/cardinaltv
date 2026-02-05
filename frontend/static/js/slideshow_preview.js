(() => {
  const resolveIframe = (button) => {
    if (!button) return null;
    const targetId = button.dataset.previewIframe;
    if (targetId) {
      return document.getElementById(targetId);
    }
    const container = button.closest("[data-preview-container]") || button.closest(".card") || document;
    return container.querySelector?.("iframe");
  };

  const reloadIframe = (iframe) => {
    if (!iframe) return;
    const src = iframe.dataset.previewSrc || iframe.getAttribute("src");
    if (src) {
      iframe.setAttribute("src", src);
    }
  };

  document.querySelectorAll("[data-preview-iframe]").forEach((button) => {
    button.addEventListener("click", () => {
      reloadIframe(resolveIframe(button));
    });
  });
})();
