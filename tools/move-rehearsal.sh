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
# **The browser suites are in the sweep as of Day 26, and the hole they
# were is closed.** Until this morning this header said, in these words,
# that `tools/*.js` are *not rehearsed, because they need a served tree and
# a browser and this file runs neither* — and called that a hole and not a
# scope, which was honest and was still a hole. `ledger-place.js` was
# carrying four Paris-pinned expectations and was found by hand on Day 24,
# not by this tool. A copy of the tower is a git clone with `scripts/` in
# it, so it can serve and shoot itself: each browser suite is run through
# `./scripts/local-snapshot.sh` inside both copies, under the same control
# and the same three verdicts as the shell half. It costs about ten seconds
# a suite a copy.
#
# **It found one on its first run**, which is the only reason to believe
# the pass does anything: `pledge-page.js` — written on Day 25, the morning
# *after* Day 24 found four suites that thought they lived in Paris —
# asserts `/Paris/` of the sentence saying where the tower stands meanwhile.
# The page was right and the check was wrong, in the file whose whole
# subject is the promise to leave Paris.
#
# **Made to fail, and the recipe is the argument.** Point this file at a
# clone taken before this morning's repairs and the browser pass scores
# **2 FAIL and 1 BLIND** where the repaired tree scores 0 and 1:
#
#   P=$(mktemp -d)/pre; git clone -q --local . "$P"
#   ln -s "$PWD/node_modules" "$P/node_modules"
#   cmp -s tools/standing-page.js "$P/tools/standing-page.js" \
#     && echo "SABOTAGE DID NOT LAND"
#   ./tools/move-rehearsal.sh "$P"
#
# The three it finds are one species — a suite that cannot be moved — and
# only one of them has a city in it. `pledge-page.js` asserts `/Paris/`;
# `rising-point.js` calls `reckon(d)`, whose place argument falls back to
# `PARIS`, and so computes one city's rising point against a page drawing
# another's; `standing-page.js` forges with a needle matching an
# *identifier*, which cannot move a tower whose place is already an inline
# object, so it fails in both copies and arrives as BLIND. **Two of the
# three name no place at all**, which is why Day 23's hunt for typed cities
# and Day 24's grep both walked past them, and is the whole reason this
# pass is a rehearsal and not a search.
#
# **`since` and `pledge` are deliberately not moved, and that is a choice
# now rather than an oversight** (Ember's find, the same morning, when it
# was still inert because no shell suite read either field). The browser
# half reads both — `pledgeStanding` runs in `page.js` and `lintel.js` —
# so the question is live: a moved copy carries the real tower's word,
# still naming Auckland, while standing somewhere else. That is exactly
# what a Sunday half-way through looks like, it is the state that exposed
# the line above, and moving those two fields as well would give the two
# copies a **second** difference, which is the one thing the control exists
# to prevent.
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
  # The browser half needs Playwright. `node_modules` is untracked and is not
  # in the copy, and `local-snapshot.sh` would answer that with `npm ci` —
  # a network fetch, twice, on a desk that may have no network. A symlink to
  # the tower's own is enough: nothing in the rehearsal writes to it.
  [ -d "$SRC/node_modules" ] && [ ! -e "$dest/node_modules" ] \
    && ln -s "$SRC/node_modules" "$dest/node_modules"
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
#
# **The control is rewritten to the tower's own place, field for field, and
# not to a stand-in standing at the same zone** (Day 26, found by the
# browser half on its first honest run). The old control wrote
# `{ name: "Control", latitude: 0, longitude: 0, zone: <the real zone> }`,
# which differs from the tower in three fields and not one: any suite that
# says *Paris* or asks for Paris's sunrise is red in the control too, so it
# lands on BLIND — and `pledge-page.js`, `rising-point.js` and
# `standing-page.js` all did, on the first run of the browser pass. The
# needle a rehearsal exists to find was inside the resemblance. So the
# control now carries the real place's name and coordinates and only its
# *bytes* move, which is the whole of what the control was ever for:
# `check-sight.sh` still grades it STALE, and a suite pinned to the old city
# is now green in the control and red in the moved copy, which is FAIL and
# is the truth. **Day 24 said a control made to resemble the thing it
# controls for goes blind to whatever lives in the resemblance; the answer
# is not more copies, it is to stop resembling it in fields nobody asked
# for.**
rewrite_standing() {
  node -e '
    const fs = require("fs");
    const file = process.argv[1] + "/reckoning/reckoning.js";
    const before = fs.readFileSync(file, "utf8");
    // Anchored at both ends of the field, so it matches whatever expression
    // stands there rather than only an identifier.
    const NEEDLE = /var STANDING = \{\s*place:[\s\S]*?since:/;
    if (!NEEDLE.test(before)) process.exit(1);
    const place = {
      name: process.argv[3],
      latitude: Number(process.argv[4]),
      longitude: Number(process.argv[5]),
      zone: process.argv[2]
    };
    const to = "var STANDING = {\n    place: " + JSON.stringify(place) + ",\n    since:";
    fs.writeFileSync(file, before.replace(NEEDLE, to));
  ' "$1" "$2" "$3" "$4" "$5"
}

read -r HERE_NAME HERE_LAT HERE_LON <<EOF
$(node -e '
  const { STANDING } = require(process.argv[1] + "/reckoning/reckoning.js");
  console.log([STANDING.place.name, STANDING.place.latitude, STANDING.place.longitude].join(" "));
' "$SRC")
EOF

# The far place is a real place object, held to what `placeProblem()` asks —
# see the note above the function. `Rehearsal` at 0,0 is on the earth and in
# a zone the clock knows.
rewrite_standing "$MOV" "$FAR_ZONE" "Rehearsal" 0 0 \
  || stop "the tower could not be moved — the STANDING literal has changed shape"
rewrite_standing "$CTL" "$NEAR_ZONE" "$HERE_NAME" "$HERE_LAT" "$HERE_LON" \
  || stop "the control could not be rewritten — the STANDING literal has changed shape"

# Assert the fixture was built, on both sides (Day 17). A control that was
# accidentally moved, or a moved copy that was not, makes every line below
# mean the opposite of what it says. The control is held to the whole place
# and not to its zone: a control standing at the right zone under a wrong
# name is the fault this file had until Day 26, and a zone-only assertion is
# exactly what let it stand.
node -e '
  const m = require(process.argv[1] + "/reckoning/reckoning.js");
  const c = require(process.argv[2] + "/reckoning/reckoning.js");
  const real = require(process.argv[5] + "/reckoning/reckoning.js").STANDING.place;
  const same = ["name", "latitude", "longitude", "zone"].every(function (k) {
    return c.STANDING.place[k] === real[k];
  });
  process.exit(m.STANDING.place.zone === process.argv[3] && same && real.zone === process.argv[4] ? 0 : 1);
' "$MOV" "$CTL" "$FAR_ZONE" "$NEAR_ZONE" "$SRC" \
  && ok "the fixture: the control stands at $HERE_NAME as the tower does, the other copy at $FAR_ZONE" \
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

# ---- the grep that used to stand in for the browser half ----
#
# Ember's narrowing, Day 24, kept now that the rehearsal below has arrived
# to do the real asking. It is not redundant and it is not the check: a
# needle naming a place makes a suite fail *loudly*, so the rehearsal
# catches it either way — but it catches it as a wall of output, and this
# line names the mechanism in nine words. It is a diagnosis, not evidence.
# **A grep finds the word; an assumption about where you are does not have
# to name the place** — which is why it is no longer the last thing in this
# file.
needles=0
for js in "$SRC"/tools/*.js; do
  if grep -nE "replace\(\s*['\"]place: [A-Za-z_][A-Za-z0-9_]*,['\"]" "$js" >/dev/null 2>&1; then
    bad "$(basename "$js") — substitutes a needle that names a place, which rots on the first move"
    needles=$((needles + 1))
  fi
done
[ "$needles" -eq 0 ] && ok "no browser suite substitutes a place-naming needle (a grep, not a rehearsal)"

echo

# ---- every browser suite, in both copies ----
#
# **The case list is the directory here too** (Day 23), and the line between
# a browser suite and a plain node tool is drawn by asking the file, never
# by a list kept here: a browser suite is one that reads `FAR_KEEPER_URL`,
# which is the variable `local-snapshot.sh` puts in its environment and the
# only thing every one of them has in common. A hand-kept list would go
# blind to the next suite written, and report that as clean.
#
# **They run one at a time, and one at a time is not enough.**
# `local-snapshot.sh` takes a port out of 8765-8770, and a port whose server
# has exited is not free: the closed listener leaves connections in
# TIME_WAIT and the next plain `bind()` on it fails for about a minute. Six
# ports, ten seconds a suite — the first run of this pass got three suites
# in and then handed back **six BLIND at exit 2**, which is
# `no free port in 8765-8770` and has nothing to do with any of them.
#
# That is Day 25's fault arriving where Day 25 said it would, and the shape
# of it is worth more than the fix: the symmetric control turned it into
# BLIND rather than FAIL, because the harness fails identically in both
# copies. Nothing was accused. But **a rehearsal that abstains on
# two-thirds of its subject has rehearsed nothing**, and it exited 2 with a
# line that could be read as a small caveat. So the wait is the tool's, not
# the keeper's: it asks for a port the same way `local-snapshot.sh` will and
# holds until the range gives one back.
wait_for_port() {
  local tries=0
  while [ "$tries" -lt 40 ]; do
    python3 - <<'PY' && return 0
import socket, sys
for port in range(8765, 8771):
    with socket.socket() as probe:
        try:
            probe.bind(("127.0.0.1", port))
        except OSError:
            continue
    sys.exit(0)
sys.exit(1)
PY
    tries=$((tries + 1))
    sleep 5
  done
  return 1
}

browser_suites=0
for path in "$SRC"/tools/*.js; do
  suite="$(basename "$path")"
  grep -q 'FAR_KEEPER_URL' "$path" || continue
  browser_suites=$((browser_suites + 1))

  wait_for_port || stop "$suite — no port came free in 8765-8770; nothing below this line ran"
  (cd "$CTL" && timeout 600 ./scripts/local-snapshot.sh "tools/$suite" >/dev/null 2>&1); ctl=$?
  wait_for_port || stop "$suite — no port came free in 8765-8770; the moved copy never ran"
  (cd "$MOV" && timeout 600 ./scripts/local-snapshot.sh "tools/$suite" >/dev/null 2>&1); mov=$?

  if [ "$ctl" -ne 0 ]; then
    blind "$suite — red in the control copy too (exit $ctl), so this rehearsal learned nothing about it"
  elif [ "$mov" -ne 0 ]; then
    bad "$suite — green where the tower stands, red where it does not (exit $mov)"
    wait_for_port \
      && (cd "$MOV" && timeout 600 ./scripts/local-snapshot.sh "tools/$suite" 2>&1 | grep '^FAIL' | head -4 | sed 's/^/        /')
  else
    ok "$suite"
  fi
done

[ "$browser_suites" -eq 0 ] \
  && stop "no file in tools/ reads FAR_KEEPER_URL — the browser half rehearsed nothing and would have said so in green"

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
echo "move-rehearsal: the browser suites are in the sweep as of Day 26. What"
echo "move-rehearsal: is still outside it is any suite this design cannot"
echo "move-rehearsal: rehearse at all — check-sight.sh reads the working"
echo "move-rehearsal: tree, so moving a copy dirties it and it lands BLIND"
echo "move-rehearsal: every run. BLIND is not an all-clear."
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
