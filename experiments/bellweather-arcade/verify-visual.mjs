import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const out='../../artifacts/bellweather-arcade';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11','--use-gl=angle','--enable-gpu','--ignore-gpu-blocklist']});
const issues=[];
try {
  const page=await browser.newPage({viewport:{width:1102,height:828}});
  page.on('pageerror',e=>issues.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')issues.push(`${m.type()}: ${m.text()}`)});
  await page.goto('http://127.0.0.1:8062/',{waitUntil:'load'});
  await page.waitForFunction(()=>Boolean(window.__arcade));
  await page.waitForTimeout(400);
  const read=()=>page.evaluate(()=>window.__arcade.snapshot());
  const start=await read();
  await page.screenshot({path:`${out}/repair1-batched-arrival.png`});
  await page.locator('#route').click();
  await page.waitForFunction(()=>window.__arcade.snapshot().routeT>.92,null,{timeout:25000});
  await page.waitForFunction(()=>!window.__arcade.snapshot().guided,null,{timeout:5000});
  const arrived=await read();
  await page.screenshot({path:`${out}/repair1-batched-overlook.png`});
  await page.mouse.move(630,420);await page.mouse.down();await page.mouse.move(820,425,{steps:8});await page.mouse.up();
  await page.waitForTimeout(250);
  const orbited=await read();
  await page.screenshot({path:`${out}/repair1-batched-overlook-orbit.png`});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);
  await page.screenshot({path:`${out}/repair1-batched-phone-overlook.png`});
  const phone=await read();
  if(arrived.routeT<.93||arrived.guided)throw Error(`Route did not finish: ${JSON.stringify(arrived)}`);
  if(orbited.camera.join(',')===arrived.camera.join(','))throw Error('Orbit did not move camera');
  if(issues.length)throw Error(issues.join(' | '));
  const sample={start,arrived,orbited,phone,issues};
  await fs.writeFile(`${out}/repair1-batched-smoke.json`,JSON.stringify(sample,null,2));
  console.log(JSON.stringify({passed:true,start:{routeT:start.routeT,frames:start.frames,draws:start.draws,triangles:start.triangles,cameraSolids:start.cameraSolids},arrived:{routeT:arrived.routeT,frames:arrived.frames,draws:arrived.draws,triangles:arrived.triangles},phone:{draws:phone.draws,triangles:phone.triangles},issues},null,2));
} finally {await browser.close()}
