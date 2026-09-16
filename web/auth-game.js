import {createPlayCanvasWorld} from './playcanvas-backend.js';
import {worldSpec} from './first-words-world.js';

const $=selector=>document.querySelector(selector);
const status=$('#entry-status');
let world=null;

function setStatus(message,error=false){status.textContent=message||'';status.dataset.error=String(Boolean(error));}
function togglePassword(button){
  const input=document.getElementById(button.dataset.passwordToggle);if(!input)return;
  const show=input.type==='password';input.type=show?'text':'password';button.textContent=show?'Hide':'Show';button.setAttribute('aria-pressed',String(show));
}
document.querySelectorAll('[data-password-toggle]').forEach(button=>button.addEventListener('click',()=>togglePassword(button)));

async function api(path,body){
  const response=await fetch(path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json','X-Learning-Command':'1'}:{},body:body?JSON.stringify(body):undefined});
  let data={};try{data=await response.json();}catch(_){}
  if(!response.ok){const error=new Error(data.message||data.error||`Request failed (${response.status})`);error.status=response.status;error.requestId=data.request_id;throw error;}
  return data;
}

async function mountWorld(){
  const host=$('#auth-world'),worldStatus=$('#world-status');
  try{
    world=createPlayCanvasWorld(host,worldSpec,{interactive:false,pixelRatioCap:1.5,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
    if(!world.available)throw new Error(world.error||'PlayCanvas unavailable');
    world.applyPatch({camera:'home',show:['zip','singer','our-lantern'],hide:['warden','singer-cage','stolen-voice','wrong-ring','reunion-ring','route-glow']});
    const deadline=performance.now()+15000;
    while(world.stats().assetsPending>0&&performance.now()<deadline)await new Promise(resolve=>requestAnimationFrame(resolve));
    const stats=world.stats();
    if(stats.assetsFailed||stats.assetsPending)throw new Error('Required 3D assets did not finish loading');
    worldStatus.hidden=true;host.dataset.engine='playcanvas';
    const canvas=host.querySelector('canvas');
    canvas?.addEventListener('webglcontextlost',event=>{event.preventDefault();worldStatus.hidden=false;worldStatus.textContent='Bellweather lost its 3D context. Reload to return.';});
  }catch(error){
    worldStatus.hidden=false;worldStatus.replaceChildren();
    const text=document.createElement('span');text.textContent='Bellweather 3D could not load. ';
    const retry=document.createElement('button');retry.type='button';retry.textContent='Retry 3D';retry.onclick=()=>location.reload();
    worldStatus.append(text,retry);
    console.error(error);
  }
}

const fragment=new URLSearchParams(location.hash.slice(1));
let recovery=fragment.get('type')==='recovery'?{access_token:fragment.get('access_token'),refresh_token:fragment.get('refresh_token')}:null;
if(fragment.has('access_token')||fragment.has('error'))history.replaceState(null,'',location.pathname);

async function routeExistingSession(){
  try{await api('/api/state');location.replace('/first-words');return true;}
  catch(error){if(error.status!==401)throw error;return false;}
}

$('#sign-in-form').addEventListener('submit',async event=>{
  event.preventDefault();const button=$('#login-submit');button.disabled=true;setStatus('Opening Bellweather…');
  try{
    await api('/api/auth/login',{email:$('#login-email').value,password:$('#login-password').value});
    $('#login-password').value='';location.replace('/first-words');
  }catch(error){setStatus((error.message||'Sign-in failed.')+(error.requestId?` Reference: ${error.requestId}`:''),true);button.disabled=false;}
});

$('#request-reset').addEventListener('click',async()=>{
  if(!$('#login-email').reportValidity())return;
  const button=$('#request-reset');button.disabled=true;setStatus('Sending recovery lantern…');
  try{const result=await api('/api/auth/request-reset',{email:$('#login-email').value});setStatus(result.message||'If recovery is available, a reset link is on its way.');}
  catch(error){setStatus(error.message,true);}finally{button.disabled=false;}
});

$('#reset-form').addEventListener('submit',async event=>{
  event.preventDefault();const button=event.currentTarget.querySelector('button[type="submit"]');button.disabled=true;
  try{
    if(!recovery?.access_token||!recovery?.refresh_token)throw new Error('Request a new reset link.');
    await api('/api/auth/reset-password',{...recovery,password:$('#new-password').value});
    recovery=null;$('#new-password').value='';$('#password-reset').hidden=true;$('#sign-in').hidden=false;setStatus('Password updated. Sign in to continue to Level 1.');
  }catch(error){$('#reset-status').textContent=error.message+(error.requestId?` Reference: ${error.requestId}`:'');}
  finally{button.disabled=false;}
});

async function boot(){
  mountWorld();
  try{
    const config=await api('/api/config');
    if(!config.hosted){location.replace('/first-words');return;}
    if(recovery){$('#sign-in').hidden=true;$('#password-reset').hidden=false;return;}
    if(fragment.has('error'))setStatus('That recovery link is invalid or expired. Request a new one.',true);
    await routeExistingSession();
  }catch(error){setStatus(`Could not open Bellweather: ${error.message}`,true);}
}

window.addEventListener('pagehide',()=>world?.dispose?.(),{once:true});
boot();
