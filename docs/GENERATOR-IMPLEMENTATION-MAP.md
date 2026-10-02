# What a generated game is made of — implementation map (1 Oct 2026)

`COURSE-GENERATION-GAME-SYSTEM.md` defines the generated package as eight specs. This page
maps each one to what already runs in the Bellweather proof game
(`experiments/bellweather-arcade`), what is reusable today, and what is still hand-coded.
"Reusable" means it already has no Bellweather nouns in it, or has been used by a second
fixture.

Legend: **data**: driven by a spec file. **lib**: reusable code, no game nouns.
**game**: hand-coded for this game.

## 1. LearningSpec
- `design/learning-design.json`: outcomes for Stops 0–1 (generation loop; context). **data**
- `experiments/bellweather-arcade/design/stop2-loom-learning-design.json`: Stop 2 (pieces; room),
  with its split rule, three tries, evidence and free-to-read sources. **data**
- `app/first_words.py`: rules for first tries, assistance and what counts as mastery. **lib** (server)
- Gap: Stops 3–7 have no learning design yet (the journey map in the "Sky Islands Rescue"
  doc is a hypothesis).

## 2. StoryWorldSpec
- Story, cast, the Stream lore, journey map: the "Sky Islands Rescue" Claude Doc. **data** (prose)
- **Story script as data**: `src/worlds/first-words-story.ts` holds Level 1's beats in order
  (meet → attack → spark → skiff → puzzle → fly → isle), each with its goal and beacon anchor,
  place name, checkpoint and opening thoughts; every dialogue (as chains of lines with
  choices), Zip's and the Warden's thoughts, toasts, button labels and the flight's stars.
  It also states its contract: the handlers and anchors the game must provide. **data**
- `src/kit/story-script.ts` plays a script (`enter(beat)`, `dialogue(id, handlers)`,
  `thinkOnce(id)`, `stars(id, got, values)`) and validates one. **lib**
- `src/story.ts` keeps only what the story *does*: the attack cutscene's choreography, the
  spark chase, the flight. **game**
- Gap: the puzzles' own lines (the Gate's, the relay's, the skiff core's) are still in their
  puzzle files; they move with the rules (extraction 3).

## 3. GameDesignSpec
- Tutorial policy (one control hint at a time, first success guaranteed): `src/guide.ts`
  `startControlHints`. **lib**
- "First try can't fail, second can, third tricks you" is followed by hand in each puzzle. **game**
- **Stations**: every learning moment has one shape: a place, one action, a puzzle, the
  decisions it logs and three stars. `src/worlds/first-words-stations.ts` lists Level 1's three
  (wake the skiff, the Gate, the relay) with the outcomes they teach, their decisions and
  their star rows (`done`, `firstTry: <decision>`, `flag: <name>`). **data**
- `src/kit/station.ts`: `createStation(spec)` logs decisions with the shared evidence rules,
  works out stars and makes the action zone. **lib**
- Stars as reward and feedback: `guide.stars`. **lib**
- Gap: no explicit difficulty or scaffolding-fade data; each puzzle encodes its own.

## 4. GameRulesSpec
- **Every puzzle's rules are GameRulesSpec v1 data**: `src/worlds/first-words-rules.ts`
  (skiff, Gate, relay) and `src/worlds/stop2-loom.ts` (Word Loom), exported as JSON to
  `rules/*.json` by `tools/export-rules.mjs`. **data**
- `src/kit/game-rules.ts` is a port of the server's `app/game_rules.py`; the puzzles send
  semantic actions to it and never decide what is right. Rules judge decisions with events
  `decide:<decision>:<right|wrong>[:<choice>]`. **lib**
- `tools/rules-parity.mjs` runs the same random action walks through both engines and checks
  they agree, including which actions are refused and which broken specs are rejected. **lib**
- Puzzle files (`speech-puzzle.ts`, `island.ts`, `relay.ts`, `loom.ts`) only render. **game**

## 5. WorldSpec
- **Island layout as data**: `src/worlds/blossom-isle.ts` and `src/worlds/loom-isle.ts`.
  Each holds footprint (radius, depth, elevation), paths with width, hedges, landmarks,
  scatter rules (density, spacing, clear zones), gameplay anchors (reserved space), named
  props and a palette. **data**
- Builders: `src/kit/dress.ts` (dress an island from a spec), `terrain.ts` (painted ground,
  island base, floating satellites), `merge.ts`, `budget.ts`. **lib**. Loom Isle was built
  from data only, as the second fixture.
- Assets by semantic role: kits (`authoring/kits/*.kit.json` → `build_kit.py` →
  `public/kits/*.glb` + index with role, provenance, licence, triangles and distance LOD). **data + lib**
- Hero props: `authoring/props/build_skiff.py` (parameterised Blender generator) and
  `src/worlds/bellweather-props.ts` (builders that specs call by name: `wordLoom`,
  `clothLine`, `spoolStack`, `lanternPost`). **lib** (generator) / **game** (prop designs)
- **Generated layouts**: `src/kit/generate.ts` writes an island spec from a theme (what a
  place is made of), a size, a seed and how busy it should be. The scenery islands along the
  flight (`src/worlds/sky-route.ts`) are generated this way from two themes. **lib**
- `src/kit/world.ts` holds a game's islands in groups, builds them lazily when first shown,
  and hides far detail. **lib**
- Town and promenade (`facade.ts`, `painted-*.ts`) predate the kit and are hand-built. **game**
- **Interactive entities are in the world spec**: `entities` (id, kind, place, radius,
  station, params) on Blossom Isle and Loom Isle. The game builds each kind where the spec
  says; what the notes and pinned cards say is the station's `content`. The dressing keeps
  clear of entities. **data**
- Islands can sit at different heights; Zip's ground follows the island he is on.

## 6. RuntimeExperienceSpec
- HUD slots, one of each: goal line, world beacon with edge arrow, context action, story
  card, toast, stars, world labels, thought bubbles (`guide.ts`). **lib**
- Save, resume and the learning log kept across reloads (`save.ts`); title menu with
  Continue (`title.ts`). **lib** / **game** (title look)
- Control profile: tap-to-walk with detours, steady follow camera, faders for things in the
  way (`main.ts`, `occluders.ts`). **lib**, though still inside `main.ts`.
- Device budget: quality tiers (`quality.ts`), adaptive resolution (`painted.ts`), detail
  governor (`kit/budget.ts`), scatter density per tier, small scatter hidden when far away. **lib**
- Sound kit (`sfx.ts`), synthesised, no files. **lib**

## 7. EngineTargetSpec
- Web, three.js, phones first (Galaxy F15 is the low bar), integrated GPUs normal.
- Painted shading lives in shader chunks (`painted.ts`), so any material gets the style.
- Hosted constraint: the claude.ai host serves no `.glb` and no `.wasm`. `build-hosted.py`
  ships models as base64 text and Draco as pure JS.

## 8. AssessmentEvidenceSpec
- Every decision logs `{activity, decision, choice, correct, first, assisted, t}`
  (`window.__vlLearning`, kept in the save), through its station. Each station lists the
  decisions it may log, so the evidence a level can produce is readable from data. **lib**
- A first-try star needs a real first try: an answer made after a reload that undid a
  wrong one earns no first-try star (same rule as the evidence). **lib**
- First-try semantics survive reloads (`main.ts` marks repeats as not first). **lib**
- Gap: not yet sent to the server's evidence store (`app/`); that needs a decision on
  player data handling.

## Echo & Engine (2 Oct): mechanics redesign
`docs/GAME-REDESIGN-ECHO.md`. Zip absorbs words from the world and speaks through a
holographic engine (a tiny language model he can see inside). First slice: the skiff scene.
- `src/kit/holo.ts`: hologram look (light, glass panels, beams, sparks) for any game. **lib**
- `src/echo.ts`: the absorb power; word sources are data (`ECHO_SOURCES`). **lib-ish** (no
  Bellweather nouns beyond its options)
- `src/engine-holo.ts`: the hologram engine: ring (context), reading beams, guess fan with
  real weights from the station's knowledge table, loop. **lib-ish**
- `src/worlds/first-words-echo.ts`: sources, rules, station, what the engine knows, its lines,
  and a content check that the shown guesses agree with the rules. **data**
- Classic mechanics remain behind `?mech=classic`.

## Stop 2 as the proof
Loom Isle's Word Loom is the first station written data-first: learning design → rules →
station (with content and a check that the content agrees with the rules' answers) → story
script → island entities. The only new code is its console (`src/loom.ts`) and a few lines
in `story.ts` to join the levels.

## Quality gate
- `tools/storycheck.mjs` checks every story script and station list in a build in about a
  second, with no browser: missing handlers, anchors, thoughts and decisions, broken
  dialogue jumps, duplicate ids, and the house style (twelve words or fewer per sentence,
  three stars per station). It also checks that it catches a deliberately broken script.
- `tools/flowcheck.mjs` plays the whole game the intended way after a build (checkpoints,
  first-try logging, stars, save and Continue, no errors, fixed views for art review).
- `tools/breaker.mjs` plays like a speedrunner or a mean tester: edge runs, walls, button
  mashing, sequence breaks, reload-scumming of first tries, pause/restart/skip abuse, phone
  rotation, and minutes of random play, with the game's promises checked throughout.
- `tools/playserver.mjs` + an agent is the AI play-tester: it sees only screenshots, text and
  buttons, plays as a persona (newcomer, loophole hunter) and reports confusion, bugs and
  exploits (`tools/AI-PLAYTEST.md`). Its first run found an answer that could be guessed by
  elimination and a button hidden under a prompt; both fixed.
- Both share `tools/harness.mjs` and the game's test hooks (`__arcade.simulate`,
  `__arcade.walkable`, `__vlStory.debug`). See `tools/CHECKS.md`. A generated game should
  expose the same hooks and ship with both checks.

## Reusable primitives in the library (from the list in the system doc)

| Primitive | Where |
| --- | --- |
| interactable / trigger zone | island and story action zones (`{at, r, label, when, use}`) via `guide.setAction` |
| dialogue / character response | `guide.say` with speaker, choices, pictures |
| mission objective | `goal(text, beacon)` |
| success consequence | `guide.stars(title, rows)` |
| semantic HUD indicator | satchel bar, world labels |
| camera / cinematic beat | `story.shot`, attack cutscene with Skip |
| door / gate traversal | Blossom Isle gate (seal, open path) |
| flow / message | relay console |
| puzzle constraint | catch game, notes-in-satchel limit, relay channel and words |
| environment zones | world specs + kits |

## Suggested next extractions (in order)
1. ~~Beat list as data~~ (done 1 Oct: `first-words-story.ts` + `kit/story-script.ts`).
2. ~~Station archetype~~ (done 1 Oct: `first-words-stations.ts` + `kit/station.ts`).
3. ~~Rules as data, shared with the server~~ (done 1 Oct: `kit/game-rules.ts`, `*-rules.ts`, parity check).
4. ~~Interactive entities in WorldSpec~~ (done 1 Oct: `entities` in island specs).
5. **Server records** (proposal: `docs/SAVE-AND-EVIDENCE.md`): the server replays each
   station's action log with the same rules and keeps the evidence.
6. **Flight lanes as data**: the hop to Loom Isle is a cut for now; the flight's lane and
   rings should come from a route spec so any two islands can be joined.
7. **A generic puzzle console**: the relay and loom consoles share a shape (head, rail,
   pieces, choices); one data-driven console would let a generator make new stations
   without new UI code.
