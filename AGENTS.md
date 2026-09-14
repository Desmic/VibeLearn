# vibeLearn

**Current review amendment — 14 September 2026:** Implement the current third-person/free-camera and full-screen mobile review requirements before the next handoff. Update docs first, keep reusable spec-driven input/navigation, and verify actual UI with computer/browser use. Read [GAME-CAMERA-INPUT.md](docs/GAME-CAMERA-INPUT.md).

**Current user contract — 13 September 2026:** Read [docs/GAME-OPENING-PROGRESSION.md](docs/GAME-OPENING-PROGRESSION.md) before implementation or review. The `16a655e` experience was user-rejected. Require a first-entry skippable 3D opening, tutorial with early success, gradual progression, optional non-destructive replay at every level, and no automatic opening for Level 2+ players. Remove the 2D gameplay fallback; preserve accessible HUD controls and honest 3D recovery. This amendment supersedes conflicting legacy guidance below.

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

1. reconcile active docs with `docs/GAME-OPENING-PROGRESSION.md`, freeze/review story and progression before realization;
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

Current work remains private Phase 1 architecture/reference refinement. Production Render serves `deploy/render-supabase`; auto-deploy is disabled. Active PlayCanvas work continues on `phase1/world-transfer` / PR #8. Verify exact revision before saying work is live or ready for review.

## Opening and review enforcement

Read `docs/GAME-OPENING-PROGRESSION.md`. First login must introduce the 3D world and stakes before tutorial/Level 1; Skip remains available. Level 2+ must never auto-replay an opening. Explicit menu replay returns to the untouched prior context. Remove the 2D gameplay fallback, not keyboard/screen-reader HUD semantics. Verify actual learner entry and hosted asset delivery, not only synthetic fresh contexts or canvas tags. Update every materially affected active doc before code. The latest rejection supersedes the previous bounded Signal 7 preview exception.

## Foundation: games generated from learning needs and preferences

User reaffirmed the ultimate product goal on 13 September 2026: generate games on demand from what a user needs to learn and their explicit preferences. Echo Forge is the reference, not the framework. LearningSpec, explicit UserPreference/StoryPreference inputs, StoryWorldSpec, GameDesignSpec, GameRulesSpec, WorldSpec, RuntimeExperienceSpec and versioned AssetRefs must compose through shared validators/runtime. Canonical learning and evidence cannot depend on theme, assets or engine. Preferences may influence setting, tone, presentation, pace and interaction style without weakening outcomes or assessment. Never infer unstated preferences.

Implement the opening/tutorial/HUD/progression as reusable, spec-driven capabilities and assets; keep Echo Forge dialogue, beats, cameras and object IDs in the reference package. New games must not require copied opening controllers or new renderer lifecycles. Prove a materially different fixture through shared components. This foundations work does not claim that an on-demand generator/model integration is already implemented or authorize unrelated Phase 2 work.


## Current user review checkpoint

The user's execution instruction remains: fix clear blockers, verify the complete exact candidate and its rendered desktop/phone evidence, deploy the verified candidate manually, then let the user review it. Do not start another broad art/architecture pass merely to raise an internal score before that review. The later opening/progression/foundation feedback changes what this candidate must contain; it does not turn CI or a critic score into user acceptance.

For this expressly authorized review checkpoint, the exact candidate must be technically green, visually reviewable, and free of identified concrete interaction/causal blockers. Report internal critic scores honestly as diagnostics. The >=9 story/first-touch/whole-game/learning gates remain the full product acceptance target; they must not be claimed passed or used to imply Phase 2 authorization. A deployed review candidate is not an accepted product. This clarification supersedes statements that revoked the user's bounded review instruction solely because the opening requirements changed.
