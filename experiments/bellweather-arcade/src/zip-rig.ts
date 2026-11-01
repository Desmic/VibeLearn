import * as T from 'three';
import { faceCue } from './kit/face-rig';
import { naniteSkin } from './kit/nanite-skin';
import { buildNaniteSwarm } from './kit/nanite-swarm';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { poseBase } from './kit/pose-hold';

// Zip, rigged. A reusable pattern for every generated character:
//   1. a small humanoid skeleton with canonical bone names (retarget-friendly),
//   2. hard-surface parts rigidly skinned to one bone each (robots need no
//      weight painting), merged per material into a few SkinnedMeshes,
//   3. an animation set: procedural fallback clips (idle / walk / jog / wave /
//      cheer) that library clips (e.g. Quaternius UAL, CC0) can replace by name,
//   4. procedural secondary motion (ears, scarf, blink, look-at) layered on top.
// Front is -Z, up is +Y, feet on y = 0, arms down in the rest pose.

export type BoneName =
  | 'Hips' | 'Spine' | 'Chest' | 'Neck' | 'Head' | 'EarL' | 'EarR'
  | 'UpperArmL' | 'LowerArmL' | 'HandL' | 'UpperArmR' | 'LowerArmR' | 'HandR'
  | 'UpperLegL' | 'LowerLegL' | 'FootL' | 'UpperLegR' | 'LowerLegR' | 'FootR'
  | 'Scarf1' | 'Scarf2' | 'Scarf3';

// Rest positions in model space. Zip faces -Z, so its left side is -X.
const JOINTS: Record<BoneName, [number, number, number, BoneName | null]> = {
  Hips: [0, .74, 0, null], Spine: [0, .88, 0, 'Hips'], Chest: [0, 1.04, 0, 'Spine'],
  Neck: [0, 1.24, 0, 'Chest'], Head: [0, 1.36, 0, 'Neck'],
  EarL: [-.18, 1.70, .02, 'Head'], EarR: [.18, 1.70, .02, 'Head'],
  UpperArmL: [-.235, 1.16, 0, 'Chest'], LowerArmL: [-.29, .90, .015, 'UpperArmL'], HandL: [-.28, .70, -.005, 'LowerArmL'],
  UpperArmR: [.235, 1.16, 0, 'Chest'], LowerArmR: [.29, .90, .015, 'UpperArmR'], HandR: [.28, .70, -.005, 'LowerArmR'],
  UpperLegL: [-.10, .68, 0, 'Hips'], LowerLegL: [-.12, .40, .005, 'UpperLegL'], FootL: [-.14, .11, 0, 'LowerLegL'],
  UpperLegR: [.10, .68, 0, 'Hips'], LowerLegR: [.12, .40, .005, 'UpperLegR'], FootR: [.14, .11, 0, 'LowerLegR'],
  Scarf1: [-.14, 1.24, .12, 'Chest'], Scarf2: [-.24, 1.08, .24, 'Scarf1'], Scarf3: [-.33, .86, .30, 'Scarf2'],
};
const ORDER = Object.keys(JOINTS) as BoneName[];

export type ZipForm = 'chest' | 'cage' | 'wings';

export interface ZipRig {
  root: T.Group;
  skeleton: T.Skeleton;
  bones: Record<BoneName, T.Bone>;
  mixer: T.AnimationMixer;
  actions: Record<string, T.AnimationAction>;
  update(dt: number, speed: number, reduced: boolean): void;
  wave(): void;
  cheer(): void;
  lookAt(world: T.Vector3 | null): void;
  /** what he feels (kit/face-rig.ts FEELINGS names), until told otherwise; null: his usual face */
  feel(name: string | null): void;
  /** shape-shift (he is nanites): 'chest' opens onto his speech engine, 'cage' turns his right hand
   *  into a cage of light, 'wings' grows wings from his back. Idempotent: call it every frame. */
  shift(form: ZipForm, on: boolean): void;
  /** how far each form has grown (0 … 1), for tests */
  readonly forms: Record<ZipForm, number>;
  /** the motes' size stays in metres: the drawing height and fov */
  view(heightPx: number, fovDeg: number): void;
  useClips(clips: T.AnimationClip[]): void;
}

export function buildZipRig(): ZipRig {
  const root = new T.Group(); root.name = 'Zip';
  // ---------------------------------------------------------------- skeleton
  const bones = {} as Record<BoneName, T.Bone>;
  for (const n of ORDER) { const b = new T.Bone(); b.name = n; bones[n] = b; }
  for (const n of ORDER) {
    const [x, y, z, parent] = JOINTS[n];
    const b = bones[n];
    if (parent) { const [px, py, pz] = JOINTS[parent]; b.position.set(x - px, y - py, z - pz); bones[parent].add(b); }
    else { b.position.set(x, y, z); root.add(b); }
  }
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton(ORDER.map(n => bones[n]));
  const index = (n: BoneName) => ORDER.indexOf(n);

  // ---------------------------------------------------------------- materials (Zip's palette)
  // 2 Nov redesign (Desmic: Zip "doesn't look like the pinnacle of technology"): a machine from far
  // ahead is seamless, not bolted. A pearl shell with a faint sheen of colour (iridescent, lacquered),
  // a face of deep black glass, a graphite core where the shell parts, and joints that are light: the
  // pieces are held by fields, not axles. The orange scarf stays (somebody gave it to him).
  const pearl = new T.MeshPhysicalMaterial({ color: '#f4f0e8', roughness: .3, metalness: .04, clearcoat: .85, clearcoatRoughness: .14, iridescence: .32, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 420] });
  const graphite = new T.MeshPhysicalMaterial({ color: '#1d2838', roughness: .32, metalness: .65, clearcoat: .4, clearcoatRoughness: .3 });
  const faceGlass = new T.MeshPhysicalMaterial({ color: '#05080f', roughness: .05, metalness: .25, clearcoat: 1, clearcoatRoughness: .04 });
  // He is made of nanites (Desmic, 2 Nov: "a nanobot tech, which can shape shift"): the shell is a
  // lattice of tiny cells with waves of activity running through it, busier when he talks or runs
  // (kit/nanite-skin.ts), and a soft rim of light like the people's.
  const skins = [naniteSkin(pearl, { cell: .02, seam: .11, spark: .55, key: 'zip-shell' }), naniteSkin(graphite, { cell: .014, seam: .2, spark: .4, rim: .22, key: 'zip-core' })];
  const light = new T.MeshStandardMaterial({ color: '#c6f6ee', emissive: '#6ee0d4', emissiveIntensity: .9, roughness: .3 });
  const cloth = new T.MeshStandardMaterial({ color: '#df742e', roughness: .95, side: T.DoubleSide });
  const buckets = new Map<T.Material, T.BufferGeometry[]>();
  const v = (x: number, y: number, z: number) => new T.Vector3(x, y, z);

  // Rigid skinning: every vertex of a part follows exactly one bone. Optional
  // `blend` spreads a strip (the scarf) across a bone chain by a coordinate.
  function part(g: T.BufferGeometry, m: T.Material, bone: BoneName, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) {
    g.applyMatrix4(new T.Matrix4().compose(v(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), v(1, 1, 1)));
    const flat = g.index ? g.toNonIndexed() : g; if (flat !== g) g.dispose();
    for (const name of Object.keys(flat.attributes)) if (!['position', 'normal', 'uv'].includes(name)) flat.deleteAttribute(name);
    if (!flat.getAttribute('uv')) flat.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(flat.getAttribute('position').count * 2), 2));
    const count = flat.getAttribute('position').count;
    const si = new Uint16Array(count * 4), sw = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) { si[i * 4] = index(bone); sw[i * 4] = 1; }
    flat.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4));
    flat.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4));
    flat.clearGroups();
    const list = buckets.get(m) ?? []; list.push(flat); buckets.set(m, list);
    return flat;
  }
  const box = (w: number, h: number, d: number, r: number, m: T.Material, bone: BoneName, x: number, y: number, z: number, rz = 0) =>
    part(new RoundedBoxGeometry(w, h, d, 2, r), m, bone, x, y, z, 0, 0, rz);
  // ---------------------------------------------------------------- body (the far-future courier, 2 Nov)
  const egg = (rx: number, ry: number, rz: number, m: T.Material, bone: BoneName, x: number, y: number, z: number, ax = 0, ay = 0, az = 0, seg = 32) =>
    part(new T.SphereGeometry(1, seg, Math.round(seg * .75)).scale(rx, ry, rz), m, bone, x, y, z, ax, ay, az);
  // a limb: a smooth capsule from a to b that tapers from r0 to r1
  function limb(a: T.Vector3, b: T.Vector3, r0: number, r1: number, m: T.Material, bone: BoneName) {
    const d = b.clone().sub(a), L = d.length(), g = new T.CapsuleGeometry(1, L, 8, 24), P = g.getAttribute('position');
    for (let i = 0; i < P.count; i++) { const y = P.getY(i), k = T.MathUtils.lerp(r0, r1, T.MathUtils.clamp(.5 - y / (L + 2), 0, 1)); P.setXYZ(i, P.getX(i) * k, y > L / 2 ? L / 2 + (y - L / 2) * k : y < -L / 2 ? -L / 2 + (y + L / 2) * k : y, P.getZ(i) * k); }
    g.computeVertexNormals(); g.applyQuaternion(new T.Quaternion().setFromUnitVectors(v(0, -1, 0), d.normalize()));
    const mid = a.clone().lerp(b, .5); return part(g, m, bone, mid.x, mid.y, mid.z);
  }
  const orb = (r: number, bone: BoneName, x: number, y: number, z: number) => part(new T.SphereGeometry(r, 16, 12), light, bone, x, y, z);
  const ring = (r: number, tube: number, m: T.Material, bone: BoneName, x: number, y: number, z: number, ax = Math.PI / 2, ay = 0, az = 0) => part(new T.TorusGeometry(r, tube, 8, 40), m, bone, x, y, z, ax, ay, az);
  // pelvis and the graphite core that rises from it; a ring of light where the shell parts
  egg(.125, .07, .1, pearl, 'Hips', 0, .745, 0);
  limb(v(0, .78, 0), v(0, .95, 0), .052, .06, graphite, 'Spine');
  ring(.07, .006, light, 'Spine', 0, .855, 0);
  // the torso: one seamless shell, and on it the lens of his speech engine (it lights as his voice does)
  {   // sculpted, not a ball: broad at the chest, narrowing to the waist
    const prof = [[0, .872], [.07, .878], [.11, .905], [.14, .95], [.17, 1.01], [.19, 1.07], [.198, 1.115], [.19, 1.165], [.16, 1.208], [.105, 1.242], [0, 1.254]].map(([r, y]) => new T.Vector2(r, y));
    part(new T.LatheGeometry(prof, 48).scale(1, 1, .78), pearl, 'Chest', 0, 0, 0);
  }
  egg(.05, .05, .018, light, 'Chest', 0, 1.115, -.148);
  ring(.066, .007, graphite, 'Chest', 0, 1.115, -.146, 0);
  egg(.065, .065, .035, light, 'Chest', 0, 1.11, -.105, 0, 0, 0, 20);   // the speech engine's core, inside: seen when his chest opens
  egg(.17, .165, .122, graphite, 'Chest', 0, 1.075, 0);              // ...in a dark cavity (the shell is only a shell)
  part(new T.TorusGeometry(.158, .005, 8, 48).rotateX(Math.PI / 2).scale(1, 1, .78), light, 'Chest', 0, .975, 0);   // a seam of light where the shell closes
  // neck: a graphite stem inside a floating ring
  limb(v(0, 1.21, 0), v(0, 1.35, 0), .042, .042, graphite, 'Neck');
  // head: a pearl shell around a domed face of black glass; eyes and mouth are light on the glass
  egg(.25, .215, .222, pearl, 'Head', 0, 1.535, .01);
  egg(.205, .165, .072, faceGlass, 'Head', 0, 1.515, -.168);
  part(new T.TorusGeometry(1, .028, 8, 64).scale(.207, .167, .2), light, 'Head', 0, 1.515, -.174);   // the face's edge lit
  box(.044, .014, .012, .007, light, 'Head', 0, 1.432, -.236);
  const eyes: T.BufferGeometry[] = [];
  for (const side of [-1, 1] as const) {
    const S = side > 0 ? 'R' : 'L';
    const ear = `Ear${S}` as BoneName;
    // ears: long swept fins with a seam of light down the inside
    egg(.042, .165, .024, pearl, ear, side * .175, 1.835, .02, 0, 0, -side * .2);
    egg(.011, .12, .006, light, ear, side * .17, 1.84, -.004, 0, 0, -side * .2, 16);
    // side sensors: a ring of light set flush into the shell
    egg(.05, .05, .012, faceGlass, 'Head', side * .243, 1.52, 0, 0, Math.PI / 2, 0, 24);
    ring(.052, .007, light, 'Head', side * .247, 1.52, 0, 0, Math.PI / 2, 0);
    eyes.push(part(new RoundedBoxGeometry(.05, .09, .012, 5, .023), light, 'Head', side * .09, 1.525, -.239, 0, 0, -side * .04));   // (5 segments: enough points to bend into a smile)
    // arm: shell segments with light at the joints (no axles: held by fields)
    const UA = `UpperArm${S}` as BoneName, LA = `LowerArm${S}` as BoneName, H = `Hand${S}` as BoneName;
    egg(.072, .062, .068, pearl, 'Chest', side * .232, 1.18, 0);
    orb(.026, UA, side * .238, 1.155, 0);
    limb(v(side * .25, 1.12, 0), v(side * .285, .945, .012), .054, .044, pearl, UA);
    orb(.024, LA, side * .29, .9, .015);
    limb(v(side * .29, .865, .012), v(side * .283, .735, -.005), .043, .054, pearl, LA);
    ring(.05, .006, light, LA, side * .283, .728, -.005);
    egg(.04, .055, .048, graphite, H, side * .28, .665, -.012);
    // leg
    const UL = `UpperLeg${S}` as BoneName, LL = `LowerLeg${S}` as BoneName, F = `Foot${S}` as BoneName;
    orb(.026, UL, side * .1, .675, 0);
    limb(v(side * .102, .65, 0), v(side * .12, .435, .006), .07, .052, pearl, UL);
    orb(.026, LL, side * .12, .4, .005);
    limb(v(side * .122, .365, .006), v(side * .138, .15, 0), .053, .043, pearl, LL);
    ring(.047, .006, light, LL, side * .138, .135, 0);
    egg(.062, .048, .13, pearl, F, side * .14, .062, -.05);
    egg(.064, .016, .136, graphite, F, side * .14, .018, -.05);
  }
  // collar + ribbon scarf (spread across the scarf chain so it can flutter)
  part(new T.TorusGeometry(.12, .041, 8, 24), cloth, 'Neck', 0, 1.285, 0, Math.PI / 2);
  box(.115, .09, .12, .028, cloth, 'Scarf1', -.13, 1.27, .09, -.22);
  {
    const centers = [v(-.13, 1.29, .11), v(-.20, 1.18, .22), v(-.27, 1.01, .28), v(-.32, .82, .30), v(-.43, .66, .29), v(-.47, .62, .265)];
    const widths = [.075, .09, .085, .078, .063, .01];
    const chain: BoneName[] = ['Scarf1', 'Scarf1', 'Scarf2', 'Scarf2', 'Scarf3', 'Scarf3'];
    const pos: number[] = [], uvs: number[] = [], idx: number[] = [], si: number[] = [], sw: number[] = [];
    centers.forEach((p, i) => {
      for (const [j, t] of [-1, 0, 1].entries()) {
        pos.push(p.x + t * widths[i], p.y - t * .015, p.z + (t === 0 ? .02 : 0)); uvs.push(j / 2, i / (centers.length - 1));
        si.push(index(chain[i]), 0, 0, 0); sw.push(1, 0, 0, 0);
      }
      if (i < centers.length - 1) for (let j = 0; j < 2; j++) { const a = i * 3 + j; idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4); }
    });
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const flat = g.toNonIndexed(); g.dispose();
    flat.setAttribute('skinIndex', new T.Uint16BufferAttribute(new Uint16Array(flat.getAttribute('position').count * 4), 4));
    flat.setAttribute('skinWeight', new T.Float32BufferAttribute(new Float32Array(flat.getAttribute('position').count * 4), 4));
    // re-derive per-vertex chain bone from height after de-indexing
    const P = flat.getAttribute('position'), SI = flat.getAttribute('skinIndex'), SW = flat.getAttribute('skinWeight');
    for (let i = 0; i < P.count; i++) { const y = P.getY(i); const b = y > 1.1 ? 'Scarf1' : y > .9 ? 'Scarf2' : 'Scarf3'; SI.setX(i, index(b)); SW.setX(i, 1); }
    const list = buckets.get(cloth) ?? []; list.push(flat); buckets.set(cloth, list);
  }

  // ---------------------------------------------------------------- merge into skinned meshes
  const eyeMeshes: T.SkinnedMesh[] = [];
  for (const [material, parts] of buckets) {
    const geometry = mergeGeometries(parts, false); if (!geometry) throw new Error('Zip part attributes do not match');
    const mesh = new T.SkinnedMesh(geometry, material);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
    root.add(mesh); mesh.bind(skeleton, new T.Matrix4());
    if (material === light) eyeMeshes.push(mesh);
    for (const g of parts) g.dispose();
  }
  // the face: two light pills behind the visor and a small mouth. Morphs (relative): 0 blink (shut),
  // 1 glad (short, raised and bowed: smiling eyes; the mouth smiles), 2 sad (heavy lids; the mouth
  // turns down), 3 wide (taller), 4 talk (the mouth opens).
  const eyeMesh = eyeMeshes[0];
  if (eyeMesh) {
    const P = eyeMesh.geometry.getAttribute('position') as T.BufferAttribute;
    const D = [0, 1, 2, 3, 4].map(() => new Float32Array(P.count * 3));
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      if (z > -.2) continue;
      if (Math.abs(x) < .035 && Math.abs(y - 1.432) < .02) {   // the mouth
        const u = Math.min(1, Math.abs(x) / .022), dy = y - 1.432;
        D[1][i * 3 + 1] = u * u * .009 - .002; D[1][i * 3] = x * .25;               // a smile: corners up
        D[2][i * 3 + 1] = -u * u * .007 + .002;                                      // turned down
        D[4][i * 3 + 1] = dy < 0 ? -.016 * (1 - u * u * .6) : .002; D[4][i * 3] = -x * .15;   // open: a round "o"
        continue;
      }
      if (!(Math.abs(Math.abs(x) - .09) < .04 && Math.abs(y - 1.525) < .06)) continue;
      const dx = x - Math.sign(x) * .09, dy = y - 1.525, u = Math.min(1, Math.abs(dx) / .026);
      D[0][i * 3 + 1] = (1.51 + dy * .1) - y;
      D[1][i * 3] = dx * .4; D[1][i * 3 + 1] = -dy * .72 + .006 + (1 - u * u) * .03;   // thin, wide, bowed up: ◠ (smiling eyes)
      D[2][i * 3 + 1] = -Math.max(0, dy) * .6 - .006;                    // heavy lids: the tops come down
      D[3][i * 3] = dx * .12; D[3][i * 3 + 1] = dy * .28;
    }
    eyeMesh.geometry.morphAttributes.position = D.map(d => new T.Float32BufferAttribute(d, 3));
    eyeMesh.geometry.morphTargetsRelative = true;
    eyeMesh.updateMorphTargets(); eyeMesh.morphTargetInfluences = [0, 0, 0, 0, 0];
  }
  /** a feeling as slit shapes and ear set: [glad, sad, wide, ears (+ up, − down)] */
  const ZIP_FEEL: Record<string, [number, number, number, number]> = {
    warm: [.45, 0, 0, .1], happy: [1, 0, 0, .25], proud: [.8, 0, .1, .2], curious: [0, 0, .35, .25],
    worried: [0, .7, .1, -.25], sad: [0, 1, 0, -.45], afraid: [0, .6, .6, -.35], shocked: [0, 0, 1, .3], determined: [.15, 0, -.2, 0],
  };
  const feelNow = [0, 0, 0, 0]; let feltZip: string | null = null;

  // ---------------------------------------------------------------- shape-shifting (2 Nov: "a nanobot
  // tech, which can shape shift according to needs"). A form grows out of him cell by cell while the
  // part it replaces comes apart the same way, and a stream of motes carries the matter across.
  const lightSkin = naniteSkin(light, { pattern: false, key: 'zip-light' });
  skins.push(lightSkin);
  const swarm = buildNaniteSwarm(root as unknown as T.Scene, { max: 360 });
  swarm.points.matrixWorldAutoUpdate = false; swarm.points.matrixWorld.identity();   // its motes are placed in world space
  const restOf = (bone: BoneName, p: T.Vector3) => { const [x, y, z] = JOINTS[bone]; return p.clone().sub(v(x, y, z)); };
  const worldAt = (bone: BoneName, rest: T.Vector3) => { const local = restOf(bone, rest), out = new T.Vector3(); return () => bones[bone].localToWorld(out.copy(local)); };
  const CHEST = v(0, 1.115, -.15), HAND = v(.28, .665, -.012), BACK = v(0, 1.15, .14);
  // the cage his right hand becomes (to catch and hold the spark)
  const formLight = new T.MeshStandardMaterial({ color: '#c6f6ee', emissive: '#6ee0d4', emissiveIntensity: 1.1, roughness: .3 });
  const cageSkin = naniteSkin(formLight, { pattern: false, key: 'zip-form-light' });
  const cage = new T.Group(); cage.position.copy(restOf('HandR', HAND)); cage.visible = false; bones.HandR.add(cage);
  for (const [ax, ay] of [[0, 0], [Math.PI / 2, 0], [Math.PI / 2, Math.PI / 2], [Math.PI / 4, Math.PI / 4]]) { const r = new T.Mesh(new T.TorusGeometry(.09, .007, 8, 40), formLight); r.rotation.set(ax, ay, 0); cage.add(r); }
  cage.add(new T.Mesh(new T.SphereGeometry(.03, 16, 12), formLight));
  // wings from his back (to fly)
  const wingMat = new T.MeshPhysicalMaterial({ color: '#f4f0e8', roughness: .3, metalness: .04, clearcoat: .85, clearcoatRoughness: .14, iridescence: .45, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 420] });
  const wingSkin = naniteSkin(wingMat, { cell: .022, seam: .12, spark: .8, key: 'zip-wing' });
  const wings = new T.Group(); wings.position.copy(restOf('Chest', BACK)); wings.visible = false; bones.Chest.add(wings);
  // three long feathers a side, fanned up and swept back, each with a spine of light
  const feather = (() => {
    const sh = new T.Shape(); sh.moveTo(0, -.025); sh.quadraticCurveTo(.25, -.075, .56, -.006); sh.quadraticCurveTo(.3, .07, 0, .03); sh.closePath();
    const g = new T.ExtrudeGeometry(sh, { depth: .012, bevelEnabled: true, bevelThickness: .005, bevelSize: .005, bevelSegments: 2, curveSegments: 16 }); g.translate(0, 0, -.006); return g;
  })();
  const spine = new T.BoxGeometry(.46, .007, .022).translate(.25, .002, 0);
  const spineMat = new T.MeshStandardMaterial({ color: '#c6f6ee', emissive: '#6ee0d4', emissiveIntensity: 1.1, roughness: .3 });
  const spineSkin = naniteSkin(spineMat, { pattern: false, key: 'zip-form-light' });
  wingMat.side = T.DoubleSide;
  const wingMeshes: T.Mesh[] = [];
  for (const side of [1, -1]) {
    const half = new T.Group(); half.scale.x = side; half.position.x = side * .05; half.rotation.y = -side * .4; wings.add(half);
    [[-.05, 1], [.32, .92], [.66, .78]].forEach(([fan, len], i) => {
      const f = new T.Mesh(feather, wingMat); f.castShadow = true; f.rotation.z = fan; f.scale.setScalar(len); f.position.z = i * .012; half.add(f); wingMeshes.push(f);
      const sp = new T.Mesh(spine, spineMat); sp.rotation.z = fan; sp.scale.setScalar(len); sp.position.z = i * .012 + .012; half.add(sp);
    });
  }
  const forms: Record<ZipForm, { k: number; on: boolean }> = { chest: { k: 0, on: false }, cage: { k: 0, on: false }, wings: { k: 0, on: false } };
  const chestAt = worldAt('Chest', CHEST), handAt = worldAt('HandR', HAND), backAt = worldAt('Chest', BACK);
  const tipAt = (side: number) => { const out = new T.Vector3(); return () => wingMeshes[side > 0 ? 1 : 4].localToWorld(out.set(.5, 0, 0)); };
  const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function shift(form: ZipForm, on: boolean) {
    const f = forms[form]; if (f.on === on) return; f.on = on;
    root.updateMatrixWorld(true);
    // the matter crosses: out of the body into the new form, or back
    if (form === 'chest') { const ring = Array.from({ length: 6 }, (_, i) => { const p = new T.Vector3(); return () => chestAt().clone().add(p.set(Math.cos(i) * .22, Math.sin(i * 1.7) * .18, -.12)); }); for (const r of ring) on ? swarm.stream(chestAt, r, 8, .6, { spread: .05, curl: .15 }) : swarm.stream(r, chestAt, 8, .6, { spread: .05, curl: .15 }); }
    if (form === 'cage') on ? swarm.stream(handAt, handAt, 36, .7, { spread: .03, curl: .18 }) : swarm.stream(handAt, chestAt, 40, .9, { spread: .07, curl: .3 });
    if (form === 'wings') for (const sd of [1, -1]) on ? swarm.stream(backAt, tipAt(sd), 55, .9, { spread: .05, curl: .25, stagger: .45 }) : swarm.stream(tipAt(sd), backAt, 55, .8, { spread: .1, curl: .2, stagger: .3 });
  }
  // at rest, now and then a few motes lift off him and settle back (he is never quite still)
  const restSpots = ([['Head', v(.12, 1.7, .05)], ['Head', v(-.15, 1.62, .08)], ['Chest', v(.2, 1.2, .02)], ['Chest', v(-.18, 1.12, .08)], ['UpperArmR', v(.27, 1.05, 0)], ['UpperArmL', v(-.27, 1.0, 0)], ['EarR', v(.19, 1.9, .02)], ['EarL', v(-.19, 1.88, .02)], ['Hips', v(.1, .76, .06)]] as [BoneName, T.Vector3][]).map(([b, p]) => worldAt(b, p));
  let driftT = 1.5;
  function tickDrift(dt: number, still: boolean) {
    driftT -= dt; if (driftT > 0) return;
    driftT = still ? 1.2 + Math.random() * 2.5 : 3 + Math.random() * 3;
    const at = restSpots[Math.floor(Math.random() * restSpots.length)];
    swarm.stream(at, at, still ? 5 : 3, 1.6, { spread: .03, curl: .16, stagger: .5 });
  }
  function tickForms(dt: number) {
    for (const f of Object.values(forms)) f.k = Math.min(1, Math.max(0, f.k + (f.on ? 1 : -1) * dt / .6));
    const c = forms.chest.k, h = forms.cage.k, w = forms.wings.k;
    // the chest opens round the engine's lens; the right hand comes apart and the cage grows in its place
    for (const sk of skins) { sk.cut(0, CHEST, ss(0, 1, c) * .1); sk.cut(1, HAND, ss(0, .55, h) * .092); }
    cage.visible = h > .3; cageSkin.grow(v(0, 0, 0), cage.visible ? ss(.3, 1, h) * .14 : -1);
    cage.rotation.y += dt * 1.6; cage.rotation.x += dt * .7;
    wings.visible = w > .01; wingSkin.grow(v(0, 0, 0), wings.visible && w < 1 ? ss(0, 1, w) * .72 : -1); spineSkin.grow(v(0, 0, 0), wings.visible && w < 1 ? ss(.15, 1, w) * .6 : -1);
    wings.children.forEach((half, i) => { half.rotation.z = Math.sin(t * 2.2 + i) * .06 * w; });
    wingSkin.tick(t, .6); cageSkin.tick(t, 1); swarm.tick(dt);
    return c;
  }

  // ---------------------------------------------------------------- procedural clips
  const mixer = new T.AnimationMixer(root);
  const clips = proceduralClips(bones);
  const actions: Record<string, T.AnimationAction> = {};
  const install = (list: T.AnimationClip[]) => {
    for (const c of list) {
      const a = mixer.clipAction(c); actions[c.name] = a;
      if (['Wave', 'Cheer'].includes(c.name)) { a.setLoop(T.LoopOnce, 1); a.clampWhenFinished = false; }
      else { a.play(); a.setEffectiveWeight(c.name === 'Idle' ? 1 : 0); }
    }
  };
  install(clips);

  // ---------------------------------------------------------------- runtime state
  let t = 0, blinkAt = 2 + Math.random() * 3, blink = 0, gesture: T.AnimationAction | null = null, talkGlow = 0;
  let lookTarget: T.Vector3 | null = null; const headLook = new T.Euler();
  const earVel = [0, 0], earAng = [0, 0], scarfLag = new T.Vector3(); let lastYaw = 0, smoothSpeed = 0;
  const q = new T.Quaternion(), e = new T.Euler(), tmp = new T.Vector3();
  // secondary motion is layered on the clips' pose: each frame starts from the clips' last pose
  // (bones a clip doesn't animate: from rest), never from rest itself (kit/pose-hold.ts)
  const base = poseBase(ORDER.map(n => bones[n]));

  function update(dt: number, speed: number, reduced: boolean) {
    base.restore();
    t += dt;
    smoothSpeed += (speed - smoothSpeed) * Math.min(1, dt * 8);
    // locomotion blend: idle -> walk (<=1.6 m/s) -> jog (3.15 m/s)
    const s = reduced ? 0 : smoothSpeed;
    const wWalk = T.MathUtils.clamp(s / 1.6, 0, 1) * (1 - T.MathUtils.clamp((s - 1.6) / 1.4, 0, 1));
    const wJog = T.MathUtils.clamp((s - 1.6) / 1.4, 0, 1);
    const wIdle = 1 - Math.max(wWalk, wJog);
    actions.Idle?.setEffectiveWeight(wIdle);
    actions.Walk?.setEffectiveWeight(wWalk);
    actions.Jog?.setEffectiveWeight(wJog);
    // keep feet from sliding: playback rate follows speed
    if (actions.Walk) actions.Walk.timeScale = Math.max(.6, s / 1.2);
    if (actions.Jog) actions.Jog.timeScale = Math.max(.7, s / 2.9);
    if (gesture && !gesture.isRunning()) gesture = null;
    if (gesture) { actions.Idle?.setEffectiveWeight(wIdle * .3); }
    mixer.update(reduced ? 0 : dt); base.keep();

    // secondary motion after the clips: head look-at (yaw/pitch limited)
    if (lookTarget && !reduced) {
      root.updateMatrixWorld(true);
      bones.Neck.getWorldPosition(tmp);
      const local = root.worldToLocal(lookTarget.clone()).sub(root.worldToLocal(tmp.clone()));
      const yaw = T.MathUtils.clamp(Math.atan2(-local.x, -local.z), -1.0, 1.0);
      const pitch = T.MathUtils.clamp(Math.atan2(local.y, Math.hypot(local.x, local.z)), -.35, .45);
      headLook.x += (pitch * .8 - headLook.x) * Math.min(1, dt * 5);
      headLook.y += (yaw - headLook.y) * Math.min(1, dt * 5);
    } else { headLook.x *= 1 - Math.min(1, dt * 3); headLook.y *= 1 - Math.min(1, dt * 3); }
    // gaze stabilisation: keep the visor near level even when a clip leans the torso
    root.updateMatrixWorld(true);
    const hf = new T.Vector3(0, 0, -1).applyQuaternion(bones.Head.getWorldQuaternion(q));
    const pitchFix = -Math.asin(T.MathUtils.clamp(hf.y, -1, 1)) * .65;
    q.setFromEuler(e.set(headLook.x + pitchFix, headLook.y * .7, 0)); bones.Head.quaternion.multiply(q);
    q.setFromEuler(e.set(0, headLook.y * .3, 0)); bones.Neck.quaternion.multiply(q);

    // ears: damped springs driven by turning and speed, with an occasional twitch
    const yawNow = root.rotation.y, turn = T.MathUtils.clamp((yawNow - lastYaw) / Math.max(dt, 1e-3), -6, 6); lastYaw = yawNow;
    for (let i = 0; i < 2; i++) {
      const target = -s * .025 + (i ? -1 : 1) * turn * .035 + (Math.sin(t * 1.3 + i) > .985 ? .25 : 0) - feelNow[3] * .9;
      earVel[i] += ((target - earAng[i]) * 90 - earVel[i] * 9) * dt; earAng[i] += earVel[i] * dt;
    }
    if (!reduced) {
      bones.EarR.quaternion.multiply(q.setFromEuler(e.set(earAng[0], 0, -earAng[0] * .3)));
      bones.EarL.quaternion.multiply(q.setFromEuler(e.set(earAng[1], 0, earAng[1] * .3)));
      // scarf trails behind with speed and flutters
      scarfLag.x += ((s * .09) - scarfLag.x) * Math.min(1, dt * 4);
      const flutter = Math.sin(t * (4 + s * 2)) * (.05 + s * .03);
      bones.Scarf1.quaternion.multiply(q.setFromEuler(e.set(scarfLag.x * .5 + flutter * .3, 0, turn * .02)));
      bones.Scarf2.quaternion.multiply(q.setFromEuler(e.set(scarfLag.x * .7 + flutter, 0, 0)));
      bones.Scarf3.quaternion.multiply(q.setFromEuler(e.set(scarfLag.x * .8 + flutter * 1.4, 0, 0)));
    }
    // blink; the slits take the shape of what he feels (his line's, or what the story says), and his
    // lights brighten with his voice (a robot's mouth: the eyes and ear lamps pulse as he talks)
    if (t > blinkAt) { blink = 1; blinkAt = t + 2.2 + Math.random() * 3.5; }
    blink = Math.max(0, blink - dt * 9);
    const cue = faceCue('Zip'), f = ZIP_FEEL[cue?.feel ?? feltZip ?? ''] ?? [0, 0, 0, 0];
    for (let k = 0; k < 4; k++) feelNow[k] += (f[k] - feelNow[k]) * Math.min(1, dt * 6);
    const inf = eyeMesh?.morphTargetInfluences;
    if (inf) { inf[0] = blink > 0 ? Math.sin(blink * Math.PI) : 0; inf[1] = feelNow[0]; inf[2] = feelNow[1]; inf[3] = feelNow[2]; inf[4] = Math.min(1, talkGlow * 1.5); }
    talkGlow += ((cue?.talk ?? 0) - talkGlow) * Math.min(1, dt * 20);
    for (const sk of skins) sk.tick(t, Math.max(talkGlow * 1.2, smoothSpeed / 3.2 * .6, feelNow[0] * .4));
    const open = tickForms(dt); if (!reduced) tickDrift(dt, s < .2);
    light.emissiveIntensity = .8 + talkGlow * 1.1 + open * .9;
  }
  function play(name: string) {
    const a = actions[name]; if (!a) return;
    a.reset(); a.setEffectiveWeight(1); a.fadeIn(.2); a.play(); gesture = a;
  }
  return {
    root, skeleton, bones, mixer, actions, update,
    wave: () => play('Wave'), cheer: () => play('Cheer'),
    lookAt: (w) => { lookTarget = w ? w.clone() : null; },
    /** what he feels, until told otherwise (kit/face-rig.ts names; null: his usual face) */
    feel: (n: string | null) => { feltZip = n; },
    shift, view: (h: number, f: number) => swarm.view(h, f),
    get forms() { return { chest: forms.chest.k, cage: forms.cage.k, wings: forms.wings.k }; },
    useClips(list) {
      // Library clips replace procedural ones with the same name.
      for (const c of list) { const old = actions[c.name]; if (old) { old.stop(); mixer.uncacheAction(old.getClip()); } }
      install(list);
    },
  };
}

// ---------------------------------------------------------------- procedural clips
// Rotations are local Euler offsets from the arms-down rest pose, sampled into
// quaternion tracks. Forward is -Z: +X rotation swings a hanging limb forward.
export function proceduralClips(bones: Record<string, T.Bone>): T.AnimationClip[] {
  const tracks = (dur: number, fps: number, pose: (p: number) => Partial<Record<BoneName, [number, number, number]>>, hipsY?: (p: number) => number) => {
    const n = Math.round(dur * fps) + 1, times = new Float32Array(n);
    const per = new Map<string, number[]>(); const hy: number[] = [];
    for (let i = 0; i < n; i++) {
      const tt = i / (n - 1); times[i] = tt * dur;
      const p = pose(tt);
      for (const [b, r] of Object.entries(p) as [BoneName, [number, number, number]][]) {
        const qq = new T.Quaternion().setFromEuler(new T.Euler(r[0], r[1], r[2]));
        const arr = per.get(b) ?? []; arr.push(qq.x, qq.y, qq.z, qq.w); per.set(b, arr);
      }
      if (hipsY) hy.push(bones.Hips.position.x, bones.Hips.position.y + hipsY(tt), bones.Hips.position.z);
    }
    const out: T.KeyframeTrack[] = [...per].map(([b, v]) => new T.QuaternionKeyframeTrack(`${b}.quaternion`, times, v));
    if (hipsY) out.push(new T.VectorKeyframeTrack('Hips.position', times, hy));
    return out;
  };
  const TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, max = Math.max;
  const armsDown = .06; // arms hang slightly out from the body
  const idle = new T.AnimationClip('Idle', 4, tracks(4, 30, p => {
    const b = sin(p * TAU), b2 = sin(p * TAU * 2);
    return {
      Spine: [b * .015, 0, 0], Chest: [b * .02, b2 * .01, 0], Neck: [-b * .015, 0, 0], Head: [0, sin(p * TAU + 1) * .05, b2 * .015],
      UpperArmR: [.03 + b * .02, 0, armsDown], UpperArmL: [.03 - b * .02, 0, -armsDown],
      LowerArmR: [-.12, 0, 0], LowerArmL: [-.12, 0, 0],
      Hips: [0, 0, sin(p * TAU) * .012],
    };
  }, p => sin(p * TAU * 2) * .006));
  const gait = (name: string, dur: number, amp: number, knee: number, lean: number, bob: number, arm: number, elbow: number) =>
    new T.AnimationClip(name, dur, tracks(dur, 60, p => {
      const a = p * TAU, L = sin(a), R = -L;
      const kneeL = -max(0, sin(a + 1.4)) * knee - .05, kneeR = -max(0, sin(a + Math.PI + 1.4)) * knee - .05;
      return {
        Hips: [0, sin(a) * .08, 0], Spine: [lean * .5, -sin(a) * .06, 0], Chest: [lean * .5, -sin(a) * .1, 0],
        Neck: [-lean * .6, sin(a) * .05, 0], Head: [-lean * .3, sin(a) * .06, 0],
        UpperLegR: [L * amp, 0, 0], UpperLegL: [R * amp, 0, 0],
        LowerLegR: [kneeL, 0, 0], LowerLegL: [kneeR, 0, 0],
        FootR: [-L * amp * .35 - kneeL * .35, 0, 0], FootL: [-R * amp * .35 - kneeR * .35, 0, 0],
        UpperArmR: [R * arm, 0, armsDown + .04], UpperArmL: [L * arm, 0, -armsDown - .04],
        LowerArmR: [elbow + max(0, R) * elbow * .6, 0, 0], LowerArmL: [elbow + max(0, L) * elbow * .6, 0, 0],
      };
    }, p => -Math.abs(cos(p * TAU)) * bob + bob * .5));
  const walk = gait('Walk', 1.0, .42, .75, .06, .03, .38, .25);
  const jog = gait('Jog', .72, .66, 1.25, .2, .06, .7, 1.05);
  const wave = new T.AnimationClip('Wave', 1.9, tracks(1.9, 30, p => {
    const up = p < .15 ? p / .15 : p > .85 ? (1 - p) / .15 : 1, e = up * up * (3 - 2 * up);
    const w = sin(p * TAU * 3) * .45 * e;
    return {
      UpperArmR: [.05 * e, 0, armsDown + e * 2.45], LowerArmR: [0, 0, w + e * .25], HandR: [0, 0, w * .4],
      Chest: [0, e * .08, -e * .04], Head: [0, e * .12, e * .1],
    };
  }));
  const cheer = new T.AnimationClip('Cheer', 1.4, tracks(1.4, 30, p => {
    const up = p < .2 ? p / .2 : p > .8 ? (1 - p) / .2 : 1, e = up * up * (3 - 2 * up), hop = sin(p * TAU * 2);
    return {
      UpperArmR: [0, 0, armsDown + e * 2.7], UpperArmL: [0, 0, -armsDown - e * 2.7],
      LowerArmR: [0, 0, e * .3], LowerArmL: [0, 0, -e * .3], Chest: [-e * .12, 0, 0], Head: [-e * .15, 0, 0],
      UpperLegR: [max(0, hop) * .2 * e, 0, 0], UpperLegL: [max(0, hop) * .2 * e, 0, 0],
      LowerLegR: [-max(0, hop) * .4 * e, 0, 0], LowerLegL: [-max(0, hop) * .4 * e, 0, 0],
    };
  }, p => Math.max(0, sin(p * Math.PI * 4)) * .07 * (p > .15 && p < .85 ? 1 : 0)));
  return [idle, walk, jog, wave, cheer];
}

// Library clips baked for Zip's skeleton by tools/bake-ual.js (Quaternius UAL, CC0).
export async function loadBakedClips(url: string): Promise<T.AnimationClip[]> {
  const res = await fetch(url); if (!res.ok) throw Error(`clips unavailable (${res.status})`);
  const data = await res.json() as { clips: { name: string, duration: number, fps: number, tracks: Record<string, number[]>, hips: number[] }[] };
  return data.clips.map(c => {
    const n = c.hips.length / 3, times = new Float32Array(n);
    for (let i = 0; i < n; i++) times[i] = Math.min(c.duration, i / c.fps);
    const tracks: T.KeyframeTrack[] = Object.entries(c.tracks).map(([bone, q]) => new T.QuaternionKeyframeTrack(`${bone}.quaternion`, times, q));
    tracks.push(new T.VectorKeyframeTrack('Hips.position', times, c.hips));
    return new T.AnimationClip(c.name, c.duration, tracks);
  });
}
