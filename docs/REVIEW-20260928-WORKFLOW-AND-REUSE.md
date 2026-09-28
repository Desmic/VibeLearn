# Workflow and reuse audit — 28 September 2026

Scope: root Astra's review of the implementation plan, commits `af49886` through
`a6d609d`, their informed GUI reports, and Sol's current source-access repair.
This is a source/process audit, not another gameplay verdict. No new readiness,
main merge, deployment or Level 2 approval is implied.

## Finding

Work follows the approved v5 learning design and lean Sol worker / single Astra
reviewer model. Saved v1–v4 behavior, first choices and assessment/output separation
remain explicit boundaries. The reports close repaired findings honestly and leave
broader story/art/world, hosted entry and unobserved behavior open. Motion/audio
remain deferred. The current branch has four local commits beyond its remote;
final checkpoint push remains Sol's responsibility, subject to its existing scope.

The loop is not yet efficient. Successive independent passes found neighboring
states that worker verification had missed: source reload, landmark occlusion,
retry action duplication, detached status, then postcommit inspection. These are
real findings, not evidence the reviewer should relax standards. Sol reports about
16 minutes for the full browser sequence and five minutes for full presentation
on the latest checkpoint. Repeating these before every narrow repair recheck
spends integration effort before the affected interaction is stable.

The latest concrete cause was an inspection guard that disallowed reading a sign
after insertion/inference, even though the visible control invited that action.
The correction separates inspection permission from staging/commit permission.
This demonstrates a missing transition probe, not a reason for a new framework.

## Execution correction

Sol retains implementation ownership. Before another reviewer handoff, cover one
coherent affected sequence: inspect A, stage A, inspect B, reload, insert A,
predict, generate, inspect without mutation, pause/history, reload, finish,
failure, replace source, retry, and closed output. Exercise physical and semantic
access, phone/desktop and enlarged text at the relevant risk points; do not form
an exhaustive Cartesian product. Verify both permitted actions and forbidden
mutations. A visible enabled-looking action must respond in its current phase.

Keep a compact finding/closure/nearby-regression list in the checkpoint evidence.
Use existing tests and adaptive harness; no new orchestration or test framework.
Run focused tests and worker-directed GUI checks first. Required exact-candidate
presentation evidence still precedes any review record. Same-reviewer informed
repair probes need only the changed behavior and adjacent risks. Run the full
build/application/browser gate at the stable integrated checkpoint, and repeat
affected checks after subsequent changes; broaden for real cross-cutting risk.
Never use old SHA evidence to certify changed code.

After local closure, request an explicit disposition of the original world-treatment
P1, not just the latest P2. Fewer clicks and visible gate marks are supporting
evidence, not automatic proof of meaningful embodied play. Original story/attachment
and art/world findings remain next design work. Stop multiplying tiny full review
walks while those larger goals disappear from view.

## General-system value and limits

| Work | Reusable guarantee | Limit |
| --- | --- | --- |
| Required-content fitting | Protect required descendants, restore them and report inability to fit | Does not decide which facts a learning design requires |
| Reversible source store | Attempt/version-scoped pending state without assessment commands | Browser-session recovery, not cross-device durable storage |
| Renderer recovery and Harbor opening | Shared runtime handles context loss and another world configuration | Not proof of a second accepted game or universal generator |
| Landmark visibility probe | Uses existing projection/picking plus DOM obstruction checks | A sampled point does not certify an entire silhouette or composition |
| Status/action distance and text scaling | Detect detached labels and enlarged emphasized text | Geometric checks do not establish comprehension or aesthetic quality |

Keep learning/world identity authored and the reusable guarantees small. The route
controller still owns many phase-dependent presentation decisions. Consolidate a
duplicated permission rule when an observed defect warrants it; do not extract the
entire controller into a generic engine before a second real use case needs it.

## Reuse assessment

The repo already uses PlayCanvas, its shared picking/projection adapters, the common
browser harness, and pinned Quaternius assets with provenance in
`tools/vendor_game_assets.py`. The new pending-source store and feature probe are
small application adapters, not reinventions of storage or a renderer. Replacing
them with dependencies would not resolve the observed design defects.

A bounded future comparison is worthwhile for the hand-written DOM marker solver:
[Floating UI virtual elements](https://floating-ui.com/docs/virtual-elements)
accept projected reference rectangles, and
[shift/limitShift](https://floating-ui.com/docs/shift) handles viewport overflow and
limits detachment. This is a candidate, not an evaluated replacement. Compare one
existing marker using actual camera movement, phone/enlarged text, semantic focus,
frame cost and cleanup. Retain VibeLearn's subject-clearance, semantic priority and
world-occlusion rules. Adopt only if total code and failure/maintenance cost fall;
do not migrate during this repair merely because a library exists.

For future commodity scenery and input icons, inspect the existing pinned assets
before producing new ones. [Kenney's asset policy](https://kenney.nl/support)
identifies its asset-page game assets as CC0; select a specific suitable pack and
retain its own license, hashes and style/performance evaluation through the existing
ingestion path. No assets were acquired in this audit. Custom learning devices,
characters and landmarks still need intentional design. More assets will not solve
the current relationship or interaction-treatment findings.

Source pages checked 28 September 2026. Root owns this architectural/reuse assessment;
Sol owns routine implementation, verification and cleanup. Escalate material design
ambiguity or a persistent complex failure, not each ordinary test failure.
