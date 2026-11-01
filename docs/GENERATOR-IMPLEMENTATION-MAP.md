# What a generated game is made of — implementation map (1 Oct 2026; updated 30 Oct)

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

## Added 4 Oct: the game as one manifest, and what keeps the system apart

- **Game manifest** (`src/kit/manifest.ts`, `src/game.ts`): one data object naming the live
  stations, rules, progress, stories, sound, cast, storage keys, input modes, devices, the
  game's test module and the nouns of its world. Tools, AI play-testers and agents read it
  instead of one game's names. **lib + data**
- **Saves** (`src/kit/save.ts`): checkpoint plus learning record, resumed only as far as the
  record supports (`kit/progress.ts`). A game gives keys and progress. **lib**
- **Targeting** (`src/kit/target.ts`): what a prompt is about; aimed beats near. **lib**
- **Utterance** (`src/kit/utter.ts`, data `worlds/utter-lab.ts`): say a thing into existence from
  carried words; judged by function (span, light, prop); proved by `tools/uttercheck.mjs`. Draft
  mechanic, test area only (`docs/UTTER-DESIGN.md`). **lib + data**
- **Voices** (`kit/voice.ts`): effects are generic (`robot`, `villain`, `villain-inner`, `radio`)
  and the audio output is passed in, so the kit no longer imports game code. **lib**
- **Story scripts**: `protagonist` and `thoughtVoices` are data (which thinkers are voiced, by whom). **data**
- **Boundary**: `tools/kitcheck.mjs` fails if the kit imports game code or system code names
  the game; `fixtures/night-market` is a second game (data only) the data checks also run on.
  See `docs/QUALITY-SYSTEM.md`.

## Added 25–30 Oct: awe, finds, flight, building, and the checks that keep them honest

- **`src/kit/neural-net.ts`**: a small neural net drawn as lights and links (lit, dormant "unlit
  bulbs", pulses), with `wakeTo`, `preview`, `fire`, `bloom`. Zip's engine uses it, so his voice
  coming back is the net lighting up. **lib**
- **`src/kit/far-net.ts`**: a vast net standing on the horizon (thousands of nodes in layers, a dark
  lattice that reads in daylight, activations climbing it). All motion is in shaders; the tier only
  sets density (672 / 1,680 / 2,880 nodes, +7 draw calls). Placed by `worlds/first-words-spire.ts`. **lib + data**
- **`src/kit/finds.ts`**: optional things off the path (a mote with a beam that keeps a steady
  width on screen, a chime when near, found ones saved). Data: `worlds/first-words-finds.ts`. **lib + data**
- **`src/kit/lane-flight.ts`**: the flight between places, flown across a lane (the stick slides
  the craft; rings sit to either side; drones; an arrival shot that shows the place). The game gives
  its lanes, drones, words, sounds and a HUD host: `worlds/first-words-flight.ts`, `src/flight.ts`. **lib + data**
- **`src/kit/assemble-rules.ts`**: "build it yourself" steps as GameRulesSpec data: slots with
  choices that cost, a limit, a check that logs right/wrong with a reason; `assemblyAnswers` for
  content checks. First use: the Word Loom's call (`worlds/stop2-loom.ts`). Proved in `kittest`. **lib**
- **Tap to use** (`guide.addTapTargets` / `tapTargetFor`): any source of usable things registers
  them; a tap on one walks the player up and uses it. Islands and the story register theirs. **lib** (guide)
- **Walk assist** after the goal arrow (`main.ts`, `?steer=0` off) and the follow camera's wall
  rules (the lens never behind a wall; fillets so town corners don't trap). **lib**, still in `main.ts`.
- **Checks added**: `flightprobe` (five kinds of flyer, incl. one who steers for each ring),
  `camprobe` L (lens behind a wall, in-page), `arrowwalk` (pushes and metres with the assist on
  and off), `reachprobe` pockets, and in `flowcheck`: tap-to-use, the engine in frame in the
  opening, the loom build (spill, swap, fit), the Gate's stars after its twist. The harness takes
  `VL_QUALITY` and `VL_DPR` to look at richer tiers and sharper shots. Escapes recorded in
  `quality/escapes.json`: wall wedge, fader NaN, walk past the turn, thought out of place, lens in wall.

- **Stop 3, Chime Isle** (`worlds/stop3-chime.ts`, `worlds/chime-isle.ts`, `src/chime.ts`): the
  third station follows the same shape as the first two — rules as GameRulesSpec data (phases, a
  warmth enum, three logged decisions), a station spec with content tables, story beats and lines as
  data, an island spec with entities, and a `chimeTower` prop. New pattern: **a chance outcome shown
  on top of deterministic rules** — the judgement is made from the setting committed before the
  cast, and the spin the player sees is drawn so it always agrees with it (the server can replay it).
  The console (`chime.ts`, a fan of guesses whose bars widen with probability, a pointer, a dial) is
  still game-specific UI. **data + game UI**
- **Mooring reachability**: `reachprobe` and `flowcheck` now check that every boat mooring is
  reachable on foot from where the player lands (the Loom mooring was not: a softlock). **check**

- **`src/kit/sky-mood.ts`**: time of day as data. A mood is a whole lighting state (sky
  gradient with the sun's glow and stars, sun direction/colour, hemisphere fill, haze, exposure,
  a tint for the painted cloud banks, lamps lit, how bright a far glowing set piece reads).
  Places name their mood (anchors); moods blend by the camera's distance, so the journey across
  the isles is a journey through the day. It also moves the sun's shadow frustum with the player
  and redraws the (otherwise static) shadow map only on new ground. One sky draw and one draw for
  every lamp halo; nothing scales with the tier. Data: `worlds/first-words-moods.ts` (morning in
  the garden and on Blossom, golden afternoon at the Loom, dusk at the Chime festival).
  `?mood=dusk` holds one mood, `?mood=0` turns it off. **lib + data**
- **`src/kit/wind.ts`**: grass, flowers and leaves sway with sweeping gusts, in the vertex shader
  (one shared time uniform). Rules match material names; applied to every kit as it loads. **lib**
- **Lamps**: any prop can mark a lamp (`userData.lamp` on an empty Object3D, which survives
  `mergeStatic`); the sky mood lights a halo there by time of day. New prop `festoon` (festival
  string lights between two points). **lib** (marker) + **data** (prop)
- **The demo's end** (`worlds/first-words-demo.ts`, `story.ts` startEnding): after Stop 3, the
  camera rises behind Zip toward the Warden's engine at dusk, it surges, a thought, then a card
  (keep exploring / back to the title). Words are data; the shot is still game code. **data + game**
- **Why no full-screen bloom**: the painted look grades and clamps colour inside each material,
  so a bloom pass would catch every white cloud; an HDR multisampled target also costs too much on
  the F15. Glow is authored instead (halos, the engine's additive layers, scaled by the mood).

- **The dream layer** (Desmic, 30 Oct: "a beautiful dream"):
  - `src/kit/dream-air.ts`: the air round the camera full of glowing pollen, drifting petals and
    small letters (a world made of words); fireflies by dusk; pollen by the lens stays as soft
    out-of-focus discs. One Points draw, all motion in the vertex shader inside a box that travels
    with the camera and wraps. Also exports `glyphAtlas` (dot, petal, 14 letters). **lib**
  - `src/kit/light-streams.ts`: rivers of glowing letters along arcs across the sky (quadratic
    arcs as uniforms; one draw). Data: `worlds/first-words-dream.ts`: the isles' words drawn up
    into the Warden's engine, strongest at dusk. **lib + data**
  - `src/kit/foot-glow.ts`: walking leaves motes of light rising from the footsteps. **lib**
  - `kit/sky-mood.ts` gained a moon with a ring (lit from the sun's side; pale by day, bright at
    dusk) and aurora curtains; moods carry `moon`, `aurora`, `air`, `fireflies`, `streams`.
  - A CSS "veil" (screen blend: light pooling from the top, soft bright edges, tinted by the mood),
    far islands that bob, the cloud sea turning slowly. `?dream=0` turns the layer off.

- **High tier's post stack** (Desmic, 31 Oct: the ceiling is now a ₹40k phone, not the F15):
  High renders through `createPaintedPost` (an HDR target, bloom, ACES output, the painted grade
  over the whole frame); `installPaintedShading(strokes, gradeHere=false)` then skips the per-
  material grade (it clamped colour, so nothing could bloom). Only what is brighter than white
  blooms (threshold 1.35): lamps, halos, fireflies, the engine's light, the moon's rim. The sky
  dome is drawn through the inverse of three's ACES filmic curve when the frame is tone-mapped by
  the post pass (`skyMood.untone`), so it reads as authored. Bloom strength follows the mood
  (stronger at dusk). High also: shadow map 4096, 1,600 motes of air. `?post=0|1` overrides.
  Auto picks High when the measured frame x1.8 fits 16 ms. **lib** (painted, sky-mood) + quality
- **Occluders** (run 30): a small thing or a character right at the lens fades away entirely (a
  sixth read as a grey ghost box, and as TV static over a dithered townsperson). **lib**
- **speedrun**: after a station's last move it presses the puzzle UI's own read-on button (the
  relay's made word, the bard's line), waiting for real-time animations. **check**

- **Occluders, again** (31 Oct): anything the lens is in, brushing (0.8 m) or within 1.4 m of
  fades away entirely; only something between the camera and Zip keeps a see-through sixth. The
  Gate's pillar beside the lens, faded to a sixth, was run 30's "big see-through shapes". Measured
  on Blossom Isle: the camera never closer than 3 m after a short walk from 225 spots and headings
  (the "jammed against Zip's back" of run 30 did not reproduce). camprobe 15/15. **lib**
- **High's glow, tuned**: the sky never crosses the glow threshold (only the sun's disc does); the
  engine's own light is scaled down under the glow pass. A screen-space light-shaft pass was tried
  and dropped: it washed the dusk frame pale instead of drawing shafts.

- **The prologue** (`worlds/first-words-prologue.ts`, story.ts): a flash-forward before the cold
  open, shot from data (camera path, surges, log lines with times, the rewind). It holds a time of
  day through `moodForce` (sky-mood `force`) and eases back to the place's own after. The morning's
  beat (and its timed thoughts) starts at the rewind. A pattern any game can use: show where the
  story goes, in the game's own frame, before the first minute. **data + game**

- **Living faces** (`kit/face-rig.ts`): morph targets built at load from a body kit's face parts
  (eyes, glints, mouth, brows: `assembleLook` records each part's vertex range): blink, mouth open
  (a round "D"), smile/frown, brow lift, worried brows, eye glance. A `Face` drives them: blinks, idle
  glances (or eyes leading a head look), a mouth that follows the loudness of the voice playing
  (`voice.level`, an analyser on the clip), feelings blended in (`FEELINGS`, and `feelingFor` reads one
  from an actor's direction). The game sets one cue source (`setFaceCues`: the guide knows each
  speaker's line, its feeling, and flaps a silent line); a person given a `speaker` name moves with it.
  Zip's visor eyes take the same feelings as slit shapes; his lights pulse with his voice. **lib**
- **Named characters from the kit** (`worlds/first-words-looks.ts`: Mira, Tavi, Oriel): a look is
  data; `person(seed, look)` builds any of them. **data**
- **Over-the-shoulder dialogue** (story.ts): while a character speaks to Zip, the camera looks past
  him at their face (the clearer side, pulled in from walls); Zip's own lines keep the two-shot. **game**
- **Ground detail** (`kit/terrain.ts` `groundMaterial`): an island top's painted texture with a tiling
  brush detail multiplied over it in world metres at two scales, faded out with distance. **lib**

- **GPU reset recovery** (main.ts, quality.ts `noteGpuReset`): create the renderer with fallbacks and
  retries, pause on context loss and carry on when it is restored (redraw GPU-made textures), offer a
  reload only if it isn't. (A step down a tier after a reset was tried and dropped: the demo's look
  comes first.) **lib**
- **Hero character from primitives, far-future style** (zip-rig.ts): smooth shells (ellipsoids, a
  lathed torso, tapered capsules) in a lacquered iridescent physical material, a black-glass face with
  light features, joints as light; same skeleton and clips. **game**

## Suggested next extractions (in order)
1. ~~Beat list as data~~ (done 1 Oct: `first-words-story.ts` + `kit/story-script.ts`).
2. ~~Station archetype~~ (done 1 Oct: `first-words-stations.ts` + `kit/station.ts`).
3. ~~Rules as data, shared with the server~~ (done 1 Oct: `kit/game-rules.ts`, `*-rules.ts`, parity check).
4. ~~Interactive entities in WorldSpec~~ (done 1 Oct: `entities` in island specs).
5. **Server records** (proposal: `docs/SAVE-AND-EVIDENCE.md`): the server replays each
   station's action log with the same rules and keeps the evidence.
6. ~~Flight lanes as data~~ (done 30 Oct: `kit/lane-flight.ts`; the Blossom lane, drones and
   words in `worlds/first-words-flight.ts`). Left: the Loom hop's lane is still computed in
   `story.ts`; a route spec joining any two islands would generate both.
7. **A generic puzzle console**: the relay and loom consoles share a shape (head, rail,
   pieces, choices); one data-driven console would let a generator make new stations
   without new UI code.
   Started 30 Oct: the build step's *rules* are generic (`kit/assemble-rules.ts`); its console is
   still the loom's own (`loom.ts`). The relay's rebuild as a build step is the second user.
