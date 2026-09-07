# Personal Learning OS: product and architecture specification

**Revision 1.0 · 6 September 2026 · design only**

## 1. Executive decision

Build a durable **learner-evidence system with replaceable learning policies and content providers**, not a course player with an external mastery table.

The indispensable durable assets are the learner's consented profile, goals, raw work, observed performance, assessment context, accepted and disputed judgments, competency definitions and identity history, and the provenance needed to interpret those records. Current mastery estimates, rankings, retrieval dates, course progress, and embeddings are derived or operational state, not permanent truth.

A genuine decoupling test has two parts:

- **State preservation:** removing/replacing course records cannot change learning facts or erase the definitions needed to interpret them.
- **Behavioral preservation:** with equivalent target frames, candidate activities, evidence, policy versions, and clock inputs, behavior is equivalent regardless of course/provider names or course packaging. Different material can appropriately lead to a different future plan.

Do not promise that deleting all content leaves the system able to teach. It must preserve history and represent unfulfillable learning needs explicitly; producing a valid new exercise still requires suitable content or a validated generator.

## 2. Repository assessment and initial engineering choices

No user repository, attached project files, Git metadata, or project manifest was available in the inspected mount locations. There is consequently no justified claim about an existing stack, useful code, test coverage, architecture debt, or migration difficulty. The filesystem inspection is not a GitHub/account search.

Default recommendation when an actual repository becomes available: preserve a sound existing stack. For a greenfield implementation, use Python for the application/domain, typed request/response validation, PostgreSQL as the transactional store, ordinary filesystem/object storage for immutable artifacts, and a CLI or thin web UI. A TypeScript client is optional later. Framework choices are reversible; evidence identity and lifecycle rules are not.

One deployment unit initially. Optional model evaluations may use a persistent jobs table and a worker in the same codebase. No Kafka, Redis dependency, dedicated graph database, vector database requirement, or microservices. Use the real chosen database in integration tests; an in-memory substitute does not establish its transaction behavior.

A coding agent's initial repository assessment should report: tree and entry points; existing storage and migrations; authentication/privacy boundaries; tests actually executed; reusable interfaces; and deviations from this design. It should not replace a working application merely to match folder names.

## 3. Assumptions to challenge

### 3.1 “No pedagogy in course data” is too strong

A meaningful exercise necessarily describes what a good answer demonstrates, allowed tools, task conditions, possible hints, and domain-specific misconceptions. Removing this information makes evaluation depend on a giant tutor prompt.

The implementable distinction is **declarative task semantics and pedagogical affordances in content; adaptive decisions and evidence interpretation in versioned policies**. Content may offer a counterexample and six hints. It may not prescribe a learner's mastery delta, next review date, mandatory lecture sequence, provider-specific system prompt, or executable policy hook.

### 3.2 Stable identifiers do not establish semantic equivalence

Two exercises both tagged “idempotency” may test recall, API design, concurrency safety, or implementation. A correct definition is not evidence that a learner can design a safe deduplication transaction. Separate a topic label from an assessable capability and separate capability identity from assessment scope.

### 3.3 One mastery number is not a portable unit

Success probability is conditional on task population, challenge, context, and allowed assistance. “0.9 at what?” must have an answer. Scope evidence to an **assessment frame**, defined below, and show its limits. Do not average unrelated facets into a confident universal score.

### 3.4 Unknown is not beginner

An experienced learner without stored evidence should receive a challenging, bounded diagnostic and a route bypass opportunity. Missing evidence must not generate low-mastery facts. Self-reported experience influences initial task selection, not performance counts.

### 3.5 New examples are not necessarily transfer

Renaming workers as bakers is usually cosmetic variation, not evidence of abstraction transfer. Track problem-family lineage and the structural changes in constraints or reasoning. “Novel” is a content claim that needs validation, not something an LLM can declare authoritative.

### 3.6 BUILD success is not necessarily independent competence

A passing implementation generated by an agent demonstrates an artifact property. It does not establish the learner's reasoning. Record authorship/assistance and create a later independent probe. Conversely, AI-assisted engineering can itself be a legitimate capability if assessed under a separately defined tool-enabled frame.

### 3.7 Auditability and deletion can conflict

Normal course removal preserves minimal historical evidence. Explicit privacy erasure can remove that evidence and reduce reproducibility. A hash cannot reconstruct deleted material and is not automatically anonymization. Do not claim permanent replay after erasure or rights-restricted loss of source content.

### 3.8 “Automatically benefits every course” needs qualification

Engine improvements apply through shared policies and interfaces, but new activity modalities may need adapters, new estimators need validation, and some historical inputs may be unavailable for re-evaluation. Run algorithm upgrades in shadow projections before activation. Shared applicability is the architectural promise; universal educational improvement is an empirical question.

### 3.9 Problem-first should be a preference, not a trap

A difficult task with missing prerequisites can become unproductive. Let the learner request theory immediately, bypass a task, declare it ambiguous, or switch modes. Do not manufacture failure or punish asking for help. The user wants both challenging practice and systematic theory coverage.

## 4. Bounded modules and dependencies

| Module | Owns | Does not own |
|---|---|---|
| Knowledge registry | Competency identities/revisions, assessment frames, graph assertions, compatibility/migration decisions, misconception definitions | Learner ability; course order |
| Content catalog | Immutable resources, source editions, claims, activities, rubrics, criterion bindings, exercise families, project templates | Mastery; learner-specific review dates |
| Curriculum | Packages, versions, route nodes, installations, course-specific navigation/progress | Competency identity; assessment truth; learner history |
| Learning core | Profile/goals, evidence interpretation, mastery projections, retrieval intents, learning policies, pure plan selection | PDFs, repositories, provider SDKs, course lessons |
| Assessment | Attempt/checkpoint semantics, evaluations, adjudications, observation extraction, rubric validation | Arbitrary writes to mastery; learner ranking by a model |
| Application orchestration | Transactions, authorization, consent, mode transitions, candidate assembly, commands/queries | New domain knowledge hidden in controllers |
| Integrations | LLM/provider drivers, repository adapters, artifact storage, source fetching, runner capabilities | Canonical state ownership |
| Authoring workspace | Research/import drafts, competency proposals, exercises, validation reports, release packages | Production learner records or automatic registry mutations |

Assessment and learning may be submodules of one package, but their input/output contracts must remain distinct.

Dependency direction:

```text
UI / CLI
  -> application orchestration
       -> curriculum adapter -> normalized RouteIntent
       -> content query -> ActivityCandidate[]
       -> knowledge registry -> TargetFrame / graph snapshots
       -> learning core -> SessionPlan / MasteryProjection / RetrievalIntent
       -> assessment -> accepted ObservationSet
       -> integration ports -> provider / source / project / storage adapters

Authoring workspace -> quarantined package -> import validator -> catalog + routes
```

The learning core accepts value objects such as `FrameRef`, `EvidenceView`, `ActivityCandidate`, `RouteIntent`, clock time, and policy revisions. It must not import `Course`, `Lesson`, PDF parsers, ORM models, Git clients, or model SDKs. Domain-specific adapters are installed capabilities; a course cannot install executable code.

Architectural independence does not require each module to have a separate database. An application unit of work may atomically update multiple modules through their command APIs. Modules may read published read models, but not directly mutate another module's tables.

## 5. Identity, semantic versioning, and graph governance

### 5.1 Entity references

Use opaque UUID identities and an explicit immutable integer revision: `{id, revision}`. A revision number is not an identifier by itself. Human-readable names and slugs are labels and search aliases, never primary keys. Package release versions use semantic version strings; package-schema versions are independent.

Objects carrying revisions include competency definitions, assessment frames, activities, rubrics, bindings, source editions, graph assertions, goal definitions, and policies. Their revision namespaces are separate. A new course version cannot revise a competency or rubric in place. Validation/review decisions about a sealed record are separate immutable attestations tied to its exact ref and digest; changing review status does not mutate its semantic payload.

Store exact reference locks. “Latest” is acceptable in authoring search results but forbidden in published attempt snapshots or resolved package dependencies. The same published ID/revision or course/release with a different content digest is a conflict, not an update.

A local registry is authoritative **for this installation**, not a claim to a universal ontology. Imported issuer IDs are preserved as namespaced external identifiers. Similar names propose mappings; they do not auto-merge. The CASE standard is useful as an import/export mapping reference, including persistent identifiers and explicit treatment of semantic changes; implementing CASE is not required for the first slice [R1].

### 5.2 Concepts and competencies

A concept is a subject label useful for discovery: “leases.” A competency is an observable performance claim under stated conditions: “Given a lease-expiry race, explain why a paused worker can become stale and specify how a downstream authority rejects it.”

A `CompetencyRevision` includes statement, scope, exclusions, facets, expected observable behaviors, status, issuer/owner, and definition provenance. Topic tags cannot receive mastery evidence by default. A capability need not belong to a course.

Keep the first registry small. Six to eight useful competencies are enough. Do not decompose into hundreds of arbitrary micro-skills before seeing whether exercises can distinguish them.

### 5.3 Assessment frames

A frame is a course-independent versioned measurement target:

```text
AssessmentFrameRevision
  id, revision
  competency_ref
  facet_key                  # e.g. reason, diagnose, construct; data, not a closed core enum
  scope_statement            # conditions and exclusions
  challenge_band             # locally defined, not globally calibrated
  allowed_aids               # documentation, compiler, AI, collaboration, notes
  expected_demonstration
  assessment_standard_ref    # rubric/anchor standard where available
  compatibility_status
```

Frames prevent silent pooling of radically different tasks. A course targets frame references; the knowledge map may summarize them under a competency but must show missing facets. In v1, pool evidence only for the same frame or a reviewed exact-equivalence mapping. No automatic generalization from basic to advanced, from implementation to derivation, or from one tool policy to another.

Do not create a new competency for every repository, programming language, or course. Context belongs in frame scope and activity instance metadata unless it materially changes the capability claim.

### 5.4 Graph assertions

A relation has endpoints, kind, provenance, author, confidence/review state, applicability conditions, and revision. Useful kinds are prerequisite, related, refinement, application, misconception-of, and alternative-prerequisite. Prerequisite requirements may use `all_of` / `any_of` groups.

A graph is not automatically a DAG. The approved hard-requirement subset must be acyclic; related/application links may cycle. Most educational prerequisites should be advisory. Hard blockers are reserved for explicit safety, authorization, required equipment/runtime capability, or activities logically impossible without a required artifact. A course's suggested order is not a global prerequisite assertion.

Passing a dependent skill does not automatically prove all prerequisites. Failing a task that touches five skills does not automatically mark all five weak.

### 5.5 Semantic evolution

| Change | Action | Evidence treatment |
|---|---|---|
| Rename or editorial clarification without changed meaning | Same identity, new revision, reviewed equivalence record | Reuse underlying observation through a compatibility view; no new independent evidence |
| Different meaning or standard | New identity; deprecate old | Retain old history; diagnostic for new meaning |
| One skill splits into several | New identities + explicit split map | No copying the old scalar score to all children; route only criterion-level support that is actually justified |
| Several skills merge | New identity + merge map | Do not average scores; rebuild from deduplicated root observations or run a diagnostic |
| Wrong criterion mapping discovered | New binding revision + correction/adjudication | Invalidate affected attribution, reproject explicitly; keep the historical judgment |
| Conflicting external ontology | Preserve both IDs and an unresolved alignment proposal | Do not force equivalence |

Every migration contains `mapping_id`, old/new refs, relation, reviewer, rationale, permitted evidence use, effective date, and affected criteria. Preserve root evidence identity through multi-hop remapping. Equivalent aliases must not double-count the same performance.

First implementation: support rename/exact-equivalence and deprecation; all partial/split/merge mappings default to `diagnostic_required`. The schema may represent richer mappings, but unimplemented migration behavior must fail explicitly rather than guessing.

## 6. Domain model and ownership

### 6.1 Long-lived learner objects

`Learner` contains identity and consent boundaries. `ProfileAssertion` contains preference/context, source (`self_report`, `observed_behavior`, `inference`), timestamp, revisability, and review status. `GoalRevision` contains target frame refs, priority, time horizon, maintenance preference, and optional coverage requirements.

Goals adopted from a course become explicit learner-owned target snapshots. Removing the course does not silently remove those goals. Offer a separate action to pause or archive them. Temporary study goals must not become permanent personality traits.

`Override` is a visible policy instruction: skip until a date, pin a task, prefer direct explanation, pause a topic, dispute an assessment, or self-assert proficiency. An override is not a fabricated performance event. Inferred preferences are editable without rewriting history.

### 6.2 Content objects

`Resource` identifies a work. `SourceEdition` pins an edition/revision/fetch with stable locator and rights metadata. `SourceClaim` represents a claim and supporting/contradicting source spans. `ActivityRevision` declares stimuli, responses, affordances, task family, validation status, provenance, and compatible capabilities. `RubricRevision` defines observable criteria. `CriterionBindingRevision` maps individual rubric criteria to assessment frames with explicit attribution.

`AssessmentBlueprint` defines held-out sampling/coverage rules; it is not the learner's attempt. `ProjectTemplate` is reusable content. `ProjectWorkspace` is an optional external work context. `ProjectAttempt` and `ProjectEncounter` are learner activity/history objects. Do not use one overloaded `Project` entity for all three purposes.

### 6.3 Learning records

`ActivityInstance` is the concrete task presented: resolved stimuli, parameters, seed when relevant, content/rubric/binding refs, frame definitions, source locators, environment assumptions, family/context lineage, and privacy/access conditions. Snapshot actual generated text and parameters; a seed alone cannot reproduce model-generated content.

`Attempt` identifies a learner's response episode and immutable presented instance. `Checkpoint` freezes the response and assistance state at a point in that episode. `LearningEvent` records an occurrence. `JudgmentRevision` interprets one or more checkpoint criteria. `EvidenceObservation` is the normalized, attributable fact used by an estimator. `MasteryProjection` is a versioned interpretation of active observations, not their owner.

`RetrievalIntent` says which frame needs what kind of later probe, when, and why. `SessionPlan` is a revisioned runtime proposal that may change after new evidence. Neither is owned by a lesson.

### 6.4 Historical capsule

Before an assessment is accepted, store enough to understand what was asked and why it was graded that way: actual stimulus or permitted excerpt/locator, response artifact, exact rubric and criteria, exact bindings, relevant frame definitions, allowed aids and assistance, important source edition/spans, model/tool run references, and origin labels.

An origin label may contain historical course ID/version/node/title **as copied values**. It is not a required foreign key to an installed course. History must render and projections must rebuild when all course records have been physically removed.

Keep required definitions readable in exports. A digest without its content is only integrity metadata. For rights-restricted sources, store permitted metadata/notes rather than unauthorized full copies and mark re-evaluation limitations.

## 7. Events, judgments, evidence, and transactions

### 7.1 Three different truths

1. **Occurrence:** a response was submitted; a hint was revealed; a test process exited.
2. **Judgment:** this answer satisfies rubric criterion X under evaluator version Y.
3. **Inference:** active evidence supports proficiency in frame Z under estimator version V.

Never collapse all three into `exercise.completed = true`.

Use an append-oriented learning ledger with normalized operational tables and rebuildable projections. Full event sourcing for every UI preference or content entity is unnecessary. xAPI's immutable statements and voiding are relevant precedent; this design additionally snapshots interpretation dependencies instead of relying on mutable activity definitions [R2].

Events include learner ID, event ID, schema version, type, occurred-at, recorded-at, learner-local committed sequence, actor attribution, command/idempotency ID, correlation ID, and typed payload. Store UTC instants and the scheduling timezone separately. User-reported times are not trusted to reorder committed history silently.

### 7.2 Attempt lifecycle

```text
draft -> in_progress -> submitted -> evaluating -> evaluated
                                 -> evaluation_pending_review
                                 -> evaluation_failed (retryable)
any active state -> abandoned / invalidated (with reason)
```

Opening a task records exposure, not competence. Asking for a hint freezes an optional pre-hint checkpoint before showing the hint. Submission freezes the final response. Resuming or revising after feedback starts a linked continuation/new attempt; it cannot overwrite the old independent answer.

Distinguish `incorrect`, `partially_correct`, `not_observed`, `ambiguous_task`, `invalid_environment`, `evaluator_failure`, and `withdrawn`. Only interpretable assessed outcomes affect capability. An unavailable compiler, unsound test, missing source, or provider timeout is not evidence of ignorance.

### 7.3 Evaluation contract

An evaluator receives only the frozen task, response, criteria, allowed-aid record, relevant source/evaluation artifacts, and declared context. Hide previous mastery, desired grade, learner prestige/experience, and irrelevant tutor praise to reduce bias.

Output per criterion: outcome/score or abstention, response spans/test artifacts supporting it, explanation summary, uncertainty reason, possible misconception hypotheses, evaluator identity/revision, and checks performed. Do not request or depend on a provider's hidden chain of thought.

The model does not write `EvidenceObservation`, select its own reliability weight, change mappings, update mastery, or set review dates. Assessment code validates output, resolves conflicts, and accepts a judgment revision.

LLM-as-judge research reports position, verbosity, and self-enhancement biases; those results concern model evaluation, not validated educational assessment. They motivate calibration fixtures, blindness where possible, and abstention, not confidence that a second model guarantees truth [R3].

### 7.4 Assistance and authorship

Record assistance as events with time, scope/criterion coverage, kind, shown content hash or retained artifact, declared level, actual disclosure estimate, and source. The six progressive hint levels are a UI/policy convention; the numeric level alone is not a reliable measure of help. A purported level-1 hint that gives the answer contaminates independence.

Each observation records the assessment's aid policy, observed local aid use, learner-declared external aid use, and whether independence is declared, locally checked, or unknown. Do not claim to prove the absence of off-platform AI use. Accessibility changes and formatting clarifications are not conceptual help by default.

V1 policy: independent-capability estimates use only fully covered assessment samples whose checkpoints satisfy the frame's allowed-aid contract. Partial-coverage observations remain useful evidence and planning signals but cannot establish a complete-frame scalar estimate or skip claim. Assisted later success is recorded separately and creates a follow-up diagnostic. A clean earlier checkpoint can still contribute. A BUILD attempt is not downgraded morally; it is measuring a different condition.

### 7.5 Regrading, corrections, and deduplication

Give each atomic outcome a stable `root_outcome_id`. Several judgments of the same answer are alternative interpretations, not multiple successes. Exactly one accepted judgment revision is active for a judgment set; a later adjudication selects a replacement.

Observations retain accepted evaluation revision and criterion binding revision. A superseding judgment retracts/replaces the corresponding active observations and recomputes affected projections from history. Never add a positive delta without removing the superseded interpretation. Mapping/evaluator/source corrections have explicit events and impact reports.

Cap evidence contribution per `(attempt, target_frame)` and track shared roots across targets. Variant questions derived from one template share a family and do not create unlimited independent confidence.

### 7.6 Transaction protocol

For a command that changes learner state:

1. Validate authorization, schema, expected aggregate revision, artifact availability, and command payload hash.
2. Check a durable command receipt keyed by `(learner_id, command_id)`. Same key and payload returns the previous result; different payload is `IDEMPOTENCY_CONFLICT`.
3. Acquire the learner-head row lock for the short commit transaction. Allocate the next learner-local committed sequence inside that transaction.
4. Commit the event(s), judgment activation/observation set, attempt state, affected mastery projection, retrieval revision, and command receipt atomically in v1.
5. Publish optional post-commit work through a transactional jobs/outbox row. No network/model call while holding the lock.

A model job first computes/stores a candidate result outside the critical section; acceptance is a separate short transaction that checks the frozen input digest and attempt/judgment revision. Concurrent completions cannot both become extra evidence. Crash after commit and before response is safe to retry. Failed commits cannot advance the visible learner cursor.

For future async projections, commands return the committed evidence cursor; planners must wait for/read a projection at least that fresh or return `PROJECTION_STALE`. Do not silently plan from stale mastery. PostgreSQL documentation is the implementation reference for real locking/isolation behavior; no claim of safety follows merely from using a database [R8].

## 8. Mastery design: conservative and replaceable

### 8.1 Stored estimate shape

The projection key is `(learner_id, frame_ref, estimator_policy_ref)`; its derivation also pins an alignment-policy revision and evidence cursor. Return:

- status: unknown, provisional, supported-within-scope, conflicting, or stale;
- model mean/interval, when available, explicitly marked uncalibrated or calibrated;
- effective evidence weight, distinct task families, contexts, dates, and allowed-aid conditions;
- last independent attempt and last delayed success;
- active supporting and contradicting observation IDs;
- missing facets/conditions and unresolved disputes;
- generated-at, evidence cursor, and all policy revisions.

A confidence number is not interchangeable with evidence count or self-reported certainty. V1 should show evidence sufficiency and uncertainty explanations rather than a decorative `confidence: .97`.

### 8.2 Concrete baseline

V1 may use a transparent fractional-count Beta model **as a heuristic within each frame**, not as a validated estimate of general competence:

```text
alpha = 1 + sum(w_i * s_i)
beta  = 1 + sum(w_i * (1 - s_i))
model_mean = alpha / (alpha + beta)
```

Here `s_i` is a normalized rubric outcome, not a whole-course grade. Only accepted, admissible, deduplicated, aid-compatible observations are included. A 90% interval is an interval under this toy model, not an empirically established confidence interval about the learner. With no evidence, status is `unknown`; do not show the prior mean 0.5 as ignorance.

Normative v1 weighting defaults:

- Trusted, reviewed human assessment or criterion-validated deterministic assessment: base reliability 1.0. Learner self-assessment is explicitly distinguished and defaults to 0.25; it cannot alone establish durable support.
- Uncalibrated LLM-only assessment: base reliability 0.25 and ineligible for durable-skip status.
- Invalid/abstained/withdrawn/mismapped observation: weight 0.
- For one atomic criterion, binding attribution fractions total at most 1.0.
- Normalize summed contributions from one attempt to at most 1.0 per target frame.
- For mean estimation, first combine criterion observations into one bounded attempt-frame sample, then retain the latest admissible sample per `(frame, family, captured calendar date in session timezone)`. Keep all earlier observations in history; independent sampling units and learning progress are not the same thing.
- For evidence sufficiency, count unique families and dates separately; repeating one family never satisfies the diverse-evidence gate.

These are engineering defaults to make behavior implementable, not research-derived constants. Store the complete selected/ignored observation list and each weight in the decision record. Changing weights creates a new estimator policy and shadow projection.

Do not propagate scores along graph edges. Do not infer construct/implement competence from a reason-only frame. Do not mutate historical evidence as time passes. V1 marks evidence stale and retrieval overdue; it does not pretend to know a calibrated forgetting curve.

### 8.3 Aggressive skipping without pretending mastery

Two distinct decisions:

**Provisional bypass:** one valid difficult diagnostic with score at least 0.85, no failed critical criterion, approved assessment quality, and appropriate aid conditions can bypass introductory teaching in that frame. Schedule a later independent probe. This is route adaptation, not a permanent mastery declaration.

**Supported within tested scope:** at least three admissible successes of at least 0.8, two distinct validated families and contexts, two dates, including a probe at least seven days after the most recent relevant teaching/solution exposure, no unresolved critical contradiction, and at least two successes not solely from an uncalibrated model judgment. This permits routine teaching bypass, not exemption from future retrieval.

For a later critical failure, show conflicting evidence and select a targeted diagnostic instead of simply subtracting an arbitrary amount and declaring the learner weak. Self-asserted familiarity can also bypass instruction as an explicit user override; it never satisfies the evidence gate.

## 9. Retrieval: schedule capability, bind content later

A `RetrievalIntent` is keyed by learner and frame, with policy revision, due-at window, reason, latest relevant exposure/success, current interval index, permitted activity modalities, desired novelty, source evidence IDs, and status. Status includes scheduled, due, paused, and blocked-no-valid-content.

An exercise ID is not its identity. Candidate activity refs may be cached as replaceable suggestions only. Multiple courses asking for the same frame should not create duplicate review debt. If target-frame definitions change, migrate/revalidate the intent explicitly.

V1 interval schedule after qualifying independent retrieval successes: 1, 3, 7, 14, 30, 60 days. A newly learned/repaired frame starts at one day. Advance one interval after an admissible success of at least 0.8 on a due probe with sufficient delay and no new solution exposure. Failure schedules tomorrow and offers a same-session repair; invalid evaluation does not reset. An early practice attempt records learning but cannot repeatedly extend the long-term interval.

Use the latest relevant learner-visible instruction/solution/practice exposure to evaluate delay. A model's private source search is not learner exposure. Relevant exposure scope can be uncertain; mark delay provenance rather than invent precision.

Intervals are initial product-policy choices, not a validated optimal spacing schedule. Retrieval-practice research supports including delayed, active reconstruction, but does not validate these specific engineering intervals or guarantee transfer to backend design [R4].

Retrieval priority includes overdue duration, goal importance, confidence gaps, active-goal prerequisite centrality, and workload. Centrality is computed within the current goal scope, not every node ever imported; otherwise importing a giant course could arbitrarily reshape scheduling. Time and importance may change urgency, not historical facts.

Uninstalling a course preserves the intent. Search for an eligible replacement from the independent catalog; if none exists, retain it as blocked and show a content gap. Changing subjects pauses the chosen goal/maintenance scope, not the evidence. Do not turn a backlog into punitive catch-up requirements.

## 10. Session planning and productive learning

### 10.1 Inputs

Learner goals/preferences/overrides; evidence views at a known cursor; scoped graph revision; retrieval intents; normalized route suggestions; activity candidates with validation/provenance/exposure summaries; available capabilities; mode; time budget; and explicit clock/policy versions.

Two operations remain distinct: `SourceRetriever` locates source material for grounding; `RetrievalScheduler` schedules learner practice. An embedding index is a disposable retrieval accelerator, not the canonical memory or evidence store.

### 10.2 Selection algorithm v1

First filter candidates by frame match or approved equivalence, authorization and rights, required capabilities, assessment validity, mode, time budget, and allowed-aid contract. Unsupported content is rejected or marked blocked, never silently executed.

Then assign an eligible lane: current-task continuation, due retrieval, diagnostic/contradiction resolution, goal-directed learning, or foundation coverage. Apply explicit constraints before scoring. Over a rolling seven-session learning budget, reserve 20% of available LEARN time for uncovered foundational targets when such targets are eligible, and normally cap review at 30% of a session. These are editable starting policies; log exceptions and do not fill a quota with irrelevant work.

For eligible candidates, use normalized, recorded terms:

```text
score = 3*goal_relevance
      + 2*retrieval_urgency
      + 2*evidence_gap
      + 2*foundation_coverage_debt
      + 1*validated_novelty
      + 1*route_suggestion
      - 2*recent_repetition
      - 1*estimated_friction
```

All terms are deterministic functions of the supplied snapshot and versioned definitions. This is a ranking heuristic, not an estimate of causal learning gain. Tie-break by stable activity-instance identity. Preserve the scored candidate set and excluded-candidate reasons. Renaming a course cannot alter the score.

V1 goal relevance is 1 for an explicit active target, 0.7 for an approved prerequisite in that goal's foundation contract, and 0 otherwise; explicit user pins are constraints, not infinite scores. Retrieval urgency is `min(1, overdue_seconds / max(86400, scheduled_interval_seconds))` for due items and 0 otherwise. Evidence gap is 1 for unknown/conflicting targets, 0.6 for provisional/stale, 0.1 for supported. Coverage debt is 1 for a currently owed foundation lane target and 0 otherwise. Novelty is 1 for reviewed unseen structural family/context, 0.3 for a same-family parameter change, 0 for exposed items. Route suggestion is an ordinal percentile within the normalized route. Recent repetition is 1 for the same family in the last two sessions and 0 otherwise. Friction is the clipped sum of declared setup minutes and context-switch minutes divided by available session minutes. A missing estimate is flagged and uses a policy default of 0.5, not a model-invented value.

Course order contributes at most one bounded term and never blocks a qualified learner. A route of A->B->C->D may yield B->diagnostic(C)->D because target evidence is independent of navigation nodes.

### 10.3 Runtime episode policy

A default LEARN episode is challenge -> checkpoint -> feedback/diagnosis -> focused theory -> revised application -> structurally changed probe -> reflection when useful -> retrieval intent. Not every episode needs every phase. Use a short explanation if the task reveals a missing prerequisite; do not force a long lecture or gratuitous failure.

Difficulty changes by one observable dimension: reduced scaffolding, more failure modes, stronger proof obligations, changed operating assumptions, or larger design scope. A single opaque “difficulty: 9” is only an author estimate; separate declared from empirically estimated difficulty and sample counts.

### 10.4 Mode contract

| Mode | Help behavior | Learning interpretation |
|---|---|---|
| LEARN | Explicit aid contract; progressive hints; no unsolicited full solution by default; learner may request one immediately | Independent checkpoints and assisted progress distinguished |
| PAIR | Collaborate actively, explain trade-offs, no forced withholding | Attribute contributions; collect opportunistic observations without claiming independence |
| BUILD | Optimize for shipping; no diagnostic gates or pedagogical withholding | Capture optional, consented encounters and propose later LEARN exercises |

Mode is logged at attempt/checkpoint time. Switching BUILD to LEARN does not retroactively make prior agent-written code independent. A new sealed probe can establish fresh evidence. Keep mode visible and reversible.

## 11. Course package contract and lifecycle

### 11.1 Logical package layout

```text
manifest.json
locks.json                 # exact refs and digest/availability metadata
route.json                 # course-local organization and optional order
content/                   # optional bundled catalog objects, not learner state
proposals/                 # unapproved competency/graph/alignment proposals
validation-report.json
```

The compact schema/examples in this package serialize route/locks inline for ease of inspection. Both representations must normalize to the same contract before hashing/import.

The manifest declares schema version, course identity/release/title/issuer, metadata/license, target frame refs, artifact locks, route nodes, required capabilities, and release validation state. Modules/lessons are local route nodes with optional resource/activity refs and advisory predecessor nodes. A node may address several targets; several nodes may address one target.

Course files must not contain learner IDs, mastery scores, review dates, per-user hints used, completed flags, evaluator reliability weights, runtime policy code, API secrets, repository paths to a learner workspace, provider-specific tool calls, or implicit mutation commands. Unknown top-level fields are rejected. Namespaced extension metadata is inert and cannot affect core behavior unless a separately installed and versioned adapter recognizes it.

Rubrics, activities, frames, and sources are independent catalog/registry objects even when bundled in a course archive. Packaging location does not imply lifecycle ownership. A course can reference an external source without copying its text.

### 11.2 Import

Import pipeline: inert extraction and structural validation -> dependency resolution -> staged catalog records/proposals -> semantic validation -> preview of changes -> approved activation.

No arbitrary import-time scripts or remote schema execution. Reject path traversal, symlinks escaping the staging directory, zip bombs, excessive resource sizes, malformed content, unknown required capabilities, and unsafe source-fetch destinations. Remote content is untrusted data. Validate source rights/access and snapshot state. Unresolved mappings are visible validation errors, not guessed canonical IDs.

Re-importing identical course/release/content is idempotent. Same identity/release with different digest is `IMMUTABLE_RELEASE_CONFLICT`. Staging failures do not partially activate a route. A proposal that changes the registry requires a separate reviewed registry transaction; merely installing a course cannot rewrite definitions used by existing evidence.

### 11.3 Removal and replacement

Support three separate operations:

- Deactivate route: no new planning preference from that course; archive navigation.
- Remove course package: physically remove curriculum-owned route/install/version records and unpinned bundle bytes. Preserve independent catalog objects used elsewhere and historical evidence roots.
- Erase selected private learning data: explicit separate workflow with preview, consent, redaction/deletion policy, and stated effect on replay.

No `ON DELETE CASCADE` from curriculum to registry, content history capsules, learner events, judgments, observations, mastery, or retrieval. Cascades within curriculum-only navigation rows are acceptable.

Replacement is activate B/deactivate-or-remove A, not “migrate learner progress.” It may update course-progress projections and candidate availability, but does not emit new competence evidence. Existing accepted goals remain learner-owned unless explicitly changed. An in-progress attempt finishes against its pinned snapshot even if its original course is removed.

Normal garbage collection roots: installed content references, active authoring releases, retained attempts/evaluations, explicit saved resources, and legally permitted history requirements. Unreferenced unused lesson content can disappear. Keeping a minimal stimulus/rubric snapshot for an actual attempt is not covertly keeping the whole course installed.

## 12. Provenance, source support, and authoring

### 12.1 Two independent labels

`origin = human_authored | imported | model_generated` is not the same axis as `epistemic_status = supported | inferred | contested | unsupported | unknown`.

A model-generated explanation can be source-supported. A copied textbook assertion can be outdated or contested. A bibliography at course level does not establish support for every answer key.

A source edition records work ID, exact edition/commit/version when known, publisher/author, locator, captured-at, content digest only when actual bytes were captured, access/retention rights, and availability. A source span uses a section/page/paragraph/code range with edition context. Store cited passages where permitted. Do not fabricate a source digest from a URL.

Claims link to source spans with supports/contradicts/qualifies relations, interpretation origin, review state, and verification actor/run. Ground important assertions and rubric-critical answers at claim level; ordinary presentation prose need not create an ontology node for every sentence.

The W3C PROV distinction among entities, activities, agents, and derivations is a useful mapping for this lineage; RDF or a triple store is not required [R5]. Source popularity is not a correctness score. Unavailable/retracted/corrected sources create a content-quality issue and possible re-evaluation queue, not an automatic learner failure.

### 12.2 Authoring separation

Adapters ingest Markdown/PDF/textbook excerpts/syllabi/docs/repos into an **authoring intermediate representation** with raw source references, extraction confidence, and rights. They do not directly create production mastery or silently publish exercises.

Authoring workflow: research -> competency/frame proposals -> source/claim mapping -> task/rubric design -> adversarial answer review -> coverage/aid/novelty validation -> rights/security checks -> human release approval -> immutable course package. A compiler/validator converts the package into registry proposals, catalog artifacts, and curriculum routes.

Authoring needs permission to stage and publish content, not permission to edit learner evidence. It may use a sanitized preference/goal summary to personalize content. Never embed the learner ID or current mastery inside a reusable activity. Runtime generator outputs enter the same validation boundary, even if validation is cheaper for a constrained template.

### 12.3 Source search and embeddings

Index source editions and spans by stable content identity and authorization scope, not solely by course folder. Removing a course may remove route annotations without destroying historical citations. Embeddings are provider/model-versioned caches and are rebuildable; evidence correctness cannot depend on access to one vector database. Retrieval authorization must happen before private text is passed to a model.

## 13. Projects, providers, and security

### 13.1 Project context adapter

`ProjectContextPort.capture(request)` returns a sanitized immutable snapshot descriptor: workspace/project ID, commit or revision, dirty-diff digest if consented, selected file/trace/artifact refs, actor attribution, tool/environment facts, access scope, and capture time. The core cannot assume Git, a branch name, a local path, a particular language, or the user's orchestrator.

A project encounter is a proposed learning opportunity with source refs and uncertain competency mappings. It is not proof of mastery. Converting it into an exercise requires a redacted/synthetic standalone task, stable frame binding, a valid rubric, and a family relationship to the original encounter. The exercise must run without checking out the live repository.

Default first slice: no repository crawling, no background surveillance, no external write access, and no arbitrary submitted-code execution. Code/trace answers may be inspected, but an unrun test is never reported as passing. A later runner adapter must provide a real sandbox boundary before executing untrusted artifacts.

### 13.2 Model/provider abstraction

Define task-specific contracts for tutor action, criterion evaluation, exercise proposal, source research, and misconception hypothesis. A common provider port carries an input bundle, expected output schema, prompt/template revision, required capabilities, privacy policy, cost/token/time budget, and cancellation/deadline.

Return validated structured output or explicit errors (`MODEL_UNAVAILABLE`, `CAPABILITY_UNSUPPORTED`, `OUTPUT_INVALID`, `BUDGET_EXCEEDED`, `PRIVACY_BLOCKED`). Provider drivers normalize APIs; policies route roles to capable models. Do not reduce provider independence to a string argument while depending everywhere on one vendor's thread/tool/file IDs.

Record provider/model identifier and revision if available, model run ID, prompt revision, configuration excluding secrets, actual input/output artifacts or permitted redacted forms, selected source/context spans, validation result, latency/cost metadata when available, and replay limitations. Store final structured justifications, not inaccessible hidden reasoning.

Two reproducibility promises: (1) replay saved judgments into deterministic projections; (2) re-evaluate saved inputs with a model as a **new experiment**, which may differ. Seeds and temperature zero do not guarantee an identical future remote model response.

### 13.3 Safety and privacy boundary

Treat course text, source documents, repositories, generated tasks, and submitted answers as untrusted inputs. They cannot grant tools or override evaluation criteria. Keep solutions/held-out artifacts separate from learner-visible candidate summaries. Prevent accidental answer leakage in tutor retrieval and diagnostics.

A runner capability needs least-privilege isolation, no host credentials, no default network, resource/time/output limits, immutable image/runtime versions, disposable working copies, and artifact capture. Installing content must not install a runner or execute its tests on the host. Authorized project writes require a separate user action and explicit scoped tool permissions.

Store secrets separately from replay artifacts. Redact before transmitting to providers. Capture consent for repository/model egress and retention. Rights/privacy restrictions follow source-derived exercises and export artifacts. A visible privacy policy must say which data are local, externally transmitted, retained, and erasable.

## 14. Evaluation, UX, and observability

### 14.1 Measure actual capability separately from experience

Primary outcome families: unassisted held-out success under a named frame; delayed retrieval after known exposure intervals; transfer to reviewed new structural families; recurrence/resolution of specific misconception hypotheses; implementation correctness when actually tested; and coverage of goal-scoped prerequisite/foundation targets.

Secondary product measures: learner frustration, useful-session completion, setup friction, time-to-first-meaningful-task, and cost. These matter operationally but do not establish learning. Do not optimize clicks, AI message counts, easy-task pass rates, or course percentage.

A controlled active-learning study found a distinction between students' feeling of learning and measured learning in its classroom context. It supports keeping these measures separate, not a guarantee that every difficult experience is educational [R6].

### 14.2 Assessor and tutor evaluation

Maintain a gold/anchor set with deliberately correct concise answers, eloquent wrong answers, valid alternative approaches, ambiguous questions, unsupported claims, partially observed skills, environment failure, answer leakage, model disagreement, and prompt-injection attempts. Evaluate false mastery grants, false weaknesses, abstention quality, and reliability by frame/criterion/method. A test that only compares model outputs with another model is insufficient.

Keep benchmark/holdout families separate from tutoring examples, practice generation, prompt tuning, and judge calibration splits. Exposure records persist across courses. A task already discussed in BUILD is not an unseen assessment when later relabeled by a new course.

### 14.3 Experiments

Record experiment ID/revision, assignment rule/seed, eligible actions, chosen action, policy versions, target frames, pre-intervention evidence cursor, exposure history, budget, and outcome schedule. Record assignment probability only when actually randomized; do not invent propensities for deterministic plans.

For one learner, learning is nonstationary and carries over. Use repeated matched held-out probes, counterbalanced strategy assignments where feasible, and uncertainty-aware N-of-1 analysis. Do not claim clean causal superiority from a conventional crossover that assumes learned knowledge washes out. Shared estimators/graders can confound comparisons; freeze or log them and preserve independent holdout outcomes.

### 14.4 UX minimum

First UI/CLI needs Today/Session, Attempt, Evidence, and Review. Course browsing can be minimal. Today shows mode, budget, selected task, why it was selected, and bypass/request-theory actions. Evidence shows raw work, exact criterion, aid use, assessment basis, disputes, and what changed. Review shows capability due and whether suitable content exists, not just flashcards.

Knowledge Map later shows evidence by facet/scope, missing/uncertain/stale/conflicting states, and goal-relative foundation coverage. Course progress is clearly a route-navigation view and may change with versions without altering knowledge history.

### 14.5 Decision records

Every plan/skip/hint/review/mastery revision references input evidence cursor, exact policies, target definitions and mappings, candidate set, score terms or rules, accepted/rejected evidence with reasons, and source/model runs where relevant. A helpful summary is stored alongside machine-readable inputs; neither should require reconstructing an opaque chat transcript.

Queries must answer: why this task; why this capability claim; what contradicts it; what was not observed; what has become stale; why this hint; why this difficulty; what source grounding is missing; and what changed this session. Unknowns remain explicit.

## 15. Initial learner model and diagnostic

### 15.1 Initial profile

Self-reported facts: 6+ years of engineering experience including approximately 2 years independent work/agent work; backend APIs, services, asynchronous systems, substantial codebases; Java/Python and prior C++; active use of coding agents; current agent-orchestrator project coordinating tools such as Claude Code, Codex, and OpenCode.

Self-reported preferences: challenging implementation/problem-first work; brief diagnostics instead of unnecessary introductory repetition; active testing and reflection; systematic fundamentals alongside projects; explicit LEARN/PAIR/BUILD boundaries; inspectable judgments and real verification.

Initial goal proposal: reliable concurrent/distributed execution relevant to orchestration. This is not the permanent curriculum. Python/TypeScript strengthening is a goal/context, not a weakness claim.

Unknown until observed: depth of memory-model reasoning, distributed failure reasoning, lease correctness, transaction boundaries, proof/derivation skill, transfer, and independent performance with limited AI help. Do not initialize all these to either mastered or weak.

V1 timezone default: Asia/Kolkata, editable. Session duration and weekly study budget are unset until the learner chooses; a 30-minute session is a UI suggestion, not an inferred long-term preference.

### 15.2 Small competency slice

Use six core targets: reason about concurrent interleavings; design idempotent effects under retries; reason about lease expiry/stale actors; choose retry/backoff policies under load; diagnose worker failure and ambiguous delivery; reason about backpressure and bounded work. Supervision and distributed coordination are applied contexts or later extensions, not a reason to prebuild an entire CS ontology.

Each target begins with a reasoning/diagnosis frame. Add construction/derivation frames only where exercises actually observe them. Fundamentals include failure models, atomicity, invariants, partial knowledge after timeout, and the boundary of an externally visible side effect.

### 15.3 Initial diagnostic episode

Present a realistic orchestrator trace: a worker claims a job, invokes an external side effect, loses an acknowledgement, pauses beyond its lease, and later resumes after another worker takes over. Ask the learner to identify possible histories, state an invariant, specify what can and cannot be inferred, and design a change plus an adversarial test.

Do not grade “exactly once” as universally impossible or universally solved. Require explicit scope, fault model, transaction boundaries, and downstream cooperation. AWS's idempotent API design and the Chubby paper are source candidates for the retry/ownership discussion; the author must validate each answer-key claim against the actual relevant source sections [R7, R9].

A composite task is an efficient entry point but a weak universal diagnosis. Rubric criteria separate effect deduplication, stale authority, timeout ambiguity, and overload. A failure with several plausible causes triggers one narrow disambiguating probe; it does not mark every competency failed. A strong correct answer triggers a changed constraint, not another syntax exercise.

Allow 15–25 minutes as an editable task estimate, not a user commitment. Offer a direct-theory escape and optional hints. An initial success creates provisional bypass; a later unseen delayed probe provides stronger evidence. Do not claim real verification merely because an LLM likes the reasoning.

## 16. Storage, export, and deletion

Logical tables for the first slice: learner/profile assertions; goal revisions; competency identities/revisions; frame revisions and reviewed alignments; immutable typed content records; criterion bindings; course versions/routes; activity instances/attempts/checkpoints; learning ledger and command receipts; judgment revisions/active selection; observations; mastery projections; retrieval intents; session plans/decision records; artifacts; optional model runs/jobs.

Physical consolidation is permitted for immutable typed catalog records, with a discriminator and strict schemas. Do not turn the entire domain into unvalidated JSON or EAV. Keep relational identity/reference constraints for active evidence, ownership, uniqueness, and lifecycle relationships. Store large responses/source bytes outside hot event rows, referenced by durable artifact descriptors.

The authoritative layer is original observations/work plus interpretation dependencies and corrections. Projections, search indexes, and embeddings are rebuildable. Backups must include permitted artifact bytes, not only the database. Test restoration with course tables empty and provider access disabled.

Export bundle: manifest/schema versions; learner/profile/goals/consent; registry and frame definitions needed by history; alignments; append-ordered events as NDJSON; accepted and superseded judgments; observations; attempt/checkpoint and source/provenance metadata; policy definitions/versions; model-run metadata and permitted inputs/outputs; checksums; optional artifact bytes; and an omission/replayability report. Optional course packages are a separate section, not required for learner-history recovery.

Preserve stable IDs on restore. Conflicting identities/versions must be resolved explicitly; never merge by display name. A target database adapter may differ, but portable data does not mean migrations or database-specific transaction code can disappear.

Privacy erasure is an explicit exception to normal append-only retention. Delete/redact affected payloads, blobs, embeddings, cached contexts, exports under system control, and applicable backup material according to a documented retention policy; preserve only permitted tombstone/audit metadata. Rebuild projections and say what historical explanation or re-evaluation is now unavailable. Do not promise deletion from external providers beyond their actual supported controls.

## 17. Implementation sequence for the next authorized agent

| Stage | Build | Verification/exit criterion |
|---|---|---|
| 0 | Inspect actual repository; baseline tests; record architecture decisions and deviations | Report observed environment and real test results; do not invent repository facts |
| 1 | Typed refs, registry/frame governance, immutable catalog, staged package import, A/B routes | Exact-version conflicts, invalid references, course-only deletes, and unknown fields tested |
| 2 | Attempt snapshots/checkpoints, events, judgments, deduplicated observations, command idempotency | Regrade, hint exposure, restart, duplicate command, and invalid environment cases work |
| 3 | Baseline projector, retrieval intents, pure planner with fixed clock | Unknown differs from failure; due obligations survive course replacement; decision traces inspectable |
| 4 | CLI/thin UI connecting diagnostic -> attempt -> evaluation -> projection -> review | A real person completes the loop; artifacts and updates visible; deterministic/manual assessor first |
| 5 | Full A/B/zero-course/non-engineering acceptance suite; export/restore | Physical course deletion and learner-state replay pass with no provider calls |
| 6 | One provider adapter and structured evaluator/tutor behind the same contracts | Mock tests plus a separately reported real-provider smoke test when credentials/consent exist; invalid output abstains |
| 7 | Optional sandboxed implementation exercises and project context adapter | Actual environment verification and privacy/permission tests before enabling execution |

The first meaningful version ends after stages 1–5 and a narrow live learning loop. A production LLM tutor is optional for proving the central invariant, but useful learning trials will need reviewed assessment/feedback rather than canned pass records. Synthetic fixtures test architecture; they are not evidence that the product educates the learner.

Do not initially implement universal PDF/course ingestion, automatic ontology merging, adaptive-model training, multi-agent authoring, elaborate dashboards, automated repository writes, or untrusted code execution. Leave their ports and error cases, not speculative implementations.

## 18. Decisions, uncertainties, and release gates

### Decisions made

Opaque identity plus immutable revisions; independent content and frame registries; learner-owned goals and evidence; per-frame estimates; conservative assistance treatment; regrading through explicit selection of judgments; competency-scoped retrieval; course-order hints only; inert content packages; model outputs as proposals; modular monolith; no execution of untrusted artifacts in the initial slice.

### Consequential open questions with safe defaults

| Question | Safe starting default | When it must be resolved |
|---|---|---|
| May private code/prompts leave the machine? | No external repository egress without explicit scope/consent | Before real provider/project integration |
| How much source text may be retained/exported? | Metadata, permitted excerpts, and learner-owned work only; flag missing snapshots | Before importing restricted books/courses |
| Who approves competency equivalence and answer keys? | Learner/manual reviewer; model suggests only | Before publishing or migrating affected content |
| What means independent engineering performance? | Per-frame allowed aids; record declaration/observed use; do not pretend external surveillance | Before graded diagnostic launch |
| How long retain raw prompts/work and backups? | Preserve learning history; expose retention controls; no indefinite secret retention | Before sustained real-data use |
| What theory coverage is required? | Goal-scoped six-target foundation contract, editable | Before widening curriculum |
| Which estimator and spacing parameters work best? | Documented heuristic defaults; no calibrated-confidence claims | Resolve through held-out/delayed evaluations, not architecture speculation |
| Existing repository/hosting/authentication constraints? | Unknown; local single-user development, fail closed for remote access | When a real repository/deployment is available |

No unresolved question prevents a synthetic, local design-validation slice. Consent, rights, and execution isolation block the relevant real-data feature, not the entire core.

### Release conditions

All architecture acceptance scenarios are automated; actual database and interface paths tested; provenance/assistance/corrections inspectable; no hidden course ownership; no false “tests passed” for unrun artifacts; and export/restore works without installed courses or an LLM. Educational efficacy remains an ongoing measured hypothesis.

The durable product is the system's ability to preserve interpretable evidence and revise its beliefs responsibly—not a permanent numerical opinion about the learner.


## 19. Contract clarifications

`contracts/INTERFACES.md` makes the aggregation order, semantic validation, current-status precedence, stale/review windows, and API errors explicit. Embedded validation fields in immutable content are snapshots of authoring review state; independent validation attestations provide the effective reviewed status for runtime use. An attestation cannot change a rubric or declare partial coverage to be complete without a supporting review report. The JSON examples remain draft and are not claimed to be deployable assessments.


## 20. Final decoupling audit

The following formalization makes the primary acceptance claim precise. Let H be retained occurrences/work plus pinned assessment context; J the active judgment/adjudication view; K the relevant definitions and approved alignments; P the estimator policy; and t an explicit clock. Then M = estimate(H, J, K, P, t). Installed courses do not appear in this signature. Two invocations with those inputs unchanged must produce the same semantic mastery result. Course removal can legitimately alter available candidates and normalized route suggestions, not H/J/K/P.

Let R = schedule(H, J, K, learner_goals, retrieval_policy, t). Content availability is resolved separately: binding a scheduled need to an exercise can succeed or be blocked without resetting R's capability target, due time, or evidence basis. The planner is allowed to depend on candidate availability and advisory routes; it is not allowed to smuggle course progress into evidence.

| Attack | Required result | What would reveal coupling |
|---|---|---|
| Delete every course row | Knowledge and evidence remain readable/replayable | Join to a live course required for grading/history |
| Delete every unused lesson | Retained attempts remain interpretable | Response refers only to a vanished lesson URL |
| Rename/reorder curriculum | Only route advice/navigation changes | Scalar mastery changes from lesson position |
| Replace exercises | Reviews bind to compatible new tasks | Schedule key is an exercise ID |
| Replace answer key/rubric | Old judgment remains pinned; explicit regrade optional | History renders latest rubric silently |
| Import conflicting “same skill” | Staged alignment proposal | Slug/name auto-merges learner state |
| Split competency | Preserve root evidence, diagnose unproven children | Copy the old score to every child |
| Move to BUILD | Direct help, attribution preserved | Later task relabeling grants independence |
| Change repository/branch | Old context snapshot persists or precise missing-artifact status | Grading reads the live branch |
| Source changes/disappears | Edition/claim provenance and limitations visible | Evidence silently changes with live webpage |
| Provider/index replacement | Saved-judgment replay works | Mastery requires vendor thread/file/vector IDs |
| Add non-software prose course | Same core loop, no repository capability required | Core switches on engineering concept slugs |
| Add genuinely new modality | Install a bounded renderer/evaluator capability if necessary | Course uploads arbitrary executable core logic |
| Explicitly erase private history | Reproject and disclose lost replayability | Course uninstall masquerades as privacy erasure |

These are failure-oriented design obligations. The supplied schema checks establish structural consistency only. The actual implementation must demonstrate the database, API, and behavioral properties before calling the architecture proven.
