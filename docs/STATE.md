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
protection being disabled; that is intentionally left unchanged for the current
disposable private pilot.

The advisor-reported uncovered foreign keys are also fixed with covering indexes on
`assistance(attempt_id, learner_id)`, `checkpoints(attempt_id, learner_id)`, and
`evidence(attempt_id, learner_id)`. Remaining performance notices are only unused-index
observations on an empty pilot database; no indexes are being removed on that basis.

## Verified hosted infrastructure

- Render deployment is live and serves `/`, static assets, `/api/config`, and
  `/api/health` successfully.
- The current hosted-pilot GitHub branch has green `Verify hosted pilot` CI, including
  build, Python tests, disposable PostgreSQL application tests, Chromium installation,
  and browser scenarios.
- PostgreSQL boundary checks passed learner isolation, composite ownership references,
  immutable submissions/history, reward deduplication, JSON lookup, and denial of
  unscoped reads.
- Supabase password-reset delivery is verified: the application accepted the reset
  request and the recovery email arrived with the live Render origin as its redirect.
- The recovery link was opened successfully and `/api/auth/reset-password` completed
  with HTTP 200 on the live Render service. Supabase records the resulting Auth
  session/password update.
- Login and reset password fields now share the same reusable show/hide control with
  keyboard operation and `aria-pressed` state. The hosted real-browser CI test covers
  both password fields, including returning to hidden mode on submit.
- The latest Render deploy containing those visibility controls is live and its CI run
  passed.

## Remaining hosted acceptance

Password recovery itself is complete. The reset flow deliberately clears VibeLearn's
application cookies, so there is not yet a VibeLearn learner/app-session row in
PostgreSQL. One fresh sign-in through the hosted login form is still required to create
that application session.

After that sign-in, run the hosted acceptance journey before declaring the pilot
complete:

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

- Align the actual Render service health-check path with `/api/health` from
  `render.yaml` if the service still uses the root path.

Do not begin Phase 2 on the basis of machine checks alone. The next product gate is the
real hosted learner trial and feedback on this same Phase 1 episode.
