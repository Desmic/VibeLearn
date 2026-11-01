# vibeLearn — agent instructions

## Latest — 30 October 2026 (read with the 3 October direction below)

- **Beauty and awe are the big aspect now** (Desmic, 27 Oct). The awe should come from what the game
  teaches: the learning moment made visible (Zip's voice as a glowing neural net; the Warden's engine, a
  vast net, on the horizon where Mira was taken). Blind testers saying "whoa" unprompted is the measure.
- **The ceiling is a ₹40k phone in India** (Desmic, 31 Oct: "forget about f15 ceiling"); High is designed for
  it (full-screen glow, sharper, denser). Earlier (27 Oct): the Galaxy F15 is the floor. A set piece is
  designed at full ambition and scales down by quality tier (fewer particles, lower resolution), never
  a smaller design. The F15 holds ~89 fps on Medium: there is headroom to use.
- **Puzzles test, not confirm; build, don't pick.** Blind run 29: "mostly picking from 3 or 4 buttons".
  The Word Loom's last step is now a call the player builds (`kit/assemble-rules.ts`); the relay is next.
  Stop 3 (Chime Isle, sampling and warmth) has the player predict before seeing and set the dial
  before casting; outcomes shown always agree with the deterministic rules.
- **A demo first** (Desmic, 30 Oct): the title through Stop 3, polished, before Stops 4–7. The isles are
  one day (morning → golden afternoon → dusk, `kit/sky-mood.ts`), and the demo ends on the Warden's
  engine at dusk with an end card.
- **A beautiful dream** (Desmic, 30 Oct): the world should feel like one. A ringed moon, aurora, air full of
  pollen and drifting letters, rivers of words flowing into the Warden's engine (`kit/dream-air.ts`,
  `kit/light-streams.ts`). The F15 is set aside for now.
- **Claude decides for now** (Desmic, 27 Oct: "you know my tastes"), measures before fixing, and runs
  blind AI play-tests; every run and change is logged in `experiments/bellweather-arcade/tools/AI-PLAYTEST.md`.
  Hosted game: artifact `5767FASV8YrmnZSSh1Ug5y`, version 122 on 2 Nov (playable through Stop 3, Chime Isle, with the demo's ending, the dream layer, living faces and the far-future Zip).
- What the system gained since 4 Oct (kit modules, checks): `docs/GENERATOR-IMPLEMENTATION-MAP.md`,
  section "Added 25–30 Oct".

## Current direction — 3 October 2026 (read this first)

Desmic confirmed on 3 Oct 2026:

- **The game is `experiments/bellweather-arcade`**: "Bellweather: The First Words", a three.js web game that
  teaches how language models work. It is the official direction. PlayCanvas and the earlier Level 1
  ("Relay Rescue", message machine, Moon gate, limbo-prison opening) are **historical**. Docs that
  describe them carry a "Historical" note at the top; read them for ideas, not as instructions.
- **New to the project? Read `docs/START-HERE.md` first** (what to read, where things are, how to build,
  check and ship, agent environments, mistakes not to repeat). How to play-test: `docs/PLAYTEST-METHODS.md`.
- **Then:** `docs/PLAY-DESIGN-20261003.md` (why and how to play; the in-world UI rules from the F15 play-test),
  `docs/GAME-REDESIGN-ECHO.md` (the game's core mechanic and the stop-by-stop plan),
  `docs/DOCS-AUDIT-20261003.md` (what is open and what was decided), `experiments/bellweather-arcade/tools/CHECKS.md`
  (how to check a build), `experiments/bellweather-arcade/tools/AI-PLAYTEST.md` (AI play-testers),
  `docs/GENERATOR-IMPLEMENTATION-MAP.md` (which pieces are reusable data and which are still game code),
  `docs/SAVE-AND-EVIDENCE.md` (saves and learning evidence).
- **Art direction** is the look of the game's starting area (Bellweather): a warm, painted, festival town
  in the sky. Enhance it from feedback; don't replace it.
- **Audience:** young adults and adults, 18+ for now.
- **Progression:** opening and tutorial (meet Mira, hang the lantern, the Warden's attack, catch the spark)
  → Stop 1 (wake the skiff in Bellweather; the Gate and relay on Blossom Isle) → Stop 2 (Loom Isle) →
  Stops 3–7 (see the order in `docs/GAME-REDESIGN-ECHO.md`). Each stop repairs part of Zip's speech
  engine and teaches one idea through play.
- **Quality bar:** indistinguishable from a top game (feel target: Zelda Breath of the Wild / Tears of the
  Kingdom) while keeping the learning progression. Mechanics live in the world, not in panels.
- **Humour stays:** Zip's jokes (simulation, NPCs, the Mario line) were asked for. Keep them.
- **Quality gates:** the goal of the earlier review gates still stands: a system that makes games like this
  one quickly and with reliable quality. The gates are now the automated checks (`npm run check`,
  `npm run check:parity`, `npm run check:play`), AI play-testers, and Desmic's verdict on real devices
  (a Galaxy F15 is the low-end phone). Automated checks may run in whatever is most practical for
  agents (headless browsers are fine); players and Desmic give the final feedback.
- **Reuse:** build the system and the game together. New art, rules, stories and worlds should be data
  or reusable kit code (`src/kit/`), not one-off code, so a generator can produce the next game.

## Working rules

- **`main` is the canonical branch.** Don't create a branch for routine work; use one only when isolation
  is really needed and merge it back promptly. Older `game/*`, `phase1/*` and `deploy/*` branches are
  historical unless Desmic revives one.
- Latest user direction supersedes historical plans. When docs disagree, the dated section above wins,
  then the newest doc.
- Clear story, attachment, atmosphere, readable controls, spatial composition and meaningful play are
  requirements, not polish.
- The world needs breathing room: footprint, prop density, negative space, landmark spacing, camera
  occlusion and intersections are design inputs. More props are not automatically better.
- Primary gameplay information rides the world (objects, events, short-lived markers, contextual prompts).
  Persistent panels and clipped overlays are defects.
- Speech and prompts live in the world: speakers talk in bubbles over their heads, others bark in passing,
  tutorial prompts sit on the thing to touch (`src/kit/overlay.ts`, `guide.ts`). Never explain what the
  player just saw; cutscenes are directed shots, not captions.
- Spoken lines are voiced from the story data: the cast and each line's direction live in
  `src/worlds/first-words-voice.ts`; `node tools/voice-lines.mjs` (after a build) lists the lines and
  `node tools/voice.mjs` acts the new ones with Gemini 3.8 Flash TTS (key in `.env`, never committed).
  A line without a clip still shows; it is just silent.
- Check the actual running game when a claim is about feel, motion, camera or audio. Screenshots and
  source alone can't certify those.
- Use direct protagonist control (Zip). Don't add a separate helper avatar because story text says
  "you help X".
- Pop-culture, game and film research is encouraged for ideas. Ship original characters, assets, dialogue
  and music; never make understanding depend on a reference. Don't model characters on real people.
- Third-party assets: CC0 or equivalent only, with the licence file snapshotted next to the asset
  (`experiments/bellweather-arcade/public/kits/LICENSES/`). Authored models are Blender scripts in
  `experiments/bellweather-arcade/authoring/`.

## How to verify a change (lessons from the 3 Oct F15 play-tests)

- **Measure before you fix.** Before any change that can move frame rate, record a baseline with the
  benchmark (`#bench=1`, see `experiments/bellweather-arcade/tools/CHECKS.md`) on the same machine, then
  measure again after. Never report a speed change without both numbers.
- **Know the device ratio.** Headless and laptop numbers are not phone numbers. Keep the laptop↔F15 ratio
  from runs of the same build (CHECKS.md, "Device ratio") and predict the phone from it; confirm on the phone.
- **Play the whole game after a large change**, on real rendering (the Claude app's browser or a phone),
  in both input modes (touch and keyboard), start to the last stop. Headless checks prove the flow
  works, not that it looks, sounds, times or feels right.
- **Check animation, camera and timing by watching**, and dialogue/cutscene timing with
  `tools/timing.mjs`. Layered motion (look-at, springs) must start from a known pose each frame.
- **State what you can actually do before offering it.** Check a capability (a tool, a network host, a
  permission) before telling the user it is available.

## Learning evidence and data

- Rendering, XP, stars, self-report and completion do not establish mastery; missing evidence is unknown.
  A first try is a first try once; reloads and replays never make a later answer first.
- Learning events record activity, decision, choice, correctness, first try, assistance and the rules
  version that judged them. Rules are data (GameRulesSpec v1) and must agree with the server's
  interpreter (`app/game_rules.py`, checked by `tools/rules-parity.mjs`).
- Saves and learning records will live on the server and the client, without a client-side file that lets
  players cheat. Identity and hosting for that are still to be decided (see the audit doc).
- Preserve learner data, supplied designs and unrelated work. Test on disposable data.

## Server

- The Python modular monolith in `app/` (rules interpreter, auth, storage) remains the server. Local:
  SQLite and loopback; hosted pilot: Flask/Gunicorn, PostgreSQL and Supabase identity (`docs/HOSTING.md`).
  The game itself currently ships as a claude.ai artifact (built from the arcade by Claude's hosted-copy script), which has no server.
- At server changes run `python manage.py test`.
