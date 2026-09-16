# World atmosphere, sound and cultural references

15 September 2026. Required direction from the user: beautiful, captivating places; stronger story; restrained text; useful pop-culture references; sound and music. This is the next revision's production brief, not a claim these assets or systems have shipped.

## A world worth entering

Bellweather is a vertical garden city above clouds: apricot sunset, indigo distance, warm brass machines, turquoise glass, hanging plants, cloth lanterns and rooftop workshops. Use a cohesive illustrated adventure style with clear silhouettes and tactile materials. Avoid an empty flat stage filled with interchangeable primitive buildings.

Compose three depths: a few close leaves or hanging ribbons frame the shot; player, Zip and the current mechanism occupy the clear middle; the bell tower and cloud islands promise the journey beyond. Foreground decoration must never hide interaction or the phone camera. The tower is recognizable from the square and each landing. Paths, lighting and character gaze guide attention before markers appear.

Beauty is an experience over time: wind moves ribbons, a little maintenance creature tends plants, lantern reflections drift, distant lifts connect occupied places. Use a small number of intentional motions, held poses for reduced motion, and locally scaled detail. Do not depend on expensive post-processing to make the world coherent. Establish actual frame-time and asset budgets on the target browser before multiplying effects.

| Story state | Image and motion | Audio intention |
|---|---|---|
| Home | Warm occupied market, uneven handmade lanterns, Zip's unfinished pair-lantern | Original plucked motif, soft hand percussion, wind and workshop ticks |
| Capture | Warden's rigid shapes cut through the warm scene; one local strip of lanterns goes dim | Music thins; clamp, interrupted song, restrained mechanical pulse |
| Repair | Chest lights and token track answer player actions; occupied space remains readable | Token ticks, a two-note Zip call, low ambient bed during reasoning |
| Reunion | Zip moves into the player's space; lantern route opens toward the tower | Complete the interrupted phrase; brief warm chord and Zip response |
| Further rescues | Restored garden, route or landmark persists visibly | A rescued friend's instrument joins the arrangement; planned for later episodes |

Keep the city attractive during danger. Threat comes from what happens to friends and routes, not unreadable darkness or constant alarms. A quieter pause after a payoff lets the player look around.

## Sound behavior to implement

- Compose an original short musical identity with exploration, tension and reunion variants; audition it in the scene. A repeated alert or oscillator beep is not a finished score.
- Give semantic events distinct sounds: connect, next piece, send, rejected command, gate movement and reunion. Harmless mistakes get a puzzled response, not a humiliating buzzer. Audio must not announce success before the authoritative event.
- Offer separate Music and Effects controls, master mute and remembered device preferences. Initialize playback from a deliberate user gesture. Pause on game pause/backgrounding, avoid stacked loops on reload/replay, and release resources on teardown.
- Keep music below interaction cues; soften it during inspection. Short captions/visual responses carry the same essential information when muted. No puzzle requires hearing a pitch or timing an action to music.
- Bind cue IDs to approved presentation events. Duplicate command acknowledgements must not replay a reward sting. Explicit opening replay may replay its own cues without changing progress; leaving it restores the previous audio state.
- Record provenance/license/hash for any imported sound and an author/version for original cues. No commercial soundtrack asset is currently selected or imported.

### Actual reuse status

`web/expedition.js` contains an older optional oscillator tone and preference toggle. It is evidence of a small existing sound behavior, **not** a reusable music mixer. The current Word Machine has no music system. Add a small shared audio lifecycle/cue adapter only as the rescue scene requires it; do not copy the old episode controller or build a speculative audio engine.

Reuse the current robot model/animations, procedural player, tree/pavilion/machine primitives, opening controller and spec-world adapter. Add a reusable animated gate/cell module, lantern variants, voice-module prop, tower facade kit and the cue adapter as needed. These additions are planned, not assets already made. Use the same gate component for the cell and the different transfer gate to demonstrate reuse. Episode-specific composition and dialogue stay in story data.

## Pop culture: character humor and optional discovery

References should reward recognition while remaining funny or understandable without it. The central rescue must work for a player who knows none of the references.

- A printing-room placard reads **“Open Sesame”** beside a spilled jar of seeds: a direct nod to the classic speaking-door story, also a visual joke. It is not the answer to the current puzzle.
- Zip discovers a dramatic cloak, poses like a space-opera villain, trips over the hem and returns to work. Familiar cinematic staging supplies the reference; the joke reads through acting.
- An optional workshop shelf has a cube with a hand-drawn friendship heart, a gentle puzzle-game nod. It never competes with actual targets or carries a required clue.
- After a successful repair, Zip briefly holds a little “WE'RE SO BACK” card, then accidentally shows its upside-down reverse. Treat this as a trial contemporary joke, not a claim about current popularity; remove it if it dates the scene or interrupts the reunion.
- A Warden notice says “Your complaint is very important to us” above an obviously unplugged complaints tube. Character-specific humor can remain appealing longer than a feed of borrowed memes.

Use at most one optional gag in the opening and one or two discoveries in Episode 1. Never put a joke over a clue, make reading it mandatory, or turn the rescue into a chain of references. Audition humor with the current user; no youth appeal is presumed.

## Review evidence required

Observe opening, danger, active reasoning and reunion with sound on and muted. Inspect a moving sequence, not only a hero screenshot. Check 360/390/430 portrait framing, keyboard/touch controls, enlarged text and reduced motion. Record what was actually heard and whether narration, music or effects masked another cue; muted automation cannot pass audio appeal.

Block an internal ready recommendation when the supposed captivating world remains an empty diorama, decorative motion obscures an action, music overwhelms thought/dialogue, a central story cue is sound-only, or the story depends on a cultural reference. Judge atmosphere under story attachment and world continuity, HUD clarity under first touch, and audio under causality/controls/continuity. Existing criterion IDs and integer thresholds remain; no bonus points for asset counts or technical complexity.
