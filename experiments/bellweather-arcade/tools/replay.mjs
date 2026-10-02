// Replays an AI play-test's actions (playlog.jsonl) in a fresh session and scores the
// camera after each one, so a reported bad moment can be reproduced and fixed.
//   node tools/replay.mjs <playlog.jsonl> [outDir] [lastStep]
import { readFileSync } from 'node:fs';
import { harness } from './harness.mjs';
const [log, out = '/tmp/replay', last = '999'] = process.argv.slice(2);
const acts = readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l)).filter(d => d.act && d.act.type !== 'note' && d.step <= +last);
const h = await harness({ title: 'replay', outDefault: out });
const { page } = h;
await h.fresh('');
for (const { step, act: a } of acts) {
  if (a.type === 'tap') { const b = page.locator('button:visible, .context-act:visible', { hasText: String(a.label) }).first(); if (await b.count()) await b.click({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(/training run|Continue/.test(a.label) ? 3500 : 600); }
  else if (a.type === 'tapAt') { await page.touchscreen.tap(+a.x, +a.y); await page.waitForTimeout(400); await page.evaluate(() => window.__arcade?.simulate?.(2.5)); }
  else if (a.type === 'move') { const key = { forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD' }[a.dir]; await page.evaluate(([k, s]) => window.__arcade.simulate(s, { keys: [k] }), [key, Math.min(8, +a.seconds || 1)]); await page.waitForTimeout(300); }
  else if (a.type === 'wait') { await page.evaluate(s => window.__arcade?.simulate?.(s), Math.min(10, +a.seconds || 1)); await page.waitForTimeout(300); }
  const p = await page.evaluate(() => { const s = window.__arcade.snapshot(); return { ...window.__arcade.viewProbe(), pos: s.position.map(v => +v.toFixed(1)), story: window.__vlStory?.debug?.beat }; });
  const bad = p.dist < 1.8 || !p.zipOnScreen || !!p.blocked;
  console.log(`${step} ${a.type}${a.dir ? ':' + a.dir : ''} ${bad ? 'BAD' : 'ok '} ${JSON.stringify({ pos: p.pos, dist: p.dist, on: p.zipOnScreen, blocked: p.blocked, camHit: p.camHit, beat: p.story })}`);
  if (bad) await h.shot(`step-${step}`);
}
await h.browser.close(); process.exit(0);
