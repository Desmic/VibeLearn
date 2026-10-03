import * as T from 'three';
import type { Guide } from './guide';
import { sfx } from './sfx';
import { HOLO, beam, faceCamera, glyph, holoMaterial, setHolo, sparks } from './kit/holo';
import type { WordSource } from './worlds/first-words-echo';

// The Echo power: Zip pulls words out of the world. A glowing word hangs over
// whoever said it (or whatever bears it). Walk close and press Absorb, or tap a
// word you can see from up to REACH_TAP metres away: a beam reaches out, the
// word streams into Zip's chest coil and joins the little orbit of words
// circling him. Whether a word may be absorbed is the station's rules' call.

const REACH_TAP = 14, CALL_OUT = 9;

interface Opts {
  guide: Guide; camera: T.Camera; zip: () => T.Vector3;
  sources: WordSource[];
  /** named scene objects a source can follow (e.g. 'skiff') */
  follow?: Record<string, () => T.Vector3 | null>;
  /** ask the rules; true if the word was absorbed */
  absorb: (word: string) => boolean;
  onAbsorbed?: (word: string, source: WordSource) => void;
}

export function buildEcho(scene: T.Scene, o: Opts) {
  const g = o.guide, root = new T.Group(); root.name = 'echo'; root.visible = false; scene.add(root);
  const fx = sparks(root, 40);
  const motes = o.sources.map((s, i) => {
    const grp = new T.Group(); root.add(grp);
    const word = glyph(s.word, { height: .4, color: HOLO.found, frame: true, intensity: 1.9 }); grp.add(word);
    const halo = new T.Mesh(new T.TorusGeometry(.55, .016, 6, 40), holoMaterial({ color: HOLO.found, opacity: .7, scan: 0 })); halo.rotation.x = Math.PI / 2; halo.position.y = -.34; grp.add(halo);
    // a pillar of light into the sky, so words can be spotted from across town
    const pillar = beam({ color: HOLO.found, radius: .035, flow: true }); setHolo(pillar.mesh.material as T.Material, { opacity: .35 }); root.add(pillar.mesh);
    const shaft = beam({ color: HOLO.found, radius: .012, flow: true }); root.add(shaft.mesh);
    const hit = new T.Mesh(new T.SphereGeometry(.85, 8, 6), new T.MeshBasicMaterial({ visible: false })); grp.add(hit);
    // words are hidden by walls like anything else; their light pillar rises above roofs to show where they are
    for (const x of [word, halo]) x.renderOrder = 20;
    return { s, grp, word, halo, shaft, pillar, hit, taken: false, called: false, phase: i * 1.7, base: new T.Vector3() };
  });
  // the orbit: words Zip carries, circling his chest
  const orbit: { word: string; m: T.Mesh; a: number }[] = [];
  const reach = beam({ color: HOLO.found, radius: .03, flow: true }); reach.mesh.visible = false; root.add(reach.mesh);
  let flying: { m: T.Mesh; from: T.Vector3; t: number; word: string; src: WordSource } | null = null;
  let enabled = false, orbitShown = true, t = 0;
  const chest = new T.Vector3(), tmp = new T.Vector3();

  const where = (m: typeof motes[number]) => {
    const f = m.s.on ? o.follow?.[m.s.on]?.() : null;
    return f ? m.base.set(f.x, f.y + (m.s.y - 3.6), f.z) : m.base.set(m.s.at[0], m.s.y, m.s.at[1]);
  };
  const take = (m: typeof motes[number]) => {
    if (m.taken || flying || !o.absorb(m.s.word)) return false;
    m.taken = true; m.grp.visible = false; m.shaft.mesh.visible = false; m.pillar.mesh.visible = false;
    const w = glyph(m.s.word, { height: .3, color: HOLO.found }); w.position.copy(where(m)); root.add(w);
    flying = { m: w, from: w.position.clone(), t: 0, word: m.s.word, src: m.s };
    reach.mesh.visible = true; sfx.whoosh(); fx.burst(w.position, 14, 1.8, HOLO.found);
    g.label('echo-line', null);
    return true;
  };
  const untap = g.onTap(ray => {
    if (!enabled || flying) return false;
    const hits = ray.intersectObjects(motes.filter(m => !m.taken).map(m => m.hit), false);
    const m = motes.find(x => x.hit === hits[0]?.object); if (!m) return false;
    const z = o.zip(), p = where(m);
    if (Math.hypot(p.x - z.x, p.z - z.z) > REACH_TAP) { g.toast(`Too far to hear “${m.s.word}”. Walk closer!`, 1400); return true; }
    return take(m);
  });

  return {
    get enabled() { return enabled; },
    /** words Zip carries, in the order he found them */
    get carried() { return orbit.map(x => x.word); },
    get flying() { return !!flying; },
    enable(v = true) { enabled = v; root.visible = v; if (!v) g.label('echo-line', null); },
    /** show or hide the little orbit (hidden while the engine is open) */
    showOrbit(v: boolean) { orbitShown = v; },
    /** give Zip a word without a source (restoring a save, or a generated word) */
    carry(word: string) { if (orbit.some(x => x.word === word)) return; const m = glyph(word, { height: .14, color: MADE.has(word) ? HOLO.made : HOLO.found }); root.add(m); orbit.push({ word, m, a: orbit.length * 1.3 }); },
    markTaken(word: string) { for (const m of motes) if (m.s.word === word) { m.taken = true; m.grp.visible = m.shaft.mesh.visible = m.pillar.mesh.visible = false; } },
    /** the nearest unabsorbed source (for the goal beacon) */
    nearest(z: T.Vector3, only?: string[]) {
      let best: T.Vector3 | null = null, bd = 1e9;
      for (const m of motes) { if (m.taken || (only && !only.includes(m.s.word))) continue; const p = where(m), d = Math.hypot(p.x - z.x, p.z - z.z); if (d < bd) { bd = d; best = p.clone().setY(p.y - .6); } }
      return best;
    },
    /** the one-button action for a source in reach, if any */
    action(z: T.Vector3): { label: string; use: () => void; at: T.Vector3 } | null {
      if (!enabled || flying) return null;
      let near: typeof motes[number] | null = null, nd = 1e9;
      for (const m of motes) { if (m.taken) continue; const p = where(m), d = Math.hypot(p.x - z.x, p.z - z.z); if (d < m.s.reach && d < nd) { nd = d; near = m; } }
      if (!near) { g.label('echo-line', null); return null; }
      const p = where(near); g.label('echo-line', near.s.line, tmp.copy(p).setY(p.y + .45));
      const m = near; return { label: `Absorb “${m.s.word}”`, use: () => { take(m); }, at: m.grp.position };
    },
    tick(dt: number) {
      t += dt; fx.tick(dt);
      const z = o.zip(); chest.copy(z).setY(z.y + 1.0);
      for (const m of motes) {
        if (m.taken) continue;
        const p = where(m); m.grp.position.set(p.x, p.y + Math.sin(t * 1.6 + m.phase) * .07, p.z); faceCamera(m.grp, o.camera);
        m.halo.rotation.z = t * .6; m.halo.scale.setScalar(1 + .08 * Math.sin(t * 3 + m.phase));
        const d = Math.hypot(p.x - z.x, p.z - z.z), near = d < m.s.reach;
        // the first time Zip comes within earshot, the word calls out: a soft chime and a glint
        if (!m.called && d < CALL_OUT) { m.called = true; sfx.bell(motes.indexOf(m) + 2, .35); fx.burst(p, 10, 1.1, HOLO.found); }
        setHolo(m.word.material as T.Material, { intensity: near ? 2.4 : 1.8 });
        // far words grow so they stay readable; near ones pulse to say "take me"
        // ...and step aside when the camera swings right up to them (a word filling the lens reads as a glitch)
        const lens = T.MathUtils.smoothstep(m.grp.position.distanceTo(o.camera.position), .9, 2.4);
        m.grp.scale.setScalar(Math.max(1, Math.min(2.2, d / 5)) * (near ? 1 + .06 * Math.sin(t * 6) : 1) * Math.max(.001, lens)); m.grp.visible = lens > .02;
        m.pillar.set(tmp.set(p.x, p.y + .3, p.z), new T.Vector3(p.x, p.y + 9, p.z), .03);
        m.shaft.set(tmp.set(p.x, p.y - .4, p.z), new T.Vector3(p.x, m.s.on ? p.y - 1.4 : p.y - 2.0, p.z), .01);
      }
      if (flying) {
        flying.t = Math.min(1, flying.t + dt / .75); const k = flying.t * flying.t * (3 - 2 * flying.t);
        flying.m.position.lerpVectors(flying.from, chest, k); flying.m.position.y += Math.sin(k * Math.PI) * .6; flying.m.scale.setScalar(1 - k * .6); faceCamera(flying.m, o.camera);
        reach.set(chest, flying.m.position, .03 * (1 - k * .5));
        if (flying.t >= 1) {
          root.remove(flying.m); reach.mesh.visible = false; fx.burst(chest, 16, 1.4, HOLO.found); sfx.catch(); sfx.chime();
          const done = flying; flying = null;
          const m = glyph(done.word, { height: .14, color: HOLO.found }); root.add(m); orbit.push({ word: done.word, m, a: orbit.length * 1.3 });
          o.onAbsorbed?.(done.word, done.src);
        }
      }
      orbit.forEach((w, i) => {
        w.m.visible = orbitShown && root.visible;
        const a = t * .9 + i * (Math.PI * 2 / Math.max(1, orbit.length));
        w.m.position.set(z.x + Math.cos(a) * .62, z.y + 1.25 + Math.sin(t * 2 + i) * .06, z.z + Math.sin(a) * .62); faceCamera(w.m, o.camera);
      });
    },
    dispose() { untap(); },
  };
}
const MADE = new Set(['Blossom', 'Isle']);
