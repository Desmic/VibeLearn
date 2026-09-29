// Focused 200% spatial-caption/action check; local verification only.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const out = path.resolve('../../artifacts/bellweather-source-trial-20260929');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true,
  args: ['--use-angle=d3d11', '--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu'] });
const report = { errors: [], browserClosed: false };
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.on('pageerror', e => report.errors.push(e.message));
  await page.goto('http://127.0.0.1:8061/', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__bellweather?.snapshot, null, { timeout: 90000 });
  await page.locator('#menu-toggle').tap();
  await page.locator('#reduced').check();
  await page.locator('#guide').tap();
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.waitForTimeout(150);
  async function boxes() { return page.evaluate(() => {
    const q = id => { const e = document.getElementById(id), r = e.getBoundingClientRect();
      return { visible: !e.hidden, text: e.textContent?.trim(), x: r.x, y: r.y, right: r.right, bottom: r.bottom,
        width: r.width, height: r.height, within: r.x >= 0 && r.y >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; };
    return { speech: q('speech'), action: q('action') };
  }); }
  report.beforeWake = await boxes();
  await page.screenshot({ path: path.join(out, 'phone-200-before-wake.png') });
  await page.locator('#action').tap();
  await page.waitForTimeout(150);
  report.afterWake = await boxes();
  await page.screenshot({ path: path.join(out, 'phone-200-after-wake.png') });
} finally {
  await browser.close(); report.browserClosed = true;
  await writeFile(path.join(out, 'phone-200-final.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report));
