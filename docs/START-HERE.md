# Start here: contributing to VibeLearn without context mistakes

Last checked: 3 October 2026. If something here disagrees with `AGENTS.md`'s dated
"Current direction", `AGENTS.md` wins; then the newest dated doc. Fix this page when you
find it wrong.

## 1. What this is, in five lines

- **VibeLearn** is a *system* that turns a subject into an immersive game ("why grind? just
  play"). Games are products of the system; later, agents will build games with players
  through conversation. Build the game and the reusable system together.
- **The proof game** is *Bellweather: The First Words* (teaches how language models work),
  in `experiments/bellweather-arcade` (three.js, TypeScript). This is the official direction.
  PlayCanvas, "Relay Rescue", the Moon gate and the limbo-prison opening are **historical**.
- **Bar:** feels like a top game (Zelda BotW/TotK), phone-first (a **Galaxy F15** is the
  low-end target), audience **18+**, the learning progression kept.
- **Owner/reviewer:** Desmic. Final feedback comes from players and Desmic on real devices.
- **The game ships** as a private claude.ai artifact (link in section 6), not from a server.

## 2. Read in this order (about 20 minutes)

1. `AGENTS.md` — current direction, working rules, how to verify a change.
2. `docs/PLAY-DESIGN-20261003.md` — why and how to play; in-world UI rules; controls per device.
3. `docs/GAME-REDESIGN-ECHO.md` — the core mechanic (absorb words, speak through the
   hologram engine) and the order of stops.
4. `docs/PLAYTEST-METHODS.md` — every way to play/test the game, and which to use when.
   `docs/TEST-CONTRACT.md` — the hooks and data every game exposes so all the tools work on it
   (part of "done" for any new game).
5. `experiments/bellweather-arcade/tools/CHECKS.md` — the checks, benchmark, timing, voices.
6. `docs/DOCS-AUDIT-20261003.md` — what is open, what was decided, what is historical.

Docs with a **Historical** banner describe earlier games: mine them for ideas, never follow
them as instructions.

## 3. Where things are

```
AGENTS.md, README.md                 direction and rules (read first)
docs/                                design, decisions, methods (dated; newest wins)
app/, manage.py, tests/              Python server (rules interpreter, auth, storage) — not used by the hosted game yet
experiments/bellweather-arcade/      THE GAME
  src/main.ts                        boot, renderer, camera, input, test hooks (window.__arcade)
  src/story.ts                       Level 1 + Stop 2 choreography (cutscenes, beats)
  src/worlds/*.ts                    DATA: story scripts, stations, rules, island specs, voice cast, town lines
  src/kit/*.ts                       REUSABLE, game-agnostic: overlay, voice, joystick, input-mode,
                                     bench, story-script runner, stations, world gen, swing, body kit…
  src/guide.ts                       goal line, beacon, bubbles, barks, prompts, action prompt, stars
  public/                            models (GLB), kits (CC0, with LICENSES/), voice clips (public/voice)
  authoring/                         Blender scripts that build the models (props/, characters/)
  design/                            learning designs (per stop)
  tools/                             build, checks, harness, AI play-test server, voice, timing
```

## 4. Build, run, check

```text
cd experiments/bellweather-arcade
npm ci                               # three, typescript, playwright (vite for `npm run dev`)
bash tools/build.sh                  # -> out/ (the build the checks and the hosted copy use)
npm run check                        # types + story scripts + asset budgets
node tools/flowcheck.mjs             # plays start to end of Stop 2 headless (~15 min)
node tools/breaker.mjs               # tries to break it (~20 min); run AFTER flowcheck, never together
node tools/timing.mjs                # every cutscene line with its voiced length
node tools/speedrun.mjs --input touch   # walks the game, times it, proves no learning is skippable (~6 min)
node tools/playthrough.mjs           # whole game as a phone AND as a laptop + timing + speedrun (~45 min);
                                     #   open playthrough/index.html and look at the contact sheets
python3 tools/build-hosted.py --dest ../hosted-build    # the claude.ai copy (see section 6)
```

`tools/build.sh` needs bash and python3 (on Windows: Git Bash or WSL). `npm run dev` (vite,
port 8062) is configured but was not re-verified on 3 Oct; `tools/build.sh` is the path
the checks use.

Test URLs (add to the query, or after `#painted` on the hosted copy):
`title=0` skip the title · `beat=attack|spark|skiff|isle|land|to-loom|loom` start later ·
`story=0` free walk · `quality=low|medium|high` · `adaptive=0` fixed resolution ·
`bench=1` frame-rate test · `mech=classic` old catch game · `voices=0` silent.

## 5. Verify like this (lessons that cost us a day)

- **Measure before you fix** anything that can move frame rate: `bench=1` (or *Graphics →
  Run frame-rate test*) on the same device, before and after. A baseline build of v59 is
  published for comparison (section 6).
- **Headless numbers are not phone numbers.** The headless browser renders in software
  (~1–5 fps). Use the laptop↔F15 ratio table in `tools/CHECKS.md`; confirm on the phone.
- **After a big change, play the whole game** start to end in both input modes
  (`tools/playthrough.mjs`) and review the contact sheets and timing log, not only
  pass/fail counts (`docs/PLAYTEST-METHODS.md`).
- **Layered motion starts from a known pose every frame** (head look-at, springs). The
  3 Oct "heads spin like tops" bug was an offset multiplied onto last frame's pose.
- **DOM over the 3D view:** read all sizes first, then write; write only what changed.
- **Say what you can do only after checking** (a tool, a network host, a permission).
- **Exhaust your own tools before asking Desmic to run something.** Before writing "you
  run it", list what's connected (Chrome extension, browser pane, device shell) and try.
  Only the F15 itself is out of reach.

## 6. Shipping and the places work lives

- **Hosted game (what Desmic plays):** claude.ai artifact `5767FASV8YrmnZSSh1Ug5y`
  (`https://claude.ai/artifact/5767FASV8YrmnZSSh1Ug5y`). Publish the `tools/build-hosted.py`
  output: `index.html` as the page, every other file as an artifact file; send only changed
  files. Settings ride in the frame's own `#hash` (the claude.ai page's hash does **not**
  reach the game), so in-game buttons (Graphics, frame-rate test) are how a player changes them.
- **Baseline for comparisons:** artifact `8G2HTKtWmYhBKYSqt9fC7t` = the game before the F15
  changes (git `762a002`) plus the benchmark.
- **Repository:** `github.com/Desmic/VibeLearn`, branch `main`, Windows working copy
  `E:\Projects\VibeLearn` (CRLF line endings, `core.autocrlf true`). Commit small, clear
  steps; Desmic pushes (agents' sandboxes have no GitHub login).
- **Claude project "VibeLearn"** holds short copies of key docs (`claude/*.md`) for other chats.

## 7. Agent environments (Claude sessions) — what each one can and can't do

| Where | Can | Can't |
| --- | --- | --- |
| Cloud workspace (Linux) | build, headless browser (software GL), all checks, ffmpeg, publish artifacts | reach Desmic's files directly; GPU; Google APIs (egress policy) |
| Sandbox on Desmic's laptop (`device_bash`) | read/write `E:\Projects\VibeLearn`, git commit, ffmpeg, node, call allowed hosts (Gemini API) | GPU or browser; background processes (each call ≤ ~3 min, then everything it started ends); git push (no login); delete files without permission |
| Claude app browser pane | real laptop GPU (Intel UHD), see/click the hosted game | reach into the game's frame (cross-origin): no hooks, no fast-forward; must be visible or it throttles |
| Claude in Chrome (extension) | real laptop GPU; open the artifact, click the game's own UI, read the screen: **run the frame-rate test yourself** (`docs/PLAYTEST-METHODS.md`) | the game frame's address/hooks (hidden, cross-origin); waits over ~60 s per call |
| Screen control (computer use) | see and click approved apps | type into terminals/IDEs (click-only by policy) |
| Desmic's F15 / laptop | the truth for feel and fps | — |

Network from sandboxes follows the org's allow-list (Claude admin settings). Node's
`fetch` ignores proxies unless `NODE_USE_ENV_PROXY=1` (`tools/voice.mjs` sets it itself).

## 8. Standing decisions you must not undo by accident

- Speech and prompts live in the world (bubbles, barks, prompts beside the target); no
  bottom cards for speakers who are in the world; no permanent HUD buttons for world verbs.
- Controls: phone = floating thumb stick + taps; desktop = WASD (Shift walks), E acts,
  number keys choose, Space/Enter/E advance.
- Keep all of Zip's jokes (simulation, NPCs, Mario, the "Sups" rings). Mira can't know Zip
  thinks; she notices beeps and blinks. Never explain what the player just saw.
- Third-party assets CC0 only, licence snapshotted. Original characters; none resembling
  real people. Voices: Gemini 3.8 Flash TTS (townsfolk Flash-Lite); key in `.env`, never committed.
- Learning evidence: a first try counts once; rewards are not mastery.
