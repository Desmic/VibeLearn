import * as T from 'three';

// Wind in the vegetation, in the vertex shader: grass and flowers lean and flutter, leaves rustle,
// with slow gusts sweeping across. Nothing on the CPU per plant: one shared time uniform.
// Rules match material names (a kit's materials keep their authored names).

export const WIND = { value: 0 };
export interface WindRule { match: RegExp; amp: number; /** local height (m) at which the sway is full */ h: number }
export const WIND_RULES: WindRule[] = [
  { match: /^Grass/, amp: .085, h: .55 },
  { match: /^Flowers/, amp: .07, h: .5 },
  { match: /^Leaves/, amp: .03, h: 3.2 },
];

const done = new WeakSet<T.Material>();
/** make a material sway in the wind (chains any hook it already has) */
export function windify(m: T.Material, amp: number, h: number) {
  if (done.has(m)) return; done.add(m);
  const prev = m.onBeforeCompile !== T.Material.prototype.onBeforeCompile ? m.onBeforeCompile.bind(m) : null;
  const prevKey = m.customProgramCacheKey.bind(m);
  m.onBeforeCompile = (sh, r) => {
    prev?.(sh, r);
    sh.uniforms.vlWindT = WIND;
    sh.vertexShader = 'uniform float vlWindT;\n' + sh.vertexShader.replace('#include <begin_vertex>', /* glsl */`#include <begin_vertex>
      {
        vec3 vlO = modelMatrix[3].xyz;
        #ifdef USE_INSTANCING
          vlO += instanceMatrix[3].xyz;
        #endif
        float vlK = clamp(position.y / ${h.toFixed(3)}, 0., 1.); vlK *= vlK;
        float vlP = dot(vlO.xz, vec2(.31, .23)) + position.x * .7;
        float vlG = sin(vlWindT * .45 + vlO.x * .06 + vlO.z * .03) * .5 + .5;
        transformed.x += (sin(vlWindT * 1.9 + vlP) * .55 + vlG * vlG * .9) * ${amp.toFixed(4)} * vlK;
        transformed.z += sin(vlWindT * 1.4 + vlP * 1.3) * .45 * ${amp.toFixed(4)} * vlK;
      }`);
  };
  m.customProgramCacheKey = () => prevKey() + `|wind${amp},${h}`;
  m.needsUpdate = true;
}

/** apply the rules to every mesh material under a root */
export function windifyTree(root: T.Object3D, rules = WIND_RULES) {
  root.traverse(o => {
    const mesh = o as T.Mesh; if (!mesh.isMesh) return;
    for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      const r = rules.find(x => x.match.test(mat.name)); if (r) windify(mat, r.amp, r.h);
    }
  });
}
