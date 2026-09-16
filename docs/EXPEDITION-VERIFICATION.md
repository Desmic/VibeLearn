# Expedition candidate verification — 8 September 2026

**Engineering verification passed; independent game acceptance pending.** This is an implementation-agent evidence record, not a separate critic report, youth playtest or >=9/10 certification.

## Candidate and exact runs

Latest verified runtime: `016f5252a9e050a6af53aa42472f62cbcd8e3a99` on `game/expedition-nine-gate`, draft PR #2. The live deployment is unchanged.

| Run | Candidate | Observed result |
|---|---|---|
| 168 / `34257039102` | `a5c0361450cb365ecd024262f8f742f3f0c9a017` | Build, 76 Python tests and original browser journey passed. New expedition completed its game path but failed horizontal overflow at 390px with 200% root text. Not a passing integrated gate. |
| 169 / `34258076004` | `09ac22c26c526913b68b8d30266e58249609e838` | Full build/tests/both browser journeys passed after content-sized HUD, wrapping and text reflow fixes. Screenshot review still found a desktop utility dock overlapping the central action row. |
| 170 / `34258933808` | `016f5252a9e050a6af53aa42472f62cbcd8e3a99` | Full build/tests/both browser journeys passed again. Desktop dock moved away from main actions; companion marker scales with text; redundant mobile scene captions no longer collide with state. Downloaded screenshots confirm the desktop action row is uncovered. |

Run 170 uses GitHub's synthetic PR merge `e1f95d84d9b778264c0df380f2bd90c12044346a`, containing the stated candidate with its unchanged deployment-branch base. Artifact names include this merge SHA; it is not a different feature candidate.

## Executed evidence

Build: Python compiled and every browser JavaScript file syntax-checked.

Python: **76 tests passed**, including 17 new expedition model/persistence tests and the existing campaign, assessment, HTTP, hosted-auth and PostgreSQL boundary tests. The new tests execute all 16 complete boss-policy combinations: only the safe policy passes all seven pinned cases. Indefinite retry is rejected even if the response includes correct old quiz counts and 'Just retry forever.' prose.

Chromium **138.0.7204.23** ran the original campaign and the new expedition against real HTTP server processes and disposable local databases. The original journey remains intact, including old story/evidence semantics and progression. The expedition report records:

- Keyboard entry and a direct send action changing world state; gear truth differs from the courier's uncertain knowledge. XP is hidden without disabling play.
- Saved moves survive reload and an actual server-process replacement. Sequential clears unlock the next stop.
- New worker identity causes a visible duplicate; rewind permits recovery while retaining earlier history.
- The retry-forever boss policy fails four counterexamples; the safe policy passes seven. Success repairs the bridge and unlocks the detour.
- The detour has two-hour retention and an actually absent initial order. One deliberately dropped response occurs **after a real server commit**; retrying Save does not duplicate the move.
- Isolated touch sessions at 390px and 320px; reduced motion; actual doubled computed feedback text at 200%; no horizontal overflow. Retry and collection remain operable after text enlargement.
- **No JavaScript page errors.** The final overflow diagnostic is an empty list.

No successful API mocks were used to claim a live journey. The browser game flow is on disposable SQLite, not production Supabase. Existing hosted/PostgreSQL tests run separately in CI; this is not a new authenticated live-site playthrough.

## Preserved artifacts

Run 170 source artifact: **`10069043235`**, `review-source-e1f95d84d9b778264c0df380f2bd90c12044346a` (tracked Git source only).

Run 170 rendered/browser evidence: **`10069085312`**, `game-review-evidence-e1f95d84d9b778264c0df380f2bd90c12044346a`. Includes `expedition-browser-report.json`, `expedition-overflow-diagnostic.json`, `expedition-browser-trace.zip`, and screenshots of the map, first move, setback, unsafe policy, ending, 320/390px play and 200% text. Also retains the original-campaign evidence. Artifacts have short retention; download for review rather than assuming permanent availability.

Local build and 54 non-hosted tests also passed. Local browser navigation was blocked by administrator policy, so that attempt was not counted as gameplay evidence and no browser-policy bypass was attempted. The normal project CI supplied the actual rendered verification.

## Game-design observations still requiring criticism

A reliable simulation is not automatically an engaging game. The implementation-agent screenshot/source review still flags these issues for the separate critic:

- The boss uses rule-selection panels and text-heavy counterexample results; it may still feel too much like a structured exercise. Its field order currently follows serialized keys rather than the numbered teaching order.
- The ending changes the world but still exposes a substantial completed-rule/results section before the next-route payoff. Its emotional pacing may need a stronger edit.
- Payload changes and unavailable-register uncertainty have less hands-on preparation than identity and retention. Review whether their introduction adequately prepares a younger non-specialist for the boss.
- Exploration remains tightly authored. The fact that a real detour exists does not establish that either audience would choose another run.

These are open observations, not independently scored verdicts. No claim of 'no game-design blockers' or >=9 is made. A proposed local JavaScript polish for rule order/ending presentation did not publish successfully and is not included in this verified candidate; do not claim those changes are present.

## Acceptance

The real GitHub Codex request returned a missing-repository-environment prerequisite, not a critic report. Status remains **`independent_critic_pending`**, score **null**. The setup prerequisite is a Codex cloud environment for `Desmic/VibeLearn`; the full brief is CRITIC-HANDOFF.md. After that prerequisite, an actual independent playthrough and likely further revisions remain necessary. The user's final review has not occurred, and no external testing is authorized.
