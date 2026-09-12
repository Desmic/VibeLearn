/* Relay Rescue world adapter compiled from engine-neutral WorldSpec into PlayCanvas. */
'use strict';
import {createPlayCanvasWorld} from './playcanvas-backend.js';
import {echoForgeWorldSpec} from './echo-forge-world-spec.js';

export const gameWorldManifest=Object.freeze({
  id:'relay-rescue.echo-forge',
  version:'pc-phase1-1',
  engine:'playcanvas',
  specVersion:echoForgeWorldSpec.schemaVersion,
  modes:Object.freeze(['story','mission']),
  capabilities:Object.freeze(['beats','mission-state','pause','replay','stats','fallback'])
});

function missionPatch(state={}){
  const looked=new Set(state.looked||[]);
  const patch={camera:'mission',show:['new-gear'],hide:['duplicate-gear','reply-orb','order-seal','storm-bolt-a','storm-bolt-b','broken-gear']};
  if(state.failed){
    patch.show.push('duplicate-gear');
    patch.transforms={'pip':{rotation:[0,0,-5]}};
  }else if(state.ticket&&state.ticket!=='order-01'){
    patch.show.push('order-seal');
  }else if(looked.has('ticket')){
    patch.show.push('order-seal');
  }
  if(Number(state.rewinds||0)>0)patch.hide.push('duplicate-gear');
  return patch;
}

export function createGameWorld(host,{reducedMotion=false,mode='story'}={}){
  const engine=createPlayCanvasWorld(host,echoForgeWorldSpec,{reducedMotion,pixelRatioCap:1.5});
  if(!engine.available)return engine;
  let currentMode=mode,beat=0,missionState=null;

  const applyBeat=index=>{
    beat=Math.max(0,Math.min(5,Number(index)||0));
    missionState=null;
    engine.setState(`story.${beat}`);
  };
  const applyMission=state=>{
    currentMode='mission';missionState=state||{};
    engine.setState('mission');
    engine.applyPatch(missionPatch(missionState));
  };

  if(mode==='mission')applyMission({});else applyBeat(0);
  host.classList.add('vibelearn-playcanvas-ready');

  return{
    available:true,
    engine:'playcanvas',
    setMode(value){currentMode=value;},
    setBeat(index){currentMode='story';applyBeat(index);},
    setMissionState(state){applyMission(state);},
    setPaused(value){engine.setPaused(value);},
    replay(){missionState?applyMission(missionState):applyBeat(beat);},
    stats(){return{...engine.stats(),mode:currentMode,beat,manifest:gameWorldManifest.id};},
    dispose(){engine.dispose();host.classList.remove('vibelearn-playcanvas-ready');}
  };
}
