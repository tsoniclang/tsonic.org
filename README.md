# tsonic.org

This is the source for [tsonic.org](https://tsonic.org).

The repository owns the landing page, site layouts, styles, search interface,
and deployment output. Product documentation stays in `../tsonic/docs` and is
mounted directly at build time. There is no copied product manual here.

## Build

The build uses the Rust Tsumo executable. Keep these sibling repositories next
to this one:

- `tsonic`
- `tsumo-rust`

Build Tsumo once, then build the site:

```bash
cd ../tsumo-rust
npm run build

cd ../tsonic.org
npm run build
npm test
```

Set `TSUMO_RUST=/path/to/tsumo` to use another Tsumo Rust executable. Generated
files are written to `public/` and committed for deployment.

## Deployment

Netlify publishes the checked-in `public/` directory directly.

## Homepage proof browser

The homepage example browser is generated from passing projects in the sibling
`pudding-csharp`, `rust-pudding` and `mojo-pudding` repositories. It contains authored
TypeScript, generated native source, file hashes, and the proof
repository revision.

After running the relevant proof suites, refresh the browser data with:

```bash
npm run examples:sync
```

Use `npm run examples:sync -- --target=mojo` to refresh only one target without
replacing the other targets' snapshots. Selected proof sources must be committed;
another team's unrelated working files are not included in a snapshot. Source
hashes prove catalog identity, not native execution by themselves.

If proof output was produced in an isolated verification workspace, point the
sync command at those workspace roots:

```bash
CSHARP_PROOF_OUTPUT_ROOT=/path/to/csharp-proof/workspace \
RUST_PROOF_OUTPUT_ROOT=/path/to/rust-proof/workspace \
npm run examples:sync
```

`npm run examples:check` proves that the checked-in catalog matches the
selected proof outputs. The normal site build consumes the checked-in catalog;
it does not invoke either compiler.

## Target navigation

`data/targets.json` owns the target list used by the header, homepage, documentation
selector and example synchronizer. Canonical manuals and references live under
`tsonic/docs/{manual,reference}/targets/<id>/` and must be listed in its README
and sidebars.json. The site does not keep a separate copy of the manual.

Shared chapters are always visible. Target chapters and search results follow
the selected language. A target-specific URL takes precedence over saved browser
preferences. Switching languages keeps the equivalent chapter when available,
otherwise opens the selected target's manual or reference overview.

`npm run test:browser` exercises the built site in Chrome, on desktop and mobile.
Set `BROWSER_EXECUTABLE` when Chrome is not at its usual Linux location.
