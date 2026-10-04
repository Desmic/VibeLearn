import * as T from 'three';
import type { Guide } from './guide';
import { sfx } from './sfx';
import { HOLO, glyph, holoMaterial, sparks } from './kit/holo';
import { speak, type Made, type SiteSpec, type UtterSpec } from './kit/utter';

// The utterance test area (`lab=utter`): Zip says things into existence to cross two gaps and
// light a doorway. Off the story path, to try the feel of the mechanic (docs/UTTER-DESIGN.md).
// The kit (kit/utter.ts) decides what a phrase makes and whether it works; this file only shows
// it: the thing weaves itself in as a hologram, turns solid, and then works or fails visibly.
// Placeholder shapes stand in for authored models (a catalogue of Blender props comes later).

const Z = -40, X0 = 60, R = 3;   // the platforms sit in open sky, far from the town
interface Opts {
  guide: Guide; host: HTMLElement; zip: () => T.Vector3;
  addWalk: (x: number, z: number, r: number) => void;
  teleport: (x: number, z: number) => void;
  /** turn the follow camera (radians, the game's yaw): to see the made thing from the side */
  setYaw: (y: number) => void; yaw: () => number;
  spec: UtterSpec;
}

export function buildUtterLab(scene: T.Scene, o: Opts) {
  const g = o.guide, spec = o.spec, root = new T.Group(); root.name = 'utter-lab'; scene.add(root);
  const fx = sparks(root, 40);
  const mat = (c: string, extra: Partial<T.MeshStandardMaterialParameters> = {}) => new T.MeshStandardMaterial({ color: c, roughness: .85, ...extra });
  // platforms: three discs of painted stone with a rocky underside
  const gaps = [3.4, 7];
  const centres = [X0, X0 + 2 * R + gaps[0], X0 + 4 * R + gaps[0] + gaps[1]];
  for (const cx of centres) {
    const top = new T.Mesh(new T.CylinderGeometry(R, R * .92, .5, 40), mat('#e9dcc2')); top.position.set(cx, -.25, Z); root.add(top);
    const rock = new T.Mesh(new T.ConeGeometry(R * .9, 4.5, 9), mat('#8a7a68', { flatShading: true })); rock.rotation.x = Math.PI; rock.position.set(cx, -2.75, Z); root.add(rock);
    const grass = new T.Mesh(new T.CylinderGeometry(R * .97, R * .97, .04, 40), mat('#9cc58a')); grass.position.set(cx, .01, Z); root.add(grass);
    o.addWalk(cx, Z, R);
  }
  // the dark doorway on the last platform: an arch with a shadowed opening and a sign behind it
  const door = new T.Group(); door.position.set(centres[2] + 1.6, 0, Z); root.add(door);
  for (const s of [-1, 1]) { const p = new T.Mesh(new T.BoxGeometry(.35, 2.4, .35), mat('#cbb89a')); p.position.set(0, 1.2, s * .9); door.add(p); }
  const lintel = new T.Mesh(new T.BoxGeometry(.4, .35, 2.2), mat('#cbb89a')); lintel.position.set(0, 2.5, 0); door.add(lintel);
  const shadow = new T.Mesh(new T.PlaneGeometry(1.5, 2.3), new T.MeshBasicMaterial({ color: '#0b0f1a', transparent: true, opacity: .92 })); shadow.rotation.y = -Math.PI / 2; shadow.position.set(.05, 1.15, 0); door.add(shadow);
  const doorLight = new T.PointLight('#ffcf7a', 0, 6); doorLight.position.set(-.6, 1.6, 0); door.add(doorLight);

  // where each site is spoken from (the edge of the platform before it) and where its thing goes
  // Zip speaks from a step back, so the thing appears in front of him, in view
  const edge = (i: number) => new T.Vector3(centres[i] + R - .4, 0, Z);
  const sites = spec.sites.map((s, i) => { const at = i < 2 ? edge(i) : new T.Vector3(centres[2] + 1.0, 0, Z); return { s, at, from: at.clone().add(new T.Vector3(-1.8, 0, 0)), solved: false }; });
  const signs = sites.map(x => { const m = glyph(x.s.asks, { height: .26, color: HOLO.found, frame: true, intensity: 1.6 }); m.position.copy(x.at).add(new T.Vector3(0, 2.1, 0)); root.add(m); return m; });

  // ── the thing: a placeholder shape per look, sized by what was said ──
  const build = (m: Made): T.Group => {
    const grp = new T.Group(), L = m.size, c = m.material === 'jelly' ? '#ff8fb8' : m.material === 'stone' ? '#a9a39a' : m.material === 'paper' ? '#f6f1e6' : '#b07a4a';
    const extra = m.material === 'jelly' ? { transparent: true, opacity: .8, roughness: .3 } : {};
    const look = m.thing ? spec.things[m.thing].look : '';
    if (look === 'bridge' || look === 'plank' || look === 'noodle') {
      const w = look === 'plank' ? .45 : look === 'noodle' ? .22 : .9;
      if (look === 'noodle') { const n = new T.Mesh(new T.CylinderGeometry(.1, .1, L, 8), mat('#f3d27a')); n.rotation.z = Math.PI / 2; n.position.x = L / 2; grp.add(n); }
      else for (let x = 0; x < L - .05; x += .32) { const p = new T.Mesh(new T.BoxGeometry(.28, .08, w), mat(c, extra)); p.position.set(x + .15, -.04, 0); grp.add(p); }
      if (look === 'bridge' && L > .5) for (const s of [-1, 1]) { const rail = new T.Mesh(new T.BoxGeometry(L, .05, .05), mat(c, extra)); rail.position.set(L / 2, .45, s * w / 2); grp.add(rail); }
    } else if (look === 'lantern') {
      const k = Math.max(.15, Math.min(2.5, L));
      const body = new T.Mesh(new T.CylinderGeometry(.14 * k, .18 * k, .4 * k, 8), mat('#ffd36b', { emissive: '#ffb84a', emissiveIntensity: 1.2 * Math.min(1, L) })); body.position.y = .8 * Math.min(1.4, k); grp.add(body);
      const pole = new T.Mesh(new T.CylinderGeometry(.03, .03, .8 * Math.min(1.4, k), 6), mat('#4a3a2a')); pole.position.y = .4 * Math.min(1.4, k); grp.add(pole);
    } else if (look === 'rope') { const r = new T.Mesh(new T.TorusGeometry(.3, .07, 6, 16), mat('#c8a46a')); r.rotation.x = Math.PI / 2; r.position.y = .07; grp.add(r); }
    else if (look === 'bean') { const b = new T.Mesh(new T.SphereGeometry(.35, 12, 8), mat('#ff6f91', { transparent: true, opacity: .85, roughness: .3 })); b.scale.set(1.4, .9, .9); b.position.y = .35; grp.add(b); }
    else if (look === 'plane') { const p = new T.Mesh(new T.ConeGeometry(.35, 1, 3), mat('#f6f1e6', { flatShading: true })); p.rotation.z = -Math.PI / 2; p.position.y = .9; grp.add(p); }
    else if (look === 'wall') { const w = new T.Mesh(new T.BoxGeometry(.4, 1.2, 1.8), mat('#a9a39a', { flatShading: true })); w.position.y = .6; grp.add(w); }
    return grp;
  };

  // ── weaving in: a hologram of the thing grows, then turns solid ──
  type Live = { grp: T.Group; ghost: T.Group; t: number; m: Made; site: typeof sites[number]; fall: number; bob: number };
  const live: Live[] = [];
  const conjure = (m: Made, site: typeof sites[number]) => {
    const grp = build(m), ghost = grp.clone(true);
    ghost.traverse(x => { const me = x as T.Mesh; if (me.isMesh) me.material = holoMaterial({ color: HOLO.made, opacity: .9, edge: 1.4, intensity: 2 }); });
    const span = site.s.need.archetype === 'span';
    for (const x of [grp, ghost]) { x.position.copy(site.at); if (span && m.away) x.rotation.y = Math.PI; root.add(x); }
    grp.visible = false; ghost.scale.setScalar(.01);
    live.push({ grp, ghost, t: 0, m, site, fall: 0, bob: 0 });
    fx.burst(site.at.clone().setY(.8), 16, 1.6, HOLO.made); sfx.chime();
  };

  // ── speaking: the engine tray (the same one the skiff uses), words Zip carries here ──
  const tray = document.createElement('div'); tray.className = 'engine-tray'; tray.hidden = true; o.host.appendChild(tray);
  const line = document.createElement('div'); line.className = 'engine-prompt'; line.hidden = true; o.host.appendChild(line);
  let open: typeof sites[number] | null = null, said: string[] = [], busyT = 0;
  const render = () => {
    if (!open) return;
    const s = open.s;
    line.innerHTML = `${s.asks}. Say it: <b>${said.length ? said.join(' ') : '…'}</b> <span style="opacity:.7">(${said.length} of ${s.slots} words)</span>`;
    tray.innerHTML = `<div class="engine-words">${s.words.map(w => `<button class="holo-chip" data-w="${w}" data-action="say.${w}" ${said.includes(w) || said.length >= s.slots ? 'disabled' : ''}>${w}</button>`).join('')}</div>
      <div class="engine-buttons"><button class="holo-cast" data-act="speak" data-action="speak" ${said.length ? '' : 'disabled'}>Speak ✦</button>${said.length ? '<button class="holo-quiet" data-act="clear" aria-label="Clear">↺ Clear</button>' : ''}<button class="holo-quiet" data-act="close">Step away</button></div>`;
  };
  const close = () => { open = null; said = []; tray.hidden = line.hidden = true; o.host.classList.remove('puzzle-mode'); };
  tray.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null; if (!b || b.disabled || !open) return;
    if (b.dataset.w) { said.push(b.dataset.w); sfx.place(); render(); return; }
    if (b.dataset.act === 'clear') { said = []; sfx.tap(); render(); return; }
    if (b.dataset.act === 'close') { close(); return; }
    if (b.dataset.act === 'speak') {
      const site = open, words = [...said], m = speak(spec, words, site.s); close();
      const fill = (t: string, word = '') => t.replace('{thing}', m.thing ?? 'nothing').replace('{word}', word).replace('{material}', m.material ?? '');
      g.bark('Zip', words.join(' ') + '!', 1.6); busyT = 2.4 + 1.2;
      o.setYaw(-Math.PI / 2 + .8);   // the camera swings to the side to watch it appear
      setTimeout(() => {
        if (m.thing) conjure(m, site); else sfx.boing();
        // what the engine did with the phrase, then whether it works
        const notes = [m.guessed ? fill(spec.lines.guessed) : null, m.late.length ? fill(spec.lines.late, m.late[0]) : null, fill(spec.lines[m.reason])].filter(Boolean) as string[];
        let delay = 1300; for (const n of notes) { setTimeout(() => g.bark('Zip', n, 2.6), delay); delay += 2700; }
        (window as any).__vlUtterLog?.push({ site: site.s.id, words, ...m });
      }, 700);
      return;
    }
  });

  g.setThinker(o.zip);
  o.teleport(X0 - 1, Z);
  let goalSite = -1;
  const api = {
    sites, get open() { return !!open; },
    tick(dt: number) {
      fx.tick(dt); busyT = Math.max(0, busyT - dt);
      for (const l of [...live]) {
        l.t += dt;
        const k = Math.min(1, l.t / .8), span = l.site.s.need.archetype === 'span';
        l.ghost.scale.setScalar(Math.max(.01, k < 1 ? 1 - (1 - k) ** 3 : 1));
        if (l.t > .8 && !l.grp.visible) { l.grp.visible = true; }
        if (l.t > .8) l.ghost.traverse(x => { const me = x as T.Mesh; if (me.isMesh) (me.material as T.ShaderMaterial).uniforms.uOpacity.value = Math.max(0, .9 - (l.t - .8) * 1.5); });
        if (l.t > 1.6 && l.ghost.parent) root.remove(l.ghost);
        if (l.m.material === 'jelly') { l.bob += dt; l.grp.scale.y = 1 + Math.sin(l.bob * 9) * .08 * Math.exp(-l.bob * .6); }
        // the outcome, shown: works stays; the rest fail visibly, then go
        if (l.t > 1.4 && !l.site.solved) {
          if (l.m.works && !l.fall) {
            l.site.solved = true; l.fall = -1; sfx.chime();
            if (span) for (let x = .2; x < l.m.size; x += .45) o.addWalk(l.site.at.x + x, Z, .78);
            else { doorLight.intensity = 3.5; (shadow.material as T.MeshBasicMaterial).opacity = .15; }
            signs[sites.indexOf(l.site)].visible = false;
          } else if (!l.m.works && l.fall >= 0) {
            l.fall += dt;
            if (span && l.m.reason !== 'wrong-way') { l.grp.rotation.z = -Math.min(1.2, l.fall * l.fall * 1.5); l.grp.position.y -= l.fall * dt * 6; }
            if (l.fall > 2.6) { root.remove(l.grp); live.splice(live.indexOf(l), 1); fx.burst(l.site.at.clone().setY(.4), 10, 1.2, HOLO.found); }
          }
        }
      }
      // the next unsolved place: its goal, and the prompt when Zip stands at its edge
      const next = sites.findIndex(x => !x.solved);
      if (next !== goalSite) { goalSite = next; if (next < 0) { g.setGoal('The lab is done. More words soon.'); g.setBeacon(null); } else { g.setGoal(sites[next].s.asks); g.setBeacon(sites[next].from.clone().setY(1.2)); } }
      const z = o.zip(), here = next >= 0 ? sites[next] : null;
      if (here && !open && !busyT && !live.some(l => l.site === here && l.fall >= 0 && !l.m.works) && Math.hypot(z.x - here.from.x, z.z - here.from.z) < 2.2) g.setAction('Speak', () => { open = here; said = []; tray.hidden = line.hidden = false; o.host.classList.add('puzzle-mode'); render(); }, here.at.clone().setY(1.1), 'open-speak');   // the prompt sits where the thing will appear
      else g.setAction(null);
    },
  };
  (window as any).__vlUtterLog = [];
  return api;
}
