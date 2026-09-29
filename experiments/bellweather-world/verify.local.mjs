// Local worker verification; separate from the world trial and its upstream vendor code.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('../../artifacts/bellweather-source-trial-20260929');
await mkdir(root, { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=d3d11', '--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu'],
});
const report = { url: 'http://127.0.0.1:8061/', checks: [], errors: [], browserClosed: false };
const note = (name, observed) => { report.checks.push({ name, observed }); console.log(name); };
async function snapshot(page) { return page.evaluate(() => window.__bellweather.snapshot()); }
async function menu(page) { await page.locator('#menu-toggle').click(); }
async function guide(page) { await menu(page); await page.locator('#guide').click(); }
async function waitGuided(page, timeout = 45000) {
  await page.waitForFunction(() => !window.__bellweather.snapshot().guided, null, { timeout });
}
async function watch(page) {
  page.on('pageerror', error => report.errors.push(`pageerror: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(`console: ${message.text()}`); });
}

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await watch(page);
  await page.goto(report.url + '?prof=1', { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => !!window.__bellweather?.snapshot, null, { timeout: 90000 });
  note('initial', { state: await snapshot(page), actionHidden: await page.locator('#action').isHidden() });
  await guide(page);
  await page.waitForFunction(() => window.__bellweather.snapshot().guided, null, { timeout: 3000 });
  note('guided-start', await snapshot(page));
  await waitGuided(page);
  note('guided-lightwell', { state: await snapshot(page), action: await page.locator('#action').innerText() });
  // A paused scene should not leave its background world action keyboard-usable.
  await menu(page);
  let actionReached = false;
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement?.id === 'action')) { actionReached = true; break; }
  }
  note('pause-action-focus', { actionReached, actionHidden: await page.locator('#action').isHidden(), activated: (await snapshot(page)).activated });
  if (actionReached) {
    await page.keyboard.press('Enter');
    note('pause-action-activation', { activated: (await snapshot(page)).activated });
  }
  await page.locator('#resume').click();
  if (!(await snapshot(page)).activated) await page.locator('#action').click();
  note('wake', await snapshot(page));
  await guide(page);
  await waitGuided(page);
  await page.waitForFunction(() => window.__bellweather.snapshot().miraT >= .932, null, { timeout: 30000 });
  note('overlook-before-join', { state: await snapshot(page), action: await page.locator('#action').innerText() });
  await page.locator('#action').click();
  note('joined', await snapshot(page));
  await page.locator('#action').click();
  await waitGuided(page);
  note('returned', { state: await snapshot(page), announcement: await page.locator('#announcer').innerText() });
  await page.screenshot({ path: path.join(root, 'desktop-return.png') });
  await menu(page);
  const framesBefore = (await snapshot(page)).frames;
  await page.waitForTimeout(700);
  note('paused-frames', { before: framesBefore, after: (await snapshot(page)).frames });
  await page.locator('#restart').click();
  note('restart', await snapshot(page));
  await page.close();
} finally {
  await browser.close();
  report.browserClosed = true;
  await writeFile(path.join(root, 'functional-observation.json'), JSON.stringify(report, null, 2));
}
