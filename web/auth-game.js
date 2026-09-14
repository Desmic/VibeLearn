/* Shared 3D valley entry; authentication remains owned by app.js. */
'use strict';
(() => {
  const records=[];
  function enhance(id,reset=false){
    const screen=document.querySelector(id);if(!screen)return;
    screen.classList.add('auth-game-screen');
    const panel=document.createElement('div');panel.className='auth-access-panel';
    panel.append(...screen.childNodes);
    const stage=document.createElement('section');stage.className='auth-game-stage';
    stage.setAttribute('aria-label',reset?'Relay Rescue account recovery scene':'Relay Rescue valley scene');
    stage.innerHTML=`<div class="auth-world"></div><div class="auth-stage-copy"><span>RELAY RESCUE · THE ECHO FORGE</span><h1>${reset?'Find your way back.':'Every light has a keeper.'}</h1><p>${reset?'Your journey through the valley is still here.':'Seven quiet signals. One small courier. A valley waiting for you.'}</p></div><div class="auth-world-status" role="status">Lighting the valley…</div>`;
    const submit=panel.querySelector('button[type="submit"]');submit?.setAttribute('aria-label',reset?'Save new password':'Enter campaign');
    screen.append(stage,panel);
    const record={screen,stage,world:null,token:0,visible:false};records.push(record);
    new MutationObserver(()=>sync(record)).observe(screen,{attributes:true,attributeFilter:['hidden']});sync(record);
  }
  async function sync(record){
    const visible=!record.screen.hidden;if(visible===record.visible)return;record.visible=visible;
    const token=++record.token;
    record.world?.dispose();record.world=null;
    if(!visible)return;
    const status=record.stage.querySelector('.auth-world-status');status.hidden=false;
    try{
      const [{createPlayCanvasWorld},{echoForgeWorldSpec}]=await Promise.all([import('/playcanvas-backend.js'),import('/echo-forge-world-spec.js')]);
      if(token!==record.token||!record.visible)return;
      const spec={...echoForgeWorldSpec,id:'relay-rescue.entry',states:{entry:{camera:'entry',animations:{pip:'idle'},hide:['broken-gear','new-gear','duplicate-gear','order-seal','reply-orb','storm-bolt-a','storm-bolt-b']}},cameras:{entry:{position:[-1,5.5,17],lookAt:[0,.7,-1],fov:47,portrait:{position:[-4,3.7,12],lookAt:[-2,1,-.5],fov:51}}}};
      record.world=createPlayCanvasWorld(record.stage.querySelector('.auth-world'),spec,{interactive:false,pixelRatioCap:1.5,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
      if(!record.world.available)throw new Error('3D unavailable');
      record.stage.dataset.engine='playcanvas';status.hidden=true;
      const canvas=record.stage.querySelector('canvas');
      canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();showFailure(status);});
      canvas.addEventListener('webglcontextrestored',()=>{record.world?.replay();status.hidden=true;});
    }catch(_){if(token===record.token)showFailure(status);}
  }
  function showFailure(status){status.hidden=false;status.replaceChildren(document.createTextNode('The 3D scene could not load. You can still sign in. '));const retry=document.createElement('button');retry.type='button';retry.textContent='Retry scene';retry.onclick=()=>location.reload();status.append(retry);}
  enhance('#sign-in');enhance('#password-reset',true);
})();
