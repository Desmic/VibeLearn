# Candidate-scoped critic results

This directory is for **raw post-CI reviewer outputs** that will be revalidated
against exact-candidate assignments before any preview promotion.

Use:

`docs/reviews/results/<40-char-candidate-sha>/<pass>.json`

Do not commit files that merely claim to be "validated." The promotion workflow
does not trust that label. It downloads the candidate's immutable CI evidence,
rebuilds the review index, regenerates critic assignments, and runs
`tools/ingest_critic_results.py` to validate each raw result in dependency order.

## Raw result schema

A reviewer output uses:

`schema: "vibelearn.critic-result.v1"`

Required fields:

- `candidate_sha`
- `assignment_id` copied exactly from the generated assignment
- `pass`
- `verdict: pass | needs_revision | unresolved`
- `context_attestation.allowed_context_only: true`
- `context_attestation.observations_before_interpretation: true`
- non-empty attestation notes
- `used_evidence` copied exactly from the assignment's allowed evidence; it
  must include at least one item from every `required_evidence_groups` group
- non-empty `observations`
- non-empty `interpretation`
- `uncertainties`
- non-empty `counterexample_attempt`
- `blockers` with finding + retest when verdict is `needs_revision`

The reviewer should receive the generated assignment JSON for its pass rather
than broad project context.

## Sequential dependency

Results are revalidated in the quality-system order. In particular:

- cold observer starts from caption-blind/player-facing evidence;
- cinematic causality and intent comparison cannot validate until a real
  cold-observer result has been accepted into the candidate workspace;
- audio atmosphere consumes raw audio capture but emits a listening judgment;
- assignment packets are never observations;
- source/design evidence is withheld from the cold observer.

A missing evidence modality produces `blocked_missing_evidence`, not a weaker
substitute.

## Release boundary

A technically green CI run is not preview readiness.

The gated preview workflow requires:
1. exact candidate/evidence-run SHA match;
2. successful technical evidence run;
3. complete exact-candidate review index;
4. promotion-time revalidation of raw critic results;
5. a schema-v2 final review record that passes `check_release_gate.py`;
6. candidate not explicitly rejected by human review.

Level/phase advancement additionally requires explicit human acceptance recorded
for that exact runtime candidate.


### Assignment identity

Assignments now carry a deterministic `assignment_id` (SHA-256 over the exact
candidate/pass/evidence/context/questions contract). A raw critic result is
invalid if it was produced for a different assignment, even when candidate SHA
and pass name happen to match.

This prevents stale/replayed judgments after the evidence set or context policy
changes.

### Required evidence use

An assignment becoming `ready` only means the required evidence exists. The
reviewer must actually use evidence satisfying every required modality group.
For example, a cold observer cannot submit a result based only on an allowed
screenshot when the assignment required caption-blind motion/interactive
evidence.

The validator checks this from `used_evidence`.
