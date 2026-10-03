// Frame-rate benchmark: the same camera views, the same seconds, every time, so a
// build can be compared with another on one device, and one device with another
// (laptop vs the Galaxy F15). Open the game with `bench=1` in its address
// (`#bench=1` on the hosted copy; add `quality=medium|high`, `adaptive=0` to fix
// the resolution). It waits for the world to settle, visits each view, and shows a
// table on screen (and in `window.__vlBench`, and the console as `[bench]`).
// Game-agnostic: a game supplies its views and how to stand the camera at one.

export interface BenchView { name: string; go: () => void }
export interface BenchRow { view: string; fps: number; medianMs: number; p90Ms: number; costMs: number; res: number; draws: number; tris: number }

export async function runBench(o: {
  views: BenchView[]; host: HTMLElement; label: string;
  /** the renderer's current pixel ratio, draw calls and triangles */
  stats: () => { res: number; draws: number; tris: number };
  gpu?: string; warmSec?: number; measureSec?: number;
  /** draw one frame now; with `gl`, frames are also timed back to back and forced to finish
   *  (the cost of a frame without the display's refresh cap: 60 fps screens hide headroom) */
  render?: () => void; gl?: WebGLRenderingContext | WebGL2RenderingContext;
}) {
  const warm = o.warmSec ?? 2.5, measure = o.measureSec ?? 5;
  const panel = document.createElement('pre'); panel.className = 'bench-panel'; panel.setAttribute('aria-live', 'polite');
  panel.style.cssText = 'position:absolute;left:8px;right:8px;top:8px;z-index:50;margin:0;padding:10px 12px;border-radius:12px;background:#0b1d30e8;color:#e8f6ff;font:12px/1.45 ui-monospace,Consolas,monospace;white-space:pre-wrap;pointer-events:none';
  o.host.appendChild(panel);
  const frame = () => new Promise<number>(r => requestAnimationFrame(r));
  const rows: BenchRow[] = [];
  const head = `BENCH ${o.label}\n${o.gpu ?? ''}\n${innerWidth}x${innerHeight} @${devicePixelRatio}\n`;
  panel.textContent = head + 'settling…';
  { const s0 = performance.now(); for (let i = 0; i < 30 || performance.now() - s0 < 3000; i++) await frame(); }   // shaders compiled, assets in
  for (const v of o.views) {
    v.go();
    panel.textContent = head + rows.map(fmt).join('\n') + `\n${v.name}: warming…`;
    let t0 = performance.now(); while (performance.now() - t0 < warm * 1000) await frame();
    const dts: number[] = []; let last = await frame(); t0 = last;
    while (last - t0 < measure * 1000) { const t = await frame(); dts.push(t - last); last = t; }
    dts.sort((a, b) => a - b);
    const med = dts[dts.length >> 1], p90 = dts[Math.floor(dts.length * .9)], s = o.stats();
    let cost = 0;
    if (o.render && o.gl) {
      const px = new Uint8Array(4), gl = o.gl, c: number[] = [];
      for (let i = 0; i < 16; i++) { const a = performance.now(); o.render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); c.push(performance.now() - a); await frame(); }
      c.sort((a, b) => a - b); cost = c[c.length >> 1];
    }
    rows.push({ view: v.name, fps: +(1000 / med).toFixed(1), medianMs: +med.toFixed(1), p90Ms: +p90.toFixed(1), costMs: +cost.toFixed(1), res: +s.res.toFixed(2), draws: s.draws, tris: s.tris });
  }
  const mean = rows.reduce((n, r) => n + r.fps, 0) / rows.length, meanCost = rows.reduce((n, r) => n + r.costMs, 0) / rows.length;
  panel.textContent = head + rows.map(fmt).join('\n') + `\nMEAN ${mean.toFixed(1)} fps  cost ${meanCost.toFixed(1)} ms  — done`;
  const result = { label: o.label, gpu: o.gpu, screen: [innerWidth, innerHeight, devicePixelRatio], rows, meanFps: +mean.toFixed(1), meanCostMs: +meanCost.toFixed(1) };
  (window as unknown as { __vlBench: unknown }).__vlBench = result;
  console.info('[bench]', JSON.stringify(result));
  return result;
}
const fmt = (r: BenchRow) => `${r.view.padEnd(13)} ${String(r.fps).padStart(5)} fps  p90 ${String(r.p90Ms).padStart(5)} ms  cost ${String(r.costMs).padStart(5)} ms  res ${r.res}x  ${r.draws} dr  ${(r.tris / 1000).toFixed(0)}k tri`;
