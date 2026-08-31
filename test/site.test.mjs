import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const publicDir = join(root, "public");
const canonicalDocsDir = resolve(root, "../tsonic/docs");

const filesUnder = (directory) => {
  const files = [];
  const visit = (current) => {
    const entries = readdirSync(current, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) files.push(path);
    }
  };
  visit(directory);
  return files;
};

const outputForMarkdown = (sourcePath) => {
  const relativePath = relative(canonicalDocsDir, sourcePath);
  const fileName = basename(relativePath).toLowerCase();
  const isIndex = fileName === "readme.md" || fileName === "index.md" || fileName === "_index.md";
  const outputDirectory = isIndex
    ? dirname(relativePath)
    : join(dirname(relativePath), basename(relativePath, extname(relativePath)));
  return join(publicDir, "docs", outputDirectory === "." ? "" : outputDirectory, "index.html");
};

test("the landing page states the current target contract directly", () => {
  const html = readFileSync(join(publicDir, "index.html"), "utf8");
  assert.match(html, /TypeScript to <strong class="gradient-dotnet">\.NET\.<\/strong>/u);
  assert.match(html, /TypeScript to <strong class="gradient-rust">Rust\.<\/strong>/u);
  assert.match(html, /Coming soon<\/span> Mojo, Python, and Triton/u);
  assert.match(html, /Tsonic checks TypeScript, writes native source projects/u);
  assert.doesNotMatch(html, /tsbindgen|@tsonic\/express|strict, deterministic subset/u);
});

test("every canonical Tsonic documentation page is published", () => {
  const markdown = filesUnder(canonicalDocsDir).filter((path) => path.endsWith(".md"));
  assert.ok(markdown.length >= 50, `expected the complete docs tree, found ${markdown.length} markdown files`);
  for (const sourcePath of markdown) {
    const outputPath = outputForMarkdown(sourcePath);
    assert.ok(existsSync(outputPath), `missing output for ${relative(canonicalDocsDir, sourcePath)}: ${outputPath}`);
  }
});

test("search contains canonical docs and no retired mounts", () => {
  const search = JSON.parse(readFileSync(join(publicDir, "search.json"), "utf8"));
  assert.ok(search.some((item) => item.url === "/docs/manual/get-started/" && item.title === "Get Started"));
  assert.ok(search.some((item) => item.url === "/docs/manual/targets/rust/ownership-and-safety/"));
  assert.ok(search.some((item) => item.url === "/docs/reference/targets/csharp/provider-api/"));
  assert.ok(search.every((item) => item.mount === "Home" || item.mount === "Docs"));
  assert.ok(search.every((item) => !item.url.startsWith("/tsbindgen/") && !item.url.startsWith("/express/")));
});

test("generated internal links resolve inside the published site", () => {
  const htmlFiles = filesUnder(publicDir).filter((path) => path.endsWith(".html"));
  const failures = [];
  for (const htmlPath of htmlFiles) {
    const html = readFileSync(htmlPath, "utf8");
    const matches = html.matchAll(/href="([^"]+)"/gu);
    for (const match of matches) {
      const href = match[1];
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
      const url = new URL(href, `https://tsonic.org/${relative(publicDir, htmlPath).split(sep).join("/")}`);
      if (url.origin !== "https://tsonic.org") continue;
      const path = decodeURIComponent(url.pathname);
      const candidate = path.endsWith("/")
        ? join(publicDir, path, "index.html")
        : extname(path) === ""
          ? join(publicDir, path, "index.html")
          : join(publicDir, path);
      if (!existsSync(candidate)) failures.push(`${relative(publicDir, htmlPath)} -> ${href}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("generated HTML has no trailing whitespace", () => {
  const htmlFiles = filesUnder(publicDir).filter((path) => path.endsWith(".html"));
  const failures = [];
  for (const htmlPath of htmlFiles) {
    const lines = readFileSync(htmlPath, "utf8").split("\n");
    for (let index = 0; index < lines.length; index++) {
      if (/[ \t]+$/u.test(lines[index])) failures.push(`${relative(publicDir, htmlPath)}:${index + 1}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("the repository uses the Rust Tsumo build and contains no old application project", () => {
  const buildScript = readFileSync(join(root, "scripts/build.sh"), "utf8");
  assert.match(buildScript, /tsumo-rust\/target\/release\/tsumo/u);
  assert.doesNotMatch(buildScript, /tsonic build|dotnet|packages\/cli\/out/u);
  assert.equal(existsSync(join(root, "packages/tsonic.org/package.json")), false);
  assert.equal(existsSync(join(root, "tsonic.workspace.json")), false);
  assert.equal(existsSync(join(publicDir, "tsonic")), false);
  assert.equal(existsSync(join(publicDir, "docs.css")), false);
  assert.ok(statSync(join(publicDir, "assets/site.css")).size > 10_000);
});
