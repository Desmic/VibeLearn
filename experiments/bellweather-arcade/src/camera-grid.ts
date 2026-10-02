import * as T from 'three';

// Camera collision against everything solid in the world, not only hand-placed
// proxies. At load, static opaque geometry is rasterised into a coarse voxel
// grid (surface samples, dilated by one cell). A camera ray then marches the
// grid (3D DDA): microseconds per query, versus milliseconds for triangle
// raycasts on merged meshes. Works for any generated world without authoring
// collision by hand; foliage cards and moving characters are left out.

export interface CameraGrid { hit(origin: T.Vector3, dir: T.Vector3, far: number): number; cells: number; ms: number }

export function buildCameraGrid(scene: T.Scene, bounds: T.Box3, cell = .2, exclude: (o: T.Object3D) => boolean = () => false): CameraGrid {
  const t0 = performance.now();
  const min = bounds.min, size = bounds.getSize(new T.Vector3());
  const nx = Math.ceil(size.x / cell), ny = Math.ceil(size.y / cell), nz = Math.ceil(size.z / cell);
  const occ = new Uint8Array(nx * ny * nz);
  const idx = (i: number, j: number, k: number) => (j * nz + k) * nx + i;
  const mark = (x: number, y: number, z: number) => {
    const i = Math.floor((x - min.x) / cell), j = Math.floor((y - min.y) / cell), k = Math.floor((z - min.z) / cell);
    if (i >= 0 && j >= 0 && k >= 0 && i < nx && j < ny && k < nz) occ[idx(i, j, k)] = 1;
  };
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), ab = new T.Vector3(), ac = new T.Vector3(), p = new T.Vector3();
  const step = cell * .5;
  scene.updateMatrixWorld(true);
  scene.traverse(o => {
    const m = o as T.Mesh;
    if (!m.isMesh || (m as T.SkinnedMesh).isSkinnedMesh || (m as T.InstancedMesh).isInstancedMesh || !m.visible) return;
    const mat = m.material as T.Material;
    if (!mat || Array.isArray(mat) || mat.transparent || mat.alphaTest > 0) return;
    for (let q: T.Object3D | null = m; q; q = q.parent) if (!q.visible || exclude(q)) return;
    const g = m.geometry, pos = g.getAttribute('position'); if (!pos) return;
    if (!g.boundingBox) g.computeBoundingBox();
    const wb = g.boundingBox!.clone().applyMatrix4(m.matrixWorld);
    if (!wb.intersectsBox(bounds)) return;
    const index = g.index, count = index ? index.count : pos.count, mw = m.matrixWorld;
    for (let t = 0; t < count; t += 3) {
      const i0 = index ? index.getX(t) : t, i1 = index ? index.getX(t + 1) : t + 1, i2 = index ? index.getX(t + 2) : t + 2;
      a.fromBufferAttribute(pos, i0).applyMatrix4(mw); b.fromBufferAttribute(pos, i1).applyMatrix4(mw); c.fromBufferAttribute(pos, i2).applyMatrix4(mw);
      ab.subVectors(b, a); ac.subVectors(c, a);
      const nu = Math.max(1, Math.ceil(ab.length() / step)), nv = Math.max(1, Math.ceil(ac.length() / step));
      if (nu * nv > 40000) continue; // giant backdrop planes: not camera-relevant
      for (let u = 0; u <= nu; u++) for (let v = 0; v <= nv - u * nv / nu; v++) {
        p.copy(a).addScaledVector(ab, u / nu).addScaledVector(ac, v / nv); mark(p.x, p.y, p.z);
      }
    }
  });
  // dilate one cell so the camera keeps a small margin from every surface
  const solid = occ.slice();
  let cells = 0;
  for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
    if (!occ[idx(i, j, k)]) continue; cells++;
    for (let dj = -1; dj <= 1; dj++) for (let dk = -1; dk <= 1; dk++) for (let di = -1; di <= 1; di++) {
      const I = i + di, J = j + dj, K = k + dk; if (I >= 0 && J >= 0 && K >= 0 && I < nx && J < ny && K < nz) solid[idx(I, J, K)] = 1;
    }
  }
  const hit = (origin: T.Vector3, dir: T.Vector3, far: number) => {
    // Amanatides-Woo traversal; returns distance to first solid cell or Infinity
    let x = (origin.x - min.x) / cell, y = (origin.y - min.y) / cell, z = (origin.z - min.z) / cell;
    let i = Math.floor(x), j = Math.floor(y), k = Math.floor(z);
    const sx = Math.sign(dir.x) || 1, sy = Math.sign(dir.y) || 1, sz = Math.sign(dir.z) || 1;
    const tdx = Math.abs(cell / (dir.x || 1e-9)), tdy = Math.abs(cell / (dir.y || 1e-9)), tdz = Math.abs(cell / (dir.z || 1e-9));
    let tx = ((sx > 0 ? i + 1 - x : x - i) * cell) / Math.abs(dir.x || 1e-9);
    let ty = ((sy > 0 ? j + 1 - y : y - j) * cell) / Math.abs(dir.y || 1e-9);
    let tz = ((sz > 0 ? k + 1 - z : z - k) * cell) / Math.abs(dir.z || 1e-9);
    let t = 0, left = false; // ignore solid cells the ray starts in (e.g. Zip standing by a wall)
    while (t <= far) {
      const inside = i >= 0 && j >= 0 && k >= 0 && i < nx && j < ny && k < nz && solid[idx(i, j, k)] === 1;
      if (!inside) left = true; else if (left) return t;
      if (tx < ty && tx < tz) { t = tx; tx += tdx; i += sx; } else if (ty < tz) { t = ty; ty += tdy; j += sy; } else { t = tz; tz += tdz; k += sz; }
    }
    return Infinity;
  };
  return { hit, cells, ms: +(performance.now() - t0).toFixed(1) };
}
