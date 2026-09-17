# Level 1 quality gate — reopened after user review

**Updated:** 17 September 2026 IST  
**Branch:** `game/level1-quality-gate`  
**Review build:** runtime `6fea8287aa5f078a5836902478320699e54571a9`

Status: **needs redesign / user review rejected the current product experience.**

The previous internal gate passed technical checks and an internal 9/10 critic record. Direct user review exposed structural failures that those gates missed. The internal pass remains historical evidence; it is not the active readiness state.

## Active user blockers

See `USER-REVIEW-20260917.md` for the detailed log. Current blockers include:

- duplicate/ambiguous protagonist-like characters;
- visible character/prop clipping;
- rendered opening does not convey the written story/stakes;
- Level 1 incorrectly doubles as onboarding;
- text/animation/camera/world changes are not synchronized narrative beats;
- progression does not match `orientation -> tutorial -> success -> Level 1 -> challenge -> payoff`;
- current build can attract visual attention but not enough sustained play;
- play area is too congested and needs a larger footprint/negative space;
- wrong player embodiment for this track: direct protagonist control is required;
- no independent art/world-direction critic existed.

## Replacement design boundary

Before another Level 1 candidate, redesign the front of the game as:

`happy Bellweather with protagonist + friends -> dramatic rupture/thunder/teleport -> protagonist displaced into dark limbo -> lights reveal unknown prison/large blocked exit -> evil robot removes protagonist's speech engine -> transition to direct protagonist control -> separate Tutorial/Prologue -> clean tutorial success -> Level 1 mission`

The exact fiction can improve during ideation, but the causal progression and separate onboarding boundary are now required unless explicitly changed by the user.

## World/art direction gate

The next candidate must pass `ART-WORLD-DIRECTION-CRITIC.md` in addition to the existing story/game/learning checks.

Required world fixes:

- increase playable footprint;
- introduce deliberate negative space;
- reduce visual crowding without simply deleting useful content;
- fix all ordinary actor/prop intersections;
- verify default and alternate camera views;
- make protagonist/cast silhouettes unambiguous;
- preserve readable landmarks and paths;
- review phone and desktop compositions.

## Player embodiment

For this proof track, the player directly controls the robot protagonist. There is no separate literal helper/avatar.

This must be consistent in StoryWorldSpec, GameDesignSpec, WorldSpec, controls, camera, dialogue and tutorial.

## Tutorial/Level 1 boundary

The Tutorial/Prologue teaches:

- movement/look/recenter as appropriate;
- interact/menu/replay/reset semantics where needed;
- the minimum core speech-repair/learning loop;
- a clean early success.

Level 1 begins **after** these basics are learned and should feel like the first actual mission.

## Technical evidence retained

The rejected candidate still established useful engineering regressions: build/application tests, hosted auth/session, save/resume, reset/logout, controls, readability, reduced motion, no active 2D fallback and whole-chapter state mechanics.

Do not throw those protections away. They remain regression coverage while the story/world/progression is redesigned.

## Corrected internal readiness gate

Another internal `ready_for_user_review` recommendation requires:

1. technical/runtime/accessibility gates pass;
2. rendered story critic has no blocker;
3. **art/world-direction critic has no blocker**;
4. first-touch/gameplay critic distinguishes `would look` from `would play/continue` and passes both;
5. whole-chapter/progression critic passes;
6. learning/transfer critic passes;
7. declared player embodiment matches actual game;
8. prologue/tutorial/Level-1 boundaries match `GAME-OPENING-PROGRESSION.md`;
9. no user-review finding remains unresolved.

A passing legacy JSON critic checker alone is insufficient.

## Platform/reuse implication

This redesign is also a platform proof. Extract reusable world/layout parameters, protagonist-control profiles, cinematic beats, door/room kits, repair mechanics, tutorial patterns and critic/test templates from the implemented needs.

Read `GAME-CREATION-PLATFORM.md` and `COURSE-GENERATION-GAME-SYSTEM.md`.

Future ideation/creation/critic/CI-CD agents are planned, but current priority is the game/learning proof track itself.

## Scope boundary

Do not start Level 2. Do not deploy a new review candidate until the redesigned prologue/tutorial/Level 1 front is implemented, technically verified and internally re-reviewed under the corrected gates.
