# VibeLearn UI/UX direction — story-first commercial game

Status: active direction after user review on 10 September 2026. Read [STATE.md](STATE.md), [STORY-GENERATION-AND-CRITIC.md](STORY-GENERATION-AND-CRITIC.md), and [GAME-UX-SYSTEM.md](GAME-UX-SYSTEM.md).

## Product feeling

VibeLearn should feel like a **real game someone could plausibly choose from the Play Store or Steam**, with serious learning underneath. It must not feel like premium SaaS, a course website, or a slide deck wearing game art.

The current user is the sole real product reviewer during private refinement. The current Relay Rescue opening is user-rated **3/10 for first-touch/story quality** and is rejected.

## Story/world before UI shell

For every course/subject, begin with a compelling story/fantasy/world premise before deciding the final mission UI. The interface should feel native to the player role and world.

Long term, story/world/visual direction should adapt to learner preferences: genre, tone, realism vs fantasy, character style, visual style, pace, humor/darkness, exploration/action, and narrative density.

The story has its own single-story critic gate before game realization. A visually polished UI cannot compensate for weak storytelling.

## Current first-touch failures to avoid

The rejected opening exposed concrete UX failures:

- no previous/back control for story beats;
- automatic progression too fast;
- lazy/unclear storytelling;
- insufficient causal staging and emotional/world attachment;
- slide-like presentation rather than a lived/dramatized event;
- insufficient pull for kids, teens, and young adults.

These are product failures even if the information technically exists somewhere on screen.

## First-touch interaction direction

First-run story progression is **user-paced by default**. Back/previous is mandatory. Provide next/continue, pause/resume while animation runs, skip, replay, and visible progress/chapter position. Optional autoplay is secondary and pauses when the player interacts.

Tell stories through scene changes, character behavior, dialogue, environmental events, discovery, direct manipulation, conflict, consequence, and world reaction. Do not rely on explanatory cards/captions as the primary storytelling medium.

Capture attention before asking for difficult reasoning:

`story hook / beauty / curiosity -> character + world desire -> concrete problem -> one obvious action -> visible consequence -> easy recovery/success -> formal concept -> variation -> combination -> transfer`

## Playfield-first hierarchy

During early play, the world/playfield dominates. Evidence panels, analytics, learning metadata, journals, settings, helper drawers, long tool rails, and postmortems remain quiet/deferred until useful.

Underlying persistence/evidence can stay fully active without demanding visual attention. Introduce the smallest useful HUD/action dock as the player gains context and agency.

Saving should be understandable without implementation vocabulary. Do not expose backend/assessment terminology as player-facing chrome unless it becomes genuinely useful to the player's decision.

## 2D / 2.5D / Three.js 3D

Three.js 3D is a **serious candidate**, especially because the target kid/teen/young-adult audience may respond strongly to immersion, character/world presence, explorable spaces, environmental storytelling, atmosphere, and direct interaction.

For important story/game candidates compare:

1. authored 2D/illustrated animation;
2. 2.5D/parallax/layered scenes;
3. interactive Three.js 3D.

Choose the medium that best serves the story, learner preferences, subject, and mobile/device budget. Do not treat Three.js itself as quality. Weak story in 3D remains weak.

If 3D is chosen, keep local pinned assets, same-origin runtime, keyboard/touch equivalence, reduced-motion behavior, readable fallback, stable hit targets, and realistic mobile performance.

## Visual/game language

The visual system should come from the generated story/world rather than one permanent VibeLearn skin. Cross-course UI can preserve consistent accessibility, save/recovery, navigation, and evidence semantics while themes, materials, animation grammar, characters, environments, and HUD metaphors change with the story.

Use feedback to communicate state and consequence. Animation should make events, causality, success, failure, and transformation easier to feel/understand. Decorative motion alone is insufficient.

## Serious learning underneath

XP never determines mastery. Assistance remains recorded. Evidence stays inspectable and immutable. Familiar practice does not become independent mastery because the game celebrates it.

Story/game presentation may be highly imaginative, but target competencies, provenance, assessment integrity, learner isolation, and honest evidence claims remain rigorous.

## Accessibility

Required meaning survives reduced motion and sound off. Keyboard/touch, narrow screens, text enlargement, contrast, stable targets, story back/forward navigation, and usable fallback remain mandatory.

## Explicit non-goals

- one generic fantasy/story template for every course;
- a slideshow marketed as a cinematic;
- Three.js used only as visual decoration;
- copying another game's art/layout;
- manipulative streak loss, fake urgency, punishment, or grind;
- currencies/shops added merely to inflate engagement;
- hiding evidence/uncertainty behind celebration;
- simplifying technical material just to preserve flow.

## Documentation feedback loop

User feedback that changes story, first-touch controls, progression, rendering, visual hierarchy, acceptance, or future generation must be reflected in the appropriate repository docs in the same implementation unit.
