# Native computer/browser-use critics

**Latest user direction — 20 September 2026:** Use one fresh-context Astra reviewer
across all critic lanes, including mandatory art/world direction, with actual GUI
play and video recordings as complementary evidence. Preserve separate lane
judgments and cold observations before intent. Use the existing Codex session for
now; future Terminal PM owns orchestration. Luna-first wording below is historical.
See `ASTRA-REVIEW-WORKFLOW.md`. Unsupported evidence remains unassessed.

**User direction, 19 September 2026.** This is a requirement of the general
learning-game creation system now. Future Terminal PM integration will dispatch
the same evaluation capability; it does not postpone interactive critic play.

## What the agent must do

The evaluator operates the running game through the computer/browser interface:
observe the screen, decide what to try, use mouse/keyboard/touch or visible
accessible controls, observe the response, and adapt. It explores, misunderstands,
tries alternatives, recovers and tests whether feedback is understandable.
It is an agent approximating player behavior, not a substitute for human research.

For first-touch and physical gameplay review, do not supply a winning action
sequence, hidden state, source identifiers, debug globals, network commands,
teleports or scripted assertions as the agent's means of playing. Accessibility
labels may support interaction; canvas/spatial claims require looking at the
rendered screen. Identify whether the run used browser UI or native desktop input.
Never call a fixed Playwright script a human-like agent play session.

Screenshots, video/audio recordings, traces, deterministic tests and source
inspection remain valuable collaborators. They support comparison, reproduction,
motion/listening review and diagnosis. They do not replace active play for
claims about discoverability, navigation, control, recovery or comprehension.
The computer-use observation/action loop itself naturally includes screenshots.

## General pipeline

1. Pin the game package and runtime build. Prepare a disposable learner session
   and a reachable preview; preserve real learner saves. Give the evaluator only
   the public entry URL, audience/task scope, permitted tools and bounded budget.
   Verify learner/save isolation, not merely a new browser tab. Give one agent
   control ownership per session; parallel agents need separate disposable
   learners/environments. Namespace browser/tab IDs by executor/session.
2. Preflight actual tool access, screenshot delivery, input capabilities and
   initial context. A model name alone does not prove computer-use capability.
   Required sustained keys, touch or audio must be supported for the claim.
3. Run a first-touch computer-use player without solutions or creator rationale.
   Record what it thinks is happening before explaining the intended design.
4. Run independent story, art/world, gameplay and learning critic profiles with
   appropriate context. Critics may operate the game themselves and request
   targeted replay; they also use permitted captures and technical evidence.
   Learning criticism combines actual decisions with authoritative assessment
   evidence, supplied only after the blind player observations are recorded.
5. Reproduce findings, repair the smallest responsible package/shared component,
   and have a computer-use evaluator retry the original path plus a nearby
   alternative. Run relevant deterministic regressions alongside this work.
6. Preserve separate technical, interactive, motion, audio and human verdicts.
   No green CI result or artifact-only report can close an interactive gate.

Tasks and evidence use general concepts: entry, goal, controls, exploration,
mistake/recovery, save/resume, transitions, spatial coherence and learning.
Keep game-specific characters, coordinates and solutions out of the shared
evaluator policy. Do not train the reviewer to pass the current proof game.

## Model routing and escalation

Use one fresh-context **GPT-6 Astra** reviewer for the full review, with separate
critic-lane records and mandatory art/world direction. Follow
`ASTRA-REVIEW-WORKFLOW.md`. Luna-first experiments remain historical; do not add
fallback orchestration to every lane. Tool failures require setup repair and
missing evidence remains unknown regardless of model confidence.

Set an action/time/token budget before the run. Escalate an important unresolved
question after a bounded attempt, repeated inability to progress, contradictory
observations, or failure to construct a useful reproduction. Preserve the same
build, session/checkpoint, action history, captures and uncertainty. A missing
input tool is a capability blocker, not something a more expensive model fixes.
Do not escalate merely to outvote a critic or obtain a passing verdict.

## Honest execution records

For a model comparison, run the full currently available journey separately for
each model, including control discovery, an alternative/recovery and save/resume.
Use the same frozen build, audience/task, viewport and input/action budget, with
fresh isolated saves. A short probe is not a completed comparison. Verify each
executor's actual browser access before starting; browser IDs are not portable
between agents, and cookies can cross ports on the same host. A setup failure is
not a model failure. Do not substitute a stronger model mid-trial and attribute
the combined completion to the cheaper one. Record prior knowledge and any
protocol deviations. One game and one run per model cannot establish general
capability, reliability or price advantage; repeat across unrelated tasks before
turning observations into an automatic routing policy.

Budgets are ceilings, never input quotas. Stop when the assigned observable
outcomes are verified; do not pad a run with repeated keys or camera clicks.
Count inputs separately from observations and provisioner actions. Bind each
completion claim to an observed checkpoint (for example, an ending screen is
distinct from a level-complete status). If an audit exposes a missing checkpoint,
label the subsequent recovery as a follow-up instead of rewriting the original
run as complete. Record loops without intermediate observation as a limitation
of adaptive play, even when every individual input is a real GUI event.

Record model/effort, exact build (or explicitly dirty diagnostic build), session,
tool/backend and capabilities, viewport/input mode, context exposure, budgets,
observations, chosen actions and outcomes, captures, attempted alternatives,
findings, unassessed dimensions and escalation reason. Keep input actions and
observations distinct from judgments. Record blocked/repeated actions too.

Audit cold-review isolation separately from computer-use access. A fresh subagent
that inherits AGENTS.md is an informed diagnostic player, not automatically a
cold observer. Continue useful diagnostic play while reporting that limitation;
do not issue an assignment-only independent receipt for contaminated context.

Unavailable live interaction makes interactive claims **unresolved**. Unavailable
motion/audio observation leaves those claims unassessed even if clicking works.
An evidence-only review can still contribute a bounded finding; label it as such.

## Current implementation boundary and next step

**20 September update:** The explicit native-assignment extension, input guard,
capture checks and v2 receipt/result gates are implemented and tested. See
`NATIVE-PLAY-EXECUTION-CONTRACT.md` for the current boundary. The desktop CUA
tools now have a manually supervised bridge: Luna proposes an action, the guard
permits it, and Astra executes CUA and verifies the observation. The first
two-input checkpoint run passed; see
`experiments/20260920-luna-supervised-guard.md`. Direct tool calls remain outside
the guard. This does not supply autonomous dispatch or enforced tool isolation.
The historical v1 description below still applies to artifact-only receipts.

Current deterministic browser suites and sealed critic capsules remain useful.
The existing execution-receipt validator proves supplied context/evidence
identity; it does **not yet attest live computer-use actions or tool capability**.
Do not represent its success as satisfying the native-play gate.

Use the available computer/browser-use agents now and record diagnostic runs.
Next bounded pipeline implementation: extend assignments and harness receipts
with execution mode, verified capabilities, model/budget and action-observation
references; reject an artifact-only receipt when an interactive pass is required.
Add contract fixtures for at least two unrelated game/task descriptions and
negative cases for missing live input, hidden-state shortcuts and wrong builds.
This is a lean extension of the existing evidence boundary, not a new orchestrator.

The first bounded Luna UI run and root follow-up are recorded in
`REVIEW-20260919-NATIVE-PLAY.md`, including a shared-save/stale-tab observation.

Terminal PM remains the future external dispatcher, budget/router and supervisor.
VibeLearn owns game-specific evaluation criteria and build/evidence identity.
Do not copy Terminal PM internals or start a live integration/service/deployment
under this clarification. Local agent play does not require waiting for that
integration. The user's final product review remains authoritative.

The observation/action pattern is also described in the official
[OpenAI computer-use guide](https://developers.openai.com/api/docs/guides/tools-computer-use).
