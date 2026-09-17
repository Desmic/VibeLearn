# LLM proof track — next build and verification boundary

**Active redesign — 17 September 2026.** The previous `The First Words` build plan is superseded by the user's live review in `USER-REVIEW-20260917.md`.

The deployed `6fea828...` runtime is **technical regression evidence, not the design to continue**. Do not incrementally polish its opening/tutorial structure or start Level 2.

Read first:

- `STATE.md`
- `USER-REVIEW-20260917.md`
- `LLM-RESCUE-STORY.md`
- `GAME-OPENING-PROGRESSION.md`
- `GAME-CREATION-PLATFORM.md`
- `ART-WORLD-DIRECTION-CRITIC.md`
- `CRITIC-POLICY.md`

## Binding player/story correction

The player directly controls the robot protagonist. There is **no separate literal helper/you avatar** in this track.

`Zip` is provisional. Run a fresh character/naming ideation pass before freezing the next story package. Pop-culture inspiration is encouraged as a technique source; shipped characters, names, assets, dialogue and music remain original and understandable without the reference.

## Working prologue direction

Design the next opening as a real causal sequence:

1. Bellweather is alive, happy and worth caring about; protagonist and friends are visible together.
2. A dramatic rupture/thunder/teleport event interrupts the normal world.
3. Protagonist/friends are displaced.
4. Protagonist appears alone in a dark limbo-like space.
5. Lights reveal an unknown prison/room and a large blocked exit door.
6. An evil robot visibly removes the protagonist's speech engine.
7. Camera transitions into direct protagonist control.
8. A **separate Tutorial/Prologue stage** teaches movement/look/interact/menu and the minimum speech-repair mechanic.
9. Tutorial grants a clean visible success—restore enough speech/capability to open the first way forward.
10. **Level 1 starts after onboarding.**

The exact fiction can improve, but the before/after contrast, visible antagonist-caused loss, direct player embodiment, separate tutorial and Level-1 boundary are required unless replaced by a clearly stronger reviewed design.

## Storyboard contract

Before coding the prologue, define every beat with:

- world state before;
- visible event/action;
- camera/focus;
- character reaction;
- minimal text/dialogue;
- lighting/effects/audio cue;
- optional player action;
- world state after;
- cold-start player takeaway.

Text, animation, camera, lighting and sound must convey the **same story beat**. Captions cannot be used to explain action the world failed to show.

## Spatial/world correction

The next world must be **larger and calmer**. The user's review says the same content would improve substantially simply by giving it more space.

Do not add decorative density. Instead:

- increase playable footprint;
- increase negative space around interactions;
- spread landmarks/props/actors;
- widen paths/rooms where needed;
- protect camera clearance;
- avoid duplicate protagonist-like actors;
- eliminate visible actor/prop/camera clipping from normal orbit/zoom views.

World layout should use reusable footprint/density/spacing parameters so future generated games can vary scale without rewriting mechanics.

## Separate tutorial contract

Tutorial is not Level 1.

Teach only reusable game grammar:

- move;
- look/orbit;
- interact;
- menu/reset/logout awareness where appropriate;
- one minimum speech-engine repair/generation interaction.

One obvious action at a time. Low/no failure pressure. Clean success before the first mission.

Level 1 may then introduce a normal recoverable learning mistake and deeper reasoning.

## Learning behavior to preserve

The useful conceptual target from the previous build remains:

`available context -> candidate next-piece scores -> choose one -> append it -> repeat -> world independently checks/uses the result`

The game must make clear that the language model only receives supplied context; it does not secretly see the whole 3D world.

The first real mission should require the player to use this idea in a meaningful changed situation. Tutorial completion remains assisted practice, not mastery evidence.

## Reuse/platform extraction

The proof track should leave reusable pieces only where the game proves them useful:

- direct-protagonist control profile;
- spacious room/world templates;
- cinematic happy-state / rupture / teleport / reveal beats;
- lighting/weather/emotional state transitions;
- door/gate/blocked-route archetypes;
- repair/scanner/context-selection mechanics;
- stepwise generation display;
- tutorial/scaffolding patterns;
- HUD/accessibility/audio patterns;
- story/art/game/learning critic evidence templates.

Do not build the future multi-agent generation platform now. Preserve versioned, agent-friendly specs/artifacts so ideation/creation/critic/CI-CD agents can be added later.

## Ordered implementation gate

After the current user review is consolidated:

1. freeze the revised story/protagonist/naming candidate;
2. art/world-direction pass for scale, layout, palette, landmarks and reusable kit;
3. storyboard and build the **prologue only**;
4. test/play/critique prologue under story + art/world gates;
5. build the separate tutorial;
6. test tutorial first success and lifecycle;
7. only then rebuild Level 1's first actual mission/challenge;
8. integrated technical/browser/accessibility regression;
9. independent story, art/world, gameplay and learning critics;
10. user review.

Do not build later episodes while an earlier boundary is unresolved.

## Technical regression requirements retained

Preserve the useful engineering work from the rejected candidate:

- Bellweather-consistent auth/entry;
- hosted reset/logout;
- save/resume and learner isolation;
- keyboard/touch/camera controls;
- reduced motion and enlarged text;
- desktop + 360/390/430 phone checks;
- explicit 3D loading/recovery;
- **no active 2D gameplay fallback**;
- authoritative commands/evidence and immutable submitted evidence.

Technical CI is necessary but earns no product-quality score.

## Review gates

A future candidate cannot be internally recommended merely because the old 11-criterion checker passes.

Required independent gates now include:

- rendered-story causality/comprehension;
- **art/world direction** (`ART-WORLD-DIRECTION-CRITIC.md`);
- gameplay/first-touch and whole-track progression;
- learning/transfer fidelity;
- technical/accessibility/device CI;
- current user's final verdict.

Explicitly ask both: **would a kid/young player stop and look?** and **would they understand what to do and want to keep playing?** The previous build achieved only the first.
