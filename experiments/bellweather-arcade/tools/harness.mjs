// Shared harness for automated game checks (flowcheck, breaker): serves the
// built game, opens a headless phone-sized browser, gives small helpers that
// drive the game through its own UI and debug hooks, and writes a report.
// Game-agnostic except for the helper names that read Bellweather's hooks
// (`__vlStory`, `__arcade`, `__vlLearning`); another game supplies the same hooks.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';

export const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };

export async function harness({ title, outDefault }) {
  const OUT = arg('out', outDefault); mkdirSync(OUT, { recursive: true });
  const ONLY = arg('only', '') ? new Set(arg('only', '').split(',')) : null;
  let BASE = arg('base', ''); const ROOT = arg('root', 'out');
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
  const check = (name, ok, detail = '', severity = 'fail') => {
    results.push({ segment: state.current, name, ok: !!ok, severity, detail: String(detail).slice(0, 400) });
    console.log(`${ok ? 'PASS' : severity === 'warn' ? 'WARN' : 'FAIL'} [${state.current}] ${name}${detail ? ' — ' + String(detail).slice(0, 180) : ''}`);
    return !!ok;
  };
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  // How the test player acts (--input): 'mouse' (clicks; the old default), 'keyboard' (a laptop:
  // E to act, Space to read on, number keys to choose, WASD), or 'touch' (a phone: taps and the
  // thumb stick). Keyboard runs on a laptop-shaped screen; the others on a phone-shaped one.
  const INPUT = arg('input', 'mouse');
  const desk = INPUT === 'keyboard';
  const ctx = await browser.newContext({ viewport: desk ? { width: 1024, height: 640 } : { width: 393, height: 760 }, deviceScaleFactor: 1, hasTouch: !desk, isMobile: INPUT === 'touch' });
  const page = await ctx.newPage(); page.setDefaultTimeout(60000);
  page.on('pageerror', e => errors.push({ segment: state.current, msg: e.message }));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error') errors.push({ segment: state.current, msg: t }); if (/^\[(kit|learning|prop|budget)\]/.test(t)) logs.push(t); });

  const Q = 'study=facade&finish=daylight&render=painted&quality=low&auto=0';
  let cdp = null;
  // in touch mode the game must believe a finger is in charge: one tap where nothing listens
  const becomeTouch = async () => { if (INPUT !== 'touch') return; await page.touchscreen.tap(page.viewportSize().width / 2, 8); await page.waitForTimeout(150); };
  const h = {
    OUT, BASE, page, ctx, browser, check, errors, logs, results, state,
    open: async (extra = '') => {
      await page.goto(`${BASE}/?${Q}${extra}`, { timeout: 180000 });
      await page.waitForFunction(() => document.getElementById('loading')?.hidden, null, { timeout: 240000 });
      await page.waitForTimeout(1200); await becomeTouch();
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
    // the cold open (Mira calls from the outlook) can be skipped like any cutscene
    skipOpening: async () => { await page.waitForFunction(() => window.__vlStory?.debug, null, { timeout: 30000 }); await h.waitFor(() => page.evaluate(() => window.__vlStory.debug.opening >= 0 || window.__vlStory.debug.beat !== 'meet'), 5000, 250); if ((await page.evaluate(() => window.__vlStory.debug.opening)) >= 0) await h.press(page.locator('.story-skip'), { timeout: 10000 }).catch(() => {}); await page.waitForTimeout(400); },
    // Mira's conversation, up to the attack (lines advance; "Beep?" is a real choice)
    // Mira asks for the lantern; Zip hangs it on the skiff (an action in the world), then she talks on
    talkMira: async () => { await h.card('Next'); await h.pose(2.6, -10.3, 0); await h.act('Hang'); await h.card('Beep?', 30000); await h.card('Next'); await h.card('Next'); },
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
    // teleport Zip (a test shortcut). A spot a player can't stand on (inside a planter, a wall)
    // gives pictures no player will see, e.g. the camera pressed into Zip's back: warn about it.
    pose: async (x, z, yaw = 0) => {
      const ok = await page.evaluate(([x, z]) => { const w = window.__vlDebug?.walkable, s = window.__vlStory?.debug?.beat; return !w || !['meet', 'spark', 'skiff', 'attack'].includes(s) || w({ x, y: 0, z, clone() { return { ...this }; } }); }, [x, z]);
      if (!ok) check(`posed on walkable ground (${x}, ${z})`, false, 'a player cannot stand here; move the test spot', 'warn');
      await page.evaluate(([x, z, yaw]) => window.__arcade.pose(x, z, yaw, .2, 6, yaw), [x, z, yaw]); await page.waitForTimeout(1200);
    },
    save: () => page.evaluate(() => JSON.parse(localStorage.getItem('bellweather.save.v1') || 'null')?.at ?? null),
    goal: () => page.evaluate(() => { const g = document.querySelector('.goal-line'); return g && !g.hidden ? g.textContent : null; }),
    beat: () => page.evaluate(() => window.__vlStory?.debug?.beat),
    learning: () => page.evaluate(() => window.__vlLearning ?? []),
    zip: () => page.evaluate(() => window.__arcade.snapshot().position),
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
      writeFileSync(`${OUT}/report.json`, JSON.stringify({ title, base: BASE, when: new Date().toISOString(), passed: results.length - failed.length - warned.length, failed: failed.length, warned: warned.length, results, errors, logs, shots }, null, 1));
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
  return h;
}
