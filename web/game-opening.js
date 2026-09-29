/* Reusable opening controller. Content, semantic targets and world patches are
   supplied by a validated package; no campaign rules or evidence writes live here. */
import {getPreferences} from './preferences.js';
import {createEntityMatcher} from './world-interaction-focus.js';
import {placeWorldMarker} from './world-marker-layout.js';

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
    if(scene.choices){
      if(scene.action||!Array.isArray(scene.choices)||scene.choices.length<2||scene.choices.length>4||
        scene.choices.some(choice=>!choice.target||!choice.label||!choice.patch||!choice.success)||
        new Set(scene.choices.map(choice=>choice.target)).size!==scene.choices.length)throw Error('Invalid opening choices');
      for(const choice of scene.choices){
        const inspection=choice.inspection;
        if(inspection===undefined)continue;
        if(!inspection||typeof inspection!=='object'||Array.isArray(inspection)||
          !['target','anchor','label'].every(key=>typeof inspection[key]==='string'&&inspection[key].trim()&&inspection[key].length<=120)||
          !inspection.patch||typeof inspection.patch!=='object'||Array.isArray(inspection.patch)||
          !inspection.success||typeof inspection.success!=='object'||Array.isArray(inspection.success)||
          !['body','dialogue','fact'].some(key=>typeof inspection.success[key]==='string'&&inspection.success[key].trim())||
          ['body','dialogue','fact'].some(key=>inspection.success[key]!==undefined&&
            (typeof inspection.success[key]!=='string'||inspection.success[key].length>500)))throw Error('Invalid opening inspection');
        if(inspection.markers!==undefined&&(!Array.isArray(inspection.markers)||inspection.markers.length>8||
          inspection.markers.some(marker=>!marker||typeof marker.entity!=='string'||!marker.entity.trim()||
            typeof marker.label!=='string'||!marker.label.trim()||marker.label.length>120||
            (marker.offset!==undefined&&(!Array.isArray(marker.offset)||marker.offset.length!==2||!marker.offset.every(Number.isFinite))))))throw Error('Invalid opening inspection markers');
        if(choice.patch.timeline&&(!choice.carry||typeof choice.carry!=='object'||Array.isArray(choice.carry)))throw Error('Timed opening inspection needs durable branch carry');
      }
    }
    if(scene.carryChoiceFrom!==undefined&&(!Number.isInteger(scene.carryChoiceFrom)||scene.carryChoiceFrom<0||scene.carryChoiceFrom>=spec.scenes.indexOf(scene)))throw Error('Invalid opening choice continuity');
    if(scene.actorFromChoice!==undefined&&(!Number.isInteger(scene.actorFromChoice)||scene.actorFromChoice<0||scene.actorFromChoice>=spec.scenes.indexOf(scene)))throw Error('Invalid opening actor continuity');
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
  // scene; text is one fading band; controls are contextual and sparse.
  // Rule I6: no persistent bottom-centre control bar. Advancement is ambient/tap/
  // keyboard; story actions are performed on their diegetic world marker. Only the
  // corner cluster (system verbs) and world markers are painted chrome; a single
  // explicit control appears solely for prefers-reduced-motion (WCAG 2.2.2 Pause, Stop, Hide).
  // Rule I12: every line the player is meant to know must reach the eye. The band
  // holds the beat card, the narration and the spoken line in ONE grid cell and
  // reveals them in sequence, so a beat states its title and its dialogue without
  // stacking three text layers over the world (which B1 would not afford on a phone).
  overlay.innerHTML=`<div class="rgi-shell">
    <div class="rgi-visual" id="rgi-world"><div class="rgi-markers"></div>
      <div class="rgi-band">
        <div class="rgi-scene-caption" data-line="title"><span class="rgi-kicker"></span><h2 id="rgi-title"></h2></div>
        <div class="rgi-subtitle" data-line="body" role="status"><p id="rgi-body"></p><div class="rgi-fact" id="rgi-fact"></div></div>
        <blockquote class="rgi-speech" data-line="speech" id="rgi-dialogue"></blockquote>
      </div>
      <span class="rgi-paused-badge" aria-hidden="true">PAUSED</span>
      <div class="rgi-corner"><button id="rgi-back" type="button" aria-label="Previous scene">‹</button><button id="rgi-replay-beat" type="button" aria-label="Replay scene">↻</button><button id="rgi-pause" type="button" aria-label="Pause story motion">⏸</button><button id="rgi-skip" type="button"></button></div>
      <small id="rgi-step" class="sr-only"></small></div>
    <div class="rgi-progress" aria-label="Story progress"></div><button id="rgi-next" type="button" class="rg-primary" hidden></button></div>`;
  root.append(overlay);
  const progress=overlay.querySelector('.rgi-progress');
  spec.scenes.forEach(()=>progress.append(document.createElement('i')));
  const host=overlay.querySelector('#rgi-world'),next=overlay.querySelector('#rgi-next'),pause=overlay.querySelector('#rgi-pause');
  const band=overlay.querySelector('.rgi-band');
  // One line group at a time, held for its own reading time, with a short dip between
  // groups; the last group stays painted until the beat advances so the world is only
  // partly covered and the closing line is still on screen when the player acts on it.
  // Paused or reduced-motion play shows every line at once: text must never be gated
  // behind motion a user opted out of (WCAG 2.2.2).
  let bandTimers=[],bandMs=0;
  const clearBand=()=>{for(const t of bandTimers)clearTimeout(t);bandTimers=[];};
  const holdMs=(text)=>Math.min(7000,Math.max(2400,1500+450*(text.trim().split(/\s+/).filter(Boolean).length)));
  const showBand=()=>{
    clearBand();
    const textOf=(sel)=>overlay.querySelector(sel).textContent.trim();
    // Sequenced from the text actually painted for this beat, so the band can never
    // drift out of step with what the screen-reader channel receives.
    const lines={title:`${textOf('.rgi-kicker')} ${textOf('#rgi-title')}`.trim(),
      body:`${textOf('#rgi-body')} ${textOf('#rgi-fact')}`.trim(),
      speech:textOf('#rgi-dialogue')};
    const seq=Object.keys(lines).filter(phase=>lines[phase]);
    bandMs=0;
    // Mirrored onto the overlay so a measurement or test can pin one phase
    // (data-band-phase) instead of racing the fade.
    const setPhase=(phase)=>{band.dataset.phase=phase;overlay.dataset.bandPhase=phase||'clear';};
    if(!seq.length){setPhase('');return;}
    if(reduced||paused){setPhase('all');return;}
    setPhase(seq[0]);
    // Dip between lines instead of crossfading: two story lines never occupy the
    // frame at once, which is what titling practice and the B1 budget both ask for.
    // The band then holds its last line until the beat changes - clearing text on a
    // timer is how a player loses a sentence they were still reading (24 Sep play).
    const dip=380;
    for(const phase of seq){
      if(bandMs)bandTimers.push(setTimeout(()=>setPhase(''),bandMs-dip));
      bandTimers.push(setTimeout(()=>setPhase(phase),bandMs));
      bandMs+=holdMs(lines[phase]);
    }
  };
  // A caller that owns a preference registry passes the reading; one that does not still
  // gets the same answer, because the registry is the only thing that consults the system.
  const reduced=typeof reducedMotion==='boolean'?reducedMotion:getPreferences().get('motion');
  let step=0,closed=false,paused=false,world=null,actionDone=false,picking=false,frame=0,resizeFrame=0,exploreResize=null,lastMarkerLayout='';
  // Text-size changes can enlarge a world marker without changing the camera
  // projection. Invalidate its cached placement only when its box changes.
  const markerSizes=new WeakMap();
  const markerResize=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{
    for(const entry of entries){
      const box=entry.borderBoxSize?.[0];
      const size=[box?.inlineSize??entry.target.offsetWidth,box?.blockSize??entry.target.offsetHeight];
      const prior=markerSizes.get(entry.target);
      if(prior&&(Math.abs(size[0]-prior[0])>2||Math.abs(size[1]-prior[1])>2)){
        markerSizes.set(entry.target,size);lastMarkerLayout='';
      }else if(!prior)markerSizes.set(entry.target,size);
    }
  }):null;
  // Ambient advancement: a plain story beat advances itself once its motion has
  // settled and the reading dwell elapses; any input (tap, key, action) can
  // advance sooner. Reduced motion never auto-advances (pause/stop/hide).
  let armedMs=0,dwellMs=10000,lastTick=0;
  const completed=new Set();
  const inspected=new Set();
  const chosen=new Map();
  const exploredActor=new Map();
  const hitsEntity=createEntityMatcher(worldModule.worldSpec?.entities||[]);
  const gate=window.GameWorldStatus;
  const scene=()=>spec.scenes[step];
  const selected=()=>scene().choices?.find(choice=>choice.target===chosen.get(step));
  const pendingInspection=()=>Boolean(actionDone&&selected()?.inspection&&!inspected.has(step));
  const pending=()=>Boolean(((scene().action||scene().choices)&&!actionDone)||pendingInspection());
  const available=()=>Boolean(world?.available&&!runtime.stats().contextLost);
  const applyExploreView=()=>{
    const viewSpec=scene().exploreView;
    if(closed||!viewSpec||!scene().explore||actionDone||!world?.available||host.clientWidth<1||host.clientHeight<1)return;
    world.setRecenterView?.(viewSpec);
    const narrow=host.clientWidth/Math.max(1,host.clientHeight)<.9;
    const view=world.getPlayerView?.();
    if(view)world.restorePlayerView?.({...view,
      distance:narrow?(viewSpec.portraitDistance||viewSpec.distance):viewSpec.distance,
      pitch:narrow?(viewSpec.portraitPitch||viewSpec.pitch):viewSpec.pitch});
  };
  const ready=()=>!paused&&available()&&(!spec.waitForMotion||!world.stats?.().animating);
  // A beat is ambient when its story action is already satisfied (or there is none).
  // Ambient beats advance themselves; the final beat ambient-closes into the game.
  const ambientBeat=()=>!pending();
  const advance=()=>{if(closed||paused||!ready()||!ambientBeat())return;armedMs=0;if(step<spec.scenes.length-1){step++;refresh();}else close('complete');};
  const close=(reason='cancel')=>{
    if(closed)return;closed=true;cancelAnimationFrame(frame);cancelAnimationFrame(resizeFrame);exploreResize?.disconnect();markerResize?.disconnect();clearBand();
    if(replay)runtime.dispose();else runtime.detach();
    overlay.remove();document.documentElement.classList.remove('game-opening-active');siblings.forEach(({node,inert})=>node.inert=inert);
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
    onExit(reason);
  };
  const refresh=()=>{
    if(closed)return;
    const s=scene();overlay.dataset.step=String(step);actionDone=completed.has(step);
    overlay.dataset.explore=String(Boolean(s.explore&&!actionDone));
    const choice=selected(),inspection=choice?.inspection;
    const success={...s.success,...choice?.success,...(inspected.has(step)?inspection?.success:{})};
    for(const [selector,value] of [['.rgi-kicker',s.kicker],['#rgi-title',s.title],['#rgi-body',actionDone?success?.body??s.body:s.body],['#rgi-dialogue',actionDone?success?.dialogue||s.dialogue:s.dialogue],['#rgi-fact',actionDone?success?.fact||s.fact:s.fact]])overlay.querySelector(selector).textContent=value||'';
    overlay.dataset.chosenPath=chosen.get(step)||'';
    overlay.querySelector('#rgi-step').textContent=`${step+1} / ${spec.scenes.length}${replay?' · REPLAY':''}`;
    overlay.querySelector('#rgi-back').disabled=step===0;
    overlay.querySelector('#rgi-back').hidden=step===0;
    // Rule I6: motion-allowed play paints no advance/action button — the world marker
    // performs actions and beats advance ambiently/on tap/keyboard. Only when
    // prefers-reduced-motion suppresses auto-advance does a single "Continue"/handoff
    // control appear, and only on ambient beats (a pending action is still done in the
    // world, never from this button).
    next.textContent=step===spec.scenes.length-1?(replay?'Return to game':spec.finishLabel||'Begin'):'Continue →';
    next.hidden=!reduced||!ambientBeat();
    showBand();
    if(ambientBeat()){
      const s2=scene();
      // Never advance mid-sentence: the reading dwell is the larger of the authored
      // pacing and the time the painted band actually needs.
      dwellMs=Math.max(bandMs+2500,Math.min(20000,12000+40*((s2.body||'').length+(s2.dialogue||'').length+(s2.fact||'').length)));
      armedMs=0;
    }
    if(pending())next.dataset.storyAction=pendingInspection()?inspection.target:s.action?.target||'choice';else delete next.dataset.storyAction;
    progress.querySelectorAll('i').forEach((n,i)=>{n.classList.toggle('current',i===step);n.classList.toggle('on',i<=step);});
    const exploring=Boolean(s.explore&&!actionDone);
    const actorPosition=s.actorFromChoice!==undefined?exploredActor.get(s.actorFromChoice):
      (s.preserveActor&&actionDone?exploredActor.get(step):null);
    const priorChoice=s.carryChoiceFrom??s.actorFromChoice;
    const choiceTarget=priorChoice!==undefined?chosen.get(priorChoice):
      (s.choices&&actionDone?chosen.get(step):null);
    const storyState=actorPosition||choiceTarget?{storyBeat:s.beat,playerStart:actorPosition,choiceTarget}:s.beat;
    world=runtime.showStory(worldModule,host,storyState,{reducedMotion:reduced,paused,explore:exploring});
    if(exploring)applyExploreView();
    if(s.carryChoiceFrom!==undefined){
      const previous=spec.scenes[s.carryChoiceFrom]?.choices?.find(choice=>choice.target===chosen.get(s.carryChoiceFrom));
      if(previous?.carry){
        if(world.applyOverlay)world.applyOverlay(previous.carry);
        else world.applyPresentation?.(previous.carry);
      }
    }
    if(actionDone){
      if(inspected.has(step)&&inspection){
        // An inspected response is durable on Previous/reload of this view;
        // never restart the route's timed response just to restore its result.
        const durable=choice?.carry||choice?.patch;
        if(durable){
          const {timeline,transition,cameraImpulse,...stable}=durable;
          if(world.applyOverlay)world.applyOverlay(stable);
          else world.applyPresentation?.(stable);
        }
        world.applyPresentation?.(inspection.patch);
      }else if(choice?.patch||s.action?.patch)world.applyPresentation?.(choice?.patch||s.action.patch);
    }
    gate?.set(host,available()?'ready':'failed');
    next.disabled=!ready();
    const markers=overlay.querySelector('.rgi-markers');
    const markerHeldFocus=markers.contains(document.activeElement);
    markerResize?.disconnect();
    markers.replaceChildren();lastMarkerLayout='';
    const actionableRendered=new Set();
    const addMarker=(cfg,{actionable}={})=>{
      const n=document.createElement(actionable?'button':'span');
      if(actionable)n.type='button';
      n.className=`rgi-marker ${cfg.tone||''}`;n.textContent=cfg.label;n.dataset.entity=cfg.entity;
      n.dataset.offsetX=String(cfg.offset?.[0]||0);n.dataset.offsetY=String(cfg.offset?.[1]||0);
      if(actionable){n.tabIndex=0;n.setAttribute('aria-label',cfg.label);}
      if(actionable){n.classList.add('rgi-target');n.onclick=()=>performAction(cfg.target);actionableRendered.add(cfg.target);}
      markers.append(n);markerResize?.observe(n);
    };
    const viewMarkers=inspected.has(step)&&inspection?.markers!==undefined?inspection.markers:s.markers||[];
    for(const marker of viewMarkers){
      // A committed world verb should yield its prompt. Content can author a
      // separate untargeted marker when the resulting object still needs a name.
      if(actionDone&&(marker.hideWhenDone||marker.target))continue;
      addMarker(marker,{actionable:Boolean(!actionDone&&marker.target&&(marker.target===s.action?.target||s.choices?.some(choice=>choice.target===marker.target)))});
    }
    // System guarantee (rule I6, every future title): a pending story action always
    // gets a diegetic world affordance, synthesised from the action when the content
    // package did not author one — never a DOM bottom button. Anchor is the action's
    // marker entity (falls back to the semantic target, which is often an entity id).
    if(!actionDone)for(const action of s.choices||[s.action].filter(Boolean)){
      if(!actionableRendered.has(action.target))addMarker({entity:action.anchor||action.marker||action.target,target:action.target,label:action.label,offset:[0,-8]},{actionable:true});
    }
    if(pendingInspection())addMarker({entity:inspection.anchor,target:inspection.target,label:inspection.label,offset:[0,-8]},{actionable:true});
    // The committed marker is replaced by the next world action (or by the
    // inspected scene). Keep keyboard focus on the stable opening surface,
    // since the next action may still be disabled while response motion settles.
    // Tab reaches it when ready; Escape remains available throughout.
    if(markerHeldFocus){
      overlay.tabIndex=-1;
      overlay.focus({preventScroll:true});
    }
  };
  const performAction=(target=null)=>{
    if(closed||paused||!ready())return;
    const s=scene();
    if(pendingInspection()){
      if(target!==selected().inspection.target)return;
      world?.releaseInputs?.();inspected.add(step);overlay.dataset.lastWorldAction=target;refresh();return;
    }
    if(s.choices&&!actionDone){
      const choice=s.choices.find(item=>item.target===target);if(!choice)return;
      if(s.preserveActor){const position=world.getPlayerView?.()?.position;if(position)exploredActor.set(step,[...position]);}
      world?.releaseInputs?.();
      chosen.set(step,choice.target);completed.add(step);overlay.dataset.lastWorldAction=choice.target;refresh();
    }
    else if(s.action&&!actionDone){if(target&&target!==s.action.target)return;world?.releaseInputs?.();completed.add(step);overlay.dataset.lastWorldAction=s.action.target;refresh();}
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
    const markers=[...overlay.querySelectorAll('.rgi-marker')];
    const projected=markers.map(marker=>world?.projectEntity?.(marker.dataset.entity));
    // Keep the RAF for story timing, but only measure/re-fit marker geometry
    // when a projected point, viewport or visible HUD phase actually changes.
    const layoutKey=[host.clientWidth,host.clientHeight,paused,ready(),overlay.querySelector('.rgi-band')?.dataset.phase,
      host.querySelector('.game-controls-help')?.hidden,...markers.flatMap((marker,i)=>{
        const p=projected[i];return[marker.dataset.entity,p?.inFront,p?.visible,Math.round(p?.x||0),Math.round(p?.y||0)];
      })].join('|');
    if(layoutKey!==lastMarkerLayout){
      lastMarkerLayout=layoutKey;
      const hostRect=host.getBoundingClientRect();
      const relative=node=>{
        if(!node||node.hidden||!node.getClientRects().length)return null;
        const r=node.getBoundingClientRect();
        return{left:r.left-hostRect.left,right:r.right-hostRect.left,top:r.top-hostRect.top,bottom:r.bottom-hostRect.top};
      };
      const corner=relative(overlay.querySelector('.rgi-corner'));
      const progress=relative(overlay.querySelector('.rgi-progress'));
      const band=relative(overlay.querySelector('.rgi-band'));
      // The shared shell may place progress in a footer row; some game skins
      // place it near the top. Only top chrome can raise the marker top edge.
      const progressTop=progress&&progress.top<Math.min(host.clientHeight*.5,180)?progress.bottom+8:0;
      const safeTop=Math.max(70,(corner?.bottom||0)+8,progressTop);
      const safeBottom=Math.min(host.clientHeight-16,(band?.top??host.clientHeight)-12);
      const avoid=[corner,progress,band,
        relative(host.querySelector('.game-view-tools')),
        relative(host.querySelector('.game-move-stick')),
        relative(host.querySelector('.game-controls-help:not([hidden])')),
        relative(overlay.querySelector('#rgi-next:not([hidden])'))].filter(Boolean);
      for(const [i,marker] of markers.entries()){
        const actionable=marker.classList.contains('rgi-target'),point=projected[i];
        if(actionable)marker.disabled=!ready();
        // Paused verbs stay hidden; ordinary actor labels still require their
        // actual object in view. Only required actions receive edge guidance.
        marker.hidden=(actionable&&paused)||!point||(!actionable&&!point.visible);
        if(marker.hidden)continue;
        if(actionable){
          const cuePoint=point.inFront===false?{...point,x:host.clientWidth/2,y:host.clientHeight/2}:
            {...point,x:point.x+Number(marker.dataset.offsetX)};
          const placed=placeWorldMarker(marker,cuePoint,
            {viewportWidth:host.clientWidth,safeTop,safeBottom,critical:true,
              xPadding:marker.offsetWidth/2+10,yOffset:22-Number(marker.dataset.offsetY),avoidRects:avoid});
          marker.hidden=!placed.placed;
          if(!placed.placed)continue;
          marker.dataset.worldPinned=String(Boolean(placed.edge));
          if(placed.edge){
            const where=placed.edge==='behind'?'behind the camera':`offscreen ${placed.edge}`;
            marker.setAttribute('aria-description',`World object ${where}; activate this action or turn toward it.`);
            marker.title=`World object ${where}`;
          }else{marker.removeAttribute('aria-description');marker.removeAttribute('title');}
        }else{
          marker.classList.remove('edge-cued');delete marker.dataset.edge;
          const halfWidth=marker.offsetWidth/2,height=marker.offsetHeight;
          let x=Math.max(halfWidth+10,Math.min(host.clientWidth-halfWidth-10,point.x+Number(marker.dataset.offsetX)));
          const y=Math.max(70,Math.min(host.clientHeight*.58,point.y-22+Number(marker.dataset.offsetY)));
          const cameraTools=relative(host.querySelector('.game-view-tools'));
          if(cameraTools&&y>cameraTools.top&&y-height<cameraTools.bottom&&x+halfWidth>cameraTools.left-10&&x-halfWidth<cameraTools.right){
            x=Math.max(halfWidth+10,cameraTools.left-halfWidth-10);
          }
          marker.style.left=`${x}px`;marker.style.top=`${y}px`;
        }
        const rect=relative(marker);if(rect)avoid.push(rect);
      }
    }
    frame=requestAnimationFrame(updateMarkers);
  };
  host.addEventListener('pointerup',async event=>{
    if(closed||paused||picking)return;
    if(event.target.closest('.rgi-scene-caption,.rgi-marker,.rgi-corner,.rgi-progress,.game-world-status,.game-player-controls'))return;
    if(ambientBeat()){advance();return;}
    if(!pending())return;
    const s=scene();picking=true;
    try{const target=await world?.pickSemanticAt?.(event.clientX,event.clientY);
      if(!closed&&s===scene()){
        if(pendingInspection()&&hitsEntity(target,selected().inspection.target)){performAction(selected().inspection.target);return;}
        const choice=s.choices?.find(item=>hitsEntity(target,item.target));
        if(choice)performAction(choice.target);
        else if(target===s.action?.target)performAction(s.action.target);
      }
    }finally{picking=false;}
  });
  host.addEventListener('game-runtime-restored',refresh);
  next.onclick=()=>performAction();
  overlay.querySelector('#rgi-back').onclick=()=>{if(step>0){step--;refresh();}};
  overlay.querySelector('#rgi-skip').textContent=replay?'Return':'Skip';
  overlay.querySelector('#rgi-skip').setAttribute('aria-label',replay?'Return to game':'Skip opening');
  overlay.querySelector('#rgi-skip').onclick=()=>close(replay?'return':'skip');
  overlay.querySelector('#rgi-replay-beat').onclick=()=>{completed.delete(step);inspected.delete(step);chosen.delete(step);exploredActor.delete(step);refresh();};
  pause.hidden=reduced;
  pause.onclick=()=>{
    paused=!paused;runtime.setPaused(paused);pause.textContent=paused?'▶':'⏸';pause.setAttribute('aria-label',paused?'Resume story motion':'Pause story motion');overlay.classList.toggle('rgi-paused',paused);showBand();
    // Pause hides actions immediately. Force a fresh fit on resume even when
    // the camera and viewport are unchanged, so the prior hidden flag cannot
    // survive the projection cache.
    lastMarkerLayout='';
    next.disabled=!ready();
    for(const marker of overlay.querySelectorAll('.rgi-target')){
      marker.disabled=!ready();
      if(paused)marker.hidden=true;
    }
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
  exploreResize=new ResizeObserver(()=>{
    cancelAnimationFrame(resizeFrame);
    resizeFrame=requestAnimationFrame(applyExploreView);
  });
  exploreResize.observe(host);
  refresh();updateMarkers();overlay.focus({preventScroll:true});
  return {close,element:overlay};
}
