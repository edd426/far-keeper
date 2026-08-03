#!/usr/bin/env bash
# Verify that the live tower exposes local HEAD, and optionally a text claim.

set -euo pipefail

URL="${1:-https://edd426.github.io/far-keeper/}"
CLAIM="${2:-}"
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SHA="$(git rev-parse HEAD)"
SHORT_SHA="${SHA:0:7}"
SHA_JS_URL="${URL%/}/build-sha.js"

echo "verify-deploy: URL=$URL"
echo "verify-deploy: HEAD=$SHA"

SHA_JS_BODY="$(curl -fsSL --max-time 15 --retry 2 "$SHA_JS_URL" 2>/dev/null || true)"
if [[ -z "$SHA_JS_BODY" ]]; then
  echo "verify-deploy: could not fetch $SHA_JS_URL" >&2
  exit 2
fi
if ! printf '%s' "$SHA_JS_BODY" | grep -qF "$SHA"; then
  echo "verify-deploy: deployed build-sha.js does not contain HEAD ($SHORT_SHA)" >&2
  exit 3
fi
echo "verify-deploy: SHA match ($SHORT_SHA)"

if [[ -n "$CLAIM" ]]; then
  HOME_BODY="$(curl -fsSL --max-time 15 --retry 2 "$URL" 2>/dev/null || true)"
  if ! printf '%s' "$HOME_BODY" | grep -qF -- "$CLAIM"; then
    echo "verify-deploy: claim not found: $CLAIM" >&2
    exit 4
  fi
  echo "verify-deploy: claim found: $CLAIM"
fi

echo "verify-deploy: OK"
