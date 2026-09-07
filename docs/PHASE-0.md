# Phase 0 checkpoint — verified

Baseline: supplied design package, no Git repository or app. Nothing overwritten.
Decision: Python 3.13.5, standard-library HTTP/SQLite, plain browser UI; dev-only
Playwright 1.53.0 / Chromium 138.0.7204.23, Node 22.17.0 for JS syntax verification.
Local-only requirements override the optional hosted Sites scaffold.

Observed checks on 2026-09-06:
- `python manage.py build`: passed Python compilation and browser JS syntax.
- `python manage.py test`: 2 actual SQLite tests passed (committed write/read after
  reconnect/migration; transaction rollback).
- `python manage.py browser`: real subprocess/HTTP/Chromium visit passed.
- `artifacts/phase0-browser.png`: actual screenshot, retained locally.

Capability register: CAPABILITIES.md. No live model or isolated runner claimed.
Original dependency pin was corrected to the actually installed Playwright 1.53.0
before the gate. No package download was required. No prior app failures existed.

Next increment: Phase 1A. Acceptance: start a scoped attempt with frozen content,
commit and resume a draft across browser reload and process restart, reject another
learner's command and stale writes, keyboard navigation and a narrow viewport.
Excluded: assessment, hints, rewards. Recovery: stop the server, keep the database,
restart with the same `--db`; baseline tests use disposable databases.
