/* Keep an import/engine failure actionable under the strict same-origin CSP. */
function failed(message){
  const loading=document.querySelector('#loading');loading.hidden=false;loading.replaceChildren();
  const explanation=document.createElement('p');explanation.textContent=message;
  const reload=document.createElement('button');reload.textContent='Reload workshop';reload.onclick=()=>location.reload();
  loading.append(explanation,reload);
}
window.addEventListener('game-entry-failed',event=>failed(event.detail));
import('./word-machine.js').catch(()=>failed('The 3D workshop could not load. Your saved progress is safe.'));
