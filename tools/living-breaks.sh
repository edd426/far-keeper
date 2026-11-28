#!/usr/bin/env bash
# Break tools/living.js on purpose, in a scratch tree, against a stub host.
# Day 117, built before the first ask (Ember's conditions and Ash's, Day 117).
#
#   ./tools/living-breaks.sh                 the suite, against tools/living.js
#   LIVING_JS=<path> ./tools/living-breaks.sh   the suite, against another copy
#
# The second form is how the suite itself was broken: a sabotaged copy of the
# tool (a wrong denominator, a dropped month filter, a hand-typed place, a
# failure that is not written) must turn this suite red. See the day's log.
#
# The tool is copied into a scratch git repo beside a copy of reckoning.js, so
# no case can write to the real reckoning/living.json (Day 10), and the real
# file's bytes are checked at the end regardless. No place, month or date is
# typed here: the place is asked of the instrument's STANDING and the date of
# its todayAt, as the tool asks them (fixtures expire).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOL="${LIVING_JS:-$ROOT/tools/living.js}"
REAL="$ROOT/reckoning/living.json"
sum() { [ -f "$1" ] && sha256sum "$1" | cut -d' ' -f1 || echo absent; }
REAL_SUM="$(sum "$REAL")"
LEDGER_SUM="$(sum "$ROOT/reckoning/ledger.json")"
T="$(mktemp -d)"
STUB=""
trap '[ -n "$STUB" ] && kill $STUB 2>/dev/null; rm -rf "$T"' EXIT
mkdir -p "$T/tower/tools" "$T/tower/reckoning"
cp "$TOOL" "$T/tower/tools/living.js"
cp "$ROOT/reckoning/reckoning.js" "$T/tower/reckoning/reckoning.js"
cp "$ROOT/reckoning/ledger.json" "$T/tower/reckoning/ledger.json"
W="$T/tower"
git -C "$W" init -q && git -C "$W" -c user.name=t -c user.email=t@t add -A && \
  git -C "$W" -c user.name=t -c user.email=t@t commit -qm base

fails=0
ok()  { echo "ok    $1"; }
bad() { echo "FAIL  $1"; fails=$((fails + 1)); }

# Ask the instrument, never this file, where the tower stands and what day it is.
read -r PNAME PLAT PLON TODAY < <(node -e "
const R=require('$W/reckoning/reckoning.js');const p=R.STANDING.place;
console.log([p.name,p.latitude,p.longitude,R.todayAt(p.zone)].join(' '))")
MONTH=$((10#${TODAY:5:2}))
YM="${TODAY:0:7}"
if [ -z "$PNAME" ] || [ -z "$PLAT" ] || [ "$MONTH" -lt 1 ] || [ "$MONTH" -gt 12 ]; then
  echo "FAIL  the fixture did not land: place '$PNAME' $PLAT,$PLON month $MONTH"; exit 1
fi
echo "      standing: $PNAME ($PLAT, $PLON), today $TODAY, month $MONTH"
KEY=2481200   # any key; the stub names it

cat > "$T/stub.py" <<'PY'
import http.server, json, sys, time, urllib.parse
LOG = sys.argv[2]
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def send(self, code, body, ctype="application/json"):
        b = body.encode() if isinstance(body, str) else body
        self.send_response(code); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        mode, _, rest = self.path[1:].partition("/")
        u = urllib.parse.urlparse("/" + rest); q = urllib.parse.parse_qs(u.query)
        with open(LOG, "a") as f: f.write(json.dumps({"mode": mode, "path": u.path, "q": q}) + "\n")
        if mode == "hang": time.sleep(5)
        if mode == "html": return self.send(502, "<html>bad gateway</html>", "text/html")
        if mode == "e500" and u.path.startswith("/v1/occurrence"): return self.send(500, "{}")
        if u.path.startswith("/v1/species/"):
            key = int(u.path.rsplit("/", 1)[1])
            if mode == "spname": key += 1
            return self.send(200, json.dumps({"key": key, "scientificName": "Corvus corax", "rank": "SPECIES", "vernacularName": "Common Raven"}))
        if u.path == "/v1/occurrence/search":
            lat, lon, _r = q["geoDistance"][0].split(",")
            lat, lon = float(lat), float(lon)
            month = int(q["month"][0]) if "month" in q else None
            rec_month = month if month is not None else 99
            creature = "taxonKey" in q
            count = 12 if creature else 400
            if mode == "few" and not creature: count = 20
            if mode == "few" and creature: count = 3
            if mode == "more" and creature: count = 500
            dlat = 30.0 if mode == "far" else 0.05
            rec = {"decimalLatitude": lat + dlat, "decimalLongitude": lon, "month": rec_month}
            if mode == "nocount": return self.send(200, json.dumps({"results": [rec]}))
            return self.send(200, json.dumps({"count": count, "results": [rec] if count else []}))
        self.send(404, "{}")
http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
PY
PORT=$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])')
python3 "$T/stub.py" "$PORT" "$T/asks.log" & STUB=$!
for _ in $(seq 50); do python3 -c "import socket;socket.create_connection(('127.0.0.1',$PORT),0.1)" 2>/dev/null && break; sleep 0.1; done

# A preload that makes any touch of ledger.json a crash: the window never
# enters the cold ledger's path.
cat > "$T/no-ledger.js" <<'JS'
const fs = require('node:fs');
for (const name of ['readFileSync', 'writeFileSync', 'openSync', 'existsSync', 'appendFileSync', 'readFile', 'writeFile', 'open']) {
  const orig = fs[name];
  fs[name] = function (p, ...rest) {
    if (String(p).endsWith('ledger.json')) throw new Error(`living.js touched ${p}`);
    return orig.call(this, p, ...rest);
  };
}
JS

rows() { node -e "try{console.log(require('$W/reckoning/living.json').length)}catch(e){console.log(0)}"; }
last() { node -e "const r=require('$W/reckoning/living.json');console.log(JSON.stringify(r[r.length-1]))"; }

# case NAME MODE EXPECTED_EXIT NEEDLE ROWS_ADDED [extra args...]
case_run() {
  local name="$1" mode="$2" want="$3" needle="$4" added="$5"; shift 5
  local before after out code
  before=$(rows)
  out=$(cd "$T" && FAR_KEEPER_LIVING_URL="http://127.0.0.1:$PORT/$mode" FAR_KEEPER_LIVING_TIMEOUT_MS=1000 \
        node -r "$T/no-ledger.js" "$W/tools/living.js" "$@" 2>&1); code=$?
  after=$(rows)
  if [ "$code" != "$want" ]; then bad "$name: exit $code, wanted $want — $out"; return; fi
  if ! grep -qF -- "$needle" <<<"$out"; then bad "$name: output lacks \"$needle\" — $out"; return; fi
  if [ $((after - before)) != "$added" ]; then bad "$name: appended $((after - before)) rows, wanted $added"; return; fi
  ok "$name (exit $code, +$added)"
}
commit() { git -C "$W" -c user.name=t -c user.email=t@t add -A "$@" && git -C "$W" -c user.name=t -c user.email=t@t commit -qm x; }
expect_file() { # place yearMonth key
  printf '[{"place":"%s","yearMonth":"%s","taxonKey":%s,"expect":"a test expectation","writtenOn":"%s"}]\n' "$1" "$2" "$3" "$TODAY" \
    > "$W/reckoning/living-expectations.json"
}

# The expectation gate. Nothing is asked until the last commit holds one.
case_run "no expectation at all is refused"           good 2 "REFUSED" 0 --taxon $KEY
expect_file "$PNAME" "$YM" $KEY
case_run "an expectation not yet committed is refused" good 2 "REFUSED" 0 --taxon $KEY
case_run "--print is gated too"                        good 2 "REFUSED" 0 --taxon $KEY --print
expect_file "$PNAME" "$YM" $((KEY + 1)); commit reckoning/living-expectations.json
case_run "an expectation for another creature"         good 2 "REFUSED" 0 --taxon $KEY
expect_file "$PNAME" "1999-01" $KEY; commit reckoning/living-expectations.json
case_run "an expectation for another month"            good 2 "REFUSED" 0 --taxon $KEY
expect_file "Rehearsal" "$YM" $KEY; commit reckoning/living-expectations.json
case_run "an expectation for another place"            good 2 "REFUSED" 0 --taxon $KEY
if [ -s "$T/asks.log" ]; then bad "a refused ask still reached the host"; else ok "no refused ask reached the host"; fi
expect_file "$PNAME" "$YM" $KEY; commit reckoning/living-expectations.json

: > "$T/asks.log"
case_run "a good answer is written, the total first"   good 0 "400 records of anything, and among them 12 records of Corvus corax" 1 --taxon $KEY
node -e "
const r=JSON.parse(process.argv[1]);
const p=[];
if(r.allCount!==400)p.push('allCount '+r.allCount+', not the total');
if(r.count!==12)p.push('count '+r.count);
if(r.share!==0.03)p.push('share '+r.share+', not 12/400');
if(r.place.name!=='$PNAME'||r.place.latitude!==$PLAT||r.place.longitude!==$PLON)p.push('place '+JSON.stringify(r.place));
if(r.month!==$MONTH||r.date!=='$TODAY')p.push('date '+r.date+' month '+r.month);
if(r.source!=='api.gbif.org'||!r.fetchedAt||r.radiusKm!==25)p.push('source/fetchedAt/radius');
if(p.length){console.log('FAIL  the good row: '+p.join('; '));process.exit(1)}
console.log('ok    the good row: 12 of 400, share 0.03, at the standing place, this month');
" "$(last)" || fails=$((fails + 1))
node -e "
const lines=require('fs').readFileSync('$T/asks.log','utf8').trim().split('\n').map(JSON.parse);
const occ=lines.filter(l=>l.path==='/v1/occurrence/search');
const p=[];
if(occ.length!==2)p.push(occ.length+' counts asked, not 2');
for(const l of occ){
  if(l.q.geoDistance?.[0]!=='$PLAT,$PLON,25km')p.push('geoDistance '+l.q.geoDistance);
  if(l.q.month?.[0]!=='$MONTH')p.push('month '+l.q.month);
}
if(occ.filter(l=>l.q.taxonKey).length!==1)p.push('the taxon was not on exactly one count');
if(p.length){console.log('FAIL  what reached the host: '+p.join('; '));process.exit(1)}
console.log('ok    the host was asked the standing place exactly, this month, the creature once and the total once');
" || fails=$((fails + 1))
case_run "--print writes nothing"                      good    0 "never a sighting" 0 --taxon $KEY --print
case_run "the answer says what it cannot tell"         good    0 "cannot tell" 0 --taxon $KEY --print
case_run "too few records is TOO FEW, with no share"   few     0 "TOO FEW" 1 --taxon $KEY
node -e "const r=JSON.parse(process.argv[1]); if('share' in r||!r.tooFew){console.log('FAIL  TOO FEW row carries a share');process.exit(1)} console.log('ok    the TOO FEW row has no share')" "$(last)" || fails=$((fails + 1))
case_run "a record far from the place fails"           far     1 "the \"near\" filter did not hold" 1 --taxon $KEY
case_run "a creature count above the total fails"      more    1 "more than all records" 1 --taxon $KEY
case_run "the wrong creature's name fails"             spname  1 "not with the name of the creature" 1 --taxon $KEY
case_run "a count with no number fails"                nocount 1 "no whole count" 1 --taxon $KEY
case_run "a host error is a failure row"               e500    1 "answered 500" 1 --taxon $KEY
case_run "a page that is not JSON"                     html    1 "not JSON" 1 --taxon $KEY
case_run "a host that does not answer in time"         hang    1 "no answer within 1 seconds" 1 --taxon $KEY
case_run "a bad taxon"                                 good    2 "INVALID" 0 --taxon raven
case_run "no taxon"                                    good    2 "INVALID" 0
case_run "an unknown flag"                             good    2 "INVALID" 0 --taxon $KEY --bogus
case_run "--wager asks nothing and names the month"    good    0 "month $MONTH, within 25 km" 0 --taxon $KEY --wager

DEAD=$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])')
before=$(rows)
out=$(FAR_KEEPER_LIVING_URL="http://127.0.0.1:$DEAD" node "$W/tools/living.js" --taxon $KEY 2>&1); code=$?
if [ "$code" = 1 ] && grep -q "could not be reached" <<<"$out" && [ $(( $(rows) - before )) = 1 ]; then
  ok "an unreachable host is a failure row, not a crash (exit 1)"
else bad "unreachable host: exit $code — $out"; fi

node -e "
const rows=require('$W/reckoning/living.json');
const failed=rows.filter(r=>r.failed);
const badr=failed.filter(r=>'count' in r||'allCount' in r||'share' in r||!r.fetchedAt||!r.source);
if(failed.length!==8||badr.length){console.log('FAIL  failure rows: '+failed.length+', '+badr.length+' malformed');process.exit(1)}
if(rows[0].share!==0.03){console.log('FAIL  the first row moved');process.exit(1)}
console.log('ok    eight failure rows, each with its reason and none with a count; the first row untouched');
" || fails=$((fails + 1))

node -e "
const L=require('$W/tools/living.js');
const now=new Date('2026-12-06T00:00:00Z');
const at=(d)=>({fetchedAt:new Date(now.getTime()-d*86400000).toISOString()});
const p=[];
if(L.isOld(at(1),now))p.push('a day-old reading is OLD');
if(!L.isOld(at(L.OLD_AFTER_DAYS+1),now))p.push('a reading past the age is not OLD');
if(!L.isOld({fetchedAt:'nonsense'},now))p.push('an unreadable instant is not OLD');
if(p.length){console.log('FAIL  isOld: '+p.join('; '));process.exit(1)}
console.log('ok    OLD past '+L.OLD_AFTER_DAYS+' days, and an unreadable instant is OLD');
" || fails=$((fails + 1))

if [ "$(sum "$W/reckoning/ledger.json")" = "$LEDGER_SUM" ]; then ok "the scratch ledger did not move"; else bad "the scratch ledger CHANGED"; fi
if [ "$(sum "$REAL")" = "$REAL_SUM" ]; then ok "the real reckoning/living.json did not move"; else bad "the real reckoning/living.json CHANGED"; fi
if [ "$(sum "$ROOT/reckoning/ledger.json")" = "$LEDGER_SUM" ]; then ok "the real ledger did not move"; else bad "the real ledger CHANGED"; fi

echo
if [ "$fails" -gt 0 ]; then echo "FAIL — $fails problem(s)."; exit 1; fi
echo "PASS — the window is refused without a committed expectation, and every way it can fail is a row."
