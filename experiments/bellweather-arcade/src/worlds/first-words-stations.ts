import type { StationSpec } from '../kit/station';
import { FIRST_WORDS_L1_RULES } from './first-words-rules';

// Level 1's three learning stations. Outcome ids come from
// VibeLearn/design/learning-design.json ("sequence": the generation loop,
// "context": the right input decides the output). Anchors are named places the
// game provides. The puzzle code (speech-puzzle.ts, island.ts, relay.ts) only
// renders and sends actions; their rules (first-words-rules.ts) judge
// the decisions listed here, and the stations award these stars.

export const FIRST_WORDS_L1_STATIONS: StationSpec[] = [
  {
    kind: 'station', id: 'wake-skiff', name: 'Wake the skiff', teaches: ['sequence'],
    place: { anchor: 'pilotStone', r: 2.4 }, action: 'Speak to the skiff', rules: 'first-words.wake-skiff',
    decisions: [{ id: 'next-input', asks: 'Which words should the core read to make the next one?' }],
    stars: {
      title: 'The skiff is awake!',
      rows: [
        { done: 'Woke the skiff' },
        { firstTry: 'next-input', text: 'Fed the core the whole sentence first try' },
        { objective: 'no-miss', text: 'Caught every word before it fell' },
      ],
    },
  },
  {
    kind: 'station', id: 'blossom-gate', name: 'The Gate reads your notes', teaches: ['context'],
    place: { anchor: 'gate-stone', r: 1.9 }, action: 'Talk to the Gate', rules: 'first-words.blossom-gate',
    decisions: [
      { id: 'destination-prediction', asks: 'Where will the Gate open, given these notes?' },
      { id: 'context-selection', asks: 'Which notes go in the satchel?', choice: { fields: ['slotA', 'slotB'] } },
      { id: 'source-support', asks: 'What does Mira\'s page tell you?' },
    ],
    stars: {
      title: 'The gate is open!',
      rows: [
        { done: 'Opened the gate' },
        { firstTry: 'context-selection', text: 'Opened it on your first try' },
        { firstTry: 'destination-prediction', text: 'Guessed where it would open, first try' },
      ],
    },
    content: {
      // one note per note board on the island (entities with params.note)
      notes: [
        { id: 'mira', short: 'Mira\'s map page', text: '“Past the Lotus Terraces, then up to the bell gardens. M.”' },
        { id: 'poster', short: 'Old festival poster', text: '“Cross the Old Bridge to the bell gardens!” (The bridge fell in the storm.)' },
        { id: 'warden', short: 'Warden\'s sign', text: '“Your friends are held at the East Falls.”' },
        { id: 'rumour', short: 'Scribbled note', text: '“Someone rushed off somewhere this morning.”' },
      ],
    },
  },
  {
    kind: 'station', id: 'relay-contact', name: 'Call Mira from the relay', teaches: ['context', 'sequence'],
    place: { anchor: 'relay', r: 2.2 }, action: 'Use the relay', rules: 'first-words.relay-contact',
    decisions: [
      { id: 'context-selection', asks: 'Which channel is Mira\'s?', choice: { fields: ['channel'] } },
      { id: 'next-input', asks: 'Which words should the relay read to make the next one?' },
    ],
    stars: {
      title: 'Mira heard you!',
      rows: [
        { done: 'Reached Mira' },
        { firstTry: 'context-selection', text: 'Picked Mira\'s channel first try' },
        { firstTry: 'next-input', text: 'Sent the whole message first try' },
      ],
    },
    content: { pinned: '“Lantern channel 7. M.” · “Warden: every channel jammed but 3.” · “Festival news on channel 5.”' },
  },
];

export const station = (id: string) => {
  const s = FIRST_WORDS_L1_STATIONS.find(x => x.id === id); if (!s) throw Error(`no station ${id}`); return s;
};

export const rulesFor = (spec: StationSpec) => {
  const r = FIRST_WORDS_L1_RULES.find(x => x.id === spec.rules); if (!r) throw Error(`no rules ${spec.rules}`); return r;
};
