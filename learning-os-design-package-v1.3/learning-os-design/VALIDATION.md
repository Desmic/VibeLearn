# Design-package validation report

**Date:** 6 September 2026.

## Checks actually performed

- JSON Schema Draft 2020-12 meta-schema validation completed for the contract bundle.
- 47 schema definitions are present, including 28 top-level record types. All 139 local schema references resolved.
- 42 synthetic example JSON files passed structural validation with UUID/date-time format checks.
- 40 course artifact locks matched the exact supplied file bytes and referenced the expected catalog record kinds/revisions.
- Catalog competency/frame/activity/rubric/binding references were checked for agreement. Criterion attribution fractions were checked against the declared per-criterion budget.
- A and B share exactly two target frame identities and no activity identities. Their route nodes differ. C uses the same generic text-response capability and no software runner.
- 7 negative structural mutations were correctly rejected: learner_id, mastery, next_review_at, system_prompt_override, route_node.completed, malformed_digest, slug_as_uuid.

## Not performed

No application was implemented. No database migrations, persistence integration tests, provider calls, sandbox execution, live tutoring, mastery estimation runtime, scheduling runtime, or educational outcome experiments were run. The scenarios in `acceptance/ACCEPTANCE.md` remain implementation requirements.

Schema validation does not establish correctness of answer keys, source support, genuine task novelty, frame calibration, or semantic invariants enforced by future transactions. All example content remains draft. Source content digests are intentionally absent where bytes were not captured.
