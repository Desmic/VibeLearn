import {createPlayCanvasWorld} from '../playcanvas-backend.js';
const $=id=>document.getElementById(id);
const provenance=await fetch('asset-kit-assets/PROVENANCE.json').then(r=>{if(!r.ok)throw Error('Missing asset provenance');return r.json();});
const labels=['KayKit · branching tree','KayKit · tall tree','KayKit · clustered tree','KayKit · low shrub','KayKit · grass','KayKit · rock'];
const candidates=provenance.models.map((model,i)=>{
  const height=model.bounds_max[1]-model.bounds_min[1],scale=3.8/height;
  return {id:'candidate-'+i,label:labels[i],src:'/lab/asset-kit-assets/'+model.name+'.gltf',scale,
    offset:-model.bounds_min[1]*scale,triangles:model.triangles,materials:model.materials,
    note:i<3?'Dressing candidate; not the signature canopy.':'Dressing candidate; displayed enlarged to inspect its shape.'};
});
candidates.push({id:'candidate-birch',label:'Existing · textured birch',src:'/assets/quaternius-birch-tree-5.glb',scale:.8,offset:0,note:'Existing comparison. Alpha foliage needs camera and overdraw review; not a newly approved hero tree.'});
const assets=Object.fromEntries(candidates.map(c=>[c.id,{type:'container',src:c.src}]));
const entities=candidates.map(c=>({id:c.id,asset:c.id,enabled:false,position:[0,c.offset,0],scale:[c.scale,c.scale,c.scale]}));
entities.push({id:'ground',primitive:'box',position:[0,-.06,0],scale:[40,.1,40],material:'floor'});
const spec={schemaVersion:'1',id:'asset-review',version:'1',assets,entities,materials:{floor:{diffuse:'#dce1db',gloss:.15}},
  environment:{clearColor:'#b8ccdb',ambient:'#617085',exposure:1,toneMapping:'aces'},
  lights:[{id:'sun',type:'directional',rotation:[48,-35,0],color:'#fff0d6',intensity:1.8,castShadows:true,shadowResolution:1024,shadowDistance:20,normalOffsetBias:.03,shadowFilter:'pcf3'}],
  cameras:{review:{position:[6,4,9],lookAt:[0,1.8,0],fov:40,portrait:{position:[7,5,11],lookAt:[0,1.8,0],fov:45}}}};
const world=createPlayCanvasWorld($('world'),spec,{pixelRatioCap:1.25});
if(!world.available)throw Error(world.error);
for(const c of candidates){const option=document.createElement('option');option.value=c.id;option.textContent=c.label;$('asset').append(option);}
function camera(){const a=Number($('angle').value)*Math.PI/180,wide=$('world').clientWidth/$('world').clientHeight>1;const d=wide?10:12;
  world.camera.setPosition(Math.sin(a)*d,4.5,Math.cos(a)*d);world.camera.lookAt(0,1.8,0);world.app.renderNextFrame=true;}
function select(){const c=candidates.find(v=>v.id===$('asset').value);world.applyPatch({hide:candidates.filter(v=>v.id!==c.id).map(v=>v.id),show:[c.id]});
  $('details').textContent=(c.triangles?`${c.triangles} triangles · ${c.materials} material. `:'')+c.note;camera();}
$('asset').onchange=select;$('angle').oninput=camera;
for(const [id,value] of [['front',0],['side',90],['back',180]])$(id).onclick=()=>{$('angle').value=value;camera();};
$('light').onchange=()=>{const sun=world.root.findByName('sun').light,soft=$('light').value==='overcast';sun.intensity=soft?.55:1.8;world.app.scene.ambientLight.set(soft?.62:.38,soft?.68:.44,soft?.75:.52);world.app.renderNextFrame=true;};
let ready=false;world.app.on('postrender',()=>{if(ready)return;const s=world.stats();ready=s.assetsPending===0;$('status').textContent=s.assetsFailed?`Asset failure: ${s.assetsFailed}`:ready?'All candidates loaded · original materials':'Loading candidates…';});
select();
window.__assetKitReview={world,candidates};
addEventListener('pagehide',()=>world.dispose());
