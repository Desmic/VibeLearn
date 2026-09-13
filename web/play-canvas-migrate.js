/* Incremental Relay Rescue -> Play Canvas DOM migration.
   Reparents the existing semantic controls; it does not clone actions or change server/evidence semantics. */
'use strict';
(() => {
  const game=window.RescueGame;
  if(!game||game.__playCanvasMigrationV2)return;
  let lastAttempt=null;
  let transferWorld=null,transferHost=null,transferMountToken=0;
  let migrationQueued=false;

  const rootEl=()=>document.querySelector('#rescue-game');
  const levelOf=a=>Number(a?.snapshot?.rescue?.level||0);
  const historical=root=>Boolean(root?.querySelector('.rg-review-banner'));

  function makeLayer(world,cls,label){
    let layer=world.querySelector(`:scope > .${cls}`);
    if(!layer){
      layer=document.createElement('section');
      layer.className=`play-canvas-hud ${cls}`;
      layer.setAttribute('aria-label',label);
      world.append(layer);
    }
    return layer;
  }

  function compactJournal(panel){
    const journal=panel?.querySelector('.rg-journal');
    if(!journal||journal.tagName==='DETAILS')return;
    const details=document.createElement('details');
    details.className=journal.className;
    const summary=document.createElement('summary');summary.textContent='Field journal';
    details.append(summary,...journal.childNodes);
    journal.replaceWith(details);
  }

  function disposeTransferWorld(){
    transferMountToken+=1;
    transferWorld?.dispose?.();
    transferWorld=null;transferHost=null;
  }

  function transferPresentationState(a){
    return {
      ...(a?.rescue_state||{}),
      assessmentOutcome:a?.assessment?.outcome||null,
      status:a?.status||null
    };
  }

  async function ensureTransferWorld(surface,a){
    if(transferWorld&&transferHost===surface){
      transferWorld.setTransferState?.(transferPresentationState(a));
      return;
    }
    const token=++transferMountToken;
    transferWorld?.dispose?.();transferWorld=null;transferHost=surface;
    try{
      const {createGameWorld}=await import('/rescue-playcanvas-world.js');
      if(token!==transferMountToken||!surface.isConnected)return;
      const world=createGameWorld(surface,{
        reducedMotion:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false,
        mode:'transfer'
      });
      if(token!==transferMountToken||!surface.isConnected){world?.dispose?.();return;}
      if(!world?.available){
        surface.dataset.playCanvasBackend='fallback';
        surface.dataset.playCanvasError=String(world?.error||'PlayCanvas unavailable').slice(0,180);
        return;
      }
      transferWorld=world;transferHost=surface;
      surface.dataset.playCanvasBackend='playcanvas';
      delete surface.dataset.playCanvasError;
      world.setTransferState?.(transferPresentationState(a));
    }catch(error){
      if(token!==transferMountToken)return;
      surface.dataset.playCanvasBackend='fallback';
      surface.dataset.playCanvasError=String(error?.message||error).slice(0,180);
    }
  }

  function migrateFieldMission(root,world,level){
    world.classList.add('play-canvas-mission-world');
    const panel=root.querySelector('.rg-console');
    if(!panel)return;
    const hud=makeLayer(world,'play-canvas-mission-hud',`Signal ${level} actions`);
    if(panel.parentElement!==hud)hud.append(panel);
    compactJournal(panel);
  }

  function migrateBuilder(root,world){
    world.classList.add('play-canvas-builder-world');
    const hud=makeLayer(world,'play-canvas-builder-hud','Build Pip’s recovery route in the storm');
    hud.classList.add('play-canvas-route-circuit');
    const bench=root.querySelector('.rg-workbench');
    const runButton=root.querySelector('#rg-run');
    const actions=runButton?.closest('.rg-build-actions')||runButton?.parentElement||root.querySelector('.rg-build-actions');
    const results=root.querySelector('.rg-results');
    const playback=root.querySelector('.rg-live-route');
    if(bench){
      bench.classList.add('play-canvas-route-tools');
      bench.querySelector('.rg-slots')?.classList.add('play-canvas-route-nodes');
      bench.querySelector('.rg-palette')?.classList.add('play-canvas-toolbelt');
      if(bench.parentElement!==hud)hud.append(bench);
    }
    if(actions){actions.classList.add('play-canvas-route-run');if(actions.parentElement!==hud)hud.append(actions);}
    if(results){results.classList.add('play-canvas-storm-outcome');if(results.parentElement!==hud)hud.append(results);}
    // RescueStage creates the animated causal playback after the workbench. It is
    // part of Signal 6 gameplay, not a second report below the game world.
    if(playback){
      playback.classList.add('play-canvas-route-playback');
      if(playback.parentElement!==hud)hud.append(playback);
    }
  }

  function migrateTransfer(root,a){
    const field=root.querySelector('.rg-field');
    if(!field)return;
    let surface=field.querySelector(':scope > .play-canvas-transfer-surface');
    if(!surface){
      surface=document.createElement('section');
      surface.className='play-canvas-transfer-surface play-canvas-target play-canvas-builder-world';
      surface.dataset.playCanvasMode='transfer';
      surface.setAttribute('aria-label','Export worker field transfer');
      field.prepend(surface);
    }else{
      surface.classList.add('play-canvas-target','play-canvas-builder-world');
    }

    const hud=makeLayer(surface,'play-canvas-builder-hud','Build and commit the export worker recovery policy');
    hud.classList.add('play-canvas-route-circuit');
    const incident=field.querySelector(':scope > .rg-incident');
    const bench=field.querySelector(':scope > .rg-workbench');
    const actions=field.querySelector(':scope > .rg-build-actions');
    const clear=field.querySelector(':scope > .rg-clear');

    // The page objective already carries the long prompt. Keep only compact live
    // incident facts in-world so the PlayCanvas scene remains the dominant surface.
    if(incident){
      incident.querySelector('h2')?.setAttribute('hidden','');
      incident.querySelector(':scope > p:not(.rg-sealed)')?.setAttribute('hidden','');
      if(clear){
        incident.hidden=true;
      }else{
        incident.hidden=false;
        incident.classList.add('play-canvas-storm-outcome');
        if(incident.parentElement!==hud)hud.append(incident);
      }
    }

    if(bench){
      bench.classList.add('play-canvas-route-tools');
      bench.querySelector('.rg-slots')?.classList.add('play-canvas-route-nodes');
      bench.querySelector('.rg-palette')?.classList.add('play-canvas-toolbelt');
      if(bench.parentElement!==hud)hud.append(bench);
    }

    if(actions){
      // Keep assistance provenance visible but separate it from the primary action.
      // Reparent the exact existing controls; no assessment semantics are duplicated.
      const note=actions.querySelector('.rg-run-note');
      const aid=actions.querySelector('.rg-help-label');
      if(incident&&!clear){if(note)incident.append(note);if(aid)incident.append(aid);}
      const run=actions.querySelector('#rg-run');
      if(run){
        let runWrap=hud.querySelector(':scope > .play-canvas-transfer-run');
        if(!runWrap){
          runWrap=document.createElement('div');
          runWrap.className='rg-build-actions play-canvas-route-run play-canvas-transfer-run';
          hud.append(runWrap);
        }
        if(run.parentElement!==runWrap)runWrap.append(run);
      }
      if(!actions.childElementCount)actions.remove();
    }

    if(clear){
      clear.hidden=false;
      clear.classList.add('play-canvas-storm-outcome');
      if(clear.parentElement!==hud)hud.append(clear);
    }

    // Results and the downloadable repair kit intentionally remain below the live
    // game surface as post-action evidence/reporting, not as the interaction itself.
    ensureTransferWorld(surface,a);
  }

  function migrate(a=lastAttempt){
    lastAttempt=a||lastAttempt;
    const root=rootEl();
    if(!root||root.hidden||historical(root)||!lastAttempt?.snapshot?.rescue)return;
    const level=levelOf(lastAttempt);
    if(level===7){migrateTransfer(root,lastAttempt);return;}
    const world=root.querySelector('.rg-world');
    if(!world)return;
    world.dataset.playCanvasChapter=String(level);
    if(level>=2&&level<=5)migrateFieldMission(root,world,level);
    else if(level===6)migrateBuilder(root,world);
  }

  function queueMigration(){
    if(migrationQueued)return;
    migrationQueued=true;
    queueMicrotask(()=>{
      migrationQueued=false;
      migrate(lastAttempt);
    });
  }

  const previousRender=game.render.bind(game);
  const previousSync=game.sync.bind(game);
  const previousHide=game.hide.bind(game);
  game.render=(a,...rest)=>{
    disposeTransferWorld();
    const result=previousRender(a,...rest);migrate(a);return result;
  };
  game.sync=(busy,a,...rest)=>{const result=previousSync(busy,a,...rest);lastAttempt=a||lastAttempt;queueMigration();return result;};
  game.hide=(...args)=>{disposeTransferWorld();return previousHide(...args);};

  // RescueGame internally rerenders route construction when a slot/block changes,
  // bypassing the exported render wrapper above. Observe only child-list changes so
  // those semantic rerenders are re-spatialized without reacting to class/style work.
  // The migration is idempotent; the queued microtask collapses a rerender burst.
  const migrationRoot=document.querySelector('#workspace')||document.body;
  const observer=new MutationObserver(queueMigration);
  observer.observe(migrationRoot,{childList:true,subtree:true});

  game.__playCanvasMigrationV2=true;
})();