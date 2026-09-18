# Reusable worlds, assets and mechanics

**Active platform direction — 17 September 2026.** This replaces the narrower Episode-1 inventory framing. Read `GAME-CREATION-PLATFORM.md`, `COURSE-GENERATION-GAME-SYSTEM.md`, `ART-WORLD-DIRECTION-CRITIC.md` and `STATE.md`.

## Purpose

VibeLearn is a platform for creating learning games quickly. Reuse should reduce creation time **without forcing every game into the same map, art direction or interaction pattern**.

The current LLM track is the proof case. Extract reusable pieces from real needs; do not build a speculative universal engine.

## What counts as reusable

A useful reusable piece is:

- versioned;
- documented by semantic role;
- parameterizable;
- portable enough to survive story/theme changes;
- separable from canonical learning identity;
- tested in at least one real game need;
- ideally proven in a materially different fixture before being called general.

## World/environment kits

Future world kits should expose **layout as data**, not bake one diorama into code.

Parameterize:

- playable footprint/scale;
- prop density;
- negative-space targets;
- landmark spacing;
- path width;
- room/zone dimensions;
- camera clearance;
- lighting/environment states;
- material/palette variants;
- decoration intensity;
- spawn/interaction anchors.

The September 17 review found the current world too congested. Reuse that cannot make the same environment larger/calmer without rewriting the scene is insufficient.

Useful environment archetypes from the current proof track may include:

- lively town/square;
- limbo/void transition space;
- prison/unknown chamber;
- large blocked door/gate;
- corridor/route/landing;
- workshop/repair station;
- tower/vertical landmark.

These are semantic kits, not one fixed Bellweather layout.

## Character and embodiment assets

Reusable character systems should separate:

- model/rig/animation set;
- semantic character identity;
- protagonist/NPC role;
- direct-control profile;
- NPC behavior profile;
- camera follow/target profile;
- interaction anchors;
- presentation effects.

For the current track the player directly controls the robot protagonist. Do not spawn a generic separate player avatar by default.

A future game can choose another embodiment profile explicitly.

## Reusable cinematic/story primitives

Extract common staged transitions where implementation proves useful:

- establish-happy-world;
- interruption/thunder/storm;
- teleport/displacement;
- blackout/dark-limbo;
- progressive-light reveal;
- antagonist entrance;
- capability/item removal;
- door lock/unlock;
- reunion;
- world-restoration payoff;
- camera-to-gameplay handoff.

A cinematic primitive should expose timing, target entities, camera, lighting, audio and state transitions as data. Story-specific dialogue/names remain authored content.

## Reusable gameplay mechanics

Potential shared mechanics include:

- interact;
- move/look/orbit/recenter;
- inspect/scan;
- connect/repair;
- generate/advance step;
- choose context/input;
- compare alternatives;
- assemble/sequence;
- open/route/traverse;
- collect/use resource;
- construct/test/revise;
- dialogue/response;
- prediction before feedback;
- local retry/recovery.

Learning rules and evidence semantics remain separate from presentation mechanics.

## Tutorial/scaffolding assets

Tutorial capability should be reusable and spec-driven:

- one-action-at-a-time guidance;
- optional marker/focus;
- movement/look introduction;
- interaction prompt;
- clean first success;
- assistance tracking;
- scaffolding fade;
- skip/replay semantics where appropriate;
- transition into Level 1/first mission.

Tutorial is a product stage, not a label inside Level 1 by default.

## Art-direction variants

A reusable asset library needs enough controls that reuse does not look procedural/cheap.

Track:

- material/palette variants;
- scale ranges;
- silhouette variants;
- dressing sets;
- lighting compatibility;
- animation variants;
- semantic role;
- provenance/license/hash;
- performance metadata.

`ART-WORLD-DIRECTION-CRITIC.md` judges whether reused pieces look intentionally composed.

## Audio/FX reuse

Reusable lifecycle/cue primitives can cover:

- exploration motif state;
- danger/interruption;
- silence/limbo;
- reveal;
- interact/connect/repair;
- error/recovery;
- success/reunion;
- pause/mute/replay cleanup.

Final music/sound identity remains game-specific enough to avoid every generated game sounding identical.

## Pop-culture-informed ideation versus asset reuse

Cultural references are ideation inputs, not an asset library. Do not copy recognizable protected character models, music or dialogue merely because a story is inspired by them.

A `Wall-G`-style naming idea can inspire a fresh character naming pass; final shipped identity should be original.

## Existing current assets/components

Current code already contains useful building blocks such as:

- `game-runtime.js` / PlayCanvas runtime;
- `world-spec.js` / backend world compilation;
- `player-controls.js`;
- `game-opening.js`;
- `spec-game-world.js`;
- `game-audio.js`;
- learning session / authoritative command/save/revision infrastructure;
- procedural gates/lanterns/tower/planters and imported robot assets.

Their existence does not mean they are already general. Review each against the new platform contract before reuse.

## Extraction discipline

For each accepted chunk:

1. ship the player experience first;
2. identify repeated semantic capability;
3. parameterize only the repeated/stable part;
4. keep story nouns/cameras/dialogue out of shared code;
5. add a second materially different fixture when claiming generality;
6. add critic/regression coverage for the abstraction.

Fast game creation comes from a growing library of proven pieces, not maximum abstraction on day one.
# Prologue additions — 18 September 2026

- `companionRobot` in `web/rescue-world-props.js`: portable, original primitive
  robot silhouettes parameterized by color, round/rectangular shape and height.
  Two current companions use it; the controlled golden robot retains its asset.
- Existing lantern prefab, opening action and timeline mechanisms power the
  shared lantern ritual. No new cinematic engine or later-level content.
- Opening success data may override the body caption, removing instructions
  after the action instead of piling more text onto them.
- Prison reveal timing/groups are authored in the chapter package; shared runtime
  and learner evidence remain independent. No third-party assets were added.
