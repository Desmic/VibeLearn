// A floating thumb stick for phones (the movement standard in mobile 3D games):
// press anywhere in the lower-left zone and the stick appears under the thumb;
// drag to move, harder for faster. At rest a faint ring shows where it lives.
// Touches elsewhere are free for looking around and tapping the world.
// Game-agnostic: read `vector` ({x, y}: -1..1, y up = forward) each frame.
export function createJoystick(host: HTMLElement, opts: { radius?: number; onUse?: () => void } = {}) {
  const R = opts.radius ?? 56;
  const zone = document.createElement('div'); zone.className = 'stick-zone'; zone.setAttribute('aria-hidden', 'true');
  const base = document.createElement('div'); base.className = 'stick-base';
  const knob = document.createElement('div'); knob.className = 'stick-knob';
  base.appendChild(knob); zone.appendChild(base); host.appendChild(zone);
  const v = { x: 0, y: 0 }; let id: number | null = null, cx = 0, cy = 0, enabled = true;
  const rest = () => { base.classList.remove('live'); base.style.left = ''; base.style.top = ''; knob.style.transform = ''; v.x = v.y = 0; id = null; };
  zone.addEventListener('pointerdown', e => {
    if (!enabled || id !== null || e.pointerType === 'mouse') return;
    e.preventDefault(); e.stopPropagation(); id = e.pointerId; zone.setPointerCapture(e.pointerId);
    const r = zone.getBoundingClientRect(); cx = e.clientX; cy = e.clientY;
    base.classList.add('live'); base.style.left = `${cx - r.left}px`; base.style.top = `${cy - r.top}px`; opts.onUse?.();
  });
  zone.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy);
    if (d > R) { // the base follows a thumb that slides past the edge, so the stick never "sticks"
      const over = d - R; cx += dx / d * over; cy += dy / d * over; dx = e.clientX - cx; dy = e.clientY - cy;
      const r = zone.getBoundingClientRect(); base.style.left = `${cx - r.left}px`; base.style.top = `${cy - r.top}px`;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const k = Math.min(1, Math.hypot(dx, dy) / R), dead = .15, s = k < dead ? 0 : (k - dead) / (1 - dead), a = Math.atan2(dy, dx);
    v.x = Math.cos(a) * s; v.y = -Math.sin(a) * s;
  });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) zone.addEventListener(ev, e => { if ((e as PointerEvent).pointerId === id) rest(); });
  return {
    get vector() { return v; },
    get active() { return id !== null; },
    set enabled(on: boolean) { enabled = on; zone.classList.toggle('off', !on); if (!on) rest(); },
    release: rest,
  };
}
export type Joystick = ReturnType<typeof createJoystick>;
