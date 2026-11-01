import * as T from 'three';

// Faces that live: blinks, eyes that glance and lead the head, a mouth that moves with the voice
// actually playing, and a handful of feelings (happy, worried, shocked…) blended on top. All of it
// is morph targets built at load time from the body kit's face parts (eyes, glints, mouth, brows),
// so a face costs nothing per frame but a few numbers, and any kit with those parts gets it.
// Game-agnostic: the game says which voice a person speaks with and what they feel; the rig does
// the rest (kit/voice.ts gives the loudness of a playing line).

/** what a speaking voice is doing now: how loud (0 … 1) and the feeling of its line. The game sets
 *  it once (from kit/voice.ts and its dialogue); anyone given a speaker name moves with it. */
export type FaceCue = (speaker: string) => { talk: number; feel: string | null };
let cueOf: FaceCue | null = null;
export function setFaceCues(f: FaceCue | null) { cueOf = f; }
export function faceCue(speaker: string | null) { return speaker && cueOf ? cueOf(speaker) : null; }

/** the kit parts the face is built from (names in the body kit) */
export interface FaceParts { eyes: string; glints?: string; mouth: string; brows?: string }
export const KIT_FACE: FaceParts = { eyes: 'face.eyes', glints: 'face.glints', mouth: 'face.smile', brows: 'face.brows' };

const TARGETS = ['blink', 'open', 'smile', 'browUp', 'browSad', 'eyeX', 'eyeY'] as const;
type Target = typeof TARGETS[number];
/** feelings as morph weights (smile < 0 turns the mouth down; blink < 0 widens the eyes) */
export const FEELINGS: Record<string, Partial<Record<Target, number>>> = {
  neutral: {},
  warm: { smile: .55, browUp: .15 },
  happy: { smile: 1, browUp: .45, blink: .12 },
  proud: { smile: .8, browUp: .25, blink: .2 },
  worried: { smile: -.7, browSad: 1, browUp: .2 },
  sad: { smile: -.9, browSad: .9, blink: .35 },
  shocked: { open: .55, browUp: 1, blink: -.35, smile: -.2 },
  afraid: { open: .3, browSad: 1, browUp: .6, blink: -.3, smile: -.6 },
  determined: { smile: -.15, browSad: -.6, blink: .18 },
  curious: { browUp: .7, smile: .3 },
};

/** a feeling from an actor's direction or a speaker's style (first match wins) */
export function feelingFor(direction: string): string | null {
  const d = direction.toLowerCase();
  const rules: [RegExp, string][] = [
    [/scream|terrif|afraid|scared|panic|desperate/, 'afraid'],
    [/shock|gasp|surpris|startl|shout(ing)? up/, 'shocked'],
    [/urgent|alarm|worr|anxious|flustered|stuck|muffled/, 'worried'],
    [/sad|grie|sorry|quiet(ly)? hurt|lonely/, 'sad'],
    [/proud|triumph|bravo/, 'proud'],
    [/laugh|delight|joy|bright|cheer|happy|grin/, 'happy'],
    [/curious|wonder|teas/, 'curious'],
    [/warm|kind|friendly|gentle|calling|wav/, 'warm'],
    [/determin|resolute|firm/, 'determined'],
  ];
  for (const [re, f] of rules) if (re.test(d)) return f;
  return null;
}

/** Build the face's morph targets into an assembled body geometry. `ranges`: each part's
 *  [first vertex, count] in the geometry (kit/body-kit.ts assembleLook records them). */
export function addFaceMorphs(g: T.BufferGeometry, ranges: Record<string, [number, number]>, parts: FaceParts = KIT_FACE): boolean {
  const eyes = ranges[parts.eyes], mouth = ranges[parts.mouth]; if (!eyes || !mouth) return false;
  const P = g.getAttribute('position') as T.BufferAttribute, n = P.count;
  const D = Object.fromEntries(TARGETS.map(t => [t, new Float32Array(n * 3)])) as Record<Target, Float32Array>;
  const v = new T.Vector3();
  const each = (r: [number, number] | undefined, f: (i: number, p: T.Vector3) => void) => { if (r) for (let i = r[0]; i < r[0] + r[1]; i++) f(i, v.fromBufferAttribute(P, i)); };
  // per side (x < 0, x > 0): centre and half size of a part
  const sides = (r: [number, number]) => {
    const s = [0, 1].map(() => ({ c: new T.Vector3(), lo: new T.Vector3(1e9, 1e9, 1e9), hi: new T.Vector3(-1e9, -1e9, -1e9), k: 0 }));
    each(r, (_, p) => { const q = s[p.x < 0 ? 0 : 1]; q.c.add(p); q.lo.min(p); q.hi.max(p); q.k++; });
    for (const q of s) q.c.divideScalar(Math.max(1, q.k));
    return s;
  };
  const E = sides(eyes), ew = (E[1].hi.x - E[1].lo.x) / 2 || .02, eh = (E[1].hi.y - E[1].lo.y) / 2 || .03;
  const set = (t: Target, i: number, x: number, y: number, z = 0) => { D[t][i * 3] = x; D[t][i * 3 + 1] = y; D[t][i * 3 + 2] = z; };
  // eyes: close to a line (a painted shut eye), glance sideways and up
  each(eyes, (i, p) => { const c = E[p.x < 0 ? 0 : 1].c; set('blink', i, 0, (c.y - p.y) * .9 - eh * .12); set('eyeX', i, ew * .42, 0); set('eyeY', i, 0, eh * .28); });
  if (parts.glints && ranges[parts.glints]) {
    const G = sides(ranges[parts.glints]);
    // glints vanish into the shut eye; they follow the eye's glance (a little less: they sit in front)
    each(ranges[parts.glints], (i, p) => { const c = G[p.x < 0 ? 0 : 1].c, ec = E[p.x < 0 ? 0 : 1].c; set('blink', i, c.x - p.x, ec.y - p.y - eh * .12, c.z - p.z + .004); set('eyeX', i, ew * .36, 0); set('eyeY', i, 0, eh * .24); });
  }
  // mouth: find its middle line (bins across), then open (the lower lip drops), smile (corners up)
  const M = sides(mouth), x0 = M[0].lo.x, x1 = M[1].hi.x, mw = (x1 - x0) / 2, mx = (x0 + x1) / 2, BINS = 9;
  const sum = new Float64Array(BINS), cnt = new Float64Array(BINS), bin = (x: number) => Math.min(BINS - 1, Math.max(0, Math.floor((x - x0) / (x1 - x0) * BINS)));
  each(mouth, (_, p) => { const b = bin(p.x); sum[b] += p.y; cnt[b]++; });
  const mid = (x: number) => { const b = bin(x); return cnt[b] ? sum[b] / cnt[b] : 0; };
  const corner = (mid(x0 + (x1 - x0) * .02) + mid(x1 - (x1 - x0) * .02)) / 2;
  each(mouth, (i, p) => {
    const u = (p.x - mx) / mw, bell = Math.max(0, 1 - u * u), round = Math.sqrt(bell), below = p.y < mid(p.x), lift = (corner - mid(p.x)) * .8;
    // open: the upper lip straightens toward the corners, the lower one drops in a round curve (a "D", not a "V")
    set('open', i, 0, below ? lift * .35 - mw * .55 * round : lift, -mw * .1 * round);
    set('smile', i, u * mw * .06, mw * .36 * u * u - mw * .06);
  });
  // brows: lift; and the worried tilt (inner ends up, outer down)
  if (parts.brows && ranges[parts.brows]) {
    const B = sides(ranges[parts.brows]);
    each(ranges[parts.brows], (i, p) => {
      const q = B[p.x < 0 ? 0 : 1], w = Math.max(1e-4, q.hi.x - q.lo.x), inner = 1 - (Math.abs(p.x) - Math.min(Math.abs(q.lo.x), Math.abs(q.hi.x))) / w;
      set('browUp', i, 0, eh * .55); set('browSad', i, 0, eh * .5 * (inner * 2 - 1));
    });
  }
  g.morphAttributes.position = TARGETS.map(t => { const a = new T.Float32BufferAttribute(D[t], 3); a.name = t; return a; });
  g.morphTargetsRelative = true;
  return true;
}

export interface Face {
  /** loudness of the voice this face speaks with right now (0 … 1), or a procedural flap */
  talk(level: number): void;
  /** a feeling to show (FEELINGS key), blended in; null: back to the person's resting face */
  feel(name: string | null): void;
  /** the resting feeling (a person's usual face) */
  rest(name: string): void;
  /** where the eyes glance, head-relative: x right +, y up + (−1 … 1); null: their own idle glances */
  glance(x: number, y: number): void;
  blink(): void;
  /** hold exact morph weights (a film's close-up, a test); null: live again */
  pose(w: Partial<Record<Target, number>> | null): void;
  tick(dt: number): void;
}

/** drive a mesh's face morphs (built by addFaceMorphs) */
export function createFace(mesh: T.Mesh, seed = Math.random()): Face | null {
  const dict = mesh.morphTargetDictionary, inf = mesh.morphTargetInfluences; if (!dict || !inf) return null;
  const at = Object.fromEntries(TARGETS.map(t => [t, dict[t] ?? (TARGETS as readonly string[]).indexOf(t)])) as Record<Target, number>;
  let s = Math.floor(seed * 1e6) + 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const cur = Object.fromEntries(TARGETS.map(t => [t, 0])) as Record<Target, number>;
  let feeling: string | null = null, resting = 'neutral', level = 0, mouth = 0, flap = 0;
  let blinkT = 1 + rnd() * 3, blinkK = -1, again = false, gap = 0;
  let gx = 0, gy = 0, wantX = 0, wantY = 0, told = false, saccT = .5 + rnd() * 2, lastGx = 0;
  let held: Partial<Record<Target, number>> | null = null;
  return {
    talk(l) { level = Math.max(0, Math.min(1, l)); },
    feel(n) { feeling = n && FEELINGS[n] ? n : null; },
    rest(n) { if (FEELINGS[n]) resting = n; },
    glance(x, y) { told = true; wantX = T.MathUtils.clamp(x, -1, 1); wantY = T.MathUtils.clamp(y, -1, 1); },
    blink() { if (blinkK < 0) blinkK = 0; },
    pose(w) { held = w; },
    tick(dt) {
      if (held) { for (const t of TARGETS) inf[at[t]] = held[t] ?? 0; return; }
      dt = Math.min(dt, .1);
      // blinks: every 2–6 s, sometimes twice; a big glance brings one too (people blink as they look)
      blinkT -= dt; if (blinkT <= 0 && blinkK < 0) { blinkK = 0; again = rnd() < .18; blinkT = 2 + rnd() * 4; }
      if (Math.abs(wantX - lastGx) > .55 && blinkK < 0) blinkK = 0; lastGx = wantX;
      if (gap > 0) { gap -= dt; if (gap <= 0 && blinkK < 0) blinkK = 0; }
      let lid = 0; if (blinkK >= 0) { blinkK += dt / .16; lid = Math.sin(Math.min(1, blinkK) * Math.PI); if (blinkK >= 1) { blinkK = -1; if (again) { again = false; gap = .14; } } }
      // idle glances when nobody tells the eyes where to go
      if (!told) { saccT -= dt; if (saccT <= 0) { saccT = .7 + rnd() * 2.4; wantX = rnd() < .45 ? 0 : (rnd() * 2 - 1) * .55; wantY = (rnd() * 2 - 1) * .2; } }
      told = false;
      const qk = Math.min(1, dt * 18); gx += (wantX - gx) * qk; gy += (wantY - gy) * qk;   // eyes are quick
      // the mouth: follows the voice's loudness with a quick open and a softer close, plus a small flutter
      flap += dt * (9 + 5 * level);
      const target = level > .02 ? Math.min(1, level * 1.6) * (.75 + .25 * Math.sin(flap)) : 0;
      mouth += (target - mouth) * Math.min(1, dt * (target > mouth ? 28 : 14));
      const F = FEELINGS[feeling ?? resting] ?? {}, fk = Math.min(1, dt * 5);
      for (const t of TARGETS) {
        const want = (F[t] ?? 0);
        cur[t] += (want - cur[t]) * fk;
      }
      inf[at.blink] = Math.max(-.4, Math.min(1, cur.blink + lid * (1 - Math.max(0, cur.blink))));
      inf[at.open] = Math.min(1, cur.open + mouth * (1 - cur.open * .5));
      inf[at.smile] = cur.smile * (1 - mouth * .5);
      inf[at.browUp] = cur.browUp + mouth * .12; inf[at.browSad] = cur.browSad;
      inf[at.eyeX] = gx; inf[at.eyeY] = gy;
    },
  };
}
