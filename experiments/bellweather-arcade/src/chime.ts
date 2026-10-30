import type { Guide } from './guide';
import type { Station } from './kit/station';
import { spread, type ChimeContent, type ChimeTable, type Warmth } from './worlds/stop3-chime';
import { sfx } from './sfx';

// The chime tower's console (Stop 3). It draws the engine's guess fan (bar length and glow =
// probability), the warmth dial and the cast; every cast spins a light across the fan that lands
// on a word. The rules (worlds/stop3-chime.ts) judge each step; the spin only shows what they
// judged, drawn from the same spread. Steps:
//  1. guided: cast twice at the tower, same words in, two different words out (can't fail)
//  2. predict: turned cold, what will five casts say? (committed before they're shown)
//  3. the vault lock: set the warmth, cast (needs the exact word: cold)
//  4. the bard: set the warmth, cast (needs a line the crowd hasn't heard: warm)

interface Opts {
  guide: Guide; host: HTMLElement; station: Station; onDone: () => void;
  /** in-world echoes: the vault opens / grinds / jams; the crowd cheers / groans / laughs; a cast lands */
  onWorld?: (what: 'vault-opens' | 'lock-grinds' | 'lock-jams' | 'crowd-cheers' | 'heard-it' | 'word-salad' | 'cast', word?: string) => void;
}

const WARMTH_LABEL: Record<Warmth, string> = { cold: 'Cold', warm: 'Warm', hot: 'Hot' };

export function buildChime(o: Opts) {
  const g = o.guide, st = o.station, c = st.spec.content as unknown as ChimeContent;
  const el = document.createElement('div'); el.className = 'chime-console'; el.hidden = true; o.host.appendChild(el);
  let active = false, view: 'guided' | 'predict' | 'lock' | 'bard' = 'guided', busy = false;
  const order = c.predict.map(p => ({ p, k: Math.random() })).sort((a, b) => a.k - b.k).map(x => x.p);
  const warmth = () => st.state.warmth as Warmth;
  const head = (right = '') => `<div class="relay-head">CHIME TOWER${right ? ` · <span class="chime-w ${right.toLowerCase()}">${right}</span>` : ''}</div>`;
  const ring = (t: ChimeTable, out = '') => `<div class="chime-ring">${t.ring.map(w => `<span class="chip">${w}</span>`).join('')}<span class="chip empty${out ? ' made' : ''}">${out || '…'}</span></div>`;
  // the fan: one bar per guess, its length and glow its chance at this warmth
  const fan = (t: ChimeTable, w: Warmth) => `<div class="chime-fan" data-w="${w}">${spread(t, w).map(x => `<div class="chime-guess${x.sense ? '' : ' odd'}" data-word="${x.word}"><span class="chime-word">${x.word}</span><span class="chime-bar"><i style="width:${Math.max(2, x.p * 100).toFixed(1)}%;opacity:${(.35 + .65 * Math.min(1, x.p * 1.6)).toFixed(2)}"></i></span><span class="chime-pc">${Math.round(x.p * 100)}%</span></div>`).join('')}</div>`;
  // the same fan, reshaped in place (so the bars glide: the dial visibly sharpens or flattens it)
  const reshape = (t: ChimeTable, w: Warmth) => {
    const f = el.querySelector<HTMLElement>('.chime-fan'); if (!f) return; f.dataset.w = w;
    for (const x of spread(t, w)) { const row = f.querySelector<HTMLElement>(`.chime-guess[data-word="${x.word}"]`); if (!row) continue;
      const bar = row.querySelector<HTMLElement>('i')!; bar.style.width = `${Math.max(2, x.p * 100).toFixed(1)}%`; bar.style.opacity = (.35 + .65 * Math.min(1, x.p * 1.6)).toFixed(2); row.querySelector('.chime-pc')!.textContent = `${Math.round(x.p * 100)}%`; }
  };
  const dial = (w: Warmth) => `<div class="chime-dial" role="radiogroup" aria-label="Warmth">${(['cold', 'warm', 'hot'] as Warmth[]).map(x => `<button class="chime-notch ${x}${x === w ? ' on' : ''}" role="radio" aria-checked="${x === w}" data-dial="${x}" data-action="dial.${x}">${WARMTH_LABEL[x]}</button>`).join('')}</div>`;
  const show = (html: string) => { el.innerHTML = html; el.hidden = false; active = true; o.host.classList.add('puzzle-mode'); };
  const close = () => { el.hidden = true; active = false; o.host.classList.remove('puzzle-mode'); el.onclick = null; };
  const say = (html: string) => { const r = el.querySelector('.relay-read.chime-say'); if (r) r.innerHTML = html; };

  // the spin: a light runs down the fan a few times, slowing, and stops on `word`
  const spin = (word: string, done: () => void, quick = false) => {
    const rows = [...el.querySelectorAll<HTMLElement>('.chime-guess')], target = rows.findIndex(r => r.dataset.word === word);
    rows.forEach(r => r.classList.remove('landed'));
    const steps = (quick ? 1 : 2) * rows.length + target; let i = 0;
    const tick = () => {
      rows.forEach((r, k) => r.classList.toggle('lit', k === i % rows.length)); sfx.tick();
      if (i >= steps) { rows[target].classList.add('landed'); sfx.bell(Math.max(0, 4 - target), .7); o.onWorld?.('cast', word); setTimeout(done, quick ? 260 : 520); return; }
      i++; setTimeout(tick, (quick ? 28 : 45) + Math.pow(i / steps, 3) * (quick ? 90 : 260));
    };
    tick();
  };

  const guided = () => {
    view = 'guided'; const n = st.state.casts as number;
    show(`${head()}<p class="relay-read chime-say">Ask the tower when the bell rings. <b>Cast</b> to hear its answer.</p>${ring(c.tower)}${fan(c.tower, 'warm')}
      <div class="story-choices"><button class="primary" data-act="cast" data-action="cast">${n ? 'Cast again, same words' : 'Cast'}</button></div>`);
    el.onclick = e => {
      const b = (e.target as HTMLElement).closest('button'); if (!b || busy) return; e.stopPropagation();
      const r = st.act('cast'); if (!r.ok) return; busy = true; sfx.whoosh();
      const word = c.guidedLands[(st.state.casts as number) - 1];
      el.querySelector('.story-choices')!.innerHTML = '';
      spin(word, () => {
        busy = false; el.querySelector('.chime-ring .empty')!.textContent = word; el.querySelector('.chime-ring .empty')!.classList.add('made');
        if (r.events.includes('dial-found')) {
          say(`<b>“${word}”</b> this time. Same words in, a different word out: it picks <b>by brightness</b>, not always the brightest.`);
          el.querySelector('.story-choices')!.innerHTML = '<button class="primary" data-act="next">Next</button>';
          el.onclick = ev => { if (!(ev.target as HTMLElement).closest('button')) return; ev.stopPropagation(); sfx.tap(); dialFound(); };
        } else { say(`The tower says <b>“${word}”</b>. Cast again, same words.`); el.querySelector('.story-choices')!.innerHTML = '<button class="primary" data-act="cast" data-action="cast">Cast again, same words</button>'; }
      });
    };
  };
  // the dial is found: try it before any question (run 30 tapped Hot here and was dropped straight into
  // the quiz: "let me play with the dials before quizzing me on them"). Turning it only reshapes the fan
  // here; nothing is judged, so the notches carry no rules action.
  const DIAL_SAYS: Record<Warmth, string> = {
    cold: '<b>Cold</b>: the fan sharpens. Only the brightest guess is left lit.',
    warm: '<b>Warm</b>: the fan as the engine learned it. Bright guesses come out most, dim ones sometimes.',
    hot: '<b>Hot</b>: the fan flattens. Even the dim, odd guesses get a real chance.',
  };
  const dialFound = () => {
    let w: Warmth = 'warm';
    const plain = (x: Warmth) => dial(x).replace(/ data-action="[^"]*"/g, '');
    show(`${head()}<p class="relay-read chime-say">Something new clicks into Zip's engine: a <b>warmth dial</b>. Try it: it reshapes the fan.</p>${ring(c.tower)}${fan(c.tower, w)}${plain(w)}
      <p class="relay-notes">${c.honesty}</p><div class="story-choices"><button class="primary" data-act="next">Got it</button></div>`);
    el.onclick = e => {
      const b = (e.target as HTMLElement).closest('button'); if (!b) return; e.stopPropagation();
      if (b.dataset.dial) { w = b.dataset.dial as Warmth; sfx.tap(); reshape(c.tower, w); el.querySelector('.chime-dial')!.outerHTML = plain(w); say(DIAL_SAYS[w]); return; }
      sfx.tap(); predict();
    };
  };
  const predict = () => {
    view = 'predict';
    show(`${head()}${ring(c.tower)}${fan(c.tower, 'warm')}<p class="relay-read">Turn the dial to <b>cold</b> and cast <b>five times</b>. What comes out?</p>
      <div class="story-choices">${order.map(p => `<button class="primary" data-p="${p.action}" data-action="${p.action}">${p.label}</button>`).join('')}</div>`);
    el.onclick = e => {
      const b = (e.target as HTMLElement).closest('button'); if (!b?.dataset.p || busy) return; e.stopPropagation(); sfx.tap();
      const r = st.act(b.dataset.p); if (!r.ok) return; busy = true;
      const right = r.judged[0]?.correct, first = r.judged[0]?.first, top = c.tower.guesses[0].word;
      // the dial turns cold and the fan sharpens; five casts, all the brightest
      show(`${head('COLD')}${ring(c.tower)}${fan(c.tower, 'warm')}<p class="relay-read chime-say">Turning it cold…</p><div class="story-choices"></div>`);
      setTimeout(() => {
        reshape(c.tower, 'cold'); sfx.hum(.6);
        let k = 0; const again = () => { if (k++ >= 5) { finish(); return; } spin(top, again, true); };
        setTimeout(again, 700);
      }, 900);
      const finish = () => {
        busy = false;
        say(`${right ? (first ? 'Right!' : 'Right this time.') : 'Not quite.'} Cold, the fan sharpens until only <b>“${top}”</b> is lit: <b>five times out of five</b>.`);
        el.querySelector('.story-choices')!.innerHTML = '<button class="primary" data-act="next">To the bell vault</button>';
        el.onclick = ev => { if (!(ev.target as HTMLElement).closest('button')) return; ev.stopPropagation(); sfx.tap(); lock(); };
        if (!right) sfx.boing(); else sfx.chime();
      };
    };
  };
  // a machine: the ring, the fan at the dial's warmth, the dial, and Cast
  const machine = (which: 'lock' | 'bard', msg: string) => {
    view = which; const t = which === 'lock' ? c.lock : c.bard;
    show(`${head(WARMTH_LABEL[warmth()].toUpperCase())}<p class="relay-read chime-say">${msg}</p>${ring(t)}${fan(t, warmth())}${dial(warmth())}
      <div class="story-choices"><button class="primary" data-act="cast" data-action="cast.${which}">Cast</button></div>`);
    el.onclick = e => {
      const b = (e.target as HTMLElement).closest('button'); if (!b || busy) return; e.stopPropagation();
      if (b.dataset.dial) {
        if (b.dataset.dial === warmth()) return;
        if (!st.act(`dial.${b.dataset.dial}`).ok) return; sfx.tap();
        reshape(t, warmth());
        el.querySelector('.chime-dial')!.outerHTML = dial(warmth());
        el.querySelector('.relay-head')!.outerHTML = head(WARMTH_LABEL[warmth()].toUpperCase());
        return;
      }
      if (b.dataset.act !== 'cast') return;
      const r = st.act(`cast.${which}`); if (!r.ok) return; busy = true; sfx.whoosh();
      for (const x of el.querySelectorAll<HTMLButtonElement>('.chime-notch, .story-choices button')) x.disabled = true;
      const ev = (e2: string) => r.events.includes(e2);
      // what the spin lands on agrees with the judgement: cold → the brightest; a wrong warm → a
      // sensible dim guess; hot → a nonsense one; the bard's warm → a fresh sensible line
      const sens = t.guesses.filter(x => x.sense).slice(1), odd = t.guesses.filter(x => !x.sense);
      const pick = <X,>(xs: X[]) => xs[Math.floor(Math.random() * xs.length)];
      const word = warmth() === 'cold' ? t.guesses[0].word : warmth() === 'hot' ? pick(odd).word : pick(sens).word;
      spin(word, () => {
        busy = false; const gap = el.querySelector('.chime-ring .empty')!; gap.textContent = word; gap.classList.add('made');
        const done = (html: string, next: () => void, label: string) => { say(html); el.querySelector('.story-choices')!.innerHTML = `<button class="primary" data-act="next">${label}</button>`; el.onclick = e3 => { if (!(e3.target as HTMLElement).closest('button')) return; e3.stopPropagation(); sfx.tap(); next(); }; };
        if (ev('vault-opens')) { o.onWorld?.('vault-opens'); sfx.chime(); g.toast('The vault opens!', 1300); done(`<b>“${word}”</b>, exactly. The lock turns and the vault swings open. <b>Cold</b>: no surprises.`, () => machine('bard', `Oriel needs a line the crowd <b>hasn't heard</b>: “${c.bard.verse} …”. Set the warmth, then cast.`), 'To the bard'); return; }
        if (ev('lock-grinds')) { o.onWorld?.('lock-grinds'); sfx.boing(); done(`<b>“${word}”</b>? The lock grinds. Warm, it might have said “${c.lock.needs}”, it might not. A lock can't take chances.`, () => machine('lock', 'Set the warmth for the lock, then cast.'), 'Try again'); return; }
        if (ev('lock-jams')) { o.onWorld?.('lock-jams'); sfx.zap(); done(`<b>“${word}”</b>?! The lock jams. Hot, even the dimmest guesses come out.`, () => machine('lock', 'Set the warmth for the lock, then cast.'), 'Try again'); return; }
        if (ev('heard-it')) { o.onWorld?.('heard-it'); sfx.boing(); done(`“${c.bard.verse} <b>${word}</b>”. The crowd groans: <b>“Heard it!”</b> Cold, the engine sings the same old line every time.`, () => machine('bard', 'Set the warmth for the verse, then cast.'), 'Try again'); return; }
        if (ev('word-salad')) { o.onWorld?.('word-salad'); sfx.boing(); done(`“${c.bard.verse} <b>${word}</b>”? The crowd laughs. Too hot: the oddest guesses come out.`, () => machine('bard', 'Set the warmth for the verse, then cast.'), 'Try again'); return; }
        if (ev('crowd-cheers')) { o.onWorld?.('crowd-cheers'); sfx.chime(); g.toast('The crowd cheers!', 1300); done(`Oriel sings: <b>“${c.bard.verse} ${word}”</b>. A line nobody's heard, and it still makes sense. <b>Warm</b>.`, () => { close(); o.onDone(); }, 'Bravo!'); }
      });
    };
  };
  const lock = () => machine('lock', `The Warden locked the bell vault with the town's own saying: “${c.lock.ring.join(' ')} …”. It opens only to the <b>exact</b> word. Set the warmth, then cast.`);

  return {
    get active() { return active; },
    get view() { return view; },
    /** open at whatever step the rules are on */
    open() {
      const p = st.state.phase;
      if (p === 'guided') guided(); else if (p === 'predict') predict(); else if (p === 'lock') lock();
      else if (p === 'bard') machine('bard', `Oriel needs a line the crowd <b>hasn't heard</b>: “${c.bard.verse} …”. Set the warmth, then cast.`);
    },
    close,
  };
}
