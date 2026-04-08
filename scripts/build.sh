#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TSUMO="${TSUMO:-$ROOT/../tsumo/packages/cli/out/tsumo}"

if [[ ! -x "$TSUMO" ]]; then
  echo "tsumo CLI not found at: $TSUMO" >&2
  echo "Set TSUMO=/path/to/tsumo or build tsumo in ../tsumo first." >&2
  exit 1
fi

for path in \
  "$ROOT/docs/home/README.md" \
  "$ROOT/../tsonic/docs/README.md" \
  "$ROOT/../tsbindgen/docs/README.md" \
  "$ROOT/../js/docs/README.md" \
  "$ROOT/../nodejs/docs/README.md" \
  "$ROOT/../express/docs/README.md"; do
  if [[ ! -f "$path" ]]; then
    echo "Missing docs file: $path" >&2
    exit 1
  fi
done

if [[ ! -f "$ROOT/tsumo.docs.json" ]]; then
  echo "Missing tsumo.docs.json at repo root." >&2
  exit 1
fi

rm -rf "$ROOT/public"
exec "$TSUMO" build --source "$ROOT" --destination "$ROOT/public"
