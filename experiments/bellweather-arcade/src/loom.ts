import type { Guide } from './guide';
import type { Station } from './kit/station';
import { LOOM_PARTS, type LoomContent, type LoomMessage, type LoomPart } from './worlds/stop2-loom';
import { sfx } from './sfx';

// The Word Loom's console (Stop 2). It draws the six slots and the pieces and
// sends actions to the station; the rules (worlds/stop2-loom.ts) judge every
// choice and the station logs it. Three tries, as the house rule says:
//  1. guided: lift "Free | the | weaver" onto the rail (can't fail)
//  2. predict: how many slots will the Warden's long message need? (can fail)
//  3. build: weave your own call to free Tavi (do what, who, from what) from word tiles. The tiles go
//     on the rail as whole words; only when it weaves does the loom split them, so the call has to be
//     reasoned from the rule (run 29: the puzzles were "picking from 3 or 4 buttons… a bit guessable";
//     wanted "something to build myself"). The tempting verbs are short in letters, long in pieces.

interface Opts { guide: Guide; host: HTMLElement; station: Station; onDone: () => void; onShake?: () => void;
  /** the call is weaving: its pieces, and whether it fits (the game can echo it on the loom in the world) */
  onWeave?: (pieces: number, fits: boolean) => void }

const COLORS = ['#ffb36b', '#9fe0d0', '#f6a9c0', '#cdb8ff', '#ffe08a', '#8fd3ff'];

export function buildLoom(o: Opts) {
  const g = o.guide, st = o.station, c = st.spec.content as unknown as LoomContent;
  const el = document.createElement('div'); el.className = 'loom-console'; el.hidden = true; o.host.appendChild(el);
  let active = false, view: 'guided' | 'predict' | 'build' = 'guided';
  // the options in a shuffled order, so the right one can't be learnt by position
  const order = c.predict.map(p => ({ p, k: Math.random() })).sort((a, b) => a.k - b.k).map(x => x.p);
  const PARTS: LoomPart[] = ['verb', 'who', 'from'];
  const partOrder = Object.fromEntries(PARTS.map(p => [p, [...LOOM_PARTS[p]].map(o => ({ o, k: Math.random() })).sort((a, b) => a.k - b.k).map(x => x.o)])) as Record<LoomPart, (typeof LOOM_PARTS)[LoomPart][number][]>;
  const PART_LABEL: Record<LoomPart, string> = { verb: 'Do what', who: 'Who', from: 'From what' };
  const placed = (p: LoomPart) => LOOM_PARTS[p].find(o => o.id === st.state[p]) ?? null;

  // a message as coloured pieces; words keep their pieces together
  const pieceChips = (m: LoomMessage, upTo = Infinity) => {
    let n = 0;
    return m.pieces.map((w, wi) => `<span class="loom-word">${w.map(p => { const i = n++; return `<span class="loom-piece${i >= upTo ? ' over' : ''}" style="background:${COLORS[wi % COLORS.length]}">${p}</span>`; }).join('')}</span>`).join(' ');
  };
  const rail = (filled: string[], over = 0) => `<div class="loom-rail" aria-label="${filled.length} of ${c.slots} slots used">${Array.from({ length: c.slots }, (_, i) =>
    `<span class="loom-slot${filled[i] ? ' full' : ''}">${filled[i] ?? ''}</span>`).join('')}${over ? `<span class="loom-spill">+${over}</span>` : ''}</div>`;
  const head = (right = '') => `<div class="relay-head">WORD LOOM · <b>${c.slots}</b> SLOTS${right ? ` · <span class="live">${right}</span>` : ''}</div>`;
  const show = (html: string) => { el.innerHTML = html; el.hidden = false; active = true; o.host.classList.add('puzzle-mode'); };
  const close = () => { el.hidden = true; active = false; o.host.classList.remove('puzzle-mode'); el.onclick = null; };

  const guided = () => {
    view = 'guided';
    const lifted = st.state.lifted as number, words = c.guided.pieces.map(p => p.join(''));
    show(`${head()}<p class="relay-read">Lift each piece onto the rail. <b>Tap them</b>, one by one.</p>
      <div class="rail-chips">${words.map((w, i) => `<button class="chip${i < lifted ? ' picked' : ''}" data-lift="${i}" data-action="lift" ${i < lifted ? 'disabled' : ''}>${w}</button>`).join('')}</div>
      ${rail(words.slice(0, lifted))}<p class="relay-read loom-count">${lifted} of ${c.slots} slots</p>`);
    el.onclick = e => {
      const b = (e.target as HTMLElement).closest('button'); if (!b || b.disabled) return; e.stopPropagation();
      if (+(b.dataset.lift ?? -1) !== lifted) { g.toast('Left to right, one at a time', 1000); return; }
      const r = st.act('lift'); if (!r.ok) return; sfx.place();
      if (r.events.includes('band-weaves')) { guided(); el.onclick = null; sfx.chime(); setTimeout(() => ruleCard(), 1300); return; }
      guided();
    };
  };
  const ruleCard = () => {
    show(`${head()}<p class="relay-read">The band weaves a little. Three common words, <b>three pieces</b>.</p><p class="relay-notes">${c.rule}</p>
      <div class="story-choices"><button class="primary" data-act="next">Got it</button></div>`);
    el.onclick = e => { const b = (e.target as HTMLElement).closest('button'); if (!b) return; e.stopPropagation(); sfx.tap(); predict(); };
  };
  const predict = () => {
    view = 'predict'; o.onShake?.(); sfx.whisper();
    show(`${head('JAMMED')}<p class="relay-read">The Warden jammed in a long message:</p><p class="relay-notes loom-msg">“${c.jammed.text}”</p>
      <p class="relay-read">How many <b>slots</b> will the loom need for it?</p>
      <div class="story-choices">${order.map(p => `<button class="primary" data-p="${p.action}" data-action="${p.action}">${p.label}</button>`).join('')}</div>`);
    el.onclick = e => {
      const b = (e.target as HTMLElement).closest('button'); if (!b?.dataset.p) return; e.stopPropagation(); sfx.tap();
      const r = st.act(b.dataset.p); if (!r.ok) return;
      const right = r.judged[0]?.correct, first = r.judged[0]?.first, n = c.jammed.pieces.flat().length;
      el.onclick = null;
      show(`${head('JAMMED')}<p class="relay-read">${right ? (first ? 'Right!' : 'Right this time.') : 'Not quite.'} The loom splits it into <b>${n} pieces</b>:</p>
        <div class="loom-pieces">${pieceChips(c.jammed, c.slots)}</div>${rail(c.jammed.pieces.flat().slice(0, c.slots), n - c.slots)}
        <p class="relay-read">${n} pieces, ${c.slots} slots. <b>Too many!</b> Rare words and names break into parts.</p>
        <div class="story-choices"><button class="primary" data-act="next">Weave your own call</button></div>`);
      if (!right) sfx.boing(); else sfx.chime();
      el.onclick = ev => { const bb = (ev.target as HTMLElement).closest('button'); if (!bb) return; ev.stopPropagation(); sfx.tap(); build(); };
    };
  };
  const build = (msg = 'Weave a call that frees Tavi: <b>do what</b>, <b>who</b>, <b>from what</b>. It must fit <b>six slots</b>.') => {
    view = 'build';
    const full = PARTS.every(p => placed(p));
    show(`${head()}<p class="relay-read">${msg}</p>
      ${PARTS.map(p => `<div class="loom-row"><span class="loom-row-label">${PART_LABEL[p]}</span>${partOrder[p].map(o => `<button class="chip loom-tile${st.state[p] === o.id ? ' picked' : ''}" data-part="${p}" data-o="${o.id}" data-action="${p}.${o.id}">${o.text}</button>`).join('')}</div>`).join('')}
      <div class="loom-call" aria-label="Your call">${PARTS.map(p => { const o = placed(p); return o ? `<button class="loom-call-word" data-clear="${p}" data-action="${p}.clear">${o.text}</button>` : `<span class="loom-call-gap">${PART_LABEL[p].toLowerCase()}…</span>`; }).join('')}</div>
      <div class="story-choices"><button class="primary" data-act="weave" data-action="weave" ${full ? '' : 'disabled'}>Weave</button></div>`);
    el.onclick = e => {
      const b = (e.target as HTMLElement).closest('button'); if (!b || (b as HTMLButtonElement).disabled) return; e.stopPropagation(); sfx.tap();
      if (b.dataset.clear) { st.act(`${b.dataset.clear}.clear`); build(); return; }
      if (b.dataset.part) {
        const p = b.dataset.part as LoomPart;
        if (st.state[p] === b.dataset.o) { st.act(`${p}.clear`); build(); return; }   // tapped again: off the rail
        if (st.state[p] !== 'none') st.act(`${p}.clear`);                                 // another choice: swap it
        if (st.act(`${p}.${b.dataset.o}`).ok) sfx.place(); build(); return;
      }
      if (b.dataset.act === 'weave') weave();
    };
  };
  // the loom splits the call, piece by piece onto the rail; what doesn't fit falls off the end
  const weave = () => {
    const words = PARTS.map(p => placed(p)!), m: LoomMessage = { id: 'built', text: words.map(o => o.text).join(' '), pieces: words.flatMap(o => o.pieces.map(x => [...x])) };
    const r = st.act('weave'); if (!r.ok) return;
    const flat = m.pieces.flat(), n = flat.length, kept = flat.slice(0, c.slots), ok = r.events.includes('tavi-free');
    el.onclick = null; sfx.whoosh(); o.onWeave?.(n, ok);
    show(`${head(ok ? 'WEAVING' : 'JAMMED')}<div class="loom-pieces weaving">${pieceChips(m, c.slots)}</div>${rail(kept, n - c.slots)}
      <p class="relay-read loom-verdict" hidden></p><div class="story-choices" hidden></div>`);
    // the pieces fly onto the rail one by one (the split is the reveal)
    el.querySelectorAll<HTMLElement>('.loom-piece').forEach((x, i) => { x.style.animationDelay = `${i * 110}ms`; });
    el.querySelectorAll<HTMLElement>('.loom-slot.full').forEach((x, i) => { x.style.animationDelay = `${i * 110 + 80}ms`; });
    setTimeout(() => {
      const v = el.querySelector<HTMLElement>('.loom-verdict')!, ch = el.querySelector<HTMLElement>('.story-choices')!; v.hidden = false;
      if (ok) {
        sfx.chime(); g.toast('It fits!', 1200);
        v.innerHTML = `<b>${n} pieces</b>, ${c.slots} slots. <b>It fits.</b> The band weaves: “${m.text}.”`;
        setTimeout(() => { close(); o.onDone(); }, 2600);
        return;
      }
      sfx.boing(); g.toast('Too many pieces!', 1200); o.onShake?.();
      const split = words.filter(w => w.pieces.flat().length > w.pieces.length).map(w => `“${w.text}”`);
      v.innerHTML = `<b>${n} pieces</b> for ${c.slots} slots. The end fell off: the loom wove “${kept.join(' ')}…”${split.length ? ` ${split.join(' and ')} broke into parts.` : ''}`;
      ch.hidden = false; ch.innerHTML = '<button class="primary" data-act="again">Change the call</button>';
      el.onclick = ev => { const bb = (ev.target as HTMLElement).closest('button'); if (!bb) return; ev.stopPropagation(); sfx.tap(); build('Count <b>pieces</b>, not letters. Change a word or two, then weave again.'); };
    }, n * 110 + 700);
  };

  return {
    get active() { return active; },
    get view() { return view; },
    /** open at whatever step the rules are on */
    open() {
      const p = st.state.phase;
      if (p === 'guided') guided(); else if (p === 'predict') predict(); else if (p === 'build') build();
    },
    close,
  };
}
