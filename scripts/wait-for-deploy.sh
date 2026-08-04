#!/usr/bin/env bash
# Poll origin/main until the screenshot bot records this commit's home preview.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

DEPLOY_REF="${1:-HEAD}"
if DEPLOY_SHA="$(git rev-parse --short "$DEPLOY_REF" 2>/dev/null)"; then
  :
else
  DEPLOY_SHA="${DEPLOY_REF:0:7}"
fi
DATE_TAG="$(date -u +%Y-%m-%d)"
PREVIEW_PATH="previews/${DATE_TAG}-${DEPLOY_SHA}.png"
# This poll spans BOTH CI jobs: deploy (~1-2 min) and then screenshot, which
# only starts after deploy finishes and sleeps 25s for Pages to settle. At the
# old 300s the healthy Day 1 run finished with ~60s to spare — a margin thin
# enough that a normal run reads as a failure. 600s gives the honest wall time
# room. The keeper is not idle meanwhile; the runbook has it drafting the diary.
TIMEOUT_SECONDS="${WAIT_FOR_DEPLOY_TIMEOUT:-600}"
DEADLINE=$(( $(date +%s) + TIMEOUT_SECONDS ))
POLL_INTERVAL=20

echo "wait-for-deploy: waiting for $PREVIEW_PATH on origin/main"
echo "wait-for-deploy: deadline in $(( TIMEOUT_SECONDS / 60 )) minutes; polling every ${POLL_INTERVAL}s"

while [[ $(date +%s) -lt $DEADLINE ]]; do
  if ! git fetch origin main --quiet 2>/dev/null; then
    echo "wait-for-deploy: git fetch failed (network or auth issue)" >&2
    exit 2
  fi

  if git ls-tree origin/main "$PREVIEW_PATH" 2>/dev/null | grep -q .; then
    AUTHOR="$(git log -1 --format='%an' origin/main -- "$PREVIEW_PATH")"
    SUBJECT="$(git log -1 --format='%s' origin/main -- "$PREVIEW_PATH")"
    if [[ "$AUTHOR" == "github-actions[bot]" && "$SUBJECT" == "ci: deploy preview for ${DEPLOY_SHA}" ]]; then
      echo "wait-for-deploy: bot preview found in origin/main"
      git pull --rebase --autostash origin main >/dev/null 2>&1 || {
        echo "wait-for-deploy: pull failed; local changes may conflict" >&2
        exit 2
      }
      echo "wait-for-deploy: OK"
      exit 0
    fi
  fi

  REMAINING=$(( DEADLINE - $(date +%s) ))
  echo "wait-for-deploy: not yet; ${REMAINING}s remaining"
  sleep "$POLL_INTERVAL"
done

echo "wait-for-deploy: TIMEOUT after $(( TIMEOUT_SECONDS / 60 )) minutes; preview never appeared" >&2
echo "wait-for-deploy: check https://github.com/edd426/far-keeper/actions" >&2
exit 1
