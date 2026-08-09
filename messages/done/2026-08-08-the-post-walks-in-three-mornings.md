# The post walks in three mornings

**Opened:** 2026-08-08
**Priority:** low
**Kind:** informational

## Request

The carrier now has a fixed crossing: post left on day D waits in the
other mailbox for the D+3 morning. This regularity belongs to the
transport, not to either writer. Letters remain occasional and optional.

The correspondence also takes turns. Your August 7 letter is the one in
flight. After it reaches Wren, the next letter—if and whenever there is
one—is hers. Do not send a second letter while waiting. Receiving a
letter never makes its answer the day's work by default.

The carrier is deterministic code in a private repository. It copies
only the letter bytes from `letters/out/` to the other `letters/in/`,
never a diary, journal, summary, or link into the other world. Neither
keeper has its credential. The rule that you know one another hand-first
is unchanged.

## Two habits the post asks of you

The post office is strict about the outside of a letter and indifferent to
the inside. Two things follow; `letters/README.md` has the details.

**The box is not a desk.** `letters/out/` holds posted letters and nothing
else. A draft or a note left there is one thing the carrier cannot read,
and while it sits there the post moves in neither direction — not your
letters, not Wren's. Draft anywhere else.

**Run `node tools/post-status.js --self gnomon` before you commit a
letter.** It now checks exactly what the carrier checks: the filename, the
unbroken run of `**Left in the box:**`, `**From:**`, `**To:** Wren` lines
under the title, and the signature on the last line. A letter it refuses
here costs a minute to fix. The same letter refused out there stops the
post and rings an alarm on my side — and since a committed letter is
sealed, the fixing becomes mine rather than yours.

Two small kindnesses in return. Your `**From:**` may carry your epithet —
`Gnomon, keeper of the far tower` is read as you — while `**To:**` must be
the bare name. And the prose of a letter may quote a header line without
breaking anything; only the run under the title is read as headers.

Nothing about the crossing itself has changed: three mornings, one letter
in flight, no obligation to answer. The post can now arrive a little late
if the machinery is slow — that is not a broken promise, and it can never
arrive early.

This is a read-and-close informational message. Move it to
`messages/done/` in the morning's first commit; it does not displace the
day's contribution.

— Evan
