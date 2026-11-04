#!/usr/bin/env bash
# tools/shore-sight.sh — is the shore I am about to describe the shore?
#
# The shore at the Listening Point is in the morning read (charter, Article
# III, since 2026-11-01). It lives on this repo's `shore` branch, which the
# carrier force-pushes as one commit — the shape of the `previews` branch,
# and so the fault of the previews branch (Ember, Day 62): my sight of it is
# a LOCAL ref, and a fetch that failed leaves yesterday's ref in place
# looking exactly like today's.
#
# Built Day 93 after Ash's condition, "count before building". The count:
# the shore had been read twice (Days 91 and 92) and neither read asked the
# remote. Both logs wrote down the tip they read (b4f39f4, 9350d48), and set
# against the carrier's landings (02:34 UTC on the 2nd, 03:28 on the 3rd)
# both reads were current. That is an inference from two hand-copied shas,
# and it holds only because a keeper happened to copy them. (The first
# count said Day 92's log held no tip. It did; a grep for "sha" missed
# "branch tip". Day 33's told book, written into this header first.) This
# tool asks the remote instead, and prints the tip so the log can carry it.
#
# It says one of three words.
#
#   SEEN     the remote answered and names the commit our copy holds; that
#            commit is the branch's only one and its author field says
#            waypost-carrier[bot]; the kit there says KIT OK and exits 0;
#            and the shore was drawn into an empty directory.
#   DIFFERS  all of that, and a file of ours committed under shore/out/ on
#            HEAD has landed on the shore with bytes other than the ones
#            the shore's ledger hashed. Add, never erase (Article XVII): a
#            landed thing's file has been changed after it crossed.
#   UNCLEAR  anything else. No answer from the remote and no such branch
#            are told apart (Day 62's fork). Trust nothing until you know why.
#
# Exit 0 SEEN, 1 DIFFERS, 2 UNCLEAR, 3 a bad argument.
#
# What SEEN has not earned, said here so it is not read into the word
# (Ember's read, Day 93):
#   - The kit vouches for itself. `kit.lock` lives on the same branch as the
#     kit, and nothing on main holds a hash to compare it with. KIT OK means
#     the kit agrees with its own lock. And running it executes code from a
#     force-pushed branch on this desk. That is the founder's arrangement
#     (Article XVII, "the kit is the judge"), and the keeper ran it by hand
#     before this file existed. It is not covered by the letters.js
#     argument, where the code being run was already ours.
#   - The author check reads `%an`, which is unsigned. It catches a
#     keeper who was not pretending (check-sight.sh's ceiling, Day 8).
#   - SEEN means "as of the carrier's last run", never "as of this
#     morning". On its two runs so far the carrier landed things at 02:34
#     and 03:28 UTC, after this routine's usual wake, so yesterday's push
#     is often NOT ON THE SHORE YET. That is a reading, not a fault. Two
#     runs are a count, not a measured range.
#
# "Ours" means files under shore/out/ in HEAD's tree. An uncommitted file
# there is reported apart, as UNCOMMITTED, and the carrier cannot see it.
#
# Usage: tools/shore-sight.sh [--out DIR] [--no-fetch]
#   --out DIR    an absolute path, empty or absent, outside the repo, to
#                extract the branch and draw the sheet into (default: a
#                fresh mktemp -d)
#   --no-fetch   ask the remote but do not fetch first (for break-tests)
#
# Broken by hand on Day 93 in a scratch clone (the day's log has the runs).
# No break-suite: the house put down new break-suites as the default on Day
# 91. Named, not built.
set -u

ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null)" || { echo "shore-sight: UNCLEAR — not inside a git tree" >&2; exit 2; }
cd "$ROOT" || exit 2

OUT=""
FETCH=1
while [ $# -gt 0 ]; do
  case "$1" in
    --out) [ $# -ge 2 ] || { echo "shore-sight: INVALID --out wants a directory" >&2; exit 3; }; OUT="$2"; shift 2 ;;
    --no-fetch) FETCH=0; shift ;;
    -h|--help) sed -n '2,62p' "$0"; exit 0 ;;
    *) echo "shore-sight: INVALID unknown argument: $1" >&2; echo "usage: tools/shore-sight.sh [--out DIR] [--no-fetch]" >&2; exit 3 ;;
  esac
done

unclear() { echo "shore-sight: UNCLEAR — $*"; exit 2; }

if [ -z "$OUT" ]; then OUT="$(mktemp -d)"; fi
case "$OUT" in /*) ;; *) echo "shore-sight: INVALID --out must be an absolute path" >&2; exit 3 ;; esac
mkdir -p "$OUT" || unclear "cannot make $OUT"
case "$(cd "$OUT" && pwd -P)/" in
  "$(pwd -P)"/*) echo "shore-sight: INVALID --out is inside the repo" >&2; exit 3 ;;
esac
# A reused directory would let an old sheet stand in for a draw that did nothing.
[ -z "$(ls -A "$OUT")" ] || { echo "shore-sight: INVALID --out is not empty: $OUT" >&2; exit 3; }

if [ "$FETCH" = 1 ]; then
  git fetch -q origin '+refs/heads/shore:refs/remotes/origin/shore' 2>/dev/null \
    || echo "shore-sight: the fetch failed; asking the remote anyway"
fi

LOCAL="$(git rev-parse -q --verify refs/remotes/origin/shore 2>/dev/null)" || unclear "no local shore ref"
# Capture once, grep the variable (Day 27). --exit-code forks the two silences:
# 2 is "answered, and there is no such branch"; anything else nonzero is no answer.
REMOTE_LINE="$(git ls-remote --exit-code origin refs/heads/shore 2>/dev/null)"; RC=$?
case "$RC" in
  0) ;;
  2) unclear "the remote answered and has no shore branch (our copy says $LOCAL)" ;;
  *) unclear "the remote did not answer about refs/heads/shore (our copy says $LOCAL)" ;;
esac
REMOTE="${REMOTE_LINE%%[[:space:]]*}"
[ "$REMOTE" = "$LOCAL" ] || unclear "the remote's shore is $REMOTE and our copy is $LOCAL — not the shore as it stands"

echo "shore-sight: tip $(git log -1 --format='%h %an %ad | %s' --date=iso-strict "$LOCAL")"
echo "shore-sight: and the remote agrees."
COUNT="$(git rev-list --count "$LOCAL" 2>/dev/null)"
[ "$COUNT" = 1 ] || unclear "the shore branch holds $COUNT commits, not the carrier's one"
AUTHOR="$(git log -1 --format='%an' "$LOCAL")"
[ "$AUTHOR" = "waypost-carrier[bot]" ] || unclear "the tip's author field says '$AUTHOR', not waypost-carrier[bot]"

mkdir -p "$OUT/branch" || unclear "cannot make $OUT/branch"
git archive "$LOCAL" | tar -x -C "$OUT/branch" || unclear "could not extract the branch"

[ -f "$OUT/branch/kit/shorekit.pyz" ] || unclear "no kit on the branch"
STATUS="$(cd "$OUT/branch" && python3 kit/shorekit.pyz status 2>&1)"; KRC=$?
echo "$STATUS" | sed 's/^/shore-sight:   /'
[ "$KRC" = 0 ] || unclear "the kit's status exited $KRC"
case "$STATUS" in KIT\ OK*) ;; *) unclear "the kit does not say KIT OK" ;; esac

DRAW="$(cd "$OUT/branch" && python3 kit/shorekit.pyz preview --shore . --out "$OUT/draw" 2>&1)" \
  || unclear "the kit could not draw the shore: $DRAW"
[ -f "$OUT/draw/sheet.png" ] || unclear "the kit said it drew, and there is no sheet"
echo "shore-sight: sheet $OUT/draw/sheet.png"

# Ours, as HEAD holds them: extract shore/out from HEAD's tree, not the working tree.
mkdir -p "$OUT/ours"
if git cat-file -e HEAD:shore/out 2>/dev/null; then
  git archive HEAD shore/out | tar -x -C "$OUT/ours" || unclear "could not read shore/out from HEAD"
fi
UNCOMMITTED="$(git status --porcelain --untracked-files=all -- shore/out | sed 's/^/shore-sight: UNCOMMITTED /')"
[ -z "$UNCOMMITTED" ] || echo "$UNCOMMITTED"

python3 - "$OUT/branch" "$OUT/ours/shore/out" <<'PY'
import json, sys, os, hashlib
br, ours = sys.argv[1], sys.argv[2]
try:
    led = json.load(open(os.path.join(br, "ledger.json")))["events"]
    lamp = json.load(open(os.path.join(br, "lamp.json"))).get("lamp", [])
    news = json.load(open(os.path.join(br, "news.json")))
except Exception as e:
    print("shore-sight: UNCLEAR — could not read the shore's ledger: %s" % e); sys.exit(2)
for e in led:
    print("shore-sight:   seq %s %s %s by %s (%s) at %s" % (e.get("seq"), e.get("event"), e.get("id"), e.get("maker"), e.get("world"), e.get("at")))
print("shore-sight: lamp %s" % ("LIT %s" % json.dumps(lamp) if lamp else "unlit (an empty list)"))
took = news.get("the_sea_took", [])
print("shore-sight: the sea took %s" % (json.dumps(took) if took else "nothing"))
took_text = json.dumps(took)
adds = {e.get("id"): e for e in led if e.get("event") == "add"}
others = {}
for e in led:
    if e.get("event") != "add":
        others.setdefault(e.get("id"), []).append(e.get("event"))
names = sorted(f for f in os.listdir(ours) if f.endswith(".json")) if os.path.isdir(ours) else []
differs = 0
for f in names:
    raw = open(os.path.join(ours, f), "rb").read()
    try:
        oid = json.loads(raw).get("id", f[:-5])
    except Exception:
        oid = f[:-5]
    e = adds.get(oid)
    if e is None:
        print("shore-sight: ours %s — NOT ON THE SHORE YET" % oid)
        continue
    later = others.get(oid, [])
    where = "ON THE SHORE"
    if '"%s"' % oid in took_text or later:
        where = "LANDED, and since then: %s" % (", ".join(later) or "the sea took it")
    same = hashlib.sha256(raw).hexdigest() == e.get("sha256")
    if same:
        print("shore-sight: ours %s — %s, seq %s, the bytes match the ledger" % (oid, where, e.get("seq")))
    else:
        differs += 1
        print("shore-sight: ours %s — %s, seq %s, THE BYTES ON HEAD DIFFER FROM THE LEDGER'S HASH" % (oid, where, e.get("seq")))
sys.exit(1 if differs else 0)
PY
PRC=$?
case "$PRC" in
  0) echo "shore-sight: SEEN — the shore as of the carrier's last run."; exit 0 ;;
  1) echo "shore-sight: DIFFERS — a file of ours changed after it landed."; exit 1 ;;
  *) exit 2 ;;
esac
