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
// flight, isle (satchel, notes, gate), relay, loom (Stop 2), chime (Stop 3), resume (save + Continue), menu (tabs, jumping between ways in), finds (stray sparks off the path), views.
import { harness } from './harness.mjs';

const h = await harness({ title: 'Flow check', outDefault: 'flowcheck', tool: 'flowcheck', lane: 'flow' });
const { page, check, press, open, shot, card, act, pose, save, goal, beat, learning, waitFor, segment } = h;
const zip = h.player;

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
  // the opening shows the world first: the Warden's engine on the horizon, in frame
  // first the prologue (1 Nov): dusk, the engine drinking the isles' words, the sim-lab's log says what the run is for
  check('the prologue says what the run is for (the sim-lab log names the objective)', await waitFor(async () => { await page.evaluate(() => window.__arcade.simulate(.4)); return page.locator('.sim-log', { hasText: 'objective' }).isVisible(); }, 30000, 300), await page.locator('.sim-log').innerText().catch(() => ''));
  { await waitFor(() => page.evaluate(() => (window.__vlStory?.debug?.opening ?? -1) >= .5), 30000);
    const v = await page.evaluate(() => { const S = window.__vlSpire, C = window.__vlDebug.camera, o = window.__vlStory?.debug?.opening ?? -1; if (!S || o < 0) return { o, on: false };
      const p = S.group.position.clone(); p.y += 200; const q = p.clone().project(C); return { o: +o.toFixed(2), on: q.z < 1 && Math.abs(q.x) < .9 && Math.abs(q.y) < .9, nodes: S.nodes }; });
    check('the opening shows the Warden\'s engine on the horizon (in frame during the first shot)', v.on, JSON.stringify(v)); }
});

await segment('meet', async () => {
  if ((await beat()) !== 'meet') { await page.evaluate(() => localStorage.clear()); await open('&title=0'); }
  await shot('cold-open'); await h.skipOpening();
  check('goal: meet Mira', /Meet Mira/.test(await goal() ?? ''), await goal());
  // run 26: a fader's opacity went NaN in the cold open and that banner never faded again
  { const bad = await page.evaluate(() => (window.__vlDebug.faders ?? []).filter(f => !Number.isFinite(f.o)).map(f => f.root.name || f.root.type)); check('every fader can still fade after the cold open (no NaN opacity)', !bad.length, bad.join(', ') || 'all finite'); }
  check('no card at the bottom in the cold open', !(await page.locator('.story-card:not([hidden])').count()));
  await pose(4.4, -9.4); await act('Talk');
  check('Mira talks in a bubble over her head', await waitFor(() => page.locator('.story-card.bubble').isVisible(), 15000, 300));
  // faces (1 Nov, kit/face-rig.ts): Mira's mouth moves with her voice (or a flap when it's silent), and she blinks
  { const f = await page.evaluate(async () => { let o; window.__vlDebug.scene.traverse(x => { if (x.name === 'Mira') o = x; }); let m; o?.traverse(b => { if (b.isSkinnedMesh) m = b; });
      if (!m?.morphTargetInfluences) return { faced: false }; const d = m.morphTargetDictionary; let open = 0, blink = 0;
      for (let i = 0; i < 30; i++) { await new Promise(r => setTimeout(r, 100)); open = Math.max(open, m.morphTargetInfluences[d.open]); blink = Math.max(blink, m.morphTargetInfluences[d.blink]); }
      return { faced: true, open: +open.toFixed(2), blink: +blink.toFixed(2) }; });
    check('Mira\'s face lives: her mouth moves while she talks', f.faced && f.open > .2, JSON.stringify(f)); }
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
  await pose(-4.0, -10.1, 0); await page.waitForTimeout(800);
  check('the first word wears a "Tap" prompt (tutorial in the world)', await waitFor(() => page.evaluate(() => !!document.querySelector('.tap-prompt') && window.__vlGuide.overlay.has('prompt-absorb')), 15000, 300));
  await shot('tap-prompt');
  // spots a player can stand on, within reach of each word
  for (const [x, z, w] of [[-5.4, -6.9, 'rise'], [-3.6, -9.6, 'sink'], [5.4, -6.9, 'toward'], [2.4, -10.3, 'Skiff']]) {
    // turn the camera until the word is the one on offer (the prompt picks what you aim at)
    for (const yaw of [0, .8, -.8, 1.6, -1.6, 2.4, -2.4, 3.14]) { await pose(x, z, yaw); await sim(.3); if (await page.locator('.context-act', { hasText: `“${w}”` }).isVisible()) break; }
    await act(`“${w}”`); await sim(1.2);
    check(`absorbed "${w}"`, (await carried()).includes(w), JSON.stringify(await carried()));
  }
  check('goal: wake the skiff', /Wake the skiff/.test(await goal() ?? ''), await goal());
  await act('engine'); await page.waitForTimeout(800);
  check('hologram engine opens', await page.locator('.engine-tray').isVisible());
  const chip = w => page.locator('.holo-chip', { hasText: new RegExp('^' + w + '$') });
  // the decoy first: the skiff hears "sink"
  // the engine is drawn as a neural net (25 Oct): what a ring lights should depend on the whole ring
  const lit = () => page.evaluate(() => window.__vlNet.nodes.map(n => +n.want.toFixed(2)));
  await press(chip('sink')); await sim(.5); const sinkLit = await lit();
  // run 27: Zip's thoughts on seeing his net played later, mid-flight, with nothing lit on screen
  await sim(3.2); await shot('engine-thought');
  check('Zip\'s thought on seeing his engine shows while it is open', await waitFor(() => page.evaluate(() => { const t = document.querySelector('.thought'); return !!t && !t.hidden && /inside|coil/.test(t.textContent ?? ''); }), 8000, 300));
  check('the net shows some of itself dark (the rest of Zip\'s voice) when it opens', await page.evaluate(() => { const n = window.__vlNet; return n.awake > 0 && n.awake < .3 && n.nodes.some(x => !x.lit); }), await page.evaluate(() => window.__vlNet.awake));
  await press(page.locator('.holo-cast')); await sim(3);
  check('casting "sink" sinks the skiff', await page.locator('.engine-prompt', { hasText: 'sank' }).isVisible());
  await sim(3.5); await press(page.locator('button[data-act="clear"]'));
  for (const w of ['Skiff', 'rise', 'toward']) await press(chip(w));
  await sim(.5); const ringLit = await lit(), moved = ringLit.filter((v, i) => Math.abs(v - sinkLit[i]) > .1).length;
  check('a different ring lights a different pattern in the net', moved >= 6, `${moved} nodes changed`);
  await press(page.locator('.holo-cast')); await sim(4.5);
  check('the engine says "Blossom" and the loop breaks', await page.locator('.engine-prompt', { hasText: 'is broken' }).isVisible());
  await shot('loop-broken');
  // a wrong first try: cast again from the original words only
  await press(page.locator('.holo-cast')); await sim(4.5);
  check('same words in, same guess out', await page.locator('.engine-prompt', { hasText: 'again' }).isVisible());
  await sim(3.5); await press(chip('Blossom')); await press(page.locator('.holo-cast')); await sim(14);
  check('stars after waking the skiff', await waitFor(() => page.locator('.star-row').isVisible(), 60000));
  check('waking the skiff wakes more of the net', await page.evaluate(() => window.__vlNet.awake >= .45), await page.evaluate(() => window.__vlNet.awake));
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
  // Zip is nanites (2 Nov): he grows wings to fly (zip-rig.ts shift)
  { const f = await page.evaluate(async () => { window.__arcade.simulate(1); await new Promise(r => setTimeout(r, 300)); return window.__vlDebug.zipRig?.forms ?? null; });
    check('Zip grows wings while he flies', !f || f.wings > .5, JSON.stringify(f)); }
  check('lands on the Blossom Isle', await waitFor(() => page.locator('.star-row').isVisible(), 300000, 1000));
  await h.stars();
  check('saved at checkpoint "land"', await save() === 'land', await save());
});

await segment('isle', async () => {
  if (await beat() !== 'isle') { await open('&title=0&beat=land'); }
  await card('OK');
  check('island art dressed (kit loaded)', await waitFor(() => page.evaluate(() => !!window.__vlDebug.scene.getObjectByName('island-dressing:blossom-isle')), 60000));
  await shot('arrive');
  // a tap on the satchel from across the landing walks Zip up to it and takes it (run 29: a tap on it did
  // nothing; 20 steps went on finding that you walk right up first)
  { const B = [2.3, 53.4], Z = [B[0] - 5, B[1] + 3], y = Math.atan2(-(B[0] - Z[0]), -(B[1] - Z[1]));
    await page.evaluate(([x, z, y]) => { window.__arcade.pose(x, z, y, .2, 6, y); window.__arcade.simulate(1.5); }, [...Z, y]);
    const xy = await page.evaluate(([x, z]) => { const C = window.__vlDebug.camera, v = new C.position.constructor(x, .9, z).project(C); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; }, B);
    await page.touchscreen.tap(xy[0], xy[1]);
    const took = await waitFor(async () => { await page.evaluate(() => window.__arcade.simulate(.5)); return page.locator('.satchel-bar:not([hidden])').isVisible(); }, 15000, 300);
    check('a tap on the satchel from across the landing walks Zip there and takes it', took); }
  if (!(await page.locator('.satchel-bar:not([hidden])').isVisible())) { await pose(2.3, 52.6); await act('satchel'); }
  await card('Got it');
  // take a note; if the press didn't take (seen once in ~5 laptop runs at software frame rates),
  // say what the prompt was (a real dropped press would be a bug) and press again
  const notes = () => page.locator('.satchel-bar .chip.rail').count();
  const take = async (x, z) => {
    await pose(x, z); const n = await notes(), before = await page.evaluate(() => { const a = document.querySelector('.context-act'); return `${a?.dataset.label} / ${a?.dataset.action} / hidden=${a?.hidden}`; });
    await act('Take'); await page.evaluate(() => window.__arcade.simulate(.5));
    if ((await notes()) === n) { check(`a press on "Take the note" at ${x},${z} took the note`, false, `prompt was: ${before}; retrying`, 'warn'); await act('Take'); }
  };
  // Mira's torn page + the old poster (the tempting pair: both say bell gardens): the Gate opens
  // onto the sky where the bridge was, then the seal comes back
  await take(-4.5, 52.2); await take(-2.4, 50.4);
  check('satchel holds two notes', (await page.locator('.satchel-bar .chip.rail').count()) === 2);
  await pose(0, 49.2); await act('Gate');
  await card('Old Bridge'); await card('going'); await page.waitForTimeout(1500);
  check('a stale note opens the Gate onto empty sky (the view shows in the arch)', await waitFor(() => page.evaluate(() => { const v = window.__vlDebug.scene.getObjectByName('gate-view'); return !!v?.visible && v.material.opacity > .8; }), 15000));
  check('the guess shows with the notes, marked once the Gate has gone where they say (run 19: "my picks all got the same reply")', await page.locator('.satchel-bar .guess.right', { hasText: 'Old Bridge' }).isVisible(), await page.locator('.satchel-bar').textContent());
  await shot('gate-stale');
  await card('Swap'); await page.waitForTimeout(1200);
  check('the view goes and the seal comes back after a swap', await waitFor(() => page.evaluate(() => !window.__vlDebug.scene.getObjectByName('gate-view')?.visible), 15000));
  // the way (keeper's notice) with the where (Mira's page) opens it
  // put the poster back from the satchel itself, wherever Zip stands (run 24 quit walking back to swap)
  await press(page.locator('.satchel-bar button[data-action="put.poster"]')); await page.waitForTimeout(400);
  check('a note in the satchel goes back to its board with a tap on it, from anywhere', (await notes()) === 1, `${await notes()} notes in the satchel`);
  await take(5.4, 53.4);
  await pose(0, 49.2); await act('Gate'); await card('Lotus');
  await card('Yes'); await page.waitForTimeout(1200);
  const gateEv = (await learning()).filter(e => e.activity === 'blossom-gate');
  check('gate: first tries kept apart (wrong pair first, right prediction first)', gateEv.some(e => e.decision === 'context-selection' && e.first && !e.correct) && gateEv.some(e => e.decision === 'destination-prediction' && e.first && e.correct), JSON.stringify(gateEv.map(e => [e.decision, e.first, e.correct])));
  await shot('gate-open');
  // new orders: the Warden's drone plants his sign in the open Gate; predicted the misconception's
  // way (where Mira really is), the Gate still opens where the note says
  await page.evaluate(() => window.__arcade.simulate(4));   // the drone's flight is in game time (slow frames without a GPU)
  const ordersAsk = await waitFor(() => page.locator('.story-card button[data-action="orders.gardens"]').isVisible(), 20000, 400);
  check('new orders: the Warden plants his sign and the Gate asks where it opens now', ordersAsk);
  if (ordersAsk) {
    await press(page.locator('.story-card button[data-action="orders.gardens"]'));
    check('…it opens onto the East Falls, as the planted note says (the view shows in the arch)', await waitFor(() => page.evaluate(() => { const v = window.__vlDebug.scene.getObjectByName('gate-view'); return !!v?.visible && v.material.opacity > .8; }), 15000));
    await shot('gate-orders');
    await press(page.locator('.story-card button[data-action="orders.pull"]'), { timeout: 20000 }); await card('OK'); await page.waitForTimeout(800);
    // the stars come after the Warden's orders (run 29: before them, "level complete… oh wait, not yet")
    check('gate stars, after the new orders', await waitFor(() => page.locator('.star-row').isVisible(), 5000, 300));
    await h.stars();
    const ord = (await learning()).filter(e => e.activity === 'blossom-gate' && e.decision === 'literal-prediction');
    check('the prediction is logged (wrong: "where Mira is")', ord.length === 1 && !ord[0].correct && ord[0].choice === 'gardens', JSON.stringify(ord));
  }
  check('saved at checkpoint "gate-open"', await save() === 'gate-open', await save());
  check('goal: call Mira', /Call Mira/.test(await goal() ?? ''), await goal());
});

await segment('relay', async () => {
  if (page.url() === 'about:blank') await open('');
  if (!/Call Mira/.test(await goal() ?? '')) { await h.seedSave('gate-open', ['wake-skiff', 'blossom-gate']); await open(''); await press(page.locator('.title-screen button', { hasText: 'Continue' })); await page.waitForTimeout(3500); }
  await pose(0, 43.4); await act('relay');
  check('relay console opens', await page.locator('.relay-console').isVisible());
  check('pinned notes readable on the console', await page.locator('.relay-notes').isVisible());
  await press(page.locator('.relay-tick[data-ch="3"]')); await press(page.locator('.relay-console button', { hasText: 'Call' })); await page.waitForTimeout(600);
  check('channel 3 is the Warden', /Warden/.test(await page.locator('.relay-read').textContent()));
  await press(page.locator('.relay-tick[data-ch="7"]')); await press(page.locator('.relay-console button', { hasText: 'Call' }));
  await page.locator('.relay-console .chip', { hasText: 'Channel' }).waitFor({ timeout: 20000 });
  check('the Warden\'s word is styled like the others (the player judges it by what it says)', await page.evaluate(() => { const c = [...document.querySelectorAll('.relay-console .rail-chips button.chip')]; return c.length === 4 && new Set(c.map(b => b.className + getComputedStyle(b).borderStyle + getComputedStyle(b).color)).size === 1; }));
  // every word, by reflex: the Warden's "Surrender." goes in too and comes back out
  for (const w of ['Channel', 'Surrender', 'Mira', "it's"]) await press(page.locator('.relay-console .chip', { hasText: w }));
  await press(page.locator('.relay-console button', { hasText: 'Send' })); await page.waitForTimeout(600);
  check('reading the Warden\'s word too sends it back out (the jam plays out)', /surrender/i.test(await page.locator('.relay-read').textContent()), await page.locator('.relay-read').textContent());
  // run 27: a wrong send cleared every pick; now they stay, so taking out the Warden's word is one tap
  check('a wrong send keeps the words picked', await page.locator('.relay-console .chip.picked').count() === 4, String(await page.locator('.relay-console .chip.picked').count()));
  await press(page.locator('.relay-console .chip', { hasText: 'Surrender' }));
  await press(page.locator('.relay-console button', { hasText: 'Send' })); await page.waitForTimeout(600);
  // run 23: "I never saw what word the relay put in the … slot"; and the Warden's word looks like the others
  check('the relay makes its next word into the gap before Mira answers', await page.locator('.relay-console .chip.made', { hasText: 'Zip' }).isVisible().catch(() => false), await page.locator('.relay-read').textContent().catch(() => ''));
  await press(page.locator('.relay-console button', { hasText: 'Hear Mira' }));
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
  await pose(-3.6, 55.2); await act('Board');   // walkable ground beside the mooring
  await card('Onward'); await page.waitForTimeout(1500);
  // run 27: the hop was a cut; now it is flown (a short lane, no drones), hands off it still lands
  check('the hop to Loom Isle is flown', await page.evaluate(() => !!window.__vlFlight?.active), '');
  await page.evaluate(() => window.__arcade.simulate(4)); await shot('loom-hop');
  for (let i = 0; i < 90 && await page.evaluate(() => !!window.__vlFlight?.active); i++) await page.evaluate(() => window.__arcade.simulate(1));
  check('the hop ends on Loom Isle, its rings counted', await page.evaluate(() => { const s = window.__vlFlight?.state; return !window.__vlFlight?.active && s?.total === 4; }), JSON.stringify(await page.evaluate(() => window.__vlFlight?.state)));
  await page.waitForTimeout(1000);
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
  await press(page.locator('.loom-console button', { hasText: 'own call' })); await page.waitForTimeout(500);
  // build a call (run 29: "picking from 3 or 4 buttons"; now the player weaves their own): first the
  // tempting one, short in letters and long in pieces
  const tile = t => press(page.locator('.loom-console .loom-tile', { hasText: new RegExp('^' + t + '$') }));
  check('weave waits until the call has all three parts', await page.locator('.loom-console button[data-action="weave"]').isDisabled());
  await tile('Unhex'); await tile('Tavi'); await tile('from the loom'); await page.waitForTimeout(300);
  check('the call shows as whole words before it weaves (the split is the reveal)', (await page.locator('.loom-call-word').count()) === 3 && !(await page.locator('.loom-console .loom-piece').count()));
  await shot('loom-build');
  await press(page.locator('.loom-console button[data-action="weave"]'));
  await page.locator('.loom-verdict:not([hidden])').waitFor({ timeout: 15000 });
  check('woven, the short-in-letters call spills: 7 pieces, "Unhex" broke into parts', await page.locator('.loom-spill').isVisible() && /7 pieces/.test(await page.locator('.loom-verdict').innerText()) && /Unhex/.test(await page.locator('.loom-verdict').innerText()), await page.locator('.loom-verdict').innerText());
  await shot('loom-spill');
  await press(page.locator('.loom-console button', { hasText: 'Change the call' })); await page.waitForTimeout(400);
  await tile('Free');   // swaps the verb, keeps the rest
  check('a new choice swaps that part and keeps the rest', /^Free Tavi from the loom$/.test((await page.locator('.loom-call-word').allInnerTexts()).join(' ')), (await page.locator('.loom-call-word').allInnerTexts()).join(' '));
  await press(page.locator('.loom-console button[data-action="weave"]'));
  await page.locator('.star-row').first().waitFor({ timeout: 20000 });
  check('loom stars', await page.locator('.star-row').first().isVisible());
  await shot('loom-stars');
  const ev = (await learning()).filter(e => e.activity === 'loom-fit');
  check('loom decisions logged, first tries kept apart', ev.length === 3 && ev[0].decision === 'predict-pieces' && ev[0].first && !ev[0].correct && ev[1].first && !ev[1].correct && !ev[2].first && ev[2].correct, JSON.stringify(ev.map(e => [e.decision, e.choice, e.correct, e.first])));
  await h.stars();
  await card('What is it'); await card('Thanks');
  { const tv = await page.evaluate(() => { let p = null; window.__vlDebug.scene.traverse(x => { if (x.userData.person?.speaker === 'Tavi') p = x; }); return p ? { person: true, visible: p.parent?.visible, faced: !!p.userData.person.face } : { person: false }; });
    check('Tavi is a person from the body kit, with a living face', tv.person && tv.faced, JSON.stringify(tv)); }
  check('end of Stop 2 reached: Tavi free, the way on shown', await waitFor(async () => { await page.evaluate(() => window.__arcade.simulate(1)); return /Chime Isle/.test(await goal() ?? ''); }, 60000, 300), await goal());
});

await segment('chime', async () => {
  // Stop 3, sampling and warmth: board at Loom Isle's mooring, fly over, the chime tower
  if (!/Chime Isle/.test(await goal() ?? '')) { await open('&title=0&beat=to-chime'); await page.waitForTimeout(3000); }
  const moor = await page.evaluate(() => window.__vlGuide.beaconAt?.toArray());
  // the nearest walkable spot to the mooring (the skiff sits at the isle's edge)
  const stand = await page.evaluate(([x, z]) => { let best = null, bd = 1e9; for (let r = .4; r <= 2.2; r += .3) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r; if (window.__arcade.walkable(px, pz) && r < bd) { bd = r; best = [px, pz]; } } return best; }, [moor[0], moor[2]]);
  check('the mooring can be reached on foot (a walkable spot within 2.2 m)', !!stand, JSON.stringify(moor));
  await pose(stand[0], stand[1]); await act('Board');
  await card('Onward'); await page.waitForTimeout(2500);
  check('the hop to Chime Isle is flown', await page.evaluate(() => !!window.__vlFlight?.active), '');
  await page.evaluate(() => window.__arcade.simulate(4)); await shot('chime-hop');
  for (let i = 0; i < 120 && await page.evaluate(() => !!window.__vlFlight?.active); i++) await page.evaluate(() => window.__arcade.simulate(1));
  await page.waitForTimeout(1500);
  check('lands on Chime Isle', /Chime Isle/.test(await page.locator('#place').textContent()), await page.locator('#place').textContent());
  check('saved at checkpoint "chime"', (await save()) === 'chime', await save());
  const p = await zip(); check('stands on the raised island (ground lifted)', p[1] > 8.9 && p[1] < 9.5, p[1]);
  check('goal: find out why the bells are silent', /bells are silent/.test(await goal() ?? ''), await goal());
  await shot('chime-arrive');
  const tw = await page.evaluate(() => window.__vlGuide.beaconAt?.toArray());
  await pose(tw[0], tw[2] + 3.2); await act('chime tower');
  await card('help'); await card('Let me ask');
  const C = t => page.locator('.chime-console button', { hasText: t });
  const settle = async (ms = 4500) => { await page.waitForTimeout(ms); };
  check('the chime console opens with the guess fan', await page.locator('.chime-console .chime-guess').count() === 5, String(await page.locator('.chime-console .chime-guess').count()));
  await press(C('Cast')); await settle(); const w1 = await page.locator('.chime-ring .made').textContent();
  await press(C('Cast again')); await settle(); const w2 = await page.locator('.chime-ring .made').textContent();
  check('same words in, two different words out (sampling shown)', !!w1 && !!w2 && w1 !== w2, `${w1} / ${w2}`);
  await shot('chime-twice');
  await press(C('Next'));
  // the dial is found: it can be tried before the question (run 30)
  await press(C('Hot')); await page.waitForTimeout(700);
  check('the found dial can be tried: Hot flattens the fan, no question yet', /flattens/.test(await page.locator('.chime-console').innerText()) && await page.evaluate(() => Number(document.querySelector('.chime-guess[data-word="noon"] .chime-pc')?.textContent?.replace('%', '')) < 40) && !(await C('different word each time').count()), '');
  await press(C('Got it'));
  await press(C('different word each time')); await settle(7000);
  check('cold: five casts, the brightest every time', /five times out of five/.test(await page.locator('.chime-console').innerText()) && await page.evaluate(() => Number(document.querySelector('.chime-guess[data-word="noon"] .chime-pc')?.textContent?.replace('%', '')) >= 95));
  await shot('chime-cold');
  await press(C('bell vault'));
  check('the lock starts at warm (the dial has to be turned for it)', await page.locator('.chime-notch.warm.on').isVisible());
  await press(page.locator('.chime-console button[data-action="cast.lock"]')); await settle();
  check('warm at the exact lock: it lands off the brightest and the lock grinds', /grinds/.test(await page.locator('.chime-console').innerText()));
  await press(C('Try again')); await press(C('Cold')); await page.waitForTimeout(900);
  await press(page.locator('.chime-console button[data-action="cast.lock"]')); await settle();
  check('cold at the lock: the vault opens', /vault swings open/.test(await page.locator('.chime-console').innerText()));
  await shot('chime-vault');
  await press(C('To the bard'));
  await press(page.locator('.chime-console button[data-action="cast.bard"]')); await settle();
  check('cold for the bard: the tired line, "Heard it!"', /Heard it/.test(await page.locator('.chime-console').innerText()));
  await press(C('Try again')); await press(C('Warm')); await page.waitForTimeout(900);
  await press(page.locator('.chime-console button[data-action="cast.bard"]')); await settle();
  check('warm for the bard: the fresh line stays on screen (run 30 never saw it)', /Oriel sings/.test(await page.locator('.chime-console').innerText()), '');
  await press(C('Bravo'));
  await page.locator('.star-row').first().waitFor({ timeout: 30000 });
  check('chime stars', await page.locator('.star-row').first().isVisible());
  await shot('chime-stars');
  const ev = (await learning()).filter(e => e.activity === 'chime-warmth');
  check('chime decisions logged, first tries kept apart', ev.length === 5 && ev[0].decision === 'predict-cold' && !ev[0].correct && ev[0].first && ev[1].decision === 'warmth-for-exact' && ev[1].first && !ev[1].correct && !ev[2].first && ev[2].correct && ev[3].decision === 'warmth-for-fresh' && ev[3].first && !ev[3].correct && !ev[4].first && ev[4].correct, JSON.stringify(ev.map(e => [e.decision, e.choice, e.correct, e.first])));
  await h.stars();
  await card('What is it'); await card('Thanks');
  check('end of Stop 3 reached', await waitFor(async () => { await page.evaluate(() => window.__arcade.simulate(.5)); return /Stop 3 for now/.test(await goal() ?? ''); }, 20000, 300), await goal());
  // the day has gone to dusk here: stars out, lamps lit, the Warden's engine at its brightest
  const mood = await page.evaluate(() => { const m = window.__vlMood?.state; return m ? { stars: m.stars, lamps: m.lamps, glow: m.farGlow } : null; });
  check('Chime Isle is at dusk (stars, lamps lit, the engine bright)', !!mood && mood.stars > .6 && mood.lamps > .6 && mood.glow > 2, JSON.stringify(mood));
  // the demo's end: the camera rises toward the engine and a card closes the demo
  check('the demo ends with a card after Stop 3', await waitFor(async () => { await page.evaluate(() => window.__arcade.simulate(1)); return page.locator('.demo-end:not([hidden])').isVisible(); }, 40000, 400), '');
  await shot('demo-end');
  await press(page.locator('.demo-end button', { hasText: 'Keep exploring' }));
  check('"Keep exploring" closes the card and gives control back', !(await page.locator('.demo-end:not([hidden])').count()) && !(await page.evaluate(() => window.__vlStory.frozen)), '');
});

await segment('resume', async () => {
  await open('');
  const label = await page.locator('.title-menu .primary').textContent();
  check('title offers Continue with the saved place', /Continue: Chime Isle/.test(label), label);
  check('title offers a new run', await page.locator('.title-menu button', { hasText: 'Start a new training run' }).isVisible());
  await press(page.locator('.title-menu .primary')); await page.waitForTimeout(3500);
  check('continues on Chime Isle', /Chime Isle/.test(await page.locator('#place').textContent()), await page.locator('#place').textContent());
});

// the menu: Game · Play · Settings; Play jumps between the story's chapters and the experiments
await segment('menu', async () => {
  const loaded = async () => { await page.waitForLoadState('load'); await page.waitForFunction(() => document.getElementById('loading')?.hidden, null, { timeout: 240000 }); await page.waitForTimeout(1500); };
  await open('&beat=land'); await page.waitForTimeout(1500);
  await press(page.locator('#pause'));
  check('the menu opens on its Game tab', await page.locator('#menu-tab-game[aria-selected="true"]').isVisible() && await page.locator('#to-title').isVisible());
  await press(page.locator('#menu-tab-play'));
  check('Play lists the story chapters and the experiments', (await page.locator('.menu-mode').count()) >= 10, String(await page.locator('.menu-mode').count()));
  check('the chapter being played is marked', await page.locator('.menu-mode[data-mode="ch-gate"][aria-current="true"]').isVisible());
  await shot('menu-play');
  await press(page.locator('.menu-mode[data-mode="lab-ngram"]')); await loaded();
  check('a Play entry jumps to that experiment', /lab=ngram/.test(page.url()) && await page.evaluate(() => !!window.__vlUtterLab), page.url());
  await press(page.locator('#pause')); await press(page.locator('#to-title')); await loaded();
  check('"Back to the story" reaches the title screen', await page.locator('.title-screen').isVisible() && !/lab=|beat=/.test(page.url()), page.url());
  await press(page.locator('.title-menu button', { hasText: 'Graphics' }));
  check('the title\'s Graphics opens the menu on Settings', await page.locator('#menu-tab-settings[aria-selected="true"]').isVisible() && await page.locator('.menu .gfx').isVisible());
  await shot('menu-settings');
});

// Stray sparks off the beaten path (25 Oct): each one can be walked to from where a player is, and
// walking into it takes it (the count goes up and stays); a new run puts them back.
await segment('finds', async () => {
  for (const [extra, ids] of [['&title=0', ['west-plaza', 'east-nook', 'canopy-corner']], ['&title=0&beat=gate-open', ['blossom-west', 'blossom-south']], ['&title=0&beat=loom', ['loom-east', 'loom-south', 'loom-west']], ['&title=0&beat=chime', ['chime-west', 'chime-east']]]) {
    await open(extra); if (extra === '&title=0') await h.skipOpening(); await page.waitForTimeout(2500);
    for (const id of ids) {
      const f = (await page.evaluate(() => window.__vlFinds.open)).find(x => x.id === id);
      if (!check(`stray spark "${id}" is out there`, !!f)) continue;
      const before = await page.evaluate(() => window.__vlFinds.count);
      // (the test's own planner doesn't find the way through the Gate's arch from the relay side: go through it first)
      if (id === 'blossom-west') await h.walkTo([0, 47.6], { near: .6, maxSecs: 20 });
      const r = await h.walkTo([f.at[0], f.at[1]], { near: .4, maxSecs: 45, until: async () => (await page.evaluate(() => window.__vlFinds.count)) > before });
      await page.evaluate(() => window.__arcade.simulate(1));
      check(`stray spark "${id}" can be walked to and taken`, (await page.evaluate(() => window.__vlFinds.count)) > before, `${r.reason}, ${r.secs?.toFixed?.(1)} s`);
    }
  }
  check('all ten found, and the count stays', await page.evaluate(() => window.__vlFinds.count === window.__vlFinds.total), String(await page.evaluate(() => window.__vlFinds.count)));
  await shot('all-found');
});

await segment('views', async () => {
  // fixed judgment views for art review (before/after comparisons)
  const views = [['', 'hero-vista', [.4, -10.65, 0]], ['', 'looking-back', [1, -8.5, Math.PI]], ['&beat=land', 'isle-gate', [0, 52.5, 0]], ['&beat=land', 'isle-relay', [0, 44, Math.PI]]];
  let at = null;
  for (const [extra, name, p] of views) {
    if (extra !== at) { await open('&title=0' + extra); at = extra; if (!extra) await h.skipOpening(); await page.evaluate(() => document.querySelectorAll('.story-card').forEach(e => e.style.visibility = 'hidden')); await page.waitForTimeout(4000); }
    await pose(...p); await page.waitForTimeout(1500); await shot(name);
    const s = await page.evaluate(() => window.__arcade.snapshot()); check(`${name}: draws ${s.draws}, triangles ${s.triangles}`, s.draws < 400, '');
  }
});

await h.finish();
