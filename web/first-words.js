import {getGameRuntime,createGameRuntime} from './game-runtime.js';
import {openGameOpening} from './game-opening.js';
import {createGameAudio} from './game-audio.js';
import {createLearningSession} from './learning-session.js';
import * as chapter from './first-words-world.js';

const $=s=>document.querySelector(s),runtime=getGameRuntime(),audio=createGameAudio(),host=$('#world');
const initial={round:0,pieces:0,status:'building',powered:false,output:[],context:[],moves:0};
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,paused=false,inOpening=false,ready=false,presented=null,lastCue=null;
let world=runtime.showMission(chapter,host,initial,{reducedMotion:reduced});
const session=createLearningSession(render);
const ours=()=>session.attempt?.snapshot?.word_machine?.version==='first-words-1';
const view=()=>ours()?session.attempt.word_machine_state:initial;
const text=(s,v)=>{$(s).textContent=v;};
const blocked=()=>!ready||paused||inOpening||session.busy||session.pending||runtime.stats().contextLost||world.stats().animating||document.querySelector('dialog[open]');
function pauseSystems(){const value=paused||Boolean(document.querySelector('dialog[open]'));runtime.setPaused(value);audio.setPaused(value);}
function dialog(selector){$(selector).showModal();pauseSystems();}
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',pauseSystems));
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.addEventListener('pointerdown',()=>audio.unlock().catch(()=>{}),{capture:true});
document.addEventListener('keydown',()=>audio.unlock().catch(()=>{}),{capture:true});
function button(label,action,primary=true){const b=document.createElement('button');b.textContent=label;b.className=primary?'primary':'';b.dataset.action=action;b.disabled=Boolean(blocked());b.onclick=()=>act(action);$('#actions').append(b);}
function render(){
  const s=view(),a=session.attempt,complete=ours()&&a.status==='submitted';
  $('#welcome').hidden=ours();$('#engine').hidden=!ours();$('.mission').classList.toggle('playing',ours());
  $('#error').hidden=!session.error;if(session.error)text('#error',session.error.code==='ACTIVE_ATTEMPT'?'This Level 1 run is already active. Reload to resume it.':session.error.message);
  $('#retry').hidden=!session.pending||session.busy;
  const other=a?.status==='draft'&&!ours();$('#resume-other').hidden=true;
  if(other){$('#start').disabled=false;text('#start','Enter Bellweather →');}
  if(!ours())return;
  const key=a.id+':'+a.revision;
  if(!inOpening&&presented!==key){
    world=runtime.showMission(chapter,host,s,{reducedMotion:reduced});presented=key;pauseSystems();
    audio.setPhase(complete?'complete':s.status==='success'?'reunion':'repair');
    const moves=a.response.word_machine.moves,move=moves.at(-1);
    if(lastCue&&lastCue!==key){
      const cue=complete?'finish':move==='connect'?'connect':move==='step'?'piece':move==='send'?(s.status==='wrong'?'wrong':s.round===0?'rescue':'finish'):move?.startsWith('scan-')?'scan':move==='next'?'exit':null;
      if(cue)audio.cue(cue,key);
    }
    lastCue=key;
  }
  text('#stage-name',complete?'LEVEL 1 · COMPLETE':s.round===0?'THE LANTERN GATE':'THE WAY TO THE TOWER');
  text('#goal',complete?'Zip is beside you. The tower is open.':!s.powered?'Help Zip find their voice.':s.status==='success'?(s.round===0?'Zip is free. Go together.':'You opened the way to the tower.'):s.status==='wrong'?'That sentence opened the wrong way.':s.round===0?'Help Zip speak. Decide what the engine should know.':'Find the route from the context you choose.');
  text('#detail',complete?'Stay in Bellweather, then look toward the printing loft when you are ready.':!s.powered?'Connect the loose lead to the repair socket.':s.status==='success'?(s.round===0?'Your friend is back by your side.':'Zip is waiting at the tower steps.'):s.status==='wrong'?(s.round===0?'The engine followed its input. Inspect Zip’s Moon plaque or try another hypothesis.':'Your chosen context led somewhere real, but not to the tower. Re-check the notices.'):s.hinted?'Look for the current clue that identifies the route. Each new piece joins the next input.':s.round===1?'The route changed. Choose what the engine gets to see, then predict before running it.':'Generate now from the current input, or inspect Zip’s Moon plaque first.');
  $('#output').replaceChildren();for(let i=0;i<4;i++){const span=document.createElement('span');span.textContent=s.output[i]||'·';if(!s.output[i])span.className='empty';$('#output').append(span);}
  text('#context',s.context.join(' ')||'Waiting for power.');
  text('#engine-label',complete?'ZIP’S FIRST WORDS · RESTORED':s.round===1?'ZIP’S SPEECH ENGINE · EXIT CHALLENGE':'ZIP’S SPEECH ENGINE');
  $('#actions').replaceChildren();
  if(complete){button('Look toward the printing loft','ending');button('Play Level 1 again','again',false);}
  else if(!s.powered)button('Connect the power lead','connect');
  else if(s.status==='success')button(s.round===0?'Head for the tower →':'Finish Level 1 →',s.round===0?'next':'finish');
  else if(s.status==='wrong'){button(s.round===0?'Inspect Zip’s Moon plaque':'Re-check the route notices',s.round===0?'scan-moon':'notices');}
  else if(s.round===0&&s.pieces===0&&s.clue==='none'){
    button('Generate from this input','step');button('Inspect Zip’s Moon plaque','scan-moon',false);
  }
  else if(s.round===1&&s.clue==='none')button('Read the route notices','notices');
  else if(s.round===1&&s.prediction==='none'){button('Predict Zip’s gate','predict');button('Ask Zip for a hint','hint',false);}
  else if(s.round===1&&s.loop_prediction==='none')button('Predict the next input','loop');
  else{button(s.pieces===0?'Make the first piece':s.pieces<4?'Make the next piece':'Speak to the gate →',s.pieces<4?'step':'send');if(s.round===1&&s.pieces===0)button('Change the scanned notice','notices',false);}
  $('#rewind').hidden=complete||!s.powered||s.status==='success'||s.pieces===0;
  text('#saved',session.busy?'Saving…':session.pending?'Not saved · retry available':complete?'Level saved · practice recorded':'Saved');
  const scene=complete?'Zip stands beside you at the open Star gate. Bellweather continues beyond the tower.':s.round===0&&s.status!=='success'?'Zip is behind the Moon gate; the Sun hatch is nearby.':'Zip is free. The Star gate leads to the tower.';
  host.setAttribute('aria-label',`Bellweather, a lantern city above the clouds. ${scene}`);
  text('#scene-description',`${scene} ${$('#goal').textContent} ${$('#detail').textContent} Input: ${s.context.join(' ')}. Output: ${s.output.join(' ')||'none'}.`);
}
function choices(title,detail,items){
  text('#choice-kicker','THE WAY TO THE TOWER');text('#choice-title',title);text('#choice-detail',detail);$('#choices').replaceChildren();
  for(const [label,action] of items){const b=document.createElement('button');b.textContent=label;b.onclick=async()=>{$('#choice').close();await act(action);};$('#choices').append(b);}
  dialog('#choice');
}
async function act(action){
  if(blocked())return;
  await audio.unlock().catch(()=>{});
  if(action==='notices')return choices('What should Zip read?','Scan one notice into the speech engine. The city can see all three; the engine receives only your choice.',[
    ['Old sign · “Take the Moon gate.”','scan-moon'],['Parade poster · “Lantern parade at sunset.”','scan-parade'],['Today’s notice · “Moon route closed. The tower bell answers the five-point lantern mark.”','scan-star']]);
  if(action==='predict')return choices('Which gate will Zip say?','Predict the output from only the context you chose. Your first prediction is saved before the machine runs.',[['Moon','predict-moon'],['Star','predict-star'],['Sun','predict-sun']]);
  if(action==='loop')return choices('After Zip makes “Open”…','Predict what the engine receives before choosing the next piece.',[
    ['The original input, unchanged','loop-same'],['The input plus the new piece “Open”','loop-grows']]);
  if(action==='ending')return showEnding();
  if(action==='start'||action==='again'){await session.start('ai-01-first-words');return;}
  if(action!=='finish'&&!view().available_actions?.includes(action))return;
  await session.action(action);
}
function showEnding(){
  const result=session.attempt?.assessment?.transfer_observations;
  text('#reflection',result?`${result.relevant_context?'You chose the current clue and mapped it to the five-point Star marker.':'Your first context choice was stale or unrelated; you recovered without erasing it.'} ${result.loop_correct?'You predicted that each generated piece joins the next input.':'The next prediction receives the growing input, not the original input alone.'}`:'');
  dialog('#ending');
}
$('#start').onclick=()=>act('start');$('#rewind').onclick=()=>act('rewind');$('#retry').onclick=()=>session.retry();
$('#menu-open').onclick=()=>dialog('#menu');
function togglePause(){paused=!paused;$('#paused').hidden=!paused;text('#pause',paused?'Resume the world':'Pause the world');pauseSystems();}
$('#pause').onclick=()=>{$('#menu').close();togglePause();};$('#paused').onclick=togglePause;
$('#inspect').onclick=()=>{
  const s=view();text('#inspection-context','Current input: '+s.context.join(' '));$('#scores').replaceChildren();
  for(const c of s.candidates){const row=document.createElement('div');row.className='score';const label=document.createElement('span');label.textContent=c.piece;const meter=document.createElement('meter');meter.min=0;meter.max=100;meter.value=c.chance;meter.setAttribute('aria-label',c.piece+' illustrative score');const score=document.createElement('span');score.textContent=c.chance+'%';row.append(label,meter,score);$('#scores').append(row);}
  dialog('#inspection');
};
function syncAudio(){for(const name of ['music','effects'])$('#'+name).checked=audio.preferences[name];$('#mute').setAttribute('aria-pressed',String(audio.preferences.muted));$('#mute').setAttribute('aria-label',audio.preferences.muted?'Unmute sound':'Mute all sound');text('#mute',audio.preferences.muted?'♪̸':'♫');}
for(const name of ['music','effects'])$('#'+name).onchange=e=>{audio.setPreference(name,e.target.checked);syncAudio();};
$('#mute').onclick=()=>{audio.setPreference('muted',!audio.preferences.muted);syncAudio();};syncAudio();
$('#reduced').checked=reduced;
$('#reduced').onchange=e=>{reduced=e.target.checked;const camera=world.getPlayerView();runtime.disposeWorld({keepStage:true});world=runtime.showMission(chapter,host,view(),{reducedMotion:reduced});world.restorePlayerView(camera);presented=null;render();};
let openingSequence=0;
function opening(replay=false){
  const storyRuntime=replay?createGameRuntime():runtime;inOpening=true;audio.setPhase('home');
  const sequence=++openingSequence;
  const instance=openGameOpening({root:$('#adventure'),spec:chapter.openingSpec,runtime:storyRuntime,worldModule:chapter,replay,reducedMotion:reduced,onExit:async()=>{
    observer.disconnect();inOpening=false;presented=null;world=runtime.showMission(chapter,host,view(),{reducedMotion:reduced});pauseSystems();
    if(!replay&&!ours())await session.start('ai-01-first-words');else render();
  }});
  instance.element.classList.add('first-opening');
  const mute=document.createElement('button');mute.textContent=audio.preferences.muted?'Sound off':'Sound on';mute.setAttribute('aria-label','Toggle opening sound');
  mute.setAttribute('aria-pressed',String(audio.preferences.muted));
  mute.onclick=()=>{audio.setPreference('muted',!audio.preferences.muted);mute.textContent=audio.preferences.muted?'Sound off':'Sound on';mute.setAttribute('aria-pressed',String(audio.preferences.muted));syncAudio();};instance.element.querySelector('.rgi-utilities').append(mute);
  const observer=new MutationObserver(()=>{const step=Number(instance.element.dataset.step);audio.setPhase(step===0?'home':'danger');audio.setPaused(instance.element.classList.contains('rgi-paused'));if(step>0)audio.cue('capture',`opening-${sequence}-${step}`);});observer.observe(instance.element,{attributes:true,attributeFilter:['data-step','class']});
}
$('#replay').onclick=()=>{$('#menu').close();opening(true);};
function frame(){
  const s=view(),rect=host.getBoundingClientRect(),tray=$('#controls').getBoundingClientRect(),goal=$('.mission').getBoundingClientRect();
  const tools=host.querySelector('.game-view-tools'),stick=host.querySelector('.game-move-stick');
  if(tools){tools.style.bottom=(rect.bottom-tray.top+14)+'px';tools.style.gridTemplateColumns=tray.top-goal.bottom<225?'repeat(4,44px)':'44px';}if(stick)stick.style.bottom=(rect.bottom-tray.top+16)+'px';
  $('#actions').querySelectorAll('button').forEach(b=>b.disabled=Boolean(blocked()));$('#rewind').disabled=Boolean(blocked());
  for(const marker of $('#markers').children){
    const point=world.projectEntity(marker.dataset.anchor);const wrongRound=marker.dataset.round!==undefined&&Number(marker.dataset.round)!==s.round;
    marker.hidden=!point?.visible||wrongRound||inOpening||!ours()||(marker.dataset.anchor==='star-label'&&s.status==='success');
    if(point){marker.style.left=Math.max(40,Math.min(rect.width-40,point.x))+'px';marker.style.top=(point.y-12)+'px';if(point.y>tray.top-rect.top||point.y<Math.max(175,goal.bottom-rect.top+marker.offsetHeight+8))marker.hidden=true;}
  }
  requestAnimationFrame(frame);
}
host.addEventListener('click',async e=>{
  if(blocked()||e.target.closest('button,.game-player-controls'))return;
  const target=await world.pickSemanticAt(e.clientX,e.clientY),s=view();
  if(target==='loose-plug'||target?.startsWith('socket')){if(!s.powered)act('connect');else if(s.available_actions?.includes('step'))act('step');}
  if(target?.startsWith('moon')&&s.available_actions?.includes('scan-moon'))act('scan-moon');
  if(target?.startsWith('friend-'))choices('A very companionable cube.','Someone has painted a heart on a spare power cube. Zip insists it is part of the team.',[]);
});
async function boot(){
  try{
    if(!world.available)throw Error('The 3D world could not open.');await world.whenReady();ready=true;$('#loading').hidden=true;frame();
    const state=await session.load();text('#start','Enter Bellweather →');$('#start').disabled=false;render();
    if(!ours())opening();
  }catch(error){
    if(!ready){window.dispatchEvent(new CustomEvent('game-entry-failed',{detail:error.message+' Your saved progress is safe.'}));return;}
    text('#start','Sign in to continue');$('#start').disabled=false;$('#start').onclick=()=>{location.assign('/');};text('#error',error.message);$('#error').hidden=false;
  }
}
window.FirstWordsReview={get state(){return view();},get runtime(){return runtime.stats();},get audio(){return audio.stats();}};
window.addEventListener('pagehide',()=>audio.dispose(),{once:true});boot();
