// Whole-game flow check: plays "The First Words" start to finish through the
// game's own debug hooks and checks what must stay true after every build.
// It is a regression net, not a play-test: feel, timing and fun still need a
// person in a real browser.
//
//   node tools/flowcheck.mjs [--base http://localhost:8765] [--out flowcheck] [--only title,meet,...]
//
// Writes <out>/report.json, <out>/report.md and screenshots. Exit code 1 when a
// check fails. Segments: title, meet (Mira + attack), spark, skiff (catch game),
// flight, isle (satchel, notes, gate), relay, loom (Stop 2), resume (save + Continue), views.
import { harness } from './harness.mjs';

const h = await harness({ title: 'Flow check', outDefault: 'flowcheck' });
const { page, check, open, shot, card, act, pose, save, goal, beat, learning, waitFor, segment, zip } = h;

await segment('title', async () => {
  await h.fresh();
  check('title screen shows', await page.locator('.title-screen').isVisible());
  check('menu reads "Start training run"', await page.locator('.title-menu .primary', { hasText: 'Start training run' }).isVisible());
  await shot('menu');
  await page.locator('.title-menu .primary').click();
  check('story starts after the title', await waitFor(() => page.locator('.story-card button', { hasText: 'Play' }).isVisible(), 20000));
});

await segment('meet', async () => {
  if (!(await page.locator('.story-card button', { hasText: 'Play' }).isVisible().catch(() => false))) { await page.evaluate(() => localStorage.clear()); await open('&title=0'); }
  await card('Play');
  check('goal: meet Mira', /Meet Mira/.test(await goal() ?? ''), await goal());
  await pose(4.4, -9.4); await act('Talk');
  await card('Next'); await card('Hang the lantern'); await card('Hum'); await card('Look up');
  check('attack cutscene starts', await beat() === 'attack', await beat());
  await page.locator('.context-act', { hasText: 'Shield' }).waitFor({ state: 'visible', timeout: 120000 }); await page.locator('.context-act').click();
  await shot('attack');
  // the rest of the cutscene is long at software-rendered frame rates: use its Skip button
  await page.waitForTimeout(3000); await page.locator('.story-skip').click(); await page.waitForTimeout(800);
  await card('Catch the spark', 60000);
  check('spark beat after the attack', await beat() === 'spark', await beat());
  check('saved at checkpoint "spark"', await save() === 'spark', await save());
});

await segment('spark', async () => {
  if (await beat() !== 'spark') { await page.evaluate(() => localStorage.clear()); await open('&title=0&beat=spark'); }
  for (let i = 0; i < 14 && await beat() === 'spark'; i++) {
    const d = await page.evaluate(() => window.__vlStory.debug.spark);
    await pose(d[0] + (i < 6 ? 1.6 : .25), d[2] + (i < 6 ? .6 : .25), Math.PI); await page.waitForTimeout(1500);
  }
  check('spark caught', await beat() === 'skiff' || await page.locator('.story-card button', { hasText: 'Beep' }).isVisible(), await beat());
  await card('Beep boop'); await card('Let');
  check('saved at checkpoint "skiff"', await save() === 'skiff', await save());
  check('goal: find the skiff\'s words', /skiff's words/.test(await goal() ?? ''), await goal());
});

await segment('skiff', async () => {
  // Echo & Engine: absorb words from the world, load the hologram engine, cast, fix the loop
  if (await beat() !== 'skiff') { await open('&title=0&beat=skiff'); await page.waitForTimeout(2000); }
  const sim = s => page.evaluate(s => window.__arcade.simulate(s), s);
  const carried = () => page.evaluate(() => window.__vlStory.debug.carried);
  check('goal asks for the skiff\'s words', /skiff's words \(0 of 3\)/.test(await goal() ?? ''), await goal());
  for (const [x, z, w] of [[-6.2, -9.6, 'rise'], [-3.6, -9.6, 'sink'], [6.0, -9.6, 'toward'], [2.4, -10.3, 'Skiff']]) {
    await pose(x, z, 0); await act('Absorb'); await sim(1.2);
    check(`absorbed "${w}"`, (await carried()).includes(w), JSON.stringify(await carried()));
  }
  check('goal: wake the skiff', /Wake the skiff/.test(await goal() ?? ''), await goal());
  await act('engine'); await page.waitForTimeout(800);
  check('hologram engine opens', await page.locator('.engine-tray').isVisible());
  const chip = w => page.locator('.holo-chip', { hasText: new RegExp('^' + w + '$') });
  // the decoy first: the skiff hears "sink"
  await chip('sink').click(); await page.locator('.holo-cast').click(); await sim(3);
  check('casting "sink" sinks the skiff', await page.locator('.engine-prompt', { hasText: 'sank' }).isVisible());
  await sim(3.5); await page.locator('button[data-act="clear"]').click();
  for (const w of ['Skiff', 'rise', 'toward']) await chip(w).click();
  await page.locator('.holo-cast').click(); await sim(4.5);
  check('the engine says "Blossom" and the loop breaks', await page.locator('.engine-prompt', { hasText: 'is broken' }).isVisible());
  await shot('loop-broken');
  // a wrong first try: cast again from the original words only
  await page.locator('.holo-cast').click(); await sim(4.5);
  check('same words in, same guess out', await page.locator('.engine-prompt', { hasText: 'again' }).isVisible());
  await sim(3.5); await chip('Blossom').click(); await page.locator('.holo-cast').click(); await sim(14);
  check('stars after waking the skiff', await waitFor(() => page.locator('.star-row').isVisible(), 60000));
  await shot('stars');
  await page.locator('.story-card button.primary').click(); await page.waitForTimeout(600);
  const ev = (await learning()).filter(e => e.activity === 'wake-skiff');
  check('loop choices logged', ev.length === 2 && ev[0].choice === 'original-only' && !ev[0].correct && ev[1].correct, JSON.stringify(ev.map(e => [e.choice, e.correct, e.first])));
  check('only the first loop choice counts as first try', ev.filter(e => e.first).length === 1, ev.map(e => e.first).join(','));
  await card('Board');
});

await segment('flight', async () => {
  if (await beat() !== 'fly') { await open('&title=0&beat=isle'); }
  check('flight running', await waitFor(async () => (await beat()) === 'fly', 30000), await beat());
  await page.waitForTimeout(3000); await shot('flying');
  check('lands on the Blossom Isle', await waitFor(() => page.locator('.star-row').isVisible(), 300000, 1000));
  await page.locator('.story-card button.primary').click(); await page.waitForTimeout(600);
  check('saved at checkpoint "land"', await save() === 'land', await save());
});

await segment('isle', async () => {
  if (await beat() !== 'isle') { await open('&title=0&beat=land'); }
  await card('OK');
  check('island art dressed (kit loaded)', await waitFor(() => page.evaluate(() => !!window.__vlDebug.scene.getObjectByName('island-dressing:blossom-isle')), 60000));
  await shot('arrive');
  await pose(2.0, 54.6); await act('satchel'); await card('Got it');
  await pose(-4.5, 52.2); await act('Take');
  await pose(4.6, 50.8); await act('Take');
  check('satchel holds two notes', (await page.locator('.satchel-bar .chip.rail').count()) === 2);
  await pose(0, 49.2); await act('Gate');
  await card('East'); await card('route'); await page.waitForTimeout(800); await card('Carry');
  await pose(4.6, 50.8); await act('Put it back');
  await pose(0, 49.2); await act('Gate'); await card('Lotus');
  await card('Yes'); await page.waitForTimeout(1200);
  check('gate stars', await page.locator('.star-row').isVisible());
  await shot('gate-open');
  await page.locator('.story-card button.primary').click(); await page.waitForTimeout(600);
  check('saved at checkpoint "gate-open"', await save() === 'gate-open', await save());
  check('goal: call Mira', /Call Mira/.test(await goal() ?? ''), await goal());
});

await segment('relay', async () => {
  if (page.url() === 'about:blank') await open('');
  if (!/Call Mira/.test(await goal() ?? '')) { await page.evaluate(() => localStorage.setItem('bellweather.save.v1', JSON.stringify({ at: 'gate-open', when: Date.now() }))); await open(''); await page.locator('.title-screen button', { hasText: 'Continue' }).click(); await page.waitForTimeout(3500); }
  await pose(0, 43.4); await act('relay');
  check('relay console opens', await page.locator('.relay-console').isVisible());
  check('pinned notes readable on the console', await page.locator('.relay-notes').isVisible());
  await page.locator('.relay-tick[data-ch="3"]').click(); await page.locator('.relay-console button', { hasText: 'Call' }).click(); await page.waitForTimeout(600);
  check('channel 3 is the Warden', /Warden/.test(await page.locator('.relay-read').textContent()));
  await page.locator('.relay-tick[data-ch="7"]').click(); await page.locator('.relay-console button', { hasText: 'Call' }).click();
  await page.locator('.relay-console .chip', { hasText: 'Channel' }).waitFor({ timeout: 20000 });
  for (const w of ['Channel', 'Mira', "it's"]) await page.locator('.relay-console .chip', { hasText: w }).click();
  await page.locator('.relay-console button', { hasText: 'Send' }).click(); await page.waitForTimeout(600);
  await card('coming'); await page.waitForTimeout(1200);
  check('relay stars', await page.locator('.star-row').isVisible());
  await shot('relay-stars');
  await page.locator('.story-card button.primary').click(); await page.waitForTimeout(800);
  check('Stop 2 begins: board the skiff to Loom Isle', /Board the skiff to Loom Isle/.test(await goal() ?? ''), await goal());
  const ev = (await learning()).filter(e => e.activity === 'relay-contact');
  check('relay choices logged with first-try flags', ev.length >= 2 && ev[0].first === true, JSON.stringify(ev.map(e => [e.decision, e.choice, e.first])));
});

await segment('loom', async () => {
  // Stop 2, built from data: board the skiff, land on Loom Isle, free Tavi at the Word Loom
  if (!/Board the skiff/.test(await goal() ?? '')) { await open('&title=0&beat=to-loom'); await page.waitForTimeout(2500); }
  await pose(-3.2, 55.2); await act('Board');
  await card('Onward'); await page.waitForTimeout(2500);
  check('lands on Loom Isle', /Loom Isle/.test(await page.locator('#place').textContent()), await page.locator('#place').textContent());
  check('saved at checkpoint "loom"', (await save()) === 'loom', await save());
  const p = await zip(); check('stands on the raised island (ground lifted)', p[1] > 4.9 && p[1] < 5.5, p[1]);
  check('goal: find out why the loom is jammed', /loom is jammed/.test(await goal() ?? ''), await goal());
  await pose(-34, 97.6); await act('Word Loom');
  await card('help'); await card('Show me');
  check('loom console opens', await page.locator('.loom-console').isVisible());
  for (const w of ['Free', 'the', 'weaver']) { await page.locator('.loom-console .chip', { hasText: new RegExp('^' + w + '$') }).click(); await page.waitForTimeout(300); }
  await page.locator('.loom-console button', { hasText: 'Got it' }).waitFor({ timeout: 15000 });
  await shot('loom-rule');
  await page.locator('.loom-console button', { hasText: 'Got it' }).click(); await page.waitForTimeout(500);
  await page.locator('.loom-console button', { hasText: /^6$/ }).click(); await page.waitForTimeout(600);
  check('the loom shows the split and the overflow', await page.locator('.loom-spill').isVisible() && (await page.locator('.loom-piece').count()) === 9, await page.locator('.loom-piece').count());
  await shot('loom-split');
  await page.locator('.loom-console button', { hasText: 'shorter' }).click(); await page.waitForTimeout(500);
  await page.locator('.loom-choice', { hasText: 'Unhex' }).click(); await page.waitForTimeout(700);
  check('the letter-short call loses the name', /Free <b>who\?<\/b>|Free who\?/.test(await page.locator('.loom-console').innerHTML()));
  await page.locator('.loom-console button', { hasText: 'other call' }).click(); await page.waitForTimeout(500);
  await page.locator('.loom-choice', { hasText: 'Please' }).click();
  await page.locator('.star-row').first().waitFor({ timeout: 20000 });
  check('loom stars', await page.locator('.star-row').first().isVisible());
  await shot('loom-stars');
  const ev = (await learning()).filter(e => e.activity === 'loom-fit');
  check('loom decisions logged, first tries kept apart', ev.length === 3 && ev[0].decision === 'predict-pieces' && ev[0].first && !ev[0].correct && ev[1].first && !ev[1].correct && !ev[2].first && ev[2].correct, JSON.stringify(ev.map(e => [e.decision, e.choice, e.correct, e.first])));
  await page.locator('.story-card button.primary').click(); await page.waitForTimeout(800);
  await card('What is it'); await card('Thanks');
  check('end of Stop 2 reached', /Stop 2 for now/.test(await goal() ?? ''), await goal());
});

await segment('resume', async () => {
  await open('');
  const label = await page.locator('.title-menu .primary').textContent();
  check('title offers Continue with the saved place', /Continue: Loom Isle/.test(label), label);
  check('title offers a new run', await page.locator('.title-menu button', { hasText: 'Start a new training run' }).isVisible());
  await page.locator('.title-menu .primary').click(); await page.waitForTimeout(3500);
  check('continues on Loom Isle', /Loom Isle/.test(await page.locator('#place').textContent()), await page.locator('#place').textContent());
});

await segment('views', async () => {
  // fixed judgment views for art review (before/after comparisons)
  const views = [['', 'hero-vista', [.3, -11.2, 0]], ['', 'looking-back', [1, -8.5, Math.PI]], ['&beat=land', 'isle-gate', [0, 52.5, 0]], ['&beat=land', 'isle-relay', [0, 44, Math.PI]]];
  let at = null;
  for (const [extra, name, p] of views) {
    if (extra !== at) { await open('&title=0' + extra); at = extra; await page.evaluate(() => document.querySelectorAll('.story-card').forEach(e => e.style.visibility = 'hidden')); await page.waitForTimeout(4000); }
    await pose(...p); await page.waitForTimeout(1500); await shot(name);
    const s = await page.evaluate(() => window.__arcade.snapshot()); check(`${name}: draws ${s.draws}, triangles ${s.triangles}`, s.draws < 400, '');
  }
});

await h.finish();
