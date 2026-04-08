# tsonic.org

This repo contains the published documentation site for the Tsonic ecosystem.

The site keeps its cross-repo landing pages locally under `docs/home`, mounts
repo-owned product docs from sibling repos, and commits the generated site under
`public/`.

## Documentation ownership model

The current docs model is split deliberately:

- `tsonic.org` owns cross-repo synthesis pages
  - current state
  - ecosystem map
  - testing and release flow
- owning repos own their product docs
  - `tsonic/docs`
  - `tsbindgen/docs`
  - `js/docs`
  - `nodejs/docs`
  - `express/docs`

That keeps one source of truth per topic while still letting the site present a
coherent public view of the ecosystem.

## Why this split exists

The older site mirrored sibling docs too loosely, which made the public story
stale and inconsistent once the ecosystem changed quickly.

The current architecture spans several repos:

- `tsonic` owns the compiler and CLI
- `@tsonic/js`, `@tsonic/nodejs`, and `@tsonic/express` are first-party
  TypeScript source packages
- `tsbindgen` owns generated CLR binding packages
- downstream verification across `proof-is-in-the-pudding`, `tsumo`,
  `clickmeter`, and Jotster is part of the release bar

Those cross-repo explanations belong here. Repo-specific command references,
package docs, and architecture docs belong in the owning repos.

## Build

Prerequisites:

- clone sibling repos next to this repo:
  - `tsonic`
  - `tsbindgen`
  - `js`
  - `nodejs`
  - `express`
  - `tsumo`
- build `tsumo` so `../tsumo/packages/cli/out/tsumo` exists

Then run:

```bash
./scripts/build.sh
```

## Mounted sections

- `docs/home` — homepage, current-state summary, ecosystem map, release flow
- `../tsonic/docs` — compiler, CLI, package model, examples, architecture
- `../tsbindgen/docs` — CLR binding generation docs
- `../js/docs` — `@tsonic/js`
- `../nodejs/docs` — `@tsonic/nodejs`
- `../express/docs` — `@tsonic/express`

## Deployment

Netlify publishes the checked-in `public/` directory directly.
