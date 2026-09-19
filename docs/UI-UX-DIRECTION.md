# VibeLearn UI/UX direction — story-first commercial game

**Current review checkpoint — 19 September 2026:** The UI/UX direction below is embodied in frozen candidate `92a5ecbdc803362ee1554fca6ae811adb155bc26` far enough for post-CI review. The next UX work is not another redesign pass by default: run cold-observer/motion/physicality/handoff/audio/learning critics, then repair only proven blockers. Render remains on rejected `ad14c5aced6cf053c7617dfb03245506e1e9dad5`; no Level 2.

**Active direction — 17 September 2026.** Read `GAME-UX-SYSTEM.md`, `GAME-OPENING-PROGRESSION.md`, `GAME-CREATION-PLATFORM.md`, `ART-WORLD-DIRECTION-CRITIC.md` and `STATE.md`.

## Product feeling

VibeLearn should feel like a real game someone could plausibly choose from a store, with rigorous learning underneath. It must not feel like SaaS, a course website, a slideshow or a web workbench wearing game art.

The current user is the final product reviewer during private refinement.

## Direct protagonist control for the current proof track

The current LLM track should not render a separate literal helper/player character. The player directly controls the robot protagonist.

Prompts, camera, controls and story language must all agree with that embodiment. Future games may declare another embodiment model explicitly.

## Story/world before UI shell

Generate a strong story/fantasy/world premise before final mission UI. Interface language, materials, animation grammar, HUD metaphor and feedback should emerge from the player role/story rather than one permanent VibeLearn skin.

Current working prologue direction:

`happy Bellweather -> violent interruption/teleport -> dark limbo -> lights reveal unknown prison and large blocked door -> antagonist removes speech engine -> direct control -> separate tutorial -> first mission`

## Spacious playfield-first hierarchy

The September 17 review identified the current world as too congested. The same content should often be **spread over more space** rather than decorated further.

World/layout generation must support:

- larger playable footprint;
- negative-space targets;
- prop/actor density limits;
- landmark spacing;
- wider paths/traversal room;
- camera clearance/occlusion margin;
- device-specific compositions without changing canonical world truth.

The 3D playfield remains dominant; HUD supports rather than compresses it.

## First-touch failures to avoid

- duplicate/ambiguous protagonist-looking characters;
- visible actor/prop intersection;
- story text describing events the world does not show;
- tutorial hidden inside Level 1;
- unexplained player embodiment;
- cramped world scale;
- slide-like progression;
- weak causal staging;
- attractive visuals without a reason to act/continue;
- dense HUD or excessive markers.

## First-touch interaction direction

First-run progression is user-paced. Back/previous, Continue, Skip, Replay and visible progress are available where applicable; Pause/Resume exists while animation runs; reduced motion preserves causal meaning.

Opening and tutorial have different purposes. The opening sells/establishes the world and conflict; the tutorial lets the player safely learn control/interaction grammar and earn a clean success before Level 1.

## Visual storytelling

Tell story through environment, action, character behavior, dialogue, discovery, conflict, lighting and visible consequences. Captions support the scene rather than becoming the primary medium.

For each beat, the focal event should be legible before reading the caption.

## Art/world-direction critic

Every candidate needs independent art/world review for:

- scale and negative space;
- focal hierarchy;
- character silhouette/identity;
- geometry/clipping;
- landmark readability;
- camera sweep;
- palette/material/lighting cohesion;
- atmosphere/state contrast;
- reusable-asset composition;
- phone/desktop framing.

See `ART-WORLD-DIRECTION-CRITIC.md`.

## Pop-culture inspiration

Story/character naming and motifs may be inspired by popular film/games/animation/literature. Use inspiration to create memorable original characters and humor, not copies. A cultural reference is optional texture, never an essential clue or prerequisite.

## Phone-first composition

Optimize current first touch for 360–430 CSS px portrait with touch/safe areas/text enlargement/reduced motion.

Priorities:

- focal protagonist/action immediately readable;
- world uses most of viewport;
- HUD does not bury event;
- thumb-sized primary controls;
- no horizontal overflow;
- stable performance/DPR;
- spacious world is preserved through camera choice rather than shrinking the map.

## Reusable platform UX

The future platform should compose versioned world kits, layouts, character/control profiles, cinematic beats, tutorial patterns, mechanics and HUD/audio/accessibility components. Reuse must permit substantially different visual identity and spatial composition.

Future creation/critic/CI agents may automate this pipeline, but the current proof track must establish quality and reusable boundaries first.
