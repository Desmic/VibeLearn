# Current checkpoint — playable expedition candidate; independent critic pending

Updated 8 September 2026. **Phase 1 is not accepted. No >=9/10 verdict is claimed.**

## Active user decision

Continue research and implementation toward a **genuinely separate critic's unrounded >=9.0/10 game-experience score**, followed by the user's final product review. Judge the actual game as something **even a kid or young adult would voluntarily engage with**, not as an educational website or engineering checklist.

[GAME-ACCEPTANCE-9.md](GAME-ACCEPTANCE-9.md) is the controlling amendment. It supersedes older 8/10 thresholds, same-agent fallback acceptance and the earlier stop-after-documentation instruction. Preserve the eight rubric weights. Require younger non-specialist and older teen/young-adult engagement lenses, XP-hidden play, curiosity, meaningful agency, understandable setbacks/recovery, an earned ending and working replay. An agent's prediction is not evidence of actual child enjoyment.

The established older-build judgments remain user **6.5/10** and later agent **7.5/10**. Historical 8.8/9.1 reviews are superseded. The new candidate's independent score is **null**, not an inferred improvement.

## Published candidate and verification

Repository `Desmic/VibeLearn`, branch `game/expedition-nine-gate`, **draft PR #2** into `deploy/render-supabase`.

Latest verified runtime commit: **`016f5252a9e050a6af53aa42472f62cbcd8e3a99`**. GitHub Actions **run 170 (`34258933808`) passed**: build, all 76 Python/hosted/PostgreSQL tests and both original-campaign and expedition Chromium journeys. Evidence was downloaded and inspected. Subsequent checkpoint-documentation changes do not change that runtime.

The first integrated expedition run found mobile horizontal overflow at 200% text. It was fixed through wrapping/content-sized layout, not clipping or weakened tests. Run 169 passed; screenshot review then found desktop tool-dock overlap, fixed and reverified in run 170. See [EXPEDITION-VERIFICATION.md](EXPEDITION-VERIFICATION.md) for exact evidence, coverage limits and outstanding game-design observations.

## Implemented reference — The Missing Delivery

Pip needs one gear to repair a broken bridge. The player acts in an illustrated valley: send an order, retry a ticket, restart Pip, recover the journal ticket, wait beyond workshop memory, inspect the separate order register and collect the gear. A wrong retry can visibly produce two gears; rewind restarts the rehearsal without erasing earlier move/help history.

Five stops teach retained same-ticket retries, durable intent through restart, retention/reconciliation, a constructed four-rule boss executed against seven disruptions, and a real two-hour-memory detour where the original request never arrived. The safe boss result repairs the bridge. World truth and what Pip knows are separate. Optional sound starts off; XP can be hidden without affecting play.

The old activity and Shopping Agent campaign retain their IDs/content. The expedition has separate pinned activity/frame/family identities; old clears cannot certify new missions. Historical attempts remain readable through the original experience at `/?legacy=1`.

## Independent critic — actual blocker

A real read-only `@codex` game-critic request was posted to PR #2. The `chatgpt-codex-connector[bot]` replied: **a Codex cloud environment for this repository must be created before it can run**. Request comment `5588960891`; bot reply `5588963309`.

Status: **`independent_critic_pending`**. No report or independent score was produced. A green test suite and the builder's visual QA do not substitute. [CRITIC-HANDOFF.md](CRITIC-HANDOFF.md) provides the current-candidate brief; the earlier bot request referenced the historical baseline.

The missing Codex environment is a review setup prerequisite, not a claim that the game would pass once it exists. Further gameplay revisions may be required by that critic. The user reviews the game only after the independent >=9 gate, and can still reject it.

## Boundaries

The live Render branch/deployment and Supabase schema, Auth settings, allowlist and learner data were not changed. No paid resources, external testers, Phase 2 reuse, Phase 3 generator implementation or model integration were opened. The candidate remains draft and unmerged.

Commands resolve the learner, command ID and expected revision; the server replays the pinned game. Saved moves are append-only, submitted evidence immutable, observed simulation feedback assisted and earlier missing evidence not failure. XP never determines correctness or mastery. The policy boss checks bounded declared cases, not arbitrary real-world safety; free prose remains ungraded.

Future generated courses inherit the detailed package contract in [COURSE-GENERATION-GAME-SYSTEM.md](COURSE-GENERATION-GAME-SYSTEM.md), with GAME-ACCEPTANCE-9.md overriding older thresholds and adding voluntary youth engagement plus genuine separate criticism. Failed bounded repairs remain drafts. The checksummed historical design package stays unchanged.

Original checkpoint, infrastructure evidence and earlier decisions are preserved verbatim in [history/STATE-before-nine-20260908.md](history/STATE-before-nine-20260908.md). Its old threshold and stop instruction are historical, not current. Read [HOSTING.md](HOSTING.md) before any deployment.
