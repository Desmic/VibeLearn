/* Relay Rescue first-touch story: a user-paced scene, not an autoplay slide deck. */
'use strict';
(() => {
  const game=window.RescueGame;
  if(!game||game.__firstMinuteStoryV3)return;
  const SEEN_KEY='vibelearn.relay-rescue.intro.v3';
  let storyBundle=null;
  const loadStory=()=>storyBundle||(storyBundle=Promise.all([import('/story3d-world-host.js'),import('/rescue-story3d.js')]).then(([host,module])=>({host,module})).catch(()=>null));
  const scenes=[
    {kicker:'THE VALLEY OF SEVEN LIGHTS',title:'Pip is almost home.',body:'Seven islands. One old bridge. One last delivery before dark.',dialogue:'PIP  “One more crossing. Easy.”',fact:'Then the bridge screams.',markers:[['PIP · COURIER','warm'],['HOME →','soft']]},
    {kicker:'THE BREAK',title:'One tiny gear stops everything.',body:'The center gear cracks. The bridge needs exactly one replacement to move again.',dialogue:'PIP  “...I may have spoken too soon.”',fact:'Needed: 1 gear. Not 2.',markers:[['BROKEN GEAR','danger'],['1 NEEDED','warm']]},
    {kicker:'THE ECHO FORGE',title:'Pip sends one promise.',body:'Pip stamps order-01. The Echo Forge accepts that seal and spends one glowing ember to shape one gear.',dialogue:'PIP  “Echo Forge: one bridge gear. Seal order-01.”',fact:'order-01 = this one job.',markers:[['ORDER-01','warm'],['ECHO FORGE','soft'],['EMBER → GEAR','warm']]},
    {kicker:'THE SILENCE',title:'The gear survives. The reply does not.',body:'The Forge finishes. Its reply starts home—then lightning erases only the message.',dialogue:'PIP  “Forge? ...Did you make it?”',fact:'Silence changed what Pip knows, not what happened.',markers:[['GEAR EXISTS','safe'],['REPLY','soft'],['ϟ LOST HERE','danger']]},
    {kicker:'THE TEMPTATION',title:'“Just send another” has a cost.',body:'A fresh seal looks like a fresh job. The Forge could spend another scarce ember on a gear nobody needs.',dialogue:'PIP  “I could just send another order...”',fact:'One intention can accidentally become two effects.',markers:[['NEW SEAL?','danger'],['SECOND GEAR?','danger'],['EMBER 3 → 2','warm']]},
    {kicker:'THE FIRST SIGNAL',title:'The storm wakes something for you.',body:'An old signal tower reveals the hidden trail. Pip cannot see it. You can.',dialogue:'PIP  “You can see the echoes, can’t you? Help me find out what happened.”',fact:'First move: inspect the Echo Forge.',markers:[['YOU · SIGNAL KEEPER','safe'],['HIDDEN ECHO','safe'],['START → ECHO FORGE','warm']]}
  ];
  let cleanup=()=>{};
  const originalMap=game.map.bind(game),originalRender=game.render.bind(game),originalHide=game.hide.bind(game);
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const authBlocking=()=>Boolean(document.querySelector('#sign-in:not([hidden]),#password-reset:not([hidden])'));
  const seen=()=>{try{return localStorage.getItem(SEEN_KEY)==='seen';}catch(_){return false;}};
  const remember=()=>{try{localStorage.setItem(SEEN_KEY,'seen');}catch(_){}};
  const setLaunchReady=launch=>{if(launch)launch.innerHTML='Wake Signal 1 <span>→</span>';};

  function open(root,launch,{replay=false}={}){
    if(authBlocking()||!root||root.hidden)return;
    cleanup();
    const overlay=document.createElement('section');overlay.id='rgi-intro';overlay.className='rgi-overlay';overlay.tabIndex=-1;
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','rgi-title');
    overlay.innerHTML=`<div class="rgi-shell">
      <div class="rgi-storybar"><span>RELAY RESCUE</span><b>THE ECHO FORGE</b><small id="rgi-step"></small></div>
      <div class="rgi-visual" id="rgi-world">
        <div class="rgi-fallback" aria-hidden="true"><div class="rgi-fallback-stars"></div><div class="rgi-fallback-island left"></div><div class="rgi-fallback-island right"></div><div class="rgi-fallback-bridge"></div><div class="rgi-fallback-pip">••</div><div class="rgi-fallback-forge">✦</div><div class="rgi-fallback-gear">⚙</div><div class="rgi-fallback-bolt">ϟ</div></div>
        <div class="rgi-markers" aria-hidden="true"></div><div class="rgi-scene-caption"><span class="rgi-kicker"></span><h2 id="rgi-title"></h2><p id="rgi-body"></p><blockquote id="rgi-dialogue"></blockquote><div class="rgi-fact" id="rgi-fact"></div></div>
      </div>
      <div class="rgi-progress" aria-label="Story progress">${scenes.map((_,i)=>`<i aria-hidden="true"><span>${i+1}</span></i>`).join('')}</div>
      <div class="rgi-controls"><div class="rgi-nav"><button type="button" id="rgi-back">← Back</button><button type="button" class="rg-primary" id="rgi-next">Continue →</button></div><div class="rgi-utilities"><button type="button" id="rgi-replay-beat" aria-label="Replay this scene">↻ Replay</button><button type="button" id="rgi-pause" aria-label="Pause story motion">Pause</button><button type="button" id="rgi-skip">Skip</button></div></div>
    </div>`;
    root.append(overlay);
    let step=0,closed=false,paused=false,world=null;
    const worldHost=overlay.querySelector('#rgi-world');
    const update=()=>{
      if(closed)return;overlay.dataset.step=String(step);
      const s=scenes[step];overlay.querySelector('.rgi-kicker').textContent=s.kicker;overlay.querySelector('#rgi-title').textContent=s.title;overlay.querySelector('#rgi-body').textContent=s.body;overlay.querySelector('#rgi-dialogue').textContent=s.dialogue;overlay.querySelector('#rgi-fact').textContent=s.fact;
      overlay.querySelector('#rgi-step').textContent=`${step+1} / ${scenes.length}${replay?' · REPLAY':''}`;
      const markers=overlay.querySelector('.rgi-markers');markers.replaceChildren(...s.markers.map(([label,tone])=>{const n=document.createElement('span');n.className=`rgi-marker ${tone||''}`;n.textContent=label;return n;}));
      overlay.querySelector('#rgi-back').disabled=step===0;overlay.querySelector('#rgi-next').textContent=step===scenes.length-1?'Wake Signal 1 →':'Continue →';
      overlay.querySelectorAll('.rgi-progress i').forEach((n,i)=>{n.classList.toggle('on',i<=step);n.classList.toggle('current',i===step);});
      world?.setBeat(step);
    };
    const close=(start=false,persist=true)=>{if(closed)return;closed=true;world?.dispose();if(persist)remember();overlay.remove();setLaunchReady(launch);if(start)launch?.click();else launch?.focus({preventScroll:true});};
    overlay.querySelector('#rgi-next').onclick=()=>step===scenes.length-1?close(true,true):(step+=1,update());
    overlay.querySelector('#rgi-back').onclick=()=>{if(step>0){step-=1;update();}};
    overlay.querySelector('#rgi-skip').onclick=()=>close(false,true);
    overlay.querySelector('#rgi-replay-beat').onclick=()=>world?.replay();
    const pauseButton=overlay.querySelector('#rgi-pause');
    if(reduced()){pauseButton.hidden=true;overlay.classList.add('rgi-reduced');}
    pauseButton.onclick=()=>{paused=!paused;world?.setPaused(paused);pauseButton.textContent=paused?'Resume':'Pause';pauseButton.setAttribute('aria-label',paused?'Resume story motion':'Pause story motion');overlay.classList.toggle('rgi-paused',paused);};
    overlay.addEventListener('keydown',e=>{
      if(e.key==='ArrowLeft'&&step>0){e.preventDefault();step-=1;update();}
      else if(e.key==='ArrowRight'){e.preventDefault();step===scenes.length-1?close(true,true):(step+=1,update());}
      else if(e.key==='Escape'){e.preventDefault();close(false,true);}
    });
    cleanup=()=>close(false,false);update();overlay.focus({preventScroll:true});
    loadStory().then(bundle=>{
      if(closed||!bundle)return;
      world=bundle.host.mountStoryWorldModule(bundle.module,worldHost,{reducedMotion:reduced(),mode:'story'});
      if(world?.available){overlay.classList.add('rgi-three-ready');world.setBeat(step);world.setPaused(paused);}
      else overlay.classList.add('rgi-three-failed');
    });
  }

  function enhanceMap(missions,attempt){
    const root=document.querySelector('#rescue-game');if(!root||authBlocking())return;
    const cleared=missions.filter(m=>m.status==='cleared').length,active=attempt?.status==='draft';
    const launch=root.querySelector('#rg-launch'),brief=root.querySelector('.rg-map-brief');
    if(cleared===0&&!active&&brief&&launch){
      brief.querySelector('.rg-eyebrow')?.replaceChildren(document.createTextNode('RELAY RESCUE · THE ECHO FORGE'));
      const h1=brief.querySelector('h1');if(h1)h1.textContent='The storm left one dangerous silence.';
      const p=brief.querySelector('p');if(p)p.textContent='Pip’s bridge broke. The Echo Forge may already have made the one gear Pip needs. Discover what the storm hid before another order costs the valley twice.';
      launch.innerHTML='Enter the story <span>→</span>';
    }
    const menu=root.querySelector('#rg-menu');if(menu&&launch&&!menu.querySelector('#rg-replay-story')){const replayButton=document.createElement('button');replayButton.type='button';replayButton.id='rg-replay-story';replayButton.textContent='Replay The Echo Forge';replayButton.onclick=()=>open(root,launch,{replay:true});menu.prepend(replayButton);}
    if(cleared===0&&!active&&launch&&!seen())open(root,launch);else if(cleared===0&&!active&&launch)setLaunchReady(launch);
  }

  game.map=(missions,attempt,handlers)=>{cleanup();const result=originalMap(missions,attempt,handlers);enhanceMap(missions,attempt);return result;};
  game.render=(...args)=>{cleanup();return originalRender(...args);};game.hide=(...args)=>{cleanup();return originalHide(...args);};
  game.__firstMinuteStoryV3=true;
})();