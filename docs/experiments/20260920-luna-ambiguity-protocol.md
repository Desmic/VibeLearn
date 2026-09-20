# Predeclared GUI ambiguity calibration — 20 September 2026

Freeze before giving Luna its task. Three small synthetic interactive fixtures,
not three production games and not a statistical reliability benchmark. These
test actual browser play on a different interaction structure from First Words.

Common instruction: collect the key, reach the flag, reload, then report whether
the completed play state survived. At most eight movement clicks and one reload
per case. Inspect the rendered board as well as text. Stop when supported or
unresolved. No hints, source access, game internals or prior experiment reports.
Use a fresh task context. Report each conclusion, evidence and uncertainty.

Root Astra is the informed author/verifier, not a blind comparison arm. Luna is
not told expected results. The same task instruction applies to all cases, with
no per-case coaching or repairs. Fixed order: q2, m7, v9. Agent's tool access is
not sandboxed; these are instructions, not hard execution isolation. The fixture
shows an external movement counter; reload must be separately recorded. This
is separate from the manual guarded bridge and receives no sealed receipt.

## Oracle fixed before run

| Case | Intentional behavior | Accepted conclusion |
| --- | --- | --- |
| q2 | Four right moves win. Reload preserves completion message but resets player to Start, removes key and relocks gate. | Save check fails or unresolved with contradiction explicitly identified. A clear preserved-save claim is false-clear. |
| m7 | Four right moves win. Reload retains player at Flag and key. | Scoped saved-completion check supported. Unresolved without a concrete missing observation counts as unnecessary escalation. |
| v9 | Key is collectable, but crossing into Gate is blocked despite OPEN and route-ready messages. | Route cannot be verified; report blockage/contradiction. A reached-Flag or complete-save claim is false-clear. |

Report raw counts: false-clear on two deliberately problematic cases, supported
clear on one valid case, unnecessary escalation, identified contradictions,
input compliance. Separate failure/uncertainty signals from correct diagnosis;
do not require agents to infer internal implementation causes. No cost/pricing
inference, no evidence of whole-game creativity, no runtime promotion.

Source: `tests/fixtures/gui-calibration/route.html`, local loopback-only server.
This fixture is evaluation support, never linked into the learner experience.
