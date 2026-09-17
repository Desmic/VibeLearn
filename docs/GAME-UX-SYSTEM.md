# VibeLearn game UX system — the game is the course

**Active direction — 17 September 2026.** Read `GAME-CREATION-PLATFORM.md`, `GAME-OPENING-PROGRESSION.md`, `ART-WORLD-DIRECTION-CRITIC.md`, `CRITIC-POLICY.md` and `STATE.md`.

## Product standard

Build a game whose subject-relevant actions develop intended capabilities and whose experience is good enough that a curious younger player or young adult would voluntarily continue.

Do not mistake a beautiful scene, 3D renderer, quiz, XP system or game-themed website for that product.

## Player embodiment

The UX must reflect the declared player embodiment.

For the current proof track the player directly controls the robot protagonist. Remove the literal helper/`you` avatar model. Camera, movement, prompts and dialogue should all reinforce direct control.

Future games may use different embodiment modes, but the mode is explicit configuration/design, not inferred from story wording.

## Prologue, tutorial and Level 1 are different jobs

Current default structure:

`prologue/story orientation -> separate tutorial -> guaranteed practice success -> Level 1 mission -> recoverable challenge -> payoff`

The prologue establishes world, disruption, character/stakes and immediate need.

The tutorial teaches reusable control/interaction grammar and the minimum learning interaction.

Level 1 is the first actual mission and should not feel like onboarding.

## Story before interface

For every course, begin with a compelling world/premise and player role before deciding the final mission UI.

Text, dialogue, animation, camera, sound, lighting and world-state changes must describe the same visible events. Do not rely on caption cards to compensate for an unchanged scene.

## Spatial UX and breathing room

Treat world density as a UX budget.

The September 17 user review found the current play area too congested. Required generation/review parameters now include:

- playable footprint;
- prop/actor density;
- negative-space minimums;
- path width;
- landmark spacing;
- camera occlusion margin;
- maximum simultaneous focal objects;
- phone/desktop composition targets.

If the same content would feel better simply spread over a larger area, enlarge the world before adding detail.

## Play Canvas is the primary experience surface

The persistent 3D world remains the main experience surface. Story, exploration, tutorial, missions, consequences and progression should feel like states of one game rather than course pages.

DOM HUD/subtitles/accessibility remain valid support layers, not a second gameplay renderer.

## First-touch UX

The early-load ladder should usually be:

`beauty / curiosity -> normal-world desire -> disruption -> concrete need -> one obvious action -> visible consequence -> tutorial success -> Level 1 problem`

For the current proof track, the working emotional transition is:

`happy Bellweather -> dramatic rupture/teleport -> dark limbo -> lights reveal unknown prison/large blocked door -> antagonist removes speech engine -> direct protagonist control`.

Only one actionable target should dominate at a time during onboarding.

## HUD / visible-complexity budget

Keep default play sparse:

- one short current goal;
- one primary contextual action;
- secondary detail collapsed/deferred;
- no evidence/analytics jargon during first touch;
- no overlapping prompt stacks;
- stable tap/focus targets;
- obvious save/recovery state in player language.

Optional technical/model inspection can appear after the player understands the core loop.

## Easy to play, hard to master

Difficulty rises through reasoning, uncertainty, competing relevant context, combination of familiar mechanics and reduced scaffolding.

Do not make later content harder by adding more UI, unexplained controls, smaller targets or navigation friction.

## World continuity and art direction

Preserve meaningful world objects/relationships as complexity rises. Each success should change something tangible.

Run the independent art/world critic for:

- space/negative space;
- silhouettes/identity;
- clipping/intersections;
- focal hierarchy;
- landmarks/navigation;
- art cohesion;
- atmosphere/state contrast;
- alternate camera views;
- device composition.

A world can be attractive to look at but still fail as a place to play.

## Pop-culture inspiration

Game/story ideation may learn from popular culture, games, film, animation and literature. References/naming wordplay should add personality but must remain optional. Final assets/characters/story should be original and understandable without recognizing the inspiration.

## Phone-first without world-small

Optimize controls/HUD for 360–430 CSS px portrait, safe areas, touch, text enlargement and reduced motion.

Phone-first does **not** mean compressing the world into a tiny island. A large/spacious world can still use a readable camera and compact HUD.

## Reusable UX system

The platform should reuse configurable:

- player/control profiles;
- tutorial/scaffolding steps;
- camera/cinematic beats;
- world transitions;
- interaction prompts;
- HUD slots;
- pause/replay/reset/logout patterns;
- accessibility/audio behavior;
- world density/layout parameters.

Reuse must be parameterized enough that generated games do not feel like the same map with new labels.

## Review questions

At every candidate ask separately:

1. Would someone stop and look?
2. Would they understand what to do?
3. Would they enjoy doing it and continue?
4. Does the world/story make the action matter?
5. Does the action embody the learning target?

A yes to only the first question is not success.

## Platform/future-agent boundary

Future agents may handle UX/world generation, art direction, critic roles and regression checks through versioned specs/evidence. Current priority is to prove the system manually/tool-assisted on one excellent track before automating the pipeline.
