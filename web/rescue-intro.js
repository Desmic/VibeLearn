/* Relay Rescue first-minute story: visual causality before terminology or decisions. */
'use strict';
(() => {
  const game = window.RescueGame;
  if (!game || game.__firstMinuteStoryV2) return;

  const SEEN_KEY = 'vibelearn.relay-rescue.intro.v2';
  const scenes = [
    {kicker:'MEET PIP',title:'Pip has one job: get the bridge moving.',body:'Pip is the valley courier. The footbridge is stuck, so Pip cannot reach the next island.'},
    {kicker:'WHAT THE BRIDGE NEEDS',title:'One gear makes the bridge move.',body:'The workshop builds repair parts. This bridge needs exactly one gear — not zero, not two.'},
    {kicker:'THE ORDER',title:'Pip already asked for the gear.',body:'Pip sent one order, called order-01. The workshop can remember that label and know which job Pip means.'},
    {kicker:'THE STORM',title:'The workshop may have finished. The reply did not.',body:'Lightning swallowed the reply on its way back. The gear can still exist even though Pip never heard “done.”'},
    {kicker:'THE PUZZLE',title:'No reply does not mean “nothing happened.”',body:'If Pip starts a brand-new order, the workshop may build a second gear. First discover what really happened.'},
    {kicker:'YOUR TURN',title:'Look first. Then choose.',body:'Inspect the workshop and Pip’s ticket. Help Pip get one safe result, restore seven signals, and reopen the valley.'}
  ];

  let cleanup = () => {};
  const originalMap = game.map.bind(game);
  const originalRender = game.render.bind(game);
  const originalHide = game.hide.bind(game);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen = () => { try { return localStorage.getItem(SEEN_KEY) === 'seen'; } catch (_) { return false; } };
  const remember = () => { try { localStorage.setItem(SEEN_KEY, 'seen'); } catch (_) {} };

  function makeStatic(root) {
    if (root.querySelector('#rgi-static')) return;
    const map = root.querySelector('.rg-map');
    if (!map) return;
    const panel = document.createElement('section');
    panel.id = 'rgi-static'; panel.className = 'rgi-static';
    panel.setAttribute('aria-label','Relay Rescue opening story');
    panel.innerHTML = `<span class="rg-eyebrow">THE MISSING DELIVERY</span><h2>What happened before you arrived</h2><ol>${scenes.map((s,i)=>`<li><b>${i+1}</b><span><strong>${s.title}</strong><small>${s.body}</small></span></li>`).join('')}</ol><p>Reduced motion is enabled, so the complete story is shown without automatic animation.</p>`;
    map.prepend(panel);
  }

  function open(root, launch, {replay=false}={}) {
    cleanup();
    const overlay = document.createElement('section');
    overlay.id = 'rgi-intro'; overlay.className = 'rgi-overlay'; overlay.tabIndex = -1;
    overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true'); overlay.setAttribute('aria-labelledby','rgi-title');
    overlay.innerHTML = `<div class="rgi-shell">
      <div class="rgi-visual" aria-hidden="true">
        <div class="rgi-sky-glow"></div><div class="rgi-moon"></div>
        <div class="rgi-mountain one"></div><div class="rgi-mountain two"></div><div class="rgi-mountain three"></div><div class="rgi-water"></div>
        <div class="rgi-island left"></div><div class="rgi-island right"></div>
        <div class="rgi-bridge"><i></i><i></i></div><span class="rgi-bridge-label">FOOTBRIDGE</span>
        <div class="rgi-pip"><span></span></div><span class="rgi-pip-label">PIP · COURIER</span>
        <div class="rgi-workshop"></div><span class="rgi-shop-label">WORKSHOP</span>
        <div class="rgi-gear"><span>⚙</span></div><div class="rgi-ticket">order-01</div><div class="rgi-reply">✓</div><div class="rgi-storm">ϟ</div>
        <div class="rgi-thought pip">?</div><div class="rgi-thought shop">1 gear</div><div class="rgi-duplicate"><span>⚙</span><span>⚙</span></div>
        <div class="rgi-signals">${Array.from({length:7},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div>
        <div class="rgi-rule"><span>LOOK</span><b>→</b><span>CHOOSE</span><b>→</b><span>SEE WHAT HAPPENS</span></div>
      </div>
      <div class="rgi-copy"><span class="rgi-kicker"></span><h2 id="rgi-title"></h2><p id="rgi-body"></p><div class="rgi-fact" id="rgi-fact"></div><div class="rgi-progress" aria-label="Story progress">${scenes.map(()=>'<i></i>').join('')}</div><div class="rgi-actions"><button type="button" class="rg-primary" id="rgi-next">Next →</button><button type="button" id="rgi-skip">Skip story</button></div><small id="rgi-step"></small></div>
    </div>`;
    root.append(overlay);
    let step = 0, timer = 0, closed = false;
    const clearTimer = () => { if (timer) clearTimeout(timer); timer = 0; };
    const facts = ['Pip needs the bridge.','The bridge needs 1 gear.','order-01 = this one order.','The reply vanished; the gear may not have.','Silence = uncertainty.','First action: inspect.'];
    const update = () => {
      clearTimer(); overlay.dataset.step = String(step);
      overlay.querySelector('.rgi-kicker').textContent = scenes[step].kicker;
      overlay.querySelector('#rgi-title').textContent = scenes[step].title;
      overlay.querySelector('#rgi-body').textContent = scenes[step].body;
      overlay.querySelector('#rgi-fact').textContent = facts[step];
      overlay.querySelector('#rgi-step').textContent = `${step+1} / ${scenes.length}${replay?' · replay':''}`;
      overlay.querySelectorAll('.rgi-progress i').forEach((n,i)=>n.classList.toggle('on',i<=step));
      overlay.querySelector('#rgi-next').textContent = step === scenes.length-1 ? 'Start Signal 1 →' : 'Next →';
      if (step < scenes.length-1 && !reduced()) timer = setTimeout(()=>{step += 1; update();},3200);
    };
    const close = (start=false, persist=true) => {
      if (closed) return; closed = true; clearTimer();
      if (persist) remember(); overlay.remove();
      if (start) launch?.click(); else launch?.focus({preventScroll:true});
    };
    overlay.querySelector('#rgi-next').onclick = () => step === scenes.length-1 ? close(true,true) : (step += 1, update());
    overlay.querySelector('#rgi-skip').onclick = () => close(false,true);
    overlay.addEventListener('keydown',e=>{ if(e.key==='Escape'){e.preventDefault();close(false,true);} });
    cleanup = () => close(false,false);
    update(); overlay.focus({preventScroll:true});
  }

  function enhanceMap(missions, attempt) {
    const root = document.querySelector('#rescue-game'); if (!root) return;
    const cleared = missions.filter(m=>m.status==='cleared').length;
    const active = attempt?.status === 'draft';
    const launch = root.querySelector('#rg-launch'); const brief = root.querySelector('.rg-map-brief');
    if (cleared===0 && !active && brief && launch) {
      brief.querySelector('.rg-eyebrow')?.replaceChildren(document.createTextNode('THE MISSING DELIVERY'));
      const h1 = brief.querySelector('h1'); if(h1) h1.textContent='A storm hid one reply.';
      const p = brief.querySelector('p'); if(p) p.textContent='Pip needs one bridge gear. The order was already sent. The reply vanished. Your first job is simply to find out what happened.';
      launch.innerHTML='Begin the story <span>→</span>';
    }
    const menu = root.querySelector('#rg-menu');
    if (menu && launch && !menu.querySelector('#rg-replay-story')) {
      const replay = document.createElement('button'); replay.type='button'; replay.id='rg-replay-story'; replay.textContent='Replay opening story'; replay.onclick=()=>open(root,launch,{replay:true}); menu.prepend(replay);
    }
    if (cleared===0 && !active && launch && !seen()) {
      if (reduced()) makeStatic(root); else open(root,launch);
    }
  }

  game.map = (missions,attempt,handlers) => { cleanup(); const result=originalMap(missions,attempt,handlers); enhanceMap(missions,attempt); return result; };
  game.render = (...args) => { cleanup(); return originalRender(...args); };
  game.hide = (...args) => { cleanup(); return originalHide(...args); };
  game.__firstMinuteStoryV2 = true;
})();
