import type { Action, Expr, FieldDef } from './game-rules';

// Rules for "build it yourself" steps, as GameRulesSpec data: the player assembles something from
// parts (one choice per slot: a verb, a name, a place…), each choice with a cost, against a limit.
// Each slot is an enum field ('none' until filled); `cost` keeps the running total. Putting a choice
// in adds its cost; taking it out subtracts whatever is there; `check` judges the whole build:
// within the limit is right, over it is wrong (with the first matching reason, so the evidence says
// why). Game-agnostic: the game names the slots, the choices, their costs and the limit.
// First used by the Word Loom (a call that must fit six slots, counted in pieces).

export interface AssemblyChoice { id: string; cost: number }
export interface AssemblySpec {
  /** slot name → its choices, in no particular order */
  slots: Record<string, AssemblyChoice[]>;
  /** the most the build may cost */
  limit: number;
  /** the field holding the running total (default 'cost') */
  costField?: string;
  /** only while this holds may parts go in or out, or the build be checked (e.g. a phase) */
  when?: Expr;
  /** the action that judges the build, and the decision id it logs */
  check: { action: string; decision: string; right: { choice: string; effects?: Action['effects']; emits?: string[] }; wrong: { when?: Expr; choice: string; emits?: string[] }[] };
}

const f = (field: string): Expr => ({ field });
const eq = (a: Expr, b: Expr): Expr => ({ op: 'eq', left: a, right: b });
const ne = (a: Expr, b: Expr): Expr => ({ op: 'ne', left: a, right: b });
const and = (...args: (Expr | undefined)[]): Expr => { const a = args.filter((x): x is Expr => x !== undefined); return a.length === 1 ? a[0] : { op: 'and', args: a }; };

/** the state fields and actions an assembly step adds to a rules spec */
export function assemblyRules(s: AssemblySpec): { state: Record<string, FieldDef>; actions: Record<string, Action> } {
  const costField = s.costField ?? 'cost', names = Object.keys(s.slots);
  const max = names.reduce((t, n) => t + Math.max(...s.slots[n].map(c => c.cost)), 0);
  const state: Record<string, FieldDef> = { [costField]: { type: 'integer', initial: 0, min: 0, max } };
  const actions: Record<string, Action> = {};
  for (const n of names) {
    state[n] = { type: 'enum', values: ['none', ...s.slots[n].map(c => c.id)], initial: 'none' };
    for (const c of s.slots[n]) actions[`${n}.${c.id}`] = { when: and(s.when, eq(f(n), 'none')), effects: [{ op: 'set', field: n, value: c.id }, { op: 'add', field: costField, value: c.cost }], emits: ['part-placed'] };
    actions[`${n}.clear`] = { when: and(s.when, ne(f(n), 'none')), branches: s.slots[n].map(c => ({ when: eq(f(n), c.id), effects: [{ op: 'set', field: n, value: 'none' }, { op: 'add', field: costField, value: -c.cost }], emits: ['part-cleared'] })) };
  }
  const k = s.check;
  actions[k.action] = {
    when: and(s.when, ...names.map(n => ne(f(n), 'none'))),
    branches: [
      { when: { op: 'lte', left: f(costField), right: s.limit }, effects: k.right.effects ?? [], emits: [`decide:${k.decision}:right:${k.right.choice}`, ...(k.right.emits ?? [])] },
      ...k.wrong.map(w => ({ when: w.when, effects: [], emits: [`decide:${k.decision}:wrong:${w.choice}`, ...(w.emits ?? [])] })),
    ],
  };
  return { state, actions };
}

/** every build that stays within the limit (for content checks: is there an answer, and how many) */
export function assemblyAnswers(s: Pick<AssemblySpec, 'slots' | 'limit'>) {
  const names = Object.keys(s.slots); let out: { picks: Record<string, string>; cost: number }[] = [{ picks: {}, cost: 0 }];
  for (const n of names) out = out.flatMap(b => s.slots[n].map(c => ({ picks: { ...b.picks, [n]: c.id }, cost: b.cost + c.cost })));
  return out.filter(b => b.cost <= s.limit);
}
