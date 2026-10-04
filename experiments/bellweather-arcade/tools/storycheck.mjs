// Checks every story script, station list and rules spec in a build before it ships:
// missing handlers, anchors and ids, broken dialogue jumps, and the house
// style (twelve words or fewer per sentence). Fast: no browser.
//   node tools/storycheck.mjs [--root out]
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(process.argv.includes('--root') ? process.argv[process.argv.indexOf('--root') + 1] : 'out');
const src = (p) => pathToFileURL(resolve(root, 'src', p)).href;
const { validateScript } = await import(src('kit/story-script.js'));
const stationKit = await import(src('kit/station.js')).catch(() => null);

import { createReport } from './lib/report.mjs';
import { loadGame, gameArg } from './lib/game.mjs';
const FIXTURE = !!gameArg();
const R = createReport({ tool: FIXTURE ? 'storycheck-fixture' : 'storycheck', lane: FIXTURE ? 'system' : 'content', root });
let errors = 0, warns = 0;
const report = (name, issues, lane) => {
  for (const i of issues) { i.level === 'error' ? errors++ : warns++; console.log(`${i.level === 'error' ? '✗' : '!'} ${name} · ${i.where}: ${i.msg}`); R.add(i.level === 'error' ? 'fail' : 'warn', `${name} · ${i.where}: ${i.msg}`, { lane }); }
  if (!issues.length) { console.log(`✓ ${name}`); R.add('pass', `${name} is valid`, { lane }); }
};
// the game manifest (kit/manifest.ts): parts that refer to each other agree
let G = null;
try { G = (await loadGame(root)).GAME; report(`manifest ${G.id}`, [], 'system'); } catch (e) { report('manifest', [{ level: 'error', where: gameArg() ?? 'src/game.ts', msg: e.message }], 'system'); }
// another game's manifest (fixtures/*): check its own stories, stations and progress with the kit's validators, then stop
if (FIXTURE) {
  const { validateProgress } = await import(src('kit/progress.js'));
  if (G) {
    for (const st of G.stories) report(`${G.id} story ${st.id}`, validateScript(st));
    const anchors = G.stories.flatMap(st => st.needs?.anchors ?? []);
    report(`${G.id} stations`, stationKit.validateStations(G.stations, { rules: G.rules, anchors }));
    report(`${G.id} progress`, validateProgress(G.progress, G.stations.map(x => x.id)).map(msg => ({ level: 'error', where: 'progress', msg })));
  }
  R.write(null); console.log(`\n${errors} errors, ${warns} warnings`); process.exit(errors ? 1 : 0);
}

const mods = [];
for (const f of readdirSync(resolve(root, 'src/worlds')).filter(f => f.endsWith('.js'))) mods.push([f, await import(src('worlds/' + f))]);
// every rules spec in the build (GameRulesSpec v1), validated by the browser interpreter
const { validateGameRulesSpec } = await import(src('kit/game-rules.js'));
const rules = [];
for (const [f, m] of mods) for (const [k, v] of Object.entries(m)) if (v && typeof v === 'object' && v.schemaVersion === '1' && v.actions && !rules.includes(v)) {
  rules.push(v); let issues = []; try { validateGameRulesSpec(v); } catch (e) { issues = [{ level: 'error', where: 'rules ' + v.id, msg: e.message }]; } report(`${f} ${k}`, issues);
}
// places a station can be at: island entities and the anchors story scripts ask the game for
const anchors = [];
for (const [, m] of mods) for (const v of Object.values(m)) if (v && typeof v === 'object') {
  for (const e of v.entities ?? []) anchors.push(e.id);
  for (const a of v.needs?.anchors ?? []) anchors.push(a);
}
// entity checks: unique ids per island, stations named by entities exist
for (const [f, m] of mods) for (const [k, v] of Object.entries(m)) if (v && typeof v === 'object' && Array.isArray(v.entities)) {
  const issues = [], ids = new Set();
  for (const e of v.entities) { if (ids.has(e.id)) issues.push({ level: 'error', where: 'entity ' + e.id, msg: 'duplicate id' }); ids.add(e.id); if (Math.hypot(...e.at) > v.radius) issues.push({ level: 'error', where: 'entity ' + e.id, msg: 'outside the island' }); }
  report(`${f} ${k} entities`, issues);
}
for (const [f, m] of mods) for (const [k, v] of Object.entries(m)) {
  if (v && typeof v === 'object' && Array.isArray(v.beats) && v.dialogues) report(`${f} ${k}`, validateScript(v));
  if (stationKit && Array.isArray(v) && v.length && v.every(s => s && s.kind === 'station')) report(`${f} ${k}`, stationKit.validateStations(v, { rules, anchors }));
}

// progress specs (kit/progress.ts): checkpoints and the stations each one requires exist
const progressKit = await import(src('kit/progress.js')).catch(() => null);
if (progressKit) {
  const stationIds = [];
  for (const [, m] of mods) for (const v of Object.values(m)) for (const st of (Array.isArray(v) ? v : [v])) if (st && typeof st === 'object' && st.kind === 'station') stationIds.push(st.id);
  for (const [f, m] of mods) for (const [k, v] of Object.entries(m)) if (v && typeof v === 'object' && Array.isArray(v.order) && v.requires) report(`${f} ${k}`, progressKit.validateProgress(v, stationIds).map(msg => ({ level: 'error', where: 'progress', msg })));
}

// content checks a level ships with (does the content agree with its rules' answers?)
for (const [f, m] of mods) for (const [k, v] of Object.entries(m)) if (typeof v === 'function' && k.endsWith('_CONTENT_CHECK')) {
  report(`${f} ${k}`, v().map(msg => ({ level: 'error', where: 'content', msg })));
}

// the checker must catch a broken script
const broken = {
  id: 'broken', title: 'x', needs: { handlers: ['a'], anchors: ['p'] },
  beats: [{ id: 'one', goal: { text: 'Go', at: 'nowhere' }, thoughts: [{ id: 'missing', delay: 0 }] }, { id: 'one' }],
  dialogues: { d: { start: { text: 'This sentence is far too long for a phone screen and a young player to read.', choices: [{ label: 'x', on: 'b', next: 'gone' }] } } },
  thoughts: {}, toasts: {}, labels: {}, stars: {},
};
const caught = validateScript(broken).map(i => i.msg).join(' | ');
for (const want of ['unknown anchor', 'unknown thought', 'duplicate beat', 'no handler', 'missing line', 'words']) if (!caught.includes(want)) { errors++; console.log(`✗ self-test: did not catch "${want}"`); R.add('fail', `self-test: catches "${want}"`, { lane: 'system' }); }
R.write(null);

console.log(`\n${errors} errors, ${warns} warnings`);
process.exit(errors ? 1 : 0);
