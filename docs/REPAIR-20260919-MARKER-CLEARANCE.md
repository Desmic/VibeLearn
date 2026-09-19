# Tutorial marker clearance — 19 September 2026

## Scope and observed failure

The user's continuation request resumes a bounded, evidence-backed repair on
`main`, based on `e328760`. Runtime files at that base match frozen candidate
`92a5ecbdc803362ee1554fca6ae811adb155bc26`. The frozen evidence is preserved;
this diagnostic session is informed and cannot certify independent criticism.

On a disposable local save at 390 × 844, complete control practice, then walk
toward the locked gate before connecting power. The POWER LEAD marker is clamped
above the bottom tray and overlaps the movement stick. Its rectangle is
`(42.05, 583, 104.84, 44)`; the backward button is
`(41.35, 601.55, 20.8, 20.8)`. Browser hit-testing at the backward button's center
returns “Connect the loose power lead.” This can perform a task action instead
of the movement the player requested.

Before screenshot: `artifacts/tutorial-marker-overlap-before-390.png`.

## Observable success and repair plan

1. Preserve this path as an active tutorial browser regression before editing
   runtime code. Exercise 360/390/430 portrait and the desktop handoff.
2. Make the shared projected-marker helper account for its full button footprint
   and caller-supplied occupied HUD rectangles. Critical targets remain reachable
   in free world space; normal markers never cover controls.
3. Supply actual movement/camera/help bounds from the game; keep game-specific
   names outside the shared placement helper.
4. Verify that real touch input at the backward control moves the protagonist,
   leaves learning state unchanged and does not activate the repair action.
5. Recheck tutorial completion, skip, reload, camera movement and active browser
   suites, plus build/application tests. Manually replay the original defect.

## Reviewer capability check

Two fresh subagents were started with no conversation history and only a capsule
path. Both reported inherited repository AGENTS.md/product context before opening
any evidence. They stopped without results or execution receipts. This harness
has therefore not demonstrated assignment-only reviewer context. No independent
pass is claimed, and no frozen-candidate assignment/result was rewritten.

## Status

The marker repair and collision-test correction are implemented locally on
`main`. No deployment, Terminal PM live integration or Level 2 work.

Local checks completed:
- before-fix browser reproduction: `artifacts/marker-clearance-before.log`;
- before-fix generic geometry failures: `artifacts/marker-layout-unit-before.log`;
- focused tutorial pass: `artifacts/marker-clearance-after.log`;
- build: `artifacts/marker-repair-build.log`;
- 265 application tests, seven skips: `artifacts/marker-repair-tests.log`;
- entry/opening/expanded tutorial: `artifacts/marker-repair-browser.log`;
- corrected controls: `artifacts/marker-repair-controls.log`;
- chapter: `artifacts/marker-repair-chapter.log`;
- readability at 200% text: `artifacts/marker-repair-readability.log`;
- reset/logout lifecycle: `artifacts/marker-repair-lifecycle.log`.

All seven active browser groups passed across the integrated run and the resumed
groups after correcting the collision-test setup. The first integrated log
retains the original failure; the corrected result is in the controls log.

Manual replay at 390 × 844 found the marker beside the movement stick, with the
backward center correctly hit-testing to “Move backward.” Holding that control
moved Z from -36.84832 to -35.86299 without changing the learning state. The
360/430 screenshots were also visually inspected; the automated traces include
actual touch input and unchanged learning state at all three phone widths.

After screenshots: `artifacts/tutorial-marker-clearance-manual-390.png` and
`artifacts/tutorial-marker-clearance-{360,390,430}.png`. Interactive evidence:
`artifacts/first-words-tutorial-interaction-trace.json` and
`artifacts/first-words-controls-interaction-trace.json`.

Build manifest source digest:
`0b516f08beadfb49719890a598aad3993e849545a396fc0f2213487b94da972c`.
These are local working-tree observations, not new GitHub exact-SHA evidence or
independent product acceptance. Before release, create the replacement exact
candidate, regenerate its evidence and execute the required isolated reviewers.

Separate diagnostic note: fresh opening/handoff emitted repeated WebGL
zero-size-framebuffer warnings while rendered play recovered. This repair does
not diagnose or resolve those warnings. The original browser session log is
preserved under `artifacts/marker-repair-browser-session/`.
The subsequent shared-renderer investigation reproduced and repaired this
zero-size buffer failure; see `REPAIR-20260919-RENDERER-LIFECYCLE.md` for the
separate before/after evidence and verification scope.

## Integrated regression finding

The first integrated run passed entry, opening and tutorial but failed the
existing collision probe. Its preceding timed animation check moved the robot
to Z = -28.69312, outside the token-track contact lane. The frozen CI trace
had probed from Z = -28.48, just inside that lane. Walking left in the former
case correctly passes beside the prop; the test incorrectly expected contact.

The collision test now reloads the same saved run before the probe to restore
the authored spawn. It retains the original no-penetration bound and additionally
requires approach movement, stable contact during further input, and movement
away afterward. A new contact screenshot supplements the interactive trace.
No collision/runtime rules were changed to satisfy the test.
