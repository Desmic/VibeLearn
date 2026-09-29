import {chromium} from 'playwright';
import fs from 'node:fs/promises';

const base='http://127.0.0.1:8062/?study=facade&portal=crafted&architecture=atelier&finish=daylight&palette=ceramic&form=swept-clean';
const variants=[{name:'off',url:base+'&cameraCache=off'},{name:'on',url:base}];
const out='../../artifacts/bellweather-arcade';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11','--use-gl=angle','--enable-gpu','--ignore-gpu-blocklist']});
const poses=[
  [1,7,0,.2,6], [1,2.8,.7,.2,6], [-1.8,-1.16,0,.2,6],
  [-1.8,-1.16,2.5,.3,6], [1,-5,-1.5,.4,5], [4,-2,1.8,.7,7],
];
const difference=(a,b)=>Math.max(...a.map((value,index)=>Math.abs(value-b[index])));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function run(spec,runIndex){
  const context=await browser.newContext({viewport:{width:1102,height:828},deviceScaleFactor:1});
  const page=await context.newPage(),issues=[],driverWarnings=[],assets=[];
  try {
    page.on('pageerror',error=>issues.push(`pageerror: ${error.message}`));
    page.on('console',message=>{if(!['warning','error'].includes(message.type()))return;
      const value=message.text();if(message.type()==='warning'&&value.includes('THREE.WebGLProgram')&&value.includes('warning X4122'))driverWarnings.push(value);
      else issues.push(`${message.type()}: ${value}`)});
    page.on('requestfailed',request=>issues.push(`requestfailed: ${request.url()}`));
    page.on('response',response=>{const url=response.url();if(url.includes('/crafted-portal/'))assets.push({url,status:response.status()});if(response.status()>=400)issues.push(`HTTP ${response.status()}: ${url}`)});
    await page.goto(spec.url,{waitUntil:'load'});
    await page.waitForFunction(()=>Boolean(window.__arcade)&&document.querySelector('#loading')?.hidden,null,{timeout:30000});
    const snap=()=>page.evaluate(()=>window.__arcade.snapshot());
    const arrival=await snap();
    if(arrival.study!=='facade')throw Error('Wrong study');
    const probes=await page.evaluate(poseList=>poseList.map(pose=>window.__arcade.probeCamera(...pose)),poses);
    const walk=async(key,ms)=>{await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);await page.waitForTimeout(80)};
    await walk('w',1700);await walk('a',1300);await walk('w',1600);
    await page.mouse.move(850,430);await page.mouse.down();await page.mouse.move(100,440,{steps:12});await page.mouse.up();
    await page.waitForTimeout(400);
    const wall=await snap();
    const cameraDistance=Math.hypot(wall.camera[0]-wall.position[0],wall.camera[1]-wall.position[1]-1.5,wall.camera[2]-wall.position[2]);
    if(cameraDistance<2.4)throw Error(`Camera collapsed: ${cameraDistance}`);
    await page.screenshot({path:`${out}/camera-cache-${runIndex}-${spec.name}-wall.png`});
    const samples=[];
    for(let sample=0;sample<2;sample++){
      const before=await snap();
      const pacing=await page.evaluate(async()=>{const intervals=[];await new Promise(resolve=>{const end=performance.now()+1250;let previous=0;function step(t){if(previous)intervals.push(t-previous);previous=t;if(t<end)requestAnimationFrame(step);else resolve()}requestAnimationFrame(step)});intervals.sort((a,b)=>a-b);return {count:intervals.length,medianMs:intervals[Math.floor(intervals.length/2)],p95Ms:intervals[Math.floor(intervals.length*.95)]}});
      const after=await snap(),metrics={};for(const key of Object.keys(after.cameraMetrics))metrics[key]=after.cameraMetrics[key]-before.cameraMetrics[key];
      samples.push({pacing,appFrames:after.frames-before.frames,metrics,position:after.position,camera:after.camera});
    }
    let interaction=null,invalidation=null;
    if(runIndex<2){
      await page.keyboard.press('Escape');const paused=await snap();await page.waitForTimeout(250);const still=await snap();
      if(!paused.paused||paused.frames!==still.frames)throw Error('Pause did not freeze');
      await page.locator('#restart').click();const reset=await snap();if(reset.paused||reset.routeT>.01)throw Error('Restart failed');
      interaction={paused,still,reset};
      if(spec.name==='on'){
        const pose=[-1.8,-1.16,0,.2,6];
        const step=async()=>{const a=(await snap()).cameraMetrics;await page.evaluate(p=>window.__arcade.probeCamera(...p),pose);const b=(await snap()).cameraMetrics;return b.queries-a.queries};
        const first=await step(),reused=await step();await page.evaluate(()=>window.__arcade.invalidateCameraGeometry());const refreshed=await step();
        if(!(first>reused&&refreshed>reused))throw Error(`Geometry invalidation failed: ${JSON.stringify({first,reused,refreshed})}`);
        invalidation={first,reused,refreshed};
      }
    }
    if(!assets.some(a=>a.url.endsWith('/portal-swept-clean.json')&&a.status===200)||!assets.some(a=>a.url.endsWith('/sunward-portal-swept-clean.glb')&&a.status===200))throw Error('Clean portal assets missing');
    if(issues.length)throw Error(issues.join(' | '));
    return {spec,runIndex,arrival,probes,wall,cameraDistance,samples,interaction,invalidation,assets,issues,driverWarnings};
  } finally {await context.close()}
}
try {
  const runs=[];
  for(const index of [0,1,1,0])runs.push(await run(variants[index],runs.length));
  for(let i=0;i<poses.length;i++){
    const off=runs[0].probes[i],on=runs[1].probes[i];
    if(difference(off.camera,on.camera)>1e-6||Math.abs(off.moveYaw-on.moveYaw)>1e-6)throw Error(`Camera pose mismatch at probe ${i}: ${JSON.stringify({off,on})}`);
  }
  if(difference(runs[0].wall.position,runs[1].wall.position)>.25)throw Error('Near-wall positions diverged too far for matched sample');
  const result={passed:true,poses,runs};
  await fs.writeFile(`${out}/camera-cache-comparison.json`,JSON.stringify(result,null,2));
  console.log(JSON.stringify({passed:true,bundle:'index-BtbqVomh.js',poseComparisons:poses.length,
    runs:runs.map(r=>({name:r.spec.name,wallPosition:r.wall.position,cameraDistance:r.cameraDistance,
      samples:r.samples.map(s=>({frames:s.appFrames,medianFrameMs:s.pacing.medianMs,cameraMsPerUpdate:s.metrics.updateMs/s.metrics.updates,queriesPerUpdate:s.metrics.queries/s.metrics.updates,searches:s.metrics.searches}))})),invalidation:runs[1].invalidation},null,2));
} finally {await browser.close()}
