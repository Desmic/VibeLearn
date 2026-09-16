/* Bellweather: authored story, composition and semantic presentation package. */
import {keeperCharacter,keeperMaterials,keeperProfile} from './game-character-spec.js';
import {messageMachine,tokenTrack,smallTree,pavilion} from './workshop-props.js';
import {lantern,gate,tower,planter} from './rescue-world-props.js';
import {makeWorldPackage} from './spec-game-world.js';

const e=[];
const part=(id,primitive,material,position,scale,extra={})=>e.push({id,primitive,material,position,scale,...extra});
part('island','cylinder','stone',[0,-.6,-1],[19,1.2,19]);
part('island-lip','cylinder','gold',[0,-1.23,-1],[19.3,.13,19.3]);
part('island-rock','cone','rock',[0,-4,-1],[17,7,17],{rotation:[180,0,0]});
part('square','cylinder','paper',[0,.02,1],[10.5,.08,10.5]);
part('square-inlay','torus','gold',[0,.08,1],[8.5,.045,8.5]);
for(let i=0;i<10;i++)part('path-'+i,'box','paper',[0,.04,3-i],[2,.08,.68]);
e.push(...tower('bell-tower',[0,0,-10],{scale:1.1}),...tower('west-tower',[-7,0,-8],{scale:.7,color:'rose'}),...tower('east-tower',[7,0,-8],{scale:.8,color:'teal'}));
e.push(...gate('moon',[-2.5,0,-1.5]),...gate('sun',[3,0,-2.8],{width:1.5,height:2.5}),...gate('star',[0,0,-7],{width:2.7,height:4.1}));
// The changed-context exit must be solvable from the world rather than from a
// text answer key. Put a glowing five-point mark on the Star gate and anchor the
// minimal HUD glyph low enough to remain visible between the phone HUD bands.
e.find(entity=>entity.id==='star-label').position=[0,1.5,.35];
e.push({id:'star-mark',parent:'star',position:[0,1.55,.38]});
const starPoints=Array.from({length:5},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/5;return[Math.cos(a)*.55,Math.sin(a)*.55];});
for(const [i,[x,y]] of starPoints.entries())part(`star-mark-point-${i}`,'sphere','glow',[x,y,0],[.13,.13,.07],{parent:'star-mark'});
for(let i=0;i<5;i++){
  const a=starPoints[i],b=starPoints[(i+2)%5],dx=b[0]-a[0],dy=b[1]-a[1];
  part(`star-mark-line-${i}`,'box','glow',[(a[0]+b[0])/2,(a[1]+b[1])/2,-.015],[Math.hypot(dx,dy),.055,.035],{parent:'star-mark',rotation:[0,0,Math.atan2(dy,dx)*180/Math.PI]});
}
// The transfer context now lives in the city. Each route board is a tangible
// world object with a world-anchored accessible control; the list dialog remains
// only as a fallback for players who prefer not to hunt the boards visually.
function routeBoard(id,position,rotation,material,accent){
  e.push({id,position,rotation:[0,rotation,0]});
  part(id+'-post','cylinder','wood',[0,.72,0],[.11,1.45,.11],{parent:id});
  part(id+'-board','box',material,[0,1.55,0],[2.2,1.15,.14],{parent:id});
  part(id+'-cap','box',accent,[0,2.08,.08],[2.25,.13,.12],{parent:id});
  part(id+'-pin-a','sphere','gold',[-.82,1.55,.16],[.08,.08,.05],{parent:id});
  part(id+'-pin-b','sphere','gold',[.82,1.55,.16],[.08,.08,.05],{parent:id});
  e.push({id:id+'-label',parent:id,position:[0,2.45,0]});
}
routeBoard('notice-old',[-5.25,0,-2.25],24,'wood','gold');
routeBoard('notice-parade',[5.2,0,-2.05],-24,'rose','pinkGlow');
routeBoard('notice-today',[2.15,0,-5.25],-14,'teal','mint');
part('cell-back','box','indigo',[-2.5,1.3,-3.2],[2.5,2.6,.2]);
for(const side of [-1,1])part('cell-side'+side,'box','stone',[-2.5+side*1.35,1.2,-2.3],[.16,2.4,1.8]);
part('cell-moon','torus','glow',[-2.5,2,-3.04],[.8,.09,.8],{rotation:[90,0,0]});
e.push(...messageMachine('socket',[-.1,0,1.6]),...tokenTrack('words',[0,1.3,3],4));
part('cable','box','gold',[-1.6,.13,.9],[2,.1,.11],{rotation:[0,-25,0]});
part('loose-plug','sphere','mint',[-.6,.25,1.1],[.35,.35,.35]);
e.push(...pavilion('market',[-6.2,0,1.1],'rose'),...pavilion('bookshop',[6.2,0,.3],'teal'));
for(const side of [-1,1]){
  for(let i=0;i<3;i++)e.push(...planter(`plants-${side}-${i}`,[side*(4.6+i*.6),0,4-i*2],1+i*.1));
  e.push(...smallTree('tree-'+side,[side*6.6,0,4.5],1.6));
  part('rail-'+side,'box','gold',[side*8.3,1,0],[.12,.12,8]);
  for(let i=0;i<4;i++)part(`post-${side}-${i}`,'cylinder','ink',[side*8.3,.55,3-i*2],[.12,1.1,.12]);
}
for(let i=0;i<7;i++){
  const x=-6+i*2;
  e.push(...lantern('hanging-'+i,[x,5.7-Math.sin(i/6*Math.PI)*1.1,1],{scale:.65,color:i%2?'glow':'pinkGlow',floating:true}));
  if(i<6)part('wire-'+i,'box','wood',[x+1,5.5-Math.sin((i+.5)/6*Math.PI),1],[2.1,.025,.025],{rotation:[0,0,(i-2.5)*6]});
}
for(let i=0;i<12;i++){
  const a=i*.53,x=Math.sin(a)*23,z=-19+Math.cos(a)*12;
  part('cloud-'+i,'sphere',i%2?'cloud':'haze',[x,-2-i%3,z],[7+i%3,2.3,4]);
  if(i%3===0)e.push(...tower('distant-'+i,[x,-5,z-7],{scale:.4+i*.025,color:'haze'}));
}
for(let i=0;i<5;i++)e.push(...lantern('sky-lantern-'+i,[-10+i*5,10+i%3*2,-18],{scale:.5,floating:true}));
e.push(...keeperCharacter());e.find(x=>x.id==='keeper').enabled=true;
e.push({id:'zip',asset:'robot',position:[-2.5,0,-2.4],scale:[.88,.88,.88],animation:'idle'},
  {id:'singer',asset:'robot',position:[4,0,1.7],scale:[.75,.75,.75],animation:'wave'},
  {id:'zip-label',parent:'zip',position:[0,2.6,0]});
e.push(...lantern('our-lantern',[1,1,3],{scale:.6}));
part('lantern-eye-a','sphere','ink',[-.12,.1,.25],[.09,.09,.08],{parent:'our-lantern'});
part('lantern-eye-b','sphere','ink',[.12,.1,.25],[.09,.09,.08],{parent:'our-lantern'});
e.push({id:'warden',position:[4,8,1.4],enabled:false});
part('warden-cape','cone','indigo',[0,1.1,0],[1.8,2.4,1.1],{parent:'warden'});
part('warden-chest','box','ink',[0,1.7,.1],[1.05,1.3,.65],{parent:'warden'});
part('warden-head','box','ink',[0,2.7,0],[1.2,.75,.9],{parent:'warden'});
part('warden-eye','box','redGlow',[0,2.75,.47],[.75,.09,.05],{parent:'warden'});
part('warden-crown','cone','gold',[0,3.3,0],[.7,.7,.6],{parent:'warden'});
part('warden-hand','box','gold',[-.85,1.7,.15],[.3,.8,.35],{parent:'warden'});
part('warden-lift','cylinder','ink',[0,-.1,0],[2.8,.3,2.8],{parent:'warden'});
part('stolen-voice','box','mint',[4,1.4,1.6],[.55,.55,.55],{rotation:[0,30,15],enabled:false});
part('zip-voice','box','mint',[0,1,.5],[.36,.36,.18],{parent:'zip',enabled:false});
part('singer-voice','box','mint',[0,1,.5],[.36,.36,.18],{parent:'singer'});
part('singer-cage','torus','gold',[4,0,1.7],[2.2,.1,2.2],{enabled:false});
/* Cage bars use world-sized children under an unscaled presentation anchor. */
e.find(x=>x.id==='singer-cage').scale=[1,1,1];
for(let i=0;i<6;i++){
  const a=i*Math.PI/3;
  part('singer-bar-'+i,'cylinder','gold',[Math.cos(a)*.8,1.2,Math.sin(a)*.8],[.07,2.4,.07],{parent:'singer-cage'});
}
part('singer-cage-top','torus','gold',[0,2.4,0],[1.8,.08,1.8],{parent:'singer-cage'});
part('wrong-ring','torus','rose',[3,.12,-1.5],[1.9,.1,1.9],{enabled:false});
part('reunion-ring','torus','mint',[-2,.13,1],[2,.06,2],{enabled:false});
part('route-glow','box','mint',[0,.1,-5.4],[1.4,.04,2.5],{enabled:false});
part('friend-cube','box','rose',[5.5,.6,2.8],[.7,.7,.7]);
part('friend-heart-a','sphere','paper',[-.1,.08,.36],[.2,.2,.05],{parent:'friend-cube'});
part('friend-heart-b','sphere','paper',[.1,.08,.36],[.2,.2,.05],{parent:'friend-cube'});
part('friend-heart-tip','cone','paper',[0,-.07,.36],[.36,.3,.05],{rotation:[180,0,0],parent:'friend-cube'});
export const worldSpec={schemaVersion:'1',id:'bellweather-first-words',version:'1',
  environment:{clearColor:'#efb8a5',ambient:'#8793b1',exposure:1.15,toneMapping:'aces',fog:{type:'linear',color:'#d6afbc',start:30,end:95}},
  materials:{...keeperMaterials,stone:{diffuse:'#d8b997'},paper:{diffuse:'#f9dfba'},gold:{diffuse:'#ce9d53',gloss:.45},ink:{diffuse:'#273144'},indigo:{diffuse:'#4c5276'},rock:{diffuse:'#717b91'},teal:{diffuse:'#548e89'},rose:{diffuse:'#c87678'},leaf:{diffuse:'#477765'},mint:{diffuse:'#91d2af',emissive:'#60a990',emissiveIntensity:.25},wood:{diffuse:'#795755'},glow:{diffuse:'#ffe5ad',emissive:'#ffc97c',emissiveIntensity:1.1},pinkGlow:{diffuse:'#ffa58c',emissive:'#e88c70',emissiveIntensity:.7},redGlow:{diffuse:'#fa9f78',emissive:'#fc705c',emissiveIntensity:1.2},cloud:{diffuse:'#efd7cc'},haze:{diffuse:'#bda8bc'}},
  assets:{robot:{type:'container',src:'/assets/quaternius-animated-robot.glb',transform:{position:[0,-.08,0],scale:[.52,.52,.52]},animations:{idle:'RobotArmature|Robot_Idle',run:'RobotArmature|Robot_Running',yes:'RobotArmature|Robot_Yes',no:'RobotArmature|Robot_No',wave:'RobotArmature|Robot_Wave'},defaultAnimation:'idle'}},
  entities:e,lights:[{id:'sunlight',type:'directional',color:'#ffd8aa',intensity:1.8,rotation:[45,-35,0],castShadows:true},{id:'sky-light',type:'directional',color:'#a6bce4',intensity:.7,rotation:[50,150,0]}],
  cameras:{home:{position:[9,10,18],lookAt:[0,1,0],fov:48,portrait:{position:[6,12,23],lookAt:[0,1,0],fov:48}},capture:{position:[7,7,14],lookAt:[1,1.7,.3],fov:48,portrait:{position:[5,10,21],lookAt:[.7,1.6,0],fov:48}},cell:{position:[6,7,13],lookAt:[-1.4,1,-.4],fov:48,portrait:{position:[4,10,19],lookAt:[-.8,1,-.6],fov:48}}},
  states:{arrival:{camera:'home'}},
  player:keeperProfile({spawn:[-2,0,3.6],surfaces:[{bounds:[-8,8,-8,6.8],height:0}],obstacles:[[-1.1,0,.9,.9,2.6,2.4],[-3.9,0,-3.5,-1.1,4,-1.7],[-7.6,0,-.3,-4.8,4,2.2],[4.8,0,-1,7.6,4,1.3]],camera:{yaw:-8,pitch:39,distance:13,portraitDistance:18,minDistance:7,maxDistance:26,targetHeight:1.2}})};

const base=()=>({show:['zip','singer','our-lantern'],hide:['warden','stolen-voice','singer-cage','wrong-ring','reunion-ring','route-glow','notice-old','notice-parade','notice-today','zip-voice','socket-core','socket-ring',...Array.from({length:4},(_,i)=>`words-piece-${i}`)],transforms:{'moon-door':{position:[0,0,0]},'sun-door':{position:[0,0,0]},'star-door':{position:[0,0,0]},zip:{position:[-2.5,0,-2.4]},singer:{position:[4,0,1.7]},'our-lantern':{position:[1,1,3]}},animations:{zip:'idle',singer:'wave'}});
function opening(beat){
  const p=base();p.camera=beat<1?'home':beat<2?'capture':'cell';
  p.show.push('zip-voice','singer-voice');
  if(beat===0){
    p.transforms.zip={position:[1,0,2.5]};p.transforms.keeper={position:[-1,0,3.5]};p.animations.zip='wave';
    p.timeline={duration:3600,moves:[{entity:'our-lantern',from:[1,3.5,3],to:[1,1.2,3],duration:1000},{entity:'zip',from:[1,0,2.5],to:[-.2,0,3],at:1300,duration:1500},{entity:'our-lantern',from:[1,1.2,3],to:[-.2,1.2,3.5],at:1300,duration:1500}],finish:{animations:{zip:'yes'}}};
  }else if(beat===1){
    p.show.push('warden','singer-cage');p.transforms.zip={position:[-.2,0,3]};p.transforms.keeper={position:[-1,0,3.5]};
    p.timeline={duration:5700,moves:[{entity:'warden',from:[2.7,7,-.5],to:[2.7,0,-.5],duration:1900},{entity:'stolen-voice',from:[4,1.1,2.2],to:[1.9,2.2,-.2],at:2100,duration:900},{entity:'singer',from:[4,0,1.7],to:[4,7,1.7],at:3700,duration:1600},{entity:'singer-cage',from:[4,0,1.7],to:[4,7,1.7],at:3700,duration:1600}],cues:[{at:2000,patch:{hide:['singer-voice'],show:['stolen-voice']}},{at:3000,patch:{animations:{singer:'no'}}}],finish:{hide:['singer','singer-cage','stolen-voice']}};
  }else{
    p.hide.push('singer');p.show.push('warden');p.transforms.warden={position:[1,0,-2.5]};p.transforms.keeper={position:[-1,0,-.7]};
    p.timeline={duration:6000,moves:[{entity:'zip',from:[-1.5,0,-.7],to:[-2.5,0,-2.4],duration:1300},{entity:'keeper',from:[-1,0,-.7],to:[-2,0,2.3],duration:1300},{entity:'moon-door',from:[0,4.5,0],to:[0,0,0],at:1400,duration:1000},{entity:'stolen-voice',from:[-2.5,1,-1.9],to:[.2,2.2,-2.3],at:2600,duration:1200},{entity:'warden',from:[1,0,-2.5],to:[1,8,-2.5],at:4100,duration:1600},{entity:'stolen-voice',from:[.2,2.2,-2.3],to:[.2,10.2,-2.3],at:4100,duration:1600}],cues:[{at:2600,patch:{show:['stolen-voice'],hide:['zip-voice'],animations:{zip:'no'}}}],finish:{hide:['warden','stolen-voice'],animations:{zip:'wave'}}};
  }
  return p;
}
function present(s,prev){
  if(typeof s==='number')return opening(s);
  const p=base();p.hide.push('singer');
  if(s.powered)p.show.push('zip-voice','socket-core','socket-ring');
  for(let i=0;i<(s.pieces||0);i++)p.show.push(`words-piece-${i}`);
  const freed=s.round===1||s.status==='success';
  if(freed){p.transforms['moon-door']={position:[0,4.6,0]};p.transforms.zip={position:[-1.4,0,2]};p.transforms['our-lantern']={position:[-1.1,1,2.2]};p.show.push('zip-voice');}
  if(s.round===1&&s.status!=='success')p.show.push('notice-old','notice-parade','notice-today');
  if(s.status==='wrong'){
    p.show.push('wrong-ring');p.animations.zip='no';
    p.transforms['wrong-ring']={position:s.round===1?[-2.5,.12,-.8]:[3,.12,-1.5]};
    if(!s.round)p.transforms['sun-door']={position:[0,3.4,0]};
  }
  if(s.status==='success'){
    if(s.round===0){
      p.show.push('reunion-ring');p.animations.zip='yes';
      if(prev?.status!=='success')p.timeline={duration:3300,moves:[{entity:'moon-door',from:[0,0,0],to:[0,4.6,0],duration:1100},{entity:'zip',from:[-2.5,0,-2.4],to:[-1.4,0,2],at:1200,duration:1700}],cues:[{at:1200,patch:{animations:{zip:'run'}}}],finish:{animations:{zip:'wave'}}};
    }else{
      p.show.push('route-glow');p.transforms['star-door']={position:[0,5.6,0]};p.transforms.zip={position:[0,0,-5.4]};p.transforms['our-lantern']={position:[.4,1,-5]};p.animations.zip='wave';
      if(prev?.status!=='success')p.timeline={duration:3900,moves:[{entity:'star-door',from:[0,0,0],to:[0,5.6,0],duration:1300},{entity:'zip',from:[-1.4,0,2],to:[0,0,-5.4],at:1500,duration:2100}],cues:[{at:1500,patch:{animations:{zip:'run'}}}],finish:{animations:{zip:'wave'}}};
    }
  }
  return p;
}
worldSpec.materials.dark={diffuse:'#25334c'};worldSpec.materials.coral={diffuse:'#c87678'};
const pkg=makeWorldPackage(worldSpec,(state,previous)=>{
  const patch=present(state,previous);
  if(typeof state!=='number'||state>=2)patch.show=patch.show.filter(id=>id!=='singer');
  patch.hide=patch.hide.filter(id=>!patch.show.includes(id));
  return patch;
},{cinematic:true});
export const gameWorldManifest=pkg.gameWorldManifest;
export const createGameWorld=pkg.createGameWorld;
export const openingSpec={id:'bellweather.opening.v1',title:'BRING BACK THE WORDS',subtitle:'The First Words',finishLabel:'Help Zip →',waitForMotion:true,scenes:[
  {beat:0,kicker:'BELLWEATHER · THE NIGHT OF THE LANTERN PARADE',title:'Every adventure needs a friend.',body:'Zip made a lantern for the two of you. Nearly dropped it, too.',markers:[],action:{target:'zip',label:'Give Zip a hand tap',patch:{animations:{zip:'wave'},transforms:{zip:{position:[-.2,0,3]},keeper:{position:[-1,0,3.5]},'our-lantern':{position:[-.2,1.2,3.5]},'keeper-arm-right':{rotation:[0,0,-65]}},timeline:{duration:1200,cues:[{at:1000,patch:{transforms:{'keeper-arm-right':{rotation:[0,0,0]}},animations:{zip:'yes'}}}]}}},success:{fact:'Zip: “Best team in Bellweather!”'}},
  {beat:1,kicker:'THE WARDEN HAS OTHER PLANS',title:'“No voices. No complaints.”',body:'He takes your friends’ speech engines and locks them in his tower.',markers:[]},
  {beat:2,kicker:'ZIP PUSHES YOU CLEAR OF THE GATE',title:'Your friend saved you.',body:'Now Zip is trapped—and their voice is gone. A repair socket is within reach.',markers:[]}
]};
