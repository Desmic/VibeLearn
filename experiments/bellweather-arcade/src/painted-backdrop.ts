import * as T from 'three';
import { mulberry32 } from './vendor/rng';

// Painted far/mid field for the `render=painted` study: a sea of cloud banks
// below the terrace horizon and a few distant floating islands with falls.
// Painted procedurally on canvas (original work), placed at real depths so
// they parallax as the player moves. Haze is painted in; no fog is applied.

type Ctx = CanvasRenderingContext2D;
const rgba = (c: number[], a: number) => `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);

const SUNLIT = [255, 246, 232], BODY = [236, 232, 246], SHADE = [176, 172, 214], DEEP = [150, 150, 200];

function billow(c: Ctx, r: () => number, x: number, y: number, rad: number, haze: number) {
  // one cumulus lobe: shaded base, lit crown, brushy rim
  const tint = (col: number[]) => mix(col, [206, 220, 244], haze);
  const g = c.createRadialGradient(x - rad * .35, y - rad * .45, rad * .1, x, y, rad);
  g.addColorStop(0, rgba(tint(SUNLIT), 1));
  g.addColorStop(.55, rgba(tint(BODY), 1));
  g.addColorStop(1, rgba(tint(SHADE), 1));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
  // brush dabs along the crown for painted texture
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI * (.15 + r() * .7), d = rad * (.55 + r() * .4);
    c.fillStyle = rgba(tint(mix(SUNLIT, BODY, r() * .5)), .55);
    c.beginPath(); c.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, rad * (.12 + r() * .12), rad * (.06 + r() * .06), a + 1.4, 0, Math.PI * 2); c.fill();
  }
}

function cloudBankTexture(seed: number, haze: number, density: number) {
  const W = 2048, H = 320, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d')!, r = mulberry32(seed);
  // lower body: solid violet-shaded mass that the billows sit on
  const base = c.createLinearGradient(0, H * .45, 0, H);
  base.addColorStop(0, rgba(mix(BODY, [206, 220, 244], haze), 1));
  base.addColorStop(1, rgba(mix(DEEP, [206, 220, 244], haze), 1));
  c.fillStyle = base; c.fillRect(0, H * .62, W, H);
  // billow clusters, larger toward the front row
  for (let row = 0; row < 3; row++) {
    const n = Math.round(W / 70 * density);
    for (let i = 0; i < n; i++) {
      const x = r() * W, rad = (26 + r() * 48) * (1 + row * .35);
      const y = H * (.52 + row * .12) + (r() - .5) * 26;
      billow(c, r, x, y, rad, haze);
      if (x < 160) billow(c, r, x + W, y, rad, haze); // wrap seam
      if (x > W - 160) billow(c, r, x - W, y, rad, haze);
    }
  }
  const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.wrapS = T.RepeatWrapping;
  return t;
}

function islandTexture(seed: number, haze: number) {
  const W = 512, H = 640, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d')!, r = mulberry32(seed);
  const hz = (col: number[]) => mix(col, [200, 214, 240], haze);
  const top = H * .34, cx = W / 2, halfW = W * .40;
  // rock underside: inverted, irregular cone with strata
  c.beginPath(); c.moveTo(cx - halfW, top);
  for (let i = 0; i <= 12; i++) { const t = i / 12, x = cx - halfW + t * halfW * 2; const y = top + Math.sin(t * Math.PI) * H * (.42 + (r() - .5) * .12) * (1 - Math.abs(t - .5) * .4); c.lineTo(x, y); }
  c.closePath();
  const rock = c.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
  rock.addColorStop(0, rgba(hz([214, 170, 132]), 1)); rock.addColorStop(.55, rgba(hz([160, 118, 124]), 1)); rock.addColorStop(1, rgba(hz([104, 92, 140]), 1));
  c.fillStyle = rock; c.fill();
  c.save(); c.clip();
  for (let i = 0; i < 26; i++) { c.strokeStyle = rgba(hz(r() < .5 ? [236, 196, 150] : [96, 84, 132]), .35); c.lineWidth = 2 + r() * 6; c.beginPath(); const y = top + r() * H * .5; c.moveTo(cx - halfW, y); c.bezierCurveTo(cx - 60, y + 20 * r(), cx + 60, y - 20 * r(), cx + halfW, y + 30 * r()); c.stroke(); }
  c.restore();
  // waterfalls
  for (let i = 0; i < 3; i++) {
    const x = cx - halfW * .6 + r() * halfW * 1.2, len = H * (.35 + r() * .3), w = 6 + r() * 10;
    const g = c.createLinearGradient(0, top, 0, top + len); g.addColorStop(0, rgba(hz([250, 252, 255]), .95)); g.addColorStop(1, rgba(hz([235, 240, 255]), 0));
    c.fillStyle = g; c.fillRect(x - w / 2, top - 4, w, len);
    for (let k = 0; k < 6; k++) { c.fillStyle = rgba(hz([255, 255, 255]), .35); c.fillRect(x - w / 2 + r() * w, top, 1.5, len * (.4 + r() * .6)); }
    billow(c, r, x, top + len * .92, 22 + r() * 14, haze + .1);
  }
  // green crown with tree masses and one pink landmark canopy
  c.fillStyle = rgba(hz([118, 158, 96]), 1); c.beginPath(); c.ellipse(cx, top, halfW * 1.02, 22, 0, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < 18; i++) {
    const x = cx - halfW + r() * halfW * 2, rad = 10 + r() * 22, pink = i % 6 === 1;
    const col = pink ? [242, 158, 190] : mix([82, 132, 88], [150, 186, 110], r());
    c.fillStyle = rgba(hz(mix(col, [40, 60, 70], .25)), 1); c.beginPath(); c.arc(x + 3, top - rad * .6 + 3, rad * (pink ? 1.15 : 1), 0, Math.PI * 2); c.fill();
    c.fillStyle = rgba(hz(col), 1); c.beginPath(); c.arc(x, top - rad * .6, rad * (pink ? 1.15 : 1), 0, Math.PI * 2); c.fill();
    c.fillStyle = rgba(hz(mix(col, [255, 250, 225], .35)), .9); c.beginPath(); c.arc(x - rad * .3, top - rad, rad * (pink ? .6 : .5), 0, Math.PI * 2); c.fill();
  }
  const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace;
  return t;
}

export function buildPaintedBackdrop(scene: T.Scene, ringCount = 3, center = new T.Vector3(0, 0, -4)) {
  const root = new T.Group(); root.name = 'painted-backdrop';
  // Cloud sea: three inward-facing rings, farther rings hazier and higher.
  const rings: [number, number, number, number, number][] = [
    // radius, height, centre y, haze, density
    [520, 95, -34, .55, .8],
    [360, 70, -30, .30, 1.0],
    [230, 48, -24, .12, 1.15],
  ];
  rings.slice(0, ringCount).forEach(([rad, h, y, haze, dens], i) => {
    const geo = new T.CylinderGeometry(rad, rad, h, 96, 1, true);
    const tex = cloudBankTexture(71 + i * 13, haze, dens); tex.repeat.x = 3;
    const mat = new T.MeshBasicMaterial({ map: tex, side: T.BackSide, alphaTest: .5, fog: false });
    // cut out the sky above billows with an alpha map from luminance of top area
    const m = new T.Mesh(geo, mat); m.position.set(center.x, y, center.z); 
    root.add(m);
  });
  // Distant floating islands (billboards at depth, facing the play area).
  const islands: [number, number, number, number, number][] = [
    // angle(rad, 0 = -z), distance, height(y), size, haze
    [-0.18, 300, 58, 120, .30],
    [0.42, 380, 92, 80, .45],
    [-0.62, 420, 40, 70, .5],
    [0.95, 260, 30, 54, .25],
    [-1.25, 340, 84, 48, .42],
    [2.6, 330, 60, 90, .35],
    [-2.4, 300, 44, 70, .35],
  ];
  if (false) islands.forEach(([a, d, y, s, haze], i) => {
    const mat = new T.MeshBasicMaterial({ map: islandTexture(301 + i * 7, haze), transparent: true, depthWrite: false, fog: false });
    const m = new T.Mesh(new T.PlaneGeometry(s, s * 1.25), mat);
    m.position.set(center.x + Math.sin(a) * d, y, center.z - Math.cos(a) * d);
    m.lookAt(center.x, y, center.z); m.renderOrder = 5;
    root.add(m);
  });
  scene.add(root);
  return root;
}
