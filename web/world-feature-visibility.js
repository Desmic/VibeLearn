/* A decision landmark is usable only when its rendered feature is actually reachable
   at the projected point. A DOM sign or nearer world prop can hide a valid entity. */
'use strict';

export async function probeWorldFeature(world,{entity,acceptedHits},overlayAt=()=>null){
  const point=world?.projectEntity?.(entity);
  if(!point?.inFront||!point.visible)return{entity,visible:false,reason:'offscreen',point:point||null};
  const overlay=overlayAt(point.x,point.y);
  if(overlay)return{entity,visible:false,reason:'overlay',overlay,point};
  const hit=await world?.pickSemanticAt?.(point.x,point.y);
  if(!Array.isArray(acceptedHits)||!acceptedHits.includes(hit))return{entity,visible:false,reason:'occluded',hit:hit||null,point};
  return{entity,visible:true,hit,point};
}
