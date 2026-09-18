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
  const desiredX=point.x,desiredY=point.y-yOffset;
  const left=xPadding,right=width-xPadding;
  const x=Math.max(left,Math.min(right,desiredX));
  let y=desiredY,edge='';
  if(critical){
    y=Math.max(top,Math.min(bottom,desiredY));
    if(desiredX<left)edge='left';
    else if(desiredX>right)edge='right';
    else if(desiredY<top)edge='top';
    else if(desiredY>bottom)edge='bottom';
  }
  marker.style.left=x+'px';
  marker.style.top=y+'px';
  marker.classList.toggle('edge-cued',Boolean(edge));
  if(edge)marker.dataset.edge=edge;else delete marker.dataset.edge;
  return{
    placed:true,edge,desiredX,desiredY,x,y,
    insideSafeArea:desiredX>=left&&desiredX<=right&&desiredY>=top&&desiredY<=bottom
  };
}
