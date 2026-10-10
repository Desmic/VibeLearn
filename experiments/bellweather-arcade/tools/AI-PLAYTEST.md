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

1. **Start a session:** `node tools/playserver.mjs --input touch --persona commuter|explorer|rarely|student
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

Blind personas live in `tools/playtest/personas.json` (commuter, explorer, rarely, student, all aged 19–22 since 10 Oct: the target audience is early twenties): who the
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

## Blind runs 11 and 12: the next-word lab after fixes (6 Oct 2026; commuter)

| | run 10 | run 11 | run 12 |
| --- | --- | --- | --- |
| make, reads, next, steer | unprompted | unprompted | unprompted |
| frequency | unprompted | when pointed at | unprompted (the top-three cutoff still missed) |
| more (read more to make it likelier) | missed | probed, weak | **unprompted**: "now 'bridge' beats 'way'… that's when it clicked" |
| model | unprompted | unprompted | after the reveal ("I'd have said it's like predictive text") |
| felt: reading / funny / clever | unclear / unclear / felt | felt / not / asked | felt / **not** / **not** |
| keep playing | — | 6/10, yes | 6/10, yes |
| steps; first progress | 31; 7 | 63; 17 | 53; 8 |

**What run 11 found, and what changed:**

- **Twelve steps lost at the first edge.** In this lab you need a word before you can speak,
  and nothing said so. Now the goal reads "Absorb a word from a sign", and the beacon points at
  the nearest one, until Zip carries a word. In run 12, first progress came at step 8, not 17.
- **"The camera kept spinning", the top complaint.** I measured it. The play server now records
  where the camera faces, and the metrics list every 30°+ turn the player didn't make (a replay
  of run 11's moves showed walking never turns the camera). The turns all came from speaking:
  - a cut to a front shot when the ring opened;
  - a side-on shot of the made thing;
  - an instant snap back.

  Changes:
  - the lab no longer cuts when the ring opens;
  - the camera eases back after the shot (`turnTo`);
  - after run 12 (two turns of 80–110° per speak), the shot now comes from behind Zip and about
    35° to the side;
  - the camera's way back is aimed from where Zip spoke. A player who walked on during the shot
    had passed the next platform's centre, so the camera turned right round (174°).

  Replaying run 12's own moves on the new build, the largest turn the player didn't make is 74°.
  Before, turns of up to 174° came from the same moves.
- **"Treated the numbers as decoration."** Changes:
  - each bar now has two colours: what the engine came knowing, and (gold) what Zip has read;
  - when reading changes a favourite, Zip says so ("Now 'bridge' beats 'way' after 'long'"). In
    run 12, that line is the moment `more` came out unprompted.

**What run 12 found, and what changed:**

- **The three-word cutoff was never met.** The tester read every sign before speaking, so
  nothing it needed was ever too rare. Even when pointed at it, the tester hadn't noticed the
  dimmed words.
  - Now the doorway needs both signs there: with only the note read, "lantern" is too rare to
    say after "paper", and the lantern hook makes it sayable. The last place now needs what the
    first two taught, as run 9's tester asked.
  - This isn't forced failure. A player who reads both signs first just sees "lantern ×3 +3".
  - The "too rare to say" line is now real text (it was a CSS pseudo-element, so the play log
    couldn't see it and the leak guard refused it).
- **"Wrong felt like nothing happens."** A phrase that makes nothing ("rope burns", "long ago")
  now appears over the place as glowing words, hangs, and tumbles into the sky.
- **The reading lines went by too fast.** They now stay on screen for as long as their length
  needs.
- **A shared word was carried twice** (two signs say "paper"). This left a stray chip in the
  ring. Echo now never carries a word twice.
- **Still open:**
  - The puzzles feel easy ("find the sign, say the obvious pair"), and no tester has pressed
    "let it finish…".
  - The end card's stars weren't understood, and there's no replay.

## Blind run 13: the next-word lab, round 3 (8 Oct 2026; commuter; 6/10, yes)

**What came out unprompted:** all seven intent items before the reveal ("basically a cute way
of showing how a next-word predictor works"). The top-three cutoff still came out only when
asked. The 6/10 has two causes:

- a rough start. Steps 1–19 were spent at the far edge: the two signs were behind where Zip
  starts, and the words across the gap were drawn bigger. "Might well have quit on a bus."
- "Fairly easy once I understood the rule." No silly outcome ever happened, because the
  tester picked every word and never let the engine finish ("felt more like a word picker with
  stats").

**Changed after run 13:**

- **The start.** Zip now starts at the back of the first platform, with both signs ahead of
  him. Words out of tap reach are drawn small and dim, so the ones here read as the ones to take.
- **The goal arrow.** Testers kept tapping it. Tapping it now turns the camera to the goal (in
  the main game too).
- **Ties at the cutoff are sayable.** "noodle ×2 greyed while ago ×2 could be said" read as an
  arbitrary minimum. The rule is now: its top three, plus anything tied with the third.
- **"Let it finish" is offered.** The first time a first word goes in, Zip says: "Now pick what
  comes next. Or let my engine finish. It has opinions."
- **A short rope or stone bridge says what it was.** It used to say just "A bridge", which made
  the tester doubt that "rope" did anything.
- **The end card** explains the stars and has a **Play again** button.

## Blind run 14: the main game, after the v79 camera and movement fixes (8 Oct 2026; commuter; 6/10, yes)

Run 8 (6 Oct, the baseline) never got past Stop 1. Run 14 went from the title through Stop 1
(it woke the skiff and flew it) to the Blossom Isle satchel in 79 steps.

**What landed:**
- the story and setup, unprompted (Zip, Mira, the Warden, the lost voice, the skiff);
- the subject, unprompted ("teaching you how AI predicts the next word");
- the loop, unprompted and solid ("the guess gets dropped back into the ring, so the next guess
  can see it too");
- the humour ("is this Mario?").

**What didn't:**
- **The middle was a slog:** "fighting navigation for about one minute of the actual clever
  bit". Hunting the three words took 28 steps; the tester never noticed that words float over
  people.
- **The Gate lesson came out backwards.** Zip's line "No Stream in there. Just rules. That's
  what I'd be, without it" made the Gate the dumb one and the engine the clever one.
- **The guess never visibly changed** when the ring's words changed, so "it uses everything in
  the ring" was assumed, not seen.
- **Camera:** about 30 big turns the player didn't make. I added attribution, measured by
  cause:
  - many were the new goal-arrow taps (wanted) and dialogue or flight shots (expected);
  - but plain walks in town turned the camera 54–62°: the "whiskers" that swing the camera
    away from walls. Since the stick follows the camera, the walk bent with it ("walking
    forward sometimes put the goal behind me").
- **Zip as a dithered ghost.** During the lantern dialogue Zip stayed a ghost: his near-camera
  fade only updated in the follow camera, not in directed shots.

**Changed after run 14:**
- **Whiskers:** they now act only when the camera is really pinned (under 1.8 m), and turn at
  most about 34° per squeeze, then just pull in close. The same walks now turn 34° at most,
  down from 62° (`tools/_camwhy` replay, kept in `/tmp`).
- **Zip's fade** follows the camera whatever moves it.
- **The Gate line** is now "A talking gate. It only knows what you hand it." / "Same as my
  engine, really. Better notes, better answers."
- **The goal arrow** levels the view as well as turning it (it could leave the camera looking
  at the floor).
- **The play server** now records why the camera turned (shot, dialogue, goal arrow, glance,
  whisker, walk) and lists the cause beside each turn in the metrics.

**Then (9 Oct, Desmic: "proceed with suggestions"):**

- **The word hunt.** The tester had tapped the "TAP" label under a far word three times with no
  result: the label sits below the word, outside its small hit sphere.
  - Now a tap within about 4° of a word takes it.
  - Zip's first thought on seeing words now ends "Could I just… tap one and pull it in?", so
    the far tap is learned instead of walking to every word.
- **The guess changes visibly with the ring.** While the ring is being edited, the hologram
  shows, dimmed, what the engine would say for the words in it now, before casting:
  - "um / the / …" for a partial ring;
  - "Blossom? 72%" for the full command;
  - in the loop, "petals?" for "Blossom" alone against "Isle? 86%" for the whole sentence.
- **Depth in the test area.** The lab has a fourth place, the lighthouse (see
  `docs/UTTER-DESIGN.md`).

## Blind runs 15 and 16: everything, end to end (9 Oct 2026, build v84)

| Run | What | Persona | Steps | Reached | Score |
| --- | --- | --- | --- | --- | --- |
| 15 | main game | explorer | 191 of 200 | Loom Isle (Stop 2), first time ever | 6/10, "I'd go straight back to the loom" |
| 16 | next-word lab | commuter | 71 | all four places, lighthouse lit | 6/10, yes |

**Caveat for run 15:** the tester's screenshots failed to load (an image limit in its own
session) until about step 114. It played the opening, the engine and the flight from on-screen
text only. Visual findings from that stretch are discounted. Very long runs should be split into
parts.

**What landed:**
- **Main game:**
  - the premise, Mira and the voice;
  - the loop, unprompted and firm ("autocomplete that feeds on its own output"); the broken loop
    was "the click".
- **Lab:** seven of eight lesson points came out unprompted. That includes the new one, `habit`,
  at the lighthouse: "it loves paper plane. I need to feed it more lantern so lantern wins".
  Noodle and paper plane made the player laugh, and the lighthouse "made me think".

**What held both at 6, in order:**

1. **Spots you must stand on exactly.** "Use the Word Loom", "Use the relay" and "Take the note"
   only show on a small spot:
   - The Loom's spot is 2.9 m from the goal marker, but its button radius is 2.0 m. Standing at
     the marker shows no button.
   - Zip's line "Somebody's humming behind that cloth" fires at the same moment the button first
     shows, and drew the player away. They never found the spot again and put the phone down.
     Stop 2 taught nothing.
   - The relay had no button for 12 steps while the player was "right at the relay".
   - The notes took about 35 steps.
2. **The camera.** Both named it as the reason they stopped, or the reason the score wasn't
   higher. By cause:
   - **goal glances:** the camera turns to each new goal even when it's already on screen;
   - **speak shots and the cut back:** two big turns per phrase in the lab;
   - **the goal arrow:** its turn doesn't stay put once you move.
3. **"Only says its likeliest few" doesn't read on screen.** With ties sayable, four words show
   above the "too rare" line, and it read as "seen once means locked". Run 13 read the opposite
   rule (an arbitrary cut). The tie rule needs showing, not just a line.
4. **No arrow during "Read the notes. Take up to two."** The goal has no marker.
5. **Context is read as "trust your sources".** The satchel isn't seen as the engine's input
   until the reveal. Pieces and room were never met (the Loom was unreached).
6. **The journey reads as "chase Mira", not "repair Zip's engine".** The player asked to see the
   engine mended after each isle.
7. **Puzzles that confirm rather than test:**
   - the relay's "tap the words it should read" was answered "by reflex";
   - three of the four lab places were "say what the sign said".
8. **Small things:**
   - the star banner's button vanished before the tap twice;
   - Speak looks disabled with fewer than three words;
   - a word tap landed on another chip while the ring was still opening ("tapped paper, got
     long");
   - the lab never says the link to language models out loud;
   - the title-screen hook (Pim's line) is never paid off.

**Changed after runs 15 and 16 (9 Oct, Desmic: "move ahead with 1–4"):** each measured first, then
fixed, then measured again.

1. **Buttons where the marker is.** New probe `tools/reachprobe.mjs` walks at each station's goal
   marker from eight sides. Before: the Word Loom showed its button from 2 of 8 sides (the walk stops
   at the loom, 1.7 m from the marker, but the button sat on a spot 2.9 m away); the Gate from 5 of 8.
   - The Loom's button now belongs to the loom itself (3.8 m round it, covering the talk spot).
   - The Gate's reach is 2.8 m, the relay's 3.0 m (its "notes pinned" label used to show at 3.2 m
     while the button needed 2.2), the notes' 2.2 m.
   - Zip's loom line now points at the loom: "Somebody's humming inside it. Only one way to find out."
   - After: 8 of 8, 4 of 4 (all walkable sides), 8 of 8.
2. **The camera.** New probe `tools/camprobe.mjs`.
   - A new goal already on screen turned the camera 14°; now 0°. A goal behind still gets one glance.
   - The goal arrow's turn holds while walking at it (4° off after 1.5 s): measured, no change needed.
   - Back from Mira's first line, the camera came back 0.9 m from Zip, pressed into the planter
     behind him, with Zip faded to 45%. It now comes back on the nearest clear side (5.9 m, Zip
     drawn). The play server counts this turn as `resume`.
   - Lab speak shots now pull back along the player's own view instead of cutting to a fixed side
     shot. Measured per phrase in `tools/ngramlab.mjs`: 50–97° into the shot before, 7–25° after;
     the turn back is now made only when the view is far off the way on (one 89° turn, after the long
     bridge, toward the far side).
3. **"Read the notes" has an arrow:** it points at the nearest note not read yet, and moves on as each
   is read.
4. **Small things.**
   - The star banner waits 8 s plus 1 s a row (was 3.8 s plus 0.5 s), shows the time left draining on
     its button, and holds while touched.
   - The ring says "Ready to speak · or add what comes after “paper”" instead of "1 / 3 words".
   - The ring's buttons hold still once it is open (they followed the camera while it settled).
   - At the end of the lab Zip says it out loud: "That's how chat AIs write, by the way. One likely
     next word at a time." / "Same trick as my engine. Mine read six signs. Theirs read half the
     internet."

**Found on the way: tests weren't playing the shipped town.** The test entry (`GAME.testEntry`) left
out the hosted game's settings (the atelier conservatory, the crafted portal and others), so every
harness tool and every blind tester played a different town from the one players get. Claude,
playing the shipped game on Desmic's PC by computer use, got stuck for about four minutes in a
dead-end alley between the conservatory's east wall and the town edge, by Mira's tree; it only exists
in the shipped town. The alley is now closed, the test entry carries every hosted setting, and
`kitcheck` fails if it ever drifts again.

**Pixels-only testers.** `playserver --pixels 1` gives a blind tester only the screenshot (no page
text, no button list) and taps by position (`tapAt`), with its own brief
(`tools/playtest/tester-pixels.md`, guarded by `blindcheck`). Text-and-buttons observation sees more
than a player does.

**Native computer use as a tester (tried 9 Oct).** On Desmic's PC, browsers are view-only to
computer use (checked, and Anthropic's docs agree), so the game was opened in its own window
(`tools/desktop/play.cmd`, an Electron wrapper) and played for about 7 minutes while Desmic watched.
It works, but it is a desktop keyboard (one key held at a time, no diagonals), a few seconds per
action, it takes over the PC, and the game's metrics aren't read. Verdict: keep the cloud play
server as the blind tester; use computer use now and then as a short real-PC check.

**Desmic's calls on the rest (9 Oct), and what changed:**

5. *"For a game the rule is show not tell."* The tie rule is now shown: in the word ring, words read
   equally often share a row (`ngramlab` checks it). No explaining line added.
6. *Satchel as context: "yes if it makes sense."* Shown, not told: when the Gate reads, each note
   leaves the satchel as the same hologram Zip's words are made of and flies along a beam into the
   Gate, the way Zip's engine reads its ring.
7. *"Chase Mira is the bigger picture; once the speech engine repairs are complete we can move to
   other challenges."* No per-isle repair display. The game's intent item `story-journey` now says
   getting Mira back is what the journey is about, and mending the engine is its first part.
8. *Puzzles that test: yes.* The lab's wide gap no longer has its answer on a sign. The song says
   "long rope", the coil says "rope bridge", and the gap needs "long rope bridge": the engine joins
   pairs it read in different places, so the player has to work out a phrase nobody wrote.
   `ngramcheck` proves it solvable in all 24 reading orders and unsolvable without the song.
9. *Pim's title line:* not a gap. The game isn't finished, and the title screen's jokes are about the
   real world (the AI race, tech, humanity), not a setup to pay off. Interviewers shouldn't count
   it as one.

## Blind runs 17 and 18: after the fixes (10 Oct 2026, build v86)

Same setup as runs 15 and 16 (text-and-buttons observation, same personas), so the scores compare.

| Run | What | Persona | Steps | Reached | Score |
| --- | --- | --- | --- | --- | --- |
| 17 | main game | explorer | 161 of 200 | Loom Isle done ("That's Stop 2 for now") | **7/10** (was 6), yes: "I genuinely want to know where Mira is" |
| 18 | next-word lab | commuter | 83 of 120 | all four places, lab done | 6/10 (same), yes, "probably one more session" |

**Camera turns the player didn't make (30°+), by cause:**

| Run | shot | glance | goal arrow | dialogue | whisker | walk | resume | other |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 15 (v84) | 9 | 7 | 7 | 1 | 1 | 1 | – | 3 |
| 17 (v86) | 15 | 19 | 1 | 1 | 1 | 2 | 1 | 2 |
| 16 (v84, lab) | 5 | 5 | 4 | – | – | – | – | – |
| 18 (v86, lab) | 0 | 4 | 6 | – | – | 1 | – | – |

The lab's speak shots are gone (5 to 0). In the main game the glances rose (7 to 19) on a longer run;
they need attributing before the next fix (the word hunt and the isle are the likely sources).

**Run 17 (main game):**
- **Landed unprompted:** every learning item and every story item. The Loom ("short isn't the same
  as small"), the relay's conflicting notes ("made me actually decide who to trust"), the engine loop
  ("watching the guess turn into input… land[ed] better than an explanation would have"). The
  station-reach fixes held: no stall at the Gate, relay or Loom.
- **Held it at 7:** "most of the puzzles were over in a tap or two, with one obvious right answer"
  (the relay "felt more like confirming"; the Gate gave three stars with one note), and "a lot of my
  time went to fighting the camera". "If the puzzles had one real 'hmm' moment each, and moving around
  felt smooth, it'd be an 8 or 9."
- **Stuck:** the word hunt (steps 45–62: "couldn't tell when tapping a floating word works and when
  you need to be close"); the notes (steps 108–131: a board gave no prompt, the arrow went once all
  were read, "lost track of which boards I'd already read").
- **Asked for:** failures that play out (the poster opening the Gate onto nothing, missing words at
  the relay giving gibberish); the flight's rings and drones explained before the flight; the
  engine's percentages readable on a phone.
- **Small:** the stars banner and "Brilliant!" not tappable at steps 97, 135 and 144; speech bubbles
  stacking; "(The bridge fell in the storm.)" read as Zip's aside, not part of the note.

**Run 18 (lab):**
- **Landed unprompted:** make, reads, next, frequency, more, steer, and the whole idea in their own
  words ("basically… how a predictive-text / language model picks the next word").
- **Missed:** the top-3 rule (read as "seen once", then "relative to the top", even with ties on one
  row); the wide gap's join ("it went right past me": they took "long rope" because it was what the
  song gave); habit (reached "half a shrug, half a test", and credited the stone, not the engine).
- **Held it at 6:** the camera, signs out of reach ignoring taps silently, and the lighthouse wander
  (steps 62–75: "that's where I'd have locked the phone"). Zip's "What if it heard me say mine?" came
  after they had already said it.

**Personas corrected (10 Oct, Desmic):** the audience is 18+, mainly people in their early twenties
who want real depth and fun, a place to grow, not 30-somethings. Runs 1–18 used testers in their
late twenties to forties. The personas are now 19–22 (a new one, `student`, added). Scores from
runs 17–18 on are not strictly comparable with what comes next.

**Movement and camera, after runs 17–18 (10 Oct, Desmic: "start on 1"):** measured first, fixed,
measured again (`tools/camprobe.mjs` cases E–G, `tools/reachprobe.mjs` strip scan, `kittest` nav).

- **Where the self-turns came from.** The game now logs why the camera starts each turn of its own
  (`__vlCamLog`: a new goal off screen, or the goal arrow), and the play server records it per step.
  Replaying run 17 showed the glances were one per new goal plus the arrow taps: run 17 simply went
  further (more goals) than run 15.
- **"Turn toward the goal pointed at a glass wall".** The arrow, and the glance at a new goal, now
  face the way to go on foot (a path round walls, `kit/nav.ts`), not the goal through a wall. With
  Mira behind the conservatory: 6.2 m closer after the tap and 2.5 s of stick, against 4.7 m
  sliding along the wall before.
- **Tap-to-walk "sent me to odd places".** Two causes. A tap now walks a path round walls instead of
  a straight line into them. And on the raised Loom Isle the tap met a ground plane five metres below
  the isle: a tap 3 m ahead sent Zip 10 m off; now 0.3 m.
- **"A dithered mess".** Pressed against a wall, the camera now rises 1.3 m over Zip (was 0.55)
  and looks down. Across town (every walkable spot on a 1.5 m grid, eight headings) Zip was faded
  in 10.8% of views; now 5.4%.
- **Wedged.** A scan for body-wide strips found three more along the town's east edge (behind the
  building blocks) and three gaps between Blossom Isle's edge trees and its rim. All closed; the
  scan is now a check.

**Idle flicker (11 Oct, Desmic on his PC):** characters popped to their rest pose for one frame
about once a second while standing still. Found with a per-frame log on his GPU
(`tools/desktop/flicktest.cmd`), fixed in `kit/pose-hold.ts`; escape `qe-rest-pose-pop`.

**Puzzles that test, not confirm (11 Oct, after run 17):** run 17 held the game at 7 because "most
of the puzzles were over in a tap or two, with one obvious right answer" (the Gate gave three stars
with one note; the relay "felt more like confirming") and asked for failures that play out.

- **The Gate.** No single note opens it toward Mira any more. Her page is torn: it says where she's
  going ("…then up the stairs to the bell gardens") but not the way. A new keeper's notice (in
  place of the scribbled note) gives the way ("Old Bridge closed since the storm. Take the Lotus
  Terraces stairs") but not where. The old poster agrees with Mira about where and gives a way that
  no longer exists, so Mira's page + the poster is the tempting wrong pair.
- **Every wrong pair plays out where its notes point**, painted in the arch (`src/gate-view.ts`):
  the poster opens the Gate onto empty sky where the bridge was, a last plank falling; Mira's page
  alone climbs stairs into fog; the keeper's notice alone climbs to an empty landing. The Warden's
  sign still drops a cage; the poster with the keeper's notice ("cross the closed bridge?") and
  Mira with the Warden still make the Gate dizzy.
- **The relay.** The line is jammed: between Zip's words the relay also heard the Warden's
  "Surrender." Tapping every word (the reflex) feeds it the Warden's word, and it babbles it back
  ("Mira, surrender, surrender…" / Mira: "Zip?! Never!"). The right answer is Zip's message so
  far, newest word included, without the Warden's.
- **The notes arrow** now leads round every unread note before it points at the Gate (with one note
  taken it used to point at the Gate at once). The speedrun's rules-led player found it, and now
  looks round for a needed note when the goal points elsewhere, since a goal mustn't give the
  answer away.
- **Voiced:** 11 of the Gate's 12 lines (the Gate had none; the free daily quota stopped the last).
- **Checked:** rulecheck (solvable, a perfect run exists), rules parity with the server's engine,
  flowcheck's isle and relay (now played the wrong way first: the tempting pair, then every word),
  reachprobe, speedrun, timing. Not yet blind-tested.
- **Still open** (`design/stop1-learning-design.json` known gaps): the relay's channel is still
  spelled out on its pinned note ("Lantern channel 7"), so choosing it is close to copying.
