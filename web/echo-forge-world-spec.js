/* Phase 1 authored WorldSpec for Relay Rescue / Echo Forge.
   Data semantics are engine-neutral; PlayCanvas is only the current compiler target. */
'use strict';

const entities=[];
const add=(id,primitive,material,position,scale,extra={})=>entities.push({id,primitive,material,position,scale,...extra});
const child=(id,parent,primitive,material,position,scale,extra={})=>entities.push({id,parent,primitive,material,position,scale,...extra});

add('water','plane','water',[0,-3.3,-7],[48,1,48]);
add('moon','sphere','moon',[-10,13,-24],[4.2,4.2,4.2],{motion:{type:'pulse',amplitude:.025,speed:.8}});
add('island-left-rock','cone','rock',[-5.2,-2.8,0],[7.8,4.8,7.8]);
add('island-left-top','cylinder','grass',[-5.2,-.75,0],[7.2,.45,7.2]);
add('island-right-rock','cone','rock',[5.3,-2.8,-.3],[7.8,4.8,7.8]);
add('island-right-top','cylinder','grass',[5.3,-.75,-.3],[7.2,.45,7.2]);

const PIP_FALLBACK=[
  'pip-body','pip-head','pip-eye-l','pip-eye-r','pip-mouth','pip-arm-l','pip-arm-r',
  'pip-hand-l','pip-hand-r','pip-leg-l','pip-leg-r','pip-boot-l','pip-boot-r','pip-pack'
];
entities.push({
  id:'pip',asset:'pip.robot',animation:'idle',animationBlendTime:.18,fallback:PIP_FALLBACK,
  position:[-5.2,.3,1.2],scale:[1.15,1.15,1.15]
});
child('pip-body','pip','capsule','pip',[0,.78,0],[.52,.72,.48]);
child('pip-head','pip','sphere','pip',[0,1.55,0],[.68,.58,.58]);
child('pip-eye-l','pip','sphere','glass',[-.23,1.62,.49],[.13,.13,.08],{motion:{type:'pulse',amplitude:.06,speed:2.6}});
child('pip-eye-r','pip','sphere','glass',[.23,1.62,.49],[.13,.13,.08],{motion:{type:'pulse',amplitude:.06,speed:2.6}});
child('pip-mouth','pip','box','dark',[0,1.36,.54],[.20,.035,.035]);
child('pip-arm-l','pip','cylinder','pip',[-.55,.82,0],[.11,.48,.11],{rotation:[0,0,-24]});
child('pip-arm-r','pip','cylinder','pip',[.55,.82,0],[.11,.48,.11],{rotation:[0,0,24]});
child('pip-hand-l','pip','sphere','pip',[-.75,.48,0],[.16,.16,.16]);
child('pip-hand-r','pip','sphere','pip',[.75,.48,0],[.16,.16,.16]);
child('pip-leg-l','pip','cylinder','dark',[-.24,.15,0],[.12,.38,.12]);
child('pip-leg-r','pip','cylinder','dark',[.24,.15,0],[.12,.38,.12]);
child('pip-boot-l','pip','box','red',[-.24,-.17,.12],[.22,.12,.34]);
child('pip-boot-r','pip','box','red',[.24,-.17,.12],[.22,.12,.34]);
child('pip-pack','pip','box','forge',[0,.77,-.47],[.48,.52,.24]);
// Courier identity is an archetype/accessory layer, not asset-failure geometry.
// These remain visible whether the authored GLB or the primitive fallback renders.
child('pip-scarf','pip','box','red',[.48,1.42,-.02],[.82,.085,.20],{rotation:[0,-18,-10]});
child('pip-antenna','pip','cylinder','dark',[0,2.08,0],[.035,.28,.035],{rotation:[0,0,4]});
child('pip-beacon','pip','sphere','glass',[0,2.38,0],[.13,.13,.13],{motion:{type:'pulse',amplitude:.12,speed:2.2}});

const FORGE_FALLBACK=[
  'forge-body','forge-roof','forge-window-l','forge-window-r','forge-chimney',
  'forge-chimney-cap','forge-pipe','forge-door'
];
entities.push({id:'forge',asset:'forge.blacksmith',fallback:FORGE_FALLBACK,position:[5.3,.15,-.5]});
child('forge-body','forge','box','forge',[0,1,0],[2.5,1.9,2.15]);
child('forge-roof','forge','cone','dark',[0,2.48,0],[3.0,1.3,3.0],{rotation:[0,45,0]});
child('forge-window-l','forge','box','glass',[-.65,1.3,1.1],[.38,.38,.08],{motion:{type:'pulse',amplitude:.05,speed:1.7}});
child('forge-window-r','forge','box','glass',[-.08,1.3,1.1],[.38,.38,.08],{motion:{type:'pulse',amplitude:.05,speed:1.9}});
child('forge-furnace','forge','sphere','ember',[.68,.72,1.12],[.72,.72,.18],{motion:{type:'pulse',amplitude:.12,speed:2.5}});
child('forge-sign','forge','torus','gold',[0,2.2,1.15],[1.0,.22,1.0],{rotation:[90,0,0],motion:{type:'spin',axis:[0,0,1],speed:8}});
child('forge-chimney','forge','cylinder','dark',[1.15,3.25,-.5],[.32,1.15,.32]);
child('forge-chimney-cap','forge','cylinder','bronze',[1.15,4.25,-.5],[.44,.14,.44]);
child('forge-pipe','forge','cylinder','bronze',[-1.28,1.25,.1],[.18,.95,.18],{rotation:[0,0,90]});
child('forge-gear-a','forge','torus','gold',[-.92,1.05,1.16],[.52,.14,.52],{rotation:[90,0,0],motion:{type:'spin',axis:[0,0,1],speed:11}});
child('forge-gear-b','forge','torus','bronze',[-1.45,.72,1.17],[.34,.10,.34],{rotation:[90,0,0],motion:{type:'spin',axis:[0,0,1],speed:-15}});
child('forge-door','forge','box','dark',[.72,1.15,1.13],[.62,.85,.08]);
child('forge-door-glow','forge','box','ember',[.72,1.12,1.22],[.40,.58,.035],{motion:{type:'pulse',amplitude:.05,speed:2.0}});
child('forge-smoke-1','forge','sphere','smoke',[1.15,4.65,-.5],[.45,.28,.45],{motion:{type:'bob',amplitude:.18,speed:.7}});
child('forge-smoke-2','forge','sphere','smoke',[1.42,5.18,-.72],[.62,.34,.62],{motion:{type:'bob',amplitude:.22,speed:.55}});

for(let i=0;i<7;i++){
  const x=-2.6+i*.42;
  add(`bridge-left-${i}`,'box','wood',[x,.18,1],[.34,.14,1.05]);
  add(`bridge-right-${i}`,'box','wood',[-x,.18,1],[.34,.14,1.05]);
}
// Gears use a transform-only semantic parent so presentation geometry cannot
// collapse into the old smooth-ring silhouette. The stable parent owns state,
// visibility and spin; rim / teeth / spokes are presentation-only children.
const gear=(id,material,position,size=1,extra={})=>{
  entities.push({id,position,rotation:[90,0,0],scale:[size,size,size],...extra});
  child(`${id}-rim`,id,'torus',material,[0,0,0],[.72,.20,.72]);
  child(`${id}-hub`,id,'cylinder','dark',[0,.08,0],[.25,.16,.25]);
  for(let i=0;i<12;i++){
    const angle=i*30, radians=angle*Math.PI/180;
    child(
      `${id}-tooth-${i}`,id,'box',material,
      [Math.cos(radians)*.78,.05,Math.sin(radians)*.78],
      [.14,.14,.24],{rotation:[0,90-angle,0]}
    );
  }
  for(let i=0;i<6;i++){
    const angle=i*60, radians=angle*Math.PI/180;
    child(
      `${id}-spoke-${i}`,id,'box','bronze',
      [Math.cos(radians)*.34,.07,Math.sin(radians)*.34],
      [.09,.10,.38],{rotation:[0,90-angle,0]}
    );
  }
};
gear('broken-gear','gold',[0,.58,1.1],.98,{motion:{type:'spin',axis:[0,1,0],speed:16}});
gear('new-gear','gold',[4.55,.72,1.15],1.05,{enabled:false,motion:{type:'spin',axis:[0,1,0],speed:22}});
gear('duplicate-gear','danger',[5.72,.72,1.15],1.05,{enabled:false,motion:{type:'spin',axis:[0,1,0],speed:-22}});
add('order-seal','box','paper',[-4.0,1.72,.12],[.8,.5,.07],{enabled:false,motion:{type:'bob',amplitude:.12,speed:2}});
add('reply-orb','sphere','glass',[4.2,2.18,.42],[.48,.48,.48],{enabled:false,motion:{type:'bob',amplitude:.18,speed:2.5}});
add('storm-bolt-a','box','storm',[0,4.6,.2],[.12,2.8,.12],{enabled:false,rotation:[0,0,16]});
add('storm-bolt-b','box','storm',[.48,2.9,.2],[.12,1.5,.12],{enabled:false,rotation:[0,0,-18]});

// Low-poly set dressing stays engine-neutral: the backend only sees primitives.
const tree=(id,x,z,scale=1,material='leaf')=>{
  add(`${id}-trunk`,'cylinder','bark',[x,.12,z],[.16*scale,.95*scale,.16*scale]);
  add(`${id}-crown`,'cone',material,[x,1.35*scale,z],[.85*scale,1.25*scale,.85*scale]);
};
[
  ['tree-l1',-7.2,-1.8,1.05,'leaf'],['tree-l2',-6.2,-3.8,.8,'leafDark'],
  ['tree-l3',-3.8,-3.4,.68,'leaf'],['tree-r1',7.2,-2.0,1.0,'leaf'],
  ['tree-r2',6.0,-4.1,.78,'leafDark'],['tree-r3',3.8,-3.7,.66,'leaf']
].forEach(args=>tree(...args));
[
  ['rock-l1',-7.0,-.42,-.2,.72],['rock-l2',-3.7,-.45,-1.8,.48],
  ['rock-r1',7.0,-.42,-.8,.62],['rock-r2',3.9,-.44,-2.0,.42]
].forEach(([id,x,y,z,s])=>add(id,'sphere','stone',[x,y,z],[s,.48*s,.72*s]));
[
  ['lantern-l',-3.75,.25],['lantern-r',3.78,.18]
].forEach(([id,x,z])=>{
  add(`${id}-post`,'cylinder','dark',[x,.22,z],[.09,1.25,.09]);
  add(`${id}-lamp`,'sphere','lantern',[x,1.52,z],[.20,.20,.20],{motion:{type:'pulse',amplitude:.08,speed:1.5}});
});
[-2.25,-.75,.75,2.25].forEach((x,i)=>{
  add(`bridge-post-near-${i}`,'cylinder','bronze',[x,.66,.18],[.055,.62,.055]);
  add(`bridge-post-far-${i}`,'cylinder','bronze',[x,.66,1.82],[.055,.62,.055]);
});
[
  [-9,8,-15,.10],[-5,10,-18,.08],[-1,8.5,-16,.07],[3,11,-19,.11],[8,9,-17,.08],
  [-7,6.8,-12,.06],[6,7.2,-13,.07]
].forEach(([x,y,z,s],i)=>add(`star-${i}`,'sphere','starlight',[x,y,z],[s,s,s],{motion:{type:'pulse',amplitude:.16,speed:1+i*.11}}));

const beaconPositions=[[-7,2],[-3,-7],[0,-12],[4,-8],[7,2],[10,-10],[-10,-9]];
// The campaign is Seven Lights, so the remote beacons need geographic anchors,
// not floating dots in empty sky. These small distant islands are presentation
// only; beacon identity and gameplay state remain unchanged.
const distantBeaconScale={1:.72,2:.56,3:.66,5:.54,6:.58};
beaconPositions.forEach(([x,z],i)=>{
  const scale=distantBeaconScale[i];
  if(scale){
    add(`beacon-island-${i}-rock`,'cone','rock',[x,-2.25,z],[4.9*scale,3.4*scale,4.9*scale]);
    add(`beacon-island-${i}-top`,'cylinder','grass',[x,-.72,z],[4.45*scale,.24,4.45*scale]);
  }
  add(`beacon-${i}`,'cylinder','dark',[x,.5,z],[.18,2.3,.18]);
  add(`beacon-lamp-${i}`,'sphere',i===0?'glass':'beacon',[x,1.78,z],[.42,.42,.42],{motion:{type:'pulse',amplitude:i===0?.14:.08,speed:1.5+i*.07}});
});

export const echoForgeWorldSpec=Object.freeze({
  schemaVersion:'1',
  id:'relay-rescue.echo-forge',
  version:'pc-phase1-13',
  environment:{clearColor:'#03111c',ambient:'#294651',exposure:1.18,toneMapping:'aces2',fog:{type:'exp2',color:'#0b2633',density:.018}},
  assets:{
    'pip.robot':{
      type:'container',src:'/assets/quaternius-animated-robot.glb',
      // Measured source mesh height is ~4.63 units; .52 normalizes Pip to ~2.41
      // authored world units. Normalization belongs to AssetRef, not the backend.
      transform:{position:[0,-.08,0],scale:[.52,.52,.52]},
      animations:{
        idle:'RobotArmature|Robot_Idle',standing:'RobotArmature|Robot_Standing',
        wave:'RobotArmature|Robot_Wave',yes:'RobotArmature|Robot_Yes',no:'RobotArmature|Robot_No',
        thumbsUp:'RobotArmature|Robot_ThumbsUp',jump:'RobotArmature|Robot_Jump',run:'RobotArmature|Robot_Running'
      },
      defaultAnimation:'idle'
    },
    'forge.blacksmith':{
      type:'container',src:'/assets/quaternius-blacksmith.glb',
      // Real PlayCanvas AABB: min[-2.5662,-.0039,-1.6579],
      // max[1.3238,2.9995,1.6256]. Scale 1.30 yields an authored Forge
      // ~5.06w x 3.90h x 4.27d; offset centers X/Z and places the base at y=0.
      transform:{position:[.8076,.0051,.0210],scale:[1.30,1.30,1.30]}
    }
  },
  materials:{
    rock:{diffuse:'#203b4b',gloss:.22},
    grass:{diffuse:'#527f6f',gloss:.18},
    wood:{diffuse:'#9d704e',gloss:.22},
    gold:{diffuse:'#e8bf68',emissive:'#765b20',emissiveIntensity:.32,metalness:.22},
    paper:{diffuse:'#f4d99a',gloss:.08},
    dark:{diffuse:'#122a36',gloss:.2},
    pip:{diffuse:'#e0a159',metalness:.14,gloss:.35},
    red:{diffuse:'#c65449',gloss:.2},
    glass:{diffuse:'#72dcc9',emissive:'#72dcc9',emissiveIntensity:1.35,gloss:.65},
    forge:{diffuse:'#a68266',metalness:.18,gloss:.24},
    storm:{diffuse:'#c8eaff',emissive:'#c8eaff',emissiveIntensity:3.2},
    danger:{diffuse:'#ff745f',emissive:'#ff745f',emissiveIntensity:1.2},
    ember:{diffuse:'#ffa852',emissive:'#ff8b37',emissiveIntensity:2.4},
    water:{diffuse:'#0c4057',gloss:.55},
    moon:{diffuse:'#ffe5b1',emissive:'#ffe5b1',emissiveIntensity:1.5},
    beacon:{diffuse:'#78b8ad',emissive:'#68b9aa',emissiveIntensity:.85,gloss:.35},
    bark:{diffuse:'#513d35',gloss:.12},
    leaf:{diffuse:'#2f7163',gloss:.16},
    leafDark:{diffuse:'#235149',gloss:.14},
    stone:{diffuse:'#50646b',gloss:.18},
    bronze:{diffuse:'#9a6647',metalness:.2,gloss:.28},
    lantern:{diffuse:'#ffd78a',emissive:'#ffb957',emissiveIntensity:2.2},
    smoke:{diffuse:'#617681',opacity:.28,blend:true},
    starlight:{diffuse:'#d5f6ed',emissive:'#d5f6ed',emissiveIntensity:1.8}
  },
  lights:[
    {id:'moon-key',type:'directional',color:'#9cc8d5',intensity:1.18,rotation:[48,-28,0]},
    {id:'forge-light',type:'omni',color:'#ff9e52',intensity:2.1,range:10,position:[5.1,2.3,1.8]},
    {id:'forge-rim',type:'omni',color:'#efc16f',intensity:.85,range:7,position:[3.9,1.5,-.1]},
    {id:'beacon-fill',type:'omni',color:'#70dbc8',intensity:.75,range:9,position:[-6.8,2.0,2.3]},
    {id:'bridge-fill',type:'omni',color:'#efc77a',intensity:.58,range:8,position:[0,2.0,3.1]},
    {id:'storm-light',type:'omni',color:'#c7eaff',intensity:.35,range:30,position:[0,8,1]}
  ],
  entities,
  cameras:{
    'story.0':{
      position:[0,7.4,18.6],lookAt:[0,.8,-1.7],fov:46,
      portrait:{position:[.2,2.35,19.2],lookAt:[.3,.45,.7],fov:48}
    },
    'story.1':{
      position:[-1.3,4.7,11.6],lookAt:[-1.5,.7,1],fov:44,
      portrait:{position:[0,2.6,8.7],lookAt:[0,.5,1.1],fov:44}
    },
    'story.2':{
      position:[1.9,4.9,12.1],lookAt:[2.6,1.2,.2],fov:43,
      portrait:{position:[1.2,2.65,14.5],lookAt:[1.2,.65,.7],fov:48}
    },
    'story.3':{
      position:[1.0,6.1,13.2],lookAt:[1.8,2.0,.4],fov:46,
      portrait:{position:[2.6,2.7,10.7],lookAt:[2.8,1.1,.6],fov:46}
    },
    'story.4':{
      position:[3.6,4.2,10.5],lookAt:[4.9,.9,.7],fov:42,
      portrait:{position:[4.4,2.4,10.2],lookAt:[5.0,.85,.6],fov:46}
    },
    'story.5':{
      position:[-2.4,5.2,12.5],lookAt:[-3.5,1.4,1.2],fov:43,
      portrait:{position:[-4.2,2.5,7.6],lookAt:[-4.3,1.2,1.0],fov:42}
    },
    'mission':{
      position:[0,6.0,14.2],lookAt:[0,.9,.4],fov:48,
      portrait:{position:[.2,3.2,13.5],lookAt:[0,.8,.8],fov:48}
    },
    'mission.forge':{
      position:[4.1,3.3,9.7],lookAt:[5.0,1.15,.7],fov:43,
      portrait:{position:[4.2,2.45,10.4],lookAt:[5.0,.9,.7],fov:45}
    },
    'mission.ticket':{
      position:[-4.0,3.2,9.6],lookAt:[-4.2,1.2,.7],fov:43,
      portrait:{position:[-4.2,2.65,8.1],lookAt:[-4.25,1.2,.8],fov:41}
    },
    'mission.choice':{
      position:[0,5.0,13.2],lookAt:[0,.9,.7],fov:47,
      portrait:{position:[.1,3.05,12.6],lookAt:[0,.8,.8],fov:47}
    },
    'mission.failure':{
      position:[4.8,3.1,8.5],lookAt:[5.1,.9,1.0],fov:41,
      portrait:{position:[4.4,2.25,9.8],lookAt:[5.0,.8,.8],fov:44}
    },
    'mission.success':{
      position:[0,4.4,11.8],lookAt:[0,.6,1.0],fov:44,
      portrait:{position:[0,2.75,10.5],lookAt:[0,.55,1.0],fov:43}
    }
  },
  states:{
    'story.0':{camera:'story.0',animations:{pip:'idle'},hide:['broken-gear','new-gear','duplicate-gear','order-seal','reply-orb','storm-bolt-a','storm-bolt-b']},
    'story.1':{camera:'story.1',animations:{pip:'no'},show:['broken-gear'],hide:['new-gear','duplicate-gear','order-seal','reply-orb','storm-bolt-a','storm-bolt-b'],transforms:{'bridge-left-6':{rotation:[0,0,14]},'bridge-right-6':{rotation:[0,0,-14]}}},
    'story.2':{camera:'story.2',animations:{pip:'yes'},show:['order-seal'],hide:['new-gear','duplicate-gear','reply-orb','storm-bolt-a','storm-bolt-b','broken-gear']},
    'story.3':{camera:'story.3',animations:{pip:'no'},show:['reply-orb','storm-bolt-a','storm-bolt-b'],hide:['new-gear','duplicate-gear','order-seal','broken-gear']},
    'story.4':{camera:'story.4',animations:{pip:'no'},show:['duplicate-gear'],hide:['new-gear','reply-orb','order-seal','storm-bolt-a','storm-bolt-b','broken-gear']},
    'story.5':{camera:'story.5',animations:{pip:'wave'},hide:['new-gear','duplicate-gear','reply-orb','order-seal','storm-bolt-a','storm-bolt-b','broken-gear']},
    'mission':{camera:'mission.forge',animations:{pip:'idle'},hide:['new-gear','duplicate-gear','reply-orb','order-seal','storm-bolt-a','storm-bolt-b','broken-gear']}
  }
});