import * as T from 'three';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { buildZip } from './src/zip.ts';
import { buildCourierZip } from './src/zip-courier.ts';

// Focused geometry and sequential runtime smoke check for the static courier study.
// Run with Node 22's --experimental-strip-types after the native preview is paused.
const output='../../artifacts/bellweather-arcade';
const option=name=>process.argv.find(arg=>arg.startsWith(`--${name}=`))?.slice(name.length+3);
const baselineUrl=option('baseline'),candidateUrl=option('candidate'),outputPrefix=option('prefix');
if(Boolean(baselineUrl)!==Boolean(candidateUrl))throw Error('Supply both --baseline and --candidate URLs');
if(baselineUrl&&!outputPrefix)throw Error('Explicit comparison URLs require a unique --prefix');
if(outputPrefix&&!/^[a-z0-9-]+$/.test(outputPrefix))throw Error('Output prefix must be lowercase letters, digits or hyphens');
for(const url of [baselineUrl,candidateUrl].filter(Boolean)){
  const parsed=new URL(url);
  if(parsed.origin!=='http://127.0.0.1:8062'||parsed.searchParams.get('study')!=='facade')throw Error(`Unexpected study URL: ${url}`);
}
const districts=process.argv.includes('--districts');
const city=process.argv.includes('--city')||process.argv.includes('--city-final');
const sunlit=process.argv.includes('--sunlit');
const prefix=outputPrefix??(districts?'districts-engineering':process.argv.includes('--city-final')?'city-final-engineering':city?'city-engineering':sunlit?'sunlit-engineering':process.argv.includes('--final')?'courier-final':'courier');
await fs.mkdir(output,{recursive:true});
const base='http://127.0.0.1:8062/?study=facade&portal=crafted&architecture=atelier&finish=daylight&palette=ceramic&form=swept-clean';
const characterFor=url=>new URL(url).searchParams.get('character')==='courier'?buildCourierZip:buildZip;
const variants=baselineUrl?
  [{name:'control',url:baselineUrl,build:characterFor(baselineUrl)},{name:'candidate',url:candidateUrl,build:characterFor(candidateUrl)}]:districts?
  [{name:'control',url:`${base}&character=courier&look=sunlit&setting=city`,build:buildCourierZip},{name:'terraces',url:`${base}&character=courier&look=sunlit&setting=city&districts=terraces`,build:buildCourierZip}]:city?
  [{name:'control',url:`${base}&character=courier&look=sunlit`,build:buildCourierZip},{name:'city',url:`${base}&character=courier&look=sunlit&setting=city`,build:buildCourierZip}]:sunlit?
  [{name:'control',url:`${base}&character=courier`,build:buildCourierZip},{name:'sunlit',url:`${base}&character=courier&look=sunlit`,build:buildCourierZip}]:
  [{name:'original',url:base,build:buildZip},{name:'courier',url:`${base}&character=courier`,build:buildCourierZip}];

function geometry(build){
  const root=build(),bounds=new T.Box3().setFromObject(root),materials=new Set();
  let meshes=0,triangles=0,vertices=0,invalidPositions=0,invalidNormals=0,zeroNormals=0,zeroAreaTriangles=0;
  root.updateMatrixWorld(true);
  root.traverse(object=>{
    if(!object.isMesh)return;
    meshes++;materials.add(object.material.uuid);
    const g=object.geometry,p=g.getAttribute('position'),n=g.getAttribute('normal'),index=g.getIndex();
    vertices+=p.count;triangles+=(index?.count??p.count)/3;
    for(let i=0;i<p.count;i++){
      if(![p.getX(i),p.getY(i),p.getZ(i)].every(Number.isFinite))invalidPositions++;
      if(!n||![n.getX(i),n.getY(i),n.getZ(i)].every(Number.isFinite))invalidNormals++;
      else if(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))<1e-8)zeroNormals++;
    }
    const count=index?.count??p.count;
    for(let i=0;i<count;i+=3){
      const ids=[i,i+1,i+2].map(j=>index?index.getX(j):j);
      const a=new T.Vector3().fromBufferAttribute(p,ids[0]);
      const b=new T.Vector3().fromBufferAttribute(p,ids[1]);
      const c=new T.Vector3().fromBufferAttribute(p,ids[2]);
      if(new T.Vector3().subVectors(b,a).cross(new T.Vector3().subVectors(c,a)).lengthSq()<1e-18)zeroAreaTriangles++;
    }
  });
  const standingY=.13-bounds.min.y;
  return {meshes,materials:materials.size,vertices,triangles,invalidPositions,invalidNormals,zeroNormals,zeroAreaTriangles,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},standingY,groundedSoleY:bounds.min.y+standingY};
}

const result={geometry:Object.fromEntries(variants.map(v=>[v.name,geometry(v.build)])),runtime:{},issues:[]};
for(const [name,g] of Object.entries(result.geometry))if(g.invalidPositions||g.invalidNormals||g.zeroNormals||Math.abs(g.groundedSoleY-.13)>1e-9)result.issues.push(`${name} invalid geometry/grounding`);

if(process.argv.includes('--static')){
  await fs.writeFile(`${output}/${prefix}-geometry.json`,JSON.stringify(result,null,2));
  console.log(JSON.stringify(result.geometry,null,2));
  process.exit(result.issues.length?1:0);
}

const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11','--use-gl=angle','--enable-gpu','--ignore-gpu-blocklist']});
try {
  for(const variant of variants){
    const context=await browser.newContext({viewport:{width:1102,height:828},deviceScaleFactor:1});
    const page=await context.newPage(),issues=[],warnings=[],resources=[];
    try {
      page.on('pageerror',e=>issues.push(`pageerror: ${e.message}`));
      page.on('console',m=>{if(!['error','warning'].includes(m.type()))return;const s=m.text();if(s.includes('THREE.WebGLProgram')&&s.includes('warning X4122'))warnings.push(s);else issues.push(`${m.type()}: ${s}`)});
      page.on('requestfailed',r=>issues.push(`requestfailed: ${r.url()} ${r.failure()?.errorText??''}`));
      page.on('response',r=>{if(r.status()>=400)issues.push(`HTTP ${r.status()}: ${r.url()}`);if(r.url().includes('/crafted-portal/')||r.url().includes('/atelier/')||r.url().includes('/materials/'))resources.push({url:r.url(),status:r.status()})});
      await page.goto(variant.url,{waitUntil:'load'});
      await page.waitForFunction(()=>Boolean(window.__arcade)&&document.querySelector('#loading')?.hidden,null,{timeout:30000});
      const snap=()=>page.evaluate(()=>window.__arcade.snapshot());
      const pace=async()=>page.evaluate(async()=>{
        const intervals=[];let previous=0;const end=performance.now()+750;
        await new Promise(resolve=>{function step(t){if(previous)intervals.push(t-previous);previous=t;if(t<end)requestAnimationFrame(step);else resolve()}requestAnimationFrame(step)});
        intervals.sort((a,b)=>a-b);return {count:intervals.length,medianMs:intervals[Math.floor(intervals.length/2)]??null,p95Ms:intervals[Math.floor(intervals.length*.95)]??null};
      });
      const device=await page.evaluate(()=>{const gl=document.querySelector('canvas')?.getContext('webgl2'),ext=gl?.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,renderer:gl&&ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl?.getParameter(gl.RENDERER)??'unavailable',viewport:[innerWidth,innerHeight],dpr:devicePixelRatio}});
      const arrival=await snap();
      if(arrival.study!=='facade'||arrival.routeT>.01||Math.abs(arrival.position[1]-result.geometry[variant.name].standingY)>1e-6)issues.push('arrival/standing height mismatch');
      const ordinaryPacing=(sunlit||city||districts||baselineUrl)?await pace():null;
      await page.screenshot({path:`${output}/${prefix}-${variant.name}-arrival.png`});
      await page.keyboard.down('w');await page.waitForTimeout(700);await page.keyboard.up('w');await page.waitForTimeout(100);
      const moved=await snap();if(moved.routeT<=arrival.routeT)issues.push('held W did not advance');
      await page.mouse.move(650,410);await page.mouse.down();await page.mouse.move(810,430,{steps:8});await page.mouse.up();await page.waitForTimeout(100);
      const orbit=await snap();if(orbit.camera.join(',')===moved.camera.join(','))issues.push('orbit did not move camera');
      await page.keyboard.press('Escape');const paused=await snap();await page.waitForTimeout(220);const still=await snap();
      if(!paused.paused||still.frames!==paused.frames)issues.push('pause did not freeze frames');
      await page.locator('#restart').click();await page.waitForTimeout(100);const reset=await snap();
      if(reset.paused||reset.routeT>.01)issues.push('restart failed');
      let wall=null,nearWallPacing=null,rearWallProbe=null;
      if(sunlit||city||districts||baselineUrl){
        const walk=async(key,ms)=>{await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);await page.waitForTimeout(70)};
        await walk('w',1700);await walk('a',1300);await walk('w',1600);
        await page.mouse.move(850,430);await page.mouse.down();await page.mouse.move(100,440,{steps:12});await page.mouse.up();await page.waitForTimeout(180);
        wall=await snap();nearWallPacing=await pace();
        await page.screenshot({path:`${output}/${prefix}-${variant.name}-wall.png`});
        await page.keyboard.press('Escape');await page.locator('#restart').click();await page.waitForTimeout(80);
        if(process.argv.includes('--city-final')){
          rearWallProbe=await page.evaluate(()=>window.__arcade.probeCamera(-5.65,-4.8,Math.PI,.2,6));
          if(!rearWallProbe.camera.every(Number.isFinite))issues.push('rear-wall camera probe returned nonfinite pose');
        }
      }
      await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);
      const phone=await snap(),layout=await page.evaluate(()=>{const rects={};for(const id of ['controls','route','place','pause']){const r=document.getElementById(id).getBoundingClientRect();rects[id]=[r.left,r.top,r.right,r.bottom]}return {overflowX:document.documentElement.scrollWidth>innerWidth,rects}});
      if(layout.overflowX||Object.values(layout.rects).some(([l,t,r,b])=>l<0||r>390||t<0||b>844))issues.push('portrait controls out of bounds');
      await page.screenshot({path:`${output}/${prefix}-${variant.name}-phone.png`});
      if(!resources.some(r=>r.url.endsWith('sunward-portal-swept-clean.glb')&&r.status===200))issues.push('clean portal resource missing');
      if(!resources.some(r=>r.url.endsWith('sunward-atelier-occlusion-v4.glb')&&r.status===200))issues.push('atelier resource missing');
      result.runtime[variant.name]={device,arrival,ordinaryPacing,moved,orbit,paused,still,reset,wall,nearWallPacing,rearWallProbe,phone,layout,resources,issues,warnings};
      result.issues.push(...issues.map(issue=>`${variant.name}: ${issue}`));
    } finally {await context.close()}
  }
} finally {await browser.close()}
result.passed=result.issues.length===0;
await fs.writeFile(`${output}/${prefix}-engineering.json`,JSON.stringify(result,null,2));
console.log(JSON.stringify({passed:result.passed,geometry:result.geometry,runtime:Object.fromEntries(Object.entries(result.runtime).map(([name,r])=>[name,{draws:r.arrival.draws,triangles:r.arrival.triangles,standingY:r.arrival.standingY,movedT:r.moved.routeT,paused:r.paused.paused,resetT:r.reset.routeT,ordinaryPacing:r.ordinaryPacing,nearWallPacing:r.nearWallPacing,issues:r.issues,warnings:r.warnings.length}]))},null,2));
if(!result.passed)process.exitCode=1;
