# VibeLearn UI/UX direction — story-first commercial game

**Status:** active direction · updated 12 September 2026. Read `STATE.md`, `STORY-GENERATION-AND-CRITIC.md`, `GAME-UX-SYSTEM.md`, `PLAY-CANVAS.md`, and `THREE-STORY-FRAMEWORK.md`.

## Product feeling

VibeLearn should feel like a **real game someone could plausibly choose from the Play Store or Steam**, with rigorous learning underneath. It must not feel like premium SaaS, a course website, a slideshow, or a web workbench wearing game art.

The current user is the sole real reviewer during private refinement. Their latest predecessor first-touch/story verdict remains **3/10** until they play the materially changed verified/deployed candidate.

## Story/world before UI shell

For every course/subject, begin with a strong story/fantasy/world premise before deciding the final mission UI. Interface language, materials, animation grammar, HUD metaphor and world feedback should emerge from the player role/story rather than from one permanent VibeLearn skin.

Today story/world direction is topic/outcome-driven. Future explicit learner-controlled story preferences may shape genre, tone, realism/fantasy balance, characters, visual style, pace, humor/darkness, exploration/action and narrative density without changing learning/evidence identity.

## Play Canvas is the visual hierarchy

The **Play Canvas** is the dominant persistent game surface. Story, exploration, mission play, consequences, progression, construction and transfer belong inside that surface.

Cross-course platform UI may preserve consistent accessibility, save/recovery, navigation and evidence semantics, but gameplay must not keep falling back to generic page/card shells.

For compatible world states, the visual transition should happen through camera/world/HUD change inside one Play Canvas rather than by destroying a cinematic and loading a lesson page.

## First-touch failures to avoid

The rejected predecessor exposed concrete failures:

- missing Back/previous story navigation;
- forced/too-fast progression;
- lazy/explanatory storytelling;
- weak causal staging and insufficient emotional/world attachment;
- slide-like presentation;
- insufficient pull for kids, teens and young adults.

These remain product failures even if every fact technically appears somewhere.

## First-touch interaction direction

First-run progression is user-paced by default. Back/previous is mandatory. Continue, Skip, Replay and progress are visible; Pause/Resume exists while animation runs; reduced motion keeps causal meaning/navigation.

Tell story through environment, action, character behavior, dialogue, discovery, conflict and consequence. Do not rely on caption cards as the primary storytelling medium.

Early-load curve:

`beauty / curiosity -> character + world desire -> concrete problem -> one obvious action -> visible consequence -> easy recovery/success -> formal concept -> variation -> combination -> transfer`

## Playfield-first hierarchy

During early play, world/action dominates. Evidence panels, analytics, learning metadata, journals, settings, helper drawers, long tool rails and postmortems remain deferred until useful.

Saving/recovery should be understandable in player language. Backend/assessment vocabulary should not occupy game chrome unless it is genuinely part of the player's decision.

## Rendering strategy: 2D / 2.5D / Three.js

For important story/game candidates compare:

1. authored 2D/illustrated animation;
2. 2.5D/parallax/layered interaction;
3. interactive Three.js 3D.

Three.js is a serious candidate for character/world presence, atmosphere, environmental storytelling, discovery, exploration and direct interaction, especially for the kid/teen/young-adult audience. It earns no quality credit merely for existing.

## Reusable world visual framework

When Three.js is chosen, use the shared framework under Play Canvas. Future stories/fantasies should integrate by supplying a **versioned world package**, not by creating a new renderer or game shell.

The long-term visual-authoring target is data-first:

- scene/entity graph;
- visual states and transitions;
- camera compositions for portrait/landscape;
- semantic interaction anchors;
- approved world-specific assets;
- semantic/fallback representation;
- optional reviewed adapter only for genuinely new capabilities.

This lets radically different fantasy styles coexist without one hard-coded VibeLearn look while preserving shared phone/accessibility/runtime behavior.

If a new theme requires story-specific edits to Play Canvas/runtime/host core, first ask whether the missing capability can be generalized/versioned. Do not pollute shared infrastructure with one world's art assumptions.

## Phone-first composition

Optimize current first touch and Chapter 1 for mainstream Android/iPhone portrait, roughly **360–430 CSS px** wide with tall aspect ratios.

Priorities:

- focal character/action large enough to read immediately;
- world uses most of the viewport;
- story/HUD overlays do not bury the event;
- thumb-sized reachable primary actions;
- safe-area handling;
- no horizontal overflow;
- bounded renderer performance/DPR;
- no device-specific fork without evidence.

Desktop polish follows after phone quality is strong.

## Visual/game language across generated courses

The framework supplies structural consistency, not a single art direction.

World packages may change:

- materials/colors/lighting;
- character and environment style;
- HUD metaphor and animation grammar;
- camera language;
- world reactions/rewards;
- sound/atmosphere where later supported.

They must preserve platform invariants: readable state, accessibility, clear actions, save/recovery, semantic fallback, honest evidence and safe performance.

## Animation and feedback

Animation should communicate causality, transformation, focus, success, failure or world response. Decorative motion alone is insufficient.

Inputs need immediate acknowledgement. Failure should be visible and understandable; recovery should teach rather than punish arbitrarily. Chapter payoff should materially change the world, not only show a report/score.

## Serious learning underneath

XP never determines mastery. Assistance/exposure remain recorded accurately. Evidence is inspectable/immutable where required. Familiar practice does not become independent mastery because the game celebrates it.

Story/game presentation may be imaginative; competencies, provenance, assessment integrity and learner isolation remain rigorous.

## Accessibility

Required meaning survives reduced motion and sound off. Keyboard/touch, text enlargement, contrast, stable targets, story navigation and meaning-equivalent fallback remain mandatory.

## Explicit non-goals

- one generic fantasy template for every course;
- one permanent VibeLearn visual skin;
- slideshow marketed as cinematic;
- Three.js used only as wallpaper;
- new renderer/app shell per generated course;
- manipulative streak loss/fake urgency/grind;
- currencies/shops added only to inflate engagement;
- hiding evidence/uncertainty behind celebration;
- simplifying important technical meaning only to preserve flow.

## Documentation feedback loop

User feedback that changes story, first touch, progression, rendering, Play Canvas/framework architecture, visual hierarchy, acceptance or generation must be reflected in the appropriate current docs in the same implementation unit.
