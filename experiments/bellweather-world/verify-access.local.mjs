// Bounded local checks with real UI input; separate from the world trial source.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const out = path.resolve('../../artifacts/bellweather-source-trial-20260929');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true,
  args: ['--use-angle=d3d11', '--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu'] });
const result = { source: 'built local trial on 127.0.0.1:8061', errors: [], checks: {}, browserClosed: false };
const snap = page => page.evaluate(() => window.__bellweather.snapshot());
const openGuide = async page => { await page.locator('#menu-toggle').click(); await page.locator('#guide').click(); };
const waitGuide = page => page.waitForFunction(() => !window.__bellweather.snapshot().guided, null, { timeout: 45000 });
function recordErrors(page) { page.on('pageerror', e => result.errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) result.errors.push(`console: ${m.text()}`); }); }

try {
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  recordErrors(desktop);
  await desktop.goto('http://127.0.0.1:8061/?prof=1', { waitUntil: 'load' });
  await desktop.waitForFunction(() => !!window.__bellweather?.snapshot, null, { timeout: 90000 });
  await desktop.waitForTimeout(2500);
  result.checks.desktopPerf = await desktop.evaluate(() => {
    const s = window.__bellweather.snapshot();
    const a = [...s.frameIntervals].sort((x, y) => x - y);
    const gl = document.querySelector('canvas').getContext('webgl2');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    return { renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER) ?? 'unavailable',
      viewport: [innerWidth, innerHeight], dpr: devicePixelRatio, reduced: s.reduced, economy: s.economy,
      frames: s.frames, draws: s.draws, triangles: s.triangles, cpuFrameMsLast: s.cpuFrameMs,
      intervals: { count: a.length, median: a[Math.floor(a.length / 2)], p95: a[Math.floor(a.length * .95)], max: a.at(-1) },
      gpuMs: s.profile.gpuMs };
  });
  await openGuide(desktop);
  await desktop.waitForFunction(() => window.__bellweather.snapshot().guided, null, { timeout: 3000 });
  await desktop.keyboard.down('KeyW');
  await desktop.waitForTimeout(200);
  await desktop.keyboard.up('KeyW');
  result.checks.keyboardCancel = { guided: (await snap(desktop)).guided };
  await desktop.locator('#menu-toggle').click();
  const beforePause = (await snap(desktop)).frames;
  await desktop.waitForTimeout(700);
  result.checks.pausedFrames = { before: beforePause, after: (await snap(desktop)).frames };
  const other = await browser.newPage();
  await other.goto('about:blank');
  await other.bringToFront();
  const hidden = await desktop.evaluate(() => document.hidden);
  const beforeHidden = (await snap(desktop)).frames;
  await desktop.waitForTimeout(700);
  result.checks.hiddenFrames = { documentHidden: hidden, before: beforeHidden, after: (await snap(desktop)).frames };
  await other.close(); await desktop.close();

  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  recordErrors(phone);
  await phone.goto('http://127.0.0.1:8061/?prof=1', { waitUntil: 'load' });
  await phone.waitForFunction(() => !!window.__bellweather?.snapshot, null, { timeout: 90000 });
  await phone.locator('#menu-toggle').tap();
  await phone.locator('#reduced').check();
  await phone.locator('#guide').tap();
  result.checks.reducedStation = { state: await snap(phone), actionVisible: await phone.locator('#action').isVisible(), actionText: await phone.locator('#action').innerText() };
  await phone.locator('#action').tap();
  await phone.waitForFunction(() => window.__bellweather.snapshot().miraT >= .932, null, { timeout: 5000 });
  result.checks.reducedWake = { state: await snap(phone), speech: await phone.locator('#line').innerText() };
  await phone.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const boxes = await phone.evaluate(() => {
    const get = id => { const e = document.getElementById(id), r = e.getBoundingClientRect();
      return { visible: !e.hidden, text: e.textContent?.trim(), x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height,
        withinViewport: r.x >= 0 && r.y >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; };
    return { speech: get('speech'), action: get('action'), menuToggle: get('menu-toggle'), guide: get('guide') };
  });
  result.checks.phone200 = { boxes, viewport: [390, 844] };
  await phone.screenshot({ path: path.join(out, 'phone-200-wake.png') });
  await phone.locator('#menu-toggle').tap();
  result.checks.phoneMenu200 = await phone.evaluate(() => {
    const e = document.getElementById('menu'), r = e.getBoundingClientRect();
    return { visible: !e.hidden, width: r.width, height: r.height, top: r.top, bottom: r.bottom,
      scrollHeight: e.scrollHeight, clientHeight: e.clientHeight, guideVisible: !!document.getElementById('guide').offsetParent };
  });
  await phone.screenshot({ path: path.join(out, 'phone-200-menu.png') });
  await phone.locator('#resume').tap();
  const stick = phone.locator('#stick');
  const r = await stick.boundingBox();
  await phone.mouse.move(r.x + 50, r.y + 50); await phone.mouse.down(); await phone.mouse.move(r.x + 76, r.y + 42);
  const moved = await stick.locator('div').evaluate(e => e.style.transform);
  await phone.mouse.up();
  result.checks.pointerRelease = { moved, after: await stick.locator('div').evaluate(e => e.style.transform) };
  await phone.close();
} finally {
  await browser.close();
  result.browserClosed = true;
  await writeFile(path.join(out, 'access-and-performance.json'), JSON.stringify(result, null, 2));
}
console.log(JSON.stringify({ checks: Object.keys(result.checks), errors: result.errors, browserClosed: result.browserClosed }));
