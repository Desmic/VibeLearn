import * as T from 'three';

// What the Gate opens onto when the notes point somewhere wrong (run 17 asked for "the poster
// opening the Gate onto nothing"). The Gate opens where its notes say, so a wrong pair of notes
// shows its destination in the arch, painted: empty sky where the Old Bridge used to be, stairs
// climbing into fog, stairs to an empty landing. Shown, then the seal comes back.
// A small canvas painted a few seconds at a time: nothing for a phone to carry.

export type GateViewKind = 'bridge' | 'fog' | 'nowhere';

const W = 256, H = 240;   // the arch's shape: 3.24 m wide, 3.02 m tall (a half circle on a box)
export const ARCH = { w: 3.24, h: 3.02, spring: 1.4 };

export function gateView() {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d')!;
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
  const mat = new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const mesh = new T.Mesh(new T.PlaneGeometry(ARCH.w, ARCH.h), mat); mesh.name = 'gate-view'; mesh.visible = false; mesh.renderOrder = 2;

  const arch = () => { const r = W / 2, springY = H - ARCH.spring / ARCH.h * H; c.beginPath(); c.moveTo(0, H); c.lineTo(0, springY); c.arc(r, springY, r, Math.PI, 0); c.lineTo(W, H); c.closePath(); };
  const cloud = (x: number, y: number, s: number, a = .8) => { c.fillStyle = `rgba(255,255,255,${a})`; for (const [dx, dy, r] of [[0, 0, 1], [.9, .15, .75], [-.85, .2, .7], [.35, -.35, .7]]) { c.beginPath(); c.ellipse(x + dx * 14 * s, y + dy * 14 * s, 16 * r * s, 11 * r * s, 0, 0, Math.PI * 2); c.fill(); } };
  const steps = (x: number, y0: number, n: number, w0: number, h: number, shrink: number, fade: (i: number) => number) => {
    for (let i = 0; i < n; i++) {
      const w = w0 * (1 - i * shrink), y = y0 - i * h, a = fade(i); if (a <= 0) break;
      c.fillStyle = `rgba(214,201,182,${a})`; c.fillRect(x - w / 2, y - h, w, h);
      c.fillStyle = `rgba(160,146,128,${a})`; c.fillRect(x - w / 2, y - h * .25, w, h * .25);
    }
  };

  function paint(kind: GateViewKind, t: number) {
    c.clearRect(0, 0, W, H); c.save(); arch(); c.clip();
    const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#7fc0ec'); sky.addColorStop(.7, '#cfe8f7'); sky.addColorStop(1, '#eef7fc');
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    const drift = t * 6;
    cloud(40 + drift, 70, 1.2, .75); cloud(190 - drift * .6, 120, 1, .7); cloud(110 + drift * .4, 200, 1.6, .9);
    if (kind === 'bridge') {
      // the bell gardens, far off and out of reach
      c.fillStyle = '#9db7a8'; c.beginPath(); c.ellipse(200, 58, 34, 9, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#7d6f86'; c.beginPath(); c.moveTo(168, 58); c.lineTo(232, 58); c.lineTo(200, 84); c.closePath(); c.fill();
      c.fillStyle = '#d9b45a'; for (const x of [190, 204, 214]) { c.beginPath(); c.arc(x, 49, 3, 0, Math.PI * 2); c.fill(); }
      // two broken ends of the Old Bridge, nothing between
      const deck = (x0: number, x1: number, dir: number) => {
        c.fillStyle = '#b9a58c'; c.beginPath(); c.moveTo(x0, 150); c.lineTo(x1, 150); c.lineTo(x1 - dir * 6, 156); c.lineTo(x1 + dir * 3, 161); c.lineTo(x1 - dir * 4, 166); c.lineTo(x0, 166); c.closePath(); c.fill();
        c.fillStyle = '#8c7a66'; c.fillRect(Math.min(x0, x1), 166, Math.abs(x1 - x0) - 6, 5);
        c.fillStyle = '#7a6a58'; for (let x = x0 + dir * 10; dir * (x1 - x) > 8; x += dir * 22) c.fillRect(x - 2, 132, 4, 18);
        c.fillRect(Math.min(x0, x1 - dir * 8), 132, Math.abs(x1 - dir * 8 - x0), 3);
      };
      deck(0, 92, 1); deck(W, 168, -1);
      // a last plank, falling
      if (t < 3) { const y = 158 + 60 * t * t, a = t * 2.2; c.save(); c.translate(130 + t * 10, y); c.rotate(a); c.fillStyle = '#b9a58c'; c.fillRect(-14, -3, 28, 6); c.restore(); }
    } else if (kind === 'fog') {
      // stairs to the bell gardens… from somewhere, into a fog nobody wrote down
      steps(W / 2, H, 9, 120, 16, .075, () => 1);
      const fog = c.createLinearGradient(0, 0, 0, H * .62); fog.addColorStop(0, 'rgba(250,250,252,1)'); fog.addColorStop(.75, 'rgba(250,250,252,.85)'); fog.addColorStop(1, 'rgba(250,250,252,0)');
      c.fillStyle = fog; c.fillRect(0, 0, W, H * .62);
      cloud(70 - drift * .5, 60, 1.4, .9); cloud(180 + drift * .3, 80, 1.5, .9);
    } else {
      // the Lotus Terraces stairs, climbing to a landing with nothing on it
      steps(W / 2, H, 7, 110, 16, .06, () => 1);
      const y = H - 7 * 16; c.fillStyle = '#d6c9b6'; c.beginPath(); c.ellipse(W / 2, y, 52, 11, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#a0927f'; c.fillRect(W / 2 - 52, y, 104, 6);
      c.fillStyle = '#e9a3bd'; for (const dx of [-34, 30]) { c.beginPath(); c.arc(W / 2 + dx, y - 3, 5, 0, Math.PI * 2); c.fill(); }
    }
    c.restore();
    // the arch's rim, so it reads as a doorway
    arch(); c.lineWidth = 6; c.strokeStyle = 'rgba(123,79,214,.55)'; c.stroke();
    tex.needsUpdate = true;
  }

  let kind: GateViewKind | null = null, t = 0, want = 0, shown = 0;
  return {
    mesh,
    /** opacity of the view (the seal fades as it shows) */
    get shown() { return shown; },
    show(k: GateViewKind) { kind = k; t = 0; want = 1; mesh.visible = true; paint(k, 0); },
    hide() { want = 0; },
    tick(dt: number) {
      if (!mesh.visible) return;
      shown += (want - shown) * Math.min(1, dt * 4); if (Math.abs(want - shown) < .01) shown = want;
      mat.opacity = shown;
      if (want && kind && t < 4) { t += dt; paint(kind, t); }   // still after the plank has gone
      if (!want && shown === 0) { mesh.visible = false; kind = null; }
    },
  };
}
