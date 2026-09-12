# Current checkpoint — Play Canvas migration, user verdict still 3/10

Updated 12 September 2026. **Status: `user_rejected` / `needs_revision`.** The current user's explicit verdict is authoritative and supersedes every agent/critic/automation score for acceptance.

## Latest user direction

The newest authoritative product correction is that we had already converged on a **Play Canvas** and should continue migrating toward it rather than treating the reusable Three.js Story3D layer as the top-level architecture.

The Play Canvas is now documented in `docs/PLAY-CANVAS.md` and the root `CODEX-IMPLEMENTATION-PLAN.md` **1.8** is authoritative.

The user's newest explicit first-touch/story score remains **3/10** until they review a materially changed verified/deployed candidate. Do not average it with older scores.

The user previously identified that the rejected opening lacked good previous/back navigation, moved too quickly, told the story lazily, left scenario/causality/stakes unclear, and did not create the creative/beautiful first impression expected from a game that could capture kids, teens and young adults.

The older 5/10 game / 5/10 learning verdict and earlier internal 9+ critic passes are historical only. They did not predict the user's actual experience and are not acceptance evidence.

## Product north star — general learning-game generator

VibeLearn is a **general system for generating effective learning games/stories across subjects and courses**. Relay Rescue is the current authored reference slice, not the product schema.

The intended reusable boundary is:

`LearningSpec -> StoryWorldSpec -> GameExperienceSpec -> AssessmentEvidenceSpec`

Canonical competency/evidence identity must remain independent of a particular story, character, fantasy, visual style, Play Canvas implementation or renderer. Replacing a world later must not erase or counterfeit legitimate learning history.

## Story inputs now vs later

**Current:** story creation is driven by the topic/course intent, source-grounded outcomes, their causal learning structure, and a broad kid-through-young-adult quality target.

**Future:** add an explicit learner-controlled `StoryPreferenceProfile` (or equivalent) for genre, fantasy/realism, tone, characters, visual style, humor/darkness, pace, exploration/action balance and narrative density. It is optional, versioned/editable and separate from mastery/evidence. Do not infer/fabricate creative preferences today.

## Story and experience gates

The pipeline is:

`course/outcomes -> source grounding -> LearningSpec -> StoryWorldSpec -> story critic >=9 -> GameExperienceSpec/Play Canvas realization -> first-touch magic >=9 -> whole-chapter game experience >=9 -> learning/transfer gate >=9 -> current user review -> acceptance`

The game gate is deliberately split. A weak first touch cannot be averaged into a passing chapter.

### First-touch magic

Score the fresh first 60–90 seconds separately. It must create beauty/creative interest, curiosity, character/world attachment, clear causality and low initial cognitive load; give the player control of pacing/navigation; provide an obvious first meaningful action; and flow naturally into play.

### Whole chapter

Score the complete chapter separately. It must preserve the same world/story through actual play, increase cognitive load progressively, add agency/challenge rather than text, provide clear consequences and recovery, earn its payoff, and bridge accurately into the real subject.

Both scores need an unrounded **>=9.0/10** with no blocker before the separate learning/transfer gate. The current user's verdict still overrides all critics.

## Play Canvas architecture

`docs/PLAY-CANVAS.md` is now the authoritative game-surface contract.

**Play Canvas = persistent game surface/orchestrator.**  
**Story3D runtime/host = optional Three.js rendering subsystem inside it.**  
**World adapter/package = replaceable fantasy-specific realization.**

The current migration target is one persistent game surface instead of separate cinematic/mission canvases or page-like lesson shells. For a compatible world package, the same world/runtime should survive story -> mission transitions where practical. Accessible DOM actions/fallback remain required but should support the game surface, not become the primary website architecture.

Current migration rule:

- no new bespoke story/mission canvases;
- opening + Signal 1 migrate first to one persistent Play Canvas stage/world instance;
- Signals 2-6 then reuse that Play Canvas lifecycle;
- Signal 6 builder/HUD should migrate from web-workbench feel into the world/game surface;
- Signal 7 remains a deliberate fresh transfer context but should still use the Play Canvas shell;
- old duplicate mounting/page paths are removed only after equivalent tests are green.

## Current reference / device priority

Current work remains **private Phase 1 reference refinement**. Do not jump ahead and build the full course generator yet.

Phone comes first. Optimize for the mainstream modern Android/iPhone portrait range using a compact representative matrix around roughly **360–430 CSS px** with tall-phone aspect ratios, touch, safe-area considerations, text enlargement and reduced motion. Do not create a 320-vs-390 product fork without an actual breakpoint reason. Desktop polish follows later.

Three.js is a serious option for attention, atmosphere, character/world presence and spatial storytelling, but earns no points merely for existing. 3D cannot rescue weak writing or unclear gameplay.

## Current Echo Forge implementation state

Repository: `Desmic/VibeLearn`.

Hosted branch: `deploy/render-supabase`. Render serves this branch; auto-deploy is disabled.

The last pre-migration branch head `e0d80c42a57734d47f5f79031c0e8ff82d3fb8ee` completed its full hosted verification workflow successfully. The Play Canvas migration then began on top of that green baseline.

Current migration work includes:

- new `web/play-canvas.js` persistent stage/world controller;
- new `web/play-canvas.css` game-surface stage styling;
- explicit local/hosted static allowlisting without weakening CSP;
- Echo Forge opening now mounts through Play Canvas instead of directly owning a disposable story renderer;
- the final story beat detaches the stable stage rather than disposing its world;
- Signal 1 reattaches the same Play Canvas stage/world and updates mission state;
- Signals 1-6 use the same controller/world lifecycle as legacy DOM containers rerender;
- Signal 7 deliberately disposes/exits the fantasy world for fresh transfer;
- onboarding browser coverage now records the Play Canvas instance id before the story-to-mission boundary and requires the same stage/WebGL instance in Signal 1.

This is an **incremental migration**. Legacy `.rgi-*`, `.rg-world`, console/workbench and chapter DOM still exist around the stage and remain migration targets; the presence of `play-canvas.js` does not mean the Play Canvas architecture is complete.

## Reusable Three.js subsystem checkpoint

See `docs/THREE-STORY-FRAMEWORK.md`.

Current reusable layers:

- `web/story3d-runtime.js` owns WebGL renderer/canvas lifecycle, DPR policy, resize, frame scheduling, pause/reduced motion, context loss/restoration, resource cleanup, runtime stats, and a reusable aspect-aware camera rig;
- `web/story3d-world-host.js` owns adapter/version/capability validation and now recognizes an explicit persistent `play` capability while keeping story/mission compatibility during migration;
- `web/rescue-story3d.js` remains Echo Forge-specific geometry/assets/art direction/camera/state mapping;
- `tests/story3d_framework_browser.py` mounts the unrelated test-only **Star Orchard** adapter through shared infrastructure;
- framework tests reject regressions where Echo Forge owns its own renderer/resize/generic camera loop.

The easy-integration rule is now: future stories should normally provide versioned world packages/adapters + story/game data and mount through Play Canvas, not edit the shared runtime/host or create a new app shell. A genuinely new engine capability must be generalized/versioned first.

The full arbitrary generated-package loader remains deferred until the later immutable publishing/asset-validation/security boundary. Current Phase 1 proves the seam without weakening CSP/static allowlists.

Framework extraction is infrastructure and earns zero automatic critic points.

## Critic checkpoint

The most recent frozen realized-game critic predates the Play Canvas migration and remains a warning signal until a new exact build is frozen:

- story treatment: **9.37/10 PASS** (`internal_tool_assisted`, story-only);
- first-touch magic: **8.86/10 FAIL**;
- whole-chapter game experience: **8.71/10 FAIL**;
- learning/transfer critic: not run, because both game gates have not passed.

Its main findings were limited visual/character presence in first touch and loss of game/world identity in later policy-construction/transfer screens. Do not recycle or round the old scores into a pass.

## Verification state

The pre-migration exact head `e0d80c42...` was fully green. The **current Play Canvas migration head is under fresh CI verification** and must not be called green, critic-ready or deployed until build + backend/unit + all browser suites pass on that same head.

The new executable migration proof specifically requires:

- one Play Canvas stage in the opening;
- the same `data-play-canvas-instance` on the stage and WebGL canvas before entering Signal 1;
- that exact same instance after the transition into Signal 1;
- only one WebGL Play Canvas instance rather than a newly spawned mission renderer;
- existing Back/Continue/Pause/reduced-motion semantics;
- direct first action, visible duplicate, rewind and safe recovery;
- no phone overflow;
- existing save/reload/history/reset/isolation/evidence boundaries.

Next implementation order follows plan 1.8:

1. get the exact Play Canvas migration head fully green;
2. inspect 360/390/430 phone evidence for opening, transition into Signal 1, first choice, visible duplicate/recovery and payoff;
3. continue migrating Signals 2-6 / builder/HUD into the Play Canvas rather than adding page shells;
4. improve first-touch magic / whole-chapter game identity until evidence supports new critics;
5. run first-touch critic and repair until >=9/no blocker;
6. run whole-chapter critic and repair until >=9/no blocker;
7. run bounded learning/transfer gate;
8. deploy the exact verified candidate to Render;
9. verify served revision and ask the current user for final review.

## Acceptance authority

The current user is the sole real product reviewer during private refinement. Their verdict overrides story critic, first-touch critic, whole-chapter critic, learning critic, automated checks and historical scores.

Critic >=9 means only that a candidate may proceed to the next gate / user review. Only explicit user acceptance produces `user_accepted`.

No external users/testers or broader rollout are authorized before the current user's acceptance and later explicit authorization.

## Scope / safety boundaries

The new story/course generation contracts describe future Phase 3/4 behavior; they do **not** authorize Phase 2+, new model integrations, untrusted execution, external testers, paid provisioning or public rollout now.

Hosted auth, learner isolation, server-authoritative progression/evidence, immutable submitted evidence, assistance/exposure semantics, reset-progress confirmation and read-only historical review remain in force.
