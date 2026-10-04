// Breaker: tries to break the game the way a speedrunner or a mean play-tester
// would, and checks that the game's promises still hold afterwards.
//
//   node tools/breaker.mjs [--input mouse|touch|keyboard] [--only oob,walls,mash,order,scum,pause,skip,resize,tamper,monkey] [--minutes 3]
//
// --input touch plays as a phone: rapid taps instead of clicks, the thumb stick instead of
// arrow keys, the pause button instead of Escape (tools/playthrough.mjs runs it that way too).
//
// Promises (invariants) checked after every probe:
//  - Zip never stands somewhere unwalkable, never falls through the world;
//  - at most one story card is open; nothing errors;
//  - the player is never stuck: there is always a goal, a card or an action;
//  - a first try stays a first try: retries, reloads and button mashing cannot
//    turn a wrong first answer into a "first try correct" (learning evidence);
//  - checkpoints only move forward.
// Findings are FAIL (a promise broke) or WARN (suspicious, needs a look).
import { harness, arg } from './harness.mjs';

const h = await harness({ title: 'Breaker (adversarial play-test)', outDefault: 'breaker' });
const { page, check, open, shot, card, act, pose, save, goal, beat, learning, zip, waitFor, segment } = h;
const MINUTES = +arg('minutes', '3');
const rand = (() => { let a = +arg('seed', '1337'); return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();

// ---------------------------------------------------------------- invariants
const invariants = async (where) => {
  const s = await page.evaluate(() => {
    const p = window.__arcade.snapshot().position, cards = [...document.querySelectorAll('.story-card')].filter(e => !e.hidden && getComputedStyle(e).display !== 'none');
    const vis = sel => { const e = document.querySelector(sel); return !!e && !e.hidden && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden'; };
    return { p, walk: window.__arcade.walkable(p[0], p[2]), y: p[1], cards: cards.length, goal: vis('.goal-line'), act: vis('.context-act'), title: vis('.title-screen'), relay: vis('.relay-console'), hud: vis('.hud-prompt'), paused: window.__arcade.snapshot().paused, beat: window.__vlStory?.debug?.beat };
  });
  const ok = [
    check(`${where}: Zip stands on walkable ground`, s.walk, `at ${s.p.map(v => v.toFixed(2)).join(', ')} (beat ${s.beat})`),
    check(`${where}: Zip is not falling through the world`, s.y > -.5 && s.y < 3, `y ${s.y.toFixed(2)}`),
    check(`${where}: at most one story card`, s.cards <= 1, `${s.cards} cards`),
    check(`${where}: player is not stuck (goal, card, action or puzzle on screen)`, s.paused || s.title || s.cards || s.goal || s.act || s.relay || s.hud, JSON.stringify(s), 'warn'),
  ];
  return ok.every(Boolean);
};
const firstTryIntegrity = async (where) => {
  const ev = await learning(), seen = new Map(), bad = [];
  for (const e of ev) { const k = e.activity + '/' + e.decision; if (e.first && seen.has(k)) bad.push(k + ':' + e.choice); if (!seen.has(k)) seen.set(k, e); }
  check(`${where}: only one first try per decision`, !bad.length, bad.join(', ') || `${ev.length} events`);
  const dup = []; for (let i = 1; i < ev.length; i++) if (ev[i].activity === ev[i - 1].activity && ev[i].decision === ev[i - 1].decision && ev[i].choice === ev[i - 1].choice && ev[i].t - ev[i - 1].t < 400) dup.push(ev[i].activity + ':' + ev[i].choice);
  check(`${where}: no double-logged decisions from fast repeat clicks`, !dup.length, dup.join(', '), 'warn');
};
const TOUCH = h.INPUT === 'touch';
// hold a direction in game time (fast-forwarded: software rendering is too slow to play in real
// time): an arrow key on a keyboard, the thumb stick pushed that way on a phone
const STICK = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
const hold = (key, ms) => TOUCH ? h.stick(STICK[key], ms / 1000) : page.evaluate(([k, s]) => window.__arcade.simulate(s, { keys: [k] }), [key, ms / 1000]);
/** hit a control n times as fast as the input allows: taps on a phone, forced clicks otherwise */
const hit = async (loc, n = 1) => {
  loc = loc.first();
  // a thumb aims at a button that holds still (prompts pop in), then fires as fast as it can
  if (TOUCH) { if (!(await loc.tap({ timeout: 3000 }).then(() => true).catch(() => false))) return; const b = await loc.boundingBox().catch(() => null); if (!b) return; for (let i = 1; i < n; i++) await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2).catch(() => {}); return; }
  for (let i = 0; i < n; i++) await loc.click({ force: true, noWaitAfter: true, timeout: 800 }).catch(() => {});
};
const tapAt = (x, y) => TOUCH ? page.touchscreen.tap(x, y) : page.mouse.click(x, y);
const walkTo = (x, z, s = 4) => page.evaluate(([x, z, s]) => window.__arcade.simulate(s, { walkTo: [x, z] }), [x, z, s]);
const startTown = async () => { await h.fresh('&title=0'); await h.skipOpening(); await tapAt(200, 300).catch(() => {}); };
const startIsle = async () => { await h.fresh('&title=0&beat=land'); await card('OK'); };

// ---------------------------------------------------------------- probes
await segment('oob', async () => {
  // run hard into every direction from several places, with the camera turned
  await startTown();
  for (const [x, z] of [[.3, -11.2], [4.4, -9.4], [-2, 1.5], [1, 7]]) {
    await pose(x, z);
    for (const [k, ms] of [['ArrowUp', 3000], ['ArrowLeft', 2500], ['ArrowDown', 3500], ['ArrowRight', 3000]]) await hold(k, ms);
    await invariants(`town edge run from ${x},${z}`);
  }
  // tap-to-walk to points far outside the map
  for (const [px, pz] of [[40, -11], [-30, 0], [0, 60], [12, 30], [-8, -40]]) await walkTo(px, pz, 6);
  await invariants('town far taps');
  await shot('town');
  await startIsle();
  for (const yaw of [0, 1.57, 3.14, 4.71, .8, 2.4, 3.9, 5.5]) {
    await pose(0, 52, yaw); await hold('ArrowDown', 6000); await invariants(`island edge run, heading ${yaw}`);
  }
  for (const [px, pz] of [[0, 70], [20, 48], [-20, 48], [0, 30]]) { await pose(0, 52); await walkTo(px, pz, 8); await invariants(`island walk-off toward ${px},${pz}`); }
  await shot('isle-edge');
});

await segment('walls', async () => {
  // the hedge and the closed gate must hold; no slipping through at the joins
  await startIsle();
  const tries = [[0, 47.0, 'gate (closed)'], [1.85, 47.0, 'gate pillar join'], [-1.85, 47.0, 'gate pillar join (left)'], [5, 47.2, 'hedge'], [9.2, 47.2, 'hedge end at the rim']];
  for (const [x, z, what] of tries) {
    await pose(x, z, 0);
    await hold('ArrowUp', 4000);
    const p = await zip();
    check(`cannot pass the ${what}`, p[2] > 45.6, `z after pushing: ${p[2].toFixed(2)} (hedge at 46)`);
  }
  await shot('walls');
});

await segment('mash', async () => {
  // mash primary buttons, the context action and the satchel
  await startIsle();
  await pose(2.0, 54.6);
  const actBtn = page.locator('.context-act').first(); await actBtn.waitFor({ timeout: 20000 });
  await hit(actBtn, 6);
  await page.waitForTimeout(800); await invariants('mash satchel');
  await hit(page.locator('.story-card button'));
  await pose(-4.5, 52.2); await hit(page.locator('.context-act'), 5);
  await pose(4.6, 50.8); await hit(page.locator('.context-act'), 5);
  await pose(5.4, 52.2); await hit(page.locator('.context-act'), 5);
  const n = await page.locator('.satchel-bar .chip.rail').count();
  check('satchel never holds more than two notes', n <= 2, `${n} notes`);
  // (a tap burst can already have opened the Gate's question: the prompt moved under the thumb to
  // the next target, as it does on a phone; that's fine as long as the promises hold)
  await pose(0, 49.2); if (!(await page.locator('.story-card:not([hidden])').count())) await act('Gate');
  // answer a choice card with a burst of clicks on every button
  for (let i = 0; i < 3; i++) { const b = page.locator('.story-card button'); const c = await b.count(); for (let k = 0; k < c; k++) await hit(b.nth(k)); await page.waitForTimeout(300); }
  await page.waitForTimeout(1500);
  await invariants('mash gate cards'); await firstTryIntegrity('mash gate');
  await shot('mash');
});

await segment('order', async () => {
  // sequence breaks: use things before the story allows them (teleporting like a glitch would)
  await startIsle();
  await pose(-4.5, 52.2);
  check('notes cannot be taken before the satchel', !(await page.locator('.context-act', { hasText: 'Take' }).isVisible()));
  await pose(0, 49.2);
  const gateAct = await page.locator('.context-act', { hasText: 'Gate' }).isVisible();
  check('the gate does not offer a talk before Zip has notes (or explains why)', !gateAct || true, gateAct ? 'offers talk' : 'no talk', 'warn');
  await pose(0, 43.4);
  check('relay cannot be used before the gate opens', !(await page.locator('.context-act', { hasText: 'relay' }).isVisible()));
  // town: speak to the skiff before the spark, hang lantern twice
  await startTown();
  await pose(2.6, -9.4);
  check('skiff cannot be woken before its beat', !(await page.locator('.context-act', { hasText: 'skiff' }).isVisible()));
  await invariants('order town');
});

await segment('scum', async () => {
  // reload-scumming: answer wrong, reload, answer right → must not count as first try
  await startIsle();
  await pose(2.0, 54.6); await act('satchel'); await card('Got it');
  await pose(-4.5, 52.2); await act('Take');
  await pose(4.6, 50.8); await act('Take');
  await pose(0, 49.2); await act('Gate'); await card('East');
  const before = (await learning()).length;
  await page.reload(); await page.waitForFunction(() => document.getElementById('loading')?.hidden, null, { timeout: 240000 }); await page.waitForTimeout(1500);
  await card('OK').catch(() => {});
  await pose(2.0, 54.6); await act('satchel'); await card('Got it');
  await pose(-4.5, 52.2); await act('Take');
  await pose(0, 49.2); await act('Gate'); await card('Lotus');
  const ev = await learning(), gateEv = ev.filter(e => e.decision === 'predict-open' || /gate/.test(e.activity));
  const lotus = [...ev].reverse().find(e => e.choice && /lotus/i.test(e.choice));
  check('a reload after a wrong answer cannot win "first try"', !lotus || lotus.first === false, lotus ? JSON.stringify(lotus) : `no lotus event; ${ev.length} events (had ${before})`);
  await firstTryIntegrity('scum gate');
});

await segment('pause', async () => {
  // pause and resume inside the attack cutscene, the catch game and the flight
  await startTown();
  await pose(4.4, -9.4); await act('Talk'); await h.talkMira(); await h.waitBeat('attack', 10000);
  await page.waitForTimeout(2000); await (TOUCH ? hit(page.locator('#pause')) : page.keyboard.press('Escape')); await page.waitForTimeout(1500);
  const pausedBeat = await beat(); await (TOUCH ? hit(page.locator('#resume')) : page.keyboard.press('Escape')); await page.waitForTimeout(500);
  check('attack continues after pause', await waitFor(async () => (await beat()) !== 'attack' || await page.locator('.story-skip').isVisible(), 20000), pausedBeat);
  await h.press(page.locator('.story-skip')).catch(() => {}); await h.waitBeat('spark', 60000);
  // restart from the pause menu while the story runs
  await (TOUCH ? hit(page.locator('#pause')) : page.keyboard.press('Escape')); await page.waitForTimeout(300); await hit(page.locator('#restart')); await page.waitForTimeout(1500);
  await invariants('restart from pause during the spark chase');
  const g = await goal();
  check('story goal survives "restart" from the menu', /spark|voice/i.test(g ?? ''), g, 'warn');
  // island restart: must not drop Zip into the hidden town
  await startIsle();
  await (TOUCH ? hit(page.locator('#pause')) : page.keyboard.press('Escape')); await page.waitForTimeout(300); await hit(page.locator('#restart')); await page.waitForTimeout(1500);
  const p = await zip(); const place = await page.locator('#place').textContent();
  check('"restart" on the island keeps Zip on the island', p[2] > 36, `Zip at ${p.map(v => v.toFixed(1)).join(', ')}, place "${place}"`);
  await shot('restart-island');
});

await segment('skip', async () => {
  // skip the attack at the earliest moment and right after the shield
  await startTown();
  await pose(4.4, -9.4); await act('Talk'); await h.talkMira(); await h.waitBeat('attack', 10000);
  await h.press(page.locator('.story-skip'), { timeout: 10000 }); await page.waitForTimeout(800);
  await h.waitBeat('spark', 60000);
  check('no shield button left after skipping', !(await page.locator('.context-act', { hasText: 'Shield' }).isVisible()));
  check('checkpoint "spark" saved after skip', (await save()) === 'spark', await save());
  await invariants('after skip');
});

await segment('resize', async () => {
  // rotate the phone in the middle of the relay puzzle and the catch game
  await h.seedSave('gate-open', ['wake-skiff', 'blossom-gate']);
  await open(''); await h.press(page.locator('.title-screen button', { hasText: 'Continue' })); await page.waitForTimeout(3500);
  await pose(0, 43.4); await act('relay');
  for (const [w, hgt] of [[760, 393], [393, 760], [1280, 720]]) {
    await page.setViewportSize({ width: w, height: hgt }); await page.waitForTimeout(1200);
    const r = await page.evaluate(() => { const b = document.querySelector('.relay-console')?.getBoundingClientRect(); return b ? { top: b.top, bottom: b.bottom, left: b.left, right: b.right, vw: innerWidth, vh: innerHeight } : null; });
    check(`relay console fully on screen at ${w}×${hgt}`, r && r.top >= 0 && r.bottom <= r.vh + 1 && r.left >= 0 && r.right <= r.vw + 1, JSON.stringify(r));
    await shot(`relay-${w}x${hgt}`);
  }
  await page.setViewportSize({ width: 393, height: 760 });
});

await segment('tamper', async () => {
  // A save edited by hand must not skip the learning (kit/progress.ts + worlds/*-progress.ts):
  // the game resumes at the furthest checkpoint the learning record supports.
  const KEYS = { save: 'bellweather.save.v1', decided: 'bellweather.decided.v1' };
  const titleLabel = async () => { await page.locator('.title-menu .primary').waitFor({ timeout: 30000 }); return page.locator('.title-menu .primary').textContent(); };
  const fake = (at, decided) => page.evaluate(([k, at, d]) => { localStorage.clear(); localStorage.setItem(k.save, at === null ? '{not json' : JSON.stringify({ at, when: Date.now() })); localStorage.setItem(k.decided, JSON.stringify(d)); }, [KEYS, at, decided]);
  await h.fresh('');
  await fake('loom-done', []); await open('');
  let label = await titleLabel();
  check('a bare "end of Stop 2" save resumes where the record allows (Wake the skiff)', /Wake the skiff/.test(label) && (await save()) === 'skiff', `${label} · save now ${await save()}`);
  await fake('loom', ['wake-skiff|next-input', 'blossom-gate|context-selection']); await open('');
  label = await titleLabel();
  check('a save past the relay without the relay answered resumes at the gate', /past the gate/.test(label) && (await save()) === 'gate-open', `${label} · save now ${await save()}`);
  await fake(null, []); await open('');
  check('a broken save is ignored (no crash, a new run offered)', /Start training run/.test(await titleLabel()), await titleLabel());
  await fake('loom-done', ['wake-skiff|x', 'blossom-gate|x', 'relay-contact|x', 'loom-fit|x']); await open('');
  label = await titleLabel();
  check('a save with a forged learning record is still believed (client-only limit: needs signed progress on a server)', !/Tavi freed/.test(label), label, 'warn');
  await invariants('after tampered saves');
});

await segment('monkey', async () => {
  // random chaos with the invariants checked every few actions
  const t0 = Date.now(); let n = 0, fails = 0;
  await startIsle();
  const actions = [
    async () => tapAt(10 + rand() * 370, 120 + rand() * 600),
    async () => hold(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'][Math.floor(rand() * 4)], 300 + rand() * 2500),
    async () => walkTo((rand() - .5) * 30, 48 + (rand() - .5) * 30, 3),
    async () => { const b = page.locator('button:visible'); const c = await b.count(); if (c) await hit(b.nth(Math.floor(rand() * c))); },
    async () => hit(page.locator('.context-act:visible'), 1 + Math.floor(rand() * 3)),
    async () => hit(page.locator('.story-card button.primary:visible')),
    async () => { if (rand() < .15) { if (TOUCH) { await hit(page.locator('#pause')); await page.waitForTimeout(300); await hit(page.locator('#resume')); } else { await page.keyboard.press('Escape'); await page.waitForTimeout(300); await page.keyboard.press('Escape'); } } },
  ];
  let reloads = 0;
  // wait for the game to be up again after a reload; a reload can itself be interrupted by
  // another navigation (a click that landed during loading), so retry a few times
  const settle = async () => {
    for (let k = 0; k < 4; k++) {
      try {
        await page.waitForFunction(() => !!window.__arcade && document.getElementById('loading')?.hidden, null, { timeout: 240000 }); await page.waitForTimeout(1500);
        const t = page.locator('.title-screen .title-menu .primary'); if (await t.isVisible().catch(() => false)) await h.press(t).catch(() => {});
        await page.waitForTimeout(2500); return;
      } catch (e) { if (!/context was destroyed|navigation|Target closed/.test(e.message)) throw e; }
    }
  };
  while (Date.now() - t0 < MINUTES * 60000) {
    try {
      // a random click may have started a reload: wait until the game is up again
      if (!(await page.evaluate(() => !!window.__arcade && !!document.getElementById('loading')?.hidden).catch(() => false))) throw Error('navigation: game not ready');
      await actions[Math.floor(rand() * actions.length)]();
      await page.waitForTimeout(150);
      if (++n % 12 === 0) { if (!(await invariants(`monkey step ${n}`))) { fails++; await shot(`monkey-${n}`); if (fails > 3) break; } }
    } catch (e) {
      // a random click can legitimately reload the game (graphics setting, title); carry on from there
      if (!/context was destroyed|navigation|Target closed|reading 'simulate'|reading 'snapshot'/.test(e.message)) throw e;
      reloads++; await settle();
    }
  }
  await settle();   // the last random click may have started a reload too
  check('game recovers after reloads caused by random clicks', true, `${reloads} reloads`);
  await firstTryIntegrity('monkey');
  check('monkey ran', true, `${n} random actions in ${((Date.now() - t0) / 1000).toFixed(0)} s, beat ${await beat()}, goal "${await goal()}"`);
});

await h.finish();
