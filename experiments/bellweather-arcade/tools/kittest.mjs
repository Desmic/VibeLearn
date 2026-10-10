// Unit tests for pure kit modules (no browser): the rules a game relies on, proven on small
// made-up cases so they hold for any game. In `npm run check`.
//   bash tools/build.sh && node tools/kittest.mjs
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createReport } from './lib/report.mjs';

const kit = p => import(pathToFileURL(resolve('out/src/kit', p)).href);
const R = createReport({ tool: 'kittest', lane: 'system' });
let fails = 0;
const t = (claim, ok, detail = '') => { if (!ok) fails++; console.log(`${ok ? '✓' : '✗'} ${claim}${ok ? '' : ' — ' + detail}`); R.add(ok ? 'pass' : 'fail', claim, { detail }); };

// kit/target.ts: aimed beats near; nothing aimed → nearest; lined-up things defer to priority; reach counts
const { pickTarget } = await kit('target.js');
const at = { x: 0, z: 0 };
t('target: an aimed thing beats a nearer one off to the side', pickTarget([{ item: 'near', x: 1, z: 0, r: 5 }, { item: 'aimed', x: 0, z: 3, r: 5 }], at, { x: 0, z: 1 })?.item === 'aimed');
t('target: with nothing aimed, the nearest wins', pickTarget([{ item: 'near', x: 1, z: 0, r: 5 }, { item: 'far', x: 0, z: 3, r: 5 }], at, { x: 0, z: -1 })?.item === 'near');
t('target: with no look direction, the nearest wins', pickTarget([{ item: 'near', x: 1, z: 0, r: 5 }, { item: 'far', x: 0, z: 3, r: 5 }], at, null)?.item === 'near');
t('target: of two aimed things, the more centred wins', pickTarget([{ item: 'edge', x: 1.5, z: 3, r: 5 }, { item: 'centre', x: .1, z: 3, r: 5 }], at, { x: 0, z: 1 })?.item === 'centre');
t('target: things lined up behind each other defer to priority', pickTarget([{ item: 'front', x: 0, z: 1, r: 9 }, { item: 'behind', x: .2, z: 5, r: 9, priority: 1 }], at, { x: 0, z: 1 })?.item === 'behind');
t('target: out of reach is never picked', pickTarget([{ item: 'far', x: 0, z: 6, r: 5 }], at, { x: 0, z: 1 }) === null);

// kit/progress.ts: resume only as far as the learning record supports
const { verifiedCheckpoint, validateProgress } = await kit('progress.js');
const P = { order: ['a', 'b', 'c'], requires: { b: ['s1'], c: ['s1', 's2'] } };
t('progress: a save past its learning resumes where the record allows', verifiedCheckpoint(P, 'c', new Set(['s1'])) === 'b');
t('progress: an earned save resumes where it was', verifiedCheckpoint(P, 'c', new Set(['s1', 's2'])) === 'c');
t('progress: a later checkpoint dropping a requirement is caught', validateProgress({ order: ['a', 'b'], requires: { a: ['s1'], b: ['s2'] } }, ['s1', 's2']).length === 1);

// kit/utter.ts: phrases are read in order; the first thing named is made at once
const { speak } = await kit('utter.js');
const U = { lexicon: { bridge: { kind: 'thing', thing: 'bridge' }, long: { kind: 'size', scale: 2 }, paper: { kind: 'material', material: 'paper', weak: true }, away: { kind: 'facing', away: true } },
  things: { bridge: { archetype: 'span', size: 4 }, noodle: { archetype: 'span', size: 6, weak: true } }, guesses: { long: 'noodle' } };
const gap = { need: { archetype: 'span', length: 7 }, slots: 3 };
t('utter: modifiers before the thing shape it', speak(U, ['long', 'bridge'], gap).works);
t('utter: a modifier after the thing is too late', speak(U, ['bridge', 'long'], gap).reason === 'too-short' && speak(U, ['bridge', 'long'], gap).late[0] === 'long');
t('utter: a weak material gives way', speak(U, ['long', 'paper', 'bridge'], gap).reason === 'too-weak');
t('utter: facing away is the wrong way', speak(U, ['away', 'long', 'bridge'], gap).reason === 'wrong-way');
t('utter: no thing named, the engine finishes the phrase with its guess', speak(U, ['long'], gap).guessed && speak(U, ['long'], gap).thing === 'noodle');
const U2 = { ...U, lexicon: { ...U.lexicon, rope: { kind: 'thing', thing: 'rope', asMaterial: { material: 'rope' } } }, things: { ...U.things, rope: { archetype: 'prop', size: 1 } } };
t('utter: a thing word before another thing is its material ("rope bridge")', (m => m.thing === 'bridge' && m.material === 'rope')(speak(U2, ['rope', 'bridge'], gap)));
t('utter: ...but after it, too late ("bridge rope")', (m => m.thing === 'bridge' && m.late[0] === 'rope')(speak(U2, ['bridge', 'rope'], gap)));
t('utter: words past the context are not read', speak(U, ['long', 'bridge'], { ...gap, slots: 1 }).thing === 'noodle');
// working memory: the newest words stay, the oldest are forgotten (a context window)
const mem = { ...gap, slots: 2, memory: 'recent' };
t('utter: with a working memory, the oldest word is forgotten', (m => m.forgotten[0] === 'long' && m.thing === 'bridge' && m.size === 4)(speak(U, ['long', 'paper', 'bridge'], mem)));
t('utter: ...and what fits is read whole', (m => m.works && !m.forgotten.length)(speak(U, ['long', 'bridge'], mem)));
t('utter: without one, the first words stay', (m => m.thing === 'noodle' && !m.forgotten.length)(speak(U, ['long', 'paper', 'bridge'], { ...gap, slots: 2 })));

// kit/ngram.ts: a next-word engine learns pairs by reading and says only its likeliest few
const { createNgram, clauses } = await kit('ngram.js');
const ng = createNgram(2); ['a long way.', 'a long way.', 'long ago.', 'long noodle.', 'long bridge.'].forEach(x => ng.read(x));
t('ngram: no pair is counted across a full stop or comma', clauses('long. bridge, way')[0].length === 1 && ng.count('way', 'long') === 0);
t('ngram: suggestions are what it read after the word, most often first', (s => s[0].word === 'way' && s[0].count === 2)(ng.suggest(['long'])));
t('ngram: only the likeliest few are sayable; rarer ones are shown, not said', (s => s.length === 4 && s.filter(x => x.ok).length === 1 && !s[3].ok)(ng.suggest(['long'], 1, 5)));
t('ngram: a word tied with the last sayable one is sayable too', (s => s.filter(x => x.ok).length === 4)(ng.suggest(['long'], 2, 5)));
t('ngram: ties go to the pair read first', ng.suggest(['long'])[1].word === 'ago');
ng.read('long bridge, long bridge, long bridge.');
t('ngram: reading more of a pair makes it likelier', ng.suggest(['long'])[0].word === 'bridge' && ng.count('long', 'bridge') === 4);
t('ngram: let it finish takes its favourite each time and stops when told', ng.complete(['a'], 3).join(' ') === 'a long bridge' && ng.complete(['a'], 3, w => w.length === 2).join(' ') === 'a long');
t('ngram: it suggests nothing after a word it never read anything after', ng.suggest(['zebra']).length === 0);
const ng3 = createNgram(3); ng3.read('a long way. the long bridge.');
t('ngram: a bigger n reads two words back, and falls back to one', ng3.suggest(['the', 'long'])[0].word === 'bridge' && ng3.suggest(['so', 'long'])[0].word === 'way');
// kit/pose-hold.ts: layered motion on clips. The mixer skips writing a bone whose value didn't
// change, so a rig that resets to rest before it popped to rest whenever a clip held still
// (11 Oct, idle flicker on PC). Proven on the real Idle clip, which holds still in places.
{
  const T = await import('three'); const { poseBase } = await kit('pose-hold.js');
  const { readFileSync } = await import('node:fs');
  const data = JSON.parse(readFileSync('public/characters/zip-ual-clips.json', 'utf8')), c = data.clips.find(c => c.name === 'Idle');
  const n = c.hips.length / 3, times = new Float32Array(n); for (let i = 0; i < n; i++) times[i] = Math.min(c.duration, i / c.fps);
  const clip = new T.AnimationClip('Idle', c.duration, Object.entries(c.tracks).map(([b, q]) => new T.QuaternionKeyframeTrack(`${b}.quaternion`, times, q)));
  const worst = hold => { const root = new T.Object3D(), bones = Object.keys(c.tracks).map(k => { const b = new T.Bone(); b.name = k; root.add(b); return b; });
    const rest = bones.map(b => b.quaternion.clone()), base = poseBase(bones), mixer = new T.AnimationMixer(root); mixer.clipAction(clip).play();
    let prev = null, max = 0;
    for (let f = 0; f < 45 * 6; f++) { if (hold) base.restore(); else bones.forEach((b, i) => b.quaternion.copy(rest[i]));
      mixer.update(1 / 45); if (hold) base.keep();
      const now = bones.map(b => b.quaternion.clone()); if (prev) now.forEach((q, i) => { max = Math.max(max, q.angleTo(prev[i]) * 180 / Math.PI); }); prev = now; }
    return max; };
  const popped = worst(false), held = worst(true);
  t('pose-hold: resetting to rest before the mixer pops a bone when the clip holds still (the bug, reproduced)', popped > 10, popped.toFixed(1) + '°');
  t('pose-hold: starting from the last clip pose, idle never jumps more than 3° a frame', held < 3, held.toFixed(1) + '°');
}

// kit/nav.ts: a way on foot round walls; the arrow faces the way, not the goal through a wall
const { findPath, wayPoint, clearLine } = await kit('nav.js');
// a room 10 m square with a wall across the middle (z 0) open only at its east end (x > 3)
const room = (x, z) => Math.abs(x) < 5 && Math.abs(z) < 5 && !(Math.abs(z) < .3 && x < 3);
const way = findPath(room, [-3, -3], [-3, 3]);
t('nav: a clear line is walked straight', (p => p.length === 1 && p[0][0] === 2 && p[0][1] === -2)(findPath(room, [-3, -2], [2, -2])));
t('nav: a wall in the way is walked round, through the gap', !!way && way.some(p => p[0] > 2.8 && Math.abs(p[1]) < 1) && way.at(-1)[0] === -3 && way.at(-1)[1] === 3, JSON.stringify(way));
t('nav: every leg of the way is clear', !!way && [[-3, -3], ...way].every((p, i, a) => i === 0 || clearLine(room, a[i - 1], p)));
const wp = wayPoint(room, [-3, -3], [-3, 3]);
t('nav: the way to face points at the gap, not at the goal through the wall', wp[0] > 2, JSON.stringify(wp));
const shut = (x, z) => Math.abs(x) < 5 && Math.abs(z) < 5 && Math.abs(z) > .3;
t('nav: an unreachable goal gives the nearest reachable spot', (p => !!p && Math.abs(p.at(-1)[1]) < 1.2 && p.at(-1)[1] < 0)(findPath(shut, [0, -3], [0, 3])));
t('nav: standing nowhere gives no way', findPath(room, [20, 20], [0, 0]) === null);
R.write(null);
console.log(`\n${fails} failures`);
process.exit(fails ? 1 : 0);
