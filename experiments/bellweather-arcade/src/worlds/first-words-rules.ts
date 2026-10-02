import type { Branch, Expr, GameRulesSpec } from '../kit/game-rules';

// The rules of Level 1's three puzzles, as GameRulesSpec v1 data (the format
// the server's `app/game_rules.py` runs). The puzzle code only renders and sends
// semantic actions; whether a choice was right comes from these rules, through
// `decide:<decision>:<right|wrong>[:<choice>]` events that the station logs.
// The helpers below only write data; `tools/export-rules.mjs` writes the JSON.

const f = (field: string): Expr => ({ field });
const eq = (a: Expr, b: Expr): Expr => ({ op: 'eq', left: a, right: b });
const ne = (a: Expr, b: Expr): Expr => ({ op: 'ne', left: a, right: b });
const and = (...args: Expr[]): Expr => ({ op: 'and', args });
const or = (...args: Expr[]): Expr => ({ op: 'or', args });
const not = (arg: Expr): Expr => ({ op: 'not', arg });
const set = (field: string, value: Expr) => ({ op: 'set' as const, field, value });
const bool = (initial = false) => ({ type: 'boolean' as const, initial });
const oneOf = (values: string[], initial = values[0]) => ({ type: 'enum' as const, values, initial });

// ── Wake the skiff: the core reads the words you pick, then says the next one ──
const SKIFF_WORDS = ['Skiff', 'rise', 'toward'];   // on the rail when the player first feeds
const picked = (i: number) => f('pick' + i);
const clearPicks = SKIFF_WORDS.map((_, i) => set('pick' + i, false));
export const SKIFF_RULES: GameRulesSpec = {
  schemaVersion: '1', id: 'first-words.wake-skiff', version: '1',
  state: {
    // place the first word → catch two → feed the core → catch the word it makes → the loop finishes
    phase: oneOf(['place', 'catch', 'feed', 'catch-last', 'loop', 'awake']),
    caught: { type: 'integer', initial: 0, min: 0, max: 2 },
    missed: bool(),
    ...Object.fromEntries(SKIFF_WORDS.map((_, i) => ['pick' + i, bool()])),
  },
  actions: {
    place: { when: eq(f('phase'), 'place'), effects: [set('phase', 'catch')], emits: ['word-placed'] },
    catch: {
      when: or(eq(f('phase'), 'catch'), eq(f('phase'), 'catch-last')),
      branches: [
        { when: eq(f('phase'), 'catch-last'), effects: [set('phase', 'loop')], emits: ['word-caught', 'loop-runs'] },
        { when: eq(f('caught'), 1), effects: [{ op: 'add', field: 'caught', value: 1 }, set('phase', 'feed')], emits: ['word-caught', 'ready-to-feed'] },
        { effects: [{ op: 'add', field: 'caught', value: 1 }], emits: ['word-caught'] },
      ],
    },
    drop: { when: or(eq(f('phase'), 'catch'), eq(f('phase'), 'catch-last')), effects: [set('missed', true)], emits: ['word-dropped'] },
    ...Object.fromEntries(SKIFF_WORDS.map((_, i) => ['pick.' + i, { when: eq(f('phase'), 'feed'), effects: [set('pick' + i, not(picked(i)))] }])),
    feed: {
      when: eq(f('phase'), 'feed'),
      branches: [
        { when: and(not(picked(0)), not(picked(1)), not(picked(2))), effects: [], emits: ['nothing-picked'] },
        { when: and(picked(0), picked(1), picked(2)), effects: [set('phase', 'catch-last')], emits: ['decide:next-input:right:full-sentence', 'core-says-next'] },
        // a wrong feed: the core says something silly, and the player picks again from scratch
        { when: and(not(picked(0)), not(picked(1)), picked(2)), effects: clearPicks, emits: ['decide:next-input:wrong:newest-only'] },
        { when: and(picked(0), not(picked(1)), not(picked(2))), effects: clearPicks, emits: ['decide:next-input:wrong:first-only'] },
        { effects: clearPicks, emits: ['decide:next-input:wrong:partial'] },
      ],
    },
    'loop-done': { when: eq(f('phase'), 'loop'), effects: [set('phase', 'awake')], emits: ['skiff-awake'] },
  },
  objectives: { awake: { when: eq(f('phase'), 'awake') }, 'no-miss': { when: and(eq(f('phase'), 'awake'), not(f('missed'))) } },
};

// ── The Gate: it opens exactly where the notes in the satchel point ──
export const NOTE_IDS = ['mira', 'poster', 'warden', 'rumour'] as const;
const slotVals = ['none', ...NOTE_IDS];
const has = (n: string) => or(eq(f('slotA'), n), eq(f('slotB'), n));
// what the gate will do with these notes (first match wins, as in the story)
const OUTCOMES: { id: string; when: Expr; expect: string }[] = [
  { id: 'blend', when: and(has('mira'), has('warden')), expect: 'unclear' },
  { id: 'decoy', when: has('warden'), expect: 'east' },
  { id: 'stale', when: has('poster'), expect: 'bridge' },
  { id: 'open', when: has('mira'), expect: 'lotus' },
  { id: 'vague', when: true, expect: 'unclear' },
];
const PREDICTIONS = ['lotus', 'east', 'bridge', 'unclear'];
// a prediction is judged against the outcome; the bag is judged as context; then
// Mira's page (if carried) is asked about once, or the gate runs
const predictBranches = (p: string): Branch[] => OUTCOMES.flatMap((o, i) => {
  const earlier = OUTCOMES.slice(0, i).map(x => not(x.when));
  const outcome = and(...earlier, o.when);
  const judged = [`decide:destination-prediction:${o.expect === p ? 'right' : 'wrong'}:${p}`, `decide:context-selection:${o.id === 'open' ? 'right' : 'wrong'}`];
  return [
    { when: and(outcome, has('mira'), not(f('askedSupport'))), effects: [set('phase', 'support'), set('askedSupport', true)], emits: [...judged, 'ask-support'] },
    { when: outcome, effects: [set('phase', 'run')], emits: judged },
  ];
});
export const GATE_RULES: GameRulesSpec = {
  schemaVersion: '1', id: 'first-words.blossom-gate', version: '1',
  state: {
    phase: oneOf(['arrived', 'bag', 'predict', 'support', 'run', 'open']),
    slotA: oneOf(slotVals, 'none'), slotB: oneOf(slotVals, 'none'),
    askedSupport: bool(), failed: bool(),
  },
  invariants: [{ id: 'no-duplicate-note', expression: or(eq(f('slotB'), 'none'), ne(f('slotA'), f('slotB'))) }],
  actions: {
    'take-satchel': { when: eq(f('phase'), 'arrived'), effects: [set('phase', 'bag')], emits: ['satchel-taken'] },
    // take a note: into the first free slot; with both full it swaps out the oldest
    ...Object.fromEntries(NOTE_IDS.map(n => ['take.' + n, {
      when: and(eq(f('phase'), 'bag'), not(has(n))),
      branches: [
        { when: eq(f('slotA'), 'none'), effects: [set('slotA', n), set('failed', false)], emits: ['note-taken'] },
        { when: eq(f('slotB'), 'none'), effects: [set('slotB', n), set('failed', false)], emits: ['note-taken'] },
        { effects: [set('slotA', f('slotB')), set('slotB', n), set('failed', false)], emits: ['note-swapped'] },
      ],
    }])),
    ...Object.fromEntries(NOTE_IDS.map(n => ['put.' + n, {
      when: and(eq(f('phase'), 'bag'), has(n)),
      branches: [
        { when: eq(f('slotA'), n), effects: [set('slotA', f('slotB')), set('slotB', 'none'), set('failed', false)], emits: ['note-returned'] },
        { effects: [set('slotB', 'none'), set('failed', false)], emits: ['note-returned'] },
      ],
    }])),
    speak: {
      when: eq(f('phase'), 'bag'),
      branches: [
        { when: eq(f('slotA'), 'none'), effects: [], emits: ['gate-needs-notes'] },
        { effects: [set('phase', 'predict')], emits: ['gate-reads-notes'] },
      ],
    },
    ...Object.fromEntries(PREDICTIONS.map(p => ['predict.' + p, { when: eq(f('phase'), 'predict'), branches: predictBranches(p) }])),
    ...Object.fromEntries([['route', 'right'], ['safe', 'wrong'], ['held', 'wrong']].map(([c, r]) => ['support.' + c, {
      when: eq(f('phase'), 'support'), effects: [set('phase', 'run')], emits: [`decide:source-support:${r}:${c}`],
    }])),
    run: {
      when: eq(f('phase'), 'run'),
      branches: OUTCOMES.map((o, i) => ({
        when: and(...OUTCOMES.slice(0, i).map(x => not(x.when)), o.when),
        effects: o.id === 'open' ? [set('phase', 'open')] : [set('phase', 'bag'), set('failed', true)],
        emits: ['gate-' + o.id],
      })),
    },
  },
  objectives: { open: { when: eq(f('phase'), 'open') } },
};

// ── The relay: pick Mira's channel, then send the whole message ──
const CHANNELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const word = (i: number) => f('word' + i);
const clearWords = [0, 1, 2].map(i => set('word' + i, false));
export const RELAY_RULES: GameRulesSpec = {
  schemaVersion: '1', id: 'first-words.relay-contact', version: '1',
  state: {
    phase: oneOf(['tune', 'words', 'done']),
    channel: { type: 'integer', initial: 1, min: 1, max: 9 },
    word0: bool(), word1: bool(), word2: bool(),
  },
  actions: {
    ...Object.fromEntries(CHANNELS.map(c => ['tune.' + c, { when: eq(f('phase'), 'tune'), effects: [set('channel', c)] }])),
    call: {
      when: eq(f('phase'), 'tune'),
      branches: [
        { when: eq(f('channel'), 7), effects: [set('phase', 'words')], emits: ['decide:context-selection:right', 'mira-answers'] },
        { when: eq(f('channel'), 3), effects: [], emits: ['decide:context-selection:wrong', 'warden-answers'] },
        { when: eq(f('channel'), 5), effects: [], emits: ['decide:context-selection:wrong', 'festival-radio'] },
        { effects: [], emits: ['decide:context-selection:wrong', 'static'] },
      ],
    },
    ...Object.fromEntries([0, 1, 2].map(i => ['word.' + i, { when: eq(f('phase'), 'words'), effects: [set('word' + i, not(word(i)))] }])),
    send: {
      when: eq(f('phase'), 'words'),
      branches: [
        { when: and(not(word(0)), not(word(1)), not(word(2))), effects: [], emits: ['nothing-picked'] },
        { when: and(word(0), word(1), word(2)), effects: [set('phase', 'done')], emits: ['decide:next-input:right:all', 'mira-hears'] },
        { when: and(not(word(0)), not(word(1)), word(2)), effects: clearWords, emits: ['decide:next-input:wrong:newest'] },
        { when: not(word(0)), effects: clearWords, emits: ['decide:next-input:wrong:no-card'] },
        { effects: clearWords, emits: ['decide:next-input:wrong:partial'] },
      ],
    },
  },
  objectives: { reached: { when: eq(f('phase'), 'done') } },
};

export const FIRST_WORDS_L1_RULES: GameRulesSpec[] = [SKIFF_RULES, GATE_RULES, RELAY_RULES];
