import type { Expr, GameRulesSpec } from '../kit/game-rules';
import type { StationSpec } from '../kit/station';
import type { StoryScript } from '../kit/story-script';

// Stop 2, Loom Isle: "an engine reads pieces, not words, and its room is
// counted in pieces". Everything here is data, following
// design/stop2-loom-learning-design.json: the Word Loom's rules, its station
// (what it teaches, logs and rewards, and what its messages say) and the story
// around it. `src/loom.ts` only draws the loom console and sends actions.
// Splits are the game's simplified rule (common words are one piece; rare
// words, odd spellings and names break into parts); real splits come later.

const f = (field: string): Expr => ({ field });
const eq = (a: Expr, b: Expr): Expr => ({ op: 'eq', left: a, right: b });
const set = (field: string, value: Expr) => ({ op: 'set' as const, field, value });

export const LOOM_RULES: GameRulesSpec = {
  schemaVersion: '1', id: 'loom.word-loom', version: '1',
  state: {
    // lift three pieces (guided) → predict the jammed message's pieces → choose a call that fits
    phase: { type: 'enum', values: ['guided', 'predict', 'choose', 'done'], initial: 'guided' },
    lifted: { type: 'integer', initial: 0, min: 0, max: 3 },
  },
  actions: {
    lift: {
      when: eq(f('phase'), 'guided'),
      branches: [
        { when: eq(f('lifted'), 2), effects: [{ op: 'add', field: 'lifted', value: 1 }, set('phase', 'predict')], emits: ['piece-lifted', 'band-weaves'] },
        { effects: [{ op: 'add', field: 'lifted', value: 1 }], emits: ['piece-lifted'] },
      ],
    },
    // the first prediction counts; right or wrong, the loom then shows the split
    'predict.words': { when: eq(f('phase'), 'predict'), effects: [set('phase', 'choose')], emits: ['decide:predict-pieces:wrong:one-per-word', 'loom-splits'] },
    'predict.pieces': { when: eq(f('phase'), 'predict'), effects: [set('phase', 'choose')], emits: ['decide:predict-pieces:right:pieces', 'loom-splits'] },
    'predict.near': { when: eq(f('phase'), 'predict'), effects: [set('phase', 'choose')], emits: ['decide:predict-pieces:wrong:near-miss', 'loom-splits'] },
    'predict.letters': { when: eq(f('phase'), 'predict'), effects: [set('phase', 'choose')], emits: ['decide:predict-pieces:wrong:one-per-letter', 'loom-splits'] },
    'choose.short': { when: eq(f('phase'), 'choose'), effects: [], emits: ['decide:choose-message:wrong:fewer-letters', 'name-falls-off'] },
    'choose.common': { when: eq(f('phase'), 'choose'), effects: [set('phase', 'done')], emits: ['decide:choose-message:right:common-words', 'tavi-free'] },
  },
  objectives: { free: { when: eq(f('phase'), 'done') } },
};

/** a message as the loom sees it: each word's pieces */
export interface LoomMessage { id: string; text: string; pieces: string[][] }
export interface LoomContent {
  slots: number;
  guided: LoomMessage;
  jammed: LoomMessage;
  predict: { action: string; label: string; n: number }[];   // shown in a shuffled order
  choices: { action: string; message: LoomMessage }[];
  rule: string;
  realEngines: string;
}

export const LOOM_STATION: StationSpec & { content: LoomContent } = {
  kind: 'station', id: 'loom-fit', name: 'The Word Loom', teaches: ['pieces', 'room'],
  place: { anchor: 'loom-talk', r: 2.0 }, action: 'Use the Word Loom', rules: 'loom.word-loom',
  decisions: [
    { id: 'predict-pieces', asks: 'How many slots will this message need?' },
    { id: 'choose-message', asks: 'Which call fits the six slots and still names who to free?' },
  ],
  stars: {
    title: 'Tavi is free!',
    rows: [
      { done: 'Freed Tavi from the loom' },
      { firstTry: 'predict-pieces', text: 'Counted the pieces right, first try' },
      { firstTry: 'choose-message', text: 'Picked the call that fits, first try' },
    ],
  },
  content: {
    slots: 6,
    guided: { id: 'guided', text: 'Free the weaver', pieces: [['Free'], ['the'], ['weaver']] },
    jammed: { id: 'jammed', text: 'Free Tavi from the enchanted loom', pieces: [['Free'], ['Ta', 'vi'], ['from'], ['the'], ['en', 'chant', 'ed'], ['loom']] },
    predict: [
      { action: 'predict.words', label: '6', n: 6 },
      { action: 'predict.near', label: '8', n: 8 },
      { action: 'predict.pieces', label: '9', n: 9 },
      { action: 'predict.letters', label: '28', n: 28 },
    ],
    choices: [
      { action: 'choose.short', message: { id: 'short', text: 'Unhex enspelled Tavi', pieces: [['un', 'hex'], ['en', 'spell', 'ed'], ['Ta', 'vi']] } },
      { action: 'choose.common', message: { id: 'common', text: 'Please free the weaver Tavi', pieces: [['Please'], ['free'], ['the'], ['weaver'], ['Ta', 'vi']] } },
    ],
    rule: 'Common words are one piece. Rare words, odd spellings and names break into parts.',
    realEngines: 'Real engines learn their pieces from huge amounts of text, so their splits look odd. Spaces and capitals count too. Common words are usually one piece; rare words become several. Room is counted in those pieces.',
  },
};
export const STOP2_STATIONS: StationSpec[] = [LOOM_STATION];

/** Checks that the loom's content agrees with its rules' answers (a generator could get these wrong). */
export function checkLoomContent(c: LoomContent) {
  const issues: string[] = [];
  const count = (m: LoomMessage) => m.pieces.flat().length;
  const letters = (m: LoomMessage) => m.text.replace(/[^A-Za-z]/g, '').length;
  const words = (m: LoomMessage) => m.text.split(/\s+/).length;
  for (const m of [c.guided, c.jammed, ...c.choices.map(x => x.message)]) {
    if (m.pieces.map(p => p.join('')).join(' ').toLowerCase() !== m.text.toLowerCase()) issues.push(`"${m.text}": pieces don't spell the text`);
  }
  if (count(c.guided) > c.slots) issues.push('the guided message does not fit');
  if (count(c.jammed) <= c.slots) issues.push('the jammed message fits, so nothing is jammed');
  const right = c.predict.find(p => p.action === 'predict.pieces'), w = c.predict.find(p => p.action === 'predict.words'), l = c.predict.find(p => p.action === 'predict.letters');
  if (right?.n !== count(c.jammed)) issues.push(`the right prediction says ${right?.n}, the message has ${count(c.jammed)} pieces`);
  if (w?.n !== words(c.jammed)) issues.push('the one-per-word option is not the word count');
  if (l?.n !== letters(c.jammed)) issues.push('the one-per-letter option is not the letter count');
  const near = c.predict.find(p => p.action === 'predict.near');
  if (near && near.n === count(c.jammed)) issues.push('the near-miss option equals the answer');
  if (new Set(c.predict.map(p => p.n)).size !== c.predict.length) issues.push('two prediction options are the same number');
  for (const m of [c.jammed, ...c.choices.map(x => x.message)]) if (m.pieces.flat().some(p => p.replace(/[^A-Za-z]/g, '').length < 2)) issues.push(`"${m.text}" has a one-letter piece (it would teach that odd words break into letters)`);
  const short = c.choices.find(x => x.action === 'choose.short')!.message, common = c.choices.find(x => x.action === 'choose.common')!.message;
  if (count(short) <= c.slots) issues.push('the short call fits, so the tempting answer is not wrong');
  if (count(common) > c.slots) issues.push('the common-words call does not fit');
  if (letters(short) >= letters(common)) issues.push('the tempting call should have fewer letters');
  // overflow drops the last pieces: the tempting call must lose the name
  if (short.pieces.flat().slice(0, c.slots).join('').includes('Tavi')) issues.push('the short call keeps the name even when cut');
  return issues;
}

export const STOP2_STORY: StoryScript & { needs: { handlers: string[]; anchors: string[] } } = {
  id: 'first-words.stop2', title: 'The First Words — Stop 2: Loom Isle',
  needs: { handlers: ['board', 'openLoom', 'endStop'], anchors: ['skiffMoor', 'word-loom'] },
  beats: [
    { id: 'to-loom', goal: { text: 'Board the skiff to Loom Isle', at: 'skiffMoor' }, thoughts: [{ id: 'loom-next', delay: .8 }] },
    { id: 'loom', goal: { text: 'Find out why the loom is jammed', at: 'word-loom' }, place: 'Loom Isle', checkpoint: 'loom', thoughts: [{ id: 'loom-arrive', delay: 1 }] },
    { id: 'loom-puzzle', goal: null },
    { id: 'loom-done', goal: { text: 'That\'s Stop 2 for now. More isles soon!' }, checkpoint: 'loom-done' },
  ],
  dialogues: {
    hop: { start: { text: 'The skiff follows Mira\'s marks across the sky lanes.', choices: [{ label: 'Onward', kind: 'primary', on: 'board' }] } },
    tavi: {
      start: { speaker: 'Tavi', text: 'Who\'s there? The Warden jammed my loom. I\'m stuck behind the cloth!', choices: [{ label: 'I\'ll help', kind: 'primary', next: 'how' }] },
      how: { speaker: 'Tavi', text: 'The loom reads pieces, not words. Six slots on the rail, that\'s all.', choices: [{ label: 'Show me', kind: 'primary', on: 'openLoom' }] },
    },
    thanks: {
      start: { speaker: 'Tavi', text: 'Free! Mira passed through here. She left you this.', choices: [{ label: 'What is it?', kind: 'primary', next: 'gift' }] },
      gift: { speaker: 'Tavi', text: 'A splitter spool. Now you can break words into pieces too.', choices: [{ label: 'Thanks, Tavi', kind: 'primary', on: 'endStop' }] },
    },
  },
  thoughts: {
    'loom-next': { text: 'Loom Isle. Mira said they went past it.' },
    'loom-arrive': { text: ['A loom that counts pieces. Like me, but with more thread.', 'Hm. Somebody\'s humming behind that cloth.'] },
    'loom-warden': { who: 'warden', text: 'Six slots, little courier. Spend them wisely.' },
    'loom-pieces': { text: 'Pieces, not letters. Short isn\'t the same as small.' },
  },
  toasts: { lifted: 'Piece on the rail', overflow: 'Too many pieces!', fits: 'It fits!' },
  labels: { board: 'Board the skiff' },
  stars: {},
};

/** run by tools/storycheck.mjs */
export const STOP2_CONTENT_CHECK = () => checkLoomContent(LOOM_STATION.content);
