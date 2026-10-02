import type * as T from 'three';
import { GameRulesEngine, GameRulesError, type GameRulesSpec, type State } from './game-rules';

// A station is the shape every learning moment in a level shares:
//   a place in the world + one action that starts it + a puzzle (game code)
//   + the decisions it logs as learning evidence + stars at the end.
// The spec is data (a generator fills it in). The puzzle's rules are data too
// (GameRulesSpec): the puzzle code only renders and sends semantic actions with
// `act()`, and whether a choice was right comes from the rules' events
// `decide:<decision>:<right|wrong>[:<choice>]`. Same evidence rules for every
// station: the first answer to each decision is what counts.

export interface LearningEvent { activity: string; decision: string; choice: string; correct: boolean; first: boolean; assisted: boolean; t: number;
  /** the rules that judged it (id@version), so old evidence stays readable after rules change */
  rules: string }

export type StarRow =
  | { done: string }                                  // always earned: the station was finished
  | { firstTry: string; text: string }                // the first answer to this decision was right
  | { objective: string; text: string }              // an objective of the station's rules holds at the end
  | { flag: string; text: string };                   // a condition the puzzle reports

export interface StationSpec {
  kind: 'station';
  id: string;                     // also the activity id in learning events
  name: string;                   // for people reading the data
  teaches: string[];              // outcome ids in the learning design
  place: { anchor: string; r: number };   // where the action is offered (anchor named by the game)
  rules: string;                  // id of the GameRulesSpec that judges it
  action: string;                 // the one context button that starts it
  /** what the player decides; each logs evidence. `choice.fields`: when a decide event names no
   *  choice, it is read from these state fields just before the action (sorted, joined by '+') */
  decisions: { id: string; asks: string; choice?: { fields: string[] } }[];
  stars: { title: string; rows: StarRow[] };
  /** what the station's things say (notes, signs, pinned cards); the puzzle code shows it */
  content?: Record<string, unknown>;
}

export interface StationHost {
  onEvent?: (e: LearningEvent) => void;           // the game marks repeats across reloads as not first
  stars: (title: string, rows: [boolean, string][], then: () => void) => void;
}

export interface ActResult { ok: boolean; events: string[]; judged: LearningEvent[]; state: State; error?: string }

const DECIDE = /^decide:([A-Za-z0-9._-]+):(right|wrong)(?::(.+))?$/;
const choiceOf = (fields: string[], s: State) => fields.map(f => s[f]).filter(v => v !== 'none' && v !== null && v !== undefined).map(String).sort().join('+');

export function createStation(spec: StationSpec, host: StationHost, rules: GameRulesSpec) {
  if (rules.id !== spec.rules) throw Error(`[station ${spec.id}] expects rules ${spec.rules}, got ${rules.id}`);
  const engine = new GameRulesEngine(rules);
  const firstResult = new Map<string, boolean>(), flags = new Map<string, boolean>(), helped = new Set<string>();
  const decisions = new Map(spec.decisions.map(d => [d.id, d]));
  let state = engine.initialState(), objectives: Record<string, boolean> = {};
  const history: string[] = [];
  const log = (decision: string, choice: string, correct: boolean, assisted = false): LearningEvent => {
    const e: LearningEvent = { activity: spec.id, decision, choice, correct, first: !firstResult.has(decision), assisted: assisted || helped.has(decision), t: Date.now(), rules: `${rules.id}@${rules.version}` };
    ((window as any).__vlLearning ??= []).push(e); host.onEvent?.(e);
    // a first-try star needs a real first try: not one made after a reload that undid a wrong answer
    if (!firstResult.has(decision)) firstResult.set(decision, correct && e.first);
    return e;
  };
  const st = {
    spec, engine,
    get state() { return state; },
    get history() { return history.slice(); },
    allowed(action: string) { return engine.allowed(state, action); },
    /** the game gave help toward this decision (a hint, a shown answer): its next judgement counts as assisted */
    helpedWith(decision: string) { helped.add(decision); },
    /** send one semantic action. Refused actions change nothing (ok: false). */
    act(action: string, opts: { assisted?: boolean } = {}): ActResult {
      const before = state;
      try {
        const t = engine.apply(state, action);
        state = t.state; objectives = t.objectives; history.push(action);
        const events = t.events.map(e => e.id), judged: LearningEvent[] = [];
        for (const id of events) {
          const m = DECIDE.exec(id); if (!m) continue;
          const d = decisions.get(m[1]);
          if (!d) { console.error(`[station ${spec.id}] rules judge undeclared decision "${m[1]}"`); continue; }
          judged.push(log(m[1], m[3] ?? choiceOf(d.choice?.fields ?? [], before), m[2] === 'right', opts.assisted));
        }
        return { ok: true, events, judged, state };
      } catch (e) {
        if (!(e instanceof GameRulesError)) throw e;
        return { ok: false, events: [], judged: [], state, error: e.message };
      }
    },
    /** rebuild state from an action log (resuming a save) without logging decisions again */
    restore(actions: string[]) { const t = engine.replay(actions); state = t.state; objectives = t.objectives; history.length = 0; history.push(...actions); },
    /** the first answer to a decision: true, false, or null if not answered yet */
    firstTry(decision: string): boolean | null { return firstResult.has(decision) ? firstResult.get(decision)! : null; },
    flag(name: string, value: boolean) { flags.set(name, value); },
    /** the star rows as earned right now */
    earned(): [boolean, string][] {
      return spec.stars.rows.map(r => 'done' in r ? [true, r.done]
        : 'firstTry' in r ? [firstResult.get(r.firstTry) === true, r.text]
          : 'objective' in r ? [objectives[r.objective] === true, r.text]
            : [flags.get(r.flag) === true, r.text]);
    },
    finish(then: () => void) { host.stars(spec.stars.title, st.earned(), then); },
    /** an action zone for this station, for the game's one context button */
    zone(at: T.Vector3, when: () => boolean, use: () => void) { return { at, r: spec.place.r, label: spec.action, when, use }; },
  };
  return st;
}
export type Station = ReturnType<typeof createStation>;

/** Checks a level's stations: unique ids, decisions used by star rows, outcomes named. */
export function validateStations(list: StationSpec[], known?: { anchors?: string[]; outcomes?: string[]; rules?: GameRulesSpec[] }) {
  const issues: { level: 'error' | 'warn'; where: string; msg: string }[] = [];
  const ids = new Set<string>();
  for (const s of list) {
    const w = 'station ' + s.id;
    if (ids.has(s.id)) issues.push({ level: 'error', where: w, msg: 'duplicate id' }); ids.add(s.id);
    if (!s.decisions.length) issues.push({ level: 'error', where: w, msg: 'logs no decisions, so it gives no learning evidence' });
    if (!s.teaches.length) issues.push({ level: 'warn', where: w, msg: 'teaches no outcome' });
    if (known?.outcomes) for (const o of s.teaches) if (!known.outcomes.includes(o)) issues.push({ level: 'error', where: w, msg: `unknown outcome "${o}"` });
    if (known?.anchors && !known.anchors.includes(s.place.anchor)) issues.push({ level: 'error', where: w, msg: `unknown anchor "${s.place.anchor}"` });
    const dec = new Set(s.decisions.map(d => d.id));
    for (const r of s.stars.rows) if ('firstTry' in r && !dec.has(r.firstTry)) issues.push({ level: 'error', where: w, msg: `star row uses unknown decision "${r.firstTry}"` });
    if (!s.stars.rows.some(r => 'done' in r)) issues.push({ level: 'warn', where: w, msg: 'no star for finishing (players should always earn one)' });
    const rules = known?.rules?.find(r => r.id === s.rules);
    if (known?.rules && !rules) issues.push({ level: 'error', where: w, msg: `no rules "${s.rules}"` });
    if (rules) {
      const emitted = Object.values(rules.actions).flatMap(a => [...(a.emits ?? []), ...(a.branches ?? []).flatMap(b => b.emits ?? [])]);
      const judged = emitted.map(e => DECIDE.exec(e)).filter(Boolean) as RegExpExecArray[];
      for (const d of s.decisions) {
        const mine = judged.filter(m => m[1] === d.id);
        if (!mine.length) issues.push({ level: 'error', where: w, msg: `decision "${d.id}" is never judged by its rules` });
        if (mine.some(m => !m[3]) && !d.choice) issues.push({ level: 'error', where: w, msg: `decision "${d.id}" has judgements without a choice and no choice.fields` });
        for (const fld of d.choice?.fields ?? []) if (!(fld in rules.state)) issues.push({ level: 'error', where: w, msg: `choice field "${fld}" is not in the rules' state` });
      }
      for (const m of judged) if (!dec.has(m[1])) issues.push({ level: 'error', where: w, msg: `rules judge undeclared decision "${m[1]}"` });
      if (!judged.some(m => m[2] === 'right')) issues.push({ level: 'error', where: w, msg: 'no right answer exists in its rules' });
      for (const r of s.stars.rows) if ('objective' in r && !(r.objective in (rules.objectives ?? {}))) issues.push({ level: 'error', where: w, msg: `star row uses unknown objective "${r.objective}"` });
    }
    if (s.stars.rows.length !== 3) issues.push({ level: 'warn', where: w, msg: `has ${s.stars.rows.length} star rows (house style: 3)` });
  }
  return issues;
}
