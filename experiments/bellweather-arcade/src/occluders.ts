import * as T from 'three';

// Fades things that stand between the follow camera and Zip (townsfolk, banner
// cloths), the way third-person games keep the player readable. The test is in
// screen space: a fader nearer the camera than Zip whose projected outline
// overlaps Zip's fades out. Each fader owns its material, and a fully visible
// fader goes back to opaque so it costs nothing extra.
interface Fader { root: T.Object3D; mats: (T.Material & { opacity: number })[]; halfW: number; y0: number; y1: number; o: number; dither?: boolean }

// Anything tagged with userData.fade = { halfW, y0, y1 } (its outline around the
// object's origin, in metres) can fade. Materials are cloned per fader so one
// fading figure never ghosts another that shares its look.
export function collectFaders(scene: T.Object3D) {
  const list: Fader[] = [];
  scene.traverse(o => {
    const f = o.userData.fade as { halfW: number; y0: number; y1: number; dither?: boolean } | undefined;
    if (!f) return;
    const mats: Fader['mats'] = [], seen = new Map<T.Material, T.Material>();
    o.traverse(c => {
      const m = c as T.Mesh; if (!m.isMesh || Array.isArray(m.material)) return;
      let mine = seen.get(m.material);
      if (!mine) {
        const src = m.material; mine = src.clone(); seen.set(src, mine); mats.push(mine as any);
        // clone() drops shader hooks: keep the source's, and for dithered fading add an ordered
        // screen-door (stable 4x4 pattern) driven by opacity, so depth stays intact
        const hook = src.onBeforeCompile !== T.Material.prototype.onBeforeCompile ? src.onBeforeCompile.bind(src) : null;
        const key = src.customProgramCacheKey.bind(src);
        if (f.dither) {
          mine.onBeforeCompile = (sh, r) => {
            hook?.(sh, r);
            sh.fragmentShader = sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
              if (opacity < .985) { vec2 vlD = mod(floor(gl_FragCoord.xy), 4.0); float vlT = (mod(vlD.x * 4.0 + vlD.y * 9.0 + vlD.x * vlD.y * 3.0, 16.0) + .5) / 16.0; if (opacity < vlT) discard; }`);
          };
          mine.customProgramCacheKey = () => key() + '|vl-fade-dither';
        } else if (hook) { mine.onBeforeCompile = hook; mine.customProgramCacheKey = key; }
      }
      m.material = mine;
    });
    list.push({ root: o, mats, ...f, o: 1 });
  });
  return list;
}

const P = new T.Vector3(), q = new T.Vector3(), right = new T.Vector3(), camPos = new T.Vector3();
type Rect = { x0: number; x1: number; y0: number; y1: number; depth: number };
function rect(base: T.Vector3, halfW: number, y0: number, y1: number, camera: T.Camera, out: Rect) {
  out.x0 = out.y0 = Infinity; out.x1 = out.y1 = -Infinity; out.depth = base.distanceTo(camPos);
  for (const sx of [-1, 1]) for (const y of [y0, y1]) {
    q.copy(base).addScaledVector(right, sx * halfW); q.y += y; q.project(camera);
    if (q.z > 1) { out.x0 = -Infinity; out.x1 = Infinity; out.y0 = -Infinity; out.y1 = Infinity; return out; } // reaches behind the camera
    out.x0 = Math.min(out.x0, q.x); out.x1 = Math.max(out.x1, q.x); out.y0 = Math.min(out.y0, q.y); out.y1 = Math.max(out.y1, q.y);
  }
  return out;
}
const zr: Rect = { x0: 0, x1: 0, y0: 0, y1: 0, depth: 0 }, fr: Rect = { x0: 0, x1: 0, y0: 0, y1: 0, depth: 0 };

export function fadeOccluders(list: Fader[], camera: T.Camera, zipFeet: T.Vector3, dt: number) {
  camera.getWorldPosition(camPos); right.setFromMatrixColumn(camera.matrixWorld, 0).setY(0).normalize();
  rect(zipFeet, .3, .05, 1.5, camera, zr);
  const zipArea = Math.max((zr.x1 - zr.x0) * (zr.y1 - zr.y0), 1e-6);
  for (const f of list) {
    f.root.getWorldPosition(P);
    rect(P, f.halfW, f.y0, f.y1, camera, fr);
    let want = 1;
    if (fr.depth < zr.depth - .3) {
      const ox = Math.min(fr.x1, zr.x1) - Math.max(fr.x0, zr.x0), oy = Math.min(fr.y1, zr.y1) - Math.max(fr.y0, zr.y0);
      if (ox > 0 && oy > 0) want = 1 - .84 * T.MathUtils.smoothstep((ox * oy) / zipArea, .05, .35);
    }
    if (fr.depth < 1.4) want = Math.min(want, .16);
    // something big between the camera and Zip that fills a lot of the screen
    // (a tree crown right by the lens) fades too, even if it misses Zip's outline
    if (fr.depth < zr.depth) {
      const cw = Math.max(0, Math.min(fr.x1, 1) - Math.max(fr.x0, -1)), ch = Math.max(0, Math.min(fr.y1, 1) - Math.max(fr.y0, -1));
      const cover = cw * ch / 4; if (cover > .12) want = Math.min(want, 1 - .75 * T.MathUtils.smoothstep(cover, .12, .3));
    }
    f.o += (want - f.o) * Math.min(1, dt * 8);
    const fading = f.o < .985;
    for (const m of f.mats) {
      // dither: hashed see-through that keeps depth (one-mesh characters would otherwise draw
      // their own back, like hair, over their face while fading)
      if (f.dither) { /* the shader discards by opacity */ }
      else if (fading !== m.transparent) { m.transparent = fading; m.depthWrite = !fading; m.needsUpdate = true; }
      m.opacity = fading ? f.o : 1;
    }
  }
}
