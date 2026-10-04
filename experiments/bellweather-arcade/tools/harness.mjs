// Shared harness for automated game checks (flowcheck, breaker, speedrun, timing, mixcheck):
// serves the built game, opens a headless browser shaped like the test's player (phone or
// laptop), gives small helpers that drive the game through its own UI and the hooks of the
// test contract (docs/TEST-CONTRACT.md), and writes a report (tools/lib/report.mjs).
// Game-agnostic: names, storage keys and the entry query come from the game's manifest
// (src/game.ts); a game's own helpers (its route, its scenes) come from manifest.tests and are
// added to `h` (e.g. h.skipOpening).
import { chromium } from 'playwright';
import { loadGame } from './lib/game.mjs';
import { createReport } from './lib/report.mjs';
import { mkdirSync, writeFileSync, createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';

export const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };

export async function harness({ title, outDefault, tool, lane = 'flow' }) {
  const OUT = arg('out', outDefault); mkdirSync(OUT, { recursive: true });
  const ONLY = arg('only', '') ? new Set(arg('only', '').split(',')) : null;
  let BASE = arg('base', ''); const ROOT = arg('root', 'out');
  const { GAME, tests } = await loadGame(ROOT), KEYS = GAME.storage;
  tool ??= path.basename(process.argv[1] ?? 'check', '.mjs');
  let server;
  if (!BASE) {
    const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain' };
    server = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p);
      if (!existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' }); createReadStream(f).pipe(res);
    }).listen(0);
    BASE = 'http://localhost:' + server.address().port;
  }
  const results = [], shots = [], errors = [], logs = [];
  const state = { current: 'setup' };
  const INPUT = arg('input', 'mouse');
  const report = createReport({ tool, lane, input: INPUT, root: ROOT, game: GAME.id });
  /** a result: `lane` overrides the tool's lane (e.g. a speedrun result about learning) */
  const check = (name, ok, detail = '', severity = 'fail', resultLane) => {
    results.push({ segment: state.current, name, ok: !!ok, severity, detail: String(detail).slice(0, 400) });
    report.add(ok ? 'pass' : severity === 'warn' ? 'warn' : 'fail', name, { lane: resultLane, detail, segment: state.current, evidence: ok ? [] : shots.filter(f => f.includes(`-${state.current}-`)).slice(-1),
      repro: `node tools/${tool}.mjs --input ${INPUT}${state.current && !['setup', 'all'].includes(state.current) ? ' --only ' + state.current : ''}` });
    console.log(`${ok ? 'PASS' : severity === 'warn' ? 'WARN' : 'FAIL'} [${state.current}] ${name}${detail ? ' — ' + String(detail).slice(0, 180) : ''}`);
    return !!ok;
  };
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  // How the test player acts (--input): 'mouse' (clicks; the old default), 'keyboard' (a laptop:
  // E to act, Space to read on, number keys to choose, WASD), or 'touch' (a phone: taps and the
  // thumb stick). Keyboard runs on a laptop-shaped screen; the others on a phone-shaped one.
  const desk = INPUT === 'keyboard';
  const ctx = await browser.newContext({ viewport: desk ? { width: 1024, height: 640 } : { width: 393, height: 760 }, deviceScaleFactor: 1, hasTouch: !desk, isMobile: INPUT === 'touch' });
  const page = await ctx.newPage(); page.setDefaultTimeout(60000);
  page.on('pageerror', e => errors.push({ segment: state.current, msg: e.message }));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error') errors.push({ segment: state.current, msg: t }); if (/^\[(kit|learning|prop|budget)\]/.test(t)) logs.push(t); });

  const Q = GAME.testEntry;
  let cdp = null;
  // In-page path planner (game-agnostic: needs only __arcade.walkable and snapshot). A* on a
  // 0.25 m grid over a box around the player and the target; the goal is the walkable cell nearest the
  // target within `near` m (targets are often solid: a person, a stone). Line-of-sight smoothing.
  const NAV = () => { window.__vlTestNav = (tx, tz, near) => {
    const W = (x, z) => window.__arcade.walkable(x, z), p = window.__arcade.snapshot().position, S = .25, M = 10;   // 0.25 m: narrow strips (0.5 m) must count
    const x0 = Math.min(p[0], tx) - M, z0 = Math.min(p[2], tz) - M, nx = Math.ceil((Math.max(p[0], tx) + M - x0) / S), nz = Math.ceil((Math.max(p[2], tz) + M - z0) / S);
    if (Math.hypot(p[0] - tx, p[2] - tz) <= near) return { ok: true, path: [] };
    const reach = Math.max(near, .3);   // a tighter goal can fall between grid cells
    const ok = new Uint8Array(nx * nz); for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) ok[i * nz + j] = W(x0 + i * S, z0 + j * S) ? 1 : 0;
    const cell = (x, z) => [Math.round((x - x0) / S), Math.round((z - z0) / S)], id = (i, j) => i * nz + j;
    const [si, sj] = cell(p[0], p[2]); for (let di = -2; di <= 2; di++) for (let dj = -2; dj <= 2; dj++) { const i = si + di, j = sj + dj; if (i >= 0 && j >= 0 && i < nx && j < nz && Math.hypot(di, dj) * S <= .5) ok[id(i, j)] = 1; }   // the player may stand in a notch finer than the grid: let them step out
    const goals = new Set(); for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) if (ok[id(i, j)] && Math.hypot(x0 + i * S - tx, z0 + j * S - tz) <= reach) goals.add(id(i, j));
    if (!goals.size) return { ok: false, reason: 'unreachable (no walkable ground near the target)' };
    const g = new Float32Array(nx * nz).fill(1e9), from = new Int32Array(nx * nz).fill(-1), open = [[0, id(si, sj)]]; g[id(si, sj)] = 0;
    const hfn = k => Math.hypot(x0 + Math.floor(k / nz) * S - tx, z0 + (k % nz) * S - tz);
    let end = -1;
    // binary heap on f = g + h; stale entries are skipped when popped
    const push = e => { open.push(e); let i = open.length - 1; while (i > 0) { const q = (i - 1) >> 1; if (open[q][0] <= open[i][0]) break; [open[q], open[i]] = [open[i], open[q]]; i = q; } };
    const pop = () => { const top = open[0], last = open.pop(); if (open.length) { open[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < open.length && open[l][0] < open[m][0]) m = l; if (r < open.length && open[r][0] < open[m][0]) m = r; if (m === i) break; [open[m], open[i]] = [open[i], open[m]]; i = m; } } return top; };
    const done = new Uint8Array(nx * nz);
    while (open.length) { const [, cur] = pop(); if (done[cur]) continue; done[cur] = 1;
      if (goals.has(cur)) { end = cur; break; }
      const ci = Math.floor(cur / nz), cj = cur % nz;
      for (const [di, dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) { const ni = ci + di, nj = cj + dj; if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue; const n = id(ni, nj); if (!ok[n]) continue; if (di && dj && (!ok[id(ci + di, cj)] || !ok[id(ci, cj + dj)])) continue;
        const c = g[cur] + (di && dj ? 1.414 : 1) * S; if (c < g[n]) { g[n] = c; from[n] = cur; push([c + hfn(n), n]); } } }
    if (end < 0) return { ok: false, reason: 'unreachable (no walkable path)' };
    const cells = []; for (let k = end; k >= 0; k = from[k]) cells.unshift([x0 + Math.floor(k / nz) * S, z0 + (k % nz) * S]);
    const clear = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let t = 0; t <= d; t += .2) if (!W(a[0] + (b[0] - a[0]) * t / d, a[1] + (b[1] - a[1]) * t / d)) return false; return true; };
    // smooth with line of sight, but never skip more than 2 m at once: the game's own walk-to
    // (with its detour logic) is only trusted over short, clear legs, e.g. along a narrow strip
    const path = []; let a = [p[0], p[2]], k = 1;
    while (k < cells.length) { let far = k; while (far + 1 < cells.length && far - k < 8 && clear(a, cells[far + 1])) far++; path.push(cells[far]); a = cells[far]; k = far + 1; }
    if (W(tx, tz) && clear(path.length ? path[path.length - 1] : [p[0], p[2]], [tx, tz])) path.push([tx, tz]);   // the exact spot, when it is open ground
    return { ok: true, path };
  }; };
  // in touch mode the game must believe a finger is in charge: one tap where nothing listens
  const becomeTouch = async () => { if (INPUT !== 'touch') return; await page.touchscreen.tap(page.viewportSize().width / 2, 8); await page.waitForTimeout(150); };
  const h = {
    OUT, BASE, page, ctx, browser, check, errors, logs, results, state, GAME, report,
    open: async (extra = '') => {
      await page.goto(`${BASE}/?${Q}${extra}`, { timeout: 180000 });
      await page.waitForFunction(() => document.getElementById('loading')?.hidden, null, { timeout: 240000 });
      await page.waitForTimeout(1200); await becomeTouch(); await page.evaluate(NAV);
    },
    // the first load only exists to clear the save; loads it started are cut off by the
    // second navigation ("Failed to fetch"), which is the test's doing, not the game's
    fresh: async (extra = '') => { const n = errors.length; await page.goto(`${BASE}/?${Q}`, { timeout: 180000 }); await page.evaluate(() => localStorage.clear()); await h.open(extra);
      for (let i = errors.length - 1; i >= n; i--) if (/Failed to fetch|ERR_ABORTED/.test(errors[i].msg)) errors.splice(i, 1); },
    shot: async name => { const f = `${OUT}/${String(shots.length).padStart(2, '0')}-${state.current}-${name}.png`; await page.screenshot({ path: f, timeout: 120000 }); shots.push(f); return f; },
    INPUT,
    /** press a button the way this test's player would (a tap on a phone, a click otherwise) */
    press: async (l, opts = {}) => { l = l.first(); await l.waitFor({ state: 'visible', timeout: opts.timeout ?? 30000 }); if (INPUT === 'touch') await l.tap(); else await l.click(); },
    /** a dialogue choice or "read on": number keys / Space on a keyboard, taps on a phone, clicks with a mouse */
    card: async (text, timeout = 90000) => {
      const l = page.locator('.story-card button', { hasText: text }).first(); await l.waitFor({ state: 'visible', timeout });
      if (INPUT !== 'mouse') await page.waitForTimeout(350);   // the game ignores input in the first instant a card is up (a stray tap must not skip it)
      if (INPUT === 'keyboard') {
        const advance = await l.evaluate(b => b.classList.contains('advance'));
        if (advance) await page.keyboard.press('Space');
        else { const i = await l.evaluate(b => [...b.parentElement.querySelectorAll('button')].indexOf(b)); await page.keyboard.press(String(i + 1)); }
      } else if (INPUT === 'touch') {
        const advance = await l.evaluate(b => b.classList.contains('advance'));
        if (advance) { const vs = page.viewportSize(); await page.touchscreen.tap(vs.width / 2, vs.height * .45); }   // read on: tap anywhere
        else await l.tap();
      } else await l.click();
      await page.waitForTimeout(500);
    },
    waitBeat: async (b, timeout = 60000) => h.waitFor(async () => (await page.evaluate(() => window.__vlStory?.debug?.beat)) === b, timeout, 250),
    // a stars banner carries on by itself after a few seconds; tap it if it is still up
    stars: async () => { await h.press(page.locator('.story-card.ribbon button.primary'), { timeout: 3000 }).catch(() => {}); await page.waitForTimeout(600); },
    /** the context action: E on a keyboard, a tap on the prompt beside the target on a phone */
    act: async (text, timeout = 30000) => {
      const l = page.locator('.context-act', text ? { hasText: text } : {}).first(); await l.waitFor({ state: 'visible', timeout });
      if (INPUT === 'keyboard') await page.keyboard.press('e');
      else if (INPUT === 'touch') await l.tap();   // waits until the prompt holds still (its pop-in takes seconds at software frame rates)
      else await l.click();
      await page.waitForTimeout(500);
    },
    /** drag the thumb stick (touch) for `sec` seconds of game time; dir in screen terms, e.g. [0, -1] = up */
    stick: async (dir, sec = 1.5, reach = 60) => {
      cdp ??= await page.context().newCDPSession(page);
      const vs = page.viewportSize(), x0 = 92, y0 = vs.height - 118, pt = (x, y) => [{ x, y, id: 7, radiusX: 8, radiusY: 8, force: 1 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0, y0) });
      for (let i = 1; i <= 4; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x0 + dir[0] * reach / 4 * i, y0 + dir[1] * reach / 4 * i) });
      await page.evaluate(s => window.__arcade.simulate(s), sec);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    },
    becomeTouch,
    // teleport the player (a test shortcut). A spot a player can't stand on (inside a planter, a
    // wall) gives pictures no player will see, e.g. the camera pressed into their back: warn about it.
    pose: async (x, z, yaw = 0) => {
      const ok = await page.evaluate(([x, z]) => !window.__arcade.walkable || window.__arcade.walkable(x, z), [x, z]);
      if (!ok) check(`posed on walkable ground (${x}, ${z})`, false, 'a player cannot stand here; move the test spot', 'warn');
      await page.evaluate(([x, z, yaw]) => window.__arcade.pose(x, z, yaw, .2, 6, yaw), [x, z, yaw]); await page.waitForTimeout(1200);
    },
    /** a save at checkpoint `at` WITH the learning evidence it needs (the game refuses a bare one:
     *  kit/progress.ts). Tests that start mid-story use this; the breaker's tamper probe doesn't. */
    seedSave: async (at, stations = GAME.progress.requires[at] ?? []) => page.evaluate(([K, at, st]) => { localStorage.setItem(K.save, JSON.stringify({ at, when: Date.now() })); const d = JSON.parse(localStorage.getItem(K.decided) || '[]'); for (const s of st) if (!d.some(k => k.startsWith(s + '|'))) d.push(s + '|seeded-by-test'); localStorage.setItem(K.decided, JSON.stringify(d)); }, [KEYS, at, stations]),
    save: () => page.evaluate(K => JSON.parse(localStorage.getItem(K.save) || 'null')?.at ?? null, KEYS),
    /** the learning log the game keeps in this browser */
    learningLog: () => page.evaluate(K => { try { return JSON.parse(localStorage.getItem(K.learning) || '[]'); } catch { return []; } }, KEYS),
    goal: () => page.evaluate(() => { const g = document.querySelector('.goal-line'); return g && !g.hidden ? g.textContent : null; }),
    beat: () => page.evaluate(() => window.__vlStory?.debug?.beat),
    learning: () => page.evaluate(() => window.__vlLearning ?? []),
    player: () => page.evaluate(() => window.__arcade.snapshot().position),
    /** Walk like a player who knows the way: plan a path over the game's own walkable probe
     *  (A* on a 0.25 m grid, in the page), then follow it in game time. Stops early when
     *  `until()` is true. Returns { ok, reason, secs, dist }: reason 'unreachable' means no
     *  walkable path exists to the target (a goal marker a player can't reach on foot). */
    walkTo: async (target, { until = null, near = 1.2, maxSecs = 90 } = {}) => {
      let secs = 0, dist = 0, replans = 0;
      while (secs < maxSecs) {
        if (until && await until()) return { ok: true, reason: 'until', secs, dist };
        const plan = await page.evaluate(([tx, tz, near]) => window.__vlTestNav(tx, tz, near), [target[0], target[1], near]);
        if (!plan.ok) return { ok: false, reason: plan.reason, secs, dist };
        if (!plan.path.length) return { ok: true, reason: 'arrived', secs, dist };
        let progressed = false, reachedAll = true;
        for (const wp of plan.path) {
          for (let k = 0; k < 16; k++) {   // ≤ 8 s per waypoint
            const r = await page.evaluate(wp => { const a = window.__arcade.snapshot().position; window.__arcade.simulate(.5, { walkTo: wp }); const b = window.__arcade.snapshot().position; return [Math.hypot(b[0] - a[0], b[2] - a[2]), Math.hypot(b[0] - wp[0], b[2] - wp[1])]; }, wp);
            secs += .5; dist += r[0]; if (r[0] > .05) progressed = true;
            if (until && await until()) return { ok: true, reason: 'until', secs, dist };
            if (r[1] < .35) break;
            if (r[0] < .02) { reachedAll = false; break; }   // blocked: replan from here
          }
        }
        if (reachedAll && !progressed) return { ok: true, reason: 'arrived', secs, dist };   // already within a step of the goal
        if (!progressed && ++replans > 3) return { ok: false, reason: 'stuck', secs, dist };
      }
      return { ok: false, reason: 'timeout', secs, dist };
    },
    /** fast-forward game time (no drawing) until fn() is true; for cutscenes, which crawl at software frame rates */
    until: async (fn, gameSeconds = 20) => { for (let s = 0; s < gameSeconds; s += .25) { if (await fn()) return true; await page.evaluate(() => window.__arcade.simulate(.25)); } return !!(await fn()); },
    waitFor: async (fn, timeout = 120000, step = 500) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if (await fn()) return true; await page.waitForTimeout(step); } return false; },
    segment: async (name, fn) => {
      if (ONLY && !ONLY.has(name)) return;
      state.current = name; const t0 = Date.now();
      try { await fn(); } catch (e) { check('segment ran to the end', false, e.message.split('\n')[0]); try { await h.shot('failed'); } catch {} }
      console.log(`  (${name}: ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    },
    finish: async () => {
      state.current = 'all';
      check('no page errors', errors.length === 0, errors.map(e => `[${e.segment}] ${e.msg}`).join(' | '));
      await browser.close(); server?.close();
      const failed = results.filter(r => !r.ok && r.severity !== 'warn'), warned = results.filter(r => !r.ok && r.severity === 'warn');
      report.write(OUT, { segments: ONLY ? [...ONLY] : null, title, base: BASE, passed: results.length - failed.length - warned.length, failed: failed.length, warned: warned.length, legacy: results, errors, logs, shots: shots.map(f => path.basename(f)) });
      const md = [`# ${title} — ${new Date().toISOString()}`, '', `**${results.length - failed.length - warned.length} passed, ${failed.length} failed, ${warned.length} warnings**`, '',
        '| Segment | Check | Result | Detail |', '|---|---|---|---|',
        ...results.map(r => `| ${r.segment} | ${r.name} | ${r.ok ? 'pass' : r.severity === 'warn' ? 'warn' : '**FAIL**'} | ${r.detail.replace(/\|/g, '/').replace(/\n/g, ' ')} |`),
        '', '## Screenshots', ...shots.map(s => `- ${path.basename(s)}`)].join('\n');
      writeFileSync(`${OUT}/report.md`, md);
      // a contact sheet: every screenshot with its segment and the checks around it, for a human-style review
      const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
      const bad = results.filter(r => !r.ok);
      writeFileSync(`${OUT}/sheet.html`, `<!doctype html><meta charset=utf-8><title>${esc(title)} (${INPUT})</title><style>body{font:13px system-ui;background:#14202c;color:#eee;margin:16px}h1{font-size:18px}.g{display:flex;flex-wrap:wrap;gap:12px}figure{margin:0;width:${desk ? 340 : 200}px}img{width:100%;border:1px solid #456}figcaption{font-size:11px;opacity:.8}.bad{color:#ff9d8a}</style>
<h1>${esc(title)} — input: ${INPUT} — ${results.length - failed.length - warned.length} passed, ${failed.length} failed, ${warned.length} warnings</h1>
${bad.length ? '<ul>' + bad.map(r => `<li class=bad>[${esc(r.segment)}] ${esc(r.name)} — ${esc(r.detail)}</li>`).join('') + '</ul>' : ''}${errors.length ? '<p class=bad>Page errors: ' + errors.map(e => esc(`[${e.segment}] ${e.msg}`)).join(' | ') + '</p>' : ''}
<div class=g>${shots.map(f => `<figure><img loading=lazy src="${path.basename(f)}"><figcaption>${esc(path.basename(f, '.png'))}</figcaption></figure>`).join('')}</div>`);
      console.log(`\n${results.length - failed.length - warned.length} passed, ${failed.length} failed, ${warned.length} warnings. Report: ${OUT}/report.md`);
      process.exit(failed.length ? 1 : 0);
    },
  };
  // the game's own helpers (its scenes, its route): tools/games/<id>.mjs
  if (tests.helpers) Object.assign(h, tests.helpers(h));
  return h;
}
