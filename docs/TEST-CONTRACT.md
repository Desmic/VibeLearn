# The test contract: what every VibeLearn game exposes (4 Oct 2026)

VibeLearn's tools (play-through in both input modes, speedrun, break tester, timing, frame-rate
test, AI play-tester) are **game-agnostic**. They work on any game that keeps this contract.
When an agent builds a new game, the contract is part of "done". Then every tool works on day
one, and quality checks don't have to be re-invented per game.

Bellweather keeps it today. Where the names below say `__arcade` / `__vlStory`, a new game uses
the same names.

## 1. Hooks in the page (test-only, no effect on play)

| Hook | What tools use it for |
| --- | --- |
| `__arcade.snapshot()` → `{ position, elapsed, paused, draws, triangles, … }` | where the player is; the **game clock** (`elapsed`, seconds) that pacing is measured in |
| `__arcade.simulate(seconds, { keys?, walkTo? })` | fast-forward the game's own update without drawing (software rendering is too slow for real time) |
| `__arcade.walkable(x, z)` | can the player stand here? Path planning (speedrun), "never off the map" (breaker), test spots (warns when a test teleports somewhere unwalkable) |
| `__arcade.pose(x, z, yaw, …)` | teleport, for checks that don't test movement (never in the speedrun) |
| `__vlGuide.beaconAt`, `.goalText`, `.cardOpen`, `.actNow()`, `.overlay.debug()` | the goal marker the speedrun follows; whether a dialogue is open; where every in-world label sits |
| `__vlStory.debug.beat` (+ game-specific fields) | which story beat is running |
| `__vlBench` after `bench=1` | frame-rate results, including the resolution sweep |
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

## 3. Data the game declares (tools read it from the build)

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

Each game writes its **route**: the correct answers to its puzzles, and which action to take
where. Today that is the `ROUTE` block in `tools/speedrun.mjs` and the segments of
`tools/flowcheck.mjs`. Everything else (walking, skipping, answering cards, timing, coverage,
tamper and break probes) is shared.

- **Done (4 Oct): the answer key comes from the rules.** `tools/rulecheck.mjs` solves every
  puzzle from its rules data and prints the fewest-moves perfect run (semantic actions, e.g.
  `take-satchel → take.mira → speak → predict.lotus → support.route → run`).
- **Still per game:** which button or prompt each semantic action is (the speedrun's UI
  steps).
- **Next step for the system:** stations declare that mapping as data (action → control).
  Then the speedrun route is generated, and a new game comes with its speedrun and
  play-through for free.

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
