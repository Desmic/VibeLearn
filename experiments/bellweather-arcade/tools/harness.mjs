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
  const ctx = await browser.newContext({ viewport: { width: 393, height: 760 }, deviceScaleFactor: 1, hasTouch: true });
  const page = await ctx.newPage(); page.setDefaultTimeout(60000);
  page.on('pageerror', e => errors.push({ segment: state.current, msg: e.message }));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error') errors.push({ segment: state.current, msg: t }); if (/^\[(kit|learning|prop|budget)\]/.test(t)) logs.push(t); });

  const Q = 'study=facade&finish=daylight&render=painted&quality=low&auto=0';
  const h = {
    OUT, BASE, page, ctx, browser, check, errors, logs, results, state,
    open: async (extra = '') => {
      await page.goto(`${BASE}/?${Q}${extra}`, { timeout: 180000 });
      await page.waitForFunction(() => document.getElementById('loading')?.hidden, null, { timeout: 240000 });
      await page.waitForTimeout(1200);
    },
    // the first load only exists to clear the save; loads it started are cut off by the
    // second navigation ("Failed to fetch"), which is the test's doing, not the game's
    fresh: async (extra = '') => { const n = errors.length; await page.goto(`${BASE}/?${Q}`, { timeout: 180000 }); await page.evaluate(() => localStorage.clear()); await h.open(extra);
      for (let i = errors.length - 1; i >= n; i--) if (/Failed to fetch|ERR_ABORTED/.test(errors[i].msg)) errors.splice(i, 1); },
    shot: async name => { const f = `${OUT}/${String(shots.length).padStart(2, '0')}-${state.current}-${name}.png`; await page.screenshot({ path: f, timeout: 120000 }); shots.push(f); return f; },
    card: async (text, timeout = 90000) => { const l = page.locator('.story-card button', { hasText: text }).first(); await l.waitFor({ state: 'visible', timeout }); await l.click(); await page.waitForTimeout(500); },
    act: async (text, timeout = 30000) => { const l = page.locator('.context-act', text ? { hasText: text } : {}).first(); await l.waitFor({ state: 'visible', timeout }); await l.click(); await page.waitForTimeout(500); },
    pose: (x, z, yaw = 0) => page.evaluate(([x, z, yaw]) => window.__arcade.pose(x, z, yaw, .2, 6, yaw), [x, z, yaw]).then(() => page.waitForTimeout(1200)),
    save: () => page.evaluate(() => JSON.parse(localStorage.getItem('bellweather.save.v1') || 'null')?.at ?? null),
    goal: () => page.evaluate(() => { const g = document.querySelector('.goal-line'); return g && !g.hidden ? g.textContent : null; }),
    beat: () => page.evaluate(() => window.__vlStory?.debug?.beat),
    learning: () => page.evaluate(() => window.__vlLearning ?? []),
    zip: () => page.evaluate(() => window.__arcade.snapshot().position),
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
      console.log(`\n${results.length - failed.length - warned.length} passed, ${failed.length} failed, ${warned.length} warnings. Report: ${OUT}/report.md`);
      process.exit(failed.length ? 1 : 0);
    },
  };
  return h;
}
