import * as T from 'three';

import * as arcade from './world';
import * as facade from './facade';
const facadeStudy=new URLSearchParams(location.search).get('study')==='facade';
const daylightStudy=facadeStudy&&new URLSearchParams(location.search).get('finish')==='daylight';
const {buildWorld,arrival,route,cameraSolids,nearestRoute,walkable}=facadeStudy?facade:arcade;

import './style.css';

import { buildZip } from './zip';
import { buildCourierZip } from './zip-courier';
import { buildZipRig, loadBakedClips, type ZipRig } from './zip-rig';
import { outdoorReflection } from './lighting';
import { installPaintedShading, paintedSky, createPaintedPost, lambertize, adaptiveResolution } from './painted';
import { buildPaintedBackdrop } from './painted-backdrop';
import { buildPaintedLandmarks, tickLandmarks } from './painted-landmarks';
import { buildPaintedLife } from './painted-life';
import { buildGuide } from './guide';
import { buildStory } from './story';
import { sfx } from './sfx';
import { createBumpFeedback } from './kit/bump';
import { loadBodyKit, type BodyKit } from './kit/body-kit';
import { loadProp } from './kit/kit';
import { buildTitle } from './title';
import { save, PLACE } from './save';
import { CANOPY_FOCUS, SIGHT_SHOT } from './canopy';
import { collectFaders, fadeOccluders } from './occluders';
import { frameGovernor, budget } from './kit/budget';
import { buildCameraGrid, type CameraGrid } from './camera-grid';
import { buildPromenade } from './painted-promenade';
import { quality, saveChoice, autoBenchmark, autoWasMeasured, type Choice } from './quality';
const gfx=quality();


const get=(id:string)=>document.getElementById(id)!;

const worldElement=get('world');

const scene=new T.Scene();scene.background=new T.Color('#96c9e1');scene.fog=new T.FogExp2('#c1deea',.0028);
// walking into an edge you can't see shows a soft ripple where it is (kit/bump.ts)
const bump=createBumpFeedback(scene,{onBump:()=>sfx.bump()});

const camera=new T.PerspectiveCamera(facadeStudy?56:52,innerWidth/innerHeight,.08,650);

const renderer=new T.WebGLRenderer({antialias:new URLSearchParams(location.search).get('aa')==='0'?false:gfx.antialias,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.domElement.setAttribute('aria-label','Explore the Bellweather garden arcade');worldElement.appendChild(renderer.domElement);

const reflectedSky=outdoorReflection(renderer);scene.environment=reflectedSky.texture;scene.environmentIntensity=.36;
const ambient=new T.HemisphereLight('#9cbdff','#5e4d83',.72);scene.add(ambient);
const sun=new T.DirectionalLight('#ffe2b5',3.6);sun.position.set(26,38,9);sun.target.position.set(1,0,-8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-29;sun.shadow.camera.right=29;sun.shadow.camera.top=34;sun.shadow.camera.bottom=-34;sun.shadow.camera.near=1;sun.shadow.camera.far=125;sun.shadow.bias=-.00022;sun.shadow.normalBias=.025;scene.add(sun,sun.target);

const cool=new T.DirectionalLight('#9bd5f2',.3);cool.position.set(20,14,-30);scene.add(cool);

if(facadeStudy){
  renderer.toneMappingExposure=1.10;scene.environmentIntensity=.42;ambient.intensity=.65;ambient.groundColor.set('#485775');
  sun.position.set(-8,17,9);sun.target.position.set(0,0,-2);sun.intensity=3.2;
  Object.assign(sun.shadow.camera,{left:-17,right:17,top:19,bottom:-19,far:65});sun.shadow.normalBias=.018;
  get('menu').querySelector('h1')!.textContent='Sunward Conservatory';
  renderer.domElement.setAttribute('aria-label','Explore the Sunward Conservatory entrance');
  document.title='Bellweather — conservatory study';
  document.querySelector('.brand span')!.textContent='SUNWARD CONSERVATORY';
  get('hint').textContent='Explore the entrance · drag to look';
}
if(daylightStudy){
  // Same geometry, authored light direction and baked local occlusion. No extra
  // light/shadow passes or screen-space effects are added for the comparison.
  renderer.toneMappingExposure=1.08;scene.environmentIntensity=.55;
  ambient.color.set('#b7c9f2');ambient.groundColor.set('#937f93');ambient.intensity=.62;
  sun.position.set(-14,16,5);sun.color.set('#ffe2b5');sun.intensity=3.25;
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
}
if(daylightStudy&&new URLSearchParams(location.search).get('palette')==='ceramic'){
  // A more frontal sun exposes curved mineral forms; existing fill lifts deep
  // recesses without extra lights, shadow passes or screen-space effects.
  sun.position.set(-8,16,14);sun.intensity=3.05;
  ambient.intensity=.92;scene.environmentIntensity=.72;
}
if(daylightStudy&&new URLSearchParams(location.search).get('look')==='sunlit'){
  // One coordinated art comparison: stronger directional form, readable cool
  // shade, restrained fill. Same lights, shadow-map size and rendering passes.
  sun.position.set(-11,13,12);sun.color.set('#ffedd2');sun.intensity=3.4;
  ambient.color.set('#aebfe8');ambient.groundColor.set('#64738a');ambient.intensity=.70;
  scene.environmentIntensity=.58;renderer.toneMappingExposure=1.08;
  cool.intensity=.22;
  scene.fog=new T.FogExp2('#bbd8df',.0042);
}
if(daylightStudy&&new URLSearchParams(location.search).get('surface')==='illustrated'){
  // Longer warm cast shadows and restrained cool fill use the same physical
  // lights, fixed shadow map and PBR surfaces. No full-screen grading pass.
  sun.position.set(-14,11,10);sun.color.set('#ffe1ac');sun.intensity=3.7;
  ambient.color.set('#adc3ff');ambient.groundColor.set('#817099');ambient.intensity=.60;
  scene.environmentIntensity=.48;renderer.toneMappingExposure=1.08;
}
const paintedStudy=daylightStudy&&new URLSearchParams(location.search).get('render')==='painted';
if(paintedStudy){
  // Look-development: banded sun with tinted shade, world-space strokes,
  // aerial haze, painted sky and a light bloom/grade stack. See painted.ts.
  installPaintedShading(gfx.strokes);
  sun.shadow.mapSize.set(gfx.shadowMap,gfx.shadowMap);
  scene.background=paintedSky();
  scene.fog=new T.FogExp2('#b9cbeb',.0046);
  sun.position.set(-15,18,-1);sun.color.set('#ffe0b0');sun.intensity=3.3;
  ambient.color.set('#c9d6ff');ambient.groundColor.set('#8a7aa8');ambient.intensity=.34;
  scene.environmentIntensity=.30;renderer.toneMappingExposure=1.02;cool.intensity=.12;
}
let townRoot:T.Object3D|null=null;
try { townRoot=await buildWorld(scene) ?? null; }
catch(error){get('loading').textContent='The study could not load its asset. Reload to retry.';throw error;}

// All camera solids in this study are static. Cache conservative world bounds
// so each orbit ray only tests detailed geometry it could actually reach.
const cameraQueryBounds=cameraSolids.map(object=>({object,bounds:new T.Box3().setFromObject(object)}));
let cameraGeometryRevision=0;



// Painted study: Zip is rigged and animated (zip-rig.ts); other studies keep their static figures.
const zipRig:ZipRig|null=paintedStudy&&new URLSearchParams(location.search).get('rig')!=='0'?buildZipRig():null;
// One baked clip library (Quaternius UAL, CC0) animates Zip and the townsfolk.
let libraryClips:T.AnimationClip[]=[];
if(paintedStudy&&new URLSearchParams(location.search).get('clips')!=='procedural'){try{libraryClips=await loadBakedClips('/characters/zip-ual-clips.json')}catch(e){console.warn('Library clips unavailable; using procedural clips',e)}}
// people from the Blender body kit (authoring/characters/build_body_kit.py); ?bodies=code keeps the code-built ones
let bodyKit:BodyKit|null=null;if(paintedStudy&&new URLSearchParams(location.search).get('bodies')!=='code'){try{bodyKit=await loadBodyKit()}catch(e){console.warn('[kit] body kit unavailable; using code-built people',e)}}
// authored props load with the game (small, Draco), so they are there from the first frame instead of popping in
await Promise.allSettled(['skiff','warden-ship','festival-lantern','bell-frame','gate-arch','word-loom'].map(n=>loadProp(n)));
if(zipRig&&libraryClips.length)zipRig.useClips(libraryClips.filter(c=>['Idle','Walk','Jog','Sprint','Interact','Dance'].includes(c.name)));
const zip=zipRig?zipRig.root:new URLSearchParams(location.search).get('character')==='courier'?buildCourierZip():buildZip();
// islands can sit higher than the town (Loom Isle): the ground Zip stands on is lifted
let groundLift=0;
const standingY0=facadeStudy ? .130-new T.Box3().setFromObject(zip).min.y : .13;
zip.position.copy(arrival).setY((standingY0+groundLift));scene.add(zip);

const contact=new T.Mesh(new T.CircleGeometry(.41,24),new T.MeshBasicMaterial({color:'#213957',transparent:true,opacity:.22,depthWrite:false}));contact.rotation.x=-Math.PI/2;const contactY0=facadeStudy ? .131 : .125;contact.position.set(arrival.x,(contactY0+groundLift),arrival.z);scene.add(contact);
if(facadeStudy){const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const c=canvas.getContext('2d')!,g=c.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'white');g.addColorStop(.35,'#777');g.addColorStop(1,'black');c.fillStyle=g;c.fillRect(0,0,64,64);contact.material.alphaMap=new T.CanvasTexture(canvas);contact.material.opacity=.28;}

const arrivalPitch=.20,arrivalZoom=6.0;
let cameraGrid:CameraGrid|null=null,faders:ReturnType<typeof collectFaders>|null=null,lastFade=0;const fadeFocus=new T.Vector3();
let yaw=0,pitch=arrivalPitch,zoom=arrivalZoom,facadeMoveYaw=0,last=performance.now(),raf=0,paused=false,guideTargetT:number|null=null,reduced=false,elapsed=0,moveAmount=0,frames=0;let positionText='Garden arcade';

const keys=new Set<string>();const held=new Set<string>();const desired=new T.Vector3(),look=new T.Vector3(),cameraDelta=new T.Vector3(),ray=new T.Raycaster();
const cameraBoxHit=new T.Vector3(),cameraCandidates:T.Object3D[]=[];
const cameraMetrics={updates:0,updateMs:0,queries:0,queryMs:0,searches:0,alternatives:0};
let camDist=0;const camDir=new T.Vector3(),camSide=new T.Vector3(),camOrigin=new T.Vector3(),camLift=new T.Vector3();
const cacheOrbit=new URLSearchParams(location.search).get('cameraCache')!=='off';
const orbitCache={valid:false,position:new T.Vector3(),yaw:NaN,pitch:NaN,zoom:NaN,geometryRevision:-1,selected:new T.Vector3(),available:0};
// The current study's camera solids are static. Any future runtime geometry
// mutation must refresh their bounds and discard the orbit result together.
function invalidateCameraGeometry(){
  cameraQueryBounds.length=0;
  for(const object of cameraSolids)cameraQueryBounds.push({object,bounds:new T.Box3().setFromObject(object)});
  cameraGeometryRevision++;orbitCache.valid=false;
}
function firstCameraHit(origin:T.Vector3,delta:T.Vector3,minDistance:number){
  const started=performance.now();
  const distance=delta.length();
  ray.set(origin,delta.clone().normalize());ray.far=distance;
  cameraCandidates.length=0;
  for(const {object,bounds} of cameraQueryBounds){
    const boxHit=ray.ray.intersectBox(bounds,cameraBoxHit);
    if(bounds.containsPoint(origin)||(boxHit&&cameraBoxHit.distanceToSquared(origin)<=distance*distance))cameraCandidates.push(object);
  }
  let hit:{distance:number}|undefined=ray.intersectObjects(cameraCandidates,false).find(hit=>hit.distance>minDistance);
  if(cameraGrid){const g=cameraGrid.hit(origin,ray.ray.direction,distance);if(g>minDistance&&g<(hit?.distance??Infinity))hit={distance:g};}
  cameraMetrics.queries++;cameraMetrics.queryMs+=performance.now()-started;
  return hit;
}

const announce=(s:string)=>{get('announcer').textContent=s};

function setPlace(s:string){if(positionText!==s){positionText=s;get('place').textContent=s;announce(s)}}

function updateLocation(){if(story?.placeName){setPlace(story.placeName);return}const n=nearestRoute(zip.position);if(facadeStudy){setPlace(n.t>.82?'Inner courtyard':n.t>.34?'Conservatory entrance':'Sunward approach');get('route').innerHTML=n.t>.87?'Return to entrance <span>↙</span>':'Walk through entrance <span>↗</span>';return}setPlace(n.t>.82?'Overlook pavilion':n.t>.34?'Garden lightwell':'Garden arcade');get('route').innerHTML=n.t>.87?'Return to arcade <span>↙</span>':'Walk to overlook <span>↗</span>'}

// Painted study on portrait phones: aim a little higher and widen the lens so
// Zip sits in the lower third and the vista, not the character, fills the frame.
function startZoom(){return paintedStudy&&camera.aspect<.8?Math.min(10.5,arrivalZoom*1.2):arrivalZoom}
function framingLift(){return paintedStudy&&camera.aspect<.8?.95:0}
function gpuLabel(){
  // Which GPU the browser gave us, and Auto's measurement, for play-testing.
  const w=window as any;
  if(w.__vlGpu===undefined){try{const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');const name=ext?String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)):'';w.__vlGpu=name.replace(/^ANGLE \((.*)\)$/,'$1').split(',').slice(0,2).join(',').replace(/Direct3D.*$/,'').trim().slice(0,48)}catch{w.__vlGpu=''}}
  const b=w.__vlAutoBench;
  return (w.__vlGpu?` · ${w.__vlGpu}`:'')+(b?` · bench ${b.ms} ms (${b.via})`:'');
}
function applyLens(){if(paintedStudy){camera.fov=camera.aspect<.8?66:56;camera.updateProjectionMatrix()}}
// how far the follow camera could sit at this yaw before something blocks it
function camClearAt(a:number){camOrigin.copy(zip.position).y+=1.5;cameraDelta.set(Math.sin(a)*Math.cos(pitch)*zoom,1.3+Math.sin(pitch)*zoom-1.5,Math.cos(a)*Math.cos(pitch)*zoom);const full=cameraDelta.length(),hit=firstCameraHit(camOrigin,cameraDelta,.15);return hit?Math.min(full,hit.distance):full}
// When a new goal appears off to the side, the camera glances toward it once (the player
// can always take over by dragging), so "where do I go?" is answered by the view itself.
let glanceFrom=new T.Vector3(1e9,0,0),glanceT=0,glanceYaw=0,glanceGoal='';
function glanceAtGoal(dt:number){
  const b=guide?.beaconAt;if(!b||story?.frozen||title?.active||ridePos){glanceT=0;return}
  // only for a new goal (not a beacon that follows a moving target); counts like "(1 of 3)" don't make it new
  const gt=(guide?.goalText??'').replace(/\(.*\)/,'');if(gt!==glanceGoal&&b.distanceToSquared(glanceFrom)>4){glanceGoal=gt;glanceFrom.copy(b);const dx=b.x-zip.position.x,dz=b.z-zip.position.z;if(Math.hypot(dx,dz)>4){glanceYaw=Math.atan2(-dx,-dz);glanceT=1.4}}
  if(glanceT>0){if(dragging){glanceT=0;return}glanceT-=dt;let d=((glanceYaw-yaw+Math.PI*3)%(Math.PI*2))-Math.PI;yaw+=d*Math.min(1,dt*2.2);facadeMoveYaw=yaw}
}
// test hook: a fixed camera for look-dev shots (__arcade.frame)
let camOverride:{p:T.Vector3,t:T.Vector3}|null=null;const shakeV=new T.Vector3();
function cameraUpdate(dt:number){if(camOverride){camera.position.copy(camOverride.p);camera.lookAt(camOverride.t);return}
  const started=performance.now();
  if(dt<.5)glanceAtGoal(dt);
  // Puzzle shot: a fixed, readable view of the speech rail while it is in use.
  const shot=story?.shot;SIGHT_SHOT.value=shot||guide?.cardOpen?1:0;if(shot){camera.position.lerp(shot.pos,Math.min(1,dt*4));look.lerp(shot.look,Math.min(1,dt*4));const k=reduced?0:((shot as {shake?:number}).shake??0);if(k>.01)camera.position.add(shakeV.set((Math.random()-.5)*k*.5,(Math.random()-.5)*k*.35,(Math.random()-.5)*k*.5));camera.lookAt(look);return;}
  if(cameraQueryBounds.length!==cameraSolids.length)invalidateCameraGeometry();
  if(facadeStudy){
    const pivot=zip.position.clone().add(new T.Vector3(0,1.5,0));
    const orbitAt=(angle:number)=>zip.position.clone().add(new T.Vector3(
      Math.sin(angle)*Math.cos(pitch)*zoom,
      1.3+Math.sin(pitch)*zoom,
      Math.cos(angle)*Math.cos(pitch)*zoom
    ));
    // Steady follow camera: the player's yaw is never overridden. When something
    // is in the way the camera slides in along the same line (fast in, slow out),
    // so it never flips to the other side of a wall; when it gets very close it
    // lifts to look over Zip. Small things in between fade instead (occluders).
    const target=orbitAt(yaw);
    camDir.subVectors(target,pivot);const full=camDir.length();camDir.normalize();
    camSide.set(camDir.z,0,-camDir.x).normalize().multiplyScalar(.3);
    let clear=full;
    for(const o of [-1,0,1]){
      camOrigin.copy(pivot).addScaledVector(camSide,o);cameraDelta.copy(camDir).multiplyScalar(full);
      const hit=firstCameraHit(camOrigin,cameraDelta,.15);
      if(hit)clear=Math.min(clear,Math.max(.9,hit.distance-.3));
    }
    if(!(camDist>0)||dt>=.5)camDist=clear;
    else camDist+=(clear-camDist)*(1-Math.exp(-dt*(clear<camDist?18:2.5)));
    const tight=1-T.MathUtils.smoothstep(camDist,1.3,3.2);
    desired.copy(pivot).addScaledVector(camDir,camDist);
    // Whiskers: squeezed against a wall, the camera eases round to the side with more room
    // (only while Zip moves and the player isn't steering the camera), like third-person games do.
    if(tight>.35&&!dragging&&moveAmount>0&&!story?.shot){const pinned=camDist<1.8;let best=yaw,bestClear=camClearAt(yaw)+.6;for(const d of pinned?[-.45,.45,-.9,.9,-1.6,1.6,Math.PI]:[-.45,.45,-.9,.9]){const c=camClearAt(yaw+d)-Math.abs(d)*.25;if(c>bestClear){bestClear=c;best=yaw+d}}if(best!==yaw){yaw+=(best-yaw)*Math.min(1,dt*(pinned?3.2:1.6));facadeMoveYaw=yaw}}
    // pressed right up against Zip: rise over him and look down, rather than fill the screen with him
    const squeeze=1-T.MathUtils.smoothstep(camDist,.9,1.8);
    if(tight>0){camLift.set(0,tight*.55,0).add(desired);cameraDelta.subVectors(camLift,pivot);const up=firstCameraHit(pivot,cameraDelta,.15);if(!up||up.distance>cameraDelta.length())desired.copy(camLift)}
    camera.position.lerp(desired,dt>=.5?1:Math.min(1,dt*12));
    const horizontalX=camera.position.x-zip.position.x,horizontalZ=camera.position.z-zip.position.z;
    if(Math.hypot(horizontalX,horizontalZ)>.5)facadeMoveYaw=Math.atan2(horizontalX,horizontalZ);
    // Frame the architecture above the player without lowering the physical
    // camera behind the courtyard's low walls when the player turns around.
    // (the lift fades as the camera comes close, so Zip never slips off the bottom of a phone screen)
    look.copy(pivot).add(new T.Vector3(0,(.5+framingLift())*T.MathUtils.smoothstep(camDist,1.8,5.5),0));
    // squeezed close: look past Zip's shoulder at where he is going, not down at his head
    if(tight>0){const k=tight*(1-squeeze);look.x-=camDir.x*k*1.1;look.z-=camDir.z*k*1.1;look.y-=tight*.2}  // a little past his shoulder, never losing him
    camera.lookAt(look);
    cameraMetrics.updates++;cameraMetrics.updateMs+=performance.now()-started;return;
  }
  look.copy(zip.position).add(new T.Vector3(0,1.8,-3.2).applyAxisAngle(new T.Vector3(0,1,0),yaw));
  desired.copy(zip.position).add(new T.Vector3(Math.sin(yaw)*Math.cos(pitch)*zoom,1.3+Math.sin(pitch)*zoom,Math.cos(yaw)*Math.cos(pitch)*zoom));
  cameraDelta.subVectors(desired,look);
  const hit=firstCameraHit(look,cameraDelta,.5);
  if(hit&&hit.distance<cameraDelta.length())desired.copy(look).addScaledVector(cameraDelta.normalize(),Math.max(1.25,hit.distance-.28));
  desired.y=Math.max(1.5+groundLift,desired.y);camera.position.lerp(desired,Math.min(1,dt*10));camera.lookAt(look);
  cameraMetrics.updates++;cameraMetrics.updateMs+=performance.now()-started;
}

function move(dt:number){if(ridePos){zip.position.copy(ridePos);zip.rotation.y=rideYaw;contact.visible=false;moveAmount=0;return}contact.visible=true;if(story?.frozen||title?.active){walkTarget=null;walkMark.visible=false;keys.clear();held.clear();guideTargetT=null;}let dx=Number(keys.has('KeyD')||keys.has('ArrowRight')||held.has('right'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')||held.has('left')),dz=Number(keys.has('KeyS')||keys.has('ArrowDown')||held.has('back'))-Number(keys.has('KeyW')||keys.has('ArrowUp')||held.has('forward'));if(guideTargetT!==null){const targetT=guideTargetT,n=nearestRoute(zip.position);const delta=route.getPoint(T.MathUtils.clamp(n.t+Math.sign(targetT-n.t)*.028,0,1)).sub(zip.position);dx=delta.x;dz=delta.z;if(zip.position.distanceTo(route.getPoint(targetT))<.38){guideTargetT=null;dx=dz=0;announce(facadeStudy?(targetT===0?'Returned to the conservatory entrance.':'Reached the inner courtyard.'):(targetT===0?'Returned to the garden arcade.':'Reached the overlook pavilion.'))}}else if(walkTarget&&!dx&&!dz){const v=walkTarget.clone().sub(zip.position);if(Math.hypot(v.x,v.z)<.3){walkTarget=null;walkMark.visible=false}else{dx=v.x;dz=v.z;if(!dragging){const want=Math.atan2(-dx,-dz),dY=((want-yaw+Math.PI*3)%(Math.PI*2))-Math.PI,next=yaw+dY*Math.min(1,dt*1.1);if(!facadeStudy||camClearAt(next)>=Math.min(2.6,camClearAt(yaw)-.02))yaw=next}if(walkDetour){const c=Math.cos(walkDetour),s=Math.sin(walkDetour),x=dx*c-dz*s;dz=dx*s+dz*c;dx=x}}}else{if(walkTarget){walkTarget=null;walkMark.visible=false}const bearing=facadeStudy?facadeMoveYaw:yaw,x=dx*Math.cos(bearing)+dz*Math.sin(bearing);dz=-dx*Math.sin(bearing)+dz*Math.cos(bearing);dx=x}const length=Math.hypot(dx,dz);moveAmount=0;if(length>.05){dx/=length;dz/=length;const old=zip.position.clone(),dist=3.15*dt,n=Math.max(1,Math.ceil(dist/.08));for(let i=0;i<n;i++){const p=zip.position.clone().add(new T.Vector3(dx*dist/n,0,dz*dist/n));if(walkable(p))zip.position.copy(p);else{p.copy(zip.position);p.x+=dx*dist/n;if(walkable(p))zip.position.copy(p);p.copy(zip.position);p.z+=dz*dist/n;if(walkable(p))zip.position.copy(p)}}const ang=Math.atan2(-dx,-dz);let a=(ang-zip.rotation.y+Math.PI*3)%(Math.PI*2)-Math.PI;zip.rotation.y+=a*Math.min(1,dt*10);moveAmount=zip.position.distanceTo(old);if(!walkTarget&&guideTargetT===null)bump.push(dt,zip.position,dx,dz,moveAmount/dist);if(walkTarget){const slow=moveAmount<dist*.35;walkStuck=slow?walkStuck+dt:Math.max(0,walkStuck-dt*.5);walkDetourT-=dt;if(slow&&walkDetourT<=0){walkDetour=walkDetour>0?-1.1:walkDetour<0?0:1.1;walkDetourT=.45}else if(!slow&&walkDetourT<=0)walkDetour=0;if(walkStuck>1.5){walkTarget=null;walkMark.visible=false;walkStuck=0;walkDetour=0}}if(moveAmount>0){get('hint').style.opacity='0';updateLocation()}}bump.tick(dt);contact.position.set(zip.position.x,(contactY0+groundLift),zip.position.z);if(!reduced&&!facadeStudy)zip.position.y=(standingY0+groundLift)+Math.sin(elapsed*12)*Math.min(.035,moveAmount*.3);else zip.position.y=(standingY0+groundLift)}

const lastShadowTransform=new T.Vector4(Infinity,Infinity,Infinity,Infinity);
if(paintedStudy){
  // The study's own gradient sky dome would hide the painted background.
  scene.traverse(o=>{const m=o as T.Mesh;if(m.isMesh&&(m.material as T.Material).type==='ShaderMaterial'&&(m.material as T.Material).side===T.BackSide)m.visible=false});
  if(new URLSearchParams(location.search).get('backdrop')!=='0'){buildPaintedBackdrop(scene,gfx.cloudRings);await buildPaintedLandmarks(scene,{islands:gfx.islands,cloudLobes:gfx.cloudLobes,canopyDetail:gfx.canopyDetail});}
  const vignette=document.createElement('div');vignette.style.cssText='position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,transparent 55%,rgba(20,24,60,.22) 100%)';worldElement.appendChild(vignette);
}
const paintedParams=new URLSearchParams(location.search);
const promenade=paintedStudy&&paintedParams.get('promenade')!=='0'?buildPromenade(scene,{box:facade.addSolidBox,circle:facade.addSolidCircle,walk:(x,z)=>walkable(new T.Vector3(x,0,z)),sunDir:sun.position.clone().sub(sun.target.position),renderer,camera,reflections:gfx.reflections}):null;
const lifeTick=paintedStudy&&paintedParams.get('life')!=='0'?buildPaintedLife(scene,facade.addSolidCircle,gfx.birds,{clips:libraryClips,kit:bodyKit,camera,host:worldElement.parentElement!,onGreet:from=>{zipRig?.lookAt(from);greetUntil=elapsed+4;waveBackAt=elapsed+.75}}):null;
const storyOn=paintedStudy&&paintedParams.get('puzzle')!=='0'&&paintedParams.get('story')!=='0';
const appHost=worldElement.parentElement!;
const guide=storyOn?buildGuide(scene,appHost,camera,renderer.domElement):null;
// Tap to walk: tap the ground and Zip walks there (phones, and anyone who
// prefers pointing to arrows). Lowest priority: puzzle taps are checked first.
let walkTarget:T.Vector3|null=null,walkStuck=0,walkDetour=0,walkDetourT=0;
const walkMark=new T.Mesh(new T.RingGeometry(.2,.3,28).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:'#ffd36b',transparent:true,opacity:.9,depthWrite:false}));walkMark.visible=false;walkMark.renderOrder=3;scene.add(walkMark);
guide?.onTap(r=>{if(story?.frozen||title?.active||ridePos||paused)return false;const d=r.ray.direction,o=r.ray.origin;if(d.y>-.02)return false;const p=o.clone().addScaledVector(d,(.13-o.y)/d.y);if(p.distanceTo(zip.position)>30)return false;walkTarget=p;walkStuck=0;walkDetour=0;walkDetourT=0;walkMark.position.set(p.x,.16,p.z);walkMark.visible=true;return true});
const sunBase=sun.intensity,ambBase=ambient.intensity;
let ridePos:T.Vector3|null=null,rideYaw=0,townHidden=false;let title:ReturnType<typeof buildTitle>|null=null;
const story=guide?buildStory(scene,{guide,camera,cameraClear:(a,b)=>{const d=b.clone().sub(a),h=firstCameraHit(a,d,.15);return h?h.distance:d.length()},host:appHost,zip:()=>zip.position,aspect:()=>camera.aspect,
  addBox:facade.addSolidBox,removeBox:facade.removeSolidBox as any,solid:facade.addSolidCircle,addWalk:facade.addWalkRegion,
  onEvent:e=>{const seen=save.learning() as {activity:string,decision:string}[];if(save.decidedBefore(e.activity,e.decision)||seen.some(x=>x.activity===e.activity&&x.decision===e.decision))e.first=false;save.logEvent(e);console.info('[learning]',JSON.stringify(e))},walkable:(x,z)=>walkable(new T.Vector3(x,0,z)),enterIsland:blockers=>{for(const o of [townRoot,scene.getObjectByName('painted-promenade'),scene.getObjectByName('painted-life'),scene.getObjectByName('speech-puzzle')])if(o)o.visible=false;townHidden=true;cameraSolids.push(...blockers);invalidateCameraGeometry();},ride:(p,y)=>{ridePos=p?(ridePos??new T.Vector3()).copy(p):null;rideYaw=y},input:()=>({x:Number(keys.has('KeyD')||keys.has('ArrowRight')||held.has('right'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')||held.has('left')),y:Number(keys.has('KeyW')||keys.has('ArrowUp')||held.has('forward'))-Number(keys.has('KeyS')||keys.has('ArrowDown')||held.has('back'))}),
  dim:k=>{sun.intensity=sunBase*(1-.6*k);ambient.intensity=ambBase*(1-.35*k)},
  density:{low:.5,medium:.8,high:1}[quality().tier],
  adopt:(root,blockers)=>{if(paintedStudy&&paintedParams.get('pbr')!=='1')lambertize(root);if(faders)faders.push(...collectFaders(root));if(townHidden&&blockers.length){cameraSolids.push(...blockers);invalidateCameraGeometry()}renderer.compileAsync(root,camera,scene).catch(()=>{})},
  setGround:(y:number)=>{groundLift=y;zip.position.y=standingY0+groundLift;contact.position.y=contactY0+groundLift},teleport:(x,z,y)=>{guideTargetT=null;zip.position.set(x,(standingY0+groundLift),z);contact.position.set(x,(contactY0+groundLift),z);zip.rotation.y=y;yaw=y;facadeMoveYaw=y;updateLocation();cameraUpdate(1)}}):null;
if(story){appHost.classList.add('story-mode');const mp=document.querySelector('.menu-card p');if(mp)mp.textContent='Paused. Zip waits patiently, like a good NPC.';(window as any).__vlStory=story;}
if(story){const lab=document.createElement('label');lab.innerHTML='<input type="checkbox" id="sound"> Sound';get('reduced').parentElement!.after(lab);const cb=lab.querySelector('input')!;cb.checked=!sfx.muted;cb.addEventListener('change',()=>sfx.setMuted(!cb.checked));}
if(paintedStudy&&paintedParams.get('pbr')!=='1')lambertize(scene);
faders=paintedStudy?collectFaders(scene):null;lastFade=performance.now();
if(paintedStudy&&paintedParams.get('camgrid')!=='0'){
  cameraGrid=buildCameraGrid(scene,new T.Box3(new T.Vector3(-13,-.5,-16),new T.Vector3(13,8,14)),.2,o=>o===zip||o.name==='painted-life'||o.name==='HeroIsland');
  invalidateCameraGeometry();(window as any).__vlCameraGrid=cameraGrid;
}
// Compile every shader up front (in parallel where the driver allows), so
// walking into a new area never stalls on a first-time program link.
if(paintedStudy){try{await Promise.race([renderer.compileAsync(scene,camera),new Promise(r=>setTimeout(r,4000))])}catch{}}
// Painted mode: world shadows are rendered once; the moving character uses its
// soft contact shadow instead of forcing a full shadow-map redraw every step.
if(paintedStudy){zip.traverse(o=>{o.castShadow=false});renderer.shadowMap.needsUpdate=true;if(contact.material instanceof T.MeshBasicMaterial)contact.material.opacity=.42;}
const post=paintedStudy&&new URLSearchParams(location.search).get('paintpost')==='1'?createPaintedPost(renderer,scene,camera):null;
const governor=paintedStudy&&!paintedParams.get('capture')?frameGovernor():null;(window as any).__vlBudget=budget;
const adaptRes=paintedStudy&&paintedParams.get('adaptive')!=='0'&&!paintedParams.get('capture')?adaptiveResolution(renderer,()=>{renderer.setSize(innerWidth,innerHeight);post?.resize()},gfx.targetMs,gfx.minPixelRatio,gfx.maxPixelRatio,()=>{if(post)post.render();else renderer.render(scene,camera)}):null;
function render(){
  // Camera orbit does not change light-space shadows. Refresh when the sole
  // moving caster changes position/heading, including route, restart and reset.
  // Any future animated caster/light must explicitly invalidate this cache.
  if(daylightStudy&&!paintedStudy){
    const p=zip.position;
    if(lastShadowTransform.x!==p.x||lastShadowTransform.y!==p.y||lastShadowTransform.z!==p.z||lastShadowTransform.w!==zip.rotation.y){
      renderer.shadowMap.needsUpdate=true;lastShadowTransform.set(p.x,p.y,p.z,zip.rotation.y);
    }
  }
  camera.updateMatrixWorld();{const f=story?.focus;if(f)CANOPY_FOCUS.value.copy(f);else CANOPY_FOCUS.value.set(zip.position.x,zip.position.y+.9,zip.position.z);CANOPY_FOCUS.value.applyMatrix4(camera.matrixWorldInverse)}
  if(faders){const t=performance.now();fadeOccluders(faders,camera,zip.position,Math.min(.1,(t-lastFade)/1000));lastFade=t;}
  promenade?.beforeRender();
  if(post)post.render();else renderer.render(scene,camera);frames++;adaptRes?.();governor?.();
}

// Graphics settings and optional frame readout (painted study only).
let statsEl:HTMLElement|null=null;const statFrames:number[]=[];let statLast=performance.now(),statShown=0;
if(paintedStudy){
  const card=get('menu').querySelector('.menu-card')!;
  const box=document.createElement('div');box.className='gfx';
  const label=document.createElement('p');label.className='gfx-label';label.textContent='Graphics';box.appendChild(label);
  const row=document.createElement('div');row.className='gfx-row';row.setAttribute('role','radiogroup');row.setAttribute('aria-label','Graphics quality');
  const names:[Choice,string][]=[['auto','Auto'],['low','Low'],['medium','Medium'],['high','High']];
  for(const [value,text] of names){
    const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('role','radio');
    b.setAttribute('aria-checked',String(gfx.choice===value));b.className='gfx-option';
    b.addEventListener('click',()=>{if(gfx.choice===value&&value!=='auto')return;saveChoice(value);const hv=(window as any).__vlVariant,extra=value==='auto'?'&auto=measure':'';if(hv)location.hash=`${hv}&quality=${value}${extra}`;else{const u=new URL(location.href);u.searchParams.set('quality',value);if(extra)u.searchParams.set('auto','measure');location.replace(u.toString())}});row.appendChild(b);
  }
  box.appendChild(row);
  const note=document.createElement('p');note.className='gfx-note';note.textContent=gfx.choice==='auto'?`Auto chose ${gfx.tier[0].toUpperCase()+gfx.tier.slice(1)} for this device. Changing reloads the scene.`:'Changing reloads the scene.';box.appendChild(note);
  const statsLabel=document.createElement('label');const statsBox=document.createElement('input');statsBox.type='checkbox';statsBox.id='frame-stats';
  statsLabel.append(statsBox,' Show frame rate');box.appendChild(statsLabel);
  card.insertBefore(box,card.querySelector('label'));
  statsEl=document.createElement('div');statsEl.className='frame-stats';statsEl.setAttribute('aria-live','off');worldElement.parentElement!.appendChild(statsEl);
  let on=false;try{on=localStorage.getItem('bellweather.stats')==='1'}catch{}
  if(new URLSearchParams(location.search).get('stats')==='1')on=true;
  statsBox.checked=on;statsEl.hidden=!on;
  statsBox.addEventListener('change',()=>{statsEl!.hidden=!statsBox.checked;try{localStorage.setItem('bellweather.stats',statsBox.checked?'1':'0')}catch{}});
}
function updateStats(now:number){
  if(!statsEl||statsEl.hidden)return;
  statFrames.push(now-statLast);statLast=now;
  if(now-statShown<500)return;statShown=now;
  const sorted=statFrames.splice(0).sort((a,b)=>a-b);if(!sorted.length)return;
  const med=sorted[sorted.length>>1],slow=sorted[Math.floor(sorted.length*.9)];
  statsEl.textContent=`${Math.round(1000/med)} fps · ${med.toFixed(0)} ms (slow ${slow.toFixed(0)}) · ${gfx.tier}${gfx.choice==='auto'?' (auto)':''} · ${Math.round(renderer.getPixelRatio()*100)}% res${gpuLabel()}`;
}
function tick(now:number){raf=0;if(paused||document.hidden)return;const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;elapsed+=dt;move(dt);const zipSpeed=dt>0?moveAmount/dt:0;
  if(zipRig){if(waveBackAt>0&&elapsed>=waveBackAt){waveBackAt=-1;if(zipSpeed<.4)zipRig.wave()}if(greetUntil>0&&elapsed>greetUntil){greetUntil=-1;zipRig.lookAt(null)}}
  zipRig?.update(dt,zipSpeed,reduced);if(!townHidden)lifeTick?.(dt,reduced,{pos:zip.position,speed:zipSpeed});story?.tick(dt);guide?.tick(dt,zipSpeed,elapsed);if(!reduced){if(!townHidden)promenade?.tick(dt);if(paintedStudy)tickLandmarks(dt);}cameraUpdate(dt);render();updateStats(now);schedule()}

let greetUntil=-1,waveBackAt=-1;
const captureMode=new URLSearchParams(location.search).get('capture')==='1';
function schedule(){if(captureMode)return;if(!raf&&!paused&&!document.hidden)raf=requestAnimationFrame(tick)}

function pause(v:boolean){paused=v;keys.clear();held.clear();guideTargetT=null;get('controls').inert=v;get('menu').hidden=!v;get('pause').textContent=v?'▶':'Ⅱ';if(v){if(raf)cancelAnimationFrame(raf);raf=0;get('resume').focus()}else{last=performance.now();schedule()}}

get('pause').addEventListener('click',()=>pause(!paused));get('resume').addEventListener('click',()=>pause(false));get('restart').addEventListener('click',()=>{story?.interrupt();const spot=story?.safeSpot();if(spot==='stay'){pause(false);return}if(spot){zip.position.set(spot[0],(standingY0+groundLift),spot[1]);walkTarget=null;zip.rotation.y=spot[2];yaw=spot[2];pitch=arrivalPitch;zoom=startZoom();pause(false);updateLocation();cameraUpdate(1);render();announce('Returned to the landing.');return}zip.position.copy(arrival).setY((standingY0+groundLift));zip.rotation.y=0;yaw=0;pitch=arrivalPitch;zoom=startZoom();pause(false);updateLocation();cameraUpdate(1);render();announce(facadeStudy?'Returned to the conservatory entrance.':'Returned to the garden arcade.')});get('recenter').addEventListener('click',()=>{yaw=0;pitch=arrivalPitch;zoom=startZoom();cameraUpdate(1);if(!document.hidden)render()});get('reduced').addEventListener('change',e=>{reduced=(e.target as HTMLInputElement).checked})
// the phone's own reduce-motion setting is the default; the checkbox in the pause menu overrides it
;{const mq=matchMedia?.('(prefers-reduced-motion: reduce)');if(mq?.matches){reduced=true;(get('reduced') as HTMLInputElement).checked=true}};get('route').addEventListener('click',()=>{if(paused)return;guideTargetT=nearestRoute(zip.position).t>.87?0:.96;announce(facadeStudy?(guideTargetT===0?'Walking back to the entrance.':'Walking to the inner courtyard.'):(guideTargetT===0?'Walking back to the arcade.':'Walking to the overlook pavilion.'))});

// Play-test shortcuts: Ctrl+Shift+1..5 restart at a story beat (hash survives the claude.ai frame).
window.addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&/^Digit[1-5]$/.test(e.code)){const b=['attack','spark','skiff','isle','land'][+e.code.slice(5)-1];const keep=location.hash.slice(1).split('&').filter(p=>p&&!p.startsWith('beat='));location.hash=[...(keep.length?keep:['painted']),'beat='+b].join('&');if(!('__vlSearch' in window))location.search='?'+new URLSearchParams({...Object.fromEntries(new URLSearchParams(location.search)),beat:b});e.preventDefault()}});
window.addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();pause(!paused);return}if(paused)return;const focused=document.activeElement as HTMLElement|null;if(focused?.matches('input'))return;if(focused?.matches('button')&&['Space','Enter'].includes(e.code))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);guideTargetT=null}});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();held.clear();guideTargetT=null});document.addEventListener('visibilitychange',()=>{keys.clear();held.clear();guideTargetT=null;if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0}else{last=performance.now();schedule()}});

let dragging:{id:number,x:number,y:number}|null=null;renderer.domElement.addEventListener('pointerdown',e=>{if(paused)return;dragging={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId)});renderer.domElement.addEventListener('pointermove',e=>{if(!dragging||e.pointerId!==dragging.id)return;yaw-=(e.clientX-dragging.x)*.004;pitch=T.MathUtils.clamp(pitch+(e.clientY-dragging.y)*.0035,-.13,.9);dragging.x=e.clientX;dragging.y=e.clientY;get('hint').style.opacity='0'});const stopDrag=()=>dragging=null;renderer.domElement.addEventListener('pointerup',stopDrag);renderer.domElement.addEventListener('pointercancel',stopDrag);renderer.domElement.addEventListener('wheel',e=>{if(paused)return;e.preventDefault();zoom=T.MathUtils.clamp(zoom+e.deltaY*.006,3.7,10.5)},{passive:false});for(const b of document.querySelectorAll<HTMLButtonElement>('[data-dir]')){const dir=b.dataset.dir!;b.addEventListener('pointerdown',e=>{if(paused)return;b.setPointerCapture(e.pointerId);held.add(dir);guideTargetT=null});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>held.delete(dir))}

window.addEventListener('resize',()=>{renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);post?.resize();camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();applyLens();cameraUpdate(1);if(paused&&!document.hidden)render()});renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pause(true);get('menu').querySelector('p')!.textContent='The view needs a reload.';announce('Graphics context lost. Reload this disposable study.')});

// Diagnostics for performance profiling (scene graph access only).
// If the browser drops the GPU context (driver reset, memory pressure, too many
// tabs), say so plainly instead of leaving a blank screen.
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();const l=get('loading');l.hidden=false;l.style.cursor='pointer';l.style.textAlign='center';l.style.padding='24px';l.textContent='The browser paused the graphics (GPU reset). Tap to reload the game.';l.onclick=()=>location.reload();console.warn('[vl] webgl context lost')});
(window as any).__vlDebug={scene,renderer,camera,sun,walkable,get zipRig(){return zipRig}};
Object.defineProperty(window,'__arcade',{value:{
  snapshot:()=>({study:facadeStudy?'facade':'arcade',standingY:standingY0+groundLift,contactY:contactY0+groundLift,position:zip.position.toArray(),routeT:nearestRoute(zip.position).t,paused,guided:guideTargetT!==null,guideTargetT,reduced,frames,draws:renderer.info.render.calls,triangles:renderer.info.render.triangles,cameraSolids:cameraSolids.length,camera:camera.position.toArray(),cameraMetrics:{...cameraMetrics},place:positionText}),
  invalidateCameraGeometry,
  // read-only probe for automated checks: is this spot walkable for Zip?
  walkable:(x:number,z:number)=>walkable(new T.Vector3(x,(standingY0+groundLift),z)),
  // Fast-forward for automated play-testers: run the game's own update in fixed
  // 50 ms steps without drawing, holding the given keys (or walking to a point).
  simulate:(seconds:number,input:{keys?:string[],walkTo?:[number,number]}={})=>{
    if(paused)return {paused:true};
    for(const k of input.keys??[])keys.add(k);
    if(input.walkTo){walkTarget=new T.Vector3(input.walkTo[0],.13,input.walkTo[1]);walkStuck=0;walkDetour=0;walkDetourT=0}
    const n=Math.max(1,Math.round(seconds/.05));
    for(let i=0;i<n&&!paused;i++){const dt=.05;elapsed+=dt;move(dt);const sp=moveAmount/dt;zipRig?.update(dt,sp,reduced);story?.tick(dt);guide?.tick(dt,sp,elapsed);cameraUpdate(dt)}
    for(const k of input.keys??[])keys.delete(k);
    if(input.walkTo){walkTarget=null;walkMark.visible=false}
    render();return {position:zip.position.toArray()};
  },
  // Deterministic capture pose for the fixed judgment views (V1-V4).
  pose:(x:number,z:number,poseYaw:number,posePitch:number,poseZoom:number,faceYaw?:number)=>{
    zip.position.set(x,(standingY0+groundLift),z);if(faceYaw!==undefined)zip.rotation.y=faceYaw;
    yaw=poseYaw;pitch=posePitch;zoom=poseZoom;facadeMoveYaw=poseYaw;contact.position.set(x,(contactY0+groundLift),z);
    for(let i=0;i<30;i++)cameraUpdate(1);updateLocation();render();
    return {camera:camera.position.toArray()};
  },
  // what is under a screen point (tests and tuning): name, material colour and where it is
  // look-dev: hold the camera at p looking at t (pass null to give it back)
  frame:(p:number[]|null,t?:number[])=>{camOverride=p&&t?{p:new T.Vector3(...p),t:new T.Vector3(...t)}:null;cameraUpdate(0);render();return true},
  pick:(nx:number,ny:number)=>{const rc=new T.Raycaster();rc.setFromCamera(new T.Vector2(nx,ny),camera);const h=rc.intersectObjects(scene.children,true).find(h=>{const m=h.object as T.Mesh;if(!m.isMesh)return false;for(let q:T.Object3D|null=m;q;q=q.parent)if(!q.visible)return false;const mt=m.material as any;return !Array.isArray(mt)&&mt.visible!==false&&!mt.isShaderMaterial});if(!h)return null;let q:T.Object3D|null=h.object;const path:string[]=[];while(q){if(q.name)path.push(q.name);q=q.parent}const mt=(h.object as T.Mesh).material as any;return {path:path.slice(0,3),geo:(h.object as T.Mesh).geometry.type,color:mt.color?.getHexString?.(),point:h.point.toArray().map(v=>+v.toFixed(2)),dist:+h.distance.toFixed(2)}},
  // Camera check for tests: is Zip hidden, or is the lens inside something? (names say what)
  viewProbe:()=>{
    const rc=new T.Raycaster(),out:{blocked:string|null,near:number,names:string[],dist?:number,zipOnScreen?:boolean}={blocked:null,near:0,names:[]};
    const isZip=(o:T.Object3D|null)=>{for(let q=o;q;q=q.parent)if(q===zip)return true;return false};
    const solid=(h:T.Intersection)=>{const m=h.object as T.Mesh;if(!m.isMesh||isZip(m))return false;for(let q:T.Object3D|null=m;q;q=q.parent)if(!q.visible)return false;const mat=m.material as T.Material&{opacity?:number};if(Array.isArray(mat))return true;if(mat.visible===false||(mat as any).isShaderMaterial||/vl-sight/.test(mat.customProgramCacheKey?.()??''))return false;if(mat.transparent&&(mat.opacity??1)<.5)return false;if((mat as any).blending===T.AdditiveBlending)return false;return true};
    const label=(o:T.Object3D)=>{let q:T.Object3D|null=o;const path:string[]=[];while(q&&path.length<3){if(q.name)path.push(q.name);q=q.parent}const m=o as T.Mesh,mt=m.material as any;return (path.join('<')||'?')+':'+(m.geometry?.type??'')+':'+((m as any).isInstancedMesh?'inst':'')+':'+(mt?.type??'')+':'+(mt?.color?.getHexString?.()??'')+':'+(mt?.customProgramCacheKey?.()??'').slice(-24)};
    const chest=zip.position.clone().setY(zip.position.y+.9),d=chest.clone().sub(camera.position),len=d.length();
    rc.set(camera.position,d.normalize());rc.far=len-.35;
    const first=rc.intersectObjects(scene.children,true).find(solid);if(first)out.blocked=label(first.object);
    let n=0,hit=0;const names=new Set<string>();
    for(let i=0;i<5;i++)for(let j=0;j<7;j++){n++;rc.setFromCamera(new T.Vector2(-.8+i*.4,-.85+j*.28),camera);rc.far=1.1;const h=rc.intersectObjects(scene.children,true).find(solid);if(h){hit++;names.add(label(h.object))}}
    out.near=hit/n;out.names=[...names];(out as any).dist=+camera.position.distanceTo(chest).toFixed(2);{const pv=zip.position.clone().add(new T.Vector3(0,1.5,0)),tg=zip.position.clone().add(new T.Vector3(Math.sin(yaw)*Math.cos(pitch)*zoom,1.3+Math.sin(pitch)*zoom,Math.cos(yaw)*Math.cos(pitch)*zoom)),h=firstCameraHit(pv,tg.sub(pv),.15) as any;(out as any).camHit=h?(h.object?label(h.object):'grid')+'@'+(+h.distance).toFixed(2):null;(out as any).zoom=zoom;}(out as any).zipOnScreen=(()=>{const v=chest.clone().project(camera);return Math.abs(v.x)<.95&&v.y>-.98&&v.y<.9&&v.z<1})();return out;
  },
  // Hidden deterministic probe for collision/camera regression checks only.
  probeCamera:(x:number,z:number,probeYaw:number,probePitch:number,probeZoom:number)=>{
    const oldPosition=zip.position.clone(),oldCamera=camera.position.clone(),oldRotation=camera.quaternion.clone();
    const oldYaw=yaw,oldPitch=pitch,oldZoom=zoom,oldMoveYaw=facadeMoveYaw;
    zip.position.set(x,(standingY0+groundLift),z);yaw=probeYaw;pitch=probePitch;zoom=probeZoom;
    cameraUpdate(1);
    const result={position:zip.position.toArray(),camera:camera.position.toArray(),moveYaw:facadeMoveYaw};
    zip.position.copy(oldPosition);camera.position.copy(oldCamera);camera.quaternion.copy(oldRotation);
    yaw=oldYaw;pitch=oldPitch;zoom=oldZoom;facadeMoveYaw=oldMoveYaw;
    return result;
  }
}});

applyLens();zoom=startZoom();
cameraUpdate(1);updateLocation();
// First visit on Auto: measure the device behind the loading screen; a device
// that can hold High reloads straight into it (once; the result is kept).
if(paintedStudy&&gfx.choice==='auto'&&!autoWasMeasured()&&!paintedParams.get('capture')){
  const bench=await autoBenchmark(renderer,scene,camera);(window as any).__vlAutoBench=bench;
  if(bench.tier!==gfx.tier){const hv=(window as any).__vlVariant;if(hv)location.hash=`${hv}&auto=${bench.tier}`;else{const u=new URL(location.href);u.searchParams.set('auto',bench.tier);location.replace(u.toString())}await new Promise(()=>{});}
}
render();get('loading').hidden=true;
if(story&&!paintedParams.get('beat')&&paintedParams.get('title')!=='0'&&!paintedParams.get('capture')){const saved=save.load();title=buildTitle({host:appHost,resume:saved?PLACE[saved.at]:null,onContinue:()=>saved&&story.start(saved.at),onStart:()=>{save.clear();story.start()},onGraphics:()=>pause(true),reduced:()=>reduced})}else story?.start();
schedule();

