import * as T from 'three';

// Things left off the beaten path for a player who goes looking: each a mote of light with a thin
// beam above it, seen from afar, taken by walking into it. Found ones are kept in this browser
// (one key per game) and stay found across checkpoints; a new run starts them over.
// Game-agnostic: the game gives where they are, their colour, and what finding one does.
// Blind run 27 (an explorer): "a pretty corridor… nothing found off the path".

export interface FindSpec { id: string; at: [number, number]; y?: number }
interface Opts {
  specs: FindSpec[];
  /** localStorage key for the ids found */
  key: string;
  color?: string;
  /** how close counts as touching it (metres, on the ground plane) */
  reach?: number;
  onFind: (spec: FindSpec, count: number, total: number) => void;
  /** the view, so a beam keeps a steady width on screen: a thread far off, never a wall up close */
  camera: T.Camera;
}

let glowTex: T.CanvasTexture | null = null;
const glow = () => {
  if (glowTex) return glowTex;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d')!;
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64); glowTex = new T.CanvasTexture(cv); glowTex.colorSpace = T.SRGBColorSpace; return glowTex;
};
// a beam that fades out upwards
const beamTex = () => {
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 64; const c = cv.getContext('2d')!;
  const g = c.createLinearGradient(0, 64, 0, 0); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.35, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 4, 64); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return t;
};

export function buildFinds(scene: T.Scene, o: Opts) {
  const color = new T.Color(o.color ?? '#ffd36b'), reach = o.reach ?? 1.0;
  const read = (): string[] => { try { return JSON.parse(localStorage.getItem(o.key) || '[]'); } catch { return []; } };
  const write = (ids: string[]) => { try { localStorage.setItem(o.key, JSON.stringify(ids)); } catch { /* no storage */ } };
  const found = new Set(read());
  const root = new T.Group(); root.name = 'finds'; scene.add(root);
  const coreMat = new T.SpriteMaterial({ map: glow(), color, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false });
  const haloMat = new T.SpriteMaterial({ map: glow(), color, transparent: true, opacity: .35, depthWrite: false, blending: T.AdditiveBlending, fog: false });
  const bt = beamTex(), beamGeo = new T.PlaneGeometry(1, 9); beamGeo.translate(0, 4.5, 0);
  const beamMat = new T.MeshBasicMaterial({ map: bt, color: color.clone().lerp(new T.Color('#fff4d0'), .3), transparent: true, opacity: .85, depthWrite: false, side: T.DoubleSide, fog: false });
  const items = o.specs.map((s, i) => {
    const g = new T.Group(); g.position.set(s.at[0], s.y ?? .13, s.at[1]); root.add(g);
    const core = new T.Sprite(coreMat); core.scale.setScalar(.38); core.position.y = 1; g.add(core);
    const halo = new T.Sprite(haloMat); halo.scale.setScalar(1.3); halo.position.y = 1; g.add(halo);
    const beam = new T.Mesh(beamGeo, beamMat); beam.position.y = 1; g.add(beam);
    // a few motes circling it
    const motes = Array.from({ length: 3 }, () => { const m = new T.Sprite(coreMat); m.scale.setScalar(.09); g.add(m); return m; });
    g.visible = !found.has(s.id);
    return { s, g, core, halo, motes, beam, ph: i * 1.7, burst: -1 };
  });
  let t = 0; const cam = new T.Vector3();
  return {
    root,
    get count() { return found.size; },
    get total() { return o.specs.length; },
    has: (id: string) => found.has(id),
    /** forget every find (a new run) */
    clear() { found.clear(); write([]); for (const it of items) { it.g.visible = true; it.burst = -1; it.g.scale.setScalar(1); } },
    /** for tests: where the ones not yet found are */
    get open() { return items.filter(i => !found.has(i.s.id)).map(i => ({ id: i.s.id, at: i.s.at, y: i.s.y ?? .13 })); },
    tick(dt: number, player: T.Vector3 | null, canTake: boolean) {
      t += dt; o.camera.getWorldPosition(cam);
      for (const it of items) {
        if (!it.g.visible) continue;
        // the beam turns to face the view and keeps about two pixels' width at any distance; close by
        // it thins away so it never fills the screen
        const d = Math.hypot(cam.x - it.g.position.x, cam.z - it.g.position.z);
        it.beam.rotation.y = Math.atan2(cam.x - it.g.position.x, cam.z - it.g.position.z); it.beam.scale.x = Math.max(.04, d * .0065);
        it.beam.visible = d > 3; 
        if (it.burst >= 0) {   // taken: it swells and fades upward
          it.burst += dt; const k = it.burst / .6; it.g.scale.setScalar(1 + k * 1.5); it.core.position.y = 1 + k * 1.5;
          if (k >= 1) it.g.visible = false; continue;
        }
        const b = Math.sin(t * 2 + it.ph); it.core.position.y = 1 + b * .12; it.halo.position.y = it.core.position.y; it.halo.scale.setScalar(1.15 + .2 * Math.sin(t * 3.1 + it.ph));
        it.motes.forEach((m, j) => { const a = t * 1.4 + j * 2.1 + it.ph; m.position.set(Math.cos(a) * .45, 1 + Math.sin(t * 2.3 + j) * .3, Math.sin(a) * .45); });
        if (canTake && player && Math.hypot(player.x - it.s.at[0], player.z - it.s.at[1]) < reach && Math.abs(player.y - (it.s.y ?? .13)) < 2) {
          found.add(it.s.id); write([...found]); it.burst = 0;
          o.onFind(it.s, found.size, o.specs.length);
        }
      }
    },
  };
}
