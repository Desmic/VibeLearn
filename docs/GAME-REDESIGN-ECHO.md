# Echo & Engine: the learning becomes the game (redesign, 2 Oct 2026)

**Status:** direction from Desmic (2 Oct): redesign the mechanics so they're fun, part of the
world and as good as a top game, while keeping the learning progression. Feel target:
**Zelda: Breath of the Wild / Tears of the Kingdom**: powers that act on the world in
surprising ways, and players discover what works. This doc is the design. The first playable
slice (the skiff scene) is built; see "The slice" below.

## The problem with what we have

The puzzles work, and the checks prove the learning evidence is sound. But each one is a
panel laid over the world: a console, a card, buttons. The world stops while you answer.
A top game doesn't do that. Its verbs are things your character does *in* the world, and
the world answers with spectacle. Right now our fun and our learning live in different places.

## The idea in one line

**Zip's speech engine is a tiny language model, and getting it to say the right thing is the
game.** Zip absorbs words from the world, loads them into the engine (a hologram projected
from his chest), and the engine speaks. Machines in Bellweather do exactly what they're told.
The right words make a skiff soar or a gate swing open; the wrong ones make it dive into the
sea.

Everything a player does is something a real language model user does: gather context,
arrange it, see what comes out, adjust. We don't explain prompting; we hand it over as a
superpower.

## The core loop

1. **Absorb (the Echo power).** Words drift out of what people say, signs, plaques and humming
   objects. A glowing word hangs over its source. Zip pulls it in with a beam from his
   chest coil; the letters stream into him and the word joins the little orbit of words
   circling him. Exploring is collecting, like Korok seeds that mean something.
2. **Load.** At a machine, Zip opens his engine: a holographic ring of slots appears in front
   of him. That ring is the engine's **context**. You place words in it, in order.
3. **Cast.** The engine reads the ring (beams run from each word to its prism core), shows its
   guesses for the next word as a fan of lights (brighter means more confident), and speaks
   the strongest. The spoken word flies to the machine, and the machine obeys, literally.
4. **Loop.** The spoken word slides back into the ring, and the engine runs again. Watching a
   sentence grow word by word, each one fed back in, is the lesson of Stop 1.

## Pillars (borrowed from Breath of the Wild, bent to learning)

1. **The world is the dictionary.** Any person, sign or object can hold a word. A new island
   means new words to find. The game never hands you a word list.
2. **Machines are literal.** They do exactly what the engine says. That gives us clear feedback
   and comedy at once: "sink" sinks the skiff, and everyone laughs and learns.
3. **Many ways to try, one idea underneath.** Experimenting is safe and spectacular: wrong
   words lead to a funny scene, never a game-over screen. The engine's rules never change
   between places, so what you learn in one place works in the next (BotW's "chemistry").
4. **Show the mechanism.** The hologram makes the invisible visible: context is the ring,
   reading is the beams, confidence is brightness, the loop is a word flowing back. Later
   powers add more of the real machine (pieces, attention, randomness).
5. **Juice.** Every action has sound, light, motion and a reaction from someone in the world.
   Collecting a word should feel like catching a firefly, and casting like a spell.
6. **The learning evidence doesn't move.** Rules stay data (shared with the server), first tries
   still count once, and answers are committed before feedback. The game gets better; the proof
   stays honest.

## How the game maps to the real thing (so we never teach something false)

| In the game | In a real language model | Honesty note |
| --- | --- | --- |
| Words Zip absorbs | Text you put in a prompt | Real models read pieces (tokens); Stop 2 adds that |
| The ring of slots | The context window | Real windows are huge; ours is small so it fits a phone |
| Beams from words to the core | The model reading its input | Stop 3 can show uneven beams (attention) |
| The fan of glowing guesses | Next-token probabilities | Brightness is a real probability from the engine's table |
| The spoken word flowing back | Autoregressive generation | Exactly how it works |
| What the engine "knows" | What the model learned from text | Our engine's guesses come from a small table of what Bellweather says; a later stop can let players teach it |

## Engine powers, one per stop (the progression)

Each stop repairs part of the engine and grants a power, the way TotK grants abilities. Stops
3–7 need their own learning design before building (as Stop 2 had). Order decided 3 Oct 2026
(Desmic asked for the order that best fits the vision; reasoning below the table).

| Stop | Power | What it teaches | A moment it enables |
| --- | --- | --- | --- |
| 1 Bellweather | **Echo + Ring + Loop** | The next word comes from everything so far (sequence) | Wake the skiff by feeding its own words back |
| 1 Blossom Isle | **Ring as a choice** | The machine only knows what's in its context (context) | The Gate opens wherever the words in your ring point; absorb a Warden lie and it traps you |
| 2 Loom Isle | **Splitter** | Engines read pieces; room is counted in pieces (tokens, context window) | Words shatter into pieces in the hologram; too many pieces spill off the ring |
| 3 | **Warmth dial** | The engine picks from a spread of guesses; warmth changes how (probability, sampling, temperature) | Cold casts are exact and dull; warm casts surprise. A lock needs the exact word, a festival song needs a fresh one |
| 4 | **Echo memory** | Guesses come from what was read (training); then tuning teaches it to follow requests (instruction tuning) | Absorb a whole island's sayings and the engine starts talking like them, quirks and all; the townsfolk then teach it to answer politely |
| 5 | **Focus lens** | Some earlier words matter far more for the next one (attention); similar words sit close together (representations) | Bend the beams so the engine notices the one word that matters in a long ring |
| 6 | **Truth lantern** | Confident isn't correct (hallucination); bring real sources into the ring (grounding, retrieval, tools) | The engine glows bright about a bridge that isn't there; carry the right page into the ring before you step |
| 7 | **Voice of the Stream** | All powers together | A final duel: your engine against the Warden's |

Why this order:
- **Warmth comes third** because the player has been looking at the engine's guess fan (brightness =
  probability) since Stop 1; letting them choose how it picks is the smallest next step, and it explains
  why the same prompt can give different answers.
- **Training before attention.** "Where do these guesses come from?" is the question Stops 1–3 raise;
  answering it (Echo memory) comes before opening up the mechanism inside (Focus lens). It also sets up
  a key truth for adults using these tools: the engine sounds like what it read. Instruction tuning folds
  into this stop as a second phase (read everything, then learn to answer).
- **Attention with representations.** The Focus lens is where the hologram can show words as points
  that sit near similar words, so both ideas share one power.
- **Truth lantern last before the duel**, because hallucination only makes sense once the player knows
  guesses are probable continuations (Stop 3) learned from text (Stop 4), and its cure (grounding,
  retrieval, tools) reuses the ring from Stop 1. That arc closes where the game began: context.
- The 28 Sep story-learning review asked for probability early and training before attention; this order
  does both, and keeps every topic of the original arc (representations, instruction tuning, retrieval and
  tools) instead of dropping them.

## The slice (built 2 Oct)

The skiff scene in Level 1, rebuilt with the new loop:

- After Zip catches the spark, the Echo Coil gives him the power to absorb words.
- Around the outlook: a hull plaque holds **Skiff**, a neighbour watching kites says **rise**, the
  man at the view says the wind blows **toward** Blossom Isle, and another neighbour warns that
  boats **sink** in a crosswind (a decoy, and a very good joke).
- At the pilot stone the engine opens as a hologram. Load the ring, cast, and watch the
  guesses. The right three words make it say **Blossom**.
- Then the Warden's damage shows: the loop is broken. *You* choose what the engine reads next.
  Feeding it the whole sentence plus its new word works. Starting again from your words alone
  makes it say "Blossom" forever; feeding it only "Blossom" makes it babble about petals.
  This is the assessed decision (`next-input`), the same evidence as before.
- Once it's right, Zip repairs the loop, the engine finishes the sentence on its own, and the
  skiff wakes.

Classic mechanics stay available with `?mech=classic` for comparison.

## First play-test of the slice (AI newcomer, 2 Oct)

Fun 7/10, clarity 5/10. It got the idea without being told: "you put words in its ring in
order… it guesses the next word… feed the guess back in and it keeps going." The best
moments were pulling a word out of someone's sentence and watching "sink" sink the skiff.
Fixes from that run are in; the follow camera in tight corners is the biggest thing left.

## Visual language

- **Hologram:** teal-cyan (#6fe0c9) light, additive, with scan lines, a soft edge glow and a
  little flicker. Words the engine *generates* are gold, words you *found* are teal, and the
  Warden's corruption is violet.
- **Diegetic first:** the ring, beams, guesses and absorbed words live in the 3D world. A small
  tray at the bottom of the screen mirrors your words so they're easy to tap on a phone.
- **Readable on a phone:** words are drawn large; the camera frames Zip from behind with the
  hologram and the machine beyond.

## How it fits the system (and the generator)

- Word sources are island **entities** (`kind: 'word-source'`, with the word and the line it
  comes from). The engine's knowledge is **station content** (a small table: context →
  guesses with weights). The rules stay GameRulesSpec data.
- A generator now writes four things per station: where words are, what the engine knows,
  which machine listens, and what each output word does to it. That's far more general than
  bespoke puzzles: every new concept becomes an engine power plus machines that react to it.

## Open questions

- How much text is too much on a phone? The AI newcomer play-test and the F15 will tell us.
- Should the engine's knowledge table be visible (a "what I've heard" page)? It could teach
  where guesses come from early, or spoil Stop 5.
- Collecting needs to stay quick. If finding words drags, sources should call out as Zip walks by.
