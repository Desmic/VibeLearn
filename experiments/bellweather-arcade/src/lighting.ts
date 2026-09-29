import * as T from 'three';

// A small outdoor reflection source for water, glass and ceramic. Generated once;
// it does not add reflection cameras or an extra scene render on every frame.
export function outdoorReflection(renderer:T.WebGLRenderer){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const ctx=canvas.getContext('2d')!;
  const gradient=ctx.createLinearGradient(0,0,0,256);
  gradient.addColorStop(0,'#529bdc');gradient.addColorStop(.40,'#badbec');
  gradient.addColorStop(.49,'#fff0cd');gradient.addColorStop(.53,'#809e97');gradient.addColorStop(1,'#444f66');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,512,256);
  const sun=ctx.createRadialGradient(116,78,2,116,78,35);
  sun.addColorStop(0,'rgba(255,254,231,1)');sun.addColorStop(.25,'rgba(255,251,220,.85)');sun.addColorStop(1,'rgba(255,250,224,0)');
  ctx.fillStyle=sun;ctx.fillRect(75,37,82,82);
  const source=new T.CanvasTexture(canvas);source.colorSpace=T.SRGBColorSpace;
  source.mapping=T.EquirectangularReflectionMapping;
  const pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromEquirectangular(source);
  source.dispose();pmrem.dispose();return target;
}
