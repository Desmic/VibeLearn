# vibeLearn · first slice

One local, persisted practice episode about reliable agent execution. Implemented
in the order Phase 0 → 1A → 1B → 1C. The next step is real user feedback, not Phase 2.

## Run locally

Tested on Windows with Python 3.13.5 and SQLite 3.49.1. No runtime packages or API
keys are required. From `E:\Projects\VibeLearn`:

```powershell
python manage.py serve
```

Open [the local workspace](http://127.0.0.1:8000). Keep that terminal running.
Stop with Ctrl+C and run the same command to resume. The database defaults to
`data/learning.sqlite3`; migrations apply transactionally on startup.
Keep the same browser profile and hostname: an HttpOnly cookie identifies the local
learner. A different browser profile gets a separate learner. Losing/clearing that
cookie does not delete database records, but there is no account recovery UI yet.
This is deliberately a local development session, not production authentication.

## Verify an increment

The app does not need Node, but its build verification uses Node 22.17.0 to check JS.
The browser suite uses Playwright 1.53.0 and Chromium 138.0.7204.23 (observed here).
If setting up a new test environment, install `requirements-dev.txt` and run
`python -m playwright install chromium`. Those installation commands were not
needed or exercised here; the dependencies were already installed.

```powershell
python manage.py build
python manage.py test
python manage.py browser
```

Each command must exit successfully before continuing. The browser suite starts
its own server process and temporary real SQLite database, performs browser reloads
and process restarts, injects a lost acknowledgement after a real commit, and saves
screenshots and its report to `artifacts/`. Tests never use the real learner DB.
The build writes `artifacts/build-manifest.json`; `/api/health` reports the source
identity captured when the server started. Restart the server after source edits.

## What to try

1. Begin in LEARN, predict three charge counts, and write a diagnosis.
2. Save, reload, and resume. Reveal a hint if useful; the pre-hint answer is retained.
3. Submit and inspect the trace feedback, earlier checkpoints, pinned evidence and
   future review need. The first completed trace family earns 10 practice XP.
4. Try PAIR for source access or BUILD for a prepared worked example. Prior help
   remains recorded when modes change. Repeating the trace earns no additional XP.

The prepared hints are static, not adaptive AI dialogue. The deterministic assessor
checks exactly the stated trace counts. Written reasoning is ungraded; all frame
claims remain provisional. The review targets a competency/frame, and honestly says
that a fresh review activity is still needed. There is no review notification job.
The original content has an executable criterion check and implementation-agent
inspection; independent human content review and product acceptance are pending.

## Recovery and data

Drafts are committed with explicit Save. Unsaved edits are additionally retained in
browser storage, scoped by learner/attempt. Failed requests keep the visible answer.
If a stale-tab conflict appears, copy the visible text if needed, reload, inspect the
recovered local draft, and save the intended version. Device-local recovery is not a
cross-device synchronization or guaranteed backup service.

Before changing versions, stop the server and copy `data/learning.sqlite3` to a safe
backup location. Preserve any accompanying SQLite journal until a clean restart;
do not copy a live database as a backup. To inspect a saved backup independently, first make a working copy, then
start the app with `python manage.py serve --db <working-copy-path> --port 8001`.
Schema changes are forward-only. Older versions refuse newer schemas; code rollback
is not database rollback. No destructive reset command is supplied.

The source checkpoint archive listed in `docs/PHASE-1.md` excludes all learner data.
Unpack it in a fresh directory for code recovery; keep your existing database intact.
Full export/restore, course replacement, generation, hosting and untrusted code
execution are intentionally deferred. Public/multi-user exposure is unsupported.

## Code and evidence

- `app/content.py`: original task, exact frame/rubric/binding definitions and source metadata.
- `app/assessment.py`: pure trace assessment and clock-explicit retrieval policy.
- `app/service.py`: scoped commands, checkpoints, evidence, assistance and reward transaction.
- `app/storage.py`: SQLite schema migrations and immutable-history guards.
- `app/server.py`: loopback transport, session resolution and explicit static file allowlist.
- `web/`: semantic responsive interface with optional WebMCP save action.
- `tests/`: real database and HTTP tests, pure criterion tests and browser journey.
- `docs/STATE.md`, `docs/PHASE-1.md`: current handoff, verification and limits.

No Git repository existed in the supplied directory. A local repository was
subsequently initialized on `main` at the user's request. No commit or remote is
configured yet. Learner data, generated artifacts, Python caches and local environment
files are ignored. The design package is preserved unchanged; the verified Phase 1
source identity remains recorded in its SHA-256 manifest.
