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
const ours=()=>['first-words-1','first-words-2'].includes(session.attempt?.snapshot?.word_machine?.version);
const view=()=>ours()?session.attempt.word_machine_state:initial;
const text=(s,v)=>{$(s).textContent=v;};
const root=$('#adventure');
// One world-anchored stage card carries the goal, the machine's input/output and the
// actions for the current focal object. It follows Zip, the machine or the receiver.
const experience=createExperienceModeController(root,{
  modes:['loading','entry','opening','tutorial','mission','complete'],
  surfaces:[
    {selector:'#engine',modes:['tutorial','mission','complete']},
    {selector:'#controls',modes:['entry']},
    {selector:'#welcome',modes:['entry']}
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
const tray=(label,action)=>button(label,action,false);
function statusLine(message,dataset){const p=document.createElement('p');p.setAttribute('role','status');p.textContent=message;if(dataset)Object.assign(p.dataset,dataset);$('#actions').append(p);return p;}
async function command(path,body={}){
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Learning-Command':'1'},body:JSON.stringify(body)});
  let result={};try{result=await response.json();}catch(_){}
  if(!response.ok)throw new Error(result.message||`Request failed (${response.status})`);
  return result;
}
const repairStep=s=>s.round===0?selectStateTutorialStep(chapter.speechRepairTutorialSpec,s):null;
const SCAN_TRAYS=[
  ['Supply the old sign · “Take the Moon gate.”','scan-moon'],
  ['Supply the parade notice · “The lantern parade starts at sunset.”','scan-parade'],
  ['Supply today\'s notice · “Moon route closed. The tower bell answers the five-point lantern mark.”','scan-star']
];
const NOTE_TRAYS=[
  ['Offer the 18:00 note · “They are holding me in the Lantern Loft.”','relay-context-loft'],
  ['Offer the 18:20 note · “They moved me from the Lantern Loft to the Bell Yard.”','relay-context-yard']
];
function tutorialStage(s,complete){
  if(complete)return['LEVEL 1 · COMPLETE',s.relay_stage==='done'?'Mira heard you.':'The deeper gate is open.',s.relay_stage==='done'?'Your friend is alive. The receiver holds her reply while you plan the way deeper inside.':'You restored enough speech to read the changing route and found the way forward.'];
  if(s.round===1&&s.status==='success'&&s.relay_stage!==undefined){
    if(s.relay_stage==='none')return['LEVEL 1 · A SIGNAL','Someone is still out there.','A receiver glows beyond the open gate. Walk over and try to reach your friend.'];
    if(s.relay_stage==='done')return['LEVEL 1 · MESSAGE DELIVERED','Mira answers.','Your message reached her holding area. The way to your friends is still sealed, but you are no longer alone.'];
    if(s.relay_stage==='revealed')return['LEVEL 1 · RELAY',s.relay_context==='yard'?'The receiver finds Mira.':'No reply from that holding area.',s.relay_context==='yard'?'Your message reached the place in the later note. Send it to Mira.':'Compare the two notes on the receiver, offer the other one and try again. Your first decisions are kept.'];
    return['LEVEL 1 · RELAY','Find where Mira is waiting.',s.relay_case?.goal||'Use the two notes to send a message.'];
  }
  const repair=repairStep(s);
  if(repair)return[repair.stage,repair.title,repair.detail];
  if(s.status==='success')return['LEVEL 1 · COMPLETE','Route found.','The changed context opened the deeper gate. Finish when you are ready.'];
  if(s.status==='wrong')return['LEVEL 1 · RECOVER','Wrong route.','Nothing is lost. Compare the route boards, supply a better sign and try again.'];
  if(s.clue==='none')return['LEVEL 1 · FIRST MISSION','Find the current route.','Three route boards stand here and they disagree. Read them, then supply one sign to the machine.'];
  if(s.prediction==='none')return['LEVEL 1 · FIRST MISSION','Predict the gate.','Before running the machine, predict the output from only the sign you supplied.'];
  if(s.pieces===0&&s.loop_prediction==='none'&&s.available_actions?.some(a=>a.startsWith('loop-')))return['LEVEL 1 · FIRST MISSION','Predict how the input grows.','Decide what each new prediction will receive, before the first word exists.'];
  return['LEVEL 1 · FIRST MISSION','Build the route sentence.','Use the same word-by-word loop, now with less help.'];
}
function render(){
  const s=view(),a=session.attempt,complete=ours()&&a.status==='submitted';
  practice.bind(a?.id,ours()&&!s.powered&&s.round===0&&!complete);
  if(inOpening){setExperienceMode('opening');return;}
  const mode=!ours()?'entry':complete?'complete':s.round===0?'tutorial':'mission';
  setExperienceMode(mode);
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
  const relay=Boolean(s.relay_stage&&s.relay_stage!=='none');
  const [stage,goal,detail]=tutorialStage(s,complete);text('#stage-name',stage);text('#goal',goal);text('#detail',detail);
  $('#engine').dataset.anchor=controlStep!=='done'?'zip':(relay||(complete&&s.relay_stage==='done'))?'friend-signal':'socket';
  $('#engine').setAttribute('aria-label',controlStep!=='done'?'Control practice':'Message machine');
  host.dataset.tutorialWorldTarget=controlStep==='done'&&repair?.focus==='world'?(repair.target||''):'';
  host.dataset.tutorialWorldAction=controlStep==='done'&&repair?.focus==='world'?(repair.primaryAction||''):'';
  host.dataset.tutorialInteractionStep=controlStep==='done'?(repair?.id||''):'';
  const shownOutput=relay?s.relay_output:s.output;
  $('#output').replaceChildren();for(let i=0;i<4;i++){const span=document.createElement('span');span.textContent=shownOutput[i]||'·';if(!shownOutput[i])span.className='empty';$('#output').append(span);}
  text('#context',relay?[s.relay_case.base,s.relay_case.notes[s.relay_context]||'Choose a note.',['revealed','done'].includes(s.relay_stage)?s.relay_case.prefix:''].filter(Boolean).join(' '):s.context.join(' ')||'Waiting for power.');
  text('#engine-label',relay?'MESSAGE RECEIVER · PRISON RELAY':complete?(s.relay_stage==='done'?'MESSAGE RECEIVER · REPLY':'MESSAGE MACHINE · ROUTE OPEN'):s.round===1?'MESSAGE MACHINE · LEVEL 1':'MESSAGE MACHINE · TUTORIAL');
  $('#inspect').hidden=s.round===0||relay;
  $('#actions').replaceChildren();
  if(complete){button('Look deeper into the prison','ending');button('Play Level 1 again','again',false);}
  else if(s.relay_stage==='done')button('Finish Level 1 →','finish');
  else if(relay&&s.relay_stage==='revealed'){
    if(s.relay_context==='yard')button('Send the message to Mira','relay-finish');
    statusLine(`The selected note produced ${s.relay_output.join(' ')}. ${s.relay_prediction===s.relay_context?'Your destination prediction matched.':'The machine followed the selected note, not your destination prediction.'} ${s.relay_input_prediction==='growing'?'The next prediction used the input plus Meet.':'The next prediction also needs Meet, the word already generated.'}`);
    if(s.relay_context!=='yard')for(const [label,action] of NOTE_TRAYS)tray(label,action);
  }
  else if(relay){
    if(s.relay_context==='none')for(const [label,action] of NOTE_TRAYS)tray(label,action);
    else if(s.relay_prediction==='none'){tray('Predict: message goes to the Lantern Loft','relay-predict-loft');tray('Predict: message goes to the Bell Yard','relay-predict-yard');}
    else if(s.relay_input_prediction==='none'){tray('Predict: each step receives the request + note again','relay-input-original');tray('Predict: each step also receives Meet','relay-input-growing');}
    else button('Run the relay →','relay-run');
  }
  else if(s.round===1&&s.status==='success'&&s.relay_stage==='none')button('Answer the signal','relay-start');
  else if(repair)button(repair.actionLabel,repair.primaryAction);
  else if(s.status==='success')button('Finish Level 1 →','finish');
  else if(s.round===1&&s.status==='wrong'){
    statusLine(`The machine produced “${s.output.join(' ')}.” because the sign you supplied pointed there. Compare the boards, then offer a different sign.`);
    for(const [label,action] of SCAN_TRAYS)tray(label,action);
  }
  else if(s.round===1&&s.clue==='none')for(const [label,action] of SCAN_TRAYS)tray(label,action);
  else if(s.round===1&&s.prediction==='none'){
    tray('Predict: the machine will say Moon','predict-moon');tray('Predict: the machine will say Star','predict-star');tray('Predict: the machine will say Sun','predict-sun');
    if(s.hinted){
      statusLine('Hint: Read the INPUT line above. The machine only uses the sign you supplied, even if another sign is newer. Which gate does that supplied sign point toward?',{learningHint:'route'});
    }else button('Ask for a hint','hint',false);
  }
  else if(s.round===1&&s.pieces===0&&s.loop_prediction==='none'&&s.available_actions?.some(x=>x.startsWith('loop-'))){
    tray('Predict: each step receives the same input again','loop-same');
    tray('Predict: each step also receives every generated word','loop-grows');
  }
  else{button(s.pieces===0?'Make first word':s.pieces<4?'Next word':'Speak to gate →',s.pieces<4?'step':'send');}
  if(relay&&s.relay_stage==='choosing'&&s.relay_prediction!=='none'){
    const committed=document.createElement('p');committed.dataset.relayCommitment='true';
    committed.textContent=`Your prediction: ${s.relay_prediction==='yard'?'Bell Yard':'Lantern Loft'}.`;
    if(s.relay_input_prediction!=='none')committed.textContent+=` Your next-input choice: ${s.relay_input_prediction==='growing'?'request, note, and Meet':'request and note, unchanged'}.`;
    $('#actions').append(committed);
  }
  if(!relay&&s.round===1&&s.prediction!=='none'&&s.status==='building'){
    const committed=document.createElement('p');committed.dataset.routeCommitment='true';
    committed.textContent=`Your first route prediction: ${{moon:'Moon',star:'Star',sun:'Sun'}[s.prediction]}.`;
    if(s.loop_prediction!=='none')committed.textContent+=` Your input rule: ${s.loop_prediction==='grows'?'every generated word joins the next input':'the input stays the same each step'}.`;
    $('#actions').append(committed);
  }
  $('#rewind').hidden=complete||!s.powered||s.status==='success'||s.pieces===0;
  text('#saved',session.busy?'Saving…':session.pending?'Not saved · retry available':complete?'Level saved · practice recorded':'Saved');
  let scene;
  if(complete)scene=s.relay_stage==='done'?'The Star gate is open. Mira’s reply glows on the receiver beyond it. A route continues deeper inside.':'The Star gate is open. A broken signal from your friends glows beyond it. A route continues deeper inside.';
  else if(s.round===0&&s.status!=='success')scene='You are Zip, the robot in the prison chamber. A huge Moon-marked exit blocks the way out.';
  else if(s.round===0)scene='The Moon door is open. Your speech engine works again, and a corridor leads into the first mission.';
  else if(s.status==='success')scene='The Star gate is open deeper in the prison.';
  else scene='Beyond the first chamber, three route boards stand in the wider corridor. A glowing five-point mark identifies the deeper gate.';
  host.setAttribute('aria-label',`Unknown prison beyond Bellweather. ${scene}`);
  text('#scene-description',`${scene} ${goal} ${detail} Input: ${$('#context').textContent}. Output: ${shownOutput.join(' ')||'none'}.`);
  const signal=$('[data-signal="friend"]');
  signal.textContent=s.relay_stage==='done'?'Mira: “Zip? You found me.”':'“Hel—p.” · Mira’s signal';
  const step=controlStep;$('#engine').classList.toggle('practicing',step!=='done');
  // Sign-reading beats must not let the card steal the boards' airtime.
  const readingBeat=step==='done'&&((s.round===1&&s.clue==='none')||(s.round===1&&s.status==='wrong')||(relay&&s.relay_stage==='choosing'&&s.relay_context==='none'));
  $('#engine').classList.toggle('compact',readingBeat);
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
async function act(action){
  if(blocked())return;
  if(action==='skip-controls'){practice.skip();render();return;}
  if(practice.step!=='done')return;
  await audio.unlock().catch(()=>{});
  if(action==='ending')return showEnding();
  if(action==='start'||action==='again'){await session.start('ai-01-first-words');return;}
  if(action!=='finish'&&!view().available_actions?.includes(action))return;
  await session.action(action);
}
function showEnding(){
  const result=session.attempt?.assessment?.transfer_observations;
  const context=result?(result.relevant_context?'You found the current clue and mapped its five-point mark to the Star gate.':'Your first context choice was stale or unrelated; you recovered without erasing it.') : '';
  const loop=result?.loop_prediction&&result.loop_prediction!=='none'?(result.loop_correct?' You predicted that each new word joins the next input.':' The next prediction receives the growing input, not the original input alone.'):' You watched each new word become part of the next input.';
  const relay=session.attempt?.assessment?.relay_transfer_observations;
  const relayReflection=relay?` In the relay, ${relay.relevant_context?'your first note located Mira':'you recovered from an earlier location without erasing that choice'}. ${relay.input_prediction_correct?'You predicted that Meet joins the next input.':'The relay showed that Meet joins the next input.'}`:'';
  text('#reflection',context+loop+relayReflection);
  text('#ending-signal',relay?'The receiver flickers. “Zip? You found me.” Mira is still trapped, but now she can hear you.':'A broken message flickers from the receiver beyond the gate: “Hel—p.”');
  dialog('#ending');
}
function flavor(title,detail){
  text('#choice-kicker','SOMETHING IN THE CELL');text('#choice-title',title);text('#choice-detail',detail);$('#choices').replaceChildren();
  dialog('#choice');
}
$('#start').onclick=()=>act('start');$('#rewind').onclick=()=>act('rewind');$('#retry').onclick=()=>session.retry();
$('#menu-open').onclick=()=>{if(practice.observe('menu'))render();dialog('#menu');};
host.addEventListener('game-control-used',event=>{
  if(ours()&&!inOpening&&!blocked()&&practice.observe(event.detail?.kind))render();
});
for(const marker of document.querySelectorAll('#markers [data-action]'))marker.addEventListener('click',()=>{const action=marker.dataset.action;if(view().available_actions?.includes(action))act(action);});
function togglePause(){paused=!paused;$('#paused').hidden=!paused;text('#pause',paused?'Resume the world':'Pause the world');pauseSystems();}
$('#pause').onclick=()=>{$('#menu').close();togglePause();}
$('#paused').onclick=togglePause;
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
function localRect(node,rect){if(!node||node.hidden)return null;const r=node.getBoundingClientRect();return r.width&&r.height?{left:r.left-rect.left,right:r.right-rect.left,top:r.top-rect.top,bottom:r.bottom-rect.top}:null;}
function frame(){
  const mode=root.dataset.experienceMode;
  if(!['tutorial','mission','complete'].includes(mode)){requestAnimationFrame(frame);return;}
  const s=view(),rect=host.getBoundingClientRect(),card=$('#engine'),mobile=rect.width<700;
  const bottomReserve=mobile?190:104;
  $('#actions').querySelectorAll('button').forEach(b=>b.disabled=Boolean(blocked()));$('#rewind').disabled=Boolean(blocked());
  const playRects=[localRect(host.querySelector('.game-view-tools'),rect),localRect(host.querySelector('.game-move-stick'),rect),localRect(host.querySelector('.game-controls-help'),rect)].filter(Boolean);
  const point=world.projectEntity(card.dataset.anchor||'socket');
  const anchored=point&&point.inFront;
  card.classList.toggle('parked',!anchored);
  const reading=card.classList.contains('compact');
  card.classList.toggle('parked-reading',Boolean(anchored&&reading&&mobile));
  if(!anchored){card.style.left='';card.style.top='';}
  else if(reading){card.style.left='';card.style.top='';}
  else{const placed=placeWorldMarker(card,point,{viewportWidth:rect.width,safeTop:mobile?64:88,safeBottom:Math.max(rect.height-bottomReserve,mobile?430:500),critical:true,xPadding:Math.min((card.offsetWidth||360)/2+10,rect.width/2-10),yOffset:18,avoidRects:playRects});
    if(mobile){card.style.left='';if(placed&&placed.placed)card.style.top=Math.max(64,Math.min(placed.y,rect.height*.4)-(card.offsetHeight||0))+'px';}}
  const cardRect=card.getBoundingClientRect();
  const cardOccupiesTop=(cardRect.top-rect.top)<150;
  const avoidRects=[...playRects,{left:cardRect.left-rect.left,right:cardRect.right-rect.left,top:cardRect.top-rect.top,bottom:cardRect.bottom-rect.top}];
  const safeTop=cardOccupiesTop?Math.max(76,cardRect.bottom-rect.top+10):76;
  const safeBottom=Math.max(safeTop+12,Math.min(cardOccupiesTop?rect.height:cardRect.top-rect.top-12,rect.height-bottomReserve));
  const relay=Boolean(s.relay_stage&&s.relay_stage!=='none');
  for(const marker of $('#markers').children){
    const anchor=world.projectEntity(marker.dataset.anchor),wrongRound=marker.dataset.round!==undefined&&Number(marker.dataset.round)!==s.round;
    const available=marker.dataset.action?s.available_actions?.includes(marker.dataset.action):true;
    if(marker.dataset.action){marker.disabled=Boolean(blocked()||!available);marker.classList.toggle('chosen',marker.dataset.clue===s.clue);}
    const tutorialTarget=marker.classList.contains('tutorial-target-marker');
    const targetMismatch=tutorialTarget&&(marker.dataset.anchor!==host.dataset.tutorialWorldTarget||marker.dataset.action!==host.dataset.tutorialWorldAction||!available);
    const critical=tutorialTarget||marker.dataset.critical==='true';
    const guidable=critical?Boolean(anchor?.inFront):Boolean(anchor?.visible);
    marker.hidden=!guidable||wrongRound||inOpening||!ours()||targetMismatch||(marker.dataset.relay&&!relay)||(marker.classList.contains('notice-marker')&&marker.dataset.relay===undefined&&s.status==='success')||(marker.dataset.signal&&s.status!=='success')||(marker.dataset.anchor==='star-label'&&s.status==='success');
    if(anchor&&!marker.hidden){
      const placement=placeWorldMarker(marker,anchor,{viewportWidth:rect.width,safeTop,safeBottom,critical,avoidRects});
      if(!placement.placed||(!critical&&!placement.insideSafeArea))marker.hidden=true;
      else{const footprint=marker.getBoundingClientRect();avoidRects.push({left:footprint.left-rect.left,right:footprint.right-rect.left,top:footprint.top-rect.top,bottom:footprint.bottom-rect.top});}
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
  const noteAction=target==='relay-note-a'?'relay-context-loft':target==='relay-note-b'?'relay-context-yard':null;
  if(noteAction&&s.available_actions?.includes(noteAction))act(noteAction);
  if(target==='friend-signal'&&s.available_actions?.includes('relay-start'))act('relay-start');
  if(target==='friend-cube')flavor('A very companionable cube.','Someone painted a heart on a spare power cube. It may belong to one of the missing robots.');
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
window.FirstWordsReview={
  get state(){return view();},
  get runtime(){return runtime.stats();},
  get audio(){return audio.stats();},
  audioCapture:{
    start:()=>audio.startCapture(),
    stop:()=>audio.stopCapture()
  }
};
window.addEventListener('pagehide',()=>audio.dispose(),{once:true});boot();
