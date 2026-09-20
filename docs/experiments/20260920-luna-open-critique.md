# Luna open-ended native GUI critique — 2026-09-20

## Phase

OPEN-ENDED PLAY CRITIQUE (bounded live GUI observation; saved completion state preserved).

## Scope and method

- Target: `http://127.0.0.1:8041/first-words`, disposable saved game.
- Evidence source: visible in-app browser accessibility tree and screenshots only; no project code, docs, prior reports, hidden state, DOM evaluation, API calls, or scripts used during play.
- Inputs: 6 direct UI inputs total: expand movement help; ArrowUp with help button focused; click world surface; ArrowUp with world focused; Zoom camera in; Recenter camera.
- Time: bounded short pass, well under 10 minutes.
- Deliberately did not click “Play Level 1 again” or reset/replay the level.

## Observations

1. Initial saved view visibly presented `LEVEL 1 · COMPLETE`, “The deeper gate is open,” explanatory completion text, the open star gate in the world, `YOUR SPEECH ENGINE · ROUTE OPEN`, generated words `Open the Star gate`, and `Level saved · practice recorded`. The visual world and progression copy agreed: the gate was visibly open and the route-open result was shown.
2. Expanding Movement controls exposed the visible instruction: “WASD / arrows: move · Drag the world: look · Wheel: zoom,” plus phone guidance and “Use the highlighted task controls to interact.” This makes the intended control grammar discoverable.
3. ArrowUp while the help button was focused produced no visible movement; the help overlay and completion state remained. This is not sufficient to call movement broken because focus was on the help control.
4. Clicking the world surface moved focus to the world container. ArrowUp then still produced no visible movement or accessibility change. Because this is a completed save and the instruction does not state whether movement is disabled after completion, active movement remains unassessed rather than a failure claim.
5. Clicking the explicit “Zoom camera in” control visibly changed framing: world elements enlarged and shifted while the completion heading, generated phrase, and saved-progress label stayed intact. Camera feedback was immediate and understandable.
6. Clicking “Recenter camera” visibly restored the original coherent framing and retained the same completion/progression signals.

## Findings

- No blocking finding observed in this bounded pass.
- Positive evidence: camera control feedback is visible and reversible; completion presentation is internally consistent across story copy, world state, generated phrase, and saved-progress indicator.
- Uncertainty: keyboard movement/physical traversal was not certified because the preserved state was already complete and both ArrowUp probes caused no visible motion. This could be completion-state behavior, focus/input routing, or movement not being observable from the sampled view. No claim of pass/fail is made.

## Skipped or unassessed dimensions

- Active movement, collision, traversal footprint, and camera follow during movement: unassessed.
- Drag-to-look and wheel zoom: unassessed (button zoom was assessed).
- Audio quality, timing, and sustained animation/motion: unassessed; no claim based on absence of evidence.
- Tutorial/prologue transition and first-time learner comprehension: unassessed because replay/reset was prohibited.
- Interaction completion feedback during an in-progress task: unassessed; only the already-complete saved state was inspected.

## Reproduction notes

No issue reproduction recorded. The only potentially suspicious behavior was no visible response to two ArrowUp inputs; both were in the already-complete saved state, so it is recorded as uncertainty rather than a defect.

## Handoff

Browser tab was marked for handoff after the pass. Completion state and camera framing were restored before handoff.
