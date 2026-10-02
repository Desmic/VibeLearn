import { clearSight } from './canopy';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mulberry32 } from './vendor/rng';

// Promenade dressing for `render=painted`, echoing the reference's lived-in
// plaza: a reflecting lily pool with a ceramic rim, fallen blossom petals,
// tall woven banners and flowering shrubs along the balustrade.
// All original designs. The pool claims its floor space so the player walks around it.

type Box = (minX: number, maxX: number, minZ: number, maxZ: number) => void;
type Circle = (x: number, z: number, r: number) => void;

// ---------------------------------------------------------------- water
// Stylized water: sky-tinted fresnel, drifting painted ripple bands, sun glints
// as short dashes, and a soft edge. On High, an optional mirrored scene texture
// adds true reflections (see reflector below).
function waterMaterial(sunDir: T.Vector3, reflection: T.Texture | null) {
  return new T.ShaderMaterial({
    transparent: false,
    fog: true,
    uniforms: T.UniformsUtils.merge([T.UniformsLib.fog, {
      uTime: { value: 0 },
      uSun: { value: sunDir.clone().normalize() },
      uDeep: { value: new T.Color('#1f5f7a') },
      uShallow: { value: new T.Color('#3f9bb0') },
      uSky: { value: new T.Color('#9fd0f0') },
      uHaze: { value: new T.Color('#f3e6d2') },
      uSize: { value: new T.Vector2(1, 1) },
      uRefl: { value: reflection },
      uHasRefl: { value: reflection ? 1 : 0 },
      uReflMatrix: { value: new T.Matrix4() },
    }]),
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      varying vec3 vW; varying vec2 vUv; varying vec4 vRC;
      uniform mat4 uReflMatrix;
      void main(){
        vUv = uv;
        vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
        vRC = uReflMatrix * w;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime; uniform vec3 uSun,uDeep,uShallow,uSky,uHaze; uniform vec2 uSize;
      uniform sampler2D uRefl; uniform float uHasRefl;
      varying vec3 vW; varying vec2 vUv; varying vec4 vRC;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){
        vec3 V = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(V.y, 0.0), 3.0);
        // painted ripple bands drifting slowly
        vec2 p = vW.xz * 1.6;
        float r1 = n(p + vec2(uTime*.12, uTime*.05));
        float r2 = n(p*2.3 - vec2(uTime*.09, -uTime*.07));
        float band = smoothstep(.55,.62, r1*.65 + r2*.35);
        // edge falloff toward the rim: shallow, lighter
        vec2 e = min(vUv, 1.0 - vUv) * uSize; float edge = 1.0 - smoothstep(0.0, .45, min(e.x, e.y));
        vec3 base = mix(uDeep, uShallow, edge*.7 + band*.18);
        vec3 sky = mix(uSky, uHaze, .25);
        if (uHasRefl > .5) {
          vec2 ruv = vRC.xy / vRC.w + (vec2(r1, r2) - .5) * .025;
          sky = mix(sky, texture2D(uRefl, ruv).rgb, .75);
        }
        vec3 col = mix(base, sky, clamp(fres*.85 + .12, 0., 1.));
        // sun glints as short horizontal dashes
        vec3 Hh = normalize(uSun + V);
        float spec = pow(max(Hh.y, 0.0), 180.0);
        float dash = smoothstep(.7,.95, n(vec2(vW.x*9.0 + uTime*.6, vW.z*2.2)));
        col += vec3(1.0,.93,.8) * spec * dash * 2.2;
        col += vec3(1.0) * band * .06;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}

function lilyPads(parent: T.Object3D, cx: number, cz: number, w: number, d: number, seed: number) {
  const r = mulberry32(seed);
  const pad = new T.CircleGeometry(.32, 18, .35, Math.PI * 2 - .5); pad.rotateX(-Math.PI / 2);
  const padMat = new T.MeshStandardMaterial({ color: '#5f9a5a', roughness: .9, side: T.DoubleSide });
  const n = 22, pads = new T.InstancedMesh(pad, padMat, n), dm = new T.Object3D();
  const flowers: T.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const x = cx + (r() - .5) * (w - 1.0), z = cz + (r() - .5) * (d - .9);
    dm.position.set(x, 0, z); dm.rotation.set(0, r() * Math.PI * 2, 0); const s = .7 + r() * .7; dm.scale.set(s, 1, s); dm.updateMatrix();
    pads.setMatrixAt(i, dm.matrix); pads.setColorAt(i, new T.Color().setHSL(.27 + r() * .06, .38, .36 + r() * .12));
    if (r() < .35) flowers.push(new T.Vector3(x + .05, 0, z));
  }
  parent.add(pads);
  // lotus: two rings of cupped petals, pink tips
  const petal = new T.SphereGeometry(.09, 8, 6); petal.scale(1, .55, 2.1); petal.translate(0, .05, .12);
  const petalMat = new T.MeshStandardMaterial({ color: '#fff3f5', roughness: .8 });
  const count = flowers.length * 12, petals = new T.InstancedMesh(petal, petalMat, count);
  let k = 0;
  for (const f of flowers) for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2 + ring * .5, tilt = ring ? .9 : .45, s = ring ? .75 : 1;
    dm.position.copy(f).setY(.02 + ring * .03); dm.rotation.set(-tilt, a, 0, 'YXZ'); dm.scale.setScalar(s); dm.updateMatrix();
    petals.setMatrixAt(k, dm.matrix); petals.setColorAt(k, new T.Color(ring ? '#f7c3d3' : '#f39ab8')); k++;
  }
  parent.add(petals);
}

// ---------------------------------------------------------------- banners
function bannerTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1d3f73'; g.fillRect(0, 0, 128, 512);
  g.fillStyle = '#c99a55'; g.fillRect(8, 8, 112, 4); g.fillRect(8, 500, 112, 4);
  // original emblem: a sprouting seed inside a rising sun arc
  g.strokeStyle = '#f3e6cc'; g.lineWidth = 5; g.lineCap = 'round';
  g.beginPath(); g.arc(64, 210, 38, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  g.beginPath(); g.moveTo(64, 250); g.bezierCurveTo(64, 215, 62, 190, 64, 160); g.stroke();
  g.fillStyle = '#f3e6cc';
  for (const [dx, dy, rot] of [[-16, 190, -.7], [16, 176, .7], [-12, 162, -.5]] as const) { g.save(); g.translate(64 + dx, dy); g.rotate(rot); g.beginPath(); g.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
  g.font = '600 13px Georgia, serif'; g.textAlign = 'center';
  ['HIGHER', 'KINDER', 'FURTHER'].forEach((w, i) => g.fillText(w, 64, 320 + i * 26));
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
function banner(parent: T.Object3D, x: number, z: number, rotY: number, tex: T.Texture, pole: T.Material, sway: { cloth: T.Mesh, ph: number }[]) {
  const g = new T.Group(); g.position.set(x, .13, z); g.rotation.y = rotY; parent.add(g);
  const post = new T.Mesh(new T.CylinderGeometry(.05, .07, 4.6, 10), pole); post.position.y = 2.3; post.castShadow = true; g.add(post);
  const arm = new T.Mesh(new T.CylinderGeometry(.035, .035, .95, 8), pole); arm.rotation.z = Math.PI / 2; arm.position.set(.45, 4.35, 0); g.add(arm);
  const clothGeo = new T.PlaneGeometry(.78, 2.9, 1, 8); clothGeo.translate(0, -1.45, 0);
  const cloth = new T.Mesh(clothGeo, new T.MeshStandardMaterial({ map: tex, roughness: .95, side: T.DoubleSide }));
  cloth.position.set(.47, 4.32, 0); cloth.castShadow = true; cloth.name = 'BannerCloth'; cloth.userData.fade = { halfW: .45, y0: -2.9, y1: 0 }; g.add(cloth);
  sway.push({ cloth, ph: x * 1.7 + z });
}

// ---------------------------------------------------------------- shrubs & petals
function shrubs(parent: T.Object3D, spots: [number, number, number][], seed: number) {
  const r = mulberry32(seed), lobe = new T.IcosahedronGeometry(1, 1), dm = new T.Object3D();
  const leafMat = clearSight(new T.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }), 'shrink', { near: [.8, 1.8], side: [.3, .8] });
  const bloom = new T.IcosahedronGeometry(1, 1);
  const leaves: T.Matrix4[] = [], leafCol: T.Color[] = [], blooms: T.Matrix4[] = [], bloomCol: T.Color[] = [];
  for (const [x, z, s] of spots) {
    for (let i = 0; i < 9; i++) {
      const a = r() * Math.PI * 2, d = r() * s * .7;
      dm.position.set(x + Math.cos(a) * d, .13 + s * (.35 + r() * .45), z + Math.sin(a) * d); const k = s * (.38 + r() * .25); dm.scale.set(k, k * .85, k); dm.rotation.set(r() * 3, r() * 3, 0); dm.updateMatrix();
      leaves.push(dm.matrix.clone()); leafCol.push(new T.Color().setHSL(.3 + r() * .05, .35, .28 + r() * .1));
    }
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2, d = s * (.45 + r() * .5), y = .13 + s * (.3 + r() * .9);
      dm.position.set(x + Math.cos(a) * d * .9, y, z + Math.sin(a) * d * .9); const k = .05 + r() * .035; dm.scale.setScalar(k); dm.rotation.set(r() * 3, r() * 3, 0); dm.updateMatrix();
      blooms.push(dm.matrix.clone()); bloomCol.push(new T.Color(r() < .75 ? '#ef6fa3' : '#ffd1e0'));
    }
  }
  const L = new T.InstancedMesh(lobe, leafMat, leaves.length); leaves.forEach((m, i) => { L.setMatrixAt(i, m); L.setColorAt(i, leafCol[i]); }); L.castShadow = true; L.receiveShadow = true; parent.add(L);
  const B = new T.InstancedMesh(bloom, clearSight(new T.MeshStandardMaterial({ color: '#ffffff', roughness: .8 }), 'shrink', { near: [.8, 1.8], side: [.3, .8] }), blooms.length); blooms.forEach((m, i) => { B.setMatrixAt(i, m); B.setColorAt(i, bloomCol[i]); }); parent.add(B);
}
function petals(parent: T.Object3D, walk: (x: number, z: number) => boolean, seed: number) {
  const r = mulberry32(seed), geo = new T.CircleGeometry(.05, 5); geo.rotateX(-Math.PI / 2); geo.scale(1, 1, .6);
  const mats: T.Matrix4[] = [], cols: T.Color[] = [], dm = new T.Object3D();
  for (let i = 0; i < 1400 && mats.length < 420; i++) {
    // drift petals downwind of the blossom tree and along the promenade
    const x = -8.5 + r() * 17, z = -11 + r() * 20.5;
    const nearTree = Math.hypot(x - 6.3, z - 3.8) < 5 ? 1 : .18;
    if (r() > nearTree || !walk(x, z)) continue;
    dm.position.set(x, .137, z); dm.rotation.set(0, r() * 6.3, 0); dm.scale.setScalar(.7 + r() * .9); dm.updateMatrix();
    mats.push(dm.matrix.clone()); cols.push(new T.Color(r() < .7 ? '#f07aa6' : '#ffc6d9'));
  }
  const m = new T.InstancedMesh(geo, new T.MeshStandardMaterial({ color: '#ffffff', roughness: 1, side: T.DoubleSide }), mats.length);
  mats.forEach((x, i) => { m.setMatrixAt(i, x); m.setColorAt(i, cols[i]); }); m.receiveShadow = true; parent.add(m);
}

// ---------------------------------------------------------------- build
export function buildPromenade(scene: T.Scene, opts: { box: Box, circle: Circle, walk: (x: number, z: number) => boolean, sunDir: T.Vector3, renderer: T.WebGLRenderer, camera: T.PerspectiveCamera, reflections: boolean }) {
  const root = new T.Group(); root.name = 'painted-promenade'; scene.add(root);

  // Lily pool on the arrival plaza's right, in front of the blossom tree.
  const pool = { x0: 4.1, x1: 8.3, z0: 6.5, z1: 9.1, y: .40 };  // raised basin above the .13 m paving
  const w = pool.x1 - pool.x0, d = pool.z1 - pool.z0, cx = (pool.x0 + pool.x1) / 2, cz = (pool.z0 + pool.z1) / 2;
  let reflector: { target: T.WebGLRenderTarget, cam: T.PerspectiveCamera } | null = null;
  if (opts.reflections) {
    const target = new T.WebGLRenderTarget(512, 512, { samples: 0 });
    target.texture.colorSpace = T.SRGBColorSpace;
    reflector = { target, cam: new T.PerspectiveCamera() };
  }
  const water = new T.Mesh(new T.PlaneGeometry(w, d), waterMaterial(opts.sunDir, reflector?.target.texture ?? null));
  (water.material as T.ShaderMaterial).uniforms.uSize.value.set(w, d);
  water.rotation.x = -Math.PI / 2; water.position.set(cx, pool.y, cz); root.add(water);
  const rimMat = new T.MeshStandardMaterial({ color: '#efe2c9', roughness: .75 });
  const rimH = .36, rimW = .32;
  for (const [x, z, sx, sz] of [[cx, pool.z0 - rimW / 2, w + rimW * 2, rimW], [cx, pool.z1 + rimW / 2, w + rimW * 2, rimW], [pool.x0 - rimW / 2, cz, rimW, d], [pool.x1 + rimW / 2, cz, rimW, d]] as const) {
    const rim = new T.Mesh(new RoundedBoxGeometry(sx, rimH, sz, 2, .06), rimMat); rim.position.set(x, .13 + rimH / 2, z); rim.castShadow = true; rim.receiveShadow = true; root.add(rim);
  }
  const basin = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshStandardMaterial({ color: '#16475c', roughness: 1 }));
  basin.rotation.x = -Math.PI / 2; basin.position.set(cx, pool.y - .05, cz); root.add(basin);
  opts.box(pool.x0 - rimW, pool.x1 + rimW, pool.z0 - rimW, pool.z1 + rimW);
  const lilyRoot = new T.Group(); lilyRoot.position.y = pool.y + .012; root.add(lilyRoot);
  lilyPads(lilyRoot, cx, cz, w, d, 12);

  // Banners marking the plaza and the courtyard outlook.
  const tex = bannerTexture(), pole = clearSight(new T.MeshStandardMaterial({ color: '#2a3f5f', roughness: .6, metalness: .3 }), 'dither');
  const sway: { cloth: T.Mesh, ph: number }[] = [];
  for (const [x, z, ry] of [[-8.2, 8.9, 0], [8.5, 9.1, Math.PI], [-8.2, -10.6, Math.PI], [8.2, -6.7, Math.PI]] as const) { banner(root, x, z, ry, tex, pole, sway); opts.circle(x, z, .2); }

  // Flowering shrubs along the balustrade and at the portal's feet.
  shrubs(root, [[-8.4, 1.0, .75], [-8.4, -0.4, .6], [8.4, 6.2, .6], [8.4, -1.1, .7], [-8.4, -7.2, .7], [8.45, -10.7, .7], [-3.3, -10.8, .55]], 44);
  for (const [x, z, r] of [[-8.4, 1.0, .75], [-8.4, -0.4, .6], [8.4, 6.2, .6], [8.4, -1.1, .7], [-8.4, -7.2, .7], [8.45, -10.7, .7], [-3.3, -10.8, .55]] as const) opts.circle(x, z, r * .8);
  petals(root, opts.walk, 9);

  let t = 0;
  const reflView = new T.Matrix4(), frustum = new T.Frustum(), projView = new T.Matrix4(), tmpW = new T.Vector3(); let frame = 0;
  return {
    tick(dt: number) {
      t += dt; (water.material as T.ShaderMaterial).uniforms.uTime.value = t;
      for (const s of sway) { s.cloth.rotation.y = Math.sin(t * .8 + s.ph) * .12; s.cloth.rotation.x = Math.sin(t * 1.1 + s.ph) * .03; }
    },
    // High tier: render the scene mirrored across the pool plane into a small texture.
    beforeRender() {
      if (!reflector) return;
      // Only when the pool is on screen, and at half rate: ripples hide the lag,
      // and the mirrored pass is a second full scene render.
      frame++;
      const c0 = opts.camera; c0.updateMatrixWorld();
      frustum.setFromProjectionMatrix(projView.multiplyMatrices(c0.projectionMatrix, c0.matrixWorldInverse));
      // skip when the pool is hidden, far away (from another island the ripples
      // can't be seen) or off screen
      if (!root.visible || c0.position.distanceTo(water.getWorldPosition(tmpW)) > 35 || !frustum.intersectsObject(water) || (frame & 1)) return;
      const { cam, target } = reflector, c = opts.camera;
      c.updateMatrixWorld();
      const eye = c.getWorldPosition(new T.Vector3()), fwd = c.getWorldDirection(new T.Vector3());
      const look = eye.clone().add(fwd);
      const refl = (v: T.Vector3) => v.set(v.x, 2 * pool.y - v.y, v.z);
      cam.fov = c.fov; cam.aspect = c.aspect; cam.near = c.near; cam.far = c.far; cam.updateProjectionMatrix();
      cam.position.copy(refl(eye.clone())); cam.up.set(0, -1, 0); cam.lookAt(refl(look)); cam.updateMatrixWorld();
      reflView.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
      const bias = new T.Matrix4().set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1);
      (water.material as T.ShaderMaterial).uniforms.uReflMatrix.value.copy(bias).multiply(reflView);
      water.visible = false; lilyRoot.visible = false;
      const R = opts.renderer, prev = R.getRenderTarget(), clip = R.clippingPlanes;
      R.clippingPlanes = [new T.Plane(new T.Vector3(0, 1, 0), -(pool.y + .12))];
      R.setRenderTarget(target); R.clear(); R.render(scene, cam); R.setRenderTarget(prev); R.clippingPlanes = clip;
      water.visible = true; lilyRoot.visible = true;
    },
  };
}
