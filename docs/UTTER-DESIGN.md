# Say it into being: the utterance mechanic (4 Oct 2026)

Desmic's idea (4 Oct): Zip utters things into existence and uses them to get through the
world. It should be fun, funny when wrong, and keep players imagining. Each piece of the speech
engine they repair unlocks more of what Zip can say.

This doc covers:

- the designed version, built and playable as a test area;
- how it grows with the story;
- the live-generation experiment (opinion given 4 Oct: a lab spike first, not the shipped game).

## Why it fits this game

The game teaches how language models work, and a model's one ability is to *generate*. Saying a
bridge into a gap is the lesson made physical. The ways it goes wrong are the lessons too:

| What the player does | What happens | What it teaches |
| --- | --- | --- |
| "bridge" over a wide gap | the likeliest bridge appears: a short one | a vague prompt gets the most likely answer, not the one you meant |
| "bridge long" | the bridge is made the moment "bridge" is read; "long" comes too late | text is made in order, one word at a time (Stop 1) |
| stops at "long" | the engine finishes the phrase itself: a long… noodle | a model always continues; when you stop, it guesses |
| "long paper bridge" | it holds for exactly one step | every word in the prompt matters, not just the noun |
| four words into a three-word engine | only the first three are read | the context window (Stop 2) |
| later: "a ladder as tall as *that* wall" | the ladder is sized from the wall | attention: words refer to things in context |

## The designed version (built: `lab=utter`)

- **Words come from the world.** Zip carries words he has absorbed (the Echo verb). Speaking
  uses the same engine tray as waking the skiff: tap words, then **Speak ✦**. No typing, so it
  works on a phone.
- **A place states a need, not an answer**, for example "Cross the gap", 3.9 m. The kit
  (`src/kit/utter.ts`) reads the phrase in order:
  - size and material words wait for a thing;
  - the first thing named is made at once;
  - later words are too late;
  - with no thing named, the engine guesses one.

  The result is judged by function. Outcomes:
  - **works**;
  - **too short**;
  - **too weak**;
  - **wrong way**;
  - **wrong kind**;
  - **too dim**;
  - **nothing**.

  Several phrasings work, and each wrong one fails *visibly*: a short bridge tips into the
  sky, a paper bridge sags, a tiny lantern barely glows.
- **The thing weaves itself in.** A gold hologram grows from where Zip points, turns solid, then
  works or fails. A working span becomes walkable ground; a working light lights the place.
- **Proved before anyone plays.** `tools/uttercheck.mjs` (in `npm run check`) checks every place
  from its data:
  - it can be solved from the words it offers;
  - more than one thing works (a single answer is a quiz, not a toy);
  - there are at least two different ways to be wrong.

  It flagged the first draft's first gap: only "bridge" worked, so I added "long" (now a long
  plank works too). `tools/utterlab.mjs` plays the test area in the browser, checks the world
  shows what the kit decided, and walks across the bridges.
- **System, not one-off.** The kit names nothing from this game (kitcheck). A game supplies:
  - a lexicon (thing, size, material and facing words);
  - things, each with an archetype that gives its behaviour (span, light, prop) and a look;
  - the engine's guesses;
  - places;
  - lines.

  Any VibeLearn game can use it.

### The test area today

Three floating platforms off the map (`#painted&lab=utter` in the hosted game):

1. **The first gap.** Words: bridge, plank, tiny, long, rope, away.
2. **The wide gap.** Words: bridge, plank, long, paper, jelly, stone.
3. **A dark doorway.** Words: lantern, bridge, tiny, long.

Shapes are placeholders: wooden planks, a jelly bridge, a noodle, a bean, a paper plane. A
catalogue of authored Blender props comes later. The place label still reads "Inner courtyard"
(the lab has no place name yet).

## How it could join the story (proposal)

- **Where it's introduced:** after Stop 2, when the engine has "pieces" and "room". Zip's first
  utterance can be the skiff's missing gangplank, and the Warden mocks it ("You think you can
  *talk* things into being?").
- **Each later stop adds a word class:**
  - **Stop 3, attention:** "that", "as tall as", words that point at things.
  - **Stop 4, sampling/temperature:** a "wild" word that makes the engine improvise. It's funnier
    and riskier, with stars for both.
  - **Later stops:** instructions ("a bridge that folds when I cross").
- **Stars stay honest:** a first-try working phrase counts once; funny failures are free to
  explore.
- **The Warden's remix** (already planned for replays) fits naturally: he corrupts a word in
  your phrase.

## The live-generation experiment (later; opinion given 4 Oct)

Goal: say a thing that isn't in the catalogue, and a model makes its look in seconds. It
appears with no loading screen (the hologram weave covers the wait).

1. **Contract stays the same.** The archetype gives behaviour and collision; the generator gives
   only the look. An unknown noun is mapped to the nearest archetype (by a small language model
   or a word list) before anything is generated.
2. **Pipeline:**
   - phrase → server;
   - safety and IP filter, and a style lock in the prompt;
   - hosted generator (2026: Tripo about 2 s low-poly; Meshy and Tripo 25–100 s;
     Hunyuan3D 3.x 2–6 min; SF3D about 0.5 s, colour only);
   - cut down to about 5–10K triangles, small textures, compression;
   - cache;
   - client: the hologram weave while waiting, then the painted material.
3. **Needs a server.** The game is a claude.ai artifact with no backend, and API keys never go
   to the client. Prototype it as a local lab first.
4. **Measure before deciding:** time to first look, cost per thing, how it looks next to the
   painted art, and frame rate on the F15.
5. **The catalogue grows:** every generated thing is cached and can be reviewed into the
   authored catalogue.

## Decisions (Desmic, 4 Oct 2026)

1. **If it works well, it becomes the core mechanic of the game.** So the test area's job is to
   find out whether it works well, with evidence, before it joins the story.
2. **Words come from the world first.** Typing comes in later levels, if all this works out.
3. **Funny failures are right**, *if executed well*: asking for a bridge and getting a long
   noodle should be funny to watch, not just to read.

4. **Show the engine's reading as a hologram (4 Oct, later).** The game's HUD can show the
   limits. It should be visually appealing and fun to touch, never a boring card. Other decisions
   wait until Desmic has played it.

## The word ring (built 4 Oct: `src/kit/word-ring.ts`)

Speaking no longer opens a card. Zip projects his engine as a hologram in the world, with a beam
from his chest:

- **Slots: the context window.** Three gold sockets in a shallow arc. The limit is on the ring
  itself ("2 / 3 words", then "3 / 3 words · full"). A fourth word bounces off the full ring
  ("Full. My engine holds 3 words.").
- **Words carried** float below as glowing chips. Tap one and it flies into the next slot; tap a
  slotted word to take it back out.
- **The speak orb** sits above and pulses when there is something to say. Tapping it makes the
  ring *read* its slots in order: a beam sweeps left to right. Then the words leave for the
  world, where the reading hangs over the place.
- **Controls:**
  - Phone: taps.
  - Laptop: number keys load words; Backspace takes the last one out; Enter, Space or E speak;
    Escape steps away.
  - Every piece carries a `data-action` tag for the tests.
- **Built as a kit piece, not a lab hack.** It's game-agnostic: pieces are pinned to a point in the
  world but laid out in screen pixels, so they're big and tappable and always fit a phone. The
  skiff's engine can move onto it next, giving one engine UI for the whole game.

## Is it working? AI play-tests of the test area (runs 1–4 directed, 4 Oct; run 5 blind, 5 Oct)

Each run used a fresh newcomer persona on a phone screen. It read the intent only after its own
account (`tools/playserver.mjs --intent utter`). The test area was changed between runs.

| Run | Finished | Stop and look | Keep playing | Fun / funny | Main finding |
| --- | --- | --- | --- | --- | --- |
| 1 | yes, 59 steps | yes | unsure | mildly; the jokes were only in the text, never something you could see | failures not readable; the camera swung away; "I never said how long" after "tiny" read as wrong; the language-model idea didn't reach the player |
| 2 | no, stuck at the doorway | yes | unsure | yes: the autocomplete jokes made the player laugh ("paper" became a plane, "jelly" a bean) | "rope bridge" made only a rope; couldn't find where to speak at the doorway; a snag at the end of a bridge |
| 3 | yes, 53 steps | yes | **yes** | **fun**; laughed at the jelly bridge working, the toy-sized "tiny bridge", the teeny lantern | "jelly stone" read as arbitrary; the late-word rule never came up; the camera disorients after a success; the lit doorway revealed nothing |

What changed between runs:

- **After run 1:**
  - The engine's reading floats over the place: words that shaped the thing in gold, words said
    too late in grey (they drop off), its own guess in brackets.
  - A dotted line shows how far the gap needs a thing to reach.
  - Each failure is played out: a short bridge tips into the sky, a noodle or paper bridge sags
    and flops, a bean bounces off, a plane loops away, a dim lantern flickers out.
  - The camera holds a side shot until the lines are said.
  - Lines depend on the cause ("I said tiny. It listened. Very literally.").
  - A stone lantern is dark.
  - You walk across before the next place asks anything.
  - Words are collected from signs and things in the world (Echo).
- **After run 2:**
  - Compounds work as in English: "rope bridge" is a bridge made of rope (`asMaterial` in the kit;
    "bridge rope" still makes the rope too late).
  - A gold ring shows where to stand to speak, and the speak area is wider.
  - Bridges carry on a metre onto the far side.
  - Successes get their own lines.
- **After run 3:**
  - "stone" is a thing as well as a material, so "jelly stone" makes a jelly stone.
  - Speak appears only once Zip carries a word.
  - After a success, the camera faces the way on.
  - The dark doorway hides a new gold word, "sky" (a teaser of the next power).
  - The goal no longer resets after the end.

**Run 4** (with the word ring): finished in 61 steps. Stop and look: **yes**; keep playing:
**yes**. "Gently fun"; "long bridge felt like a real aha". The speaking interface is "easy to use on
a phone… the 3-word cap is explained clearly". After it:

- A weak span now fails as weak even when it is also too short, so "paper bridge" pays off the
  sign's joke ("Paper. The sign did warn me.").
- Standing on the speak ring always offers Speak.
- Going back no longer shows "Walk across" again.
- The end shows a summary that gives reasons to replay: every place on the first phrase, funny
  failures found (x of 6), words used (x of 10).

**Run 5, blind (5 Oct).** Desmic pointed out that runs 1–4 were primed: my prompt told the
tester to try wrong phrases and asked whether failures were funny. Told nothing (see
`tools/AI-PLAYTEST.md`), a new tester typed the obvious phrase at every place, and all of them
worked first time.

- It saw **0 of 6 failures**, gave 6/10, and would play the next part.
- Of the eight ideas, three came through on their own:
  - saying makes things;
  - words come from the world;
  - only a few fit (shallow).
- Order, vagueness and readable failures came out only as predictions when asked.
- The engine's guess was **misread** ("long" alone → "a puzzled comment and nothing built").
- The language-model link was **missed**.
- It read the paper sign as a warning to avoid ("pleased with myself for not falling for it").

What this means for the design (proposals; nothing changed yet):

- **Failure has to be on the main path, not a side quest.** The obvious first phrase should come
  out wrong in a way you can see, so the lesson is in what you do anyway. For example: the first
  gap is wide, "bridge" comes up short and tips into the sky, and "long" is lying right there.
- **A place where you hold only a describing word** ("long", before any thing word), so stopping
  early happens naturally and the engine's guess (a long… noodle) is met in play.
- **Say early that strange phrases are welcome**, and make the signs dares, not warnings.
- **Shorter walks between a word and where it's used**, distinct-looking platforms, and a place
  label that changes. Zip got stuck against a signpost twice.

Still open:

- **The language-model framing doesn't reach players.** All three read the 3-word limit as a menu
  cap, not a context window. This is the main design problem left. Options:
  - an engine hologram that shows the reading (like the skiff's);
  - one line from Zip when the cap bites ("only three fit in my head");
  - let the story carry it.
- **The late-word rule** only comes up if a player puts a describing word after the thing. That's
  rare in English. Maybe a later place where order matters.
- **Moving around** small platforms with the follow camera is the least fun part. This is a
  general camera task; the real mechanic will live in the full-size world.

## Open questions for Desmic

1. When it joins the story: after Stop 2 (proposal above), or as Stop 1's power, before the skiff?
2. The context-window framing: show the engine's reading as a hologram (like the skiff), or keep it
   light and let Zip say it once?
