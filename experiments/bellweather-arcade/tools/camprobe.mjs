// Camera probe: the turns the camera makes by itself around goals, measured (runs 15 and 16 named
// the camera as the reason they stopped). Three cases, each from a fixed spot on the Blossom Isle:
//   A. a new goal that is already on screen: the camera should not turn (it did: "glances");
//   B. a new goal behind the player: one glance toward it (wanted);
//   C. tap the goal arrow, then walk with the stick: the walk should head at the goal and the
//      view should stay on it ("its turn doesn't stay put once you move");
//   D. back from a dialogue (Mira's first line), the camera is clear of walls behind Zip;
//   E. with the goal behind a wall, the arrow faces the way round it;
//   F. how often the camera is pressed into Zip anywhere in town.
//   bash tools/build.sh && node tools/camprobe.mjs --input touch [--out /tmp/camprobe]
import { harness } from './harness.mjs';
const h = await harness({ title: 'Camera probe', outDefault: '/tmp/camprobe', tool: 'camprobe', lane: 'feel' });
const { page } = h;
const sim = s => page.evaluate(s => window.__arcade.simulate(s), s);
const snap = () => page.evaluate(() => window.__arcade.snapshot());
const deg = r => Math.round(r * 180 / Math.PI);
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
// angle between where the camera looks (flat) and the goal
const offAim = async b => { const s = await snap(), p = s.position, c = s.camera; return Math.abs(wrap(Math.atan2(p[0] - c[0], p[2] - c[2]) - Math.atan2(b[0] - p[0], b[1] - p[2]))); };
const goal = (text, b) => page.evaluate(([t, b]) => { window.__vlGuide.setGoal(t); window.__vlGuide.setBeacon(b ? { x: b[0], y: 0, z: b[1] } : null); }, [text, b]);
const glance = async () => (await snap()).camTurn.glance;
await h.open('&title=0&beat=gate-open'); await page.waitForTimeout(2500); await sim(2);
// the Blossom Isle with the gate open: its one goal (the relay) is set once and left alone
const P = [0, 50.5];
const at = (yaw, d, side = 0) => [P[0] - Math.sin(yaw + side) * d, P[1] - Math.cos(yaw + side) * d];

// A: on screen, 9 m ahead, a little off centre
await h.pose(P[0], P[1], 0); await sim(1); await goal(null, null); await sim(.5);
let g0 = await glance(); await goal('Probe goal A', at(0, 7, .25)); await sim(2.5);
const a = await glance() - g0;
h.check('A. a new goal already on screen: the camera holds still', a < .1, `turned ${deg(a)}°`, 'fail', 'feel');
// B: behind
await h.pose(P[0], P[1], 0); await sim(1); await goal(null, null); await sim(.5);
g0 = await glance(); await goal('Probe goal B', at(0, 6, Math.PI)); await sim(2.5);
const b = await glance() - g0;
h.check('B. a new goal behind the player: one glance toward it', b > 1.5, `turned ${deg(b)}°`, 'fail', 'feel');
// C: arrow, then walk forward for 3 s
await h.pose(P[0], P[1], 0); await sim(1); await goal(null, null); await sim(.5);
const B = at(0, 7, -Math.PI / 2); await goal('Probe goal C', B); await sim(.2);
// let any glance finish, then turn away again so the arrow has work to do
await sim(2.5); await h.pose(P[0], P[1], 0); await sim(1);
await page.waitForTimeout(800); const before = await offAim(B);
await h.press(page.locator('.beacon-edge')); await sim(1.6);
const afterTap = await offAim(B);
const t0 = (await snap()).camTurn, p0 = (await snap()).position; await h.stick([0, -1], 1.5);
const t1 = (await snap()).camTurn, why = Object.keys(t1).map(k => `${k} ${deg(t1[k] - t0[k])}°`).join(', ');
const p1 = (await snap()).position, walked = Math.atan2(p1[0] - p0[0], p1[2] - p0[2]), toGoal = Math.atan2(B[0] - p0[0], B[1] - p0[2]);
const walkErr = Math.abs(wrap(walked - toGoal)), s1 = await snap(), view = Math.atan2(s1.position[0] - s1.camera[0], s1.position[2] - s1.camera[2]), afterWalk = Math.abs(wrap(view - toGoal));
h.check('C. the goal arrow turns the view onto the goal', afterTap < .25, `${deg(before)}° off before, ${deg(afterTap)}° after the tap`, 'fail', 'feel');
h.check('C. pushing the stick forward then walks at the goal', walkErr < .3, `walk ${deg(walkErr)}° off the goal`, 'fail', 'feel');
h.check('C. ...and the view stays where the arrow put it while walking', afterWalk < .35, `${deg(afterWalk)}° off after 1.5 s of walking (turns by cause: ${why})`, 'fail', 'feel');
await h.shot('c-end');
// D: back from a dialogue: Mira's first line, then the follow camera (it came back 0.9 m from Zip,
// pressed into the planter behind him, with Zip faded to a ghost)
await h.open('&title=0'); await h.skipOpening();
await h.pose(4.4, -9.4); await h.act('Talk'); await page.locator('.story-card.bubble').waitFor({ timeout: 15000 });
await h.card('Next'); await sim(1.5);
const sd = await snap(), back = Math.hypot(sd.camera[0] - sd.position[0], sd.camera[2] - sd.position[2]);
h.check('D. back from a dialogue, the camera is not pressed into Zip (over 2 m back, Zip fully drawn)', back > 2 && sd.zipFade > .95, `${back.toFixed(1)} m back, Zip drawn at ${Math.round(sd.zipFade * 100)}%`, 'fail', 'feel');
await h.shot('d-after-dialogue');
// E: the goal behind a wall. Run 17: "Turn toward the goal pointed at a glass wall". From the
// conservatory's west side, Mira is behind it: the arrow should face the way round, so pushing the
// stick forward after the tap makes real progress instead of pressing into the wall.
await h.open('&title=0'); await h.skipOpening(); await sim(1);
const M = await page.evaluate(() => { const b = window.__vlGuide.beaconAt; return [b.x, b.z]; });
await h.pose(-8.0, -1.3, Math.PI / 2); await sim(1); await page.waitForTimeout(600);
const e0 = (await snap()).position;
await h.press(page.locator('.beacon-edge')); await sim(1.6);
await h.stick([0, -1], 2.5);
const e1 = (await snap()).position, walkedE = Math.hypot(e1[0] - e0[0], e1[2] - e0[2]), closer = Math.hypot(M[0] - e0[0], M[1] - e0[2]) - Math.hypot(M[0] - e1[0], M[1] - e1[2]);
h.check('E. with the goal behind a wall, the arrow then the stick walk on round it, getting over 5.5 m closer in 2.5 s (a straight aim slid along the wall: 4.7 m)', walkedE > 4 && closer > 5.5, `walked ${walkedE.toFixed(1)} m, ${closer.toFixed(1)} m closer to the goal`, 'fail', 'feel');
await h.shot('e-after-arrow-walk');
// G: tap-to-walk on the raised Loom Isle: the tap met a ground plane five metres below the isle and
// sent Zip far off ("tap-to-walk sent me to odd places", run 17). Tap the ground ahead; Zip should end
// where the finger met the ground.
await h.open('&title=0&beat=loom'); await page.waitForTimeout(3000); await sim(1);
const tapAt = { x: 196, y: 560 };
const hit = await page.evaluate(([sx, sy]) => { const cam = window.__vlDebug.camera, V = cam.position.constructor, gy = window.__arcade.snapshot().position[1];
  const p = new V((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1, .5).unproject(cam), d = p.sub(cam.position).normalize(), t = (gy - cam.position.y) / d.y;
  return [cam.position.x + d.x * t, cam.position.z + d.z * t]; }, [tapAt.x, tapAt.y]);
await page.touchscreen.tap(tapAt.x, tapAt.y); await page.waitForTimeout(300); for (let i = 0; i < 8; i++) await sim(.5);
const g1 = (await snap()).position, off = Math.hypot(g1[0] - hit[0], g1[2] - hit[1]);
h.check('G. on a raised isle, a tap on the ground walks Zip to where the finger met it (within 1 m)', off < 1, `ended ${off.toFixed(1)} m from the tapped spot`, 'fail', 'feel');
// F: how often the camera ends up pressed into Zip (him faded, "a dithered mess", run 17): every
// walkable spot in town on a 1.5 m grid, the camera at eight headings, settled. Was 10.8%.
await h.open('&title=0&beat=skiff'); await page.waitForTimeout(2000);
const fade = await page.evaluate(() => { const A = window.__arcade; let n = 0, f = 0;
  for (let x = -8.5; x <= 8.5; x += 1.5) for (let z = -11.5; z <= 9.5; z += 1.5) { if (!A.walkable(x, z)) continue;
    for (let k = 0; k < 8; k++) { const y = k / 8 * Math.PI * 2; A.pose(x, z, y, .2, 6, y); A.simulate(.8); n++; if (A.snapshot().zipFade < .95) f++; } }
  return { n, f }; });
const pct = 100 * fade.f / fade.n;
h.check('F. the camera seldom ends up pressed into Zip in town (under 7% of spots and views; was 10.8%)', pct < 7, `${fade.f} of ${fade.n} (${pct.toFixed(1)}%)`, 'fail', 'feel');
await h.finish();
