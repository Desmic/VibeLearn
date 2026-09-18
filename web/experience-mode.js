/* Mutually exclusive experience-mode presentation controller. */
'use strict';

function require(condition,message){if(!condition)throw new Error(`ExperienceMode invalid: ${message}`);}

export function createExperienceModeController(root,{modes,surfaces=[],initial=null,onChange=()=>{}}={}){
  require(root?.querySelectorAll,'root element is required');
  require(Array.isArray(modes)&&modes.length>0,'modes are required');
  const allowed=new Set(modes);
  require(allowed.size===modes.length&&modes.every(v=>typeof v==='string'&&v.length>0),'modes must be unique strings');
  require(Array.isArray(surfaces),'surfaces must be an array');
  for(const surface of surfaces){
    require(surface&&typeof surface.selector==='string'&&surface.selector.length>0,'surface selector is required');
    require(Array.isArray(surface.modes)&&surface.modes.length>0&&surface.modes.every(mode=>allowed.has(mode)),'surface modes are invalid');
  }
  let current=null;
  const set=mode=>{
    require(allowed.has(mode),`unknown mode ${mode}`);
    current=mode;
    root.dataset.experienceMode=mode;
    for(const surface of surfaces){
      const visible=surface.modes.includes(mode);
      for(const node of root.querySelectorAll(surface.selector))node.hidden=!visible;
    }
    onChange(mode);
    return mode;
  };
  const snapshot=()=>({
    mode:current,
    visibleSurfaces:surfaces.filter(surface=>surface.modes.includes(current)).map(surface=>surface.selector)
  });
  if(initial!==null)set(initial);
  return{set,snapshot,get mode(){return current;}};
}
