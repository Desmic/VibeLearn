# Current checkpoint — animated AssetRef pipeline proven, character composition under review

Updated 13 September 2026. **Status: `user_rejected` / `needs_revision`.** The current user's explicit predecessor verdict remains authoritative until a materially changed verified/deployed candidate is reviewed by the user.

## Latest direction

VibeLearn's objective is to **generate effective learning games/worlds for arbitrary concepts and subjects**.

Three.js is no longer a strategic foundation. It remains temporary reference/migration infrastructure only while the old Echo Forge realization is retired.

**PlayCanvas Engine is the first strategic backend and Phase 1 now runs its primary Echo Forge opening/mission world through it.** Future backends may include Unity, Unreal, specialized 2D/simulation engines or other runtimes without changing canonical learning/evidence identity.

The durable architecture is engine-neutral and spec-driven:

`LearningSpec -> StoryWorldSpec -> GameDesignSpec -> GameRulesSpec + WorldSpec -> RuntimeExperienceSpec -> EngineCompiler -> EngineRuntime`

`AssessmentEvidenceSpec` remains outside both engine truth and game-success truth.

Read root `CODEX-IMPLEMENTATION-PLAN.md`, `docs/GAME-RUNTIME-ARCHITECTURE.md`, and `docs/GAME-RULES-SPEC.md` as current architecture authority.

## Verified Phase 1 checkpoints

Current isolated branch: **`phase1/playcanvas-engine`** · draft PR **#5**.  
Pinned engine: **PlayCanvas 2.22.1**, self-hosted/same-origin.

The last fully green animated-asset integrity checkpoint is source revision **`c7edae1e410eba8ff1a818de16b2e845fee45ca4`**, Echo Forge package **`pc-phase1-7`**, GitHub Actions run **34746048509**.

That exact build proved:

- pinned PlayCanvas and game-asset vendoring passed;
- build passed;
- backend/static tests passed;
- complete real-browser suite passed;
- the pinned CC0 robot GLB loaded through the generic PlayCanvas container path;
- asset accounting settled at one loaded Pip asset, zero failures and zero asset errors;
- semantic story animation changed from `idle` to `wave` without exposing PlayCanvas track objects to the world adapter;
- unsafe external asset URLs and unknown animation aliases fail closed;
- primitive fallback remains available if the asset fails;
- direct world picking, Signals 1–6, persistence/auth/isolation and evidence semantics remained intact.

A later visual-normalization candidate, **`pc-phase1-8`**, increases Pip's authored asset normalization and keeps courier accessories (scarf / antenna / beacon) as composable semantic child entities rather than hiding them with the procedural body fallback. The first browser run for that candidate reached a healthy runtime result (`assetsLoaded=1`, `assetsFailed=0`, `idle -> wave`) but failed only on a stale test expectation for the previous world-version string. That stale assertion has been corrected.

Current branch head is evolving beyond that candidate to preserve dedicated loaded-character screenshots before assertions. Treat those heads as **under verification**, not as green rollback checkpoints.

**Do not merge or deploy simply because an engineering run is green.** Product-quality critic gates remain separate.

## AssetRef / character realization now established

The first real engine-neutral authored asset path is implemented.

`WorldSpec` can now describe validated container `AssetRef`s with:

- safe same-origin runtime source;
- portable normalization transform;
- semantic animation aliases rather than engine-native animation objects;
- default and per-state animation intent;
- semantic fallback entity IDs;
- stable semantic parent identity for picking and world state.

Build-time asset acquisition is separate from learner runtime. The current robot model is pinned to an immutable source commit, exact byte size and Git object identity, with retained license/provenance, then self-hosted under `web/assets`.

The PlayCanvas backend generically:

1. loads container assets asynchronously;
2. instantiates render hierarchies under the semantic WorldSpec entity;
3. resolves modern PlayCanvas Animation Asset wrappers to their underlying `AnimTrack` resources;
4. binds semantic aliases such as `idle`, `wave`, `yes` and `no`;
5. preserves requested animation state if the asset finishes loading after the world state changed;
6. maps picks on imported child meshes back to the semantic entity;
7. hides only declared fallback geometry after successful realization;
8. leaves game truth unchanged if visual asset realization fails.

Character identity is intentionally compositional. Pip's scarf/beacon/accessories are authored semantic children and should survive regardless of whether the visual body is the imported model or procedural fallback. Do not move Pip-specific assumptions into the generic PlayCanvas backend.

## Current visual diagnosis

The asset pipeline itself is now real, but **successful loading is not visual quality**.

The first `pc-phase1-7` screenshots exposed an important failure mode: the animated GLB loaded and animated correctly but Pip was effectively too small/unreadable in the authored opening composition. This was caused by asset normalization/composition, not by the loader.

`pc-phase1-8` addresses that by materially increasing the model normalization and retaining the courier accessory silhouette. Dedicated `story.0` idle and `story.5` wave screenshots are now being preserved before assertions so future failures cannot erase the visual evidence required for review.

Remaining likely quality blockers still include:

- confirm Pip is now readable, correctly oriented and compositionally important across portrait shots;
- confirm scarf/beacon placement works with the imported skeleton silhouette rather than reading as detached primitive debris;
- primitive/blockout Forge/island geometry still reads as prototype-grade;
- environment needs richer authored detail, depth, effects and visual storytelling;
- the opening still spends too many beats before meaningful agency;
- later chapter reasoning states still need inspection for regression into web/workbench interaction;
- the imported stock character is only useful if the final archetype feels like **Pip**, not a generic robot asset.

Do not award critic points for GLB support or animation infrastructure. The rendered experience must earn them.

## GameRulesSpec implementation

The first renderer-independent rules interpreter exists and is intentionally isolated from Relay Rescue evidence writes.

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
4. portable atmosphere intent (exposure, fog, tone mapping and portrait camera variants);
5. generic container `AssetRef` realization with animation aliases and fallback;
6. unrelated synthetic Star Orchard WorldSpec proven in real Chromium/WebGL2 through the same backend;
7. persistent engine-neutral `GameRuntime` shell;
8. Echo Forge authored WorldSpec + PlayCanvas world adapter;
9. direct opening/mission imports no longer depend on the Three.js adapter or old internal Play Canvas facade;
10. embedded canvas lifecycle/resize/readiness and semantic picking contracts are browser-proven;
11. server-authoritative progression/auth/isolation/evidence semantics remain unchanged.

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

1. keep `c7edae1... / pc-phase1-7` as the latest fully green animated-asset rollback/integrity checkpoint;
2. finish exact verification and screenshot review of `pc-phase1-8` character normalization/accessory composition;
3. repair Pip scale/orientation/accessories/camera composition from rendered evidence until the character reads clearly on 360 / 390 / 430 portrait surfaces;
4. enrich the Forge/environment using reusable assets/archetype composition rather than Rescue-specific backend code;
5. move meaningful player agency earlier into the opening instead of six consecutive Continue beats;
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
