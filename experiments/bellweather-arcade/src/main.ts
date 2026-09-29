import * as T from 'three';

import * as arcade from './world';
import * as facade from './facade';
const facadeStudy=new URLSearchParams(location.search).get('study')==='facade';
const daylightStudy=facadeStudy&&new URLSearchParams(location.search).get('finish')==='daylight';
const {buildWorld,arrival,route,cameraSolids,nearestRoute,walkable}=facadeStudy?facade:arcade;

import './style.css';

import { buildZip } from './zip';
import { buildCourierZip } from './zip-courier';
import { outdoorReflection } from './lighting';


const get=(id:string)=>document.getElementById(id)!;

const worldElement=get('world');

const scene=new T.Scene();scene.background=new T.Color('#96c9e1');scene.fog=new T.FogExp2('#c1deea',.0028);

const camera=new T.PerspectiveCamera(facadeStudy?56:52,innerWidth/innerHeight,.08,650);

const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.domElement.setAttribute('aria-label','Explore the Bellweather garden arcade');worldElement.appendChild(renderer.domElement);

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
try { await buildWorld(scene); }
catch(error){get('loading').textContent='The study could not load its asset. Reload to retry.';throw error;}

// All camera solids in this study are static. Cache conservative world bounds
// so each orbit ray only tests detailed geometry it could actually reach.
const cameraQueryBounds=cameraSolids.map(object=>({object,bounds:new T.Box3().setFromObject(object)}));
let cameraGeometryRevision=0;



const zip=new URLSearchParams(location.search).get('character')==='courier'?buildCourierZip():buildZip();
const standingY=facadeStudy ? .130-new T.Box3().setFromObject(zip).min.y : .13;
zip.position.copy(arrival).setY(standingY);scene.add(zip);

const contact=new T.Mesh(new T.CircleGeometry(.41,24),new T.MeshBasicMaterial({color:'#213957',transparent:true,opacity:.22,depthWrite:false}));contact.rotation.x=-Math.PI/2;const contactY=facadeStudy ? .131 : .125;contact.position.set(arrival.x,contactY,arrival.z);scene.add(contact);
if(facadeStudy){const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const c=canvas.getContext('2d')!,g=c.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'white');g.addColorStop(.35,'#777');g.addColorStop(1,'black');c.fillStyle=g;c.fillRect(0,0,64,64);contact.material.alphaMap=new T.CanvasTexture(canvas);contact.material.opacity=.28;}

const arrivalPitch=.20,arrivalZoom=6.0;
let yaw=0,pitch=arrivalPitch,zoom=arrivalZoom,facadeMoveYaw=0,last=performance.now(),raf=0,paused=false,guideTargetT:number|null=null,reduced=false,elapsed=0,moveAmount=0,frames=0;let positionText='Garden arcade';

const keys=new Set<string>();const held=new Set<string>();const desired=new T.Vector3(),look=new T.Vector3(),cameraDelta=new T.Vector3(),ray=new T.Raycaster();
const cameraBoxHit=new T.Vector3(),cameraCandidates:T.Object3D[]=[];
const cameraMetrics={updates:0,updateMs:0,queries:0,queryMs:0,searches:0,alternatives:0};
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
  const hit=ray.intersectObjects(cameraCandidates,false).find(hit=>hit.distance>minDistance);
  cameraMetrics.queries++;cameraMetrics.queryMs+=performance.now()-started;
  return hit;
}

const announce=(s:string)=>{get('announcer').textContent=s};

function setPlace(s:string){if(positionText!==s){positionText=s;get('place').textContent=s;announce(s)}}

function updateLocation(){const n=nearestRoute(zip.position);if(facadeStudy){setPlace(n.t>.82?'Inner courtyard':n.t>.34?'Conservatory entrance':'Sunward approach');get('route').innerHTML=n.t>.87?'Return to entrance <span>↙</span>':'Walk through entrance <span>↗</span>';return}setPlace(n.t>.82?'Overlook pavilion':n.t>.34?'Garden lightwell':'Garden arcade');get('route').innerHTML=n.t>.87?'Return to arcade <span>↙</span>':'Walk to overlook <span>↗</span>'}

function cameraUpdate(dt:number){
  const started=performance.now();
  if(cameraQueryBounds.length!==cameraSolids.length)invalidateCameraGeometry();
  if(facadeStudy){
    const pivot=zip.position.clone().add(new T.Vector3(0,1.5,0));
    const orbitAt=(angle:number)=>zip.position.clone().add(new T.Vector3(
      Math.sin(angle)*Math.cos(pitch)*zoom,
      1.3+Math.sin(pitch)*zoom,
      Math.cos(angle)*Math.cos(pitch)*zoom
    ));
    const clearance=(target:T.Vector3,includeBody=false)=>{
      const toCamera=target.clone().sub(pivot),side=new T.Vector3(toCamera.z,0,-toCamera.x).normalize().multiplyScalar(.48);
      let available=toCamera.length();
      for(const offset of includeBody?[-1,0,1]:[0]){
        const origin=pivot.clone().addScaledVector(side,offset);
        cameraDelta.subVectors(target,origin);
        const obstruction=firstCameraHit(origin,cameraDelta,.15);
        if(obstruction)available=Math.min(available,Math.max(.45,obstruction.distance-.30));
      }
      return available;
    };
    // If the requested orbit meets a wall, keep a usable camera distance by
    // stepping to the nearest clear side of that orbit, without changing input yaw.
    const comfort=Math.min(4,zoom*.75);
    const reusable=cacheOrbit&&orbitCache.valid&&orbitCache.geometryRevision===cameraGeometryRevision&&
      orbitCache.position.equals(zip.position)&&orbitCache.yaw===yaw&&orbitCache.pitch===pitch&&orbitCache.zoom===zoom;
    let selected:T.Vector3,available:number;
    if(reusable){selected=orbitCache.selected;available=orbitCache.available}
    else {
      selected=orbitAt(yaw);available=clearance(selected);let best=available;
      if(available<comfort){
        cameraMetrics.searches++;
        search:for(let step=1;step<=14;step++)for(const sign of [-1,1]){
          cameraMetrics.alternatives++;
          const candidate=orbitAt(yaw+sign*step*.15),open=clearance(candidate,true);
          if(open>best){selected=candidate;available=open;best=open}
          if(open>=comfort){selected=candidate;available=open;break search}
        }
      }
      if(cacheOrbit){orbitCache.valid=true;orbitCache.position.copy(zip.position);orbitCache.yaw=yaw;orbitCache.pitch=pitch;orbitCache.zoom=zoom;orbitCache.geometryRevision=cameraGeometryRevision;orbitCache.selected.copy(selected);orbitCache.available=available}
    }
    cameraDelta.subVectors(selected,pivot);
    const selectedDistance=cameraDelta.length();
    desired.copy(pivot).addScaledVector(cameraDelta.normalize(),Math.min(available,selectedDistance));
    camera.position.lerp(desired,Math.min(1,dt*10));
    const currentClearance=clearance(camera.position),currentDistance=camera.position.distanceTo(pivot);
    if(currentClearance<currentDistance-.01){
      if(currentClearance<2.2&&available>=comfort)camera.position.copy(desired);
      else camera.position.copy(pivot).addScaledVector(cameraDelta.subVectors(camera.position,pivot).normalize(),currentClearance);
    }
    const horizontalX=camera.position.x-zip.position.x,horizontalZ=camera.position.z-zip.position.z;
    if(Math.hypot(horizontalX,horizontalZ)>.5)facadeMoveYaw=Math.atan2(horizontalX,horizontalZ);
    // Frame the architecture above the player without lowering the physical
    // camera behind the courtyard's low walls when the player turns around.
    look.copy(pivot).add(new T.Vector3(0,.5,0));camera.lookAt(look);
    cameraMetrics.updates++;cameraMetrics.updateMs+=performance.now()-started;return;
  }
  look.copy(zip.position).add(new T.Vector3(0,1.8,-3.2).applyAxisAngle(new T.Vector3(0,1,0),yaw));
  desired.copy(zip.position).add(new T.Vector3(Math.sin(yaw)*Math.cos(pitch)*zoom,1.3+Math.sin(pitch)*zoom,Math.cos(yaw)*Math.cos(pitch)*zoom));
  cameraDelta.subVectors(desired,look);
  const hit=firstCameraHit(look,cameraDelta,.5);
  if(hit&&hit.distance<cameraDelta.length())desired.copy(look).addScaledVector(cameraDelta.normalize(),Math.max(1.25,hit.distance-.28));
  desired.y=Math.max(1.5,desired.y);camera.position.lerp(desired,Math.min(1,dt*10));camera.lookAt(look);
  cameraMetrics.updates++;cameraMetrics.updateMs+=performance.now()-started;
}

function move(dt:number){let dx=Number(keys.has('KeyD')||keys.has('ArrowRight')||held.has('right'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')||held.has('left')),dz=Number(keys.has('KeyS')||keys.has('ArrowDown')||held.has('back'))-Number(keys.has('KeyW')||keys.has('ArrowUp')||held.has('forward'));if(guideTargetT!==null){const targetT=guideTargetT,n=nearestRoute(zip.position);const delta=route.getPoint(T.MathUtils.clamp(n.t+Math.sign(targetT-n.t)*.028,0,1)).sub(zip.position);dx=delta.x;dz=delta.z;if(zip.position.distanceTo(route.getPoint(targetT))<.38){guideTargetT=null;dx=dz=0;announce(facadeStudy?(targetT===0?'Returned to the conservatory entrance.':'Reached the inner courtyard.'):(targetT===0?'Returned to the garden arcade.':'Reached the overlook pavilion.'))}}else{const bearing=facadeStudy?facadeMoveYaw:yaw,x=dx*Math.cos(bearing)+dz*Math.sin(bearing);dz=-dx*Math.sin(bearing)+dz*Math.cos(bearing);dx=x}const length=Math.hypot(dx,dz);moveAmount=0;if(length>.05){dx/=length;dz/=length;const old=zip.position.clone(),dist=3.15*dt,n=Math.max(1,Math.ceil(dist/.08));for(let i=0;i<n;i++){const p=zip.position.clone().add(new T.Vector3(dx*dist/n,0,dz*dist/n));if(walkable(p))zip.position.copy(p);else{p.copy(zip.position);p.x+=dx*dist/n;if(walkable(p))zip.position.copy(p);p.copy(zip.position);p.z+=dz*dist/n;if(walkable(p))zip.position.copy(p)}}const ang=Math.atan2(-dx,-dz);let a=(ang-zip.rotation.y+Math.PI*3)%(Math.PI*2)-Math.PI;zip.rotation.y+=a*Math.min(1,dt*10);moveAmount=zip.position.distanceTo(old);if(moveAmount>0){get('hint').style.opacity='0';updateLocation()}}contact.position.set(zip.position.x,contactY,zip.position.z);if(!reduced&&!facadeStudy)zip.position.y=standingY+Math.sin(elapsed*12)*Math.min(.035,moveAmount*.3);else zip.position.y=standingY}

const lastShadowTransform=new T.Vector4(Infinity,Infinity,Infinity,Infinity);
function render(){
  // Camera orbit does not change light-space shadows. Refresh when the sole
  // moving caster changes position/heading, including route, restart and reset.
  // Any future animated caster/light must explicitly invalidate this cache.
  if(daylightStudy){
    const p=zip.position;
    if(lastShadowTransform.x!==p.x||lastShadowTransform.y!==p.y||lastShadowTransform.z!==p.z||lastShadowTransform.w!==zip.rotation.y){
      renderer.shadowMap.needsUpdate=true;lastShadowTransform.set(p.x,p.y,p.z,zip.rotation.y);
    }
  }
  renderer.render(scene,camera);frames++;
}

function tick(now:number){raf=0;if(paused||document.hidden)return;const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;elapsed+=dt;move(dt);cameraUpdate(dt);render();schedule()}

function schedule(){if(!raf&&!paused&&!document.hidden)raf=requestAnimationFrame(tick)}

function pause(v:boolean){paused=v;keys.clear();held.clear();guideTargetT=null;get('controls').inert=v;get('menu').hidden=!v;get('pause').textContent=v?'▶':'Ⅱ';if(v){if(raf)cancelAnimationFrame(raf);raf=0;get('resume').focus()}else{last=performance.now();schedule()}}

get('pause').addEventListener('click',()=>pause(!paused));get('resume').addEventListener('click',()=>pause(false));get('restart').addEventListener('click',()=>{zip.position.copy(arrival).setY(standingY);zip.rotation.y=0;yaw=0;pitch=arrivalPitch;zoom=arrivalZoom;pause(false);updateLocation();cameraUpdate(1);render();announce(facadeStudy?'Returned to the conservatory entrance.':'Returned to the garden arcade.')});get('recenter').addEventListener('click',()=>{yaw=0;pitch=arrivalPitch;zoom=arrivalZoom;cameraUpdate(1);if(!document.hidden)render()});get('reduced').addEventListener('change',e=>{reduced=(e.target as HTMLInputElement).checked});get('route').addEventListener('click',()=>{if(paused)return;guideTargetT=nearestRoute(zip.position).t>.87?0:.96;announce(facadeStudy?(guideTargetT===0?'Walking back to the entrance.':'Walking to the inner courtyard.'):(guideTargetT===0?'Walking back to the arcade.':'Walking to the overlook pavilion.'))});

window.addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();pause(!paused);return}if(paused)return;const focused=document.activeElement as HTMLElement|null;if(focused?.matches('input'))return;if(focused?.matches('button')&&['Space','Enter'].includes(e.code))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);guideTargetT=null}});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();held.clear();guideTargetT=null});document.addEventListener('visibilitychange',()=>{keys.clear();held.clear();guideTargetT=null;if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0}else{last=performance.now();schedule()}});

let dragging:{id:number,x:number,y:number}|null=null;renderer.domElement.addEventListener('pointerdown',e=>{if(paused)return;dragging={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId)});renderer.domElement.addEventListener('pointermove',e=>{if(!dragging||e.pointerId!==dragging.id)return;yaw-=(e.clientX-dragging.x)*.004;pitch=T.MathUtils.clamp(pitch+(e.clientY-dragging.y)*.0035,-.13,.9);dragging.x=e.clientX;dragging.y=e.clientY;get('hint').style.opacity='0'});const stopDrag=()=>dragging=null;renderer.domElement.addEventListener('pointerup',stopDrag);renderer.domElement.addEventListener('pointercancel',stopDrag);renderer.domElement.addEventListener('wheel',e=>{if(paused)return;e.preventDefault();zoom=T.MathUtils.clamp(zoom+e.deltaY*.006,3.7,10.5)},{passive:false});for(const b of document.querySelectorAll<HTMLButtonElement>('[data-dir]')){const dir=b.dataset.dir!;b.addEventListener('pointerdown',e=>{if(paused)return;b.setPointerCapture(e.pointerId);held.add(dir);guideTargetT=null});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>held.delete(dir))}

window.addEventListener('resize',()=>{renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();cameraUpdate(1);if(paused&&!document.hidden)render()});renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pause(true);get('menu').querySelector('p')!.textContent='The view needs a reload.';announce('Graphics context lost. Reload this disposable study.')});

Object.defineProperty(window,'__arcade',{value:{
  snapshot:()=>({study:facadeStudy?'facade':'arcade',standingY,contactY,position:zip.position.toArray(),routeT:nearestRoute(zip.position).t,paused,guided:guideTargetT!==null,guideTargetT,reduced,frames,draws:renderer.info.render.calls,triangles:renderer.info.render.triangles,cameraSolids:cameraSolids.length,camera:camera.position.toArray(),cameraMetrics:{...cameraMetrics},place:positionText}),
  invalidateCameraGeometry,
  // Hidden deterministic probe for collision/camera regression checks only.
  probeCamera:(x:number,z:number,probeYaw:number,probePitch:number,probeZoom:number)=>{
    const oldPosition=zip.position.clone(),oldCamera=camera.position.clone(),oldRotation=camera.quaternion.clone();
    const oldYaw=yaw,oldPitch=pitch,oldZoom=zoom,oldMoveYaw=facadeMoveYaw;
    zip.position.set(x,standingY,z);yaw=probeYaw;pitch=probePitch;zoom=probeZoom;
    cameraUpdate(1);
    const result={position:zip.position.toArray(),camera:camera.position.toArray(),moveYaw:facadeMoveYaw};
    zip.position.copy(oldPosition);camera.position.copy(oldCamera);camera.quaternion.copy(oldRotation);
    yaw=oldYaw;pitch=oldPitch;zoom=oldZoom;facadeMoveYaw=oldMoveYaw;
    return result;
  }
}});

cameraUpdate(1);updateLocation();render();get('loading').hidden=true;schedule();

