import { chromium } from 'playwright';
import fs from 'node:fs/promises';

// Run only after the atelier build is frozen and the native review tab is paused.
// Both variants use the same viewport, actions, capture points and browser process.
const out='../../artifacts/bellweather-arcade';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11','--use-gl=angle','--enable-gpu','--ignore-gpu-blocklist']});
const variants=[
  {name:'current',url:'http://127.0.0.1:8062/?study=facade&portal=crafted'},
  {name:'atelier',url:'http://127.0.0.1:8062/?study=facade&portal=crafted&architecture=atelier'},
];
const craftedManifest=JSON.parse(await fs.readFile(new URL('./public/crafted-portal/portal.json',import.meta.url),'utf8'));
const pace=page=>page.evaluate(async()=>{
  const intervals=[];const start=window.__arcade.snapshot().frames;
  await new Promise(resolve=>{const end=performance.now()+1250;let previous=0;function step(t){if(previous)intervals.push(t-previous);previous=t;if(t<end)requestAnimationFrame(step);else resolve()}requestAnimationFrame(step)});
  intervals.sort((a,b)=>a-b);
  return {sampleMs:1250,rafCount:intervals.length,appFrames:window.__arcade.snapshot().frames-start,medianMs:intervals[Math.floor(intervals.length*.5)]??null,p95Ms:intervals[Math.floor(intervals.length*.95)]??null};
});
const horizontalDistance=(a,b)=>Math.hypot(a.position[0]-b.position[0],a.position[2]-b.position[2]);

async function runVariant(spec){
  const context=await browser.newContext({viewport:{width:1102,height:828},deviceScaleFactor:1});
  const page=await context.newPage(),issues=[],driverWarnings=[],assets=[];
  let stage='load';
  try {
    page.on('pageerror',error=>issues.push(`pageerror: ${error.message}`));
    page.on('console',message=>{
      if(!['warning','error'].includes(message.type()))return;
      const messageText=message.text();
      if(message.type()==='warning'&&messageText.includes('THREE.WebGLProgram')&&messageText.includes('warning X4122'))driverWarnings.push(messageText);
      else issues.push(`${message.type()}: ${messageText}`);
    });
    page.on('requestfailed',request=>issues.push(`requestfailed: ${request.url()} ${request.failure()?.errorText??''}`));
    page.on('response',response=>{
      const url=response.url(),type=response.request().resourceType();
      if(['image','fetch','xhr'].includes(type)||url.includes('/crafted-portal/')||url.includes('/materials/'))assets.push({url,status:response.status(),type});
      if(response.status()>=400)issues.push(`HTTP ${response.status()}: ${url}`);
    });
    const snap=()=>page.evaluate(()=>window.__arcade.snapshot());
    const walk=async(key,ms)=>{await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);await page.waitForTimeout(80);return snap()};
    const restart=async()=>{if(!(await snap()).paused)await page.keyboard.press('Escape');await page.locator('#restart').click();await page.waitForTimeout(100);return snap()};
    const capture=async(name)=>page.screenshot({path:`${out}/atelier-ab-${spec.name}-${name}.png`});
    await page.goto(spec.url,{waitUntil:'load'});
    await page.waitForFunction(()=>Boolean(window.__arcade)&&document.querySelector('#loading')?.hidden,null,{timeout:30000});
    const device=await page.evaluate(()=>{const gl=document.querySelector('canvas')?.getContext('webgl2'),ext=gl?.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,renderer:gl&&ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl?.getParameter(gl.RENDERER)??'unavailable',viewport:[innerWidth,innerHeight],dpr:devicePixelRatio}});
    const arrival=await snap();if(arrival.study!=='facade'||arrival.routeT>.01)throw Error(`Wrong study/arrival: ${JSON.stringify(arrival)}`);
    await page.waitForTimeout(250);
    const idlePacing=await pace(page),idle=await snap();await capture('arrival');

    stage='active approach';
    await page.keyboard.down('w');const activePacing=await pace(page);await page.keyboard.up('w');await page.waitForTimeout(100);
    const approach=await snap();if(approach.routeT<=arrival.routeT)throw Error(`W did not advance: ${JSON.stringify({arrival,approach})}`);
    await capture('approach');
    await page.mouse.move(640,420);await page.mouse.down();await page.mouse.move(810,450,{steps:10});await page.mouse.up();await page.waitForTimeout(300);
    const oblique=await snap();if(oblique.camera.join(',')===approach.camera.join(','))throw Error('Camera orbit did not move');
    await capture('oblique');
    await restart();

    stage='portal jamb';
    await walk('w',1700);const jambLateral=await walk('a',800);
    // Both variants retain the crafted portal and its geometry-derived jambs.
    // Recheck this assumption against the frozen atelier source before running.
    const leftJamb=craftedManifest.colliders[0];
    const jambWorldMinX=leftJamb.minX+craftedManifest.placement.x;
    const jambWorldMaxX=leftJamb.maxX+craftedManifest.placement.x;
    if(jambLateral.position[0]<-1.70||jambLateral.position[0]<jambWorldMinX||jambLateral.position[0]>jambWorldMaxX)throw Error(`Jamb probe X missed the opening edge: ${JSON.stringify({jambLateral,jambWorldMinX,jambWorldMaxX})}`);
    const jambFirst=await walk('w',2200),jamb=await walk('w',500);
    const jambFront=craftedManifest.placement.z+leftJamb.maxZ+.34;
    if(Math.abs(jamb.position[2]-jambFront)>.22||Math.abs(jamb.position[2]-jambFirst.position[2])>.08)throw Error(`Jamb contact differs from collider: ${JSON.stringify({jambLateral,jambFirst,jamb,jambFront})}`);
    await capture('jamb');
    await restart();

    stage='near-wall camera';
    await walk('w',1700);await walk('a',1300);const wall=await walk('w',1600);
    await page.mouse.move(850,430);await page.mouse.down();await page.mouse.move(100,440,{steps:12});await page.mouse.up();await page.waitForTimeout(400);
    const wallOrbit=await snap(),cameraDistance=Math.hypot(wallOrbit.camera[0]-wallOrbit.position[0],wallOrbit.camera[1]-wallOrbit.position[1]-1.5,wallOrbit.camera[2]-wallOrbit.position[2]);
    if(cameraDistance<2.4)throw Error(`Near-wall camera collapsed: ${JSON.stringify({wallOrbit,cameraDistance})}`);
    await capture('wall-orbit');
    const wallPacing=await pace(page);
    await restart();

    stage='aperture passage';
    const through=await walk('w',5400);if(through.position[2]>-5.3)throw Error(`Aperture blocked: ${JSON.stringify(through)}`);
    await capture('inside');
    const returned=await walk('s',4700);if(returned.position[2]<-1.5)throw Error(`Return blocked: ${JSON.stringify(returned)}`);
    await capture('return');
    await page.keyboard.press('Escape');const paused=await snap();await page.waitForTimeout(350);const pausedAfter=await snap();
    if(!paused.paused||pausedAfter.frames!==paused.frames||horizontalDistance(pausedAfter,paused)>.001)throw Error('Pause did not freeze the study');
    const reset=await restart();if(reset.paused||reset.routeT>.01)throw Error('Restart did not restore arrival');

    stage='portrait';
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);
    const phone=await snap();
    const layout=await page.evaluate(()=>{const ids=['controls','route','place','pause'];const rects={};for(const id of ids){const r=document.getElementById(id).getBoundingClientRect();rects[id]={left:r.left,top:r.top,right:r.right,bottom:r.bottom}}return {width:innerWidth,height:innerHeight,rects,overflowX:document.documentElement.scrollWidth>innerWidth}});
    if(layout.overflowX||Object.values(layout.rects).some(r=>r.left<0||r.right>390||r.top<0||r.bottom>844))throw Error(`Portrait controls out of bounds: ${JSON.stringify(layout)}`);
    await capture('phone');
    for(const filename of ['sandstone_cracks_nor_gl_1k.jpg','sandstone_cracks_rough_1k.jpg']){
      if(!assets.some(asset=>asset.url.endsWith(filename)&&asset.status===200))issues.push(`material image did not load: ${filename}`);
    }
    for(const filename of ['portal.json','sunward-portal.glb']){
      if(!assets.some(asset=>asset.url.endsWith('/crafted-portal/'+filename)&&asset.status===200))issues.push(`crafted portal asset did not load: ${filename}`);
    }
    if(spec.name==='atelier')for(const filename of ['atelier.json','sunward-atelier.glb','sunward-atelier-camera.glb']){
      if(!assets.some(asset=>asset.url.endsWith('/atelier/'+filename)&&asset.status===200))issues.push(`atelier asset did not load: ${filename}`);
    }
    if(issues.length)throw Error(`Runtime/resource issues: ${issues.join(' | ')}`);
    return {name:spec.name,url:spec.url,device,arrival,idle,idlePacing,approach,activePacing,oblique,jambLateral,jambFirst,jamb,jambFront,wall,wallOrbit,cameraDistance,wallPacing,through,returned,paused,pausedAfter,reset,phone,layout,assets,issues,driverWarnings};
  } catch(error){throw new Error(`${spec.name} failed at ${stage}: ${error.message}`,{cause:error})}
  finally {await context.close()}
}

try {
  const current=await runVariant(variants[0]);
  const atelier=await runVariant(variants[1]);
  const comparison={passed:true,current,atelier,matchedViewport:JSON.stringify(current.device.viewport)===JSON.stringify(atelier.device.viewport),arrivalDifference:horizontalDistance(current.arrival,atelier.arrival),approachDifference:horizontalDistance(current.approach,atelier.approach),throughDifference:horizontalDistance(current.through,atelier.through)};
  if(!comparison.matchedViewport||comparison.arrivalDifference>.01||comparison.throughDifference>.6)throw Error(`Variants diverged spatially: ${JSON.stringify({matchedViewport:comparison.matchedViewport,arrivalDifference:comparison.arrivalDifference,throughDifference:comparison.throughDifference})}`);
  await fs.writeFile(`${out}/atelier-ab-engineering.json`,JSON.stringify(comparison,null,2));
  console.log(JSON.stringify({passed:true,device:current.device,current:{arrivalCalls:current.idle.draws,arrivalTriangles:current.idle.triangles,idlePacing:current.idlePacing,activePacing:current.activePacing,wallPacing:current.wallPacing,wallCameraDistance:current.cameraDistance},atelier:{arrivalCalls:atelier.idle.draws,arrivalTriangles:atelier.idle.triangles,idlePacing:atelier.idlePacing,activePacing:atelier.activePacing,wallPacing:atelier.wallPacing,wallCameraDistance:atelier.cameraDistance},arrivalDifference:comparison.arrivalDifference,approachDifference:comparison.approachDifference,throughDifference:comparison.throughDifference,currentAssets:current.assets,atelierAssets:atelier.assets},null,2));
} finally {await browser.close()}
