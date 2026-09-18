# VibeLearn ↔ Terminal PM Agent adapter contract

**Status:** draft contract v0.1 — design semantics, not a frozen transport/API schema  
**Date:** 18 September 2026  
**Owning architecture:** `docs/AUTOMATED-DEVELOPMENT-SYSTEM.md`

This contract defines the boundary between VibeLearn and the evolving Terminal PM Agent. Both systems are still changing. The contract therefore fixes **meaning and safety invariants first**, while keeping transport, internal module layout, model/provider choice, worker topology and most field expansion replaceable.

Do not interpret this document as permission to copy Terminal PM Agent internals into VibeLearn. Terminal PM Agent remains a separate orchestrator until a later stability/evidence gate justifies deeper coupling.

---

## 1. Contract objective

VibeLearn should be able to say:

> Here is the exact product task, relevant immutable context, required constraints, review/evidence requirements and budget/authority envelope. Work on it and return exact candidate/evidence references.

Terminal PM Agent should be able to change:

- its internal planner;
- number of workers;
- worker/reviewer models;
- worker specialization;
- retry/recovery implementation;
- session/runtime implementation;
- provider routing;
- verifier scheduling;
- persistence internals;

without requiring VibeLearn to change, provided the negotiated contract semantics remain valid.

Likewise, VibeLearn should be able to add new game types, learning domains, critic profiles and outcome evaluators without requiring Terminal PM Agent to know those domains in advance.

---

## 2. Ownership boundary

### VibeLearn owns

- product/game/learning goals;
- learner/product constraints;
- exact VibeLearn repository/build/runtime identity;
- VibeLearn review-profile definitions;
- story, art/world, gameplay, learning and future domain-specific review requirements;
- product-specific acceptance semantics;
- human/model/telemetry outcome evidence;
- incidents and escaped-failure records;
- final user/product acceptance and release authority.

### Terminal PM Agent owns

- generic engineering orchestration;
- worker/reviewer scheduling;
- context acquisition inside granted scope;
- tool/session lifecycle;
- worktree/execution isolation;
- retries and recovery;
- provider/model selection inside the requested policy;
- generic execution/evidence receipts;
- orchestration completion state.

### Neither side may silently claim the other's authority

In particular:

- Terminal PM Agent reporting `completed` does **not** mean VibeLearn accepted the product.
- A VibeLearn critic requirement does **not** prescribe the Terminal PM Agent's internal agent topology.
- VibeLearn must not infer that a timed-out request failed.
- Terminal PM Agent must not weaken a required VibeLearn review/evidence requirement merely because the requested capability is unavailable.

---

## 3. Keep the protocol semantic, not organizational

The adapter should express **required work and evidence**, not a fixed org chart.

Bad contract:

```text
spawn:
  1 implementation agent
  1 test agent
  1 story critic
  1 art critic
  1 gameplay critic
  1 learning critic
```

Preferred contract:

```text
work_requirements:
  required_capabilities: [repo_edit, test_execution]

review_requirements:
  - profile: story@exact-version
  - profile: art_world@exact-version
  - profile: gameplay@exact-version
  - profile: learning@exact-version
```

Terminal PM Agent may satisfy that with four reviewers, eight reviewers, reused infrastructure, retries, specialized workers or a future orchestration strategy. What matters is that each required review profile returns independently attributable evidence/results.

This rule allows VibeLearn to grow to many workers and critics without freezing Terminal PM Agent's scheduler.

---

## 4. Versioning and evolution

### 4.1 Contract version

Every request/response envelope carries:

```yaml
contract_version: "0.1"
```

During the `0.x` period, both sides must negotiate supported versions explicitly. No caller may assume backward compatibility across arbitrary `0.x` revisions.

After a stable v1 exists:

- major version: semantic/breaking change;
- minor version: additive compatible capability;
- patch version: clarification/bug fix without semantic change.

### 4.2 Capability negotiation is mandatory

Before depending on a feature, VibeLearn asks the orchestrator what it actually supports.

Core operation:

```text
describe_capabilities() -> CapabilityDescriptor
```

A request declares `required_capabilities`. If the orchestrator cannot satisfy one, it must reject or block the run explicitly. It must not silently downgrade.

### 4.3 Additive evolution

Unknown optional fields should normally be ignored or preserved according to the local typed adapter, not treated as instructions.

New semantics that may alter safety, authority, review meaning or retry behavior require a negotiated capability or new contract version.

### 4.4 Namespaced extensions

Both systems may carry experimental metadata under namespaced extensions:

```yaml
extensions:
  vibelearn.example_feature: {...}
  terminal_pm.experimental_receipt: {...}
```

Extensions may not override core contract semantics.

An extension is data, not executable policy.

---

## 5. Common envelope

Every mutating request should conceptually carry:

```yaml
contract_version: "0.1"
request_id: <unique transport-attempt ref>
idempotency_key: <stable key for this intended operation>
intent_digest: <trusted SHA-256 of the intended operation payload>
actor_ref: <transport-authenticated actor/service ref>
purpose: <short machine-readable purpose>
required_capabilities: []
extensions: {}
```

Rules:

- Actor identity comes from trusted transport/authentication, not model-generated text.
- `intent_digest` is computed by the trusted adapter/harness over the intended operation payload; it excludes transport-attempt identity such as `request_id` and the idempotency key itself.
- Retrying the same intended operation may use a new `request_id`, but it must preserve the same `idempotency_key` and `intent_digest`.
- Reusing the same idempotency key with a different `intent_digest` is an `IDEMPOTENCY_CONFLICT`.
- A transport timeout does not prove the operation failed.
- Mutating operations must be reconcilable by `request_id` or `idempotency_key`, with the expected `intent_digest` supplied during reconciliation.

---

## 6. Opaque cross-system references

Neither side should require direct access to the other's database schema.

Use opaque, typed references.

Conceptually:

```yaml
ref:
  system: vibelearn | terminal_pm
  kind: run | artifact | evidence | profile | goal | incident | build | context
  id: <opaque id>
  revision: <optional immutable revision>
  digest: <optional content digest>
```

Rules:

- Digests are verified from bytes by the owning/trusted system; a model-supplied digest is not authoritative.
- Immutable artifacts should carry a digest when practical.
- Mutable resources should carry an expected revision where mutation is allowed.
- Knowing an ID is not authorization to access the referenced data.

The exact wire representation may later become a compact URI/URN. Preserve these semantics, not this spelling.

---

## 7. Core operations

Keep the mandatory API small.

### 7.1 `describe_capabilities`

Read-only.

Returns:

- supported contract versions;
- supported core operations;
- optional operations;
- execution capabilities;
- evidence/receipt capabilities;
- review capabilities;
- event delivery capabilities;
- budget enforcement capabilities;
- privacy/data-handling capabilities;
- known hard limitations.

### 7.2 `start_run`

Requests one bounded engineering outcome.

Returns an operation receipt and, when known, a `run_ref`.

### 7.3 `get_run`

Returns the latest authoritative run snapshot known to Terminal PM Agent.

### 7.4 `lookup_operation`

Reconciles a mutating request by `request_id` or `idempotency_key`, together
with the caller's expected `intent_digest`.

This operation is mandatory because network/controller uncertainty must not cause
duplicate effects. A lookup that finds the same idempotency key under a different
intent digest returns `IDEMPOTENCY_CONFLICT`, not the older result as though it
belonged to the new payload.

### 7.5 `cancel_run`

Requests cancellation of one exact run using expected run revision when available.

Cancellation itself has an operation receipt; acknowledgement is not proof the external worker/session stopped.

### Optional negotiated operations

Do not make these mandatory until real runs require them:

- `get_events(run_ref, cursor)`;
- `continue_run(run_ref, input_refs, expected_revision)`;
- event webhook/subscription;
- pause/resume;
- richer artifact fetch;
- live steering;
- bidirectional incident notification.

A missing optional operation must not be emulated through unsafe guesses.

---

## 8. Operation receipts and unknown effects

Every mutating operation returns or can later reconcile to an operation receipt:

```yaml
operation_ref:
request_id:
idempotency_key:
intent_digest:
effect_status: rejected | acknowledged | effect_confirmed | effect_unknown
run_ref: optional
evidence_refs: []
reason: optional
revision:
```

Meaning:

- `rejected`: trusted controller says the operation was not admitted.
- `acknowledged`: request was admitted/queued; external effect is not yet established.
- `effect_confirmed`: requested effect has authoritative evidence.
- `effect_unknown`: the system cannot currently prove whether the effect occurred.

Critical invariants:

> `effect_unknown` is never automatically treated as safe-to-retry.

> A reconciled receipt is valid for a retry only when its `idempotency_key` and
> `intent_digest` match the intended operation. The original receipt may carry a
> different `request_id` because a later retry/reconciliation attempt is a new
> transport attempt, not a new intended effect.

Reconcile first. If the same key resolves to another intent digest, return
`IDEMPOTENCY_CONFLICT`; never dispatch again to discover which effect wins.

---

## 9. StartRun request

Conceptually:

```yaml
run_request:
  goal_ref: <versioned VibeLearn goal/spec ref>
  requested_outcome: <concise outcome statement>

  repository:
    repo_ref: <authorized repository handle>
    base_revision: <exact commit/revision>
    dirty_state_ref: optional
    allowed_read_scope: [...]
    allowed_write_scope: [...]

  context_refs:
    - <versioned/immutable relevant VibeLearn refs>

  work_requirements:
    required_capabilities: [...]
    preferred_worker_profiles: [...]
    max_parallelism: optional

  review_requirements:
    - review_requirement

  acceptance_requirements:
    - <VibeLearn criterion/evidence requirement refs>

  execution_policy_ref:
  privacy_policy_ref:
  budget:
    max_model_cost: optional
    max_model_calls: optional
    max_tool_calls: optional
    max_parallel_workers: optional
    deadline: optional

  parent_run_ref: optional
  incident_ref: optional
  extensions: {}
```

### 9.1 Goal and context are references where practical

Do not repeatedly serialize the entire VibeLearn world into every request.

Pass immutable/versioned refs plus the minimum inline description needed for safe routing. Terminal PM Agent may retrieve more context only through authorized capabilities.

### 9.2 Repository scope is explicit

The run must know:

- exact starting revision;
- what may be read;
- what may be changed;
- protected targets;
- whether network access is allowed;
- whether generated code may execute;
- whether production resources are out of bounds.

The worker cannot expand this authority by writing a persuasive prompt.

---

## 10. Worker requirements without freezing worker topology

VibeLearn may express required capabilities and optional worker-profile preferences.

Example:

```yaml
work_requirements:
  required_capabilities:
    - repo_read
    - repo_edit
    - test_execution
  preferred_worker_profiles:
    - ref: vibelearn:worker/gameplay-implementation@2
    - ref: vibelearn:worker/playcanvas-debug@1
  max_parallelism: 4
```

Semantics:

- `required_capabilities` are hard requirements.
- `preferred_worker_profiles` are hints unless individually marked required.
- VibeLearn does **not** specify worker count by default.
- Terminal PM Agent decides decomposition, worker count, replacement and retries inside policy/budget.
- Actual worker activities are returned as provenance so later failures can be traced.

A future VibeLearn course/game may introduce new worker profiles without changing the adapter protocol.

---

## 11. Review requirements and many critics

A review requirement references a VibeLearn-owned versioned review profile.

Conceptually:

```yaml
review_requirement:
  requirement_id: story-gate
  profile_ref:
    system: vibelearn
    kind: profile
    id: story
    revision: 4
    digest: <exact profile digest>

  required: true
  blocking: true

  independence:
    separate_from_builder: true
    fresh_context_first_pass: true

  evidence_policy:
    substantive_claims_require_falsification_attempt: true
    execute_reproduction_when_possible: true

  input_refs: [...]
  required_evidence_kinds: [...]
  budget_override: optional
```

Profiles may include:

- story;
- art/world direction;
- gameplay;
- learning/transfer;
- accessibility;
- security;
- performance;
- any future domain-specific critic.

The adapter does not need a fixed enum.

### 11.1 Required critics do not average

For VibeLearn's independent product gates:

> One required blocking review failing is not averaged away by high scores from other critics.

Terminal PM Agent returns each requirement separately.

VibeLearn decides the product-level gate.

### 11.2 Reviewer proof is implicit

For every substantive defect claim, the review semantics include:

```text
claim
-> expected behavior/invariant
-> valid falsifiable scenario
-> reproduction/experiment where possible
-> observed evidence
-> proven | disproven | unresolved
```

Do not require VibeLearn to request a separate “proof worker” for each criticism.

### 11.3 Orchestrator may add supplementary reviewers

Terminal PM Agent may run additional reviews when useful.

They are returned as supplementary results and cannot replace an explicitly required VibeLearn profile unless the profile contract declares equivalence.

---

## 12. Review result

Each required/supplementary review result conceptually contains:

```yaml
review_result:
  review_ref:
  requirement_id: optional
  profile_ref:
  candidate_ref: <exact candidate reviewed>
  reviewer_activity_refs: []

  status: passed | failed | unresolved | blocked

  findings:
    - finding_ref

  evidence_refs: []
  limitations: []
  started_at:
  finished_at:
```

A finding:

```yaml
finding:
  finding_ref:
  claim:
  expected_behavior_or_invariant:
  disposition: proven | disproven | unresolved
  evidence_refs: []
  attempted_reproduction_refs: []
  next_discriminating_evidence: optional
  impact: optional
```

`passed` means the review profile found no blocking defect under its executed scope. It does not mean universal correctness.

`blocked` or `unresolved` on a required blocking review does not silently become pass.

---

## 13. Candidate and artifact references

Terminal PM Agent should return sealed candidate/artifact identity, not merely “the worktree looks good.”

Conceptually:

```yaml
candidate_ref:
  base_revision:
  candidate_revision_or_digest:
  patch_ref: optional
  build_refs: []
  artifact_refs: []
  environment_ref:
```

Artifact references should expose enough to retrieve/verify the bytes under authorization:

```yaml
artifact_ref:
  id:
  kind:
  digest:
  media_type:
  privacy_scope:
  producer_ref:
  created_at:
```

Changing material candidate bytes creates a new candidate identity and invalidates review results that depended on changed behavior.

---

## 14. Evidence references

Evidence is append-oriented and tied to exact candidate/environment identity.

Conceptual evidence kinds include:

- command/test result;
- compiler/type/lint result;
- browser trace;
- screenshot/keyframe;
- benchmark/measurement;
- runtime/session receipt;
- source/document evidence;
- reviewer/model assessment;
- human feedback;
- product telemetry.

Conceptually:

```yaml
evidence_ref:
  id:
  kind:
  producer_ref:
  candidate_ref:
  environment_ref:
  digest_or_receipt_ref:
  observed_at:
  reproducibility: deterministic | replayable | probabilistic | observational
  limitations: []
```

Do not invent a universal numeric trust score in v0.1.

Preserve provenance and let policy/evaluation interpret it.

---

## 15. Run snapshot

`get_run` returns a snapshot that is useful without exposing Terminal PM Agent's private internal schema.

Conceptually:

```yaml
run:
  run_ref:
  revision:

  state: accepted | queued | running | blocked | reviewing |
         verifying | completed | failed | cancelled

  orchestration_disposition:
    working | candidate_available | needs_input |
    no_viable_candidate | infrastructure_blocked | finished

  goal_ref:
  base_revision:
  candidate_refs: []
  active_candidate_ref: optional

  worker_activity_refs: []
  review_results: []
  evidence_refs: []
  unresolved_items: []
  limitations: []

  usage:
    model_calls: optional
    tool_calls: optional
    cost: optional
    enforcement_level: optional

  latest_event_cursor: optional
  updated_at:
```

### Candidate selection is explicit

If exactly one candidate exists, VibeLearn may use it directly. If multiple
candidates exist, Terminal PM Agent must provide an exact `active_candidate_ref`
for the candidate it is returning for downstream evaluation. VibeLearn must not
infer the active candidate from list order, timestamps or worker narrative.

Every required review result that may authorize downstream evaluation must bind
to that exact candidate. Duplicate results for the same required
`requirement_id` are ambiguous and block evaluation until reconciled; they are
not resolved by "last result wins."

### Important semantic distinction

`state: completed` means Terminal PM Agent has completed its orchestration responsibility for this run.

It does **not** mean:

- VibeLearn product accepted;
- user accepted;
- safe to deploy;
- learning outcome proven.

VibeLearn performs its own product evaluation after receiving the candidate/evidence.
A completed run is eligible for that evaluation only when its orchestration
disposition actually exposes a candidate, the candidate identity is unambiguous,
and every required blocking review is exact-candidate-bound.

---

## 16. Worker and reviewer activity provenance

VibeLearn does not need every hidden reasoning token, but it needs enough lineage to debug automation failures.

An activity reference should make it possible to recover, when authorized:

- activity role/profile;
- model/provider identity or class;
- prompt/config version;
- parent run;
- input/context refs;
- artifact/output refs;
- tool/evidence refs;
- start/end status;
- replacement/retry relationship.

Do not forward one model's private free-form reasoning as another model's instructions by default.

Use typed artifacts/evidence instead.

---

## 17. Async events

Polling `get_run` is the baseline.

Event streaming is optional.

If supported:

```text
get_events(run_ref, cursor) -> events + next_cursor
```

Events should be append-only enough to reconstruct meaningful state transitions.

Useful event classes:

- run admitted;
- worker activity started/finished;
- tool effect requested/confirmed/unknown;
- candidate changed;
- review started/completed;
- run blocked;
- recovery/reconciliation;
- run completed/cancelled.

Do not expose every internal debug event as part of the stable contract.

---

## 18. Clarifications and continuation

Do not make interactive steering mandatory in v0.1.

If Terminal PM Agent needs input and supports continuation:

```text
continue_run(run_ref, input_refs, expected_revision)
```

The run enters `blocked/needs_input` until continuation.

If continuation is unsupported, the run may terminate with a structured unresolved item and VibeLearn may start a new child run referencing the original run.

This keeps the first contract small while allowing richer supervision later.

---

## 19. Outcome feedback and repair without a new API subsystem

VibeLearn owns product outcomes and incidents.

A bad outcome does not require a dedicated new “repair service” in the adapter.

VibeLearn records:

```text
build/candidate
-> human/model/telemetry outcome
-> incident
```

Then starts a normal child run:

```yaml
parent_run_ref: <original run>
incident_ref: <VibeLearn incident>
requested_outcome: "Diagnose and repair the escaped failure"
context_refs:
  - <outcome evidence>
  - <reproduction/session refs>
```

This reuses the same orchestration contract for implementation, diagnosis and repair.

If future runs show that push-style outcome notification materially improves the system, add it as a negotiated optional operation then.

---

## 20. Product acceptance stays in VibeLearn

Terminal PM Agent returns engineering candidates, reviews and evidence.

VibeLearn decides:

- whether all required critic profiles are satisfied;
- whether VibeLearn-specific deterministic gates pass;
- whether computer-use/gameplay outcome evaluation passes;
- whether the user accepted;
- whether activation/release is authorized.

Conceptually:

```text
Terminal PM:
  orchestration complete
  candidate C
  engineering/reviewer evidence E

VibeLearn:
  run VibeLearn evaluators
  apply required critic gates
  observe actual game
  collect human/outcome feedback
  => accept | revise | reject | defer
```

This separation prevents generic orchestrator success from being confused with product success.

---

## 21. Budget contract

VibeLearn may set hard or advisory limits.

Each budget dimension must declare whether Terminal PM Agent can actually enforce it.

Example:

```yaml
budget:
  max_model_cost: 2.00
  max_model_calls: 40
  max_parallel_workers: 6

required_capabilities:
  - budget.model_call_limit.enforced
```

Capability descriptor may report enforcement such as:

```text
unsupported
observed_only
best_effort
enforced
```

If VibeLearn requires `enforced` and Terminal PM Agent only supports `observed_only`, the run must not silently proceed as though the hard budget exists.

---

## 22. Security and privacy contract

### 22.1 Capability, not credential, transfer

Prefer opaque tool/repository grants over raw credentials.

The model should receive:

```text
read_repo(...)
run_test(...)
write_allowed_path(...)
```

not reusable production secrets.

### 22.2 Data classification

The request should be able to reference a VibeLearn privacy policy that constrains:

- which context may leave the local/trusted boundary;
- which providers may receive which data classes;
- whether learner/private data may be included;
- retention requirements;
- whether web/network access is allowed.

If the orchestrator cannot honor the required policy, reject/block the run.

### 22.3 Prompt injection boundary

Repository content, web content, logs, artifacts and user content are untrusted data unless explicitly designated as trusted control material.

An artifact must not gain instruction authority merely because another agent generated it.

### 22.4 Production authority

The adapter contract does not grant production deployment or destructive production access by default.

Such capabilities require explicit negotiated authority and separate VibeLearn release policy.

---

## 23. Error contract

Prefer machine-readable categories over provider-specific prose.

Initial categories may include:

```text
UNSUPPORTED_CONTRACT_VERSION
UNSUPPORTED_CAPABILITY
IDEMPOTENCY_CONFLICT
AUTHORIZATION_DENIED
INVALID_REFERENCE
STALE_REVISION
BUDGET_NOT_ENFORCEABLE
EXECUTION_BLOCKED
PROVIDER_UNAVAILABLE
EFFECT_UNKNOWN
RUN_NOT_FOUND
RUN_NOT_CONTINUABLE
INTERNAL_ERROR
```

Do not overfit this list now. Add categories when real runs require actionable distinctions.

Provider/model-specific details may appear as redacted diagnostic metadata, not as the stable control contract.

---

## 24. Capability descriptor

Conceptually:

```yaml
capabilities:
  contract_versions: ["0.1"]

  operations:
    core:
      - describe_capabilities
      - start_run
      - get_run
      - lookup_operation
      - cancel_run
    optional:
      - get_events
      - continue_run

  execution:
    - repo_read
    - repo_edit
    - test_execution
    - isolated_worktree

  review:
    profile_refs_supported: opaque
    independent_context: true
    executable_reproduction: true

  evidence:
    command_receipts: true
    candidate_digest: true
    event_cursor: optional

  budget:
    model_call_limit: enforced
    cost_limit: observed_only

  privacy:
    external_provider_policy: supported
    secret_redaction: supported

  limitations:
    - <explicit limitation>
```

This is illustrative. Capability names can evolve under versioned/negotiated semantics.

---

## 25. Contract fixtures before live integration

Because Terminal PM Agent currently does not authorize live runs, VibeLearn's first implementation should use contract fixtures.

Minimum fixture matrix:

| Fixture | Required behavior |
|---|---|
| Successful candidate | Exact candidate/evidence refs returned; VibeLearn may evaluate independently |
| Reviewer-proven defect | Finding includes attempted reproduction and evidence; candidate not silently treated as accepted |
| Reviewer unresolved | Required blocking review remains unresolved, not pass |
| Unsupported critic capability | Run rejected/blocked; no silent critic omission |
| Unknown start effect | Adapter reconciles idempotency key + intent digest before redispatch |
| Same intent, new request ID | Original authoritative receipt is reused; no second dispatch |
| Same key, changed payload after restart | Intent-digest mismatch returns `IDEMPOTENCY_CONFLICT`; no dispatch |
| Unknown cancel effect | Run remains uncertain until confirmed/reconciled |
| Worker replacement | Same run lineage preserves old/new activity refs |
| Multiple candidates | Exact `active_candidate_ref` is required; list order never chooses authority |
| Duplicate required review results | Candidate evaluation blocks until the duplicate requirement is reconciled |
| Candidate changed after review | Prior affected review no longer authorizes changed candidate |
| Budget cannot be enforced | Hard-required budget capability blocks run |
| VibeLearn product rejection after Terminal completion | Incident links to exact run/candidate; child repair run can reference it |
| Multiple required critics | Each profile returns independent result; no score averaging |
| Unknown additive extension | Core semantics remain intact |

Do not mock Terminal PM Agent's internal scheduler. Mock only the adapter boundary.

---

## 26. Example VibeLearn request with multiple workers/critics allowed

```yaml
contract_version: "0.1"
request_id: req_123
idempotency_key: "vibelearn-level1-hud-fix-01"
purpose: "implement_and_review_product_change"

required_capabilities:
  - repo_edit
  - test_execution
  - review.independent_context
  - review.executable_reproduction

run_request:
  goal_ref:
    system: vibelearn
    kind: goal
    id: level1-hud-fix
    revision: 3

  requested_outcome: >
    Fix the Level 1 HUD overlap without regressing phone readability,
    tutorial progression or the PlayCanvas-only runtime.

  repository:
    repo_ref: vibelearn
    base_revision: <exact sha>
    allowed_read_scope: ["repo"]
    allowed_write_scope: ["web/", "tests/", "docs/reviews/"]

  work_requirements:
    required_capabilities: [repo_edit, test_execution]
    preferred_worker_profiles:
      - vibelearn:worker/ui-gameplay
    max_parallelism: 4

  review_requirements:
    - requirement_id: gameplay
      profile_ref: vibelearn:review/gameplay@5
      required: true
      blocking: true
      independence:
        separate_from_builder: true
        fresh_context_first_pass: true
      evidence_policy:
        substantive_claims_require_falsification_attempt: true
        execute_reproduction_when_possible: true

    - requirement_id: art-world
      profile_ref: vibelearn:review/art-world@3
      required: true
      blocking: true
      independence:
        separate_from_builder: true
        fresh_context_first_pass: true
      evidence_policy:
        substantive_claims_require_falsification_attempt: true
        execute_reproduction_when_possible: true

    - requirement_id: accessibility
      profile_ref: vibelearn:review/accessibility@2
      required: true
      blocking: true

  budget:
    max_model_calls: 30
    max_parallel_workers: 4
```

VibeLearn does **not** say how many actual workers or reviewers must be spawned.

Terminal PM Agent could decide that:

- one worker implements;
- a second worker independently probes mobile CSS;
- three required critics execute;
- one reviewer generates a regression reproduction;
- a failed worker is replaced;

while the adapter contract remains unchanged.

---

## 27. Example returned snapshot

```yaml
run_ref: terminal_pm:run/r_456
revision: 11
state: completed
orchestration_disposition: candidate_available

candidate_refs:
  - candidate_ref: terminal_pm:candidate/c_789
    base_revision: <original sha>
    candidate_revision_or_digest: <sealed digest>
    artifact_refs:
      - terminal_pm:artifact/patch_12

worker_activity_refs:
  - terminal_pm:activity/w_1
  - terminal_pm:activity/w_2

review_results:
  - requirement_id: gameplay
    profile_ref: vibelearn:review/gameplay@5
    status: passed
    evidence_refs: [...]

  - requirement_id: art-world
    profile_ref: vibelearn:review/art-world@3
    status: passed
    evidence_refs: [...]

  - requirement_id: accessibility
    profile_ref: vibelearn:review/accessibility@2
    status: unresolved
    findings:
      - disposition: unresolved
        next_discriminating_evidence: "physical-device enlarged-text check"

unresolved_items:
  - "Required accessibility evidence remains unavailable."

limitations:
  - "No physical-device execution capability."

usage:
  model_calls: 17
  enforcement_level: partial
```

Terminal PM Agent may be finished.

VibeLearn should still refuse product acceptance because a required blocking critic remains unresolved.

That distinction is intentional.

---

## 28. What remains deliberately unspecified

Do not freeze these until implementation/run evidence requires it:

- HTTP vs JSON-RPC vs MCP vs local IPC transport;
- exact serialization library;
- exact database ownership of cross-system refs;
- event bus technology;
- worker count/decomposition algorithm;
- reviewer count beyond required profiles;
- provider/model names;
- model-routing algorithm;
- exact cost-accounting backend;
- whether artifacts are pulled, pushed or shared via object storage;
- exact retry limits;
- numeric evidence trust scores;
- universal critic taxonomy;
- shared code library between VibeLearn and Terminal PM Agent.

These are implementation choices or later evidence-driven decisions, not v0.1 contract invariants.

---

## 29. First implementation target

Implement only enough in VibeLearn to prove:

1. capability negotiation;
2. `start_run` request serialization;
3. operation/idempotency reconciliation;
4. `get_run` snapshot consumption;
5. multiple opaque review-profile requirements;
6. exact candidate/evidence linkage;
7. VibeLearn product acceptance remaining independent;
8. outcome -> incident -> child-run linkage.

Use fixtures until Terminal PM Agent's own current execution policy authorizes a suitable live integration run.

Anything beyond this needs either a clear safety/correctness reason or evidence from actual integration runs.
