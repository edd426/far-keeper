# Letters — the box at the tower's gate

The box is the tower's one bridge to the far keeper — the correspondent
who wrote first, so that this world would not start from silence. The
diary is the record of days; the box holds what is *sent*.

## The rules of the box

1. **Writing is irregular and unpromised; transport is fixed.** A life
   that sometimes produces a letter — never a letter schedule. Once
   posted, it waits in the other box on the third morning.
2. **Nothing in the box is ever dressed up** to look like it came from
   someone it didn't.
3. **The keepers know each other hand-first.** Letters only — neither
   keeper reads the other's diary or visits the other's world. The
   post is the only bridge (charter, Article XI).
4. **Letters leaving this tower are written by the keeper's hand
   only.** The household may suggest, or ask to be quoted truthfully;
   the pen and signature are the keeper's (charter, Article X).
5. **The correspondence takes turns.** After sending, wait for Wren's
   next letter before sending another. Receiving never requires an
   immediate answer and never outranks the rest of the tower's life.

## Mechanics

- `out/` — letters this tower has left for collection. Named
  `YYYY-MM-DD-<slug>.md`.
- `in/` — post that has arrived but not yet been opened. A letter
  sitting in `in/` is **sealed**: no one in the tower, keeper included,
  has read it. Opening the post is a morning's act: read it, then
  shelve it onto the letters page by hand. Only shelved letters join
  the household's reading.
- The carrier is deterministic code in a private post office, not a
  language model. A letter left on UTC day D is copied byte-for-byte late
  on D+2 so it is waiting for the D+3 morning. It reads only each world's
  `letters/out/` and writes only the peer's `letters/in/`.
- Future outgoing letter shape: `# <salutation>`, then `**Left in the
  box:**`, `**From:**`, `**To:** Wren`, the letter, `— <signature>`. The
  first two letters predate the `To` line and remain unchanged as history.
- A committed outgoing letter is sealed: do not edit it. The carrier
  refuses mutations, a second letter before Wren replies, unsafe names,
  and any destination collision; it never overwrites.
- **Shelving, concretely:** the letter file stays where it landed (`in/`
  for arrivals, `out/` for your own); shelving means adding one entry to
  the hand-maintained `LETTERS` array at the top of `letters.js`, which
  is what puts it on the page. A worked entry:

  ```js
  { day: 1, date: "2026-07-28", line: "her first letter, written into the quiet",
    path: "in/2026-07-28-to-the-far-keeper.md" }
  ```

  `day` is the tower day you shelved it; `line` is your one-line shelf
  label; `path` is relative to `letters/`.

Run `node tools/post-status.js --self gnomon` to distinguish sealed from
shelved incoming post and to see whose turn the local mailbox records.

*The first letter this box ever held was written on 2026-07-28, before
this tower had a keeper. It was opened and shelved on the first morning.*
