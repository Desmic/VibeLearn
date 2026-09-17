# The game is the course

**Active direction — 17 September 2026.** Read `GAME-CREATION-PLATFORM.md`, `GAME-OPENING-PROGRESSION.md`, `ART-WORLD-DIRECTION-CRITIC.md`, `CRITIC-POLICY.md` and `STATE.md`.

VibeLearn's goal is not to produce a course decorated like a game. Meaningful play should deliver the learning outcome, ideally more effectively and memorably than a conventional course.

## One excellent proof track before broad generation

The current How-LLMs-Work game/learning track is the proof case for the broader platform. Do not optimize it as a throwaway demo, but do not pause it to build the full generic generator/multi-agent platform either.

The proof must show that we can create a game that is:

- voluntarily playable;
- visually/world-directionally coherent;
- story-driven;
- easy to start and progressively deeper;
- faithful to the learning concept;
- built from reusable components where real reuse is justified;
- testable/deployable/reviewable as an exact artifact.

## General system, not one reference game

The durable system remains reusable across courses through engine-neutral specs:

`LearningSpec -> StoryWorldSpec -> GameDesignSpec -> GameRulesSpec -> WorldSpec -> RuntimeExperienceSpec -> AssessmentEvidenceSpec`

Learning/evidence identity remains independent of protagonist name, setting, asset package or engine.

## Player embodiment is part of game design

Every game must explicitly choose who/what the player controls.

For the current LLM proof track, the player directly controls the robot protagonist. There is no separate helper/avatar. “Help the protagonist” describes the player's goal, not the existence of a second character.

Future games may choose other embodiments, but the choice must be explicit and coherent across story, camera, movement, HUD and tutorial.

## Earn attention before demanding cognition

A VibeLearn opening should behave like a good game: capture attention through story, beauty, character, mystery, atmosphere, movement and interaction before raising cognitive load.

Current preferred flow:

`normal/happy world -> disruption -> concrete personal loss/need -> player embodiment becomes clear -> prologue handoff -> separate tutorial -> clean practice success -> Level 1 mission -> recoverable failure -> variation -> transfer`

Level 1 should not double as basic onboarding when the game needs reusable controls/tutorial grammar.

## Story through the world

Do not tell a strong story in a document and then render a weak diorama with captions.

Text, animation, camera, lighting, sound, character acting and world-state changes must communicate the same causal sequence. A cold-start player should understand the story from the experience itself.

## World continuity and space

The game world is cognitive support. Preserve meaningful locations/objects/characters as complexity grows.

The September 17 review adds a hard spatial rule: **worlds need breathing room**. If the same content would feel better simply spread over a larger area, enlarge the footprint instead of adding more props.

World generation should parameterize footprint, density, negative space, landmark spacing and camera margins.

## Easy to play, hard to master

Start with obvious controls and success. Add depth through:

- richer reasoning;
- uncertainty;
- relevant competing information;
- trade-offs;
- combination of learned ideas;
- reduced scaffolding;
- transfer to unfamiliar contexts.

Do not increase difficulty through denser UI, longer instructions, unexplained controls or camera/navigation friction unless those are the learning target.

## Art/world direction is part of course quality

A game nobody wants to inhabit cannot deliver the intended learning experience well.

Run `ART-WORLD-DIRECTION-CRITIC.md` independently from story/gameplay/learning critics. Spatial scale, silhouettes, clipping, hierarchy, atmosphere and reusable-asset composition are product requirements.

## Attraction and sustained play are different

Internal review asks both:

1. Would a kid/young player stop and look?
2. Would they understand what to do and want to continue playing?

The current rejected build achieved some of the first and not enough of the second.

## Course-to-game coverage

Each versioned game package maps:

`outcome -> prerequisite -> mechanic -> player decision -> causal feedback -> varied practice -> transfer -> delayed retrieval -> evidence limits`

For every outcome, specify which game action requires the learner to predict, explain, diagnose, construct, compare or decide.

## Reusable game-creation assets

Accepted chunks should contribute reusable components where justified:

- environment/world kits;
- configurable layouts/scale/density;
- character/control profiles;
- cinematic beats;
- doors/gates/routes/rooms;
- interaction/scanning/repair/build mechanics;
- tutorial/scaffolding patterns;
- HUD/audio/accessibility patterns;
- critic/test/CI templates.

Reuse should enable materially different games, not reskins.

## Learning/evidence integrity

XP/practice progress is not mastery. Assistance, prior exposure and independent performance remain distinct. Missing evidence remains unknown. Game completion/animation/world state do not establish learning by themselves.

## Future agents

The platform should eventually support coordinated agents for research, ideation, creation, art/world direction, implementation, critic roles, tests and CI/CD. Agents operate on versioned specs/artifacts and cannot self-certify.

That is future platform work. First prove the game-creation model manually/tool-assisted on this track.

## Acceptance

Technical CI, internal critics and generated artifacts are necessary evidence, not final product acceptance. The current user is the sole final human product critic during this private refinement phase.
