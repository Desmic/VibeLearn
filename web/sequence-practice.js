/* Disposable, parameterized practice. No learner API writes. */
export function createSequencePractice(spec){
 for(const name of ['demo','practice']){const c=spec[name];if(!c||typeof c.request!=='string'||!Array.isArray(c.pieces)||c.pieces.length<2||!c.pieces.every(p=>typeof p==='string'&&p))throw Error('Case needs a request and at least two pieces');}
 let phase='power',count=0,choice=null,first=null,assisted=false;const events=[];
 function snapshot(){const c=phase.startsWith('practice')||phase==='done'?spec.practice:spec.demo;const output=c.pieces.slice(0,count);return{phase,count,choice,assisted,firstDecision:first?{...first}:null,request:c.request,output,input:[c.request,...output],events:events.map(e=>({...e}))};}
 function act(action,value){
  if(action==='connect'&&phase==='power'){phase='demo';count=0;}
  else if(action==='advance'&&phase==='demo'){count++;if(count===spec.demo.pieces.length)phase='demo-done';}
  else if(action==='practice'&&phase==='demo-done'){phase='practice-choice';count=1;}
  else if(action==='choose'&&phase==='practice-choice'&&['request','output','complete'].includes(value))choice=value;
  else if(action==='commit'&&phase==='practice-choice'&&choice){if(!first)first=Object.freeze({choice,correct:choice==='complete',assisted});phase='practice-feedback';}
  else if(action==='retry'&&phase==='practice-feedback'){phase='practice-choice';assisted=true;choice=null;}
  else if(action==='advance'&&(phase==='practice-feedback'||phase==='practice-run')){count++;phase=count===spec.practice.pieces.length?'done':'practice-run';}
  else return false;
  events.push({action,value:value??null,phase});return true;
 }
 return{snapshot,act};
}
