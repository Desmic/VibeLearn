import * as T from 'three';

// The first seconds (1 Nov: blind runs 30 and 31 had "no idea what the game was actually about"
// until the Warden took Zip's voice, minutes in; the sim-lab frame "floated there unexplained").
// Before the morning, a glimpse of where the story goes: dusk, the Warden's engine drinking rivers
// of letters from the isles, a narrator telling it like the start of a dream (Desmic: "visuals +
// narration does the trick"), and the sim-lab's log, the title screen's voice, saying what this run
// is for. Then the replay rewinds to the morning at the outlook. Words are data; the shot is story.ts.
export const PROLOGUE = {
  mood: 'dusk',
  /** camera path over the cloud sea toward the engine (world space); it looks at the engine */
  from: new T.Vector3(-70, 34, 210), to: new T.Vector3(-110, 58, 318),
  surges: [1.2, 6.5],
  /** the lab's log: the run (shown with the first line), the objective (shown with the last), the rewind (said) */
  logStart: { speaker: 'Lab', text: 'SIM-LAB // run v15 · replay' },
  objective: { speaker: 'Lab', text: 'objective: bring Mira home' },
  /** told over the dusk, one after another (each waits for the last to be said; `hold` without a clip) */
  narration: [
    { speaker: 'Narrator', text: 'Once, there was a world made of words.', hold: 2.6 },
    { speaker: 'Narrator', text: 'Then the Warden built an engine, and it began to drink them.', hold: 3.4 },
    { speaker: 'Narrator', text: 'It took Mira, too.', hold: 1.8 },
    { speaker: 'Narrator', text: 'One small courier went after her.', hold: 2.4 },
  ],
  rewindLine: { speaker: 'Lab', text: '⏪ rewind to 06:40 · the outlook' },
  /** seconds before the first line, between lines, and from the last line to the rewind */
  lead: .9, gap: .45, tail: .5,
  /** the rewind glitch, then the morning */
  rewind: 1.1,
};
/** what the lab's lines sound like aloud (the log shows them as written) */
export const PROLOGUE_SPOKEN: Record<string, string> = {
  '⏪ rewind to 06:40 · the outlook': 'Rewinding. Six-forty, the outlook.',
};
