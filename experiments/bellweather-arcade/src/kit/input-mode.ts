// Which kind of player is holding the game right now: 'touch' (a phone: a thumb
// stick and taps) or 'desktop' (keyboard and mouse: WASD, E to act, keys for
// choices). It follows the last input used, so a laptop with a touch screen
// switches cleanly. Sets html[data-input] so styles can show the right glyphs
// (a tap ring or a key cap), and tells listeners when it changes.
// Game-agnostic.
export type InputMode = 'touch' | 'desktop';
let mode: InputMode = (() => { try { return matchMedia('(pointer: coarse)').matches ? 'touch' : 'desktop'; } catch { return 'desktop'; } })();
const listeners = new Set<(m: InputMode) => void>();
const set = (m: InputMode) => { if (m === mode) return; mode = m; document.documentElement.dataset.input = m; for (const f of listeners) f(m); };
if (typeof window !== 'undefined') {
  document.documentElement.dataset.input = mode;
  window.addEventListener('pointerdown', e => set(e.pointerType === 'mouse' ? 'desktop' : 'touch'), { capture: true, passive: true });
  window.addEventListener('keydown', e => { if (!e.repeat && e.key !== 'Escape') set('desktop'); }, { capture: true, passive: true });
}
export const inputMode = {
  get current() { return mode; },
  get touch() { return mode === 'touch'; },
  onChange(f: (m: InputMode) => void) { listeners.add(f); return () => listeners.delete(f); },
};
