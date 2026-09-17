# Current state — LLM learning-game proof track

## Active checkpoint — 17 September 2026 IST

Status: **user review / needs redesign before another Level 1 candidate.**

Canonical development branch: **`main`**.

Branch policy: routine development, research, review and fixes continue on `main`. `deploy/render-supabase` is the pinned live-deployment branch and may intentionally lag. Existing `game/*` / `phase1/*` branches are historical snapshots unless explicitly revived. `game/level1-quality-gate` is retained only as a compatibility/reference alias and should not become a separate line of development again.

Recorded review deployment: Render commit `6de1f0ccb234507c1db2dccbe007c7cabfaf397e` (runtime game candidate `6fea8287aa5f078a5836902478320699e54571a9`). The documentation clarification below does not change or re-verify that deployment.

The previous internal gate returned `ready_for_user_review`, but the user's live review exposed structural product failures. The user's judgment supersedes that recommendation. See `USER-REVIEW-20260917.md`.

## Latest product clarification — learner-facing, on demand

The user explicitly selected a **learner-facing product that creates a personalized game on demand**, not a creator-operated studio as the initial customer experience. Internal creation/review tools support that product. The primary journey is request -> personalized brief/design -> assembly and verification -> play -> resume/adapt.

The user also requires **future conversational issue reporting and agent repair**: learners flag problems in chat; an agent checks the actual experience, exercises judgment, verifies an appropriate candidate change, and applies it safely when justified. Agents now have computer use available in the development environment, so future implementation should deliberately support inspecting and reproducing issues in the actual running experience rather than relying only on source or textual reports.

`LEARNER-ON-DEMAND-AND-REPAIR.md` owns the detailed learner/repair contract; `GAME-CREATION-PLATFORM.md` and `COURSE-GENERATION-GAME-SYSTEM.md` link it to production. Personalization and repair-agent behavior are designed future capabilities, not implemented features. Exact generation latency, first-playable size and repair autonomy thresholds remain open.

This clarification does not close the current game-quality blockers or authorize Level 2.

## Current user-review blockers

1. Duplicate/ambiguous protagonist-looking robots and visible table/character clipping.
2. Opening does not communicate the written story/stakes through the rendered scene.
3. Tutorial is incorrectly embedded inside Level 1 instead of existing as a separate prologue/tutorial stage.
4. Text, animation, camera and world changes are not yet one coherent storytelling system.
5. Current progression does not follow `orientation -> tutorial -> clean success -> Level 1 -> challenge -> payoff`.
6. Visual attraction exists (`would look`) but sustained playability/clarity does not (`would not play`).
7. The current play space is too congested; a larger footprint with the same content would improve the experience.
8. Player embodiment is wrong for this track: there should not be a literal helper/`you` avatar. The player directly controls the robot protagonist.
9. The current critic process needs the dedicated art/world-direction gate enforced alongside its other checks.

These are not polish items. Do not patch around them while preserving the current opening structure.

## Working replacement direction

Current story/progression direction for the next design pass:

`happy Bellweather -> dramatic disruption/thunder/teleport -> protagonist displaced to dark limbo -> lights reveal unknown prison/large blocked door -> evil robot removes protagonist's speech engine -> player takes direct control -> separate Tutorial/Prologue teaches movement/interact/core speech-repair loop and grants a clean success -> Level 1 begins`

The protagonist name `Zip` is provisional. Run a stronger character/naming ideation pass informed by pop culture, games, film, animation, literature and mythology, while keeping shipped characters/assets/story original and understandable without references.

## Spatial/art direction

The next world must be **larger and calmer**, not denser. Preserve useful buildings/props but introduce deliberate negative space, clearer landmark spacing and more room for movement/camera orbit.

World generation and review require configurable footprint/density/spacing parameters and an independent art/world-direction critic. See `ART-WORLD-DIRECTION-CRITIC.md`.

## Platform direction and proof boundary

VibeLearn creates personalized learning games on demand for learners. The current How-LLMs-Work track is the proof case for quality and reusable foundations, not the permanent product or sufficient proof of personalized generation.

Every accepted chunk should leave reusable components where justified:

- world/environment kits;
- layout/spacing parameters;
- character/control profiles;
- cinematic beats and state transitions;
- mechanics and tutorial/scaffolding patterns;
- reusable gates/doors/routes/interactions;
- HUD/accessibility/audio patterns;
- critic/test/CI evidence templates.

Reuse must not produce identical/reskinned games. Story, art direction, layout, scale and mechanics remain parameterizable; learner history remains independent of their replacement.

Longer term the platform supports agents for research/ideation, story/game/art creation, implementation, criticism, tests, CI/CD and learner-facing issue investigation/repair. Do not build the entire orchestration platform now. Keep the proof track bounded while establishing the contracts needed for a later thin end-to-end learner request -> personalized verified game flow.

## Review framework correction

The prior internal 9/10 gate missed obvious world/art/story problems. Before another internal-ready recommendation:

- story critic compares written story to rendered beat-by-beat causality;
- art/world critic inspects space, density, clipping, silhouettes, landmarks and alternate camera angles;
- gameplay critic separately asks `would look?` and `would play/continue?`;
- declared player embodiment matches the actual world;
- prologue/tutorial/Level-1 boundaries are explicit and tested;
- technical CI remains necessary but earns no product-quality credit.

`CRITIC-POLICY.md` and `ART-WORLD-DIRECTION-CRITIC.md` govern the next candidate. The same evidence discipline must apply to future reported-issue repairs.

## What remains technically useful from the previous candidate

The previous build's regression evidence remains useful infrastructure evidence: build/tests, auth/session, save/resume, reset/logout, controls, phone layouts, reduced motion and no active 2D fallback. It does **not** validate the current story/world design or the newly specified learner-facing platform capabilities.

## Deployment record

Recorded review URL: `https://vibelearn-4xws.onrender.com/`.

The reviewed build is not accepted. Auto-deploy was recorded as off. No Render or Supabase change is part of this branch-consolidation update; inspect those connectors before making a new operational claim or release.

## Next action

Continue architecture/design clarification and recording the user's review on `main`. Before resuming gameplay implementation, finalize **prologue + separate tutorial + Level 1 boundary**, then build and verify the new prologue as the first coherent chunk. Keep the on-demand learner journey as the product target. Do not start Level 2 or claim the repair agents exist.
