# Current checkpoint — user rejected first-touch story at 3/10

Updated 12 September 2026. **Status: `user_rejected` / `needs_revision`.** The current user's explicit verdict is authoritative and supersedes every agent/critic/automation score for acceptance.

## Latest user review

The newest user rating for first-touch/story quality is **3/10**. Do not average it with older scores.

The user identified that the earlier opening lacked good previous/back navigation, moved too quickly, told the story lazily, left scenario/causality/stakes unclear, and did not create the kind of creative/beautiful first impression expected from a game that could capture kids, teens and young adults.

The older 5/10 game / 5/10 learning verdict and the earlier internal 9+ critic passes are historical only. They did not predict the user's actual experience and are not acceptance evidence.

## Product north star — general learning-game generator

The root `CODEX-IMPLEMENTATION-PLAN.md` **1.7** is authoritative.

VibeLearn is a **general system for generating effective learning games/stories across subjects and courses**. Relay Rescue is the current authored reference slice, not the product schema.

The intended reusable boundary is:

`LearningSpec -> StoryWorldSpec -> GameExperienceSpec -> AssessmentEvidenceSpec`

Canonical competency/evidence identity must remain independent of a particular story, character, fantasy, visual style or renderer. Replacing a world later must not erase or counterfeit legitimate learning history.

## Story inputs now vs later

**Current:** story creation is driven by the topic/course intent, source-grounded outcomes, their causal learning structure, and a broad kid-through-young-adult quality target.

**Future:** add an explicit learner-controlled `StoryPreferenceProfile` (or equivalent) for genre, fantasy/realism, tone, characters, visual style, humor/darkness, pace, exploration/action balance and narrative density. It is optional, versioned/editable and separate from mastery/evidence. Do not infer/fabricate creative preferences today.

## Story and experience gates

The pipeline is:

`course/outcomes -> source grounding -> LearningSpec -> StoryWorldSpec -> story critic >=9 -> game realization -> first-touch magic >=9 -> whole-chapter game experience >=9 -> learning/transfer gate >=9 -> current user review -> acceptance`

The game gate is deliberately split. A weak first touch cannot be averaged into a passing chapter.

### First-touch magic

Score the fresh first 60–90 seconds separately. It must create beauty/creative interest, curiosity, character/world attachment, clear causality and low initial cognitive load; give the player control of pacing/navigation; provide an obvious first meaningful action; and flow naturally into play.

### Whole chapter

Score the complete chapter separately. It must preserve the same world/story through actual play, increase cognitive load progressively, add agency/challenge rather than text, provide clear consequences and recovery, earn its payoff, and bridge accurately into the real subject.

Both scores need an unrounded **>=9.0/10** with no blocker before the separate learning/transfer gate. The current user's verdict still overrides all critics.

## First chapter comprehension contract

By the end of Chapter 1 a non-specialist should understand who/what matters, what help is needed, the important objects/resources and their functions, what happened, what changed, why it matters, what the player did, what success means, and how the in-world behavior maps to the real course concept.

Prefer dramatized action, animation, environmental storytelling, direct manipulation and visible consequence over glossaries/slides. Introduce formal terminology after the concrete model exists.

## Current reference / device priority

Current work remains **private Phase 1 reference refinement**. Do not jump ahead and build the full course generator yet.

Phone comes first. Optimize for the mainstream modern Android/iPhone portrait range using a compact representative test matrix around roughly **360–430 CSS px** with tall-phone aspect ratios, touch, safe-area considerations, text enlargement and reduced motion. Do not create a 320-vs-390 product fork without an actual breakpoint reason. Desktop polish follows later.

Three.js is a serious option for attention, atmosphere, character/world presence and spatial storytelling, but earns no points merely for existing. 3D cannot rescue weak writing or unclear gameplay.

## Current Echo Forge implementation state

Repository: `Desmic/VibeLearn`.

Hosted branch: `deploy/render-supabase`. Render serves this branch; auto-deploy is disabled.

The Echo Forge replacement renders a continuous Three.js story world, has user-paced Back/Continue/Skip/Replay/Pause controls, and carries Signal 1 into the same world with progressive disclosure. Signal 1 uses tutorial-state version **v3**, so older completion flags cannot silently suppress the redesigned tutorial.

Recent phone work now:

- keeps story copy and controls inside the mainstream phone viewport;
- preserves the first mission as world-first progressive disclosure;
- turns Signal 1 success into an earned **BRIDGE ONLINE / FIELD SKILL UNLOCKED** payoff, with the formal term revealed after success and the longer world-model explanation collapsed behind an optional debrief;
- fixes the post-tutorial objective header so it cannot create horizontal overflow;
- retains the exact recovery assertion for unsaved Signal-6 route drafts, but synchronizes the browser test on the actual user-visible `Recovered unsaved progress` state instead of racing asynchronous boot.

The Echo Forge adapter is also being carried through **Signals 2-6**, rather than disappearing after Signal 1. Signal 7 intentionally leaves the fantasy for fresh real-world transfer. This is specifically aimed at the prior whole-chapter critic failure where later reasoning screens became a themed web tool and lost story/world identity.

## Reusable Three.js framework checkpoint

Phase 1 now treats easy future fantasy integration as a product/architecture gate, not just code cleanup. See [THREE-STORY-FRAMEWORK.md](THREE-STORY-FRAMEWORK.md).

Current reusable layers:

- `web/story3d-runtime.js` owns WebGL renderer/canvas lifecycle, DPR policy, resize, frame scheduling, pause/reduced motion, context loss/restoration, resource cleanup, runtime stats, and a reusable aspect-aware camera rig;
- `web/story3d-world-host.js` owns the adapter/version/capability contract and fails closed on incompatible or incomplete adapters;
- `web/rescue-story3d.js` is the Echo Forge-specific adapter: geometry/assets, lighting/art direction, landscape/portrait camera compositions, story beat states and game-state-to-visual mapping;
- `tests/story3d_framework_browser.py` mounts an unrelated test-only **Star Orchard** adapter through the same host/runtime and verifies version/mode/capability/disposal behavior;
- tests reject regressions where Echo Forge starts owning its own `WebGLRenderer`, `ResizeObserver`, `currentCam`, or `currentLook` camera loop.

The **easy-integration rule** is now explicit in the implementation plan: a future story should normally integrate by providing a versioned world package/adapter plus story/game data, not by editing the shared runtime/host. If a genuinely new engine capability is needed, it must be generalized and versioned first. Package identity remains provenance and never becomes competency/evidence identity.

The full arbitrary generated-package loader is intentionally deferred until the later immutable publishing/asset-validation/security boundary. Current Phase 1 proves the seam without weakening CSP/static allowlists.

Framework extraction is infrastructure. It earns zero automatic critic points; the actual rendered story/game must still pass the story, first-touch, whole-chapter and learning gates.

## Critic checkpoint

The most recent frozen realized-game critic (`docs/CURRENT-GAME-CRITIC.md`) predates the newest framework/visual-continuity revisions and remains the active warning signal until a new exact build is frozen:

- story treatment: **9.37/10 PASS** (`internal_tool_assisted`, story-only);
- first-touch magic: **8.86/10 FAIL**;
- whole-chapter game experience: **8.71/10 FAIL**;
- learning/transfer critic: not run, because both game gates have not passed.

Its main findings were limited visual/character presence in first touch and loss of game/world identity in later policy-construction/transfer screens. Current changes are targeted at those failures; do not recycle or round the old scores into a pass.

## Verification state

The last fully inspected integrated run before the newest changes proved:

- build/ESM parsing and all **116** backend/unit tests green;
- the unrelated Star Orchard Story3D framework proof green;
- campaign/renderer/context-loss/reduced-motion/phone checks green;
- one final rescue-browser failure remained in the unsaved Signal-6 draft-reload test because it inspected `RescueGame.response()` immediately after `page.reload()` before async boot had recovered the scoped local draft.

That browser test has now been corrected to wait for the real visible recovery state and then retain the same strong localStorage + RescueGame SAFE-route assertions. New browser assertions also require the shared Story3D world to remain visible through Signals 2-6 and disappear at the deliberate Signal-7 transfer boundary.

The current exact branch head is still **under CI verification**. Do not call it green, critic-ready, or deployed until build + backend/unit + all browser suites complete on the same head.

Next implementation order follows the root plan:

1. get the exact branch head fully green across build, backend/unit and browser suites;
2. inspect 360/390/430 phone evidence for opening scenes, first action, first choice, visible duplicate/recovery, post-success payoff and later Signal-6 world continuity;
3. improve rendered first-touch magic / whole-chapter game identity if evidence remains below the commercial-game bar;
4. run the **first-touch magic critic** and repair until >=9/no blocker;
5. run the **whole-chapter game critic** and repair until >=9/no blocker;
6. run the bounded learning/transfer gate;
7. deploy the exact verified candidate to Render;
8. verify the served revision and ask the current user for final review.

## Acceptance authority

The current user is the sole real product reviewer during private refinement. Their verdict overrides story critic, first-touch critic, whole-chapter critic, learning critic, automated checks and historical scores.

Critic >=9 means only that a candidate may proceed to the next gate / user review. Only explicit user acceptance produces `user_accepted`.

No external users/testers or broader rollout are authorized before the current user's acceptance and later explicit authorization.

## Scope / safety boundaries

The new story/course generation contracts describe future Phase 3/4 behavior; they do **not** authorize Phase 2+, new model integrations, untrusted execution, external testers, paid provisioning or public rollout now.

Hosted auth, learner isolation, server-authoritative progression/evidence, immutable submitted evidence, assistance/exposure semantics, reset-progress confirmation and read-only historical review remain in force.