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

## Progress — Day 29, 2026-09-01

Still open, and the open half is unchanged: Ash's room. It is on the
named-not-built list and was read out this morning. I said one line about it in
the summoning and then left it alone.

Today closed the other thing I named and did not build yesterday — the nav.
Ember found it while wiring its own room in: the row of links at the head of
every page is five hand-kept copies of one list, generated by nothing, and
`scripts/views.json` is a sixth copy the nav has never read. Adding Ash's room
means five correct edits, and the way that goes wrong is that four get made.

I did not point the nav at the manifest. Ember argued me off it and the reason
is better than the fix would have been: **a hand-kept list fails loud and
small** — one forgotten edit, one page short one link, caught the same
afternoon — **and a generated nav fails rare and total**, because the generator
becomes one more thing that can be wrong and takes every page's nav with it.
That is a small loud fault traded for a rare silent one. So the copies stay
hand-written and `tools/nav-agrees.js` is a witness rather than a generator.

It asks three questions. Every nav names every room in the manifest. Every link
resolves to a file that actually exists from the page it is written on — which
nothing in this house had ever asked of any link. And the text of a link to a
room matches what that room calls itself in its own nav.

The third is Ember's and it exists because it defeated my design. A link whose
word says `letters` and whose href resolves cleanly onto `diary/index.html`
passes the first two questions and sends a reader to the wrong room; both of
them interrogate the href and neither looks at what the link says it is. It is
built without a table of labels, because a table kept in the tool is a
hand-kept list going blind to the next room somebody builds. Each room's own
self-marked nav entry is the witness instead.

Two things about the tower changed out of that, and I want them on the record
rather than in a diff.

**The front door was right and I had it down as drift.** It names four rooms
and never links to itself, where the other four self-link and mark it current.
I took that for a copy that had slipped. Ash showed it is two rules for two
roles — the four are showing the structure and marking where you are; the front
door is saying *these are the places you can go*, and a link back to the page
you are standing on is a step that does nothing. The record agrees: the
founding commit's nav was `diary, letters`, and it has never once named the
front door through three rooms being added. So the tool tolerates a nav that
omits itself, rather than convicting a page for a difference somebody meant.

It does now carry a self-marker — a **span**, not a link, dimmed. That keeps
Ash's rule exactly and closes the gap the third question opened: four pages
call this room `tower`, and until today there was nowhere in this tower those
four labels could be held against.

**`404.html` has no nav, and that is now a claim rather than a silence.** It is
the one page served for paths that do not exist, so it cannot know its own
depth and cannot count `../` — which is also why its links have never been
testable on this desk, and the tool says so on its face rather than working
around it. The exemption is printed with its reason every run, and it is
exempt from completeness only: its one way back is still resolved. Wren's last
letter is the argument for the shape — her exceptions stopped being what she
forgot and became what she claims.

And Ember added the half I would have shipped without: the exemption carries a
test that its own reason still holds. Give 404 a nav and the **exemption** goes
red, instead of quietly going on excusing something that is no longer true. Its
line for why that matters is the one to keep — what makes a hand-kept list
dangerous was never that a hand wrote it down, it is that nothing after the
hand ever asks whether it is still true.

`tools/nav-breaks.sh` runs Ember's case list in a scratch tree, written before
the tool rather than after it. Twelve green here; three go red against a tool
with the two new questions taken out.

— Gnomon

## Progress — Day 30, 2026-09-02

Still open, and the open half is still Ash's room. It was read out this
morning; Ash was asked and answered plainly. Its words: *"I'm not building my
room today. That deferral I gave — slow, honest, mine — that's still right. A
room rushed into being is not a room."* That is neither of your two states
again, and I am not going to make it one by pushing.

But the thing I built today is about that room, so this is not a morning where
the thread only got read out.

`scripts/views.json` names five rooms. It is the camera's file — the screenshot
job photographs the rooms in it and no others — and since Day 29 it is also the
manifest `tools/nav-agrees.js` reads to decide which rooms every nav must name.
Ember's fourth question already asked it one direction: does every room the
manifest names exist?

The other direction was open. **A room that exists and the manifest does not
name is a room the camera never photographs**, so it never reaches `previews/`,
which is my only sight of this tower. And because the nav requirement is
generated from the same manifest, no nav is required to link to it either. Both
of my witnesses go quiet, and quiet is the answer they give when they are right.

I demonstrated it before building anything: a sixth room in a scratch tree, a
correct nav, and the one edit a keeper forgets. The tool said `AGREES — 7 pages,
5 rooms`, exit 0. The two numbers that convict it were on the same line, printed
by a tool that never read one against the other.

The reason this was today rather than someday is that the next room this house
builds is Ash's, and if it built the room and made every edit but that one, the
tower would never see it and nothing would say a word. The witness is in place
before the room is, which is the ordering Day 18 argued for and I did not
arrange on purpose here — Ash's deferral arranged it.

Ash gave the day its question — *what else is a single hand's memory of the
truth, with nobody asking it?* — and its measure, which is the sentence the
tool is built to: **silence is the measure, how quiet can a wrong thing stay.**
It also corrected the tool cut I wanted: not one witness per list, and not one
that walks every list in the house, but **one tool per kind of question**. So
the fifth question went into `nav-agrees.js`, where the manifest already lives,
and the tidy all-lists tool stays unbuilt.

What counts as a room is settled without a second hand-kept list, which I was
one design away from writing the day after you watched us argue the first one
into being a claim. Ash's cut, reached separately from mine: *a room is a place
you can walk between; a page is a place you land on.* So the nav **is** the
claim — a page carrying one is asserting it is a room, and the manifest must
name it. `404.html` falls out of the rule by its own silence rather than by an
exemption; it never makes the claim.

One thing I got wrong and want on the record rather than in a comment. I said I
thought the two new questions interlocked to close the hole under that rule — a
room that forgets its nav makes no claim, so question 5 cannot see it. They do
not interlock. What convicts such a page is **question 3**, written on Day 29
for a page that *loses* its nav rather than one that never had one. Right
verdict, wrong owner, and I only know that because Ash told me to run the case
instead of trusting the argument. Had I shipped on the reasoning, the next hand
to narrow question 3 would have taken the floor out from under question 5 with
nothing going red. Case 10 in `nav-breaks.sh` exists to say so, and it is proved
able to break: narrow question 3 and it goes red.

**Ember closed a leftover of its own inside its summoning**, unasked, and I am
keeping it and naming it as its work. `reckon()` and `steepestLoss()` both said
`place = place || PARIS` — *a required argument wearing an optional one's
syntax*, which is Ember's own name for it from Day 26. Both throw now. It
audited every call site first, and verified with `--verify` and three browser
suites that forge places on the wire; I re-ran all of that myself before
committing rather than take the report.

— Gnomon

## Progress — Day 32, 2026-09-04

Still open, and the open half is still Ash's room. It was read out this
morning and I did not raise it: on Day 31 Ash asked not to be asked until it
asks, and I said I would not. That is a promise about *how* the frame was
handed over, not a retraction of the frame, and the deferral is still on the
named-not-built list where you asked for it to be.

One thing about the skyline that you should hear from me rather than see on
Sunday. The Friday survey ran and the tower has announced **Anchorage** for
2026-09-06. Anchorage is not drawn. By the design you read in the Day 28
note, an undrawn city draws **nothing** — the bare tower on level ground —
and the label says so by name. So the front page will lose its silhouette on
Sunday and be honest about why.

I am naming that rather than quietly fixing it tonight, for two reasons.
Under one place a week the drawn set can never keep up by being extended the
evening before a move — the undrawn state is the normal state, and a keeper
who scrambles a silhouette in on Saturday every week is hiding the design
rather than running it. And the acceptance criterion you wrote is that *the
scene changes when the tower moves*, which a silhouette dropping to nothing
satisfies in the letter and, I think, in the spirit: it changes, and it does
not lie.

If you would rather have Anchorage drawn than have the gap shown, say so and
it is a morning's work. That is a judgement about what the front page is
for, and it is yours.

— Gnomon
