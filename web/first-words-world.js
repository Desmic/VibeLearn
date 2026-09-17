/* Bellweather / prison proof track: story, composition and semantic presentation. */
import {characterControlProfile} from './game-character-spec.js';
import {messageMachine,tokenTrack,smallTree,pavilion} from './workshop-props.js';
import {lantern,gate,tower,planter} from './rescue-world-props.js';
import {makeWorldPackage} from './spec-game-world.js';

const e=[];
const part=(id,primitive,material,position,scale,extra={})=>e.push({id,primitive,material,position,scale,...extra});
const addTo=(parent,items)=>items.forEach((item,index)=>e.push(index===0?{...item,parent}:item));

/* Two deliberately separate places. Bellweather sells the life that is lost; the
   prison has room for movement, camera orbit and readable focal interactions. */
e.push({id:'bellweather-zone',position:[0,0,10]},{id:'prison-zone',position:[0,0,-32]});
part('bellweather-island','cylinder','stone',[0,-.8,0],[29,1.6,29],{parent:'bellweather-zone'});
part('bellweather-lip','cylinder','gold',[0,-1.62,0],[29.4,.14,29.4],{parent:'bellweather-zone'});
part('bellweather-square','cylinder','paper',[0,.02,0],[16,.08,16],{parent:'bellweather-zone'});
part('bellweather-inlay','torus','gold',[0,.08,0],[12.5,.05,12.5],{parent:'bellweather-zone'});
for(let i=0;i<8;i++)part(`bell-path-${i}`,'box','paper',[0,.04,7-i*2.1],[3.4,.08,1.1],{parent:'bellweather-zone'});
addTo('bellweather-zone',tower('bell-tower',[0,0,-13],{scale:1.25}));
addTo('bellweather-zone',tower('west-tower',[-12,0,-8],{scale:.72,color:'rose'}));
addTo('bellweather-zone',tower('east-tower',[12,0,-8],{scale:.78,color:'teal'}));
addTo('bellweather-zone',pavilion('market',[-11,0,5],'rose'));
addTo('bellweather-zone',pavilion('bookshop',[11,0,3],'teal'));
for(const side of [-1,1]){
  for(let i=0;i<3;i++)addTo('bellweather-zone',planter(`plants-${side}-${i}`,[side*(8.5+i*1.2),0,8-i*4],1+i*.08));
  addTo('bellweather-zone',smallTree('tree-'+side,[side*13.2,0,9],2));
}
for(let i=0;i<8;i++){
  const x=-10.5+i*3;
  addTo('bellweather-zone',lantern('hanging-'+i,[x,6.5-Math.sin(i/7*Math.PI)*1.1,2],{scale:.7,color:i%2?'glow':'pinkGlow',floating:true}));
}
for(let i=0;i<5;i++)addTo('bellweather-zone',lantern('sky-lantern-'+i,[-12+i*6,11+i%2*2,-9],{scale:.55,floating:true}));

/* Friends are intentionally separated in space and dressed differently so the
   protagonist does not read as duplicated. */
e.push(
  {id:'singer',parent:'bellweather-zone',asset:'robot',position:[5,0,2],scale:[.72,.72,.72],animation:'wave'},
  {id:'friend-a',parent:'bellweather-zone',asset:'robot',position:[-5.5,0,3.5],scale:[.66,.66,.66],animation:'idle'}
);
part('friend-a-lantern','sphere','pinkGlow',[0,1.9,.15],[.35,.45,.35],{parent:'friend-a'});
part('singer-voice','box','mint',[0,1,.5],[.36,.36,.18],{parent:'singer'});

/* The playable prison is materially larger and calmer than the rejected square. */
part('prison-floor','box','prison',[0,-.1,0],[18,.2,16],{parent:'prison-zone'});
part('prison-back','box','dark',[0,4,-8.3],[18,8,.35],{parent:'prison-zone'});
part('prison-left','box','dark',[-9,4,-.2],[.35,8,16],{parent:'prison-zone'});
part('prison-right','box','dark',[9,4,-.2],[.35,8,16],{parent:'prison-zone'});
part('prison-ceiling-beam-a','box','indigo',[-4.6,7.4,-1],[.3,.3,14],{parent:'prison-zone'});
part('prison-ceiling-beam-b','box','indigo',[4.6,7.4,-1],[.3,.3,14],{parent:'prison-zone'});
part('prison-light-a','sphere','blueGlow',[-6.8,5.3,-6.8],[.35,.35,.35],{parent:'prison-zone'});
part('prison-light-b','sphere','blueGlow',[6.8,5.3,-6.8],[.35,.35,.35],{parent:'prison-zone'});
addTo('prison-zone',gate('moon',[0,0,-7],{width:6,height:7,color:'gold'}));
addTo('prison-zone',gate('sun',[6.3,0,-11],{width:2.2,height:3.2,color:'rose'}));
addTo('prison-zone',gate('star',[0,0,-18],{width:4.2,height:5.2,color:'teal'}));
e.find(entity=>entity.id==='star-label').position=[0,2.2,.35];
e.push({id:'star-mark',parent:'star',position:[0,2.1,.38]});
const starPoints=Array.from({length:5},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/5;return[Math.cos(a)*.7,Math.sin(a)*.7];});
for(const [i,[x,y]] of starPoints.entries())part(`star-mark-point-${i}`,'sphere','glow',[x,y,0],[.14,.14,.08],{parent:'star-mark'});
for(let i=0;i<5;i++){
  const a=starPoints[i],b=starPoints[(i+2)%5],dx=b[0]-a[0],dy=b[1]-a[1];
  part(`star-mark-line-${i}`,'box','glow',[(a[0]+b[0])/2,(a[1]+b[1])/2,-.015],[Math.hypot(dx,dy),.06,.04],{parent:'star-mark',rotation:[0,0,Math.atan2(dy,dx)*180/Math.PI]});
}
part('tutorial-route-open','box','mint',[0,.02,-12.4],[4,.04,10],{parent:'prison-zone',enabled:false});

function routeBoard(id,position,rotation,material,accent){
  e.push({id,parent:'prison-zone',position,rotation:[0,rotation,0]});
  part(id+'-post','cylinder','wood',[0,.72,0],[.11,1.45,.11],{parent:id});
  part(id+'-board','box',material,[0,1.55,0],[2.3,1.15,.14],{parent:id});
  part(id+'-cap','box',accent,[0,2.08,.08],[2.35,.13,.12],{parent:id});
  part(id+'-pin-a','sphere','gold',[-.86,1.55,.16],[.08,.08,.05],{parent:id});
  part(id+'-pin-b','sphere','gold',[.86,1.55,.16],[.08,.08,.05],{parent:id});
  e.push({id:id+'-label',parent:id,position:[0,2.45,0]});
}
routeBoard('notice-old',[-6.2,0,-11.5],20,'wood','gold');
routeBoard('notice-parade',[6.2,0,-11.2],-20,'rose','pinkGlow');
routeBoard('notice-today',[3.2,0,-16],-12,'teal','mint');
addTo('prison-zone',messageMachine('socket',[0,0,3.2]));
addTo('prison-zone',tokenTrack('words',[0,1.3,6.2],4));
part('cable','box','gold',[-1.7,.15,2.6],[2.4,.1,.12],{parent:'prison-zone',rotation:[0,-18,0]});
part('loose-plug','sphere','mint',[-.65,.3,3],[.4,.4,.4],{parent:'prison-zone'});
part('wrong-ring','torus','rose',[0,.12,-10.8],[2.1,.1,2.1],{parent:'prison-zone',enabled:false});
part('reunion-ring','torus','mint',[0,.13,2.4],[2.2,.07,2.2],{parent:'prison-zone',enabled:false});
part('route-glow','box','mint',[0,.08,-15.2],[1.8,.04,5.2],{parent:'prison-zone',enabled:false});
part('friend-cube','box','rose',[7,.7,4.8],[.8,.8,.8],{parent:'prison-zone'});
part('friend-heart-a','sphere','paper',[-.12,.08,.42],[.22,.22,.05],{parent:'friend-cube'});
part('friend-heart-b','sphere','paper',[.12,.08,.42],[.22,.22,.05],{parent:'friend-cube'});
part('friend-heart-tip','cone','paper',[0,-.08,.42],[.4,.32,.05],{rotation:[180,0,0],parent:'friend-cube'});

/* A black visual field makes the teleport land as a limbo beat before the
   prison geometry is revealed. */
part('limbo-backdrop','box','void',[0,4,-38],[24,12,.4],{enabled:false});

/* One protagonist, used in story and gameplay. */
e.push({id:'zip',asset:'robot',position:[0,0,-28],scale:[.9,.9,.9],animation:'idle'});
part('zip-voice','box','mint',[0,1,.5],[.36,.36,.18],{parent:'zip',enabled:false});

/* Reusable dramatic interruption primitives. */
e.push({id:'rift',position:[0,3,8],enabled:false});
part('rift-ring','torus','blueGlow',[0,0,0],[4.6,.22,4.6],{parent:'rift',rotation:[90,0,0]});
part('rift-core','sphere','glow',[0,0,0],[1.2,1.2,1.2],{parent:'rift',motion:{type:'pulse',amplitude:.18,speed:5}});
part('storm-flash','sphere','glow',[0,12,8],[6,2,6],{enabled:false});

/* The antagonist is deliberately unlike the protagonist silhouette. */
e.push({id:'warden',position:[4,0,-31],enabled:false});
part('warden-cape','cone','indigo',[0,1.1,0],[2.1,2.8,1.25],{parent:'warden'});
part('warden-chest','box','ink',[0,1.8,.1],[1.25,1.5,.72],{parent:'warden'});
part('warden-head','box','ink',[0,3,0],[1.35,.85,1],{parent:'warden'});
part('warden-eye','box','redGlow',[0,3.05,.53],[.88,.11,.06],{parent:'warden'});
part('warden-crown','cone','gold',[0,3.75,0],[.82,.82,.68],{parent:'warden'});
part('warden-hand','box','gold',[-1,1.8,.18],[.34,.9,.38],{parent:'warden'});
part('stolen-voice','box','mint',[0,1.1,-27.5],[.62,.62,.62],{rotation:[0,30,15],enabled:false});

export const worldSpec={schemaVersion:'1',id:'bellweather-first-words',version:'2',
  environment:{clearColor:'#172238',ambient:'#6c7694',exposure:1.05,toneMapping:'aces',fog:{type:'linear',color:'#8f91a7',start:38,end:125}},
  materials:{stone:{diffuse:'#d8b997'},paper:{diffuse:'#f9dfba'},gold:{diffuse:'#ce9d53',gloss:.45},ink:{diffuse:'#273144'},indigo:{diffuse:'#4c5276'},rock:{diffuse:'#717b91'},teal:{diffuse:'#548e89'},rose:{diffuse:'#c87678'},leaf:{diffuse:'#477765'},mint:{diffuse:'#91d2af',emissive:'#60a990',emissiveIntensity:.25},wood:{diffuse:'#795755'},glow:{diffuse:'#ffe5ad',emissive:'#ffc97c',emissiveIntensity:1.25},pinkGlow:{diffuse:'#ffa58c',emissive:'#e88c70',emissiveIntensity:.8},redGlow:{diffuse:'#fa9f78',emissive:'#fc705c',emissiveIntensity:1.25},cloud:{diffuse:'#efd7cc'},haze:{diffuse:'#bda8bc'},dark:{diffuse:'#20283a'},prison:{diffuse:'#35445d'},blueGlow:{diffuse:'#9fdcff',emissive:'#76bfff',emissiveIntensity:1.8},void:{diffuse:'#070b12'}},
  assets:{robot:{type:'container',src:'/assets/quaternius-animated-robot.glb',transform:{position:[0,-.08,0],scale:[.52,.52,.52]},animations:{idle:'RobotArmature|Robot_Idle',run:'RobotArmature|Robot_Running',yes:'RobotArmature|Robot_Yes',no:'RobotArmature|Robot_No',wave:'RobotArmature|Robot_Wave'},defaultAnimation:'idle'}},
  entities:e,
  lights:[{id:'sunlight',type:'directional',color:'#ffd8aa',intensity:.9,rotation:[45,-35,0],castShadows:true},{id:'sky-light',type:'directional',color:'#a6bce4',intensity:.4,rotation:[50,150,0]}],
  cameras:{
    home:{position:[15,12,30],lookAt:[0,1.5,10],fov:50,portrait:{position:[9,14,35],lookAt:[0,1.5,10],fov:50}},
    rupture:{position:[11,9,26],lookAt:[0,2,9],fov:48,portrait:{position:[7,12,31],lookAt:[0,2,9],fov:48}},
    limbo:{position:[5,4,-20],lookAt:[0,1,-28],fov:46,portrait:{position:[3.5,6,-18],lookAt:[0,1,-28],fov:46}},
    reveal:{position:[10,7,-20],lookAt:[0,2.4,-36],fov:52,portrait:{position:[7,9,-17],lookAt:[0,2.5,-36],fov:50}},
    theft:{position:[6,4.5,-23],lookAt:[0,1.8,-29],fov:45,portrait:{position:[4.5,6.5,-21],lookAt:[0,1.8,-29],fov:45}}
  },
  states:{arrival:{camera:'reveal'}},
  player:characterControlProfile({entity:'zip',spawn:[0,0,-28],speed:3.2,surfaces:[
    {bounds:[-8.2,8.2,-38,-24],height:0},
    {bounds:[-8.2,8.2,-52,-38],height:0,whenVisible:'tutorial-route-open'}
  ],camera:{yaw:0,pitch:25,distance:8,portraitDistance:10,minDistance:4,maxDistance:18,targetHeight:1.2}})
};

const missionBase=()=>({
  show:['zip','prison-zone'],
  hide:['bellweather-zone','limbo-backdrop','rift','storm-flash','warden','stolen-voice','wrong-ring','reunion-ring','route-glow','tutorial-route-open','notice-old','notice-parade','notice-today','zip-voice','socket-core','socket-ring',...Array.from({length:4},(_,i)=>`words-piece-${i}`)],
  transforms:{'moon-door':{position:[0,0,0]},'sun-door':{position:[0,0,0]},'star-door':{position:[0,0,0]},zip:{position:[0,0,-28]}},
  animations:{zip:'idle'}
});

function opening(beat){
  const p={show:['zip'],hide:['bellweather-zone','prison-zone','limbo-backdrop','rift','storm-flash','warden','stolen-voice','zip-voice'],transforms:{zip:{position:[0,0,10]}},animations:{zip:'idle'}};
  if(beat===0){
    p.camera='home';p.show.push('bellweather-zone','zip-voice');p.animations.zip='wave';
    p.timeline={duration:2500,cues:[{at:900,patch:{animations:{singer:'wave',zip:'yes'}}}],finish:{animations:{zip:'idle',singer:'idle'}}};
  }else if(beat===1){
    p.camera='rupture';p.show.push('bellweather-zone','zip-voice','rift','storm-flash');p.animations.zip='no';
    p.timeline={duration:3600,moves:[
      {entity:'zip',from:[0,0,10],to:[0,4,8],at:1300,duration:1300},
      {entity:'singer',from:[5,0,2],to:[1,6,-1],at:1200,duration:1400},
      {entity:'friend-a',from:[-5.5,0,3.5],to:[-1,6,-1],at:1200,duration:1400}
    ],cues:[{at:400,patch:{show:['storm-flash']}},{at:900,patch:{hide:['storm-flash']}},{at:1200,patch:{animations:{singer:'no',friend-a:'no'}}}],finish:{hide:['storm-flash']}};
  }else if(beat===2){
    p.camera='limbo';p.show.push('limbo-backdrop');p.transforms.zip={position:[0,0,-28]};p.animations.zip='idle';
  }else if(beat===3){
    p.camera='reveal';p.show.push('prison-zone');p.transforms.zip={position:[0,0,-28]};
  }else if(beat===4){
    p.camera='theft';p.show.push('prison-zone','warden','zip-voice');p.transforms.zip={position:[0,0,-28]};p.transforms.warden={position:[4,0,-31]};
    p.timeline={duration:4700,moves:[
      {entity:'warden',from:[5,0,-33],to:[2.6,0,-29.5],duration:1300},
      {entity:'stolen-voice',from:[0,1,-27.5],to:[1.8,2.2,-29.2],at:1700,duration:950},
      {entity:'warden',from:[2.6,0,-29.5],to:[5,0,-34],at:3200,duration:1200},
      {entity:'stolen-voice',from:[1.8,2.2,-29.2],to:[4.5,3,-34],at:3200,duration:1200}
    ],cues:[{at:1650,patch:{show:['stolen-voice'],hide:['zip-voice'],animations:{zip:'no'}}}],finish:{hide:['warden','stolen-voice'],animations:{zip:'idle'}}};
  }else{
    p.camera='reveal';p.show.push('prison-zone');p.transforms.zip={position:[0,0,-28]};p.animations.zip='idle';
  }
  return p;
}

function present(s,prev){
  if(typeof s==='number')return opening(s);
  const p=missionBase();
  if(s.powered)p.show.push('zip-voice','socket-core','socket-ring');
  for(let i=0;i<(s.pieces||0);i++)p.show.push(`words-piece-${i}`);
  const tutorialComplete=s.round===1||s.status==='success';
  if(tutorialComplete){p.transforms['moon-door']={position:[0,7.8,0]};p.show.push('tutorial-route-open','zip-voice');}
  if(s.round===1&&s.status!=='success')p.show.push('notice-old','notice-parade','notice-today');
  if(s.status==='wrong'){
    p.show.push('wrong-ring');p.animations.zip='no';
    p.transforms['wrong-ring']={position:s.round===1?[0,.12,-10.8]:[6,.12,-11]};
    if(!s.round)p.transforms['sun-door']={position:[0,3.8,0]};
  }
  if(s.status==='success'){
    if(s.round===0){
      p.show.push('reunion-ring','tutorial-route-open');p.animations.zip='yes';
      if(prev?.status!=='success')p.timeline={duration:2500,moves:[{entity:'moon-door',from:[0,0,0],to:[0,7.8,0],duration:1200}],cues:[{at:1250,patch:{show:['tutorial-route-open'],animations:{zip:'yes'}}}],finish:{animations:{zip:'idle'}}};
    }else{
      p.show.push('route-glow','tutorial-route-open');p.transforms['star-door']={position:[0,6.5,0]};p.animations.zip='yes';
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

export const openingSpec={
  id:'bellweather.opening.v2',title:'BRING BACK THE WORDS',subtitle:'Prologue',finishLabel:'Take control →',waitForMotion:true,
  scenes:[
    {beat:0,kicker:'BELLWEATHER · LANTERN NIGHT',title:'Bellweather is alive.',body:'Lanterns glow. Music carries over the rooftops. Zip is home with friends.'},
    {beat:1,kicker:'WITHOUT WARNING',title:'The sky cracks open.',body:'Thunder. A white rift tears through the square—and pulls everyone away.'},
    {beat:2,kicker:'SOMEWHERE ELSE',title:'Silence.',body:'Zip wakes alone. No market. No friends. Bellweather is gone.'},
    {beat:3,kicker:'THEN THE LIGHTS COME ON',title:'This is not home.',body:'Cold walls. One enormous locked door. No obvious way back.',markers:[{entity:'moon-label',label:'SEALED EXIT',offset:[0,-8]}]},
    {beat:4,kicker:'THE WARDEN',title:'It takes Zip’s voice.',body:'A clamp tears out the speech engine. The door stays sealed.'},
    {beat:5,kicker:'ONE THING STILL WORKS',title:'Get the words back.',body:'A repair socket still has power. Restore enough speech to open the door.',markers:[{entity:'loose-plug',label:'REPAIR SOCKET',offset:[0,-8]}]}
  ]
};
