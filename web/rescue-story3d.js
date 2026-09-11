/* Relay Rescue: The Echo Forge — shared 3D story/Signal-1 world.
   Presentation only: the server remains authoritative for progress/evidence. */
import {THREE,createThreeStoryRuntime} from './story3d-runtime.js';
import {STORY3D_ADAPTER_VERSION} from './story3d-world-host.js';

export const storyWorldManifest=Object.freeze({
  id:'relay-rescue.echo-forge',
  version:'2',
  adapterVersion:STORY3D_ADAPTER_VERSION,
  modes:Object.freeze(['story','mission']),
  capabilities:Object.freeze(['beats','mission-state','pause','replay','stats','fallback'])
});

export function createStoryWorld(host,{reducedMotion=false,mode='story'}={}){
  const storyOverlay=host?.closest?.('.rgi-overlay');
  const runtime=createThreeStoryRuntime(host,{
    canvasClass:`rgi-three-canvas${mode==='mission'?' rgc1-mission-canvas':''}`,
    reducedMotion,clearColor:0x071824,exposure:1.18,pixelRatioCap:1.5,
    onContextLost(){
      if(mode==='mission'){host.classList.remove('rgc1-three-ready');host.classList.add('rgc1-three-failed');}
      else{storyOverlay?.classList.remove('rgi-three-ready');storyOverlay?.classList.add('rgi-three-failed');}
    },
    onContextRestored(){
      if(mode==='mission'){host.classList.remove('rgc1-three-failed');host.classList.add('rgc1-three-ready');}
      else{storyOverlay?.classList.remove('rgi-three-failed');storyOverlay?.classList.add('rgi-three-ready');}
    }
  });
  if(!runtime.available){
    return {available:false,setBeat(){},setMissionState(){},setPaused(){},replay(){},dispose(){},stats(){return runtime.stats();}};
  }
  const {scene,camera}=runtime;scene.fog=new THREE.FogExp2(0x071824,.021);
  scene.add(new THREE.HemisphereLight(0xb8f1e9,0x08131d,1.72));
  const moonLight=new THREE.DirectionalLight(0xffd9a6,2.35);moonLight.position.set(-8,13,9);scene.add(moonLight);
  const stormLight=new THREE.PointLight(0xc7eaff,0,28);stormLight.position.set(0,8,1);scene.add(stormLight);
  const forgeLight=new THREE.PointLight(0xffa957,2.2,10);forgeLight.position.set(5.1,1.7,1.3);scene.add(forgeLight);

  const geo=runtime.trackGeometry,mat=runtime.material,emissive=runtime.emissive,mesh=runtime.mesh,group=runtime.group;
  const box=geo(new THREE.BoxGeometry(1,1,1)),sphere=geo(new THREE.SphereGeometry(1,16,12)),cone=geo(new THREE.ConeGeometry(1,1,7)),cyl=geo(new THREE.CylinderGeometry(1,1,1,16)),torus=geo(new THREE.TorusGeometry(1,.22,10,24)),plane=geo(new THREE.PlaneGeometry(1,1));

  const c={rock:mat(0x203b4b),grass:mat(0x527f6f),grass2:mat(0x6d9b7e),wood:mat(0x9d704e),gold:emissive(0xe8bf68,.3),paper:mat(0xf4d99a),dark:mat(0x122a36),pip:mat(0xe0a159,{metalness:.16}),red:mat(0xc65449),glass:emissive(0x72dcc9,.78),forge:mat(0xa68266,{metalness:.18}),storm:emissive(0xc8eaff,2.4),danger:emissive(0xff745f,.9,{transparent:true,opacity:.8}),ember:emissive(0xffa852,1.75),water:mat(0x0c4057,{transparent:true,opacity:.66,roughness:.28}),crystal:emissive(0x8af0d5,1.05,{transparent:true,opacity:.88}),mist:emissive(0x6abfc8,.25,{transparent:true,opacity:.08})};

  const moon=mesh(scene,sphere,emissive(0xffe5b1,1.8),[-10,13,-24],[2.2,2.2,2.2]);
  const water=mesh(scene,plane,c.water,[0,-3.25,-7],[48,48,1]);water.rotation.x=-Math.PI/2;
  let seed=1337;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  const starGeom=geo(new THREE.BufferGeometry()),starPos=[];for(let i=0;i<220;i++)starPos.push((rand()-.5)*74,5+rand()*27,-12-rand()*45);starGeom.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));
  const starMat=new THREE.PointsMaterial({color:0xd6f3f2,size:.14,sizeAttenuation:true,transparent:true,opacity:.88});runtime.trackMaterial(starMat);const stars=new THREE.Points(starGeom,starMat);scene.add(stars);
  const moteGeom=geo(new THREE.BufferGeometry()),motePos=[];for(let i=0;i<72;i++)motePos.push((rand()-.5)*17,-.2+rand()*4.8,-3-rand()*10);moteGeom.setAttribute('position',new THREE.Float32BufferAttribute(motePos,3));
  const moteMat=new THREE.PointsMaterial({color:0x8ee7d2,size:.12,sizeAttenuation:true,transparent:true,opacity:.6});runtime.trackMaterial(moteMat);const motes=new THREE.Points(moteGeom,moteMat);scene.add(motes);
  const aurora=group();aurora.position.set(0,8.5,-24);const auroraA=mesh(aurora,box,emissive(0x3d8e91,.24,{transparent:true,opacity:.11}),[0,0,0],[18,.12,.5]);auroraA.rotation.z=.06;const auroraB=mesh(aurora,box,emissive(0xc6a75e,.18,{transparent:true,opacity:.07}),[-1,1.2,-1],[15,.09,.4]);auroraB.rotation.z=-.045;
  const cloudMat=mat(0x9fc9c5,{transparent:true,opacity:.11,roughness:1});const cloudGroups=[];
  for(const [x,y,z,s] of [[-8,5,-8,2.4],[9,6,-12,3],[0,3.2,-18,4],[-14,2,-15,3]]){const g=group();g.position.set(x,y,z);for(let i=0;i<4;i++)mesh(g,sphere,cloudMat,[i*.9,Math.sin(i*1.7)*.2,0],[1.4*s/3,.55*s/3,.75*s/3]);cloudGroups.push(g);}

  function island(x,z,s=1){const g=group();g.position.set(x,-1,z);mesh(g,cone,c.rock,[0,-1.85,0],[3.8*s,4.4*s,3.8*s]);mesh(g,cyl,c.grass,[0,.08,0],[3.5*s,.42,3.5*s]);mesh(g,cyl,c.grass2,[.35,.32,-.2],[2.3*s,.08,2.3*s]);return g;}
  island(-5.2,0,1.05);island(5.3,-.3,1.05);island(-9,-9,.72);island(10,-10,.72);island(0,-13,.6);island(-1.8,-7,.48);island(5,-7.5,.42);
  for(const [x,z] of [[-7,-1],[-6,2],[6,-2],[7,1],[4,2.2]]){mesh(scene,cyl,c.wood,[x,.2,z],[.12,1.5,.12]);mesh(scene,cone,c.grass2,[x,1.65,z],[.75,1.9,.75]);}
  for(const [x,z,h] of [[-6.5,.2,.34],[-4.1,-.6,.26],[-5.7,2.2,.22],[4.1,.2,.28],[6.3,-1.4,.34],[5.9,1.5,.2]]){const crystal=mesh(scene,cone,c.crystal,[x,.34,z],[.16,h,.16]);crystal.rotation.y=.4;}

  const beacons=[],beaconPositions=[[-7,2],[-3,-7],[0,-12],[4,-8],[7,2],[10,-10],[-10,-9]];
  for(const [i,[x,z]] of beaconPositions.entries()){
    const g=group();g.position.set(x,0,z);mesh(g,cyl,c.dark,[0,1,0],[.16,2,.16]);mesh(g,cone,c.dark,[0,2.05,0],[.38,.55,.38]);
    const lamp=mesh(g,sphere,emissive(0x35545d,.08),[0,2.36,0],[.27,.27,.27]);const halo=mesh(g,sphere,emissive(0x35545d,.04,{transparent:true,opacity:.025}),[0,2.36,0],[.78,.78,.78]);beacons.push({g,lamp,halo,i});
  }

  const pip=group();pip.position.set(-5.2,.35,1.2);pip.scale.setScalar(1.22);const pipBody=group(pip);
  mesh(pipBody,box,c.pip,[0,.65,0],[.68,.72,.52]);const head=group(pipBody);head.position.set(0,1.3,0);mesh(head,box,c.pip,[0,0,0],[.92,.62,.62]);mesh(head,box,c.dark,[0,.04,.34],[.78,.33,.05]);
  const eyes=[];for(const x of [-.2,.2])eyes.push(mesh(head,sphere,c.glass,[x,.05,.4],[.075,.075,.045]));
  const scarf=mesh(pipBody,box,c.red,[.45,.98,-.05],[.72,.09,.24]);scarf.rotation.y=-.35;const scarfTail=mesh(pipBody,box,c.red,[-.28,.72,-.38],[.42,.34,.08]);
  const satchel=mesh(pipBody,box,mat(0x6e4934),[-.43,.55,-.12],[.34,.38,.22]);satchel.rotation.z=.08;const badge=mesh(pipBody,sphere,c.gold,[.24,.75,.28],[.09,.09,.04]);
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
  const forgeSign=makeGear(forge,c.gold,[0,2.22,1.12],.27);forgeSign.rotation.y=0;forgeSign.rotation.x=.08;
  const smoke=[];for(const [x,z] of [[1.5,-.5],[-1.4,-.35]]){const puff=group(forge);puff.position.set(x,3.25,z);for(let i=0;i<3;i++)mesh(puff,sphere,c.mist,[i*.18,i*.26,0],[.38+i*.07,.22+i*.05,.3]);smoke.push(puff);}

  const press=group();press.position.set(-7,.25,-.8);mesh(press,cyl,c.red,[0,.3,0],[.45,.5,.45]);mesh(press,box,c.paper,[0,.58,0],[.62,.06,.46]);press.visible=false;
  const embers=[];for(let i=0;i<4;i++){const e=mesh(forge,sphere,c.ember,[-.83+i*.3,.43,1.18],[.085,.085,.05]);embers.push(e);}
  const order=mesh(scene,box,c.paper,[-4.1,1.7,.1],[.72,.46,.055]);order.visible=false;
  const reply=mesh(scene,sphere,c.glass,[4.2,2.2,.4],[.22,.22,.22]);reply.visible=false;
  const bolt=group();bolt.position.set(0,4.5,.3);const boltA=mesh(bolt,box,c.storm,[0,0,0],[.08,2.6,.08]);boltA.rotation.z=.26;const boltB=mesh(bolt,box,c.storm,[.48,-1.75,0],[.08,1.3,.08]);boltB.rotation.z=-.3;bolt.visible=false;
  const lineMat=new THREE.LineBasicMaterial({color:0x74dbc9,transparent:true,opacity:.62});runtime.trackMaterial(lineMat);
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
    {p:[0,7.8,23.5],t:[-1.2,.95,-1.15]},
    {p:[-.7,5.8,18.6],t:[-.9,.8,1]},
    {p:[1.5,5.7,18.9],t:[2.2,1,.05]},
    {p:[0,6.5,21.2],t:[0,1.75,.05]},
    {p:[1.5,5.6,18.8],t:[2.35,.95,.2]},
    {p:[0,6.9,21.8],t:[-.4,1,-.3]}
  ];
  const storyShots=cameraTargets.map((landscape,index)=>({landscape,portrait:portraitTargets[index]}));
  const missionShots={
    active:storyShots[5],
    complete:{landscape:{p:[0,5.2,13.2],t:[0,.8,.8]},portrait:{p:[0,7.2,23],t:[0,.8,.7]}}
  };
  let beat=mode==='mission'?5:0,beatStart=performance.now(),missionState=null;
  const initialAspect=Math.max(.2,(host.clientWidth||390)/(host.clientHeight||650));
  const cameraRig=runtime.createCameraRig(mode==='mission'?missionShots.active:storyShots[beat],{portraitMaxAspect:.72,responsiveness:.001});
  cameraRig.snap(initialAspect);
  const setBeacon=(i,on,soft=false)=>{const {lamp,halo}=beacons[i];const hex=on?0x72dcc9:0x35545d;lamp.material.color.setHex(hex);lamp.material.emissive.setHex(hex);lamp.material.emissiveIntensity=on?(soft?.72:1.65):.07;halo.material.color.setHex(hex);halo.material.emissive.setHex(hex);halo.material.emissiveIntensity=on?(soft?.28:.72):.04;halo.material.opacity=on?(soft?.11:.19):.025;halo.scale.setScalar(on?(soft?.9:1.18):.62);};

  function resetCharacter(){pip.position.set(-5.2,.35,1.2);pipBody.rotation.z=0;head.rotation.z=0;arm.rotation.z=0;eyes.forEach(e=>e.scale.set(.075,.075,.045));}
  function applyBeat(index){
    beat=Math.max(0,Math.min(5,index));beatStart=performance.now();missionState=null;resetCharacter();
    bridgeLeft.rotation.z=beat>=1?.22:0;bridgeRight.rotation.z=beat>=1?-.22:0;brokenGear.visible=beat<=1;newGear.visible=beat>=2;newGear.position.set(4.55,.75,1.15);duplicateGear.visible=beat===4;
    press.visible=beat===4;order.visible=beat===2;reply.visible=beat===3;bolt.visible=beat===3;signalLine.visible=beat===3;echoRing.visible=beat===5;
    forge.scale.setScalar(beat===2||beat===3?1.05:1);forgeLight.intensity=beat>=2?3.3:2.1;furnace.material.emissiveIntensity=beat>=2?2.4:1.4;
    embers.forEach((e,i)=>{const dim=beat===4&&i===3;e.material.emissiveIntensity=dim?.12:1.75;e.scale.setScalar(dim?.55:1);});
    beacons.forEach((_,i)=>{
      if(beat<=2)setBeacon(i,true,true);
      else if(beat===3)setBeacon(i,i===0||i===1,i!==0);
      else if(beat===4)setBeacon(i,i===0||i===3||i===5,true);
      else setBeacon(i,i===0,i!==0);
    });
    if(beat===1){pipBody.rotation.z=-.08;head.rotation.z=.12;}if(beat===4){arm.rotation.z=-.65;head.rotation.z=-.12;}if(beat===5){head.rotation.y=-.35;}
    stormLight.intensity=0;cameraRig.setShot(storyShots[beat]);if(reducedMotion)cameraRig.snap(Math.max(.2,(host.clientWidth||390)/(host.clientHeight||650)));requestDraw();
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
    cameraRig.setShot(complete?missionShots.complete:missionShots.active,{snap:true,aspect:Math.max(.2,(host.clientWidth||390)/(host.clientHeight||650))});requestDraw();
  }

  runtime.setDraw(({time,dt,aspect,animate})=>{
    cameraRig.update({dt,aspect,snap:reducedMotion});
    if(animate){
      const t=(time-beatStart)/1000;pip.position.y=.35+Math.sin(time/700)*.035;scarf.rotation.z=Math.sin(time/360)*.08;scarfTail.rotation.z=-.12+Math.sin(time/330)*.12;moon.rotation.y+=dt*.015;newGear.rotation.z+=dt*.75;duplicateGear.rotation.z-=dt*.55;forgeSign.rotation.z+=dt*.22;
      furnace.scale.setScalar(1+Math.sin(time/210)*.05);motes.rotation.y+=dt*.012;stars.rotation.y+=dt*.0015;aurora.position.x=Math.sin(time/7000)*.45;cloudGroups.forEach((g,i)=>g.position.x+=dt*(.025+i*.006));smoke.forEach((g,i)=>{g.position.y=3.25+Math.sin(time/(900+i*120))*.12;});
      const blink=Math.sin(time/1450)>0.982?.25:1;eyes.forEach(e=>e.scale.y=.075*blink);
      beacons.forEach(({halo},i)=>{const base=halo.material.opacity>.15?1.18:halo.material.opacity>.05?.9:.62;halo.scale.setScalar(base*(1+Math.sin(time/520+i)*.055));});
      if(!missionState&&beat===0){pip.position.x=-5.2+Math.min(1,t/2.4)*.55;}
      if(!missionState&&beat===1){brokenGear.rotation.z+=dt*1.5;pip.position.x=-5.2-Math.sin(Math.min(1,t/1.2)*Math.PI)*.18;}
      if(!missionState&&beat===2){const q=Math.min(1,t/1.7);order.position.set(-4.1+8.3*q,1.7+Math.sin(q*Math.PI)*1.7,.1-.5*q);order.rotation.y=q*.7;}
      if(!missionState&&beat===3){const q=Math.min(1,t/1.65);reply.position.set(4.2-8.1*q,2.2+Math.sin(q*Math.PI)*.7,.4);const flash=q>.43&&q<.63;bolt.visible=flash;reply.visible=q<.56;stormLight.intensity=flash?8:0;}
      if(!missionState&&beat===4){duplicateGear.scale.setScalar(.92+Math.sin(time/190)*.07);}
      if(beat===5){echoRing.visible=true;const pulse=.35+(Math.sin(time/420)+1)*.18;echoRing.scale.setScalar(pulse);echoRing.material.opacity=.25+(Math.sin(time/420)+1)*.13;}
      if(missionState?.complete){beacons[1].lamp.scale.setScalar(1+Math.sin(time/300)*.12);}
    }
  });
  function requestDraw(){runtime.requestDraw();}
  host.classList.add('rgi-has-three');
  if(mode==='mission')applyMissionState({});else applyBeat(0);
  return{
    available:true,
    setBeat(index){applyBeat(index);},
    setMissionState(state){applyMissionState(state);},
    replay(){beatStart=performance.now();missionState?applyMissionState(missionState):applyBeat(beat);},
    setPaused(value){runtime.setPaused(value);},
    stats(){return{...runtime.stats(),beat,mode};},
    dispose(){runtime.dispose();host.classList.remove('rgi-has-three','rgc1-three-ready','rgc1-three-failed');storyOverlay?.classList.remove('rgi-three-ready','rgi-three-failed');}
  };
}
