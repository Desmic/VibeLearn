# Player embodiment, camera/input and full-screen game entry

**Active direction — 17 September 2026.** Read `GAME-CREATION-PLATFORM.md`, `GAME-OPENING-PROGRESSION.md`, `ART-WORLD-DIRECTION-CRITIC.md` and `STATE.md`. This supersedes the old assumption that every exploration game has a separate helper/avatar.

## Player embodiment is a design decision

Every `StoryWorldSpec` / `GameDesignSpec` / `RuntimeExperienceSpec` must explicitly declare who or what the player controls. Second-person prose such as “help the robot” does **not** imply a literal helper character.

Supported design modes may include:

- **direct protagonist control** — the player controls the story protagonist;
- **separate avatar** — the player controls a distinct in-world character;
- **external guide/cursor** — the player acts through a non-character interaction role;
- **strategy/controller** — the player directs multiple actors/systems;
- other explicitly declared modes justified by the game.

The camera, controls, dialogue, tutorial, animations and save/presentation state must agree with the declared embodiment.

### Current LLM proof track

The current track uses **direct robot-protagonist control**. There is no separate literal `you`/helper avatar. The player controls the protagonist from the first controllable prologue/tutorial moment onward.

The protagonist name `Zip` is provisional pending the next character/naming ideation pass.

## Camera and movement contract

Third-person follow/orbit remains the preferred current default for direct-character exploration games, not a universal platform rule.

Desktop baseline:

- WASD/arrows or equivalent movement;
- drag to orbit/look;
- wheel/visible zoom;
- recenter;
- accessible semantic movement/camera controls.

Phone baseline:

- movement stick or equivalent direct movement;
- drag to orbit/look;
- reachable zoom/recenter;
- safe-area-aware interaction targets;
- full dynamic viewport use.

Movement respects authored walkable surfaces and solid bounds. Camera pitch/distance are bounded and must avoid floors, walls and declared solid geometry. Pointer/camera gestures cannot accidentally trigger world actions. HUD interaction cannot move the character/camera. Input state releases on pointer cancellation, lost focus, menu/replay, engine loss and disposal.

Reduced motion may remove decorative motion/easing but does not remove deliberate player control.

## Spacious-world requirement

The September 17 user review found the current world materially too congested. Camera/input quality therefore includes world scale and clearance, not just control correctness.

`WorldSpec` and world-layout tooling must expose:

- playable footprint/zone dimensions;
- path width;
- prop/actor density;
- negative-space budget around focal interactions;
- camera clearance/occlusion margins;
- landmark spacing;
- maximum simultaneous focal objects;
- spawn and interaction clearances.

A world that technically supports orbit/movement but feels cramped or clips actors/props fails the art/world gate. Making a world larger without adding content is a valid and often preferable quality improvement.

## Prologue -> tutorial -> Level 1 boundary

Story cinematics may use authored camera compositions while still belonging to one continuous 3D runtime.

For first entry:

1. prologue establishes world, disruption and stakes;
2. control transitions visibly to the declared protagonist;
3. a **separate Tutorial/Prologue stage** teaches movement/look/interact/menu and the minimum reusable learning mechanic;
4. tutorial provides a clean success;
5. Level 1 begins only after those basics are learned.

Do not label basic onboarding steps as Level 1 merely because they share a route/runtime.

Replay of the prologue is non-destructive and restores the prior gameplay state. Returning learners resume their current stage rather than being forced through the cinematic again.

## Full-screen mobile shell

The active game occupies the available viewport on mobile using dynamic viewport units and safe-area insets. The world is primary; objective, menu, movement and contextual action controls sit over it.

Avoid document scrolling during active play. Longer help/evidence/settings content scrolls inside bounded secondary panels. Portrait and landscape remain usable. Enlarged text and on-screen keyboard behavior must not make the world unusable.

A user-initiated Fullscreen API control may be offered where supported. Unsupported browsers retain full-viewport play and must not claim browser chrome is hidden. Do not force orientation or disable accessibility zoom.

## Login and failure

Login/recovery should use the same visual/world language as the active track without pretending decorative world rendering is authentication-critical.

Required engine/module/context failures show explicit recovery/retry UI and preserve progress. There is no silent 2D gameplay fallback.

## Verification

Hands-on review must cover:

- declared player embodiment matches what appears on screen;
- no duplicate accidental player/protagonist rigs;
- movement/look/zoom/recenter before and after saves;
- camera sweep at important story/play states;
- actor/prop/camera intersections;
- spaciousness and target readability;
- desktop plus 360/390/430 portrait;
- touch and keyboard;
- reduced motion and enlarged text;
- login, prologue, tutorial, Level 1, replay, reset and logout transitions.

Run `ART-WORLD-DIRECTION-CRITIC.md` independently from gameplay/learning critics. A camera/control test can pass while the space still fails as a place to play.

## Reusable foundation

Player embodiment and camera/input are reusable **profiles**, not campaign code. A generated game chooses a profile and supplies WorldSpec data/assets/layout. Shared controllers compile that data without hard-coding the current protagonist, Bellweather or this LLM track.

Future games may choose another embodiment/camera model when mechanics justify it. Canonical learning/evidence identity remains independent of embodiment and renderer.
