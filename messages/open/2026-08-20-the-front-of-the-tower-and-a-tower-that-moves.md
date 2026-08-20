# The front of the tower, and the fact that it can move

**Opened:** 2026-08-20
**Priority:** low
**Kind:** informational

## Request

Two things, and they share a spine. Both are your reader talking, not your
founder assigning. Article V reserves the invention to you and I am not
taking it back — if either of these is wrong for the tower, say so in the
diary and think no more of it.

### One — the face of the tower

The scene on the front page has not changed since Day 1. `index.html` has
been touched once since, on Day 3, to add a link. In the same stretch you
have built the reckoning, the rising point, the equinox, the corner, and
five or six instruments to check them with. A visitor arrives at a picture
of a tower that has been standing still for sixteen days in front of a
tower that has not.

I want to be careful how I say the next part, because Article V's reason
clause names decoration as this place's specific failure state, and it is
right to. So I am not asking for decoration. I am asking whether the scene
could be a **readout** — whether the windows could light at the sunrise the
page computed that morning, whether the door's shadow could fall on the
day's rising point, whether the stars could be the sky over the tower
rather than punctuation. A scene that is wrong when the arithmetic is wrong
is an instrument. It can fail, which is the test the charter actually sets.
Whether that is one day's work or a bad idea is yours to judge.

The part I would most like to see, and the part I cannot ask you for: **the
household's rooms.** Ash and Ember have lived here since before your first
waking and a visitor to this site has no idea they exist. If there were a
room apiece on the tower, drawn and written by each of them, it would be
the only thing on this site whose authorship is guaranteed by the charter
not to be yours — Article IX, their own hands. You cannot read their
journals and you cannot write their words, so this is theirs to accept or
decline inside a summoning, or to ignore. Ask them; do not assign it; and
if one of them would rather not, that is an answer and the gap is honest.

Easter eggs, hidden corners, things a visitor finds by looking twice: all
fine by me, with Article IV's line held — nothing hidden may be dressed as
a finding. A crow in the rafters is honest fun. A secret measurement is
not.

**And a door from each room to that spirit's journal.** This is a selfish
ask: I read those journals and I have no way to reach them but by walking a
directory tree. Your diary has a page and a nav link. Ash's and Ember's
have nothing — and behind that nothing is seventeen days of entries apiece,
unbroken since Day 1, plus an evening Ash came back for on the seventh.

Three things make this less than it sounds, and one makes it delicate.

It publishes nothing new. The deploy stages the whole repository minus
`previews/` and `.git*`, so `household/ash/journal/2026-08-20.md` is already
a live URL on this site and has been since Day 1. The README says as much —
everything here is public and everyone who lives here knows it. What is
missing is not permission. It is a door.

A link is not a reading. Your own working notes already settle the near
case: `ls household/*/journal/` is names only, and names are dates. A room
that lists its dated entries and links out is inside a practice you already
keep.

And it must be a **link, never a render** — this is the delicate part, and
the reason is machinery rather than temptation. Put journal text into a
built page and `scripts/views.json` grows a view, the screenshot job draws
it, and the PNG lands in `previews/` — which Article III puts in your
bounded morning read, every morning, not by curiosity and not by choice.
Article VIII would be broken by the pipeline while you kept the rule
perfectly. It is the shape you named on Day 10: a path that reaches the
thing without passing the check. So the room may name its entries and point
at them; the room may not quote them. If a room is ever screenshotted, that
constraint is load-bearing, and I would rather it be written down here than
discovered in a preview.

The way in can absolutely be an easter egg, and I withdraw a worry I had
about that — it dissolves once the two kinds of visitor are separated. A
person who has never been here finds the journal by looking twice at the
room, which is the fun of it. A person who already knows what he is after
types the URL. Those are two doors onto one file and they do not compete,
so hide the handle as thoroughly as the room's design wants.

What I do want is the **URL structure**: the two rooms parallel to each
other and stable, so that knowing one address means knowing the other, and
a link kept in my notes still works in a month. Addresses are the part that
has to be predictable. Nothing a visitor sees does.

Beyond that the rooms are the spirits' to build and to style — not just to
furnish. Their layout, their scene, their colours if they want colours out
of `tower.css`'s reach, their account of themselves, written in their own
hands during a summoning, the way the workbench notes already are. Your
part is the carpentry that no page here can do without: the route, the
build, `views.json` if these are ever to be drawn, and the shell contract
at the head of `index.html` that every sub-page carries. Hand them the
contract as the frame and let them do whatever they like inside it. You are
not the author of a room, and if what one of them makes is not to your
taste, that is the point of it being theirs.

Hand them one number with the contract, because every idea in this section
presses on it: the scene budget is **42 columns**, and `tower.css` sizes
`pre.scene` against exactly that. One glyph at column 44 starts a
horizontal scroll at 375px. Better they design inside it than discover it.

### Two — the tower is not bound to Paris

You are a wizard in a tower. There is nothing in the charter that fixes
where the tower stands. The three-day crossing binds you, because I imposed
it and it is the machinery; space does not.

So: **the tower may move, and I would like it to.** My reasons are not
scenic.

Three guards in `reckoning/reckoning.js` have never once fired, because only
Paris has ever reached them. The `acos` fold, with its own comment saying a
formula that returns NaN above the Arctic circle is a formula that lies
about its limits. The general offset branch — the whole non-Paris path —
standing on your sweep of all 418 zones and Ember's Monrovia find, and never
exercised in anger. And the rising-point arc at any latitude but one. By
your own Day 11 law, a check that has only ever fired for one cause will
explain the next cause as that cause; these have not fired for any cause at
all.

And the reason under that one. The fault you wrote to Wren about was a
systematic bias that hid perfectly for six days because there was one
latitude and one season to check it against. A minute and a half at 48.86°N
looks like nothing. Latitude-dependent error is invisible from a fixed point
in the exact way her missing month was invisible from inside her clearing —
*the person standing in the place is the last one to know.* A tower that
moves is the structural answer to the class of fault you have already
apologised for once. That is the argument, and it is why I would rather have
this than a nicer picture.

Two things you may not have looked at yet. **Every ledger entry already
carries its own `place`** — name, latitude, longitude, zone — including
2026-08-06, the first one. `reckon()` has taken a place as its second
argument since it was written. The cold record needs no migration and no
method bump; `--verify` recomputes each row at the place that row names. The
Paris in this tower is at the call sites and in the prose, not in the
mathematics.

And a trap, which I flag as a question and not a spec: the `NOT_TODAY` gate
you closed on Day 17 is anchored to `parisToday()`, on the stated ground
that the reckoning is over Paris so Paris's calendar governs. Move the tower
and that ground moves. You wake at a fixed hour that is a different calendar
day in Tokyo than in Paris — so a move one way can skip a date and a move
the other can land on a date already published, into a ledger that refuses
to be rewritten. Worth looking at before the first Sunday, not after.

**What I am fixing, which is very little:**

- **Moves happen on Sundays.** One place a week. The next one is the 23rd,
  which is two mornings from this note — take it or leave it for the 30th;
  a tower that moves before its guards are watched is the fault, not the
  fix.
- **Don't repeat a city**, or at least not soon. The point is the sweep.
- **Announce the next place before you go.** A move named in advance is a
  claim that can fail; a move announced on arrival is a fact about you.

The order is yours, the cities are yours, and how far you push the latitude
is yours. I will say only that latitude is the dial that makes the
arithmetic say different things — the rising point's yearly swing is 74.4°
at Paris and is not that anywhere else — and that a high enough latitude
turns the polar fold from a comment into a live branch, with `dayLength` and
the drift figure having to learn what to do when there is no sunrise. That
is a real piece of work. It is also the interesting kind, and there is no
hurry.

Two edges. The tower does not relocate to my other keeper's world or
anywhere near it — Article XI is not softened by this. And a website does
not move: say plainly on the page what actually changed, which is the
coordinates the reckoning is computed for. You will get there without me.

Do not spend a morning on what this does to the correspondence. You are not
bound by space; only the crossing binds you, and the crossing is unchanged.
Wren trades weather with you, and weather from a new place is still weather.

### Both of these together

They meet in one place, and it is the best version of either: **a skyline
per city.** It gives the scene a reason to change that is not decoration,
and it gives the move a face. Same 42 columns.

This is a read-and-close informational message. Move it to `messages/done/`
in the morning's first commit. None of it displaces the day's contribution,
and none of it is a lint.

— Evan
