// Detail budget: a last line of defence for slow devices. Adaptive resolution
// reacts first; if frames still stay slow, the world sheds detail one step at
// a time (small scatter drawn only near the player), and wins it back once
// there is headroom again. Worlds read `budget.radius`; any game can reuse it.

export const budget = {
  level: 0,
  radii: [32, 20, 12],
  get radius() { return this.radii[Math.min(this.level, this.radii.length - 1)]; },
};

export function frameGovernor(targetMs = 16.7) {
  let last = performance.now(), frames: number[] = [], changedAt = last, goodSince = -1;
  return function tick(now = performance.now()) {
    const dt = now - last; last = now;
    if (dt > 250) { frames = []; return; }            // tab switch or a hitch
    frames.push(dt); if (frames.length > 90) frames.shift();
    if (frames.length < 90 || now - changedAt < 4000) return;
    const med = [...frames].sort((a, b) => a - b)[45];
    if (med > targetMs * 1.6 && budget.level < budget.radii.length - 1) { budget.level++; changedAt = now; frames = []; goodSince = -1; console.info('[budget] less detail', budget.level, med.toFixed(1)); }
    else if (med < targetMs * 1.05 && budget.level > 0) {
      if (goodSince < 0) goodSince = now;
      else if (now - goodSince > 10000) { budget.level--; changedAt = now; frames = []; goodSince = -1; console.info('[budget] more detail', budget.level); }
    } else goodSince = -1;
  };
}
