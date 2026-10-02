# Automated checks

Two headless checks run against a build of the game. They're a safety net. They don't
replace people playing for feel and fun.

| Check | What it does | Time |
| --- | --- | --- |
| `storycheck.mjs` | Checks story scripts, stations, rules specs and island entities in the build: ids, handlers, anchors, dialogue jumps, decisions the rules judge, content that must agree with the rules' answers; lines follow the house style. No browser. | ~1 s |
| `assetcheck.mjs` | Reads every GLB the game ships and reports its phone cost (triangles, draw calls, materials, textures, size) against the budgets in `asset-budgets.json`. Over budget fails. No browser. | <1 s |
| `rules-parity.mjs` | Runs the same random action walks through the browser's rules engine and the server's (`app/game_rules.py`) and checks they agree. Needs Python. | ~10 s |
| `camwalk.mjs` | Walks the opening routes with the real follow camera and scores every half second (Zip on screen, view blocked, lens inside something, too close). | ~5 min |
| `replay.mjs` | Replays an AI play-test's actions in a fresh session and scores the camera after each step, so a reported moment can be reproduced. | a few minutes |
| `playserver.mjs` | The body of the AI play-tester: a game session an agent drives step by step, seeing only screenshots, text and buttons. Writes a play log and a report. See `AI-PLAYTEST.md`. | as long as the play |
| `flowcheck.mjs` | Plays the whole game the intended way: title → Mira → attack → spark → absorb words + hologram engine at the skiff → flight → gate → relay → Loom Isle (Stop 2) → save and Continue → fixed camera views. Checks checkpoints, first-try logging, stars, and that nothing errors. | ~10 min |
| `breaker.mjs` | Plays like a speedrunner or a mean tester and checks that the game's promises still hold (below). | ~15–20 min |

```
node tools/storycheck.mjs [--root out]
node tools/assetcheck.mjs [--root public] [--json]
node tools/rules-parity.mjs [--app ../../app] [--walks 300]
node tools/playserver.mjs [--port 7788] [--out playtest]   # then GET /observe, POST /act
node tools/flowcheck.mjs [--out flowcheck] [--only title,meet,...] [--base URL] [--root out]
node tools/breaker.mjs  [--out breaker] [--only oob,walls,mash,order,scum,pause,skip,resize,monkey] [--minutes 4] [--seed 1337]
```

Both write `report.md`, `report.json` and screenshots into `--out`, and exit with code 1
on a failure. They share `harness.mjs` (static server, phone-sized headless browser,
helpers, report).

## The promises the breaker checks

- **Zip stays in the world.** He's always on walkable ground and never falls through,
  whether he runs into every edge, taps far off the map or walks off the island.
- **Walls hold.** The hedge, the closed gate and the joins between them can't be passed.
- **Mashing doesn't double anything.** Rapid clicks on actions, cards and the satchel never
  give more than two notes, two cards or doubled decisions.
- **Order can't be broken.** Notes can't be taken before the satchel, the relay can't be
  used before the gate opens, and the skiff can't be woken before its beat.
- **First tries can't be faked.** A wrong answer followed by a reload and the right answer
  doesn't count as a first-try success (this protects the learning evidence).
- **Pause, restart and skip are safe.** Pausing inside the cutscene keeps the story going.
  "Restart" on the island keeps Zip on the island. Skipping the attack still saves the
  checkpoint.
- **Rotation works.** Turning the phone mid-puzzle keeps the relay console fully on screen.
- **Random play doesn't break anything.** Minutes of random taps, keys, buttons and pauses
  (including reloads that random clicks cause) never leave Zip stuck or the screen in a bad
  state.

## How it runs fast

Software rendering in a headless browser is slow, so the checks use the game's test hooks
rather than real-time input for long movements. `__arcade.simulate(seconds, { keys | walkTo })`
runs the game's own update in fixed 50 ms steps without drawing. `__arcade.walkable(x, z)`
answers whether a spot is walkable. `__vlStory.debug*` reads story state and taps
puzzle pieces. Any game built on this harness should expose the same hooks.

## Found so far

- 1 Oct: "Restart" in the pause menu dropped Zip into the hidden town while he was on
  Blossom Isle. It now returns him to the island landing, and does nothing mid-flight.
