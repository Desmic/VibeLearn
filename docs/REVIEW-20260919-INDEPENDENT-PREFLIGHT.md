# Independent review execution — 19 September 2026

Candidate: `471de882a01690fa50ac39455ad603fffd39cfdc`.
Technical run: `35440122451`; sealed bundle: `10583163540`.

## Context isolation

The desktop no-history subagent route still inherits repository instructions.
A separate local Codex CLI invocation provides a bounded alternative for
evidence-only reviews. The startup audit reported no repository instructions,
product/story design, prior conversation, user diagnosis or reviewer scores.
Generic agent, tool and skill descriptions remain in context.

The audited invocation uses read-only permissions, an ephemeral session,
`--ignore-user-config`, `--disable memories`, and `project_doc_max_bytes=0`.
It retains the user's configured model, `gpt-6-astra`, and restores only the
configured authentication settings: `cli_auth_credentials_store=keyring` and
`forced_login_method=chatgpt`. Omitting the credential-store setting caused the
initial preflight to fail with HTTP 401 before any review. No new credentials,
live product service, or Terminal PM integration were created.

These controls are documented in the [official non-interactive-mode guide](https://learn.chatgpt.com/docs/non-interactive-mode)
and [configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference).
Their presence alone is not proof of independence: each reviewer also audits
startup context before reading its capsule, and the harness checks recorded
accesses. Read-only sandboxing is not a per-capsule filesystem read allowlist.

All six materialized capsules passed evidence size/digest/allowlist validation.
The exact assignments remain unchanged. No motion or audio listening gate is
claimed from static images or textual traces.

## Learning review

The fresh learning reviewer read only the three capsule metadata files and its
three enumerated evidence files. Raw result, harness receipt and access audit
are stored under `reviews/results/471de882a01690fa50ac39455ad603fffd39cfdc/`.
The normal ingestion pipeline accepted the result with verdict **unresolved**.

Observed: stale context yields Moon; current context yields Star even while
the recorded learner prediction remains Moon. This supports the bounded claim
that prediction does not directly determine output on that recorded path.

Unobserved: intermediate word-generation states, controlled hint effects,
fixed-context prediction interventions, assessment records, and sufficient
evidence to distinguish conceptual transfer from trial-and-error clue selection.

Informed follow-up, separate from the independent review: the existing server
assessment explicitly keeps mastery unknown and records transfer observations
separately. Unit coverage exists, but that assessment evidence was absent from
the critic capsule. Do not infer a scoring defect solely from this omission.

## Next bounded evidence repair

The independent physicality pass is also **unresolved**. It inspected the trace
and four explicitly attached, allowlisted screenshots. The initial physicality
execution was not ingested because its JSONL output did not record image-view
calls; the repeat used explicit attachments so image delivery is auditable.
No prior review output was given to the repeat reviewer.

The repeated endpoint supports blocking at one prop approach; a single view
does not establish agreement between collision and visible geometry. No definite
collision defect was observed. Wall contact, closed-versus-open gate traversal,
and camera clipping between still frames are not established by this packet.

Add synchronized motion/position evidence for multi-angle prop contact, walls,
the same gate threshold before and after opening, and continuous orbit/zoom near
solid geometry. Derive targets and geometry from world specifications; keep
the probes usable across differently laid-out games. Actual browser play and
motion inspection must accompany these captures.

Export the target concept and scope from the pinned learning package, intermediate
authoritative generation states, controlled hint/prediction comparisons, and
the final server assessment alongside completion. Preserve first predictions,
assistance history and unknown mastery. Distinguish gameplay completion from
learning evidence in the review packet, just as in the application contract.

Any changed evidence contract needs regenerated assignment identities and fresh
review. Do not edit sealed files or relabel this unresolved result as a pass.
Runtime changes require a demonstrated defect; evidence gaps justify improving
the observation harness before changing game rules.

Both raw results and their receipts passed `tools.ingest_critic_results`.
Validated here means structurally accepted for the exact assignment, not a
passing product verdict. Cold observation, motion, audio and handoff criticism
remain outstanding; cinematic causality/intent comparison still depend on cold
observation. The candidate remains unapproved and undeployed.
