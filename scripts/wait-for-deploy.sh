#!/usr/bin/env bash
# Poll the previews branch until the screenshot bot records this commit's home
# preview. Since 2026-10-03 CI force-pushes each deploy's pictures to a
# single-commit `previews` branch instead of committing them to main.
#
# The fetch names its refspec in full and takes no --depth: the keeper's
# sandbox may clone single-branch, and --depth on an unshallowed repo would
# write .git/shallow and make check-sight.sh think the clone is shallow again.
# The branch is one commit, so a full fetch of it costs one set of pictures.

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

echo "wait-for-deploy: waiting for $PREVIEW_PATH on origin/previews"
echo "wait-for-deploy: deadline in $(( TIMEOUT_SECONDS / 60 )) minutes; polling every ${POLL_INTERVAL}s"

while [[ $(date +%s) -lt $DEADLINE ]]; do
  # A missing branch is a not-yet, not a failure: before the first deploy
  # under the new workflow there is no previews branch at all.
  if ! git ls-remote --exit-code --heads origin previews >/dev/null 2>&1; then
    if ! git ls-remote origin >/dev/null 2>&1; then
      echo "wait-for-deploy: cannot reach origin (network or auth issue)" >&2
      exit 2
    fi
  elif ! git fetch --quiet origin '+refs/heads/previews:refs/remotes/origin/previews' 2>/dev/null; then
    echo "wait-for-deploy: git fetch failed (network or auth issue)" >&2
    exit 2
  fi

  # Captured, not piped into grep -q: see check-sight.sh (Day 27) for why a
  # pipefail pipeline with an early-exiting reader is not to be trusted.
  ENTRY="$(git ls-tree origin/previews "$PREVIEW_PATH" 2>/dev/null || true)"
  if [[ -n "$ENTRY" ]]; then
    AUTHOR="$(git log -1 --format='%an' origin/previews)"
    SUBJECT="$(git log -1 --format='%s' origin/previews)"
    if [[ "$AUTHOR" == "github-actions[bot]" && "$SUBJECT" == "ci: deploy preview for ${DEPLOY_SHA}" ]]; then
      echo "wait-for-deploy: bot preview found in origin/previews"
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
