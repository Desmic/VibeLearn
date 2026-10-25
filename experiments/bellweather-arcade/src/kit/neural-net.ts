import * as T from 'three';

// A speech engine drawn as what it is underneath: a small neural network. Layers of nodes rise from
// the words it reads (the inputs) to the words it might say next (the outputs); when it reads, light
// runs up through the layers, each word sending its own stream, and the streams meet in the guess.
// A different set of words lights a different pattern, so taking a word out visibly changes what
// reaches the top. Behind the working layers sits a bigger dormant net, most of it dark: the rest
// of the voice, not woken yet; it lights node by node as the story gives it back.
// Desmic, 25 Oct: "something a little more creative, like an actual representation of neural net,
// showing some activations; the whole game must have a sense of beauty and awe".
//
// Game-agnostic: the game gives where the inputs and outputs sit, the hidden layer sizes, how much of
// the dormant web is awake, and which inputs carry which words. The weights are a stable pseudo-random
// function of a seed and the words (not a trained model: a picture of how one carries its inputs).
// Phone-cheap: one Points object per kind of node, one LineSegments per kind of edge, a small pool of
// pulses, no shaders of its own, no allocation per frame.

export interface NeuralNetOpts {
  /** where each input sits (local to the group), bottom of the net */
  inputs: T.Vector3[];
  /** where each output sits (local), top of the net */
  outputs: T.Vector3[];
  /** nodes per hidden layer, bottom to top */
  hidden: number[];
  /** width of the widest hidden layer, and how far the layers bow back (local metres) */
  width: number; bow?: number;
  /** the dormant web: a bigger, darker net behind the working one (rows of nodes, bottom to top),
   *  `z` behind it; it wakes from the middle outwards */
  dormant?: { rows: number[]; width: number; z: number; y?: [number, number] };
  seed?: number;
  colors?: { lit?: string; hot?: string; dead?: string; crack?: string };
  /** how many each node connects to in the next layer */
  fanout?: number;
  /** a dormant node just woke (for a sound) */
  onWake?: (i: number) => void;
}

type Node = { p: T.Vector3; layer: number; lit: boolean; a: number; want: number; order: number; flare: number };
type Edge = { a: number; b: number; w: number };

const hash = (s: string, seed: number) => { let h = 2166136261 ^ seed; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

let dotTex: T.CanvasTexture | null = null;
function dotTexture() {
  if (dotTex) return dotTex;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d')!;
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.16, 'rgba(255,255,255,.95)'); g.addColorStop(.4, 'rgba(255,255,255,.3)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64); dotTex = new T.CanvasTexture(cv); dotTex.colorSpace = T.SRGBColorSpace; return dotTex;
}
// a dark node is an unlit bulb: a thin ring, so "most of it is dark" reads even when it is small
let ringTex: T.CanvasTexture | null = null;
function ringTexture() {
  if (ringTex) return ringTex;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d')!;
  c.fillStyle = 'rgba(10,20,34,.75)'; c.beginPath(); c.arc(32, 32, 22, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,1)'; c.lineWidth = 6; c.beginPath(); c.arc(32, 32, 22, 0, Math.PI * 2); c.stroke();
  ringTex = new T.CanvasTexture(cv); ringTex.colorSpace = T.SRGBColorSpace; return ringTex;
}
const HIDE = -999;

export function buildNeuralNet(o: NeuralNetOpts) {
  const seed = o.seed ?? 7, rand = rng(seed), fanout = o.fanout ?? 3, bow = o.bow ?? .3;
  const col = { lit: new T.Color(o.colors?.lit ?? '#6fe0c9'), hot: new T.Color(o.colors?.hot ?? '#ffd36b'), dead: new T.Color(o.colors?.dead ?? '#6c87a4'), crack: new T.Color(o.colors?.crack ?? '#b07bff') };
  const group = new T.Group(); group.name = 'neural-net';

  // ── layout: inputs, hidden layers bowed back into a shallow dome, outputs ──
  const nodes: Node[] = [], layers: number[][] = [];
  const y0 = Math.min(...o.inputs.map(p => p.y)), y1 = Math.min(...o.outputs.map(p => p.y));
  const add = (p: T.Vector3, layer: number) => { nodes.push({ p, layer, lit: true, a: 0, want: 0, order: 0, flare: 0 }); return nodes.length - 1; };
  layers.push(o.inputs.map(p => add(p.clone(), 0)));
  const H = o.hidden.length, wMax = Math.max(...o.hidden);
  o.hidden.forEach((n, l) => {
    const k = (l + 1) / (H + 1), y = y0 + (y1 - y0) * k, w = o.width * (.6 + .4 * n / wMax);
    layers.push(Array.from({ length: n }, (_, i) => { const u = n === 1 ? 0 : i / (n - 1) - .5; return add(new T.Vector3(u * w + (rand() - .5) * .06, y + (rand() - .5) * .06 - .05 * (2 * u) ** 2, -bow * (1 - (2 * u) ** 2) - .12 * Math.sin(k * Math.PI)), l + 1); }));
  });
  const OUT = layers.length;
  layers.push(o.outputs.map(p => add(p.clone(), OUT)));

  // ── edges: each node to its nearest few in the next layer (a readable net, not a hairball) ──
  const edges: Edge[] = [];
  const inEdges: number[][] = nodes.map(() => []);
  for (let l = 0; l < layers.length - 1; l++) for (const a of layers[l]) {
    const next = layers[l + 1], all = l === layers.length - 2;
    const near = [...next].sort((x, y) => Math.abs(nodes[x].p.x - nodes[a].p.x) - Math.abs(nodes[y].p.x - nodes[a].p.x)).slice(0, all ? next.length : fanout);
    for (const b of near) { inEdges[b].push(edges.length); edges.push({ a, b, w: .35 + rand() * .65 }); }
  }
  const working = nodes.length;
  // ── the dormant web: a deeper net behind, threaded to itself and, here and there, to the front ──
  const D = o.dormant;
  if (D) {
    const [dy0, dy1] = D.y ?? [y0 - .1, y1 + .2], R = D.rows.length, rowIds: number[][] = [];
    D.rows.forEach((n, r) => {
      const k = R === 1 ? .5 : r / (R - 1), y = dy0 + (dy1 - dy0) * k, w = D.width * (.55 + .45 * Math.sin(Math.PI * (.15 + .7 * k)));
      rowIds.push(Array.from({ length: n }, (_, i) => {
        const u = n === 1 ? 0 : i / (n - 1) - .5, id = add(new T.Vector3(u * w + (rand() - .5) * .08, y + (rand() - .5) * .08, D.z - .15 * (1 - (2 * u) ** 2) + (rand() - .5) * .08), -1);
        nodes[id].order = Math.hypot(u * 1.2, k - .5) + rand() * .18; return id;
      }));
    });
    const front = layers.slice(1, OUT).flat();
    for (let r = 0; r < R; r++) for (const a of rowIds[r]) {
      if (r < R - 1) for (const b of [...rowIds[r + 1]].sort((x, y) => Math.abs(nodes[x].p.x - nodes[a].p.x) - Math.abs(nodes[y].p.x - nodes[a].p.x)).slice(0, 2)) edges.push({ a, b, w: .3 + rand() * .5 });
      if (rand() < .3) { const b = [...front].sort((x, y) => nodes[x].p.distanceTo(nodes[a].p) - nodes[y].p.distanceTo(nodes[a].p))[0]; edges.push({ a: b, b: a, w: .25 + rand() * .3 }); }
    }
  }

  // ── drawing ──
  const dot = dotTexture(), M = nodes.length, E = edges.length;
  const points = (blend: T.Blending, size: number, order: number, map = dot) => {
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(M * 3), 3)); g.setAttribute('color', new T.BufferAttribute(new Float32Array(M * 3), 3));
    const m = new T.Points(g, new T.PointsMaterial({ size, map, vertexColors: true, transparent: true, depthWrite: false, blending: blend, toneMapped: false })); m.frustumCulled = false; m.renderOrder = order; group.add(m); return m;
  };
  const lines = (blend: T.Blending, opacity: number, order: number) => {
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(E * 6), 3)); g.setAttribute('color', new T.BufferAttribute(new Float32Array(E * 6), 3));
    const m = new T.LineSegments(g, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity, depthWrite: false, blending: blend, toneMapped: false })); m.frustumCulled = false; m.renderOrder = order; group.add(m); return m;
  };
  const deadLines = lines(T.NormalBlending, .55, 9), litLines = lines(T.AdditiveBlending, 1, 10);
  const deadPts = points(T.NormalBlending, .12, 11, ringTexture()), litPts = points(T.AdditiveBlending, .2, 12);
  // a soft halo around active nodes: black (invisible, additive) at rest, swelling with activation
  const glowPts = points(T.AdditiveBlending, .62, 12);
  // pulses: bright motes running along edges while it reads
  const PULSES = 160, pulsePos = new Float32Array(PULSES * 3).fill(HIDE), pulseCol = new Float32Array(PULSES * 3);
  const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pulsePos, 3)); pg.setAttribute('color', new T.BufferAttribute(pulseCol, 3));
  const pulsePts = new T.Points(pg, new T.PointsMaterial({ size: .24, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false })); pulsePts.frustumCulled = false; pulsePts.renderOrder = 13; group.add(pulsePts);
  const pulses = Array.from({ length: PULSES }, () => ({ e: 0, t: 0, dur: .3, s: 0, live: false, hot: false }));
  let pk = 0;
  const pulse = (e: number, delay: number, dur: number, s: number, hot = false) => { const p = pulses[pk++ % PULSES]; p.e = e; p.t = -delay; p.dur = dur; p.s = s; p.live = true; p.hot = hot; };

  let awake = 0, t = 0, bloom = 0, flicker = 0;
  const timers: { at: number; fn: () => void }[] = [];
  const later = (s: number, fn: () => void) => timers.push({ at: t + s, fn });
  const dormant = nodes.filter(n => n.layer < 0).sort((a, b) => a.order - b.order);
  const setAwake = (f: number) => { awake = f; const k = Math.round(f * dormant.length); dormant.forEach((n, i) => (n.lit = i < k)); };
  setAwake(0);

  // ── activations: a stable function of which inputs carry which words ──
  const act = new Float32Array(M);
  const pattern = (inputs: (string | null)[]) => {
    act.fill(0); const key = inputs.join('|');
    layers[0].forEach((id, i) => { act[id] = inputs[i] ? .55 + .45 * hash(inputs[i]!, seed) : 0; });
    for (let l = 1; l < OUT; l++) {
      let mx = 0;
      for (const id of layers[l]) { let s = 0; for (const e of inEdges[id]) { const E_ = edges[e]; if (act[E_.a] > 0) s += act[E_.a] * E_.w * (.4 + hash(E_.a + '>' + id + key, seed)); } act[id] = s; mx = Math.max(mx, s); }
      if (mx > 0) for (const id of layers[l]) act[id] = Math.pow(act[id] / mx, 1.7);   // the strongest few stand out
    }
    return act;
  };

  const tmpC = new T.Color();
  const api = {
    group, nodes, layers,
    /** how much of the dormant web is awake, 0..1 */
    setAwake(f: number) { setAwake(f); },
    get awake() { return awake; },
    /** wake the dormant web up to f, node by node over `secs`, each one flaring as it lights */
    wakeTo(f: number, secs = 2) {
      const from = Math.round(awake * dormant.length), to = Math.round(f * dormant.length); awake = f;
      for (let i = from; i < to; i++) { const n = dormant[i]; later((i - from) / Math.max(1, to - from) * secs, () => { n.lit = true; n.flare = 1.6; o.onWake?.(i - from); }); }
      return to - from;
    },
    /** show, without pulses, what these inputs would light, dim: changing the input shows it */
    preview(inputs: (string | null)[], outputs: number[] = [], level = .5) {
      const a = pattern(inputs);
      for (let l = 0; l < OUT; l++) for (const id of layers[l]) nodes[id].want = a[id] * level;
      layers[OUT].forEach((id, i) => (nodes[id].want = (outputs[i] ?? 0) * level));
    },
    /** read: light runs up layer by layer from the inputs that carry words; `outputs` weights how
     *  strongly each output is reached (the guesses' confidence); `hot` the output it says.
     *  Returns the seconds until the light reaches the top. */
    fire(inputs: (string | null)[], outputs: number[], hot = -1, step = .3) {
      const a = Float32Array.from(pattern(inputs));
      layers[OUT].forEach((id, i) => (a[id] = outputs[i] ?? 0));
      for (let i = 0; i < working; i++) nodes[i].want *= .25;
      layers[0].forEach(id => { nodes[id].want = a[id]; nodes[id].flare = a[id] ? 1 : 0; });
      edges.forEach((e, ei) => {
        const l = nodes[e.a].layer; if (l < 0 || a[e.a] < .1 || a[e.b] < .06) return;
        const s = a[e.a] * a[e.b]; pulse(ei, l * step + rand() * .06, step * 1.05, s, l === OUT - 1 && e.b === layers[OUT][hot]);
        if (s > .35) pulse(ei, l * step + step * .45, step * 1.05, s * .7);
      });
      for (let l = 1; l <= OUT; l++) for (const id of layers[l]) { const w = a[id]; later(l * step, () => { nodes[id].want = w; if (w > .25) nodes[id].flare = w; }); }
      // the awake part of the dormant web shimmers with it
      later(OUT * step * .6, () => { for (const n of dormant) if (n.lit) n.flare = .4 + rand() * .4; });
      return OUT * step;
    },
    /** let the activations fade back to the resting glow */
    rest() { for (const n of nodes) n.want = 0; },
    /** the payoff: every awake node flares, and the dark ones stir */
    bloom() { bloom = 1.8; flicker = 1.4; },
    tick(dt: number) {
      t += dt; bloom = Math.max(0, bloom - dt); flicker = Math.max(0, flicker - dt);
      for (let i = timers.length - 1; i >= 0; i--) if (timers[i].at <= t) { const f = timers[i].fn; timers.splice(i, 1); f(); }
      const lp = litPts.geometry.attributes.position.array as Float32Array, lc = litPts.geometry.attributes.color.array as Float32Array;
      const dp = deadPts.geometry.attributes.position.array as Float32Array, dc = deadPts.geometry.attributes.color.array as Float32Array;
      const gp = glowPts.geometry.attributes.position.array as Float32Array, gc = glowPts.geometry.attributes.color.array as Float32Array;
      const k = Math.min(1, dt * 3.5), bl = Math.min(1, bloom);
      for (let i = 0; i < M; i++) {
        const n = nodes[i]; n.a += (n.want - n.a) * k; n.flare = Math.max(0, n.flare - dt * 1.6);
        if (n.lit) {
          const rest = n.layer < 0 ? .3 : .42, b = rest + .08 * Math.sin(t * 1.6 + i * 1.37) + n.a * 1.1 + n.flare * .9 + bl * .7;
          tmpC.copy(col.lit).lerp(col.hot, Math.min(1, n.a * .8 + n.flare * .3 + bl * .4)).multiplyScalar(b);
          lp[i * 3] = n.p.x; lp[i * 3 + 1] = n.p.y; lp[i * 3 + 2] = n.p.z; lc[i * 3] = tmpC.r; lc[i * 3 + 1] = tmpC.g; lc[i * 3 + 2] = tmpC.b; dp[i * 3 + 1] = HIDE;
          const gl = Math.min(1, Math.max(0, n.a - .12) * .9 + n.flare * .45 + bl * .3);
          gp[i * 3] = n.p.x; gp[i * 3 + 1] = gl > .01 ? n.p.y : HIDE; gp[i * 3 + 2] = n.p.z;
          tmpC.copy(col.lit).lerp(col.hot, Math.min(1, n.a + bl * .5)).multiplyScalar(gl * .8); gc[i * 3] = tmpC.r; gc[i * 3 + 1] = tmpC.g; gc[i * 3 + 2] = tmpC.b;
        } else {
          // dark: a cold ember, now and then a violet crackle where it was struck
          const crack = Math.min(1, Math.max(0, Math.sin(t * 2.3 + i * 7.7) - .95) * 14 + flicker * .6 * Math.random());
          tmpC.copy(col.dead).lerp(col.crack, crack);
          dp[i * 3] = n.p.x; dp[i * 3 + 1] = n.p.y; dp[i * 3 + 2] = n.p.z; dc[i * 3] = tmpC.r; dc[i * 3 + 1] = tmpC.g; dc[i * 3 + 2] = tmpC.b; lp[i * 3 + 1] = HIDE; gp[i * 3 + 1] = HIDE;
        }
      }
      litPts.geometry.attributes.position.needsUpdate = litPts.geometry.attributes.color.needsUpdate = true;
      deadPts.geometry.attributes.position.needsUpdate = deadPts.geometry.attributes.color.needsUpdate = true;
      glowPts.geometry.attributes.position.needsUpdate = glowPts.geometry.attributes.color.needsUpdate = true;
      // edges: lit between two awake nodes, brighter as both are active; a broken dark strand otherwise
      const la = litLines.geometry.attributes.position.array as Float32Array, lca = litLines.geometry.attributes.color.array as Float32Array;
      const da = deadLines.geometry.attributes.position.array as Float32Array, dca = deadLines.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < E; i++) {
        const e = edges[i], A = nodes[e.a], B = nodes[e.b], j = i * 6;
        if (A.lit && B.lit) {
          const sA = .06 + A.a * .9 + A.flare * .3 + bl * .3, sB = .06 + B.a * .9 + B.flare * .3 + bl * .3;
          la[j] = A.p.x; la[j + 1] = A.p.y; la[j + 2] = A.p.z; la[j + 3] = B.p.x; la[j + 4] = B.p.y; la[j + 5] = B.p.z;
          lca[j] = col.lit.r * sA * e.w; lca[j + 1] = col.lit.g * sA * e.w; lca[j + 2] = col.lit.b * sA * e.w; lca[j + 3] = col.lit.r * sB * e.w; lca[j + 4] = col.lit.g * sB * e.w; lca[j + 5] = col.lit.b * sB * e.w;
          da[j + 1] = da[j + 4] = HIDE;
        } else {
          const q = .45 + .25 * ((i * 37) % 7) / 7, f = A.lit ? A : B, g = A.lit ? B : A;   // stops short of the dark end
          da[j] = f.p.x; da[j + 1] = f.p.y; da[j + 2] = f.p.z; da[j + 3] = f.p.x + (g.p.x - f.p.x) * q; da[j + 4] = f.p.y + (g.p.y - f.p.y) * q; da[j + 5] = f.p.z + (g.p.z - f.p.z) * q;
          dca[j] = col.dead.r; dca[j + 1] = col.dead.g; dca[j + 2] = col.dead.b; dca[j + 3] = dca[j + 4] = dca[j + 5] = 0;
          la[j + 1] = la[j + 4] = HIDE;
        }
      }
      litLines.geometry.attributes.position.needsUpdate = litLines.geometry.attributes.color.needsUpdate = true;
      deadLines.geometry.attributes.position.needsUpdate = deadLines.geometry.attributes.color.needsUpdate = true;
      // pulses
      for (let i = 0; i < PULSES; i++) {
        const p = pulses[i]; if (!p.live) { pulsePos[i * 3 + 1] = HIDE; continue; }
        p.t += dt; const q = p.t / p.dur;
        if (q < 0 || q >= 1) { if (q >= 1) p.live = false; pulsePos[i * 3 + 1] = HIDE; continue; }
        const e = edges[p.e], A = nodes[e.a].p, B = nodes[e.b].p, s = q * q * (3 - 2 * q);
        pulsePos[i * 3] = A.x + (B.x - A.x) * s; pulsePos[i * 3 + 1] = A.y + (B.y - A.y) * s; pulsePos[i * 3 + 2] = A.z + (B.z - A.z) * s;
        tmpC.copy(p.hot ? col.hot : col.lit).multiplyScalar(.7 + 1.3 * Math.min(1, p.s + .2) * Math.sin(q * Math.PI)); pulseCol[i * 3] = tmpC.r; pulseCol[i * 3 + 1] = tmpC.g; pulseCol[i * 3 + 2] = tmpC.b;
      }
      pg.attributes.position.needsUpdate = pg.attributes.color.needsUpdate = true;
    },
    /** fade the whole net in or out (0..1) */
    fade(k: number) { group.traverse(x => { const m = (x as T.Points).material as T.Material | undefined; if (!m) return; m.userData.base ??= m.opacity; m.opacity = m.userData.base * k; m.visible = k > .01; }); },
    dispose() { group.traverse(x => { const m = x as T.Mesh; m.geometry?.dispose?.(); (m.material as T.Material | undefined)?.dispose?.(); }); },
  };
  return api;
}
