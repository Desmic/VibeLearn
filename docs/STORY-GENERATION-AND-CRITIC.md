# Story generation and rendered-story review

**Active direction — 17 September 2026.** Read `LLM-RESCUE-STORY.md`, `GAME-CREATION-PLATFORM.md`, `GAME-OPENING-PROGRESSION.md`, `ART-WORLD-DIRECTION-CRITIC.md` and `CRITIC-POLICY.md`.

## Story ideation before realization

Research a varied set of games, films, animation, literature, mythology and contemporary culture before freezing a premise. Extract techniques rather than copying surface IP:

- memorable protagonist/character hook;
- naming energy and rhythm;
- visual archetypes/silhouettes;
- normal-world baseline;
- inciting disruption;
- mystery/reveal structure;
- humor;
- relationship motivation;
- world-state contrast;
- payoff and forward pull.

Pop-culture-inspired wordplay or homages may be explored in ideation. A `Wall-G`-style robot name is an example of the desired recognizability/energy, not permission to ship a confusingly derivative character. Final names, designs, dialogue, music and assets should remain original and the story must work for players who recognize no reference.

## Explicit player embodiment

Story treatment must declare who the player controls. Never invent a separate literal avatar because prose says “you help X.”

For the current proof track the player directly controls the robot protagonist. Camera, dialogue, animation and tutorial must all reflect that.

## Current proof-track story direction

The next prologue should establish a strong before/after causal chain:

`happy Bellweather with protagonist + friends -> dramatic thunder/disruption -> teleport/displacement -> protagonist alone in dark limbo -> lights reveal unknown prison/large blocked door -> evil robot visibly removes speech engine -> direct control -> separate Tutorial/Prologue -> clean first success -> Level 1`

Exact fiction may improve during ideation, but the rendered experience needs the same clarity: normality, rupture, loss, confinement, antagonist-caused damage, agency and a reason to act.

## Renderability contract

A written story is not enough. Every beat must map to observable staging:

- world-before;
- event/action;
- camera/focus;
- acting/reaction;
- minimal text/dialogue;
- lighting/sound/effect;
- optional player action;
- world-after;
- newcomer takeaway.

Text, animation, camera, sound and world changes must communicate the same beat together. If captions carry the story while the scene remains essentially unchanged, the rendered story fails regardless of prose quality.

## Story critic versus art/world critic

Story critic asks:

- do we understand who/where/what changed?
- is causality visible?
- is there a reason to care?
- does each beat create the next?
- does the player role make sense?

Art/world critic separately asks whether the world composition, scale, silhouettes, density, landmarks, clipping, atmosphere and camera staging actually support that story. A strong script cannot rescue a cramped or visually broken world.

## Cultural inspiration rule

References can reward recognition but cannot:

- carry an essential clue;
- substitute for character motivation;
- require familiarity for humor/stakes;
- turn the game into a collage of borrowed properties.

Research influences with sources where useful; record the design technique we are borrowing, not just the title.

## Review method

1. Freeze one story candidate.
2. Review premise, character desire, conflict, causal chain, player embodiment, progression and payoff for contradictions/production risks.
3. Do **not** assign rendered-story quality from the treatment.
4. Implement the smallest coherent prologue slice.
5. Review actual play cold where possible.
6. Compare rendered beats to the written storyboard.
7. Run `ART-WORLD-DIRECTION-CRITIC.md` separately.
8. Repair before implementing later levels.

The current user is the sole human product critic and final authority.

## Platform direction

Story generation should eventually be supported by ideation/research/critic agents operating on versioned StoryWorldSpec artifacts. That multi-agent pipeline is future work. For now, prove the process manually/tool-assisted on the current track and extract reusable story/cinematic primitives only when the game demonstrates their value.
