// Rule check: proves things about every puzzle before anyone plays it, from its rules data
// alone (GameRulesSpec v1, kit/game-rules.ts). Game-agnostic: a generated game's puzzles get
// the same proof. For each rules spec it explores every reachable state (breadth-first, with
// the game's own rules engine) and checks:
//   - SOLVABLE: the goal (the spec's first objective) can be reached;
//   - PERFECT RUN: it can be reached without a single wrong answer (no `decide:*:wrong`);
//   - DECISIONS: every decision its station declares has a right answer somewhere, and a
//     wrong one (a choice with no wrong answer isn't a decision; warning);
//   - NO SOFTLOCK: from EVERY reachable state the goal can still be reached, wrong answers
//     included (so no sequence of taps can strand a player);
// and reports the fewest moves for a perfect run: the answer key a speedrun bot can follow.
//
//   bash tools/build.sh && node tools/rulecheck.mjs [--root out] [--json rulecheck.json]
// Part of `npm run check`. Exit 1 on a failure.
import { readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const root = resolve(arg('root', 'out'));
const src = p => pathToFileURL(resolve(root, 'src', p)).href;
const { GameRulesEngine } = await import(src('kit/game-rules.js'));
import { explore, route, CAP } from './lib/solve.mjs';

const specs = [], stations = [];
for (const f of readdirSync(resolve(root, 'src/worlds')).filter(f => f.endsWith('.js'))) {
  const m = await import(src('worlds/' + f));
  for (const v of Object.values(m)) {
    if (v && typeof v === 'object' && v.schemaVersion === '1' && v.actions && !specs.includes(v)) specs.push(v);
    for (const s of (Array.isArray(v) ? v : [v])) if (s && typeof s === 'object' && s.kind === 'station' && !stations.some(x => x.id === s.id)) stations.push(s);
  }
}

let failures = 0, warnings = 0;
const say = (lvl, msg) => { if (lvl === '✗') failures++; if (lvl === '!') warnings++; console.log(`  ${lvl} ${msg}`); };
const results = {};

// self-test: a puzzle with a trap (smash breaks the lever for good) and a choice whose only
// right answer is out of reach must be caught as a softlock and as "no perfect run"
const TRAP = { schemaVersion: '1', id: 'selftest.trap', version: '1',
  state: { lever: { type: 'enum', values: ['up', 'down', 'broken'], initial: 'up' }, guessed: { type: 'boolean', initial: false } },
  actions: {
    pull: { when: { op: 'eq', left: { field: 'lever' }, right: 'up' }, effects: [{ op: 'set', field: 'lever', value: 'down' }], emits: ['decide:pick:wrong'] },
    smash: { when: { op: 'ne', left: { field: 'lever' }, right: 'broken' }, effects: [{ op: 'set', field: 'lever', value: 'broken' }] },
    open: { when: { op: 'eq', left: { field: 'lever' }, right: 'down' }, effects: [{ op: 'set', field: 'guessed', value: true }] },
  },
  objectives: { done: { when: { field: 'guessed' } } } };
const SELF = specs.length; specs.push(TRAP);
let selfFailuresFrom = 0;
for (const spec of specs) {
  if (spec === TRAP) { selfFailuresFrom = failures; console.log('\n(self-test: a trapped puzzle, which must fail)'); }
  const goal = Object.keys(spec.objectives ?? {})[0];
  const station = stations.find(s => s.rules === spec.id);
  console.log(`\n${spec.id}${station ? `  (station "${station.name}")` : ''}  goal: ${goal ?? '(no objective)'}`);
  const g = explore(GameRulesEngine, spec), { states, edges, goals: goalSet } = g;
  if (g.capped) say('!', `stopped exploring at ${CAP} states (the proof below covers those only)`);
  const any = route(g, true), perfect = route(g, false);
  if (!goal) { say('!', 'no objective: nothing to prove'); continue; }
  any ? say('✓', `solvable (${states.length} states reachable)`) : say('✗', `NOT solvable: no reachable state meets "${goal}"`);
  perfect ? say('✓', `perfect run in ${perfect.length} moves: ${perfect.join(' → ')}`) : any && say('✗', 'cannot be finished without a wrong answer');
  // no softlock: every reachable state can still reach the goal (reverse search from the goal)
  const back = states.map(() => []); edges.forEach((out, i) => out.forEach(e => back[e.to].push(i)));
  const canFinish = new Set(goalSet), q = [...goalSet];
  while (q.length) { const i = q.shift(); for (const p of back[i]) if (!canFinish.has(p)) { canFinish.add(p); q.push(p); } }
  const stuck = states.map((_, i) => i).filter(i => !canFinish.has(i));
  if (stuck.length) {
    // the shortest way into one stuck state, so a designer can see it
    const prev = new Map([[0, null]]), bq = [0]; let hit = null;
    while (bq.length && hit === null) { const i = bq.shift(); if (!canFinish.has(i)) { hit = i; break; } for (const e of edges[i]) if (!prev.has(e.to)) { prev.set(e.to, { from: i, a: e.action }); bq.push(e.to); } }
    const path = []; for (let k = hit; prev.get(k); k = prev.get(k).from) path.unshift(prev.get(k).a);
    say('✗', `SOFTLOCK: ${stuck.length} reachable state(s) can never finish; e.g. after ${path.join(' → ') || '(start)'}`);
  } else say('✓', 'no softlock: every reachable state can still finish (wrong answers included)');
  // decisions the station declares
  const emitted = new Set(edges.flat().flatMap(e => e.events));
  for (const d of station?.decisions ?? []) {
    const right = [...emitted].some(id => id.startsWith(`decide:${d.id}:right`)), wrongToo = [...emitted].some(id => id.startsWith(`decide:${d.id}:wrong`));
    if (!right) say('✗', `decision "${d.id}" has no right answer anywhere in the rules`);
    else if (!wrongToo) say('!', `decision "${d.id}" has no wrong answer (is it a choice?)`);
    else say('✓', `decision "${d.id}": right and wrong answers both reachable`);
  }
  for (const id of [...emitted].filter(id => id.startsWith('decide:'))) { const d = id.split(':')[1]; if (station && !station.decisions.some(x => x.id === d)) say('!', `rules judge a decision the station doesn't declare: "${d}"`); }
  results[spec.id] = { station: station?.id ?? null, goal, states: states.length, perfect, anyMoves: any?.length ?? null, softlocks: stuck.length };
}

// the self-test must have produced exactly its two failures (softlock + no perfect run); they don't count against the game
const caught = failures - selfFailuresFrom;
failures = selfFailuresFrom + (caught === 2 ? 0 : 1);
console.log(caught === 2 ? '\n✓ self-test: the trapped puzzle was caught (softlock, no perfect run)' : `\n✗ self-test: expected 2 failures from the trapped puzzle, got ${caught}`);
delete results[TRAP.id];
specs.splice(SELF, 1);
if (arg('json')) writeFileSync(arg('json'), JSON.stringify(results, null, 1));
console.log(`\n${specs.length} rules specs · ${failures} failures, ${warnings} warnings`);
process.exit(failures ? 1 : 0);
