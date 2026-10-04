# The test contract: what every VibeLearn game exposes (4 Oct 2026)

VibeLearn's tools (play-through in both input modes, speedrun, break tester, timing, frame-rate
test, AI play-tester) are **game-agnostic**. They work on any game that keeps this contract.
When an agent builds a new game, the contract is part of "done". Then every tool works on day
one, and quality checks don't have to be re-invented per game.

Bellweather keeps it today. Where the names below say `__arcade` / `__vlStory`, a new game uses
the same names. Game names, storage keys and data come from the game's **manifest**
(`src/game.ts`, section 3); results go into the shared **report format**, which the quality
gate reads (section 7, and `docs/QUALITY-SYSTEM.md`).

## 1. Hooks in the page (test-only, no effect on play)

| Hook | What tools use it for |
| --- | --- |
| `__arcade.snapshot()` → `{ position, elapsed, paused, draws, triangles, … }` | where the player is; the **game clock** (`elapsed`, seconds) that pacing is measured in |
| `__arcade.simulate(seconds, { keys?, walkTo? })` | fast-forward the game's own update without drawing (software rendering is too slow for real time) |
| `__arcade.walkable(x, z)` | can the player stand here? Path planning (speedrun), "never off the map" (breaker), test spots (warns when a test teleports somewhere unwalkable) |
| `__arcade.pose(x, z, yaw, …)` | teleport, for checks that don't test movement (never in the speedrun) |
| `__vlGuide.beaconAt`, `.goalText`, `.cardOpen`, `.actNow()`, `.overlay.debug()` | the goal marker the speedrun follows; whether a dialogue is open; where every in-world label sits |
| `__vlStory.debug.beat` (+ game-specific fields) | which story beat is running |
| `__vlStations[id]` (kit/station.ts) → `{ spec, state, history, allowed(a) }` | each learning station's live rules state and the moves it has applied: the speedrun plays stations from this |
| `__vlBench` after `bench=1` | frame-rate results, including the resolution sweep |
| `__vlVoice` (kit/voice.ts), `__vlScape` (kit/soundscape.ts: `mood`, `music`, `testPhrase()`), `__vlAudio()` → `{ ctx, master }` | voiced-line lengths (timing); the mix check measures the master bus |
| `__vlUtterLab` (`sites`), `__vlUtterLog` (every phrase spoken and what the kit made of it) | the utterance test area (`lab=utter`, kit/utter.ts) |
| `__vlBuild` (also shown in the pause menu) | which build this is: reports and a person's verdict name it |
| `__vlDebug.camSqueeze()` | what pushes the follow camera in |

## 2. What the page shows (selectors tools press or read)

| Element | Meaning |
| --- | --- |
| `.context-act` with `data-label` | the one in-world action on offer, beside its target (E / tap) |
| `.story-card` buttons; `.advance` = "read on" | dialogue choices; a line to read |
| `.story-skip` | skip the cutscene |
| `.star-row`, `.story-card.ribbon` | stars for a finished station |
| `.title-menu .primary` | Start / Continue |
| `#pause`, `#resume`, `#restart` | pause menu |
| `.stick-zone` / `.stick-base` | the floating thumb stick (phones) |
| `html[data-input=touch|desktop]` | which kind of player the game thinks it has |
| **`[data-action="<rules action>"]`** on every control that sends a rules action | dialogue choices (`Choice.action`), in-world prompts (`setAction(…, action)`), puzzle chips and buttons. A bot plays any station from its rules by pressing these; nothing else about the puzzle needs to be known |
| `.puzzle-mode` / `.engine-mode` on the game host while a puzzle UI is open | wait for the puzzle's controls instead of walking away |

## 3. Data the game declares (tools read it from the build)

- **The manifest** (`src/game.ts` exports `GAME`, type `kit/manifest.ts`; tools load
  `out/src/game.js`): id, title, what it teaches, audience, protagonist, the test entry query,
  storage keys, the live stations and their rules, the progress spec, the story scripts,
  sound, voice cast, learning-design files, input modes, target devices, its own test module,
  and the **nouns** of its world (system code must not use them: `tools/kitcheck.mjs`).
  `validateManifest` checks the parts agree (every station's rules listed, every checkpoint's
  stations listed…); `storycheck` runs it.

- **Learning stations**: `{ kind: 'station', id, name, decisions: [{ id, asks }] }`. Every
  answer is logged as `{ activity: stationId, decision, choice, correct, first }`.
  - The speedrun fails if any station ends a full run with no answers: the learning could be
    skipped.
  - The breaker checks that a first try can't be faked.
- **Progress spec** (`kit/progress.ts`): `{ order: [checkpoints], requires: { checkpoint:
  [stationIds] } }`.
  - The game uses it on resume: a save claiming more than the learning record shows resumes
    where the record allows.
  - The speedrun and the breaker's `tamper` probe check it from both sides.
  - `storycheck` validates it.
- **Story scripts**: beats with checkpoints, goals, places, dialogues and thoughts.
  `storycheck` validates them; timing reads their lines.
- **Voice cast and manifest**: clips per line. Timing uses the real clip lengths.

## 4. The one game-specific piece: the route

Each game writes its own test module (`manifest.tests`, e.g. `tools/games/first-words.mjs`):
`helpers(h)` returning `toPlay()` (fresh start to free play), its scene helpers, and
`speedrunRoute()` (the story between stations). The harness adds them to `h`. Everything
else (walking, skipping, answering cards, playing stations, timing, coverage, tamper and break
probes) is shared. `tools/flowcheck.mjs` (the scripted journey) is still written for this
game; `tools/checks.json` marks every tool's scope.

- **Done (4 Oct): the answer key comes from the rules.** `tools/rulecheck.mjs` solves every
  puzzle from its rules data and prints the fewest-moves perfect run (semantic actions, e.g.
  `take-satchel → take.mira → speak → predict.lotus → support.route → run`).
- **Done (4 Oct): stations play from their rules.** Every control that sends a rules action
  is tagged `data-action`. The speedrun's `playStation(id)` re-plans from the live rules
  state at every step: it takes any move on a shortest no-mistake path, so moves that can come
  in any order are taken in whatever order the world offers them. It finds the move's control
  on screen, or its prompt in the world (walking, and exploring when there is no marker), or
  opens the station. It knows nothing about the puzzle beyond its rules.
- **Still written by hand:** only the story between stations (talk to Mira, catch the spark,
  board). Next: story beats declare their goal action as data, so that part generates too.

## 5. What the tools prove, per game, before anyone plays it

| Question | Tool | Fails when |
| --- | --- | --- |
| Can it be finished, start to end, by tapping (phone) and by keyboard (laptop)? | `playthrough.mjs` (flowcheck twice) | any beat can't be reached in either mode |
| Is every puzzle solvable, winnable without a wrong answer, and free of softlocks? Does every decision have right and wrong answers? | `rulecheck.mjs` (rules data only, <1 s) | any of those fails |
| Can every goal be reached on foot? Does every action show up where the goal points? | `speedrun.mjs` | a goal marker is unreachable; a prompt is never offered nearby |
| Can a fast player skip the learning? | `speedrun.mjs` (from station data) | a station has no answers at the end |
| Is each checkpoint earned? | `speedrun.mjs` + the breaker's `tamper` probe | a checkpoint without its stations; a hand-edited save resumes too far |
| How fast can it be done (pacing floor)? | `speedrun.mjs` → `pacing.json` | (tracked: a stop that gets much shorter may have lost its learning) |
| Can it be broken (edges, walls, mashing, order, reload-scumming, pause, skip, rotate, random play)? | `breaker.mjs --input touch` and default | any promise breaks |
| Do lines overlap or leave dead air? | `timing.mjs` | overlap |
| Does it hold frame rate on the target phone? | `bench=1` / *Run frame-rate test* (sweep) | below the tier target at the chosen resolution |

## 6. Known limits (say them, don't hide them)

- **Progress isn't tamper-proof.** The learning record lives in the same browser as the save,
  so a forged record is believed. The breaker reports it as a warning. Fixing it needs progress
  signed on a server.
- **Not tested yet:** jumping, climbing and gliding don't exist yet, so neither do clipping
  exploits. Add probes when traversal arrives.
- **Feel isn't tested:** smoothness, camera comfort and control feel still need a person on a
  real device (`docs/PLAYTEST-METHODS.md`).

## 7. Reports and the gate

Every check, AI play-test and person's verdict writes a `vibelearn.report.v1`
(`tools/lib/report.mjs`): results with a lane, a status (pass / fail / warn / unresolved), the
claim, detail, evidence and how to reproduce, bound to the build (`out/build.json`). Copies go
to `quality/<build>/`; `node tools/quality.mjs` gives one verdict per lane, never averaged.
`node tools/affected.mjs` says which checks a change calls for. See `docs/QUALITY-SYSTEM.md`.
