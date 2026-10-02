# Docs audit: plans, research and feedback not yet acted on (3 Oct 2026)

Desmic asked (3 Oct) for a pass over every doc: research, feedback and plans that were never
acted on, done where it makes sense now, and any ambiguity flagged. About 120 docs were read
(repo `docs/`, `design/`, the Learning OS package 1.3, `AGENTS.md`, `CODEX*.md`, `README.md`,
the v3 operational architecture) and checked against the live game in
`experiments/bellweather-arcade`.

The big picture: most docs before 29 Sep describe the PlayCanvas Level 1 ("Relay Rescue",
message machine, Moon gate, limbo-prison opening, Astra critic gates). The arcade replaced
that in practice but no doc says so, so an agent that follows `AGENTS.md` ("read docs/STATE.md
first") is steered to the old game. That is the first decision below.

## Done in this pass

| Item | Source | What changed |
| --- | --- | --- |
| Development wording shown to players | PLAYTEST-20260917-LOCAL.md:166 | "End of the greybox" / "Stop 2 (greybox)" replaced with in-world lines |
| Reduce motion follows the phone's setting | GAME-PRESENTATION-GUIDE.md:359 | `prefers-reduced-motion` turns it on by default; the pause-menu box still overrides; camera shake respects it |
| A first try could count twice | audit finding | the event log is trimmed (was 500), so an old decision could look new; first tries now use a separate, untrimmed record (`save.decidedBefore`) |
| Evidence names the rules that judged it | GAME-RULES-SPEC.md:390 | every learning event carries `rules: id@version` |
| Help is recordable as help | learning-design.json:258, CODEX-FIRST-SLICE.md:54 | `station.helpedWith(decision)` marks the next judgement `assisted` (no Stop 1 hint uses it yet) |
| Type errors no longer hide | GENERATOR-IMPLEMENTATION-MAP.md:143 | `build.sh` says so loudly; `npm run check` (types + story check + asset budgets), `check:parity`, `check:play` |
| Generator version pinned with the seed | GAME-GENERATION-OPERATIONS.md:123 | generated island specs carry `generator: {name, version}` |
| Provenance snapshot | v3 architecture:10; REVIEW-20260926:127 | kit file hash recorded; `public/PROVENANCE-authored.json` lists every Blender-made model with its script and hash |
| Kid test as two separate questions | USER-REVIEW-20260917.md:55 | AI play-testers must answer "would they stop and look?" and "would they understand and want to keep playing?" (`{type:'verdict'}`) |
| Words call out as Zip walks by | GAME-REDESIGN-ECHO.md:137 | first time within 9 m: a soft chime and a glint |
| The attack as a major event the town reacts to | USER-REVIEW:281; EXPERIENCE-QUALITY-SYSTEM.md:98; WORLD-ATMOSPHERE:167 | townsfolk stop, turn and stare up at the ship; thunder; ground shake on the bolt; the gust rings the bells and swings the lantern; afterwards people talk about the attack (8 new lines, no cheerful waves); Mira's sun hat stays where she was taken |
| Stop 1 learning design | LEARNING-DESIGN-GATE.md:56 | `design/stop1-learning-design.json` (Stop 2 format), written from what is built, with its known gaps; for review |

## Open, worth doing soon (in my suggested order)

1. **Gate, relay and loom as part of the world (Echo & Engine).** All three are still panel puzzles. Core direction; large. (GAME-REDESIGN-ECHO.md:79; GAME-PRESENTATION-GUIDE.md:195)
2. **Music and ambience.** Only synthesized blips today: no wind, no town murmur, no motif for the Warden to interrupt, no separate music volume. Cheapest big step toward "top game". (WORLD-ATMOSPHERE-AND-AUDIO.md:73; STORY-INSPIRATION:160)
3. **Server learning record** (outbox, commit before feedback, offline answers not first-try, station action logs persisted). Blocked on the identity/hosting decision. (SAVE-AND-EVIDENCE.md)
4. **Jump (then climb or glide) and things that react to Zip.** The biggest gap to a BotW feel; it changes level layout, so decide early. (USER-FEEDBACK:51; ART-DIRECTION-REFERENCE:47)
5. **Stronger relay transfer and a "newest note is wrong" case.** Today the relay's answer is printed on its card. (learning-design.json:358; NEXT-TEACHING-DESIGN:45)
6. **Stop 3 learning design before any Stop 3 code**, with a fixed order for Stops 3–7 (see decision 6). Study llm-viz / transformer-explainer for the attention stop. (REUSE-RESEARCH:106)
7. **Flight lanes as data, one data-driven puzzle console, puzzle lines out of puzzle code.** What stands between "new station" and "no new UI code". (GENERATOR-IMPLEMENTATION-MAP:168-172)
8. **A real beginner play-test** (two or three people, then a revisit days later). Every test so far is AI or you. (20260928-story-learning-core-review.md:204)

## Later

Replay a stop without touching the save; a "what I learned" journal; text-size option and a light UI-coverage check; cutscenes as data; rules reachability check; style family as data; second-kit asset resolver; spaced recall at the start of later stops; narrator voice (you deferred it); learner "improve this" button; topic intake / any-subject generation (after a second course proves the pieces reuse).

## Not worth doing now

Terminal PM integration, the collaborative-evolution change system, XP and weekly goals (stars cover rewards; keep "rewards are not mastery"), HY-World, the research-agent stage.

## Decisions (Desmic, 3 Oct 2026)

1. The current game (`experiments/bellweather-arcade`) is the official direction. Done: `AGENTS.md` rewritten around it; `README.md` and `docs/STATE.md` point to it; 42 older docs carry a "Historical" or "Partly historical" note (nothing deleted).
2. Commit and push all changes: committed on main (line endings normalised; downloaded third-party sources and temporary outputs left out of git). The push has to run from Desmic's own terminal: the session's network to github.com is blocked.
3. Art direction is the look of the starting area; enhance it from feedback. `ART-DIRECTION-REFERENCE-20260928.md` is marked historical.
4. Audience: young adults and adults, 18+ for now. Identity (anonymous-first or accounts) and where the server lives are still open; 18+ removes the under-18 data question.
5. Order of Stops 3–7: Claude's call on the vision. Decided: Warmth dial (probability, sampling) → Echo memory (training, then instruction tuning) → Focus lens (attention, representations) → Truth lantern (hallucination; grounding, retrieval, tools) → final duel. Reasoning in `docs/GAME-REDESIGN-ECHO.md`.
6. The 17 Sep tutorial request was for the old game; the current progression (opening and tutorial → Stop 1 → …) stands.
7. Keep all the jokes. Dialogue: Claude's call for a top game (story lines now advance with a tap anywhere; real choices stay buttons). The old review gates existed to make a system that produces games like this quickly with reliable quality; that goal stands, carried by the automated checks, AI play-testers (run however suits agents) and the player's/Desmic's verdict.
8. Kit licence checked: the Stylized Nature MegaKit (Standard) and the Universal Animation Library (Standard) both ship a CC0 1.0 licence file; copies are in `experiments/bellweather-arcade/public/kits/LICENSES/` with the download hashes.
9. Reminders for Desmic: the Galaxy F15 play-test, and deleting `Claude outputs/_review/docs.tgz` (a temporary copy of the docs made for this audit).

## Questions that were asked (answered above)

1. **Is the arcade (three.js) canonical, and is PlayCanvas retired?** `AGENTS.md:28`, `CODEX.md:121` and `README.md:43` tell agents three.js is legacy and PlayCanvas is the engine; `docs/STATE.md` (30 Sep) still points at the PlayCanvas candidate. If yes, I'd add a short "current state" banner to AGENTS.md / STATE.md and mark the older docs historical (no deletions).
2. **Version control.** The arcade's work since 29 Sep (16 changed tracked files, 40 new ones) is not in git; the last commit is "Make art checkpoint reproducible…" (29 Sep). Separately, about 500 files show as modified only because of line endings (working copy CRLF, repository LF). OK to commit the arcade, normalising line endings so the other files don't churn?
3. **Art direction.** ART-DIRECTION-REFERENCE-20260928 asks for "far-future technology, not medieval" with graphic, Spider-Verse-like forms; the game is a warm painted festival town (bells, lanterns, skiffs) closer to BotW. Which is canonical? I'd retire the reference doc if the painted look is the direction.
4. **Story and opening docs.** LLM-RESCUE-STORY, GAME-OPENING-PROGRESSION and others still say happy town → limbo → prison → engine removed, and an 8-episode table. The game is attack → Mira taken → spark chase → skiff. Mark them historical?
5. **Separate tutorial vs onboarding inside Level 1.** Your 17 Sep review asked for a distinct tutorial/prologue before Level 1; the current game teaches movement inside Level 1 (BotW Great Plateau style). Is the merged version fine?
6. **Order of Stops 3–7.** Echo plan: Splitter (done) → Focus/attention → Warmth/temperature → Echo memory/training → Truth lantern/hallucination → duel. The 28 Sep story-learning review proposed probability/sampling earlier and training before attention; the original arc also had representations, instruction tuning and tools/retrieval, which are now gone. Which order, and are those topics dropped?
7. **Audience, identity and hosting** (one decision). Kids or adults? (Children change accounts and data rules; the Learning OS package assumed adults.) Anonymous-first or accounts? Where does the server live (Render + Supabase pilot, which rejects anonymous users) given the game ships as a claude.ai artifact that cannot reach it?
8. **The name "Zip".** Your 17 Sep review asked for a memorable, pop-culture-flavoured name instead of a placeholder. Keep Zip, or rename now while it is cheap?
9. **Fourth-wall jokes** ("Is this a simulation?", "is this Mario?", "like a good NPC"). They match your pop-culture request but cut against "belongs to the world". Keep, trim, or keep only for Zip's private thoughts?
10. **Dialogue style.** The presentation guide bans Next/Continue on story lines; Zelda uses press-to-advance. Today Mira's lines use buttons. Keep, or tap-anywhere plus auto-advance?
11. **Old review gates.** Astra sealed reviews, schema-v2 critic records and "all scores ≥ 9" are still written as release authority. Retired in favour of AI play-tests, the automated checks and your verdict?
12. **Playwright.** You said play-testing should use a real browser, not Playwright. The automated checks and AI play-testers run in headless Playwright; human-style feel checks use your devices. Is that split right?
13. **Quaternius licence.** The meadow kit is recorded as CC0 (Standard tier). The licence page has to be checked again and a copy saved; I couldn't open it from here.

## Loose ends noticed

`src/gate-puzzle.ts` is dead code (nothing imports it). The Learning OS package says 1.3 "supersedes all earlier build orders" while the root plan calls it historical; decision 1 would settle which of its invariants (privacy, evidence labels) still bind.
