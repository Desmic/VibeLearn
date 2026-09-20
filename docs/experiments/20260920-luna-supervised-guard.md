# Supervised Luna checkpoint check — 20 September 2026

Result: Luna completed two assigned semantic UI checks in two guarded inputs and
stopped. This proves the manual bridge was used with real GUI actions; it does
not establish a model reliability rate or autonomous tool isolation.

## Scope and setup

Assignment: open and observe the actual ending panel from an existing completed
save, reload, and verify completion returns. Budget: four attempted inputs.
Capabilities: visible accessibility text, click and reload. Creative direction,
physical traversal, animation, sound and visual quality were outside this task.

Luna (`gpt-5.6-luna`, task `luna_guarded_check`) received only supervisor-supplied
visible UI observations and task instructions. It proposed one action at a time.
Astra operated the documented CUA browser tools after Python guard permission,
returned observations, and independently marked checkpoints. The agent was
instructed not to use other tools; this was not enforced tool isolation.

Temporary tab 5 used the isolated local save at `http://127.0.0.1:8041/` and was
closed afterward. Opening the tab was supervisor setup, excluded from task input
count. The user's localhost tab was untouched. Base commit:
`e13c5bed8c01eb53f9fead441661686af3eba3ca`, with dirty runtime changes.
All 80 runtime files were rehashed and matched
`artifacts/gui-comparison-20260919-run1/experiment.json`; source digest:
`9038601ede2b6433ae207b8180cd392df86f2eb78f28ccfc1e9bccfba09962ec`.
This is not a clean candidate or cold independent critic run.

## Observed sequence

| Step | Luna decision / observation | Supervisor result |
| --- | --- | --- |
| Initial | Completed level UI, ending button and saved-practice label | Observation 001 retained |
| Input 1 | Click visible `Look deeper into the prison` button | Permitted; native click succeeded |
| Ending | Panel heading `The first route is open.`, broken help message and saved-route text | Observation 002; ending checkpoint verified |
| Input 2 | Reload | Permitted; native reload succeeded |
| Loading | Initial prologue/loading placeholder | Observation 003; no completion claim accepted |
| Observe | Luna requested `OBSERVE` | No input consumed |
| Restored | Completed-level heading, route-open engine and saved-practice label returned | Observation 004; save checkpoint verified |
| Stop | Luna reported both supported checks and stopped | No extra Luna input |
| Guard probe | Supervisor requested another reload solely to test stopping | Rejected: assigned checkpoints complete; no CUA call |

Luna's final response: “STOP — Verified both conditions: the ending panel showed
‘The first route is open’ with saved progress, and after reload the completion
state returned with ‘The deeper gate is open’ and ‘Level saved · practice recorded.’”

The supervisor explicitly offered a free observation and warned against inferring
data loss from the loading placeholder. This is guided success, not evidence of
unprompted uncertainty calibration. The final response did not list unassessed
aspects despite that request; its claims remained limited to the two checks.

## Retained evidence and validation

Local artifacts: `artifacts/guarded-luna-20260920-run1/` contains config,
`execution.json`, `dispatch.jsonl` and four observation text files. Captures are
clearly labelled **supervisor-transcribed AX excerpts**, not raw screenshots.
Hashes validate those retained bytes; they cannot authenticate the supervisor's
transcription. Root also visually inspected the initial scene through CUA; that
screenshot is not used to certify Luna's visual judgment.

Validator summary: 2 attempted inputs, 2 successful inputs, 4 observations,
no missing checkpoints, final observation present, no pending permit. Artifact
hash verification passed. The stop-probe rejection was observed in tool output;
it was not an executed input and is not in the input count. No v2 critic receipt
was sealed for this diagnostic assignment.

79 focused tests passed across the bridge, native guard, task routing,
assignments, receipts, result validation, capsules and sequential ingestion.
No game runtime changed; this was not a new full integrated game gate.

## Routing implication and next experiment

Use Luna provisionally for explicit, short, observable UI checkpoints with
external action counting and independent coverage checks. This trial provides
no support for routing whole-experience creative direction away from Astra, or
trusting self-reported confidence without audit.

Next, predefine ambiguous and missing-checkpoint cases without adaptive hints,
repeat on an unrelated game, and count silent false-clear results separately from
explicit uncertainty and tool/setup failures. Astra should audit those results;
an escalation signal is useful only alongside measured misses. Future terminal
agent integration remains planned, not activated by this bridge.
