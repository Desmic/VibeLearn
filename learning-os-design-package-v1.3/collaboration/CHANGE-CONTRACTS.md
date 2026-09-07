# Collaborative evolution — semantic contracts 1.2

**Design contracts, not implemented APIs or validated JSON Schemas.** Interpret these with the 1.2 amendment, then 1.1 and the original learning contracts. The following field names and states are implementation-ready defaults; preserving their semantics is mandatory even if names change.

## 1. Common conventions

`Ref<T> = {id: UUID, revision: positive_integer}`; references are branded by entity kind. `ArtifactRef = {id, digest, media_type, privacy_scope}` pins stored bytes. A `PolicyRef` pins an immutable version and digest. Timestamps use an explicit UTC instant; display them in the learner's locale/timezone. Digests are computed and verified by the application from actual bytes, never trusted because an agent supplies a string.

Commands carry an authenticated actor, delegated task authority where applicable, idempotency key, expected mutable-record revision, and purpose. Actor identity is resolved by the trusted transport/application, not accepted from a model-generated body. Same key with different payload returns `IDEMPOTENCY_CONFLICT`. Authorize every target and every referenced private artifact separately; knowledge of an ID is not permission.

Keep immutable context/plans/candidates/results/reviews/receipts. ChangeRequest is an aggregate with optimistic revision and an append-only transition log. Candidate edits create another candidate, not mutations to reviewed bytes. Use existing jobs and artifact storage rather than a separate database per record type.

## 2. Record contracts

### ChangeRequest

```text
id, revision
requester_ref
conversation_message_ref          # actual user message, not an agent paraphrase
request_text_ref                  # private artifact where appropriate
requested_outcome
scope: {
  audience: learner | workspace | shared,
  owner_ref,
  experience_ref?,
  surface_keys[]
}
target: {
  kind: ui_element | course_section | experience | product_capability,
  semantic_component_key?, semantic_action?,
  content_refs[], observed_manifest_ref?
}
mechanism: configuration | content | code | core_policy | unresolved
status: captured | inspecting | planning | building | verifying |
        awaiting_user | awaiting_release | activating | completed |
        revision_requested | blocked | rejected | cancelled
current_context_ref?, current_plan_ref?, current_candidate_ref?
parent_change_ref?                 # compound request; preserve independent acceptance
permission_policy_ref, budget_policy_ref
last_error?, created_at, updated_at
```

`scope.audience` expresses requested effect, not authority to mutate shared source. A code candidate for a personal feature can have a separately shared release scope requiring owner permission. The server resolves and validates both. User feedback can refine the requested outcome in a new request revision.

### ExperienceManifest

```text
id, revision, privacy_scope
frontend_release_ref, backend_release_ref
api_contract_ref, data_schema_ref
component_catalog_ref, presentation_schema_ref
product_defaults_ref, workspace_defaults_ref?
learner_presentation_ref?, experience_presentation_ref?
resolved_content_root_ref, learning_policy_refs[]
capability_config_ref
resolved_configuration_ref
composition_policy_ref
manifest_digest
```

This is a resolved artifact referencing immutable inputs; don't encode the entire learner database. A browser observation includes its loaded frontend assets/build ID, route, viewport, and manifest reference. Confirm it against trusted release/configuration metadata and independent browser inspection where available; a client-supplied build string alone cannot certify deployment integrity.

### ContextSnapshot

```text
id, revision, change_request_ref, captured_at
observed_manifest_ref
repo_snapshot?: {
  repository_handle, base_commit,
  dirty_state_digest?, captured_patch_ref?,
  source_map_revision, dependency_lock_refs[]
}
ui_snapshot?: {
  route_key, viewport, selected_component_key?,
  relevant_state_ref?, screenshot_ref?, aria_or_dom_ref?,
  bounded_error_metadata_ref?, reproduction_ref?
}
content_context_refs[], relevant_learner_view_ref?
read_set[]: {kind, key, observed_revision?, digest?, validation_rule}
observations[]: {claim, evidence_ref, status: observed | inferred | unavailable}
omitted_fields[]: {field, reason}
consent_refs[], redaction_policy_ref, retention_policy_ref
```

`validation_rule` is a registered server-side predicate such as `exact_revision`, `exact_digest`, or `compatible_capability`. It is not executable code in the record. Course expansion can require a fresh adoption-time learner view without demanding that all learner history remain unchanged during generation.

### ChangePlan

```text
id, revision, change_request_ref, context_ref
interpretation, assumptions[], scope_summary
implementation_mechanism
intended_effects[], explicitly_unchanged[]
acceptance_criteria[]: {
  criterion_id, description,
  evaluator: automated | reviewer | user,
  required, check_profile_ref?, evidence_requirements[]
}
impact: {
  affected_components[], content_refs[], goal_delta?,
  audience, privacy_risks[], assessment_risks[], schema_change?
}
allowed_write_targets[], protected_targets[]
execution_policy_ref, verification_policy_ref
required_release_authority
rollback_plan_ref
```

The agent proposes acceptance criteria; the trusted policy adds non-removable baseline gates. The builder cannot remove learning-integrity, isolation, authorization, or release checks by changing a plan. Altering a criterion after feedback or test failure creates a reviewed new plan revision and an explicit reason.

### CandidateBundle

```text
id, revision, change_request_ref, plan_ref, base_context_ref
parent_candidate_ref?
read_set[], artifacts[]
patch_ref?, built_release_refs[]
proposed_manifest_ref
proposed_experience_revision_ref?
proposed_course_refs[], proposed_goal_revision_ref?
required_capabilities[], compatibility_contract_ref
preview_environment_ref?, rollback_plan_ref
candidate_digest, created_at
```

A candidate is a sealed set of outputs plus dependencies, not a live branch name. Changing a build, content reference, configuration, or material read dependency produces a new candidate and invalidates acceptance for changed behavior. Build labels must resolve to immutable artifacts.

### CheckResult

```text
id, revision, candidate_ref, candidate_digest
plan_ref, criterion_id, check_profile_ref, verification_policy_ref
runner_identity, environment_ref, fixture_refs[]
command_or_tool_run_ref
outcome: passed | failed | blocked | skipped | not_applicable
baseline_outcome?, started_at, finished_at
artifact_refs[]                    # test reports, trace, screenshots, source review
limitations[], retry_of_ref?
```

Only an authorized verifier can write accepted CheckResults. An agent-generated report is a proposal/artifact until validated through the runner. Retain all attempts; rerunning until one pass cannot hide flakiness. `not_applicable` needs a policy-supported reason. A required unavailable check blocks ready status; it does not default to a pass.

Source-check results distinguish actual fetching/inspection, link availability, rights restrictions, model critique, domain review, and tool-tested technical examples. All are separate dimensions, not a single `quality=true` flag.

### UserReview

```text
id, revision, change_request_ref, candidate_ref
reviewer_ref, authenticated_interaction_ref
observed_manifest_ref, preview_or_live_environment_ref
decision: accept | revise | reject | defer
feedback_text_ref?, criterion_feedback[]
created_at
```

UserReview must originate from an actual authenticated user interaction. The agent cannot create acceptance because it predicts satisfaction. A chat message can support a review only when it clearly refers to the candidate and decision; ambiguous praise about another topic is not acceptance. The original message must remain auditable. Revocation or later dislike creates another review, not a deletion of the earlier one.

### ActivationReceipt

```text
id, revision, change_request_ref, candidate_ref
user_review_ref?, release_authorization_ref
scope, prior_active_ref, new_active_ref
status: prepared | applying | applied_unconfirmed | confirmed |
        failed | rolled_back
operation_id, state_transition_refs[]
server_manifest_ref?, observed_browser_manifest_ref?
smoke_check_refs[], rollback_ref?, failure_details?
```

A personal trial may be prepared before final acceptance; durable adoption requires it. Shared release requires the appropriate owner-authority record in addition. A successful pointer update is `applied_unconfirmed`; become `confirmed` only when applicable served-state and smoke checks succeed. Preserve a precise failed state if confirmation cannot be completed.

## 3. Ports and command behavior

| Port/command | Input | Output / allowed effect |
|---|---|---|
| `ChangeCoordinator.capture` | User message, scoped target, observed manifest, expected context, idempotency key | ChangeRequest; no UI/code/content mutation |
| `ContextBuilder.capture` | Authorized request, desired evidence kinds, consent, relevant scope | ContextSnapshot with omissions; read-only except its audit artifacts |
| `ChangePlanner.propose` | Request, fresh context, known capabilities, permission/budget policies | ChangePlan proposal; cannot self-authorize new tools |
| `ExperienceEditor.propose` | Exact accepted plan, configuration schema/catalog, context | Typed configuration candidate; no active-pointer update |
| `CourseEditor.propose` | Exact plan, brief, locked source/content refs, source access grant | Staged content/route/goal proposals via existing authoring contracts |
| `CodeAgentPort.prepare` | Plan, pinned source snapshot, isolated workspace, constrained execution grant | Patch/build candidates and action logs; no production credentials |
| `Verifier.run` | Sealed candidate, protected checks, fixtures, execution grant | Independent CheckResults from actual execution/review |
| `ReviewPresenter.open` | Candidate with applicable readiness, authorized learner | Scoped trial/preview and check summary; real exposure events where relevant |
| `ReviewRecorder.record` | Actual user interaction, candidate, observed manifest, decision | Immutable UserReview; never generated by the builder |
| `ActivationController.activate` | Candidate, review, release authority, expected active revision, idempotency | Scoped pointer transaction or release workflow; ActivationReceipt |
| `ActivationController.confirm` | Trusted served metadata, browser observation, smoke results | Confirm receipt or explicit mismatch/failure |
| `ChangeCoordinator.revise` | New user feedback or check failure, exact prior candidate | New plan/candidate iteration; preserve previously accepted independent parts |
| `ChangeCoordinator.undo` | Exact prior effect, current active revision, user authorization | New compensating revision/receipt; do not erase learning history |

Suggested HTTP resources: `/changes`, `/changes/{id}`, `/changes/{id}/context`, `/changes/{id}/candidates`, `/candidates/{id}/checks`, `/candidates/{id}/preview`, `/candidates/{id}/reviews`, `/changes/{id}/activations`, `/activations/{id}/undo`. These are routes, not publicly unauthenticated capabilities. Code work and verification remain privileged internal jobs.

No editor port may call `SelectJudgment`, write mastery, rewrite exposure, grant rewards, erase data, change global competency equivalence, or widen privacy permission. A true assessment dispute uses the existing independent adjudication workflow.

## 4. Readiness and completion predicates

```text
preview_ready(candidate) =
  artifacts_sealed_and_resolvable
  AND current_relevant_dependencies_valid
  AND applicable_required_non_user_checks_pass
  AND preview_access_authorized
  AND known_limitations_displayed

adoption_authorized(candidate, scope) =
  preview_ready(candidate)
  AND explicit_acceptance_for_experienced_candidate
  AND required_release_authority_for_scope
  AND expected_active_revision_matches
  AND activation_compatibility_and_rollback_checks_pass

completed(change) =
  accepted_candidate_is_current_candidate
  AND adoption_authorized_at_activation
  AND activation_receipt_is_confirmed
  AND no_material_unreviewed_delta
```

These are semantic predicates, not claims that the product has been implemented. Low-stakes content can pass a policy for provisional practice while retaining provisional assessment status. No predicate silently upgrades epistemic quality.

The accepting user must have experienced the relevant interactive candidate, not only its textual description. A plan can include further post-use evaluation, but this is not proof of learning efficacy and must not be fabricated if the user never returns.

## 5. Storage, concurrency, recovery

Use the existing relational store. Minimum constraints: scoped foreign keys/references and authorization on every read; unique `(scope, command_id)` receipts; monotonically revised change/experience aggregates; immutable candidate digest; check-result foreign key to exact candidate and criterion; reviews tied to candidate and authenticated interaction; activation compare-and-swap on prior active revision.

Personal activation transaction writes the new active experience reference, review linkage, audit transition, and outbox receipt atomically. External model/source/build actions occur outside the transaction. After interruption, query operation status and existing artifacts before retrying an external action. Do not double-charge intentionally or claim provider cancellation is guaranteed; record late completions and actual costs.

Code deployment is a multi-step job with readiness and compensation, not one database transaction. First collaborative slice rejects destructive schema changes; supports backward-compatible capability releases with a tested prior experience. Any forward/backward incompatibility makes undo a planned repair rather than a blind code revert.

## 6. Errors

`SCOPE_DENIED`, `TARGET_UNRESOLVED`, `CONTEXT_STALE`, `SOURCE_UNAVAILABLE`, `SOURCE_RIGHTS_UNCLEAR`, `CAPABILITY_MISSING`, `INVALID_CONTENT`, `ASSESSMENT_REVIEW_REQUIRED`, `PROTECTED_BOUNDARY_CHANGE`, `VERIFICATION_FAILED`, `VERIFICATION_INCOMPLETE`, `USER_REVIEW_REQUIRED`, `RELEASE_AUTHORITY_REQUIRED`, `CONFLICT`, `IDEMPOTENCY_CONFLICT`, `BUDGET_EXHAUSTED`, `ACTIVATION_MISMATCH`, `ROLLBACK_INCOMPATIBLE`, `CANCELLED`.

Return a structured error with affected refs, evidence refs, whether retrying without changes is useful, and the smallest next action. Do not return a plausible-looking success object with hidden warnings for required failures.
