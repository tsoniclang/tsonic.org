---
title: Home
---

# Tsonic

Tsonic compiles a strict, deterministic subset of TypeScript into C#, then
builds native binaries or .NET outputs from that generated project.

## Stack

- `tsonic` is the compiler and CLI.
- `@tsonic/core` provides primitive intent types and compiler intrinsics.
- `@tsonic/js` is the JavaScript ambient surface.
- `@tsonic/nodejs` is a first-party TypeScript source package for Node-style
  modules.
- `@tsonic/express` is a first-party TypeScript source package for
  Express-style routing and middleware.
- `tsbindgen` generates CLR binding packages such as `@tsonic/dotnet`,
  `@tsonic/aspnetcore`, `@tsonic/microsoft-extensions`, and `@tsonic/efcore*`.
- Release quality is verified across compiler tests, package selftests,
  generated binding packages, and downstream applications.

## Documentation model

This site mounts product documentation from the owning repositories instead of
duplicating it locally.

- `tsonic.org` owns cross-repo synthesis pages.
- `tsonic/docs` owns compiler, CLI, workspace, and architecture docs.
- `tsbindgen/docs` owns generated binding pipeline docs.
- `js/docs` owns `@tsonic/js` docs.
- `nodejs/docs` owns `@tsonic/nodejs` docs.
- `express/docs` owns `@tsonic/express` docs.

## Start here

- [/architecture/](/architecture/) — architecture and package model
- [/ecosystem/](/ecosystem/) — repo, package, and ownership map
- [/testing-and-releases/](/testing-and-releases/) — release gates and wave flow
- [/tsonic/](/tsonic/) — compiler, CLI, workspaces, build modes, examples
- [/js/](/js/) — `@tsonic/js`
- [/nodejs/](/nodejs/) — `@tsonic/nodejs`
- [/express/](/express/) — `@tsonic/express`
- [/tsbindgen/](/tsbindgen/) — generated CLR binding packages

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
tsonic restore
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

### EF Core + SQLite workspace

```bash
tsonic init
tsonic add nuget Microsoft.EntityFrameworkCore.Sqlite 10.0.0 @tsonic/efcore-sqlite
tsonic restore
```

```ts
import { DbContext, DbContextOptionsBuilder } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { SqliteDbContextOptionsBuilderExtensions } from "@tsonic/efcore-sqlite/Microsoft.EntityFrameworkCore.js";

export class AppDbContext extends DbContext {
}

export function configure(builder: DbContextOptionsBuilder): void {
  SqliteDbContextOptionsBuilderExtensions.UseSqlite(builder, "Data Source=app.db");
}
```
