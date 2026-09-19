# Current state — LLM learning-game proof track

## Local shared-renderer repair — 19 September 2026

Continued work reproduced the graphics warning in an unrelated synthetic world:
hiding/detaching the canvas caused AUTO sizing to create a zero-size framebuffer.
The shared backend now owns explicit sizing and retains valid dimensions while
hidden. A real-browser lifecycle regression covers portrait and landscape
remounts; the opening suite now checks framebuffer console errors as well.
Build, 265 application tests (seven skips) and all seven active browser groups
passed; manual browser play covered opening/replay/tutorial return and desktop
resizing. Full browser results and local evidence are in
`REPAIR-20260919-RENDERER-LIFECYCLE.md`. This remains local repair work, with the
same exact-candidate/isolated-critic/user gates and deferred integration below.

## Local control-clearance repair — 19 September 2026

The user requested continued improvements after syncing `main` to `e328760`.
Informed diagnostic play found that a tutorial target marker could cover the
phone movement stick: touching backward hit the power-connection action instead.
The shared marker helper now uses the full label footprint and occupied HUD
rectangles. A regression reproduced the failure before repair and passed at
360/390/430 widths afterward, including actual touch movement with unchanged
learning state. Manual replay confirmed the original hit-target defect is fixed.
Build, 265 application tests (seven skips) and all seven active browser groups
passed. The integrated run exposed a frame-dependent collision-test setup;
reload-before-contact and a sustained-input assertion repaired that test without
changing collision rules.

This is a local repair on top of `e328760`, not a new accepted or deployed
candidate. The archived `92a5ecbd...` evidence below remains unchanged and cannot
certify the modified runtime. Final local verification is recorded in
`REPAIR-20260919-MARKER-CLEARANCE.md`; a replacement release still needs exact-SHA
CI evidence, genuinely isolated critics and the existing preview/user gates.

Fresh no-history reviewer sessions were tested, but both inherited repository
instructions before evidence consumption. They stopped without results or
receipts. Independent review remains incomplete; do not assume a no-history
subagent satisfies assignment-only context. Terminal PM integration stays
deferred, and no Render/Supabase or Level 2 work occurred.

## Frozen critic candidate + completed adapter Phase 0 — 19 September 2026

The exact **game/product critic candidate is now frozen at**
`92a5ecbdc803362ee1554fca6ae811adb155bc26`.

Exact GitHub Actions run `35434565005` passed:
- foundation, including the full unit/adapter suite;
- first-words-opening;
- first-words-tutorial;
- first-words-controls;
- first-words-chapter;
- first-words-readability;
- first-words-lifecycle;
- exact-candidate review-index aggregation and sealed-capsule materialization.

Exact review-index artifact:
- artifact ID `10581437727`;
- candidate SHA `92a5ecbdc803362ee1554fca6ae811adb155bc26`;
- retained until **19 October 2026**.

The only change from the prior green canonical head `b320723...` to this
candidate is CI artifact retention in `.github/workflows/verify.yml`; no
game/runtime/test/source behavior changed. The evidence lifetime was extended
from seven days to thirty days because genuinely independent reviewer execution
is not currently available inside this chat.

### Post-CI critic queue

**ready for genuinely independent execution**
- cold_observer;
- motion_audience;
- physicality;
- handoff_tutorial;
- audio_atmosphere;
- learning_transfer.

**blocked until a validated cold-observer result exists**
- cinematic_causality;
- intent_comparison.

All critic results must remain bound to the exact candidate, assignment and
harness execution receipt. Do not transfer a result from an older or newer SHA
merely because game files appear equivalent.

The current chat/reviewer context already knows intended story and prior human
findings. It is not a valid cold observer and must not manufacture that result.

### Terminal PM adapter Phase 0 — complete and merged

The thin external-orchestrator v0.1 boundary is merged on canonical `main`
(squash merge `40ec93f8b04cc7a3d88366d9195ec50555d9698f`) and is included in the
frozen critic candidate above:

- `app/orchestrator_adapter.py`;
- `tests/test_orchestrator_adapter.py`;
- `tests/fixtures/orchestrator_adapter_v01.json`;
- `docs/ORCHESTRATOR-ADAPTER-CONTRACT.md`.

The completed fixture-only slice has **27 focused adapter tests** plus serialized
boundary fixtures covering:
- capability negotiation for fresh dispatch;
- hard reviewer capabilities derived from required review semantics;
- restart-safe idempotency reconciliation bound to a trusted intent digest;
- unknown start/cancel effects remaining unknown until authoritative
  reconciliation;
- retries reconciling before fresh capability checks;
- typed opaque run/candidate/build/artifact references;
- exact candidate/evidence/review binding;
- multiple candidates requiring explicit active-candidate identity;
- duplicate required review results failing closed;
- worker replacement/recovery lineage;
- hard budget/capability refusal rather than silent downgrade;
- Terminal PM orchestration completion remaining distinct from VibeLearn product
  acceptance;
- outcome -> incident -> ordinary child repair-run lineage;
- additive extension data never gaining control authority;
- fixtures containing no model-visible credentials.

No Terminal PM internal runtime/session/verifier/recovery modules were copied.

### Current Terminal PM Agent boundary

The connected private orchestrator repository was rechecked at
`acc3a6d3580d8ea0715ff807434f973eff4f90d0`. Its authoritative checkpoint,
updated 12 September 2026, says:
- `gate_1_5: open`;
- `live_run_authorized: false`;
- ER-1 exhaustive review is active and incomplete;
- the checkpoint is navigation/engineering status only and **never** live-run
  authorization;
- its next authorized work remains its own durable benchmark
  admission/transport seam and public/synthetic qualification;
- current benchmark approval does not authorize a Gate run, worker effect,
  private upload or credential change.

Therefore VibeLearn **Phase 0 is complete**, but the first real Terminal PM
integration run (Phase 1) is blocked by the external orchestrator's own current
execution policy. No live Terminal PM run was dispatched.

### Deployment/database boundary

Render remains intentionally pinned to the rejected runtime
`ad14c5aced6cf053c7617dfb03245506e1e9dad5`; do not ask the user to review it
again.

Supabase remains unchanged by this work. No production schema/data mutation,
Render branch promotion or deployment occurred. Do not start Level 2.

### Next active work

1. Execute the six ready post-CI critics in genuinely context-separated reviewer
   sessions against frozen candidate `92a5ecbd...`, with sealed capsules and
   harness execution receipts.
2. Ingest/revalidate results sequentially. A `needs_revision` verdict blocks;
   missing/unresolved evidence stays incomplete rather than being replaced by a
   weaker modality.
3. Unlock cinematic-causality and intent-comparison only after the validated
   cold-observer dependency exists.
4. Repair any critic blocker on a new exact candidate and repeat the required
   evidence/review sequence.
5. Keep `92a5ecbd...` frozen for product review; documentation-only commits
   after it do not become critic candidates automatically.
6. Do not add more Terminal PM/VibeLearn integration machinery merely to make
   progress while live execution is externally forbidden. Resume Phase 1 only
   when Terminal PM's current checkpoint authorizes a bounded live run through
   the same adapter.
7. Promote a replacement preview only after all required v2 critics pass and the
   release gate succeeds. Level 2 still requires explicit human acceptance.

---


## Exact system-repair checkpoint — 18 September 2026

Current verified development candidate:
`ddfbaca219f712e241e47941806ecd8f7aeff190`.

Exact GitHub Actions run `35384949480` passed:
- foundation;
- first-words-opening;
- first-words-tutorial;
- first-words-controls;
- first-words-chapter;
- first-words-readability;
- first-words-lifecycle;
- exact-candidate review-index aggregation.

This is **not** a creative-readiness claim and is not deployed to Render.

### Anti-overfitting proof

The foundation suite now includes a materially different synthetic game fixture,
**Harbor Relay**, rather than testing only the Bellweather/First Words package.

That fixture independently exercises:
- WorldSpec colliders and walkable surfaces;
- major semantic-object readability metadata;
- purposeful ambient patrol motion;
- environment/camera world states;
- major-event cause/effect direction metadata;
- opening -> tutorial handoff semantics;
- generic control tutorial flow;
- generic state-driven interaction tutorial;
- mutually exclusive experience modes;
- HUD-safe critical world-marker placement.

The cross-game fixture passed on the exact candidate. This proves those contracts
are reusable platform behavior rather than Bellweather-name-specific validators.

### Evidence/critic pipeline status

The exact review index for `ddfbaca219f712e241e47941806ecd8f7aeff190` contains:
- motion video;
- caption-blind motion;
- actual captured WebAudio;
- interactive control/physicality/tutorial traces;
- authoritative learning replay;
- screenshots/runtime reports;
- exact tracked source;
- assignment packets kept distinct from actual reviewer reports.

Generated critic assignments currently resolve as:

**ready for independent execution**
- cold_observer;
- motion_audience;
- physicality;
- handoff_tutorial;
- audio_atmosphere;
- learning_transfer.

**blocked by design until a validated cold-observer result exists**
- cinematic_causality;
- intent_comparison.

This dependency is intentional. The current assistant already knows the design
intent and therefore does not self-author the cold-observer result.

### Reviewer authority hardening

Post-CI reviewers are now bound to:
- exact candidate SHA;
- deterministic assignment ID;
- required evidence modality groups;
- a sealed evidence capsule containing only assignment-approved evidence;
- harness-authored execution receipt bound to that capsule;
- executor/session identity;
- exact evidence/context supplied by the harness;
- forbidden-context checks;
- observations-before-interpretation output;
- explicit verdict + blockers/retest.

A result cannot be replayed against another assignment/session, cannot claim
evidence the harness did not supply, cannot cite evidence outside the sealed
capsule, and cannot substitute weaker evidence for the modality required by its
pass. Capsule manifests are tamper-verifiable and candidate/assignment-bound.

### Release boundary

Normal preview promotion now requires:
1. exact-candidate successful technical run;
2. complete review index;
3. schema-v2 final review record;
4. every required post-CI critic result revalidated against its assignment and
   execution receipt;
5. **every required critic verdict = pass**;
6. no blocker;
7. candidate not previously rejected by the user.

An explicit user preview override may only tolerate **missing/unresolved**
review on an otherwise technically safe/unblocked candidate. It cannot bypass a
`needs_revision` critic verdict or known rejected candidate.

Phase/Level advancement still requires explicit human acceptance for the same
candidate SHA.

### Deployment state

Render remains intentionally pinned to rejected runtime
`ad14c5aced6cf053c7617dfb03245506e1e9dad5`. Do not ask the user to review that
build again. Do not start Level 2.

### Next active work

The structural/system repair has reached the point where the next meaningful
gate is **independent critic execution using the generated assignments and
harness receipts**. Do not manufacture those judgments inside a context that
already knows the intended story.

After those critic results:
1. ingest/revalidate them sequentially;
2. repair any `needs_revision` blocker;
3. repeat on one exact SHA;
4. only when all v2 passes say `pass`, build the final schema-v2 review record;
5. use the gated preview workflow before moving a replacement candidate to
   Render.


## Quality-system enforcement checkpoint — 18 September 2026

The deployed runtime `ad14c5aced6cf053c7617dfb03245506e1e9dad5`
remains **rejected** and is not the current development candidate. Do not ask the
user to review it again and do not start Level 2.

The active work on `main` is system repair. The last fully green integrated
system-repair checkpoint before the newest review-schema/motion assertions is
`6397770a4cf01ed0d72097b2ebc42323666f698d` (all seven CI suites green).
Newer `main` commits extend evidence enforcement and are revalidated by CI
before any release claim.

### Implemented reusable protections

These are now runtime/schema/test capabilities rather than critic-prompt wishes:

- **world-owned physicality:** WorldSpec entities/archetypes declare colliders;
  PlayCanvas derives live player/camera blocking from enabled transformed world
  entities; browser tests deliberately drive the protagonist into a reusable
  prop and require movement to stop;
- **explicit character motion direction:** asset-backed controlled characters
  must declare idle/move animation aliases and optional speeds; the proof
  protagonist uses a deliberately subdued/frozen rest pose rather than silently
  inheriting a stock idle loop; runtime evidence exposes active alias/speed;
- **major-event direction metadata:** opening scenes can declare establishing,
  major-event, transition, antagonist-action and handoff intent, causal
  attribution, effect channels, persistent world-after state and causal lead;
- **atmosphere/event channels:** cinematic patches can change environment,
  camera impulse and semantic audio cues instead of relying on captions;
- **semantic story objects:** major objects declare role/readability channels;
  reusable capability-module/socket and source->effect link primitives exist;
- **purposeful ambient activity:** WorldSpec supports reusable patrol activity so
  normal-world life can be shown through behavior rather than static decoration;
- **exclusive experience modes:** reusable `experience-mode.js` owns mutually
  exclusive presentation surfaces;
- **spec-driven tutorials:** reusable `tutorial-flow.js` owns tutorial
  progression/persistence while game packages supply skills, prompts, focus,
  success semantics and handoff data;
- **world-target tutorial focus:** interaction onboarding can visibly point at
  the actual world target rather than only a HUD button;
- **motion evidence:** opening CI preserves a WebM motion artifact in addition to
  screenshots and structured browser reports;
- **cold-observer context separation:** CI emits a restricted evidence packet
  that intentionally omits story treatment/creator rationale;
- **critic schema v2:** new review records add world comprehension, motion
  direction, semantic readability, audio atmosphere, physicality, handoff and
  tutorial clarity. Evidence modality must match the claim and be exact-candidate
  bound; the CLI can validate against an extracted CI evidence root.

### What is intentionally *not* claimed

No current creative/story 9/10 claim exists.

The current assistant/reviewer already knows the intended story, so it is not a
valid cold observer for this candidate. Under review schema v2:
- `world_comprehension` stays unassessed until a genuinely context-restricted
  reviewer produces a cold-observer report;
- `audio_atmosphere` stays unassessed until actual listening evidence exists;
- screenshots/source cannot substitute for motion/interactive/listening evidence.

The newer opening implementation has stronger threat, rupture, speech targeting
and speech-removal staging, but implementation evidence is **not** a creative
pass.

### Next active sequence

1. finish exact-CI validation of the current `main` review/runtime changes;
2. keep the opening/tutorial blocked from internal readiness until v2 evidence is
   complete;
3. run a truly context-restricted cold-observer review on the motion artifact;
4. obtain real audio-listening evidence;
5. run intent comparison, motion/audience, physicality, handoff/tutorial,
   learning and technical gates using matching evidence modalities;
6. repair any blocker and repeat on one exact SHA;
7. only then deploy a replacement Phase 1 preview for the user.

Render remains pinned to the rejected review build until a later candidate earns
a new preview. No Level 2 work.


## System-repair checkpoint — 18 September 2026

The current deployed runtime `ad14c5aced6cf053c7617dfb03245506e1e9dad5`
is **rejected**. The user ended further review because the opening, cinematic
direction, physicality and onboarding still failed despite prior internal 9/10
claims.

Do not ask the user to continue reviewing this candidate. Do not start Level 2.
The active work is now **system repair**, using the current game as the proof case.

Failures that must be solved generically:
- cold-start world/setting comprehension;
- major-event direction (cause, reaction, VFX/light/audio/atmosphere,
  consequence);
- intended antagonist causality;
- semantic readability of important story objects;
- character animation/motion direction;
- world-owned collision/physicality;
- mutually exclusive experience modes;
- opening -> tutorial handoff;
- tutorial target/action/success clarity;
- critic evidence quality and reviewer-context leakage.

`docs/EXPERIENCE-QUALITY-SYSTEM.md` is the new quality-system contract.

Implementation already started:
- WorldSpec entity colliders are being introduced so reusable world objects own
  physicality instead of relying on a separate remembered obstacle list;
- PlayCanvas player/camera navigation now queries enabled world colliders;
- reusable prop kits are being given collider intent;
- asset-backed player characters now require an explicit motion profile;
- Zip's current rest profile deliberately freezes the stock standing loop rather
  than silently inheriting the bundled default animation.

Next system slices:
1. finish collision regressions and validate traversal;
2. add reusable major-event/cinematic-direction metadata + evidence;
3. add semantic-story-object readability contract;
4. enforce single active experience mode and a reusable transition/handoff
   contract;
5. replace the ad-hoc tutorial with explicit tutorial-step specs;
6. improve critic evidence: cold observer first, motion/audio/traversal evidence,
   then design-intent comparison;
7. rebuild the opening/tutorial using those system capabilities;
8. re-run independent critics before any new user review.

Render may remain on the rejected review build until a replacement candidate is
verified; it is not an accepted release.


## Live user review checkpoint — 18 September 2026

Deployed runtime under review:
`ad14c5aced6cf053c7617dfb03245506e1e9dad5`.

The user's current review has **rejected the opening/creative direction** even
though the preceding internal critic scored story/art/gameplay/learning 9/10.
Those internal scores are now historical evidence of an insufficient rubric, not
the current readiness state.

Current user findings:
- opening still does not make sense as a world/setting;
- visuals and animation must establish Bellweather and its normal life rather
  than asking captions to explain the place;
- Zip's default rest/idle loop is an art-direction mismatch: exaggerated stock
  motion reads like a retro-game "character is alive" convention and may feel
  unnatural/creepy to kids or young adults in the current 3D style.

The user is continuing to review the rest of Phase 1. **Do not rebuild or
redeploy yet unless a defect prevents continued review.** Keep collecting
feedback so the next repair pass addresses the experience coherently.

The critic framework has already been corrected:
- caption-blind visual world-comprehension is now required;
- normal environmental life/purposeful background activity is reviewed;
- animation/motion direction is a hard creative-direction gate;
- stock/default idle loops must be judged for theme, personality, repetition,
  physical plausibility and target-audience emotional read.

No Level 2 work. No Phase 1 acceptance claim. Render stays on the current review
candidate while the user continues the review.


## Automation integration direction — 18 September 2026

The user has approved VibeLearn becoming a highly automated development/game-generation system, but the existing Terminal PM Agent is still under active development. `docs/AUTOMATED-DEVELOPMENT-SYSTEM.md` is the owning architecture/handoff.

**Current integration decision:** keep Terminal PM Agent as a separate evolving external orchestrator and integrate through a thin versioned adapter contract. Do not copy/extract its runtime/session/verifier/recovery internals into VibeLearn while Gate 1.5 remains open, live runs are unauthorized and ER-1 review is incomplete. Phase 0 is contract/fixture work only; the first real external run waits for the Terminal PM Agent's own current execution policy to permit it.

The intended worker model remains economical worker -> independent reviewer with implicit falsification/proof -> evidence -> VibeLearn outcome evaluation -> accept/repair. Deeper coupling or new complexity requires either an obvious safety/correctness invariant or evidence from real integration runs.

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
