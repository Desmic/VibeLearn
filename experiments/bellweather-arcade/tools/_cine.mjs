// Look-dev: screenshots of the cold open and the attack film, about every 0.8 s of game time.
import { harness } from './harness.mjs';
const h = await harness({ title: 'Cinematic look-dev', outDefault: '/tmp/cine' });
const { page, card, act, pose, shot, check } = h;
await h.segment('open', async () => {
  await h.fresh('&title=0');
  for (let i = 0; i < 4; i++) { await shot('open' + i); const d = await page.evaluate(() => window.__vlStory.debug); if (d.opening < 0) break; await page.waitForTimeout(900); }
  check('opening hands over to play', await h.waitFor(async () => (await page.evaluate(() => window.__vlStory.debug.opening)) < 0, 30000));
  await shot('after-open');
  console.log('HINT', await page.evaluate(() => { const e = document.querySelector('.control-hint'); return e && { hidden: e.hidden, vis: e.style.visibility, tr: e.style.transform, text: e.textContent }; }));
  await pose(4.4, -9.4); await act('Talk'); await shot('mira-bubble'); await card('Hang it'); await shot('beep'); await card('Beep?'); await shot('blink'); await card('Next'); await shot('look'); await card('Next');
});
await h.segment('attack', async () => {
  await h.waitFor(async () => (await page.evaluate(() => window.__vlStory.debug.beat)) === 'attack', 10000, 100);
  let last = -1;
  for (let i = 0; i < 400; i++) {
    const d = await page.evaluate(() => window.__vlStory.debug);
    if (d.beat !== 'attack') break;
    if (d.cut - last >= 1.1) { last = d.cut; await shot('c' + d.cut.toFixed(1)); }
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(1500); await shot('play');
  check('attack ends in the spark beat', (await page.evaluate(() => window.__vlStory.debug.beat)) === 'spark');
});
await h.finish();
