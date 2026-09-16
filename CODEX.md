# vibeLearn — delivery workflow

Read `AGENTS.md` and the active checkpoint in `docs/STATE.md`. Detailed architecture,
story and critic policy live in linked docs; this file defines how work proceeds.

## Active product boundary

**Level 1 begins at the first URL the player opens.** Entry/auth, loading, the opening
scene, tutorial, encounters, recovery, transfer and ending are one ordered product
surface. Do not polish a later chunk while `/`, login, routing or the opening still
belongs to an older game. The current active path is Bellweather -> `/first-words`.

The retired Relay Rescue and Word Machine implementations are historical source and
regression material only. They must not be the default route, login world, fallback,
or player recovery destination. The active game is PlayCanvas-only: when required 3D
cannot load, show an explicit retry/error state. **Never render the old illustrated/
SVG 2D game while waiting for or recovering from 3D.** Do not reintroduce Three.js or
a 2D gameplay fallback into the active Level 1 path.

No Level 2/later-level feature work begins before the complete Level 1 gate passes the
critic policy and the user reviews the resulting candidate.

## One active chunk

Choose chunk size and boundaries at your discretion, but only inside the next unresolved
part of the ordered Level 1 journey. A chunk is one coherent player experience and may
include simultaneous story, visual, control and sound work when that makes sense. Verify
the combined result before extending it.

1. **Define:** state the player-visible outcome, scope, dependencies, likely failure
   modes and observable pass conditions. Update the current plan before coding.
2. **Build:** implement the smallest end-to-end playable slice using the reusable
   framework. Include only assets, sound and infrastructure this slice needs.
3. **Verify now:** run relevant rules/storage/UI checks before adding more behavior.
   Cover a mistake and recovery, save/reload and affected accessibility controls.
4. **Play now:** use computer/browser use on the actual built game. Inspect the
   world and HUD at phone sizes; try actions as a newcomer with no story context.
   Observe cause/effect, pace, clarity, attachment, text obstruction and controls.
   Verify muted comprehension and reduced motion when affected; listen to sound
   before claiming its quality. Record what was actually observed and what was not.
5. **Repair and recheck:** fix blockers in this chunk, rerun affected checks and
   replay the failed path. Do not weaken tests or critic criteria to pass.
6. **Close the gate:** record build identity, checks, playtest findings, unresolved
   limitations and the next bounded chunk in `docs/`. Advance only when required
   behavior was observed and blockers are resolved; explicit user scope changes
   take precedence. Machine checks never substitute for the user's acceptance.

## Sequence and coordination

Entry/login/loading -> opening story/attention gate -> first action/tutorial -> first
encounter and recovery -> transfer encounter -> world payoff/ending -> complete-level
playtest and integrated regression -> critic gate -> user review.

Never treat existing ahead-of-gate code as verified or use it to skip this sequence.
Keep completed chunks as regression checks. Historical prototype suites may be run when
needed, but they do not count as active Level 1 progress and must not delay fixing an
active Level 1 blocker.

Independent research, asset evaluation or test preparation may run in parallel at our
discretion; dependent gameplay and later-level sound/features wait. Keep changes small
enough to identify and recover from failures without debugging a whole level.

Give brief updates at chunk boundaries and during sustained work: what passed, what play
revealed, what needs repair and what comes next. Use evidence to reduce risk; do not
promise that a plan or score guarantees consumer success.

At the complete-level gate run build, full application tests, the active entry + Level 1
browser suites, then play the whole level from `/` through the ending. Apply
`docs/CRITIC-POLICY.md`: every required criterion must be >=9 with no blocker before an
internal `ready_for_user_review` recommendation. Only then present the candidate to the
user for their final judgment.
