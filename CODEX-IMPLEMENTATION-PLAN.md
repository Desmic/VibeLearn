# Learning OS — incremental implementation plan 2.0

**Current user contract — 13 September 2026:** Read [docs/GAME-OPENING-PROGRESSION.md](docs/GAME-OPENING-PROGRESSION.md) before implementation or review. The `16a655e` experience was user-rejected. Require a first-entry skippable 3D opening, tutorial with early success, gradual progression, optional non-destructive replay at every level, and no automatic opening for Level 2+ players. Remove the 2D gameplay fallback; preserve accessible HUD controls and honest 3D recovery. This amendment supersedes conflicting legacy guidance below.

**12 September 2026 · authoritative active plan**

This file is the current build order. The checksummed `learning-os-design-package-v1.3/` remains immutable historical design. Its detailed phase/security/evidence requirements still apply wherever this plan does not supersede them.

Read, in order, `docs/STATE.md`, `docs/GAME-RUNTIME-ARCHITECTURE.md`, `docs/STORY-GENERATION-AND-CRITIC.md`, `docs/GAME-AS-COURSE.md`, `docs/GAME-UX-SYSTEM.md`, `docs/GAME-UX-REVIEW.md`, and `docs/COURSE-GENERATION-GAME-SYSTEM.md` before substantial product work. `docs/PLAY-CANVAS.md` and `docs/THREE-STORY-FRAMEWORK.md` now describe legacy/migration state and are not the strategic architecture.

## 1. Product north star

VibeLearn is a **general system for generating effective learning games/worlds for arbitrary subjects and concepts**. Relay Rescue/Echo Forge is only the current authored reference slice.

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

Do not blend scores.

Required order:

`story critic >=9 -> first-touch magic >=9 -> whole-chapter game >=9 -> learning/transfer >=9 -> user review`

All applicable scores are unrounded and require no blocker.

Engine/framework quality earns zero automatic game-quality points. A technically elegant PlayCanvas build can still fail badly as a game or as learning.

The current user's explicit verdict remains final.

## 12. Phone-first target

Current delivery remains mainstream Android/iPhone portrait first, roughly **360–430 CSS px** wide with common tall aspect ratios, touch, safe areas, text enlargement and reduced motion.

PlayCanvas is attractive specifically because it keeps the primary runtime web-native for this phase.

Desktop polish follows after phone quality is strong.

## 13. Current execution order

1. Reconcile active docs with the confirmed GAME-OPENING-PROGRESSION contract; record latest rejection honestly.
2. Freeze and review the existing Echo Forge story revision and staged information/progression schedule.
3. Implement the first-authenticated-entry / skip / Level 2+ resume / non-destructive replay state matrix using authoritative progress.
4. Stage the continuous 3D opening, safe first success, contextual tutorial and Signal 1 payoff; remove 2D gameplay fallback and add honest failure recovery.
5. Inspect desktop and 360/390/430px opening/tutorial evidence; fix clear composition and interaction blockers.
6. Verify Signals 2–7 preserve full 3D world/HUD identity and progressively introduce demand without breaking learning semantics.
7. Run full unit/PostgreSQL/static/browser checks, including real hosted asset delivery and current-player entry paths.
8. Run exact-candidate story, first-touch, whole-game and learning reviews separately. Historical scores do not pass a new candidate.
9. Deploy only an exact verified candidate authorized for review; verify Render source and engine/model bytes, then obtain the user's decisive review.

Do not expand into AAA scope, new unrelated stories, or broad engine architecture to avoid fixing the entry and progression experience.

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

The user's execution instruction remains: fix clear blockers, verify the complete exact candidate and its rendered desktop/phone evidence, deploy the verified candidate manually, then let the user review it. Do not start another broad art/architecture pass merely to raise an internal score before that review. The later opening/progression/foundation feedback changes what this candidate must contain; it does not turn CI or a critic score into user acceptance.

For this expressly authorized review checkpoint, the exact candidate must be technically green, visually reviewable, and free of identified concrete interaction/causal blockers. Report internal critic scores honestly as diagnostics. The >=9 story/first-touch/whole-game/learning gates remain the full product acceptance target; they must not be claimed passed or used to imply Phase 2 authorization. A deployed review candidate is not an accepted product. This clarification supersedes statements that revoked the user's bounded review instruction solely because the opening requirements changed.
