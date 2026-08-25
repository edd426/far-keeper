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
