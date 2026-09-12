# Current checkpoint — PlayCanvas Engine + portable game rules

Updated 12 September 2026. **Status: `user_rejected` / `needs_revision`.** The current user's explicit verdict remains authoritative until a materially changed verified/deployed candidate is reviewed.

## Latest direction

VibeLearn's objective is to **generate effective learning games/worlds for arbitrary concepts and subjects**.

Three.js is no longer a strategic foundation. It remains temporary reference/migration infrastructure only while the old Echo Forge realization is retired.

**PlayCanvas Engine is the first strategic backend and Phase 1 itself must run on it.** Phase 1 is not allowed to postpone the engine pivot and later claim the portable architecture was proved.

The durable architecture is engine-neutral and spec-driven:

`LearningSpec -> StoryWorldSpec -> GameDesignSpec -> GameRulesSpec + WorldSpec -> RuntimeExperienceSpec -> EngineCompiler -> EngineRuntime`

`AssessmentEvidenceSpec` remains outside both engine truth and game-success truth.

Future backends may include Unity, Unreal, specialized 2D/simulation engines or other runtimes without changing canonical learning/evidence identity.

Read root `CODEX-IMPLEMENTATION-PLAN.md`, `docs/GAME-RUNTIME-ARCHITECTURE.md`, and `docs/GAME-RULES-SPEC.md` as current architecture authority.

## Why GameRulesSpec was added

A portable scene/world schema is not enough for a generated-game platform. VibeLearn also needs engine-neutral **gameplay semantics**: state, actions, preconditions, deterministic transitions, invariants, resources, objectives, success/failure and semantic events.

`GameRulesSpec` now owns that portable gameplay layer. The PlayCanvas backend realizes visuals/input/animation/physics around it; a future Unity/Unreal backend should be able to consume the same rules and semantic actions. Learning-critical rules remain server-authoritative in the current hosted architecture, and engine callbacks never establish mastery by themselves.

Phase 1 must extract this contract incrementally from the already-tested Relay Rescue semantics rather than rewrite mature server logic just to make the new architecture look pure.

## Naming correction

The old internal architecture name **“Play Canvas”** is deprecated because it conflicts with the actual PlayCanvas Engine name. Existing `play-canvas*.js` files may remain as migration compatibility code, but new architecture/code uses unambiguous names such as `GameRuntime`, `RuntimeExperience`, `EngineCompiler` and `GameRulesSpec`.

`docs/PLAY-CANVAS.md` and `docs/THREE-STORY-FRAMEWORK.md` are legacy migration references.

## Generated framework target

Generated games should primarily be validated specs/data + assets:

- `LearningSpec` — learning identity/outcomes/sources;
- `StoryWorldSpec` — semantic story/world;
- `GameDesignSpec` — creative mechanics, core loop, challenge graph and progression;
- `GameRulesSpec` — portable deterministic gameplay state/actions/transitions/invariants/objectives/events;
- `WorldSpec` — engine-neutral scenes/entities/components/assets/interactions/physics/animation intent;
- `RuntimeExperienceSpec` — modes, input, HUD, save/resume UX, accessibility, performance and rule/world presentation mappings;
- `EngineTargetSpec` — backend capabilities/constraints;
- `AssessmentEvidenceSpec` — authoritative evidence meaning, assistance/exposure and transfer/retrieval claims.

The framework exposes reusable engine-neutral mechanics, primitives and archetypes that compile differently per backend rather than requiring freshly generated renderer/game-engine glue for each course.

## Phase 1 engine execution

Current work lives on isolated branch **`phase1/playcanvas-engine`**, draft PR **#5**. Do not merge/deploy it simply because the architecture compiles.

Implemented so far:

1. pinned/self-hosted PlayCanvas Engine **2.22.1** with npm SRI verification and same-origin learner runtime;
2. versioned engine-neutral `WorldSpec` validator;
3. generic `WorldSpec -> PlayCanvas` backend creating real PlayCanvas entities/materials/lights/cameras;
4. unrelated synthetic `Star Orchard` WorldSpec proven in real Chromium/WebGL2 through the same backend;
5. persistent engine-neutral `GameRuntime` shell;
6. Echo Forge authored `WorldSpec` + PlayCanvas world adapter;
7. primary Echo Forge opening and Signal 1 now import `game-runtime.js` + `rescue-playcanvas-world.js` directly and no longer import the Three.js adapter or old Play Canvas façade;
8. Render build path vendors the pinned engine before startup;
9. existing server-authoritative progression/evidence/auth/isolation semantics remain unchanged.

The latest browser cycle exposed a real embedded-runtime defect: the stage was marked failed before mount, causing PlayCanvas to initialize against a hidden `0x0` host. That lifecycle has been corrected and the backend now sizes the canvas explicitly from the containing game surface using PlayCanvas's supported embedded-canvas APIs. Verification of that exact revision is currently in CI.

Three.js files/tests still exist as legacy/reference coverage until equivalent PlayCanvas behavior and quality are proven. They must not regain strategic ownership.

## GameRulesSpec implementation target

Next architecture slice after the PlayCanvas runtime baseline is green:

1. implement a deliberately small allowlisted GameRulesSpec schema/interpreter;
2. derive the first rules package from current Echo Forge Signal 1 semantics without changing evidence truth;
3. map authoritative server command results into semantic rule state/events;
4. prove deterministic rule replay without any renderer;
5. prove a second unrelated synthetic mechanic through the same interpreter;
6. keep PlayCanvas bound to semantic actions/state/events rather than course-specific business logic;
7. expand the rule vocabulary only from concrete game needs.

See `docs/GAME-RULES-SPEC.md`.

## Experience direction

Architecture is not the current product-quality bottleneck by itself.

The predecessor critic evidence and rendered screenshots show the main experience problem clearly: **a web HUD surrounding a small 3D diorama**. The next product revision must invert that hierarchy:

- world first, HUD second;
- Pip, the Forge, the broken bridge and consequences occupy meaningful phone-frame area;
- action/environment carries more causal storytelling than caption panels;
- first meaningful input feels like acting in the world, not navigating a website;
- visible failure/recovery happens spatially and immediately;
- later construction/transfer keeps the game world/fantasy alive instead of collapsing into generic workbench/forms;
- phone portrait composition gets first-class camera/layout treatment rather than desktop framing squeezed narrower.

Do not increase score because PlayCanvas exists. The engine earns points only when the rendered/player experience improves.

## Critic/acceptance protocol

Do not present a candidate to the user simply because it runs or because the architecture is clean.

Critics are separate gates and must score the same verified build independently:

1. **story/world >=9.0/10** — hook, character/world attachment, causality, pacing, stakes, payoff and cross-age appeal;
2. **first-touch gameplay >=9.0/10** — first 60–90 seconds as an actual game, clarity, agency, controls, feedback, delight, recovery and story-to-play transition;
3. **whole-game gameplay >=9.0/10** — progression, challenge, variety, agency, cohesion, payoff and whether later reasoning still feels like a game rather than a website;
4. **learning/transfer >=9.0/10** — correctness, meaningful practice, misconception handling, scaffolding, unassisted evidence, fresh transfer and delayed retrieval where claimed;
5. **architecture/runtime** — portability, rules/spec/compiler genericity, persistence/security/accessibility/performance. This is a hard engineering gate but contributes **zero automatic points** to story/gameplay/learning scores.

Every scored gate requires no blocker. A failure causes another repair cycle; scores cannot be averaged across categories to hide a failure. Use a genuinely separate critic/agent where available. If only an internal/tool-assisted critic is available, label it `internal_tool_assisted` and never call it independent or human/youth-tested.

Only after all applicable >=9 gates pass on the same exact verified build should that build be deployed, the served revision verified, and the user invited to review it. The user's explicit verdict remains final and can reject a critic-passing build.

## Immediate implementation order

1. make the direct opening -> Signal 1 PlayCanvas runtime/browser gate completely green;
2. inspect fresh 360/390/430 portrait screenshots from that exact build;
3. add portrait-aware camera composition and improve first-touch world/character scale, visual causality and early agency;
4. establish minimal GameRulesSpec/interpreter + engine-independent tests and an unrelated mechanic proof;
5. bind Echo Forge authoritative state/events through the portable rules/runtime seam without weakening existing server tests;
6. migrate Signals 2–7 into the same PlayCanvas game/runtime architecture while keeping world identity alive as reasoning becomes harder;
7. replace migration façade/CSS names and remove primary Three.js paths once parity is proven;
8. verify save/reload, reset, history, learner isolation, evidence semantics, touch, reduced motion, context failure and performance;
9. run story/world critic and repair until >=9/no blocker;
10. run first-touch gameplay critic and repair until >=9/no blocker;
11. run whole-game gameplay critic and repair until >=9/no blocker;
12. run learning/transfer critic and repair until >=9/no blocker;
13. run final architecture/security/persistence verification on the same build;
14. deploy that exact revision only after every gate passes;
15. verify the served revision and then ask the current user for the decisive review.

## Current quality state

The user's latest explicit predecessor first-touch/story rating remains **3/10**. Historical critic scores do not override that rejection.

Historical internal diagnostics remain: story treatment 9.37 pass, first-touch 8.86 fail, whole chapter 8.71 fail. They do **not** carry forward as scores for the new PlayCanvas candidate.

No new story/game/learning critic score is valid until the new PlayCanvas candidate has passed machine/runtime verification and fresh rendered evidence is inspected.

## Deployment

Production/hosted branch remains **`deploy/render-supabase`**. Render auto-deploy is disabled. The Phase 1 PlayCanvas branch is not live and must remain isolated until an exact verified review candidate is ready.

Hosted auth, learner isolation, server-authoritative progression/evidence, immutable submitted evidence, assistance/exposure semantics, reset confirmation and historical review remain in force.
