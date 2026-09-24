import {getGameRuntime,createGameRuntime} from './game-runtime.js';
import {getPreferences} from './preferences.js';
import {openGameOpening} from './game-opening.js';
import * as workshop from './word-machine-world.js';

const $=selector=>document.querySelector(selector),runtime=getGameRuntime(),host=$('#world');
const preferences=getPreferences();
let attempt=null,busy=false,pending=null,paused=false,openingReplay=false;
// Rule I11: the registry is the only copy of this setting; the checkbox reads from it too.
const reduced=()=>preferences.get('motion');
let world=runtime.showMission(workshop,host,null,{reducedMotion:reduced()});
const initial={pieces:0,status:'building',round:0,destination:'Library',output:[]};
const view=()=>attempt?.word_machine_state||initial;
function text(selector,value){$(selector).textContent=value;}
function setPaused(value){paused=value;runtime.setPaused(value);$('#paused-banner').hidden=!value;text('#pause',value?'Resume the scene':'Pause the scene');document.querySelectorAll('#actions button,#rewind').forEach(button=>button.disabled=value||busy||Boolean(pending));}
function showDialog(selector){runtime.setPaused(true);$(selector).showModal();}
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',()=>runtime.setPaused(paused)));
async function request(path,body){
  const res=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Learning-Command':'1'},body:JSON.stringify(body)});
  const data=await res.json();if(!res.ok)throw Object.assign(new Error(data.message||'Could not save this action.'),{code:data.error});return data;
}
function actionButton(label,action,primary=true){
  const b=document.createElement('button');b.textContent=label;b.className=primary?'primary':'';b.dataset.action=action;
  b.disabled=busy||Boolean(pending)||paused;b.onclick=()=>act(action);$('#actions').append(b);
}
function render(){
  const s=view();$('#welcome').hidden=Boolean(attempt);$('#machine-console').hidden=!attempt;
  $('.mission').classList.toggle('playing',Boolean(attempt));
  if(!attempt)return;
  if(!openingReplay)runtime.showMission(workshop,host,s,{reducedMotion:reduced()});
  text('#chapter-label',openingReplay?'OPENING REPLAY':attempt.status==='submitted'?'EPISODE 1 · COMPLETE':s.round===0?'DELIVERY 1 / 2':'DELIVERY 2 / 2');
  const complete=attempt.status==='submitted';
  text('#goal',openingReplay?'A tiny machine. A missing clue.':complete?'Two deliveries. One useful idea.':s.status==='wrong'?'That sounded right. Wrong door.':s.status==='success'?`${s.case.person} got the ${s.case.parcel}!`:s.round===1?`Find ${s.case.person}. Deliver the ${s.case.parcel}.`:`Get ${s.case.person}’s ${s.case.parcel} to the ${s.case.target}.`);
  text('#goal-detail',openingReplay?'You operate the machine. The robot follows its message.':complete?'A new piece joins the context. A better clue changes what follows.':s.status==='wrong'?(s.clue==='none'?'The machine was missing the clue.':'It followed a wrong clue. Confident is not the same as correct.'):s.status==='success'?'The clue changed the message. The robot found its friend.':'Make a short message, one piece at a time.');
  text('#context',s.context.join(' '));$('#clue-note').hidden=!(s.saw_wrong||s.round===1)||complete;
  text('#clue-note',`${s.case.person}’s note: “${s.case.note}”`);
  $('#actions').replaceChildren();
  if(openingReplay)actionButton('Return to my experiment','return');
  else if(complete){actionButton('Play again','again');actionButton('What comes next?','series',false);}
  else if(s.status==='success')actionButton(s.round===0?'A new delivery →':'Finish episode →',s.round===0?'next':'finish');
  else if(s.status==='wrong'){
    actionButton('Add the Garden clue','add-garden',false);actionButton('Add the Library clue','add-library',false);
  }else{
    actionButton(s.pieces===0?'Make the first piece':s.pieces<3?'Make the next piece':'Send the robot →',s.pieces<3?'step':'send');
    if(s.round===1&&s.clue==='none')actionButton('Choose a clue','clues',false);
  }
  $('#rewind').hidden=complete||openingReplay||s.moves===0;$('#rewind').disabled=busy||Boolean(pending)||paused;
  $('#inspect').disabled=busy||openingReplay;
  $('#world-words').replaceChildren();
  for(let i=0;i<3;i++){const el=document.createElement('i');el.textContent=openingReplay?'?':s.output[i]||'?';el.className=s.output[i]&&!openingReplay?'':'unknown';$('#world-words').append(el);}
  text('#save-state',busy?'Saving…':pending?'Not saved · retry available':complete?'Episode saved · practice, not mastery':'Saved');
  $('#save-state').dataset.error=String(Boolean(pending));
  text('#scene-description',`${s.case.person} is waiting at the ${s.case.target}. Machine input: ${s.context.join(' ')}. Output so far: ${s.output.join(' ')||'none'}. ${s.status==='wrong'?`The robot went to the ${s.destination}, the wrong place.`:s.status==='success'?'The robot arrived at the right door.':''}`);
}
async function execute(command,body){
  busy=true;pending={command,body};$('#error').hidden=true;$('#retry').hidden=true;render();
  try{attempt=await request(`/api/commands/${command}`,body);pending=null;}
  catch(error){text('#error',error.code==='ACTIVE_ATTEMPT'?'You have an unfinished run. Open Relay Rescue to finish or resume it; it has not been overwritten.':error.message);$('#error').hidden=false;$('#retry').hidden=false;}
  finally{busy=false;render();}
}
async function act(action){
  if(busy||paused||runtime.stats().contextLost||!world.available)return;
  if(world.stats().assetsFailed||world.stats().assetsPending){text('#error','The courier is unavailable. Reload the workshop; saved progress is safe.');$('#error').hidden=false;return;}
  if(action==='return'){openingReplay=false;render();return;}
  if(action==='series'){showDialog('#menu');return;}
  if(action==='clues'){
    $('#actions').replaceChildren();actionButton('Add the Garden clue','add-garden',false);actionButton('Add the Library clue','add-library',false);return;
  }
  if(pending)return;
  if(action==='again'||action==='start')return execute('start',{command_id:crypto.randomUUID(),expected_revision:0,mode:'LEARN',mission_id:'ai-01-context'});
  if(!attempt||attempt.status==='submitted')return;
  const response=structuredClone(attempt.response);
  if(action!=='finish')response.word_machine.moves.push(action);
  await execute(action==='finish'?'submit':'save',{command_id:crypto.randomUUID(),expected_revision:attempt.revision,attempt_id:attempt.id,response});
}
$('#start').onclick=()=>act('start');$('#rewind').onclick=()=>act('rewind');
$('#retry').onclick=()=>{if(pending)execute(pending.command,pending.body);};
$('#menu-open').onclick=()=>showDialog('#menu');
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$('#pause').onclick=()=>{setPaused(!paused);$('#menu').close();};$('#paused-banner').onclick=()=>setPaused(false);
$('#inspect').onclick=()=>{
  const s=view();text('#inside-context',`Current context: ${s.context.join(' ')}`);
  $('#distribution').replaceChildren();
  for(const candidate of s.candidates){const row=document.createElement('div');row.className='chance';const label=document.createElement('span');label.textContent=candidate.piece;const meter=document.createElement('meter');meter.min=0;meter.max=100;meter.value=candidate.chance;meter.setAttribute('aria-label',`${candidate.piece} illustrative score`);const score=document.createElement('span');score.textContent=candidate.chance+'%';row.append(label,meter,score);$('#distribution').append(row);}
  showDialog('#inside');
};
function showOpening(replay=false){
  const openingRuntime=replay?createGameRuntime():runtime;
  const opening=openGameOpening({root:$('#workshop'),spec:workshop.openingSpec,runtime:openingRuntime,worldModule:workshop,replay,reducedMotion:reduced(),onExit:()=>{
    world=runtime.showMission(workshop,host,view(),{reducedMotion:reduced()});runtime.setPaused(paused);render();
    if(!replay&&!attempt)act('start');
  }});
  opening.element.classList.add('word-opening');
}
$('#replay-opening').onclick=()=>{$('#menu').close();showOpening(true);};
$('#reduce-motion').onchange=e=>{
  preferences.set('motion',e.target.checked);const player=world.getPlayerView?.();runtime.disposeWorld({keepStage:true});
  world=runtime.showMission(workshop,host,openingReplay?initial:view(),{reducedMotion:reduced()});world.restorePlayerView?.(player);runtime.setPaused(paused||Boolean(document.querySelector('dialog[open]')));
};
preferences.hydrate();
function positionLabels(){
  const rect=host.getBoundingClientRect(),tray=$('#experiment').getBoundingClientRect();
  const tools=host.querySelector('.game-view-tools'),stick=host.querySelector('.game-move-stick');
  if(tools)tools.style.bottom=(rect.bottom-tray.top+12)+'px';
  if(stick)stick.style.bottom=(rect.bottom-tray.top+16)+'px';
  for(const el of document.querySelectorAll('[data-anchor]')){
    const p=world.projectEntity?.(el.dataset.anchor);el.hidden=!p?.visible;
    if(p){el.style.left=p.x+'px';el.style.top=(p.y-10)+'px';}
  }
  const p=world.projectEntity?.('output');
  $('#output-label').hidden=!p?.visible;
  if(p){$('#output-label').style.left=Math.max(95,Math.min(rect.width-95,p.x))+'px';$('#output-label').style.top=Math.min(tray.top-rect.top-12,rect.height*.75)+'px';}
  requestAnimationFrame(positionLabels);
}
host.addEventListener('click',async e=>{
  if(!attempt||busy||pending||openingReplay||e.target.closest('button,.game-player-controls'))return;
  const target=await world.pickSemanticAt?.(e.clientX,e.clientY);
  if(target?.startsWith('machine')&&view().available_actions.includes('step'))act('step');
});
host.addEventListener('webglcontextlost',()=>{text('#error','The 3D view stopped. Your saved experiment is safe; reload to restore it.');$('#error').hidden=false;},true);
async function boot(){
  if(!world.available){window.dispatchEvent(new CustomEvent('game-entry-failed',{detail:'The 3D workshop could not open. Your saved progress is safe.'}));return;}
  try{await world.whenReady();}catch(error){window.dispatchEvent(new CustomEvent('game-entry-failed',{detail:error.message}));return;}
  $('#loading').hidden=true;positionLabels();
  try{
    const state=await request('/api/session',{});
    if(state.attempt?.snapshot?.word_machine)attempt=state.attempt;
    else if(state.attempt?.status==='draft'){text('#error','An unfinished Relay Rescue run is saved. Open it from the v↗ link; this workshop will not overwrite it.');$('#error').hidden=false;}
    text('#start','Enter the workshop →');$('#start').disabled=false;render();
    if(!attempt&&state.attempt?.status!=='draft')showOpening();
  }catch(error){text('#start','Sign in to continue');$('#start').disabled=false;$('#start').onclick=()=>location.assign('/');text('#error',error.message);$('#error').hidden=false;}
}
window.WordMachineReview={get runtime(){return runtime.stats();},get state(){return view();}};
boot();
