#!/usr/bin/env bash
#
# nav-breaks — break the nav six ways in a scratch tree, and prove nav-agrees.js
# goes red for each.
#
# The case list is Ember's, written down BEFORE the tool was built rather than
# after it. That ordering is the whole point of this file. Day 28's fourth
# sabotage recipe passed against a real hole, and it passed because the recipes
# were written after the tool, by the hand that had just decided what the tool
# would look at — so the list inherited the tool's blind spots the way a test
# drawn from a bug report inherits the finder's route.
#
# Case 2 is the one that earned its place: it defeated the design it was written
# against. A link whose text says `letters` and whose href resolves cleanly onto
# `diary/index.html` passes *which room does this name* and passes *does it
# resolve*, and sends a reader to the wrong room. Both of the first two
# questions interrogate the href; neither ever looks at what the link says it
# is. Question 3 exists because of this case.
#
# Every case asserts its own sabotage landed (Day 5 — a test that cannot break
# always passes) AND that the fixture it needs was actually built (Day 17 — a
# suite that watches its own breaking and not its own building is watching one
# end of itself). Both, because this house has been bitten by each separately.
#
# Nothing here touches the real tree. The tower is copied into a `mktemp -d` and
# the copy's bytes are checked after every run: `nav-agrees.js` is a read tool,
# and a read tool that writes is a different tool (Day 10).
#
# Usage: ./tools/nav-breaks.sh [tree-to-test]   (default: this tower)

set -u -o pipefail

SUBJECT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
PASS=0
FAIL=0

ok()  { printf 'ok    %s\n' "$1"; PASS=$((PASS + 1)); }
bad() { printf 'FAIL  %s\n' "$1"; FAIL=$((FAIL + 1)); }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# A fresh copy of the tower, per case. Cheap, and it means no case can be
# standing in the wreckage of the one before it.
fresh_tree() {
  local dest="$1"
  rm -rf "$dest"
  mkdir -p "$dest"
  tar -cf - -C "$SUBJECT" \
    --exclude=.git --exclude=node_modules --exclude=previews --exclude=archive . \
    | (cd "$dest" && tar -xf -)
}

# Run the tool in a tree and report exit code + output, having first taken the
# tree's fingerprint so we can prove the tool did not write to it.
run_in() {
  local tree="$1"
  BEFORE="$(cd "$tree" && find . -type f -exec cksum {} + | sort)"
  OUT="$(cd "$tree" && node tools/nav-agrees.js 2>&1)"
  CODE=$?
  AFTER="$(cd "$tree" && find . -type f -exec cksum {} + | sort)"
  if [[ "$BEFORE" != "$AFTER" ]]; then
    bad "the tool wrote to the tree — a read tool that writes is a different tool"
  fi
}

echo "nav-breaks: subject $SUBJECT"
echo

# ── The good path, first, because every case below means nothing without it ───

T="$WORK/clean"; fresh_tree "$T"
run_in "$T"
if [[ $CODE -eq 0 ]] && grep -q 'AGREES' <<<"$OUT"; then
  ok "the pristine tower agrees, exit 0"
else
  bad "the pristine tower does not agree (exit $CODE) — every case below is unreadable"
  printf '%s\n' "$OUT" | sed 's/^/      /'
fi

# The claimed exception must be PRINTED, not merely honoured. An exemption
# nobody can see is a skip with better manners.
if grep -q '404.html — UNNAVED, claimed' <<<"$OUT"; then
  ok "the claimed exception for 404.html is printed with its reason"
else
  bad "the claimed exception is not printed — a silent exemption is a skip"
fi

# ── Case 1 — one ../ too many, with the room name unchanged ───────────────────
# Ember's first, and the reason question 2 exists. Taking the last path segment
# still says `letters`; only resolving the href catches it.

T="$WORK/dotdot"; fresh_tree "$T"
perl -0pi -e 's{href="\.\./letters/"}{href="../../letters/"}' "$T/reckoning/index.html"
if cmp -s "$SUBJECT/reckoning/index.html" "$T/reckoning/index.html"; then
  bad "case 1 sabotage did NOT land"
else
  run_in "$T"
  if [[ $CODE -eq 1 ]] && grep -q 'resolves outside the tower' <<<"$OUT"; then
    ok "one ../ too many is caught, and named as walking off the top of the tree"
  else
    bad "one ../ too many was not caught (exit $CODE)"
    printf '%s\n' "$OUT" | sed 's/^/      /'
  fi
fi

# ── Case 2 — the swapped label. The case that defeated the design ─────────────
# Two adjacent entries keep their hrefs and trade their words. Every href still
# resolves; every room is still named; a reader clicking `letters` lands in the
# diary.

T="$WORK/swap"; fresh_tree "$T"
perl -0pi -e 's{(<a href="\.\./diary/">)diary(</a>\s*\n\s*<a href="\.\./letters/">)letters(</a>)}{$1letters$2diary$3}' \
  "$T/ember/index.html"
if cmp -s "$SUBJECT/ember/index.html" "$T/ember/index.html"; then
  bad "case 2 sabotage did NOT land — the swap did not happen, so the case below proves nothing"
else
  run_in "$T"
  if [[ $CODE -eq 1 ]] && grep -q 'calls the room "diary" "letters"' <<<"$OUT"; then
    ok "two labels traded across two good hrefs is caught by the room's own name for itself"
  else
    bad "the swapped label was NOT caught (exit $CODE) — questions 1 and 2 both pass it"
    printf '%s\n' "$OUT" | sed 's/^/      /'
  fi
fi

# ── Case 3 — a page loses its nav and is not a claimed exception ──────────────
# The empty-domain fault, aimed at this tool. A checker that simply skips pages
# without a nav goes quiet here, and quiet reads as clean.

T="$WORK/unnaved"; fresh_tree "$T"
perl -0pi -e 's{<nav\b[\s\S]*?</nav>}{}' "$T/diary/index.html"
if cmp -s "$SUBJECT/diary/index.html" "$T/diary/index.html"; then
  bad "case 3 sabotage did NOT land"
else
  run_in "$T"
  if [[ $CODE -eq 1 ]] && grep -q 'carries no nav, and is not a claimed exception' <<<"$OUT"; then
    ok "a page that loses its nav is convicted, not skipped"
  else
    bad "a page with no nav was skipped (exit $CODE) — the empty domain again"
    printf '%s\n' "$OUT" | sed 's/^/      /'
  fi
fi

# ── Case 4 — the exemption's own reason stops holding ─────────────────────────
# Ember's counter-check. 404.html is exempt because it cannot carry a nav. Give
# it one and the exemption is excusing something that is no longer true — so the
# exemption itself must go red, rather than go on quietly granting itself.

T="$WORK/claimstale"; fresh_tree "$T"
perl -0pi -e 's{<main>}{<nav aria-label="tower navigation"></nav>\n  <main>}' "$T/404.html"
if ! grep -q '<nav' "$T/404.html"; then
  bad "case 4 sabotage did NOT land — 404.html has no nav, so the counter-check is untested"
else
  run_in "$T"
  if [[ $CODE -eq 1 ]] && grep -q 'claimed exception for 404.html no longer holds' <<<"$OUT"; then
    ok "an exemption whose reason has stopped holding convicts itself"
  else
    bad "the stale exemption went on excusing (exit $CODE) — the list has no counter-check"
    printf '%s\n' "$OUT" | sed 's/^/      /'
  fi
fi

# ── Case 5 — the manifest names a room nobody built ───────────────────────────
# Ember's fourth. A tool that only diffs the navs *against* views.json reports
# perfect agreement while the manifest names a room that does not exist.

T="$WORK/ghost"; fresh_tree "$T"
node -e '
  const fs = require("fs");
  const file = process.argv[1];
  const views = JSON.parse(fs.readFileSync(file, "utf8"));
  views.push({ name: "attic", url_path: "attic/" });
  fs.writeFileSync(file, JSON.stringify(views, null, 2) + "\n");
' "$T/scripts/views.json"
if ! grep -q 'attic' "$T/scripts/views.json"; then
  bad "case 5 fixture was NOT built — views.json does not name the ghost room"
else
  run_in "$T"
  if [[ $CODE -eq 1 ]] && grep -q 'the manifest names the room "attic"' <<<"$OUT"; then
    ok "a manifest naming a room nobody built is caught"
  else
    bad "the ghost room in the manifest was not caught (exit $CODE)"
    printf '%s\n' "$OUT" | sed 's/^/      /'
  fi
fi

# ── Case 6 — a room stops naming itself, so its labels lose their witness ─────
# Not a fault: a verdict on the evidence. Take the front door's self-marker away
# and the four pages calling it `tower` have nothing to be held against. The
# tool must SAY so — and must not convict anybody for it.
#
# This case is also the lock on the front door's span: a later hand deleting it
# as clutter fails here rather than quietly retiring question 3 for one room.

T="$WORK/unwitnessed"; fresh_tree "$T"
perl -0pi -e 's{<span class="nav-here" aria-current="page">tower</span>\s*\n}{}' "$T/index.html"
if cmp -s "$SUBJECT/index.html" "$T/index.html"; then
  bad "case 6 sabotage did NOT land"
else
  run_in "$T"
  if grep -q 'UNWITNESSED' <<<"$OUT"; then
    ok "a room that does not name itself leaves its labels UNWITNESSED, and the tool says so"
  else
    bad "the tool went silent about labels it had no witness for (exit $CODE)"
    printf '%s\n' "$OUT" | sed 's/^/      /'
  fi
  if [[ $CODE -eq 0 ]]; then
    ok "UNWITNESSED is a verdict on the evidence — nobody is convicted for it"
  else
    bad "UNWITNESSED convicted somebody (exit $CODE) — that is a verdict on the link, not the evidence"
  fi
fi

# ── Case 7 — the fault the tool was built for: a room added to five navs, and
#             one of them forgotten ───────────────────────────────────────────

T="$WORK/forgot"; fresh_tree "$T"
perl -0pi -e 's{\s*<a href="\.\./ember/">ember</a>}{}' "$T/letters/index.html"
if cmp -s "$SUBJECT/letters/index.html" "$T/letters/index.html"; then
  bad "case 7 sabotage did NOT land"
else
  run_in "$T"
  if [[ $CODE -eq 1 ]] && grep -q 'names no way to the room "ember"' <<<"$OUT"; then
    ok "four of the five edits made, and the fifth is named"
  else
    bad "a forgotten nav edit was not caught (exit $CODE) — this is the fault the tool exists for"
    printf '%s\n' "$OUT" | sed 's/^/      /'
  fi
fi

# ── Case 9 — a room somebody built, and the manifest silent about it ──────────
# Day 30, and the fault the fifth question exists for. A real sixth room with a
# correct nav — every existing room linked, itself marked current — and the one
# edit a keeper forgets: the line in views.json.
#
# Against the pre-Day-30 tool this printed `AGREES — 7 pages, 5 rooms` and
# exited 0. The two numbers that convict it were on the line, and nothing read
# one against the other. The cost is not a broken link: views.json is the
# camera's file, so an unlisted room is never photographed and never reaches
# previews/, which is the keeper's only sight of this tower.

T="$WORK/unlisted"; fresh_tree "$T"
mkdir -p "$T/ash"
perl -0pe '
  s{    <a href="\./" aria-current="page">ember</a>\n}
   {    <a href="../ember/">ember</a>\n    <a href="./" aria-current="page">ash</a>\n};
  s{href="ember\.css"}{href="../ember/ember.css"};
' "$T/ember/index.html" > "$T/ash/index.html"
if ! grep -q 'aria-current="page">ash<' "$T/ash/index.html" \
  || ! grep -q 'href="../ember/">ember<' "$T/ash/index.html"; then
  bad "case 9 fixture was NOT built — ash/index.html has no honest nav, so the case below proves nothing"
elif grep -q 'ash' "$T/scripts/views.json"; then
  bad "case 9 fixture is wrong — the manifest already names the room, which is the thing being withheld"
else
  run_in "$T"
  if [[ $CODE -eq 1 ]] && grep -q 'ash/index.html carries a nav' <<<"$OUT" \
    && grep -q 'views.json does not name it' <<<"$OUT"; then
    ok "a room the manifest does not name is caught, and the camera is named as the cost"
  else
    bad "an unlisted room was not caught (exit $CODE) — the manifest is asked in one direction only"
    printf '%s\n' "$OUT" | sed 's/^/      /'
  fi
fi

# ── Case 10 — the hole the fifth question opens, and who actually closes it ───
# A page with a nav is claiming to be a room, so a room that forgets its nav
# makes no claim and question 5 cannot see it. The keeper expected questions 4
# and 5 to interlock. They do not: what convicts this page is QUESTION 3, which
# was written on Day 29 for a page that *loses* its nav, not one that never had
# one.
#
# Right verdict, wrong owner — so this case is not here to prove the tool works.
# It is here so that a later hand narrowing question 3 to lost navs finds out
# that it is load-bearing for question 5's blind spot, instead of taking the
# floor out with nothing going red.

T="$WORK/navless"; fresh_tree "$T"
mkdir -p "$T/ash"
printf '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>ash</title></head>\n<body><main><h1>ash</h1><p>a room built with neither half.</p></main></body></html>\n' \
  > "$T/ash/index.html"
if grep -qi '<nav' "$T/ash/index.html" || grep -q 'ash' "$T/scripts/views.json"; then
  bad "case 10 fixture was NOT built — the page must have neither a nav nor a manifest row"
else
  run_in "$T"
  if [[ $CODE -eq 1 ]] && grep -q 'ash/index.html carries no nav, and is not a claimed exception' <<<"$OUT"; then
    ok "a room with neither a nav nor a manifest row is convicted — by question 3, not by question 5"
  else
    bad "a room with neither half went unconvicted (exit $CODE) — question 3 no longer closes question 5's hole"
    printf '%s\n' "$OUT" | sed 's/^/      /'
  fi
  # The verdict alone would score a tool green for the wrong reason (Day 29's
  # own finding). Assert what the check is actually checking: this page must be
  # convicted for having no nav, and must NOT be convicted for the manifest —
  # it never claimed to be a room.
  if grep -q 'ash/index.html carries a nav' <<<"$OUT"; then
    bad "question 5 convicted a page that never claimed to be a room"
  else
    ok "question 5 says nothing about a page with no nav — the claim is the nav"
  fi
fi

# ── Case 8 — a mistyped flag must not spend exit 1 ────────────────────────────
# Exit 1 means *the navs disagree* and nothing else (Day 13).

T="$WORK/args"; fresh_tree "$T"
OUT="$(cd "$T" && node tools/nav-agrees.js --nonsense 2>&1)"; CODE=$?
if [[ $CODE -eq 2 ]] && grep -q 'INVALID' <<<"$OUT"; then
  ok "an unknown flag is refused with INVALID and exit 2, never exit 1"
else
  bad "an unknown flag got exit $CODE — exit 1 is spoken for"
fi

OUT="$(cd "$T" && node tools/nav-agrees.js --help 2>&1)"; CODE=$?
if [[ $CODE -eq 0 ]] && grep -q 'usage' <<<"$OUT"; then
  ok "--help prints the surface and exits 0"
else
  bad "--help did not print the surface (exit $CODE)"
fi

echo
echo "nav-breaks: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]] || exit 1
