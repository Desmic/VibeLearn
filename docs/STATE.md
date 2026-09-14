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

## Foundations and boundaries

The product goal remains games generated on demand from learning needs and explicit preferences using reusable specs/assets. Echo Forge is the reference. The opening/controller/WorldSpec foundation already exists; this unit extends reusable input, navigation, camera and screen layout. An on-demand generator and preference collection service are not yet implemented.

Keep server-authoritative progression, Supabase auth/RLS and learner isolation, immutable evidence, assistance and unknown semantics. Camera/position are presentation state in this reference. Phase 2 remains closed.

## Review record

The last independent story-only score was 9.059/10 and first-touch score 8.528/10. Those scores apply to their historical reviewed scope and do not certify the new camera/login/mobile work. The user owns the next product gate; CI is not acceptance. Follow the user's bounded revision/review instruction without another unrelated broad architecture/art pass.

The exact candidate CI, rendered evidence and final live SHA are recorded on [PR #8](https://github.com/Desmic/VibeLearn/pull/8) once verification completes, so this source checkpoint does not falsely anticipate its own deployment. Earlier history is retained in Git and docs/history/.
