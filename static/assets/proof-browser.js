const browser = document.querySelector("[data-proof-browser]");

const element = (tagName, className, text) => {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const setCode = (container, file) => {
  container.replaceChildren();
  const content = file.content.endsWith("\n")
    ? file.content.slice(0, -1)
    : file.content;
  const fragment = document.createDocumentFragment();
  for (const [index, line] of content.split("\n").entries()) {
    const row = element("span", "proof-code-line");
    const number = element("span", "proof-line-number", String(index + 1));
    number.setAttribute("aria-hidden", "true");
    row.append(number, element("span", "proof-line-source", line || " "));
    fragment.append(row);
  }
  container.append(fragment);
};

const initialize = async () => {
  if (!browser) return;

  const status = browser.querySelector("[data-proof-status]");
  try {
    const response = await fetch(browser.dataset.catalogUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const catalog = await response.json();
    if (!Array.isArray(catalog.targets) || catalog.targets.length === 0) {
      throw new Error("The example catalog is empty");
    }

    const targetList = browser.querySelector("[data-proof-targets]");
    const projectList = browser.querySelector("[data-proof-projects]");
    const projectTitle = browser.querySelector("[data-proof-title]");
    const projectSummary = browser.querySelector("[data-proof-summary]");
    const capabilityList = browser.querySelector("[data-proof-capabilities]");
    const provenance = browser.querySelector("[data-proof-provenance]");
    const sourceSelect = browser.querySelector("[data-proof-source-select]");
    const outputSelect = browser.querySelector("[data-proof-output-select]");
    const sourceCode = browser.querySelector("[data-proof-source-code]");
    const outputCode = browser.querySelector("[data-proof-output-code]");
    const outputLabel = browser.querySelector("[data-proof-output-label]");
    const copyButtons = browser.querySelectorAll("[data-proof-copy]");

    const requested = new URLSearchParams(window.location.search);
    let activeTarget = catalog.targets.find(
      (target) => target.id === requested.get("target"),
    ) ?? catalog.targets[0];
    let activeProject = activeTarget.projects.find(
      (project) => project.id === requested.get("project"),
    ) ?? activeTarget.projects[0];
    let sourceFile = activeProject.sourceFiles[0];
    let outputFile = activeProject.outputFiles[0];

    const populateFileSelect = (select, files, selected) => {
      select.replaceChildren();
      for (const file of files) {
        const option = element("option", "", file.path);
        option.value = file.path;
        option.selected = file.path === selected.path;
        select.append(option);
      }
    };

    const renderFiles = () => {
      populateFileSelect(sourceSelect, activeProject.sourceFiles, sourceFile);
      populateFileSelect(outputSelect, activeProject.outputFiles, outputFile);
      setCode(sourceCode, sourceFile);
      setCode(outputCode, outputFile);
      outputLabel.textContent = activeTarget.outputLabel;
    };

    const storeSelection = () => {
      const url = new URL(window.location.href);
      url.searchParams.set("target", activeTarget.id);
      url.searchParams.set("project", activeProject.id);
      window.history.replaceState(null, "", url);
    };

    const renderProject = () => {
      projectTitle.textContent = activeProject.title;
      projectSummary.textContent = activeProject.summary;
      capabilityList.replaceChildren(
        ...activeProject.capabilities.map((capability) =>
          element("li", "proof-capability", capability)),
      );
      const shortRevision = activeProject.provenance.revision.slice(0, 8);
      provenance.textContent =
        `${activeProject.provenance.repository} · ${shortRevision}`;
      sourceFile = activeProject.sourceFiles[0];
      outputFile = activeProject.outputFiles[0];
      renderFiles();
    };

    const renderProjects = () => {
      projectList.replaceChildren();
      for (const project of activeTarget.projects) {
        const button = element("button", "proof-project-option");
        button.type = "button";
        button.dataset.projectId = project.id;
        button.setAttribute("aria-pressed", String(project.id === activeProject.id));
        button.append(
          element("strong", "", project.title),
          element("span", "", project.summary),
        );
        button.addEventListener("click", () => {
          activeProject = project;
          storeSelection();
          renderProjects();
          renderProject();
        });
        projectList.append(button);
      }
    };

    const renderTargets = () => {
      targetList.replaceChildren();
      for (const target of catalog.targets) {
        const button = element("button", "proof-target-tab", target.label);
        button.type = "button";
        button.setAttribute("aria-pressed", String(target.id === activeTarget.id));
        button.dataset.target = target.id;
        button.addEventListener("click", () => {
          activeTarget = target;
          activeProject = target.projects[0];
          browser.dataset.activeTarget = target.accent;
          storeSelection();
          renderTargets();
          renderProjects();
          renderProject();
        });
        targetList.append(button);
      }
    };

    sourceSelect.addEventListener("change", () => {
      sourceFile = activeProject.sourceFiles.find(
        (file) => file.path === sourceSelect.value) ?? activeProject.sourceFiles[0];
      setCode(sourceCode, sourceFile);
    });
    outputSelect.addEventListener("change", () => {
      outputFile = activeProject.outputFiles.find(
        (file) => file.path === outputSelect.value) ?? activeProject.outputFiles[0];
      setCode(outputCode, outputFile);
    });

    for (const button of copyButtons) {
      button.addEventListener("click", async () => {
        const file = button.dataset.proofCopy === "source" ? sourceFile : outputFile;
        try {
          await navigator.clipboard.writeText(file.content);
          button.textContent = "Copied";
          window.setTimeout(() => { button.textContent = "Copy"; }, 1400);
        } catch {
          button.textContent = "Copy failed";
        }
      });
    }

    browser.dataset.activeTarget = activeTarget.accent;
    renderTargets();
    renderProjects();
    renderProject();
    status.hidden = true;
    browser.classList.add("proof-browser-ready");
  } catch (error) {
    status.textContent = "Examples could not be loaded. Open the manuals for source examples.";
    status.classList.add("proof-status-error");
    console.error("Failed to initialize proof browser", error);
  }
};

void initialize();
