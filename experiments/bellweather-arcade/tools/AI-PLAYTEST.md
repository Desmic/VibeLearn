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
   If the machine restarts after play and before the interview ends, start it again on the same
   folder with `--resume 1`: it reads the play log and the interview so far and serves only the
   interview (no game opens).
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

## Blind run 19: the main game after "puzzles that test" (11 Oct 2026, build v90; explorer, now 21)

Same setup as runs 15–18. **6/10** (run 17: 7), not sure / leaning yes ("I want to see the Word
Loom and what happens with Mira"); "with the camera fixed and clearer Gate feedback, an 8". Put the
phone down at step 188, at the Gate, never having opened it.

- **Landed unprompted:** the engine and the loop, the strongest result yet: "each output word gets
  added to the end of the input, and the whole thing is used to guess the next one"; asked what
  "Blossom" alone would give: "it uses everything in the ring, not just the last word". Mira taken,
  the voice knocked out. Liked: the engine ("the moment I actually leaned in"), Zip's lines, the
  Warden in Zip's head, the world, the skiff's stars.
- **The Gate failed, and the trace shows why:** they **never read Mira's torn page** (its board, far
  left, never appears in the trace), so they never had the "where". They tried the keeper's notice
  alone ("a place would be nicer") and then the keeper's notice with the poster (the clash), and said
  "there has to be another note somewhere that names an actual place". The arrow had already stopped
  leading to notes (it counts a note as read when Zip passes in reach, not when its text was on
  screen), and after a failure the goal has no arrow at all.
- **The guess teaches nothing on its own:** "my picks all got the same reply". A right guess shows
  "Good call!" and then the Gate fails anyway; they read the Gate as a quiz about the route.
- **Context came only when pointed at** Zip's "Better notes, better answers" (step 134), which had
  appeared on top of the Warden's sign label: then the poster-only and Warden-only predictions were right.
- **Stuck:** finding Mira (steps 4–41, camera into planters, forward walking at the camera); two
  townsfolk blocking a walkway (101–109, escaped with "Return to arrival"); the satchel hidden under
  the thumb-stick circle (136–148); hunting the notes (150–164); the Gate (170–188).
- **New:** the menu's chapter list spoiled the story ("The Warden takes Mira" read at step 38).
  The flight's one star read as "you didn't know these were the goals" (drones never seen, rings
  hard to see against the clouds).

**Changed after run 19 (11 Oct, Desmic: "makes sense, continue"):**

- **A note counts as read once its text has been on screen for a moment** (1.2 s), or when it's
  taken; passing in reach no longer counts. The arrow leads to unread notes again after a miss.
- **The guess sits with the notes:** "You said: Old Bridge" in the satchel strip, marked ✓ or ✗ the
  moment the Gate goes where the notes say. A right guess followed by a miss brings Zip's "Called
  where it would go. So the guess was fine. It's the notes." The old "Good call!" toast is gone.
- **Zip's "Same as my engine, really. Better notes, better answers."** now comes after the first
  miss, not on arrival on top of the Warden's sign. "A talking gate. It only knows what you hand
  it." stays on arrival.
- **The Play tab gives nothing away:** chapters are places ("The outlook", "Blossom Isle"), and the
  labs are named by where they are, with no line on what they teach.
- **The blocked walkway:** the chatting pair now stands on the open terrace, and the rail strip and
  dead-end alley behind the west planters are closed. New in `reachprobe`: with and without the
  townsfolk, nothing is cut off, and no townsperson lengthens the way past them by more than 4 m
  (shown to fail on the old placement: 7.2 m became 14.4 m). Escape `qe-npc-blocks-way`.
- **Not changed yet:** the flight's rings and drones, the camera.

## Blind run 21: the main game on v91 (11 Oct 2026; student, 19)

Put the phone down at step 178, at the Gate ("no idea where another note is, im just walking off
cliffs now. done for today"). **No interview:** the session's machine restarted before it began
and the play server's state went with it, so there is no score; this entry is from the play log.

- **The engine landed again, unprompted:** "oh its guessing the next word, like autocomplete. Blossom!"
- **They reasoned about the notes well:** "thats last years poster, out of date. I want the keepers
  notice instead"; "the warden sign and old poster would send me the wrong way". With the keeper's
  notice alone the Gate asked for a place; "the warden sign is the only one that names a place. sus
  but ok" → the cage (a fair failure that played out).
- **Same cause as run 19: they never read Mira's torn page.** The arrow had counted it read: it
  showed while they walked past between two observations (the 1.2 s rule counted time walking).
  Two players in a row missed the one note that names Mira's place.
- Also: "the gate is literally right there and I cant reach it" (pushing into the hedge beside the
  arch, 3.2 m from the talk spot); the camera; flying away from the isle.

**Changed after run 21:** a note counts as read only while Zip stands still with its text on
screen (1.2 s); Mira's board has her festival lantern hanging on it, the same paper lantern Zip hung
on the skiff for her, so the board that matters is marked without a word.

## Blind run 22: the main game on v92 (16 Oct 2026; commuter, 22)

**6/10**, not sure / leaning yes ("I'd give it one more bus ride for the story and the puzzles, and
I'd drop it if the walking around is still that fiddly"). Put the phone down at step 112, just after
landing on Blossom Isle ("Loved the word-engine bit, but I keep losing things behind me and getting
stuck on scenery"). The interview stopped after the teach-back when the machine restarted again;
the rating was asked of the same tester afterwards, with no reveal.

- **Landed unprompted:** the story hook (Mira taken, the voice gone, "a villain who's oddly fine
  with you thinking"), the humour, and the engine: "it guesses one word at a time from what's
  already there, then feeds its own guess back in to guess the next one"; asked about "toward"
  alone: "it reads the whole sentence so far, and more words means a sharper guess".
- **Context, probed (never reached the Gate's decision):** expected it to "take whatever notes I
  carried at face value… no checking whether they were true"; "maybe that an AI only works from
  what's put in front of it".
- **Weak:** the voice coming back coil by coil ("a cute robot word for a chunk of voice"); the
  villager's "That ship took Mira!" went past them; "toward" tapped from afar didn't count (steps 44–52).
- **The getting about, a third run in a row:** "about half my time went on the camera diving into
  the ground, walking past things so they ended up behind me, a 'turn toward the goal' button that
  only turns you partway, and getting stuck on scenery". Step 13: wedged in the V between the
  chatting pair (1.1 m apart after the 11 Oct move), the camera squeezed over Zip's head looking
  straight down. Small: the "Brilliant!" button gone before the tap; "spotted by drones" with no
  drone seen.

**Changed after run 22:** the chatting pair stand close (no V to walk into); tapping the goal arrow
lays a trail of light along the way round walls, from Zip's feet, so a turn toward the way rather
than the goal reads as a route, not a half-turn.

**Where the three runs since 11 Oct agree:** the engine lands every time, unprompted; the Gate's
lesson comes out when asked, but no player has yet opened it (two never read Mira's page, one never
got there); and getting about, the camera above all, is what each one would put the phone down for.

**Camera, measured after runs 19–22 (17 Oct, Desmic: "go ahead with the fixes"):**

- **"The camera diving into the ground" / "a top-down view of my own head".** Not the camera going
  low (no view in town or on Blossom Isle ever had the lens under 0.45 m), but looking straight down:
  with the camera tilted fully down (a drag), 10.1% of town views sat more than 60° above Zip's head,
  because when pressed against something it rose 1.3 m over him. It now rises only as far as a 55°
  look-down allows, and a drag tilts down to 0.75 rad (was 0.9). Now 0 of 376 (new `camprobe` H).
  The price: when pressed in close, Zip fades a little more often with the camera tilted fully
  down (at the usual tilt, unchanged at 5.6%).
- **"Stuck on scenery".** A push at 45° into every edge in town and on Blossom Isle slides along it
  (1 of 184 pushes stuck in town, 0 of 199 on the isle): the sticking players felt was the view and
  the wedge between the chatting pair, both fixed.
- **"Only turns partway".** The trail of light after the arrow (above).

## Blind run 23: the main game on v94 (16 Oct 2026, interviewed 23 Oct; explorer, 21)

**7/10, yes** ("If moving around felt as smooth as the puzzles, I'd say 8 or 9"). Played all 199
steps to the Word Loom, the first player to open the Gate: first try, by reasoning ("Mira says up
the stairs; that matches the keeper… the Warden is lying about East Falls"), and to call Mira first
try. The container restarted between play and interview for the third run running; the play server
now picks a finished run back up from its folder (`--resume 1`), so the interview went ahead.

**How far to trust it.** In the interview the tester said the screenshots reached it only from
about step 99 (earlier ones came back "media removed: request limit") and withdrew its early visual
remarks. The play log says otherwise: what it said at the time matches the screenshots (step 23,
"camera keeps diving into my own head": the shot shows the lens pressed into Zip against a lamp post
at the outlook, just after the arrow turned it; step 64, the percentages). Its context keeps only
the latest hundred or so images, so by the interview the early ones were gone and it concluded it
had never had them. The early complaints stand; its memory of the first half is thin. Open: keep a
tester's screenshots within that limit (fewer, or smaller).

- **Landed unprompted:** premise, Mira taken, the journey, what it teaches, the loop ("you do the
  feedback loop by hand once before it runs on its own"), the Gate ("It only opens where the notes
  you hand it say to go"; "an AI that can only work from what you put in front of it"), the relay
  ("the next word depends on what you let it read").
- **Partial:** whether the whole ring or only the newest word shapes the guess ("If it only looks at
  the last word… If it uses the whole ring…": couldn't say). After the reveal, on the Gate: "I framed
  it as 'pick the trustworthy notes'… not the Gate being blind to the truth"; they never saw a wrong
  opening. "The first-try stars steered me away from the instructive wrong answers."
- **Missed:** the voice coming back coil by coil, and that it wakes the skiff ("the voice thread had
  gone quiet"). Pieces and room: never played; guessed from what they knew of tokens.
- **The getting about, a fourth run:** "the thinking parts pulled me in, and the moving-around parts
  nearly pushed me out." On the isle: 36 steps on the notes ("they're all the same little
  signboard"), "turn-toward-goal just shoved my camera into a tree" (step 165, the screen all
  blossom), "Camera spins every time I strafe" (step 151; the play log shows no turn while strafing:
  the turns were a 119° glance when a note set a new goal, step 154, and the arrow), and "Stuck on
  this tree… walking isn't moving me" (steps 178–180; also 148–149).
- **Relay:** left "Surrender." out because it "looks dodgy, different colour", by its style, not by
  what the relay should read; never saw the word the relay made ("it cut to Mira").

**Changed after run 23 (23 Oct), each measured:**

- **Pockets.** New reachprobe check: the game's own push from every walkable spot on Blossom Isle
  (0.25 m grid, 16 ways); a spot stuck across a 45° cone fails. It found five, the run 23 spot among
  them ((-4.5, 40.3): a tree and a rock 1.16 m apart by the rim). Round solids on an island closer
  than Zip's width plus 0.55 m are now one solid, and one that near the rim gets a low mound sloping
  off along the edge: **0 pockets on the isle**. The town has three against walls (a warning).
- **The lens in a crown.** The fade judged a tree by its trunk; a crown is wide. It now fades
  anything the lens is in or within 0.8 m of. New camprobe I (every isle spot, four headings):
  1 of 304 settled views left the lens in a drawn crown, now 0; the
  run 23 case was mid-swing, which a settled view samples only by chance.
- **No swing to a goal behind.** A new goal more than 90° round no longer turns the camera; the
  goal arrow pulses, and a tap turns (camprobe B: 0° and a pulse; a goal 60° off still gets one
  glance).
- **Four boards, four looks:** last year's poster in faded pinks under bunting, with the Old Bridge
  drawn; the keeper's notice framed and sealed, the bridge crossed out and an arrow to the stairs;
  Mira's page torn (and her lantern); the Warden's dark sign. Pictures, no words.
- **Relay:** the Warden's word looks like the others; on the right send the relay makes its next
  word into the gap ("Zip.") before Mira answers; the star reads "Sent just your own words".

**Changed after run 23, part two (24 Oct, Desmic: "keep making improvements… surprise me"):**

- **New orders at the Gate.** With the Gate open toward Mira, a Warden drone plucks his sign off its
  board and plants it in the arch. The Gate: "New orders, pal! … So where will I open now?" East
  Falls / the bell gardens, where Mira is / nowhere, it's a lie / can't tell. Whatever the player
  says, the arch opens onto the East Falls and an empty cage swinging over the water, and the Gate
  answers the guess ("The bell gardens? That's where she IS. I don't know where she is. I know what
  my note says."; "I can't tell a lie from a lettuce, pal. I read, I open."). Zip pulls the sign
  out; "Note to self: whoever writes the notes runs the Gate." A new judged decision
  (`literal-prediction`, Gate rules v2) that tests the misconception run 23 kept after the reveal,
  after success and without forcing a failure. Voiced (8 Gate lines, the one left over included).
- **The flight, measured first** (new `flightprobe`: four kinds of pilot, rings of 7):
  | pilot | before | after |
  |---|---|---|
  | hands off | 4, landed 19 s | 5, 19 s |
  | full speed held | 3, 17 s | 4, 17 s |
  | in long pushes (as testers fly) | 1, **never landed in 120 s** | 2, landed 73 s |
  | taps the goal arrow | 3 | 5 |
  Steering eases in and turns at most ~55°/s (was 86°/s at once: a two-second push swung the
  skiff right round); the wind keeps helping while a push agrees with it; near a ring the wind
  draws the skiff in; in the air the goal arrow turns the skiff onto the lane (it turned a camera
  that the flight doesn't use); the camera leans toward the next ring; a drifting ribbon of light
  runs ring to ring; rings are bigger with a halo on the next one; drones are twice the size with
  a blinking eye and a brighter beam.

**Open after run 23:** the arrow's turn at Mira's outlook can still end with the lens pressed into
Zip by the lamp post (step 23); a first try at a probe for it measured the game's own goal rather
than the probe's, so no change was kept. The flight (steering, the wind rings and drones found only
on the results card) is unchanged. And a design question for Desmic: the first-try stars reward
never seeing the Gate or the relay go wrong, which is where the lesson shows (this player's "pick
the trustworthy notes" rather than "the machine can't tell what's true").

## Blind run 24: the main game on v96 (24 Oct 2026; commuter, 22)

**6/10, yes, probably** ("if the next area is mostly more wandering, I'd drop it pretty quickly").
Put the phone down at step 161 at the Gate, after two wrong pairs: "Liked the word engine bit and
the gate puzzle, but walking around this island to swap notes is killing me." The same screenshot
caveat as run 23 (the tester says the first ~70 never loaded; its notes at the time match them).

- **Landed unprompted:** premise, Mira taken, the voice knocked out, what it teaches, the engine
  ("give it a good start, then feed its own guesses back in"; "too few words and it just says
  'um'"), humour. **Probed:** the Gate ("it doesn't judge whether a note is true; it just follows
  whatever you give it"), though in play they picked notes by which was true and skipped the
  Warden's sign as a trap; the journey. **Missed:** Loom Isle (never reached); coil by coil.
- **Never read Mira's page** (the fourth player to miss it), so never reached the new orders.
- **Complaints:** swapping meant walking back to a board, and "Put it back" never showed (step
  154 they tapped the poster in the satchel strip: nothing happened); "Turn toward the goal… points
  behind me" (steps 9–21); "camera is stuck inside the robot" (step 63); the green ✓ beside a Gate
  that didn't open read as "I won" (step 133).

**What the play log showed that the tester couldn't:** at steps 59–62 and 157–160 stick pushes of
up to 2 s moved Zip not at all. The goal arrow, sitting at the lower-left edge whenever the goal was
behind, was on top of the thumb-stick zone and took the thumb: the push turned the camera instead.
Measured on Blossom Isle (three spots, 24 headings): **the arrow covered the stick zone in 30 of 61
views.** Likely behind much of runs 22–24's "the arrow points behind me", "the camera spins" and
"stuck" (the pulse added in v95 made it bigger still).

**Changed after run 24:**

- The goal arrow stays above the stick zone and the action button: 30 of 61 → 0 (camprobe K).
- A note in the satchel strip is a button: tapped, it goes back to its board, from anywhere.
- The guess reads "Your guess: Lotus Terraces stairs · guessed right ✓" (or "· guessed wrong ✗"),
  not a bare tick beside a shut Gate.

## Blind run 25: the main game on v97 (24 Oct 2026; rarely plays games, 20)

**6/10, yes**, and the first player to finish both stops: Mira's page read, the Gate open, the new
orders, Mira called, Tavi freed at the Word Loom ("that was actually kind of fun once I stopped
getting lost. the walking around part was the annoying bit"). 222 steps.

- **Landed unprompted:** premise, Mira taken, what it teaches ("sneakily teaching you how AI chatbots
  work: guessing the next word, only knowing what you feed it, word pieces"), the Gate, pieces.
- **The new orders worked as a test.** At the planted sign they said aloud "the gate just does
  whatever the last note says… so East Falls, even though it is a trap", picked East Falls, and
  later: "these AI things only know what you hand them, and someone sneaky can hide orders in what
  they read." The clearest of the lessons, in their words. But they never saw the drone plant it:
  "the Warden's sign came back… the game didn't really show me".
- **Room, at the moment:** "doesn't count words, it counts pieces… short isn't the same as small",
  and that a cut-off end would lose "Tavi". Guessed 8 pieces for the call (it was 9).
- **Sequence, probed:** strong at the engine ("each guess goes on the end and it reads everything
  again"), misread at the relay: they left the "Channel 7." card out because the console already
  said "CH 7 · LIVE" ("felt like the dial didn't count"), and couldn't tell what the star "Sent
  just your own words" wanted, since the card isn't their words.
- **Missed, again (five runs now):** the voice coming back coil by coil, and that it is what wakes
  the skiff ("in my head collecting words was for the boat, not for fixing my voice"; "the story
  and the lessons felt like two separate things"). Left for Desmic: how the voice's return should
  show (see the report).
- **Getting about:** 29 steps to reach Mira; "the camera keeps swinging every time I move" (the
  play log shows the swings were their own taps on the goal arrow, which they used constantly);
  "am I stuck on this bush?"; and tapping the stars card's button after it had already gone on by
  itself (steps 180, 193: an AI tester is slower than the card's 11 s).

**Changed after run 25:**

- The new orders are a directed shot: from the landing's side, the camera follows the drone from
  the Warden's board to the arch (and Zip stands still meanwhile); the drone and the carried sign
  are bigger.
- The relay's word console no longer says "CH 7" (the channel card is where the channel is); the
  star reads "Sent the right words, first try".
- The satchel's notes stop being tappable once the Gate is open.

## Blind run 26: the main game on v99 (25 Oct 2026; student, 19)

**Put the phone down at step 49, before reaching Mira**, so no interview. Their words: "ugh,
camera is stuck in the flag thing", "where did my robot go… camera is lost", "this camera keeps
flipping around on me", "I keep ending up back at the entrance", and last: "I can literally see her
in the light beam and I can not get there. Pretty game but I am done." The first run to quit in the
opening since run 14. The play log showed three causes:

- **A wedge by the pilot stone** (steps 33-36): pushing along the outlook's wall toward Mira, Zip
  stopped dead for 8 s in the V between the pilot stone and the wall, 3.7 m from Mira. Reachprobe
  had found the town's pockets but only warned (sealing covered the islands only).
- **A banner that never faded** (steps 13-14): the lens sat in the east banner's cloth, solid
  blue. Its fade opacity had gone NaN in the cold open (Zip's outline behind the lens: ∞/∞), so it
  never faded again.
- **Walking past the turn** (steps 39-45): "Turn toward the goal" faces the next corner of the way
  round the big tree, 2.5 m off; the player then held forward for 3-4 s (10 m) and ended up by the
  entrance.

The neural-net engine (v99) was never reached.

**Changed after run 26:**

- Round solids against any wall or the town's edge are sealed like the islands' (the gap filled, a
  low mound along the wall on both sides); reachprobe finds no town pockets now, and fails on any.
- Faders ignore a non-finite overlap and reset a non-finite opacity; flowcheck checks every fader
  is finite after the cold open.
- After a tap on the goal arrow, holding forward follows the way round to the goal for up to 12 s,
  the camera coming round behind; at the goal Zip waits while the push is held. Sideways or back
  for a quarter second, or dragging the view, hands it back. New probe `arrowwalk` (tap, then 4 s
  pushes, from five spots): all five reach Mira either way, but in 6 pushes and 43 m instead of 10
  pushes and 92 m (measured again after the moves below; the first measure, before them, was 6 and
  45 m against 13 and 134 m).
- The fillers are kept in a 1 m grid: about 2,400 of them cost about 4 µs a walkable test.
- The neighbour who says "toward" moved from the nook between Mira, the big tree and the wall (sealed
  with them, so her word could only be heard from 2.3 m; the speedrun stalled on the skiff's words) to the
  alcove by the east wall, out of every way through.

## Blind run 27: the main game on v100 (25 Oct 2026; explorer, 21)

**7/10, yes**, and both stops finished in 164 steps; Mira reached at step 14 (run 26 never got
there in 49). "Cute. The gate and relay bits were clever." What lifted it: "the writing is genuinely
funny", the loom "caught me out with 'enchanted'", "puzzles aren't just click-the-obvious-answer".
Why not an 8: "a pretty corridor" with nothing found off the path, fiddly controls and camera, the
second flight skipped, "most of the actual play is tapping choice buttons in panels".

- **Landed unprompted:** premise, Mira, the journey, what it teaches ("secretly teaching you how AI
  language models work… like autocomplete"), sequence ("the loop that feeds each guess back in is
  broken, so you feed it back yourself"), context (the Gate "just follows whatever it's handed"; at
  the relay "only knows what's in front of it, the same lesson as the Gate"). Probed: pieces and
  room (guessed 8 for the call, it was 9: "of all the puzzles that one taught me the most, because I
  was confidently wrong about 'enchanted'"; chose the six-piece call by counting).
- **The voice coming back, for the first time in six runs:** "every puzzle you solve lights up
  another part of Zip and brings his voice back", unprompted. But from Zip's lines, not the net:
  they quoted "One coil lit. The rest of me is still dark." and "Another coil lit. Mira, I'm coming."
  and called the engine a "hologram"; after the reveal, "I saw the engine and the voice as two
  related things, not as the same thing". The play log showed why: the engine's thoughts were held
  while it was open and played mid-flight, "One coil lit" with nothing lit on screen.
- **Sequence, a gap:** asked what a ring of only "Blossom" would make, they said "Isle, less
  confidently" (it makes "petals"), though their rule was right: keep the words, add the new one.
- **Friction:** "Turn toward the goal" unclear for "go read the notes"; the camera "smashing into my
  face" once; the lantern hung from across the courtyard; the relay cleared every pick after a
  wrong send ("confused me for a second"); the flight to Loom Isle skipped ("a little
  disappointing"); stars "more like a report card than a goal".

**Changed after run 27:**

- Thoughts had while the engine is open show while it is open (Zip's thoughts were hidden there and
  queued); one from before stops as it opens, and any left when it closes are dropped. Flowcheck
  checks the thought shows in the engine.
- At the end of Loom Isle, "My voice… it's clearer. Another coil lit." plays while his net lights
  above him, not after.
- The relay keeps the picked words after a wrong send (rules v3); flowcheck checks it.
- The "rise" word moved out from behind the big tree: once the pockets were sealed, the decoy
  "sink" was nearer from every spot a player could stand on.
- The hop to Loom Isle is flown: a short lane of four rings, no drones, "Fly to Loom Isle"; hands
  off it still lands (flowcheck checks it).
- Zip's first thought at the engine names it as his voice: "My voice… from the inside? I'm
  basically a sci-fi movie." then "One coil lit. The rest of me is still dark."
- **Stray sparks** (the explorer's "nothing found off the path"): eight sparks of Zip's voice left
  in corners of the town and on the far sides of both isles, each a gold mote with a thin beam over
  it, seen from afar. Walking into one takes it: a glimpse of his net over his head, one more node
  lit, "✦ Stray spark 3 of 8". Every net shown after (the engine, the end of Loom Isle) has those
  nodes lit. The menu counts them; a new run puts them back. Flowcheck walks to all eight.
- The "How real AI differs" card ties his net to the real thing: "Real models are nets like mine,
  with billions of links." (re-voiced).

## Blind run 28: the main game on v103 (26 Oct 2026; explorer, 21)

**7/10, yes**, both stops finished in 173 steps; Mira reached at step 29. "Fix the camera… it's an
8 or 9."

- **The net, recognised at last:** at the engine, unprompted, "oh it is a little neural net.
  guessing the next word with percentages". Then "oh so I have to feed its own guess back in. that
  is how it writes a sentence."
- **Landed unprompted:** premise, Mira, the journey, what it teaches, context (strongest: "it only
  knows what you hand it, and whoever writes the notes controls it"), pieces and room (exact split
  recalled; the three-word call "about 7 pieces… words that look short can cost more"). Sequence at
  probed level: unsure whether "Blossom" was added or replaced the ring until asked; and, like run
  27, guessed a ring of only "Blossom" would still say "Isle" (it says "petals").
- **Still missed: his voice is the engine.** "I treated the voice and the engine as two separate
  things"; the coil lines and the glowing net read as flavour.
- **Stray sparks:** found the first at step 9 ("collectibles. I am getting all of them"), took a
  second at step 19 without knowing (the count toast lasts 2.2 s; an AI tester is slower), then
  "nothing reminded me". Wedged in the corner the first spark drew them into, the camera in Zip's
  head.
- **Other friction:** 27 steps to Mira; "Turn toward the goal" unclear; "did forward just send me
  back the way I came?"; the flight "over fast, barely got to steer"; each puzzle "one-and-done",
  wanting a stage that combines them. The early screenshots were stripped from the tester's context
  later, and it first claimed it never saw them (trust noted; its early mutters match the pictures).

**Changed after run 28:**

- After the skiff wakes, as it lifts off, Zip says it outright: "My first words out loud since the
  attack. That net was my voice. Every light in it is a bit more of me."
- Sparks: the count stays up 4.5 s; a faint chime the first time one is near (found by ear); on
  landing on an isle with sparks left, "Stray sparks of me out here too. I can feel them."; the first
  one says "There must be more. Off the paths, out at the edges."; the plaza one moved out of the
  corner it drew the player into.
- When the loop is repaired, unless the player already tried it: "Just “Blossom” on its own? I'd
  have said “petals”. It needs the whole line, not the last word." (runs 27 and 28 both guessed
  "Isle").
- The camera no longer sits inside a wall that is right behind Zip (the whole screen one colour):
  the lens stops just short of it, looking ahead the way he faces. Camprobe L checks town spots
  against walls at eight headings.

  (L runs in the page, as F and H do: 232 settled views in under 1.5 min. Two false alarms
  explained and fixed in the measure, not the camera: risen over a low planter the lens looks down
  over it on purpose, so the line is drawn from the risen point; and a hit on the camera's voxel
  grid alone, within its one-cell margin, is the margin, not the wall.)
- Wind rings in the flight now play a rising note for each one flown in a row (a clean line plays
  a little tune, with a chime for all of them) and bloom outward as they're flown; "n in a row"
  from the third. Run 27: the second hop felt "a little disappointing"; the flight was the most
  passive stretch of the game.
- **The flight is flown across a lane now, not by heading.** The wind carries the skiff along the
  lane and the stick slides it left and right (up to 9 m either side); hands off it drifts back to
  the middle. The rings sit off to alternate sides (the first and last on the line), so a ring is
  something to steer for. Flightprobe, before → after: in pushes (as testers fly) 2 of 7 rings and
  77 s of 30 m loops → 4 of 7, landed in 15 s; hands off 5 of 7 (the wind's pull caught them: nothing
  to do) → 2 of 7; a new "steered" player, lining up each ring, 7 of 7. The flight's second star
  (all rings but one) now takes steering.

## Beauty and awe, first pass (27 Oct 2026)

Desmic: beauty and awe are the big aspect now; the ceiling is set by good devices, and the F15 is
the floor (a lower setting of the same moment, not a smaller design). The F15 holds ~89 fps on
Medium, so there is headroom to spend.

- **The Warden's engine on the horizon** (`src/kit/far-net.ts`, game-agnostic; placed by
  `src/worlds/first-words-spire.ts`). A vast neural net stands beyond the isles, 470 m tall, its
  foot in the cloud sea: thousands of nodes in layers, links between neighbouring layers, a dark
  lattice that reads against a daylight sky, with activations climbing it in slow waves and, now and
  then, a surge from foot to crown. All motion is in the shaders (one uniform per frame), so the tier
  only sets how dense it is: 14×48 nodes on Low, 20×84 on Medium, 24×120 on High. It is where the
  ship takes Mira: the goal on the horizon (BotW's castle), and the "billions of links" of the
  engine card made visible next to Zip's few dozen.
- **The opening shows the world first.** A 4.2 s crane from out over the cloud sea, past the
  outlook, the town ahead and the engine on the horizon as a surge climbs it; then the cut to Mira
  calling. No goal marker, arrow or place label in any cutscene now.
- **The attack's departure shot** is wide, behind Zip, framed by the conservatory arch: the ship
  climbs out over the town and dwindles toward the engine on the horizon (it was a low shot looking
  straight up through tree crowns). The engine surges as the Warden says "come and get her".
- **Arrivals.** Landing on an isle, the chase camera rises and draws back to show the place (the
  Gate, the path, the isle above) before Zip steps off; the engine surges as you land.
- First time out over the sky, 13 s in: "That tower on the horizon. It's a net. Like mine, but…
  enormous. The ship flew that way. Hold on, Mira."
- Cost, measured (renderer.info, one frame of the outlook view): +7 draw calls on every tier;
  672 nodes / 1,248 links on Low, 1,680 / 3,192 on Medium, 2,880 / 5,520 on High, beside 220k-310k
  scene triangles. Flowcheck now checks that the opening has the engine in frame.

## Blind run 29: the main game on v107 (30 Oct 2026; student, 19)

First run with the Warden's engine on the horizon, the opening crane and the lane flight. Stopped at
step 141 (the end of Loom Isle); run 26 (same persona, v99) quit at step 49, before Mira.

- **Understood, unprompted, before the reveal: all nine intent items.** Next word ("one word at a
  time with each guess fed back in"; predicted that "Blossom" alone would not give "Isle", "the
  guess comes from everything in the ring"); context ("whoever writes the notes controls the Gate…
  AI trusting whatever's in its input"); pieces ("tokens"; split "Mira" as "Mi"+"ra" by the game's
  rule). Teach-back strong.
- **The engine on the horizon read as meant:** "the huge glowing tower or net… the big AI or the
  final area" (no question pointed at it). Said at the end: "That was actually fun. Lowkey learned
  how chatbots work. Would play the next isle."
- **7/10, yes to the next part.** Not 8: the puzzles are "mostly picking from 3 or 4 buttons… a bit
  guessable"; walking between them "the weakest part"; a lot of tapping through dialogue. Wants "a
  puzzle where I had to think harder or build something myself".
- **Missed:** Zip's voice coming back coil by coil ("I thought they were just flavour"); the stray
  sparks (ignored).

**Changed after run 29:**

- A tap on a thing that can be used (the satchel, the relay, the Gate, Mira, the pilot stone, the
  loom, the mooring) walks Zip up to it and uses it ("tapping the satchel does nothing; nothing says
  you have to walk right up"; 20 steps lost finding it). Game-agnostic: `guide.addTapTargets`.
- Thoughts about the flight are dropped on landing ("Flying through rings…" played on the isle).
- The relay's channel-3 fallback says why the dial didn't count: "The dial says 7, but on a jammed
  line the relay goes only by the words it reads" (it felt "a bit unfair… I already set the dial").
- The Gate's stars come after the Warden's orders, not before (the twist "didn't seem to count").
- "That drone has a very Warden look" waits until the drone is in the shot.
- The repair's "petals" line reworded so it doesn't sound like a comment on the player's cast.
- The Gate's violet seal fades when the lens is right at it (the view swung "inside the portal").
- Open: "Turn toward the goal" felt unreliable; bubbles stacking (board labels over Zip's thoughts,
  the static bark under "Is this Mario?"); puzzles as button-picking; the voice-coil thread.

## The loom becomes a call you build (30 Oct 2026)

Run 29's main complaint (puzzles "mostly picking from 3 or 4 buttons… a bit guessable"; wanted "a
puzzle where I had to think harder or build something myself") and Desmic's "puzzles test, not
confirm". The Word Loom's last step was a choice between two given calls; now the player weaves
their own from word tiles in three rows: **do what** (Free, Release, Unhex, Disenchant), **who**
(Tavi, the weaver, the weaver Tavi), **from what** (from the loom, from the enchanted loom).

- The tiles go onto the call as whole words; only when it **weaves** does the loom split them, the
  pieces dropping onto the rail one by one. So the call has to be reasoned from the rule shown
  earlier, not read off a counter. Exactly four calls fit (Free/Release + Tavi/the weaver + from the
  loom = 6). The tempting verbs are short in letters and long in pieces (Unhex 2, Disenchant 3);
  "Tavi" (4 letters) costs what "the weaver" (9 letters) costs.
- A call that spills shows what the loom actually wove ("Un hex Ta vi from the…") and which words
  broke into parts; a new tile swaps that part and keeps the rest.
- The loom in the world echoes the rail: its six slots light gold as pieces land, flash violet-red
  when the call spills, glow when it fits. A shot during the puzzle keeps the loom in the top half
  of a phone, above the console.
- Rules (`loom.word-loom` v2): parts are enums, the piece count an integer kept by the place/take-off
  actions; `weave` frees Tavi when pieces ≤ 6. Logged: `build-call` right (fits) or wrong
  (short-in-letters / too-many-pieces), first weave apart from retries. Rulecheck: perfect run
  lift ×3 → predict.pieces → verb.free → who.tavi → from.loom → weave; rules-parity agrees with the
  server's engine. Content check: every tile's pieces spell it, some call fits, and a letter-short
  verb is the one that doesn't.

## Stop 3: Chime Isle, sampling and warmth (30 Oct 2026)

Run 29's tester ended on "make the next isle, I want to get Mira back"; chasing Mira is the big
picture. Built data-first, as Stop 2 was: learning design (`design/stop3-warmth-learning-design.json`,
sources free to read) → rules (`chime.warmth`) → station with what the engine knows and a content
check → story script → island spec (`worlds/chime-isle.ts`) → console (`chime.ts`).

- **The idea:** the engine doesn't always say its brightest guess; it picks by chance, weighted by
  brightness. Warmth reshapes the spread (real temperature at three notches: each weight raised to
  1/T). Cold to be sure, warm to surprise, never so hot it stops making sense.
- **Shown, not told:** the guess fan's bars are the chances; turning the dial makes them glide
  sharper or flatter; every cast spins a light down the fan that lands on a word.
- **Tests, not confirms:** two casts of the same words land on different words (guided); then predict
  five cold casts before seeing them; then set the warmth before casting at two machines with
  opposite needs: the bell vault's lock (the town's exact saying: cold) and Oriel the bard, whose
  crowd wants a line it hasn't heard (warm; cold gives "Heard it!", hot gives word salad). The dial
  stays where the lock left it, so the bard needs a deliberate turn (rulecheck first found the bard
  passable on the default).
- **The isle:** a festival isle of silent bells past Loom Isle, nearer the Warden's engine; a new
  chime tower prop (three tiers of bells that swing, a lock wheel that spins and judders, a vault
  door that opens), Oriel and a small crowd (the town's people kit) who wave or groan. The flight
  from Loom Isle is flown (five rings); the arrival shot looks at the tower.
- **Checks:** rulecheck perfect run (cast ×2 → predict.same → dial.cold → cast.lock → dial.warm →
  cast.bard); the content check (weights sum to 1, cold leaves the brightest ≥95%, hot flattens it
  under 40%, the lock needs the brightest, the bard's tired line is the brightest); flowcheck plays
  it with wrong first tries and checks the evidence; the speedrun plays it from its rules.
- **Found on the way:** the mooring for the next hop sat where no walkable ground was within reach
  of the Board prompt (a softlock at the end of Stop 2); flowcheck now checks the mooring can be
  reached on foot, and it moved. The blind tester's text view had no loom or chime console text
  (pixels only); added.

## Blind run 30: the demo, title to the end card, on v113 (31 Oct 2026; explorer, 21)

First blind run through Stop 3 and the demo's ending, and the first with the dream layer (time of
day, moon, aurora, air of letters, rivers of light). Played 243 steps to "End of the demo"; 7/10,
yes to the next isle.

- **Understood before the reveal, in their own words:** next word ("a next-word guesser… brightest
  first; too little to go on, it says 'um'"), the loop ("whatever it says gets stuck on the end and
  becomes part of the input"), context (the Gate "believes whatever it's handed"), pieces ("I've
  stopped going by length… it's about how common the word is"; predicted Oriel splits like Ta-vi),
  room, sampling and warmth ("Cold squashes everything onto the top word, Hot spreads the odds out
  but doesn't flip them"). Teach-back covered all of them.
- **The dream came across, unprompted:** "The art is lovely, especially Chime Isle at dusk with the
  aurora and the festival lights"; "a pastel floating-island world"; "it looks great"; and the end
  shot as "that tornado of letters" they want to reach. The net in Zip's engine as awe: unclear.
- **Misread:** the relay, solved as a second Gate ("drop the Warden's word"); never saw the word it
  made (it showed for 1.9 s). "Feeds itself" was told, not seen. Zip's voice coil by coil mixed up
  with the sparks.
- **Weakest stretch: Blossom Isle.** The camera jammed against Zip's back or into bushes, "big
  see-through shapes" cut across the view; the satchel's prompt needed 1.4 m and they stood at ~2.
  "That was the stretch where I was closest to putting it down."
- **Also:** tapping Hot when the dial was found jumped straight to the question ("let me play with
  the dials before quizzing me"); the warm bard line vanished after 2.6 s into the stars; the spark
  hunt had "no hint" at the end; the old lady, dithered at a sixth while filling the view, read as
  "fuzzy and staticky"; stars for being spotted by a drone and for being fooled at the Gate felt
  unfair; "Hang the lantern" and "Shield Mira!" did nothing visible.

**Changed after run 30 (v114):**
- Occluders: a small thing (a sign) or a character right at the lens now fades away entirely
  instead of to a sixth (the grey ghost box at the Gate; the static over the old lady).
- The found warmth dial can be tried before the question (it reshapes the fan and says what it
  did); the warm bard line stays on screen ("Oriel sings: …") until "Bravo!".
- The relay's made word ("Zip.") is held until "Hear Mira".
- "Feeds itself" is shown: "Watch: 'Isle' flows back into the ring on its own… and it reads the
  whole line again, by itself, for the next one."
- The satchel's prompt reaches 2.4 m. Two stray sparks on Chime Isle (ten in all); the end card says
  how many are left and where.
- The Loom's spark beam is warmer and softer (it read as a white wall of light).
- Not yet: the Blossom camera, the unfair stars, the lantern and Shield choices.

## Blind run 31: the demo on High, v115 (31 Oct 2026; commuter, 22)

First blind run on the High tier (glow, sharper, denser air). Stopped at the end of Loom Isle (step
157: "cute game, the gate and loom bits were fun… good place to stop"); 7/10, yes to the next part.

- **Understood unprompted:** next word ("showing you how a chatbot predicts the next word"; "Blossom
  at 72%, then load that and get Isle, was the coolest moment"), context ("whoever writes the notes
  controls the gate"; "the relay only goes by the words you let it read"), pieces as a rule. Room
  came out when asked, and strongly ("Free (1) + the weaver (2) + from the loom (3) = 6"; ruled out
  "from the enchanted loom" as five pieces). Sampling and warmth: not reached.
- **The world, unprompted:** "this really pretty floating-islands world, pink trees, clouds, a planet
  with rings in the sky"; "looks great". The light beams marking things "really helpful".
- **Weakest:** getting around ("I spun around a lot looking for stuff… too much of my time went to
  fiddling instead of playing"); the first minute ("no idea what the game was actually about" until
  the Warden took the voice; the sim-lab framing "floated there unexplained", though by the end it
  was their twist theory: Zip is the model being trained). Stars read as "a report card, not a goal";
  first-try stars mark down the experimenting the engine invites.
- **Found:** the tester's own drag tipped the camera to look down on Zip pressed against a wall
  ("stuck staring down at my own head"); the engine said "No more words" with every word on the
  ring; and, in the play server, a tap on "Weave" matched the chip "the weaver" first (also run 30's
  "flipped" loom pick): not a game bug.

**Changed after run 31 (v116):** the goal gets a tall beam of light like the stray sparks' (both
runs found those beams "really helpful" and the arrow "less so"), a few pixels wide at any distance;
the camera's look-down limit is lower (0.6 rad, was 0.75); the engine says "Every word you have is on
the ring" instead of "No more words"; the faint rivers of letters into the Warden's engine now show
from the first morning (they were dusk only); the play server taps an exact label before a partial one.

## Blind run 32: the demo on High, v124 (7 Nov 2026; rarely plays games, 20)

The first run since the living faces, the far-future nanite Zip and his shape-shifting. Played the
whole demo, title to the end card (159 steps); 7/10, yes to the next part ("I want to know what
happens with Mira and the Warden, and I'm curious what the next isle teaches you").

- **Understood unprompted, every item but one:** next word ("oh it is like autocomplete. kinda cute",
  step 70; "one word at a time, and each guess becomes part of what it reads next"), context ("the
  gate just does what the note says", step 96; "like a chatbot only knowing what's in front of it"),
  pieces and room (the loom: "avoid the name, avoid the weird long words"), warmth (Warm over Hot:
  "'Lanterns over the spoons'… new, sure, but it's nonsense"). Sampling came out when probed, then
  strongly: "every cast is a new roll. Same words in doesn't mean the same word out." The story,
  unprompted; the voice coming back "coil by coil" read as flavour.
- **Best:** the puzzles where they got caught out (the relay: "it's the bit that stuck, because I
  actually made the mistake myself"; the Gate: "like I'd figured out the trick"); Zip's jokes and the
  cabbage. **Weakest:** the first few minutes ("mostly watching and tapping Next. I probably would've
  stopped there if a friend hadn't handed it to me"; the sim / training run / rewind framing "muddied"
  the story); walking "fiddly and kind of pointless"; puzzles "hard to fail… a guided tour".
- **Found:** "Shield Mira!" then losing her anyway "made me feel like the button was fake"; Mira's
  line at the relay sat under the satchel panel (step 114); "Step away" did nothing while the engine
  was reading (it was disabled, step 43). The interviewer took the star cards and a Warden whisper for
  inventions: both are real (the play log misses some short-lived screens), so trust is higher.

**Changed after run 32 (v125):** the shield now works, for a moment: Zip throws his nanites over Mira
as a dome of light, the film holds while it holds, then the Warden's beam cracks it from the top and
it shatters (and he is knocked back); a speech bubble hides the satchel panel while it is up; "Step
away" is always pressable (mid-cast it steps away once the engine has said its word). The opening is
Desmic's call (he is judging it); this run's evidence is passed on to him.
