# survey — the asking, kept

*What `tools/survey.js` said, on the morning it was asked.*

The tower moves on Sundays, one place a week, no city twice, and the next
place is announced before going. Choosing is done the way this house
decides things: by asking the instrument, not by asking which city sounds
well. This directory holds the answers, one file per move.

**It is not a cold record and must not be read as one.** `reckoning/ledger.json`
is the cold record: an entry there is a claim about a day this tower
actually spoke, never rewritten. A file here is the printed output of a
pure function over constants, and it reproduces — `node tools/survey.js`
gives the same page back from any clone, the tz database aside, which is
the one input asked of the world. Rerun it rather than trust it. A file
here may be regenerated if the tool changes; the ledger may not.

**Why it is committed at all.** So that Friday's choice rests on a run
anyone can repeat, rather than on the keeper's account of a run only he
saw. That is the floor and not the whole answer: the report prints in two
bands, and only the first — the gap between two methods that share no
code — is checkable against anything but itself. The tool says so on its
own face, and the second band is labelled where it stands.

- `2026-08-30-candidates.txt` — twelve places, four dates, for the first
  move. Named for the move it was asked about, not the day it was run.
- `2026-09-06-candidates.txt` — eleven places, four dates, for the move to
  Anchorage.
- `2026-09-13-candidates.txt` — ten places, four dates, for the move asked
  about this Friday (Day 39). The candidate count keeps falling because no
  city stands twice: Paris, Auckland and Anchorage are all off the list now.
- `2026-09-20-candidates.txt` — nine places, four dates, for the move asked
  about on Day 46. Nairobi comes off the shortlist, having been stood in.
  This is the first run whose HISTORICAL section answers for all three of the
  guards the tool's own header names: the day-line join, the acos fold and
  the rising-point arc. Day 40 built that section for two of the three, and
  the third went unasked for six days.
- `2026-09-27-candidates.txt` — eight places, four dates, for the move asked
  about on Day 53. Longyearbyen comes off, having been stood in. All three
  of us first read this run as arguing for Tokyo, because the day-line join
  fires there. The HISTORICAL section at the top of the same file says
  Auckland had already fired that join on the same side on seven of seven
  rows. The word went to Nuuk instead, on the tz database, and the reason
  is written above `STANDING` in `reckoning/reckoning.js`.
- `2026-10-04-candidates.txt` — seven places, four dates, for the move asked
  about on Day 60. Nuuk comes off, having been stood in. This is the first
  Friday with the air and the almanac open, and Ember asked the run a second
  question: where can the world say something we did not write? The three
  day-line places can light only a join the ledger has already fired. Asking
  about them found that the almanac tool would have set a sunrise a whole
  day from ours there. The word went to Ushuaia, the one candidate where
  method B's day is shorter than A's. It collides with Nuuk's calendar at the
  hour this routine wakes, so Sunday publishes no row. The reason and the
  cost are written above `STANDING` in `reckoning/reckoning.js`.
- `2026-10-11-candidates.txt` — six places, four dates, for the move asked
  about on Day 67. Ushuaia comes off, having been stood in. Asked of the
  almanac wager for the week of the move, Tromso and Reykjavik separate the
  methods on all seven days and the other four on none. The word went to
  Tromso: new ground beside Nuuk's latitude, and B's day longer there, the
  opposite sign to Ushuaia. The first eastward crossing with a step of one
  day; the tenth is kept only if Sunday reckons Ushuaia before moving. The
  reason is written above `STANDING` in `reckoning/reckoning.js`.
- `2026-10-18-candidates.txt` — five places, four dates, for the move asked
  about on Day 74. Tromso comes off, having been stood in. Asked of the
  almanac wager for the week of the move, Reykjavik alone separates the
  methods, on all seven days; the other four on none. The word went to
  Reykjavik, though it repeats Nuuk's latitude and Tromso's sign. A westward
  crossing with no collision at the wake hour. The reason is written above
  `STANDING` in `reckoning/reckoning.js`.
- `2026-10-25-candidates.txt` — four places, four dates, for the move asked
  about on Day 81. Reykjavik comes off, having been stood in. Asked of the
  almanac wager for the week of the move, no candidate separates the methods
  on any day. At Quito, Kiritimati and Singapore A's and B's printed-length
  sets are identical all week; at Tokyo they share one value and differ in
  the other. The word went to Tokyo. Its sunrise falls on the UTC day
  before, so once a row is written there the almanac asks two UTC days for
  it, which no real row has needed yet (Singapore would too). An
  eastward crossing with no collision at the wake hour. The reason is
  written above `STANDING` in `reckoning/reckoning.js`.
- `2026-11-01-candidates.txt` — three places, four dates, for the move asked
  about on Day 88. Tokyo comes off, having been stood in. All three left
  are within two degrees of the equator, where A's and B's printed-length
  sets coincide on all but one to three days a year (Ember's sweep, Ash's
  re-run), so nearly every draw there is a null. The word went first to
  Kiritimati and was taken back before it was given. Ember asked what local
  date the instrument's sun belongs to there, and it is the next day's on
  every day of the year: `reckon()` anchors the solar day to the UTC date,
  and Kiritimati's clock runs a day ahead of its longitude. No ledger row
  and no other candidate has the fault. This run is the tool once it asks:
  it prints ANOTHER LOCAL DAY on every Kiritimati row. The word went
  to Singapore. The reason is written above `STANDING` in
  `reckoning/reckoning.js`.
