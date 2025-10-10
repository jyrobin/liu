#!/usr/bin/env bash
set -euo pipefail
set -x

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN_ROOT="$ROOT_DIR/examples/domain"
WORKSPACE="$ROOT_DIR/examples/workspace"
SCRIPT="$ROOT_DIR/tests/scripts/repl_wait_sum.txt"

mkdir -p "$WORKSPACE"
mkdir -p "$ROOT_DIR/tests/scripts"
cat > "$SCRIPT" << 'EOF'
# REPL script to test pause/resume/continue
run-plan wait_sum --run-id wait2 --backend file --force
resume wait2 {"value":5}
continue-plan wait_sum --run-id wait2 --backend file
exit
EOF

OUT=$(node "$ROOT_DIR/bin/liu.js" --domain-root "$DOMAIN_ROOT" repl --workspace "$WORKSPACE" --script "$SCRIPT")
echo "$OUT"
echo "$OUT" | grep '"status": "paused"' >/dev/null || { echo "Expected paused status"; exit 1; }
echo "$OUT" | grep '"ok": true' >/dev/null || { echo "Expected resume ok"; exit 1; }
echo "$OUT" | grep '"sum": 8' >/dev/null || { echo "Expected sum 8"; exit 1; }

echo "OK"
