#!/usr/bin/env bash
# Require a title and the token estimate promised by logs/README.md.

set -euo pipefail

PATH_TO_LOG="${1:-}"
if [[ -z "$PATH_TO_LOG" ]]; then
  echo "lint-log: PATH required" >&2
  exit 1
fi
if [[ ! -f "$PATH_TO_LOG" ]]; then
  echo "lint-log: file not found: $PATH_TO_LOG" >&2
  exit 1
fi
if ! grep -Eq '^#[[:space:]]+[^[:space:]]' "$PATH_TO_LOG"; then
  echo "lint-log: $PATH_TO_LOG must contain an H1" >&2
  exit 1
fi
if ! grep -Eq 'Tokens used:[[:space:]]*[^[:space:]]' "$PATH_TO_LOG"; then
  echo "lint-log: $PATH_TO_LOG must contain a non-empty 'Tokens used:' line" >&2
  exit 1
fi

echo "lint-log: OK"
