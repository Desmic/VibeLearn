import fs from 'node:fs';

// Compare exported portal geometry, especially the unchanged lower 3 metres.
const paths=[
  new URL(`./public/crafted-portal/${process.argv[2]??'sunward-portal.glb'}`,import.meta.url),
  new URL(`./public/crafted-portal/${process.argv[3]??'sunward-portal-swept.glb'}`,import.meta.url),
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
  const positions=new Set(),normals=new Set(),pairs=new Set(),triangles=new Set(),lowPositions=new Set(),lowPairs=new Set(),lowTriangles=new Set(),roles={},bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
  let vertexRecords=0,triangleRecords=0,degenerateTriangles=0,opposedVertexNormals=0;
  const surfaceAreaByMaterial={};
  for(const node of json.nodes??[]){
    if(node.mesh===undefined)continue;
    if(node.matrix||node.translation||node.rotation||node.scale)throw Error('Node transform requires world-space comparison');
    for(const primitive of json.meshes[node.mesh].primitives){
      const p=accessor(primitive.attributes.POSITION),n=accessor(primitive.attributes.NORMAL),ix=accessor(primitive.indices);
      if(p.width!==3||n.width!==3||p.count!==n.count||ix.count%3)throw Error('Unexpected geometry attributes');
      const material=json.materials[primitive.material].name.replace(/\.\d+$/,'');
      roles[material]=(roles[material]??0)+ix.count/3;
      const keys=[],heights=[],vertexNormals=[];
      for(let i=0;i<p.count;i++){
        const point=[0,1,2].map(k=>p.value(i,k)),normal=[0,1,2].map(k=>n.value(i,k));
        if([...point,...normal].some(v=>!Number.isFinite(v)))throw Error('Nonfinite position or normal');
        const pk=point.join(','),nk=normal.join(',');positions.add(pk);normals.add(nk);pairs.add(`${pk}|${nk}`);keys.push(pk);heights.push(point[1]);vertexNormals.push(normal);
        if(point[1]<3){lowPositions.add(pk);lowPairs.add(`${pk}|${nk}`)}
        for(let k=0;k<3;k++){bounds.min[k]=Math.min(bounds.min[k],point[k]);bounds.max[k]=Math.max(bounds.max[k],point[k]);}
      }
      vertexRecords+=p.count;triangleRecords+=ix.count/3;
      for(let i=0;i<ix.count;i+=3){
        const ids=[ix.value(i,0),ix.value(i+1,0),ix.value(i+2,0)];
        const vertices=ids.map(id=>keys[id].split(',').map(Number));
        const a=vertices[0],b=vertices[1],c=vertices[2],u=b.map((v,k)=>v-a[k]),v=c.map((value,k)=>value-a[k]);
        const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
        const areaSquared=cross.reduce((sum,value)=>sum+value*value,0);
        if(areaSquared<1e-18)degenerateTriangles++;
        else {const normalSum=[0,1,2].map(k=>ids.reduce((sum,id)=>sum+vertexNormals[id][k],0));
          if(cross.reduce((sum,value,k)=>sum+value*normalSum[k],0)<0)opposedVertexNormals++;}
        surfaceAreaByMaterial[material]=(surfaceAreaByMaterial[material]??0)+Math.sqrt(areaSquared)/2;
        const triangle=ids.map(id=>keys[id]).sort().join('|');triangles.add(triangle);
        if(ids.every(id=>heights[id]<3))lowTriangles.add(triangle);
      }
    }
  }
  return {path:String(path),vertexRecords,triangleRecords,degenerateTriangles,opposedVertexNormals,roles,bounds,surfaceAreaByMaterial,positions,normals,pairs,triangles,lowPositions,lowPairs,lowTriangles};
}
const [original,conditioned]=paths.map(readGlb);
const overlap=(a,b)=>{let common=0;for(const value of a)if(b.has(value))common++;return {original:a.size,conditioned:b.size,exactCommon:common,originalOnly:a.size-common,conditionedOnly:b.size-common};};
function nearestVertexDistance(from,to){
  const cellSize=0.0001,key=(x,y,z)=>`${x},${y},${z}`,grid=new Map();
  for(const point of to){const p=point.split(',').map(Number),cell=p.map(v=>Math.floor(v/cellSize)),id=key(...cell);if(!grid.has(id))grid.set(id,[]);grid.get(id).push(p);}
  let max=0,unmatched=0;
  for(const point of from){const p=point.split(',').map(Number),cell=p.map(v=>Math.floor(v/cellSize));let best=Infinity;
    for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)for(const q of grid.get(key(cell[0]+x,cell[1]+y,cell[2]+z))??[]){
      best=Math.min(best,Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]));
    }
    if(!Number.isFinite(best))unmatched++;else max=Math.max(max,best);
  }
  return {maxMetres:max,unmatched,sourcePoints:from.size};
}
console.log(JSON.stringify({original:{path:original.path,vertexRecords:original.vertexRecords,triangleRecords:original.triangleRecords,degenerateTriangles:original.degenerateTriangles,opposedVertexNormals:original.opposedVertexNormals,roles:original.roles,bounds:original.bounds},
  swept:{path:conditioned.path,vertexRecords:conditioned.vertexRecords,triangleRecords:conditioned.triangleRecords,degenerateTriangles:conditioned.degenerateTriangles,opposedVertexNormals:conditioned.opposedVertexNormals,roles:conditioned.roles,bounds:conditioned.bounds},
  surfaceAreaByMaterial:{original:original.surfaceAreaByMaterial,conditioned:conditioned.surfaceAreaByMaterial},
  nearestVertexDistance:{originalToConditioned:nearestVertexDistance(original.positions,conditioned.positions),conditionedToOriginal:nearestVertexDistance(conditioned.positions,original.positions)},
  exact:{positions:overlap(original.positions,conditioned.positions),normals:overlap(original.normals,conditioned.normals),positionNormalPairs:overlap(original.pairs,conditioned.pairs),trianglesByPosition:overlap(original.triangles,conditioned.triangles),lowPositions:overlap(original.lowPositions,conditioned.lowPositions),lowPositionNormalPairs:overlap(original.lowPairs,conditioned.lowPairs),lowTrianglesByPosition:overlap(original.lowTriangles,conditioned.lowTriangles)}},null,2));
