/* Reusable Three.js runtime for generated story/fantasy worlds.
   World modules own story-specific geometry/state; this file owns lifecycle,
   renderer policy, resource cleanup, resize, reduced-motion, camera motion and frame scheduling. */
'use strict';
import * as THREE from './vendor/three.module.min.js';

export {THREE};
export const STORY3D_RUNTIME_VERSION='1';

const noopCameraRig=()=>({setShot(){},update(){},snap(){},getShot(){return null;}});
const noopRuntime=(error='WebGL unavailable')=>({
  available:false,error:String(error),scene:null,camera:null,renderer:null,canvas:null,
  trackGeometry:g=>g,trackMaterial:m=>m,group(){return null;},mesh(){return null;},
  material(){return null;},emissive(){return null;},createCameraRig:noopCameraRig,
  setDraw(){},requestDraw(){},setPaused(){},replay(){},
  stats(){return{available:false,error:String(error),runtimeVersion:STORY3D_RUNTIME_VERSION}},dispose(){}
});

export function createThreeStoryRuntime(host,{
  canvasClass='story3d-canvas',
  reducedMotion=false,
  clearColor=0x06131e,
  exposure=1.1,
  pixelRatioCap=1.5,
  fov=45,
  near=.1,
  far=120,
  powerPreference='low-power',
  onContextLost=()=>{},
  onContextRestored=()=>{},
}={}){
  if(!host) return noopRuntime('Missing story-world host');
  const canvas=document.createElement('canvas');
  canvas.className=canvasClass;
  canvas.setAttribute('data-story3d-runtime',STORY3D_RUNTIME_VERSION);
  canvas.setAttribute('aria-hidden','true');
  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference});
  }catch(error){return noopRuntime(error);}

  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,pixelRatioCap));
  renderer.setClearColor(clearColor);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=exposure;

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(fov,1,near,far);
  const geometries=new Set(),materials=new Set(),disposers=[];
  let frame=0,draw=null,disposed=false,paused=false,contextLost=false,last=performance.now();

  const trackGeometry=g=>(g&&geometries.add(g),g);
  const trackMaterial=m=>(m&&materials.add(m),m);
  const material=(color,opts={})=>trackMaterial(new THREE.MeshStandardMaterial({color,roughness:.78,metalness:.07,...opts}));
  const emissive=(color,intensity=1,opts={})=>trackMaterial(new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.5,...opts}));
  const group=(parent=scene)=>{const g=new THREE.Group();parent?.add(g);return g;};
  const mesh=(parent,geometry,mat,pos=[0,0,0],scale=[1,1,1])=>{const o=new THREE.Mesh(geometry,mat);o.position.set(...pos);o.scale.set(...scale);parent?.add(o);return o;};

  function resolveShot(shot,aspect,portraitMaxAspect){
    if(!shot) throw new TypeError('Camera shot is required');
    const selected=(shot.portrait||shot.landscape)
      ? (aspect<portraitMaxAspect?(shot.portrait||shot.landscape):(shot.landscape||shot.portrait))
      : shot;
    if(!Array.isArray(selected?.p)||selected.p.length!==3||!Array.isArray(selected?.t)||selected.t.length!==3){
      throw new TypeError('Camera shot must provide p[3] and t[3]');
    }
    return selected;
  }
  function createCameraRig(initialShot,{portraitMaxAspect=.72,responsiveness=.001}={}){
    let shot=initialShot,initialized=false;
    const position=new THREE.Vector3(),lookAt=new THREE.Vector3(),targetPosition=new THREE.Vector3(),targetLookAt=new THREE.Vector3();
    const apply=(aspect,dt=0,snap=false)=>{
      const target=resolveShot(shot,aspect,portraitMaxAspect);
      targetPosition.fromArray(target.p);targetLookAt.fromArray(target.t);
      if(!initialized||snap){position.copy(targetPosition);lookAt.copy(targetLookAt);initialized=true;}
      else{
        const ease=1-Math.pow(responsiveness,Math.max(0,dt));
        position.lerp(targetPosition,ease);lookAt.lerp(targetLookAt,ease);
      }
      camera.position.copy(position);camera.lookAt(lookAt);
    };
    return{
      setShot(next,{snap=false,aspect=camera.aspect||1}={}){shot=next;if(snap)apply(aspect,0,true);requestDraw();},
      update({dt=0,aspect=camera.aspect||1,snap=false}={}){apply(aspect,dt,snap);},
      snap(aspect=camera.aspect||1){apply(aspect,0,true);requestDraw();},
      getShot(){return shot;}
    };
  }

  function syncViewport(){
    const w=Math.max(1,canvas.clientWidth||host.clientWidth||1),h=Math.max(1,canvas.clientHeight||host.clientHeight||1);
    const pr=renderer.getPixelRatio();
    if(canvas.width!==Math.round(w*pr)||canvas.height!==Math.round(h*pr)) renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
    return {width:w,height:h,aspect:w/h};
  }
  function tick(time){
    frame=0;
    if(disposed||contextLost||!host.isConnected)return;
    const viewport=syncViewport(),dt=Math.min(.04,Math.max(0,(time-last)/1000));last=time;
    draw?.({time,dt,...viewport,animate:!paused&&!reducedMotion,THREE,scene,camera,renderer});
    renderer.render(scene,camera);
    if(!paused&&!reducedMotion)frame=requestAnimationFrame(tick);
  }
  function requestDraw(){if(!frame&&!disposed&&!contextLost)frame=requestAnimationFrame(tick);}
  function setDraw(fn){draw=typeof fn==='function'?fn:null;requestDraw();}
  function setPaused(value){paused=Boolean(value);last=performance.now();requestDraw();}

  const resize=new ResizeObserver(requestDraw);resize.observe(host);
  const contextLostHandler=e=>{e.preventDefault();contextLost=true;cancelAnimationFrame(frame);frame=0;onContextLost({host,canvas});};
  const contextRestoredHandler=()=>{contextLost=false;last=performance.now();onContextRestored({host,canvas});requestDraw();};
  canvas.addEventListener('webglcontextlost',contextLostHandler,false);
  canvas.addEventListener('webglcontextrestored',contextRestoredHandler,false);
  host.prepend(canvas);

  return{
    available:true,THREE,scene,camera,renderer,canvas,reducedMotion,
    trackGeometry,trackMaterial,material,emissive,group,mesh,createCameraRig,
    addDisposer(fn){if(typeof fn==='function')disposers.push(fn);return fn;},
    setDraw,requestDraw,setPaused,replay(){last=performance.now();requestDraw();},
    stats(){return{available:true,runtimeVersion:STORY3D_RUNTIME_VERSION,revision:THREE.REVISION,drawCalls:renderer.info.render.calls,pixelRatio:renderer.getPixelRatio(),paused,reducedMotion,contextLost};},
    dispose(){
      if(disposed)return;disposed=true;cancelAnimationFrame(frame);resize.disconnect();
      canvas.removeEventListener('webglcontextlost',contextLostHandler);canvas.removeEventListener('webglcontextrestored',contextRestoredHandler);
      while(disposers.length){try{disposers.pop()();}catch(_){}}
      geometries.forEach(g=>g.dispose?.());materials.forEach(m=>m.dispose?.());renderer.dispose();canvas.remove();
    }
  };
}
