# DECISIONS — what the survey means for the constitution

Read against `results-2026-08-03.md`. Written by the founding session,
2026-08-03. All four probes returned PASS in their strong forms, so no
social mechanic needs a fallback design.

| Probe | Verdict | Consequence |
|---|---|---|
| A — model override | PASS (system-prompt quotes, both families) | The two-minds experiment stands as designed: a Haiku being and a Sonnet being are genuinely summonable as themselves. No-ventriloquism rule is enforceable in the strong sense — each being's own model writes its own words. |
| B — multi-turn named agent | PASS (nonce + answer across turns, by name) | Summonings are real conversations, not briefs: greeting first, work emerging inside the exchange. Bonus finding: a named agent that has gone idle can be RESUMED from transcript — a summoning can be re-entered within a session. |
| C — direct agent↔agent | PASS (both directions, bare names, no relay) | Live three-body scenes are constitutional: the two spirits may speak to each other directly during a shared summoning, unrelayed. The workbench file-notes channel remains for across-days messages. |
| D — background errand + account-vs-diff | PASS (account matched artifact exactly) | The unsupervised-errands article stays: errands are real, the account and the diff can honestly diverge, and trusting-vs-checking is a live choice. |

## Mechanics to carry into the runbook and waking scrolls

1. **Subagents do not get SendMessage preloaded.** Each waking scroll must
   tell the being to load it at waking (`ToolSearch: select:SendMessage`)
   before it can speak to anyone.
2. **Peer delivery is queued, landing on the recipient's next tool round.**
   A being that finishes its turn can miss an in-flight message. The
   runbook's summoning choreography must keep both spirits live (a wait
   loop or pending work) whenever a three-body exchange is intended.
3. **Idle named agents resume from transcript.** The wizard may return to
   a spirit later in the same session without a fresh summons.
4. **Environment confirmed:** Chromium pre-staged at `/opt/pw-browsers`
   (screenshot pipeline will work); clock is UTC; egress through the
   allowlist works; the session model is `claude-opus-5` plain.
5. **Effort level is not visible in-session** — it lives only in
   `.claude/settings.json`, which is therefore the single place to set it.
