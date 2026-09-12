/* VibeLearn persistent game runtime shell.
   Engine-neutral orchestration; the current Phase 1 backend is PlayCanvas Engine. */
'use strict';

export const GAME_RUNTIME_VERSION='1';
let singleton=null,sequence=0;

function unavailable(error='Game world unavailable'){
  const message=error instanceof Error?error.message:String(error);
  return{available:false,error:message,setBeat(){},setMissionState(){},setPaused(){},replay(){},stats(){return{available:false,error:message,gameRuntimeVersion:GAME_RUNTIME_VERSION};},dispose(){}};
}

class GameRuntimeController{
  constructor(){
    this.instanceId=`game-runtime-${++sequence}`;
    this.stage=document.createElement('div');
    this.stage.className='game-runtime-stage play-canvas-stage';
    this.stage.dataset.gameRuntimeInstance=this.instanceId;
    this.stage.dataset.gameRuntimeVersion=GAME_RUNTIME_VERSION;
    this.world=null;this.worldKey=null;this.module=null;this.target=null;this.mode=null;this.contextLost=false;
    this.boundContextLost=e=>{e.preventDefault();this.contextLost=true;this._syncTargetState();};
    this.boundContextRestored=()=>{this.contextLost=false;this._syncTargetState();this.world?.replay?.();};
  }
  _key(module){
    const m=module?.gameWorldManifest;
    return m?.id&&m?.version?`${m.id}@${m.version}:${m.engine||'unknown'}`:null;
  }
  _syncCanvasIdentity(){
    const canvas=this.stage.querySelector('canvas');if(!canvas)return;
    canvas.dataset.gameRuntimeInstance=this.instanceId;
    canvas.dataset.gameRuntimeVersion=GAME_RUNTIME_VERSION;
    canvas.classList.add('play-canvas-webgl');
    canvas.removeEventListener('webglcontextlost',this.boundContextLost);
    canvas.removeEventListener('webglcontextrestored',this.boundContextRestored);
    canvas.addEventListener('webglcontextlost',this.boundContextLost,false);
    canvas.addEventListener('webglcontextrestored',this.boundContextRestored,false);
  }
  _syncTargetState(){
    if(!this.target)return;
    this.target.dataset.gameRuntimeMode=this.mode||'';
    this.target.dataset.gameEngine=this.world?.engine||this.module?.gameWorldManifest?.engine||'';
    // Mounting is a neutral state, not a failure. Hiding the stage here makes an
    // embedded engine measure a 0x0 host before the world can become available.
    if(!this.world){
      this.target.classList.remove('play-canvas-ready','play-canvas-failed','rgc1-three-ready','rg-three-continuity-ready');
      return;
    }
    const ready=Boolean(this.world.available&&!this.contextLost);
    this.target.classList.toggle('play-canvas-ready',ready);
    this.target.classList.toggle('play-canvas-failed',!ready);
    if(!ready)this.target.classList.remove('rgc1-three-ready','rg-three-continuity-ready');
  }
  _attach(target,mode){
    if(!target?.isConnected)throw new Error('Game runtime target is not connected');
    if(this.target&&this.target!==target){
      this.target.classList.remove('play-canvas-ready','play-canvas-failed','play-canvas-target');
      delete this.target.dataset.gameRuntimeMode;delete this.target.dataset.gameEngine;
    }
    this.target=target;this.mode=mode;
    target.classList.add('play-canvas-target');
    if(this.stage.parentElement!==target)target.prepend(this.stage);
    this.stage.dataset.gameRuntimeMode=mode;
    this._syncCanvasIdentity();this._syncTargetState();
  }
  mount(module,target,{mode='story',reducedMotion=false}={}){
    const key=this._key(module);
    if(!key||typeof module?.createGameWorld!=='function')return unavailable('Game world package is missing manifest/createGameWorld');
    try{this._attach(target,mode);}catch(error){return unavailable(error);}
    if(this.world&&this.worldKey===key){this._syncCanvasIdentity();this._syncTargetState();return this.world;}
    this.disposeWorld({keepStage:true});
    this.module=module;this.worldKey=key;this._syncTargetState();
    try{this.world=module.createGameWorld(this.stage,{reducedMotion,mode});}
    catch(error){this.world=unavailable(error);}
    this._syncCanvasIdentity();this._syncTargetState();
    return this.world;
  }
  showStory(module,target,beat,{reducedMotion=false,paused=false}={}){
    const world=this.mount(module,target,{mode:'story',reducedMotion});
    this.mode='story';this.stage.dataset.gameRuntimeMode='story';
    world?.setMode?.('story');world?.setBeat?.(beat);world?.setPaused?.(paused);
    this._syncTargetState();return world;
  }
  showMission(module,target,state,{reducedMotion=false}={}){
    const world=this.mount(module,target,{mode:'mission',reducedMotion});
    this.mode='mission';this.stage.dataset.gameRuntimeMode='mission';
    world?.setMode?.('mission');world?.setMissionState?.(state||{});
    this._syncTargetState();return world;
  }
  replay(){this.world?.replay?.();}
  setPaused(value){this.world?.setPaused?.(value);}
  detach(){
    if(this.target){
      this.target.classList.remove('play-canvas-ready','play-canvas-failed','play-canvas-target');
      delete this.target.dataset.gameRuntimeMode;delete this.target.dataset.gameEngine;
    }
    this.target=null;this.mode=null;this.stage.remove();
  }
  disposeWorld({keepStage=false}={}){
    const canvas=this.stage.querySelector('canvas');
    canvas?.removeEventListener('webglcontextlost',this.boundContextLost);
    canvas?.removeEventListener('webglcontextrestored',this.boundContextRestored);
    try{this.world?.dispose?.();}catch(_){}
    this.world=null;this.worldKey=null;this.module=null;this.contextLost=false;
    if(keepStage)this._syncTargetState();else this.detach();
  }
  stats(){return{gameRuntimeVersion:GAME_RUNTIME_VERSION,instanceId:this.instanceId,mode:this.mode,worldKey:this.worldKey,connected:this.stage.isConnected,contextLost:this.contextLost,world:this.world?.stats?.()||null};}
  dispose(){this.disposeWorld();this.stage.remove();}
}

export function getGameRuntime(){return singleton||(singleton=new GameRuntimeController());}
export function resetGameRuntime(){if(singleton){singleton.dispose();singleton=null;}}
