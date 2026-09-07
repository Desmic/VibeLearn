# vibeLearn · first slice

One persisted practice episode about reliable agent execution, implemented in the
order Phase 0 → 1A → 1B → 1C. Machine verification for the Phase 1 slice is complete;
the next product gate is real hosted learner feedback, not Phase 2.

A private Render Free + Supabase Free pilot is live from `deploy/render-supabase`.
See [hosting setup and verification](docs/HOSTING.md) and the current checkpoint in
[`docs/STATE.md`](docs/STATE.md). The loopback command below still uses SQLite.

## Run locally

Tested on Windows with Python 3.13.5 and SQLite 3.49.1. No runtime packages or API
keys are required for local mode. From `E:\Projects\VibeLearn`:

```powershell
python manage.py serve
```

Open [the local workspace](http://127.0.0.1:8000). Keep that terminal running.
Stop with Ctrl+C and run the same command to resume. The database defaults to
`data/learning.sqlite3`; migrations apply transactionally on startup.
Keep the same browser profile and hostname: an HttpOnly cookie identifies the local
learner. A different browser profile gets a separate learner. Local mode remains a
development baseline and is intentionally separate from hosted account data.

## Hosted pilot

The hosted pilot is available at:

`https://vibelearn-4xws.onrender.com`

Hosted mode uses Flask/Gunicorn on Render, PostgreSQL in Supabase, Supabase Auth,
a private email allowlist, Secure/HttpOnly/SameSite=Strict cookies, and the private
`vibelearn` schema with learner-scoped RLS. It does not use a service-role key for
learner authentication.

A Supabase recovery email flow is implemented for allowlisted learners. The current
pilot account is confirmed and recovery-email delivery has been verified; the
remaining acceptance gate is a successful real password reset/sign-in followed by
save/reload/restart/logout verification and the learner's actual Phase 1 trial.

## Verify an increment

The app does not need Node at runtime, but build verification checks JavaScript with
Node. The browser suite uses Playwright + Chromium.

```powershell
python manage.py build
python manage.py test
python manage.py browser
```

Each command must exit successfully before continuing. The browser suite starts its
own server process and disposable database, performs browser reloads and process
restarts, injects a lost acknowledgement after a real commit, and writes artifacts.
Tests never use the real learner database.

The hosted branch also has a GitHub Actions verification workflow. The current
`Verify hosted pilot` run is green, including build, Python tests, disposable
PostgreSQL application tests, Chromium installation, and the browser suite.

## What to try

1. Begin in LEARN, predict three charge counts, and write a diagnosis.
2. Save, reload, and resume. Reveal a hint if useful; the pre-hint answer is retained.
3. Submit and inspect the trace feedback, earlier checkpoints, pinned evidence, and
   future review need. The first completed trace family earns 10 practice XP.
4. Try PAIR for source access or BUILD for a prepared worked example. Prior help
   remains recorded when modes change. Repeating the trace earns no additional XP.

The prepared hints are static, not adaptive AI dialogue. The deterministic assessor
checks exactly the stated trace counts. Written reasoning is ungraded; all frame
claims remain provisional. The review targets a competency/frame and states that a
fresh review activity is still needed. There is no review notification job.
Independent human content review and product acceptance remain pending.

## Recovery and data

Drafts are committed with explicit Save. Unsaved edits are additionally retained in
browser storage, scoped by learner/attempt. Failed requests keep the visible answer.
Device-local recovery is supplementary, not cross-device synchronization or a
backup guarantee.

For local SQLite recovery, stop the server before copying `data/learning.sqlite3`.
Schema changes are forward-only. Older versions refuse newer schemas; code rollback
is not database rollback.

For hosted recovery, keep PostgreSQL migration history intact and redeploy a known
compatible Git revision if the app regresses. Do not treat deleting migrations or
learner tables as rollback.

## Code and evidence

- `app/content.py`: original task, exact frame/rubric/binding definitions and source metadata.
- `app/assessment.py`: pure trace assessment and clock-explicit retrieval policy.
- `app/service.py`: scoped commands, checkpoints, evidence, assistance and reward transaction.
- `app/storage.py`: local SQLite migrations and the shared storage boundary.
- `app/postgres.py`: restricted PostgreSQL transaction boundary for hosted mode.
- `app/server.py`: loopback/local transport.
- `app/hosted.py`: hosted Flask transport, session and origin boundaries.
- `app/auth.py`: Supabase Auth adapter and password-recovery flow.
- `web/`: semantic responsive interface with optional WebMCP save action.
- `tests/`: database/HTTP/browser verification.
- `docs/STATE.md`, `docs/PHASE-1.md`, `docs/HOSTING.md`: current handoff,
  Phase 1 evidence, hosted acceptance state, and limits.

The repository is now published on GitHub as `Desmic/VibeLearn`. Learner data,
generated artifacts, Python caches, and local environment files remain ignored. The
design package is preserved unchanged; historical Phase 1 checkpoint identities remain
recorded in their manifests and reports.
