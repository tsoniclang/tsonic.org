---
title: Current State
---

# Current State: April 2026

This page records the state that the site is now documenting.

## Cutoff and survey window

- previous site refresh: **2026-03-10**
- current rewrite baseline: **2026-04-08**

The rewrite was based on a read-through of the current main branches and recent
history across:

- `tsonic`
- `tsbindgen`
- `core`
- `globals`
- `js`
- `nodejs`
- `express`
- `dotnet`
- `aspnetcore`
- `microsoft-extensions`
- `efcore`
- `efcore-sqlite`
- `efcore-sqlserver`
- `efcore-npgsql`
- `proof-is-in-the-pudding`
- `tsumo`
- `clickmeter`
- Jotster

## What changed by repo family

### `tsonic`

The compiler moved further away from any transition-era permissive model.
Important work after 2026-03-10 included:

- strict type-system and emitter cleanup
- overload-family specialization fixes
- package and fixture cleanup toward checked-in package graphs
- downstream regression fixes validated against real applications
- release `0.0.75`

That matters to the docs because the current mental model is now stable enough
to describe directly:

- one compiler-owned noLib core
- one active ambient surface per workspace
- explicit package-based interop
- deterministic lowering instead of best-effort fallback

### `js`

`@tsonic/js` is now clearly a canonical first-party TypeScript source package.
Important shifts since the old site:

- source-first package layout is the norm
- `tsonic.package.json` is the manifest users should understand
- surface behavior was tightened across arrays, iterators, objects, JSON,
  strings, chars, typed arrays, and numeric behavior

The current docs therefore treat `@tsonic/js` as both:

- the active JavaScript ambient surface
- a real source package with exports, ambient files, and manifest metadata

### `nodejs`

`@tsonic/nodejs` is now documented as a first-party authored package, not as a
wrapper around a separate public companion story.

Notable current characteristics:

- source-first package layout
- `node:*` alias map declared in package metadata
- runtime metadata declared from the source package manifest
- package selftests and downstream apps now act as the practical validation bar

The active public relationship is:

- workspace surface = `@tsonic/js`
- installed package = `@tsonic/nodejs`

### `express`

`@tsonic/express` is now the canonical Express-style package.

The important documentation consequence is that users should think in terms of
one package that owns:

- router pipeline
- middleware shape
- request/response helpers
- host-bound handling

The docs no longer explain Express through a public split between separate
generated and companion layers.

### `tsbindgen` and generated bindings

`tsbindgen` is still central, but the site now documents its role more
precisely:

- it generates CLR binding packages
- it participates in release waves and publish preflight
- it does **not** own first-party packages like `js`, `nodejs`, or `express`

Generated binding repos regenerated or advanced in this wave include:

- `@tsonic/dotnet`
- `@tsonic/aspnetcore`
- `@tsonic/microsoft-extensions`
- `@tsonic/efcore`
- `@tsonic/efcore-sqlite`
- `@tsonic/efcore-sqlserver`
- `@tsonic/efcore-npgsql`

### Supporting repos

Other important repo changes since the old site refresh:

- `core` advanced the language-facing helpers and source-first package surface
- `globals` tightened JS/world ambient typing
- `proof-is-in-the-pudding` moved to the local-overlay source-package workflow
- `tsumo` adopted source-package engine contracts and current verifier flow

## Downstream verification changed the release bar

The strict wave was not treated as complete until all of these were green
together:

- `proof-is-in-the-pudding`
- `tsumo`
- `clickmeter`
- Jotster

That is an important documentation point: the ecosystem is now verified as a
wave, not just as isolated repos.

## Active public architecture

The current public architecture is:

- compiler and CLI owned by `tsonic`
- one ambient surface per workspace
- first-party TypeScript source packages for:
  - `@tsonic/js`
  - `@tsonic/nodejs`
  - `@tsonic/express`
- generated CLR binding packages from `tsbindgen`
- ecosystem-level downstream verification before publish

## What the site no longer uses as its explanatory model

The old site blurred the line between:

- authored first-party source packages
- generated CLR binding packages
- older multi-repo public packaging stories

This rewrite does not.

The public documentation model is now:

- source-first package docs for authored packages
- separate generated-binding docs for CLR packages
- repo-owned product docs remain the source of truth for their own areas
- no public explanation built around older companion-package stories

That means the site now explains the stack through:

- `tsonic`
- `tsbindgen`
- `@tsonic/js`
- `@tsonic/nodejs`
- `@tsonic/express`
- generated CLR binding packages

instead of treating older companion C# repos as the primary mental model.

## Documentation policy after this rewrite

This site now owns the cross-repo synthesis pages for the stack.

That is deliberate:

- owning repos keep their detailed product docs
- `tsonic.org` explains the whole ecosystem consistently
- the site mounts repo-owned docs instead of copying them into a second source of truth
