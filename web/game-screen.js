/* Full-viewport game shell and user-initiated browser fullscreen. */
'use strict';
(() => {
  let queued=false;
  async function fullscreen(button){
    try{
      if(document.fullscreenElement)await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    }catch(_){button.title='Browser fullscreen is unavailable. The game still fills this window.';}
  }
  function apply(){
    queued=false;
    const root=document.querySelector('#rescue-game');
    document.body.classList.toggle('game-screen-active',Boolean(root&&!root.hidden));
    if(!root||root.hidden)return;
    if(document.fullscreenEnabled&&!root.querySelector('#game-fullscreen')){
      const button=document.createElement('button');button.type='button';button.id='game-fullscreen';button.innerHTML='<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6"/></svg>';button.setAttribute('aria-label','Enter fullscreen');button.onclick=()=>fullscreen(button);root.querySelector('.rg-top>div')?.append(button);
    }
    const intro=root.querySelector('.rgi-storybar');
    if(intro&&document.fullscreenEnabled&&!intro.querySelector('.opening-fullscreen')){
      const button=document.createElement('button');button.type='button';button.className='opening-fullscreen';button.innerHTML='<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6"/></svg>';button.setAttribute('aria-label','Enter fullscreen');button.onclick=()=>fullscreen(button);intro.append(button);
    }
    // Long secondary records remain available without turning active play into
    // a scrolling document. Opening a drawer uses the existing semantic nodes.
    const secondary=[...root.querySelectorAll('.rg-evidence,#rg-kit,.rg-encounter>.rg-results')].filter(n=>!n.closest('.game-records'));
    if(secondary.length){
      let records=root.querySelector('.game-records');
      if(!records){records=document.createElement('details');records.className='game-records';records.innerHTML='<summary>Journal & repair kit</summary><div class="game-records-content"></div>';root.querySelector('#rg-menu')?.append(records);}
      secondary.forEach(n=>records.querySelector('.game-records-content').append(n));
    }
  }
  function queue(){if(!queued){queued=true;queueMicrotask(apply);}}
  const observer=new MutationObserver(records=>{if(records.some(r=>r.target.id==='rescue-game'||r.target.id==='workspace'||r.attributeName==='hidden'||[...r.addedNodes].some(n=>n.id==='rgi-intro')))queue();});
  observer.observe(document.querySelector('#workspace'),{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  document.addEventListener('fullscreenchange',()=>document.querySelectorAll('#game-fullscreen,.opening-fullscreen').forEach(button=>button.setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen')));
  queue();
})();
