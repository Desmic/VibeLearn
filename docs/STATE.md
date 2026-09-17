# Current state — LLM learning-game proof track

## Active checkpoint — 17 September 2026 IST

Status: **user review / needs redesign before another Level 1 candidate.**

Review build still live: Render commit `6de1f0ccb234507c1db2dccbe007c7cabfaf397e` (runtime game candidate `6fea8287aa5f078a5836902478320699e54571a9`).

The previous internal gate returned `ready_for_user_review`, but the user's live review exposed structural product failures. The user's judgment supersedes that recommendation. See `USER-REVIEW-20260917.md`.

## Current user-review blockers

1. Duplicate/ambiguous protagonist-looking robots and visible table/character clipping.
2. Opening does not communicate the written story/stakes through the rendered scene.
3. Tutorial is incorrectly embedded inside Level 1 instead of existing as a separate prologue/tutorial stage.
4. Text, animation, camera and world changes are not yet one coherent storytelling system.
5. Current progression does not follow `orientation -> tutorial -> clean success -> Level 1 -> challenge -> payoff`.
6. Visual attraction exists (`would look`) but sustained playability/clarity does not (`would not play`).
7. The current play space is too congested; a larger footprint with the same content would improve the experience.
8. Player embodiment is wrong for this track: there should not be a literal helper/`you` avatar. The player directly controls the robot protagonist.
9. The current critic process lacks a dedicated art/world-direction gate.

These are not polish items. Do not patch around them while preserving the current opening structure.

## Working replacement direction

Current story/progression direction for the next design pass:

`happy Bellweather -> dramatic disruption/thunder/teleport -> protagonist displaced to dark limbo -> lights reveal unknown prison/large blocked door -> evil robot removes protagonist's speech engine -> player takes direct control -> separate Tutorial/Prologue teaches movement/interact/core speech-repair loop and grants a clean success -> Level 1 begins`

The protagonist name `Zip` is now provisional. Run a stronger character/naming ideation pass informed by pop culture, games, film, animation, literature and mythology, while keeping shipped characters/assets/story original and understandable without references.

## Spatial/art direction

The next world must be **larger and calmer**, not denser. Preserve useful buildings/props but introduce deliberate negative space, clearer landmark spacing and more room for movement/camera orbit.

World generation and review now require configurable footprint/density/spacing parameters and an independent art/world-direction critic. See `ART-WORLD-DIRECTION-CRITIC.md`.

## Platform direction

VibeLearn is a **platform for rapidly creating learning games**, not one campaign. The current How-LLMs-Work track is the proof case.

Every accepted chunk should leave reusable components where justified:

- world/environment kits;
- layout/spacing parameters;
- character/control profiles;
- cinematic beats and state transitions;
- mechanics and tutorial/scaffolding patterns;
- reusable gates/doors/routes/interactions;
- HUD/accessibility/audio patterns;
- critic/test/CI evidence templates.

Reuse must not produce identical/reskinned games. Story, art direction, layout, scale and mechanics remain parameterizable.

Longer term the platform should support coordinated agents for research/ideation, story/game/art creation, implementation, critic roles, tests and CI/CD orchestration. **Do not build that multi-agent platform yet.** First prove the manual/tool-assisted creation model with one excellent game/learning track. See `GAME-CREATION-PLATFORM.md`.

## Review framework correction

The prior internal 9/10 gate missed obvious world/art/story problems. Before another internal-ready recommendation:

- story critic must compare written story to rendered beat-by-beat causality;
- art/world critic must inspect space, density, clipping, silhouettes, landmarks and alternate camera angles;
- gameplay critic must separately ask `would look?` and `would play/continue?`;
- declared player embodiment must match the actual world;
- prologue/tutorial/Level-1 boundaries must be explicit and tested;
- technical CI remains necessary but earns no product-quality credit.

`CRITIC-POLICY.md` and `ART-WORLD-DIRECTION-CRITIC.md` govern the next candidate.

## What remains technically useful from the previous candidate

The previous build's regression evidence remains useful infrastructure evidence: build/tests, auth/session, save/resume, reset/logout, controls, phone layouts, reduced motion and no active 2D fallback. It does **not** validate the current story/world design.

## Live deployment

The rejected review build remains available at:

`https://vibelearn-4xws.onrender.com/`

Do not treat it as accepted. Auto-deploy remains off.

## Next action

Finish capturing the user's review, then redesign **prologue + tutorial + Level 1 boundary** before changing gameplay implementation. Update specs/docs first, then build the new prologue as the first coherent chunk. Do not start Level 2.
