import * as T from 'three';
import { mineralSurface } from './surfaces';

type Palette = { stone:T.MeshStandardMaterial; ivory:T.MeshStandardMaterial; navy:T.MeshStandardMaterial; trim:T.MeshStandardMaterial; grass:T.MeshStandardMaterial };
type TreeBuilder = (parent:T.Object3D,x:number,z:number,scale:number,pink?:boolean)=>void;

// An authored view: the central opening is kept clear, with one garden sanctuary
// to the right and inhabited stepped terraces to the left. Distant scenery never
// changes the collision or destination contract of the local promenade.
export function buildVista(parent:T.Object3D, palette:Palette, tree:TreeBuilder, options:{background?:boolean;surround?:boolean;districts?:boolean}={}){
  const background=!!options.background;
  const root=new T.Group();parent.add(root);
  const glass=new T.MeshStandardMaterial({color:'#23697c',roughness:.3,metalness:.25});
  glass.map=mineralSurface(82);
  const green=new T.MeshStandardMaterial({color:'#537865',roughness:1});
  const rock=new T.MeshStandardMaterial({color:'#526a81',roughness:1,flatShading:true,vertexColors:true});
  const paleRock=new T.MeshStandardMaterial({color:'#829dac',roughness:1,flatShading:true,vertexColors:true});
  const grass=new T.MeshStandardMaterial({color:'#758c66',roughness:.95});
  const glow=new T.MeshBasicMaterial({color:'#a1e6e2'});
  const vaultMaterial=palette.ivory.clone();vaultMaterial.side=T.DoubleSide;
  const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);

  function mesh(g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0,p:T.Object3D=root){
    const object=new T.Mesh(g,m);object.position.set(x,y,z);
    object.castShadow=true;object.receiveShadow=true;p.add(object);return object;
  }
  function band(p:T.Object3D,points:T.Vector3[],radius:number,m:T.Material,detail?:number){
    const segments=detail??(points.length<=3&&radius<.25?16:48);
    return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),segments,radius,6,false),m,0,0,0,p);
  }
  function ring(p:T.Object3D,x:number,y:number,z:number,rx:number,rz:number,radius:number,m:T.Material){
    const points=Array.from({length:49},(_,i)=>v(x+Math.cos(i/48*Math.PI*2)*rx,y,z+Math.sin(i/48*Math.PI*2)*rz));
    band(p,points,radius,m);
  }
  function volume(p:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,simple=false){
    const shape=new T.Shape(),r=Math.min(w,d)*.16,l=-w/2,b=-d/2;
    shape.moveTo(l+r,b);shape.lineTo(l+w-r,b);shape.quadraticCurveTo(l+w,b,l+w,b+r);
    shape.lineTo(l+w,b+d-r);shape.quadraticCurveTo(l+w,b+d,l+w-r,b+d);
    shape.lineTo(l+r,b+d);shape.quadraticCurveTo(l,b+d,l,b+d-r);
    shape.lineTo(l,b+r);shape.quadraticCurveTo(l,b,l+r,b);
    const g=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:!simple,bevelSize:.12,bevelThickness:.1,bevelSegments:2,curveSegments:simple?3:5});
    g.rotateX(-Math.PI/2);return mesh(g,m,x,y,z,p);
  }
  function island(x:number,y:number,z:number,rx:number,rz:number,depth:number,faded=false){
    const group=new T.Group();group.position.set(x,y,z);root.add(group);
    const positions:number[]=[],colors:number[]=[],indices:number[]=[],n=36;
    const levels=[[1,0],[1.04,-1.2],[.87,-depth*.32],[.52,-depth*.8],[.13,-depth]];
    for(let j=0;j<levels.length;j++)for(let i=0;i<n;i++){
      const a=i/n*Math.PI*2,rough=1+.12*Math.sin(a*7+.3)+.075*Math.cos(a*11+j*.44);
      positions.push(Math.cos(a)*rx*levels[j][0]*rough,levels[j][1]+Math.sin(a*5+j)*j*.48,Math.sin(a)*rz*levels[j][0]*rough);
      const tone=.74+.18*Math.sin(a*3+.7)+.08*Math.cos(a*13);
      colors.push(tone,tone*.98,tone);
      if(j<levels.length-1){const k=j*n+i,q=j*n+(i+1)%n;indices.push(k,q,k+n,q,q+n,k+n)}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
    mesh(g,faded?paleRock:rock,0,0,0,group);
    const cap=mesh(new T.CylinderGeometry(1,1,.45,48),palette.ivory,0,.05,0,group);cap.scale.set(rx,1,rz);
    const turf=mesh(new T.CylinderGeometry(1,1,.09,48),grass,0,.32,0,group);turf.scale.set(rx*.93,1,rz*.93);
    ring(group,0,.38,0,rx*.98,rz*.98,.12,palette.trim);
    // Layered stone shelves break the geometric cone into a suspended landform.
    for(let j=0;j<3;j++){
      const ledge=mesh(new T.CylinderGeometry(1,1,.35,36),palette.stone,rx*.08*Math.sin(j*2),-2-j*depth*.20,0,group);
      ledge.scale.set(rx*(.94-j*.13),1,rz*(.94-j*.13));
    }
    // Structural fins tie the garden cap to the floating mass.
    for(let i=0;i<(background?0:9);i++){
      const a=i/9*Math.PI*2;
      band(group,[v(Math.cos(a)*rx*.97,.05,Math.sin(a)*rz*.97),v(Math.cos(a)*rx*.84,-depth*.33,Math.sin(a)*rz*.84),v(Math.cos(a)*rx*.45,-depth*.8,Math.sin(a)*rz*.45)],.18,palette.stone);
    }
    const trailing=new T.Group();group.add(trailing);
    for(let i=0;i<(background?0:23);i++){
      const a=i*2.399,xx=Math.cos(a)*rx*.98,zz=Math.sin(a)*rz*.98,length=1.8+(i%5)*.77;
      band(trailing,[v(xx,.4,zz),v(xx*1.05,-length*.45,zz*1.05),v(xx*1.01,-length,zz*1.01)],.09,green);
      for(let k=0;k<4;k++){
        const foliage=mesh(new T.IcosahedronGeometry(.5,0),green,xx*(1+.04*Math.sin(k)),.2-k*length/4,zz*1.02,trailing);
        foliage.scale.set(.7,1.2,.9);
      }
    }
    return group;
  }
  let houseOrdinal=0;
  function house(p:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,coarse=false){
    const body=new T.Group();body.position.set(x,y,z);p.add(body);
    const family=houseOrdinal++%3;
    if(options.districts&&family!==2){
      // Large legible masses at city-view distance. Thin planted terraces and
      // deep slab overhangs express use without tiny windows or added trees.
      const tiers=family===0?4:3,levelHeight=h/tiers*(family===0?1:.60);
      for(let i=0;i<tiers;i++){
        const t=i/(tiers-1),width=w*(family===0?1.15-.48*t:1.48-.36*t);
        const depth=d*(1-.25*t),offset=family===0?t*w*.12:-t*w*.13;
        volume(body,offset,i*levelHeight,0,width,levelHeight-.36,depth,glass,true);
        volume(body,offset,i*levelHeight+levelHeight-.36,0,width+1,.28,depth+1.1,palette.ivory,true);
        volume(body,offset,i*levelHeight+levelHeight-.06,depth*.32,width*.86,.08,depth*.24,green,true);
        // One off-center spine anchors the stepped silhouette.
        volume(body,offset-width*.30,i*levelHeight,-depth*.49,.28,levelHeight,.30,palette.stone,true);
      }
      if(family===1){
        // Broad lifted roof, only 36 triangles: a different civic silhouette,
        // not another stacked tower with a different height.
        const width=w*1.42,depth=d*.90,positions:number[]=[],indices:number[]=[];
        const roofY=tiers*levelHeight+.10;
        for(let i=0;i<=18;i++){
          const u=i/18,x=(u-.5)*width-w*.13;
          const yy=roofY+Math.sin(u*Math.PI)*h*.10+u*h*.075;
          for(const side of [-1,1])positions.push(x,yy,side*depth*.5);
          if(i<18){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2)}
        }
        const roof=new T.BufferGeometry();roof.setAttribute('position',new T.Float32BufferAttribute(positions,3));roof.setIndex(indices);roof.computeVertexNormals();
        mesh(roof,vaultMaterial,0,0,0,body);
        for(const side of [-1,1]){
          const edge=Array.from({length:7},(_,i)=>{const u=i/6;return v((u-.5)*width-w*.13,roofY+Math.sin(u*Math.PI)*h*.10+u*h*.075,side*depth*.5)});
          band(body,edge,.10,palette.trim,12);
        }
      }
      return;
    }
    const divisions=coarse?8:16;
    const profile=Array.from({length:divisions+1},(_,i)=>{
      const t=i/divisions;return new T.Vector2(options.districts?.44-.25*t+.055*Math.sin(t*Math.PI):.52-.18*t+.065*Math.sin(t*Math.PI*2),t*h);
    });
    const shell=mesh(new T.LatheGeometry(profile,coarse?12:28),glass,0,0,0,body);shell.scale.set(w,1,d);
    const floors=Math.max(3,Math.round(h/(background?4:2.7)));
    for(let i=0;i<=floors;i++){
      const t=i/floors,r=options.districts?.44-.25*t+.055*Math.sin(t*Math.PI):.52-.18*t+.065*Math.sin(t*Math.PI*2);
      const floor=mesh(new T.CylinderGeometry(r+.035,r+.035,.17,coarse?12:36),palette.ivory,0,t*h,0,body);floor.scale.set(w,1,d);
      if(i===floors){const garden=mesh(new T.CylinderGeometry(r*.84,r*.84,.12,coarse?12:28),green,0,t*h+.15,0,body);garden.scale.set(w,1,d)}
    }
    for(let i=0;i<(background?3:5);i++){
      const a=i/5*Math.PI*2;
      const line=profile.map(q=>v(Math.cos(a)*q.x*w,q.y,Math.sin(a)*q.x*d));
      band(body,line,.15,palette.stone,coarse?12:undefined);
    }
    // One sweeping antenna follows the tower's taper, breaking a generic box silhouette.
    band(body,[v(-w*.25,h*.7,0),v(-w*.15,h*1.08,0),v(w*.05,h*1.38,0)],.14,palette.ivory);
  }

  // The landmark: an open civic conservatory supporting a flowering crown.
  const sanctuary=island(22,-4,-77,20,14,23);
  volume(sanctuary,0,.5,0,21,.55,13,palette.stone);
  volume(sanctuary,0,1.1,0,17,.2,10,green);
  for(let i=0;i<5;i++){
    const a=.3+i/5*Math.PI*2;
    const blade=new T.Shape();blade.moveTo(-1.0,0);blade.bezierCurveTo(-.5,8,4,14,3.9,22);blade.bezierCurveTo(7,15,3,5,1.1,0);blade.closePath();
    const fin=mesh(new T.ExtrudeGeometry(blade,{depth:.7,bevelEnabled:true,bevelThickness:.1,bevelSize:.15,bevelSegments:2}),palette.ivory,Math.cos(a)*10.7,1.2,Math.sin(a)*8.2,sanctuary);fin.rotation.y=-a-Math.PI/2;
    band(sanctuary,[v(Math.cos(a)*10.8,1.3,Math.sin(a)*8.3),v(Math.cos(a)*12.4,8,Math.sin(a)*9.3),v(Math.cos(a)*14.6,15,Math.sin(a)*10.1)],.09,palette.trim);
  }
  tree(sanctuary,0,0,3.2,true);
  tree(sanctuary,-13,3,1.15,false);tree(sanctuary,12,2,1.15,false);
  ring(sanctuary,0,1.4,0,8.1,5.8,.1,palette.trim);
  // Water traces the island's lip and falls into the lower atmosphere.
  const waterMaterial=new T.MeshStandardMaterial({color:'#a4ece5',roughness:.18,metalness:.05,transparent:true,opacity:.72,side:T.DoubleSide});
  for(const x of [-10,10]){
    const fall=new T.PlaneGeometry(.8,23,1,12),pos=fall.attributes.position;
    for(let i=0;i<pos.count;i++)pos.setZ(i,Math.sin(pos.getY(i)*.4)*.18);
    fall.computeVertexNormals();mesh(fall,waterMaterial,x,-10.7,11.5,sanctuary);
    band(sanctuary,[v(x,1.2,5),v(x,1.1,9),v(x,.2,11.5)],.23,glow);
  }

  // Off-axis clusters preserve an open sightline through the pavilion.
  const west=island(-38,-12,-76,22,15,26);
  house(west,-7,.5,-3,10,15,8);house(west,7,.5,1,9,9,7);
  tree(west,3,8,1.65,true);tree(west,-15,4,1.3,false);
  const east=island(70,-18,-128,25,18,30,true);
  house(east,-8,.5,-5,9,21,8);house(east,7,.5,0,11,13,10);tree(east,-2,9,2,false);
  const high=island(-30,9,-166,13,9,21,true);
  house(high,-2,.5,-1,8,13,6);tree(high,5,3,1.3,true);
  const far=island(0,-23,-218,36,23,37,true);
  for(let i=0;i<5;i++)house(far,-24+i*12,.5,-i%2*5,7,11+(i%3)*6,7);

  if(options.surround){
    // Reuse the same civic vocabulary around the viewing court. Low distant
    // tiers frame side/reverse views without adding a local destination or
    // repeating the expensive hero-tree kit around the horizon.
    const sideDistricts=[[-91,-8,-25,24,17,27],[106,-12,-43,29,21,34],[15,-6,108,33,23,32]];
    for(const [x,y,z,rx,rz,depth] of sideDistricts){
      const district=island(x,y,z,rx,rz,depth,true);
      house(district,-rx*.32,.5,-3,11,18,9,true);
      house(district,rx*.27,.5,2,13,11,10,true);
      volume(district,0,.6,rz*.48,rx*1.30,.50,4,palette.stone);
      ring(district,0,1.25,0,rx*.80,rz*.78,.10,palette.trim);
    }
    // One broad transit sweep relates the side district to the established city;
    // it sits far beyond the walking boundary and has no interaction marker.
    band(root,[v(-96,1,-27),v(-74,3,-48),v(-56,2,-64),v(-38,1,-77)],.27,palette.ivory);
  }

  // A thin transit ribbon connects inhabited places without becoming a false
  // local quest route. Its continuous support geometry survives camera orbit.
  const transit=[v(-53,6,-83),v(-24,11,-97),v(4,9,-107),v(40,4,-120),v(69,4,-128)];
  band(root,transit,.36,palette.ivory);
  band(root,transit.map(p=>p.clone().add(v(0,.35,0))),.065,palette.trim);
  const carriage=new T.Group();carriage.position.set(-17,10,-100);carriage.rotation.y=-.38;root.add(carriage);
  volume(carriage,0,.1,0,8.5,1.4,1.6,palette.ivory);
  volume(carriage,0,.65,.83,6.8,.65,.05,glass);
  for(const x of [-2.6,-.9,.9,2.6])volume(carriage,x,.67,.87,.1,.7,.06,palette.stone);

  // Soft atmospheric banks occupy real depths below and behind the islands.
  const cloudCanvas=document.createElement('canvas');cloudCanvas.width=512;cloudCanvas.height=256;
  const ctx=cloudCanvas.getContext('2d')!;
  for(let i=0;i<17;i++){
    const x=40+i*27,y=145-37*Math.sin(i*.64),rad=35+19*(.5+.5*Math.sin(i*1.7));
    const grad=ctx.createRadialGradient(x,y,rad*.08,x,y,rad);
    grad.addColorStop(0,'rgba(255,251,240,.88)');grad.addColorStop(.6,'rgba(236,243,243,.73)');grad.addColorStop(1,'rgba(208,229,237,0)');
    ctx.fillStyle=grad;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
  }
  const cloudTexture=new T.CanvasTexture(cloudCanvas);cloudTexture.colorSpace=T.SRGBColorSpace;
  const cloudMaterial=new T.MeshBasicMaterial({map:cloudTexture,transparent:true,depthWrite:false,opacity:.95,side:T.DoubleSide,fog:false});
  for(let i=0;i<15;i++){
    const cloud=mesh(new T.PlaneGeometry(115,48),cloudMaterial,(i%5-2)*66,-18-Math.floor(i/5)*8,-57-Math.floor(i/5)*74-(i%2)*12);
    cloud.castShadow=false;cloud.receiveShadow=false;cloud.rotation.z=Math.sin(i*2)*.035;
  }
  if(options.surround){
    // Reuse the existing soft atlas at several genuine world depths, rather
    // than a full-screen fog veil. Gaps preserve the island silhouettes.
    for(const [x,y,z,angle] of [[-115,-20,-90,.8],[115,-27,-105,-.8],[35,-30,170,Math.PI]]){
      const bank=mesh(new T.PlaneGeometry(175,50),cloudMaterial,x,y,z);
      bank.rotation.y=angle;bank.castShadow=false;bank.receiveShadow=false;
    }
  }
  // Silhouette scenery has no local contact or shadow responsibility. Avoid
  // spending the near-field shadow budget on distant non-interactive meshes.
  if(background)root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=false;o.receiveShadow=false}});
  return root;
}
