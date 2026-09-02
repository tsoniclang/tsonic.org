const browser = document.querySelector("[data-proof-browser]");

const element = (tagName, className, text) => {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const languageKeywords = {
  typescript: new Set(`
    abstract as asserts async await break case catch class const constructor
    continue debugger declare default delete do else enum export extends false
    finally for from function get if implements import in infer instanceof
    interface keyof let module namespace never new null of override private
    protected public readonly return satisfies set static string super switch
    symbol this throw true try type typeof undefined unique unknown var void
    while with yield
  `.trim().split(/\s+/u)),
  csharp: new Set(`
    abstract as async await base bool break byte case catch char checked class
    const continue decimal default delegate do double else enum event explicit
    extern false finally fixed float for foreach from get global goto if
    implicit in int interface internal is lock long namespace new not null
    object operator out override params partial private protected public readonly
    record ref return sbyte sealed set short sizeof stackalloc static string
    struct switch this throw true try typeof uint ulong unchecked unsafe ushort
    using var virtual void volatile when where while yield
  `.trim().split(/\s+/u)),
  rust: new Set(`
    as async await break const continue crate dyn else enum extern false fn for
    if impl in let loop match mod move mut pub ref return self Self static struct
    super trait true type unsafe use where while yield
  `.trim().split(/\s+/u)),
};

const isIdentifierStart = (character) => /[A-Za-z_$]/u.test(character);
const isIdentifierPart = (character) => /[A-Za-z0-9_$]/u.test(character);
const isNumberPart = (character) => /[A-Za-z0-9_.]/u.test(character);

const tokenizeCode = (source, language) => {
  const tokens = [];
  const add = (kind, start, end) => tokens.push({ kind, value: source.slice(start, end) });
  let index = 0;

  while (index < source.length) {
    const start = index;
    const character = source[index];
    const next = source[index + 1];

    if (/\s/u.test(character)) {
      while (index < source.length && /\s/u.test(source[index])) index += 1;
      add("plain", start, index);
      continue;
    }

    if (character === "/" && next === "/") {
      index += 2;
      while (index < source.length && source[index] !== "\n") index += 1;
      add("comment", start, index);
      continue;
    }

    if (character === "/" && next === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        index += 1;
      }
      index = Math.min(source.length, index + 2);
      add("comment", start, index);
      continue;
    }

    if (language === "csharp" && character === "#" &&
        (start === 0 || source[start - 1] === "\n")) {
      index += 1;
      while (index < source.length && source[index] !== "\n") index += 1;
      add("directive", start, index);
      continue;
    }

    if (language === "csharp" && character === "@" && next === "\"") {
      index += 2;
      while (index < source.length) {
        if (source[index] === "\"" && source[index + 1] === "\"") {
          index += 2;
          continue;
        }
        if (source[index] === "\"") {
          index += 1;
          break;
        }
        index += 1;
      }
      add("string", start, index);
      continue;
    }

    const rustRawPrefix = language === "rust"
      ? source.slice(index).match(/^(?:br|r)(#*)"/u)
      : undefined;
    if (rustRawPrefix) {
      const hashes = rustRawPrefix[1];
      index += rustRawPrefix[0].length;
      const terminator = `\"${hashes}`;
      const end = source.indexOf(terminator, index);
      index = end === -1 ? source.length : end + terminator.length;
      add("string", start, index);
      continue;
    }

    if (language === "rust" && character === "'" && isIdentifierStart(next ?? "")) {
      index += 2;
      while (index < source.length && isIdentifierPart(source[index])) index += 1;
      if (source[index] !== "'") {
        add("lifetime", start, index);
        continue;
      }
      index = start;
    }

    if (character === "\"" || character === "'" || character === "`") {
      const quote = character;
      index += 1;
      while (index < source.length) {
        if (source[index] === "\\") {
          index = Math.min(source.length, index + 2);
          continue;
        }
        if (source[index] === quote) {
          index += 1;
          break;
        }
        index += 1;
      }
      add("string", start, index);
      continue;
    }

    if (/[0-9]/u.test(character)) {
      index += 1;
      while (index < source.length && isNumberPart(source[index])) index += 1;
      add("number", start, index);
      continue;
    }

    if (isIdentifierStart(character)) {
      index += 1;
      while (index < source.length && isIdentifierPart(source[index])) index += 1;
      const value = source.slice(start, index);
      const keywords = languageKeywords[language] ?? languageKeywords.typescript;
      const kind = keywords.has(value)
        ? "keyword"
        : /^[A-Z]/u.test(value)
          ? "type"
          : "plain";
      tokens.push({ kind, value });
      continue;
    }

    if (/[+\-*/%=!<>&|^~?:]/u.test(character)) {
      index += 1;
      while (index < source.length && /[+\-*/%=!<>&|^~?:]/u.test(source[index])) index += 1;
      add("operator", start, index);
      continue;
    }

    index += 1;
    add("plain", start, index);
  }

  return tokens;
};

const setCode = (container, file) => {
  container.replaceChildren();
  container.dataset.language = file.language;
  const content = file.content.endsWith("\n")
    ? file.content.slice(0, -1)
    : file.content;
  const fragment = document.createDocumentFragment();
  let lineIndex = 0;
  let lineSource;

  const startLine = () => {
    const row = element("span", "proof-code-line");
    const number = element("span", "proof-line-number", String(lineIndex + 1));
    number.setAttribute("aria-hidden", "true");
    lineSource = element("span", "proof-line-source");
    row.append(number, lineSource);
    fragment.append(row);
    lineIndex += 1;
  };

  startLine();
  for (const token of tokenizeCode(content, file.language)) {
    const parts = token.value.split("\n");
    for (const [partIndex, part] of parts.entries()) {
      if (part) {
        if (token.kind === "plain") lineSource.append(document.createTextNode(part));
        else lineSource.append(element("span", `proof-token-${token.kind}`, part));
      }
      if (partIndex < parts.length - 1) {
        if (!lineSource.hasChildNodes()) lineSource.append(" ");
        startLine();
      }
    }
  }
  if (!lineSource.hasChildNodes()) lineSource.append(" ");
  container.append(fragment);
};

const loadCatalog = async (url, updateProgress) => {
  updateProgress(4, "Connecting to the example catalog");
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const totalBytes = Number(response.headers.get("content-length"));
  if (!response.body) {
    updateProgress(82, "Reading source and generated files");
    return response.json();
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let chunkCount = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    receivedBytes += value.byteLength;
    chunkCount += 1;
    text += decoder.decode(value, { stream: true });
    const transferProgress = Number.isFinite(totalBytes) && totalBytes > 0
      ? Math.min(receivedBytes / totalBytes, 1)
      : 1 - (1 / (chunkCount + 1));
    updateProgress(
      10 + Math.round(transferProgress * 78),
      "Downloading source and generated files",
    );
  }

  text += decoder.decode();
  updateProgress(92, "Preparing examples");
  return JSON.parse(text);
};

const initialize = async () => {
  if (!browser) return;

  const status = browser.querySelector("[data-proof-status]");
  const progress = browser.querySelector("[data-proof-progress]");
  const progressBar = browser.querySelector("[data-proof-progress-bar]");
  const progressDetail = browser.querySelector("[data-proof-progress-detail]");
  const progressTrack = browser.querySelector("[data-proof-progress-track]");
  const updateProgress = (value, detail) => {
    const percentage = Math.max(0, Math.min(100, Math.round(value)));
    progress.textContent = `${percentage}%`;
    progressBar.style.width = `${percentage}%`;
    progressDetail.textContent = detail;
    progressTrack.setAttribute("aria-valuenow", String(percentage));
  };

  try {
    const catalog = await loadCatalog(browser.dataset.catalogUrl, updateProgress);
    if (!Array.isArray(catalog.targets) || catalog.targets.length === 0) {
      throw new Error("The example catalog is empty");
    }

    const targetList = browser.querySelector("[data-proof-targets]");
    const projectList = browser.querySelector("[data-proof-projects]");
    const projectTitle = browser.querySelector("[data-proof-title]");
    const projectSummary = browser.querySelector("[data-proof-summary]");
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
    updateProgress(100, "Examples ready");
    status.hidden = true;
    browser.classList.add("proof-browser-ready");
  } catch (error) {
    status.replaceChildren(
      element("strong", "proof-error-title", "Examples could not be loaded"),
      element("span", "proof-error-detail", "Open the manuals for source examples."),
    );
    status.classList.add("proof-status-error");
    console.error("Failed to initialize proof browser", error);
  }
};

void initialize();
