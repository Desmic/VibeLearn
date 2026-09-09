/* Render observed causal steps. This module never evaluates a policy or writes evidence. */
'use strict';
window.RescueStage = (() => {
  const DESCRIPTIONS = {
    remember: 'Load the durable ID of this job. A worker restart must not change it.',
    match: 'Compare this request with the saved parameters. Stop on a mismatch.',
    reconcile: 'Only after expiry: use the authoritative record. Return an existing result, permit a proven-absent retry, or pause if unknown.',
    retry: 'Send the current ID and parameters. This ends the route, even when blocks remain.',
    new: 'Replace the job ID with a different one. This does not authorize another effect.',
    wait: 'Stop here with the job still pending. A known safe delivery would not be completed.'
  };
  const STATIONS = ['Footbridge', 'Courier dock', 'Sorting station', 'Old lookout', 'Signal tower', 'Storm engine', 'Field assignment'];
  const propMarkup = {
    2: '<g transform="translate(365 201)"><path d="M-27-24L3-31L28-19V19L0 30L-27 18Z" fill="#dfcb94" stroke="#4e6154" stroke-width="3"/><path d="M0-22V25M-17-12L-5-15M8-14L20-10M-17-1L-5-4M8-3L20 1" stroke="#947d50" stroke-width="3"/></g>',
    3: '<g transform="translate(332 214)"><path d="M-33-32L-9-42L13-29V6L-10 16L-33 4Z" fill="#d5b378" stroke="#745e47" stroke-width="3"/><path d="M3-11L30-24L57-10V28L31 41L3 27Z" fill="#d88c72" stroke="#745e47" stroke-width="3"/><path d="M-24-20L-15-23M14 0L42 13M15 10L42 23" stroke="#f3e2b3" stroke-width="5"/></g>',
    4: '<g transform="translate(180 149)"><circle r="28" fill="#e0c386" stroke="#5b665d" stroke-width="5"/><path d="M0-20V0L16 10" fill="none" stroke="#334953" stroke-width="4"/><path d="M-14 25L-20 53M14 25L20 53" stroke="#8c8065" stroke-width="5"/></g>',
    5: '<g transform="translate(371 181)"><rect x="-28" y="-21" width="56" height="44" rx="7" fill="#bcc8a1" stroke="#40595c" stroke-width="4"/><rect x="-20" y="-13" width="40" height="23" rx="3" fill="#243e4b"/><text x="0" y="5" text-anchor="middle" fill="#f0d190" font-size="20">?</text><path d="M0-21V-37M-8-38L0-43L8-38" fill="none" stroke="#bdcdad" stroke-width="4"/></g>'
  };
  function attach(root, state, config, {look, sandbox, caseIndex = 0, autoPlay = false} = {}) {
    const abort = new AbortController(), timers = [];
    const listen = (n, type, fn) => n?.addEventListener(type, fn, {signal: abort.signal});
    const world = root.querySelector('.rg-world'), svg = world?.querySelector('svg');
    if (svg && propMarkup[config.level]) {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.innerHTML = propMarkup[config.level]; svg.append(group);
    }
    if (world && config.level < 6) {
      world.dataset.station = String(config.level);
      const caption = document.createElement('span'); caption.className = 'rg-station';
      caption.textContent = STATIONS[config.level-1]; world.append(caption);
      const wrap = document.createElement('div'); wrap.className = 'rg-world-targets';
      for (const key of config.inspections) {
        const button = document.createElement('button'); button.type = 'button';
        button.className = `rg-world-target target-${key}`;
        button.dataset.worldLook = key; button.textContent = key === 'workshop' ? 'Workshop' : key === 'parcel' ? 'Parcels' : key === 'book' ? 'Order book' : key === 'journal' ? 'Journal' : 'Ticket';
        button.setAttribute('aria-label', `Inspect ${button.textContent.toLowerCase()} in the scene`);
        button.disabled = state.complete || state.failed;
        listen(button, 'click', () => look?.(key)); wrap.append(button);
      }
      world.append(wrap);
    }
    const bench = root.querySelector('.rg-workbench');
    if (bench) {
      const description = document.createElement('p'); description.className = 'rg-block-help';
      description.id = 'rg-block-help'; description.setAttribute('role','status');
      description.textContent = 'Choose any block to place it. Explore the behavior here before running your route.';
      bench.insertBefore(description, bench.querySelector('.rg-bench-footer'));
      for (const button of bench.querySelectorAll('[data-block]')) {
        button.setAttribute('aria-describedby','rg-block-help');
        const explain=()=>{description.textContent=DESCRIPTIONS[button.dataset.block];};
        listen(button,'focus',explain);listen(button,'pointerenter',explain);listen(button,'click',explain);
      }
    }
    if(bench){
      const controls=document.createElement('div');controls.className='rg-machine-controls';
      const note=root.querySelector('.rg-run-note'),aid=root.querySelector('.rg-help-label'),run=root.querySelector('#rg-run');
      if(note)controls.append(note);if(aid)controls.append(aid);if(run)controls.append(run);
      bench.append(controls);
    }
    if(config.level===6 && config.sandbox_enabled && bench){
      const panel=document.createElement('details');panel.className='rg-sandbox';panel.open=Boolean(state.sandbox);
      const title=document.createElement('summary');title.textContent='Make your own storm · optional playground';panel.append(title);
      const intro=document.createElement('p');intro.textContent='Change the conditions and try your route. These experiments do not award a clear or replace the six required storm tests.';panel.append(intro);
      const form=document.createElement('form');form.className='rg-storm-controls';
      const settings=state.sandbox?.settings||{elapsed:25,retention:24,record:'committed',changed:false,worker:true};
      for(const [key,label,min] of [['elapsed','Retry arrives after (hours)',0],['retention','Service remembers for (hours)',1]]){
        const wrap=document.createElement('label');wrap.textContent=label;
        const input=document.createElement('input');input.type='number';input.min=String(min);input.max='72';input.step='1';input.required=true;input.value=settings[key];input.name=key;input.id=`rg-storm-${key}`;
        wrap.append(input);form.append(wrap);
      }
      const label=document.createElement('label');label.textContent='What the authoritative record can report';
      const select=document.createElement('select');select.name='record';select.id='rg-storm-record';
      for(const [value,text] of [['committed','Existing result confirmed'],['absent','Proven absent; no request in flight'],['unavailable','Unknown: record unreachable']]){const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o);}
      select.value=settings.record;label.append(select);form.append(label);
      for(const [key,text] of [['changed','Request parameters changed'],['worker','Courier restarted with a different ID']]){
        const wrap=document.createElement('label');wrap.className='rg-check';
        const input=document.createElement('input');input.type='checkbox';input.name=key;input.id=`rg-storm-${key}`;input.checked=settings[key];
        wrap.append(input,document.createTextNode(text));form.append(wrap);
      }
      const run=document.createElement('button');run.type='submit';run.className='rg-primary';run.id='rg-sandbox-run';run.textContent='Test my storm →';form.append(run);
      listen(form,'submit',e=>{e.preventDefault();if(form.reportValidity())sandbox?.({elapsed:Number(form.elements.elapsed.value),retention:Number(form.elements.retention.value),record:form.elements.record.value,changed:form.elements.changed.checked,worker:form.elements.worker.checked});});
      panel.append(form);
      if(state.sandbox){
        const result=document.createElement('div');result.className='rg-sandbox-result';result.setAttribute('role','status');
        const heading=document.createElement('strong');heading.textContent=`${state.sandbox.correct?'Route holds':'Repair needed'} · ${state.sandbox.status} · ${state.sandbox.effects} effect(s)`;
        result.append(heading);
        for(const step of state.sandbox.trail){const line=document.createElement('p');line.textContent=step.text;result.append(line);}
        const scope=document.createElement('p');scope.textContent='Playground observation, not an assessment. In the unknown-record scenario an earlier effect exists, but the worker cannot see it.';result.append(scope);
        panel.append(result);
      }
      bench.after(panel);
    }
    const rows = state.rows || [];
    if (rows.length) {
      const row = rows[Math.min(caseIndex,rows.length-1)];
      const area = document.createElement('section'); area.className = 'rg-live-route';
      area.setAttribute('aria-label','Observed route execution');
      const heading=document.createElement('strong');heading.textContent=`${state.stale?'Previously tested route · ':''}${row.name} · ${row.correct?'route holds':'repair needed'}`;
      const lane=document.createElement('div');lane.className='rg-live-lane';
      const steps=row.trail||[];
      for(const step of steps){const n=document.createElement('span');n.className='rg-live-step';n.textContent=({remember:'Ticket',match:'Parcel',reconcile:'Record',retry:'Send',new:'New ID',wait:'Wait'})[step.block];n.setAttribute('aria-hidden','true');lane.append(n);}
      const feedback=document.createElement('p');feedback.setAttribute('role','status');
      const play=document.createElement('button');play.type='button';play.textContent='Watch this case';play.id='rg-replay-case';
      let frameIndex=-1;
      const show=(i)=>{
        frameIndex=i;
        lane.querySelectorAll('span').forEach((n,k)=>n.classList.toggle('active',k===i));
        root.querySelectorAll('[data-slot]').forEach((n,k)=>n.classList.toggle('executing',k===i&&!state.stale));
        feedback.textContent=steps[i]?.text||row.reason;
      };
      const cancel=()=>{timers.splice(0).forEach(clearTimeout);};
      const run=()=>{
        cancel();show(0);
        if(matchMedia('(prefers-reduced-motion: reduce)').matches){show(steps.length-1);return;}
        steps.forEach((_,i)=>timers.push(setTimeout(()=>show(i),i*480)));
      };
      const step=document.createElement('button');step.type='button';step.textContent='Next step';step.id='rg-step-case';
      listen(step,'click',()=>{cancel();show((frameIndex+1)%Math.max(steps.length,1));});
      const playback=document.createElement('div');playback.className='rg-playback-controls';playback.append(play,step);
      area.append(heading,lane,feedback,playback);
      const tabs=root.querySelector('.rg-case-tabs');if(tabs)area.prepend(tabs);
      if(bench)bench.append(area);else root.querySelector('.rg-case-detail')?.before(area);
      const detail=root.querySelector('.rg-case-detail');
      if(detail){const disclosure=document.createElement('details');disclosure.className='rg-postmortem';
        const summary=document.createElement('summary');summary.textContent='Inspect the complete execution trace';
        detail.before(disclosure);disclosure.append(summary,detail);}
      listen(play,'click',run);
      for(const button of root.querySelectorAll('[data-block],#rg-clear-route'))listen(button,'click',()=>{
        cancel();root.querySelectorAll('.executing').forEach(n=>n.classList.remove('executing'));
        heading.textContent='Observed result for the PREVIOUS route';feedback.textContent='Your route changed. Run it again to see this version’s behavior.';
      });
      if(config.level===6 && world){
        world.querySelector('#rg-effects').textContent=`${row.effects} gear${row.effects===1?'':'s'} in this test`;
        world.querySelector('#rg-knowledge').textContent=row.status==='paused'?'Unknown kept pending':row.status==='conflict'?'Changed request stopped':row.status==='confirmed'?'Result confirmed':'Route unfinished';
      }
      if(autoPlay)run();else show(steps.length-1);
    }
    return ()=>{abort.abort();timers.forEach(clearTimeout);};
  }
  return {attach};
})();

/* Relay Rescue: presentation only. Server replay owns rules, outcomes and history. */
'use strict';
window.RescueGame = (() => {
  let disposeStage=()=>{}, previousRun='';
  let root, cb, attempt, log={moves:[],draft:[]}, program=[], selected=0, activeCase=0, xp=false, retrySubmit=false;
  const names={remember:'Recover the ticket',match:'Check the parcel',reconcile:'Resolve late orders',retry:'Send the request',new:'Print a new ticket',wait:'Wait without sending'};
  const icons={remember:'▤',match:'◇',reconcile:'⌕',retry:'↗',new:'+',wait:'◷'};
  const toolNames={remember:'Recover journal ticket',match:'Compare and hold conflict',retry:'Send this ticket',new:'Print a new ticket',inspect:'Read the order book',pause:'Pause & call support',collect:'Collect the existing gear',rewind:'Rewind & try another idea'};
  const looks={ticket:'Inspect ticket',workshop:'Look into workshop',journal:'Read saved job',parcel:'Compare parcel labels',book:'Inspect order book'};
  const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function setup(handlers){
    disposeStage();cb=handlers;
    if(!root){root=document.createElement('section');root.id='rescue-game';root.tabIndex=-1;document.querySelector('#workspace').append(root);}
    root.hidden=false;document.body.classList.add('rescue-active');
  }
  function hide(){disposeStage();if(root)root.hidden=true;document.body.classList.remove('rescue-active');}
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
    return `<div class="rg-world ${failed?'rg-world-failed':''} ${done?'rg-world-clear':''}" data-action="${esc(s.trail?.at(-1)?.action||'')}"><svg viewBox="0 0 920 360" role="img" aria-label="${done?'The bridge and signal light are restored.':'Pip and the workshop are on opposite islands. A message route crosses the valley.'}">
    <defs><linearGradient id="rg-sky" x2="0" y2="1"><stop stop-color="#101e36"/><stop offset="1" stop-color="#41657c"/></linearGradient><linearGradient id="rg-water" x2="1" y2="1"><stop stop-color="#79cec4"/><stop offset="1" stop-color="#276d7e"/></linearGradient><radialGradient id="rg-glow"><stop stop-color="#f8d592" stop-opacity=".75"/><stop offset="1" stop-color="#f8d592" stop-opacity="0"/></radialGradient></defs>
    <rect width="920" height="360" fill="url(#rg-sky)"/><circle cx="773" cy="66" r="27" fill="#e9e8cd"/>
    <g fill="#cedad3"><circle cx="85" cy="44" r="2"/><circle cx="228" cy="70" r="1.5"/><circle cx="414" cy="34" r="2"/><circle cx="555" cy="69" r="1.5"/><circle cx="692" cy="32" r="2"/></g>
    <path d="M0 184L95 99L235 199L373 84L529 193L662 104L825 171L920 126V360H0Z" fill="#2d4d66"/><path d="M0 242L150 154L296 249L464 153L601 247L751 175L920 229V360H0Z" fill="#345e6d"/>
    <path d="M394 213Q533 244 452 360H672Q525 281 506 213" fill="url(#rg-water)"/>
    <path d="M15 218L240 165L388 221L367 282L274 337L53 294Z" fill="#1d3444"/><path d="M15 218L240 165L388 221L178 278Z" fill="#709f85"/><path d="M26 218L239 174L361 221L175 267Z" fill="#83b18e"/>
    <path d="M573 216L749 159L908 212L872 293L664 328L592 281Z" fill="#1d3444"/><path d="M573 216L749 159L908 212L698 270Z" fill="#719b7d"/>
    <g stroke="#caaf82" fill="none"><path d="M350 218Q475 274 619 221" stroke-width="3" stroke-dasharray="8 7"/>
    ${done?'<path d="M361 247L609 238" stroke="#c89d65" stroke-width="17"/><path d="M364 220L612 211" stroke-width="4"/><path d="M368 218V251M419 222V250M470 220V247M520 217V246M570 214V244M610 210V242" stroke-width="4"/>':'<path d="M351 251L390 249M579 241L619 239" stroke-width="14"/>'}</g>
    <g class="rg-house"><path d="M718 152L804 165V238L718 225Z" fill="#cbb697"/><path d="M685 175L718 152V225L685 243Z" fill="#b59170"/><path d="M671 181L723 120L826 166L788 181L718 158L695 186Z" fill="#344355"/><path d="M699 209V178L715 173V206" fill="#edcb80"/><path d="M750 220V184L780 190V225" fill="#2a4450"/><path d="M774 144V114L790 119V151" fill="#ac9c83"/><circle cx="707" cy="191" r="51" fill="url(#rg-glow)"/></g>
    <g transform="translate(${done?588:252} 213)"><ellipse cy="34" rx="27" ry="7" fill="#163747" opacity=".6"/><path d="M-10 15L-16 29M10 15L16 29" stroke="#e8bf79" stroke-width="8" stroke-linecap="round"/><rect x="-17" y="-3" width="34" height="25" rx="7" fill="#ddae64"/><rect x="-23" y="-36" width="46" height="32" rx="11" fill="#f2cf8b"/><rect x="-17" y="-29" width="34" height="17" rx="7" fill="#143a4a"/><circle cx="-7" cy="-21" r="3" fill="#b3e8dd"/><circle cx="7" cy="-21" r="3" fill="#b3e8dd"/><path d="M0-36V-48" stroke="#f2cf8b" stroke-width="3"/><circle cy="-49" r="4" fill="#a4e8d9"/><path d="M-17-6L22-6L13 2L-20 2L-30 13L-37 7Z" fill="#d87b62"/></g>
    <g transform="translate(164 225)"><path d="M-26 0L1-11L27 1L0 14Z" fill="#d6b884"/><path d="M-26 0V-15L0-2V14M27 1V-14L0-2" fill="#b48e5e"/><path d="M-26-15L0-26L27-14L0-2Z" fill="#edcf94"/></g>
    <g transform="translate(838 183)"><path d="M-6 22V-53H6V22" fill="#57747a"/><circle cy="-58" r="16" fill="${done?'#f4d383':'#638d8b'}"/>${done?'<circle cy="-58" r="49" fill="url(#rg-glow)"/>':''}</g>
    <g class="rg-gears" fill="${failed?'#f09a80':'#f2d195'}" stroke="#624d38" stroke-width="3">${Array.from({length:effects===null?0:Math.min(effects||0,2)},(_,i)=>`<g transform="translate(${681+i*49} 240)"><path d="M-6-18H6L9-12L16-11L19 0L13 5L13 14L3 19L-3 14L-12 15L-19 5L-14-2L-17-11L-9-12Z"/><circle r="6" fill="#294755"/></g>`).join('')}</g>
    <g class="rg-packet"><rect x="298" y="176" width="24" height="17" rx="2" fill="#ffe5a8"/><path d="M298 176L310 185L322 176" stroke="#99754f" fill="none"/></g>
    <g fill="#244951"><path d="M68 189L93 128L115 191ZM90 204L123 147L144 203ZM835 197L858 144L882 202Z"/></g>
    </svg><div class="rg-place rg-pip-label">PIP · COURIER</div><div class="rg-place rg-shop-label">WORKSHOP</div><div class="rg-scene-readout"><span><small>Service effects</small><b id="rg-effects">${effects===null||effects===undefined?'Not inspected':effects+' gear'+(effects===1?'':'s')}</b></span><span><small>What we know</small><b id="rg-knowledge">${esc(s.knowledge||'Seven signals to restore')}</b></span></div></div>`;
  }
  function map(missions,a,handlers){
    setup(handlers);attempt=a;const n=missions.filter(m=>m.status==='cleared').length;const next=missions.find(m=>m.status==='unlocked')||missions.at(-1);const active=a?.status==='draft';
    root.innerHTML=top(n,'THE MISSING DELIVERY')+`<section class="rg-map"><div class="rg-map-brief"><span class="rg-eyebrow">A SYSTEMS ADVENTURE</span><h1>${n===7?'From the valley to the real world.':'One job.<br>One result.'}</h1><p>${n===7?'Your route is built. Now implement it against a simulated external service.':'Pip needs your help. Repair the valley’s delivery network by discovering what the storm broke.'}</p><button class="rg-primary" type="button" id="rg-launch">${active?'Resume your run':n===7?'Replay the field challenge':n?'Restore the next signal':'Help Pip restore the valley'} <span>→</span></button><p class="rg-xp" ${xp?'':'hidden'}>${a?.practice_xp||0} practice XP · not mastery</p></div>${world({},n>=6)}<nav class="rg-route" aria-label="Rescue route">${missions.map((m,i)=>`<button type="button" data-mission="${m.id}" data-status="${m.status}" ${m.status==='locked'?'disabled':''}><b>${m.status==='cleared'?'✓':i+1}</b><span>${esc(m.difficulty)}</span><small>${m.status==='locked'?'Not yet connected':m.status==='cleared'?'Replay available':'Ready to explore'}</small></button>`).join('')}</nav><div class="rg-map-note"><b>${esc(next.title)}</b><span>${esc(next.plain_objective)}</span></div>${n===7?kit():''}${a?.snapshot?.rescue&&a.status==='submitted'?'<button type="button" id="rg-report">View last repair report</button>':''}</section>`;
    bindTop();if(root.querySelector('#rg-report'))root.querySelector('#rg-report').onclick=()=>cb.resume();root.querySelector('#rg-launch').onclick=()=>active?cb.resume():cb.start(next.id);
    root.querySelectorAll('[data-mission]').forEach(b=>b.onclick=()=>active?cb.resume():cb.start(b.dataset.mission));
  }
  function programPanel(transfer){
    return `<section class="rg-workbench" aria-label="Construct the recovery route"><div class="rg-bench-title"><b>${transfer?'Recovery policy':'Pip’s route'}</b><span>Choose a block below. Tap a slot to replace it.</span></div><div class="rg-slots">${Array.from({length:4},(_,i)=>`<button type="button" class="rg-slot ${i===selected?'selected':''}" data-slot="${i}" aria-label="Route slot ${i+1}: ${names[program[i]]||'empty'}"><small>${i+1}</small><b>${program[i]?icons[program[i]]:'+'}</b><span>${names[program[i]]||'Empty slot'}</span></button>`).join('')}</div><div class="rg-palette">${Object.entries(names).map(([k,n])=>`<button type="button" data-block="${k}"><b aria-hidden="true">${icons[k]}</b>${n}</button>`).join('')}</div><div class="rg-bench-footer"><button type="button" id="rg-clear-route">Clear route</button><span id="rg-route-status">${program.length?program.length+' / 4 blocks placed':'Sending ends the route. What must happen first?'}</span></div></section>`;
  }
  function casePanel(rows){
    if(!rows?.length)return '';
    const i=Math.min(activeCase,rows.length-1), row=rows[i];
    return `<section class="rg-results" aria-label="Route test results"><div class="rg-case-tabs">${rows.map((r,i)=>`<button type="button" data-case="${i}" aria-pressed="${i===activeCase}">${r.correct?'✓':'!'} ${esc(r.name)}</button>`).join('')}</div><div class="rg-case-detail"><b>${esc(row.name)} · ${esc(row.status||'')}</b><span>${esc(row.reason)}</span><ol>${(row.trail||[]).map(t=>`<li><strong>${esc(names[t.block])}</strong><span>${esc(t.text)}</span></li>`).join('')}</ol></div></section>`;
  }
  function render(a,missions,handlers){
    setup(handlers);attempt=a;const s=a.rescue_state,c=a.snapshot.rescue,n=missions.filter(m=>m.status==='cleared').length;
    const submitted=a.status==='submitted',unobserved=a.assessment.outcome==='not_observed',clear=submitted&&a.assessment.outcome==='correct',building=c.level>=6,transfer=c.level===7;
    const trialFeedback = building && !submitted && s.rows.length
      ? `${s.rows.filter(r=>r.correct).length} of ${s.rows.length} required storms handled. ${s.complete?'Pip’s route is ready.':'Watch the failed case, change a block, then run the route again.'}`
      : s.feedback;
    root.innerHTML=top(n,`${a.snapshot.mission.difficulty.toUpperCase()} · SIGNAL ${c.level}`)+`<section class="rg-encounter"><header class="rg-objective"><div><span class="rg-eyebrow">${esc(c.title)}</span><h1>${esc(c.goal)}</h1></div><span id="rg-sync" role="status">Saved</span></header><div class="rg-arena ${building?'rg-building':''}"><div class="rg-field">${transfer?`<section class="rg-incident"><span class="rg-eyebrow">ON CALL / INCIDENT EX-721</span><h2>One export. Two workers. No reply.</h2><p>Worker A requested an export and crashed. Worker B must recover it without creating another file.</p><div class="rg-real-flow"><b>Worker A <small>crashed</small></b><span>→</span><b>Export API <small>result uncertain</small></b><span>←</span><b>Worker B <small>your repair</small></b></div><dl><dt>Durable job ID</dt><dd>export-721</dd><dt>New worker ID</dt><dd>worker-B-44</dd><dt>Idempotency retention</dt><dd>6 hours, starting at commit</dd><dt>Status endpoint</dt><dd>Committed / definitively absent with no in-flight call / unavailable</dd></dl><p>Parameters may change. Retries may arrive before, at, or after expiry. Build the policy for all these conditions.</p></section>`:world(s,clear||s.complete)}${building&&!submitted?programPanel(transfer):''}${!building?`<div class="rg-observations" aria-label="Inspect the evidence">${c.inspections.map(k=>`<button type="button" data-look="${k}">${s.looked.includes(k)?'✓':'⌕'} ${looks[k]}</button>`).join('')}</div>`:''}</div><aside class="rg-console"><div class="rg-pip-message ${s.failed?'rg-warning':''}" role="status" aria-live="polite"><div class="rg-face" aria-hidden="true">••</div><div><strong>${transfer?'INCIDENT BRIEF':'PIP'}</strong><p id="rg-feedback">${esc(submitted?clear?c.reward:unobserved?'The edited route is saved, but has not been tested. Start another run to test your revision.':'The policy did not handle every incident safely. Inspect the report, then try a revised policy.':trialFeedback)}</p></div></div>${!building?`<div class="rg-ticket"><small>CURRENT TICKET</small><b id="rg-ticket">${esc(s.ticket)}</b><span>${c.c.elapsed}h elapsed / ${c.c.retention}h remembered</span></div><div class="rg-tools" aria-label="Your actions">${s.available.map(k=>`<button type="button" data-tool="${k}" class="${k==='rewind'?'rg-primary':''}">${toolNames[k]}</button>`).join('')}</div>`:''}
    ${building&&!submitted?`<p class="rg-run-note">${transfer?'No practice run here. Commit your policy before any results are revealed.':'The storm tests your actual route, in order. A safe pause is not a completed delivery.'}</p>${transfer?'<label class="rg-help-label">Outside help for this challenge<select id="rg-aid"><option value="unknown">Not declared</option><option value="none">No outside help</option><option value="external">Yes, outside help</option></select></label>':''}<button type="button" class="rg-primary" id="rg-run" ${program.length?'':'disabled'}>${transfer?'Commit incident repair':'Run the storm'} →</button>`:''}
    ${(s.complete&&!submitted)||submitted?`<section class="rg-clear"><span class="rg-eyebrow">${clear||s.complete?'SIGNAL RESTORED':'REPAIR REPORT'}</span><h2>${clear||s.complete?(c.level===7?'Ready to try real code.':'You changed what happens.'):unobserved?'An untested repair.':'A counterexample found.'}</h2>${!transfer?`<p>${esc(c.rule)}</p>`:'<p>Your first policy and its help declaration are saved separately from later attempts. Passing these cases does not prove a production implementation.</p>'}<button type="button" class="rg-primary" id="rg-next">${!submitted?'Continue to the next signal':clear&&c.level===7?'View repair kit':clear?'Continue rescue':'Revise the policy'} →</button><p class="rg-xp" ${xp?'':'hidden'}>${a.practice_xp||0} practice XP · not mastery</p></section>`:''}
    <div id="rg-save-recovery" hidden><p>Save not confirmed. Your move is retained here. Retry saving, not the action.</p><button type="button" id="rg-retry-save" class="rg-primary">Retry save</button></div>
    <details class="rg-journal"><summary>Field journal & real-world meaning</summary><p>${esc(transfer&&!submitted?(a.hints.join(' ')||'No clue revealed for this challenge. Requesting one records help.'):(a.hints.join(' ')||c.formal))}</p>${transfer&&!submitted?'':`<p>${esc(a.snapshot.assumptions)}</p>`}<button type="button" id="rg-hint">Ask for a clue (records help)</button></details></aside></div>${building?casePanel(submitted?a.assessment.rows:s.rows):''}${submitted&&transfer?kit():''}<details class="rg-evidence"><summary>Learning evidence · ${submitted?esc(a.assessment.independence.replaceAll('_',' ')):'practice in progress'}</summary><p>${esc(submitted?a.assessment.scope:'Guided consequences are recorded as help; a clear is not mastery.')}</p><pre id="rg-evidence-json"></pre></details></section>`;
    bindTop();root.querySelector('#rg-evidence-json').textContent=JSON.stringify({assessment:a.assessment,checkpoints:a.checkpoints,log},null,2);
    root.querySelectorAll('[data-look]').forEach(b=>b.onclick=()=>act({look:b.dataset.look}));
    root.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>act(b.dataset.tool));
    root.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>{activeCase=+b.dataset.case;render(a,missions,handlers);sync(false,a);});
    if(root.querySelector('#rg-hint'))root.querySelector('#rg-hint').onclick=async()=>{if(await cb.hint())root.querySelector('.rg-journal').open=true;};
    root.querySelector('#rg-retry-save').onclick=()=>retrySubmit?cb.submit():cb.save();
    if(root.querySelector('#rg-aid')){root.querySelector('#rg-aid').value=a.response.aid_declaration;root.querySelector('#rg-aid').onchange=e=>{document.querySelector('#aid-declaration').value=e.target.value;cb.edit();};}
    if(building&&!submitted)bindProgram();
    const runId=`${a.id}:${log.moves.length}`;
    disposeStage=RescueStage.attach(root,{...s,stale:JSON.stringify(program)!==JSON.stringify(s.program),rows:submitted?a.assessment.rows:s.rows},c,{look:key=>act({look:key}),sandbox:conditions=>act({storm:{...conditions,program:[...program]}}),caseIndex:activeCase,autoPlay:building&&runId!==previousRun});
    previousRun=runId;
    if(root.querySelector('#rg-next'))root.querySelector('#rg-next').onclick=async()=>{
      if(!submitted){if(await cb.submit())await cb.start(`rescue-${String(c.level+1).padStart(2,'0')}`);}
      else if(!clear)cb.start(a.snapshot.mission.id);
      else if(transfer)root.querySelector('#rg-kit').scrollIntoView({block:'start'});
      else cb.start(`rescue-${String(c.level+1).padStart(2,'0')}`);
    };
  }
  function kit(){return `<section class="rg-kit" id="rg-kit"><span class="rg-eyebrow">TAKE IT INTO THE REAL WORLD</span><h2>Repair a retrying job worker.</h2><p>Your next task is code, not another quiz: preserve intent IDs, reject changed requests and handle expired or unknown outcomes against a simulated external service.</p><a class="rg-primary" href="/relay-repair-kit.zip" download>Open the Python repair kit ↗</a><p>Run the tests locally. No code is executed or graded by this app. Includes failure cases, an implementation checklist and a separate reference solution. Delayed retention and production readiness are still unmeasured.</p></section>`;}
  function bindProgram(){
    root.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{selected=+b.dataset.slot;updateProgram();});
    root.querySelectorAll('[data-block]').forEach(b=>b.onclick=()=>{
      if(selected>program.length)selected=program.length;
      program[selected]=b.dataset.block;selected=Math.min(program.length,3);updateProgram();
    });
    root.querySelector('#rg-clear-route').onclick=()=>{program=[];selected=0;updateProgram();};
    root.querySelector('#rg-run').onclick=()=>act({program:[...program]},attempt.snapshot.rescue.level===7);
  }
  function updateProgram(){
    // An edited route is local intent, not a performed simulation. Persist separately
    // through the existing draft recovery envelope without appending a fake move.
    root.querySelectorAll('[data-slot]').forEach((b,i)=>{b.classList.toggle('selected',i===selected);b.querySelector('b').textContent=program[i]?icons[program[i]]:'+';b.querySelector('span').textContent=names[program[i]]||'Empty slot';b.setAttribute('aria-label',`Route slot ${i+1}: ${names[program[i]]||'empty'}`);});
    root.querySelector('#rg-run').disabled=!program.length;
    root.querySelector('#rg-route-status').textContent=program.length+' / 4 blocks placed · not tested';
    const changed=JSON.stringify(log.draft)!==JSON.stringify(program);
    const next=root.querySelector('#rg-next');if(next)next.disabled=JSON.stringify(program)!==JSON.stringify(attempt.rescue_state.program);
    log.draft=[...program];if(changed)cb.edit();
  }
  function restorePlan(p){if(Array.isArray(p)&&p.length<=4&&p.every(b=>b in names)){program=[...p];if(root&&!root.hidden&&root.querySelector('#rg-run')){updateProgram();}}}
  async function act(move,submit=false){
    if(!attempt||attempt.status!=='draft')return;
    if(log.moves.length!==attempt.response.rescue.moves.length){cb.error('Save the pending move before acting again.');return;}
    if(submit&&attempt.rescue_state.sealed){await cb.submit();return;}
    retrySubmit=submit;if(typeof move==='object'&&move.program)activeCase=0;log.draft=[...program];log.moves.push(move);root.querySelector('#rg-feedback').textContent=submit?'Committing your repair before revealing the results…':'Pip is trying your idea…';
    const ok=await(submit?cb.submit():cb.save());
    if(ok){const next=root.querySelector('[data-tool="rewind"], #rg-next, #rg-run, [data-tool]');next?.focus({preventScroll:true});}
  }
  function sync(busy,a){
    if(!root||root.hidden||!attempt||!a?.snapshot.rescue||!root.querySelector('#rg-sync'))return;
    const pending=log.moves.length!==a.response.rescue.moves.length;
    root.querySelectorAll('[data-tool],[data-look],[data-world-look],[data-block],[data-slot],#rg-run,#rg-sandbox-run,#rg-clear-route,#rg-next').forEach(b=>b.disabled=busy||pending||a.status==='submitted'&&b.id!=='rg-next');
    const hint=root.querySelector('#rg-hint');if(hint)hint.disabled=busy||a.status==='submitted'||a.hints.length>0;
    const run=root.querySelector('#rg-run');if(run)run.disabled=busy||pending||!program.length;
    const next=root.querySelector('#rg-next');if(next&&a.status==='draft'&&a.snapshot.rescue.level>=6)next.disabled=busy||pending||JSON.stringify(program)!==JSON.stringify(a.rescue_state.program);
    root.querySelectorAll('[data-look],[data-world-look]').forEach(b=>b.disabled=busy||pending||a.status==='submitted'||a.rescue_state.complete||a.rescue_state.failed);
    root.querySelectorAll('.rg-storm-controls input,.rg-storm-controls select').forEach(n=>n.disabled=busy||pending||a.status==='submitted');
    const aid=root.querySelector('#rg-aid');if(aid)aid.disabled=busy||a.status==='submitted';
    const save=root.querySelector('#rg-save');if(save)save.disabled=busy||a.status!=='draft';
    const record=root.querySelector('#rg-record');if(record)record.disabled=busy||pending||a.status!=='draft'||!log.moves.length;
    const status=root.querySelector('#rg-sync');if(status)status.textContent=busy?'Saving…':pending?'Save not confirmed':JSON.stringify(log)!==JSON.stringify(a.response.rescue)?'Unsaved edits':'Saved';
    root.querySelector('#rg-save-recovery').hidden=busy||!pending;
  }
  return {map,render,hide,setResponse,response,sync,restorePlan};
})();
