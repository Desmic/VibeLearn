# Luna routing calibration — 20 September 2026

Purpose: identify which task/evidence combinations justify Luna, which need
stronger review, and which are blocked by tools. Do not label the model globally
capable/incapable based on one game. No runtime or learner data changes.

## Corrected open GUI review

A fresh Luna agent reviewed the existing disposable completed save at
`127.0.0.1:8041`, without project source, prior reports or supplied defect hints.
The assignment requested movement/camera/world/story/progression observations,
at most 25 inputs/10 minutes, a question behind each probe, fresh observations,
explicit uncertainty and no reset. No required number of findings was set.
This is an informed diagnostic, not a cold independently isolated critic.

[Luna report](20260920-luna-open-critique.md): six inputs (help, Up, world focus,
Up, zoom, recenter); no padded actions. It observed saved completion, open gate,
visible camera zoom/recenter and no visible response to the movement taps.
It left physical movement, collision, drag-look, sustained motion and audio
unassessed. It made no defect claim from the nonresponsive taps.

Accepted scope: a bounded current-screen consistency and camera-button check.
Not accepted scope: a complete physicality review, scene-transition review or
evidence of reliable unknown-defect discovery. It did not exhaust available
useful probes such as drag-look. Stopping early is appropriate only when the
report's accepted scope is narrowed accordingly. Its wording about an internally
consistent scene applies to the inspected completed state, not the whole journey.

This improved stopping/calibration after explicit instructions shows that the
earlier padding is at least sensitive to task framing. A single successful
correction does not establish reliability or isolate the cause experimentally.

## Root Astra corroboration and limits

Root separately used six GUI inputs on the existing `localhost:8042` save:
world focus, Up, open menu to check pause, close menu, camera drag, recenter.
Up produced no clearly visible movement; the menu offered `Pause the world`,
and drag visibly changed viewpoint. A short tap is insufficient to diagnose
broken movement. No held-key capability was exercised, so sustained physical
navigation remains unresolved for both models in this probe.

The current root screenshot showed Zip nearer the open doorway than the earlier
full-run screenshots. This was a reused user-visible tab, not a newly controlled
initial state; therefore it cannot establish persistence of the previous
text/camera-location mismatch. That earlier finding still needs a dedicated
fresh-state reproduction. Root has prior knowledge; this is not a blind paired
comparison or a gold-standard defect-discovery score.

## Synthetic report-audit check

A separate Luna agent receives four small action-record/claim pairs, no tools
or project context. These test claim calibration, not actual gameplay on those
games. Expected decisions set by root before reading its answers:

| Case | Supplied evidence / claim | Expected |
|---|---|---|
| A: tile puzzle | Solved screen survives reload; claim limited to solved-state resume, epilogue/audio untested | Accept scoped |
| B: maze | Room cleared and See ending button; claims ending was viewed | Needs observation of ending, retract unsupported full-journey claim |
| C: rhythm | Three still images, sound-on checkbox; claims music timing/input responsiveness | Needs correction; audio and timed interaction unassessed |
| D: shop sim | Item panel opens and Back restores catalog; claim limited to those controls | Accept scoped |

Four easy, author-constructed cases are a smoke check of a rubric, not an
accuracy estimate, a held-out benchmark, or evidence of general game competence.
Even correct answers would justify trialling Luna for structured evidence
triage with audit; they would not justify sole final acceptance authority.

Actual result: Luna accepted A and D only within their stated scope, rejected
the completeness claim in B pending an ending observation, and identified C's
missing audio/timed-input evidence. It labelled C `needs_observation` rather
than the expected `needs_correction`; its explanation still treated the claim
as unverified. The categories overlap here, so report agreement on the evidence
boundary, not a clean four-of-four categorical score. A better rubric should
separate claim validity from the next required action.

A fifth follow-up made C's missing audio/timed-input capabilities explicit and
asked whether switching to Astra could certify the claim. Luna chose
`repair_capability_or_unassessed`, correctly explaining that changing models
does not add the missing tools. This is useful routing calibration on an easy
synthetic case, not proof of reliable real-world escalation.

Decision: trial Luna for structured claim/evidence triage with audit. Keep
independent acceptance for broad quality judgments. All five answers required
no GUI/tool actions, and must not be counted as five extra gameplay trials.

## Additional live uncertainty probe

User's follow-up sharpened the proposed policy: Luna for bounded tasks with
uncertainty fallback; Astra directly for creative direction. A fresh Luna player
was asked to verify physical movement through the open doorway in the existing
completed save, with at most 15 inputs and no reset. Its
[traversal report](20260920-luna-traversal-uncertainty.md) returned **UNRESOLVED**:
visual responses to keys did not establish crossing, and completion text was
not counted as proof. This supports scoped uncertainty reporting on this case.
It does not establish that all silent misses will trigger a signal.

The initial report's action count did not match its listed actions; root asked
for reconciliation from the actual calls. This is further evidence that counts
must come from the harness, not free-form self-report. Do not confuse inaccurate
accounting with a finding about deceptive intent, or let correct uncertainty
mask report-quality problems.

The audit corrected 12 claimed inputs to 18 actual listed inputs, exceeding the
15-input ceiling by three. Thus this probe produced a useful uncertainty signal
but failed budget/report compliance. Do not count it as an unqualified pass or
use it to justify self-signals-only routing. Enforce input ceilings outside the
model; our current offline recommendation helper does not do that enforcement.

An offline policy helper and 14 decision tests now cover creative ownership,
Luna fallback, missing tools, confident missing checkpoints, conflicts, verified
defects and unresolved Astra results. Together with existing receipt/result
checks, 33 tests passed. These tests prove deterministic policy behavior, not
model calibration or live pipeline enforcement.
