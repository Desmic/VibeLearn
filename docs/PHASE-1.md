# First slice completion report — 6 September 2026


## 10 September 2026 current refinement — story is now its own product gate

The sections below preserve Phase 1 implementation history, including the older Shopping Agent campaign and its historical critic scores. They are **not the current acceptance state**. Read `STATE.md` first.

The current user rejected the previous Relay Rescue first-touch/story at **3/10** despite an earlier internal game critic pass. The direct feedback is authoritative: the sequence had no Back control, advanced too quickly, told the story lazily/unclearly, and did not create enough attachment or forward pull for kids/young adults. This changes the design architecture rather than merely the animation timing.

The active refinement therefore separates the gates: `course topic/outcomes -> story/fantasy -> story critic >=9 -> gameplay realization -> game critic >=9 -> learning/transfer gate -> user review`. Today the story is generated from the topic/outcomes only; learner creative preferences are not implemented. A future explicit `StoryPreferenceProfile` may influence genre/tone/world/visual direction without changing learning/evidence semantics.

The replacement story candidate is **Relay Rescue: The Echo Forge**. It treats the opening as one continuous world: Pip's bridge breaks; exactly one gear is needed; Pip sends sealed `order-01` to the Echo Forge; the Forge spends a scarce emergency ember and makes the gear; lightning destroys only the reply; Pip is tempted to send a fresh seal that the Forge could treat as another job; the player awakens as Signal Keeper and is asked to discover the truth before another ember is wasted. Formal retry terminology remains deferred until the concrete model exists.

First-touch UX is now a hard gate: user-paced progression by default, Back/previous, Continue, Pause/Resume for active motion, Skip, replay, visible story position, coherent backward/forward world state, and the same causal meaning under reduced motion. A slower slide deck is still a failure. Important candidates explicitly compare 2D, 2.5D and Three.js 3D realization; 3D may earn its cost through immersion/world attachment/environmental storytelling, never by technology alone.

A story-only critic evaluates exactly one frozen story and ignores code/tests/rendering/curriculum value. `docs/STORY-GENERATION-AND-CRITIC.md` contains the rubric and blockers. The current Echo Forge treatment has a separate internal-tool-assisted story pre-gate record in `docs/CURRENT-STORY-CRITIC.md`; that score does not override the user's 3/10 verdict on the deployed predecessor and does not by itself certify the rendered game.

The current implementation work realizes Echo Forge as a reversible, user-paced story player with a locally pinned Three.js scene plus semantic/CSS fallback, then carries the same vocabulary into Signal 1. Exact runtime CI/deployment evidence belongs in `STATE.md` after the candidate is verified and manually deployed.

## Outcome and stopping point

Phase 0 → 1A → 1B → 1C implemented in verified increments. The original first slice
was one persisted reliable-agent practice episode with LEARN/PAIR/BUILD, deterministic
trace prediction, written diagnosis, save/resume, progressive hints, submission,
evidence/checkpoints, a future review need, and bounded practice XP.

The original local Phase 1 checkpoint remains historically valid. Since then a private
Render Free + Supabase Free pilot and several learner-driven product refinements have
been added without implementing Phase 2+ subsystems.

Version 0.1.0, local schema 5. Historical local checkpoint source SHA-256:

`3d17fdd657ca522f38fd8a733a56a7ddca382513b39e04b3266a39e9afb56786`

The supplied checksummed design package remains preserved as historical input.

## Observed local verification

Historical local environment: Windows PowerShell; Python 3.13.5; SQLite 3.49.1;
Node 22.17.0; Playwright 1.53.0; Chromium 138.0.7204.23.

| Gate | Observed result |
|---|---|
| Reproducible build | Python compilation + JavaScript syntax passed |
| Core suite | 31 unit/integration tests passed at the original checkpoint |
| Browser suite | 10 real browser scenarios passed; no page errors |
| Persistence | committed write/read, reconnect, rollback, save/reload/restart passed |
| Concurrency/retry | duplicate and concurrent operations did not duplicate evidence/reward |
| Failure recovery | stopped server/evaluator/storage failure retained honest state |
| Learning boundaries | unknown != failure; pre-help checkpoints distinct from assisted submission |
| Identity | scoped commands and separate browser contexts prevented cross-learner access |
| UI | keyboard, 390px viewport and 200% text enlargement passed |

Historical artifacts include build/test/browser reports and screenshots under
`artifacts/`.

## Hosted Phase 1 extension — 7–8 September 2026

The hosted pilot keeps the Phase 1 learning contracts while replacing local-only
identity/storage with Supabase Auth and restricted PostgreSQL persistence.

Machine-verified hosted state:

- Supabase migrations documented in `db/hosted-hardening.sql` are applied.
- `vibelearn` is a private PostgreSQL schema; `anon` and `authenticated` have no schema
  USAGE or application-table grants.
- Runtime uses `vibelearn_login` -> `vibelearn_app`; learner tables use forced RLS.
- Live SQL boundary verification passed learner isolation, composite ownership,
  immutable submissions/history, reward deduplication, JSON lookup, and denied
  unscoped reads.
- Render serves the application and health/config/static paths successfully.
- GitHub Actions `Verify hosted pilot` covers build, Python tests, disposable
  PostgreSQL application tests, Chromium install and the browser journey.
- A consolidated hosted acceptance test walks login -> start -> save -> recreated app
  -> resume -> hint/mode/source -> submit -> evidence/review/XP -> logout/replayed-
  cookie rejection. A separate two-authorized-learner test covers isolation.

Observed live learner evidence:

- password recovery and real hosted login succeeded;
- real hosted learner/session rows and submitted attempts exist;
- two real submitted attempts produced two evidence rows, one review need and exactly
  one 10-XP family reward;
- a real Render process replacement was followed by the same browser successfully
  reopening its hosted application session;
- real sign-out returned HTTP 200 and the learner observed the signed-out UI;
- the earlier raw `signal is aborted without reason` login message was traced to a
  client transport/timeout presentation issue, not credential failure, and was fixed.

Still not claimed live:

- explicit unfinished **Save progress -> page reload -> PostgreSQL resume** on the
  hosted site;
- second-authorized-account isolation using a second real Supabase account.

## Learner-driven game refinement — 8 September 2026

The learner first rejected a polished website-like experience and asked for a genuine
game feel. The resulting HUD-first campaign replaced permanent website rails with a
top HUD, bottom mission-tool dock, direct outcome decisions, real sequential mission
locks, XP/progression separation, state-driven animation and a Tutorial -> Easy ->
Medium -> Boss curve.

That HUD-shell candidate passed its then-current critic at 8.8/10, but later learner
playtesting found three important product defects. The old 8.8 score is therefore
historical and is **not** treated as acceptance of the later course-comprehension
requirements.

### Feedback defect 1 — the course objective/material was not clear enough

The learner requested campaigns built around compelling fantasy or real-life scenarios,
with simple causal animation, so that even a middle/high-school learner can understand
what is happening before decoding specialist language.

The then-current retry campaign became a story-first activity revision using a concrete
Shopping Agent premise: the learner asks an agent to buy one 5 kg dumbbell; the purchase
succeeds; the receipt/acknowledgement disappears; the agent may retry. Each mission had
a plain-language objective plus explicit causal story beats before the technical request
IDs/retention details were exposed. This is retained as history, not the current story.

The four-level structure taught the same pinned retry mechanism through:

1. **Tutorial — The missing receipt:** can the retry still leave exactly one charge?
2. **Easy — A new ticket, a second charge:** why can a fresh request identity look like
   a new purchase even when the human intent is unchanged?
3. **Medium — The store forgot:** what happens when the same purchase identity arrives
   after the store's memory/retention window expires?
4. **Boss — Shopping Agent incident:** combine identity, payload binding, retention and
   late uncertainty into the full retry contract.

Campaign activities were revised rather than mutating old submitted snapshots; the
underlying deterministic trace policy stays pinned and historical evidence keeps its
original activity meaning.

### Feedback defect 2 — help status was semantically wrong

The learner observed that `Not declared` and/or prior exposure could appear as
`assisted`, which incorrectly claimed current help use.

The evidence interpretation now distinguishes:

- `unknown`: no external-help declaration and no current observed in-game aid;
- `declared_independent`: explicit no-external-help declaration with no current aid;
- `assisted`: current hint/source/worked-example use or explicit external-help
  declaration;
- `previously_exposed`: prior family feedback/exposure without claiming current help.

Prior exposure can still limit an independence/freshness claim, but it is no longer
mislabeled as current-attempt assistance. Tests explicitly cover unknown, declared
independent, actual assisted and replay exposure semantics.

### Feedback defect 3 — campaign selection after a clear was unexpected

After clearing a level, the campaign used to retain the previously selected mission,
which could make Level 1/old content look selected even though a new level had unlocked.

The current rule is:

- correct clear -> focus/select the **highest newly unlocked mission**;
- failed clear -> keep the current mission as the predictable retry target;
- fully cleared chapter -> keep the highest completed node selected.

The real Chromium journey asserts this behavior after Level 1, Level 2, Level 3 and the
boss.

## Historical 8 September shopping-story verification and critic gate

The then-current shopping-story candidate passed GitHub Actions `Verify hosted pilot` run 148
(`34222243777`). The gate included:

- build success;
- **59 Python/hosted/PostgreSQL tests passed**;
- full Chromium campaign journey passed with no page errors;
- concrete shopping story + plain chapter objective;
- causal story beats and reduced-motion equivalent;
- server-enforced mission locks;
- unknown / declared-independent / assisted evidence semantics;
- automatic next-level focus;
- HUD save -> reload resume;
- actual process restart persistence;
- Level 3 source/help recording;
- boss lost-acknowledgement retry without duplicate evidence/XP;
- keyboard use, 390px viewport, 200% text enlargement, separate learner context and
  reduced motion.

A story/comprehension-aware review on that historical candidate scored **9.1/10** under the then-active 8.0 threshold. This result was later superseded by stricter >=9 story/game gates and direct user rejection; it is not a current readiness signal.

## Course-generation implications

This feedback is now part of the system design, not a one-off lesson note.

`docs/STORY-GENERATION-AND-CRITIC.md`, `docs/COURSE-GENERATION-GAME-SYSTEM.md`, `docs/GAME-UX-SYSTEM.md`, `docs/GAME-UX-REVIEW.md`, `AGENTS.md`, and the **root** `CODEX-IMPLEMENTATION-PLAN.md` carry the current requirements. When Phase 3 is opened, generated modules must produce a playable teaching system rather than lesson prose poured into a generic UI.

Generation now requires:

- a versioned story/fantasy/world treatment generated from topic/outcomes today;
- a separate single-story critic >=9.0 before gameplay realization;
- future learner story preferences only through an explicit later capability, never inferred today;
- first-touch Back/Continue/Pause/Skip/Replay/progress and coherent reversible story state;
- a deliberate 2D vs 2.5D vs Three.js 3D realization decision;
- a plain-language chapter goal understandable before specialist jargon;
- causal story/visual beats whose motion explains the mechanism rather than decorating it;
- an explicit bridge from intuitive model to formal terminology;
- a confidence curve with early wins and genuine later reasoning difficulty;
- direct subject-appropriate interaction mechanics;
- HUD/tool progression and predictable route focus;
- honest help/prior-exposure semantics;
- game rewards separated from evidence/mastery;
- generated browser/storage/integrity invariants;
- structural/learning, grounding/content, accessibility and game-experience review gates;
- game critic >=9.0 with no blocker, plus the applicable learning/transfer gate, before a candidate can be called ready for user review. The user still decides acceptance.

The checksummed `learning-os-design-package-v1.3/` is preserved as historical input;
the active root implementation plan carries the amendment rather than silently
rewriting the archived package.

## Phase 1 completion gate

Phase 1 implementation history above includes the original slice and older hosted refinements. The current Echo Forge refinement is governed by the 10 September checkpoint and by `STATE.md`; do not infer current acceptance from the older completion language.

Real hosted/product acceptance status still distinguishes machine verification, critic gates, human product acceptance, and activation. Only after the remaining hosted checks and explicit user acceptance are closed should PR #1 leave draft. Phase 2 remains deliberately gated.

## Assessment, capability and product limits

Only pinned trace outcomes receive deterministic scoring. Written architecture reasoning
is retained and remains ungraded unless a later validated assessment path is introduced.
Missing/invalid/evaluator-unavailable remains distinct from incorrect. Partial evidence
is provisional and cannot establish mastery/skip eligibility.

Help semantics are evidence semantics, not game punishment. Later hints/source exposure
do not rewrite earlier checkpoints. Switching play style cannot erase observed help.
Prior feedback exposure is recorded separately from current-attempt help. XP is bounded
practice/game progression only and is never consumed by assessment, mastery or review
scheduling.

Retrieval targets the canonical frame/competency and still requires a fresh activity.
There is no scheduler notification, full knowledge-map UI, course replacement/export,
adaptive course generator or untrusted-code runner in Phase 1.

## Persistence, restart and recovery

Local SQLite migrations remain forward-only and transactional. Hosted PostgreSQL uses
the private `vibelearn` schema, restricted roles, forced RLS, ownership-preserving
foreign keys and immutable-history triggers. Device-local browser recovery remains
supplementary; hosted state is attached to the verified Supabase/application session.

Do not use destructive migration-history deletion or learner-table deletion as rollback.
Keep known-compatible code revisions and independent backups.

## Separate gates

**Historical machine verification:** run 148 / 59 tests + its Chromium journey belonged to the older shopping-story candidate.

**Historical critic:** 9.1/10 under the former rubric; superseded.

**Current story verdict:** user 3/10 on the predecessor opening; `needs_revision` until the new story/game candidate passes its separate gates and the user reviews it.

**Activation:** private hosted pilot only; broader/public multi-user activation is not claimed.

Current next product increment: verify and deploy the Echo Forge story/game realization, run the story/game gates on exact evidence, then return it to the user only if the critic pre-gates pass. Phase 2 remains closed.
