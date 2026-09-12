/* Signal 1 progressive tutorial: concrete world first, terminology after successful play.
   The same replaceable Echo Forge world remains mounted through the Play Canvas for Signals 1-6. */
'use strict';
(() => {
  const ROOT_ID = '#rescue-game';
  const STEP_KEY = 'vibelearn.relay-rescue.signal1-guide.v3';
  const DONE_KEY = 'vibelearn.relay-rescue.signal1-guide.done.v3';
  const rootEl = () => document.querySelector(ROOT_ID);
  const storyWorldBundle=Promise.all([import('/play-canvas.js'),import('/rescue-story3d.js')]).then(([play,module])=>({play,module})).catch(()=>null);
  let playCanvas=null, missionWorld=null, missionHost=null;
  const clearMissionHost=()=>{
    missionHost?.classList.remove('rg-three-continuity-ready','rg-three-continuity-failed','rgc1-three-ready','rgc1-three-failed');
    missionHost=null;
  };
  const disposeMissionWorld=()=>{
    clearMissionHost();
    playCanvas?.disposeWorld?.();
    playCanvas=null;missionWorld=null;
  };
  const readStep = () => { try { return Number(localStorage.getItem(STEP_KEY) || 0); } catch (_) { return 0; } };
  const writeStep = value => { try { localStorage.setItem(STEP_KEY,String(value)); } catch (_) {} };
  const done = () => { try { return localStorage.getItem(DONE_KEY)==='yes'; } catch (_) { return false; } };
  const markDone = () => { try { localStorage.setItem(DONE_KEY,'yes'); } catch (_) {} };

  function isSignalOne(root) {
    if (!root || root.hidden) return false;
    const header = root.querySelector('.rg-top>span')?.textContent || '';
    if (/SIGNAL\s*1\b/i.test(header)) return true;
    return Boolean(
      root.querySelector('[data-world-look="workshop"]') &&
      root.querySelector('[data-world-look="ticket"]') &&
      root.querySelector('[data-tool="new"]') &&
      root.querySelector('[data-tool="retry"]') &&
      !root.querySelector('#rg-run')
    );
  }

  function isHistorical(root) { return Boolean(root?.querySelector('.rg-review-banner')); }

  function syncStepFromAttempt(a) {
    if (done() || a?.snapshot?.rescue?.level !== 1 || !a?.rescue_state) return;
    const s=a.rescue_state, looked=new Set(s.looked || []);
    if (s.rewinds > 0 && !s.failed) writeStep(2);
    else if (s.ticket && s.ticket !== 'order-01') writeStep(3);
    else if (looked.has('ticket')) writeStep(2);
    else if (looked.has('workshop')) writeStep(1);
    else writeStep(0);
  }

  function addWorldKey(root) {
    const world = root.querySelector('.rg-world');
    if (!world) return;
    root.querySelector('.rg-observations')?.remove();
    if (world.querySelector('.rgc1-world-key')) return;
    const key = document.createElement('div'); key.className='rgc1-world-key';
    key.innerHTML = `<span><b>Pip</b><small>needs the bridge</small></span><span><b>Echo Forge</b><small>shapes one gear per order seal</small></span><span><b>Gear</b><small>makes the bridge move</small></span><span class="later"><b>Ticket</b><small>labels this order</small></span><span class="later"><b>Reply</b><small>tells Pip what happened</small></span>`;
    world.append(key);
  }

  function ensureCoach(root) {
    const world = root.querySelector('.rg-world');
    if (!world) return null;
    let coach = world.querySelector('.rgc1-coach');
    if (!coach) {
      coach = document.createElement('div'); coach.className='rgc1-coach'; coach.setAttribute('role','status'); coach.setAttribute('aria-live','polite');
      coach.innerHTML='<span>PIP NEEDS YOU</span><strong></strong><small></small>';
      world.append(coach);
    }
    return coach;
  }

  function setHighlight(root, selector) {
    root.querySelectorAll('.rgc1-highlight').forEach(n=>n.classList.remove('rgc1-highlight'));
    if (selector) root.querySelector(selector)?.classList.add('rgc1-highlight');
  }

  function enableOnly(root, inspectionKey) {
    root.querySelectorAll('[data-tool]').forEach(button=>button.disabled=true);
    root.querySelectorAll('[data-world-look]').forEach(button=>button.disabled=button.dataset.worldLook!==inspectionKey);
    setHighlight(root, inspectionKey ? `[data-world-look="${inspectionKey}"]` : null);
  }

  function enableChoices(root) {
    root.querySelectorAll('[data-world-look],[data-tool]').forEach(button=>button.disabled=false);
    setHighlight(root,null);
  }

  function addMemory(root) {
    const console = root.querySelector('.rg-console');
    if (!console || console.querySelector('.rgc1-memory') || root.querySelector('.rgc1-memory')) return;
    const note=document.createElement('div'); note.className='rgc1-memory';
    note.innerHTML='<strong>Storm clue:</strong> Pip lost the reply, not necessarily the gear. The Echo Forge may know more than Pip does.';
    console.prepend(note);
  }

  function buildPlayDock(root) {
    if (done()) return;
    const field=root.querySelector('.rg-field'), world=root.querySelector('.rg-world');
    if (!field || !world) return;
    let dock=field.querySelector('.rgc1-dock');
    if (!dock) {
      dock=document.createElement('section'); dock.className='rgc1-dock'; dock.setAttribute('aria-label','Signal 1 action dock');
      world.after(dock);
    }
    const memory=root.querySelector('.rgc1-memory');
    const ticket=root.querySelector('.rg-ticket');
    const tools=root.querySelector('.rg-tools');
    if (memory && memory.parentElement!==dock) dock.append(memory);
    if (ticket && ticket.parentElement!==dock) dock.append(ticket);
    if (tools && tools.parentElement!==dock) dock.append(tools);
  }

  function visualState(a){return {...(a?.rescue_state||{}),level:Number(a?.snapshot?.rescue?.level||1)};}

  function mountMissionWorld(root,a) {
    const level=Number(a?.snapshot?.rescue?.level||0);
    // Signal 7 is a deliberate fresh-transfer context. Signals 1-6 keep the same
    // Play Canvas/world lifecycle even though legacy DOM containers are rerendered.
    if (!root || root.hidden || isHistorical(root) || level<1) { clearMissionHost(); return; }
    if(level>6){disposeMissionWorld();return;}
    const host=root.querySelector('.rg-world'); if(!host) { clearMissionHost(); return; }
    const readyClass=level===1?'rgc1-three-ready':'rg-three-continuity-ready';
    const failedClass=level===1?'rgc1-three-failed':'rg-three-continuity-failed';
    missionHost=host;
    storyWorldBundle.then(bundle=>{
      if(missionHost!==host || !host.isConnected || !bundle) return;
      playCanvas=bundle.play.getPlayCanvas();
      missionWorld=playCanvas.showMission(bundle.module,host,visualState(a),{reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
      if(missionWorld?.available){host.classList.add(readyClass);host.classList.remove(failedClass);}
      else{host.classList.add(failedClass);host.classList.remove(readyClass);}
    });
  }

  function addRecap(root) {
    const clear=root.querySelector('.rg-clear');
    if (!clear || clear.querySelector('.rgc1-recap')) return;
    clear.classList.add('rgc1-finale');
    const clearLabel=clear.querySelector(':scope > span');
    const clearTitle=clear.querySelector(':scope > h2');
    const clearCopy=clear.querySelector(':scope > p');
    if(clearLabel) clearLabel.textContent='✦ BRIDGE ONLINE';
    if(clearTitle) clearTitle.textContent='Pip can cross.';
    if(clearCopy) clearCopy.textContent='You recovered the same promise instead of creating another one.';
    const recap=document.createElement('section'); recap.className='rgc1-recap';
    recap.innerHTML=`<span>FIELD SKILL UNLOCKED</span><h3>One intent → one safe result.</h3><div class="rgc1-causal-strip" aria-label="What made the recovery safe"><div><small>1 · KEEP</small><b>order-01</b><span>the same job identity</span></div><i aria-hidden="true">→</i><div><small>2 · RETRY</small><b>same promise</b><span>not a fresh order</span></div><i aria-hidden="true">→</i><div><small>3 · RESULT</small><b>one gear</b><span>the bridge moves</span></div></div><div class="rgc1-formal"><small>ENGINEERS CALL THIS</small><strong>Idempotent retry</strong><p>Retrying the same intent safely still produces one effect.</p></div><details class="rgc1-debrief"><summary>What you figured out</summary><div class="rgc1-recap-grid"><p><b>Pip</b> is the courier who needs the bridge.</p><p><b>The Echo Forge</b> shapes the replacement gear.</p><p><b>The gear</b> makes the bridge mechanism move.</p><p><b>order-01</b> tells the Echo Forge “this is the same job.”</p><p><b>The missing reply</b> created uncertainty, not proof of failure.</p><p><b>Why it matters</b>: a brand-new order could make a duplicate.</p></div></details>`;
    const next=clear.querySelector('#rg-next'); if(next) clear.insertBefore(recap,next); else clear.append(recap);
    markDone(); writeStep(4);
  }

  function updateGuidance(root) {
    if (!isSignalOne(root) || isHistorical(root)) return;
    addWorldKey(root); addMemory(root); buildPlayDock(root); addRecap(root);
    const coach=ensureCoach(root); if(!coach) return;
    const failed=Boolean(root.querySelector('.rg-world-failed,[data-tool="rewind"]'));
    const cleared=Boolean(root.querySelector('.rg-clear'));
    if (cleared) {
      root.classList.remove('rgc1-guided'); delete root.dataset.tutorialStage; enableChoices(root); coach.hidden=true; return;
    }
    if (done()) { root.classList.remove('rgc1-guided'); delete root.dataset.tutorialStage; enableChoices(root); coach.hidden=true; return; }
    root.classList.add('rgc1-guided'); coach.hidden=false;
    if (failed) {
      root.dataset.tutorialStage='failed';
      coach.querySelector('span').textContent='LOOK WHAT HAPPENED';
      coach.querySelector('strong').textContent='Two gears. The new ticket looked like a new job.';
      coach.querySelector('small').textContent='Rewind, keep order-01, and try again.';
      root.querySelectorAll('[data-world-look],[data-tool]').forEach(button=>button.disabled=button.dataset.tool!=='rewind');
      setHighlight(root,'[data-tool="rewind"]'); return;
    }
    const step=readStep(); root.dataset.tutorialStage=String(step);
    if (step<=0) {
      coach.querySelector('span').textContent='FIRST: FIND THE PART'; coach.querySelector('strong').textContent='Where would the bridge gear have been made?'; coach.querySelector('small').textContent='Tap ECHO FORGE. Nothing else matters yet.';
      enableOnly(root,'workshop'); return;
    }
    if (step===1) {
      coach.querySelector('span').textContent='GOOD. ONE MORE CLUE'; coach.querySelector('strong').textContent='Which order did Pip already send?'; coach.querySelector('small').textContent='Tap TICKET and look for its label.';
      enableOnly(root,'ticket'); return;
    }
    if (step===2) {
      coach.querySelector('span').textContent='NOW CHOOSE PIP’S MOVE'; coach.querySelector('strong').textContent='The Echo Forge may already have made the gear.'; coach.querySelector('small').textContent='Reuse order-01, or print a brand-new ticket and watch what the workshop does.';
      enableChoices(root); setHighlight(root,'[data-tool="retry"]'); return;
    }
    if (step===3) {
      coach.querySelector('span').textContent='A NEW TICKET CHANGED THE MEANING'; coach.querySelector('strong').textContent='The Echo Forge reads a new seal as another job.'; coach.querySelector('small').textContent='Send it to see the consequence, or choose the safe remembered ticket next time.';
      enableChoices(root); setHighlight(root,'[data-tool="retry"]'); return;
    }
    enableChoices(root);
  }

  function decorateMenu(root) {
    const menu=root?.querySelector('#rg-menu'); if(!menu || menu.querySelector('#rg-replay-signal1')) return;
    const button=document.createElement('button'); button.type='button'; button.id='rg-replay-signal1'; button.textContent='Replay Signal 1 tutorial';
    button.onclick=()=>{ try{localStorage.removeItem(DONE_KEY);localStorage.setItem(STEP_KEY,'0');}catch(_){} updateGuidance(root); };
    menu.prepend(button);
  }

  function enhanceNow() {
    const root=rootEl();
    if (!isSignalOne(root)) return;
    decorateMenu(root); updateGuidance(root);
  }

  const game=window.RescueGame;
  if (game && !game.__signalOneGuideV3) {
    const previousRender=game.render.bind(game);
    const previousSync=game.sync.bind(game);
    const previousHide=game.hide.bind(game);
    game.render=(a,...rest)=>{
      // Do not dispose the world before a rerender. Legacy DOM may be replaced,
      // but the Play Canvas keeps its stable stage/runtime and reattaches below.
      clearMissionHost();
      const result=previousRender(a,...rest); syncStepFromAttempt(a); enhanceNow(); mountMissionWorld(rootEl(),a); return result;
    };
    game.sync=(busy,a,...rest)=>{
      const result=previousSync(busy,a,...rest);
      const status=rootEl()?.querySelector('#rg-sync')?.textContent;
      if (!busy && status==='Saved') {
        syncStepFromAttempt(a); enhanceNow();
        if(playCanvas&&missionHost)missionWorld=playCanvas.showMission(storyWorldBundle.module||null,missionHost,visualState(a));
        else missionWorld?.setMissionState?.(visualState(a));
      }
      return result;
    };
    game.hide=(...args)=>{disposeMissionWorld();return previousHide(...args);};
    game.__signalOneGuideV3=true;
  }

  queueMicrotask(enhanceNow);
})();