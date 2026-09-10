(() => {
  const selector = document.querySelector("[data-doc-target-select]");
  if (!(selector instanceof HTMLSelectElement)) return;

  const panels = [...document.querySelectorAll("[data-doc-target]")];
  const targets = new Set([...selector.options].map((option) => option.value));
  const links = new Set(panels.flatMap((panel) => [...panel.querySelectorAll("a[href]")]
    .map((link) => new URL(link.href).pathname)));
  const current = new URL(location.href);
  const route = current.pathname.match(/^\/docs\/(manual|reference)\/targets\/([^/]+)\/(.*)$/u);
  let preference;
  try { preference = localStorage.getItem("tsonic-doc-target"); } catch {}
  const requested = route?.[2] ?? current.searchParams.get("target") ?? preference;

  const select = (target) => {
    selector.value = target;
    document.documentElement.dataset.docTarget = target;
    for (const panel of panels) panel.hidden = panel.dataset.docTarget !== target;
    try { localStorage.setItem("tsonic-doc-target", target); } catch {}
    document.dispatchEvent(new CustomEvent("docs-target-change", { detail: target }));
  };

  select(targets.has(requested) ? requested : selector.value);
  selector.addEventListener("change", () => {
    const target = selector.value;
    if (!targets.has(target)) return;
    select(target);
    if (route) {
      const overview = `/docs/${route[1]}/targets/${target}/`;
      const counterpart = `${overview}${route[3]}`;
      location.assign(links.has(counterpart) ? counterpart : overview);
    } else {
      const url = new URL(location.href);
      url.searchParams.set("target", target);
      history.replaceState(null, "", url);
    }
  });
})();
