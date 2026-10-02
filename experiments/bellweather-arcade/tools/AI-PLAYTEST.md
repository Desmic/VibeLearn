# AI play-tests

The scripted checks (`flowcheck`, `breaker`) know the game. An AI play-tester doesn't: it
sees only what a player sees (a screenshot, the words and buttons on screen) and decides
what to do next. It finds the things scripts can't: unclear lines, hidden goals, answers you
can guess without learning, and moments where a new player gets stuck.

## How it runs

1. Start a session: `node tools/playserver.mjs --port 7788 --out playtest [--start '&title=0&beat=to-loom']`
2. Give an agent (a Claude subagent today; a model API later) the API below and a persona.
   It observes, looks at the screenshot, acts, and writes notes (`confusion`, `bug`,
   `exploit`, `delight`, `idea`) as it goes.
3. Before ending, the agent answers the kid test as two separate questions (`{"type":"verdict","look":"yes|no|unsure","keepPlaying":"yes|no|unsure","why":"…"}`): would a young player stop and look? Would they understand it and want to keep playing? (Desmic's test, 17 Sep: a game can be pretty and still lose them.)
4. `{"type":"end"}` writes `report.md` next to the screenshots and `playlog.jsonl`.

API: `GET /observe` (screenshot path, goal, card, buttons, toasts, thoughts) and `POST /act`
with `tap`, `tapAt`, `move`, `wait`, `key`, `reload`, `note`, `end` (see the top of
`playserver.mjs`).

Limits to keep in mind: an agent acts seconds after each screenshot, so anything that needs
quick reactions (catching a falling word) looks harder than it is for a person. Treat those
findings as "check with a person", not as facts.

## Personas used

- **Newcomer**: a curious 12-year-old who has never seen the game; tries the obvious thing
  first; notes every moment of doubt.
- **Loophole hunter**: plays once to judge the lesson, then tries to get the reward without
  understanding: elimination, memorising positions, reloading after a wrong answer, mashing,
  leaving mid-puzzle, falling off.

## First run (1 Oct 2026)

**Newcomer** (start of the game, about 70 actions; reached the skiff's last word):
- Fixed: the "Feed the core" button sat under the puzzle prompt on a phone screen.
- To look at with a person: the spark's goal was hard to find (arrow flipping), the camera
  wedged between a tree, a banner and the cliff near the bell garden (mirrored banner text is
  its back face), finding Mira took about 10 moves, falling words leave the screen.
- Confusing line: "the core reads words" before the player knows what the core is.

**Loophole hunter** (Stop 2, 52 actions, finished three times):
- Lesson judged clear; the split screen ("9 pieces, 6 slots. Too many!") does the teaching.
- Fixed: the piece-count question could be solved by elimination (6 = words, 28 = letters);
  it now has a near-miss option and the options are shuffled. The tempting call no longer
  splits a word into single letters (that would teach the wrong idea). "Right!" after a
  reload now says "Right this time." (the first try already counted). Restart from the pause
  menu now closes the loom console. Finishing Stop 2 is saved.
- Held up: reloading can't fake a first try, mashing doesn't double anything, the island edge
  holds.
- Still open: speech bubbles can run off the screen or cover the goal line; the skiff was
  hard to find on Blossom Isle.

## Echo & Engine slice (2 Oct 2026)

**Newcomer** (starts at the skiff scene, 44 actions; woke the skiff):
- Fun 7/10, clarity 5/10. It explained the engine back in its own words: "you put words in its
  ring in order… it guesses the next word… feed the guess back in and it keeps going." That's
  the Stop 1 outcome, said by the player.
- Delights: pulling a word out of what someone says; "sink" really sinking the skiff; the
  engine saying "um" when unsure.
- Fixed: taps on far words did nothing (reach raised to 14 m, a bigger tap target, and a
  "walk closer" hint beyond that); the loop line was hard to read (now "It guessed
  “Blossom”! The loop that feeds guesses back is broken. Load the next words yourself.");
  no payoff (the finished sentence now shines over the skiff as it wakes, before the stars);
  a dark pole in the engine view (camera moved).
- Still open: the follow camera in tight spots near the outlook (trees, walls).

## Polish pass (2 Oct 2026, evening)

**Newcomer from the title** (about 78 actions; woke the skiff with 3 stars). Polish 4/10, fun
6/10 before this pass. It loved the look, Zip's lines, words orbiting Zip, the hologram reveal,
and the broken-loop idea ("a really clever way to teach next-word prediction").

Fixed after this run:
- **Camera.** Lobed tree crowns, shrubs, trunks, branches and slim posts now step aside when
  they come near the lens or between the camera and Zip (`clearSight` in `canopy.ts`: crowns
  and shrubs shrink per lobe in the vertex shader; trunks and posts screen-door fade). When
  squeezed against a wall while walking, the camera eases round to the side with more room
  ("whiskers") and lifts higher over Zip. Cutscenes and the engine keep sight of what matters
  (`story.focus`).
- **Wayfinding.** A new goal makes the camera glance toward it once (dragging takes over at
  once). The edge arrow is drawn (it pointed the wrong way in some fonts) and stays steady
  when the target swings behind: it sits at the bottom and points down, on the target's side.
  The loose spark has a column of light.
- **Text.** Speech bubbles, thoughts and world labels stay on screen and below the goal line;
  hints and Zip's thoughts pause during cutscenes; the walk/look hint goes after 14 s; the goal
  line clears while Mira talks; hanging the lantern says so.
- **Juice.** Catching the spark bursts gold into Zip's chest. Sparks draw as one instanced mesh.

Second and third newcomer runs (camera and wayfinding only) still scored the camera 3/10, so the
camera got a proper measurement instead of guesses: `__arcade.viewProbe()` and `__arcade.pick()`
report what blocks the view, and a scripted walk through the opening routes scores the real
follow camera every half second.
- Merged town pieces (stone blocks, window walls, pillars) never stopped the camera, because
  merging dropped them from the camera's solids. Each solid-looking piece now leaves an
  invisible box for the camera.
- On a phone held upright, the camera looked well above Zip to frame the architecture; close up,
  that pushed Zip off the bottom of the screen. The lift now fades as the camera comes close.
- When pinned close (walking toward the camera), the whiskers search wider and turn faster.
- Result on the scripted routes: bad frames went from 25 of 95 to 1–2 (brief moments), and 0 of
  52 around the arrival arch.
- Also: the shield moment in the attack plays in slow motion (time to be brave), the empty shot
  after the bolt is capped, and the bell garden has a label while the spark is loose.

Note on the AI tester: it counts leaves framing the top of a shot as a fault. Some of that is
deliberate composition; the fixed talk and cutscene shots were left as they are.
