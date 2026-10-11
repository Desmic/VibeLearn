// Reach probe: can a player who walks straight at the goal marker press the station's button?
// Runs 15 and 16 lost minutes at "Use the Word Loom", "Use the relay" and "Talk to the Gate":
// the button only showed on a small spot, away from the marker. For each station this walks
// toward the goal marker from eight sides, the way a player follows it, and records whether
// the station's button is up where the walk stops (blocked by the object, or at the marker).
//   bash tools/build.sh && node tools/reachprobe.mjs [--input touch] [--out /tmp/reach]
import { harness } from './harness.mjs';
const h = await harness({ title: 'Reach probe', outDefault: '/tmp/reach', tool: 'reachprobe', lane: 'flow' });
const { page } = h;
const sim = (s, o) => page.evaluate(([s, o]) => window.__arcade.simulate(s, o), [s, o]);
const beacon = () => page.evaluate(() => { const b = window.__vlGuide?.beaconAt; return b ? [b.x, b.z] : null; });
const button = () => page.evaluate(() => { const a = document.querySelector('.context-act'); return a && !a.hidden && a.offsetParent ? (a.dataset.label ?? a.textContent) : null; });
const card = async t => { await h.press(page.locator('.story-card button', { hasText: t }), { timeout: 20000 }).catch(() => {}); await page.waitForTimeout(400); };

// walk at the marker from 8 sides; return how many sides end with the button up
const probe = async (name, label, ring = 5.5) => {
  const b = await beacon(); if (!b) { h.check(`${name}: has a goal marker`, false, 'no beacon'); return; }
  let ok = 0, tried = 0; const misses = [];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, x = b[0] + Math.sin(a) * ring, z = b[1] + Math.cos(a) * ring;
    if (!(await page.evaluate(([x, z]) => !window.__arcade.walkable || window.__arcade.walkable(x, z), [x, z]))) continue;
    tried++;
    await page.evaluate(([x, z, y]) => window.__arcade.pose(x, z, y, .2, 6, y), [x, z, Math.atan2(-(b[0] - x), -(b[1] - z))]); await page.waitForTimeout(300);
    for (let k = 0; k < 8; k++) await sim(.5, { walkTo: b });
    await sim(.6);
    const got = await button(), p = await h.player(), d = Math.hypot(p[0] - b[0], p[2] - b[1]);
    if (got && new RegExp(label).test(got)) ok++; else misses.push(`from ${Math.round(a * 180 / Math.PI)}°: stopped ${d.toFixed(1)} m from the marker, button ${got ? `"${got}"` : 'none'}`);
  }
  if (!tried) { h.check(`${name}: some side of the marker is walkable`, false); return; }
  h.check(`${name}: walking at the goal marker shows "${label}" from every side (${ok} of ${tried})`, ok === tried, misses.join('; '), ok >= tried / 2 ? 'warn' : 'fail', 'world');
  await h.shot(name);
};

// the Gate: satchel taken, one note in it, goal "Take your notes to the gate"
await h.fresh('&title=0&beat=land'); await card('OK');
await h.pose(2.0, 54.6); await h.act('satchel'); await card('Got it');
await h.pose(-4.5, 52.2); await h.act('Take'); await sim(.5);
// the arrow leads round the notes until each has been read (on screen a moment), then to the Gate
for (const [x, z] of [[-2.4, 50.4], [4.6, 50.8], [5.4, 53.4]]) { await h.pose(x, z); await sim(1.6); }
await probe('gate', 'Gate');
// the relay: gate open, goal "Call Mira from the relay"
await h.seedSave('gate-open', ['wake-skiff', 'blossom-gate']); await h.open(''); await h.press(page.locator('.title-screen button', { hasText: 'Continue' })); await page.waitForTimeout(3500);
await probe('relay', 'relay');
// the Word Loom: landed, goal "Find out why the loom is jammed"
await h.open('&title=0&beat=to-loom'); await page.waitForTimeout(2500);
await h.pose(-3.6, 55.2); await h.act('Board'); await card('Onward'); await page.waitForTimeout(2500);
await probe('loom', 'Word Loom');

// body-wide strips (one step across, longer than 1.2 m): the camera pins in them and a push wedges
// (run 17, and Claude stuck four minutes in one by Mira's tree). Scanned on a 0.2 m grid.
const strips = async (name, extra, box) => {
  await h.open(extra); await page.waitForTimeout(2000);
  const r = await page.evaluate(([x0, x1, z0, z1]) => {
    const c = .2, W = Math.round((x1 - x0) / c), H = Math.round((z1 - z0) / c), ok = new Uint8Array(W * H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) ok[i + j * W] = window.__arcade.walkable(x0 + i * c, z0 + j * c) ? 1 : 0;
    const run = (i, j, di, dj) => { let n = 0; for (let k = 1; k < 40; k++) { const a = i + di * k, b = j + dj * k; if (a < 0 || b < 0 || a >= W || b >= H || !ok[a + b * W]) break; n++; } return n; };
    const nar = new Uint8Array(W * H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (ok[i + j * W]) { const wx = (1 + run(i, j, 1, 0) + run(i, j, -1, 0)) * c, wz = (1 + run(i, j, 0, 1) + run(i, j, 0, -1)) * c; if (Math.min(wx, wz) <= .6 && Math.max(wx, wz) > .6) nar[i + j * W] = 1; }
    const seen = new Uint8Array(W * H), out = [];
    for (let s0 = 0; s0 < W * H; s0++) if (nar[s0] && !seen[s0]) { const st = [s0], cells = []; seen[s0] = 1; while (st.length) { const q = st.pop(); cells.push(q); const i = q % W, j = Math.floor(q / W); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue; const n = ii + jj * W; if (nar[n] && !seen[n]) { seen[n] = 1; st.push(n); } } }
      if (cells.length > 6) out.push(`${cells.length * c * 1}m near (${(x0 + (cells[0] % W) * c).toFixed(1)}, ${(z0 + Math.floor(cells[0] / W) * c).toFixed(1)})`); }
    return out;
  }, box);
  h.check(`${name}: no body-wide strips to get wedged in`, !r.length, r.join('; '), 'fail', 'world');
};
// townsfolk never cut the map: every spot Zip can walk to with nobody about is still reachable with
// the townsfolk standing where they stand (run 19: two neighbours chatting in the one gap of a
// walkway; the player only got past with "Return to arrival"). Flood-filled on a 0.2 m grid from Zip.
const reach = async (extra, box) => {
  await h.open(extra); await page.waitForTimeout(2000);
  return page.evaluate(([x0, x1, z0, z1]) => {
    const c = .2, W = Math.round((x1 - x0) / c), H = Math.round((z1 - z0) / c), ok = new Uint8Array(W * H), got = new Uint8Array(W * H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) ok[i + j * W] = window.__arcade.walkable(x0 + i * c, z0 + j * c) ? 1 : 0;
    const p = window.__arcade.snapshot().position, s = Math.round((p[0] - x0) / c) + Math.round((p[2] - z0) / c) * W, st = [s]; got[s] = 1;
    while (st.length) { const q = st.pop(), i = q % W, j = Math.floor(q / W); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue; const n = ii + jj * W; if (ok[n] && !got[n]) { got[n] = 1; st.push(n); } } }
    const folk = []; window.__vlDebug.scene.traverse(o => { if (o.name === 'Townsperson' || o.name === 'Mira') { const v = o.getWorldPosition(o.position.clone()); folk.push([v.x, v.z]); } });
    return { got: Array.from(got), ok: Array.from(ok), W, folk };
  }, box);
};
{
  const box = [-9, 9, -12, 10], none = await reach('&title=0&beat=skiff&life=0', box), all = await reach('&title=0&beat=skiff', box);
  const lost = [];
  for (let k = 0; k < none.got.length; k++) if (none.got[k] && !all.got[k]) {
    const x = box[0] + (k % none.W) * .2, z = box[2] + Math.floor(k / none.W) * .2;
    if (all.folk.every(([fx, fz]) => Math.hypot(fx - x, fz - z) > 1.0)) lost.push([x, z]);
  }
  const at = lost.length ? `${lost.length} spots, e.g. (${lost[0][0].toFixed(1)}, ${lost[0][1].toFixed(1)}); townsfolk at ${all.folk.map(f => f.map(v => v.toFixed(1)).join(',')).join(' · ')}` : `${all.folk.length} townsfolk`;
  h.check('town: the townsfolk never cut off a part of the map', !lost.length, at, 'fail', 'world');
  // and nobody stands in the way: for each townsperson, the walk between the two sides of where they
  // stand (1.4 m either way along the ground they stand on) is no more than 4 m longer with them there.
  // Run 19's pair didn't cut the map off; they made a walkway a dead end.
  const W = none.W, Hh = none.ok.length / W, bfs = (ok, a, b) => { const d = new Int32Array(ok.length).fill(-1), q = [a]; if (!ok[a] || !ok[b]) return -2; d[a] = 0; for (let h = 0; h < q.length; h++) { const c = q[h]; if (c === b) return d[c] * .2; const i = c % W, j = Math.floor(c / W); for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + x, jj = j + y; if (ii < 0 || jj < 0 || ii >= W || jj >= Hh) continue; const n = ii + jj * W; if (ok[n] && d[n] < 0) { d[n] = d[c] + 1; q.push(n); } } } return -1; };
  // the nearest spot one can stand on with nobody about (within 0.6 m), so a side just past a wall still counts
  const cell = (x, z) => { const i0 = Math.round((x - box[0]) / .2), j0 = Math.round((z - box[2]) / .2); let best = -1, bd = 1e9; for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) { const i = i0 + di, j = j0 + dj; if (i < 0 || j < 0 || i >= W || j >= Hh) continue; const n = i + j * W; if (none.ok[n] && di * di + dj * dj < bd) { bd = di * di + dj * dj; best = n; } } return best < 0 ? i0 + j0 * W : best; }, blocked = [];
  // each side: the first spot 1.4–3 m out that one can stand on with everyone there (so a neighbour
  // standing beside them doesn't count as the way being shut)
  const side = (fx, fz, ax, az, sg) => { for (let d = 1.4; d <= 3.01; d += .2) { const c = cell(fx + sg * ax * d, fz + sg * az * d); if (all.ok[c] && none.ok[c]) return [c, d]; } return null; };
  for (const [fx, fz] of all.folk) for (const [ax, az] of [[1, 0], [0, 1]]) {
    const A = side(fx, fz, ax, az, -1), B = side(fx, fz, ax, az, 1); if (!A || !B) continue;
    const span = A[1] + B[1], free = bfs(none.ok, A[0], B[0]);
    if (free < 0 || free > span * 2 + 1) continue;   // not a way through here with nobody about
    const busy = bfs(all.ok, A[0], B[0]);
    if (busy < 0 || busy > free + 4) blocked.push(`(${fx.toFixed(1)}, ${fz.toFixed(1)}): ${free.toFixed(1)} m → ${busy < 0 ? 'no way' : busy.toFixed(1) + ' m'}`);
  }
  h.check('town: no townsperson stands in the way', !blocked.length, blocked.join('; ') || `${all.folk.length} checked`, 'fail', 'world');
}
await strips('town', '&title=0&beat=skiff', [-9, 9, -12, 10]);
await strips('Blossom Isle', '&title=0&beat=gate-open', [-10, 10, 38, 58]);
await h.finish();
