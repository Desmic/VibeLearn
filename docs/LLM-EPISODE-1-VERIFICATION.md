# Episode 1 verification and recovery

## Candidate and scope

The implementation lives on local branch `codex/critic-evidence-reset`, based on the Render deployment `337db573d87c417aca42f55894a2c6e807df21ed`. It adds `/word-machine` in the same Python application. This is a local Phase 1 prototype, with two authored context experiments and an eight-episode series outline. No production deploy, Supabase mutation, live model integration or Phase 2 work occurred.

Final candidate identity and executed results are appended below after the integrated checks. A build manifest records hashes of application, web and database files. It does not turn an internal review into user acceptance.

## Checks added

- New content/family/competency identities and preservation of retry families.
- Context changes output; copying the first clue fails in the changed case.
- Illegal moves, rewritten history, stale revisions and conflicting receipts fail without persisting.
- Receipt replay, restart, learner isolation, immutable submissions, reward deduplication and assisted/unknown-mastery semantics.
- Real HTTP + Chromium + temporary SQLite: opening wake action, runtime continuity, step/reload, optional scores, both incorrect/correct deliveries, movement/camera after save, portrait/desktop bounds, replay preservation, reduced motion, return to the earlier course, completion/resume, and an unrelated WorldSpec through the new adapter.
- Controlled missing-engine/model faults must show a reload path without sending gameplay commands. These are fault-injection tests, not claims about production reliability.
- Flask asset/auth-boundary test uses the existing explicitly simulated AuthFixture and real SQLite. It is not live Supabase authentication or PostgreSQL evidence.

## Problems found and repaired during verification

1. Output label covered the machine; moved it into clear space above the action tray.
2. Generated pieces did not appear in the visible next input; the server-derived context now includes them.
3. The parcel teleported ahead of the courier; it now travels as a child of the courier, with a separate received prop at successful arrival.
4. Feedback said a clue was missing even when a wrong clue was supplied; those explanations now differ.
5. Phone recenter restored desktop distance; the shared controls now validate and use the authored portrait distance.
6. The earlier game's saved inspection disabled persistent camera/movement buttons. Its command UI now leaves presentation controls available; the regression test actually operates them after save.
7. A submitted AI attempt could redirect every visit to the old course back to AI. Completed learners can now return to Relay Rescue.
8. A missing model could leave an incomplete scene playable; entry now waits for required assets and fails with explicit reload recovery.

The first browser test draft read the wrong diagnostics field; it was corrected to the existing `assetsLoaded`. This environment's Playwright wait predicate encountered the app's strict CSP; bounded read-only diagnostics polling replaced that test helper. The CSP was not weakened.

## Limits and recovery

- Local SQLite checks cannot establish live Supabase Auth or PostgreSQL connectivity. The six PostgreSQL tests require the existing disposable PostgreSQL CI service; no CI run has been triggered for this local change.
- Viewport emulation is not a physical Android/iPhone study. There is no independent novice observation, retention result, enjoyment measurement or human acceptance.
- Scores in the toy are authored illustrations, not model measurements. It selects the highest score and uses whole words; real LLM tokenization/training/sampling are future lessons.
- The existing one-active-draft rule remains. An unfinished Relay run must be completed before starting AI; no draft is overwritten.
- No database migration was needed. Older code cannot present a new AI attempt, so rollback must retain this code for those new attempts or use the prior application with its prior disposable database. Do not roll back by deleting evidence.
- The manual review database is separate from the learner database. Stop the matching loopback review server to end preview. The original checkout, original learner data and live Render deployment remain intact.
