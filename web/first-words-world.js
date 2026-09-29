/* Bellweather / prison proof track: story, composition and semantic presentation. */
import {characterControlProfile} from './game-character-spec.js';
import {messageMachine,tokenTrack,smallTree,pavilion,deliveryParcel} from './workshop-props.js';
import {lantern,gate,tower,planter,companionRobot,companionPose,capabilityModule,capabilitySocket,eventLink,speechBubble} from './rescue-world-props.js';
import {makeWorldPackage} from './spec-game-world.js';
import {bellweatherGarden,gardenGeometries,gardenMaterials,gardenTextures,gardenAssets,openingEnvironment} from './bellweather-garden.js';

// Story-specific labels for the shared inspect -> stage -> commit interaction.
export const routeSources=Object.freeze({
  moon:{name:'Old sign',anchor:'notice-old-label',action:'scan-moon',decisionText:'Take the Moon gate.'},
  parade:{name:'Parade notice',anchor:'notice-parade-label',action:'scan-parade',decisionText:'The lantern parade starts at sunset.'},
  star:{name:"Today's notice",anchor:'notice-today-label',action:'scan-star',decisionText:'Moon route closed. The tower bell answers the five-point lantern mark.',cueText:'Moon closed · five-point mark.'}
});
export const relaySources=Object.freeze({
  loft:{name:'18:00 Mira note',anchor:'relay-note-a-label',action:'relay-context-loft'},
  yard:{name:'18:20 Mira note',anchor:'relay-note-b-label',action:'relay-context-yard'},
  tavi:{name:'18:30 Tavi note',anchor:'relay-note-c-label',action:'relay-context-tavi'}
});

const e=[];
const part=(id,primitive,material,position,scale,extra={})=>e.push({id,primitive,material,position,scale,...extra});
const addTo=(parent,items)=>items.forEach((item,index)=>e.push(index===0?{...item,parent}:item));

/* Two deliberately separate places. Bellweather sells the life that is lost; the
   prison has room for movement, camera orbit and readable focal interactions. */
e.push({id:'bellweather-zone',position:[0,0,10]},{id:'prison-zone',position:[0,0,-32]});
// The first playable space is a small transit garden, with negative space around
// two physically distinct signal objects. All dimensions and visual treatment
// live in this package; shared movement/camera code knows none of these names.
e.push(...bellweatherGarden());
e.push({id:'garden-lightwell',parent:'bellweather-zone',position:[-4.5,0,-3],collider:{shape:'box',halfExtents:[.9,.9,.9],offset:[0,.9,0]}});
part('garden-lightwell-base','cylinder','deepBlue',[0,.25,0],[1.8,.5,1.8],{parent:'garden-lightwell'});
part('garden-lightwell-ring','torus','solarGold',[0,.65,0],[1.6,.13,1.6],{parent:'garden-lightwell'});
part('garden-lightwell-core','sphere','aqua',[0,1.05,0],[.55,.55,.55],{parent:'garden-lightwell'});
for(let i=0;i<5;i++){const a=i*Math.PI*2/5;part(`garden-petal-${i}`,'sphere','rose',[Math.cos(a)*1.05,1.05,Math.sin(a)*1.05],[.34,.65,.25],{parent:'garden-lightwell',enabled:false,rotation:[0,-a*180/Math.PI,35]});}
e.push({id:'skybridge-relay',parent:'bellweather-zone',position:[4.5,0,-3.5],collider:{shape:'box',halfExtents:[.75,1,.75],offset:[0,1,0]}});
part('skybridge-relay-plinth','cylinder','porcelain',[0,.4,0],[1.5,.8,1.5],{parent:'skybridge-relay'});
part('skybridge-relay-fork-a','box','deepBlue',[-.52,1.5,0],[.24,2.2,.32],{parent:'skybridge-relay',rotation:[0,0,18]});
part('skybridge-relay-fork-b','box','deepBlue',[.52,1.5,0],[.24,2.2,.32],{parent:'skybridge-relay',rotation:[0,0,-18]});
part('skybridge-relay-eye','sphere','solarGold',[0,2.35,0],[.46,.46,.46],{parent:'skybridge-relay'});
e.push(...eventLink('garden-signal-trace',[-4.5,1.5,7],[-3.5,1.15,-7],{material:'aqua',segments:14,radius:.23,enabled:false}));
e.push(...eventLink('skybridge-signal-trace',[4.5,2.35,6.5],[8,10.8,-13],{material:'solarGold',segments:14,radius:.23,enabled:false}));

/* A delivery has a recipient and a persistent outcome, not an endless patrol.
   Staging stays package data; shared timeline moves/cues perform the handoff. */
addTo('bellweather-zone',companionRobot('bellworker-a',[-3.8,0,-4],{color:'wood',height:1.15}));
addTo('bellweather-zone',companionRobot('bellworker-b',[1.8,0,-4],{color:'leaf',round:true,height:1.05}));
for(const [id,parent,position] of [
  ['bellworker-a-parcel','bellworker-a',[.65,.65,.2]],
  ['bellworker-b-parcel','bellworker-b',[-.95,.65,.2]]
])e.push(...deliveryParcel(id,parent,position).map(item=>item.id.endsWith('-book')||item.id==='bellworker-b-parcel'?{...item,enabled:false}:item));

/* A close social triangle gives the shared lantern a visible recipient.
   Distinct silhouettes and breathing room keep each friend legible on phones. */
const companionShell={plate:'heroShell',frame:'heroFrame',visor:'companionVisor',eyes:'companionEyes',trim:'solarGold'};
addTo('bellweather-zone',companionRobot('singer',[1.8,0,2],{color:'companionCoral',height:2,shell:companionShell,solid:true}));
addTo('bellweather-zone',companionRobot('friend-a',[-2.2,0,-2],{color:'companionTeal',round:true,height:1.5,shell:companionShell,solid:true}));
e.push({id:'friendship-lantern',position:[1.9,1.2,10.7]});
part('friendship-lantern-core','sphere','aqua',[0,0,0],[.62,.62,.62],{parent:'friendship-lantern'});
part('friendship-lantern-orbit','torus','solarGold',[0,0,0],[1,.11,1],{parent:'friendship-lantern',rotation:[75,0,25]});
part('friendship-lantern-tail','cone','porcelain',[0,-.65,0],[.25,.65,.25],{parent:'friendship-lantern'});
for(const [i,color] of ['gold','teal','coral'].entries())part('friendship-light-'+i,'sphere',color,[(i-1)*.19,0,.32],[.15,.19,.08],{parent:'friendship-lantern'});
part('mira-tap-a','sphere','solarGold',[3.88,2.52,-2.32],[.24,.24,.24],{parent:'bellweather-zone',enabled:false});
part('mira-tap-b','sphere','solarGold',[4.15,2.78,-2.32],[.2,.2,.2],{parent:'bellweather-zone',enabled:false});
part('tavi-mirror','torus','aqua',[-3.9,.95,-.1],[.65,.12,.65],{parent:'bellweather-zone',enabled:false,rotation:[45,0,0]});

/* The playable prison is materially larger and calmer than the rejected square. */
// The phone follow camera sits behind Zip; keep the room floor under that eye.
part('prison-floor','box','prison',[0,-.1,7],[18,.2,32],{parent:'prison-zone'});
part('prison-back-left','box','dark',[-6.1,4,-8.3],[5.8,8,.35],{parent:'prison-zone',collider:{shape:'box'}});
part('prison-back-right','box','dark',[6.1,4,-8.3],[5.8,8,.35],{parent:'prison-zone',collider:{shape:'box'}});
part('prison-back-top','box','dark',[0,7.5,-8.3],[6.4,1,.35],{parent:'prison-zone',collider:{shape:'box'}});
part('prison-left','box','dark',[-9,4,-.2],[.35,8,16],{parent:'prison-zone',collider:{shape:'box'}});
part('prison-right','box','dark',[9,4,-.2],[.35,8,16],{parent:'prison-zone',collider:{shape:'box'}});
part('prison-ceiling-beam-a','box','indigo',[-4.6,7.4,-1],[.3,.3,14],{parent:'prison-zone'});
part('prison-ceiling-beam-b','box','indigo',[4.6,7.4,-1],[.3,.3,14],{parent:'prison-zone'});
part('prison-light-a','sphere','blueGlow',[-6.8,5.3,-6.8],[.35,.35,.35],{parent:'prison-zone'});
part('prison-light-b','sphere','blueGlow',[6.8,5.3,-6.8],[.35,.35,.35],{parent:'prison-zone'});
addTo('prison-zone',gate('moon',[0,0,-7],{width:6,height:7,color:'gold',symbol:'moon',symbolHeight:3.1,symbolSize:2.2}));
addTo('prison-zone',gate('sun',[6.3,0,-11],{width:2.2,height:3.2,color:'rose',symbol:'sun',symbolSize:1.1}));
addTo('prison-zone',gate('star',[0,0,-18],{width:4.2,height:5.2,color:'teal',symbol:'star',symbolHeight:2.1,symbolSize:1.4}));
e.find(entity=>entity.id==='star-label').position=[0,2.2,.35];
part('route-floor','box','prison',[0,-.1,-14],[18,.2,16],{parent:'prison-zone',enabled:false});
for(const side of [-1,1])part('route-wall-'+side,'box','dark',[side*9,4,-14],[.35,8,16],{parent:'prison-zone',enabled:false,collider:{shape:'box'}});
// A receiver beyond the exit provides a visible destination for the final signal.
e.push({id:'friend-signal',parent:'prison-zone',position:[0,1.4,-20.4],enabled:false});
part('friend-signal-shell','box','teal',[0,0,0],[1.5,1.1,.3],{parent:'friend-signal'});
part('friend-signal-post','cylinder','ink',[0,-.95,0],[.16,1.1,.16],{parent:'friend-signal'});
part('friend-signal-foot','box','teal',[0,-1.34,0],[.9,.12,.6],{parent:'friend-signal'});
part('friend-signal-screen','box','blueGlow',[0,.05,.18],[1.15,.65,.06],{parent:'friend-signal',motion:{type:'pulse',amplitude:.08,speed:1.2}});
part('friend-signal-reply-light','sphere','coral',[0,.75,.12],[.23,.23,.23],{parent:'friend-signal',enabled:false,motion:{type:'pulse',amplitude:.12,speed:1.1}});
for(const side of [-1,1])part('friend-signal-eye-'+side,'sphere','ink',[side*.23,.08,.23],[.13,.13,.06],{parent:'friend-signal'});
e.push({id:'friend-signal-label',parent:'friend-signal',position:[0,1.05,.2]});
/* Three separate dated notices are inspectable around the receiver. */
for(const [side,x,tilt] of [['a',-1.62,12],['b',0,-5],['c',1.62,-12]]){
  part('relay-note-'+side,'box','paper',[x,.62,.14],[.58,.7,.05],{parent:'friend-signal',rotation:[6,tilt,0],enabled:false});
  part('relay-note-'+side+'-pin','sphere','gold',[x,.97,.17],[.06,.06,.05],{parent:'friend-signal'});
  e.push({id:'relay-note-'+side+'-label',parent:'relay-note-'+side,position:[0,.5,0]});
}
part('tutorial-route-open','box','mint',[0,.02,-12.4],[4,.04,10],{parent:'prison-zone',enabled:false});

function routeBoard(id,position,rotation,material,accent){
  e.push({id,parent:'prison-zone',position,rotation:[0,rotation,0],collider:{shape:'box',halfExtents:[1.6,1.35,.28],offset:[0,1.35,0]}});
  part(id+'-post','cylinder','wood',[0,.72,0],[.11,1.45,.11],{parent:id});
  part(id+'-board','box',material,[0,1.6,0],[3.1,1.5,.14],{parent:id});
  part(id+'-cap','box',accent,[0,2.3,.08],[3.15,.13,.12],{parent:id});
  part(id+'-pin-a','sphere','gold',[-1.16,1.6,.16],[.08,.08,.05],{parent:id});
  part(id+'-pin-b','sphere','gold',[1.16,1.6,.16],[.08,.08,.05],{parent:id});
  e.push({id:id+'-label',parent:id,position:[0,2.6,0]});
}
routeBoard('notice-old',[-6.2,0,-11.5],20,'wood','gold');
routeBoard('notice-parade',[7.3,0,-10.8],-20,'rose','pinkGlow');
routeBoard('notice-today',[6.0,0,-16.2],-12,'teal','mint');
e.find(entity=>entity.id==='notice-parade-label').position=[0,-.5,0];
e.find(entity=>entity.id==='notice-today-label').position=[0,-1.1,0];
addTo('prison-zone',messageMachine('socket',[-3.5,0,2]));
addTo('prison-zone',tokenTrack('words',[-3.5,1.3,4.5],4));
// The first mission has its own reachable speech station. The tutorial socket is
// behind the Moon door; anchoring mission controls to it strands them off-camera.
addTo('prison-zone',messageMachine('route-machine',[-3,0,-15]));
part('cable','box','gold',[-2,.15,2.6],[2.4,.1,.12],{parent:'prison-zone',rotation:[0,-18,0]});
part('loose-plug','sphere','mint',[-1,.3,3],[.4,.4,.4],{parent:'prison-zone'});
part('wrong-ring','torus','rose',[0,.12,-10.8],[2.1,.1,2.1],{parent:'prison-zone',enabled:false});
part('reunion-ring','torus','mint',[0,.13,2.4],[2.2,.07,2.2],{parent:'prison-zone',enabled:false});
part('route-glow','box','mint',[0,.08,-15.2],[1.8,.04,5.2],{parent:'prison-zone',enabled:false});
part('friend-cube','box','rose',[7,.7,4.8],[.8,.8,.8],{parent:'prison-zone',collider:{shape:'box'}});
part('friend-heart-a','sphere','paper',[-.12,.08,.42],[.22,.22,.05],{parent:'friend-cube'});
part('friend-heart-b','sphere','paper',[.12,.08,.42],[.22,.22,.05],{parent:'friend-cube'});
part('friend-heart-tip','cone','paper',[0,-.08,.42],[.4,.32,.05],{rotation:[180,0,0],parent:'friend-cube'});

/* A black visual field makes the teleport land as a limbo beat before the
   prison geometry is revealed. The beat still carries its story spatially:
   a last fragment of ground underfoot, the dead lantern, and Bellweather's
   broken silhouettes — the caption is not the only carrier (review 210a663). */
part('limbo-backdrop','box','void',[0,0,-44],[160,160,.4],{enabled:false});
const limboProps=['limbo-isle','limbo-rim','limbo-shard-a','limbo-shard-b','limbo-lantern','limbo-ember'];
part('limbo-isle','cylinder','stone',[0,-.34,-28],[3.4,.5,3.4],{enabled:false});
part('limbo-rim','cylinder','gold',[0,-.6,-28],[3.7,.06,3.7],{enabled:false});
part('limbo-shard-a','box','dark',[-8.5,1.6,-37],[1.5,7,.9],{enabled:false,rotation:[4,0,16]});
part('limbo-shard-b','box','dark',[9.2,.8,-39],[2.4,4.4,.8],{enabled:false,rotation:[0,0,-11]});
e.push(...lantern('limbo-lantern',[1.7,.2,-26.6],{scale:.6,color:'paper'}).map(item=>({enabled:false,...item})));
part('limbo-ember','sphere','blueGlow',[1.7,.34,-26.4],[.1,.1,.1],{enabled:false,motion:{type:'pulse',amplitude:.05,speed:.8}});

/* One protagonist, used in story and gameplay. */
e.push({id:'zip',asset:'robot',position:[0,0,-28],scale:[.9,.9,.9],animation:'idle'});
e.push({id:'zip-identity',parent:'zip',position:[0,2.15,0]});
e.push(...capabilitySocket('zip-voice-socket',[0,1,.49],{parent:'zip'}));
e.push(...capabilityModule('zip-voice',[0,1,.5],{parent:'zip',enabled:false}));
e.push(...speechBubble('zip-speech',[.95,3.35,.6],{parent:'zip',scale:.9}));
e.push(...speechBubble('mira-speech',[-1.1,3.15,.4],{parent:'singer',scale:.9,ink:'coral'}));
e.push(...speechBubble('zip-silence',[.95,3.35,.6],{parent:'zip',scale:.9,failed:true,ink:'rose'}));
e.push(...eventLink('zip-speech-link',[0,1,.6],[.55,2.8,.6],{material:'mint',segments:4,radius:.09,enabled:false}).map((item,i)=>i===0?{...item,parent:'zip'}:item));
const speechMarks=['zip-speech','mira-speech','zip-silence','zip-speech-link'];

/* Reusable dramatic interruption primitives. */
e.push({id:'rift',position:[0,6.2,8],enabled:false});
for(const [i,x,y,length,angle,material] of [
  [0,.05,2.5,1.35,-8,'glow'],
  [1,-.18,1.35,1.25,13,'blueGlow'],
  [2,.12,.25,1.15,-11,'glow'],
  [3,-.08,-.8,1.15,10,'blueGlow'],
  [4,.18,-1.85,1.2,-14,'glow']
])part('rift-segment-'+i,'box',material,[x,y,0],[.16,length,.14],{parent:'rift',rotation:[0,0,angle]});
part('rift-branch-a','box','blueGlow',[.62,1.1,0],[1.25,.12,.1],{parent:'rift',rotation:[0,0,34]});
part('rift-branch-b','box','blueGlow',[-.62,-.55,0],[1.05,.11,.1],{parent:'rift',rotation:[0,0,-38]});
part('rift-branch-c','box','glow',[.48,-2.05,0],[.8,.1,.09],{parent:'rift',rotation:[0,0,30]});
part('storm-flash','sphere','glow',[0,12,8],[6,2,6],{enabled:false});

/* The antagonist is deliberately unlike the protagonist silhouette. */
e.push({id:'warden',position:[4,0,-31],enabled:false});
part('warden-cape','cone','indigo',[0,1.1,0],[2.1,2.8,1.25],{parent:'warden'});
part('warden-chest','box','ink',[0,1.8,.1],[1.25,1.5,.72],{parent:'warden'});
part('warden-head','box','ink',[0,3,0],[1.35,.85,1],{parent:'warden'});
part('warden-eye','box','redGlow',[0,3.05,.53],[.88,.11,.06],{parent:'warden'});
part('warden-crown','cone','gold',[0,3.75,0],[.82,.82,.68],{parent:'warden'});
part('warden-hand','box','gold',[-1,1.8,.18],[.34,.9,.38],{parent:'warden'});
e.push(...eventLink('warden-rift-link',[0,6.5,7.8],[-.3,9.8,8.3],{material:'redGlow',segments:16,radius:.26,enabled:false}));
e.push(...capabilityModule('stolen-voice',[0,1.1,-27.5],{enabled:false}));
e.push(...eventLink('voice-extract-link',[0,1.05,-27.5],[.8,1.7,-27.98],{material:'redGlow',segments:12,radius:.22,enabled:false}));

const revealGroups=[
  ['prison-floor'],
  ['prison-back-left','prison-back-right','prison-back-top','prison-left','prison-right','prison-ceiling-beam-a','prison-ceiling-beam-b'],
  ['prison-light-a','prison-light-b','moon'],
  ['socket','words','cable','loose-plug','friend-cube']
];
const revealParts=revealGroups.flat();

export const worldSpec={schemaVersion:'1',id:'bellweather-first-words',version:'18',
  batchGroups:{scenery:{maxAabbSize:40}},
  geometries:gardenGeometries,
  textures:gardenTextures,
  environment:{clearColor:'#a3c9eb',ambient:'#9fa8bf',exposure:1.05,toneMapping:'aces',fog:{type:'linear',color:'#c4d8e9',start:42,end:155}},
  materials:{stone:{diffuse:'#d8b997'},paper:{diffuse:'#f9dfba'},gold:{diffuse:'#ce9d53',gloss:.45},coral:{diffuse:'#d67a69'},ink:{diffuse:'#273144'},indigo:{diffuse:'#4c5276'},rock:{diffuse:'#717b91'},teal:{diffuse:'#548e89'},rose:{diffuse:'#c87678'},leaf:{diffuse:'#477765'},mint:{diffuse:'#91d2af',emissive:'#60a990',emissiveIntensity:.25},wood:{diffuse:'#795755'},glow:{diffuse:'#ffe5ad',emissive:'#ffc97c',emissiveIntensity:1.25},pinkGlow:{diffuse:'#ffa58c',emissive:'#e88c70',emissiveIntensity:.8},redGlow:{diffuse:'#fa9f78',emissive:'#fc705c',emissiveIntensity:1.25},cloud:{diffuse:'#efd7cc'},haze:{diffuse:'#bda8bc'},dark:{diffuse:'#20283a'},prison:{diffuse:'#35445d'},blueGlow:{diffuse:'#9fdcff',emissive:'#76bfff',emissiveIntensity:1.8},void:{diffuse:'#070b12'},porcelain:{diffuse:'#f3e6d7',gloss:.48},sunstone:{diffuse:'#dcbfa9',gloss:.4},solarGold:{diffuse:'#f6c770',emissive:'#b9842c',emissiveIntensity:.36,metalness:.25,gloss:.75},deepBlue:{diffuse:'#223b70',gloss:.5},aqua:{diffuse:'#77e3df',emissive:'#46c5cc',emissiveIntensity:.72,gloss:.62}},
  assets:{robot:{type:'container',src:'/assets/quaternius-animated-robot.glb',transform:{position:[0,-.08,0],scale:[.52,.52,.52]},animations:{idle:'RobotArmature|Robot_Standing',run:'RobotArmature|Robot_Running',yes:'RobotArmature|Robot_Yes',no:'RobotArmature|Robot_No',wave:'RobotArmature|Robot_Wave'},defaultAnimation:'idle'}},
  entities:e,
  lights:[{id:'sunlight',type:'directional',color:'#ffe0b5',intensity:1.55,rotation:[38,-35,0],castShadows:true,shadowResolution:2048,shadowDistance:45,shadowBias:.15,normalOffsetBias:.08,numCascades:2,shadowFilter:'pcf3'},{id:'sky-light',type:'directional',color:'#a4c8ef',intensity:.45,rotation:[65,145,0]}],
  cameras:{
    home:{position:[4.5,4.6,21],lookAt:[0,3,0],fov:56,portrait:{position:[3,7,26],lookAt:[0,2.2,3],fov:58}},
    gardenReveal:{position:[-7,6,19],lookAt:[-2,2,-7],fov:53,portrait:{position:[-4,6,21],lookAt:[-1,1.5,6],fov:58}},
    skybridgeReveal:{position:[8,6,19],lookAt:[2,2,-7],fov:53,portrait:{position:[-4,5.5,18.5],lookAt:[1.4,1.5,6],fov:58}},
    gardenDestination:{position:[-9,4.7,.5],lookAt:[-3.5,.9,-8.5],fov:52,portrait:{position:[-7.5,5,3],lookAt:[-3.5,1.1,-8.5],fov:54}},
    skybridgeDestination:{position:[14,14,-27],lookAt:[10,9,-10],fov:53,portrait:{position:[14,14,-29],lookAt:[9,8.5,-11],fov:50}},
    rupture:{position:[11,9,26],lookAt:[0,2,9],fov:48,portrait:{position:[7,12,31],lookAt:[0,2,9],fov:48}},
    limbo:{position:[3.6,2.3,-23.6],lookAt:[0,1.15,-28],fov:44,portrait:{position:[3,3.4,-24],lookAt:[0,1.15,-28],fov:48}},
    reveal:{position:[1,8,-16],lookAt:[0,2,-33],fov:52,portrait:{position:[1,13,-5],lookAt:[0,3,-32],fov:50}},
    theft:{position:[2.5,4,-18],lookAt:[1.2,1.7,-29],fov:44,portrait:{position:[2.5,6,-14],lookAt:[1.2,1.7,-29],fov:44}}
  },
  states:{arrival:{camera:'reveal'}},
  player:characterControlProfile({entity:'zip',spawn:[0,0,-28],speed:3.2,surfaces:[
    {bounds:[-7.5,7.5,3.5,17],height:0,whenVisible:'bellweather-zone'},
    {bounds:[-8.2,8.2,-38,-24],height:0},
    {bounds:[-8.2,8.2,-52,-38],height:0,whenVisible:'tutorial-route-open'}
  ],animations:{idle:'idle',move:'run'},animationSpeeds:{idle:0,move:1},
    body:{radius:.34,height:1.55},
    camera:{yaw:0,pitch:25,distance:8,portraitDistance:14,minDistance:4,maxDistance:18,targetHeight:1.2,inspectCharacter:true}})
};

Object.assign(worldSpec.materials,gardenMaterials);
Object.assign(worldSpec.assets,gardenAssets);
worldSpec.assets.robot.materialOverrides={Main:'heroShell',Grey:'heroFrame',Black:'heroJoint'};

const chamberEnvironment={clearColor:'#0c1220',ambient:'#46536b',exposure:.85,fog:{type:'linear',color:'#34415a',start:20,end:88}};
const missionBase=()=>({
  environment:chamberEnvironment,
  show:['zip','prison-zone','sun','star',...revealParts],
  hide:[...speechMarks,'bellweather-zone','bellweather-sky','friendship-lantern','garden-signal-trace','skybridge-signal-trace','limbo-backdrop','rift','storm-flash','warden','stolen-voice','wrong-ring','reunion-ring','route-glow','tutorial-route-open','notice-old','notice-parade','notice-today','relay-note-a','relay-note-b','relay-note-c','friend-signal-reply-light','route-machine','zip-voice','socket-core','socket-ring',...limboProps,...Array.from({length:4},(_,i)=>`words-piece-${i}`)],
  transforms:{'moon-door':{position:[0,0,0]},'sun-door':{position:[0,0,0]},'star-door':{position:[0,0,0]},zip:{position:[0,0,-28]}},
  animations:{zip:'idle'}
});

// Authored static gestures stay legible in reduced motion. These use the shared
// transform patch, with no new animation system or claim about motion quality.
const partnerGestures={
  rest:{...companionPose('singer',{height:2}),...companionPose('friend-a',{height:1.5,round:true})},
  garden:{...companionPose('singer',{height:2,hands:{'-1':[-.78,1.75,.28],1:[.6,1.2,.35]}}),...companionPose('friend-a',{height:1.5,round:true,hands:{'-1':[-.9,.95,.4],1:[.65,.9,.25]}})},
  skybridge:companionPose('singer',{height:2,hands:{'-1':[-.6,1.25,.3],1:[.58,2.18,.18]}})
};
function opening(beat,playerStart=[0,0,10],choiceTarget=null){
  const responsePose=choiceTarget==='garden-lightwell'?{mira:[-.4,0,-1.4],tavi:[-3,0,-.5],signal:[-4.5,2.3,7]}:
    choiceTarget==='skybridge-relay'?{mira:[3.3,0,-2.5],tavi:[-2.2,0,-2],signal:[4.5,2.9,6.5]}:
    {mira:[1.8,0,2],tavi:[-2.2,0,-2],signal:[1.9,1.2,10.7]};
  const p={show:['zip',...revealParts],hide:['bellweather-zone','bellweather-sky','prison-zone','friendship-lantern','garden-signal-trace','skybridge-signal-trace','mira-tap-a','mira-tap-b','tavi-mirror','garden-receiver-beacon','garden-receiver-arrival',...[-1,1].flatMap(side=>[`skybridge-receiver-light-${side}`,`skybridge-receiver-arrival-${side}`]),...Array.from({length:5},(_,i)=>`garden-petal-${i}`),'limbo-backdrop','rift','storm-flash','warden','warden-rift-link','voice-extract-link','stolen-voice','zip-voice'],transforms:{zip:{position:playerStart},singer:{position:beat>0?responsePose.mira:[1.8,0,2]},'friend-a':{position:beat>0?responsePose.tavi:[-2.2,0,-2]},'friendship-lantern':{position:beat>0?responsePose.signal:[1.9,1.2,10.7]},'moon-door':{position:[0,0,0]}},animations:{zip:'idle'}};
  p.hide.push(...speechMarks,'sun','star','route-machine','notice-old','notice-parade','notice-today','tutorial-route-open','wrong-ring','reunion-ring','route-glow',...limboProps);
  Object.assign(p.transforms,partnerGestures.rest,beat>0?(choiceTarget==='garden-lightwell'?partnerGestures.garden:choiceTarget==='skybridge-relay'?partnerGestures.skybridge:{}):{});
  // Explicitly restore the cast after a prior rupture/replay hid individuals.
  p.show.push('singer','friend-a','bellworker-a','bellworker-b','bellworker-b-parcel');
  p.hide.push('bellworker-a-parcel');
  Object.assign(p.transforms,{'bellworker-a':{position:[-3.8,0,-4]},'bellworker-b':{position:[1.8,0,-4]},'bellworker-b-parcel':{position:[0,.8,.55]}});
  if(beat===0){
    p.camera='home';p.environment={...openingEnvironment};p.show.push('bellweather-zone','bellweather-sky','zip-voice','friendship-lantern');p.hide=p.hide.filter(id=>id!=='bellweather-sky');p.animations.zip='wave';
    p.playerCheckpoint={id:'opening-terrace',position:[0,0,10],pitch:14,distance:9};
    p.show=p.show.filter(id=>id!=='bellworker-b-parcel');p.hide=p.hide.filter(id=>id!=='bellworker-a-parcel');
    p.show.push('bellworker-a-parcel');p.hide.push('bellworker-b-parcel');
    p.transforms['bellworker-a']={position:[-3.8,0,-4]};p.transforms['bellworker-b-parcel']={position:[-.95,.65,.2]};
    p.timeline={duration:4600,moves:[
      {entity:'friendship-lantern',from:[1.9,1.2,10.7],to:[1.25,1.7,10.7],at:600,duration:1100},
      {entity:'transit-pod',from:[10,7.6,-12],to:[20,7.6,-12],at:300,duration:3400},
      {entity:'bellworker-a',from:[-3.8,0,-4],to:[.2,0,-4],at:100,duration:1800},
      {entity:'bellworker-b-parcel',from:[-.95,.65,.2],to:[0,.8,.55],at:2000,duration:700},
      {entity:'bellworker-a',from:[.2,0,-4],to:[-3.8,0,-4],at:2800,duration:1500}
    ],cues:[
      {at:400,patch:{show:['zip-speech','zip-speech-link']}},
      {at:1600,patch:{show:['mira-speech'],hide:['zip-speech','zip-speech-link'],animations:{zip:'yes'}}},
      {at:2000,patch:{show:['bellworker-b-parcel'],hide:['bellworker-a-parcel']}},
      {at:2600,patch:{show:['zip-speech','zip-speech-link']}}
    ],finish:{show:['zip-speech','mira-speech','zip-speech-link','bellworker-b-parcel'],hide:['bellworker-a-parcel'],animations:{zip:'idle'}}};
  }else if(beat===1){
    p.camera='rupture';p.environment={clearColor:'#151d30',ambient:'#665d68',exposure:1.0,fog:{type:'linear',color:'#72788c',start:32,end:110}};
    p.show.push('bellweather-zone','zip-voice','friendship-lantern','warden');p.animations.zip='no';
    p.transforms['friendship-lantern']={position:choiceTarget?responsePose.signal:[0,3.7,12]};
    p.transforms.warden={position:[0,2.8,7.0],scale:[.72,.72,.72]};
    p.timeline={duration:1800,moves:[
      {entity:'warden',from:[0,2.8,7.0],to:[0,3.7,7.7],at:150,duration:900}
    ],cues:[
      {at:600,patch:{show:['warden-rift-link'],animations:{zip:'no',singer:'no','friend-a':'no'}}},
      {at:1050,patch:{environment:{clearColor:'#10172a',ambient:'#4a5068',exposure:.9,fog:{type:'linear',color:'#4e5c79',start:24,end:86}}}}
    ]};
  }else if(beat===2){
    p.camera='rupture';p.environment={clearColor:'#10172a',ambient:'#4a5068',exposure:.9,fog:{type:'linear',color:'#4e5c79',start:24,end:86}};
    p.show.push('bellweather-zone','zip-voice','warden','warden-rift-link');p.animations.zip='no';
    p.transforms.warden={position:[0,3.7,7.7],scale:[.72,.72,.72]};
    p.timeline={duration:4000,moves:[
      {entity:'bellworker-a',from:[-3.8,0,-4],to:[-.8,3.8,7.4],at:900,duration:1500},
      {entity:'bellworker-b',from:[1.8,0,-4],to:[.9,4.1,7.5],at:950,duration:1450},
      {entity:'zip',from:playerStart,to:[0,4.7,8],at:1050,duration:1300},
      {entity:'singer',from:responsePose.mira,to:[1.1,5.4,7.5],at:950,duration:1400},
      {entity:'friend-a',from:responsePose.tavi,to:[-1.1,4.6,7.2],at:950,duration:1400}
    ],cues:[
      {at:220,patch:{show:['rift','storm-flash'],cameraImpulse:{duration:760,intensity:10},environment:{clearColor:'#e8f4ff',ambient:'#d6e8ff',exposure:2.15,fog:{type:'linear',color:'#b8d5ef',start:18,end:68}}}},
      {at:520,patch:{environment:{clearColor:'#07101f',ambient:'#222d49',exposure:.62,fog:{type:'linear',color:'#263650',start:18,end:72}}}},
      {at:800,patch:{hide:['storm-flash']}},
      {at:850,patch:{animations:{singer:'no','friend-a':'no'}}},
      {at:1300,patch:{hide:['warden-rift-link']}},
      {at:2450,patch:{hide:['singer','friend-a','bellworker-a','bellworker-b']}},
      {at:2900,patch:{hide:['zip']}},
      {at:3350,patch:{hide:['warden']}}
    ],finish:{hide:['storm-flash','zip','singer','friend-a','bellworker-a','bellworker-b','warden','warden-rift-link'],environment:{clearColor:'#03060d',ambient:'#111827',exposure:.35,fog:{type:'none'}}}};
  }else if(beat===3){
    p.camera='limbo';p.environment={clearColor:'#02040a',ambient:'#181d2a',exposure:.45,fog:{type:'none'}};p.show.push('limbo-backdrop','zip-voice',...limboProps);p.transforms.zip={position:[0,0,-28]};p.animations.zip='idle';
  }else if(beat===4){
    p.camera='reveal';p.environment={clearColor:'#070b12',ambient:'#2b354a',exposure:.72,fog:{type:'linear',color:'#202a3b',start:18,end:82}};p.show=p.show.filter(id=>!revealParts.includes(id));
    p.show.push('prison-zone','zip-voice','limbo-backdrop');p.hide.push(...revealParts);
    p.transforms.zip={position:[0,0,-28]};
    p.timeline={duration:3000,cues:revealGroups.map((show,i)=>({at:250+i*750,patch:{show}})),finish:{hide:['limbo-backdrop']}};
  }else if(beat===5){
    p.camera='theft';p.environment={clearColor:'#080b13',ambient:'#332b3b',exposure:.68,fog:{type:'linear',color:'#26283a',start:16,end:76}};
    p.show.push('prison-zone','warden','zip-voice','voice-extract-link');
    p.transforms.zip={position:[0,0,-28]};p.transforms.warden={position:[1.4,0,-28],scale:[1,1,1]};p.animations.zip='no';
    p.timeline={duration:1500,moves:[{entity:'warden',from:[5,0,-33],to:[1.4,0,-28],duration:1200}],finish:{show:['zip-speech','zip-speech-link'],animations:{zip:'no'}}};
  }else if(beat===6){
    p.camera='theft';p.environment={clearColor:'#080b13',ambient:'#332b3b',exposure:.68,fog:{type:'linear',color:'#26283a',start:16,end:76}};
    p.show.push('prison-zone','warden','stolen-voice','voice-extract-link');p.hide.push('zip-voice');
    p.transforms.zip={position:[0,0,-28]};p.transforms.warden={position:[1.4,0,-28],scale:[1,1,1]};
    p.transforms['stolen-voice']={position:[0,1,-27.5]};p.animations.zip='no';
    p.timeline={duration:3000,moves:[
      {entity:'stolen-voice',from:[0,1,-27.5],to:[1.55,2,-28.45],at:250,duration:1200},
      {entity:'warden',from:[1.4,0,-28],to:[3,0,-34],at:1550,duration:1200},
      {entity:'stolen-voice',from:[1.55,2,-28.45],to:[2.15,1.9,-33.8],at:1550,duration:1200}
    ],cues:[{at:1350,patch:{hide:['voice-extract-link']}},{at:2750,patch:{show:['zip-silence'],animations:{zip:'wave'}}}],finish:{show:['zip-silence'],hide:['voice-extract-link'],animations:{zip:'wave'}}};
  }else{
    p.camera='reveal';p.environment={clearColor:'#0c1220',ambient:'#46536b',exposure:.85,fog:{type:'linear',color:'#34415a',start:20,end:88}};p.show.push('prison-zone');p.transforms.zip={position:[0,0,-28]};p.animations.zip='idle';
  }
  return p;
}

function present(s,prev){
  if(typeof s==='number'||Number.isInteger(s?.storyBeat))return opening(typeof s==='number'?s:s.storyBeat,s?.playerStart,s?.choiceTarget);
  const p=missionBase();
  // The shared control owns the actor between authored chapter checkpoints.
  // Puzzle renders must not snap the visible actor back to the original spawn.
  delete p.transforms.zip;
  if(s.round===0&&s.status!=='success'){
    p.show=p.show.filter(id=>!['star','sun'].includes(id));
    p.hide.push('star','sun');
  }
  p.playerCheckpoint={id:s.round===0?'repair-chamber':'route-corridor',position:s.round===0?[0,0,-28]:[0,0,-43]};
  p.hide.push('route-floor','route-wall--1','route-wall-1','friend-signal');
  if(s.powered)p.show.push('zip-voice','socket-core','socket-ring');
  for(let i=0;i<(s.pieces||0);i++)p.show.push(`words-piece-${i}`);
  const tutorialComplete=s.round===1||s.status==='success';
  if(tutorialComplete){p.transforms['moon-door']={position:[0,7.8,0]};p.show.push('tutorial-route-open','zip-voice','route-floor','route-wall--1','route-wall-1');}
  if(s.round===1){
    // Recompose the existing three gate roots at the mission junction. Their
    // marks are equally visible before inference; the source words decide.
    p.transforms.moon={position:[-3.4,0,-17.8],scale:[.62,.74,1]};
    p.transforms.sun={position:[3.4,0,-17.8]};
    p.transforms['moon-door']={position:[0,0,0]};
    p.show.push('route-machine');
    if(s.status!=='success')p.show.push('notice-old','notice-parade','notice-today');
  }
  // The relay is played at the receiver: each dated source remains inspectable.
  if(s.relay_stage&&s.relay_stage!=='none')p.show.push('relay-note-a','relay-note-b',...(s.relay_inference!==undefined?['relay-note-c']:[]));
  if(s.relay_stage==='done')p.show.push('friend-signal-reply-light');
  if(s.status==='wrong'){
    p.show.push('wrong-ring');p.animations.zip='no';
    p.transforms['wrong-ring']={position:s.round===1?[-3.4,.12,-17]:[6,.12,-11]};
    if(!s.round)p.transforms['sun-door']={position:[0,3.8,0]};
  }
  if(s.status==='success'){
    if(s.round===0){
      p.show.push('reunion-ring','tutorial-route-open');p.animations.zip='yes';
      if(prev?.status!=='success')p.timeline={duration:2500,moves:[{entity:'moon-door',from:[0,0,0],to:[0,7.8,0],duration:1200}],cues:[{at:1250,patch:{show:['tutorial-route-open'],animations:{zip:'yes'}}}],finish:{animations:{zip:'idle'}}};
    }else{
      p.show.push('route-glow','tutorial-route-open','friend-signal');p.transforms['star-door']={position:[0,6.5,0]};p.animations.zip='yes';
      if(prev?.status!=='success')p.timeline={duration:2600,moves:[{entity:'star-door',from:[0,0,0],to:[0,6.5,0],duration:1300}],finish:{animations:{zip:'yes'}}};
    }
  }
  return p;
}

const pkg=makeWorldPackage(worldSpec,(state,previous)=>{
  const patch=present(state,previous);
  patch.show=[...new Set(patch.show||[])];
  patch.hide=[...new Set((patch.hide||[]).filter(id=>!patch.show.includes(id)))];
  return patch;
},{cinematic:true});
export const gameWorldManifest=pkg.gameWorldManifest;
export const createGameWorld=pkg.createGameWorld;


export const controlTutorialSpec={
  id:'first-words-core-controls',version:'3',skipAllowed:true,
  handoff:{
    from:'opening',to:'tutorial',playerRole:'direct protagonist',
    goal:'Take control and learn the three controls needed before the first repair.'
  },
  steps:[
    {
      id:'move',skill:'move protagonist',observe:'move',focus:'move',
      success:'protagonist position changed',
      title:'You control Zip now.',
      instructions:{
        desktop:'Press W, A, S, D or the arrow keys on your keyboard. Make Zip take a few steps.',
        touch:'Move the highlighted stick at bottom left. Make Zip take a few steps. Arrow keys work too.'
      }
    },
    {
      id:'look',skill:'look/orbit camera',observe:'look',focus:'look',
      success:'camera yaw or distance changed',
      title:'Now look around as Zip.',
      instructions:{
        desktop:'Drag the highlighted world view to turn the camera. The + / − controls zoom.',
        touch:'Drag the highlighted world view to turn the camera. The + / − controls zoom.'
      }
    },
    {
      id:'menu',skill:'open game menu',observe:'menu',focus:'menu',
      success:'game menu opened',
      title:'One last control: your game menu.',
      instructions:{
        desktop:'Open the highlighted ☰ button. That is where pause, sound and story replay live.',
        touch:'Open the highlighted ☰ button. That is where pause, sound and story replay live.'
      }
    }
  ]
};


export const speechRepairTutorialSpec={
  id:'first-words-speech-repair',version:'1',
  steps:[
    {
      id:'connect',stage:'TUTORIAL · REPAIR 1/4',title:'Restore power to your speech engine.',
      detail:'The loose lead beside the repair station is highlighted. Connect it to wake the engine.',
      feedback:'The repair socket lights and the speech module powers on.',
      when:{round:0,powered:false},success:{powered:true},
      target:'loose-plug',focus:'world',actions:['connect'],primaryAction:'connect',actionLabel:'Connect the power lead'
    },
    {
      id:'scan',stage:'TUTORIAL · REPAIR 2/4',title:'Give the engine the visible clue.',
      detail:'The large exit is marked with a Moon. Scan that lock so the clue becomes part of the engine input.',
      feedback:'The Moon clue appears in the speech-engine input.',
      when:{round:0,powered:true,status:'building',clue:'none'},success:{clue:'moon'},
      target:'moon-label',focus:'world',actions:['scan-moon'],primaryAction:'scan-moon',actionLabel:'Scan the Moon lock'
    },
    {
      id:'build-1',stage:'TUTORIAL · REPAIR 3/4',title:'Build the command one word at a time.',
      detail:'Run the speech engine. The chosen word will become part of the next input.',
      feedback:'The first word appears and becomes part of the next input.',
      when:{round:0,powered:true,status:'building',clue:{neq:'none'},pieces:0},success:{pieces:{gte:1}},
      target:'socket',focus:'world',actions:['step'],primaryAction:'step',actionLabel:'Make first word'
    },
    {
      id:'build-2',stage:'TUTORIAL · REPAIR 3/4',title:'Watch the input grow.',
      detail:'This prepared toy adds whole words. Real models can use smaller tokens and may continue differently. Run it again with Open in the input.',
      feedback:'A second word appears and the input grows again.',
      when:{round:0,powered:true,status:'building',clue:{neq:'none'},pieces:1},success:{pieces:{gte:2}},
      target:'socket',focus:'world',actions:['step'],primaryAction:'step',actionLabel:'Next word'
    },
    {
      id:'build-3',stage:'TUTORIAL · REPAIR 3/4',title:'Keep the same loop going.',
      detail:'Each generated word joins the context used for the following word.',
      feedback:'A third word appears in the growing command.',
      when:{round:0,powered:true,status:'building',clue:{neq:'none'},pieces:2},success:{pieces:{gte:3}},
      target:'socket',focus:'world',actions:['step'],primaryAction:'step',actionLabel:'Next word'
    },
    {
      id:'build-4',stage:'TUTORIAL · REPAIR 3/4',title:'Finish the four-word command.',
      detail:'One more prediction completes the sentence that will be sent to the gate.',
      feedback:'The four-word command is complete.',
      when:{round:0,powered:true,status:'building',clue:{neq:'none'},pieces:3},success:{pieces:{gte:4}},
      target:'socket',focus:'world',actions:['step'],primaryAction:'step',actionLabel:'Next word'
    },
    {
      id:'speak',stage:'TUTORIAL · REPAIR 4/4',title:'Use the completed sentence on the gate.',
      detail:'The four-word command is ready. Speak it to the Moon gate and watch the world respond.',
      feedback:'The Moon gate opens and the route beyond becomes visible.',
      when:{round:0,powered:true,status:'building',pieces:{gte:4}},success:{status:'success'},
      target:'moon-label',focus:'world',actions:['send'],primaryAction:'send',actionLabel:'Speak to gate →'
    },
    {
      id:'complete',stage:'TUTORIAL · COMPLETE',title:'You can speak again.',
      detail:'The first door is open. The real mission now changes the context and removes most of the guidance.',
      feedback:'Level 1 becomes available beyond the opened route.',
      when:{round:0,status:'success'},success:{round:{gte:1}},
      target:'moon-label',focus:'world',actions:['next'],primaryAction:'next',actionLabel:'Begin Level 1 →'
    }
  ]
};

export const openingSpec={
  id:'bellweather.opening.v10',title:'BRING BACK THE WORDS',subtitle:'Prologue',finishLabel:'Take control →',waitForMotion:true,directionVersion:'1',
  scenes:[
    {beat:0,explore:true,preserveActor:true,exploreView:{distance:9,pitch:14,portraitDistance:15.5,portraitPitch:20},audioPhase:'home',kicker:'BELLWEATHER · SIGNAL DAY',title:'A city that answers.',body:'You are Zip. Explore or send a signal.',
      direction:{kind:'establishing',channels:['world','character','camera','interaction','narration'],worldAfter:'Zip may explore a safe living terrace; one activated signal object gets a distinct Mira response and reveals a receiver destination.'},
      markers:[{entity:'zip-identity',label:'ZIP · YOU',offset:[0,-8],hideWhenDone:true},{entity:'singer-head',label:'MIRA',offset:[0,-8],hideWhenDone:true},{entity:'garden-lightwell-core',label:'Wake garden lightwell',target:'garden-lightwell',offset:[0,-12]},{entity:'skybridge-relay-eye',label:'Light skybridge relay',target:'skybridge-relay',offset:[0,-12]}],
      choices:[
        {target:'garden-lightwell',label:'Wake garden lightwell',
          patch:{camera:'gardenReveal',transforms:partnerGestures.garden,show:['garden-signal-trace','tavi-mirror',...Array.from({length:5},(_,i)=>`garden-petal-${i}`)],animations:{zip:'wave'},
            timeline:{duration:2500,moves:[{entity:'friendship-lantern',from:[1.25,1.7,10.7],to:[-4.5,2.3,7],duration:1700},{entity:'singer',from:[1.8,0,2],to:[-.4,0,-1.4],duration:1300},{entity:'friend-a',from:[-2.2,0,-2],to:[-3,0,-.5],duration:1500}],
              cues:[{at:1700,patch:{show:['garden-receiver-beacon','garden-receiver-arrival']}}],
              finish:{show:['garden-receiver-beacon','garden-receiver-arrival'],animations:{zip:'yes'}}}},
          carry:{show:['garden-signal-trace','tavi-mirror','garden-receiver-beacon','garden-receiver-arrival',...Array.from({length:5},(_,i)=>`garden-petal-${i}`)],transforms:{...partnerGestures.garden,singer:{position:[-.4,0,-1.4]},'friend-a':{position:[-3,0,-.5]},'friendship-lantern':{position:[-4.5,2.3,7]}}},
          success:{body:'Mira catches your light. Tavi sends it onward.',dialogue:'Mira: “It answered!”'},
          inspection:{markers:[],target:'garden-receiver',anchor:'garden-receiver-beacon',label:'Look at the shaded terrace',patch:{camera:'gardenDestination'},
            success:{body:'Two shaded seats.',dialogue:'Mira: “Sit with me.”'}}},
        {target:'skybridge-relay',label:'Light skybridge relay',
          patch:{camera:'skybridgeReveal',transforms:partnerGestures.skybridge,show:['skybridge-signal-trace','mira-tap-a','mira-tap-b'],animations:{zip:'wave'},
            timeline:{duration:2400,moves:[{entity:'friendship-lantern',from:[1.25,1.7,10.7],to:[4.5,2.9,6.5],duration:1700},{entity:'singer',from:[1.8,0,2],to:[3.3,0,-2.5],duration:1000}],
              cues:[{at:1700,patch:{show:[...[-1,1].flatMap(side=>[`skybridge-receiver-light-${side}`,`skybridge-receiver-arrival-${side}`])]}}],
              finish:{show:[...[-1,1].flatMap(side=>[`skybridge-receiver-light-${side}`,`skybridge-receiver-arrival-${side}`])],animations:{zip:'yes'}}}},
          carry:{show:['skybridge-signal-trace','mira-tap-a','mira-tap-b',...[-1,1].flatMap(side=>[`skybridge-receiver-light-${side}`,`skybridge-receiver-arrival-${side}`])],transforms:{...partnerGestures.skybridge,singer:{position:[3.3,0,-2.5]},'friend-a':{position:[-2.2,0,-2]},'friendship-lantern':{position:[4.5,2.9,6.5]}}},
          success:{body:'Mira lifts the signal. Two lights answer.',dialogue:'Mira: “Our balcony!”'},
          inspection:{markers:[],target:'skybridge-receiver',anchor:'skybridge-receiver-beacon',label:'Look at the train balcony',patch:{camera:'skybridgeDestination',timeline:{duration:3200,moves:[{entity:'transit-pod',from:[10,7.6,-12],to:[14,7.6,-12],duration:3200}]}},
            success:{body:'Trains pass below.',dialogue:'Mira: “Stay awhile?”'}}}
      ]},
    {beat:1,carryChoiceFrom:0,actorFromChoice:0,audioPhase:'danger',audioCue:'capture',kicker:'ABOVE THE TERRACE',title:'A shadow over Bellweather.',body:'The Warden arrives above the receiver terrace. Its red field reaches toward your lit signal path.',
      direction:{kind:'antagonist-action',cause:{mode:'visible',entity:'warden'},channels:['world','character','camera','vfx','audio','narration'],worldAfter:'The Warden is visibly acting on the sky while Bellweather reacts.'}},
    {beat:2,actorFromChoice:0,audioPhase:'danger',audioCue:'rupture',kicker:'THUNDER ANSWERS',title:'The sky cracks open.',body:'The tear opens where the black machine reached. Zip and the others are pulled into the dark.',
      direction:{kind:'major-event',cause:{mode:'visible',entity:'warden'},channels:['world','character','camera','lighting','vfx','audio','narration'],worldAfter:'Bellweather is disrupted and Zip plus both friends are gone from the square.'}},
    {beat:3,audioPhase:'danger',kicker:'SOMEWHERE ELSE',title:'Silence.',body:'Zip wakes alone. No market. No friends. Bellweather is gone.',
      direction:{kind:'transition',channels:['world','character','camera','lighting','narration'],worldAfter:'Zip is isolated in an unknown dark location.'}},
    {beat:4,audioPhase:'danger',kicker:'THEN THE LIGHTS COME ON',title:'This is not home.',body:'Cold walls. One enormous locked door. No obvious way back.',
      direction:{kind:'transition',channels:['world','camera','lighting','narration'],worldAfter:'The prison chamber and sealed route are spatially established.'},
      markers:[{entity:'moon-label',label:'SEALED EXIT',offset:[0,-8]}]},
    {beat:5,audioPhase:'danger',audioCue:'capture',kicker:'THE WARDEN',title:'It finds your voice.',body:'A red field locks onto the glowing speech module in Zip’s chest.',
      direction:{kind:'antagonist-action',cause:{mode:'visible',entity:'warden'},channels:['world','character','camera','vfx','audio','narration'],worldAfter:'The Warden is visibly targeting the still-attached speech module in Zip’s chest.'}},
    {beat:6,audioPhase:'danger',audioCue:'wrong',kicker:'THE WARDEN',title:'It tears the module free.',body:'The same glowing module leaves the chest socket and moves into the Warden’s grasp.',
      direction:{kind:'antagonist-action',cause:{mode:'visible',entity:'warden'},channels:['world','character','camera','vfx','audio','narration'],worldAfter:'Zip’s chest socket is visibly empty and the removed speech module ends with the Warden.'}},
    {beat:7,audioPhase:'repair',kicker:'ONE THING STILL WORKS',title:'Get the words back.',body:'A repair socket still has power. Restore enough speech to open the door.',
      direction:{kind:'handoff',channels:['world','character','camera','interaction','narration'],worldAfter:'Direct control begins with one clear repair objective and target.'},
      markers:[{entity:'socket',label:'REPAIR SOCKET',offset:[0,-8]}]}
  ]
};
