/* Relay Rescue: The Echo Forge — shared 3D story/Signal-1 world.
   Presentation only: the server remains authoritative for progress/evidence. */
import * as THREE from './vendor/three.module.min.js';

export function createStoryWorld(host,{reducedMotion=false,mode='story'}={}){
  const canvas=document.createElement('canvas');
  canvas.className=`rgi-three-canvas${mode==='mission'?' rgc1-mission-canvas':''}`;
  canvas.setAttribute('aria-hidden','true');
  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
  }catch(error){
    return {available:false,setBeat(){},setMissionState(){},setPaused(){},replay(){},dispose(){},stats(){return{available:false,error:String(error)}}};
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  renderer.setClearColor(0x06131e);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;

  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x071521,.026);
  const camera=new THREE.PerspectiveCamera(45,1,.1,120);
  scene.add(new THREE.HemisphereLight(0xa8e9e7,0x08131d,1.55));
  const moonLight=new THREE.DirectionalLight(0xffd9a6,2.35);moonLight.position.set(-8,13,9);scene.add(moonLight);
  const stormLight=new THREE.PointLight(0xc7eaff,0,28);stormLight.position.set(0,8,1);scene.add(stormLight);
  const forgeLight=new THREE.PointLight(0xffa957,2.2,10);forgeLight.position.set(5.1,1.7,1.3);scene.add(forgeLight);

  const geometries=new Set(),materials=new Set();
  const geo=g=>(geometries.add(g),g);
  const mat=(color,opts={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.78,metalness:.07,...opts});materials.add(m);return m;};
  const emissive=(color,intensity=1,opts={})=>{const m=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.5,...opts});materials.add(m);return m;};
  const box=geo(new THREE.BoxGeometry(1,1,1)),sphere=geo(new THREE.SphereGeometry(1,16,12)),cone=geo(new THREE.ConeGeometry(1,1,7)),cyl=geo(new THREE.CylinderGeometry(1,1,1,16)),torus=geo(new THREE.TorusGeometry(1,.22,10,24)),plane=geo(new THREE.PlaneGeometry(1,1));
  function mesh(parent,g,m,pos,scale=[1,1,1]){const o=new THREE.Mesh(g,m);o.position.set(...pos);o.scale.set(...scale);parent.add(o);return o;}
  function group(parent=scene){const g=new THREE.Group();parent.add(g);return g;}

  const c={rock:mat(0x203b4b),grass:mat(0x527f6f),grass2:mat(0x6d9b7e),wood:mat(0x9d704e),gold:emissive(0xe8bf68,.3),paper:mat(0xf4d99a),dark:mat(0x122a36),pip:mat(0xe0a159,{metalness:.16}),red:mat(0xc65449),glass:emissive(0x72dcc9,.78),forge:mat(0xa68266,{metalness:.18}),storm:emissive(0xc8eaff,2.4),danger:emissive(0xff745f,.9,{transparent:true,opacity:.8}),ember:emissive(0xffa852,1.75),water:mat(0x0c4057,{transparent:true,opacity:.62,roughness:.32})};

  const moon=mesh(scene,sphere,emissive(0xffe5b1,1.8),[-10,13,-24],[2.2,2.2,2.2]);
  const water=mesh(scene,plane,c.water,[0,-3.25,-7],[48,48,1]);water.rotation.x=-Math.PI/2;
  const starGeom=geo(new THREE.BufferGeometry()),starPos=[];for(let i=0;i<175;i++)starPos.push((Math.random()-.5)*74,5+Math.random()*27,-12-Math.random()*45);starGeom.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));
  const starMat=new THREE.PointsMaterial({color:0xd6f3f2,size:.105,sizeAttenuation:true,transparent:true,opacity:.82});materials.add(starMat);scene.add(new THREE.Points(starGeom,starMat));
  const cloudMat=mat(0x9fc9c5,{transparent:true,opacity:.09,roughness:1});
  for(const [x,y,z,s] of [[-8,5,-8,2.4],[9,6,-12,3],[0,3.2,-18,4],[-14,2,-15,3]]){const g=group();g.position.set(x,y,z);for(let i=0;i<4;i++)mesh(g,sphere,cloudMat,[i*.9,Math.sin(i*1.7)*.2,0],[1.4*s/3,.55*s/3,.75*s/3]);}

  function island(x,z,s=1){const g=group();g.position.set(x,-1,z);mesh(g,cone,c.rock,[0,-1.85,0],[3.8*s,4.4*s,3.8*s]);mesh(g,cyl,c.grass,[0,.08,0],[3.5*s,.42,3.5*s]);mesh(g,cyl,c.grass2,[.35,.32,-.2],[2.3*s,.08,2.3*s]);return g;}
  island(-5.2,0,1.05);island(5.3,-.3,1.05);island(-9,-9,.72);island(10,-10,.72);island(0,-13,.6);island(-1.8,-7,.48);island(5,-7.5,.42);
  for(const [x,z] of [[-7,-1],[-6,2],[6,-2],[7,1],[4,2.2]]){mesh(scene,cyl,c.wood,[x,.2,z],[.12,1.5,.12]);mesh(scene,cone,c.grass2,[x,1.65,z],[.75,1.9,.75]);}

  const beacons=[],beaconPositions=[[-7,2],[-3,-7],[0,-12],[4,-8],[7,2],[10,-10],[-10,-9]];
  for(const [i,[x,z]] of beaconPositions.entries()){
    const g=group();g.position.set(x,0,z);mesh(g,cyl,c.dark,[0,1,0],[.16,2,.16]);mesh(g,cone,c.dark,[0,2.05,0],[.38,.55,.38]);
    const lamp=mesh(g,sphere,emissive(0x35545d,.08),[0,2.36,0],[.23,.23,.23]);beacons.push({g,lamp,i});
  }

  const pip=group();pip.position.set(-5.2,.35,1.2);const pipBody=group(pip);
  mesh(pipBody,box,c.pip,[0,.65,0],[.68,.72,.52]);const head=group(pipBody);head.position.set(0,1.3,0);mesh(head,box,c.pip,[0,0,0],[.92,.62,.62]);mesh(head,box,c.dark,[0,.04,.34],[.78,.33,.05]);
  const eyes=[];for(const x of [-.2,.2])eyes.push(mesh(head,sphere,c.glass,[x,.05,.4],[.06,.06,.04]));
  const scarf=mesh(pipBody,box,c.red,[.45,.98,-.05],[.72,.09,.24]);scarf.rotation.y=-.35;mesh(pipBody,box,c.red,[-.24,.72,-.38],[.34,.38,.08]);
  for(const x of [-.24,.24])mesh(pipBody,box,c.pip,[x,.03,0],[.18,.42,.25]);
  const antenna=mesh(pipBody,cyl,c.pip,[0,1.92,0],[.025,.42,.025]);antenna.rotation.z=.06;mesh(pipBody,sphere,c.glass,[0,2.15,0],[.08,.08,.08]);
  const arm=group(pipBody);arm.position.set(.5,.75,0);mesh(arm,box,c.pip,[.18,0,0],[.38,.12,.12]);

  const forge=group();forge.position.set(5.3,.2,-.5);mesh(forge,box,c.forge,[0,1,0],[2.45,1.9,2.1]);const roof=mesh(forge,cone,c.dark,[0,2.45,0],[2,1.25,2]);roof.rotation.y=Math.PI/4;
  const windows=[];for(const x of [-.68,-.15])windows.push(mesh(forge,box,c.glass,[x,1.3,1.08],[.3,.3,.05]));
  const furnace=mesh(forge,sphere,c.ember,[.65,.7,1.15],[.36,.36,.08]);mesh(forge,cyl,c.dark,[1.5,2.55,-.5],[.22,1.2,.22]);
  for(const x of [-1.4,1.3]){const pipe=mesh(forge,cyl,c.dark,[x,2.1,-.35],[.1,.65,.1]);pipe.rotation.z=x<0?.13:-.13;}

  const bridge=group();bridge.position.set(0,.2,1);const bridgeLeft=group(bridge),bridgeRight=group(bridge);bridgeLeft.position.x=-2.3;bridgeRight.position.x=2.3;
  for(let i=0;i<7;i++){mesh(bridgeLeft,box,c.wood,[i*.38,0,0],[.31,.12,1.05]);mesh(bridgeRight,box,c.wood,[-i*.38,0,0],[.31,.12,1.05]);}
  for(const x of [-2.8,2.8]){mesh(scene,box,c.wood,[x,.55,1],[.12,1.1,1.25]);}
  function makeGear(parent,material,pos,scale=.52){const g=group(parent);g.position.set(...pos);mesh(g,torus,material,[0,0,0],[scale,scale,.18]);for(let i=0;i<8;i++){const a=i*Math.PI/4,tooth=mesh(g,box,material,[Math.cos(a)*scale*1.15,Math.sin(a)*scale*1.15,0],[.13,.2,.16]);tooth.rotation.z=a;}g.rotation.y=Math.PI/2;return g;}
  const brokenGear=makeGear(scene,c.gold,[0,.55,1.1],.38),newGear=makeGear(scene,c.gold,[4.55,.75,1.15],.48),duplicateGear=makeGear(scene,c.danger,[5.62,.75,1.15],.48);newGear.visible=false;duplicateGear.visible=false;

  const press=group();press.position.set(-7,.25,-.8);mesh(press,cyl,c.red,[0,.3,0],[.45,.5,.45]);mesh(press,box,c.paper,[0,.58,0],[.62,.06,.46]);press.visible=false;
  const embers=[];for(let i=0;i<4;i++){const e=mesh(forge,sphere,c.ember,[-.83+i*.3,.43,1.18],[.085,.085,.05]);embers.push(e);}
  const order=mesh(scene,box,c.paper,[-4.1,1.7,.1],[.72,.46,.055]);order.visible=false;
  const reply=mesh(scene,sphere,c.glass,[4.2,2.2,.4],[.22,.22,.22]);reply.visible=false;
  const bolt=group();bolt.position.set(0,4.5,.3);const boltA=mesh(bolt,box,c.storm,[0,0,0],[.08,2.6,.08]);boltA.rotation.z=.26;const boltB=mesh(bolt,box,c.storm,[.48,-1.75,0],[.08,1.3,.08]);boltB.rotation.z=-.3;bolt.visible=false;
  const lineMat=new THREE.LineBasicMaterial({color:0x74dbc9,transparent:true,opacity:.62});materials.add(lineMat);
  const lineGeo=geo(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-4.2,2.2,.2),new THREE.Vector3(4.3,2.2,.2)]));const signalLine=new THREE.Line(lineGeo,lineMat);scene.add(signalLine);signalLine.visible=false;
  const echoGeo=geo(new THREE.TorusGeometry(1,.025,6,36));const echoRing=mesh(scene,echoGeo,emissive(0x72dcc9,.75,{transparent:true,opacity:.55}),[-6.95,2.4,2],[.2,.2,.2]);echoRing.rotation.x=Math.PI/2;echoRing.visible=false;

  const cameraTargets=[
    {p:[0,7.4,18.6],t:[0,.8,-1.7]},
    {p:[-1.3,4.7,11.6],t:[-1.5,.7,1]},
    {p:[1.9,4.9,12.1],t:[1.8,1,.15]},
    {p:[.1,5.6,13.8],t:[0,1.8,.15]},
    {p:[2.2,4.7,11.5],t:[2.4,.9,.3]},
    {p:[-1.3,6.4,15.3],t:[-.6,1,-.6]}
  ];
  const portraitTargets=[
    {p:[0,8.7,29],t:[0,.8,-1.2]},
    {p:[-.5,6.4,21.5],t:[-.7,.75,.9]},
    {p:[1.6,6.4,22],t:[2.1,1,.1]},
    {p:[0,7.1,25],t:[0,1.7,.1]},
    {p:[1.5,6.1,22],t:[2.2,.9,.2]},
    {p:[0,7.5,26],t:[0,1,-.4]}
  ];
  const cameraFor=(index,aspect)=>aspect<.72?portraitTargets[index]:cameraTargets[index];
  const missionCamera=(complete,aspect)=>complete?(aspect<.72?{p:[0,7.2,23],t:[0,.8,.7]}:{p:[0,5.2,13.2],t:[0,.8,.8]}):cameraFor(5,aspect);
  let beat=mode==='mission'?5:0,paused=false,frame=0,disposed=false,beatStart=performance.now(),last=performance.now(),missionState=null;
  const initialAspect=Math.max(.2,(host.clientWidth||390)/(host.clientHeight||650));
  const initialTarget=cameraFor(beat,initialAspect);
  const currentCam=new THREE.Vector3(...initialTarget.p),currentLook=new THREE.Vector3(...initialTarget.t);camera.position.copy(currentCam);camera.lookAt(currentLook);
  const setBeacon=(i,on,soft=false)=>{const lamp=beacons[i].lamp;const hex=on?0x72dcc9:0x35545d;lamp.material.color.setHex(hex);lamp.material.emissive.setHex(hex);lamp.material.emissiveIntensity=on?(soft?.55:1.45):.07;};

  function resetCharacter(){pip.position.set(-5.2,.35,1.2);pipBody.rotation.z=0;head.rotation.z=0;arm.rotation.z=0;eyes.forEach(e=>e.scale.set(.06,.06,.04));}
  function applyBeat(index){
    beat=Math.max(0,Math.min(5,index));beatStart=performance.now();missionState=null;resetCharacter();
    bridgeLeft.rotation.z=beat>=1?.22:0;bridgeRight.rotation.z=beat>=1?-.22:0;brokenGear.visible=beat<=1;newGear.visible=beat>=2;newGear.position.set(4.55,.75,1.15);duplicateGear.visible=beat===4;
    press.visible=beat===4;order.visible=beat===2;reply.visible=beat===3;bolt.visible=beat===3;signalLine.visible=beat===3;echoRing.visible=beat===5;
    forge.scale.setScalar(beat===2||beat===3?1.05:1);forgeLight.intensity=beat>=2?3.3:2.1;furnace.material.emissiveIntensity=beat>=2?2.4:1.4;
    embers.forEach((e,i)=>{const dim=beat===4&&i===3;e.material.emissiveIntensity=dim?.12:1.75;e.scale.setScalar(dim?.55:1);});
    beacons.forEach((_,i)=>setBeacon(i,i===0,beat<5));
    if(beat===1){pipBody.rotation.z=-.08;head.rotation.z=.12;}if(beat===4){arm.rotation.z=-.65;head.rotation.z=-.12;}if(beat===5){head.rotation.y=-.35;}
    stormLight.intensity=0;if(reducedMotion){const aspect=Math.max(.2,(host.clientWidth||390)/(host.clientHeight||650)),target=cameraFor(beat,aspect);currentCam.set(...target.p);currentLook.set(...target.t);camera.position.copy(currentCam);camera.lookAt(currentLook);}requestDraw();
  }

  function applyMissionState(state={}){
    missionState=state;beat=5;beatStart=performance.now();resetCharacter();
    const effects=state.visible_effects??null,failed=Boolean(state.failed),complete=Boolean(state.complete);
    bridgeLeft.rotation.z=complete?0:.22;bridgeRight.rotation.z=complete?0:-.22;brokenGear.visible=!complete;newGear.visible=effects!==null||complete;duplicateGear.visible=effects>1||failed;press.visible=false;order.visible=false;reply.visible=false;bolt.visible=false;signalLine.visible=false;echoRing.visible=true;
    if(complete){newGear.position.set(0,.58,1.1);pip.position.x=1.9;}else newGear.position.set(4.55,.75,1.15);
    beacons.forEach((_,i)=>setBeacon(i,i===0||complete&&i===1,complete&&i===1));
    embers.forEach(e=>{e.scale.setScalar(1);e.material.emissiveIntensity=1.75;});
    forgeLight.intensity=failed?4.2:2.7;
    if(failed){head.rotation.z=.18;arm.rotation.z=-.35;}if(complete){head.rotation.y=.28;}
    const aspect=Math.max(.2,(host.clientWidth||390)/(host.clientHeight||650)),target=missionCamera(complete,aspect);currentCam.set(...target.p);currentLook.set(...target.t);camera.position.copy(currentCam);camera.lookAt(currentLook);requestDraw();
  }

  function render(time){
    frame=0;if(disposed||!host.isConnected)return;const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
    const dt=Math.min(.04,(time-last)/1000);last=time,aspect=w/h,target=missionState?missionCamera(Boolean(missionState.complete),aspect):cameraFor(beat,aspect);
    if(reducedMotion){currentCam.set(...target.p);currentLook.set(...target.t);camera.position.copy(currentCam);camera.lookAt(currentLook);}
    else {const ease=1-Math.pow(.001,dt);currentCam.lerp(new THREE.Vector3(...target.p),ease);currentLook.lerp(new THREE.Vector3(...target.t),ease);camera.position.copy(currentCam);camera.lookAt(currentLook);}
    if(!paused&&!reducedMotion){
      const t=(time-beatStart)/1000;pip.position.y=.35+Math.sin(time/700)*.035;scarf.rotation.z=Math.sin(time/360)*.07;moon.rotation.y+=dt*.015;newGear.rotation.z+=dt*.75;duplicateGear.rotation.z-=dt*.55;
      furnace.scale.setScalar(1+Math.sin(time/210)*.05);
      if(!missionState&&beat===0){pip.position.x=-5.2+Math.min(1,t/2.4)*.55;}
      if(!missionState&&beat===1){brokenGear.rotation.z+=dt*1.5;pip.position.x=-5.2-Math.sin(Math.min(1,t/1.2)*Math.PI)*.18;}
      if(!missionState&&beat===2){const q=Math.min(1,t/1.7);order.position.set(-4.1+8.3*q,1.7+Math.sin(q*Math.PI)*1.7,.1-.5*q);order.rotation.y=q*.7;}
      if(!missionState&&beat===3){const q=Math.min(1,t/1.65);reply.position.set(4.2-8.1*q,2.2+Math.sin(q*Math.PI)*.7,.4);const flash=q>.43&&q<.63;bolt.visible=flash;reply.visible=q<.56;stormLight.intensity=flash?8:0;}
      if(!missionState&&beat===4){duplicateGear.scale.setScalar(.92+Math.sin(time/190)*.07);}
      if(beat===5){echoRing.visible=true;const pulse=.35+(Math.sin(time/420)+1)*.18;echoRing.scale.setScalar(pulse);echoRing.material.opacity=.25+(Math.sin(time/420)+1)*.13;}
      if(missionState?.complete){beacons[1].lamp.scale.setScalar(1+Math.sin(time/300)*.12);}
    }
    renderer.render(scene,camera);if(!paused&&!reducedMotion)frame=requestAnimationFrame(render);
  }
  function requestDraw(){if(!frame&&!disposed)frame=requestAnimationFrame(render);}
  const resize=new ResizeObserver(requestDraw);resize.observe(canvas);host.prepend(canvas);host.classList.add('rgi-has-three');
  if(mode==='mission')applyMissionState({});else applyBeat(0);
  return{
    available:true,
    setBeat(index){applyBeat(index);},
    setMissionState(state){applyMissionState(state);},
    replay(){beatStart=performance.now();missionState?applyMissionState(missionState):applyBeat(beat);},
    setPaused(value){paused=Boolean(value);requestDraw();},
    stats(){return{available:true,revision:THREE.REVISION,beat,mode,drawCalls:renderer.info.render.calls,pixelRatio:renderer.getPixelRatio()};},
    dispose(){disposed=true;cancelAnimationFrame(frame);resize.disconnect();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();canvas.remove();host.classList.remove('rgi-has-three');}
  };
}
