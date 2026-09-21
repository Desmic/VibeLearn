# vibeLearn — delivery workflow

**System-first correction — 21 September 2026:** The user rejects the current
learning progression and detached gameplay HUD/guidance. Repair the learning and
interaction design boundary before game implementation. Follow `docs/LEARNING-DESIGN-GATE.md`: exact-design
review before prototyping, native GUI alignment before release. The current runtime
is not compliant; screenshots, test passes and deployment do not imply acceptance.
Motion/audio remain deferred; no Level 2 or automatic deployment.

**Latest user direction — 20 September 2026:** Use one fresh-context Astra reviewer
across all critic lanes, including mandatory art/world direction, with actual GUI
play and video recordings as complementary evidence. Preserve separate lane
judgments and cold observations before intent. Use the existing Codex session for
now; future Terminal PM owns orchestration. Luna-first wording below is historical.
See `docs/ASTRA-REVIEW-WORKFLOW.md`. Unsupported evidence remains unassessed.

**Latest user clarification — 19 September 2026:** Require actual agent-directed
computer/browser play for player-experience criticism. The agent observes visible
UI, chooses actions and adapts; fixed scripts and artifact-only review are supporting
evidence. Use Luna for suitable bounded tasks, Astra when insufficient. Apply
`docs/NATIVE-COMPUTER-USE-CRITICS.md` now; future Terminal PM dispatch stays deferred.

**Authoritative execution gate — 19 September 2026:** Do not create another game candidate merely to keep coding. After evidence-backed marker and renderer repairs, the verified critic target is `471de882a01690fa50ac39455ad603fffd39cfdc` (run `35440122451`, bundle `10583163540`). The next product step is genuinely context-separated critic execution/ingestion via `docs/CRITIC-HANDOFF.md`; implementation resumes only for an evidence-backed blocker. Render remains on rejected `ad14c5aced6cf053c7617dfb03245506e1e9dad5`. Level 2 and live Terminal PM integration remain blocked. This supersedes conflicting next-chunk wording below.

Read `AGENTS.md` and the active checkpoint in `docs/STATE.md`. Detailed architecture,
story and critic policy live in linked docs; this file defines how work proceeds.

## Active product boundary

The **product journey** begins at the first URL the player opens. **Level 1 does not.**
The ordered surface is:

`entry/auth -> loading -> prologue/opening -> separate tutorial -> Level 1 -> recovery/transfer -> payoff -> review`

Do not collapse tutorial/onboarding into Level 1. The tutorial exists to teach reusable
movement/look/interact/menu semantics and the core interaction/learning grammar with a
clean early success. Level 1 is the first actual mission/problem and may assume those
basics.

For the current LLM proof track, the player directly controls the robot protagonist.
Do not infer a separate literal helper/avatar from second-person language. Player
embodiment must be explicit in the design/spec.

The retired Relay Rescue and Word Machine implementations are historical source and
regression material only. They must not be the default route, login world, fallback,
or player recovery destination. The active game is PlayCanvas-only: when required 3D
cannot load, show an explicit retry/error state. **Never render the old illustrated/
SVG 2D game while waiting for or recovering from 3D.** Do not reintroduce Three.js or
a 2D gameplay fallback into the active path.

No Level 2/later-level feature work begins before the complete prologue + tutorial +
Level 1 gate passes story, art/world, gameplay and learning critics and the user reviews
the resulting candidate.

## Platform proof, not one-off game

VibeLearn is a platform for creating learning games quickly. The current track is the
proof case. Reuse validated worlds/assets/mechanics/cinematic beats/tutorial patterns
and runtime pieces when real needs prove them useful; do not replace the current product
gate with speculative framework work.

Read `docs/GAME-CREATION-PLATFORM.md` and `docs/AUTOMATED-DEVELOPMENT-SYSTEM.md`.
VibeLearn's automation boundary is now approved, but Terminal PM Agent remains an
external evolving orchestrator. Start with a small typed adapter contract and fixtures;
do not copy its moving runtime/session/verifier/recovery internals into VibeLearn.
When its own current policy later permits a bounded live run, exercise the same contract
with a real VibeLearn task. Existing story/art-world/gameplay/learning critics remain
independent disciplines over shared evidence semantics. Deeper coupling must be justified
by a stable external boundary or evidence from real runs.

## One active chunk

Choose chunk size and boundaries at your discretion, but only inside the next unresolved
part of the ordered journey. A chunk is one coherent player experience and may include
simultaneous story, visual, control and sound work when that makes sense. Verify the
combined result before extending it.

1. **Define:** state the player-visible outcome, scope, dependencies, likely failure
   modes and observable pass conditions. Update the current plan before coding.
2. **Build:** implement the smallest end-to-end playable slice using the reusable
   framework. Include only assets, sound and infrastructure this slice needs.
3. **Verify now:** run relevant rules/storage/UI checks before adding more behavior.
   Cover a mistake and recovery, save/reload and affected accessibility controls.
4. **Play now:** use computer/browser use on the actual built game. Inspect the
   world and HUD at phone sizes and desktop; try actions as a newcomer with no story
   context. Orbit/zoom/walk alternate camera angles. Observe cause/effect, pace,
   clarity, attachment, text obstruction, controls, prop density, clipping,
   protagonist identity and spatial breathing room. Verify muted comprehension and
   reduced motion when affected; listen to sound before claiming its quality.
5. **Critique now:** apply `docs/EXPERIENCE-QUALITY-SYSTEM.md`,
   `docs/CRITIC-POLICY.md` plus
   `docs/ART-WORLD-DIRECTION-CRITIC.md`. Start player-experience review with a
   cold observer who has not read the story/design treatment. Probe collision,
   transition/handoff clarity and tutorial targets/actions; watch animation loops
   and major events in motion. Only afterward compare against intended design.
   A technically green scene can still fail
   because it is cramped, visually ambiguous, unattractive to inhabit or does not
   communicate the written story.
6. **Repair and recheck:** fix blockers in this chunk, rerun affected checks and
   replay the failed path. Do not weaken tests or critic criteria to pass.
7. **Close the gate:** record build identity, checks, playtest findings, unresolved
   limitations and the next bounded chunk in `docs/`. Advance only when required
   behavior was observed and blockers are resolved; explicit user scope changes
   take precedence. Machine checks never substitute for the user's acceptance.

## Sequence and coordination

Entry/login/loading -> prologue story/attention gate -> separate tutorial -> Level 1
first mission -> encounter/recovery -> transfer encounter -> world payoff/ending ->
complete-track playtest and integrated regression -> story critic -> art/world critic ->
gameplay critic -> learning critic -> user review.

For the next revision, design/verify the prologue before implementing later mission
content. The working prologue direction is recorded in `docs/LLM-RESCUE-STORY.md`.

Never treat existing ahead-of-gate code as verified or use it to skip this sequence.
Keep completed chunks as regression checks. Historical prototype suites may be run when
needed, but they do not count as current product progress and must not delay fixing an
active blocker.

Independent research, asset evaluation or test preparation may run in parallel at our
discretion; dependent gameplay and later-level sound/features wait. Keep changes small
enough to identify and recover from failures without debugging a whole level.

Give brief updates at chunk boundaries and during sustained work: what passed, what play
revealed, what needs repair and what comes next. Use evidence to reduce risk; do not
promise that a plan or score guarantees consumer success.

At the complete candidate gate run build, full application tests and active browser
suites, then play the whole experience from `/` through the ending. Internal readiness
requires no blocker across story, art/world, gameplay and learning gates. Only then
present the candidate to the user for their final judgment.


## Evidence gate for new game candidates

For any candidate created after the 18 September quality-system repair:

- use critic-record schema v2;
- run cold-observer review before intent comparison;
- do not rate motion from still screenshots;
- do not rate physicality without interactive traversal;
- do not rate audio atmosphere without listening;
- do not treat green browser/CI suites as creative readiness;
- do not hand a candidate to the user until required v2 criteria are assessed,
  no blocker remains, and the evidence belongs to the exact runtime SHA.

If an evidence adapter is unavailable, stop at `review_incomplete`; do not
downgrade the evidence requirement.
