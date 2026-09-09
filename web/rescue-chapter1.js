/* Signal 1 onboarding: teach the world, stakes and vocabulary through simple causal animation. */
'use strict';
(() => {
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

  function isSignalOne(root) {
    if (!root || root.hidden) return false;
    return /SIGNAL\s+1\b/.test(root.querySelector('.rg-top>span')?.textContent || '');
  }

  function addWorldKey(root) {
    const world = root.querySelector('.rg-world');
    if (!world || world.querySelector('.rgc1-world-key')) return;
    const key = document.createElement('div');
    key.className = 'rgc1-world-key';
    key.setAttribute('aria-label','Signal 1 world key');
    key.innerHTML = '<span><strong>Pip</strong> courier</span><span><strong>Workshop</strong> makes the gear</span><span><strong>Gear</strong> repairs the bridge</span><span><strong>Ticket</strong> identifies the job</span><span><strong>Reply</strong> tells Pip what happened</span>';
    world.append(key);
  }

  function addMemory(root) {
    const console = root.querySelector('.rg-console');
    if (!console || console.querySelector('.rgc1-memory')) return;
    const note = document.createElement('div');
    note.className = 'rgc1-memory';
    note.innerHTML = '<strong>Signal 1 rule of the world:</strong> the workshop may have completed the gear even when Pip never received the reply. Inspect first; do not treat silence as failure.';
    console.prepend(note);
  }

  function addRecap(root) {
    const clear = root.querySelector('.rg-clear');
    if (!clear || clear.querySelector('.rgc1-recap')) return;
    const recap = document.createElement('div');
    recap.className = 'rgc1-memory rgc1-recap';
    recap.innerHTML = '<strong>What you now know:</strong> Pip is the courier. The workshop makes the bridge gear. One gear repairs this footbridge. <code>order-01</code> identifies this job. The storm can lose the reply after the workshop already acted, so silence means uncertainty—not failure. Reusing the same job identity lets Pip recover the same result instead of creating another delivery. Pip can reach the next island.';
    const next = clear.querySelector('#rg-next');
    if (next) clear.insertBefore(recap, next); else clear.append(recap);
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
    const close = () => { remember(); guide.remove(); root.querySelector('[data-world-look], [data-tool]')?.focus({preventScroll:true}); };
    guide.querySelector('#rgc1-next').onclick = () => { if (step === steps.length-1) close(); else { step += 1; update(); } };
    guide.querySelector('#rgc1-skip').onclick = close;
    guide.addEventListener('keydown',e=>{ if(e.key==='Escape'){e.preventDefault();close();} });
    update(); guide.focus({preventScroll:true});
  }

  function enhance() {
    const root = document.querySelector('#rescue-game');
    if (!isSignalOne(root)) return;
    addWorldKey(root);
    addMemory(root);
    addRecap(root);
    // Only an interactive draft has player action controls. Submitted/review states
    // keep the world key and recap but never reopen the tutorial.
    if (!seen() && root.querySelector('[data-tool]')) openGuide(root);
  }

  const workspace = document.querySelector('#workspace');
  if (!workspace) return;
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; enhance(); });
  };
  const observer = new MutationObserver(schedule);
  observer.observe(workspace, {childList:true, subtree:true});
  schedule();
})();