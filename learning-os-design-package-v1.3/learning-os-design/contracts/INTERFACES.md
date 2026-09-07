# Contracts, commands, and semantic invariants

This document specifies interfaces; it is not executable application code. JSON Schema record definitions are in `contracts.schema.json`. The coding agent may express them as Python dataclasses, Pydantic models, TypeScript types, or equivalent, but must preserve their semantics.

## 1. Contract conventions

`Ref` is the serialized shape `{id: UUID, revision: positive_integer}`. In application code, brand/type each reference by entity kind: `FrameRef` is not interchangeable with `ActivityRef` merely because both serialize identically. `PolicyRef` is `{key, revision, digest}`; policy configurations themselves are immutable, exportable artifacts. UUIDs are opaque; do not extract curricular meaning from an ID or slug.

A `record_kind` and `schema_version` identify an interchange record. The schema bundle rejects undeclared record properties. This does not establish truth, privacy, rights, cross-record validity, or algorithm correctness. Apply the semantic rules below after structural validation.

Every time-dependent pure function takes an explicit `as_of` clock value. Every deterministic output pins the exact policies, registry/alignment view, and evidence cursor. No pure core function reads wall-clock time, environment variables, a provider, a course repository, or a database implicitly.

The included examples are **synthetic drafts**. Publishing them requires a review/validation boundary. Test-only reviewer attestations may stand in for real review in a test database, but no production setting may globally approve draft content.

## 2. Pure learning ports

Signatures below use language-neutral notation. `Result<T, DomainError>` is a tagged success/error result, not an exception swallowed into an empty list.

```text
MasteryEstimator.project(
  target: AssessmentFrameRevision,
  evidence: ActiveEvidenceView,
  estimator: EstimatorPolicy,
  alignment: ApprovedAlignmentView,
  as_of: Instant
) -> Result<MasteryProjectionProposal, DomainError>

RetrievalScheduler.reconcile(
  prior_intent: RetrievalIntent | null,
  target: AssessmentFrameRevision,
  exposure: ExposureView,
  evidence: ActiveEvidenceView,
  goal_maintenance: MaintenancePolicy,
  scheduler: RetrievalPolicy,
  as_of: Instant
) -> Result<RetrievalIntentProposal, DomainError>

SessionPlanner.plan(
  learner: LearnerPlanningView,
  goals: GoalView,
  targets: TargetGraphView,
  evidence: MasteryViewAtCursor,
  retrieval: RetrievalIntent[],
  route: RouteIntent | null,
  candidates: ActivityCandidate[],
  constraints: { mode, minutes, capabilities, privacy_scope, overrides },
  policy: PlannerPolicy,
  as_of: Instant
) -> Result<SessionPlanProposal, DomainError>

EvidenceNormalizer.propose(
  frozen: ActivityInstanceSnapshot,
  checkpoint: Checkpoint,
  judgment: EvaluationRevision,
  validation: AssessmentValidationView,
  policy: ObservationPolicy
) -> Result<ObservationSetProposal, DomainError>
```

`Proposal` results have no persistence side effects. The application assigns persistent record IDs when accepting a proposal; pure algorithms do not generate random IDs. Determinism tests compare semantic proposal payloads, not newly allocated database identifiers. The record schemas describe the accepted persisted forms. The application accepts them under a transaction with expected revisions. `EvidenceNormalizer` is deterministic and does not independently ask a model whether to trust its own answer.

No argument above contains a Course/Lesson/Module object, enrollment record, course-relative learner score, raw repository checkout, or provider-owned conversation ID. Optional course-origin labels belong only in application-level historical provenance, excluded from estimator and scheduler inputs.

### 2.1 Read ports

```text
RegistryReader.frames(exact_refs) -> exact definitions or MISSING_DEPENDENCY
RegistryReader.graph(scope, revision) -> approved assertions
RegistryReader.alignments(revision) -> explicitly permitted compatibility mappings
ContentReader.candidates(frame_refs, capabilities, access_scope) -> catalog candidates
ContentReader.freeze(activity_ref, parameters, aid_contract) -> ActivityInstanceSnapshot
CurriculumRouteAdapter.resolve(course_selection, locked_version) -> RouteIntent
SourceRetriever.search(query, source_scope, access_scope) -> SourceSpan[]
SourceRetriever.resolve(span, access_scope) -> SourceMaterial | SOURCE_UNAVAILABLE
EvidenceReader.active(learner_id, frame_refs, through_cursor) -> ActiveEvidenceView
ExposureReader.history(learner_id, frame_refs, family_ids) -> ExposureView
```

A curriculum adapter translates advice only. It cannot supply mastery values or current due dates. ContentReader is not restricted to installed courses unless a user explicitly selects that content scope. The default selected course is a preference; goal/foundation/review candidates can come from the independent catalog.

### 2.2 Integration ports

```text
ModelPort.execute(
  task_kind, input_bundle, output_schema_ref, prompt_policy,
  required_capabilities, privacy_policy, deadline, cost_budget
) -> ValidatedModelResult | ModelError

ProjectContextPort.capture(
  context_id, requested_scope, consent_ref, revision_selector
) -> ProjectContextSnapshot | ContextError

RunnerPort.execute(
  immutable_task_bundle, runner_capability, resource_limits,
  permitted_network_policy, cancellation
) -> RunArtifacts | RunnerError

AuthoringImporter.ingest(source_descriptor, access_scope)
  -> StagedAuthoringRepresentation | ImportError

PackageCompiler.validate_and_compile(staged_package, registry_view, review_attestations)
  -> PublicationProposal + ValidationReport | PublicationErrors
```

RunnerPort is intentionally unimplemented/disabled in the first slice unless a genuine isolation boundary is verified. A unit-test stub proves port conformance, not sandbox safety. A course may declare `requires execution.python.v1`, but cannot add that capability itself.

## 3. Application commands and query API

Transport can be HTTP or a CLI dispatch layer. These logical command names and outcomes are normative; URL spelling is a reversible default.

| Command / suggested endpoint | Required payload beyond authorization | Result and atomic effects |
|---|---|---|
| `StagePackage` / `POST /v1/package-imports` | Local package artifact, package digest, command ID | Staged immutable records + validation report; no learner changes |
| `PublishValidation` / `POST /v1/validations` | Exact subject ref/hash, scope, decision, report, reviewer | Independent immutable attestation; not semantic content modification |
| `ActivateCourse` / `POST /v1/course-installations` | Exact course ID/release/digest, expected registry view | Activated route; cannot auto-adopt goals or create mastery |
| `RemoveCourse` / `DELETE /v1/course-installations/{id}` | Removal mode, expected install revision, command ID | Curriculum-only delete; history unaffected; content availability refreshed separately |
| `AdoptGoal` / `POST /v1/goals` | Explicit target/foundation frame refs, priority, maintenance choice | Learner-owned goal revision + event |
| `PlanSession` / `POST /v1/session-plans` | Learner, mode, budget, selected routes optional, minimum evidence cursor | Pinned plan + decision record or explicit no-valid-activity result |
| `StartAttempt` / `POST /v1/attempts` | Selected activity ref/parameters, mode, aid agreement, command envelope | Frozen stimulus/rubric/bindings/frame definitions + start event |
| `SealCheckpoint` / `POST /v1/attempts/{id}/checkpoints` | Response artifact, aid declaration, expected attempt revision | Immutable checkpoint; no grade merely from submission |
| `RequestHint` / `POST /v1/attempts/{id}/hints` | Requested hint/action, current response optional, expected revision | Seal pre-hint checkpoint if provided; reveal allowed content; append assistance |
| `SubmitAttempt` / `POST /v1/attempts/{id}/submission` | Checkpoint ID, expected revision | Submitted attempt + evaluation job/command; no optimistic success |
| `EvaluateAttempt` / internal command | Frozen input digest, evaluator profile, checkpoint/rubric refs | Candidate judgment revision; provider failure leaves pending/error, not zero score |
| `SelectJudgment` / `POST /v1/judgment-selections` | Judgment-set ID, selected revision, expected previous selection, review rationale | Selection event, active observation replacement, projections and retrieval update |
| `DisputeJudgment` / `POST /v1/disputes` | Judgment ref, specific criteria, reason | Visible dispute; preserve original judgment; queue adjudication |
| `OverridePlan` / `POST /v1/overrides` | Type, target, expiry/scope, reason | Policy override event, never fabricated performance |
| `SwitchMode` / `POST /v1/sessions/{id}/mode` | New mode, current checkpoint when applicable | Mode boundary event; old assistance history immutable |
| `CaptureEncounter` / `POST /v1/project-encounters` | Sanitized snapshot and consent/attribution | Opportunity record only; no direct mastery update |
| `ExportLearner` / `POST /v1/exports` | Data/artifact scopes, encryption/retention choice | Portable bundle + omissions/replayability report |
| `EraseData` / explicit separate workflow | Exact scope, preview token, confirmation, retention policy | Erasure/redaction + tombstones + reprojected state; never invoked by RemoveCourse |

All learner-changing commands carry an idempotency ID and expected revision where appropriate. Server code computes/verifies the payload digest; it does not trust a client-provided digest without checking bytes. Same command key/different payload is an error. Commands must authorize the learner scope independently of the IDs in the body.

Initial queries:

```text
GET /v1/knowledge?frame_ref=...&as_of=...&estimator_revision=...
GET /v1/evidence/{observation_id}       # response, rubric, aid use, provenance, active/superseded
GET /v1/decisions/{decision_id}        # reasons, inputs, scored/excluded candidates
GET /v1/review                        # due, paused, blocked, expected effort
GET /v1/content-gaps                  # missing/invalid resource or assessment coverage
GET /v1/sessions/{id}/changes         # before/after at explicit evidence cursors
GET /v1/sources/{id}/revisions/{rev}  # pinned metadata, claim spans, availability
```

A knowledge query returns frame-specific limits and current evidence cursor, not only a numeric mastery score. A course-progress query must identify the exact course release and progress policy; its percentages are not input to the estimator.

## 4. Semantic validation beyond JSON Schema

### 4.1 References and release integrity

Every exact ref must resolve to the declared kind and revision, except an explicitly unavailable historical metadata reference. Historical capsules contain the minimum required definition snapshots independently of a course installation. Reject a newer definition substituted for a locked revision.

Every package lock hashes the **exact supplied UTF-8 file bytes**; no checksum is claimed for uncaptured external source content. Relative paths are normalized within the archive/staging root; reject absolute paths, parent traversal, unsafe symlinks, and duplicate names after normalization. If semantically equivalent JSON has different serialization bytes, its published byte digest differs; an importer must not quietly rewrite bytes then claim the old digest.

A published release is immutable. Authoring drafts may be edited in staging; they acquire new immutable records/locks at publication. Status/review changes about an existing immutable record are separate validation attestations, not edits to its semantic payload. A substantive correction requires a new content revision and an impact report.

### 4.2 Package/route rules

Course local node IDs are unique within the release. Every suggested predecessor exists in that route and the advisory order has no unintended cycle; reject malformed cyclic suggestions rather than blocking the learner indefinitely. Frame/activity/resource refs must be present in locks or explicitly resolved dependency locks. No lesson-local competency alias may silently become a global identity.

A nested field scan rejects known learner-state/secret fields in manifest/proposals, but textual inspection remains needed: JSON Schema cannot prove that arbitrary prose contains no personal information. Runtime core never executes course text as instructions or accepts its proposed mastery values.

A course can bundle competency/graph proposals, but publication cannot silently accept an alignment that would reinterpret another course's learning history. That requires a separately reviewed registry/alignment action.

### 4.3 Assessment rules

Activity, rubric, and binding exact refs agree. All criterion IDs in a binding or evaluation exist in the pinned rubric. Each bound frame belongs to the expected competency and permitted facet/scope. `attribution_fraction` sums to at most 1 for each atomic criterion; fractions are not global course grading weights.

A validation attestation must distinguish full-frame assessment coverage from partial practice coverage. Partial coverage may record criterion observations and inform a narrow diagnosis, but is ineligible to establish a complete-frame skip claim. V1 estimator inputs require full-frame admissible samples for the scalar frame estimate; partial observations remain visible evidence and planning signals without being falsely pooled as complete tests.

Criterion outcomes `not_observed`, `ambiguous_task`, `invalid_environment`, `evaluator_failure`, or `withdrawn` must have `score = null`; they cannot be coerced to zero. `correct`, `partially_correct`, and `incorrect` have finite scores in [0,1] and must agree with anchor semantics. Only a scored valid criterion can emit a scored performance observation. A missing critical criterion disqualifies the attempt-frame sample from bypass/durable-support status.

`critical_failure` is derived from the pinned rubric and accepted outcome, not a model's unchecked boolean. An unresolved critical contradiction persists until an explicit resolution/adjudication references appropriate independent repair evidence; a fluent later answer cannot silently delete it.

Frame `allowed_aids` plus recorded checkpoint conditions determine admissibility. Unknown aid use yields unknown independence and no independent-skip eligibility. Verified disclosure beyond allowed aids after a checkpoint does not retroactively contaminate that earlier sealed response. Earlier solution exposure may still make the family non-novel.

A criterion-validated deterministic evaluator can certify the property it actually tests, not all reasoning about it. A test exit code cannot certify a proof unless the frame explicitly defines that evidence standard.

### 4.4 Exact v1 aggregation sequence

1. Resolve active judgment selection and observation corrections through the evidence cursor.
2. Select compatible frame targets using reviewed exact-equivalence mappings only. Retain root identity through every mapping.
3. Select valid, aid-compatible, full-frame assessment samples. Keep partial/assisted/unknown observations outside the scalar sample set and expose why.
4. Group observations by `(attempt, checkpoint, frame)`. Multiple evaluations of the same root are never extra observations. Select the checkpoint fixed by the accepted judgment set; do not independently cherry-pick the best checkpoint per criterion.
5. Within a sample, derive each criterion's base weight from assessor profile and attribution fraction. Normalize so the sample contributes at most one total evidence unit to the frame. Compute `sample_score = sum(weight*score)/sum(weight)`. A zero denominator means no sample.
6. For point/interval estimation, retain the latest admissible **sample**, not only one criterion, per `(frame, family, captured_session_local_date)`. Ties use committed event sequence. The timezone used for this grouping is stored with the attempt/session and does not change when the user's current timezone changes.
7. Apply the Beta heuristic to those selected sample scores/weights. Report included/excluded roots and reasons. Keep all contradictory history available to the conflict-status rule even when a later same-day sample is selected for estimation.
8. Compute evidence-sufficiency gates separately from the numeric posterior. Distinct families and validated contexts are required; three rewordings of one template are not three families.

The machine record schemas carry raw observations and decision artifacts; this aggregation is the normative meaning. Implement property tests for sample-weight caps, order independence for an equivalent committed evidence set, and exact-equivalence deduplication.

### 4.5 Status and freshness rules

For a view at `as_of`, apply precedence: no admissible samples -> `unknown`; unresolved valid critical contradictions/disputes -> `conflicting`; previously supported/provisional evidence with stale retrieval -> `stale`; passed diverse/delayed support gates -> `supported_within_scope`; otherwise -> `provisional`.

Define v1 stale retrieval as `as_of > due_at + max(7 days, 0.5 * current_interval)`, using the applicable accepted retrieval intent even when no content exists. This is a **policy warning**, not a calibrated forgetting probability. Pausing a goal changes urgency/display but does not delete the underlying due/freshness facts. Store underlying qualification and freshness reasons in the decision record so a single status label does not hide them.

A conflict-only history with no admissible full-frame sample still needs an explicit contradiction/partial-evidence warning rather than a reassuring empty state. No scalar mean is shown as established knowledge where evidence is absent.

### 4.6 Scheduling and planning edge rules

Set a review window of due-at through due-at + min(7 days, max(1 day, 0.25 * interval)) in v1; choosing within the window is a planning issue. Storage uses UTC and the session's timezone for the learner-facing date. Exposure observed only at day granularity cannot support a precise second-based delay claim.

An initial qualifying teaching/repair episode starts interval index 0 (one day). A scheduled due success advances one index, capped at 5. A skipped/unavailable/invalid review does not count as failed. A same-day/early repeat does not advance. A qualifying failure resets to index 0 with due-at on the following local day. Policy defaults are data and export with the history.

Course availability changes may move an intent between scheduled/due and `blocked_no_valid_content`, but may not reset its target, due-at, interval, prior exposure, or evidence basis. A content availability update is not a scheduler success/failure event.

A goal-independent background process must not create review debt for every imported topic. Only explicit learner goals/maintenance choices or already accepted learning obligations produce active intents. All candidate catalogs and centrality computations are scoped accordingly.

For a single route target, normalized route rank is 1. For n>1 targets, use `1 - rank/(n-1)`; absent suggestions are 0. Within a lane, ties use stable candidate ID. A goal has no eligible source/task when its candidates fail validation, rights, capabilities, or novelty conditions: return a blocked need, never an invented easy question disguised as a valid diagnostic.

For foundational-coverage quota accounting, count accepted, learner-chosen LEARN time allocations, not raw wall-clock time on an open tab. Skipped/interrupted work does not magically satisfy coverage. The seven-session and time-budget policy is a scheduling allocation heuristic, not a learning metric.

## 5. Persistence constraints and update boundaries

The following are database invariants, enforced by constraints plus transactional application logic where a relational constraint alone is insufficient.

| Invariant | Enforcement |
|---|---|
| Stable content revision | Unique `(kind,id,revision)` and immutable digest; reject differing payload |
| Stable competency revision | Unique `(competency_id,revision)`; no cascade from course |
| Command idempotency | Unique `(learner_id,command_id)` plus stored payload digest/result |
| Committed learner order | Unique `(learner_id,sequence)` allocated under learner-head lock in same commit |
| Judgment selection | One current selection per judgment-set ID; optimistic compare-and-swap old revision |
| Root outcome identity | Stable root per checkpoint/criterion; never new root merely for regrading |
| No double active evidence | Unique accepted root/frame attribution per current selection/alignment view |
| Projection freshness | Evidence cursor and policy refs mandatory; planner reads at least command cursor |
| Retrieval deduplication | One current intent per `(learner_id,frame identity/revision)` unless explicit distinct goal-frame semantics |
| Course deletion isolation | No cascade or required live FK from evidence/mastery/retrieval to course tables |
| Historical dependencies | Attempt/evaluation artifact roots pin permitted minimum snapshots; failed/missing artifact cannot produce false replay guarantee |
| Privacy boundary | Learner-scoped authorization for every command/query; no reliance on UUID secrecy |

The application may physically store immutable typed content kinds in one catalog table; kind-specific schema validation and typed-reference checks still apply. Avoid table names as a rigid requirement. Avoid a generic unvalidated `metadata` field as the only representation of consequential semantics.

The first slice updates observation selection, mastery projection, retrieval revision, and command receipt together. Deferred projectors require freshness tokens and explicit stale behavior before they can replace this atomic path.

No network call inside a learner-head lock. Artifact upload uses a ready/finalized descriptor before acceptance; a crash leaving an unreferenced artifact is a garbage-collection issue, not a partially accepted attempt. Do not expose accepted evidence pointing at a never-durable response.

## 6. Error vocabulary and behavior

| Code | Expected handling |
|---|---|
| `SCHEMA_UNSUPPORTED` | Keep package/record quarantined; migration/import adapter required |
| `SCHEMA_INVALID` | Report exact field paths; no partial activation |
| `IMMUTABLE_RELEASE_CONFLICT` | Require new revision/release or identical bytes |
| `MISSING_DEPENDENCY` | Identify exact missing ref; do not substitute “latest” |
| `UNAPPROVED_ALIGNMENT` | Quarantine attribution; preserve original identities |
| `ASSESSMENT_UNVALIDATED` | Permit authoring preview, not real graded selection |
| `PARTIAL_FRAME_COVERAGE` | Expose partial evidence; no full-frame skip/score claim |
| `NO_VALID_ACTIVITY` | Return content-gap/blocked-intent details |
| `CAPABILITY_UNSUPPORTED` | Offer an alternative only if valid; never execute by another unsafe path |
| `SOURCE_UNAVAILABLE` | Retain citation/history; block source-critical new assessment or disclose bounded limitation |
| `ARTIFACT_UNAVAILABLE` | Preserve metadata; mark re-evaluation limitation; do not reconstruct from model memory |
| `PRIVACY_BLOCKED` | Do not transmit data; require separately scoped consent |
| `IDEMPOTENCY_CONFLICT` | Reject key reuse with changed payload |
| `REVISION_CONFLICT` | Refresh/reconcile against current aggregate; no lost update |
| `PROJECTION_STALE` | Wait/reproject or return explicit pending state |
| `EVALUATOR_ABSTAINED` | No scored observation for the abstained criterion |
| `OUTPUT_INVALID` | Preserve model run; no judgment acceptance; bounded retry/adjudication |
| `MODEL_UNAVAILABLE` | Keep pending or use declared alternative evaluator, not fake success |
| `RUNNER_FAILURE` | Distinguish infrastructure failure from a verified failing submission |
| `MIGRATION_DIAGNOSTIC_REQUIRED` | Retain old evidence; schedule new target probe |

Errors have code, human message, retryable flag, and related IDs. Log neither secrets nor private raw responses unnecessarily in general-purpose logs.


## 7. Assessor provenance and deployment scope

An assessor profile must specify method, reviewer identity where relevant, whether it is learner self-assessment, validation/anchor-set version, criterion/frame scope, base reliability, and eligibility for provisional/durable claims. A learner clicking “I understand” is a profile assertion/override, not a human-validated assessment. An explicit criterion-by-criterion learner self-assessment is retained as self-assessed evidence; default reliability is 0.25 and it cannot alone establish durable-support status. Reliability 1.0 requires a trusted reviewed assessment or a deterministic evaluator validated for that particular criterion. Model calibration can later justify a different profile; an LLM cannot grant that status to itself.

All embedded lifecycle/review/availability fields in immutable historical content are snapshots at record creation. Current lifecycle state and validation/source-status attestations are separate operational views. Substantive changes require new semantic revisions; review or availability changes do not rewrite historical payloads.

The contract catalog is a design vocabulary, not a mandate to create one service, UI, or table per record type. The first slice needs only registry/frames, catalog activities/rubrics/bindings, inert A/B routes, learner goals, attempt snapshots, event/judgment/observation records, projections, retrieval, and plan/decision records. Rich authoring, project encounters, automated migration, model-run orchestration, and additional modalities may remain disabled ports. Unsupported functionality must return the documented error rather than receive a speculative implementation.
