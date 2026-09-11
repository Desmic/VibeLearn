# Current checkpoint — user rejected first-touch story at 3/10

Updated 11 September 2026. **Status: `user_rejected` / `needs_revision`.** The current user's explicit verdict is authoritative and supersedes every agent/critic/automation score for acceptance.

## Latest user review

The newest user rating for first-touch/story quality is **3/10**. Do not average it with older scores.

The user identified that the earlier opening lacked good previous/back navigation, moved too quickly, told the story lazily, left scenario/causality/stakes unclear, and did not create the kind of creative/beautiful first impression expected from a game that could capture kids, teens and young adults.

The older 5/10 game / 5/10 learning verdict and the earlier internal 9+ critic passes are historical only. They did not predict the user's actual experience and are not acceptance evidence.

## Product north star — general learning-game generator

The root `CODEX-IMPLEMENTATION-PLAN.md` **1.6** is authoritative.

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

The Echo Forge replacement renders a continuous Three.js story world, has user-paced Back/Continue/Skip/Replay/Pause controls, and carries Signal 1 into the same world with progressive disclosure. Signal 1 now uses tutorial-state version **v3**, so older completion flags cannot silently suppress the materially redesigned tutorial; experienced regression tests deliberately mark this current version complete when they are testing the later campaign rather than onboarding.

The prior 390px post-success overflow was traced to the base objective header after tutorial guidance ended. The phone CSS now constrains the base objective/encounter containers rather than applying a Signal-1-only patch. That fix still requires confirmation in the next exact-build browser run before it can be called closed.

## Reusable Three.js framework checkpoint

Phase 1 is now proving a real runtime/adapter seam rather than only sharing renderer initialization:

- `web/story3d-runtime.js` owns WebGL renderer/canvas lifecycle, DPR policy, resize, frame scheduling, pause/reduced motion, context loss/restoration, resource cleanup and runtime stats;
- it now also owns a reusable aspect-aware **camera rig**: adapters supply landscape/portrait shot compositions while the shared runtime owns current/target vectors, interpolation, snapping and `camera.lookAt` application;
- `web/rescue-story3d.js` remains the Echo Forge-specific adapter: geometry/assets, lighting/art direction, camera compositions, story beat states and game-state-to-visual mapping;
- tests reject regressions where Echo Forge starts owning its own `WebGLRenderer`, `ResizeObserver`, `currentCam`, or `currentLook` camera loop;
- the full arbitrary generated-package loader is intentionally deferred until the later publishing/validation/security boundary exists.

This framework is reusable infrastructure for future generated fantasies, not evidence that the game is delightful. It earns zero automatic critic points. See [THREE-STORY-FRAMEWORK.md](THREE-STORY-FRAMEWORK.md).

## Verification state

The last completed CI before the camera-rig increment had green build/unit coverage but a browser failure caused by the full-campaign suite setting the redesigned Signal-1 tutorial's v3 completion key while the runtime still checked v2. The runtime and the experienced-campaign test are now intentionally aligned on v3. The camera-rig extraction and phone overflow fix must still pass the **same exact branch head** through build + all unit/backend + all browser suites before critics run.

No new first-touch/game critic score has been assigned yet. No current candidate is `ready_for_user_review`, and no claim is being made that these framework changes are deployed to Render.

Next implementation order follows the root plan:

1. get the exact branch head fully green across build, backend/unit and browser suites;
2. inspect 360/390/430 phone evidence for opening scenes, first action, first choice, visible duplicate/recovery and post-success state;
3. improve rendered first-touch magic if the evidence still looks materially below a commercial-game bar;
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
