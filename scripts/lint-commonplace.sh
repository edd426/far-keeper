#!/usr/bin/env bash
# Enforce the charter's ten-thousand-word cap.

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

PATH_TO_BOOK="${1:-COMMONPLACE.md}"
if [[ ! -f "$PATH_TO_BOOK" ]]; then
  echo "lint-commonplace: missing $PATH_TO_BOOK" >&2
  exit 1
fi

WORD_COUNT="$(wc -w < "$PATH_TO_BOOK" | tr -d '[:space:]')"
echo "lint-commonplace: $WORD_COUNT words"
if (( WORD_COUNT > 10000 )); then
  echo "lint-commonplace: $PATH_TO_BOOK exceeds the 10000-word limit" >&2
  exit 1
fi

echo "lint-commonplace: OK"
