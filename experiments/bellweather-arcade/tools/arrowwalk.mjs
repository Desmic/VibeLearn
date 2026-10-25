// Arrow walk: the way blind testers get about on foot, played back and measured. They tap "Turn
// toward the goal", then hold the stick forward for seconds at a time (run 26: 3-4 s pushes, 10 m
// past the turn, "I keep ending up back at the entrance"). From several spots, until the goal is
// reached or ten pushes are spent: tap the arrow when it shows, then hold forward 4 s. Records pushes,
// taps and metres walked to reach Mira. `--compare 1` also plays it with the walk assist off
// (`&steer=0`), for a before/after.
//   bash tools/build.sh && node tools/arrowwalk.mjs --input touch [--compare 1]
import { harness, arg } from './harness.mjs';
const h = await harness({ title: 'Arrow walk', outDefault: '/tmp/arrowwalk', tool: 'arrowwalk', lane: 'feel' });
const { page, check } = h;
const MIRA = [5.3, -10.95], REACH = 2.6;
const spots = [['arrival', 1, 7, 0], ['east side', 6.0, -6.8, 1.6], ['west court', -5, -6, -1.2], ['south lawn', 6, 2, 3.1], ['the tree', 6.2, -6.6, 2.4]];
const play = async extra => {
  const out = {};
  for (const [name, x, z, yaw] of spots) {
    h.state.current = name + (extra ? ' (assist off)' : '');
    await h.fresh('&title=0' + extra); await h.skipOpening(); await page.waitForTimeout(600);
    // the nearest spot a player can stand on (spots are rough; the town's fillers move)
    const [sx, sz] = await page.evaluate(([x, z]) => { for (let r = 0; r < 3; r += .1) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r; if (window.__arcade.walkable(px, pz)) return [px, pz]; } return [x, z]; }, [x, z]);
    await h.pose(sx, sz, yaw);
    let pushes = 0, taps = 0, walked = 0, at = await page.evaluate(() => window.__arcade.snapshot().position);
    const near = p => Math.hypot(p[0] - MIRA[0], p[2] - MIRA[1]) < REACH;
    while (pushes < 10 && !near(at)) {
      // the arrow pulses, so it never holds still for a tap: clicked as the page sees a tap
      if (await page.evaluate(() => { const b = document.querySelector('.beacon-edge:not([hidden])'); if (!b) return false; b.click(); return true; })) { taps++; await page.evaluate(() => window.__arcade.simulate(.6)); }
      await h.stick([0, -1], 4); pushes++;
      const p = await page.evaluate(() => window.__arcade.snapshot().position); walked += Math.hypot(p[0] - at[0], p[2] - at[2]); at = p;
      if (await page.evaluate(() => window.__vlStory?.debug.beat !== 'meet')) break;   // talking to Mira already
    }
    const reached = near(at) || await page.evaluate(() => window.__vlStory?.debug.beat !== 'meet');
    out[name] = { reached, pushes, taps, walked: +walked.toFixed(1) };
    await h.shot(name.replace(/ /g, '-'));
  }
  return out;
};
const on = await play('');
const off = arg('compare', '0') === '1' ? await play('&steer=0') : null;
h.state.current = 'report';
for (const [name, r] of Object.entries(on)) {
  const o = off?.[name], was = o ? ` (assist off: ${o.reached ? `${o.pushes} pushes, ${o.walked} m` : `not reached in ${o.pushes} pushes, ${o.walked} m`})` : '';
  check(`${name}: arrow and forward reach Mira`, r.reached, `${r.reached ? `${r.pushes} pushes, ${r.taps} taps, ${r.walked} m` : `not reached in ${r.pushes} pushes, ${r.walked} m`}${was}`, 'warn', 'feel');
}
const n = Object.values(on).filter(r => r.reached).length;
check('most spots reach the goal by arrow and forward alone', n >= spots.length - 1, `${n} of ${spots.length}${off ? `; assist off: ${Object.values(off).filter(r => r.reached).length} of ${spots.length}` : ''}`, 'fail', 'feel');
await h.finish();
