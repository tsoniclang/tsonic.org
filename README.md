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
`proof-is-in-the-pudding` and `rust-pudding` repositories. It contains authored
TypeScript, generated native source, file hashes, and the proof
repository revision.

After running both proof suites, refresh the browser data with:

```bash
npm run examples:sync
```

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
