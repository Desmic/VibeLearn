/* Signal 1 progressive tutorial: concrete world first, terminology after successful play. */
'use strict';
(() => {
  const ROOT_ID = '#rescue-game';
  const STEP_KEY = 'vibelearn.relay-rescue.signal1-guide.v2';
  const DONE_KEY = 'vibelearn.relay-rescue.signal1-guide.done.v2';
  const rootEl = () => document.querySelector(ROOT_ID);
  const readStep = () => { try { return Number(localStorage.getItem(STEP_KEY) || 0); } catch (_) { return 0; } };
  const writeStep = value => { try { localStorage.setItem(STEP_KEY,String(value)); } catch (_) {} };
  const done = () => { try { return localStorage.getItem(DONE_KEY)==='yes'; } catch (_) { return false; } };
  const markDone = () => { try { localStorage.setItem(DONE_KEY,'yes'); } catch (_) {} };

  function isSignalOne(root) {
    return Boolean(root && !root.hidden && /SIGNAL\s+1\b/.test(root.querySelector('.rg-top>span')?.textContent || ''));
  }

  function isHistorical(root) { return Boolean(root?.querySelector('.rg-review-banner')); }

  function addWorldKey(root) {
    const world = root.querySelector('.rg-world');
    if (!world || world.querySelector('.rgc1-world-key')) return;
    const key = document.createElement('div'); key.className='rgc1-world-key';
    key.innerHTML = `<span><b>Pip</b><small>needs the bridge</small></span><span><b>Workshop</b><small>builds the gear</small></span><span><b>Gear</b><small>makes the bridge move</small></span><span class="later"><b>Ticket</b><small>labels this order</small></span><span class="later"><b>Reply</b><small>tells Pip what happened</small></span>`;
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
    if (!console || console.querySelector('.rgc1-memory')) return;
    const note=document.createElement('div'); note.className='rgc1-memory';
    note.innerHTML='<strong>What the storm changed:</strong> Pip lost the reply, not necessarily the gear. The workshop may know more than Pip does.';
    console.prepend(note);
  }

  function addRecap(root) {
    const clear=root.querySelector('.rg-clear');
    if (!clear || clear.querySelector('.rgc1-recap')) return;
    const recap=document.createElement('section'); recap.className='rgc1-recap';
    recap.innerHTML=`<span>YOU RESTORED SIGNAL 1</span><h3>One order. One gear. One safe result.</h3><div class="rgc1-recap-grid"><p><b>Pip</b> is the courier who needs the bridge.</p><p><b>The workshop</b> makes the gear.</p><p><b>The gear</b> makes the bridge mechanism move.</p><p><b>order-01</b> tells the workshop “this is the same job.”</p><p><b>The missing reply</b> created uncertainty, not proof of failure.</p><p><b>Why it matters</b>: a brand-new order could make a duplicate.</p></div><div class="rgc1-formal"><small>NOW NAME THE IDEA</small><strong>Idempotent retry</strong><p>When the same intent is retried safely, it should still produce one effect.</p></div>`;
    const next=clear.querySelector('#rg-next'); if(next) clear.insertBefore(recap,next); else clear.append(recap);
    markDone(); writeStep(4);
  }

  function updateGuidance(root) {
    if (!isSignalOne(root) || isHistorical(root)) return;
    addWorldKey(root); addMemory(root); addRecap(root);
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
      coach.querySelector('span').textContent='FIRST: FIND THE PART'; coach.querySelector('strong').textContent='Where would the bridge gear come from?'; coach.querySelector('small').textContent='Tap WORKSHOP. Nothing else matters yet.';
      enableOnly(root,'workshop'); return;
    }
    if (step===1) {
      coach.querySelector('span').textContent='GOOD. ONE MORE CLUE'; coach.querySelector('strong').textContent='Which order did Pip already send?'; coach.querySelector('small').textContent='Tap TICKET and look for its label.';
      enableOnly(root,'ticket'); return;
    }
    if (step===2) {
      coach.querySelector('span').textContent='NOW YOU HAVE THE WHOLE STORY'; coach.querySelector('strong').textContent='The workshop may already have made the gear.'; coach.querySelector('small').textContent='Choose Pip’s move. Reuse what belongs to this order—or print a brand-new ticket and see what changes.';
      enableChoices(root); setHighlight(root,'[data-tool="retry"]'); return;
    }
    if (step===3) {
      coach.querySelector('span').textContent='A NEW TICKET CHANGED THE MEANING'; coach.querySelector('strong').textContent='The workshop can mistake it for another job.'; coach.querySelector('small').textContent='Send it to see the consequence, or rewind before you do.';
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

  const workspace=document.querySelector('#workspace'); if(!workspace) return;
  workspace.addEventListener('click',event=>{
    const target=event.target.closest('[data-world-look],[data-tool]'); if(!target) return;
    const root=rootEl(); if(!isSignalOne(root) || done() || isHistorical(root)) return;
    if(target.dataset.worldLook==='workshop' && readStep()===0) writeStep(1);
    else if(target.dataset.worldLook==='ticket' && readStep()===1) writeStep(2);
    else if(target.dataset.tool==='new' && readStep()>=2) writeStep(3);
    else if(target.dataset.tool==='rewind') writeStep(2);
    queueMicrotask(()=>updateGuidance(rootEl()));
  },true);

  let queued=false;
  const schedule=()=>{ if(queued) return; queued=true; queueMicrotask(()=>{queued=false; const root=rootEl(); if(isSignalOne(root)){decorateMenu(root);updateGuidance(root);}}); };
  new MutationObserver(schedule).observe(workspace,{childList:true,subtree:true});
  schedule();
})();
