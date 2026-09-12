# Three.js story framework — legacy migration reference

**Status:** legacy/migration only · superseded strategically on 12 September 2026  
**Authoritative replacement:** `GAME-RUNTIME-ARCHITECTURE.md` and root `CODEX-IMPLEMENTATION-PLAN.md` 2.0.

## Decision

Three.js is no longer the strategic framework for generated VibeLearn games/worlds.

The product goal is to generate playable learning worlds/games for arbitrary concepts and subjects. Continuing to generalize renderer/camera/lifecycle infrastructure on top of Three.js would move VibeLearn toward maintaining its own game engine, which is not the desired long-term direction.

**PlayCanvas Engine is the first strategic engine backend.**

The durable architecture is engine-neutral:

`LearningSpec -> StoryWorldSpec -> GameDesignSpec -> WorldSpec -> RuntimeExperienceSpec -> EngineCompiler -> EngineRuntime`

Future backends may include Unity, Unreal or other runtimes without changing canonical learning/evidence identity.

## What the existing Three.js work is still useful for

Current files such as:

- `web/story3d-runtime.js`;
- `web/story3d-world-host.js`;
- `web/rescue-story3d.js`;
- Three.js-focused tests;

remain useful as:

- a behavioral reference for Echo Forge;
- a migration baseline;
- evidence about phone/runtime/fallback needs;
- a source of semantic concepts to extract into engine-neutral specs;
- a comparison target for PlayCanvas performance and experience.

They are not the foundation for future generated worlds.

## Freeze rule

Do not add generic Three.js framework features unless needed to keep the current reference functional or to support a bounded migration verification.

In particular, do not spend new effort generalizing:

- renderer lifecycle;
- camera rigs;
- physics/gameplay systems;
- animation state frameworks;
- asset pipelines;
- input frameworks;
- entity/component systems;
- world-package loaders;
- cross-course primitive libraries;

on top of Three.js.

Those capabilities belong either in engine-neutral specs/framework semantics or in the PlayCanvas backend.

## Migration approach

1. identify semantic behavior currently embedded in Story3D code;
2. represent it through `GameDesignSpec`, `WorldSpec` and `RuntimeExperienceSpec`;
3. implement required backend primitives in PlayCanvas;
4. port Echo Forge opening + Signal 1;
5. compare behavior, authoring friction, phone performance and quality;
6. migrate later signals after the new seam is proven;
7. remove Three.js dependencies only after parity/tests/critics are green.

Do not perform a risky one-shot rewrite merely to remove the dependency faster.

## Evidence boundary remains unchanged

Three.js and PlayCanvas are presentation/game-runtime technologies. Neither engine owns learner truth.

Authoritative progression, evidence, assistance/exposure semantics and learner history remain server/model concerns outside the engine runtime.

A renderer event, collision, animation or local client state never establishes mastery by itself.

## Historical note

The earlier reusable Story3D framework work was directionally useful because it exposed the need for stable world/runtime contracts. The new architecture generalizes that lesson one level higher: **the contract must be portable across game engines, not merely reusable across Three.js worlds**.
