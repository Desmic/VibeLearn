/* Reusable projected world-marker placement with HUD-safe clamping. */
'use strict';

export function placeWorldMarker(marker,point,{
  viewportWidth,
  safeTop,
  safeBottom,
  critical=false,
  xPadding=40,
  yOffset=12,
  avoidRects=[],
  clearance=8
}={}){
  if(!marker||!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)){
    return{placed:false,edge:'',insideSafeArea:false};
  }
  const width=Math.max(xPadding*2+1,Number(viewportWidth)||1);
  const top=Number.isFinite(safeTop)?safeTop:0;
  const bottom=Math.max(top+1,Number.isFinite(safeBottom)?safeBottom:top+1);
  const desiredX=point.x,desiredY=point.y-yOffset;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const occupied=avoidRects.filter(r=>r&&[r.left,r.right,r.top,r.bottom].every(Number.isFinite)&&r.right>r.left&&r.bottom>r.top);
  const setEdge=edge=>{
    marker.classList.toggle('edge-cued',Boolean(edge));
    if(edge)marker.dataset.edge=edge;else delete marker.dataset.edge;
  };
  // Marker coordinates are bottom-center anchors (translate(-50%, -100%)).
  // Expand occupied HUD rectangles by the marker footprint, then find the
  // closest free anchor. This also works for different layouts and label sizes.
  const locate=()=>{
    const half=(marker.offsetWidth||0)/2,height=marker.offsetHeight||0;
    const left=Math.max(xPadding,half+clearance),right=width-left;
    if(left>right)return null;
    const exclusions=occupied.map(r=>({left:r.left-half-clearance,right:r.right+half+clearance,top:r.top-clearance,bottom:r.bottom+height+clearance}));
    const free=(x,y)=>!exclusions.some(r=>x>r.left&&x<r.right&&y>r.top&&y<r.bottom);
    const inside=desiredX>=left&&desiredX<=right&&desiredY>=top&&desiredY<=bottom&&free(desiredX,desiredY);
    if(!critical)return inside?{x:desiredX,y:desiredY,inside}:null;
    const baseX=clamp(desiredX,left,right),baseY=clamp(desiredY,top,bottom);
    const xs=[baseX,...exclusions.flatMap(r=>[clamp(r.left,left,right),clamp(r.right,left,right)])];
    const ys=[baseY,...exclusions.flatMap(r=>[clamp(r.top,top,bottom),clamp(r.bottom,top,bottom)])];
    let best=null,bestDistance=Infinity;
    for(const x of xs)for(const y of ys){
      const distance=(x-baseX)**2+(y-baseY)**2;
      if(free(x,y)&&distance<bestDistance){best={x,y,inside};bestDistance=distance;}
    }
    return best;
  };
  setEdge('');
  let position=locate();
  if(!position)return{placed:false,edge:'',insideSafeArea:false};
  const direction=p=>{
    const dx=desiredX-p.x,dy=desiredY-p.y;
    if(Math.max(Math.abs(dx),Math.abs(dy))<.5)return'';
    return Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'top':'bottom');
  };
  let edge=critical?direction(position):'';
  // An edge arrow can widen the button. Measure its final footprint before
  // choosing the safe position, rather than allowing a one-frame overlap.
  setEdge(edge);
  if(edge){position=locate();if(!position)return{placed:false,edge,insideSafeArea:false};}
  const {x,y}=position;
  edge=critical?direction(position):'';
  setEdge(edge);
  marker.style.left=x+'px';
  marker.style.top=y+'px';
  return{
    placed:true,edge,desiredX,desiredY,x,y,
    insideSafeArea:position.inside
  };
}
