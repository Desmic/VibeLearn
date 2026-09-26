# Current state — LLM learning-game proof track

**26 September 2026.** This file is the current status. Older narratives live in
`docs/history/STATE-20260921-24.md` and `docs/history/STATE-20260918-20.md`.
Automated checks, critic judgment and user acceptance are separate claims.

## Candidate

- Development branch `docs-readthrough-20260921`; frozen repair commit `38e88f1`.
  `main` remains the canonical development destination. The development branch
  is pushed but has not been merged; the experience candidate
  remains in `needs_revision`. `deploy/render-supabase` remains pinned separately.
- The candidate repairs the cold critic's missing tutorial input/history with a
  carried, world-anchored readout; adds a reachable Level 1 speech station;
  makes its action visibly say OPEN ENGINE; and compacts phone markers without
  shortening the learning clues. The optional panel remains available.
- The system now enforces a visible learning carrier before the next action,
  checks its presence on narrow and desktop states, measures touch-control and
  informational coverage separately, and refuses a prose-only budget raise.
  The play harness re-applies and verifies viewport size on every step, persists
  resize, bounds its frame probe, records browser ownership and verifies cleanup.
- A fresh-context Astra completed an unprimed 390x844 GUI playthrough on frozen
  `38e88f1`, then a separate design-intent/Breath-of-the-Wild calibration report.
  It rated the candidate `needs_revision`; neither report is a readiness approval.
- Commit `d088c1b` changed the learning design without updating its prototype
  review. That stale record is archived at
  `design/reviews/20260926-stale-prototype.json`. The current nine-step design
  was revised against the cold/warm findings and independently approved for
  **implementation** at digest `9b1ba9a9d80c4be1c73a984b3a522181c366f6d21cbc0fa1a5d8171a8bd7d2b5`.
  `design/review.json` is current; `python manage.py design-gate --stage
  implementation --review design/review.json` passes. Runtime alignment remains
  unassessed. A new `implementation` design gate and independent CI job prevent a
  prototype-only or stale review from authorizing the full journey while
  technical tests remain runnable.

## Evidence on or leading to this candidate

| Claim | Status |
| --- | --- |
| Build and design structure | `python manage.py build` passed in a clean worktree at frozen `38e88f1`; learning-design quality and runtime alignment remain unassessed by that structural command. |
| Revised learning design | The full implementation-stage review passes for the current design digest, not the older game. It specifies world source acquisition, explicit inspect/stage/commit, a no-gate inference for irrelevant route text, and a changed case separating relevance/recency and complete generated history. The existing runtime has not been aligned or replayed against this design. |
| Application tests | 440 tests passed with 7 PostgreSQL skips in a clean worktree at frozen `38e88f1`; the skipped tests need a real disposable PostgreSQL URL. |
| Active browser groups | All six groups passed sequentially on the code that became `38e88f1`: opening, tutorial, controls/physicality, chapter, 200% readability and hosted lifecycle. A transient tutorial reload heading required a bounded 30-second wait; the saved LOOK step then appeared and passed. |
| Presentation budget | The required full 25-state `--candidate 38e88f1` report passed with zero violations in a clean worktree. Tutorial phone: 19.3% total, 13.6% informational; Level 1 first decision phone: 19.2% total, 13.6% informational, all 3 route carriers visible. Report: `artifacts/verify-96/artifacts/presentation-budget-38e88f1.json`. |
| CPU/GPU review | Direct3D 11 identified the Intel UHD GPU and measured about 2.2 CPU cores plus 36% GPU on a 390px active scene. Bounded SwiftShader comparison used about 8.3 CPU cores and 0% measured GPU; its WebGL renderer query did not complete, so these are workload samples rather than a same-frame benchmark. The GPU switch improves responsiveness but moves work to the GPU; the self-ending frame probe and reliable process cleanup remove avoidable work/leaks. |
| Browser harness integrity | A real `start` said 390x844 while a later `step` saw 484px wide. Reapply-on-step repair was verified across separate commands: 390x844, then 360x800 after resize, still 360x800 on the next connection. A direct Windows `start` sometimes stalls at CDP; an empty PowerShell pipeline has launched it, and failed starts are now cleaned up. This host-specific launch gap is not resolved. |
| Experience review | One prior fresh-context Astra pass rated pre-repair `96f7d81` needs revision. A prior focused repair replay and retry hit usage limits before judgment; the owned browser was stopped. The new fresh-context Astra completed tutorial and Level 1 on exact `38e88f1` through GUI clicks, movement and camera drag. Its immutable cold report (`artifacts/verify-96/artifacts/cold-gui-world-retry/COLD-REPORT.md`) and separate warm report (`WARM-COMPARISON.md`) find a clear but mostly stationary panel-driven game, weakly discriminating transfer, crowded phone focal hierarchy and muted ending. Scores: story 6, art/world 6, gameplay 6, observed controls 7, tutorial 7, chapter/agency 5, learning 5, phone presentation 4; physicality, continuous prologue motion and audio unassessed. This is a `needs_revision` review, not schema-v2 readiness. Native window attachment failed, so the reviewer used the documented live browser harness with inspected 390x844 PNGs and a preserved action trace; session stopped. |
| User acceptance | Not yet obtained; the user's earlier rejection remains the final human verdict. |

## Next gate

1. Implement one coherent world-centered interaction repair under the approved
   design, retaining existing saves/learning evidence identities and keeping the
   first success before Level 1. The design approval is permission to prototype,
   not a verdict that the current runtime meets it.
2. Re-freeze, then replay the demonstrated panel/agency/transfer/ending blockers on a new exact
   candidate. Cover the still-unobserved opening, physicality, recovery and devices.
3. Repeat affected technical/presentation gates, obtain a full critic record and
   user review. Merge reviewed development work into `main` when ready. No Level 2
   or deployment promotion before the existing review and user gates.
