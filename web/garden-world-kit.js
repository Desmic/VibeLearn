/* Authored procedural forms, shared by world packages. No story or behavior. */
export const gardenGeometries={
  petal:{type:'sphere',options:{radius:.5,latitudeBands:6,longitudeBands:9}},
  column:{type:'cone',options:{baseRadius:.5,peakRadius:.34,height:1,heightSegments:1,capSegments:8}},
  keel:{type:'cone',options:{baseRadius:.5,peakRadius:.08,height:1,heightSegments:1,capSegments:9}},
  fineRing:{type:'torus',options:{ringRadius:.48,tubeRadius:.02,segments:48,sides:6}},
  arc:{type:'torus',options:{ringRadius:.48,tubeRadius:.025,sectorAngle:155,segments:24,sides:6}},
  shellArc:{type:'torus',options:{ringRadius:.48,tubeRadius:.065,sectorAngle:210,segments:32,sides:4}},
  disc:{type:'cylinder',options:{radius:.5,height:1,heightSegments:1,capSegments:48}}
};

const node=(id,parent,geometry,material,position,scale,extra={})=>({id,parent,geometry,material,position,scale,...extra});

// A branching silhouette with three foliage values. Scale/layout/palette belong
// to the calling package, so the kit is usable for a courtyard or distant forest.
export function canopyTree(id,position,{parent,scale=1,palette=['bark','canopyShade','canopyMid','canopyLight'],distant=false}={}){
  const [bark,shade,mid,light]=palette;
  const out=[{id,parent,position,scale:[scale,scale,scale]}];
  out.push(node(`${id}-trunk`,id,'column',bark,[0,1.4,0],[.36,2.8,.38],{rotation:[0,0,-9],castShadows:!distant}));
  const crowns=[[-.85,3.15,.1,1.9,mid], [.8,3.4,-.3,2.15,mid],[-.1,4,-.1,2,light],[-.9,2.8,-.5,1.6,shade],[.8,2.75,.55,1.7,shade]];
  for(let i=0;i<crowns.length;i++){
    const [x,y,z,size,material]=crowns[i];
    if(!distant&&i<3)out.push(node(`${id}-branch-${i}`,id,'column',bark,[x*.48,2.1,z*.5],[.18,1.8,.18],{rotation:[z*30,0,-x*35]}));
    out.push(node(`${id}-crown-${i}`,id,'petal',material,[x,y,z],[size,1.1,size*.82],{rotation:[12,i*47,-8+i*5],castShadows:!distant,receiveShadows:!distant}));
  }
  return out;
}

export function floatingGarden(id,position,{parent,scale=1,deck='porcelain',underside='deepBlue',rim='solarGold'}={}){
  return [
    {id,parent,position,scale:[scale,scale,scale]},
    node(`${id}-deck`,id,'disc',deck,[0,-.3,0],[12,.6,9],{castShadows:false}),
    node(`${id}-keel`,id,'keel',underside,[0,-2,0],[11,3,8],{rotation:[180,0,0],castShadows:false}),
    node(`${id}-rim`,id,'fineRing',rim,[0,-.6,0],[12,.5,9],{castShadows:false})
  ];
}

export function habitatTower(id,position,{parent,height=12,width=4,body='porcelain',glass='deepBlue',trim='solarGold',plant='canopyMid'}={}){
  const out=[{id,parent,position}];
  // Offset terraces and a swept outer shell form an asymmetric silhouette rather
  // than a stack of identical cylinders. Parameters also suit a small pavilion.
  out.push(node(`${id}-core`,id,'column',glass,[-width*.12,height*.43,0],[width*.55,height*.86,width*.48],{castShadows:false}));
  out.push(node(`${id}-shell`,id,'shellArc',body,[0,height*.48,0],[width*1.25,width*.6,height*1.03],{rotation:[90,0,-12],castShadows:false}));
  for(let i=0;i<3;i++){
    const y=height*(.14+i*.25),w=width*(1.2-i*.18),x=width*(.23-i*.12);
    out.push(node(`${id}-floor-${i}`,id,'disc',body,[x,y,.15],[w,.35,w*.7],{castShadows:false}));
    out.push(node(`${id}-balcony-${i}`,id,'arc',trim,[x,y+.2,.15],[w,.7,w*.7],{rotation:[0,20,0],castShadows:false}));
    if(i===1)out.push(node(`${id}-garden-${i}`,id,'petal',plant,[x+w*.25,y+.22,.4],[w*.38,.65,w*.36],{castShadows:false}));
  }
  return out;
}
