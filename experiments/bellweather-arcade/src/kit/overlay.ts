import * as T from 'three';

// The world overlay: every piece of UI that belongs to a *thing in the world*
// (a speech bubble, a thought, a "tap" prompt, target brackets, a label) is
// pinned to that thing here instead of to a corner of the screen.
//
// Mechanisms adapted from the "God's Eye" HUD research named in the v3
// architecture (docs: VibeLearn_3D_Game_Generation_Operational_Architecture_v3,
// §HUD), without its dense look:
//   - one shared host projects world points to the screen;
//   - safe regions: pins stay clear of the top line (goal, place name) and the
//     thumb zone at the bottom (controls, action button);
//   - sticky placement: pins glide instead of jittering with the camera, and
//     snap on a camera cut;
//   - priority and declutter: when two pins overlap, the lower-ranked one
//     steps up out of the way, or hides if there is no room (unless `keep`);
//   - screen-edge cues: an `edge` pin whose thing is off screen parks on the
//     edge, its tail turned toward where the thing is (class `at-edge`).
// Game-agnostic: any world can use it; nothing here knows about the story.

export interface PinOpts {
  /** higher wins a place when pins overlap (story speech 10, thought 8, prompt 6, label 3) */
  rank?: number;
  /** stay on screen at the nearest edge when the anchor is off screen */
  edge?: boolean;
  /** pixels between the anchor point and the pin's bottom (negative: below the point) */
  lift?: number;
  /** never hidden by declutter (it moves instead) */
  keep?: boolean;
  /** 'bottom' (default): the pin's bottom-centre sits on the point; 'center': its centre does */
  align?: 'bottom' | 'center';
}

interface Pin { el: HTMLElement; at: () => T.Vector3 | null; o: PinOpts; x: number; y: number; placed: boolean }

export function createOverlay(host: HTMLElement, camera: T.Camera) {
  const pins = new Map<string, Pin>();
  const v = new T.Vector3();
  let lastCam = new T.Vector3(), lastQ = new T.Quaternion(), cut = false;

  const safe = () => {
    const w = host.clientWidth, h = host.clientHeight, phone = w < 600;
    return { w, h, l: 8, r: w - 8, t: phone ? 118 : 70, b: h - (phone ? 132 : 104) };
  };

  const api = {
    /** pin (or re-pin) an element to a world point; the element must already be in the page */
    pin(id: string, el: HTMLElement, at: () => T.Vector3 | null, o: PinOpts = {}) {
      const old = pins.get(id);
      if (old && old.el === el) { old.at = at; old.o = o; return; }
      el.style.visibility = 'hidden';   // until its first placement (no flash in a corner)
      pins.set(id, { el, at, o, x: 0, y: 0, placed: false });
    },
    unpin(id: string) { const p = pins.get(id); if (!p) return; pins.delete(id); p.el.classList.remove('at-edge'); p.el.style.transform = ''; p.el.style.visibility = ''; },
    has(id: string) { return pins.has(id); },
    /** for tests: what is pinned, and where */
    debug() { return [...pins.entries()].map(([id, p]) => ({ id, placed: p.placed, x: Math.round(p.x), y: Math.round(p.y), vis: p.el.style.visibility, hidden: p.el.hidden, at: p.at()?.toArray().map(v => +v.toFixed(2)) ?? null })); },
    /** where a point lands on screen (CSS px), or null when it is behind the camera */
    project(p: T.Vector3) { v.copy(p).project(camera); if (v.z > 1) return null; const s = safe(); return { x: (v.x * .5 + .5) * s.w, y: (-v.y * .5 + .5) * s.h }; },
    tick(dt: number) {
      // a camera cut (a big jump in one frame) snaps every pin instead of gliding it
      const moved = camera.position.distanceTo(lastCam), turned = 1 - Math.abs(camera.quaternion.dot(lastQ));
      cut = moved > 2.5 || turned > .02; lastCam.copy(camera.position); lastQ.copy(camera.quaternion);
      const s = safe(), taken: { x0: number; y0: number; x1: number; y1: number }[] = [];
      const order = [...pins.values()].sort((a, b) => (b.o.rank ?? 0) - (a.o.rank ?? 0));
      const k = 1 - Math.exp(-dt * 16);
      for (const p of order) {
        const el = p.el;
        if (el.hidden) { p.placed = false; continue; }
        const at = p.at();
        if (!at) { el.style.visibility = 'hidden'; p.placed = false; continue; }
        v.copy(at).project(camera);
        const behind = v.z > 1;
        let x = (v.x * .5 + .5) * s.w, y = (-v.y * .5 + .5) * s.h;
        if (behind) { x = s.w - x; y = s.h + 40; }   // behind the camera: mirror, and treat as below the screen
        const bw = el.offsetWidth, bh = el.offsetHeight, lift = p.o.lift ?? 10, center = p.o.align === 'center';
        const off = behind || x < 0 || x > s.w || y < 0 || y > s.h;
        if (off && !p.o.edge) { el.style.visibility = 'hidden'; p.placed = false; continue; }
        // the pin's bottom edge (or centre) at the point, then kept inside the safe region
        let px = T.MathUtils.clamp(x, s.l + bw / 2, s.r - bw / 2);
        let py = center ? y + bh / 2 : y - lift;
        py = T.MathUtils.clamp(py, s.t + bh, s.b);
        // declutter: step above anything higher-ranked that it overlaps
        for (let guard = 0; guard < 4; guard++) {
          const hit = taken.find(r => px + bw / 2 > r.x0 && px - bw / 2 < r.x1 && py > r.y0 && py - bh < r.y1);
          if (!hit) break;
          py = hit.y0 - 6;
        }
        if (py - bh < s.t - 2 && !p.o.keep) { el.style.visibility = 'hidden'; p.placed = false; continue; }
        py = Math.max(py, s.t + bh);
        // sticky: glide toward the new place; snap on first show and on camera cuts
        if (!p.placed || cut || Math.hypot(px - p.x, py - p.y) > s.w * .4) { p.x = px; p.y = py; p.placed = true; }
        else { p.x += (px - p.x) * k; p.y += (py - p.y) * k; }
        taken.push({ x0: p.x - bw / 2, y0: p.y - bh, x1: p.x + bw / 2, y1: p.y });
        el.style.visibility = '';
        el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -100%)`;
        // the tail points at the thing: along the bottom edge when it is in view,
        // turned toward it (an edge cue) when it is off screen
        const edge = off || Math.abs(px - x) > bw / 2 - 12 || y - lift > s.b + 30;
        el.classList.toggle('at-edge', !!p.o.edge && edge);
        el.style.setProperty('--tail', `${T.MathUtils.clamp(x - p.x, -bw / 2 + 16, bw / 2 - 16).toFixed(0)}px`);
        if (p.o.edge && edge) el.style.setProperty('--edge-angle', `${Math.atan2(y - (p.y - bh / 2), x - p.x).toFixed(3)}rad`);
      }
    },
  };
  return api;
}
export type Overlay = ReturnType<typeof createOverlay>;
