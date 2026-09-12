/* Incremental Relay Rescue -> Play Canvas DOM migration.
   Reparents the existing semantic controls; it does not clone actions or change server/evidence semantics. */
'use strict';
(() => {
  const game=window.RescueGame;
  if(!game||game.__playCanvasMigrationV2)return;
  let lastAttempt=null;

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
    const actions=root.querySelector('.rg-build-actions');
    const results=root.querySelector('.rg-results');
    if(bench){
      bench.classList.add('play-canvas-route-tools');
      bench.querySelector('.rg-slots')?.classList.add('play-canvas-route-nodes');
      bench.querySelector('.rg-palette')?.classList.add('play-canvas-toolbelt');
      if(bench.parentElement!==hud)hud.append(bench);
    }
    if(actions){actions.classList.add('play-canvas-route-run');if(actions.parentElement!==hud)hud.append(actions);}
    if(results){results.classList.add('play-canvas-storm-outcome');if(results.parentElement!==hud)hud.append(results);}
  }

  function migrateTransfer(root){
    const field=root.querySelector('.rg-field');
    if(!field)return;
    let surface=field.querySelector(':scope > .play-canvas-transfer-surface');
    if(!surface){
      surface=document.createElement('section');
      surface.className='play-canvas-transfer-surface';
      surface.dataset.playCanvasBackend='dom';
      surface.dataset.playCanvasMode='transfer';
      surface.setAttribute('aria-label','Field transfer mission');
      field.prepend(surface);
    }
    for(const node of [field.querySelector(':scope > .rg-incident'),field.querySelector(':scope > .rg-workbench'),field.querySelector(':scope > .rg-build-actions'),field.querySelector(':scope > .rg-clear'),field.querySelector(':scope > .rg-kit')]){
      if(node&&node.parentElement!==surface)surface.append(node);
    }
    const results=root.querySelector(':scope > .rg-encounter > .rg-results');
    if(results&&results.parentElement!==surface)surface.append(results);
  }

  function migrate(a=lastAttempt){
    lastAttempt=a||lastAttempt;
    const root=rootEl();
    if(!root||root.hidden||historical(root)||!lastAttempt?.snapshot?.rescue)return;
    const level=levelOf(lastAttempt);
    if(level===7){migrateTransfer(root);return;}
    const world=root.querySelector('.rg-world');
    if(!world)return;
    world.dataset.playCanvasChapter=String(level);
    if(level>=2&&level<=5)migrateFieldMission(root,world,level);
    else if(level===6)migrateBuilder(root,world);
  }

  const previousRender=game.render.bind(game);
  const previousSync=game.sync.bind(game);
  game.render=(a,...rest)=>{const result=previousRender(a,...rest);migrate(a);return result;};
  game.sync=(busy,a,...rest)=>{const result=previousSync(busy,a,...rest);lastAttempt=a||lastAttempt;queueMicrotask(()=>migrate(lastAttempt));return result;};
  game.__playCanvasMigrationV2=true;
})();
