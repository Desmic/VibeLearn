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
  /** false: no cell pattern (a light or glass part that should only dissolve and re-form) */
  pattern?: boolean;
}

export interface NaniteSkin {
  /** time (s) and energy (0 calm … 1 busy) */
  tick(t: number, energy: number): void;
  /** shape-shifting: the cells within `r` of a rest-pose point leave, cell by cell (r 0: none). Two at once. */
  cut(i: 0 | 1, at: T.Vector3 | null, r: number): void;
  /** the reverse, for a form being built: only the cells within `r` of a point are there yet (r < 0: all) */
  grow(at: T.Vector3 | null, r: number): void;
}

const GLSL = /* glsl */`
  uniform float uNanoT, uNanoE, uNanoCell, uNanoSeam, uNanoSpark, uNanoRim; uniform vec3 uNanoGlow;
  uniform vec3 uCutC[2], uGrowC; uniform float uCutR[2], uGrowR;
  varying vec3 vNanoP, vNanoN;
  float nanoEdge = 0.;
  // shape-shifting: where the body is coming apart or being built, cell by cell, its edge alight
  void nanoShift() {
    vec3 q = floor(vNanoP / (uNanoCell * 1.15)); float r = fract(sin(dot(q, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    float m = 1e3;
    for (int i = 0; i < 2; i++) if (uCutR[i] > 0.) m = min(m, distance(vNanoP, uCutC[i]) + (r - .5) * uCutR[i] * .5 - uCutR[i]);
    if (uGrowR >= 0.) m = min(m, uGrowR - distance(vNanoP, uGrowC) + (r - .5) * max(uGrowR, .05) * .5);
    if (m < 0.) discard;
    nanoEdge = 1. - smoothstep(0., uNanoCell * 1.2, m);
  }
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
    uCutC: { value: [new T.Vector3(), new T.Vector3()] }, uCutR: { value: [0, 0] }, uGrowC: { value: new T.Vector3() }, uGrowR: { value: -1 },
  };
  const pattern = o.pattern !== false;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev?.call(mat, sh, r);
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vNanoP, vNanoN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvNanoP = transformed; vNanoN = objectNormal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + GLSL)
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nnanoShift();')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      totalEmissiveRadiance += uNanoGlow * nanoEdge * 2.2;
      if (${pattern ? 'true' : 'false'}) {
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
  return {
    tick(t, e) { U.uNanoT.value = t; U.uNanoE.value += (Math.max(0, Math.min(1, e)) - U.uNanoE.value) * .15; },
    cut(i, at, r) { if (at) U.uCutC.value[i].copy(at); U.uCutR.value[i] = Math.max(0, r); },
    grow(at, r) { if (at) U.uGrowC.value.copy(at); U.uGrowR.value = r; },
  };
}
