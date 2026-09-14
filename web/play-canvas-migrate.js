/* Incremental Relay Rescue -> Play Canvas DOM migration.
   Reparents the existing semantic controls; it does not clone actions or change server/evidence semantics. */
'use strict';
(() => {
  const game=window.RescueGame;
  if(!game||game.__playCanvasMigrationV2)return;
  let lastAttempt=null;
  let transferWorld=null,transferHost=null,transferMountToken=0;
  let transferView=null,transferAttempt=null;
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
    transferView=transferWorld?.getPlayerView?.()||transferView;
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
    window.GameWorldStatus?.set(surface,'loading');
    const token=++transferMountToken;
    transferView=transferWorld?.getPlayerView?.()||transferView;
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
        surface.dataset.playCanvasBackend='unavailable';
        window.GameWorldStatus?.set(surface,'failed');
        surface.dataset.playCanvasError=String(world?.error||'PlayCanvas unavailable').slice(0,180);
        return;
      }
      transferWorld=world;transferHost=surface;
      surface.dataset.playCanvasBackend='playcanvas';
      window.GameWorldStatus?.set(surface,'ready');
      const canvas=surface.querySelector('canvas');
      canvas?.addEventListener('webglcontextlost',e=>{e.preventDefault();window.GameWorldStatus?.set(surface,'failed');});
      canvas?.addEventListener('webglcontextrestored',()=>window.GameWorldStatus?.set(surface,'ready'));
      delete surface.dataset.playCanvasError;
      world.setTransferState?.(transferPresentationState(a));
      if(transferAttempt===a?.id)world.restorePlayerView?.(transferView);
      else transferView=null;
      transferAttempt=a?.id;
    }catch(error){
      if(token!==transferMountToken)return;
      surface.dataset.playCanvasBackend='unavailable';
        window.GameWorldStatus?.set(surface,'failed');
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

    // Resolve by semantic identity from the whole encounter, not by assuming the
    // elements are still direct field children. Internal RescueGame route edits
    // replace the raw encounter DOM, while a repeated migration sees nodes that
    // may already live in this HUD. Both states must converge to the same layout.
    const incident=root.querySelector('.rg-incident');
    const bench=root.querySelector('.rg-workbench');
    const clear=root.querySelector('.rg-clear');
    const runButton=root.querySelector('#rg-run');
    const note=root.querySelector('.rg-run-note');
    const aid=root.querySelector('.rg-help-label');
    const machineControls=root.querySelector('.rg-machine-controls');
    const actions=runButton?.closest('.rg-build-actions')||root.querySelector('.rg-build-actions');

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

    // RescueStage may have already moved these exact semantic controls into its
    // machine-controls wrapper. Keep the declaration visible, remove duplicated
    // tutorial prose, and move only the commit action into the world-owned CTA.
    // This changes presentation only; the same select/button still own evidence.
    const blockHelp=bench?.querySelector('.rg-block-help');
    if(blockHelp)blockHelp.hidden=true;
    if(note)note.hidden=true;
    if(aid&&!clear){
      const select=aid.querySelector('select');
      if(select&&aid.firstChild?.nodeType===Node.TEXT_NODE)aid.firstChild.textContent='Help used?';
      // These controls share one flow layout: neither may claim the other's
      // pointer area when the declaration text or viewport size changes.
      const header=makeLayer(hud,'play-canvas-transfer-header','Transfer route controls');
      if(aid.parentElement!==header)header.append(aid);
      const footer=root.querySelector('.rg-bench-footer');
      if(footer&&footer.parentElement!==header)header.append(footer);
    }
    if(bench){
      const title=bench.querySelector('.rg-bench-title b');
      if(title)title.textContent='Worker → export service';
    }
    surface.setAttribute('aria-label','Export recovery: resumed worker to external export service');
    if(runButton){
      let runWrap=hud.querySelector(':scope > .play-canvas-transfer-run');
      if(!runWrap){
        runWrap=document.createElement('div');
        runWrap.className='rg-build-actions play-canvas-route-run play-canvas-transfer-run';
        hud.append(runWrap);
      }
      if(runButton.parentElement!==runWrap)runWrap.append(runButton);
    }
    if(machineControls&&!machineControls.childElementCount)machineControls.remove();
    if(actions&&actions!==runButton?.parentElement&&!actions.childElementCount)actions.remove();

    if(clear){
      clear.hidden=false;
      clear.classList.add('play-canvas-storm-outcome');
      const passed=a?.assessment?.outcome==='correct';
      const status=clear.querySelector(':scope > span');
      const heading=clear.querySelector('h2');
      const copy=clear.querySelector('p');
      if(status)status.textContent=passed?'✓ INCIDENT STABLE':'⚠ INCIDENT UNSAFE';
      if(heading)heading.textContent=passed?'Export recovery holds.':'Incident tests found a counterexample.';
      if(copy)copy.textContent=passed?'One durable job intent survived worker restart without creating a duplicate file.':'Revise the recovery policy before this worker can safely resume.';
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
  game.hide=(...args)=>{disposeTransferWorld();transferView=null;transferAttempt=null;return previousHide(...args);};

  // RescueGame internally replaces #rescue-game children when a route slot/block
  // changes, bypassing the exported render wrapper above. Observe that boundary
  // only. Reparenting controls into our HUD mutates deeper descendants, which must
  // not recursively schedule migration again.
  const migrationRoot=document.querySelector('#workspace')||document.body;
  const observer=new MutationObserver(records=>{
    const root=rootEl();
    if(!root)return;
    const rerendered=records.some(record=>{
      if(record.target===root)return true;
      return [...record.addedNodes].some(node=>node===root||node?.id==='rescue-game');
    });
    if(rerendered)queueMigration();
  });
  observer.observe(migrationRoot,{childList:true,subtree:true});

  game.__playCanvasMigrationV2=true;
})();
