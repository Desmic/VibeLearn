/* Portable scenery and interactable shapes. No learner state or engine objects. */
export function lantern(id,position,{scale=1,color='glow',floating=false}={}){
  return [{id,position,scale:[scale,scale,scale],...(floating?{motion:{type:'bob',amplitude:.13,speed:.7}}:{})},
    {id:id+'-paper',parent:id,primitive:'sphere',material:color,position:[0,0,0],scale:[.65,.85,.65]},
    ...[-1,1].map((s,i)=>({id:id+'-rim-'+i,parent:id,primitive:'cylinder',material:'gold',position:[0,s*.37,0],scale:[.34,.08,.34]})),
    {id:id+'-tassel',parent:id,primitive:'cone',material:'rose',position:[0,-.65,0],scale:[.1,.4,.1]}];
}
export function gate(id,position,{width=2.2,height=3.6,color='gold'}={}){
  const e=[{id,position}];
  const part=(name,primitive,material,p,s,extra={})=>e.push({id:id+'-'+name,parent:id,primitive,material,position:p,scale:s,...extra});
  part('threshold','box','paper',[0,.08,0],[width+.8,.16,1.5]);
  for(const side of [-1,1]){
    part('pillar'+side,'cylinder','stone',[side*(width/2+.1),height/2,0],[.36,height,.36]);
    part('cap'+side,'sphere',color,[side*(width/2+.1),height,0],[.55,.55,.55]);
  }
  part('arch','torus',color,[0,height-.45,0],[width+1,.16,width+1],{rotation:[90,0,0]});
  e.push({id:id+'-door',parent:id,position:[0,0,0]});
  for(let i=0;i<7;i++)e.push({id:id+'-bar-'+i,parent:id+'-door',primitive:'cylinder',material:'ink',position:[(i-3)*width/7,height*.4,0],scale:[.09,height*.8,.09]});
  e.push({id:id+'-rail',parent:id+'-door',primitive:'box',material:color,position:[0,height*.64,0],scale:[width,.12,.13]});
  part('seal','cylinder',color,[0,height+.4,0],[.8,.15,.8],{rotation:[90,0,0]});
  e.push({id:id+'-label',parent:id,position:[0,height+.8,.1]});
  return e;
}
export function tower(id,position,{scale=1,color='stone'}={}){
  const e=[{id,position,scale:[scale,scale,scale]}];
  for(let i=0;i<3;i++){
    e.push({id:`${id}-floor-${i}`,parent:id,primitive:'cylinder',material:color,position:[0,1.5+i*2.4,0],scale:[3.3-i*.35,3,3.3-i*.35]},
      {id:`${id}-rim-${i}`,parent:id,primitive:'cylinder',material:'gold',position:[0,2.6+i*2.4,0],scale:[3.65-i*.35,.13,3.65-i*.35]},
      {id:`${id}-window-${i}`,parent:id,primitive:'box',material:'glow',position:[0,1.8+i*2.4,1.69-i*.175],scale:[.55,.95,.05]});
  }
  e.push({id:id+'-roof',parent:id,primitive:'cone',material:'indigo',position:[0,8.6,0],scale:[3.5,2.6,3.5]},
    {id:id+'-tip',parent:id,primitive:'sphere',material:'glow',position:[0,10,0],scale:[.25,.4,.25]});
  return e;
}
export function planter(id,position,scale=1){
  const e=[{id,position,scale:[scale,scale,scale]},
    {id:id+'-pot',parent:id,primitive:'cylinder',material:'rose',position:[0,.25,0],scale:[.8,.5,.8]}];
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;
    e.push({id:`${id}-leaf-${i}`,parent:id,primitive:'sphere',material:i%2?'leaf':'mint',position:[Math.cos(a)*.3,.65,Math.sin(a)*.3],scale:[.25,.85,.3],rotation:[20*Math.sin(a),0,25*Math.cos(a)]});
  }
  return e;
}
