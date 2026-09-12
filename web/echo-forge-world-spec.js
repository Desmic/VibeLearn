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

entities.push({id:'pip',position:[-5.2,.3,1.2],scale:[1.15,1.15,1.15]});
child('pip-body','pip','box','pip',[0,.68,0],[.72,.78,.56]);
child('pip-head','pip','box','pip',[0,1.38,0],[.92,.62,.62]);
child('pip-eye-l','pip','sphere','glass',[-.22,1.4,.34],[.14,.14,.09],{motion:{type:'pulse',amplitude:.06,speed:2.6}});
child('pip-eye-r','pip','sphere','glass',[.22,1.4,.34],[.14,.14,.09],{motion:{type:'pulse',amplitude:.06,speed:2.6}});
child('pip-scarf','pip','box','red',[.42,1.03,-.05],[.7,.1,.25],{rotation:[0,-18,-6]});
child('pip-antenna','pip','cylinder','pip',[0,1.95,0],[.05,.48,.05],{rotation:[0,0,4]});
child('pip-beacon','pip','sphere','glass',[0,2.2,0],[.14,.14,.14],{motion:{type:'pulse',amplitude:.12,speed:2.2}});

entities.push({id:'forge',position:[5.3,.15,-.5]});
child('forge-body','forge','box','forge',[0,1,0],[2.5,1.9,2.15]);
child('forge-roof','forge','cone','dark',[0,2.48,0],[3.0,1.3,3.0],{rotation:[0,45,0]});
child('forge-window-l','forge','box','glass',[-.65,1.3,1.1],[.38,.38,.08],{motion:{type:'pulse',amplitude:.05,speed:1.7}});
child('forge-window-r','forge','box','glass',[-.08,1.3,1.1],[.38,.38,.08],{motion:{type:'pulse',amplitude:.05,speed:1.9}});
child('forge-furnace','forge','sphere','ember',[.68,.72,1.12],[.72,.72,.18],{motion:{type:'pulse',amplitude:.12,speed:2.5}});
child('forge-sign','forge','torus','gold',[0,2.2,1.15],[1.0,.22,1.0],{rotation:[90,0,0],motion:{type:'spin',axis:[0,0,1],speed:8}});

for(let i=0;i<7;i++){
  const x=-2.6+i*.42;
  add(`bridge-left-${i}`,'box','wood',[x,.18,1],[.34,.14,1.05]);
  add(`bridge-right-${i}`,'box','wood',[-x,.18,1],[.34,.14,1.05]);
}
add('broken-gear','torus','gold',[0,.58,1.1],[1.15,.34,1.15],{rotation:[90,0,0],motion:{type:'spin',axis:[0,1,0],speed:16}});
add('new-gear','torus','gold',[4.55,.78,1.15],[1.4,.42,1.4],{enabled:false,rotation:[90,0,0],motion:{type:'spin',axis:[0,1,0],speed:22}});
add('duplicate-gear','torus','danger',[5.72,.78,1.15],[1.4,.42,1.4],{enabled:false,rotation:[90,0,0],motion:{type:'spin',axis:[0,1,0],speed:-22}});
add('order-seal','box','paper',[-4.0,1.72,.12],[.8,.5,.07],{enabled:false,motion:{type:'bob',amplitude:.12,speed:2}});
add('reply-orb','sphere','glass',[4.2,2.18,.42],[.48,.48,.48],{enabled:false,motion:{type:'bob',amplitude:.18,speed:2.5}});
add('storm-bolt-a','box','storm',[0,4.6,.2],[.12,2.8,.12],{enabled:false,rotation:[0,0,16]});
add('storm-bolt-b','box','storm',[.48,2.9,.2],[.12,1.5,.12],{enabled:false,rotation:[0,0,-18]});

const beaconPositions=[[-7,2],[-3,-7],[0,-12],[4,-8],[7,2],[10,-10],[-10,-9]];
beaconPositions.forEach(([x,z],i)=>{
  add(`beacon-${i}`,'cylinder','dark',[x,.5,z],[.18,2.3,.18]);
  add(`beacon-lamp-${i}`,'sphere',i===0?'glass':'beacon',[x,1.78,z],[.42,.42,.42],{motion:{type:'pulse',amplitude:i===0?.14:.04,speed:1.5+i*.07}});
});

export const echoForgeWorldSpec=Object.freeze({
  schemaVersion:'1',
  id:'relay-rescue.echo-forge',
  version:'pc-phase1-1',
  environment:{clearColor:'#071824',ambient:'#38525f'},
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
    beacon:{diffuse:'#35545d',emissive:'#35545d',emissiveIntensity:.08}
  },
  lights:[
    {id:'moon-light',type:'directional',color:'#ffd9a6',intensity:1.6,rotation:[42,-28,0]},
    {id:'forge-light',type:'omni',color:'#ffa957',intensity:2.4,range:13,position:[5.1,2.0,1.3]},
    {id:'storm-light',type:'omni',color:'#c7eaff',intensity:.45,range:30,position:[0,8,1]}
  ],
  entities,
  cameras:{
    'story.0':{position:[0,7.4,18.6],lookAt:[0,.8,-1.7],fov:46},
    'story.1':{position:[-1.3,4.7,11.6],lookAt:[-1.5,.7,1],fov:44},
    'story.2':{position:[1.9,4.9,12.1],lookAt:[2.6,1.2,.2],fov:43},
    'story.3':{position:[1.0,6.1,13.2],lookAt:[1.8,2.0,.4],fov:46},
    'story.4':{position:[3.6,4.2,10.5],lookAt:[4.9,.9,.7],fov:42},
    'story.5':{position:[-2.4,5.2,12.5],lookAt:[-3.5,1.4,1.2],fov:43},
    'mission':{position:[0,6.0,14.2],lookAt:[0,.9,.4],fov:48}
  },
  states:{
    'story.0':{camera:'story.0',hide:['broken-gear','new-gear','duplicate-gear','order-seal','reply-orb','storm-bolt-a','storm-bolt-b']},
    'story.1':{camera:'story.1',show:['broken-gear'],hide:['new-gear','duplicate-gear','order-seal','reply-orb','storm-bolt-a','storm-bolt-b'],transforms:{'bridge-left-6':{rotation:[0,0,14]},'bridge-right-6':{rotation:[0,0,-14]}}},
    'story.2':{camera:'story.2',show:['order-seal','new-gear'],hide:['duplicate-gear','reply-orb','storm-bolt-a','storm-bolt-b','broken-gear']},
    'story.3':{camera:'story.3',show:['new-gear','reply-orb','storm-bolt-a','storm-bolt-b'],hide:['duplicate-gear','order-seal','broken-gear']},
    'story.4':{camera:'story.4',show:['new-gear','duplicate-gear'],hide:['reply-orb','order-seal','storm-bolt-a','storm-bolt-b','broken-gear']},
    'story.5':{camera:'story.5',show:['new-gear'],hide:['duplicate-gear','reply-orb','order-seal','storm-bolt-a','storm-bolt-b','broken-gear']},
    'mission':{camera:'mission',show:['new-gear'],hide:['duplicate-gear','reply-orb','order-seal','storm-bolt-a','storm-bolt-b','broken-gear']}
  }
});
