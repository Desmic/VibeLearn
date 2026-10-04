// The quality gate: one verdict per lane for THIS build, from every report bound to it
// (quality/<build>/*.json, written by tools/lib/report.mjs: checks, AI play-tests, people).
//
//   node tools/quality.mjs [--root out] [--json]
//
// Rules (kept from the old critic system, docs/QUALITY-SYSTEM.md):
//   - lanes are never averaged: a fail in any lane means the build is not ready;
//   - unresolved is not a pass: a lane with no evidence, or only unresolved results, is
//     "unresolved" and says which check would resolve it;
//   - a lane only a person can judge ("feel") stays unresolved until a person's verdict on
//     this exact build is recorded (tools/verdict.mjs);
//   - reports from other builds are ignored (listed, never counted).
// Exit 1 when any lane fails. "Ready for a person's review" needs every tool lane to pass.
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildId } from './lib/build-id.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const root = arg('root', 'out'), build = buildId(root), dir = join('quality', build);
const reg = JSON.parse(readFileSync('tools/checks.json', 'utf8'));
const all = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('quality')).map(f => JSON.parse(readFileSync(join(dir, f), 'utf8'))) : [];
// a partial run (--only some segments) supersedes the same tool's older results for those segments
const reports = all.map(r => {
  if (r.segments?.length) return r;
  const newer = all.filter(p => p.segments?.length && p.tool === r.tool && p.input === r.input && p.finished > r.finished).flatMap(p => p.segments);
  return newer.length ? { ...r, results: r.results.filter(x => !newer.includes(x.segment)) } : r;
});
const others = existsSync('quality') ? readdirSync('quality').filter(d => d.startsWith('b-') && d !== build) : [];

const lanes = Object.entries(reg.lanes).map(([id, l]) => {
  const rs = reports.flatMap(r => r.results.filter(x => x.lane === id).map(x => ({ ...x, tool: r.tool, input: r.input, by: r.by ?? 'tool' })));
  const n = k => rs.filter(x => x.status === k).length;
  const person = l.judged_by.startsWith('a person');
  let status = n('fail') ? 'fail' : !rs.length || (person && !rs.some(x => x.by === 'person')) ? 'unresolved' : n('unresolved') ? 'unresolved' : n('warn') ? 'warn' : 'pass';
  const from = [...new Set(rs.map(x => x.tool + (x.input ? ':' + x.input : '')))];
  const resolveWith = reg.checks.filter(c => c.lanes.includes(id) && !from.some(f => f.startsWith(c.id))).map(c => c.id);
  return { id, asks: l.asks, judged_by: l.judged_by, status, pass: n('pass'), fail: n('fail'), warn: n('warn'), unresolved: n('unresolved'), from, resolveWith,
    fails: rs.filter(x => x.status === 'fail').map(x => ({ tool: x.tool, input: x.input, claim: x.claim, detail: x.detail, repro: x.repro })),
    open: rs.filter(x => x.status === 'unresolved').map(x => ({ tool: x.tool, claim: x.claim, detail: x.detail })) };
});
const failing = lanes.filter(l => l.status === 'fail'), toolLanes = lanes.filter(l => !l.judged_by.startsWith('a person'));
const ready = !failing.length && toolLanes.every(l => l.status === 'pass' || l.status === 'warn');
const verdict = { schema: 'vibelearn.quality.v1', build, when: new Date().toISOString(), ready_for_person_review: ready, accepted: false, lanes, reports: reports.map(r => ({ tool: r.tool, input: r.input, by: r.by, finished: r.finished, summary: r.summary })), ignored_older_builds: others };
verdict.accepted = ready && lanes.every(l => l.status === 'pass' || l.status === 'warn');   // a person passed the person-only lanes too

const icon = { pass: '✓', warn: '!', fail: '✗', unresolved: '?' };
const md = [`# Quality — build ${build}`, '', `Ready for a person's review: **${ready ? 'yes' : 'no'}** · accepted: **${verdict.accepted ? 'yes' : 'no'}**`, '',
  '| Lane | Status | Results | From | To resolve |', '|---|---|---|---|---|',
  ...lanes.map(l => `| ${l.id} | ${icon[l.status]} ${l.status} | ${l.pass} pass, ${l.fail} fail, ${l.warn} warn, ${l.unresolved} open | ${l.from.join(', ') || '—'} | ${l.status === 'pass' ? '' : (l.judged_by.startsWith('a person') ? 'a person: tools/verdict.mjs' : l.resolveWith.join(', '))} |`),
  '', ...failing.flatMap(l => [`## ✗ ${l.id}`, ...l.fails.map(f => `- **${f.claim}** (${f.tool}${f.input ? ', ' + f.input : ''})${f.detail ? ' — ' + f.detail : ''}${f.repro ? `  \n  reproduce: \`${f.repro}\`` : ''}`), '']),
  others.length ? `_${others.length} older build(s) in quality/ ignored: a verdict never carries over to a changed build._` : ''].join('\n');
writeFileSync(join(dir, 'quality.json'), JSON.stringify(verdict, null, 1));
writeFileSync(join(dir, 'quality.md'), md);
if (process.argv.includes('--json')) console.log(JSON.stringify(verdict, null, 1));
else {
  console.log(`Quality — build ${build} (${reports.length} reports)`);
  for (const l of lanes) console.log(`  ${icon[l.status]} ${l.id.padEnd(13)} ${l.status.padEnd(10)} ${`${l.pass}/${l.fail}/${l.warn}/${l.unresolved}`.padEnd(12)} ${l.status === 'pass' ? '' : l.judged_by.startsWith('a person') && !l.fail ? 'needs a person (tools/verdict.mjs)' : l.status === 'fail' ? l.fails.slice(0, 2).map(f => f.claim).join('; ') : l.resolveWith.length ? 'run: ' + l.resolveWith.join(', ') : ''}`);
  console.log(`Ready for a person's review: ${ready ? 'yes' : 'no'} · accepted: ${verdict.accepted ? 'yes' : 'no'} · ${join(dir, 'quality.md')}`);
}
process.exit(failing.length ? 1 : 0);
