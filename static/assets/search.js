(() => {
  const input = document.getElementById("searchBox");
  const results = document.getElementById("searchResults");
  if (!(input instanceof HTMLInputElement) || !(results instanceof HTMLElement)) return;

  let indexPromise;

  const loadIndex = () => {
    if (indexPromise === undefined) {
      indexPromise = fetch("/search.json", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : [])
        .catch(() => []);
    }
    return indexPromise;
  };

  const clearResults = () => {
    results.replaceChildren();
    results.hidden = true;
  };

  const renderResults = (items, query) => {
    results.replaceChildren();
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "search-empty";
      empty.textContent = `No results for “${query}”`;
      results.append(empty);
      results.hidden = false;
      return;
    }

    for (const item of items.slice(0, 10)) {
      const link = document.createElement("a");
      link.href = item.url;
      const title = document.createElement("strong");
      title.textContent = item.title;
      const section = document.createElement("small");
      section.textContent = item.url.replace(/^\/docs\/?/u, "").replace(/\/$/u, "") || "Documentation";
      link.append(title, section);
      results.append(link);
    }
    results.hidden = false;
  };

  const search = async () => {
    const query = input.value.trim().toLocaleLowerCase();
    if (query.length < 2) {
      clearResults();
      return;
    }

    const documents = await loadIndex();
    const ranked = [];
    for (const document of documents) {
      const title = document.title.toLocaleLowerCase();
      const text = document.text.toLocaleLowerCase();
      if (!title.includes(query) && !text.includes(query)) continue;
      ranked.push({ document, rank: title === query ? 0 : title.startsWith(query) ? 1 : title.includes(query) ? 2 : 3 });
    }
    ranked.sort((left, right) => left.rank - right.rank || left.document.title.localeCompare(right.document.title));
    renderResults(ranked.map((entry) => entry.document), input.value.trim());
  };

  input.addEventListener("input", search);
  input.addEventListener("focus", () => {
    if (input.value.trim().length >= 2) search();
  });
  document.addEventListener("click", (event) => {
    if (event.target === input || results.contains(event.target)) return;
    clearResults();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== input) {
      event.preventDefault();
      input.focus();
    } else if (event.key === "Escape") {
      clearResults();
      input.blur();
    }
  });
})();
