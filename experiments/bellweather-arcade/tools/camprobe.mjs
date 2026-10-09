// Camera probe: the turns the camera makes by itself around goals, measured (runs 15 and 16 named
// the camera as the reason they stopped). Three cases, each from a fixed spot on the Blossom Isle:
//   A. a new goal that is already on screen: the camera should not turn (it did: "glances");
//   B. a new goal behind the player: one glance toward it (wanted);
//   C. tap the goal arrow, then walk with the stick: the walk should head at the goal and the
//      view should stay on it ("its turn doesn't stay put once you move");
//   D. back from a dialogue (Mira's first line), the camera is clear of walls behind Zip.
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
await h.finish();
