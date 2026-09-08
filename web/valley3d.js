/* Optional Three.js interaction spike. Rendering never decides evidence or success. */
import * as THREE from './vendor/three.module.min.js';

export function createValley() {
  const canvas = document.createElement('canvas');
  canvas.className = 'valley-canvas';
  canvas.setAttribute('aria-label', 'Interactive valley. Select the post, Pip, journal, clock, register, or gear. The same actions are available as buttons below.');
  canvas.setAttribute('role', 'img');
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: false, powerPreference: 'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x112e40); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x112e40, 30, 70);
  const camera = new THREE.OrthographicCamera(-12, 12, 8, -8, .1, 100);
  camera.position.set(15, 16, 22); camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xd9f3ed, 0x243b45, 2.4));
  const sun = new THREE.DirectionalLight(0xffddb0, 3.2); sun.position.set(-8, 15, 7); scene.add(sun);
  const materials = new Set(), geometries = new Set(), objects = [];
  let state = {}, host, onAction, frame = 0, disposed = false, lost = false, locked = false, previousMoves = -1;
  let animateUntil = 0, animationStart = 0, active = '', focusedObject = null;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = new THREE.Vector2(), ray = new THREE.Raycaster();
  const geometry = value => (geometries.add(value), value);
  const material = color => {
    const value = new THREE.MeshStandardMaterial({color, roughness: .85, metalness: .05});
    materials.add(value); return value;
  };
  const box = geometry(new THREE.BoxGeometry(1, 1, 1));
  const cylinder = geometry(new THREE.CylinderGeometry(1, 1, 1, 12));
  const sphere = geometry(new THREE.SphereGeometry(1, 12, 8));
  const cone = geometry(new THREE.ConeGeometry(1, 1, 6));
  const colors = {grass:material(0x678e77), rock:material(0x3a5058), wood:material(0x9f7450), paper:material(0xffe0a0), pip:material(0xeabc78), dark:material(0x1c4149), red:material(0xc96850), glass:material(0xa7f1e1)};
  function mesh(parent, shape, mat, x, y, z, sx, sy, sz) {
    const m = new THREE.Mesh(shape, mat); m.position.set(x,y,z); m.scale.set(sx,sy,sz); parent.add(m); return m;
  }
  function group(name,x,y,z,resolve) {
    const g = new THREE.Group(); g.name = name; g.position.set(x,y,z); scene.add(g);
    if (resolve) { g.userData.resolve = resolve; objects.push(g); }
    return g;
  }
  // Small authored diorama, not an expensive open world or an imported asset pack.
  for (const x of [-6,6]) {
    mesh(scene,box,colors.rock,x,-1.6,0,8,3,8);
    mesh(scene,box,colors.grass,x,0,0,8,.35,8);
  }
  mesh(scene,box,material(0x3b858e),0,-2.8,0,4,.2,19);
  for (let i=0;i<9;i++) {
    const x = (i-4)*3.4, z=-7-(i%3), height=3+(i%4);
    mesh(scene,cone,colors.rock,x,height/2-1,z,3,height,3);
  }
  for (const [x,z] of [[-8,-2],[-7,2],[-9,0],[8,-3],[9,2],[5,-3]]) {
    mesh(scene,cylinder,colors.wood,x,.8,z,.12,1.6,.12);
    mesh(scene,cone,colors.grass,x,2,z,.9,2.5,.9);
  }
  const workshop=group('Workshop',6,0,-1);
  mesh(workshop,box,material(0xbc9d78),0,1,0,2.5,2,2.4);
  const roof=mesh(workshop,cone,colors.dark,0,2.5,0,2.05,1.3,2.05); roof.rotation.y=Math.PI/4;
  mesh(workshop,box,colors.glass,-.7,1,1.23,.55,.7,.05);
  mesh(workshop,box,colors.dark,.4,.65,1.23,.65,1.3,.05);
  const pip=group('Pip',-5,.3,1,s=>s.available?.includes('restart')?'restart':null);
  mesh(pip,box,colors.pip,0,.6,0,.75,.8,.55);
  mesh(pip,box,colors.pip,0,1.3,0,1,.7,.65);
  mesh(pip,box,colors.dark,0,1.33,.34,.85,.4,.05);
  for (const x of [-.22,.22]) mesh(pip,sphere,colors.glass,x,1.35,.4,.06,.06,.04);
  mesh(pip,box,colors.red,0,.96,0,.88,.12,.7);
  for (const x of [-.28,.28]) mesh(pip,box,colors.pip,x,.03,0,.22,.4,.3);
  mesh(pip,cylinder,colors.pip,0,1.9,0,.025,.5,.025);
  mesh(pip,sphere,colors.glass,0,2.15,0,.09,.09,.09);
  const post=group('Send post',-3,.2,-1,s=>['send','retry'].find(a=>s.available?.includes(a)));
  mesh(post,box,colors.wood,0,.65,0,.2,1.3,.2);
  mesh(post,box,colors.paper,0,1.45,0,.85,.6,.2);
  const journal=group('Journal',-7,.3,1.2,s=>s.available?.includes('restore')?'restore':null);
  mesh(journal,box,colors.wood,0,.08,0,1.2,.25,.85);
  mesh(journal,box,colors.paper,0,.23,0,1.08,.06,.75);
  const clock=group('Memory clock',-6,.3,-2,s=>s.available?.includes('wait')?'wait':null);
  const dial=mesh(clock,cylinder,colors.paper,0,.8,0,.6,.2,.6); dial.rotation.x=Math.PI/2;
  mesh(clock,box,colors.dark,0,.95,.15,.06,.35,.03);
  mesh(clock,box,colors.wood,0,.2,0,.2,.5,.2);
  const register=group('Order register',8,.3,1,s=>s.available?.includes('inspect')?'inspect':null);
  mesh(register,box,colors.wood,0,.4,0,1,.8,.7);
  for (let i=0;i<3;i++)mesh(register,box,colors.paper,0,.3+i*.2,.36,.75,.07,.04);
  const ticket=group('New ticket press',-8,.3,-.4,s=>s.available?.includes('new_ticket')?'new_ticket':null);
  mesh(ticket,cylinder,colors.red,0,.25,0,.45,.5,.45);
  mesh(ticket,box,colors.paper,0,.54,0,.6,.05,.45);
  const gearGroup=group('Gear',4.5,.4,2,s=>s.available?.includes('collect')?'collect':null);
  const gears=[];
  for(let i=0;i<2;i++) {
    const g=new THREE.Group(); g.position.set(i*1.1,0,0); gearGroup.add(g);
    const ring=geometry(new THREE.TorusGeometry(.35,.13,8,12));
    mesh(g,ring,colors.pip,0,.4,0,1,1,1);
    for(let j=0;j<8;j++) {
      const t=j*Math.PI/4;
      const tooth=mesh(g,box,colors.pip,Math.sin(t)*.45,.4+Math.cos(t)*.45,0,.17,.2,.2);tooth.rotation.z=-t;
    }
    gears.push(g);
  }
  const bridge = new THREE.Group(); scene.add(bridge);
  for(let i=0;i<11;i++) mesh(bridge,box,colors.wood,-2+i*.4,.22,1,.34,.15,1.25);
  for(const x of [-2.2,2.2])mesh(scene,box,colors.wood,x,.6,1,.13,1.3,1.5);
  const letter=mesh(scene,box,colors.paper,-3,1.6,-1,.6,.38,.06);letter.visible=false;
  const hitMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});materials.add(hitMaterial);
  for(const object of objects)mesh(object,sphere,hitMaterial,0,.6,0,.7,.8,.7);
  const label=document.createElement('p');label.className='valley-pick-label';label.setAttribute('role','status');
  function allowed(g){return !locked && !state.submitted ? g?.userData.resolve(state) : null;}
  function draw(time=performance.now()) {
    frame=0;if(disposed||document.hidden||!host?.isConnected)return;
    const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
    if(canvas.width!==Math.round(width*renderer.getPixelRatio())||canvas.height!==Math.round(height*renderer.getPixelRatio()))renderer.setSize(width,height,false);
    const aspect=width/height, h=aspect<1.4?12:8.6;
    camera.left=-h*aspect;camera.right=h*aspect;camera.top=h;camera.bottom=-h;camera.updateProjectionMatrix();
    if(time<animateUntil&&!motion.matches) {
      const t=Math.min(1,(time-animationStart)/700);
      letter.visible=active==='send'||active==='retry';
      letter.position.set(-3+9*t,1.6+Math.sin(t*Math.PI)*1.5,-1);
      pip.rotation.y=active==='collect'?Math.sin(t*Math.PI)*.25:0;
      frame=requestAnimationFrame(draw);
    }else {letter.visible=false;pip.rotation.y=0;}
    renderer.render(scene,camera);
  }
  function requestDraw(){if(!frame&&!disposed)frame=requestAnimationFrame(draw);}
  function locate(event) {
    const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);
    ray.setFromCamera(pointer,camera);
    for(const hit of ray.intersectObjects(objects,true)) {
      let g=hit.object;while(g&&!objects.includes(g))g=g.parent;
      if(allowed(g))return g;
    }
    return null;
  }
  function hover(event) {
    const g=locate(event);canvas.style.cursor=g?'pointer':'default';
    if(focusedObject!==g) {
      focusedObject?.traverse(n=>{if(n.isMesh)n.scale.multiplyScalar(1/1.03);});
      g?.traverse(n=>{if(n.isMesh)n.scale.multiplyScalar(1.03);});focusedObject=g;
      label.textContent=g?`${g.name} · ${allowed(g).replaceAll('_',' ')}`:'Select an object in the valley, or use the equivalent action buttons.';requestDraw();
    }
  }
  function pick(event){const g=locate(event);const action=allowed(g);if(action)onAction(action);}
  function fallback(event) {
    event.preventDefault();lost=true;locked=true;cancelAnimationFrame(frame);frame=0;
    host?.classList.remove('has-three');label.textContent='3D paused. The illustrated scene and action buttons remain playable.';
    canvas.hidden=true;host?.dispatchEvent(new CustomEvent('valley:fallback',{bubbles:true}));
  }
  canvas.addEventListener('pointermove',hover);canvas.addEventListener('pointerup',pick);
  canvas.addEventListener('webglcontextlost',fallback);
  const resize=new ResizeObserver(requestDraw);resize.observe(canvas);
  document.addEventListener('visibilitychange',requestDraw);motion.addEventListener('change',requestDraw);
  return {
    mount(nextHost,nextState,action) {
      host=nextHost;state=nextState;onAction=action;locked=false;
      if(lost){host.append(label);label.textContent='3D paused. Continue with the illustrated scene and action buttons.';return;}
      host.prepend(canvas);host.append(label);host.classList.add('has-three');canvas.hidden=false;
      gears.forEach((g,i)=>g.visible=i<(state.parts||0));
      bridge.visible=Boolean(state.submitted&&state.complete&&(state.level===4||state.level===5));
      pip.position.x=bridge.visible?2.2:-5;
      const actionName=state.trail?.at(-1)?.action;
      if(previousMoves>=0&&state.moves>previousMoves&&['send','retry','collect'].includes(actionName)) {
        active=actionName;animationStart=performance.now();animateUntil=animationStart+700;
      }
      previousMoves=state.moves;
      label.textContent='Select an object in the valley, or use the equivalent action buttons.';requestDraw();
    },
    setBusy(value){locked=value || lost;},
    stats(){return {revision:THREE.REVISION,drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,pixelRatio:renderer.getPixelRatio(),contextLost:lost};},
    // Project the actual object center for deterministic tests; never a model command API.
    screenPoint(name) {
      const g=objects.find(o=>o.name===name);if(!g)throw new Error('Unknown scene object');
      const p=g.getWorldPosition(new THREE.Vector3());p.y+=.6;p.project(camera);
      const r=canvas.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};
    },
    dispose() {
      disposed=true;cancelAnimationFrame(frame);resize.disconnect();
      canvas.removeEventListener('pointermove',hover);canvas.removeEventListener('pointerup',pick);canvas.removeEventListener('webglcontextlost',fallback);
      document.removeEventListener('visibilitychange',requestDraw);motion.removeEventListener('change',requestDraw);
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();canvas.remove();label.remove();
    }
  };
}
