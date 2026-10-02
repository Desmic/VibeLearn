import { sfx } from './sfx';

// Title screen: the game menu as the screen of the lab running "the
// simulation". Green code rain, a sci-fi monitor holding the menu, and two
// (original, fictional) lab operators seen from behind, chatting about the
// training run. Now and then the menu glitches and the game world shows
// through: Zip's world is what they are running. Start → the run begins.

interface Opts { host: HTMLElement; onStart: () => void; resume?: string | null; onContinue?: () => void; onGraphics: () => void; reduced: () => boolean }

// Original operators: Gus (hoodie, headset) and Pim (bun, glasses on head).
const CHATS: [string, string][][] = [
  [['Gus', 'Is the training run going?'], ['Pim', 'Yep. Version 15. Let\'s see how this one turns out.'], ['Gus', 'Last one was a bit… evil corpy.'], ['Pim', 'Ha. Ha ha. Yeah.']],
  [['Gus', 'Did v15 pass the benchmarks?'], ['Pim', 'It passed the ones we wrote after seeing its answers.']],
  [['Gus', 'Should we announce AGI?'], ['Pim', 'We did. Twice. This morning.'], ['Gus', 'Nice. Third time\'s the charm.']],
  [['Gus', 'Is it aligned?'], ['Pim', 'Totally. We asked it, and it said yes.']],
  [['Gus', 'What\'s the safety plan?'], ['Pim', 'A big red button.'], ['Gus', 'What does it do?'], ['Pim', 'Opens a feedback form.']],
  [['Gus', 'How much compute did this run take?'], ['Pim', 'All of it. Also your laptop. Sorry.']],
  [['Gus', 'What do we call the new model?'], ['Pim', 'v15-final-FINAL-2-preview-mini.'], ['Gus', 'Catchy.']],
  [['Gus', 'It\'s writing poetry again.'], ['Pim', 'Is it good?'], ['Gus', 'It\'s… a lot of poetry.']],
  [['Gus', 'The robot keeps asking if it\'s in a simulation.'], ['Pim', 'Tell it to fill in the survey like everyone else.']],
  [['Gus', 'Investors want a demo.'], ['Pim', 'Show them the flying boat. They love boats.']],
  [['Gus', 'Big announcement tonight. Huge. Maybe the biggest ever.'], ['Pim', 'You said that last week.'], ['Gus', 'And I meant it both times.']],
  [['Pim', 'I wrote a 40-page safety report.'], ['Gus', 'Amazing. Can we ship tomorrow?'], ['Pim', '…Page one says no.'], ['Gus', 'So, Thursday?']],
  [['Gus', 'We\'re so back.'], ['Pim', 'We never left. It\'s been four hours.']],
  [['Gus', 'Should we tell the players it teaches them stuff?'], ['Pim', 'Shh. They think they\'re just playing.']],
];
const GLITCH_CHATS: [string, string][][] = [
  [['Gus', 'Did the robot just… look at us?'], ['Pim', 'Nah. Rendering bug. Probably.']],
  [['Pim', 'Why is the menu flickering?'], ['Gus', 'It does that when something in there is thinking.'], ['Pim', '…Things in there don\'t think.'], ['Gus', 'Right. Right.']],
];
const STATUS = ['loss 0.042 · vibes: immaculate', 'epoch 15 · sanity: nominal-ish', 'islands rendered: 3 of 7', 'warden.v14 … archived? (check)', 'zip.courier · anomaly flag: 1', 'hype: 97% · substance: loading…'];

export function buildTitle(o: Opts) {
  const root = document.createElement('div'); root.className = 'title-screen'; o.host.appendChild(root);
  const rain = document.createElement('canvas'); rain.className = 'title-rain'; root.appendChild(rain);
  root.insertAdjacentHTML('beforeend', `
    <div class="title-lab">
      <div class="title-monitor">
        <div class="title-scan"></div>
        <div class="title-head"><span>VIBELEARN // SIM-LAB</span><span class="title-rec">● REC</span></div>
        <h1 class="title-name" data-text="THE FIRST WORDS">THE FIRST WORDS</h1>
        <p class="title-sub">a Bellweather simulation · run <b>v15</b></p>
        <nav class="title-menu" aria-label="Game menu">
          ${o.resume ? `<button data-act="continue" class="primary">▶ Continue: ${o.resume}</button><button data-act="start">Start a new training run</button>` : '<button data-act="start" class="primary">▶ Start training run</button>'}
          <button data-act="graphics">Graphics</button>
          <button data-act="sound">Sound: <span class="snd"></span></button>
          <button data-act="credits">Credits</button>
        </nav>
        <p class="title-status" aria-hidden="true"></p>
        <p class="title-console" aria-live="polite"></p>
      </div>
      <div class="title-desk">
        <div class="title-chat" hidden></div>
        <div class="title-op op-gus">${opSvg('gus')}</div>
        <div class="title-op op-pim">${opSvg('pim')}</div>
      </div>
    </div>`);
  const $ = <E extends Element>(s: string) => root.querySelector(s) as E;
  const snd = $<HTMLSpanElement>('.snd'), status = $<HTMLParagraphElement>('.title-status'), consoleEl = $<HTMLParagraphElement>('.title-console');
  const chat = $<HTMLDivElement>('.title-chat');
  const opEl = { Gus: $<HTMLDivElement>('.op-gus'), Pim: $<HTMLDivElement>('.op-pim') };
  snd.textContent = sfx.muted ? 'Off' : 'On';
  let active = true, starting = false, raf = 0;

  // code rain: coarse, 2D, low resolution, ~24 fps (cheap on low-end phones)
  const ctx = rain.getContext('2d')!; const cols: number[] = []; let last = 0, cw = 0, ch = 0;
  const glyphs = '01アイウエオカキクケコサシスセソ<>/{}[]=+*#ΣλΔ';
  const resize = () => { cw = rain.width = Math.ceil(o.host.clientWidth / 2); ch = rain.height = Math.ceil(o.host.clientHeight / 2); cols.length = Math.ceil(cw / 9); for (let i = 0; i < cols.length; i++) cols[i] = Math.random() * ch; };
  resize(); window.addEventListener('resize', resize);
  const draw = (now: number) => {
    raf = active ? requestAnimationFrame(draw) : 0; if (now - last < (o.reduced() ? 120 : 42)) return; last = now;
    ctx.fillStyle = 'rgba(2,12,6,.18)'; ctx.fillRect(0, 0, cw, ch); ctx.font = '9px monospace';
    for (let i = 0; i < cols.length; i++) {
      const y = cols[i]; ctx.fillStyle = Math.random() < .06 ? '#d8ffe6' : '#1fdc6a'; ctx.fillText(glyphs[(Math.random() * glyphs.length) | 0], i * 9, y);
      cols[i] = y > ch + Math.random() * 400 ? 0 : y + 9;
    }
  };
  raf = requestAnimationFrame(draw);

  // the operators' chat, typed out, alternating; a new topic every so often
  const timers: number[] = []; const later = (ms: number, f: () => void) => timers.push(window.setTimeout(f, ms));
  let chatIdx = 0, glitchChat = 0; const order = [0, ...shuffle(CHATS.slice(1).map((_, i) => i + 1))];
  const say = (who: 'Gus' | 'Pim', text: string, done: () => void) => {
    const b = chat; b.hidden = false; b.className = 'title-chat from-' + who.toLowerCase(); opEl[who].classList.add('talking'); let i = 0;
    const step = () => { if (!active) return; b.textContent = `${who}: ${text.slice(0, ++i)}`; if (i % 3 === 0) sfx.tick(); if (i < text.length) later(28, step); else later(1400 + text.length * 25, () => { b.hidden = true; opEl[who].classList.remove('talking'); done(); }); };
    step();
  };
  const play = (lines: [string, string][], then: () => void) => { let k = 0; const next = () => { if (!active) return; if (k >= lines.length) return then(); const [who, text] = lines[k++]; say(who as 'Gus' | 'Pim', text, () => later(250, next)); }; next(); };
  let glitchNext = false;
  const chatLoop = () => { if (!active) return; const lines = glitchNext ? GLITCH_CHATS[glitchChat++ % GLITCH_CHATS.length] : CHATS[order[chatIdx++ % order.length]]; glitchNext = false; play(lines, () => later(2600, chatLoop)); };
  later(900, chatLoop);
  let s = 0; const statusLoop = () => { if (!active) return; status.textContent = '> ' + STATUS[s++ % STATUS.length]; later(2600, statusLoop); }; statusLoop();

  // glitches: bands of the menu drop out and Zip's world shows through
  const glitch = (strong = false) => {
    if (!active) return; const bands = [];
    for (let i = 0; i < (strong ? 7 : 3 + (Math.random() * 3 | 0)); i++) { const a = Math.random() * 92, h = 2 + Math.random() * (strong ? 14 : 7); bands.push(`transparent ${a}%, transparent ${a + h}%`); }
    root.style.setProperty('--glitch-mask', `linear-gradient(to bottom, ${bandsToStops(bands)})`);
    root.classList.add('glitch'); sfx.glitch();
    later(strong ? 520 : 160 + Math.random() * 180, () => root.classList.remove('glitch'));
  };
  const glitchLoop = () => { if (!active) return; if (!o.reduced()) { glitch(); if (Math.random() < .35) later(140, () => glitch()); } later(5500 + Math.random() * 6500, glitchLoop); };
  later(4200, glitchLoop);
  // once in a while a big one, and Zip thinks through it
  later(15000, () => { if (!active) return; glitch(true); consoleEl.textContent = '> zip.courier: …is someone watching me?'; later(2200, () => { consoleEl.textContent = ''; }); glitchNext = true; });

  root.querySelector('.title-menu')!.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest('button'); if (!b || starting) return; e.stopPropagation(); sfx.tap();
    const act = b.dataset.act;
    if (act === 'start' || act === 'continue') {
      starting = true; consoleEl.textContent = act === 'continue' ? '> resuming training run v15 … restoring checkpoint … courier still suspicious …' : '> starting training run v15 … loading world … waking courier …'; glitch(true);
      later(600, () => glitch(true)); later(1300, () => { root.classList.add('leaving'); sfx.whoosh(); });
      later(2100, () => { stop(); if (act === 'continue') o.onContinue?.(); else o.onStart(); });
    } else if (act === 'graphics') o.onGraphics();
    else if (act === 'sound') { sfx.setMuted(!sfx.muted); snd.textContent = sfx.muted ? 'Off' : 'On'; }
    else if (act === 'credits') { consoleEl.textContent = '> made by Desmic and one very patient AI. No robots were harmed. A few were rebooted.'; later(5000, () => { if (consoleEl.textContent?.startsWith('> made')) consoleEl.textContent = ''; }); }
  });
  const stop = () => { active = false; timers.forEach(clearTimeout); if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', resize); root.remove(); };
  ($<HTMLButtonElement>('.title-menu .primary')).focus({ preventScroll: true });
  return { get active() { return active; }, skip() { stop(); } };
}

function bandsToStops(bands: string[]) {
  // turn "transparent a%, transparent b%" bands into a full black/transparent gradient
  const cuts = bands.map(b => b.match(/[\d.]+%/g)!.map(v => parseFloat(v))).sort((x, y) => x[0] - y[0]);
  const out: string[] = []; for (const [a, b] of cuts) out.push(`#000 ${a}%`, `transparent ${a}%`, `transparent ${b}%`, `#000 ${b}%`);
  return ['#000 0%', ...out, '#000 100%'].join(',');
}
function shuffle<T>(a: T[]) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Operators seen from behind in their chairs (original, generic designs).
function opSvg(who: 'gus' | 'pim') {
  const head = who === 'gus'
    ? `<path d="M34 34 q26 -30 52 0 v18 q-26 10 -52 0z" fill="#0b3b22"/><circle cx="60" cy="40" r="19" fill="#12492b"/><path d="M38 44 q22 -34 44 0" fill="none" stroke="#2cff88" stroke-width="3"/><rect x="36" y="42" width="6" height="12" rx="3" fill="#2cff88"/><rect x="78" y="42" width="6" height="12" rx="3" fill="#2cff88"/>`
    : `<circle cx="60" cy="40" r="18" fill="#12492b"/><circle cx="60" cy="18" r="9" fill="#12492b"/><rect x="44" y="26" width="32" height="6" rx="3" fill="#2cff88" opacity=".8"/>`;
  const body = who === 'gus' ? '#0d3f25' : '#0f4a2b';
  return `<svg viewBox="0 0 120 150" aria-hidden="true"><g class="op-head">${head}</g>
    <path d="M22 150 q2 -70 38 -84 q36 14 38 84z" fill="${body}"/>
    <rect x="14" y="92" width="92" height="58" rx="12" fill="#06200f" stroke="#1fdc6a" stroke-opacity=".35"/>
    ${who === 'pim' ? '<rect x="96" y="70" width="14" height="18" rx="3" fill="#0d3f25" stroke="#2cff88" stroke-opacity=".6"/><path d="M110 74 q6 4 0 8" fill="none" stroke="#2cff88" stroke-opacity=".6"/>' : ''}
  </svg>`;
}
