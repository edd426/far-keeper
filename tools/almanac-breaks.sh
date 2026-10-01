#!/usr/bin/env bash
# Break tools/almanac.js on purpose, in a scratch tree, against a stub host.
# Day 59. The air's suite in shape (Day 58), with the almanac's own traps:
# an answer on the wrong clock (Ember's: a zone slip would read as a sixty-
# minute finding), for the wrong day, or for a point other than the one asked.
#
#   ./tools/almanac-breaks.sh
#
# The tool is copied into a mktemp -d beside a copy of reckoning.js, so no
# case can write to the real reckoning/almanac.json (Day 10), and the real
# file's bytes are checked at the end regardless. The stub's answer is built
# from the coordinates and date the tool actually sent, so a good answer is
# the answer to the question asked; each bad one breaks exactly one thing.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REAL="$ROOT/reckoning/almanac.json"
REAL_SUM="$( [ -f "$REAL" ] && sha256sum "$REAL" | cut -d' ' -f1 || echo absent)"
T="$(mktemp -d)"
trap 'kill $STUB 2>/dev/null; rm -rf "$T"' EXIT
mkdir -p "$T/tools" "$T/reckoning"
cp "$ROOT/tools/almanac.js" "$T/tools/almanac.js"
cp "$ROOT/reckoning/reckoning.js" "$T/reckoning/reckoning.js"
DATE=2026-10-01

fails=0
ok()  { echo "ok    $1"; }
bad() { echo "FAIL  $1"; fails=$((fails + 1)); }

cat > "$T/stub.py" <<'PY'
import http.server, json, sys, time, urllib.parse
def good(q):
    lat, lon = [float(x) for x in q["coords"][0].split(",")]
    y, m, d = [int(x) for x in q["date"][0].split("-")]
    return {"apiversion": "4.0.1", "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {"data": {"year": y, "month": m, "day": d, "tz": float(q["tz"][0]), "isdst": False,
              "sundata": [{"phen": "Begin Civil Twilight", "time": "08:48"}, {"phen": "Rise", "time": "09:36"},
                          {"phen": "Upper Transit", "time": "15:16"}, {"phen": "Set", "time": "20:56"},
                          {"phen": "End Civil Twilight", "time": "21:43"}]}}}
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def send(self, code, body, ctype="application/json"):
        b = body.encode() if isinstance(body, str) else body
        self.send_response(code); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        p, _, rest = self.path.partition("/api/")
        q = urllib.parse.parse_qs(urllib.parse.urlparse("/" + rest).query)
        g = good(q)
        dat = g["properties"]["data"]
        if p == "/good": return self.send(200, json.dumps(g))
        if p == "/refused": return self.send(400, json.dumps({"error": "Invalid coordinates"}))
        if p == "/html": return self.send(502, "<html>bad gateway</html>", "text/html")
        if p == "/wrongclock": dat["tz"] = -2.0; return self.send(200, json.dumps(g))
        if p == "/wrongday": dat["day"] = dat["day"] + 1; return self.send(200, json.dumps(g))
        if p == "/wrongpoint": g["geometry"]["coordinates"] = [-51.72, 64.18]; return self.send(200, json.dumps(g))
        if p == "/badtime": dat["sundata"][1]["time"] = "9:36 a.m."; return self.send(200, json.dumps(g))
        if p == "/nodata": del g["properties"]["data"]; return self.send(200, json.dumps(g))
        if p == "/norise":
            dat["sundata"] = [{"phen": "Sun continuously above horizon", "time": None}]
            return self.send(200, json.dumps(g))
        if p == "/hang": time.sleep(5); return self.send(200, json.dumps(g))
        self.send(404, "{}")
http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
PY
PORT=$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])')
python3 "$T/stub.py" "$PORT" & STUB=$!
for _ in $(seq 50); do python3 -c "import socket;socket.create_connection(('127.0.0.1',$PORT),0.1)" 2>/dev/null && break; sleep 0.1; done

rows() { node -e "try{console.log(require('$T/reckoning/almanac.json').length)}catch(e){console.log(0)}"; }

# case NAME PATH EXPECTED_EXIT NEEDLE ROWS_ADDED [extra args...]
case_run() {
  local name="$1" path="$2" want="$3" needle="$4" added="$5"; shift 5
  local before after out code
  before=$(rows)
  out=$(FAR_KEEPER_ALMANAC_URL="http://127.0.0.1:$PORT$path" FAR_KEEPER_ALMANAC_TIMEOUT_MS=1000 \
        FAR_KEEPER_ALMANAC_DATE="$DATE" node "$T/tools/almanac.js" "$@" 2>&1); code=$?
  after=$(rows)
  if [ "$code" != "$want" ]; then bad "$name: exit $code, wanted $want — $out"; return; fi
  if ! grep -qF -- "$needle" <<<"$out"; then bad "$name: output lacks \"$needle\" — $out"; return; fi
  if [ $((after - before)) != "$added" ]; then bad "$name: appended $((after - before)) rows, wanted $added"; return; fi
  ok "$name (exit $code, +$added)"
}

case_run "a good answer is written"               /good       0 "rise 09:36, set 20:56 UTC" 1
case_run "--print writes nothing"                 /good       0 "not a sighting" 0 --print
case_run "a refusal carries the host's reason"    /refused    1 "answered 400: Invalid coordinates" 1
case_run "a page that is not JSON"                /html       1 "not JSON" 1
case_run "an answer on another clock"             /wrongclock 1 "on clock offset -2, not the 0 asked" 1
case_run "an answer for another day"              /wrongday   1 "not $DATE" 1
case_run "an answer for a rounded point"          /wrongpoint 1 "not the point asked" 1
case_run "a time that is not a clock time"        /badtime    1 "not a clock time" 1
case_run "an answer with no data in it"           /nodata     1 "carried no data" 1
case_run "no rise or set is a row, not a failure" /norise     0 "no rise or set printed" 1
case_run "a host that does not answer in time"    /hang       1 "no answer within 1 seconds" 1
case_run "an unknown flag"                        /good       2 "INVALID" 0 --bogus
case_run "a repeated flag"                        /good       2 "INVALID" 0 --print --print

DEAD=$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])')
before=$(rows)
out=$(FAR_KEEPER_ALMANAC_URL="http://127.0.0.1:$DEAD" FAR_KEEPER_ALMANAC_DATE="$DATE" node "$T/tools/almanac.js" 2>&1); code=$?
if [ "$code" = 1 ] && grep -q "could not be reached" <<<"$out" && [ $(( $(rows) - before )) = 1 ]; then
  ok "an unreachable host is a failure row, not a crash (exit 1)"
else bad "unreachable host: exit $code — $out"; fi

# Every row carries the wager, computed before the ask, and it is the
# instrument's own; failure rows carry no printed minute.
node -e "
const R=require('$T/reckoning/reckoning.js');
const rows=require('$T/reckoning/almanac.json');
const c=R.almanacComparands('$DATE',R.STANDING.place);
const wantA=JSON.stringify(R.printedLengthsFor(c.A.dayLengthMinutes)), wantB=JSON.stringify(R.printedLengthsFor(c.B.dayLengthMinutes));
const noWager=rows.filter(r=>!r.wager||JSON.stringify(r.wager.A.allowed)!==wantA||JSON.stringify(r.wager.B.allowed)!==wantB);
const late=rows.filter(r=>r.wager&&Date.parse(r.wager.computedAt)>Date.parse(r.fetchedAt));
const failed=rows.filter(r=>r.failed), dirty=failed.filter(r=>'printedUTC' in r||!r.fetchedAt||!r.source);
if(wantA===wantB){console.log('FAIL  the fixture date cannot tell the two sets apart');process.exit(1)}
if(noWager.length||late.length||failed.length!==9||dirty.length){console.log('FAIL  rows: '+noWager.length+' without the right wager, '+late.length+' wagered after the ask, '+failed.length+' failures ('+dirty.length+' malformed)');process.exit(1)}
console.log('ok    every row carries the wager '+wantA+' / '+wantB+', stamped no later than its ask; nine failure rows, none with a minute');
" || fails=$((fails + 1))

node -e "
const rows=require('$T/reckoning/almanac.json');
if(!rows[0].printedUTC||rows[0].printedUTC.rise!=='09:36'){console.log('FAIL  the first row moved');process.exit(1)}
console.log('ok    the first row is untouched after '+(rows.length-1)+' more runs');
" || fails=$((fails + 1))

NOW_SUM="$( [ -f "$REAL" ] && sha256sum "$REAL" | cut -d' ' -f1 || echo absent)"
if [ "$REAL_SUM" = "$NOW_SUM" ]; then ok "the real reckoning/almanac.json did not move"; else bad "the real reckoning/almanac.json CHANGED"; fi

echo
if [ "$fails" -gt 0 ]; then echo "FAIL — $fails problem(s)."; exit 1; fi
echo "PASS — every way the almanac can fail is a failure row with its reason, and every row carries its wager."
