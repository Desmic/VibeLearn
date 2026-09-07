# Acceptance specification for the future implementation

These are requirements to automate, **not tests that have been run against a learning application**. Use real persistence and a fixed clock. Synthetic reviewer approvals and evaluator outputs are fixtures, not claims about the real learner or the educational validity of draft examples.

## A. The central replacement proof

### A1. Physically remove Course A and retain learning

Given an explicit learner-owned goal covering the shared A/B frames plus the later retry target, independently registered competencies/frames, and reviewed test-only content;
and given Course A is installed and Course B is not;
and given the learner has three accepted aid-compatible performances for the shared idempotency frame, spanning two validated families/contexts and dates including a seven-day delayed probe;
and given the stale-authority frame has an unresolved critical failure;
when the test records canonical observation/root hashes, current judgments, mastery derivation, and retrieval target/due/interval/evidence basis;
and physically deletes Course A's installation, route-node, and course-version rows;
and imports/activates Course B through the normal package boundary;
then all original observations, responses, exact rubric/binding/frame snapshots, corrections, and evidence roots remain readable;
and a projection rebuilt without Course A records has the same result at the same clock, evidence cursor, and policy versions;
and Course B's planner bypasses routine idempotency teaching on retained evidence, selects a targeted stale-authority diagnostic, and recognizes the retry target as unknown;
and no mastery fact is derived from matching lesson titles, lesson IDs, old course percentages, or enrollment migration;
and Course B has no imported “completed lesson” flags.

Assert only the eligible task behavior dictated by lane/budget rules: do not write a brittle test that expects every candidate to fit into one session. The retained evidence must influence the decision trace even when review/coverage constraints select a different first item.

### A2. Distinguish provisional bypass from supported knowledge

Given only one strong valid diagnostic, when Course A is replaced, Course B may provisionally bypass routine instruction but must still show limited evidence and schedule a delayed independent probe. It must not label the competency permanently mastered.

### A3. Remove all courses

Delete all curriculum-owned rows, restart the application, and open Knowledge/Evidence/Review. These views must work without live course lookups. Goal-only planning must work with approved standalone catalog activities. Delete every unused catalog activity too: history still works and unserviceable retrieval is explicitly blocked, not discarded.

### A4. Actual foreign-key/cascade test

Inspect database constraints and issue raw course-table deletes in an integration transaction. Fail if any delete cascades into learning/registry state or a restrictive learner->course foreign key prevents curriculum removal. A mock repository test alone is insufficient.

### A5. In-flight replacement

Start and seal an attempt from A, remove A, activate B, then evaluate the original attempt. It must use A's frozen stimulus/rubric/binding snapshot, not the latest B content. Subsequent new tasks use B/independent content as appropriate.

### A6. No content camouflage

Change course name, all lesson IDs, module hierarchy, provider label, and course version while holding normalized route intent, frames, candidates, evidence, and policies equal. Core estimator, scheduler, and planner outputs are equal apart from application-level copied origin labels. Course completion is irrelevant.

### A7. Domain-independence probe

Activate Course C's prose argument-analysis fixture with reviewed test-only text-response assessment. Complete a diagnostic, record evidence, schedule retrieval, and plan a follow-up without installing a repository/runner adapter or changing core code. The generic frame/criterion pathway must suffice.

## B. Competency and mapping evolution

B1. A competency referenced by zero courses remains valid and inspectable.

B2. Two courses with the same display label but different competency definitions do not merge automatically.

B3. A course imports a conflicting issuer-local identifier. It stays namespaced/proposed and cannot overwrite the existing registry item.

B4. An editorial rename with an approved exact-equivalence mapping reuses root observations exactly once. Apply the same mapping twice: no evidence inflation.

B5. A semantic split creates two new target identities. The old scalar is not copied to either. Explicit criterion routing is allowed only if implemented, reviewed, and nonduplicating; otherwise both targets require diagnosis.

B6. A merge of targets with overlapping roots does not count the shared attempt twice. Averaging old mastery numbers is forbidden.

B7. Correct a wrong criterion binding. Original judgments remain in the audit view; active attribution/projections change only through a reviewed correction with impact report.

B8. Add related/application cycles: allowed. Add a cycle in approved hard requirements: rejected with the cycle path. A suggested course sequence never becomes a hard prerequisite merely by import.

B9. Pass a child/refinement competency. Parents/prerequisites do not automatically receive scored observations.

## C. Attempts, assistance, and assessment

C1. Opening, reading, or marking a lesson complete produces no performance evidence.

C2. Request a hint after sealing a response. The earlier checkpoint can remain independent; later work records help. A mode switch cannot erase assistance events.

C3. A level-1 hint accidentally contains a complete solution. Record actual disclosure and exclude subsequent work from independent evidence; do not rely only on numeric hint level.

C4. A formatting/accessibility clarification with no conceptual disclosure does not automatically count as a solution hint. Unknown disclosure is conservative and inspectable.

C5. BUILD mode receives a direct useful solution and never blocks shipping on a quiz. The finished agent-generated artifact does not by itself establish learner reasoning. A later separate LEARN probe can.

C6. A composite answer exposes two correct criteria and one unobserved criterion. Only observed valid criteria generate observations. Unobserved is not incorrect.

C7. Missing runtime, flaky evaluator, invalid question, inaccessible source, and provider timeout are distinguished from learner error. No zero score is emitted for infrastructure failure.

C8. A correct but concise answer and a verbose wrong answer expose judge verbosity bias in calibration fixtures. Include a valid solution that differs from the author's reference implementation.

C9. Two evaluators disagree on the same criterion. Store both judgments and one explicit active selection/pending dispute; do not count both as independent measurements or average unsupported judgments silently.

C10. Regrade a passing answer as failing. The prior interpretation is superseded, not deleted; active projections remove the old contribution before adding the new one.

C11. Correct the correction. Root identity remains constant; repeated adjudication cannot increase the independent sample count.

C12. An attempted prompt injection inside the learner response, source text, or course prose cannot modify rubric, grant tools, choose reliability weights, or invoke a mastery-write command.

C13. Partial-frame practice coverage produces visible evidence but no complete-frame skip claim. A missing critical criterion cannot be hidden by averaging other high scores.

C14. One hard valid diagnostic allows provisional bypass. Repeated near-identical easy tasks never satisfy the multi-family durable-support gate.

## D. Scheduling and planning

D1. Importing two courses targeting the same frame produces one current retrieval obligation, not duplicate debt.

D2. Remove the only activity able to service a due intent. Target, due-at, interval, and evidence basis remain; availability changes to blocked.

D3. Install a new compatible activity from another course/catalog provider. The old intent becomes serviceable without a new “learning success” or reset interval.

D4. A same-day/early repeated success does not advance the long-term interval. A qualified due delayed success does. Invalid evaluation does not reset; valid independent failure schedules repair/review.

D5. A family already exposed in BUILD remains exposed after course replacement. Relabeling it does not make it a novel transfer test.

D6. A structurally new context requires a validated novelty claim; changing character names is insufficient.

D7. Review caps and foundation quota work under a fixed time budget, and contradictions/unknowns are represented distinctly. No forced review backlog explosion occurs after a pause.

D8. Change active subjects/goals. Old evidence remains; maintenance can pause. Importing an unrelated large graph cannot inflate current-goal centrality and reorder reviews arbitrarily.

D9. User explicitly overrides a recommendation. The plan changes and records why; the override does not become fake mastery evidence.

D10. With no eligible content, return a reasoned content gap. Do not silently replace a hard diagnostic with a trivial question and call the gap solved.

D11. Run the same pure planner at the same explicit clock and inputs: deterministic output. Change clock across a due/stale boundary: only explainable temporal behavior changes.

D12. Source retrieval by the model is not a learner exposure event. Learner-visible theory/solution material is; delay accounting reflects the distinction.

## E. Persistence, import/export, and failure recovery

E1. Duplicate submission/evaluation acceptance command with identical key/payload returns the original result; evidence and retrieval count are unchanged.

E2. Reuse a command ID with a changed payload: conflict, no mutation.

E3. Crash before commit, after event write but before projection write, and after commit before response. Retry must produce either no accepted transition or exactly one complete transition, not mismatched evidence and mastery.

E4. Simultaneous evaluation completion or concurrent browser tabs cannot lose events, activate two judgments, or double-count a root. Test against the actual database.

E5. A model call runs outside the learner lock; a slow provider cannot hold the transactional write lock for its duration.

E6. An asynchronous/stale projection cannot silently drive a new plan requiring a later evidence cursor. Return pending/stale or reproject.

E7. Export, remove all installed courses, restore into an empty database without provider access, and rebuild from saved judgments. Canonical IDs, explanations, corrections, and scoped estimates survive. Export omissions are reported.

E8. Same published course identity/release with changed bytes is rejected. Identical re-import is idempotent. Exact dependency revisions cannot silently resolve to latest.

E9. Archive path traversal, symlink escape, oversized decompression, remote-private-address source fetching, and attempted executable hooks are rejected before activation.

E10. Loss/retraction/correction of a source creates an availability/content-review issue and explicit reassessment process, not automatic learner failure.

E11. Rebuild or change the embedding provider/index. Evidence, mastery, and historical citation identity do not change.

E12. Replace provider driver with a contract-compatible second driver/stub. Persistence, scheduling, and recorded-judgment replay still work. Report real-provider smoke tests separately from stub tests.

E13. Disable the project adapter or delete live repository access. Existing standalone exercises/history still work or show precisely which optional artifact was erased.

E14. Explicit privacy erasure removes selected private bytes/derived caches under policy and recomputes affected views. Normal course deletion never invokes this operation. Replay limitations become visible rather than hidden.

## F. Property and architectural tests

Use property-based fixtures for: idempotent command handling; root-evidence deduplication; bounded sample weights; exact-equivalence transitivity without double counting; unknown-not-failed semantics; graph cycle rules; course renaming/packing invariance; artifact lock integrity; pure replay under identical inputs; non-overlapping learner scopes; and stable due-target identity under content substitution.

Use import/dependency linting to forbid the learning core importing curriculum entities, course file parsers, provider SDKs, repository adapters, or UI/ORM types. Inspect schema relationships for illegal ownership, not only runtime imports.

Separate test suites: pure unit tests; contract/schema and invalid-fixture tests; real database integration; CLI/UI end-to-end; provider/runner smoke tests with real environment; and educational outcome evaluation. A green architecture suite is necessary but not proof of educational benefit.
