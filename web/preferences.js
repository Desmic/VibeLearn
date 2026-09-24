/* One owner for every preference the player can set (presentation guide rule I11).

   A surface that offers a preference renders it from here and writes through here. It does
   not choose its own glyph, its own wording, its own storage key or its own idea of what the
   setting means: those four are exactly what drift apart between hand-written copies, and a
   control that only flips its own icon is broken even when its flag reads back correctly.

   The registry also *applies* each preference, so a player's choice has force in the document
   and in the runtime rather than only in the control that was clicked. */

const KEY = 'vibelearn-preferences';

// id: the data-preference attribute and the key inside the stored object.
// default: the value before the player says anything.
// read(value, system): the effective value; `system` is the operating-system signal.
// label/glyph: the single wording and symbol every button carrier must paint.
// A control with no glyph is a text button and has its text set to the label; a checkbox is
// a checkbox and carries the reading in its own `checked` state.
export const PREFERENCES = [
  { id: 'sound', default: true, glyph: on => (on ? '\u266A' : '\u266A\u0338'),
    label: on => (on ? 'Mute all sound' : 'Unmute all sound') },
  { id: 'music', default: true },
  { id: 'effects', default: true },
  { id: 'motion', default: false, read: (value, system) => system || value,
    label: reduce => (reduce ? 'Resume scene motion' : 'Reduce scene motion') },
  { id: 'xp', default: false, label: hidden => (hidden ? 'Show XP' : 'Hide XP') },
];

export function createPreferences({ storage = globalThis.localStorage, doc = globalThis.document,
  systemMotion = false } = {}) {
  const stored = load(storage);
  const listeners = new Set();
  const byId = Object.fromEntries(PREFERENCES.map(definition => [definition.id, definition]));

  const value = id => {
    const definition = byId[id];
    if (id in stored) return stored[id];
    // No explicit choice yet: the operating-system signal is the default, and a choice the
    // player makes in the game overrides it from then on.
    if (definition.read) return definition.read(definition.default, systemMotion);
    return definition.default;
  };
  const state = id => {
    const definition = byId[id], on = value(id);
    return { value: on, checked: on, pressed: on ? 'true' : 'false',
             glyph: definition.glyph ? definition.glyph(on) : '',
             label: definition.label ? definition.label(on) : '' };
  };
  // Applying is the difference between a setting and a record of a click. The motion hook is
  // one rule in the shared stylesheet, so an in-game choice weighs the same as the OS signal.
  const apply = id => {
    if (!doc) return;
    if (id === 'motion') doc.documentElement.dataset.motion = value('motion') ? 'reduce' : 'full';
    if (id === 'xp') doc.body?.classList.toggle('xp-hidden', value('xp'));
  };
  // A control declares which preference it carries; the registry paints the control. This is
  // the only place a preference's glyph, wording or pressed state is decided.
  const render = el => {
    const definition = byId[el.dataset.preference];
    if (!definition) return;
    const reading = state(el.dataset.preference);
    if (el.type === 'checkbox') { el.checked = reading.value; return; }
    if (reading.glyph) el.textContent = reading.glyph;
    else if (reading.label) el.textContent = reading.label;
    if (reading.label) el.setAttribute('aria-label', reading.label);
    el.setAttribute('aria-pressed', reading.pressed);
  };
  const api = {
    ids: () => PREFERENCES.map(definition => definition.id),
    get: value,
    set(id, next) {
      if (!byId[id]) return;
      stored[id] = Boolean(next);
      try { storage?.setItem(KEY, JSON.stringify(stored)); } catch { /* still honored this session */ }
      apply(id);
      for (const listener of listeners) listener(id, api);
    },
    state, render,
    hydrate(root) { for (const el of (root || doc).querySelectorAll('[data-preference]')) render(el); },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    // What a gate compares the painted controls against.
    snapshot: () => Object.fromEntries(PREFERENCES.map(definition => [definition.id, state(definition.id)])),
  };
  for (const definition of PREFERENCES) apply(definition.id);
  return api;
}

// The page-level singleton every boot module shares, so two modules cannot each keep their
// own copy of the same preference.
let shared;
export function getPreferences(options) {
  if (shared) return shared;
  shared = createPreferences({
    systemMotion: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true, ...options,
  });
  globalThis.GamePreferences = shared;
  // One write repaints every carrier of that preference: a surface cannot stay stale.
  shared.subscribe(() => shared.hydrate());
  return shared;
}

function load(storage) {
  try { return { ...JSON.parse(storage?.getItem(KEY) || '{}') }; } catch { return {}; }
}
