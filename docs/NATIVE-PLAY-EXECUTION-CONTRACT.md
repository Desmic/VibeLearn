# Native play execution boundary — 20 September 2026

Implemented locally: an input guard, native execution record, assignment option,
v2 execution receipt and result-ingestion checks. Not yet connected to the
desktop CUA executor or live Terminal PM. This is not a new orchestrator.

## What is enforced

`tools/native_play_execution.py` provides `NativePlayGuard`. A trusted executor
owns the guard and supplies single-action dispatch and capture callbacks.

- Reserve/count each attempted GUI input before dispatch, including failures or
  cancelled calls. Serialize input/capture/checkpoint operations so concurrent
  requests cannot overrun the input ceiling.
- Require a fresh observation before each input; refuse unsupported action
  names, exhausted budgets and extra inputs after all assigned checkpoints are
  independently verified. Observations do not consume input budget.
- Keep model, candidate, assignment, session, preflight capabilities, ordered
  input/observation events and verified checkpoint-to-capture references.
- Derive counts from events, not a player-written total. Return defensive copies.
- A checkpoint verifier must reference an actual recorded observation. The
  player model must not have direct access to checkpoint verification.

The guard does not know whether a rendered scene semantically proves a checkpoint.
An independent verifier must make that judgment. Dispatch success proves a tool
call returned, not that the character moved. Capture hashes identify bytes,
not truth. The trusted executor must retain artifacts and prevent direct tool
bypass; exposing these fields to the player invalidates the trust boundary.

## Assignment and receipt flow

Create explicit per-pass requirements with
`python -m tools.build_critic_assignments --native-requirements <file>` alongside
the existing `--index` and `--output-dir`. Example task configuration:

```json
{
  "physicality": {
    "mode": "native_gui",
    "max_inputs": 25,
    "required_capabilities": ["screenshot", "keyboard"],
    "required_checkpoints": ["solid_boundary", "open_route", "camera_recovery"]
  }
}
```

Checkpoint names and required capabilities come from the task, not a particular
game's characters/coordinates/answers. Requirements enter the assignment digest
before capsule creation. Do not edit a sealed assignment to remove requirements.
This option is explicit: old artifact-review assignments are not silently
upgraded. A new interactive review must use it; legacy evidence alone cannot
satisfy the native-play policy.

The harness's context manifest carries `native_execution`, exported by its guard.
The existing execution-receipt command also requires `--native-capture-root` for
native assignments. It verifies retained observation file bytes against their
digests and rejects missing, changed or out-of-root capture paths before sealing.
Python callers of `build_receipt` must perform the same artifact verification;
the pure record validator checks references/structure, not files on disk.

Native assignments require `vibelearn.critic-execution-receipt.v2`, bound to the
candidate, assignment and session. Its digest includes the native log. Historical
v1 receipts remain valid only for assignments without native requirements.

`validate_critic_result` rejects native **pass** when there are no inputs, no
successful dispatch, missing checkpoints or no observation after the final
input. An incomplete but otherwise valid run may still report **unresolved** or
an evidence-backed **needs_revision**. Malformed, over-budget, mismatched-session
or unsupported-input logs are invalid protocol records and cannot be ingested
as valid executions; preserve their raw failure report separately.

## Current limits and next connection

### Task-defined capture coverage

The optional `capture_rules` mapping is part of `execution_requirements` and
therefore of the assignment digest. New tasks must declare the capture coverage
their claims need. A save/resume profile can use arbitrary checkpoint names:

```json
{
  "mode": "native_gui",
  "max_inputs": 12,
  "required_capabilities": ["screenshot", "reload"],
  "required_checkpoints": ["completed_before_resume", "completed_after_resume"],
  "capture_rules": {
    "completed_before_resume": {
      "modality": "screenshot", "action": "reload", "occurrence": 1, "relation": "before"
    },
    "completed_after_resume": {
      "modality": "screenshot", "action": "reload", "occurrence": 1, "relation": "after"
    }
  }
}
```

Observations declare `modality`: `ax`, `screenshot`, `motion_video` or `audio`.
Missing modality on a historical observation is unknown, never inferred from
its filename, capability list or critic prose. An assigned checkpoint refers
to the matching observation as before. A rule selects the one-based attempted
occurrence of its action; the selected action must succeed, and no other input
may lie between it and the capture. Multiple observations between inputs are
allowed. Thus an after-reload screenshot cannot fill the before-reload slot,
and a capture from an earlier interaction cannot stand in for the required one.

Before dispatching a rule's selected action, the guard requires its verified
pre-input checkpoint with the correct modality and no intervening input. Refusal
does not spend an input attempt because no dispatch occurred. Independent
verification still owns checkpoint meaning. Before-action checkpoints can be
registered before the target occurs; coverage remains incomplete until it does.

The native summary exposes `capture_gaps` with checkpoint and reason. A native
pass requires no gaps. Unresolved results preserve `native_coverage` so a worker
can collect missing evidence or replay the bounded task. Lost pre-action evidence
cannot be recreated by relabelling a later capture. Existing historical contracts
without rules remain structurally compatible, but cannot prove new typed/timed
requirements. This does not replace readiness schema v2 or independent critics.

Capture hashes verify retained bytes, not their semantic truth or media type.
Modality is trusted executor metadata; a producer that lies about it defeats this
boundary. Motion duration, actual listening, screenshot content and UI meaning
still need appropriate acquisition and review. This change neither authenticates
CUA output nor grants a text-only bridge image/audio capabilities. The manual
bridge's text observations are explicitly `ax`; requiring screenshots correctly
blocks it until an actual capture-capable executor supplies them.

### Executor connection

Actual screenshot retention is available through `tools/native_capture_inbox.py`
and the existing supervised bridge. Start the inbox with a new staging directory:

```text
python -m tools.native_capture_inbox --output STAGING --port 8054
python -m tools.supervised_native_play --config CONFIG --output NEW_RUN --capture-root STAGING
```

The inbox binds only to 127.0.0.1 and prints a per-process opaque form URL. The
browser supervisor captures using its documented screenshot tool, pastes the
base64 encoding of those returned bytes into the local form, and submits it.
No source, hidden game state, evaluator guesses or generated substitute image
enters this path. The form returns a random file ref and SHA-256. It checks Host,
Origin, form encoding and size, and does not expose arbitrary file reads/writes.
Shut down the temporary inbox after the run. It is not a hosted upload service.

Send `observe_capture` with `ref` and `sha256` to the bridge. Imports must remain
inside its explicit staging root, including after symlink resolution. The bridge
checks the digest and PNG/JPEG/WebP signature, retains its own copy, and records
`modality: screenshot`. Text observations remain AX. Signatures are format checks,
not proof of authentic screenshot origin or full media decoding; the executor is
still trusted for provenance. Imported files must come from the current observed
input boundary. The API does not prove when an image was acquired.

Every saved run now includes `coverage.json` and `followup.json`. Capture follow-ups
carry the missing checkpoint, reason, required modality/action boundary and one
of `collect_and_verify`, `perform_assigned_action`, or `replay_in_new_run`. Lost
pre-action evidence and intervening inputs require replay; a missing post-action
capture can still be collected when no later input has occurred. These are
evidence repair proposals, not dispatch authorization or a model verdict. Budgets,
capability preflight and the input guard still govern any subsequent action.

The live [connection proof](experiments/20260920-native-capture-connection.md)
retains two real screenshots around one guarded browser action and verifies both
missing-capture refusal and stop-after-completion. Auxiliary inbox paste/submit
actions occur on a separate tab and are outside the game's input count; they
must never be described as gameplay or used to hide game inputs.

`tools/supervised_native_play.py` now provides a manual JSON-lines bridge for
trusted supervision. Launch with `python -m tools.supervised_native_play --config
CONFIG --output NEW_DIRECTORY`. The config contains `requirements` and `identity`
arguments for `NativePlayGuard`; optional provenance explains the source build
and capture method. The output directory must be new; interrupted runs cannot
be resumed or overwritten through this bridge.

Send `observe` with visible capture `text`, then `input` with `action` and its
parameters. Only after the bridge emits a `permit_id` may the supervisor execute
exactly that one native action. Send `ack` with the matching permit ID and boolean
`succeeded` from the actual tool result. Capture the new state before deciding
again. Independent `checkpoint` commands supply `name` and observation `ref`;
`stop` exports and ends the run. The bridge records attempted inputs via the
guard, retains UTF-8 captures/hashes, and keeps a dispatch log. A pending permit
is persisted before dispatch and remains after an invalid/missing acknowledgment;
that session stops. A failed native tool consumes an attempt. A pending file or
interrupted process cannot be presented as completed execution.

This protocol trusts the supervisor's capture, single-action dispatch and ack.
It neither authenticates CUA tool output nor disables the player's other tools.
The first real experiment used Luna decisions and Astra-operated CUA, with
explicitly labelled transcribed AX excerpts. See
`experiments/20260920-luna-supervised-guard.md`. It is diagnostic evidence, not a
sealed isolated critic receipt. Screenshots/motion remain necessary for visual
and physicality claims; text-only checks do not establish those properties.

The current desktop agents still have direct CUA tools. This Python guard cannot
intercept those calls, stop their budgets, authenticate their free-form summaries
or reconstruct missing history. The existing Luna experiments remain diagnostic
reports; they are not retroactively promoted to v2 receipts.

The executor integration must expose only guarded one-input actions, run actual
capability preflight, retain captures, keep independent checkpoint verification
outside the player, and preserve the ledger across process/retry boundaries.
This in-process guard does not implement restart persistence, elapsed-time/token
limits, provider calls, isolation provisioning or a live budget allocator. Those
remain executor responsibilities. No live-model service/deployment is authorized.

Creative direction still starts with Astra. Bounded tasks start with Luna;
uncertainty uses the task-routing policy. A v2 receipt establishes protocol and
evidence provenance under the trusted-harness assumption, not model reliability,
creative quality, learning mastery or release approval.

## Validation

### Repair-return qualification

`tools/qualify_native_repair.py` connects a returned repair record to existing
critic capsule, execution-receipt and result validation. `--request` takes the
child request inside a repair proposal; `--run-dir`, `--worker-executor-id` and
`--capsule-dir` prepare a new sealed review capsule. The retained `execution.json`
must equal the submitted record, every capture hash is checked, and worker
session must differ from the source session. Build and assigned native task stay
unchanged. The capsule path must be new; prior reviews are never overwritten.

The assignment includes the repair request intent digest, native record digest,
worker identity/session, original native requirements and recomputed coverage.
Only the retained record and its captures are supplied. This is informed evidence
review, not a cold player-experience pass. An independent reviewer then uses the
existing receipt/result workflow; adding `--reviewer-receipt`, `--reviewer-result`
and new `--output` qualifies that return against the original capsule.

Qualification rejects another run's review, changed artifacts, an altered
assignment, a reused worker session, or self-review by the worker executor/session.
A passing review must account for all retained observations and have complete
native coverage, successful input and final observation. Partial review may
remain unresolved rather than being forced into pass. The output is task-local
`evidence_repair_qualified`, `unresolved` or `needs_revision`, with
`product_acceptance: undetermined` and `dispatch_authorized: false`.

Identity separation and acquisition remain trusted harness facts: different
strings do not prove actual isolation, and identical image bytes can legitimately
occur in separate fresh sessions. This gate does not infer freshness from unequal
image hashes or authenticate screenshots. It also does not measure model-call,
cost or wall-clock budgets. Those remain configured executor responsibilities.
Passing these checks cannot close other review profiles or readiness schema v2.

138 focused tests cover this complete structural path and prior native/adapter
checks. Qualification tests use explicitly synthetic records, images and reviewer
responses; no model review or native run is claimed for them. A real independent
repair-review trial remains the next proof. The inbox rejection path consumes
bounded request bodies with a read timeout before rejecting origin/route, so
Windows can receive the HTTP rejection instead of an unread-body reset.

### Offline worker/reviewer handoff

`tools/build_native_repair_proposal.py` now builds a normal adapter-v0.1 child
request for missing native evidence. The CLI takes `--parent`, `--run-dir`,
`--budget`, `--parent-run-ref`, `--evidence-ref`, new `--request-id` and
`--idempotency-key`, plus a new `--output` file. It is an offline proposal builder,
not a transport or a live orchestration integration.

The builder validates the original native identity/contract and capture hashes,
requires the parent base revision to match, and recomputes coverage. It does not
trust a modified `followup.json`. Complete coverage with successful input and a
final observation yields `no_evidence_repair_needed` and no request; this is not
product acceptance. The real completed capture record exercised this path with
a synthetic parent request; the retained result is
`artifacts/native-capture-20260920-run1/adapter-proposal-check.json`.

An incomplete run yields `proposed_only`. Budget dimensions must all be supplied
explicitly as positive integer ceilings no greater than the parent's. This bounds
the proposed child; it does not allocate or prove remaining cumulative budget.
The parent execution-policy reference, reviews and acceptance requirements remain
intact. Repository write scope is narrowed to empty. The task is evidence repair,
not game repair or an escaped-production-failure incident. Artifact retention is
an executor responsibility outside repository editing.

The request carries a source record digest and evidence ref, source identities,
recomputed gaps and the full native requirements in the
`vibelearn.native_evidence_repair.v1` extension. That token is also a hard required
capability: an executor must explicitly implement its semantics. Existing fixture
transport rejects it before start; it is not claimed as an existing Terminal PM
capability. The builder never calls `start_run`. Both envelope and extension say
`dispatch_authorized: false`; future live admission must separately satisfy the
configured execution/budget policy rather than treating a generated JSON file as
authorization. Evidence refs need resolution before any external run; no evidence
has been uploaded by this tool.

Every child is a **fresh-session replay**, even if an in-process supervisor could
still collect a missing after image. Copying old counters/captures into a new
session would misstate action-relative provenance. Source evidence is informed
repair context, not a cold-observer record. Luna is a worker recommendation only;
existing Astra creative ownership and independent discipline gates remain intact.

The blocking `vibelearn:review/native-evidence-coverage@1` profile requires a
reviewer separate from the repair worker to check the same build, fresh session,
full assigned checkpoints, correctly timed modalities, retained capture hashes
and supported conclusions. It requires attempted reproduction of substantive
claims when possible. The existing result/receipt validators remain the authority
for structural validity; a reviewer cannot substitute confidence for missing
captures. An unresolved result remains unresolved and cannot promote the game.

129 focused tests pass across proposal generation, adapter compatibility, native
execution and critic evidence ingestion. These include stale build/tampered byte
rejection, budget/policy checks, independent review preservation, no unnecessary
child, source-bound intent identity and unsupported-capability refusal before
dispatch. They do not establish live executor qualification.

The screenshot inbox/import and repair-proposal slice passes 95 focused tests.
Added coverage checks exact-byte retention, malformed/text payload rejection,
same-origin scoped HTTP intake, digest/path confinement, independent run copies
and capture-now versus replay follow-ups. Live proof is documented separately;
synthetic unit-test images are not represented as browser screenshots.

The newer capture-coverage slice passes 90 focused tests across this pipeline.
Added cases cover AX/unknown modality substitution, missed pre-action capture,
wrong-side and stale captures, failed/missing/other action occurrences, refusal
before dispatch, assignment identity binding, and pass rejection while retaining
unresolved coverage gaps. Media content remains a trusted-acquisition concern;
these tests do not pretend synthetic observations are real GUI evidence.

79 focused tests passed across supervised dispatch, native execution, task policy, receipts, results,
assignments, capsules and sequential ingestion. The native tests use controlled
callbacks and synthetic captures, including unrelated maze/garden checkpoint
names. They verify refusal before dispatch, failed-input accounting, concurrent
calls, missing observations, checkpoint references, stop-after-success, capture
integrity, missing capabilities, legacy compatibility and ingestion rejection.
Bridge tests additionally cover persisted pending permits, malformed ack shutdown
and failed-tool budget accounting. These tests are not GUI gameplay evidence;
the separately documented supervised run supplies the narrow live evidence.
No game runtime changed in this slice.
