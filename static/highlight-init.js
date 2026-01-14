(() => {
  window.addEventListener("DOMContentLoaded", () => {
    // highlight.js is loaded from CDN (see layouts/_default/baseof.html).
    const hljs = window.hljs;
    if (!hljs) return;
    hljs.highlightAll();
  });
})();

