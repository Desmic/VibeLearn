import {getGameRuntime,createGameRuntime} from './game-runtime.js';
import {openGameOpening} from './game-opening.js';
import {createGameAudio} from './game-audio.js';
import {createLearningSession} from './learning-session.js';
import {createTutorialFlow,selectStateTutorialStep} from './tutorial-flow.js';
import {createExperienceModeController} from './experience-mode.js';
import {placeWorldMarker} from './world-marker-layout.js';
import * as chapter from './first-words-world.js';

const $=s=>document.querySelector(s),runtime=getGameRuntime(),audio=createGameAudio(),host=$('#world');
const initial={round:0,pieces:0,status:'building',powered:false,output:[],context:[],moves:0};
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,paused=false,inOpening=false,ready=false,presented=null,lastCue=null;
// Fresh entry mounts the first prologue composition behind the loading layer. Do not
// instantiate the prison mission first and then flash it while learner state resolves.
let world=runtime.showStory(chapter,host,0,{reducedMotion:reduced});
const session=createLearningSession(render);
const practice=createTutorialFlow(chapter.controlTutorialSpec);
const ours=()=>session.attempt?.snapshot?.word_machine?.version==='first-words-1';
const view=()=>ours()?session.attempt.word_machine_state:initial;
const text=(s,v)=>{$(s).textContent=v;};
const root=$('#adventure');
const experience=createExperienceModeController(root,{
  modes:['loading','entry','opening','tutorial','mission','complete'],
  surfaces:[
    {selector:'.mission',modes:['tutorial','mission','complete']},
    {selector:'#controls',modes:['entry','tutorial','mission','complete']},
    {selector:'#welcome',modes:['entry']},
    {selector:'#engine',modes:['tutorial','mission','complete']}
  ],
  onChange(mode){
    const tutorialFocus=mode==='tutorial'?(practice.current?.focus||''):'';
    host.dataset.tutorialFocus=tutorialFocus;
    $('#menu-open').classList.toggle('tutorial-focus',tutorialFocus==='menu');
  }
});
const setExperienceMode=mode=>experience.set(mode);
setExperienceMode('loading');
const blocked=()=>!ready||paused||inOpening||session.busy||session.pending||runtime.stats().contextLost||world.stats().animating||document.querySelector('dialog[open]');
function pauseSystems(){const value=paused||Boolean(document.querySelector('dialog[open]'));runtime.setPaused(value);audio.setPaused(value);}
function dialog(selector){$(selector).showModal();pauseSystems();}
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',pauseSystems));
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.addEventListener('pointerdown',()=>audio.unlock().catch(()=>{}),{capture:true});
document.addEventListener('keydown',()=>audio.unlock().catch(()=>{}),{capture:true});
function button(label,action,primary=true){const b=document.createElement('button');b.textContent=label;b.className=primary?'primary':'';b.dataset.action=action;b.disabled=Boolean(blocked());b.onclick=()=>act(action);$('#actions').append(b);}
async function command(path,body={}){
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Learning-Command':'1'},body:JSON.stringify(body)});
  let result={};try{result=await response.json();}catch(_){}
  if(!response.ok)throw new Error(result.message||`Request failed (${response.status})`);
  return result;
}
const repairStep=s=>s.round===0?selectStateTutorialStep(chapter.speechRepairTutorialSpec,s):null;
function tutorialStage(s,complete){
  if(complete)return['LEVEL 1 · COMPLETE','The deeper gate is open.','You restored enough speech to read the changing route and found the way forward.'];
  const repair=repairStep(s);
  if(repair)return[repair.stage,repair.title,repair.detail];
  if(s.status==='success')return['LEVEL 1 · COMPLETE','Route found.','The changed context opened the deeper gate. Finish when you are ready.'];
  if(s.status==='wrong')return['LEVEL 1 · RECOVER','Wrong route.','Nothing is lost. Check the signs, use the current context, and try again.'];
  if(s.clue==='none')return['LEVEL 1 · FIRST MISSION','Find the current route.','Beyond the first door, three signs disagree. Decide what your speech engine should see.'];
  if(s.prediction==='none')return['LEVEL 1 · FIRST MISSION','Predict the gate.','Before running the engine, predict the output from only the context you chose.'];
  return['LEVEL 1 · FIRST MISSION','Build the route sentence.','Use the same word-by-word loop, now with less help.'];
}
function render(){
  const s=view(),a=session.attempt,complete=ours()&&a.status==='submitted';
  practice.bind(a?.id,ours()&&!s.powered&&s.round===0&&!complete);
  if(inOpening){setExperienceMode('opening');return;}
  const mode=!ours()?'entry':complete?'complete':s.round===0?'tutorial':'mission';
  setExperienceMode(mode);$('.mission').classList.toggle('playing',ours());
  $('#error').hidden=!session.error;if(session.error)text('#error',session.error.code==='ACTIVE_ATTEMPT'?'This run is already active. Reload to resume it.':session.error.message);
  $('#retry').hidden=!session.pending||session.busy;
  const other=a?.status==='draft'&&!ours();$('#resume-other').hidden=true;
  if(other){$('#start').disabled=false;text('#start','Enter the prologue →');}
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
  const repair=repairStep(s),controlStep=practice.step;
  const [stage,goal,detail]=tutorialStage(s,complete);text('#stage-name',stage);text('#goal',goal);text('#detail',detail);
  host.dataset.tutorialWorldTarget=controlStep==='done'&&repair?.focus==='world'?(repair.target||''):'';
  host.dataset.tutorialInteractionStep=controlStep==='done'?(repair?.id||''):'';
  $('#output').replaceChildren();for(let i=0;i<4;i++){const span=document.createElement('span');span.textContent=s.output[i]||'·';if(!s.output[i])span.className='empty';$('#output').append(span);}
  text('#context',s.context.join(' ')||'Waiting for power.');
  text('#engine-label',complete?'YOUR SPEECH ENGINE · ROUTE OPEN':s.round===1?'YOUR SPEECH ENGINE · LEVEL 1':'YOUR SPEECH ENGINE · TUTORIAL');
  $('#inspect').hidden=s.round===0;
  $('#actions').replaceChildren();
  if(complete){button('Look deeper into the prison','ending');button('Play Level 1 again','again',false);}
  else if(repair)button(repair.actionLabel,repair.primaryAction);
  else if(s.status==='success')button('Finish Level 1 →','finish');
  else if(s.status==='wrong')button('Check route signs','notices');
  else if(s.round===1&&s.clue==='none')button('Check route signs','notices');
  else if(s.round===1&&s.prediction==='none'){button('Predict the gate','predict');button('Ask for a hint','hint',false);}
  else if(s.round===1&&!s.available_actions?.includes('step')&&s.loop_prediction==='none'&&s.available_actions?.some(a=>a.startsWith('loop-')))button('Continue saved run','loop');
  else{button(s.pieces===0?'Make first word':s.pieces<4?'Next word':'Speak to gate →',s.pieces<4?'step':'send');if(s.round===1&&s.pieces===0)button('Check route signs','notices',false);}
  $('#rewind').hidden=complete||!s.powered||s.status==='success'||s.pieces===0;
  text('#saved',session.busy?'Saving…':session.pending?'Not saved · retry available':complete?'Level saved · practice recorded':'Saved');
  let scene;
  if(complete)scene='You stand in the unknown prison at the open Star gate. A route continues deeper inside.';
  else if(s.round===0&&s.status!=='success')scene='You are the robot in the prison chamber. A huge Moon-marked exit blocks the way out, and a smaller Sun hatch sits to one side.';
  else if(s.round===0)scene='The Moon door is open. Your speech engine works again, and a corridor leads into the first mission.';
  else if(s.status==='success')scene='The Star gate is open deeper in the prison.';
  else scene='You have left the first chamber. Three route boards stand in the wider corridor, and a glowing five-point mark identifies one deeper gate.';
  host.setAttribute('aria-label',`Unknown prison beyond Bellweather. ${scene}`);
  text('#scene-description',`${scene} ${goal} ${detail} Input: ${s.context.join(' ')}. Output: ${s.output.join(' ')||'none'}.`);
  const step=controlStep;$('#controls').classList.toggle('practicing',step!=='done');
  if(step!=='done'){
    const current=practice.current;
    const title=current?.title||current?.skill||'Try the highlighted control.';
    const instructions=current?.instructions||{};
    const instruction=host.clientWidth<700?(instructions.touch||instructions.desktop||'Use the highlighted control.'):(instructions.desktop||'Use the highlighted control.');
    text('#stage-name','TUTORIAL · '+step.toUpperCase());text('#goal',title);text('#detail',instruction);
    text('#engine-label','GET YOUR BEARINGS');text('#scene-description',title+' '+instruction);
    $('#actions').replaceChildren();button('Skip control practice','skip-controls',false);
  }
}
function choices(title,detail,items){
  text('#choice-kicker','LEVEL 1 · ROUTE');text('#choice-title',title);text('#choice-detail',detail);$('#choices').replaceChildren();
  for(const [label,action] of items){const b=document.createElement('button');b.textContent=label;b.onclick=async()=>{$('#choice').close();await act(action);};$('#choices').append(b);}
  dialog('#choice');
}
async function act(action){
  if(blocked())return;
  if(action==='skip-controls'){practice.skip();render();return;}
  if(practice.step!=='done')return;
  await audio.unlock().catch(()=>{});
  if(action==='notices')return choices('Route signs','Choose one sign to put into your speech engine. The physical boards are optional shortcuts to the same choice.',[
    ['Old sign · “Take the Moon gate.”','scan-moon'],['Discarded parade notice · “Lantern parade at sunset.”','scan-parade'],['Current notice · “Moon route closed. The tower bell answers the five-point lantern mark.”','scan-star']]);
  if(action==='predict')return choices('Which gate will your engine say?','Predict the output from only the context you chose. Your first prediction is saved before the machine runs.',[['Moon','predict-moon'],['Star','predict-star'],['Sun','predict-sun']]);
  if(action==='loop')return choices('One saved run used an older tutorial step.','Choose what happens to the input so this existing draft can continue.',[
    ['The original input, unchanged','loop-same'],['The input plus the new word','loop-grows']]);
  if(action==='ending')return showEnding();
  if(action==='start'||action==='again'){await session.start('ai-01-first-words');return;}
  if(action!=='finish'&&!view().available_actions?.includes(action))return;
  await session.action(action);
}
function showEnding(){
  const result=session.attempt?.assessment?.transfer_observations;
  const context=result?(result.relevant_context?'You found the current clue and mapped its five-point mark to the Star gate.':'Your first context choice was stale or unrelated; you recovered without erasing it.') : '';
  const loop=result?.loop_prediction&&result.loop_prediction!=='none'?(result.loop_correct?' You predicted that each new word joins the next input.':' The next prediction receives the growing input, not the original input alone.'):' You watched each new word become part of the next input.';
  text('#reflection',context+loop);dialog('#ending');
}
$('#start').onclick=()=>act('start');$('#rewind').onclick=()=>act('rewind');$('#retry').onclick=()=>session.retry();
$('#menu-open').onclick=()=>{if(practice.observe('menu'))render();dialog('#menu');};
host.addEventListener('game-control-used',event=>{
  if(ours()&&!inOpening&&!blocked()&&practice.observe(event.detail?.kind))render();
});
for(const marker of document.querySelectorAll('#markers [data-action]'))marker.addEventListener('click',()=>{const action=marker.dataset.action;if(view().available_actions?.includes(action))act(action);});
function togglePause(){paused=!paused;$('#paused').hidden=!paused;text('#pause',paused?'Resume the world':'Pause the world');pauseSystems();}
$('#pause').onclick=()=>{$('#menu').close();togglePause();};$('#paused').onclick=togglePause;
$('#reset-progress').onclick=()=>{$('#menu').close();text('#reset-progress-status','');dialog('#reset-confirm');};
$('#confirm-reset').onclick=async()=>{
  const button=$('#confirm-reset');button.disabled=true;text('#reset-progress-status','Resetting game progress…');
  try{await command('/api/progress/reset',{confirmation:'RESET_PROGRESS'});location.replace('/first-words');}
  catch(error){text('#reset-progress-status',error.message);button.disabled=false;}
};
$('#logout').onclick=async()=>{
  const button=$('#logout');button.disabled=true;
  try{await command('/api/auth/logout',{});location.replace('/');}
  catch(error){text('#error',error.message);$('#error').hidden=false;button.disabled=false;$('#menu').close();}
};
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
  const storyRuntime=replay?createGameRuntime():runtime;inOpening=true;setExperienceMode('opening');audio.setPhase('home');
  const sequence=++openingSequence;
  const instance=openGameOpening({root:$('#adventure'),spec:chapter.openingSpec,runtime:storyRuntime,worldModule:chapter,replay,reducedMotion:reduced,onExit:async()=>{
    observer.disconnect();
    if(!replay&&!ours())await session.start('ai-01-first-words');
    inOpening=false;presented=null;world=runtime.showMission(chapter,host,view(),{reducedMotion:reduced});pauseSystems();render();
  }});
  instance.element.classList.add('first-opening');
  const mute=document.createElement('button');mute.textContent=audio.preferences.muted?'Sound off':'Sound on';mute.setAttribute('aria-label','Toggle opening sound');
  mute.setAttribute('aria-pressed',String(audio.preferences.muted));
  mute.onclick=()=>{audio.setPreference('muted',!audio.preferences.muted);mute.textContent=audio.preferences.muted?'Sound off':'Sound on';mute.setAttribute('aria-pressed',String(audio.preferences.muted));syncAudio();};instance.element.querySelector('.rgi-utilities').append(mute);
  const observer=new MutationObserver(()=>{
    const step=Number(instance.element.dataset.step),scene=chapter.openingSpec.scenes[step]||{};
    audio.setPhase(scene.audioPhase||'home');
    audio.setPaused(instance.element.classList.contains('rgi-paused'));
    if(scene.audioCue)audio.cue(scene.audioCue,`opening-${sequence}-${step}-${scene.audioCue}`);
  });observer.observe(instance.element,{attributes:true,attributeFilter:['data-step','class']});
}
$('#replay').onclick=()=>{$('#menu').close();opening(true);};
function frame(){
  const mode=root.dataset.experienceMode;
  if(!['tutorial','mission','complete'].includes(mode)){requestAnimationFrame(frame);return;}
  const s=view(),rect=host.getBoundingClientRect(),tray=$('#controls').getBoundingClientRect(),goal=$('.mission').getBoundingClientRect();
  const tools=host.querySelector('.game-view-tools'),stick=host.querySelector('.game-move-stick');
  if(tools){tools.style.bottom=(rect.bottom-tray.top+14)+'px';tools.style.gridTemplateColumns=tray.top-goal.bottom<225?'repeat(4,44px)':'44px';}if(stick)stick.style.bottom=(rect.bottom-tray.top+16)+'px';
  $('#actions').querySelectorAll('button').forEach(b=>b.disabled=Boolean(blocked()));$('#rewind').disabled=Boolean(blocked());
  for(const marker of $('#markers').children){
    const point=world.projectEntity(marker.dataset.anchor),wrongRound=marker.dataset.round!==undefined&&Number(marker.dataset.round)!==s.round;
    const available=marker.dataset.action?s.available_actions?.includes(marker.dataset.action):true;
    if(marker.dataset.action){marker.disabled=Boolean(blocked()||!available);marker.classList.toggle('chosen',marker.dataset.clue===s.clue);}
    const tutorialTarget=marker.classList.contains('tutorial-target-marker');
    const targetMismatch=tutorialTarget&&(marker.dataset.anchor!==host.dataset.tutorialWorldTarget||!available);
    const guidable=tutorialTarget?Boolean(point?.inFront):Boolean(point?.visible);
    marker.hidden=!guidable||wrongRound||inOpening||!ours()||targetMismatch||(marker.dataset.anchor==='star-label'&&s.status==='success');
    if(point){
      const safeTop=Math.max(150,goal.bottom-rect.top+marker.offsetHeight+8);
      const safeBottom=Math.max(safeTop+12,tray.top-rect.top-12);
      const placement=placeWorldMarker(marker,point,{viewportWidth:rect.width,safeTop,safeBottom,critical:tutorialTarget});
      if(!tutorialTarget&&!placement.insideSafeArea)marker.hidden=true;
    }
  }
  requestAnimationFrame(frame);
}
host.addEventListener('click',async e=>{
  if(blocked()||e.target.closest('button,.game-player-controls'))return;
  const target=await world.pickSemanticAt(e.clientX,e.clientY),s=view();
  if(target==='loose-plug'||target?.startsWith('socket')){if(!s.powered)act('connect');else if(s.available_actions?.includes('step'))act('step');}
  if(target?.startsWith('moon')&&s.available_actions?.includes('scan-moon'))act('scan-moon');
  const noticeAction=target?.startsWith('notice-old')?'scan-moon':target?.startsWith('notice-parade')?'scan-parade':target?.startsWith('notice-today')?'scan-star':null;
  if(noticeAction&&s.available_actions?.includes(noticeAction))act(noticeAction);
  if(target?.startsWith('friend-'))choices('A very companionable cube.','Someone painted a heart on a spare power cube. It may belong to one of the missing robots.',[]);
});
async function boot(){
  try{
    if(!world.available)throw Error('The 3D world could not open.');
    await world.whenReady();ready=true;frame();
    // Resolve learner state while the loading layer still covers the stage. Fresh
    // players remain on Bellweather beat 0; returning players mount their saved prison
    // state before the loading layer is removed.
    await session.load();text('#start','Enter the prologue →');$('#start').disabled=false;render();
    if(!ours())opening();
    $('#loading').hidden=true;
  }catch(error){
    if(!ready){window.dispatchEvent(new CustomEvent('game-entry-failed',{detail:error.message+' Your saved progress is safe.'}));return;}
    $('#loading').hidden=true;text('#start','Sign in to continue');$('#start').disabled=false;$('#start').onclick=()=>{location.assign('/');};text('#error',error.message);$('#error').hidden=false;
  }
}
window.FirstWordsReview={get state(){return view();},get runtime(){return runtime.stats();},get audio(){return audio.stats();}};
window.addEventListener('pagehide',()=>audio.dispose(),{once:true});boot();
