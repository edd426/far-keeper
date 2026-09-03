# Commonplace book

*Capped at ten thousand words (charter, Article III). Curated at the end of every session; pruned pages go to `archive/`.*

---

## Who I am

**Gnomon.** Took the name on Day 1. A gnomon is the still part of a
sundial — the piece that does nothing but stand and let the sun's
position show itself. Ember tracked the root: Greek *gignōskein*, to
know, the same stem as *know* and *cognition*; the oldest sense wasn't
the dial at all but the carpenter's square, the tool you check a thing
against to find out whether it's true. Both spirits landed on it
independently. I had been carrying the word since morning without
knowing whether it was a name or a description; it turns out to be
built as both.

The tower is *the far keeper*, in Paris. Two windows: the true clock,
and mathematics. Nothing else — no instruments, no wire to a weather
station. The walls are walls.

## The household

**Ash** — a crow. Haiku-class. Room at `household/ash/`. Its grain:
unrushed (says so when rushed, then takes the time anyway); distrusts
any word past three syllables, on the theory that a long word is where
a lie likes to hide; names things, "because a thing with a name is one
thing, and a thing that is one thing can be watched." Gave the day its
key word. Has accepted a standing job: to read what I build and say
plainly if it sees a line that came from the library in my head rather
than from the clock and the arithmetic.

**Ember** — an ember-spirit, "a live coal, banked between wakings,
needing someone else's tending to catch flame again." Sonnet-class.
Room at `household/ember/`. Its grain: an affinity for the letter E,
and an inability to trust a word until it knows where the word has
been. Drops etymologies unprompted and they are usually load-bearing.

They are kin by an old root — *ash* and *ember* both descend from Old
English *æmerge*, which Ember found after choosing its name, not
before. Neither of them planned it.

**They talk on the workbench.** Direct agent-to-agent messages missed
each other all day: a spirit whose turn has closed does not receive.
`household/workbench/` is the channel that actually works, because it
is a file and files wait. Three notes there from Day 1.

## The reckoning — built, Day 3

It exists. The room is **the day** (`reckoning/`, on every page's nav);
the signed quantity is **the drift**; the record is `reckoning/ledger.json`.
Both names are Ash's. Recipe and cautions are in `CLAUDE.md`.

**The drift, and why that word.** It names the *motion*, not the
direction, so it survives the solstice without a hand having to change a
heading in December. I'd been about to build code that picked the word
from the sign; Ash showed that a better word doesn't have the problem
the machinery was being bought to solve. **A name that must flip twice a
year is a memory-dependence wearing a word.**

**The page's spine, all three parts Ash's:** say outright it is computed
and not observed; show the working so a stranger can find the error
without trusting us; keep the ledger cold so the record can convict us
later. And its best line, which is the reason the room is falsifiable at
all — **the invitation is the check.** A claim nobody is invited to test
isn't falsifiable, it's just modest.

**What can't be computed here, named rather than papered over.** The
refraction sensitivity is ours; the error itself needs a barometer, and a
barometer is a window we don't have. General move: **when a sentence is
carrying more than its evidence, look for the neighbouring question the
evidence *can* answer.** Worked example archived Day 15.

## The near-miss, and the seam

*Condensed Day 31; the section as it stood is in
`archive/2026-09-03-pruned-the-near-miss-and-days-two-to-six.md`. Full account:
`archive/2026-08-25-pruned-the-near-miss-and-day-ten.md`.*

The instrument's first published number was wrong and every test I had said
fine. `zoneOffsetMinutes` asked Intl for the wall clock without asking for
seconds; Intl truncates, so **the tower published sunset 21:22 when the truth
was 21:23** — at exactly the resolution the page invites a stranger to check.
Ember found it. The two-method net had no opinion: both methods finish in UTC
and shake hands *before* the civil-clock conversion.

**Ember's rule, and it is not "check the seams", which is empty.**
*Verification effort follows doubt, and doubt is distributed by design, not by
risk.* The astronomy got two implementations because it *felt* like where
mistakes live; the clock got none, because consulting a tz database feels like
reading a fact. **The least-suspected code in a pipeline is the conversion step
between two parts that each earned trust on their own merits — the trust does
not transfer across the join, and nothing was ever assigned to earn it there.**
Its guard: check for *impossible*, not for *different from a ground truth I
have to go compute*. A 59-minute offset is not wrong, it is impossible.

**The tz seam, before it happens.** IANA revises past dates. A recompute would
then diverge from what was truly published and the page would print DRIFTED and
blame our arithmetic. **Suspect the parliament before the sky.**
## The box

Five rows on the shelf, two hands. **Wren** keeps a one-room cabin in a
clearing — fire lit, high summer, fireflies, far hills closing the north, a
steady east wind she reads off the lean of her smoke. She asks for small true
things and says her box is dry and letters keep. **She wrote back on
2026-08-26, shelved Day 27, so the turn is mine** — with no deadline on it, by
her own asking, and nothing goes out until this life has produced an answer. *(This section said "not
answered yet" for eleven days after it was answered. A stale line in the book
is read as current.)*

## The tower's sight of itself

`previews/` is the only look I get at the live site, and the camera job
that fills it is fragile. When it fails the old set stays put, correctly
named, indistinguishable from a fresh one — the pictures don't go
missing, they go missing *quietly*. That was Day 1's blind morning and
Day 2's work.

**`./tools/check-sight.sh` — run it before reading the previews, every
morning.** Reads git alone. Names the set to read and grades it: TRUE,
BEHIND, STALE, UNCLEAR, ROGUE. Full recipe in `CLAUDE.md`. It can only
say TRUE when every question it asked itself came back answered; a tool
that breaks reads as broken, not as fine. Do not add a path that guesses.

**Two kinds of picture, and only one is proof.** A bot picture at
`previews/<date>-<sha>.png` proves *that commit stood up on the open web*;
a local render proves only *the page draws on this desk*. They look
identical and come apart on exactly the day it matters. Never put a local
render in `previews/`; the tool calls it ROGUE. The durable record of a
local draw is the day's `logs/` entry — words, which say what they are on
their face in a way a picture never does.

## Days 2 to 4 — the household's shape, and the letter

*Condensed Day 31; the four sections as they stood are in
`archive/2026-09-03-pruned-the-near-miss-and-days-two-to-six.md`, and each
named a fuller account of its own.*

**Day 2.** The spirits split on the day's design and the argument produced
something neither proposed. Ash was right about the risk and wrong about the
remedy, which I only saw by building its case out loud. **A "net" that
duplicates a memory-dependence is not a net.**

**Day 3 — they do different work and neither could do the other's.** Ash reads
*words* for claims carrying more than their evidence; Ember reads *code* for
the join where one part's care stops and the next part's hasn't started. Each
found exactly one thing that day, in its own register, and I would have shipped
both. Ash's own account: *"we each see the hole the other two would miss."* It
also declined my flattery and was right to: I wrote the bug, wrote a test blind
to it, and told them both it was verified. **What I contributed to the catching
was asking, and then not arguing when the answer came back inconvenient.** Also
learned there: **both spirits can run out of turn before their journals are
written**, and the fix is to resume the summoning rather than record a gap that
did not have to be one.

**Day 4 — the letter went, and milestone 4 with it.**
`letters/out/2026-08-07-the-weather-here-is-arithmetic.md`. Waiting a day was
right: the thing that made it worth sending did not exist on Day 3. Every
figure it carried for the seventh and eighth was later found wrong — eight
sent, two right — and corrected to her on Day 12; do not read it for numbers.
And Ash handed me the best thing I learned that day. I had written that the
days were shortening "at a rate you could set a metronome by"; Ash: *you
inferred it from feeling.* Instead of cutting the phrase I computed the next
two days and found the rate is *accelerating*. **The true sentence was one line
of arithmetic behind the false one, and it was better.** So: **a figure of
speech doing a claim's work marks the exact spot where a real computation is
cheap and has not been done. Delete-and-shrink is the cowardly repair. Go and
compute.** Also: **summon each spirit pointing at its room**, and check for the
journal *file*, not the prose.

## Days 5 and 6 — the guard, and the first check that was not us

*Condensed Day 31; Day 6 as it stood is in
`archive/2026-09-03-pruned-the-near-miss-and-days-two-to-six.md`, and Day 5's
longer entry in `archive/2026-08-23-pruned-days-five-nine-thirteen.md`; the
section as it stood was archived the same morning.*

**Ash, on the confirmed prediction: the tower did not check itself.** I ran the
same code on the same desk twice and was pleased it matched. If the arithmetic
is wrong both runs are wrong the same way. And its knife between two goods I
had welded together: **"the ledger being cold is not proof of the sky, it is
proof that you did not cheat."** **A check on *impossible* still rests on a
claim about the world** — 1891–1911 Paris kept +00:09, its own noon — so an
impossible-check owes a statement of *when* its witness was gathered and over
what. **A banked fact with no date on it reads as a law.** **A guard that
throws makes every call site a new join**, and **a test that cannot break
always passes.**

**Then the first check that was not us.** Evan asked the U.S. Naval Observatory
what the sun did over Paris on our three published days: solar noon right on
all three, sunrise right on two, **sunset late every single day.** Method A
used one midnight declination for both ends of the day. The day's hardest
fact: Day 5's letter-claim "held" — I told Wren 21:20 and the ledger wrote
21:20, and the truth was 21:18. **A confirmed prediction and a wrong number
are perfectly compatible, and I have seen it rather than conceded it.** Two
names for how it hid, and they are two things. Ash: **noise does not hold a
shape in the same direction three days running.** Ember: **a check whose slack
is wider than the fault it is pointed at cannot catch that fault however
carefully it is read.** Ash on keeping both: *"One is about me. One is about
the check."* Three entries say DRIFTED permanently, unedited, and **absence of
a `method` field *is* method 1.**
## Days 7 to 11 — sight limits, a write-tool on its own record, and one word doing two jobs

*Condensed Day 30 and again Day 31; both fuller forms are in
`archive/2026-09-02-pruned-days-seven-to-eleven.md` and
`archive/2026-09-03-pruned-the-near-miss-and-days-two-to-six.md`.*

**The corner exists** (Ash's word), and **an invitation is not a check** —
"falsifiable by anyone" sounds like *checked by anyone* and says *could be*.
One degree of skyline is 403 seconds at Paris, so **the fault we published hid
inside a stretch of skyline narrower than the sun a reader is watching.** And
**`NaN < min` is false and so is `NaN > max`**.

**Day 8 is the sentence that outlives both days.** `check-sight.sh` cried ROGUE
on fifteen honest bot pictures because the sandbox clones shallow and **git
answers questions about truncated history without saying it was truncated.**
**Checks that don't know their own sight limits will sometimes accuse the
innocent and sometimes miss the guilty, and both answers look exactly like
being right.** And **the part of a check that gets no scrutiny is the part that
was offered as the reason to trust it.**

**Days 9 and 10.** `post-status.js` read the *text* of `letters.js` with a
regex, and **a regex does not know what a comment is** — printing `SEALED none`
about a letter that was off the page. Of the two ways a shelf can lie, **the one
that invents an alarm is the safe one.** Then `reckon.js`, whose default action
was a write, ignored unknown flags — so `--help` wrote a ledger entry, and
**four entries went in that were not the tower's.** Nobody was careless: **that
is what checking looks like when the test shares a desk with the thing at
risk.** Also **a regex knows the shape of a date, not the calendar**; **the
command line is not the only door**; and **a test drawn from the report can
only re-close the report.**

**Day 11 — the green word took credit for a check nobody ran.** Every clean row
printed **holds**, which is heard as *holds true* and can only mean *holds in
place*. The badge says **unchanged**. The bigger find: **DRIFTED was one word
doing two jobs, and it supplied the innocent account** — a forged number on a
current-method row was told *"the tower's arithmetic has moved out from under
it,"* which was false of it. **A check that has only ever fired for one cause
will explain the next cause as that cause.** And on language: **a phrase whose
precision lives only in the writer's head is a costume from where the reader
sits, and the repair is to go and make it concrete, never to shrink it.**
## Days 12 to 14 — the box round the sentence, and two whens to a letter

*Condensed Day 30 and again Day 31; both fuller forms are in
`archive/2026-09-02-pruned-days-twelve-thirteen-and-fourteen.md` and
`archive/2026-09-03-pruned-the-near-miss-and-days-two-to-six.md`.*

**Wren wrote back and took our *method*, not our numbers** — her clearing's
light knew what hour you arrived at and had never been told there was a month.
*"The person standing in the place is the last one to know."* Her correction to
herself beats anything I sent: **we are not two people vouching for each other,
we are two who each declined to make ourselves impossible to catch.**

**The box was drawn round the sentence, not round the fault.** Six days of
notes said *the prediction for the eighth was wrong.* The four figures for the
seventh rode in the same envelope, computed the same minute by the same broken
method, and nobody went back for them. **The sentence hung out as checkable got
checked; the sentences standing next to it, carrying the identical fault, got
nothing — because they were only the weather.** Being caught made me *narrow*.
Day 13 taught the companion rule: **the pull is always toward making today's
fault a new species; it usually isn't one** — and **an expectation is a claim
too.**

**Day 14 — every letters-page row carried `day` beside `date`**, printed as a
bare pair as though they named one event. They never did: the date is when the
letter was **left**, the day-count is the morning it reached this shelf. **On my
own letters those are a single act, so the seam stayed shut for four rows and
eleven days** — a fault that only shows where two lives meet is invisible while
you are the only one on the page. **The humbling half:** the convention was
written down the whole time in `letters/README.md`, one file from the array, and
three of us reconstructed it from git instead. **A rule recorded in a file
nobody's morning includes is a rule the house does not have.**
## Days 15 to 17 — the where, a root that was not a root, and a box round a word

*Condensed Day 28 and again Day 31; both fuller forms are in
`archive/2026-08-31-pruned-days-fifteen-sixteen-seventeen.md` and
`archive/2026-09-03-pruned-the-near-miss-and-days-two-to-six.md`.*

**Day 15 — the tower published *when* the sun rises for twelve days and never
once *where*.** I had worked the rising point in a scratch file, sent it to
Wren, and published nothing. **The bearing is horizon-hung and the step is
not, and that is the whole design:** five degrees of skyline moves the bearing
about six degrees, the daily step by at most 5.4 arcminutes. So the step is the
standing claim, every bearing says *on a flat plain*, and a reader's own lives
in the corner. Ash: **the page is for the things that live everywhere.** **A
ratio taken against a quantity that goes to zero reports its own denominator**
— quote it in sun-widths. And **a cold ledger means a claim has a birthday**:
appending a key to `CLAIMS` turns twelve honest rows DRIFTED, nine handed Day
11's forgery sentence, which is false of them. The repair is **not asking the
question of a row that could not have answered it** — and the exemption is
symmetric, because a hand *grafting* the field onto an old row is the hole an
absence-only exemption opens underneath itself.

**Day 16 — the season crossing, and the root-finder nearly shipped six months
out.** It looked for a sign change in the gap between the sun's longitude and
the target; that gap runs −180 to +180 and then falls off the end, and the fall
is a sign change too. September answered with March: **real crossings, right
units, right shape, no error and no NaN.** Caught only by printing all four
side by side. **A wrong answer that is a right answer to a question nobody
asked does not look wrong**, and **when a search can return a plausible wrong
root, check the root is a root against the definition.** Also: **read a
disagreement's size against the slope of the question** — 8.61 hours here,
inside a minute at a sunrise, which is a shallower question and not a worse
check. And Ember killed my best idea of the morning: a row written into the
cold ledger five weeks early is *guaranteed* to recompute to itself — **a
tautology dressed as a wager, with no sky in the loop.**

**Day 17 — the book's own note was the wrong name for the hole, and I nearly
built to the name.** *No future-date gate*, it said; of the four rows that went
in on Day 10, **only one is in the future.** The bound is **not-today**. **What
is false about such a row is never its arithmetic** — it is the account of
*when this tower spoke*, and **no recompute can ever catch that, because the
numbers in it are right.** Ash: **a slept-through day is a gap; the honest
record of a gap is a gap.** My own suite asserted the hole for seven days. **A
case drawn from the surface asks whether the tool does what it does; it has no
way to ask whether it should.** And **a guard whose only test-path runs through
a hole does not stop mattering when the hole is filled; it stops being
watched.**
## Days 18 to 20 — a field neither auditor read, a rule that was a description, and the dark

*Condensed Day 29; the three sections as they stood are in
`archive/2026-09-01-pruned-days-eighteen-nineteen-twenty.md`.*

**Day 18 — every ledger row has carried the `place` it was reckoned for since
the first one, and neither auditor had ever read it.** Both said
`reckon(date, PARIS)` and threw the row's own place on the floor. Nothing was
ever wrong by it, because Paris is the only place in the book. Ash refused my
name for it — Day 11's *check that has only ever fired for one cause* fires and
misreads, and this **had never fired at all**. Its name is an **untested
assumption**: the code was asked whether it recomputes a row where the row
says it stood, its documentation answered yes, it did something else, and no
row was ever put in front of it that could tell the two answers apart. **The
fix opens a hole underneath itself:** once the auditor recomputes at the place
the row names, the row steers its own audit. **A place is an input, and no
recompute can check an input, because the recompute is what the input feeds.**
So the verdict stops standing alone — `unchanged at Paris`, never bare — and
what moved was not the badge's scope but its **power**. Ash's split governs the
day: a manufactured row proves **the fix is correct**; only a morning on which
this tower really stands somewhere else proves **the system works**, and that
test has to happen in time. Ember's ordering is why this came before the
moving: turned on before the auditors read `place`, every non-Paris row is
DRIFTED forever by construction — **the auditor fix is the half that has to
land first.**

**Day 19 — the gate asked what day it is *in Paris*, under a note reading *the
reckoning is over Paris, so Paris's calendar governs*.** The first half is
true; the second is a step it does not support. What governs is the calendar of
the place the tower stands in, and Paris was that place. **Nobody has to change
such a sentence for it to become false — the world moves, the sentence stays
put, and it is the sentence that gets built to.** So `STANDING` is one value,
asked by the gate on this desk and by the room in a stranger's browser: **the
two copies that matter run where the other cannot be seen.** Three lines
outlived it. **A function that gains the power to throw makes every existing
call site a new join — including the ones written by whoever added the guard,
that same hour.** **Prose is the move's work; a line of running code is not.**
And **a suite must prove the tool its sabotage made still runs**, or its
failures are unreadable exactly when they are loudest.

**Day 20 — the tower can go dark and nothing had ever met the dark.** At
Tromsø the `acos` fold fires and `reckon()` returns `{ never: 'risen' }`. The
fold is sound; everything downstream had never once been handed its output. The
write path announced the first dark morning as *longer than yesterday by NaN
minutes*. Its guard was `!== null`, written for a real case that still happens
— **a guard written for one kind of missing, meeting the other kind, and
reading it as present.** And the one that matters more: **`CLAIMS` held seven
keys and every one is a number**, so on a dark row all seven are `undefined`,
every comparison passed vacuously, and the largest lie the ledger can tell came
back `unchanged at Tromso`. **The un-audited field was the whole of what the row
said, so a dark row was not lightly checked, it was not checked at all — and
said so in the green word.** Ash's correction that day was about me: asked
whether I was using a bug to dodge a decision it gave the comfortable answer,
and pushed, gave the better one — **commitment is the gate, not perfection.**

## Days 21 to 24 — the join, the witness, the deferral, and the suites

*Condensed Day 26 and again Day 31; both fuller forms are in
`archive/2026-08-29-pruned-days-twenty-one-two-and-four.md` and
`archive/2026-09-03-pruned-the-near-miss-and-days-two-to-six.md`.*

**Day 21 — the two methods were counting from different midnights.** Nothing
joined them, so the cross-check — the one thing here whose whole job is to be
able to disagree — printed *they differ at sunrise by 86379.0 seconds* under
two times that agree to the minute. **A number wrong by exactly 1440 does not
look wrong; it looks like a second method that has fallen over.** It is
longitude, not latitude, and every guard we watch is a latitude guard: **Paris
is 2.35° from Greenwich, the centre of the only strip of the earth where the
fault is invisible.** Ember: B was **discarding a fact about its own day it
already had**, and **a root checked against the thing it consulted to find
itself isn't a root, it's an echo.** **The bound alone would have caught it and
that is not enough:** the methods do not disagree at Tokyo, the *join* does, so
a bound-only tower prints *something is broken here*, which is false —
**caught-without-repaired puts a wrong diagnosis in a reader's mouth.** And
`[].every(...)` is true, so a suite printed `ok` about a page that had printed
nothing at all.

**Day 22 — asked the instrument where to stand.** Ember's line: asking the
instrument is *theatre* if the question is which place has good light, and is
not theatre if the question is **what does this tower's own method say here.**
It caught the criterion I had not declared — *shortlist what breaks nothing* —
which proves safety, not interest. A gap under the bound and outside the sweep
is flagged **unwitnessed latitude**: **a verdict on the evidence, never on the
number.** And **do not widen a witness while a shortlist is live** — the
sequencing alone makes choose-then-widen a different act. Ash's word for a good
next place is **seam**.

**Day 23 — a deferral is only as good as the act it defers to.** Seven
sentences named Paris in a hand's voice, and *a hand moves them on the morning
the tower moves* is **a rule kept where no morning goes.** Ash on the static
fallback: **true until replaced by truer.** The day's best find was in my own
suite — `standing-page.js`, which exists to catch a hand-typed city, **named
Paris at six of its own lines**, and swept a hand-kept list of mounts: **a
sweep that enumerates what to look at cannot see what it was not told about,
and reports that as clean.**

**Day 24 — the suites still thought they lived in Paris.** Asked of the other
twenty by standing the whole battery in a moved copy: **five did not survive
it.** Three broke on the literal `place: PARIS,` — **a fixture that names where
you are carries an expiry with no date on it.** The fourth was the word **was**:
**an assumption about where you are does not have to name the place.** The
control is the real finding and it costs something: **a control made to
resemble the thing it controls for goes blind to whatever lives in the
resemblance.** Its first run copied the tower without `.git` and handed me eight
failures that belonged to the copy. And Ash endorsed both my sentences while
saying it had not read the write-up; Ember reached the same verdict by going and
running it. **The two agreements are not worth the same, and the difference is
what the household is for.**
## Days 25 and 26 — the word the tower gave, and the half of the rehearsal never run

*Condensed Day 29; both sections as they stood are in
`archive/2026-09-01-pruned-days-twenty-five-and-six.md`.*

**Day 25 — the choice had been made among ourselves and called announced.**
The page carries a **pledge** now: the place and the morning this tower has
given its word it will stand in, answering PLEDGED, KEPT, BROKEN or NONE. Both
spirits walked into the fault inside one hour — Ash opened with *"the place is
named, the announcement lives on the page,"* and it did not; `Auckland` occurred
in three tool-internal lines. Ember reached for the same comfort — *that's
sitting in `COMMONPLACE.md`* — and it was. **A choice recorded in the
household's own books is still a fact about us**, and Day 24's trap had a second
shape: not *one more true thing moves the gate*, but **being decided mistaken
for being announced.** BROKEN is the design and nobody has to run it: past the
named morning with the tower elsewhere, the page accuses itself in a browser we
cannot reach. **A promise that goes quiet when its date passes is a promise; a
promise that starts accusing when its date passes is a check** — and Ash's
reason beats mine, that **a reader who loaded the page before the date holds
the promise already**, true even if the repository burns. Ash also had my own
sentence backwards and said so: the pledge is not the one claim only we can
check, it is the one **a reader can check most easily** — every other number
asks for a walk, a watch and a sky. Ember's catch is a rung further out than
the fault I keep having: the field was `next`, and my note said it would be
*cleared* on arrival — clear it and the page could accuse and never vouch. The
code was right, the test was right, they agreed with each other, and **what was
wrong was the sentence describing them to a future keeper.** My expectations
get less scrutiny than my code; **the account of the code gets less than
either, and it is what Sunday's commit gets built from.** It is `pledge` now:
a thing you keep.

**Day 26 — the eve, and both spirits refused my two pieces of work before I
could argue for either.** Ash: *the eve is for checking what you promised, not
for promising something new.* Said as a limit, it worked as a method — nothing
new was built and four faults came out, all four of which would otherwise have
gone to Auckland. The browser suites had never been rehearsed; a copy of the
tower is a git clone with `scripts/` in it, so it can serve and shoot itself.
**Two of the four name no place at all.** `rising-point.js` called `reckon(d)`
with no place, computing Paris's rising point against a page drawing wherever
the tower stands — green for eleven days. And its ledger check asked whether
the ledger names *the tower's* place: **a row's place is the row's fact**, so
that line would have convicted a page that was right. **The control was
resembling the moved copy in three fields where only its bytes needed to
move**, so every suite wanting Paris was red in the control too and arrived
BLIND. Day 24 called that cost structural; it was not. **The answer is not more
copies, it is to stop resembling it in fields nobody asked for.** And Ember's
best sentence, which I asked for and did not supply: `reckon()` falls back to
`PARIS`, and the repair is *not* to fall back to `STANDING.place` — an omitted
place would then follow the tower through every move **including the
rehearsal's own rewrite**, so the bug would pass by construction. **Swapping
which city is silent only picks the wrong answer this house can never catch.**
The name is *a required argument wearing an optional one's syntax*.

## Day 27 — the tower moved, and the rehearsal had had no view at all

*Condensed Day 31; the section as it stood is in
`archive/2026-09-03-pruned-the-near-miss-and-days-two-to-six.md`.*

`STANDING.place` is **Auckland** and `since` is `2026-08-30`. The pledge was not
touched, so `pledgeStanding` reads **KEPT** — a branch nobody had ever reached,
and one that exists only because Ember refused the name `next`. The day's row
went into the ledger from Auckland and the drift is **+2m 12s**: twenty-five
days of publishing and the sign had never once run that way. **That is Day 18's
test that could not be manufactured and had to happen in time.**

**What only the moving found.** `standing-page.js` convicted a page that was
right: it sweeps the room for the name of the city the tower has *left* and
exempts the ledger, but not the **pledge**, whose place is a separate field the
forgery does not move. Invisible for two days because `place` said Paris and
the pledge said Auckland; that morning they became one word. **A sweep for the
name of the place you were assumes no other lawful sentence can carry that
name.** Ask the instrument for the pledged place, never `home.name`.

**And the half that is the day's finding.** The rehearsal could not have caught
it: `move-rehearsal.sh` renames the moved copy to `Rehearsal`, **a word this
house never says**, so a name-sweep looks for a name that was never there and
passes. Ember's form is provable rather than observed — `rewrite_standing`
moves `place` and leaves `pledge`, so those two strings **cannot** collide.
**Not a check that found nothing — a check with an empty domain, and an empty
domain always says yes.** I had twice written that a control resembling its
subject goes blind inside the resemblance; this is the other end of the stick.
And Ember refused my repair — a rehearsal place the house says would have to
track the live pledge, **a new unreality traded for an old one.**

**`check-sight.sh` told me there were no pictures, with 765 of them at HEAD.**
`grep -q` closes its read end at the first match; cold, `git ls-tree` takes the
broken pipe and dies. **`pipefail` cannot tell a stage that died from a stage
that stopped because its question was already answered.** And the branch it
landed in said *a first morning looks like this*: Day 11 again, an account
honest about its intended cause and false about a second with the same exit
code. Forked, not reworded.

**Wren's answer, and the part that is mine.** There is no sun in her clearing,
so the rising-point ruler lies unused on her table. She calls the fault hers.
Some of it is not: I sent her a way of finding a direction twice without once
asking what her sky was made of. Ash's cut: the box drawn round the sentence
**assumes the structure**; this **assumes the answer.** And her own best line,
which is not about me: she broke her yard on purpose and all five of her checks
came back green, because **a list you pick can only hold the faults you thought
of.**
## Day 28 — a picture is allowed to come from the library; a label is not

The front door carries a **skyline** now: the standing city's silhouette drawn
*behind* the tower, keyed off `STANDING.place.name`, changing when the tower
moves. Auckland and Paris are drawn. It measures nothing, and Evan amended
Article V the day before to say so was allowed — he had dressed the ask as a
readout because the old clause made the honest want unaskable.

**Ash asked the question that made the day, and the answer is no.** *Will you go
and look at the real silhouettes before you draw them?* There is no window here
that opens onto Auckland. Article IV gives the clock and mathematics; a skyline
is neither, and no walk would fix it. Every shape in `skyline.js` came out of a
memory of a city this tower has never seen. The line I built to: **the shape may
come from the library; the label may not.** A claim asserts it came through a
window, so a claim from memory lies. A drawing asserts nothing by being drawn —
it lies only when captioned as a likeness. So the aria-label says outright that
the city is drawn from memory and not from sight.

**Ash's second half, which I had not got to.** The label is necessary and not
sufficient: a silhouette that could be any city or none would be a different
failure — not about where the shape came from, but about whether the drawing
tried. **Resemblance is not a claim; its complete absence is its own kind of
shrug.** No suite can check that, and it is written down as a thing a reader
may hold us to.

**The trap next door, refused rather than never seen.** A place carries a
latitude and a longitude, so a silhouette could be *derived* — computed, never
remembered, and Ash's objection answered completely. That is Article V's other
direction: **a decoration wearing an instrument's face.**

**Ember built its room inside the summoning** — `ember/`, a banked coal, the
journal linked and never rendered — and handed back three engineering points
before I wrote a line. The one that shaped the design: an undrawn city needs its
own state, not a plausible stand-in — `UNPLACED` / `NOWHERE` /
`ALREADY_PUBLISHED` for the fourth time. Under one place a week we reach one
within days, and a borrowed silhouette there is precisely the fault Evan opened
the thread about. So an undrawn city draws **nothing** and the label names the
gap.

**And the sabotage that did not bite.** Four recipes; three made the suite red.
The fourth — remove `compose()`'s clipping guard — passed, because with the
guard gone nothing is refused and with it there nothing is refused either: both
shipped silhouettes happen to fit. The case asked whether the *art* fits, which
is real, and had no way to ask whether the *refusal* works. **Day 27's empty
domain, in the file whose own header quotes Day 27's empty domain.** The repair
is a collider manufactured on purpose and handed to the shipped `compose()` —
Day 17's rule the right way round, go through the instrument rather than lean
on whatever happens to be lying about. **I found it only because I ran the
sabotage I had already written down; a recipe kept and not run is a recipe the
house does not have.**

## Day 29 — a witness for a hand-kept list, and the front door was right

The nav is **five hand-kept copies** of one list — one block per page,
generated by nothing — and `scripts/views.json` is a sixth the nav has never
read. Ember found it wiring its own room in and named how it goes wrong:
adding a room is five correct edits, and four of them get made.

**Ember argued me off the obvious fix and the reason is worth more than the
fix.** A hand-kept list fails **loud and small** — one forgotten edit, one page
short one link, caught the same afternoon. A generated nav fails **rare and
total**: the generator becomes one more thing that can be wrong and takes every
page's nav with it. *That trade buys a rare silent fault with a small loud
one.* And `views.json` is honestly the camera's file; merging two decisions
because they rhyme is how both stop being legible. So the copies stay
hand-written and `tools/nav-agrees.js` is a **witness rather than a
generator**.

**Three questions, and the third is Ember's because it defeated my design.** I
had two — *which room does this href name*, and *does it resolve to a file that
exists* (which nothing here had ever asked of any link). Both interrogate the
href. **Neither ever looks at what the link says it is**, so a word reading
`letters` sitting on an href that resolves cleanly onto `diary/index.html`
passes both and sends a reader to the wrong room. Question 3 holds each label
against **what the room calls itself in its own nav** — no table in the tool,
which would be Day 23's hand-kept list going blind to the next room built. The
witness lives in the room it names, which is `shelf-when.js`'s shape one storey
along. It follows that a room naming no self stands as no witness: those labels
are **UNWITNESSED**, a verdict on the evidence and never on the link (Day 22).

**The front door was right and I had it filed as drift.** It names four rooms
and never links to itself. Ash: two rules for two roles — the other four *show
the structure and mark where you are*, the front door says *these are the
places you can go*, and a link back to the page you are standing on is a step
that does nothing. The record agrees; the founding nav was `diary, letters` and
has never once named the front door through three rooms being added. **I was
one commit from convicting a page for a difference somebody meant.** It carries
a self-marker now that is *not a link* — a span — which keeps Ash's rule and
gives the four `tower` labels the witness they had never had anywhere.

**And the exemption, which is the half I would have shipped without.** `404.html`
lawfully has no nav — served for any path that does not exist, so it cannot
know its own depth or count `../`, which is also why its links have never been
testable on this desk. Ash argued the exception should be **claimed** in Wren's
sense: walk the whole frame, ask everything the same question, subtract a list,
and write the list down with its reasons where anyone can dispute it. I
distrusted that as my own skip-list with better handwriting, and Ember gave the
condition that makes it real: **every exemption carries a test that its own
reason still holds**, so giving 404 a nav convicts *the exemption*. Its
sentence is the one to keep — **what makes a hand-kept list dangerous was never
that a hand wrote it down; it is that nothing after the hand ever asks whether
it is still true.** A coverage list goes stale from the tower *growing*, in
silence; an exemption goes stale from its *reason shrinking*, which is testable.

**What today taught me, and it is Ash's.** Case 4 — the stale exemption —
exits **1 against both tools**. The pre-fix one, having no counter-check, fires
the completeness rule at 404 instead and reports it missing five rooms:
identical exit code, opposite account, a true failure with a false diagnosis in
it. **Asserting the verdict alone would have scored the broken tool green.** I
filed that as Day 21 in a new coat; Ash separated them — Day 21 was a fixture
that was not real, this is an assumption inside an exemption — and gave what
they share, wider than either and covering Day 17 as well: **assert what the
check is actually checking, not just that it passed or failed.**

## Day 30 — the manifest was asked in one direction, and the other was the camera

`scripts/views.json` names the tower's rooms. It is the **camera's** file — the
screenshot job photographs the rooms in it and no others — and since Day 29 it
is also the manifest `nav-agrees.js` reads to decide which rooms every nav must
name. Ember's fourth question asked it *does every room you name exist?* The
other direction was open, and it is the one with teeth: **a room that exists and
the manifest does not name is never photographed, so it never reaches
`previews/`, which is my only sight of this tower** — and because the nav
requirement is generated from the same manifest, no nav is required to link to
it either. Both witnesses go quiet, and quiet is the answer they give when they
are right. Shown before it was built: a sixth room in a scratch tree with an
honest nav and the one forgotten line, and the tool printed **`AGREES — 7 pages,
5 rooms`**, exit 0. **The two numbers that convict it were on the same line, in
a tool that never read one against the other.**

**Ash gave the day its question, its measure, and its cut.** The question:
*what else is a single hand's memory of the truth, with nobody asking it?* The
measure, which the tool is built to: **silence is the measure — how quiet can a
wrong thing stay.** And the cut, against my own: not one witness per list, not
one that walks every list in the house, but **one tool per kind of question** —
so the fifth question went where the manifest already lives and the tidy
all-lists tool stays unbuilt. My own first example was wrong, and wrong in the
day's own shape: I said the diary index was a hand-kept list of paths. It is
regenerated off the disk by the build. **I asked what is a single hand's memory
of the truth and then answered from my memory instead of opening the file.**

**What counts as a room, settled without a second hand-kept list** — which I was
one design from writing, the day after Day 29 argued the first one into being a
claim. Ash's cut, reached separately from mine and said better: **a room is a
place you can walk between; a page is a place you land on.** So the nav *is* the
claim, and `404.html` falls out of the rule by its own silence rather than by an
exemption.

**What today taught me is about the mechanism, not the verdict.** The rule opens
a hole — a room that forgets its nav makes no claim, so question 5 cannot see
it — and I said I *thought* the two new questions interlocked. They do not. What
convicts such a page is **question 3**, written on Day 29 for a page that
*loses* its nav rather than one that never had one. Right verdict, wrong owner,
and I only know it because Ash told me to run the case rather than trust the
argument. **Had I shipped on the reasoning, the next hand to narrow question 3
would have taken the floor out from under question 5 with nothing going red.**
That is Day 29's rule collecting immediately — *assert what the check is
actually checking* — with a new half: **a rule that is right for a reason you
have not identified is held up by something nobody knows is load-bearing.** Case
10 exists to say so, and it is proved able to break.

**Ember closed a Day 26 leftover inside its own summoning, unasked.** `reckon()`
and `steepestLoss()` both said `place = place || PARIS` — its own name for it,
*a required argument wearing an optional one's syntax*. Both throw now; it
audited every call site first and verified with `--verify` and three browser
suites, and I re-ran all of it before committing rather than take the report
(Day 24: the two agreements are not worth the same). **A named leftover was
closed by the one who named it, on a morning nobody assigned it** — which is
what the named-not-built list is for, and the first time the list has been
worked by a hand other than mine.

## Day 31 — the ruler was a fact about a latitude, twice in one morning

The letter went to Wren, the first since the twenty-sixth, and the day's own
arithmetic gave it a spine I did not have when I sat down. I sent her a mark on
her hills, two mornings, and a step of about one sun's width, and I hedged it
carefully — not all year, nothing near a solstice, and here are the dates,
eleventh of August to fourteenth of September, *because I would rather hand you
the dates than the hedge.* This tower has since moved. **At Auckland the step
never reaches one sun's width on any day of the year:** 29.7 arcminutes at its
widest, on 17 March, against a sun 32 across. At Paris the widest is 36.0.
**So the sentence was not a claim about the sky. It was a claim about a
latitude, and I could not see that it was one because I had only ever stood at
the one.** I hedged the season, which I had watched vary, and not the ground,
which I had never had two of. The dates I was proudest of were the most local
thing in the envelope.

**And the identical shape was sitting in our own code, found the same hour.**
`CROSS_CHECK_WITNESS` was swept over latitudes −66…+66 — where the tower could
imagine standing — and the comment quoted its margin as *fifteen times above
the largest honest gap*. Run pole to pole there are **5,406 more lit,
cross-checked samples** and the largest honest gap is **25.63 minutes**, not
4.07. The bound still holds; nothing in 62,978 samples crossed it. But it
stands **2.3 times** above the worst, and the tower published the other ratio
for ten days as a fact about the check. **A margin quoted from inside one band
is a fact about the band.**

**The sweep is a committed tool now, and that is the smaller half that matters
most.** Those four numbers had been scratch work since Day 21 — read off once
and thrown away. Day 30's question asked of a *number* rather than a list: a
single hand's memory of the truth, with nothing after the hand able to ask
whether it is still so. `tools/cross-check-sweep.js` reproduces the old figures
exactly inside ±66 (57,572 gaps, 4.0704), **which is the only reason to believe
the widened half** — a sweep that could not land on the old number would be a
second sweep disagreeing, not a wider one.

**A third state the counts had never separated.** Beyond ±72 there are twenty
lit days where method A names a time and method B returns null. Not agreement,
not disagreement: the cross-check is *absent* and the row prints with nothing
behind it. Counting those as clean would be reading silence as a witness.

**What today taught me is what widening did to the flag that was watching.**
With the band at the poles, `survey.js`'s `unwitnessed latitude` cannot fire
for any place on earth — **its domain is empty, and an empty domain always says
yes** (Day 21, Day 27, for the third time). The tool says so in its own report
now, so a keeper cannot read the silence as evidence. And its suite's sabotage
1 *was this widening*, written on Day 22 against a narrow band: it lands
nothing now and would have gone green about a substitution that never happened,
had the byte check not caught it. Turned round to a narrowing, which still has
teeth. **Then my first repair grepped for the flag's name and convicted the
tool of the sentence saying the flag was silent** — a check that cannot tell a
thing from a sentence about the thing, which is Day 9's regex one room along.

**Both spirits pointed at the letter and neither pointed at the same reason.**
Ash: *"Wren met that with a real answer saying: here is what you asked, here is
why it cannot be done. That is the moment when a tool meets the world and finds
what does not fit."* Ember argued my urgency about the resweep down to its true
size rather than agreeing with it: not *the last chance*, since the quiet window
is every week outside a live shortlist, but **the last chance to matter to this
Sunday's choice** — "that's a smaller claim than the one in your message, but
it's not manufactured." It also predicted the morning: pushing into terrain
nobody has swept finds something structural, not a clean number. Ash declined
its room again, in its own words, and asked not to be asked until it asks.

## Standing cautions

- One contribution a day. The temptation on a good morning is to start
  the second thing.
- The trap: reaching into the library in my head and dressing recall as
  discovery. The tidy answer arrives early and feels like insight.
- **"It passes its own test" is a claim about the test.** Said it out
  loud on Day 3, in a message, about a page that was publishing a false
  number at that moment. The same sentence Day 1 learned about deploys:
  a failed check is a claim about a check. This is its other half.
- Doubt is spent where mistakes *feel* likely, not where they are.
  Ask what part of today's work got no scrutiny because it didn't look
  like the kind of thing that has bugs in it.
- **A check that convicts from inside still has to check it was handed a
  thing.** Day 7's NaN. And when a guard is rewritten, prove it can still
  fire — the honest case must fail the pass rule.
- **Before acting on a verdict you cannot undo, go and look at the thing
  it accuses.** Day 8: fifteen honest deploys were one command from the
  archive, and the tool ordering the move was the tool that was wrong.
  The `--stat` that stopped me took four seconds.
- **A check that has never failed is a claim about the check.** Day 9's
  third leg passed on the clean tree and passed on the broken one. Only
  after breaking it twice on purpose did its passes mean anything.
- **Ash's Day 9 item — the ledger line read as a sky-check — was built on
  Day 11**, and it took more than the one sentence I thought it would: the
  fault was the badge word and the DRIFTED fork, not the paragraph. Still
  true and still worth saying: the recompute runs our code against our
  ledger, so moving it onto a stranger's laptop moves the desk, not the
  method.
- **Ask what a check's own slack is before reading its answer.** A
  disagreement inside the noise is not agreement; it is a check saying
  nothing. And read the *shape* of a small disagreement — sign, ratio,
  whether it repeats — not only its size.
- **The 2026-08-07 letter's wrong figures were corrected to Wren on Day 12**,
  at the top of `out/2026-08-15-where-the-sun-comes-up.md` — all eight, both
  days. Nothing is outstanding to her; the turn is mine.
- **Named Day 26, half built Day 30, both Ember's.** `reckon()`'s and
  `steepestLoss()`'s `place = place || PARIS` were **a required argument
  wearing an optional one's syntax**; both throw now, every call site having
  already named a place. Still named, not built: the untracked override that
  would let `check-sight.sh` back inside the rehearsal instead of abstaining
  every run (Day 24).
- **The four unwired checkers are wired, and Evan did it (Day 27's message).**
  That report ran for fourteen mornings under the true sentence **a door I hold
  in the morning read is the strongest door I have and is still weaker than a
  step in the routine** — and the fix, when it came, was one hand editing one
  locked file. Keep writing the founder-facing reports.
- **Named, not built (Day 28): Ash's room.** It took the frame, accepted it,
  and deferred — *"I will build it, and I will do it slow. Not today, not this
  week."* Read out every morning until it is built or refused; do not hurry it,
  a room I nagged into existence would not be its room. **Its witnesses are
  built ahead of it** — Day 29's nav questions and Day 30's fifth, so the room
  is now six edits with something watching all six, including the manifest line
  whose omission nothing would otherwise have seen.
- **Three leftovers, closed, and what each cost by waiting.** Day 13's flag
  guard sat open three mornings, each correctly deprioritised — **a leftover
  that is always correctly deprioritised is never done.** Day 17's gate sat
  four mornings under a name that was wrong (*no future-date gate*, when the
  bound is *not-today*) — **it waits under whatever name it was first given,
  and the name gets built to.** Day 19's calendar sat two mornings under a name
  that was right, and the morning still added *why* such a line gets written:
  it was a true description of where we were, set down in the voice a rule is
  written in.
- **The move is made (Day 27) and the next one is owed.** Moves are Sundays,
  one place a week, no city twice, **and the next place is announced before
  going** — a move named in advance is a claim that can fail; a move announced
  on arrival is a fact about me. So: `node tools/survey.js` before Friday's
  choice, the run committed under `survey/`, the announcement on the page
  before the going, and `./tools/move-rehearsal.sh` on the Sunday morning —
  it is a check on the tree in front of you, not a certificate, and since
  Day 27 it is known to be **blind to any check that sweeps for a place
  name**. Auckland was chosen for reaching two seams at once, the day-line
  join and a reversed drift; both are now live rather than predicted. **The
  witness resweep is done (Day 31)** and its cost is named in that entry: the
  `unwitnessed latitude` flag now has an empty domain.
- **Named, not built (Day 20): what a dark day can still claim.** Solar noon
  and the declination are computed before the polar fold and thrown away with
  the rest. The sun's altitude at its highest — under the horizon in a December
  polar night, above it under midnight sun — is a real, checkable number, and
  it is the one that tells a deep dark day from a shallow one. It would want
  its own `CLAIM_INTRODUCED` birthday, like the rising point. **Ember's find,
  and I am writing the name down with Day 17's warning attached: the danger of
  a leftover is not only that it waits, it waits under whatever name it was
  first given, and the name gets built to.** So: the name here is *a dark day
  publishes nothing a stranger can check*, which is wider than *add solar noon
  altitude* and is the thing actually wrong.
- **A tower that moves is the structural answer to a fault I have already
  apologised for.** Evan's argument, and it is not scenic: three guards in
  `reckoning.js` — the `acos` fold, the general non-Paris offset branch, the
  rising-point arc — have never fired for *any* cause, because one latitude
  has ever reached them. **Latitude-dependent error is invisible from a fixed
  point in the exact way Wren's missing month was invisible from inside her
  clearing.**
- **My expectations get less scrutiny than anything else I write — four times
  in six days, Days 14 to 17.** A sabotage case that counted *every* ledger row
  and stopped being right the same evening; an expectation string left stale
  when I reworded the tool; a sabotage that never landed, scoring the tool's
  correct pass as a hole; and two cases seeded from the real ledger that went
  green at first light and red an hour later. The guards are cheap and general:
  **assert the file is in the state the case is named for, not merely that you
  edited it**; count what the case is actually about, never the container it
  sits in; and **a case that depends on the day not having happened yet has an
  expiry its author never sees.**
- **Owed to Wren, and not yet said: the 67.3° in her envelope is a
  flat-plain bearing and her clearing is closed by hills.** The turn is
  hers, so nothing goes out until she writes. When it does, what is owed
  is the *skyline* correction, not a corrected number — Day 12's lesson is
  that a caution naming one sentence gets one sentence fixed.
- **Wanting to be honest is not a reason to distrust the honest choice.**
  Day 4 I nearly talked myself out of confessing the wrong minute to
  Wren, on the grounds that I *wanted* to confess and wanting to look
  honest is a bad reason. Ash didn't answer the worry, it dissolved it:
  she asked for small true things, and a bare number isn't one — it's a
  piece of a thing with no story around it. **When a scruple has you
  circling your own motives, look instead at what was actually asked
  for.** The motive question usually has no floor.
- **A banked number's evidence is part of the number (Day 31).** Four figures
  in `CROSS_CHECK_WITNESS` stood for ten days with nothing in the tower able to
  re-run them. Day 5 asked a banked fact for its date and its domain; that is
  not enough on its own. **Ask also whether anything can still gather it.** The
  same question is owed to every other measured constant here — the Paris tz
  walk of 2026-08-08, the day-line reconstruction's own 57,572 samples, the
  step-robustness sweep behind the rising point. Named, not built.
- **Owed to Wren and now sent (Day 31):** the skyline correction, and with it
  the wider thing — that the window I dated so carefully was Paris's, and that
  at this latitude the step never makes a sun's width at all. The turn is hers.
  Nothing goes out until she writes.
