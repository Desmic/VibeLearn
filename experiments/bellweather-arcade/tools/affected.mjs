// Which checks does a change call for? Reads `affects` in tools/checks.json. For a person or an
// agent before committing: run what's listed, then tools/quality.mjs.
//   node tools/affected.mjs [file …]   (no files: the git changes in this game folder)   [--json]
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const reg = JSON.parse(readFileSync('tools/checks.json', 'utf8'));
let files = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!files.length) {
  try { files = execSync('git status --porcelain --untracked-files=all -- .', { encoding: 'utf8' }).split('\n').filter(Boolean).map(l => l.slice(3).trim()); } catch { files = []; }
  // git paths are relative to the repo root; make them relative to this game folder
  let prefix = ''; try { prefix = execSync('git rev-parse --show-prefix', { encoding: 'utf8' }).trim(); } catch { /* not a repo */ }
  files = files.map(f => f.startsWith(prefix) ? f.slice(prefix.length) : '../'.repeat(prefix.split('/').filter(Boolean).length) + f);
}
const glob = g => new RegExp('^' + g.split('**').map(p => p.split('*').map(x => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*')).join('.*') + '$');
const hits = reg.checks.filter(c => c.affects?.length).map(c => ({ ...c, because: files.filter(f => c.affects.some(g => glob(g).test(f))) })).filter(c => c.because.length);
if (process.argv.includes('--json')) { console.log(JSON.stringify({ files, checks: hits.map(c => ({ id: c.id, run: c.run, cost: c.cost, lanes: c.lanes, because: c.because })) }, null, 1)); process.exit(0); }
console.log(`${files.length} changed file(s)`);
if (!hits.length) console.log('No checks listed for these files (docs or tools only?). Run `npm run check` anyway.');
for (const c of hits) console.log(`  ${c.id.padEnd(12)} ${c.cost.padEnd(12)} ${c.run}\n${' '.repeat(16)}because: ${c.because.slice(0, 4).join(', ')}${c.because.length > 4 ? ` (+${c.because.length - 4})` : ''}`);
console.log('Then: node tools/quality.mjs');
