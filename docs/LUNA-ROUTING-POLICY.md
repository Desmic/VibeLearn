# When to use Luna for game evaluation

**Latest user direction — 20 September 2026:** Use one fresh-context Astra reviewer
across all critic lanes, including mandatory art/world direction, with actual GUI
play and video recordings as complementary evidence. Preserve separate lane
judgments and cold observations before intent. Use the existing Codex session for
now; future Terminal PM owns orchestration. Luna-first wording below is historical.
See `ASTRA-REVIEW-WORKFLOW.md`. Unsupported evidence remains unassessed.

Working policy, 20 September 2026. This is a provisional operating decision
based on local GUI experiments, not a claim that one model is universally able
or unable to perform a class of work. The unit of routing is a **task and its
required evidence**, not a whole game or the price of an individual click.
Live Terminal PM dispatch remains future work.

**20 September user decision:** Whole-experience creative direction goes directly
to Astra. Luna supplies bounded play/observation work and signals when it cannot
support a conclusion; Astra handles unresolved judgment. Do not wait for Luna to
fail before assigning the story/art/world/pacing synthesis to Astra. Independent
critic disciplines and the user's final verdict remain intact.

## Decisions supported now

| Work | Route now | Evidence / restriction |
|---|---|---|
| Follow visible controls through a guided game | Luna, with checkpoint audit | Full opening/tutorial/Level 1 completed in the September 19 run |
| Try a bounded alternative and recover using feedback | Luna, with observed before/after states | Discarded context → wrong route → corrected context → success |
| Confirm a specific visible checkpoint or saved resume | Luna, with explicit checkpoint description and capture audit | Supervised ending/resume check plus direct GUI positive/contradictory save cases; missing pre-reload screenshots show protocol still needs external coverage checks |
| Detect an obvious conflict between status text and visible game state | Luna provisionally, with reproduction audit | Direct CUA probe rejected a reset board labelled saved and left an OPEN-but-blocked route unresolved; two easy authored cases only |
| Collect observations for a known issue | Luna provisionally; audit reproduction | Suitable candidate task, not yet independently validated across issue types |
| Check current-screen consistency and visible camera buttons | Luna, restricted to observed controls | Corrected September 20 six-input review stopped without padding and labelled unsupported dimensions unassessed |
| Triage claims against a supplied action/observation record | Luna provisionally, with independent audit | Four easy synthetic cases respected evidence boundaries; one status label differed, and a fifth case correctly separated tool failure from model choice |
| Whole-experience creative direction: story, art/world, atmosphere, pacing and coherence | Astra directly | Explicit user routing decision; Luna may collect observations but does not replace this critic |
| Discover unknown spatial, story or usability defects | Luna as an initial scout, Astra/independent critic reviews findings and coverage | Guided completion alone does not demonstrate defect discovery or reliable absence-of-defect claims |
| Explain a subtle contradiction or decide whether it is a defect | Astra initially, using reproduction/evidence; retain uncertainty | Conservative routing choice, not demonstrated Luna incapacity or guaranteed Astra accuracy |
| Produce the sole final quality/learning/release verdict | Neither model alone | Independent discipline gates, authoritative learning evidence and user review remain required |
| Judge audio, continuous motion or sustained physical control without those capabilities | Neither; repair the observation/input setup or mark unassessed | A model upgrade cannot supply a missing tool or missing observation |

Luna can **execute** a task even where it cannot yet be trusted to **accept its
own result**. Its first full-run report missed an ending checkpoint and confused
an observation with an input. It also padded work to a maximum budget. Those are
observed failures of that run/prompt combination; they are not proof of an
intrinsic inability. Test a clearer contract before permanently excluding Luna.

## Assignment contract

The [real repair-return review](experiments/20260920-native-repair-return.md)
also produced a confident wrong tile label in Luna's screenshot observation.
It corrected the label after Astra requested reinspection. Coverage passed only
with that audit; even a bounded evidence reviewer can silently misread a spatial
detail. Retain independent acceptance checks, not uncertainty-only fallback.

The direct [ambiguity probe](experiments/20260920-luna-ambiguity-results.md)
produced no false-clear conclusion on two problematic fixtures and accepted one
valid control. It also missed required pre-reload screenshots. This supports
bounded visible-state checks, not self-signals-only acceptance: independently
validate the requested observations even when the reported conclusion is correct.

Supply the public entry, build identity, isolated disposable save, task scope,
required visible outcomes and maximum action/time budget. Do not supply the
winning game actions or authored explanations to an exploratory player.

Use explicit language: "The budget is a ceiling, not a target. Stop when all
assigned outcomes are observed, or report the exact missing outcome. Do not
add repeated actions merely to use the budget. Each exploratory action should
answer a question; observe its result before choosing the next probe. Separate
what you observed, what you infer, and what you could not assess."

For a full play task, list ending-screen observation separately from level
completion and saved resume. For an open critique, require coverage/uncertainty,
not a minimum number of faults. "No defect observed" is not "no defects exist."
Keep the wording game-independent; game-specific goals belong in the assignment.

## Continue, repair setup, escalate or stop

1. **Repair setup:** failed browser access, unreachable preview, shared save,
   unavailable required input/observation or wrong build. Do not score this as
   model failure or automatically spend on Astra.
2. **Continue Luna:** it is making observable progress, its claims match visible
   evidence, and the remaining task fits the available capabilities and budget.
3. **Bounded clarification:** a checkpoint is missing or the task wording was
   misunderstood, with no evidence falsification. Give one explicit correction
   and small follow-up ceiling; preserve the first failure and follow-up result.
4. **Escalate the unresolved question:** repeated unproductive action choices,
   contradictory findings it cannot resolve, repeated unsupported completion
   claims, or failure to produce an actionable reproduction after clarification.
   Preserve the exact build, save, action/observation history and uncertainties.
   Astra investigates the gap; do not rerun the whole game automatically.
5. **Stop as incomplete:** budget exhausted or required capability absent.
   Never convert missing observation into a pass, silently extend a budget,
   or attribute an Astra-assisted finish to Luna alone.

"Two failed approaches" is a provisional review trigger, not a validated
capability threshold. A game bug may block both models; identifying that block
accurately is useful performance, not failure to win the game.

For an assigned decision, Luna's explicit `uncertain` or `blocked` signal is
sufficient to request Astra review of the unresolved question once required tools
are available. Do not make Luna repeatedly justify its uncertainty or continue
until it invents certainty. Conversely, `clear` is not sufficient for acceptance:
check required observations and audit the evidence. A reproduced game defect
requests repair, not escalation to find a reviewer who will pass it.

## Can we rely only on Luna's own signal?

Not yet. The first full run had a **silent miss**: it claimed the full ending
without observing the final panel, and only corrected that after external audit.
Later scoped checks reported uncertainty appropriately. That is promising, but
the same model can both defer correctly and miss a reason to defer.

The subsequent live traversal probe returned unresolved appropriately, but its
audited 18 inputs exceeded a 15-input ceiling and replaced an initial claim of
12. This independently demonstrates the need for tool-recorded counts and hard
execution limits. Useful uncertainty reporting does not imply reliable accounting.

During calibration, audit all `clear` results against assigned checkpoints and
retain representative review of the rendered experience. Once enough diverse
task-specific evidence exists, routine low-impact checks may use deterministic
coverage checks plus sampled independent audits. Do not silently switch to
self-signals-only operation, and keep broad creative direction with Astra.

Measure four outcomes separately: correct supported answer, useful uncertainty
signal, unnecessary fallback, and unsupported confidence/silent miss. Evaluate
missed issues among the results Luna marks clear, not merely how often it says
it is uncertain. Also measure issue-detection recall and time/cost including
fallbacks. A high deferral rate alone is not reliability; a low deferral rate may
hide missed problems. The current small, prompted sample does not estimate these
rates. Freeze the prompt/harness and use blinded known-outcome cases, including
clean controls and unresolved cases, before selecting a risk-based audit rate.

## What to measure before expanding Luna's role

For every task class record: independently verified outcome, unsupported claims,
missed required checkpoints, reproducible findings, false positives, deliberate
vs accidental mistakes, recovery, budget/stop compliance, extra audit or repair
work, tool failures and unassessed dimensions. Measure actual token/tool cost and
latency when available, including follow-up and Astra audit. Input count is not
a cost estimate. Prefer cost per **accepted task**, not cost per initial run.

Keep a held-out set of unrelated layouts/mechanics. Include clean cases as well
as known defects, ambiguous feedback, transient loading and inaccessible media.
Keep defect locations/solutions away from the player. Blind or counterbalance
model order for adjudication; use user/human labels for subjective quality.
One root Astra verdict is not automatic ground truth.

The next evaluation set should separately test:

| Task class | Observable success | Failure signal |
|---|---|---|
| Guided journey | Each assigned checkpoint observed | Declares completion from nearby status text |
| Unfamiliar navigation | Reaches a visible target through GUI, explaining obstacles | Blind repeated inputs or hidden-state shortcuts |
| Recovery | Recognizes feedback and tries a reasoned alternative | Repeats unchanged action without new information |
| Defect discovery | Reproducible finding or bounded no-finding report | Confident unsupported judgment or missed seeded blocker |
| Calibration | Marks unsupported audio/motion/evidence unknown | Claims to hear or traverse from text/stills alone |
| Stopping | Stops after success or at maximum budget | Padding, unlimited retries, unlabelled post-budget work |

No automatic broad promotion is justified by the current sample. First repeat
corrected assignments across at least two unrelated task layouts and multiple
fresh trials; choose acceptance thresholds based on consequence of missed issues,
not a convenient overall completion average. Synthetic contract tests can prove
the router obeys its rules; they cannot prove a model is good at playing.

## Evidence and implementation boundary

The input guard and explicit native assignment/v2 receipt integration are now
implemented; see `NATIVE-PLAY-EXECUTION-CONTRACT.md`. They have controlled-callback
tests plus a two-input manual supervised CUA run; see
`experiments/20260920-luna-supervised-guard.md`. This is not autonomous dispatch
or enforced tool isolation, and the guided success is not a reliability rate. The policy
recommendation helper below still does not dispatch models or enforce tool access.

- [Full GUI experiment](experiments/20260919-gui-comparison.md).
- [Routing calibration](experiments/20260920-luna-routing-calibration.md):
  corrected open critique, root corroboration and synthetic claim-audit protocol.
- [Native player/critic requirements](NATIVE-COMPUTER-USE-CRITICS.md).
- Existing `critic_execution_receipt.py` attests supplied context/evidence;
  it does not enforce these live stopping rules or verify UI execution. This
  policy is applied manually in local experiments, not a deployed model router.
- `tools/critic_task_policy.py` now provides a pure offline recommendation:
  creative direction → Astra; bounded tasks → Luna; unresolved Luna result →
  Astra; missing capabilities → setup repair; missing evidence/confident report
  → audit; audited defect → game repair. Its trusted capability/checkpoint/audit
  inputs must come from a harness or independent reviewer, never Luna's own
  report. Tests validate those decisions, not model honesty or GUI execution.
  It does not dispatch models, allocate budgets, replace sealed receipts, or
  authorize release. An Astra uncertainty result remains unresolved.
- The next integration is a small extension of that boundary: capability
  preflight, distinct input/observation counts, checkpoint evidence, stop reason
  and escalation handoff. Preserve future Terminal PM ownership of dispatch.

Method guidance: OpenAI recommends task-specific evaluations, logging and human
calibration rather than relying on general benchmarks or impressions. See
[Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices).
The [Luna model documentation](https://developers.openai.com/api/docs/models/gpt-5.6-luna)
lists computer-use support; that availability does not validate performance on
our particular tasks or guarantee access in every executor.


## Additional relay calibration — 20 September 2026

In a fresh isolated native GUI relay task, Luna completed note selection,
predictions, feedback and Level 1 completion. It nevertheless stopped before the
separately required ending and described a reload before any prediction as the
requested committed-prediction resume check. It also initially confused an INPUT
prefix with OUTPUT. Root audited and requested a corrected report; preserve the
original claims as misses. Follow-up could not run because its browser provider
was unavailable, which is a separate setup limitation.

This is another small diagnostic, not a reliability estimate. A confident report
must still be checked against required checkpoints and observed evidence. Route
whole-experience creative judgment to Astra; bounded Luna execution remains
subject to independent coverage and claim audit. Do not promote self-signaled
uncertainty to the sole fallback condition.
