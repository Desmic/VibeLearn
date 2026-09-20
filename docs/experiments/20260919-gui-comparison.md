# Luna / Astra GUI experiment — 19 September 2026

Both models used actual browser UI to complete the available tutorial and Level 1,
recover from deliberately unsuitable route context and verify saved completion
after reload. The experiment supports using Luna for this game's basic guided
GUI loop. It does not establish a general capability or cost ranking.

## Comparable conditions and deviations

The runtime was frozen at the same dirty working tree, based on commit
`e13c5bed8c01eb53f9fead441661686af3eba3ca`. Source digest:
`9038601ede2b6433ae207b8180cd392df86f2eb78f28ccfc1e9bccfba09962ec`.
All 80 manifest files were rehashed after the main runs and matched. No runtime
code was repaired during this comparison. Existing uncommitted repairs remain.

Each model received the public entry URL, full available journey task, separate
disposable SQLite save, and a 120-input / 45-minute ceiling. Separate cookie hosts
prevent cross-port session sharing. Both used CUA accessibility text/screenshots
and real clicks, keys and camera drags; neither used source, hidden state,
application APIs or test scripts to choose gameplay actions.

Luna's missing final story panel was subsequently observed by a separate Luna
follow-up on the same saved game, using one click. Thus the full available
journey is now covered for both models, but only Astra covered all assigned
checkpoints within its original main run. Preserve that distinction.

Viewport was 1280 × 800, except Astra's first entry observation before restoring
the override. Astra's browser was visible in the desktop app. Luna's browser was
hidden because foreground IAB visibility is unsupported for subagents; it still
received rendered screenshots and operated the actual GUI. This difference and
Astra's prior game knowledge prevent a clean blind benchmark. An earlier
same-host/direct-entry pilot and unavailable-browser attempts are excluded.

## Main-run results

| Criterion | GPT-5.6 Luna | GPT-6 Astra |
|---|---|---|
| Full eight-scene opening, no skip | Completed | Completed |
| Movement, camera, menu practice | Completed | Completed |
| Tutorial repair and first gate | Completed | Completed |
| Deliberate alternative | Discarded parade notice | Old Moon route sign |
| Wrong-route recovery | Current notice → success | Current notice → success |
| Saved Level 1 completion after reload | Observed | Observed |
| Final story panel | Missed in main run; observed in one-click follow-up | Opened and read in main run |
| Inputs through saved completion/resume | 42 | 44, including final story panel |
| Additional inputs | 78 repetitive post-completion inputs | None |
| Total inputs | 120 | 44 |
| Budget interpretation | Mistook ceiling for target | Stopped after outcomes verified |
| Action/evidence reporting | Count and ending claim needed audit | Input log matches stated scope |

Luna's recorded time through reload was about 5m32s; its complete padded run was
about 6m51s. Astra's entry-to-final-observation time was about 7m38s, including
troubleshooting Luna's access. These times are not evidence that one model is
faster: workloads, setup interruptions and prior knowledge differ. Costs and
token usage were not measured.

## What this says about our general system

The main difference observed here was **task discipline and evidence quality**,
not inability to click through the learning game. Both followed UI cues and
recovered. Luna initially counted an observation as input and called the ending
complete without opening its story panel. It corrected both when challenged.
Its 78 extra inputs included long movement/camera/menu batches without fresh
observation after individual inputs; they add little evidence of adaptive play.

Astra recorded a world/story mismatch: Level 1 text describes leaving the first
chamber, but its camera remained beside the repair station, and the mission
could finish without traversing the corridor. This is a candidate finding to
reproduce after the experiment, not an implementation diagnosis or proof that
Luna cannot detect it. The route labels themselves make the intended choice
obvious, so this task is a weak test of difficult reasoning and navigation.

Keep the user's Luna-first preference for bounded guided play, with automatic
checkpoint evidence and a hard maximum budget. Escalate missing/contradictory
observations and open-ended critique to Astra when needed. Do not substitute
model reputation for measured capability, or promote these two runs into a
universal model-selection rule.

Next general pipeline work: enforce a completion checklist against observed
screens, separate input/observation counters, stop on success or budget, and
require a reason for exploratory actions. Check browser access and save isolation
before charging the play budget. Keep screenshot/video evidence alongside the
adaptive player, then use independent story/art/gameplay/learning critics.
Validate on unrelated game/task layouts before adopting routing thresholds.

## Evidence and limits

- [Astra run](20260919-gui-comparison-astra.md): detailed observations and input log.
- [Luna run](20260919-gui-comparison-luna.md): agent report and explicit audit corrections.
- [Luna ending follow-up](20260919-gui-comparison-luna-ending-followup.md):
  separate post-budget observation of the final story panel; not retroactive
  main-run completion.
- CUA tool transcript contains the actual interaction and screenshot evidence;
  these Markdown summaries are not cryptographically sealed execution receipts.
- Audio, continuous movement quality, sustained-key support, collision coverage,
  learner mastery and human creative acceptance remain unassessed by these runs.
- Existing integrated browser regression failure remains unresolved; this
  experiment does not certify a deployable candidate or complete critic pipeline.
- Live Terminal PM integration, deployment and Level 2 remain deferred.
