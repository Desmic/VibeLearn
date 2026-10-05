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
    // a place that teaches a word through a failure: the failure must be reachable from what the
    // player holds on arrival, and the place is judged with the taught word added
    if (site.teaches) {
      const before = phrases(site).map(p => ({ p, m: speak(spec, p, site) }));
      const teach = before.filter(x => x.m.reason === site.teaches.reason);
      teach.length ? say('✓', `${site.id}: the obvious miss teaches “${site.teaches.word}” (${site.teaches.reason}, e.g. “${teach[0].p.join(' ')}”)`) : say('✗', `${site.id}: no phrase from ${site.words.join(', ')} fails as ${site.teaches.reason}, so “${site.teaches.word}” can never be taught`);
      const winsEarly = before.filter(x => x.m.works);
      if (winsEarly.length) say('!', `${site.id}: solvable before the lesson (${winsEarly.slice(0, 3).map(x => '“' + x.p.join(' ') + '”').join(', ')}), so the miss is optional`);
    }
    const all = phrases(site, site.teaches ? [site.teaches.word] : []).map(p => ({ p, m: speak(spec, p, site) }));
    const ok = all.filter(x => x.m.works), shortest = ok.length ? Math.min(...ok.map(x => x.p.length)) : 0;
    const reasons = {}; for (const x of all) reasons[x.m.reason] = (reasons[x.m.reason] ?? 0) + 1;
    console.log(`  ${site.id} (“${site.asks}”, ${all.length} phrases): ${Object.entries(reasons).map(([k, n]) => `${k} ${n}`).join(', ')}`);
    ok.length ? say('✓', `${site.id}: solvable${site.teaches ? ' after the lesson' : ''}; e.g. ${ok.filter(x => x.p.length === shortest).slice(0, 4).map(x => '“' + x.p.join(' ') + '”').join(', ')}`) : say('✗', `${site.id}: NOT solvable from ${site.words.join(', ')}`);
    if (ok.length && ok.every(x => x.m.guessed)) say('✓', `${site.id}: only the engine's own guess solves it (e.g. “${ok[0].p.join(' ')}” → ${ok[0].m.thing}): the player has to stop mid-phrase`);
    const distinctThings = new Set(ok.map(x => `${x.m.thing}|${x.m.material}|${x.m.size}`));
    if (ok.length && distinctThings.size < 2) say('!', `${site.id}: only one thing works (a quiz, not a toy)`);
    const wrongKinds = Object.keys(reasons).filter(k => k !== 'works');
    wrongKinds.length >= 2 ? say('✓', `${site.id}: ${wrongKinds.length} different ways to be wrong (${wrongKinds.join(', ')})`) : say('!', `${site.id}: fewer than two ways to be wrong`);
    const idle = [...site.words, ...(site.teaches ? [site.teaches.word] : [])].filter(w => !all.some(x => x.p.includes(w) && (x.m.works || x.p.length === 1)));
    if (idle.length) say('!', `${site.id}: words that never matter: ${idle.join(', ')}`);
    // someone else's words in the engine: what happens if the player just speaks, and whether adding a word pushes one out
    if (site.preload?.length) {
      const m = speak(spec, site.preload, site);
      say('✓', `${site.id}: arrives holding “${site.preload.join(' ')}” (said as is: ${m.reason})${site.memory === 'recent' && site.preload.length >= site.slots ? '; the first word the player adds pushes the oldest out' : ''}`);
    }
    // a working memory (memory 'recent'): one word too many must be able to push out a word that
    // mattered, so the player can meet forgetting here (the phrase would work if all were read)
    if (site.memory === 'recent' && new Set([...site.words, ...(site.teaches ? [site.teaches.word] : [])]).size > site.slots) {
      const wide = { ...site, slots: site.slots + 1, memory: 'first' };
      const lesson = phrases(site, site.teaches ? [site.teaches.word] : [], site.slots + 1).filter(p => p.length === site.slots + 1)
        .find(p => speak(spec, p, wide).works && !speak(spec, p, site).works);
      lesson ? say('✓', `${site.id}: one word too many can push out a word that mattered (“${lesson.join(' ')}” forgets “${lesson[0]}”)`) : say('!', `${site.id}: forgetting never costs anything here (no ${site.slots + 1}-word phrase works whole but fails once its first word drops)`);
    }
  }
}
if (!specs.length) R.add('unresolved', 'utterance places proven', { detail: 'no vibelearn.utter.v1 spec in the build' });
// self-test: a site whose only noun is too short must be caught as unsolvable
const trap = { schema: 'vibelearn.utter.v1', id: 'selftest', lexicon: { plank: { kind: 'thing', thing: 'plank' } }, things: { plank: { archetype: 'span', size: 1, look: 'plank' } }, guesses: {}, sites: [{ id: 'gap', asks: 'x', need: { archetype: 'span', length: 5 }, words: ['plank'], slots: 2 }], lines: {} };
const caught = !phrases(trap.sites[0]).some(p => speak(trap, p, trap.sites[0]).works);
R.add(caught ? 'pass' : 'fail', 'self-test: an unsolvable place is caught', { lane: 'system' }); if (!caught) fails++;
// self-test: a lesson that can never be taught (the miss it waits for can't happen) must be caught
const trap2 = { ...trap, lexicon: { plank: { kind: 'thing', thing: 'plank' }, long: { kind: 'size', scale: 9 } }, sites: [{ id: 'gap', asks: 'x', need: { archetype: 'span', length: .5 }, words: ['plank'], slots: 2, teaches: { reason: 'too-short', word: 'long' } }] };
const caught2 = !phrases(trap2.sites[0]).some(p => speak(trap2, p, trap2.sites[0]).reason === 'too-short');
R.add(caught2 ? 'pass' : 'fail', 'self-test: a lesson whose miss can never happen is caught', { lane: 'system' }); if (!caught2) fails++;
R.write(null);
console.log(`\n${specs.length} utterance specs · ${fails} failures, ${warns} warnings`);
process.exit(fails ? 1 : 0);
