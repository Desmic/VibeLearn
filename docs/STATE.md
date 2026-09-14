# Current state — third-person camera and full-screen mobile revision

Updated 14 September 2026. **User review: changes requested / needs_revision.** The user reviewed `eab1614` and asked for free camera movement, third-person view for most games, an appealing consistent login, removal of any 2D gameplay fallback, hands-on computer/browser verification, and full-screen mobile play. No numeric user score or product acceptance was supplied.

## Current source and verified deployment

Development: `phase1/world-transfer`, draft PR #8, repository Desmic/VibeLearn. Baseline `eab1614d2033ee9c65d05742ca0961bdb25b874e` passed Actions run `34790907513`: all 130 tests and the complete browser journey. Exact desktop/390px opening, first-success and Signal 7 screenshots were inspected. This is technical history, not acceptance of the newly requested controls.

Render service `vibelearn` (`srv-daf7dhuq1p3s73c122cg`, workspace `tea-daf75lad0e5s73b4cgvg`) serves `deploy/render-supabase`, auto-deploy OFF. Deployment `dep-dajjomgae00c73a8cvsg` was verified live on that exact baseline at 2026-09-14 00:15 UTC. Public URL: https://vibelearn-4xws.onrender.com/. No newer source/deployment is claimed by this documentation checkpoint.

The hosted build command is `pip install -r requirements.lock && python manage.py vendor`. Vendor prepares pinned engine/models and the downloadable repair ZIP. Keep that packaging correction and the Signal 6→7 15-second assertion stabilization.

## Next implementation and verification

Read GAME-CAMERA-INPUT.md and GAME-OPENING-PROGRESSION.md. Documentation is updated first. Add shared spec-driven third-person avatar/navigation/camera controls, a consistent 3D login and a full-viewport mobile game shell with safe-area controls and optional browser fullscreen. Preserve story-first introduction, skip, gradual tutorial progression, later-level resume and isolated replay.

Use actual browser/computer interaction to verify login, camera/movement and mobile play; inspect screenshots and retain all unit/PostgreSQL/static/full-browser gates. No 2D gameplay fallback may become playable on engine failure. No new deployment is authorized until the exact candidate is green and visually reviewable.

## Implementation checkpoint

The docs-first amendment is commit `9b9d520d80d5f6ce984e1d957586c335cd035507`. The following code increment adds a shared validated player profile, navigation/orbit controller, primitive Signal Keeper archetype, projected accessible markers, same-attempt transfer view restoration, a dynamic full-viewport HUD with a user-initiated fullscreen icon, and the same PlayCanvas valley at account entry. Long records live under Menu → Journal & repair kit. Rendering children of an initially hidden archetype now preserves their authored local visibility. No game/evidence commands originate in movement or camera code.

Local automated browser checks and screenshot inspection are in progress; the first pass exposed and repaired an invisible avatar, clipped objective and legacy login palette. The 130-test local suite passed with six PostgreSQL checks skipped because a local PostgreSQL service is unavailable; full PostgreSQL verification remains required in CI. The cloud computer-use browser cannot access the workspace local server (`ERR_BLOCKED_BY_CLIENT`); no bypass is attempted. Hands-on verification therefore remains required on the verified Render candidate, separately from automated local/CI browser evidence. Production still serves the prior verified baseline.

## Continuation verification — 14 September 2026

Remote head `3937a289f3b7aa1d3fff0cd872d479ff2d7be826` contains the camera/mobile implementation and follow-up entry/landscape corrections. Actions run `34827438167` passed build and all unit/PostgreSQL tests, then failed the player-control browser gate at desktop cold startup: the default five-second readiness assertion expired before the opening appeared. Its failure screenshot shows the rendered opening, and the 390/360/430px control journeys had already completed. Keep all behavior assertions and use the existing fifteen-second transition allowance for this cold-start readiness check. This is a functional test allowance, not a measured phone performance claim.

The local runtime uses Node 24, which removed `--experimental-default-type`. Parse each browser file through `--input-type=module --check` on stdin so syntax verification works with both CI's Node 22 and Node 24. Full candidate verification and deployment are pending; production remains on `eab1614` until those checks pass.

The cloud browser rejects workspace localhost with `ERR_BLOCKED_BY_CLIENT`. Repository browser tests and their screenshots remain available; hands-on cloud-browser review is limited to the hosted candidate. No network-policy workaround is attempted.

Rendered opening review found a concrete collision between the lost-reply action marker and the new camera-help button on phone. The shared opening controller now measures label widths, keeps complete labels inside the viewport and moves intersecting labels clear of the camera toolbar. The onboarding browser gate checks this clearance at every scene on desktop and 360/390/430px. A fresh exact-candidate CI run is required for this runtime correction.

Landscape screenshot review also found the movement-stick label clipped at the bottom edge. Reserve bottom safe-area space for the label and exercise the visible movement stick in landscape as well as portrait; the controls gate now checks the label bounds. These are bounded HUD corrections, not a new design pass.

The complete local journey then exposed a Signal 6 interaction blocker: legacy storm results/playback overlap the global header/objective, and the optional storm playground cannot be clicked. Group these existing controls in a scrollable world panel below the objective and above route construction, preserving all experiment and assessment semantics. Check panel bounds and real pointer access on desktop and phone. Split the existing ten browser modules into foundation, opening and journey CI groups on the same exact SHA; retain every module and all PostgreSQL/unit checks. Deployment remains blocked until the complete candidate passes and fresh screenshots are inspected.

The repaired full local journey passed through all seven signals, including storm experiments, saved draft recovery, lost-acknowledgement retry without duplicate evidence/XP, and the downloaded repair ZIP. Desktop/phone inspection found two remaining legacy text positions: put the Signal 6 block hint above its toolbelt and suppress the redundant builder title behind the global header in both builder worlds. These are presentation-only corrections; the final exact-source CI and hosted review remain pending.

## Foundations and boundaries

The product goal remains games generated on demand from learning needs and explicit preferences using reusable specs/assets. Echo Forge is the reference. The opening/controller/WorldSpec foundation already exists; this unit extends reusable input, navigation, camera and screen layout. An on-demand generator and preference collection service are not yet implemented.

Keep server-authoritative progression, Supabase auth/RLS and learner isolation, immutable evidence, assistance and unknown semantics. Camera/position are presentation state in this reference. Phase 2 remains closed.

## Review record

The last independent story-only score was 9.059/10 and first-touch score 8.528/10. Those scores apply to their historical reviewed scope and do not certify the new camera/login/mobile work. The user owns the next product gate; CI is not acceptance. Follow the user's bounded revision/review instruction without another unrelated broad architecture/art pass.

The exact candidate CI, rendered evidence and final live SHA are recorded on [PR #8](https://github.com/Desmic/VibeLearn/pull/8) once verification completes, so this source checkpoint does not falsely anticipate its own deployment. Earlier history is retained in Git and docs/history/.
