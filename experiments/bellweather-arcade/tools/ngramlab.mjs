// The next-word lab (lab=ngram), played: absorbs each sign (which the engine reads), opens the
// word ring, picks a first word and the engine's suggestions (data-action tags), and checks what
// the kit decided is what the world shows: suggestions are what was read; a word read too rarely
// is shown but not said; no sign says "long rope bridge" but the engine joins pairs; "let it
// finish" says the engine's favourite; working things can be walked across; the doorway lights.
//   bash tools/build.sh && node tools/ngramlab.mjs [--input touch] [--out /tmp/nglab]
import { harness } from './harness.mjs';
const h = await harness({ title: 'Next-word lab', outDefault: '/tmp/nglab', tool: 'ngramlab', lane: 'flow' });
const { page } = h;
const sim = s => page.evaluate(s => window.__arcade.simulate(s), s);
await h.open('&lab=ngram'); await page.waitForTimeout(1500);
await h.shot('start');
const lab = () => page.evaluate(() => ({ sites: window.__vlUtterLab.sites.map(s => ({ id: s.s.id, from: [s.from.x, s.from.z], solved: s.solved })), sources: window.__vlUtterLab.sources, carried: window.__vlUtterLab.echo.carried }));
const barks = () => page.evaluate(() => [...document.querySelectorAll('.speech.bark')].filter(e => !e.hidden).map(e => e.textContent).join(' | '));
const chips = () => page.evaluate(() => [...document.querySelectorAll('.wr-chip')].map(e => (e.classList.contains('rare') ? '·' : '') + (e.dataset.w ?? 'finish') + (e.querySelector('small')?.textContent ?? '')));
const absorb = async src => {
  const r = await h.walkTo(src.at, { near: 1.3 });
  for (const yaw of [0, .8, -.8, 1.6, -1.6, 2.4, -2.4, 3.14]) {
    const p = await h.player(); await h.pose(p[0], p[2], Math.atan2(-(src.at[0] - p[0]), -(src.at[1] - p[2])) + yaw * .25);
    await sim(.3); if (await page.locator('.context-act', { hasText: `“${src.word}”` }).isVisible()) break;
  }
  await h.act(`“${src.word}”`).catch(() => {}); await sim(1.5);
  return (await lab()).carried.includes(src.word) || console.log('  (could not absorb', src.word, JSON.stringify(r), ')');
};
// the Speak prompt moves with the camera, so a test tap can land where it just was: tap again until the ring is up
const openRing = async site => {
  await h.walkTo(site.from, { near: .6 });
  for (let i = 0; i < 4; i++) { await h.act('Speak', 20000); await page.waitForTimeout(300); if (await page.evaluate(() => window.__vlUtterLab.open)) return; await sim(.5); }
};
const tap = w => h.press(page.locator(`.wr-chip[data-w="${w}"]`));
// where the camera looks (flat, radians), to measure the turns a speak makes (runs 15–16: "two big
// turns per phrase", into the speak shot and back)
const viewYaw = () => page.evaluate(() => { const s = window.__arcade.snapshot(); return Math.atan2(s.position[0] - s.camera[0], s.position[2] - s.camera[2]); });
const turn = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) * 180 / Math.PI;
const turns = [];
const speakNow = async name => {
  await page.waitForTimeout(300); await h.shot(name + '-ring');
  const v0 = await viewYaw(); let most = 0;
  await h.press(page.locator('[data-action="speak"]'));
  for (let i = 0; i < 8; i++) { await sim(.4); await page.waitForTimeout(250); most = Math.max(most, turn(await viewYaw(), v0)); }
  await h.shot(name + '-made');
  await h.until(async () => { most = Math.max(most, turn(await viewYaw(), v0)); return page.evaluate(() => !window.__vlUtterLab.busy); }, 12);
  await sim(3); await h.shot(name + '-after'); turns.push({ name, into: Math.round(most), back: Math.round(turn(await viewYaw(), v0)) });
  const m = (await page.evaluate(() => window.__vlUtterLog)).at(-1);
  console.log(name, m.words.join(' '), '→', m.reason, m.thing); return m;
};
const say = async (site, words, name) => { await openRing(site); for (const w of words) await tap(w); return speakNow(name); };
const by = id => L.sources.find(s => s.id === id);
let L = await lab();
const [A, B, C] = L.sites;

// 1. the first gap: the engine offers what it has read after a word
await absorb(by('stone-sign')); await absorb(by('rope-coil'));
L = await lab(); h.check('reading signs gives first words: "stone" and "rope"', ['stone', 'rope'].every(w => L.carried.includes(w)), L.carried.join(', '));
await openRing(A);
h.check('the ring asks for a first word, offering only the words carried', (c => c.join() === 'stone,rope')(await chips()), (await chips()).join(' '));
await tap('stone'); await page.waitForTimeout(200);
const s1 = await chips(); await h.shot('a-suggest');
h.check('after "stone", the engine suggests what it read after it, with counts', s1.some(c => c.startsWith('bridge×1')) && s1.some(c => c.startsWith('steps×1')), s1.join(' '));
await tap('steps'); h.check('"stone steps" makes a stone (the wrong kind of thing)', (await speakNow('a-steps')).reason === 'wrong-kind');
h.check('"stone bridge" crosses the first gap', (await say(A, ['stone', 'bridge'], 'a-bridge')).works);
const w1 = await h.walkTo([71, -40], { near: 1 }); h.check('the stone bridge can be walked across', w1.ok, JSON.stringify(w1), 'fail', 'world');

// 2. the wide gap: no sign says what it needs; the engine joins pairs read in different places
await absorb(by('drop-sign'));
await openRing(B); await tap('long'); await page.waitForTimeout(200);
const s2 = await chips(); await h.shot('b-before-song');
h.check('after "long", its favourites are what it read most ("way" first); "bridge" is shown but too rare to say', s2[0]?.startsWith('way×3') && s2.some(c => c.startsWith('·bridge×1')), s2.join(' '));
await tap('bridge'); await page.waitForTimeout(300);
h.check('tapping the rare word: it is not said, and Zip says why', (await page.evaluate(() => window.__vlUtterLab.ring.slots.length)) === 1 && /once/.test(await barks()), await barks());
await tap('noodle'); h.check('"long noodle" gives way (the engine likes noodles)', (await speakNow('b-noodle')).reason === 'too-weak');
await absorb(by('song-board'));
h.check('reading the builders\' song: Zip says what it learned ("long rope" ×2)', /long rope” ×2/.test(await barks()), await barks());
await openRing(B); await tap('long'); await page.waitForTimeout(200);
const s3 = await chips(); await h.shot('b-after-song');
h.check('now "rope" is sayable after "long" (×2, grown +2); "bridge" still too rare', s3.some(c => /^rope×2/.test(c) && /\+2/.test(c)) && s3.some(c => c.startsWith('·bridge')), s3.join(' '));
// a tie is seen, not explained: words read equally often share a row
const box = w => page.evaluate(w => { const e = document.querySelector(`.wr-chip[data-w="${w}"]`); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(r.top)]; }, w);
const bs = (await Promise.all(['ago', 'noodle', 'rope'].map(box))).filter(Boolean).sort((a, b) => a[0] - b[0]);
h.check('words read equally often (×2) sit on one row, side by side without overlapping', bs.length === 3 && bs.every(b => Math.abs(b[2] - bs[0][2]) < 3) && bs[0][1] <= bs[1][0] + 1 && bs[1][1] <= bs[2][0] + 1, JSON.stringify(bs), 'fail', 'learning');
await tap('rope'); await page.waitForTimeout(200);
const s3b = await chips();
h.check('after "long rope" it offers what it read after "rope" on another sign: "bridge"', s3b.some(c => /^bridge×/.test(c)), s3b.join(' '));
await tap('bridge');
h.check('"long rope bridge" (no sign says it) crosses the wide gap', (await speakNow('b-chain')).works);
const w2 = await h.walkTo([85.6, -40], { near: 1 }); h.check('the long rope bridge can be walked across', w2.ok, JSON.stringify(w2), 'fail', 'world');

// 3. the doorway: its favourite isn't what you need
await absorb(by('paper-note'));
await openRing(C); await tap('paper'); await page.waitForTimeout(200);
const s4a = await chips(); await h.shot('c-before-hook');
h.check('after the note alone, "lantern" is too rare to say after "paper"', s4a.some(c => c.startsWith('·lantern')) && await page.locator('.wr-rare-line').isVisible(), s4a.join(' '));
await h.press(page.locator('[data-action="close-ring"]')); await sim(.5);
await absorb(by('hook-sign'));
await openRing(C); await tap('paper'); await page.waitForTimeout(200);
const s4 = await chips();
h.check('after the hook too: "plane" still first, "lantern" sayable (+2) but not its favourite', s4[0]?.startsWith('plane') && s4.some(c => /^lantern×3/.test(c)), s4.join(' '));
await h.press(page.locator('[data-action="finish"]')); for (let i = 0; i < 6; i++) { await sim(.2); await page.waitForTimeout(120); }
h.check('left to finish, it says "paper plane" (a plane, the wrong kind)', (m => m.words.join(' ') === 'paper plane' && m.reason === 'wrong-kind')(await speakNow('c-plane')));
h.check('"paper lantern" lights the doorway', (await say(C, ['paper', 'lantern'], 'c-lantern')).works);

// 4. the lighthouse: only the engine's own finish counts; the echo stone reads what's said there back in
const D = (await lab()).sites[3];
const finishAt = async name => { await openRing(D); await tap('paper'); await h.press(page.locator('[data-action="finish"]')); for (let i = 0; i < 6; i++) { await sim(.2); await page.waitForTimeout(120); } return speakNow(name); };
h.check('at the lighthouse, letting it finish says its favourite: "paper plane" (no light)', (m => m.words.join(' ') === 'paper plane' && !m.works)(await finishAt('d-plane')));
const echoed = await say(D, ['paper', 'lantern'], 'd-echo');
h.check('"paper lantern" picked by hand is only an echo there (no light)', !echoed.works && echoed.thing === null);
h.check('...but the echo stone read it back in: "lantern" climbs after "paper"', await page.evaluate(() => window.__vlUtterLab.engine.count('paper', 'lantern')) >= 5, String(await page.evaluate(() => window.__vlUtterLab.engine.count('paper', 'lantern'))));
let lit = null; for (let i = 0; i < 4 && !lit?.works; i++) { lit = await finishAt('d-finish' + i); if (!lit.works) await say(D, ['paper', 'lantern'], 'd-echo' + i); }
h.check('once "lantern" is its favourite, letting it finish lights the lighthouse', !!lit?.works && lit.words.join(' ') === 'paper lantern', lit?.words.join(' '));
console.log('speak turns (degrees from the view before speaking):', turns.map(t => `${t.name} ${t.into}/${t.back}`).join(', '));
h.check('a speak shot pulls back rather than swinging round (under 50° from the player\'s view)', turns.every(t => t.into < 50), turns.filter(t => t.into >= 50).map(t => `${t.name} ${t.into}°`).join(', '), 'fail', 'feel');
h.check('the lab says it is done', /lab is done/.test(await h.goal() ?? ''), await h.goal());
h.check('...and Zip says the link to language models out loud', await h.until(async () => /chat AIs/.test(await barks()), 12), await barks());
await h.until(() => page.evaluate(() => !!document.querySelector('.star-row')), 20);
h.check('a summary shows what was done', await page.evaluate(() => !!document.querySelector('.star-row')));
await h.shot('end');
await h.finish();
