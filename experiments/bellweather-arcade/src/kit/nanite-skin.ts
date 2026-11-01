import * as T from 'three';

// A surface made of countless tiny machines: a fine lattice of hexagonal cells anchored to the body
// (in its rest pose, so it moves with every bone), seams a shade darker, each cell its own faint tint,
// and waves of activity that run across it, lighting cells as they pass. It livens when the
// character speaks or works (`energy`), and fades to a plain sheen where cells would be smaller than
// a pixel (no shimmer far off). One shader patch on any built-in lit material; game-agnostic.

export interface NaniteOpts {
  /** cell size in metres */
  cell?: number;
  /** colour of an active cell */
  glow?: string;
  /** how dark the seams are (0 … 1) */
  seam?: number;
  /** how bright active cells are */
  spark?: number;
  /** a rim of light (0: none) */
  rim?: number;
  /** a key so materials with the same options share a program */
  key?: string;
}

export interface NaniteSkin {
  /** time (s) and energy (0 calm … 1 busy) */
  tick(t: number, energy: number): void;
}

const GLSL = /* glsl */`
  uniform float uNanoT, uNanoE, uNanoCell, uNanoSeam, uNanoSpark, uNanoRim; uniform vec3 uNanoGlow;
  varying vec3 vNanoP, vNanoN;
  float nanoHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  // distance to the cell's edge (0 at the seam, .5 at the centre) and the cell's id
  vec3 nanoHex(vec2 uv) {
    vec2 r = vec2(1., 1.7320508), h = r * .5, a = mod(uv, r) - h, b = mod(uv - h, r) - h, g = dot(a, a) < dot(b, b) ? a : b;
    vec2 q = abs(g); float d = max(dot(q, vec2(.5, .8660254)), q.x);
    return vec3(.5 - d, uv - g);
  }
  // one plane of the lattice: x = seam (1 on the seam), y = cell tint (-1 … 1), z = activity (0 … 1)
  vec3 nanoPlane(vec2 uv, float aa) {
    vec3 h = nanoHex(uv); float r = nanoHash(h.yz);
    float seam = 1. - smoothstep(.0, aa, h.x - .02);
    // waves of activity sweep the body; each cell catches the crest at its own moment
    float wave = sin(dot(h.yz, vec2(.23, .41)) * 1.3 - uNanoT * (1.4 + uNanoE * 2.2) + r * 2.5);
    float act = smoothstep(.9 - uNanoE * .2, 1., wave) * step(.62 - uNanoE * .25, r) + smoothstep(.992, 1., sin(uNanoT * (2. + r * 3.) + r * 40.)) * .8;
    return vec3(seam, r * 2. - 1., act * smoothstep(.0, .12, h.x));
  }
`;

/** Patch a material (MeshStandard/Physical, Lambert…) into a nanite surface. */
export function naniteSkin(mat: T.Material, o: NaniteOpts = {}): NaniteSkin {
  const U = {
    uNanoT: { value: 0 }, uNanoE: { value: 0 }, uNanoCell: { value: o.cell ?? .034 }, uNanoSeam: { value: o.seam ?? .22 },
    uNanoSpark: { value: o.spark ?? .9 }, uNanoRim: { value: o.rim ?? .3 }, uNanoGlow: { value: new T.Color(o.glow ?? '#6ee0d4') },
  };
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev?.call(mat, sh, r);
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vNanoP, vNanoN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvNanoP = transformed; vNanoN = objectNormal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + GLSL)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        vec3 p = vNanoP / uNanoCell, n = abs(normalize(vNanoN)); vec3 w = pow(n, vec3(4.)); w /= w.x + w.y + w.z;
        // cells smaller than about two pixels fade to a plain sheen
        float px = length(fwidth(vNanoP)) / uNanoCell, vis = 1. - smoothstep(.15, .45, px), aa = clamp(px * 1.6, .03, .35);
        vec3 a = nanoPlane(p.yz, aa) * w.x + nanoPlane(p.xz + 17.3, aa) * w.y + nanoPlane(p.xy + 41.7, aa) * w.z;
        diffuseColor.rgb *= 1. - a.x * uNanoSeam * vis + a.y * .035 * vis;
        totalEmissiveRadiance += uNanoGlow * a.z * uNanoSpark * mix(.1, 1., vis) * (.55 + uNanoE * .9);
        float rimK = 1. - clamp(dot(normalize(normal), normalize(vViewPosition)), 0., 1.);
        totalEmissiveRadiance += (diffuseColor.rgb * .35 + vec3(.42, .5, .52)) * pow(rimK, 3.) * uNanoRim;
      }`);
  };
  mat.customProgramCacheKey = () => 'vl-nanite-' + (o.key ?? 'a');
  return { tick(t, e) { U.uNanoT.value = t; U.uNanoE.value += (Math.max(0, Math.min(1, e)) - U.uNanoE.value) * .15; } };
}
