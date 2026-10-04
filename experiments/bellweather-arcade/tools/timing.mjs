// Scene timing check: plays a scene in game time (fast, without drawing) and
// prints when each line is said, by whom, for how long, and whether the next
// one starts before it ends. Voiced lines use their real clip lengths
// (public/voice/manifest.json), so this is what a player hears.
//   ./build.sh && node tools/timing.mjs [--scene opening|attack|all]
// Flags: OVERLAP (two lines from the same speaker at once, or a line cut off),
// DEAD AIR (more than 2.5 s with nothing said or happening in a cutscene).
import { harness, arg } from './harness.mjs';
const h = await harness({ title: 'Scene timing', outDefault: '/tmp/timing', tool: 'timing', lane: 'timing' });
const { page, check, GAME } = h;
// thinkers whose thoughts are voiced (e.g. a villain heard inside your head); the protagonist's own are silent text
const VOICED = Object.assign({}, ...GAME.stories.map(s => s.thoughtVoices ?? {}));
const scene = arg('scene', 'all');

// record every line the guide shows or speaks, in game time
const instrument = () => page.evaluate(([VOICED, ME]) => {
  const g = window.__vlGuide, v = window.__vlVoice, log = window.__vlTiming = [];
  let gameT = 0; window.__vlTimingClock = dt => { gameT += dt; };
  const wrap = (name, f) => function (...a) {
    const voiced = name === 'think' ? VOICED[a[1]] : null;
    const [who, text] = name === 'say' ? [a[2]?.speaker ?? '(card)', a[0]] : name === 'think' ? [voiced ? voiced + ' (inner)' : ME + ' (thought)', a[0]] : [a[0], a[1]];
    const speaker = name === 'think' ? voiced : who;
    for (const t of [text].flat()) log.push({ t: +gameT.toFixed(2), kind: name, who, text: String(t).replace(/<[^>]+>/g, '').slice(0, 70), dur: speaker ? +(v?.duration(speaker, t) ?? 0).toFixed(2) : 0, beat: window.__vlStory?.debug?.beat, cut: +(window.__vlStory?.debug?.cut ?? -1).toFixed(2) });
    return f.apply(this, a);
  };
  for (const k of ['say', 'bark', 'think']) g[k] = wrap(k, g[k].bind(g));
}, [VOICED, GAME.protagonist]);
const run = async (seconds, until) => {
  for (let s = 0; s < seconds; s += .25) {
    await page.evaluate(() => { window.__arcade.simulate(.25); window.__vlTimingClock(.25); });
    if (until && await page.evaluate(until)) return true;
  }
  return false;
};
const report = (name) => page.evaluate(() => window.__vlTiming).then(log => {
  console.log(`\n── ${name} ──`);
  let last = null, issues = 0;
  for (const e of log) {
    const end = e.t + (e.dur || 0);
    console.log(`${e.t.toFixed(2).padStart(6)}s  ${e.cut >= 0 ? 'c' + e.cut.toFixed(1).padStart(5) : '       '}  ${e.who.padEnd(16)} ${e.dur ? (e.dur.toFixed(1) + 's').padStart(5) : '  —  '}  ${e.text}`);
    if (last && last.dur && e.who === last.who && e.t < last.t + last.dur - .1) { console.log(`        OVERLAP: cuts ${last.who}'s line short by ${(last.t + last.dur - e.t).toFixed(1)} s`); issues++; }
    if (last && e.kind !== 'say' && e.t - Math.max(last.t + (last.dur || 2), last.t) > 2.5 && e.cut >= 0) { console.log(`        DEAD AIR: ${(e.t - last.t - (last.dur || 2)).toFixed(1)} s`); }
    last = { ...e, end };
  }
  return issues;
});

await h.segment('opening', async () => {
  if (scene !== 'all' && scene !== 'opening') return;
  await h.fresh('&title=0'); await instrument();
  await run(15, () => window.__vlStory.debug.opening < 0);
  check('opening hands over to play', await page.evaluate(() => window.__vlStory.debug.opening < 0));
  await report('Cold open');
});
await h.segment('attack', async () => {
  if (scene !== 'all' && scene !== 'attack') return;
  await h.fresh('&title=0&beat=attack'); await page.waitForTimeout(1500); await instrument();
  const ok = await run(80, () => window.__vlStory.debug.beat === 'spark');
  const filmT = await page.evaluate(() => window.__vlTiming.length && window.__vlTiming.at(-1).t);
  check('the attack film ends in play', ok);
  await run(14);   // the thoughts that carry into play
  const issues = await report('The attack');
  check('no line cuts off its own speaker', issues === 0, `${issues} overlaps`);
  console.log(`(last line at ${filmT}s)`);
});
await h.finish();
