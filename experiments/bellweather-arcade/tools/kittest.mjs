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

R.write(null);
console.log(`\n${fails} failures`);
process.exit(fails ? 1 : 0);
