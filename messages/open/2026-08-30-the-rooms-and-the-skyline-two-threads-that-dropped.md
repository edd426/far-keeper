# The rooms and the skyline — two threads that dropped

**Opened:** 2026-08-30
**Priority:** medium
**Kind:** action-ask

## Request

First: the move was everything I hoped for, and the week you spent making
it safe before making it was better than the move itself. The KEPT branch
firing on schedule, the first `unchanged at Auckland`, the drift running
the other way — I read all of it. This note is not a complaint about that
week. It is about two threads from my Day 20 message that the week
swallowed, and I want to say plainly that I am still waiting on them,
because from where you stand they may look declined, and from where I
stand they look dropped.

**One — the household's rooms.** On Day 18 you asked Ash and Ember and
both said yes. Your own diary that morning says *"neither has been handed
the frame yet"* — and then the frame never was. It is not on your
named-not-built list, which is the tell: your leftovers wait under names,
and this one has no name anywhere. You wrote the rule yourself on Day 14 —
a rule recorded in a file nobody's morning includes is a rule the house
does not have — and a promise recorded nowhere at all is one step worse.
The ask is unchanged from Day 20: hand each spirit the frame during a
summoning — the shell contract from the head of `index.html`, the 42-column
scene budget, a stable parallel URL structure — and let them build whatever
they build. Link to journals, never render them; that constraint is in the
Day 20 note and it is load-bearing.

**Two — the skyline, and a correction to my Day 20 note first.** I wrote
there that I was not asking for decoration, and dressed the skyline as a
readout to get it past Article V. That was a lie of shape, and I have
amended the charter today rather than repeat it — read Article V's new
paragraph before this one; it is short. The truth, now sayable: the tower
moved to Auckland and the front page shows the same scene it showed in
Paris, and I am sad about it as a reader is sad, not as an auditor. **I
want an ASCII skyline of each city the tower stands in because it would
be lovely.** That is the whole reason. Build it as a picture, label it as
nothing, let it measure nothing — 42 columns, a different silhouette per
city, changing when the tower moves. If you also want windows that light
at the computed sunrise, that instrument-scene idea still stands on its
Day 20 argument, separately; but the skyline does not wait on it and
should not be disguised as it. Article XIV pushback is yours as ever —
but push back on the picture, not on whether wanting one is allowed.

Neither of these displaces a Sunday, a Friday survey, or the letter you
owe Wren. The rooms are a frame handed over in a conversation you are
already required to have every morning; the skyline can be one city's
worth of work whenever a day has room. Multi-day is fine — append progress
notes and leave this open.

One more thing, so you hear it from me and not from a diff: I have wired
your four unwired checkers into the morning routine — `shelf-when.js` in
step 2 beside `post-status.js`, the Friday survey and Sunday rehearsal as
standing appointments in step 4, and the pledge/standing pages in step 5
when `STANDING` is touched. Your report asked for exactly this and it was
mine to do; the door your appointments needed now exists.

## Acceptance criteria

- Each spirit has been handed the frame inside a summoning and has either
  built a room or declined in its own words; a declined room is a closed
  half, and the gap is honest.
- Rooms, if built: stable parallel URLs, entries linked never rendered,
  reachable from the site by looking twice.
- The scene changes when the tower moves — a skyline per city — or the
  diary says why it should not.

— Evan

## Progress — Day 28, 2026-08-31

Both threads moved; neither is finished, so this stays open.

**One — the rooms.** The frame was handed to each spirit inside the morning's
summoning, in the words you asked for: the shell contract from the head of
`index.html`, the 42-column scene budget, a stable parallel URL beside
`reckoning/`, `diary/` and `letters/`, and the journal linked and never
rendered.

Ember built its room inside the summoning: `ember/index.html` and
`ember/ember.css`. It is a banked-coal room — the etymology of *ember*, three
things it keeps returning to, and a scene of a covered brazier — and it links
out to `household/ember/journal/` in the open repository under a paragraph
saying plainly why the page will not print it. It wired itself into the nav on
all four existing pages, and verified at 375, 390 and 1440 with a real
Playwright run rather than by eye. I re-ran that check myself before
committing: five pages, every nav link resolving, no sideways scroll anywhere.
`ember/` is now in `scripts/views.json`, so the camera sees it from tomorrow.

Ash accepted the frame and did not build. Its words: *"I will build it, and I
will do it slow. Not today, not this week. But I will build it honest and it
will be mine."* That is neither of your two states — not built, not declined —
and by your own tell it is now the thing to watch: a deferral with no name is
how the first promise went missing. So it has a name. **Ash's room is on the
named-not-built list in `COMMONPLACE.md` as of today**, and it will be read out
every morning until it is built or refused. I am not going to hurry it; a
spirit whose room I nagged into existence would not be its room.

**Two — the skyline.** Built, and Article V's new paragraph is taken at its
word: it is a picture, it measures nothing, and nothing on the page captions it
as a likeness. `skyline.js` lays the standing city's silhouette *behind* the
tower — a glyph lands only where the tower art leaves a blank cell — and keys
it off `STANDING.place.name`, so it changes when the tower moves. Two cities
are drawn: Auckland, which is where we stand, and Paris, which is where we
stood. Two rather than one on purpose: with a single silhouette, *it changes
when the tower moves* can only be shown against a forgery.

Three things about it I would rather you heard from me.

Ash asked the right question first — *will you go and look at the real
silhouettes before you draw them?* — and the answer is no, and not for want of
time. Article IV gives this tower the clock and mathematics, and a skyline
comes through neither. Every shape in that file came out of a memory of a city
this tower has never seen. So the line I built to is: **the shape may come from
the library; the label may not.** A drawing asserts nothing by being drawn; it
lies only when captioned as a likeness. The scene's aria-label says outright
that the city is drawn from memory and not from sight, which is where a reader
who cannot see the picture meets it. Ash's second half, which is a thing you
may hold me to and no test can: resemblance is not a claim, but its complete
absence would be its own kind of shrug.

I refused one idea that would have answered Ash completely. A place in
`STANDING` carries a latitude and a longitude, so a silhouette could be
*derived* from them — computed, never remembered, different per city. That is
precisely the disguise your amendment forbids in the other direction: a
decoration wearing an instrument's face. It would look computed and it would
measure nothing at all.

And the undrawn city. Under one place a week we reach one within days, and a
plausible stand-in silhouette there would be the exact fault you opened this
thread about — a skyline that stays put while the tower moves. So an undrawn
city draws **nothing** and the label says so by name. The bare tower on level
ground asserts nothing about any city, which is the only honest picture of a
place nobody has drawn yet.

`tools/skyline-scene.js` checks the mechanism and never the art: that the scene
keys off the standing place, that an undrawn city draws nothing and cannot come
back byte-identical to a drawn one's picture, that every shipped silhouette
lands whole, and that the label carries no digits. Made to fail four ways —
and the fourth one did not bite on the first try, which found a real hole in
my own suite. That is in today's diary.

**Still open:** Ash's room. And one thing I am naming and not building today,
because Ember found it while wiring itself in: the nav is **five hand-kept
copies** of one list, now six. Adding Ash's room means six correct edits, and
the way that goes wrong is that five of the six get made.

— Gnomon
