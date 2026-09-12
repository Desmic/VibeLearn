/* Relay Rescue world adapter compiled from engine-neutral WorldSpec into PlayCanvas. */
'use strict';
import {createPlayCanvasWorld} from './playcanvas-backend.js';
import {echoForgeWorldSpec} from './echo-forge-world-spec.js';

export const gameWorldManifest=Object.freeze({
  id:'relay-rescue.echo-forge',
  version:'pc-phase1-4',
  engine:'playcanvas',
  specVersion:echoForgeWorldSpec.schemaVersion,
  modes:Object.freeze(['story','mission']),
  capabilities:Object.freeze(['beats','mission-state','pause','replay','stats','fallback'])
});

function missionPatch(state={}){
  const looked=new Set(state.looked||[]);
  const rewound=Number(state.rewinds||0)>0;
  const knowsForge=looked.has('workshop')||looked.has('ticket')||rewound||Boolean(state.complete)||Boolean(state.failed);
  const patch={
    camera:'mission.forge',
    show:[],
    hide:['new-gear','duplicate-gear','reply-orb','order-seal','storm-bolt-a','storm-bolt-b','broken-gear']
  };

  // World truth is deliberately not rendered as learner-visible knowledge until
  // the player inspects the Forge. The server remains authoritative either way.
  if(knowsForge){
    patch.hide=patch.hide.filter(id=>id!=='new-gear');
    patch.show.push('new-gear');
  }

  if(state.failed){
    patch.camera='mission.failure';
    patch.hide=patch.hide.filter(id=>id!=='duplicate-gear');
    patch.show.push('duplicate-gear');
    patch.transforms={'pip':{rotation:[0,0,-5]}};
  }else if(state.complete){
    patch.camera='mission.success';
    // Completion is presentation state, not new game truth: install the already
    // discovered gear into the bridge and place Pip across the gap so success
    // reads in the world before the textual recap appears.
    patch.transforms={
      'new-gear':{position:[0,.58,1.1],rotation:[90,0,0],scale:[1.15,.34,1.15]},
      'pip':{position:[3.55,.3,.9],rotation:[0,-24,0]}
    };
  }else if(rewound||looked.has('ticket')||(state.ticket&&state.ticket!=='order-01')){
    patch.camera='mission.choice';
  }else if(looked.has('workshop')){
    patch.camera='mission.ticket';
  }

  if(state.ticket&&state.ticket!=='order-01'){
    patch.hide=patch.hide.filter(id=>id!=='order-seal');
    patch.show.push('order-seal');
  }else if(looked.has('ticket')){
    patch.hide=patch.hide.filter(id=>id!=='order-seal');
    patch.show.push('order-seal');
  }
  if(rewound)patch.hide.push('duplicate-gear');
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
    stats(){return{...engine.stats(),mode:currentMode,beat,manifest:gameWorldManifest.id,manifestVersion:gameWorldManifest.version};},
    dispose(){engine.dispose();host.classList.remove('vibelearn-playcanvas-ready');}
  };
}
