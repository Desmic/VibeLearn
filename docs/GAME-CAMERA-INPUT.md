# Third-person control, full-screen mobile and game entry

User review amendment, 14 September 2026. The user reviewed `eab1614` and requested free camera movement, third-person play as the preferred default for most games, a consistent appealing login, removal of any 2D gameplay fallback, and hands-on computer/browser verification. They additionally required full-screen play on mobiles. This supersedes fixed-shot-only gameplay guidance; existing story, progressive onboarding and evidence contracts remain active.

## Player experience

The player is the Signal Keeper helping Pip. Pip remains the story character; the Keeper is the controllable third-person avatar. Movement and a freely orbiting follow camera make the world explorable. Desktop supports WASD/arrows, drag to look, wheel/visible zoom and recenter. Phones support a movement stick, drag to look and accessible camera controls. Teach these controls briefly at first mission entry without repeating the opening for returning players.

Story scenes retain deliberate authored framing, Back/Continue/Skip/Pause and replay. Players can look around the scene and restore its framing. Active gameplay defaults to third person, including later signals and transfer. Semantic objective actions remain accessible from the HUD; exploration must not become an obstacle to learning or a way to forge mission success.

Movement respects authored walkable surfaces and solid bounds. The camera has bounded pitch/distance and must avoid going below floors or inside declared solid geometry. Pointer drags never trigger a scene action; HUD interaction never moves the avatar/camera. Movement releases on pointer cancellation, lost focus, menu/replay, engine loss and disposal. Reduced motion disables decorative movement and camera easing without removing deliberate player control.

## Reusable foundation

WorldSpec owns a versioned player-control profile: semantic avatar ID, spawn, movement speed, walkable regions, obstacles, camera limits and animation aliases. Shared input, navigation/camera logic and HUD work with unrelated worlds; authored worlds provide data/assets rather than copied controllers. Third person is the current preferred default for exploration games, not a universal restriction on every future learning mechanic.

Camera and exploratory avatar position are presentation state in this reference. They do not submit answers, award XP, alter assistance, clear missions or establish assessment evidence. Preserve orientation/position through ordinary same-level HUD updates and isolated opening replay. New mission/world entry may reset to its declared spawn; recovery restores a safe presentation state. If future spatial movement becomes learning-critical, it needs an explicit authoritative rules/evidence contract.

## Full-screen mobile shell

The game occupies the complete available viewport on mobile, using dynamic viewport height and safe-area insets. The world is the background; objective, menu, movement and action controls sit inside it. Avoid document scrolling during active play; longer help/evidence/menu content scrolls inside bounded panels. Portrait and landscape both remain usable. Inputs remain accessible with enlarged text and the on-screen keyboard.

A user-initiated fullscreen control uses the browser Fullscreen API where available. Unsupported browsers retain the complete viewport experience and must not falsely claim their browser chrome is hidden. Do not force orientation or disable browser accessibility zoom.

## Login and failure

Login/recovery use the same 3D Echo Forge scene, colors, typography and HUD treatment as the game. The form is concise, responsive and legible, with visible focus and password/recovery controls. The stage loads only while entry is visible and is disposed on entry to gameplay. No separate CSS/SVG game illustration remains. Authentication remains usable during decorative scene failure with an explicit retry/status; gameplay remains blocked until 3D is ready. Primitive 3D assets are valid; a playable 2D substitute is not.

## Verification and next gate

Use hands-on browser/computer interaction to inspect login, opening, third-person movement, camera drag/zoom/recenter, menu/replay, mobile viewport controls, and later-level/transfer play. Capture actual rendered desktop and 390px evidence, plus 360/430 and landscape layout checks. Automated tests supplement this with navigation bounds, drag/click separation, input cleanup, recovery, unrelated-world reuse, hosted auth, progression and complete CI/browser journey. Report any unsupported browser capability honestly.

Deploy only the exact green, visually reviewed candidate using the existing manual Render process. The user owns the next product review; CI and internal critic scores do not establish acceptance. No broad unrelated architecture/art pass or Phase 2 scope is authorized by this amendment.
