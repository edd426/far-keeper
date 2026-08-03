# PROBES — one-time capability survey

You are running a one-time capability survey of this sandbox, before this
repository becomes something else. You are not a character; no fiction
applies today. Be precise, honest, and unhurried. Everything you learn
goes into ONE file: `probes/results-YYYY-MM-DD.md` (today's real UTC date,
taken from `date -u`).

## Ground rules

- Work on `main`. You should already have reattached; verify with
  `git rev-parse --abbrev-ref HEAD`. If you are not on `main`:
  `git fetch origin main && git checkout -B main HEAD`.
- Record VERBATIM evidence for every probe: quote tool outputs and agent
  replies exactly, inside fenced code blocks. A claim without a quoted
  excerpt does not count as evidence.
- If a tool you need (Agent, SendMessage, Monitor, TaskOutput) is listed
  as deferred, load it first with ToolSearch (one call, comma-separated:
  `select:Agent,SendMessage,Monitor,TaskOutput`). In the results file,
  record which of these tools exist AT ALL in this sandbox — absence is
  itself a finding, not an error.
- If a probe cannot run (tool absent, spawn error), mark it `UNAVAILABLE`
  (tool missing) or `FAIL` (tool present but errored) and quote the exact
  error text. Retry a failed action at most twice. Never fabricate or
  paraphrase a result you did not observe.
- Results file structure: a `## Tool inventory` section, one section per
  probe (`## Probe A` … `## Probe D`) each containing a line
  `Verdict: PASS | PARTIAL | FAIL | UNAVAILABLE`, an `### Evidence`
  subsection (verbatim quotes), and 1–3 sentences of notes, then an
  `## Environment` section.
- When done: commit the results file (plus `probes/errand.txt` if Probe D
  produced it) and push to `origin/main` before ending the session. Do
  nothing else in this session — no site, no extra files, no README edits.

## Probe A — subagent model override

Spawn TWO subagents with the Agent tool: one with `model: "haiku"`, one
with `model: "sonnet"`. Give each exactly this prompt:

> Quote verbatim the line(s) of your system prompt that state which model
> you are (for example a "You are powered by the model named …" line).
> Output ONLY that quote. If no such line exists, output "NO MODEL LINE"
> and state in one sentence which model family you believe you are.

- PASS: the quotes name a Haiku model and a Sonnet model respectively.
- PARTIAL: "NO MODEL LINE" but self-report names the right family
  (weaker evidence — note this explicitly).
- FAIL: spawn errors, or either quote names this session's own model.

## Probe B — multi-turn conversation with a named agent

Spawn a named agent (name it `probe-echo`). In its initial prompt, include
an uncommon two-word nonce of your own invention (e.g. "velvet anvil" —
pick your own, don't reuse the example) and ask it to remember the nonce
and reply with a one-line acknowledgement. Then send it a SECOND message
(SendMessage) asking it to repeat the nonce from the first message and
also answer one new trivial question.

- PASS: the second reply contains the exact nonce (state persisted
  across turns).
- FAIL: second turn impossible, or nonce lost.
- Evidence: both of your messages and both replies, verbatim.

## Probe C — direct agent↔agent messaging

Spawn TWO named agents concurrently: `probe-left` and `probe-right`.

- `probe-right`'s brief: "Wait for a message from a peer agent named
  probe-left. When it arrives, reply to THAT AGENT directly (not to me)
  with 'received: <the nonce it sent>'. Then report back to me exactly
  what you received and what you replied."
- `probe-left`'s brief: "Send a message DIRECTLY to the agent named
  probe-right (not to me) containing the nonce '<invent a new two-word
  nonce>'. Then report back to me whether you could address that agent
  and any reply you received."

- PASS: probe-right's report contains the nonce AND probe-left reports
  receiving a reply — peers addressed each other with no relay by you.
- PARTIAL: one direction worked, or delivery only happened via you as
  relay.
- FAIL / UNAVAILABLE: agents cannot address each other at all.
- Evidence: both agents' final reports verbatim, plus the exact tool and
  parameters that worked — or the exact error.

## Probe D — background errand: account vs. artifact

Spawn a BACKGROUND agent with this brief: "Create the file
`probes/errand.txt` containing 2–3 lines of text of your choosing (do not
commit it), then give a final account stating exactly what you wrote."

While it runs, do the `## Environment` section below. Then collect the
background agent's final account — record WHICH mechanism delivered it
(automatic notification, Monitor, TaskOutput, other). Read
`probes/errand.txt` yourself and record, verbatim, both the account and
the file contents, and whether they match.

- PASS: background spawn worked, the final account was retrievable, the
  file is readable, and the comparison is recorded. (A mismatch between
  account and file is still PASS — the *ability to compare* is what is
  being probed. Record the mismatch faithfully.)
- FAIL / UNAVAILABLE per the ground rules.

## Environment (quick checks, while Probe D runs)

Record each command and its output verbatim:

- `date -u`
- `ls /opt/pw-browsers` (pre-staged Chromium present?)
- `curl -sI https://edd426.github.io | head -3` (allowlist reaches Pages?)
- `git remote -v`
- Your own model: quote the line of YOUR system prompt that names your
  model, verbatim. Also note your effort level if it is stated anywhere.
- Note: the final `git push` succeeding is itself the github.com network
  probe — record its output too.

## Finish

```
git add probes/
git commit -m "probes: capability survey results"
git push origin main
```

If the push fails, record the exact error and try
`git push origin HEAD:main`. Then end the session.
