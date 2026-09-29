import {chromium} from 'playwright';
import fs from 'node:fs/promises';

const [url,prefix='camera-cost']=process.argv.slice(2);
if(!url||new URL(url).origin!=='http://127.0.0.1:8062')throw Error('Expected loopback study URL');
if(!/^[a-z0-9-]+$/.test(prefix))throw Error('Unsafe output prefix');
const out='../../artifacts/bellweather-arcade';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11','--use-gl=angle','--enable-gpu','--ignore-gpu-blocklist']});
try {
  const page=await browser.newPage({viewport:{width:1102,height:828},deviceScaleFactor:1}),issues=[];
  page.on('pageerror',error=>issues.push(error.message));
  page.on('console',message=>{if(message.type()==='error')issues.push(message.text())});
  await page.goto(url,{waitUntil:'load'});
  await page.waitForFunction(()=>Boolean(window.__arcade)&&document.querySelector('#loading')?.hidden,null,{timeout:30000});
  const snap=()=>page.evaluate(()=>window.__arcade.snapshot());
  const walk=async(key,ms)=>{await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);await page.waitForTimeout(80)};
  await walk('w',1700);await walk('a',1300);await walk('w',1600);
  await page.mouse.move(850,430);await page.mouse.down();await page.mouse.move(100,440,{steps:12});await page.mouse.up();
  await page.waitForTimeout(400);
  const wall=await snap();
  await page.screenshot({path:`${out}/${prefix}-wall.png`});
  const samples=[];
  for(let sample=0;sample<4;sample++){
    const before=await snap();
    const pacing=await page.evaluate(async()=>{
      const intervals=[];await new Promise(resolve=>{const end=performance.now()+1250;let previous=0;
        function frame(t){if(previous)intervals.push(t-previous);previous=t;if(t<end)requestAnimationFrame(frame);else resolve()}
        requestAnimationFrame(frame)});
      intervals.sort((a,b)=>a-b);return {rafCount:intervals.length,medianMs:intervals[Math.floor(intervals.length/2)],p95Ms:intervals[Math.floor(intervals.length*.95)]};
    });
    const after=await snap(),delta={};
    for(const key of Object.keys(after.cameraMetrics))delta[key]=after.cameraMetrics[key]-before.cameraMetrics[key];
    samples.push({pacing,appFrames:after.frames-before.frames,camera:after.camera,position:after.position,metrics:delta});
  }
  if(issues.length)throw Error(issues.join(' | '));
  const result={passed:true,url,wall,samples,issues};
  await fs.writeFile(`${out}/${prefix}.json`,JSON.stringify(result,null,2));
  console.log(JSON.stringify({passed:true,url,wallPosition:wall.position,wallCamera:wall.camera,samples},null,2));
} finally {await browser.close()}
