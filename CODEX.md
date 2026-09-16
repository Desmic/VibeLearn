# vibeLearn — delivery workflow

Read `AGENTS.md` and the active checkpoint in `docs/STATE.md`. Detailed architecture,
story and critic policy live in linked docs; this file defines how work proceeds.

## One active chunk

Choose chunk size and boundaries at your discretion. A chunk is one coherent
player experience and may include simultaneous story, visual, control and sound
work when that makes sense. Verify the combined result before extending it.

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

Opening story/attention gate -> first action/tutorial -> one encounter and recovery
-> next encounter -> complete-level playtest and integrated regression -> user review.
Never treat existing ahead-of-gate code as verified or use it to skip this sequence.
Keep completed chunks as regression checks. Stop at Level 1 until the user reviews.

Independent research, asset evaluation or test preparation may run in parallel at
our discretion; dependent gameplay and later-level sound/features wait. Keep changes
small enough to identify and recover from failures without debugging a whole level.

Give brief updates at chunk boundaries and during sustained work: what passed,
what play revealed, what needs repair and what comes next. Use evidence to reduce
risk; do not promise that a plan or score guarantees consumer success.

At the complete-level gate run build, full tests and browser suites, then play the
whole level. Deploy only when authorized and verify the served revision. Current
instruction: continue locally, and deploy the latest verified checkpoint to the
existing private Render service at <=10% five-hour allowance remaining.
