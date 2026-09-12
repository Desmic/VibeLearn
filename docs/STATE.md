# Current checkpoint — PlayCanvas backend pivot

Updated 12 September 2026. **Status: `user_rejected` / `needs_revision`.** The current user's explicit verdict remains authoritative until a materially changed verified/deployed candidate is reviewed.

## Latest direction

VibeLearn's objective is to **generate effective learning games/worlds for arbitrary concepts and subjects**.

The architecture therefore moves away from Three.js as a strategic foundation. Three.js remains only as temporary reference/migration infrastructure for the current Echo Forge implementation.

**PlayCanvas Engine is the first strategic backend** for the current browser/phone-first product, including Phase 1 itself. Phase 1 is not allowed to defer the engine pivot and then claim the architecture was proved later.

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

## Phase 1 execution rule

Phase 1 must be built and judged as a **real PlayCanvas learning game**, while simultaneously proving that the game is generated/assembled through reusable specs and runtime/compiler boundaries rather than one-off PlayCanvas scene code.

The current first implementation slice is intentionally narrow:

1. self-host one pinned PlayCanvas Engine version under the existing same-origin CSP;
2. validate a versioned engine-neutral `WorldSpec`;
3. compile that spec into real PlayCanvas entities/materials/lights/cameras;
4. prove the compiler with a materially unrelated synthetic world (`Star Orchard`);
5. route the Echo Forge opening and mission world through the real PlayCanvas backend without changing server/evidence semantics;
6. expand the spec/runtime vocabulary only when the actual Phase 1 game requires a reusable capability;
7. migrate the rest of Relay Rescue/Echo Forge and remove Three.js only after equivalent behavior, persistence and quality evidence are green.

The existing `play-canvas.js` name is temporarily retained as a compatibility façade so the current story/mission callers can migrate incrementally. It must not become the permanent runtime abstraction.

Current slice is **work in progress and not review-ready**. Syntax checks are green locally. Real-browser verification of the pinned engine and PlayCanvas backend must pass in CI before this slice may be promoted to the working deploy branch.

## Critic/acceptance protocol

Do not present a candidate to the user simply because it runs or because the architecture is clean.

Critics are separate gates and must score the same verified build independently:

1. **story/world >=9.0/10** — hook, character/world attachment, causality, pacing, stakes, payoff and cross-age appeal;
2. **first-touch gameplay >=9.0/10** — first 60–90 seconds as an actual game, clarity, agency, controls, feedback, delight, recovery and story-to-play transition;
3. **whole-game gameplay >=9.0/10** — progression, challenge, variety, agency, cohesion, payoff and whether later reasoning still feels like a game rather than a website;
4. **learning/transfer >=9.0/10** — correctness, meaningful practice, misconception handling, scaffolding, unassisted evidence, fresh transfer and delayed retrieval where claimed;
5. **architecture/runtime** — portability, spec/compiler genericity, persistence/security/accessibility/performance. This is a hard engineering gate but contributes **zero automatic points** to story/gameplay/learning scores.

Every scored gate requires no blocker. A critic failure causes another repair cycle; scores cannot be averaged across categories to hide a failure. Use a genuinely separate critic/agent where available. If only an internal/tool-assisted critic is available, label it `internal_tool_assisted` and never call it independent or human-tested.

Only after all applicable >=9 gates pass on the same exact verified build should that build be deployed, the served revision verified, and the user invited to review it. The user's explicit verdict remains final and can reject a critic-passing build.

## Immediate implementation order

1. freeze generic Three.js framework expansion;
2. land the pinned/self-hosted PlayCanvas dependency and generic WorldSpec compiler;
3. make the unrelated Star Orchard PlayCanvas proof green in a real browser;
4. make opening -> Signal 1 use one persistent real PlayCanvas runtime/world;
5. preserve save/reload, reset, history, learner isolation and evidence semantics;
6. migrate Signals 2–7 into the same game/runtime architecture while keeping the world/game identity alive as reasoning becomes harder;
7. replace authored adapter glue with declarative `RuntimeExperienceSpec` mappings where the concrete game proves the vocabulary;
8. verify phone layouts at 360/390/430 CSS px, touch, reduced motion, context/failure behavior and performance budgets;
9. run story/world critic and repair until >=9/no blocker;
10. run first-touch gameplay critic and repair until >=9/no blocker;
11. run whole-game gameplay critic and repair until >=9/no blocker;
12. run learning/transfer critic and repair until >=9/no blocker;
13. run final architecture/security/persistence verification on the same build;
14. deploy that exact revision only after every gate passes;
15. verify the served revision and then ask the current user for the decisive review.

## Current quality state

The user's latest explicit predecessor first-touch/story rating remains **3/10**. Historical critic scores do not override that rejection.

The previous internal story treatment score and game scores remain historical diagnostics only. Engine/framework architecture earns zero automatic story/game/learning quality points.

No new critic score is valid yet for the current PlayCanvas candidate because the new engine slice has not completed real-browser verification.

## Deployment

Working/hosted branch: **`deploy/render-supabase`**. Render auto-deploy is disabled, so source changes are not live until an exact verified revision is explicitly deployed and the served revision is checked.

Hosted auth, learner isolation, server-authoritative progression/evidence, immutable submitted evidence, assistance/exposure semantics, reset confirmation and historical review remain in force.
