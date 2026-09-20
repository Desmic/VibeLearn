/* Shared presentation navigation/input. No game commands or assessment writes. */
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const radians=n=>n*Math.PI/180;
const formTarget=target=>target?.closest?.('button,input,select,textarea,a,summary,[contenteditable]');
const typingTarget=target=>target?.closest?.('input,select,textarea,[contenteditable]');

export function followCameraClearance(profile,aspect){
  const body=profile.body||{radius:.32,height:1.6},camera=profile.camera;
  // Portrait profiles request a wider contextual view. Preserve that framing
  // proportion when a wall constrains the camera, instead of collapsing both
  // landscape and portrait to the same close view of the protagonist.
  const framingScale=aspect<.9?Math.max(1,(camera.portraitDistance??camera.distance)/camera.distance):1;
  return Math.max(camera.minDistance,body.height*1.5,body.radius*3)*framingScale;
}

// Preserve the requested horizontal bearing: camera-relative movement must not
// reverse when a wall forces the follow camera upward. Sweep in world units so
// zooming out cannot make thin geometry disappear between samples.
export function resolveFollowCamera(target,{yaw,pitch,distance,minClearance},blocked){
  const sweep=elevation=>{
    const az=radians(yaw),el=radians(elevation);
    const direction=[Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)];
    const steps=Math.ceil(distance/.05);let safe=0;
    for(let i=1;i<=steps;i++){
      const d=distance*i/steps,p=target.map((v,k)=>v+direction[k]*d);
      if(blocked(...p))break;
      safe=d;
    }
    return {eye:target.map((v,k)=>v+direction[k]*safe),distance:safe,pitch:elevation};
  };
  const minimum=Math.min(distance,minClearance),requested=sweep(pitch);
  let result=requested;
  if(result.distance<minimum){
    // Find the first safe elevated arc, then refine its boundary. Keeping the
    // bearing fixed also makes alternating wall sides behave symmetrically.
    let previous=pitch;
    for(let elevation=Math.min(89,pitch+5);;elevation=Math.min(89,elevation+5)){
      const candidate=sweep(elevation);
      if(candidate.distance>=minimum){
        let low=previous,high=elevation;
        for(let i=0;i<7;i++){
          const mid=(low+high)/2,probe=sweep(mid);
          if(probe.distance>=minimum){high=mid;result=probe;}else low=mid;
        }
        if(result.distance<minimum)result=candidate;
        break;
      }
      if(candidate.distance>result.distance)result=candidate;
      if(elevation===89)break;
      previous=elevation;
    }
  }
  return {...result,target:[...target],yaw,adjusted:result.pitch!==pitch||result.distance<distance,
    clearanceSatisfied:result.distance>=minimum};
}

export function validatePlayerProfile(profile,ids){
  const fail=message=>{throw new Error(`WorldSpec player: ${message}`);};
  const vector=(v,n)=>Array.isArray(v)&&v.length===n&&v.every(Number.isFinite);
  if(!profile||profile.version!=='1'||!ids.has(profile.entity))fail('version/entity is invalid');
  if(profile.limbs&&(!Array.isArray(profile.limbs)||profile.limbs.some(id=>!ids.has(id))))fail('animation entity is invalid');
  if(!vector(profile.spawn,3)||!Number.isFinite(profile.speed)||profile.speed<=0||profile.speed>12)fail('spawn/speed is invalid');
  if(!Array.isArray(profile.surfaces)||!profile.surfaces.length)fail('walkable surfaces required');
  for(const surface of profile.surfaces){
    if(!vector(surface.bounds,4)||surface.bounds[0]>=surface.bounds[1]||surface.bounds[2]>=surface.bounds[3]||!Number.isFinite(surface.height))fail('surface bounds are invalid');
    if(surface.whenVisible&&!ids.has(surface.whenVisible))fail('surface visibility entity is invalid');
  }
  for(const box of profile.obstacles||[])if(!vector(box,6)||box[0]>=box[3]||box[1]>=box[4]||box[2]>=box[5])fail('obstacle bounds are invalid');
  if(profile.body){
    if(!profile.body||typeof profile.body!=='object'||!Number.isFinite(profile.body.radius)||!Number.isFinite(profile.body.height)||profile.body.radius<=0||profile.body.radius>2||profile.body.height<=0||profile.body.height>5)fail('body collision is invalid');
  }
  if(!profile.surfaces.some(s=>!s.whenVisible&&profile.spawn[0]>=s.bounds[0]&&profile.spawn[0]<=s.bounds[1]&&profile.spawn[2]>=s.bounds[2]&&profile.spawn[2]<=s.bounds[3]&&Math.abs(profile.spawn[1]-s.height)<.1))fail('spawn must be on an initially walkable surface');
  const c=profile.camera;
  if(!c||![c.yaw,c.pitch,c.distance,c.minDistance,c.maxDistance,c.targetHeight].every(Number.isFinite)||c.minDistance<1||c.maxDistance>40||c.minDistance>=c.maxDistance||c.distance<c.minDistance||c.distance>c.maxDistance||c.pitch<5||c.pitch>70)fail('camera limits are invalid');
  if(c.portraitDistance!==undefined&&(!Number.isFinite(c.portraitDistance)||c.portraitDistance<c.minDistance||c.portraitDistance>c.maxDistance))fail('portrait camera distance is invalid');
  if(c.inspectCharacter!==undefined&&typeof c.inspectCharacter!=='boolean')fail('character inspection option must be boolean');
  return profile;
}

export function createPlayerControls(host,profile,adapter){
  let mode='orbit',key=null,checkpoint=null,position=[...profile.spawn],yaw=profile.camera.yaw,pitch=profile.camera.pitch,distance=profile.camera.distance;
  let orbit={target:[0,1,0],yaw:0,pitch:25,distance:15},shot=null,paused=false,moving=false,drag=null,suppressUntil=0;
  let stick=[0,0],stickPointer=null,lastFacing=0,disposed=false,presentedCamera=null;
  const keys=new Set(),cleanups=[];
  const used=kind=>host.dispatchEvent(new CustomEvent('game-control-used',{bubbles:true,detail:{kind}}));
  const listen=(target,event,fn,options)=>{target.addEventListener(event,fn,options);cleanups.push(()=>target.removeEventListener(event,fn,options));};
  const blocked=()=>paused||!host.isConnected||!host.getClientRects().length||host.closest('[inert]')||host.closest('[data-world-status="failed"],[data-world-status="loading"]')||host.closest('[data-game-input-blocked="true"]');
  const surfaceAt=(x,z)=>profile.surfaces.find(s=>(!s.whenVisible||adapter.isEntityEnabled(s.whenVisible))&&x>=s.bounds[0]&&x<=s.bounds[1]&&z>=s.bounds[2]&&z<=s.bounds[3]);
  const body=profile.body||{radius:.32,height:1.6};
  const solidAt=(x,y,z)=>Boolean(adapter.isPlayerBlocked?.(x,y,z,body))||(profile.obstacles||[]).some(b=>x>b[0]-body.radius&&x<b[3]+body.radius&&z>b[2]-body.radius&&z<b[5]+body.radius&&y+body.height>b[1]&&y<b[4]);
  const overlay=document.createElement('div');overlay.className='game-player-controls';
  overlay.innerHTML='<div class="game-view-tools" role="group" aria-label="Camera controls"><button type="button" data-view="recenter" aria-label="Recenter camera">◎</button><button type="button" data-view="in" aria-label="Zoom camera in">+</button><button type="button" data-view="out" aria-label="Zoom camera out">−</button><button type="button" data-view="help" aria-label="Movement controls" aria-expanded="false">?</button></div><div class="game-move-stick" role="group" aria-label="Move player"><span class="game-stick-knob"></span><span class="game-stick-label">MOVE</span><button type="button" data-step="forward" aria-label="Move forward">↑</button><button type="button" data-step="left" aria-label="Move left">←</button><button type="button" data-step="back" aria-label="Move backward">↓</button><button type="button" data-step="right" aria-label="Move right">→</button></div><p class="game-controls-help" hidden><strong>Explore the world.</strong><span>WASD / arrows: move · Drag the world: look · Wheel: zoom.</span><span>On phones, use the movement stick and drag the world to look. Tap ◎ to recenter. Use the highlighted task controls to interact.</span></p>';
  host.append(overlay);
  // Optional character inspection is presentation-only and uses the same camera
  // collision solver. It never turns or teleports the controlled protagonist.
  if(profile.camera.inspectCharacter){
    const inspect=document.createElement('button');inspect.type='button';inspect.dataset.view='character';
    inspect.textContent='◉';inspect.setAttribute('aria-label','View character from front');inspect.title='View character from front';
    overlay.querySelector('.game-view-tools').append(inspect);
  }
  const stickEl=overlay.querySelector('.game-move-stick'),knob=overlay.querySelector('.game-stick-knob'),help=overlay.querySelector('.game-controls-help');
  function release(){keys.clear();stick=[0,0];stickPointer=null;drag=null;knob.style.transform='translate(0,0)';}
  const defaultDistance=()=>host.clientWidth/Math.max(1,host.clientHeight)<.9?(profile.camera.portraitDistance??profile.camera.distance):profile.camera.distance;
  function recenter(){
    if(mode==='third-person'){yaw=profile.camera.yaw;pitch=profile.camera.pitch;distance=defaultDistance();}
    else if(shot)setShot(shot);
    draw();
  }
  function zoom(delta){
    if(mode==='third-person')distance=clamp(distance+delta,profile.camera.minDistance,profile.camera.maxDistance);
    else orbit.distance=clamp(orbit.distance+delta,3,36);
    draw();used('look');
  }
  function rotate(dx,dy){
    if(mode==='third-person'){yaw-=dx*.22;pitch=clamp(pitch+dy*.16,5,70);}
    else{orbit.yaw-=dx*.22;orbit.pitch=clamp(orbit.pitch+dy*.16,5,70);}
    draw();used('look');
  }
  function draw(){
    if(disposed||!shot)return;
    const third=mode==='third-person',target=third?[position[0],position[1]+profile.camera.targetHeight,position[2]]:orbit.target;
    const az=radians(third?yaw:orbit.yaw),el=radians(third?pitch:orbit.pitch),d=third?distance:orbit.distance;
    let eye=[target[0]+Math.sin(az)*Math.cos(el)*d,target[1]+Math.sin(el)*d,target[2]+Math.cos(az)*Math.cos(el)*d];
    if(third){
      const worldBlocked=adapter.getCameraBlocker?.()||((x,y,z)=>adapter.isCameraBlocked?.(x,y,z));
      const cameraBlocked=(x,y,z)=>y<-.2||worldBlocked(x,y,z)||(profile.obstacles||[]).some(b=>x>b[0]-.15&&x<b[3]+.15&&y>b[1]-.15&&y<b[4]+.15&&z>b[2]-.15&&z<b[5]+.15);
      presentedCamera=resolveFollowCamera(target,{yaw,pitch,distance,
        minClearance:followCameraClearance(profile,host.clientWidth/Math.max(1,host.clientHeight))},cameraBlocked);
      eye=presentedCamera.eye;
    }else presentedCamera={eye:[...eye],target:[...target],yaw:orbit.yaw,pitch:orbit.pitch,distance:d,adjusted:false,clearanceSatisfied:true};
    adapter.setCamera(eye,target,third?58:shot.fov);
    host.dataset.cameraMode=mode;
  }
  function move(x,z,dt){
    const length=Math.hypot(x,z);if(!length)return false;
    x/=Math.max(1,length);z/=Math.max(1,length);
    const az=radians(yaw),speed=profile.speed*dt;
    const dx=(Math.cos(az)*x+Math.sin(az)*z)*speed,dz=(-Math.sin(az)*x+Math.cos(az)*z)*speed;
    const old=[...position];
    for(const [axis,delta] of [[0,dx],[2,dz]]){
      const next=[...position];next[axis]+=delta;
      const surface=surfaceAt(next[0],next[2]);
      if(surface&&!solidAt(next[0],surface.height,next[2])&&Math.abs(surface.height-position[1])<=.9){position=next;position[1]=surface.height;}
    }
    if(Math.hypot(position[0]-old[0],position[2]-old[2])<.00001)return false;
    lastFacing=Math.atan2(dx,dz)*180/Math.PI;
    adapter.setAvatar(position,lastFacing);used('move');return true;
  }
  function setShot(value){
    shot=value;const d=value.position.map((v,i)=>v-value.lookAt[i]);
    orbit={target:[...value.lookAt],yaw:Math.atan2(d[0],d[2])*180/Math.PI,pitch:Math.atan2(d[1],Math.hypot(d[0],d[2]))*180/Math.PI,distance:Math.hypot(...d)};
    draw();
  }
  listen(overlay,'click',event=>{
    const button=event.target.closest('button');if(!button)return;event.stopPropagation();
    if(blocked())return;
    if(button.dataset.view==='recenter')recenter();
    if(button.dataset.view==='character'&&mode==='third-person'){
      yaw=lastFacing;pitch=profile.camera.pitch;distance=defaultDistance();draw();used('look');
    }
    if(button.dataset.view==='in')zoom(-.8);
    if(button.dataset.view==='out')zoom(.8);
    if(button.dataset.view==='help'){help.hidden=!help.hidden;button.setAttribute('aria-expanded',String(!help.hidden));}
    if(button.dataset.step&&event.detail===0&&mode==='third-person'){
      const v={forward:[0,-1],back:[0,1],left:[-1,0],right:[1,0]}[button.dataset.step];move(...v,.15);draw();
    }
  });
  function updateStick(event){
    const rect=stickEl.getBoundingClientRect();const x=clamp((event.clientX-rect.left-rect.width/2)/32,-1,1),z=clamp((event.clientY-rect.top-rect.height/2)/32,-1,1);
    stick=[x,z];knob.style.transform=`translate(${x*24}px,${z*24}px)`;
  }
  listen(stickEl,'pointerdown',event=>{if(blocked()||mode!=='third-person')return;event.preventDefault();event.stopPropagation();stickPointer=event.pointerId;stickEl.setPointerCapture(event.pointerId);updateStick(event);});
  listen(stickEl,'pointermove',event=>{if(event.pointerId===stickPointer){event.preventDefault();updateStick(event);}});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(stickEl,type,()=>{stick=[0,0];stickPointer=null;knob.style.transform='translate(0,0)';});
  listen(host,'pointerdown',event=>{if(blocked()||formTarget(event.target)||event.button!==0)return;host.focus({preventScroll:true});drag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false};host.setPointerCapture(event.pointerId);});
  listen(host,'pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;if(blocked()){release();return;}const dx=event.clientX-drag.x,dy=event.clientY-drag.y;drag.moved ||= Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>5;if(drag.moved){rotate(dx,dy);event.preventDefault();}drag.x=event.clientX;drag.y=event.clientY;});
  listen(host,'pointerup',event=>{if(drag?.moved){suppressUntil=performance.now()+350;event.preventDefault();event.stopPropagation();}drag=null;});
  listen(host,'pointercancel',release);
  listen(host,'click',event=>{if(performance.now()<suppressUntil&&!formTarget(event.target)){event.preventDefault();event.stopImmediatePropagation();}},true);
  listen(host,'wheel',event=>{if(blocked()||formTarget(event.target)||event.target.closest('.game-controls-help'))return;event.preventDefault();zoom(event.deltaY*.008);},{passive:false});
  listen(window,'keydown',event=>{
    if(blocked()||mode!=='third-person'||typingTarget(event.target))return;
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'].includes(event.code)){keys.add(event.code);event.preventDefault();}
    if(event.code==='KeyR'){recenter();event.preventDefault();}
  });
  listen(window,'keyup',event=>keys.delete(event.code));listen(window,'blur',release);
  listen(document,'visibilitychange',release);
  return{
    setShot,
    setMode(value,nextKey){
      const changed=mode!==value||key!==nextKey;mode=value;key=nextKey;
      if(changed){checkpoint=null;release();if(value==='third-person'){position=[...profile.spawn];adapter.setAvatar(position,0);yaw=profile.camera.yaw;pitch=profile.camera.pitch;distance=defaultDistance();}}
      const inspect=overlay.querySelector('[data-view="character"]');if(inspect)inspect.hidden=mode!=='third-person';
      overlay.dataset.controlMode=mode;draw();
    },
    restoreAvatar(){if(mode==='third-person')adapter.setAvatar(position,lastFacing);},
    snapshot(){return {mode,key,position:[...position],yaw,pitch,distance,lastFacing};},
    // Authored chapter boundaries place the player once, never on each puzzle
    // update. The normal collision/surface checks also apply to this handoff.
    setCheckpoint(value){
      if(!value||typeof value.id!=='string'||!value.id.trim())return false;
      if(checkpoint===value.id)return true;
      const restored=this.restore({...this.snapshot(),position:value.position,
        yaw:value.yaw??profile.camera.yaw,pitch:value.pitch??profile.camera.pitch,lastFacing:value.facing??0});
      if(restored)checkpoint=value.id;
      return Boolean(restored);
    },
    restore(value){
      if(!value||value.mode!==mode||value.key!==key||!Array.isArray(value.position)||value.position.length!==3||!value.position.every(Number.isFinite)||![value.yaw,value.pitch,value.distance,value.lastFacing].every(Number.isFinite))return;
      const surface=surfaceAt(value.position[0],value.position[2]);
      if(!surface||solidAt(value.position[0],surface.height,value.position[2]))return;
      release();position=[value.position[0],surface.height,value.position[2]];yaw=value.yaw;pitch=clamp(value.pitch,5,70);distance=clamp(value.distance,profile.camera.minDistance,profile.camera.maxDistance);lastFacing=value.lastFacing;adapter.setAvatar(position,lastFacing);draw();return true;
    },
    setPaused(value){paused=Boolean(value);if(paused)release();},
    update(dt){
      if(blocked()){release();if(moving){moving=false;adapter.setMoving(false);}return;}
      if(mode==='third-person'){
        const x=stick[0]+Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
        const z=stick[1]+Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
        const didMove=move(x,z,Math.min(dt,.05));if(didMove!==moving){moving=didMove;adapter.setMoving(moving);}
      }
      draw();
    },
    stats(){return{mode,position:[...position],yaw,pitch,distance,moving,presentedCamera:presentedCamera?{...presentedCamera,eye:[...presentedCamera.eye],target:[...presentedCamera.target]}:null};},
    dispose(){disposed=true;release();cleanups.forEach(fn=>fn());overlay.remove();delete host.dataset.cameraMode;}
  };
}
