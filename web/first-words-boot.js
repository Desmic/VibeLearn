function failed(message){
  const loading=document.querySelector('#loading');loading.hidden=false;loading.replaceChildren();
  const p=document.createElement('p');p.textContent=message;
  const button=document.createElement('button');button.textContent='Reload Bellweather';button.onclick=()=>location.reload();loading.append(p,button);
}
window.addEventListener('game-entry-failed',e=>failed(e.detail));
import('./first-words.js').catch(()=>failed('Bellweather could not load. Your saved progress is safe.'));
