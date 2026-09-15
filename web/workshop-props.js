/* Portable procedural props: no course rules, engine objects or learner state. */
export function tokenTrack(id,position,count=3){
  const items=[{id,position}];
  items.push({id:`${id}-base`,parent:id,primitive:'box',material:'ink',position:[0,0,0],scale:[count*.82+.3,.18,1.0]});
  for(let i=0;i<count;i++){
    const x=(i-(count-1)/2)*.82;
    items.push({id:`${id}-slot-${i}`,parent:id,primitive:'box',material:'gold',position:[x,.11,0],scale:[.72,.05,.82]});
    items.push({id:`${id}-piece-${i}`,parent:id,primitive:'box',material:'paper',position:[x,.24,0],scale:[.64,.22,.72],enabled:false});
  }
  return items;
}
export function messageMachine(id,position){
  return [{id,position},
    {id:`${id}-feet`,parent:id,primitive:'cylinder',material:'ink',position:[0,.16,0],scale:[2.3,.3,2.3]},
    {id:`${id}-body`,parent:id,primitive:'box',material:'teal',position:[0,.8,0],scale:[1.7,1.1,1.3]},
    {id:`${id}-top`,parent:id,primitive:'box',material:'paper',position:[0,1.38,0],scale:[1.9,.12,1.4]},
    {id:`${id}-window`,parent:id,primitive:'box',material:'ink',position:[0,.98,.66],scale:[1.16,.52,.06]},
    {id:`${id}-core`,parent:id,primitive:'sphere',material:'mint',position:[0,1.87,0],scale:[.52,.52,.52],motion:{type:'pulse',amplitude:.07,speed:1.2}},
    {id:`${id}-ring`,parent:id,primitive:'torus',material:'gold',position:[0,1.87,0],scale:[1.05,.13,1.05],rotation:[65,0,0],motion:{type:'spin',axis:[0,1,0],speed:20}},
    {id:`${id}-button`,parent:id,primitive:'cylinder',material:'coral',position:[.56,1.48,.42],scale:[.23,.12,.23]}];
}
export function pavilion(id,position,material='teal'){
  return [{id,position},
    {id:`${id}-step`,parent:id,primitive:'box',material:'paper',position:[0,.12,.3],scale:[2.8,.24,2.6]},
    {id:`${id}-wall`,parent:id,primitive:'box',material,position:[0,1.35,0],scale:[2.25,2.5,1.9]},
    {id:`${id}-roof`,parent:id,primitive:'cone',material:'ink',position:[0,3,0],scale:[3.3,1.1,2.9]},
    {id:`${id}-door`,parent:id,primitive:'box',material:'dark',position:[0,.85,1],scale:[.8,1.7,.1]},
    {id:`${id}-window`,parent:id,primitive:'box',material:'glow',position:[.7,1.9,1],scale:[.48,.55,.1]},
    {id:`${id}-sign`,parent:id,primitive:'box',material:'paper',position:[0,2.32,1.05],scale:[1.62,.42,.08]}];
}
export function smallTree(id,position,scale=1){
  return [{id,position,scale:[scale,scale,scale]},
    {id:`${id}-trunk`,parent:id,primitive:'cylinder',material:'wood',position:[0,.65,0],scale:[.19,1.3,.19]},
    {id:`${id}-crown`,parent:id,primitive:'sphere',material:'leaf',position:[0,1.6,0],scale:[1.15,1.6,1.1]},
    {id:`${id}-fruit`,parent:id,primitive:'sphere',material:'gold',position:[.42,1.55,.3],scale:[.2,.2,.2]}];
}
export function deliveryParcel(id,parent,position=[0,0,0]){
  return [{id,parent,position},
    {id:`${id}-flower`,parent:id},
    {id:`${id}-pot`,parent:`${id}-flower`,primitive:'cylinder',material:'coral',position:[0,.12,0],scale:[.4,.3,.4]},
    {id:`${id}-stem`,parent:`${id}-flower`,primitive:'cylinder',material:'leaf',position:[0,.42,0],scale:[.07,.55,.07]},
    {id:`${id}-bloom`,parent:`${id}-flower`,primitive:'sphere',material:'gold',position:[0,.73,0],scale:[.46,.33,.46]},
    {id:`${id}-petal`,parent:`${id}-flower`,primitive:'torus',material:'paper',position:[0,.73,.04],rotation:[90,0,0],scale:[.62,.1,.62]},
    {id:`${id}-book`,parent:id},
    {id:`${id}-pages`,parent:`${id}-book`,primitive:'box',material:'paper',position:[0,.23,0],scale:[.55,.12,.68]},
    {id:`${id}-cover-a`,parent:`${id}-book`,primitive:'box',material:'coral',position:[0,.32,0],scale:[.6,.06,.74]},
    {id:`${id}-cover-b`,parent:`${id}-book`,primitive:'box',material:'coral',position:[0,.14,0],scale:[.6,.06,.74]}];
}
