# vibeLearn

**Read `CODEX-IMPLEMENTATION-PLAN.md` first**, then `docs/STATE.md`, `docs/GAME-RUNTIME-ARCHITECTURE.md`, `docs/GAME-RULES-SPEC.md`, `docs/STORY-GENERATION-AND-CRITIC.md`, `docs/GAME-AS-COURSE.md`, `docs/GAME-UX-SYSTEM.md`, `docs/GAME-UX-REVIEW.md`, and `docs/COURSE-GENERATION-GAME-SYSTEM.md` before substantial product work.

The active implementation plan controls build order. User feedback that changes product direction, generation assumptions, engine/runtime architecture, quality gates or the meaning of done must update the plan and materially affected current docs before or in the same bounded implementation unit as code.

## Product north star

VibeLearn is a **general learning-game/world generation system**. The goal is to generate effective games/worlds for arbitrary concepts and subjects, not to build Relay Rescue, a Three.js application or a collection of hand-written PlayCanvas scenes.

The strategic generation/runtime chain is:

`LearningSpec -> StoryWorldSpec -> GameDesignSpec -> GameRulesSpec + WorldSpec -> RuntimeExperienceSpec -> EngineCompiler -> EngineRuntime`

`AssessmentEvidenceSpec` remains independent of game-success and engine/runtime truth.

Canonical competency/evidence identity must not depend on story names, engine, renderer, visual style, assets, world-package versions or runtime implementation.

## Strategic engine direction

**PlayCanvas Engine is the first strategic backend and Phase 1 itself must use it.**

Three.js is **legacy/migration infrastructure only**. Do not expand `story3d-runtime.js` / `story3d-world-host.js` into a home-grown general game engine. Add Three.js code only when needed to preserve or verify the current reference while porting it.

The old internal architecture name **“Play Canvas”** is deprecated because it conflicts with the actual PlayCanvas Engine name. Existing `play-canvas*.js` files may remain during migration; new architectural code should use unambiguous names such as `RuntimeExperience`, `GameRuntime`, `WorldRuntime`, `EngineCompiler`, `GameRulesSpec`, and `EngineTargetSpec`.

## Spec-first generated games

Generated games should primarily be validated **specs/data + assets**, not fresh engine glue.

- `LearningSpec`: competencies, prerequisites, sources, misconceptions, outcomes, transfer/retrieval.
- `StoryWorldSpec`: premise, characters, locations, causal world rules, stakes and concept mappings.
- `GameDesignSpec`: core loop, player verbs, mechanics, missions/challenges, progression, failure/recovery and payoff.
- `GameRulesSpec`: engine-neutral state, semantic actions, preconditions, deterministic transitions, invariants, resources, objectives, success/failure and semantic events.
- `WorldSpec`: engine-neutral scenes/entities/components, assets, spatial/physics/animation intent, cameras and interaction anchors.
- `RuntimeExperienceSpec`: runtime modes, input/action mapping, HUD slots, pause/replay/save/resume UX, accessibility, performance budgets and rule/world presentation mappings.
- `EngineTargetSpec`: backend capabilities/constraints.
- `AssessmentEvidenceSpec`: evidence meaning; never decided by renderer state or game success alone.

Arbitrary generated JavaScript/C#/C++ is not the normal authoring path. Custom code is a later exceptional extension point with stronger review/sandboxing.

## GameRulesSpec boundary

A scene graph is not a game engine-neutral contract. Learning-critical gameplay rules must not live in PlayCanvas event handlers, DOM callbacks, Unity scripts or Unreal actors.

GameRulesSpec should be executed by a small validated/allowlisted deterministic interpreter or authoritative domain implementation. It owns portable game state and semantic transitions. PlayCanvas binds input and presentation to semantic action/state/event IDs.

For the current hosted system:

- server-authoritative commands remain truth;
- browser/engine prediction is presentation only;
- invalid/impossible actions fail closed;
- deterministic/seeded replay must be possible for learning-critical mechanics;
- raw collision/input/animation callbacks cannot establish assessment evidence;
- existing Relay Rescue correctness/persistence tests must not be weakened to make the abstraction look cleaner.

Build the rules vocabulary from concrete games, not a speculative universal DSL. Read `docs/GAME-RULES-SPEC.md`.

## Reusable game/world framework

Build versioned engine-neutral mechanics, primitives and archetypes only as real learning games require them. Examples include interactables, resources, switches, movable/attachable objects, routes/networks, timers, simulation variables, NPC states, trigger zones, puzzle constraints, build slots, flows/projectiles, camera beats, objectives and semantic HUD indicators.

The same mechanic/world primitive may compile or present differently in PlayCanvas, Unity, Unreal or another future backend while preserving semantic action/state/event identity.

Do not create a speculative universal engine.

## PlayCanvas backend proof

The first backend should programmatically use PlayCanvas Engine and prove from specs:

- world/entity creation;
- semantic interaction binding;
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

PlayCanvas is infrastructure, not proof of game quality. A technically correct engine port can still score 3/10 as a game.

## Migration/build order

1. keep docs aligned with the engine-neutral/rules-neutral direction;
2. keep generic Three.js expansion frozen;
3. make the persistent direct PlayCanvas opening -> Signal 1 runtime/browser gate green;
4. inspect fresh 360/390/430 portrait evidence and improve world-first composition/agency;
5. implement the minimal GameRulesSpec schema/interpreter and renderer-free tests;
6. prove a second unrelated mechanic through the same rules contract;
7. bind Echo Forge server-authoritative state/events through semantic rules/runtime IDs without weakening evidence semantics;
8. migrate Signals 2–7 through the same PlayCanvas game/runtime architecture;
9. remove legacy Play Canvas/Three names and code only after equivalent behavior and tests are green;
10. run exact-build critics and repair until every required >=9/no-blocker gate passes;
11. deploy only the exact verified candidate, verify served revision, then request user review.

## Game-first quality invariants

Meaningful play must embody subject thinking: investigate, manipulate, compare, arrange, construct, diagnose, test, explore or control systems where those actions map to the capability.

Difficulty rises through reasoning, transfer, uncertainty, trade-offs and reduced scaffolding—not longer prompts or denser dashboards.

World first, HUD second: the primary phone frame should feel like inhabiting/operating a game world, not a website surrounding a small renderer.

Required gate order:

`story/world critic >=9 -> first-touch gameplay >=9 -> whole-game gameplay >=9 -> learning/transfer >=9 -> user review`

Architecture/security/runtime are additional hard gates and earn zero automatic critic points.

The current user's explicit verdict remains final.

## Primary device target

Current refinement is phone-first for mainstream Android/iPhone portrait use, roughly **360–430 CSS px** wide with touch, safe areas, text enlargement and reduced motion. Desktop follows after phone quality is strong.

Camera/composition is a phone-first authored/runtime concern, not a desktop shot mechanically squeezed narrower.

## Engineering/evidence

Preserve hosted auth, PostgreSQL/RLS, learner isolation, server-authoritative progression/evidence, submitted-evidence immutability, reset confirmation and historical review.

Rendering/world/game state never becomes learning evidence merely because an animation, collision, game clear or client event occurred. AssessmentEvidenceSpec decides what can support a learning claim.

Build in bounded, testable increments and do not weaken tests/critic rubrics to make a candidate pass.

## Scope/deployment

Current work remains private Phase 1 architecture/reference refinement. Production Render serves `deploy/render-supabase`; auto-deploy is disabled. Active PlayCanvas work is isolated on `phase1/playcanvas-engine` / draft PR #5. Verify exact revision before saying work is live or ready for review.
