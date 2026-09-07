# Current checkpoint — private hosted pilot

VibeLearn is deployed as a private pilot on Render Free with Supabase Free.
The active Render service is `https://vibelearn-4xws.onrender.com`, built from
`deploy/render-supabase`. The hosted app uses Flask/Gunicorn, PostgreSQL, Supabase
Auth, an explicit email allowlist, Secure/HttpOnly/SameSite=Strict cookies, and the
private `vibelearn` PostgreSQL schema.

Supabase migrations applied:

- `20260907073952_vibelearn_hosted_schema`
- `20260907102455_harden_hosted_schema_access`
- `20260907102517_cover_hosted_foreign_keys`

The runtime connects through the restricted `vibelearn_login` -> `vibelearn_app`
role. Learner tables have forced learner-scoped RLS. `schema_migrations` is now also
RLS-protected with an app-only read policy. `anon` and `authenticated` have no schema
USAGE or table grants for `vibelearn`; the application does not use a service-role
key for learner authentication.

The pre-existing `public.rls_auto_enable()` SECURITY DEFINER helper still powers its
event trigger, but direct EXECUTE access from `PUBLIC`, `anon`, and `authenticated`
has been revoked. Supabase's security advisor now reports only leaked-password
protection being disabled.

The advisor-reported uncovered foreign keys are also fixed with covering indexes on
`assistance(attempt_id, learner_id)`, `checkpoints(attempt_id, learner_id)`, and
`evidence(attempt_id, learner_id)`. Remaining performance notices are only unused-index
observations on an empty pilot database; no indexes are being removed on that basis.

## Verified hosted infrastructure

- Render deployment is live and serves `/`, static assets, `/api/config`, and
  `/api/health` successfully.
- The hosted-pilot GitHub branch has green `Verify hosted pilot` CI, including build,
  Python tests, disposable PostgreSQL application tests, Chromium installation, and
  browser scenarios.
- PostgreSQL boundary checks passed learner isolation, composite ownership references,
  immutable submissions/history, reward deduplication, JSON lookup, and denial of
  unscoped reads.
- Supabase password-reset delivery is verified: the application accepted the reset
  request and the Supabase recovery email arrived at the pilot account with the live
  Render origin as its redirect target.
- A fresh Render deploy was triggered for the latest hosted-pilot branch after the
  documentation/hardening pass so the running service can align to the latest branch
  state without changing PostgreSQL data.

## Remaining hosted acceptance

A real password sign-in has not completed yet. The latest provider-classified login
failure is `invalid_credentials`; the sole Supabase Auth account is confirmed but has
no successful sign-in recorded. The recovery email has been delivered, so the next
user-bound step is to open that email, choose a new password in VibeLearn, and sign in.

After first successful sign-in, run the hosted acceptance journey before declaring the
pilot complete:

1. Open the workspace and start the Phase 1 episode.
2. Save a real draft and reload; verify the same draft resumes from PostgreSQL.
3. Restart/redeploy the Render service without changing the database and verify the
   same learner state resumes.
4. Complete/submit the episode and verify evidence, checkpoints, review need, and the
   one-time practice XP reward.
5. Sign out and verify the application session is revoked.
6. Verify a second authorized learner cannot access the first learner's state before
   any broader multi-user pilot.
7. Record real learner feedback; do not synthesize human product acceptance.

## Earlier local Phase 1 checkpoint

Phase 0, 1A, 1B and 1C are implemented and machine-verified. The detailed local
completion evidence remains in `docs/PHASE-1.md`. The SQLite local mode remains a
known-good development baseline and is intentionally separate from hosted account data.

The current product slice is still one original practice episode. Hints are prepared
static aids; only trace predictions receive deterministic grading; written reasoning
is retained but ungraded. Evidence is partial/provisional and XP never feeds mastery.
Future review needs target frames, while fresh review generation/scheduling remains
outside this slice.

## Remaining cleanup before broader use

- Enable Supabase leaked-password protection when appropriate for the pilot.
- Align the actual Render service health-check path with `/api/health` from
  `render.yaml` if the service still uses the root path.

Do not begin Phase 2 on the basis of machine checks alone. The next product gate is the
real hosted learner trial and feedback on this same Phase 1 episode.
