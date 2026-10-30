#!/usr/bin/env bash
# survey-breaks — make `tools/survey.js` fail, in a scratch tree.
#
# Built Day 22, beside the tool. The house rule it exists for is Day 5's: a
# check that cannot break always passes, so the sabotage must be proved to have
# landed before its failure means anything — and Day 17's turn of the same
# rule, which is the one that gets forgotten: a suite that watches its own
# breaking and not its own building is watching one end of itself. Every case
# below asserts the fixture was built as hard as it asserts the sabotage landed.
#
# And Day 19's: a suite must prove the tool its sabotage made still *runs*. A
# substitution can land in the text and produce a file node will not load, and
# then every case under it fails with a message blaming the fixture while node
# prints a module error into the same buffer — failures unreadable at exactly
# the moment they are loudest. So each sabotage is followed by an answers-check
# before any expectation is read.
#
# Nothing here touches the real tree. `survey.js` only reads, but Day 10's
# lesson was learned by three of us at once and applies to the shape and not
# only to writers: never point a test at the thing it is a test of. The scratch
# tree's bytes are checked at the end regardless.

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
W="$(mktemp -d)"
trap 'rm -rf "$W"' EXIT

mkdir -p "$W/tools" "$W/reckoning"
cp "$ROOT/tools/survey.js" "$W/tools/"
cp "$ROOT/reckoning/reckoning.js" "$W/reckoning/"
cp "$ROOT/reckoning/ledger.json" "$W/reckoning/"

FAILED=0
ok()  { printf 'ok    %s\n' "$1"; }
bad() { printf 'FAIL  %s\n' "$1"; FAILED=1; }

# Day 75: the far fixture is asked of the cold ledger, and spliced into the
# scratch copy's shortlist. Day 53 asked it of the shortlist itself, which
# fixed one expiry and kept another: the shortlist is edited every Friday,
# and on Day 74 Tromso came off it, the last candidate past ±66. From that
# commit until the Saturday rehearsal five cases were red about a tool that
# was right, and nothing daily runs this file. The ledger only ever gains
# rows, so a place the tower has stood in past ±66 cannot leave it. The same
# goes for the day-line cases, which named Kiritimati and Reykjavik off the
# shortlist: Reykjavik is pledged for 2026-10-18, and a place stood in comes
# off (no city twice). So the ledger place furthest east or west of Greenwich
# by longitude is spliced in too, and the far place doubles as the one that
# does not reach the join. Splicing them into the copy is honest because
# every case below is about the tool, not about this week's list.
read -r FAR FAR_SPLICED EDGE <<EOF
$(node -e '
  const fs = require("fs");
  const dir = process.argv[1];
  const rows = JSON.parse(fs.readFileSync(dir + "/reckoning/ledger.json", "utf8"));
  const seen = {};
  rows.forEach(function (r) { if (r.place && r.place.name) seen[r.place.name] = r.place; });
  const far = Object.keys(seen).map(function (k) { return seen[k]; })
    .filter(function (p) { return Math.abs(p.latitude) > 66; })
    .sort(function (a, b) { return Math.abs(b.latitude) - Math.abs(a.latitude); })[0];
  const edge = Object.keys(seen).map(function (k) { return seen[k]; })
    .sort(function (a, b) { return Math.abs(b.longitude) - Math.abs(a.longitude); })[0];
  if (!far || !edge || far.name === edge.name) { console.log(""); process.exit(0); }
  const file = dir + "/tools/survey.js";
  const src = fs.readFileSync(file, "utf8");
  const line = "const CANDIDATES = [\n  " + JSON.stringify(far) + ",\n  " + JSON.stringify(edge) + ",";
  const out = src.replace("const CANDIDATES = [", line);
  fs.writeFileSync(file, out);
  console.log(far.name.replace(/\s+/g, "_") + " " + (out !== src ? "yes" : "no") + " " + edge.name.replace(/\s+/g, "_"));
' "$W")
EOF

# The scratch tree as it stands now, so a case can restore it.
PRISTINE="$(mktemp -d)"
cp -r "$W/." "$PRISTINE/"
restore() { rm -rf "$W/tools" "$W/reckoning"; cp -r "$PRISTINE/." "$W/"; }

# Does the tool answer at all? Not "did the bytes move" — Day 19.
answers() {
  node "$W/tools/survey.js" >/dev/null 2>&1
  local code=$?
  [ "$code" -le 1 ]
}

run() { node "$W/tools/survey.js" "$@" 2>"$W/stderr.txt"; }

# ---- the good path, which is what gives the sabotages their meaning ----

OUT="$(run)"; CODE=$?
[ "$CODE" -eq 0 ] && ok "the unbroken tool exits 0" || bad "the unbroken tool exits 0 (got $CODE)"
# Day 31 turned these three round, and the turning is the point rather than a
# bookkeeping cost. Until this morning the witness stopped at ±66 and the flag
# fired at Longyearbyen and Tromso. The sweep now runs pole to pole, so no
# latitude on earth is outside it — the flag has an **empty domain**, and an
# empty domain always says yes (Day 21, Day 27). A suite that only asserted
# *the flag is silent* would be scoring vacancy as correctness, so the silence
# is asserted here and the flag's power is re-earned in sabotage 1, which
# narrows the band and demands it come back.
# Matched on the *row's* whole note and not on the flag's name, because the
# report now lawfully talks about the flag in its header — and the first draft
# of this case grepped the bare name and convicted the tool of the sentence
# saying the flag was silent. A check that cannot tell a thing from a sentence
# about the thing is Day 9's regex one room along.
grep -q 'unwitnessed latitude — the sweep did not reach here' <<<"$OUT" \
  && bad "no row is flagged unwitnessed — the sweep now reaches everywhere" \
  || ok "no row is flagged unwitnessed — the sweep now reaches everywhere"
grep -q 'empty domain and is silent' <<<"$OUT" \
  && ok "and the report says the flag is silent by construction, not by finding nothing" \
  || bad "and the report says the flag is silent by construction, not by finding nothing"
# Day 53: these cases named Longyearbyen, which came off the shortlist the
# morning the tower had stood there. A fixture typed from a list that is
# edited every Friday is a fixture with an expiry nobody dates. Day 75: so is
# a fixture *asked* of that list, once the list runs out of what it is asked
# for. The far place is now the ledger's, spliced in above; this asserts the
# splice landed and the copy's own shortlist carries it (Day 17: watch the
# building, not only the breaking).
IN_LIST="$(cd "$W" && node -e "const S=require('./tools/survey.js');process.stdout.write(S.CANDIDATES.some(p=>p.name.replace(/\\s+/g,'_')==='${FAR:-}'&&Math.abs(p.latitude)>66)?'yes':'no')" 2>/dev/null)"
if [ -z "${FAR:-}" ]; then
  bad "the fixture was not built — no place in the ledger stands past ±66"
elif [ "${FAR_SPLICED:-}" != "yes" ] || [ "$IN_LIST" != "yes" ]; then
  bad "the fixture was not built — $FAR did not land on the scratch shortlist"
else
  ok "the far fixture is the ledger's, spliced into the scratch shortlist: $FAR"
fi
grep -q 'gap larger than any the sweep saw' <<<"$OUT" \
  && bad "no candidate's gap sits outside what the sweep has seen" \
  || ok "no candidate's gap sits outside what the sweep has seen"
IN_EDGE="$(cd "$W" && node -e "const S=require('./tools/survey.js');process.stdout.write(S.CANDIDATES.some(p=>p.name.replace(/\\s+/g,'_')==='${EDGE:-}')?'yes':'no')" 2>/dev/null)"
if [ -z "${EDGE:-}" ] || [ "$IN_EDGE" != "yes" ]; then
  bad "the fixture was not built — no edge place landed on the scratch shortlist"
else
  grep -qE "^  ${EDGE} +.*reached: (sunrise|sunset)" <<<"$OUT" \
    && ok "$EDGE, the ledger place furthest from Greenwich by longitude, reaches the day-line join" \
    || bad "$EDGE, the ledger place furthest from Greenwich by longitude, reaches the day-line join"
fi
grep -qE "^  ${FAR:-NO_FAR_PLACE} +.*not reached" <<<"$OUT" \
  && ok "${FAR:-the far place} does not reach it" \
  || bad "${FAR:-the far place} does not reach it"
grep -q 'never risen' <<<"$OUT" \
  && ok "a dark candidate says so" || bad "a dark candidate says so"
# Day 39: the header used to assert this by hand and went stale for
# seventeen mornings. The HISTORICAL section reads the real ledger, so this
# asserts the ledger's own known shape rather than trusting the tool's prose
# about itself — the same rule this section exists to enforce.
grep -q 'Auckland.*day-line join fired on 7 of 7' <<<"$OUT" \
  && ok "the historical section reads Auckland's real join history off the ledger" \
  || bad "the historical section reads Auckland's real join history off the ledger"
grep -q 'Paris.*rising-point arc never fired' <<<"$OUT" \
  && ok "and reads Paris's real (unfired) history off the same ledger" \
  || bad "and reads Paris's real (unfired) history off the same ledger"
grep -q 'NaN' <<<"$OUT" \
  && bad "no NaN anywhere in the report" || ok "no NaN anywhere in the report"
# The pass rule below must be one the unbroken tool fails, or it is not a rule.
grep -q 'PAST THE BOUND' <<<"$OUT" \
  && bad "the unbroken tool refuses nobody" || ok "the unbroken tool refuses nobody"

# ---- 1. narrow the witness band back off the poles ----
#
# This case ran the other way round until Day 31: it widened a ±66 band and
# asserted the flag went quiet. The band is the whole sphere now, so widening
# is a no-op that lands nothing, and the case would have gone on passing about
# a substitution that never happened had the byte check not caught it.
#
# Narrowing is the same claim from the side that still has teeth. The flag is
# about the *evidence*, so taking the evidence away must bring it back — and
# must bring it back without moving a single figure, because the witness is not
# an input to any arithmetic.

restore
BEFORE="$(cat "$W/reckoning/reckoning.js")"
perl -0pi -e 's/latitudeRange: \[-90, 90\]/latitudeRange: [-66, 66]/' "$W/reckoning/reckoning.js"
if [ "$BEFORE" = "$(cat "$W/reckoning/reckoning.js")" ]; then
  bad "sabotage 1 did NOT land — the witness band was not narrowed"
elif ! answers; then
  bad "sabotage 1 landed but the tool no longer runs"
else
  ok "sabotage 1 landed and the tool still answers"
  NARROW="$(run)"
  [ -n "$FAR" ] && grep -q "$FAR.*unwitnessed latitude" <<<"$NARROW" \
    && ok "a witness stopping at 66 puts the band flag back at $FAR" \
    || bad "a witness stopping at 66 puts the band flag back at ${FAR:-the far candidate}"
  # Day 32: this read `grep -q 'Longyearbyen   19.39h'` — a figure typed in on
  # the morning the case was written, against a move date the tool's own
  # comment says is edited every week. It went red the first time the
  # shortlist moved, about a tool that was right, which is the failure mode
  # the book has recorded four times under *my expectations get less scrutiny
  # than my code*. The claim was never about 19.39: it is that narrowing the
  # *evidence* moves the flag and not the number. So the number is read off
  # the unbroken run and held against the narrowed one, and the case now says
  # what it always meant. Guarded, because a `grep -o` that finds nothing
  # would make this compare two empty strings and pass vacuously (Day 21).
  LY_DAY="$([ -n "$FAR" ] && grep -oE "$FAR +[0-9]+\.[0-9]+h" <<<"$OUT" | head -1)"
  if [ -z "$LY_DAY" ]; then
    bad "the fixture was not built — no day figure for ${FAR:-the far candidate} in the unbroken run"
  else
    grep -qF "$LY_DAY" <<<"$NARROW" \
      && ok "and moves no figure — $FAR's day is unchanged ($LY_DAY)" \
      || bad "and moves no figure — $FAR's day is unchanged ($LY_DAY)"
  fi
fi

# ---- 2. shrink the largest honest gap ----

restore
BEFORE="$(cat "$W/reckoning/reckoning.js")"
perl -0pi -e 's/largestHonestGapMinutes: 25\.628,/largestHonestGapMinutes: 0.001,/' "$W/reckoning/reckoning.js"
if [ "$BEFORE" = "$(cat "$W/reckoning/reckoning.js")" ]; then
  bad "sabotage 2 did NOT land — the largest gap was not shrunk"
elif ! answers; then
  bad "sabotage 2 landed but the tool no longer runs"
else
  ok "sabotage 2 landed and the tool still answers"
  N="$(run | grep -c 'gap larger than any the sweep saw')"
  # Day 75: this was `-gt 20`, typed when the shortlist had 12 places (48
  # rows). Friday cut it to 20 and the case went red about a tool that was
  # right — a count typed beside a list this house edits weekly (Day 47). The claim is that
  # every row with events to check is flagged, so that number is read off the
  # copy's own shortlist and the unbroken report, and must not be zero.
  ROWS="$(cd "$W" && node -e "const S=require('./tools/survey.js');process.stdout.write(String(S.CANDIDATES.length*S.DATES.length))" 2>/dev/null)"
  NOEV="$(grep -c 'no events to check' <<<"$OUT")"
  WANT=$(( ${ROWS:-0} - NOEV ))
  if [ "$WANT" -le 0 ]; then
    bad "the fixture was not built — no row with events to flag (rows ${ROWS:-none}, without events $NOEV)"
  else
    [ "$N" -eq "$WANT" ] \
      && ok "a witness that saw nothing flags every row with events ($N of $ROWS; $NOEV have none)" \
      || bad "a witness that saw nothing flags every row with events (got $N, want $WANT)"
  fi
fi

# ---- 3. drop the bound under the honest gaps ----
#
# Exit 1 is spoken for: at least one candidate produced a figure the tower would
# refuse to stand behind. A mistyped flag must never spend it (Day 13).

restore
BEFORE="$(cat "$W/reckoning/reckoning.js")"
perl -0pi -e 's/CROSS_CHECK_MAX_GAP_MINUTES = 60/CROSS_CHECK_MAX_GAP_MINUTES = 1/' "$W/reckoning/reckoning.js"
if [ "$BEFORE" = "$(cat "$W/reckoning/reckoning.js")" ]; then
  bad "sabotage 3 did NOT land — the bound was not lowered"
elif ! answers; then
  bad "sabotage 3 landed but the tool no longer runs"
else
  ok "sabotage 3 landed and the tool still answers"
  OUT3="$(run)"; CODE3=$?
  grep -q 'PAST THE BOUND' <<<"$OUT3" \
    && ok "a bound under the honest gaps produces a refusal" \
    || bad "a bound under the honest gaps produces a refusal"
  [ "$CODE3" -eq 1 ] \
    && ok "and the tool exits 1" || bad "and the tool exits 1 (got $CODE3)"
fi

# ---- 3b. force the rising-point arc to fire in the ledger ----
#
# Day 46. The good-path case above only proves the arc guard has never fired
# in the real ledger — the same shape as `banked.js`'s pledge witness, an
# unbroken run can only ever show silence. A check that has only ever been
# silent has not yet earned belief that it can speak (Day 9's rule). So a row
# is spliced in with `risingPointDegrees: null`, `never` left falsy, and a
# `working` that does not reach the day-line join — the one shape that can
# only be explained by this guard, not by either of the other two.

restore
# Day 47. The place and the row-count are read off the ledger, never typed.
# The first draft of this case needled for the literal `Nairobi ... 1 of 6`
# and was red the next morning, because the tower stood still and the book
# gained a seventh Nairobi row. Two of this house's own rules at once: an
# assumption about where you are does not have to name the place (Day 24),
# and a case that depends on the day not having happened yet has an expiry
# its author never sees (Day 17). The newest row's place is used because it
# is the one whose count moves every morning — the hardest case to keep
# right, so the one worth binding to the record.
read -r ARC_PLACE ARC_ROWS <<EOF
$(node -e '
  const rows = require(process.argv[1] + "/reckoning/ledger.json");
  const placed = rows.filter(function (r) { return r.place && r.place.name; });
  const name = placed[placed.length - 1].place.name;
  const n = placed.filter(function (r) { return r.place.name === name; }).length;
  console.log(name + " " + (n + 1));
' "$W")
EOF
node -e '
  const fs = require("fs");
  const p = process.argv[1] + "/reckoning/ledger.json";
  const name = process.argv[2];
  const rows = JSON.parse(fs.readFileSync(p, "utf8"));
  const template = rows.filter(r => r.place && r.place.name === name).pop();
  const forged = JSON.parse(JSON.stringify(template));
  forged.date = "2099-01-01";
  forged.risingPointDegrees = null;
  rows.push(forged);
  fs.writeFileSync(p, JSON.stringify(rows, null, 2));
' "$W" "$ARC_PLACE"
if ! grep -q '"date": "2099-01-01"' "$W/reckoning/ledger.json"; then
  bad "sabotage 3b did NOT land — the forged row was not written"
elif [ -z "${ARC_PLACE:-}" ] || [ -z "${ARC_ROWS:-}" ]; then
  bad "sabotage 3b landed but the ledger named no place to hold the report to"
elif ! answers; then
  bad "sabotage 3b landed but the tool no longer runs"
else
  ok "sabotage 3b landed and the tool still answers ($ARC_PLACE, $ARC_ROWS rows)"
  FORGED_OUT="$(run)"
  grep -q "$ARC_PLACE.*rising-point arc fired on 1 of $ARC_ROWS" <<<"$FORGED_OUT" \
    && ok "the arc guard convicts a row it was built to catch" \
    || bad "the arc guard convicts a row it was built to catch"
fi

# ---- 4. the argument surface ----

restore
run --nonsense >"$W/out.txt"; CODE=$?
[ "$CODE" -eq 2 ] && ok "an unknown flag exits 2" || bad "an unknown flag exits 2 (got $CODE)"
grep -q '^INVALID' "$W/stderr.txt" && ok "and says INVALID on stderr" || bad "and says INVALID on stderr"
[ ! -s "$W/out.txt" ] && ok "and prints no report" || bad "and prints no report"

run --help >"$W/out.txt"; CODE=$?
[ "$CODE" -eq 0 ] && ok "--help exits 0" || bad "--help exits 0 (got $CODE)"
grep -q '^usage' "$W/out.txt" && ok "and prints the usage line only" || bad "and prints the usage line only"

# ---- 5. the other door (Day 10) ----

# Day 32: the expectation here was the literal `candidates=12`, so importing
# the module and printing nothing at all still failed the case the week the
# shortlist changed — and the case is not about how many candidates there are.
# What `require()` must not do is run the report or exit the importing
# process. So: the output must be exactly the one line this probe printed,
# and the count must be a plain positive number rather than a chosen one.
REQ="$(node -e "const m=require('$W/tools/survey.js'); process.stdout.write('candidates='+m.CANDIDATES.length)" 2>&1)"
if [[ "$REQ" =~ ^candidates=([0-9]+)$ ]] && [ "${BASH_REMATCH[1]}" -gt 0 ]; then
  ok "require() neither prints a report nor exits ($REQ)"
else
  bad "require() neither prints a report nor exits (got: $REQ)"
fi

# ---- 6. the ledger is unreadable ----
#
# `ledgerHistory()` can throw (a missing or malformed ledger) and Day 5's rule
# is that every call site must expect it. It does not — it wraps the read in
# try/catch and answers `readable: false` instead. Prove the guard is load-
# bearing by removing the file it guards and checking the tool still runs.

restore
rm -f "$W/reckoning/ledger.json"
if ! answers; then
  bad "removing the ledger takes the whole tool down — the read is unguarded"
else
  ok "removing the ledger leaves the tool answering"
  OUT6="$(run)"; CODE6=$?
  grep -q 'the ledger could not be read' <<<"$OUT6" \
    && ok "and it says so instead of a stack trace or silence" \
    || bad "and it says so instead of a stack trace or silence"
  [ "$CODE6" -le 1 ] \
    && ok "and still exits 0 or 1, never a crash code" \
    || bad "and still exits 0 or 1, never a crash code (got $CODE6)"
fi

# ---- 8. another local day (Day 88, Ember's find) ----
# Kiritimati is typed here, and on purpose: what makes it the fixture is its
# longitude against its clock (−157 against +14), a fact about the place and
# not about this week's list or this week's sky. No ledger place has the
# property (Day 88 checked all 86 rows), so it cannot be asked of the ledger.

restore
KIRI='{"name":"Kiritimati","latitude":1.8721,"longitude":-157.4278,"zone":"Pacific/Kiritimati"}'
node -e 'const fs=require("fs"),f=process.argv[1];fs.writeFileSync(f,fs.readFileSync(f,"utf8").replace("const CANDIDATES = [","const CANDIDATES = [\n  "+process.argv[2]+","))' "$W/tools/survey.js" "$KIRI"
if ! grep -qF "$KIRI" "$W/tools/survey.js"; then
  bad "the fixture was not built — Kiritimati did not land on the scratch shortlist"
else
  OUT8="$(run)"
  grep -qE '^  Kiritimati .*ANOTHER LOCAL DAY: rise 2026-' <<<"$OUT8" \
    && ok "Kiritimati, whose clock runs a day ahead of its longitude, is flagged ANOTHER LOCAL DAY" \
    || bad "Kiritimati, whose clock runs a day ahead of its longitude, is flagged ANOTHER LOCAL DAY"
  grep -qE "^  ${EDGE:-NOEDGE}( |_).*ANOTHER LOCAL DAY" <<<"$OUT8" \
    && bad "${EDGE:-the edge place}, a ledger place whose rows were all their own day, is not flagged" \
    || ok "${EDGE:-the edge place}, a ledger place whose rows were all their own day, is not flagged"
  perl -0pi -e 's/const wrongDay = local\.rise !== date\.iso \|\| local\.set !== date\.iso;/const wrongDay = false;/' "$W/tools/survey.js"
  if ! grep -q 'const wrongDay = false;' "$W/tools/survey.js"; then
    bad "sabotage 8 did NOT land — the local-day question is still asked"
  elif ! answers; then
    bad "sabotage 8 landed but the tool no longer runs"
  else
    run | grep -q 'ANOTHER LOCAL DAY: rise' \
      && bad "with the question cut, Kiritimati's flag goes (so the case was measuring it)" \
      || ok "with the question cut, Kiritimati's flag goes (so the case was measuring it)"
  fi
fi

# ---- 7. a read tool that writes is a different tool (Day 10) ----

restore
rm -f "$W/out.txt" "$W/stderr.txt"
SUM_BEFORE="$(find "$W" -type f -exec md5sum {} + | sed "s|$W||" | sort)"
run >/dev/null 2>&1
rm -f "$W/stderr.txt"
SUM_AFTER="$(find "$W" -type f -exec md5sum {} + | sed "s|$W||" | sort)"
[ "$SUM_BEFORE" = "$SUM_AFTER" ] \
  && ok "the survey wrote nothing to the tree" \
  || bad "the survey wrote nothing to the tree"

rm -rf "$PRISTINE"
[ "$FAILED" -eq 0 ] && printf '\nsurvey-breaks: all cases green\n' || printf '\nsurvey-breaks: RED\n'
exit "$FAILED"
