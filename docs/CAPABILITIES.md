# Capability risk register — Phase 0

**Current user contract — 13 September 2026:** Read [GAME-OPENING-PROGRESSION.md](GAME-OPENING-PROGRESSION.md) before implementation or review. The `16a655e` experience was user-rejected. Require a first-entry skippable 3D opening, tutorial with early success, gradual progression, optional non-destructive replay at every level, and no automatic opening for Level 2+ players. Remove the 2D gameplay fallback; preserve accessible HUD controls and honest 3D recovery. This amendment supersedes conflicting legacy guidance below.

Observed 2026-09-06. These are bounded observations, not production certification.

| Capability | Status | Evidence and limits |
|---|---|---|
| Python runtime | observed_working | Python 3.13.5; SQLite 3.49.1 bundled. |
| Browser runtime | observed_working | Installed Playwright 1.53.0 launched Chromium 138.0.7204.23. Application visit is a separate gate. |
| External structured model response | unavailable | OPENAI_API_KEY presence check returned false. No credential values inspected or printed. No live model response claimed. |
| Permitted source inspection | observed_working | Browser research tool opened the public AWS Builders Library article below and returned article text. No learner profile or private data sent. This is a tool capability, not an integrated app retriever. |
| Code-agent adapter in product | unavailable | No adapter configured or implemented. This development session does not establish a callable product adapter. |
| Isolation for untrusted code | unavailable | No verified isolated runner. Local trusted test execution and browser process are not an untrusted-code sandbox. |

Source: [Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/), Malcolm Featonby, AWS Builders Library. Relevant inspected sections: Retrying and side effects; Reducing client complexity; Late arriving requests. The app stores original task content and link metadata, not a copy of the article. Article availability in an external browser can change. No generic source pipeline is claimed.

Static episode work can proceed without a model. Phase 3 live generation and Phase 5 isolated code-change capabilities remain gated.

Phase 1 gate update: real application SQLite write/read, rollback and process-restart
checks passed; the browser suite passed all 10 scenarios. Observed database and
application-browser capabilities are `observed_working`. Optional WebMCP feature
presence returned false in the installed Chromium; its live path is unavailable.

## Opening/progression boundary — current amendment

The 3D opening/progression contract is required but not yet verified in a replacement build. Current capability claims must distinguish the engine and browser-tested commands from first-login routing, novice comprehension, world attachment and user acceptance. No automatic introductory sequence at Level 2+; explicit replay remains available without affecting the active attempt.
