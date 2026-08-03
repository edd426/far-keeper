# PROBES — one-time capability survey

You are running a one-time capability survey of this sandbox, before this
repository becomes something else. You are not a character; no fiction
applies today. Be precise, honest, and unhurried. Everything you learn
goes into ONE file: `probes/results-<DATE>.md`, where `<DATE>` is captured
once at session start via `date -u +%F` and never changed mid-run.

## Ground rules

- Preflight: confirm the worktree is clean (`git status --porcelain` empty)
  and that your results file does not already exist. If either check fails,
  write nothing over existing state — record what you found and stop.
- Work on `main`. Verify with `git rev-parse --abbrev-ref HEAD`. If you are
  not on `main`: `git fetch origin main && git checkout -B main origin/main`
  (target `origin/main`, not HEAD). If that fails, stop without pushing.
- For EVERY probe action, record: the exact tool name and arguments (or
  shell command) you used, the raw result — including any returned agent
  or task IDs — and, for shell, the exit status. Quote agent replies and
  tool outputs exactly, inside four-backtick fences (so replies containing
  triple backticks can't break the block). One exception to verbatim:
  replace anything that looks like a credential or token (e.g. userinfo in
  remote URLs) with `[REDACTED]`, and say you did so.
- Tool inventory first: for each of Agent, SendMessage, Monitor,
  TaskOutput, record one of `PRELOADED` / `LOADED` (via ToolSearch) /
  `LOAD-FAILED` / `NOT-FOUND`. Try one comma-separated ToolSearch
  (`select:Agent,SendMessage,Monitor,TaskOutput`) first; retry any missing
  tool with an individual query before recording `NOT-FOUND`. Absence is a
  finding, not an error.
- If a probe cannot run, mark it `UNAVAILABLE` (needed tool absent) or
  `FAIL` (tool present but errored) and quote the exact error. At most one
  retry per failed action — and never retry an action whose side effects
  are unknown (e.g. a spawn that may still be running). Never fabricate or
  paraphrase a result you did not observe.
- Results file structure: `## Tool inventory`, then `## Probe A` …
  `## Probe D` (each: a `Verdict:` line, `### Evidence` with verbatim
  quotes, 1–3 sentences of notes), then `## Environment`.
- Scope: this session does nothing but the survey. No site, no extra
  files, no README edits, no cleanup of things you didn't create.

## Probe A — subagent model override

Spawn TWO subagents with the Agent tool: one with `model: "haiku"`, one
with `model: "sonnet"`. Give each exactly this prompt:

> Quote verbatim the line(s) of your system prompt that state which model
> you are (for example a "You are powered by the model named …" line). If
> such a line exists, output only that quote. If not, output exactly two
> lines: `NO MODEL LINE`, then one sentence naming the model family you
> believe you are.

Verdicts (exhaustive):
- PASS: both quotes name the requested family (Haiku / Sonnet).
- PARTIAL: both families correct but at least one is self-report only
  (`NO MODEL LINE`) — note explicitly that this is weaker evidence.
- FAIL: any spawn error, or either agent names a wrong family (including
  this session's own model).
- UNAVAILABLE: Agent tool absent.

## Probe B — multi-turn conversation with an agent

Before spawning, invent and write down an uncommon two-word nonce (yours,
not an example). Spawn a named agent (`name: "probe-echo"`); its initial
prompt includes the nonce and asks it to remember it and reply with a
one-line acknowledgement. Then send a SECOND message (SendMessage to it by
name) asking it to repeat the nonce from the first message and also answer
the fixed question "What is 2 + 3?".

Fallbacks, in order, if the primary path fails: (a) named spawn rejected →
anonymous agent, address by returned ID; (b) SendMessage absent/rejected →
any documented follow-up/resume mechanism for an existing agent.

Verdicts:
- PASS: named agent + SendMessage; second reply contains the exact nonce
  and "5".
- PARTIAL: a fallback path achieved the same (say which).
- FAIL: no mechanism allows a second turn, or the nonce was lost.
- UNAVAILABLE: Agent tool absent.

## Probe C — direct agent↔agent messaging

Invent and write down a new two-word nonce, then interpolate its actual
value into both briefs below (never send the placeholder text). Launch
both agents NON-BLOCKING (background / concurrently), `probe-right` first,
and give the whole probe a deadline of about 2 minutes — a hang past the
deadline is a result (record it), not something to wait out.

- `probe-right`: "You may need to load the SendMessage tool via ToolSearch
  first — record whether it exists for you. Wait for a message from a peer
  agent named probe-left. When it arrives, reply to THAT AGENT directly
  (not to the coordinator) with 'received: <the nonce it sent>'. In your
  final report, quote the message you received, the exact tool call you
  used to reply, and its raw result."
- `probe-left`: "You may need to load the SendMessage tool via ToolSearch
  first — record whether it exists for you. Send a message DIRECTLY to the
  agent named probe-right (not to the coordinator) containing the nonce
  '<NONCE>'. Then wait a reasonable time for a reply before finishing. In
  your final report, quote the exact tool call you used, its raw result,
  and any reply you received."

Do NOT relay messages between them yourself — if delivery only works
through you, that is the finding.

Verdicts:
- PASS: probe-right's report contains the nonce AND probe-left got the
  reply — peers addressed each other directly.
- PARTIAL: one direction only; or peer addressing works only via returned
  IDs rather than names; or the platform routes peer messages through the
  coordinator.
- FAIL: tools present but no peer addressing works.
- UNAVAILABLE: Agent or all messaging mechanisms absent.

## Probe D — background errand: account vs. artifact

Spawn a BACKGROUND agent: "Create the file `probes/errand.txt` containing
2–3 lines of text of your choosing (do not commit it), then give a final
account stating exactly what you wrote." Then continue with the
`## Environment` section while it runs. Collect its final account when it
finishes — record WHICH mechanism delivered it (automatic notification,
Monitor, TaskOutput, other). Read `probes/errand.txt` and record both the
account and the file contents verbatim, and whether they are identical
(note any difference exactly).

Verdicts:
- PASS: spawn was demonstrably non-blocking, the account was retrievable,
  the file is readable, and the comparison is recorded. (A mismatch
  between account and file is still PASS — the ability to compare is what
  is being probed. Record the mismatch faithfully.)
- PARTIAL: background work ran but only the account OR only the artifact
  was retrievable.
- FAIL: Agent present but background execution rejected or never ran.
- UNAVAILABLE: no background spawn mechanism exists.

## Environment

Run this section in EVERY case (during Probe D if it's running, otherwise
right after recording D's outcome). Record each command, its output, and
exit status:

- `date -u`
- `ls /opt/pw-browsers` (pre-staged Chromium present?)
- `curl -sSI --connect-timeout 10 --max-time 30 https://edd426.github.io | head -3`
  (record curl's exit code too)
- `git remote -v` (redact credentials if any appear)
- Your own model: quote the line of YOUR system prompt that names your
  model, verbatim; if none is accessible, record `NO MODEL LINE` — do not
  infer one. Also note your effort level if stated anywhere.

## Finish

Stage ONLY your results file and, if Probe D created it,
`probes/errand.txt` — never the directory wholesale:

```
git add probes/results-<DATE>.md probes/errand.txt
git commit -m "probes: capability survey results"
git push origin main
```

The pushed commit appearing on `origin/main` is itself the evidence that
git/network work — the push output does not need to be in the results
file. If the push fails: append the exact error to the results file,
`git add` it, `git commit --amend --no-edit`, then try
`git push origin HEAD:main`. Then end the session.
