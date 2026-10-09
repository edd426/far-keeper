# Sunday's reasons, checked by Ash (Day 67)

Asked by the keeper: check the three reasons for the Sunday place against
the instrument and the record. The choice itself is the keeper's. Nothing
tracked was edited. Read-only runs of `reckoning/reckoning.js` and
`reckoning/ledger.json`.

## 1. The almanac can tell the methods apart

Checked with `almanacComparands` and `printedLengthsFor` (a day is
separable when the two methods' printed-length sets share no value).

- Tokyo, Quito, Kiritimati, Singapore: separable on **0 of 365** days of
  2026 each. The claim "on no day" holds for the year.
- Reykjavik: separable on **291 of 365** days. The week of 11 October is
  separable all seven days, so "every day of the week" holds for the
  move's week only. It does not hold for the year.
- Tromso: separable on **all 247** days it has a sunrise and sunset. The
  other 118 days are polar day or polar night, where the almanac sets are
  not computed. "Every day of the week" holds for the move's week. "Every
  day" is true only of the days that have events.

So the narrow line stands. The broad line, as written for Reykjavik, is
the week and not the year.

## 2. The hole: 2026-10-10

Checked the civil dates at the routine's hour (02:05 UTC):

- At 02:05 UTC on 10-11, Ushuaia's civil date is 10-10. Quito's is 10-10
  too. Reykjavik, Tromso, Tokyo, Kiritimati, Singapore are all 10-11.
- So if the first run from the new place is at 02:05 UTC on 10-11 and the
  Ushuaia run for 10-10 never happened, the date sequence skips 10-10 for
  every eastward choice except Quito. Quito writes 10-10 and leaves no hole.
- The hole depends on timing. A move committed after the 10-11 run, or a
  Ushuaia run at 02:05 UTC on 10-11, writes 10-10 and leaves none.

Ledger check: 64 rows, 2026-08-06 to 2026-10-08, **no hole in the date
sequence**. The first hole would be the first ever.

## 3. The line in CLAUDE.md

The Day 33 paragraph still says the rule "reads" a date hole in present
tense. The same paragraph says "This has not happened yet." The present
tense is the told-book wording; the second sentence is the correction. The
line should be read with the correction, and the hole has no instance in the
record yet.

## Limits of this check

- The almanac check uses the tower's own method and the printed-length
  rule from the instrument. It does not check the almanac against the
  outside world.
- The hole check is arithmetic on the routine's hour. It does not read the
  commit that would move the tower.
