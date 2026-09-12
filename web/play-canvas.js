/* VibeLearn Play Canvas — persistent game-surface/world lifecycle.
   Learning correctness, save authority and evidence stay outside this module. */
'use strict';
import {mountStoryWorldModule} from './story3d-world-host.js';

export const PLAY_CANVAS_VERSION='1';
let singleton=null;
let sequence=0;

function unavailable(error='Play Canvas world unavailable'){
  const message=error instanceof Error?error.message:String(error);
  return {available:false,error:message,setBeat(){},setMissionState(){},setPaused(){},replay(){},stats(){return{available:false,error:message,playCanvasVersion:PLAY_CANVAS_VERSION};},dispose(){}};
}

class PlayCanvasController{
  constructor(){
    this.instanceId=`play-canvas-${++sequence}`;
    this.stage=document.createElement('div');
    this.stage.className='play-canvas-stage';
    this.stage.dataset.playCanvasInstance=this.instanceId;
    this.stage.dataset.playCanvasVersion=PLAY_CANVAS_VERSION;
    this.world=null;
    this.worldKey=null;
    this.module=null;
    this.target=null;
    this.mode=null;
    this.contextLost=false;
    this.boundContextLost=e=>{e.preventDefault();this.contextLost=true;this._syncTargetState();};
    this.boundContextRestored=()=>{this.contextLost=false;this._syncTargetState();this.world?.replay?.();};
  }

  _key(module){
    const m=module?.storyWorldManifest;
    return m?.id&&m?.version?`${m.id}@${m.version}`:null;
  }

  _syncCanvasIdentity(){
    const canvas=this.stage.querySelector('canvas');
    if(!canvas)return;
    canvas.dataset.playCanvasInstance=this.instanceId;
    canvas.dataset.playCanvasVersion=PLAY_CANVAS_VERSION;
    canvas.classList.add('play-canvas-webgl');
    canvas.removeEventListener('webglcontextlost',this.boundContextLost);
    canvas.removeEventListener('webglcontextrestored',this.boundContextRestored);
    canvas.addEventListener('webglcontextlost',this.boundContextLost,false);
    canvas.addEventListener('webglcontextrestored',this.boundContextRestored,false);
  }

  _syncTargetState(){
    if(!this.target)return;
    const ready=Boolean(this.world?.available&&!this.contextLost);
    this.target.classList.toggle('play-canvas-ready',ready);
    this.target.classList.toggle('play-canvas-failed',!ready);
    // Legacy migration classes must never keep the semantic SVG hidden when the
    // shared renderer is unavailable/context-lost. Generic Play Canvas readiness
    // is sufficient after restoration even if a legacy compatibility class stays off.
    if(!ready)this.target.classList.remove('rgc1-three-ready','rg-three-continuity-ready');
    this.target.dataset.playCanvasMode=this.mode||'';
  }

  _attach(target,mode){
    if(!target?.isConnected)throw new Error('Play Canvas target is not connected');
    if(this.target&&this.target!==target){
      this.target.classList.remove('play-canvas-ready','play-canvas-failed','play-canvas-target');
      delete this.target.dataset.playCanvasMode;
    }
    this.target=target;
    this.mode=mode;
    target.classList.add('play-canvas-target');
    if(this.stage.parentElement!==target)target.prepend(this.stage);
    this.stage.dataset.playCanvasMode=mode;
    this._syncCanvasIdentity();
    this._syncTargetState();
  }

  mount(module,target,{mode='story',reducedMotion=false}={}){
    const key=this._key(module);
    if(!key)return unavailable('World package is missing id/version');
    try{this._attach(target,mode);}catch(error){return unavailable(error);}
    if(this.world&&this.worldKey===key){
      this._syncCanvasIdentity();
      this._syncTargetState();
      return this.world;
    }
    this.disposeWorld({keepStage:true});
    this.module=module;this.worldKey=key;
    const supported=module.storyWorldManifest?.modes||[];
    const mountMode=supported.includes('play')?'play':supported.includes('story')?'story':mode;
    this.world=mountStoryWorldModule(module,this.stage,{reducedMotion,mode:mountMode});
    this._syncCanvasIdentity();
    this._syncTargetState();
    return this.world;
  }

  showStory(module,target,beat,{reducedMotion=false,paused=false}={}){
    const world=this.mount(module,target,{mode:'story',reducedMotion});
    this.mode='story';this.stage.dataset.playCanvasMode='story';
    const canvas=this.stage.querySelector('canvas');canvas?.classList.remove('rgc1-mission-canvas');
    world?.setMode?.('story');world?.setBeat?.(beat);world?.setPaused?.(paused);
    this._syncTargetState();
    return world;
  }

  showMission(module,target,state,{reducedMotion=false}={}){
    const world=this.mount(module,target,{mode:'mission',reducedMotion});
    this.mode='mission';this.stage.dataset.playCanvasMode='mission';
    const canvas=this.stage.querySelector('canvas');canvas?.classList.add('rgc1-mission-canvas');
    world?.setMode?.('mission');world?.setMissionState?.(state||{});
    this._syncTargetState();
    return world;
  }

  replay(){this.world?.replay?.();}
  setPaused(value){this.world?.setPaused?.(value);}
  detach(){
    if(this.target){this.target.classList.remove('play-canvas-ready','play-canvas-failed','play-canvas-target');delete this.target.dataset.playCanvasMode;}
    this.target=null;this.mode=null;
    this.stage.remove();
  }
  disposeWorld({keepStage=false}={}){
    const canvas=this.stage.querySelector('canvas');
    canvas?.removeEventListener('webglcontextlost',this.boundContextLost);
    canvas?.removeEventListener('webglcontextrestored',this.boundContextRestored);
    try{this.world?.dispose?.();}catch(_){}
    this.world=null;this.worldKey=null;this.module=null;this.contextLost=false;
    if(!keepStage)this.detach();
  }
  stats(){
    return {playCanvasVersion:PLAY_CANVAS_VERSION,instanceId:this.instanceId,mode:this.mode,worldKey:this.worldKey,connected:this.stage.isConnected,contextLost:this.contextLost,world:this.world?.stats?.()||null};
  }
  dispose(){this.disposeWorld();this.stage.remove();}
}

export function getPlayCanvas(){return singleton||(singleton=new PlayCanvasController());}
export function resetPlayCanvas(){if(singleton){singleton.dispose();singleton=null;}}
