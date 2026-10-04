// A second, deliberately different game, as data only: the fixture that proves the system's
// checks are not Bellweather's (the old critic system's anti-overfitting rule, kept). Different
// subject (fair shares: fractions), different world, names, storage keys, puzzle shape and
// progress. `npm run check:fixture` runs the manifest, story, station, progress, rules proofs
// and the intent generator on it. Never shipped; a new system check should pass here too.
const f = field => ({ field });
const eq = (a, b) => ({ op: 'eq', left: a, right: b });
const set = (field, value) => ({ op: 'set', field, value });

const SHARE_RULES = {
  schemaVersion: '1', id: 'night-market.fair-shares', version: '1',
  state: { phase: { type: 'enum', values: ['cut', 'serve', 'done'], initial: 'cut' }, pieces: { type: 'integer', initial: 1, min: 1, max: 8 } },
  actions: {
    ...Object.fromEntries([2, 3, 4, 6].map(n => ['cut.' + n, { when: eq(f('phase'), 'cut'), effects: [set('pieces', n)] }])),
    serve: {
      when: eq(f('phase'), 'cut'),
      branches: [
        { when: eq(f('pieces'), 3), effects: [set('phase', 'serve')], emits: ['decide:equal-parts:right:thirds'] },
        { when: eq(f('pieces'), 6), effects: [set('phase', 'serve')], emits: ['decide:equal-parts:right:sixths'] },
        { effects: [set('pieces', 1)], emits: ['decide:equal-parts:wrong:uneven'] },
      ],
    },
    ...Object.fromEntries([[1, 3], [2, 6]].map(([k, fair]) => ['give.' + k, { when: eq(f('phase'), 'serve'), branches: [
      { when: eq(f('pieces'), fair), effects: [set('phase', 'done')], emits: ['decide:share-size:right:fair'] },
      { effects: [], emits: ['decide:share-size:wrong:unfair'] },
    ] }])),
  },
  objectives: { shared: { when: eq(f('phase'), 'done') } },
};

const SHARE_STATION = {
  kind: 'station', id: 'fair-shares', name: 'Share the moon pie', teaches: ['equal-parts'],
  place: { anchor: 'pie-stall', r: 2 }, action: 'Cut the pie', rules: 'night-market.fair-shares',
  decisions: [
    { id: 'equal-parts', asks: 'How many equal pieces for three friends?', choice: { fields: ['pieces'] } },
    { id: 'share-size', asks: 'How many pieces does each friend get?' },
  ],
  stars: { title: 'Everyone got the same!', rows: [{ done: 'Shared the pie' }, { firstTry: 'equal-parts', text: 'Cut fair pieces first try' }, { firstTry: 'share-size', text: 'Served fair shares first try' }] },
};

const STORY = {
  id: 'night-market.one', title: 'Night Market — the pie stall', protagonist: 'Pell',
  needs: { handlers: ['openStall'], anchors: ['pie-stall', 'lantern-gate'] },
  beats: [
    { id: 'arrive', goal: { text: 'Find the pie stall', at: 'pie-stall' }, place: 'Night Market', checkpoint: 'market' },
    { id: 'shared', goal: { text: 'Light the lantern gate', at: 'lantern-gate' }, checkpoint: 'stall-open' },
  ],
  dialogues: { odo: { start: { speaker: 'Odo', text: 'Three friends, one pie. Make it fair.', choices: [{ label: 'On it', on: 'openStall' }] } } },
  thoughts: {}, toasts: {}, labels: {}, stars: {},
};

export const GAME = {
  schema: 'vibelearn.game.v1', id: 'night-market', title: 'Night Market',
  teaches: 'A fraction is one of several equal parts of a whole.', audience: '18+', protagonist: 'Pell',
  testEntry: 'title=0',
  storage: { save: 'nightmarket.save.v2', learning: 'nightmarket.log.v2', decided: 'nightmarket.firsts.v2' },
  stations: [SHARE_STATION], rules: [SHARE_RULES],
  progress: { order: ['market', 'stall-open'], requires: { 'stall-open': ['fair-shares'] }, names: { market: 'The market', 'stall-open': 'The pie stall' } },
  stories: [STORY],
  input: ['touch', 'keyboard'], devices: { low: 'any phone from 2022' },
  tests: 'fixtures/night-market/tests.mjs', nouns: ['Night Market', 'Pell', 'Odo'],
};
