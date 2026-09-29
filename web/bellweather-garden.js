/* Bellweather's authored visual composition. Shared kit has no Bellweather IDs. */
import {floatingGarden,habitatTower} from './garden-world-kit.js';
export {gardenGeometries} from './garden-world-kit.js';
export const openingEnvironment={clearColor:'#8cbedd',ambient:'#45516d',exposure:1.03,toneMapping:'aces',fog:{type:'linear',color:'#bed6e5',start:48,end:175}};
export const gardenTextures={
  skyWash:{type:'gradient',colors:['#f9e5cc','#c5dce5','#87bdda','#589ac5']},
  pigment:{type:'brush',seed:23,colors:['#f7f4ef','#ece8e0','#ffffff','#e2ddd8']},
  foliage:{type:'brush',seed:41,colors:['#e9efdc','#b8d6be','#f7f1d3','#ceddcc']}
};
// Selected CC0 source meshes are pinned by the existing asset vendor. Palette is
// package data; importing a tree does not impose Bellweather's style on a game.
export const gardenAssets={
  receiverTree:{type:'container',src:'/assets/quaternius-birch-tree-5.glb'},
  blossomTree:{type:'container',src:'/assets/kenney-tree-detailed.glb',materialOverrides:{leafsGreen:'petalMid',woodBark:'bark',_defaultMat:'bark'}},
  shadeTree:{type:'container',src:'/assets/kenney-tree-oak.glb',materialOverrides:{leafsGreen:'canopyMid',woodBark:'bark'}},
  slenderTree:{type:'container',src:'/assets/kenney-tree-thin.glb',materialOverrides:{leafsGreen:'canopyLight',woodBark:'bark'}}
};
export const gardenMaterials={
  porcelain:{diffuse:'#e8dcc7',metalness:0,gloss:.26,texture:'pigment'},
  sunstone:{diffuse:'#d5bda4',metalness:0,gloss:.2},
  pavingWarm:{diffuse:'#ecd5b8',metalness:0,gloss:.2,texture:'pigment',textureRepeat:[2,2]},
  pavingLight:{diffuse:'#f2e5cb',metalness:0,gloss:.22,texture:'pigment',textureRepeat:[2,2]},
  solarGold:{diffuse:'#eab866',metalness:.65,gloss:.65},
  deepBlue:{diffuse:'#253b64',metalness:.25,gloss:.45},
  cliffShade:{diffuse:'#44577b',metalness:0,gloss:.12},
  aqua:{diffuse:'#72eadb',emissive:'#52cbbd',emissiveIntensity:.45,metalness:.1,gloss:.6},
  bark:{diffuse:'#404761',metalness:0,gloss:.15},
  canopyShade:{diffuse:'#23505a',metalness:0,gloss:.08},
  canopyMid:{diffuse:'#408d79',metalness:0,gloss:.1,texture:'foliage'},
  canopyLight:{diffuse:'#80be94',metalness:0,gloss:.12,texture:'foliage'},
  petalShade:{diffuse:'#96456f',metalness:0,gloss:.1},
  petalMid:{diffuse:'#d76d91',metalness:0,gloss:.1,texture:'pigment'},
  petalLight:{diffuse:'#f0a8b2',metalness:0,gloss:.1,texture:'pigment'},
  water:{diffuse:'#399eab',metalness:.3,gloss:.9},
  waterGlint:{diffuse:'#a3ecdf',emissive:'#78c5ca',emissiveIntensity:.15,metalness:.2,gloss:.85},
  cloudLight:{diffuse:'#eaf0ed',unlit:true},
  cloudShade:{diffuse:'#b3cbd9',unlit:true},
  farCity:{diffuse:'#7095af',metalness:0,gloss:.1},
  farGlass:{diffuse:'#425b82',metalness:.2,gloss:.35},
  skyWash:{diffuse:'#ffffff',texture:'skyWash',unlit:true,fog:false},
  heroShell:{diffuse:'#ede5d6',metalness:.15,gloss:.45},
  heroFrame:{diffuse:'#364864',metalness:.4,gloss:.5},
  heroJoint:{diffuse:'#202a43',metalness:.1,gloss:.3},
  companionCoral:{diffuse:'#d66b59',metalness:.2,gloss:.5},
  companionTeal:{diffuse:'#328d91',metalness:.2,gloss:.5},
  companionVisor:{diffuse:'#162c43',metalness:.35,gloss:.7},
  companionEyes:{diffuse:'#aee8e4',emissive:'#83d6d7',emissiveIntensity:.4,gloss:.3}
};

export function bellweatherGarden(){
  const out=[],parent='bellweather-zone';
  const form=(id,geometry,material,position,scale,extra={})=>out.push({id,parent,geometry,material,position,scale,...extra});
  const part=(id,primitive,material,position,scale,extra={})=>out.push({id,parent,primitive,material,position,scale,...extra});
  part('bellweather-sky','plane','skyWash',[0,25,-110],[300,1,160],{rotation:[90,0,0],castShadows:false,receiveShadows:false});
  form('bellweather-island','disc','porcelain',[0,-.55,0],[26,1.1,26]);
  form('bellweather-lip','disc','deepBlue',[0,-1.2,0],[26.4,.24,26.4]);
  form('bellweather-keel','keel','cliffShade',[0,-3.3,0],[25,4,25],{rotation:[180,0,0]});
  form('bellweather-square','disc','sunstone',[0,.013,1],[18,.024,18]);
  form('bellweather-inlay','fineRing','solarGold',[0,.032,1],[17,.2,17],{castShadows:false});
  for(let row=0;row<6;row++)for(let col=0;col<3;col++){
    part(`bell-paving-${row}-${col}`,'box',(row+col)%3===0?'pavingWarm':'pavingLight',[(col-1)*2.2,.03,7-row*2.25],[2.12,.025,2.14],{castShadows:false});
  }
  for(const side of [-1,1]){
    form(`terrace-water-${side}`,'disc','water',[side*10,.04,.5],[3.4,.05,8],{castShadows:false});
    form(`terrace-pool-rim-${side}`,'fineRing','porcelain',[side*10,.055,.5],[3.6,.7,8.2]);
    for(let i=0;i<3;i++)form(`terrace-ripple-${side}-${i}`,'fineRing','waterGlint',[side*10,.083,i*1.4-1],[1.5+i*.15,.1,1],{castShadows:false});
    form(`terrace-rail-${side}`,'arc','porcelain',[0,.62,0],[25.4,2,25.4],{rotation:[0,side<0?12:192,0]});
    for(let i=0;i<5;i++){
      const a=(i*25+(side<0?18:198))*Math.PI/180;
      part(`terrace-post-${side}-${i}`,'cylinder','deepBlue',[Math.cos(a)*12.15,.31,Math.sin(a)*12.15],[.1,.62,.1]);
    }
  }
  // A inhabited-scale facade frames one side of the playable clearing. Broad
  // shadowed recesses and cantilevered terraces, not an extra wall across play.
  out.push({id:'garden-arcade',parent,position:[-13,0,1],rotation:[0,-12,0]});
  for(let i=0;i<3;i++){
    const z=-5+i*4;
    part(`arcade-pier-${i}`,'box','porcelain',[0,4,z],[1.15,8,1.35],{parent:'garden-arcade',rotation:[0,0,-9]});
    part(`arcade-inset-${i}`,'box','deepBlue',[.61,4.3,z],[.05,5.3,.65],{parent:'garden-arcade',rotation:[0,0,-9]});
    part(`arcade-brow-${i}`,'box','solarGold',[.9,6.7,z],[2.7,.14,1.5],{parent:'garden-arcade',rotation:[0,0,-9]});
  }
  form('arcade-upper-terrace','disc','porcelain',[-12.5,7.3,.5],[8,.45,17]);
  form('arcade-shadow-line','disc','deepBlue',[-12.5,7,.5],[7.8,.13,16.8]);
  form('arcade-crown','shellArc','porcelain',[-13,9.5,-.4],[7,7,13],{rotation:[90,0,-12]});
  // Distinct receiver island: signal ribbons reach it, no walkable bridge yet.
  form('receiver-island','disc','porcelain',[0,-1.4,-24],[13,1.2,10]);
  form('receiver-underbelly','keel','cliffShade',[0,-4,-24],[12,4,9],{rotation:[180,0,0]});
  form('receiver-stabilizer','fineRing','aqua',[0,-2,-24],[14,.6,11],{castShadows:false});
  out.push({id:'receiver-spire',parent,position:[0,0,-21]});
  form('receiver-spire-stem','column','deepBlue',[0,1.3,-1.5],[1.2,2.6,1.2],{parent:'receiver-spire'});
  form('receiver-spire-crown','fineRing','solarGold',[0,2.8,-1.5],[4.2,2,4.2],{parent:'receiver-spire'});
  form('receiver-spire-portal','arc','aqua',[0,3.5,1.1],[7.8,2,8.8],{parent:'receiver-spire',rotation:[90,0,12]});
  for(const side of [-1,1]){
    form(`receiver-spire-wing-${side}`,'shellArc','porcelain',[side*1.4,3.8,-.6],[8.6,2.8,11],{parent:'receiver-spire',rotation:[90,side*10,side<0?12:192]});
    part(`receiver-spire-light-${side}`,'sphere','aqua',[side*2.1,4.6,1.2],[.38,.38,.25],{parent:'receiver-spire'});
  }
  part('receiver-spire-label','sphere','rose',[0,7.2,0],[.35,.35,.35],{parent:'receiver-spire'});
  out.push({id:'receiver-blossom',parent:'receiver-spire',asset:'receiverTree',position:[0,0,-2.4],scale:[2.5,1.85,2.5],rotation:[0,28,0]});
  // Two future meeting places share the island, but have different purposes and
  // silhouettes. The player's inspection can frame real seats / arrival lights.
  out.push({id:'garden-receiver',parent,position:[-3.5,0,-18.5]});
  form('garden-receiver-deck','disc','porcelain',[0,-.12,0],[6.5,.3,5],{parent:'garden-receiver'});
  part('garden-receiver-support','box','deepBlue',[0,-.65,-1.5],[1.6,1,5],{parent:'garden-receiver'});
  form('garden-receiver-shadow','disc','deepBlue',[0,-.31,0],[6.6,.12,5.1],{parent:'garden-receiver'});
  for(const side of [-1,1]){
    part(`garden-seat-${side}`,'box','canopyMid',[side*1.05,.62,-.7],[1.45,.22,1.05],{parent:'garden-receiver'});
    part(`garden-seat-back-${side}`,'box','porcelain',[side*1.05,1.12,-1.1],[1.45,.85,.16],{parent:'garden-receiver',rotation:[-10,0,0]});
    for(const x of [-.48,.48])part(`garden-seat-foot-${side}-${x}`,'box','deepBlue',[side*1.05+x,.28,-.7],[.13,.56,.8],{parent:'garden-receiver'});
  }
  part('garden-receiver-canopy-post','cylinder','deepBlue',[-2.3,1.5,-1.9],[.18,3,.18],{parent:'garden-receiver'});
  form('garden-receiver-canopy','petal','porcelain',[-1.1,3.05,-.8],[5.2,.18,3.4],{parent:'garden-receiver',rotation:[0,15,-8]});
  form('garden-receiver-table','disc','solarGold',[0,.65,.6],[.8,.12,.8],{parent:'garden-receiver'});
  part('garden-receiver-table-post','cylinder','deepBlue',[0,.31,.6],[.12,.62,.12],{parent:'garden-receiver'});
  part('garden-receiver-beacon','sphere','aqua',[0,1.15,1.5],[.5,.5,.5],{parent:'garden-receiver',enabled:false});
  form('garden-receiver-arrival','fineRing','aqua',[0,.065,.65],[2.1,.5,1.9],{parent:'garden-receiver',enabled:false,castShadows:false});
  out.push({id:'skybridge-receiver',parent,position:[8,9.2,-23]});
  form('skybridge-receiver-pier','column','deepBlue',[-2.4,-4.8,0],[.55,9.6,.65],{parent:'skybridge-receiver'});
  part('skybridge-receiver-support','box','deepBlue',[-3,-.65,0],[5,.5,.8],{parent:'skybridge-receiver'});
  form('skybridge-receiver-deck','disc','porcelain',[0,-.15,0],[5.6,.38,3.8],{parent:'skybridge-receiver'});
  form('skybridge-receiver-keel','keel','deepBlue',[0,-1.1,-.3],[3.9,1.6,2.7],{parent:'skybridge-receiver',rotation:[180,0,0]});
  form('skybridge-receiver-rail','arc','solarGold',[0,.95,0],[5.4,2,3.6],{parent:'skybridge-receiver',rotation:[0,180,0]});
  for(const side of [-1,1]){
    part(`skybridge-receiver-post-${side}`,'box','deepBlue',[side*1.5,.65,-.6],[.18,1.3,.24],{parent:'skybridge-receiver'});
    part(`skybridge-receiver-light-${side}`,'sphere','solarGold',[side*1.5,1.45,-.6],[.5,.5,.5],{parent:'skybridge-receiver',enabled:false});
    form(`skybridge-receiver-arrival-${side}`,'fineRing','solarGold',[side*1.2,.065,.7],[1.1,.5,1.1],{parent:'skybridge-receiver',enabled:false,castShadows:false});
  }
  out.push({id:'skybridge-receiver-beacon',parent:'skybridge-receiver',position:[0,1.6,0]});
  // Transit stays to one side of the receiver's silhouette.
  for(const x of [-22,12,22])form(`transit-pylon-${x}`,'column','porcelain',[x,3.5,-12],[.34,7,.34]);
  part('transit-beam','box','deepBlue',[0,7,-12],[48,.23,.35]);
  part('transit-glow','box','aqua',[0,7.13,-12],[48,.05,.22]);
  out.push({id:'transit-pod',parent,position:[10,7.6,-12]});
  part('transit-pod-shell','capsule','porcelain',[0,0,0],[1,3.6,1.1],{parent:'transit-pod',rotation:[0,0,90]});
  part('transit-pod-window','box','deepBlue',[0,.12,.5],[2.5,.42,.05],{parent:'transit-pod'});
  part('transit-pod-window-reverse','box','deepBlue',[0,.12,-.5],[2.5,.42,.05],{parent:'transit-pod'});
  for(const [id,x,z,scale,pink] of [['west',-10,-4,1.1,true],['east',10,-4,1,false],['entry',-11,4,.8,true]]){
    out.push({id:`garden-${id}`,parent,asset:pink?'blossomTree':'shadeTree',position:[x,.22,z],scale:[scale*4.5,scale*4.5,scale*4.5],rotation:[0,id==='east'?48:-20,0]});
    form(`garden-bed-${id}`,'disc','porcelain',[x,.12,z],[4,.24,3.6]);
    form(`garden-soil-${id}`,'disc','canopyShade',[x,.25,z],[3.4,.03,3]);
  }
  // Layered distances and varied height give a city beyond this bounded plaza.
  for(const [id,x,y,z,scale] of [['west',-22,1,-12,1],['east',22,.2,-12,1.2],['high',-15,1,35,.85]]){
    const root=`sky-garden-${id}`;
    out.push(...floatingGarden(root,[x,y,z],{parent,scale}));
    out.push(...habitatTower(`${root}-home`,[1,0,-1],{parent:root,height:id==='high'?14:10,width:4}));
    out.push({id:`${root}-tree`,parent:root,asset:'slenderTree',position:[-3,.04,1],scale:[3.3,3.3,3.3],castShadows:false});
  }
  for(let i=0;i<5;i++){
    const x=i===0?-4:i===4?-20:(i-2)*18,z=i===0?34:i===4?52:-50-(i%3)*12,h=14+(i*7)%19;
    if(i===0||i===4)out.push(...floatingGarden(`horizon-${i}-foundation`,[x,-2,z],{parent,scale:1.4,deck:'farCity',underside:'farGlass',rim:'cloudShade'}));
    out.push(...habitatTower(`horizon-${i}`,[x,-2,z],{parent,height:h,width:8,body:'farCity',glass:'farGlass',trim:'cloudShade',plant:'farCity'}));
  }
  // Cloud banks live below the route, leaving the focal sky uncluttered. No
  // particles, transparency layers, extra shadow passes or perpetual simulation.
  for(const [i,x,y,z,s] of [[0,-23,-8,-5,15],[1,20,-9,-18,18],[2,-3,-10,-35,22],[3,-30,-5,-48,17],[4,36,-4,-60,24],[5,-10,-2,-85,25]]){
    form(`cloud-${i}-shade`,'petal','cloudShade',[x,y-.6,z],[s,3,s*.65],{castShadows:false,receiveShadows:false});
    form(`cloud-${i}-light`,'petal','cloudLight',[x-2,y+.2,z-1],[s*.85,2.8,s*.55],{castShadows:false,receiveShadows:false});
  }
  // This package knows which scenery is immutable. The shared renderer must not
  // infer that every decorative-looking object is safe to batch: the pod moves,
  // the sky is hidden separately, and imported trees have their own containers.
  return out.map(item=>(item.primitive||item.geometry)&&item.id!=='bellweather-sky'&&item.parent!=='transit-pod'
    ?{...item,batchGroup:'scenery'}:item);
}
