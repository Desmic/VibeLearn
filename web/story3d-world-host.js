/* Stable host contract for reusable Three.js story-world adapters.
   It validates a statically imported world module and degrades to the DOM/CSS fallback on mismatch or failure.
   It intentionally does not import arbitrary URLs; generated-package loading belongs to the later publishing/security boundary. */
'use strict';

export const STORY3D_ADAPTER_VERSION='1';
const BASE_INSTANCE_METHODS=['setPaused','replay','stats','dispose'];
const MODE_METHOD={story:'setBeat',mission:'setMissionState',play:'setMode'};

function unavailable(error,manifest=null){
  const message=error instanceof Error?error.message:String(error||'Story world unavailable');
  return {
    available:false,error:message,manifest,
    setMode(){},setBeat(){},setMissionState(){},setPaused(){},replay(){},
    stats(){return{available:false,error:message,adapterVersion:STORY3D_ADAPTER_VERSION,worldId:manifest?.id||null,worldVersion:manifest?.version||null};},
    dispose(){}
  };
}

export function validateStoryWorldModule(module,{mode='story'}={}){
  if(!module||typeof module!=='object')return{ok:false,error:'Missing story-world module'};
  const manifest=module.storyWorldManifest;
  if(!manifest||typeof manifest!=='object')return{ok:false,error:'Story-world manifest is required'};
  if(manifest.adapterVersion!==STORY3D_ADAPTER_VERSION)return{ok:false,error:`Unsupported story-world adapter version: ${manifest.adapterVersion||'missing'}`,manifest};
  if(typeof manifest.id!=='string'||!manifest.id.trim())return{ok:false,error:'Story-world manifest requires an id',manifest};
  if(typeof manifest.version!=='string'||!manifest.version.trim())return{ok:false,error:'Story-world manifest requires a version',manifest};
  if(!Array.isArray(manifest.modes)||!manifest.modes.includes(mode))return{ok:false,error:`Story world ${manifest.id} does not support mode ${mode}`,manifest};
  if(typeof module.createStoryWorld!=='function')return{ok:false,error:'Story-world module must export createStoryWorld(host, options)',manifest};
  return{ok:true,manifest};
}

export function mountStoryWorldModule(module,host,options={}){
  const mode=options.mode||'story';
  if(!host||!host.isConnected)return unavailable('Story-world host is not connected',module?.storyWorldManifest||null);
  const checked=validateStoryWorldModule(module,{mode});
  if(!checked.ok)return unavailable(checked.error,checked.manifest||module?.storyWorldManifest||null);
  let instance;
  try{instance=module.createStoryWorld(host,options);}catch(error){return unavailable(error,checked.manifest);}
  if(!instance||typeof instance!=='object')return unavailable('Story-world adapter did not return an instance',checked.manifest);
  if(instance.available===false)return unavailable(instance.error||'Story-world adapter is unavailable',checked.manifest);
  for(const method of BASE_INSTANCE_METHODS){
    if(typeof instance[method]!=='function'){
      try{instance.dispose?.();}catch(_){}
      return unavailable(`Story-world instance is missing ${method}()`,checked.manifest);
    }
  }
  const modeMethod=MODE_METHOD[mode];
  if(modeMethod&&typeof instance[modeMethod]!=='function'){
    try{instance.dispose();}catch(_){}
    return unavailable(`Story-world instance is missing ${modeMethod}() for ${mode} mode`,checked.manifest);
  }
  if(mode==='play'&&(typeof instance.setBeat!=='function'||typeof instance.setMissionState!=='function')){
    try{instance.dispose();}catch(_){}
    return unavailable('Play Canvas worlds must expose setBeat() and setMissionState()',checked.manifest);
  }
  return Object.assign(instance,{manifest:checked.manifest});
}
