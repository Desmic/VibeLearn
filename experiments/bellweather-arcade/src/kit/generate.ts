import { mulberry32 } from '../vendor/rng';
import type { IslandSpec, Placement, ScatterRule } from './dress';
import type { GroundPalette, StrataPalette, XZ } from './terrain';

// Island specs written by code instead of by hand: the first small step from
// "layout as data" to "layout generated from a few choices". A theme says what
// a place is made of; the generator decides where things go, deterministically
// from a seed, keeping clear space where requested. Used for the scenery
// islands along the flight route; a course generator can call it the same way.

export interface IslandTheme {
  id: string;
  palette: { ground: GroundPalette; strata: StrataPalette };
  trees: { role: string; variants?: number[]; scale: [number, number] }[];
  shrubs?: { role: string; scale: [number, number] }[];
  rocks?: { role: string; scale: [number, number] }[];
  scatter: ScatterRule[];          // densities per m², as in a hand-written spec
}

export interface GenerateOptions {
  seed: number; center: XZ; radius: number; elevation?: number; depth?: number;
  theme: IslandTheme;
  /** keep these spots clear (a landing, a machine…) */
  anchors?: { at: XZ; r: number }[];
  /** 0 calm … 1 busy */
  busyness?: number;
  satellites?: number;
}

/** bump when the same seed would give a different island (layout, counts, randomness order) */
export const GENERATOR_VERSION = '1';

export function generateIslandSpec(o: GenerateOptions): IslandSpec {
  const r = mulberry32(o.seed), R = o.radius, busy = o.busyness ?? .5, th = o.theme;
  const anchors = (o.anchors ?? []).map((a, i) => ({ id: 'anchor' + i, ...a }));
  const placed: { at: XZ; r: number }[] = [...anchors];
  const free = (x: number, z: number, rr: number) => Math.hypot(x, z) < R * .82 && placed.every(p => Math.hypot(x - p.at[0], z - p.at[1]) > p.r + rr);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const landmarks: Placement[] = [];
  const place = (role: string, scale: [number, number], footprint: number, variants?: number[], extra: Partial<Placement> = {}) => {
    for (let t = 0; t < 40; t++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * .8, x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (!free(x, z, footprint)) continue;
      placed.push({ at: [x, z], r: footprint });
      landmarks.push({ role, at: [+x.toFixed(2), +z.toFixed(2)], scale: +(scale[0] + r() * (scale[1] - scale[0])).toFixed(2), variant: variants ? pick(variants) : Math.floor(r() * 5), ...extra });
      return;
    }
  };
  // a few trees (more on bigger, busier islands), then shrubs and rocks
  const nTrees = Math.max(1, Math.round(R * R * .11 * (.6 + busy)));
  for (let i = 0; i < nTrees; i++) { const t = pick(th.trees); place(t.role, t.scale, 1.6, t.variants); }
  for (let i = 0; i < Math.round(R * .5 * (.5 + busy)); i++) if (th.shrubs?.length) { const s = pick(th.shrubs); place(s.role, s.scale, .8, undefined, { fade: false }); }
  for (let i = 0; i < Math.round(R * .25); i++) if (th.rocks?.length) { const s = pick(th.rocks); place(s.role, s.scale, 1.0, undefined, { fade: false }); }
  return {
    id: `${th.id}-${o.seed}`, seed: o.seed, generator: { name: 'island', version: GENERATOR_VERSION }, center: o.center, radius: R, depth: o.depth ?? R * .9, topY: .13,
    elevation: o.elevation ?? 0, satellites: o.satellites ?? Math.round(R * .5),
    palette: th.palette, anchors, paths: [], hedges: [], landmarks,
    scatter: th.scatter.map(s => ({ ...s, density: s.density * (.5 + busy) })),
  };
}
