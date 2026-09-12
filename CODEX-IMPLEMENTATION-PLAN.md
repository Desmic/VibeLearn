# Learning OS — incremental implementation plan 1.9

**12 September 2026 · authoritative active plan**

This file is the current build order. The checksummed `learning-os-design-package-v1.3/` remains immutable historical design. Its detailed phase/security/evidence requirements still apply wherever this plan does not supersede them.

Read, in order, `docs/STATE.md`, `docs/STORY-GENERATION-AND-CRITIC.md`, `docs/GAME-AS-COURSE.md`, `docs/GAME-UX-SYSTEM.md`, `docs/GAME-UX-REVIEW.md`, `docs/COURSE-GENERATION-GAME-SYSTEM.md`, `docs/PLAY-CANVAS.md`, and `docs/THREE-STORY-FRAMEWORK.md` before substantial product work.

## 1. Product north star

VibeLearn is a **general system for turning subjects/courses into source-grounded learning games**. Relay Rescue is only the current authored reference slice.

The durable generated experience boundary is:

`LearningSpec -> StoryWorldSpec -> GameExperienceSpec -> AssessmentEvidenceSpec`

- **LearningSpec** owns canonical competencies, prerequisites, intended outcomes, source/provenance constraints, assessment requirements, transfer/retrieval requirements and misconceptions.
- **StoryWorldSpec** owns premise, characters, world rules, emotional arc, meaningful objects/resources, stakes, chapter progression and mappings back to LearningSpec.
- **GameExperienceSpec** owns mechanics, mission graph, Play Canvas modes, HUD/visibility schedule, failure/recovery, progression, rendering choice, device/accessibility budget and story-to-play mapping.
- **AssessmentEvidenceSpec** owns observable evidence, assistance/exposure semantics, transfer/delayed-retrieval claims and what must remain unknown.

Story names, characters, renderer IDs, assets, Play Canvas implementation details and world-package versions are provenance/presentation. They must never become competency or evidence identity.

## 2. Story input now vs later

**Today:** story/world creation is driven by the subject/course, intended outcomes, source-grounded causal structure and a broad kid-through-young-adult quality target. Creative learner preferences are not currently an input.

**Later:** add an explicit learner-controlled, versioned `StoryPreferenceProfile` for genre, fantasy/realism, tone, character style, visual style, humor/darkness, pace, exploration/action balance, narrative density and similar creative choices.

Preferences may regenerate StoryWorldSpec/GameExperienceSpec and visual packages. They must not silently alter LearningSpec, evidence meaning, assessment criteria or mastery.

## 3. Authoring/generation order

Use this order for every generated course/chapter:

`course intent/outcomes -> source grounding -> LearningSpec -> StoryWorldSpec -> story critic -> GameExperienceSpec -> Play Canvas realization -> first-touch critic -> whole-chapter game critic -> learning/transfer gate -> user review -> activation`

Do not start with lesson prose and add fantasy afterward. Do not build a renderer first and ask the story to justify it later.

### Story gate

Freeze one story candidate at a time and use `docs/STORY-GENERATION-AND-CRITIC.md`. Unrounded story score must be **>=9.0/10 with no story blocker** before gameplay realization.

### Game gates

Do not blend opening and chapter scores.

- **First-touch magic >=9.0/10**, no blocker.
- **Whole-chapter game experience >=9.0/10**, no blocker.

A strong later chapter cannot average away a poor opening. Beautiful first touch cannot compensate for a weak chapter.

### Learning gate

Only after both game gates pass, run the bounded learning/transfer critic. Applicable score must be **>=9.0/10**. Guided success is not durable mastery.

Critic passes only authorize the next gate or user review. The current user's explicit verdict remains final.

## 4. First-touch and Chapter 1 contract

The opening must earn attention before increasing cognitive load.

Default curve:

`beauty / curiosity / story hook -> character + world desire -> concrete need -> one obvious action -> visible consequence -> easy recovery/success -> formal concept -> variation -> combination -> transfer`

By the end of Chapter 1 a bright child/non-specialist should understand:

- who/what matters and what help is needed;
- important objects/resources/entities and what each one does;
- what happened before the player arrived;
- what changed/failed and why it matters;
- what the player can do;
- what success/failure means;
- how the world behavior maps to the real subject concept.

Prefer dramatized action, environmental storytelling, direct manipulation and visible consequence over glossaries/slides. Formal jargon comes after a concrete model when faithful.

First-run narrative progression is user-paced by default. Back/previous, Continue, Skip, Replay and visible progress are required where applicable. Pause/Resume is required while motion runs. Reduced-motion preserves causal meaning and navigation.

## 5. Play Canvas is the top-level game architecture

The product has converged on the **Play Canvas** in `docs/PLAY-CANVAS.md`.

The Play Canvas is the persistent game surface/orchestrator for story, exploration, missions, consequences, progression, build/combine modes and transfer. Rendering backends live inside it.

Do not add:

- new course-specific app shells;
- one bespoke canvas/runtime per chapter;
- a cinematic canvas that is destroyed before a separate mission page;
- dashboard/workbench pages that make the game world disappear when reasoning becomes harder.

For compatible modes using the same world package, prefer one persistent Play Canvas stage and one persistent world/runtime instance. Change mode/state/camera/HUD inside that surface.

Accessible DOM actions/fallback remain required. They support and mirror the game surface; they do not own learning correctness or become the primary visual architecture.

## 6. Three.js framework is a required reusable subsystem

The user has explicitly reaffirmed that VibeLearn must build a **reusable Three.js framework so future generated stories/fantasy settings can be integrated easily**.

This is a hard architecture requirement, but it remains **below Play Canvas**:

`Play Canvas -> rendering backend -> Three.js runtime/host -> world package`

Three.js remains optional for a given course; 2D and 2.5D remain valid backends. When Three.js is chosen, future worlds must not copy renderer lifecycle or require a new game shell.

### Shared Three.js infrastructure owns

- renderer/canvas lifecycle;
- bounded DPR/mobile performance policy;
- resize/aspect handling;
- frame scheduling and pause/reduced motion;
- WebGL context loss/restoration;
- cleanup/resource tracking;
- reusable camera composition/transition rig;
- package/adapter version and capability validation;
- stable interaction-anchor projection helpers where generalized;
- generic environment/effect primitives only when they are truly reusable.

### World package owns

- story-specific art direction and assets;
- scene entities/locations/props;
- character/environment compositions;
- story beat states;
- mission/game-state visual mappings;
- interaction anchors;
- camera compositions;
- semantic fallback metadata.

### Long-term authoring target: data-first world packages

Easy integration should not mean arbitrary generated JavaScript.

The long-term package target is a **versioned, declarative `WorldPackageSpec`** interpreted by trusted shared runtime code. Conceptually:

```text
world-package/
  manifest.json          # id/version/backend/capabilities/assets
  world.json             # scene/entity graph and reusable primitive references
  states.json            # story beats + game visual states/transitions
  cameras.json           # portrait/landscape compositions
  interactions.json      # semantic action anchors
  assets/...             # approved same-origin assets
  fallback/...           # semantic/2D fallback data
  adapter.js?            # exceptional reviewed extension, not default generated output
```

Current Phase 1 may keep authored adapter code such as `rescue-story3d.js`, but shared/runtime code must move toward an authoring surface where a new fantasy changes package data/assets far more often than engine code.

If a new story requires story-specific changes to `play-canvas.js`, `story3d-runtime.js`, or `story3d-world-host.js`, either the required capability is genuinely generic and must first become a versioned shared capability with tests, or the package boundary has failed.

### Easy-integration acceptance

Phase 1 must prove the mechanical seam with an unrelated synthetic world. Before the future generator is considered mature, a materially different real story/world must integrate without story-specific changes to Play Canvas/runtime/host infrastructure.

The arbitrary generated-package loader remains deferred until a later immutable publishing/asset-validation/security boundary. Keep CSP/static allowlists strict.

See `docs/THREE-STORY-FRAMEWORK.md`.

## 7. Phone-first target

Optimize current first touch and Chapter 1 for mainstream modern Android/iPhone portrait use, roughly **360–430 CSS px** wide with common tall aspect ratios, touch, safe areas, text enlargement and reduced motion.

Do not create device-specific product forks unless evidence proves a real breakpoint need. Desktop polish follows after phone quality is strong.

## 8. Current private Phase 1 execution

Do not jump to the full Phase 3 generator. Relay Rescue is establishing the quality and architecture target first.

Current bounded sequence:

1. keep auth/recovery visually coherent with the game;
2. get the current Play Canvas migration exact head fully green;
3. keep opening -> Signal 1 on one persistent Play Canvas/world/runtime;
4. migrate Signals 2-6 and Signal 6 construction into the same Play Canvas lifecycle;
5. keep Signal 7 as deliberate transfer while preserving the Play Canvas shell;
6. continue extracting reusable Story3D lifecycle/camera/host infrastructure from Echo Forge-specific code;
7. define/test the data-first world-package authoring seam without implementing an unsafe arbitrary package loader;
8. preserve save/reload, historical review, reset progress, learner isolation and evidence semantics;
9. inspect exact 360/390/430 rendered evidence;
10. repair first-touch critic until >=9/no blocker;
11. repair whole-chapter critic until >=9/no blocker;
12. run bounded learning/transfer critic;
13. deploy the exact verified candidate to Render;
14. verify the served revision and ask the current user for the decisive review.

Do not mark `ready_for_user_review` until all three critic gates pass on the same verified build. Do not mark `user_accepted` until the user explicitly accepts it.

## 9. Phase map after the reference is accepted

- **Phase 0:** establish actual repo/tool/database/browser capabilities and failure boundaries.
- **Phase 1:** one high-quality persisted learning-game reference slice; prove Play Canvas continuity and the reusable Three.js world-package seam.
- **Phase 2:** prove course replacement, canonical evidence reuse, learner isolation/export and a second domain/user without binding history to one story.
- **Phase 3:** implement source-grounded course generation. Generated games target Play Canvas. Three.js games emit validated/versioned world-package data/assets against the shared framework rather than fresh renderer boilerplate.
- **Phase 4:** collaborative course/game evolution and explicit StoryPreferenceProfile support.
- **Phase 5:** one genuinely new interaction/component through an isolated code-generation/release path.
- **Phase 6:** consenting pilot, reliability/restore hardening, real delayed/transfer observations and ranked product-learning improvements.

## 10. Engineering/evidence invariants

Protect learner isolation, immutable submitted evidence, pinned assessment meaning, source/provenance constraints, explicit assistance, evidence identity, course-independent competencies, restart/reload behavior and the difference between verification, acceptance and activation.

Keep `unknown`, `declared_independent`, current `assisted` and `previously_exposed` distinct. XP never establishes mastery. Prior exposure is not current help. Rendering/world state never establishes learning evidence merely because an animation happened.

Build in bounded increments: inspect baseline -> define executable acceptance -> implement smallest complete path -> run focused tests -> run persistence/security checks -> exercise actual UI -> inspect evidence -> update docs/state -> continue.

Do not weaken tests or critic rubrics to make a candidate pass.

## 11. Feedback changes the plan

When direct user feedback changes story direction, generation assumptions, platform priority, critic semantics, Play Canvas/framework boundaries or the meaning of done, update this plan and materially affected current docs before or in the same bounded implementation unit as code.

Historical/checksummed design packages and frozen critic evidence remain historical; do not rewrite them to make the current state look cleaner.

## 12. Acceptance authority and rollout

The current user is the sole real product reviewer during private refinement. Their explicit verdict overrides every critic, automated score and historical result.

No external users/testers, public rollout, paid infrastructure expansion, untrusted execution or broad Phase 2+ implementation is authorized by this plan alone.

Render serves `deploy/render-supabase`; auto-deploy is disabled. Deploy only the exact verified candidate intended for user review, then verify the served revision.
