# Critic handoff

**Active from 17 September 2026.** Read `CRITIC-POLICY.md`, `ART-WORLD-DIRECTION-CRITIC.md`, `STATE.md`, `USER-REVIEW-20260917.md`, `GAME-OPENING-PROGRESSION.md` and `GAME-CREATION-PLATFORM.md` first.

## Instructions to the reviewer

Review one exact candidate. Declare prior design/source knowledge honestly; do not call yourself a fresh novice if you already know the intended solution/story.

### 1. Cold story read

Play the prologue without a walkthrough. Before reading source/design explanations, write what the scene actually communicated:

- what the normal world is;
- who the player controls;
- what changed;
- what the antagonist did;
- what the immediate obstacle/need is;
- what to do next.

Compare the rendered beats with the written storyboard. Text, animation, camera, light, sound and character reaction should describe the same causal event.

### 2. Art/world-direction pass

Independently inspect:

- world footprint and breathing room;
- negative space;
- prop/actor density;
- protagonist silhouette/identity;
- duplicate actors;
- clipping/intersections;
- landmarks/path readability;
- default and alternate camera angles;
- art/material/lighting cohesion;
- atmosphere/state transitions;
- phone/desktop composition.

Walk/orbit/zoom beyond hero screenshots. If spreading the same content across a larger footprint would materially improve play, record spatial congestion as a blocker.

### 3. Tutorial/progression pass

Verify the structure is actually:

`prologue -> separate tutorial -> clean success -> Level 1 mission -> recoverable challenge -> payoff`

For the current track, the player directly controls the robot protagonist. A separate literal helper/avatar is a design mismatch.

### 4. Gameplay/learning pass

Inspect whole available experience: first action, mistake, recovery, later challenge, payoff, transfer, replay, save/resume, reset/logout and controls after save.

Record two separate judgments:

- would a younger player stop and look?
- would they understand what to do and want to continue?

Do not infer learning from completion. Inspect concept fidelity, assistance and changed-context transfer separately.

### 5. Evidence discipline

Use desktop and 360/390/430 portrait where applicable. Record touch/keyboard, enlarged text, reduced motion and actual audio listening when claiming sound quality. Note reloads/workarounds. Mark unobserved states rather than filling them from source.

Write concrete failures and likely quit points before scores. A 9+ requires a strong counterexample attempt. No average can compensate for unclear story, cramped world, clipping, wrong embodiment, broken controls or shallow transfer.

The legacy JSON checker validates record structure/evidence only. It does **not** encode the independent art/world gate yet; a checker pass is insufficient if this handoff finds an art/world or progression blocker.

There is one final human critic: the current user. Agents/tools are internal reviewers only. Do not infer user acceptance or advance Level 2 because an internal review passes.
