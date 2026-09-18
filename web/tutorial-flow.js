/* Engine-neutral tutorial progression. No renderer, game rules or learner mastery writes. */
'use strict';

function require(condition,message){if(!condition)throw new Error(`TutorialFlow invalid: ${message}`);}

export function validateTutorialFlowSpec(spec){
  require(spec&&typeof spec==='object','spec is required');
  require(typeof spec.id==='string'&&spec.id.length>0,'id is required');
  require(typeof spec.version==='string'&&spec.version.length>0,'version is required');
  require(Array.isArray(spec.steps)&&spec.steps.length>0,'steps are required');
  const ids=new Set();
  for(const step of spec.steps){
    require(step&&typeof step==='object','step must be an object');
    require(typeof step.id==='string'&&step.id.length>0&&!ids.has(step.id),'step id is invalid or duplicated');
    ids.add(step.id);
    for(const key of ['skill','observe','focus','success']){
      require(typeof step[key]==='string'&&step[key].trim(),`${step.id}.${key} is required`);
    }
    if(step.title!==undefined)require(typeof step.title==='string'&&step.title.trim(),`${step.id}.title is invalid`);
    if(step.instructions!==undefined){
      require(step.instructions&&typeof step.instructions==='object'&&!Array.isArray(step.instructions),`${step.id}.instructions must be an object`);
      require(typeof step.instructions.desktop==='string'&&step.instructions.desktop.trim(),`${step.id}.instructions.desktop is required`);
      if(step.instructions.touch!==undefined)require(typeof step.instructions.touch==='string'&&step.instructions.touch.trim(),`${step.id}.instructions.touch is invalid`);
    }
  }
  if(spec.handoff!==undefined){
    const h=spec.handoff;
    require(h&&typeof h==='object'&&!Array.isArray(h),'handoff must be an object');
    for(const key of ['from','to','playerRole','goal']){
      require(typeof h[key]==='string'&&h[key].trim(),`handoff.${key} is required`);
    }
  }
  if(spec.skipAllowed!==undefined)require(typeof spec.skipAllowed==='boolean','skipAllowed must be boolean');
  return spec;
}

export function createTutorialFlow(input,{storage=globalThis.localStorage}={}){
  const spec=validateTutorialFlowSpec(input);
  let key=null,index=spec.steps.length;
  const save=()=>{
    if(!key)return;
    try{storage?.setItem(key,index>=spec.steps.length?'done':spec.steps[index].id);}catch(_){}
  };
  return{
    spec,
    bind(scopeId,enabled){
      if(!enabled){key=null;index=spec.steps.length;return;}
      require(typeof scopeId==='string'&&scopeId.length>0,'bind scope id is required');
      const next=`vibelearn.tutorial.${spec.id}.${spec.version}:${scopeId}`;
      if(key===next)return;
      key=next;
      let stored;
      try{stored=storage?.getItem(key);}catch(_){}
      if(stored==='done'){index=spec.steps.length;return;}
      const found=spec.steps.findIndex(step=>step.id===stored);
      index=found>=0?found:0;
    },
    get step(){return index>=spec.steps.length?'done':spec.steps[index].id;},
    get current(){return index>=spec.steps.length?null:spec.steps[index];},
    get handoff(){return spec.handoff||null;},
    observe(kind){
      const current=this.current;
      if(!current||kind!==current.observe)return false;
      index+=1;save();return true;
    },
    skip(){
      if(spec.skipAllowed===false)return false;
      index=spec.steps.length;save();return true;
    },
    reset(){index=0;save();}
  };
}
