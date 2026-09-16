# Inside the Word Machine — Episode 1 playtest

## Candidate and method

Final application candidate: **31025192a4c01dee04fcd621c1e4a52887b4efcb**, local branch `codex/critic-evidence-reset`. Learning content `ai-01-context`, version 1; WorldSpec `word-workshop@1`; opening `word-machine.arrival.v1`; PlayCanvas 2.22.1.

Method: **internal_tool_assisted**. The implementer read the docs/source and knew the solutions. This is direct browser use and an internal design judgment, not a blind novice test, a child study, an independent agent review or the user's verdict. The current user is the sole human product critic and final authority.

The final frozen candidate was played from fresh SQLite state in `artifacts/word-machine-final-3102519.sqlite3`, through the opening, both wrong deliveries, both repairs and saved completion. Final screenshots use the `final-` prefix below. An earlier complete exploratory run used `word-machine-review.sqlite3`; an intermediate fixed-version run used `word-machine-final-668e635.sqlite3`. Those databases were disposable review state, never the learner's real database.

## What the screen communicates

The first screen names the message workshop, identifies the player as the machine operator, marks Mira at the Garden and shows the courier bringing a flower to a sleeping machine. Waking it visibly reveals the lit core and the courier's response. The wake marker disappears so the object is exposed. The same courtyard continues into play.

The machine's input and the pieces it writes are visible separately. Each produced piece is appended to the next input. The courier follows the generated destination. The first bad route lacks the location clue; the second deliberate bad route uses an incorrect clue. Their feedback now distinguishes those causes.

## Actual actions on the final candidate

1. Fresh entry at 390 × 844. Waited for the courier to arrive, then woke the machine and entered the first delivery.
2. Generated `Go`, `to`, `Library`; sent the courier. Observed the wrong Library destination while Mira remained at the Garden.
3. Added the Garden clue, generated the new message and sent it. Observed the flower beside Mira, with the courier standing aside.
4. Started the second delivery. The goal was **Find Ivo. Deliver the book.** His note said he had left the Garden and was now at the Library.
5. Deliberately selected Garden again. Generated/sent that route and observed another wrong delivery. The message explained that the clue itself was wrong.
6. Added Library, generated/sent the corrected route and observed Ivo's delivery.
7. Finished the episode and reloaded. The completed episode returned with **Episode saved · practice, not mastery**.
8. Opened **What comes next?**. The eight-part series was available as an outline, with later episodes explicitly planned.

The final action log contains 20 semantic moves. Repeated generation actions were sometimes batched through their already-observed browser buttons during this final regression pass; no commands were injected through a hidden API to advance the game.

## Additional hands-on checks and scope

During the complete immediately preceding run on `33d442b`, a deliberate reload resumed `Go`; the optional inspection showed Library 70 / Garden 30 after `Go to`. After a saved mistake, zoom in/out, recenter and the movement stick were operated without a recovery reload. The camera visibly changed and the player moved. Pause disabled Send; resuming restored it. Reduced motion applied to opening replay, and returning from replay preserved the unfinished `Go to Library` message. Selected states were visually inspected at 360 × 800, 430 × 932 and 1280 × 720.

The final `3102519` change only moved the courier's stopping point, moved the received parcel, and shortened/repositioned the robot marker. Rules, commands, pause, replay, input and camera code are identical to `33d442b`. Both affected delivery endings were re-played from fresh state on `3102519`. The final automated browser gate repeats the full chapter in 360/390/430 contexts and the saved-state/control/replay checks. See [LLM-EPISODE-1-VERIFICATION.md](LLM-EPISODE-1-VERIFICATION.md).

A viewport with touch enabled and mouse/pointer operation of a movement stick is not a physical phone touch test. Keyboard is covered by actual browser key events in the automated gate. Browser/OS text enlargement and physical touch remain unverified. A page reload resumes learning state but returns the player's camera/location to the authored starting view; movement survives ordinary saves and in-page replay.

## Problems caught and repaired

The implementation/playtest loop caught an output label covering the machine, missing generated context, a parcel jumping ahead of the courier, incorrect missing-clue feedback, phone recenter using desktop distance, the old game's disabled post-save controls, and incomplete-world loading failures. The first frozen candidate `668e635` also revealed the courier jumping back when the machine woke. That was fixed in `33d442b`; the final framing fix `3102519` keeps the recipient, parcel and marker distinct. Earlier screenshots without `final-` are intermediate evidence and must not be presented as final-candidate screenshots.

## Remaining weaknesses — before ratings

- The two clues are the main meaningful choices. Repeating the fixed `Go` and `to` steps is mechanically thin once the pattern is understood.
- The recipients have little characterization or reaction. Delivery makes sense, but there is only a modest emotional reason to continue.
- The second note is a small reading/context challenge, not a separate unassisted test of predicting or explaining model behavior. No independent transfer or retention has been established.
- The input loop is a faithful limited illustration, but it could leave the impression that real models follow a small set of explicit rules. The optional inspection explains the simplification; a future episode must visibly connect it to learned parameters and real tokenization.
- Default text is much less intrusive, but enlarged-text behavior has not been checked. This prevents a complete readiness recommendation.

## Internal diagnostic ratings

These are whole-number judgments about the observed experience, not audience measurements. No weighted overall score is used.

| Criterion | Rating | Evidence / limit |
|---|---:|---|
| World, role and stakes | 7 | Workshop, operator, courier and waiting recipient are identifiable; personal stakes remain slight. |
| Visible causality | 8 | Wake, generated destination, wrong travel and corrected handoffs are visible; result text still leads a brief travel animation. |
| Attachment and pull | 5 | Clear errands, limited character attachment and surprise. |
| Orientation and action | 8 | One goal and contextual actions; the second goal fades the destination answer. |
| HUD readability | 7 | Compact input/action tray and markers fit inspected states; enlarged-text behavior is unverified. |
| Controls | 8 | Saved actions, camera, movement, pause and replay function; physical devices remain untested. |
| Meaningful agency | 6 | Context changes consequences, but most generation clicks are predetermined. |
| Progression and recovery | 6 | Copying the first answer fails and recovery works; the increase in reasoning depth is small. |
| World continuity | 7 | One persistent courtyard and visible deliveries; the two recipients are visually simple and the setting changes little. |
| Concept fidelity | 7 | Appended context and changed continuations are explicit; authored whole-word scores are a limited toy. |
| Fresh transfer | 5 | The changed case offers practice, with an explicit note and no independent explanation/prediction probe. |

**Internal verdict: needs_revision.** Gate minima: rendered story 5, first touch 7, whole chapter 6, learning 5. This is a playable local prototype for the user's Phase 1 checkpoint, not a 9+ recommendation, acceptance or deployment authorization. Improve agency/attachment and add an appropriately scoped independent prediction probe before recommending readiness. Complete enlarged-text and touch coverage before making those claims.

## Evidence

Final manual images: [opening](llm-playtest-20260915/final-opening-390.png), [awake machine](llm-playtest-20260915/final-awake-390.png), [wrong door](llm-playtest-20260915/final-wrong-390.png), [Mira delivery](llm-playtest-20260915/final-mira-390.png), [changed-case mistake](llm-playtest-20260915/final-second-wrong-390.png), [Ivo delivery](llm-playtest-20260915/final-ivo-390.png), [saved completion](llm-playtest-20260915/final-complete-390.png).

Intermediate checks, with unchanged-code scope described above: [inspection](llm-playtest-20260915/inspection-390.png), [controls after save](llm-playtest-20260915/controls-after-save-390.png), [reduced-motion replay](llm-playtest-20260915/reduced-replay-360.png), [430 portrait](llm-playtest-20260915/second-wrong-430.png), [desktop](llm-playtest-20260915/second-wrong-desktop.png).

Machine-readable review: [2026-09-15-word-machine-3102519.json](reviews/2026-09-15-word-machine-3102519.json); validated readiness result: [critic-result.json](llm-playtest-20260915/critic-result.json). The final direct run’s persisted result is [final-saved-result.json](llm-playtest-20260915/final-saved-result.json).
