import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Merge a static prop's meshes into one mesh per material (one draw call per
 *  material instead of one per part). Parts listed in `keep` (and their
 *  children) stay separate because they move, hide or change colour. */
export function mergeStatic(root: T.Object3D, keep: T.Object3D[] = []) {
  root.updateMatrixWorld(true);
  const inv = new T.Matrix4().copy(root.matrixWorld).invert();
  const kept = new Set<T.Object3D>(); for (const k of keep) k.traverse(o => kept.add(o));
  const groups = new Map<T.Material, T.BufferGeometry[]>(), victims: T.Mesh[] = [];
  root.traverse(o => {
    const m = o as T.Mesh;
    if (!m.isMesh || kept.has(m) || Array.isArray(m.material) || (m as unknown as T.InstancedMesh).isInstancedMesh) return;
    let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.morphAttributes = {};
    const list = groups.get(m.material) ?? []; list.push(g); groups.set(m.material, list); victims.push(m);
  });
  for (const v of victims) v.removeFromParent();
  let draws = 0;
  for (const [mat, gs] of groups) {
    const merged = mergeGeometries(gs, false); if (!merged) continue;
    const mesh = new T.Mesh(merged, mat); mesh.castShadow = mesh.receiveShadow = true; mesh.name = 'merged'; root.add(mesh); draws++;
  }
  return draws;
}
