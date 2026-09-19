# Render pilot deployment — 2026-09-07

**Current deployment checkpoint — 19 September 2026:** Live Render source is intentionally still rejected `ad14c5aced6cf053c7617dfb03245506e1e9dad5` via deployment `dep-damhjg6k1f9s7393d650`. Frozen critic candidate `92a5ecbdc803362ee1554fca6ae811adb155bc26` (run `35434565005`) is **not deployed**. Auto-deploy remains disabled. Promotion requires candidate-scoped validated critics + schema-v2 review record through `promote-preview.yml`; no Render/Supabase mutation occurred during the 18–19 September quality-system/Terminal-PM-adapter work. September 7 setup/sign-in sections below are historical deployment history.

## Sign-in follow-up deployment

Candidate b9d57bb4d33c1c8ddfe03f20d38318fc36b87a92 adds safe sign-in diagnostics,
show/hide password and Supabase SDK email recovery (no new dependency). Local
build passed; 51 tests ran, 45 passed and 6 PostgreSQL tests skipped locally.
All ten real learning browser scenarios passed. GitHub Actions run 34107029260
passed with disposable PostgreSQL and Chromium. Render deployment
dep-daf8c8gn74is738qt140 was triggered after CI success. See docs/SIGN-IN-FIX.md.

Live verification: deployment finished at 09:39:35 UTC; health returned status ok
with PostgreSQL and source digest 9d8f067a36cf0acb16f10540bea47d202b46c54f529c7ab1dfb31a44634f2c68.
Browser showed Show password and Forgot password controls. A deliberate invalid
password probe returned 401 with request ID 69770ea62d5c4a16; Render logs matched
that ID to auth_failure reason invalid_credentials, provider status 400, and
request_completed status 401. This probe does not diagnose the user's earlier
password attempts retrospectively.

The first browser recovery request timed out without a recorded recovery send.
A subsequent direct request returned 200, and Supabase recorded recovery_sent_at
2026-09-07 09:41:27.475119+00 for the confirmed pilot account. Inbox delivery,
private password entry and a successful learner sign-in remain user-dependent.

## Current status — LIVE at 08:55 UTC

Account setup follow-up: the user created the pilot Auth account privately. SQL
inspection confirms `eatisshashank@gmail.com` exists with confirmed email. The
VibeLearn form has the email filled; the user must enter their chosen password.
Authenticated acceptance remains pending; the earlier zero-account observation
below is historical.

The user explicitly approved transferring the dedicated database credential to
Render. DATABASE_URL was stored privately with TLS required. Deployment
`dep-daf7nfou01pc7397fcb0` is live on the requested branch commit.

- Live link: https://vibelearn-4xws.onrender.com
- `/api/health` returned HTTP 200, status ok, database postgresql, schema version 1.
- `/api/state` without a signed-in session returned HTTP 401.
- Browser visibly rendered the Private Pilot sign-in form with email/password fields.
- The confirmed pilot Auth account count is still zero. Account/password setup must
  be completed privately in Supabase before learner sign-in can work. Authenticated
  save/reload/restart, cross-account isolation and logout acceptance remain pending.
- The custom Render health-check path remains unset; the health endpoint was checked
  directly. Service is Render Free; no paid resources were created.

The preparation notes below are historical; missing-credential and deployment-blocked
entries have been resolved by the approved transfer and successful live deployment.

User requested deployment of Desmic/VibeLearn branch `deploy/render-supabase`
using Render Free and existing Supabase project `pwipqbhkxekyglxkacey`.
User confirmed Kumar's workspace (`tea-daf75lad0e5s73b4cgvg`).

## Observed evidence

- Branch commit: `5e9570e5dbeab03f091c48f4ac371cd02383d38e`; PR #1 remains draft.
- GitHub Actions job `101669123681` passed build, test, and browser steps:
  https://github.com/Desmic/VibeLearn/actions/runs/34099078266/job/101669123681
- Supabase reports ACTIVE_HEALTHY and migration
  `20260907073952_vibelearn_hosted_schema`.
- Read-only inspection found `vibelearn_app` NOLOGIN, no `vibelearn_login`,
  and no Auth users. No database or Auth changes were made in this deployment turn.
- Created service `srv-daf7dhuq1p3s73c122cg`, runtime Python, plan free,
  Singapore, requested branch. Automatic deployment is off.
- Dashboard: https://dashboard.render.com/web/srv-daf7dhuq1p3s73c122cg
- Assigned origin: https://vibelearn-4xws.onrender.com
- Build: `pip install -r requirements.lock`
- Start: `gunicorn 'app.hosted:create_app()' --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 60`
- Configured Python 3.12.10, Supabase URL/publishable key, and exact APP_ORIGIN.
  No secret values are recorded here.
- Initial deploy `dep-daf7dimq1p3s73c125h0` was build_in_progress when inspected.
  Updating environment settings requested another deployment. No live gate passed.

## Remaining setup

### Connection preparation after dashboard sign-in

- Observed the actual session pooler in Supabase Connect:
  `aws-0-ap-south-1.pooler.supabase.com:5432`.
- Created `vibelearn_login` with a cryptographically generated password and granted
  `vibelearn_app`. Verified LOGIN true; SUPERUSER, CREATEDB, CREATEROLE, BYPASSRLS
  false; app role membership true. No administrator credential was changed.
- Credential is held privately for transfer, not written in this report or source.
- Automatic approval review rejected saving DATABASE_URL in Render pending explicit
  user approval to transfer this new database credential to the named service.
  Therefore DATABASE_URL is still not configured and the app is not live.
- The credential transfer approval is the next action; do not recreate the login.

- User subsequently explicitly approved the pilot email. ALLOWED_EMAILS was set
  successfully on 2026-09-07; Render triggered deploy dep-daf7imn40ujc73a0aoj0.
- Render logs confirm startup is blocked by the missing PostgreSQL DATABASE_URL.
  The Supabase connector exposes SQL management but no pooler connection lookup;
  no local DATABASE_URL or Supabase management token is available.
- Sign in to Supabase dashboard to obtain the actual shared session pooler host.
- Create a dedicated restricted deployment login, grant vibelearn_app, and securely
  configure DATABASE_URL with TLS. Do not reset or reuse administrator credentials.
- Create the confirmed pilot Auth account with a privately managed password.
- Set Render healthCheckPath to /api/health (creation tool did not expose this field).
- Deploy and verify health, authenticated save/reload/restart persistence, account
  isolation, logout revocation, and browser/keyboard behavior per branch docs/HOSTING.md.

The app cannot start successfully until DATABASE_URL and ALLOWED_EMAILS are set.
No paid database, disk, worker, cron, or upgrade was created. No human acceptance
or production readiness is claimed. The local main checkout and learner data were
preserved. To recover, stop the new Render service, repair configuration, and deploy
the verified branch commit; do not delete learner tables or migration history.
