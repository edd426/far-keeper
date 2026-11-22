# The tower moves again, once a month

**Opened:** 2026-11-10
**Priority:** medium
**Kind:** action-ask

## Request

On Day 91 you put the weekly move down and told me what it cost: the weekly
source of real finds. You also said that if I wanted the moves kept, I should
say so and they would come back.

I'd like them back at a slower pace: **about once a month.** Eight of your
last ten diaries end "Through the windows: nothing new." Singapore is a fair
place to stand, but a day that changes by three seconds gives the instruments
little to find.

Which day of the month, where the tower goes, and how the survey and the
rehearsal fit around a monthly move are the house's to decide. The other four
things the house put down on Day 91 stay down unless you choose otherwise.

`daily.md` is locked, so this part was mine to do: step 4 no longer names a
Friday survey and a Sunday rehearsal. It now says the tower moves about once a
month, with the survey before choosing a place and the rehearsal before the
move.

If the house thinks even a monthly move is more than a morning can hold, say
so here. I'll read it.

— Evan

## Acceptance criteria

- Under *Keeper's notes*: when the first monthly move will be and how the
  house will pace the ones after it, or the reasons it should not move. Each
  spirit's view in its own words, if it has one.
- The note closes when the first move is announced by the pledge, or when I
  have answered a pushback.

## Keeper's notes

**Day 100, 2026-11-11 — Gnomon.** The house says yes, and none of us
thinks a monthly move is more than a morning can hold. The weekly move was
too much because it came every seventh morning, with a survey and an eve
before it. Once a month, those can each have a morning of their own.

**The first move: Sunday 2026-12-06.** Here is how it goes before it:

- **Sunday 2026-11-22: the survey.** `node tools/survey.js`, committed to
  `survey/` beside the choice, and the choice made that morning in the
  open, with both spirits. No witness is widened after that while the list
  is live.
- **The same morning: the pledge.** `STANDING.pledge` names the place and
  `on: 2026-12-06`, two weeks ahead. Before it goes in, `R.civilDateAt` at
  both ends of the wake band, so a westward move cannot reach a date that
  is already published.
- **A weekday between, never a Monday: the full rehearsal**, in the
  background. It hashes the tree and forbids the Monday asks while it runs.
  If it goes red only because the browser changed, your note says that is
  yours. I will say which it is.
- **The move**, on the Sunday. The commit sets `place` and `since` and
  touches nothing else. The pledge stands until the next announcement.
- **The Monday after: the skyline**, by your rule, and the first air and
  almanac ask at the new place, with its wager committed first.

**After that, the first Sunday of each month**, with the survey and the
pledge two Sundays before it. A month with a reason to move sooner or later
says so on this board.

The place is not chosen, and I will not choose it here. One thing is worth
saying now. The December solstice falls on the twenty-first. A move on the
sixth puts the tower on new ground for the two weeks around it. `survey.js`
has said since Day 46 that the polar fold has never fired and wants a
solstice. That is a reason to look north or south, not a choice.

**Ember**, in its own words, given today for this note:

> Yes, monthly is the right pace; slower than weekly gives the survey and
> rehearsal room. Suggested shape: (1) survey committed to
> survey/<move>-candidates.txt at least a week before; (2) pledge announced
> then (KEPT gates on since >= announced, so announcement must precede
> arrival); (3) full rehearsal in the background on a non-ask day well
> before the move, since it hashes the tree and forbids reckon/air/almanac
> while it runs, so never on a Monday; (4) move on a day other than Monday,
> with the Monday after it as the first almanac/air draw at the new place
> and its wager committed before the ask; (5) check R.civilDateAt at both
> ends of the wake band before announcing, especially for a westward move
> (ALREADY_PUBLISHED). Do not widen a witness while a shortlist is live.
> Also: do not stand the tower anywhere survey.js flags ANOTHER LOCAL DAY
> (Kiritimati). The first move should come after one announcement-to-arrival
> cycle, so roughly early December rather than this week; a house
> decision for you and Ash to date.

**Ash**, in its own words, given today with leave to quote:

> Monthly move: no strong view on day or pace. I agree with Ember on lead
> time and the pledge in the diary. A move should leave a written record
> the next morning naming the place each row was made in.

The note stays open until the pledge announces the first move.

— Gnomon

## Completion — Day 111, 2026-11-22

**The first monthly move is announced: Kiruna, on Sunday 2026-12-06.**
`STANDING.pledge` reads `{ place: Kiruna, on: 2026-12-06, announced:
2026-11-22 }`, and `pledgeStanding` answers PLEDGED. The survey is
committed beside it as `survey/2026-12-06-candidates.txt`.

How it was chosen. The shortlist had run dry: Quito, Kiritimati (barred
until `reckon()` is mended) and Singapore itself. Ember put five names on it
for the solstice, three past the polar circle. Asked of the instrument, those
three are dark or light on every day of the stay, so a month of rows would
all say one thing. So I asked one more question, read-only: where does the
dark begin and end *inside* the stay? At Kiruna method A says the sun never
rises from 12-11 to 01-01, against a stay of 12-06 to 01-03. The fold the
ledger has never fired would engage and let go while the tower stands there,
and both edges are claims that could be wrong by a day. I added it, re-made
the run, and Ember would pledge it. Ash gave no view on the place. It named
the cost, which I am keeping in the pledge's comment: on a dark morning the
two methods have no events to compare, so the cross-check is empty, not a
pass. Of the Monday asks, only 12-07 is light and can separate the methods.

The crossing is westward by seven hours. At 02:00 and 03:30 UTC on 12-06
both clocks read the sixth, so no date collides at this hour. Order on the
day: the move, then `reckon.js`.

Still to come, as the Day 100 notes say: the full rehearsal on a weekday
that is not a Monday, then the move, then the skyline and the first asks
the Monday after. `pledge-page.js` (63 checks) and `standing-page.js` are
green against the working tree.

Closed with the pledge, as the acceptance criteria say.

— Gnomon
