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
role. Learner tables have forced learner-scoped RLS. `schema_migrations` is also
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
observations on the small pilot database; no indexes are being removed on that basis.

## Verified hosted infrastructure and acceptance evidence

- Render deployment is live and serves `/`, static assets, `/api/config`, and
  `/api/health` successfully.
- The hosted-pilot GitHub branch has green `Verify hosted pilot` CI, including build,
  Python tests, disposable PostgreSQL application tests, Chromium installation, and
  browser scenarios.
- PostgreSQL boundary checks passed learner isolation, composite ownership references,
  immutable submissions/history, reward deduplication, JSON lookup, and denial of
  unscoped reads.
- Password recovery completed successfully and the live hosted login returned HTTP
  200. PostgreSQL now contains one real learner and one active hosted application
  session.
- Two real hosted attempts were started and submitted. PostgreSQL contains two
  submitted attempts, two evidence rows, one review need, and exactly one 10-XP reward;
  the repeated attempt earned no second reward.
- A real Render process replacement completed and the same mobile browser subsequently
  received HTTP 200 from `/api/session` on the new instance, establishing live session
  and learner-state survival across that deploy.
- The automated hosted acceptance contract now covers login → start → save → hosted
  app recreation → resume → hint/mode/source → submit → evidence/review/XP → logout
  and replayed-cookie rejection in one continuous test.
- A separate automated two-authorized-learner test verifies that one learner cannot
  read or mutate the other's attempt. PostgreSQL RLS and service-level isolation tests
  provide independent coverage of the same boundary.
- Login and reset password fields share the reusable inline visibility control with
  keyboard operation and `aria-pressed` state; the real-browser CI test covers both.
- The premium/slightly-gameful UI direction is adopted in `docs/UI-UX-DIRECTION.md`.
  The learner has reviewed the current live UI and considers it good enough to keep
  refining incrementally as product work continues.

## Remaining hosted acceptance

The remaining live checks are now narrow:

1. Save a real draft before submission, reload the page, and verify the same draft
   resumes from PostgreSQL. The equivalent automated hosted acceptance test passes.
2. Sign out from the real hosted browser and verify the protected session is revoked.
   Automated replayed-cookie rejection passes.
3. Before broader multi-user activation, authorize a second real Supabase account and
   verify it cannot access the first learner's state. Automated two-user isolation and
   PostgreSQL RLS coverage pass.
4. Record final learner feedback on challenge quality and feedback usefulness; UI
   direction feedback is already positive.

## Earlier local Phase 1 checkpoint

Phase 0, 1A, 1B and 1C are implemented and machine-verified. The detailed local and
hosted completion evidence is in `docs/PHASE-1.md`. The SQLite local mode remains a
known-good development baseline and is intentionally separate from hosted account data.

The current product slice is still one original practice episode. Hints are prepared
static aids; only trace predictions receive deterministic grading; written reasoning
is retained but ungraded. Evidence is partial/provisional and XP never feeds mastery.
Future review needs target frames, while fresh review generation/scheduling remains
outside this slice.

## Remaining cleanup before broader use

- Align the actual Render service health-check path with `/api/health` from
  `render.yaml` if the service still uses the root path.

Do not begin Phase 2 solely because infrastructure is live. Close the remaining hosted
acceptance checks, then use the learner's actual experience of this same Phase 1 episode
to choose the next product increment.
