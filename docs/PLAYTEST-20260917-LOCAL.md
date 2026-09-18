# Local computer-use review — 17 September 2026

## Friendship/reveal slice — 18 September, subsequent iteration

Implemented an original shared lantern ritual with one player action. Replaced
the two duplicate-looking asset robots with parameterized primitive companions:
round teal and tall coral. The existing golden robot remains the protagonist.
The reusable opening action/timeline drives the ritual; the prison reveal uses
four authored groups. No new learning rules, saved evidence or future levels.

Actual browser play found and repaired two new failures: future mission scenery
floated in the paused early reveal; the released lantern crossed the caption at
360px. Final checks now cover both intermediate reveal visibility and projected
lantern clearance below the caption. Scene replay resets the action and returning
to the game preserved the existing saved `Open` output.

Evidence: `artifacts/prologue-friendship-build.log` (pass),
`prologue-friendship-tests.log` (152 run, seven skipped),
`prologue-friendship-controls.log` (pass),
`prologue-friendship-clearance.log` (final opening pass).
Browser observations: desktop 1280x720 and 390 animated; 360/430 reduced motion;
lantern release/replay, paused reveal/resume, theft and saved-state handoff.

Story review: the relationship is now a shared action and visible gathering,
followed by separation; no claim of proven emotional attachment for real novices.
Art review: the three silhouettes are distinct; focal objects stay in frame and
the lantern stays clear of captions at tested sizes. Gameplay: the single prologue
action, Back/replay/pause/skip and handoff work. Learning: this action carries no
mastery credit; assessment meaning is unchanged. This bounded slice passes its
observable conditions, not the complete candidate's final 9+ critic gate.

Next gate is a fresh tutorial handoff review. Audio listening and physical-device
feel remain unknown. No deployment or user-acceptance claim.

## Continued 18 September: active prologue repair

Continue on `main`, preserving the existing uncommitted entry/staging repairs.
Boundary: six prologue beats end at direct robot control; the separate tutorial
owns the clean first speech-repair success; Level 1 begins only afterward.
This chunk repairs and verifies the prologue, not tutorial or mission expansion.

Desktop replay confirmed the bench is separate and the Warden is in frame.
New observed failures: the chest module disappeared before the theft, then
reappeared; its retreat path jumped between segments. Preserve the module through
limbo/reveal, reset it for replay, and carry it continuously with the Warden.
Verify animation, Back/replay, reduced motion and 360/390/430/desktop framing.
Run the dedicated opening and entry-recovery checks; record findings before any
quality recommendation. Protagonist naming remains provisional.

### Results — 18 September

- Build passed; 152 application tests ran successfully with seven environment
  skips (`artifacts/prologue-build-20260918.log`, `prologue-tests-20260918.log`).
- Dedicated entry tests passed, including engine failure from `/`, explicit
  retry, preserved historical drafts and a simulated hosted sign-in surface.
  No production identity or credential flow was exercised.
- Dedicated opening tests passed after the final camera change
  (`artifacts/prologue-opening-final-20260918.log`): six states, pause/mute,
  replay/save continuity and fresh reduced-motion 360/430/desktop. Screenshots
  and structured report remain in `artifacts/prologue-*.png` and
  `artifacts/first-words-opening-report.json`.
- Actual browser play inspected desktop 1280x720, animated phone 390 and 360,
  reduced-motion 360 and 430, Back from theft, and replay return to the saved
  `Open` tutorial output. No progress reset. The final 360 theft entrance and
  outcome keep both actors in frame. The voice module remains through limbo
  and reveal and is absent from the protagonist after theft.
- Wider phone home framing retains all three robots; the previous left-edge
  crop was reproduced before the repair. Bench/protagonist footprints are
  separate in reveal and theft. Limbo's former rectangular set edge is absent.

### Independent critique / next gate

Story: **needs_revision**. Continuity is repaired, but a wave and a caption do
not yet earn friendship/attachment. The prison reveal is still a cut, not the
specified progressive reveal. Do not certify the prologue from UI traversal.

Art/world: **needs_revision**. Key compositions improved, but the similarly
styled friends and protagonist still need stronger identity and social staging.
The room is clearer; a full playable camera/navigation sweep belongs to the
subsequent tutorial gate and has not been certified by these screenshots.

Gameplay: replay, Back, pause and handoff were exercised. Sustained appeal and
tutorial grammar remain unassessed in this chunk. Learning: no new assessment
claim; rules/evidence were unchanged. Audio: lifecycle tested, subjective mix
and physical devices unverified. No numeric 9+ recommendation and no deployment.

Next bounded work stays in the prologue: a visible friendship interaction and
coordinated prison reveal, followed by the same story/art/browser checks.

Base: `b590e77`, pulled with a fast-forward on canonical `main`. Disposable
SQLite database: `artifacts/playtest-20260917.sqlite`; preview port 8017.
Reviewer already read the story and previous reviews; this is not a novice study.

## Active repair chunk: prologue staging and entry recovery

Observed using the actual browser at 1280 × 720:

- Without vendored assets, entry remains at “Lighting Bellweather” indefinitely:
  static engine imports prevent even the error/retry and local routing code from running.
- Limbo exposes the rectangular edge of its black backdrop.
- The theft camera crops most of the Warden, undermining the central causal event.
- Zip and the repair bench overlap in the prison reveal/theft/handoff composition.

Success: entry recovers explicitly from missing engine; limbo has no visible set
edge; protagonist, antagonist and stolen module share a readable frame; the repair
bench occupies a separate footprint. Replay the opening, Back and reduced motion;
check desktop and 360/390/430 portrait before advancing to tutorial review.

Deployment requires the latest user condition: all critic scores >=9, no blockers,
complete evidence. Historical numeric reviews are not inherited. Audio listening
and physical devices are not yet observed in this review.


## 18 September continued: Phase 1 critic evidence repair

Current candidate lineage after the friendship/reveal and control-practice work:
`8cc05db` -> test-alignment commits -> `95631b0` -> `5a9d6b1` ->
`54f703d` -> `e2fd892` -> `1b2fe12`.

Review of exact-CI screenshots from `95631b0` found two issues that functional
tests alone did not detect:

- the friendship composition was improved by bringing the three characters
  forward so the relationship, not the tower, owns the opening frame;
- the Warden/speech-theft frame now makes antagonist + protagonist + extracted
  speech module legible together;
- the 360 reduced-motion lantern frame missed the caption-clearance budget by
  about 5 px; the lantern endpoint was lowered rather than weakening the gate;
- tutorial MOVE -> LOOK -> MENU now has dedicated phone/desktop screenshot
  evidence instead of only a post-practice handoff screenshot;
- Level 1 tutorial success and final payoff text said a route/gate was open, but
  the shared gate asset's oversized torus still visually read as a closed giant
  circular door. This is a visible-causality/art-direction blocker, not merely a
  test wording issue.

The shared `gate()` kit was therefore changed from the oversized torus arch to
a conventional lintel/frame, leaving the moving bars as the actual blocker.
A regression test now guards that reusable open-portal shape. The controls gate
also preserves screenshots after orbit and zoom before recentering so art/world
review can inspect non-authored camera views.

Current exact candidate: `1b2fe12e0c0786b0fa0f51d6a4f3291fb16d4ddc`.
Its CI/artifact review is still pending. Do not assign 9+ scores, deploy, or
inherit the prior review until opening, tutorial, alternate-camera, Level 1
recovery/payoff and technical gates all pass on this exact SHA.


## 18 September final internal Phase 1 review — ad14c5a

Reviewed runtime candidate:
`ad14c5aced6cf053c7617dfb03245506e1e9dad5`. Exact GitHub Actions run:
`35335042617`. All seven active suites passed.

The review loop intentionally treated passing browser tests as evidence, not
product quality. Screenshot inspection found and repaired additional failures
before this checkpoint:

- friendship framing initially made the tower more important than the friends;
- speech theft depended too heavily on caption text;
- the shared gate torus looked like a solid circular wall after its bars opened;
- a solid prison wall still existed behind that nominally open gate;
- the rupture first read as a glowing sphere rather than a sky tear;
- after the next rupture pass, the friends visibly remained in Bellweather even
  though the story said everyone disappeared;
- player UI leaked development-status language in the menu, ending and login;
- the backend mission package still used helper-avatar wording after the game
  switched to direct protagonist control;
- control tests exercised alternate camera views but originally threw away those
  views before preserving review evidence.

The final exact candidate now preserves evidence for:
- Bellweather desktop entry and phone entry;
- player-driven shared lantern ritual;
- completed rupture with an empty Bellweather square;
- reduced-motion rupture at 360, 430 and 1280;
- limbo, progressive reveal, Warden theft and repair handoff;
- MOVE/LOOK/MENU control practice;
- post-save keyboard/touch/orbit/zoom/recenter;
- tutorial success with a real open Moon passage and deeper closed Star gate;
- stale-context wrong route and recovery;
- final open deeper route at 360, 390, 430 and 1280;
- fail-closed 3D runtime with no active 2D fallback.

Learning counterexamples include current Star context with a deliberately wrong
Moon human prediction. The authoritative engine still emits `Open the Star gate`,
demonstrating that the prediction is recorded learner evidence rather than hidden
model input. Unrelated/hinted cases do not overclaim transfer and mastery stays
unknown.

Current internal manual scores on the exact runtime:
story 9/10; art/world 9/10; gameplay/progression 9/10; learning/transfer
9/10; technical/accessibility passed. See
`LEVEL1-FINAL-CRITIC-20260918-ad14c5a.md`.

**Remaining limitation:** subjective music/SFX listening has not been performed
in this environment. Automated audio lifecycle, phase, pause/mute and muted
semantic-equivalence checks pass, but current policy does not equate those with a
9+ atmosphere/audio judgment. Physical-phone feel is also not established by
browser emulation. Therefore overall internal status remains review incomplete,
and there is no user-acceptance claim or Level 2 authorization.
