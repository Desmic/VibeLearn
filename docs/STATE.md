# Current checkpoint — Phase 1 expedition refinement, not accepted

## Latest user instruction — 8 September 2026

Continue research and implementation until a **genuinely separate game critic** rates the actual experience **>=9.0/10**, then return it to the user for final product review. The critic must judge it **as a game that even a kid or young adult would voluntarily engage with**, not as an educational website, engineering demo or checklist.

The controlling amendment is [GAME-ACCEPTANCE-9.md](GAME-ACCEPTANCE-9.md). It supersedes active-document references to 8/10, the earlier documentation-only stop and same-agent fallback acceptance. The eight rubric weights are unchanged. Both younger non-specialist and older teen/young-adult engagement lenses must pass; XP-hidden play, curiosity, agency, setbacks, meaningful consequences, an ending and genuine replay are mandatory observations. Do not invent age-group enjoyment evidence.

**Phase 1 is still not accepted.** Last established product judgments remain user **6.5/10** and later agent **7.5/10** for the older shopping campaign. Historical 8.8/9.1 reviews are not reusable. No score has been assigned to the new expedition by an independent agent, and the user has not reviewed it.

## Current implementation branch

- Repository: `Desmic/VibeLearn`.
- Isolated branch: `game/expedition-nine-gate`; draft PR **#2** targets `deploy/render-supabase`.
- First complete expedition implementation commit: `a5c0361450cb365ecd024262f8f742f3f0c9a017`.
- The live Render deployment branch is unchanged. No deployment or database migration is part of this candidate commit.
- This is Phase 1 gameplay refinement, not Phase 2 reuse or Phase 3 course generation. No external testers or paid provisioning were initiated.

The original shopping-agent activity and four-mission campaign retain their exact content and IDs. The new expedition has separate pinned activity/frame/family identities. Old clears do not certify new missions. Historical attempts remain readable, and the earlier UI is available at `/?legacy=1`.

## Implemented candidate — The Missing Delivery

The player helps Pip, a small courier stranded beside a broken bridge, get exactly one repair gear through a storm. A central illustrated valley replaces the new campaign's trace-and-answer screen. Actions send an order, retry a ticket, restart Pip, recover the journal ticket, advance the memory clock, inspect the order register and collect the gear. A wrong retry can visibly create two gears; a rehearsal rewind preserves the run's earlier move/help history.

The five-stop curve is:

1. Send an order; lose the reply; safely retry the remembered ticket.
2. Restart the courier; discover why a new worker ticket duplicates the order; recover durable intent.
3. Outlast the workshop's retry memory; consult the separate durable order register instead of retrying blindly.
4. Construct four courier rules and execute them against seven disruptions, including exact expiry, changed details and unavailable records. `Keep retrying forever` cannot clear this boss merely because old quiz counts were correct.
5. A working detour changes retention to two hours and loses the original request rather than just its reply. Authoritative absence with no in-flight request changes the safe action.

World truth (gears made) and the courier's knowledge are separately visible. Boss success repairs the bridge and opens the detour. Optional sound starts off; visible feedback and reduced-motion equivalents remain required. XP can be hidden without changing gameplay. All this is implemented candidate behavior, not a claim that the game is enjoyable enough for acceptance.

## Evidence and verification status

Local build succeeded. **54 non-hosted Python tests passed**, including 17 expedition tests: full routes, both failure mechanisms, all 16 complete policy combinations, unsafe indefinite retry, append-only saved moves, rehearsal recovery, real SQLite persistence, server locks, idempotent commands/rewards and learner isolation. Full hosted/PostgreSQL checks require dependencies provided by the project CI; local results alone do not establish that gate.

The candidate adds a real Chromium expedition journey alongside the unchanged legacy journey. It exercises saving/reload/actual process restart, a deliberate duplicate and rewind, unsafe/safe boss policies, the ending/detour, a dropped acknowledgement after a real commit, 320/390px touch sessions, actual 200% text enlargement, reduced motion and isolation. Its screenshots, trace and JSON report are CI artifacts. **At this documentation checkpoint, the first integrated CI/browser run is not yet claimed as passed.** Consult the subsequent verification record or the exact commit's run, not a historical green run.

Local Chromium navigation was blocked by an administrator policy. That local run is not game evidence; no policy bypass was attempted. CI is the separate normal project verification environment.

## Independent-critic blocker

A real `@codex` read-only game-critic request was posted to PR #2, explicitly requiring rendered gameplay, the two audience lenses, fixed weights, raw scores and honest refusal to certify from source alone.

The `chatgpt-codex-connector[bot]` replied that a **Codex cloud environment for this repository must be created** before it can run. See PR #2 comments `5588960891` (request) and `5588963309` (bot reply). No critic report was produced.

Current acceptance state: **`independent_critic_pending`**. Independent score: **null**. Creating a Codex environment for `Desmic/VibeLearn` is the prerequisite for that integration. A same-agent QA pass or a green test suite cannot substitute for the requested separate critic. Do not claim the target has been reached, and do not deploy as accepted.

## Learning and infrastructure invariants

Every command resolves the learner, uses a command ID and expected revision, and replays the pinned game model on the server. Saved moves cannot be rewritten. Simulated feedback is recorded as assistance before claiming a guided result; an empty pre-feedback checkpoint remains `not_observed`, not failed. Prose is ungraded. XP never determines correctness, mastery, freshness or competency unlocking. The policy boss validates only the declared bounded cases, not arbitrary real-world system safety.

The pilot remains Render Free + Supabase Free, using the private `vibelearn` schema, restricted PostgreSQL roles, learner-scoped RLS, verified Supabase identity, HTTPS and an explicit email allowlist. No schema, Auth settings, allowlist or production learner data was changed for this refinement. Read [HOSTING.md](HOSTING.md) for operating boundaries.

The exact prior checkpoint, infrastructure evidence, migration IDs, previous reviews and older phase decisions are preserved unchanged in [history/STATE-before-nine-20260908.md](history/STATE-before-nine-20260908.md). Its earlier acceptance thresholds and stop instruction are historical, not current.

## Course-generation inheritance

Future generated courses must inherit the learning, story, direct-play, progression, assistance, persistence and accessibility contracts in [COURSE-GENERATION-GAME-SYSTEM.md](COURSE-GENERATION-GAME-SYSTEM.md), **with the newer youth-engagement and separate >=9.0 gate in GAME-ACCEPTANCE-9.md overriding older thresholds**. A generated manifest cannot certify its own rendered game. Failed bounded repairs remain drafts. The checksummed `learning-os-design-package-v1.3/` stays unchanged.
