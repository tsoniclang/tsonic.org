import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const siteRoot = resolve(import.meta.dirname, "..");
const workspaceRoot = resolve(siteRoot, "..");
const outputPath = join(siteRoot, "static/assets/proof-examples.json");
const checkOnly = process.argv.includes("--check");

const repositories = {
  csharp: {
    name: "proof-is-in-the-pudding",
    sourceRoot: resolve(
      process.env.CSHARP_PROOF_SOURCE_ROOT ??
        join(workspaceRoot, "proof-is-in-the-pudding"),
    ),
    outputRoot: resolve(
      process.env.CSHARP_PROOF_OUTPUT_ROOT ??
        process.env.CSHARP_PROOF_SOURCE_ROOT ??
        join(workspaceRoot, "proof-is-in-the-pudding"),
    ),
  },
  rust: {
    name: "rust-pudding",
    sourceRoot: resolve(
      process.env.RUST_PROOF_SOURCE_ROOT ?? join(workspaceRoot, "rust-pudding"),
    ),
    outputRoot: resolve(
      process.env.RUST_PROOF_OUTPUT_ROOT ??
        process.env.RUST_PROOF_SOURCE_ROOT ??
        join(workspaceRoot, "rust-pudding"),
    ),
  },
};

const projects = [
  {
    target: "csharp",
    id: "http-server",
    title: "HTTP server",
    summary: "A Node HTTP server compiled into a native .NET application.",
    capabilities: ["node:http", "callbacks", "HTTP", "native runtime"],
    path: "nodejs/packages/webserver",
  },
  {
    target: "csharp",
    id: "parallel-workers",
    title: "Parallel workers",
    summary: "Three CPU-bound workers run through the .NET parallel task API.",
    capabilities: ["multithreading", "BCL", "closures", "64-bit integers"],
    path: "bcl/packages/multithreading",
  },
  {
    target: "csharp",
    id: "aspnet-blog",
    title: "ASP.NET blog",
    summary: "A multi-file HTTP API backed by Entity Framework Core and SQLite.",
    capabilities: ["ASP.NET Core", "EF Core", "SQLite", "routing", "JSON"],
    path: "aspnetcore/packages/blog-ef",
  },
  {
    target: "csharp",
    id: "spans-and-memory",
    title: "Spans and memory",
    summary: "Allocation-conscious code using native span and memory types.",
    capabilities: ["Span<T>", "Memory<T>", "value types", "native arrays"],
    path: "bcl/packages/high-performance",
  },
  {
    target: "csharp",
    id: "generators-and-cleanup",
    title: "Generators and cleanup",
    summary: "Generators, values sent into an iterator, and deterministic disposal.",
    capabilities: ["generators", "yield", "iterator input", "using"],
    path: "bcl/packages/generators-resources",
  },
  {
    target: "csharp",
    id: "native-pointers",
    title: "Native pointers",
    summary: "Explicit unsafe access, pointer loads, stores, and offsets.",
    capabilities: ["unsafe", "native pointers", "loads and stores", "offsets"],
    path: "bcl/packages/native-pointers",
  },
  {
    target: "rust",
    id: "borrows-and-lifetimes",
    title: "Borrows and lifetimes",
    summary: "Shared and mutable borrows with named lifetime relationships.",
    capabilities: ["&T", "&mut T", "lifetimes", "outlives", "no clone"],
    path: "native/packages/lifetimes",
  },
  {
    target: "rust",
    id: "async-functions",
    title: "Async functions",
    summary: "TypeScript promises lowered into native Rust futures and await points.",
    capabilities: ["async", "await", "Future", "typed return"],
    path: "native/packages/async",
  },
  {
    target: "rust",
    id: "native-crate-api",
    title: "Native crate API",
    summary: "A direct Cargo dependency consumed through compiler-provided declarations.",
    capabilities: ["Cargo crates", "rustdoc", "generics", "collections", "unsafe"],
    path: "native/packages/cargo-provider",
  },
  {
    target: "rust",
    id: "crypto-and-buffers",
    title: "Crypto and buffers",
    summary: "Node buffers, SHA-256, HMAC, and binary encoding on Rust.",
    capabilities: ["node:crypto", "Buffer", "SHA-256", "HMAC"],
    path: "nodejs/packages/crypto-buffer",
  },
  {
    target: "rust",
    id: "file-system",
    title: "File system",
    summary: "Ordinary Node file APIs compiled against the Rust Node runtime.",
    capabilities: ["node:fs", "files", "UTF-8", "native runtime"],
    path: "nodejs/packages/file-system",
  },
  {
    target: "rust",
    id: "generators-and-cleanup",
    title: "Generators and cleanup",
    summary: "Native iterators, sent values, and resource cleanup without a VM.",
    capabilities: ["generators", "Iterator", "yield", "Drop"],
    path: "native/packages/generators-resources",
  },
  {
    target: "rust",
    id: "native-pointers",
    title: "Native pointers",
    summary: "Explicit unsafe regions with typed pointer operations.",
    capabilities: ["unsafe", "raw pointers", "loads and stores", "offsets"],
    path: "native/packages/native-pointers",
  },
];

const targetMetadata = {
  csharp: {
    id: "csharp",
    label: ".NET",
    outputLabel: "Generated C#",
    accent: "dotnet",
  },
  rust: {
    id: "rust",
    label: "Rust",
    outputLabel: "Generated Rust",
    accent: "rust",
  },
};

const posixPath = (path) => path.split(sep).join("/");

const hash = (content) =>
  createHash("sha256").update(content).digest("hex");

const gitRevision = (directory) =>
  execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: directory,
    encoding: "utf8",
  }).trim();

const filesUnder = (directory, predicate) => {
  if (!existsSync(directory)) return [];
  const paths = [];
  const visit = (current) => {
    const entries = readdirSync(current, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && predicate(path)) paths.push(path);
    }
  };
  visit(directory);
  return paths;
};

const assertSameSource = (repository, projectPath) => {
  if (repository.sourceRoot === repository.outputRoot) return;
  const canonicalRoot = join(repository.sourceRoot, projectPath);
  const verifiedRoot = join(repository.outputRoot, projectPath);
  const canonicalPaths = [
    ...filesUnder(join(canonicalRoot, "src"), (path) => path.endsWith(".ts")),
    join(canonicalRoot, "tsonic.json"),
  ];
  for (const canonicalPath of canonicalPaths) {
    const relativePath = relative(canonicalRoot, canonicalPath);
    const verifiedPath = join(verifiedRoot, relativePath);
    if (!existsSync(verifiedPath)) {
      throw new Error(`Verified proof is missing ${projectPath}/${relativePath}`);
    }
    const canonical = readFileSync(canonicalPath);
    const verified = readFileSync(verifiedPath);
    if (!canonical.equals(verified)) {
      throw new Error(`Verified proof source is stale: ${projectPath}/${relativePath}`);
    }
  }
};

const serializedFile = (base, path, language) => {
  const content = readFileSync(path);
  return {
    path: posixPath(relative(base, path)),
    language,
    sha256: hash(content),
    content: content.toString("utf8"),
  };
};

const sourceFilesFor = (repository, projectPath) => {
  const projectRoot = join(repository.sourceRoot, projectPath);
  const sourcePaths = filesUnder(
    join(projectRoot, "src"),
    (path) => path.endsWith(".ts"),
  );
  if (sourcePaths.length === 0) {
    throw new Error(`No TypeScript source files found for ${projectPath}`);
  }
  return sourcePaths.map((path) => serializedFile(projectRoot, path, "typescript"));
};

const outputFilesFor = (target, repository, projectPath) => {
  const projectRoot = join(repository.outputRoot, projectPath);
  const outputRoot = join(projectRoot, "out", target);
  let paths;
  if (target === "csharp") {
    paths = [
      ...filesUnder(join(outputRoot, "src"), (path) => path.endsWith(".cs")),
      ...filesUnder(join(outputRoot, "generated"), (path) => path.endsWith(".cs")),
    ];
  } else {
    paths = [
      ...filesUnder(join(outputRoot, "src"), (path) => path.endsWith(".rs")),
    ];
  }
  if (paths.length === 0) {
    throw new Error(`No generated ${target} files found for ${projectPath}`);
  }
  return paths.map((path) =>
    serializedFile(outputRoot, path, target === "csharp" ? "csharp" : "rust"));
};

const serializedProjects = projects.map((project) => {
  const repository = repositories[project.target];
  assertSameSource(repository, project.path);
  return {
    target: project.target,
    id: project.id,
    title: project.title,
    summary: project.summary,
    capabilities: project.capabilities,
    provenance: {
      repository: repository.name,
      revision: gitRevision(repository.sourceRoot),
      projectPath: project.path,
    },
    sourceFiles: sourceFilesFor(repository, project.path),
    outputFiles: outputFilesFor(project.target, repository, project.path),
  };
});

const catalog = {
  schemaVersion: 1,
  targets: Object.values(targetMetadata).map((target) => ({
    ...target,
    projects: serializedProjects
      .filter((project) => project.target === target.id)
      .map(({ target: _target, ...project }) => project),
  })),
};

const serialized = `${JSON.stringify(catalog, null, 2)}\n`;
if (checkOnly) {
  if (!existsSync(outputPath) || readFileSync(outputPath, "utf8") !== serialized) {
    throw new Error("Proof example catalog is stale; run npm run examples:sync");
  }
  console.log(`Proof example catalog is current: ${relative(siteRoot, outputPath)}`);
} else {
  writeFileSync(outputPath, serialized);
  console.log(
    `Wrote ${serializedProjects.length} verified projects to ${relative(siteRoot, outputPath)}`,
  );
}

if (statSync(outputPath).size > 2 * 1024 * 1024) {
  throw new Error("Proof example catalog exceeds the 2 MiB site budget");
}
