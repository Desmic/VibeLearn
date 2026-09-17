# VibeLearn game-creation platform — product direction

**Active product direction — 17 September 2026.** This document captures the user's current platform-level correction and supersedes narrower assumptions that VibeLearn is primarily one authored game. Read with `COURSE-GENERATION-GAME-SYSTEM.md`, `GAME-RUNTIME-ARCHITECTURE.md`, `GAME-AS-COURSE.md`, `GAME-OPENING-PROGRESSION.md`, `ART-WORLD-DIRECTION-CRITIC.md`, `CRITIC-POLICY.md` and `STATE.md`.

## North star

VibeLearn is a **platform for creating high-quality learning games quickly**, not a single game.

The current How-LLMs-Work track is the proof case. Its purpose is to prove that the product can combine:

- compelling game feel and story;
- rigorous learning mechanics;
- reusable world/runtime primitives;
- reusable assets and archetypes;
- fast iteration and deployment;
- evidence-aware assessment;
- critic/review loops that catch product failures before a learner sees them.

Do not broaden into a generic generation product before this proof track is genuinely good. The fastest route to the platform is to extract reusable capabilities from one excellent game rather than prematurely designing a universal game engine.

## What should be reusable

A future game should be assembled mostly from versioned specs, assets and mechanics rather than fresh renderer/application code.

Reusable layers should include:

- world/environment kits and configurable layout templates;
- character rigs, animation sets and control profiles;
- player-embodiment modes: direct protagonist control, separate avatar, external guide, cursor/strategy control, etc.;
- cinematic/story beats such as reveal, arrival, interruption, teleport, threat, rescue, reunion and payoff;
- lighting/weather/atmosphere state transitions;
- cameras, transitions and focus rules;
- doors, gates, rooms, bridges, lifts, routes and traversal primitives;
- interaction, collection, scanning, repairing, building, choosing, sequencing, prediction and inspection mechanics;
- tutorial/scaffolding patterns;
- progression/recovery/replay/save semantics;
- HUD/input/accessibility patterns;
- sound/music cue lifecycle;
- assessment/evidence adapters independent of the fiction;
- CI/browser/critic evidence templates.

Reusable does **not** mean visually identical. A world kit must expose composition, spacing, scale, density, material, lighting and dressing parameters so multiple games can feel materially different.

## Player embodiment must be explicit

Never infer a literal player avatar because the story says “you help X.” `GameDesignSpec` / `RuntimeExperienceSpec` must explicitly declare who the player controls and how the player exists in the fiction.

For the current LLM rescue proof track, the revised direction is **direct protagonist control**: the player controls the robot protagonist itself. There is no separate literal helper character unless a later design explicitly requires one.

This distinction must be visible in story, camera, controls, dialogue and tutorial design.

## Spatial-composition contract

The September 17 review found the current play area congested: the same content would feel substantially better if distributed over a larger footprint.

Future world generation therefore needs explicit spatial parameters and review:

- playable-area scale;
- prop/character density;
- minimum negative-space budget around focal interactions;
- landmark spacing;
- path width and traversal breathing room;
- camera collision/occlusion margin;
- phone and desktop composition budgets;
- maximum concurrent focal objects;
- alternate-camera intersection/occlusion checks.

Do not respond to visual weakness by adding more props. Larger, calmer space is often the higher-quality choice.

## Story and cultural inspiration

Story ideation should actively learn from games, films, animation, literature, mythology and contemporary culture. Extract techniques—character hooks, reversals, silhouettes, pacing, humor, naming rhythm, visual motifs—not copies.

Pop-culture-informed naming and jokes may be explored during ideation. For example, a playful robot name with the recognizability of a “Wall-G”-style homage can be considered as a creative direction, but shipping characters, names, designs, dialogue, music and assets should remain original and should not depend on confusing similarity to an existing property.

References are optional reward layers. A learner who recognizes none of them must still understand the story and play.

## Art/world direction is a separate product discipline

A technically correct WorldSpec can still produce a bad place. Every serious candidate requires an **art/world-direction critic** in addition to story, gameplay and learning critics.

That critic owns spatial composition, scale, negative space, silhouettes, visual hierarchy, palette/material cohesion, landmark readability, world density, prop placement, clipping/intersection, camera framing, environmental storytelling, atmosphere and whether reusable assets look intentionally composed rather than procedurally dumped.

See `ART-WORLD-DIRECTION-CRITIC.md`.

## Future agent system

The platform should eventually support coordinated agents for:

- research/source gathering;
- game/story ideation;
- narrative design;
- art/world direction;
- game/mechanic design;
- learning design;
- implementation/world compilation;
- asset selection/generation;
- story critic;
- art/world critic;
- gameplay critic;
- learning/transfer critic;
- test generation;
- CI/CD/release orchestration;
- regression triage and repair proposals.

Agents must communicate through versioned artifacts/specs and evidence, not hidden assumptions. A creator agent must not self-certify its own work. Critic agents are internal tools, not substitutes for the user's product judgment.

This multi-agent creation system is **future work**. Do not pause the current proof track to build the orchestration platform. First prove the workflow manually/tool-assisted on one excellent track, then automate the repeated roles.

## Current proof-track gate

The current track should prove this sequence:

`learning goal -> researched story/world ideation -> art/world direction -> game design -> reusable spec/world assembly -> playable prologue -> separate tutorial -> Level 1 -> technical CI -> story critic -> art/world critic -> game critic -> learning critic -> user review`

A failure in one discipline is not averaged away by strength in another.

## Extraction rule

After each accepted chunk, ask:

1. What was story-specific and should remain data?
2. What mechanic/runtime capability is reusable?
3. What asset/archetype can be parameterized?
4. What critic/test should become a platform invariant?
5. Can the same reusable piece create a materially different game/world without copying this track's nouns or layout?

Extract only capabilities proven useful by real game needs. Avoid speculative framework growth.
