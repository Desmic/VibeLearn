# 3D prologue, tutorial and progression — current product contract

**Active direction — 17 September 2026.** This document supersedes conflicting older opening/tutorial guidance. Read with `LLM-RESCUE-STORY.md`, `GAME-CREATION-PLATFORM.md`, `ART-WORLD-DIRECTION-CRITIC.md`, `CRITIC-POLICY.md` and `STATE.md`.

## Product journey versus Level 1

The product journey begins at first entry; **Level 1 does not**.

Required order:

`entry/auth -> prologue/opening -> separate tutorial -> guaranteed practice success -> Level 1 mission -> recoverable challenge -> payoff -> later levels`

Do not label basic onboarding inside Level 1. The tutorial teaches reusable play grammar; Level 1 is the first actual mission/problem.

## Current track: direct protagonist control

The current LLM proof track uses a directly controlled robot protagonist. There is no separate literal helper/player avatar. Story phrases such as “help the robot” must not be interpreted as permission to spawn a second `you` character.

Every generated game must explicitly declare its embodiment model in `GameDesignSpec`/`RuntimeExperienceSpec`, for example:

- direct protagonist;
- separate avatar assisting another character;
- external guide/cursor;
- strategy/management controller;
- other explicit model.

Story, camera, input and tutorial must agree with the declaration.

## Current working prologue direction

The next design pass starts from this causal sequence unless a clearly stronger alternative is reviewed:

1. **Bellweather happy/alive.** Establish a place worth losing: protagonist + robot friends in a joyful, inhabited world.
2. **Dramatic rupture.** Thunder/energy/another authored event violently interrupts normality. Text, sound, lighting, camera and animation change together.
3. **Teleport/displacement.** The protagonist and friends are torn out of Bellweather.
4. **Dark limbo.** The protagonist is alone in darkness; hold long enough to establish contrast.
5. **Reveal unknown prison.** Lights come on progressively and expose a new space with a large blocked/locked exit door.
6. **Antagonist action.** An evil robot visibly removes the protagonist's speech engine. Keep cause and consequence in the same readable composition.
7. **Take direct control.** Transition from cinematic camera to the normal declared control camera.
8. **Tutorial/Prologue play.** Teach movement/look/interact/menu and the minimum speech-repair/core learning interaction with low/no failure pressure.
9. **Clean success.** Restore enough speech/capability to open the first way forward.
10. **Level 1 begins.** The first mission can assume basic controls and focus on the first real LLM challenge/story problem.

The exact fiction/effect can evolve; the before/after emotional contrast, personal loss, confinement, direct control and separate tutorial boundary are the important structure.

## Storyboard contract

Do not implement prose first and add animation afterward. Each beat must define one synchronized causal unit:

| Field | Requirement |
|---|---|
| world-before | What the player sees before the beat |
| event | What visibly happens |
| camera/focus | What the composition makes important |
| acting/reaction | What characters/world do in response |
| text/dialogue | Minimal words reinforcing the visible event |
| sound/light/effect | Supporting cue, never sole essential information |
| player action | Optional interaction, one clear action where used |
| world-after | Persistent visible consequence |
| newcomer takeaway | What a cold-start player should now understand |

Rendered review asks: **does the scene itself convey the story we wrote?** Presence of captions/animations is insufficient.

## Opening controls

- Skippable on first entry.
- Back/previous for user-paced story beats where applicable.
- Replay scene/opening without mutating progression.
- Pause/resume while motion runs.
- Reduced motion preserves causal states and navigation.
- Muted play preserves all essential information.
- Returning players resume saved progress rather than replaying the prologue automatically.
- Explicit replay returns to prior gameplay state unchanged.

Skipping the cinematic does **not** skip the separate essential tutorial.

## Tutorial contract

Tutorial goals are reusable interaction grammar, not subject mastery.

Teach only what is needed immediately:

1. move/look/recenter as appropriate;
2. interact with one obvious world target;
3. understand one game-menu/replay/reset affordance if necessary;
4. experience the minimum core learning mechanic;
5. receive immediate visible acknowledgment/success;
6. transition cleanly into Level 1.

No normal intentional failure before the first tutorial success. No dense system inspector, evidence dashboard or advanced mechanic during onboarding.

## Level 1 contract

Level 1 should feel like the **first mission**, not onboarding.

Default shape:

`clear story problem -> familiar action -> new LLM concept demand -> recoverable mistake -> visible reason it failed -> corrected attempt -> changed-context application -> world payoff`

Difficulty rises through reasoning, uncertainty, relevant competing context and fading scaffolding—not through unexplained controls, camera hunting or more text.

## World scale / composition contract

The September 17 user review found the current world too congested. Generated worlds must carry explicit layout parameters:

- playable footprint/scale;
- prop density;
- negative-space minimums around focal interactions;
- landmark distance;
- path width;
- camera/occlusion margins;
- maximum simultaneous focal objects;
- phone/desktop framing targets.

A scene that would improve simply by spreading the same content over more space should be revised before art/detail is added. See `ART-WORLD-DIRECTION-CRITIC.md`.

## No 2D gameplay fallback

PlayCanvas remains the current full 3D backend. Engine/module/context failure shows honest loading/recovery UI with Retry and safe navigation; never silently continue in the retired SVG/CSS/DOM game. Accessible DOM HUD/subtitles/menu controls over 3D remain valid.

## Progression across later levels

After the tutorial and Level 1, new levels reuse established controls/world grammar and add one major cognitive burden at a time. Preserve familiar objects/relationships where they help the mental model.

Difficulty can grow through:

- less scaffolding;
- multiple relevant observations;
- ambiguity/uncertainty;
- combination of previously learned mechanics;
- transfer to a new context;
- trade-offs;
- planning and diagnosis.

It should not grow through denser HUDs, longer instructions, unexplained input schemes or arbitrary navigation friction.

## Review/acceptance

Before internal readiness, inspect the exact candidate through:

- story critic;
- **art/world-direction critic**;
- first-touch/gameplay critic;
- whole-chapter critic;
- learning/transfer critic;
- technical/browser/accessibility gates.

Inspect desktop and 360/390/430 portrait, touch/keyboard, alternate camera angles, enlarged text and reduced motion where applicable. Explicitly check actor/prop clipping, duplicate protagonists, spatial congestion and whether the story remains clear without reading design docs.

The user's verdict remains final.

## Platform/reuse boundary

This track is the proof case for `GAME-CREATION-PLATFORM.md`. Implement opening/tutorial/progression as spec-driven capabilities:

- player embodiment profile;
- cinematic beat/state-transition primitives;
- environment/lighting transitions;
- tutorial step/scaffolding patterns;
- reusable room/door/gate/traversal kits;
- density/scale/layout parameters;
- audio/FX cues;
- HUD/accessibility patterns.

Story nouns, exact cameras/dialogue and episode logic belong in authored package data. Do not create a universal engine speculatively; extract components that the proof game actually needs.

Historical Echo Forge/Signal-specific progression remains historical reference only and must not override this active contract.
