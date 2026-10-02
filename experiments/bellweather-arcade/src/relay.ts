import type { Guide } from './guide';
import { sfx } from './sfx';
import type { Station } from './kit/station';

// Speech 2b: call Mira from the relay (the changed case: new purpose, new
// cards, less help). Two hands-on steps on the relay's own console:
//  1. Tune the dial to a channel and call. The pinned notes say which channel
//     is Mira's; the others are funny dead ends (the Warden picks up on 3).
//  2. The relay has spoken three words; tap the words it should read to make
//     the next one, then Send. Only the whole message reaches Mira.
// First choices are logged apart from retries (same rules as the skiff).

interface Opts { guide: Guide; host: HTMLElement; station: Station; onDone: () => void; ping: () => void }

export function buildRelay(o: Opts) {
  const g = o.guide;
  const el = document.createElement('div'); el.className = 'relay-console'; el.hidden = true; o.host.appendChild(el);
  let active = false; const st = o.station;
  const RELAY_NOTES = String(st.spec.content?.pinned ?? '');
  // what the console shows comes from the rules' state
  const ch = () => st.state.channel as number;
  const pickedNow = () => new Set([0, 1, 2].filter(i => st.state['word' + i]));

  const dialSvg = () => {
    const ticks = Array.from({ length: 9 }, (_, i) => {
      const a = (-135 + i * 33.75) * Math.PI / 180, x = 90 + Math.sin(a) * 70, y = 90 - Math.cos(a) * 70;
      return `<g class="relay-tick${i + 1 === ch() ? ' on' : ''}" data-ch="${i + 1}"><circle cx="${x}" cy="${y}" r="15"/><text x="${x}" y="${y + 5}" text-anchor="middle">${i + 1}</text></g>`;
    }).join('');
    const a = -135 + (ch() - 1) * 33.75;
    return `<svg class="relay-dial" viewBox="0 0 180 180" aria-label="Relay dial, channel ${ch()}"><circle cx="90" cy="90" r="46" class="knob"/><line x1="90" y1="90" x2="90" y2="52" class="needle" transform="rotate(${a} 90 90)"/><circle cx="90" cy="90" r="7" class="hub"/>${ticks}</svg>`;
  };
  const tune = (msg = 'Static… Turn the dial to a channel, then call.') => {
    active = true; g.close(); el.hidden = false; o.host.classList.add('puzzle-mode');
    el.innerHTML = `<div class="relay-head">RELAY · CH <b>${ch()}</b></div><p class="relay-notes">Pinned notes: ${RELAY_NOTES}</p>${dialSvg()}<p class="relay-read">${msg}</p><div class="story-choices"><button class="primary" data-act="call">Call on channel ${ch()}</button><button class="quiet" data-act="close">Step away</button></div>`;
  };
  const words = (msg = 'The relay has said three words. <b>Tap the words it should read</b> to make the next one, then Send.') => {
    const ws = ['Channel 7.', 'Mira,', 'it\'s'];
    el.innerHTML = `<div class="relay-head">RELAY · CH <b>7</b> · <span class="live">LIVE</span></div><div class="rail-chips">${ws.map((w, i) => `<button class="chip${pickedNow().has(i) ? ' picked' : ''}" data-w="${i}">${w}</button>`).join('')}<span class="chip empty">…</span></div><p class="relay-read">${msg}</p><div class="story-choices"><button class="primary" data-act="send">Send</button></div>`;
    el.onclick = e => {
      const b = (e.target as HTMLElement).closest('button'); if (!b) return; e.stopPropagation(); sfx.tap();
      if (b.dataset.w) { st.act('word.' + b.dataset.w); words(); return; }
      if (b.dataset.act === 'send') send();
    };
  };
  const call = () => {
    const r = st.act('call'); if (!r.ok) return;
    const heard = (e: string) => r.events.includes(e);
    el.onclick = null;
    if (heard('mira-answers')) { sfx.hum(1.5); o.ping(); el.querySelector('.relay-read')!.innerHTML = '<i>…Zip? Is that… you? I can barely hear—</i>'; setTimeout(() => words(), 1600); return; }
    if (heard('warden-answers')) { sfx.whisper(); tuneAfter('<b>Warden:</b> “Found you, little courier. Thanks for calling.”', () => g.thinkOnce('relay-3', 'He said every channel was jammed but 3. Of course he did.')); return; }
    if (heard('festival-radio')) { for (let i = 0; i < 5; i++) setTimeout(() => sfx.speak(1), i * 140); tuneAfter('♪ <i>…and the festival lantern contest goes to… everyone! ♪</i>', () => g.thinkOnce('relay-5', 'Festival radio. Great tunes. Wrong call.')); return; }
    sfx.static(); tuneAfter('Only static. Nobody\'s on channel ' + ch() + '.');
  };
  const tuneAfter = (msg: string, then?: () => void) => { tune(msg); bind(); then?.(); };
  const send = () => {
    const r = st.act('send'); if (!r.ok) return;
    if (r.events.includes('nothing-picked')) { g.toast('Tap a word first', 1100); sfx.boing(); return; }
    if (r.events.includes('mira-hears')) { finish(); return; }
    const kind = r.judged[0]?.choice;
    sfx.boing();
    const msg = kind === 'newest' ? 'It only read “it\'s”… so it sent <b>“it\'s it\'s it\'s it\'s”</b>. Mira: “…Zip, are you stuck?”'
      : kind === 'no-card' ? 'No channel card, so it sent the call to channel 3. <b>Warden:</b> “Hello again.”'
        : 'Words missing, so it sent <b>“Mira… um… it\'s”</b>. Static swallows the rest.';
    if (kind === 'no-card') sfx.whisper();
    words(msg + ' Try again.');
  };
  const finish = () => {
    sfx.chime(); o.ping(); el.hidden = true; active = false; o.host.classList.remove('puzzle-mode');
    g.say('Zip! I kept the lantern. Follow my marks. They\'re taking us past Loom Isle.', [{ label: 'I\'m coming', kind: 'primary', act: () =>
      st.finish(() => o.onDone()) }], { speaker: 'Mira' });
  };
  const bind = () => {
    el.onclick = e => {
      const t = e.target as Element, tick = t.closest('.relay-tick') as SVGGElement | null, b = t.closest('button');
      if (tick) { e.stopPropagation(); st.act('tune.' + (tick.dataset.ch ?? 1)); sfx.static(); tune(); bind(); return; }
      if (!b) return; e.stopPropagation(); sfx.tap();
      if (b.dataset.act === 'call') call();
      else if (b.dataset.act === 'close') { el.hidden = true; active = false; o.host.classList.remove('puzzle-mode'); }
    };
  };
  return {
    pinned: RELAY_NOTES,
    get active() { return active; },
    open() { tune(); bind(); },
  };
}
