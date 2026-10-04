// Mix check: measures the real audio output in the browser (an analyser on the master bus)
// and checks the layers sit where they should against the voices: ambience well under,
// music under, nothing clipping. Game-agnostic: needs __vlScape (kit/soundscape.ts) and
// __vlVoice (kit/voice.ts) on the page (docs/TEST-CONTRACT.md).
//   bash tools/build.sh && node tools/mixcheck.mjs
import { harness } from './harness.mjs';
const h = await harness({ title: 'Mix check', outDefault: '/tmp/mixcheck' });
const { page, check } = h;
await h.segment('mix', async () => {
  await h.fresh('&title=0'); await h.skipOpening(); await page.mouse.click(200, 300); await page.waitForTimeout(800);
  await page.evaluate(async () => {
    const { audio } = await import('/src/sfx.js'); const a = audio(); const an = a.ctx.createAnalyser(); an.fftSize = 2048; a.master.connect(an);
    const buf = new Float32Array(2048); window.__mixReset = () => { window.__mix = { peak: 0, sum: 0, n: 0 }; }; window.__mixReset();
    setInterval(() => { an.getFloatTimeDomainData(buf); let p = 0, s = 0; for (const v of buf) { p = Math.max(p, Math.abs(v)); s += v * v; } window.__mix.peak = Math.max(window.__mix.peak, p); window.__mix.sum += s / buf.length; window.__mix.n++; }, 40);
  });
  const take = async (setup, ms) => { await page.evaluate(setup); await page.waitForTimeout(ms); const v = await page.evaluate(() => window.__mix); return { peak: v.peak, rms: 10 * Math.log10(v.sum / Math.max(1, v.n)) }; };
  const amb = await take(() => { window.__vlScape.music = false; window.__mixReset(); }, 8000);
  const mus = await take(() => { window.__vlScape.music = true; window.__mixReset(); window.__vlScape.testPhrase(); }, 4000);
  const voi = await take(() => { window.__mixReset(); window.__vlVoice.play('Mira', 'Zip! Up here! The skiff\'s ready!'); }, 3000);
  const f = x => `peak ${x.peak.toFixed(3)}, rms ${x.rms.toFixed(1)} dBFS`;
  check('a voice line is audible (reference)', voi.peak > .1, f(voi));
  check('ambience sits 12–25 dB under the voices', voi.rms - amb.rms >= 12 && voi.rms - amb.rms <= 25, `${(voi.rms - amb.rms).toFixed(1)} dB under · ${f(amb)}`);
  check('music sits under the voices, still heard', mus.peak < voi.peak && voi.rms - mus.rms >= 4 && voi.rms - mus.rms <= 18, `${(voi.rms - mus.rms).toFixed(1)} dB under · ${f(mus)}`);
  check('nothing clips', Math.max(amb.peak, mus.peak, voi.peak) < .95, `max peak ${Math.max(amb.peak, mus.peak, voi.peak).toFixed(3)}`);
});
await h.finish();
