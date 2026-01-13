#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TSUMO="${TSUMO:-$ROOT/../tsumo/packages/cli/out/tsumo}"

TSONIC_DOCS="${TSONIC_DOCS:-$ROOT/../tsonic/docs}"
TSBINDGEN_DOCS="${TSBINDGEN_DOCS:-$ROOT/../tsbindgen/docs}"
NODEJS_REPO="${NODEJS_REPO:-$ROOT/../nodejs-clr}"

if [[ ! -x "$TSUMO" ]]; then
  echo "tsumo CLI not found at: $TSUMO" >&2
  echo "Set TSUMO=/path/to/tsumo or build tsumo in ../tsumo first." >&2
  exit 1
fi

if [[ ! -f "$TSONIC_DOCS/README.md" ]]; then
  echo "Tsonic docs not found at: $TSONIC_DOCS/README.md" >&2
  exit 1
fi

if [[ ! -f "$TSBINDGEN_DOCS/README.md" ]]; then
  echo "tsbindgen docs not found at: $TSBINDGEN_DOCS/README.md" >&2
  exit 1
fi

if [[ ! -f "$NODEJS_REPO/README.md" ]]; then
  echo "nodejs-clr README not found at: $NODEJS_REPO/README.md" >&2
  exit 1
fi

rm -rf "$ROOT/.tmp/mounts"
mkdir -p "$ROOT/.tmp/mounts/tsonic" "$ROOT/.tmp/mounts/tsbindgen" "$ROOT/.tmp/mounts/nodejs"

cp -R "$TSONIC_DOCS/." "$ROOT/.tmp/mounts/tsonic/"
cp -R "$TSBINDGEN_DOCS/." "$ROOT/.tmp/mounts/tsbindgen/"
awk '
  BEGIN { inserted = 0 }
  /^## Overview[[:space:]]*$/ && inserted == 0 {
    print "## Table of Contents";
    print "";
    print "### Node.js Standard Library";
    print "";
    print "- [Overview](README.md#overview)";
    print "- [Installation](README.md#installation)";
    print "- [Usage](README.md#usage)";
    print "- [Implemented Modules](README.md#implemented-modules)";
    print "- [Architecture](README.md#architecture)";
    print "";
    inserted = 1;
  }
  { print }
' "$NODEJS_REPO/README.md" >"$ROOT/.tmp/mounts/nodejs/README.md"

rm -rf "$ROOT/public"
exec "$TSUMO" build --source "$ROOT" --destination "$ROOT/public"
