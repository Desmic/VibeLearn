import fs from 'node:fs';

// Compare exported GLB POSITION/NORMAL attributes without treating UV-driven
// vertex duplication or material regrouping as proof of geometric parity.
const paths=[
  new URL('./public/atelier/sunward-atelier.glb',import.meta.url),
  new URL(`./public/atelier/${process.argv[2]??'sunward-atelier-occlusion-v3.glb'}`,import.meta.url),
];
function readGlb(path){
  const bytes=fs.readFileSync(path),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if(bytes.toString('ascii',0,4)!=='glTF')throw Error(`Not GLB: ${path}`);
  let json,binStart,offset=12;
  while(offset<bytes.length){const length=view.getUint32(offset,true),type=bytes.toString('ascii',offset+4,offset+8);
    if(type==='JSON')json=JSON.parse(bytes.toString('utf8',offset+8,offset+8+length));
    if(type==='BIN\0')binStart=offset+8;offset+=8+length;}
  if(!json||binStart===undefined)throw Error(`Missing GLB chunks: ${path}`);
  const accessor=index=>{const a=json.accessors[index],b=json.bufferViews[a.bufferView],width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],size={5121:1,5123:2,5125:4,5126:4}[a.componentType];
    if(!width||!size||a.sparse||b.buffer!==0)throw Error(`Unsupported accessor ${index}`);
    const start=binStart+(b.byteOffset??0)+(a.byteOffset??0),stride=b.byteStride??size*width;
    const value=(i,k)=>{const at=start+i*stride+k*size;switch(a.componentType){case 5121:return view.getUint8(at);case 5123:return view.getUint16(at,true);case 5125:return view.getUint32(at,true);case 5126:return view.getFloat32(at,true)}};
    return {count:a.count,width,value};};
  const positions=new Set(),normals=new Set(),pairs=new Set(),triangles=new Set(),roles={},bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
  let vertexRecords=0,triangleRecords=0;
  for(const node of json.nodes??[]){
    if(node.mesh===undefined)continue;
    if(node.matrix||node.translation||node.rotation||node.scale)throw Error('Node transform requires world-space comparison');
    for(const primitive of json.meshes[node.mesh].primitives){
      const p=accessor(primitive.attributes.POSITION),n=accessor(primitive.attributes.NORMAL),ix=accessor(primitive.indices);
      if(p.width!==3||n.width!==3||p.count!==n.count||ix.count%3)throw Error('Unexpected geometry attributes');
      const material=json.materials[primitive.material].name.replace(/\.\d+$/,'');
      roles[material]=(roles[material]??0)+ix.count/3;
      const keys=[];
      for(let i=0;i<p.count;i++){
        const point=[0,1,2].map(k=>p.value(i,k)),normal=[0,1,2].map(k=>n.value(i,k));
        if([...point,...normal].some(v=>!Number.isFinite(v)))throw Error('Nonfinite position or normal');
        const pk=point.join(','),nk=normal.join(',');positions.add(pk);normals.add(nk);pairs.add(`${pk}|${nk}`);keys.push(pk);
        for(let k=0;k<3;k++){bounds.min[k]=Math.min(bounds.min[k],point[k]);bounds.max[k]=Math.max(bounds.max[k],point[k]);}
      }
      vertexRecords+=p.count;triangleRecords+=ix.count/3;
      for(let i=0;i<ix.count;i+=3)triangles.add([keys[ix.value(i,0)],keys[ix.value(i+1,0)],keys[ix.value(i+2,0)]].sort().join('|'));
    }
  }
  return {path:String(path),vertexRecords,triangleRecords,roles,bounds,positions,normals,pairs,triangles};
}
const [original,conditioned]=paths.map(readGlb);
const overlap=(a,b)=>{let common=0;for(const value of a)if(b.has(value))common++;return {original:a.size,conditioned:b.size,exactCommon:common,originalOnly:a.size-common,conditionedOnly:b.size-common};};
console.log(JSON.stringify({original:{path:original.path,vertexRecords:original.vertexRecords,triangleRecords:original.triangleRecords,roles:original.roles,bounds:original.bounds},
  conditioned:{path:conditioned.path,vertexRecords:conditioned.vertexRecords,triangleRecords:conditioned.triangleRecords,roles:conditioned.roles,bounds:conditioned.bounds},
  exact:{positions:overlap(original.positions,conditioned.positions),normals:overlap(original.normals,conditioned.normals),positionNormalPairs:overlap(original.pairs,conditioned.pairs),trianglesByPosition:overlap(original.triangles,conditioned.triangles)}},null,2));
