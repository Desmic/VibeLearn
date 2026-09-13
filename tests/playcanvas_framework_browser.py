"""Executable proof of the Phase 1 engine-neutral WorldSpec -> PlayCanvas backend seam.

This is architecture/runtime evidence, not a story, gameplay, or learning-quality
score. It proves both an unrelated synthetic world and the current Echo Forge package
mount through the real PlayCanvas backend before UI integration is considered.
"""
import json
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

from tests.browser_check import start_server, stop_server

ROOT = Path(__file__).resolve().parents[1]


def main():
    out = ROOT / "artifacts"
    out.mkdir(exist_ok=True)
    errors = []
    with tempfile.TemporaryDirectory() as tmp, sync_playwright() as p:
        proc, url = start_server(Path(tmp) / "playcanvas-framework.db")
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 390, "height": 844})
        context.add_init_script("localStorage.setItem('vibelearn.relay-rescue.intro.v3','seen');")
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        try:
            page.goto(url)
            result = page.evaluate("""async () => {
              const {createPlayCanvasWorld} = await import('/playcanvas-backend.js');
              const spec = {
                schemaVersion:'1',
                id:'framework-proof.star-orchard',
                version:'1',
                environment:{
                  clearColor:'#101022',ambient:'#40405a',exposure:1.12,toneMapping:'aces',
                  fog:{type:'linear',color:'#202638',start:2,end:18}
                },
                materials:{
                  star:{diffuse:'#ffd56a',emissive:'#ffd56a',emissiveIntensity:1.3},
                  trunk:{diffuse:'#714a35'},
                  leaf:{diffuse:'#477b61'}
                },
                lights:[{id:'sun',type:'directional',color:'#fff1c2',intensity:1.5,rotation:[35,-20,0]}],
                entities:[
                  {id:'star',primitive:'sphere',material:'star',position:[0,.8,0],scale:[1.2,1.2,1.2],motion:{type:'spin',axis:[0,1,0],speed:28}},
                  {id:'trunk-a',primitive:'cylinder',material:'trunk',position:[-1,-.2,-1],scale:[.25,1.8,.25]},
                  {id:'leaf-a',primitive:'sphere',material:'leaf',position:[-1,1,-1],scale:[1.1,.8,1.1]},
                  {id:'trunk-b',primitive:'cylinder',material:'trunk',position:[1.2,-.2,-1.6],scale:[.25,1.7,.25]},
                  {id:'leaf-b',primitive:'sphere',material:'leaf',position:[1.2,.9,-1.6],scale:[1,.75,1]}
                ],
                cameras:{
                  near:{position:[0,2.3,6],lookAt:[0,.5,-.5],fov:46},
                  far:{position:[0,3.4,8],lookAt:[0,.4,-.8],fov:48,toneMapping:'neutral'}
                },
                states:{
                  seed:{camera:'near'},
                  bloom:{camera:'far',transforms:{star:{position:[0,1.5,0],scale:[1.5,1.5,1.5]}}}
                }
              };
              const host=document.createElement('div');
              host.id='synthetic-playcanvas-host';
              Object.assign(host.style,{position:'fixed',left:'0',top:'0',width:'390px',height:'420px',zIndex:'9999'});
              document.body.append(host);
              const world=createPlayCanvasWorld(host,spec,{pixelRatioCap:1,reducedMotion:false});
              world.setState('bloom');
              await new Promise(resolve=>setTimeout(resolve,180));
              const stats=world.stats();
              const canvas=host.querySelector('canvas');
              const rect=canvas?.getBoundingClientRect();
              const synthetic={...stats,canvasEngine:canvas?.dataset.engine||null,canvasVersion:canvas?.dataset.playcanvasEngine||null,canvasRect:rect?{width:rect.width,height:rect.height}:null};
              world.dispose();host.remove();

              const badHost=document.createElement('div');
              Object.assign(badHost.style,{position:'fixed',width:'120px',height:'120px'});
              document.body.append(badHost);
              const bad=createPlayCanvasWorld(badHost,{...spec,id:'framework-proof.invalid-fog',environment:{...spec.environment,fog:{type:'mystery'}}});
              const invalidFogRejected=bad.available===false&&String(bad.error||'').includes('unsupported type');
              bad.dispose?.();
              const external=createPlayCanvasWorld(badHost,{
                ...spec,id:'framework-proof.external-asset',
                assets:{robot:{type:'container',src:'https://example.com/robot.glb'}},
                entities:[{id:'robot',asset:'robot'}]
              });
              const externalAssetRejected=external.available===false&&String(external.error||'').includes('safe same-origin');
              external.dispose?.();
              const badAlias=createPlayCanvasWorld(badHost,{
                ...spec,id:'framework-proof.bad-animation-alias',
                assets:{robot:{type:'container',src:'/assets/robot.glb',animations:{idle:'Idle'}}},
                entities:[{id:'robot',asset:'robot',animation:'missing'}]
              });
              const invalidAnimationRejected=badAlias.available===false&&String(badAlias.error||'').includes('unknown alias');
              badAlias.dispose?.();badHost.remove();

              const measureHost=document.createElement('div');
              Object.assign(measureHost.style,{position:'fixed',left:'0',top:'0',width:'390px',height:'420px',zIndex:'9998'});
              document.body.append(measureHost);
              const blacksmithWorld=createPlayCanvasWorld(measureHost,{
                ...spec,id:'framework-proof.blacksmith-bounds',version:'1',
                assets:{blacksmith:{type:'container',src:'/assets/quaternius-blacksmith.glb'}},
                entities:[{id:'blacksmith',asset:'blacksmith'}],
                states:{seed:{camera:'near'}}
              },{pixelRatioCap:1,reducedMotion:true});
              const measureDeadline=performance.now()+5000;
              while(blacksmithWorld.stats?.().assetsPending>0&&performance.now()<measureDeadline){
                await new Promise(resolve=>setTimeout(resolve,50));
              }
              await new Promise(resolve=>setTimeout(resolve,120));
              const blacksmithStats=blacksmithWorld.stats?.()||null;
              blacksmithWorld.dispose?.();measureHost.remove();

              const echoModule=await import('/rescue-playcanvas-world.js');
              const echoHost=document.createElement('div');
              echoHost.id='echo-forge-playcanvas-host';
              Object.assign(echoHost.style,{position:'fixed',left:'0',top:'0',width:'390px',height:'600px',zIndex:'9999'});
              document.body.append(echoHost);
              const echo=echoModule.createGameWorld(echoHost,{reducedMotion:false,mode:'story'});
              const deadline=performance.now()+5000;
              while(echo.stats?.().assetsPending>0&&performance.now()<deadline){
                await new Promise(resolve=>setTimeout(resolve,50));
              }
              await new Promise(resolve=>setTimeout(resolve,120));
              const story0Stats=echo.stats?.()||null;
              const echoCanvas=echoHost.querySelector('canvas');
              const echoRect=echoCanvas?.getBoundingClientRect();
              const echoResult={
                available:echo.available,error:echo.error||null,stats:story0Stats,story5Stats:null,
                canvas:echoCanvas?{width:echoCanvas.width,height:echoCanvas.height,clientWidth:echoCanvas.clientWidth,clientHeight:echoCanvas.clientHeight,rect:echoRect?{width:echoRect.width,height:echoRect.height}:null,engine:echoCanvas.dataset.engine||null,vibelearnEngine:echoCanvas.dataset.vibelearnEngine||null}:null
              };
              window.__vibelearnEchoAssetProof={echo,echoHost,echoResult};
              return {synthetic,blacksmith:blacksmithStats,echo:echoResult,invalidFogRejected,externalAssetRejected,invalidAnimationRejected};
            }""")

            # Preserve character/environment composition evidence before any assertion can abort
            # the proof. These are diagnostic screenshots, not critic scores.
            page.locator("#echo-forge-playcanvas-host").screenshot(
                path=str(out / "playcanvas-pip-story0-390.png")
            )
            page.evaluate("""async () => {
              const proof=window.__vibelearnEchoAssetProof;
              proof.echo.setBeat(5);
              await new Promise(resolve=>setTimeout(resolve,160));
              proof.echoResult.story5Stats=proof.echo.stats();
            }""")
            page.locator("#echo-forge-playcanvas-host").screenshot(
                path=str(out / "playcanvas-pip-story5-wave-390.png")
            )
            result["echo"]["story5Stats"] = page.evaluate(
                "() => window.__vibelearnEchoAssetProof.echoResult.story5Stats"
            )

            synthetic = result["synthetic"]
            assert synthetic["available"] is True, result
            assert synthetic["engine"] == "playcanvas", result
            assert synthetic["engineVersion"] == "2.22.1", result
            assert synthetic["backendVersion"] == "2", result
            assert synthetic["worldId"] == "framework-proof.star-orchard", result
            assert synthetic["state"] == "bloom", result
            assert synthetic["entityCount"] == 5, result
            assert synthetic["canvasCount"] == 1, result
            assert synthetic["cameraVariant"] == "default", result
            assert synthetic["toneMapping"] == "neutral", result
            assert abs(synthetic["exposure"] - 1.12) < 0.001, result
            assert synthetic["fogType"] == "linear", result
            assert synthetic["canvasEngine"] == "PlayCanvas 2.22.1", result
            assert synthetic["canvasVersion"] == "2.22.1", result
            assert synthetic["canvasRect"]["width"] > 1 and synthetic["canvasRect"]["height"] > 1, result
            assert result["invalidFogRejected"] is True, result
            assert result["externalAssetRejected"] is True, result
            assert result["invalidAnimationRejected"] is True, result

            blacksmith = result["blacksmith"]
            assert blacksmith["available"] is True, result
            assert blacksmith["assetsPending"] == 0, result
            assert blacksmith["assetsLoaded"] == 1, result
            assert blacksmith["assetsFailed"] == 0, result
            assert blacksmith["assetErrors"] == [], result
            smith_bounds = blacksmith["assetBounds"].get("blacksmith")
            assert smith_bounds is not None, result
            assert all(value > 0 for value in smith_bounds["size"]), result
            assert max(smith_bounds["size"]) < 100, result

            echo = result["echo"]
            assert echo["available"] is True, result
            assert echo["stats"]["engine"] == "playcanvas", result
            assert echo["stats"]["backendVersion"] == "2", result
            assert echo["stats"]["worldId"] == "relay-rescue.echo-forge", result
            assert echo["stats"]["worldVersion"] == "pc-phase1-13", result
            assert echo["stats"]["state"] == "story.0", result
            assert echo["stats"]["cameraVariant"] == "portrait", result
            assert echo["stats"]["toneMapping"] == "aces2", result
            assert abs(echo["stats"]["exposure"] - 1.18) < 0.001, result
            assert echo["stats"]["fogType"] == "exp2", result
            assert echo["stats"]["assetEntityCount"] == 2, result
            assert echo["stats"]["assetsPending"] == 0, result
            assert echo["stats"]["assetsLoaded"] == 2, result
            assert echo["stats"]["assetsFailed"] == 0, result
            assert echo["stats"]["assetErrors"] == [], result
            assert "pip" in echo["stats"]["loadedAssetEntities"], result
            assert "forge" in echo["stats"]["loadedAssetEntities"], result
            forge_bounds = echo["stats"]["assetBounds"].get("forge")
            assert forge_bounds is not None and all(value > 0 for value in forge_bounds["size"]), result
            assert echo["stats"]["activeAnimations"].get("pip") == "idle", result
            assert echo["story5Stats"]["activeAnimations"].get("pip") == "wave", result
            assert echo["canvas"]["vibelearnEngine"] == "playcanvas", result
            assert echo["canvas"]["rect"]["width"] > 1 and echo["canvas"]["rect"]["height"] > 1, result

            page.evaluate("""() => {
              const proof=window.__vibelearnEchoAssetProof;
              proof?.echo?.dispose?.();proof?.echoHost?.remove?.();delete window.__vibelearnEchoAssetProof;
            }""")
            if errors:
                raise AssertionError(errors)
            print(json.dumps({
                "result": "passed",
                "engine": synthetic["engine"],
                "engine_version": synthetic["engineVersion"],
                "synthetic_world": synthetic["worldId"],
                "echo_world": echo["stats"]["worldId"],
                "echo_camera_variant": echo["stats"]["cameraVariant"],
                "echo_asset": {
                    "loaded": echo["stats"]["loadedAssetEntities"],
                    "story_0_animation": echo["stats"]["activeAnimations"].get("pip"),
                    "story_5_animation": echo["story5Stats"]["activeAnimations"].get("pip"),
                    "forge_bounds": forge_bounds,
                },
                "blacksmith_source_bounds": smith_bounds,
                "screenshots": [
                    "playcanvas-pip-story0-390.png",
                    "playcanvas-pip-story5-wave-390.png",
                ],
                "checks": [
                    "An unrelated engine-neutral WorldSpec compiled into the real PlayCanvas Engine.",
                    "Portable exposure, fog and camera tone-mapping intent compiled through the generic backend and invalid fog failed closed.",
                    "Unsafe external asset URLs and unknown semantic animation aliases fail closed before asset loading.",
                    "The pinned same-origin Pip GLB loaded through the generic container path with primitive fallback retained for failure.",
                    "Story state changed Pip from semantic idle to wave animation without exposing PlayCanvas track objects to the adapter.",
                    "Loaded idle and wave character/environment frames are preserved before assertions so visual regressions remain inspectable.",
                    "The pinned Blacksmith loads through the same generic AssetRef path and now realizes the semantic Forge with structural primitive fallback."
                ],
                "page_errors": errors
            }, indent=2))
        finally:
            context.close()
            browser.close()
            stop_server(proc)


if __name__ == "__main__":
    main()
