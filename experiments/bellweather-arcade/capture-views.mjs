import { chromium } from 'playwright';
// usage: node shots.mjs <url> <outdir>
const [,, url, outdir] = process.argv;
const VIEWS = {
  V1: {vp:[1280,720], pose:[1,7,0,0.2,6,0]},
  V2: {vp:[1280,720], pose:[-1.0,4.2,1.3,0.12,4.2,-1.3]},
  V3: {vp:[1280,720], pose:[1.0,-8.5,Math.PI,0.2,6,0]},
  V1b:{vp:[1280,720], pose:[0.3,-11.2,0,0.1,5.5,0]},
  V4: {vp:[390,844],  pose:[0.3,-11.2,0,0.1,5.5,0]},
};
const only = process.argv[4]?.split(',');
const browser = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
for (const [name,v] of Object.entries(VIEWS)) {
  if (only && !only.includes(name)) continue;
  const page = await browser.newPage({ viewport:{width:v.vp[0],height:v.vp[1]}, deviceScaleFactor:1 });
  const logs=[]; page.on('pageerror',e=>logs.push('pageerror: '+e.message)); page.on('console',m=>{if(m.type()==='error')logs.push(m.text())});
  await page.goto(url);
  await page.waitForFunction(()=>window.__arcade && document.getElementById('loading').hidden, null, {timeout:120000});
  await page.waitForTimeout(1500);
  await page.evaluate(p=>window.__arcade.pose(...p), v.pose);
  await page.waitForTimeout(500);
  await page.evaluate(p=>window.__arcade.pose(...p), v.pose);
  await page.screenshot({ path: `${outdir}/${name}.png`, timeout:120000 });
  const s = await page.evaluate(()=>window.__arcade.snapshot());
  console.log(name, JSON.stringify({draws:s.draws,tris:s.triangles,place:s.place}), logs.slice(0,3).join(' | '));
  await page.close();
}
await browser.close();
