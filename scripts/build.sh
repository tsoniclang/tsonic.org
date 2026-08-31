#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TSUMO_RUST="${TSUMO_RUST:-$ROOT/../tsumo-rust/target/release/tsumo}"

if [[ ! -x "$TSUMO_RUST" ]]; then
  echo "Tsumo Rust executable not found at: $TSUMO_RUST" >&2
  echo "Build ../tsumo-rust or set TSUMO_RUST=/path/to/tsumo." >&2
  exit 1
fi

for path in \
  "$ROOT/docs/home/README.md" \
  "$ROOT/../tsonic/docs/README.md"; do
  if [[ ! -f "$path" ]]; then
    echo "Missing docs file: $path" >&2
    exit 1
  fi
done

if [[ ! -f "$ROOT/tsumo.docs.json" ]]; then
  echo "Missing tsumo.docs.json at repo root." >&2
  exit 1
fi

"$TSUMO_RUST" build --source "$ROOT" --destination "$ROOT/public"
node "$ROOT/scripts/normalize-output.mjs" "$ROOT/public"
