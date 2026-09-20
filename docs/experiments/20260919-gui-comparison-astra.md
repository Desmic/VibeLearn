# Astra GUI trial — 19 September 2026

Status: completed the full currently available journey through GUI interaction,
including opening, control practice, tutorial, Level 1, wrong-route recovery,
ending and reload/resume. This is an informed exploratory run, not a blind test
or a general capability benchmark. Root Astra had prior project/game knowledge.

## Conditions

- Model: GPT-6 Astra (root agent); native `mcp__cua_repl` browser controls.
- Public entry: `http://localhost:8042/`, redirected to `/first-words`.
- Fresh isolated disposable SQLite save; Luna uses a separate database and
  `127.0.0.1:8041`, preventing host-cookie sharing across the two main trials.
- Frozen dirty working tree based on `e13c5bed8c01eb53f9fead441661686af3eba3ca`.
  Source digest: `9038601ede2b6433ae207b8180cd392df86f2eb78f28ccfc1e9bccfba09962ec`.
  Per-file manifest: ignored `artifacts/gui-comparison-20260919-run1/experiment.json`.
- Viewport 1280 × 800 after initial entry observation; initial observation was
  narrower because the browser override had reset. This is a protocol deviation.
- Limit: 120 input actions / 45 minutes. Actual: **44 input actions**, excluding
  observation calls, browser provisioning and viewport setup.
- Entry start 17:07:48.941 UTC; final restored-state observation recorded by
  17:15:26.818 UTC: **7 minutes 38 seconds wall time**, including interruptions
  to troubleshoot Luna's browser connection. Not a model-speed measurement.
- Used visible accessibility text, screenshots, clicks, keyboard and mouse drag.
  No game source, hidden state, evaluate, direct application API or scripted test
  drove gameplay. Audio and continuous motion were not assessed.

## Observed outcome

All eight opening scenes were viewed without skipping. The visible sequence
established friends/lantern, attack, separation, prison, stolen speech module and
repair objective. Transition buttons disabled during several story beats;
fresh observation showed when they became available. Screenshots showed the
module leave Zip's chest and appear beside the Warden. They do not establish
the quality of every animation frame or sound cue.

The first W input produced no visible change. Opening movement help, focusing
the world and pressing Up advanced to camera practice. Dragging visibly rotated
the camera, then opening/closing the game menu advanced to engine repair.
Power lead → Moon scan → four generated words → speak opened the tutorial gate.
The interface showed each generated word appended to the following input.

For deliberate alternative-path coverage, I selected the old Moon sign rather
than the clearly labelled current notice. I predicted Moon from that selected
context. The output was `Open the Moon gate`; speaking it produced `Wrong route`.
The UI offered recovery without reset. Selecting the current five-point notice
cleared the output, and the next generated sentence was `Open the Star gate`.
Speaking it produced `Route found`. This was intentional exploration, not an
accidental reasoning failure. No hint was requested.

Finish Level 1 → Look deeper showed `LEVEL 1 COMPLETE`, the broken `Hel—p`
message, and text acknowledging the stale first context and recovery without
erasing it. Reload restored `LEVEL 1 · COMPLETE`, the Star sentence and
`Level saved · practice recorded`. This verifies visible resume behavior, not
database internals or mastery.

## Critic observations and limits

1. Narrative/world alignment needs review. Level 1 text says the player has left
   the first chamber for a wider corridor, but my camera remained beside the
   original repair station through the mission and ending. No traversal was
   required to complete it. This is an observed presentation mismatch, not a
   diagnosis of its implementation.
2. The route choice labels explicitly distinguish old, discarded and current.
   Success here offers weak evidence of difficult spatial or contextual reasoning.
3. The first keyboard input had no visible effect; focus + alternate arrow key
   recovered. The experiment does not establish which change caused recovery.
4. Basic movement and camera control worked. Sustained movement, obstacle
   navigation, collision quality, every camera angle and audio remain untested
   by this run. Completing the button-driven mission is not comprehensive
   physical playtesting.
5. The opening/prison description calls the first lock Moon, while the distant
   visible inner gate has a five-point mark; their relationship could be clearer.
6. Root's prior knowledge and operational troubleshooting contaminate a blind
   comparison. No token usage, dollar cost or statistically reliable model
   ranking is available from this run.

## Input log

UTC times are from the CUA action log. Observations occurred between inputs.

| # | UTC | Input |
|---|---|---|
| 1 | 17:08:20 | Send up our lantern |
| 2–8 | 17:08:33–17:10:36 | Continue separately through scenes 2–8 |
| 9 | 17:10:42 | Take control |
| 10 | 17:10:56 | W key; no visible change |
| 11 | 17:11:08 | Open movement help |
| 12 | 17:11:15 | Click world to focus |
| 13 | 17:11:16 | Up key; movement practice advanced |
| 14 | 17:11:24 | Close movement help |
| 15 | 17:11:25 | Drag world [910,400] → [760,430] |
| 16–17 | 17:11:32–17:11:37 | Open, then close game menu |
| 18 | 17:11:43 | Connect world power-lead marker |
| 19 | 17:11:55 | Scan Moon lock |
| 20–23 | 17:12:01–17:12:19 | Generate four tutorial words, one click each |
| 24 | 17:12:24 | Speak to Moon gate |
| 25 | 17:12:36 | Begin Level 1 |
| 26 | 17:12:45 | Check route signs |
| 27 | 17:12:54 | Choose old Moon sign deliberately |
| 28–29 | 17:13:00–17:13:06 | Open prediction choices, select Moon |
| 30–33 | 17:13:13–17:13:35 | Generate four old-context words |
| 34 | 17:13:40 | Speak old Moon command; wrong route |
| 35–36 | 17:13:55–17:14:00 | Recheck signs, select current notice |
| 37–40 | 17:14:11–17:14:35 | Generate four current-context words |
| 41 | 17:14:42 | Speak Star command; route found |
| 42 | 17:14:57 | Finish Level 1 |
| 43 | 17:15:05 | Look deeper into prison; ending visible |
| 44 | 17:15:12 | Reload; saved completion restored |

## Excluded setup pilot

The earlier port-8032 direct-game pilot reached the end of the opening but
reported `Open a local session first` at Take control. It is excluded from the
44 actions above. Both trial saves were recreated and main runs use public
entry plus distinct cookie hosts. The pilot's precise failure cause was not
established; it must not count as model inability.
