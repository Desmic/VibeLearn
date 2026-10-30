import * as T from 'three';
import type { Stream } from '../kit/light-streams';
import { SPIRE } from './first-words-spire';

// The dream layer of The First Words: the air full of pollen, petals and drifting letters (a world
// made of words), and, as the light goes, rivers of letters rising from the isles into the Warden's
// engine: the Warden drawing the world's words away. Strengths come from the time of day.

/** letters drifting in the air: the commonest in the town's sayings */
export const DREAM_LETTERS = 'aeouwrdsnmhgbc';   // round letters: an l or i reads as a scratch

const INTO = SPIRE.at.clone().add(new T.Vector3(0, SPIRE.height * .72, 0));
export const DREAM_STREAMS: Stream[] = [
  { from: new T.Vector3(0, 8, 48), to: INTO, lift: 70, n: 260, width: 5 },          // Blossom Isle
  { from: new T.Vector3(-34, 12, 96), to: INTO, lift: 60, n: 260, width: 5 },       // Loom Isle
  { from: new T.Vector3(-58, 16, 150), to: INTO, lift: 45, n: 320, width: 6 },      // Chime Isle
  { from: new T.Vector3(0, 4, 0), to: INTO, lift: 90, n: 200, width: 5 },           // the garden
  { from: new T.Vector3(-150, -18, 140), to: INTO, lift: 70, n: 220, width: 9 },    // out of the cloud sea
  { from: new T.Vector3(70, -18, 260), to: INTO, lift: 60, n: 220, width: 9 },
];
