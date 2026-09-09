# VibeLearn game critic — active 9/10 pre-gate

Latest authority: [COMMERCIAL-GAME-BAR.md](COMMERCIAL-GAME-BAR.md) and [GAME-AS-COURSE.md](GAME-AS-COURSE.md), 9 September 2026.

## Reviewer role and user authority

The critic exists to reject weak candidates before they waste the user's time. It does **not** accept the product. The user is currently the only real product user/reviewer, and **their explicit judgment overrides every critic, agent, automated score and historical review for acceptance**.

A critic result can do only this:

- <9.0 unrounded, failed audience lens or critical blocker -> `needs_revision`;
- >=9.0 unrounded, both audience lenses pass and no blocker -> `ready_for_user_review`;
- explicit user rejection -> `user_rejected` / `needs_revision`, regardless of critic score;
- only explicit user acceptance -> `user_accepted`.

If a genuinely separate agent/model is unavailable, use `internal_tool_assisted`, disclose that limitation and keep the frozen rubric. Never describe the builder as an independent critic or human playtest.

## Review question

Would a curious younger non-specialist or an older teen/young adult recognize this as **an actual polished game**—credible in interaction/onboarding/pacing/feedback/cohesion against the kind of experience they could encounter on the Play Store or Steam—and choose to keep playing without being assigned a lesson?

The comparison is **not** only the prior VibeLearn build or educational websites. Low-budget/indie scope is acceptable; website-like interaction is not. AAA art, combat, 3D or free walking are not requirements.

Evaluate both audience lenses separately with stated reading/prior-knowledge assumptions. The learning ambition is course-level capability, but neither educational intent nor correctness earns engagement points.

Inspect a frozen rendered candidate: fresh entry, opening comprehension, meaningful first action, discovery, consequential choice, mistake/recovery, progression, boss, ending and replay. Hide XP. Collect actual browser actions, screenshots/traces and adverse-path results. State environment limits. Static screenshots/source descriptions do not establish the full loop.

## Pass rule

Unrounded weighted **>=9.0/10**, both engagement lenses passing, no critical blocker and exact-build rendered evidence produce only `ready_for_user_review`. User acceptance is a separate mandatory gate. No rounded-up sub-9 passes, score inflation, hidden failures or recycled historical numbers.

The latest user verdict on the current candidate is **5/10 game experience and 5/10 learning experience**. Treat that as the authoritative product rejection until a changed build is reviewed again by the user.

## Frozen weighted rubric

| Area | Weight | 10/10 means |
|---|---:|---|
| Game identity vs website residue | 15% | Primary experience is unmistakably a real game/playfield, not cards/forms/course pages with game labels or a renderer behind web UI. |
| HUD and information at a glance | 15% | Player role, immediate objective, stakes and meaningful state are clear; HUD supports the playfield rather than becoming page chrome. |
| Core loop clarity and immediacy | 15% | Player quickly understands the situation, acts, explores alternatives and sees causal consequences; loop earns voluntary continuation. |
| Progression and difficulty curve | 15% | Easy success precedes variation, new tools expand agency, taught mechanics recombine, transfer is fair and next-route focus is predictable. |
| Feedback and game feel | 12% | Inputs, state changes, setbacks, recovery and success feel responsive, physical/causal and satisfying rather than like report submission. |
| Theme and visual cohesion | 10% | World, character, dialogue, objects, typography, motion, menu language and audiovisual intent belong to the same game. |
| Learning integrity | 10% | Mechanics faithfully exercise the concept; claims bounded; assistance/exposure honest; rewards never substitute for learning evidence. |
| Accessibility and responsiveness | 8% | Keyboard/touch, narrow screens, text enlargement, sound-off, reduced motion and renderer fallback preserve required play. |

Calculate `sum(area_score * weight)/100`. For every score provide concrete evidence and criticism. No extra points simply for Three.js, test counts, code volume, animation or implementation difficulty.

## Critical blockers

Any of these blocks acceptance regardless of average:

- The product still primarily feels like a website/dashboard/course page/card stack/form flow instead of a game.
- No clear world/context, player role, inciting change/problem, stakes/success condition and first action before jargon where a faithful intuitive model is feasible.
- The opening relies on unexplained nouns/story context and forces the player to infer why they should care or what they are doing.
- A mostly read-card/answer-form loop when direct subject-relevant play is feasible; no convincing reason to continue with XP hidden.
- Early play mostly advances exposition rather than changing/revealing useful world state.
- An untaught rule/interaction first becoming a boss requirement; challenge rising mainly through reading or arbitrary interface complexity.
- New levels unlock more text/options but not more player agency/tools/capabilities.
- No meaningful failure/recovery, earned resolution or working replay variation.
- Menus/save/pause/settings repeatedly break the fantasy/game language with implementation/admin vocabulary.
- Unsafe constructed policies clearing because unrelated count answers happen to be correct.
- Saved work lost through ordinary navigation/reload, forged unlocks, cross-learner access or mutable submitted evidence.
- XP/self-report changing mastery, evidence strength or correctness-based unlocks.
- Unknown declaration mislabeled assisted, prior exposure mislabeled current help, or revealed simulation feedback called fresh independent work.
- Required actions inaccessible on keyboard/touch/narrow display; essential meaning only in color/audio/motion; renderer failure stops all play.
- Raw implementation/network errors replacing understandable recovery, or successful sequential clears focusing the wrong route.

Rehearsal rewind is not real-world reversibility. Missing acknowledgement means uncertainty, retained identity has a finite window, and authoritative reconciliation is a separately declared capability. Unknown is not absent.

## First-minute test for the current reference

The Missing Delivery candidate must be observed from a fresh start. The critic should verify that the player can answer—without reading hidden docs:

1. Who is Pip?
2. What is the workshop/valley relationship?
3. What has already happened?
4. What did the storm make uncertain?
5. Why might retrying be dangerous?
6. What is the player's goal?
7. What can the player do first?

The planned approximately 15–20 second opening animation is a solution hypothesis, not an automatic pass. It must be skippable/replayable, preserve meaning under reduced motion/static fallback, and transition into play without another exposition wall.

## Minimum evidence

Inspect signed-out behavior, opening/cold start, map/locks, early action/causal feedback, error/recovery, save/reload/process resume, assistance/exposure semantics, sequential progression, unsafe/safe boss behavior, ending/detour, XP-hidden play, keyboard/touch, narrow screens/text enlargement, reduced motion and saved evidence scope. New rendering paths need direct hit-testing, resize/lifecycle/failure tests and realistic device performance before broad promotion.

For each audience lens record compelling and boring/confusing moments, likely abandonment, why to continue and whether replay is earned. These remain reviewer hypotheses without human playtesting.

## Learning and experience remain separate

Read GAME-AS-COURSE.md. Every promised capability needs purposeful practice and defensible evidence, including fresh transfer and later retrieval where claimed. Do not compensate for poor game appeal by scoring engineering integrity highly, or compensate for missing learning by scoring graphics highly.

Future generated courses must inherit this rubric plus the commercial-game onboarding/experience contract. They cannot self-certify from a manifest and remain drafts when bounded repair is exhausted.