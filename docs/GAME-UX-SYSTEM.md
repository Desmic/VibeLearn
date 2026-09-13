# VibeLearn game UX system — the game is the course

**Current user contract — 13 September 2026:** Read [GAME-OPENING-PROGRESSION.md](GAME-OPENING-PROGRESSION.md) before implementation or review. The `16a655e` experience was user-rejected. Require a first-entry skippable 3D opening, tutorial with early success, gradual progression, optional non-destructive replay at every level, and no automatic opening for Level 2+ players. Remove the 2D gameplay fallback; preserve accessible HUD controls and honest 3D recovery. This amendment supersedes conflicting legacy guidance below.

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

PlayCanvas Engine renders the fully 3D Phase 1 world. GameRuntime is the persistent orchestration layer.

The game should not feel like:

- story overlay -> mission page -> workbench page -> report page;
- course cards with a canvas inserted between them;
- one renderer/canvas lifecycle per lesson;
- a world that disappears when reasoning becomes difficult.

For compatible states, keep a persistent Play Canvas stage/world/runtime and update state/camera/HUD. Accessible semantic DOM HUD actions remain essential but support the game surface rather than becoming dashboard-first architecture.

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

## 3D runtime and reusable worlds

Current Phase 1 is fully 3D through PlayCanvas Engine. Opening, tutorial, missions, construction and transfer use the persistent GameRuntime and engine-neutral WorldSpec. Three.js code is legacy reference only. There is no 2D/2.5D choice or silent 2D gameplay fallback in this delivery.

Generated settings supply validated specs/data, approved assets, camera compositions, semantic interaction anchors and HUD schedules. They do not create a new renderer or game shell. Preserve accessible DOM input semantics over the 3D world. Loading/context failure gets an explicit recoverable screen, not a playable old game.

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

## Foundation: games generated from learning needs and preferences

User reaffirmed the ultimate product goal on 13 September 2026: generate games on demand from what a user needs to learn and their explicit preferences. Echo Forge is the reference, not the framework. LearningSpec, explicit UserPreference/StoryPreference inputs, StoryWorldSpec, GameDesignSpec, GameRulesSpec, WorldSpec, RuntimeExperienceSpec and versioned AssetRefs must compose through shared validators/runtime. Canonical learning and evidence cannot depend on theme, assets or engine. Preferences may influence setting, tone, presentation, pace and interaction style without weakening outcomes or assessment. Never infer unstated preferences.

Implement the opening/tutorial/HUD/progression as reusable, spec-driven capabilities and assets; keep Echo Forge dialogue, beats, cameras and object IDs in the reference package. New games must not require copied opening controllers or new renderer lifecycles. Prove a materially different fixture through shared components. This foundations work does not claim that an on-demand generator/model integration is already implemented or authorize unrelated Phase 2 work.
