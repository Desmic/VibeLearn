import * as T from 'three';
import type { Kit } from './kit';
import { dressIsland, type DressOptions, type Dressed, type IslandSpec } from './dress';
import { budget } from './budget';

// A world: the dressed islands of a game, in named groups ("route", "next"…).
// Groups are built lazily, the first time they are shown, one island per
// short pause, so startup and the first frames stay light on phones. It hides
// small scatter on islands the player is far from. Games add islands by spec;
// nothing here knows which game it is.

type Built = { spec: IslandSpec; group: string; d: Dressed; shed: number };
export function createWorld(scene: T.Scene, kit: Promise<Kit>, base: DressOptions & { adopt?: (root: T.Object3D, blockers: T.Object3D[]) => void } = {}) {
  const islands: Built[] = [], pending: { spec: IslandSpec; group: string; opt: DressOptions }[] = [];
  const shown = new Map<string, boolean>();
  let building = false;
  const build = async (spec: IslandSpec, group: string, opt: DressOptions) => {
    const k = await kit;
    // small islands do not need a big painted ground texture
    const groundSize = opt.groundSize ?? base.groundSize ?? Math.min(1024, Math.max(256, 2 ** Math.round(Math.log2(spec.radius * 64))));
    const d = dressIsland(spec, k, { ...base, ...opt, groundSize });
    d.root.visible = shown.get(group) ?? true; d.detail.visible = false;
    scene.add(d.root); base.adopt?.(d.root, []);
    islands.push({ spec, group, d, shed: -1 });
    console.info(`[kit] ${spec.id} dressed`, JSON.stringify(d.stats));
    return d;
  };
  const pump = async () => {
    if (building) return; building = true;
    try {
      for (let i = 0; i < pending.length;) {
        const p = pending[i];
        if (!shown.get(p.group)) { i++; continue; }
        pending.splice(i, 1);
        try { await build(p.spec, p.group, p.opt); } catch (e) { console.warn('[kit] island not dressed', p.spec.id, e); }
        await new Promise(r => setTimeout(r, 120));   // let a frame or two through
      }
    } finally { building = false; }
  };
  return {
    /** add an island; it is built when its group is first shown */
    add(spec: IslandSpec, group = 'main', opt: DressOptions = {}) { pending.push({ spec, group, opt }); if (shown.get(group) ?? true) void pump(); },
    show(group: string, v: boolean) {
      shown.set(group, v); for (const i of islands) if (i.group === group) i.d.root.visible = v;
      if (v) void pump();
    },
    tick(player: T.Vector3) {
      for (const i of islands) {
        if (!i.d.root.visible) continue;
        const near = Math.hypot(player.x - i.spec.center[0], player.z - i.spec.center[1]) < budget.radius + i.spec.radius;
        i.d.detail.visible = near && budget.level < 2;
        if (i.shed !== budget.level) { i.shed = budget.level; const keep = budget.level ? .5 : 1.01; i.d.detail.children.forEach(c => { c.visible = (c.userData.rank ?? 0) < keep; }); }
      }
    },
    get islands() { return islands; },
  };
}
