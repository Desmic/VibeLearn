# Current state — The First Words Level 1

## Active checkpoint — 17 September 2026 IST

Status: **user review in progress / needs revision.**

Verified game candidate under review: `6fea8287aa5f078a5836902478320699e54571a9`.
Exact GitHub Actions run: `35138788244` (`Verify hosted pilot`, run 804).
Private Render review deployment: commit `6de1f0ccb234507c1db2dccbe007c7cabfaf397e`, deploy `dep-daleugf40ujc73dphuo0`, service `srv-daf7dhuq1p3s73c122cg`.

The internal gate previously returned `ready_for_user_review`, but the user's live review has exposed blockers. The user's product judgment overrides the internal recommendation. See `USER-REVIEW-20260917.md` for the running review log.

## Current user-review blockers

1. **Opening character duplication/ambiguity:** two Zip-like robots are visible. One extra character near the middle visibly clips through the central table. Character identity and scene geometry are not acceptable.
2. **Story establishment is insufficient:** the opening begins with a mood/friendship line but does not adequately establish Bellweather, the player/Zip relationship, the situation, the Warden, and the immediate stakes for a cold-start player.
3. **Tutorial structure is wrong:** the current build labels steps inside Level 1 as `TUTORIAL · 1/3`. The user expected a distinct Tutorial/Prologue before Level 1, so reusable controls and the core interaction/learning loop are learned before the first actual mission.

These are not minor polish issues. Level 1 remains `needs_revision` until repaired and reviewed again.

## Binding design direction

The governing rule remains **easy to play, hard to master**.

The revised progression boundary should be:

`tutorial/prologue -> Level 1 mission -> later episodes with progressively less scaffolding and deeper LLM-internals reasoning`

The Tutorial/Prologue should teach only reusable play semantics—movement/look/interact/menu plus the core learning interaction—with low/no failure pressure and a clean success. Level 1 should then feel like the first actual story mission rather than the tutorial itself.

Opening/story repairs should use staged world events, concise dialogue/captions, character motion and interaction rather than long explanation panels.

## What the prior technical/internal gate did establish

On game candidate `6fea828...`, all active technical gates passed:

- foundation / entry / no 2D fallback;
- full application suite — **152 tests passed**;
- opening browser lifecycle/reduced-motion checks;
- controls after persisted action + reload;
- 200% text/readability at 360/390/430;
- hosted reset/logout lifecycle;
- whole chapter mistake/recovery/completion path.

Those checks remain useful regression evidence, but they did **not** prove product quality. The user review has specifically shown that the internal critic missed duplicate character identity, visible prop intersection under alternate camera views, insufficient cold-start story comprehension, and the tutorial-vs-Level-1 progression mismatch.

## Live review deployment

The current review build remains live at:

`https://vibelearn-4xws.onrender.com/`

Do not treat the deployed build as accepted. Auto-deploy remains off.

## Next action

Continue the user's Level 1 review and append each finding to `docs/USER-REVIEW-20260917.md` without arguing it away or averaging it against internal scores.

After the user finishes the review:

1. consolidate the findings;
2. update the opening/tutorial/progression design docs and critic counterexamples where needed;
3. repair Level 1/prologue in coherent chunks;
4. retest the affected and integrated flows;
5. deploy a new bounded review candidate;
6. return to the user for another final review.

**Do not start Level 2.**
