// Next-word check: proves every place in a next-word lab (kit/ngram.ts, schema vibelearn.ngram.v1)
// can be solved from what the player can read by then, whatever order they read it in, and that
// each place's lesson is needed: without its key reading, no phrase the engine will say works.
// Also lists the funny wrong things it will say there. Game-agnostic, from data alone, <1 s.
//   - SOLVABLE in every reading order (ties between equally common words go to the one read first,
//     so order can matter at the edge of the top few);
//   - NEEDS ITS LESSON: with the key source unread, nothing works (warn if it does);
//   - MORE THAN ONE WRONG THING to say (a single path is a quiz);
//   - every 'say:' line can be reached somewhere (warn if not: dead writing).
//   bash tools/build.sh && node tools/ngramcheck.mjs [--root out]
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createReport } from './lib/report.mjs';

const i = process.argv.indexOf('--root'), root = resolve(i > 0 ? process.argv[i + 1] : 'out');
const src = p => pathToFileURL(resolve(root, 'src', p)).href;
const { createNgram, validateNgram } = await import(src('kit/ngram.js'));
const { speak, validateUtter } = await import(src('kit/utter.js'));
const R = createReport({ tool: 'ngramcheck', lane: 'learning', root });
let fails = 0, warns = 0;
const say = (lvl, msg) => { if (lvl === '✗') fails++; if (lvl === '!') warns++; console.log(`  ${lvl} ${msg}`); R.add(lvl === '✓' ? 'pass' : lvl === '✗' ? 'fail' : 'warn', msg); };
const perms = a => a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));

const labs = [];
for (const f of readdirSync(resolve(root, 'src/worlds')).filter(f => f.endsWith('.js'))) {
  const mod = await import(src('worlds/' + f));
  for (const [name, v] of Object.entries(mod)) if (v?.schema === 'vibelearn.ngram.v1') labs.push({ spec: v, sources: mod[name + '_SOURCES'] ?? [] });
}
if (!labs.length) console.log('no next-word labs in this build');
for (const { spec, sources } of labs) {
  console.log(`\n${spec.id}`);
  const issues = [...validateNgram(spec, sources.map(s => s.id)), ...validateUtter(spec.utter).filter(m => !/offers unknown word|reads no words/.test(m))];
  issues.length ? issues.forEach(m => say('✗', `${spec.id}: ${m}`)) : say('✓', `${spec.id}: spec is valid`);
  const byId = Object.fromEntries(sources.map(s => [s.id, s]));
  const reached = new Set();
  // what the engine will say, and what each phrase makes, after reading these sources in this order
  const outcomes = (site, order) => {
    const e = createNgram(spec.n); spec.pretrain.forEach(t => e.read(t)); order.forEach(id => e.read(byId[id].line));
    const starts = order.map(id => byId[id].word);
    return { e, said: e.sayable(starts, site.slots, spec.top).map(w => ({ w, m: speak(spec.utter, w, site) })) };
  };
  const lineOf = (w, m) => { for (let k = w.length; k >= 2; k--) { const l = spec.utter.lines['say:' + w.slice(0, k).join(' ')]; if (l) { reached.add('say:' + w.slice(0, k).join(' ')); return l; } } return `(${m.reason}${m.thing ? ' ' + m.thing : ''})`; };
  spec.places.forEach((p, n) => {
    const site = spec.utter.sites[n];
    console.log(`  ${site.asks} — ${p.lesson}`);
    const orders = perms(p.reads), works = new Set(), wrong = new Map();
    let unsolvable = null;
    for (const order of orders) {
      const { said } = outcomes(site, order), ok = said.filter(x => x.m.works);
      if (!ok.length && !unsolvable) unsolvable = order;
      ok.forEach(x => works.add(x.w.join(' ')));
      // wrong things it will say, part-way through reading too (a player can speak before reading everything)
      for (let k = 1; k <= order.length; k++) outcomes(site, order.slice(0, k)).said.filter(x => !x.m.works).forEach(x => wrong.set(x.w.join(' '), lineOf(x.w, x.m)));
    }
    unsolvable ? say('✗', `${site.id}: not solvable when read in the order ${unsolvable.join(', ')}`) : say('✓', `${site.id}: solvable in all ${orders.length} reading orders (${[...works].slice(0, 4).map(w => `"${w}"`).join(', ')})`);
    if (p.key) {
      const without = p.reads.filter(r => r !== p.key), solved = perms(without).find(o => outcomes(site, o).said.some(x => x.m.works));
      solved ? say('!', `${site.id}: solvable without reading "${p.key}" (order ${solved.join(', ')}), so the lesson can be skipped`) : say('✓', `${site.id}: needs "${p.key}" read first (the lesson can't be skipped)`);
    }
    const lines = new Set(wrong.values());
    lines.size >= 2 ? say('✓', `${site.id}: ${wrong.size} wrong things it will say, ${lines.size} different outcomes`) : say('!', `${site.id}: only ${lines.size} way to be wrong`);
    for (const [w, l] of [...wrong].slice(0, 6)) console.log(`      "${w}" → ${l}`);
    // what "let it finish" makes from each first word, with everything read
    const { e } = outcomes(site, p.reads), stop = w => w.length > 1 && spec.utter.lexicon[w[w.length - 1]]?.kind === 'thing';
    console.log('      let it finish: ' + [...new Set(p.reads.map(id => byId[id].word))].map(s => { const w = e.complete([s], site.slots, stop, spec.top); return `${w.join(' ')}${speak(spec.utter, w, site).works ? ' ✓' : ''}`; }).join(' · '));
  });
  const dead = Object.keys(spec.utter.lines).filter(k => k.startsWith('say:') && !reached.has(k));
  dead.length ? say('!', `${spec.id}: lines never reached: ${dead.join(', ')}`) : say('✓', `${spec.id}: every phrase line can be reached`);
}
console.log(`\n${fails} failures, ${warns} warnings`);
R.write(null);
process.exit(fails ? 1 : 0);
