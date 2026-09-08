# VibeLearn game UX critic gate

Purpose: prevent a polished website from being mistaken for a good learning game.

This review is a deliberately separate pass from implementation. The critic evaluates the shipped candidate against fixed criteria and records evidence before assigning a score. Do not change the rubric to rescue a weak build.

## Pass rule

- Overall weighted score must be **>= 8.0 / 10**.
- No critical blocker may remain in the core loop, progression/unlock logic, accessibility, persistence or evidence integrity.
- A score >= 8 means the candidate is good enough to put in front of the learner again, not that it is final.

## Rubric

| Area | Weight | 10/10 means |
|---|---:|---|
| Game identity vs website residue | 15% | The primary screen reads immediately as a game/campaign, not a SaaS/dashboard/form with game labels. |
| HUD & information-at-a-glance | 15% | Mission state, objective, progress, XP and useful tools are visible/glanceable; secondary detail is one action away. |
| Core loop clarity & immediacy | 15% | The player instantly understands what to do, can act directly, and receives clear response to every meaningful action. |
| Progression & difficulty curve | 15% | Early easy win, sequential mechanic teaching, visible unlock path, rising challenge, and a boss that recombines learned mechanics. |
| Feedback / game feel / juice | 12% | Selection, saving, reveal, clear, reward and unlocks feel responsive and satisfying; animation communicates cause/effect. |
| Theme & visual cohesion | 10% | Typography, icons, surfaces, motion and vocabulary belong to one game world and one interaction language. |
| Learning integrity | 10% | Game rewards do not distort evidence/mastery; help, checkpoints and review meaning remain honest and inspectable. |
| Accessibility & responsiveness | 8% | Keyboard/touch, narrow screens, readable text, contrast and reduced motion remain first-class rather than afterthoughts. |

## Critical blockers

Any one of these blocks a pass regardless of numeric score:

- locked missions can be started by client forgery;
- player can lose saved work through normal navigation/reload;
- XP/reward changes evidence or mastery semantics;
- a required action is inaccessible on keyboard or narrow mobile;
- raw implementation/network errors are shown as learner-facing copy;
- early onboarding presents several new mechanics simultaneously without a clear goal;
- important state exists only in long body text when it should be in HUD/feedback;
- the current mission is substantially harder than the mechanics the player has been taught.

## Review evidence to collect

Before scoring, inspect at least:

1. signed-out/login state;
2. campaign map at a fresh account;
3. Level 1 launch and first decision;
4. selection feedback;
5. save -> reload -> resume;
6. hint reveal;
7. Level 1 clear + XP;
8. Level 2 unlock;
9. locked Level 3/4 behavior before prerequisites;
10. mobile/narrow viewport;
11. reduced-motion behavior;
12. boss mission after prerequisites;
13. evidence/review details after clear.

## Recorded critic review — 8 September 2026

### Candidate

Commit: `3bbdfe18d2a8f38ad531ecbe585d993ba6ef4eb9`
Reviewer pass date: `2026-09-08`
Verification inputs: GitHub Actions `Verify hosted pilot` run 102 (`34215243233`), 57 Python/hosted/PostgreSQL tests, full real Chromium 138 browser campaign journey, real temporary database, actual process restart, dropped-acknowledgement fault injection, 390px viewport, 200% text enlargement and reduced-motion context. The browser run reported no page errors.

The review is a separate critic pass using the rubric above; it is not represented as an independent external model or human review.

| Area | Score | Evidence / criticism |
|---|---:|---|
| Game identity | 8.5/10 | The old sidebar/topbar and permanent right rail are removed from play. A persistent game HUD, bottom tool dock, campaign path, locked nodes and direct outcome decisions now dominate the experience. Some central task/debrief geometry still inherits card/table structure, so it is not yet a fully bespoke game scene. |
| HUD | 8.4/10 | Level/boss state, mission objective, chapter progress, XP and sync state are glanceable on desktop; Hint, Intel, Play style and Save are persistent HUD tools with one-action drawers. On smaller layouts one secondary sync statistic is hidden to preserve space, although Save remains available in the dock. |
| Core loop | 8.8/10 | Campaign map -> launch -> direct 1/2-charge decision -> optional HUD tools -> lock answer -> debrief/reward -> continue is clear and test-covered. Early missions remove diagnosis/source/mode complexity until the player needs it. |
| Progression | 9.4/10 | Tutorial -> Easy -> Medium -> Boss is a real server-enforced curve. Levels 1-2 teach one mechanic with one decision; Level 3 introduces two decisions, explanation and optional assisted tools; the boss recombines three traces plus full contract reasoning. Incorrect submissions may earn bounded practice XP but cannot unlock the next mission. |
| Feedback / juice | 8.4/10 | Selection locks with tactile feedback; trace events reveal in causal order; sync flashes; newly available/cleared nodes animate; results enter as a dedicated screen and rewards pop. Motion is meaningful rather than ambient. There is still room for richer optional sound/haptics/scene-specific visual feedback later. |
| Theme | 8.5/10 | Dark tactical systems-game shell, lime/cyan/violet state language, consistent HUD/dock vocabulary and campaign terminology feel coherent. Residual dense tables/details appropriately remain for technical content but still carry some web/document ancestry. |
| Learning integrity | 9.7/10 | Historical Phase 1 snapshots remain immutable; campaign activities/families use new IDs; mission unlocks depend on correct pinned evidence rather than XP; XP does not affect mastery; help/source exposure, checkpoints, retries and evidence remain honest and inspectable. |
| Accessibility | 8.8/10 | Browser gate covers keyboard flow, 390px layout, 200% text enlargement, separate learner context and reduced motion. No horizontal overflow or page errors were observed. Mobile HUD is intentionally denser and deserves continued real-device refinement. |

Weighted total: **8.8 / 10** (`8.7975` before rounding)

Critical blockers: **none observed in the verified candidate.**

Verdict: **PASS >=8**

### Remaining design debt after the pass

Passing this gate does not mean the game UI is finished. Highest-value follow-ups are:

- diversify future mission interactions beyond cards/tables and binary outcome choices (sequence building, diagram manipulation, debugging/repair interactions, etc.);
- improve mobile HUD glanceability without increasing cognitive load;
- add richer optional audiovisual/haptic payoff only where it communicates success, danger, unlock or causality;
- expand progression beyond the four-mission retry chapter with fresh recall missions and new chapters while keeping difficulty tied to demonstrated understanding;
- keep running this same critic rubric after substantial game-loop/UI changes. A future candidate below 8.0 must not be treated as a passing game experience merely because this version passed.

## Current baseline observation

The pre-HUD September 8 build was visually polished but still structurally a website: top-level page sections, permanent side/context rails, form-style answer entry, and progression mostly expressed as text. It should not be considered an 8/10 game UI merely because it looked clean.
