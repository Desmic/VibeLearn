# Ways to play and test the game, compared (3 Oct 2026)

Desmic asked (3 Oct) for an honest comparison of every way an agent can play Bellweather,
after a change shipped with spinning heads and an unmeasured frame-rate drop. No single
method sees everything; each change needs the right mix.

## What each method can judge

| Method | Real GPU / fps | Feel (motion, camera, controls) | Flow and logic | Timing | Coverage per hour | Repeatable | Cost to Desmic |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **A. Scripted headless play-through** (cloud, Playwright + game hooks: `playthrough` = `flowcheck` as phone + as laptop + `timing`; `breaker`, `_cine`) | no (software GL, ~1–5 fps) | no (stills only) | **yes**, every beat, both input modes | **yes** (game-time logs with real voice lengths) | whole game, ~15 min | **yes** | none |
| **B. AI play-tester** (`tools/playserver.mjs` + an agent with a persona) | no | partly (reads screenshots like a newcomer) | yes, unscripted: finds confusion and loopholes | coarse | one path, slow | partly | none |
| **C. Claude app browser pane** (on Desmic's laptop) | **yes** (Intel UHD integrated) | barely: screenshot round trips of seconds | slow, by hand | no | a few minutes of game per hour | no | pane must stay visible |
| **D. Screen control of Chrome** (computer use) | yes (whichever GPU Chrome uses) | barely (same round trips) | slow | no | very low | no | approvals; desktop busy |
| **E. Claude in Chrome extension** | yes | barely | slow | no | low | no | uses Desmic's real browser profile |
| **F. In-game frame-rate test** (`bench=1`, *Graphics → Run frame-rate test*) | **yes**, on any device | no | no | no | 40 s per run | **yes** | one tap on the phone |
| **G. Desmic on the F15 / laptop** | **yes** | **yes** (the only real judge) | yes | yes | — | no | Desmic's time |

Why C–E rarely help: the hosted game runs inside claude.ai's cross-origin frame, so an agent
there cannot use the game's hooks or fast-forward; it can only look at pictures and press
keys, seconds apart. The sandbox on the laptop has no browser or GPU at all.

## The routine

1. **During work:** A for every change that touches story, UI, input or timing (fast, full
   coverage). `tools/timing.mjs` for any cutscene or dialogue change.
2. **Before publishing a big change:** `node tools/playthrough.mjs` (both input modes:
   phone taps + thumb stick at 393×760, laptop E/Space/numbers/WASD at 1024×640, then the
   timing log), *and a human-style review of its contact sheets (`sheet.html`) and timing
   log*, not just the pass count. Look for: animation poses that changed, heads/limbs at odd
   angles, UI covering subjects, text clipping, prompts in the wrong place.
3. **Anything that can change frame rate:** F before and after, on the same device; record
   in the device-ratio table (`tools/CHECKS.md`). The v59 baseline artifact exists for this.
4. **New or reworked player experience:** B with a newcomer persona (adult, 18+).
5. **Feel:** G, with a short checklist from the agent per build (what changed, what to watch).
6. **C** only for a visual spot check on a real GPU (a shader, a colour, the benchmark
   table), never as a play-test.

## Known blind spots (and what covers them)

- Animation smoothness, camera feel, control responsiveness → only G (A can catch *wrong
  poses* in stills, not jerky motion).
- Real frame rate and resolution → F (numbers), G (feel).
- Audio mix and voice acting → G (A checks that clips exist and how long they are).
- Touch: A sends real touch events (taps on prompts, a dragged thumb stick) on an emulated
  phone; a real thumb on a 6.5" screen (reach, mis-taps, palm on the stick) is G.
- A measures distances and speeds in game time; it can't tell whether a speed *feels* right.

## Lessons from building the two-mode play-through (3 Oct)

- Taps must wait for the target to hold still: prompts pop in with a short scale animation
  that takes seconds at software frame rates, and a tap on a moving button lands nowhere.
  `locator.tap()` waits for a stable element; a raw `touchscreen.tap(x, y)` does not.
- Cutscenes crawl at software frame rates, worse on the laptop-sized screen: wait on them in
  **game time** (`h.until(fn, seconds)` fast-forwards with `__arcade.simulate`), not wall time.
- The first two-mode run found real issues the mouse-only run never showed: Mira's skipped
  cold-open line left on screen under her real one, the thumb-stick hint far from the stick,
  townsfolk bubbles that placed themselves outside the overlay (so prompts landed on their
  text), Zip thoughts shown long after their moment. Fixed 3 Oct (v67).
- One "finding" was the test's own doing: it teleported Zip *inside* planters (the word spots),
  so the camera pressed into his back. `h.pose` now warns when a spot isn't walkable ground.
  Still worth having: the camera now rises to look over a low thing behind Zip.
- After any change to `main.ts` wiring, load the game once before a long run: a 35-minute
  play-through that times out at "Opening the garden…" is a startup error.
