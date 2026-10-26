import type { FindSpec } from '../kit/finds';

// Stray sparks of Zip's voice, knocked loose in the attack and left off the beaten path: in the
// town's corners, on the far sides of the isles. Each one found lights a little more of his net.
// (Blind run 27, an explorer: "a pretty corridor… nothing found off the path".)
export const FIRST_WORDS_FINDS: FindSpec[] = [
  { id: 'west-plaza', at: [-6.9, -0.3] },          // the west end of the plaza (out of the corner: run 28 wedged there)
  { id: 'east-nook', at: [8.0, 1.3] },             // the slot behind the east buildings
  { id: 'canopy-corner', at: [-7.9, 7.1] },        // past the arrival canopy
  { id: 'blossom-west', at: [-7.5, 48.0] },        // Blossom Isle's far west edge
  { id: 'blossom-south', at: [4.9, 43.6] },        // behind the relay
  { id: 'loom-east', at: [-27.2, 97.2], y: 5.12 }, // Loom Isle's east rim
  { id: 'loom-south', at: [-31.8, 88.2], y: 5.12 },
  { id: 'loom-west', at: [-39.3, 97.4], y: 5.12 },
];
