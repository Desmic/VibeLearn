import * as T from 'three';

// The first ten seconds (1 Nov: blind runs 30 and 31 had "no idea what the game was actually about"
// until the Warden took Zip's voice, minutes in; the sim-lab frame "floated there unexplained").
// Before the morning, a glimpse of where the story goes: dusk, the Warden's engine drinking rivers
// of letters from the isles, and the sim-lab's log saying what this run is for. Then the replay
// rewinds to the morning at the outlook. The log is the title screen's voice (the lab running Zip's
// training), so the frame is explained by being used. Words are data; the shot lives in story.ts.
export const PROLOGUE = {
  seconds: 10.5,
  mood: 'dusk',
  /** camera path over the cloud sea toward the engine (world space) and where it looks (the engine) */
  from: new T.Vector3(-70, 34, 210), to: new T.Vector3(-110, 58, 318),
  surges: [1.2, 5.6],
  log: [
    { at: .5, text: 'SIM-LAB // run v15 · replay of the last courier run' },
    { at: 2.3, text: 'the Warden\'s engine is drawing the world\'s words away' },
    { at: 4.6, text: 'Mira was taken with them' },
    { at: 6.7, text: 'objective: get her back' },
    { at: 8.7, text: '⏪ rewind to 06:40 · the outlook' },
  ],
  /** when the rewind glitch starts */
  rewindAt: 9.4,
};
