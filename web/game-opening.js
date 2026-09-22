/* Reusable opening controller. Content, semantic targets and world patches are
   supplied by a validated package; no campaign rules or evidence writes live here. */
export function shouldOpenGame({missions=[],attempt=null}={}){
  return !missions.some(m=>m.status==='cleared') && !attempt;
}

const DIRECTION_KINDS=new Set(['establishing','major-event','transition','antagonist-action','handoff']);
const DIRECTION_CHANNELS=new Set(['world','character','camera','lighting','vfx','audio','narration','interaction']);

export function validateOpeningSpec(spec){
  if(!spec?.id||!spec?.title||!Array.isArray(spec.scenes)||!spec.scenes.length||spec.scenes.length>16)throw Error('Invalid opening package');
  if(spec.directionVersion!==undefined&&spec.directionVersion!=='1')throw Error('Unsupported opening direction contract');
  for(const scene of spec.scenes){
    if(typeof scene.title!=='string'||!Number.isInteger(scene.beat))throw Error('Invalid opening scene');
    if(scene.action&&(!scene.action.target||!scene.action.label))throw Error('Invalid opening action');
    if(scene.audioCue!==undefined&&(!/^[a-z0-9._:-]+$/i.test(scene.audioCue)))throw Error('Invalid opening audio cue');
    if(scene.audioPhase!==undefined&&(!/^[a-z0-9._:-]+$/i.test(scene.audioPhase)))throw Error('Invalid opening audio phase');
    for(const marker of scene.markers||[])if(marker.offset&&(!Array.isArray(marker.offset)||marker.offset.length!==2||!marker.offset.every(Number.isFinite)))throw Error('Invalid marker offset');
    if(spec.directionVersion==='1'){
      const d=scene.direction;
      if(!d||!DIRECTION_KINDS.has(d.kind)||!Array.isArray(d.channels)||!d.channels.length||d.channels.some(ch=>!DIRECTION_CHANNELS.has(ch)))throw Error('Invalid opening scene direction');
      if(typeof d.worldAfter!=='string'||!d.worldAfter.trim())throw Error('Opening direction needs worldAfter');
      if(d.kind==='major-event'||d.kind==='antagonist-action'){
        if(!d.cause||!['visible','unknown','ambiguous'].includes(d.cause.mode))throw Error('Major opening event needs causal attribution');
        if(d.causeLeadMs!==undefined&&(!Number.isFinite(d.causeLeadMs)||d.causeLeadMs<0||d.causeLeadMs>5000))throw Error('Invalid opening cause lead');
      }
      if(d.kind==='major-event'){
        if(new Set(d.channels).size<4)throw Error('Major opening event needs at least four coordinated channels');
        if(!d.channels.includes('world')||!d.channels.includes('character'))throw Error('Major opening event needs world and character response');
        if(!d.channels.some(ch=>['lighting','vfx','audio'].includes(ch)))throw Error('Major opening event needs an atmosphere/effect channel');
      }
      if(d.kind==='antagonist-action'&&d.cause.mode==='visible'&&!d.cause.entity)throw Error('Visible antagonist action needs cause.entity');
      if(d.kind==='handoff'&&!d.channels.includes('interaction'))throw Error('Handoff direction needs interaction channel');
    }
  }
  return spec;
}

export function openGameOpening({root,spec,runtime,worldModule,replay=false,reducedMotion=null,onExit=()=>{}}){
  validateOpeningSpec(spec);
  const previousFocus=document.activeElement;
  document.documentElement.classList.add('game-opening-active');
  const siblings=[...root.children].map(node=>({node,inert:node.inert}));
  siblings.forEach(({node})=>node.inert=true);
  const overlay=document.createElement('section');overlay.id='rgi-intro';overlay.className='rgi-overlay';overlay.tabIndex=-1;
  overlay.dataset.openingId=spec.id;
  overlay.dataset.openingReplay=String(replay);
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','rgi-title');
  // Presentation contract (docs/GAME-PRESENTATION-GUIDE.md): the world carries the
  // scene; text is one fading subtitle line, controls are contextual and sparse.
  overlay.innerHTML=`<div class="rgi-shell">
    <div class="rgi-visual" id="rgi-world"><div class="rgi-markers"></div>
      <div class="rgi-scene-caption sr-only"><span class="rgi-kicker"></span><h2 id="rgi-title"></h2><blockquote id="rgi-dialogue"></blockquote></div>
      <div class="rgi-subtitle" role="status"><p id="rgi-body"></p><div class="rgi-fact" id="rgi-fact"></div></div>
      <span class="rgi-paused-badge" aria-hidden="true">PAUSED</span>
      <div class="rgi-corner"><button id="rgi-replay-beat" type="button" aria-label="Replay scene">↻</button><button id="rgi-pause" type="button" aria-label="Pause story motion">⏸</button><button id="rgi-skip" type="button"></button></div>
      <small id="rgi-step" class="sr-only"></small></div>
    <div class="rgi-progress" aria-label="Story progress"></div><div class="rgi-controls"><div class="rgi-nav"><button id="rgi-back" type="button">← Back</button><button id="rgi-next" type="button" class="rg-primary" hidden></button></div></div></div>`;
  root.append(overlay);
  const progress=overlay.querySelector('.rgi-progress');
  spec.scenes.forEach(()=>progress.append(document.createElement('i')));
  const host=overlay.querySelector('#rgi-world'),next=overlay.querySelector('#rgi-next'),pause=overlay.querySelector('#rgi-pause');
  const subtitle=overlay.querySelector('.rgi-subtitle');
  let subtitleTimer=0;
  const showSubtitle=()=>{
    clearTimeout(subtitleTimer);
    if(reduced){subtitle.classList.add('show');return;}
    subtitle.classList.add('show');
    subtitleTimer=setTimeout(()=>subtitle.classList.remove('show'),5500);
  };
  const reduced=typeof reducedMotion==='boolean'?reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches;
  let step=0,closed=false,paused=false,world=null,actionDone=false,picking=false,frame=0;
  // Ambient advancement: a plain story beat advances itself once its motion has
  // settled and the reading dwell elapses; any input (tap, key, action) can
  // advance sooner. Reduced motion never auto-advances (pause/stop/hide).
  let armedMs=0,dwellMs=10000,lastTick=0;
  const completed=new Set();
  const gate=window.GameWorldStatus;
  const scene=()=>spec.scenes[step];
  const available=()=>Boolean(world?.available&&!runtime.stats().contextLost);
  const ready=()=>!paused&&available()&&(!spec.waitForMotion||!world.stats?.().animating);
  const ambientBeat=()=>{const s=scene();return !(s.action&&!actionDone)&&step<spec.scenes.length-1;};
  const advance=()=>{if(closed||paused||!ready()||!ambientBeat())return;armedMs=0;step++;refresh();};
  const close=(reason='cancel')=>{
    if(closed)return;closed=true;cancelAnimationFrame(frame);
    if(replay)runtime.dispose();else runtime.detach();
    overlay.remove();document.documentElement.classList.remove('game-opening-active');siblings.forEach(({node,inert})=>node.inert=inert);
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
    onExit(reason);
  };
  const refresh=()=>{
    if(closed)return;
    const s=scene();overlay.dataset.step=String(step);actionDone=completed.has(step);
    for(const [selector,value] of [['.rgi-kicker',s.kicker],['#rgi-title',s.title],['#rgi-body',actionDone?s.success?.body??s.body:s.body],['#rgi-dialogue',actionDone?s.success?.dialogue||s.dialogue:s.dialogue],['#rgi-fact',actionDone?s.success?.fact||s.fact:s.fact]])overlay.querySelector(selector).textContent=value||'';
    overlay.querySelector('#rgi-step').textContent=`${step+1} / ${spec.scenes.length}${replay?' · REPLAY':''}`;
    overlay.querySelector('#rgi-back').disabled=step===0;
    overlay.querySelector('#rgi-back').hidden=step===0;
    next.textContent=s.action&&!actionDone?s.action.label:step===spec.scenes.length-1?(replay?'Return to game':spec.finishLabel||'Begin'):'Continue →';
    next.hidden=ambientBeat();
    if(ambientBeat()){
      const s2=scene();
      dwellMs=Math.min(20000,12000+40*((s2.body||'').length+(s2.dialogue||'').length+(s2.fact||'').length));
      armedMs=0;
    }
    if(s.action&&!actionDone)next.dataset.storyAction=s.action.target;else delete next.dataset.storyAction;
    progress.querySelectorAll('i').forEach((n,i)=>{n.classList.toggle('current',i===step);n.classList.toggle('on',i<=step);});
    world=runtime.showStory(worldModule,host,s.beat,{reducedMotion:reduced,paused});
    if(actionDone&&s.action?.patch)world.applyPresentation?.(s.action.patch);
    gate?.set(host,available()?'ready':'failed');
    next.disabled=!ready();
    showSubtitle();
    const markers=overlay.querySelector('.rgi-markers');markers.replaceChildren();
    for(const marker of s.markers||[]){
      if(actionDone&&marker.hideWhenDone)continue;
      const n=document.createElement('button');n.type='button';n.className=`rgi-marker ${marker.tone||''}`;n.textContent=marker.label;n.dataset.entity=marker.entity;
      n.dataset.offsetX=String(marker.offset?.[0]||0);n.dataset.offsetY=String(marker.offset?.[1]||0);
      const actionable=s.action&&!actionDone&&marker.target===s.action.target;
      n.disabled=!actionable;n.tabIndex=actionable?0:-1;
      if(actionable){n.classList.add('rgi-target');n.onclick=()=>performAction();}
      markers.append(n);
    }
  };
  const performAction=()=>{
    if(closed||paused||!ready())return;
    const s=scene();
    if(s.action&&!actionDone){completed.add(step);overlay.dataset.lastWorldAction=s.action.target;refresh();}
    else if(step===spec.scenes.length-1)close('complete');
    else{step++;refresh();}
  };
  const updateMarkers=()=>{
    if(closed)return;
    const now=performance.now(),dt=lastTick?Math.min(250,now-lastTick):0;lastTick=now;
    if(!reduced&&ambientBeat()&&ready()){armedMs+=dt;if(armedMs>=dwellMs)advance();}
    else armedMs=0;
    next.disabled=!ready();
    overlay.querySelector('#rgi-back').disabled=step===0||!available();
    overlay.querySelector('#rgi-replay-beat').disabled=!available();pause.disabled=!available();
    const hostRect=host.getBoundingClientRect();
    const cameraTools=host.querySelector('.game-view-tools')?.getBoundingClientRect();
    for(const marker of overlay.querySelectorAll('.rgi-marker')){
      if(marker.classList.contains('rgi-target'))marker.disabled=!ready();
      const point=world?.projectEntity?.(marker.dataset.entity);
      marker.hidden=!point||!point.visible;
      if(point&&point.visible){
        const halfWidth=marker.offsetWidth/2,height=marker.offsetHeight;
        let x=Math.max(halfWidth+10,Math.min(host.clientWidth-halfWidth-10,point.x+Number(marker.dataset.offsetX)));
        const y=Math.max(70,Math.min(host.clientHeight*.58,point.y-22+Number(marker.dataset.offsetY)));
        // Labels translate by (-50%, -100%). Keep their entire hit targets
        // inside the world and clear of the freely accessible camera tools.
        if(cameraTools&&hostRect.top+y>cameraTools.top&&hostRect.top+y-height<cameraTools.bottom&&hostRect.left+x+halfWidth>cameraTools.left-10&&hostRect.left+x-halfWidth<cameraTools.right){
          x=Math.max(halfWidth+10,cameraTools.left-hostRect.left-halfWidth-10);
        }
        marker.style.left=`${x}px`;marker.style.top=`${y}px`;
      }
    }
    frame=requestAnimationFrame(updateMarkers);
  };
  host.addEventListener('pointerup',async event=>{
    if(closed||paused||picking)return;
    if(event.target.closest('.rgi-scene-caption,.rgi-marker,.rgi-corner,.rgi-progress,.game-world-status,.game-player-controls'))return;
    if(ambientBeat()){advance();return;}
    if(actionDone||!scene().action)return;
    const s=scene();picking=true;
    try{const target=await world?.pickSemanticAt?.(event.clientX,event.clientY);if(!closed&&s===scene()&&target===s.action.target)performAction();}finally{picking=false;}
  });
  host.addEventListener('game-runtime-restored',refresh);
  next.onclick=performAction;
  overlay.querySelector('#rgi-back').onclick=()=>{if(step>0){step--;refresh();}};
  overlay.querySelector('#rgi-skip').textContent=replay?'Return':'Skip';
  overlay.querySelector('#rgi-skip').setAttribute('aria-label',replay?'Return to game':'Skip opening');
  overlay.querySelector('#rgi-skip').onclick=()=>close(replay?'return':'skip');
  overlay.querySelector('#rgi-replay-beat').onclick=()=>{completed.delete(step);refresh();};
  pause.hidden=reduced;
  pause.onclick=()=>{
    paused=!paused;runtime.setPaused(paused);pause.textContent=paused?'▶':'⏸';pause.setAttribute('aria-label',paused?'Resume story motion':'Pause story motion');overlay.classList.toggle('rgi-paused',paused);
    next.disabled=!ready();
    for(const marker of overlay.querySelectorAll('.rgi-target'))marker.disabled=!ready();
  };
  overlay.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();close(replay?'return':'skip');}
    if((event.key==='ArrowRight'||event.key===' '||event.key==='Enter')&&ambientBeat()&&(event.target===overlay||event.target===host)){event.preventDefault();advance();}
    if(event.key==='Tab'){
      const nodes=[...overlay.querySelectorAll('button:not(:disabled)')].filter(n=>!n.hidden&&n.getClientRects().length);
      const first=nodes[0],last=nodes.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  });
  refresh();updateMarkers();overlay.focus({preventScroll:true});
  return {close,element:overlay};
}
