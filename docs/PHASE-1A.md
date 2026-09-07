# Phase 1A checkpoint — verified

Outcome: one original static episode; scoped session and frozen attempt; save/resume.
Checks: `python manage.py build` passed; `python manage.py test` passed 8 tests;
`python manage.py browser` passed save, reload, actual process restart, 390px width,
and keyboard Tab from trace answer to diagnosis. Real temporary SQLite throughout.
Artifacts: phase1a-browser.png and phase1a-mobile.png in artifacts/.
Initial browser title assertion failed because an edit read the test source with
Windows default encoding. Corrected explicit UTF-8 IO and reran successfully.

Schema 2: learners, hashed local session tokens, attempts, durable command receipts.
Private self-report is separate from reusable content. Learner identity comes from
an HttpOnly local session; commands cannot choose another learner in their payload.
This is a local development session, not hosted authentication.

Recovery: restart against the same database and use the same browser cookie.
Unsaved draft recovery is device-local, keyed by learner and attempt. Stale writes
are rejected. User feedback pending; no public deployment. Next: Phase 1B,
checked trace criterion + pinned evidence + frame-targeted future retrieval.
