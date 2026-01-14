#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TSUMO="${TSUMO:-$ROOT/../tsumo/packages/cli/out/tsumo}"

TSONIC_DOCS="${TSONIC_DOCS:-$ROOT/../tsonic/docs}"
TSONIC_REPO="${TSONIC_REPO:-$ROOT/../tsonic}"
TSBINDGEN_DOCS="${TSBINDGEN_DOCS:-$ROOT/../tsbindgen/docs}"
NODEJS_REPO="${NODEJS_REPO:-$ROOT/../nodejs-clr}"
NODEJS_DOCS="${NODEJS_DOCS:-$NODEJS_REPO/docs}"
JS_RUNTIME_REPO="${JS_RUNTIME_REPO:-$ROOT/../js-runtime}"
JS_RUNTIME_DOCS="${JS_RUNTIME_DOCS:-$JS_RUNTIME_REPO/docs}"

if [[ ! -x "$TSUMO" ]]; then
  echo "tsumo CLI not found at: $TSUMO" >&2
  echo "Set TSUMO=/path/to/tsumo or build tsumo in ../tsumo first." >&2
  exit 1
fi

if [[ ! -f "$TSONIC_DOCS/README.md" ]]; then
  echo "Tsonic docs not found at: $TSONIC_DOCS/README.md" >&2
  exit 1
fi

if [[ ! -f "$TSONIC_REPO/README.md" ]]; then
  echo "Tsonic README not found at: $TSONIC_REPO/README.md" >&2
  exit 1
fi

if [[ ! -f "$TSBINDGEN_DOCS/README.md" ]]; then
  echo "tsbindgen docs not found at: $TSBINDGEN_DOCS/README.md" >&2
  exit 1
fi

if [[ ! -f "$NODEJS_DOCS/README.md" ]]; then
  echo "nodejs-clr docs not found at: $NODEJS_DOCS/README.md" >&2
  exit 1
fi

if [[ ! -f "$JS_RUNTIME_DOCS/README.md" ]]; then
  echo "js-runtime docs not found at: $JS_RUNTIME_DOCS/README.md" >&2
  exit 1
fi

rm -rf "$ROOT/.tmp/mounts"
mkdir -p \
  "$ROOT/.tmp/mounts/home" \
  "$ROOT/.tmp/mounts/tsonic" \
  "$ROOT/.tmp/mounts/tsbindgen" \
  "$ROOT/.tmp/mounts/nodejs" \
  "$ROOT/.tmp/mounts/js"

awk '
  # Rewrite repo-relative docs links for website mounting.
  # The homepage is the repo root README, but the docs live under /tsonic/.
  {
    gsub("docs/build-output.md", "/tsonic/build-output/");
    gsub("docs/architecture/pipeline.md", "/tsonic/architecture/pipeline/");
    gsub("docs/dotnet-interop.md", "/tsonic/dotnet-interop/");
    gsub("docs/README.md", "/tsonic/");
    gsub("docs/architecture/README.md", "/tsonic/architecture/");
    print;
  }
' "$TSONIC_REPO/README.md" >"$ROOT/.tmp/mounts/home/README.md"

cp -R "$TSONIC_DOCS/." "$ROOT/.tmp/mounts/tsonic/"
cp -R "$TSBINDGEN_DOCS/." "$ROOT/.tmp/mounts/tsbindgen/"
cp -R "$NODEJS_DOCS/." "$ROOT/.tmp/mounts/nodejs/"
cp -R "$JS_RUNTIME_DOCS/." "$ROOT/.tmp/mounts/js/"

rm -rf "$ROOT/public"
exec "$TSUMO" build --source "$ROOT" --destination "$ROOT/public"
