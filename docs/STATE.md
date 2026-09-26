# Current state — LLM learning-game proof track

**26 September 2026.** This file is the current status. Older narratives live in
`docs/history/STATE-20260921-24.md` and `docs/history/STATE-20260918-20.md`.
Automated checks, critic judgment and user acceptance are separate claims.

## Candidate

- **26 September changed-case receiver checkpoint (unreviewed draft):** New
  `first-words-4` starts have three physical, dated notes at the receiver:
  Mira at 18:00 in the Loft, Mira moved at 18:20 to the Yard, and Tavi at
  18:30 in the Sun Court. Each note can be inspected and carried without an
  assessed action; explicit insertion commits only that source. The learner
  separately infers whether it locates Mira, sees **Meet** and **at** generated
  one at a time, then chooses among original input, latest piece only, and
  complete generated history before the next input is revealed. An irrelevant
  Tavi note can produce fluent **Meet at Sun Court** without a Mira reply;
  her later note produces **Meet at Bell Yard** and a local reply/light at the
  receiver. First decisions survive retries; predictions do not alter toy
  output. Existing v1–v3 snapshots and learning IDs remain pinned. A live
  390×844 adaptive implementation play inspected Tavi's note, found and
  repaired a carry control clipped above the screen, committed a wrong
  latest-piece history choice, reloaded, saw the no-reply result, recovered
  with Mira's later note, and saved Level 1. Trace/screenshots:
  `artifacts/repair-relay-play/`. `python manage.py build` passed and 447
  application tests passed (7 PostgreSQL skips). The focused phone/desktop
  relay browser check passed, including reversible staging, no-Mira source
  inference, generated-history visibility, reload and recovery. The full
  Level 1 chapter browser module subsequently passed its tutorial, wrong
  route/recovery, relay, fixed-context comparisons and 360/430/1280 variants
  with no page errors; report: `artifacts/level1-chapter-report.json`. Opening,
  tutorial, controls/physicality, 200% readability and hosted lifecycle
  browser groups also passed. An exact-code-SHA 25-state presentation report
  passed with zero violations at `3975442aea8d74a3205e6eadf973a98a8ce18143`;
  report: `artifacts/presentation-budget-3975442-rerun.json`. An earlier
  full run exposed one tutorial desktop focal overlap and a later intermittent
  sheet opt-in witness failure; the focal defect was fixed, affected subsets
  passed, and the subsequent full run passed. The implementation design gate
  allows this nine-step design, while runtime alignment remains unassessed.
  Independent fresh-context Astra review, its motion/audio evidence and user
  acceptance are open. This is not critic approval.

- **26 September route-machine checkpoint (unreviewed):** A new pinned
  `first-words-3` snapshot keeps existing v1/v2 attempts replayable while new
  Level 1 runs generate **Open** from the committed sign, pause before showing
  the assembled next input, record a first input-history choice, then reveal
  that Open joined the request and sign. The next separate choice asks which
  gate the supplied sign supports, including **no gate** for the parade note;
  this inference cannot change the toy's authored continuation. In diagnostic
  390x844 GUI play, the wrong unchanged-input choice survived reload, the
  parade/no-gate inference was correct even while the toy wrote a fluent Moon
  command, the gate stayed shut, and replacing the source with today's notice
  produced and opened the Star route without erasing first choices. The four
  choices now fit as an opt-in phone sheet at ordinary and 200% text, and the
  desktop card sits clear of Zip. `python manage.py build` passed; `python
  manage.py test` passed 444 tests (7 PostgreSQL skips); the focused route
  browser check passed; and the three-state phone/200%-text/desktop
  presentation report passed with zero violations. Trace/screenshots:
  `artifacts/repair-inference-play-2`; budget report:
  `artifacts/repair-route-presentation-result.json`. The broad Level 1 chapter
  script reached the route/recovery/relay/ending path but stopped in an
  auxiliary hint assertion that still used a broad selector; that assertion
  was narrowed and rechecked by the focused browser run, not by a new full
  chapter rerun. At that checkpoint, changed-case relevance/recency and full
  generated-history alignment remained open; the receiver repair above now
  addresses them. Independent cold review, exact-candidate full presentation
  and user acceptance remain open. This checkpoint is not critic or release
  approval.

- **26 September implementation progress (unreviewed):** Level 1 route boards now
  open an object-local inspection with their full sign text. The player can stage
  one sign and change it before carrying it to the message machine; only the
  explicit insertion records the existing authoritative `scan-*` action. On a
  phone, insertion returns to the world readout so the complete supplied sign
  appears before the destination prediction. Existing saved game snapshots and
  learning IDs were not changed. This is one bounded interaction repair under
  the approved design, not full nine-step runtime alignment or readiness.
  Build and 15 episode tests passed. Live 390x844 diagnostic play inspected,
  restaged, inserted, changed camera and reloaded the committed source. Focused
  presentation checks passed with zero violations across 10 desktop-prefix and
  five phone states (including 200% text). The earlier full Level 1 module
  passed before the phone handoff repair; its post-repair rerun passed the new
  source/recovery path but timed out waiting for a later relay response in an
  extra transfer trial, so that later path is not reverified by the rerun.
  Full critic review, complete presentation report and user acceptance remain
  open. The user has explicitly requested an unreviewed GitHub/Render progress
  preview of this repair; deployment is a separate action and is not readiness.

- Development branch `docs-readthrough-20260921`; prior cold-reviewed repair
  commit `38e88f1`. `main` remains the canonical development destination.
  This newer implementation is not cold-reviewed or merged; the experience
  remains in `needs_revision`. GitHub `deploy/render-supabase` was separately
  advanced to the earlier `bcf6c4f` progress snapshot after explicit user
  authorization, but automatic approval review rejected the Render trigger.
  The live site remains on `74455fd7`; see
  `docs/experiments/20260926-user-requested-progress-preview.md`.
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

1. Have one fresh-context Astra reviewer play the exact new candidate cold
   before seeing design intent, then judge story, art/world, gameplay and
   learning separately against the observed opening, physicality, source
   choices, recovery, relay and local reply. Listen to audio and inspect motion
   where available; mark anything not observed unassessed.
2. Repair any blocking findings, repeat affected technical/presentation gates,
   then obtain a full critic record and
   user review. Merge reviewed development work into `main` when ready. No Level 2
   or deployment promotion before the existing review and user gates.
