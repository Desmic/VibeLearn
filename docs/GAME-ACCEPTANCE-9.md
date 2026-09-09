# Game acceptance contract — 9/10 pre-gate, commercial-game quality, user final authority

Updated by the user's 9 September 2026 instruction; read [COMMERCIAL-GAME-BAR.md](COMMERCIAL-GAME-BAR.md) and [GAME-AS-COURSE.md](GAME-AS-COURSE.md).

## Scope and product authority

Review VibeLearn as a **real game** that a younger non-specialist or older teen/young adult might voluntarily play, not as a course website, dashboard or engineering demonstration with game decoration.

The user is currently the only real product user/reviewer. **Their explicit judgment overrides every critic, agent, automated score and historical review for acceptance.** A critic pass is only a pre-gate. Do not average the user's score with critic scores or use an automated/agent score to overrule a rejection.

Allowed progression is:

`needs_revision -> critic >=9/no blocker -> ready_for_user_review -> explicit user acceptance -> user_accepted`

Explicit user rejection returns the candidate to `user_rejected` / `needs_revision` regardless of critic score. Silence is not approval.

Do not open the experience to other users before the current user explicitly accepts it and later authorizes broader testing.

## Current review method

Use actual rendered evidence, a deliberately distinct critic pass and the unchanged rubric. If a genuinely separate critic agent/model is unavailable, label the method `internal_tool_assisted` and disclose limits. Do not call the builder an independent agent or human playtest. This does not weaken the score or user-acceptance requirement.

## Pass requirements

The unrounded weighted critic score must be **>=9.0/10**; rounding 8.95 to 9 does not pass. Both audience-lens verdicts must pass, and no critical blocker may remain in engagement, comprehension, progression, learning integrity, accessibility, persistence or learner isolation.

Even then, the candidate is only `ready_for_user_review`. **Only explicit user acceptance may mark the experience accepted.**

A green test suite, appealing screenshot, animation, campaign map or rendering library never constitutes a pass. A source-only assessment cannot certify gameplay. Preserve failed journeys and unresolved findings. Do not tune the rubric to the target, reuse historical scores or award points for implementation effort.

The user's current explicit verdict is **5/10 game experience and 5/10 learning experience**. That supersedes the historical internal 7.02/10 and all older 8.8/9.1/other reviews for product acceptance.

## Commercial-game quality bar

The complete learner-facing experience must feel like **a game someone could credibly expect from the Play Store or Steam**, not a gamified website. This does not require AAA production values, combat, free-roaming 3D or one genre. It does require game-quality onboarding, primary playfield hierarchy, responsive input, visible consequences, coherent progression, feedback/game feel, recoverable failure, earned resolution, replay variation and game-like menus/save/pause/settings.

A candidate fails if its dominant experience is still a card stack, form workflow, dashboard, read-and-answer page or course site with game terms layered on top.

## First-minute comprehension blocker

A player must quickly understand the world/context, player role, inciting change/problem, stakes/success condition and first actionable goal before specialist jargon where faithful.

For the current Missing Delivery reference, this specifically requires a short approximately **15–20 second skippable/replayable opening story sequence** that establishes Pip, the valley/workshop, the already-sent bridge-gear order, the storm-lost reply, duplicate-delivery risk and the player's role in discovering what happened/restoring signals. Skip/reduced-motion must preserve essential meaning. The intro should lead directly into meaningful play, not another exposition wall.

Future generated courses inherit the comprehension requirement, not the exact Pip/storm theme or timing.

## What the critic must observe

The complete playable candidate must include an understandable hook, a first meaningful action, curiosity/discovery, a consequential decision, a mistake and recovery, rising challenge, a combine/boss encounter, an earned ending and a working replay variation. Hide XP/rank during a pass through the core loop. The reason to continue must survive.

Early play should change the world or reveal useful information, not just advance slides or select quiz answers. Separate sign-in/hosting delays from authored onboarding.

For each audience lens record reading/knowledge assumptions, compelling moments, boring/confusing moments, likely first quit point, concrete reason to continue and whether another run is earned. No youth-enjoyment claim without authorized human evidence.

Keyboard, touch, narrow layouts, enlarged text, sound-off and reduced-motion equivalents are required. Do not move precise targets while selected. Renderer failure must not erase progress or block the learning operation.

## Frozen weights

Game identity 15%; HUD/information at a glance 15%; core loop 15%; progression/difficulty 15%; feedback/game feel 12%; theme/cohesion 10%; learning integrity 10%; accessibility/responsiveness 8%.

Record each raw /10 score and compute `sum(score * weight) / 100`. Evidence quality and uncertainty must remain explicit even when a number is supplied. The detailed rubric and blockers are in [GAME-UX-REVIEW.md](GAME-UX-REVIEW.md).

## Course learning remains separate

The intended game should deliver the useful outcomes of its declared course. Require an explicit outcome-to-mechanic-to-assessment ledger, varied practice, fresh transfer and delayed retrieval where those claims are made. No learning-equivalence claim from story completion or participation XP. A beautiful but shallow game fails; a rigorous but tedious lesson also fails.

## Future generation

Generated courses inherit the commercial-game bar, onboarding/comprehension contract, youth-engagement and course-outcome requirements, with structural/learning, grounding/content, accessibility and game-review gates. A manifest cannot self-certify its rendered experience. Failed bounded repairs remain `draft_needs_review`. Never lower the 9/10 threshold or bypass explicit user acceptance to make a generated candidate pass.