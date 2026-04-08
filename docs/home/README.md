---
title: Home
---

# Tsonic

Tsonic compiles a strict, deterministic subset of TypeScript into C#, then
builds native binaries or .NET outputs from that generated project.

This site documents the **current April 2026 architecture**. The last major
site refresh landed on **2026-03-10**; enough changed after that point that the
older site no longer described the real stack.

## The current stack in one page

- `tsonic` is the compiler and CLI
- `@tsonic/js` is the active JavaScript ambient surface
- `@tsonic/nodejs` is a first-party TypeScript source package for Node-style
  modules
- `@tsonic/express` is a first-party TypeScript source package for
  Express-style routing and middleware
- `tsbindgen` generates CLR binding packages such as `@tsonic/dotnet`,
  `@tsonic/aspnetcore`, `@tsonic/microsoft-extensions`, and `@tsonic/efcore*`
- the release bar now includes downstream verification, not just compiler tests

The public documentation model is now source-first:

- authored packages are first-party TypeScript source packages
- generated packages are CLR bindings from `tsbindgen`
- release quality is proven across real downstream applications

## Start here

- [/current-state/](/current-state/) — what changed since the last refresh
- [/ecosystem/](/ecosystem/) — repo, package, and ownership map
- [/testing-and-releases/](/testing-and-releases/) — release gates and wave flow
- [/tsonic/](/tsonic/) — compiler, CLI, workspaces, build modes, examples
- [/js/](/js/) — `@tsonic/js`
- [/nodejs/](/nodejs/) — `@tsonic/nodejs`
- [/express/](/express/) — `@tsonic/express`
- [/tsbindgen/](/tsbindgen/) — generated CLR binding packages

## What changed after 2026-03-10

The biggest shifts since the previous docs refresh were:

- `tsonic` completed a strict typing and emitter cleanup wave and stabilized the
  current package model
- first-party packages (`js`, `nodejs`, `express`) converged on canonical
  `tsonic-source-package` manifests
- binding repos (`dotnet`, `aspnetcore`, `microsoft-extensions`, `efcore*`)
  were regenerated and re-versioned as part of the same wave
- downstream verification against `proof-is-in-the-pudding`, `tsumo`,
  `clickmeter`, and Jotster became part of the normal release discipline

See [/current-state/](/current-state/) for the detailed repo-by-repo summary.

## Quick starts

### CLR-first workspace

```bash
mkdir hello-clr
cd hello-clr
tsonic init
tsonic run
```

```ts
import { Console } from "@tsonic/dotnet/System.js";

export function main(): void {
  Console.WriteLine("Hello from Tsonic.");
}
```

### JS-surface workspace

```bash
mkdir hello-js
cd hello-js
tsonic init --surface @tsonic/js
tsonic run
```

```ts
export function main(): void {
  const message = "  hello from tsonic  ".trim().toUpperCase();
  console.log(message);
}
```

### JS + Node modules

```bash
mkdir hello-node
cd hello-node
tsonic init --surface @tsonic/js
tsonic add npm @tsonic/nodejs
tsonic run
```

```ts
import * as fs from "node:fs";
import * as path from "node:path";

export function main(): void {
  const file = path.join("src", "App.ts");
  console.log(file, fs.existsSync(file));
}
```

### ASP.NET Core workspace

```bash
tsonic init
tsonic add framework Microsoft.AspNetCore.App @tsonic/aspnetcore
tsonic run --project myapp
```

```ts
import { WebApplication } from "@tsonic/aspnetcore/Microsoft.AspNetCore.Builder.js";
import type { ExtensionMethods } from "@tsonic/aspnetcore/Microsoft.AspNetCore.Builder.js";

export function main(): void {
  const builder = WebApplication.CreateBuilder();
  const app = builder.Build() as ExtensionMethods<WebApplication>;
  app.MapGet("/", () => "Hello from ASP.NET Core");
  app.Run("http://localhost:8080");
}
```

## Rule of thumb

- use `/tsonic/` for compiler and project model docs
- use `/js/`, `/nodejs/`, and `/express/` for authored first-party packages
- use `/tsbindgen/` for generated CLR binding packages
