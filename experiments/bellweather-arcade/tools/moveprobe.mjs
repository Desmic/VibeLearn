// Move probe: how walking feels under a thumb, measured. Blind play-testers kept reporting the
// same things (5 Oct): sidestepping curves and swings the camera; pushing along an edge or rail
// sticks; the camera presses into the player's head. Each probe runs from where the player stands
// (pick the spot with --start, e.g. '&lab=utter-b'), through the game's own stick and camera:
//   - strafe: hold the stick right; the path should hold the line it started on (drift in degrees)
//     and the camera shouldn't turn by itself;
//   - edge slide: push diagonally into an edge; the player should slide along it, not stop dead
//     (metres moved after first touching the edge);
//   - close camera: drag the camera round in a tight spot; the player's body must never fill the
//     screen (frames with the camera inside 1.2 m of the head while the body is fully drawn).
// Game-agnostic: needs the test contract's __arcade.snapshot (position, camera) and the stick.
//   node tools/moveprobe.mjs --input touch [--start '&lab=utter-b'] [--out /tmp/moveprobe]
import { harness, arg } from './harness.mjs';

const h = await harness({ title: 'Move probe', outDefault: '/tmp/moveprobe', tool: 'moveprobe', lane: 'world' });
const { page, check } = h;
await h.fresh(arg('start', '&title=0'));   // past the title screen by default (with none, nothing moved: the stick was on the title)
const snap = () => page.evaluate(() => { const s = window.__arcade.snapshot(); return { p: s.position, c: s.camera, fade: s.zipFade ?? null }; });
const camYaw = s => Math.atan2(s.c[0] - s.p[0], s.c[2] - s.p[2]);
const deg = r => Math.round(r * 180 / Math.PI);
const wrap = a => ((a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

// let the arrival settle (opening lines, camera glance)
await page.evaluate(() => window.__arcade.simulate(6)); await page.waitForTimeout(300);

// 1. strafe
h.state.current = 'strafe';
let a = await snap(); const y0 = camYaw(a), right = [Math.cos(y0), -Math.sin(y0)];
await h.stick([1, 0], 1.2);
let b = await snap(); const d = [b.p[0] - a.p[0], b.p[2] - a.p[2]], len = Math.hypot(...d);
const drift = len > .3 ? Math.acos(Math.max(-1, Math.min(1, (d[0] * right[0] + d[1] * right[1]) / len))) : NaN, turn = wrap(camYaw(b) - y0);
check('a sidestep holds its line (drift under 10°)', drift < 10 * Math.PI / 180, `moved ${len.toFixed(2)} m, drifted ${deg(drift)}° off the line it started on`, 'warn');
check('a sidestep doesn\'t turn the camera by itself (under 8°)', Math.abs(turn) < 8 * Math.PI / 180, `camera turned ${deg(turn)}°`, 'warn');
await h.shot('strafe');

// 2. edge slide: walk straight ahead until something stops you, then push at an angle to it
//    (half forward, half sideways): a glancing push should slide along, not stop dead
h.state.current = 'edge';
let prev = await snap(), touched = null, after = 0;
for (let i = 0; i < 14 && !touched; i++) {
  await h.stick([0, -1], .35);
  const s = await snap(); if (Math.hypot(s.p[0] - prev.p[0], s.p[2] - prev.p[2]) < .35 * 3.15 * .4) touched = s; prev = s;
}
for (let i = 0; touched && i < 8; i++) {
  await h.stick([.71, -.71], .35);
  const s = await snap(); after += Math.hypot(s.p[0] - prev.p[0], s.p[2] - prev.p[2]); prev = s;
}
check('a glancing push slides along an edge (on a curved rim it slides until the push meets the rim head-on)', !!touched && after > .5, touched ? `${after.toFixed(2)} m along the edge in ${(.35 * 8).toFixed(1)} s of pushing at 45° to it` : 'never reached an edge (pick a smaller space)', 'warn');
await h.shot('edge');

// 3. close camera: sweep the camera round a tight spot (--close-at x,z; default: where the edge test ended)
h.state.current = 'close';
const look = async dx => {   // a finger drag on a phone, the mouse otherwise (as the play server does)
  const vs = page.viewportSize(), x0 = vs.width * .65, y0c = vs.height * .4;
  if (h.INPUT === 'touch') {
    const cdp = await page.context().newCDPSession(page), pt = (x, y) => [{ x, y, id: 3, radiusX: 8, radiusY: 8, force: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0, y0c) });
    for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x0 + dx * i / 6, y0c) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach();
  } else { await page.mouse.move(x0, y0c); await page.mouse.down(); await page.mouse.move(x0 + dx, y0c, { steps: 6 }); await page.mouse.up(); }
};
const spots = arg('close-at', '').split(';').filter(Boolean).map(x => x.split(',').map(Number));
let tooClose = 0, frames = 0; const where = [];
for (const spot of spots.length ? spots : [null]) for (let i = 0; i < 16; i++) {
  if (spot && i === 0) await h.pose(spot[0], spot[1], 0);
  await look(80);
  await page.evaluate(() => window.__arcade.simulate(.4));
  const s = await snap(), head = [s.p[0], s.p[1] + 1.5, s.p[2]], dist = Math.hypot(s.c[0] - head[0], s.c[1] - head[1], s.c[2] - head[2]);
  frames++; if (dist < 1.2 && !(s.fade !== null && s.fade < .6)) { tooClose++; where.push(`${s.p[0].toFixed(1)},${s.p[2].toFixed(1)}`); if (tooClose <= 3) await h.shot('too-close'); }
}
check('the camera never sits inside the player\'s head with the body fully drawn', tooClose === 0, `${tooClose} of ${frames} frames${where.length ? ' at ' + [...new Set(where)].slice(0, 6).join(' · ') : ''}`, 'warn');
await h.shot('close');

h.report.write(h.OUT);
await h.browser.close(); process.exit(0);
