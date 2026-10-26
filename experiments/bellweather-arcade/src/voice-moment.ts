import * as T from 'three';
import { sfx } from './sfx';
import { zipNet } from './engine-holo';

// When a piece of Zip's voice comes back (the end of a stop), his speech engine shows for a few
// seconds above him, the same neural net as the skiff's hologram on its pane of dark glass, and more
// of its dark web lights, node by node, with a rising bell scale. The camera drops low and looks up
// at it. The story said "coil by coil"; five blind runs never noticed (Desmic, 25 Oct: show it,
// "a sense of beauty and awe").
export function buildVoiceMoment(scene: T.Scene, camera: T.Camera, zip: () => T.Vector3) {
  let net: ReturnType<typeof zipNet> | null = null, t = 0, then: (() => void) | null = null, woke = false, to = 0, LIFE = 5.6, S = .78, directed = true, lift = 2.2;
  const root = new T.Group(); root.visible = false; scene.add(root);
  const fieldTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d')!; const gr = x.createRadialGradient(128, 128, 10, 128, 128, 128);
    gr.addColorStop(0, 'rgba(3,14,26,.86)'); gr.addColorStop(.72, 'rgba(5,24,40,.7)'); gr.addColorStop(.93, 'rgba(111,224,201,.35)'); gr.addColorStop(1, 'rgba(111,224,201,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 256, 256); const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace; return tx; })();
  const fieldMat = new T.MeshBasicMaterial({ map: fieldTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 });
  const field = new T.Mesh(new T.CircleGeometry(1, 48), fieldMat); field.scale.set(1.86, 1.42, 1); field.position.set(0, .6, -.4); field.renderOrder = 8;
  const dir = new T.Vector3(), shotPos = new T.Vector3(), shotLook = new T.Vector3();
  return {
    /** a directed moment is playing (the story holds the player still) */
    get active() { return !!net && directed; },
    /** the camera, low in front of Zip, looking up at the net */
    get shot() { return net && directed ? { pos: shotPos, look: shotLook } : null; },
    /** show the net above Zip, awake at `from`, and wake it to `to` */
    /** `small`: a glimpse over his head while he keeps walking (a find), no camera and no hold */
    play(from: number, toAwake: number, done?: () => void, small = false) {
      if (net) { net.group.remove(field); root.remove(net.group); net.dispose(); }
      directed = !small; LIFE = small ? 3.2 : 5.6; S = small ? .5 : .78; lift = small ? 2.6 : 2.2;
      net = zipNet(); net.setAwake(from); net.group.add(field); root.add(net.group); root.scale.setScalar(S); root.visible = true; net.fade(0); fieldMat.opacity = 0;
      const z = zip(); dir.copy(camera.position).sub(z).setY(0); if (dir.lengthSq() < .01) dir.set(0, 0, 1); dir.normalize();
      root.position.set(z.x, z.y + lift, z.z); root.lookAt(root.position.x + dir.x, root.position.y, root.position.z + dir.z);
      // close enough that the lit layers fill the width and the dark web runs off the edges (it is bigger
      // than the screen); low, so Zip stands at the bottom of the frame looking up at it
      const aspect = Math.max(.45, innerWidth / innerHeight), d = Math.min(7, Math.max(4.2, (2.3 * S * .5 + .2) / (Math.tan(26 * Math.PI / 180) * aspect)));
      shotPos.copy(z).addScaledVector(dir, d).setY(z.y + .9); shotLook.set(z.x, z.y + 2.4, z.z);
      t = 0; woke = false; to = toAwake; then = done ?? null; sfx.hum(1.4);
    },
    tick(dt: number) {
      if (!net) return;
      t += dt;
      const k = Math.max(0, Math.min(1, t / .6, (LIFE - t) / .8)); net.fade(k); fieldMat.opacity = k;
      if (!woke && t > (directed ? .9 : .4)) { woke = true; net.bloom(); net.wakeTo(to, directed ? 2.6 : 1); if (directed) sfx.chime(); }
      if (!directed) { const z = zip(); root.position.set(z.x, z.y + lift, z.z); dir.copy(camera.position).sub(z).setY(0).normalize(); root.lookAt(root.position.x + dir.x, root.position.y, root.position.z + dir.z); }
      net.tick(dt); net.group.rotation.y = Math.sin(t * .35) * .06;
      if (t >= LIFE) { net.group.remove(field); root.remove(net.group); net.dispose(); net = null; root.visible = false; const f = then; then = null; f?.(); }
    },
  };
}
