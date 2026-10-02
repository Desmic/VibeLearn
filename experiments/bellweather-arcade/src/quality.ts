// Graphics quality tiers for the painted study. The player picks one in the
// pause menu (or leaves it on Auto); the choice is kept in this browser only.
// Budgets are set against a low-end phone (Galaxy F15: Mali-G57 MC2) for Low.

export type Tier = 'low' | 'medium' | 'high';
export type Choice = Tier | 'auto';

export interface Quality {
  choice: Choice;
  tier: Tier;
  antialias: boolean;
  maxPixelRatio: number;     // upper bound for render resolution (x CSS pixels)
  minPixelRatio: number;     // adaptive resolution never goes below this
  targetMs: number;          // adaptive resolution aims for this frame time
  shadowMap: number;         // shadow map size in texels
  leafFraction: number;      // share of leaf cards kept on near trees
  cloudRings: number;        // painted cloud-bank layers on the horizon (0-3)
  islands: number;           // satellite floating islands (0-9)
  cloudLobes: number;        // share of cumulus lobes kept
  canopyDetail: number;      // far-tree canopy lobes multiplier
  birds: boolean;
  people: boolean;
  strokes: boolean;          // world-space brush grain on surfaces
  lobeTrees: 'all' | 'distant' | 'none'; // solid painted canopy puffs instead of leaf cards
  reflections: boolean;      // mirrored scene in the lily pool
}

const TIERS: Record<Tier, Omit<Quality, 'choice' | 'tier'>> = {
  low:    { antialias: false, maxPixelRatio: .9,  minPixelRatio: .5,  targetMs: 16.7, shadowMap: 1024, leafFraction: .38, cloudRings: 1, islands: 4, cloudLobes: .45, canopyDetail: .5, birds: false, people: true, strokes: false, lobeTrees: 'all', reflections: false },
  medium: { antialias: false, maxPixelRatio: 1.25, minPixelRatio: .6, targetMs: 16.7, shadowMap: 2048, leafFraction: .6,  cloudRings: 2, islands: 7, cloudLobes: .75, canopyDetail: .8, birds: true,  people: true, strokes: true, lobeTrees: 'distant', reflections: false },
  high:   { antialias: true,  maxPixelRatio: 2,   minPixelRatio: .6, targetMs: 16.7, shadowMap: 2048, leafFraction: 1,   cloudRings: 3, islands: 9, cloudLobes: 1,   canopyDetail: 1,  birds: true,  people: true, strokes: true, lobeTrees: 'none', reflections: true },
};

const KEY = 'bellweather.graphics';

export function isPhoneLike() {
  try {
    const coarse = matchMedia('(pointer: coarse)').matches;
    const small = Math.min(screen.width, screen.height) < 820;
    return coarse && small;
  } catch { return false; }
}

export function readChoice(): Choice {
  const fromUrl = new URLSearchParams((window as any).__vlSearch ?? location.search).get('quality');
  if (fromUrl === 'low' || fromUrl === 'medium' || fromUrl === 'high' || fromUrl === 'auto') return fromUrl;
  try { const v = localStorage.getItem(KEY); if (v === 'low' || v === 'medium' || v === 'high' || v === 'auto') return v; } catch { /* storage unavailable */ }
  return 'auto';
}

export function saveChoice(c: Choice) {
  try { localStorage.setItem(KEY, c); } catch { /* storage unavailable: choice lasts this visit */ }
}

let cached: Quality | null = null, autoMeasured = false;
export const autoWasMeasured = () => autoMeasured;
export function quality(): Quality {
  if (cached) return cached;
  const search = new URLSearchParams((window as any).__vlSearch ?? location.search);
  if (search.get('render') !== 'painted') { cached = { choice: 'auto', tier: 'high', ...TIERS.high, maxPixelRatio: 1.5 }; return cached; }
  const choice = readChoice();
  // Measured 30 Sep: the Galaxy F15 (our low-end phone) holds ~89 fps on Medium,
  // so Auto starts at Medium everywhere; Low stays available for weaker devices.
  // Auto: Medium unless this device has already been measured (autoBenchmark)
  // as able to hold High at 60 fps. The result rides in the URL (survives the
  // reload inside the claude.ai frame) and in storage where storage works.
  let measured = search.get('auto');
  if (measured !== 'high' && measured !== 'medium' && measured !== 'measure') { try { measured = localStorage.getItem(KEY + '.auto'); } catch { measured = null; } }
  const tier: Tier = choice === 'auto' ? (measured === 'high' ? 'high' : 'medium') : choice;
  autoMeasured = measured === 'high' || measured === 'medium';
  cached = { choice, tier, ...TIERS[tier] };
  // diagnostic overrides for profiling individual features
  const refl = search.get('refl'), trees = search.get('trees');
  if (refl !== null) cached.reflections = refl === '1';
  if (trees === 'all' || trees === 'distant' || trees === 'none') cached.lobeTrees = trees;
  return cached;
}

// Measures this device once, behind the loading screen: renders the finished
// Medium scene a few times at High's resolution and takes the median GPU time
// (timer queries where the browser has them, otherwise frames forced to finish
// with readPixels, which over-reads a little). High costs ~1.5x Medium at equal
// resolution (MSAA, full leaf cards, pool reflection), so High is chosen only
// when that estimate leaves headroom under a 60 fps frame (16.7 ms).
export async function autoBenchmark(renderer: import('three').WebGLRenderer, scene: import('three').Scene, camera: import('three').Camera): Promise<{ tier: Tier; ms: number; via: string }> {
  const gl = renderer.getContext() as WebGL2RenderingContext, px = new Uint8Array(4), prev = renderer.getPixelRatio();
  renderer.setPixelRatio(Math.min(devicePixelRatio, TIERS.high.maxPixelRatio));
  const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  for (let i = 0; i < 4; i++) { renderer.render(scene, camera); sync(); }
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const times: number[] = []; let via = 'finish';
  if (ext) {
    via = 'timer';
    for (let i = 0; i < 7; i++) {
      const q = gl.createQuery()!; gl.beginQuery(ext.TIME_ELAPSED_EXT, q); renderer.render(scene, camera); gl.endQuery(ext.TIME_ELAPSED_EXT);
      for (let k = 0; k < 100 && !gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE); k++) await new Promise(r => setTimeout(r, 5));
      if (!gl.getParameter(ext.GPU_DISJOINT_EXT) && gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) times.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
      gl.deleteQuery(q);
    }
  }
  if (times.length < 3) { via = 'finish'; times.length = 0; for (let i = 0; i < 7; i++) { const t = performance.now(); renderer.render(scene, camera); sync(); times.push(performance.now() - t); } }
  renderer.setPixelRatio(prev);
  times.sort((a, b) => a - b); const ms = times[times.length >> 1];
  const tier: Tier = ms * 1.5 <= 11 ? 'high' : 'medium';
  try { localStorage.setItem(KEY + '.auto', tier); } catch { /* storage unavailable: the URL carries it */ }
  return { tier, ms: +ms.toFixed(1), via };
}
