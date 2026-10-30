// What a player must have learned to stand at each checkpoint of The First Words (see
// kit/progress.ts). Station ids are the learning stations' ids (first-words-stations.ts,
// stop2-loom.ts, stop3-chime.ts). Read by the game on resume and by tools/speedrun.mjs and the breaker.
import type { ProgressSpec } from '../kit/progress';

export const FIRST_WORDS_PROGRESS: ProgressSpec = {
  order: ['spark', 'skiff', 'land', 'gate-open', 'loom', 'loom-done', 'chime', 'chime-done'],
  requires: {
    land: ['wake-skiff'],
    'gate-open': ['wake-skiff', 'blossom-gate'],
    loom: ['wake-skiff', 'blossom-gate', 'relay-contact'],
    'loom-done': ['wake-skiff', 'blossom-gate', 'relay-contact', 'loom-fit'],
    chime: ['wake-skiff', 'blossom-gate', 'relay-contact', 'loom-fit'],
    'chime-done': ['wake-skiff', 'blossom-gate', 'relay-contact', 'loom-fit', 'chime-warmth'],
  },
  names: { spark: 'Catch the spark', skiff: 'Wake the skiff', land: 'Blossom Isle', 'gate-open': 'Blossom Isle, past the gate', loom: 'Loom Isle', 'loom-done': 'Loom Isle, Tavi freed', chime: 'Chime Isle', 'chime-done': 'Chime Isle, the bells ringing' },
};
