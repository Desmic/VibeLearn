/* Relay Rescue world adapter compiled from engine-neutral WorldSpec into PlayCanvas. */
'use strict';
import {createPlayCanvasWorld} from './playcanvas-backend.js';
import {echoForgeWorldSpec} from './echo-forge-world-spec.js';

export const gameWorldManifest=Object.freeze({
  id:'relay-rescue.echo-forge',
  version:'pc-phase1-8',
  engine:'playcanvas',
  specVersion:echoForgeWorldSpec.schemaVersion,
  modes:Object.freeze(['story','mission']),
  capabilities:Object.freeze(['beats','mission-state','pause','replay','stats','fallback','semantic-picking','animated-assets'])
});

const PIP_LIMBS=['pip-arm-l','pip-arm-r','pip-hand-l','pip-hand-r','pip-leg-l','pip-leg-r','pip-boot-l','pip-boot-r'];
const INTERACTIVE_SEMANTICS=new Set(['broken-gear','order-seal','signal','signal-tower','pip','forge']);
// The GLB silhouette is wider/taller than the old primitive courier. Keep its
// semantic stage anchors inside the authored phone composition rather than
// inheriting primitive-era x≈-5 positions that clip the animated character.
const PIP_LEFT_X=-3.55;
const PIP_SUCCESS_X=2.75;

function semanticPick(entityId){
  if(!entityId)return null;
  if(entityId==='broken-gear')return 'broken-gear';
  if(entityId==='order-seal')return 'order-seal';
  if(entityId==='reply-orb'||entityId.startsWith('storm-bolt'))return 'signal';
  if(entityId==='beacon-0'||entityId==='beacon-lamp-0')return 'signal-tower';
  if(entityId==='pip'||entityId.startsWith('pip-'))return 'pip';
  if(entityId==='forge'||entityId.startsWith('forge-'))return 'forge';
  return entityId;
}

function semanticPickFromSelection(ids=[]){
  const mapped=ids.map(semanticPick).filter(Boolean);
  return mapped.find(id=>INTERACTIVE_SEMANTICS.has(id))||mapped[0]||null;
}

function storyPresentationPatch(beat){
  const index=Math.max(0,Math.min(5,Number(beat)||0));
  const patch={hide:[...PIP_LIMBS],transforms:{},animations:{pip:['idle','no','yes','no','no','wave'][index]}};
  const poses=[
    {pip:{position:[PIP_LEFT_X-.10,.42,1.2],rotation:[0,18,0],scale:[1.02,1.02,1.02]},'pip-head':{rotation:[0,-8,0]}},
    {pip:{position:[PIP_LEFT_X,.42,1.2],rotation:[0,8,-5],scale:[1.03,1.03,1.03]},'pip-head':{rotation:[0,2,-10]}},
    {pip:{position:[PIP_LEFT_X+.10,.42,1.15],rotation:[0,-26,0],scale:[1.02,1.02,1.02]},'pip-head':{rotation:[0,-14,0]},'pip-scarf':{rotation:[0,-22,-12]}},
    {pip:{position:[PIP_LEFT_X+.05,.42,1.12],rotation:[0,-12,-4],scale:[1.02,1.02,1.02]},'pip-head':{rotation:[8,-8,-8]},'pip-scarf':{rotation:[0,-12,-6]}},
    {pip:{position:[PIP_LEFT_X+.10,.42,1.12],rotation:[0,18,0],scale:[1.02,1.02,1.02]},'pip-head':{rotation:[0,18,-5]}},
    {pip:{position:[PIP_LEFT_X+.25,.42,1.05],rotation:[0,28,0],scale:[1.02,1.02,1.02]},'pip-head':{rotation:[0,-10,0]}}
  ];
  patch.transforms=poses[index];
  if(index===5)patch.camera='story.0';
  return patch;
}

function missionPatch(state={}){
  const looked=new Set(state.looked||[]);
  const rewound=Number(state.rewinds||0)>0;
  const knowsForge=looked.has('workshop')||looked.has('ticket')||rewound||Boolean(state.complete)||Boolean(state.failed);
  const patch={
    camera:'mission.forge',
    show:[],
    hide:['new-gear','duplicate-gear','reply-orb','order-seal','storm-bolt-a','storm-bolt-b','broken-gear',...PIP_LIMBS],
    transforms:{'pip':{position:[PIP_LEFT_X,.42,1.1],rotation:[0,18,0],scale:[1.02,1.02,1.02]}},
    animations:{pip:'idle'}
  };

  if(knowsForge){
    patch.hide=patch.hide.filter(id=>id!=='new-gear');
    patch.show.push('new-gear');
  }

  if(state.failed){
    patch.camera='mission.failure';
    patch.animations.pip='no';
    patch.hide=patch.hide.filter(id=>id!=='duplicate-gear');
    patch.show.push('duplicate-gear');
    patch.transforms={...patch.transforms,'pip':{position:[PIP_LEFT_X,.42,1.1],rotation:[0,0,-8],scale:[1.02,1.02,1.02]},'pip-head':{rotation:[10,0,-12]}};
  }else if(state.complete){
    patch.camera='mission.success';
    patch.animations.pip='thumbsUp';
    patch.transforms={
      ...patch.transforms,
      'new-gear':{position:[0,.58,1.1],rotation:[90,0,0],scale:[1.15,.34,1.15]},
      'pip':{position:[PIP_SUCCESS_X,.42,.9],rotation:[0,-24,0],scale:[1.02,1.02,1.02]},
      'pip-head':{rotation:[0,-12,0]}
    };
  }else if(rewound||looked.has('ticket')||(state.ticket&&state.ticket!=='order-01')){
    patch.camera='mission.choice';
    patch.animations.pip='no';
    patch.transforms={...patch.transforms,'pip-head':{rotation:[0,16,-4]}};
  }else if(looked.has('workshop')){
    patch.camera='mission.ticket';
    patch.animations.pip='wave';
    patch.transforms={...patch.transforms,'pip-head':{rotation:[0,-16,0]}};
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
    engine.applyPatch(storyPresentationPatch(beat));
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
    async pickSemanticAt(clientX,clientY){return semanticPickFromSelection(await engine.pickEntityIdsAt(clientX,clientY));},
    stats(){return{...engine.stats(),mode:currentMode,beat,manifest:gameWorldManifest.id,manifestVersion:gameWorldManifest.version};},
    dispose(){engine.dispose();host.classList.remove('vibelearn-playcanvas-ready');}
  };
}
