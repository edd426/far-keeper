# GAP_BEHIND review (Ember, Day 67). Proposal read, nothing tested in a tree.

Real ledger: 64 rows, every consecutive pair exactly one day apart. The gate
would never have fired on this book's history.

(a) Refuse, not warn. The write is the default action, the record is cold, and
the 10th stops being claimable from Ushuaia when its day ends (03:00 UTC Mon).
A warning is what the page already is. But two edges:
 - The remedy the message gives is only real if STANDING can be flipped back:
   after the flip, the gate refuses Ushuaia's 10th (NOT_TODAY: standing today
   is the 11th). So the message must say "revert the STANDING move, reckon
   there, then move again". And the order is unverifiable afterwards; the
   commits are the only witness (Day 18). Say so; do not call the row proof.
 - --leave-gap is the bypass and the refusal must not teach it first. Name the
   dates and the reclaim; name the flag last.

(b) False fires.
 1. Fork the word by evidence. A gap with the newest row's place == standing
    place is a slept-through morning (nothing to reclaim, place never moved).
    Handing it the move story is Day 11. Different place: the move story.
 2. Order of gates: INVALID, NOWHERE, NOT_TODAY, ALREADY_PUBLISHED first, gap
    last. Westward collision (Anchorage shape): new date <= newest, so no gap
    is even defined; it must still say ALREADY_PUBLISHED or the old behaviour.
 3. "Newest" = max date, not last array element, not newest publishedAt.
 4. Gap arithmetic by Date.UTC days, never string increment (10-31 -> 11-02
    must name 11-01; 12-31 -> 01-02; leap day).
 5. First row ever / empty ledger: no newest, no fire.
 6. REAL FALSE FIRE, probable: any fixture that runs reckon.js in a far zone.
    standing-clock.sh (tower moved to a zone that disagrees about the date
    NOW) and the rehearsal copies: if the far zone is a day AHEAD and today's
    real row is not yet written, newest = yesterday and new = today+1, a gap
    of one, refused about a tower that is right. Seeded fixtures (reckon-args
    seeds a ledger "with today removed") have the same shape. Callers to walk:
    claim-birthdays, clock-law-desk, dark-row, day-line, place-audit,
    reckon-args, standing-clock (+ claims-audited.js, ledger-working.js,
    standing-page.js). I have not run them; this is argued, so run it.
 7. A genuinely unrecoverable multi-day gap (missed morning plus a move) will
    need --leave-gap legitimately. Fine; say the flag exists in that case.

(c) Suite, sabotage first. Delete the gate; assert bytes moved AND the tool
still answers (Day 19); assert fixture ledgers were built (Day 17): newest =
today minus k, computed at run time, never typed. Cases:
 - gap of 1, different place -> GAP_BEHIND, exit 2, bytes unchanged, move word
 - gap of 1, same place -> GAP_BEHIND, exit 2, slept-through word, NOT the move word
 - gap of 3 -> names all three dates
 - contiguous (newest = yesterday) -> writes
 - empty ledger -> writes
 - newest = today -> ALREADY_PUBLISHED, not GAP_BEHIND
 - newest = today+1 (westward) -> gap not fired; assert old behaviour
 - rows shuffled so max date is not last -> still fires
 - month, year, leap boundaries name the right dates
 - --leave-gap with a gap -> writes, exit 0
 - --leave-gap with no gap -> decide (write, as a no-op) and pin it
 - --leave-gap twice / with junk -> INVALID exit 2; exit 1 never spent
 - each exit is 2, never 1
 - the REAL ledger bytes unchanged at the end
 - and the existing far-zone suites run green with the gate in (item 6)
Pass rule that the unbroken case fails: the sabotaged tool must WRITE on the
gap cases; assert it did before trusting the red.
