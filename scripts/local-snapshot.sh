#!/usr/bin/env bash
# scripts/local-snapshot.sh [/tmp/test.js | tools/test.js]
# Render the working tree in Chromium, or run a temporary Playwright test.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

TEST_SCRIPT="${1:-}"
DEFAULT_OUTPUT="/tmp/tower-snap.png"
CHROMIUM_BIN=""
PW_BROWSERS_DIR=""
export FAR_KEEPER_CHROMIUM_PATH=""

find_chromium() {
  local root="$1"
  local found=""
  [[ -d "$root" ]] || return 1
  found="$(find "$root" -name 'headless_shell' -type f -print -quit 2>/dev/null)"
  [[ -n "$found" ]] || found="$(find "$root" -name 'chrome-headless-shell' -type f -print -quit 2>/dev/null)"
  [[ -n "$found" ]] || found="$(find "$root" -path '*Chromium.app/Contents/MacOS/Chromium' -type f -print -quit 2>/dev/null)"
  [[ -n "$found" ]] || found="$(find "$root" -name 'chrome' -type f -print -quit 2>/dev/null)"
  [[ -n "$found" ]] || return 1
  CHROMIUM_BIN="$found"
  PW_BROWSERS_DIR="$root"
}

for candidate in \
  /opt/pw-browsers \
  "${HOME}/.cache/ms-playwright" \
  "${HOME}/Library/Caches/ms-playwright"; do
  if find_chromium "$candidate"; then
    break
  fi
done

if [[ -n "$CHROMIUM_BIN" ]]; then
  export PLAYWRIGHT_BROWSERS_PATH="$PW_BROWSERS_DIR"
  export FAR_KEEPER_CHROMIUM_PATH="$CHROMIUM_BIN"
  echo "snapshot: using pre-staged Chromium at $CHROMIUM_BIN"
else
  echo "snapshot: no pre-staged Chromium found"
fi

if [[ ! -d node_modules/playwright ]]; then
  echo "snapshot: installing Playwright package without browser scripts"
  npm ci --ignore-scripts
fi

if ! npx playwright --version >/dev/null 2>&1; then
  echo "snapshot: Playwright is unavailable after npm ci" >&2
  exit 1
fi

if [[ -z "$CHROMIUM_BIN" ]]; then
  echo "snapshot: attempting a Chromium install"
  if ! npx playwright install chromium; then
    echo "snapshot: no Chromium is available and installation failed" >&2
    exit 5
  fi
  for candidate in \
    "${HOME}/.cache/ms-playwright" \
    "${HOME}/Library/Caches/ms-playwright"; do
    if find_chromium "$candidate"; then
      export PLAYWRIGHT_BROWSERS_PATH="$PW_BROWSERS_DIR"
      export FAR_KEEPER_CHROMIUM_PATH="$CHROMIUM_BIN"
      break
    fi
  done
  if [[ -z "$CHROMIUM_BIN" ]]; then
    echo "snapshot: Chromium installed but its executable could not be located" >&2
    exit 5
  fi
fi

./scripts/build.sh >/dev/null

PORT="$(python3 <<'PY'
import socket

for port in range(8765, 8771):
    with socket.socket() as probe:
        try:
            probe.bind(("127.0.0.1", port))
        except OSError:
            continue
    print(port)
    break
PY
)"
if [[ -z "$PORT" ]]; then
  echo "snapshot: no free port in 8765-8770" >&2
  exit 2
fi

python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER_PID=$!
cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done
if ! curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
  echo "snapshot: local server did not start on port $PORT" >&2
  exit 3
fi

mkdir -p /tmp/tower-snaps
export FAR_KEEPER_URL="http://127.0.0.1:${PORT}/"
export FAR_KEEPER_OUTDIR="/tmp/tower-snaps"
export NODE_PATH="${REPO_ROOT}/node_modules${NODE_PATH:+:${NODE_PATH}}"

if [[ -n "$TEST_SCRIPT" ]]; then
  if [[ ( "$TEST_SCRIPT" != /tmp/*.js && "$TEST_SCRIPT" != tools/*.js ) || ! -f "$TEST_SCRIPT" ]]; then
    echo "snapshot: optional test must be an existing /tmp/*.js or tools/*.js file" >&2
    exit 4
  fi
  echo "snapshot: running $TEST_SCRIPT"
  node "$TEST_SCRIPT"
else
  echo "snapshot: capturing $DEFAULT_OUTPUT"
  node scripts/screenshot.js "$FAR_KEEPER_URL" "$DEFAULT_OUTPUT"
fi

echo "snapshot: done"
