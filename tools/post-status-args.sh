#!/usr/bin/env bash
# tools/post-status-args.sh — walk the whole surface `tools/post-status.js`
# meets, and after every case ask the question that matters about a tool whose
# default action is a *read*: **did it answer the question that was typed?**
#
#   ./tools/post-status-args.sh            check the working tree's copy
#   ./tools/post-status-args.sh /some/tree check another copy of the tower
#
# Three rules are built into the shape of this file.
#
# **The case list comes from the tool's surface, not from a story about the
# fault.** Day 10: a test drawn from the report of a bug can only re-close the
# report, because it inherits the route the finder happened to walk. Both
# spirits handed the keeper the same four cases this morning; those four are
# in here, and so are a dozen the report never mentioned — near-miss flags, an
# empty string, an equals sign, arguments repeated, arguments in the other
# order, and the door that is not the command line.
#
# **A refusal must speak in this file's own voice.** Exit 2 and `INVALID`.
# Exit 1 already means something in this house — `tools/shelf-agrees.js` reads
# it as *the two roads disagree* — so a mistyped flag must never spend it.
#
# **A read tool still has to leave the tower alone.** Every case runs against a
# copy in a `mktemp -d`, and the copy's bytes are checked at the end. This tool
# writes nothing today, which is exactly the assumption worth having a test for
# rather than a memory of.
set -u

SRC="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$WORK/tools"
cp "$SRC/tools/post-status.js" "$WORK/tools/"
cp -R "$SRC/letters" "$WORK/letters"

pristine="$(cd "$WORK" && find . -type f -exec sha256sum {} \; | sort | sha256sum)"
fails=0

# case_run <name> <expected-exit> <regex the output must match> -- args...
case_run() {
  local name="$1" want_exit="$2" want_match="$3"; shift 4
  local out; out="$(cd "$WORK" && node tools/post-status.js "$@" 2>&1)"; local got_exit=$?

  local bad=""
  [ "$got_exit" = "$want_exit" ] || bad="exit $got_exit, wanted $want_exit"
  # `--` before the pattern: several of the patterns below begin with a dash,
  # and grep would read them as its own flags. The first run of this file lost
  # a case to exactly that and reported it as a fault in the tool.
  if ! printf '%s\n' "$out" | grep -qE -- "$want_match"; then
    bad="${bad:+$bad; }output did not match /$want_match/"
  fi

  if [ -n "$bad" ]; then
    fails=$((fails + 1))
    echo "FAIL  $name — $bad"
    printf '%s\n' "$out" | sed 's/^/        /'
  else
    echo "ok    $name  (exit $got_exit)"
  fi
}

INVALID='^post-status: INVALID — '

echo "-- a word the tool does not know is not consent --"
# The four the spirits found this morning, and then the ones nobody reported.
case_run "unknown flag"          2 "$INVALID" -- --self gnomon --nonsense-flag
case_run "junk after --shelf"    2 "$INVALID" -- --self gnomon --shelf junk
case_run "bare word"             2 "$INVALID" -- --self gnomon gnomon
case_run "near-miss flag"        2 "$INVALID" -- --self gnomon --shel
case_run "near-miss keeper flag" 2 "$INVALID" -- --selff gnomon
case_run "empty string"          2 "$INVALID" -- --self gnomon ""
case_run "lone dash"             2 "$INVALID" -- --self gnomon -
case_run "double dash"           2 "$INVALID" -- --self gnomon --

echo
echo "-- the one door that already had a guard, and its near misses --"
case_run "no arguments"          2 "$INVALID" --
case_run "--self with no value"  2 "needs a keeper after it" -- --self
case_run "--self a stranger"     2 "is not a keeper this tool knows" -- --self ash
case_run "--self with equals"    2 "not after an equals sign" -- --self=gnomon
case_run "--self eats a flag"    2 "is not a keeper this tool knows" -- --self --shelf
case_run "--shelf without self"  2 "--self is required" -- --shelf

echo
echo "-- nothing is discarded in silence --"
# The old reader asked indexOf for the first --self and never looked again, so
# the second keeper on the line vanished without a word. A dropped argument is
# the quietest way for a tool to answer a question nobody asked.
case_run "--self twice"          2 "given twice" -- --self wren --self gnomon
case_run "--shelf twice"         2 "given twice" -- --self gnomon --shelf --shelf

echo
echo "-- --help is a question, and it is not the report --"
case_run "--help"                0 '^usage: node tools/post-status\.js' -- --help
case_run "-h"                    0 '^usage: node tools/post-status\.js' -- -h
# Help outranks the report: asking what the tool does must not also run it.
out="$(cd "$WORK" && node tools/post-status.js --self gnomon --help 2>&1)"; ex=$?
if [ "$ex" = 0 ] && ! printf '%s\n' "$out" | grep -q 'TURN='; then
  echo "ok    --self with --help  (exit 0, no report)"
else
  fails=$((fails + 1))
  echo "FAIL  --self with --help — exit $ex; help must not also print the report"
  printf '%s\n' "$out" | sed 's/^/        /'
fi

echo
echo "-- and the answers the tower asks for every morning still come back --"
case_run "gnomon's turn"         0 'post-status: (TURN=|SEALED )' -- --self gnomon
# `wren` is a keeper this tool knows, and saying so is all this case claims.
# Run from *Gnomon's* tower it then reports TURN=HELD and exits 2, which is
# the carrier working, not the parser failing: every letter in this `out/` is
# in Gnomon's hand, and from Wren's side of the post that outbox is
# unreadable. The distinction the case is here to hold is between a refusal of
# the argument (INVALID, above) and a verdict about the letters.
case_run "wren is a keeper"      2 'post-status: TURN=HELD' -- --self wren
case_run "--shelf"               0 '^shelf: ' -- --self gnomon --shelf
case_run "--shelf first"         0 '^shelf: ' -- --shelf --self gnomon

echo
echo "-- the other door into the file --"
# The command line is not the only way in. Until today the body ran
# unconditionally at the foot of the file, so `require()` ran the whole report
# and then called process.exit() — killing whatever imported it.
out="$(cd "$WORK" && node -e "require('./tools/post-status.js'); console.log('the importer is still alive')" 2>&1)"; ex=$?
if [ "$ex" = 0 ] && printf '%s\n' "$out" | grep -q 'still alive' && ! printf '%s\n' "$out" | grep -q 'TURN='; then
  echo "ok    require() neither reports nor exits  (exit $ex)"
else
  fails=$((fails + 1))
  echo "FAIL  require() — exit $ex; importing this file must not report and must not exit"
  printf '%s\n' "$out" | sed 's/^/        /'
fi

echo
now="$(cd "$WORK" && find . -type f -exec sha256sum {} \; | sort | sha256sum)"
if [ "$now" = "$pristine" ]; then
  echo "ok    the tree is untouched  (a read tool that writes is a different tool)"
else
  fails=$((fails + 1))
  echo "FAIL  the tree changed under a tool that only reads"
fi

echo
if [ "$fails" = 0 ]; then
  echo "post-status-args: every case holds."
else
  echo "post-status-args: $fails case(s) failed."
fi
exit $([ "$fails" = 0 ] && echo 0 || echo 1)
