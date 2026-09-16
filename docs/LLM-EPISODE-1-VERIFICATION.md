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

## Final executed results

Final application commit: `31025192a4c01dee04fcd621c1e4a52887b4efcb`. `manage.py build` passed on these source bytes; the current manifest digest was compared with the recorded build and matched.

- `manage.py test`: **147 tests — 141 passed, 6 PostgreSQL skips**. Python/auth/storage/content code is unchanged between that run and the final presentation-only fixes.
- `manage.py browser`: **all 11 browser modules passed**, including the original ten modules and the new episode.
- `manage.py browser --group word-machine`: **passed again on the final frozen candidate**, after the last courier/marker framing adjustment.
- Direct browser play on fresh final-candidate SQLite state completed 20 moves, both mistakes/repairs and a submitted result. One immutable evidence record and one reward were present; outcome correct, independence assisted, mastery unknown. Reload restored completion.

[verification-summary.json](llm-playtest-20260915/verification-summary.json), [build manifest](llm-playtest-20260915/build-manifest.json), [application log](llm-playtest-20260915/application-tests.log), [integrated browser log](llm-playtest-20260915/integrated-browser.log), [final affected browser log](llm-playtest-20260915/final-browser.log), [episode report](llm-playtest-20260915/browser-report.json), [saved result](llm-playtest-20260915/final-saved-result.json).

The critic review remains **needs_revision**, with no human acceptance. Read [LLM-EPISODE-1-PLAYTEST.md](LLM-EPISODE-1-PLAYTEST.md) for concrete weaknesses and ratings. The final local preview uses a separate fresh database from both review runs. The live Render revision remains `337db573d87c417aca42f55894a2c6e807df21ed`.

## Current local preview

URL: http://127.0.0.1:8001/word-machine. The running preview uses `artifacts/word-machine-preview-3102519.sqlite3`, separate from all test/playtest databases. It was reopened at the untouched arrival scene after resetting the temporary browser viewport override.

To restart from this worktree, use the installed interpreter at `E:/Projects/VibeLearn/artifacts/render-local-337db57/.venv/Scripts/python.exe` with `manage.py serve --db artifacts/word-machine-preview-3102519.sqlite3 --port 8001`. Preserve that file to resume the user's preview; use a different explicitly disposable database for another test run. Do not point browser tests at this preview or the real learner database.

The strict critic checker validated the new record and returned exit **1** for readiness, as expected: `needs_revision`, gate minima 5 / 7 / 6 / 5, touch and enlarged-text coverage unverified. Its output is [critic-result.json](llm-playtest-20260915/critic-result.json). User acceptance remains undetermined by the tool.
