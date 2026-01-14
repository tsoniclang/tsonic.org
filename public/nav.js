(() => {
  const toggleButton = document.getElementById("menuToggle");
  const closeButton = document.getElementById("menuClose");
  const overlay = document.getElementById("sidebarOverlay");
  const sidebar = document.getElementById("sidebar");

  if (!toggleButton || !overlay || !sidebar) return;

  const body = document.body;

  const closeMenu = () => {
    body.classList.remove("nav-open");
    toggleButton.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    body.classList.add("nav-open");
    toggleButton.setAttribute("aria-expanded", "true");
  };

  toggleButton.addEventListener("click", () => {
    if (body.classList.contains("nav-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  overlay.addEventListener("click", closeMenu);
  closeButton?.addEventListener("click", closeMenu);

  sidebar.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLAnchorElement) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const mobileQuery = window.matchMedia("(max-width: 920px)");
  const handleViewportChange = () => {
    if (!mobileQuery.matches) closeMenu();
  };

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", handleViewportChange);
  } else {
    // Safari < 14.
    mobileQuery.addListener(handleViewportChange);
  }
})();

