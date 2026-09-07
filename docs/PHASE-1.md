# First slice completion report — 6 September 2026

## Outcome and stopping point

Phase 0 → 1A → 1B → 1C implemented in verified increments. One usable original
practice episode: start in LEARN/PAIR/BUILD, predict a payment retry trace, write a
diagnosis, save/resume, request progressive hints, submit, inspect evidence and
pre-help checkpoints, see a future frame review need and bounded practice XP.
Stop at the Phase 1 human checkpoint; no Phase 2+ subsystem was implemented.

The original local Phase 1 checkpoint remains historically valid. Since that report,
a private hosted pilot has also been implemented on Render Free + Supabase Free from
`deploy/render-supabase`. Hosted infrastructure and CI are now machine-verified; the
remaining Phase 1 product gate is a real learner sign-in and trial, not more subsystem
implementation.

The current directory originally contained only the design handoff. No Git repository,
base commit or candidate commit existed at that time; none was invented. Supplied
design files remain in place. Version 0.1.0, local schema 5. Candidate/source SHA-256
for the historical local checkpoint:

`3d17fdd657ca522f38fd8a733a56a7ddca382513b39e04b3266a39e9afb56786`

`artifacts/build-manifest.json` and `artifacts/served-manifest.json` matched at the
local checkpoint. A source-only checkpoint was retained as
`artifacts/phase1-source-checkpoint.zip`, with its archive SHA-256 in
`artifacts/phase1-source-checkpoint.sha256`.

## Observed local verification

Environment: Windows PowerShell; Python 3.13.5; SQLite 3.49.1; Node 22.17.0;
Playwright 1.53.0; Chromium 138.0.7204.23. All commands ran in the selected project.

| Gate | Actual command / interaction | Observed result |
|---|---|---|
| Reproducible build | `python manage.py build` | Passed Python compilation and JS syntax; build manifest retained |
| Core suite | `python manage.py test` | 31 unit/integration tests passed, none skipped at the original checkpoint |
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

Raw local records: `artifacts/build.log`, `artifacts/tests.log`,
`artifacts/browser-report.json`. Screenshots: `artifacts/phase0-browser.png`,
`artifacts/phase1a-browser.png`, `artifacts/phase1a-mobile.png`,
`artifacts/phase1b-recap.png`, `artifacts/phase1-workspace.png`,
`artifacts/phase1-mobile.png`, `artifacts/phase1-recap.png`.

## Hosted Phase 1 extension — 7 September 2026

The hosted pilot preserves the Phase 1 learning behavior while replacing local-only
identity/storage boundaries with Supabase Auth and restricted PostgreSQL persistence.
This extension does not add Phase 2 capabilities.

Machine-verified hosted state:

- Supabase migration `20260907073952_vibelearn_hosted_schema` is applied.
- `vibelearn` is a private PostgreSQL schema; `anon` and `authenticated` have no
  schema USAGE or application-table grants.
- The runtime uses `vibelearn_login` and switches transactions to restricted
  `vibelearn_app`; learner tables have forced learner-scoped RLS.
- Live SQL boundary verification passed learner isolation, composite ownership,
  immutable submissions/history, reward deduplication, JSON lookup, and denied
  unscoped reads.
- Render Free is live at `https://vibelearn-4xws.onrender.com` and successfully
  serves the application, configuration, static assets, and `/api/health` while
  connected to PostgreSQL.
- GitHub Actions `Verify hosted pilot` has passed build, Python tests, disposable
  PostgreSQL application tests, Chromium installation, and browser scenarios on the
  hosted branch.
- Supabase Auth has one confirmed pilot account. Password recovery is implemented;
  the reset request succeeded and the recovery email was delivered with the live
  Render origin as redirect target.

Not yet claimed:

- successful real password sign-in by the learner;
- real hosted save → reload persistence with that account;
- persistence across a real Render restart/redeploy;
- real hosted completion/submission by the learner;
- hosted logout/revocation acceptance;
- second-authorized-account isolation acceptance;
- human product acceptance or independent educational/content review.

The current blocker is user-bound, not an unresolved backend exception: the last
provider-classified password login was `invalid_credentials`. The learner must open
the delivered recovery email, choose a new password in the hosted UI, and sign in.
Recovery tokens must not be copied into source, docs, logs, issues, or chat.

## Phase 1 completion gate

Phase 1 machine verification is complete for both the original local slice and the
hosted implementation. Phase 1 product acceptance is complete only after the learner
performs this real hosted journey:

1. Complete password recovery and sign in successfully.
2. Start the existing Phase 1 episode.
3. Save a real draft, reload, and verify the same draft resumes from PostgreSQL.
4. Restart/redeploy Render without changing PostgreSQL; sign back in and verify the
   same learner state resumes.
5. Use the episode normally, including help/mode/source behavior as desired, then
   submit and inspect trace feedback, immutable checkpoints, evidence, future review
   need, and the bounded first-family practice XP reward.
6. Sign out and verify protected state is no longer accessible with the revoked local
   application session.
7. Before expanding beyond a one-person pilot, authorize a second account and verify
   it cannot read or mutate the first learner's state.
8. Record the learner's actual feedback on challenge, feedback quality, workspace,
   and restrained game elements. Do not substitute automated tests for this judgment.

Only after steps 1–8 should this hosted-pilot PR leave draft and the project consider
the next product increment. The next increment should first respond to learner
feedback on this same episode; Phase 2 remains deliberately gated.

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

Optional WebMCP save support is feature-detected. Its optional live browser-tool path
is not required for the Phase 1 completion claim; normal browser controls are the
verified interaction path.

## Persistence, restart and recovery

Local SQLite schema migrations run in a short transaction, guarded by
`PRAGMA user_version`. Tables separate learner/session, attempt/command receipt,
immutable checkpoints, evidence capsules, frame reviews, assistance events and reward
ledger. Published snapshots, submitted answers, checkpoints, evidence and aid rows are
guarded against updates.

Hosted PostgreSQL uses the separate private `vibelearn` schema, explicit restricted
roles, forced learner RLS, ownership-preserving composite foreign keys, immutable
history triggers, and application-session rows. Local anonymous SQLite data is not
automatically assigned to hosted identities.

Device recovery remains supplementary browser storage. For local mode, the HttpOnly
cookie resolves a local learner. For hosted mode, Supabase Auth verifies the account
and the application keeps a separate hashed, revocable session record.

Schema changes are forward-only. Do not use destructive table deletion or migration
history deletion as rollback. Keep known-compatible code revisions and independent
data backups.

## Separate gates

Machine verification: passed for the implemented Phase 1 local and hosted code paths.
Human product acceptance: awaiting the learner's actual hosted trial; no synthetic acceptance.
Activation: private hosted pilot is live; broader/public multi-user activation is not claimed.

Single next product increment after acceptance: use the learner's feedback to refine
this same episode's challenge, feedback, workspace or light practice recognition.
Do not implement Phase 2 merely because infrastructure is live.
