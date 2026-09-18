# World atmosphere, art direction, sound and cultural references

**Active direction — 17 September 2026.** Read `ART-WORLD-DIRECTION-CRITIC.md`, `GAME-CREATION-PLATFORM.md`, `LLM-RESCUE-STORY.md`, `GAME-OPENING-PROGRESSION.md` and `STATE.md`.

## A world worth inhabiting, not only looking at

The September 17 user review gives the current world an important mixed signal: it is interesting enough that a kid might **look at it**, but not yet good/clear enough that they would **play it**.

Preserve visual attraction while fixing spatial/gameplay usability.

The current play area is too congested. Prefer a larger world footprint and more negative space before adding detail. Use fewer, more meaningful props with room around the protagonist, current target and landmark.

Generated environments should carry explicit layout controls for scale, density, landmark spacing and path width.

## Current prologue contrast

The next proof-track prologue should use strong environmental contrast:

### Bellweather — normal/happy

- open, colorful, inhabited and safe;
- protagonist with robot friends;
- enough spatial room to read relationships and movement;
- playful ambient motion and sound;
- visual evidence that this is a place worth returning to.

### Rupture

- sudden thunder/energy/teleport disruption;
- lighting, camera, sound and character motion change together;
- clear before/after contrast rather than a caption claiming danger.

### Dark limbo

- temporarily stripped-down/dark space emphasizing displacement/loneliness;
- not so dark that required action/geometry becomes unreadable;
- use silence/sparse sound deliberately.

### Prison reveal

- lights come on progressively;
- an unfamiliar place becomes spatially understandable;
- a **large blocked door** creates an immediate environmental goal;
- antagonist entrance and speech-engine removal are staged clearly in the same space.

### Player control / tutorial

- camera settles into direct protagonist control;
- the player can read the room and goal before the HUD explains everything;
- first tutorial success should visibly change light/door/speech/world state.

## Spatial direction

World quality includes breathing room.

Required checks:

- does the protagonist have clear space around them?
- do props cluster into an unreadable diorama?
- can the player orbit/walk without immediately intersecting visual clutter?
- are landmarks separated enough to build a mental map?
- are paths wide enough for comfortable movement?
- would simply scaling the environment outward improve it? If yes, do that first.

## Art cohesion

Use a coherent shape/material/lighting language per world state. Reused asset kits must be art-directed into the setting rather than exposed as a generic library.

The current track can retain a stylized adventure look, but the new prison/limbo space should have a distinct yet compatible shape language from Bellweather.

## Sound behavior

- Original musical identity with state variants rather than a repeated generic loop.
- Happy-world motif can be interrupted/transformed by the rupture.
- Limbo may use sparse ambience/silence.
- Prison reveal gets readable lighting/mechanical cues.
- Speech-engine removal needs a distinct cue but cannot be sound-only information.
- Tutorial success/recovered speech gets a clear positive response.
- Separate Music/Effects/master mute and remembered device preferences.
- Pause/background/reload/replay must not stack loops.
- Actual listening is required before quality claims.

## Pop-culture inspiration

Research popular robots/characters/worlds in games, film, animation and literature to improve naming, character energy, emotional readability and visual motifs.

The user's `Wall-G` example illustrates the desire for a memorable culturally resonant robot identity. Treat that as an ideation pattern, not a shipping requirement or permission to copy an existing character. Produce original final names/designs/dialogue/music and keep every reference optional.

Useful references should work on two levels:

- recognizable players get an extra smile;
- uninitiated players still understand the joke/story/action.

## Reusable world/atmosphere library

The platform should eventually expose reusable, parameterized:

- environment kits;
- happy/danger/limbo/reveal lighting profiles;
- weather/thunder/teleport FX;
- doors/gates/prison-room kits;
- ambient-life props/animations;
- camera/cinematic transitions;
- world density/scale presets;
- music/ambience/cue lifecycle.

Do not make the current track wait for a universal asset system. Extract these only as implementation proves them useful.

## Art/world review evidence

Review moving sequences from multiple camera angles, not only hero screenshots. Check desktop and 360/390/430 portrait, movement/orbit/zoom, clipping/intersections, negative space, world density, landmark readability and before/after atmosphere.

A scene fails even if attractive when it is cramped, confusing to inhabit, only works from one camera, or uses decoration that obscures play.


## Narration direction — text now, optional voice later

Narration is a first-class but **optional** presentation layer.

For the current proof track, narration remains text-based. Future generated games
may use a narrator voice where it materially improves storytelling, particularly
for:

- prologues/opening scenes;
- chapter/location/time transitions;
- major reveals or world-changing events;
- brief emotional or thematic bridges.

Narration must never compensate for a world that is not visually understandable.
The scene still has to establish place, activity, action and consequence through
environment, animation, staging and camera. Narration may add tone, context,
compression and flavor after that visual foundation exists.

Narrator voice requirements:
- equivalent subtitle/text representation;
- complete comprehension when muted;
- separate control from music/effects where appropriate;
- no essential instruction or learning evidence delivered only through voice;
- pacing that respects user-controlled/reduced-motion presentation;
- a voice/personality that fits the game's audience and creative direction.

Game packages should explicitly choose narration mode rather than inheriting one
globally. Suggested spec-level values are conceptually:
`none | text | voice_with_text`. The current runtime uses `text`.

Do not implement a voice-generation/provider dependency merely to satisfy this
future contract. Provider/model/TTS selection remains replaceable platform
infrastructure when the capability is actually introduced.
