import {createPlayCanvasWorld} from '../playcanvas-backend.js';
import {createSequencePractice} from '../sequence-practice.js';
const $=s=>document.querySelector(s),host=$('#room'),panel=$('#device'),content=$('#device-content'),inspect=$('#inspect'),hint=$('#move-hint');
const loop=createSequencePractice({demo:{request:'Say a short greeting.',pieces:['Hello','my','friend']},practice:{request:'Ask for the gate to open.',pieces:['Open','the','gate']}});
const entities=[];const box=(id,material,position,scale)=>entities.push({id,primitive:'box',material,position,scale});
box('floor','stone',[0,-.2,0],[15,.4,16]);box('back','wall',[0,5,-2],[15,10,.5]);
for(const x of [-6,6])box('pillar'+x,'stone',[x,4,-1],[.8,8,.8]);
box('cabinet','brass',[0,4.6,0],[5.5,8.6,1.2]);box('face','ink',[0,4.6,.65],[5.05,8.1,.13]);
for(const x of [-1.7,1.7])box('foot'+x,'brass',[x,.25,.1],[.65,.5,1.8]);
for(const x of [-2.56,2.56])for(const y of [.6,8.6])entities.push({id:'bolt'+x+'-'+y,primitive:'sphere',material:'gold',position:[x,y,.75],scale:[.16,.16,.12]});
box('lead','gold',[3.1,.6,1.1],[.18,.18,1.4]);box('power-light','gold',[2.65,2.1,.8],[.25,.25,.12]);
box('latch','gold',[-4,1,-.6],[1.5,2,.3]);box('latch-frame','stone',[-4,2.2,-.8],[2,.2,.6]);
for(const [id,position] of [['face-top',[-2.38,8.42,.82]],['face-bottom',[2.38,.78,.82]],['device-target',[0,4.7,1]]])entities.push({id,position});
entities.push({id:'zip',asset:'robot',position:[0,0,5.2]});
const spec={schemaVersion:'1',id:'speech-device-prototype',version:'1',environment:{clearColor:'#162a36',ambient:'#809798',exposure:1,toneMapping:'aces'},materials:{stone:{diffuse:'#617c7c'},wall:{diffuse:'#29424d'},brass:{diffuse:'#927e55'},gold:{diffuse:'#d7b779'},ink:{diffuse:'#153239'}},assets:{robot:{type:'container',src:'/assets/quaternius-animated-robot.glb',transform:{position:[0,-.08,0],scale:[.52,.52,.52]},animations:{idle:'RobotArmature|Robot_Standing',run:'RobotArmature|Robot_Running'},defaultAnimation:'idle'}},entities,lights:[{id:'key',type:'directional',color:'#ffe3b2',intensity:1.1,rotation:[40,-30,0],castShadows:true}],cameras:{room:{position:[5,6,14],lookAt:[0,3,0],fov:50},inspect:{position:[0,4.6,11.6],lookAt:[0,4.6,0],fov:44,portrait:{position:[0,4.6,14.2],lookAt:[0,4.6,0],fov:44}}},states:{room:{camera:'room'}},player:{version:'1',entity:'zip',spawn:[0,0,5.2],speed:3,surfaces:[{bounds:[-6,6,2,7],height:0}],body:{radius:.34,height:1.55},animations:{idle:0,move:1},camera:{yaw:0,pitch:25,distance:9,portraitDistance:12,minDistance:5,maxDistance:15,targetHeight:1.2}}};
spec.player.animations={idle:'idle',move:'run'};spec.player.animationSpeeds={idle:0,move:1};
const world=createPlayCanvasWorld(host,spec,{reducedMotion:true});let inspecting=false,savedView=null,moved=false;
if(!world.available){$('#loading').textContent='The workshop could not load. Reload to retry.';throw Error(world.error);}world.setControlMode('third-person',spec.id);
function el(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
function button(label,action,value,primary=false){const b=el('button',label,primary?'primary':'');b.type='button';b.onclick=()=>{loop.act(action,value);render();};return b;}
function rail(label,values){const n=el('div',null,'rail');n.append(el('strong',label));const pieces=el('div',null,'pieces');for(const v of values)pieces.append(el('span',v,'piece'));n.append(pieces);return n;}
function returnToWorld(){inspecting=false;panel.hidden=true;document.body.classList.remove('inspecting');host.style.pointerEvents='';world.setControlMode('third-person',spec.id);if(savedView)world.restorePlayerView(savedView);inspect.focus();}
function render(){
 const s=loop.snapshot();content.replaceChildren();content.append(el('span','Bellweather · speech device','plate'));
 if(s.phase==='power')content.append(el('h1','Give it power.'),el('p','The loose lead belongs in the socket. Connect it to wake the device.'),button('Connect power','connect',null,true));
 else{
  const titles={demo:'A voice, one piece at a time.','demo-done':'The whole greeting stays with it.','practice-choice':'What will it receive next?','practice-feedback':'Compare the next input.','practice-run':'Finish the gate request.',done:'The practice latch opens.'};content.append(el('h1',titles[s.phase]));
  if(s.phase==='demo'||s.phase==='demo-done'){
   content.append(el('p','Saved greeting · before Mira disappeared','note'),rail('INPUT FOR THE NEXT STEP',s.input),rail('SAID SO FAR',s.output.length?s.output:['…']),el('p',s.count?'Each piece joins the request before the next one is made.':'Make the first piece, then watch the input change.'));
   content.append(s.phase==='demo'?button(s.count?'Next piece':'Make a piece','advance',null,true):button('Try a gate request','practice',null,true),el('p','A prepared example with whole-word pieces. Real models use tokens and can produce different continuations.','note'));
  }else{
   content.append(rail('REQUEST',[s.request]),rail('SAID SO FAR',s.output));
   if(s.phase==='practice-choice'){
    content.append(el('p','Choose a tray for your prediction. The actual next input stays covered until you check.'));const choices=el('div',null,'choices');
    for(const [id,label] of [['output',s.output.join(' ')+' only'],['complete',s.request+' + '+s.output.join(' ')],['request',s.request+' only']]){const b=button(label,'choose',id);b.setAttribute('aria-pressed',String(s.choice===id));choices.append(b);}content.append(choices);const commit=button('Check my prediction','commit',null,true);commit.disabled=!s.choice;content.append(commit);
   }else if(s.phase==='practice-feedback'){
    content.append(el('p',s.choice==='complete'?'Yes. It receives the request AND what it has already said.':s.choice==='output'?'That leaves out the request. The next input keeps both parts.':'That leaves out Open, the piece already generated. The next input keeps both parts.','feedback'),rail('ACTUAL NEXT INPUT',s.input),button('Make the next piece','advance',null,true));if(s.choice!=='complete')content.append(button('Try the prediction again','retry'));
   }else if(s.phase==='practice-run')content.append(rail('NEXT INPUT',s.input),button('Finish the request','advance',null,true));
   else content.append(el('p','You completed guided practice. A new problem would be needed to check what you can do without help.'),el('p','This local prototype ends here. Your saved adventure has not changed.','note'));
  }
 }
 const footer=el('div',null,'footer'),back=el('button','Return to world');back.onclick=returnToWorld;footer.append(back);content.append(footer);
 if(s.phase!=='power')world.applyPatch({transforms:{lead:{position:[2.7,1.35,.82],rotation:[90,0,0]}}});if(s.phase==='done')world.applyPatch({transforms:{latch:{position:[-4,3,-.6]}}});
 const title=content.querySelector('h1');title.tabIndex=-1;title.focus({preventScroll:true});panel.scrollTop=0;
}
inspect.onclick=()=>{savedView=world.getPlayerView();inspecting=true;document.body.classList.add('inspecting');host.style.pointerEvents='none';world.setControlMode('overview',spec.id);world.applyPatch({camera:'inspect'});panel.hidden=false;inspect.hidden=true;hint.hidden=true;render();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&inspecting){e.preventDefault();returnToWorld();}});
function frame(){const stats=world.stats();if(stats.assetsPending===0)$('#loading').hidden=true;
 if(!inspecting){const p=stats.player?.position||[0,0,5.2];moved ||= Math.abs(p[2]-5.2)>.3||Math.abs(p[0])>.3;const point=world.projectEntity('device-target'),near=Math.hypot(p[0],p[2])<4;
  if(point){inspect.style.left=point.x+'px';inspect.style.top=point.y+'px';inspect.hidden=false;inspect.disabled=!near;inspect.textContent=near?'Inspect speech device':'Speech device · move closer';}
  const h=world.projectEntity('zip');hint.hidden=moved;if(h&&!moved){hint.style.left=h.x+'px';hint.style.top=(h.y-75)+'px';}
 }else{const a=world.projectEntity('face-top'),b=world.projectEntity('face-bottom');if(a&&b){panel.style.left=a.x+'px';panel.style.top=a.y+'px';panel.style.width=(b.x-a.x)+'px';panel.style.height=(b.y-a.y)+'px';}}
 requestAnimationFrame(frame);
}requestAnimationFrame(frame);
