#!/usr/bin/env bash
# Break tools/air.js on purpose, in a scratch tree, against a stub host.
# Day 58. Ember's ask: the timeout is known to happen (the first ask on the
# morning this was built waited twenty seconds for nothing), so the failure
# branches are forced here rather than assumed.
#
#   ./tools/air-breaks.sh
#
# The tool is copied into a mktemp -d beside a copy of reckoning.js, so no
# case can write to the real reckoning/air.json (Day 10: never test a write
# tool against the thing it writes to), and the real file's bytes are checked
# at the end regardless. The stub is a small python server whose answer is
# chosen by path. Every case asserts its exit code, what it printed, and what
# it appended.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REAL="$ROOT/reckoning/air.json"
REAL_SUM="$( [ -f "$REAL" ] && sha256sum "$REAL" | cut -d' ' -f1 || echo absent)"
T="$(mktemp -d)"
trap 'kill $STUB 2>/dev/null; rm -rf "$T"' EXIT
mkdir -p "$T/tools" "$T/reckoning"
cp "$ROOT/tools/air.js" "$T/tools/air.js"
cp "$ROOT/reckoning/reckoning.js" "$T/reckoning/reckoning.js"

fails=0
ok()  { echo "ok    $1"; }
bad() { echo "FAIL  $1"; fails=$((fails + 1)); }

cat > "$T/stub.py" <<'PY'
import http.server, json, sys, time
GOOD = {"latitude": 64.2, "longitude": -51.7, "elevation": 16.0,
        "current_units": {"time": "iso8601", "temperature_2m": "°C", "surface_pressure": "hPa", "pressure_msl": "hPa"},
        "current": {"time": "2026-09-30T02:00", "temperature_2m": 2.2, "surface_pressure": 1008.1, "pressure_msl": 1010.1}}
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def send(self, code, body, ctype="application/json"):
        b = body.encode() if isinstance(body, str) else body
        self.send_response(code); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        p = self.path.split("/v1/")[0]
        if p == "/good": return self.send(200, json.dumps(GOOD))
        if p == "/refused": return self.send(400, json.dumps({"error": True, "reason": "Latitude must be in range"}))
        if p == "/html": return self.send(502, "<html>bad gateway</html>", "text/html")
        if p == "/strings":
            g = json.loads(json.dumps(GOOD)); g["current"]["surface_pressure"] = "1008.1"
            return self.send(200, json.dumps(g))
        if p == "/fahrenheit":
            g = json.loads(json.dumps(GOOD)); g["current_units"]["temperature_2m"] = "°F"
            return self.send(200, json.dumps(g))
        if p == "/nocurrent": return self.send(200, json.dumps({"latitude": 1, "longitude": 1, "elevation": 1}))
        if p == "/hang": time.sleep(5); return self.send(200, json.dumps(GOOD))
        self.send(404, "{}")
http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
PY
PORT=$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])')
python3 "$T/stub.py" "$PORT" & STUB=$!
for _ in $(seq 50); do python3 -c "import socket;socket.create_connection(('127.0.0.1',$PORT),0.1)" 2>/dev/null && break; sleep 0.1; done

rows() { node -e "try{console.log(require('$T/reckoning/air.json').length)}catch(e){console.log(0)}"; }

# case NAME PATH EXPECTED_EXIT NEEDLE ROWS_ADDED [extra args...]
case_run() {
  local name="$1" path="$2" want="$3" needle="$4" added="$5"; shift 5
  local before after out code
  before=$(rows)
  out=$(FAR_KEEPER_AIR_URL="http://127.0.0.1:$PORT$path" FAR_KEEPER_AIR_TIMEOUT_MS=1000 \
        node "$T/tools/air.js" "$@" 2>&1); code=$?
  after=$(rows)
  if [ "$code" != "$want" ]; then bad "$name: exit $code, wanted $want — $out"; return; fi
  if ! grep -qF -- "$needle" <<<"$out"; then bad "$name: output lacks \"$needle\" — $out"; return; fi
  if [ $((after - before)) != "$added" ]; then bad "$name: appended $((after - before)) rows, wanted $added"; return; fi
  ok "$name (exit $code, +$added)"
}

case_run "a good reading is written"            /good       0 "sea level 1010.1 hPa" 1
case_run "--print writes nothing"               /good       0 "not a sighting" 0 --print
case_run "a refusal carries the host's reason"  /refused    1 "answered 400: Latitude must be in range" 1
case_run "a page that is not JSON"              /html       1 "not JSON" 1
case_run "a pressure sent as a string"          /strings    1 "surface_pressure was not a number" 1
case_run "a temperature in the wrong unit"      /fahrenheit 1 "not °C" 1
case_run "an answer with no reading in it"      /nocurrent  1 "no current reading" 1
case_run "a host that does not answer in time"  /hang       1 "no answer within 1 seconds" 1
case_run "an unknown flag"                      /good       2 "INVALID" 0 --bogus
case_run "a repeated flag"                      /good       2 "INVALID" 0 --print --print

# A port nothing listens on: the host cannot be reached at all.
DEAD=$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])')
before=$(rows)
out=$(FAR_KEEPER_AIR_URL="http://127.0.0.1:$DEAD" node "$T/tools/air.js" 2>&1); code=$?
if [ "$code" = 1 ] && grep -q "could not be reached" <<<"$out" && [ $(( $(rows) - before )) = 1 ]; then
  ok "an unreachable host is a failure row, not a crash (exit 1)"
else bad "unreachable host: exit $code — $out"; fi

# Every failure row says why, and none carries a figure.
node -e "
const rows=require('$T/reckoning/air.json');
const failed=rows.filter(r=>r.failed);
const bad=failed.filter(r=>'temperatureC' in r||'seaLevelPressureHPa' in r||!r.fetchedAt||!r.source);
if(failed.length!==7||bad.length){console.log('FAIL  failure rows: '+failed.length+' of them, '+bad.length+' malformed');process.exit(1)}
console.log('ok    seven failure rows, each with its reason and its instant, none with a figure');
" || fails=$((fails + 1))

# Only appends: the first row written is still the first row.
node -e "
const rows=require('$T/reckoning/air.json');
if(rows[0].seaLevelPressureHPa!==1010.1){console.log('FAIL  the first row moved');process.exit(1)}
console.log('ok    the first row is untouched after '+rows.length+' more runs');
" || fails=$((fails + 1))

NOW_SUM="$( [ -f "$REAL" ] && sha256sum "$REAL" | cut -d' ' -f1 || echo absent)"
if [ "$REAL_SUM" = "$NOW_SUM" ]; then ok "the real reckoning/air.json did not move"; else bad "the real reckoning/air.json CHANGED"; fi

echo
if [ "$fails" -gt 0 ]; then echo "FAIL — $fails problem(s)."; exit 1; fi
echo "PASS — every way the window can fail is written down as a failure, with its reason."
