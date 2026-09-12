# Current checkpoint — verified PlayCanvas runtime, portable rules, world-quality next

Updated 12 September 2026. **Status: `user_rejected` / `needs_revision`.** The current user's explicit predecessor verdict remains authoritative until a materially changed verified/deployed candidate is reviewed by the user.

## Latest direction

VibeLearn's objective is to **generate effective learning games/worlds for arbitrary concepts and subjects**.

Three.js is no longer a strategic foundation. It remains temporary reference/migration infrastructure only while the old Echo Forge realization is retired.

**PlayCanvas Engine is the first strategic backend and Phase 1 now runs its primary Echo Forge opening/mission world through it.** Future backends may include Unity, Unreal, specialized 2D/simulation engines or other runtimes without changing canonical learning/evidence identity.

The durable architecture is engine-neutral and spec-driven:

`LearningSpec -> StoryWorldSpec -> GameDesignSpec -> GameRulesSpec + WorldSpec -> RuntimeExperienceSpec -> EngineCompiler -> EngineRuntime`

`AssessmentEvidenceSpec` remains outside both engine truth and game-success truth.

Read root `CODEX-IMPLEMENTATION-PLAN.md`, `docs/GAME-RUNTIME-ARCHITECTURE.md`, and `docs/GAME-RULES-SPEC.md` as current architecture authority.

## Verified Phase 1 checkpoint

Current isolated branch: **`phase1/playcanvas-engine`** · draft PR **#5**.  
Verified source revision: **`8aaf9243d0289bebf5a5762f89bfe50f9a344734`**.  
Echo Forge world package: **`pc-phase1-4`**.  
Pinned engine: **PlayCanvas 2.22.1**, self-hosted/same-origin.

GitHub Actions run **34700489102** is green on that exact revision:

- pinned PlayCanvas vendoring/SRI verification passed;
- build passed;
- **122 unit/backend tests passed**;
- complete real-browser suite passed;
- phone evidence is preserved for 360 / 390 / 430 portrait widths;
- story -> Signal 1 keeps one `GameRuntime` instance and exact PlayCanvas canvas;
- Signals 1–6 keep the shared runtime/world alive;
- Signal 7 deliberately exits the fantasy world for sealed transfer;
- reduced motion, narrow screens, save/reload/process restart, learner isolation and existing evidence semantics remain covered.

This is the current rollback/integrity checkpoint. **Do not merge or deploy it simply because it is green.**

## What pc-phase1-4 changed visibly

Compared with the rejected predecessor and earlier PlayCanvas slices:

- phone portrait uses authored camera variants rather than squeezing a landscape shot narrower;
- the opening no longer tells the learner that the Forge definitely produced a gear after the reply is lost;
- Signal 1 starts with the gear visually hidden and reveals it only after inspecting the Forge;
- camera composition follows semantic discovery: Forge -> ticket/Pip -> choice -> duplicate consequence -> success;
- generic station/readout/key dashboard chrome is removed from the phone Signal 1 play surface;
- success is realized inside the world: the discovered gear moves into the bridge and Pip appears across the gap;
- the immediate clear hides journal/evidence panels and gives one compact payoff/CTA (`Secure the crossing ->`) before deeper debrief.

These are game-experience improvements only. They do not alter server-authoritative game state or learner evidence truth.

## Current visual diagnosis

`pc-phase1-4` is materially cleaner and more game-like than the predecessor, but **it is not a >=9 game candidate**.

Fresh rendered evidence makes the main blocker unambiguous: **world/art quality now limits first-touch magic more than HUD layout**.

Current weaknesses:

- primitive/blockout geometry still reads as a prototype;
- Pip has little animation/expression/personality in motion;
- the Echo Forge and islands are sparse and lack environmental storytelling;
- lighting/atmospheric depth is basic;
- many frames contain large dead regions rather than authored composition/detail;
- the opening still asks the player to advance through six Continue beats before meaningful agency;
- later chapter states still need review for regression into workbench/web-surface interaction.

Do not keep shaving dashboard pixels and mistake that for a 9/10 game. The next slice must raise the **world itself**: atmosphere, visual hierarchy, character/set composition, effects and earlier player agency.

## GameRulesSpec implementation

The first renderer-independent rules interpreter now exists and is intentionally isolated from Relay Rescue evidence writes.

Implemented/proven:

- allowlisted typed state: boolean, bounded integer/number, enum;
- structured expressions rather than `eval`;
- deterministic conditions/branches;
- `set` and bounded arithmetic effects;
- invariants, objectives and semantic events;
- invalid actions/specs fail closed;
- no PlayCanvas/DOM callbacks or engine-object truth;
- no assessment/evidence side effects.

Tests prove the same interpreter on:

1. retry / durable-identity semantics related to Echo Forge; and
2. a materially unrelated bounded-resource mechanic.

This is architecture evidence only. It earns zero game/learning critic points.

Next rules work is incremental mapping from the already-tested authoritative Relay Rescue service into semantic rule state/events. Do **not** rewrite the mature server model simply for architectural purity.

## Engine/runtime implementation already established

1. pinned/self-hosted PlayCanvas Engine 2.22.1;
2. versioned engine-neutral `WorldSpec` validator;
3. generic `WorldSpec -> PlayCanvas` backend creating real entities/materials/lights/cameras;
4. unrelated synthetic Star Orchard WorldSpec proven in real Chromium/WebGL2 through the same backend;
5. persistent engine-neutral `GameRuntime` shell;
6. Echo Forge authored WorldSpec + PlayCanvas world adapter;
7. direct opening/mission imports no longer depend on the Three.js adapter or old internal Play Canvas facade;
8. embedded canvas lifecycle/resize/readiness contract corrected and browser-proven;
9. server-authoritative progression/auth/isolation/evidence semantics remain unchanged.

Three.js files/tests remain legacy/reference coverage until equivalent PlayCanvas behavior is fully proven and old paths can be removed safely. They must not regain strategic ownership.

## Naming correction

The old internal architecture name **“Play Canvas”** is deprecated because it conflicts with the actual PlayCanvas Engine name. Existing `play-canvas*.js` files may remain as migration compatibility code, but new architecture/code uses unambiguous names such as `GameRuntime`, `RuntimeExperience`, `EngineCompiler` and `GameRulesSpec`.

`docs/PLAY-CANVAS.md` and `docs/THREE-STORY-FRAMEWORK.md` are legacy migration references.

## Critic / acceptance protocol

The predecessor's user rating remains **3/10** until the user reviews a materially changed verified/deployed candidate. Historical internal scores never carry forward automatically.

Do not present a build merely because tests pass. Critics are separate gates on the **same exact rendered build**:

1. story/world >=9.0, no blocker;
2. first-touch gameplay >=9.0, no blocker;
3. whole-game gameplay >=9.0, no blocker;
4. learning/transfer >=9.0, no blocker;
5. architecture/runtime/security/persistence as a hard engineering gate that contributes zero automatic quality points.

Use a genuinely separate critic/agent where available. If only builder/tool-assisted review is available, label it **`internal_tool_assisted`** and never call it independent or human/youth-tested. Machine success proves behavior, not delight or learning efficacy. User verdict remains final.

## Immediate implementation order

1. keep `8aaf924... / pc-phase1-4` frozen as the green rollback checkpoint;
2. add a small engine-neutral atmosphere/rendering-intent extension to WorldSpec only where PlayCanvas can realize it portably (exposure, fog, camera tone mapping);
3. materially enrich Echo Forge/Pip/environment composition using reusable primitives/archetype patterns, without making the generic backend Rescue-specific;
4. verify the richer world across 360 / 390 / 430 portrait evidence and keep phone performance sane;
5. then move meaningful player agency earlier into the opening instead of six consecutive Continue beats;
6. rerun story/world and first-touch internal diagnostics on the exact rendered candidate and repair until no blocker remains;
7. continue migrating later chapter mechanics so the fantasy/world survives harder reasoning rather than reverting to a generic workbench;
8. incrementally bind authoritative service results to GameRulesSpec semantic state/events without weakening persistence/evidence tests;
9. remove legacy Three.js/migration facade paths only after PlayCanvas parity/quality is proven;
10. run whole-game and learning/transfer gates, then final architecture/security/persistence verification;
11. deploy only an exact build that passes every applicable gate;
12. verify served revision, then ask the current user for the decisive review.

## Deployment

Production/hosted branch remains **`deploy/render-supabase`**. Render auto-deploy is disabled. The PlayCanvas Phase 1 branch is **not live** and remains isolated.

Hosted auth, learner isolation, server-authoritative progression/evidence, immutable submitted evidence, assistance/exposure semantics, reset confirmation and historical review remain in force.
