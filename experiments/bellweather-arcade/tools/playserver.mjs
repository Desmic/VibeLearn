// A play session another program (or an AI agent) can drive one step at a time,
// seeing only what a player sees: a screenshot, the words on screen and the
// buttons. It is the body of the AI play-tester; the brain is whatever calls it
// (an agent reading the screenshots, or a model API later). No game internals
// are exposed except moving the stick, which uses the game's fast-forward hook.
//
//   node tools/playserver.mjs [--port 7788] [--root out] [--out playtest] [--input touch]
//        [--persona commuter] [--protocol blind|directed] [--intent game|utter] [--start '&lab=utter']
//
// Two protocols (tools/AI-PLAYTEST.md):
//   blind (default): the tester gets only GET /brief (tools/playtest/tester.md + a persona: no
//     word about the game, linted by tools/blindcheck.mjs), plays, and stops. Then an interviewer
//     (a separate agent, the only one that sees the intent) questions the same tester through
//     /interview; before the reveal, a question using a word the tester hasn't met is refused.
//     The interviewer's /findings become the comprehension lane, graded by how each finding was
//     obtained (unprompted, probed, pointed at, only after the reveal).
//   directed: the older form for testers who are told what to do (a loophole hunter): notes by
//     kind, a cold account, a verdict, then /intent and a comparison. Never the comprehension lane's
//     evidence of what a newcomer understood.
//
// Play actions (POST /act):
//   {type:'tap', label}            tap a visible button whose text contains label
//   {type:'tapAt', x, y}           tap the screen (x, y in screen pixels; walks there on the ground)
//   {type:'look', dx, dy}          drag to turn the camera (screen pixels; dx 150 turns right)
//   {type:'move', dir, seconds}    hold the stick: dir forward|back|left|right (≤ 8 s)
//   {type:'wait', seconds}         let the game run (≤ 10 s)
//   {type:'key', key}              press a key (e.g. Escape)
//   {type:'think', text}           blind: say something aloud (optional, unprompted)
//   {type:'stop'}                  blind: put the phone down; play actions are refused after it
//   directed only: reload, note {text, kind}, understand, verdict, GET /intent, compare
//   {type:'end'}                   finish: writes report.md and the standard report
// Interview (blind, after stop):
//   GET /trace                     the play log as text, step by step (for the interviewer)
//   GET /interview/brief           the interviewer's guide with the intent and its items
//   GET /interview                 the transcript;  GET /interview/pending: the question waiting for an answer
//   POST /interview {role:'interviewer'|'player', phase, text}
//   POST /findings {...}           the interviewer's conclusions (tools/playtest/interviewer.md)
import http from 'node:http';
import { writeFileSync, appendFileSync, readFileSync } from 'node:fs';
import { designVocabulary, questionLeaks, metWords } from './lib/leak.mjs';
import { harness, arg } from './harness.mjs';
import { buildIntent, buildUtterIntent } from './intent.mjs';
import { resolve as resolvePath } from 'node:path';
import { pathToFileURL as toUrl } from 'node:url';

const PORT = +arg('port', 7788);
// one report per persona and protocol, so several testers of one build sit side by side in quality/<build>/
const LAB = (arg('start', '').match(/lab=([a-z0-9-]+)/) ?? [])[1];   // a test area or variant: kept apart in the report name
const h = await harness({ title: 'AI play-test', outDefault: 'playtest', tool: `playserver-${arg('protocol', 'blind')}-${arg('persona', arg('protocol', 'blind') === 'blind' ? 'commuter' : 'newcomer')}${LAB ? '-' + LAB : ''}`, lane: 'comprehension' });
const { page, OUT, GAME } = h;
const PROTOCOL = arg('protocol', 'blind');
const PERSONAS = JSON.parse(readFileSync('tools/playtest/personas.json', 'utf8')).personas;
const PERSONA = arg('persona', PROTOCOL === 'blind' ? 'commuter' : 'newcomer');
if (PROTOCOL === 'blind' && !PERSONAS[PERSONA]) throw Error(`--persona must be one of ${Object.keys(PERSONAS).join(', ')} for a blind test`);
const MAX = +arg('max', 80);
// --intent utter: the intent of the utterance test area (lab=utter) instead of the whole game's
const INTENT = arg('intent', 'game');
let intentCache = null;
const intent = async () => {
  if (intentCache) return intentCache;
  if (INTENT !== 'utter') return (intentCache = buildIntent(GAME));
  const { UTTER_LAB } = await import(toUrl(resolvePath(arg('root', 'out'), 'src/worlds/utter-lab.js')).href);
  return (intentCache = buildUtterIntent(UTTER_LAB));
};
const intentMd = async () => (await intent()).md;
/** what was tested: the whole game, or a test area (results carry it as their segment) */
const AREA = INTENT === 'game' ? 'game' : INTENT;
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
      // where the player stands (for the play log and replays only; never sent to a blind tester)
      at: (() => { try { const p = window.__arcade?.snapshot?.().position; return p ? p.map(v => +v.toFixed(2)) : null; } catch { return null; } })(),
      // everything written on the screen, whatever the game calls it (speech bubbles, counters, signs):
      // visible text outside buttons, in page order. Game-agnostic: no class names needed.
      writing: (() => { const out = [], seen = new Set();
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          const t = n.textContent.replace(/\s+/g, ' ').trim(), el = n.parentElement;
          if (!t || !el || el.closest('button, script, style, noscript, [hidden], [aria-hidden="true"]')) continue;
          if (!vis(el) || +getComputedStyle(el).opacity === 0) continue;
          const r = el.getBoundingClientRect(); if (r.width < 1 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
          const blk = el.closest('p, div, span, li, h1, h2, h3, label, b') ?? el, key = blk.innerText?.replace(/\s+/g, ' ').trim() || t;
          if (!seen.has(key)) { seen.add(key); out.push(key); } }
        return out.filter(x => !out.some(y => y !== x && y.includes(x))); })(),
    };
  });
  log({ observe: seen, shot });
  if (PROTOCOL !== 'blind') return { step, shot, ...seen };
  // blind: what is written on the screen, unlabelled (calling one line "the goal" would already tell the tester something)
  return { step, shot, writing: seen.writing, buttons: seen.buttons, ...(step >= MAX ? { note: 'this is your last look' } : {}) };
}

async function act(a) {
  const t0 = Date.now();
  switch (a.type) {
    case 'tap': {
      // a finger lands on what can be pressed: a greyed-out twin with the same label (a word already placed) is skipped
      // labels are matched as a person reads them: line breaks and spacing don't matter ("✦ Speak" is "✦\nSpeak")
      const norm = x => String(x).replace(/\s+/g, ' ').trim().toLowerCase(), want = norm(a.label);
      const all = page.locator('button:visible:not([disabled]), .context-act:visible'), n = await all.count();
      let b = null; for (let i = 0; i < n && !b; i++) { const el = all.nth(i); if (norm(await el.innerText().catch(() => '')).includes(want) || norm(await el.getAttribute('aria-label') ?? '').includes(want)) b = el; }
      if (!b) return { ok: false, why: `no visible button with "${a.label}"` };
      // as this session's player would. A finger lands where the button is now, even if it's pulsing
      // or still popping in (Playwright's own tap waits for it to hold still, and a pulsing "Shield
      // Mira!" never did: blind test 5 Oct); a click otherwise
      if (h.INPUT === 'touch') { await b.waitFor({ state: 'visible', timeout: 20000 }); const bb = await b.boundingBox(); if (!bb) return { ok: false, why: `"${a.label}" is not on the screen` }; await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); }
      else await h.press(b, { timeout: 20000 }).catch(e => { throw new Error('could not tap: ' + e.message.split('\n')[0]); });
      await page.waitForTimeout(600); break;
    }
    case 'look': {   // drag to turn the camera: dx, dy in screen pixels (e.g. {dx: 150} turns right)
      const vs = page.viewportSize(), x0 = vs.width * .65, y0 = vs.height * .4, dx = Math.max(-300, Math.min(300, +a.dx || 0)), dy = Math.max(-200, Math.min(200, +a.dy || 0));
      if (h.INPUT === 'touch') {
        const cdp = await page.context().newCDPSession(page), pt = (x, y) => [{ x, y, id: 3, radiusX: 8, radiusY: 8, force: 1 }];
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0, y0) });
        for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x0 + dx * i / 8, y0 + dy * i / 8) });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach();
      } else { await page.mouse.move(x0, y0); await page.mouse.down(); await page.mouse.move(x0 + dx, y0 + dy, { steps: 8 }); await page.mouse.up(); }
      await page.waitForTimeout(500); break;
    }
    case 'tapAt': if (h.INPUT === 'touch') await page.touchscreen.tap(+a.x, +a.y); else await page.mouse.click(+a.x, +a.y); await page.waitForTimeout(400);
      await page.evaluate(() => window.__arcade?.simulate?.(2.5)); break;
    case 'move': {
      const key = { forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD' }[a.dir]; if (!key) return { ok: false, why: 'dir must be forward|back|left|right' };
      const sec = Math.max(.2, Math.min(8, +a.seconds || 1));   // a nudge is a fifth of a second
      if (h.INPUT === 'touch') await h.stick({ forward: [0, -1], back: [0, 1], left: [-1, 0], right: [1, 0] }[a.dir], sec);   // the thumb stick, as on a phone
      else await page.evaluate(([k, s]) => window.__arcade.simulate(s, { keys: [k] }), [key, sec]);
      await page.waitForTimeout(300); break;
    }
    case 'wait': await page.evaluate(s => window.__arcade?.simulate?.(s), Math.min(10, +a.seconds || 1)); await page.waitForTimeout(300); break;
    case 'key': await page.keyboard.press(String(a.key)); await page.waitForTimeout(400); break;
    case 'reload': if (PROTOCOL === 'blind') return { ok: false, why: 'unknown action type' }; await page.reload(); await page.waitForFunction(() => document.getElementById('loading')?.hidden, null, { timeout: 240000 }); await page.waitForTimeout(1200); break;
    case 'note': if (PROTOCOL === 'blind') return { ok: false, why: 'unknown action type' }; notes.push({ step, kind: a.kind ?? 'note', text: a.text }); break;
    case 'think': notes.push({ step, kind: 'think', text: String(a.text ?? '').slice(0, 600) }); break;
    default: return { ok: false, why: 'unknown action type' };
  }
  log({ act: a, ms: Date.now() - t0 });
  return { ok: true };
}

// ── the interview (blind protocol) ──
const PHASES = ['recall', 'probe', 'moments', 'predict', 'ratings', 'reveal'];
const LEVELS = ['unprompted', 'probed', 'moment', 'reveal', 'missed', 'misread'];
let stopped = false, stoppedAt = null, revealed = false, phaseAt = 0, refusals = [], findings = null;
const interview = [];   // {n, role, phase, text, t}
const IVLOG = `${OUT}/interview.jsonl`;
const playLog = () => readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
/** every word the tester has met: on screen while playing, said aloud, said in the interview */
function met() {
  const texts = [];
  for (const e of playLog()) if (e.observe) { const o = e.observe; texts.push(o.goal, o.card, o.action, o.hint, o.toast, o.thought, o.prompt, ...(o.buttons ?? []), ...(o.labels ?? []), ...(o.panels ?? []), ...(o.writing ?? [])); }
  for (const n of notes) texts.push(n.text);
  for (const m of interview) if (m.role === 'player') texts.push(m.text);
  return metWords(texts.filter(Boolean));
}
let designCache = null;
const design = async () => designCache ??= designVocabulary({ nouns: GAME.nouns ?? [], intents: [(await intent()).md, ...(await intent()).items.map(i => i.text)] });

/** the play log as text, for the interviewer: what was on screen, what they did, what they said */
function trace() {
  const L = [`# Play log (${PERSONA}; ${PROTOCOL}; stopped ${stoppedAt ? 'at step ' + stoppedAt : 'by the step limit'})`, ''];
  let last = '', repeat = 0, prevAct = '';
  for (const e of playLog()) {
    if (e.observe) {
      const o = e.observe, bits = [o.goal && `goal “${o.goal}”`, o.card && `card “${o.card}”`, o.prompt && `prompt “${o.prompt}”`, o.action && `action “${o.action}”`,
        o.toast && `toast “${o.toast}”`, o.thought && `thought “${o.thought}”`, o.labels?.length && `labels ${o.labels.map(x => `“${x}”`).join(' ')}`,
        o.panels?.length && `panels ${o.panels.map(x => `“${x.replace(/\s+/g, ' ').slice(0, 160)}”`).join(' ')}`,
        o.writing?.length && `all writing ${o.writing.map(x => `“${x.slice(0, 160)}”`).join(' ')}`, o.buttons?.length && `buttons [${o.buttons.join(' | ')}]`].filter(Boolean).join('; ');
      L.push(`- **step ${e.step}** (${e.shot})${o.at ? ` at ${o.at[0]},${o.at[2]}` : ''}: ${bits === last ? '(screen text unchanged)' : bits || '(no text)'}`); last = bits;
    } else if (e.act && !['understand', 'verdict', 'compare'].includes(e.act.type)) {
      const a = e.act, d = a.type === 'think' ? `said: “${a.text}”` : a.type === 'tap' ? `tapped “${a.label}”` : a.type === 'tapAt' ? `tapped the screen at ${a.x},${a.y}` : a.type === 'move' ? `held the stick ${a.dir} ${a.seconds ?? 1}s` : a.type === 'look' ? `dragged to look (${a.dx ?? 0}, ${a.dy ?? 0})` : a.type === 'wait' ? `waited ${a.seconds ?? 1}s` : a.type === 'stop' ? 'put the phone down' : JSON.stringify(a);
      repeat = d === prevAct && a.type !== 'think' ? repeat + 1 : 0; prevAct = d;
      L.push(`  - → ${d}${e.failed ? ` ✗ did not work (${e.failed})` : ''}${repeat >= 2 ? `  ⟲ same action ${repeat + 1} times in a row` : ''}`);
    }
  }
  if (h.errors.length) L.push('', '## Page errors', ...h.errors.map(x => `- ${x.msg}`));
  return L.join('\n');
}
async function interviewerBrief() {
  const it = await intent();
  return readFileSync('tools/playtest/interviewer.md', 'utf8').replaceAll('{port}', String(PORT)).replace('{intent}', it.md).replace('{items}', it.items.map(i => `- **${i.id}**: ${i.text}`).join('\n'));
}
function testerBrief() {
  const vs = page.viewportSize();
  return readFileSync('tools/playtest/tester.md', 'utf8').replace('{persona}', PERSONAS[PERSONA]).replaceAll('{port}', String(PORT)).replace('{max}', String(MAX)).replace('{width}', vs.width).replace('{height}', vs.height);
}
async function ask(m) {
  const role = m.role === 'player' ? 'player' : 'interviewer', text = String(m.text ?? '').trim();
  if (!text) return [400, { error: 'empty text' }];
  if (role === 'interviewer') {
    const p = PHASES.indexOf(m.phase);
    if (p < 0) return [400, { error: `phase must be one of ${PHASES.join(', ')}` }];
    // open questions first, the reveal last; in between the interviewer may go back to a moment
    if (!interview.length && m.phase !== 'recall') return [409, { error: 'start with recall: an open question, before anything specific' }];
    if (revealed && p < PHASES.indexOf('reveal')) return [409, { error: 'the intent has been revealed: questions now are after-reveal (phase "reveal")' }];
    if (interview.length && interview.at(-1).role === 'interviewer') return [409, { error: 'one question at a time: wait for the answer' }];
    if (!revealed && p < PHASES.indexOf('reveal')) {
      const leaks = questionLeaks(text, await design(), met());
      if (leaks.length) { refusals.push({ phase: m.phase, text, leaks }); appendFileSync(IVLOG, JSON.stringify({ refused: true, phase: m.phase, text, leaks }) + '\n');
        return [409, { error: `refused: "${leaks.join('", "')}" ${leaks.length > 1 ? 'are' : 'is'} not something the player has met (not on their screen, not in their own words) or ${leaks.length > 1 ? 'suggest' : 'suggests'} a judgement. Rephrase in their words; don't swap in a synonym for the same idea.`, leaks }]; }
    }
    phaseAt = Math.max(phaseAt, p); if (m.phase === 'reveal') revealed = true;
  } else if (!interview.length || interview.at(-1).role !== 'interviewer') return [409, { error: 'no question is waiting for an answer' }];
  const e = { n: interview.length + 1, role, phase: role === 'player' ? interview.at(-1).phase : m.phase, text: text.slice(0, 4000), afterReveal: revealed && !(role === 'interviewer' && m.phase === 'reveal' && !interview.some(x => x.phase === 'reveal')), t: Date.now() };
  interview.push(e); appendFileSync(IVLOG, JSON.stringify(e) + '\n');
  return [200, { ok: true, n: e.n }];
}
async function takeFindings(f) {
  const ids = (await intent()).items.map(i => i.id), items = Array.isArray(f.items) ? f.items : [];
  const missing = ids.filter(id => !items.some(i => i.id === id)), bad = items.filter(i => !LEVELS.includes(i.level));
  if (missing.length || bad.length) return [400, { error: `every intent item needs a level (${LEVELS.join('|')})${missing.length ? '; missing: ' + missing.join(', ') : ''}${bad.length ? '; bad level on: ' + bad.map(i => i.id).join(', ') : ''}` }];
  if (!revealed) return [409, { error: 'reveal the intent (phase "reveal") before posting findings' }];
  findings = f; writeFileSync(`${OUT}/findings.json`, JSON.stringify(f, null, 1)); return [200, { ok: true }];
}

let verdict = null, understanding = null, comparison = null;
function report() {
  const errs = h.errors.map(e => `- ${e.msg}`).join('\n') || '- none';
  const R = h.report, yn = v => v === 'yes' ? 'pass' : v === 'no' ? 'fail' : 'unresolved';
  if (PROTOCOL === 'blind') {
    const it = intentCache?.items ?? [], q = s => `“${String(s ?? '').replace(/\s+/g, ' ')}”`;
    const lv = { unprompted: 'pass', probed: 'pass', moment: 'warn', reveal: 'fail', missed: 'fail', misread: 'fail' };
    const lvWords = { unprompted: 'said unprompted', probed: 'said when asked about their own words', moment: 'only when pointed at a moment', reveal: 'only after being told', missed: 'never', misread: 'understood differently' };
    const items = findings ? it.map(i => { const f = findings.items.find(x => x.id === i.id); return `- **${i.id}** — ${lvWords[f.level]}: ${q(f.evidence)}${f.step ? ` (step ${f.step})` : ''}\n  _${i.text}_`; }).join('\n') : '- no findings posted';
    const list = (a, f) => (a ?? []).map(f).join('\n') || '- none';
    const ivMd = interview.map(m => `**${m.role === 'player' ? 'Player' : `Interviewer (${m.phase})`}:** ${m.text}`).join('\n\n') || '_no interview_';
    const thinks = notes.filter(n => n.kind === 'think').map(n => `- (step ${n.step}) “${n.text}”`).join('\n') || '- none';
    const kp = findings?.keepPlaying;
    const md = `# Blind play-test (${PERSONA})\n\n${step} steps; ${stoppedAt ? `put the phone down at step ${stoppedAt}` : 'did not stop on their own'}. The tester was told only that it was a game it had never seen (tools/playtest/tester.md). ` +
      `The interviewer alone saw the intent; ${refusals.length} question${refusals.length === 1 ? ' was' : 's were'} refused for leaking before the reveal.\n\n` +
      `## What they understood, by how it came out\n${items}\n\n## Keep playing\n${kp ? `- ${kp.score}/10; next part: **${kp.next}**. ${q(kp.why)}` : '- not asked'}\n\n` +
      `## Where they got stuck\n${list(findings?.stuck, s => `- (step ${s.step}) ${s.what} — ${q(s.evidence)}`)}\n\n## What they liked\n${list(findings?.liked, s => `- ${s.step ? `(step ${s.step}) ` : ''}${q(s.evidence)}`)}\n\n` +
      `## What they disliked\n${list(findings?.disliked, s => `- ${s.step ? `(step ${s.step}) ` : ''}${q(s.evidence)}`)}\n\n## Bugs\n${list(findings?.bugs, s => `- (step ${s.step}) ${s.what}`)}\n\n` +
      `## Surprises\n${list(findings?.surprises, s => `- ${s}`)}\n\n## How far to trust this\n${findings?.trust ?? '-'}\n\n## Said aloud while playing\n${thinks}\n\n` +
      `## Refused questions (leaks caught)\n${refusals.map(r => `- (${r.phase}) ${q(r.text)} — ${r.leaks.join(', ')}`).join('\n') || '- none'}\n\n## The interview\n\n${ivMd}\n\n## Page errors\n${errs}\n`;
    writeFileSync(`${OUT}/report.md`, md); writeFileSync(`${OUT}/trace.md`, trace());
    if (findings) {
      for (const i of it) { const f = findings.items.find(x => x.id === i.id); R.add(lv[f.level], `a newcomer understands: ${i.text}`, { detail: `${lvWords[f.level]}: ${f.evidence ?? ''}`, segment: AREA }); }
      if (kp) R.add(yn(kp.next), 'a newcomer would play the next part', { detail: `${kp.score}/10. ${kp.why ?? ''}` });
      for (const s of findings.stuck ?? []) R.add('warn', `stuck: ${s.what}`, { detail: `step ${s.step}. ${s.evidence ?? ''}` });
      for (const b of findings.bugs ?? []) R.add('fail', b.what, { lane: 'flow', detail: `step ${b.step}` });
    } else R.add('unresolved', 'what a newcomer understood (blind play and interview)', { detail: 'no findings posted' });
    R.add(interview.length ? 'pass' : 'unresolved', 'the play-test stayed blind until the reveal', { lane: 'system', detail: `${refusals.length} leaking question(s) refused; ${interview.filter(m => m.role === 'interviewer').length} asked` });
    R.write(OUT, { by: 'agent', protocol: 'blind', persona: PERSONA, steps: step, stoppedAt, findings, interview, refusals, thinks: notes.filter(n => n.kind === 'think') });
    return md;
  }
  const by = k => notes.filter(n => n.kind === k).map(n => `- (step ${n.step}) ${n.text}`).join('\n') || '- none';
  const kid = verdict ? `- Would a new player stop and look? **${verdict.look}**\n- Would they understand it and want to keep playing? **${verdict.keepPlaying}**\n- Why: ${verdict.why ?? ''}` : '- not given (send {type:\'verdict\'} before ending)';
  const cold = understanding ? Object.entries(understanding).map(([k, v]) => `- **${k}:** ${v}`).join('\n') : '- not given (send {type:\'understand\'})';
  const cmp = comparison ? [...comparison.gaps.map(g => `- **${g.severity}** — intended: ${g.intended} · perceived: ${g.observed}`), ...comparison.matches.map(m => `- match: ${m}`)].join('\n') || '- nothing compared' : '- not done (GET /intent, then send {type:\'compare\'})';
  const md = `# AI play-test (${PERSONA}, directed)\n\nSteps: ${step}. Screenshots and the full log (playlog.jsonl) are in this folder.\n\n## What the game communicated (cold, before reading the intent)\n${cold}\n\n## The first-look test\n${kid}\n\n## Intent vs perceived\n${cmp}\n\n## Confusing moments\n${by('confusion')}\n\n## Bugs\n${by('bug')}\n\n## Loopholes and exploits\n${by('exploit')}\n\n## What worked\n${by('delight')}\n\n## Ideas\n${by('idea')}\n\n## Other notes\n${by('note')}\n\n## Page errors\n${errs}\n`;
  writeFileSync(`${OUT}/report.md`, md);
  // a directed tester was told what to look at: its findings are robustness and learning evidence, not what a newcomer understood
  if (verdict) R.add('unresolved', 'first-look test (directed tester: not evidence of a newcomer)', { detail: `look ${verdict.look}, keep playing ${verdict.keepPlaying}. ${verdict.why}` });
  if (comparison) for (const g of comparison.gaps) R.add(g.severity === 'minor' ? 'warn' : 'fail', `communicates: ${g.intended}`, { detail: 'perceived (directed tester): ' + g.observed });
  for (const n of notes) if (n.kind === 'bug') R.add('fail', n.text, { lane: 'flow', detail: `step ${n.step}` }); else if (n.kind === 'exploit') R.add('fail', n.text, { lane: 'learning', detail: `step ${n.step}` }); else if (n.kind === 'confusion') R.add('warn', n.text, { detail: `step ${n.step}` });
  R.write(OUT, { by: 'agent', protocol: 'directed', persona: PERSONA, steps: step, understanding, verdict, notes });
  return md;
}

const server = http.createServer(async (req, res) => {
  const send = (code, body) => { res.writeHead(code, { 'content-type': typeof body === 'string' ? 'text/markdown; charset=utf-8' : 'application/json' }); res.end(typeof body === 'string' ? body : JSON.stringify(body)); };
  const body = async () => { let b = ''; for await (const c of req) b += c; return JSON.parse(b || '{}'); };
  const blind = PROTOCOL === 'blind', after = blind && (stopped || step >= MAX);
  try {
    const url = req.url.split('?')[0];
    if (url === '/brief') return send(200, blind ? testerBrief() : { error: 'the directed protocol has no fixed brief' });
    if (url === '/observe') { if (after) return send(409, { error: 'you have put the phone down' }); return send(200, await observe()); }
    if (blind && ['/trace', '/interview', '/interview/brief', '/interview/pending', '/findings'].includes(url) && !after) return send(409, { error: 'not during play' });
    if (url === '/trace') return send(200, trace());
    if (url === '/interview/brief') return send(200, await interviewerBrief());
    if (url === '/interview/pending') { const l = interview.at(-1); return send(200, l?.role === 'interviewer' ? { waiting: true, n: l.n, phase: l.phase, text: l.text } : { waiting: false }); }
    if (url === '/interview') { if (req.method === 'POST') { const [c, b] = await ask(await body()); return send(c, b); } return send(200, { revealed, phase: PHASES[phaseAt], interview, refused: refusals.length }); }
    if (url === '/findings' && req.method === 'POST') { const [c, b] = await takeFindings(await body()); return send(c, b); }
    if (url === '/intent') {
      if (blind) return send(404, { error: 'blind protocol: the intent goes to the interviewer only (/interview/brief)' });
      if (!understanding || !verdict) return send(409, { error: 'cold first: send {type:"understand"} and {type:"verdict"} before reading the intent' });
      log({ intentRead: true }); return send(200, { md: await intentMd() });
    }
    if (url === '/act' && req.method === 'POST') {
      const a = await body();
      if (a.type === 'end') { const md = report(); send(200, { ok: true, report: `${OUT}/report.md`, md }); setTimeout(async () => { await h.browser.close(); server.close(); process.exit(0); }, 200); return; }
      if (blind) {
        if (['understand', 'verdict', 'compare', 'note', 'reload'].includes(a.type)) return send(400, { ok: false, why: 'unknown action type' });
        if (after) return send(409, { ok: false, why: 'you have put the phone down' });
        if (a.type === 'stop') { stopped = true; stoppedAt = step; log({ act: a }); return send(200, { ok: true }); }
        const r = await act(a).catch(e => ({ ok: false, why: String(e.message ?? e).split('\n')[0] })); if (!r.ok) log({ act: a, failed: r.why });
      if (step >= MAX && r.ok) r.note = 'that was your last action'; return send(200, r);
      }
      if (a.type === 'understand') { if (comparison) return send(409, { error: 'the cold account is frozen once the intent has been compared' }); understanding = Object.fromEntries(['place', 'who', 'goal', 'controls', 'lesson', 'unsure'].map(k => [k, String(a[k] ?? '').slice(0, 600)])); log({ act: a }); return send(200, { ok: true }); }
      if (a.type === 'compare') { if (!understanding || !verdict) return send(409, { error: 'cold first' }); comparison = { matches: (a.matches ?? []).map(String), gaps: (a.gaps ?? []).map(g => ({ intended: String(g.intended), observed: String(g.observed), severity: ['blocker', 'major', 'minor'].includes(g.severity) ? g.severity : 'major' })) }; log({ act: a }); return send(200, { ok: true }); }
      if (a.type === 'verdict') { verdict = { look: String(a.look ?? 'unsure'), keepPlaying: String(a.keepPlaying ?? 'unsure'), why: String(a.why ?? '').slice(0, 600) }; log({ act: a }); return send(200, { ok: true }); }
      return send(200, await act(a));
    }
    send(404, { error: 'GET /brief, GET /observe or POST /act' });
  } catch (e) { send(500, { ok: false, error: String(e.message ?? e) }); }
});
server.listen(PORT, () => console.log(`play server (${PROTOCOL}, ${PERSONA}) on http://localhost:${PORT} — screenshots in ${OUT}`));
