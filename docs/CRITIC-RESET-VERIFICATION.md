# Critic reset verification — 15 September 2026

## Scope and location

Changes are on local branch `codex/critic-evidence-reset`, worktree `E:/Projects/VibeLearn/artifacts/critic-evidence-reset`, based on deployed `337db573d87c417aca42f55894a2c6e807df21ed`. No push, deployment, hosted configuration change, schema migration or learner-data rewrite occurred.

The actual game is unchanged: all 52 tracked files under app/ and web/ match the deployed-source export after newline normalization. This change adds review policy, an offline review-record checker, its tests, preserved review history, actual-play evidence and the user's LLM-series design. The LLM episode is not implemented. Historical weighted scores are preserved in docs/history/ rather than silently altered.

## Checks and outcomes

| Check | Result and scope |
|---|---|
| `python manage.py build` with `PYTHONUTF8=1` | Passed in the new worktree; Python compiled and browser JavaScript parsed. |
| `python -m unittest tests.test_critic_review -v` | All 10 tests passed: stale revision, missing/outside evidence, fractional/boolean scores, incomplete coverage, counterexamples, blockers, averaging and attempted user-acceptance claims. Synthetic test records are not play evidence. |
| `python manage.py test` | 140 tests ran: 134 passed, 6 PostgreSQL tests skipped because no local test database URL is configured. This includes the 10 new checker tests. |
| Initial new-worktree test attempt | The hosted browser test failed because the new worktree lacked pinned browser vendor files. Reused the baseline's pinned local assets; the full suite then passed. No assertion was weakened. An initial GLB copy created a file at the intended directory path; that local setup error was corrected, both imported model hashes match the baseline, and the hosted-browser test was rechecked with the model files present. |
| `python manage.py browser` | The earlier exact-runtime baseline run completed all 10 modules, including the full seven-signal journey, with no reported page errors. Runtime and browser-test sources are unchanged here; the long suite was not repeated for policy/tool-only changes. Its explicit product verdict remains critic_pending. |
| Actual browser play | All seven signals completed on disposable local state, including deliberate error/recovery, reload and replay. Manual inspection found usability defects despite automated checks passing. See PLAYTEST-20260915.md. |
| Checker on observed review record | Valid record; quality command exits 1 with needs_revision. Gate minimums: story 3, first touch 3, chapter 4, learning 4. Unchecked viewport/input/accessibility coverage is listed. No user acceptance is inferred. |
| Checker with `--validate-only` | Exit 0 verifies structure and existing evidence references only; the printed status remains needs_revision. This is not a quality pass. |
| Local document links and `git diff --check` | New active-document links resolve; no diff whitespace errors. |

The CLI record is tied to the old deployed game SHA, not a claim that the newly changed review-tool source itself was deployed. Applicable new candidate reviews must use their own exact SHA. The checker is a manual review command, not a CI/Render deployment integration or an autonomous critic/model service.

## Limits

No physical phone, child/young-adult study, new numeric human rating, delayed learning study or current hosted sign-in test was performed. Local PostgreSQL tests remain skipped. The only human product critic is the current user. Their explicit verdict is final. The validator can reject inconsistent evidence records but cannot inspect pixels, establish honesty, measure fun or accept the product.

## Reproduce

Use the locked dependencies already installed in the baseline export's `.venv`, or install requirements.lock and requirements-dev.txt into a new isolated environment. The checked runtime needs its pinned vendor/GLB assets; `python manage.py vendor` prepares them.

```
python -m unittest tests.test_critic_review -v
python tools/check_critic_review.py docs/reviews/2026-09-15-render-337db57.json --candidate 337db573d87c417aca42f55894a2c6e807df21ed
```

The second command is expected to exit 1 because this is a documented bad candidate. Do not change scores just to turn that command green.

## Recovery

No database migration or production rollback is needed. To abandon this local revision, switch back to the original checkout and retain the evidence for history; do not delete learner data or rewrite historical ratings. The original deployed-source local server can be restarted using the command in PLAYTEST-20260915.md. Future AI content requires new canonical learning identities; old retry evidence must not be relabeled.
