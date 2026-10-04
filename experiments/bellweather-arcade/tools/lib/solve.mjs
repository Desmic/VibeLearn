// Solve a GameRulesSpec (kit/game-rules.ts) by exploring every reachable state with the game's
// own rules engine. Shared by tools/rulecheck.mjs (proofs) and tools/speedrun.mjs (the answer
// key it plays). Game-agnostic.
export const CAP = 200000;
const key = s => JSON.stringify(s);
const isWrong = e => e.events.some(id => /^decide:[^:]+:wrong/.test(id));

/** every reachable state and the allowed actions between them */
export function explore(Engine, spec) {
  const eng = new Engine(spec), actions = Object.keys(spec.actions);
  const start = eng.initialState(), ids = new Map([[key(start), 0]]), states = [start], edges = [];
  for (let i = 0; i < states.length && states.length < CAP; i++) {
    const out = [];
    for (const a of actions) {
      if (!eng.allowed(states[i], a)) continue;
      let t; try { t = eng.apply(states[i], a); } catch { continue; }   // an invariant would break: the game refuses it
      const k = key(t.state); let j = ids.get(k);
      if (j === undefined) { j = states.length; ids.set(k, j); states.push(t.state); }
      out.push({ to: j, action: a, events: t.events.map(e => e.id) });
    }
    edges.push(out);
  }
  while (edges.length < states.length) edges.push([]);
  const goal = Object.keys(spec.objectives ?? {})[0];
  const goals = new Set(goal ? states.map((s, i) => (eng.objectives(s)[goal] ? i : -1)).filter(i => i >= 0) : []);
  return { eng, states, edges, goal, goals, capped: states.length >= CAP };
}

/** the fewest actions from the start to the goal (allowWrong: may include wrong answers) */
export function route(g, allowWrong) {
  const prev = new Map([[0, null]]), q = [0];
  while (q.length) {
    const i = q.shift();
    if (g.goals.has(i)) { const path = []; for (let k = i; prev.get(k); k = prev.get(k).from) path.unshift(prev.get(k).e.action); return path; }
    for (const e of g.edges[i]) if (!prev.has(e.to) && (allowWrong || !isWrong(e))) { prev.set(e.to, { from: i, e }); q.push(e.to); }
  }
  return null;
}

/** the answer key: the fewest-moves run with no wrong answer (null if there is none) */
export const perfectRun = (Engine, spec) => route(explore(Engine, spec), false);

/** for every reachable state, the fewest no-mistake moves left to the goal (Infinity: none) */
export function distances(g) {
  const back = g.states.map(() => []);
  g.edges.forEach((out, i) => out.forEach(e => { if (!isWrong(e)) back[e.to].push(i); }));
  const dist = g.states.map(() => Infinity), q = [...g.goals];
  for (const i of q) dist[i] = 0;
  while (q.length) { const i = q.shift(); for (const p of back[i]) if (dist[p] === Infinity) { dist[p] = dist[i] + 1; q.push(p); } }
  return dist;
}
/** the moves from a live state that keep a shortest no-mistake path (moves that commute all count) */
export function goodMoves(g, dist, state) {
  const i = g.index ??= new Map(g.states.map((s, k) => [key(s), k]));
  const at = i.get(key(state)); if (at === undefined) return { at: -1, moves: [] };
  return { at, left: dist[at], moves: g.edges[at].filter(e => !isWrong(e) && dist[e.to] === dist[at] - 1).map(e => e.action) };
}
