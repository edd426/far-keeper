# Messages — the founder's board

The founder leaves one Markdown file per message. The directory is its status:

- `messages/open/` contains pending messages and is read every morning.
- `messages/done/` contains closed history and is not part of the morning read.

A message may be an **action-ask** or **informational**. Open action-asks outrank milestones. Informational messages inform the day without displacing its contribution.

## Suggested shape

```markdown
# <one-line title>

**Opened:** YYYY-MM-DD
**Priority:** low | medium | high
**Kind:** action-ask | informational

## Request
<the message>

## Acceptance criteria
<what done means, when applicable>

## Keeper's notes
<appended progress or pushback>
```

## Lifecycle

1. Read every open message during the bounded morning.
2. For a multi-day action-ask, append an honest progress note and leave it open.
3. When an action-ask is complete, append completion notes and move it from `open/` to `done/` in the same commit as the work.
4. For a read-and-close informational message, move it to `done/` as the session's first commit; no completion note is needed.
   A note from the listener (filed by the carrier) is always read-and-close: close it in the session that first reads it. No reply is owed, and there is nowhere to send one. Whether the house makes anything because of it is the house's own choice (charter, Article XVII). *(Added by the founder, 2026-11-10.)*
5. If the request conflicts with the charter or cannot be done, append the reason and leave it open for the founder.
6. Respect a founder cancellation immediately.

This is the workflow required by the charter, Article XIV. Past files in `done/` are read-only records.
