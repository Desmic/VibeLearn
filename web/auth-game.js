/* Present hosted auth as entry into Relay Rescue without changing auth behavior. */
'use strict';
(() => {
  const makeStage = (reset = false) => {
    const stage = document.createElement('section');
    stage.className = 'auth-game-stage';
    stage.setAttribute('aria-label', reset ? 'Relay Rescue account recovery scene' : 'Relay Rescue valley scene');
    stage.innerHTML = `<div class="auth-moon"></div><div class="auth-mountains"></div><div class="auth-water"></div><div class="auth-island left"></div><div class="auth-island right"></div><div class="auth-route"></div><div class="auth-pip"><span></span></div><div class="auth-workshop"></div><div class="auth-envelope"></div><div class="auth-storm"></div><div class="auth-signals">${Array.from({length:7},()=>'<i class="auth-signal"></i>').join('')}</div><div class="auth-stage-copy"><span>${reset?'RECOVERY BEACON':'RELAY RESCUE · THE MISSING DELIVERY'}</span><h1>${reset?'Reconnect your run.':'The valley is waiting.'}</h1><p>${reset?'Restore account access without losing the rescue state you already earned.':'Pip sent one order for a bridge gear. The storm swallowed the reply. Enter the campaign to find out what happened without accidentally creating two deliveries.'}</p><div class="auth-stage-objective"><small>${reset?'YOUR PROGRESS':'YOUR FIRST MISSION'}</small><strong>${reset?'Campaign state stays with your account.':'One intent → one safe result'}</strong></div></div>`;
    return stage;
  };

  function enhance(id, reset=false) {
    const screen = document.querySelector(id);
    if (!screen || screen.dataset.gameAuth === '1') return;
    screen.dataset.gameAuth = '1';
    screen.classList.add('auth-game-screen');
    const children = [...screen.childNodes];
    const panel = document.createElement('div');
    panel.className = 'auth-access-panel';
    children.forEach(node => panel.append(node));
    const lock = document.createElement('div');
    lock.className = 'auth-lockline';
    lock.textContent = reset ? 'Secure recovery · existing campaign state preserved' : 'Private pilot access · progress stays scoped to your account';
    panel.append(lock);
    screen.append(makeStage(reset), panel);
  }

  const apply = () => { enhance('#sign-in'); enhance('#password-reset', true); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, {once:true});
  else apply();
})();