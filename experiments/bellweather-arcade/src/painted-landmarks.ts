import { clearSight } from './canopy';
import * as T from 'three';
import { mulberry32 } from './vendor/rng';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 3D far/mid field for `render=painted`: a hero floating island with a great
// blossom tree, ceramic arches and waterfalls, plus smaller floating islands
// and billowing cloud masses. Everything is lit by the same painted shading as
// the court, so it parallaxes and shades coherently (unlike the old image cards).
// Geometry is low-poly and instanced to keep draw calls small.

const rockMat = () => new T.MeshStandardMaterial({ color: '#c79a86', roughness: .95, flatShading: true, vertexColors: true });
const grassMat = new T.MeshStandardMaterial({ color: '#7fa36a', roughness: 1, flatShading: true });
const ceramic = new T.MeshStandardMaterial({ color: '#f1e8d8', roughness: .55 });
const cloudMat = new T.MeshStandardMaterial({ color: '#f6f2ff', roughness: 1 });

// Inverted, craggy rock cone with warm top strata and cool violet underside.
function rockGeometry(seed: number, radius: number, depth: number) {
  const r = mulberry32(seed);
  const pts: T.Vector2[] = [];
  const rings = 9;
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const w = radius * (1 - Math.pow(t, 1.35)) * (0.92 + r() * 0.16);
    pts.push(new T.Vector2(Math.max(w, .01), -t * depth));
  }
  pts.unshift(new T.Vector2(0.001, 0));
  const g = new T.LatheGeometry(pts, 11);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
  const warm = new T.Color('#e2b48e'), mid = new T.Color('#b98479'), cool = new T.Color('#7a6fa4');
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i), t = -y / depth;
    if (t > .02 && t < .98) { const a = Math.atan2(pos.getZ(i), pos.getX(i)); const k = 1 + (Math.sin(a * 3 + seed) * .08 + (r() - .5) * .14); pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); pos.setY(i, y + (r() - .5) * depth * .04); }
    const c = t < .35 ? warm.clone().lerp(mid, t / .35) : mid.clone().lerp(cool, (t - .35) / .65);
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new T.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

function waterfall(parent: T.Object3D, x: number, y: number, z: number, h: number, w: number) {
  const c = document.createElement('canvas'); c.width = 32; c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)'); grad.addColorStop(.7, 'rgba(236,244,255,0.75)'); grad.addColorStop(1, 'rgba(236,244,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 32, 256);
  for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(190,210,245,0.35)'; g.fillRect(Math.random() * 32, 0, 1.5, 256); }
  const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: T.DoubleSide }));
  m.position.set(x, y - h / 2, z); parent.add(m);
  return m;
}

// Instanced billow lobes: many icospheres clustered into cumulus masses.
function cloudMasses(parent: T.Object3D, clusters: { x: number, y: number, z: number, s: number }[], seed: number) {
  const r = mulberry32(seed);
  const lobes: T.Matrix4[] = [];
  for (const c of clusters) {
    const n = Math.max(3, Math.round((9 + Math.floor(r() * 7)) * lobeKeep));
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = r() * c.s * 1.6, s = c.s * (.45 + r() * .55);
      const p = new T.Vector3(c.x + Math.cos(a) * d, c.y + r() * c.s * .5 + (s * .3), c.z + Math.sin(a) * d * .6);
      lobes.push(new T.Matrix4().compose(p, new T.Quaternion(), new T.Vector3(s, s * .78, s)));
    }
  }
  const mesh = new T.InstancedMesh(new T.IcosahedronGeometry(1, 2), cloudMat, lobes.length);
  lobes.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.castShadow = false; mesh.receiveShadow = false;
  parent.add(mesh);
}


// Far trees: a branching trunk plus opaque, instanced canopy lobes. Alpha-tested
// leaf cards at landmark scale cost most of the frame on integrated GPUs; lobes
// shaded by the painted light bands read as painted foliage masses instead.
const bark = clearSight(new T.MeshStandardMaterial({ color: '#6d4a55', roughness: 1 }), 'dither');
const lobeGeo = new T.IcosahedronGeometry(1, 1);
const canopy: Record<'pink' | 'green', T.Matrix4[]> = { pink: [], green: [] };
const trunks: T.BufferGeometry[] = [];
function blobTree(parent: T.Object3D, x: number, z: number, h: number, pink: boolean, seed: number) {
  const r = mulberry32(seed);
  parent.updateMatrixWorld(true);
  const base = new T.Vector3(x, 0, z).applyMatrix4(parent.matrixWorld);
  const top = base.clone().add(new T.Vector3((r() - .5) * h * .12, h * .62, (r() - .5) * h * .12));
  const curve = new T.CatmullRomCurve3([base, base.clone().lerp(top, .5).add(new T.Vector3(h * .05, 0, 0)), top]);
  trunks.push(new T.TubeGeometry(curve, 6, h * .045, 6, false));
  const crown = top.clone().add(new T.Vector3(0, h * .12, 0));
  const branches = 4;
  for (let b = 0; b < branches; b++) {
    const a = b / branches * Math.PI * 2 + r(), end = crown.clone().add(new T.Vector3(Math.cos(a) * h * .32, h * (.08 + r() * .12), Math.sin(a) * h * .32));
    trunks.push(new T.TubeGeometry(new T.CatmullRomCurve3([top, top.clone().lerp(end, .5).add(new T.Vector3(0, h * .06, 0)), end]), 5, h * .022, 5, false));
  }
  const n = Math.max(8, Math.round((12 + h * 1.8) * canopyKeep));
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * h * .58, s = h * (.085 + r() * .09);
    const p = crown.clone().add(new T.Vector3(Math.cos(a) * d, (r() - .3) * h * .16 - d * d / (h * 1.4), Math.sin(a) * d));
    canopy[pink ? 'pink' : 'green'].push(new T.Matrix4().compose(p, new T.Quaternion().setFromEuler(new T.Euler(r() * 3, r() * 3, 0)), new T.Vector3(s, s * .8, s)));
  }
}
function flushTrees(root: T.Object3D) {
  const mats = { pink: clearSight(new T.MeshStandardMaterial({ color: '#ffa9c8', roughness: 1 }), 'shrink'), green: clearSight(new T.MeshStandardMaterial({ color: '#86ad6f', roughness: 1 }), 'shrink') };
  for (const k of ['pink', 'green'] as const) {
    const list = canopy[k]; if (!list.length) continue;
    const m = new T.InstancedMesh(lobeGeo, mats[k], list.length); list.forEach((x, i) => m.setMatrixAt(i, x)); root.add(m); list.length = 0;
  }
  if (trunks.length) {
    // one merged draw for every trunk and branch
    let count = 0; for (const g of trunks) count += g.index!.count;
    const merged = new T.BufferGeometry(), pos: number[] = [], nor: number[] = [], idx: number[] = []; let off = 0;
    for (const g of trunks) { const P = g.attributes.position, N = g.attributes.normal; for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nor.push(N.getX(i), N.getY(i), N.getZ(i)); } const I = g.index!; for (let i = 0; i < I.count; i++) idx.push(I.getX(i) + off); off += P.count; g.dispose(); }
    merged.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); merged.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); merged.setIndex(idx);
    root.add(new T.Mesh(merged, bark)); trunks.length = 0;
  }
}


// Falling water: bright streaks scrolling down the ribbon, fading into mist.
const falls: T.ShaderMaterial[] = [];
function fallMaterial() {
  return new T.ShaderMaterial({
    transparent: true, depthWrite: false, side: T.DoubleSide,
    uniforms: { uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform float uTime;varying vec2 vUv;
      float h(float x){return fract(sin(x*127.1)*43758.5);}
      void main(){
        float x=vUv.x, y=vUv.y;
        float lane=floor(x*14.0); float speed=.35+h(lane)*.35;
        float streak=smoothstep(.55,1.,fract(y*3.0+uTime*speed+h(lane+3.)));
        float body=smoothstep(0.,.18,x)*smoothstep(1.,.82,x);
        float fade=smoothstep(0.,.45,y);
        vec3 col=mix(vec3(.80,.90,1.),vec3(1.),streak);
        gl_FragColor=vec4(col,(0.55+0.4*streak)*body*fade);
      }`,
  });
}
export function tickLandmarks(dt: number) { for (const m of falls) m.uniforms.uTime.value += dt; }
let lobeKeep = 1, canopyKeep = 1;
export async function buildPaintedLandmarks(scene: T.Scene, opts: { islands?: number, cloudLobes?: number, canopyDetail?: number } = {}) {
  lobeKeep = opts.cloudLobes ?? 1; canopyKeep = opts.canopyDetail ?? 1;
  const root = new T.Group(); root.name = 'painted-landmarks';

  // Hero island: sits beyond the courtyard's outlook, slightly left of centre.
  const hero = new T.Group(); hero.position.set(-26, 30, -150); hero.scale.setScalar(1.3); root.add(hero);
  // Blender-authored hero asset (authoring/hero-island/hero-island.blend): sculpted
  // strata rock, blossom tree with a volumetric crown, ceramic crescent ribs and
  // waterfall ribbons. Falls back to the procedural stand-in if it cannot load.
  let heroLoaded = false;
  try {
    const gltf = await new GLTFLoader().loadAsync('/landmarks/hero-island.glb');
    gltf.scene.traverse(o => {
      const m = o as T.Mesh; if (!m.isMesh) return;
      if (m.name.startsWith('HeroFalls')) { m.material = fallMaterial(); m.renderOrder = 6; falls.push(m.material as T.ShaderMaterial); }
      else { const mat = m.material as T.MeshStandardMaterial; mat.vertexColors = true; mat.roughness = 1; mat.metalness = 0; mat.color.set('#ffffff'); }
    });
    hero.add(gltf.scene); heroLoaded = true;
  } catch (e) { console.warn('hero island asset unavailable; using procedural stand-in', e); }
  if (!heroLoaded) {
  const rock = new T.Mesh(rockGeometry(11, 30, 46), rockMat()); hero.add(rock);
    const top = new T.Mesh(new T.CylinderGeometry(30.5, 29, 2.4, 22), grassMat); top.position.y = 1.0; hero.add(top);
    // great blossom tree (reuses the court's tree builder at landmark scale)
    blobTree(hero, 0, -2, 44, true, 3);
    for (const [x, z, h] of [[-19, 9, 12], [20, 6, 10]] as const) blobTree(hero, x, z, h, false, x);
    // ceramic arches ringing the tree, echoing the court's portal
    const arch = new T.TorusGeometry(1, .05, 8, 40, Math.PI * .92);
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * .95 + i * (Math.PI * 1.9 / 6), rad = 24;
      const m = new T.Mesh(arch, ceramic);
      m.scale.setScalar(13 + (i % 3) * 3);
      m.position.set(Math.cos(a) * rad, 1.5, Math.sin(a) * rad * .8);
      m.rotation.set(0, -a + Math.PI / 2, Math.PI * .04 * (i % 2 ? 1 : -1));
      hero.add(m);
    }
    waterfall(hero, -9, 1.2, 22, 70, 4.5);
    waterfall(hero, 14, 1.2, 20, 58, 3.2);
    waterfall(hero, 26, 1.2, 4, 44, 2.6);

  }

  // Satellite islands (3D, same shading), scattered around the horizon.
  const r = mulberry32(77);
  const sats: [number, number, number, number][] = [
    // angle (0 = -z), distance, y, radius
    [0.45, 230, 44, 12], [-0.62, 260, 18, 16], [0.95, 170, 12, 8], [-1.15, 200, 52, 9],
    [0.18, 320, 70, 14], [1.35, 280, 36, 11], [-0.3, 360, 60, 18], [2.5, 240, 30, 13], [-2.4, 220, 40, 12],
  ];
  const cloudClusters: { x: number, y: number, z: number, s: number }[] = [];
  sats.slice(0, opts.islands ?? sats.length).forEach(([a, d, y, rad], i) => {
    const g = new T.Group(); g.position.set(Math.sin(a) * d, y, -4 - Math.cos(a) * d); root.add(g);
    g.add(new T.Mesh(rockGeometry(100 + i, rad, rad * 1.7), rockMat()));
    const t = new T.Mesh(new T.CylinderGeometry(rad * 1.02, rad * .96, rad * .1, 14), grassMat); t.position.y = rad * .04; g.add(t);
    const k = 1 + Math.floor(r() * 2);
    for (let j = 0; j < k; j++) blobTree(g, (r() - .5) * rad * 1.1, (r() - .5) * rad * 1.1, rad * (.5 + r() * .4), r() < .3, 500 + i * 7 + j);
    if (r() < .6) waterfall(g, (r() - .5) * rad, 0, rad * .8, rad * 2.4, rad * .18);
    cloudClusters.push({ x: g.position.x, y: y - rad * 1.9, z: g.position.z, s: rad * .7 });
  });
  // Mist banks under the hero island and along the horizon line.
  cloudClusters.push({ x: -26, y: -40, z: -150, s: 18 }, { x: -58, y: -30, z: -140, s: 13 }, { x: 4, y: -34, z: -165, s: 14 });
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, d = 150 + r() * 70; cloudClusters.push({ x: Math.sin(a) * d, y: -22 + r() * 6, z: -4 - Math.cos(a) * d, s: 10 + r() * 8 }); }
  cloudMasses(root, cloudClusters, 5);
  flushTrees(root);

  // Far scenery does not need to cast into the court's shadow map.
  root.traverse(o => { if ((o as T.Mesh).isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  scene.add(root);
  return root;
}
