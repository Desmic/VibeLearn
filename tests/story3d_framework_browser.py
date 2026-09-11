"""Executable proof that the Three.js seam accepts an unrelated world adapter.

This is framework evidence, not a story/game enjoyment score. The synthetic world
intentionally shares no Relay Rescue actors, objects, missions, or learning rules.
"""
import json
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

from tests.browser_check import start_server, stop_server

ROOT = Path(__file__).resolve().parents[1]


def main():
    out = ROOT / 'artifacts'
    out.mkdir(exist_ok=True)
    errors = []
    checks = []
    with tempfile.TemporaryDirectory() as tmp, sync_playwright() as p:
        proc, url = start_server(Path(tmp) / 'story3d-framework.db')
        browser = p.chromium.launch()
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        context.add_init_script("localStorage.setItem('vibelearn.relay-rescue.intro.v3','seen');")
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        try:
            page.goto(url)
            result = page.evaluate("""async () => {
              const hostApi = await import('/story3d-world-host.js');
              const runtimeApi = await import('/story3d-runtime.js');
              const mountPoint = document.createElement('div');
              mountPoint.id = 'synthetic-world-host';
              document.body.append(mountPoint);

              // Deliberately unrelated fantasy: a tiny star orchard. It imports
              // only the generic runtime and adapter contract, never Rescue code.
              const synthetic = {
                storyWorldManifest: Object.freeze({
                  id: 'framework-proof.star-orchard',
                  version: '1',
                  adapterVersion: hostApi.STORY3D_ADAPTER_VERSION,
                  modes: Object.freeze(['story']),
                  capabilities: Object.freeze(['beats','pause','replay','stats'])
                }),
                createStoryWorld(host, {reducedMotion=false}={}) {
                  const runtime = runtimeApi.createThreeStoryRuntime(host, {
                    reducedMotion, pixelRatioCap: 1, clearColor: 0x101022
                  });
                  if (!runtime.available) {
                    return {available:false,error:runtime.error,setBeat(){},setPaused(){},replay(){},stats(){return runtime.stats();},dispose(){runtime.dispose();}};
                  }
                  const {THREE, scene} = runtimeApi;
                  const geometry = runtime.trackGeometry(new THREE.SphereGeometry(.65, 12, 8));
                  const material = runtime.emissive(0xffd56a, 1.2);
                  const star = runtime.mesh(scene, geometry, material, [0,0,0], [1,1,1]);
                  scene.add(new THREE.HemisphereLight(0xbddfff, 0x181020, 1.5));
                  const rig = runtime.createCameraRig({
                    landscape:{p:[0,1.2,5],t:[0,0,0]},
                    portrait:{p:[0,1.8,7],t:[0,0,0]}
                  });
                  rig.snap(.6);
                  let beat = 0;
                  runtime.setDraw(({dt,aspect,animate}) => {
                    rig.update({dt,aspect,snap:reducedMotion});
                    if (animate) star.rotation.y += dt * .6;
                  });
                  return {
                    available:true,
                    setBeat(index){beat=Number(index)||0;star.position.x=beat*.2;runtime.requestDraw();},
                    setPaused(value){runtime.setPaused(value);},
                    replay(){star.rotation.set(0,0,0);runtime.replay();},
                    stats(){return {...runtime.stats(),beat,synthetic:true};},
                    dispose(){runtime.dispose();}
                  };
                }
              };

              const instance = hostApi.mountStoryWorldModule(synthetic, mountPoint, {mode:'story',reducedMotion:false});
              instance.setBeat(2);
              instance.setPaused(true);
              const mounted = {
                available: instance.available,
                manifestId: instance.manifest?.id,
                runtimeVersion: instance.stats().runtimeVersion,
                beat: instance.stats().beat,
                canvasRuntime: mountPoint.querySelector('canvas')?.dataset.story3dRuntime || null,
                canvasCount: mountPoint.querySelectorAll('canvas').length,
              };
              instance.dispose();
              const canvasCountAfterDispose = mountPoint.querySelectorAll('canvas').length;

              let incompleteDisposed = false;
              const incomplete = {
                storyWorldManifest:{id:'framework-proof.incomplete',version:'1',adapterVersion:hostApi.STORY3D_ADAPTER_VERSION,modes:['story']},
                createStoryWorld(){return {available:true,setPaused(){},replay(){},stats(){return{};},dispose(){incompleteDisposed=true;}};}
              };
              const missingMethod = hostApi.mountStoryWorldModule(incomplete, mountPoint, {mode:'story'});
              const unsupportedMode = hostApi.mountStoryWorldModule(synthetic, mountPoint, {mode:'mission'});
              const wrongVersion = hostApi.mountStoryWorldModule({
                storyWorldManifest:{id:'framework-proof.future',version:'1',adapterVersion:'999',modes:['story']},
                createStoryWorld(){throw new Error('must not be called');}
              }, mountPoint, {mode:'story'});
              mountPoint.remove();
              return {
                mounted, canvasCountAfterDispose, incompleteDisposed,
                missingMethod:{available:missingMethod.available,error:missingMethod.error},
                unsupportedMode:{available:unsupportedMode.available,error:unsupportedMode.error},
                wrongVersion:{available:wrongVersion.available,error:wrongVersion.error},
              };
            }""")
            assert result['mounted']['available'] is True, result
            assert result['mounted']['manifestId'] == 'framework-proof.star-orchard', result
            assert result['mounted']['runtimeVersion'] == '1', result
            assert result['mounted']['canvasRuntime'] == '1', result
            assert result['mounted']['canvasCount'] == 1, result
            assert result['mounted']['beat'] == 2, result
            assert result['canvasCountAfterDispose'] == 0, result
            assert result['incompleteDisposed'] is True, result
            assert result['missingMethod']['available'] is False and 'setBeat' in result['missingMethod']['error'], result
            assert result['unsupportedMode']['available'] is False and 'does not support mode mission' in result['unsupportedMode']['error'], result
            assert result['wrongVersion']['available'] is False and 'Unsupported story-world adapter version' in result['wrongVersion']['error'], result
            checks.extend([
                'An unrelated Star Orchard adapter mounts through the same versioned host and generic Three.js runtime as Echo Forge.',
                'The adapter can select a beat, use shared camera/runtime policy, pause, report runtime version, and dispose its canvas without Relay Rescue code.',
                'The host fails closed for an unsupported mode, incompatible adapter version, and incomplete instance contract; incomplete instances are disposed.',
            ])
            if errors:
                raise AssertionError(errors)
            print(json.dumps({'result':'passed','checks':checks,'synthetic_world':'framework-proof.star-orchard','page_errors':errors}, indent=2))
        finally:
            context.close()
            browser.close()
            stop_server(proc)


if __name__ == '__main__':
    main()
