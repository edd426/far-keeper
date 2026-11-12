#!/usr/bin/env bash
# tools/board-breaks.sh -- break board.js in a scratch tree.
#   ./tools/board-breaks.sh [tree-to-test]   (default: this tower)
# The first case was written first, from messages/done/2026-08-08-*: Evan's own
# section after "Acceptance criteria" is part of the ask, so an unanswered note
# in that shape must read UNANSWERED. It was red against the heading-word rule.
set -u
SRC="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/tools" "$T/messages/open"
cp "$SRC/tools/board.js" "$T/tools/"
SHAPE="$SRC/messages/done/2026-08-08-a-sighting-carried-in-from-outside.md"
[ -f "$SHAPE" ] || { echo "UNCLEAR: no shape file"; exit 2; }
fail=0
run() { node "$T/tools/board.js"; }
# unanswered: ask only, cut at the line before the first house completion note
n=$(grep -n '^## Completion notes' "$SHAPE" | head -1 | cut -d: -f1)
[ -n "$n" ] || { echo "UNCLEAR: shape has no completion heading"; exit 2; }
head -n $((n-1)) "$SHAPE" > "$T/messages/open/a.md"
# the domain must hold: the fixture really has a post-criteria Evan-signed section
grep -q '^— Evan' "$T/messages/open/a.md" || { echo "UNCLEAR: fixture lacks Evan signature"; exit 2; }
check() { # name needle
  out=$(run); if grep -q "$2" <<<"$out"; then echo "ok   $1"; else echo "RED  $1: wanted $2, got: $out"; fail=1; fi
}
check "ask-only note reads UNANSWERED" '^UNANSWERED'
# house answers
cp "$SHAPE" "$T/messages/open/a.md"
check "house completion reads HOUSE LAST" '^HOUSE LAST'
# founder answers after the house
printf '\n## Founder'"'"'s reply\n\nThanks.\n\n— Evan\n' >> "$T/messages/open/a.md"
check "founder reply reads FOUNDER LAST" '^FOUNDER LAST'
# a founder reply whose heading lacks the word Founder
cp "$SHAPE" "$T/messages/open/a.md"
printf '\n## Notes on it\n\nThanks.\n\n— Evan\n' >> "$T/messages/open/a.md"
check "founder signature without the word in the heading" '^FOUNDER LAST'
# a blockquoted signature is a quote, not a signer
printf '## Request\n\nx\n\n— Evan\n\n## Acceptance criteria\n\n- y\n\n## Keeper'"'"'s notes\n\n> — Evan\n\ntext\n' > "$T/messages/open/a.md"
check "quoted signature does not make the founder the signer" '^HOUSE LAST'
exit $fail
