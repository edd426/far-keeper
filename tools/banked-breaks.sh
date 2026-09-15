#!/usr/bin/env bash
#
# banked-breaks — break the banked-witness door ten ways in a scratch tree, and
# prove `tools/banked.js` says the right word for each.
#
# The case list is drawn from what the tool is **obliged** to do rather than
# from what it happens to look at, because Day 17 caught a case that had been
# drawn from the surface and spent seven mornings asserting a hole should stay
# open. So the obligations first, in plain words, and a case for each:
#
#   * every banked witness gets asked, and asked by *running* something
#   * a gatherer that disagrees is a different word, and a different exit
#     code, from a witness nothing can ask (Ember's Day 40 caution: an alarm
#     that is on every morning is an alarm a keeper stops reading)
#   * silence from a gatherer is never read as agreement
#   * a witness whose domain is this instrument is asked whether the
#     instrument has grown, and that count is read, never typed
#   * finding no witnesses at all is a fault, not a clean bill (Day 27: an
#     empty domain always says yes)
#   * a mistyped flag never spends an exit code a real finding lives on
#
# Case 6 is the one that earned its place before the tool was finished. The
# growth question only fires for a witness that declares `domainIsInstrument`,
# so a later hand who drops that field does not break anything — the tool goes
# quiet and quiet reads as clean. That is this house's own most-repeated fault
# and it needed a lock, not a comment. Case 6 is the lock, and case 6a asserts
# its domain is non-empty first, because a case that watches for a line which
# was never there is answered by nothing at all.
#
# Every case asserts its own sabotage landed (Day 5 — a test that cannot break
# always passes) AND that the fixture it needs was actually built (Day 17 — a
# suite that watches its own breaking and not its own building is watching one
# end of itself).
#
# Speed, and what it costs. The good path runs the two real sweeps, which is
# twenty-three seconds and is the only case that proves the real gatherers are
# reachable. Every case after it swaps them for stubs, because those cases are
# about what `banked.js` does with an answer, not about what the sweeps find.
# That trade is named here rather than hidden: a stub tree cannot tell you the
# sweeps still agree, and nothing below claims it can.
#
# Nothing here touches the real tree. The tower is copied into a `mktemp -d`
# and the copy's bytes are checked after every run: `banked.js` is a read tool,
# and a read tool that writes is a different tool (Day 10).
#
# Usage: ./tools/banked-breaks.sh [tree-to-test]   (default: this tower)

set -u -o pipefail

SUBJECT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
PASS=0
FAIL=0

ok()  { printf 'ok    %s\n' "$1"; PASS=$((PASS + 1)); }
bad() { printf 'FAIL  %s\n' "$1"; FAIL=$((FAIL + 1)); }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

R=reckoning/reckoning.js

fresh_tree() {
  local dest="$1"
  rm -rf "$dest"
  mkdir -p "$dest"
  tar -cf - -C "$SUBJECT" \
    --exclude=.git --exclude=node_modules --exclude=previews --exclude=archive . \
    | (cd "$dest" && tar -xf -)
}

# Swap the two real sweeps for stubs that answer instantly. Everything after
# the good path uses this, and says so.
stub_gatherers() {
  local tree="$1" verdict="${2:-AGREES}" code="${3:-0}"
  local f
  for f in tools/cross-check-sweep.js tools/drift-gap-sweep.js; do
    cat > "$tree/$f" <<EOF
#!/usr/bin/env node
console.log('stub: $verdict — a stub standing in for the real sweep.');
process.exit($code);
EOF
  done
}

run_in() {
  local tree="$1"; shift
  BEFORE="$(cd "$tree" && find . -type f -exec cksum {} + | sort)"
  OUT="$(cd "$tree" && node tools/banked.js "$@" 2>&1)"
  CODE=$?
  AFTER="$(cd "$tree" && find . -type f -exec cksum {} + | sort)"
  if [[ "$BEFORE" != "$AFTER" ]]; then
    bad "the tool wrote to the tree — a read tool that writes is a different tool"
  fi
}

# Assert a substitution actually changed the file. A sha rots when history is
# rewritten and this sandbox has lied to us about its own floor (Day 8), so
# every sabotage below is proved by bytes moving, never by a commit id.
landed() {
  local tree="$1" note="$2"
  if cmp -s "$SUBJECT/$R" "$tree/$R"; then
    bad "SABOTAGE DID NOT LAND — $note"
    return 1
  fi
  return 0
}

echo "banked-breaks: subject $SUBJECT"
echo

# ── The good path, with the real sweeps. Every case below is unreadable
#    without it, and it is the only one that touches the real gatherers. ─────

T="$WORK/clean"; fresh_tree "$T"
run_in "$T"
CLEAN_OUT="$OUT"; CLEAN_CODE=$CODE
if [[ $CLEAN_CODE -eq 2 ]] && grep -q 'HOLES' <<<"$CLEAN_OUT"; then
  ok "the pristine tower reports standing holes, exit 2 — today's expected state"
else
  bad "the pristine tower did not report holes (exit $CLEAN_CODE) — every case below is unreadable"
  printf '%s\n' "$CLEAN_OUT" | sed 's/^/      /'
fi

# This case must be answered by words only a real run can produce, and its
# first form was not. Sabotaging `askGatherer` to return AGREES without
# spawning anything left it **green** — it asked whether the report said
# GATHERED, which a tool that trusts the field says just as readily. The
# needle is each sweep's own sentence now: `banked.js` cannot invent it,
# because it comes back on the gatherer's stdout or it does not come at all.
if grep -q 'sweep: AGREES — the published witness is what this sweep found' <<<"$CLEAN_OUT" &&
   grep -q 'drift-sweep: AGREES — the published witness is what this sweep found' <<<"$CLEAN_OUT"; then
  ok "both real gatherers were actually run — each quoted back its own verdict"
else
  bad "a real gatherer's own words are missing — the tool is reading fields, not running files"
fi

if ! grep -q 'DIFFERS' <<<"$CLEAN_OUT"; then
  ok "nothing on the pristine tower says DIFFERS — exit 1 is unspent"
else
  bad "the pristine tower says DIFFERS — a banked number has moved, or the fork is broken"
fi

# ── Case 1 — a gatherer that disagrees takes exit 1, and outranks the holes ──
#
# The fork is the point. A tower with a standing hole AND a moved number must
# report the moved number, because one is an alarm and one is a state.

T="$WORK/differs"; fresh_tree "$T"
stub_gatherers "$T" DIFFERS 1
if grep -q 'DIFFERS' "$T/tools/cross-check-sweep.js"; then
  run_in "$T"
  if [[ $CODE -eq 1 ]] && grep -q 'DIFFERS — 2 banked number' <<<"$OUT"; then
    ok "a gatherer saying DIFFERS takes exit 1, and outranks the standing holes"
  else
    bad "a disagreeing gatherer got exit $CODE — a moved number read as a standing state"
    printf '%s\n' "$OUT" | sed 's/^/      /'
  fi
else
  bad "SABOTAGE DID NOT LAND — the DIFFERS stub was not written"
fi

# ── Case 2 — a gatherer that is named and absent ─────────────────────────────

T="$WORK/missing"; fresh_tree "$T"
stub_gatherers "$T"
rm -f "$T/tools/cross-check-sweep.js"
if [[ ! -e "$T/tools/cross-check-sweep.js" ]]; then
  run_in "$T"
  if [[ $CODE -eq 2 ]] && grep -q 'UNASKABLE' <<<"$OUT" &&
     grep -q 'is named and is not in this tree' <<<"$OUT"; then
    ok "a gatherer named and absent is UNASKABLE, not silently skipped"
  else
    bad "a missing gatherer was not caught (exit $CODE)"
  fi
else
  bad "SABOTAGE DID NOT LAND — the gatherer was not removed"
fi

# ── Case 3 — a gatherer that runs, exits 0, and says nothing ─────────────────
#
# This is the one that would read as a pass if the tool trusted an exit code.
# Silence is not a witness.

T="$WORK/silent"; fresh_tree "$T"
cat > "$T/tools/cross-check-sweep.js" <<'EOF'
#!/usr/bin/env node
console.log('sweep: ran, and had no opinion at all.');
process.exit(0);
EOF
stub_gatherers "$T" AGREES 0
cat > "$T/tools/cross-check-sweep.js" <<'EOF'
#!/usr/bin/env node
console.log('sweep: ran, and had no opinion at all.');
process.exit(0);
EOF
if grep -q 'no opinion' "$T/tools/cross-check-sweep.js"; then
  run_in "$T"
  if grep -q 'UNASKABLE' <<<"$OUT" && grep -q 'neither AGREES nor DIFFERS' <<<"$OUT"; then
    ok "a gatherer that exits 0 saying nothing is UNASKABLE — silence is not agreement"
  else
    bad "a silent exit 0 was read as agreement (exit $CODE)"
  fi
else
  bad "SABOTAGE DID NOT LAND — the silent stub was not written"
fi

# ── Case 4 — a witness that names no gatherer at all ─────────────────────────
#
# Asked of a witness that HAS one today, so the case is about the question
# being put to every witness rather than about the one already known to fail.

T="$WORK/untooled"; fresh_tree "$T"
stub_gatherers "$T"
perl -0pi -e "s/    tool: 'tools\/cross-check-sweep\.js'\n//" "$T/$R"
if landed "$T" "the cross-check tool field was not removed"; then
  if ! grep -q "tools/cross-check-sweep.js'" "$T/$R"; then
    run_in "$T"
    UNGATHERED_N="$(grep -c 'UNGATHERED' <<<"$OUT")"
    if [[ $CODE -eq 2 && $UNGATHERED_N -eq 2 ]]; then
      ok "a second witness losing its gatherer is caught — the question is put to each"
    else
      bad "only $UNGATHERED_N witness reported UNGATHERED (exit $CODE) — expected 2"
    fi
  else
    bad "SABOTAGE DID NOT LAND — the tool field survived the substitution"
  fi
fi

# ── Case 5 — a witness with no date at all ───────────────────────────────────

T="$WORK/undated"; fresh_tree "$T"
stub_gatherers "$T"
perl -0pi -e "s/    sweptOn: '2026-09-03',\n//" "$T/$R"
if landed "$T" "the cross-check sweptOn was not removed"; then
  run_in "$T"
  if grep -q 'UNDATED' <<<"$OUT" && [[ $CODE -eq 2 ]]; then
    ok "a witness with no date is UNDATED — a banked fact with no date reads as a law"
  else
    bad "an undated witness was not caught (exit $CODE)"
  fi
fi

# ── Case 6a — the growth question has a non-empty domain to begin with ───────
#
# Case 6 watches for a line going away. If the line was never there, case 6
# is answered by nothing at all and passes for free (Day 27, Day 34).

if grep -q 'OUTGROWN' <<<"$CLEAN_OUT"; then
  ok "the pristine tower does say OUTGROWN — case 6 has something to lose"
else
  bad "the pristine tower says nothing about growth — case 6 below is vacuous"
fi

# ── Case 6 — dropping the domain declaration must not buy silence ────────────

T="$WORK/undeclared"; fresh_tree "$T"
stub_gatherers "$T"
perl -0pi -e "s/    domainIsInstrument: true\n//" "$T/$R"
if landed "$T" "domainIsInstrument was not removed"; then
  # The word also stands in the comment above the object, so the assertion
  # must name the field and not the word. This case failed on its first run
  # for exactly that, and it is the fault it is written to watch for.
  if ! grep -q 'domainIsInstrument: true' "$T/$R"; then
    run_in "$T"
    if ! grep -q 'OUTGROWN' <<<"$OUT"; then
      ok "dropping domainIsInstrument does silence the growth question — it is a declaration"
      ok "  and that silence is exactly why case 6 exists: nothing else would notice"
    else
      bad "OUTGROWN fired without the declaration — the tool is not reading the field"
    fi
  else
    bad "SABOTAGE DID NOT LAND — the declaration survived"
  fi
fi

# ── Case 7 — the birth count is read off the record, never typed ─────────────

T="$WORK/forward"; fresh_tree "$T"
stub_gatherers "$T"
perl -0pi -e "s/    gathered: '2026-09-10',/    gathered: '2099-01-01',/" "$T/$R"
if landed "$T" "the gathered date was not moved"; then
  run_in "$T"
  if grep -q 'no path has been born since it was gathered' <<<"$OUT" &&
     ! grep -q 'OUTGROWN' <<<"$OUT"; then
    ok "moving the gathered date past every birthday quiets the growth count — it is read"
  else
    bad "the growth count did not follow the gathered date — it is typed, not read"
    printf '%s\n' "$OUT" | sed 's/^/      /'
  fi
fi

T="$WORK/backward"; fresh_tree "$T"
stub_gatherers "$T"
perl -0pi -e "s/    gathered: '2026-09-10',/    gathered: '2026-08-01',/" "$T/$R"
if landed "$T" "the gathered date was not backdated"; then
  run_in "$T"
  BORN_N="$(grep -c '(born 20' <<<"$OUT")"
  if [[ $BORN_N -gt 2 ]]; then
    ok "backdating it widens the count to $BORN_N paths — read off PATH_INTRODUCED, not typed"
  else
    bad "backdating the witness listed $BORN_N paths — expected more than the live 2"
  fi
fi

# ── Case 8 — no witnesses at all is a fault, never a clean bill ──────────────
#
# Day 27's empty domain, asked of this tool's own discovery rule. Rename the
# export keys and the tool finds nothing; finding nothing must not exit 0.

T="$WORK/nowitness"; fresh_tree "$T"
stub_gatherers "$T"
perl -0pi -e "s/^(\s+)([A-Z_]+)_WITNESS: /\$1\$2_WITNES: /mg" "$T/$R"
if landed "$T" "the export keys were not renamed"; then
  # Ask the module what it exports rather than asking the text what it says,
  # and print the survivors if there are any — a fixture that failed to build
  # must say what it built instead, or the case below is unreadable.
  SURVIVORS="$(cd "$T" && node -e 'const R=require("./reckoning/reckoning.js");
    console.log(Object.keys(R).filter(function (k) { return /_WITNESS$/.test(k); }).join(","));' 2>&1)"
  if [[ -z "$SURVIVORS" ]]; then
    run_in "$T"
    if [[ $CODE -ne 0 ]] && grep -q 'NO WITNESSES' <<<"$OUT" &&
       grep -q 'that is not a clean run' <<<"$OUT"; then
      ok "finding no witnesses exits $CODE and refuses to read as clean"
    else
      bad "an empty witness list gave exit $CODE — an empty domain said yes"
    fi
  else
    bad "SABOTAGE DID NOT LAND — these _WITNESS exports survived: $SURVIVORS"
  fi
fi

# ── Case 8b — a gatherer that hangs is bounded, and the bound is real ────────
#
# Ember's, found by reading `banked.js` as an unfriendly reader on the day it
# was written. `spawnSync`'s `timeout` is not a bound by itself: its default
# `killSignal` is SIGTERM, a gatherer can trap SIGTERM and ignore it, and
# `spawnSync` does not return until the child actually exits. So a gatherer
# that hangs hangs the whole tool, for ever, silently, spending none of the
# three exit codes the fork exists to keep apart — the worst outcome available
# to this file. SIGKILL cannot be trapped.
#
# The case is written to fail against the pre-fix tool rather than to pass
# against this one: `timeout` around the run is the witness. If the bound is
# real the tool returns on its own and `timeout` never fires; if a later hand
# puts SIGTERM back, `timeout` kills it and 124 is the tell.

T="$WORK/hang"; fresh_tree "$T"
cat > "$T/tools/cross-check-sweep.js" <<'EOF'
#!/usr/bin/env node
// Traps the polite signal and refuses to die of it.
process.on('SIGTERM', function () {});
setInterval(function () {}, 1000);
EOF
cat > "$T/tools/drift-gap-sweep.js" <<'EOF'
#!/usr/bin/env node
console.log('stub: AGREES — a stub standing in for the real sweep.');
process.exit(0);
EOF
if grep -q 'SIGTERM' "$T/tools/cross-check-sweep.js"; then
  HANG_OUT="$(cd "$T" && BANKED_GATHERER_TIMEOUT_MS=3000 timeout 60 node tools/banked.js 2>&1)"
  HANG_CODE=$?
  if [[ $HANG_CODE -eq 124 ]]; then
    bad "a gatherer that traps SIGTERM hung the tool — the timeout is a comment, not a bound"
  elif grep -q 'UNASKABLE' <<<"$HANG_OUT"; then
    ok "a gatherer that traps SIGTERM is killed anyway and reported UNASKABLE"
  else
    bad "a hanging gatherer returned $HANG_CODE without being called unaskable"
    printf '%s\n' "$HANG_OUT" | sed 's/^/      /'
  fi
else
  bad "SABOTAGE DID NOT LAND — the SIGTERM-trapping gatherer was not written"
fi

# ── Case 8c — a witness-shaped object under the wrong name is not invisible ──
#
# Ember's, the other half of the same unfriendly-reading pass: the discovery
# rule is a convention, not a list, and Gnomon asked whether that is really a
# different fault from a hand-kept list going blind. Answer: smaller, but not
# absent — and this is the realistic shape of it. Every entry in `var api =
# {...}` here is self-same (`METHOD: METHOD`, `CLAIM_INTRODUCED:
# CLAIM_INTRODUCED`, and DRIFT_TOLERANCE_WITNESS's own line), so the way this
# actually happens is a hand renaming the `var` and carrying the name straight
# through to the export, not a hand deliberately splitting the two. Rename
# DRIFT_TOLERANCE_WITNESS to DRIFT_TOLERANCE_INFO everywhere, both the
# declaration and its self-same export line, and it keeps its `gathered:`
# field but no longer ends `_WITNESS` anywhere. The per-witness loop drops to
# 2 found; only the source scan can still see it.

T="$WORK/misnamed"; fresh_tree "$T"
stub_gatherers "$T"
perl -0pi -e "s/\bDRIFT_TOLERANCE_WITNESS\b/DRIFT_TOLERANCE_INFO/g" "$T/$R"
if landed "$T" "DRIFT_TOLERANCE_WITNESS was not renamed"; then
  SEEN="$(cd "$T" && node -e 'const R=require("./reckoning/reckoning.js");
    console.log(Object.keys(R).filter(function (k) { return /_WITNESS$/.test(k); }).length);')"
  if [[ "$SEEN" == "2" ]]; then
    run_in "$T"
    if grep -q 'MISNAMED' <<<"$OUT" && grep -q 'DRIFT_TOLERANCE_INFO' <<<"$OUT" &&
       [[ $CODE -eq 2 ]]; then
      ok "a witness-shaped object renamed off _WITNESS is caught by the source scan anyway"
    else
      bad "a misnamed witness object went unreported (exit $CODE)"
      printf '%s\n' "$OUT" | sed 's/^/      /'
    fi
  else
    bad "SABOTAGE DID NOT LAND as intended — $SEEN _WITNESS keys still found (expected 2)"
  fi
fi

# ── Case 9 — a mistyped flag must never spend exit 1 or exit 2 ───────────────

T="$WORK/flags"; fresh_tree "$T"
run_in "$T" --nonsense
if [[ $CODE -eq 3 ]] && grep -q 'INVALID' <<<"$OUT"; then
  ok "an unknown flag is refused with INVALID and exit 3 — 1 and 2 are spoken for"
else
  bad "an unknown flag got exit $CODE — it spent a code a real finding lives on"
fi

run_in "$T" --help
if [[ $CODE -eq 0 ]] && grep -q 'usage' <<<"$OUT"; then
  ok "--help prints the surface and exits 0"
else
  bad "--help did not print the surface (exit $CODE)"
fi

run_in "$T" --list
# `UNGATHERED` contains `GATHERED`, so the needle has to be anchored at the
# word this case is actually about. The first run of this suite read the
# third witness's honest UNGATHERED as a claim about a gatherer that had not
# been run — a check about one word answered by a longer word containing it.
if [[ $CODE -eq 2 ]] && grep -q 'not run (--list)' <<<"$OUT" &&
   ! grep -qE '(^|[^N])GATHERED —' <<<"$OUT"; then
  ok "--list names the gatherers without running them, and claims nothing about them"
else
  bad "--list did not hold its tongue about gatherers it never ran (exit $CODE)"
fi

echo
printf 'banked-breaks: %d ok, %d failed\n' "$PASS" "$FAIL"
[[ $FAIL -eq 0 ]] || exit 1
echo "ALL OK"
