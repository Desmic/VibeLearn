# AI play-tests

The scripted checks (`flowcheck`, `breaker`) know the game. An AI play-tester doesn't: it
sees only what a player sees (a screenshot, the words and buttons on screen) and decides
what to do next. It finds the things scripts can't: unclear lines, hidden goals, answers you
can guess without learning, and moments where a new player gets stuck.

## How it runs: blind play, then an interview (5 Oct 2026)

Desmic's rule (5 Oct): **don't tell a tester what to test.** A language model is steered by
whatever is in its context, so a tester told to "notice the funny failures" or "try more words
than fit" finds exactly that. The runs before 5 Oct did this. My prompts said "try phrases you
suspect are wrong", "was any failure funny?" and "how did the speaking interface feel?", so their
verdicts were partly my own words coming back. The first blind run of the same test area showed
how much (below).

1. **Start a session:** `node tools/playserver.mjs --input touch --persona commuter|explorer|rarely
   [--intent utter --start '&lab=utter'] [--max 80] [--out <a neutral folder>]`.
2. **The tester** (a fresh agent) gets **only** `GET /brief`, verbatim, with nothing added.
   That is `tools/playtest/tester.md` with a persona. It says this is a game they have never
   seen, explains how to touch the phone, and says they can stop whenever they'd put the phone
   down. It never mentions:
   - the genre, goals, mechanics or lesson;
   - "fun", "bugs" or "confusing";
   - note categories.

   Personas say who the tester is ("rarely plays video games"), never what to notice. The screen
   comes back as unlabelled writing and buttons; calling one line "the goal" would already tell
   them something. Saying things out loud is optional (`think`). Stopping early is data.

   `tools/blindcheck.mjs` (in `npm run check`) fails if the brief or a persona carries a word
   from any game's design or a word that primes a judgement.
3. **The interviewer** (a second agent, the only one that sees the intent) gets `GET
   /interview/brief` (`tools/playtest/interviewer.md` plus the intent and its items) and the play
   log (`GET /trace`). It questions the **same** tester, who still remembers playing. I only relay
   the messages. The interview goes from open to specific:
   - **recall:** "tell me about what you just played";
   - **probe:** follow their own words, plus two neutral incident questions;
   - **moments:** "at step 34 you tapped the same thing three times; what were you expecting?";
   - **predict:** small what-ifs using only words they met;
   - **ratings:** last, so numbers don't anchor anything;
   - **reveal:** the intent, then "where did you see this?".
4. **Leak guard.** Before the reveal, `POST /interview` refuses a question that uses a word the
   tester hasn't met (not on their screen, not in their own answers) or a judgement word
   (`tools/lib/leak.mjs`). The interviewer has to rephrase in the tester's words.
5. **Findings by evidence level.** Each intent item is marked by how it came out:
   - **unprompted** or **probed**: pass;
   - **only when pointed at a moment**: warn;
   - **only after the reveal**, **missed** or **misread**: fail.

   These go to the `comprehension` lane, tagged with the area tested. Bugs go to `flow`. Each
   report is named by protocol and persona, so several testers of one build sit side by side.
6. `{"type":"end"}` writes `report.md` (with the whole interview), `trace.md` and the standard
   report.

**Story, feel and objective measures (added 6 Oct).** Desmic asked whether the interview covers
the story, what was learned, and the fun (the opening, the feel, the rewards, intuitive play),
and how sure we are that it came across as intended. Three things answer that:

- **Experience items.** A game's manifest (`intent.story`, `intent.experience`) and an utterance
  spec (`experience`) list what a newcomer should *feel* ("the first minute makes you curious",
  "a failure makes you laugh"). They are drafts until the designer confirms them. The interviewer
  marks each one `felt | asked | not | unclear` with the tester's words as evidence. Feelings are
  where an AI tester is least trustworthy, so these go to the `feel` lane **as evidence for a
  person to confirm**, never as a pass. Only `not` (the tester said the opposite) warns.
- **More questions in the interview** (12–16 in all):
  - "what were you thinking in the first minute?";
  - would they keep going or put it down;
  - "what was it like to [their words]?";
  - characters, named only as the tester named them;
  - a **teach-back** ("how would you explain [their word] to a friend about to play?"). This
    catches a wrong mental model that a yes/no question would miss;
  - after the ratings, "what did that number mean to you?";
  - after the reveal, "what, if anything, would you say it taught you?".
- **Play metrics**, measured from the log and not from what the tester said:
  - steps;
  - where they stopped, and whether they failed;
  - steps per goal and the step of first progress;
  - stalls (3+ unchanged screens) and repeated taps.

  These head the trace the interviewer reads and the report ("The play, measured"). A tester
  who says "it was intuitive" after 30 stalled steps is caught by the numbers.

**Directed tests** (`--protocol directed`, e.g. the loophole hunter) still exist for testers who
are *meant* to be told what to try. Their findings count for robustness and learning, never as
evidence of what a newcomer understood.

An AI player approximates a newcomer; it doesn't replace one. It can't feel motion or hear
the music, and it acts seconds after each screenshot. A real beginner play-test is still owed.

API: see the top of `playserver.mjs`. With `--input touch`
every action is a phone's: taps that wait for a prompt to hold still, the thumb stick, a
one-finger drag to look (fixed 4 Oct: the first cold run tapped with a mouse, so the game
believed it was on a laptop and showed the keyboard hint, and it had no way to turn the camera).

Limits to keep in mind: an agent acts seconds after each screenshot, so anything that needs
quick reactions (catching a falling word) looks harder than it is for a person. Treat those
findings as "check with a person", not as facts.

## Personas used

Blind personas live in `tools/playtest/personas.json` (commuter, explorer, rarely): who the
tester is, nothing more. The two below were the directed personas used before 5 Oct; the first
one's "notes every moment of doubt" is exactly the kind of priming the blind brief removes.

- **Newcomer**: an adult (the audience is 18+, decided 3 Oct) who has never seen the game and
  plays games casually; tries the obvious thing first; notes every moment of doubt.
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

## First cold run (4 Oct 2026, newcomer, phone; build b-a3e92533a7ec)

82 steps from the title through waking the skiff (2 of 3 stars). Cold account before the
intent: understood the world, Zip, Mira's abduction, the word-ring engine and "it predicts the
next word and feeds the guess back". First look: **stop and look: yes; keep playing: unsure**.
The gate recorded the comparison as the `comprehension` lane: **fail** for that build.

- **Blocker:** "Get your voice back" (the spark chase) couldn't be navigated: about 25 steps
  circling the arch, the edge arrow flipping sides, the spark never seen; finished by accident.
  (The same complaint as the 1 Oct newcomer run: still open.)
- **Major (learning):** the loop-fix decision wasn't a decision: "Blossom" was the only word in
  the tray, so "fixed the loop first try" was earned without choosing what the engine reads.
- **Camera** pressed into Zip's head near the arch (steps 23, 45, 53, 57).
- **Two ways to collect words** (the tutorial's "Tap" circle and the "Absorb" prompt) read as
  two mechanics; the first word taken was never shown.
- Tester artifacts, now fixed in the play server: mouse taps on a phone (the keyboard hint, no
  stick until later), no camera drag, a 5 s tap timeout on a popping-in prompt ("Shield Mira!").
- One game change it caused: aim choosing between a word and the engine (introduced the same
  day) hid the plaque's word; words come first again at the pilot stone.

## Utterance test area, three cold runs (4 Oct 2026; `--start '&lab=utter' --intent utter`)

Keep playing went unsure → unsure → **yes**; fun went "mildly" → "laughed" → "fun". The lesson
for any mechanic: **a joke the player only reads is half a joke.** Every failure has to be seen
happening (the short bridge tipping into the sky), with the camera holding on it until the line
is said. Details and the changes between runs: `docs/UTTER-DESIGN.md`.

## First blind run (5 Oct 2026; utterance test area; commuter persona; build b-95a50d842d0c)

Told nothing, the tester played the obvious phrase at every place: "bridge", "long bridge",
"lantern". Every one worked first time. It put the phone down after 42 steps ("Bus stop"). The
interview took 13 questions; two were refused by the leak guard (a bug in the guard, fixed:
"number" and "score" in the rating question). It scored the game 6/10 and would play the next
part ("to see what 'sky' does and to finally try 'paper bridge'").

| Idea | How it came out |
| --- | --- |
| saying makes a thing | unprompted: "one word and one tap, and it made something real in the world" |
| words come from the world | unprompted |
| only a few words fit | unprompted but shallow: "didn't wonder what a third slot was for" |
| read in order; late words are too late | only when asked to predict ("bridge long" → "a normal short bridge… 'long' as leftover junk"), and "I'd have typed 'long bridge' anyway" |
| a cut-short phrase gets the likeliest guess | **misread**: "a puzzled comment and nothing built" |
| vague phrases get the likeliest thing | only when asked to predict |
| failures show why | only when asked to predict; **0 of 6 failures seen** |
| it's how a language model works | **missed**: "'My engine' read as a robot gimmick" |

Compare run 4 (directed, the day before), which said: keep playing **yes**, "the 3-word cap is
explained clearly", "gently fun". The blind tester never failed, so it never met five of the
eight ideas. The difference was my prompt, not the game.

What it found that the directed runs couldn't:

- The joke sign "Paper is not a building material" read as a **warning, not a dare**: "pleased
  with myself for not falling for it." Nothing says failing is welcome until the end card.
- The obvious phrase always works, so the thinking is over quickly and the walking takes longer.
- Getting lost (steps 6–26): look-alike islands, a camera that swings too far, Zip stuck against
  a signpost (steps 9–11 and 22–24, confirmed in the screenshots), and a place label stuck on
  "Inner courtyard".

Play-server fixes from this run:
- The screen text now includes everything written (speech bubbles were missing: Zip's "My engine
  reads words in order" line).
- A tap by label skips a greyed-out twin with the same label.
- Failed actions are logged in the trace.

## Blind runs 6 and 7: variant B of the test area (5 Oct 2026)

Same brief, same persona, a fresh tester each time, `--start '&lab=utter-b'`. The results and what
they mean for the design are in `docs/UTTER-DESIGN.md`. Compare runs with
`node tools/playtest/compare.mjs <run dirs> --names …`.

Play-server fixes from these runs:
- **Label matching ignores line breaks:** "✦ Speak" now finds "✦\nSpeak". Before this, testers
  tapped the orb by screen position.
- **Stick pushes can be as short as 0.2 s:** a 1 s minimum overshot a bridge entrance. The brief
  says so, and the blind check caught the first wording ("short", "small" are design words here).
- **Reports carry the area or variant in their name** (`playserver-blind-commuter-utter-b`).

The writing capture can still miss a speech bubble that is fading in at the moment of the
screenshot. The tester sees it in the picture, so the interviewer checks screenshots before
calling a quote invented.

## Blind run 8: the main game from the title (6 Oct 2026; commuter; the baseline before camera fixes)

This was the first blind run of the real game. The tester played 77 steps and stopped during the
skiff flight: "the word-engine bit was the fun part, the walking around was a slog". It scored
6/10 ("If moving around were smooth, I'd have said 7 or 8") and would play the next part, but
"I'd give up quickly if the next area has a lot of wandering before the puzzle."

| Idea | How it came out |
| --- | --- |
| premise (Zip, Mira, the Warden, the goals) | unprompted |
| it teaches how next-word prediction works | **unprompted**, said aloud at step 68: "oh it is predicting the next word. like autocomplete. I feed its guess back in" |
| sequence (the engine reads everything so far) | **misread**: predicted that "Blossom" alone would give "Isle" ("You don't need 'Skiff, rise, toward'") |
| context (only what it's given) | probed (not reached in play) |
| pieces / room | missed (not reached; pieces only from the optional card) |

Honest issues it surfaced, each now measured or fixed:

- **The camera pressed into Zip's head** near the arch: "half my screenshots were a close-up of a
  robot face". `tools/moveprobe.mjs` found it in 17 of 64 sweep frames at one arch spot.
- **The spark chase** ("Get your voice back"), the third run in a row to nearly quit here:
  - the arrow flipped sides when the goal was behind;
  - the spark hopped away four times, often behind the player;
  - the catch went unnoticed.
- **Stuck on edges and poles.** moveprobe: pushing along an edge moved 0.00 m (a dead stop).
- **The flight:** holding the stick up climbed, so the distance grew (117 m to 133 m). The tester
  thought it was flying the wrong way.
- **Testing-tool issues, fixed:**
  - a pulsing "Shield Mira!" could never be tapped, because Playwright waits for a button to hold
    still; the play server now taps where the button is, like a finger;
  - the strict phase order stopped the interviewer going back to a moment, so it's relaxed:
    recall first, the reveal last;
  - the play log now records where the player stood.
- **Design:**
  - the loop puzzle never makes the player compare "the last word" with "everything so far", so
    that misconception survives;
  - after "Now it feeds itself…" the engine takes only one step;
  - pieces are taught only by an optional card;
  - the hint ("name, then action, then way") made the engine feel like a pattern check rather
    than prediction.

## Blind run 9: lab variant B with working memory (6 Oct 2026)

Word order came out unprompted for the first time. The ring kept the failed phrase, so the natural
fix put "long" after the bridge, and it was too late. The engine's guess was misread again
(4 of 4 runs), and working memory never bit, because no phrase needed four words. Details are in
`docs/UTTER-DESIGN.md`. `compare.mjs` now has a run-by-run table for the lab.

Testing-tool note: the 3D word labels in the scene (on signs and objects) aren't in the play log's
text, because they're drawn in WebGL, not the page. The interviewer checks the screenshots before
calling a quoted word invented.

## Blind run 10: the next-word lab (6 Oct 2026; `--intent ngram --start '&lab=ngram'`; commuter)

This was the first run with the new interview (experience items, metrics). The tester stopped
after 31 steps ("Cute. Autocomplete as magic words. Wish there was more."). Without being asked,
it named the idea as predictive text, and it called choosing "lantern ×1" over "plane ×4" "the
most satisfying moment". It also found three real problems:

- **A word from the next platform could be tapped from across the gap.** It absorbed the
  builders' song before the first place. That skipped both lessons: "bridge" alone crossed the
  first gap, and "long bridge" was already the favourite at the second. It never met the
  frequency lesson (`more`: missed) or a funny failure. **Fixed:**
  - tapping a word now reaches 5 m in this lab (`LabVariant.reachTap`);
  - taps don't absorb while a made thing is being shown. A tap during the shot had looked like
    the cause of the bridge.
- **Zip's reading line contradicted the ring.** After the song he said "Now my engine knows
  what comes after 'bridge'", but the ring said nothing comes after it. **Fixed:** the reading
  line always names the pairs it learned.
- **"Mira would laugh"** at the end means nothing in a lab. The lab now has its own end line.

**Testing-tool lesson:** the interviewer's "What were you thinking in the first minute?"
tripped a safety filter on the AI tester twice. That ended its session after two answers, so
the interview was only recall. The question now reads "What did you make of the first
minute?", and the brief says never to ask an AI player about its "thinking". Findings were
graded from the two answers and the log, and the report says so.

Metrics: 31 steps; first progress at step 7; one stall (steps 1–5); no repeated taps.
