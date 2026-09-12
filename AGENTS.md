# vibeLearn

**Read `CODEX-IMPLEMENTATION-PLAN.md` first**, then `docs/GAME-RUNTIME-ARCHITECTURE.md`, `docs/STATE.md`, `docs/STORY-GENERATION-AND-CRITIC.md`, `docs/GAME-AS-COURSE.md`, `docs/GAME-UX-SYSTEM.md`, `docs/GAME-UX-REVIEW.md`, and `docs/COURSE-GENERATION-GAME-SYSTEM.md` before substantial product work.

The active implementation plan controls build order. User feedback that changes product direction, generation assumptions, engine/runtime architecture, quality gates or the meaning of done must update the plan and materially affected current docs before or in the same bounded implementation unit as code.

## Product north star

VibeLearn is a **general learning-game/world generation system**. The goal is to generate effective games/worlds for arbitrary concepts and subjects, not to build Relay Rescue or a Three.js application.

The strategic generation/runtime chain is:

`LearningSpec -> StoryWorldSpec -> GameDesignSpec -> WorldSpec -> RuntimeExperienceSpec -> EngineCompiler -> EngineRuntime`

`AssessmentEvidenceSpec` remains independent of engine/runtime truth.

Canonical competency/evidence identity must not depend on story names, engine, renderer, visual style, assets, world-package versions or runtime implementation.

## Strategic engine direction

**PlayCanvas Engine is the first strategic backend** for the current web/phone-first product.

Three.js is **legacy/migration infrastructure only**. Do not expand `story3d-runtime.js` / `story3d-world-host.js` into a home-grown general game engine. Add Three.js code only when needed to preserve or verify the current reference while porting it.

The old internal architecture name **“Play Canvas”** is deprecated because it conflicts with the actual PlayCanvas Engine name. Existing `play-canvas*.js` files may remain during migration; new architectural code should use unambiguous names such as `RuntimeExperience`, `GameRuntime`, `WorldRuntime`, `EngineCompiler`, and `EngineTargetSpec`.

## Spec-first generated games

Generated games should primarily be validated **specs/data + assets**, not fresh engine glue.

- `LearningSpec`: competencies, prerequisites, sources, misconceptions, outcomes, transfer/retrieval.
- `StoryWorldSpec`: premise, characters, locations, causal world rules, stakes and concept mappings.
- `GameDesignSpec`: core loop, player verbs, mechanics, missions/challenges, progression, failure/recovery and payoff.
- `WorldSpec`: engine-neutral scenes/entities/components, assets, physics/animation intent, cameras, interactions, triggers, navigation and world variables.
- `RuntimeExperienceSpec`: runtime modes, input/action mapping, HUD slots, pause/replay/save/resume, accessibility, performance budgets and visible-state mappings.
- `EngineTargetSpec`: backend capabilities/constraints.
- `AssessmentEvidenceSpec`: evidence meaning; never decided by renderer state.

Arbitrary generated JavaScript/C#/C++ is not the normal authoring path. Custom code is a later exceptional extension point with stronger review/sandboxing.

## Reusable game/world framework

Build versioned engine-neutral primitives/archetypes only as real learning games require them. Examples include interactables, resources, switches, movable/attachable objects, routes/networks, timers, simulation variables, NPC states, trigger zones, puzzle constraints, build slots, flows/projectiles, camera beats, objectives and semantic HUD indicators.

The same primitive may compile differently to PlayCanvas, Unity, Unreal or another future backend.

Do not create a speculative universal engine.

## PlayCanvas backend proof

The first backend should programmatically use PlayCanvas Engine and prove from specs:

- world/entity creation;
- semantic interactions;
- cameras;
- animation/effects;
- touch + keyboard input;
- HUD binding;
- authoritative state synchronization;
- save/resume presentation state;
- reduced motion/accessibility;
- physics where needed;
- performance/failure reporting;
- cleanup.

Then compile a materially different synthetic world through the same backend without backend-core edits.

## Migration order

1. keep docs aligned with this engine-neutral direction;
2. freeze Three.js framework expansion;
3. define versioned game/world/runtime/engine/asset schemas;
4. define EngineCompiler/runtime adapter interfaces;
5. add a pinned/self-hosted PlayCanvas Engine path;
6. build a tiny spec-driven PlayCanvas vertical slice;
7. prove a second unrelated world;
8. port Echo Forge opening + Signal 1;
9. compare quality/performance/authoring friction with the Three.js predecessor;
10. migrate later signals after the backend/spec seam is proven;
11. remove Three.js infrastructure only after parity, tests and quality gates.

## Game-first quality invariants

Meaningful play must embody subject thinking: investigate, manipulate, compare, arrange, construct, diagnose, test, explore or control systems where those actions map to the capability.

Difficulty rises through reasoning, transfer, uncertainty, trade-offs and reduced scaffolding—not longer prompts or denser dashboards.

Required gate order:

`story critic >=9 -> first-touch magic >=9 -> whole-chapter game >=9 -> learning/transfer >=9 -> user review`

Engine/framework sophistication earns zero automatic critic points.

The current user's explicit verdict remains final.

## Primary device target

Current refinement is phone-first for mainstream Android/iPhone portrait use, roughly **360–430 CSS px** wide with touch, safe areas, text enlargement and reduced motion. Desktop follows after phone quality is strong.

## Engineering/evidence

Preserve hosted auth, PostgreSQL/RLS, learner isolation, server-authoritative progression/evidence, submitted-evidence immutability, reset confirmation and historical review.

Rendering/world state never becomes learning evidence merely because an animation, collision or client event occurred.

Build in bounded, testable increments and do not weaken tests/critic rubrics to make a candidate pass.

## Scope/deployment

Current work remains private Phase 1 architecture/reference refinement. Render serves `deploy/render-supabase`; auto-deploy is disabled. Verify exact revision before saying work is live.
