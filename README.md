# tsonic.org

This repo contains the `tsonic.org` documentation site.

The site is **generated locally** using `tsumo` and the generated HTML is committed to `public/` (Netlify does not run tsumo).

## Build

Prerequisites:
- Clone sibling repos next to this one: `tsonic`, `tsbindgen`, `nodejs-clr`, `tsumo`
- Build tsumo (`../tsumo/packages/cli/out/tsumo` must exist)

Then:

```bash
./scripts/build.sh
```

## Deployment

Netlify is configured to publish the prebuilt `public/` directory (no build step).
