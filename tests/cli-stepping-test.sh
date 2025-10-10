#!/usr/bin/env bash
set -euo pipefail
set -x

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN_ROOT="$ROOT_DIR/examples/domain"
WORKSPACE="$ROOT_DIR/examples/workspace"

mkdir -p "$WORKSPACE"

# 1) Run plan that pauses
echo "Running initial (should pause)..."
OUT=$(node "$ROOT_DIR/bin/liu.js" --domain-root "$DOMAIN_ROOT" run-plan wait_sum --workspace "$WORKSPACE" --run-id wait1 --backend file --force || true)
echo "$OUT"
echo "$OUT" | grep '"status": "paused"' >/dev/null || { echo "Expected paused status"; exit 1; }

# 2) Resume with a payload
echo "Resuming with payload {\"value\":7}..."
node "$ROOT_DIR/bin/liu.js" resume --workspace "$WORKSPACE" --run-id wait1 --payload '{"value":7}' >/dev/null

# 3) Continue plan (should complete)
echo "Continuing (should complete sum=10)..."
OUT2=$(node "$ROOT_DIR/bin/liu.js" --domain-root "$DOMAIN_ROOT" continue-plan wait_sum --workspace "$WORKSPACE" --run-id wait1 --backend file)
echo "$OUT2"
echo "$OUT2" | grep '"sum": 10' >/dev/null || { echo "Expected sum 10"; exit 1; }

echo "OK"
