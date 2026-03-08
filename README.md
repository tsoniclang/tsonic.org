# tsonic.org

This repo contains the `tsonic.org` documentation site.

The site is generated locally with `tsumo`. The generated HTML is committed to `public/`; Netlify serves the prebuilt output and does not run the docs build itself.

## Build

Prerequisites:

- Clone sibling repos next to this one:
  - `tsonic`
  - `tsbindgen`
  - `nodejs-clr`
  - `js-runtime`
  - `tsumo`
- Build `tsumo` so `../tsumo/packages/cli/out/tsumo` exists

Then:

```bash
./scripts/build.sh
```

## Deployment

Mounted docs currently come from:

- `../tsonic/README.md` and `../tsonic/docs`
- `../tsbindgen/docs`
- `../nodejs-clr/docs`
- `../js-runtime/docs`

## Deployment

Netlify publishes the prebuilt `public/` directory directly.
