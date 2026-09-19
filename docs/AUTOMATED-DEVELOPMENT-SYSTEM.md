# VibeLearn automated development system — Terminal PM Agent orchestration contract

**Status:** approved target architecture / decoupled integration handoff  
**Date:** 19 September 2026  
**VibeLearn critic candidate:** frozen at `471de882a01690fa50ac39455ad603fffd39cfdc`; exact run `35440122451` passed all seven suites plus review-index, and critic evidence is retained for 30 days. Deployed Render runtime remains the rejected `ad14c5aced6cf053c7617dfb03245506e1e9dad5` per `docs/STATE.md`.
**Phase 0 implementation proof:** PR #12 was squash-merged as `40ec93f8b04cc7a3d88366d9195ec50555d9698f`; its exact main run `35398208739` passed all seven VibeLearn suites plus review-index/capsule materialization. The current repaired critic candidate `471de882...` contains that adapter unchanged; its runtime repairs do not expand integration scope.
**Terminal PM Agent status checked:** connected private repository `Desmic/terminal-agent-20260223023455` at `acc3a6d3580d8ea0715ff807434f973eff4f90d0`, checkpoint updated 12 September 2026. Its authoritative checkpoint says `gate_1_5: open`, `live_run_authorized: false`, ER-1 exhaustive review active/incomplete, and explicitly states the checkpoint is navigation/status only and never live-run authorization. Treat it as an evolving external orchestrator, not a stable library to absorb.

This document defines how VibeLearn should integrate with the evolving Terminal PM Agent through a narrow, versioned orchestration contract so VibeLearn can become a highly automated product-development and game-generation system without copying a moving internal architecture.

It supersedes older statements that orchestration is only indefinite future work. It does **not** authorize a physical codebase merge, donor-module extraction, broad rewrite, role explosion, autonomous production deployment, or abandoning the current VibeLearn product-quality gate. The integration must start at the contract boundary and grow only when a clear safety/correctness requirement or evidence from real runs justifies more machinery.

Read this with `AGENTS.md`, `CODEX.md`, `docs/STATE.md`, `docs/GAME-CREATION-PLATFORM.md`, `docs/CRITIC-POLICY.md`, `docs/ART-WORLD-DIRECTION-CRITIC.md` and the current user-review/evidence records.

---

## 1. Goal

Turn VibeLearn from a manually steered development workflow into an automated system that can:

1. take a bounded product/game task;
2. have economical replaceable workers implement or investigate it;
3. have an independent reviewer challenge the result and **implicitly prove or disprove its own findings**;
4. accept/reject based on evidence rather than model opinion;
5. evaluate the actual learner/player outcome, not only the code;
6. preserve enough lineage to explain why a bad result escaped;
7. turn escaped failures into verified product and/or system improvements;
8. use expensive frontier intelligence only when cheap workers cannot resolve an important ambiguity.

The system is not an agent hierarchy whose highest model declares truth. It is an **evidence-producing engineering system in which LLMs are search heuristics**.

### 1.1 Current Terminal PM Agent status and architectural consequence

The Terminal PM Agent is not a frozen dependency today. Its exact 12 September
checkpoint at `acc3a6d3580d8ea0715ff807434f973eff4f90d0` explicitly says:

- Gate 1.5 is open;
- `live_run_authorized=false`;
- ER-1 exhaustive review is active and incomplete;
- the current checkpoint is navigation/engineering status only and is **never**
  live-run authorization;
- its next action is its own durable per-hop benchmark admission/transport seam,
  with public/synthetic fixture qualification before any live admission;
- no Gate run, private upload, worker effect or credential change is authorized
  by the current benchmark approval;
- context/evidence/recovery/reconciliation and production-readiness boundaries
  remain active work.

Therefore VibeLearn must **not fork or copy its orchestration internals now**.

The near-term relationship is:

```text
VibeLearn                         Terminal PM Agent
---------                         -----------------
domain goal/spec        ----->    generic orchestration
product constraints     adapter   workers/reviewers
evaluation profiles     contract  sessions/tools
build/outcome identity   <-----    evidence/run state
human/model feedback              recovery/retries
```

VibeLearn should be able to survive substantial Terminal PM Agent refactors as long as the adapter contract remains compatible.

This also creates a useful co-evolution loop: VibeLearn supplies real product-development and human-outcome failures; Terminal PM Agent can improve its generic supervision using those failures without VibeLearn inheriting every internal redesign.


---

## 2. Design rule: complexity must earn its place

Do not add a permanent agent role, service, scoring model, taxonomy, trust engine or orchestration layer merely because it sounds useful.

A complexity increase is justified only when at least one of these is true:

1. **Architectural necessity:** without it, a clear safety/correctness invariant cannot be enforced; or
2. **Run evidence:** real executions show a recurring failure, cost, latency or diagnosability problem that the simpler design cannot handle adequately.

Prefer implicit behavior inside existing roles over explicit pipeline stages.

Examples:

- Reviewer notices a race condition -> reviewer constructs a valid interleaving/reproducer and runs it. Do **not** spawn a separate “proof agent” by default.
- Reviewer suspects an auth bypass -> reviewer attempts the unauthorized request. Do **not** add a separate security-test stage solely for that finding.
- A deterministic test settles a dispute -> stop. Do **not** ask more models to vote.
- Story, art/world, gameplay and learning remain independent VibeLearn gates, but they are **review profiles on one reviewer runtime**, not four different orchestration architectures.

Default topology:

```text
1 worker -> 1 reviewer -> evidence -> accept / repair
```

Fan out only when risk or observed failure justifies it.

---

## 3. Core architecture

The architectural boundary is between **VibeLearn domain/outcome ownership** and the **external orchestrator**.

```text
                  VIBELEARN
     goal/spec · product constraints · evaluators
             build identity · outcome feedback
                         |
                         v
              ORCHESTRATOR ADAPTER
       small · versioned · replaceable · typed
                         |
                         v
              TERMINAL PM AGENT
              (evolves separately)
       state · context · routing · budgets
       workers · reviewers · retries · recovery
                         |
                         v
                SANDBOXED TOOL PLANE
       repo · shell · tests · browser · build
                         |
                         v
                 ARTIFACT + EVIDENCE
                         |
                         v
              VIBELEARN EVALUATION
       CI · critic profiles · playtest · human
                         |
                         v
                      OUTCOME
                         |
                 bad / surprising?
                         |
                         v
                     INCIDENT
                         |
             diagnosis + experiments
                         |
        product change / system hypothesis
                         |
                         v
                     NEW RUN
```

VibeLearn owns the product-specific truth surface:

- learning/game goals and constraints;
- story/art/gameplay/learning evaluator contracts;
- exact build/runtime identity;
- learner/player outcome evidence;
- human feedback and acceptance;
- product incidents.

Terminal PM Agent owns generic engineering orchestration:

- worker/reviewer dispatch;
- session/tool execution;
- context/recovery/retry mechanics;
- generic evidence/receipts;
- provider/model routing;
- generic run control.

Do not duplicate Terminal PM Agent internals inside VibeLearn while they are still moving.

A single versioned run/evidence lineage should connect both systems through references. VibeLearn does not need to store every internal orchestrator detail; it needs enough stable provenance to identify the exact external run, artifacts, evidence and outcome.

---

## 4. Intelligent roles

### 4.0 Adapter contract

The detailed evolving contract is in `docs/ORCHESTRATOR-ADAPTER-CONTRACT.md`. That document owns capability negotiation, versioning, idempotency/unknown-effect reconciliation, opaque cross-system refs, worker/reviewer requirements, evidence/candidate semantics and first contract fixtures.

Start with the smallest useful interface. Exact names may change, but the semantics should remain narrow:

```text
start_run(goal_ref, repo_ref, constraints, budget) -> run_id
get_run(run_id) -> status + artifact/evidence refs
submit_outcome(run_id, build_ref, observation) -> outcome_ref
cancel_run(run_id) -> acknowledged/unknown/result
```

Add another operation only when a real workflow cannot be expressed safely with these primitives.

The adapter must preserve unknown outcomes. A timeout or lost response is not permission to assume an action failed and dispatch it again.


### 4.1 Orchestrator

The orchestrator is the external Terminal PM Agent (or a future compatible replacement), not a VibeLearn-internal subsystem. It is not another senior engineer that opines on domain correctness. It owns:

- task/run state;
- relevant context assembly;
- worker/reviewer dispatch;
- model/provider budgets;
- tool permissions;
- artifact and evidence lineage;
- retries/recovery;
- unresolved-question state;
- escalation;
- stopping conditions.

It should be **reasoning-light but evidence-aware**.

It must distinguish at minimum:

- stated requirement/spec;
- assumption;
- model claim;
- observed tool/runtime result;
- human/model outcome feedback;
- unresolved hypothesis.

It must not turn “two models agree” into truth when a test or measurement can settle the question.

### 4.2 Worker

A worker receives a goal, bounded context and tools and owns the task end-to-end:

```text
inspect -> reason -> modify/investigate -> test -> debug -> return artifact + evidence
```

Do not split implementation, debugging and ordinary test execution into permanent separate roles unless runs later prove that specialization improves results.

Default workers should be economical V4.1-class or equivalent models. Frontier closed models are not normal workers.

Worker output should expose only useful operational state, not hidden chain-of-thought:

```yaml
result: <artifact/change/conclusion>
evidence:
  - <test/log/measurement/source/artifact refs>
assumptions:
  - <material assumption>
known_uncertainties:
  - <remaining uncertainty>
```

### 4.3 Reviewer

Reviewer means:

> **Attempt to falsify the worker result.**

Proof is implicit in review.

For every substantive criticism, the reviewer must:

1. identify the expected behavior/invariant;
2. construct the strongest feasible falsifiable scenario;
3. check that the scenario itself is valid;
4. execute it when possible;
5. classify the finding as `proven`, `disproven` or `unresolved`;
6. if unresolved, state what evidence would discriminate the remaining hypotheses.

Example:

```text
Claim: lease renewal can produce two owners.

Reviewer behavior:
- identify concrete interleaving;
- verify the interleaving is legal under the API/transaction contract;
- create barrier/stress/replay test;
- run it;
- attach result.

If both renewals succeed -> PROVEN.
If the suspected schedule cannot occur -> DISPROVEN.
If environment/contracts prevent a valid experiment -> UNRESOLVED with exact missing evidence.
```

A reviewer may validly conclude “no defect found.” Do not reward bug count or force criticism.

A reviewer must not merely say “there may be a race condition” and stop.

---

## 5. VibeLearn critics are reviewer profiles, not role explosion

VibeLearn currently needs separate story, art/world-direction, gameplay and learning/transfer judgment. Keep those independent gates because failure in one discipline must not be averaged away by strength in another.

Implement them as **profiles/configurations of the reviewer runtime**:

```text
reviewer(profile=story)
reviewer(profile=art_world)
reviewer(profile=gameplay)
reviewer(profile=learning)
```

Each profile has its own domain contract and evidence sources, but shares:

- run model;
- tool/sandbox model;
- evidence schema;
- finding states;
- provenance;
- budget policy;
- incident linkage.

Do not create four independent supervisor systems.

---

## 6. Evidence, not votes

The system should try to convert claims into artifacts that can falsify one another.

Bad:

```text
Worker A: implementation is correct.
Reviewer B: I agree.
```

Better:

```text
Worker -> implementation
Reviewer -> invariant + adversarial case
Runtime -> executes case
Result -> reproducible evidence
```

Do not resolve homogeneous-model disagreement by majority vote. Same-family model errors are correlated.

If A says X and B says Y, prefer:

```text
What experiment distinguishes X from Y?
-> run it
```

Only add another cheap model when the evidence itself remains disputed or another independent attempt is materially useful.

---

## 7. Minimal run/evidence model

Start small. Do not build a numerical evidence-trust engine.

### 7.1 Run

Every substantial automated task gets a `run_id`.

Minimum metadata:

```yaml
run_id:
parent_run_id: optional
goal_ref:
spec_version:
repo_revision:
worktree_or_branch:
worker_model:
worker_prompt_version:
reviewer_model:
reviewer_profile:
reviewer_prompt_version:
orchestrator_version:
tool_harness_version:
environment_ref:
budget:
artifacts: []
evidence: []
status:
started_at:
finished_at:
```

### 7.2 Evidence

Preserve type and provenance rather than inventing a precise trust score.

```yaml
evidence_id:
run_id:
type: compiler_result | runtime_test | browser_trace | screenshot | measurement | source | model_assessment | human_feedback | telemetry
producer:
artifact_or_command_ref:
repo_revision:
environment_ref:
observed_result:
timestamp:
reproducibility:
assumptions: []
```

For commands/tests also retain the exact command, exit state, relevant captured-output hash/reference and environment identity.

### 7.3 Finding

```yaml
finding_id:
review_run_id:
claim:
expected_behavior_or_invariant:
status: proven | disproven | unresolved
evidence_refs: []
next_discriminating_evidence: optional
impact:
```

### 7.4 Outcome / feedback

Every outcome must point back to the exact artifact/build/run.

```yaml
outcome_id:
artifact_or_build_ref:
run_id:
source: human | luna | astra | critic | telemetry | production
session_ref: optional
timestamp_or_range:
observation:
related_evidence_refs: []
```

Do not treat human or model feedback as infallible ground truth; preserve the source and context so patterns can be learned later.

### 7.5 Incident

An incident is created for a materially bad or surprising outcome.

Keep it simple initially:

```yaml
incident_id:
outcome_ref:
originating_run_id:
problem_summary:
diagnosis_summary:
escape_summary:
evidence_refs: []
product_change_ref: optional
system_change_ref: optional
replay_result_ref: optional
status:
```

Do not implement a large failure taxonomy until enough real incidents exist for categories to emerge empirically.

---

## 8. Outcome evidence is distinct from implementation evidence

A build may be technically correct and still fail the product goal.

Examples:

```text
tutorial_triggered = true
```

does not prove:

```text
a first-time player understood what to do
```

Preserve both classes:

### Implementation evidence

- compile/build results;
- unit/integration/E2E tests;
- invariants;
- migrations;
- API/contract checks;
- performance/resource measurements.

### Outcome evidence

- actual gameplay traces;
- cold-start comprehension;
- screenshots/keyframes;
- model playtesting;
- human product review;
- player behavior/abandonment;
- progression and learning-transfer results.

VibeLearn acceptance must consider both.

---

## 9. VibeLearn gameplay/product evaluation

The automated development system must evaluate the actual experience, not only source code.

Current product journey remains:

`entry/auth -> prologue -> separate tutorial -> Level 1 -> recovery/transfer -> payoff -> review`.

The present proof-track requirements and user gate remain authoritative.

### 9.1 Deterministic checks first

Use deterministic assertions wherever possible:

- build/CI;
- PlayCanvas startup;
- required 3D route;
- no 2D gameplay fallback;
- state transitions;
- tutorial/mission boundaries;
- input registration;
- save/reload;
- accessibility behaviors;
- explicit regression cases;
- console/network failures;
- known spatial or UI invariants where measurable.

### 9.2 Visual/interactive evaluation

For actual browser/game inspection, treat computer-use evaluators as an **outcome-evaluation adapter**, not the default code-worker model.

Cost-oriented path:

```text
deterministic automation
        |
        v
GPT-5.6 Luna or equivalent cheap visual/computer evaluator
        |
     ambiguity/failure requiring stronger GUI reasoning
        |
        v
GPT-6 Astra low
```

Astra is not used merely because the evaluator disagrees with a test. Preserve the current screenshot/state/action history and escalate only the unresolved part.

### 9.3 Human review

The current user's final product judgment remains a hard gate for the private proof track.

Human feedback must be linked to:

- exact build/runtime SHA;
- session when available;
- approximate timestamp/scene;
- relevant screenshots/trace.

This makes “the tutorial is confusing” diagnosable rather than a detached comment.

---

## 10. When to use Astra for worker-system problems

Astra is not a normal worker, reviewer or final authority.

Use it primarily as a **hypothesis / synthesis / discriminating-experiment generator** when an important question remains unresolved after cheap evidence-producing attempts.

Escalate only when:

1. the question materially affects correctness/product outcome/safety; **and**
2. deterministic evidence has not resolved it; **and**
3. cheap workers have attempted reasonable falsification/investigation; **and**
4. either:
   - evidence is materially contradictory;
   - workers cannot construct a valid discriminating experiment;
   - the problem requires synthesis across many evidence sources;
   - repeated cheap attempts fail to build a coherent system model.

Do not escalate merely because a model reports low confidence.

Astra input should be a compact evidence packet:

```text
goal
relevant invariants/contracts
minimal implementation excerpts
observations
experiments and results
worker/reviewer claims
contradictions
failed attempts
exact unresolved question
```

Desired Astra output:

```text
plausible hypotheses
missing assumptions/variables
evidence supporting/conflicting with each
cheapest discriminating experiment
missing information if no experiment is yet possible
```

Then stop the expensive call.

Cheap workers operationalize the hypothesis and run the experiment.

Principle:

> **Escalate reasoning upward; push verification back downward.**

Astra proposes. Workers operationalize. Reality decides.

---

## 11. Failure tracing and system improvement

The system must answer not only:

> Why is the product wrong?

but also:

> Why did our pipeline believe it was acceptable?

For every important escaped failure, diagnose two things:

### Product cause

What made the artifact/product wrong?

### Escape cause

Why did the current automation fail to detect or prevent it?

Examples of useful escape explanations:

- missing requirement;
- missing context in worker/reviewer packet;
- invalid reviewer-generated test;
- reviewer never exercised a novice-player path;
- evaluator looked at DOM state but not rendered canvas;
- tooling could not reproduce the environment;
- orchestration retried an unknown-outcome action;
- model capability limit.

Do not assign blame automatically from trace order. A trace proves lineage, not causality.

---

## 12. System changes must themselves be tested

Do not automatically mutate production prompts/policies after an incident.

Bad loop:

```text
model mistake
-> model diagnoses itself
-> model rewrites governing prompt
-> new mistake
-> repeat
```

Instead, a system change is an ordinary versioned artifact:

```text
escaped failure
      |
      v
proposed system change
      |
      v
replay original incident
      |
      v
small regression set
      |
      v
compare quality / false positives / cost / latency
      |
      v
adopt or reject
```

At minimum, a proposed reviewer/orchestrator change caused by an incident must catch the incident it claims to solve before adoption.

Do not let prompts grow into a historical graveyard of one-off rules. Prefer general contracts/invariants; remove or consolidate obsolete guidance.

---

## 13. Failure corpus and agent regression

Over time, escaped failures become a valuable evaluation corpus.

Each useful case should retain:

- original goal/context;
- bad artifact/build;
- feedback/outcome;
- product cause;
- escape cause;
- final fix;
- regression guard;
- relevant run/evidence refs.

Use the corpus to compare:

- new model versions;
- worker/reviewer prompt changes;
- orchestrator changes;
- context-selection changes;
- tool/harness changes.

Measure whether the new system catches historical escapes while tracking cost and false positives.

Do not let historical failures become the definition of correctness. The corpus is a regression suite, not the complete product objective. If later tuning begins to overfit it, introduce held-out/new scenarios **only when runs show this problem is real**.

---

## 14. Observability without recording the universe

Instrumentation can create storage, latency, privacy and behavior-distortion costs.

Use progressive observability:

### Normal successful run

Keep compact structured metadata, important tool receipts, artifact hashes/refs and acceptance evidence.

### Failed/high-risk run

Retain richer relevant logs, traces, screenshots/keyframes, session history and environment information.

### Hard-to-reproduce incident

Enable deeper instrumentation on the next reproduction attempt.

Do not record full video/full transcripts/every state forever by default.

For interactive game sessions, useful trace fields may include:

- build SHA;
- device/viewport;
- feature flags;
- random seed where applicable;
- player input/action sequence;
- important game/mission state transitions;
- console/network errors;
- performance metrics;
- screenshots/keyframes around failure;
- evaluator/human observation timestamps.

---

## 15. Nondeterminism and correlated model failure

LLM review is nondeterministic. Single-shot review can miss defects.

Do **not** solve this by always running many agents.

Use adaptive redundancy:

- low-risk ordinary change -> one worker + one reviewer;
- high-risk areas such as auth, persistence, migrations, concurrency, destructive operations -> independent second review attempt when justified;
- unresolved evidence -> targeted additional cheap worker;
- repeated unresolved high-impact ambiguity -> Astra hypothesis generation.

Independent reviewers should start from separate contexts and should not see each other's reasoning before their own first pass, reducing anchoring.

Model diversity is optional escalation, not default infrastructure. Add an alternate worker/reviewer model only if runs show correlated misses are materially hurting the system.

---

## 16. Cost and efficiency rules

Default system economics:

1. V4.1-class/equivalent models perform normal work and review.
2. One worker + one reviewer is the default.
3. Additional workers/reviewers are conditional.
4. Frontier closed models are rare escalation/evaluation tools.
5. Deterministic tools settle questions whenever possible.
6. Do not reload the whole repository into every model call.

Use **context capsules**:

- goal/spec;
- relevant files/interfaces;
- relevant invariants;
- current diff/artifact;
- current evidence;
- exact unresolved question.

Allow agents to fetch more context through tools when needed.

Track per-run model/tool cost or at least tokens/call counts from the start. The Terminal PM Agent's own current review notes that complete spend reservation/reconciliation remains unfinished; do not import unfinished cost-accounting machinery as if it were a solved subsystem. Start with simple hard call/token/budget limits and add richer accounting only when required.

---

## 17. Security model

The automation system executes untrusted model-generated behavior. Prompts are not a security boundary.

### 17.1 Capability-scoped tools

Prefer:

```text
run_tests()
read_logs()
create_worktree()
query_disposable_db()
```

over giving agents raw credentials.

Workers should not receive production secrets unless a narrowly scoped tool absolutely requires them.

### 17.2 Sandbox generated code/tests

Generated code and tests are untrusted.

Execute them in isolated worktrees/containers/process sandboxes with:

- bounded filesystem access;
- no host secret access;
- restricted network where practical;
- CPU/memory/time limits;
- no Docker socket/host-control shortcuts;
- disposable test databases.

### 17.3 Separate production mutation boundary

Reasoning/execution and production release are separate permission planes.

Initial automation should create reviewed artifacts/branches/commits and evidence. It should **not** automatically mutate production or push destructive changes merely because reviewer output says “pass.”

Broader autonomous release can be enabled later only after real runs justify the policy.

### 17.4 Treat repository/log/web content as untrusted data

Prompt injection can enter through:

- README/comments/issues;
- web pages;
- package metadata;
- logs;
- user-generated content;
- prior agent artifacts.

The run/evidence model must distinguish trusted control instructions from observed untrusted data.

Artifacts passed between workers should be typed/minimal where possible. Prefer diff + task + evidence refs over forwarding another model's entire free-form transcript.

### 17.5 Immutable-ish evidence

Agents may append new evidence; they should not rewrite historical observations.

If test X failed on commit A and passes on commit B, preserve both events.

---

## 18. Relationship to Terminal PM Agent while it is under development

The Terminal PM Agent is currently an **external evolving orchestrator and reference system**, not a donor package to extract from.

### What VibeLearn may rely on now

Rely on architectural invariants and observable contract behavior, not module layout:

- process existence is not proof of progress;
- helper exit is not worker exit;
- exit zero is not semantic success;
- worker result is not completed user outcome;
- captured evidence is not proof of product improvement;
- unknown launch/action outcomes must be reconciled before retry;
- controller/restart recovery must not duplicate work;
- evidence must bind to the exact candidate/runtime/context;
- generated execution requires bounded authority.

These are stable design lessons even if Terminal PM Agent refactors its internals.

### What VibeLearn must not do yet

Do **not**:

- copy Terminal PM Agent runtime/session/verifier modules into VibeLearn;
- fork its persistence/recovery implementation;
- mirror its current verifier batch architecture;
- make VibeLearn depend on private internal module names;
- treat its current head as a released SDK;
- use its unfinished spend, provenance or Gate machinery as if generally solved;
- block Terminal PM Agent refactoring because VibeLearn copied internal code.

### Co-evolution model

VibeLearn should become a real product proving ground for the orchestrator:

```text
Terminal PM Agent
       |
       v
VibeLearn development run
       |
       v
real product outcome / human feedback
       |
       v
incident + evidence
       |
       +----> VibeLearn product improvement
       |
       +----> Terminal PM Agent supervision improvement
```

A VibeLearn failure such as “tests passed but a first-time player still cannot understand the level” is valuable evidence about both the product and the supervisor/evaluator system.

### Deeper-integration gate

Do not require Terminal PM Agent to be “finished.” Instead, consider deeper code-level reuse only after the relevant boundary is demonstrably stable.

Current indicative conditions are:

- ER-1 exhaustive review is complete enough to close the boundaries VibeLearn would depend on;
- Gate 1.5 or its successor demonstrates credible unattended/self-hosted supervision;
- restart/recovery/evidence lineage works across the intended integration path;
- unknown outcomes/retries are handled without duplicate effects;
- there is no known near-term architectural rewrite of the specific boundary VibeLearn would embed.

Re-evaluate these conditions against the Terminal PM Agent's current status at integration time. They are a decision gate, not a new subsystem.

---

## 19. Suggested VibeLearn code boundary

Keep the VibeLearn-side integration deliberately thin.

A likely starting shape is:

```text
automation/
  orchestrator_adapter.*
  evaluation.*
  outcome.*
  incident.*
```

Responsibilities:

- `orchestrator_adapter` translates VibeLearn goals/constraints to the external orchestrator contract and maps run/artifact/evidence refs back;
- `evaluation` maps existing VibeLearn CI/playtest/critic contracts to outcome evidence;
- `outcome` links human/model/telemetry feedback to exact builds and runs;
- `incident` records material escapes and their product/escape diagnosis.

Do **not** create VibeLearn copies of generic session management, provider routing, worktree lifecycle, retry/recovery or verifier scheduling unless real integration evidence proves the external contract cannot provide what VibeLearn requires.

Even this directory split is optional. Start with fewer modules if the first slice remains clearer that way.

---

## 20. First vertical slice

Because Terminal PM Agent currently disallows live runs, the first slice is **contract-first**, not a production orchestration run.

Prove locally that VibeLearn can express one real bounded development task through the adapter contract and can consume a representative external run result without knowing orchestrator internals.

First slice:

```text
real VibeLearn task/spec
  -> adapter request
  -> fixture/stubbed orchestrator run state
  -> artifact + evidence references
  -> VibeLearn evaluation
  -> accept/repair decision
  -> outcome/incident linkage
```

The fixture should model at least:

- successful completion;
- reviewer-proven defect;
- unresolved finding;
- unknown action/session outcome;
- resumed/reconciled outcome.

Do not duplicate Terminal PM Agent logic to make the fixture realistic. The fixture validates the **boundary contract**.

When Terminal PM Agent itself authorizes a suitable live/self-hosted run, replace the fixture with a real bounded VibeLearn task through the same adapter.

The first live integration should still use the normal architecture:

```text
bounded VibeLearn task
  -> Terminal PM Agent
  -> economical worker
  -> independent reviewer
       -> criticism implicitly attempts valid proof/reproduction
  -> deterministic evidence
  -> VibeLearn product evaluation
  -> accept / repair
```

Do **not** require Astra. Astra is exercised only when a real unresolved ambiguity justifies it.

---

## 21. Phased integration plan

### Phase 0 — define and freeze only the contract

**Status: complete and merged on `main` as `40ec93f8b04cc7a3d88366d9195ec50555d9698f`.
The current game-review candidate `471de882...` already contains the adapter.**

Implemented/verified:
- current VibeLearn baseline and exact Terminal PM checkpoint recorded;
- minimal v0.1 adapter request/result semantics;
- capability negotiation for fresh dispatch;
- restart-safe idempotency reconciliation bound to a trusted intent digest;
- unknown-effect handling that reconciles before retry and never assumes failure;
- typed opaque run/candidate/build/artifact refs;
- exact candidate/evidence/review identity with ambiguous candidates and duplicate
  required reviews failing closed;
- required review semantics deriving their hard reviewer capabilities rather than
  relying on a duplicated caller hint;
- VibeLearn product acceptance remaining independent of orchestrator completion;
- outcome -> incident -> normal child repair-run lineage;
- serialized fixtures for success, reviewer-proven defect, unresolved review,
  worker replacement/recovery, budget/capability refusal and product rejection;
- no Terminal PM internal modules copied into VibeLearn;
- no live Terminal PM dispatch.

Historical pre-merge verification: `dff84f661fc388b1c8999307f4fe312d6fc9ef0b`,
GitHub Actions `35396734182`. Merged verification: `40ec93f8...`, run
`35398208739`; all seven suites + review-index/capsule materialization passed.

**Exit: satisfied for the fixture-only contract boundary.** VibeLearn can test
the integration semantics without a live orchestrator. Phase 1 remains blocked
by Terminal PM Agent's own `live_run_authorized=false` checkpoint, not by a
missing VibeLearn Phase 0 adapter.

### Phase 1 — first authorized external run

Only when Terminal PM Agent's own current policy permits it:

- invoke one bounded real VibeLearn task through the adapter;
- preserve exact external orchestrator revision/config in private run provenance;
- consume artifact/evidence refs;
- run VibeLearn's own product-specific evaluation;
- verify retry/reconciliation behavior if an external outcome is unknown.

**Exit:** one real VibeLearn task crosses the external boundary end-to-end without VibeLearn depending on Terminal PM Agent internals.

### Phase 2 — outcome and critic integration

Connect existing VibeLearn evidence:

- build/test suites;
- browser/playtest artifacts;
- story/art-world/gameplay/learning reviewer profiles;
- exact build/runtime identity;
- user-review linkage.

Cheap computer-use evaluation is added only where the rendered experience matters.

**Exit:** a candidate cannot be called accepted merely because engineering checks pass.

### Phase 3 — incident/escape loop

Add:

- outcome -> incident linkage;
- diagnosis/escape summaries;
- reproduction/replay;
- product fix;
- optional orchestrator/system hypothesis;
- replay of the original failure before a system-change proposal is adopted.

**Exit:** one real or seeded escaped failure is traceable across VibeLearn and the external orchestrator boundary.

### Phase 4 — deeper coupling only if evidence justifies it

Possible later moves:

- richer adapter operations;
- stronger bidirectional incident/evidence exchange;
- risk-based second reviewers;
- model diversity;
- Astra evidence-packet escalation;
- automated failure-corpus replay;
- selective shared libraries or module extraction **only after the relevant Terminal PM Agent boundary is stable and duplication is demonstrably cheaper than keeping it external**;
- more autonomous release.

Each addition needs an obvious invariant or observed run evidence.

---

## 22. First-slice acceptance criteria

The contract-first slice is accepted only when:

1. a real VibeLearn task/spec can be serialized into the adapter request;
2. VibeLearn does not import or depend on Terminal PM Agent internal modules;
3. external `run_id`, artifact refs and evidence refs can be persisted and resolved;
4. unknown external outcomes remain `unknown` until reconciled;
5. a fixture can demonstrate worker success, reviewer-proven failure, unresolved review and recovered/resumed outcome;
6. VibeLearn evaluation can accept/reject the returned artifact independently of the orchestrator's own success status;
7. outcome/feedback can point to the exact VibeLearn build and external run;
8. an incident can be created without reconstructing history from chat transcripts;
9. credentials/secrets are not copied across the boundary as model-visible context;
10. model/tool budgets are representable in the request/record even if the external orchestrator's richer spend ledger is still evolving;
11. current VibeLearn product tests/gates remain unchanged or any baseline failure is explicitly preserved;
12. no live Terminal PM Agent run is dispatched while its own current policy says live runs are unauthorized.

The later **first live integration** additionally requires:

- bounded worker permissions;
- isolated generated execution;
- independent reviewer context;
- proof/reproduction for substantive reviewer defect claims;
- exact candidate/environment provenance;
- no duplicate retry after unknown effect;
- no automated production deployment/policy rewrite.

---

## 23. Non-negotiable invariants

1. **Everything important is versioned.**  
   Goal/spec, code, prompts/configs, model identity, harness/evaluator and build/runtime identity must be recoverable.

2. **Every accepted artifact points to acceptance evidence.**

3. **Every material outcome points back to the exact artifact/run that produced it.**

4. **Historical evidence is not silently rewritten.**

5. **A system change caused by a failure must be replayed against that failure before adoption.**

6. **No architectural complexity is added without a clear invariant or evidence from real runs that the simpler design is insufficient.**

7. **VibeLearn must not depend on moving Terminal PM Agent internals when a stable adapter reference is sufficient.**

---

## 24. Stopping and escalation rules

A normal run stops when:

- the bounded acceptance conditions are met;
- required deterministic checks pass;
- no proven blocking finding remains;
- no unresolved high-impact finding remains;
- required VibeLearn evaluation gate for the current scope is satisfied;
- budget/deadline policy has not been violated.

Do not loop forever on low-impact speculative concerns. Record them if useful.

Escalate to a stronger/alternate model only when the unresolved issue is important and cheaper evidence-producing paths are exhausted.

---

## 25. Metrics to observe before optimizing

Do not optimize agent-local metrics such as “bugs found” or raw reviewer acceptance rate.

Initially observe system-level outcomes:

- escaped failure count/impact;
- cost per successfully accepted run;
- latency per successfully accepted run;
- repair/review iteration count;
- unresolved-incident rate;
- expensive-model escalation rate;
- false-positive review churn;
- proportion of human/model outcome failures that had earlier warning evidence.

These are diagnostic signals, not yet hard optimization targets.

The long-term question is:

> How often does the automated system produce something that later evidence says was wrong, and how cheaply can it explain and prevent recurrence?

---

## 26. Agent handoff / resume order

An implementation agent receiving this document should:

1. read `AGENTS.md`, `CODEX.md`, `docs/STATE.md` and this document;
2. inspect the current VibeLearn repository;
3. inspect the current Terminal PM Agent status/checkpoint before relying on any capability;
4. **do not copy or extract Terminal PM Agent modules** while its relevant architecture is still under active development;
5. read the existing v0.1 adapter contract and completed Phase 0 fixtures;
6. preserve that boundary; add integration machinery only when an authorized run or a concrete correctness defect requires it;
7. preserve the current Level 1/product review state and do not start Level 2 as a side effect;
8. when Terminal PM Agent later authorizes a suitable live run, exercise one bounded VibeLearn task through the same contract;
9. feed real integration/product failures back as evidence instead of immediately adding new architecture;
10. consider deeper code-level reuse only after the stability gate in section 18 is met for the boundary being reused.

The integration agent should optimize for **decoupling and replaceability**, not for making the two repositories look like one codebase.

---

## 27. Final design statement

The intended VibeLearn automation model is:

```text
VibeLearn defines product goal + outcome contract
external Terminal PM Agent orchestrates cheap workers/reviewers
cheap reviewer searches for a counterexample and proves its claims
tools/runtime produce evidence
VibeLearn evaluators test the actual experience
human/telemetry/model outcomes reveal escapes
incidents trace both product cause and escape cause
system changes are replayed before adoption
Astra is used rarely to generate better hypotheses when evidence is stuck
```

The system does not require LLMs to be deterministic.

It requires the artifacts, observations and evidence they produce to be **traceable, reproducible where possible, and tied to the exact version that produced them**.


## 5.1 Critic independence requires context separation

The `ad14c5a` incident showed that a separate reviewer prompt can still be
correlated with the creator if both receive the same intent-heavy context.

For player-experience work, the orchestrator should support at least two context
capsules:

### Cold-observer capsule

Contains:
- exact runtime/candidate identity;
- access to the running experience/computer-use surface;
- device/accessibility constraints;
- the minimal player-facing task ("experience this as a new player");
- no story treatment, storyboard explanation, creator rationale or expected
  interpretation unless required for safety.

The reviewer reports observations/inferences/confusions before seeing intent.

### Intent-comparison capsule

Contains:
- cold-observer report/evidence;
- StoryWorldSpec/GameDesignSpec/creative intent;
- relevant implementation evidence.

This reviewer compares observed versus intended meaning. It must not rewrite the
cold observations to fit the design.

The same pattern applies to tutorial/UX review: first attempt the experience from
the player-facing instructions, then inspect implementation/specs.

## 5.2 Outcome-evidence adapters by claim type

Do not give every critic the same screenshot bundle.

Route evidence by claim:
- story/world comprehension -> interactive/motion capture + caption-blind pass;
- animation direction -> timed motion/video/loop observation;
- major events -> motion + environment/VFX + audio evidence;
- physicality -> traversal/collision probes;
- handoff/tutorial -> fresh interactive path and mode/action trace;
- art composition -> alternate camera/device screenshots + traversal;
- audio quality -> actual listening;
- learning -> authoritative action/evidence replay + changed-context attempts.

The reviewer must state when the required evidence adapter is unavailable and
return UNRESOLVED rather than substituting weaker evidence.

## 5.3 Structural prevention before LLM judgment

Before spending reviewer tokens, deterministic validators/runtime checks should
reject preventable invalid states:
- conflicting experience modes;
- missing declared colliders on archetypes that promise solidity;
- invalid tutorial-step specs;
- malformed major-event direction metadata;
- major semantic objects with no readability strategy;
- asset-backed controlled characters with no explicit motion profile.

LLM critics then spend judgment on comprehension, taste, pacing and quality—not
on defects the platform can prevent mechanically.

## 13.1 VibeLearn quality-failure corpus additions

Add the `ad14c5a` incident as a regression family:
- "ordered screenshots but opening world still incomprehensible";
- "major event caption says thunder but event has weak/no atmosphere";
- "intended antagonist cause absent from perceived causal chain";
- "semantic major object represented by unreadable generic primitive";
- "controlled character walks through visible prop";
- "stock idle loop passes technical tests but reads uncanny for audience";
- "prologue and tutorial UI active simultaneously";
- "tutorial text exists but target/action/success path is unclear".

Any reviewer/harness change claiming to improve creative/game evaluation must
demonstrably catch this corpus without adding Bellweather-specific wording.


## 5.4 Executable post-CI critic pipeline

The player-experience review pipeline is now a concrete artifact protocol rather
than an informal sequence of prompts.

### Immutable technical/evidence stage

For one exact runtime candidate SHA, CI:

1. runs the seven technical/browser suites;
2. emits candidate-bound evidence receipts per suite;
3. preserves motion, caption-blind motion, screenshots, interactive traces,
   authoritative replay, captured player-facing audio and tracked-source evidence
   when available;
4. aggregates receipts into one `review-evidence-index`;
5. generates critic assignments from that index.

The evidence index is immutable run evidence. Post-CI reviewers do not rewrite
it.

### Context-separated critic assignment stage

`tools/build_critic_assignments.py` determines which critic passes are ready
from the evidence modalities actually present.

Examples:
- cold observer starts from caption-blind/player-facing evidence and cannot see
  source/design rationale;
- physicality requires an interactive trace;
- audio atmosphere requires a captured audio input before a listener can be
  assigned;
- cinematic causality and intent comparison remain blocked until a real
  cold-observer result exists.

A missing modality yields `blocked_missing_evidence`, not a weaker assignment.

### Raw critic-result stage

External/independent reviewers produce raw
`vibelearn.critic-result.v1` records under:

`docs/reviews/results/<candidate-sha>/<pass>.json`

Raw results are not trusted merely because they are committed.

### Sequential revalidation stage

Before release, `tools/ingest_critic_results.py` starts from the immutable CI
index and:

1. regenerates the current assignment for each pass;
2. validates the raw result against only that assignment's allowed evidence;
3. verifies exact candidate/pass identity and context-separation attestations;
4. normalizes the result into a candidate-bound post-CI evidence item;
5. adds it to the review workspace;
6. regenerates downstream assignments before validating the next dependent pass.

This means, for example, a cinematic or intent-comparison result cannot be
accepted before a valid cold-observer result has actually unlocked that pass.

### Final review / release stage

A new Phase 1 preview requires:
- successful exact-candidate CI evidence;
- complete/revalidated post-CI critic results required by schema v2;
- final schema-v2 review record whose evidence exists in the combined workspace;
- no explicit blocker;
- candidate not present in human-rejected status;
- release gate success.

Preview promotion is handled by
`.github/workflows/promote-preview.yml`, which rebuilds the evidence index and
revalidates raw critic results again rather than trusting earlier labels.

Level/phase advancement remains a separate gate and requires explicit human
acceptance for the exact runtime candidate.

### Evidence integrity rule

An **assignment packet is not an observation**.

A raw audio capture is not an audio-quality judgment.

A source/spec file is not player-experience evidence.

A green technical suite is not creative readiness.

The system preserves these distinctions in machine-readable modalities so
orchestration cannot collapse them into one generic "evidence" bucket.


## 5.5 Harness-side critic execution receipts

The `ad14c5a` failure showed that a reviewer saying "I was independent" is not
enough evidence of independence.

For every post-CI critic execution, the **orchestrator**, not the reviewer,
records a candidate/assignment-bound execution receipt.

Protocol:

1. generate the pass assignment from the immutable candidate workspace;
2. launch a fresh reviewer session using only the assignment capsule;
3. record exactly which evidence/context was mounted into that session;
4. create `vibelearn.critic-execution-receipt.v1` with
   `tools/critic_execution_receipt.py`;
5. give the reviewer only the allowed context/evidence;
6. reviewer emits `vibelearn.critic-result.v1` including the receipt ID;
7. ingestion rejects results whose assignment/receipt/evidence do not match.

The receipt captures:
- executor identity;
- reviewer session identity;
- exact candidate and assignment ID;
- supplied evidence;
- supplied context labels;
- any forbidden context (hard failure).

This is intentionally adapter-neutral. Terminal Agent, future Work agents, CI
review workers or other reviewer backends can implement the same receipt
contract.

A receipt does not prove taste or semantic independence cryptographically. Its
job is to make context leakage **observable and traceable**, so a later incident
can answer "what did this critic actually receive?" rather than relying on a
prompt's claim.
