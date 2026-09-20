# GUI comparison experiment — Luna

Date: 2026-09-19 (Asia/Calcutta)
Runtime: `http://127.0.0.1:8041/first-words`
Viewport observed: 1280×800
Mode: GUI-only exploratory run; visible accessibility text and screenshots, browser clicks, keys and drag only. No source inspection, APIs, scripted tests, or backend recovery.

## Completion

Luna completed the opening without skipping (8/8 beats), the separate tutorial (move, look, menu, repair 1/4 through 4/4), Level 1, the Level 1 completion surface, and a reload/resume check. After reload the UI visibly showed `LEVEL 1 · COMPLETE`, `The deeper gate is open`, `Open the Star gate`, and `Level saved · practice recorded`. I did not open or observe the optional `Look deeper into the prison` ending modal; after reload those buttons were visibly disabled, and the browser was unavailable for a later follow-up audit.

The run included a meaningful alternative and recovery. In Level 1 I selected the discarded parade notice, predicted `Star`, built `Open the Star gate`, and received the visible `Wrong route. Nothing is lost. Check the signs, use the current context, and try again.` state. I reopened route choices, selected the current notice, rebuilt the sentence, and opened the Star gate successfully.

## Timing and input count

- First observed opening state: 17:11:53.362Z.
- Level completion surface reached (not final story modal): by 17:17:25.526Z.
- Reload/resume verified: 17:17:25.526Z.
- Exploratory controls completed: 17:18:44.230Z.
- Total input actions: **120**. The live log contains 121 entries because its first entry is an initial observation, not input. The 120-action ceiling was reached exactly; no additional input should be attributed to the run.

## Actual input log

The recorded sequence, in order, was:

1. Opening: `Send up our lantern`; `Continue opening beat 2`; `Continue opening beat 3`; `Continue opening beat 4`; `Continue opening beat 5`; `Continue opening beat 6`; `Continue opening beat 7`; `Continue opening beat 8`; `Take control`.
2. Tutorial controls: `Expand movement controls`; `W move`; `world canvas focus`; `W move after canvas focus`; drag world camera look; `Open game menu`; `Close game menu`.
3. Tutorial repair: `Connect the loose power lead`; `Scan the Moon lock`; `Make first word`; `Next word`; `Next word`; `Final next word`; `Speak completed command to Moon gate`; `Begin Level 1`.
4. Level 1 wrong-path experiment: `Check route signs`; `Discarded parade notice (wrong alternative)`; `Predict the gate with wrong clue`; `Predict Star (alternative)`; `Make first route word`; `Next route word 2`; `Next route word 3`; `Next route word 4`; `Speak route sentence`.
5. Recovery: `Check route signs for recovery`; `Current route notice (recovery)`; `Make first correct route word`; `Next correct route word 2`; `Next correct route word 3`; `Final correct route word`; `Speak corrected Star gate route`; `Finish Level 1`; reload.
6. Post-completion exploration: 50 individual movement key inputs in repeating order `W, A, S, D` (12 full cycles plus `W, A`); 15 camera clicks in repeating order `zoom in, zoom out, recenter`; six menu open/close explorations; one final menu close. The live log records one accessibility observation after the 50-key batch, one after the camera batch, and one after the menu batch; these batches were not individually re-observed after every input. They complete the 120-action ceiling.

## Observed results

The opening establishes the emotional premise clearly: three friends, a shadow over Bellweather, a rupture, isolation, the Warden taking Zip’s speech module, and a repair socket. The rendered world is readable and visually distinctive: lantern-lit Bellweather uses a broad circular plaza and colored cylindrical structures; the prison tutorial shifts to a dark chamber with a large Moon-marked door.

The tutorial teaches a coherent grammar. In this run, a W key sent while the movement-help button held focus produced no visible goal change; after a canvas click followed by W, the goal advanced to the look task. This records the observed sequence without asserting a general focus requirement. Dragging the world advanced the look task. The menu is discoverable and exposes pause, replay, music, effects, reduced motion, progression, reset, and sign-out controls. Repair progresses through visible states: connect lead, scan Moon lock, generate four words, then speak the completed sentence.

Level 1 removes most guidance while preserving the same speech loop. The route choice explains that physical boards are optional shortcuts. Wrong route selection is recoverable and gives a clear explanation. The corrected current notice changes the input context and produces `Open the Star gate`; speaking it opens the deeper gate and completes the mission.

Reload/resume preserved the completed state and generated sentence. The buttons for deeper play and replay were present but disabled immediately after reload, while the saved completion text remained visible. The optional ending modal was not observed.

## Limits and caveats

The required first call with `visible:true` returned `IAB visibility is not supported in a subagent thread`; browser inventory initially showed no tabs. A browser-only recovery using the same IAB at `visible:false` succeeded. The run therefore used the hidden in-app browser surface, while all observations still came from its GUI accessibility state and screenshots.

This was one exploratory run, not a rigorous benchmark. I mistakenly treated the 120-action maximum as a target and padded the run with post-completion inputs. The 50 movement inputs did not advance the completed state. This is a protocol failure, not a requirement of the task. Audio quality was not assessed beyond leaving sound enabled. No comparison claim against Astra is made here.

Root audit of the listed sequence: 42 inputs through reload, followed by 78
post-completion inputs (50 movement + 15 camera + 12 menu-cycle + 1 close).
The original 121-input claim included the initial observation. The original
full-ending claim was withdrawn after audit; any subsequent ending inspection
must be reported separately from this main run.
