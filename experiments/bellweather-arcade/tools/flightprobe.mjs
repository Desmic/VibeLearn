// Flight probe: the skiff flight between islands, flown four ways, measured. Blind testers flew
// it for six runs and said the same things: "Distance keeps going up. How does this thing steer?",
// "Landed… kind of by accident. Didn't even know there were wind rings" (run 23), and the goal
// arrow "never actually points me at the goal" in the air. Each way is a kind of player:
//   - hands off: no input at all (the wind should still carry the skiff in, and through some rings);
//   - full speed: forward held the whole way;
//   - in bursts: what testers did, long pushes left, right and forward with no correction between;
//   - arrow: taps "Turn toward the goal" every few seconds and otherwise holds forward;
//   - steered: a player who steers for each ring (left or right till lined up).
// Records rings flown (of 7), times spotted, seconds to land. Game-agnostic only in shape: it reads
// the flight's own state (window.__vlFlight.state).
//   bash tools/build.sh && node tools/flightprobe.mjs [--out /tmp/flightprobe]
import { harness } from './harness.mjs';
const h = await harness({ title: 'Flight probe', outDefault: '/tmp/flightprobe', tool: 'flightprobe', lane: 'feel' });
const { page, check } = h;
const sim = (s, keys = []) => page.evaluate(([s, k]) => window.__arcade.simulate(s, { keys: k }), [s, keys]);
const state = () => page.evaluate(() => window.__vlFlight?.state ?? null);
const flying = () => page.evaluate(() => !!window.__vlFlight?.active);

const policies = {
  'hands off': () => [],
  'full speed': () => ['KeyW'],
  'in bursts': t => { const k = Math.floor(t / 2.5) % 4; return [['KeyW'], ['KeyW', 'KeyD'], ['KeyW'], ['KeyA']][k]; },
  'arrow': () => ['KeyW'],
  'steered': () => [],   // (chosen each step from where the next ring is)
};
const results = {};
for (const [name, keys] of Object.entries(policies)) {
  h.state.current = name;
  await h.fresh('&title=0&beat=isle');
  if (!(await h.waitFor?.(flying, 30000) ?? true)) { for (let i = 0; i < 60 && !(await flying()); i++) await sim(.5); }
  let t = 0; const dt = .25;
  while (t < 120 && (await flying())) {
    if (name === 'arrow' && Math.round(t / dt) % 16 === 0) await page.evaluate(() => document.querySelector('.beacon-edge:not([hidden])')?.click());
    let k = keys(t);
    if (name === 'steered') { const s = await state(); const d = (s?.ringSide ?? 0) - (s?.side ?? 0); k = Math.abs(d) < .6 ? [] : d > 0 ? ['KeyD'] : ['KeyA']; }
    await sim(dt, k); t += dt;
  }
  const s = await state();
  results[name] = { rings: s?.rings ?? 0, total: s?.total ?? 7, spotted: s?.spotted ?? 0, secs: t, landed: !(await flying()) };
  await h.shot(name.replace(/ /g, '-'));
}
const fmt = r => `${r.rings} of ${r.total} rings, spotted ${r.spotted}×, ${r.landed ? `landed in ${Math.round(r.secs)} s` : 'did not land in 120 s'}`;
for (const [name, r] of Object.entries(results)) check(`${name}: lands`, r.landed, fmt(r), 'fail', 'feel');
// the rings sit off to either side of the lane: hands off flies the ones on the line, not all (a
// ring is something to steer for); a player who steers for them gets them all
check('hands off flies the rings on the lane line, not the ones to the side (2 or 3)', results['hands off'].rings >= 2 && results['hands off'].rings <= 3, fmt(results['hands off']), 'warn', 'feel');
check('steering for each ring catches every one', results['steered'].rings === results['steered'].total, fmt(results['steered']), 'fail', 'feel');
check('flown in bursts, it still lands about as soon as any other way (no loops off the lane; was 77 s)', results['in bursts'].secs < 30, fmt(results['in bursts']), 'fail', 'feel');
check('flown in bursts (as testers fly), most rings are still caught', results['in bursts'].rings >= 4, fmt(results['in bursts']), 'warn', 'feel');
// (with the rings on a lane ahead, the goal arrow seldom shows in the air: the ring is on screen; when
// it does, a tap slides the skiff across to that ring)
check('tapping the goal arrow when it shows in the air never loses rings (at least as many as hands off)', results['arrow'].rings >= results['hands off'].rings, fmt(results['arrow']), 'warn', 'feel');
await h.finish();
