import {getGameRuntime,createGameRuntime} from './game-runtime.js';
import {getPreferences} from './preferences.js';
import {openGameOpening} from './game-opening.js';
import {createGameAudio} from './game-audio.js';
import {createLearningSession} from './learning-session.js';
import {createTutorialFlow,selectStateTutorialStep} from './tutorial-flow.js';
import {createExperienceModeController} from './experience-mode.js';
import {placeWorldMarker,chromeClearance,projectedEntityBox,focalClearanceBox} from './world-marker-layout.js';
import {fitBoundedSurface} from './surface-fit.js';
import * as chapter from './first-words-world.js';

// Every preference the player can set is read from the shared registry, so this page never
// holds a second copy of a setting another surface also paints (rule I11).
const preferences=getPreferences();
const $=s=>document.querySelector(s),runtime=getGameRuntime(),audio=createGameAudio(preferences),host=$('#world');
const initial={round:0,pieces:0,status:'building',powered:false,output:[],context:[],moves:0};
let paused=false,inOpening=false,ready=false,presented=null,lastCue=null,lastFit=0;
const reduced=()=>preferences.get('motion');
// The mission/complete stage card is opt-in: a world-anchored machine toggle carries
// the short goal while closed, and the card opens for the player or on feedback beats.
let cardOpen=false,cardStateKey='',lastExperienceMode=null;
let stagedSource=null,inspectedSource=null,sourceAttempt=null;
const sourceName=key=>chapter.routeSources[key]?.name||'sign';
function inspectSource(key){
  const s=view(),source=chapter.routeSources[key];
  if(!source||s.round!==1||!['none',undefined].includes(s.relay_stage)||
     (s.clue!=='none'&&s.status!=='wrong'))return;
  inspectedSource=key;
  $('#source-inspection').dataset.anchor=source.anchor;
  text('#source-name',source.name);
  text('#source-text',s.case.notes[key]);
  text('#source-stage',`Carry ${source.name.toLowerCase()}`);
  $('#source-inspection').hidden=false;
  cardOpen=false;syncCardVisibility();
  $('#source-stage').focus();
}
function stageSource(){
  if(!inspectedSource)return;
  stagedSource=inspectedSource;
  inspectedSource=null;
  $('#source-inspection').hidden=true;
  render();
  $('#machine-toggle').focus();
}
function closeSource(){inspectedSource=null;$('#source-inspection').hidden=true;}
// Fresh entry mounts the first prologue composition behind the loading layer. Do not
// instantiate the prison mission first and then flash it while learner state resolves.
let world=runtime.showStory(chapter,host,0,{reducedMotion:reduced()});
const session=createLearningSession(render);
const practice=createTutorialFlow(chapter.controlTutorialSpec);
const ours=()=>['first-words-1','first-words-2','first-words-3'].includes(session.attempt?.snapshot?.word_machine?.version);
const growingBeat=s=>session.attempt?.snapshot?.word_machine?.version==='first-words-3'&&s.round===1&&s.pieces===1;
const sourceInferenceMode=s=>s.source_inference!==undefined;
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
function syncCardVisibility(){
  const mode=root.dataset.experienceMode;
  if(!['tutorial','mission','complete'].includes(mode)){$('#machine-toggle').hidden=true;return;}
  // Control practice is a transparent floating prompt at the character (rung 4),
  // so it stays open. Once bearings are learned the message machine is opt-in in
  // BOTH tutorial and mission: a world toggle carries the goal, world markers
  // carry the verbs. Auto-summoning the panel over the play space is a P3/B1 defect.
  const inPractice=mode==='tutorial'&&practice.step!=='done';
  const inDialog=Boolean(document.querySelector('dialog[open]'));
  const open=(inPractice||cardOpen)&&!inDialog;
  $('#engine').hidden=!open;
  $('#card-close').hidden=!(open&&!inPractice);
  $('#machine-toggle').hidden=open||inDialog;
}
function pauseSystems(){const value=paused||Boolean(document.querySelector('dialog[open]'));runtime.setPaused(value);audio.setPaused(value);}
function dialog(selector){$(selector).showModal();pauseSystems();syncCardVisibility();}
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',()=>{pauseSystems();syncCardVisibility();}));
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.addEventListener('pointerdown',()=>audio.unlock().catch(()=>{}),{capture:true});
document.addEventListener('keydown',()=>audio.unlock().catch(()=>{}),{capture:true});
function button(label,action,primary=true){const b=document.createElement('button');b.className=primary?'primary':'';b.dataset.action=action;b.disabled=Boolean(blocked());b.onclick=()=>act(action);
  // I10: an option may carry the world text it offers after its own name. The name is
  // the decision and never sheds; the quote is a rung below it, so a tight surface gives
  // the quote up before it gives up the choice, and the full text stays in the label.
  // The quote sits below a beat's causal recap line: the notice boards carry that text in
  // the world already, while the recap is the lesson and nothing else repeats it.
  const name=label.split(' · ')[0],quote=label.slice(name.length+3);
  b.setAttribute('aria-label',label);
  if(quote){const shown=document.createElement('span');shown.textContent=name;const extra=document.createElement('span');extra.className='option-quote';extra.dataset.shedItem='22';extra.textContent=' · '+quote;b.append(shown,extra);}
  else b.textContent=name;
  $('#actions').append(b);}
const tray=(label,action)=>button(label,action,false);
// Anything a beat drops into the decision container that is not a decision is a rung
// (guide I10): the recap prose and the hint sit below the choice, so a tight surface
// gives them up before it lets a button fall past the sheet's edge. The rank is above
// the word readout, the INPUT restatement and an option's quoted text, which the world
// boards already carry, and below nothing else: the recap is the beat's causal lesson.
// A learning hint is instruction, so the shed ladder may not hide it for lack of room
// (guide I10): the beat shortens instead. Ordinary status prose keeps rank 25 and sheds.
function statusLine(message,dataset){const p=document.createElement('p');p.setAttribute('role','status');p.dataset.shedItem='25';p.textContent=message;if(dataset){Object.assign(p.dataset,dataset);if(dataset.learningHint)p.dataset.critical='true';}$('#actions').append(p);return p;}
async function command(path,body={}){
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Learning-Command':'1'},body:JSON.stringify(body)});
  let result={};try{result=await response.json();}catch(_){}
  if(!response.ok)throw new Error(result.message||`Request failed (${response.status})`);
  return result;
}
const repairStep=s=>s.round===0?selectStateTutorialStep(chapter.speechRepairTutorialSpec,s):null;
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
  if(growingBeat(s)&&s.loop_prediction==='none')return['LEVEL 1 · INPUT','What reaches the machine next?','Open has appeared. Predict whether the next input also receives that word.'];
  if(growingBeat(s)&&s.source_inference==='none')return['LEVEL 1 · SOURCE','Gate or none?','Name the gate the inserted sign supports, or say that it names none.'];
  if(s.round===1&&s.pieces===0&&s.prediction==='none'&&s.available_actions?.includes('step'))return['LEVEL 1 · FIRST WORD','Run the machine once.','Only the inserted sign is supplied. The other corridor signs remain outside the machine.'];
  if(!sourceInferenceMode(s)&&s.prediction==='none')return['LEVEL 1 · FIRST MISSION','Predict the gate.','Before running the machine, predict the output from only the sign you supplied.'];
  if(s.pieces===0&&s.loop_prediction==='none'&&s.available_actions?.some(a=>a.startsWith('loop-')))return['LEVEL 1 · FIRST MISSION','Predict how the input grows.','Decide what each new prediction will receive, before the first word exists.'];
  return['LEVEL 1 · FIRST MISSION','Build the route sentence.','Use the same word-by-word loop, now with less help.'];
}
function render(){
  const s=view(),a=session.attempt,complete=ours()&&a.status==='submitted';
  if(a?.id!==sourceAttempt){sourceAttempt=a?.id;stagedSource=null;closeSource();}
  if(s.round!==1||s.status==='success'||(stagedSource&&s.clue===stagedSource)){
    stagedSource=null;closeSource();
  }
  practice.bind(a?.id,ours()&&!s.powered&&s.round===0&&!complete);
  if(inOpening){setExperienceMode('opening');syncCardVisibility();return;}
  const mode=!ours()?'entry':complete?'complete':s.round===0?'tutorial':'mission';
  setExperienceMode(mode);
  if(lastExperienceMode!==mode){lastExperienceMode=mode;cardOpen=false;}
  $('#error').hidden=!session.error;if(session.error)text('#error',session.error.code==='ACTIVE_ATTEMPT'?'This run is already active. Reload to resume it.':session.error.message);
  $('#retry').hidden=!session.pending||session.busy;
  const other=a?.status==='draft'&&!ours();$('#resume-other').hidden=true;
  if(other){$('#start').disabled=false;text('#start','Enter the prologue →');}
  if(!ours()){syncCardVisibility();return;}
  const key=a.id+':'+a.revision;
  const feedbackBeat=!complete&&(s.status==='wrong'||s.relay_stage==='revealed'||(s.round===1&&s.status==='success'));
  // I8: a narrow viewport cannot hold a readable decision sheet inside the coverage
  // budget, so a beat may never summon one unasked there — the anchored toggle keeps
  // carrying the result line and the sheet stays opt-in.
  const narrow=host.getBoundingClientRect().width<700;
  if(feedbackBeat&&cardStateKey!==key&&!narrow)cardOpen=true;
  cardStateKey=key;
  if(!inOpening&&presented!==key){
    world=runtime.showMission(chapter,host,s,{reducedMotion:reduced()});presented=key;pauseSystems();
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
  $('#engine').dataset.anchor=controlStep!=='done'?'zip':(relay||(complete&&s.relay_stage==='done'))?'friend-signal':s.round===1?'route-machine':'socket';
  $('#engine').setAttribute('aria-label',controlStep!=='done'?'Control practice':'Message machine');
  $('#machine-toggle').dataset.anchor=$('#engine').dataset.anchor;
  text('#machine-toggle',s.round===0?'Inspect engine':stagedSource?`CARRY ${sourceName(stagedSource).toUpperCase()} → ENGINE`:'OPEN ENGINE');
  $('#machine-toggle').setAttribute('aria-label',stagedSource?`Carry ${sourceName(stagedSource)} to the message machine`:'Open the message machine');
  $('#machine-toggle').setAttribute('aria-description',goal);
  host.dataset.tutorialWorldTarget=controlStep==='done'&&repair?.focus==='world'?(repair.target||''):'';
  host.dataset.tutorialWorldAction=controlStep==='done'&&repair?.focus==='world'?(repair.primaryAction||''):'';
  host.dataset.tutorialInteractionStep=controlStep==='done'?(repair?.id||''):'';
  const shownOutput=relay?s.relay_output:s.output;
  const readoutInput=relay?[s.relay_case?.base,s.relay_case?.notes?.[s.relay_context]]:s.input||[];
  text('#readout-request',readoutInput[0]||'Awaiting a request');
  text('#readout-supplied',readoutInput[1]||'No clue supplied yet');
  text('#readout-words',shownOutput?.length?shownOutput.join(' '):'No words yet');
  $('#output').replaceChildren();for(let i=0;i<4;i++){const span=document.createElement('span');span.textContent=shownOutput[i]||'·';if(!shownOutput[i])span.className='empty';$('#output').append(span);}
  const visibleInput=growingBeat(s)&&s.loop_prediction==='none'?s.input:s.context;
  text('#context',relay?[s.relay_case.base,s.relay_case.notes[s.relay_context]||'Choose a note.',['revealed','done'].includes(s.relay_stage)?s.relay_case.prefix:''].filter(Boolean).join(' '):visibleInput.join(' ')||'Waiting for power.');
  text('#engine-label',relay?'MESSAGE RECEIVER · PRISON RELAY':complete?(s.relay_stage==='done'?'MESSAGE RECEIVER · REPLY':'MESSAGE MACHINE · ROUTE OPEN'):s.round===1?'MESSAGE MACHINE · LEVEL 1':'MESSAGE MACHINE · TUTORIAL');
  $('#inspect').hidden=s.round===0||relay;
  $('#actions').replaceChildren();$('#actions').removeAttribute('data-layout');
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
    // I10: the recovery recap owes only the cause, because the two option labels already
    // say what to do next (I5/I7) and a longer sentence costs the sheet its decision at
    // the accessibility viewport.
    statusLine(sourceInferenceMode(s)&&s.case.source_support?.[s.clue]==='no-gate'
      ?`The supplied sign named no gate. The toy still said “${s.output.join(' ')},” and the gate stayed shut.`
      :`The toy said “${s.output.join(' ')},” but that route stayed shut.`);
    // I7: a recovery beat must not re-offer the choice that already produced this
    // exact output — the words promise a different sign, so the tray must agree.
    // Same rule the relay recovery already follows below.
    if(stagedSource&&stagedSource!==s.clue)button(`Insert ${sourceName(stagedSource).toLowerCase()} into machine`,chapter.routeSources[stagedSource].action);
    else statusLine('Inspect a different corridor sign, carry it here, then insert it in the machine.',{learningHint:'source'});
  }
  else if(s.round===1&&s.clue==='none'){
    if(stagedSource)button(`Insert ${sourceName(stagedSource).toLowerCase()} into machine`,chapter.routeSources[stagedSource].action);
    else statusLine('Inspect a corridor sign, carry it here, then insert it in the machine.',{learningHint:'source'});
  }
  else if(growingBeat(s)&&s.loop_prediction==='none'){
    tray('Next input: request and sign only','loop-same');
    tray('Next input: request, sign, and Open','loop-grows');
  }
  else if(growingBeat(s)&&s.source_inference==='none'){
    $('#actions').dataset.layout='two-column';
    if(s.hinted)statusLine('Hint: use only the supplied sign.',{learningHint:'route'});
    else statusLine(s.loop_prediction==='grows'?'Yes. Open joins the next input.':'Open also joins the next input.',{learningHint:'history'});
    tray('Moon','infer-moon');tray('Star','infer-star');
    tray('Sun','infer-sun');tray('No gate','infer-no-gate');
    if(!s.hinted)button('Ask for a hint','hint',false);
  }
  else if(s.round===1&&s.pieces===0&&s.prediction==='none'&&s.available_actions?.includes('step')){
    statusLine(`Only ${sourceName(s.clue).toLowerCase()} was supplied. The other signs remain outside the machine.`);
    button('Make first word','step');
  }
  else if(s.round===1&&!sourceInferenceMode(s)&&s.prediction==='none'){
    // The option name is the decision. "Predict:" is the question above it, repeated three
    // times, and at the accessibility viewport that repetition is what pushed the third
    // choice below the fold (guide I10: shorten what the options say).
    tray('The machine will say Moon','predict-moon');tray('The machine will say Star','predict-star');tray('The machine will say Sun','predict-sun');
    if(s.hinted){
      statusLine('Hint: it uses the sign you supplied, not the newer one.',{learningHint:'route'});
    }else button('Ask for a hint','hint',false);
  }
  else if(s.round===1&&s.pieces===0&&s.loop_prediction==='none'&&s.available_actions?.some(x=>x.startsWith('loop-'))){
    tray('Predict: each step receives the same input again','loop-same');
    tray('Predict: each step also receives every generated word','loop-grows');
  }
  else{
    if(growingBeat(s)&&s.source_inference!=='none'){
      const supported=s.case.source_support[s.clue],named=supported==='no-gate'?'no gate':`${supported[0].toUpperCase()}${supported.slice(1)} gate`;
      statusLine(supported==='no-gate'
        ?'This sign names no gate. Your first inference is kept. The toy may still write a fluent but unsupported route.'
        :`This sign supports ${named}. Your first inference is kept; the toy continues from this source.`,{learningHint:'source-feedback'});
    }
    button(s.pieces===0?'Make first word':s.pieces<4?'Next word':'Speak to gate →',s.pieces<4?'step':'send');
  }
  if(relay&&s.relay_stage==='choosing'&&s.relay_prediction!=='none'){
    const committed=document.createElement('p');committed.dataset.relayCommitment='true';committed.dataset.shedItem='45';
    committed.textContent=`Your prediction: ${s.relay_prediction==='yard'?'Bell Yard':'Lantern Loft'}.`;
    if(s.relay_input_prediction!=='none')committed.textContent+=` Your next-input choice: ${s.relay_input_prediction==='growing'?'request, note, and Meet':'request and note, unchanged'}.`;
    $('#actions').append(committed);
  }
  if(!relay&&s.round===1&&s.prediction!=='none'&&s.status==='building'){
    const committed=document.createElement('p');committed.dataset.routeCommitment='true';committed.dataset.shedItem='45';
    committed.textContent=`Your first route prediction: ${{moon:'Moon',star:'Star',sun:'Sun'}[s.prediction]}.`;
    if(s.loop_prediction!=='none')committed.textContent+=` Your input rule: ${s.loop_prediction==='grows'?'every generated word joins the next input':'the input stays the same each step'}.`;
    $('#actions').append(committed);
  }
  if(!relay&&s.round===1&&sourceInferenceMode(s)&&s.source_inference!=='none'&&s.status==='building'){
    const committed=document.createElement('p');committed.dataset.sourceCommitment='true';committed.dataset.shedItem='45';
    committed.textContent=`First source inference: ${s.source_inference==='no-gate'?'no gate':s.source_inference}. Input choice: ${s.loop_prediction==='grows'?'include Open':'original input only'}.`;
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
  text('#scene-description',`${scene} ${goal} ${detail} Input: ${$('#context').textContent.replace(/\.+$/,'')}. Output: ${shownOutput.join(' ')||'none'}.`);
  const signal=$('[data-signal="friend"]');
  signal.textContent=s.relay_stage==='done'?'Mira: “Zip? You found me.”':'“Hel—p.” · Mira’s signal';
  const step=controlStep;$('#engine').classList.toggle('practicing',step!=='done');$('#engine').classList.toggle('prompt',step!=='done');
  // Sign-reading beats must not let the card steal the boards' airtime.
  const readingBeat=step==='done'&&((s.round===1&&s.clue==='none')||(s.round===1&&s.status==='wrong')||(relay&&s.relay_stage==='choosing'&&s.relay_context==='none'));
  $('#engine').classList.toggle('compact',readingBeat);
  // World-focus tutorial steps: the world marker carries the verb, so the card
  // rides in the bottom band instead of dominating the scene (ladder rungs 1-3).
  $('#engine').classList.toggle('world-focus',s.round===0&&step==='done'&&practice.current?.focus==='world');
  if(step!=='done'){
    const current=practice.current;
    const title=current?.title||current?.skill||'Try the highlighted control.';
    const instructions=current?.instructions||{};
    const instruction=host.clientWidth<700?(instructions.touch||instructions.desktop||'Use the highlighted control.'):(instructions.desktop||'Use the highlighted control.');
    text('#stage-name','TUTORIAL · '+step.toUpperCase());text('#goal',title);text('#detail',instruction);
    text('#engine-label','GET YOUR BEARINGS');text('#scene-description',title+' '+instruction);
    $('#actions').replaceChildren();button('Skip control practice','skip-controls',false);
  }
  syncCardVisibility();
  // I10: fit the beat's decision inside its box now that its content is final. frame()
  // re-checks afterwards because a player's text size changes without any event.
  if(!$('#engine').hidden)fitBoundedSurface($('#engine'));
}
async function act(action){
  if(blocked())return;
  if(action==='skip-controls'){practice.skip();render();return;}
  if(practice.step!=='done')return;
  await audio.unlock().catch(()=>{});
  if(action==='ending')return showEnding();
  if(action==='start'||action==='again'){await session.start('ai-01-first-words');return;}
  if(action!=='finish'&&!view().available_actions?.includes(action))return;
  if(view().round===1&&action.startsWith('scan-')&&
     (!stagedSource||chapter.routeSources[stagedSource]?.action!==action))return;
  const suppliedSource=view().round===1&&action.startsWith('scan-');
  await session.action(action);
  // On a narrow screen the open decision sheet can shed the long INPUT line.
  // Return to the world carrier before asking for a prediction so the actual
  // committed source is legible at the machine.
  if(suppliedSource&&host.clientWidth<700){cardOpen=false;syncCardVisibility();}
}
function showEnding(){
  const result=session.attempt?.assessment?.transfer_observations;
  const context=result?(result.relevant_context?'You found the current clue and mapped its five-point mark to the Star gate.':'Your first context choice was stale or unrelated; you recovered without erasing it.') : '';
  const loop=result?.loop_prediction&&result.loop_prediction!=='none'?(result.loop_correct?' You predicted that each new word joins the next input.':' The next prediction receives the growing input, not the original input alone.'):' You watched each new word become part of the next input.';
  const relay=session.attempt?.assessment?.relay_transfer_observations;
  const relayReflection=relay?` In the relay, ${relay.relevant_context?'the note you offered located Mira':'you recovered from an earlier location without erasing that choice'}. ${relay.input_prediction_correct?'You predicted that Meet joins the next input.':'The relay showed that Meet joins the next input.'}`:'';
  text('#reflection',context+loop+relayReflection);
  text('#ending-signal',relay?'The receiver flickers. “Zip? You found me.” Mira is still trapped, but now she can hear you.':'A broken message flickers from the receiver beyond the gate: “Hel—p.”');
  dialog('#ending');
}
function flavor(title,detail){
  text('#choice-kicker','SOMETHING IN THE CELL');text('#choice-title',title);text('#choice-detail',detail);$('#choices').replaceChildren();
  dialog('#choice');
}
$('#start').onclick=()=>act('start');$('#rewind').onclick=()=>act('rewind');$('#retry').onclick=()=>session.retry();
$('#card-close').onclick=()=>{cardOpen=false;syncCardVisibility();};
$('#machine-toggle').onclick=()=>{closeSource();cardOpen=true;syncCardVisibility();};
$('#source-stage').onclick=stageSource;
function returnFromSource(){const key=inspectedSource;closeSource();document.querySelector(`[data-clue="${key}"]`)?.focus();}
$('#source-close').onclick=returnFromSource;
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&inspectedSource){returnFromSource();event.preventDefault();}});
$('#menu-open').onclick=()=>{if(practice.observe('menu'))render();dialog('#menu');};
host.addEventListener('game-control-used',event=>{
  if(ours()&&!inOpening&&!blocked()&&practice.observe(event.detail?.kind))render();
});
for(const marker of document.querySelectorAll('#markers [data-action],#markers [data-clue]'))marker.addEventListener('click',()=>{
  if(marker.dataset.clue){inspectSource(marker.dataset.clue);return;}
  const action=marker.dataset.action;if(view().available_actions?.includes(action))act(action);
});
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
// Rule I11: a control writes the registry and the registry repaints every carrier of that
// preference, so no surface can be left showing a stale reading. The 3D world is the one
// thing a motion change has to be rebuilt into.
const remountMotion=()=>{const camera=world.getPlayerView();runtime.disposeWorld({keepStage:true});world=runtime.showMission(chapter,host,view(),{reducedMotion:reduced()});world.restorePlayerView(camera);presented=null;render();};
for(const name of ['music','effects'])$('#'+name).onchange=e=>preferences.set(name,e.target.checked);
$('#mute').onclick=()=>preferences.set('sound',!preferences.get('sound'));
$('#reduced').onchange=e=>{preferences.set('motion',e.target.checked);remountMotion();};
preferences.hydrate();
let openingSequence=0;
function opening(replay=false){
  const storyRuntime=replay?createGameRuntime():runtime;inOpening=true;setExperienceMode('opening');audio.setPhase('home');
  const sequence=++openingSequence;
  const instance=openGameOpening({root:$('#adventure'),spec:chapter.openingSpec,runtime:storyRuntime,worldModule:chapter,replay,reducedMotion:reduced(),onExit:async()=>{
    observer.disconnect();
    if(!replay&&!ours())await session.start('ai-01-first-words');
    inOpening=false;presented=null;world=runtime.showMission(chapter,host,view(),{reducedMotion:reduced()});pauseSystems();render();
  }});
  instance.element.classList.add('first-opening');
  // The opening carries the same global sound preference, not an "opening sound" of its own.
  const mute=document.createElement('button');mute.id='opening-mute';mute.dataset.preference='sound';preferences.render(mute);
  mute.onclick=()=>preferences.set('sound',!preferences.get('sound'));instance.element.querySelector('.rgi-corner').prepend(mute);
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
  // A player-opened card on a narrow viewport is a bottom sheet: it owns the lower
  // band, yields the direct-input chrome it replaces, and never floats over the
  // focal subject (guide B1 narrow-sheet clause).
  const sheet=mobile&&!card.hidden&&!card.classList.contains('prompt');
  root.classList.toggle('sheet-mode',sheet);
  card.classList.toggle('sheet',sheet);
  const bottomReserve=mobile?190:104;
  // I10: a player's own text size fires no event, so the bounded surface is re-fitted
  // on a slow timer. The steady state costs one overflow comparison per tick.
  if(performance.now()-lastFit>250){lastFit=performance.now();fitBoundedSurface(card);}
  $('#actions').querySelectorAll('button').forEach(b=>b.disabled=Boolean(blocked()));$('#rewind').disabled=Boolean(blocked());
  const playRects=[localRect(host.querySelector('.game-view-tools'),rect),localRect(host.querySelector('.game-move-stick'),rect),localRect(host.querySelector('.game-controls-help'),rect)].filter(Boolean);
  const chromeTop=chromeClearance([document.querySelector('.masthead')],{fallback:76});
  const point=card.hidden?null:world.projectEntity(card.dataset.anchor||'socket');
  const anchored=point&&point.inFront;
  card.classList.toggle('parked',Boolean(point)&&!anchored);
  card.classList.toggle('side-focus',!mobile&&sourceInferenceMode(s)&&s.round===1&&s.pieces===1&&s.source_inference==='none');
  const banded=sheet||card.classList.contains('compact')||card.classList.contains('world-focus')||card.classList.contains('side-focus');
  card.classList.toggle('parked-reading',Boolean(anchored&&card.classList.contains('compact')&&mobile&&!sheet));
  if(!anchored){card.style.left='';card.style.top='';}
  else if(banded){card.style.left='';card.style.top='';}
  else{const placed=placeWorldMarker(card,point,{viewportWidth:rect.width,safeTop:mobile?64:88,safeBottom:Math.max(rect.height-bottomReserve,mobile?430:500),critical:true,xPadding:Math.min((card.offsetWidth||360)/2+10,rect.width/2-10),yOffset:card.dataset.anchor==='zip'?200:18,avoidRects:playRects});
    // B3 containment: a tall card must not clip at the viewport top; park it low.
    if(!placed||!placed.placed||placed.y-(card.offsetHeight||0)<8){card.classList.add('parked');card.style.left='';card.style.top='';}
    else if(mobile){card.style.left='';card.style.top=Math.max(64,Math.min(placed.y,rect.height*.4)-(card.offsetHeight||0))+'px';}}
  const avoidRects=[...playRects];
  let safeTop=chromeTop,safeBottom=Math.max(chromeTop+12,rect.height-bottomReserve);
  if(!card.hidden){
    const cardRect=card.getBoundingClientRect();
    const cardOccupiesTop=(cardRect.top-rect.top)<150;
    safeTop=cardOccupiesTop?Math.max(chromeTop,cardRect.bottom-rect.top+10):chromeTop;
    safeBottom=Math.max(safeTop+12,Math.min(cardOccupiesTop?rect.height:cardRect.top-rect.top-12,rect.height-bottomReserve));
    avoidRects.push({left:cardRect.left-rect.left,right:cardRect.right-rect.left,top:cardRect.top-rect.top,bottom:cardRect.bottom-rect.top});
  }
  const relay=Boolean(s.relay_stage&&s.relay_stage!=='none');
  // Subject clearance: during the relay the receiver owns the scene; labels
  // yield to its screen box instead of burying it (guide B2, review 210a663).
  if(relay){
    const subject=projectedEntityBox(world,'friend-signal',{top:[0,1.35,.25],bottom:[0,-1.45,.25],left:[-.95,0,.25],right:[.95,0,.25],margin:8});
    if(subject)avoidRects.push(subject);
  }
  // B2 protagonist clearance: Zip is the focal subject of every play stage, so
  // anchored labels keep out of his body box *and* its focal ring instead of
  // reading across the character (the narrow-phone POWER LEAD marker buried him).
  const hero=focalClearanceBox(world,'zip',{top:[0,2.55,0],bottom:[0,-.15,0],left:[-.8,0,0],right:[.8,0,0],margin:12});
  if(hero)avoidRects.push(hero);
  for(const marker of $('#markers').children){
    if(marker.id==='source-inspection'&&!inspectedSource){marker.hidden=true;continue;}
    const projected=world.projectEntity(marker.dataset.anchor);
    const readout=marker.id==='learning-readout';
    const anchor=readout&&!projected?.inFront?world.projectEntity('zip'):projected;
    const wrongRound=marker.dataset.round!==undefined&&Number(marker.dataset.round)!==s.round;
    const available=marker.dataset.action?s.available_actions?.includes(marker.dataset.action):true;
    // P3: a visible world sign must never read as a dead control. Signs whose
    // action is currently spent stay readable and click-inert (the act() guards
    // no-op), they do not appear disabled.
    if(marker.dataset.action||marker.dataset.clue){marker.disabled=Boolean(blocked());marker.classList.toggle('chosen',Boolean(marker.dataset.clue&&marker.dataset.clue===s.clue));marker.classList.toggle('staged',Boolean(marker.dataset.clue&&marker.dataset.clue===stagedSource));}
    const tutorialTarget=marker.classList.contains('tutorial-target-marker');
    const targetMismatch=tutorialTarget&&(marker.dataset.anchor!==host.dataset.tutorialWorldTarget||marker.dataset.action!==host.dataset.tutorialWorldAction||!available);
    const critical=tutorialTarget||marker.dataset.critical==='true';
    // I9: a declared carrier of the beat's decision may slide and edge-cue, but may
    // not vanish because the screen got small.
    const carrier=marker.dataset.carrier!==undefined;
    const guidable=critical||carrier?Boolean(anchor?.inFront):Boolean(anchor?.visible);
    const toggleMarker=marker.dataset.machineToggle!==undefined;
    if(toggleMarker){
      // The machine toggle is the opt-in door while the card is away; it never
      // disappears with the camera, it parks, and a focused dialog owns the screen.
      marker.hidden=card.hidden&&!document.querySelector('dialog[open]')?Boolean(inOpening||!ours()):true;
      marker.classList.toggle('parked',!(anchor&&anchor.inFront));
    // I3: while the machine panel is open it owns the decision; its world
    // choice markers fold away (they return when the panel is put away).
    }else marker.hidden=(readout&&(!s.powered||practice.step!=='done'||(s.clue==='none'&&!relay)||!card.hidden))||(!card.hidden&&(marker.classList.contains('notice-marker')||marker.classList.contains('world-action-marker')||marker.id==='source-inspection'))||!guidable||wrongRound||inOpening||!ours()||targetMismatch||(marker.dataset.relay&&(s.relay_stage==='done'||!relay))||(marker.classList.contains('notice-marker')&&marker.dataset.relay===undefined&&s.status==='success')||(marker.dataset.signal&&s.status!=='success')||(marker.dataset.anchor==='star-label'&&s.status==='success');
    if(anchor&&!marker.hidden&&!(toggleMarker&&marker.classList.contains('parked'))){
      const placement=placeWorldMarker(marker,anchor,{viewportWidth:rect.width,safeTop,safeBottom,critical,parkWhenFull:carrier,yOffset:readout?48:12,avoidRects});
      if(!placement.placed||(!critical&&!carrier&&!placement.insideSafeArea))marker.hidden=true;
      else{const footprint=marker.getBoundingClientRect();avoidRects.push({left:footprint.left-rect.left,right:footprint.right-rect.left,top:footprint.top-rect.top,bottom:footprint.bottom-rect.top});}
    }else if(toggleMarker&&marker.classList.contains('parked')){marker.style.left='';marker.style.top='';}
  }
  requestAnimationFrame(frame);
}
host.addEventListener('click',async e=>{
  if(blocked()||e.target.closest('button,.game-player-controls'))return;
  const target=await world.pickSemanticAt(e.clientX,e.clientY),s=view();
  if(target==='loose-plug'||(s.round===0&&target?.startsWith('socket'))){
    // I1/CP4: acting on the machine performs the machine's verb in the world;
    // it never summons a panel about the machine. The diegetic toggle opens the panel.
    if(!s.powered)act('connect');else if(s.available_actions?.includes('step'))act('step');
  }
  if(s.round===1&&target?.startsWith('route-machine')){
    if(s.available_actions?.includes('step'))act('step');
    else if(s.available_actions?.includes('send'))act('send');
    else{cardOpen=true;syncCardVisibility();}
  }
  if(target?.startsWith('moon')&&s.available_actions?.includes('scan-moon'))act('scan-moon');
  const noticeSource=target?.startsWith('notice-old')?'moon':target?.startsWith('notice-parade')?'parade':target?.startsWith('notice-today')?'star':null;
  if(noticeSource)inspectSource(noticeSource);
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
  get colliders(){return runtime.colliderSnapshot();},
  get audio(){return audio.stats();},
  audioCapture:{
    start:()=>audio.startCapture(),
    stop:()=>audio.stopCapture()
  }
};
window.addEventListener('pagehide',()=>audio.dispose(),{once:true});boot();
