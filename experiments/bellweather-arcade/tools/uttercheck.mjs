// Utterance check: proves every place that asks the player to say a thing into existence
// (kit/utter.ts, any spec with schema vibelearn.utter.v1 in the build) can be solved from the
// words it offers, and shows how it fails. Game-agnostic, from data alone, <1 s.
//   - SOLVABLE: at least one phrase of up to `slots` words works;
//   - MORE THAN ONE WAY or not (a single answer is a quiz, not a toy: warning);
//   - FUNNY FAILURES: at least two different ways to be wrong (warning otherwise);
//   - every offered word does something (appears in a working phrase or changes a failure).
//   bash tools/build.sh && node tools/uttercheck.mjs [--root out]
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createReport } from './lib/report.mjs';

const i = process.argv.indexOf('--root'), root = resolve(i > 0 ? process.argv[i + 1] : 'out');
const src = p => pathToFileURL(resolve(root, 'src', p)).href;
const { speak, phrases, validateUtter } = await import(src('kit/utter.js'));
const R = createReport({ tool: 'uttercheck', lane: 'learning', root });
let fails = 0, warns = 0;
const say = (lvl, msg) => { if (lvl === '✗') fails++; if (lvl === '!') warns++; console.log(`  ${lvl} ${msg}`); R.add(lvl === '✓' ? 'pass' : lvl === '✗' ? 'fail' : 'warn', msg); };

const specs = [];
for (const f of readdirSync(resolve(root, 'src/worlds')).filter(f => f.endsWith('.js'))) for (const v of Object.values(await import(src('worlds/' + f)))) if (v?.schema === 'vibelearn.utter.v1' && !specs.includes(v)) specs.push(v);
for (const spec of specs) {
  console.log(`\n${spec.id}`);
  const issues = validateUtter(spec);
  issues.length ? issues.forEach(m => say('✗', `${spec.id}: ${m}`)) : say('✓', `${spec.id}: spec is valid`);
  for (const site of spec.sites) {
    const all = phrases(site).map(p => ({ p, m: speak(spec, p, site) }));
    const ok = all.filter(x => x.m.works), shortest = ok.length ? Math.min(...ok.map(x => x.p.length)) : 0;
    const reasons = {}; for (const x of all) reasons[x.m.reason] = (reasons[x.m.reason] ?? 0) + 1;
    console.log(`  ${site.id} (“${site.asks}”, ${all.length} phrases): ${Object.entries(reasons).map(([k, n]) => `${k} ${n}`).join(', ')}`);
    ok.length ? say('✓', `${site.id}: solvable; e.g. ${ok.filter(x => x.p.length === shortest).slice(0, 4).map(x => '“' + x.p.join(' ') + '”').join(', ')}`) : say('✗', `${site.id}: NOT solvable from ${site.words.join(', ')}`);
    const distinctThings = new Set(ok.map(x => `${x.m.thing}|${x.m.material}|${x.m.size}`));
    if (ok.length && distinctThings.size < 2) say('!', `${site.id}: only one thing works (a quiz, not a toy)`);
    const wrongKinds = Object.keys(reasons).filter(k => k !== 'works');
    wrongKinds.length >= 2 ? say('✓', `${site.id}: ${wrongKinds.length} different ways to be wrong (${wrongKinds.join(', ')})`) : say('!', `${site.id}: fewer than two ways to be wrong`);
    const idle = site.words.filter(w => !all.some(x => x.p.includes(w) && (x.m.works || x.p.length === 1)));
    if (idle.length) say('!', `${site.id}: words that never matter: ${idle.join(', ')}`);
  }
}
if (!specs.length) R.add('unresolved', 'utterance places proven', { detail: 'no vibelearn.utter.v1 spec in the build' });
// self-test: a site whose only noun is too short must be caught as unsolvable
const trap = { schema: 'vibelearn.utter.v1', id: 'selftest', lexicon: { plank: { kind: 'thing', thing: 'plank' } }, things: { plank: { archetype: 'span', size: 1, look: 'plank' } }, guesses: {}, sites: [{ id: 'gap', asks: 'x', need: { archetype: 'span', length: 5 }, words: ['plank'], slots: 2 }], lines: {} };
const caught = !phrases(trap.sites[0]).some(p => speak(trap, p, trap.sites[0]).works);
R.add(caught ? 'pass' : 'fail', 'self-test: an unsolvable place is caught', { lane: 'system' }); if (!caught) fails++;
R.write(null);
console.log(`\n${specs.length} utterance specs · ${fails} failures, ${warns} warnings`);
process.exit(fails ? 1 : 0);
