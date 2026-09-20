# Beautiful, living worlds: reference principles and application

Active direction, 20 September 2026. The user names Zelda, Rockstar games,
The Witcher 3 and Clair Obscur: Expedition 33 as inspiration. Prioritize an
inviting, coherent world and meaningful play over cutting-edge rendering.
This is a general design standard; the current game is one proof. Motion-quality
and audio review remain temporarily deferred under STATE.md. Behavior, player
response, spatial readability and visible consequences remain in scope.

## Reference research

These are design interpretations informed by developer sources, not a claim that
one formula explains every player's enjoyment. Sources were checked 20 September
2026. The initial pass did not examine gameplay footage and was insufficient for the
new Zelda reference. The follow-up read both official presentation transcripts and
inspected selected gameplay frames; see
`experiments/20260920-ocarina-gameplay-study.md` for timestamps and limitations.
No reference game was played. The other references remain developer-source studies.

- **Zelda: make three-dimensional action understandable.** Nintendo's Ocarina
  developer discussion describes the importance of spatial experience and targeting.
  Our takeaway: camera, controls, scale and attention must work together so a player
  can form an intention and carry it out. New abilities should invite experiments.
  [Nintendo developer interview](https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-The-Legend-of-Zelda-Ocarina-of-Time-3D/Vol-5-Mr-Shigeru-Miyamoto/5-A-Sword-Sorcery-Tale-Admired-Worldwide/5-A-Sword-Sorcery-Tale-Admired-Worldwide-224778.html)
- **New Zelda gameplay reference:** Read the actual
  [Aonuma demonstration](https://www.youtube.com/watch?v=PQvD3p2yGwc), not just its
  release announcement. Our application priorities are capability transfer,
  readable recovery, spatial orientation with optional assistance, relationships
  supported by play and dialogue, room to linger, and consequential world states.
  The timestamped study separates source observations from our design proposals.
- **Rockstar: connect activities, place and consequence.** Rockstar's RDR2 overview
  explicitly connects story, action, exploration and choice. Our interpretation is
  to give places a purpose beyond the next objective, and let ordinary interactions
  acknowledge the player. Use a few meaningful activities and responses at our scale;
  this is not a requirement to simulate a city or reproduce mature content.
  [Rockstar gameplay overview](https://www.rockstargames.com/newswire/article/75o941131a71o9/Red-Dead-Redemption-2-Official-Gameplay-Video-Part-2)
- **The Witcher 3 / CDPR: geography and human stakes belong together.** CDPR discusses
  changing even mountains to improve vistas and align space with narrative/gameplay.
  Its level-design discussion treats agency and authored storytelling as a joint
  problem. Our takeaway: a destination should matter to someone, and local details
  should help the player understand both the place and the choice.
  [Worldbuilding](https://www.cdprojektred.com/en/blog/137/answered-podcast-episode-16-from-worldbuilding-to-immersion-crafting-universes-in-games),
  [Level design](https://www.cdprojektred.com/en/blog/188/answered-podcast-episode-30-paths-and-possibilities-the-art-of-level-design-transcript-included)
- **Expedition 33: commit to a specific identity.** Sandfall describes its mixture
  of Belle Epoque, fantasy and surrealism, building characters around the central
  premise, and differentiating locations through color and shape. Our takeaway:
  select a strong emotional and visual idea and develop it consistently; expensive
  fidelity cannot supply that idea. Do not copy its imagery, plot or character designs.
  [Developer interview and transcript](https://news.xbox.com/en-us/podcast/deep-dive-into-expedition-33-official-xbox-podcast/)

## What we want the player to experience

A strong game gives the player something worth wanting, understandable actions,
room to make decisions, responsive consequences and a reason to keep discovering.
Beauty includes composition, rhythm, restraint and specificity. A living world
suggests purpose, relationships, history and change; constant ambient motion alone
does not establish life. A quiet ruin can feel more believable than a crowded plaza.

| Principle | Authoring decision | Evidence from actual play | Existing critic owner |
|---|---|---|---|
| Curiosity | An intriguing visible destination, detail or question with a worthwhile discovery | Reviewer names what drew attention and what exploration revealed; no invented interest | Art landmarks + gameplay agency |
| Embodiment | Comfortable camera, readable scale and a small reliable set of actions | Player can approach, inspect and act without wrestling the view | First-touch / physicality |
| Life and response | Purposeful activity or traces of it, plus a meaningful response to presence/action where appropriate | Reviewer describes what inhabitants/environment are doing and what changed after an action | Environmental storytelling + world continuity |
| Attachment and stakes | A relationship or local need made tangible through a shared action | Reviewer can explain who benefits, what may be lost and why the action matters | Story attachment + visible causality |
| Agency and mastery | Observe, predict, choose, receive feedback, revise, then apply in changed circumstances | A real decision changes the outcome; the learner explains/predicts rather than only follows prompts | Gameplay + learning transfer |
| Distinct beauty | A deliberate palette, shape language, materials, focal hierarchy and negative space | Default, alternate and phone views remain coherent and memorable | Visual cohesion + spatial/device composition |
| Rhythm and payoff | Alternate discovery, effort, relief and consequence within the authored chunk | Reviewer identifies a satisfying change and any dead time, repetition or abrupt handoff | Whole-chapter progression + story |

These are questions for judgment, not object-count quotas or a weighted beauty
score. A compact puzzle room, social game and exploration game can satisfy them in
different ways. Do not force towns, NPC schedules, open worlds, combat, moral dilemmas
or branching endings into every generated game. Audience, learning goal and intended
experience determine which expression fits. Explain a deliberate exception rather
than adding meaningless activity to tick a box.

## Authoring and review contract

Before adding assets, write a short scene/chunk brief:

1. Intended feeling and one distinctive visual premise.
2. Player desire: what they want here, and whose need makes it matter.
3. Visible invitation: what attracts attention before an instruction.
4. Play: available verbs, meaningful decision, feedback and recoverable mistake.
5. Life: what this place is for, visible relationships/history, and a response or
   persistent consequence appropriate to its fiction.
6. Composition: primary subject, functional landmarks, depth, negative space,
   playable-camera range, phone framing and performance/asset budget.
7. Learning: why the target knowledge improves a decision; how fresh transfer is
   established independently of completion, spectacle, XP or self-report.
8. Scope and omissions: what this chunk intentionally leaves out.

Keep this brief out of the cold reviewer packet. First collect what the reviewer
actually notices, wants to try, understands, chooses and finds confusing. Then give
intent and compare it with those unchanged observations. The existing Astra reviewer
covers all lanes; no additional critic agents or parallel scoring bureaucracy.

The six art dimensions and schema checks enforce completeness/evidence boundaries.
They cannot certify curiosity, attachment or delight. Report a technically clean
but emotionally flat experience as such. Do not convert these principles into claims
that adding props, schedules or more polygons automatically improves a game.

## Current proof: bounded next application

Preserve entry -> prologue -> separate tutorial -> Level 1. First repair the opening
as a place with a readable shared purpose. Compose the existing lantern activity
around a clear relationship, character-associated objects and a visible consequence
of the player's participation. Reframe the phone around that interaction. Treat
this as an authored hypothesis to test, not a proven solution or a platform template.

Then address the retained tutorial/Level 1 findings: character/background separation,
world-readable route clues and camera occlusion. Place learning-relevant evidence in
the environment while preserving accessible text alternatives and existing learning
IDs. Avoid turning visual discovery into a color-only or precision-control barrier.

Recheck whether a cold player can say who belongs together, what ordinary activity
happens, why the disruption matters, where to go, what decision they made and what
changed. No new level, broad generator rewrite, simulation subsystem or deployment
promotion is implied by these references.
