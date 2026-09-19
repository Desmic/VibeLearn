# Learning OS — incremental implementation plan 2.0

**Authoritative gate — 19 September 2026:** Implementation is frozen for post-CI product criticism. Exact critic candidate `92a5ecbdc803362ee1554fca6ae811adb155bc26`; exact CI/review-index run `35434565005`; sealed bundle `10581437727` retained through 19 October 2026. Ready first-wave passes: cold observer, motion/audience, physicality, handoff/tutorial, audio/atmosphere, learning/transfer. Cinematic causality and intent comparison remain dependency-blocked until a validated cold-observer result is ingested. Terminal PM adapter Phase 0 is complete/merged; live execution remains externally unauthorized. Render remains on rejected `ad14c5aced6cf053c7617dfb03245506e1e9dad5`; no Level 2. **All older “active chunk/next build” sections below are implementation history unless a later critic blocker explicitly reopens them.**

## Completed implementation chunk — 18 September 2026

Friendship/reveal slice was verified; the then-next chunk was control orientation in
the separate tutorial. Fresh play went directly to repair and hid movement/look
instructions behind an intrusive help panel. Add one short prompt at a time:
actual movement -> camera look/zoom -> menu open/return -> existing repair loop.
Allow skipping; persist only presentation progress per attempt, grant no learning
credit, and preserve existing powered/saved runs. Verify keyboard/phone controls,
reload, skip and the handoff before further tutorial/mission work.

Next prologue slice: a friend gives the protagonist a three-light lantern; the
player releases it and the friends celebrate before the rupture. Distinct round
and tall companion silhouettes leave one unmistakable golden protagonist.
Reveal the prison in stages (floor -> walls -> locked exit -> repair bench),
with the same readable final state in reduced motion. Reuse the opening action,
timeline and portable prop mechanisms. Verify fresh entry, action/replay/Back,
saved-state isolation, muted/reduced-motion and phone/desktop compositions.

Canonical checkout: `main`. The September 17 user review supersedes the historical
execution entries below. Prologue -> separate tutorial with clean success ->
Level 1 is the binding boundary. Finish the prologue staging/entry-recovery repair
and inspect actual playback before extending tutorial or mission content.
See `docs/PLAYTEST-20260917-LOCAL.md`. Internal quality gates remain unresolved;
do not inherit earlier scores or deploy this work as an accepted candidate.

**Latest instruction — 16 September 2026:** continue locally; deploy the latest verified
checkpoint when the five-hour allowance reaches <=10% remaining. Follow the
concise loop in `CODEX.md`: one playable chunk, immediate focused tests and
hands-on computer/browser play, repair and recheck, then proceed. Opening is the
first gate. Its dedicated checkpoint is recorded; next manually verify the Moon
repair/reunion before the existing tower challenge. Existing later code and
passing broad tests do not substitute for chunk review. No later-level/audio
expansion. Finish local Level 1 verification, then stop for the user's review.
This supersedes deployment and broad implementation ordering below.

**16 September 2026 explicit execution gate:** the user authorized the completed Level 1 deployment, and reiterated that the opening must be completed and tested first. Follow `docs/FIRST-WORDS-BUILD.md`: finish and verify the opening, repair its observed failures, then complete full Level 1 checks, then deploy for the user's review. Existing level code is working code, not proof this gate passed. No later-level expansion.

## Latest execution amendment — 15 September 2026, after Word Machine review

The current user acknowledges technical/interface improvements but rejects the weak workshop story. Their rescue premise and request for beautiful atmosphere, pop-culture references and sound/music supersede the earlier delivery-story implementation order. This is changes requested, not acceptance or a numeric score.

1. Research a varied set of narrative influences and compare premises before realization. Done as design work in `docs/STORY-INSPIRATION-20260915.md`.
2. Author the rescue treatment and progressive learning actions before more game code. `docs/LLM-RESCUE-STORY.md` defines the selected working direction; `docs/WORLD-ATMOSPHERE-AND-AUDIO.md` defines art, sound, humor, reuse and required observations. These are unimplemented, unrated designs.
3. Implement one bounded continuous Episode 1 arrival -> capture -> reachable repair -> first words -> reunion using existing opening/runtime/spec/rules components. Add only the required reusable gate/prop/audio primitives. Author and version rules/content fixtures before binding presentation; preserve existing attempts and retry evidence.
4. Add a changed-context challenge with a prediction before feedback and reduced guidance. Validate evidence meaning separately from the rescue reward. Keep later episodes as a roadmap.
5. Play the whole revised episode, including first action, mistake/recovery, reunion, transfer and replay/save. Inspect portrait widths, controls, enlarged text, reduced motion, sound-on and muted experience. Fix concrete story/atmosphere/HUD/learning blockers.
6. Run appropriate storage/build/browser gates for code changes. Apply the expanded critic-policy probes, preserve exact-build evidence and stop at the sole current user's Phase 1 checkpoint. No production push/deploy is part of this design revision.

The prior implemented workshop and its verification remain a baseline, not the accepted product direction. Current state and actual implementation status live in `docs/STATE.md`.

**Current review amendment — 14 September 2026:** Next bounded unit: reusable third-person movement/orbit camera, consistent 3D login, full-viewport mobile HUD and optional browser fullscreen. Then hands-on browser review, exact complete CI and manual verified deployment. Read [GAME-CAMERA-INPUT.md](docs/GAME-CAMERA-INPUT.md).

**Current user contract — 13 September 2026:** Read [docs/GAME-OPENING-PROGRESSION.md](docs/GAME-OPENING-PROGRESSION.md) before implementation or review. The `16a655e` experience was user-rejected. Require a first-entry skippable 3D opening, tutorial with early success, gradual progression, optional non-destructive replay at every level, and no automatic opening for Level 2+ players. Remove the 2D gameplay fallback; preserve accessible HUD controls and honest 3D recovery. This amendment supersedes conflicting legacy guidance below.

**15 September 2026 · authoritative active plan (critic reset and LLM-series direction)**

This file is the current build order. The checksummed `learning-os-design-package-v1.3/` remains immutable historical design. Its detailed phase/security/evidence requirements still apply wherever this plan does not supersede them.

Read, in order, `docs/STATE.md`, `docs/GAME-RUNTIME-ARCHITECTURE.md`, `docs/STORY-GENERATION-AND-CRITIC.md`, `docs/GAME-AS-COURSE.md`, `docs/GAME-UX-SYSTEM.md`, `docs/GAME-UX-REVIEW.md`, and `docs/COURSE-GENERATION-GAME-SYSTEM.md` before substantial product work. `docs/PLAY-CANVAS.md` and `docs/THREE-STORY-FRAMEWORK.md` now describe legacy/migration state and are not the strategic architecture.

## 1. Product north star

VibeLearn is a **general system for generating effective learning games/worlds for arbitrary subjects and concepts**. How LLMs Work / The First Words is the current proof track; Relay Rescue/Echo Forge is a historical authored reference and migration baseline.

The durable generation boundary is:

`LearningSpec -> StoryWorldSpec -> GameDesignSpec -> GameRulesSpec + WorldSpec -> RuntimeExperienceSpec -> EngineCompiler -> EngineRuntime`

with `AssessmentEvidenceSpec` remaining authoritative and engine-independent throughout.

The system must be able to regenerate story, mechanics, world, assets or engine target without corrupting canonical competency/evidence identity.

## 2. Strategic engine decision

VibeLearn must not grow a custom game engine on top of Three.js.

**PlayCanvas Engine is the first strategic runtime/backend target.** It is currently the best fit for the product because delivery is web/phone-first while generated games need real engine primitives: entities/components, animation, physics, input, audio, asset management and WebGL/WebGPU.

Three.js is now **legacy/migration infrastructure only**.

Do not add new generic Three.js engine capabilities unless they are strictly required to preserve/verify the current reference while it is being migrated.

Future backends may include Unity, Unreal, specialized 2D engines, simulation runtimes or other engines. The canonical game/world specs must remain independent of all of them.

See `docs/GAME-RUNTIME-ARCHITECTURE.md`.

## 3. Engine-neutral generated specs

### LearningSpec

Owns competencies, prerequisites, sources/provenance, misconceptions, intended outcomes, transfer/retrieval and assessment requirements.

### StoryWorldSpec

Owns premise, characters, locations, causal world rules, important resources/objects, stakes, emotional/progression arc and mapping back to concepts.

### GameDesignSpec

Owns actual game design: core loop, player verbs, mechanics, challenge/mission graph, difficulty curve, failure/recovery, rewards/payoff, tutorial/scaffolding policy, information schedule and mappings from play to learning outcomes.

### GameRulesSpec

Owns renderer-independent deterministic gameplay semantics: typed/bounded state, semantic actions, preconditions, transitions/effects, invariants, objectives, semantic events, seeded randomness contracts when required, and deterministic serialization/replay. It contains no engine objects, arbitrary generated code, assessment writes or learner mastery.

The Phase 1 interpreter is already implemented and tested on both retry/idempotency semantics and an unrelated resource loop. Relay Rescue server behavior remains authoritative while equivalent semantic state/events are mapped incrementally.

### WorldSpec

Owns engine-neutral executable world structure: scenes/zones, entities, semantic components, transforms, assets, physics intent, animation intent, cameras, lights, interactions, triggers, navigation intent, effects, world variables and prefab/archetype references.

### RuntimeExperienceSpec

Owns cross-engine runtime orchestration: game modes, active world, input/action mapping, HUD/UI slots, pause/replay/save/resume, accessibility/reduced motion, performance budgets and authoritative-state -> visible-state mapping.

### AssessmentEvidenceSpec

Owns evidence semantics. Rendering, collisions, effects or local game state never establish mastery by themselves.

## 4. Compiler/runtime architecture

Every engine implementation must sit behind an `EngineCompiler` / runtime adapter boundary.

Conceptual build path:

`Learning/Story/GameDesign + GameRulesSpec + WorldSpec + RuntimeExperienceSpec + AssetManifest + EngineTargetSpec -> validate -> compile -> EngineArtifactBundle -> runtime`

Backend capabilities include approximately:

- world load/unload;
- entity instantiate/destroy;
- state synchronization;
- animation/effect/audio;
- cameras;
- physics/collision;
- semantic interactions;
- HUD/UI binding;
- input;
- pause/resume;
- save/restore presentation state;
- performance/failure reporting;
- disposal.

Backend code never owns canonical competency IDs, assessment rules or learner mastery.

## 5. Generated games are spec-first, not code-first

The desired generation pipeline is:

`course intent -> source grounding -> LearningSpec -> StoryWorldSpec -> story critic -> GameDesignSpec -> GameRulesSpec + WorldSpec + RuntimeExperienceSpec -> capability validation -> engine compile -> runtime verification -> first-touch critic -> whole-game critic -> learning/transfer critic -> user review`

Generated games should mostly be **validated specs/data + assets**.

Arbitrary generated JavaScript/C#/C++ is not the normal authoring model. Custom code is a later exceptional extension point with stronger review/sandbox requirements.

## 6. Reusable world/game framework

Build a versioned engine-neutral primitive/archetype library from real game requirements.

Candidate semantic primitives include:

- interactable;
- resource/collectible;
- inventory;
- control/switch;
- movable/attachable object;
- route/network;
- timer/cooldown;
- simulation variable/meter;
- character/NPC state;
- trigger zone;
- puzzle constraint;
- build/crafting slots;
- projectile/flow/message;
- camera focus/cinematic beat;
- mission objective;
- success/failure consequence;
- semantic HUD indicator.

Candidate archetypes include characters, interactive machines, resource-flow systems, networks, puzzle boards, environment zones and dialogue NPCs.

The same semantic primitive may compile differently on PlayCanvas, Unity or Unreal.

Do not speculatively build a universal engine. Add versioned primitives when concrete learning games demand them.

## 7. Asset portability

WorldSpec references immutable `AssetRef`s rather than engine-native object identity.

Track id/version/hash, provenance/license, semantic role, source format, derived engine variants and performance metadata. The implemented PlayCanvas path already pins verified GLB bytes at build time, serves them same-origin, keeps normalization and semantic animation aliases in WorldSpec, maps imported descendants back to semantic entities, retains primitive fallbacks, and reports imported bounds for measured normalization.

Prefer portable interchange formats where practical (for example glTF for 3D assets) so future engine migration is feasible.

## 8. PlayCanvas backend — immediate target

Use PlayCanvas Engine programmatically as the primary runtime. The PlayCanvas Editor may assist authoring/debugging, but editor project state must not become canonical product state.

Initial PlayCanvas backend proof must demonstrate from specs:

1. create/load a world;
2. instantiate entities/archetypes;
3. semantic player interaction;
4. camera transitions;
5. animation/effects;
6. physics/collision where needed;
7. touch + keyboard input mapping;
8. HUD binding;
9. authoritative game-state synchronization;
10. save/resume presentation state;
11. reduced motion/accessibility behavior;
12. cleanup/failure reporting.

Then a materially different synthetic world must compile through the same backend without core/backend edits.

## 9. Three.js migration policy

Current Story3D/Play-Canvas-named code remains a reference while migration happens:

- `web/story3d-runtime.js`;
- `web/story3d-world-host.js`;
- `web/rescue-story3d.js`;
- `web/play-canvas.js`;
- `web/play-canvas-migrate.js`.

Rules:

- freeze new framework expansion on Three.js;
- extract semantic concepts into engine-neutral specs;
- do not encode new generated-world contracts using Three.js classes/API names;
- implement equivalent PlayCanvas behavior behind the new engine boundary;
- port Echo Forge opening + Signal 1 first;
- compare quality/performance/authoring friction;
- migrate later signals after the compiler/backend seam is proven;
- remove Three.js infrastructure only after equivalent behavior/tests/critic quality are achieved.

The old internal term **“Play Canvas”** must not be used as the strategic abstraction because it conflicts with the PlayCanvas engine name. Existing code/file names may remain during migration; new architectural code should use `RuntimeExperience`, `GameRuntime`, `WorldRuntime`, or similarly unambiguous terminology.

## 10. First-touch and Chapter 1 contract

The opening must earn attention before increasing cognitive load.

Default curve:

`beauty / curiosity / story hook -> character + world desire -> concrete need -> one obvious action -> visible consequence -> easy recovery/success -> formal concept -> variation -> combination -> transfer`

By the end of Chapter 1 a bright child/non-specialist should understand who/what matters, important entities/resources, what happened, why it matters, what the player can do, what success/failure means and how world behavior maps to the real concept.

Prefer dramatized action, environmental storytelling, direct manipulation and visible consequence over lesson prose.

First-run narrative progression is user-paced by default. Back/previous, Continue, Skip, Replay and visible progress are required where applicable. Pause/Resume is required while motion runs. Reduced motion preserves causal meaning/navigation.

## 11. Quality gates

Follow [docs/CRITIC-POLICY.md](docs/CRITIC-POLICY.md). Review written design for feasibility, then inspect rendered story, first touch, the full playable chapter and learning/transfer even when an earlier part fails. Each criterion needs observed evidence and an anchored integer; readiness requires every criterion >=9, no blocker and complete applicable checks. No weighted averages or inherited scores. User-requested previews are not readiness or acceptance. The current user is the sole human product critic and final authority.

## 12. Phone-first target

Current delivery remains mainstream Android/iPhone portrait first, roughly **360–430 CSS px** wide with common tall aspect ratios, touch, safe areas, text enlargement and reduced motion.

PlayCanvas is attractive specifically because it keeps the primary runtime web-native for this phase.

Desktop polish follows after phone quality is strong.

## 13. Current execution order

**Implementation authorized 15 September:** GitHub research and reuse inventory are in `docs/REUSE-RESEARCH-20260915.md`; execute the bounded first-episode contract in `docs/LLM-EPISODE-1-IMPLEMENTATION.md`.

1. Keep the deployed retry reference and learner history intact; preserve the September 15 browser findings as the baseline.
2. Apply the critic-policy reset and validate its evidence record before recommending another candidate.
3. Use [docs/NEXT-TEACHING-DESIGN.md](docs/NEXT-TEACHING-DESIGN.md): the user selected an appealing ongoing How LLMs Work series. Freeze the first episode's narrow learning contract and toy-model limits. The series is a content roadmap, not Phase 2 authorization.
4. Implement one reusable, continuous Episode 1 opening/action/result path with new learning identities, using existing PlayCanvas and authoritative semantic actions. No new model provider, general engine or broad series implementation is required.
5. Actually play the path on desktop and 360/390/430, including failure, recovery, post-save controls and fresh transfer. Repair concrete clarity/HUD/control blockers before extending it.
6. Run applicable storage/build/browser checks and record exact revision, evidence and limitations. Existing retry acceptance tests remain intact.
7. Present the honest candidate and internal recommendation for the current user's final verdict. Deployment requires applicable authorization and exact technical verification; critic scores do not authorize it.

## 14. Future engine targets

Unity/Unreal are future backend possibilities, not current dependencies.

The point of the engine-neutral spec/compiler layer is to make them feasible later when their quality/tooling justifies deployment cost.

Do not force identical engine capabilities. `EngineTargetSpec` declares supported features/costs and the game generator adapts/selects a compatible design.

A future portability proof should compile one engine-neutral synthetic WorldSpec to at least two backends without changing LearningSpec/AssessmentEvidenceSpec.

## 15. Engineering/evidence invariants

Protect learner isolation, immutable submitted evidence, pinned assessment meaning, source/provenance constraints, explicit assistance, evidence identity, course-independent competencies, restart/reload behavior and the difference between verification, acceptance and activation.

Keep `unknown`, `declared_independent`, current `assisted` and `previously_exposed` distinct. XP never establishes mastery. Prior exposure is not current help. Rendering/world state never establishes learning evidence merely because an animation happened.

Build in bounded increments: inspect baseline -> define executable acceptance -> implement smallest complete path -> run focused tests -> run persistence/security checks -> exercise actual UI -> inspect evidence -> update docs/state -> continue.

Do not weaken tests or critic rubrics to make a candidate pass.

## 16. Security boundary

Generated specs/data do not authorize arbitrary code execution.

Prefer validated schemas, allowlisted/versioned primitives, immutable artifacts, asset validation, capability validation, strict CSP/no eval, provenance linking and sandboxed extension points when custom behavior is eventually necessary.

## 17. Scope and deployment

Current work remains private Phase 1 architecture/reference refinement. Do not open external testing, paid infrastructure expansion, untrusted execution, new model/provider integration or public rollout without explicit authorization.

Render serves `deploy/render-supabase`; auto-deploy is disabled. Deploy only an exact verified candidate intended for review, then verify the served revision.

## Foundation: games generated from learning needs and preferences

User reaffirmed the ultimate product goal on 13 September 2026: generate games on demand from what a user needs to learn and their explicit preferences. Echo Forge is the reference, not the framework. LearningSpec, explicit UserPreference/StoryPreference inputs, StoryWorldSpec, GameDesignSpec, GameRulesSpec, WorldSpec, RuntimeExperienceSpec and versioned AssetRefs must compose through shared validators/runtime. Canonical learning and evidence cannot depend on theme, assets or engine. Preferences may influence setting, tone, presentation, pace and interaction style without weakening outcomes or assessment. Never infer unstated preferences.

Implement the opening/tutorial/HUD/progression as reusable, spec-driven capabilities and assets; keep Echo Forge dialogue, beats, cameras and object IDs in the reference package. New games must not require copied opening controllers or new renderer lifecycles. Prove a materially different fixture through shared components. This foundations work does not claim that an on-demand generator/model integration is already implemented or authorize unrelated Phase 2 work.


## Current user review checkpoint

**15 September 2026:** [docs/CRITIC-POLICY.md](docs/CRITIC-POLICY.md) controls review. The user may inspect a draft at any time; a preview is not an internal ready recommendation, acceptance or deployment authorization. The current user is the sole human product critic and final authority.
