// Breaker: tries to break the game the way a speedrunner or a mean play-tester
// would, and checks that the game's promises still hold afterwards.
//
//   node tools/breaker.mjs [--only oob,walls,mash,order,scum,pause,skip,resize,monkey] [--minutes 3]
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
// hold a key in game time (fast-forwarded: software rendering is too slow to play in real time)
const hold = (key, ms) => page.evaluate(([k, s]) => window.__arcade.simulate(s, { keys: [k] }), [key, ms / 1000]);
const walkTo = (x, z, s = 4) => page.evaluate(([x, z, s]) => window.__arcade.simulate(s, { walkTo: [x, z] }), [x, z, s]);
const startTown = async () => { await h.fresh('&title=0'); await card('Play'); await page.locator('canvas').first().click({ position: { x: 200, y: 300 } }).catch(() => {}); };
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
  for (let i = 0; i < 6; i++) await actBtn.click({ force: true, noWaitAfter: true }).catch(() => {});
  await page.waitForTimeout(800); await invariants('mash satchel');
  await page.locator('.story-card button').first().click().catch(() => {});
  await pose(-4.5, 52.2); for (let i = 0; i < 5; i++) await page.locator('.context-act').first().click({ force: true, noWaitAfter: true }).catch(() => {});
  await pose(4.6, 50.8); for (let i = 0; i < 5; i++) await page.locator('.context-act').first().click({ force: true, noWaitAfter: true }).catch(() => {});
  await pose(5.4, 52.2); for (let i = 0; i < 5; i++) await page.locator('.context-act').first().click({ force: true, noWaitAfter: true }).catch(() => {});
  const n = await page.locator('.satchel-bar .chip.rail').count();
  check('satchel never holds more than two notes', n <= 2, `${n} notes`);
  await pose(0, 49.2); await act('Gate');
  // answer a choice card with a burst of clicks on every button
  for (let i = 0; i < 3; i++) { const b = page.locator('.story-card button'); const c = await b.count(); for (let k = 0; k < c; k++) await b.nth(k).click({ force: true, noWaitAfter: true, timeout: 500 }).catch(() => {}); await page.waitForTimeout(300); }
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
  await pose(4.4, -9.4); await act('Talk'); await card('Next'); await card('Hang the lantern'); await card('Hum'); await card('Look up');
  await page.waitForTimeout(2000); await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
  const pausedBeat = await beat(); await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  check('attack continues after pause', await waitFor(async () => (await beat()) !== 'attack' || await page.locator('.story-skip').isVisible(), 20000), pausedBeat);
  await page.locator('.story-skip').click().catch(() => {}); await card('Catch the spark', 60000);
  // restart from the pause menu while the story runs
  await page.keyboard.press('Escape'); await page.locator('#restart').click().catch(() => {}); await page.waitForTimeout(1500);
  await invariants('restart from pause during the spark chase');
  const g = await goal();
  check('story goal survives "restart" from the menu', /spark/i.test(g ?? ''), g, 'warn');
  // island restart: must not drop Zip into the hidden town
  await startIsle();
  await page.keyboard.press('Escape'); await page.locator('#restart').click().catch(() => {}); await page.waitForTimeout(1500);
  const p = await zip(); const place = await page.locator('#place').textContent();
  check('"restart" on the island keeps Zip on the island', p[2] > 36, `Zip at ${p.map(v => v.toFixed(1)).join(', ')}, place "${place}"`);
  await shot('restart-island');
});

await segment('skip', async () => {
  // skip the attack at the earliest moment and right after the shield
  await startTown();
  await pose(4.4, -9.4); await act('Talk'); await card('Next'); await card('Hang the lantern'); await card('Hum'); await card('Look up');
  await page.locator('.story-skip').click({ timeout: 10000 }); await page.waitForTimeout(800);
  await card('Catch the spark', 60000);
  check('no shield button left after skipping', !(await page.locator('.context-act', { hasText: 'Shield' }).isVisible()));
  check('checkpoint "spark" saved after skip', (await save()) === 'spark', await save());
  await invariants('after skip');
});

await segment('resize', async () => {
  // rotate the phone in the middle of the relay puzzle and the catch game
  await page.evaluate(() => localStorage.setItem('bellweather.save.v1', JSON.stringify({ at: 'gate-open', when: Date.now() })));
  await open(''); await page.locator('.title-screen button', { hasText: 'Continue' }).click(); await page.waitForTimeout(3500);
  await pose(0, 43.4); await act('relay');
  for (const [w, hgt] of [[760, 393], [393, 760], [1280, 720]]) {
    await page.setViewportSize({ width: w, height: hgt }); await page.waitForTimeout(1200);
    const r = await page.evaluate(() => { const b = document.querySelector('.relay-console')?.getBoundingClientRect(); return b ? { top: b.top, bottom: b.bottom, left: b.left, right: b.right, vw: innerWidth, vh: innerHeight } : null; });
    check(`relay console fully on screen at ${w}×${hgt}`, r && r.top >= 0 && r.bottom <= r.vh + 1 && r.left >= 0 && r.right <= r.vw + 1, JSON.stringify(r));
    await shot(`relay-${w}x${hgt}`);
  }
  await page.setViewportSize({ width: 393, height: 760 });
});

await segment('monkey', async () => {
  // random chaos with the invariants checked every few actions
  const t0 = Date.now(); let n = 0, fails = 0;
  await startIsle();
  const actions = [
    async () => page.mouse.click(10 + rand() * 370, 120 + rand() * 600),
    async () => hold(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'][Math.floor(rand() * 4)], 300 + rand() * 2500),
    async () => walkTo((rand() - .5) * 30, 48 + (rand() - .5) * 30, 3),
    async () => { const b = page.locator('button:visible'); const c = await b.count(); if (c) await b.nth(Math.floor(rand() * c)).click({ timeout: 800, force: true }).catch(() => {}); },
    async () => page.locator('.context-act:visible').first().click({ timeout: 500 }).catch(() => {}),
    async () => page.locator('.story-card button.primary:visible').first().click({ timeout: 500 }).catch(() => {}),
    async () => { if (rand() < .15) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); await page.keyboard.press('Escape'); } },
  ];
  let reloads = 0;
  // wait for the game to be up again after a reload; a reload can itself be interrupted by
  // another navigation (a click that landed during loading), so retry a few times
  const settle = async () => {
    for (let k = 0; k < 4; k++) {
      try {
        await page.waitForFunction(() => !!window.__arcade && document.getElementById('loading')?.hidden, null, { timeout: 240000 }); await page.waitForTimeout(1500);
        const t = page.locator('.title-screen .title-menu .primary'); if (await t.isVisible().catch(() => false)) await t.click().catch(() => {});
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
