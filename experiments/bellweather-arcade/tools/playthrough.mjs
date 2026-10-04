// The whole game, played the way players play it: once as a phone (taps and the thumb stick,
// 393×760) and once as a laptop (E, Space, number keys, WASD, 1024×640), then the scene timing
// log, then a speedrun (walks the whole game, times it, proves no learning can be skipped).
// Add `breaker` to --only for the adversarial run as a phone too. One game at a time (never in parallel).
// Writes <out>/index.html linking every contact sheet, the pacing and the timing log: review the pictures, not just the pass count.
//
//   bash tools/build.sh && node tools/playthrough.mjs [--out playthrough] [--only touch,keyboard,timing,speedrun,breaker]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, createWriteStream } from 'node:fs';
import { arg } from './harness.mjs';

const OUT = arg('out', 'playthrough'); mkdirSync(OUT, { recursive: true });
const ONLY = new Set(arg('only', 'touch,keyboard,timing,speedrun').split(','));
const run = (name, args) => new Promise(done => {
  const log = createWriteStream(`${OUT}/${name}.log`), t0 = Date.now();
  console.log(`\n=== ${name}: node ${args.join(' ')}`);
  const p = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  for (const s of [p.stdout, p.stderr]) s.on('data', d => { log.write(d); process.stdout.write(d); });
  p.on('close', code => { log.end(); done({ name, code, secs: Math.round((Date.now() - t0) / 1000) }); });
});

const runs = [];
for (const input of ['touch', 'keyboard']) if (ONLY.has(input)) runs.push(await run(input, ['tools/flowcheck.mjs', '--input', input, '--out', `${OUT}/${input}`]));
if (ONLY.has('timing')) runs.push(await run('timing', ['tools/timing.mjs', '--out', `${OUT}/timing`]));
if (ONLY.has('speedrun')) runs.push(await run('speedrun', ['tools/speedrun.mjs', '--input', 'touch', '--out', `${OUT}/speedrun`]));
if (ONLY.has('breaker')) runs.push(await run('breaker', ['tools/breaker.mjs', '--input', 'touch', '--out', `${OUT}/breaker`]));

const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const summary = r => {
  const f = `${OUT}/${r.name}/report.json`; if (!existsSync(f)) return r.code ? 'did not finish' : 'done';
  const j = JSON.parse(readFileSync(f, 'utf8')); return `${j.passed} passed, ${j.failed} failed, ${j.warned} warnings`;
};
const pace = existsSync(`${OUT}/speedrun.log`) ? readFileSync(`${OUT}/speedrun.log`, 'utf8').split('\n').filter(l => /^PACING|^BEATS|^  \S+ +(from )?[\d.]+ s|design note/.test(l)).join('\n') : '';
const timing = existsSync(`${OUT}/timing.log`) ? readFileSync(`${OUT}/timing.log`, 'utf8').split('\n').filter(l => /^\s*\d|──|OVERLAP|DEAD AIR|PASS|FAIL|WARN/.test(l)).join('\n') : '';
writeFileSync(`${OUT}/index.html`, `<!doctype html><meta charset=utf-8><title>Play-through ${new Date().toISOString().slice(0, 16)}</title>
<style>body{font:14px system-ui;background:#14202c;color:#eee;margin:16px;max-width:1100px}a{color:#ffd36b}pre{background:#0c151e;padding:12px;overflow:auto;font-size:12px}.bad{color:#ff9d8a}</style>
<h1>Play-through — ${new Date().toISOString().slice(0, 16).replace('T', ' ')}</h1>
<ul>${runs.map(r => `<li${r.code ? ' class=bad' : ''}><b>${r.name}</b>: ${esc(summary(r))} (${r.secs} s) — ${r.name === 'timing' ? '' : `<a href="${r.name}/sheet.html">contact sheet</a> · `}<a href="${r.name}.log">log</a></li>`).join('')}</ul>
${pace ? `<h2>Speedrun pacing (game seconds)</h2><pre>${esc(pace)}</pre>` : ''}
${timing ? `<h2>Scene timing (game time, voiced lengths)</h2><pre>${esc(timing)}</pre>` : ''}`);
console.log(`\nPlay-through: ${OUT}/index.html`); runs.forEach(r => console.log(`  ${r.name}: ${summary(r)} (${r.secs} s)`));
process.exit(runs.some(r => r.code) ? 1 : 0);
