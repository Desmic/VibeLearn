/* Reusable projected world-marker placement with HUD-safe clamping. */
'use strict';

export function placeWorldMarker(marker,point,{
  viewportWidth,
  safeTop,
  safeBottom,
  critical=false,
  xPadding=40,
  yOffset=12
}={}){
  if(!marker||!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)){
    return{placed:false,edge:'',insideSafeArea:false};
  }
  const width=Math.max(xPadding*2+1,Number(viewportWidth)||1);
  const top=Number.isFinite(safeTop)?safeTop:0;
  const bottom=Math.max(top+1,Number.isFinite(safeBottom)?safeBottom:top+1);
  const desiredY=point.y-yOffset;
  marker.style.left=Math.max(xPadding,Math.min(width-xPadding,point.x))+'px';
  let y=desiredY,edge='';
  if(critical){
    y=Math.max(top,Math.min(bottom,desiredY));
    edge=desiredY<top?'top':desiredY>bottom?'bottom':'';
  }
  marker.style.top=y+'px';
  marker.classList.toggle('edge-cued',Boolean(edge));
  if(edge)marker.dataset.edge=edge;else delete marker.dataset.edge;
  return{
    placed:true,
    edge,
    desiredY,
    y,
    insideSafeArea:desiredY>=top&&desiredY<=bottom
  };
}
