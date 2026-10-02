// GameRulesSpec v1 interpreter for the browser. A line-for-line port of the
// server's `app/game_rules.py`: same validation, same expression semantics, same
// transitions. Puzzles act through it, so the renderer never decides what is
// right; the server can replay the same action log and reach the same state.
// Parity is checked by `tools/rules-parity.mjs` (fuzzed replays, both engines).

export const GAME_RULES_SPEC_VERSION = '1';
const MAX_FIELDS = 64, MAX_ACTIONS = 64, MAX_EFFECTS = 32, MAX_BRANCHES = 16, MAX_EVENTS = 16;
const ID = /^[A-Za-z0-9._:-]+$/;
const BINARY = new Set(['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'in']), NARY = new Set(['and', 'or']), EFFECTS = new Set(['set', 'add']);

export type Literal = null | boolean | number | string;
export type Expr = Literal | { field: string } | { op: string; left?: Expr; right?: Expr | Literal[]; args?: Expr[]; arg?: Expr };
export interface FieldDef { type: 'boolean' | 'integer' | 'enum'; initial: Literal; min?: number; max?: number; values?: (string | number)[] }
export interface Effect { op: 'set' | 'add'; field: string; value: Expr }
export interface Branch { when?: Expr; effects: Effect[]; emits?: string[] }
export interface Action { when?: Expr; effects?: Effect[]; branches?: Branch[]; emits?: string[] }
export interface GameRulesSpec {
  schemaVersion: string; id: string; version: string;
  state: Record<string, FieldDef>;
  invariants?: { id: string; expression: Expr }[];
  actions: Record<string, Action>;
  objectives?: Record<string, { when: Expr }>;
}
export type State = Record<string, Literal>;
export interface Transition { state: State; events: { id: string; action: string }[]; objectives: Record<string, boolean> }

export class GameRulesError extends Error {}
export class InvalidAction extends GameRulesError {}
export class InvariantViolation extends GameRulesError {}

const fail = (msg: string): never => { throw new GameRulesError(`GameRulesSpec invalid: ${msg}`); };
const check = (ok: unknown, msg: string) => { if (!ok) fail(msg); };
const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);
const keysEq = (o: object, ks: string[]) => { const k = Object.keys(o); return k.length === ks.length && ks.every(x => k.includes(x)); };
const keysIn = (o: object, ks: string[]) => Object.keys(o).every(x => ks.includes(x));
const id = (v: unknown, label: string) => { check(typeof v === 'string' && ID.test(v), `${label} has invalid id`); return v as string; };
const isLiteral = (v: unknown): v is Literal => v === null || ['boolean', 'number', 'string'].includes(typeof v);
const isInt = (v: unknown) => typeof v === 'number' && Number.isInteger(v);
// Python semantics: True == 1, False == 0 in comparisons
const py = (v: Literal) => typeof v === 'boolean' ? Number(v) : v;
const truthy = (v: unknown) => !(v === null || v === false || v === 0 || v === '' || (typeof v === 'number' && Number.isNaN(v)));
const deep = <V>(v: V): V => JSON.parse(JSON.stringify(v));

function validateExpr(expr: any, fields: Set<string>, label: string): void {
  if (isLiteral(expr)) return;
  check(isObj(expr), `${label} must be a literal or expression object`);
  if (keysEq(expr, ['field'])) { const f = id(expr.field, `${label}.field`); check(fields.has(f), `${label} references unknown field ${f}`); return; }
  const op = expr.op; check(typeof op === 'string', `${label}.op is required`);
  if (BINARY.has(op)) {
    check(keysEq(expr, ['op', 'left', 'right']), `${label} ${op} has invalid shape`);
    validateExpr(expr.left, fields, `${label}.left`);
    if (op === 'in' && Array.isArray(expr.right)) check(expr.right.every(isLiteral), `${label}.right list must contain literals`);
    else validateExpr(expr.right, fields, `${label}.right`);
    return;
  }
  if (NARY.has(op)) {
    check(keysEq(expr, ['op', 'args']), `${label} ${op} has invalid shape`);
    check(Array.isArray(expr.args) && expr.args.length >= 1 && expr.args.length <= 16, `${label}.args must contain 1-16 expressions`);
    expr.args.forEach((a: any, i: number) => validateExpr(a, fields, `${label}.args[${i}]`));
    return;
  }
  if (op === 'not') { check(keysEq(expr, ['op', 'arg']), `${label} not has invalid shape`); validateExpr(expr.arg, fields, `${label}.arg`); return; }
  throw new GameRulesError(`GameRulesSpec invalid: ${label} uses unsupported expression op '${op}'`);
}
function validateEffects(effects: any, fields: Record<string, FieldDef>, label: string) {
  check(Array.isArray(effects) && effects.length <= MAX_EFFECTS, `${label} must contain at most ${MAX_EFFECTS} effects`);
  effects.forEach((e: any, i: number) => {
    const item = `${label}[${i}]`;
    check(isObj(e), `${item} must be an object`);
    check(EFFECTS.has(e.op), `${item} uses unsupported effect op '${e.op}'`);
    check(keysEq(e, ['op', 'field', 'value']), `${item} has invalid shape`);
    const f = id(e.field, `${item}.field`); check(f in fields, `${item} references unknown field ${f}`);
    validateExpr(e.value, new Set(Object.keys(fields)), `${item}.value`);
    if (e.op === 'add') check(fields[f].type === 'integer', `${item} add requires integer field ${f}`);
  });
}
function validateEvents(events: any, label: string) {
  check(Array.isArray(events) && events.length <= MAX_EVENTS, `${label} must contain at most ${MAX_EVENTS} events`);
  events.forEach((e: any, i: number) => id(e, `${label}[${i}]`));
}
function validateValue(def: FieldDef, v: unknown, label: string) {
  if (def.type === 'boolean') check(typeof v === 'boolean', `${label} must be boolean`);
  else if (def.type === 'integer') {
    check(isInt(v), `${label} must be integer`);
    if (def.min !== undefined) check((v as number) >= def.min, `${label} is below min`);
    if (def.max !== undefined) check((v as number) <= def.max, `${label} is above max`);
  } else check(def.values!.some(x => x === v), `${label} must be one of declared enum values`);
}

export function validateGameRulesSpec(spec: any): GameRulesSpec {
  check(isObj(spec), 'spec must be an object');
  check(String(spec.schemaVersion) === GAME_RULES_SPEC_VERSION, `schemaVersion must be ${GAME_RULES_SPEC_VERSION}`);
  id(spec.id, 'rules');
  check(typeof spec.version === 'string' && spec.version, 'version is required');
  const state = spec.state;
  check(isObj(state) && Object.keys(state).length >= 1 && Object.keys(state).length <= MAX_FIELDS, `state must declare 1-${MAX_FIELDS} fields`);
  for (const [f, def] of Object.entries<any>(state)) {
    id(f, 'state field'); check(isObj(def), `state.${f} must be an object`);
    const kind = def.type; check(['boolean', 'integer', 'enum'].includes(kind), `state.${f} has unsupported type '${kind}'`);
    check('initial' in def, `state.${f}.initial is required`);
    check(keysIn(def, kind === 'integer' ? ['type', 'initial', 'min', 'max'] : kind === 'enum' ? ['type', 'initial', 'values'] : ['type', 'initial']), `state.${f} has unsupported keys`);
    if (kind === 'integer') {
      if ('min' in def) check(isInt(def.min), `state.${f}.min must be integer`);
      if ('max' in def) check(isInt(def.max), `state.${f}.max must be integer`);
      if ('min' in def && 'max' in def) check(def.min <= def.max, `state.${f} min exceeds max`);
    }
    if (kind === 'enum') {
      const vs = def.values;
      check(Array.isArray(vs) && vs.length >= 1 && vs.length <= 32 && new Set(vs).size === vs.length, `state.${f}.values must be 1-32 unique literals`);
      check(vs.every((v: unknown) => typeof v === 'string' || isInt(v)), `state.${f}.values must contain string/integer literals`);
    }
    validateValue(def, def.initial, `state.${f}.initial`);
  }
  const fields = new Set(Object.keys(state));
  const inv = spec.invariants ?? [];
  check(Array.isArray(inv) && inv.length <= 32, 'invariants must contain at most 32 rules');
  const seen = new Set<string>();
  inv.forEach((v: any, i: number) => {
    check(isObj(v) && keysEq(v, ['id', 'expression']), `invariants[${i}] has invalid shape`);
    const iid = id(v.id, `invariants[${i}].id`); check(!seen.has(iid), `duplicate invariant ${iid}`); seen.add(iid);
    validateExpr(v.expression, fields, `invariants[${i}].expression`);
  });
  const actions = spec.actions;
  check(isObj(actions) && Object.keys(actions).length >= 1 && Object.keys(actions).length <= MAX_ACTIONS, `actions must declare 1-${MAX_ACTIONS} actions`);
  for (const [aid, a] of Object.entries<any>(actions)) {
    id(aid, 'action'); check(isObj(a), `actions.${aid} must be an object`);
    check(keysIn(a, ['when', 'effects', 'branches', 'emits']), `actions.${aid} has unsupported keys`);
    validateExpr(a.when ?? true, fields, `actions.${aid}.when`);
    const hasE = 'effects' in a, hasB = 'branches' in a;
    check(hasE !== hasB, `actions.${aid} must declare exactly one of effects or branches`);
    validateEvents(a.emits ?? [], `actions.${aid}.emits`);
    if (hasE) validateEffects(a.effects, state, `actions.${aid}.effects`);
    else {
      check(Array.isArray(a.branches) && a.branches.length >= 1 && a.branches.length <= MAX_BRANCHES, `actions.${aid}.branches must contain 1-${MAX_BRANCHES} branches`);
      a.branches.forEach((b: any, i: number) => {
        const label = `actions.${aid}.branches[${i}]`;
        check(isObj(b) && keysIn(b, ['when', 'effects', 'emits']) && 'effects' in b, `${label} has invalid shape`);
        validateExpr(b.when ?? true, fields, `${label}.when`); validateEffects(b.effects, state, `${label}.effects`); validateEvents(b.emits ?? [], `${label}.emits`);
      });
    }
  }
  const obj = spec.objectives ?? {};
  check(isObj(obj) && Object.keys(obj).length <= 32, 'objectives must be an object with at most 32 entries');
  for (const [oid, o] of Object.entries<any>(obj)) {
    id(oid, 'objective'); check(isObj(o) && keysEq(o, ['when']), `objectives.${oid} has invalid shape`);
    validateExpr(o.when, fields, `objectives.${oid}.when`);
  }
  return spec as GameRulesSpec;
}

function evaluate(expr: Expr, s: State): Literal {
  if (isLiteral(expr)) return expr;
  const e = expr as any;
  if ('field' in e && Object.keys(e).length === 1) return s[e.field];
  const op = e.op;
  if (op === 'not') return !truthy(evaluate(e.arg, s));
  if (op === 'and') return e.args.every((a: Expr) => truthy(evaluate(a, s)));
  if (op === 'or') return e.args.some((a: Expr) => truthy(evaluate(a, s)));
  const l = evaluate(e.left, s);
  const r: any = op === 'in' && Array.isArray(e.right) ? e.right : evaluate(e.right, s);
  switch (op) {
    case 'eq': return py(l) === py(r);
    case 'ne': return py(l) !== py(r);
    case 'lt': return (py(l) as any) < (py(r) as any);
    case 'lte': return (py(l) as any) <= (py(r) as any);
    case 'gt': return (py(l) as any) > (py(r) as any);
    case 'gte': return (py(l) as any) >= (py(r) as any);
    case 'in': return Array.isArray(r) ? r.some((x: Literal) => py(x) === py(l)) : typeof r === 'string' && typeof l === 'string' ? r.includes(l) : false;
  }
  throw new GameRulesError(`Unsupported expression op '${op}'`);
}

export class GameRulesEngine {
  readonly spec: GameRulesSpec;
  private initial: State;
  constructor(spec: GameRulesSpec) {
    this.spec = deep(validateGameRulesSpec(spec));
    this.initial = Object.fromEntries(Object.entries(this.spec.state).map(([k, d]) => [k, deep(d.initial)]));
    this.validateState(this.initial); this.checkInvariants(this.initial);
  }
  initialState(): State { return deep(this.initial); }
  private validateState(s: unknown) {
    const defs = this.spec.state;
    if (!isObj(s) || !keysEq(s, Object.keys(defs))) throw new GameRulesError('Gameplay state does not match declared fields');
    for (const [f, d] of Object.entries(defs)) validateValue(d, (s as State)[f], `state.${f}`);
  }
  private checkInvariants(s: State) {
    for (const inv of this.spec.invariants ?? []) if (!truthy(evaluate(inv.expression, s))) throw new InvariantViolation(`Invariant ${inv.id} would be violated`);
  }
  private objectives(s: State) { return Object.fromEntries(Object.entries(this.spec.objectives ?? {}).map(([k, o]) => [k, truthy(evaluate(o.when, s))])); }
  /** is this action allowed right now (without applying it)? */
  allowed(s: State, actionId: string) { const a = this.spec.actions[actionId]; return !!a && truthy(evaluate(a.when ?? true, s)); }
  apply(s: State, actionId: string): Transition {
    this.validateState(s);
    const a = this.spec.actions[actionId];
    if (!a) throw new InvalidAction(`Unknown action ${actionId}`);
    if (!truthy(evaluate(a.when ?? true, s))) throw new InvalidAction(`Action ${actionId} is not currently allowed`);
    const events = [...(a.emits ?? [])]; let effects: Effect[];
    if (a.effects) effects = a.effects;
    else {
      const b = a.branches!.find(c => truthy(evaluate(c.when ?? true, s)));
      if (!b) throw new InvalidAction(`Action ${actionId} has no valid deterministic branch`);
      effects = b.effects; events.push(...(b.emits ?? []));
    }
    const next = deep(s);
    for (const e of effects) {
      const v = evaluate(e.value, next);
      if (e.op === 'set') next[e.field] = deep(v); else (next[e.field] as number) += v as number;
    }
    this.validateState(next); this.checkInvariants(next);
    return { state: next, events: events.map(id => ({ id, action: actionId })), objectives: this.objectives(next) };
  }
  replay(actions: string[]): Transition {
    check(Array.isArray(actions) && actions.length <= 512, 'replay actions must be a list of at most 512 ids');
    let state = this.initialState(); const events: Transition['events'] = []; let objectives = this.objectives(state);
    for (const a of actions) { id(a, 'replay action'); const t = this.apply(state, a); state = t.state; events.push(...t.events); objectives = t.objectives; }
    return { state, events, objectives };
  }
}
