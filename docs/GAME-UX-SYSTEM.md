# VibeLearn game UX system — the game is the course

**Active direction · updated 12 September 2026.** Read with `GAME-AS-COURSE.md`, `STORY-GENERATION-AND-CRITIC.md`, `STATE.md`, `GAME-UX-REVIEW.md`, `COURSE-GENERATION-GAME-SYSTEM.md`, `PLAY-CANVAS.md`, and `THREE-STORY-FRAMEWORK.md`.

## Product standard

Build a game whose meaningful subject-relevant actions develop intended course capabilities. It must earn voluntary play from a curious younger non-specialist and an older teen/young adult.

Do not mistake a game-themed website, a beautiful scene, quizzes, XP, or a 3D renderer for that product.

The current user is the sole real product reviewer during private refinement. Their explicit verdict overrides critic/agent/automation scores. The predecessor first-touch/story verdict remains **3/10** until they review a materially changed verified/deployed candidate.

## Story before interface

For every course/subject, generate a compelling **story/fantasy/world premise before gameplay/UI realization**. The interface emerges from the world/player role, not a generic lesson shell.

Current story selection is topic/outcome-driven. Future explicit learner preferences may influence genre/tone/world/visual style, but are not inferred today.

## Play Canvas is the primary experience surface

The **Play Canvas** is the persistent surface in which story, exploration, missions, visible consequences, progression, building and transfer are staged.

Three.js/2D/2.5D are rendering backends inside it. None is the product shell.

The game should not feel like:

- story overlay -> mission page -> workbench page -> report page;
- course cards with a canvas inserted between them;
- one renderer/canvas lifecycle per lesson;
- a world that disappears when reasoning becomes difficult.

For compatible states, keep a persistent Play Canvas stage/world/runtime and update state/camera/HUD. Semantic DOM actions/fallback remain essential but support the game surface rather than becoming dashboard-first architecture.

## Attention first, cognition second

Default early-load ladder:

`beauty / curiosity / hook -> character + world desire -> concrete need -> one obvious action -> visible consequence -> easy recovery/success -> formal concept -> variation -> combination -> boss/transfer`

For the first/tutorial chapter:

- establish character/world attraction before jargon;
- demonstrate important objects/functions through action/animation/interaction/consequence;
- dramatize what happened, what changed, what is uncertain and why it matters;
- make the player's role causally meaningful;
- expose one obvious action at a time until interaction grammar is understood;
- keep nonessential evidence/analytics/settings out of first touch;
- use informative failure followed by easy recovery;
- name formal concepts after a concrete mental model exists where faithful.

The first chapter fails if a fresh novice cannot explain who/what matters, what they want, what happened, what changed, why it matters and what the player can do.

## First-touch story UX

- Back/previous is mandatory.
- User-paced progression is the default.
- Continue, Skip, Replay and progress position are visible.
- Pause/Resume exists while motion runs.
- Optional autoplay is secondary and pauses on interaction.
- Back/forward restores coherent world state.
- Reduced motion preserves causal meaning/navigation.
- Ordinary failure/resume must not force long exposition replay.

Longer timers do not fix weak storytelling. Tell story through scenes, character behavior, discovery, dialogue, conflict, environment change and consequence.

## Game/learning gates stay separate

A great story with boring play fails. Fun play with shallow learning fails. Rigorous learning nobody wants to continue also fails the product.

Required sequence:

`story >=9 -> first-touch >=9 -> whole chapter >=9 -> learning/transfer >=9 -> user review`

## Game design invariants

**Narrative before jargon, where faithful.** Establish desire/conflict/causality/player role first.

**Subject thinking inside play.** Investigate, manipulate, compare, arrange, construct, diagnose, test, explore or control systems when those actions embody the target capability.

**Confidence before complexity.** Easy success -> variation -> combine -> transfer. New tools expand agency rather than menu count.

**Curiosity without coercion.** The reason to continue survives hiding XP. No shame/streak pressure/fake urgency/grinding.

**World continuity as cognitive support.** Preserve established character/world/causal objects as complexity rises where they still carry meaning.

## HUD / visible-complexity budget

Treat visible UI complexity as a budget. Underlying save/evidence/assistance semantics may remain fully active while first touch shows only what matters now.

Introduce the smallest useful HUD/action dock progressively. Evidence panels, journals, analytics, settings, helper drawers and technical debrief remain secondary until useful.

Every input gets acknowledgement. Pending saves prevent duplicate action. Focus/tap targets remain stable through redraws. Navigation must not silently discard work.

## Rendering choice: 2D / 2.5D / Three.js

For important story/game candidates explicitly compare:

1. authored 2D/illustrated animation;
2. 2.5D/parallax/layered interaction;
3. interactive Three.js 3D.

Three.js is a serious option for attention, world presence, character attachment, atmosphere, exploration and environmental storytelling—especially for kids/teens/young adults—but earns no automatic quality points.

## Reusable Three.js world framework

The user explicitly requires a **framework that makes future fantasy/story settings easy to integrate**.

When Three.js is chosen:

- Play Canvas remains the higher-level game surface;
- `story3d-runtime.js` owns generic renderer/camera/lifecycle/device behavior;
- `story3d-world-host.js` owns package/adapter compatibility;
- story-specific worlds supply package data/assets/compositions/states/anchors;
- renderer/world state never decides assessment or evidence.

### Data-first authoring direction

Future generated worlds should increasingly be declarative `WorldPackageSpec`s interpreted by trusted shared code, not arbitrary generated JavaScript.

World packages should describe scene/entity graph, visual states, camera compositions, interaction anchors, approved assets and fallback semantics. Custom adapter code is an exceptional reviewed extension.

A second fantasy should integrate by adding/replacing its world package, not by cloning renderer lifecycle or modifying Play Canvas/runtime/host with story-specific assumptions.

Do not over-generalize speculatively: shared primitives grow from real multi-world needs and remain versioned/story-neutral.

## Phone-first target

Current refinement targets mainstream modern Android/iPhone portrait, roughly **360–430 CSS px**, tall aspect ratios, touch, safe areas, text enlargement and reduced motion. Desktop polish follows later.

## Current Relay Rescue implication

Echo Forge remains the current reference story/world, but the user's 3/10 controls acceptance until they review the replacement.

Opening -> Signals 1-6 should converge on persistent Play Canvas world presence. Signal 6 construction is a priority because it risks reverting to themed web-workbench UI. Signal 7 may change context intentionally but remains a Play Canvas game mode.

## Learning integrity

World truth and player knowledge remain distinct. Commands/evidence are server authoritative. Submitted evidence remains immutable except explicit learner-scoped reset. XP never decides mastery/correctness.

Observed simulation feedback is guided assistance, not fresh independent prediction. Unknown/current help/prior exposure remain distinct.

## Documentation continuity

User feedback that changes story, onboarding, progression, rendering strategy, Play Canvas/framework architecture, visual hierarchy, acceptance or course generation must be reflected in the relevant current docs in the same implementation unit.

Current work remains private Phase 1. No new model integration, untrusted runner, external testers, paid provisioning or public rollout without explicit authorization.
