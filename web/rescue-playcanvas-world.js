/* Relay Rescue world adapters compiled from engine-neutral WorldSpecs into PlayCanvas. */
'use strict';
import {createPlayCanvasWorld} from './playcanvas-backend.js';
import {echoForgeWorldSpec} from './echo-forge-world-spec.js';

/*
 * Signal 7 deliberately changes context. It keeps the same engine-neutral
 * WorldSpec -> PlayCanvas seam, but presents the transfer challenge as an
 * operations deck instead of reusing Echo Forge scenery or falling back to a
 * themed web form. Existing DOM controls remain the semantic/accessible input
 * layer; this world owns spatial context and consequences only.
 */
const transferEntities=[];
const tadd=(id,primitive,material,position,scale,extra={})=>transferEntities.push({id,primitive,material,position,scale,...extra});
const tchild=(id,parent,primitive,material,position,scale,extra={})=>transferEntities.push({id,parent,primitive,material,position,scale,...extra});

// Operations deck / data harbour.
tadd('transfer-deck','box','deck',[0,-.5,0],[8.8,.42,5.4]);
tadd('transfer-deck-core','box','deckGlow',[0,-.05,0],[8.45,.035,5.05]);
[-6.4,-4.8,-3.2,-1.6,0,1.6,3.2,4.8,6.4].forEach((x,i)=>tadd(`transfer-grid-x-${i}`,'box','trace',[x,.02,0],[.025,.02,4.75]));
[-3.8,-2.55,-1.3,0,1.3,2.55,3.8].forEach((z,i)=>tadd(`transfer-grid-z-${i}`,'box','trace',[0,.025,z],[8.15,.02,.025]));

// Export worker rack on the left.
tadd('transfer-worker','box','worker',[-5.9,1.35,-.4],[1.35,2.7,1.45]);
tchild('transfer-worker-face','transfer-worker','box','screen',[0,.45,.76],[.92,.72,.04],{motion:{type:'pulse',amplitude:.035,speed:1.4}});
[-.55,0,.55].forEach((y,i)=>tchild(`transfer-worker-slot-${i}`,'transfer-worker','box','ink',[0,y-.42,.78],[.86,.12,.035]));
tadd('transfer-worker-beacon','sphere','workerLight',[-5.9,3.05,-.4],[.22,.22,.22],{motion:{type:'pulse',amplitude:.12,speed:1.8}});

// External export service / vault on the right.
tadd('transfer-service','cylinder','service',[5.9,1.25,-.4],[1.65,2.5,1.65]);
tchild('transfer-service-core','transfer-service','sphere','serviceLight',[0,.1,0],[.62,.62,.62],{motion:{type:'pulse',amplitude:.08,speed:1.65}});
tchild('transfer-service-ring','transfer-service','torus','serviceLight',[0,.62,0],[1.18,.11,1.18],{motion:{type:'spin',axis:[0,1,0],speed:20}});
tadd('transfer-service-beacon','sphere','serviceLight',[5.9,3.12,-.4],[.22,.22,.22],{motion:{type:'pulse',amplitude:.12,speed:1.9}});

// Four physical policy sockets align with the four semantic route controls.
[-3.2,-1.08,1.08,3.2].forEach((x,i)=>{
  tadd(`transfer-route-pad-${i}`,'cylinder','route',[x,.25,.95],[.62,.18,.62]);
  tadd(`transfer-route-ring-${i}`,'torus','routeGlow',[x,.48,.95],[.58,.10,.58],{rotation:[90,0,0],motion:{type:'pulse',amplitude:.045,speed:1.15+i*.08}});
});
[-4.55,-2.14,0,2.14,4.55].forEach((x,i)=>tadd(`transfer-link-${i}`,'box','routeGlow',[x,.47,.95],[.62,.055,.055]));

// Input/output artefacts make success/failure visible in the world.
[-.42,0,.42].forEach((z,i)=>tadd(`transfer-input-${i}`,'box','file',[-4.0,.32,z-1.35],[.34,.09,.48],{rotation:[0,8-i*8,0]}));
tadd('transfer-journal','box','journal',[-2.85,.72,-1.45],[.58,.12,.78],{rotation:[0,-12,0]});
tadd('transfer-output','box','success',[4.1,.58,-1.4],[.48,.14,.64],{enabled:false,motion:{type:'bob',amplitude:.08,speed:1.7}});
tadd('transfer-duplicate-a','box','danger',[3.7,.45,-1.32],[.48,.14,.64],{enabled:false,rotation:[0,-12,0]});
tadd('transfer-duplicate-b','box','danger',[4.45,.66,-1.2],[.48,.14,.64],{enabled:false,rotation:[0,11,0]});
tadd('transfer-warning','sphere','dangerLight',[4.15,1.55,-1.35],[.28,.28,.28],{enabled:false,motion:{type:'pulse',amplitude:.22,speed:2.7}});
tadd('transfer-success','sphere','successLight',[4.15,1.55,-1.35],[.28,.28,.28],{enabled:false,motion:{type:'pulse',amplitude:.13,speed:1.7}});

// Sparse skyline keeps the new system legible as a distinct operational context.
[-7.4,-5.0,-2.6,2.6,5.0,7.4].forEach((x,i)=>tadd(`transfer-tower-${i}`,'box','tower',[x,1.45,-4.2],[.72,2.9+(i%3)*.45,.72]));
[-6.6,-3.7,-.8,2.1,5.0,7.1].forEach((x,i)=>tadd(`transfer-tower-light-${i}`,'sphere',i%2?'serviceLight':'workerLight',[x,3.35+(i%3)*.4,-4.15],[.12,.12,.12],{motion:{type:'pulse',amplitude:.12,speed:1.1+i*.09}}));

export const transferWorldSpec=Object.freeze({
  schemaVersion:'1',
  id:'relay-rescue.export-yard',
  version:'pc-transfer-1',
  environment:{clearColor:'#050c16',ambient:'#183748',exposure:1.22,toneMapping:'aces2',fog:{type:'exp2',color:'#071522',density:.023}},
  materials:{
    deck:{diffuse:'#142c39',metalness:.18,gloss:.28},
    deckGlow:{diffuse:'#183947',emissive:'#174b5d',emissiveIntensity:.45,gloss:.22},
    trace:{diffuse:'#31525c',emissive:'#274f59',emissiveIntensity:.36},
    worker:{diffuse:'#315b68',metalness:.22,gloss:.36},
    screen:{diffuse:'#5ad3c5',emissive:'#5ad3c5',emissiveIntensity:1.65,gloss:.65},
    ink:{diffuse:'#09141d',gloss:.18},
    workerLight:{diffuse:'#7ce4d3',emissive:'#7ce4d3',emissiveIntensity:2.0},
    service:{diffuse:'#67527d',metalness:.2,gloss:.36},
    serviceLight:{diffuse:'#b596e8',emissive:'#b596e8',emissiveIntensity:1.9},
    route:{diffuse:'#8b7041',metalness:.18,gloss:.32},
    routeGlow:{diffuse:'#e7bd6e',emissive:'#e7bd6e',emissiveIntensity:1.15},
    file:{diffuse:'#d7e5de',gloss:.18},
    journal:{diffuse:'#e9c982',gloss:.12},
    danger:{diffuse:'#ff745f',emissive:'#ff745f',emissiveIntensity:.75},
    dangerLight:{diffuse:'#ff745f',emissive:'#ff745f',emissiveIntensity:3.0},
    success:{diffuse:'#79d8b4',emissive:'#79d8b4',emissiveIntensity:.55},
    successLight:{diffuse:'#79d8b4',emissive:'#79d8b4',emissiveIntensity:2.6},
    tower:{diffuse:'#112531',metalness:.16,gloss:.2}
  },
  lights:[
    {id:'transfer-key',type:'directional',color:'#a9d7e1',intensity:1.2,rotation:[48,-26,0]},
    {id:'transfer-worker-light',type:'omni',color:'#69dfce',intensity:1.35,range:9,position:[-5.4,2.8,2.1]},
    {id:'transfer-service-light',type:'omni',color:'#b79be9',intensity:1.25,range:9,position:[5.4,2.8,2.1]},
    {id:'transfer-route-light',type:'omni',color:'#edc77d',intensity:.8,range:9,position:[0,2.3,2.4]}
  ],
  entities:transferEntities,
  cameras:{
    transfer:{position:[0,7.0,13.6],lookAt:[0,.55,-.15],fov:47,portrait:{position:[0,4.25,15.1],lookAt:[0,.55,.15],fov:49}},
    'transfer.result':{position:[1.2,5.8,11.2],lookAt:[2.2,.7,-.55],fov:45,portrait:{position:[.8,3.8,13.0],lookAt:[2.5,.7,-.7],fov:47}}
  },
  states:{
    transfer:{camera:'transfer',hide:['transfer-output','transfer-duplicate-a','transfer-duplicate-b','transfer-warning','transfer-success']},
    'transfer.failure':{camera:'transfer.result',show:['transfer-duplicate-a','transfer-duplicate-b','transfer-warning'],hide:['transfer-output','transfer-success']},
    'transfer.success':{camera:'transfer.result',show:['transfer-output','transfer-success'],hide:['transfer-duplicate-a','transfer-duplicate-b','transfer-warning']}
  }
});

export const gameWorldManifest=Object.freeze({
  id:'relay-rescue.echo-forge',
  version:'pc-phase1-14',
  engine:'playcanvas',
  specVersion:echoForgeWorldSpec.schemaVersion,
  modes:Object.freeze(['story','mission','transfer']),
  capabilities:Object.freeze(['beats','mission-state','transfer-state','pause','replay','stats','fallback','semantic-picking','animated-assets','storm-route-feedback'])
});

const PIP_LIMBS=['pip-arm-l','pip-arm-r','pip-hand-l','pip-hand-r','pip-leg-l','pip-leg-r','pip-boot-l','pip-boot-r'];
const INTERACTIVE_SEMANTICS=new Set(['broken-gear','order-seal','signal','signal-tower','pip','forge']);
// The GLB silhouette is wider/taller than the old primitive courier. Keep its
// semantic stage anchors inside the authored phone composition rather than
// inheriting primitive-era x≈-5 positions that clip the animated character.
const PIP_LEFT_X=-2.65;
const PIP_SUCCESS_X=2.75;

function semanticPick(entityId){
  if(!entityId)return null;
  if(entityId==='broken-gear'||entityId.startsWith('broken-gear-'))return 'broken-gear';
  if(entityId==='order-seal')return 'order-seal';
  if(entityId==='reply-orb'||entityId.startsWith('storm-bolt'))return 'signal';
  if(entityId==='keeper-light'||entityId==='keeper-glow'||entityId==='beacon-0'||entityId==='beacon-lamp-0')return 'signal-tower';
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
  const patch={hide:['guide-path-0','guide-path-1','guide-path-2','keeper-glow',...Array.from({length:5},(_,i)=>`echo-path-${i}`),...PIP_LIMBS],transforms:{},animations:{pip:['idle','no','yes','no','no','wave'][index]}};
  const poses=[
    {pip:{position:[PIP_LEFT_X-.10,.42,1.2],rotation:[0,18,0],scale:[1.02,1.02,1.02]},'pip-head':{rotation:[0,-8,0]}},
    {pip:{position:[PIP_LEFT_X,.42,1.2],rotation:[0,8,-5],scale:[1.03,1.03,1.03]},'pip-head':{rotation:[0,2,-10]}},
    {pip:{position:[PIP_LEFT_X+.10,.42,1.15],rotation:[0,-26,0],scale:[1.02,1.02,1.02]},'pip-head':{rotation:[0,-14,0]},'pip-scarf':{rotation:[0,-22,-12]}},
    {pip:{position:[PIP_LEFT_X+.05,.42,1.12],rotation:[0,-12,-4],scale:[1.02,1.02,1.02]},'pip-head':{rotation:[8,-8,-8]},'pip-scarf':{rotation:[0,-12,-6]}},
    {pip:{position:[PIP_LEFT_X+.10,.42,1.12],rotation:[0,18,0],scale:[1.02,1.02,1.02]},'pip-head':{rotation:[0,18,-5]}},
    {pip:{position:[PIP_LEFT_X+.25,.42,1.05],rotation:[0,28,0],scale:[1.02,1.02,1.02]},'pip-head':{rotation:[0,-10,0]}}
  ];
  patch.transforms={...poses[index],...(index>0?{'bridge-left-6':{rotation:[0,0,14]},'bridge-right-6':{rotation:[0,0,-14]}}:{})};
  if(index===5){
    patch.camera='mission.choice';
    patch.show=['keeper-glow','guide-path-0','guide-path-1','guide-path-2',...Array.from({length:5},(_,i)=>`echo-path-${i}`)];
    patch.hide=patch.hide.filter(id=>!patch.show.includes(id));
  }
  return patch;
}

function missionPatch(state={}){
  const level=Number(state.level||0);
  const looked=new Set(state.looked||[]);
  const rewound=Number(state.rewinds||0)>0;
  const routeTested=level===6&&Array.isArray(state.rows)&&state.rows.length>0;
  const knowsForge=looked.has('workshop')||looked.has('ticket')||rewound||Boolean(state.complete)||Boolean(state.failed);
  const patch={
    camera:'mission.forge',
    show:[],
    hide:['new-gear','duplicate-gear','reply-orb','order-seal','storm-bolt-a','storm-bolt-b','broken-gear',...PIP_LIMBS],
    transforms:{'bridge-left-6':{rotation:[0,0,14]},'bridge-right-6':{rotation:[0,0,-14]},'pip':{position:[PIP_LEFT_X,.42,1.1],rotation:[0,18,0],scale:[1.02,1.02,1.02]}},
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
    patch.show.push('restored-crossing','first-signal-restored');
    patch.transforms['bridge-left-6']={rotation:[0,0,0]};patch.transforms['bridge-right-6']={rotation:[0,0,0]};
    patch.camera='mission.success';
    patch.animations.pip='thumbsUp';
    patch.transforms={
      ...patch.transforms,
      'new-gear':{position:[0,.58,1.1],scale:[.98,.98,.98]},
      'pip':{position:[PIP_SUCCESS_X,.42,.9],rotation:[0,-24,0],scale:[1.02,1.02,1.02]},
      'pip-head':{rotation:[0,-12,0]}
    };
  }else if(level===6){
    // Signal 6 is route construction across the valley, not a Forge inspection.
    // Keep the camera wide so the semantic controls sit over an actual route.
    patch.camera='mission.choice';
    if(routeTested){
      // A failed/counterexample run is visible in the world as a live storm,
      // while the precise case explanation remains in the accessible HUD.
      patch.animations.pip='no';
      patch.hide=patch.hide.filter(id=>id!=='storm-bolt-a'&&id!=='storm-bolt-b');
      patch.show.push('storm-bolt-a','storm-bolt-b');
    }
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

function transferStateName(state={}){
  const outcome=String(state.assessmentOutcome||'');
  if(Boolean(state.failed)||outcome==='incorrect')return 'transfer.failure';
  if(Boolean(state.complete)||outcome==='correct')return 'transfer.success';
  return 'transfer';
}

function createTransferGameWorld(host,{reducedMotion=false}={}){
  const engine=createPlayCanvasWorld(host,transferWorldSpec,{reducedMotion,pixelRatioCap:1.5});
  if(!engine.available)return engine;
  let state={};
  const apply=value=>{
    state=value||{};
    engine.setState(transferStateName(state));
  };
  apply({});
  host.classList.add('vibelearn-playcanvas-ready');
  return{
    available:true,
    engine:'playcanvas',
    setMode(){},
    setBeat(){},
    setMissionState(){},
    setTransferState(value){apply(value);},
    setPaused(value){engine.setPaused(value);},
    replay(){apply(state);},
    async pickSemanticAt(){return null;},
    stats(){return{...engine.stats(),mode:'transfer',manifest:'relay-rescue.export-yard',manifestVersion:transferWorldSpec.version};},
    dispose(){engine.dispose();host.classList.remove('vibelearn-playcanvas-ready');}
  };
}

export function createGameWorld(host,{reducedMotion=false,mode='story'}={}){
  if(mode==='transfer')return createTransferGameWorld(host,{reducedMotion});
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
    applyPresentation(patch){engine.applyPatch(patch);},
    projectEntity(id){return engine.projectEntity(id);},
    setMissionState(state){applyMission(state);},
    setTransferState(){},
    setPaused(value){engine.setPaused(value);},
    replay(){missionState?applyMission(missionState):applyBeat(beat);},
    async pickSemanticAt(clientX,clientY){return semanticPickFromSelection(await engine.pickEntityIdsAt(clientX,clientY));},
    stats(){return{...engine.stats(),mode:currentMode,beat,missionLevel:Number(missionState?.level||0),routeTested:Boolean(Number(missionState?.level||0)===6&&missionState?.rows?.length),manifest:gameWorldManifest.id,manifestVersion:gameWorldManifest.version};},
    dispose(){engine.dispose();host.classList.remove('vibelearn-playcanvas-ready');}
  };
}
