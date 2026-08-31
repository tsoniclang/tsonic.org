import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const outputDirectory = resolve(process.argv[2] ?? "public");

const visit = (directory) => {
  const entries = readdirSync(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      visit(path);
      continue;
    }
    if (!entry.isFile() || extname(entry.name) !== ".html") continue;
    const source = readFileSync(path, "utf8");
    const normalized = source.replace(/[ \t]+$/gmu, "");
    if (normalized !== source) writeFileSync(path, normalized, "utf8");
  }
};

visit(outputDirectory);
