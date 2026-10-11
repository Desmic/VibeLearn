// The pause menu in tabs (Game · Play · Settings), and a Play tab that jumps between a game's
// ways in: its story from the title, story chapters, and test areas off the story path. Each way
// in is a set of address settings (`lab=ngram`, `beat=land`); jumping reloads the game with them.
// Game-agnostic: the game gives the groups (its own data) and the panels' contents.

export interface PlayMode {
  id: string;
  label: string;
  /** one short line under the label */
  note?: string;
  /** address settings this way in needs; every other mode key is cleared */
  set: Record<string, string>;
}
export interface PlayGroup { title: string; modes: PlayMode[] }

/** the settings that pick a way in (cleared when jumping, so modes never mix by accident) */
export const MODE_KEYS = ['lab', 'beat', 'title', 'story', 'mech'];

/** reload the game with these mode settings (all other mode keys cleared). On the hosted page the
 *  settings ride in the address's #hash (a hash change reloads it there); elsewhere in ?search. */
export function goTo(set: Record<string, string>, keys = MODE_KEYS) {
  const w = window as unknown as { __vlSearch?: string };
  const add = Object.entries(set).map(([k, v]) => `${k}=${v}`);
  if ('__vlSearch' in w) {
    const parts = location.hash.slice(1).split('&').filter(Boolean);
    const variant = parts[0] && !parts[0].includes('=') ? parts.shift()! : 'painted';
    const h = '#' + [variant, ...parts.filter(p => !keys.includes(p.split('=')[0])), ...add].join('&');
    if (h === location.hash) location.reload(); else location.hash = h;
    return;
  }
  const u = new URL(location.href);
  for (const k of keys) u.searchParams.delete(k);
  for (const [k, v] of Object.entries(set)) u.searchParams.set(k, v);
  location.replace(u.toString());
}

/** which mode the current address is (the one whose settings all match, most specific first) */
export function currentMode(groups: PlayGroup[], params: URLSearchParams, keys = MODE_KEYS): string | null {
  const all = groups.flatMap(g => g.modes);
  const fits = all.filter(m => keys.every(k => (params.get(k) ?? null) === (m.set[k] ?? null) || (k === 'title' && !m.set[k])));
  return fits.sort((a, b) => Object.keys(b.set).length - Object.keys(a.set).length)[0]?.id ?? null;
}

type Tab = 'game' | 'play' | 'settings';

/**
 * Turn a menu card into three tabs. `game` and `settings` are the elements already in the card
 * that belong on those tabs (moved, not copied); the Play tab is built from `groups`.
 */
export function menuTabs(card: HTMLElement, o: { game: Element[]; settings: Element[]; groups: PlayGroup[]; params: URLSearchParams; go?: (m: PlayMode) => void }) {
  const bar = document.createElement('div'); bar.className = 'menu-tabs'; bar.setAttribute('role', 'tablist');
  const panels: Record<Tab, HTMLElement> = { game: panel('game'), play: panel('play'), settings: panel('settings') };
  const names: [Tab, string][] = [['game', 'Game'], ['play', 'Play'], ['settings', 'Settings']];
  const tabs = names.map(([id, text]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'menu-tab'; b.textContent = text; b.id = 'menu-tab-' + id;
    b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'menu-panel-' + id); b.dataset.tab = id;
    b.addEventListener('click', () => show(id)); bar.appendChild(b); return b;
  });
  bar.addEventListener('keydown', e => {
    const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true'); if (i < 0) return;
    const j = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length : -1;
    if (j >= 0) { e.preventDefault(); show(names[j][0]); tabs[j].focus(); }
  });
  for (const el of o.game) panels.game.appendChild(el);
  for (const el of o.settings) panels.settings.appendChild(el);
  // the Play tab: one list per group; the way in you're playing now is marked
  const now = currentMode(o.groups, o.params);
  for (const g of o.groups) {
    const h = document.createElement('p'); h.className = 'menu-group'; h.textContent = g.title; panels.play.appendChild(h);
    for (const m of g.modes) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'menu-mode'; b.dataset.mode = m.id;
      b.innerHTML = `<b></b>${m.note ? '<small></small>' : ''}`; b.querySelector('b')!.textContent = m.label; if (m.note) b.querySelector('small')!.textContent = m.note;
      if (m.id === now) { b.setAttribute('aria-current', 'true'); b.querySelector('b')!.textContent += ' · playing'; }
      b.addEventListener('click', () => (o.go ?? (x => goTo(x.set)))(m));
      panels.play.appendChild(b);
    }
  }
  // under the card's title and its line; anything else left in the card goes after the panels
  const lead = card.querySelector(':scope > p') ?? card.querySelector(':scope > h1');
  if (lead) lead.after(bar, panels.game, panels.play, panels.settings); else card.prepend(bar, panels.game, panels.play, panels.settings);
  function panel(id: Tab) { const p = document.createElement('div'); p.className = 'menu-panel'; p.id = 'menu-panel-' + id; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', 'menu-tab-' + id); return p; }
  function show(id: Tab) {
    for (const t of tabs) { const on = t.dataset.tab === id; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; }
    for (const [k, p] of Object.entries(panels)) p.hidden = k !== id;
  }
  show('game');
  return { show };
}
