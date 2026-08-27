#!/usr/bin/env bash
# tools/move-rehearsal.sh — stand the whole test battery in a tower that is
# not standing here, and report which suites stop working.
#
#   ./tools/move-rehearsal.sh            rehearse the working tree
#   ./tools/move-rehearsal.sh /some/tree rehearse another copy of the tower
#
# **The fault it was built on.** This tower moves on Sundays. Day 23 found
# that `tools/standing-page.js` — a suite whose whole purpose is catching a
# hand-typed city — named Paris at six of its own lines, so it would have
# gone red on the first honest morning after a move, about a tower that was
# right. That one file was repaired and the question was never asked of the
# other twenty. Asked here, on Day 24, two days before the move: **four of
# the ten shell suites did not survive it.**
#
# **Why a grep would not have done.** A grep finds the word. Three of the
# four faults name Paris and a grep finds those; `place-audit.sh`'s does
# not — its expectation was pinned to the word *was*, which `reckon.js`
# writes when exactly one row is convicted and drops for *were* when many
# are, so it held only while every row in the ledger stood where the tower
# stands. Nothing in that line says Paris. **An assumption about where you
# are does not have to name the place.** Only running it somewhere else
# finds it.
#
# **The control run is the load-bearing half, and it is here because this
# tool's first run misled its own author.** That run had no control and
# copied the tower without `.git`; `shelf-when-breaks.sh` resolves its own
# root through git, could not find it, and reported eight failures. All
# eight were the copy's, and they were about to be written up as the
# tower's. So every suite is run twice — once in a copy standing where the
# tower stands, once in a copy moved — and a suite red in *both* is the
# rehearsal's own fault and says so. A rehearsal that cannot tell its
# fixture's failures from its subject's is Day 19's unreadable-failure
# fault wearing a new coat.
#
# **And the control costs something, said here because it is not obvious
# and was measured rather than argued.** Both copies get their `STANDING`
# rewritten — the control's to the place it already stands — so that the two
# differ in one thing only. That cures a false diagnosis: `check-sight.sh`
# reads the working tree and grades an edited page STALE, so under an
# asymmetric control it went red in the moved copy alone and was reported as
# move-fragile, which it is not. What it costs: a suite whose fixture-needle
# names the old city breaks in *both* copies, so it lands on BLIND rather
# than FAIL. Pointed at the pre-fix suites this file scores **2 fragile and
# 4 blind**; pointed at the repaired ones, **0 and 1**. The verdict moves, so
# the check can break — but three real faults arrive as abstentions.
# **A control made to resemble the thing it controls for goes blind to
# whatever lives in the resemblance.** So: BLIND is not an all-clear. It
# exits non-zero and it means go and look.
#
# **The far place is chosen at the moment it runs** (the discipline is
# `standing-clock.sh`'s, Day 19). A hardcoded far zone agrees with the
# standing place about the calendar date for most of the day, so most
# mornings the rehearsal would pass without having tested the thing it is
# for, and would never say which kind of pass it was. This file searches
# for a zone that genuinely disagrees *now*, and refuses to conclude
# anything if it cannot find one.
#
# **The case list is the directory** (Day 23). It does not hold a list of
# suites to check; it globs `tools/*.sh`, minus itself. A sweep that
# enumerates what to look at cannot see what it was not told about, and
# reports that as clean.
#
# **What it does NOT cover, said here rather than discovered later.** The
# browser suites — `tools/*.js` run through `scripts/local-snapshot.sh` —
# are not rehearsed, because they need a served tree and a browser and this
# file runs neither. `ledger-place.js` was carrying exactly this fault (four
# Paris-pinned expectations about the real ledger) and was found by hand on
# Day 24, not by this tool. **That is a hole in this rehearsal and the
# honest reading of it is a hole, not a scope.** The last section greps
# those files for the one class of fault a grep can find — a substitution
# needle naming a place — which narrows the hole and does not close it. Say
# both, always: a grep finds the word, and the fault that made this day
# worth having did not have the word in it.
set -u

SRC="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
SELF="$(basename "$0")"
CTL="$(mktemp -d)"
MOV="$(mktemp -d)"
trap 'rm -rf "$CTL" "$MOV"' EXIT

fails=0
blind=0
ok()    { echo "ok    $1"; }
bad()   { echo "FAIL  $1"; fails=$((fails + 1)); }
blind() { echo "BLIND $1"; blind=$((blind + 1)); }
stop()  { echo "FAIL  $1"; echo; echo "move-rehearsal: could not conclude."; exit 2; }

REAL_LEDGER="$SRC/reckoning/ledger.json"
REAL_LEDGER_HASH="$(sha256sum "$REAL_LEDGER" | cut -d' ' -f1)"

# ---- a zone whose today is not the standing place's today ----
read -r NEAR_ZONE NEAR_TODAY FAR_ZONE FAR_TODAY <<EOF
$(node -e '
  const { STANDING, todayAt } = require(process.argv[1] + "/reckoning/reckoning.js");
  const near = todayAt(STANDING.place.zone);
  const candidates = [
    "Pacific/Kiritimati", "Pacific/Auckland", "Asia/Tokyo", "Asia/Kolkata",
    "Europe/London", "Atlantic/Reykjavik", "America/Argentina/Ushuaia",
    "America/Sao_Paulo", "America/New_York", "America/Los_Angeles",
    "Pacific/Honolulu", "Pacific/Midway"
  ];
  for (const zone of candidates) {
    const there = todayAt(zone);
    if (there !== near) {
      console.log([STANDING.place.zone, near, zone, there].join(" "));
      process.exit(0);
    }
  }
  console.log([STANDING.place.zone, near, "NONE", "NONE"].join(" "));
' "$SRC")
EOF

[ "$FAR_ZONE" = "NONE" ] && stop "no zone on the list disagrees with $NEAR_ZONE about the date — nothing was rehearsed"

echo "move-rehearsal: the tower stands at $NEAR_ZONE, which says $NEAR_TODAY."
echo "move-rehearsal: it is rehearsed at $FAR_ZONE, which says $FAR_TODAY."
echo

# ---- two copies of the tower, one of them moved ----
#
# `git clone --local` and not `cp -a`: the object store is hardlinked, so a
# copy costs almost nothing, and the suites that resolve their own root
# through git find one. `previews/` is left out — it is most of a gigabyte
# and no shell suite reads it.
copy_tower() {
  local dest="$1"
  git clone -q --local --no-checkout "$SRC" "$dest" 2>/dev/null || return 1
  git -C "$dest" sparse-checkout set --no-cone '/*' '!/previews' >/dev/null 2>&1 || return 1
  git -C "$dest" checkout -q || return 1
  # The rehearsal is of the tree in front of you, not of HEAD — otherwise a
  # repair made this morning is invisible to the check written to prove it.
  git -C "$SRC" diff HEAD --binary -- . ':(exclude)previews' > "$dest/.rehearsal.patch" 2>/dev/null || true
  if [ -s "$dest/.rehearsal.patch" ]; then
    git -C "$dest" apply "$dest/.rehearsal.patch" || return 1
  fi
  rm -f "$dest/.rehearsal.patch"
  (cd "$SRC" && git ls-files -o --exclude-standard -- . ':(exclude)previews') | while IFS= read -r f; do
    mkdir -p "$dest/$(dirname "$f")" && cp "$SRC/$f" "$dest/$f"
  done
  return 0
}

copy_tower "$CTL" || stop "the control copy could not be built"
copy_tower "$MOV" || stop "the moved copy could not be built"

# The far place is a real place object, held to what `placeProblem()` asks:
# a name, a latitude and longitude on the earth, a zone the clock knows.
# A fixture standing somewhere impossible would rehearse the NOWHERE branch
# by accident.
#
# **Both copies are rewritten, and the control's rewrite keeps it where it
# is.** Otherwise the two copies differ in a second way besides the place:
# one has a dirty `reckoning.js` and the other does not, and a suite that
# reads the working tree's cleanliness — `check-sight.sh` does, and grades
# an edited page STALE — goes red in the moved copy alone and is reported as
# move-fragile. It is not. It is answering correctly about a file this tool
# edited. Rewritten on both sides, it goes red on both sides and lands where
# it belongs: BLIND, this rehearsal learned nothing about it.
rewrite_standing() {
  node -e '
    const fs = require("fs");
    const file = process.argv[1] + "/reckoning/reckoning.js";
    const before = fs.readFileSync(file, "utf8");
    // Anchored at both ends of the field, so it matches whatever expression
    // stands there rather than only an identifier.
    const NEEDLE = /var STANDING = \{\s*place:[\s\S]*?since:/;
    if (!NEEDLE.test(before)) process.exit(1);
    const to = "var STANDING = {\n    place: { name: " + JSON.stringify(process.argv[3])
      + ", latitude: 0, longitude: 0, zone: " + JSON.stringify(process.argv[2]) + " },\n    since:";
    fs.writeFileSync(file, before.replace(NEEDLE, to));
  ' "$1" "$2" "$3"
}

rewrite_standing "$MOV" "$FAR_ZONE" "Rehearsal" \
  || stop "the tower could not be moved — the STANDING literal has changed shape"
rewrite_standing "$CTL" "$NEAR_ZONE" "Control" \
  || stop "the control could not be rewritten — the STANDING literal has changed shape"

# Assert the fixture was built, on both sides (Day 17). A control that was
# accidentally moved, or a moved copy that was not, makes every line below
# mean the opposite of what it says.
node -e '
  const m = require(process.argv[1] + "/reckoning/reckoning.js");
  const c = require(process.argv[2] + "/reckoning/reckoning.js");
  process.exit(m.STANDING.place.zone === process.argv[3] && c.STANDING.place.zone === process.argv[4] ? 0 : 1);
' "$MOV" "$CTL" "$FAR_ZONE" "$NEAR_ZONE" \
  && ok "the fixture: one copy stands at $NEAR_ZONE, the other at $FAR_ZONE" \
  || stop "the fixture was not built — the two copies do not stand where they should"

echo

# ---- every shell suite, in both copies ----
for path in "$SRC"/tools/*.sh; do
  suite="$(basename "$path")"
  [ "$suite" = "$SELF" ] && continue

  (cd "$CTL" && timeout 600 "./tools/$suite" >/dev/null 2>&1); ctl=$?
  (cd "$MOV" && timeout 600 "./tools/$suite" >/dev/null 2>&1); mov=$?

  if [ "$ctl" -ne 0 ]; then
    blind "$suite — red in the control copy too (exit $ctl), so this rehearsal learned nothing about it"
  elif [ "$mov" -ne 0 ]; then
    bad "$suite — green where the tower stands, red where it does not (exit $mov)"
    (cd "$MOV" && timeout 600 "./tools/$suite" 2>&1 | grep '^FAIL' | head -4 | sed 's/^/        /')
  else
    ok "$suite"
  fi
done

echo

# ---- the browser suites, triaged and not rehearsed ----
#
# Ember's narrowing, Day 24, and it is worth having only if both halves of
# what it is are said. Three of the four faults found this morning were
# plain string needles a grep catches in a second; the fourth
# (`place-audit.sh`'s `was`/`were`) needed running, and so did
# `ledger-place.js`'s. So this pass triages the un-swept `tools/*.js` for
# the FINDABLE class of fault and says nothing whatever about the other
# one. **It narrows the hole. It does not close it, and it must never be
# read as having rehearsed anything.** A grep finds the word; an
# assumption about where you are does not have to name the place.
needles=0
for js in "$SRC"/tools/*.js; do
  if grep -nE "replace\(\s*['\"]place: [A-Za-z_][A-Za-z0-9_]*,['\"]" "$js" >/dev/null 2>&1; then
    bad "$(basename "$js") — substitutes a needle that names a place, which rots on the first move"
    needles=$((needles + 1))
  fi
done
[ "$needles" -eq 0 ] && ok "no browser suite substitutes a place-naming needle (a grep, not a rehearsal)"

echo
if [ "$REAL_LEDGER_HASH" = "$(sha256sum "$REAL_LEDGER" | cut -d' ' -f1)" ]; then
  ok "the tower's own ledger was not touched"
else
  bad "the tower's own ledger MOVED — this file must never write to the cold record"
fi

echo
echo "move-rehearsal: this asks whether the SUITES survive a move. It asks"
echo "move-rehearsal: nothing about whether the move is a good idea, and it"
echo "move-rehearsal: is not a filter on where to stand — a place that breaks"
echo "move-rehearsal: nothing proves safety, not interest (Ember, Day 22)."
echo "move-rehearsal: the browser suites are not in this sweep. That is a"
echo "move-rehearsal: hole in it, not its scope."
echo

if [ "$fails" -gt 0 ]; then
  echo "move-rehearsal: $fails suite(s) do not survive the move; $blind blind."
  exit 1
fi
if [ "$blind" -gt 0 ]; then
  echo "move-rehearsal: no suite failed the move, but $blind could not be rehearsed at all."
  exit 2
fi
echo "move-rehearsal: every shell suite survives a move."
