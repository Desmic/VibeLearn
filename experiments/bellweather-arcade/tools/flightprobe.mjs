// Flight probe: the skiff flight between islands, flown four ways, measured. Blind testers flew
// it for six runs and said the same things: "Distance keeps going up. How does this thing steer?",
// "Landed… kind of by accident. Didn't even know there were wind rings" (run 23), and the goal
// arrow "never actually points me at the goal" in the air. Each way is a kind of player:
//   - hands off: no input at all (the wind should still carry the skiff in, and through some rings);
//   - full speed: forward held the whole way;
//   - in bursts: what testers did, long pushes left, right and forward with no correction between;
//   - arrow: taps "Turn toward the goal" every few seconds and otherwise holds forward.
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
};
const results = {};
for (const [name, keys] of Object.entries(policies)) {
  h.state.current = name;
  await h.fresh('&title=0&beat=isle');
  if (!(await h.waitFor?.(flying, 30000) ?? true)) { for (let i = 0; i < 60 && !(await flying()); i++) await sim(.5); }
  let t = 0; const dt = .25;
  while (t < 120 && (await flying())) {
    if (name === 'arrow' && Math.round(t / dt) % 16 === 0) await page.evaluate(() => document.querySelector('.beacon-edge:not([hidden])')?.click());
    await sim(dt, keys(t)); t += dt;
  }
  const s = await state();
  results[name] = { rings: s?.rings ?? 0, total: s?.total ?? 7, spotted: s?.spotted ?? 0, secs: t, landed: !(await flying()) };
  await h.shot(name.replace(/ /g, '-'));
}
const fmt = r => `${r.rings} of ${r.total} rings, spotted ${r.spotted}×, ${r.landed ? `landed in ${Math.round(r.secs)} s` : 'did not land in 120 s'}`;
for (const [name, r] of Object.entries(results)) check(`${name}: lands`, r.landed, fmt(r), 'fail', 'feel');
check('hands off still flies through some rings (the wind carries the lane)', results['hands off'].rings >= 3, fmt(results['hands off']), 'warn', 'feel');
check('flown in bursts (as testers fly), most rings are still caught', results['in bursts'].rings >= 4, fmt(results['in bursts']), 'warn', 'feel');
check('tapping the goal arrow in the air lines the skiff up: most rings caught', results['arrow'].rings >= 5, fmt(results['arrow']), 'warn', 'feel');
await h.finish();
