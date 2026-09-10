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
const targetMetadata = JSON.parse(readFileSync(join(siteRoot, "data/targets.json"), "utf8"));
const selectedTarget = process.argv.find((argument) => argument.startsWith("--target="))?.slice(9);
if (selectedTarget !== undefined && !targetMetadata.some((target) => target.id === selectedTarget)) {
  throw new Error(`Unknown target: ${selectedTarget}`);
}

const repositories = Object.fromEntries(targetMetadata.map((target) => {
  const prefix = target.id.toUpperCase();
  const sourceRoot = resolve(process.env[`${prefix}_PROOF_SOURCE_ROOT`] ??
    join(workspaceRoot, target.proofRepository));
  return [target.id, {
    name: target.proofRepository,
    sourceRoot,
    outputRoot: resolve(process.env[`${prefix}_PROOF_OUTPUT_ROOT`] ?? sourceRoot),
  }];
}));

const projects = [
  {
    target: "mojo",
    id: "native-functions",
    title: "Native functions",
    summary: "An exact Int32 function callable from native Mojo.",
    path: "packages/native",
    outputFile: "src/mojo_proof_native/app.mojo",
  },
  {
    target: "mojo",
    id: "compile-time-ownership",
    title: "Compile-time and copy",
    summary: "Compile-time loops, runtime materialization, and an explicit string copy.",
    path: "packages/comptime-ownership",
    outputFile: "src/mojo_proof_comptime_ownership/app.mojo",
  },
  {
    target: "mojo",
    id: "language",
    title: "Types and collections",
    summary: "Multi-file source with records, generic functions, arrays, and native types.",
    path: "packages/language",
    outputFile: "src/mojo_proof_language/app.mojo",
  },
  {
    target: "mojo",
    id: "file-system",
    title: "File system",
    summary: "Node filesystem and path calls backed by the Mojo runtime.",
    path: "packages/node",
    outputFile: "src/mojo_proof_node/app.mojo",
  },
  {
    target: "csharp",
    id: "http-server",
    title: "HTTP server",
    summary: "A Node HTTP server compiled into a native .NET application.",
    path: "nodejs/packages/webserver",
  },
  {
    target: "csharp",
    id: "parallel-workers",
    title: "Parallel workers",
    summary: "Three CPU-bound workers run through the .NET parallel task API.",
    path: "bcl/packages/multithreading",
  },
  {
    target: "csharp",
    id: "aspnet-blog",
    title: "ASP.NET blog",
    summary: "A multi-file HTTP API backed by Entity Framework Core and SQLite.",
    path: "aspnetcore/packages/blog-ef",
  },
  {
    target: "csharp",
    id: "spans-and-memory",
    title: "Spans and memory",
    summary: "Allocation-conscious code using native span and memory types.",
    path: "bcl/packages/high-performance",
  },
  {
    target: "csharp",
    id: "generators-and-cleanup",
    title: "Generators and cleanup",
    summary: "Generators, values sent into an iterator, and deterministic disposal.",
    path: "bcl/packages/generators-resources",
  },
  {
    target: "csharp",
    id: "native-pointers",
    title: "Native pointers",
    summary: "Explicit unsafe access, pointer loads, stores, and offsets.",
    path: "bcl/packages/native-pointers",
  },
  {
    target: "rust",
    id: "borrows-and-lifetimes",
    title: "Borrows and lifetimes",
    summary: "Shared and mutable borrows with named lifetime relationships.",
    path: "native/packages/lifetimes",
  },
  {
    target: "rust",
    id: "async-functions",
    title: "Async functions",
    summary: "TypeScript promises lowered into native Rust futures and await points.",
    path: "native/packages/async",
  },
  {
    target: "rust",
    id: "native-crate-api",
    title: "Native crate API",
    summary: "A direct Cargo dependency consumed through compiler-provided declarations.",
    path: "native/packages/cargo-provider",
  },
  {
    target: "rust",
    id: "crypto-and-buffers",
    title: "Crypto and buffers",
    summary: "Node buffers, SHA-256, HMAC, and binary encoding on Rust.",
    path: "nodejs/packages/crypto-buffer",
  },
  {
    target: "rust",
    id: "file-system",
    title: "File system",
    summary: "Ordinary Node file APIs compiled against the Rust Node runtime.",
    path: "nodejs/packages/file-system",
  },
  {
    target: "rust",
    id: "generators-and-cleanup",
    title: "Generators and cleanup",
    summary: "Native iterators, sent values, and resource cleanup without a VM.",
    path: "native/packages/generators-resources",
  },
  {
    target: "rust",
    id: "native-pointers",
    title: "Native pointers",
    summary: "Explicit unsafe regions with typed pointer operations.",
    path: "native/packages/native-pointers",
  },
];

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
  const changed = execFileSync("git", ["status", "--porcelain", "--", `${projectPath}/src`, `${projectPath}/tsonic.json`], {
    cwd: repository.sourceRoot,
    encoding: "utf8",
  });
  if (changed.trim() !== "") {
    throw new Error(`Proof sources must be committed before capture: ${repository.name}/${projectPath}`);
  }
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

const outputFilesFor = (target, repository, projectPath, selectedPath) => {
  const projectRoot = join(repository.outputRoot, projectPath);
  const outputRoot = join(projectRoot, "out", target);
  const extension = targetMetadata.find((metadata) => metadata.id === target).extension;
  const paths = ["src", "generated"].flatMap((directory) =>
    filesUnder(join(outputRoot, directory), (path) => path.endsWith(extension)));
  if (paths.length === 0) {
    throw new Error(`No generated ${target} files found for ${projectPath}`);
  }
  const files = paths.map((path) =>
    serializedFile(outputRoot, path, target));
  if (selectedPath === undefined) return files;
  const selected = files.find((file) => file.path === selectedPath);
  if (selected === undefined) throw new Error(`Missing selected output ${projectPath}/${selectedPath}`);
  return [selected, ...files.filter((file) => file !== selected)];
};

const serializedProjects = projects.filter((project) => selectedTarget === undefined || project.target === selectedTarget).map((project) => {
  const repository = repositories[project.target];
  assertSameSource(repository, project.path);
  return {
    target: project.target,
    id: project.id,
    title: project.title,
    summary: project.summary,
    provenance: {
      repository: repository.name,
      revision: gitRevision(repository.sourceRoot),
      projectPath: project.path,
    },
    sourceFiles: sourceFilesFor(repository, project.path),
    outputFiles: outputFilesFor(project.target, repository, project.path, project.outputFile),
  };
});

const previous = selectedTarget === undefined ? undefined : JSON.parse(readFileSync(outputPath, "utf8"));
const catalog = {
  schemaVersion: 1,
  targets: targetMetadata.map((target) => {
    if (selectedTarget !== undefined && selectedTarget !== target.id) {
      const retained = previous.targets.find((entry) => entry.id === target.id);
      if (retained === undefined) throw new Error(`No existing catalog for ${target.id}; synchronize all targets first`);
      return retained;
    }
    return {
      id: target.id,
      label: target.label,
      outputLabel: target.outputLabel,
      accent: target.accent,
      projects: serializedProjects
        .filter((project) => project.target === target.id)
        .map(({ target: _target, ...project }) => project),
    };
  }),
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
    `Wrote ${serializedProjects.length} source-backed projects to ${relative(siteRoot, outputPath)}`,
  );
}

if (statSync(outputPath).size > 2 * 1024 * 1024) {
  throw new Error("Proof example catalog exceeds the 2 MiB site budget");
}
