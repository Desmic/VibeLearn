# Why play, how to play: the F15 play-test answer (3 Oct 2026)

Desmic's Galaxy F15 play-test (3 Oct) found: why to play and how to play were both unclear;
Mira's abduction didn't read; cards at the bottom pulled the eye away from the world; some
lines spoon-fed or made no sense; world reactions were a good idea, weakly executed; the
hologram engine worked. This note is the design answer, and what was built on 3 Oct.

## Why play: the hook lands in the first 90 seconds

A top game gives the player a want, a loss, a mystery and a laugh before it gives them a
lesson. Bellweather now does it like this:

| | What the player sees (not reads) |
| --- | --- |
| **A friend** | Mira calls Zip over (cold open: the camera finds her at the outlook). She is the one person who notices Zip is odd: *why do you beep before you answer? You blink. Other bots don't.* She doesn't know why. |
| **A villain with a reason** | A bat-eared ship drops out of the clouds; the town stops and stares. The Warden names the reason: *You beep. You blink. You think.* |
| **A loss you feel** | The beam takes Mira, reaching back for Zip; her hat falls. A bolt tears out Zip's speech engine; it streaks into the bell garden. Zip tries to shout her name: static. |
| **A dare and a direction** | *Want her back? Come and get her, thinker.* The ship leaves over the town toward the Blossom Isle, so the destination is shown, not told. |
| **A laugh** | *What? Is this Mario? Guess I'll have to save her now.* |
| **A mystery to pull on** | Later the Warden's voice is in Zip's head (the Stream). Why can Zip think? Why can he hear it? Never explained in a card; dripped through play. |

The spine of the whole game follows from it: **get your voice back, piece by piece, isle by
isle, to bring Mira home.** Each piece of the speech engine is one idea of how language
models work, so fixing Zip's voice is understanding theirs.

## How to play: the world teaches, cards don't

Rules (BotW's Great Plateau, Portal, Celeste, and the presentation guide):

1. **One verb at a time**: met in a safe place, then used, then twisted. Ladder: walk (tap
   the ground) → talk (brackets on Mira) → protect (*Shield her!*, in slow motion) → chase
   (the spark) → absorb (tap a word) → speak (the hologram engine) → fly (rings) → choose
   what the machine reads (Gate) → …
2. **Prompts live on the thing.** The first word wears a pulsing *Tap*; the thing the action
   button will use gets target brackets, and tapping the brackets works like the button.
3. **Speech lives in the world.** Speakers talk in bubbles over their heads (Mira, the Gate,
   Tavi; Mira's voice comes out of the relay); villains and townsfolk *bark* in passing
   without stopping play. The bottom card is only for a voice with no body.
4. **The camera directs attention.** Cold open on Mira; the camera glances at a new goal;
   the attack is cut as a film (six shots, letterboxed, skippable).
5. **Never explain what the player just saw.** Twelve words a sentence. The player is smart.
6. **Failure is safe and funny** (load *sink* and the skiff dips).

## The loop, and the ceiling

**Loop:** explore → words call out (a chime, a glint) → absorb them → compose in the
hologram engine → the world obeys (or does something funny) → a new place, a new piece of
voice.

**Easy to follow:** one goal, one beacon, one action, always. **Easy to play:** taps only.
**High ceiling** (stars with reasons, never gating progress): first try, fewest words, no
decoys, every ring, never spotted. Next: hidden words off the path, a *Warden's remix* of
each station on replay (the engine sabotaged with the misconception the station teaches),
and speed lines in the sky lanes. Evidence stays honest: a first try counts once.

## Built on 3 Oct

- **Resolution** (`quality.ts`, `painted.ts`): Medium and High start at full resolution
  (1.6× and 2.25× CSS pixels, capped by the screen), aim for 45 fps instead of 60, and never
  drop below 1.2× / 1.5×. Only Low trades resolution for frame rate freely. Before, a phone
  at 45 fps fell to 60% resolution on every tier.
- **World overlay** (`kit/overlay.ts`, game-agnostic): one host pins UI to world points,
  with safe regions, sticky placement (snaps on camera cuts), priority declutter and
  screen-edge cues: the mechanisms named from the "God's Eye" research in the v3
  architecture, without its dense look. (The research itself isn't in the repo; only the
  v3 doc's summary of it.)
- **Guide** (`guide.ts`): speech bubbles for anchored speakers, `bark()`, `prompt()`, target
  brackets, rewards pop over Zip, the goal line settles to a quiet pill after six seconds,
  the walk hint stands at Zip's feet, stars are a self-dismissing banner over the world.
  Fixed: the off-screen goal arrow was never added to the page.
- **Story** (`story.ts`, `first-words-story.ts`): cold open, the directed attack (shot
  list in the code comments), new lines (Mira's beeping and blinking; the Warden's reason
  and dare; Mario; static), the coil discovered by Zip's own thoughts, the Stream moved
  after the spark, and the Sups rings (Zip has played it; so has the Warden).
- **Town** (`painted-life.ts`): the nearest two point up at the ship; Mira looks up;
  neighbours shout. Afterwards the town talks of nothing else, and her hat stays where she
  fell.

## Next (in order)

1. The Gate, relay and loom stop being panels (Echo & Engine): the same verbs as the skiff.
2. Music and ambience; the Warden's motif interrupts the festival tune.
3. Town aftermath in the world: lanterns dimmed, doors shut, people gathered at the hat.
4. Cutscenes as data (shots relative to anchors, barks, cues) so a generator can write them.
5. Replay modes for the ceiling (hidden words, Warden's remix).
