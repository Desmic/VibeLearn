/* Preserve the learner's local route intent across presentation redraws.
   Server-owned moves/results remain authoritative; this only restores the existing
   draft recovery envelope that app.js already persists in localStorage. */
'use strict';
(() => {
  const game = window.RescueGame;
  if (!game || game.__draftRecoveryGuard) return;

  const originalRender = game.render.bind(game);
  let lastAttemptId = null;

  game.render = (attempt, missions, handlers) => {
    const sameAttempt = Boolean(lastAttemptId && attempt?.id === lastAttemptId);
    const before = sameAttempt ? game.response() : null;
    const server = attempt?.response?.rescue || null;
    const hasLocalRoute = Boolean(
      before && Array.isArray(before.draft) &&
      JSON.stringify(before) !== JSON.stringify(server)
    );

    const result = originalRender(attempt, missions, handlers);
    lastAttemptId = attempt?.id || null;

    // render() projects server state and may refresh its presentation cache. If
    // app.js just recovered a newer local draft for this SAME attempt, restore
    // only the route plan after that redraw. updateProgram() re-populates the
    // recovery envelope and marks it unsaved; it never executes or grades it.
    if (hasLocalRoute && attempt?.status === 'draft' && attempt?.snapshot?.rescue?.level >= 6) {
      game.restorePlan(before.draft);
    }
    return result;
  };

  game.__draftRecoveryGuard = true;
})();