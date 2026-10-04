# Automated checks

Two headless checks run against a build of the game. They're a safety net. They don't
replace people playing for feel and fun.

| Check | What it does | Time |
| --- | --- | --- |
| `storycheck.mjs` | Checks story scripts, stations, rules specs and island entities in the build: ids, handlers, anchors, dialogue jumps, decisions the rules judge, content that must agree with the rules' answers; lines follow the house style. No browser. | ~1 s |
| `rulecheck.mjs` | Proves things about every puzzle from its rules data alone (GameRulesSpec): explores every reachable state with the game's own rules engine and checks it is **solvable**, can be won **without a wrong answer**, every decision its station declares has a **right and a wrong** answer, and there is **no softlock** (from every reachable state the goal can still be reached). Prints each puzzle's fewest-moves perfect run (the answer key). Self-tests on a trapped puzzle. In `npm run check`. | <1 s |
| `mixcheck.mjs` | Measures the real audio output (an analyser on the master bus): ambience 12–25 dB under the voices, music under them but heard, nothing clipping. Run after changing any sound level. | ~1 min |
| `assetcheck.mjs` | Reads every GLB the game ships and reports its phone cost (triangles, draw calls, materials, textures, size) against the budgets in `asset-budgets.json`. Over budget fails. No browser. | <1 s |
| `rules-parity.mjs` | Runs the same random action walks through the browser's rules engine and the server's (`app/game_rules.py`) and checks they agree. Needs Python. | ~10 s |
| `camwalk.mjs` | Walks the opening routes with the real follow camera and scores every half second (Zip on screen, view blocked, lens inside something, too close). | ~5 min |
| `replay.mjs` | Replays an AI play-test's actions in a fresh session and scores the camera after each step, so a reported moment can be reproduced. | a few minutes |
| `playserver.mjs` | The body of the AI play-tester: a game session an agent drives step by step, seeing only screenshots, text and buttons. Writes a play log and a report. See `AI-PLAYTEST.md`. | as long as the play |
| `flowcheck.mjs` | Plays the whole game the intended way: title → Mira → attack → spark → absorb words + hologram engine at the skiff → flight → gate → relay → Loom Isle (Stop 2) → save and Continue → fixed camera views. Checks checkpoints, first-try logging, stars, and that nothing errors. `--input touch` plays as a phone (taps on prompts, tap-anywhere to read on, the thumb stick); `--input keyboard` as a laptop (E, Space, number keys, WASD/Shift, 1024×640); default `mouse` clicks. Touch and keyboard add a `controls` segment (stick tilt/jog, Shift-walk, which controls show). | ~15 min |
| `playthrough.mjs` | Runs `flowcheck` as a phone, then as a laptop, then `timing`, one after another, and writes `index.html` linking each run's **contact sheet** (`sheet.html`: every screenshot, failures on top) and the timing log. The before-publishing check for big changes. | ~35 min |
| `breaker.mjs` | Plays like a mean tester and checks that the game's promises still hold (below). `--input touch` plays as a phone: rapid taps, thumb stick, the pause button. | ~15–20 min |
| `speedrun.mjs` | Walks the whole game the fastest correct way: a path planned over the game's own walkable ground (no teleports), every cutscene skipped, nothing read, every puzzle right first time. Times each checkpoint in game seconds (`pacing.json`). Fails if a goal can't be reached on foot, if a prompt never shows near its goal, if any learning station (from data) ends with no answers, or if a checkpoint is reached without the stations its progress spec requires. Notes, as warnings, places where the player must step around another prompt. | ~6 min |

```
node tools/storycheck.mjs [--root out]
node tools/assetcheck.mjs [--root public] [--json]
node tools/rules-parity.mjs [--app ../../app] [--walks 300]
node tools/playserver.mjs [--port 7788] [--out playtest]   # then GET /observe, POST /act
node tools/flowcheck.mjs [--input mouse|touch|keyboard] [--out flowcheck] [--only controls,title,meet,...] [--base URL] [--root out]
node tools/playthrough.mjs [--out playthrough] [--only touch,keyboard,timing]
node tools/breaker.mjs  [--input mouse|touch] [--out breaker] [--only oob,walls,mash,order,scum,pause,skip,resize,tamper,monkey] [--minutes 4] [--seed 1337]
node tools/speedrun.mjs [--input touch|keyboard] [--out speedrun] [--verbose]
```

Both write `report.md`, `report.json` and screenshots into `--out`, and exit with code 1
on a failure. They share `harness.mjs` (static server, headless browser sized for the input mode, helpers
that act the way the chosen player would — `press`, `card`, `act`, `stick` — report and contact
sheet).

## The promises the breaker checks

- **Zip stays in the world.** He's always on walkable ground and never falls through,
  whether he runs into every edge, taps far off the map or walks off the island.
- **Walls hold.** The hedge, the closed gate and the joins between them can't be passed.
- **Mashing doesn't double anything.** Rapid clicks on actions, cards and the satchel never
  give more than two notes, two cards or doubled decisions.
- **Order can't be broken.** Notes can't be taken before the satchel, the relay can't be
  used before the gate opens, and the skiff can't be woken before its beat.
- **First tries can't be faked.** A wrong answer followed by a reload and the right answer
  doesn't count as a first-try success (this protects the learning evidence).
- **Pause, restart and skip are safe.** Pausing inside the cutscene keeps the story going.
  "Restart" on the island keeps Zip on the island. Skipping the attack still saves the
  checkpoint.
- **A hand-edited save can't skip the learning.** A save claiming the end of Stop 2 with no
  answers resumes at "Wake the skiff". One past the relay, with the relay unanswered, resumes
  at the gate. A broken save offers a new run. A *forged* learning record is still believed:
  that is a warning, because only progress signed on a server can stop it
  (`kit/progress.ts`, `worlds/first-words-progress.ts`).
- **Rotation works.** Turning the phone mid-puzzle keeps the relay console fully on screen.
- **Random play doesn't break anything.** Minutes of random taps, keys, buttons and pauses
  (including reloads that random clicks cause) never leave Zip stuck or the screen in a bad
  state.

## How it runs fast

Software rendering in a headless browser is slow, so the checks use the game's test hooks
rather than real-time input for long movements. `__arcade.simulate(seconds, { keys | walkTo })`
runs the game's own update in fixed 50 ms steps without drawing. `__arcade.walkable(x, z)`
answers whether a spot is walkable. `__vlStory.debug*` reads story state and taps
puzzle pieces. Any game built on this harness should expose the same hooks.

## Found so far

- 1 Oct: "Restart" in the pause menu dropped Zip into the hidden town while he was on
  Blossom Isle. It now returns him to the island landing, and does nothing mid-flight.
- 3 Oct: the off-screen goal arrow was never added to the page (a comment swallowed the
  call). It shows now.

## Look-dev for cutscenes

`node tools/_cine.mjs` plays the cold open and the attack and saves a screenshot about every
second of game time (`/tmp/cine`). Use it after changing a shot list; judge timing and feel
on a phone. In headless runs the game draws about one frame a second, so a check that waits
for something drawn by the world overlay (a bubble, a prompt) must wait several seconds.

## Scene timing

`node tools/timing.mjs [--scene opening|attack]` plays a cutscene in game time and prints
every line with its speaker and real voiced length, flagging a speaker cut off by their own
next line. The attack film holds at its next beat until a voiced line is finished
(`CUT_GATES` in `story.ts`), so its length grows with the voices; check it after new clips.

## Voices

`node tools/voice.mjs` makes missing clips (Gemini 3.8 Flash TTS; townsfolk on Flash-Lite).
On the free tier each model allows about 10 clips a day; the script keeps what it made and
stops a model when its day is used up. Each sandbox command has a short time limit, so run it
per speaker (`--only Mira`) when working from Claude's sandbox. `--reencode` redoes the game
MP3s from the WAV masters (pauses longer than 0.42 s are shortened).

## Frame-rate benchmark and the device ratio

Open the game with `bench=1` (on the hosted copy: `#bench=1&title=0&story=0&quality=medium`,
or `quality=high`; add `adaptive=0` to hold the resolution fixed). It visits four fixed
views (hero vista, looking back, bell garden, courtyard), five seconds each, and prints a
table: fps as played (snapped to the screen's refresh steps), the 90th-percentile frame,
the resolution scale, draw calls and triangles; then a **resolution sweep**: every view
again at 0.6×, 0.8×, 1×, 1.25×, 1.5×, 2× held fixed (up to the screen's own density), so
one run gives the sharpness-vs-fps curve and builds/devices compare on equal pixels
(`kit/bench.ts`, ~1.5–2 min). In-game: *Graphics → Run frame-rate test*.

The forced-finish "cost" column was dropped from the table (still in the JSON): on
Windows/ANGLE `readPixels` waits on the whole pipeline and read 44 ms on a build running at
72 fps. Fps snaps to refresh steps (144 Hz laptop: 72 / 48 / 24), so read the sweep, not one
number.

Rules: measure **before** changing anything that can move frame rate, on the same device,
then after. The page must be visible: a hidden or covered browser throttles drawing.

Device ratio. The phone is the target, but most runs happen elsewhere. Keep a table of the
same build measured on each device; the ratio of frame costs predicts the phone from a
laptop run (and is re-checked on the phone before a release):

| Build | Device | Tier | Mean fps | Mean cost ms | Notes |
| --- | --- | --- | --- | --- | --- |
| v59 (baseline artifact) | laptop Chrome, Intel UHD, 958×814 @1, 144 Hz | medium | 66.2 | — | adaptive settled at 0.6–0.72×; looking-back 48.5 (3 Oct, run by Claude via Claude in Chrome) |
| v67 | same laptop | medium | 47.8 (47.6 on a repeat) | — | held at 1.0× by the new Medium floor; looking-back 24 |
| v68 sweep | same laptop | medium | 0.6×: 71.8 · 0.8×: 65.4 · 1.0×: 47.8 | — | worst view 70.4 / 47.8 / 24.2. Equal to v59 at equal pixels: the drop is the resolution floor alone |
| v59 | Galaxy F15 | high | ~45 (Desmic, 3 Oct, adaptive) | — | resolution fell to ~0.6x |
| v68 sweep | Galaxy F15, **inside the Claude app** (web view), 384×673 @2.81, 90 Hz | medium | as played 78.8 at 1.44–1.5× (looking-back 45) · sweep 0.6/0.8/1.0×: 90.1 · 1.25×: 78.9 · 1.5×: 67.3 · 2×: 56.3 | — | (Desmic, 4 Oct) every view holds the 90 Hz cap up to 1.0×; the heaviest view (looking-back) drops to 45 from 1.25×. The phone slept during the run (v69 asks for a wake lock) |

**What the two devices say (4 Oct).** Compare in megapixels, not ratios. The F15 holds its
refresh cap (90) in every view up to ~0.26 MP (1.0×). The heaviest view drops one refresh
step at ~0.4 MP. The laptop's heaviest view drops a step at ~0.5 MP (0.8×) and two steps at
0.78 MP (1.0×). So for this scene the F15, even inside the Claude app's web view, has about
the laptop's per-pixel throughput. **Rule of thumb: a laptop run at the same megapixels
predicts the F15 to within one refresh step.** A real browser on the phone will only be
faster.

**Decision (Desmic, 4 Oct): sharpness.** Medium resolution floor 0.8× (was 1.0×), ceiling
1.5×. On the F15, Medium sits at 1.44–1.5× and never needs the floor. On the laptop, the
heaviest view can drop to 0.8× (48 fps instead of 24).

Pixels, not ratios, compare across devices: the laptop at 1.0× draws 958×814 = 0.78 MP; the
F15 (393×851 CSS, DPR 2.625) draws 0.33 MP at 1.0× and 0.12 MP at 0.6×.
