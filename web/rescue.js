/* Render observed causal steps. This module never evaluates a policy or writes evidence. */
'use strict';
window.RescueStage = (() => {
  // UI-only disclosure preference. Local route edits redraw the workbench; an
  // optional playground the player opened must not collapse just because the
  // authored route changed. This never affects simulation/evidence state.
  let sandboxDisclosureOpen=false;
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
        button.dataset.worldLook = key; button.textContent = key === 'workshop' && config.level===1 ? 'Echo Forge' : key === 'workshop' ? 'Workshop' : key === 'parcel' ? 'Parcels' : key === 'book' ? 'Order book' : key === 'journal' ? 'Journal' : 'Ticket';
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
      const panel=document.createElement('details');panel.className='rg-sandbox';panel.open=Boolean(state.sandbox)||sandboxDisclosureOpen;
      listen(panel,'toggle',()=>{sandboxDisclosureOpen=panel.open;});
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
      for(const [i,step] of steps.entries()){
        const node=document.createElement('div');node.className='rg-live-node';node.dataset.live=String(i);
        const icon=document.createElement('b');icon.textContent={remember:'↺',match:'≟',reconcile:'⌕',retry:'➜',new:'✚',wait:'Ⅱ'}[step.block]||'·';
        const text=document.createElement('span');text.textContent=step.text;node.append(icon,text);lane.append(node);
      }
      const footer=document.createElement('p');footer.textContent=`${row.effects} effect${row.effects===1?'':'s'} · ${row.status}`;
      area.append(heading,lane,footer);bench?.after(area);
      if(autoPlay&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
        lane.querySelectorAll('.rg-live-node').forEach((n,i)=>{n.hidden=true;const id=setTimeout(()=>{n.hidden=false;n.animate([{transform:'translateX(-8px)',opacity:0},{transform:'translateX(0)',opacity:1}],{duration:220,easing:'ease-out'});},i*360);timers.push(id);});
      }
      const replay=document.createElement('button');replay.type='button';replay.id='rg-replay-case';replay.className='rg-replay-case';replay.textContent='Replay this case';
      listen(replay,'click',()=>lane.querySelectorAll('.rg-live-node').forEach((n,i)=>{n.animate([{background:'#294b55'},{background:'transparent'}],{duration:550,delay:i*170});}));area.append(replay);
    }
    return () => { abort.abort(); timers.forEach(clearTimeout); };
  }
  return {attach};
})();