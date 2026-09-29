/* Isolated visual experiment. No learner API, assessment, save or active route. */
import * as pc from '../vendor/playcanvas.mjs';
import {createPlayCanvasWorld} from '../playcanvas-backend.js';
import {worldSpec as current} from '../first-words-world.js';
import {companionRobot} from '../rescue-world-props.js';

const host=document.querySelector('#world'),$=id=>document.getElementById(id);
const entities=[{id:'zip',asset:'robot',position:[0,0,3]},
  {id:'garden-anchor',position:[-4.3,1.6,-6]}, {id:'skybridge-anchor',position:[4,1.9,-14]},
  {id:'reply-anchor',position:[-3,2.4,-8]},
  {id:'garden-body',position:[-4.3,.8,-6],collider:{shape:'box',halfExtents:[.65,.8,.65]}},
  {id:'relay-body',position:[4,1,-14],collider:{shape:'box',halfExtents:[.6,1,.6]}}];
const mats={stone:{diffuse:'#e7d6b8',gloss:.3},ivory:{diffuse:'#f2dfbb',gloss:.35},ink:{diffuse:'#29475f',gloss:.35},gold:{diffuse:'#c89850',metalness:.5,gloss:.6},
  paving:{diffuse:'#e5cfac',gloss:.4},soil:{diffuse:'#3c625b',gloss:.05},aqua:{diffuse:'#8fddd5',emissive:'#65b7b6',emissiveIntensity:.25},coral:{diffuse:'#c95b72',gloss:.2},teal:{diffuse:'#35878d',gloss:.3},...current.materials};
const shell={plate:'heroShell',frame:'heroFrame',visor:'companionVisor',eyes:'companionEyes',trim:'solarGold'};
entities.push(...companionRobot('mira',[-3,0,-8],{height:2,color:'companionCoral',shell,solid:true}),...companionRobot('tavi',[2.5,0,-16],{height:1.5,round:true,color:'companionTeal',shell,solid:true}));
const spec={schemaVersion:'1',id:'bellweather-visual-benchmark',version:'1',materials:mats,textures:current.textures,assets:{robot:current.assets.robot},entities,
  environment:{clearColor:'#82bacd',ambient:'#a4b8c5',exposure:1,toneMapping:'aces',fog:{type:'linear',color:'#b6d1d8',start:60,end:220}},
  lights:[{id:'sun',type:'directional',color:'#ffe1b2',intensity:1.7,rotation:[42,-52,0],castShadows:true,shadowResolution:2048,shadowDistance:48,numCascades:2,shadowFilter:'pcf3',shadowBias:.12,normalOffsetBias:.06}],
  cameras:{start:{position:[8,5,20],lookAt:[0,2,-10],fov:52}},
  player:{version:'1',entity:'zip',spawn:[0,0,3],speed:4,body:{radius:.34,height:1.55},surfaces:[{bounds:[-6,4.4,-25,14],height:0}],
    animations:{idle:'idle',move:'run'},animationSpeeds:{idle:0,move:1},camera:{yaw:-16,pitch:10,distance:7,portraitDistance:10,minDistance:4,maxDistance:15,targetHeight:1.3}}};
const world=createPlayCanvasWorld(host,spec,{pixelRatioCap:1.25});
if(!world.available)throw Error(world.error);
world.setControlMode('third-person',spec.id);
const app=world.app,device=app.graphicsDevice;
app.scene.ambientLight=new pc.Color(.16,.23,.34);
const batches=new Map(),ownedMeshes=[],ownedTextures=[];
const color=hex=>new pc.Color().fromString(hex);
function material(name,hex,{metal=0,gloss=.35,unlit=false}={}){
  const m=new pc.StandardMaterial();m.name=name;m.diffuse=color(hex);m.useMetalness=true;m.metalness=metal;m.gloss=gloss;
  if(unlit){m.useLighting=false;m.diffuse=new pc.Color(0,0,0);m.emissive=color(hex);}m.update();return m;
}
const palette={ivory:material('warm limestone','#e9d5b0'),bright:material('sunlit porcelain','#f5e6c9'),ink:material('indigo structure','#324a66'),gold:material('brushed brass','#d0a462',{metal:.6,gloss:.55}),
  ground:material('sandstone paving','#dcc6a3',{gloss:.38}),joint:material('paving joints','#b49e82'),soil:material('garden soil','#345750'),grass:material('garden green','#648477'),
  glass:material('shaded glazing','#326473',{metal:.25,gloss:.8}),water:material('still water','#448f9a',{metal:.6,gloss:.94}),leaf:material('lily leaf','#458879'),petal:material('blossom','#d77f9c'),cloud:material('cloud bank','#e5e6d9',{unlit:true}),
  far:material('distant city','#82a7b3'),planet:material('high moon','#d9d6bf',{unlit:true}),signal:material('signal','#bceade',{unlit:true})};
// Native geometry is consolidated by material/shadow policy, not one draw per
// semantic object. This local experiment does not expand the production schema.
function shape(kind,mat,p,s,r=[0,0,0],shadow=true,opts={}){
  const ctor={box:pc.BoxGeometry,sphere:pc.SphereGeometry,cylinder:pc.CylinderGeometry,cone:pc.ConeGeometry,torus:pc.TorusGeometry}[kind];
  const g=new ctor({...(kind==='sphere'?{latitudeBands:12,longitudeBands:16}:kind==='cylinder'||kind==='cone'?{capSegments:24}:{}),...opts});
  merge(g,mat,p,s,r,shadow);
}
function merge(g,mat,p=[0,0,0],s=[1,1,1],r=[0,0,0],shadow=true){
  const key=mat+':'+shadow;let b=batches.get(key);if(!b){b={mat,shadow,p:[],n:[],uv:[],i:[]};batches.set(key,b);}
  const offset=b.p.length/3,q=new pc.Quat().setFromEulerAngles(r[0]||0,r[1]||0,r[2]||0),v=new pc.Vec3(),n=new pc.Vec3();
  for(let i=0;i<g.positions.length;i+=3){v.set(g.positions[i]*s[0],g.positions[i+1]*s[1],g.positions[i+2]*s[2]);q.transformVector(v,v);b.p.push(v.x+p[0],v.y+p[1],v.z+p[2]);
    n.set(g.normals[i]/s[0],g.normals[i+1]/s[1],g.normals[i+2]/s[2]);q.transformVector(n,n);n.normalize();b.n.push(n.x,n.y,n.z);}
  b.uv.push(...(g.uvs||Array(g.positions.length/3*2).fill(0)));for(const i of g.indices)b.i.push(i+offset);
}
function flush(){for(const b of batches.values()){
  const mesh=new pc.Mesh(device);mesh.setPositions(b.p);mesh.setNormals(b.n);mesh.setUvs(0,b.uv);mesh.setIndices(b.i);mesh.update();ownedMeshes.push(mesh);
  const node=new pc.Entity('architecture:'+b.mat);node.addComponent('render',{meshInstances:[new pc.MeshInstance(mesh,palette[b.mat])],castShadows:b.shadow,receiveShadows:true});app.root.addChild(node);
}}
// Broad continuous terrace, stepped edge and a planted water court. The playable
// strip stays clear: color/depth comes from framing, not scattered path obstacles.
shape('box','ink',[0,-1.15,-8],[26,2.2,62]);shape('box','ivory',[0,-.45,-8],[26.5,.8,62.5]);
shape('box','ground',[-1,-.05,-6],[18,.1,48]);
for(let z=-28;z<18;z+=3.2){shape('box','joint',[-1,.006,z],[17,.008,.025],[],false);for(const x of [-5.5,-1,3.5])shape('box','joint',[x,.006,z+1.6],[.025,.008,3.17],[],false);}
shape('box','ivory',[-9,.3,-7],[1.5,.6,60]);shape('box','soil',[-9,.62,-7],[1.2,.08,59]);
shape('box','ivory',[8,.2,-8],[6,.4,59]);shape('box','water',[7.1,.42,-8],[4.5,.025,56],[],false);
shape('box','gold',[4.8,.44,-8],[.09,.035,56],[],false);
for(let z=-28;z<18;z+=8){shape('box','ivory',[10.5,.5,z],[1.9,1,2.8]);shape('box','soil',[10.5,1.02,z],[1.6,.08,2.5]);}
// Occupied-scale architecture: deep shade, repeating arcades and projecting
// gardens; combine these original forms rather than importing a mismatched kit.
shape('box','ink',[-14,8,-11],[7,16,51]);
for(let z=-30;z<=12;z+=7){
  shape('box','ivory',[-10.7,6,z],[1.2,12,1.25],[0,0,-8]);
  shape('box','glass',[-10.9,4,z-2.8],[.1,5,3.8]);
  shape('box','ivory',[-12.8,7,z-2.2],[7,.5,6.7]);shape('box','gold',[-9.25,7.23,z-2.2],[.12,.08,6.7]);
  shape('box','soil',[-9.8,7.55,z-2.2],[1,.5,6]);
  shape('box','ivory',[-13,13,z-2.2],[7.5,.5,6.7]);shape('box','gold',[-9.2,13.25,z-2.2],[.12,.06,6.7]);
  // A bench and slender roof edge read at the scale of the player.
  shape('box','ivory',[-7.7,.6,z-2.5],[1.4,.25,2.8]);shape('box','ink',[-8.25,.3,z-2.5],[.18,.6,2.7]);
}
// Far garden and its branching crown; the solid landmark is visible from several
// playable positions, framed by paired structural fins.
shape('cylinder','ivory',[2,-1,-66],[30,2,25],[],false);shape('cone','ink',[2,-8,-66],[27,14,22],[180,0,0],false);
shape('cylinder','grass',[2,.1,-66],[26,.2,21],[],false);
for(const side of [-1,1])for(let j=0;j<2;j++)shape('torus','bright',[2+side*(7+j*4),2,-67+j*2],[1,1,1],[-90,side*12,side*12],false,{ringRadius:13-j*2,tubeRadius:.38+j*.14,sectorAngle:120,segments:32,sides:6});
// A readable thin bridge and a transit line recede in different directions.
shape('box','ivory',[0,-.5,-42],[6,.6,16],[],false);for(const side of [-1,1])shape('box','gold',[side*2.8,.5,-42],[.08,1.1,16],[],false);
shape('box','ink',[7,13,-44],[110,.38,1.6],[0,-15,0],false);shape('box','bright',[7,13.3,-44],[110,.16,1.8],[0,-15,0],false);
for(const x of [-40,35])shape('box','ivory',[x,3,-44-x*.26],[1.5,20,2],[0,0,x<0?-10:10],false);
// Distant floating districts share a restrained silhouette and get cheaper with
// distance. They are scenery, not a claim of additional playable levels.
for(let i=0;i<12;i++){
  const x=(i%2?-1:1)*(25+(i%6)*13),z=-65-Math.floor(i/2)*20,y=3+(i%4)*7;
  shape('cylinder',i>5?'far':'ivory',[x,y,z],[14,1,12],[],false);shape('cone','far',[x,y-5,z],[12,10,10],[180,0,0],false);
  for(let j=0;j<3;j++)shape('cone',i>5?'far':'bright',[x+(j-1)*3,y+5+j*2,z],[2.2,10+j*4,2.2],[],false,{peakRadius:.13,baseRadius:.5});
}
// Cloud masses below the traversable plane, not transparency over every pixel.
for(let i=0;i<38;i++){const a=i*2.399,x=Math.cos(a)*(30+i*2.5),z=-35+Math.sin(a)*(40+i*2);shape('sphere','cloud',[x,-16-(i%3)*4,z],[25+i%5*5,5+i%3,18+i%4*5],[],false);}
shape('sphere','planet',[83,75,-195],[95,95,95],[],false);
shape('torus','planet',[83,75,-195],[1,1,1],[24,0,16],false,{ringRadius:68,tubeRadius:.65,segments:96,sides:5});
// Signal objects and distant seats retain the two existing visual meanings.
for(const [x,z] of [[-4.3,-6],[4,-14]]){shape('cylinder','ivory',[x,.5,z],[1.2,1,1.2]);shape('torus','gold',[x,1,z],[1,1,1],[90,0,0],true,{ringRadius:.42,tubeRadius:.055,segments:24,sides:6});}
shape('sphere','signal',[-4.3,1.35,-6],[.42,.42,.42],[],false);
shape('box','ink',[3.6,1.4,-14],[.12,1.4,.16],[0,0,15]);shape('box','ink',[4.4,1.4,-14],[.12,1.4,.16],[0,0,-15]);shape('sphere','gold',[4,2,-14],[.38,.38,.38],[],false);
for(const x of [-1,2])shape('box','ivory',[x,.8,-55],[2,.25,1.2],[],false);
// Sheltered edges, curved overhangs and planted water establish foreground scale.
for(const z of [-20,-6,8]){
  shape('cylinder','ivory',[-12,7,z],[10,.45,8],[],true);
  shape('cylinder','ink',[-12,6.72,z],[9.8,.1,7.8],[],true);
  shape('box','gold',[-7.2,7.3,z],[.08,.07,5],[],false);
}
for(let i=0;i<48;i++){
  const z=15-i*.84,x=7.1+Math.sin(i*2.4)*1.55;
  shape('sphere','leaf',[x,.46,z],[.35+(i%3)*.15,.04,.4],[],false);
  if(i%3===0){shape('sphere','petal',[x,.58,z],[.18,.16,.18],[],false);}
}
// A finite family of feathered planting forms sits outside the clear walk strip.
for(let i=0;i<35;i++){
  const x=i%2?10.5:-9,z=15-Math.floor(i/2)*2.4;
  for(let j=0;j<3;j++)shape('cone','grass',[x+(j-1)*.18,.9,z],[.16,1.3+(i%4)*.15,.12],[10,j*42,(j-1)*22],false,{heightSegments:1,capSegments:5});
}
flush();
// Surface relief and pigment remain object-space textures, with no extra
// per-frame work or camera-space comic filter.
const pigment=document.createElement('canvas');pigment.width=256;pigment.height=256;const pg=pigment.getContext('2d');pg.fillStyle='#f0e9dd';pg.fillRect(0,0,256,256);
for(let i=0;i<700;i++){const v=(Math.sin(i*153.27)*43758.5)%1;pg.fillStyle=i%3?'#e6dfd3':'#f8f1e8';pg.globalAlpha=.22;pg.fillRect((i*73)%256,(i*127)%256,2+Math.abs(v)*12,1+Math.abs(v)*3);}
const pigmentTex=new pc.Texture(device,{width:256,height:256,mipmaps:true});pigmentTex.setSource(pigment);ownedTextures.push(pigmentTex);palette.ground.diffuseMap=pigmentTex;palette.ground.diffuseMapTiling=new pc.Vec2(10,28);palette.ground.update();
const normals=new Uint8Array(128*128*4);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const k=(y*128+x)*4;normals[k]=128+10*Math.sin(x*.35+y*.14);normals[k+1]=128+8*Math.sin(y*.27-x*.1);normals[k+2]=254;normals[k+3]=255;}
const waterNormal=new pc.Texture(device,{width:128,height:128,mipmaps:true});waterNormal.lock().set(normals);waterNormal.unlock();ownedTextures.push(waterNormal);palette.water.normalMap=waterNormal;palette.water.normalMapTiling=new pc.Vec2(6,20);palette.water.bumpiness=.35;palette.water.update();

// Environment reflections use the engine's convolution API. Procedural sky is
// generated once; it is not a screen filter or an every-frame lighting bake.
const sky=document.createElement('canvas');sky.width=512;sky.height=256;const cx=sky.getContext('2d');
const grad=cx.createLinearGradient(0,0,0,256);for(const [t,c] of [[0,'#427ca8'],[.35,'#83bfd5'],[.5,'#d1e4df'],[.58,'#e3dac1'],[1,'#63767b']])grad.addColorStop(t,c);cx.fillStyle=grad;cx.fillRect(0,0,512,256);
const glow=cx.createRadialGradient(105,75,0,105,75,75);glow.addColorStop(0,'#fff0c6');glow.addColorStop(1,'#fff0c600');cx.fillStyle=glow;cx.fillRect(0,0,512,256);
const skyTexture=new pc.Texture(device,{width:512,height:256,projection:pc.TEXTUREPROJECTION_EQUIRECT,mipmaps:true});skyTexture.setSource(sky);ownedTextures.push(skyTexture);
const envSource=pc.EnvLighting.generateLightingSource(skyTexture,{size:64});const atlas=pc.EnvLighting.generateAtlas(envSource,{size:256,numReflectionSamples:32,numAmbientSamples:32});ownedTextures.push(envSource,atlas);
app.scene.envAtlas=atlas;app.scene.skyboxIntensity=.38;
// Large inward-facing sphere keeps visible sky aligned with environment color.
const skyMat=material('sky','#ffffff',{unlit:true});skyMat.emissiveMap=skyTexture;skyMat.cull=pc.CULLFACE_FRONT;skyMat.useFog=false;skyMat.update();
const dome=new pc.Entity('sky');dome.addComponent('render',{type:'sphere',material:skyMat,castShadows:false,receiveShadows:false});dome.setLocalScale(450,450,450);app.root.addChild(dome);world.camera.camera.farClip=400;

let lightingPending=4;const lightingErrors=[],labAssets=[];
function loadTexture(name,apply){app.assets.loadFromUrl('assets/'+name,'texture',(error,asset)=>{
  lightingPending--;if(error){lightingErrors.push(String(error));return;}
  labAssets.push(asset);try{apply(asset.resource);}catch(e){lightingErrors.push(String(e));}app.renderNextFrame=true;
});}
loadTexture('syferfontein_0d_clear_puresky_1k.hdr',source=>{
  source.projection=pc.TEXTUREPROJECTION_EQUIRECT;
  const lighting=pc.EnvLighting.generateLightingSource(source,{size:64}),environment=pc.EnvLighting.generateAtlas(lighting,{size:256,numReflectionSamples:32,numAmbientSamples:32});
  ownedTextures.push(lighting,environment);app.scene.envAtlas=environment;app.scene.skyboxIntensity=.65;
  const cube=pc.EnvLighting.generateSkyboxCubemap(source,128);ownedTextures.push(cube);app.scene.skybox=cube;dome.enabled=false;
});
loadTexture('sandstone_cracks_diff_1k.jpg',texture=>{for(const m of [palette.ground,palette.ivory,palette.bright]){m.diffuseMap=texture;m.diffuseMapTiling=new pc.Vec2(m===palette.ground?7:1,m===palette.ground?20:2);m.update();}});
loadTexture('sandstone_cracks_nor_gl_1k.jpg',texture=>{for(const m of [palette.ground,palette.ivory]){m.normalMap=texture;m.normalMapTiling=new pc.Vec2(m===palette.ground?7:1,m===palette.ground?20:2);m.bumpiness=.3;m.update();}});
loadTexture('sandstone_cracks_rough_1k.jpg',texture=>{palette.ground.glossMap=texture;palette.ground.glossInvert=true;palette.ground.glossMapChannel='r';palette.ground.glossMapTiling=new pc.Vec2(7,20);palette.ground.update();});

let treesPending=1,treeError=null;
const treeAsset=new pc.Asset('pinned birch','container',{url:'/assets/quaternius-birch-tree-5.glb'});app.assets.add(treeAsset);
treeAsset.ready(()=>{try{
  const placements=[[2,.2,-58,5.5,'pink'],[-9,.6,9,1.5,'green'],[-9,.6,-3,1.1,'pink'],[-9,.6,-18,1.15,'green'],[10.5,1,-25,1.3,'pink'],[10.5,1,-9,1.15,'green'],[10.5,1,9,1.05,'pink'],[-9,7.8,-8,.8,'pink'],[-9,7.8,6,1.15,'green'],[-8.4,.65,15,1.7,'pink'],[10.5,1,-1,1.2,'pink'],[-9,7.8,-22,1.1,'green']];
  for(const [i,[x,y,z,s,tint]] of placements.entries()){
    const tree=treeAsset.resource.instantiateRenderEntity({castShadows:i>0&&i<7,receiveShadows:true});tree.setLocalPosition(x,y,z);tree.setLocalScale(s*(i===0?1.65:1.1),s*(i===0?.7:.9),s*1.1);tree.setLocalEulerAngles(0,i*57,0);app.root.addChild(tree);
    for(const render of tree.findComponents('render'))for(const mi of render.meshInstances){
      const m=mi.material.clone();if(/leaf|leave|birch|foliage/i.test(m.name)&&!/bark|trunk|branch/i.test(m.name)){m.diffuse=color(tint==='pink'?'#f296ac':'#7faf84');m.diffuseMap=null;m.gloss=.12;m.useMetalness=true;m.metalness=0;m.cull=pc.CULLFACE_NONE;m.update();}mi.material=m;
    }
  }
}catch(e){treeError=String(e);}finally{treesPending=0;app.renderNextFrame=true;}});
treeAsset.on('error',e=>{treeError=String(e);treesPending=0;});app.assets.load(treeAsset);

const responseNodes=[];
function respond(which){
  clearResponse();const start=which==='garden'?[-4.3,1.4,-6]:[4,2,-14],end=which==='garden'?[0,2,-55]:[16,14,-47];
  for(let i=0;i<13;i++){const t=i/12,node=new pc.Entity('response');node.addComponent('render',{type:'sphere',material:palette.signal,castShadows:false});node.setLocalPosition(...start.map((v,k)=>v+(end[k]-v)*t+(k===1?Math.sin(t*Math.PI)*2:0)));node.setLocalScale(.14,.14,.14);app.root.addChild(node);responseNodes.push(node);}
  $('reply').textContent=which==='garden'?'Mira: “Two shaded seats. Sit with me.”':'Mira: “Our balcony. Trains pass below.”';$('reply').hidden=false;
  world.entities.get('reply-anchor').setLocalPosition(...(which==='garden'?[-3,2.4,-8]:[2.5,2.2,-16]));
  app.renderNextFrame=true;
}
function clearResponse(){for(const n of responseNodes)n.destroy();responseNodes.length=0;$('reply').hidden=true;}
$('garden').onclick=()=>respond('garden');$('skybridge').onclick=()=>respond('skybridge');
$('reset').onclick=()=>{clearResponse();world.applyPatch({playerCheckpoint:{id:'lab-start',position:[0,0,3],yaw:-16,pitch:10,distance:7}});app.renderNextFrame=true;};
let paused=false;$('pause').onclick=()=>{paused=!paused;world.setPaused(paused);$('pause').textContent=paused?'Resume':'Pause';$('pause').setAttribute('aria-pressed',String(paused));};
function project(id,anchor){const el=$(id),p=world.projectEntity(anchor);if(p&&!el.hidden){const half=el.offsetWidth/2+12;el.style.left=Math.max(half,Math.min(innerWidth-half,p.x))+'px';el.style.top=Math.max(155,Math.min(innerHeight-110,p.y-(id==='reply'?105:24)))+'px';}}
let assetsReady=false;
function ui(){if(!assetsReady){assetsReady=world.stats().assetsPending===0&&!treesPending&&!lightingPending;$('loading').hidden=assetsReady;}if(treeError||lightingErrors.length){$('loading').hidden=false;$('loading').textContent='Asset error: '+[treeError,...lightingErrors].filter(Boolean).join('; ');}
  project('garden','garden-anchor');project('skybridge','skybridge-anchor');project('reply','reply-anchor');}
// Follow rendered frames, including demand-rendered pause updates. Do not keep
// a second animation loop or collect complete scene statistics after loading.
app.on('postrender',ui);
window.__visualBenchmark={world,stats:()=>({...world.stats(),treesPending,treeError,lightingPending,lightingErrors,staticMaterialGroups:batches.size})};
addEventListener('pagehide',()=>{world.dispose();for(const t of ownedTextures)t.destroy();for(const a of labAssets)a.unload();});
