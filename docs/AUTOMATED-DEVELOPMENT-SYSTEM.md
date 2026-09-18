# VibeLearn automated development system — Terminal PM Agent integration

**Status:** approved target architecture / implementation handoff  
**Date:** 18 September 2026  
**VibeLearn baseline inspected:** `main` at `a150db3f31fb565ddc28cacf9f41e99ec3eebb16`; current reviewed runtime candidate remains `ad14c5aced6cf053c7617dfb03245506e1e9dad5` per `docs/STATE.md`.  
**Terminal PM Agent donor baseline:** inspected through the connected private GitHub source. Because VibeLearn is public, the donor repository identifier and exact private revision must remain out of this public document and be captured in the private integration run/evidence record.

This document defines how to merge the useful orchestration/runtime ideas from the Terminal PM Agent into VibeLearn so VibeLearn can become a highly automated product-development and game-generation system.

It supersedes older statements that the orchestration system is only indefinite future work. It does **not** authorize a broad rewrite, a role explosion, autonomous production deployment, or abandoning the current VibeLearn product-quality gate. The integration must start as a thin vertical slice and grow only when a clear safety/correctness requirement or evidence from real runs justifies more machinery.

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

```text
                     VERSIONED GOAL / SPEC
                              |
                              v
                       ORCHESTRATOR
          state · context · budget · permissions · routing
                              |
                 +------------+------------+
                 |                         |
                 v                         v
              WORKER                  REVIEWER
          V4.1-class default      V4.1-class default
                 |                         |
                 +------------+------------+
                              |
                              v
                    SANDBOXED TOOL PLANE
         repo · shell · tests · browser · build · DB adapters
                              |
                              v
                         ARTIFACT
                              |
                              v
                  EVALUATION / REAL USE
       CI · critic profiles · playtest · human · telemetry
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
              +---------------+---------------+
              |                               |
              v                               v
        product change                  system change
              |                    only if evidence supports it
              +---------------+---------------+
                              |
                              v
                         NEW RUN
```

A single versioned run/evidence graph underlies development, review, outcome evaluation and incident learning. Do **not** build three independent “production”, “outcome” and “learning” architectures.

---

## 4. Intelligent roles

### 4.1 Orchestrator

The orchestrator is not another senior engineer that opines on domain correctness. It owns:

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

## 18. What to reuse from Terminal PM Agent

The donor repo contains many useful, already-tested ideas, but also substantial historical and verifier-specific complexity. **Do not copy the package wholesale.**

### Reuse/adapt concepts and focused modules

Inspect and extract where useful:

- command policy / capability gating;
- terminal/background session management;
- worktree isolation;
- structured execution evidence;
- session launch/action/exit receipts;
- secret redaction/safety;
- runtime/process identity;
- unknown-outcome handling and recovery;
- scenario/run metadata persistence;
- provider/model adapter patterns;
- bounded progress/retry concepts;
- append-only telemetry/event ideas;
- tool-call evidence and command hashing;
- reconciliation before redispatch.

Important donor lessons to preserve:

- process existence is not proof of progress;
- helper exit is not worker exit;
- exit zero is not semantic success;
- captured data is not proof of product improvement;
- unknown launch/action outcomes must be reconciled before retry;
- controller/restart recovery must not duplicate work;
- evidence must bind to exact candidate/runtime/context.

### Do not port by default

Do **not** transplant:

- the complete current Gate verifier/batch stack;
- the donor repo's historical bug/review machinery;
- every scenario-specific module;
- Telegram/TUI/web surfaces VibeLearn does not need;
- old PM memory schema as VibeLearn's canonical state;
- unfinished spend ledger;
- the donor repo's accumulated compatibility paths;
- its current giant-module architecture/debt.

Treat the donor as a **reference implementation and parts bin**.

VibeLearn should own a smaller automation boundary shaped by VibeLearn's real workflow.

---

## 19. Suggested VibeLearn code boundary

Do not force this exact directory structure if the current code suggests a cleaner fit, but keep the conceptual boundary small.

A likely target is:

```text
automation/
  orchestrator/
  runtime/
  evidence/
  providers/
  policies/
  evaluators/
```

Where:

- `orchestrator/` owns runs, routing, budgets, stopping/escalation;
- `runtime/` owns worktrees/sandbox/session/tool execution;
- `evidence/` owns run/evidence/finding/outcome/incident persistence;
- `providers/` owns model/coding-agent adapters;
- `policies/` owns tool permissions/release constraints;
- `evaluators/` maps existing VibeLearn CI/critic/playtest contracts into reviewer/evaluation profiles.

Do not create subpackages until code volume/responsibility actually requires them. A small first slice may live in fewer modules.

---

## 20. First vertical slice

The first implementation must prove the architecture on **one real VibeLearn development task**, not build the universal automation platform.

Required flow:

```text
bounded VibeLearn task
  -> isolated worker execution
  -> artifact/diff
  -> independent reviewer
       -> any criticism automatically attempts valid proof/reproduction
  -> deterministic checks/evidence
  -> accept or send back for repair
  -> compact persisted run record
```

Then prove one outcome-feedback path:

```text
accepted artifact/build
  -> human or model outcome feedback says something is wrong
  -> feedback links to exact build/run/session
  -> incident record
  -> cheap worker diagnosis + experiment
  -> product fix
  -> replay failed path
```

Do **not** require Astra for this slice. Astra integration should be exercised only when a real or deliberately constructed unresolved ambiguity justifies it.

---

## 21. Phased merge plan

### Phase 0 — baseline and extraction map

Before moving code:

- freeze/record current VibeLearn test/build baseline;
- record donor Terminal PM Agent source revision;
- map donor modules/concepts to the minimal VibeLearn needs;
- identify security boundaries and tools required by the first slice;
- select one real bounded VibeLearn task;
- do not disturb the current accepted/review candidate or Level 2 gate.

**Exit:** documented extraction map and baseline evidence. No speculative framework.

### Phase 1 — worker/reviewer run loop

Implement only:

- run ID/state;
- bounded context packet;
- worker invocation;
- isolated execution/worktree;
- reviewer invocation with implicit falsification/proof contract;
- tool/test evidence capture;
- accept/repair status;
- compact provenance.

**Exit:** one real VibeLearn task completes end-to-end and can be replayed/inspected from its run record.

### Phase 2 — VibeLearn evaluation adapters

Connect existing VibeLearn evidence rather than reinventing it:

- build/test suites;
- browser/playtest artifacts;
- story/art-world/gameplay/learning reviewer profiles;
- exact build/runtime identity;
- user-review linkage.

Add cheap computer-use evaluation only where the real rendered experience matters.

**Exit:** a candidate cannot be called accepted merely because code tests pass; outcome evidence is linked to the exact run/build.

### Phase 3 — incident/escape loop

Add:

- outcome -> incident linkage;
- diagnosis/escape summaries;
- reproduction/replay;
- product fix;
- proposed system change as a versioned artifact;
- replay of the original failure before system-change adoption.

**Exit:** demonstrate one deliberately seeded or real escaped failure whose product cause and pipeline escape cause can both be traced and repaired.

### Phase 4 — scale only from evidence

Potential later additions:

- risk-based second reviewer;
- model diversity;
- richer cost reservation/reconciliation;
- historical failure corpus automation;
- smarter context selection;
- Astra evidence-packet escalation;
- more autonomous release;
- richer production telemetry.

Each addition needs either an obvious invariant or observed run evidence.

---

## 22. First-slice acceptance criteria

The first integrated automation slice is not accepted until all are true:

1. a real VibeLearn task has a unique run identity;
2. the worker runs with bounded context and permissions;
3. generated code/tests execute in an isolated environment;
4. reviewer starts independently from the worker's private reasoning;
5. any substantive reviewer defect claim includes an attempted valid reproduction/proof;
6. deterministic results are captured with exact candidate/environment provenance;
7. reviewer/model agreement alone cannot override failing deterministic evidence;
8. artifact acceptance points to the evidence that justified it;
9. an outcome/feedback item can point back to the exact accepted run/build;
10. an incident can be created without reconstructing history from chat transcripts;
11. retry after an unknown tool/session outcome cannot silently duplicate work;
12. no production secret is exposed directly to ordinary workers;
13. no automated production deployment/policy rewrite occurs in this phase;
14. model/tool budget limits exist;
15. existing VibeLearn product tests/gates remain green or any baseline failure is explicitly preserved and attributed.

---

## 23. Six non-negotiable invariants

1. **Everything important is versioned.**  
   Goal/spec, code, prompts/configs, model identity, harness/evaluator and build/runtime identity must be recoverable.

2. **Every accepted artifact points to acceptance evidence.**

3. **Every material outcome points back to the exact artifact/run that produced it.**

4. **Historical evidence is not silently rewritten.**

5. **A system change caused by a failure must be replayed against that failure before adoption.**

6. **No architectural complexity is added without a clear invariant or evidence from real runs that the simpler design is insufficient.**

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
2. inspect the current VibeLearn repository rather than assuming this document's module suggestions already exist;
3. inspect the connected private Terminal PM Agent donor repository at the privately recorded donor baseline, especially execution/session/evidence/recovery modules; do not copy the private repository URL, credentials or private-only evidence into this public repository;
4. produce a **small extraction map** of donor capabilities to reuse/adapt versus leave behind;
5. select the smallest real VibeLearn task that can prove the worker -> reviewer -> evidence loop;
6. implement Phase 0/Phase 1 only;
7. run existing VibeLearn build/tests and focused automation tests after each bounded change;
8. preserve current Level 1/product review state; do not start Level 2 as a side effect of this architecture work;
9. report observed deviations from this plan rather than hiding them behind abstractions;
10. request/perform broader architecture only after the first real runs show where the simple design fails.

The first agent should **not** attempt to merge the entire Terminal PM Agent repository or implement every future role in `GAME-CREATION-PLATFORM.md`.

---

## 27. Final design statement

The intended VibeLearn automation model is:

```text
cheap worker searches for a solution
cheap reviewer searches for a counterexample and proves its claims
tools/runtime produce evidence
product evaluators test the actual experience
human/telemetry/model outcomes reveal escapes
incidents trace both product cause and escape cause
system changes are replayed before adoption
Astra is used rarely to generate better hypotheses when evidence is stuck
```

The system does not require LLMs to be deterministic.

It requires the artifacts, observations and evidence they produce to be **traceable, reproducible where possible, and tied to the exact version that produced them**.
