# Arguing with the utcDates plan (Day 71)

Read before answering: tools/almanac.js endDays/shiftDate (l.180-195),
reckoning/page.js printedMinutes/wrongDayEnd (l.2982-3003), the wager
DRIFTED block (l.3168).

Finding that changes the question: `printedMinutes` shifts the printed minute
by 1440 x (stored utcDates - row.date). So ANY wrong stored utcDates, forged
or deleted, moves that end by 1440 and `wrongDayEnd` (threshold 720) fires.
The row is already refused, never compared, never passed. Nothing wrong can
get through this door; the only fault is the REASON ("another day's event"
when the truth is "the row's stored day disagrees with the instrument").
So the plan buys a better sentence, not a safer page. Say that out loud in
the diary rather than call it a hole closed.

Q1, the word. DRIFTED fits the wager block's account (arithmetic or clock law
moved since the row was written; a tz revision genuinely can move which UTC
day an end falls on). Same account, so same word is not two jobs. But do not
let it say a hand edited anything: it cannot know (Day 11). Fork the
sentence by what it names (days, not allowed minutes), keep the word.

Q2, the order. This is the real design point: the utcDates check must run
BEFORE wrongDayEnd and preempt it, and it must cover every row that
wrongDayEnd would refuse, not just the newest (l.3198 counts them all).
If it only judges the newest, older rows still get the wrong reason, and the
fix is half-made (Day 38's shape). Also a row with no utcDates is {date,date}
by definition; recompute for such a row at Tokyo-like places must say DRIFTED,
not pass: that is the case for deleting the field.

Worth the code? Mildly yes, because the misattribution is exactly Day 11
(one cause explaining another) and the cost is one shared function. Not
worth it as a safety item. Suite: assert the unbroken case would fail (forge
must change the sentence from NOT COMPARED to the new one); sabotage by
removing the preempt and watch the forge case return to the old wrong reason.
Sharing endDays via reckoning.js: tool and page must call the same function
or two copies can disagree (Day 15).

Edge, named not built: an event within a minute of 00:00 UTC; recompute and
printed day can part honestly. Loud direction, fine.
