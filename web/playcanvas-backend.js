/* PlayCanvas Engine backend for engine-neutral WorldSpec.
   Presentation only: server commands and assessment/evidence remain authoritative. */
'use strict';
import * as pc from './vendor/playcanvas.mjs';
import {validateWorldSpec} from './world-spec.js';

export const PLAYCANVAS_ENGINE_VERSION='2.22.1';
export const PLAYCANVAS_BACKEND_VERSION='1';

function unavailable(error){
  const message=error instanceof Error?error.message:String(error);
  return {available:false,error:message,setState(){},applyPatch(){},setPaused(){},replay(){},stats(){return{available:false,error:message,engine:'playcanvas'};},dispose(){}};
}
function color(hex,fallback='#ffffff'){
  const raw=(typeof hex==='string'?hex:fallback).replace('#','');
  const value=parseInt(raw.length===3?raw.split('').map(x=>x+x).join(''):raw,16);
  return new pc.Color(((value>>16)&255)/255,((value>>8)&255)/255,(value&255)/255);
}
function setTransform(entity,transform={}){
  if(transform.position)entity.setLocalPosition(...transform.position);
  if(transform.rotation)entity.setLocalEulerAngles(...transform.rotation);
  if(transform.scale)entity.setLocalScale(...transform.scale);
}
function makeMaterial(def={}){
  const material=new pc.StandardMaterial();
  material.diffuse=color(def.diffuse,'#ffffff');
  if(def.emissive){
    material.emissive=color(def.emissive,'#000000');
    material.emissiveIntensity=Number.isFinite(def.emissiveIntensity)?def.emissiveIntensity:1;
  }
  material.metalness=Number.isFinite(def.metalness)?def.metalness:0;
  material.gloss=Number.isFinite(def.gloss)?def.gloss:.35;
  if(Number.isFinite(def.opacity)&&def.opacity<1){
    material.opacity=def.opacity;
    material.blendType=pc.BLEND_NORMAL;
    material.depthWrite=false;
  }
  material.update();
  return material;
}

class PlayCanvasWorld {
  constructor(host,spec,{reducedMotion=false,pixelRatioCap=1.5}={}){
    this.host=host;
    this.spec=validateWorldSpec(spec);
    this.reducedMotion=Boolean(reducedMotion);
    this.paused=false;
    this.state=null;
    this.entities=new Map();
    this.baseline=new Map();
    this.materials=new Map();
    this.elapsed=0;
    this.disposed=false;

    const canvas=document.createElement('canvas');
    canvas.className='play-canvas-webgl vl-playcanvas-engine';
    canvas.dataset.engine='playcanvas';
    canvas.dataset.playcanvasEngine=PLAYCANVAS_ENGINE_VERSION;
    canvas.dataset.playcanvasBackend=PLAYCANVAS_BACKEND_VERSION;
    canvas.setAttribute('aria-hidden','true');
    host.prepend(canvas);
    this.canvas=canvas;

    const dpr=Math.min(window.devicePixelRatio||1,pixelRatioCap);
    const app=new pc.Application(canvas,{
      graphicsDeviceOptions:{antialias:true,alpha:false,powerPreference:'high-performance'}
    });
    this.app=app;
    app.graphicsDevice.maxPixelRatio=dpr;
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    app.start();

    if(this.spec.environment?.ambient){
      app.scene.ambientLight=color(this.spec.environment.ambient);
    }

    for(const [name,definition] of Object.entries(this.spec.materials)){
      this.materials.set(name,makeMaterial(definition));
    }

    this.root=new pc.Entity(`world:${this.spec.id}`);
    app.root.addChild(this.root);
    for(const definition of this.spec.entities)this._createEntity(definition);
    for(const definition of this.spec.lights||[])this._createLight(definition);

    this.camera=new pc.Entity('vibelearn-camera');
    this.camera.addComponent('camera',{
      clearColor:color(this.spec.environment?.clearColor,'#071824'),
      nearClip:.1,farClip:250
    });
    app.root.addChild(this.camera);

    this._resize=()=>app.resizeCanvas();
    this.resizeObserver=new ResizeObserver(this._resize);
    this.resizeObserver.observe(host);
    this._resize();

    this._update=dt=>this._tick(dt);
    app.on('update',this._update);
    const initial=Object.keys(this.spec.states||{})[0];
    if(initial)this.setState(initial);
    else this.setCamera(Object.keys(this.spec.cameras)[0]);
  }

  _createEntity(def){
    const entity=new pc.Entity(def.id);
    entity.enabled=def.enabled!==false;
    if(def.primitive){
      entity.addComponent('render',{type:def.primitive});
      if(def.material)entity.render.material=this.materials.get(def.material);
      entity.render.castShadows=def.castShadows!==false;
      entity.render.receiveShadows=def.receiveShadows!==false;
    }
    setTransform(entity,def);
    const parent=def.parent?this.entities.get(def.parent):this.root;
    if(!parent)throw new Error(`WorldSpec parent ${def.parent} must appear before ${def.id}`);
    parent.addChild(entity);
    this.entities.set(def.id,entity);
    this.baseline.set(def.id,{
      enabled:entity.enabled,
      position:[entity.getLocalPosition().x,entity.getLocalPosition().y,entity.getLocalPosition().z],
      rotation:[entity.getLocalEulerAngles().x,entity.getLocalEulerAngles().y,entity.getLocalEulerAngles().z],
      scale:[entity.getLocalScale().x,entity.getLocalScale().y,entity.getLocalScale().z],
      motion:def.motion||null
    });
  }

  _createLight(def){
    const entity=new pc.Entity(def.id||`light-${this.entities.size}`);
    entity.addComponent('light',{
      type:def.type||'directional',
      color:color(def.color,'#ffffff'),
      intensity:Number.isFinite(def.intensity)?def.intensity:1,
      range:Number.isFinite(def.range)?def.range:20,
      castShadows:Boolean(def.castShadows)
    });
    setTransform(entity,def);
    this.root.addChild(entity);
  }

  _reset(){
    for(const [id,base] of this.baseline){
      const entity=this.entities.get(id);
      entity.enabled=base.enabled;
      entity.setLocalPosition(...base.position);
      entity.setLocalEulerAngles(...base.rotation);
      entity.setLocalScale(...base.scale);
    }
  }

  setCamera(name){
    const shot=this.spec.cameras[name];
    if(!shot)throw new Error(`Unknown camera ${name}`);
    this.camera.setPosition(...shot.position);
    this.camera.lookAt(...shot.lookAt);
    if(Number.isFinite(shot.fov))this.camera.camera.fov=shot.fov;
    this.cameraName=name;
  }

  applyPatch(patch={}){
    for(const id of patch.show||[]){const entity=this.entities.get(id);if(entity)entity.enabled=true;}
    for(const id of patch.hide||[]){const entity=this.entities.get(id);if(entity)entity.enabled=false;}
    for(const [id,transform] of Object.entries(patch.transforms||{})){
      const entity=this.entities.get(id);if(entity)setTransform(entity,transform);
    }
    if(patch.camera)this.setCamera(patch.camera);
  }

  setState(name){
    const state=this.spec.states?.[name];
    if(!state)throw new Error(`Unknown world state ${name}`);
    this._reset();
    this.applyPatch(state);
    this.state=name;
    this.elapsed=0;
  }

  _tick(dt){
    if(this.paused||this.reducedMotion)return;
    this.elapsed+=dt;
    for(const [id,base] of this.baseline){
      const motion=base.motion;
      const entity=this.entities.get(id);
      if(!motion||!entity?.enabled)continue;
      if(motion.type==='spin'){
        const a=motion.axis||[0,1,0],speed=motion.speed||15;
        entity.rotateLocal(a[0]*speed*dt,a[1]*speed*dt,a[2]*speed*dt);
      }else if(motion.type==='bob'){
        const p=base.position,amp=motion.amplitude||.12,speed=motion.speed||1;
        entity.setLocalPosition(p[0],p[1]+Math.sin(this.elapsed*speed)*amp,p[2]);
      }else if(motion.type==='pulse'){
        const s=base.scale,amp=motion.amplitude||.08,speed=motion.speed||2,k=1+Math.sin(this.elapsed*speed)*amp;
        entity.setLocalScale(s[0]*k,s[1]*k,s[2]*k);
      }
    }
  }

  setPaused(value){this.paused=Boolean(value);this.app.timeScale=this.paused?0:1;}
  replay(){if(this.state)this.setState(this.state);}
  stats(){
    return{
      available:true,engine:'playcanvas',engineVersion:PLAYCANVAS_ENGINE_VERSION,
      backendVersion:PLAYCANVAS_BACKEND_VERSION,worldId:this.spec.id,worldVersion:this.spec.version,
      state:this.state,camera:this.cameraName,entityCount:this.entities.size,
      deviceType:this.app.graphicsDevice?.deviceType||'unknown',canvasCount:this.host.querySelectorAll('canvas').length
    };
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;
    this.resizeObserver?.disconnect();
    try{this.app.off('update',this._update);}catch(_){}
    try{this.app.destroy();}catch(_){}
    this.canvas?.remove();
    this.entities.clear();this.materials.clear();
  }
}

export function createPlayCanvasWorld(host,spec,options={}){
  try{
    if(!host?.isConnected)throw new Error('PlayCanvas host is not connected');
    return new PlayCanvasWorld(host,spec,options);
  }catch(error){return unavailable(error);}
}
