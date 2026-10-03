// Whole-game flow check: plays "The First Words" start to finish through the
// game's own debug hooks and checks what must stay true after every build.
// It is a regression net, not a play-test: feel, timing and fun still need a
// person in a real browser.
//
//   node tools/flowcheck.mjs [--input mouse|touch|keyboard] [--base http://localhost:8765] [--out flowcheck] [--only title,meet,...]
// --input plays as a phone (taps, thumb stick) or a laptop (E, Space, number keys, WASD);
// tools/playthrough.mjs runs both and puts the screenshots side by side.
//
// Writes <out>/report.json, <out>/report.md and screenshots. Exit code 1 when a
// check fails. Segments: title, meet (Mira + attack), spark, skiff (catch game),
// flight, isle (satchel, notes, gate), relay, loom (Stop 2), resume (save + Continue), views.
import { harness } from './harness.mjs';

const h = await harness({ title: 'Flow check', outDefault: 'flowcheck' });
const { page, check, press, open, shot, card, act, pose, save, goal, beat, learning, waitFor, segment, zip } = h;

// how the player moves, per device: a thumb stick on a phone (light tilt walks, full tilt jogs),
// WASD on a laptop (Shift walks). Runs with --input touch or keyboard.
await segment('controls', async () => {
  if (h.INPUT === 'mouse') return;
  await h.fresh('&title=0&story=0'); await page.waitForTimeout(1500);
  const want = h.INPUT === 'touch' ? 'touch' : 'desktop', mode = await page.evaluate(() => document.documentElement.dataset.input);
  check(`the game knows it is held as "${want}"`, mode === want, mode);
  const dist = async move => { const a = await zip(); await move(); const b = await zip(); return Math.hypot(b[0] - a[0], b[2] - a[2]); };
  const sim = s => page.evaluate(s => window.__arcade.simulate(s), s);
  if (h.INPUT === 'touch') {
    check('no arrow buttons on a phone', !(await page.locator('#controls .pad').isVisible()));
    check('the thumb stick rests faintly in the lower left', await page.locator('.stick-base').isVisible());
    const run = await dist(() => h.stick([0, -1], 1.5)), walk = await dist(() => h.stick([0, -1], 1.5, 22));
    check('full tilt jogs', run > 3, run.toFixed(2) + ' m in 1.5 s');
    check('a light tilt walks, slower', walk > .3 && walk < run * .7, `${walk.toFixed(2)} m vs ${run.toFixed(2)} m`);
    const side = await dist(() => h.stick([1, 0], 1));
    check('the stick steers sideways too', side > 1.5, side.toFixed(2));
    await shot('stick');
  } else {
    check('no thumb stick on a laptop', !(await page.locator('.stick-zone').isVisible()));
    const hold = async (keys, sec) => { for (const k of keys) await page.keyboard.down(k); await sim(sec); for (const k of [...keys].reverse()) await page.keyboard.up(k); };
    const run = await dist(() => hold(['KeyW'], 1.5)), walk = await dist(() => hold(['Shift', 'KeyW'], 1.5));
    check('W jogs', run > 3, run.toFixed(2) + ' m in 1.5 s');
    check('Shift+W walks, slower', walk > .3 && walk < run * .7, `${walk.toFixed(2)} m vs ${run.toFixed(2)} m`);
    const side = await dist(() => hold(['KeyD'], 1));
    check('D steps sideways', side > 1.5, side.toFixed(2));
    await page.keyboard.press('e'); await page.waitForTimeout(300);
    check('E with nothing to act on does nothing harmful', !(await page.locator('.story-card:not([hidden])').count()));
    await shot('keyboard');
  }
});

await segment('title', async () => {
  await h.fresh();
  check('title screen shows', await page.locator('.title-screen').isVisible());
  check('menu reads "Start training run"', await page.locator('.title-menu .primary', { hasText: 'Start training run' }).isVisible());
  await shot('menu');
  await press(page.locator('.title-menu .primary'));
  check('story starts after the title (cold open on Mira)', await waitFor(() => page.evaluate(() => (window.__vlStory?.debug?.opening ?? -1) >= 0 || window.__vlStory?.debug?.beat === 'meet'), 20000));
});

await segment('meet', async () => {
  if ((await beat()) !== 'meet') { await page.evaluate(() => localStorage.clear()); await open('&title=0'); }
  await shot('cold-open'); await h.skipOpening();
  check('goal: meet Mira', /Meet Mira/.test(await goal() ?? ''), await goal());
  check('no card at the bottom in the cold open', !(await page.locator('.story-card:not([hidden])').count()));
  await pose(4.4, -9.4); await act('Talk');
  check('Mira talks in a bubble over her head', await waitFor(() => page.locator('.story-card.bubble').isVisible(), 15000, 300));
  await shot('mira-bubble');
  await h.talkMira();
  check('attack cutscene starts', await h.until(async () => (await beat()) === 'attack', 20), await beat());
  await h.until(() => page.locator('.context-act', { hasText: 'Shield' }).isVisible(), 20);
  await act('Shield', 60000);
  await shot('attack');
  // the rest of the cutscene is long at software-rendered frame rates: use its Skip button
  await page.waitForTimeout(3000); await press(page.locator('.story-skip')); await page.waitForTimeout(800);
  check('spark beat after the attack', await h.waitBeat('spark', 30000), await beat());
  check('no card after the attack (the film says it)', !(await page.locator('.story-card:not([hidden])').count()));
  check('saved at checkpoint "spark"', await save() === 'spark', await save());
});

await segment('spark', async () => {
  if (await beat() !== 'spark') { await page.evaluate(() => localStorage.clear()); await open('&title=0&beat=spark'); }
  for (let i = 0; i < 14 && await beat() === 'spark'; i++) {
    const d = await page.evaluate(() => window.__vlStory.debug.spark);
    await pose(d[0] + (i < 6 ? 1.6 : .25), d[2] + (i < 6 ? .6 : .25), Math.PI); await page.waitForTimeout(1500);
  }
  check('spark caught', await h.waitBeat('skiff', 10000), await beat());
  check('saved at checkpoint "skiff"', await h.until(async () => await save() === 'skiff', 10), await save());
  check('goal: find the skiff\'s words', /skiff's words/.test(await goal() ?? ''), await goal());
});

await segment('skiff', async () => {
  // Echo & Engine: absorb words from the world, load the hologram engine, cast, fix the loop
  if (await beat() !== 'skiff') { await open('&title=0&beat=skiff'); await page.waitForTimeout(2000); }
  const sim = s => page.evaluate(s => window.__arcade.simulate(s), s);
  const carried = () => page.evaluate(() => window.__vlStory.debug.carried);
  check('goal asks for the skiff\'s words', /skiff's words \(0 of 3\)/.test(await goal() ?? ''), await goal());
  await pose(-6.2, -9.6, 0); await page.waitForTimeout(800);
  check('the first word wears a "Tap" prompt (tutorial in the world)', await waitFor(() => page.evaluate(() => !!document.querySelector('.tap-prompt') && window.__vlGuide.overlay.has('prompt-absorb')), 15000, 300));
  await shot('tap-prompt');
  for (const [x, z, w] of [[-6.2, -9.6, 'rise'], [-3.6, -9.6, 'sink'], [6.0, -9.6, 'toward'], [2.4, -10.3, 'Skiff']]) {
    await pose(x, z, 0); await act('Absorb'); await sim(1.2);
    check(`absorbed "${w}"`, (await carried()).includes(w), JSON.stringify(await carried()));
  }
  check('goal: wake the skiff', /Wake the skiff/.test(await goal() ?? ''), await goal());
  await act('engine'); await page.waitForTimeout(800);
  check('hologram engine opens', await page.locator('.engine-tray').isVisible());
  const chip = w => page.locator('.holo-chip', { hasText: new RegExp('^' + w + '$') });
  // the decoy first: the skiff hears "sink"
  await press(chip('sink')); await press(page.locator('.holo-cast')); await sim(3);
  check('casting "sink" sinks the skiff', await page.locator('.engine-prompt', { hasText: 'sank' }).isVisible());
  await sim(3.5); await press(page.locator('button[data-act="clear"]'));
  for (const w of ['Skiff', 'rise', 'toward']) await press(chip(w));
  await press(page.locator('.holo-cast')); await sim(4.5);
  check('the engine says "Blossom" and the loop breaks', await page.locator('.engine-prompt', { hasText: 'is broken' }).isVisible());
  await shot('loop-broken');
  // a wrong first try: cast again from the original words only
  await press(page.locator('.holo-cast')); await sim(4.5);
  check('same words in, same guess out', await page.locator('.engine-prompt', { hasText: 'again' }).isVisible());
  await sim(3.5); await press(chip('Blossom')); await press(page.locator('.holo-cast')); await sim(14);
  check('stars after waking the skiff', await waitFor(() => page.locator('.star-row').isVisible(), 60000));
  await shot('stars');
  await h.stars();
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
  await h.stars();
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
  await h.stars();
  check('saved at checkpoint "gate-open"', await save() === 'gate-open', await save());
  check('goal: call Mira', /Call Mira/.test(await goal() ?? ''), await goal());
});

await segment('relay', async () => {
  if (page.url() === 'about:blank') await open('');
  if (!/Call Mira/.test(await goal() ?? '')) { await page.evaluate(() => localStorage.setItem('bellweather.save.v1', JSON.stringify({ at: 'gate-open', when: Date.now() }))); await open(''); await press(page.locator('.title-screen button', { hasText: 'Continue' })); await page.waitForTimeout(3500); }
  await pose(0, 43.4); await act('relay');
  check('relay console opens', await page.locator('.relay-console').isVisible());
  check('pinned notes readable on the console', await page.locator('.relay-notes').isVisible());
  await press(page.locator('.relay-tick[data-ch="3"]')); await press(page.locator('.relay-console button', { hasText: 'Call' })); await page.waitForTimeout(600);
  check('channel 3 is the Warden', /Warden/.test(await page.locator('.relay-read').textContent()));
  await press(page.locator('.relay-tick[data-ch="7"]')); await press(page.locator('.relay-console button', { hasText: 'Call' }));
  await page.locator('.relay-console .chip', { hasText: 'Channel' }).waitFor({ timeout: 20000 });
  for (const w of ['Channel', 'Mira', "it's"]) await press(page.locator('.relay-console .chip', { hasText: w }));
  await press(page.locator('.relay-console button', { hasText: 'Send' })); await page.waitForTimeout(600);
  await card('coming'); await page.waitForTimeout(1200);
  check('relay stars', await page.locator('.star-row').isVisible());
  await shot('relay-stars');
  await h.stars();
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
  for (const w of ['Free', 'the', 'weaver']) { await press(page.locator('.loom-console .chip', { hasText: new RegExp('^' + w + '$') })); await page.waitForTimeout(300); }
  await page.locator('.loom-console button', { hasText: 'Got it' }).waitFor({ timeout: 15000 });
  await shot('loom-rule');
  await press(page.locator('.loom-console button', { hasText: 'Got it' })); await page.waitForTimeout(500);
  await press(page.locator('.loom-console button', { hasText: /^6$/ })); await page.waitForTimeout(600);
  check('the loom shows the split and the overflow', await page.locator('.loom-spill').isVisible() && (await page.locator('.loom-piece').count()) === 9, await page.locator('.loom-piece').count());
  await shot('loom-split');
  await press(page.locator('.loom-console button', { hasText: 'shorter' })); await page.waitForTimeout(500);
  await press(page.locator('.loom-choice', { hasText: 'Unhex' })); await page.waitForTimeout(700);
  check('the letter-short call loses the name', /Free <b>who\?<\/b>|Free who\?/.test(await page.locator('.loom-console').innerHTML()));
  await press(page.locator('.loom-console button', { hasText: 'other call' })); await page.waitForTimeout(500);
  await press(page.locator('.loom-choice', { hasText: 'Please' }));
  await page.locator('.star-row').first().waitFor({ timeout: 20000 });
  check('loom stars', await page.locator('.star-row').first().isVisible());
  await shot('loom-stars');
  const ev = (await learning()).filter(e => e.activity === 'loom-fit');
  check('loom decisions logged, first tries kept apart', ev.length === 3 && ev[0].decision === 'predict-pieces' && ev[0].first && !ev[0].correct && ev[1].first && !ev[1].correct && !ev[2].first && ev[2].correct, JSON.stringify(ev.map(e => [e.decision, e.choice, e.correct, e.first])));
  await h.stars();
  await card('What is it'); await card('Thanks');
  check('end of Stop 2 reached', /Stop 2 for now/.test(await goal() ?? ''), await goal());
});

await segment('resume', async () => {
  await open('');
  const label = await page.locator('.title-menu .primary').textContent();
  check('title offers Continue with the saved place', /Continue: Loom Isle/.test(label), label);
  check('title offers a new run', await page.locator('.title-menu button', { hasText: 'Start a new training run' }).isVisible());
  await press(page.locator('.title-menu .primary')); await page.waitForTimeout(3500);
  check('continues on Loom Isle', /Loom Isle/.test(await page.locator('#place').textContent()), await page.locator('#place').textContent());
});

await segment('views', async () => {
  // fixed judgment views for art review (before/after comparisons)
  const views = [['', 'hero-vista', [.3, -11.2, 0]], ['', 'looking-back', [1, -8.5, Math.PI]], ['&beat=land', 'isle-gate', [0, 52.5, 0]], ['&beat=land', 'isle-relay', [0, 44, Math.PI]]];
  let at = null;
  for (const [extra, name, p] of views) {
    if (extra !== at) { await open('&title=0' + extra); at = extra; if (!extra) await h.skipOpening(); await page.evaluate(() => document.querySelectorAll('.story-card').forEach(e => e.style.visibility = 'hidden')); await page.waitForTimeout(4000); }
    await pose(...p); await page.waitForTimeout(1500); await shot(name);
    const s = await page.evaluate(() => window.__arcade.snapshot()); check(`${name}: draws ${s.draws}, triangles ${s.triangles}`, s.draws < 400, '');
  }
});

await h.finish();
