# Game acceptance — the user's verdict is final

**15 September 2026.** The active contract is [CRITIC-POLICY.md](CRITIC-POLICY.md).

## Current verdict

Deployed candidate `337db573d87c417aca42f55894a2c6e807df21ed` is **needs_revision** after the user's qualitative concerns and the observed seven-signal playthrough. No new numeric user rating or acceptance was supplied. Historical predecessor rating 3/10 and agent treatment/game scores stay attached to their historical scope.

## Readiness and acceptance are separate

- Design review can support building a prototype; it cannot pass rendered story quality.
- Inspect rendered story, first touch, the whole chapter and learning/transfer on one exact candidate. Do not stop reviewing later play merely because the opening fails.
- An internal ready_for_user_review recommendation requires every policy criterion >=9, no blocker, complete required evidence and applicable technical verification. No rounding, weighted average or historical carry-forward.
- The current user may request and inspect a draft at any time, including below 9. Label it a preview with failures disclosed. This is not a ready recommendation or deployment authorization.
- **Only the current user's explicit verdict establishes user acceptance.** They are currently the sole human product critic. Their rejection overrides internal readiness; their acceptance does not manufacture missing technical evidence or authorize later phases.

CI checks, source hashes and the review-record checker do not judge appeal or comprehension. Runtime integrity, server authority, immutable evidence, authentication, allowlists, isolation and applicable storage/browser checks remain separate requirements.

No production change is made by this policy revision. The old review-deployment exception is superseded by the explicit preview/readiness/acceptance distinction above. Private Phase 1 remains the scope; no new model service, paid resource, external testers or public rollout.

Historical contract: [history/20260914-GAME-ACCEPTANCE-9.md](history/20260914-GAME-ACCEPTANCE-9.md).
