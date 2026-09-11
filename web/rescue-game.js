/* Relay Rescue runtime restored as a separate module. Presentation only; server replay owns rules, outcomes and history. */
'use strict';
window.RescueGame = (() => {
  let root, cb, attempt, log={moves:[],draft:[]}, program=[], selected=0, activeCase=0, xp=false, retrySubmit=false, stageCleanup=()=>{};
  const names={remember:'Recover the ticket',match:'Check the parcel',reconcile:'Resolve late orders',retry:'Send the request',new:'Print a new ticket',wait:'Wait without sending'};
  const icons={remember:'▤',match:'◇',reconcile:'⌕',retry:'↗',new:'+',wait:'◷'};
  const toolNames={remember:'Recover journal ticket',match:'Compare and hold conflict',retry:'Send this ticket',new:'Print a new ticket',inspect:'Read the order book',pause:'Pause & call support',collect:'Collect the existing gear',rewind:'Rewind & try another idea'};
  const looks={ticket:'Inspect ticket',workshop:'Look into workshop',journal:'Read saved job',parcel:'Compare parcel labels',book:'Inspect order book'};
  const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function setup(handlers){cb=handlers;if(!root){root=document.createElement('section');root.id='rescue-game';root.tabIndex=-1;document.querySelector('#workspace').append(root);}root.hidden=false;document.body.classList.add('rescue-active');}
  function hide(){stageCleanup();stageCleanup=()=>{};if(root)root.hidden=true;document.body.classList.remove('rescue-active');}
  function setResponse(value){log=structuredClone(value||{moves:[],draft:[]});program=[...(log.draft||[])];}
  function response(){return structuredClone(log);}
  function top(progress,mode){return `<header class="rg-top"><button type="button" id="rg-map" aria-label="Open rescue map">↗ <b>RELAY RESCUE</b></button><span>${esc(mode)}</span><div><span class="rg-progress">${progress} / 7 signals</span><button type="button" id="rg-options" aria-expanded="false">Menu</button></div></header><div id="rg-menu" hidden><button type="button" id="rg-xp">${xp?'Hide':'Show'} practice XP</button><button type="button" id="rg-save">Save current run</button><button type="button" id="rg-exit">Account / sign out</button><button type="button" id="rg-record">Record rehearsal and restart</button><a href="/?play=expedition">Earlier expedition & 3D prototype</a></div>`;}
  function bindTop(){
    root.querySelector('#rg-map').onclick=()=>cb.campaign();
    root.querySelector('#rg-options').onclick=e=>{const m=root.querySelector('#rg-menu');m.hidden=!m.hidden;e.currentTarget.setAttribute('aria-expanded',String(!m.hidden));};
    root.querySelector('#rg-xp').onclick=()=>{xp=!xp;root.querySelector('#rg-xp').textContent=(xp?'Hide':'Show')+' practice XP';root.querySelectorAll('.rg-xp').forEach(n=>n.hidden=!xp);};
    root.querySelector('#rg-save').disabled=!attempt||attempt.status!=='draft';root.querySelector('#rg-save').onclick=()=>cb.save();
    root.querySelector('#rg-record').disabled=!attempt||attempt.status!=='draft'||!log.moves.length;root.querySelector('#rg-record').onclick=()=>cb.submit();
    root.querySelector('#rg-exit').onclick=()=>{const b=document.querySelector('#sign-out');if(b.hidden)cb.error('Local rehearsal: your save belongs to this browser. Hosted sign-out is available after account sign-in.');else b.click();};
  }
  function world(s={},done=false){
    const effects=s.visible_effects, failed=s.failed;
    return `<div class="rg-world ${failed?'rg-world-failed':''} ${done?'rg-world-clear':''}" data-action="${esc(s.trail?.at(-1)?.action||'')}"><svg viewBox="0 0 920 360" role="img" aria-label="${done?'The bridge and signal light are restored.':'Pip and the Echo Forge are on opposite islands. A message route crosses the valley.'}">
    <defs><linearGradient id="rg-sky" x2="0" y2="1"><stop stop-color="#101e36"/><stop offset="1" stop-color="#41657c"/></linearGradient><linearGradient id="rg-water" x2="1" y2="1"><stop stop-color="#79cec4"/><stop offset="1" stop-color="#276d7e"/></linearGradient><radialGradient id="rg-glow"><stop stop-color="#f8d592" stop-opacity=".75"/><stop offset="1" stop-color="#f8d592" stop-opacity="0"/></radialGradient></defs>
    <rect width="920" height="360" fill="url(#rg-sky)"/><circle cx="773" cy="66" r="27" fill="#e9e8cd"/>
    <g fill="#cedad3"><circle cx="85" cy="44" r="2"/><circle cx="228" cy="70" r="1.5"/><circle cx="414" cy="34" r="2"/><circle cx="555" cy="69" r="1.5"/><circle cx="692" cy="32" r="2"/></g>
    <path d="M0 184L95 99L235 199L373 84L529 193L662 104L825 171L920 126V360H0Z" fill="#2d4d66"/><path d="M0 242L150 154L296 249L464 153L601 247L751 175L920 229V360H0Z" fill="#345e6d"/>
    <path d="M394 213Q533 244 452 360H672Q525 281 506 213" fill="url(#rg-water)"/>
    <path d="M15 218L240 165L388 221L367 282L274 337L53 294Z" fill="#1d3444"/><path d="M15 218L240 165L388 221L178 278Z" fill="#709f85"/><path d="M26 218L239 174L361 221L175 267Z" fill="#83b18e"/>
    <path d="M573 216L749 159L908 212L872 293L664 328L592 281Z" fill="#1d3444"/><path d="M573 216L749 159L908 212L698 270Z" fill="#719b7d"/>
    <g stroke="#caaf82" fill="none"><path d="M350 218Q475 274 619 221" stroke-width="3" stroke-dasharray="8 7"/>${done?'<path d="M361 247L609 238" stroke="#c89d65" stroke-width="17"/><path d="M364 220L612 211" stroke-width="4"/><path d="M368 218V251M419 222V250M470 220V247M520 217V246M570 214V244M610 210V242" stroke-width="4"/>':'<path d="M351 251L390 249M579 241L619 239" stroke-width="14"/>'}</g>
    <g class="rg-house"><path d="M718 152L804 165V238L718 225Z" fill="#cbb697"/><path d="M685 175L718 152V225L685 243Z" fill="#b59170"/><path d="M671 181L723 120L826 166L788 181L718 158L695 186Z" fill="#344355"/><path d="M699 209V178L715 173V206" fill="#edcb80"/><path d="M750 220V184L780 190V225" fill="#2a4450"/><path d="M774 144V114L790 119V151" fill="#ac9c83"/><circle cx="707" cy="191" r="51" fill="url(#rg-glow)"/></g>
    <g transform="translate(${done?588:252} 213)"><ellipse cy="34" rx="27" ry="7" fill="#163747" opacity=".6"/><path d="M-10 15L-16 29M10 15L16 29" stroke="#e8bf79" stroke-width="8" stroke-linecap="round"/><rect x="-17" y="-3" width="34" height="25" rx="7" fill="#ddae64"/><rect x="-23" y="-36" width="46" height="32" rx="11" fill="#f2cf8b"/><rect x="-17" y="-29" width="34" height="17" rx="7" fill="#143a4a"/><circle cx="-7" cy="-21" r="3" fill="#b3e8dd"/><circle cx="7" cy="-21" r="3" fill="#b3e8dd"/><path d="M0-36V-48" stroke="#f2cf8b" stroke-width="3"/><circle cy="-49" r="4" fill="#a4e8d9"/><path d="M-17-6L22-6L13 2L-20 2L-30 13L-37 7Z" fill="#d87b62"/></g>
    <g transform="translate(164 225)"><path d="M-26 0L1-11L27 1L0 14Z" fill="#d6b884"/><path d="M-26 0V-15L0-2V14M27 1V-14L0-2" fill="#b48e5e"/><path d="M-26-15L0-26L27-14L0-2Z" fill="#edcf94"/></g>
    <g transform="translate(838 183)"><path d="M-6 22V-53H6V22" fill="#57747a"/><circle cy="-58" r="16" fill="${done?'#f4d383':'#638d8b'}"/>${done?'<circle cy="-58" r="49" fill="url(#rg-glow)"/>':''}</g>
    <g class="rg-gears" fill="${failed?'#f09a80':'#f2d195'}" stroke="#624d38" stroke-width="3">${Array.from({length:effects===null?0:Math.min(effects||0,2)},(_,i)=>`<g transform="translate(${681+i*49} 240)"><path d="M-6-18H6L9-12L16-11L19 0L13 5L13 14L3 19L-3 14L-12 15L-19 5L-14-2L-17-11L-9-12Z"/><circle r="6" fill="#294755"/></g>`).join('')}</g>
    <g class="rg-packet"><rect x="298" y="176" width="24" height="17" rx="2" fill="#ffe5a8"/><path d="M298 176L310 185L322 176" stroke="#99754f" fill="none"/></g>
    <g fill="#244951"><path d="M68 189L93 128L115 191ZM90 204L123 147L144 203ZM835 197L858 144L882 202Z"/></g>
    </svg><div class="rg-place rg-pip-label">PIP · COURIER</div><div class="rg-place rg-shop-label">ECHO FORGE</div><div class="rg-scene-readout"><span><small>Forge effects</small><b id="rg-effects">${effects===null||effects===undefined?'Not inspected':effects+' gear'+(effects===1?'':'s')}</b></span><span><small>What we know</small><b id="rg-knowledge">${esc(s.knowledge||'Seven signals to restore')}</b></span></div></div>`;
  }
  function map(missions,a,handlers){
    setup(handlers);attempt=a;const n=missions.filter(m=>m.status==='cleared').length;const next=missions.find(m=>m.status==='unlocked')||missions.at(-1);const active=a?.status==='draft';
    root.innerHTML=top(n,'THE ECHO FORGE')+`<section class="rg-map"><div class="rg-map-brief"><span class="rg-eyebrow">RELAY RESCUE · THE ECHO FORGE</span><h1>${n===7?'From the valley to the real world.':'The storm left one dangerous silence.'}</h1><p>${n===7?'Your route is built. Now implement it against a simulated external service.':'Pip’s bridge broke. The Echo Forge may already have made the one gear Pip needs. Discover what the storm hid before another order costs the valley twice.'}</p><button class="rg-primary" type="button" id="rg-launch">${active?'Resume your run':n===7?'Replay the field challenge':n?'Restore the next signal':'Enter the story'} <span>→</span></button><p class="rg-xp" ${xp?'':'hidden'}>${a?.practice_xp||0} practice XP · not mastery</p></div>${world({},n>=6)}<nav class="rg-route" aria-label="Rescue route">${missions.map((m,i)=>`<button type="button" data-mission="${m.id}" data-status="${m.status}" ${m.status==='locked'?'disabled':''}><b>${m.status==='cleared'?'✓':i+1}</b><span>${esc(m.difficulty)}</span><small>${m.status==='locked'?'Not yet connected':m.status==='cleared'?'Signal restored':'Ready to explore'}</small></button>`).join('')}</nav><div class="rg-map-note"><b>${esc(next.title)}</b><span>${esc(next.plain_objective)}</span></div>${n===7?kit():''}${a?.snapshot?.rescue&&a.status==='submitted'?'<button type="button" id="rg-report">View last repair report</button>':''}</section>`;
    bindTop();if(root.querySelector('#rg-report'))root.querySelector('#rg-report').onclick=()=>cb.resume();root.querySelector('#rg-launch').onclick=()=>active?cb.resume():cb.start(next.id);
    root.querySelectorAll('[data-mission]').forEach(b=>b.onclick=()=>active?cb.resume():cb.start(b.dataset.mission));
  }
  function programPanel(transfer){
    return `<section class="rg-workbench" aria-label="Construct the recovery route"><div class="rg-bench-title"><b>${transfer?'Recovery policy':'Pip’s route'}</b><span>Choose a block below. Tap a slot to replace it.</span></div><div class="rg-slots">${Array.from({length:4},(_,i)=>`<button type="button" class="rg-slot ${i===selected?'selected':''}" data-slot="${i}" aria-label="Route slot ${i+1}: ${names[program[i]]||'empty'}"><small>${i+1}</small><b>${program[i]?icons[program[i]]:'+'}</b><span>${names[program[i]]||'Empty slot'}</span></button>`).join('')}</div><div class="rg-palette">${Object.entries(names).map(([k,n])=>`<button type="button" data-block="${k}"><b aria-hidden="true">${icons[k]}</b>${n}</button>`).join('')}</div><div class="rg-bench-footer"><button type="button" id="rg-clear-route">Clear route</button><span id="rg-route-status">${program.length?program.length+' / 4 blocks placed':'Sending ends the route. What must happen first?'}</span></div></section>`;
  }
  function buildingControls(transfer,a){
    const aidValue=esc(a?.response?.aid_declaration||'unknown');
    return `<div class="rg-build-actions"><p class="rg-run-note">${transfer?'No practice preview here: seal the route before incident results are revealed.':'The storm runs your route in order. Change the blocks, then test what actually happens.'}</p>${transfer?`<label class="rg-help-label">Outside help for this challenge<select id="rg-aid"><option value="unknown"${aidValue==='unknown'?' selected':''}>Not declared</option><option value="none"${aidValue==='none'?' selected':''}>No outside help</option><option value="external"${aidValue==='external'?' selected':''}>Yes, outside help</option></select></label>`:''}<button type="button" class="rg-primary" id="rg-run" ${program.length?'':'disabled'}>${transfer?'Commit incident repair':'Run the storm'} →</button></div>`;
  }
  function casePanel(rows){
    if(!rows?.length)return '';
    const i=Math.min(activeCase,rows.length-1), row=rows[i];
    return `<section class="rg-results" aria-label="Route test results"><div class="rg-case-tabs">${rows.map((r,i)=>`<button type="button" data-case="${i}" aria-pressed="${i===activeCase}">${r.correct?'✓':'!'} ${esc(r.name)}</button>`).join('')}</div><div class="rg-case-detail"><b>${esc(row.name)} · ${esc(row.status||'')}</b><span>${esc(row.reason)}</span><ol>${(row.trail||[]).map(t=>`<li><strong>${esc(names[t.block])}</strong><span>${esc(t.text)}</span></li>`).join('')}</ol></div></section>`;
  }
  function render(a,missions,handlers){
    stageCleanup();stageCleanup=()=>{};setup(handlers);attempt=a;const s=a.rescue_state,c=a.snapshot.rescue,n=missions.filter(m=>m.status==='cleared').length;
    const submitted=a.status==='submitted',clear=submitted&&a.assessment.outcome==='correct',building=c.level>=6,transfer=c.level===7;
    const localChanged=building&&!submitted&&JSON.stringify(program)!==JSON.stringify(s.program||[]);
    const ready=!submitted&&Boolean(s.complete)&&!localChanged;
    root.innerHTML=top(n,`${a.snapshot.mission.difficulty.toUpperCase()} · SIGNAL ${c.level}`)+`<section class="rg-encounter ${clear?'clear':''}"><div class="rg-objective"><span>${esc(c.brief)}</span><h1>${esc(c.goal)}</h1><p class="rg-xp" ${xp?'':'hidden'}>${a.practice_xp||0} practice XP · not mastery</p></div><div class="rg-arena"><div class="rg-field">${transfer?incident(c,s):world(s,clear||ready)}${building&&!submitted?programPanel(transfer)+buildingControls(transfer,a):''}${ready||submitted?clearPanel(c,a,transfer,{ready,clear}):''}</div>${building?'':consolePanel(c,s)}</div>${building?casePanel(submitted?(a.assessment?.rows||s.rows):s.rows):''}<div id="rg-save-recovery" hidden><p>Save not confirmed. Your move is retained here. Retry saving, not the action.</p><button type="button" id="rg-retry-save" class="rg-primary">Retry save</button></div>${!clear?evidence(a):''}</section>`;
    bindTop();
    root.querySelector('#rg-map').onclick=()=>cb.campaign();
    if(!building){root.querySelectorAll('[data-look]').forEach(b=>b.onclick=()=>look(b.dataset.look));root.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>move(b.dataset.tool));}
    if(building&&!submitted){root.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{selected=+b.dataset.slot;render(a,missions,handlers);});root.querySelectorAll('[data-block]').forEach(b=>b.onclick=()=>{const p=[...program];p[selected]=b.dataset.block;while(p.length&&p.at(-1)==null)p.pop();setProgram(p);render(a,missions,handlers);});root.querySelector('#rg-clear-route').onclick=()=>{setProgram([]);selected=0;render(a,missions,handlers);};root.querySelector('#rg-run').onclick=()=>run();}root.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>{activeCase=+b.dataset.case;render(a,missions,handlers);});
    root.querySelector('#rg-next')?.addEventListener('click',async()=>{
      if(!submitted){if(await cb.submit()){const nextId=`rescue-${String(c.level+1).padStart(2,'0')}`;if(c.level<7)await cb.start(nextId);else cb.campaign();}}
      else if(!clear)await cb.start(a.snapshot.mission.id);
      else if(transfer)cb.campaign();
      else await cb.start(`rescue-${String(c.level+1).padStart(2,'0')}`);
    });
    root.querySelector('#rg-retry-save')?.addEventListener('click',()=>retrySubmit?cb.submit():cb.save());
    root.querySelector('#rg-aid')?.addEventListener('change',e=>{const hidden=document.querySelector('#aid-declaration');if(hidden)hidden.value=e.target.value;cb.edit();});
    if(window.RescueStage) stageCleanup=RescueStage.attach(root,{...s,stale:localChanged},c,{look:key=>look(key),sandbox:storm=>sandbox(storm),caseIndex:activeCase,autoPlay:building});
  }
  function setProgram(p){program=p.filter(Boolean).slice(0,4);log.draft=[...program];cb.edit();}
  function record(move){log.moves.push(move);cb.edit();}
  async function act(move,submit=false){
    if(!attempt||attempt.status!=='draft')return false;
    if(log.moves.length!==attempt.response.rescue.moves.length){cb.error('Save the pending move before acting again.');return false;}
    retrySubmit=submit;log.draft=[...program];record(move);
    const feedback=root?.querySelector('#rg-feedback');if(feedback)feedback.textContent=submit?'Committing your repair before revealing the result…':'Pip is trying your idea…';
    const ok=await(submit?cb.submit():cb.save());
    if(!ok){const recovery=root?.querySelector('#rg-save-recovery');if(recovery)recovery.hidden=false;}
    return ok;
  }
  function look(key){return act({look:key});}
  function move(action){return act(action);}
  function run(){const transfer=attempt?.snapshot?.rescue?.level===7;return act({program:[...program]},transfer);}
  function sandbox(storm){return act({storm:{...storm,program:[...program]}});}
  function consolePanel(c,s){
    return `<aside class="rg-console"><div class="rg-pip-message"><span class="rg-face" aria-hidden="true">••</span><div><b>Pip</b><p id="rg-feedback">${esc(s.feedback||c.brief)}</p></div></div><div class="rg-ticket"><small>Current ticket</small><b>${esc(s.ticket||'order-01')}</b><span>${esc(s.payload||'one bridge gear')}</span></div>${c.inspections?.length?`<div class="rg-observations">${c.inspections.map(k=>`<button type="button" data-look="${k}">${esc(looks[k]||k)}</button>`).join('')}</div>`:''}<div class="rg-tools">${(s.available||[]).map(k=>`<button type="button" data-tool="${k}" ${s.complete||s.failed?'disabled':''}><b>${esc(toolNames[k]||k)}</b></button>`).join('')}</div><div class="rg-journal"><small>Field journal</small><p>${esc(s.journal||'No clues recorded yet.')}</p></div></aside>`;
  }
  function clearPanel(c,a,transfer,{ready=false,clear=false}={}){const ok=ready||clear;return `<section class="rg-clear"><span>${ok?'✓ SIGNAL RESTORED':'⚠ REPAIR NEEDED'}</span><h2>${esc(ok?(c.success||'Route stable'):'The storm found a counterexample.')}</h2><p>${esc(ok?(c.debrief||'Pip can move again.'):'Try a different route and test it again.')}</p><button type="button" class="rg-primary" id="rg-next">${ready?'Lock in this clear':!clear?'Try again':transfer?'Return to map':'Continue to next signal'} →</button></section>`;}
  function incident(c,s){return `<section class="rg-incident"><span>FIELD ASSIGNMENT</span><h2>${esc(c.brief)}</h2><p>${esc(c.goal)}</p><div class="rg-incident-grid"><div><small>JOB ID</small><b>${esc(c.job_id||'export-7')}</b></div><div><small>ATTEMPTS</small><b>${esc(c.max_attempts||3)}</b></div><div><small>RETENTION</small><b>${esc(c.retention_seconds||86400)}s</b></div></div>${s.sealed?'<p class="rg-sealed">Policy sealed for this attempt.</p>':''}</section>`;}
  function evidence(a){return `<details class="rg-evidence"><summary>Evidence & attempt state</summary><pre id="rg-evidence-json">${esc(JSON.stringify({assessment:a.assessment,evidence:a.evidence,response:a.response},null,2))}</pre></details>`;}
  function kit(){return `<section id="rg-kit" class="rg-kit"><h3>Relay repair kit</h3><p>Reference implementation and external-service tests for the transfer challenge.</p><a href="/relay-repair-kit.zip" download>Download repair kit</a></section>`;}
  function sync(busy,a){attempt=a;if(!root)return;const pending=Boolean(a?.snapshot?.rescue)&&log.moves.length!==a.response.rescue.moves.length;const save=root.querySelector('#rg-save');if(save)save.disabled=busy||pending||!a||a.status!=='draft';const record=root.querySelector('#rg-record');if(record)record.disabled=busy||pending||!a||a.status!=='draft'||!log.moves.length;root.querySelectorAll('[data-tool],[data-look],[data-world-look],[data-slot],[data-block],#rg-run,#rg-clear-route,#rg-aid').forEach(n=>{if(busy||pending)n.disabled=true;});const recovery=root.querySelector('#rg-save-recovery');if(recovery)recovery.hidden=busy||!pending;let status=root.querySelector('#rg-sync');if(!status){status=document.createElement('span');status.id='rg-sync';status.className='rg-sync';root.querySelector('.rg-top')?.append(status);}status.textContent=busy?'Saving…':pending?'Save not confirmed':'Saved';}
  return {map,render,hide,setResponse,response,sync};
})();