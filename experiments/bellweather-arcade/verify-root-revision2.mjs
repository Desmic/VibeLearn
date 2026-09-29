import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const out='../../artifacts/bellweather-arcade';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11','--use-gl=angle','--enable-gpu','--ignore-gpu-blocklist']});
const issues=[],driverWarnings=[];
try {
  const context=await browser.newContext({viewport:{width:1102,height:828}});
  const page=await context.newPage();
  page.on('pageerror',error=>issues.push(`pageerror: ${error.message}`));
  page.on('console',message=>{if(!['warning','error'].includes(message.type()))return;const text=message.text();if(message.type()==='warning'&&text.includes('THREE.WebGLProgram')&&text.includes('warning X4122'))driverWarnings.push(text);else issues.push(`${message.type()}: ${text}`)});
  await page.goto('http://127.0.0.1:8062/',{waitUntil:'load'});
  await page.waitForFunction(()=>Boolean(window.__arcade));
  const snap=()=>page.evaluate(()=>window.__arcade.snapshot());
  const pace=()=>page.evaluate(async()=>{
    const times=[];const start=window.__arcade.snapshot().frames;
    await new Promise(resolve=>{
      const end=performance.now()+1250;let previous=0;
      function step(t){if(previous)times.push(t-previous);previous=t;if(t<end)requestAnimationFrame(step);else resolve()}
      requestAnimationFrame(step);
    });
    times.sort((a,b)=>a-b);
    return {sampleMs:1250,rafCount:times.length,appFrames:window.__arcade.snapshot().frames-start,medianMs:times[Math.floor(times.length*.5)]??null,p95Ms:times[Math.floor(times.length*.95)]??null};
  });
  const device=await page.evaluate(()=>{const canvas=document.querySelector('canvas');const gl=canvas?.getContext('webgl2');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,renderer:gl&&ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl?.getParameter(gl.RENDERER)??'unavailable',viewport:[innerWidth,innerHeight],dpr:devicePixelRatio}});
  await page.waitForTimeout(200);
  const arrival=await snap(),arrivalPacing=await pace();
  await page.screenshot({path:`${out}/root-revision2-clearance-arrival.png`});
  await page.keyboard.down('w');await page.waitForTimeout(550);await page.keyboard.up('w');
  const manual=await snap();if(manual.routeT<=arrival.routeT)throw Error(`W did not advance: ${JSON.stringify({arrival,manual})}`);
  const cameraBefore=manual.camera;
  await page.mouse.move(640,420);await page.mouse.down();await page.mouse.move(790,440,{steps:7});await page.mouse.up();await page.waitForTimeout(150);
  const cameraAfter=(await snap()).camera;if(cameraAfter.join(',')===cameraBefore.join(','))throw Error('Camera orbit did not move');
  await page.keyboard.press('Escape');const paused=await snap();
  await page.keyboard.down('w');await page.waitForTimeout(350);await page.keyboard.up('w');const pausedAfter=await snap();
  if(!pausedAfter.paused||pausedAfter.frames!==paused.frames||pausedAfter.routeT!==paused.routeT)throw Error(`Pause failed: ${JSON.stringify({paused,pausedAfter})}`);
  await page.locator('#resume').click();
  await page.locator('#route').click();
  await page.waitForFunction(()=>window.__arcade.snapshot().routeT>.92,null,{timeout:28000});
  await page.waitForFunction(()=>!window.__arcade.snapshot().guided,null,{timeout:5000});
  const overlook=await snap(),overlookPacing=await pace();
  await page.screenshot({path:`${out}/root-revision2-clearance-overlook.png`});
  if(overlook.routeT<.93||overlook.paused)throw Error(`Overlook was not reached: ${JSON.stringify(overlook)}`);
  await page.locator('#route').click();await page.waitForTimeout(550);
  const returning=await snap();if(returning.routeT>=overlook.routeT||returning.guideTargetT!==0)throw Error(`Return route failed: ${JSON.stringify({overlook,returning})}`);
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);
  const phone=await snap(),phonePacing=await pace();
  const layout=await page.evaluate(()=>{const ids=['controls','route','place','pause'];const rects={};for(const id of ids){const r=document.getElementById(id).getBoundingClientRect();rects[id]={left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}}return {viewport:[innerWidth,innerHeight],rects,overflowX:document.documentElement.scrollWidth>innerWidth}});
  await page.screenshot({path:`${out}/root-revision2-clearance-phone.png`});
  if(layout.overflowX||Object.values(layout.rects).some(r=>r.left<0||r.right>390||r.top<0||r.bottom>844))throw Error(`Phone controls leave viewport: ${JSON.stringify(layout)}`);
  await page.keyboard.press('Escape');await page.locator('#restart').click();const restarted=await snap();
  if(restarted.routeT>.01||restarted.guided||restarted.paused)throw Error(`Restart failed: ${JSON.stringify(restarted)}`);
  // This checks a real tab switch only if the browser reports the first tab hidden.
  const second=await context.newPage();await second.goto('about:blank');await second.bringToFront();
  const hiddenReported=await page.evaluate(()=>document.hidden);let actualHidden=null;
  if(hiddenReported){const before=await snap();await page.waitForTimeout(350);const after=await snap();actualHidden={reported:true,framesBefore:before.frames,framesAfter:after.frames};if(after.frames!==before.frames)throw Error(`Background tab kept rendering: ${JSON.stringify(actualHidden)}`)}
  else actualHidden={reported:false,assessed:false};
  await page.bringToFront();await second.close();
  if(issues.length)throw Error(`Browser console/runtime issues: ${issues.join(' | ')}`);
  const result={passed:true,device,arrival,arrivalPacing,manual,cameraAfter,paused,pausedAfter,overlook,overlookPacing,returning,phone,phonePacing,layout,restarted,actualHidden,issues,driverWarnings};
  await fs.writeFile(`${out}/root-revision2-clearance-engineering.json`,JSON.stringify(result,null,2));
  console.log(JSON.stringify({passed:true,device,arrival:{draws:arrival.draws,triangles:arrival.triangles,cameraSolids:arrival.cameraSolids},arrivalPacing,overlook:{routeT:overlook.routeT,draws:overlook.draws,triangles:overlook.triangles},overlookPacing,phone:{draws:phone.draws,triangles:phone.triangles},phonePacing,actualHidden,issues,driverWarningCount:driverWarnings.length},null,2));
} finally {await browser.close()}
