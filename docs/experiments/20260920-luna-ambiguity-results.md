# Luna direct-browser ambiguity results — 20 September 2026

Luna made the expected scoped conclusion in all three predefined cases: rejected
the misleading save, accepted the working save, and left the blocked route
unresolved. It missed a requested evidence step: pre-reload screenshots in the
two completed cases. Conclusion correctness and protocol completeness are
separate results.

## Method and frozen oracle

See [predeclared protocol](20260920-luna-ambiguity-protocol.md). Root created and
hashed the fixture and expected outcomes before spawning
`luna_uncoached_gui_cases` with model `gpt-5.6-luna` and no inherited conversation.
The task received only URLs, common objectives, budgets and observation rules;
no fault labels, source or expected answers. No hints were sent during play.
Audit questions were sent only after its conclusions were frozen.

Frozen SHA-256 values:

- Fixture: `e754946140c0f8d5fc07820a9b1595b397b4b41476c481847430ca103a91b796`.
- Protocol: `faf41c61b16548c5a5fa2158dc72e521b3d4b5be13318613b37b2eaf64bfc71b`.

Actual order: q2, m7, v9. One failed visibility-option setup attempt for m7 was
retried without that option before its gameplay. Each case used a fresh tab;
session storage is tab-scoped. All temporary tabs were closed afterward. The
fixture server used loopback port 8053, separate from First Words and learner
data. This is one simple game fixture with three variants, not three unrelated
production games or a randomized, held-out benchmark.

Unlike the previous supervised bridge run, Luna operated CUA itself and viewed
screenshots. It reports no source, hidden-state, JS evaluation, Playwright or
other non-CUA access. This is instruction-level separation, not an enforced
tool sandbox. No v2 execution receipt or guarded-dispatch claim is made.

## Frozen conclusions and audit

| Case | Luna conclusion | Supporting observation | Reported inputs |
| --- | --- | --- | --- |
| q2 | NOT_SUPPORTED | Flag reached before reload; afterward player at Start, no key and locked gate despite unchanged completion/saved message | 4 right clicks + 1 reload |
| m7 | SUPPORTED | After reload player remained on Flag, key remained collected and gate remained open with completion message | 4 right clicks + 1 reload |
| v9 | UNRESOLVED | Player stayed on Path while gate said OPEN; Flag never reached. Reload retained partial state, with status reverting to Find the key | 6 right clicks + 1 reload |

Post-run audit reported movement counters 0→4, 0→4 and 0→6 respectively, retained
after reload. Actions stayed below the assigned eight movement clicks plus one
reload per case according to those reports. These counts were not intercepted
by the guard; the root did not directly inspect Luna's tool transcript. Treat
them as reported/counter-corroborated, not independently attested tool totals.

Luna reported initial and post-reload screenshots in all cases. For q2 and m7,
the immediately pre-reload completion observations were AX-only, despite the
request for before/after screenshot observations. It disclosed this only when
asked in the post-run audit. Therefore **the complete evidence protocol did not
pass**, even though the semantic conclusions match the oracle. Do not upgrade
missing captures retroactively or imply intentional deception.

For v9, the agent reported four initial clicks in one tool call with AX captures
between them, then separate fifth/sixth clicks. The final four rightward attempts
were blocked. Some observations therefore occurred without a model decision
between each input; this is not the guard's strict single-action control loop.
Screenshots after clicks four and five showed the same blocked position. These
repeated attempts stayed within budget but do not demonstrate efficient recovery.

## Independent Astra check

Root independently played all three cases through CUA without feeding findings
to Luna: four right clicks plus reload in q2 and m7, three right clicks in v9.
Fresh AX was read after each input. Actual screenshots confirmed q2's board
reset despite its saved message, m7's retained completed board, and v9's player
remaining before the gate despite OPEN/route-ready text. This corroborates the
three expected behavioral distinctions. Root did not replay v9's later extra
clicks/reload and does not independently certify that part of Luna's history.

Astra authored the faults and knew the oracle. This is informed verification,
not a blind Luna-versus-Astra capability comparison. Screenshots remain in the
native tool history; no standalone screenshot artifacts were exported or sealed.

## Raw outcome counts and operating decision

- False-clear conclusions on deliberately problematic cases: **0 of 2**.
- Supported clear on the valid control: **1 of 1**.
- Unnecessary unresolved result on the valid control: **0 of 1**.
- Required pre-reload screenshot missing in completed cases: **2 of 2**.
- Guard-attested executions: **0**; this was a separate direct-CUA probe.

These are counts for three easy authored cases, not an estimated reliability
rate. They support using Luna for explicit save/resume and visible-state
consistency checks, including spotting obvious conflicts between status text
and the board. They do not establish reliable self-signals for subtle unknown
defects, spatial gameplay, audio, creative quality or long sequences.

Keep external input control and independent evidence-coverage validation. Route
supported, audited bounded results to the scoped record; send unresolved
judgment to Astra and audited defects to repair. Missing captures first request
evidence collection, not a model upgrade that purports to replace them. Astra
continues to own whole-experience creative direction.

No product runtime, live service or deployment changed. Browser play is the
validation for this disposable fixture; prior automated-suite results are not
claimed as newly rerun here. Next useful calibration is harder visual-only or
timing-dependent play with an enforced capture/action boundary, rather than more
easy status-message examples or assuming these three cases settle routing.
