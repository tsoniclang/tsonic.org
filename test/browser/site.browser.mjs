import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { after, before, test } from "node:test";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "../..");
const published = resolve(root, "public");
const screenshots = resolve(root, ".temp/browser");
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };
let browser;
let server;
let origin;

before(async () => {
  await mkdir(screenshots, { recursive: true });
  server = createServer(async (request, response) => {
    try {
      let path = resolve(published, `.${decodeURIComponent(new URL(request.url, "http://localhost").pathname)}`);
      if (path !== published && !path.startsWith(`${published}${sep}`)) {
        response.writeHead(403).end();
        return;
      }
      if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
      const content = await readFile(path);
      response.writeHead(200, { "content-type": mime[extname(path)] ?? "application/octet-stream", "content-length": content.length });
      response.end(content);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((ready) => server.listen(0, "127.0.0.1", ready));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : { channel: "chrome" }),
    headless: true,
  });
});

after(async () => {
  await browser?.close();
  if (server) await new Promise((closed) => server.close(closed));
});

test("desktop target selection, deep links, shared chapters and search", async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(`${origin}/docs/reference/`);
    const selector = page.locator("[data-doc-target-select]");
    for (const target of ["csharp", "rust", "mojo"]) {
      await selector.selectOption(target);
      assert.equal(await page.locator(".target-chapters:visible").count(), 2);
      assert.equal(await page.locator(`.target-chapters:visible:not([data-doc-target="${target}"])`).count(), 0);
      assert.ok(await page.locator('.docs-nav a[href="/docs/reference/cli/"]').isVisible());
      await page.locator("#searchBox").fill("configuration");
      await page.waitForFunction(() => !document.querySelector("#searchResults").hidden);
      const links = await page.locator("#searchResults a").evaluateAll((elements) => elements.map((element) => element.getAttribute("href")));
      assert.ok(links.some((link) => link === `/docs/reference/targets/${target}/configuration/`));
      assert.ok(links.every((link) => !link.includes("/targets/") || link.includes(`/targets/${target}/`)));
      await page.locator("#searchBox").fill("");
    }
    await page.goto(`${origin}/docs/reference/targets/rust/configuration/`);
    assert.equal(await selector.inputValue(), "rust");
    await selector.selectOption("mojo");
    await page.waitForURL("**/docs/reference/targets/mojo/configuration/");
    await page.goBack();
    assert.equal(await selector.inputValue(), "rust");
    await page.goto(`${origin}/docs/reference/targets/rust/ownership-and-lifetimes/`);
    await selector.selectOption("mojo");
    await page.waitForURL("**/docs/reference/targets/mojo/");
    await page.goto(`${origin}/docs/reference/cli/`);
    assert.equal(await selector.inputValue(), "mojo");
    await page.screenshot({ path: resolve(screenshots, "docs-desktop.png"), fullPage: true, animations: "disabled" });
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
});

test("homepage loading, all target projects and formatted files", async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let releaseCatalog;
  const catalogGate = new Promise((release) => { releaseCatalog = release; });
  await page.route("**/assets/proof-examples.json", async (route) => {
    await catalogGate;
    await route.continue();
  });
  try {
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    assert.ok(await page.getByText("Loading examples", { exact: true }).isVisible());
    assert.match(await page.locator("[data-proof-progress]").textContent(), /^\d+%$/u);
    releaseCatalog();
    await page.locator("[data-proof-targets] button").first().waitFor();
    assert.equal(await page.locator("[data-proof-targets] button").count(), 3);
    const targets = await page.locator("[data-proof-targets] button").all();
    for (const target of targets) {
      await target.click();
      const projects = await page.locator("[data-proof-projects] button").all();
      for (const project of projects) {
        await project.click();
        for (const side of ["source", "output"]) {
          const select = page.locator(`[data-proof-${side}-select]`);
          const values = await select.locator("option").evaluateAll((options) => options.map((option) => option.value));
          for (const value of values) {
            await select.selectOption(value);
            assert.ok((await page.locator(`[data-proof-${side}-code]`).textContent()).trim().length > 0);
          }
        }
      }
    }
    await page.getByRole("button", { name: "Mojo", exact: true }).click();
    await page.locator('[data-project-id="compile-time-ownership"]').click();
    assert.equal(await page.locator("[data-proof-output-label]").textContent(), "Generated Mojo");
    assert.match(await page.locator("[data-proof-output-code]").textContent(), /def compile_time_proof/u);
    await page.screenshot({ path: resolve(screenshots, "home-desktop.png"), fullPage: true });
    assert.deepEqual(errors, []);
  } finally {
    releaseCatalog();
    await context.close();
  }
});

test("mobile navigation and no-JavaScript target access", async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/docs/manual/targets/mojo/`);
    await page.locator("#menuToggle").click();
    assert.ok(await page.locator("[data-doc-target-select]").isVisible());
    await page.locator("[data-doc-target-select]").selectOption("rust");
    await page.waitForURL("**/docs/manual/targets/rust/");
    await page.locator("#menuToggle").click();
    await page.waitForFunction(() => document.querySelector("#sidebar").getBoundingClientRect().left >= 0);
    await page.screenshot({ path: resolve(screenshots, "docs-mobile.png"), fullPage: true, animations: "disabled" });
    await page.locator("#menuClose").click();
    assert.equal(await page.locator("#menuToggle").getAttribute("aria-expanded"), "false");
    await page.goto(`${origin}/?target=mojo`);
    await page.getByRole("button", { name: "Mojo", exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.screenshot({ path: resolve(screenshots, "home-mobile.png"), fullPage: true });
  } finally {
    await context.close();
  }
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  try {
    const staticPage = await noScript.newPage();
    await staticPage.goto(`${origin}/docs/reference/targets/mojo/`);
    assert.equal(await staticPage.locator(".target-chapters:visible").count(), 2);
    assert.equal(await staticPage.locator('.docs-target-links a').count(), 3);
    await staticPage.locator('.docs-target-links a').filter({ hasText: "Rust" }).click();
    assert.ok(staticPage.url().endsWith("/docs/manual/targets/rust/"));
  } finally {
    await noScript.close();
  }
});
