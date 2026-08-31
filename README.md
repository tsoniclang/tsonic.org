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
