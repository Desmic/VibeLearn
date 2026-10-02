import * as T from 'three';
import { mulberry32, type Rng } from '../vendor/rng';
import type { Kit } from './kit';
import { paintGround, islandBase, type XZ, type GroundPalette, type StrataPalette } from './terrain';

// Island layout as data. A world spec says WHAT goes where by meaning (paths,
// hedges, landmark trees, scatter rules with clear zones around gameplay
// anchors); dressIsland() turns it into meshes from a kit. The same builder
// can dress a different island, or the same island calmer or busier, by
// editing the spec, not code. Gameplay objects (gates, notes, machines) are
// placed here as `entities` (what and where, by id and kind); the game builds
// and runs them, and the dressing keeps clear of them like any anchor.

export interface Anchor { at: XZ; r: number; id?: string }
/** a gameplay object the game builds: where (relative to the centre), what kind, and which station it serves */
export interface EntitySpec { id: string; kind: string; at: XZ; r: number; rot?: number; station?: string; params?: Record<string, unknown> }
export interface PathSpec { pts: XZ[]; width: number; stones?: { role: string; spacing: number; scale: [number, number] } }
export interface HedgeSpec { from: XZ; to: XZ; role: string; scale: [number, number]; spacing: number }
export interface Placement { role: string; at: XZ; variant?: number; scale?: number; rot?: number; fade?: boolean; blockCamera?: boolean; solid?: boolean }
export type Region = { kind: 'disc'; at?: XZ; r: number; r0?: number } | { kind: 'around'; placements: 'landmarks'; r: number };
export interface ScatterRule {
  role: string; density: number; scale: [number, number];
  region?: Region;            // default: whole island top
  spacing?: number;           // minimum distance between items of this rule
  pathClear?: number;         // extra clearance from paths (negative: allowed on path edges)
  onPathEdge?: boolean;       // only place along path edges
  variants?: number[];        // subset of the role's models
  shadows?: boolean;
}
export interface IslandSpec {
  id: string; seed: number; center: XZ; radius: number; depth: number; topY: number;
  palette: { ground: GroundPalette; strata: StrataPalette };
  anchors: Anchor[]; paths: PathSpec[]; hedges: HedgeSpec[]; landmarks: Placement[]; scatter: ScatterRule[];
  /** which generator made this spec and with what (a seed alone is not enough to reproduce it once the generator changes) */
  generator?: { name: string; version: string };
  elevation?: number;         // world height of the island top (0 = level with the town)
  satellites?: number;        // small floating rocks drifting around the island
  /** game-made props by name (the game registers builders in DressOptions.props) */
  props?: { prop: string; at: XZ; rot?: number; params?: Record<string, unknown>; solid?: number }[];
  /** gameplay objects (notes, gates, machines); the dressing keeps clear of them */
  entities?: EntitySpec[];
}

/** an entity's world position [x, z] */
export function entityAt(spec: IslandSpec, id: string): XZ {
  const e = spec.entities?.find(x => x.id === id); if (!e) throw Error(`island ${spec.id}: no entity ${id}`);
  return [spec.center[0] + e.at[0], spec.center[1] + e.at[1]];
}
export const entitiesOf = (spec: IslandSpec, kind: string) => (spec.entities ?? []).filter(e => e.kind === kind);

export type PropBuilder = (params: Record<string, unknown>) => T.Object3D;
export interface DressOptions { density?: number; groundSize?: number; shadows?: boolean; props?: Record<string, PropBuilder> }
export interface Dressed {
  root: T.Group; cameraBlockers: T.Object3D[]; solids: { x: number; z: number; r: number }[];
  /** small scatter (grass, flowers, pebbles): hide it when the player is far away */
  detail: T.Group;
  stats: { instances: number; drawables: number; tris: number };
}

const distToSeg = (px: number, pz: number, [ax, az]: XZ, [bx, bz]: XZ) => {
  const dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l));
  return Math.hypot(px - ax - dx * t, pz - az - dz * t);
};

export function dressIsland(spec: IslandSpec, kit: Kit, opt: DressOptions = {}): Dressed {
  const density = opt.density ?? 1, [cx, cz] = spec.center, R = spec.radius;
  const root = new T.Group(); root.name = 'island-dressing:' + spec.id; root.position.set(cx, spec.elevation ?? 0, cz);
  const rng = mulberry32(spec.seed);
  const solids: Dressed['solids'] = [], cameraBlockers: T.Object3D[] = [];
  const stats = { instances: 0, drawables: 0, tris: 0 };

  // landmarks first: their footprints shade the ground and clear the scatter
  const lm = spec.landmarks.map(p => {
    const md = kit.model(p.role, p.variant ?? 0), s = p.scale ?? 1;
    return { p, md, s, r: kit.index.roles[p.role].footprint * s, crown: md.item.radius * s };
  });

  // ground + base
  const ground = paintGround({
    radius: R * 1.1, size: opt.groundSize ?? 1024, seed: spec.seed, palette: spec.palette.ground,
    paths: spec.paths.map(p => ({ pts: p.pts, width: p.width })),
    shadePools: lm.filter(l => l.crown > .6).map(l => ({ at: l.p.at, r: l.crown * 1.05 })),
  });
  const base = islandBase({ radius: R, depth: spec.depth, seed: spec.seed, topY: spec.topY, ground, strata: spec.palette.strata, satellites: spec.satellites });
  // paintGround maps [-1.1R, 1.1R]; islandBase UVs assume [-R, R]: rescale
  const uv = base.top.geometry.attributes.uv as T.BufferAttribute;
  for (let i = 0; i < uv.count; i++) { uv.setX(i, (uv.getX(i) - .5) / 1.1 + .5); uv.setY(i, (uv.getY(i) - .5) / 1.1 + .5); }
  root.add(base.root); cameraBlockers.push(base.rock);

  // everything placed through one instancer: one draw per model part
  const detail = new T.Group(); detail.name = 'island-detail'; root.add(detail);
  const batches = new Map<string, { model: ReturnType<Kit['model']>; mats: T.Matrix4[]; shadows: boolean; small: boolean }>();
  const put = (role: string, v: number, x: number, z: number, s: number, rot: number, shadows: boolean, y = spec.topY - .02) => {
    const model = kit.model(role, v), small = kit.index.roles[role].tier === 'scatter' || kit.index.roles[role].tier === 'surface', key = model.item.node + (small ? '' : '+');
    let b = batches.get(key); if (!b) { b = { model, mats: [], shadows, small }; batches.set(key, b); }
    b.mats.push(new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), rot), new T.Vector3(s, s, s)));
    stats.instances++;
  };

  // landmarks that should fade near the camera stay separate objects
  for (const l of lm) {
    const { p, s } = l, rot = p.rot ?? rng() * Math.PI * 2;
    if (p.solid !== false && l.r > 0) solids.push({ x: cx + p.at[0], z: cz + p.at[1], r: Math.max(.25, l.r) });
    if (p.fade !== false) {
      const g = kit.clone(p.role, p.variant ?? 0, { lod: true }); g.position.set(p.at[0], spec.topY - .02, p.at[1]); g.rotation.y = rot; g.scale.setScalar(s);
      g.userData.fade = { halfW: Math.max(.6, l.crown * .8), y0: 0, y1: l.md.item.height * s }; g.userData.noCameraBlock = true;
      root.add(g); stats.drawables += g.children.length; stats.tris += l.md.item.tris; stats.instances++;
      if (p.blockCamera) cameraBlockers.push(g);
    } else put(p.role, p.variant ?? 0, p.at[0], p.at[1], s, rot, true);
  }

  // game props named in the spec (looms, signs, machines' housings…)
  for (const pr of spec.props ?? []) {
    const make = opt.props?.[pr.prop]; if (!make) { console.warn('[kit] no builder for prop', pr.prop); continue; }
    const o = make(pr.params ?? {}); o.position.set(pr.at[0], spec.topY - .02, pr.at[1]); o.rotation.y = pr.rot ?? 0; root.add(o);
    if (pr.solid) solids.push({ x: cx + pr.at[0], z: cz + pr.at[1], r: pr.solid });
  }

  // hedges: a row of shrubs (the solid wall itself belongs to gameplay)
  for (const h of spec.hedges) {
    const [ax, az] = h.from, [bx, bz] = h.to, len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / h.spacing));
    for (let i = 0; i <= n; i++) {
      const t = i / n, j = (rng() - .5) * .12;
      put(h.role, Math.floor(rng() * kit.count(h.role)), ax + (bx - ax) * t + j, az + (bz - az) * t + j, h.scale[0] + rng() * (h.scale[1] - h.scale[0]), rng() * Math.PI * 2, true);
    }
  }

  // stepping stones along paths
  for (const p of spec.paths) {
    if (!p.stones) continue;
    for (let i = 0; i < p.pts.length - 1; i++) {
      const [ax, az] = p.pts[i], [bx, bz] = p.pts[i + 1], len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.floor(len / p.stones.spacing));
      const nx = -(bz - az) / (len || 1), nz = (bx - ax) / (len || 1);
      for (let k = 0; k < n; k++) {
        const t = (k + .5) / n, side = (rng() - .5) * p.width * .35;
        put(p.stones.role, Math.floor(rng() * kit.count(p.stones.role)), ax + (bx - ax) * t + nx * side, az + (bz - az) * t + nz * side,
          p.stones.scale[0] + rng() * (p.stones.scale[1] - p.stones.scale[0]), rng() * Math.PI * 2, false, spec.topY - .075);
      }
    }
  }

  // scatter: dart throwing with spacing, clear of anchors, paths, landmarks
  const pathD = (x: number, z: number) => { let d = Infinity; for (const p of spec.paths) for (let i = 0; i < p.pts.length - 1; i++) d = Math.min(d, distToSeg(x, z, p.pts[i], p.pts[i + 1]) - p.width / 2); return d; };
  const hedgeD = (x: number, z: number) => { let d = Infinity; for (const h of spec.hedges) d = Math.min(d, distToSeg(x, z, h.from, h.to)); return d; };
  // scatter rules listed later are shed first when a device needs less detail
  const rank = new Map<string, number>();
  spec.scatter.forEach((rule, i) => rank.set(rule.role, Math.min(rank.get(rule.role) ?? 1, i / spec.scatter.length)));
  for (const rule of spec.scatter) {
    const reg = rule.region ?? { kind: 'disc', r: R * .96 } as Region;
    const discs: { at: XZ; r: number; r0: number }[] = reg.kind === 'disc' ? [{ at: reg.at ?? [0, 0], r: reg.r, r0: reg.r0 ?? 0 }]
      : lm.map(l => ({ at: l.p.at, r: Math.max(reg.r, l.crown), r0: l.r + .1 }));
    const area = discs.reduce((a, d) => a + Math.PI * (d.r * d.r - d.r0 * d.r0), 0);
    const want = Math.round(area * rule.density * density), spacing = rule.spacing ?? .35, placed: XZ[] = [];
    const variants = rule.variants ?? [...Array(kit.count(rule.role)).keys()];
    let tries = want * 12;
    while (placed.length < want && tries-- > 0) {
      const d = discs[Math.floor(rng() * discs.length)], a = rng() * Math.PI * 2, rr = Math.sqrt(d.r0 * d.r0 + rng() * (d.r * d.r - d.r0 * d.r0));
      const x = d.at[0] + Math.cos(a) * rr, z = d.at[1] + Math.sin(a) * rr;
      if (Math.hypot(x, z) > R * .95) continue;
      const pd = pathD(x, z);
      if (rule.onPathEdge ? (pd < -.05 || pd > .35) : pd < (rule.pathClear ?? .15)) continue;
      if (hedgeD(x, z) < .5) continue;
      if (spec.anchors.some(an => Math.hypot(x - an.at[0], z - an.at[1]) < an.r)) continue;
      if (spec.entities?.some(en => Math.hypot(x - en.at[0], z - en.at[1]) < en.r)) continue;
      if (lm.some(l => Math.hypot(x - l.p.at[0], z - l.p.at[1]) < l.r + .15)) continue;
      if (placed.some(q => Math.hypot(x - q[0], z - q[1]) < spacing)) continue;
      placed.push([x, z]);
      put(rule.role, variants[Math.floor(rng() * variants.length)], x, z, rule.scale[0] + rng() * (rule.scale[1] - rule.scale[0]), rng() * Math.PI * 2, rule.shadows ?? false);
    }
  }

  // build the instanced batches
  for (const b of batches.values()) {
    for (const part of b.model.parts) {
      const im = new T.InstancedMesh(part.geometry, part.material, b.mats.length);
      b.mats.forEach((m, i) => im.setMatrixAt(i, m));
      im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere();
      im.castShadow = b.shadows && (opt.shadows ?? true); im.receiveShadow = true; im.name = b.model.item.node;
      im.userData.rank = rank.get(b.model.role) ?? 0;
      (b.small ? detail : root).add(im); stats.drawables++;
    }
    stats.tris += b.model.item.tris * b.mats.length;
  }
  return { root, cameraBlockers, solids, detail, stats };
}

export type { Rng };
