/* Signal 1 onboarding: teach the world, stakes and vocabulary through simple causal animation. */
'use strict';
(() => {
  const game = window.RescueGame;
  if (!game || game.__chapterOneGuide) return;

  const GUIDE_KEY = 'vibelearn.relay-rescue.signal1-guide.v1';
  const steps = [
    {kicker:'MEET THE VALLEY',title:'Pip needs the footbridge working.',body:'Pip is the courier. The workshop makes repair parts. The broken footbridge needs one gear before Pip can reopen the route.',facts:['Pip = courier','Workshop = makes parts','Gear = repairs the bridge']},
    {kicker:'WHY THE GEAR MATTERS',title:'One gear restores the bridge.',body:'A gear transfers motion inside the bridge mechanism. The repair needs exactly one. A second gear does not help this job; it wastes a scarce part and creates a duplicate delivery.',facts:['Goal = exactly one gear','Duplicate = waste + wrong result']},
    {kicker:'THE TICKET',title:'The ticket is the job’s identity.',body:'Pip sends order-01 with the request. While the workshop remembers that ticket, seeing order-01 again means “this is the same job,” not a new one.',facts:['order-01 = same intent','New ticket = looks like a new job']},
    {kicker:'THE STORM',title:'The gear may exist even when the reply is gone.',body:'The workshop can finish the gear and send a reply, but the storm can swallow only the reply. Pip then knows less than the workshop: no reply does not mean no gear.',facts:['World truth ≠ Pip’s knowledge','Missing reply = uncertainty']},
    {kicker:'YOUR FIRST RESCUE',title:'Help Pip learn what happened before acting.',body:'Inspect the ticket and workshop. Then choose Pip’s move. Your job is to recover the truth and keep one request from becoming two deliveries.',facts:['Inspect → reason → act','One intent → one safe result']}
  ];

  const seen = () => { try { return localStorage.getItem(GUIDE_KEY) === 'seen'; } catch (_) { return false; } };
  const remember = () => { try { localStorage.setItem(GUIDE_KEY,'seen'); } catch (_) {} };
  const originalRender = game.render.bind(game);

  function addWorldKey(root) {
    const world = root.querySelector('.rg-world');
    if (!world || world.querySelector('.rgc1-world-key')) return;
    const key = document.createElement('div');
    key.className = 'rgc1-world-key';
    key.setAttribute('aria-label','Signal 1 world key');
    key.innerHTML = '<span><strong>Pip</strong> courier</span><span><strong>Workshop</strong> makes the gear</span><span><strong>Gear</strong> repairs the bridge</span><span><strong>Ticket</strong> identifies the job</span><span><strong>Reply</strong> tells Pip what happened</span>';
    world.append(key);
  }

  function openGuide(root) {
    const world = root.querySelector('.rg-world');
    if (!world || root.querySelector('#rgc1-guide')) return;
    const guide = document.createElement('section');
    guide.id = 'rgc1-guide'; guide.className = 'rgc1-guide'; guide.tabIndex = -1;
    guide.setAttribute('role','dialog'); guide.setAttribute('aria-modal','true'); guide.setAttribute('aria-labelledby','rgc1-title');
    guide.innerHTML = `<article class="rgc1-card" data-step="0"><div class="rgc1-scene" aria-hidden="true"><div class="rgc1-land left"></div><div class="rgc1-land right"></div><div class="rgc1-bridge"></div><div class="rgc1-pip"><span></span></div><div class="rgc1-workshop"></div><div class="rgc1-gear">⚙</div><div class="rgc1-ticket">order-01</div><div class="rgc1-reply"></div><div class="rgc1-bolt">ϟ</div><div class="rgc1-duplicate"><i>1</i><i>2</i></div><span class="rgc1-label pip">PIP · COURIER</span><span class="rgc1-label shop">WORKSHOP</span><span class="rgc1-label bridge">FOOTBRIDGE</span><span class="rgc1-label ticket">JOB TICKET</span></div><div class="rgc1-copy"><span class="rg-eyebrow" id="rgc1-kicker"></span><h2 id="rgc1-title"></h2><p id="rgc1-body"></p><div class="rgc1-facts" id="rgc1-facts"></div><div class="rgc1-progress">${steps.map(()=>'<i></i>').join('')}</div><div class="rgc1-controls"><button type="button" class="rg-primary" id="rgc1-next">Next →</button><button type="button" class="rgc1-skip" id="rgc1-skip">Skip tutorial</button></div></div></article>`;
    root.append(guide);
    let step = 0;
    const card = guide.querySelector('.rgc1-card');
    const update = () => {
      const s = steps[step]; card.dataset.step = String(step);
      guide.querySelector('#rgc1-kicker').textContent = s.kicker;
      guide.querySelector('#rgc1-title').textContent = s.title;
      guide.querySelector('#rgc1-body').textContent = s.body;
      guide.querySelector('#rgc1-facts').replaceChildren(...s.facts.map(text=>{const n=document.createElement('span');n.textContent=text;return n;}));
      guide.querySelectorAll('.rgc1-progress i').forEach((n,i)=>n.classList.toggle('on',i<=step));
      guide.querySelector('#rgc1-next').textContent = step === steps.length-1 ? 'Take control →' : 'Next →';
    };
    const close = () => { remember(); guide.remove(); world.focus?.({preventScroll:true}); };
    guide.querySelector('#rgc1-next').onclick = () => { if (step === steps.length-1) close(); else { step += 1; update(); } };
    guide.querySelector('#rgc1-skip').onclick = close;
    guide.addEventListener('keydown',e=>{ if(e.key==='Escape'){e.preventDefault();close();} });
    update(); guide.focus({preventScroll:true});
  }

  game.render = (attempt, missions, handlers) => {
    const result = originalRender(attempt, missions, handlers);
    if (attempt?.snapshot?.rescue?.level === 1 && attempt.status === 'draft') {
      const root = document.querySelector('#rescue-game');
      addWorldKey(root);
      const console = root?.querySelector('.rg-console');
      if (console && !console.querySelector('.rgc1-memory')) {
        const note = document.createElement('div'); note.className='rgc1-memory';
        note.innerHTML='<strong>Signal 1 rule of the world:</strong> the workshop may have completed the gear even when Pip never received the reply. Inspect first; do not treat silence as failure.';
        console.prepend(note);
      }
      if (!seen()) openGuide(root);
    }
    return result;
  };
  game.__chapterOneGuide = true;
})();