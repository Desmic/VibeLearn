import type { Expr, GameRulesSpec } from '../kit/game-rules';
import type { StationSpec } from '../kit/station';

// Level 1's skiff scene with the Echo & Engine mechanics (docs/GAME-REDESIGN-ECHO.md).
// Zip absorbs words from the world, loads them into his holographic speech
// engine and casts. The skiff obeys every word it hears. The assessed moment:
// the loop is broken after the first word, and the player chooses what the
// engine reads next (outcome `sequence`, decision `next-input`).
// All data: word sources, rules, station, what the engine knows.

export interface WordSource {
  id: string; word: string; line: string; kind: 'npc' | 'sign' | 'object';
  at: [number, number]; y: number; reach: number;
  /** follow a named scene object instead of a fixed spot (e.g. the moored skiff) */
  on?: string;
}
export const ECHO_SOURCES: WordSource[] = [
  { id: 'plaque', word: 'Skiff', line: 'A brass plaque on the hull: “SKIFF”.', kind: 'object', at: [2.6, -15.2], y: 4.5, reach: 5.4, on: 'skiff' },
  { id: 'kites', word: 'rise', line: '“Look at those kites rise over the falls!”', kind: 'npc', at: [-5.4, -11.1], y: 2.75, reach: 2.8 },
  { id: 'wind', word: 'toward', line: '“The wind blows toward Blossom Isle today.”', kind: 'npc', at: [6.6, -11.0], y: 2.45, reach: 2.8 },
  { id: 'crosswind', word: 'sink', line: '“Careful. Boats sink in a crosswind.”', kind: 'npc', at: [-4.3, -11.0], y: 2.2, reach: 2.8 },
];
/** the words the skiff's command needs (the others are decoys) */
export const ECHO_NEEDED = ['Skiff', 'rise', 'toward'];

const ABSORB = ECHO_SOURCES.map(s => s.word);
const MADE = ['Blossom', 'Isle'];
const SLOT_VALUES = ['none', ...ABSORB, ...MADE];
const SLOTS = 5;

const f = (field: string): Expr => ({ field });
const eq = (a: Expr, b: Expr): Expr => ({ op: 'eq', left: a, right: b });
const ne = (a: Expr, b: Expr): Expr => ({ op: 'ne', left: a, right: b });
const and = (...args: Expr[]): Expr => ({ op: 'and', args });
const or = (...args: Expr[]): Expr => ({ op: 'or', args });
const not = (arg: Expr): Expr => ({ op: 'not', arg });
const set = (field: string, value: Expr) => ({ op: 'set' as const, field, value });
const slot = (i: number) => f('s' + i);
const has = (w: string) => f('has' + w);
const inRing = (w: string) => or(...Array.from({ length: SLOTS }, (_, i) => eq(slot(i), w)));
/** the ring holds exactly these words, in order */
const ringIs = (...ws: string[]) => and(...Array.from({ length: SLOTS }, (_, i) => eq(slot(i), ws[i] ?? 'none')));
const editing = or(eq(f('phase'), 'load'), eq(f('phase'), 'loop'));

export const ECHO_SKIFF_RULES: GameRulesSpec = {
  schemaVersion: '1', id: 'first-words.wake-skiff.echo', version: '1',
  state: {
    // load: build the command · loop: the loop is broken, choose the next input · auto: the engine finishes · awake
    phase: { type: 'enum', values: ['load', 'loop', 'auto', 'awake'], initial: 'load' },
    ...Object.fromEntries([...ABSORB, 'Blossom'].map(w => ['has' + w, { type: 'boolean' as const, initial: false }])),
    ...Object.fromEntries(Array.from({ length: SLOTS }, (_, i) => ['s' + i, { type: 'enum' as const, values: SLOT_VALUES, initial: 'none' }])),
  },
  invariants: [{ id: 'ring-has-no-gaps', expression: and(...Array.from({ length: SLOTS - 1 }, (_, i) => or(ne(slot(i), 'none'), eq(slot(i + 1), 'none')))) }],
  actions: {
    ...Object.fromEntries(ABSORB.map(w => ['absorb.' + w, { when: and(ne(f('phase'), 'awake'), not(has(w))), effects: [set('has' + w, true)], emits: ['word-absorbed'] }])),
    ...Object.fromEntries([...ABSORB, 'Blossom'].map(w => ['load.' + w, {
      when: and(editing, has(w), not(inRing(w))),
      branches: Array.from({ length: SLOTS }, (_, i) => ({ when: eq(slot(i), 'none'), effects: [set('s' + i, w)], emits: ['word-loaded'] })),
    }])),
    ...Object.fromEntries(Array.from({ length: SLOTS }, (_, i) => ['unload.' + i, {
      when: and(editing, ne(slot(i), 'none')),
      effects: [...Array.from({ length: SLOTS - 1 - i }, (_, k) => set('s' + (i + k), slot(i + k + 1))), set('s' + (SLOTS - 1), 'none')],
      emits: ['word-unloaded'],
    }])),
    cast: {
      when: editing,
      branches: [
        { when: eq(slot(0), 'none'), effects: [], emits: ['nothing-loaded'] },
        // building the command: the skiff hears the ring read aloud, then the engine's next word
        { when: and(eq(f('phase'), 'load'), inRing('sink')), effects: [], emits: ['engine-says:um', 'skiff-hears:sink'] },
        { when: and(eq(f('phase'), 'load'), ringIs('Skiff', 'rise', 'toward')), effects: [set('phase', 'loop'), set('hasBlossom', true)], emits: ['engine-says:Blossom', 'loop-breaks'] },
        { when: eq(f('phase'), 'load'), effects: [], emits: ['engine-says:um'] },
        // the loop is broken: the player chooses what the engine reads next
        { when: ringIs('Skiff', 'rise', 'toward', 'Blossom'), effects: [set('phase', 'auto')], emits: ['decide:next-input:right:whole-sentence', 'engine-says:Isle', 'loop-repaired'] },
        { when: ringIs('Blossom'), effects: [], emits: ['decide:next-input:wrong:newest-only', 'engine-says:petals'] },
        { when: ringIs('Skiff', 'rise', 'toward'), effects: [], emits: ['decide:next-input:wrong:original-only', 'engine-says:Blossom'] },
        { effects: [], emits: ['decide:next-input:wrong:partial', 'engine-says:um'] },
      ],
    },
    // with the loop repaired, the engine adds its word by itself and the sentence ends
    'loop-run': { when: eq(f('phase'), 'auto'), effects: [set('s4', 'Isle'), set('phase', 'awake')], emits: ['engine-says:.', 'skiff-awake'] },
  },
  objectives: {
    awake: { when: eq(f('phase'), 'awake') },
    'every-word': { when: and(eq(f('phase'), 'awake'), ...ABSORB.map(has)) },
  },
};

/** what the engine has heard Bellweather say: ring words → next-word guesses with weights */
export interface EngineKnowledge { known: Record<string, [string, number][]>; unsure: [string, number][] }
export interface EchoContent { slots: number; target: string; knowledge: EngineKnowledge; realEngines: string; lines: Record<string, string> }

export const ECHO_SKIFF_STATION: StationSpec & { content: EchoContent } = {
  kind: 'station', id: 'wake-skiff', name: 'Wake the skiff (Echo)', teaches: ['sequence'],
  place: { anchor: 'pilotStone', r: 2.4 }, action: 'Open your engine', rules: 'first-words.wake-skiff.echo',
  decisions: [{ id: 'next-input', asks: 'The loop is broken. What should the engine read to make the next word?' }],
  stars: {
    title: 'The skiff is awake!',
    rows: [
      { done: 'Woke the skiff' },
      { firstTry: 'next-input', text: 'Fixed the loop on your first try' },
      { objective: 'every-word', text: 'Found every word around the outlook' },
    ],
  },
  content: {
    slots: SLOTS,
    target: 'Skiff rise toward Blossom Isle',
    knowledge: {
      known: {
        'Skiff rise toward': [['Blossom', .72], ['the', .17], ['home', .11]],
        'Skiff rise toward Blossom': [['Isle', .86], ['Bay', .08], ['gardens', .06]],
        'Skiff rise toward Blossom Isle': [['.', .93], ['now', .07]],
        'Blossom': [['petals', .55], ['trees', .3], ['Isle', .15]],
      },
      unsure: [['um', .36], ['the', .33], ['…', .31]],
    },
    // what the engine's hologram says to the player (HTML allowed: <b>)
    lines: {
      open: 'Your engine! Tap words to load its <b>ring</b>, then <b>Cast</b>.',
      empty: 'The ring is empty. Tap a word to load it.',
      reading: 'Reading the ring…',
      um: 'The engine wasn\'t sure, so it said <b>“um”</b>. Try other words, or another order.',
      umHint: 'Try: the skiff\'s <b>name</b>, then what to <b>do</b>, then the <b>way</b>.',
      sink: 'The skiff heard <b>“sink”</b>… and sank. Machines obey every word!',
      loopBroken: 'It guessed <b>“Blossom”</b>! The loop that feeds guesses back is broken. Load the next words yourself.',
      again: '<b>“Blossom”</b> again! Same words in, same guess out.',
      petals: 'It read only <b>“Blossom”</b>, so it thought of <b>petals</b>.',
      partial: 'Something\'s missing. The engine wasn\'t sure what comes next.',
      repaired: 'It said <b>“Isle”</b>! Loop repaired. Now it feeds itself…',
      done: 'The sentence is complete. <b>Listen…</b>',
      launch: '<b>“Skiff rise toward Blossom Isle.”</b> It listened!',
    },
    realEngines: 'Real models guess pieces of words, learned from huge amounts of text. The loop is the same: each new piece joins the input. Whether anything like a Stream sits behind the words is still an open question.',
  },
};
export const ECHO_STATIONS: StationSpec[] = [ECHO_SKIFF_STATION];

/** Does what the engine shows agree with what the rules say it says? (run by storycheck) */
export const ECHO_CONTENT_CHECK = () => {
  const issues: string[] = [], k = ECHO_SKIFF_STATION.content.knowledge;
  const top = (key: string) => [...(k.known[key] ?? k.unsure)].sort((a, b) => b[1] - a[1])[0][0];
  const expect: [string, string][] = [['Skiff rise toward', 'Blossom'], ['Skiff rise toward Blossom', 'Isle'], ['Blossom', 'petals'], ['Skiff rise toward Blossom Isle', '.'], ['rise Skiff toward', 'um']];
  for (const [ring, said] of expect) if (top(ring) !== said) issues.push(`the engine's top guess for "${ring}" is "${top(ring)}", the rules say "${said}"`);
  for (const [key, gs] of Object.entries(k.known)) { const s = gs.reduce((a, g) => a + g[1], 0); if (Math.abs(s - 1) > .02) issues.push(`guesses for "${key}" add up to ${s.toFixed(2)}`); }
  if (ECHO_SKIFF_STATION.content.target.split(' ').length !== SLOTS) issues.push('the finished command does not fill the ring exactly');
  for (const w of ECHO_NEEDED) if (!ECHO_SOURCES.some(s => s.word === w)) issues.push(`no source in the world for "${w}"`);
  return issues;
};
