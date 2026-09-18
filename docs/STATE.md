# Current state — LLM learning-game proof track

## Automation integration direction — 18 September 2026

The user has now approved a **bounded merge of the existing Terminal PM Agent/orchestrator into VibeLearn** to turn the project into a highly automated development and game-generation system. `docs/AUTOMATED-DEVELOPMENT-SYSTEM.md` is the owning architecture/handoff.

This supersedes older text that treated orchestration only as indefinite future work, but it does not authorize a wholesale donor-repo transplant, a fleet of permanent specialist agents, autonomous production deployment, or Level 2 work. Start with a thin real VibeLearn slice: economical worker -> independent reviewer with implicit falsification/proof -> evidence -> accept/repair, then add outcome/incident learning. Reuse Terminal PM execution/session/evidence/recovery ideas selectively and increase complexity only for an obvious invariant or evidence from real runs.

The current Phase 1 runtime/review identity and user-acceptance gate below are unchanged by this architecture documentation.


## Exact Phase 1 review checkpoint — 18 September 2026

Canonical development branch remains `main`. The reviewed **runtime candidate**
is `ad14c5aced6cf053c7617dfb03245506e1e9dad5`; later commits that only add/update review documentation do
not change that runtime identity.

Exact GitHub Actions run `35335042617` passed all seven active suites. Exact
artifact review covers Bellweather entry, friendship ritual, completed
rupture/disappearance, limbo, progressive prison reveal, Warden speech theft,
MOVE/LOOK/MENU control practice, speech-repair tutorial, alternate orbit/zoom,
stale-context failure/recovery, and phone + desktop final payoff.

Current internal product gates on that exact runtime:
- story/rendered narrative 9/10;
- art/world direction 9/10;
- gameplay/progression 9/10;
- learning/transfer 9/10;
- technical/accessibility passed.

The strict overall status remains **review incomplete** because subjective
music/SFX listening is unavailable in this execution environment. Automated
audio lifecycle/mute semantics pass, but code/metrics are not a substitute for
listening. Physical-device feel also remains distinct from Chromium emulation.

The current user has **not yet accepted this revised candidate**. The September
17 needs-revision verdict belongs to the older reviewed build and remains useful
historical evidence, not a verdict on `ad14c5aced6cf053c7617dfb03245506e1e9dad5`.

Exact review records:
- `docs/LEVEL1-FINAL-CRITIC-20260918-ad14c5a.md`
- `docs/reviews/2026-09-18-level1-ad14c5a.json`

Do not start Level 2, claim Phase 1 acceptance, or transfer these scores to a
different runtime SHA. Render remains intentionally pinned until the current
release/review gate is satisfied.


## Phase 1 review checkpoint — 18 September 2026

Canonical branch remains `main`. Current exact candidate is
`1b2fe12e0c0786b0fa0f51d6a4f3291fb16d4ddc`; CI/artifact review is pending,
so it is not an accepted or deployable candidate yet.

Recent critic-driven repairs are intentionally reusable:
- fresh control practice is separate from speech repair and has MOVE/LOOK/MENU
  screenshot evidence on phone and desktop;
- prologue friendship and speech-theft framing were tightened after exact-CI
  screenshot inspection;
- the shared gate kit no longer uses an oversized torus that visually blocked
  an opened route; a regression test guards the open-portal shape;
- the controls gate now preserves orbit and zoom screenshots before recentering
  for the independent art/world-direction pass.

The latest unresolved gate is exact-SHA verification of the whole Phase 1 path:
prologue -> control/core-loop tutorial -> clean success -> Level 1 mission ->
recoverable wrong route -> corrected transfer -> visible world payoff. Do not
advance Level 2, deploy to Render, or assign inherited 9+ scores before that
candidate's complete evidence and critic pass.


## Friendship/reveal checkpoint — 18 September 2026

On `main`, the next prologue chunk is implemented and verified: the player sends
up a shared three-light lantern, companions have distinct teal/round and
coral/tall silhouettes, and the prison is revealed in timed groups. Pausing the
reveal exposed stray later-mission scenery; that was repaired. Phone play exposed
a lantern/caption overlap; it was repaired and now has a projection-clearance
regression check. Opening package v3, world package v4. Names remain provisional.

Build, 152 application tests (seven skips), opening checks and post-save controls
passed. Final opening evidence: `artifacts/prologue-friendship-clearance.log`.
Manual play covered desktop, 390 animated, 360/430 reduced motion, pause/resume,
scene replay and preserved saved tutorial output. No production deployment.

The narrowly defined friendship/reveal slice is closed; this is not an overall
9+ recommendation or user acceptance. Next chunk: inspect the separate tutorial
handoff on a fresh disposable save, especially movement/look/interact guidance
before the speech repair. Do not extend Level 1 or later levels ahead of that gate.
Subjective audio mix, physical devices and novice engagement remain unverified.

The earlier repair notes below are historical where this checkpoint supersedes
their unresolved friendship/reveal findings.

## Local repair checkpoint — 18 September 2026

Continue on canonical `main`. The existing prologue/entry repair was resumed in
place and manually replayed at desktop and 360/390/430 phone sizes. Entry now
recovers when the engine import fails. Limbo backdrop, bench spacing and theft
framing were checked; the voice module now remains present until the actual
theft and follows a continuous retreat path. Phone home/theft shots were widened.
Preview: http://127.0.0.1:8017/first-words, disposable review database preserved.

**Prologue quality gate remains needs_revision.** Bellweather's social interaction
and character distinction still need stronger visible attachment; the prison
reveal remains an abrupt cut rather than the specified progressive reveal.
Do not extend tutorial/Level 1 or inherit historical critic scores. Next work
stays inside the prologue: stage a meaningful friendship beat and coordinated
reveal, then repeat story/art/play review. Naming remains provisional.

Build and application tests passed (152 run, seven skips). Entry recovery tests
passed, including missing engine at `/` and a locally simulated hosted sign-in
surface. That simulation is not production auth verification. The dedicated
opening rerun and detailed evidence live in `PLAYTEST-20260917-LOCAL.md` and
`artifacts/prologue-opening-final-20260918.log`. No deployment occurred here.

The September 17 design/user-review record below remains authoritative where it
does not conflict with this local repair checkpoint.

## Active checkpoint — 17 September 2026 IST

Status: **user review / needs redesign before another Level 1 candidate.**

Canonical development branch: **`main`**.

Branch policy: routine development, research, review and fixes continue on `main`. `deploy/render-supabase` is the pinned live-deployment branch and may intentionally lag. Existing `game/*` / `phase1/*` branches are historical snapshots unless explicitly revived. `game/level1-quality-gate` is retained only as a compatibility/reference alias and should not become a separate line of development again.

Recorded review deployment: Render commit `6de1f0ccb234507c1db2dccbe007c7cabfaf397e` (runtime game candidate `6fea8287aa5f078a5836902478320699e54571a9`). The documentation clarification below does not change or re-verify that deployment.

The previous internal gate returned `ready_for_user_review`, but the user's live review exposed structural product failures. The user's judgment supersedes that recommendation. See `USER-REVIEW-20260917.md`.

## Latest product clarification — learner-facing, on demand

The user explicitly selected a **learner-facing product that creates a personalized game on demand**, not a creator-operated studio as the initial customer experience. Internal creation/review tools support that product. The primary journey is request -> personalized brief/design -> assembly and verification -> play -> resume/adapt.

The user also requires **future conversational issue reporting and agent repair**: learners flag problems in chat; an agent checks the actual experience, exercises judgment, verifies an appropriate candidate change, and applies it safely when justified. Agents now have computer use available in the development environment, so future implementation should deliberately support inspecting and reproducing issues in the actual running experience rather than relying only on source or textual reports.

`LEARNER-ON-DEMAND-AND-REPAIR.md` owns the detailed learner/repair contract; `GAME-CREATION-PLATFORM.md` and `COURSE-GENERATION-GAME-SYSTEM.md` link it to production. Personalization and repair-agent behavior are designed future capabilities, not implemented features. Exact generation latency, first-playable size and repair autonomy thresholds remain open.

This clarification does not close the current game-quality blockers or authorize Level 2.

## Current user-review blockers

1. Duplicate/ambiguous protagonist-looking robots and visible table/character clipping.
2. Opening does not communicate the written story/stakes through the rendered scene.
3. Tutorial is incorrectly embedded inside Level 1 instead of existing as a separate prologue/tutorial stage.
4. Text, animation, camera and world changes are not yet one coherent storytelling system.
5. Current progression does not follow `orientation -> tutorial -> clean success -> Level 1 -> challenge -> payoff`.
6. Visual attraction exists (`would look`) but sustained playability/clarity does not (`would not play`).
7. The current play space is too congested; a larger footprint with the same content would improve the experience.
8. Player embodiment is wrong for this track: there should not be a literal helper/`you` avatar. The player directly controls the robot protagonist.
9. The current critic process needs the dedicated art/world-direction gate enforced alongside its other checks.

These are not polish items. Do not patch around them while preserving the current opening structure.

## Working replacement direction

Current story/progression direction for the next design pass:

`happy Bellweather -> dramatic disruption/thunder/teleport -> protagonist displaced to dark limbo -> lights reveal unknown prison/large blocked door -> evil robot removes protagonist's speech engine -> player takes direct control -> separate Tutorial/Prologue teaches movement/interact/core speech-repair loop and grants a clean success -> Level 1 begins`

The protagonist name `Zip` is provisional. Run a stronger character/naming ideation pass informed by pop culture, games, film, animation, literature and mythology, while keeping shipped characters/assets/story original and understandable without references.

## Spatial/art direction

The next world must be **larger and calmer**, not denser. Preserve useful buildings/props but introduce deliberate negative space, clearer landmark spacing and more room for movement/camera orbit.

World generation and review require configurable footprint/density/spacing parameters and an independent art/world-direction critic. See `ART-WORLD-DIRECTION-CRITIC.md`.

## Platform direction and proof boundary

VibeLearn creates personalized learning games on demand for learners. The current How-LLMs-Work track is the proof case for quality and reusable foundations, not the permanent product or sufficient proof of personalized generation.

Every accepted chunk should leave reusable components where justified:

- world/environment kits;
- layout/spacing parameters;
- character/control profiles;
- cinematic beats and state transitions;
- mechanics and tutorial/scaffolding patterns;
- reusable gates/doors/routes/interactions;
- HUD/accessibility/audio patterns;
- critic/test/CI evidence templates.

Reuse must not produce identical/reskinned games. Story, art direction, layout, scale and mechanics remain parameterizable; learner history remains independent of their replacement.

Longer term the platform supports agents for research/ideation, story/game/art creation, implementation, criticism, tests, CI/CD and learner-facing issue investigation/repair. Do not build the entire orchestration platform now. Keep the proof track bounded while establishing the contracts needed for a later thin end-to-end learner request -> personalized verified game flow.

## Review framework correction

The prior internal 9/10 gate missed obvious world/art/story problems. Before another internal-ready recommendation:

- story critic compares written story to rendered beat-by-beat causality;
- art/world critic inspects space, density, clipping, silhouettes, landmarks and alternate camera angles;
- gameplay critic separately asks `would look?` and `would play/continue?`;
- declared player embodiment matches the actual world;
- prologue/tutorial/Level-1 boundaries are explicit and tested;
- technical CI remains necessary but earns no product-quality credit.

`CRITIC-POLICY.md` and `ART-WORLD-DIRECTION-CRITIC.md` govern the next candidate. The same evidence discipline must apply to future reported-issue repairs.

## What remains technically useful from the previous candidate

The previous build's regression evidence remains useful infrastructure evidence: build/tests, auth/session, save/resume, reset/logout, controls, phone layouts, reduced motion and no active 2D fallback. It does **not** validate the current story/world design or the newly specified learner-facing platform capabilities.

## Deployment record

Recorded review URL: `https://vibelearn-4xws.onrender.com/`.

The reviewed build is not accepted. Auto-deploy was recorded as off. No Render or Supabase change is part of this branch-consolidation update; inspect those connectors before making a new operational claim or release.

## Next action

Continue architecture/design clarification and recording the user's review on `main`. Before resuming gameplay implementation, finalize **prologue + separate tutorial + Level 1 boundary**, then build and verify the new prologue as the first coherent chunk. Keep the on-demand learner journey as the product target. Do not start Level 2 or claim the repair agents exist.
