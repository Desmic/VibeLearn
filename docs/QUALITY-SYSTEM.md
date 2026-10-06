# The quality system: how VibeLearn knows a game is good (4 Oct 2026)

This is how VibeLearn checks a game, for people and for agents. It covers:

- what was kept from the old critic system;
- the pieces we have now;
- how an agent or orchestrator plugs in.

It applies to every game the system makes. Bellweather: The First Words is the flagship and
the first to use it.

## What the old critic system taught

From 14 to 26 Sep the earlier game was reviewed by a critic pipeline. It had:

- six independent lanes and 0–10 scores;
- sealed evidence capsules, harness receipts and schema-v2 records;
- fresh-context "Astra" reviewers;
- a quality-failure corpus.

The docs are still in the repo (`CRITIC-POLICY.md`, `EXPERIENCE-QUALITY-SYSTEM.md`,
`CRITIC-HANDOFF.md`, `ORCHESTRATOR-ADAPTER-CONTRACT.md`, `quality-failure-corpus.json`).

**Kept, because it was right:**

| Lesson | Where it lives now |
| --- | --- |
| **Cold before intent.** A reviewer who knows the design fills in what the game failed to show. Record what a newcomer perceived *before* they read the intent. | `playserver.mjs` keeps the intent away from the tester entirely; only the interviewer sees it, and only reveals it at the end. `intent.mjs` generates the intent and its items from the game's data. |
| **Blind testers (added 5 Oct, Desmic).** Don't tell a tester what to test: a language model is steered by its context, so a primed tester finds what it was told to find. | The tester's brief and personas are fixed and linted (`blindcheck.mjs`); questions come after play, open first; the server refuses a pre-reveal question with a word the tester hasn't met; findings are graded by how they came out. |
| **Lanes are never averaged.** A blocker in one lane blocks, whatever the others say. | `quality.mjs`: a fail in any lane means not ready. There are no scores. |
| **Unresolved is not pass.** Missing evidence is "unknown", not "fine". | Every result is pass / fail / warn / unresolved. A lane with no evidence is unresolved and names the check that would resolve it. |
| **Match evidence to the claim.** Motion needs motion, sound needs listening, feel needs a person. | Each lane says who can judge it (`checks.json`). `feel` stays unresolved until a person's verdict is recorded. |
| **Bind every verdict to one exact build.** A verdict never carries over to a changed build. | `out/build.json` (`b-…`). Reports live under `quality/<build>/`. The pause menu shows the build, so a phone verdict names it. |
| **Findings have a shape:** claim → expected → evidence → how to reproduce. | `tools/lib/report.mjs` (`vibelearn.report.v1`). |
| **Prevent, don't just detect.** Turn each human finding into a general rule and a system change, with no game names in the rule. Reviewer-only prevention doesn't count. | `quality/escapes.json`, the successor of the failure corpus, validated by `kitcheck.mjs`. |
| **Anti-overfitting.** Prove a system piece on something that isn't the proof game. | The kit boundary is enforced (`kitcheck.mjs`). `fixtures/night-market` (fractions, different world, names, keys, puzzle) runs through the data checks on every `npm run check`. |
| **VibeLearn owns the checks; an orchestrator schedules them.** It finds out what is available by asking. It never claims VibeLearn's acceptance. | `tools/checks.json` is the capability list. `quality.json` says "ready for a person's review", never "accepted", until a person has passed `feel`. |
| **The user's verdict is final.** | `verdict.mjs`: the person lanes need it. It overrides nothing else (a failing check still fails). |

**Dropped, because it cost more than it caught:**

- **Numeric scores.** They still produced false 9/10s.
- **Sealed capsules, harness receipts, SHA-256 attestation.** Weeks of ceremony, very few verdicts.
- **Reviewers fed only stills.** They mostly came back "unresolved".

The old system checked *who was allowed to review*. This one checks *what the game did*:

- tools play the real game;
- the AI player sees only the screen;
- a person judges feel on a real device.

## The pieces

| Piece | File | What it is |
| --- | --- | --- |
| **Game manifest** | `src/game.ts` (type: `src/kit/manifest.ts`) | What a game is made of: stations, rules, progress, stories, sound, cast, storage keys, input modes, devices, its own test pieces, and the names of its world. Every tool reads this, never one game's names. |
| **Test contract** | `docs/TEST-CONTRACT.md` | Hooks, selectors and `data-action` tags every game exposes. |
| **Kit boundary** | `tools/kitcheck.mjs` | Fails if the kit imports game code, if system code names the game's world, if a tool hasn't declared its scope, or if an escape isn't generalized. |
| **Report format** | `tools/lib/report.mjs` | `vibelearn.report.v1`. Every check, AI play-test and person's verdict writes one. |
| **Check registry** | `tools/checks.json` | Every check with its lanes, scope (system / game / mixed), cost, needs, what it proves and which files call for it. |
| **What to run** | `tools/affected.mjs` | Changed files → the checks to run. |
| **Quality gate** | `tools/quality.mjs` | One verdict per lane for this build. |
| **Person's verdict** | `tools/verdict.mjs` | Desmic's (or any player's) verdict on a build, per lane. |
| **Intent** | `tools/intent.mjs` | What the game means to communicate, from its data. |
| **Escapes** | `quality/escapes.json` | What people found that the checks missed, and what catches it now. |
| **Second game (fixture)** | `fixtures/night-market/game.mjs` | A different game as data only. Manifest, story, station, progress and rules proofs and intent run on it (`npm run check:fixture`, part of `npm run check`). A new system check must pass here too. |

### The lanes

The lanes are defined in `checks.json`:

- `learning`, `flow`, `world`, `pacing`, `timing`, `robustness`, `performance`, `sound`,
  `content`, `system`;
- `comprehension`: blind AI players and an interviewer, then people;
- `feel`: a person on a real device only. A game's manifest (`intent.experience`) lists what a
  newcomer should feel. The blind interviewer marks each item with the tester's words. Those
  marks go to `feel` as evidence for a person to confirm, never as a pass. Only "felt the
  opposite" warns.

The play server also measures the play itself, from the log rather than from what the tester
said:

- steps, steps per goal, and when progress first came;
- stalls and repeated taps;
- camera turns the player didn't make.

These are reported beside the interview, so "it was intuitive" can be checked against the
numbers.

## The loop

The same loop serves a person, a co-creating agent, or a chat where a player makes a game.

1. **Change something.** Data first (worlds, story, rules), kit code if it's reusable, game
   code last.
2. **Find what to run.** `node tools/affected.mjs` lists the checks the changed files call
   for, with their cost.
3. **Build and run the fast checks.**
   - `bash tools/build.sh && npm run check`: types, story, rules, kit boundary, assets. Seconds.
   - Then the slow ones it named: `node tools/playthrough.mjs …`. One game at a time.
4. **Read the gate.** `node tools/quality.mjs` gives per-lane status for this build.
   - Every fail has its claim, its detail and how to reproduce it.
   - Unresolved lanes say what would resolve them.
5. **AI play-test** when the change touches what a player sees:
   - `tools/playserver.mjs`: a blind tester plays with only the fixed brief;
   - a separate interviewer questions it (recall, probe, moments, predict, ratings, then the reveal);
   - see `tools/AI-PLAYTEST.md`.
6. **Person.** When the tool lanes pass, the build is "ready for a person's review".
   - Desmic plays it on the F15 and the laptop.
   - The pause menu shows the build id; his verdict is recorded with `verdict.mjs`.
7. **Learn.** Anything he found that the checks passed becomes an escape in
   `quality/escapes.json`:
   - a general rule with no game names;
   - a kit, data, contract or check change;
   - the check that now catches it.

   That is "learn as we go", written down where the next agent will find it.

### For an orchestrator or agent

The surface is files and commands, nothing hidden:

- **Capabilities:** `tools/checks.json`. What exists, its cost, what it proves and what it
  needs (a browser, a device, a person).
- **The game:** `src/game.ts`. A new game is "done" when its manifest validates, `kitcheck`
  passes and it keeps the test contract.
- **Results:** `quality/<build>/*.json` (reports) and `quality/<build>/quality.json` (the
  gate). Machine-readable, bound to the build.
- **Authority:**
  - an agent can make a build "ready for a person's review";
  - only a person's verdict makes `accepted: true`;
  - an orchestrator saying "completed" is not acceptance.

## Still game-specific (the honest gaps)

`kitcheck.mjs` lists the tools that aren't system yet:

- **`flowcheck`:** a scripted journey with this game's positions and labels.
- **`breaker` (mixed):** generic probes plus segments with this game's places.
- **`timing` (mixed):** scenes named in code until cutscenes are data.
- **`camwalk`:** the opening routes.
- **`voice-lines` (mixed):** some lines are still written in game code.
- **The speedrun's story route** between stations (in `tools/games/first-words.mjs`):
  generic once story beats declare their goal action as data.

Next, in order:

1. Story beats declare their goal action as data, so the speedrun route generates.
2. Cutscenes as data (timeline), so timing reads scenes from data.
3. Give the fixture game a tiny runtime (one island, one station) so the browser checks
   (speedrun, breaker) are proven on it too. Today only the data checks are.
