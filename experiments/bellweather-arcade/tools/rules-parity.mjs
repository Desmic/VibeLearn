// Proves the browser's rules interpreter (src/kit/game-rules.ts) and the
// server's (app/game_rules.py) agree. For every rules spec in the build it runs
// the same random action walks through both (legal and illegal actions mixed)
// and compares state, events, objectives and which actions were refused. It
// also breaks specs on purpose and checks both validators refuse the same ones.
//   node tools/rules-parity.mjs [--root out] [--app ../../app] [--walks 300] [--steps 40]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(arg('root', 'out'));
const appDir = resolve(arg('app', join(here, '../../../app')));
const WALKS = +arg('walks', 300), STEPS = +arg('steps', 40);
if (!existsSync(join(appDir, 'game_rules.py'))) { console.error(`✗ no game_rules.py in ${appDir} (pass --app)`); process.exit(2); }

const { GameRulesEngine, validateGameRulesSpec } = await import(pathToFileURL(join(root, 'src/kit/game-rules.js')).href);
const specs = [];
for (const f of readdirSync(join(root, 'src/worlds')).filter(f => f.endsWith('.js'))) {
  const m = await import(pathToFileURL(join(root, 'src/worlds', f)).href);
  for (const v of Object.values(m)) if (v && typeof v === 'object' && v.schemaVersion === '1' && v.actions && !specs.some(s => s.id === v.id)) specs.push(v);
}

// deterministic random
let seed = 20261001; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

// walks: mostly legal actions (so walks go deep), some illegal ones (refusals must match)
const cases = specs.map(spec => {
  const eng = new GameRulesEngine(spec), ids = Object.keys(spec.actions), walks = [];
  for (let w = 0; w < WALKS; w++) {
    let s = eng.initialState(); const acts = [];
    for (let i = 0; i < STEPS; i++) {
      const legal = ids.filter(a => eng.allowed(s, a));
      const a = (rnd() < .85 && legal.length) ? legal[Math.floor(rnd() * legal.length)] : ids[Math.floor(rnd() * ids.length)];
      acts.push(a); try { s = eng.apply(s, a).state; } catch {}
    }
    walks.push(acts);
  }
  return { spec, walks };
});
const runTs = c => { const eng = new GameRulesEngine(c.spec); return c.walks.map(acts => { let s = eng.initialState(); return acts.map(a => { try { const t = eng.apply(s, a); s = t.state; return { ok: true, state: t.state, events: t.events, objectives: t.objectives }; } catch (e) { return { ok: false, err: e.constructor.name }; } }); }); };

// broken specs: each must be refused (or accepted) by both validators alike
const mutants = [];
for (const spec of specs) {
  const j = JSON.stringify(spec);
  const muts = [
    s => { s.schemaVersion = '2'; }, s => { s.id = 'bad id!'; }, s => { delete s.version; },
    s => { const k = Object.keys(s.state)[0]; s.state[k].type = 'float'; },
    s => { const k = Object.keys(s.state)[0]; delete s.state[k].initial; },
    s => { const a = Object.values(s.actions)[0]; a.when = { op: 'xor', left: 1, right: 2 }; },
    s => { const a = Object.values(s.actions)[0]; a.when = { field: 'nope' }; },
    s => { const a = Object.values(s.actions).find(x => x.effects); if (a) a.effects.push({ op: 'mul', field: Object.keys(s.state)[0], value: 1 }); },
    s => { const a = Object.values(s.actions).find(x => x.branches); if (a) a.effects = []; },
    s => { const a = Object.values(s.actions)[0]; a.emits = ['has space']; },
    s => { const e = Object.entries(s.state).find(([, d]) => d.type === 'enum'); if (e) e[1].initial = 'not-a-value'; },
    s => { const e = Object.entries(s.state).find(([, d]) => d.type === 'enum'); if (e) e[1].values.push(e[1].values[0]); },
    s => { const a = Object.values(s.actions).find(x => x.effects?.length); const b = Object.entries(s.state).find(([, d]) => d.type === 'boolean'); if (a && b) a.effects.push({ op: 'add', field: b[0], value: 1 }); },
  ];
  muts.forEach((m, i) => { const s = JSON.parse(j); m(s); let ok = true; try { validateGameRulesSpec(s); } catch { ok = false; } mutants.push({ name: `${spec.id}#${i}`, spec: s, ts: ok }); });
}

const dir = mkdtempSync(join(tmpdir(), 'rules-parity-'));
writeFileSync(join(dir, 'cases.json'), JSON.stringify({ cases: cases.map(c => ({ spec: c.spec, walks: c.walks })), mutants: mutants.map(m => m.spec) }));
const py = `
import json, sys
sys.path.insert(0, ${JSON.stringify(appDir)})
from game_rules import GameRulesEngine, validate_game_rules_spec
d = json.load(open(${JSON.stringify(join(dir, 'cases.json'))}))
out = {"cases": [], "mutants": []}
for c in d["cases"]:
    eng = GameRulesEngine(c["spec"]); res = []
    for acts in c["walks"]:
        s = eng.initial_state(); steps = []
        for a in acts:
            try:
                t = eng.apply(s, a); s = t.state
                steps.append({"ok": True, "state": t.state, "events": list(t.events), "objectives": t.objectives})
            except Exception as e:
                steps.append({"ok": False, "err": type(e).__name__})
        res.append(steps)
    out["cases"].append(res)
for m in d["mutants"]:
    try:
        validate_game_rules_spec(m); out["mutants"].append(True)
    except Exception:
        out["mutants"].append(False)
json.dump(out, open(${JSON.stringify(join(dir, 'py.json'))}, "w"))
`;
execFileSync(process.env.PYTHON ?? 'python3', ['-c', py], { stdio: 'inherit' });
const pyOut = JSON.parse(readFileSync(join(dir, 'py.json'), 'utf8'));

let bad = 0, steps = 0, refusals = 0;
const same = (a, b) => JSON.stringify(sortDeep(a)) === JSON.stringify(sortDeep(b));
function sortDeep(v) { if (Array.isArray(v)) return v.map(sortDeep); if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, sortDeep(v[k])])); return v; }
cases.forEach((c, ci) => {
  const ts = runTs(c), pyc = pyOut.cases[ci]; let first = null;
  ts.forEach((walk, wi) => walk.forEach((st, si) => {
    steps++; if (!st.ok) refusals++;
    if (!same(st, pyc[wi][si]) && !first) first = { wi, si, action: c.walks[wi][si], ts: st, py: pyc[wi][si] };
  }));
  if (first) { bad++; console.log(`✗ ${c.spec.id}: walk ${first.wi} step ${first.si} (${first.action})\n  ts ${JSON.stringify(first.ts)}\n  py ${JSON.stringify(first.py)}`); }
  else console.log(`✓ ${c.spec.id}: ${c.walks.length} walks agree`);
});
mutants.forEach((m, i) => { if (m.ts !== pyOut.mutants[i]) { bad++; console.log(`✗ validator disagrees on ${m.name}: ts ${m.ts ? 'accepts' : 'refuses'}, py ${pyOut.mutants[i] ? 'accepts' : 'refuses'}`); } });
const refused = mutants.filter(m => !m.ts).length;
console.log(`\n${specs.length} specs, ${steps} steps (${refusals} refused alike), ${mutants.length} broken specs (${refused} refused by both). ${bad ? bad + ' disagreements' : 'Both engines agree.'}`);
process.exit(bad ? 1 : 0);
