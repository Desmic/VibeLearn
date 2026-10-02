import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// Asset kits: libraries of ready models addressed by semantic role
// ("tree.blossom", "grass.tuft", "rock.boulder"), never by source file.
// A kit is one GLB plus an index JSON, both produced by
// authoring/kits/build_kit.py from a kit manifest. Game and world code asks a
// kit for roles; swapping the source library only changes the manifest.
//
// Nothing here knows about Bellweather: the style family's look is applied by
// the caller (adopt hook) after the kit is placed.

export interface KitItem { node: string; source: string; height: number; radius: number; tris: number; lod1?: { node: string; tris: number; distance: number } }
export interface KitRole { tier: 'dressing' | 'landmark' | 'scatter' | 'surface' | null; footprint: number; variant: string | null; items: KitItem[] }
export interface KitIndex { kit: string; version: number; styleFamily: string; glb: string; roles: Record<string, KitRole>; source: Record<string, string> }

/** One model of a role: its primitives, ready to be instanced or cloned. */
export interface KitModel { role: string; index: number; item: KitItem; parts: { geometry: T.BufferGeometry; material: T.Material }[] }

export interface Kit {
  index: KitIndex;
  has(role: string): boolean;
  count(role: string): number;
  /** lod 1 = the lighter distance version, when the kit has one (else the full model) */
  model(role: string, i: number, lod?: number): KitModel;
  /** A plain Object3D copy of one model (for things that need their own
   *  material, e.g. to fade, or to animate). Geometry is shared. */
  clone(role: string, i: number, opts?: { lod?: boolean }): T.Group;
}

let gltf: GLTFLoader | undefined;
export function loaderFor() {
  if (gltf) return gltf;
  const draco = new DRACOLoader();
  // hosted copies cannot serve .wasm, so they use the pure JS decoder
  const hosted = '__vlSearch' in window;
  draco.setDecoderPath(new URL(hosted ? 'draco/' : '/draco/', document.baseURI).href); // public/draco (copied from three)
  draco.setDecoderConfig({ type: hosted ? 'js' : 'wasm' });
  gltf = new GLTFLoader(); gltf.setDRACOLoader(draco);
  return gltf;
}

const kits = new Map<string, Promise<Kit>>();

/** Load a kit once; later calls share it. `base` is the folder holding <name>.json/.glb. */
export function loadKit(name: string, base = '/kits/'): Promise<Kit> {
  const hit = kits.get(name); if (hit) return hit;
  const p = (async () => {
    const index = await (await fetch(base + name + '.json')).json() as KitIndex;
    const loader = loaderFor();
    const url = base + index.glb;
    const doc = await loader.loadAsync(url);
    const nodes = new Map<string, T.Object3D>();
    // three sanitises node names ('.' is dropped), so key by the role extras the kit builder wrote
    doc.scene.traverse(o => { const u = o.userData; if (u.role !== undefined) nodes.set(`${u.role}#${u.variantIndex}${u.lod ? '~' + u.lod : ''}`, o); });
    const models = new Map<string, KitModel>();
    const model = (role: string, i: number, lod = 0): KitModel => {
      const r = index.roles[role]; if (!r) throw Error(`kit ${name}: no role ${role}`);
      const ii = ((i % r.items.length) + r.items.length) % r.items.length, item = r.items[ii];
      const low = lod > 0 && !!item.lod1, key = `${role}#${ii}${low ? '~1' : ''}`; const hit = models.get(key); if (hit) return hit;
      const root = nodes.get(key); if (!root) throw Error(`kit ${name}: missing node ${key}`);
      root.updateMatrixWorld(true);
      const parts: KitModel['parts'] = [];
      root.traverse(o => {
        const m = o as T.Mesh; if (!m.isMesh) return;
        // bake the node transform into the geometry so parts sit at the model origin
        const g = m.geometry.clone(); g.applyMatrix4(new T.Matrix4().copy(root.matrixWorld).invert().multiply(m.matrixWorld));
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        if (mats.length === 1) parts.push({ geometry: g, material: mats[0] });
        else for (const gr of g.groups) {
          // one part per material, sharing the vertex buffers
          const sub = new T.BufferGeometry(); for (const k in g.attributes) sub.setAttribute(k, g.attributes[k]); sub.setIndex(g.index);
          sub.setDrawRange(gr.start, gr.count); sub.boundingSphere = g.boundingSphere ?? (g.computeBoundingSphere(), g.boundingSphere);
          parts.push({ geometry: sub, material: mats[gr.materialIndex ?? 0] });
        }
      });
      const out = { role, index: ii, item, parts }; models.set(key, out); return out;
    };
    return {
      index,
      has: role => !!index.roles[role],
      count: role => index.roles[role]?.items.length ?? 0,
      model,
      clone(role, i, opts = {}) {
        const md = model(role, i), g = new T.Group(); g.name = `${role}#${md.index}`;
        const build = (m: KitModel) => { const grp = new T.Group(); for (const p of m.parts) { const mesh = new T.Mesh(p.geometry, p.material); mesh.castShadow = true; mesh.receiveShadow = true; grp.add(mesh); } return grp; };
        if (opts.lod && md.item.lod1) {
          // near: the full model; from lod1.distance metres away: the light one
          const lod = new T.LOD(); lod.addLevel(build(md), 0); lod.addLevel(build(model(role, i, 1)), md.item.lod1.distance); g.add(lod);
        } else g.add(build(md));
        return g;
      },
    } as Kit;
  })();
  kits.set(name, p);
  return p;
}

const props = new Map<string, Promise<T.Object3D>>(), ready = new Map<string, T.Object3D>();
/** a copy of a prop that has already loaded (preload with loadProp), or null */
export function propNow(name: string): T.Object3D | null { const p = ready.get(name); return p ? p.clone(true) : null; }
/** A single authored prop (one GLB, e.g. the skiff). Each call returns a fresh
 *  copy (geometry and materials shared). */
export async function loadProp(name: string, base = '/props/'): Promise<T.Object3D> {
  let p = props.get(name);
  if (!p) {
    const loader = loaderFor(), url = base + name + '.glb';
    p = loader.loadAsync(url).then(d => { ready.set(name, d.scene); return d.scene; }); props.set(name, p);
  }
  return (await p).clone(true);
}
