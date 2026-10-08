import * as T from 'three';
import type { Guide } from './guide';
import { sfx } from './sfx';
import { HOLO, glyph, holoMaterial, sparks, faceCamera } from './kit/holo';
import { speak, lineFor, type Made, type UtterSpec } from './kit/utter';
import { pickTarget } from './kit/target';
import { createWordRing } from './kit/word-ring';
import { createNgram, type NgramLabSpec } from './kit/ngram';
import { buildEcho } from './echo';
import type { WordSource } from './worlds/first-words-echo';

// The utterance test area (`lab=utter`): Zip pulls words out of the world (Echo), then says
// things into existence with them to cross two gaps and light a doorway. Off the story path, to
// judge whether the mechanic is good enough to become the game's core (docs/UTTER-DESIGN.md).
// The kit (kit/utter.ts) decides what a phrase makes and whether it works; this file shows it:
// the thing weaves in as a hologram, turns solid, and then works or fails, each failure in its
// own way (a short bridge tips into the sky, a noodle droops and flops, a bean bounces off).
// Placeholder shapes stand in for authored models (a catalogue of Blender props comes later).
// Everything runs on game time (tick), so tests can fast-forward it.

const Z = -40, X0 = 60, R0 = 3;   // the platforms sit in open sky, far from the town
interface Opts {
  guide: Guide; host: HTMLElement; camera: T.Camera; zip: () => T.Vector3;
  addWalk: (x: number, z: number, r: number) => void;
  teleport: (x: number, z: number) => void;
  /** turn the follow camera (radians, the game's yaw) */
  setYaw: (y: number) => void;
  /** turn the follow camera there smoothly, over a second or so (default: setYaw) */
  turnTo?: (y: number) => void;
  spec: UtterSpec; sources: WordSource[];
  /** a variant of the test area, to compare designs (lab=utter-b) */
  variant?: LabVariant;
}
export interface LabVariant {
  /** platform radius (bigger platforms: fewer edges to bump into) */
  radius?: number;
  /** after a phrase fails at a place, the ring opens with it again, so fixing it means editing it */
  remember?: boolean;
  /** the place label on each platform */
  places?: string[];
  /** said once, after the first phrase that doesn't work */
  firstFail?: string;
  /** the end summary waits for a tap instead of carrying on by itself */
  summaryStays?: boolean;
  /** Zip's first lines on arrival (default: the variant-A pair) */
  intro?: string[];
  /** how far behind the first place to speak Zip starts (default 1.8 m) */
  spawnBack?: number;
  /** how close to a place Zip must be to speak there (default 2.2 m) */
  speakReach?: number;
  /** opening the ring cuts to a shot of Zip from the front (default true). Off, the follow camera
   *  stays put: run 11's tester felt every cut as "the camera swinging around" */
  ringShot?: boolean;
  /** how far away a word can be tapped (default: Echo's 14 m). Keep it under the gap to the next
   *  platform, so each place's words are read there (a tester took the next place's word from
   *  across the gap, run 10) */
  reachTap?: number;
  /** a next-word engine (lab=ngram): Zip picks the first word, the engine suggests the rest from
   *  what it has read, and every word source he absorbs is read into it (kit/ngram.ts) */
  ngram?: NgramLabSpec;
}
type Site = { s: UtterSpec['sites'][number]; at: T.Vector3; from: T.Vector3; solved: boolean; crossed?: boolean };

export function buildUtterLab(scene: T.Scene, o: Opts) {
  const g = o.guide, spec = o.spec, root = new T.Group(); root.name = 'utter-lab'; scene.add(root);
  const V = o.variant ?? {}, R = V.radius ?? R0;
  const lastSaid = new Map<string, string[]>(), preloaded = new Set<string>();   // the last phrase that failed at each place (V.remember)
  const fx = sparks(root, 48);
  const mat = (c: string, extra: Partial<T.MeshStandardMaterialParameters> = {}) => new T.MeshStandardMaterial({ color: c, roughness: .85, ...extra });
  let clock = 0; const queue: { t: number; fn: () => void }[] = [];
  const later = (sec: number, fn: () => void) => queue.push({ t: clock + sec, fn });

  // ── the place: three discs of painted stone in open sky ──
  const gaps = [3.4, 7];
  const centres = [X0, X0 + 2 * R + gaps[0], X0 + 4 * R + gaps[0] + gaps[1]];
  for (const cx of centres) {
    const top = new T.Mesh(new T.CylinderGeometry(R, R * .92, .5, 40), mat('#e9dcc2')); top.position.set(cx, -.25, Z); root.add(top);
    const rock = new T.Mesh(new T.ConeGeometry(R * .9, 4.5, 9), mat('#8a7a68', { flatShading: true })); rock.rotation.x = Math.PI; rock.position.set(cx, -2.75, Z); root.add(rock);
    const grass = new T.Mesh(new T.CylinderGeometry(R * .97, R * .97, .04, 40), mat('#9cc58a')); grass.position.set(cx, .01, Z); root.add(grass);
    o.addWalk(cx, Z, R);
  }
  // the dark doorway on the last platform
  const door = new T.Group(); door.position.set(centres[2] + 1.6, 0, Z); root.add(door);
  for (const s of [-1, 1]) { const p = new T.Mesh(new T.BoxGeometry(.35, 2.4, .35), mat('#cbb89a')); p.position.set(0, 1.2, s * .9); door.add(p); }
  const lintel = new T.Mesh(new T.BoxGeometry(.4, .35, 2.2), mat('#cbb89a')); lintel.position.set(0, 2.5, 0); door.add(lintel);
  const shadow = new T.Mesh(new T.PlaneGeometry(1.5, 2.3), new T.MeshBasicMaterial({ color: '#0b0f1a', transparent: true, opacity: .92 })); shadow.rotation.y = -Math.PI / 2; shadow.position.set(.05, 1.15, 0); door.add(shadow);
  const doorLight = new T.PointLight('#ffcf7a', 0, 6); doorLight.position.set(-.6, 1.6, 0); door.add(doorLight);
  // what the dark was hiding: a new word, gold, for later (a teaser of the next power)
  const secret = glyph('sky', { height: .5, color: HOLO.made, frame: true, intensity: 2.4 }); secret.position.set(.9, 1.4, 0); secret.visible = false; door.add(secret);

  // ── the words' homes: signs and things (the Echo motes hang over them) ──
  for (const src of o.sources) {
    const at = new T.Vector3(src.at[0], 0, src.at[1]), grp = new T.Group(); grp.position.copy(at); root.add(grp);
    if (src.kind === 'sign') {
      const h = Math.max(.6, src.y - .6);
      const post = new T.Mesh(new T.CylinderGeometry(.05, .06, h, 6), mat('#6b4a2e')); post.position.y = h / 2; grp.add(post);
      const board = new T.Mesh(new T.BoxGeometry(.7, .4, .06), mat('#e8d6b0')); board.position.y = h; board.lookAt(new T.Vector3(X0, h, Z).sub(at).setY(0).add(new T.Vector3(0, h, 0))); grp.add(board);
    } else if (src.id === 'plank-pile') for (let i = 0; i < 3; i++) { const p = new T.Mesh(new T.BoxGeometry(1.1, .08, .26), mat('#b07a4a')); p.position.set(0, .05 + i * .09, i * .05 - .05); p.rotation.y = i * .2; grp.add(p); }
    else if (src.id === 'rope-coil') { const r = new T.Mesh(new T.TorusGeometry(.28, .07, 6, 16), mat('#c8a46a')); r.rotation.x = Math.PI / 2; r.position.y = .08; grp.add(r); }
    else if (src.id === 'jelly-jar') { const j = new T.Mesh(new T.CylinderGeometry(.18, .18, .4, 12), mat('#ff8fb8', { transparent: true, opacity: .8, roughness: .2 })); j.position.y = .2; grp.add(j); }
    else if (src.id === 'stone') { const s = new T.Mesh(new T.DodecahedronGeometry(.4), mat('#a9a39a', { flatShading: true })); s.position.y = .3; grp.add(s); }
  }
  let firstWord = true;
  // the next-word engine (lab=ngram): it starts with its own reading, then reads every sign Zip absorbs
  const NG = V.ngram, engine = NG ? createNgram(NG.n) : null, read = new Set<string>();
  NG?.pretrain.forEach(t => engine!.read(t));
  const starts = new Set(o.sources.map(x => x.word.toLowerCase()));
  const quote = (pairs: { pair: string[]; count: number }[]) => pairs.map(p => `“${p.pair.join(' ')}”${p.count > 1 ? ` ×${p.count}` : ''}`).join(' and ');
  const echo = buildEcho(scene, { guide: g, camera: o.camera, zip: o.zip, sources: o.sources, absorb: () => true, reachTap: V.reachTap,
    canTap: () => !busy && !ring.isOpen,   // not while a made thing is being shown (a tap then read as its cause, run 10)
    onAbsorbed: (w, src) => {
      if (engine) {   // what it learned, said as the pairs that start with a word Zip can start from
        const fav = (a: string) => engine.suggest([a], 1, 1)[0]?.word;
        const before = new Map([...starts].map(a => [a, fav(a)]));
        const learned = engine.read(src.line); read.add(src.id);
        const mine = learned.filter(p => starts.has(p.pair[0])).slice(0, 2);
        // when reading changes what it likes best after a word, say so: that is the lesson of frequency
        const won = learned.find(p => starts.has(p.pair[0]) && before.get(p.pair[0]) !== p.pair[1] && fav(p.pair[0]) === p.pair[1]);
        const line = (spec.lines.read ?? 'Read it.').replace('{pairs}', quote(mine.length ? mine : learned.slice(0, 1)))
          + (won && before.get(won.pair[0]) && spec.lines.favourite ? ' ' + spec.lines.favourite.replace('{word}', won.pair[1]).replace('{after}', won.pair[0]).replace('{was}', before.get(won.pair[0])!) : '');
        later(.6, () => g.bark('Zip', line)); firstWord = false; return;   // on screen as long as its length needs (run 12: too fast to read)
      }
      if (spec.lexicon[w]) later(.6, () => g.bark('Zip', firstWord ? `“${w}.” A word I can use.` : `Got “${w}”.`, 1.8)); firstWord = false;
    } });
  echo.enable(true);

  // where each place is spoken from (a step back from the edge), and where its thing appears
  const edge = (i: number) => new T.Vector3(centres[i] + R - .4, 0, Z);
  const sites: Site[] = spec.sites.map((s, i) => { const at = i < 2 ? edge(i) : new T.Vector3(centres[2] + 1.35, 0, Z); return { s, at, from: at.clone().add(new T.Vector3(-1.8, 0, 0)), solved: false }; });
  // how far the place needs a thing to reach: a faint dotted line, so a short bridge is seen to fall short
  for (const x of sites) if (x.s.need.archetype === 'span') for (let d = 0; d <= x.s.need.length; d += .35) {
    const dot = new T.Mesh(new T.SphereGeometry(.035, 6, 4), holoMaterial({ color: HOLO.found, opacity: .55, intensity: 1.6, scan: 0 })); dot.position.set(x.at.x + d, .05, Z); root.add(dot);
  }
  // where to stand to speak: a soft gold ring on the ground (the current place's only)
  const rings = sites.map(x => { const r = new T.Mesh(new T.TorusGeometry(.7, .03, 6, 40), holoMaterial({ color: HOLO.made, opacity: .7, intensity: 1.8, scan: 0 })); r.rotation.x = Math.PI / 2; r.position.copy(x.from).setY(.06); r.visible = false; root.add(r); return r; });
  const signs = sites.map(x => { const m = glyph(x.s.asks, { height: .26, color: HOLO.found, frame: true, intensity: 1.6 }); m.position.copy(x.at).add(new T.Vector3(0, 2.1, 0)); root.add(m); return m; });

  // ── the thing: a placeholder shape per look; spans are built in segments so they can bend ──
  const build = (m: Made): { grp: T.Group; segs: T.Object3D[] } => {
    const grp = new T.Group(), segs: T.Object3D[] = [], L = m.size;
    const c = m.material === 'jelly' ? '#ff8fb8' : m.material === 'stone' ? '#a9a39a' : m.material === 'paper' ? '#f6f1e6' : m.material === 'rope' ? '#c8a46a' : '#b07a4a';
    const extra = m.material === 'jelly' ? { transparent: true, opacity: .82, roughness: .25 } : m.material === 'stone' ? { flatShading: true } : {};
    const look = m.thing ? spec.things[m.thing].look : '';
    if (look === 'noodle') {
      for (let x = 0; x < L; x += .18) { const n = new T.Mesh(new T.SphereGeometry(.11, 8, 6), mat('#f3d27a', { roughness: .4 })); n.scale.set(1.3, 1, 1); n.position.set(x + .09, 0, 0); grp.add(n); segs.push(n); }
    } else if (look === 'bridge' || look === 'plank') {
      const w = look === 'plank' ? .5 : 1.1, thick = m.material === 'paper' ? .02 : .08;
      for (let x = 0; x < L - .05; x += .32) { const p = new T.Mesh(new T.BoxGeometry(.28, thick, w), mat(c, extra)); p.position.set(x + .15, -.04, 0); grp.add(p); segs.push(p); }
      // rails are posts per segment, so they bend with the deck
      if (look === 'bridge' && L > .5) for (const seg of [...segs]) for (const s of [-1, 1]) { const post = new T.Mesh(new T.BoxGeometry(.05, .45, .05), mat(c, extra)); post.position.set(0, .22, s * w / 2); seg.add(post); }
    } else if (look === 'lantern') {
      const k = Math.max(.15, Math.min(2.5, L)), h = 1.1 * Math.min(1.6, k);
      const body = new T.Mesh(new T.CylinderGeometry(.2 * k, .26 * k, .55 * k, 8), mat('#ffd36b', { emissive: '#ffb84a', emissiveIntensity: 1.2 * Math.min(1, L) }));
      if (m.material === 'stone') (body.material as T.MeshStandardMaterial).color.set('#a9a39a'); body.position.y = h; body.name = 'glow'; grp.add(body);
      const pole = new T.Mesh(new T.CylinderGeometry(.03, .03, h, 6), mat('#4a3a2a')); pole.position.y = h / 2; grp.add(pole);
      const light = new T.PointLight('#ffcf7a', 0, 4 * Math.min(2, k)); light.position.y = h; light.name = 'light'; grp.add(light);
    } else if (look === 'rope') { const r = new T.Mesh(new T.TorusGeometry(.3, .07, 6, 16), mat('#c8a46a')); r.rotation.x = Math.PI / 2; r.position.y = .07; grp.add(r); }
    else if (look === 'bean') { const b = new T.Mesh(new T.SphereGeometry(.35, 12, 8), mat('#ff6f91', { transparent: true, opacity: .88, roughness: .25 })); b.scale.set(1.4, .9, .9); b.position.y = .35; grp.add(b); }
    else if (look === 'plane') { const p = new T.Mesh(new T.ConeGeometry(.35, 1, 3), mat('#f6f1e6', { flatShading: true })); p.rotation.z = -Math.PI / 2; p.position.y = .9; grp.add(p); }
    else if (look === 'stone') { const st = new T.Mesh(new T.DodecahedronGeometry(.45), mat(m.material === 'jelly' ? '#ff8fb8' : '#a9a39a', m.material === 'jelly' ? { transparent: true, opacity: .82, roughness: .25 } : { flatShading: true })); st.position.y = .4; grp.add(st); }
    else if (look === 'wall') { const w = new T.Mesh(new T.BoxGeometry(.4, 1.2, 1.8), mat('#a9a39a', { flatShading: true })); w.position.y = .6; grp.add(w); }
    return { grp, segs };
  };

  // ── weaving in, then the outcome, played out ──
  type Live = { grp: T.Group; ghost: T.Group; segs: T.Object3D[]; t: number; m: Made; site: Site; done: boolean; play: (t: number, dt: number) => boolean };
  const live: Live[] = [];
  const WEAVE = .9;   // seconds of hologram before the thing is solid
  const outcome = (m: Made, site: Site, grp: T.Group, segs: T.Object3D[]): Live['play'] => {
    const span = site.s.need.archetype === 'span', L = m.size, look = m.thing ? spec.things[m.thing].look : '';
    const base = segs.map(s => s.position.clone());
    const sag = (amount: number, wob = 0) => segs.forEach((s, i) => { const u = base[i].x / Math.max(.01, L); s.position.y = base[i].y - amount * 4 * u * (1 - u) + wob * Math.sin(u * 9 + clock * 14) * .03; s.rotation.z = -amount * 4 * (1 - 2 * u) / Math.max(1, L) * .9; });
    const fadeOut = (k: number) => grp.traverse(x => { const me = x as T.Mesh; if (me.isMesh) { const mm = me.material as T.MeshStandardMaterial; mm.transparent = true; mm.opacity = Math.min(mm.opacity, 1 - k); } });
    let cue = 0;
    const once = (n: number, fn: () => void) => { if (cue < n) { cue = n; fn(); } };
    switch (m.reason) {
      case 'works': return t => {
        once(1, () => { sfx.chime(); fx.burst(site.at.clone().setY(.3), 20, 1.8, HOLO.made); });
        if (span) { const k = Math.min(1, t / .5); grp.position.y = site.at.y + (1 - k) * .25 - Math.sin(k * Math.PI) * .06; if (m.material === 'jelly') sag(.12 * Math.exp(-t * 1.5) * Math.sin(t * 10)); }
        else {
          const lt = grp.getObjectByName('light') as T.PointLight; lt.intensity = Math.min(3 * L, t * 4 * L); doorLight.intensity = Math.min(3.5, t * 5); (shadow.material as T.MeshBasicMaterial).opacity = Math.max(.15, .92 - t);
          if (t > .6) once(2, () => { secret.visible = true; fx.burst(door.localToWorld(new T.Vector3(.9, 1.4, 0)), 24, 2, HOLO.made); sfx.star(2); later(3.6, () => g.bark('Zip', 'A new word in the dark: “sky”. Saving that one.', 3.4)); });
        }
        return t > 1.2;
      };
      case 'too-short': return t => {
        // it reaches out, stops short, wobbles, then tips into the sky
        once(1, () => sfx.hmm());
        if (t > .8) { once(2, () => sfx.boing()); const k = t - .8; grp.rotation.z = -Math.min(1.4, k * k * 2.2); grp.position.y = site.at.y - Math.max(0, k - .4) ** 2 * 6; }
        else grp.rotation.z = Math.sin(t * 18) * .03 * (1 - t);
        if (t > 2) fadeOut((t - 2) / .6);
        return t > 2.6;
      };
      case 'too-weak': return t => {
        // it looks fine; then it droops like overcooked pasta, and flops into the sky
        if (t > .5) { once(1, () => sfx.whisper()); sag(Math.min(1.6, (t - .5) ** 2 * 1.4), 1); }
        if (t > 1.9) { once(2, () => sfx.boing()); grp.position.y = site.at.y - (t - 1.9) ** 2 * 7; }
        if (t > 2.4) fadeOut((t - 2.4) / .6);
        return t > 3;
      };
      case 'wrong-way': return t => {
        // a perfect bridge over the platform you're standing on; it hangs there, then shrugs off
        once(1, () => sfx.hmm());
        if (t > 1.6) { once(2, () => sfx.pop()); const k = (t - 1.6) / .5; grp.scale.setScalar(Math.max(.01, 1 - k)); }
        return t > 2.1;
      };
      case 'too-dim': return t => {
        const lt = grp.getObjectByName('light') as T.PointLight, glow = grp.getObjectByName('glow') as T.Mesh;
        lt.intensity = t < 1.4 ? .25 * (Math.random() < .25 ? 0 : 1) : 0;
        (glow.material as T.MeshStandardMaterial).emissiveIntensity = t < 1.4 ? .3 : 0;
        if (t > 1.4) once(1, () => sfx.pop());
        if (t > 1.8) fadeOut((t - 1.8) / .5);
        return t > 2.3;
      };
      default: return t => {
        // the wrong kind of thing: each leaves in character
        if (look === 'bean') { once(1, () => sfx.boing()); grp.position.y = site.at.y + Math.abs(Math.sin(t * 7)) * .8 * Math.max(0, 1 - t / 2.2); grp.position.x = site.at.x + t * .6; }
        else if (look === 'plane') { once(1, () => sfx.whoosh()); const a = t * 2.2; grp.position.set(site.at.x + Math.sin(a) * 2 + t * 1.5, site.at.y + 1 + t * .8, Z + Math.cos(a) * 1.5 - 1.5); grp.rotation.y = -a; }
        else if (look === 'stone') { const st = new T.Mesh(new T.DodecahedronGeometry(.45), mat(m.material === 'jelly' ? '#ff8fb8' : '#a9a39a', m.material === 'jelly' ? { transparent: true, opacity: .82, roughness: .25 } : { flatShading: true })); st.position.y = .4; grp.add(st); }
    else if (look === 'wall') { once(1, () => sfx.thud()); grp.position.y = site.at.y - Math.max(0, t - 1.2) * 1.4; grp.rotation.x = Math.sin(t * 20) * .02 * Math.max(0, 1 - t); }
        else { once(1, () => sfx.pop()); grp.rotation.y = t * 3; }
        if (t > 1.9) fadeOut((t - 1.9) / .5);
        return t > 2.4;
      };
    }
  };
  const conjure = (m: Made, site: Site) => {
    const { grp, segs } = build(m), ghost = grp.clone(true);
    ghost.traverse(x => { const me = x as T.Mesh; if (me.isMesh) me.material = holoMaterial({ color: HOLO.made, opacity: .9, edge: 1.4, intensity: 2 }); });
    const span = site.s.need.archetype === 'span';
    for (const x of [grp, ghost]) { x.position.copy(site.at); if (span && m.away) x.rotation.y = Math.PI; root.add(x); }
    grp.visible = false; ghost.scale.setScalar(.01);
    live.push({ grp, ghost, segs, t: 0, m, site, done: false, play: outcome(m, site, grp, segs) });
    fx.burst(site.at.clone().setY(.8), 16, 1.6, HOLO.made); sfx.speak(4);
  };

  // ── speaking: the word ring, a hologram of the engine's context (kit/word-ring.ts) ──
  let open: Site | null = null, busy = false, shot: { pos: T.Vector3; look: T.Vector3; rate: number; cut: number } | null = null, cuts = 0;
  const usable = () => echo.carried.filter(w => spec.lexicon[w]);
  let toldPick = false;
  // predictive mode: how often each suggestion had been read when the ring last showed it, so a
  // word that climbed since (the builders' song) shows "+3"
  // the engine as it came (its phrasebook only): a suggestion's "+3" is what Zip's own reading added
  const base = NG ? createNgram(NG.n) : null; NG?.pretrain.forEach(t => base!.read(t));
  const times = (n: number) => n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`;
  const predictive = engine && NG ? {
    suggest: (said: string[]) => engine.suggest(said, NG.top, NG.show).map(x => ({ ...x, grew: x.count - base!.count(said[said.length - 1], x.word) })),
    // let it finish: its likeliest word each time, until it has named a thing (or the ring is full)
    finish: (said: string[]) => engine.complete(said, open?.s.slots ?? 3, w => w.length > 1 && spec.lexicon[w[w.length - 1]]?.kind === 'thing', NG.top),
    onRare: (word: string, said: string[]) => {
      const after = said[said.length - 1], best = engine.suggest(said, 1, 1)[0];
      g.bark('Zip', (spec.lines.rare ?? '').replace('{word}', word).replace('{after}', after).replace('{n}', times(engine.count(after, word))).replace('{top}', best?.word ?? '').replace('{m}', times(best?.count ?? 0)), 3.6);
    },
  } : {};
  const ring = createWordRing({ scene, host: o.host, camera: o.camera, ...predictive,
    anchor: () => o.zip().clone().add(new T.Vector3(.35, 1.75, .25)),
    source: () => o.zip().clone().add(new T.Vector3(0, 1.0, 0)),
    cue: c => {
      ({ load: () => sfx.place(), unload: () => sfx.tap(), full: () => sfx.boing(), speak: () => sfx.speak(3), open: () => sfx.whoosh(), close: () => {} })[c]();
      // the first time a first word goes in, Zip says what happens next, once (no tester had tried "let it finish", runs 10-13)
      if (c === 'load' && engine && !toldPick && ring.slots.length === 1 && spec.lines['first-pick']) { toldPick = true; g.bark('Zip', spec.lines['first-pick']); }
    },
    say: t => g.bark('Zip', t, 2.2),
    onSpeak: (words, forgotten) => { if (open) say(open, [...forgotten, ...words]); },   // the engine heard the forgotten ones first
    onClose: () => { o.host.classList.remove('puzzle-mode', 'ring-mode'); echo.showOrbit(true); if (!busy) { shot = null; open = null; } },
  });
  const openRing = (site: Site) => {
    open = site; o.host.classList.add('puzzle-mode', 'ring-mode'); echo.showOrbit(false);
    // frame Zip and the ring from the front-side, the gap behind them
    const z = o.zip(); if (V.ringShot !== false) shot = { pos: z.clone().add(new T.Vector3(1.4, 2.9, 3.9)), look: z.clone().add(new T.Vector3(.3, 1.45, 0)), rate: 3, cut: ++cuts };
    // first visit to a place whose engine already holds someone's words (SiteSpec.preload): they're in the ring
    const pre = site.s.preload && !preloaded.has(site.s.id) ? (preloaded.add(site.s.id), site.s.preload) : null;
    if (pre && spec.lines[`preload-${site.s.id}`]) later(.6, () => g.bark('Zip', spec.lines[`preload-${site.s.id}`], 3.4));
    ring.open(usable(), site.s.slots, pre ?? (V.remember ? (lastSaid.get(site.s.id) ?? []).slice(-site.s.slots) : []), { forget: site.s.memory === 'recent', keepStart: !!pre });
  };
  const fill = (m: Made, t: string, word = '') => t.replace('{thing}', m.thing ?? 'nothing').replace('{word}', word).replace('{material}', m.material ?? '');
  // what the engine read, over the place: words that shaped the thing in gold, words said too late
  // in grey (they drop off), the engine's own guess in brackets; words past its context struck out
  const readings: { grp: T.Group; t: number; late: T.Object3D[] }[] = [];
  const showReading = (site: Site, words: string[], m: Made) => {
    const grp = new T.Group(), late: T.Object3D[] = []; let x = 0;
    const put = (text: string, color: string, lateWord = false) => { const g2 = glyph(text, { height: .24, color, intensity: 1.8 }); const w = (g2.geometry as T.PlaneGeometry).parameters.width; g2.position.x = x + w / 2; x += w + .08; grp.add(g2); if (lateWord) late.push(g2); };
    // forgotten words (working memory) come first, dim, and drop off like late ones
    words.forEach((w, i) => m.forgotten.includes(w) ? put(w, HOLO.dim, true) : site.s.memory !== 'recent' && i >= site.s.slots ? put(w + '?', HOLO.dim) : put(w, m.late.includes(w) ? HOLO.dim : HOLO.made, m.late.includes(w)));
    if (m.guessed && m.thing) put(`(${m.thing})`, HOLO.found);
    grp.children.forEach(c => (c.position.x -= x / 2));
    const span = site.s.need.archetype === 'span';
    grp.position.copy(site.at).add(new T.Vector3(span ? Math.min(3, m.size || 2) * .5 : 0, 2.5, 0)); root.add(grp);
    readings.push({ grp, t: 0, late });
  };
  const fails = new Map<string, number>(); let hinted = false, firstFailSaid = false;
  const flights: { m: T.Object3D; from: T.Vector3; t: number; done: () => void }[] = [];
  const falls: { m: T.Object3D; t: number }[] = [];   // phrases that made nothing, dropping away   // taught words flying to Zip
  const say = (site: Site, words: string[]) => {
    const m = speak(spec, words, site.s); busy = true; open = null;
    g.bark('Zip', words.join(' ') + '!', 1.4); sfx.speak(words.length + 1);
    // a directed shot from the side, so the made thing is in view (the follow camera returns after)
    const L = Math.max(1.5, Math.min(8, m.size || 2)), span = site.s.need.archetype === 'span';
    // from behind Zip and a little to the side (about 35°), so the follow camera's way back is a
    // small turn: a side-on shot and back read as "the camera swinging around" (runs 10–12)
    shot = span ? { pos: new T.Vector3(site.at.x - 3.4, 2.7, Z + 2.3 + L * .12), look: new T.Vector3(site.at.x + Math.min(L, 4.5) * .5, .2, Z), rate: 2.5, cut: ++cuts }
      : { pos: new T.Vector3(site.at.x - 3.8, 2.3, Z + 2.4), look: new T.Vector3(site.at.x + .4, 1.1, Z), rate: 2.5, cut: ++cuts };
    (window as any).__vlUtterLog?.push({ site: site.s.id, words, ...m });
    later(.5, () => showReading(site, words, m));
    later(.6, () => {
      if (m.thing) conjure(m, site);
      else {   // nothing made: the phrase itself appears over the place, hangs, and drops into the sky (run 12: "wrong felt like nothing happens")
        sfx.boing(); const gl = glyph(words.join(' '), { height: .55, color: HOLO.found, frame: true, intensity: 2.2 });
        gl.position.copy(site.at).add(new T.Vector3(site.s.need.archetype === 'span' ? 1.6 : .2, 1.4, 0)); root.add(gl); fx.burst(gl.position, 18, 1.6, HOLO.found); falls.push({ m: gl, t: 0 });
      }
      // what the engine did with the phrase, then what happened, timed to the action
      const lost = m.forgotten.filter(w => echo.carried.includes(w));   // Zip's own words that slipped (not someone else's)
      // a phrase can have its own line when it fails (longest first two-or-more words: 'say:long way')
      const own = m.works ? null : words.map((_, i) => words.slice(0, words.length - i)).filter(p => p.length >= 2).map(p => spec.lines['say:' + p.join(' ')]).find(Boolean);
      const notes = [lost.length && spec.lines.forgot ? fill(m, spec.lines.forgot, lost.join('” and “')) : null, m.guessed ? fill(m, spec.lines.guessed) : null, !own && m.late.length ? fill(m, spec.lines.late, m.late[0]) : null, own ?? fill(m, lineFor(spec, m), words.join(' '))].filter(Boolean) as string[];
      let d = m.guessed || m.late.length || m.forgotten.length ? .4 : 1.7; for (const n of notes) { later(d, () => g.bark('Zip', n, 3.4)); d += 3.4; }
      if (m.works) lastSaid.delete(site.s.id); else lastSaid.set(site.s.id, words);
      // a miss that hands over the fix (SiteSpec.teaches): the word rises out of the failure and flies to Zip
      const tw = site.s.teaches;
      if (tw && m.reason === tw.reason && !echo.carried.includes(tw.word)) {
        later(d, () => {
          const gl = glyph(tw.word, { height: .4, color: HOLO.made, frame: true, intensity: 2.4 }); gl.position.copy(site.at).add(new T.Vector3(1.4, .6, 0)); root.add(gl);
          flights.push({ m: gl, from: gl.position.clone(), t: 0, done: () => { root.remove(gl); echo.carry(tw.word); sfx.place(); fx.burst(o.zip().clone().setY(1.2), 14, 1.4, HOLO.made); } });
          g.bark('Zip', spec.lines[`taught-${tw.word}`] ?? spec.lines.taught ?? '', 3.4);
        }); d += 3.6;
      }
      if (!m.works) {
        const n = (fails.get(site.s.id) ?? 0) + 1; fails.set(site.s.id, n);
        if (V.firstFail && !firstFailSaid) { firstFailSaid = true; later(d, () => g.bark('Zip', V.firstFail!, 3)); d += 3.2; }
        // after two misses, a nudge toward a rule they haven't met
        // (a game can say a word came too late in its own way: line 'hint-late')
        const hint = spec.lines[`hint-${site.s.id}`] ?? (m.late.length && spec.lines['hint-late'] ? spec.lines['hint-late'] : 'What if I stop mid-phrase? The engine might finish it.');
        if (n === 2 && !hinted) { hinted = true; later(d, () => g.bark('Zip', hint, 3)); d += 3.2; }
      }
      // the shot holds until the lines are said: what happened stays in view; then the camera
      // stands behind Zip facing the way on (so "forward" walks across, not off the edge)
      // the camera comes back behind Zip facing what to do next: across a span that worked, back at
      // the gap or doorway after a miss (testers lost their way after every speak shot, 5–6 Oct)
      later(Math.max(d, 3.2), () => {
        busy = false; shot = null;
        const i = sites.indexOf(site), z = o.zip(), to = m.works && site.s.need.archetype === 'span' && i + 1 < centres.length ? new T.Vector3(centres[i + 1], 0, Z) : site.at;
        // the direction from where Zip spoke, not from where he is now: a player who walks on during the shot
        // can be past the next platform's centre, and aiming from there turned the camera right round (174°, run 12 replay)
        const dx = to.x - site.from.x, dz = to.z - site.from.z; void z; (o.turnTo ?? o.setYaw)(Math.hypot(dx, dz) > .5 ? Math.atan2(-dx, -dz) : -Math.PI / 2);
      });
    });
  };
  g.setThinker(o.zip);
  o.teleport(sites[0].from.x - (V.spawnBack ?? 1.8), Z);   // a couple of steps from the first place to speak
  const intro = V.intro ?? ['Words everywhere. If I say a thing, does it happen?', 'My engine reads words in order. Three at a time, for now.'];
  intro.forEach((line, i) => later(1.2 + i * 3.4, () => g.bark('Zip', line, 3)));
  let goalSite = -1, goalWordless = false; const aimV = new T.Vector3();
  const api = {
    sites, echo, ring, sources: o.sources, engine, get open() { return ring.isOpen; }, get shot() { return shot; }, get busy() { return busy; },
    /** the place label: which platform Zip is on */
    get placeName() { if (!V.places) return null; const x = o.zip().x; let best = 0; centres.forEach((c, i) => { if (Math.abs(x - c) < Math.abs(x - centres[best])) best = i; }); return V.places[best] ?? null; },
    tick(dt: number) {
      clock += dt; fx.tick(dt); echo.tick(dt); ring.tick(dt);
      for (const f of [...flights]) {   // rise, hang a moment so it can be read, then arc into Zip
        f.t += dt; faceCamera(f.m, o.camera); const to = o.zip().clone().setY(1.3);
        if (f.t < .9) f.m.position.copy(f.from).setY(f.from.y + f.t * 1.2);
        else { const k = Math.min(1, (f.t - .9) / .7); f.m.position.lerpVectors(f.from.clone().setY(f.from.y + 1.08), to, k * k); f.m.position.y += Math.sin(k * Math.PI) * .6; f.m.scale.setScalar(1 - k * .6); }
        if (f.t > 1.6) { flights.splice(flights.indexOf(f), 1); f.done(); }
      }
      for (const f of [...falls]) {   // hang a beat, wobble, then tumble into the sky
        f.t += dt; faceCamera(f.m, o.camera);
        if (f.t < 1.4) f.m.rotation.z = Math.sin(f.t * 9) * .06 * f.t;
        else { const k = f.t - 1.4; f.m.position.y -= k * dt * 9; f.m.rotation.z += dt * 2.4; }
        if (f.t > 3) { root.remove(f.m); falls.splice(falls.indexOf(f), 1); }
      }
      for (const q of queue.filter(q => q.t <= clock)) { queue.splice(queue.indexOf(q), 1); q.fn(); }
      for (const r of [...readings]) {
        r.t += dt; faceCamera(r.grp, o.camera); r.grp.scale.setScalar(Math.min(1, r.t * 4));
        for (const l of r.late) if (r.t > 1.4) { l.position.y -= (r.t - 1.4) * dt * 5; l.rotation.z += dt * 2; }
        if (r.t > 5) { root.remove(r.grp); readings.splice(readings.indexOf(r), 1); }
      }
      for (const l of [...live]) {
        l.t += dt;
        const k = Math.min(1, l.t / WEAVE);
        l.ghost.scale.setScalar(Math.max(.01, 1 - (1 - k) ** 3));
        if (l.t > WEAVE && !l.grp.visible) l.grp.visible = true;
        if (l.t > WEAVE) l.ghost.traverse(x => { const me = x as T.Mesh; if (me.isMesh) (me.material as T.ShaderMaterial).uniforms.uOpacity.value = Math.max(0, .9 - (l.t - WEAVE) * 1.8); });
        if (l.t > WEAVE + .6 && l.ghost.parent) root.remove(l.ghost);
        if (l.t > WEAVE + .2 && !l.done) {
          l.done = l.play(l.t - WEAVE - .2, dt);
          if (l.done) {
            if (l.m.works) {
              l.site.solved = true; signs[sites.indexOf(l.site)].visible = false;
              if (l.site.s.need.archetype === 'span') for (let x = .2; x < l.m.size + 1; x += .45) o.addWalk(l.site.at.x + x, Z, 1);   // runs a metre onto the far side, so the joint never snags
            } else { root.remove(l.grp); live.splice(live.indexOf(l), 1); }
          }
        }
      }
      // the next unsolved place: its goal, and the prompt when Zip stands at its edge
      // after a span works, walk across it before the next place asks anything
      const z0 = o.zip();
      sites.forEach((x, i) => { if (x.solved && x.s.need.archetype === 'span' && z0.x >= centres[i + 1] - R + .6) x.crossed = true; });
      const crossing = sites.every(x => x.solved) ? undefined : sites.find(x => x.solved && x.s.need.archetype === 'span' && !x.crossed);
      const next = crossing ? -2 : sites.findIndex(x => !x.solved);
      // the next-word lab: nothing to say yet, so the goal is a word first (run 11 stood at the
      // first edge for twelve steps with no Speak and no clue why)
      const wordless = !!NG && next >= 0 && usable().length === 0;
      if (next !== goalSite || wordless !== goalWordless) {
        goalSite = next; goalWordless = wordless;
        if (next === -2) { g.setGoal('Walk across'); g.setBeacon(new T.Vector3(centres[sites.indexOf(crossing!) + 1], 1.2, Z)); }
        else if (next < 0) { g.setGoal('The lab is done. More words soon.'); g.setBeacon(null); fx.burst(o.zip().clone().setY(1.4), 30, 2.4, HOLO.made); sfx.chime(); later(1, () => g.bark('Zip', spec.lines.done ?? 'I talked my way across the sky. Mira would laugh.', 3));
          // what you did here, with reasons to come back: the ways to fail you haven't seen, the words you haven't used
          later(4.6, () => {
            const log: (Made & { words: string[]; site: string })[] = (window as any).__vlUtterLog ?? [];
            const kinds = new Set(log.filter(m => !m.works).map(m => m.reason)), used = new Set(log.flatMap(m => m.words)), all = new Set([...o.sources.map(x => x.word), ...sites.flatMap(x => x.s.teaches ? [x.s.teaches.word] : [])]);
            const firstTry = sites.every(x => log.find(m => m.site === x.s.id)?.works);
            const odd = new Set(log.filter(m => !m.works).map(m => m.words.join(' ')));
            g.stars('Said into being', engine ? [
              [true, 'Crossed two gaps and lit the dark'],
              [firstTry, firstTry ? 'Every place on your first phrase' : 'Every place on the first phrase (try again?)'],
              [odd.size >= 3, `Odd things your engine said: ${odd.size}`],
              [read.size >= o.sources.length, `Signs your engine read: ${read.size} of ${o.sources.length}`],
            ] : [
              [true, 'Crossed two gaps and lit the dark'],
              [firstTry, firstTry ? 'Every place on your first phrase' : 'Every place on the first phrase (try again?)'],
              [kinds.size >= 4, `Funny failures found: ${kinds.size} of 6`],
              [[...all].every(w => used.has(w)), `Words you used: ${[...all].filter(w => used.has(w)).length} of ${all.size}`],
            ], () => {}, { stay: !!V.summaryStays, note: spec.lines['stars-note'], again: spec.lines['play-again'] ? { label: spec.lines['play-again'], fn: () => location.reload() } : undefined });
          });
        }
        else if (wordless) { g.setGoal(spec.lines['goal-words'] ?? 'Find a word to say'); g.setBeacon(echo.nearest(z0)); }
        else { g.setGoal(sites[next].s.asks); g.setBeacon(sites[next].from.clone().setY(1.2)); }
        rings.forEach((r, i) => (r.visible = i === next));
      }
      rings.forEach(r => { if (r.visible) r.scale.setScalar(1 + .06 * Math.sin(clock * 3)); });
      if (secret.visible) { secret.position.y = 1.4 + Math.sin(clock * 1.6) * .08; faceCamera(secret, o.camera); }
      if (open || busy) { g.setAction(null); return; }
      // a word in reach or the place to speak at: the one the player looks at wins (kit/target.ts)
      const z = o.zip(), a = echo.action(z), here = next >= 0 ? sites[next] : null;
      const reach = V.speakReach ?? 2.2;   // how close to the place to speak (B: wider; testers hunted for the spot)
      const atSpot = !!here && usable().length > 0 && (Math.hypot(z.x - here.from.x, z.z - here.from.z) < reach || Math.hypot(z.x - here.at.x, z.z - here.at.z) < reach + .4);
      o.camera.getWorldDirection(aimV);
      const onRing = !!here && Math.hypot(z.x - here.from.x, z.z - here.from.z) < .9;
      const pick = onRing && atSpot ? 'speak' : a && atSpot ? pickTarget([{ item: 'word', x: a.at.x, z: a.at.z, r: Infinity }, { item: 'speak', x: here!.at.x, z: here!.at.z, r: Infinity, priority: 1 }], z, aimV)?.item : a ? 'word' : atSpot ? 'speak' : null;
      if (pick === 'word') g.setAction(a!.label, a!.use, a!.at, a!.action);
      else if (pick === 'speak') g.setAction('Speak', () => openRing(here!), here!.at.clone().setY(1.1), 'open-speak');
      else g.setAction(null);
    },
  };
  (window as any).__vlUtterLog = [];
  return api;
}
