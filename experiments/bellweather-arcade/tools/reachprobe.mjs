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
await probe('gate', 'Gate');
// the relay: gate open, goal "Call Mira from the relay"
await h.seedSave('gate-open', ['wake-skiff', 'blossom-gate']); await h.open(''); await h.press(page.locator('.title-screen button', { hasText: 'Continue' })); await page.waitForTimeout(3500);
await probe('relay', 'relay');
// the Word Loom: landed, goal "Find out why the loom is jammed"
await h.open('&title=0&beat=to-loom'); await page.waitForTimeout(2500);
await h.pose(-3.6, 55.2); await h.act('Board'); await card('Onward'); await page.waitForTimeout(2500);
await probe('loom', 'Word Loom');
await h.finish();
