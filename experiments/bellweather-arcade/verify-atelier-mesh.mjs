import fs from 'node:fs';
import crypto from 'node:crypto';
import * as T from 'three';

// Inspect the exported GLB, independently of Blender and the browser renderer.
// A building joined by material has many disconnected solids: each edge-linked
// closed shell must have positive signed volume in its own right.
const path=process.argv[2]??new URL('./public/atelier/sunward-atelier.glb',import.meta.url);
const bytes=fs.readFileSync(path),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
const fail=message=>{throw new Error(`Atelier mesh QA: ${message}`)};
if(bytes.toString('ascii',0,4)!=='glTF'||view.getUint32(4,true)!==2||view.getUint32(8,true)!==bytes.length)fail('invalid GLB header');
let json,bin,offset=12;
while(offset<bytes.length){
  const length=view.getUint32(offset,true),kind=bytes.toString('ascii',offset+4,offset+8),start=offset+8;
  if(start+length>bytes.length)fail('chunk exceeds GLB length');
  if(kind==='JSON')json=JSON.parse(bytes.toString('utf8',start,start+length));
  if(kind==='BIN\0')bin={start,length};
  offset=start+length;
}
if(!json||!bin||!Array.isArray(json.meshes))fail('missing JSON, BIN, or meshes');
const componentBytes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
const componentCount={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};
function accessor(index){
  const a=json.accessors?.[index],b=json.bufferViews?.[a?.bufferView];
  if(!a||!b||a.sparse||b.buffer!==0)fail(`unsupported accessor ${index}`);
  const size=componentBytes[a.componentType],width=componentCount[a.type];
  if(!size||!width||!Number.isSafeInteger(a.count))fail(`invalid accessor ${index}`);
  const stride=b.byteStride??size*width,start=bin.start+(b.byteOffset??0)+(a.byteOffset??0);
  if(stride<size*width||start<bin.start||start+(a.count-1)*stride+size*width>bin.start+(b.byteOffset??0)+b.byteLength)fail(`accessor ${index} outside buffer view`);
  const read=(item,part)=>{
    const at=start+item*stride+part*size;
    switch(a.componentType){
      case 5120:return view.getInt8(at);case 5121:return view.getUint8(at);
      case 5122:return view.getInt16(at,true);case 5123:return view.getUint16(at,true);
      case 5125:return view.getUint32(at,true);case 5126:return view.getFloat32(at,true);
    }
  };
  return {count:a.count,width,type:a.type,componentType:a.componentType,read};
}
const nodeTransform=node=>{
  if(node.matrix)return new T.Matrix4().fromArray(node.matrix);
  return new T.Matrix4().compose(
    new T.Vector3().fromArray(node.translation??[0,0,0]),
    new T.Quaternion().fromArray(node.rotation??[0,0,0,1]),
    new T.Vector3().fromArray(node.scale??[1,1,1])
  );
};
const parent=new Map();for(let i=0;i<(json.nodes?.length??0);i++)for(const child of json.nodes[i].children??[]){
  if(parent.has(child))fail(`node ${child} has multiple parents`);parent.set(child,i);
}
const worldMatrix=(index,seen=new Set())=>{
  if(seen.has(index))fail(`node cycle at ${index}`);seen.add(index);
  const local=nodeTransform(json.nodes[index]);return parent.has(index)?worldMatrix(parent.get(index),seen).multiply(local):local;
};
const quantize=v=>v.map(x=>Math.round(x*1e5)).join(',');
const summaries=[];let triangleTotal=0,componentTotal=0;
for(let nodeIndex=0;nodeIndex<(json.nodes?.length??0);nodeIndex++){
  const node=json.nodes[nodeIndex];if(node.mesh===undefined)continue;
  const matrix=worldMatrix(nodeIndex),mesh=json.meshes[node.mesh];
  for(let primitiveIndex=0;primitiveIndex<mesh.primitives.length;primitiveIndex++){
    const primitive=mesh.primitives[primitiveIndex];
    if(primitive.mode!==undefined&&primitive.mode!==4)fail(`${mesh.name}: non-triangle primitive`);
    if(primitive.indices===undefined||primitive.attributes?.POSITION===undefined)fail(`${mesh.name}: missing positions or indices`);
    const p=accessor(primitive.attributes.POSITION),ix=accessor(primitive.indices);
    if(p.type!=='VEC3'||p.componentType!==5126||ix.type!=='SCALAR'||ix.count%3)fail(`${mesh.name}: unexpected position/index format`);
    const positions=Array.from({length:p.count},(_,i)=>{
      const point=new T.Vector3(p.read(i,0),p.read(i,1),p.read(i,2));
      if(![point.x,point.y,point.z].every(Number.isFinite))fail(`${mesh.name}: nonfinite position at ${i}`);
      point.applyMatrix4(matrix);return point;
    });
    for(const [name,attributeIndex] of Object.entries(primitive.attributes)){
      const a=accessor(attributeIndex);if(a.count!==p.count)fail(`${mesh.name}: ${name} count differs from POSITION`);
      for(let i=0;i<a.count;i++)for(let k=0;k<a.width;k++)if(!Number.isFinite(a.read(i,k)))fail(`${mesh.name}: nonfinite ${name} at ${i}`);
    }
    const welded=new Map(),ids=positions.map(point=>{
      const key=quantize(point.toArray());if(!welded.has(key))welded.set(key,welded.size);return welded.get(key);
    });
    const edges=new Map(),triangles=[];let degenerate=0;
    for(let i=0;i<ix.count;i+=3){
      const raw=[ix.read(i,0),ix.read(i+1,0),ix.read(i+2,0)];
      if(raw.some(n=>!Number.isInteger(n)||n<0||n>=p.count))fail(`${mesh.name}: invalid triangle index ${i/3}`);
      const key=raw.map(n=>ids[n]),[a,b,c]=raw.map(n=>positions[n]);
      if(new Set(key).size!==3){degenerate++;continue}
      const normal=b.clone().sub(a).cross(c.clone().sub(a));
      if(normal.lengthSq()<1e-18){degenerate++;continue}
      const volume=a.dot(b.clone().cross(c))/6;
      const triangleId=triangles.length;triangles.push({volume,neighbors:new Set()});
      for(let k=0;k<3;k++){
        const from=key[k],to=key[(k+1)%3],edge=from<to?`${from}:${to}`:`${to}:${from}`;
        const entry=edges.get(edge)??[];entry.push({triangleId,direction:from<to?1:-1});edges.set(edge,entry);
      }
    }
    for(const [edge,uses] of edges){
      if(uses.length!==2||uses[0].direction===uses[1].direction)fail(`${mesh.name}: open/nonmanifold or inconsistent edge ${edge} (${uses.length} uses)`);
      triangles[uses[0].triangleId].neighbors.add(uses[1].triangleId);
      triangles[uses[1].triangleId].neighbors.add(uses[0].triangleId);
    }
    const visited=new Set(),components=[];
    for(let i=0;i<triangles.length;i++)if(!visited.has(i)){
      let volume=0,count=0;const stack=[i];visited.add(i);
      while(stack.length){const id=stack.pop(),t=triangles[id];volume+=t.volume;count++;for(const neighbor of t.neighbors)if(!visited.has(neighbor)){visited.add(neighbor);stack.push(neighbor)}}
      if(!Number.isFinite(volume)||volume<=1e-9)fail(`${mesh.name}: inward/flat connected shell with ${count} triangles, signed volume ${volume}`);
      components.push({triangles:count,signedVolume:Number(volume.toFixed(6))});
    }
    triangleTotal+=triangles.length;componentTotal+=components.length;
    summaries.push({node:node.name??nodeIndex,mesh:mesh.name??node.mesh,primitive:primitiveIndex,triangles:triangles.length,degenerateTriangles:degenerate,closedShells:components.length,minSignedVolume:Math.min(...components.map(c=>c.signedVolume)),components});
  }
}
if(!summaries.length||!componentTotal)fail('no closed mesh shells found');
const degenerateTotal=summaries.reduce((n,mesh)=>n+mesh.degenerateTriangles,0);
const result={passed:true,source:String(path),sha256:crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(),sourceTriangleTotal:triangleTotal+degenerateTotal,validTriangleTotal:triangleTotal,degenerateTotal,componentTotal,warnings:degenerateTotal?[`${degenerateTotal} zero-area triangles were excluded from closed-shell topology and volume checks`]:[],meshes:summaries};
console.log(JSON.stringify(result,null,2));
