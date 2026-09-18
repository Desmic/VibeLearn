# Current game critic — candidate rejected; quality system under repair

**18 September 2026.** Deployed runtime
`ad14c5aced6cf053c7617dfb03245506e1e9dad5` is **rejected by the current
user**. The user ended further review; no additional acceptance testing should be
requested for this candidate.

## Why the internal process failed

The previous internal process produced false 9/10 claims because it allowed
reviewers with design knowledge to reconstruct intent from partial evidence.

It did not adequately prove:
- cold-start visual comprehension of world/setting;
- cinematic magnitude and atmosphere in motion;
- who caused major events;
- semantic readability of important objects;
- animation style/audience fit;
- physical collision/navigation integrity;
- single-mode transition clarity;
- tutorial comprehension from a fresh-player perspective.

The critic also relied too heavily on screenshots/source. Those are insufficient
for motion, audio, atmosphere, collision, handoff and tutorial-feel claims.

## New quality-system direction

Use `EXPERIENCE-QUALITY-SYSTEM.md`.

Review order is now:
1. cold observer without design treatment;
2. cinematic causality/event-direction critic;
3. motion/audience critic;
4. physicality/traversal critic;
5. transition/handoff critic;
6. fresh-player tutorial critic;
7. design-intent comparison;
8. learning/transfer;
9. technical/accessibility.

Structural failures should be prevented by specs/runtime where possible rather
than delegated to prompts:
- world-owned colliders;
- explicit player motion profiles;
- major-event contracts;
- semantic story-object roles;
- experience-mode exclusivity;
- tutorial-step specs.

## Current development status

System repair is in progress on `main`. The current game is the proof case, but
new rules must generalize to future generated games rather than encode
Bellweather-specific checks.

No current numeric readiness score is valid. Historical scores remain evidence
of what the old rubric measured, not product quality.

Do not start Level 2 or present another candidate until the revised system is
exercised end-to-end and produces stronger evidence than the process that passed
`ad14c5a`.
