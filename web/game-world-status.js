/* Shared recovery UI, never a second gameplay renderer. */
'use strict';
window.GameWorldStatus={
  set(host,status){
    if(!host)return;
    host.dataset.worldStatus=status;
    let panel=host.querySelector(':scope > .game-world-status');
    if(status==='ready'){panel?.remove();return;}
    if(!panel){
      panel=document.createElement('section');panel.className='game-world-status';panel.setAttribute('role','status');
      panel.innerHTML='<strong></strong><p></p><button type="button">Retry 3D world</button>';
      panel.querySelector('button').onclick=()=>location.reload();host.append(panel);
    }
    panel.querySelector('strong').textContent=status==='loading'?'Entering the world…':'The 3D world could not load.';
    panel.querySelector('p').textContent=status==='loading'?'Preparing the scene.':'Your saved progress is safe. Retry to reconnect to the world.';
    panel.querySelector('button').hidden=status==='loading';
  }
};
