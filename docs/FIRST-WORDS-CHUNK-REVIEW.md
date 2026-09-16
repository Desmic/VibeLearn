# The First Words — Level 1 chunk review

**Checkpoint date:** 17 September 2026 IST  
**Behavioral candidate:** `64c4334b8a4ab3937031704140086560a9d27b04`  
**Branch:** `game/level1-quality-gate`  
**CI run:** `35137170056`

This review records observed/automated Level 1 behavior after the user's reminder that lifecycle controls regressed and that the preview was too convoluted. It does **not** establish user acceptance, novice engagement, subjective sound quality or learning mastery.

## 1. Opening -> tutorial handoff

The active opening is a continuous Bellweather PlayCanvas scene:

1. friendship: Zip and the player share a lantern and the player performs a simple hand-tap interaction;
2. threat: the Warden arrives and visibly takes speech engines;
3. consequence: Zip pushes the player clear, is left behind the gate without a voice, and the primary continuation is `Help Zip ->`.

The exact-head opening browser gate passed fresh entry, pause/resume, sound toggle, skip, replay preserving an active draft, returning-learner resume, and 360/430/desktop reduced-motion paths.

Fresh screenshots were inspected, not only DOM assertions. The three beats now communicate friend -> Warden/voice theft -> trapped Zip/next action without adding another explanation screen. This is technically and visually clearer than the prior preview, but emotional pull and sound mix still require human judgment.

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

Dedicated hosted-browser verification now exercises the real UI and session boundary:

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

GitHub Actions run `35137170056` passed all active Level 1 jobs on `64c4334b8a4ab3937031704140086560a9d27b04`:

- foundation / entry / no 2D fallback — **passed**;
- full application suite — **152 tests passed**;
- opening — **passed**;
- controls after save/reload — **passed**;
- readability / 200% text — **passed**;
- hosted lifecycle reset/logout — **passed**;
- whole chapter — **passed**.

The chapter gate took longer because it completes the 390px mistake/recovery path and two additional fresh reduced-motion phone runs; it finished successfully rather than being shortened to make CI faster.

## 8. Deployment and review boundary

The verified development candidate is **not live**.

The current private Render preview remains commit `987e4773a231a9172634d8aa58e47f0b0996cb75`, deploy `dep-dalcfum5vjqs73et1ir0`. It predates the lifecycle/tutorial simplification above. Auto-deploy remains off.

Do not infer that the live preview contains these repairs, and do not deploy the newer candidate solely because automated gates are green.

## Remaining limitations / next action

Still unverified:

- actual listening judgment of the Bellweather music/effects mix;
- physical phone behavior/performance;
- novice or young-player comprehension/engagement;
- delayed retention or independent mastery;
- the current user's acceptance of this newer build.

Next action is the qualitative whole-Level-1 review under `CRITIC-POLICY.md`, with failures/likely abandonment points written before ratings. Repair only concrete Level 1 findings, then present the bounded candidate to the user. **Do not start Level 2 yet.**
