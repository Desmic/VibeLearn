// The utterance test area, played: walks to each sign and thing and absorbs its word (Echo,
// aiming the camera at it), says wrong and right phrases through the engine tray (data-action
// tags), checks the outcome the kit decided is what the world shows (a working bridge can be
// walked across; the doorway lights), and takes a contact sheet.
//   bash tools/build.sh && node tools/utterlab.mjs [--input touch] [--out /tmp/lab]
import { harness } from './harness.mjs';
const h = await harness({ title: 'Utterance lab', outDefault: '/tmp/lab', tool: 'utterlab', lane: 'flow' });
const { page } = h;
const sim = s => page.evaluate(s => window.__arcade.simulate(s), s);
await h.open('&lab=utter'); await page.waitForTimeout(1500);
await h.shot('start');
const lab = () => page.evaluate(() => ({ sites: window.__vlUtterLab.sites.map(s => ({ id: s.s.id, from: [s.from.x, s.from.z], solved: s.solved })), sources: window.__vlUtterLab.sources, carried: window.__vlUtterLab.echo.carried }));
/** walk to a word's sign or thing, turn until its Absorb prompt shows, take it */
const absorb = async src => {
  const r = await h.walkTo(src.at, { near: 1.3 });
  for (const yaw of [0, .8, -.8, 1.6, -1.6, 2.4, -2.4, 3.14]) {
    const p = await h.player(); await h.pose(p[0], p[2], Math.atan2(-(src.at[0] - p[0]), -(src.at[1] - p[2])) + yaw * .25);
    await sim(.3); if (await page.locator('.context-act', { hasText: `“${src.word}”` }).isVisible()) break;
  }
  await h.act(`“${src.word}”`).catch(() => {}); await sim(1.5);
  return (await lab()).carried.includes(src.word) || console.log('  (could not absorb', src.word, JSON.stringify(r), ')');
};
const speakSeq = async (site, words, name) => {
  await h.walkTo(site.from, { near: .6 });
  await h.act('Speak', 20000);
  for (const w of words) await h.press(page.locator(`.wr-chip[data-w="${w}"]`));
  await page.waitForTimeout(400); await h.shot(name + '-ring');
  await h.press(page.locator('[data-action="speak"]'));
  for (let i = 0; i < 8; i++) { await sim(.4); await page.waitForTimeout(250); }
  await h.shot(name + '-made');
  await h.until(() => page.evaluate(() => !window.__vlUtterLab.busy), 12);
  await sim(3); await h.shot(name + '-after');
  const m = (await page.evaluate(() => window.__vlUtterLog)).at(-1);
  console.log(name, JSON.stringify(m)); return m;
};
const onPlatform = (src, cx) => Math.abs(src.at[0] - cx) < 3.2;
let L = await lab();
for (const src of L.sources.filter(s => onPlatform(s, 60))) await absorb(src);
L = await lab(); h.check('words come from the world: every word on the first platform absorbed', L.sources.filter(s => onPlatform(s, 60)).every(s => L.carried.includes(s.word)), L.carried.join(', '));
const [A, B, C] = L.sites;
h.check('"tiny bridge" comes up short', (await speakSeq(A, ['tiny', 'bridge'], 'a-tiny'))?.reason === 'too-short');
h.check('"long" alone: the engine finishes the phrase (a noodle) and it gives way', (m => m?.guessed && m.thing === 'noodle' && m.reason === 'too-weak')(await speakSeq(A, ['long'], 'a-noodle')));
h.check('"rope bridge" makes a bridge of rope, and it crosses', (m => m?.works && m.thing === 'bridge' && m.material === 'rope')(await speakSeq(A, ['rope', 'bridge'], 'a-rope-bridge')));
const w1 = await h.walkTo([69.4, -40], { near: 1 }); h.check('the made bridge can be walked across', w1.ok, JSON.stringify(w1), 'fail', 'world');
for (const src of L.sources.filter(s => onPlatform(s, 69.4))) await absorb(src);
h.check('"bridge long": "long" comes too late (said after the bridge was made)', (await speakSeq(B, ['bridge', 'long'], 'b-late'))?.late?.includes('long'));
h.check('"long paper bridge" gives way', (await speakSeq(B, ['long', 'paper', 'bridge'], 'b-paper'))?.reason === 'too-weak');
h.check('"long jelly bridge" crosses the wide gap', (await speakSeq(B, ['long', 'jelly', 'bridge'], 'b-jelly'))?.works);
const w2 = await h.walkTo([82.4, -40], { near: 1 }); h.check('the jelly bridge can be walked across', w2.ok, JSON.stringify(w2), 'fail', 'world');
for (const src of L.sources.filter(s => onPlatform(s, 82.4))) await absorb(src);
h.check('"tiny lantern" is too dim', (await speakSeq(C, ['tiny', 'lantern'], 'c-tiny'))?.reason === 'too-dim');
h.check('"long lantern" lights the doorway', (await speakSeq(C, ['long', 'lantern'], 'c-long'))?.works);
h.check('the lab says it is done', /lab is done/.test(await h.goal() ?? ''), await h.goal());
await h.until(() => page.evaluate(() => !!document.querySelector('.star-row')), 12);
h.check('a summary banner shows what was done (and what is left to find)', await page.evaluate(() => !!document.querySelector('.star-row')));
await h.shot('end');
await h.finish();
