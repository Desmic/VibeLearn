# Critic handoff — evidence-first pipeline

**Active from 18 September 2026.**

## Current frozen execution target

Operator/orchestrator metadata only — **do not inject this whole handoff into a
reviewer session**.

- candidate SHA: `471de882a01690fa50ac39455ad603fffd39cfdc`;
- exact technical/evidence run: `35440122451`;
- sealed review-index/capsule artifact: `10583163540`;
- artifact name:
  `review-evidence-index-471de882a01690fa50ac39455ad603fffd39cfdc`;
- artifact retention: through **19 October 2026**;
- canonical repository `main` may contain later documentation-only commits;
  those do not change this review target.

This replaces 92a5ecbd after evidence-backed marker and renderer repairs.
The old bundle remains historical; do not transfer its reviews to this candidate.

Ready first-wave passes:
- `cold_observer`;
- `motion_audience`;
- `physicality`;
- `handoff_tutorial`;
- `audio_atmosphere`;
- `learning_transfer`.

Dependency-blocked until a validated cold-observer result is ingested:
- `cinematic_causality`;
- `intent_comparison`.

Do not regenerate assignments merely because `main` advanced. Use this exact
candidate artifact until a real critic blocker requires a new candidate or an
explicit product decision changes the frozen review target.

Read:
- `EXPERIENCE-QUALITY-SYSTEM.md`
- `CRITIC-POLICY.md`
- `ART-WORLD-DIRECTION-CRITIC.md`
- `STATE.md`
- `CURRENT-GAME-CRITIC.md`
- `GAME-OPENING-PROGRESSION.md`
- `GAME-CREATION-PLATFORM.md`

Do **not** start from story treatment or creator rationale unless your generated
critic assignment explicitly allows those sources.

## Reviewer execution contract

A serious reviewer should not receive this repository as an unrestricted context
dump.

Before launching a review, verify the harness's actual initial context. Disabling
conversation history does not necessarily remove automatically supplied repository
instructions. On 19 September, two no-history subagents inherited AGENTS.md and
stopped before opening their capsules. Neither produced a valid independent
result. A startup context audit must therefore precede evidence consumption;
stop if unrelated product/creator context is present. Do not issue an
`assignment_only` execution receipt for that session. See
`REPAIR-20260919-MARKER-CLEARANCE.md` for the local diagnostic record.

The orchestrator must:

1. start from one exact runtime candidate SHA;
2. use that candidate's CI `review-evidence-index`;
3. generate your pass assignment with `tools/build_critic_assignments.py`;
4. launch a fresh reviewer session from that assignment capsule;
5. create a harness-side execution receipt with
   `tools/critic_execution_receipt.py`;
6. provide only evidence/context allowed by the assignment;
7. collect your raw `vibelearn.critic-result.v1` result;
8. revalidate it with `tools/ingest_critic_results.py`.

Your result must echo the exact `assignment_id` and
`execution_receipt_id`.

If required evidence is unavailable or ambiguous, return **unresolved**. Do not
substitute a weaker modality.

## Passes

The quality system intentionally separates passes.

### Cold observer

Starts from caption-blind/player-facing evidence before source/design intent.

Report:
- what kind of place/world you perceive;
- important characters/relationships;
- ordinary activity;
- what event occurred;
- what appears to cause it;
- what changed afterward;
- who/what you control at the handoff;
- what you think the next action is;
- anything understood only because of explanatory text.

Do not read source/story treatment in this pass.

### Cinematic causality

Requires a validated cold-observer result plus motion evidence.

Judge:
- visible cause/source;
- anticipation;
- character/environment reaction;
- camera/VFX/lighting/atmosphere;
- audio contribution when available;
- persistent world-after consequence;
- whether perceived magnitude matches narrative magnitude.

### Motion / audience

Watch actual motion over time.

Judge:
- idle/rest;
- locomotion;
- interaction/reaction;
- cinematic acting;
- loop repetition;
- stylistic coherence;
- unintended uncanny/creepy/twitchy reads for the target audience.

Still screenshots cannot certify this pass.

### Physicality

Use interactive evidence.

Probe:
- walls/props/doors;
- opened/closed traversal;
- camera geometry;
- unusual approach angles;
- visible solid objects versus actual collision.

### Handoff / tutorial

Use a fresh interactive path.

At every transition answer:
1. who/what is controlled now;
2. what changed;
3. current goal;
4. available verb/control;
5. one best next action;
6. visible success signal.

Each tutorial step needs target/control -> action -> success detector -> feedback.

### Audio atmosphere

Listen to the captured player-facing audio.

A raw audio file is input evidence, not an audio-quality judgment. Record actual
listening observations and return `audio_listening` through the validated critic
result pipeline.

### Learning / transfer

Use authoritative replay/evidence, not completion alone.

Judge concept fidelity, changed-context transfer, assistance, and whether human
prediction/hints can incorrectly influence the authoritative model outcome.

### Intent comparison

Runs **after** a validated cold-observer result exists.

Compare observed meaning against source/design intent. Do not rewrite the cold
observations to fit the design.

## Evidence discipline

Match evidence to claim:
- world comprehension -> cold report + caption-blind motion/interactive evidence;
- motion -> motion evidence;
- audio quality -> actual listening;
- physicality/tutorial -> interactive trace;
- learning -> authoritative replay;
- art composition -> screenshots plus traversal/alternate cameras.

Every result records observations before interpretation, uncertainties,
counterexample attempt, blockers/retest, evidence actually used and harness
execution receipt.

## Release boundary

Green CI is not creative readiness.

Normal preview promotion requires:
- exact-candidate successful technical run;
- complete review index;
- every required post-CI critic pass revalidated;
- every required critic verdict = **pass**;
- schema-v2 final review record = `ready_for_user_review`;
- no explicit blocker;
- candidate not human-rejected.

An explicit user preview override may only bypass **missing/unresolved** review
for a technically safe candidate. It may never bypass a `needs_revision`
critic verdict or an explicit blocker.

Only the current user's explicit verdict establishes product acceptance and
permits Phase/Level advancement.
