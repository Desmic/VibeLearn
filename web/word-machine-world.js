/* Episode-specific composition and semantic-state-to-presentation mapping. */
import {keeperCharacter,keeperMaterials,keeperProfile} from './game-character-spec.js';
import {tokenTrack,messageMachine,pavilion,smallTree,deliveryParcel} from './workshop-props.js';
import {makeWorldPackage} from './spec-game-world.js';

const entities=[
  {id:'sky-floor',primitive:'plane',material:'sky',position:[0,-1.2,0],scale:[140,1,140]},
  {id:'courtyard',primitive:'box',material:'stone',position:[0,-.35,0],scale:[12,.7,12]},
  {id:'courtyard-edge',primitive:'box',material:'ink',position:[0,-.8,0],scale:[12.3,.22,12.3]},
  {id:'back-wall',primitive:'box',material:'paper',position:[0,.4,-5.5],scale:[11.8,.8,.3]},
  {id:'left-path',primitive:'box',material:'path',position:[-2.7,.02,.2],scale:[1.3,.03,7]},
  {id:'right-path',primitive:'box',material:'path',position:[2.7,.02,.2],scale:[1.3,.03,7]},
  ...pavilion('library',[-3.1,0,-3.2],'coral'),
  ...pavilion('garden',[3.1,0,-3.2],'teal'),
  ...messageMachine('machine',[0,0,.6]),
  ...tokenTrack('output',[0,1.15,2.0]),
  ...smallTree('tree-a',[-4.8,0,-.9],1.05),...smallTree('tree-b',[4.8,0,-.9],1.12),
  ...smallTree('tree-c',[4.8,0,-4.3],.85),...smallTree('tree-d',[-4.8,0,-4.3],.75),
  ...keeperCharacter(),
  {id:'robot',asset:'courier',position:[1.7,0,2.6],scale:[.72,.72,.72],animation:'idle'},
  {id:'recipient',position:[3.2,0,-1.85]},
  {id:'recipient-body',parent:'recipient',primitive:'capsule',material:'lavender',position:[0,.6,0],scale:[.35,.65,.32]},
  {id:'recipient-head',parent:'recipient',primitive:'sphere',material:'gold',position:[0,1.12,0],scale:[.33,.33,.33]},
  {id:'recipient-note',parent:'recipient',primitive:'box',material:'paper',position:[.3,.9,.2],scale:[.45,.32,.06]},
  ...deliveryParcel('carried','robot',[0,.85,.7]),
  ...deliveryParcel('received','recipient',[.6,0,.1]),
  {id:'success-light',primitive:'torus',material:'mint',position:[3.1,.1,-1.25],scale:[1.5,.12,1.5],enabled:false},
  {id:'wrong-light',primitive:'torus',material:'coral',position:[-3.1,.1,-1.25],scale:[1.5,.12,1.5],enabled:false},
];
entities.find(e=>e.id==='keeper').enabled=true;
for(let i=0;i<9;i++){
  entities.push({id:`back-tower-${i}`,primitive:'box',material:i%2?'haze':'sky',position:[-16+i*4,1+i%3,-15-i%2*3],scale:[2.5,5+i%3*2,3]});
}
for(let side of [-1,1])for(let i=0;i<4;i++){
  entities.push({id:`path-light-${side}-${i}`,primitive:'sphere',material:'glow',position:[side*3.55,.22,2.3-i*1.1],scale:[.16,.16,.16]});
}
export const worldSpec={schemaVersion:'1',id:'word-workshop',version:'1',
  environment:{clearColor:'#a9cdd5',ambient:'#bdd9d8',exposure:1.12,toneMapping:'aces',fog:{type:'linear',color:'#a9cdd5',start:24,end:70}},
  materials:{...keeperMaterials,
    sky:{diffuse:'#a9cdd5'},haze:{diffuse:'#a1beca'},stone:{diffuse:'#e3d7bc'},paper:{diffuse:'#fff3d8'},
    ink:{diffuse:'#273f53',gloss:.3},dark:{diffuse:'#163147'},teal:{diffuse:'#3aa4a1',gloss:.3},
    coral:{diffuse:'#e98668'},gold:{diffuse:'#f0bf58',gloss:.4},mint:{diffuse:'#8be1bf',emissive:'#73dcbf',emissiveIntensity:1.2},
    path:{diffuse:'#f5e9d0'},leaf:{diffuse:'#689986'},wood:{diffuse:'#826953'},lavender:{diffuse:'#8c85b3'},
    glow:{diffuse:'#ffe8a9',emissive:'#ffd590',emissiveIntensity:.6}},
  assets:{courier:{type:'container',src:'/assets/quaternius-animated-robot.glb',transform:{position:[0,-.08,0],scale:[.52,.52,.52]},animations:{idle:'RobotArmature|Robot_Idle',run:'RobotArmature|Robot_Running',yes:'RobotArmature|Robot_Yes',no:'RobotArmature|Robot_No',wave:'RobotArmature|Robot_Wave'},defaultAnimation:'idle'}},
  entities,
  cameras:{overview:{position:[10,14,20],lookAt:[0,.5,0],fov:43,portrait:{position:[5,19,29],lookAt:[0,.7,0],fov:43}}},
  states:{arrival:{camera:'overview'}},
  player:keeperProfile({spawn:[-.9,0,4],surfaces:[{bounds:[-5.5,5.5,-5,5.4],height:0}],
    obstacles:[[-1.2,0,-.3,1.2,2.6,1.5],[-4.4,0,-4.3,-1.8,4,-2.2],[1.8,0,-4.3,4.4,4,-2.2]],
    camera:{yaw:-8,pitch:44,distance:13,portraitDistance:19,minDistance:8,maxDistance:27,targetHeight:1.0}})
};
const robotHome=[1.7,0,2.6];
function presentation(state,previous){
  if(typeof state==='number')return {show:['carried','carried-flower'],hide:['received','carried-book','machine-core','machine-ring','success-light','wrong-light',...Array.from({length:3},(_,i)=>`output-piece-${i}`)],transforms:{robot:{position:robotHome},recipient:{position:[3.2,0,-1.85]}},animations:{robot:'run'},transition:{entity:'robot',from:[1.7,0,-1.6],to:robotHome,duration:1600,finish:{animations:{robot:'idle'}}}};
  const s=state||{pieces:0,status:'building',round:0,destination:'Library'};
  const atDoor=s.status==='wrong'||s.status==='success';
  const x=s.destination==='Garden'?3.1:-3.1,position=atDoor?[x,0,-1.2]:robotHome;
  const parcel=s.round===1?'book':'flower',other=s.round===1?'flower':'book';
  const patch={show:['machine-core','machine-ring',`carried-${parcel}`,`received-${parcel}`,s.status==='success'?'received':'carried'],hide:['success-light','wrong-light',`carried-${other}`,`received-${other}`,s.status==='success'?'carried':'received'],transforms:{
    robot:{position},
    recipient:{position:[s.round===1?-3.2:3.2,0,-1.85]}},animations:{robot:atDoor?(s.status==='success'?'yes':'no'):'idle'}};
  for(let i=0;i<3;i++)patch[i<s.pieces?'show':'hide'].push(`output-piece-${i}`);
  if(atDoor){const id=s.status==='success'?'success-light':'wrong-light';patch.show.push(id);patch.transforms[id]={position:[x,.1,-1.25]};}
  if(previous&&previous.status!==s.status&&atDoor){patch.transition={entity:'robot',from:robotHome,to:position,duration:1300,finish:{animations:{robot:s.status==='success'?'yes':'no'},...(s.status==='success'?{show:['received'],hide:['carried']}:{})}};patch.animations.robot='run';if(s.status==='success'){patch.show=patch.show.filter(id=>id!=='received');patch.hide=patch.hide.filter(id=>id!=='carried');patch.show.push('carried');patch.hide.push('received');}}
  return patch;
}
const pkg=makeWorldPackage(worldSpec,presentation);
export const gameWorldManifest=pkg.gameWorldManifest;
export const createGameWorld=pkg.createGameWorld;
export const openingSpec={id:'word-machine.arrival.v1',title:'HOW LLMS WORK · THE MESSAGE WORKSHOP',subtitle:'Episode 1',finishLabel:'Make the first delivery →',scenes:[{
  beat:0,kicker:'MIRA IS WAITING AT THE GARDEN',title:'A flower. A robot. No route.',
  body:'You run the message machine. The robot follows what it writes.',
  markers:[{entity:'garden-sign',label:'Mira · Garden'},{entity:'library-sign',label:'Library'},{entity:'keeper-hood',label:'You'},{entity:'machine-button',target:'machine-button',label:'Wake the machine',hideWhenDone:true}],
  action:{target:'machine-button',label:'Wake the machine',patch:{show:['machine-core','machine-ring'],animations:{robot:'wave'}}},
  success:{fact:'The machine is awake. Build the robot’s route, one piece at a time.'}
}]};
