(() => {
  "use strict";

  // Keep image links usable without JavaScript or native modal-dialog support.
  if (typeof HTMLDialogElement === "undefined" ||
      typeof HTMLDialogElement.prototype.showModal !== "function") return;

  const images = [];
  const links = new Map();

  // Only the link around a screenshot belongs to the gallery.
  for (const figure of document.querySelectorAll("figure.project-plate, figure.case-plate")) {
    const thumbnail = figure.querySelector("img");
    const link = thumbnail?.closest("a[href]");
    if (!link || !figure.contains(link) || link.getAttribute("href").trim().startsWith("#")) continue;
    const url = new URL(link.href, document.baseURI);
    if (!/^https?:$/.test(url.protocol) && url.protocol !== "file:") continue;
    if (url.hash || !/\.(avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname)) continue;
    links.set(link, images.length);
    images.push({
      src: url.href,
      alt: thumbnail.alt,
      label: figure.querySelector("figcaption strong")?.textContent.trim() ||
        link.getAttribute("aria-label")?.replace(/^Enlarge\s+/i, "") ||
        thumbnail.alt || "Application screenshot",
    });
    link.setAttribute("aria-haspopup", "dialog");
  }
  if (!images.length) return;

  let dialog;
  let screenshot;
  let context;
  let original;
  let viewport;
  let activeIndex = 0;
  let opener;

  function showImage(index) {
    activeIndex = (index + images.length) % images.length;
    const image = images[activeIndex];
    // The anchor is the full-resolution source, never currentSrc or a thumbnail.
    screenshot.alt = image.alt || image.label;
    screenshot.src = image.src;
    original.href = image.src;
    context.textContent = `${activeIndex + 1} of ${images.length} — ${image.label}`;
    viewport.scrollTop = 0;
    viewport.scrollLeft = 0;
  }

  function createDialog() {
    dialog = document.createElement("dialog");
    dialog.className = "image-viewer";
    dialog.setAttribute("aria-labelledby", "image-viewer-title");
    dialog.setAttribute("aria-describedby", "image-viewer-context image-viewer-hint");
    dialog.innerHTML = `
      <header class="image-viewer-header">
        <div class="image-viewer-heading">
          <h2 id="image-viewer-title">Screenshot viewer</h2>
          <p id="image-viewer-context" role="status" aria-live="polite" aria-atomic="true"></p>
        </div>
        <button class="image-viewer-close" type="button" autofocus>Close</button>
      </header>
      <div class="image-viewer-viewport" tabindex="0" role="region" aria-label="Screenshot image; scroll to inspect">
        <img class="image-viewer-image" alt="">
      </div>
      <footer class="image-viewer-footer">
        <nav class="image-viewer-navigation" aria-label="Screenshot navigation">
          <button type="button" data-direction="-1" aria-label="Previous screenshot">Previous</button>
          <button type="button" data-direction="1" aria-label="Next screenshot">Next</button>
        </nav>
        <a class="image-viewer-original" target="_blank" rel="noopener">Open original / zoom (new tab)</a>
        <p id="image-viewer-hint"></p>
      </footer>`;
    document.body.append(dialog);
    screenshot = dialog.querySelector(".image-viewer-image");
    context = dialog.querySelector("#image-viewer-context");
    original = dialog.querySelector(".image-viewer-original");
    viewport = dialog.querySelector(".image-viewer-viewport");
    const navigation = dialog.querySelector(".image-viewer-navigation");
    navigation.hidden = images.length < 2;
    dialog.querySelector("#image-viewer-hint").textContent = images.length > 1
      ? "Left/Right: previous/next. Focus the image area to scroll. Escape: close."
      : "Focus the image area to scroll. Escape: close.";
    dialog.querySelector(".image-viewer-close").addEventListener("click", () => dialog.close());
    for (const button of navigation.querySelectorAll("button")) {
      button.addEventListener("click", () => showImage(activeIndex + Number(button.dataset.direction)));
    }
    dialog.addEventListener("keydown", (event) => {
      // Preserve browser zoom, modified shortcuts and arrow-key image scrolling.
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
          event.target === viewport || images.length < 2) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      showImage(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
    });
    // Native Escape cancellation closes the dialog and reaches this same handler.
    dialog.addEventListener("close", () => {
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    });
  }

  for (const [link, index] of links) {
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.altKey ||
          event.ctrlKey || event.metaKey || event.shiftKey || link.hasAttribute("download")) return;
      if (!dialog) createDialog();
      opener = link;
      showImage(index);
      dialog.showModal();
      event.preventDefault();
    });
  }
})();
