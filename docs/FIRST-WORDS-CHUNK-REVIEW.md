# The First Words — Level 1 chunk review

**Checkpoint date:** 17 September 2026 IST  
**Behavioral candidate:** `6fea8287aa5f078a5836902478320699e54571a9`  
**Exact CI run:** `35138788244`

This review records observed/automated Level 1 behavior after the user's reminder that lifecycle controls regressed and that the preview was too convoluted. It does **not** establish user acceptance, novice engagement, subjective sound quality or learning mastery.

## 1. Opening -> tutorial handoff

The active opening is a continuous Bellweather PlayCanvas scene:

1. friendship: Zip and the player share a lantern; a world-anchored `ZIP` marker identifies the companion and the player performs a simple hand-tap interaction;
2. threat: the Warden arrives, is identified in-world as `WARDEN`, and visibly takes speech engines;
3. consequence: Zip pushes the player clear, is left behind the gate without a voice, is explicitly labelled `ZIP`, and the primary continuation is `Help Zip ->`.

The exact-head opening browser gate passed fresh entry, identity-marker visibility, pause/resume, sound toggle, skip, replay preserving an active draft, returning-learner resume, and 360/430/desktop reduced-motion paths.

Fresh screenshots were inspected, not only DOM assertions. The identity labels sit on the characters rather than adding another explanation panel. The three beats communicate friend -> Warden/voice theft -> trapped Zip/next action.

## 2. Tutorial and first success

The old preview front-loaded a plausible failure. That has been removed for new Level 1 runs.

Current tutorial:

`Connect the power lead -> Scan Zip's Moon plaque -> Make first word -> Next word x3 -> Speak to gate`

The Moon clue is required before round-0 generation, so the first completed sentence opens the correct Moon gate. The resulting world state frees Zip before the player encounters normal failure.

The browser gate explicitly verifies:

- `TUTORIAL · 1/3`, `2/3`, `3/3` progression;
- one obvious primary action at each step;
- the optional speech-engine inspector is hidden during the tutorial;
- the first rescue produces `Zip is free.` / `Nice. Zip can speak again.`;
- the first success is visible in the world before moving to the tower challenge.

This is intentionally assisted practice. Completion of the tutorial is not mastery evidence.

## 3. Changed-context tower challenge

After the first win, scaffolding fades enough to introduce a recoverable mistake.

The guaranteed Level 1 path is `Check route signs`. It presents the three in-world contexts:

- an old Moon route;
- an unrelated parade notice;
- today's notice saying the Moon route is closed and the tower bell answers the five-point lantern mark.

Physical route boards remain tangible/tappable world objects, but camera hunting is **not required** to demonstrate the Level 1 concept. Movement and camera controls are available and separately tested.

The changed task requires one destination prediction before generation. The former second required `Predict the next input` quiz is removed from new runs. The growing-input behavior is shown directly as each generated word joins the next input; legacy saved drafts that already contain the old step remain resumable.

The exact-head chapter gate exercised this mistake/recovery path at 390 x 844:

1. choose the stale Moon sign;
2. predict Moon;
3. generate `Open the Moon gate` and receive the wrong-route state;
4. recover through the same simple `Check route signs` control;
5. choose today's five-point clue;
6. regenerate and open the Star route;
7. finish Level 1 and reload the completed state.

The first wrong context remains preserved in the assessment/reflection; recovery does not rewrite history.

Fresh 360px and 430px reduced-motion learners also completed the tutorial and correct tower path without requiring camera or movement skill. The chapter report contains no page errors.

## 4. Completion/payoff

Completion remains in the 3D world. The Star gate is open, Zip is present near the route, and the bottom engine shows `Open the Star gate`. No ending dialog automatically covers the world payoff.

The optional `Look toward the printing loft` action can open the short ending/reflection. `Play Level 1 again` remains available. Reload preserves the completed state and distinguishes `Level saved · practice recorded` from ordinary draft `Saved` status.

The completed chapter remains guided practice. Assessment reports bounded first-response transfer observations and leaves mastery `unknown`.

## 5. Lifecycle regressions — repaired and protected

The user reported that logout and game reset disappeared from the preview even though backend routes still existed. They are restored as first-class in-game menu controls.

Dedicated hosted-browser verification exercises the real UI and session boundary:

- sign in through the Bellweather auth surface;
- start Level 1 and persist progress;
- open the game menu and choose `Reset game progress`;
- confirm the destructive reset;
- verify the saved attempt is gone and the Level 1 opening starts again;
- skip into Level 1 again;
- choose `Sign out`;
- verify the browser returns to auth and authenticated state access becomes unauthorized.

This lifecycle gate passed on the exact behavioral candidate. API existence alone is no longer considered sufficient evidence.

## 6. Controls and phone/readability checks

The active controls gate passed keyboard movement, accessible directional controls, Chromium touch movement, touch camera drag, zoom and recenter **after a saved action and reload**.

The 200% text probe passed at 360/390/430 widths. The objective card and engine console remain bounded/scrollable while preserving a meaningful visible 3D band and no horizontal page overflow. This is accessibility evidence, not a claim that 200% text is aesthetically ideal.

Default play is intentionally simpler than the earlier preview: the immediate goal, one primary contextual action and the world remain dominant; optional technical inspection arrives after the first success.

## 7. Integrated technical gate

GitHub Actions run `35138788244` passed all active Level 1 jobs on `6fea8287aa5f078a5836902478320699e54571a9`:

- foundation / entry / no 2D fallback — **passed**;
- full application suite — **152 tests passed**;
- opening, including explicit Zip/Warden identity markers — **passed**;
- controls after save/reload — **passed**;
- readability / 200% text — **passed**;
- hosted lifecycle reset/logout — **passed**;
- whole chapter — **passed**.

The chapter gate completes the 390px mistake/recovery path and two additional fresh reduced-motion phone runs; it finished successfully rather than being shortened to make CI faster.

## 8. Internal qualitative gate

The exact rendered artifacts were then reviewed under `CRITIC-POLICY.md`. Concrete previous abandonment risks were checked before ratings, and each 9+ criterion records a counterexample attempt.

Review record: `docs/reviews/2026-09-17-level1-6fea828.json`  
Detailed review: `docs/LEVEL1-FINAL-CRITIC-20260917.md`

The repository checker returns `ready_for_user_review` with gate minimums:

- rendered story — **9**;
- first touch — **9**;
- whole chapter — **9**;
- learning — **9**.

All required coverage is observed and no internally identified blocker remains. This does not establish user acceptance.

## 9. Live review deployment

The private Render review service now runs commit `6de1f0ccb234507c1db2dccbe007c7cabfaf397e`, deploy `dep-daleugf40ujc73dphuo0`, at:

`https://vibelearn-4xws.onrender.com/`

That commit contains the exact verified `6fea828...` game runtime plus review/documentation commits only. Render reports the deployment as live, health/startup requests returned HTTP 200, and no error/critical logs were present after deployment when checked.

Auto-deploy remains off.

## Remaining limitations for the user's final review

Still intentionally left to human judgment:

- actual listening judgment of the Bellweather music/effects mix;
- physical-phone behavior/performance and ergonomics;
- novice/young-player comprehension/engagement;
- delayed retention or independent mastery;
- the current user's product taste and acceptance.

The internal environment verified audio lifecycle/scheduling/phase/mute behavior but cannot literally listen to the mix. Chromium touch/viewport emulation is not a physical-device study.

## Next action

**Hand Level 1 to the current user for final review and feedback.**

Do not start Level 2 yet. Any user-reported Level 1 blocker should be repaired and retested before progression work resumes.
