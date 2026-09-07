# Current checkpoint — private hosted pilot preparation

The user selected Render Free + Supabase Free and authorized use of the existing
Supabase project. The `deploy/render-supabase` branch adds a PostgreSQL storage
boundary, private schema/RLS, Supabase sign-in, and a Render Free configuration.
See `HOSTING.md` for observed checks, blockers, account setup, and recovery.
Supabase schema migration `20260907073952_vibelearn_hosted_schema` is applied.
No Render deployment, live hosted sign-in, or user acceptance is claimed yet.

## Earlier local Phase 1 checkpoint

Phase 0, 1A, 1B and 1C are implemented and verified. Stop here for real user feedback.
The running app is local-only at http://127.0.0.1:8000 while its server stays alive.
Version 0.1.0; schema 5. Source digest: 77628637b100124f206bf8b8fe543041f37944f26306e7e44a5c6af36e99b430.

Read `PHASE-1.md` for observed gate evidence, limits and recovery. `README.md` has
exact run/build/test commands. Current result: 31 unit/integration tests and 10 real
browser scenarios pass; no page errors. Tests use disposable data. Real user feedback
and independent human content review remain pending. No public activation occurred.

This is a Python modular monolith with SQLite and a real HTML/CSS/JS workspace.
No external model or app-integrated retriever/runner is operational. Hints are prepared
static aids. Assessment checks three trace predictions only; written reasoning stays
ungraded. Evidence is partial/provisional and XP never feeds mastery. Future review
needs target frames, with fresh review content explicitly unavailable in this slice.

Single next increment: revise this same episode in response to the user's trial
(challenge, feedback, workspace, restrained game elements). Do not start Phase 2
or generate more content before that checkpoint. Full replacement/export/restore
and hosted identity are deferred according to the v1.3 build order.

Git follow-up: initialized the local repository on `main` at the user's request.
No commits or remotes yet; source files remain unstaged. Existing ignore rules
exclude learner databases, generated artifacts, caches and local environment files.

Branding follow-up: renamed the product to `vibeLearn` at the user's request,
including the wordmark, tab title, footer, startup output and current documentation.
Build, all 31 unit/integration tests and all 10 browser scenarios passed again.
No schema or learner-data changes. The Phase 1 report/archive retain their original
checkpoint identity; the current build/served manifests identify the renamed build.
