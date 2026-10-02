// Camera walk: walks the opening routes with the real follow camera (no posing) and
// scores every half second: is Zip on screen, is the view blocked, is the lens inside
// something, is the camera pressed against Zip. Screenshots of the first bad frames.
//   node tools/camwalk.mjs [outDir] [arch]      ('arch' walks the arrival and arch routes)
import { harness } from './harness.mjs';
const h = await harness({ title: 'camera path', outDefault: process.argv[2] || '/tmp/cp' });
const { page } = h;
await h.open('&title=0&beat=skiff'); await page.waitForTimeout(2500);
const legs = (process.argv[3] === 'arch') ? [[0, 6], [0, 2], [-1, -1.5], [2, -1.5], [0, -3.5], [-3, -2], [3, 1], [6, 2.5], [5, 5], [-6, 6], [-7, 1], [0, 7]] : [[1, 4], [3.5, -6], [4.6, -9.6], [0, -9.5], [-4.5, -9.6], [-6.4, -9.8], [-6, -4], [-2, 1.5], [-6, 5], [1, 7], [6, 3], [6, -8], [6.2, -9.8], [2.4, -10.2]];
const rows = [];
let shots = 0;
for (const [x, z] of legs) {
  for (let k = 0; k < 8; k++) {
    await page.evaluate(([x, z]) => window.__arcade.simulate(.5, { walkTo: [x, z] }), [x, z]);
    const p = await page.evaluate(() => ({ ...window.__arcade.viewProbe(), pos: window.__arcade.snapshot().position.map(v => +v.toFixed(1)) }));
    const bad = !!p.blocked || p.near > .15 || !p.zipOnScreen || p.dist < 1.6;
    rows.push({ to: [x, z], ...p, bad });
    if (bad && shots < 8) { shots++; await h.shot(`bad-${rows.length}`); }
    const at = p.pos; if (Math.hypot(at[0] - x, at[2] - z) < .5) break;
  }
}
const bad = rows.filter(r => r.bad);
console.log(`samples ${rows.length}, bad ${bad.length}`);
for (const r of bad) console.log(JSON.stringify({ pos: r.pos, blocked: r.blocked, near: +r.near.toFixed(2), dist: r.dist, onScreen: r.zipOnScreen, camHit: r.camHit, zoom: r.zoom }));
await h.browser.close(); process.exit(0);
