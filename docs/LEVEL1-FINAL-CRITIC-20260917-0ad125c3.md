# Level 1 final internal critic — candidate `0ad125c3e0b7e10cc09c862c668985d06a7c41f2`

This is an internal, exact-candidate review record for **How LLMs Work — Level 1 / The First Words**. It does not record or imply user acceptance. The user remains the sole final product critic.

## Exact candidate and CI

- Candidate: `0ad125c3e0b7e10cc09c862c668985d06a7c41f2`
- GitHub Actions run: `35231725193` (`Verify hosted pilot`, run 835)
- All six exact-head jobs passed:
  - `foundation`
  - `first-words-opening`
  - `first-words-controls`
  - `first-words-chapter`
  - `first-words-readability`
  - `first-words-lifecycle`
- Foundation ran 152 unit/integration tests successfully, validated the active WorldSpec during build, and passed the no-fallback entry browser gate.

Exact-run evidence artifacts:

- source archive: `review-source-0ad125c3e0b7e10cc09c862c668985d06a7c41f2` / artifact `10502216702`
- opening: artifact `10502251315`
- foundation: artifact `10501657179`
- readability: artifact `10501487284`
- controls: artifact `10501302632`
- lifecycle: artifact `10501192604`
- full chapter: artifact `10502265734`

## Evidence inspected

### Entry / login / active runtime

`login-bellweather-phone-390.png` and `login-bellweather-desktop.png` show the login as part of the Bellweather 3D scene, with Zip/friends visible in the world and the `Enter Bellweather` / `Enter the story →` entry card layered into the game presentation. The foundation browser gate also proves the active route is PlayCanvas and that the old fallback assets are not active.

### Opening / prologue

The opening artifact passed with no page errors and contains:

- `prologue-home-390.png`
- `prologue-rupture-paused-390.png`
- `prologue-limbo-390.png`
- `prologue-prison-reveal-390.png`
- `prologue-speech-theft-390.png`
- `prologue-repair-handoff-390.png`
- reduced-motion 360/430/desktop captures
- `first-words-opening-report.json`

The sequence establishes Bellweather before rupture, isolates Zip, reveals the prison and sealed exit, visibly takes Zip's speech, then hands the player into repair/tutorial play. The first real Continue gesture unlocks `bellweather-score-v2`; the test verifies scheduled bars and phase transitions only after that gesture. Pausing immediately freezes progression controls. Subjective sound-mix quality is not claimed here.

### Tutorial / first success

`tutorial-first-success-390.png` shows the tutorial as a distinct completed state with `TUTORIAL · COMPLETE`, the first door open, speech restored, the generated Moon-gate command visible, movement/camera controls visible, and a single dominant `Begin Level 1 →` progression action.

### Mistake / recovery / transfer

`level1-transfer-wrong-390.png` records the deliberate stale-context counterexample. Reusing the tutorial's Moon answer does **not** pass: the world presents `LEVEL 1 · RECOVER` / `Wrong route`, preserves the stale command, and asks the player to inspect the current route signs and try again. The chapter report confirms the first choice is preserved and recovery occurs through the current clue rather than by silently rewriting history.

This is the key fresh-transfer test: the tutorial teaches the generation loop with Moon, while Level 1 changes the context and requires the player to use a new five-point route clue to produce the Star route.

### World payoff / ending

`level1-ending-world-390.png` and `level1-complete-360-reduced.png` show the completion payoff remaining in the same 3D prison world. The HUD reads `LEVEL 1 · COMPLETE`, the deeper gate is open, the generated command is now `Open the Star gate`, and the next-world affordance is `Look deeper into the prison` rather than a detached results page. Replay remains available without confusing completion with mastery.

### Controls / save-resume

The exact controls job passed after a persisted tutorial action and reload. The test waits for the playable third-person state, deliberately leaves the non-text `Scan the Moon lock` game button focused, then proves WASD still moves Zip. It also verifies accessible button movement, Chromium touch-stick movement, touch drag-to-look, zoom and recenter. Text-entry targets remain protected from game movement keys.

### Responsive / accessibility coverage

Exact-run evidence covers desktop and 360/390/430 portrait CSS widths, touch and keyboard, 200% text, and reduced motion. The 360 reduced-motion completion remains a game view: 3D Zip/world, movement control, camera controls, goal, generated tokens, and both completion actions remain available. The readability job passed the enlarged-text contract rather than merely producing screenshots.

### Lifecycle / security continuity

The hosted lifecycle artifact shows reset returning to the Bellweather opening and logout returning to the integrated Bellweather login. The restored `tests/test_hosted.py` retained its security/session coverage; the surgical CTA update uses the stable `#login-submit` id rather than deleting unrelated checks. The exact foundation run also passed the hosted auth/session, isolation, replayed-cookie, origin/host and persistence tests.

## Adversarial critic results

1. **world_role_stakes — 9/10.** Counterexample: ignore prior product knowledge and inspect the opening only. Bellweather, Zip, rupture, prison, lost speech and escape/repair goal remain legible from the staged world plus concise captions.
2. **visible_causality — 9/10.** Counterexample: inspect reduced-motion variants and the deliberate wrong route. Causality remains legible without relying on fast animation; wrong context creates a wrong route and corrected context opens the deeper gate.
3. **attachment_pull — 9/10.** Counterexample: skim explanatory text. The opening still begins with Zip among friends/home before rupture, so the subsequent isolation and speech loss have a concrete before/after emotional anchor rather than starting as an abstract puzzle.
4. **orientation_action — 9/10.** Counterexample: look for competing required actions on fresh entry/tutorial. Story Continue/Skip gives way to one tutorial task at a time; optional camera/movement affordances do not replace the highlighted task action.
5. **hud_readability — 9/10.** Counterexample: inspect 200% text and 360px completion. The HUD becomes denser but remains bounded/playable, with a meaningful 3D world band and primary action visible.
6. **controls — 9/10.** Counterexample: reproduce the original retained-button-focus bug after save/reload. WASD moves Zip while a non-text game button remains focused; touch movement/look and camera tools also pass.
7. **meaningful_agency — 9/10.** Counterexample: deliberately choose stale Moon context. The choice changes the generated command/world result and creates a recoverable failure; it is not cosmetically accepted.
8. **progression_recovery — 9/10.** Counterexample: fail the first unguided changed-context challenge. The player recovers in-place from preserved evidence using the learned loop and current clue rather than restarting the chapter.
9. **world_continuity — 9/10.** Counterexample: look for a quiz/results-page break between opening, tutorial, failure and completion. The same PlayCanvas Bellweather/prison runtime persists and the ending remains a world state with a deeper gate.
10. **concept_fidelity — 9/10.** Counterexample: reuse a previously valid answer after context changes. Moon becomes wrong and Star becomes correct, demonstrating context-conditioned generation causally rather than asserting it in prose.
11. **fresh_transfer — 9/10.** Counterexample: reuse the tutorial solution verbatim. It fails visibly; the later challenge requires mapping a new environmental clue/current context to a different generated route.

No blocker was found in the exact-candidate automated and rendered evidence.

## Limits

- Automated Chromium emulation is not a blind novice/young-player study and is not a physical-phone test.
- The environment verifies WebAudio lifecycle, scheduling, mute/pause and phase changes, but cannot literally judge the music/effects mix or subjective audio appeal.
- Immediate transfer is observed; delayed retention/mastery is not claimed.
- The internal critic knew the product/source context. Counterexamples therefore target concrete abandonment and correctness risks rather than claiming a blind first-time study.
- This record can only mark the candidate internally ready for the user's final review. It cannot accept the game for the user.
