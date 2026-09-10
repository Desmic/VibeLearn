# Game acceptance contract — story 9/10 + game 9/10 + learning gate

Updated by the user's 10 September 2026 instruction; read [STORY-GENERATION-AND-CRITIC.md](STORY-GENERATION-AND-CRITIC.md), [GAME-AS-COURSE.md](GAME-AS-COURSE.md), [GAME-UX-REVIEW.md](GAME-UX-REVIEW.md), and [STATE.md](STATE.md).

## Current status

The current Relay Rescue candidate is **`user_rejected` / `needs_revision`**. The user's newest first-touch/story rating is **3/10**. The prior internal-tool-assisted `9.196` game critic / `9.35` bounded learning result is historical only and cannot keep the candidate in `ready_for_user_review` after explicit user rejection.

## Acceptance pipeline

Acceptance now requires separate gates in this order:

`story/fantasy candidate -> story critic >=9 -> gameplay realization -> game critic >=9 -> learning/transfer >=9 where claimed -> ready_for_user_review -> explicit user acceptance -> user_accepted`

The current user's explicit verdict can reject a candidate at any point and overrides every critic or automated result. Do not average user and critic scores.

## Story gate

For every course/subject, generate a strong story/fantasy/world premise before gameplay realization. Evaluate **one frozen story candidate at a time** with the story-only rubric in STORY-GENERATION-AND-CRITIC.md.

Story pass requires unrounded **>=9.0/10**, no story blocker. The story critic evaluates hook, clarity/causality, character attachment, world appeal, storytelling quality, pacing/progression, stakes, payoff/forward pull, and cross-age engagement.

It must not award story points for learning value, code quality, tests, graphics technology, Three.js, asset count, or implementation effort.

A story critic pass does not mean the game passes. It only allows the story to proceed to gameplay realization.

## First-touch acceptance requirements

The first-run story/cinematic must give the player control over time and navigation:

- Back/previous beat is mandatory.
- User-paced next/continue is the default.
- Pause/resume is available while animation is active; skip and replay are available; progress/chapter position is visible.
- Optional autoplay must be slow enough for beats to land and pause on player interaction.
- Back/forward reconstructs coherent story state.
- Reduced motion preserves causal meaning and navigation.

A rushed slideshow, missing back navigation, or a clear-but-unengaging exposition sequence fails regardless of animation polish.

## Game critic gate

After the story passes, review the exact rendered game as something a curious kid/younger non-specialist and a teen/young adult would voluntarily play. Use actual rendered evidence and the frozen game rubric. Available-tool/internal criticism may be used during current supervised refinement if honestly labeled `internal_tool_assisted`; it is not an independent agent or human playtest.

The unrounded game weighted score must be **>=9.0/10**, both audience lenses passing, and no critical blocker may remain. A green test suite, appealing screenshot, or renderer choice never constitutes this score.

The game critic must explicitly verify that the approved story survived realization and that the first action, failure/recovery, progression, world changes, boss/transfer, ending, and replay feel like one coherent game rather than a lesson site.

## Learning/real-world-transfer gate

The intended game should deliver the useful outcomes of its declared course. Require explicit outcome-to-mechanic-to-assessment coverage, varied practice, fresh transfer, and delayed retrieval where claimed. No course-equivalence claim from story completion, participation, or XP.

The learning gate is separate from story and game appeal. A strong story/game with shallow learning fails the product promise; rigorous learning with weak story/game appeal also fails.

## Three.js / rendering direction

Three.js 3D must be **seriously considered** as a realization option for this audience because it can improve attention, immersion, character presence, environmental storytelling, exploration, and direct interaction even when the learning concept itself is not inherently spatial.

For important candidates, compare authored 2D, 2.5D, and interactive Three.js 3D. Choose the medium that best supports the story/audience/device budget. Do not award acceptance for 3D itself; weak writing in 3D still fails.

If 3D is used, preserve pinned local assets, same-origin runtime, keyboard/touch equivalence, reduced-motion behavior, usable fallback, and realistic mobile performance validation.

## Review record

Every gate record includes exact story/build version, reviewer method, raw scores, evidence, blockers, limitations, likely abandonment points, changes since prior candidate, and status. Never reuse a historical score for a changed story/build.

Allowed statuses include `story_needs_revision`, `needs_revision`, `review_pending`, `ready_for_user_review`, `user_rejected`, and `user_accepted`.

## Scope and rollout

This remains private Phase 1 refinement. The story-generation/gating contract also defines future course-generation behavior, but does not authorize Phase 2/3 implementation, external testers, paid resources, public rollout, untrusted execution, or new model integration. External users remain blocked until explicit user acceptance and later authorization.
