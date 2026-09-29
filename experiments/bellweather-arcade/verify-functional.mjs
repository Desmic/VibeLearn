import { chromium } from 'playwright';

const browser = await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11','--use-gl=angle','--enable-gpu','--ignore-gpu-blocklist']});
const warnings=[];
try {
  const page=await browser.newPage({viewport:{width:1102,height:828}});
  page.on('console',message=>{if(message.type()==='warning'||message.type()==='error')warnings.push(message.text())});
  page.on('pageerror',error=>warnings.push(`pageerror: ${error.message}`));
  await page.goto('http://127.0.0.1:8062/',{waitUntil:'load'});
  await page.waitForFunction(()=>Boolean(window.__arcade));
  const state=()=>page.evaluate(()=>window.__arcade.snapshot());
  const initial=await state();
  await page.locator('#route').click();
  await page.waitForTimeout(1000);
  const guided=await state();
  if(guided.guideTargetT!==.96||guided.routeT<=initial.routeT)throw Error(`Route click did not start outward travel: ${JSON.stringify(guided)}`);
  await page.locator('#pause').click();
  const paused=await state();
  await page.keyboard.down('w');await page.waitForTimeout(400);await page.keyboard.up('w');
  const still=await state();
  if(!still.paused||still.frames!==paused.frames||still.routeT!==paused.routeT||still.guided)throw Error(`Pause did not freeze play: ${JSON.stringify({paused,still})}`);
  await page.locator('#resume').click();
  await page.keyboard.down('w');await page.waitForTimeout(650);await page.keyboard.up('w');
  const manual=await state();
  if(manual.routeT<=still.routeT)throw Error(`Keyboard did not move after resume: ${JSON.stringify({still,manual})}`);
  await page.locator('#route').click();
  await page.waitForFunction(()=>window.__arcade.snapshot().routeT>.91,null,{timeout:25000});
  const approach=await state();
  if(approach.guideTargetT!==.96)throw Error(`Guide target switched before arrival: ${JSON.stringify(approach)}`);
  await page.waitForFunction(()=>!window.__arcade.snapshot().guided,null,{timeout:4000});
  const reached=await state();
  if(reached.routeT<.93)throw Error(`Guide stopped short of overlook: ${JSON.stringify(reached)}`);
  await page.locator('#route').click();await page.waitForTimeout(650);
  const returning=await state();
  if(returning.guideTargetT!==0||returning.routeT>=reached.routeT)throw Error(`Return route did not start: ${JSON.stringify({reached,returning})}`);
  await page.keyboard.press('Escape');
  await page.locator('#restart').click();
  const restarted=await state();
  if(restarted.routeT>.01||restarted.guided||restarted.paused)throw Error(`Restart did not reset route: ${JSON.stringify(restarted)}`);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
  const hidden=await state();await page.waitForTimeout(350);const hiddenLater=await state();
  if(hiddenLater.frames!==hidden.frames)throw Error(`Hidden page kept rendering: ${JSON.stringify({hidden,hiddenLater})}`);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))});
  await page.waitForTimeout(200);const visible=await state();
  if(visible.frames<=hiddenLater.frames)throw Error(`Visible page did not resume: ${JSON.stringify({hiddenLater,visible})}`);
  if(warnings.length)throw Error(`Browser warnings: ${warnings.join(' | ')}`);
  console.log(JSON.stringify({passed:true,initialRouteT:initial.routeT,approachRouteT:approach.routeT,reachedRouteT:reached.routeT,returnRouteT:returning.routeT,hiddenFrameDelta:hiddenLater.frames-hidden.frames,warnings},null,2));
} finally {await browser.close()}

