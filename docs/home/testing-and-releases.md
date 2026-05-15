---
title: Testing and Releases
---

# Testing and Release Discipline

The stack is validated in layers. Release work is not complete until the whole
chain is green.

## 1. Compiler gate

The authoritative compiler gate is:

```bash
./test/scripts/run-all.sh
```

This covers:

- frontend tests
- emitter tests and goldens
- CLI tests
- typecheck fixtures
- end-to-end .NET fixtures
- negative fixtures

The full suite is the real gate. Faster subsets are useful while iterating, but
they are not the final release signal.

## 2. Package selftests

First-party packages carry package-local verification where appropriate:

- `js`
- `nodejs`
- `express`

Those gates matter because a package-local API matrix can fail even when no
downstream app happens to hit the broken path.

Typical commands:

```bash
bash scripts/selftest.sh
```

## 3. Downstream verification

The release bar includes real application repos:

- `proof-is-in-the-pudding`
- `tsumo`
- `clickmeter`
- Jotster

These catch integration failures that unit tests cannot:

- startup failures
- request/response bugs
- package graph mismatches
- binding regressions
- publish/runtime issues

Typical commands:

```bash
bash scripts/verify-all.sh
```

These downstream verification scripts run against local sibling repos during a
wave, not against an arbitrary mix of published npm package versions. A release
wave can include:

- compiler work in `tsonic`
- first-party source-package work in `js`, `nodejs`, or `express`
- regenerated CLR binding packages from `tsbindgen`
- downstream applications that consume all of the above together

## 4. Binding-package regeneration

`tsbindgen` is part of the release flow, not just a local codegen tool.

When compiler, runtime, or CLR-shape work affects bindings, the normal flow is:

1. regenerate affected binding repos
2. validate those packages locally
3. rerun compiler and downstream gates
4. publish only after the wave is coherent

## 5. Version drift and publish preflight

Release preflight checks drift explicitly:

- is local content ahead of the published version?
- does package content require a version bump?
- is the whole wave internally consistent before publish?

This avoids silent republish at the same version and makes release waves
explicit.

## 6. Wave publish

The wave process is:

1. get `tsonic` green
2. get first-party source packages green
3. rerun downstream applications
4. regenerate binding packages if needed
5. bump versions where content drift requires it
6. publish the coherent wave

## Why the process is strict

This stack is tightly coupled:

- compiler work can alter emitted package boundaries
- source-package work can affect runtime behavior and manifests
- binding-package work can affect overload resolution and CLR interop
- downstream apps expose the combined behavior of all of the above

Release work is an ecosystem-level decision instead of a set of isolated repo
actions.

## Wave package set

The publish wave covers npm packages and NuGet runtime packages together.

Npm packages:

- `tsbindgen`
- `tsonic`
- `@tsonic/core`
- `@tsonic/dotnet`
- `@tsonic/globals`
- `@tsonic/js`
- `@tsonic/nodejs`
- `@tsonic/express`
- `@tsonic/aspnetcore`
- `@tsonic/microsoft-extensions`
- `@tsonic/efcore`
- `@tsonic/efcore-sqlite`
- `@tsonic/efcore-sqlserver`
- `@tsonic/efcore-npgsql`

NuGet packages:

- `Tsonic.Runtime`

Every publish decision starts from clean, latest `main` in each wave repo.
Version checks and content-drift checks run before any registry write.
