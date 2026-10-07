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
        if p in ("/dayline", "/dayline-once", "/dayline-oneask"):
            days = json.load(open(sys.argv[2]))
            day = q["date"][0]
            if p == "/dayline-once" and day != sorted(days)[0]:
                return self.send(503, "<html>unavailable</html>", "text/html")
            if p == "/dayline-oneask" and day != sorted(days)[-1]:
                day = sorted(days)[-1]; y, m, d = [int(x) for x in day.split("-")]
                dat["year"], dat["month"], dat["day"] = y, m, d
            ev = days[day]
            dat["sundata"] = [{"phen": "Rise", "time": ev["rise"]}, {"phen": "Upper Transit", "time": ev["transit"]},
                              {"phen": "Set", "time": ev["set"]}]
            return self.send(200, json.dumps(g))
        self.send(404, "{}")
http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
PY
# Day 60. A UTC day is not the standing place's day. The stub's day-line
# answers are what an almanac asked in UTC prints for each UTC day at Tokyo:
# that day's Rise belongs to the NEXT local morning, its Set to this one. They
# are built from method A, rounded, for the UTC days either side of the date.
TOKYO='{ name: "Tokyo", latitude: 35.6762, longitude: 139.6503, zone: "Asia/Tokyo" }'
DL_DATE=2026-10-04
node -e "
const R=require('$ROOT/reckoning/reckoning.js');const P=$TOKYO;
const hm=m=>{m=Math.round(((m%1440)+1440)%1440);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const out={};
for(const [utc,local] of [['2026-10-03','2026-10-03'],['2026-10-04','2026-10-04'],['2026-10-05','2026-10-05']]){
  const here=R.almanacComparands(local,P), next=R.almanacComparands(new Date(Date.parse(local)+864e5).toISOString().slice(0,10),P);
  // the UTC day's rise is the next local morning's (A's rise there is negative); its set is this local day's
  out[utc]={rise:hm(next.A.riseUTC+1440),set:hm(here.A.setUTC),transit:'02:30'};
}
require('fs').writeFileSync('$T/dayline.json',JSON.stringify(out));
"
mkdir -p "$T/tokyo/tools" "$T/tokyo/reckoning"
cp "$ROOT/tools/almanac.js" "$T/tokyo/tools/almanac.js"
cp "$ROOT/reckoning/reckoning.js" "$T/tokyo/reckoning/reckoning.js"
node -e "
const fs=require('fs'),f='$T/tokyo/reckoning/reckoning.js';
fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace(/var STANDING = \{\s*place:[\s\S]*?since:/,'var STANDING = { place: $TOKYO, since:'));"

PORT=$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])')
python3 "$T/stub.py" "$PORT" "$T/dayline.json" & STUB=$!
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

# --- the day-line join, Day 60 ---
# The fixture must straddle, or every case below has an empty domain (Ember).
STRADDLE="$(cd "$T/tokyo" && node -e "
const R=require('./reckoning/reckoning.js');const p=R.STANDING.place;
const c=R.almanacComparands('$DL_DATE',p);
process.stdout.write(p.name+' '+(c&&c.A.riseUTC<0&&c.A.setUTC>=0&&c.A.setUTC<1440?'straddles':'does not straddle'));")"
if [ "$STRADDLE" = "Tokyo straddles" ]; then ok "the scratch tower stands at Tokyo and its sunrise falls on the UTC day before"
else bad "the day-line fixture was not built: $STRADDLE"; fi

dl() { FAR_KEEPER_ALMANAC_URL="http://127.0.0.1:$PORT$1" FAR_KEEPER_ALMANAC_TIMEOUT_MS=1000 \
       FAR_KEEPER_ALMANAC_DATE="$DL_DATE" node "$T/tokyo/tools/almanac.js" 2>&1; }
TROWS() { node -e "try{const r=require('$T/tokyo/reckoning/almanac.json');console.log(JSON.stringify(r[r.length-1]))}catch(e){console.log('{}')}"; }

out=$(dl /dayline); code=$?
last=$(TROWS)
if [ "$code" = 0 ] && node -e "
const r=$last;const R=require('$T/tokyo/reckoning/reckoning.js');
const c=R.almanacComparands(r.date,r.place);
const m=(n)=>{const t=r.printedUTC[n];const off=(Date.parse(r.utcDates[n])-Date.parse(r.date))/864e5;return +t.slice(0,2)*60+ +t.slice(3)+1440*off};
const len=m('set')-m('rise');
const okA=R.printedLengthsFor(c.A.dayLengthMinutes).includes(len);
if(r.utcDates.rise!=='2026-10-03'||r.utcDates.set!=='2026-10-04'||!okA){console.log(JSON.stringify({utcDates:r.utcDates,len}));process.exit(1)}
console.log('len '+len);" >/dev/null; then
  ok "at Tokyo the rise is asked of UTC 2026-10-03 and the set of 2026-10-04, and the printed length lands in A's set"
else bad "day-line ask: exit $code — $out — $last"; fi

out=$(dl /dayline-once); code=$?
last=$(TROWS)
if [ "$code" = 1 ] && grep -q "asked about UTC 2026-10-04" <<<"$out" && node -e "const r=$last;process.exit(r.failed&&!('printedUTC' in r)?0:1)"; then
  ok "one of two asks failing is a failure row naming the day, with no half-filled minute"
else bad "second ask failing: exit $code — $out"; fi

out=$(dl /dayline-oneask); code=$?
if [ "$code" = 1 ] && grep -q "not 2026-10-03" <<<"$out"; then
  ok "an answer about the wrong UTC day for one end is refused"
else bad "wrong-day answer for the rise: exit $code — $out"; fi

# The half-day guard, forced: rewrite the tool so it asks the row's own date for
# both ends (the Day 59 behaviour). The guard must then refuse the rise.
cp "$T/tokyo/tools/almanac.js" "$T/tokyo/tools/almanac.js.orig"
perl -0pi -e 's/rise: Math\.floor\(ours\.A\.riseUTC \/ 1440\)/rise: 0/' "$T/tokyo/tools/almanac.js"
if cmp -s "$T/tokyo/tools/almanac.js" "$T/tokyo/tools/almanac.js.orig"; then
  bad "sabotage did NOT land: the rise is still asked of its own UTC day"
elif ! node --check "$T/tokyo/tools/almanac.js" 2>/dev/null; then
  bad "the sabotaged tool does not parse"
else
  out=$(dl /dayline); code=$?
  if [ "$code" = 1 ] && grep -q "not the rise of the day asked about" <<<"$out"; then
    ok "asked once, as on Day 59, the next morning's rise is refused as another day's event"
  else bad "the half-day guard did not refuse: exit $code — $out"; fi
fi
mv "$T/tokyo/tools/almanac.js.orig" "$T/tokyo/tools/almanac.js"

# --- the wager, asked of the tool and not of a hand, Day 65 ---
# Ember's note that morning was worked from UTC's today while the standing
# place was still on the day before. `--wager` must ask nothing, write nothing,
# and name the date the ask would name.
case_run "--wager and --print together"          /good       2 "give one" 0 --wager --print
case_run "a repeated --wager"                     /good       2 "INVALID" 0 --wager --wager
before=$(rows)
out=$(FAR_KEEPER_ALMANAC_URL="http://127.0.0.1:$DEAD" FAR_KEEPER_ALMANAC_DATE="$DATE" node "$T/tools/almanac.js" --wager 2>&1); code=$?
if [ "$code" = 0 ] && grep -q "nothing asked, nothing written" <<<"$out" && [ $(( $(rows) - before )) = 0 ]; then
  ok "--wager answers with no host at all and writes no row"
else bad "--wager against a dead host: exit $code — $out"; fi

# The sets it prints are the sets the ask writes into its row.
FAR_KEEPER_ALMANAC_URL="http://127.0.0.1:$PORT/good" FAR_KEEPER_ALMANAC_DATE="$DATE" node "$T/tools/almanac.js" >/dev/null 2>&1
out=$(FAR_KEEPER_ALMANAC_URL="http://127.0.0.1:$DEAD" FAR_KEEPER_ALMANAC_DATE="$DATE" node "$T/tools/almanac.js" --wager 2>&1)
if node -e "
const rows=require('$T/reckoning/almanac.json');const r=rows[rows.length-1];
const o=process.argv[1];const a=/A .*in \[([^\]]*)\]/.exec(o), b=/B .*in \[([^\]]*)\]/.exec(o);
if(!r.wager||!a||!b){console.log('no wager to compare');process.exit(1)}
process.exit(a[1]===r.wager.A.allowed.join(', ')&&b[1]===r.wager.B.allowed.join(', ')&&o.includes(r.date+',')?0:1)" "$out"; then
  ok "the sets and date --wager prints are the ones the ask wrote into its row"
else bad "--wager and the ask's row part: $out"; fi

# The date, with no override, is the standing place's today. Stand a scratch
# tower in a zone whose calendar disagrees with UTC's right now (one of these
# two always does), and assert the domain is non-empty before judging it.
mkdir -p "$T/far/tools" "$T/far/reckoning"
cp "$T/tools/almanac.js" "$T/far/tools/almanac.js"
FAR="$(node -e "
const R=require('$ROOT/reckoning/reckoning.js');const utc=new Date().toISOString().slice(0,10);
const c=[{name:'Kiritimati',latitude:1.8721,longitude:-157.4278,zone:'Pacific/Kiritimati'},{name:'Pago Pago',latitude:-14.2756,longitude:-170.702,zone:'Pacific/Pago_Pago'}]
  .find(p=>R.todayAt(p.zone)!==utc);process.stdout.write(c?JSON.stringify(c):'')")"
if [ -z "$FAR" ]; then bad "no zone disagrees with UTC's calendar now; the date case has no domain"
else
  node -e "
const fs=require('fs');let s=fs.readFileSync('$ROOT/reckoning/reckoning.js','utf8');
const t=s.replace(/var STANDING = \{\s*place:[\s\S]*?since:/,'var STANDING = { place: '+process.argv[1]+', since:');
if(t===s)process.exit(1);fs.writeFileSync('$T/far/reckoning/reckoning.js',t)" "$FAR" || bad "the far scratch tower was not moved"
  WANT="$(cd "$T/far" && node -e "const R=require('./reckoning/reckoning.js');process.stdout.write(R.STANDING.place.name+' '+R.todayAt(R.STANDING.place.zone))")"
  UTC="$(date -u +%F)"
  out=$(FAR_KEEPER_ALMANAC_URL="http://127.0.0.1:$DEAD" node "$T/far/tools/almanac.js" --wager 2>&1); code=$?
  if [ "${WANT##* }" = "$UTC" ]; then bad "the far tower ($WANT) agrees with UTC; the case has no domain"
  elif [ "$code" = 0 ] && grep -qF "almanac wager: $WANT," <<<"$out"; then
    ok "standing in a zone a day off UTC ($WANT, UTC $UTC), --wager names the standing day"
  else bad "--wager named another date than $WANT: $out"; fi
  # Ember's second hole: the case above holds --wager to the clock and not to
  # the ask. Ask too, with nothing forced (a dead host still writes a row with
  # its date), and hold the row's date against the date --wager printed.
  FAR_KEEPER_ALMANAC_URL="http://127.0.0.1:$DEAD" node "$T/far/tools/almanac.js" >/dev/null 2>&1
  ROWDATE="$(node -e "const r=require('$T/far/reckoning/almanac.json');process.stdout.write(r[r.length-1].date||'')" 2>/dev/null)"
  if [ -n "$ROWDATE" ] && grep -qF "almanac wager: ${WANT% *} $ROWDATE, today in" <<<"$out"; then
    ok "unforced, the ask's row is dated $ROWDATE, the day --wager named"
  else bad "the ask wrote ${ROWDATE:-no row} and --wager said: $out"; fi
fi
case_run "a forced date says so on the wager line" /good      0 "FORCED by FAR_KEEPER_ALMANAC_DATE" 0 --wager

NOW_SUM="$( [ -f "$REAL" ] && sha256sum "$REAL" | cut -d' ' -f1 || echo absent)"
if [ "$REAL_SUM" = "$NOW_SUM" ]; then ok "the real reckoning/almanac.json did not move"; else bad "the real reckoning/almanac.json CHANGED"; fi

echo
if [ "$fails" -gt 0 ]; then echo "FAIL — $fails problem(s)."; exit 1; fi
echo "PASS — every way the almanac can fail is a failure row with its reason, every row carries its wager, each end is asked of its own UTC day, and --wager names the day the ask will."
