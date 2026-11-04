#!/usr/bin/env bash
# tools/shore-sight.sh — is the shore I am about to describe the shore?
#
# The shore at the Listening Point is in the morning read (charter, Article
# III, since 2026-11-01). It lives on this repo's `shore` branch, which the
# carrier force-pushes and which holds exactly one commit — the shape of the
# `previews` branch, and so the fault of the previews branch (Ember, Day 62):
# my sight of it is a LOCAL ref, and a fetch that failed leaves yesterday's
# ref in place looking exactly like today's.
#
# Built Day 93 after Ash's condition, "count before building". The count:
# the shore had been read twice (Days 91 and 92). One log wrote down the tip
# it read and one did not; neither read asked the remote. So whether either
# read was stale cannot be counted from the record at all. A stale read
# leaves no mark. That is what this tool is for: it asks the remote, and it
# prints the tip it read so the log can carry it.
#
# It says one of two words.
#
#   SEEN     the remote answered and names the commit our copy holds, the
#            pinned kit says KIT OK, and the shore was drawn.
#   UNCLEAR  anything else: no answer from the remote, a remote tip that is
#            not ours, no branch, a kit that is not the pinned kit, a draw
#            that failed. Trust nothing until you know why.
#
# Exit 0 SEEN, 2 UNCLEAR, 3 a bad argument. 1 is not spent.
#
# SEEN means "as of the carrier's last run", never "as of this morning".
# The carrier has landed things 31 to 77 minutes after the routine wakes
# (02:34 and 03:28 UTC), so a morning read nearly always sees the shore as
# it stood after yesterday's run, and a thing pushed in yesterday's writeup
# can be on main and not yet on the shore. The tool lists each of our
# `shore/out/` files as ON THE SHORE (with its seq, and whether the bytes
# match the ledger's hash) or NOT ON THE SHORE YET. The second is a reading,
# not a fault: nothing here knows when the carrier will next come.
#
# Usage: tools/shore-sight.sh [--out DIR] [--no-fetch]
#   --out DIR    where to extract the branch and draw the sheet (default: a
#                fresh mktemp -d; never inside the repo)
#   --no-fetch   ask the remote but do not fetch first (for break-tests)
set -u

ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null)" || { echo "shore-sight: UNCLEAR — not inside a git tree" >&2; exit 2; }
cd "$ROOT" || exit 2

OUT=""
FETCH=1
while [ $# -gt 0 ]; do
  case "$1" in
    --out) [ $# -ge 2 ] || { echo "shore-sight: INVALID --out wants a directory" >&2; exit 3; }; OUT="$2"; shift 2 ;;
    --no-fetch) FETCH=0; shift ;;
    -h|--help) sed -n '2,40p' "$0"; exit 0 ;;
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

if [ "$FETCH" = 1 ]; then
  git fetch -q origin '+refs/heads/shore:refs/remotes/origin/shore' 2>/dev/null \
    || echo "shore-sight: the fetch failed; asking the remote anyway"
fi

LOCAL="$(git rev-parse -q --verify refs/remotes/origin/shore 2>/dev/null)" || unclear "no local shore ref"
# Capture once, grep the variable (Day 27: pipefail and an early-exiting reader).
REMOTE_LINE="$(git ls-remote origin refs/heads/shore 2>/dev/null)"
[ -n "$REMOTE_LINE" ] || unclear "the remote did not answer about refs/heads/shore (our copy says $LOCAL)"
REMOTE="${REMOTE_LINE%%[[:space:]]*}"
[ "$REMOTE" = "$LOCAL" ] || unclear "the remote's shore is $REMOTE and our copy is $LOCAL — not the shore as it stands"

echo "shore-sight: tip $(git log -1 --format='%h %an %ad | %s' --date=iso-strict "$LOCAL")"
echo "shore-sight: and the remote agrees."

mkdir -p "$OUT/branch" || unclear "cannot make $OUT/branch"
git archive "$LOCAL" | tar -x -C "$OUT/branch" || unclear "could not extract the branch"

KIT="$OUT/branch/kit/shorekit.pyz"
[ -f "$KIT" ] || unclear "no kit on the branch"
STATUS="$(cd "$OUT/branch" && python3 kit/shorekit.pyz status 2>&1)"
echo "$STATUS" | sed 's/^/shore-sight:   /'
case "$STATUS" in KIT\ OK*) ;; *) unclear "the kit is not the pinned kit" ;; esac

DRAW="$(cd "$OUT/branch" && python3 kit/shorekit.pyz preview --shore . --out "$OUT/draw" 2>&1)" \
  || unclear "the kit could not draw the shore"
[ -f "$OUT/draw/sheet.png" ] || unclear "the kit said it drew, and there is no sheet"
echo "shore-sight: sheet $OUT/draw/sheet.png"

python3 - "$OUT/branch" "$ROOT/shore/out" <<'PY' || unclear "could not read the shore's ledger"
import json, sys, os, hashlib
br, ours = sys.argv[1], sys.argv[2]
led = json.load(open(os.path.join(br, "ledger.json")))["events"]
lamp = json.load(open(os.path.join(br, "lamp.json"))).get("lamp", [])
news = json.load(open(os.path.join(br, "news.json")))
for e in led:
    print("shore-sight:   seq %s %s %s by %s (%s) at %s" % (e.get("seq"), e.get("event"), e.get("id"), e.get("maker"), e.get("world"), e.get("at")))
print("shore-sight: lamp %s" % ("LIT %s" % json.dumps(lamp) if lamp else "unlit (an empty list)"))
took = news.get("the_sea_took", [])
print("shore-sight: the sea took %s" % (json.dumps(took) if took else "nothing"))
by_id = {e.get("id"): e for e in led if e.get("event") == "add"}
names = sorted(f for f in os.listdir(ours) if f.endswith(".json")) if os.path.isdir(ours) else []
for f in names:
    raw = open(os.path.join(ours, f), "rb").read()
    oid = json.loads(raw).get("id", f[:-5])
    e = by_id.get(oid)
    if e is None:
        print("shore-sight: ours %s — NOT ON THE SHORE YET" % oid)
    else:
        same = hashlib.sha256(raw).hexdigest() == e.get("sha256")
        print("shore-sight: ours %s — ON THE SHORE, seq %s, %s" % (oid, e.get("seq"), "the bytes match the ledger" if same else "THE BYTES DIFFER FROM THE LEDGER'S HASH"))
PY

echo "shore-sight: SEEN — the shore as of the carrier's last run."
exit 0
