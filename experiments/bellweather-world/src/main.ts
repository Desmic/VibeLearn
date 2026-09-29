import * as T from 'three';
import { GardenWorld, START, WELL, LOOK, point, nearest } from './world';
import { Citizen } from './actors';
import { G, specializeUber } from './vendor/summer-cycle/render/materials';
import { leafAtlas } from './vendor/summer-cycle/render/leafAtlas';
import { SunShadow, PaddyReflection } from './vendor/summer-cycle/render/lightpasses';
import { Post } from './vendor/summer-cycle/render/post';
import { Profiler } from './vendor/summer-cycle/render/profiler';
import { TOD_GRADE } from './vendor/summer-cycle/render/todUniforms';

const el=<E extends HTMLElement>(id:string)=>document.getElementById(id) as E;
const action=el<HTMLButtonElement>('action'),speech=el('speech'),menu=el('menu'),hint=el('hint'),dest=el('destination');
const reducedInput=el<HTMLInputElement>('reduced'),economyInput=el<HTMLInputElement>('economy');
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches, economy=innerWidth<650;
reducedInput.checked=reduced;economyInput.checked=economy;
const params=new URLSearchParams(location.search);
const renderer=new T.WebGLRenderer({antialias:false,powerPreference:'high-performance',stencil:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,economy?1:1.35));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.info.autoReset=false;
el('world').appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','Walk through Bellweather');
const scene=new T.Scene();const camera=new T.PerspectiveCamera(53,innerWidth/innerHeight,.15,4200);
G.uLeafTex.value=leafAtlas(renderer);
G.uSunDir.value.set(-.65,.71,.30).normalize();G.uSkySun.value.copy(G.uSunDir.value);
G.uSunColor.value.set('#fff1dc');G.uShadowTint.value.set('#8797bf');
G.uSkyZenith.value.set('#326eb0');G.uSkyMid.value.set('#73bed9');G.uSkyHorizon.value.set('#deece8');
G.uFogColor.value.set('#a9cedc');G.uFogDensity.value=.0020;G.uHazeAmt.value=.18;
G.uRimColor.value.set('#ffdda6');TOD_GRADE.uGradeMul.value.setRGB(.98,1,1.02);TOD_GRADE.uSat.value=1.02;
G.uWorldTint.value.setRGB(1,1,1);
const world=new GardenWorld();scene.add(world.root);
const zip=new Citizen('zip','#e99446');zip.root.position.copy(START);scene.add(zip.root);
const shadow=new SunShadow(economy?1024:2048,39);
const reflection=new PaddyReflection(Math.floor(innerWidth*.4),Math.floor(innerHeight*.4));reflection.every=economy?4:2;
const post=new Post(renderer,innerWidth,innerHeight,{kuwahara:false,msaa:economy?0:2});post.bloom.strength=.12;post.bloom.radius=.4;post.bloom.threshold=.9;
const profiler=new Profiler(renderer,params.has('prof'));post.prof=profiler;
specializeUber(scene);
let activated=false,arrived=false,paused=false,guideTarget:number|null=null,mode:'wake'|'join'|'return'|null=null;
let yaw=0,pitch=.21,zoom=7.1,last=performance.now(),time=0,lastDraw=0,raf=0,frames=0,interacted=false,speechUntil=0;
const keys=new Set<string>(),stick=new T.Vector2(),temp=new T.Vector3(),lookAt=new T.Vector3(),desiredCamera=new T.Vector3(),ray=new T.Raycaster();
const intervals:number[]=[];let lastFrame=0,renderCost=0;
const captionPoint=new T.Vector3();let captionFollows:'mira'|'zip'='mira';
function announce(s:string){el('announcer').textContent=s}
function say(s:string,who:'mira'|'zip'='mira',duration=8){el('speaker').textContent=who==='mira'?'MIRA':'ZIP';el('line').textContent=s;captionFollows=who;speechUntil=time+duration;speech.hidden=false;announce(s)}
function pause(value:boolean){paused=value;keys.clear();stick.set(0,0);guideTarget=null;menu.hidden=!value;action.hidden=value||mode===null;el('menu-toggle').textContent=value?'▶':'Ⅱ';if(value)el('resume').focus();else{last=performance.now();schedule()}}
function schedule(){if(!raf&&!document.hidden&&!paused)raf=requestAnimationFrame(tick)}
el('menu-toggle').onclick=()=>pause(!paused);el('resume').onclick=()=>pause(false);
el('recenter').onclick=()=>{yaw=0;pitch=.21;zoom=7.1;updateCamera(1);renderOnce()};
function reset(){activated=false;arrived=false;mode=null;time=0;world.reset();zip.root.position.copy(START);zip.root.rotation.y=0;guideTarget=null;interacted=false;yaw=0;pitch=.21;zoom=7.1;keys.clear();stick.set(0,0);say('Zip! Come see the garden wake.');pause(false);updateCamera(1)}
el('restart').onclick=reset;
function travel(target:number){pause(false);if(reduced){zip.root.position.copy(point(target,-.8));guideTarget=null;updateCamera(1);announce(target<.6?(activated?'At the awake garden lightwell. Mira waits at the overlook.':'At the garden lightwell. Wake the garden when you are ready.'):'At the overlook.')}else{guideTarget=target;announce(target<.6?'Following the path to the garden lightwell.':'Following the garden path to the overlook.')}interacted=true}
el('guide').onclick=()=>travel(activated?.935:.43);
reducedInput.onchange=()=>{reduced=reducedInput.checked;G.uTime.value=reduced?0:time;if(reduced)world.update(0,time,activated,true)};
economyInput.onchange=()=>{economy=economyInput.checked;renderer.setPixelRatio(Math.min(devicePixelRatio,economy?1:1.35));post.setMsaa(economy?0:2);reflection.every=economy?4:2;resize()};
function activate(){
 if(paused)return;
 if(mode==='wake'&&!activated){activated=true;guideTarget=null;say('There it is. I’ll meet you by the water.', 'mira',8);announce('The crown opens. Light follows the water toward the overlook. Mira takes the path.');}
 else if(mode==='join'&&activated&&world.miraT>=.932){arrived=true;say('Our little piece of the sky. Stay a while?', 'mira',12)}
 else if(mode==='return'){travel(.43)}
}
action.onclick=activate;
window.addEventListener('keydown',e=>{
 if(e.code==='Escape'){e.preventDefault();if(!speech.hidden&&!paused){speech.hidden=true;speechUntil=0;return}pause(!paused);return}
 const focused=document.activeElement as HTMLElement|null;if(focused?.matches('button,input')&&['Space','Enter'].includes(e.code))return;
 if(paused)return;
 if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);guideTarget=null;interacted=true}
 if(e.code==='KeyE'&&!e.repeat){e.preventDefault();activate()}
});window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();stick.set(0,0);guideTarget=null});
document.addEventListener('visibilitychange',()=>{keys.clear();stick.set(0,0);if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;guideTarget=null}else{last=performance.now();schedule()}});
let drag:{id:number;x:number;y:number}|null=null;
renderer.domElement.addEventListener('pointerdown',e=>{if(paused)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;yaw-=(e.clientX-drag.x)*.004;pitch=T.MathUtils.clamp(pitch+(e.clientY-drag.y)*.0035,-.04,.75);drag.x=e.clientX;drag.y=e.clientY;interacted=true});
const endDrag=()=>drag=null;renderer.domElement.addEventListener('pointerup',endDrag);renderer.domElement.addEventListener('pointercancel',endDrag);
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();zoom=T.MathUtils.clamp(zoom+e.deltaY*.005,4,11)},{passive:false});
const stickEl=el('stick');let stickId:number|null=null;
function stickMove(e:PointerEvent){if(stickId!==e.pointerId)return;const b=stickEl.getBoundingClientRect();stick.set((e.clientX-b.left-b.width/2)/35,(e.clientY-b.top-b.height/2)/35);if(stick.length()>1)stick.normalize();(stickEl.firstElementChild as HTMLElement).style.transform=`translate(${stick.x*28}px,${stick.y*28}px)`;guideTarget=null;interacted=true}
stickEl.addEventListener('pointerdown',e=>{stickId=e.pointerId;stickEl.setPointerCapture(e.pointerId);stickMove(e)});stickEl.addEventListener('pointermove',stickMove);
function stickRelease(){stickId=null;stick.set(0,0);(stickEl.firstElementChild as HTMLElement).style.transform=''}stickEl.addEventListener('pointerup',stickRelease);stickEl.addEventListener('pointercancel',stickRelease);
function move(dt:number){
 const old=zip.root.position.clone();let dx=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+stick.x;
 let dz=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'))+stick.y;
 if(guideTarget!==null){const n=nearest(zip.root.position);const target=point(guideTarget,-.8);if(zip.root.position.distanceTo(target)<.22){const reachedLightwell=guideTarget<.6;guideTarget=null;announce(reachedLightwell?'You reached the lightwell.':'You reached the overlook.');return 0}
  const stepT=T.MathUtils.clamp(n.t+Math.sign(guideTarget-n.t)*.025,Math.min(n.t,guideTarget),Math.max(n.t,guideTarget));const d=point(stepT,-.8).sub(zip.root.position);dx=d.x;dz=d.z;
 }else{const x=dx*Math.cos(yaw)+dz*Math.sin(yaw);dz=-dx*Math.sin(yaw)+dz*Math.cos(yaw);dx=x}
 const len=Math.hypot(dx,dz);if(len>.01){dx/=len;dz/=len;const dist=2.8*dt;
  // Small substeps and axis sliding prevent cutting through coping or furniture.
  for(let i=0,n=Math.max(1,Math.ceil(dist/.08));i<n;i++){const next=zip.root.position.clone().add(new T.Vector3(dx*dist/n,0,dz*dist/n));if(world.walkable(next))zip.root.position.copy(next);else{next.copy(zip.root.position);next.x+=dx*dist/n;if(world.walkable(next))zip.root.position.copy(next);next.copy(zip.root.position);next.z+=dz*dist/n;if(world.walkable(next))zip.root.position.copy(next)}}
  const targetAngle=Math.atan2(-dx,-dz);let d=(targetAngle-zip.root.rotation.y+Math.PI*3)%(Math.PI*2)-Math.PI;zip.root.rotation.y+=d*Math.min(1,dt*12);
 }
 return zip.root.position.distanceTo(old)/Math.max(dt,.001);
}
function updateCamera(dt:number){
 lookAt.copy(zip.root.position).add(new T.Vector3(1.0*Math.cos(yaw),1.65,-1.0*Math.sin(yaw)));
 desiredCamera.copy(lookAt).add(new T.Vector3(Math.sin(yaw)*Math.cos(pitch)*zoom,Math.sin(pitch)*zoom,Math.cos(yaw)*Math.cos(pitch)*zoom));
 temp.subVectors(desiredCamera,lookAt);const distance=temp.length();ray.set(lookAt,temp.normalize());ray.far=distance;
 const hit=ray.intersectObjects(world.solid,false)[0];if(hit&&hit.distance<distance)desiredCamera.copy(lookAt).addScaledVector(temp,Math.max(1.3,hit.distance-.3));desiredCamera.y=Math.max(1.6,desiredCamera.y);
 camera.position.lerp(desiredCamera,Math.min(1,dt*9));camera.lookAt(lookAt);camera.updateMatrixWorld();
}
function project(p:T.Vector3){const q=p.clone().project(camera);return{x:(q.x*.5+.5)*innerWidth,y:(-.5*q.y+.5)*innerHeight,visible:q.z<1&&q.z> -1&&Math.abs(q.x)<.94&&Math.abs(q.y)<.92}}
function place(node:HTMLElement,p:T.Vector3,clamp=true){const q=project(p);const safeHalf=node===speech?Math.min(innerWidth/2-15,innerWidth<=600?136:168):node===action?Math.min(innerWidth/2-12,152):110;const x=clamp?T.MathUtils.clamp(q.x,safeHalf,innerWidth-safeHalf):q.x,y=clamp?T.MathUtils.clamp(q.y,100,innerHeight-150):q.y;node.style.left=`${x}px`;node.style.top=`${y}px`;return q.visible}
function ui(){
 const dWell=zip.root.position.distanceTo(WELL),dLook=zip.root.position.distanceTo(LOOK);mode=null;
 if(!activated&&dWell<3.9)mode='wake';else if(activated&&dLook<3.1&&world.miraT>=.932)mode=arrived?'return':'join';
 action.hidden=mode===null;if(mode){action.querySelector('span')!.textContent=mode==='wake'?'Wake the garden':mode==='join'?'Join Mira':'Return to the garden';place(action,(mode==='wake'?WELL:world.mira.root.position).clone().add(new T.Vector3(0,1.8,0)))}
 dest.hidden=!!mode;const target=activated?LOOK:world.mira.root.position;if(!mode)place(dest,target.clone().add(new T.Vector3(0,2.8,0)));
 if(!speech.hidden){if(time>speechUntil)speech.hidden=true;else{captionPoint.copy(captionFollows==='mira'?world.mira.root.position:zip.root.position).y+=3.05;place(speech,captionPoint)}}
 hint.style.opacity=interacted?'0':'1';el('guide').textContent=activated?'Guided route to the overlook':'Guided route to Mira';
}
function renderOnce(){
 renderer.info.reset();profiler.poll();profiler.begin('shadow',renderer);shadow.update(renderer,scene,zip.root.position.clone().add(new T.Vector3(0,0,-12)));profiler.end('shadow',renderer);
 profiler.begin('reflection',renderer);reflection.update(renderer,scene,camera,.055);profiler.end('reflection',renderer);post.render(scene,camera,time);frames++;
}
function tick(now:number){raf=0;if(paused||document.hidden)return;const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
 // Cap scene work to 60 Hz instead of spending GPU on the laptop panel's excess refresh.
 if(now-lastDraw<15){schedule();return}const elapsed=Math.min(.05,(now-lastDraw)/1000||dt);lastDraw=now;time+=elapsed;
 if(lastFrame&&intervals.length<1500)intervals.push(now-lastFrame);lastFrame=now;
 const start=performance.now();const speed=move(elapsed);zip.update(elapsed,speed,time,reduced);world.update(elapsed,time,activated,reduced);G.uTime.value=reduced?0:time;
 updateCamera(elapsed);ui();renderOnce();renderCost=performance.now()-start;schedule();
}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();post.setSize(innerWidth,innerHeight);reflection.setSize(Math.floor(innerWidth*.4),Math.floor(innerHeight*.4));updateCamera(1);ui();if(paused)renderOnce()}
window.addEventListener('resize',resize);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pause(true);el('menu-title').textContent='The view needs a reload.';announce('Graphics context lost. Reload this disposable scene.');});
// Diagnostics are observation-only; no hidden command or state-mutation surface.
Object.defineProperty(window,'__bellweather',{value:{snapshot:()=>({activated,arrived,paused,guided:guideTarget!==null,reduced,economy,position:zip.root.position.toArray(),mira:world.mira.root.position.toArray(),miraT:world.miraT,mode,frames,frameIntervals:intervals.slice(-300),cpuFrameMs:renderCost,draws:post.sceneCalls,triangles:post.sceneTris,profile:profiler.report(),design:'0f1b1488ed5ed941b082b045ea9c61ccb8e9d968ae376f3759803bcfb40fd614'})},writable:false});
reset();el('loading').hidden=true;schedule();
