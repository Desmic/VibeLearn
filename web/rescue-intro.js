/* Relay Rescue opening: presentation only. Server state and assessment remain authoritative. */
'use strict';
(() => {
  const game = window.RescueGame;
  if (!game || game.__firstMinuteStory) return;
  if (!document.querySelector('link[href="/rescue-intro.css"]')) {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/rescue-intro.css'; document.head.append(css);
  }

  const SEEN_KEY = 'vibelearn.relay-rescue.intro.v1';
  const scenes = [
    {kicker:'THE VALLEY COURIER',title:'Pip keeps the valley moving.',body:'Every bridge repair begins with one job: carry the request to the workshop and bring the result back safely.'},
    {kicker:'THE STORM',title:'The order was sent. The reply vanished.',body:'Pip requested one bridge gear. A storm cut the signal before Pip learned whether the workshop completed it.'},
    {kicker:'THE DANGER',title:'Retrying blindly can make two.',body:'If the workshop already made the gear, a fresh request can create a duplicate. The problem is uncertainty — not simply failure.'},
    {kicker:'YOUR MISSION',title:'Recover the truth. Restore seven signals.',body:'Inspect what Pip knows, what the workshop did, and the identity of the original job. Each restored signal gives you more recovery power.'},
    {kicker:'THE REAL SYSTEM',title:'Software faces the same missing-reply problem.',body:'Jobs, payments, exports and APIs all face request → no reply → retry? Your goal is to make one intent lead to one safe result.'}
  ];

  let activeCleanup = () => {};
  const originalMap = game.map.bind(game);
  const originalRender = game.render.bind(game);
  const originalHide = game.hide.bind(game);
  const remembered = () => { try { return localStorage.getItem(SEEN_KEY) === 'seen'; } catch (_) { return false; } };
  const remember = () => { try { localStorage.setItem(SEEN_KEY, 'seen'); } catch (_) {} };
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function staticStory(root) {
    if (root.querySelector('#rgi-static')) return;
    const map = root.querySelector('.rg-map');
    if (!map) return;
    const box = document.createElement('section');
    box.id = 'rgi-static'; box.className = 'rgi-static';
    box.setAttribute('aria-label', 'Opening story summary');
    box.innerHTML = `<span class="rg-eyebrow">THE MISSING DELIVERY</span><h2>Before you move: what happened in the storm</h2><ol>${scenes.map(s => `<li><strong>${s.title}</strong><br>${s.body}</li>`).join('')}</ol><p>Reduced motion is on, so the same story is shown without the animated sequence.</p>`;
    map.prepend(box);
  }

  function openIntro(root, launch, {replay=false}={}) {
    activeCleanup();
    const overlay = document.createElement('section');
    overlay.id = 'rgi-intro'; overlay.className = 'rgi-overlay'; overlay.tabIndex = -1;
    overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true'); overlay.setAttribute('aria-labelledby','rgi-title');
    overlay.innerHTML = `<div class="rgi-shell"><div class="rgi-visual" aria-hidden="true"><div class="rgi-moon"></div><div class="rgi-mountain one"></div><div class="rgi-mountain two"></div><div class="rgi-mountain three"></div><div class="rgi-water"></div><div class="rgi-island rgi-left"></div><div class="rgi-island rgi-right"></div><div class="rgi-route"></div><div class="rgi-pip"><span></span></div><div class="rgi-workshop"></div><div class="rgi-message"></div><div class="rgi-storm"></div><div class="rgi-risk"><span class="rgi-gear">1</span><span class="rgi-gear">2</span></div><div class="rgi-warning">DUPLICATE DELIVERY</div><div class="rgi-signals">${Array.from({length:7},()=>'<i class="rgi-signal"></i>').join('')}</div><div class="rgi-code"><div class="rgi-code-line"><b>request(job-01)</b><i>→</i><b>no reply</b><i>→</i><b>retry?</b></div></div></div><div class="rgi-copy"><span class="rgi-kicker"></span><h2 id="rgi-title"></h2><p id="rgi-body"></p><div class="rgi-story-progress" aria-label="Opening story progress">${scenes.map(()=>'<span></span>').join('')}</div><div class="rgi-actions"><button type="button" class="rg-primary" id="rgi-next">Next →</button><button type="button" class="rgi-skip" id="rgi-skip">Skip story</button></div><small class="rgi-step-label" id="rgi-step-label"></small></div></div>`;
    root.append(overlay);
    let step = 0, timer = 0, closed = false;
    const clear = () => { if (timer) clearTimeout(timer); timer = 0; };
    const close = (focusLaunch=true, persistSeen=true) => {
      if (closed) return;
      closed = true; clear();
      if (persistSeen) remember();
      overlay.remove();
      if (focusLaunch) launch?.focus({preventScroll:true});
    };
    const update = () => {
      clear(); overlay.dataset.step = String(step);
      overlay.querySelector('.rgi-kicker').textContent = scenes[step].kicker;
      overlay.querySelector('#rgi-title').textContent = scenes[step].title;
      overlay.querySelector('#rgi-body').textContent = scenes[step].body;
      overlay.querySelectorAll('.rgi-story-progress span').forEach((n,i)=>n.classList.toggle('on',i<=step));
      overlay.querySelector('#rgi-step-label').textContent = `Story beat ${step+1} of ${scenes.length}${replay?' · replaying opening':''}`;
      overlay.querySelector('#rgi-next').textContent = step===scenes.length-1 ? 'Take control · restore Signal 1 →' : 'Next →';
      if (step < scenes.length-1 && !reduced()) timer = setTimeout(()=>{step+=1;update();},3750);
    };
    overlay.querySelector('#rgi-next').addEventListener('click',()=>{ if(step===scenes.length-1){close(false,true);launch?.click();} else {step+=1;update();} });
    overlay.querySelector('#rgi-skip').addEventListener('click',()=>close(true,true));
    overlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close(true,true);}});
    activeCleanup = () => close(false,false);
    update(); overlay.focus({preventScroll:true});
  }

  function enhanceMap(missions, attempt) {
    const root = document.querySelector('#rescue-game'); if (!root) return;
    const cleared = missions.filter(m=>m.status==='cleared').length;
    const active = attempt?.status === 'draft';
    const launch = root.querySelector('#rg-launch'); const brief = root.querySelector('.rg-map-brief');
    if (cleared===0 && !active && brief && launch) {
      const eyebrow=brief.querySelector('.rg-eyebrow'), title=brief.querySelector('h1'), copy=brief.querySelector('p');
      if(eyebrow)eyebrow.textContent='THE MISSING DELIVERY';
      if(title)title.textContent='The storm hid one delivery reply.';
      if(copy)copy.textContent='Pip already sent one order for a bridge gear. The workshop may have acted, but its reply vanished. Retry blindly and the valley could receive two. Find out what happened and restore seven signals.';
      launch.innerHTML='Start Signal 1 <span>→</span>';
      const premise=document.createElement('span'); premise.className='rgi-map-premise'; premise.textContent='ONE INTENT → ONE SAFE RESULT'; brief.insertBefore(premise,title);
    }
    const menu=root.querySelector('#rg-menu');
    if(menu&&launch&&!root.querySelector('#rg-replay-story')){const replay=document.createElement('button');replay.type='button';replay.id='rg-replay-story';replay.textContent='Replay opening story';replay.addEventListener('click',()=>openIntro(root,launch,{replay:true}));menu.insertBefore(replay,menu.firstChild);}
    if(cleared===0&&!active&&launch&&!remembered()){if(reduced())staticStory(root);else openIntro(root,launch);}
  }

  game.map=(missions,attempt,handlers)=>{activeCleanup();originalMap(missions,attempt,handlers);enhanceMap(missions,attempt);};
  game.render=(...args)=>{activeCleanup();return originalRender(...args);};
  game.hide=(...args)=>{activeCleanup();return originalHide(...args);};
  game.__firstMinuteStory=true;
})();
