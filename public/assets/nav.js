(() => {
  const body = document.body;
  const openButton = document.getElementById("menuToggle");
  const closeButton = document.getElementById("menuClose");
  const overlay = document.getElementById("sidebarOverlay");
  const sidebar = document.getElementById("sidebar");

  if (!openButton || !closeButton || !overlay || !sidebar) return;

  const setOpen = (open) => {
    body.classList.toggle("nav-open", open);
    openButton.setAttribute("aria-expanded", open ? "true" : "false");
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) closeButton.focus();
    else openButton.focus();
  };

  openButton.addEventListener("click", () => setOpen(true));
  closeButton.addEventListener("click", () => setOpen(false));
  overlay.addEventListener("click", () => setOpen(false));
  sidebar.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && body.classList.contains("nav-open")) setOpen(false);
  });
})();
