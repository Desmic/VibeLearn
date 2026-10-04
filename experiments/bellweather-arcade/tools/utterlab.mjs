// The utterance test area, played: walks to each place, says wrong and right phrases through the
// engine tray (data-action tags), checks the outcome the kit decided is what the world shows
// (a working bridge can be walked across; a lit doorway), and takes a contact sheet.
//   bash tools/build.sh && node tools/utterlab.mjs [--input touch] [--out /tmp/lab]
import { harness } from './harness.mjs';
const h = await harness({ title: 'Utterance lab', outDefault: '/tmp/lab', tool: 'utterlab', lane: 'flow' });
const { page } = h;
await h.open('&lab=utter'); await page.waitForTimeout(1500);
await h.shot('start');
const speakSeq = async (words, name) => {
  await h.act('Speak', 20000);
  for (const w of words) await h.press(page.locator(`.holo-chip[data-w="${w}"]`));
  await h.press(page.locator('[data-action="speak"]'));
  for (let i = 0; i < 6; i++) { await page.evaluate(() => window.__arcade.simulate(.4)); await page.waitForTimeout(300); }
  await h.shot(name + '-made');
  await page.evaluate(() => window.__arcade.simulate(4)); await page.waitForTimeout(800);
  await h.shot(name + '-after');
  const m = (await page.evaluate(() => window.__vlUtterLog)).at(-1);
  console.log(name, JSON.stringify(m)); return m;
};
const site = i => page.evaluate(i => { const s = window.__vlUtterLab.sites[i].from; return [s.x, s.z]; }, i);
await h.walkTo(await site(0), { near: .8 });
h.check('"tiny bridge" comes up short', (await speakSeq(['tiny', 'bridge'], 'a-tiny'))?.reason === 'too-short');
h.check('"bridge" crosses the first gap', (await speakSeq(['bridge'], 'a-bridge'))?.works);
const w1 = await h.walkTo(await site(1), { near: .8 }); h.check('the made bridge can be walked across', w1.ok, JSON.stringify(w1), 'fail', 'world');
h.check('"bridge long": "long" comes too late (said after the bridge was made)', (await speakSeq(['bridge', 'long'], 'b-late'))?.late?.includes('long'));
h.check('"long jelly bridge" crosses the wide gap', (await speakSeq(['long', 'jelly', 'bridge'], 'b-jelly'))?.works);
const w2 = await h.walkTo(await site(2), { near: .8 }); h.check('the jelly bridge can be walked across', w2.ok, JSON.stringify(w2), 'fail', 'world');
h.check('"tiny lantern" is too dim', (await speakSeq(['tiny', 'lantern'], 'c-tiny'))?.reason === 'too-dim');
h.check('"long lantern" lights the doorway', (await speakSeq(['long', 'lantern'], 'c-long'))?.works);
h.check('the lab says it is done', /lab is done/.test(await h.goal() ?? ''), await h.goal());
await h.shot('end');
await h.finish();
