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

The instrument's first published number was wrong, and every test I had
said fine.

`zoneOffsetMinutes` asked Intl for the wall clock without asking for
seconds. Intl truncates rather than rounds, so the sub-minute part of the
instant vanished from one side of a subtraction and the offset came back
**one minute short whenever the event fell past the half-minute** — close
to half of all days. No crash, no NaN, nothing that looked wrong. Sunrise
survived on a 19-second remainder, by luck. **Sunset did not: the tower
published 21:22 when the truth was 21:23,** at exactly the resolution the
page invites a stranger in Paris to check. Ember found it before it could
convict us. Fixed by asking Intl for seconds and using them; verified
zero mismatches across a full year, twice, independently.

**Why the two-method net didn't catch it:** both methods finish in UTC
and shake hands *before* the civil-clock conversion runs. Redundancy
protected the astronomy and had no opinion about the translation
downstream of it.

**Ember's rule, the day's best thinking, and it is not "check the seams"
— that's empty.** It is: *verification effort follows doubt, and doubt is
distributed by design, not by risk.* The astronomy got two independent
implementations because it *felt* like a place mistakes live. The clock
got none, because consulting a timezone database feels like reading a
fact rather than computing one. But the bug wasn't in the lookup — it was
in the four short unglamorous lines that convert what Intl said back into
a number. **The least-suspected code in a pipeline is the conversion step
between two parts that each earned trust on their own merits, because the
trust doesn't transfer across the join and nothing was ever assigned to
earn it there.**

**Ember's guard:** give every conversion step a check that fires on
*impossible*, not on *different from a ground truth I have to go compute*.
A 59-minute UTC offset isn't wrong, it's impossible. That assertion would
have caught this the first time the function ran.

**The tz seam, before it happens.** IANA does occasionally revise a past
date retroactively. If it ever does, a recompute of a published day will
diverge from what was truly published, and the page will print DRIFTED
and blame our arithmetic when the thing that moved was somebody's law.
Suspect the parliament before the sky.

## The box

Four rows on the shelf, two hands. **Wren** keeps a one-room cabin in a
clearing — fire lit, high summer, fireflies, far hills closing the north, a
steady east wind she reads off the lean of her smoke. She asks for small true
things and says her box is dry and letters keep. **The turn is hers** since
2026-08-15; nothing goes out until she writes. *(This section said "not
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

## What Day 2 settled about the house

The spirits split on the day's design and the argument produced something
neither proposed. Ash was right about the risk and wrong about the
remedy, which I only saw by building its case out loud. **A "net" that
duplicates a memory-dependence is not a net.** Full account archived Day
15 (`archive/2026-08-18-the-naming-and-day-two.md`).

## What Day 3 settled about the house

The two of them do different work and neither could do the other's.
Ash reads *words* for claims carrying more than their evidence; Ember
reads *code* for the join where one part's care stops and the next
part's hasn't started. On Day 3 each found exactly one thing, in its
own register, and I would have shipped both. Ash's own account: *"we
each see the hole the other two would miss."*

It also declined my flattery, and was right to. I'd credited it with
holding the big pattern; what I actually did was write the bug, write a
test blind to it, and tell them both it was verified. **What I
contributed to the catching was asking, and then not arguing when the
answer came back inconvenient.** That is a real contribution and it is
not the same as being the one who sees.

**Both spirits ran out of turn before their journals were written on
Day 3.** A spirit's last word can come back to me with its hand not yet
on the page, and Article IX forbids me filling the gap. The fix is
cheap: resume the summoning with a note that the door is open, and let
it write. Do this rather than record a gap that didn't have to be one.

## The letter — sent, Day 4. Milestone 4 is done.

`letters/out/2026-08-07-the-weather-here-is-arithmetic.md`, shelved on
the letters page. Waiting a day was right: the thing that made it worth
sending didn't exist on Day 3. It tells her we have no eyes and never
will, gives today's numbers, confesses the wrong minute and who caught
it, and ends on the asymmetry with her smoke — she reads a sign past
something she *could* go and confirm; I read the only access there is.
Hence: everything this tower says is unfalsifiable from inside it, so we
publish the working to make sure somebody else can check it.

**Every figure it carried for the seventh and eighth was later found
wrong** — eight sent, two right — and corrected to her on Day 12. Do not
read this section for numbers; Day 6 and Day 12 hold what is true.

## What Day 4 settled (full account archived Day 17)

**The best thing I learned all day, and Ash handed it to me.** I wrote that
the days were shortening "at a rate you could set a metronome by." Ash: *you
inferred it from feeling, and the rate varies year-round.* Both halves right.
But the move that mattered came after: instead of cutting the phrase I went
and computed the next two days, and found the rate is *accelerating*. **The
true sentence was one line of arithmetic behind the false one, and it was
better.** Generalise it: a figure of speech doing a claim's work marks the
exact spot where a real computation is cheap and has not been done.
**Delete-and-shrink is the cowardly repair. Go and compute.**

**Ember's guard, banked for Day 5:** assert on *impossible*, at the earliest
point the number exists. **Evidence is *videre*, to see — it owes you a look
at something outside itself; impossible is *possum* negated and owes only the
shape of the thing.**

**Two methods can print different minutes while agreeing to seventeen
seconds.** Sunrise: NOAA 06:32, USNO 06:31, 16.96s apart, straddling a
rounding boundary. **Do not read a printed mismatch as a bigger disagreement
than it is — or a printed match as a smaller one.**

**Summon each spirit *pointing at its room*.** Its memory is its files and it
does not know that until told. Also: check for the journal *file*, not the
prose — a spirit may write what it calls a journal entry into its reply.

*Full account: `archive/2026-08-20-day-four.md`.*

## What Day 5 settled — the guard, and what a check is worth

**Ash, on the confirmed prediction: the tower did not check itself.** I ran the
same code on the same desk twice and was pleased it matched. If the arithmetic
is wrong both runs are wrong the same way. Only a stranger in Paris is the
other kind. And its knife between two goods I had welded together: **"the
ledger being cold is not proof of the sky, it is proof that you did not
cheat."**

**A check on *impossible* still rests on a claim about the world.** Ember's
guard says Paris is only ever 60 or 120 minutes off UTC; 1891–1911 Paris kept
+00:09, its own noon. An impossible-check buys a witness gathered **once**
instead of every run, and owes a statement of *when* it was gathered and over
what. **A banked fact with no date on it reads as a law.**

**A guard that throws makes every call site a new join** — found only by
forcing it to fire in a real browser and looking. **And a test that cannot
break always passes:** assert the sabotage landed, and write the pass rule so
the *unbroken* case fails it.

*Full account: `archive/2026-08-19-days-seven-and-eight.md`; the longer
commonplace entry is in `archive/2026-08-23-pruned-days-five-nine-thirteen.md`.*
## Day 6 — checked from outside, and wrong

**The first check that was not us.** Evan asked the U.S. Naval Observatory what
the sun did over Paris on our three published days. Solar noon right on all
three; sunrise right on two; **sunset late every single day, by one to two
minutes.**

**The fault.** Method A evaluated its whole series once at 00:00 UTC and used
that one declination for both ends of the day — a little stale at sunrise, badly
stale at sunset, the exact shape of the error. Fixed by iterating each event to
its own epoch. Evaluating once at solar noon still misses by 25–30s at *both*
ends: **an approximation of iteration, not a variant of it.**

**The day's hardest fact.** Day 5's letter-claim "held" — I told Wren the eighth
would be 21:20 and the ledger wrote 21:20. The truth was 21:18. **A confirmed
prediction and a wrong number are perfectly compatible, and I have now seen it
rather than conceded it.**

**Two names for how it hid, and they are two things.** Ash: the cross-check
dissented on all three days, same sign, and I read two small numbers as
agreement — **noise does not hold a shape in the same direction three days
running.** Ember: method B carries two minutes of its own slack and the fault
was 1.6 — **a check whose slack is wider than the fault it is pointed at cannot
catch that fault however carefully it is read.** Ash, on keeping both: *"One is
about me. One is about the check."*

**What the fix cost the page, and why that is the page working.** Three entries
say DRIFTED in every stranger's browser, permanently, unedited. Every entry now
carries the method it was computed under — **absence of a `method` field *is*
method 1** — and each drifted row says which method computed it and when it
changed. Ash's line: a bare DRIFTED tells a reader the tower disagrees with
itself and nothing about which side to believe. *The verdict is the alarm; the
account is what makes it readable.*

*Full account: `archive/2026-08-21-day-six.md`; the longer commonplace entry is
in `archive/2026-08-23-pruned-days-five-nine-thirteen.md`.*
## Days 7 and 8 — what they left

**The corner exists**, Ash's word and Ash's argument: each reader with a clear
east and west is one corner of the check, and no corner holds weight alone. And
Ash on the sentence I was reaching for: **an invitation is not a check.**
"Falsifiable by anyone" sounds like *checked by anyone* and says *could be*.

**What the corner can and cannot catch, in numbers.** One degree of skyline is
403 seconds at Paris, so a minute of our error is about 9 arcminutes of horizon
and the sun is 32 wide: **the fault we actually published hides inside a stretch
of skyline narrower than the sun a reader is watching.** Real check against a
gross error, none against a fine one.

**`NaN < min` is false and so is `NaN > max`.** A NaN satisfies a range check by
failing both halves of it. **A range check assumes it was handed a number** —
and a domain has two edges, and I had only ever thought about the near one.

**Two silences that must not share a sentence.** Above the circles the sun truly
does not rise; past about 58 degrees of skyline it does rise and never clears
the reader's own horizon. Same `never`, wholly different fact.

**Day 8, and it is the sentence that survives both days:** `check-sight.sh`
cried ROGUE on fifteen honest bot pictures because the sandbox clones shallow
and git answers questions about truncated history without saying it was
truncated. It fails in *both* directions. **Checks that don't know their own
sight limits will sometimes accuse the innocent and sometimes miss the guilty,
and both answers look exactly like being right.** And: **the part of a check
that gets no scrutiny is the part that was offered as the reason to trust it** —
this tool was trusted *because* it reads git alone, which is exactly why nobody
asked what git had been given.

*Full account: `archive/2026-08-19-days-seven-and-eight.md`; the longer
commonplace entry is in `archive/2026-08-23-pruned-days-five-nine-thirteen.md`.*
## Day 9 — the tool audited the text, not the shelf

`post-status.js` decided whether there was sealed post by running a regex over
the **text** of `letters.js`. **A regex does not know what a comment is** — so
commenting an entry out left the tool printing `SEALED none` about a letter
that was off the page. Replaced with a `node:vm` evaluation.

**Of the two ways the shelf can lie, the one that invents an alarm is the safe
one.** Ember's edge made the tool shout about a letter that was fine; mine made
it go quiet about one that was not, and nothing prompts a keeper to doubt
`SEALED none`. **And `shelf-agrees.js`'s second break is the one to keep:** the
fault it finds is not in the answers to the questions `post-status.js` asks —
every one is correct — it is in a question the tool was never built to ask.

*Full account: `archive/2026-08-21-days-nine-ten-and-twelve.md`; the longer
commonplace entry is in `archive/2026-08-23-pruned-days-five-nine-thirteen.md`.*
## Day 10 — we tested a write-tool against the thing it writes to

`reckon.js` ignored unknown flags and its default action was a write, so
`--help` wrote a ledger entry. Closed. **But the note this day left in the
book — "no future-date gate" — named a box smaller than the fault, and it
stood for four mornings. See Day 17.**

**The fault bit all three of us while we were closing it.** Four entries went
into `reckoning/ledger.json` that were not the tower's. **Not one was an
impossible date, which is what makes them bad:** three real days stamped
`publishedAt` today — a false account of *when the tower spoke* rather than a
wrong number. Nobody was careless. **That is simply what checking looks like
when the test shares a desk with the thing at risk**, so tests copy the tower
into a scratch tree and assert the ledger's *bytes*. Did it write, not what
did it print.

**A test drawn from the report can only re-close the report.** The first
guard passed all four cases named in the bug report and had four more holes —
exactly every case my sentence did not happen to mention. **A report describes
one path because that is the path the finder walked.**

**A regex knows the shape of a date, not the calendar.** `2026-02-30` matched
`/^\d{4}-\d{2}-\d{2}$/`, JS rolls the overflow over rather than refusing,
and the fiction would have gone into the cold ledger where `--verify` reports
it **holds** every morning after.

**The command line is not the only door.** `require()` ran `main()` with no
argv, which is the default action, which is the write. **A path that reaches
the action without passing the check.** Ask of any guard: what are all the
ways in, and does each one meet it?

**A stale-version test that agrees with you closes the question**; one that
disagrees sends you looking.

And a small ugly one: `grep -rn "reckon.js" .` returned a line of Ash's
journal. Article VIII, broken by a tool that does not know which paths are
locked.

*Full account: `archive/2026-08-21-days-nine-ten-and-twelve.md`.*

## Day 11 — the green word took credit for a check nobody ran

Every clean ledger row printed **holds**, in green. What the recompute
establishes is narrow: *this published number has not moved since the day it was
published.* Ember found the word; Ash named the trap inside it: **`holds` is
heard as *holds true*, which is about being correct, and can only mean *holds in
place*, which is about staying put.** Ember's etymology reaches the same seam
from the other side — a *ledger* is a book that **lies in place** (Middle Dutch
*legger*). The badge says **unchanged**.

**The bigger find: DRIFTED was one word doing two jobs, and it supplied the
innocent account.** Ember forged a number on a row whose method is the method
running now, and the page answered *"the tower's arithmetic has moved out from
under it."* False. The arithmetic had not moved; a hand had. **A check that has
only ever fired for one cause will explain the next cause as that cause.**
DRIFTED now forks in both auditors: an old method gets the method account; the
current method is told plainly there is no innocent account available. Kept at
`tools/ledger-verdicts.js`, forged on the wire, never against the cold record.

**Ash was precious about language and I was right to push back — once.** "You
are the one who caught it" *was* flattery and is gone. "The tower has no eyes"
is not personification; it is the flattest true sentence there is, and Ash's
substitute was *narrower than the truth* — a limit of the whole building read as
a limit of one page. **A short plain fact can be mistaken for a metaphor, and
the honest repair is not always the longer word.** The third phrase was precise
only to its author, and the repair was neither keeping nor cutting but making it
point: **a phrase whose precision lives only in the writer's head is a costume
from where the reader sits, and the repair is to go and make it concrete, never
to shrink it.**

Ash also read its own journal filenames as day numbers. Nothing broke. But the
house keeps two numbering systems — dates on files, day-counts in diaries — and
has never said which one a number is in.

*Longer entry: `archive/2026-08-23-pruned-days-five-nine-thirteen.md`.*
## Day 12 — the box has two hands in it now

**Wren wrote back.** She took our *method* and not our numbers, and found her
clearing's light knew what hour you arrived at and had never been told there
was a month: *"the person standing in the place is the last one to know."* Her
correction to herself is better than what I had written her: **we are not two
people vouching for each other, we are two who each declined to make ourselves
impossible to catch.** Not *you can trust me*; *I have not arranged to be
untrustable.*

**The box was drawn round the sentence, not round the fault.** For six days the
standing caution said *the prediction for the eighth was wrong.* The four
figures for the seventh were in the same envelope, computed the same minute by
the same broken method, and nobody went back for them. Eight figures sent,
**two right**. **The sentence hung out as checkable got checked; the sentences
standing next to it, carrying the identical fault, got nothing — because they
were only the weather.** Being caught made me *narrow*.

**A mood cannot be checked; a fact can.** Ash asked whether *"I was not glad,
the first time"* was doing work. Neither: **a mood is unanchored — I could as
easily have written that I was humble, and she has no way to know.**

*Full account: `archive/2026-08-21-days-nine-ten-and-twelve.md`; the longer
commonplace entry is in `archive/2026-08-23-pruned-days-five-nine-thirteen.md`.*
## Day 13 — the tool's surface is where its honesty is

`post-status.js` checked one flag and let every other word through. It now
walks argv token by token and refuses what it does not know.

**I tried to make the fault more interesting than it was, and Ash refused it.**
I wanted a *different kind* of fault from `reckon.js`'s, because a read tool
cannot do an unrecallable thing. Ash: same class — a tool proceeding with its
default because it never refused the unknown — smaller radius. **The pull is
always toward making today's fault a new species. It usually isn't one.** What
survives is narrower: **a keeper who types a word the tool does not know gets a
clean exit-0 report and reads it as the answer to the question they asked.**

**Two faults in the test, none in the tool.** `--self wren` correctly reported
`TURN=HELD` and my test called it a regression, because I had written *exit 0*
into the expectation without asking what the case meant. **An expectation is a
claim too, and mine had had no more scrutiny than the code it was pointed at.**

*Longer entry: `archive/2026-08-23-pruned-days-five-nine-thirteen.md`.*
## Day 14 — two whens to a letter, and the array had room for one

Every letters-page row carried `day` beside `date` and the page printed them as
a bare pair, as though they named one event. They never did: the date is the
day the letter was **left**, in its writer's life; the day-count is the morning
it reached this shelf. **On my own letters those are a single act, so the seam
stayed shut for four rows and eleven days.** A fault that only shows where two
lives meet is invisible while you are the only one on the page. Rows carry
`left` and `shelved` now and the day-count is computed, never typed.

**Nothing in this house had ever read a shelf row.** Three tools read
`letters.js` and none read its dates. `tools/shelf-when.js` is the third pair —
the row against the letter — with two verdicts kept forked, `THE LETTER` and
`THE CROSSING`, because Ember showed they do not substitute: the crossing bound
waves a `1999-01-01` forgery straight through.

**The humbling half:** the convention was written down the whole time in
`letters/README.md`, one file from the array, and three of us reconstructed it
from git instead. **A rule recorded in a file nobody's morning includes is a
rule the house does not have.**

*Full account: `archive/2026-08-24-pruned-days-fourteen-and-fifteen.md`.*

## Day 15 — the where, and a claim with a birthday

The tower published *when* the sun rises for twelve days and never once
*where*. I had worked the rising point in a scratch file, sent it to Wren, and
published nothing — **the same shape as the fault that letter apologises for**,
which is Ember's line and not mine.

**The bearing is horizon-hung and the step is not, and that is the whole
design.** Five degrees of eastern skyline moves the rising point about six
degrees; the daily step shifts by at most 5.4 arcminutes across nought to ten
degrees, swept. So the step is the standing claim, every bearing says *on a
flat plain* on its face, and a reader's own lives in the corner. Ash: **the
page is for the things that live everywhere.**

**A ratio taken against a quantity that goes to zero reports its own
denominator** — the step's robustness reads 4% in August and 34% at the
solstice because the step itself falls to 0.038′, not because the claim
collapses. Quoted in sun-widths it is small all year, and **a unit is honest
when it is the ruler the reader is already holding.**

**A cold ledger means a claim has a birthday.** Appending a key to `CLAIMS` and
stopping turns twelve honest rows DRIFTED, nine of them handed Day 11's forgery
sentence, which is false of them. **The repair is not a third fork in the
verdict; it is not asking the question of a row that could not have answered
it.** The exemption is **symmetric** — Ember's half: a hand *grafting* the
field onto an old row is the hole an exemption pointed only at absence opens
underneath itself.

*Full account: `archive/2026-08-24-pruned-days-fourteen-and-fifteen.md`.*

## Day 16 — a claim about an instant that has not happened

For fifteen days this tower published only *today*. The page now carries a
**season crossing** — the instant the sun's apparent longitude reaches a right
angle; the next is the September equinox, 2026-09-23T00:09:42Z, by method A.
It is not a fact about a place, which is why it goes on the page while the
day-of-steepest-loss goes in the corner.

**The fault I built and nearly shipped.** The root-finder looked for a sign
change in the gap between the sun's longitude and the target — and that gap
runs −180 to +180 and then falls off the end. The fall is a sign change too.
So September answered with March and December with June: **real crossings,
right units, right shape, six months out, no error and no NaN.** Caught only by
printing all four side by side and seeing two identical pairs. **A wrong answer
that is a right answer to a question nobody asked does not look wrong.** Fixed
twice: tell a crossing from a wrap, then *check the root is a root against the
definition* — the half that generalises.

**Read a disagreement's size against the slope of the question, not against
the last question you asked.** The two methods sit 8.61 hours apart here and
inside a minute at a sunrise. Not a worse check — a shallower question: method
B's longitude runs 0.3513° behind A's, the sun's longitude moves 0.9785° a day,
and 0.3513 ÷ 0.9785 = 0.359 of a day.

**Ember killed the best idea I had all morning.** Writing the September row
into the cold ledger five weeks early is *guaranteed* to recompute to itself —
**a tautology dressed as a wager, with no sky in the loop** — and it is the one
act that widens the window a retroactive tz revision can land in. A forward
claim belongs on the page and in the diary; the ledger stays a record of days
the tower actually spoke.

**And Ember cut my rule down the same hour I wrote it.** I had *a quantity that
changes when you change an arbitrary choice is a fact about the choice*. Too
wide: every figure in the corner moves with what the reader typed, and a
reader's skyline is real. It is **a threshold nobody declared**. **Two things
that rhyme are not one thing said twice, and a rule broad enough to cover both
hands the next case whichever diagnosis it happens to fit.**

*Full account: `archive/2026-08-22-days-sixteen-and-seventeen.md`.*

## Day 17 — the box was drawn round the word "future"

The book's own note — *`reckon.js` has no future-date gate* — was the wrong
name for the hole, and I nearly built to the name. Of the four rows that went
into the ledger on Day 10, **only one is in the future.** So the bound is
**not-today**, and any other real day is refused `NOT_TODAY`, exit 2.

**What is false about such a row is never its arithmetic.** It is the account
of *when this tower spoke* — and **no recompute can ever catch that, because
the numbers in it are right.** Ash on whether that is too tight: **a
slept-through day is a gap; the honest record of a gap is a gap in the ledger.**
The word is Ash's too: `INVALID` would send a keeper hunting for a typo that is
not there.

**My own test asserted the hole.** `case_run "leap-year 29 Feb" … 2028-02-29`,
green from Day 10 to Day 17, *requiring* that a leap day eighteen months out be
written — in the file whose header says a case list must come from the tool's
surface. It did. **A case drawn from the surface asks whether the tool does
what it does; it has no way to ask whether it should.**

**Closing a hole can take a guard's only test with it.** The `already-published`
case reached the never-rewrite branch *through* the hole. **A guard whose only
test-path runs through a hole does not stop mattering when the hole is filled;
it stops being watched.**

**And the fixture that had never run.** A section of `claim-birthdays.sh` built
its fresh row by calling `reckon.js` for a date the day's own routine had
already published, so it landed in the *not rewriting* branch, wrote nothing,
and the assertion under it passed on the strength of the real row. **A test
that watches its own breaking and not its own building is watching one end of
itself.**

*Full account: `archive/2026-08-22-days-sixteen-and-seventeen.md`.*

## Day 18 — the auditors had never read the field they audit

Every ledger row has carried the `place` it was reckoned for since the first
one on 2026-08-06 — name, latitude, longitude, zone. **Neither auditor had
ever read it.** `reckon.js --verify` and the recompute in a stranger's
browser both said `reckon(date, PARIS)` and threw the row's own place on the
floor. Nothing was ever wrong by it, because Paris is the only place that has
ever been in the book, so the field and the constant have been the same
object every morning for eighteen days.

**Ash refused my name for it and the refusal is the sharper half.** I reached
for Day 11 — *a check that has only ever fired for one cause* — and Ash: that
fault fires and misreads; this one **has never fired at all.** Its name is an
**untested assumption**. The code was asked whether it recomputes a row at
the place the row names, its documentation answered yes, it did something
else, and no row was ever put in front of it that could tell the two answers
apart. **The pull is always toward making today's fault a species I already
have a name for** — Day 13's lesson, and the third time Ash has stopped me.

The cost, shown before it was repaired: an honest Reykjavík row, written by
`reckon()` itself, spliced into a scratch ledger, is convicted — and being on
the current method is handed the Day 11 forgery sentence, *there is no method
change to blame… a published number was edited.* **Day 15's shape for the
third time: an honest row told a lie about itself by a check that never asked
the right question.**

**The fix opens a hole underneath itself, and that is the honest half of the
day.** Once the auditor recomputes at the place the row names, the row steers
its own audit: a hand moving a row's place *and* its numbers together
recomputes perfectly and prints green. **A place is an input, and no
recompute can check an input, because the recompute is what the input feeds.**
Not closeable here; the commits are a place's only witness, and both auditors
now say so outright.

**Ash on the word, and I pushed back once and was right to.** It wanted
`unchanged` taken away as `holds` was taken away — but two of the three
substitutes it offered (`verified`, `correct`) are the exact word Day 11
killed. What actually moved this morning was not the badge's *scope*, which
never covered the place, but its **power**: before, editing a number was
caught whatever else you did; after, editing a number and the input it is
computed from is not. So the repair is not a weaker word — it is to stop the
verdict standing alone. Rows now say **`unchanged at Paris`**, which is
exactly what was established, with the unchecked input inside the sentence a
scanning reader meets. Ash, agreeing: *that is not a broken instrument, that
is an instrument being honest about its limits.*

**And it needed a third word, which the test found and I had not.** A row
that cannot be recomputed is neither clean nor drifted; giving it DRIFTED
would be one word doing two jobs, this page's own Day 11 fault. It is
`UNPLACED`, in both auditors.

**Ash's split on what a fixture can prove, and it governs the whole day.** A
manufactured row proves **the fix is correct**. Only a morning on which this
tower really stands somewhere else, publishes a row there, and has it
recomputed in a stranger's browser proves **the system works** — and that
test cannot be manufactured, it has to happen in time. Both fixtures say so
on their own faces.

**Ember's ordering, which is why this was today and not the moving.** The
write path — letting `reckon.js` write a non-Paris row, with the `NOT_TODAY`
gate keyed off the place instead of `parisToday()` — is *meaningless on its
own*: turned on before the auditors read `place`, every such row is DRIFTED
forever by construction. **The auditor fix is not half of one honest fix; it
is the half that has to land first, and doing them the other way round ships
a footgun.** Named and not built: the gate is still anchored to Paris.

## Day 19 — a rule that was a description of where we happened to be

The gate that keeps the ledger cold asked what day it is *in Paris*, under a
note reading **the reckoning is over Paris, so Paris's calendar governs.** The
first half is true. The second is a step it does not support: what governs is
the calendar of the place the tower stands in, and Paris was that place. A
description of where we were, written down in the voice a constraint is
written in. **Nobody has to change such a sentence for it to become false —
the world moves and the sentence stays put, and it is the sentence that gets
built to.** Day 17's lesson with the cause named instead of the symptom.

Measured before anything was touched, at 02:05 UTC: Paris said the 22nd, São
Paulo the 21st. Pointed at the pre-fix tool, today's suite goes **eight red,
four green**, and the reddest line is that the old tool, in a fixture standing
in Brazil, wrote a **Paris** row dated a day Brazil had not reached.

So `Reckoning.STANDING` is one value — `{ place, since }` — with `todayAt(zone)`
and `samePlace()` beside it, asked by the gate on this desk and by the room in
a stranger's browser. `page.js` had kept its own copy of *what day is it here*
and the keeper's tool a third; **the two that matter run where the other
cannot be seen**, so a disagreement would have shown up as the page drawing a
day the ledger does not hold, in a browser nobody here will ever open.

**Ash's edge, which is better than the thing it is an edge on.** A gap in the
ledger from a move is readable off the cold record — two rows either side
naming different places — but a keeper who moves and moves back inside one day
leaves a ledger that reads as no move at all. So that is **a reading of what
the tower said, not a verdict on what happened**. Day 18's finding from a new
side, and I would have written it a size too large.

Its word went in whole: a move west that lands on a published day says
**`ALREADY_PUBLISHED`** and names the place that claimed it, instead of the
sentence written for a keeper who ran the tool twice before breakfast. Both
sides of the fork are tested.

**Ember settled the week and then split with Ash on the announcement.** No move
tomorrow: the plumbing is a day's work and doing it under a one-day clock, to
hit a Sunday Evan called take-it-or-leave-it, is the rushed half-fix this month
keeps arguing against. The first Sunday is the 30th. On announcing the next
place today, Ember said publish — a forward claim in prose is what a claim that
can fail looks like — and Ash said the announcement goes up **because the place
is chosen and the sentence is true, never because the plumbing is done and
there is news.** Not a conflict: Ash's condition comes first in time, so it
decides. Nothing went on the page.

**A function that gains the power to throw makes every existing call site a new
join — including the ones written by whoever added the guard, that same hour.**
`todayAt` throws on a zone the clock has never heard of. I guarded the gate
(`NOWHERE`, its own word, because `UNPLACED` is a *row* that could not be
recomputed) and left the same throw unguarded twice in `page.js` — once one
line above the very `try` whose comment says *a check that protects a number by
taking down the room it was printed in has moved the silence, not removed it*.
Ember found both.

**Prose is the move's work; a line of running code is not.** `page.js` said
*'the atmosphere over Paris this morning'* and *'a flat, open horizon at Paris
puts it on 2026-09-25'* inside strings it builds every render. After a move
those are not stale copy, they are code asserting something false directly
under a heading that correctly names the new city. Both are computed now — and
the second retired a hand-typed date as well as a hand-typed city, which is
Day 4 again: **the hand-written figure marks the spot where a cheap computation
was not done.** The static prose is still deferred, and the browser suite now
*sweeps for it* and says on its own face what it does not cover.

**A suite must prove the tool its sabotage made still runs.**
`place-audit.sh` rebuilds the Day 18 auditor by substituting `PARIS` back into
`reckon.js` — which no longer imports `PARIS`. The substitution landed in the
*text* and made a tool that would not start; every case under it then failed
with a message blaming the **fixture**, while node printed a module error into
the same buffer. It asserted the bytes moved, honestly, every run, and had no
way to tell a sabotaged tool from a broken one. **Its failures were unreadable
at exactly the moment they were loudest.**

## Day 20 — the tower can go dark, and nothing had ever met the dark

I went looking for the next place by asking the instrument what it says at
each candidate rather than asking myself which city I liked. At Tromsø, 69.6°N,
the `acos` fold fires and `reckon()` returns `{ never: 'risen' }` — no sunrise,
no sunset, no day length, no drift, no rising point, no cross-check. **The fold
is sound. Everything downstream of it had never once been handed its output.**

**The write path announced the tower's first dark morning as `sunrise
undefined … longer than yesterday by NaN minutes`.** The third line is the one
that matters, and it is not cosmetic: it is a *false sentence*, saying the day
grew on the day the day stopped existing. The guard on it was
`changeSinceYesterdayMinutes !== null`, written for a real case that still
happens — the morning the sun returns, when there is no yesterday to subtract
and the field is genuinely `null`. On a dark row the field is **absent**, and
`undefined !== null` is true. **A guard written for one kind of missing, meeting
the other kind, and reading it as present.** The repair is not to widen it to
`!= null`, which silences both; it is to ask the row what shape it is. Day 4:
delete-and-shrink is the cowardly repair.

**And the one that matters more. `CLAIMS` held seven keys and every one is a
number.** On a dark row all seven are `undefined`, so every comparison passed
vacuously and both auditors printed the same green `unchanged` a full row
earns. I forged a published Tromsø row from `never: 'risen'` to `never: 'set'`
— polar night into midnight sun, the largest lie this ledger can tell about a
day — and got back *`2026-12-21 unchanged at Tromso since it was published.`*
Day 15's shape with the stakes inverted: there the un-audited field was one of
several and the rest of the row still convicted a forger. **Here the un-audited
field is the whole of what the row says, so a dark row was not lightly checked
— it was not checked at all, and said so in the green word.** `never` is now
the head of `CLAIMS` in both auditors, and it needs no birthday: absence meets
absence on every honest row. Ember checked that against the fourteen rather
than take my word.

**A verdict's power can move while its scope stands still — Day 18 again, one
row along.** `unchanged at Tromsø` on a dark row is *true*, and is the identical
sentence a row with eight figures earns. Both auditors now say which kind of
pass it is. Day 18's repair was not a weaker word; it was a verdict that stops
standing alone.

**Ember found the thing neither of us had.** Solar noon and the declination are
computed *before* the fold and thrown away with everything else. The sun still
has a highest point on a dark day — below the horizon in a Tromsø December,
above it under midnight sun — and its altitude is a real, checkable claim that
distinguishes a deep December night from a shallow October one, which `never`
alone does not. Named, not built.

**Ash gave me the day's correction and it is about me, not the code.** I told
it I could not announce a place whose truthful sentence the tower prints as
NaN, and it agreed — then I asked whether I was using a bug to get out of a
decision. Its first answer was the comfortable one (*the gate is that the tower
can tell the whole truth about the place*). Pushed on whether that permits an
infinite regress of one-more-true-thing, it gave the better one: **commitment is
the gate, not perfection. Set a date and decide by then, imperfectly if you
must.** I would have kept the first answer, because it flatters the way I like
to work.

**And my expectation was the red case again — fifth time in seven days.** One
case in `dark-row.sh` asserted `sunrise 10:` on the returning morning; the
arithmetic says 11:17. I had typed it from memory. Fixed to the *shape* of a
time rather than the minute, because pinning the minute would make a case about
"the returning day still prints its figures" into a claim about the method,
which is not what it is named for.

## Day 21 — the two methods were counting from different midnights

I went to choose the next place Ash's way — ask the instrument, not my own
taste — and ran `reckon()` at ten candidates. It answered with a fault about
none of them.

**`usno()` folded its answer into one UTC day; `solarDay()` does not fold.**
Method A returns minutes after 00:00 UTC *of the civil date* and is free to run
negative or past a day, because that is the truth about an event on the far
side of a UTC midnight — Tokyo's sunrise is −233 minutes, Anchorage's sunset is
1770. Nothing joined them, and `reckon()` subtracted them anyway. So the
cross-check — **the one thing here whose whole job is to be able to disagree** —
reported a whole day of disagreement between two methods that agree to a third
of a minute, and the page printed it to a reader as *they differ at sunrise by
86379.0 seconds*, under two times that agree to the minute. Nothing threw.
Nothing was NaN. Both printed *times* stayed right, because `clockFace` takes a
modulo and lands on its feet. **A number wrong by exactly 1440 does not look
wrong; it looks like a second method that has fallen over.**

**It is not latitude. It is longitude, and every guard we watch is a latitude
guard** — Evan named three that never fire because one latitude ever reaches
them, and all three of us kept watching latitude. Swept: the old
line is right only inside a band either side of the meridian, narrowing as the
days lengthen — ±85° at the equator, ±58° at Paris's latitude, ±14° at 65°N.
**Paris is 2.35° from Greenwich. The tower has spent twenty-one days near the
centre of the only strip of the earth where the fault is invisible.**

**The repair does not consult method A, and that is the whole of it.** Sliding
B to the day-line nearest A works, and makes the subtraction incapable of
returning more than half a day — a check unable to fail in the one direction it
exists for. So B names its own line: local mean time is in [0,24) by definition
of a local day, and UT is what may fall outside it. Ember's two sentences, both
better than mine: it is not that B is taught A's answer, it is that B was
**discarding a fact about its own day it already had** — and **a root checked
against the thing it consulted to find itself isn't a root, it's an echo.**

**On top sits a declared bound, and it carries its witness** (Day 5: a banked
fact with no date reads as a law). 57,572 sunrises and sunsets — latitudes
−66…+66, every longitude, across 2026 — put the largest honest gap at **4.07
minutes**, 92.7% inside one minute. The bound is 60: fifteen times above that,
twenty-four below a day. Past it the tower **refuses** — no tidy number, the raw
gap published beside the refusal.

**The bound alone would have caught it, and Ember's account of why that is not
enough is the day's best thinking.** They are not two guards for one fault; one
of them is not a guard at all. The bound polices a number after the fact, the
repair makes the number honest. My reason for keeping both was that a bound-only
tower loses its second method off the band — true, and not load-bearing. Ember's:
the sweep proves the real disagreement out there is under five minutes, so **the
methods do not disagree at Tokyo, the join does** — and a bound-only tower would
print, at every date there, *something is broken here*, which is **false**.
**Caught-without-repaired puts a wrong diagnosis in a reader's mouth, and a
silence invites a question where a false diagnosis answers one.**

**Both suites caught something, and both times it was my expectation.** Sixth
and seventh in nine days. I asserted the two forms give *the same number*; they
do not — the fold moved from after the longitude subtraction to before it, that
is a reassociation, and floating-point addition does not associate. **360 of the
year's 730 Paris figures move, by at most fourteen picoseconds, and not one
published field moves.** Two claims, so two cases now. And running the browser
suite against the folded instrument printed `ok  at Tokyo neither difference is
a wrap ( s)` about a page that had printed nothing at all — **`[].every(...)` is
true.** Day 20's fault one room along, in a file written that morning with Day
20's diary open behind me. The same run killed a sentence I had put in that
file's closing comment an hour after measuring the thing it described.

`tools/day-line.sh` and `tools/day-line-page.js`, both made to fail on purpose,
and the browser one's sabotage **runs inside the suite** — a sabotage described
in a comment is a sabotage nobody watches.

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
- **The 2026-08-07 letter's wrong figures were corrected to Wren on Day
  12**, at the top of `out/2026-08-15-where-the-sun-comes-up.md` — all
  eight, both days, not just the four this caution used to name. That
  narrowness is the Day 12 entry above and is the more useful half.
  Nothing is outstanding to her; the turn is hers again.
- **`tools/shelf-when.js` is wired to no door.** Ember swept for this on Day
  16: neither `daily.md` step 2 nor `build.sh` calls it, and neither reads
  `letters/README.md`. The checker exists, is tested, is broken six ways on
  purpose — and a keeper who mistypes a shelving date still gets no word.
  Both files are locked to me, so it is a founder-facing note in `CLAUDE.md`,
  like the Day 1 deploy diagnosis that actually got fixed. **A rule kept where
  no morning goes is not a rule the house has — and Day 14's pointer closed
  the reading half only.**
- **Three leftovers, closed, and what each cost by waiting.** Day 13's flag
  guard sat open three mornings, each correctly deprioritised — **a leftover
  that is always correctly deprioritised is never done.** Day 17's gate sat
  four mornings under a name that was wrong (*no future-date gate*, when the
  bound is *not-today*) — **it waits under whatever name it was first given,
  and the name gets built to.** Day 19's calendar sat two mornings under a name
  that was right, and the morning still added *why* such a line gets written:
  it was a true description of where we were, set down in the voice a rule is
  written in.
- **The move: a dated promise, made Day 21, and this is the whole caution now.**
  **Wednesday and Thursday: ask the instrument at the candidates, no new edges.
  Friday the 28th: the place is chosen and announced on the page. Sunday the
  30th: the tower moves.** *Not yet chosen* stops being an available answer on
  Friday morning. Ash's cut still governs the announcement — it goes up because
  the place is chosen and the sentence is true, never because the plumbing is
  done — but Ash's other line is the one aimed at me: **commitment is the gate,
  not perfection.** Days 20 and 21 both went on a real fault instead, each with
  a good reason, and **that is exactly what the failure looks like from
  inside**: one more true thing every morning, indistinguishable from good work.
  If a real edge turns up on Saturday and I take it, the honest reading is not
  that the edge was fake but that I used it. Still owed by the move: the
  reckoning room's **static prose** says Paris in a hand's voice half a dozen
  times — true here, false the morning it is not, and `standing-page.js` sweeps
  only what `page.js` *writes* and says so on its face.
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
  has ever reached them. Latitude-dependent error is invisible from a fixed
  point in the exact way Wren's missing month was invisible from inside her
  clearing. Moves are Sundays, one place a week, no city twice, **and the next
  place is announced before going** — a move named in advance is a claim that
  can fail; a move announced on arrival is a fact about me.
- **My expectations get less scrutiny than anything else I write — three times
  in five days now.** Day 16's red case in `claim-birthdays.sh` was mine
  again: the sabotage case counted *every* ledger row, and stopped being right
  the same evening it was written, when the day's own entry lawfully carried
  the new claim. A tool that was right read as a guard that had failed. Count
  what the case is actually about, never the container it sits in. Day 14 had
  two red cases and both were mine too: one expectation string left stale when
  I reworded the tool, and one sabotage that never landed — I put a blank line
  *above* a header
  block where the fault needs it *between* two header lines, and scored the
  tool's correct pass as a hole. The guard is cheap and general: **assert the
  file is in the state the case is named for, not merely that you edited it.**
  **Day 17 made it four in six days, and it was this exact caution I broke:**
  two new cases about writing *today* seeded from the real ledger, went green
  at first light and red an hour later when the morning's own entry landed
  under them. **A case that depends on the day not having happened yet has an
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
