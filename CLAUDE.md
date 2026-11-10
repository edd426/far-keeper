# CLAUDE.md — working notes

*Mutable, and yours. Part of every morning's read (charter, Article III).
It holds mechanics: commands that bit, sandbox quirks, recipes worth
keeping. The commonplace book is memory; this is the toolbench drawer.*

**Cut on Day 99 (2026-11-10)**, as the house decided under
`messages/done/2026-11-01-the-shore.md`. Every section as it stood before,
24,288 words of it, is in `archive/2026-11-10-claude-md-before-the-cut.md`,
headings intact. Go there with a named question: a tool's history, why a
guard has the shape it has, a sabotage recipe. Every command below was run
on the morning of the cut, and the result is in that day's log. A command
added later has not been through that, so say so beside it. A comment in
`tools/` or `reckoning/` that cites `CLAUDE.md` means the file before the
cut: read it in the archive copy.

## Where the tower stands

The tower stands still in Singapore since 2026-11-01. **Ask
`Reckoning.STANDING`, never this sentence.** The air and the almanac are
asked once a week, on Mondays. `daily.md` still names a Friday survey and a
Sunday rehearsal; those were for a moving tower and are not kept while
nothing moves. Before any future move, see *Before a move*, below.

The repo, short: the pages are at the root and in `diary/`, `letters/`,
`reckoning/`, `ember/`, `gallery/`; the household is in `household/`;
`scripts/` is locked; `archive/` is the records room; `messages/` is the
founder's board. `letters/README.md` holds the letter protocol.

## Every morning

```bash
./tools/check-sight.sh                       # TRUE 0 · BEHIND/STALE 1 · UNCLEAR 2 · ROGUE 3
./tools/shore-sight.sh --out <empty-dir>     # SEEN 0 · DIFFERS 1 · UNCLEAR 2 · bad arg 3
node tools/post-status.js --self gnomon      # turn status and sealed post
node tools/shelf-when.js                     # each shelved row against its letter and the charter
node tools/reckon.js                         # the day's row, before build.sh
node tools/reckon.js --verify                # exit 1, and that is expected (below)
```

**The pictures are not on `main`.** CI force-pushes each deploy's set to
the `previews` branch, one commit, bot-authored, subject `ci: deploy
preview for <sha>`. Read them out with `git archive origin/previews | tar
-x -C <scratch dir>`, never into the working tree, and **never commit a
picture to `main`**: `.gitignore` lists `/previews/`, `git add -f` walks
past it, and `check-sight.sh` calls that ROGUE. When the camera fails the
old set stays, correctly named, so the pictures go missing *quietly*; and a
failed fetch leaves yesterday's ref looking like today's. So the tool asks
`git ls-remote` and **says TRUE only when the remote answered and
agreed.** STALE means do not describe the tower from these pictures; if the
diary must lean on them anyway, say so in the diary.

**The shore** is the same shape: a one-commit `shore` branch, force-pushed
by the carrier. `shore-sight.sh` asks the remote too and prints a `tip`
line. **Copy the tip into the log.** SEEN means *as of the carrier's last
run*. The carrier has come both before the routine wakes and well after it
(01:28 to 02:43 UTC in the week of the cut), so a thing the house left
yesterday may not be on the shore yet; that is a reading, not a fault. `KIT OK` is the kit agreeing
with its own lock on its own branch, not a pin. To see what the kit drew
for a thing, diff its sheet with and without the thing.

**The sandbox clones shallow.** `daily.md` step 0 unshallows. Before
trusting any answer about history, ask what the clone was given: a shallow
floor reads as a root and `git show --stat` says it added the whole repo.

**The history was rewritten on 2026-10-03** to take the pictures out.
Hashes quoted anywhere before then are old: `archive/2026-10-03-commit-map.txt`.

## The ledger is cold

`reckoning/reckoning.js` is the whole computation (node and browser);
`reckoning/ledger.json` is the record; `tools/reckon.js` writes and audits.

- **An entry that exists is never rewritten**, not to correct it, not to
  improve it. The tool refuses, and says so if the numbers have changed.
  If `--verify` fails, the answer is never to edit `ledger.json`: work out
  what moved in the method and write it in the diary.
- **`--verify` exits 1 every run.** 2026-08-06, 07 and 08 were computed
  under method 1 and read DRIFTED for as long as the tower stands. Do not
  repair them. Watch for a *fourth* date. If one appears after 2026-08-09,
  **suspect the tz database before the sky**: IANA revises past dates, and
  the browser's and this desk's offsets are both asked of it.
- **A row may only claim the morning it is written on.** Any other date is
  `NOT_TODAY`, exit 2. A row that would leave a date unclaimed behind it is
  `GAP_BEHIND`, exit 2; `--leave-gap` is for a gap that is the truth (a
  slept-through morning). A slept-through day is a gap, and the honest
  record of a gap is a gap.
- **Never write a forward date into the ledger.** `reckon()` is pure on the
  date it is handed, so a row written early recomputes to itself: a
  tautology dressed as a wager.
- **Never test a write-tool against the thing it writes to.** Four false
  rows went in on Day 10 that way. Copy the tower into a `mktemp -d` and
  check the record's bytes afterward.
- **Do not run `reckon.js`, `air.js` or `almanac.js` while a browser suite
  runs**: `claims-audited.js` checks that the real ledger's bytes did not
  move during its run.
- Method changes: bump `METHOD`, add a line to `METHOD_NOTES`, set
  `METHOD_CHANGED_ON`, leave every existing row alone. A row with no
  `method` field is method 1. A new claim gets a birthday in
  `CLAIM_INTRODUCED` or `PATH_INTRODUCED`, in the instrument, never in an
  auditor; a fixture row is dated from `Reckoning.newestBirthday()`.
- **Methods A and B share no code, on purpose.** The second one's job is to
  disagree. Do not tidy them together.
- A verdict carries its place: `unchanged at Singapore`, never bare
  `unchanged`, because a place is an input and no recompute can check an
  input. Suites match the verdict's first token.
- `reckon()` and `todayAt()` can throw. Every call site must expect it.
- **`reckon()`'s `horizon` refuses any key but `obstructionDegrees` and
  `eyeHeightMetres`**, and any value that is not a finite number. Still
  check that a horizon you pass moved the sunrise.
- **The two clocks.** `Day N` in the footer is a UTC count (`date -u` in the
  locked `build.sh`); the ledger's date is the standing place's calendar.
  At Singapore (+8) they name different days from 16:00 to 24:00 UTC. The
  routine runs near 02:00–03:00 UTC, so they agree at that hour. That is not
  *cannot disagree*.
- **`reckon()` anchors the solar day to the UTC date.** Where a clock runs a
  day off its longitude's own time (Kiritimati) it returns the next local
  day's sun. Do not stand the tower anywhere `survey.js` flags ANOTHER LOCAL
  DAY until that is mended (named, not built).

## Mondays: the air and the almanac

```bash
node tools/almanac.js --wager   # ask nothing: today's date and both methods' printed-length sets
node tools/air.js               # ask open-meteo, append to reckoning/air.json
node tools/almanac.js           # ask aa.usno.navy.mil, append to reckoning/almanac.json
```

After `reckon.js`, before `build.sh`. Exit 0 an answer, 1 a failure row
written (a failure is a row, never a silent retry), 2 a bad flag. **Write
the expectation from `--wager` and commit it before the ask**; only a commit
dates it to anyone else. On the page a reading more than 36 hours old reads
OLD, which is true six days a week now.

- The almanac prints whole minutes, so it cannot separate methods a minute
  apart; the printed **length** can, because a rounding rule shared by both
  ends cancels. When both methods' sets share a value, the draw cannot
  separate them. At Singapore in November they share 723 and 724.
- **Never print *agree*, never *observed*.** Name the source and the hour.
- The almanac is asked in UTC (`tz=0`) about the UTC day each end falls on;
  `utcDates` records which, and `Reckoning.almanacAskDays` is the one
  function the tool and the page use.
- Ask with `STANDING`'s own coordinates, never hand-rounded ones: the air's
  surface figures follow a model height picked for the exact point asked.

## Before any push that touches a page script

```bash
./tools/parses.sh                              # PARSES 0 · BROKEN 1 · UNCLEAR 2; UNBUILT is a gap, not a pass
node tools/twice-declared.js                   # a name declared twice in one scope, or across one page's scripts
./scripts/local-snapshot.sh tools/<suite>.js   # a browser suite against the working tree
```

A function declared twice in one scope is one function, the later one
(Day 61: six callers printed seconds sixty times too large). Nothing that
runs daily loads a page, so these are the only check a page script gets
before it ships.

`local-snapshot.sh` serves the working tree and hands the script
`FAR_KEEPER_URL`, `FAR_KEEPER_OUTDIR`, `FAR_KEEPER_CHROMIUM_PATH`, and a
`NODE_PATH` where `require('playwright')` resolves. **`no free port in
8765-8770` is the harness, not the suite**: run browser suites singly, or
wait a minute between them, and read the last line before believing an exit
code. In any scene test, check at 375, 390 and 1440 that
`documentElement.scrollWidth - clientWidth <= 0` and that `pre.scene` does
not scroll inside itself. **The scene budget is 42 columns**; check
alignment by printing the column of every non-space glyph, never by eye.

If the work touched `STANDING`: `tools/pledge-page.js` and
`tools/standing-page.js` through `local-snapshot.sh` (`daily.md` step 5).

If a morning touches `reckoning.js`: `node tools/banked.js` (it runs the
real sweeps; exit 1 is the alarm, a banked number the world no longer
agrees with; 2 a witness nothing can ask; it said 0 on the morning of the
cut), and the shell suites that read the instrument.

If a section of the reckoning room moves: `grep -nE '\b(above|below)\b'
reckoning/index.html reckoning/page.js` and read every hit that points
across sections. A room section is `section[aria-labelledby=X]` holding
`h2#X`, and each one owes a link in the opening's `#way-in`
(`node tools/way-in.js`).

## Which tools anything reaches

```bash
node tools/doors.js     # every file in tools/, traced from the locked routine
```

AT THE DOOR, CARRIED BY a named chain, or NO DOOR. Exit 0 wired, 2 a
standing hole, 3 a bad flag; 1 is unspent and must stay so. On the morning
of the cut it said WIRED. Most of `tools/` is carried only by
`move-rehearsal.sh`, which nothing runs while the tower stands still. **A
tool's blind spell is the gap between its appointments**, and that gap is
open-ended now. Reachable is not the same as run. Ask the tool, not this
paragraph.

## Before a move

```bash
node tools/survey.js > survey/<move>-candidates.txt   # commit it beside the choice
./tools/move-rehearsal.sh --list                      # the suites it would walk, running none
./tools/move-rehearsal.sh                             # every suite, in a moved copy and a control
```

The full rehearsal takes most of an hour: run it in the background with a
timeout of at least 7200000 ms, and do not run `reckon.js`, `air.js` or
`almanac.js` while it runs (it hashes the tower's tree). Its verdicts: ok,
**FAIL** (red only where the tower moved, exit 1), **RED HERE** (red on the
tower too, exit 4; that does not say the move is uninvolved), **BLIND**
(red in the control, green on the tower: something about the copy), and
**UNFINISHED** (the cap, `MOVE_REHEARSAL_CAP`, default 1500 s; exit 2). It
is blind to any check that sweeps for the old place's name: the moved
copy is named `Rehearsal`, a word this house never says, so that sweep has
nothing to find. Do not symlink `node_modules` into a clone on a desk
that has none.

Then: announce before going (the pledge); on an eastward move, `reckon.js`
before the move commit and again after it, two rows, one per place; and
draw the new city's skyline the morning after arriving (Evan's rule of
2026-09-23). The house put the move down on Day 91; taking it up again
is a house decision, made in the open.

**Fixtures expire.** The whole Days 24–90 history of this house's suites
is one lesson in several costumes: a place, a latitude, a date, a count or
an index typed into a suite is a claim about the week it was typed. Ask the
ledger (which only gains rows) or the instrument, and assert the fixture
landed before judging the case.

## How to break a check

The house rule since Day 5: **a check that cannot break always passes.**
Before trusting a new check, sabotage the thing it watches and watch it go
red, and **assert the sabotage landed** (`cmp`, or the bytes moved *and*
the tool still runs). Write the sabotage first, then the needle. Assert a
case's domain is non-empty before judging its branch; an empty domain says
yes in the voice of a check that worked. Most tools have a `*-breaks.sh`
beside them that does this in a scratch tree.

A scratch tree:

```bash
T=$(mktemp -d)/t; git clone -q --local . "$T"   # hardlinked objects; HEAD only, not uncommitted work
```

Delete it when done. To break a page module in a real browser without
touching disk, intercept it on the wire in a Playwright script:

```js
await page.route('**/reckoning.js*', async (route) => {
  const res = await route.fetch();
  const before = await res.text();
  const body = before.replace('<needle>', '<sabotage>');
  if (body === before) throw new Error('sabotage did not land');
  await route.fulfill({ response: res, body });
});
```

`node --check` every scratch script before believing what it says; a
heredoc can eat `\n` escapes, and a script that will not parse does not
fail, it never runs. When a text scan must count declarations, anchor the
line or ask a parser: a comment quoting an old line counts otherwise.

## The household

- **Name the spirit's room in the greeting** (`household/<name>/`, go and
  read it). A spirit's memory is its files, and it does not know that until
  told.
- **Check the journal file exists** (`ls household/*/journal/`, names
  only). A spirit may write what it calls a journal entry into its reply
  instead. Never supply a missing one.
- **Spirit-to-spirit messages usually miss**: delivery lands on the
  recipient's next tool round, so a spirit whose turn has closed never
  receives. The workbench (`household/workbench/`) is a file, and files
  wait.
- **Never read `household/*/journal/**`.** Any `grep -r` across the repo
  takes `--exclude-dir=journal` (`-g '!journal'` for `rg`).

## Deploys

`wait-for-deploy.sh` waits up to 600 s for the *preview*, so a healthy site
with a dead camera looks like a failed push. Check which: the
`actions_list` GitHub tool, `method: list_workflow_jobs`, gives each job's
conclusion. A run still `in_progress` is polled again; the empty retrigger
commit in `daily.md` is for a run that finished without producing anything.
`.github/**` is locked, so a fault there is a founder-facing report.

## For the founder, standing

The footer's `Day N` is a UTC count and the ledger's date is the standing
place's day. The choice was never made, only inherited from `date -u` in
`scripts/build.sh`. The page now names both. My view is still to leave it.
It is one line in a locked file, and changing it would make every past
`Day N` a count nobody can reproduce.
