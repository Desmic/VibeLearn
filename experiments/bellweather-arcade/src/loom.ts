import type { Guide } from './guide';
import type { Station } from './kit/station';
import type { LoomContent, LoomMessage } from './worlds/stop2-loom';
import { sfx } from './sfx';

// The Word Loom's console (Stop 2). It draws the six slots and the pieces and
// sends actions to the station; the rules (worlds/stop2-loom.ts) judge every
// choice and the station logs it. Three tries, as the house rule says:
//  1. guided: lift "Free | the | weaver" onto the rail (can't fail)
//  2. predict: how many slots will the Warden's long message need? (can fail)
//  3. choose: a call short in letters but long in pieces, or the other way (tricks you)

interface Opts { guide: Guide; host: HTMLElement; station: Station; onDone: () => void; onShake?: () => void }

const COLORS = ['#ffb36b', '#9fe0d0', '#f6a9c0', '#cdb8ff', '#ffe08a', '#8fd3ff'];

export function buildLoom(o: Opts) {
  const g = o.guide, st = o.station, c = st.spec.content as unknown as LoomContent;
  const el = document.createElement('div'); el.className = 'loom-console'; el.hidden = true; o.host.appendChild(el);
  let active = false, view: 'guided' | 'predict' | 'choose' = 'guided';
  // the options in a shuffled order, so the right one can't be learnt by position
  const order = c.predict.map(p => ({ p, k: Math.random() })).sort((a, b) => a.k - b.k).map(x => x.p);
  const choiceOrder = c.choices.map(x => ({ x, k: Math.random() })).sort((a, b) => a.k - b.k).map(y => y.x);

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
      <div class="rail-chips">${words.map((w, i) => `<button class="chip${i < lifted ? ' picked' : ''}" data-lift="${i}" ${i < lifted ? 'disabled' : ''}>${w}</button>`).join('')}</div>
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
      <div class="story-choices">${order.map(p => `<button class="primary" data-p="${p.action}">${p.label}</button>`).join('')}</div>`);
    el.onclick = e => {
      const b = (e.target as HTMLElement).closest('button'); if (!b?.dataset.p) return; e.stopPropagation(); sfx.tap();
      const r = st.act(b.dataset.p); if (!r.ok) return;
      const right = r.judged[0]?.correct, first = r.judged[0]?.first, n = c.jammed.pieces.flat().length;
      el.onclick = null;
      show(`${head('JAMMED')}<p class="relay-read">${right ? (first ? 'Right!' : 'Right this time.') : 'Not quite.'} The loom splits it into <b>${n} pieces</b>:</p>
        <div class="loom-pieces">${pieceChips(c.jammed, c.slots)}</div>${rail(c.jammed.pieces.flat().slice(0, c.slots), n - c.slots)}
        <p class="relay-read">${n} pieces, ${c.slots} slots. <b>Too many!</b> Rare words and names break into parts.</p>
        <div class="story-choices"><button class="primary" data-act="next">Send a shorter call</button></div>`);
      if (!right) sfx.boing(); else sfx.chime();
      el.onclick = ev => { const bb = (ev.target as HTMLElement).closest('button'); if (!bb) return; ev.stopPropagation(); sfx.tap(); choose(); };
    };
  };
  const choose = (msg = 'Pick the call that <b>fits six slots</b> and still says who to free.') => {
    view = 'choose';
    show(`${head()}<p class="relay-read">${msg}</p>
      <div class="loom-choices">${choiceOrder.map(x => `<button class="loom-choice" data-c="${x.action}">“${x.message.text}”</button>`).join('')}</div>`);
    el.onclick = e => {
      const b = (e.target as HTMLElement).closest('button'); if (!b?.dataset.c) return; e.stopPropagation(); sfx.tap();
      const r = st.act(b.dataset.c); if (!r.ok) return;
      const m = c.choices.find(x => x.action === b.dataset.c)!.message, n = m.pieces.flat().length;
      el.onclick = null;
      if (r.events.includes('tavi-free')) {
        sfx.chime(); g.toast('It fits!', 1200);
        show(`${head('WEAVING')}<div class="loom-pieces">${pieceChips(m)}</div>${rail(m.pieces.flat())}
          <p class="relay-read">${n} pieces, ${c.slots} slots. <b>It fits</b>, name and all.</p>`);
        setTimeout(() => { close(); o.onDone(); }, 2200);
        return;
      }
      sfx.boing(); g.toast('Too many pieces!', 1200);
      const kept = m.pieces.flat().slice(0, c.slots);
      show(`${head('JAMMED')}<div class="loom-pieces">${pieceChips(m, c.slots)}</div>${rail(kept, n - c.slots)}
        <p class="relay-read">Fewer letters, but <b>${n} pieces</b>. The last ones fell off: the loom wove “${kept.join('')}…” Free <b>who?</b></p>
        <div class="story-choices"><button class="primary" data-act="again">Try the other call</button></div>`);
      el.onclick = ev => { const bb = (ev.target as HTMLElement).closest('button'); if (!bb) return; ev.stopPropagation(); sfx.tap(); choose('Count <b>pieces</b>, not letters. Which call fits six slots?'); };
    };
  };

  return {
    get active() { return active; },
    get view() { return view; },
    /** open at whatever step the rules are on */
    open() {
      const p = st.state.phase;
      if (p === 'guided') guided(); else if (p === 'predict') predict(); else if (p === 'choose') choose();
    },
    close,
  };
}
