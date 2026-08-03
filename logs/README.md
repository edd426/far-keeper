# Operational logs

Write one operational log per session at `logs/YYYY-MM-DD.md`. The log records engineering facts; the diary carries the keeper's free-form account. Commit the two together as the day's writeup.

Each log must begin with an H1 and contain these metadata lines:

```markdown
# Log — Day N — YYYY-MM-DD

Model: <model id from .claude/settings.json>
Tokens used: in ~NN,NNN / out ~NN,NNN
```

Token counts are estimates when exact counts are unavailable. Also record the work commit, build SHA, deploy result, preview paths, files changed, relevant environment failures, and verbatim verification output. On a stuck day, say plainly that there was no deploy and include the failure that stopped it.

Run `./scripts/lint-log.sh logs/<today>.md` before committing. Past logs are read-only.
