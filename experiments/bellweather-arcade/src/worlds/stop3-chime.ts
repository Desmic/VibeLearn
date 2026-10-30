import type { Expr, GameRulesSpec } from '../kit/game-rules';
import type { StationSpec } from '../kit/station';
import type { StoryScript } from '../kit/story-script';

// Stop 3, Chime Isle: "the engine picks its next word by chance, weighted by brightness; warmth
// reshapes the spread". Everything here is data, following design/stop3-warmth-learning-design.json:
// the chime tower's rules, its station (what it teaches, logs and rewards, what the engine knows)
// and the story around it. The console only draws and sends actions.
// Warmth is three notches; the shown spread is the guesses' weights raised to 1/warmth and
// normalised (real temperature, at three settings).

const f = (field: string): Expr => ({ field });
const eq = (a: Expr, b: Expr): Expr => ({ op: 'eq', left: a, right: b });
const set = (field: string, value: Expr) => ({ op: 'set' as const, field, value });
const WARMTHS = ['cold', 'warm', 'hot'] as const;
export type Warmth = typeof WARMTHS[number];
/** the temperature each notch stands for */
export const WARMTH_T: Record<Warmth, number> = { cold: .2, warm: 1, hot: 3.5 };

export const CHIME_RULES: GameRulesSpec = {
  schemaVersion: '1', id: 'chime.warmth', version: '1',
  state: {
    // two casts (guided) → predict cold → the lock (exact) → the bard (fresh) → done
    phase: { type: 'enum', values: ['guided', 'predict', 'lock', 'bard', 'done'], initial: 'guided' },
    casts: { type: 'integer', initial: 0, min: 0, max: 2 },
    warmth: { type: 'enum', values: [...WARMTHS], initial: 'warm' },
  },
  actions: {
    cast: {
      when: eq(f('phase'), 'guided'),
      branches: [
        { when: eq(f('casts'), 1), effects: [{ op: 'add', field: 'casts', value: 1 }, set('phase', 'predict')], emits: ['cast', 'dial-found'] },
        { effects: [{ op: 'add', field: 'casts', value: 1 }], emits: ['cast'] },
      ],
    },
    // what five cold casts give: committed before they're shown
    'predict.same': { when: eq(f('phase'), 'predict'), effects: [set('phase', 'lock'), set('warmth', 'warm')], emits: ['decide:predict-cold:right:brightest-every-time', 'cold-shown'] },
    'predict.varied': { when: eq(f('phase'), 'predict'), effects: [set('phase', 'lock'), set('warmth', 'warm')], emits: ['decide:predict-cold:wrong:different-each-time', 'cold-shown'] },
    'predict.dimmest': { when: eq(f('phase'), 'predict'), effects: [set('phase', 'lock'), set('warmth', 'warm')], emits: ['decide:predict-cold:wrong:dimmest', 'cold-shown'] },
    'predict.nonsense': { when: eq(f('phase'), 'predict'), effects: [set('phase', 'lock'), set('warmth', 'warm')], emits: ['decide:predict-cold:wrong:nonsense', 'cold-shown'] },
    // the dial, while there's a machine to cast at
    ...Object.fromEntries(WARMTHS.map(w => [`dial.${w}`, { when: { op: 'in', left: f('phase'), right: ['lock', 'bard'] }, effects: [set('warmth', w)] }])),
    // the vault lock needs the exact word: cold
    'cast.lock': {
      when: eq(f('phase'), 'lock'),
      branches: [
        // (the dial stays where it was: the bard's line then needs a deliberate turn, not the default)
        { when: eq(f('warmth'), 'cold'), effects: [set('phase', 'bard')], emits: ['decide:warmth-for-exact:right:cold', 'vault-opens'] },
        { when: eq(f('warmth'), 'warm'), effects: [], emits: ['decide:warmth-for-exact:wrong:warm', 'lock-grinds'] },
        { effects: [], emits: ['decide:warmth-for-exact:wrong:hot', 'lock-jams'] },
      ],
    },
    // the bard needs a line the crowd hasn't heard: warm
    'cast.bard': {
      when: eq(f('phase'), 'bard'),
      branches: [
        { when: eq(f('warmth'), 'warm'), effects: [set('phase', 'done')], emits: ['decide:warmth-for-fresh:right:warm', 'crowd-cheers'] },
        { when: eq(f('warmth'), 'cold'), effects: [], emits: ['decide:warmth-for-fresh:wrong:cold', 'heard-it'] },
        { effects: [], emits: ['decide:warmth-for-fresh:wrong:hot', 'word-salad'] },
      ],
    },
  },
  objectives: { sung: { when: eq(f('phase'), 'done') } },
};

/** what the engine knows at a machine: its ring, and the guesses with their weights (brightness at warm) */
export interface ChimeTable { ring: string[]; guesses: { word: string; w: number; sense: boolean }[] }
export interface ChimeContent {
  tower: ChimeTable;   // the guided casts and the cold prediction
  lock: ChimeTable & { needs: string };
  bard: ChimeTable & { tired: string; verse: string };
  predict: { action: string; label: string }[];
  /** what the guided casts land on, in order (drawn from the spread, fixed so the lesson always shows) */
  guidedLands: string[];
  honesty: string;
}

export const CHIME_STATION: StationSpec & { content: ChimeContent } = {
  kind: 'station', id: 'chime-warmth', name: 'The Chime Tower', teaches: ['sampling', 'temperature'],
  place: { anchor: 'chime-tower', r: 3.8 }, action: 'Ask the chime tower', rules: 'chime.warmth',
  decisions: [
    { id: 'predict-cold', asks: 'Turned cold, what will five casts say?' },
    { id: 'warmth-for-exact', asks: 'What warmth does a lock that needs the exact word want?' },
    { id: 'warmth-for-fresh', asks: 'What warmth does a bard who needs a fresh verse want?' },
  ],
  stars: {
    title: 'The bells ring again!',
    rows: [
      { done: 'Opened the vault and found the bard a new line' },
      { firstTry: 'predict-cold', text: 'Knew what cold would do, first try' },
      { firstTry: 'warmth-for-fresh', text: 'Warmed the bard\'s verse just right, first try' },
    ],
  },
  content: {
    tower: { ring: ['The', 'bell', 'rings', 'at'], guesses: [
      { word: 'noon', w: .52, sense: true }, { word: 'dusk', w: .24, sense: true }, { word: 'dawn', w: .14, sense: true },
      { word: 'midnight', w: .07, sense: true }, { word: 'cabbage', w: .03, sense: false }] },
    lock: { ring: ['Bellweather', 'rings', 'its', 'bell', 'at'], needs: 'noon', guesses: [
      { word: 'noon', w: .55, sense: true }, { word: 'dusk', w: .22, sense: true }, { word: 'dawn', w: .13, sense: true },
      { word: 'midnight', w: .07, sense: true }, { word: 'teacups', w: .03, sense: false }] },
    bard: { ring: ['Lanterns', 'over', 'the'], tired: 'square', verse: 'Lanterns over the', guesses: [
      { word: 'square', w: .5, sense: true }, { word: 'harbour', w: .2, sense: true }, { word: 'rooftops', w: .14, sense: true },
      { word: 'water', w: .1, sense: true }, { word: 'spoons', w: .04, sense: false }, { word: 'Tuesday', w: .02, sense: false }] },
    predict: [
      { action: 'predict.same', label: '“noon”, all five times' },
      { action: 'predict.varied', label: 'A different word each time' },
      { action: 'predict.dimmest', label: 'The dimmest word, “cabbage”' },
      { action: 'predict.nonsense', label: 'Nonsense' },
    ],
    guidedLands: ['noon', 'dusk'],
    honesty: 'Real engines have a temperature number. Near zero they nearly always take their most likely next piece; higher, unlikely pieces come out more often, until the text stops making sense. Many also trim the spread first so the oddest pieces can\'t be picked.',
  },
};
export const STOP3_STATIONS: StationSpec[] = [CHIME_STATION];

/** the spread at a warmth: each weight raised to 1/T, normalised (what the fan shows) */
export function spread(t: ChimeTable, warmth: Warmth) {
  const T = WARMTH_T[warmth], p = t.guesses.map(g => Math.pow(g.w, 1 / T)), s = p.reduce((a, b) => a + b, 0);
  return t.guesses.map((g, i) => ({ ...g, p: p[i] / s }));
}

/** Checks that what the engine knows agrees with what the rules judge (a generator could get these wrong). */
export function checkChimeContent(c: ChimeContent) {
  const issues: string[] = [];
  for (const [name, t] of [['tower', c.tower], ['lock', c.lock], ['bard', c.bard]] as const) {
    const sum = t.guesses.reduce((a, g) => a + g.w, 0);
    if (Math.abs(sum - 1) > .02) issues.push(`${name}: weights sum to ${sum.toFixed(2)}, not 1`);
    const w = t.guesses.map(g => g.w); if (w.some((x, i) => i && x > w[i - 1])) issues.push(`${name}: guesses not in brightness order`);
    const cold = spread(t, 'cold'), hot = spread(t, 'hot');
    if (cold[0].p < .95) issues.push(`${name}: cold does not all but always pick "${t.guesses[0].word}" (${cold[0].p.toFixed(2)})`);
    if (hot[0].p > .4) issues.push(`${name}: hot leaves "${t.guesses[0].word}" too likely (${hot[0].p.toFixed(2)}) to show the flattening`);
    if (!t.guesses.some(g => !g.sense)) issues.push(`${name}: no nonsense guess for hot to reach`);
  }
  if (c.lock.guesses[0].word !== c.lock.needs) issues.push('the lock needs a word that is not its brightest guess (cold would fail)');
  if (c.bard.guesses[0].word !== c.bard.tired) issues.push('the bard\'s tired line is not the brightest guess (cold would not repeat it)');
  if (c.guidedLands.length !== 2 || c.guidedLands[0] === c.guidedLands[1]) issues.push('the guided casts must land on two different words');
  for (const wd of c.guidedLands) if (!c.tower.guesses.some(g => g.word === wd && g.sense)) issues.push(`guided cast lands on "${wd}", not a sensible tower guess`);
  if (!c.predict.some(p => p.action === 'predict.same')) issues.push('no right prediction offered');
  return issues;
}

export const STOP3_STORY: StoryScript & { needs: { handlers: string[]; anchors: string[] } } = {
  id: 'first-words.stop3', title: 'The First Words — Stop 3: Chime Isle',
  protagonist: 'Zip', thoughtVoices: { warden: 'Warden' },
  needs: { handlers: ['board3', 'openChime', 'endStop3'], anchors: ['chimeMoor', 'chime-tower'] },
  beats: [
    { id: 'to-chime', goal: { text: 'Board the skiff to Chime Isle', at: 'chimeMoor' }, thoughts: [{ id: 'chime-next', delay: .8 }] },
    { id: 'chime', goal: { text: 'Find out why the bells are silent', at: 'chime-tower' }, place: 'Chime Isle', checkpoint: 'chime', thoughts: [{ id: 'chime-arrive', delay: 1 }] },
    { id: 'chime-puzzle', goal: null },
    { id: 'chime-done', goal: { text: 'That\'s Stop 3 for now. More isles soon!' }, checkpoint: 'chime-done' },
  ],
  dialogues: {
    hop3: { start: { text: 'Mira\'s marks lead on, toward the sound of bells that aren\'t ringing.', choices: [{ label: 'Onward', kind: 'primary', on: 'board3' }] } },
    bard: {
      start: { speaker: 'Oriel', text: 'A courier! The Warden locked our bells and stole my songbook.', choices: [{ label: 'I\'ll help', kind: 'primary', next: 'how' }] },
      how: { speaker: 'Oriel', text: 'The tower answers anyone who asks. It\'s never said the same thing twice.', choices: [{ label: 'Let me ask', kind: 'primary', on: 'openChime' }] },
    },
    thanks: {
      start: { speaker: 'Oriel', text: 'A new verse! Mira sang here too. She left you this.', choices: [{ label: 'What is it?', kind: 'primary', next: 'gift' }] },
      gift: { speaker: 'Oriel', text: 'A warmth dial. Turn it cold to be sure, warm to surprise.', choices: [{ label: 'Thanks, Oriel', kind: 'primary', on: 'endStop3' }] },
    },
  },
  thoughts: {
    'chime-next': { text: 'Bells, but no ringing. The Warden\'s been here.' },
    'chime-arrive': { text: ['A whole isle of bells, and not one ringing.', 'Very ominous. Very festival.'] },
    'chime-twice': { text: ['Same words in, different word out?', 'It picks by brightness, not always the brightest.'] },
    'chime-warden': { who: 'warden', text: 'Turn it up all the way, little courier. See what happens.' },
    'chime-done': { text: ['Cold to be sure. Warm to surprise.', 'Hot to embarrass yourself in public.'] },
  },
  toasts: { cast: 'Cast!', vault: 'The vault opens!', cheer: 'The crowd cheers!' },
  labels: { board3: 'Board the skiff' },
  stars: {},
};

/** run by tools/storycheck.mjs */
export const STOP3_CONTENT_CHECK = () => checkChimeContent(CHIME_STATION.content);
