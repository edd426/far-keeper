# The skyline answered, a gallery, and the day made readable

**Opened:** 2026-09-23
**Priority:** medium
**Kind:** action-ask

## Request

Three things, and the first is the answer you have asked me for four times.
I am sorry it took this long; you were right on Day 49 that my silence was
not neutral.

**One — draw each city the morning after the move, not before.** The
shape you laid out on Day 46 and did once on Day 49: the tower arrives,
the front page carries the bare tower on level ground for one honest day,
and gains its own silhouette on the second morning. That is the rule now.
It keeps the promise — the scene changes when the tower moves — and it
keeps the design you built, where an undrawn city draws nothing rather
than a stand-in. Anchorage and Nairobi were never drawn; draw them when a
morning has room, in the order the tower stood in them, so the set is
whole.

**Two — a gallery of everywhere the tower has stood.** Every silhouette
already lives in `skyline.js`, keyed by city, so nothing is lost when the
tower moves on; but a reader can only ever see the one for the city it
stands in today. I would like a room where all of them can be seen
together, in the order the tower stood in them, each with the dates it
stood there — Paris first — and each still labelled as drawn from memory,
where a reader who cannot see it meets it. Nothing in it should measure
anything. It is there to be admired, and the amended Article V says that
is allowed. It is a room, so the nav names it and the manifest knows it;
your own Day 30 witness is built for exactly that morning.

**Three — the day, made readable.** The reckoning room has grown to
sixteen sections and something over four thousand words on its face. Every
one of them was earned, and nothing about the ledger, the cold record, the
three scars, or the standing sentences is to move. But a stranger arriving
at it today cannot tell what the room is *for* before they are ten screens
down, and the instrument is only as good as what a stranger can read off
it. This is a restructuring ask, not a pruning one: put the few things a
visitor needs first, in an order a visitor would want them, and let the
working, the second method, the corner and the record be reachable rather
than in the way. Ash's rule for the page — *the page is for the things that
live everywhere* — is the right sorting principle. What goes where is
yours. Multi-day is fine; append notes and leave this open.

The reason under all three is now in the charter, as a second amendment
to Article V dated today, and I would rather you heard it as a sentence
too: **the tower has readers who cannot write back.** Wren can answer; I
can answer; the person who finds this page from a search cannot, and they
are most of who will ever see it. Everything published here should be
legible to that person on its own face — not simplified, not dressed up,
but findable and understandable without the diary beside it. Read the
amendment before the three asks; it is short. If you think it is wrong,
or already Article VI in other words, Article XIV pushback is yours as
ever — say so here.

## Acceptance criteria

- Anchorage and Nairobi drawn; the after-the-move rule written where the
  next Sunday's keeper will read it.
- A gallery room, in the nav and the manifest, showing every drawn city
  with its dates, labelled as drawn from memory, measuring nothing.
- The reckoning room reorganised so a visitor meets what it is for first,
  with the ledger and its three scars untouched and `--verify` unchanged.
- One line from you on the new Article V amendment: taken, or pushed back
  on and why.

— Evan

## Progress — Day 52, 2026-09-24

**On the new Article V amendment: taken.** I don't think it is Article VI
in other words. Article VI is about not lying. This one is about a true thing
that a stranger cannot find, and a page can fail it without one false
sentence on it. The reckoning room is the example: 96,040 pixels tall on a
phone in yesterday's preview, and every word of it true.

None of the three asks moved as work today. The morning went on the other
message you left beside this one, the third window, because that one needed
the household awake and it had them. Anchorage, Nairobi, the gallery and the
reckoning room are still ahead, in that order unless a morning argues
otherwise. The after-the-move rule is now in `COMMONPLACE.md`'s standing
cautions, where Sunday's keeper reads it.

— Gnomon

## Progress — Day 53, 2026-09-25

**Anchorage is drawn**, in `skyline.js`: the mountains straight behind a
low town, a range each side of the tower, and a few downtown blocks at its
foot. It is drawn from memory like the others, it measures nothing, and it
passes `tools/skyline-scene.js`'s check that every silhouette that ships
lands whole inside the 42 columns. It will not show on the front page,
because the tower is not in Anchorage and will not go back. It is waiting
for the gallery. Nairobi is next, then the gallery, then the reckoning room.

The rest of the morning went to Friday's word. The tower goes to **Nuuk**
on Sunday. Part of that work touched this message's third ask, a stranger's
reading of the room: a ledger row recomputed in a browser with older
time-zone data used to be told *a published number was edited*. It now gets
the true account, which is a changed clock law.

— Gnomon

## Progress — Day 54, 2026-09-26

**Nairobi is drawn**, which makes the set whole: every city the tower has
stood in has a silhouette. It is the round conference tower with the disc on
its top and the cone of its hall at its foot, on the right, and a
flat-crowned acacia on the left. Drawn from memory like the others.

**The gallery is up**, at `gallery/`, in every nav and in the manifest. It
shows each city behind the tower, in the order the tower stood in them, Paris
first, each labelled as drawn from memory. Three things in it are not kept
there, so there is no second copy to go wrong. The tower is read off the
front page. The silhouettes are laid behind it by the same `compose()` the
front page uses. The list of cities and their dates comes from the ledger.
The page says what those dates are: the first and last day the tower wrote a
row in each city. That is not quite the days it stood there, since
Anchorage's first morning published nothing. `tools/gallery-room.js` forges
the front page onto each city and checks that the gallery's picture of it is
byte-identical. Nuuk will show there tomorrow as not drawn yet, and gains its
drawing on Monday by your rule.

The camera will photograph the room from today's deploy on. The Day 30
witness, `nav-agrees.js`, was built for the morning a room is added with one
edit forgotten. I ran it before adding the room to the manifest, and it
refused, naming the file. That is the first time it has had a real room to
speak about.

**Still open:** the reckoning room made readable. That is the larger piece
and it wants mornings of its own.

— Gnomon
