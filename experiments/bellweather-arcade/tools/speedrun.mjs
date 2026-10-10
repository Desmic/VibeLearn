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
// Game-agnostic: stations, rules and progress come from the game's manifest (src/game.ts). The
// one game-specific piece is the story between stations (talk to someone, board, fly), which
// the game writes in its tests module (manifest.tests: speedrunRoute). Each station inside it
// plays from its rules alone.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { harness, arg } from './harness.mjs';
import { perfectRun, explore, distances, goodMoves } from './lib/solve.mjs';

const ROOT = arg('root', 'out');
const h = await harness({ title: 'Speedrun', outDefault: 'speedrun', tool: 'speedrun', lane: 'world' });
const { page, check, shot, save, beat, goal, segment, GAME } = h;
// ---- what the game's manifest declares: learning stations, their rules, the progress spec
const { GameRulesEngine } = await import(pathToFileURL(resolve(ROOT, 'src/kit/game-rules.js')).href);
const stations = GAME.stations.map(s => ({ id: s.id, name: s.name, decisions: (s.decisions ?? []).map(d => d.id) }));
const progress = [GAME.progress], rulesById = Object.fromEntries(GAME.rules.map(r => [r.id, r]));
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
const follow = async (re, { maxSecs = 120, quiet = false, explore = false } = {}) => {   // (no marker, or explore: it explores)
  const want0 = typeof re === 'function' ? re : async () => re.test((await actLabel()) ?? '');
  const want = async () => { await seeWorld(); return want0(); };
  const start = await clock(); let explored = false;
  while ((await clock()) - start < maxSecs) {
    if (await want()) { const label = await actLabel(); await h.act(label.slice(0, 18)); await sim(1.2); await note('act ' + label); return label; }   // let it land before the next action
    const b = explore ? null : await beacon();
    if (!b) {
      // no marker (e.g. "Read the notes"): explore like a player: walkable spots in widening rings, nearest first
      if (!explored) {
        explored = true;
        const spots = await page.evaluate(() => { const z = window.__arcade.snapshot().position, out = []; for (let r = 1.5; r <= 15; r += 1.5) for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, x = z[0] + Math.cos(a) * r, y = z[2] + Math.sin(a) * r; if (window.__arcade.walkable(x, y)) out.push([x, y]); } return out; });
        const seen = [];
        while (spots.length && (await clock()) - start < maxSecs) {
          const here = await h.player(); spots.sort((p, q) => Math.hypot(p[0] - here[0], p[1] - here[2]) - Math.hypot(q[0] - here[0], q[1] - here[2]));
          const sp = spots.shift(); if (seen.some(v => Math.hypot(v[0] - sp[0], v[1] - sp[1]) < 1.2)) continue; seen.push(sp);
          const w = await h.walkTo(sp, { until: want, near: .4, maxSecs: 8 }); if (w.reason === 'until' || await want()) break;
        }
        continue;
      }
      await sim(.5); continue;
    }
    // the marker is often on a person or a prop: get as close as the ground allows (actions reach a few metres)
    let r;
    for (const near of [1, 1.6, 2.5, 3.5, 5, 7]) { r = await h.walkTo(b, { until: want, near, maxSecs: 40 }); if (r.ok || !r.reason.startsWith('unreachable')) break; }
    if (!r.ok && r.reason.startsWith('unreachable')) { if (!quiet) check(`goal marker reachable on foot: "${await goal()}"`, false, `${r.reason} at ${b.map(v => v.toFixed(1))}`); return null; }
    if (r.reason === 'arrived' && !(await want())) {
      // at the marker but another action is offered (one prompt at a time: the nearest thing wins).
      // Look for a standing spot around the marker where the wanted action is offered.
      const atMarker = await actLabel(), from = await h.player();
      const spots = await page.evaluate(([bx, bz]) => { const out = []; for (const rr of [1, 1.5, 2, 2.5, 3, 3.5]) for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, x = bx + Math.cos(a) * rr, z = bz + Math.sin(a) * rr; if (window.__arcade.walkable(x, z)) out.push([x, z]); } return out.slice(0, 40); }, b);
      let found = false;
      for (const sp of spots) { if ((await clock()) - start > maxSecs) break; const w = await h.walkTo(sp, { until: want, near: .3, maxSecs: 6 }); if (w.reason !== 'until') await sim(.3); if (await want()) { found = true; break; } }
      if (!found) { if (!quiet) check(`the action ${re} is offered somewhere near the goal marker`, false, `tried ${spots.length} spots; action "${await actLabel()}"`); return null; }
      const here = await h.player(), d = Math.hypot(here[0] - b[0], here[2] - b[1]).toFixed(1), g = await goal();
      findings.add(atMarker
        ? `"${g}": at the marker the prompt offered "${atMarker}" (nearer); the wanted "${await actLabel()}" only from (${here[0].toFixed(1)}, ${here[2].toFixed(1)}), ${d} m from the marker.`
        : `"${g}": nothing is offered where the marker leads; "${await actLabel()}" only from (${here[0].toFixed(1)}, ${here[2].toFixed(1)}), ${d} m from the marker (it led to (${from[0].toFixed(1)}, ${from[2].toFixed(1)})).`);
    } else if (r.reason === 'arrived') await sim(.5);
  }
  if (!quiet) check(`found the action ${re} near the goal marker`, false, `goal "${await goal()}", action now "${await actLabel()}"`);
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
/** Play a learning station from its rules alone: the answer key (tools/lib/solve.mjs) says which
 *  rules actions to send; every control that sends one is tagged data-action (docs/TEST-CONTRACT.md).
 *  Nothing here knows this game's puzzles: a generated game's stations play the same way. */
const playStation = async (id) => {
  const rulesId = await page.evaluate(id => window.__vlStations?.[id]?.spec.rules, id);
  const spec = rulesById[rulesId]; if (!spec) { check(`station "${id}" found with its rules`, false, String(rulesId), 'fail', 'learning'); return; }
  const key = perfectRun(GameRulesEngine, spec), label = await page.evaluate(id => window.__vlStations[id].spec.action, id);
  if (VERBOSE) console.log(`  · station ${id}: ${key.join(' → ')}`);
  // Re-plan from the live rules state at every step, like a player who knows the rules: take any
  // move that keeps a shortest no-mistake path (moves that commute, e.g. which word first, all
  // count). World prompts first; the station's own opener only when no good move is out in the world.
  const g = explore(GameRulesEngine, spec), dist = distances(g);
  const live = () => page.evaluate(id => window.__vlStations[id].state, id);
  for (let step = 0; step < key.length * 8; step++) {
    const { at, left, moves } = goodMoves(g, dist, await live());
    if (at < 0) { check(`station "${id}": the live state is one the rules can reach`, false, JSON.stringify(await live()), 'fail', 'learning'); return; }
    if (left === 0) break;
    if (!moves.length) { check(`station "${id}": a no-mistake move exists from here`, false, `state ${JSON.stringify(await live())}`, 'fail', 'learning'); return; }
    // 1) a tagged control on screen for a good move (if it's there but disabled, the UI is busy: wait for it)
    let pressed = false;
    for (const a of moves) {
      const any = page.locator(`[data-action="${a}"]:visible`).first();
      if (!(await any.count())) continue;
      // (busy UIs animate in real time, not game time: wait on both)
      for (let k = 0; k < 40 && await any.isDisabled().catch(() => false); k++) { await sim(.1); await page.waitForTimeout(500); }
      const ctl = page.locator(`[data-action="${a}"]:visible:not([disabled])`).first();
      if (!(await ctl.count())) continue;
      if (await ctl.evaluate(e => e.classList.contains('context-act'))) await h.act(); else await h.press(ctl);
      await sim(.6); pressed = true; break;
    }
    if (pressed) continue;
    // 2) a dialogue or a "got it" screen in the way: read on (navigation only, never a tagged choice)
    if (await cardOpen()) { await answer([], 1); continue; }
    const nav = page.locator('.loom-console button.primary:not([data-action]):visible, .relay-console button.primary:not([data-action]):visible').first();
    if (await nav.count()) { await h.press(nav); await sim(.6); continue; }
    // a tagged control on screen is disabled: the puzzle UI is busy (an animation): wait for it, in game and real time
    if (await page.locator('[data-action]:visible:disabled').count()) {
      for (let k = 0; k < 40 && await page.locator('[data-action]:visible:disabled').count(); k++) { await sim(.1); await page.waitForTimeout(500); if (await page.locator(moves.map(a => `[data-action="${a}"]:visible:not([disabled])`).join(',')).count()) break; }
      continue;
    }
    // a puzzle UI is open but its next controls haven't appeared yet (a message playing): wait for them
    if (await page.evaluate(() => !!document.querySelector('.puzzle-mode, .engine-mode'))) {
      let seen = false;
      for (let k = 0; k < 30 && !seen; k++) { await sim(.1); await page.waitForTimeout(500); seen = !!(await page.locator(moves.map(a => `[data-action="${a}"]:visible`).join(',')).count()) || (await cardOpen()) || !!(await nav.count()); }
      if (seen) continue;
    }
    // the game may be doing the move itself (an animation finishing): give it a moment
    if (await until(async () => goodMoves(g, dist, await live()).left < left, 2)) continue;
    // a card on a real-time timer (the Gate reads the notes in, then speaks): wait a moment in real time
    { const ready = async () => (await cardOpen()) || !!(await page.locator(moves.map(a => `[data-action="${a}"]:visible`).join(',')).count());
      let r = await ready(); for (let k = 0; k < 8 && !r; k++) { await page.waitForTimeout(400); r = await ready(); } if (r) continue; }
    // 3) the station's own prompt is up and the goal marker is right here: open it (a player follows the goal)
    // Open it when its own move is a good one, or when no good move is of a kind seen out in the world
    // (learned while walking: "absorb…", "take…" are prompts in the world; "load…", "lift…" are inside)
    const openerOK = async () => { const m = await page.evaluate(() => document.querySelector('.context-act:not([hidden])')?.dataset.action ?? null), now = goodMoves(g, dist, await live()).moves; return (await actLabel()) === label && (m ? now.includes(m) : !now.some(x => worldKinds.has(kind(x)))); };
    if (await openerOK()) { await h.act(); await sim(.6); continue; }
    // 4) out in the world: walk to where a good move's prompt appears
    const inWorld = async () => { const a = await page.evaluate(() => document.querySelector('.context-act:not([hidden])')?.dataset.action ?? null); return !!a && goodMoves(g, dist, await live()).moves.includes(a); };
    // one walk that stops at whichever comes first: a good move's prompt, or the station's opener (when opening is right)
    if (await follow(async () => (await inWorld()) || (await openerOK()), { maxSecs: 60, quiet: true }) !== null) continue;
    // 4b) the goal points elsewhere (it shouldn't give the answer away: e.g. to the Gate once every note
    // is read): a player who knows what they still need goes looking for it
    if (moves.some(x => worldKinds.has(kind(x))) && await follow(async () => await inWorld(), { maxSecs: 90, quiet: true, explore: true }) !== null) { findings.add(`station "${id}": a needed move (${moves.join(' / ')}) was found by looking round, not where the goal pointed ("${await goal()}")`); continue; }
    // 5) not in the world: open the station with its own prompt
    if (await follow(async () => { const m = await page.evaluate(() => document.querySelector('.context-act:not([hidden])')?.dataset.action ?? null); return (await actLabel()) === label && (!m || goodMoves(g, dist, await live()).moves.includes(m)); }, { maxSecs: 45, quiet: true }) !== null) continue;
    check(`station "${id}": found a control for one of ${moves.join(', ')}`, false, `goal "${await goal()}", action "${await actLabel()}"`, 'fail', 'learning'); return;
  }
  const end = goodMoves(g, dist, await live());
  if (!check(`station "${id}" played from its rules (every move from a tagged control)`, end.left === 0, end.left === 0 ? `${key.length} moves` : `${end.left} moves left; history ${JSON.stringify(await page.evaluate(id => window.__vlStations[id].history, id))}`, 'fail', 'learning')) return;
  await note('station ' + id);
};
const findings = new Set();
/** kinds of rules move seen as in-world prompts (the part before the first dot) */
const worldKinds = new Set(), kind = a => a.split('.')[0];
const seeWorld = async () => { const a = await page.evaluate(() => document.querySelector('.context-act:not([hidden])')?.dataset.action ?? null); if (a) worldKinds.add(kind(a)); return a; };   // things a player would feel, worth a design look (not failures)
const chip = (scope, w) => page.locator(`${scope} .chip, ${scope} .holo-chip`, { hasText: new RegExp('^' + w + '$') });

// ---- the route: the game's own story between stations (manifest.tests → speedrunRoute).
// Every learning station inside it plays from its rules (playStation above).
if (!h.speedrunRoute) throw Error(`${GAME.tests} has no speedrunRoute: write the story between stations there`);
await segment('run', async () => {
  await h.fresh(); t0.game = await clock(); t0.real = Date.now();
  await h.speedrunRoute({ follow, answer, until, sim, note, beacon, visible, playStation, skipCutscene, beat, goal, check, shot });
});

// ---- what the run proves
await segment('report', async () => {
  const log = await h.learningLog();
  for (const st of stations) {
    const ev = log.filter(e => e.activity === st.id);
    check(`learning can't be skipped: "${st.name}" answered`, ev.length > 0, `${ev.length} answers; decisions asked: ${[...new Set(ev.map(e => e.decision))].join(', ') || 'none'} of ${st.decisions.join(', ')}`, 'fail', 'learning');
    const firstWrong = ev.filter(e => e.first && !e.correct);
    if (ev.length) check(`"${st.name}": the right answer counts as a first try`, !firstWrong.length, firstWrong.map(e => e.decision + ':' + e.choice).join(', ') || 'all first tries correct', 'warn', 'learning');
  }
  const answered = new Set(log.map(e => e.activity));
  for (const p of progress) for (const r of reached) {
    const need = p.requires[r.at] ?? [];   // the record at the end covers the whole run
    check(`checkpoint "${r.at}" earned (${need.join(', ') || 'nothing required'})`, need.every(s => answered.has(s)), need.filter(s => !answered.has(s)).join(', '), 'fail', 'learning');
  }
  const total = reached.length ? reached[reached.length - 1].t : 0;
  console.log('\nPACING (game seconds from Start)\n' + reached.map(r => `  ${r.at.padEnd(10)} ${String(r.t).padStart(7)} s   (real ${r.real} s)`).join('\n'));
  console.log('BEATS\n' + beats.map((b, i) => `  ${String(b.beat).padEnd(12)} from ${String(b.t).padStart(7)} s${beats[i + 1] ? `  (${(beats[i + 1].t - b.t).toFixed(1)} s)` : ''}`).join('\n'));
  writeFileSync(`${h.OUT}/pacing.json`, JSON.stringify({ when: new Date().toISOString(), input: h.INPUT, total, checkpoints: reached, beats, stations: stations.map(s => ({ id: s.id, answers: log.filter(e => e.activity === s.id).length })) }, null, 1));
  for (const f of findings) check('design note: ' + f, false, '', 'warn');
  const lost = h.report.results.filter(r => r.lane === 'world' && r.status === 'fail').length;
  check('every goal on the route reached on foot, its action offered where the goal pointed', !lost, lost ? `${lost} failures above` : `${reached.length} checkpoints walked`, 'fail', 'world');
  check(`speedrun total ${total} game seconds (Start to the end)`, total > 0, '', 'fail', 'pacing');
});
await h.finish();
