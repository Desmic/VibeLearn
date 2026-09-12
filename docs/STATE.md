# Current checkpoint — PlayCanvas backend pivot

Updated 12 September 2026. **Status: `user_rejected` / `needs_revision`.** The current user's explicit verdict remains authoritative until a materially changed verified/deployed candidate is reviewed.

## Latest direction

VibeLearn's objective is to **generate effective learning games/worlds for arbitrary concepts and subjects**.

The architecture therefore moves away from Three.js as a strategic foundation. Three.js remains only as temporary reference/migration infrastructure for the current Echo Forge implementation.

**PlayCanvas Engine is the first strategic backend** for the current browser/phone-first product.

The durable architecture is engine-neutral and spec-driven:

`LearningSpec -> StoryWorldSpec -> GameDesignSpec -> WorldSpec -> RuntimeExperienceSpec -> EngineCompiler -> EngineRuntime`

`AssessmentEvidenceSpec` remains outside engine truth.

Future backends may include Unity, Unreal, specialized 2D/simulation engines or other runtimes without changing canonical learning/evidence identity.

Read root `CODEX-IMPLEMENTATION-PLAN.md` **2.0** and `docs/GAME-RUNTIME-ARCHITECTURE.md` as current authority.

## Naming correction

The old internal architecture name **“Play Canvas”** is deprecated because it conflicts with the actual PlayCanvas Engine name. Existing `play-canvas*.js` files may remain during migration, but new architecture/code should use unambiguous runtime/compiler names.

`docs/PLAY-CANVAS.md` and `docs/THREE-STORY-FRAMEWORK.md` are now legacy migration references.

## Generated framework target

Generated games should primarily be validated specs/data + assets:

- `LearningSpec` — learning identity/outcomes/sources;
- `StoryWorldSpec` — semantic story/world;
- `GameDesignSpec` — mechanics, core loop, challenge graph and progression;
- `WorldSpec` — engine-neutral scenes/entities/components/assets/interactions/physics/animation intent;
- `RuntimeExperienceSpec` — modes, input, HUD, save/resume, accessibility, performance and visible-state mapping;
- `EngineTargetSpec` — backend capabilities/constraints;
- `AssessmentEvidenceSpec` — authoritative evidence meaning.

The framework should expose reusable engine-neutral primitives/archetypes that compile differently per backend rather than requiring freshly generated renderer/game-engine glue for each course.

## Immediate implementation order

1. freeze generic Three.js framework expansion;
2. define versioned game/world/runtime/engine/asset schemas;
3. define EngineCompiler/runtime adapter interfaces;
4. add a pinned/self-hosted PlayCanvas Engine path;
5. build a tiny spec-driven PlayCanvas vertical slice;
6. compile a second unrelated synthetic world through the same backend;
7. port Echo Forge opening + Signal 1;
8. compare experience, performance and authoring friction with the Three.js predecessor;
9. migrate later signals after the backend/spec seam is proven;
10. preserve existing server-authoritative progression/evidence/save semantics;
11. run phone/reduced-motion/performance verification and critic gates;
12. deploy only the exact verified candidate for user review.

## Current quality state

The user's latest explicit predecessor first-touch/story rating remains **3/10**. Historical critic scores do not override that rejection.

The previous internal story treatment score and game scores remain historical diagnostics only. Engine/framework architecture earns zero automatic story/game/learning quality points.

Required gate order remains:

`story >=9 -> first-touch >=9 -> whole-game >=9 -> learning/transfer >=9 -> user review`

## Deployment

Working/hosted branch: **`deploy/render-supabase`**. Render auto-deploy is disabled, so source changes are not live until an exact verified revision is explicitly deployed and the served revision is checked.

Hosted auth, learner isolation, server-authoritative progression/evidence, immutable submitted evidence, assistance/exposure semantics, reset confirmation and historical review remain in force.
