# Experience quality system — evidence before scores

**Active direction — 18 September 2026.** This document defines the reusable
quality system for generated VibeLearn games. It exists because multiple internal
critic passes produced false-positive 9/10 recommendations when the running game
still had obvious storytelling, animation, physicality and onboarding failures.

Read with `CRITIC-POLICY.md`, `ART-WORLD-DIRECTION-CRITIC.md`,
`STORY-GENERATION-AND-CRITIC.md`, `GAME-UX-SYSTEM.md`,
`GAME-RUNTIME-ARCHITECTURE.md` and `GAME-CREATION-PLATFORM.md`.

## Problem

A text/prompt critic that already knows the intended design can unconsciously
complete missing meaning for the game:

`design intent + partial rendered evidence -> generous interpretation`

That is not the player experience.

The quality system must instead make critics prove:

`what an uninformed player can actually perceive -> what they infer -> what they
can do -> what changes -> whether that matches intended design`

Numeric scores are downstream summaries, never substitutes for evidence.

## Separate review passes

Do not collapse these into one general "creative critic."

### 1. Cold-observer comprehension

Input:
- running experience or motion capture;
- no design treatment/storyboard initially;
- explanatory captions hidden/ignored for the first pass when practical.

Output:
- what place/world appears to be;
- who the important characters are;
- what they are doing;
- relationships inferred;
- what event occurred;
- who/what appears to have caused it;
- what the player thinks they should do next;
- uncertainties/confusions stated explicitly.

If the cold observer cannot describe the intended world/action, later critics
cannot rescue the candidate by reading the design doc.

### 2. Cinematic causality / event-direction critic

Major events are reviewed as causal systems, not scene labels.

For every major event record:
- visible cause/source;
- anticipation/setup where appropriate;
- event action;
- character reactions;
- environmental reaction;
- camera/focus;
- VFX;
- lighting/atmosphere shift;
- SFX/music/narration contribution;
- persistent world-after consequence.

Not every event needs every channel, but high-impact events must use enough
coordinated channels to feel intentional. A catastrophic rupture rendered as
"characters move upward and disappear" is a failure even if a caption names
thunder.

If the antagonist caused an event, causal attribution must be visually/audibly
legible unless ambiguity is an intentional plot device.

### 3. Motion / character-performance critic

Review real-time loops and transitions, not still screenshots:
- idle/rest;
- locomotion;
- interaction;
- reaction;
- cinematic acting.

Record motion adjectives and unintended audience read. Stock/default animation
is considered a creative choice and can fail.

### 4. Physicality / spatial integrity critic

Probe the world as a player would:
- walk into major props/walls/doors;
- orbit camera near geometry;
- try navigation edges;
- approach interactables from unexpected angles;
- test opened/closed traversal states.

Visible solid objects must be physically solid when the fiction/gameplay says
they are. Collision should be owned by world archetypes/specs rather than
remembered separately by each game.

### 5. Transition / handoff critic

Every mode transition—opening -> tutorial, tutorial -> mission, mission -> payoff,
location -> location—must answer immediately:

1. Who am I / what do I control now?
2. What just changed?
3. What is my immediate goal?
4. What can I do?
5. What is the one best next action?
6. What visible response proves I succeeded?

A handoff can be visually beautiful and still fail if the player has to infer the
interaction grammar.

### 6. Tutorial critic

A tutorial step is not valid merely because text exists.

Each step must define:
- skill/verb being taught;
- visible world target or control;
- player action;
- success detector;
- immediate visible/audio feedback;
- what changes after success;
- whether the step is skippable;
- whether skipping affects learning evidence.

Tutorial review observes a fresh player path, not an expert speed-run.

### 7. Design-intent comparison

Only after the cold/evidence passes does a critic read the design/story specs and
compare intended versus observed meaning.

This ordering prevents prior knowledge from filling gaps.

## Evidence hierarchy

Claims should use the strongest available evidence:

1. direct interactive play / computer-use trace;
2. recorded motion/video or timed frame sequence;
3. audio listening/capture;
4. alternate-camera and device screenshots;
5. structured runtime state/logs;
6. source/spec inspection.

Still screenshots alone cannot certify motion, atmosphere, event timing,
physicality or tutorial feel.

## Semantic readability of important objects

Major story/mechanic objects need a readable visual identity.

A generic primitive is acceptable only when its meaning is already established
through shape language, attachment, behavior, effects or interaction. A random
cube cannot stand in for "voice/speech engine" during a major emotional beat
unless the player has a strong reason to read it that way.

StoryWorldSpec/GameDesignSpec should identify high-importance semantic objects
and their readability strategy.

## System prevention beats critic detection

Whenever a recurring failure can be prevented by the platform, prefer a schema
or reusable runtime primitive over another prompt reminder.

Examples:
- world-owned colliders instead of per-game obstacle memory;
- tutorial-step schemas instead of arbitrary onboarding copy;
- major-event specs with cause/effect channels;
- semantic story-object roles;
- animation profile metadata;
- transition/handoff specs;
- automated traversal/collision probes.

Critics remain necessary because schemas cannot determine taste or comprehension.

## Critic output contract

Every serious critic result records:
- exact candidate/version;
- prior knowledge disclosed;
- evidence inspected;
- observations before interpretation;
- blockers;
- uncertainties;
- counterexample/adversarial attempts;
- category judgment;
- what evidence would falsify the judgment.

A score >=9 requires no unresolved blocker and at least one serious
counterexample attempt for that category.

## Anti-overfitting rule

Do not turn every user finding into a Bellweather-specific validator.

Extract the general failure:
- unclear rupture -> major-event causality/effect-stack contract;
- generic speech cube -> semantic-object readability;
- walking through station -> world-owned physicality;
- confusing tutorial handoff -> transition/handoff contract;
- creepy idle -> animation-direction profile.

Then prove the generalized mechanism in the current game and later in a
materially different game/world.

## Current implementation direction

The current proof track should now establish, in order:

1. reusable world-owned collision;
2. reusable major-event/cinematic direction contract;
3. reusable semantic story-object contract;
4. reusable opening->tutorial handoff contract;
5. reusable tutorial-step contract;
6. evidence tooling that captures motion/physicality, not only screenshots;
7. separate cold-observer and design-intent critic passes.

Do not begin Level 2 until Phase 1 proves these system capabilities.
