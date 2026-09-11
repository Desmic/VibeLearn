/* Hosted campaign progress controls: review cleared signals without losing the active run,
   reset progress only after confirmation, and keep recovered local route drafts visible. */
'use strict';
(() => {
  const game = window.RescueGame;
  if (!game || game.__progressControls) return;

  const originalMap = game.map.bind(game);
  const originalRender = game.render.bind(game);
  const originalSetResponse = game.setResponse.bind(game);
  let responsePreparedForRender = null;

  /* app.js intentionally restores a device-local draft through setResponse before
     rendering the server attempt. Remember that prepared response for one render.
     This keeps unsaved route-builder edits visible after reload without mutating
     server state or weakening the normal server-authoritative render path. */
  game.setResponse = value => {
    responsePreparedForRender = structuredClone(value || {moves:[], draft:[]});
    return originalSetResponse(value);
  };

  function hostedReady() {
    try { return Boolean(hosted); } catch (_) { return false; }
  }

  function currentMissionId(activeAttempt) {
    return activeAttempt?.snapshot?.mission?.id || null;
  }

  function addReviewBanner(missionId) {
    const root = document.querySelector('#rescue-game');
    if (!root || root.querySelector('.rg-review-banner')) return;
    const banner = document.createElement('div');
    banner.className = 'rg-review-banner';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = 'PAST SIGNAL · READ-ONLY REVIEW';
    const text = document.createElement('span');
    text.textContent = `You are revisiting ${missionId}. Your current unfinished signal is still saved and untouched.`;
    copy.append(title, text);
    const back = document.createElement('button');
    back.type = 'button';
    back.textContent = 'Return to current signal →';
    back.onclick = () => showRun();
    banner.append(copy, back);
    root.prepend(banner);
  }

  async function reviewMission(missionId) {
    if (!hostedReady()) return;
    clearError();
    try {
      const historical = await api(`/api/history/rescue/${encodeURIComponent(missionId)}`);
      campaignView = false;
      originalRender(historical, state.course.rescue, {
        ...rescueHandlers(),
        start: () => showRun(),
        resume: () => showRun(),
        campaign: showCampaign,
      });
      addReviewBanner(missionId);
      document.querySelector('#rescue-game')?.focus({preventScroll:true});
      window.scrollTo({top:0,behavior:'smooth'});
    } catch (error) {
      showError(error.message || 'That completed signal could not be opened.');
    }
  }

  function clearProgressRecovery() {
    try {
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const key = localStorage.key(i);
        if (key?.startsWith('learning-draft:') || key?.startsWith('vibelearn.relay-rescue.')) localStorage.removeItem(key);
      }
    } catch (_) { /* server reset remains authoritative */ }
  }

  function ensureDialog() {
    let dialog = document.querySelector('#progress-reset-dialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'progress-reset-dialog';
    dialog.className = 'progress-confirm';
    dialog.setAttribute('aria-labelledby','progress-reset-title');
    dialog.innerHTML = `<div class="progress-confirm-card"><span class="rg-eyebrow">RESET CAMPAIGN</span><h2 id="progress-reset-title">Erase all Relay Rescue progress?</h2><p>This removes every mission attempt, clear, XP reward, hint/evidence record and review schedule for this player. Your account and sign-in stay intact.</p><div class="progress-confirm-actions"><button type="button" class="progress-confirm-cancel">Keep my progress</button><button type="button" class="progress-confirm-danger">Reset everything</button></div><p class="progress-confirm-note">This cannot be undone.</p></div>`;
    document.body.append(dialog);
    dialog.querySelector('.progress-confirm-cancel').onclick = () => dialog.close('cancel');
    dialog.addEventListener('cancel', event => { event.preventDefault(); dialog.close('cancel'); });
    dialog.querySelector('.progress-confirm-danger').onclick = async event => {
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = 'Resetting…';
      try {
        await api('/api/progress/reset', {confirmation:'RESET_PROGRESS'});
        clearProgressRecovery();
        dialog.close('reset');
        location.reload();
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Reset everything';
        dialog.close('error');
        showError((error.message || 'Progress reset failed.') + (error.requestId ? ` Reference: ${error.requestId}` : ''));
      }
    };
    return dialog;
  }

  function openReset() {
    if (!hostedReady() || busy) return;
    const dialog = ensureDialog();
    if (!dialog.open) dialog.showModal();
  }

  function decorateMenu(root) {
    if (!hostedReady() || !root) return;
    const menu = root.querySelector('#rg-menu');
    if (!menu || menu.querySelector('.rg-reset-progress')) return;
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'rg-reset-progress';
    reset.textContent = 'Reset all progress';
    reset.onclick = openReset;
    menu.append(reset);
  }

  game.map = (missions, activeAttempt, handlers) => {
    const result = originalMap(missions, activeAttempt, handlers);
    if (!hostedReady()) return result;
    const root = document.querySelector('#rescue-game');
    decorateMenu(root);
    const active = activeAttempt?.status === 'draft';
    const activeId = currentMissionId(activeAttempt);
    root?.querySelectorAll('[data-mission]').forEach(button => {
      button.onclick = () => {
        const missionId = button.dataset.mission;
        const status = button.dataset.status;
        if (!active) return handlers.start(missionId);
        if (missionId === activeId) return handlers.resume();
        if (status === 'cleared') return reviewMission(missionId);
        handlers.error('Your current signal is still in progress. Finish it, reset progress, or choose one of the cleared signals to review.');
      };
    });
    return result;
  };

  game.render = (activeAttempt, missions, handlers) => {
    const prepared = responsePreparedForRender;
    responsePreparedForRender = null;
    const serverResponse = activeAttempt?.response?.rescue;
    const recoverLocal = Boolean(
      activeAttempt?.status === 'draft' &&
      prepared && serverResponse &&
      JSON.stringify(prepared) !== JSON.stringify(serverResponse)
    );

    let result = originalRender(activeAttempt, missions, handlers);
    if (recoverLocal) {
      // Some render paths rebuild the route UI from authoritative attempt state.
      // Reapply the already-selected local recovery envelope after that rebuild,
      // then render once more so the visible slots match the recovered draft.
      originalSetResponse(prepared);
      result = originalRender(activeAttempt, missions, handlers);
    }
    decorateMenu(document.querySelector('#rescue-game'));
    return result;
  };

  game.__progressControls = true;
})();
