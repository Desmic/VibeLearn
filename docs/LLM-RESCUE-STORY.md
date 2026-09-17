# Bring Back the Words — story and progression treatment

## 17 September 2026 user-directed rewrite — supersedes conflicting treatment below

The current implemented opening was user-rejected. The next story pass must use a **directly controlled robot protagonist**, not a separate literal helper/player avatar. `Zip` is now a provisional working name rather than a fixed character decision.

### Revised opening/prologue shape

The strongest current direction from the user is:

1. **Bellweather before the problem:** show the city happy, lively and worth caring about. The protagonist is with robot friends; the world visibly feels safe and joyful.
2. **Dramatic rupture:** a sudden thunderstrike/violent event interrupts the scene. Light, sound, camera and animation all change together.
3. **Displacement:** the protagonist and friends are teleported/torn out of Bellweather.
4. **Dark limbo:** cut to the protagonist alone in darkness. Do not explain first; let the player feel the loss of place.
5. **Reveal the prison:** lights come on progressively. The player now sees an unknown space and a large blocked/locked door that clearly prevents escape.
6. **Speech theft:** an evil robot enters and visibly removes the protagonist's speech engine. This is the personal inciting loss; the player sees cause and consequence in one scene.
7. **Take control:** the camera settles into the declared gameplay view and the player directly controls the protagonist.
8. **Separate Tutorial/Prologue:** teach movement/look/interact and the minimum speech-repair mechanic with low/no failure pressure. Give the player a clean success—restore enough speech/interaction capability to open the first way forward.
9. **Level 1 begins after onboarding:** Level 1 is the first actual mission/problem and may assume those reusable controls/basic interaction grammar.

The exact thunder/teleport fiction can change during story ideation, but the **before -> rupture -> unknown confinement -> antagonist-caused speech loss -> direct control -> tutorial success -> Level 1** causal structure is the current binding direction unless a clearly stronger alternative is reviewed.

### Storytelling rule

Text, dialogue, animation, camera, lighting, effects and player actions must tell the **same beat at the same time**. The player should understand most of the story by watching what happens; concise text reinforces what is visible rather than carrying missing causality.

For every prologue beat define:

- world state before;
- visible event/action;
- camera/focus change;
- character reaction;
- minimal caption/dialogue;
- player action, if any;
- world state after;
- what a cold-start player should now understand.

If the rendered scene does not convey the written story without reading this document, the story realization fails.

### Protagonist and names

The protagonist is the player's controlled character. There is no separate literal `you` helper in this track.

Run a fresh character/naming ideation pass before locking the next build. Learn from memorable robots/characters in film, games, animation and literature. A playful homage-style name such as the user's `Wall-G` example illustrates the desired recognizability/energy, but shipped names, designs, dialogue and assets should remain original and should work even for players who miss the reference.

### World direction

The current compact diorama is too congested. The new world should use a larger playable footprint, clearer landmark spacing and deliberate negative space. Do not compensate for weak composition by adding more props.

Use `ART-WORLD-DIRECTION-CRITIC.md` as a separate gate for world scale, spatial density, silhouettes, clipping/intersections, camera sweep, landmarks and art cohesion.

### Platform extraction

This track is a proof for the broader VibeLearn game-creation platform. Opening beats, teleport/reveal effects, character-control profiles, tutorial patterns, doors/rooms, lighting states and repair interactions should become reusable/spec-driven where the implementation proves them useful. See `GAME-CREATION-PLATFORM.md`.

---

## Historical 15 September treatment — retained for design history, superseded where it conflicts

15 September 2026. Working title and authored design candidate, following the user's rescue premise and atmosphere feedback. This replaced the delivery-workshop story at that time. After reading the synopsis the user said “yes much better now” and asked about progression: positive feedback on the story direction, not acceptance of an implemented game.

## The promise

**An evil robot has stolen your best friend's voice. Repair it, break into his tower, and bring your friends home.**

You and **Zip**, a small robot with enormous confidence and a terrible victory dance, live in **Bellweather**, a city of rooftop gardens, lantern markets and humming workshops above a sea of clouds. Tonight everyone is preparing a lantern parade. Zip is making a lantern that looks like the two of you.

**The Warden**, the city's self-appointed robot ruler, wants a city where nobody can disagree with him. He confiscates the robots' speech engines and locks their owners inside the old bell tower. Zip pushes you out of a closing gate and gets caught. Through the bars, Zip tries to say your name. Only a broken little note comes out.

Zip's maintenance socket is reachable from outside the first cell. You can repair enough of the engine to generate a short door command. When it works, the gate opens and Zip joins you. Together you climb through the tower's gardens, printing rooms and observatory, repairing more of the engine and freeing friends. Every rescue restores an instrument, a place and a relationship to the city.

The season ends with the friends working together to reopen the city gates. Zip finishes the lantern from the opening; everyone gets to join the parade. The final speech is an emotional payoff after a demonstrated repair, never a substitute for the player's decisions.

## Why these characters matter

- **Zip helps first.** Before the capture, Zip catches the player's falling lantern, returns it with an overelaborate bow, and insists on a tiny celebratory hand tap. Repeat that gesture at the first reunion. The player gets to know a friend through behavior before being asked to rescue them.
- **Zip remains a person in the fiction while unable to speak.** Gestures, curiosity, stubbornness and humor survive the damage. Repair restores communication and capabilities, not worth or personhood. Later, Zip helps other robots instead of becoming a moving tutorial panel.
- **The Warden is clear, theatrical and petty.** He stamps a festival sign with “UNAUTHORIZED FUN,” then his own announcement horn squeaks. His rule is the threat; a child need not understand AI risks or political allegory. His private wish for an obedient audience can emerge later without excusing captivity.
- **Each friend changes play.** A gardener unfolds a living bridge; a printer opens a route through moving type; a drummer calls a lift with a rhythm. These payoffs are authored world consequences of validated progress. Their names and full arcs are deferred until their episodes are designed.

## Opening: playable staging, approximately 45–60 seconds

Timing is a production target, not measured evidence. Hold at interactions; retain Skip, Pause and replay. Use five connected beats in one readable space.

| Beat | Visible action and composition | What a newcomer should understand |
|---|---|---|
| 1. A place worth saving | View from behind the player across glowing stalls, wind ribbons and the distant bell tower. Zip catches the falling lantern and hands it back. One optional hand-tap interaction. | This is our home; that robot is my friend. |
| 2. Something goes wrong | The Warden's lift descends into the square. His clamp removes a singer-bot's glowing voice module; its song cuts off and its cage rises. Keep cause and response together. | That robot is taking our friends and their voices. |
| 3. Zip chooses us | A gate closes. Zip shoves us clear, gets trapped on the other side and loses the voice module. Zip tries to call out; chest lights stutter. | Zip saved me and now needs help. |
| 4. A reachable solution | Zip points from the broken chest panel to a matching maintenance socket outside the bars. Other captives remain visible higher in the tower. Goal: “Help Zip speak. Open the gate.” | I can repair Zip here; more friends need help above. |
| 5. First useful action | Connect the loose power lead. Chest lights wake, Zip makes a two-note chirp and returns the hand-tap against the bars. A small speech-piece track unfolds. | My actions help. Now we can work on the words. |

No course map or lecture interrupts the handoff. The tutorial introduces movement/look as needed to reach the socket; only one actionable target is marked. A skipped opening lands on Zip, the cell and the maintenance socket with the same concise goal. Muted play preserves all five causal beats through acting, light changes and short accessible captions.

## Episode 1: The First Words

The core learning target stays context-conditioned next-token generation. Rebuild the challenge around a rescue rather than renaming delivery buttons.

1. **Connect:** power the repair socket. Safe early success; no mastery claim.
2. **See a thought-sized step:** a tiny authored model generates `Open` then `the`, with each generated piece visibly joining the input before the next choice. The player can pause, inspect and resume it.
3. **Encounter the gap:** the cell is marked with a moon; another nearby maintenance hatch has a sun. The engine received no gate identifier. Its plausible sun continuation opens the harmless empty hatch. Zip points at the still-closed cell. The machine did not see what the player saw.
4. **Investigate and repair:** scan the actual cell plaque into the input. Let the player inspect the input, compare candidate scores before and after, and regenerate. Gate identity is text supplied by a scanner, not unexplained visual perception. Generated words travel to the lock; the lock independently checks its command and the connected robot port.
5. **Rescue:** Zip's gate opens. Zip crosses to the player, returns the hand-tap, retrieves the dented lantern and takes their place beside us. A missing musical phrase resolves. Let this moment breathe.
6. **Apply with less help:** to leave the landing together, choose which of several observations belongs in the next input. The route has changed, an old note is stale, cue order is different, and a tempting unrelated sign is visible. Before running the model, record the player's prediction of what input matters and which output change to expect. Help remains available and explicitly assisted. Do not highlight the answer or treat a second prompted click as transfer.
7. **A reason to continue:** a short fragment from a friend above arrives with a word split into pieces. Zip tries to repeat it and produces an amusing broken name. The next room's moving letters are visible through the newly opened route. Episode 2 is a promise, not a playable level in this increment.

The exact second challenge, distractors, distributions and explanation capture need a versioned LearningSpec/GameRulesSpec fixture before implementation. Assess the generation loop as well as missing-context repair; physically choosing the moon is insufficient evidence. Preserve prior exposure, feedback and assistance. Keep independent evidence unknown if the learner only follows instructions.

## Season progression

### What progression should feel like

Progress along three connected dimensions: get closer to bringing everyone home, gain useful control of the speech engine, and see/hear the city recover. Every episode must deliver all three. Persistent restored places and companion behavior communicate progress before any optional course menu.

Within each episode: encounter a story problem -> get an immediate safe action -> explore one new mechanism with help -> try a recoverable mistake and see why it failed -> use the idea in a changed situation with less help -> earn a rescue/world payoff -> glimpse the next problem. The exact placement of the first payoff can vary; Episode 1 deliberately frees Zip before its less-guided exit challenge so attachment pays off early.

Introduce only one new control or idea at a time. Later challenges combine familiar abilities, add relevant uncertainty and fade hints. Do not increase difficulty with extra reading, faster reflex requirements or a memorized sequence of highlighted buttons. Let the player retry locally without losing a rescued friend, a restored area or an entire episode. Hints stay available and their use is recorded honestly.

Before advancing, the game checks the authored task outcome and offers a concise chance to apply/predict with less support. Assisted completion can progress the story; it does not silently become independent mastery. A later episode revisits the earlier idea in a different situation. Delayed retention requires evidence from an actual later return, not an immediately repeated puzzle. No grind, XP threshold or timed punishment unlocks the next lesson.

Episode 1 remains the first bounded build and review unit. The eight episodes below are a proposed season arc, not eight equally developed or implemented levels. Freeze and verify each later learning mechanic before production.

Each episode begins with a short use of a previous skill, introduces one new demand, gives a recoverable experiment, then reduces guidance on a changed case. Locations, actions and relationships change; difficulty must not rise through longer text.

| Episode / place | Rescue action and payoff | LLM concept and assessment boundary |
|---|---|---|
| 1. The First Words / lantern gate | Restore a short command, free Zip, leave together | Repeated next-token generation; context vs outside knowledge; plausible vs verified. Fresh prediction before feedback. |
| 2. The Broken Name / printing loft | Reassemble a friend's fragmented message; free the printer and gain moving-letter platforms | Tokenization: vocabulary pieces, IDs, fragments and punctuation. Reconstruct an unseen string with the specified tokenizer. |
| 3. Bad Lessons / overgrown greenhouse | Repair a badly taught controller with varied examples; gardener restores a living bridge | Training updates parameters; data quality, held-out evaluation and generalization. Keep validation answers out of training. |
| 4. Strange Neighbors / prism archive | Investigate relationships in an inspectable representation map; reconnect a lost friend to the group | Learned representations and their limits. A spatial map is a projection, not literal meaning in a brain. |
| 5. Listen Across the Noise / wind observatory | Trace relevant information through a long message to guide a friend across a moving route | Attention and contextual representations. Choose a new dependency; attention weights alone are not a complete explanation. |
| 6. More Than One Way / echo theatre | Try varied continuations for a creative performance, then switch strategy for an exact gate task | Distributions and sampling. Confidence and creativity do not establish truth or door validity. |
| 7. What Did You Ask For? / Warden's broadcast room | Compare a completion engine with a helpful assistant; redirect an announcement to reach the captives | Instruction tuning and preferences vs prompting. Show a held-out counterexample; tone is not reliability. |
| 8. Bring Everyone Home / bell crown | Check a retrieved map and use a calculation tool; friends coordinate the city gates and parade | Retrieval, tools, provenance and evaluation. Verify new facts, find stale evidence and acknowledge unknowns. |

These are curriculum and story outlines; only the bounded Episode 1 revision is next. Later topics need their own sourced toy implementations and learning contracts.

## Fiction and technical truth

The characters call door phrases “magic words”; the world's robot maintenance ports accept validated commands. A phrase does not bypass a security system by being persuasive. The robot connection explains why the player repairs Zip instead of simply shouting an answer.

The speech engine is a fictional container for an inspectable language-generation model. Text generation, tokenization and spoken sound are distinct; this series first examines how the words are produced. Zip's authored voice/chirps are presentation, not a real speech synthesizer or evidence of a trained LLM.

Episode 1 uses illustrative authored scores and whole-word pieces, clearly identified in inspection. Later repairs reveal other mechanisms; they do not imply an actual LLM must be rebuilt through these physical rooms in this order. A door opening verifies a narrow command, not general truth. Story personality is authored fiction, not a claim of model consciousness. Existing learning references and assessment safeguards remain in [NEXT-TEACHING-DESIGN.md](NEXT-TEACHING-DESIGN.md).

## Production and design review

Use [WORLD-ATMOSPHERE-AND-AUDIO.md](WORLD-ATMOSPHERE-AND-AUDIO.md) for visual/sound direction and [STORY-INSPIRATION-20260915.md](STORY-INSPIRATION-20260915.md) for researched influences. Reuse the existing opening controller, WorldSpec adapter, PlayCanvas runtime, controls and authoritative rules where they still fit the revised embodiment/story. Story names, gestures, cameras, cue IDs and setting belong in the authored package.

The September 17 user review supersedes the old realization assumptions. Next design work starts from the revised prologue/direct-protagonist direction above, not by patching the rejected three-beat scene.
