import * as T from 'three';
import { mulberry32, type Rng } from '../vendor/rng';

// Reusable terrain pieces for floating-island worlds, driven by data:
//  - paintGround(): one painted canvas texture per island top, with its paths,
//    shade pools under trees, flower specks and a darker rim painted in, so the
//    ground reads hand-painted instead of flat colour;
//  - islandBase(): the island itself: a walkable top that rolls over a grassy
//    lip, and a strata-banded rock underside with hanging roots.
// Colours come from a palette so another style family can reuse the shapes.

export type XZ = readonly [number, number];
export interface GroundPalette {
  grass: string; grassLight: string; grassDark: string;
  dirt: string; dirtLight: string; dirtEdge: string;
  specks: string[];           // flower specks painted into the grass
  shade: string;              // cool shade pooled under trees
}
export interface StrataPalette { top: string; bands: string[]; under: string; root: string; cap?: string }

export interface GroundPaint {
  radius: number;             // metres covered by the texture (disc)
  size?: number;              // texture pixels (square)
  seed: number;
  paths: { pts: XZ[]; width: number }[];   // island-local metres
  shadePools: { at: XZ; r: number }[];
  palette: GroundPalette;
}

/** Paint an island top: returns a texture mapping [-radius, radius]² in x/z. */
export function paintGround(p: GroundPaint) {
  const S = p.size ?? 1024, R = p.radius, r = mulberry32(p.seed);
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d')!;
  const px = (m: number) => (m / (2 * R) + .5) * S;
  const pal = p.palette;
  // base: warm light centre, cooler toward the rim
  const g0 = c.createRadialGradient(S / 2, S / 2, S * .05, S / 2, S / 2, S * .5);
  g0.addColorStop(0, pal.grassLight); g0.addColorStop(.55, pal.grass); g0.addColorStop(1, pal.grassDark);
  c.fillStyle = g0; c.fillRect(0, 0, S, S);
  // broad painted dabs
  for (let i = 0; i < 420; i++) {
    const x = r() * S, y = r() * S, s = S * (.012 + r() * .05);
    const g = c.createRadialGradient(x, y, 1, x, y, s);
    const col = i % 3 === 0 ? pal.grassLight : i % 3 === 1 ? pal.grassDark : pal.grass;
    g.addColorStop(0, withAlpha(col, .35)); g.addColorStop(1, withAlpha(col, 0));
    c.fillStyle = g; c.fillRect(x - s, y - s, s * 2, s * 2);
  }
  // grass strokes, leaning one way like a brush
  c.lineCap = 'round';
  for (let i = 0; i < S * 26; i++) {
    const x = r() * S, y = r() * S, l = S * (.004 + r() * .008), a = -1.2 + (r() - .5) * .9;
    c.strokeStyle = withAlpha(r() < .5 ? pal.grassDark : pal.grassLight, .10 + r() * .12); c.lineWidth = S / 1024 * (.8 + r() * .9);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
  // cool shade pooled under trees and big props
  for (const s of p.shadePools) {
    const x = px(s.at[0]), y = px(s.at[1]), rr = s.r / (2 * R) * S;
    const g = c.createRadialGradient(x, y, rr * .1, x, y, rr);
    g.addColorStop(0, withAlpha(pal.shade, .42)); g.addColorStop(1, withAlpha(pal.shade, 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill();
  }
  // dirt paths: soft dark edge, dirt body, lighter worn centre, pebble specks
  const stroke = (pts: XZ[], w: number, col: string, blur: number) => {
    c.save(); c.strokeStyle = col; c.lineWidth = w / (2 * R) * S; c.lineJoin = 'round'; c.lineCap = 'round';
    c.shadowColor = col; c.shadowBlur = blur; c.beginPath();
    pts.forEach(([x, z], i) => i ? c.lineTo(px(x), px(z)) : c.moveTo(px(x), px(z))); c.stroke(); c.restore();
  };
  for (const path of p.paths) {
    const wob = wobble(path.pts, r, .18);
    stroke(wob, path.width * 1.25, withAlpha(pal.dirtEdge, .55), S * .012);
    stroke(wob, path.width, pal.dirt, S * .006);
    stroke(wob, path.width * .45, withAlpha(pal.dirtLight, .7), S * .01);
    // specks along the path
    for (let i = 0; i < wob.length - 1; i++) {
      const [ax, az] = wob[i], [bx, bz] = wob[i + 1], n = Math.ceil(Math.hypot(bx - ax, bz - az) * 18);
      for (let k = 0; k < n; k++) {
        const t = r(), ox = (r() - .5) * path.width, oz = (r() - .5) * path.width;
        c.fillStyle = withAlpha(r() < .5 ? pal.dirtEdge : pal.dirtLight, .35 + r() * .3);
        const s = S / 1024 * (1 + r() * 2.2); c.fillRect(px(ax + (bx - ax) * t + ox), px(az + (bz - az) * t + oz), s, s);
      }
    }
  }
  // flower specks in little drifts
  for (let d = 0; d < 70; d++) {
    const cx = r() * S, cy = r() * S, col = pal.specks[Math.floor(r() * pal.specks.length)];
    for (let i = 0; i < 26; i++) { const a = r() * 6.28, rr = r() * S * .02; c.fillStyle = withAlpha(col, .55 + r() * .4); const s = S / 1024 * (1.2 + r() * 1.8); c.beginPath(); c.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, s, 0, 6.28); c.fill(); }
  }
  // darker rim so the edge reads as a lip
  const g1 = c.createRadialGradient(S / 2, S / 2, S * .42, S / 2, S / 2, S * .5);
  g1.addColorStop(0, withAlpha(pal.grassDark, 0)); g1.addColorStop(1, withAlpha(pal.grassDark, .55));
  c.fillStyle = g1; c.fillRect(0, 0, S, S);
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4; tex.wrapS = tex.wrapT = T.ClampToEdgeWrapping;
  return tex;
}

export interface IslandBaseSpec {
  radius: number; depth: number; seed: number; topY: number;
  ground: T.Texture; strata: StrataPalette;
  roots?: number;             // hanging roots under the lip
  satellites?: number;        // small floating rock chunks around the island
}

/** A floating island: walkable top (flat where you walk, rolling over a lip at
 *  the rim) and a banded rock underside. Returns meshes to add and the rock
 *  (for camera collision) separately. */
export function islandBase(s: IslandBaseSpec) {
  const r = mulberry32(s.seed), R = s.radius, root = new T.Group(); root.name = 'island-base';
  // --- top: rings of vertices; flat inside, rolling down past the rim
  const rings = 14, segs = 96, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const edge = (a: number) => 1 + .035 * Math.sin(a * 3 + s.seed) + .025 * Math.sin(a * 7 + s.seed * 2);
  pos.push(0, s.topY, 0); uv.push(.5, .5);
  for (let i = 1; i <= rings; i++) {
    const t = i / rings, rr = t < .86 ? t / .86 * .97 : .97 + (t - .86) / .14 * .09; // last rings reach a bit past R
    for (let j = 0; j < segs; j++) {
      const a = j / segs * Math.PI * 2, e = edge(a), x = Math.cos(a) * rr * R * e, z = Math.sin(a) * rr * R * e;
      const over = Math.max(0, rr - .97) / .09; // 0..1 across the lip
      const y = s.topY - over * over * .55 + (rr < .9 ? (r() - .5) * .015 : 0);
      pos.push(x, y, z); uv.push(Math.min(.999, Math.max(.001, x / (2 * R) + .5)), Math.min(.999, Math.max(.001, z / (2 * R) + .5)));
    }
  }
  for (let j = 0; j < segs; j++) idx.push(0, 1 + (j + 1) % segs, 1 + j);
  for (let i = 1; i < rings; i++) for (let j = 0; j < segs; j++) {
    const a = 1 + (i - 1) * segs + j, b = 1 + (i - 1) * segs + (j + 1) % segs, c = a + segs, d = b + segs;
    idx.push(a, b, c, b, d, c);
  }
  const topG = new T.BufferGeometry(); topG.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); topG.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); topG.setIndex(idx); topG.computeVertexNormals();
  const top = new T.Mesh(topG, new T.MeshLambertMaterial({ map: s.ground })); top.receiveShadow = true; top.name = 'island-top'; root.add(top);

  // --- underside: lathe with strata bands and a craggy, uneven outline
  const pts: T.Vector2[] = [], n = 16;
  for (let i = 0; i <= n; i++) {
    const t = i / n, w = R * 1.04 * (1 - Math.pow(t, 1.6)) * (i ? .9 + r() * .14 : 1);
    pts.push(new T.Vector2(Math.max(w, .05), s.topY - .5 - t * s.depth));
  }
  const rock = new T.LatheGeometry(pts.reverse(), 40); // bottom-to-top so faces point outward
  const p = rock.attributes.position, col = new Float32Array(p.count * 3), c = new T.Color();
  const bands = s.strata.bands.map(b => new T.Color(b)), topC = new T.Color(s.strata.top), under = new T.Color(s.strata.under);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = (s.topY - .5 - y) / s.depth, a = Math.atan2(z, x);
    // craggy outline, eased in below the lip so the rock never pokes out past the grass
    if (t > .01 && t < .99) { const e = Math.min(1, t / .18), k = 1 + e * (.09 * Math.sin(a * 4 + s.seed + t * 6) + .06 * Math.sin(a * 11 - t * 9) + (r() - .5) * .05) - (1 - e) * .06; p.setX(i, x * k); p.setZ(i, z * k); }
    // bands warp around the island like sediment
    const bt = t * bands.length * 1.6 + .25 * Math.sin(a * 3 + s.seed);
    const nb = bands.length, bi = ((Math.floor(bt) % nb) + nb) % nb, f = bt - Math.floor(bt);
    c.copy(bands[bi]).lerp(bands[(bi + 1) % bands.length], f * f);
    if (t < .08) c.lerp(topC, 1 - t / .08);
    c.lerp(under, Math.min(1, Math.max(0, (t - .45) / .55)) * .7);
    col.set([c.r, c.g, c.b], i * 3);
  }
  rock.setAttribute('color', new T.BufferAttribute(col, 3)); rock.computeVertexNormals();
  const rockMesh = new T.Mesh(rock, new T.MeshLambertMaterial({ vertexColors: true, flatShading: true })); rockMesh.name = 'island-rock'; root.add(rockMesh);

  // --- hanging roots under the lip (one merged mesh)
  const rootsN = s.roots ?? 16, rootGeo: T.BufferGeometry[] = [];
  for (let i = 0; i < rootsN; i++) {
    const a = r() * Math.PI * 2, rr = R * (.86 + r() * .12), len = .6 + r() * 1.8;
    const g = new T.CylinderGeometry(.015, .05, len, 5, 3); const gp = g.attributes.position;
    for (let k = 0; k < gp.count; k++) { const yy = gp.getY(k), bend = (.5 - yy / len) ** 2 * .4; gp.setX(k, gp.getX(k) + bend * Math.cos(a)); gp.setZ(k, gp.getZ(k) + bend * Math.sin(a)); }
    g.translate(Math.cos(a) * rr, s.topY - .55 - len / 2, Math.sin(a) * rr); rootGeo.push(g);
  }
  if (rootGeo.length) {
    const merged = mergeSimple(rootGeo);
    const roots = new T.Mesh(merged, new T.MeshLambertMaterial({ color: s.strata.root })); roots.name = 'island-roots'; root.add(roots);
  }
  // --- satellites: little floating rocks with grassy caps (one merged mesh each material)
  const nSat = s.satellites ?? 0;
  if (nSat) {
    const rocks: T.BufferGeometry[] = [], caps: T.BufferGeometry[] = [];
    for (let i = 0; i < nSat; i++) {
      const a = r() * Math.PI * 2, d = R * (1.18 + r() * .45), sz = .35 + r() * .7, y = s.topY - .6 - r() * s.depth * .45;
      const g = new T.ConeGeometry(sz, sz * (1.4 + r()), 6, 2); g.rotateX(Math.PI); g.rotateY(r() * 3);
      const gp = g.attributes.position; for (let k = 0; k < gp.count; k++) gp.setXYZ(k, gp.getX(k) * (.85 + r() * .3), gp.getY(k), gp.getZ(k) * (.85 + r() * .3));
      g.translate(Math.cos(a) * d, y - sz * .7, Math.sin(a) * d); rocks.push(g);
      const c = new T.CylinderGeometry(sz * 1.02, sz * .95, .12, 7); c.translate(Math.cos(a) * d, y, Math.sin(a) * d); caps.push(c);
    }
    const rockM = new T.Mesh(mergeSimple(rocks), new T.MeshLambertMaterial({ color: s.strata.bands[0], flatShading: true })); rockM.name = 'island-satellites'; root.add(rockM);
    const capM = new T.Mesh(mergeSimple(caps), new T.MeshLambertMaterial({ color: s.strata.cap ?? '#8fb87a' })); root.add(capM);
  }
  return { root, top, rock: rockMesh };
}

function mergeSimple(gs: T.BufferGeometry[]) {
  const pos: number[] = [], nor: number[] = [], idx: number[] = []; let off = 0;
  for (const g of gs) {
    const gi = g.toNonIndexed(); gi.computeVertexNormals();
    const p = gi.attributes.position, n = gi.attributes.normal;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); idx.push(off + i); }
    off += p.count;
  }
  const out = new T.BufferGeometry(); out.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); out.setIndex(idx); return out;
}

function wobble(pts: XZ[], r: Rng, amt: number): XZ[] {
  const out: XZ[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], n = Math.max(2, Math.ceil(Math.hypot(bx - ax, bz - az) / .6));
    for (let k = 0; k < n; k++) { const t = k / n, j = i || k ? (r() - .5) * amt : 0; out.push([ax + (bx - ax) * t + j, az + (bz - az) * t + j]); }
  }
  out.push(pts[pts.length - 1]); return out;
}

function withAlpha(hex: string, a: number) {
  const h = hex.replace('#', ''), n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
