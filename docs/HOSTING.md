# Private Render + Supabase pilot

**Latest deployment — 20 September 2026:** Explicitly user-requested private review
version `74455fd7f22d6a423eb93b070bd2c9a37d0953d7` is live (deploy
`dep-dao21bn40ujc73djt40g`). Auto-deploy remains off; database configuration and
schema were not changed. Health and exact served runtime files verified; native
browser entry rendered. Open quality/CI findings and the one-off deployment
authority are recorded in [the deployment record](experiments/20260920-user-requested-deployment.md).
This supersedes the deployed-SHA statement below, not the future review gates.

**Current infrastructure checkpoint — 19 September 2026:** Render remains live on exact rejected source `ad14c5aced6cf053c7617dfb03245506e1e9dad5` (deployment `dep-damhjg6k1f9s7393d650`), with auto-deploy disabled. Frozen critic candidate `92a5ecbdc803362ee1554fca6ae811adb155bc26` is **not deployed**. Supabase remains on migrations `20260907073952`, `20260907102455`, `20260907102517`, `20260909132331`, `20260916161700`; no database/data mutation was made by the 18–19 September quality/adapter work. Preview promotion must first pass `promote-preview.yml` for the exact candidate/evidence run; Render deployment is then a separate explicit action. September 7 auth/bootstrap details below are historical unless explicitly reverified.

**Current review amendment — 14 September 2026:** The next verified deployment must include the shared camera/input and 3D entry assets in both hosted/local allowlists. Keep vendor generation of engine, models and repair ZIP, auto-deploy OFF, exact SHA verification and existing Supabase configuration. Read [GAME-CAMERA-INPUT.md](GAME-CAMERA-INPUT.md).

**Current user contract — 13 September 2026:** Read [GAME-OPENING-PROGRESSION.md](GAME-OPENING-PROGRESSION.md) before implementation or review. The `16a655e` experience was user-rejected. Require a first-entry skippable 3D opening, tutorial with early success, gradual progression, optional non-destructive replay at every level, and no automatic opening for Level 2+ players. Remove the 2D gameplay fallback; preserve accessible HUD controls and honest 3D recovery. This amendment supersedes conflicting legacy guidance below.

This increment hosts the Phase 1 episode on Render Free + Supabase Free without
introducing later course generation or collaborative code execution. The hosted
branch starts from `26acf22d1ceceec4724b9c824065ecee05ea7cac`.

## Implementation

- `app/hosted.py`: Flask WSGI app served by Gunicorn. Hosted mode requires
  PostgreSQL, TLS, the exact HTTPS application origin, and an email allowlist.
- `app/auth.py`: Supabase password sign-in and server-side `get_user` verification
  on authenticated requests, using a fresh non-persisting client. Anonymous and
  unconfirmed identities are rejected. No service-role key is used by the app.
- Password recovery: allowlisted learners can request a Supabase recovery email.
  Recovery tokens arrive in the URL fragment, are removed from browser history,
  remain in memory only, and are used to set a new password through Supabase Auth.
- Sessions: Secure, HttpOnly, SameSite=Strict application cookies. Access lasts at
  most one hour. App logout revokes the stored application session immediately.
- `app/postgres.py`: one transaction per command, per-learner transaction advisory
  locking, bounded statement/lock timeouts, and prepared statements disabled for
  pooler compatibility. Transactions switch to restricted role `vibelearn_app`.
- `db/hosted-schema.sql`: private `vibelearn` schema, forced RLS on learner tables,
  ownership-preserving references, immutable history, and command/reward deduplication.
  `anon` and `authenticated` have no schema USAGE or application-table grants.
- SQLite local mode remains intact. Existing local anonymous learner data is not
  automatically assigned to hosted accounts.
- `render.yaml`: one free Python service in Singapore; no paid Render database,
  worker, disk, cron service, or other paid resource is provisioned.

## Current Supabase state

The Free project in `ap-south-1` has these applied migrations:

- `20260907073952_vibelearn_hosted_schema`
- `20260907102455_harden_hosted_schema_access`
- `20260907102517_cover_hosted_foreign_keys`
- `20260909132331_learner_scoped_progress_reset`
- `20260916161700_draft_per_mission`

`vibelearn_app` is deliberately NOLOGIN. The deployment login `vibelearn_login`
exists, can log in, inherits `vibelearn_app`, and is neither superuser nor BYPASSRLS.

Live inspection confirms:

- `anon` and `authenticated` have no USAGE on schema `vibelearn`.
- `anon` and `authenticated` have no application-table grants in that schema.
- Learner-facing tables have `learner_scope` RLS policies for `vibelearn_app`.
- `vibelearn.schema_migrations` also has RLS enabled and forced, with an app-only
  SELECT policy so startup schema verification still works.
- The pre-existing `public.rls_auto_enable()` event-trigger function remains active,
  but direct EXECUTE privileges for `PUBLIC`, `anon`, and `authenticated` have been
  revoked. Supabase no longer reports those SECURITY DEFINER warnings.
- Covering indexes now exist for the previously advisor-reported uncovered foreign
  keys on assistance, checkpoints, and evidence.
- The running Render application can reach PostgreSQL successfully.

Supabase's security advisor now reports only leaked-password protection being
disabled. The performance advisor reports only unused-index observations; the pilot
database currently has no learner data, so those indexes are not being removed on
that basis.

## Current Render state

Render service `vibelearn` is live at:

`https://vibelearn-4xws.onrender.com`

It deploys from branch `deploy/render-supabase` on the Free plan in Singapore. The
service builds with `pip install -r requirements.lock && python manage.py vendor` and starts with:

`gunicorn 'app.hosted:create_app()' --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 60`

Observed live responses include successful `/`, static asset, `/api/config`, and
`/api/health` requests. The checked-in `render.yaml` specifies `/api/health` as the
health check; the actual Render service should be aligned to that path if it is still
using the default root check.

The Render service has auto-deploy disabled, so explicit deploys are used after branch
changes. A deploy for the hosted Phase 1 checkpoint commit was triggered after this
verification pass; PostgreSQL data is independent of the stateless Render instance.

## Authentication state

The single pilot Supabase Auth user is confirmed. A real password sign-in has not
completed yet; the latest provider-classified rejection was `invalid_credentials`.
The app's password-reset endpoint successfully requested recovery, and the Supabase
recovery email was delivered with the live Render origin as its redirect target.

The remaining user-bound step is to open that recovery email, choose a new password
inside VibeLearn, and sign in once. Do not copy recovery tokens into documentation,
logs, issues, or chat.

## Observed verification

- `python manage.py build`: passed.
- Local Python/unit/integration checks passed during development.
- `db/verify-hosted-boundaries.sql` passed against the actual Supabase PostgreSQL
  database with the restricted role, including learner isolation, ownership
  references, immutable history, reward deduplication, JSON lookup, and denial of
  unscoped reads. Fixtures rolled back.
- GitHub Actions `Verify hosted pilot` is green on the hosted branch, including
  build, Python tests, disposable PostgreSQL application tests, Chromium installation,
  and browser scenarios.
- Render's live deployment successfully boots Gunicorn against the configured
  PostgreSQL backend.
- Supabase security hardening and FK-index migrations were applied and the advisors
  were re-run afterward.
- Password-reset email delivery is verified. A successful real-user password login
  and hosted learner-session acceptance are still pending.

## Hosted acceptance gate

After the first successful login, complete these checks before calling the hosted
pilot accepted:

1. Open the Phase 1 workspace and start an episode.
2. Save a real draft, reload the page, and verify the same draft resumes.
3. Restart or redeploy Render without changing PostgreSQL and verify the same state
   resumes after the service returns.
4. Complete and submit the episode; verify assessment rows, checkpoints, evidence,
   future review need, and the single-family practice-XP cap.
5. Log out and verify the local application session is revoked.
6. Before a broader multi-user pilot, authorize a second account and verify it cannot
   access the first learner's attempts/evidence/rewards.
7. Record actual learner feedback on challenge, feedback quality, workspace, and
   restrained game elements. Human acceptance must not be synthesized from tests.

## Recovery and production limits

Keep the local SQLite mode as the known development baseline until hosted acceptance.
The hosted schema is additive and independent of SQLite. If a deployment regresses,
redeploy a known-compatible Git revision; do not delete learner tables or erase
migration history as a rollback mechanism.

The pilot remains allowlisted. Full self-service account lifecycle, deletion/export,
managed backup policy, production monitoring, background jobs, adaptive AI dialogue,
and Phase 2+ systems are not complete. Render Free may sleep on idle. No production
readiness claim or paid upgrade is implied by this pilot.

## 13 September 2026 deployment correction

Render previously ran the intended source while `/vendor/playcanvas.mjs` returned 404 because its manually configured build command omitted vendoring. The user corrected the setting; deployment `dep-dajhlre7bikc73c4c40g` became live on exact `16a655e9c5f426a488cae9af0c17f062bae43dbd`. Public engine/model URLs returned 200 with expected MIME types and matching verified bytes. This fixed asset delivery, not the subsequently rejected game experience. Future deploy checks must verify service settings, source SHA, engine/model requests and actual first-entry/resume behavior.


## Complete runtime asset preparation

The stored Render command is `pip install -r requirements.lock && python manage.py vendor`. `vendor` must prepare every required served runtime asset, including `web/relay-repair-kit.zip`, as well as PlayCanvas, legacy verification dependencies and the two pinned GLBs. Render does not run the Node-based CI `build` command. Generating the kit only in CI caused an uncovered hosted packaging gap; the runtime-assets regression now exercises the actual `vendor` entry point in a clean temporary tree and checks the allowlisted archive bytes.

ZIP container hashes can vary with file timestamps when CI rebuilds the kit. Verify the exact deployed Git SHA, authored source/engine/model hashes, and the package's allowlisted contents; do not equate an incidental archive timestamp with a source revision change.

## 15 September 2026 local AI prototype

The `/word-machine` page, entry loader, world package, props and adapter were allowlisted in both local and hosted applications for this 15 September increment. They used the same engine/model vendor preparation and strict CSP. No database migration or production configuration change was made by that increment. Local/fixture tests of these routes did not establish live Supabase Auth or hosted PostgreSQL behavior. **At that historical point**, Render still served `337db573d87c417aca42f55894a2c6e807df21ed`; the current live source is recorded in the authoritative 19 September checkpoint at the top of this file.
