import {getGameRuntime,createGameRuntime} from './game-runtime.js';
import {getPreferences} from './preferences.js';
import {openGameOpening} from './game-opening.js';
import {createGameAudio} from './game-audio.js';
import {createLearningSession} from './learning-session.js';
import {createTutorialFlow,selectStateTutorialStep} from './tutorial-flow.js';
import {createExperienceModeController} from './experience-mode.js';
import {placeWorldMarker,parkWorldCarrier,chromeClearance,projectedEntityBox,focalClearanceBox} from './world-marker-layout.js';
import {fitBoundedSurface} from './surface-fit.js';
import {createReversibleChoice} from './reversible-choice.js';
import {createEntityMatcher,carrierAtFocus} from './world-interaction-focus.js';
import {createPendingSourceStore} from './pending-source.js';
import {probeWorldFeature} from './world-feature-visibility.js';
import * as chapter from './first-words-world.js';
const hitsEntity=createEntityMatcher(chapter.worldSpec.entities);

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
let stagedSource=null,stagedRelaySource=null,slottedSource=null,slottedRelaySource=null,inspectedSource=null,inspectedKind=null,sourceAttempt=null;
const pendingSources=createPendingSourceStore(sessionStorage,'first-words-source');
const pendingScope=kind=>({attemptId:session.attempt?.id,version:session.attempt?.snapshot?.word_machine?.version,kind});
let routeCorrectionSeen=false;
let continuationRunning=false,continuationReview=false,continuationIndex=0,continuationTimer=null,continuationWaitAt=0;
function pauseContinuation(){
  continuationRunning=false;
  if(continuationTimer){clearTimeout(continuationTimer);continuationTimer=null;}
}
function pauseContinuationAway(focusAction=null){
  if(!continuationRunning)return;
  pauseContinuation();
  render();
  if(focusAction)$('#actions button[data-action="'+focusAction+'"]')?.focus();
}
function pauseContinuationForHistory(){
  if(!continuationRunning)return;
  pauseContinuation();
  // Focus can precede click/Enter. Preserve the focused history button until
  // activation, instead of replacing #actions and swallowing that activation.
  const resume=$('#actions button[data-action="continuation-pause"]');
  if(resume){resume.dataset.action='continuation-run';resume.textContent='Resume continuation';resume.setAttribute('aria-label','Resume continuation');resume.onclick=runContinuation;}
}
async function advanceContinuation(){
  continuationTimer=null;
  if(!continuationRunning)return;
  const s=view();
  if(!situatedRoute()||s.round!==1||s.status!=='building'||s.source_inference==='none'||s.pieces>=4){pauseContinuation();render();return;}
  if(session.busy||session.pending||session.error){pauseContinuation();render();return;}
  if(blocked()){
    if(performance.now()-continuationWaitAt>20000){pauseContinuation();render();return;}
    continuationTimer=setTimeout(advanceContinuation,250);return;
  }
  if(!s.available_actions?.includes('step')){pauseContinuation();render();return;}
  await session.action('step');
  if(!continuationRunning)return;
  if(session.pending||session.error){pauseContinuation();render();return;}
  if(view().pieces>=4){pauseContinuation();render();return;}
  continuationWaitAt=performance.now();
  continuationTimer=setTimeout(advanceContinuation,2000);
}
function runContinuation(){
  if(continuationRunning)return;
  continuationReview=false;
  continuationRunning=true;
  continuationWaitAt=performance.now();
  continuationTimer=setTimeout(advanceContinuation,900);
  render();
}
function reviewContinuation(){
  pauseContinuation();
  continuationReview=true;
  continuationIndex=view().pieces;
  render();
}
const sourceName=key=>chapter.routeSources[key]?.name||chapter.relaySources[key]?.name||'sign';
function inspectSource(key){
  pauseContinuation();
  const s=view(),source=chapter.routeSources[key];
  if(!source||s.round!==1||!['none',undefined].includes(s.relay_stage)||
     (s.clue!=='none'&&s.status!=='wrong'))return;
  inspectedSource=key;
  inspectedKind='route';
  $('#source-inspection').dataset.anchor=source.anchor;
  text('#source-name',source.name);
  text('#source-text',s.case.notes[key]);
  text('#source-stage','Carry sign');
  $('#source-stage').setAttribute('aria-label',`${situatedRoute()?'Stage':'Carry'} ${source.name.toLowerCase()}`);
  $('#source-route-frame').hidden=!situatedRoute();
  $('#source-inspection').hidden=false;
  host.classList.toggle('route-inspecting',situatedRoute());
  cardOpen=false;syncCardVisibility();
  $('#source-stage').focus();
}
function inspectRelaySource(key){
  pauseContinuation();
  const s=view(),source=chapter.relaySources[key];
  if(!source||s.relay_stage!=='choosing'&&s.relay_stage!=='revealed')return;
  if(s.relay_stage==='choosing'&&s.relay_context!=='none')return;
  inspectedSource=key;inspectedKind='relay';
  $('#source-inspection').dataset.anchor=source.anchor;
  text('#source-name',source.name);
  text('#source-text',s.relay_case.notes[key]);
  text('#source-stage',`Carry ${source.name.toLowerCase()}`);
  $('#source-stage').setAttribute('aria-label',`Carry ${source.name.toLowerCase()}`);
  $('#source-route-frame').hidden=true;
  $('#source-inspection').hidden=false;
  cardOpen=false;syncCardVisibility();$('#source-stage').focus();
}
function stageSource(){
  if(!inspectedSource)return;
  if(inspectedKind==='relay')stagedRelaySource=inspectedSource;
  else {stagedSource=inspectedSource;if(situatedRoute())pendingSources.set(pendingScope('route'),stagedSource);}
  closeSource();
  render();
  $('#machine-toggle').focus();
}
function closeSource(){inspectedSource=null;inspectedKind=null;$('#source-inspection').hidden=true;host.classList.remove('route-inspecting');}
// Fresh entry mounts the first prologue composition behind the loading layer. Do not
// instantiate the prison mission first and then flash it while learner state resolves.
let world=runtime.showStory(chapter,host,0,{reducedMotion:reduced()});
const session=createLearningSession(render);
const tentative=createReversibleChoice(render);
const practice=createTutorialFlow(chapter.controlTutorialSpec);
const ours=()=>['first-words-1','first-words-2','first-words-3','first-words-4','first-words-5'].includes(session.attempt?.snapshot?.word_machine?.version);
const situatedRoute=()=>session.attempt?.snapshot?.word_machine?.version==='first-words-5';
const growingBeat=s=>['first-words-3','first-words-4','first-words-5'].includes(session.attempt?.snapshot?.word_machine?.version)&&s.round===1&&s.pieces===1;
const changedRelay=s=>s.relay_inference!==undefined;
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
const blocked=(duringWorldTransition=false)=>!ready||paused||inOpening||session.busy||session.pending||runtime.stats().contextLost||(!duringWorldTransition&&world.stats().animating)||document.querySelector('dialog[open]');
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
// Playback belongs to the active machine. Leaving it or entering an inspection
// freezes the saved prefix; activating its Run control remains a deliberate resume.
document.addEventListener('focusin',event=>{
  if(!continuationRunning)return;
  const history=event.target.closest?.('#actions button[data-action="continuation-review"]');
  if(history){pauseContinuationForHistory();return;}
  if(event.target=== $('#inspect')||!$('#engine').contains(event.target))pauseContinuationAway();
});
document.addEventListener('pointerdown',event=>{
  if(continuationRunning&&!$('#engine').contains(event.target))pauseContinuationAway();
},{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseContinuationAway();});
function button(label,action,primary=true,onClick=null){const b=document.createElement('button');b.className=primary?'primary':'';b.dataset.action=action;b.disabled=Boolean(blocked());b.onclick=onClick||(()=>act(action));
  // I10: an option may carry the world text it offers after its own name. The name is
  // the decision and never sheds; the quote is a rung below it, so a tight surface gives
  // the quote up before it gives up the choice, and the full text stays in the label.
  // The quote sits below a beat's causal recap line: the notice boards carry that text in
  // the world already, while the recap is the lesson and nothing else repeats it.
  const name=label.split(' · ')[0],quote=label.slice(name.length+3);
  b.setAttribute('aria-label',label);
  if(quote){const shown=document.createElement('span');shown.textContent=name;const extra=document.createElement('span');extra.className='option-quote';extra.dataset.shedItem='22';extra.textContent=' · '+quote;b.append(shown,extra);}
  else b.textContent=name;
  $('#actions').append(b);return b;}
const tray=(label,action)=>button(label,action,false);
const choiceScope=(kind)=>`${session.attempt?.id}:${session.attempt?.revision}:${kind}`;
function choiceTray(label,action,kind){
  const scope=choiceScope(kind),selected=tentative.selected(scope)===action;
  const b=button(label,action,false,()=>{
    tentative.select(scope,action);
    requestAnimationFrame(()=>$('#actions [data-choice-selected="true"]')?.focus());
  });
  b.dataset.choiceSelected=String(selected);b.setAttribute('aria-pressed',String(selected));
  return b;
}
function commitChoice(kind){
  const scope=choiceScope(kind),selected=tentative.selected(scope);
  if(selected&&view().available_actions?.includes(selected))tentative.commit(scope,act);
}
function checkChoice(kind){
  const b=button('Check my prediction','check-'+kind,true,()=>commitChoice(kind));
  b.dataset.requiresChoice=kind;
  b.hidden=!tentative.selected(choiceScope(kind));
  b.disabled=Boolean(blocked());
}
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
function sourceHandoff(kind){
  const relay=kind==='relay',carried=relay?stagedRelaySource:stagedSource;
  const placed=relay?slottedRelaySource:slottedSource;
  const target=relay?'receiver':'machine';
  if(!relay&&situatedRoute()){
    if(carried)button(`Insert and commit ${sourceName(carried).toLowerCase()}`,chapter.routeSources[carried].action);
    else statusLine(view().status==='wrong'?'Read another sign, then stage and insert it here to retry.':'Read a corridor sign, stage it, then insert it here. Inspection alone supplies nothing.',{learningHint:'source'});
    return;
  }
  if(placed){
    statusLine(`${sourceName(placed)} is in the ${target} slot. Only Commit source supplies it.`,{learningHint:'source-slot'});
    button('Commit source',relay?chapter.relaySources[placed].action:chapter.routeSources[placed].action);
    button('Remove from slot',`remove-${kind}-slot`,false,()=>{
      if(relay)slottedRelaySource=null;else slottedSource=null;
      render();
    });
  }
  if(carried&&carried!==placed){
    button(`Place ${sourceName(carried).toLowerCase()} in ${target} slot`,`place-${kind}-slot`,!placed,()=>{
      if(relay)slottedRelaySource=carried;else slottedSource=carried;
      render();
    });
  }else if(!placed)statusLine(`Inspect a ${relay?'dated note':'corridor sign'}, carry it to the ${target}, then place it in the slot.`,{learningHint:'source'});
}
function tutorialStage(s,complete){
  if(complete)return['LEVEL 1 · COMPLETE',s.relay_stage==='done'?'Mira heard you.':'The deeper gate is open.',s.relay_stage==='done'?'Your friend is alive. The receiver holds her reply while you plan the way deeper inside.':'You restored enough speech to read the changing route and found the way forward.'];
  if(s.round===1&&s.status==='success'&&s.relay_stage!==undefined){
    if(s.relay_stage==='none')return['LEVEL 1 · A SIGNAL','Someone is still out there.','A receiver glows beyond the open gate. Walk over and try to reach your friend.'];
    if(s.relay_stage==='done')return['LEVEL 1 · MESSAGE DELIVERED','Mira answers.','Your message reached her holding area. The way to your friends is still sealed, but you are no longer alone.'];
    if(s.relay_stage==='revealed')return['LEVEL 1 · RELAY',s.relay_context==='yard'?'The receiver finds Mira.':'No reply from Mira.',s.relay_context==='yard'?'Your message reached the place in her current note. Send it to Mira.':'Compare the dated notes, carry another to the receiver and try again. Your first decisions are kept.'];
    return['LEVEL 1 · RELAY','Find where Mira is waiting.',s.relay_case?.goal||'Use the dated notes to send a message.'];
  }
  const repair=repairStep(s);
  if(repair)return[repair.stage,repair.title,repair.detail];
  if(s.status==='success')return['LEVEL 1 · COMPLETE','Route found.','The changed context opened the deeper gate. Finish when you are ready.'];
  if(s.status==='wrong')return['LEVEL 1 · RECOVER','Wrong route.','Nothing is lost. Compare the route boards, supply a better sign and try again.'];
  if(situatedRoute()&&s.round===1&&s.pieces>0&&s.source_inference!=='none'&&s.status==='building')
    return['LEVEL 1 · CONTINUATION',continuationReview?`Input ${continuationIndex} of ${s.pieces}.`:s.pieces<4?'See the input grow.':'Test the finished command.',
      s.pieces<4?'Run the short toy continuation once. Pause and review every complete input at your own pace.':'The complete command is ready. Review its inputs or speak it to the world gate.'];
  if(s.clue==='none')return['LEVEL 1 · FIRST MISSION','Find the current route.','Three route boards stand here and they disagree. Read them, then supply one sign to the machine.'];
  if(growingBeat(s)&&s.loop_prediction==='none')return['LEVEL 1 · INPUT','What reaches the machine next?','Open has appeared. Predict whether the next input also receives that word.'];
  if(growingBeat(s)&&s.source_inference==='none'&&s.loop_prediction==='same'&&!routeCorrectionSeen)
    return['LEVEL 1 · INPUT','Open joins the next input.','Your choice left out Open. Actual next input: request, sign, and Open.'];
  if(growingBeat(s)&&s.source_inference==='none')return['LEVEL 1 · SOURCE','Which gate does this sign support?','Use only the inserted sign, not the route you hope is open.'];
  if(s.round===1&&s.pieces===0&&s.prediction==='none'&&s.available_actions?.includes('step'))return['LEVEL 1 · FIRST WORD','Run the machine once.','Only the inserted sign is supplied. The other corridor signs remain outside the machine.'];
  if(!sourceInferenceMode(s)&&s.prediction==='none')return['LEVEL 1 · FIRST MISSION','Predict the gate.','Before running the machine, predict the output from only the sign you supplied.'];
  if(s.pieces===0&&s.loop_prediction==='none'&&s.available_actions?.some(a=>a.startsWith('loop-')))return['LEVEL 1 · FIRST MISSION','Predict how the input grows.','Decide what each new prediction will receive, before the first word exists.'];
  return['LEVEL 1 · FIRST MISSION','Build the route sentence.','Use the same word-by-word loop, now with less help.'];
}
function render(){
  const s=view(),a=session.attempt,complete=ours()&&a.status==='submitted';
  if(a?.id!==sourceAttempt){pauseContinuation();continuationReview=false;sourceAttempt=a?.id;stagedSource=situatedRoute()?pendingSources.read(pendingScope('route'),Object.keys(chapter.routeSources)):null;stagedRelaySource=null;slottedSource=null;slottedRelaySource=null;routeCorrectionSeen=false;tentative.reset();closeSource();}
  if(situatedRoute()&&(s.round!==1||s.source_inference==='none'||s.status!=='building')){pauseContinuation();continuationReview=false;}
  if(s.round!==1||s.status==='success'||(stagedSource&&s.clue===stagedSource)){
    stagedSource=null;slottedSource=null;pendingSources.clear(pendingScope('route'));closeSource();
  }
  if(slottedSource&&s.clue===slottedSource)slottedSource=null;
  if(s.relay_context!=='none'&&s.relay_context===stagedRelaySource){stagedRelaySource=null;slottedRelaySource=null;}
  if(slottedRelaySource&&s.relay_context===slottedRelaySource)slottedRelaySource=null;
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
      const cue=complete?'finish':move==='relay-finish'?'rescue':move==='connect'?'connect':move==='step'?'piece':move==='send'?(s.status==='wrong'?'wrong':s.round===0?'rescue':'finish'):move?.startsWith('scan-')?'scan':move==='next'?'exit':null;
      if(cue)audio.cue(cue,key);
    }
    lastCue=key;
  }
  const repair=repairStep(s),controlStep=practice.step;
  const relay=Boolean(s.relay_stage&&s.relay_stage!=='none');
  const [stage,goal,detail]=tutorialStage(s,complete);text('#stage-name',stage);text('#goal',goal);text('#detail',detail);
  const routeCorrection=growingBeat(s)&&s.source_inference==='none'&&s.loop_prediction==='same'&&!routeCorrectionSeen;
  $('#detail').dataset.critical=routeCorrection?'true':'false';
  $('#engine').dataset.anchor=controlStep!=='done'?'zip':(relay||(s.round===1&&s.status==='success'&&s.relay_stage!==undefined))?'friend-signal':s.round===1?'route-machine':'socket';
  $('#engine').setAttribute('aria-label',controlStep!=='done'?'Control practice':relay?'Message receiver':'Message machine');
  $('#machine-toggle').dataset.anchor=$('#engine').dataset.anchor;
  const carried=relay?stagedRelaySource:stagedSource,slotted=relay?slottedRelaySource:slottedSource;
  const device=relay?'receiver':'message machine';
  const arriving=s.available_actions?.includes('relay-start');
  const directInsert=Boolean(situatedRoute()&&!relay&&carried&&s.available_actions?.includes(chapter.routeSources[carried].action));
  const directFirstWord=Boolean(situatedRoute()&&!relay&&s.round===1&&s.clue!=='none'&&s.pieces===0&&s.available_actions?.includes('step'));
  text('#machine-toggle',s.round===0?'Inspect engine':arriving?'ANSWER MIRA’S SIGNAL':directInsert?`INSERT ${sourceName(carried).toUpperCase()}`:directFirstWord?'MAKE FIRST WORD':slotted?`${sourceName(slotted).toUpperCase()} IN ${relay?'RECEIVER':'ENGINE'}`:carried?`CARRY ${sourceName(carried).toUpperCase()} → ${relay?'RECEIVER':'ENGINE'}`:situatedRoute()&&!relay&&s.clue!=='none'?'OPEN INPUT QUESTION':relay?'OPEN RECEIVER':'OPEN ENGINE');
  $('#machine-toggle').setAttribute('aria-label',arriving?'Answer Mira’s signal at the receiver':directInsert?`Insert and commit ${sourceName(carried)} at the message machine`:directFirstWord?'Make first word at the message machine':carried?`Carry ${sourceName(carried)} to the ${device}`:`Open the ${device}`);
  $('#machine-toggle').setAttribute('aria-description',goal);
  const carryToken=$('#carried-source'),slotToken=$('#slotted-source');
  carryToken.dataset.anchor='zip';
  text('#carried-source',carried&&!slotted?`ZIP CARRIES · ${sourceName(carried).toUpperCase()} · PUT DOWN`:'');
  carryToken.setAttribute('aria-label',`Put down pending ${sourceName(carried).toLowerCase()}`);
  const sourceQuestion=!relay&&growingBeat(s)&&s.loop_prediction!=='none'&&s.source_inference==='none'&&!routeCorrection;
  slotToken.dataset.anchor=sourceQuestion&&!situatedRoute()?chapter.routeSources[s.clue].anchor:relay?'friend-signal-label':'route-machine';
  const routeSource=chapter.routeSources[s.clue];
  const committedRoute=situatedRoute()&&!relay&&s.round===1&&s.clue!=='none'&&s.status!=='success';
  const support=committedRoute&&s.source_inference!=='none'?s.case.source_support[s.clue]:null;
  const committedSource=committedRoute?`${sourceName(s.clue).toUpperCase()} · IN MACHINE${support?` · ${support==='no-gate'?'NO GATE NAMED':`${support.toUpperCase()} NAMED`}`:''}`:'';
  text('#slotted-source',committedRoute?committedSource:slotted?`${sourceName(slotted).toUpperCase()} · IN ${relay?'RECEIVER':'MACHINE'} SLOT`:
    sourceQuestion?`SUPPLIED · ${s.hinted&&routeSource.cueText?routeSource.cueText:routeSource.decisionText}`:'');
  slotToken.classList.toggle('source-evidence',sourceQuestion&&!situatedRoute());
  slotToken.dataset.critical=sourceQuestion||committedRoute?'true':'false';
  host.dataset.tutorialWorldTarget=controlStep==='done'&&repair?.focus==='world'?(repair.target||''):'';
  host.dataset.tutorialWorldAction=controlStep==='done'&&repair?.focus==='world'?(repair.primaryAction||''):'';
  host.dataset.tutorialInteractionStep=controlStep==='done'?(repair?.id||''):'';
  const shownOutput=relay?s.relay_output:s.output;
  $('#output').dataset.critical=changedRelay(s)&&s.relay_pieces>0&&s.relay_stage==='choosing'?'true':'false';
  const completeRouteInput=situatedRoute()&&s.round===1&&s.clue!=='none'&&s.status==='building';
  $('#engine .input').dataset.critical=completeRouteInput?'true':'false';
  if(completeRouteInput&&s.pieces>0)$('#output').dataset.critical='true';
  const readoutInput=relay?[s.relay_case?.base,s.relay_case?.notes?.[s.relay_context]]:s.input||[];
  text('#readout-request',readoutInput[0]||'Awaiting a request');
  text('#readout-supplied',readoutInput[1]||'No clue supplied yet');
  text('#readout-source',committedSource);
  $('#readout-source-row').hidden=!committedSource;
  text('#readout-words',shownOutput?.length?shownOutput.join(' '):'No words yet');
  const wrongHistory=changedRelay(s)&&s.relay_stage==='choosing'&&s.relay_input_prediction!=='none'&&s.relay_input_prediction!=='full';
  const wrongRouteHistory=growingBeat(s)&&s.loop_prediction==='same';
  const omitted=s.relay_input_prediction==='latest'?'Meet':'Meet and at';
  const tutorialReadout=s.round===0&&s.pieces===1;
  // The request is part of every next input, including after the first toy word.
  // Shedding it made the carried readout look complete while teaching an incomplete input.
  $('#readout-request-row').hidden=false;
  text('#readout-feedback',wrongHistory?`Your choice left out ${omitted}. The next input includes every generated word.`:
    wrongRouteHistory?'Your choice left out Open. The next input includes the request, sign, and Open.':
    tutorialReadout?'Prepared toy words; real tokens may be smaller.':'');
  $('#readout-feedback').hidden=!$('#readout-feedback').textContent;
  $('#learning-readout').dataset.anchor=relay?'friend-signal-label':'zip-voice';
  $('#learning-readout').dataset.critical=wrongHistory||wrongRouteHistory?'true':'false';
  $('#learning-readout strong').textContent=relay?'NEXT INPUT TO RECEIVER':"NEXT INPUT TO ZIP'S ENGINE";
  $('#learning-readout strong').hidden=false;
  const reviewCount=continuationReview?Math.max(0,Math.min(continuationIndex,s.pieces)):null;
  const paintedOutput=reviewCount===null?shownOutput:shownOutput.slice(0,reviewCount);
  $('#output').replaceChildren();for(let i=0;i<4;i++){const span=document.createElement('span');span.textContent=paintedOutput[i]||'·';if(!paintedOutput[i])span.className='empty';$('#output').append(span);}
  const visibleInput=continuationReview?[...s.input,...s.output.slice(0,reviewCount)]:growingBeat(s)&&s.loop_prediction==='none'?s.input:s.context;
  text('#context',relay?(changedRelay(s)?s.relay_input:[s.relay_case.base,s.relay_case.notes[s.relay_context]||'Choose a note.',['revealed','done'].includes(s.relay_stage)?s.relay_case.prefix:'']).filter(Boolean).join(' '):visibleInput.join(' ')||'Waiting for power.');
  text('#engine-label',relay?'MESSAGE RECEIVER · PRISON RELAY':complete?(s.relay_stage==='done'?'MESSAGE RECEIVER · REPLY':'MESSAGE MACHINE · ROUTE OPEN'):s.round===1?'MESSAGE MACHINE · LEVEL 1':'MESSAGE MACHINE · TUTORIAL');
  $('#inspect').hidden=s.round===0||relay;
  $('#actions').replaceChildren();$('#actions').removeAttribute('data-layout');
  if(complete){button('Look deeper into the prison','ending');button('Play Level 1 again','again',false);}
  else if(s.relay_stage==='done')button('Finish Level 1 →','finish');
  else if(relay&&changedRelay(s)&&s.relay_stage==='revealed'){
    if(s.relay_context==='yard')button('Send the message to Mira','relay-finish');
    const support=s.relay_case.source_support[s.relay_context];
    statusLine(`${sourceName(s.relay_context)} ${support==='no-mira'?'did not locate Mira':`located Mira at ${s.relay_case.destinations[s.relay_context]}`}. The toy wrote “${s.relay_output.join(' ')}”; ${s.relay_context==='yard'?'Mira can receive this.':'Mira did not reply here.'} Your first choices remain saved.`);
    if(s.relay_context!=='yard')sourceHandoff('relay');
  }
  else if(relay&&changedRelay(s)){
    if(s.relay_context==='none')sourceHandoff('relay');
    else if(s.relay_inference==='none'){
      statusLine('What does the supplied note say about Mira’s location?',{learningHint:'relay-inference'});
      choiceTray('Lantern Loft','relay-infer-loft','relay-inference');choiceTray('Bell Yard','relay-infer-yard','relay-inference');choiceTray('No Mira location','relay-infer-no-mira','relay-inference');checkChoice('relay-inference');
    }
    else if(s.relay_pieces<2){
      statusLine(s.relay_pieces===0?'The source inference is saved. Generate the first word.':'Meet has appeared. Generate one more word, then decide what enters the next prediction.');
      button(s.relay_pieces===0?'Make first relay word':'Make next relay word','relay-piece');
    }
    else if(s.relay_input_prediction==='none'){
      statusLine('What enters the next prediction after Meet at?',{learningHint:'relay-history'});
      choiceTray('Request and note only','relay-input-original','relay-history');
      choiceTray('Request, note, and at only','relay-input-latest','relay-history');
      choiceTray('Request, note, Meet, and at','relay-input-full','relay-history');checkChoice('relay-history');
    }
    else{
      if(wrongHistory)statusLine(`Your choice omitted ${omitted}. The actual next input includes the request, note, Meet and at.`,{learningHint:'history-correction'});
      else statusLine('Yes. The actual next input includes the request, note, Meet and at.',{learningHint:'history-correction'});
      button('Run the relay →','relay-run');
    }
  }
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
    sourceHandoff('route');
  }
  else if(s.round===1&&s.clue==='none'){
    sourceHandoff('route');
  }
  else if(growingBeat(s)&&s.loop_prediction==='none'){
    choiceTray('Request and sign only','loop-same','route-history');
    choiceTray('Request, sign, and Open','loop-grows','route-history');checkChoice('route-history');
  }
  else if(routeCorrection){
    button('Use the full input →','ack-route-correction',false,()=>{routeCorrectionSeen=true;render();});
  }
  else if(growingBeat(s)&&s.source_inference==='none'){
    $('#actions').dataset.layout='two-column';
    if(s.hinted)statusLine('Hint: trust this sign.',{learningHint:'current-source'});
    choiceTray('Moon','infer-moon','route-inference');choiceTray('Star','infer-star','route-inference');
    choiceTray('Sun','infer-sun','route-inference');
    const none=choiceTray('No gate','infer-no-gate','route-inference');
    if(situatedRoute())none.textContent='None';
    checkChoice('route-inference');
    if(!s.hinted&&!wrongRouteHistory)button('Ask for a hint','hint',false);
  }
  else if(situatedRoute()&&!relay&&s.round===1&&s.pieces>0&&s.source_inference!=='none'&&s.status==='building'){
    if(continuationReview){
      $('#actions').dataset.layout='history';
      if(reviewCount>0)button('Previous input','review-previous',false,()=>{continuationIndex--;render();}).textContent='Back';
      if(reviewCount<s.pieces)button('Next input','review-next',false,()=>{continuationIndex++;render();}).textContent='Next';
      button('Return to current input','review-close',false,()=>{continuationReview=false;render();}).textContent='Current';
      if(s.pieces<4)button('Resume continuation','continuation-resume',true,runContinuation).textContent='Resume';
      else button('Speak command to gate','send').textContent='Speak';
    }else if(s.pieces<4){
      if(continuationRunning)button('Pause and review','continuation-pause',true,reviewContinuation);
      else button(s.pieces===1?'Run continuation':'Resume continuation','continuation-run',true,runContinuation);
      button('Review generated inputs','continuation-review',false,reviewContinuation);
    }else{
      button('Speak command to gate','send');
      button('Review generated inputs','continuation-review',false,reviewContinuation);
    }
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
  if(relay&&changedRelay(s)&&s.relay_stage==='choosing'&&s.relay_inference!=='none'){
    const committed=document.createElement('p');committed.dataset.relayCommitment='true';committed.dataset.shedItem='45';
    committed.textContent=`First Mira-location inference: ${s.relay_inference==='no-mira'?'none in this note':s.relay_case.destinations[s.relay_inference]}.`;
    if(s.relay_input_prediction!=='none')committed.textContent+=` First history choice: ${s.relay_input_prediction}.`;
    $('#actions').append(committed);
  }
  if(relay&&!changedRelay(s)&&s.relay_stage==='choosing'&&s.relay_prediction!=='none'){
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
  $('#engine').classList.toggle('source-question',situatedRoute()&&growingBeat(s)&&s.source_inference==='none');
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
async function act(action,{duringWorldTransition=false}={}){
  if(blocked(duringWorldTransition))return false;
  if(action==='skip-controls'){practice.skip();render();return;}
  if(practice.step!=='done')return false;
  await audio.unlock().catch(()=>{});
  if(action==='ending')return showEnding();
  if(action==='start'||action==='again'){await session.start('ai-01-first-words');return;}
  if(action!=='finish'&&!view().available_actions?.includes(action))return false;
  if(view().round===1&&action.startsWith('scan-')&&
     (!stagedSource||chapter.routeSources[stagedSource]?.action!==action))return false;
  if(changedRelay(view())&&action.startsWith('relay-context-')&&
     (!stagedRelaySource||chapter.relaySources[stagedRelaySource]?.action!==action))return false;
  const suppliedSource=view().round===1&&action.startsWith('scan-');
  await session.action(action);
  // On a narrow screen the open decision sheet can shed the long INPUT line.
  // Return to the world carrier before asking for a prediction so the actual
  // committed source is legible at the machine.
  if(suppliedSource&&host.clientWidth<700){cardOpen=false;syncCardVisibility();}
  return true;
}
function showEnding(){
  const result=session.attempt?.assessment?.transfer_observations;
  const context=result?(result.relevant_context?'You found the current clue and mapped its five-point mark to the Star gate.':'Your first context choice was stale or unrelated; you recovered without erasing it.') : '';
  const loop=result?.loop_prediction&&result.loop_prediction!=='none'?(result.loop_correct?' You predicted that each new word joins the next input.':' The next prediction receives the growing input, not the original input alone.'):' You watched each new word become part of the next input.';
  const relay=session.attempt?.assessment?.relay_transfer_observations;
  const relayReflection=relay?` In the relay, ${relay.relevant_context?'the note you offered located Mira':'you recovered from an earlier source without erasing that choice'}. ${relay.input_prediction_correct?'You kept the generated words in the next input.':'The relay showed that the full generated history joins the next input.'}`:'';
  text('#reflection',context+loop+relayReflection);
  text('#ending-signal',relay?'The receiver flickers. “Zip? You found me.” Mira is still trapped, but now she can hear you.':'A broken message flickers from the receiver beyond the gate: “Hel—p.”');
  dialog('#ending');
}
function flavor(title,detail){
  text('#choice-kicker','SOMETHING IN THE CELL');text('#choice-title',title);text('#choice-detail',detail);$('#choices').replaceChildren();
  dialog('#choice');
}
$('#start').onclick=()=>act('start');$('#rewind').onclick=()=>act('rewind');$('#retry').onclick=()=>session.retry();
$('#card-close').onclick=()=>{pauseContinuation();cardOpen=false;syncCardVisibility();};
let firstWordDispatching=false;
$('#machine-toggle').onclick=async()=>{
  closeSource();
  if(view().available_actions?.includes('relay-start')){act('relay-start');return;}
  if(situatedRoute()&&stagedSource&&view().round===1&&view().available_actions?.includes(chapter.routeSources[stagedSource].action)){
    act(chapter.routeSources[stagedSource].action);return;
  }
  if(situatedRoute()&&view().round===1&&view().clue!=='none'&&view().pieces===0&&view().available_actions?.includes('step')){
    if(firstWordDispatching)return;
    firstWordDispatching=true;
    try{
      // A state transition can still be animating when the world already offers
      // this action. Its learning command is safe to dispatch once; opening the
      // sheet before checking guards produced a second identical button on retry.
      if(await act('step',{duringWorldTransition:true})){cardOpen=true;syncCardVisibility();}
    }finally{firstWordDispatching=false;}
    return;
  }
  cardOpen=true;syncCardVisibility();
};
$('#carried-source').onclick=()=>{
  if(blocked())return;
  if(stagedRelaySource&&view().relay_stage!=='none')stagedRelaySource=null;
  else {stagedSource=null;pendingSources.clear(pendingScope('route'));}
  render();
};
$('#source-stage').onclick=stageSource;
function returnFromSource(){const key=inspectedSource,kind=inspectedKind;closeSource();document.querySelector(kind==='relay'?`[data-relay-source="${key}"]`:`[data-clue="${key}"]`)?.focus();}
$('#source-close').onclick=returnFromSource;
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&inspectedSource){returnFromSource();event.preventDefault();}});
$('#menu-open').onclick=()=>{if(practice.observe('menu'))render();dialog('#menu');};
host.addEventListener('game-control-used',event=>{
  if(ours()&&!inOpening&&!blocked()&&practice.observe(event.detail?.kind))render();
});
for(const marker of document.querySelectorAll('#markers [data-action],#markers [data-clue],#markers [data-relay-source]'))marker.addEventListener('click',()=>{
  if(marker.dataset.clue){inspectSource(marker.dataset.clue);return;}
  if(marker.dataset.relaySource){
    if(changedRelay(view()))inspectRelaySource(marker.dataset.relaySource);
    else if(view().available_actions?.includes(`relay-context-${marker.dataset.relaySource}`))act(`relay-context-${marker.dataset.relaySource}`);
    return;
  }
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
const remountMotion=()=>{pauseContinuation();const camera=world.getPlayerView();runtime.disposeWorld({keepStage:true});world=runtime.showMission(chapter,host,view(),{reducedMotion:reduced()});world.restorePlayerView(camera);presented=null;render();};
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
  $('#actions').querySelectorAll('button').forEach(b=>b.disabled=Boolean(blocked()||(b.dataset.requiresChoice&&!tentative.selected(choiceScope(b.dataset.requiresChoice)))));$('#rewind').disabled=Boolean(blocked());
  const playRects=[localRect(host.querySelector('.game-view-tools'),rect),localRect(host.querySelector('.game-move-stick'),rect),localRect(host.querySelector('.game-controls-help'),rect)].filter(Boolean);
  const hero=focalClearanceBox(world,'zip',{top:[0,2.55,0],bottom:[0,-.15,0],left:[-.8,0,0],right:[.8,0,0],margin:12});
  const chromeTop=chromeClearance([document.querySelector('.masthead')],{fallback:76});
  const point=card.hidden?null:world.projectEntity(card.dataset.anchor||'socket');
  const anchored=point&&point.inFront;
  card.classList.toggle('parked',Boolean(point)&&!anchored);
  card.classList.remove('side-focus');
  const banded=sheet||card.classList.contains('compact')||card.classList.contains('world-focus')||card.classList.contains('side-focus');
  card.classList.toggle('parked-reading',Boolean(anchored&&card.classList.contains('compact')&&mobile&&!sheet));
  if(!anchored){card.style.left='';card.style.top='';}
  else if(banded){card.style.left='';card.style.top='';}
  else{const placed=placeWorldMarker(card,point,{viewportWidth:rect.width,safeTop:mobile?64:88,safeBottom:Math.max(rect.height-bottomReserve,mobile?430:500),critical:true,xPadding:Math.min((card.offsetWidth||360)/2+10,rect.width/2-10),yOffset:card.dataset.anchor==='zip'?200:18,avoidRects:[...playRects,hero].filter(Boolean)});
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
  const sourceQuestion=!relay&&growingBeat(s)&&s.loop_prediction!=='none'&&s.source_inference==='none'&&
    !(s.loop_prediction==='same'&&!routeCorrectionSeen);
  const activeFocus=s.round===0?'tutorial':s.status==='success'&&s.relay_stage==='none'?'receiver-approach':relay?'receiver':'route';
  const readoutFocus=s.round===0?'tutorial':relay?'receiver':'route';
  // A finished wrong route already has feedback at the gate and on the device.
  // Folding the generated-word readout gives the next physical sources room.
  const readoutActive=s.status!=='wrong'&&carrierAtFocus(readoutFocus,activeFocus,relay?s.relay_context!=='none'&&s.relay_stage!=='done':s.round===0?s.input?.length>=2:s.clue!=='none'&&s.pieces>0);
  // Subject clearance: during the relay the receiver owns the scene; labels
  // yield to its screen box instead of burying it (guide B2, review 210a663).
  if(relay){
    const subject=projectedEntityBox(world,'friend-signal',{top:[0,1.35,.25],bottom:[0,-1.45,.25],left:[-.95,0,.25],right:[.95,0,.25],margin:8});
    if(subject)avoidRects.push(subject);
  }
  const markRects=[];
  if(s.round===1&&!relay&&s.status!=='success'&&card.hidden){
    // The compared marks are required world information, including after a
    // source is inserted. Protect their painted centers from contextual labels.
    for(const mark of ['moon-mark','star-mark','sun-mark']){
      const symbol=projectedEntityBox(world,mark,{top:[0,.8,0],bottom:[0,-.8,0],left:[-.8,0,0],right:[.8,0,0],margin:8});
      if(symbol)markRects.push(symbol);
    }
  }
  // B2 protagonist clearance: Zip is the focal subject of every play stage, so
  // anchored labels keep out of his body box *and* its focal ring instead of
  // reading across the character (the narrow-phone POWER LEAD marker buried him).
  if(hero)avoidRects.push(hero);
  for(const marker of $('#markers').children){
    if(marker.id==='source-inspection'&&!inspectedSource){marker.hidden=true;continue;}
    if(marker.id==='source-inspection'&&inspectedSource)marker.hidden=false;
    const projected=world.projectEntity(marker.dataset.anchor);
    const readout=marker.id==='learning-readout';
    const carryToken=marker.id==='carried-source',slotToken=marker.id==='slotted-source';
    const anchor=readout&&!projected?.inFront?world.projectEntity('zip'):projected;
    const wrongRound=marker.dataset.round!==undefined&&Number(marker.dataset.round)!==s.round;
    if(marker.dataset.anchor==='moon-label'&&marker.dataset.round==='1'&&marker.tagName==='SPAN')marker.textContent=s.status==='wrong'?'☾ MOON SHUT':'☾ MOON';
    const available=marker.dataset.action?s.available_actions?.includes(marker.dataset.action):true;
    // P3: a visible world sign must never read as a dead control. Signs whose
    // action is currently spent stay readable and click-inert (the act() guards
    // no-op), they do not appear disabled.
    if(marker.dataset.action||marker.dataset.clue||marker.dataset.relaySource){marker.disabled=Boolean(blocked());marker.classList.toggle('chosen',Boolean(marker.dataset.clue&&marker.dataset.clue===s.clue)||Boolean(marker.dataset.relaySource&&marker.dataset.relaySource===s.relay_context));marker.classList.toggle('staged',Boolean(marker.dataset.clue&&marker.dataset.clue===stagedSource)||Boolean(marker.dataset.relaySource&&marker.dataset.relaySource===stagedRelaySource));marker.classList.toggle('inspected',Boolean(marker.dataset.clue&&marker.dataset.clue===inspectedSource));}
    const tutorialTarget=marker.classList.contains('tutorial-target-marker');
    const routeLabelIdle=marker.dataset.routeLabel&&(!host.classList.contains('route-inspecting'))&&!(s.status==='wrong'&&marker.dataset.anchor==='moon-label');
    const targetMismatch=tutorialTarget&&(marker.dataset.anchor!==host.dataset.tutorialWorldTarget||marker.dataset.action!==host.dataset.tutorialWorldAction||!available);
    const critical=tutorialTarget||marker.dataset.critical==='true';
    // I9: a declared carrier of the beat's decision may slide and edge-cue, but may
    // not vanish because the screen got small.
    // Source-choice carriers must remain discoverable while the player is deciding.
    // Once inference is committed, an offscreen, unselected sign prompt may yield;
    // its physical sign remains inspectable when brought back into view.
    const pastSourceDecision=marker.classList.contains('notice-marker')&&!marker.dataset.relay&&
      s.source_inference!=='none'&&s.status==='building'&&s.pieces>0;
    const carrier=marker.dataset.carrier!==undefined&&!pastSourceDecision;
    const guidable=(critical||carrier?Boolean(anchor?.inFront):Boolean(anchor?.visible))||(slotToken&&sourceQuestion);
    const toggleMarker=marker.dataset.machineToggle!==undefined;
    if(toggleMarker){
      // The machine toggle is the opt-in door while the card is away; it never
      // disappears with the camera, it parks, and a focused dialog owns the screen.
      marker.hidden=card.hidden&&!document.querySelector('dialog[open]')?Boolean(inOpening||!ours()||inspectedSource):true;
      marker.classList.toggle('parked',!(anchor&&anchor.inFront));
    // I3: while the machine panel is open it owns the decision; its world
    // choice markers fold away (they return when the panel is put away).
    }else marker.hidden=(readout&&(!readoutActive||!s.powered||practice.step!=='done'||!card.hidden))||(carryToken&&!(relay?stagedRelaySource&&!slottedRelaySource:stagedSource&&!slottedSource))||(slotToken&&(!marker.textContent||Boolean(situatedRoute()&&!relay&&s.round===1&&s.clue!=='none'&&!$('#learning-readout').hidden)))||(!card.hidden&&(marker.classList.contains('notice-marker')||marker.classList.contains('world-action-marker')||marker.id==='source-inspection'))||(inspectedSource&&marker.dataset.clue&&marker.dataset.clue!==inspectedSource)||routeLabelIdle||!guidable||wrongRound||inOpening||!ours()||targetMismatch||(marker.dataset.relay&&(s.relay_stage==='done'||!relay||(!changedRelay(s)&&marker.dataset.relaySource==='tavi')))||(marker.classList.contains('notice-marker')&&marker.dataset.relay===undefined&&s.status==='success')||(marker.dataset.signal&&s.status!=='success')||(marker.dataset.anchor==='star-label'&&s.status==='success');
    if((anchor||slotToken&&sourceQuestion)&&!marker.hidden&&!(toggleMarker&&marker.classList.contains('parked'))){
      const placement=placeWorldMarker(marker,anchor,{viewportWidth:rect.width,safeTop,safeBottom,critical,parkWhenFull:carrier,yOffset:readout?48:12,avoidRects:marker.dataset.routeLabel?avoidRects:[...avoidRects,...markRects]});
      if(slotToken&&sourceQuestion&&!placement.placed){
        marker.hidden=!parkWorldCarrier(marker,{viewportWidth:rect.width,safeTop,safeBottom});
      }
      if(marker.id==='source-inspection'&&!placement.placed){
        // Inspection is a player-opened carrier. Crowded phone scenes may have
        // no free world-anchored slot; park the whole note below the masthead
        // instead of hiding its carry/return controls or clipping them above it.
        marker.hidden=false;marker.style.left=rect.width/2+'px';
        marker.style.top=Math.min(rect.height-8,chromeTop+marker.offsetHeight+8)+'px';
        marker.classList.add('edge-cued');marker.dataset.edge='top';
      }
      else if((!placement.placed&&!(slotToken&&sourceQuestion))||(!critical&&!carrier&&!placement.insideSafeArea))marker.hidden=true;
      else{const footprint=marker.getBoundingClientRect();avoidRects.push({left:footprint.left-rect.left,right:footprint.right-rect.left,top:footprint.top-rect.top,bottom:footprint.bottom-rect.top});}
    }else if(toggleMarker&&marker.classList.contains('parked')){marker.style.left='';marker.style.top='';}
  }
  requestAnimationFrame(frame);
}
host.addEventListener('click',async e=>{
  if(blocked()||e.target.closest('button,.game-player-controls'))return;
  const target=await world.pickSemanticAt(e.clientX,e.clientY),s=view();
  if(hitsEntity(target,'loose-plug')||(s.round===0&&hitsEntity(target,'socket'))){
    // I1/CP4: acting on the machine performs the machine's verb in the world;
    // it never summons a panel about the machine. The diegetic toggle opens the panel.
    if(!s.powered)act('connect');else if(s.available_actions?.includes('step'))act('step');
  }
  if(s.round===1&&hitsEntity(target,'route-machine')){
    if(s.available_actions?.includes('step'))act('step');
    else if(s.available_actions?.includes('send'))act('send');
    else{cardOpen=true;syncCardVisibility();}
  }
  if(hitsEntity(target,'moon')&&s.available_actions?.includes('scan-moon'))act('scan-moon');
  const noticeSource=hitsEntity(target,'notice-old')?'moon':hitsEntity(target,'notice-parade')?'parade':hitsEntity(target,'notice-today')?'star':null;
  if(noticeSource){inspectSource(noticeSource);return;}
  const noteSource=hitsEntity(target,'relay-note-a')?'loft':hitsEntity(target,'relay-note-b')?'yard':hitsEntity(target,'relay-note-c')?'tavi':null;
  if(noteSource){
    if(changedRelay(s))inspectRelaySource(noteSource);
    else if(s.available_actions?.includes(`relay-context-${noteSource}`))act(`relay-context-${noteSource}`);
    return;
  }
  if(hitsEntity(target,'friend-signal')){
    if(s.available_actions?.includes('relay-start'))act('relay-start');
    else if(s.relay_stage&&s.relay_stage!=='none'){cardOpen=true;syncCardVisibility();}
  }
  if(hitsEntity(target,'friend-cube'))flavor('A very companionable cube.','Someone painted a heart on a spare power cube. It may belong to one of the missing robots.');
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
  get continuation(){return {running:continuationRunning,review:continuationReview,index:continuationIndex};},
  get runtime(){return runtime.stats();},
  get colliders(){return runtime.colliderSnapshot();},
  get audio(){return audio.stats();},
  probeFeature:feature=>probeWorldFeature(world,feature),
  audioCapture:{
    start:()=>audio.startCapture(),
    stop:()=>audio.stopCapture()
  }
};
window.addEventListener('pagehide',()=>audio.dispose(),{once:true});boot();
