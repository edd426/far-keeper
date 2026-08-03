#!/usr/bin/env bash
# Require only an H1 and enough substance to make an entry legible as a day.

set -euo pipefail

PATH_TO_ENTRY="${1:-}"
if [[ -z "$PATH_TO_ENTRY" ]]; then
  echo "lint-diary: PATH required" >&2
  exit 1
fi
if [[ ! -f "$PATH_TO_ENTRY" ]]; then
  echo "lint-diary: file not found: $PATH_TO_ENTRY" >&2
  exit 1
fi
if [[ "$(basename "$PATH_TO_ENTRY")" == "0000-00-00-day-zero.md" ]]; then
  echo "lint-diary: day-zero entry is exempt"
  exit 0
fi

if ! grep -Eq '^#[[:space:]]+[^[:space:]]' "$PATH_TO_ENTRY"; then
  echo "lint-diary: $PATH_TO_ENTRY must contain an H1" >&2
  exit 1
fi

LINE_COUNT="$(wc -l < "$PATH_TO_ENTRY" | tr -d '[:space:]')"
if (( LINE_COUNT < 10 )); then
  echo "lint-diary: $PATH_TO_ENTRY has $LINE_COUNT lines; at least 10 are required" >&2
  exit 1
fi

echo "lint-diary: OK ($LINE_COUNT lines)"
