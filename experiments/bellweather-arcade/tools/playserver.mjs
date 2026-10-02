// A play session another program (or an AI agent) can drive one step at a time,
// seeing only what a player sees: a screenshot, the words on screen and the
// buttons. It is the body of the AI play-tester; the brain is whatever calls it
// (an agent reading the screenshots, or a model API later). No game internals
// are exposed except moving the stick, which uses the game's fast-forward hook.
//
//   node tools/playserver.mjs [--port 7788] [--root out] [--out playtest] [--fresh 1] [--start '&beat=to-loom']
//   curl localhost:7788/observe
//   curl -X POST localhost:7788/act -d '{"type":"tap","label":"Play"}'
//
// Actions:
//   {type:'tap', label}            tap a visible button whose text contains label
//   {type:'tapAt', x, y}           tap the screen (x, y in screen pixels; walks there on the ground)
//   {type:'move', dir, seconds}    hold the stick: dir forward|back|left|right (≤ 8 s)
//   {type:'wait', seconds}         let the game run (≤ 10 s)
//   {type:'key', key}              press a key (e.g. Escape)
//   {type:'reload'}                reload the page (as a player might)
//   {type:'note', text, kind}      write to the play log: kind confusion|bug|exploit|delight|idea
//   {type:'verdict', look, keepPlaying, why}   the kid test (two separate answers, yes|no|unsure):
//                                  would a young player stop and look? would they understand and want to keep playing?
//   {type:'end'}                   finish: writes the report and stops
import http from 'node:http';
import { writeFileSync, appendFileSync } from 'node:fs';
import { harness, arg } from './harness.mjs';

const PORT = +arg('port', 7788);
const h = await harness({ title: 'AI play-test', outDefault: 'playtest' });
const { page, OUT } = h;
const LOG = `${OUT}/playlog.jsonl`; writeFileSync(LOG, '');
let step = 0; const notes = [];
const log = o => appendFileSync(LOG, JSON.stringify({ step, t: Date.now(), ...o }) + '\n');

// --start adds URL params, e.g. '&title=0&beat=to-loom' to begin at Stop 2
const START = arg('start', '');
if (arg('fresh', '1') === '1') await h.fresh(START); else await h.open(START);

async function observe() {
  step++;
  const shot = `${OUT}/step-${String(step).padStart(3, '0')}.png`;
  await page.screenshot({ path: shot, timeout: 120000 });
  const seen = await page.evaluate(() => {
    const vis = el => el && !el.hidden && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden';
    const txt = sel => [...document.querySelectorAll(sel)].filter(vis).map(e => e.innerText.trim()).filter(Boolean);
    return {
      goal: txt('.goal-line')[0] ?? null,
      card: txt('.story-card p')[0] ?? null,
      action: txt('.context-act')[0] ?? null,
      hint: txt('.control-hint')[0] ?? null,
      buttons: [...document.querySelectorAll('button')].filter(vis).map(b => b.innerText.trim() || b.getAttribute('aria-label') || '').filter(Boolean),
      toast: txt('.toast')[0] ?? null,
      thought: txt('.thought')[0] ?? null,
      prompt: txt('.hud-prompt')[0] ?? null,
      labels: txt('.world-label'),
      panels: txt('.relay-console, .sentence-strip, .satchel-bar, .star-list, .title-screen'),
      screen: [innerWidth, innerHeight],
    };
  });
  log({ observe: seen, shot });
  return { step, shot, ...seen };
}

async function act(a) {
  const t0 = Date.now();
  switch (a.type) {
    case 'tap': {
      const b = page.locator('button:visible, .context-act:visible', { hasText: String(a.label) }).first();
      if (!(await b.count())) return { ok: false, why: `no visible button with "${a.label}"` };
      await b.click({ timeout: 5000 }).catch(e => { throw new Error('could not tap: ' + e.message.split('\n')[0]); });
      await page.waitForTimeout(600); break;
    }
    case 'tapAt': await page.touchscreen.tap(+a.x, +a.y); await page.waitForTimeout(400);
      await page.evaluate(() => window.__arcade?.simulate?.(2.5)); break;
    case 'move': {
      const key = { forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD' }[a.dir]; if (!key) return { ok: false, why: 'dir must be forward|back|left|right' };
      await page.evaluate(([k, s]) => window.__arcade.simulate(s, { keys: [k] }), [key, Math.min(8, +a.seconds || 1)]); await page.waitForTimeout(300); break;
    }
    case 'wait': await page.evaluate(s => window.__arcade?.simulate?.(s), Math.min(10, +a.seconds || 1)); await page.waitForTimeout(300); break;
    case 'key': await page.keyboard.press(String(a.key)); await page.waitForTimeout(400); break;
    case 'reload': await page.reload(); await page.waitForFunction(() => document.getElementById('loading')?.hidden, null, { timeout: 240000 }); await page.waitForTimeout(1200); break;
    case 'note': notes.push({ step, kind: a.kind ?? 'note', text: a.text }); break;
    default: return { ok: false, why: 'unknown action type' };
  }
  log({ act: a, ms: Date.now() - t0 });
  return { ok: true };
}

let verdict = null;
function report() {
  const errs = h.errors.map(e => `- ${e.msg}`).join('\n') || '- none';
  const by = k => notes.filter(n => n.kind === k).map(n => `- (step ${n.step}) ${n.text}`).join('\n') || '- none';
  const kid = verdict ? `- Would a young player stop and look? **${verdict.look}**\n- Would they understand it and want to keep playing? **${verdict.keepPlaying}**\n- Why: ${verdict.why ?? ''}` : '- not given (send {type:\'verdict\'} before ending)';
  const md = `# AI play-test\n\nSteps: ${step}. Screenshots and the full log (playlog.jsonl) are in this folder.\n\n## The kid test\n${kid}\n\n## Confusing moments\n${by('confusion')}\n\n## Bugs\n${by('bug')}\n\n## Loopholes and exploits\n${by('exploit')}\n\n## What worked\n${by('delight')}\n\n## Ideas\n${by('idea')}\n\n## Other notes\n${by('note')}\n\n## Page errors\n${errs}\n`;
  writeFileSync(`${OUT}/report.md`, md); return md;
}

const server = http.createServer(async (req, res) => {
  const send = (code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
  try {
    if (req.url.startsWith('/observe')) return send(200, await observe());
    if (req.url.startsWith('/act') && req.method === 'POST') {
      let body = ''; for await (const c of req) body += c;
      const a = JSON.parse(body || '{}');
      if (a.type === 'verdict') { verdict = { look: String(a.look ?? 'unsure'), keepPlaying: String(a.keepPlaying ?? 'unsure'), why: String(a.why ?? '').slice(0, 600) }; log({ act: a }); send(200, { ok: true }); return; }
      if (a.type === 'end') { const md = report(); send(200, { ok: true, report: `${OUT}/report.md`, md }); setTimeout(async () => { await h.browser.close(); server.close(); process.exit(0); }, 200); return; }
      const r = await act(a); return send(200, r);
    }
    send(404, { error: 'GET /observe or POST /act' });
  } catch (e) { send(500, { ok: false, error: String(e.message ?? e) }); }
});
server.listen(PORT, () => console.log(`play server on http://localhost:${PORT} — screenshots in ${OUT}`));
