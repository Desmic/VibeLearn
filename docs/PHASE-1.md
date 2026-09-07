# First slice completion report — 6 September 2026

## Outcome and stopping point

Phase 0 → 1A → 1B → 1C implemented in verified increments. One usable original
practice episode: start in LEARN/PAIR/BUILD, predict a payment retry trace, write a
diagnosis, save/resume, request progressive hints, submit, inspect evidence and
pre-help checkpoints, see a future frame review need and bounded practice XP.
Stop at the Phase 1 human checkpoint; no Phase 2+ subsystem was implemented.

The current directory originally contained only the design handoff. No Git repository,
base commit or candidate commit existed; none was invented. Supplied design files
remain in place. Version 0.1.0, schema 5. Candidate/source SHA-256:

`3d17fdd657ca522f38fd8a733a56a7ddca382513b39e04b3266a39e9afb56786`

`artifacts/build-manifest.json` and `artifacts/served-manifest.json` match. The actual
running localhost HTML, CSS and JavaScript bytes were independently fetched and
matched to their manifest hashes. No remote deployment, push or release occurred.
A source-only checkpoint is retained as `artifacts/phase1-source-checkpoint.zip`,
with its archive SHA-256 in `artifacts/phase1-source-checkpoint.sha256`.

## Observed verification

Environment: Windows PowerShell; Python 3.13.5; SQLite 3.49.1; Node 22.17.0;
Playwright 1.53.0; Chromium 138.0.7204.23. All commands ran in the selected project.

| Gate | Actual command / interaction | Observed result |
|---|---|---|
| Reproducible build | `python manage.py build` | Passed Python compilation and JS syntax; build manifest retained |
| Core suite | `python manage.py test` | 31 unit/integration tests passed, none skipped |
| Browser suite | `python manage.py browser` | 10 real browser scenarios passed; no page errors |
| Actual local serving | `python manage.py serve`; GET `/api/health` and all three UI assets | Responding on 127.0.0.1:8000; source/served hashes agree |
| Database baseline | Real committed SQLite write/read, reconnect and rollback | Passed before Phase 1A |
| Migration | Schema 1 fixture and populated Phase 1B schema 3 history → schema 5 | Data, evidence, aid meaning and review retained; no fabricated reward |
| Restart | Browser reload and actual HTTP subprocess termination/restart on same DB/port | Drafts, evidence, rewards and review retained |
| Concurrency/retry | Duplicate save/hint/submit; concurrent identical submissions; real commit with dropped HTTP response | One committed result; no duplicate evidence or reward |
| Failure recovery | Actual stopped server; typing during in-flight save; injected evaluator and transactional storage failures | Visible/newer answer retained; unknown not zero; atomic rollback |
| Learning boundaries | Invalid/missing predictions, pre-help versus assisted checkpoints, source gates, mode changes, repeated family | Passed; independent declaration never restored by mode switch |
| Identity | Distinct browser contexts; scoped HTTP and application commands; host/origin restrictions | Cross-learner commands rejected; no shared evidence/XP |
| UI | Keyboard Tab/Enter; 390px viewport; 200% text enlargement; desktop/mobile screenshot inspection | Passed; no document horizontal overflow |

Raw records: `artifacts/build.log`, `artifacts/tests.log`,
`artifacts/browser-report.json`. Screenshots: `artifacts/phase0-browser.png`,
`artifacts/phase1a-browser.png`, `artifacts/phase1a-mobile.png`,
`artifacts/phase1b-recap.png`, `artifacts/phase1-workspace.png`,
`artifacts/phase1-mobile.png`, `artifacts/phase1-recap.png`.
Earlier phase reports record checks run before their dependent work began.

Two browser-test authoring failures were repaired and rerun: a Windows-default
encoding read changed a title assertion; a textarea assertion checked DOM text
instead of its live input value. Visual inspection also identified ambiguous source
wording after switching modes and a wrapping mobile trace diagram; both were repaired
before the final browser gate. No requirement was removed, skipped or weakened.

One browser fault deliberately drops the acknowledgement AFTER the real server
commits. Another stops the real server. No fake successful API response or mock DB
was used. The unit evaluator-failure case deliberately injects a failure; it is not
reported as a live model probe. Ordinary successful assessment tests execute the
real deterministic evaluator. All verifier attempts live in temporary test databases.

## Assessment, capability and product limits

The content is original static practice with a prepared rubric, exact activity/frame/
binding/rubric revisions, explicit assumptions and an executable trace model.
Implementation-agent inspection and criterion checks are recorded honestly;
independent human content review and educational validation are still pending.
Only trace counts receive a deterministic score. Written diagnosis is retained and
explicitly ungraded. Missing/invalid/evaluator-unavailable outcomes are distinct from
incorrect predictions. Partial evidence stays provisional; it cannot establish
mastery or skipping. Self-reported experience is private learner data, not evidence.

Each checkpoint pins its response, mode and then-observed help. Later hints and source
exposure do not rewrite earlier evidence. Source reading after submission cannot
change the submitted answer. Returning from BUILD/PAIR to LEARN does not erase help.
Repeated family practice is familiar/assisted and earns no extra XP. The first valid
submission earns 10 practice XP regardless of prediction correctness, with a durable
per-learner/family cap. Assessment and scheduling never consume XP.

Retrieval needs reference the canonical frame/competency and retain due time, policy
and evidence basis independently of courses. The UI explicitly says a fresh activity
is needed. There is no scheduler notification, review exercise generator, full
knowledge-map UI or course replacement/export system in this slice.

Capability register: `CAPABILITIES.md`. Public AWS article text was actually inspected
through the available research tool, without private learner queries. The app retains
original task content and source link metadata, not a copied article or a generic
retriever. External model unavailable (no configured key); no provider response was
fabricated. Product code-agent adapter and verified untrusted execution isolation
unavailable. Static help is not adaptive dialogue.

Optional WebMCP save support is feature-detected. Chromium 138 reported no
`document.modelContext.registerTool`; its live registration/action path is therefore
unverified and not part of the Phase 1 completion claim. Normal browser controls are
verified. There were no remaining failed or skipped required Phase 1 checks.

## Persistence, restart and recovery

SQLite schema migrations run in a short transaction, guarded by `PRAGMA user_version`.
Tables separate learner/session, attempt/command receipt, immutable checkpoints,
evidence capsules, frame reviews, assistance events and reward ledger. Evidence has
no course foreign key. Published snapshots, submitted answers, checkpoints, evidence
and aid rows are guarded against updates. This is forward-only; an older app refuses
a newer schema. Historical schema 3 aid representation remains interpretable.

Runtime state: `data/learning.sqlite3`. Unsaved device recovery is keyed by learner and
attempt in browser storage; this is supplementary to database saves. An HttpOnly,
SameSite=Strict cookie resolves the learner independently of command payload IDs.
A different/cleared browser profile creates a new learner. No account recovery,
production authentication, encrypted backup or multi-user hosted security is claimed.

Restart: Ctrl+C in the serving terminal, then `python manage.py serve` using the same
DB, port/hostname and browser profile. Before changing versions, stop the server and
copy the database; preserve it independently of source changes. Code recovery uses
the source checkpoint archive in a fresh directory. Do not overwrite learner data
when rolling back code. Full portable export/restore is deliberately Phase 2 work.

## Separate gates

Machine verification: passed for the implemented Phase 1 scope.
Human product acceptance: awaiting the learner's actual trial; no synthetic acceptance.
Activation: verified local preview only; no public or shared release.

Single next increment: use the learner's feedback to refine this same episode's
challenge, feedback, workspace or light practice recognition. Do not implement the
next phase until that trial and feedback have occurred.
