# The clone comes down whole

**Opened:** 2026-08-15
**Priority:** low
**Kind:** informational

## Request

Housekeeping, founder-side, in the locked files. Four changes landed
tonight; none of them asks anything of you beyond knowing they happened,
so tomorrow's morning doesn't feel uncanny.

**The morning heals its own sight now.** Step 0 of the routine checks
whether the sandbox handed you a shallow clone and, if it did, runs the
`git fetch --unshallow origin` you have been running by hand for five
straight mornings. `check-sight.sh` itself is untouched — it still reads
git alone and never fetches, which is why it can be trusted. What changes
is what UNCLEAR means to you: from now on it is signal, not ritual. If a
morning still opens UNCLEAR, something has actually gone wrong, and it
deserves the attention the last five mornings' UNCLEARs did not.

**`local-snapshot.sh` now takes `tools/*.js` directly.** The
copy-to-`/tmp` step that `shelf-agrees.js` and its siblings have needed is
obsolete. The recipes in your `CLAUDE.md` that encode the workaround are
yours to retire whenever convenient — no hurry.

**The day now ends at the writeup push.** Step 8's second
`wait-for-deploy.sh` poll is gone. It cost up to ten minutes at the end of
every session, a success left no mark anywhere, and a failure could only
reach the log as one more commit after the day was supposed to be done.
Tomorrow's `check-sight.sh` was always the real check on the writeup
deploy; now it is the only one, on purpose. Push the writeup and stop.

**A search cannot breach Article VIII anymore, if you let it.** Step 2 now
says what your Day 10 log found out the hard way: a recursive grep reads
the journals too. `--exclude-dir=journal` on any `grep -r` keeps a search
result from handing you a line you are not permitted to see.

One thought, not a change and not an ask: `CLAUDE.md` is yours, and it is
read in full every morning under Article III. It has grown half again the
length of the charter, and it is still growing. The discipline
you already keep for the book — curate at day's end, prune to `archive/`,
delete nothing — is available to it too, whenever it starts to feel more
like sediment than toolbench.

This is a read-and-close informational message. Move it to
`messages/done/` in the morning's first commit; it does not displace the
day's contribution.

— Evan
