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

## Score record template

### Candidate

Commit: `<sha>`
Reviewer pass date: `<date>`
Verification inputs: `<CI / browser / live / screenshots>`

| Area | Score | Evidence / criticism |
|---|---:|---|
| Game identity | /10 | |
| HUD | /10 | |
| Core loop | /10 | |
| Progression | /10 | |
| Feedback / juice | /10 | |
| Theme | /10 | |
| Learning integrity | /10 | |
| Accessibility | /10 | |

Weighted total: **/10**

Critical blockers: `<none or list>`

Verdict: `FAIL <8` / `PASS >=8`

Required fixes before next review:

- ...

## Current baseline observation

The pre-HUD September 8 build was visually polished but still structurally a website: top-level page sections, permanent side/context rails, form-style answer entry, and progression mostly expressed as text. It should not be considered an 8/10 game UI merely because it looked clean.
