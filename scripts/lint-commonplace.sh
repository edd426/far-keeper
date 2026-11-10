#!/usr/bin/env bash
# Enforce the charter's cap on the commonplace book (Article III).
#
# Ten thousand words while the book is the whole kept memory. Two thousand
# once the memory trial has begun, which is the day a commonplace/ directory
# exists: from then the book is the index and the pages hold the rest
# (founder's amendment, 2026-11-10). The pages themselves have no cap.

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

PATH_TO_BOOK="${1:-COMMONPLACE.md}"
if [[ ! -f "$PATH_TO_BOOK" ]]; then
  echo "lint-commonplace: missing $PATH_TO_BOOK" >&2
  exit 1
fi

LIMIT=10000
if [[ -d commonplace ]]; then
  LIMIT=2000
fi

WORD_COUNT="$(wc -w < "$PATH_TO_BOOK" | tr -d '[:space:]')"
echo "lint-commonplace: $WORD_COUNT words (limit $LIMIT)"
if (( WORD_COUNT > LIMIT )); then
  echo "lint-commonplace: $PATH_TO_BOOK exceeds the $LIMIT-word limit" >&2
  exit 1
fi

echo "lint-commonplace: OK"
