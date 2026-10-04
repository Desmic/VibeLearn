// Speedrun bot: plays the whole game the fastest legal way a player could — walking (a path
// planned over the game's own walkable ground, never teleporting), skipping every cutscene,
// reading nothing, answering every puzzle right the first time — and times it in game seconds.
//
//   bash tools/build.sh && node tools/speedrun.mjs [--input touch|keyboard] [--out speedrun]
//
// What it reports (and why it matters for a learning game):
//  - LEARNING COVERAGE (from data): every learning station the game declares
//    (worlds/*: kind 'station') must have answers logged by the end. A station with none
//    means a speedrunner got past it without learning: FAIL.
//  - EARNED PROGRESS: at each checkpoint the stations its progress spec requires
//    (worlds/*-progress.ts, kit/progress.ts) are answered: FAIL otherwise.
//  - REACHABLE GOALS: every goal marker can be reached on foot: FAIL with the goal's name.
//  - PACING: game seconds to each checkpoint and per beat; the floor a skilled player can't beat.
//    Compare runs over time: a stop that gets much shorter may have lost its learning.
//
// Game-agnostic except ROUTE below: the puzzle answers and which action to take where. When
// an agent builds a new game, it writes that game's ROUTE from the rules data; the rest stays.
import { readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { harness, arg } from './harness.mjs';

const ROOT = arg('root', 'out');
const mod = p => import(pathToFileURL(resolve(ROOT, 'src', p)).href);
// ---- what the game's data declares: learning stations and the progress spec
const stations = [], progress = [];
for (const f of readdirSync(resolve(ROOT, 'src/worlds')).filter(f => f.endsWith('.js'))) {
  const m = await mod('worlds/' + f);
  for (const v of Object.values(m)) {
    for (const s of (Array.isArray(v) ? v : [v])) if (s && typeof s === 'object' && s.kind === 'station' && !stations.some(x => x.id === s.id)) stations.push({ id: s.id, name: s.name, decisions: (s.decisions ?? []).map(d => d.id) });
    if (v && typeof v === 'object' && Array.isArray(v.order) && v.requires) progress.push(v);
  }
}

const h = await harness({ title: 'Speedrun', outDefault: 'speedrun' });
const { page, check, shot, save, beat, goal, segment } = h;
const clock = () => page.evaluate(() => window.__arcade.snapshot().elapsed);
const sim = s => page.evaluate(s => window.__arcade.simulate(s), s);
const visible = sel => page.evaluate(sel => { const e = document.querySelector(sel); return !!e && !e.hidden && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden'; }, sel);
const actLabel = () => page.evaluate(() => { const a = document.querySelector('.context-act'); return a && !a.hidden ? (a.dataset.label || a.textContent) : null; });
const beacon = () => page.evaluate(() => { const b = window.__vlGuide.beaconAt; return b ? [b.x, b.z] : null; });
const cardOpen = () => page.evaluate(() => window.__vlGuide.cardOpen);

// ---- timeline: when each checkpoint was first saved, in game seconds
const t0 = { game: 0, real: Date.now() }, reached = [], beats = [];
let lastBeat = null;
const VERBOSE = process.argv.includes('--verbose');
const note = async (what = '') => {
  const [at, b, t] = [await save(), await beat(), await clock()];
  if (VERBOSE) console.log(`  · ${(t - t0.game).toFixed(1)}s ${what} beat=${b} save=${at} goal="${await goal()}" act="${await actLabel()}" card=${await cardOpen()}`);
  if (at && !reached.some(r => r.at === at)) reached.push({ at, t: +(t - t0.game).toFixed(1), real: Math.round((Date.now() - t0.real) / 1000) });
  if (b !== lastBeat) { beats.push({ beat: b, t: +(t - t0.game).toFixed(1) }); lastBeat = b; }
};
/** fast-forward game time until fn() (or `max` game seconds) */
const until = async (fn, max = 30) => { for (let s = 0; s < max; s += .5) { if (await fn()) return true; await sim(.5); } return !!(await fn()); };
/** skip whatever cutscene is up */
const skipCutscene = async () => { if (await visible('.story-skip')) { await h.press(page.locator('.story-skip')); await page.waitForTimeout(300); } };
/** walk toward the goal marker until an action matching `re` is offered, then take it */
const follow = async (re, { maxSecs = 120 } = {}) => {
  const want = async () => re.test((await actLabel()) ?? '');
  const start = await clock();
  while ((await clock()) - start < maxSecs) {
    if (await want()) { const label = await actLabel(); await h.act(label.slice(0, 18)); await sim(1.2); await note('act ' + label); return label; }   // let it land before the next action
    const b = await beacon();
    if (!b) { await sim(.5); continue; }
    // the marker is often on a person or a prop: get as close as the ground allows (actions reach a few metres)
    let r;
    for (const near of [1, 1.6, 2.5, 3.5, 5, 7]) { r = await h.walkTo(b, { until: want, near, maxSecs: 40 }); if (r.ok || !r.reason.startsWith('unreachable')) break; }
    if (!r.ok && r.reason.startsWith('unreachable')) { check(`goal marker reachable on foot: "${await goal()}"`, false, `${r.reason} at ${b.map(v => v.toFixed(1))}`); return null; }
    if (r.reason === 'arrived' && !(await want())) {
      // at the marker but another action is offered (one prompt at a time: the nearest thing wins).
      // Look for a standing spot around the marker where the wanted action is offered.
      const atMarker = await actLabel(), from = await h.zip();
      const spots = await page.evaluate(([bx, bz]) => { const out = []; for (const rr of [1, 1.5, 2, 2.5, 3, 3.5]) for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, x = bx + Math.cos(a) * rr, z = bz + Math.sin(a) * rr; if (window.__arcade.walkable(x, z)) out.push([x, z]); } return out.slice(0, 40); }, b);
      let found = false;
      for (const sp of spots) { const w = await h.walkTo(sp, { until: want, near: .3, maxSecs: 6 }); if (w.reason !== 'until') await sim(.3); if (await want()) { found = true; break; } }
      if (!found) { check(`the action ${re} is offered somewhere near the goal marker`, false, `tried ${spots.length} spots; action "${await actLabel()}"`); return null; }
      const here = await h.zip(), d = Math.hypot(here[0] - b[0], here[2] - b[1]).toFixed(1), g = await goal();
      findings.add(atMarker
        ? `"${g}": at the marker the prompt offered "${atMarker}" (nearer); the wanted "${await actLabel()}" only from (${here[0].toFixed(1)}, ${here[2].toFixed(1)}), ${d} m from the marker.`
        : `"${g}": nothing is offered where the marker leads; "${await actLabel()}" only from (${here[0].toFixed(1)}, ${here[2].toFixed(1)}), ${d} m from the marker (it led to (${from[0].toFixed(1)}, ${from[2].toFixed(1)})).`);
    } else if (r.reason === 'arrived') await sim(.5);
  }
  check(`found the action ${re} near the goal marker`, false, `goal "${await goal()}", action now "${await actLabel()}"`);
  return null;
};
/** answer the open cards: the first choice matching a preference, else read on / first choice */
const answer = async (prefs = [], max = 8) => {
  const picked = [];
  await until(cardOpen, 4);   // a line often opens a moment after the action that starts it
  for (let i = 0; i < max && await cardOpen(); i++) {
    const labels = await page.locator('.story-card:not([hidden]) button').evaluateAll(bs => bs.map(b => (b.getAttribute('aria-label') || b.textContent).trim()));
    const hit = prefs.find(p => labels.some(l => p.test(l)));
    const label = hit ? labels.find(l => hit.test(l)) : labels[0];
    picked.push(label); await h.card(label.slice(0, 24)); await note('card ' + label);
  }
  return picked;
};
const findings = new Set();   // things a player would feel, worth a design look (not failures)
const chip = (scope, w) => page.locator(`${scope} .chip, ${scope} .holo-chip`, { hasText: new RegExp('^' + w + '$') });

// ---- ROUTE (game-specific): The First Words, start to the end of Stop 2, the fastest correct way
await segment('run', async () => {
  await h.fresh(); t0.game = await clock(); t0.real = Date.now();
  await h.press(page.locator('.title-menu .primary')); await page.waitForTimeout(800);
  await h.skipOpening(); await note();
  // Meet Mira, hang the lantern, sit through nothing
  await follow(/Talk/); await answer([/Beep/]);
  await follow(/Hang/); await answer([/Beep/]);
  await until(async () => (await beat()) === 'attack', 20); await note();
  await until(() => visible('.story-skip'), 10); await skipCutscene();
  await until(async () => (await beat()) === 'spark', 20); await note();
  // Catch the spark (it moves: keep re-planning toward it)
  for (let i = 0; i < 60 && (await beat()) === 'spark'; i++) { const b = await beacon(); if (b) await h.walkTo(b, { near: .3, maxSecs: 3, until: async () => (await beat()) !== 'spark' }); await sim(.4); }
  check('caught the spark', (await beat()) === 'skiff', await beat()); await note();
  // Wake the skiff: the three words it needs (never the decoy), then the engine, right first time
  for (let i = 0; i < 3; i++) await follow(/Absorb “(rise|toward|Skiff)”/);
  await follow(/engine/); await page.waitForTimeout(600);
  for (const w of ['Skiff', 'rise', 'toward']) await h.press(chip('.engine-tray', w));
  await h.press(page.locator('.holo-cast')); await sim(4.5);
  await h.press(chip('.engine-tray', 'Blossom')); await h.press(page.locator('.holo-cast'));
  await until(() => visible('.star-row'), 30); await note(); await h.stars(); await answer([/Board/]);
  // Fly to Blossom Isle (the flight ends by itself)
  await until(() => visible('.star-row'), 240); await note(); await h.stars();
  // Blossom Isle: satchel, only Mira's page, the gate
  await answer([/OK/]);
  await follow(/satchel/); await answer([/Got it/]);
  const r = await h.walkTo([-4.5, 52.2], { until: async () => /Take/.test((await actLabel()) ?? ''), near: 1.4 });
  if (r.reason === 'until') await h.act(); else check('reached Mira\'s map page', false, r.reason);
  await follow(/Gate/); await answer([/Lotus/, /Yes/]);
  await until(() => visible('.star-row'), 10); await note(); await h.stars();
  // The relay: Mira's channel first time
  await follow(/relay/);
  await h.press(page.locator('.relay-tick[data-ch="7"]')); await h.press(page.locator('.relay-console button', { hasText: 'Call' }));
  await page.locator('.relay-console .chip', { hasText: 'Channel' }).waitFor({ timeout: 20000 });
  for (const w of ['Channel', 'Mira', "it's"]) await h.press(page.locator('.relay-console .chip', { hasText: w }));
  await h.press(page.locator('.relay-console button', { hasText: 'Send' })); await page.waitForTimeout(600);
  await answer([/coming/]); await until(() => visible('.star-row'), 10); await note(); await h.stars();
  // Stop 2: board, fly over, free Tavi with the right call first time
  await follow(/Board/); await answer([/Onward/]); await until(async () => /Loom Isle/.test(await page.locator('#place').textContent()), 30); await note();
  await follow(/Word Loom/); await answer([/help/, /Show me/]);
  for (const w of ['Free', 'the', 'weaver']) await h.press(chip('.loom-console', w));
  await h.press(page.locator('.loom-console button', { hasText: 'Got it' }));
  const nine = page.locator('.loom-console button', { hasText: /^9$/ });
  if (await nine.count()) await h.press(nine); else check('the loom offers the right count (9) to predict', false, 'no "9" button', 'warn');
  await page.waitForTimeout(600);
  if (await page.locator('.loom-console button', { hasText: 'shorter' }).count()) await h.press(page.locator('.loom-console button', { hasText: 'shorter' }));
  await h.press(page.locator('.loom-choice', { hasText: 'Please' }));
  await until(() => visible('.star-row'), 20); await note(); await h.stars();
  await answer([/What is it/, /Thanks/]); await until(async () => /Stop 2 for now/.test(await goal() ?? ''), 10); await note();
  check('reached the end of Stop 2', /Stop 2 for now/.test(await goal() ?? ''), await goal());
  await shot('end');
});

// ---- what the run proves
await segment('report', async () => {
  const log = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('bellweather.learning.v1') || '[]'); } catch { return []; } });
  for (const st of stations) {
    const ev = log.filter(e => e.activity === st.id);
    check(`learning can't be skipped: "${st.name}" answered`, ev.length > 0, `${ev.length} answers; decisions asked: ${[...new Set(ev.map(e => e.decision))].join(', ') || 'none'} of ${st.decisions.join(', ')}`);
    const firstWrong = ev.filter(e => e.first && !e.correct);
    if (ev.length) check(`"${st.name}": the right answer counts as a first try`, !firstWrong.length, firstWrong.map(e => e.decision + ':' + e.choice).join(', ') || 'all first tries correct', 'warn');
  }
  const answered = new Set(log.map(e => e.activity));
  for (const p of progress) for (const r of reached) {
    const need = p.requires[r.at] ?? [];   // the record at the end covers the whole run
    check(`checkpoint "${r.at}" earned (${need.join(', ') || 'nothing required'})`, need.every(s => answered.has(s)), need.filter(s => !answered.has(s)).join(', '));
  }
  const total = reached.length ? reached[reached.length - 1].t : 0;
  console.log('\nPACING (game seconds from Start)\n' + reached.map(r => `  ${r.at.padEnd(10)} ${String(r.t).padStart(7)} s   (real ${r.real} s)`).join('\n'));
  console.log('BEATS\n' + beats.map((b, i) => `  ${String(b.beat).padEnd(12)} from ${String(b.t).padStart(7)} s${beats[i + 1] ? `  (${(beats[i + 1].t - b.t).toFixed(1)} s)` : ''}`).join('\n'));
  writeFileSync(`${h.OUT}/pacing.json`, JSON.stringify({ when: new Date().toISOString(), input: h.INPUT, total, checkpoints: reached, beats, stations: stations.map(s => ({ id: s.id, answers: log.filter(e => e.activity === s.id).length })) }, null, 1));
  for (const f of findings) check('design note: ' + f, false, '', 'warn');
  check(`speedrun total ${total} game seconds (Start to end of Stop 2)`, total > 0, '');
});
await h.finish();
